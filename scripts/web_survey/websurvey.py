#!/usr/bin/env python3
"""岩手県内サイトのSEO / AI検索対応度 一括実測（いわてデータ「Webサイト調査」）

標準ライブラリのみ。VPS（rocky@os3-306）で実行する前提。
政府・自治体のオープンデータから岩手県内事業所の公表URLを集め、各サイトのトップページを
beak-seo-aeo-checker と同じ判定ロジック（SEO15項目＋AI検索10項目）で採点し、SQLite に蓄積する。

  python3 scripts/web_survey/websurvey.py collect      # 母集団（URL）を集める
  python3 scripts/web_survey/websurvey.py audit        # 未診断のサイトを診断（中断しても続きから）
  python3 scripts/web_survey/websurvey.py export       # 集計CSVを raw/ に書き出す（事業者名は出さない）
  python3 scripts/web_survey/websurvey.py stats        # 件数の確認

DB（事業者名・URL入り）はリポジトリの外 ~/iwate-web-survey/survey.db に置く。コミットしない。
"""
import argparse
import concurrent.futures as cf
import csv
import gzip
import io
import json
import os
import re
import sqlite3
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from html.parser import HTMLParser

HOME = os.path.expanduser("~/iwate-web-survey")
DB_PATH = os.environ.get("WEBSURVEY_DB", os.path.join(HOME, "survey.db"))
CACHE = os.path.join(HOME, "cache")
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UA = "Mozilla/5.0 (compatible; IwateDataSurvey/1.0; +https://iwate-data.com/web/)"

# ---------------------------------------------------------------- 岩手33市町村
MUNIS = {
    "03201": "盛岡市", "03202": "宮古市", "03203": "大船渡市", "03205": "花巻市", "03206": "北上市",
    "03207": "久慈市", "03208": "遠野市", "03209": "一関市", "03210": "陸前高田市", "03211": "釜石市",
    "03213": "二戸市", "03214": "八幡平市", "03215": "奥州市", "03216": "滝沢市",
    "03301": "雫石町", "03302": "葛巻町", "03303": "岩手町", "03321": "紫波町", "03322": "矢巾町",
    "03366": "西和賀町", "03381": "金ケ崎町", "03402": "平泉町", "03441": "住田町", "03461": "大槌町",
    "03482": "山田町", "03483": "岩泉町", "03484": "田野畑村", "03485": "普代村", "03501": "軽米町",
    "03503": "野田村", "03506": "九戸村", "03507": "洋野町", "03524": "一戸町",
}
NAME2CODE = {}
for _c, _n in MUNIS.items():
    NAME2CODE[_n] = _c
    NAME2CODE[_n.replace("ケ", "ヶ")] = _c


def muni_code(text):
    """住所や市区町村名の文字列から JIS5 を返す（郡を飛ばし、ヶ/ケの揺れを吸収）。"""
    if not text:
        return ""
    t = text.strip().replace("岩手県", "", 1)
    t = re.sub(r"^\S+?郡", "", t)
    for name, code in NAME2CODE.items():
        if t.startswith(name):
            return code
    return ""


# ---------------------------------------------------------------- 対象外のホスト
SKIP_HOST = re.compile(
    r"(^|\.)(facebook\.com|instagram\.com|twitter\.com|x\.com|line\.me|lin\.ee|youtube\.com|youtu\.be|"
    r"tiktok\.com|ameblo\.jp|note\.com|goo\.ne\.jp|google\.com|google\.co\.jp|goo\.gl|bit\.ly|"
    r"go\.jp|lg\.jp|pref\.iwate\.jp|wam\.go\.jp|kaigokensaku\.mhlw\.go\.jp)$"
)
MUNI_HOST = re.compile(r"(^|\.)(city|town|vill)\.[a-z\-]+\.iwate\.jp$")
# パス単位で別サイトになるホスト（同一ホストでも別事業者）
PATH_HOSTS = {"sites.google.com"}


def site_key(url):
    """URL → (key, audit_url)。key はサイト単位の重複除去キー。対象外は None。"""
    u = (url or "").strip().replace("\u3000", "").replace(" ", "")
    if not u or u in ("-", "なし", "無"):
        return None
    u = u.replace("：", ":").replace("／", "/")
    if not re.match(r"^https?://", u, re.I):
        u = "http://" + u.lstrip("/")
    try:
        p = urllib.parse.urlsplit(u)
    except ValueError:
        return None
    host = (p.hostname or "").lower().rstrip(".")
    if "." not in host or re.match(r"^\d+\.\d+\.\d+\.\d+$", host):
        return None
    bare = host[4:] if host.startswith("www.") else host
    if bare not in PATH_HOSTS and (SKIP_HOST.search(host) or MUNI_HOST.search(host)):
        return None
    scheme = p.scheme.lower() if p.scheme.lower() in ("http", "https") else "http"
    if bare in PATH_HOSTS:
        segs = [s for s in p.path.split("/") if s][:2]
        path = "/" + "/".join(segs) + ("/" if segs else "")
        return bare + path, "%s://%s%s" % (scheme, host, path)
    return bare, "%s://%s/" % (scheme, host)


