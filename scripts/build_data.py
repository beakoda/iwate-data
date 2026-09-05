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
BUILD_YEARS = list(range(2011, 2025))
CENSUS_YEARS = [2010, 2015, 2020]
# 2010年は第1面のみ（合算できる項目に限定）。2005年以前は平成の大合併前で対応表が必要なため未取込。
CENSUS_FULL_YEARS = [2015, 2020]

SOURCES = {
 'dental': {'name':'厚生労働省「医療施設調査」二次医療圏・市区町村編 第２表（一般診療所数；歯科診療所数；病床数，病床の有無・二次医療圏・市区町村別）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00450021&tstat=000001030908', 'note':'各年10月1日現在。2009〜2024年。e-Stat 掲載CSVより集計。'},
 'population': {'name':'総務省「住民基本台帳に基づく人口、人口動態及び世帯数調査」市区町村別（総計）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200241', 'note':'各年1月1日現在の人口・世帯数。出生・死亡・転入・転出は前年1年間。2013〜2026年。'},
 'econ2021': {'name':'総務省・経済産業省「令和3年経済センサス‐活動調査」事業所に関する集計 産業横断的集計 第4-1表（産業大分類、単独・本所・支所別民営事業所数、従業者数及び売上（収入）金額－市区町村）', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200553&year=20210', 'note':'2021年6月1日現在。売上（収入）金額は外国の会社及び法人でない団体を除く。「X」は秘匿、「-」は該当なし、「...」は非公表。'},
 'econ2016': {'name':'総務省・経済産業省「平成28年経済センサス‐活動調査」事業所に関する集計 産業横断的集計 第8表（産業別民営事業所数・従業者数－都道府県、市区町村）岩手県', 'url':'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200553&year=20160', 'note':'2016年6月1日現在。'},
    'building': {'name':'国土交通省「建築着工統計調査」建築物着工統計 市区町村別、用途別（大分類）／建築物の数、床面積、工事費予定額（年次）', 'url':'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0004019181', 'note':'各年1〜12月の着工。2011〜2019年は統計表0003114492（工事費予定額あり）、2020〜2024年は0004019181（工事費予定額なし）。e-Stat APIで取得。「＊」は秘匿。'},
    'medical': {'name':'総務省統計局「社会・人口統計体系」市区町村データ 基礎データ（Ｉ　健康・医療）', 'url':'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0000020109', 'note':'病院数・一般病院数・病床数・一般診療所数・歯科診療所数は厚生労働省「医療施設調査」（各年10月1日現在）。医師数・歯科医師数・薬剤師数は厚生労働省「医師・歯科医師・薬剤師統計」で、隔年（偶数年12月31日現在）の従業地別。e-Stat APIで取得。'},
    'vital': {'name':'総務省統計局「社会・人口統計体系」市区町村データ 基礎データ（Ａ　人口・世帯）', 'url':'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0000020101', 'note':'出生数・死亡数（人口動態調査）、婚姻件数・離婚件数（人口動態調査）は各年1〜12月。転入者数・転出者数（住民基本台帳人口移動報告）は2018年以降のみ市区町村別が収録され、市町村間の県内移動を含む。e-Stat APIで取得。'},
    'household': {'name':'総務省統計局「社会・人口統計体系」市区町村データ 基礎データ（Ａ　人口・世帯）', 'url':'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0000020101', 'note':'国勢調査を出典とする指標。2010年（平成22年）・2015年（平成27年）・2020年（令和2年）各10月1日現在。75歳以上人口は2015年以降のみ収録。人口集中地区（DID）人口は該当地区のない市町村では空欄。e-Stat APIで取得。'},
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

def load_building():
    out = {}
    for f in ('building_2011_2019.csv', 'building_2020_2024.csv'):
        for r in load_csvs(f):
            code = LEGACY.get(r['code'], r['code'])
            y = r['year']
            d = out.setdefault(code, {}).setdefault(y, {'bldg_all':0,'floor_all':0,'bldg_house':0,'floor_house':0,'bldg_mixed':0,'floor_mixed':0,'cost_all':None,'cost_house':None,'merged':[]})
            for k in ('bldg_all','floor_all','bldg_house','floor_house','bldg_mixed','floor_mixed'):
                d[k] += num(r[k]) or 0
            for k in ('cost_all','cost_house'):
                v = num(r.get(k, ''))
                if v is not None:
                    d[k] = (d[k] or 0) + v
            if code != r['code']:
                d['merged'].append(r['code'])
    return out


VITAL_YEARS = list(range(2010, 2024))
VITAL_KEYS = ('births', 'deaths', 'marriages', 'divorces', 'in_migr', 'out_migr')
HOUSE_YEARS = [2010, 2015, 2020]
HOUSE_KEYS = ('pop75', 'foreign', 'did_pop', 'households', 'general_hh', 'nuclear_hh', 'single_hh', 'eld_couple_hh', 'eld_single_hh')


MED_YEARS = list(range(2010, 2024))
MED_KEYS = ('hospitals', 'gen_hospitals', 'clinics', 'dental_clinics', 'hosp_beds', 'clinic_beds', 'doctors', 'dentists', 'pharmacists')


def load_medical():
    out = {}
    for r in load_csvs('medical_2010_2023.csv'):
        code = LEGACY.get(r['code'], r['code'])
        d = out.setdefault(code, {}).setdefault(r['year'], {k: None for k in MED_KEYS})
        d.setdefault('merged', [])
        for k in MED_KEYS:
            v = num(r[k])
            if v is not None:
                d[k] = (d[k] or 0) + v
        if code != r['code'] and r['code'] not in d['merged']:
            d['merged'].append(r['code'])
    return out


def load_vital():
    out = {}
    for r in load_csvs('vital_2010_2023.csv'):
        code = LEGACY.get(r['code'], r['code'])
        d = out.setdefault(code, {}).setdefault(r['year'], {k: None for k in VITAL_KEYS})
        d.setdefault('merged', [])
        for k in VITAL_KEYS:
            v = num(r[k])
            if v is not None:
                d[k] = (d[k] or 0) + v
        if code != r['code'] and r['code'] not in d['merged']:
            d['merged'].append(r['code'])
    return out


def load_household():
    out = {}
    for r in load_csvs('household_2010_2020.csv'):
        code = LEGACY.get(r['code'], r['code'])
        d = out.setdefault(code, {}).setdefault(r['year'], {k: None for k in HOUSE_KEYS})
        d.setdefault('merged', [])
        for k in HOUSE_KEYS:
            v = num(r[k])
            if v is not None:
                d[k] = (d[k] or 0) + v
        if code != r['code'] and r['code'] not in d['merged']:
            d['merged'].append(r['code'])
    return out


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
        'building': load_building(),
        'medical': load_medical(),
        'medYears': MED_YEARS,
        'vital': load_vital(),
        'household': load_household(),
        'vitalYears': VITAL_YEARS,
        'houseYears': HOUSE_YEARS,
        'buildYears': BUILD_YEARS,
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
    # 建築着工: 市町村合計が県公表値と一致するか（居住専用住宅の棟数、2011-2024）
    bld = ds['building']
    PREF_HOUSE = {2011:4396,2012:6276,2013:6963,2014:6549,2015:6437,2016:6388,2017:6155,2018:6504,2019:6163,
                  2020:5228,2021:5726,2022:5287,2023:4770,2024:4343}
    for y in BUILD_YEARS:
        s2 = sum(bld[m['code']].get(str(y), {}).get('bldg_house', 0) for m in munis)
        assert s2 == PREF_HOUSE[y], ('building', y, s2, PREF_HOUSE[y])

    # 健康・医療: 市町村合計が県公表値（社会・人口統計体系 都道府県データ）と一致するか
    med = ds['medical']
    # [病院,一般病院,一般診療所,歯科診療所,病院病床,一般診療所病床,医師,歯科医師,薬剤師]。医師系は隔年のみ（Noneはその年に公表なし）
    PREF_MED = {
        2010:[95,80,918,611,18506,2133,2576,1046,2123], 2011:[92,77,902,580,17965,2044,None,None,None],
        2012:[92,77,918,590,17856,1930,2603,1031,2183], 2013:[92,77,923,602,17756,1883,None,None,None],
        2014:[91,76,902,594,17569,1663,2622,1031,2232], 2015:[91,76,904,594,17496,1576,None,None,None],
        2016:[93,78,898,592,17471,1506,2631,1029,2303], 2017:[93,78,874,587,17304,1418,None,None,None],
        2018:[93,78,882,583,17081,1343,2673,1005,2421], 2019:[91,76,879,576,15589,1270,None,None,None],
        2020:[92,77,877,566,16436,1187,2700,1016,2536], 2021:[92,77,888,557,16158,1163,None,None,None],
        2022:[92,77,889,548,16146,1055,2758,965,2572],  2023:[91,76,879,542,15850,939,None,None,None],
    }
    for y in MED_YEARS:
        for i, k in enumerate(MED_KEYS):
            exp = PREF_MED[y][i]
            if exp is None: continue
            got = sum(med[m['code']].get(str(y), {}).get(k) or 0 for m in munis)
            assert got == exp, ('medical', y, k, got, exp)
    # 医療施設調査を出典とする2系統（/dental/ の第2表 と 社会・人口統計体系）が一致するか
    for y in MED_YEARS:
        for m in munis:
            r = med[m['code']].get(str(y), {})
            assert r.get('dental_clinics') == dental[m['code']][y]['dent'], ('dental xcheck', y, m['code'])
            assert r.get('clinics') == dental[m['code']][y]['gen'], ('clinic xcheck', y, m['code'])

    # 人口動態: 市町村合計が県公表値（社会・人口統計体系 都道府県データ）と一致するか
    vit = ds['vital']
    PREF_VITAL = {2010:(9745,15756,5724,2327),2011:(9310,22335,5346,2038),2012:(9277,16072,5629,1975),
                  2013:(9231,15970,5398,2003),2014:(8803,16274,5482,1855),2015:(8814,16502,5243,1956),
                  2016:(8342,16959,4873,1877),2017:(8175,17232,4775,1861),2018:(7615,17390,4439,1843),
                  2019:(6974,17826,4489,1754),2020:(6718,17204,3918,1679),2021:(6472,17631,3673,1459),
                  2022:(5788,19342,3508,1492),2023:(5432,19612,3376,1488)}
    for y in VITAL_YEARS:
        got = tuple(sum(vit[m['code']].get(str(y), {}).get(k) or 0 for m in munis)
                    for k in ('births','deaths','marriages','divorces'))
        assert got == PREF_VITAL[y], ('vital', y, got, PREF_VITAL[y])
    # 世帯: 市町村合計が県公表値と一致するか
    hh = ds['household']
    PREF_HH = {
        2010: {'foreign':5184,'did_pop':393716,'households':483934,'general_hh':482845,'nuclear_hh':246937,'single_hh':132370,'eld_couple_hh':48029,'eld_single_hh':43479},
        2015: {'pop75':207419,'foreign':5017,'did_pop':407920,'households':493049,'general_hh':489383,'nuclear_hh':251014,'single_hh':148575,'eld_couple_hh':53475,'eld_single_hh':53398},
        2020: {'pop75':214277,'foreign':6937,'did_pop':400246,'households':492436,'general_hh':490828,'nuclear_hh':252005,'single_hh':163290,'eld_couple_hh':57656,'eld_single_hh':62424},
    }
    for y in HOUSE_YEARS:
        for k, exp in PREF_HH[y].items():
            got = sum(hh[m['code']].get(str(y), {}).get(k) or 0 for m in munis)
            assert got == exp, ('household', y, k, got, exp)

    for y in range(2009, 2025):
        s = sum(dental[m['code']][y]['dent'] for m in munis)
        assert s == dental[PREF][y]['dent'], (y, s, dental[PREF][y]['dent'])
    for y in range(2013, 2027):
        s = sum(pop[m['code']][y]['total'] for m in munis)
        assert s == pop[PREF][y]['total'], (y, s)
    print('ok', OUT, os.path.getsize(OUT), 'bytes')

if __name__ == '__main__':
    build()
