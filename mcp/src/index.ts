/* いわてデータ MCP サーバー — Cloudflare Worker
   ステートレスな MCP Streamable HTTP（POST /mcp に JSON-RPC、応答は application/json）。
   セッションもSSEも使わない。データは data/dataset.json をバンドル。 */
import ds from '../../data/dataset.json';
import { DATASETS, DERIVED, type Dataset } from './catalog';

const SITE = 'https://iwate-data.jp';
const SERVER = { name: 'iwate-data', version: '1.0.0' };
const PROTOCOL = '2025-06-18';

type Muni = { code: string; name: string; slug: string; kind: string; gun: string };
const MUNIS: Muni[] = (ds as any).municipalities;
const PREF = (ds as any).pref as { code: string; name: string };
const SOURCES = (ds as any).sources as Record<string, { name: string; url: string; note?: string }>;

/* ---------- データアクセス ---------- */
function yearsOf(d: Dataset): number[] {
  if (d.yearsKey) return (ds as any)[d.yearsKey] as number[];
  const table = (ds as any)[d.dsKey]; const any = table[MUNIS[0].code] || {};
  return Object.keys(any).map(Number).sort((a, b) => a - b);
}
function recAt(d: Dataset, code: string, year: number): Record<string, any> | undefined {
  const t = (ds as any)[d.dsKey];
  return d.byYear ? t?.[String(year)]?.[code] : t?.[code]?.[String(year)];
}
function latestYear(d: Dataset, code = MUNIS[0].code): number {
  const ys = yearsOf(d);
  for (let i = ys.length - 1; i >= 0; i--) { const r = recAt(d, code, ys[i]); if (r && Object.values(r).some(v => v != null && !Array.isArray(v))) return ys[i]; }
  return ys[ys.length - 1];
}
/** 県値: 合算できる列は33市町村の合計、率は合計から再計算 */
function prefRec(d: Dataset, year: number): Record<string, any> {
  const acc: Record<string, any> = {};
  for (const c of d.cols) if (c.sum) acc[c.key] = 0;
  for (const m of MUNIS) { const r = recAt(d, m.code, year); if (!r) continue; for (const c of d.cols) if (c.sum && r[c.key] != null) acc[c.key] += r[c.key]; }
  return acc;
}
function datasetById(id: string): Dataset | undefined { return DATASETS.find(d => d.id === id); }
function findMuni(q: string): Muni | undefined {
  const s = String(q).trim();
  return MUNIS.find(m => m.code === s || m.slug === s.toLowerCase() || m.name === s || m.name.replace(/[市町村]$/, '') === s.replace(/[市町村]$/, ''));
}
function round(v: number | null, dec: number): number | null { return v == null ? null : Math.round(v * 10 ** dec) / 10 ** dec; }
function indicatorsOf(d: Dataset) {
  return [...d.cols.map(c => ({ id: c.key, label: c.label, unit: c.unit, derived: false })),
          ...DERIVED.filter(x => x.dataset === d.id).map(x => ({ id: x.id, label: x.label, unit: x.unit, derived: true }))];
}
function valueOf(d: Dataset, r: Record<string, any> | undefined, ind: string): number | null {
  if (!r) return null;
  const dv = DERIVED.find(x => x.id === ind && x.dataset === d.id);
  if (dv) return round(dv.fn(r), dv.decimals);
  const v = r[ind]; return typeof v === 'number' ? v : null;
}
function cite(d: Dataset, m?: Muni) {
  const s = SOURCES[d.source];
  return { dataset_label: d.label, source: s?.name, source_url: s?.url, page: `${SITE}/${d.path}/${m ? m.slug + '/' : ''}`, note: s?.note, license: 'CC BY 4.0（出典「いわてデータ」を明記）' };
}