# ---------------------------------------------------------------- HTTP
_ctx = ssl.create_default_context()


def http_get(url, timeout=12, max_bytes=3_000_000):
    """(status, final_url, headers(dict lower), body bytes, ttfb_ms, error)"""
    req = urllib.request.Request(url, headers={
        "User-Agent": UA, "Accept": "text/html,*/*", "Accept-Encoding": "gzip"})
    t0 = time.time()
    try:
        res = urllib.request.urlopen(req, timeout=timeout, context=_ctx)
        status = res.status
    except urllib.error.HTTPError as e:
        res = e
        status = e.code
    except ssl.SSLError as e:
        return 0, url, {}, b"", 0, "ssl:" + str(e)[:80]
    except urllib.error.URLError as e:
        r = str(e.reason)
        kind = "ssl" if "SSL" in r or "CERTIFICATE" in r.upper() else "net"
        return 0, url, {}, b"", 0, kind + ":" + r[:80]
    except Exception as e:  # timeout 等
        return 0, url, {}, b"", 0, "net:" + type(e).__name__
    ttfb = int((time.time() - t0) * 1000)
    headers = {k.lower(): v for k, v in res.headers.items()}
    try:
        body = res.read(max_bytes)
    except Exception as e:
        return status, url, headers, b"", ttfb, "read:" + type(e).__name__
    if headers.get("content-encoding") == "gzip":
        try:
            body = gzip.decompress(body)
        except Exception:
            pass
    return status, res.geturl() or url, headers, body, ttfb, None


def decode_html(body, headers):
    cands = []
    m = re.search(r"charset=([\w\-]+)", headers.get("content-type", ""), re.I)
    if m:
        cands.append(m.group(1))
    m = re.search(rb"<meta[^>]+charset=[\"']?([\w\-]+)", body[:4096], re.I)
    if m:
        cands.append(m.group(1).decode("ascii", "ignore"))
    cands += ["utf-8", "cp932", "euc_jp"]
    for enc in cands:
        enc = enc.lower().replace("shift_jis", "cp932").replace("x-sjis", "cp932").replace("sjis", "cp932")
        try:
            return body.decode(enc)
        except (LookupError, UnicodeDecodeError):
            continue
    return body.decode("utf-8", "replace")


def looks_html(text):
    return text.lstrip()[:200].lower().startswith(("<!doctype", "<html", "<head", "<?xml version=\"1.0\"?><html")) or "<html" in text[:500].lower()


# ---------------------------------------------------------------- HTMLの簡易DOM
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Node(object):
    __slots__ = ("tag", "attrs", "children", "parent")

    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.children, self.parent = tag, attrs, [], parent

    def text(self):
        return "".join(_text_in_order(self))

    def get(self, k, default=None):
        return self.attrs.get(k, default)


def _text_in_order(node):
    stack = [iter(node.children)]
    while stack:
        for ch in stack[-1]:
            if isinstance(ch, str):
                yield ch
            else:
                stack.append(iter(ch.children))
                break
        else:
            stack.pop()


class Builder(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.root = Node("#root", {}, None)
        self.cur = self.root
        self.all = []

    def handle_starttag(self, tag, attrs):
        a = {}
        for k, v in attrs:
            if k not in a:
                a[k] = v if v is not None else ""
        n = Node(tag, a, self.cur)
        self.cur.children.append(n)
        self.all.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.cur.tag == tag:
            self.cur = self.cur.parent

    def handle_endtag(self, tag):
        n = self.cur
        while n is not None and n.tag != tag:
            n = n.parent
        if n is not None and n.parent is not None:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


class Doc(object):
    def __init__(self, html):
        b = Builder()
        try:
            b.feed(html)
            b.close()
        except Exception:
            pass
        self.root, self.all, self.html = b.root, b.all, html

    def find(self, *tags):
        ts = set(tags)
        return [n for n in self.all if n.tag in ts]

    def first(self, tag):
        for n in self.all:
            if n.tag == tag:
                return n
        return None

    def meta(self, attr, value):
        for n in self.all:
            if n.tag == "meta" and (n.get(attr) or "").lower() == value:
                return (n.get("content") or "")
        return None

    def body_text(self):
        b = self.first("body")
        return (b or self.root).text()


# ---------------------------------------------------------------- 判定（beak-seo-aeo-checker と同じ基準）
AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai", "Claude-Web",
           "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider"]
