#!/usr/bin/env python3
"""raw/*.csv → data/dataset.json  (iwate-data)
すべての数値は raw CSV（e-Stat由来）からのみ生成する。推定・補完はしない。
"""
import csv, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'raw')
OUT = os.path.join(ROOT, 'data', 'dataset.json')

MUNI = [  # code, name, slug, kind, gun
 ('03201','盛岡市','morioka','市',''),('03202','宮古市','miyako','市',''),('03203','大船渡市','ofunato','市',''),
 ('03205','花巻市','hanamaki','市',''),('03206','北上市','kitakami','市',''),('03207','久慈市','kuji','市',''),
 ('03208','遠野市','tono','市',''),('03209','一関市','ichinoseki','市',''),('03210','陸前高田市','rikuzentakata','市',''),
 ('03211','釜石市','kamaishi','市',''),('03213','二戸市','ninohe','市',''),('03214','八幡平市','hachimantai','市',''),
 ('03215','奥州市','oshu','市',''),('03216','滝沢市','takizawa','市',''),
 ('03301','雫石町','shizukuishi','町','岩手郡'),('03302','葛巻町','kuzumaki','町','岩手郡'),('03303','岩手町','iwate-town','町','岩手郡'),
 ('03321','紫波町','shiwa','町','紫波郡'),('03322','矢巾町','yahaba','町','紫波郡'),('03366','西和賀町','nishiwaga','町','和賀郡'),
 ('03381','金ケ崎町','kanegasaki','町','胆沢郡'),('03402','平泉町','hiraizumi','町','西磐井郡'),('03441','住田町','sumita','町','気仙郡'),
 ('03461','大槌町','otsuchi','町','上閉伊郡'),('03482','山田町','yamada','町','下閉伊郡'),('03483','岩泉町','iwaizumi','町','下閉伊郡'),
 ('03484','田野畑村','tanohata','村','下閉伊郡'),('03485','普代村','fudai','村','下閉伊郡'),('03501','軽米町','karumai','町','九戸郡'),
 ('03503','野田村','noda','村','九戸郡'),('03506','九戸村','kunohe','村','九戸郡'),('03507','洋野町','hirono','町','九戸郡'),
 ('03524','一戸町','ichinohe','町','二戸郡'),
]
# 旧自治体（医療施設調査 2009-2013 に出現）→ 現行コードへの対応（合併・市制）
LEGACY = {'03305':'03216',  # 滝沢村→滝沢市(2014)
          '03422':'03209',  # 藤沢町→一関市(2011) ※2009-2010のみ
          '03487':'03202'}  # 川井村→宮古市(2010) ※2009のみ
PREF = '03000'

IND = [  # 産業大分類（日本標準産業分類）
 ('AR','全産業（公務を除く）','all'),('AB','農林漁業','agriculture-fishery'),
 ('C','鉱業，採石業，砂利採取業','mining'),('D','建設業','construction'),('E','製造業','manufacturing'),
 ('F','電気・ガス・熱供給・水道業','utilities'),('G','情報通信業','ict'),('H','運輸業，郵便業','transport'),
 ('I','卸売業，小売業','retail'),('J','金融業，保険業','finance'),('K','不動産業，物品賃貸業','realestate'),
 ('L','学術研究，専門・技術サービス業','professional'),('M','宿泊業，飲食サービス業','hospitality'),
 ('N','生活関連サービス業，娯楽業','lifestyle'),('O','教育，学習支援業','education'),('P','医療，福祉','medical'),
 ('Q','複合サービス事業','compound'),('R','サービス業（他に分類されないもの）','services'),
]

