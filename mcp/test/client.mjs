// 実際のMCPクライアント（公式SDK）でサーバーを叩く。 node test/client.mjs http://localhost:8787/mcp
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const url = process.argv[2] || 'http://localhost:8787/mcp';
const c = new Client({ name: 'iwate-data-test', version: '0' });
await c.connect(new StreamableHTTPClientTransport(new URL(url)));
const tools = await c.listTools(); console.log('tools:', tools.tools.map(t => t.name).join(', '));
const call = async (name, args) => { const r = await c.callTool({ name, arguments: args }); if (r.isError) throw new Error(name + ': ' + r.content[0].text); return r.structuredContent ?? JSON.parse(r.content[0].text); };
const lm = await call('list_municipalities', {}); console.log('munis:', lm.count);
const ld = await call('list_datasets', {}); console.log('datasets:', ld.datasets.length, 'indicators:', ld.datasets.reduce((a, d) => a + d.indicators.length, 0));
const s = await call('search_indicators', { query: '大卒' }); console.log('search 大卒 ->', s.hits.map(h => h.dataset + '.' + h.indicator).join(', '));
const r = await call('rank_municipalities', { dataset: 'jobless', indicator: 'jobless_rate', limit: 3 }); console.log('rank jobless_rate', r.year, 'pref', r.prefecture, r.ranking.map(x => `${x.rank}.${x.name} ${x.value}`).join(' / '));
const r2 = await call('rank_municipalities', { dataset: 'education', indicator: 'univ_rate', order: 'asc', limit: 2 }); console.log('rank univ_rate asc', r2.ranking.map(x => `${x.name} ${x.value}`).join(' / '), 'pref', r2.prefecture);
const g = await call('get_municipality_stats', { municipality: '盛岡', dataset: 'jobless' }); const v = g.results[0].rows[0].values; console.log('盛岡 jobless', g.results[0].rows[0].year, 'rate', v.jobless_rate.value, 'rank', v.jobless_rate.rank + '/' + v.jobless_rate.of, 'pref', v.jobless_rate.prefecture, 'page', g.results[0].page);
const g2 = await call('get_municipality_stats', { municipality: 'ichinoseki', dataset: 'farm', all_years: true }); console.log('一関 farm years', g2.results[0].rows.map(x => x.year + ':' + x.values.sales_farms.value).join(' '), 'merged', JSON.stringify(g2.results[0].rows[0].merged_from));
const g3 = await call('get_municipality_stats', { municipality: '03484' }); console.log('田野畑 all datasets:', g3.results.length, 'first', g3.results[0].dataset, g3.results[0].rows[0].year);
const cmp = await call('compare_municipalities', { municipalities: ['盛岡市', '滝沢市', '矢巾町'], dataset: 'aging' }); console.log('compare aging', cmp.year, cmp.indicators.find(i => i.id === 'aging_rate').values, 'pref', cmp.indicators.find(i => i.id === 'aging_rate').prefecture);
const res = await c.listResources(); console.log('resources:', res.resources.length);
const rr = await c.readResource({ uri: 'iwate-data://csv/jobless' }); const txt = rr.contents[0].text; console.log('csv jobless lines', txt.trim().split(/\r?\n/).length, 'head', txt.split(/\r?\n/)[0].slice(0, 40));
try { await call('rank_municipalities', { dataset: 'nope', indicator: 'x' }); } catch (e) { console.log('error path ok:', e.message); }
await c.close(); console.log('ALL OK');