VAL = {"pass": 1.0, "warn": 0.5, "fail": 0.0}


def parse_robots(txt):
    blocks, agents, root, started = [], [], False, False
    for raw in re.split(r"\r?\n", txt):
        line = re.sub(r"#.*$", "", raw).strip()
        if not line:
            continue
        k, _, v = line.partition(":")
        key, val = k.lower().strip(), v.strip()
        if key == "user-agent":
            if started and agents:
                blocks.append((agents, root))
                agents, root = [], False
            agents.append(val)
            started = True
        elif key == "disallow" and val == "/":
            root = True
    if agents:
        blocks.append((agents, root))
    return blocks


def jsonld_types(doc):
    types = []
    for n in doc.all:
        if n.tag == "script" and (n.get("type") or "").lower() == "application/ld+json":
            try:
                data = json.loads(n.text())
            except Exception:
                continue
            stack = data if isinstance(data, list) else [data]
            while stack:
                x = stack.pop()
                if not isinstance(x, dict):
                    continue
                t = x.get("@type")
                if t:
                    for tt in (t if isinstance(t, list) else [t]):
                        if isinstance(tt, str) and tt not in types:
                            types.append(tt)
                g = x.get("@graph")
                if isinstance(g, list):
                    stack.extend(g)
    return types


def score(checks):
    s = [(w, VAL[st]) for (_id, st, w) in checks if st != "info"]
    d = sum(w for w, _ in s)
    return int(round(sum(w * v for w, v in s) / d * 100)) if d else 0