# 国勢調査の産業大分類（A〜S）→ サイト内の産業スラッグ対応。A+B は経済センサス側に合わせて AB に合算。
CENSUS_IND = [('wA','A','農業，林業'),('wB','B','漁業'),('wC','C','鉱業，採石業，砂利採取業'),('wD','D','建設業'),
 ('wE','E','製造業'),('wF','F','電気・ガス・熱供給・水道業'),('wG','G','情報通信業'),('wH','H','運輸業，郵便業'),
 ('wI','I','卸売業，小売業'),('wJ','J','金融業，保険業'),('wK','K','不動産業，物品賃貸業'),
 ('wL','L','学術研究，専門・技術サービス業'),('wM','M','宿泊業，飲食サービス業'),('wN','N','生活関連サービス業，娯楽業'),
 ('wO','O','教育，学習支援業'),('wP','P','医療，福祉'),('wQ','Q','複合サービス事業'),
 ('wR','R','サービス業（他に分類されないもの）'),('wS','S','公務（他に分類されるものを除く）'),
 ('wT','T','分類不能の産業')]
CENSUS_YEARS = [2010, 2015, 2020]
# 2010年は第1面のみ（合算できる項目に限定）。2005年以前は平成の大合併前で対応表が必要なため未取込。
CENSUS_FULL_YEARS = [2015, 2020]

