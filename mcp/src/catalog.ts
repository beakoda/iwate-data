/* データセットのカタログ。lib/csv.ts の FAMILIES と同じ列定義（同期を保つこと）。
   key   : dataset.json のキー
   byYear: census だけ census[year][code]、それ以外は key[code][year] */
export type Col = { key: string; label: string; unit: string; sum?: boolean };
export type Dataset = {
  id: string; label: string; dsKey: string; yearsKey: string; byYear?: boolean; yearLabel: string;
  source: string; path: string; cols: Col[]; note?: string;
};

export const DATASETS: Dataset[] = [
  { id: 'dental', label: '歯科・一般診療所', dsKey: 'dental', yearsKey: '', yearLabel: '年', source: 'dental', path: 'dental',
    cols: [{ key: 'dent', label: '歯科診療所数', unit: '施設', sum: true }, { key: 'gen', label: '一般診療所数', unit: '施設', sum: true }, { key: 'gen_beds', label: '一般診療所病床数', unit: '床', sum: true }, { key: 'gen_with_beds', label: '有床一般診療所数', unit: '施設', sum: true }] },
  { id: 'population', label: '人口・世帯（住民基本台帳、各年1月1日）', dsKey: 'population', yearsKey: '', yearLabel: '年', source: 'population', path: 'population',
    cols: [{ key: 'total', label: '人口', unit: '人', sum: true }, { key: 'households', label: '世帯数', unit: '世帯', sum: true }, { key: 'births', label: '出生（前年）', unit: '人', sum: true }, { key: 'deaths', label: '死亡（前年）', unit: '人', sum: true }, { key: 'in', label: '転入（前年）', unit: '人', sum: true }, { key: 'out', label: '転出（前年）', unit: '人', sum: true }] },
  { id: 'aging', label: '年齢構成・面積（国勢調査）', dsKey: 'census', yearsKey: 'censusYears', byYear: true, yearLabel: '年', source: 'census', path: 'aging',
    cols: [{ key: 'total', label: '人口', unit: '人', sum: true }, { key: 'age_0_14', label: '0〜14歳人口', unit: '人', sum: true }, { key: 'age_15_64', label: '15〜64歳人口', unit: '人', sum: true }, { key: 'age_65_', label: '65歳以上人口', unit: '人', sum: true }, { key: 'area_km2', label: '面積', unit: 'km2', sum: true }, { key: 'density', label: '人口密度', unit: '人/km2' }, { key: 'avg_age', label: '平均年齢', unit: '歳' }, { key: 'median_age', label: '中位年齢', unit: '歳' }] },
  { id: 'work', label: '就業・昼夜間人口（国勢調査）', dsKey: 'census', yearsKey: 'censusFullYears', byYear: true, yearLabel: '年', source: 'census', path: 'work',
    cols: [{ key: 'pop15', label: '15歳以上人口', unit: '人', sum: true }, { key: 'labor', label: '労働力人口', unit: '人', sum: true }, { key: 'labor_rate', label: '労働力率', unit: '%' }, { key: 'workers', label: '就業者数', unit: '人', sum: true }, { key: 'w1', label: '第1次産業就業者', unit: '人', sum: true }, { key: 'w2', label: '第2次産業就業者', unit: '人', sum: true }, { key: 'w3', label: '第3次産業就業者', unit: '人', sum: true }, { key: 'day_pop', label: '昼間人口', unit: '人', sum: true }, { key: 'dn_ratio', label: '昼夜間人口比率', unit: '' }] },
  { id: 'building', label: '建築着工', dsKey: 'building', yearsKey: 'buildYears', yearLabel: '年', source: 'building', path: 'building',
    cols: [{ key: 'bldg_all', label: '全建築物 着工棟数', unit: '棟', sum: true }, { key: 'floor_all', label: '全建築物 床面積', unit: 'm2', sum: true }, { key: 'bldg_house', label: '居住専用住宅 着工棟数', unit: '棟', sum: true }, { key: 'floor_house', label: '居住専用住宅 床面積', unit: 'm2', sum: true }, { key: 'bldg_mixed', label: '居住併用 着工棟数', unit: '棟', sum: true }, { key: 'floor_mixed', label: '居住併用 床面積', unit: 'm2', sum: true }, { key: 'cost_all', label: '工事費予定額（全）', unit: '万円', sum: true }, { key: 'cost_house', label: '工事費予定額（居住専用）', unit: '万円', sum: true }] },
  { id: 'vital', label: '人口動態（出生・死亡・婚姻・離婚）', dsKey: 'vital', yearsKey: 'vitalYears', yearLabel: '年', source: 'vital', path: 'vital',
    cols: [{ key: 'births', label: '出生数', unit: '人', sum: true }, { key: 'deaths', label: '死亡数', unit: '人', sum: true }, { key: 'marriages', label: '婚姻件数', unit: '件', sum: true }, { key: 'divorces', label: '離婚件数', unit: '件', sum: true }, { key: 'in_migr', label: '転入者数', unit: '人' }, { key: 'out_migr', label: '転出者数', unit: '人' }] },
  { id: 'household', label: '世帯（国勢調査）', dsKey: 'household', yearsKey: 'houseYears', yearLabel: '年', source: 'household', path: 'household',
    cols: [{ key: 'households', label: '世帯総数', unit: '世帯', sum: true }, { key: 'general_hh', label: '一般世帯', unit: '世帯', sum: true }, { key: 'nuclear_hh', label: '核家族世帯', unit: '世帯', sum: true }, { key: 'single_hh', label: '単独世帯', unit: '世帯', sum: true }, { key: 'eld_couple_hh', label: '高齢夫婦のみ世帯', unit: '世帯', sum: true }, { key: 'eld_single_hh', label: '65歳以上単独世帯', unit: '世帯', sum: true }, { key: 'pop75', label: '75歳以上人口', unit: '人', sum: true }, { key: 'foreign', label: '外国人人口', unit: '人', sum: true }, { key: 'did_pop', label: 'DID人口', unit: '人', sum: true }] },
  { id: 'medical', label: '病院・病床・医師', dsKey: 'medical', yearsKey: 'medYears', yearLabel: '年', source: 'medical', path: 'medical',
    cols: [{ key: 'hospitals', label: '病院数', unit: '施設', sum: true }, { key: 'gen_hospitals', label: '一般病院数', unit: '施設', sum: true }, { key: 'clinics', label: '一般診療所数', unit: '施設', sum: true }, { key: 'dental_clinics', label: '歯科診療所数', unit: '施設', sum: true }, { key: 'hosp_beds', label: '病院病床数', unit: '床', sum: true }, { key: 'clinic_beds', label: '一般診療所病床数', unit: '床', sum: true }, { key: 'doctors', label: '医師数（偶数年）', unit: '人', sum: true }, { key: 'dentists', label: '歯科医師数（偶数年）', unit: '人', sum: true }, { key: 'pharmacists', label: '薬剤師数（偶数年）', unit: '人', sum: true }] },
  { id: 'welfare', label: '介護施設・国民健康保険', dsKey: 'welfare', yearsKey: 'welYears', yearLabel: '年', source: 'welfare', path: 'welfare',
    cols: [{ key: 'tokuyo', label: '特別養護老人ホーム数', unit: '施設', sum: true }, { key: 'tokuyo_cap', label: '特養定員', unit: '人', sum: true }, { key: 'yuryo', label: '有料老人ホーム数', unit: '施設', sum: true }, { key: 'yuryo_cap', label: '有料老人ホーム定員', unit: '人', sum: true }, { key: 'kokuho', label: '国民健康保険被保険者数', unit: '人', sum: true }] },
  { id: 'garbage', label: 'ごみ排出・リサイクル・水洗化', dsKey: 'env', yearsKey: 'envYears', yearLabel: '年度', source: 'env', path: 'garbage',
    cols: [{ key: 'gomi_collect_pop', label: '計画収集人口', unit: '人', sum: true }, { key: 'gomi_total', label: 'ごみ総排出量', unit: 't', sum: true }, { key: 'gomi_per_day', label: '1人1日当たり排出量', unit: 'g' }, { key: 'recycle_rate', label: 'リサイクル率', unit: '%' }, { key: 'landfill', label: '最終処分量', unit: 't', sum: true }, { key: 'flush_rate', label: '水洗化率', unit: '%' }, { key: 'nonflush_pop', label: '非水洗化人口', unit: '人', sum: true }] },
  { id: 'economy', label: '課税対象所得・製造業・耕地面積', dsKey: 'economy', yearsKey: 'econYears', yearLabel: '年', source: 'economy', path: 'economy',
    cols: [{ key: 'taxable_income', label: '課税対象所得', unit: '千円', sum: true }, { key: 'taxpayers', label: '納税義務者数', unit: '人', sum: true }, { key: 'farmland', label: '耕地面積', unit: 'ha', sum: true }, { key: 'mfg_shipment', label: '製造品出荷額等', unit: '百万円', sum: true }, { key: 'mfg_estab', label: '製造業事業所数', unit: '事業所', sum: true }, { key: 'mfg_workers', label: '製造業従業者数', unit: '人', sum: true }] },
  { id: 'school', label: '学校・児童生徒・教員', dsKey: 'school', yearsKey: 'schoolYears', yearLabel: '年', source: 'school', path: 'school',
    cols: [{ key: 'kg', label: '幼稚園数', unit: '園', sum: true }, { key: 'kg_pupils', label: '幼稚園在園者', unit: '人', sum: true }, { key: 'es', label: '小学校数', unit: '校', sum: true }, { key: 'es_teachers', label: '小学校教員数', unit: '人', sum: true }, { key: 'es_pupils', label: '小学校児童数', unit: '人', sum: true }, { key: 'jhs', label: '中学校数', unit: '校', sum: true }, { key: 'jhs_teachers', label: '中学校教員数', unit: '人', sum: true }, { key: 'jhs_students', label: '中学校生徒数', unit: '人', sum: true }, { key: 'hs', label: '高校数', unit: '校', sum: true }, { key: 'hs_students', label: '高校生徒数', unit: '人', sum: true }] },
  { id: 'jobless', label: '完全失業率・労働力（国勢調査）', dsKey: 'jobless', yearsKey: 'joblessYears', yearLabel: '年', source: 'jobless', path: 'jobless',
    cols: [{ key: 'labor', label: '労働力人口', unit: '人', sum: true }, { key: 'workers', label: '就業者数', unit: '人', sum: true }, { key: 'jobless', label: '完全失業者数', unit: '人', sum: true }, { key: 'workers65', label: '65歳以上就業者', unit: '人', sum: true }] },
  { id: 'education', label: '最終学歴（国勢調査）', dsKey: 'education', yearsKey: 'eduYears', yearLabel: '年', source: 'education', path: 'education',
    cols: [{ key: 'grad_total', label: '卒業者総数', unit: '人', sum: true }, { key: 'grad_jhs', label: '小学校・中学校卒', unit: '人', sum: true }, { key: 'grad_hs', label: '高校・旧中卒', unit: '人', sum: true }, { key: 'grad_col', label: '短大・高専卒', unit: '人', sum: true }, { key: 'grad_univ', label: '大学・大学院卒', unit: '人', sum: true }] },
  { id: 'farm', label: '農家数・耕作放棄地（農林業センサス）', dsKey: 'farm', yearsKey: 'farmYears', yearLabel: '年', source: 'farm', path: 'farm',
    cols: [{ key: 'sales_farms', label: '販売農家', unit: '戸', sum: true }, { key: 'self_farms', label: '自給的農家', unit: '戸', sum: true }, { key: 'full_farms', label: '専業農家（2014年まで）', unit: '戸', sum: true }, { key: 'part_farms', label: '兼業農家（2014年まで）', unit: '戸', sum: true }, { key: 'abandoned', label: '耕作放棄地（2014年まで）', unit: 'ha', sum: true }] },
];

