#!/usr/bin/env python3
"""e-Stat API (社会・人口統計体系) から岩手県33市町村＋県の原データを取得し raw/ssds/{family}.csv に書く。

    ESTAT_APP_ID=xxxx python3 scripts/fetch_estat.py            # 10系列すべて
    ESTAT_APP_ID=xxxx python3 scripts/fetch_estat.py vital farm  # 一部だけ
    ESTAT_APP_ID=xxxx python3 scripts/fetch_estat.py --check     # 書かずに差分だけ報告

appId は環境変数からのみ読む。リポジトリ・ログ・URL に残さないこと（HANDOFF.md ルール10）。
出力は決定的（同じ API 応答なら同じバイト列）。build_data.py が floor 年以降だけを使うので、ここでも floor 年以降だけ書く。
終了コード: 0=変更なし / 3=raw が変わった / 1=エラー。update.sh はこのコードで後段（build・deploy）を分岐する。
"""
import csv, io, json, os, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'raw', 'ssds')
API = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData'
PREF = '03000'
# 現行33市町村 + 合併前（滝沢村03305→滝沢市03216、藤沢町03422→一関市、川井村03487→宮古市）。build_data.py の LEGACY で合算する
MUNI33 = ['03201','03202','03203','03205','03206','03207','03208','03209','03210','03211','03213','03214','03215','03216',
          '03301','03302','03303','03321','03322','03366','03381','03402','03441','03461','03482','03483','03484','03485',
          '03501','03503','03506','03507','03524']
AREAS = MUNI33 + ['03305', '03422', '03487']

# 市区町村データ 00000201xx。県値は同じ体系の都道府県データ 00000101xx（'000002'→'000001'）から area 03000 で取る。
# 列の値が [(code, from, to), ...] のものは年で指標コードが切り替わる（福祉は2018年に詳細票→基本票）。
MANIFEST = {
    'vital':     ('0000020101', 2010, {'births': 'A4101', 'deaths': 'A4200', 'marriages': 'A9101', 'divorces': 'A9201', 'in_migr': 'A5103', 'out_migr': 'A5104'}),
    'household': ('0000020101', 2010, {'pop75': 'A1419', 'foreign': 'A1700', 'did_pop': 'A1801', 'households': 'A7101', 'general_hh': 'A710101',
                                       'nuclear_hh': 'A810102', 'single_hh': 'A810105', 'eld_couple_hh': 'A8201', 'eld_single_hh': 'A8301'}),
    'medical':   ('0000020109', 2010, {'hospitals': 'I5101', 'gen_hospitals': 'I510120', 'clinics': 'I5102', 'dental_clinics': 'I5103', 'hosp_beds': 'I5211',
                                       'clinic_beds': 'I5212', 'doctors': 'I6100', 'dentists': 'I6200', 'pharmacists': 'I6300'}),
    'welfare':   ('0000020110', 2010, {'tokuyo': [('J230121', 0, 2017), ('J230127', 2018, 9999)], 'tokuyo_cap': [('J230124', 0, 2017), ('J230128', 2018, 9999)],
                                       'yuryo': [('J230221', 0, 2017), ('J230421', 2018, 9999)], 'yuryo_cap': [('J230222', 0, 2017), ('J230422', 2018, 9999)],
                                       'kokuho': 'J4101'}),
    'env':       ('0000020108', 2010, {'gomi_collect_pop': 'H5608', 'gomi_total': 'H5609', 'gomi_per_day': 'H5610', 'recycle_rate': 'H5614', 'landfill': 'H5615',
                                       'flush_rate': 'H5508', 'nonflush_pop': 'H550701'}),
    'economy':   ('0000020103', 2010, {'taxable_income': 'C120110', 'taxpayers': 'C120120', 'farmland': 'C3107', 'mfg_shipment': 'C3401', 'mfg_estab': 'C3403', 'mfg_workers': 'C3404'}),
    'school':    ('0000020105', 2010, {'kg': 'E1101', 'kg_pupils': 'E1501', 'es': 'E2101', 'es_teachers': 'E2401', 'es_pupils': 'E2501', 'jhs': 'E3101',
                                       'jhs_teachers': 'E3401', 'jhs_students': 'E3501', 'hs': 'E4101', 'hs_students': 'E4501'}),
    'jobless':   ('0000020106', 2010, {'labor': 'F1101', 'workers': 'F1102', 'jobless': 'F1107', 'workers65': 'F2116'}),
    'education': ('0000020105', 2010, {'grad_total': 'E9101', 'grad_jhs': 'E9102', 'grad_hs': 'E9103', 'grad_col': 'E9105', 'grad_univ': 'E9106'}),
    'farm':      ('0000020103', 2009, {'sales_farms': 'C310201', 'self_farms': 'C310202', 'full_farms': 'C310211', 'part_farms': 'C310212', 'abandoned': 'C3109'}),
}