def run_checks(doc, site):
    seo, aeo = [], []
    final = site["final_url"]
    seo.append(("https", "pass" if final.startswith("https://") else "fail", 3))
    t = doc.first("title")
    title = (t.text() if t else "").strip()
    tl = len(title)
    seo.append(("title", "fail" if tl == 0 else "warn" if (tl < 15 or tl > 40) else "pass", 3))
    desc = (doc.meta("name", "description") or "").strip()
    dl = len(desc)
    seo.append(("description", "fail" if dl == 0 else "warn" if (dl < 50 or dl > 160) else "pass", 2))
    h1 = doc.find("h1")
    seo.append(("h1", "fail" if not h1 else "warn" if len(h1) > 1 else "pass", 2))
    hs = len(doc.find("h1", "h2", "h3", "h4", "h5", "h6"))
    seo.append(("heading-structure", "pass" if hs >= 3 else "warn" if hs >= 1 else "fail", 1))
    seo.append(("viewport", "pass" if doc.meta("name", "viewport") else "fail", 2))
    html_el = doc.first("html")
    seo.append(("lang", "pass" if (html_el is not None and html_el.get("lang")) else "warn", 1))
    canon = [n for n in doc.find("link") if (n.get("rel") or "").lower() == "canonical" and n.get("href")]
    seo.append(("canonical", "pass" if canon else "warn", 1))
    og = sum(1 for p in ("og:title", "og:image", "og:description") if doc.meta("property", p))
    seo.append(("ogp", "pass" if og >= 3 else "warn" if og >= 1 else "fail", 1))
    imgs = doc.find("img")
    alt = sum(1 for i in imgs if (i.get("alt") or "").strip())
    ratio = alt / len(imgs) if imgs else 1
    seo.append(("img-alt", "info" if not imgs else "pass" if ratio >= 0.8 else "warn" if ratio >= 0.4 else "fail", 1))
    origin = site["origin"]
    internal = 0
    for a in doc.find("a"):
        href = a.get("href")
        if href is None:
            continue
        if href.startswith("/") or href.startswith("#"):
            internal += 1
            continue
        try:
            j = urllib.parse.urlsplit(urllib.parse.urljoin(origin + "/", href))
            if "%s://%s" % (j.scheme, j.netloc) == origin:
                internal += 1
        except ValueError:
            pass
    seo.append(("internal-links", "pass" if internal >= 5 else "warn" if internal >= 1 else "fail", 1))
    body_text = doc.body_text()
    words = len(re.sub(r"\s", "", body_text))
    seo.append(("content-volume", "pass" if words >= 800 else "warn" if words >= 300 else "fail", 2))
    seo.append(("sitemap", "pass" if site["has_sitemap"] else "warn", 1))
    robots = site["robots"]
    rb = bool(robots) and re.search(r"Disallow:\s*/\s*$", robots, re.M) is not None and re.search(r"User-agent:\s*\*", robots, re.I) is not None
    seo.append(("robots", "warn" if not robots else "fail" if rb else "pass", 2))
    ttfb = site["ttfb_ms"]
    seo.append(("ttfb", "pass" if ttfb <= 800 else "warn" if ttfb <= 1800 else "fail", 1))

    types = jsonld_types(doc)
    aeo.append(("jsonld", "pass" if len(types) >= 2 else "warn" if len(types) == 1 else "fail", 3))
    rules = parse_robots(robots) if robots else []
    wild = any("*" in ag and r for ag, r in rules)
    blocked = [b for b in AI_BOTS if wild or any(r and any(a.lower() == b.lower() for a in ag) for ag, r in rules)]
    aeo.append(("ai-bots", "warn" if not robots else "pass" if not blocked else "fail" if len(blocked) >= len(AI_BOTS) else "warn", 3))
    faq_schema = "FAQPage" in types or "Question" in types
    qa = sum(1 for n in doc.find("h2", "h3", "h4", "dt", "summary")
             if re.search(r"[?？]|^q[\.:：]|よくある|とは$|ですか", n.text().strip()))
    aeo.append(("faq", "pass" if faq_schema else "warn" if qa >= 3 else "fail", 2))
    eeat = [k for k in ("運営者", "運営会社", "会社概要", "監修", "著者", "執筆", "プロフィール", "代表", "資格") if k in body_text]
    author = bool(doc.meta("name", "author")) or "Person" in types
    aeo.append(("eeat", "pass" if (len(eeat) >= 2 or author) else "warn" if len(eeat) == 1 else "fail", 2))
    aeo.append(("llms-txt", "pass" if site["has_llms"] else "warn", 1))
    p = doc.first("p")
    fp = (p.text() if p else "").strip()
    defin = re.search(r"とは[、,。\s]|です。|ます。", fp) is not None and len(fp) >= 30
    aeo.append(("answer-first", "pass" if defin else "warn" if len(fp) >= 20 else "fail", 1))
    lt = len(doc.find("ul", "ol")) + len(doc.find("table"))
    aeo.append(("structured-content", "pass" if lt >= 3 else "warn" if lt >= 1 else "fail", 1))
    date_hit = ("Article" in types or any(n.tag == "time" or "datetime" in n.attrs for n in doc.all)
                or re.search(r"更新日|公開日|\d{4}年\d{1,2}月", body_text) is not None)
    aeo.append(("freshness", "pass" if date_hit else "warn", 1))
    sem = [t for t in ("main", "article", "section", "nav", "header", "footer") if doc.first(t) is not None]
    aeo.append(("semantic-html", "pass" if len(sem) >= 4 else "warn" if len(sem) >= 2 else "fail", 1))
    bi = doc.html.lower().find("<body")
    body_html = doc.html[bi:] if bi >= 0 else doc.html
    tel = re.search(r"tel:|電話|0\d{1,3}[-(]\d", body_html) is not None
    addr = ("PostalAddress" in types or "LocalBusiness" in types
            or re.search(r"〒\d{3}-?\d{4}|住所", body_text) is not None)
    aeo.append(("nap", "pass" if (tel and addr) else "warn" if (tel or addr) else "fail", 1))

    s_seo, s_aeo = score(seo), score(aeo)
    overall = int(round((s_seo + s_aeo) / 2.0))
    grade = "S" if overall >= 90 else "A" if overall >= 75 else "B" if overall >= 60 else "C" if overall >= 40 else "D"
    checks = dict((i, st) for (i, st, _w) in seo + aeo)
    return {
        "seo": s_seo, "aeo": s_aeo, "overall": overall, "grade": grade, "checks": checks,
        "jsonld_types": types, "words": words, "title": title[:120], "ai_blocked": len(blocked),
    }


def detect_cms(html, headers):
    h = html[:200000]
    gen = re.search(r'<meta[^>]+name=["\']generator["\'][^>]+content=["\']([^"\']+)', h, re.I)
    g = (gen.group(1) if gen else "").lower()
    if "wp-content" in h or "wordpress" in g:
        return "wordpress"
    for k, pat in (("wix", r"wix\.com|wixstatic"), ("jimdo", r"jimdo"), ("studio", r"studio\.design|studio\.site"),
                   ("shopify", r"cdn\.shopify"), ("goope", r"goope\.jp"), ("peraichi", r"peraichi"),
                   ("ameba-ownd", r"amebaownd"), ("wordpress.com", r"wordpress\.com"), ("squarespace", r"squarespace"),
                   ("movabletype", r"movable ?type|mt-static"), ("nextjs", r"/_next/static")):
        if re.search(pat, h, re.I) or k in g:
            return k
    return "other"


