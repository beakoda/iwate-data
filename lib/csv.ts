/* CSVダウンロード用の全ファミリー共通レジストリ。/csv/{family}/{slug}.csv と /csv/{family}.csv を静的生成する。
   列ラベルは日本語。値は dataset.json のまま（丸めない）。 */
import {
  MUNIS, dentalAt, DENTAL_YEARS, popAt, POP_YEARS, censusAt, CENSUS_YEARS,
  buildAt, BUILD_YEARS, vitalAt, VITAL_YEARS, houseAt, HOUSE_YEARS, medAt, MED_YEARS,
  welAt, WEL_YEARS, envAt, ENV_YEARS, econAt2, ECON_YEARS, schoolAt, SCHOOL_YEARS,
  joblessAt, JOBLESS_YEARS, eduAt, EDU_YEARS, farmAt, FARM_YEARS,
} from '@/lib/data';

type Col = [key: string, label: string];
export type Family = {
  label: string; years: number[]; cols: Col[];
  at: (code: string, year: number) => Record<string, any> | undefined;
  yearLabel?: string;
};

export const FAMILIES: Record<string, Family> = {
  dental: { label: '歯科・一般診療所', years: DENTAL_YEARS, at: dentalAt,
    cols: [['dent', '歯科診療所数'], ['gen', '一般診療所数'], ['gen_beds', '一般診療所病床数'], ['gen_with_beds', '有床一般診療所数']] },
  population: { label: '人口・世帯（住民基本台帳）', years: POP_YEARS, at: popAt,
    cols: [['total', '人口'], ['households', '世帯数'], ['births', '出生'], ['deaths', '死亡'], ['in', '転入'], ['out', '転出']] },
  aging: { label: '国勢調査（年齢・面積）', years: CENSUS_YEARS, at: censusAt,
    cols: [['total', '人口'], ['age_0_14', '0〜14歳'], ['age_15_64', '15〜64歳'], ['age_65_', '65歳以上'], ['area_km2', '面積km2'], ['density', '人口密度'], ['avg_age', '平均年齢'], ['median_age', '中位年齢']] },
  work: { label: '国勢調査（就業・昼夜間）', years: CENSUS_YEARS, at: censusAt,
    cols: [['pop15', '15歳以上人口'], ['labor', '労働力人口'], ['labor_rate', '労働力率'], ['workers', '就業者数'], ['w1', '第1次産業'], ['w2', '第2次産業'], ['w3', '第3次産業'], ['commute', '流入通勤'], ['school', '流入通学'], ['day_pop', '昼間人口'], ['dn_ratio', '昼夜間人口比率']] },
  building: { label: '建築着工', years: BUILD_YEARS, at: buildAt,
    cols: [['bldg_all', '全建築物_棟数'], ['floor_all', '全建築物_床面積m2'], ['bldg_house', '居住専用_棟数'], ['floor_house', '居住専用_床面積m2'], ['bldg_mixed', '居住併用_棟数'], ['floor_mixed', '居住併用_床面積m2'], ['cost_all', '工事費予定額_全_万円'], ['cost_house', '工事費予定額_居住専用_万円']] },
  vital: { label: '人口動態', years: VITAL_YEARS, at: vitalAt,
    cols: [['births', '出生数'], ['deaths', '死亡数'], ['marriages', '婚姻件数'], ['divorces', '離婚件数'], ['in_migr', '転入者数'], ['out_migr', '転出者数']] },
  household: { label: '世帯（国勢調査）', years: HOUSE_YEARS, at: houseAt,
    cols: [['households', '世帯総数'], ['general_hh', '一般世帯'], ['nuclear_hh', '核家族世帯'], ['single_hh', '単独世帯'], ['eld_couple_hh', '高齢夫婦のみ世帯'], ['eld_single_hh', '65歳以上単独世帯'], ['pop75', '75歳以上人口'], ['foreign', '外国人人口'], ['did_pop', 'DID人口']] },
  medical: { label: '病院・医師', years: MED_YEARS, at: medAt,
    cols: [['hospitals', '病院数'], ['gen_hospitals', '一般病院数'], ['clinics', '一般診療所数'], ['dental_clinics', '歯科診療所数'], ['hosp_beds', '病院病床数'], ['clinic_beds', '一般診療所病床数'], ['doctors', '医師数'], ['dentists', '歯科医師数'], ['pharmacists', '薬剤師数']] },
  welfare: { label: '介護施設・国保', years: WEL_YEARS, at: welAt,
    cols: [['tokuyo', '特別養護老人ホーム数'], ['tokuyo_cap', '特養定員'], ['yuryo', '有料老人ホーム数'], ['yuryo_cap', '有料定員'], ['kokuho', '国民健康保険被保険者数']] },
  garbage: { label: 'ごみ', years: ENV_YEARS, at: envAt, yearLabel: '年度',
    cols: [['gomi_collect_pop', '計画収集人口'], ['gomi_total', 'ごみ総排出量t'], ['gomi_per_day', '1人1日当たりg'], ['recycle_rate', 'リサイクル率%'], ['landfill', '最終処分量t'], ['flush_rate', '水洗化率%'], ['nonflush_pop', '非水洗化人口']] },
  economy: { label: '所得・製造業・耕地', years: ECON_YEARS, at: econAt2,
    cols: [['taxable_income', '課税対象所得_千円'], ['taxpayers', '納税義務者数'], ['farmland', '耕地面積ha'], ['mfg_shipment', '製造品出荷額等_百万円'], ['mfg_estab', '製造業事業所数'], ['mfg_workers', '製造業従業者数']] },
  school: { label: '学校', years: SCHOOL_YEARS, at: schoolAt,
    cols: [['kg', '幼稚園数'], ['kg_pupils', '幼稚園在園者'], ['es', '小学校数'], ['es_teachers', '小学校教員'], ['es_pupils', '小学校児童'], ['jhs', '中学校数'], ['jhs_teachers', '中学校教員'], ['jhs_students', '中学校生徒'], ['hs', '高校数'], ['hs_students', '高校生徒']] },
  jobless: { label: '完全失業率・労働力', years: JOBLESS_YEARS, at: joblessAt,
    cols: [['labor', '労働力人口'], ['workers', '就業者数'], ['jobless', '完全失業者数'], ['workers65', '65歳以上就業者']] },
  education: { label: '最終学歴', years: EDU_YEARS, at: eduAt,
    cols: [['grad_total', '卒業者総数'], ['grad_jhs', '小学校・中学校卒'], ['grad_hs', '高校・旧中卒'], ['grad_col', '短大・高専卒'], ['grad_univ', '大学・大学院卒']] },
  farm: { label: '農家・耕作放棄地', years: FARM_YEARS, at: farmAt,
    cols: [['sales_farms', '販売農家'], ['self_farms', '自給的農家'], ['full_farms', '専業農家'], ['part_farms', '兼業農家'], ['abandoned', '耕作放棄地ha']] },
};

const esc = (s: string) => /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
const cell = (v: any) => v == null || v === '' ? '' : typeof v === 'number' ? String(v) : esc(String(v));

/** 1市町村 or 全市町村（code=null）のCSV。UTF-8 BOM付き（Excelで文字化けしない）。 */
export function familyCsv(family: string, code: string | null): string {
  const f = FAMILIES[family];
  const head = ['市町村コード', '市町村', f.yearLabel ?? '年', ...f.cols.map(c => c[1])];
  const rows = [head.join(',')];
  const munis = code ? MUNIS.filter(m => m.code === code) : MUNIS;
  for (const m of munis) for (const y of f.years) {
    const r = f.at(m.code, y); if (!r) continue;
    rows.push([m.code, m.name, y, ...f.cols.map(c => cell(r[c[0]]))].join(','));
  }
  return '\uFEFF' + rows.join('\r\n') + '\r\n';
}
