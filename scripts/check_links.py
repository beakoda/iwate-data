#!/usr/bin/env python3
"""out/ の内部リンクが実在するかを検査する。壊れたリンクが1本でもあれば exit 1。

  npm run build && python3 scripts/check_links.py

sitemap に載っていなくても内部リンクは検索エンジンとAIクローラーが辿るので、
404 を出したままにしない。過去に /industry/<市町村スラッグ>/ という
産業スラッグの位置に市町村スラッグを入れたリンクが72本残っていた。
"""
import os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
SKIP_EXT = ('.csv', '.xml', '.txt', '.ico', '.png', '.svg', '.json', '.webmanifest')


def exists(href):
    t = os.path.join(OUT, href.lstrip('/'))
    if os.path.isdir(t) and os.path.exists(os.path.join(t, 'index.html')):
        return True
    return os.path.exists(t) or os.path.exists(t.rstrip('/') + '.html')


def main():
    if not os.path.isdir(OUT):
        print('out/ が無い。先に npm run build を回すこと'); return 1
    bad = collections.defaultdict(set)
    pages = 0
    for dirpath, _dirs, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'):
                continue
            pages += 1
            p = os.path.join(dirpath, fn)
            with open(p, encoding='utf-8') as f:
                html = f.read()
            for href in set(re.findall(r'href="(/[^"#?]*)"', html)):
                if href.startswith('/_next') or href.endswith(SKIP_EXT):
                    continue
                if not exists(href):
                    bad[href].add(os.path.relpath(p, OUT))
    # sitemap の全URLも実体があるか
    sm = os.path.join(OUT, 'sitemap.xml')
    missing_sm = []
    if os.path.exists(sm):
        with open(sm, encoding='utf-8') as f:
            locs = re.findall(r'<loc>https?://[^/]+(/[^<]*)</loc>', f.read())
        missing_sm = [l for l in locs if l != '/' and not exists(l)]
        print(f'sitemap: {len(locs)}件 / 実体なし {len(missing_sm)}件')
    print(f'HTML {pages}ページを検査 / リンク切れ {len(bad)}種')
    for href, srcs in sorted(bad.items())[:30]:
        print(f'  NG {href}  ← {sorted(srcs)[0]} ほか{len(srcs) - 1}ページ')
    return 1 if (bad or missing_sm) else 0


if __name__ == '__main__':
    sys.exit(main())