def audit_one(url):
    status, final, headers, body, ttfb, err = http_get(url)
    if err and url.startswith("http://"):
        pass
    if err is None and status == 0:
        err = "net:unknown"
    rec = {"url": url, "status": status, "final_url": final, "ttfb_ms": ttfb, "error": err}
    if err or status >= 400 or not body:
        rec["error"] = err or ("http:%d" % status if status >= 400 else "empty")
        return rec
    html = decode_html(body, headers)
    pu = urllib.parse.urlsplit(final)
    origin = "%s://%s" % (pu.scheme, pu.netloc)

    def small(path, kind):
        s, f, h, b, _t, e = http_get(origin + path, timeout=8, max_bytes=500_000)
        if e or s != 200 or not b:
            return None
        txt = decode_html(b, h)
        if not txt.strip():
            return None
        if kind == "sitemap":
            return txt if re.search(r"<(urlset|sitemapindex)\b", txt[:5000]) else None
        if looks_html(txt):
            return None  # ソフト404（HTMLページが返る）は「なし」とみなす。Content-Type は誤設定が多いので見ない
        return txt

    robots = small("/robots.txt", "robots")
    site = {"final_url": final, "origin": origin, "ttfb_ms": ttfb, "robots": robots,
            "has_sitemap": small("/sitemap.xml", "sitemap") is not None,
            "has_llms": small("/llms.txt", "llms") is not None}
    if not site["has_sitemap"] and robots and re.search(r"(?im)^\s*sitemap:\s*\S+", robots):
        site["has_sitemap"] = True  # robots.txt で別名のサイトマップを宣言しているケース
    doc = Doc(html)
    r = run_checks(doc, site)
    rec.update(r)
    rec.update({"has_robots": bool(robots), "has_sitemap": site["has_sitemap"], "has_llms": site["has_llms"],
                "html_bytes": len(body), "cms": detect_cms(html, headers), "https": final.startswith("https://")})
    return rec


# ---------------------------------------------------------------- DB
SCHEMA = """
CREATE TABLE IF NOT EXISTS sites (
  key TEXT PRIMARY KEY,           -- ホスト（www除去）。sites.google.com 等はパス込み
  url TEXT NOT NULL,              -- 診断に使うURL（トップ）
  category TEXT NOT NULL,         -- 主分類（最初に見つかった公表元の業種）
  categories TEXT NOT NULL,       -- JSON配列：このサイトを公表URLにしている業種すべて
  muni TEXT,                      -- JIS5（最初に見つかった事業所の所在市町村）
  munis TEXT NOT NULL,            -- JSON配列
  offices INTEGER NOT NULL,       -- このURLを公表している県内事業所の数
  names TEXT NOT NULL,            -- JSON配列：事業所名（最大5件、非公開）
  sources TEXT NOT NULL,          -- JSON配列：iryou / kaigo / shofuku ...
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL REFERENCES sites(key),
  run TEXT NOT NULL,              -- 調査回（YYYY-MM）
  fetched_at TEXT NOT NULL,
  status INTEGER, final_url TEXT, error TEXT, ttfb_ms INTEGER, html_bytes INTEGER,
  https INTEGER, cms TEXT,
  seo INTEGER, aeo INTEGER, overall INTEGER, grade TEXT,
  has_robots INTEGER, has_sitemap INTEGER, has_llms INTEGER, ai_blocked INTEGER,
  jsonld_types TEXT, checks TEXT, words INTEGER, title TEXT,
  UNIQUE(key, run)
);
CREATE INDEX IF NOT EXISTS audits_run ON audits(run);
"""


def db():
    os.makedirs(HOME, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA)
    return con


# ---------------------------------------------------------------- 母集団の収集
def fetch_cached(url, name, timeout=120):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        with open(path, "rb") as f:
            return f.read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=_ctx) as r:
        data = r.read()
    with open(path, "wb") as f:
        f.write(data)
    return data