/* ---------- ツール ---------- */
const TOOLS = [
  { name: 'list_municipalities', description: '岩手県33市町村の一覧（コード・名前・slug・市町村の別・郡）。他のツールの municipality 引数にはコード（03201）・slug（morioka）・日本語名（盛岡市／盛岡）のどれでも渡せる。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'list_datasets', description: 'このサーバーが持つ15分野のデータセットと、各分野の指標（列）・派生指標（率）・収録年・出典を返す。まずこれで指標IDを確認する。',
    inputSchema: { type: 'object', properties: { dataset: { type: 'string', description: '1分野だけ見たいときにID（例: jobless）' } }, additionalProperties: false } },
  { name: 'get_municipality_stats', description: '1つの市町村の統計を返す。dataset を省略すると全15分野の最新年をまとめて返す（市町村の全体像を知りたいとき）。year を省略すると最新年。全年欲しいときは all_years=true。',
    inputSchema: { type: 'object', required: ['municipality'], properties: { municipality: { type: 'string', description: 'コード・slug・日本語名のいずれか' }, dataset: { type: 'string', description: 'list_datasets のID' }, year: { type: 'integer' }, all_years: { type: 'boolean', description: '時系列を全部返す（dataset 指定時のみ）' } }, additionalProperties: false } },
  { name: 'rank_municipalities', description: 'ある指標で33市町村をランキングする。県計（33市町村合計または合計から計算した率）も添える。indicator は列ID（jobless）でも派生指標ID（jobless_rate）でもよい。',
    inputSchema: { type: 'object', required: ['dataset', 'indicator'], properties: { dataset: { type: 'string' }, indicator: { type: 'string' }, year: { type: 'integer', description: '省略時は最新年' }, order: { type: 'string', enum: ['desc', 'asc'], description: '既定は降順' }, limit: { type: 'integer', description: '上位N件だけ（省略時は33全部）' } }, additionalProperties: false } },
  { name: 'compare_municipalities', description: '複数の市町村を1つの分野で横並び比較する（指標×市町村の表）。年を省略すると最新年。',
    inputSchema: { type: 'object', required: ['municipalities', 'dataset'], properties: { municipalities: { type: 'array', items: { type: 'string' }, minItems: 1 }, dataset: { type: 'string' }, year: { type: 'integer' } }, additionalProperties: false } },
  { name: 'search_indicators', description: '自然言語で指標を探す（例: 「空き家」「大卒」「出生」「歯医者」）。見つかった指標の dataset と indicator ID を返すので、rank_municipalities などに渡す。',
    inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' } }, additionalProperties: false } },
];

const SYN: Record<string, string[]> = {
  '歯医者': ['歯科'], '歯科医院': ['歯科'], '人口': ['人口'], '高齢': ['65歳', '高齢'], '失業': ['失業'], '大卒': ['大学'], '学歴': ['卒'],
  '農家': ['農家'], '空き家': [], '出生': ['出生'], '死亡': ['死亡'], '結婚': ['婚姻'], '世帯': ['世帯'], '一人暮らし': ['単独世帯'], '病院': ['病院'], '医者': ['医師'],
  '介護': ['老人ホーム', '特養'], '学校': ['学校'], '子ども': ['児童', '生徒', '0〜14'], 'ごみ': ['ごみ', '排出'], '所得': ['所得'], '年収': ['所得'], '工場': ['製造'],
  '住宅': ['住宅', '着工'], '新築': ['着工'], '面積': ['面積'], '密度': ['密度'], '昼間': ['昼間', '昼夜間'], '通勤': ['昼夜間'],
};
function searchIndicators(q: string) {
  const terms = new Set<string>([q]);
  for (const [k, vs] of Object.entries(SYN)) if (q.includes(k)) vs.forEach(v => terms.add(v));
  const hits: any[] = [];
  for (const d of DATASETS) for (const ind of indicatorsOf(d)) {
    const hay = ind.label + d.label;
    if ([...terms].some(t => t && hay.includes(t))) hits.push({ dataset: d.id, dataset_label: d.label, indicator: ind.id, label: ind.label, unit: ind.unit, years: yearsOf(d) });
  }
  if (q.includes('空き家')) hits.push({ note: '空き家（住宅・土地統計調査）は市町村合計が県公表値と一致しないため収録していない。' });
  return hits;
}

function callTool(name: string, a: any) {
  switch (name) {
    case 'list_municipalities':
      return { prefecture: PREF, count: MUNIS.length, municipalities: MUNIS.map(m => ({ code: m.code, name: m.name, slug: m.slug, kind: m.kind, gun: m.gun || null, page: `${SITE}/city/${m.slug}/` })) };
    case 'list_datasets': {
      const list = a?.dataset ? DATASETS.filter(d => d.id === a.dataset) : DATASETS;
      if (!list.length) throw new Error(`unknown dataset: ${a.dataset}`);
      return { datasets: list.map(d => ({ id: d.id, label: d.label, years: yearsOf(d), year_label: d.yearLabel, indicators: indicatorsOf(d), ...cite(d) })) };
    }
    case 'get_municipality_stats': {
      const m = findMuni(a.municipality); if (!m) throw new Error(`unknown municipality: ${a.municipality}`);
      const sets = a.dataset ? [datasetById(a.dataset)].filter(Boolean) as Dataset[] : DATASETS;
      if (!sets.length) throw new Error(`unknown dataset: ${a.dataset}`);
      const out = sets.map(d => {
        const years = a.all_years && a.dataset ? yearsOf(d) : [a.year ?? latestYear(d, m.code)];
        const rows = years.map(y => { const r = recAt(d, m.code, y); const pr = prefRec(d, y);
          const vals: Record<string, any> = {};
          for (const ind of indicatorsOf(d)) {
            const v = valueOf(d, r, ind.id); const p = valueOf(d, pr, ind.id);
            const all = MUNIS.map(mm => valueOf(d, recAt(d, mm.code, y), ind.id)).filter((x): x is number => x != null).sort((x, z) => z - x);
            vals[ind.id] = { label: ind.label, value: v, unit: ind.unit, rank: v == null ? null : all.indexOf(v) + 1, of: all.length, prefecture: p };
          }
          return { year: y, ...(r?.merged?.length ? { merged_from: r.merged } : {}), values: vals };
        });
        return { dataset: d.id, ...cite(d, m), year_label: d.yearLabel, rows };
      });
      return { municipality: { code: m.code, name: m.name, slug: m.slug, page: `${SITE}/city/${m.slug}/` }, results: out };
    }
    case 'rank_municipalities': {
      const d = datasetById(a.dataset); if (!d) throw new Error(`unknown dataset: ${a.dataset}`);
      const ind = indicatorsOf(d).find(i => i.id === a.indicator); if (!ind) throw new Error(`unknown indicator: ${a.indicator} (use list_datasets)`);
      const y = a.year ?? latestYear(d);
      let rows = MUNIS.map(m => ({ code: m.code, name: m.name, slug: m.slug, value: valueOf(d, recAt(d, m.code, y), ind.id), page: `${SITE}/${d.path}/${m.slug}/` }));
      const has = rows.filter(r => r.value != null).sort((x, z) => a.order === 'asc' ? x.value! - z.value! : z.value! - x.value!);
      const none = rows.filter(r => r.value == null);
      let ranked = has.map((r, i) => ({ rank: i + 1, ...r }));
      if (a.limit) ranked = ranked.slice(0, a.limit);
      return { dataset: d.id, indicator: ind.id, label: ind.label, unit: ind.unit, year: y, year_label: d.yearLabel, prefecture: valueOf(d, prefRec(d, y), ind.id), ranking: ranked, no_data: none.map(r => r.name), ...cite(d) };
    }
    case 'compare_municipalities': {
      const d = datasetById(a.dataset); if (!d) throw new Error(`unknown dataset: ${a.dataset}`);
      const ms = (a.municipalities as string[]).map(q => { const m = findMuni(q); if (!m) throw new Error(`unknown municipality: ${q}`); return m; });
      const y = a.year ?? latestYear(d);
      const pr = prefRec(d, y);
      return { dataset: d.id, year: y, year_label: d.yearLabel, municipalities: ms.map(m => m.name),
        indicators: indicatorsOf(d).map(ind => ({ id: ind.id, label: ind.label, unit: ind.unit, values: Object.fromEntries(ms.map(m => [m.name, valueOf(d, recAt(d, m.code, y), ind.id)])), prefecture: valueOf(d, pr, ind.id) })), ...cite(d) };
    }
    case 'search_indicators': return { query: a.query, hits: searchIndicators(String(a.query)) };
    default: throw new Error(`unknown tool: ${name}`);
  }
}

/* ---------- リソース（CSV） ---------- */
function csvOf(d: Dataset): string {
  const head = ['市町村コード', '市町村', d.yearLabel, ...d.cols.map(c => c.label + (c.unit ? `(${c.unit})` : ''))];
  const lines = [head.join(',')];
  for (const m of MUNIS) for (const y of yearsOf(d)) { const r = recAt(d, m.code, y); if (!r) continue; lines.push([m.code, m.name, y, ...d.cols.map(c => r[c.key] ?? '')].join(',')); }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
const RESOURCES = DATASETS.map(d => ({ uri: `iwate-data://csv/${d.id}`, name: `${d.label}（33市町村×全年、CSV）`, mimeType: 'text/csv', description: `${SOURCES[d.source]?.name}。${SITE}/csv/${d.id}/all.csv と同内容` }));

/* ---------- JSON-RPC ---------- */
const INSTRUCTIONS = `岩手県33市町村の公的統計（e-Stat）を市町村×年で返すサーバー。数値はすべて政府統計の公表値で、市町村合計が県公表値と一致することを検算済み。
使い方: search_indicators か list_datasets で指標IDを確認 → get_municipality_stats / rank_municipalities / compare_municipalities。
回答するときは必ず各結果の page（いわてデータのURL）と source（統計名）を出典として示すこと。値が null のものは秘匿・未調査で、推計しないこと。`;

function rpc(id: any, result: any) { return { jsonrpc: '2.0', id, result }; }
function rpcErr(id: any, code: number, message: string) { return { jsonrpc: '2.0', id, error: { code, message } }; }

function handle(msg: any): any {
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize': return rpc(id, { protocolVersion: PROTOCOL, capabilities: { tools: {}, resources: {} }, serverInfo: SERVER, instructions: INSTRUCTIONS });
    case 'notifications/initialized': case 'notifications/cancelled': return null;
    case 'ping': return rpc(id, {});
    case 'tools/list': return rpc(id, { tools: TOOLS });
    case 'tools/call': {
      try { const r = callTool(params?.name, params?.arguments ?? {}); return rpc(id, { content: [{ type: 'text', text: JSON.stringify(r) }], structuredContent: r }); }
      catch (e: any) { return rpc(id, { content: [{ type: 'text', text: String(e?.message ?? e) }], isError: true }); }
    }
    case 'resources/list': return rpc(id, { resources: RESOURCES });
    case 'resources/read': {
      const m = /^iwate-data:\/\/csv\/([a-z]+)$/.exec(params?.uri ?? ''); const d = m && datasetById(m[1]);
      if (!d) return rpcErr(id, -32002, `resource not found: ${params?.uri}`);
      return rpc(id, { contents: [{ uri: params.uri, mimeType: 'text/csv', text: csvOf(d) }] });
    }
    case 'prompts/list': return rpc(id, { prompts: [] });
    default: return rpcErr(id, -32601, `method not found: ${method}`);
  }
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Authorization', 'Access-Control-Expose-Headers': 'Mcp-Session-Id' };
const json = (body: any, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } });

