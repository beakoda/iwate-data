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