def text_of(b):
    for enc in ("utf-8-sig", "cp932"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    return b.decode("utf-8", "replace")


def rows_of(b):
    return list(csv.reader(io.StringIO(text_of(b))))


def col(header, *pats):
    for p in pats:
        for i, h in enumerate(header):
            if re.search(p, h.strip()):
                return i
    return -1


def page_links(url, pat):
    html = text_of(fetch_cached(url, "page_" + re.sub(r"\W", "_", url)[-60:] + ".html", 60))
    out = []
    for m in re.finditer(r'href="([^"]+)"', html):
        h = urllib.parse.urljoin(url, m.group(1))
        if re.search(pat, h) and h not in out:
            out.append(h)
    return out


def src_iryou():
    """医療情報ネット（e-Gov）。病院・診療所・歯科・助産所・薬局"""
    links = page_links("https://data.e-gov.go.jp/data/dataset/iryou_teikyouseido_mhlw", r"/download/e-gov\d{8}\.zip$")
    latest = sorted(links, key=lambda h: re.search(r"(\d{8})\.zip", h).group(1))[-1]
    stamp = re.search(r"(\d{8})\.zip", latest).group(1)
    z = zipfile.ZipFile(io.BytesIO(fetch_cached(latest, "iryou_%s.zip" % stamp, 600)))
    label = {"01-1": "病院", "02-1": "診療所", "03-1": "歯科診療所", "04_": "助産所", "05_": "薬局"}
    for name in z.namelist():
        cat = next((v for k, v in label.items() if name.startswith(k)), None)
        if not cat:
            continue
        rows = rows_of(z.read(name))
        h = rows[0]
        ip, iu = col(h, r"^都道府県コード$"), col(h, r"ホームページアドレス")
        ia, inm = col(h, r"^所在地$"), col(h, r"正式名称", r"名称")
        for r in rows[1:]:
            if len(r) <= max(ip, iu) or r[ip].strip().zfill(2) != "03":
                continue
            yield {"source": "iryou", "category": cat, "url": r[iu], "muni": muni_code(r[ia] if ia >= 0 else ""),
                   "name": r[inm] if inm >= 0 else ""}
    yield {"_asof": "iryou=" + stamp}


def src_kaigo():
    """介護サービス情報公表（厚労省オープンデータ）"""
    links = page_links("https://www.mhlw.go.jp/stf/kaigo-kouhyou_opendata.html", r"jigyosho_\d+_all_\d+\.csv$")
    day = max(re.search(r"_all_(\d{8})", h).group(1) for h in links)
    for h in [x for x in links if "_all_" + day in x]:
        rows = rows_of(fetch_cached(h, h.rsplit("/", 1)[-1], 300))
        hd = rows[0]
        ip, iu, im = col(hd, r"^都道府県名$"), col(hd, r"^URL$"), col(hd, r"^市区町村名$")
        isv, inm = col(hd, r"^サービスの種類$"), col(hd, r"^事業所名$")
        for r in rows[1:]:
            if len(r) <= max(ip, iu) or r[ip] != "岩手県":
                continue
            yield {"source": "kaigo", "category": "介護", "url": r[iu], "muni": muni_code(r[im]),
                   "name": r[inm], "service": r[isv]}
    yield {"_asof": "kaigo=" + day}


def src_shofuku():
    """障害福祉サービス等情報公表（WAM NET オープンデータ）"""
    links = page_links("https://www.wam.go.jp/content/wamnet/pcpub/top/sfkopendata/", r"sfkopendata_\d{6}_\d+\.zip$")
    ym = max(re.search(r"sfkopendata_(\d{6})_", h).group(1) for h in links)
    for h in [x for x in links if "sfkopendata_%s_" % ym in x]:
        z = zipfile.ZipFile(io.BytesIO(fetch_cached(h, h.rsplit("/", 1)[-1], 300)))
        for name in z.namelist():
            rows = rows_of(z.read(name))
            hd = rows[0]
            ia, iu, icu = col(hd, r"^事業所住所（市区町村）$"), col(hd, r"^事業所URL$"), col(hd, r"^法人URL$")
            inm = col(hd, r"^事業所の名称$")
            for r in rows[1:]:
                if len(r) <= max(ia, iu) or not r[ia].startswith("岩手県"):
                    continue
                url = r[iu].strip() or (r[icu].strip() if icu >= 0 else "")
                yield {"source": "shofuku", "category": "障害福祉", "url": url, "muni": muni_code(r[ia]),
                       "name": r[inm] if inm >= 0 else ""}
    yield {"_asof": "shofuku=" + ym}


JSIC = {"A": "農林業", "B": "漁業", "C": "鉱業", "D": "建設業", "E": "製造業", "F": "電気・ガス・水道", "G": "情報通信業",
        "H": "運輸業", "I": "卸売・小売業", "J": "金融・保険業", "K": "不動産業", "L": "専門・技術サービス業",
        "M": "宿泊・飲食サービス業", "N": "生活関連サービス業", "O": "教育・学習支援業", "P": "医療・福祉（法人）",
        "Q": "複合サービス事業", "R": "その他のサービス業", "S": "公務", "T": "分類不能"}


def src_gbiz():
    """gBizINFO 法人基本情報（経産省）の「WebサイトURL」。岩手県内の現存法人のうちURL登録があるもの。
    一括DLにはアクセストークンが要るため、ブラウザで抽出した「ホスト 市町村コード 業種大分類」の
    一覧（~/iwate-web-survey/extra_gbiz.txt、1行1社）を読む。"""
    path = os.path.join(HOME, "extra_gbiz.txt")
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.split()
            if len(parts) < 3 or "." not in parts[0]:
                continue
            host, code, ind = parts[0], parts[1], parts[2]
            yield {"source": "gbiz", "category": JSIC.get(ind, "その他の法人"), "url": "http://" + host + "/",
                   "muni": code if code in MUNIS else "", "name": ""}
    yield {"_asof": "gbiz=" + datetime.fromtimestamp(os.path.getmtime(path), timezone.utc).strftime("%Y%m%d")}


SOURCES = {"iryou": src_iryou, "kaigo": src_kaigo, "shofuku": src_shofuku, "gbiz": src_gbiz}


def cmd_collect(args):
    con = db()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    agg, asof, seen_rows = {}, [], {}
    for sname in args.sources.split(","):
        n = with_url = 0
        for rec in SOURCES[sname]():
            if "_asof" in rec:
                asof.append(rec["_asof"])
                continue
            n += 1
            sk = site_key(rec["url"])
            if not sk:
                continue
            with_url += 1
            key, url = sk
            a = agg.setdefault(key, {"url": url, "cats": [], "munis": [], "names": [], "sources": [], "offices": 0})
            a["offices"] += 1
            for fld, v in (("cats", rec["category"]), ("munis", rec["muni"]), ("names", rec["name"]), ("sources", rec["source"])):
                if v and v not in a[fld]:
                    a[fld].append(v)
        seen_rows[sname] = (n, with_url)
        print("%-8s 県内事業所 %5d件 / 対象URLあり %5d件" % (sname, n, with_url), flush=True)
    for key, a in agg.items():
        row = con.execute("SELECT first_seen FROM sites WHERE key=?", (key,)).fetchone()
        con.execute(
            "INSERT OR REPLACE INTO sites(key,url,category,categories,muni,munis,offices,names,sources,first_seen,last_seen)"
            " VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            (key, a["url"], a["cats"][0], json.dumps(a["cats"], ensure_ascii=False), (a["munis"] or [""])[0],
             json.dumps(a["munis"]), a["offices"], json.dumps(a["names"][:5], ensure_ascii=False),
             json.dumps(a["sources"]), row[0] if row else now, now))
    con.commit()
    with open(os.path.join(HOME, "asof.json"), "w") as f:
        json.dump({"collected": now, "sources": asof, "rows": seen_rows}, f, ensure_ascii=False)
    print("サイト（重複除去後）: %d件  時点: %s" % (len(agg), ", ".join(asof)))


