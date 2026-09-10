/* データセットのカタログ。lib/csv.ts の FAMILIES と同じ列定義（同期を保つこと）。
   key   : dataset.json のキー
   byYear: census だけ census[year][code]、それ以外は key[code][year] */
export type Col = { key: string; label: string; unit: string; sum?: boolean };
export type Dataset = {
  id: string; label: string; dsKey: string; yearsKey: string; byYear?: boolean; yearLabel: string;
  source: string; path: string; cols: Col[]; note?: string;
  /** dataset.json の形が key[code][year] でない分野用。年と市町村から1行分の値を組み立てる。
      年の軸が無いスナップショット（施設一覧など）は years に時点の年を1つだけ入れておく */
  pick?: (ds: any, code: string, year: number) => Record<string, any> | undefined;
  /** yearsKey が無く pick を使う分野の収録年 */
  years?: number[];
};

const n = (v: any) => (typeof v === 'number' ? v : 0);
/** サービス種別ごとの {offices, with_url|capacity} を平たい行にする */
function flat(src: any, keys: string[], suffix: string, valueKey: string) {
  const out: Record<string, any> = {};
  for (const k of keys) out[k + suffix] = n(src?.[k]?.[valueKey]);
  return out;
}

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
  { id: 'jiko', label: '交通事故（警察庁オープンデータ）', dsKey: 'traffic', yearsKey: 'trafficYears', yearLabel: '年', source: 'traffic', path: 'jiko',
    cols: [{ key: 'accidents', label: '人身事故件数', unit: '件', sum: true }, { key: 'fatal_accidents', label: '死亡事故件数', unit: '件', sum: true }, { key: 'deaths', label: '死者数', unit: '人', sum: true }, { key: 'injuries', label: '負傷者数', unit: '人', sum: true }],
    note: '人身事故のみ（物損事故は含まない）。市町村は発生地。死者数は事故発生から24時間以内。' },
  { id: 'crime', label: '街頭犯罪（岩手県警オープンデータ）', dsKey: 'crime', yearsKey: 'crimeYears', yearLabel: '年', source: 'crime', path: 'crime',
    cols: [{ key: 'total', label: '7手口の合計', unit: '件', sum: true }, { key: '自転車盗', label: '自転車盗', unit: '件', sum: true }, { key: '車上ねらい', label: '車上ねらい', unit: '件', sum: true }, { key: '部品ねらい', label: '部品ねらい', unit: '件', sum: true }, { key: '自動販売機ねらい', label: '自動販売機ねらい', unit: '件', sum: true }, { key: '自動車盗', label: '自動車盗', unit: '件', sum: true }, { key: 'オートバイ盗', label: 'オートバイ盗', unit: '件', sum: true }, { key: 'ひったくり', label: 'ひったくり', unit: '件', sum: true }],
    note: '岩手県警が公開する事件1件ごとの発生記録を市町村×年×手口で集計したもの。刑法犯認知件数の全体ではない。2016・2017年は一部手口しか公開されていないため、通年比較は2018年以降で行うこと。' },
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
  /* ---- 以下は dataset.json の形が key[code][year] ではないため pick で組み立てる（2026-09 追加） ---- */
  { id: 'kaigo', label: '介護サービス事業所（介護サービス情報公表システム）', dsKey: 'kaigo', yearsKey: '', yearLabel: '年', source: 'kaigo', path: 'kaigo',
    years: [2024, 2026],
    pick: (d, code, year) => {
      const snap = (d.kaigoSnaps as string[]).find(s => Number(s.slice(0, 4)) === year);
      const src = d.kaigo?.[code]?.[snap as string]; if (!src) return undefined;
      return { offices: n(src._total?.offices), capacity: n(src._total?.capacity),
        ...flat(src, ['訪問介護', '通所介護', '居宅介護支援', '認知症対応型共同生活介護', '短期入所生活介護', '介護老人福祉施設', '訪問看護', '地域密着型通所介護'], '', 'offices') };
    },
    cols: [{ key: 'offices', label: '事業所数（全種別・延べ）', unit: '事業所', sum: true }, { key: 'capacity', label: '定員の合計', unit: '人', sum: true }, { key: '訪問介護', label: '訪問介護', unit: '事業所', sum: true }, { key: '通所介護', label: '通所介護', unit: '事業所', sum: true }, { key: '居宅介護支援', label: '居宅介護支援', unit: '事業所', sum: true }, { key: '認知症対応型共同生活介護', label: '認知症対応型共同生活介護', unit: '事業所', sum: true }, { key: '短期入所生活介護', label: '短期入所生活介護', unit: '事業所', sum: true }, { key: '介護老人福祉施設', label: '介護老人福祉施設', unit: '事業所', sum: true }, { key: '訪問看護', label: '訪問看護', unit: '事業所', sum: true }, { key: '地域密着型通所介護', label: '地域密着型通所介護', unit: '事業所', sum: true }],
    note: '2024年12月末時点と2026年6月末時点の2時点。全35種別のうち主要8種別だけを列にしている（全種別は https://iwate-data.com/csv/kaigo/all.csv）。1法人が同じ場所で複数サービスを出していれば種別ごとに数える延べ事業所数。' },
  { id: 'shofuku', label: '障害福祉サービス事業所（WAM）', dsKey: 'shofuku', yearsKey: '', yearLabel: '年', source: 'shofuku', path: 'shofuku',
    years: [2026],
    pick: (d, code) => {
      const src = d.shofuku?.[code]; if (!src) return undefined;
      return { offices: n(src._total?.offices), with_url: n(src._total?.with_url),
        ...flat(src, ['就労継続支援Ｂ型', '居宅介護', '共同生活援助', '放課後等デイサービス', '生活介護', '重度訪問介護', '計画相談支援', '児童発達支援'], '', 'offices') };
    },
    cols: [{ key: 'offices', label: '事業所数（全種別・延べ）', unit: '事業所', sum: true }, { key: 'with_url', label: 'ホームページを公表している事業所', unit: '事業所', sum: true }, { key: '就労継続支援Ｂ型', label: '就労継続支援Ｂ型', unit: '事業所', sum: true }, { key: '居宅介護', label: '居宅介護', unit: '事業所', sum: true }, { key: '共同生活援助', label: '共同生活援助', unit: '事業所', sum: true }, { key: '放課後等デイサービス', label: '放課後等デイサービス', unit: '事業所', sum: true }, { key: '生活介護', label: '生活介護', unit: '事業所', sum: true }, { key: '重度訪問介護', label: '重度訪問介護', unit: '事業所', sum: true }, { key: '計画相談支援', label: '計画相談支援', unit: '事業所', sum: true }, { key: '児童発達支援', label: '児童発達支援', unit: '事業所', sum: true }],
    note: '2026年3月末時点。全27種別のうち主要8種別だけを列にしている（全種別は https://iwate-data.com/csv/shofuku/all.csv）。' },
  { id: 'iryou', label: '医療機関・薬局（医療情報ネット）', dsKey: 'iryou', yearsKey: '', yearLabel: '年', source: 'iryou', path: 'iryou',
    years: [2025],
    pick: (d, code) => {
      const src = d.iryou?.[code]; if (!src) return undefined;
      const o: Record<string, any> = { facilities: n(src._total?.facilities), with_url: n(src._total?.with_url) };
      for (const t of ['病院', '診療所', '歯科', '薬局', '助産所']) { o[t] = n(src?.[t]?.facilities); o[t + '_HP'] = n(src?.[t]?.with_url); }
      return o;
    },
    cols: [{ key: 'facilities', label: '施設数（合計）', unit: '施設', sum: true }, { key: 'with_url', label: 'ホームページを届け出ている施設', unit: '施設', sum: true }, { key: '病院', label: '病院', unit: '施設', sum: true }, { key: '診療所', label: '診療所', unit: '施設', sum: true }, { key: '歯科', label: '歯科', unit: '施設', sum: true }, { key: '薬局', label: '薬局', unit: '施設', sum: true }, { key: '助産所', label: '助産所', unit: '施設', sum: true }, { key: '病院_HP', label: '病院（HP公表）', unit: '施設', sum: true }, { key: '診療所_HP', label: '診療所（HP公表）', unit: '施設', sum: true }, { key: '歯科_HP', label: '歯科（HP公表）', unit: '施設', sum: true }, { key: '薬局_HP', label: '薬局（HP公表）', unit: '施設', sum: true }, { key: '助産所_HP', label: '助産所（HP公表）', unit: '施設', sum: true }],
    note: '2025年12月1日時点。医療機能情報提供制度・薬局機能情報提供制度に届出のある施設。「医療施設調査」（medical / dental 分野）とは定義も時点も異なり一致しない。' },
  { id: 'school_code', label: '学校（学校コード・現存校と廃校）', dsKey: 'schoolActive', yearsKey: '', yearLabel: '年', source: 'schoolcode', path: 'haikou',
    years: [2026],
    pick: (d, code) => {
      const a = d.schoolActive?.[code]; if (!a) return undefined;
      const o: Record<string, any> = { schools: n(a._total), closed_since_2021: (d.schoolClosed?.[code] || []).length };
      for (const k of ['幼稚園', '認定こども園', '小学校', '中学校', '義務教育学校', '高校', '特別支援学校', '専修学校', '各種学校']) o[k] = n(a[k]);
      return o;
    },
    cols: [{ key: 'schools', label: '現存校（合計）', unit: '校', sum: true }, { key: 'closed_since_2021', label: '2021年以降に廃止された学校', unit: '校', sum: true }, { key: '幼稚園', label: '幼稚園', unit: '校', sum: true }, { key: '認定こども園', label: '認定こども園', unit: '校', sum: true }, { key: '小学校', label: '小学校', unit: '校', sum: true }, { key: '中学校', label: '中学校', unit: '校', sum: true }, { key: '義務教育学校', label: '義務教育学校', unit: '校', sum: true }, { key: '高校', label: '高校', unit: '校', sum: true }, { key: '特別支援学校', label: '特別支援学校', unit: '校', sum: true }, { key: '専修学校', label: '専修学校', unit: '校', sum: true }, { key: '各種学校', label: '各種学校', unit: '校', sum: true }],
    note: '2026年5月20日更新の学校コード一覧。廃校は制度開始（2020年12月）以降に廃止年月日が入ったものに限られ、2021年以降の分だけ。校名の一覧は https://iwate-data.com/haikou/ にある。' },
  { id: 'houjin', label: '法人数（法人番号公表サイト）', dsKey: 'houjin', yearsKey: '', yearLabel: '年', source: 'houjin', path: 'houjin',
    years: [2026],
    pick: (d, code) => {
      const src = d.houjin?.[code]; if (!src) return undefined;
      const o: Record<string, any> = { corps: n(src._total), closed_total: n(d.houjinClosed?.[code]) };
      for (const k of ['株式会社', '有限会社', '合同会社', '合資会社', '合名会社', 'その他の設立登記法人', '地方公共団体', '国の機関', '外国会社等', 'その他']) o[k] = n(src[k]);
      return o;
    },
    cols: [{ key: 'corps', label: '現存法人（合計）', unit: '社', sum: true }, { key: 'closed_total', label: '登記記録が閉鎖された法人（累計）', unit: '社', sum: true }, { key: '株式会社', label: '株式会社', unit: '社', sum: true }, { key: '有限会社', label: '有限会社', unit: '社', sum: true }, { key: '合同会社', label: '合同会社', unit: '社', sum: true }, { key: '合資会社', label: '合資会社', unit: '社', sum: true }, { key: '合名会社', label: '合名会社', unit: '社', sum: true }, { key: 'その他の設立登記法人', label: 'その他の設立登記法人', unit: '社', sum: true }, { key: '地方公共団体', label: '地方公共団体', unit: '社', sum: true }, { key: '国の機関', label: '国の機関', unit: '社', sum: true }, { key: '外国会社等', label: '外国会社等', unit: '社', sum: true }, { key: 'その他', label: 'その他', unit: '社', sum: true }],
    note: '2026年8月31日時点。登記されている法人の数であり、事業所数でも営業中の会社の数でもない。有限会社は2006年に新設できなくなっているため、現存分はすべて2006年以前の設立。' },
  { id: 'houjin_new', label: '法人番号の新規指定（実質的な新設法人）', dsKey: 'houjinNew', yearsKey: 'houjinYears', yearLabel: '年', source: 'houjin', path: 'houjin',
    pick: (d, code, year) => { const v = d.houjinNew?.[code]?.[String(year)]; return v == null ? undefined : { corps_new: v }; },
    cols: [{ key: 'corps_new', label: '新しく法人番号が指定された法人', unit: '社', sum: true }],
    note: '法人番号は2015年10月に既存法人へ一斉付番されたため、実質的な新設分は2016年以降で見る。' },
  { id: 'hoiku', label: '保育所等の定員・待機児童', dsKey: 'hoiku', yearsKey: '', yearLabel: '年', source: 'hoiku', path: 'hoiku',
    years: [2026],
    pick: (d, code) => d.hoiku?.[code],
    cols: [{ key: 'capacity', label: '利用定員', unit: '人', sum: true }, { key: 'applicants', label: '申込者', unit: '人', sum: true }, { key: 'waiting', label: '待機児童', unit: '人', sum: true }, { key: 'on_leave', label: '育児休業中で待機児童に数えない', unit: '人', sum: true }, { key: 'specific_only', label: '特定の園のみ希望で待機児童に数えない', unit: '人', sum: true }, { key: 'job_paused', label: '求職活動休止で待機児童に数えない', unit: '人', sum: true }],
    note: '2026年4月1日時点。待機児童は国の定義で、育児休業中・特定の園のみ希望・求職活動休止は数えない。' },
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
  { id: 'iryou_url_rate', dataset: 'iryou', label: 'ホームページを届け出ている施設の割合', unit: '%', decimals: 1, fn: r => div(r.with_url, r.facilities, 100) },
  { id: 'dental_url_rate', dataset: 'iryou', label: '歯科のホームページ公表率', unit: '%', decimals: 1, fn: r => div(r['歯科_HP'], r['歯科'], 100) },
  { id: 'shofuku_url_rate', dataset: 'shofuku', label: 'ホームページを公表している事業所の割合', unit: '%', decimals: 1, fn: r => div(r.with_url, r.offices, 100) },
  { id: 'hoiku_fill_rate', dataset: 'hoiku', label: '定員に対する申込の割合（充足率）', unit: '%', decimals: 1, fn: r => div(r.applicants, r.capacity, 100) },
  { id: 'hoiku_slack', dataset: 'hoiku', label: '定員の空き（定員−申込）', unit: '人', decimals: 0, fn: r => (r.capacity == null || r.applicants == null) ? null : r.capacity - r.applicants },
  { id: 'yugen_share', dataset: 'houjin', label: '有限会社が現存法人に占める割合', unit: '%', decimals: 1, fn: r => div(r['有限会社'], r.corps, 100) },
  { id: 'closed_share', dataset: 'school_code', label: '廃校の割合（廃校÷現存＋廃校）', unit: '%', decimals: 1, fn: r => div(r.closed_since_2021, (r.schools ?? 0) + (r.closed_since_2021 ?? 0), 100) },
  { id: 'natural_change', dataset: 'vital', label: '自然増減（出生−死亡）', unit: '人', decimals: 0, fn: r => (r.births == null || r.deaths == null) ? null : r.births - r.deaths },
];
