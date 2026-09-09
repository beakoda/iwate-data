import ds from '@/data/dataset.json';

export type Muni = { code: string; name: string; slug: string; kind: string; gun: string };
export type Industry = { code: string; name: string; slug: string };
export type DentalRec = { dent: number; gen: number; gen_beds: number; gen_with_beds: number; merged: string[] };
export type PopRec = { total: number; households: number; births: number; deaths: number; in: number; out: number };
export type EconRec = { estab: number | null; workers: number | null; sales?: number | null; sales_raw?: string };

export const SITE = {
  name: 'いわてデータ',
  nameEn: 'iwate-data',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://iwate-data.com',
  publisher: 'ビークプロモーション株式会社',
  publisherUrl: 'https://beak-promo.jp/',
  description: '岩手県33市町村の公開データを、市町村×業種の粒度で整理して公開するデータサイト。政府統計（e-Stat）に加え、岩手県警のオープンデータなど岩手固有の一次資料も収録。',
};

export const PREF = ds.pref;
export const MUNIS: Muni[] = ds.municipalities as Muni[];
export const INDUSTRIES: Industry[] = ds.industries as Industry[];
export const SOURCES = ds.sources as Record<string, { name: string; url: string; note: string }>;
export const GENERATED: string = ds.generated;

const dental = ds.dental as Record<string, Record<string, DentalRec>>;
const population = ds.population as Record<string, Record<string, PopRec>>;
const econ = ds.econ as Record<string, Record<string, Record<string, EconRec>>>;

export const DENTAL_YEARS = Array.from({ length: 2024 - 2009 + 1 }, (_, i) => 2009 + i);
export const POP_YEARS = Array.from({ length: 2026 - 2013 + 1 }, (_, i) => 2013 + i);
export const LATEST_DENTAL = 2024;
export const LATEST_POP = 2026;

export function muniBySlug(slug: string) { return MUNIS.find(m => m.slug === slug); }
export function muniByCode(code: string) { return MUNIS.find(m => m.code === code); }
export function industryBySlug(slug: string) { return INDUSTRIES.find(i => i.slug === slug); }

export function dentalSeries(code: string) {
  return DENTAL_YEARS.map(y => ({ year: y, ...(dental[code]?.[String(y)] as DentalRec) }));
}
export function popSeries(code: string) {
  return POP_YEARS.map(y => ({ year: y, ...(population[code]?.[String(y)] as PopRec) }));
}
export function popAt(code: string, year: number): PopRec | undefined { return population[code]?.[String(year)]; }
export function dentalAt(code: string, year: number): DentalRec | undefined { return dental[code]?.[String(year)]; }
export function econAt(code: string, ind: string): Record<string, EconRec> | undefined { return econ[code]?.[ind]; }

/** 人口10万人当たり。医療施設調査(各年10/1)には翌年1/1の住基人口を対応させる。 */
export function per100k(count: number | null | undefined, code: string, dentalYear: number): number | null {
  const p = popAt(code, dentalYear + 1);
  if (!p || count == null) return null;
  return Math.round((count / p.total) * 100000 * 10) / 10;
}