def cmd_audit(args):
    con = db()
    run = args.run or datetime.now(timezone.utc).strftime("%Y-%m")
    if args.redo:
        con.execute("DELETE FROM audits WHERE run=?", (run,))
        con.commit()
    todo = con.execute(
        "SELECT key,url FROM sites WHERE key NOT IN (SELECT key FROM audits WHERE run=?) ORDER BY key", (run,)).fetchall()
    if args.limit:
        todo = todo[:args.limit]
    print("調査回 %s：未診断 %d件を %d並列で診断" % (run, len(todo), args.workers), flush=True)

    def work(item):
        key, url = item
        # 診断ツールにドメインだけ入れた時と同じく https を先に試し、取れなければ http
        rest = re.sub(r"^https?://", "", url)
        rec = audit_one("https://" + rest)
        if rec.get("error"):
            alt = audit_one("http://" + rest)
            if not alt.get("error"):
                rec = alt
        return key, rec

    done = ok = 0
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for key, r in ex.map(work, todo):
            done += 1
            ok += 0 if r.get("error") else 1
            con.execute(
                "INSERT OR REPLACE INTO audits(key,run,fetched_at,status,final_url,error,ttfb_ms,html_bytes,https,cms,"
                "seo,aeo,overall,grade,has_robots,has_sitemap,has_llms,ai_blocked,jsonld_types,checks,words,title)"
                " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (key, run, datetime.now(timezone.utc).isoformat(timespec="seconds"), r.get("status"), r.get("final_url"),
                 r.get("error"), r.get("ttfb_ms"), r.get("html_bytes"), int(bool(r.get("https"))), r.get("cms"),
                 r.get("seo"), r.get("aeo"), r.get("overall"), r.get("grade"),
                 int(bool(r.get("has_robots"))), int(bool(r.get("has_sitemap"))), int(bool(r.get("has_llms"))),
                 r.get("ai_blocked"), json.dumps(r.get("jsonld_types") or []),
                 json.dumps(r.get("checks") or {}), r.get("words"), r.get("title")))
            if done % 25 == 0 or done == len(todo):
                con.commit()
                print("  %d/%d（取得成功 %d） %.0f秒" % (done, len(todo), ok, time.time() - t0), flush=True)
    con.commit()


