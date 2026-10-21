import ds from '@/data/dataset.json';
import { MUNIS } from '@/lib/data';

/** 岩手県内Webサイト調査（独自調査）。raw/web_survey.csv 由来。事業者名は持たない */
export type WebCell = {
  sites: number; audited: number; avg_overall: number | null; avg_seo: number | null; avg_aeo: number | null;
  grade_S: number; grade_A: number; grade_B: number; grade_C: number; grade_D: number;
  seo_high_aeo_low: number; wordpress: number; ai_bots_blocked: number;
  [k: `pass_${string}`]: number;
};
const web = (ds as any).web as Record<string, Record<string, WebCell>>;
export const WEB_CATS: string[] = ((ds as any).webCats as string[]).filter(c => c !== '全業種');
export const WEB_META = (ds as any).webMeta as { run: string; collected: string; sources: string[]; sites: number; audited: number };
export const WEB_CHECKS: string[] = (ds as any).webChecks;
export const WEB_ALL = '全業種';

/** "2026-10-21" → "2026年10月" */
export const WEB_ASOF_LABEL = (() => { const [y, m] = WEB_META.collected.split('-'); return `${y}年${Number(m)}月`; })();

export function webAt(cat: string, code: string): WebCell | undefined { return web[cat]?.[code]; }
export function webPref(cat = WEB_ALL): WebCell { return web[cat]['03000']; }

/** a / b の割合（%、小数1桁）。b が0なら null */
export function share(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || !b) return null;
  return Math.round((a / b) * 1000) / 10;
}

/** 合格率（%）。対象は取得できたサイト */
export function passRate(c: WebCell | undefined, id: string): number | null {
  return c ? share(c[`pass_${id}`], c.audited) : null;
}

export const CHECK_LABEL: Record<string, { label: string; axis: 'SEO' | 'AI' }> = {
  https: { label: '常時SSL（https）', axis: 'SEO' }, title: { label: 'タイトルが適切な長さ', axis: 'SEO' },
  description: { label: 'メタディスクリプションが適切', axis: 'SEO' }, h1: { label: 'H1見出しが1つ', axis: 'SEO' },
  'heading-structure': { label: '見出しが3つ以上', axis: 'SEO' }, viewport: { label: 'スマホ表示の設定（viewport）', axis: 'SEO' },
  lang: { label: '言語の指定（lang）', axis: 'SEO' }, canonical: { label: 'canonicalタグ', axis: 'SEO' },
  ogp: { label: 'SNSシェア用の設定（OGP 3点）', axis: 'SEO' }, 'img-alt': { label: '画像の8割以上に代替テキスト', axis: 'SEO' },
  'internal-links': { label: '内部リンク5本以上', axis: 'SEO' }, 'content-volume': { label: '本文800文字以上', axis: 'SEO' },
  sitemap: { label: 'XMLサイトマップ', axis: 'SEO' }, robots: { label: 'robots.txt（クロール許可）', axis: 'SEO' },
  ttfb: { label: '応答0.8秒以内', axis: 'SEO' },
  jsonld: { label: '構造化データ2種類以上', axis: 'AI' }, 'ai-bots': { label: 'AIクローラを拒否していない（robots.txtあり）', axis: 'AI' },
  faq: { label: 'FAQの構造化データ', axis: 'AI' }, eeat: { label: '運営者・専門性の記載', axis: 'AI' },
  'llms-txt': { label: 'llms.txt', axis: 'AI' }, 'answer-first': { label: '冒頭に結論・定義の一文', axis: 'AI' },
  'structured-content': { label: 'リスト・表が3つ以上', axis: 'AI' }, freshness: { label: '日付・更新日の表示', axis: 'AI' },
  'semantic-html': { label: '文書構造のタグ（main等）4種以上', axis: 'AI' }, nap: { label: '電話と住所の両方を記載', axis: 'AI' },
};

/** 市町村ごとの全業種セル（調査対象サイトがある市町村だけ） */
export function webMunis() {
  return MUNIS.map(m => ({ m, c: webAt(WEB_ALL, m.code) })).filter((r): r is { m: typeof r.m; c: WebCell } => !!r.c);
}
