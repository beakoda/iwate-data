/* 埋め込みウィジェット。layout.tsx を通さない素のHTMLを返す（iframeで外部サイトに貼る用）。
   noindex は public/_headers の X-Robots-Tag で付ける。 */
import { MUNIS, SITE, muniBySlug, popAt, dentalAt, econAt, censusAt, agingRate, per100k, fmt, LATEST_POP, LATEST_DENTAL, LATEST_CENSUS, vitalAt, LATEST_VITAL, joblessAt, joblessRate, LATEST_JOBLESS } from '@/lib/data';

export const dynamic = 'force-static';
// index.html という名前で出力させ、/embed/city/{slug}/ がそのままHTMLとして配信されるようにする
export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug, file: 'index.html' })); }

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const p = popAt(m.code, LATEST_POP)!, c = censusAt(m.code, LATEST_CENSUS), d = dentalAt(m.code, LATEST_DENTAL)!;
  const e = econAt(m.code, 'AR')?.['2021'], v = vitalAt(m.code, LATEST_VITAL), j = joblessAt(m.code, LATEST_JOBLESS);
  const items: [string, string, string, string][] = [
    ['人口', fmt(p.total), '人', `${LATEST_POP}年1月`],
    ['高齢化率', fmt(agingRate(c)), '%', `${LATEST_CENSUS}年`],
    ['世帯数', fmt(p.households), '世帯', `${LATEST_POP}年1月`],
    ['出生数', fmt(v?.births), '人', `${LATEST_VITAL}年`],
    ['民営事業所', fmt(e?.estab), '所', '2021年'],
    ['完全失業率', fmt(joblessRate(j)), '%', `${LATEST_JOBLESS}年`],
  ];
  const url = `${SITE.url}/city/${m.slug}/`;
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(m.name)}の主要統計 | ${SITE.name}</title>
<style>
body{margin:0;font-family:'Noto Sans JP','Hiragino Sans',Meiryo,system-ui,sans-serif;color:#1A1A1C;background:#fff;font-size:14px;line-height:1.5}
.w{padding:14px 16px}.h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px}
.h b{font-size:16px}.h a{color:#0017C1;font-size:12px;text-decoration:none;font-weight:700}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.c{border:1px solid #E6E6E6;border-radius:8px;padding:8px 10px}.l{font-size:11px;color:#767676}.v{font-size:20px;font-weight:700;line-height:1.2;margin:2px 0}.v small{font-size:11px;font-weight:400;margin-left:2px}.y{font-size:10px;color:#949494}
.f{margin-top:10px;font-size:11px;color:#767676}.f a{color:#0017C1}
@media(max-width:420px){.g{grid-template-columns:repeat(2,1fr)}}
</style></head><body><div class="w">
<div class="h"><b>${esc(m.name)}の主要統計</b><a href="${url}" target="_blank" rel="noopener">${SITE.name}で詳しく見る →</a></div>
<div class="g">${items.map(([l, val, u, y]) => `<div class="c"><div class="l">${l}</div><div class="v">${val}<small>${u}</small></div><div class="y">${y}</div></div>`).join('')}</div>
<div class="f">出典: 政府統計（e-Stat）を<a href="${url}" target="_blank" rel="noopener">${SITE.name}</a>が市町村別に集計。数値は公表値のまま。</div>
</div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