# ---------------------------------------------------------------- 集計（公開用・事業者名なし）
CHECK_IDS = ["https", "title", "description", "h1", "heading-structure", "viewport", "lang", "canonical", "ogp",
             "img-alt", "internal-links", "content-volume", "sitemap", "robots", "ttfb",
             "jsonld", "ai-bots", "faq", "eeat", "llms-txt", "answer-first", "structured-content", "freshness",
             "semantic-html", "nap"]


def cmd_export(args):
    con = db()
    run = args.run or con.execute("SELECT max(run) FROM audits").fetchone()[0]
    rows = con.execute(
        "SELECT s.category, s.muni, a.error, a.seo, a.aeo, a.overall, a.grade, a.https, a.cms, a.checks, a.ai_blocked "
        "FROM audits a JOIN sites s ON s.key=a.key WHERE a.run=?", (run,)).fetchall()
    groups = {}
    for cat, muni, err, seo, aeo, ov, gr, https, cms, checks, aib in rows:
        for g in ((cat, muni or "00000"), (cat, "03000"), ("全業種", muni or "00000"), ("全業種", "03000")):
            groups.setdefault(g, []).append((err, seo, aeo, ov, gr, https, cms, json.loads(checks or "{}"), aib))
    out = os.path.join(REPO, "raw", "web_survey.csv")
    hdr = ["run", "category", "code", "sites", "audited", "avg_overall", "avg_seo", "avg_aeo",
           "grade_S", "grade_A", "grade_B", "grade_C", "grade_D", "seo_high_aeo_low", "wordpress"] + \
          ["pass_" + c for c in CHECK_IDS] + ["ai_bots_blocked"]
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        for (cat, code), items in sorted(groups.items()):
            okr = [x for x in items if not x[0]]
            n = len(okr)
            avg = lambda i: ("%.1f" % (sum(x[i] for x in okr) / n)) if n else ""
            grades = [sum(1 for x in okr if x[4] == g) for g in "SABCD"]
            gap = sum(1 for x in okr if x[1] >= 60 and x[2] < 60)
            wp = sum(1 for x in okr if x[6] == "wordpress")
            passes = [sum(1 for x in okr if x[7].get(c) == "pass") for c in CHECK_IDS]
            blocked = sum(1 for x in okr if (x[8] or 0) > 0)
            w.writerow([run, cat, code, len(items), n, avg(3), avg(1), avg(2)] + grades + [gap, wp] + passes + [blocked])
    meta = {"run": run}
    p = os.path.join(HOME, "asof.json")
    if os.path.exists(p):
        meta.update(json.load(open(p)))
    meta["sites"] = len(rows)
    meta["audited"] = sum(1 for r in rows if not r[2])
    with open(os.path.join(REPO, "raw", "web_survey_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print("書き出し: %s（%d行）  対象 %d件 / 取得成功 %d件" % (out, len(groups), meta["sites"], meta["audited"]))


def cmd_stats(args):
    con = db()
    print("sites:", con.execute("SELECT count(*) FROM sites").fetchone()[0])
    for r in con.execute("SELECT category,count(*) FROM sites GROUP BY 1 ORDER BY 2 DESC"):
        print("  ", *r)
    for r in con.execute("SELECT run,count(*),sum(error IS NULL),round(avg(overall),1),round(avg(seo),1),round(avg(aeo),1) "
                         "FROM audits GROUP BY run"):
        print("audits run=%s 件数=%s 取得成功=%s 平均 総合=%s SEO=%s AI=%s" % r)
    for r in con.execute("SELECT substr(error,1,instr(error||':',':')-1) k,count(*) FROM audits WHERE error IS NOT NULL GROUP BY k"):
        print("  error", *r)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd")
    c = sub.add_parser("collect")
    c.add_argument("--sources", default="iryou,kaigo,shofuku,gbiz")
    a = sub.add_parser("audit")
    a.add_argument("--run")
    a.add_argument("--workers", type=int, default=12)
    a.add_argument("--limit", type=int, default=0)
    a.add_argument("--redo", action="store_true", help="この調査回の結果を消して全件やり直す")
    e = sub.add_parser("export")
    e.add_argument("--run")
    sub.add_parser("stats")
    t = sub.add_parser("one")
    t.add_argument("url")
    args = ap.parse_args()
    if args.cmd == "collect":
        cmd_collect(args)
    elif args.cmd == "audit":
        cmd_audit(args)
    elif args.cmd == "export":
        cmd_export(args)
    elif args.cmd == "stats":
        cmd_stats(args)
    elif args.cmd == "one":
        print(json.dumps(audit_one(args.url), ensure_ascii=False, indent=1))
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