const LANDING = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>いわてデータ MCP</title>
<style>body{font-family:'Noto Sans JP',Meiryo,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.7;color:#1A1A1C}code{background:#F2F2F2;padding:2px 6px;border-radius:4px}h1{font-size:24px}</style>
<h1>いわてデータ MCP サーバー</h1>
<p>岩手県33市町村の公的統計（15分野・検算済み）を、AIエージェントから直接引けるMCPサーバーです。</p>
<p><b>エンドポイント:</b> <code>POST /mcp</code>（MCP Streamable HTTP、認証なし）</p>
<p><b>Claude.ai:</b> 設定 → コネクタ → カスタムコネクタを追加 → このページのURLに <code>/mcp</code> を付けて登録<br>
<b>Claude Code:</b> <code>claude mcp add --transport http iwate-data &lt;URL&gt;/mcp</code></p>
<p>ツール: list_municipalities / list_datasets / search_indicators / get_municipality_stats / rank_municipalities / compare_municipalities。リソース: 各分野のCSV。</p>
<p>データと出典は <a href="${SITE}/">${SITE}</a>。運営: ビークプロモーション株式会社（盛岡市）。利用条件 CC BY 4.0。</p></html>`;

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/' || url.pathname === '') return new Response(LANDING, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    if (url.pathname !== '/mcp') return json({ error: 'not found' }, 404);
    if (req.method === 'GET') return new Response('SSE stream is not supported by this stateless server; use POST.', { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } });
    if (req.method === 'DELETE') return new Response(null, { status: 204, headers: CORS });
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
    let body: any;
    try { body = await req.json(); } catch { return json(rpcErr(null, -32700, 'parse error'), 400); }
    const msgs = Array.isArray(body) ? body : [body];
    const out = msgs.map(handle).filter(Boolean);
    if (!out.length) return new Response(null, { status: 202, headers: CORS });
    return json(Array.isArray(body) ? out : out[0]);
  },
};