def app_id():
    k = os.environ.get('ESTAT_APP_ID', '').strip()
    if not k:
        sys.exit('ESTAT_APP_ID が未設定（環境変数で渡す。ファイルに書かない）')
    return k


def api(params, tries=4):
    q = dict(params, appId=app_id(), lang='J', metaGetFlg='N', cntGetFlg='N', limit=100000)
    url = API + '?' + urllib.parse.urlencode(q)
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                j = json.load(r)
            res = j['GET_STATS_DATA']['RESULT']
            if res['STATUS'] != 0:
                raise RuntimeError(f"e-Stat STATUS {res['STATUS']}: {res.get('ERROR_MSG')}")
            return j['GET_STATS_DATA']['STATISTICAL_DATA']
        except Exception as e:  # noqa: BLE001 — 通信エラーは待って再試行、最後は投げる
            if i == tries - 1:
                raise
            print(f'  retry {i + 1}: {type(e).__name__}', file=sys.stderr)
            time.sleep(5 * (i + 1))


def values(stats_id, cats, area):
    """全レコードを (area, year, cat01) → 生文字列 で返す。10万件超は NEXT_KEY で続きを取る。"""
    out, start = {}, 1
    while True:
        sd = api({'statsDataId': stats_id, 'cdCat01': ','.join(cats), 'cdArea': area, 'startPosition': start})
        d = sd.get('DATA_INF') or {}
        vals = d.get('VALUE') or []
        if isinstance(vals, dict):
            vals = [vals]
        for v in vals:
            out[(v['@area'], int(v['@time'][:4]), v['@cat01'])] = v['$']
        nk = (sd.get('RESULT_INF') or {}).get('NEXT_KEY')
        if not nk:
            return out
        start = int(nk)


def pick(spec, year):
    if isinstance(spec, str):
        return spec
    for code, lo, hi in spec:
        if lo <= year <= hi:
            return code
    return None


def fmt(raw):
    """API の値 → CSV セル。数値でないもの（- *** X …）は空欄。数値は API の文字列をそのまま（"7.0" は "7.0" のまま）"""
    s = str(raw).strip()
    try:
        n = float(s)
    except ValueError:
        return ''
    if n != n or n in (float('inf'), float('-inf')):
        return ''
    return s


def fetch_family(fam):
    stats_id, floor, cols = MANIFEST[fam]
    cats = sorted({c for v in cols.values() for c in ([v] if isinstance(v, str) else [x[0] for x in v])})
    raw = values(stats_id, cats, ','.join(AREAS))
    raw.update(values(stats_id.replace('000002', '000001'), cats, PREF))
    rows = {}
    for (code, year, cat), s in raw.items():
        if year < floor:
            continue
        for col, spec in cols.items():
            if pick(spec, year) == cat:
                cell = fmt(s)
                if cell != '':
                    rows.setdefault((code, year), {})[col] = cell
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator='\n')
    w.writerow(['code', 'year'] + list(cols))
    for (code, year) in sorted(rows):
        w.writerow([code, year] + [rows[(code, year)].get(c, '') for c in cols])
    return buf.getvalue()


def main(argv):
    check = '--check' in argv
    fams = [a for a in argv if not a.startswith('--')] or list(MANIFEST)
    changed = []
    os.makedirs(OUT_DIR, exist_ok=True)
    for fam in fams:
        path = os.path.join(OUT_DIR, fam + '.csv')
        new = fetch_family(fam)
        old = open(path, encoding='utf-8').read() if os.path.exists(path) else ''
        n_rows = new.count('\n') - 1
        years = sorted({int(l.split(',')[1]) for l in new.splitlines()[1:]})
        if new == old:
            print(f'  {fam:9s} unchanged  rows={n_rows} years={years[0]}-{years[-1]}')
            continue
        changed.append(fam)
        old_rows = set(old.splitlines()[1:])
        added = [l for l in new.splitlines()[1:] if l not in old_rows]
        print(f'  {fam:9s} CHANGED    rows={n_rows} years={years[0]}-{years[-1]} new/changed rows={len(added)} (e.g. {added[0][:60] if added else "-"})')
        if not check:
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(new)
    if changed:
        print('changed:', ' '.join(changed))
        return 3
    print('no change')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
