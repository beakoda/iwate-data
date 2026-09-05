import ds from '@/data/dataset.json';

export type Muni = { code: string; name: string; slug: string; kind: string; gun: string };
export type Industry = { code: string; name: string; slug: string };
export type DentalRec = { dent: number; gen: number; gen_beds: number; gen_with_beds: number; merged: string[] };
export type PopRec = { total: number; households: number; births: number; deaths: number; in: number; out: number };
export type EconRec = { estab: number | null; workers: number | null; sales?: number | null; sales_raw?: string };

export const SITE = {
  name: 'いわてデータ',
  nameEn: 'iwate-data',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://iwate-data.jp',
  publisher: 'ビークプロモーション株式会社',
  publisherUrl: 'https://beak-promo.jp/',
  description: '岩手県33市町村の公的統計を、市町村×業種の粒度で整理して公開するデータサイト。出典はすべて政府統計（e-Stat）。',
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