export function fmt(n: number | null | undefined, unit = ''): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('ja-JP') + unit;
}
export function fmtSigned(n: number | null | undefined, unit = ''): string {
  if (n == null) return '—';
  return (n > 0 ? '+' : '') + n.toLocaleString('ja-JP') + unit;
}
export function pct(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

/** 順位（降順、同値は同順位） */
export function rank<T>(items: T[], value: (t: T) => number | null): Map<T, number> {
  const sorted = items.filter(i => value(i) != null).sort((x, y) => (value(y)! - value(x)!));
  const m = new Map<T, number>();
  let r = 0, prev: number | null = null;
  sorted.forEach((it, idx) => { const v = value(it)!; if (v !== prev) { r = idx + 1; prev = v; } m.set(it, r); });
  return m;
}

/* ===== 国勢調査（2015 / 2020） ===== */
export type CensusRec = {
  total: number; male?: number; female?: number;
  area_km2: number | null; density: number | null; avg_age: number | null; median_age: number | null;
  age_0_14: number; age_15_64: number; age_65_: number;
  pop15: number; labor: number; labor_rate: number | null; workers: number;
  w1: number; w2: number; w3: number;
  commute: number; school: number; day_pop: number; dn_ratio: number | null;
  [k: string]: number | null | undefined;
};
export type CensusInd = { key: string; code: string; name: string };

const census = (ds as any).census as Record<string, Record<string, CensusRec>>;
export const CENSUS_YEARS: number[] = (ds as any).censusYears;
export const CENSUS_IND: CensusInd[] = (ds as any).censusInd;
export const CENSUS_FULL_YEARS: number[] = (ds as any).censusFullYears;
export const LATEST_CENSUS = CENSUS_YEARS[CENSUS_YEARS.length - 1];
/** 直近1回前の国勢調査（5年前）。就業・労働力の比較はこの年と行う。 */
export const PREV_CENSUS = CENSUS_FULL_YEARS[0];
/** 取り込んでいる最も古い国勢調査。人口・年齢3区分のみ。 */
export const FIRST_CENSUS = CENSUS_YEARS[0];

export function censusAt(code: string, year: number): CensusRec | undefined { return census[String(year)]?.[code]; }

/** 国勢調査の産業大分類キー → サイト内 /industry/[slug]/ のスラッグ。A・Bは経済センサスに合わせてAB(農林漁業)へ。 */
export const CENSUS_IND_TO_SLUG: Record<string, string> = {
  wA: 'agriculture-fishery', wB: 'agriculture-fishery', wC: 'mining', wD: 'construction', wE: 'manufacturing',
  wF: 'utilities', wG: 'ict', wH: 'transport', wI: 'retail', wJ: 'finance', wK: 'realestate', wL: 'professional',
  wM: 'hospitality', wN: 'lifestyle', wO: 'education', wP: 'medical', wQ: 'compound', wR: 'services',
};
/** サイトの産業スラッグ → その国勢調査就業者数（該当なしは null。公務Sと分類不能Tは対応する産業ページを持たない） */
export function censusWorkers(code: string, indSlug: string, year: number): number | null {
  const c = censusAt(code, year); if (!c) return null;
  const keys = Object.keys(CENSUS_IND_TO_SLUG).filter(k => CENSUS_IND_TO_SLUG[k] === indSlug);
  if (!keys.length) return null;
  let sum = 0, any = false;
  for (const k of keys) { const v = c[k]; if (v != null) { sum += v as number; any = true; } }
  return any ? sum : null;
}
/** 高齢化率（65歳以上人口 ÷ 年齢3区分の合計）。総数には年齢不詳が含まれ得るため分母は3区分の合計を使う。 */
export function agingRate(c: CensusRec | undefined): number | null {
  if (!c) return null;
  const d = c.age_0_14 + c.age_15_64 + c.age_65_;
  return d ? Math.round((c.age_65_ / d) * 1000) / 10 : null;
}
export function youthRate(c: CensusRec | undefined): number | null {
  if (!c) return null;
  const d = c.age_0_14 + c.age_15_64 + c.age_65_;
  return d ? Math.round((c.age_0_14 / d) * 1000) / 10 : null;
}
export function workingRate(c: CensusRec | undefined): number | null {
  if (!c) return null;
  const d = c.age_0_14 + c.age_15_64 + c.age_65_;
  return d ? Math.round((c.age_15_64 / d) * 1000) / 10 : null;
}

/* ===== 建築着工統計（2011〜2024） ===== */
export type BuildRec = {
  bldg_all: number; floor_all: number; bldg_house: number; floor_house: number;
  bldg_mixed: number; floor_mixed: number; cost_all: number | null; cost_house: number | null;
  merged: string[];
};
const building = (ds as any).building as Record<string, Record<string, BuildRec>>;
export const BUILD_YEARS: number[] = (ds as any).buildYears;
export const LATEST_BUILD = BUILD_YEARS[BUILD_YEARS.length - 1];
export const FIRST_BUILD = BUILD_YEARS[0];
/** 工事費予定額が公表されている最後の年（2020年以降の市区町村表には工事費がない） */
export const LAST_COST_YEAR = 2019;

export function buildAt(code: string, year: number): BuildRec | undefined { return building[code]?.[String(year)]; }
export function buildSeries(code: string) {
  return BUILD_YEARS.map(y => ({ year: y, ...(building[code]?.[String(y)] as BuildRec) })).filter(r => r.bldg_all != null);
}
/** 33市町村の合計（県の公表値と一致することを build_data.py で検算済み） */
export function buildPrefAt(year: number): BuildRec {
  const acc: any = { bldg_all: 0, floor_all: 0, bldg_house: 0, floor_house: 0, bldg_mixed: 0, floor_mixed: 0, cost_all: 0, cost_house: 0, merged: [] };
  for (const m of MUNIS) {
    const r = buildAt(m.code, year); if (!r) continue;
    for (const k of ['bldg_all', 'floor_all', 'bldg_house', 'floor_house', 'bldg_mixed', 'floor_mixed'] as const) acc[k] += r[k];
    if (r.cost_all != null) acc.cost_all += r.cost_all;
    if (r.cost_house != null) acc.cost_house += r.cost_house;
  }
  return acc as BuildRec;
}

/* ===== 人口動態（出生・死亡・婚姻・離婚・転入・転出／2010〜2023） ===== */
export type VitalRec = {
  births: number | null; deaths: number | null; marriages: number | null; divorces: number | null;
  in_migr: number | null; out_migr: number | null; merged: string[];
};
const vital = (ds as any).vital as Record<string, Record<string, VitalRec>>;
export const VITAL_YEARS: number[] = (ds as any).vitalYears;
export const LATEST_VITAL = VITAL_YEARS[VITAL_YEARS.length - 1];
export const FIRST_VITAL = VITAL_YEARS[0];
/** 転入者数・転出者数が市区町村別に収録されている最初の年 */
export const FIRST_MIGR_YEAR = 2018;

export function vitalAt(code: string, year: number): VitalRec | undefined { return vital[code]?.[String(year)]; }
export function vitalSeries(code: string) {
  return VITAL_YEARS.map(y => ({ year: y, ...(vital[code]?.[String(y)] as VitalRec) })).filter(r => r.births != null || r.deaths != null);
}
/** 自然増減（出生数 − 死亡数）。どちらか欠けていれば null */
export function naturalChange(v: VitalRec | undefined): number | null {
  if (!v || v.births == null || v.deaths == null) return null;
  return v.births - v.deaths;
}
/** 社会増減（転入者数 − 転出者数）。2018年以降のみ */
export function socialChange(v: VitalRec | undefined): number | null {
  if (!v || v.in_migr == null || v.out_migr == null) return null;
  return v.in_migr - v.out_migr;
}
/** 33市町村の合計（県公表値と一致することを build_data.py で検算済み） */
export function vitalPrefAt(year: number): VitalRec {
  const acc: any = { births: 0, deaths: 0, marriages: 0, divorces: 0, in_migr: 0, out_migr: 0, merged: [] };
  for (const m of MUNIS) {
    const r = vitalAt(m.code, year); if (!r) continue;
    for (const k of ['births', 'deaths', 'marriages', 'divorces', 'in_migr', 'out_migr'] as const) {
      if (r[k] != null) acc[k] += r[k] as number;
    }
  }
  return acc as VitalRec;
}

/* ===== 世帯・高齢世帯（国勢調査 2010／2015／2020） ===== */
export type HouseRec = {
  pop75: number | null; foreign: number | null; did_pop: number | null;
  households: number | null; general_hh: number | null; nuclear_hh: number | null;
  single_hh: number | null; eld_couple_hh: number | null; eld_single_hh: number | null;
  merged: string[];
};
const household = (ds as any).household as Record<string, Record<string, HouseRec>>;
export const HOUSE_YEARS: number[] = (ds as any).houseYears;
export const LATEST_HOUSE = HOUSE_YEARS[HOUSE_YEARS.length - 1];
export const PREV_HOUSE = HOUSE_YEARS[HOUSE_YEARS.length - 2];
export const FIRST_HOUSE = HOUSE_YEARS[0];
/** 75歳以上人口が収録されている最初の年（2010年は未収録） */
export const FIRST_POP75_YEAR = 2015;

export function houseAt(code: string, year: number): HouseRec | undefined { return household[code]?.[String(year)]; }
export function housePrefAt(year: number): HouseRec {
  const acc: any = { pop75: 0, foreign: 0, did_pop: 0, households: 0, general_hh: 0, nuclear_hh: 0, single_hh: 0, eld_couple_hh: 0, eld_single_hh: 0, merged: [] };
  for (const m of MUNIS) {
    const r = houseAt(m.code, year); if (!r) continue;
    for (const k of ['pop75', 'foreign', 'did_pop', 'households', 'general_hh', 'nuclear_hh', 'single_hh', 'eld_couple_hh', 'eld_single_hh'] as const) {
      if (r[k] != null) acc[k] += r[k] as number;
    }
  }
  return acc as HouseRec;
}
/** 一般世帯に占める割合（%）。分母は一般世帯数 */
export function hhShare(v: number | null | undefined, general: number | null | undefined): number | null {
  if (v == null || !general) return null;
  return Math.round((v / general) * 1000) / 10;
}

/* ===== 健康・医療（病院・病床・医師・歯科医師・薬剤師／2010〜2023） ===== */
export type MedRec = {
  hospitals: number | null; gen_hospitals: number | null; clinics: number | null; dental_clinics: number | null;
  hosp_beds: number | null; clinic_beds: number | null;
  doctors: number | null; dentists: number | null; pharmacists: number | null; merged: string[];
};
const medical = (ds as any).medical as Record<string, Record<string, MedRec>>;
export const MED_YEARS: number[] = (ds as any).medYears;
export const LATEST_MED = MED_YEARS[MED_YEARS.length - 1];
export const FIRST_MED = MED_YEARS[0];
/** 医師・歯科医師・薬剤師統計は隔年（偶数年）。直近の公表年 */
export const LATEST_DOC_YEAR = 2022;

export function medAt(code: string, year: number): MedRec | undefined { return medical[code]?.[String(year)]; }
export function medSeries(code: string) {
  return MED_YEARS.map(y => ({ year: y, ...(medical[code]?.[String(y)] as MedRec) })).filter(r => r.hospitals != null);
}
/** 33市町村の合計（県公表値と一致することを build_data.py で検算済み） */
export function medPrefAt(year: number): MedRec {
  const acc: any = { hospitals: 0, gen_hospitals: 0, clinics: 0, dental_clinics: 0, hosp_beds: 0, clinic_beds: 0, doctors: 0, dentists: 0, pharmacists: 0, merged: [] };
  for (const m of MUNIS) {
    const r = medAt(m.code, year); if (!r) continue;
    for (const k of ['hospitals', 'gen_hospitals', 'clinics', 'dental_clinics', 'hosp_beds', 'clinic_beds', 'doctors', 'dentists', 'pharmacists'] as const) {
      if (r[k] != null) acc[k] += r[k] as number;
    }
  }
  return acc as MedRec;
}
/** 人口10万人当たり（住民基本台帳人口ベース）。人口が無い年は null */
export function per100kMed(v: number | null | undefined, code: string, year: number): number | null {
  if (v == null) return null;
  const p = popAt(code, year)?.total ?? null;
  if (!p) return null;
  return Math.round((v / p) * 100000 * 10) / 10;
}

/* ===== 福祉（特別養護老人ホーム・有料老人ホーム・国民健康保険／2010〜2023） ===== */
export type WelRec = {
  tokuyo: number | null; tokuyo_cap: number | null; yuryo: number | null; yuryo_cap: number | null;
  kokuho: number | null; merged: string[];
};
const welfare = (ds as any).welfare as Record<string, Record<string, WelRec>>;
export const WEL_YEARS: number[] = (ds as any).welYears;
export const LATEST_WEL = WEL_YEARS[WEL_YEARS.length - 1];
export const FIRST_WEL = WEL_YEARS[0];
/** 社会福祉施設等調査の票が詳細票→基本票に切り替わる年 */
export const WEL_SWITCH_YEAR = 2018;

export function welAt(code: string, year: number): WelRec | undefined { return welfare[code]?.[String(year)]; }
export function welSeries(code: string) {
  return WEL_YEARS.map(y => ({ year: y, ...(welfare[code]?.[String(y)] as WelRec) })).filter(r => r.tokuyo != null || r.kokuho != null);
}
export function welPrefAt(year: number): WelRec {
  const acc: any = { tokuyo: 0, tokuyo_cap: 0, yuryo: 0, yuryo_cap: 0, kokuho: 0, merged: [] };
  for (const m of MUNIS) {
    const r = welAt(m.code, year); if (!r) continue;
    for (const k of ['tokuyo', 'tokuyo_cap', 'yuryo', 'yuryo_cap', 'kokuho'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as WelRec;
}
/** 65歳以上人口千人当たりの定員（国勢調査の65歳以上人口が分母。国勢調査年のみ） */
export function capPerElderly(cap: number | null | undefined, code: string, censusYear: number): number | null {
  if (cap == null) return null;
  const c = censusAt(code, censusYear);
  if (!c || !c.age_65_) return null;
  return Math.round((cap / c.age_65_) * 1000 * 10) / 10;
}

/* ===== ごみ・生活インフラ（2010〜2023） ===== */
export type EnvRec = {
  gomi_collect_pop: number | null; gomi_total: number | null; gomi_per_day: number | null;
  recycle_rate: number | null; landfill: number | null; flush_rate: number | null; nonflush_pop: number | null;
  merged: string[];
};
const env = (ds as any).env as Record<string, Record<string, EnvRec>>;
export const ENV_YEARS: number[] = (ds as any).envYears;
export const LATEST_ENV = ENV_YEARS[ENV_YEARS.length - 1];
export const FIRST_ENV = ENV_YEARS[0];
export function envAt(code: string, year: number): EnvRec | undefined { return env[code]?.[String(year)]; }
export function envSeries(code: string) {
  return ENV_YEARS.map(y => ({ year: y, ...(env[code]?.[String(y)] as EnvRec) })).filter(r => r.gomi_total != null);
}
export function envPrefAt(year: number): EnvRec {
  const acc: any = { gomi_collect_pop: 0, gomi_total: 0, landfill: 0, nonflush_pop: 0, gomi_per_day: null, recycle_rate: null, flush_rate: null, merged: [] };
  for (const m of MUNIS) {
    const r = envAt(m.code, year); if (!r) continue;
    for (const k of ['gomi_collect_pop', 'gomi_total', 'landfill', 'nonflush_pop'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as EnvRec;
}
/** 33市町村計から計算した1人1日当たり排出量（g）。ごみ総排出量t ÷ 計画収集人口 ÷ 365 */
export function envPrefPerDay(year: number): number | null {
  const p = envPrefAt(year);
  if (!p.gomi_total || !p.gomi_collect_pop) return null;
  return Math.round((p.gomi_total * 1_000_000) / p.gomi_collect_pop / 365);
}

/* ===== 経済（課税対象所得・製造業・耕地／2010〜） ===== */
export type TaxRec = {
  taxable_income: number | null; taxpayers: number | null; farmland: number | null;
  mfg_shipment: number | null; mfg_estab: number | null; mfg_workers: number | null; merged: string[];
};
const economy = (ds as any).economy as Record<string, Record<string, TaxRec>>;
export const ECON_YEARS: number[] = (ds as any).econYears;
export const LATEST_ECON = ECON_YEARS[ECON_YEARS.length - 1];
export const FIRST_ECON = ECON_YEARS[0];
export function econAt2(code: string, year: number): TaxRec | undefined { return economy[code]?.[String(year)]; }
/** 製造品出荷額等が33市町村すべてで公表されている最新年。課税対象所得より公表が1年遅れるため LATEST_ECON と異なることがある */
export const LATEST_MFG: number = [...ECON_YEARS].reverse().find(y => MUNIS.every(m => econAt2(m.code, y)?.mfg_shipment != null))!;
/** 工業統計の事業所数・従業者数が欠測の年（2015年は経済センサスに統合され市区町村別が無い） */
export const MFG_GAP_YEAR = 2015;
export function econSeries(code: string) {
  return ECON_YEARS.map(y => ({ year: y, ...(economy[code]?.[String(y)] as TaxRec) })).filter(r => r.taxable_income != null);
}
export function econPrefAt(year: number): TaxRec {
  const acc: any = { taxable_income: 0, taxpayers: 0, farmland: 0, mfg_shipment: 0, mfg_estab: 0, mfg_workers: 0, merged: [] };
  for (const m of MUNIS) {
    const r = econAt2(m.code, year); if (!r) continue;
    for (const k of ['taxable_income', 'taxpayers', 'farmland', 'mfg_shipment', 'mfg_estab', 'mfg_workers'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as TaxRec;
}
/** 納税義務者1人当たり課税対象所得（円）。所得の平均ではなく、課税対象所得÷納税義務者数 */
export function incomePerTaxpayer(r: TaxRec | undefined): number | null {
  if (!r || !r.taxable_income || !r.taxpayers) return null;
  return Math.round((r.taxable_income * 1000) / r.taxpayers);
}

/* ===== 学校（幼稚園・小中高／2010〜） ===== */
export type SchoolRec = {
  kg: number | null; kg_pupils: number | null;
  es: number | null; es_teachers: number | null; es_pupils: number | null;
  jhs: number | null; jhs_teachers: number | null; jhs_students: number | null;
  hs: number | null; hs_students: number | null; merged: string[];
};
const school = (ds as any).school as Record<string, Record<string, SchoolRec>>;
export const SCHOOL_YEARS: number[] = (ds as any).schoolYears;
export const LATEST_SCHOOL = SCHOOL_YEARS[SCHOOL_YEARS.length - 1];
export const FIRST_SCHOOL = SCHOOL_YEARS[0];
export function schoolAt(code: string, year: number): SchoolRec | undefined { return school[code]?.[String(year)]; }
export function schoolSeries(code: string) {
  return SCHOOL_YEARS.map(y => ({ year: y, ...(school[code]?.[String(y)] as SchoolRec) })).filter(r => r.es != null);
}
export function schoolPrefAt(year: number): SchoolRec {
  const acc: any = { kg: 0, kg_pupils: 0, es: 0, es_teachers: 0, es_pupils: 0, jhs: 0, jhs_teachers: 0, jhs_students: 0, hs: 0, hs_students: 0, merged: [] };
  for (const m of MUNIS) {
    const r = schoolAt(m.code, year); if (!r) continue;
    for (const k of ['kg', 'kg_pupils', 'es', 'es_teachers', 'es_pupils', 'jhs', 'jhs_teachers', 'jhs_students', 'hs', 'hs_students'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as SchoolRec;
}
/** 小学校1校当たり児童数 */
export function pupilsPerSchool(n: number | null | undefined, schools: number | null | undefined): number | null {
  if (n == null || !schools) return null;
  return Math.round((n / schools) * 10) / 10;
}

/* ===== 労働力・完全失業率（国勢調査 2010/2015/2020） ===== */
export type JoblessRec = {
  labor: number | null; workers: number | null; jobless: number | null; workers65: number | null; merged: string[];
};
const jobless = (ds as any).jobless as Record<string, Record<string, JoblessRec>>;
export const JOBLESS_YEARS: number[] = (ds as any).joblessYears;
export const LATEST_JOBLESS = JOBLESS_YEARS[JOBLESS_YEARS.length - 1];
export const FIRST_JOBLESS = JOBLESS_YEARS[0];
export function joblessAt(code: string, year: number): JoblessRec | undefined { return jobless[code]?.[String(year)]; }
export function joblessSeries(code: string) {
  return JOBLESS_YEARS.map(y => ({ year: y, ...(jobless[code]?.[String(y)] as JoblessRec) })).filter(r => r.labor != null);
}
export function joblessPrefAt(year: number): JoblessRec {
  const acc: any = { labor: 0, workers: 0, jobless: 0, workers65: 0, merged: [] };
  for (const m of MUNIS) {
    const r = joblessAt(m.code, year); if (!r) continue;
    for (const k of ['labor', 'workers', 'jobless', 'workers65'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as JoblessRec;
}
/** 完全失業率(%) = 完全失業者 ÷ 労働力人口 */
export function joblessRate(r: { jobless: number | null; labor: number | null } | undefined): number | null {
  if (!r || r.jobless == null || !r.labor) return null;
  return Math.round((r.jobless / r.labor) * 1000) / 10;
}
/** 就業者に占める65歳以上の割合(%) */
export function elderWorkerShare(r: { workers65: number | null; workers: number | null } | undefined): number | null {
  if (!r || r.workers65 == null || !r.workers) return null;
  return Math.round((r.workers65 / r.workers) * 1000) / 10;
}

/* ===== 最終学歴人口（国勢調査 2010/2020） ===== */
export type EduRec = {
  grad_total: number | null; grad_jhs: number | null; grad_hs: number | null;
  grad_col: number | null; grad_univ: number | null; merged: string[];
};
const education = (ds as any).education as Record<string, Record<string, EduRec>>;
export const EDU_YEARS: number[] = (ds as any).eduYears;
export const LATEST_EDU = EDU_YEARS[EDU_YEARS.length - 1];
export const FIRST_EDU = EDU_YEARS[0];
export function eduAt(code: string, year: number): EduRec | undefined { return education[code]?.[String(year)]; }
export function eduSeries(code: string) {
  return EDU_YEARS.map(y => ({ year: y, ...(education[code]?.[String(y)] as EduRec) })).filter(r => r.grad_total != null);
}
export function eduPrefAt(year: number): EduRec {
  const acc: any = { grad_total: 0, grad_jhs: 0, grad_hs: 0, grad_col: 0, grad_univ: 0, merged: [] };
  for (const m of MUNIS) {
    const r = eduAt(m.code, year); if (!r) continue;
    for (const k of ['grad_total', 'grad_jhs', 'grad_hs', 'grad_col', 'grad_univ'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as EduRec;
}
/** 卒業者に占める割合(%) */
export function eduShare(n: number | null | undefined, total: number | null | undefined): number | null {
  if (n == null || !total) return null;
  return Math.round((n / total) * 1000) / 10;
}

/* ===== 農家数・耕作放棄地（農林業センサス 2009/2014/2019） ===== */
export type FarmRec = {
  sales_farms: number | null; self_farms: number | null; full_farms: number | null;
  part_farms: number | null; abandoned: number | null; merged: string[];
};
const farm = (ds as any).farm as Record<string, Record<string, FarmRec>>;
export const FARM_YEARS: number[] = (ds as any).farmYears;
export const LATEST_FARM = FARM_YEARS[FARM_YEARS.length - 1];
export const FIRST_FARM = FARM_YEARS[0];
/** 耕作放棄地が調査された最後の年（2020年センサスでは廃止） */
export const LAST_ABANDONED_YEAR = 2014;
export function farmAt(code: string, year: number): FarmRec | undefined { return farm[code]?.[String(year)]; }
export function farmSeries(code: string) {
  return FARM_YEARS.map(y => ({ year: y, ...(farm[code]?.[String(y)] as FarmRec) })).filter(r => r.sales_farms != null);
}
export function farmPrefAt(year: number): FarmRec {
  const acc: any = { sales_farms: 0, self_farms: 0, full_farms: 0, part_farms: 0, abandoned: 0, merged: [] };
  for (const m of MUNIS) {
    const r = farmAt(m.code, year); if (!r) continue;
    for (const k of ['sales_farms', 'self_farms', 'full_farms', 'part_farms', 'abandoned'] as const) if (r[k] != null) acc[k] += r[k] as number;
  }
  return acc as FarmRec;
}
/** 総農家数 = 販売農家 + 自給的農家 */
export function totalFarms(r: { sales_farms: number | null; self_farms: number | null } | undefined): number | null {
  if (!r || r.sales_farms == null || r.self_farms == null) return null;
  return r.sales_farms + r.self_farms;
}

/* ===== 街頭犯罪（岩手県警オープンデータ 2016〜2025） ===== */
export type CrimeRec = { total: number } & Record<string, number>;
const crime = (ds as any).crime as Record<string, Record<string, CrimeRec>>;
export const CRIME_YEARS: number[] = (ds as any).crimeYears;
export const CRIME_TYPES: string[] = (ds as any).crimeTypes;
export const LATEST_CRIME = CRIME_YEARS[CRIME_YEARS.length - 1];
export const FIRST_CRIME = CRIME_YEARS[0];
/** 県警が7手口すべてを通年で公開している最初の年。2016・2017年は一部手口・一部期間しかない */
export const CRIME_FULL_FROM = 2018;

export function crimeAt(code: string, year: number): CrimeRec | undefined { return crime[code]?.[String(year)]; }
export function crimeSeries(code: string): ({ year: number } & CrimeRec)[] {
  return CRIME_YEARS.map(y => ({ year: y, ...(crime[code]?.[String(y)] as CrimeRec) }));
}
/** 33市町村の合計（総件数が原データと一致することを build_data.py で検算済み） */
export function crimePrefAt(year: number): CrimeRec {
  const acc: any = { total: 0 };
  for (const t of CRIME_TYPES) acc[t] = 0;
  for (const m of MUNIS) {
    const r = crimeAt(m.code, year); if (!r) continue;
    for (const t of CRIME_TYPES) acc[t] += r[t] ?? 0;
    acc.total += r.total;
  }
  return acc as CrimeRec;
}
/** 人口千人当たりの件数。分母は翌年1月1日の住民基本台帳人口（その年の発生に最も近い確定人口） */
export function crimePerKpop(count: number | null | undefined, code: string, year: number): number | null {
  if (count == null) return null;
  const p = popAt(code, Math.min(year + 1, LATEST_POP));
  if (!p || !p.total) return null;
  return Math.round((count / p.total) * 1000 * 100) / 100;
}
/** 33市町村の人口合計を分母にした県平均（千人当たり） */
export function crimePrefPerKpop(year: number): number | null {
  const t = MUNIS.reduce((a, m) => a + (popAt(m.code, Math.min(year + 1, LATEST_POP))?.total ?? 0), 0);
  return t ? Math.round((crimePrefAt(year).total / t) * 1000 * 100) / 100 : null;
}

/* ===== 介護サービス事業所（介護サービス情報公表システム 2024-12 / 2026-06） ===== */
export type KaigoCell = { offices: number; capacity: number };
const kaigo = (ds as any).kaigo as Record<string, Record<string, Record<string, KaigoCell>>>;
export const KAIGO_SNAPS: string[] = (ds as any).kaigoSnaps;
export const KAIGO_SERVICES: string[] = (ds as any).kaigoServices;
export const LATEST_KAIGO = KAIGO_SNAPS[KAIGO_SNAPS.length - 1];
export const FIRST_KAIGO = KAIGO_SNAPS[0];
/** 時点ラベル（"2026-06" → "2026年6月末"） */
export function kaigoLabel(snap: string): string {
  const [y, m] = snap.split('-');
  return `${y}年${Number(m)}月末`;
}
/** サービス種別ごとの事業所数・定員。service を省くと全種別の合計 */
export function kaigoAt(code: string, snap: string, service?: string): KaigoCell | undefined {
  const d = kaigo[code]?.[snap]; if (!d) return undefined;
  return service ? d[service] : d['_total'];
}
/** 33市町村の合計 */
export function kaigoPrefAt(snap: string, service?: string): KaigoCell {
  const acc = { offices: 0, capacity: 0 };
  for (const m of MUNIS) {
    const r = kaigoAt(m.code, snap, service); if (!r) continue;
    acc.offices += r.offices; acc.capacity += r.capacity;
  }
  return acc;
}
/** その市町村に1件以上ある種別だけを、事業所数の多い順で返す */
export function kaigoServicesOf(code: string, snap: string): { service: string; cell: KaigoCell }[] {
  const d = kaigo[code]?.[snap] ?? {};
  return Object.entries(d).filter(([k]) => !k.startsWith('_'))
    .map(([service, cell]) => ({ service, cell: cell as KaigoCell }))
    .sort((a, b) => b.cell.offices - a.cell.offices);
}
/** 65歳以上人口千人当たりの事業所数（分母は国勢調査の65歳以上人口） */
export function officesPerElderly(offices: number | null | undefined, code: string, censusYear: number): number | null {
  if (offices == null) return null;
  const c = censusAt(code, censusYear);
  if (!c || !c.age_65_) return null;
  return Math.round((offices / c.age_65_) * 1000 * 100) / 100;
}

/* ===== 医療機関・薬局の届出情報（医療情報ネット 2025-12-01） ===== */
export type IryouCell = { facilities: number; with_url: number };
const iryou = (ds as any).iryou as Record<string, Record<string, IryouCell>>;
export const IRYOU_TYPES: string[] = (ds as any).iryouTypes;
export const IRYOU_ASOF: string = (ds as any).iryouAsOf;
/** 表示用の時点ラベル（"2025-12-01" → "2025年12月1日"） */
export const IRYOU_ASOF_LABEL = (() => {
  const [y, m, d] = IRYOU_ASOF.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
})();

/** 施設種別ごとの施設数・HP公表数。type を省くと全種別の合計 */
export function iryouAt(code: string, type?: string): IryouCell | undefined {
  const d = iryou[code]; if (!d) return undefined;
  return type ? d[type] : d['_total'];
}
/** 33市町村の合計 */
export function iryouPref(type?: string): IryouCell {
  const acc = { facilities: 0, with_url: 0 };
  for (const m of MUNIS) {
    const r = iryouAt(m.code, type); if (!r) continue;
    acc.facilities += r.facilities; acc.with_url += r.with_url;
  }
  return acc;
}
/** ホームページを届け出ている施設の割合（%、小数1桁）。施設が0なら null */
export function urlRate(c: IryouCell | undefined): number | null {
  if (!c || !c.facilities) return null;
  return Math.round((c.with_url / c.facilities) * 1000) / 10;
}
/** 人口1万人当たりの施設数（住民基本台帳。医療情報ネットの時点に最も近い年を分母にする） */
export function facPer10k(facilities: number | null | undefined, code: string): number | null {
  if (facilities == null) return null;
  const y = Math.min(Number(IRYOU_ASOF.slice(0, 4)) + 1, LATEST_POP);
  const p = popAt(code, y);
  if (!p || !p.total) return null;
  return Math.round((facilities / p.total) * 10000 * 100) / 100;
}

/* ===== 学校コード（現存校・2021年以降の廃校／文科省 2026-05-20） ===== */
export type ClosedSchool = { kind: string; year: number; name: string };
const schoolActive = (ds as any).schoolActive as Record<string, Record<string, number>>;
const schoolClosed = (ds as any).schoolClosed as Record<string, ClosedSchool[]>;
export const SCHOOL_KINDS: string[] = (ds as any).schoolKinds;
export const SCHOOL_ASOF: string = (ds as any).schoolAsOf;
export const CLOSED_YEARS: number[] = (ds as any).closedYears;
export const FIRST_CLOSED = CLOSED_YEARS[0];
export const LATEST_CLOSED = CLOSED_YEARS[CLOSED_YEARS.length - 1];

/** 現存校数。kind を省くと全種別の合計 */
export function schoolCodeAt(code: string, kind?: string): number {
  const d = schoolActive[code]; if (!d) return 0;
  return kind ? (d[kind] ?? 0) : (d['_total'] ?? 0);
}
/** その市町村で2021年以降に廃止された学校（年→種別→名前の順） */
export function closedAt(code: string): ClosedSchool[] { return schoolClosed[code] ?? []; }
/** 33市町村の現存校合計 */
export function schoolCodePref(kind?: string): number {
  return MUNIS.reduce((a, m) => a + schoolCodeAt(m.code, kind), 0);
}
/** 33市町村の廃校をまとめて返す */
export function closedPref(): (ClosedSchool & { code: string })[] {
  return MUNIS.flatMap(m => closedAt(m.code).map(x => ({ ...x, code: m.code })));
}
/** 廃校数 ÷（現存校＋廃校）。この5年でどれだけ減ったかの目安（%、小数1桁） */
export function closedShare(code: string): number | null {
  const c = closedAt(code).length, a = schoolCodeAt(code);
  if (!(a + c)) return null;
  return Math.round((c / (a + c)) * 1000) / 10;
}

/* ===== 障害福祉サービス事業所（WAM 障害福祉サービス等情報公表 2026-03） ===== */
export type ShofukuCell = { offices: number; with_url: number };
const shofuku = (ds as any).shofuku as Record<string, Record<string, ShofukuCell>>;
export const SHOFUKU_SERVICES: string[] = (ds as any).shofukuServices;
export const SHOFUKU_ASOF: string = (ds as any).shofukuAsOf;
export const SHOFUKU_ASOF_LABEL = (() => {
  const [y, m] = SHOFUKU_ASOF.split('-');
  return `${y}年${Number(m)}月末`;
})();

/** サービス種別ごとの事業所数・HP公表数。service を省くと全種別の合計 */
export function shofukuAt(code: string, service?: string): ShofukuCell | undefined {
  const d = shofuku[code]; if (!d) return undefined;
  return service ? d[service] : d['_total'];
}
/** 33市町村の合計 */
export function shofukuPref(service?: string): ShofukuCell {
  const acc = { offices: 0, with_url: 0 };
  for (const m of MUNIS) {
    const r = shofukuAt(m.code, service); if (!r) continue;
    acc.offices += r.offices; acc.with_url += r.with_url;
  }
  return acc;
}
/** その市町村に1件以上ある種別を、事業所数の多い順で返す */
export function shofukuServicesOf(code: string): { service: string; cell: ShofukuCell }[] {
  const d = shofuku[code] ?? {};
  return Object.entries(d).filter(([k]) => !k.startsWith('_'))
    .map(([service, cell]) => ({ service, cell: cell as ShofukuCell }))
    .sort((a, b) => b.cell.offices - a.cell.offices);
}
/** HP公表率（%、小数1桁） */
export function shofukuUrlRate(c: ShofukuCell | undefined): number | null {
  if (!c || !c.offices) return null;
  return Math.round((c.with_url / c.offices) * 1000) / 10;
}
/** 人口1万人当たりの事業所数 */
export function shofukuPer10k(offices: number | null | undefined, code: string): number | null {
  if (offices == null) return null;
  const p = popAt(code, LATEST_POP);
  if (!p || !p.total) return null;
  return Math.round((offices / p.total) * 10000 * 100) / 100;
}

/* ===== 交通事故（警察庁オープンデータ 2019〜2024） ===== */
export type TrafficRec = { accidents: number; deaths: number; injuries: number; fatal_accidents: number };
const traffic = (ds as any).traffic as Record<string, Record<string, TrafficRec>>;
export const TRAFFIC_YEARS: number[] = (ds as any).trafficYears;
export const LATEST_TRAFFIC = TRAFFIC_YEARS[TRAFFIC_YEARS.length - 1];
export const FIRST_TRAFFIC = TRAFFIC_YEARS[0];

export function trafficAt(code: string, year: number): TrafficRec | undefined { return traffic[code]?.[String(year)]; }
export function trafficSeries(code: string) {
  return TRAFFIC_YEARS.map(y => ({ year: y, ...(traffic[code]?.[String(y)] as TrafficRec) })).filter(r => r.accidents != null);
}
/** 33市町村の合計（県計が原データと一致することを build_data.py で検算済み） */
export function trafficPrefAt(year: number): TrafficRec {
  const acc: any = { accidents: 0, deaths: 0, injuries: 0, fatal_accidents: 0 };
  for (const m of MUNIS) {
    const r = trafficAt(m.code, year); if (!r) continue;
    for (const k of ['accidents', 'deaths', 'injuries', 'fatal_accidents'] as const) acc[k] += r[k];
  }
  return acc as TrafficRec;
}
/** 人口1万人当たりの事故件数（分母はその年の翌年1月1日の住民基本台帳人口） */
export function accPer10k(accidents: number | null | undefined, code: string, year: number): number | null {
  if (accidents == null) return null;
  const p = popAt(code, Math.min(year + 1, LATEST_POP));
  if (!p || !p.total) return null;
  return Math.round((accidents / p.total) * 10000 * 10) / 10;
}
/** 死亡事故率（死亡事故 ÷ 人身事故、%、小数2桁） */
export function fatalRate(r: TrafficRec | undefined): number | null {
  if (!r || !r.accidents) return null;
  return Math.round((r.fatal_accidents / r.accidents) * 10000) / 100;
}

/* ===== 法人（国税庁 法人番号公表サイト 2026-08-31） ===== */
const houjin = (ds as any).houjin as Record<string, Record<string, number>>;
const houjinNew = (ds as any).houjinNew as Record<string, Record<string, number>>;
const houjinClosed = (ds as any).houjinClosed as Record<string, number>;
export const HOUJIN_KINDS: string[] = (ds as any).houjinKinds;
export const HOUJIN_YEARS: number[] = (ds as any).houjinYears;
export const HOUJIN_ASOF: string = (ds as any).houjinAsOf;
export const HOUJIN_ASOF_LABEL = (() => {
  const [y, m, d] = HOUJIN_ASOF.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
})();
export const FIRST_HOUJIN_YEAR = HOUJIN_YEARS[0];
export const LATEST_HOUJIN_YEAR = HOUJIN_YEARS[HOUJIN_YEARS.length - 1];

/** 現存法人数。kind を省くと全種別の合計 */
export function houjinAt(code: string, kind?: string): number {
  const d = houjin[code]; if (!d) return 0;
  return kind ? (d[kind] ?? 0) : (d['_total'] ?? 0);
}
/** 法人番号の指定年が year の法人数（2016年以降＝実質的な新設） */
export function houjinNewAt(code: string, year: number): number { return houjinNew[code]?.[String(year)] ?? 0; }
/** 登記記録が閉鎖された法人の数（累計） */
export function houjinClosedAt(code: string): number { return houjinClosed[code] ?? 0; }
/** 33市町村の合計 */
export function houjinPref(kind?: string): number { return MUNIS.reduce((a, m) => a + houjinAt(m.code, kind), 0); }
export function houjinNewPref(year: number): number { return MUNIS.reduce((a, m) => a + houjinNewAt(m.code, year), 0); }
export function houjinClosedPref(): number { return MUNIS.reduce((a, m) => a + houjinClosedAt(m.code), 0); }
/** 人口千人当たりの法人数 */
export function corpsPerKpop(corps: number | null | undefined, code: string): number | null {
  if (corps == null) return null;
  const p = popAt(code, LATEST_POP);
  if (!p || !p.total) return null;
  return Math.round((corps / p.total) * 1000 * 10) / 10;
}
/** 有限会社が現存法人に占める割合（%、小数1桁）。会社構成の古さの目安 */
export function yugenShare(code: string): number | null {
  const t = houjinAt(code); if (!t) return null;
  return Math.round((houjinAt(code, '有限会社') / t) * 1000) / 10;
}

/* ===== 保育所等の定員・申込者・待機児童（こども家庭庁 2026-04-01） ===== */
export type HoikuRec = {
  capacity: number; applicants: number; waiting: number;
  on_leave: number; specific_only: number; job_paused: number;
};
const hoiku = (ds as any).hoiku as Record<string, HoikuRec>;
export const HOIKU_ASOF: string = (ds as any).hoikuAsOf;
export const HOIKU_ASOF_LABEL = (() => {
  const [y, m, d] = HOIKU_ASOF.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
})();

export function hoikuAt(code: string): HoikuRec | undefined { return hoiku[code]; }
/** 33市町村の合計 */
export function hoikuPref(): HoikuRec {
  const acc: any = { capacity: 0, applicants: 0, waiting: 0, on_leave: 0, specific_only: 0, job_paused: 0 };
  for (const m of MUNIS) {
    const r = hoikuAt(m.code); if (!r) continue;
    for (const k of Object.keys(acc)) acc[k] += (r as any)[k];
  }
  return acc as HoikuRec;
}
/** 申込者 ÷ 定員（%、小数1桁）。100%を超えると定員より申込のほうが多い */
export function hoikuFillRate(r: HoikuRec | undefined): number | null {
  if (!r || !r.capacity) return null;
  return Math.round((r.applicants / r.capacity) * 1000) / 10;
}
/** 定員の空き（定員 − 申込者）。マイナスなら申込が定員を超えている */
export function hoikuSlack(r: HoikuRec | undefined): number | null {
  if (!r) return null;
  return r.capacity - r.applicants;
}
/** 待機児童に数えないが預けられていない子ども（育休中＋特定園のみ希望＋求職活動休止） */
export function hoikuHidden(r: HoikuRec | undefined): number | null {
  if (!r) return null;
  return r.on_leave + r.specific_only + r.job_paused;
}