SOURCES = {
 'dental': {'name':'厚生労働省「医療施設調査」二次医療圏・市区町村編 第２表（一般診療所数；歯科診療所数；病床数，病床の有無・二次医療圏・市区町村別）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00450021&tstat=000001030908', 'note':'各年10月1日現在。2009〜2024年。e-Stat 掲載CSVより集計。'},
 'population': {'name':'総務省「住民基本台帳に基づく人口、人口動態及び世帯数調査」市区町村別（総計）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200241', 'note':'各年1月1日現在の人口・世帯数。出生・死亡・転入・転出は前年1年間。2013〜2026年。'},
 'econ2021': {'name':'総務省・経済産業省「令和3年経済センサス‐活動調査」事業所に関する集計 産業横断的集計 第4-1表（産業大分類、単独・本所・支所別民営事業所数、従業者数及び売上（収入）金額－市区町村）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200553&year=20210', 'note':'2021年6月1日現在。売上（収入）金額は外国の会社及び法人でない団体を除く。「X」は秘匿、「-」は該当なし、「...」は非公表。'},
 'econ2016': {'name':'総務省・経済産業省「平成28年経済センサス‐活動調査」事業所に関する集計 産業横断的集計 第8表（産業別民営事業所数・従業者数－都道府県、市区町村）岩手県', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200553&year=20160', 'note':'2016年6月1日現在。'},
    'census': {'name':'総務省統計局「国勢調査」都道府県・市区町村別の主な結果（第１面事項・第２面事項）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200521&tstat=000001049104&tclass1=000001049105', 'note':'各回10月1日現在。2015年（平成27年）・2020年（令和2年）。2020年の年齢・就業関係の数値は不詳補完結果。「-」は該当者なし。'},
}

def num(v):
    v = (v or '').strip()
    if v in ('', '-', '...', 'X', '…'): return None
    try: return int(v.replace(',', ''))
    except ValueError: return None

def load_csvs(*names):
    rows = []
    for n in names:
        with open(os.path.join(RAW, n), encoding='utf-8') as f:
            rows += list(csv.DictReader(f))
    return rows

def load_census():
    out = {}
    for y in CENSUS_YEARS:
        rec = {}
        parts = ('p1', 'p2') if y in CENSUS_FULL_YEARS else ('p1',)
        for part in parts:
            for r in load_csvs(f'census_{y}_{part}.csv'):
                code = r['code'] if r['code'] == PREF else LEGACY.get(r['code'], r['code'])
                d = rec.setdefault(code, {})
                merged = code != r['code']
                for k, v in r.items():
                    if k in ('code', 'name'): continue
                    fl = k in ('area_km2', 'density', 'avg_age', 'median_age', 'labor_rate', 'dn_ratio')
                    val = (float(v) if v.strip() not in ('', '-', '...', 'X') else None) if fl else num(v)
                    if code in rec and k in d and d[k] is not None and val is not None and k in ('total','male','female','age_0_14','age_15_64','age_65_','area_km2'):
                        d[k] = d[k] + val   # 合併前自治体を合算（2010年の藤沢町→一関市など）
                    elif k not in d or d[k] is None:
                        d[k] = val
                if merged:
                    rec[code].setdefault('_merged', []).append(r.get('name', r['code']))
        out[str(y)] = rec
    return out

def build():
    codes = {m[0] for m in MUNI}
    # ---- dental / general clinics
    dental = {c: {} for c in codes | {PREF}}
    for r in load_csvs('dental_2009_2016.csv', 'dental_2017_2024.csv'):
        code = r['code'].strip(); y = int(r['year'])
        if code == '03': code = PREF
        code = LEGACY.get(code, code)
        if code not in dental: continue
        rec = dental[code].setdefault(y, {'dent':0,'gen':0,'gen_beds':0,'gen_with_beds':0,'merged':[]})
        # 合併前自治体は現行自治体に加算（LEGACY）
        for k, col in (('dent','dent_total'),('gen','gen_total'),('gen_beds','gen_beds'),('gen_with_beds','gen_with_beds')):
            v = num(r[col]); rec[k] += (v or 0)
        if r['code'].strip() in LEGACY: rec['merged'].append(r['name'])
    # ---- population
    pop = {c: {} for c in codes | {PREF}}
    for r in load_csvs('population_2013_2026.csv'):
        code = LEGACY.get(r['code'], r['code']); y = int(r['year'])
        if code not in pop: continue
        rec = pop[code].setdefault(y, {'total':0,'households':0,'births':0,'deaths':0,'in':0,'out':0})
        for k, col in (('total','total'),('households','households'),('births','births'),('deaths','deaths'),('in','in_total'),('out','out_total')):
            rec[k] += num(r[col]) or 0
    # ---- econ census
    econ = {c: {} for c in codes | {PREF}}
    for r in load_csvs('econ_census_2021_major.csv'):
        econ[r['code']].setdefault(r['ind'], {})['2021'] = {'estab':num(r['estab']),'workers':num(r['workers']),'sales':num(r['sales_mil']), 'sales_raw':r['sales_mil']}
    for r in load_csvs('econ_census_2016_major.csv'):
        econ[r['code']].setdefault(r['ind'], {})['2016'] = {'estab':num(r['estab']),'workers':num(r['workers'])}

    munis = [{'code':c,'name':n,'slug':s,'kind':k,'gun':g} for c,n,s,k,g in MUNI]
    ds = {
        'generated': __import__('datetime').date.today().isoformat(),
        'pref': {'code':PREF,'name':'岩手県'},
        'municipalities': munis,
        'industries': [{'code':c,'name':n,'slug':s} for c,n,s in IND],
        'sources': SOURCES,
        'legacy': LEGACY,
        'dental': dental, 'population': pop, 'econ': econ,
        'census': load_census(),
        'censusYears': CENSUS_YEARS,
        'censusFullYears': CENSUS_FULL_YEARS,
        'censusInd': [{'key':k,'code':c,'name':n} for k,c,n in CENSUS_IND],
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(ds, f, ensure_ascii=False, separators=(',',':'))
    # sanity
    cen = ds['census']
    for y in CENSUS_YEARS:
        keys = ('total','age_0_14','age_15_64','age_65_','pop15','labor','workers','w1','w2','w3','day_pop') if y in CENSUS_FULL_YEARS else ('total','age_0_14','age_15_64','age_65_')
        for k in keys:
            s2 = sum(cen[str(y)][m['code']][k] or 0 for m in munis)
            assert s2 == cen[str(y)][PREF][k], (y, k, s2, cen[str(y)][PREF][k])
        if y in CENSUS_FULL_YEARS:
            for m in munis:
                r = cen[str(y)][m['code']]
                tot = sum(r[k] or 0 for k, _c, _n in CENSUS_IND)  # A〜T の合計＝就業者数
                assert tot == r['workers'], (y, m['code'], tot, r['workers'])
    for y in range(2009, 2025):
        s = sum(dental[m['code']][y]['dent'] for m in munis)
        assert s == dental[PREF][y]['dent'], (y, s, dental[PREF][y]['dent'])
    for y in range(2013, 2027):
        s = sum(pop[m['code']][y]['total'] for m in munis)
        assert s == pop[PREF][y]['total'], (y, s)
    print('ok', OUT, os.path.getsize(OUT), 'bytes')

if __name__ == '__main__':
    build()