/** 派生指標（率・原単位）。生の列から計算する。市町村合算はできないので県値は合計から計算する */
export type Derived = { id: string; dataset: string; label: string; unit: string; decimals: number; fn: (r: Record<string, any>) => number | null };
const div = (a: any, b: any, scale = 1) => (a == null || b == null || !b) ? null : (a / b) * scale;
export const DERIVED: Derived[] = [
  { id: 'aging_rate', dataset: 'aging', label: '高齢化率（65歳以上÷年齢3区分計）', unit: '%', decimals: 1, fn: r => div(r.age_65_, (r.age_0_14 ?? 0) + (r.age_15_64 ?? 0) + (r.age_65_ ?? 0), 100) },
  { id: 'youth_rate', dataset: 'aging', label: '年少人口割合（0〜14歳）', unit: '%', decimals: 1, fn: r => div(r.age_0_14, (r.age_0_14 ?? 0) + (r.age_15_64 ?? 0) + (r.age_65_ ?? 0), 100) },
  { id: 'jobless_rate', dataset: 'jobless', label: '完全失業率', unit: '%', decimals: 1, fn: r => div(r.jobless, r.labor, 100) },
  { id: 'elder_worker_share', dataset: 'jobless', label: '就業者に占める65歳以上の割合', unit: '%', decimals: 1, fn: r => div(r.workers65, r.workers, 100) },
  { id: 'univ_rate', dataset: 'education', label: '大学・大学院卒の割合（大卒率）', unit: '%', decimals: 1, fn: r => div(r.grad_univ, r.grad_total, 100) },
  { id: 'single_hh_rate', dataset: 'household', label: '単独世帯の割合', unit: '%', decimals: 1, fn: r => div(r.single_hh, r.general_hh, 100) },
  { id: 'eld_single_rate', dataset: 'household', label: '65歳以上単独世帯の割合', unit: '%', decimals: 1, fn: r => div(r.eld_single_hh, r.general_hh, 100) },
  { id: 'income_per_taxpayer', dataset: 'economy', label: '納税義務者1人当たり課税対象所得', unit: '円', decimals: 0, fn: r => div(r.taxable_income, r.taxpayers, 1000) },
  { id: 'pupils_per_school', dataset: 'school', label: '小学校1校当たり児童数', unit: '人', decimals: 1, fn: r => div(r.es_pupils, r.es) },
  { id: 'total_farms', dataset: 'farm', label: '総農家数（販売＋自給的）', unit: '戸', decimals: 0, fn: r => (r.sales_farms == null || r.self_farms == null) ? null : r.sales_farms + r.self_farms },
  { id: 'natural_change', dataset: 'vital', label: '自然増減（出生−死亡）', unit: '人', decimals: 0, fn: r => (r.births == null || r.deaths == null) ? null : r.births - r.deaths },
];
