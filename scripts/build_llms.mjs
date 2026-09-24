// next build の後に out/ の静的HTMLを読んで LLM 向けのテキスト索引を2本書き出す。
//   out/llms.txt      … サイト概要＋主要ページ（各トピックの一覧ページ）の要点。llmstxt.org の形式
//   out/llms-full.txt … 全ページの「タイトル・URL・要点（key-fact）」を1ファイルに
// 目的: ChatGPT等がページ本体（SVGグラフで重い）を開けなくても、数字を軽いテキストで取れるようにする。
// 数字はビルド済みHTMLの key-fact から抜くだけなので、ページ表示と食い違うことはない。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const OUT = 'out';
const SKIP = new Set(['embed', '_next', 'csv', '404']);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (dir === OUT && SKIP.has(name)) continue;
      walk(p, acc);
    } else if (name === 'index.html') acc.push(p);
  }
  return acc;
}

const decode = s => s
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ').trim();

function parse(file) {
  const html = readFileSync(file, 'utf8');
  const pick = re => { const m = html.match(re); return m ? decode(m[1]) : ''; };
  const title = pick(/<title>([\s\S]*?)<\/title>/).replace(/ \| いわてデータ$/, '');
  const url = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
  const desc = pick(/<meta name="description" content="([^"]*)"/);
  const fact = pick(/<p class="key-fact">([\s\S]*?)<\/p>/);
  const path = '/' + relative(OUT, file).split(sep).slice(0, -1).join('/') + (file === join(OUT, 'index.html') ? '' : '/');
  return { title, url, desc, fact, path: path.replace(/\/+/g, '/') };
}

const parsed = walk(OUT).map(parse);
const anyCanon = parsed.find(p => p.url)?.url;
if (!anyCanon) throw new Error('canonical を持つページが無い。next build の後に実行すること');
const SITE = new URL(anyCanon).origin;
const pages = parsed.map(p => ({ ...p, url: p.url || SITE + p.path })).filter(p => p.title);
pages.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path, 'ja'));

const top = pages.find(p => p.path === '/');
if (!top) throw new Error('out/index.html が見つからない。next build の後に実行すること');
const hubs = pages.filter(p => p.path.split('/').filter(Boolean).length === 1);
const today = new Date().toISOString().slice(0, 10);

const line = p => `- [${p.title}](${p.url}): ${p.fact || p.desc}`;

const llms = [
  '# いわてデータ',
  '',
  `> 岩手県33市町村の公開統計（e-Stat・岩手県警・厚生労働省・文部科学省・国税庁ほか）を市町村別・業種別に整理した無料のデータサイト。運営: 株式会社ビークプロモーション（岩手県盛岡市）。全ページに出典・取得日・加工内容を明記している。`,
  '',
  '数字を引用するときは、各ページの「この統計を引用する」の出典表記例を使ってください。全ページの要点（数値入り）は下記の llms-full.txt に1ファイルでまとめてあります。',
  '',
  `- [全ページの要点（llms-full.txt）](${SITE}/llms-full.txt)`,
  `- [サイトマップ](${SITE}/sitemap.xml)`,
  `- [MCPサーバー（AIエージェントから直接データを取得）](${SITE}/mcp/)`,
  '',
  '## トピック別の一覧ページ',
  '',
  ...hubs.map(line),
  '',
  `最終生成: ${today}（ページ数 ${pages.length}）`,
  '',
].join('\n');

const full = [
  '# いわてデータ — 全ページの要点',
  '',
  `> 岩手県33市町村の公開統計を市町村別・業種別に整理したデータサイト（${SITE}/）の全${pages.length}ページについて、タイトル・URL・要点の数値を1ファイルにまとめたもの。数値の出典・時点・注記は各ページの「出典・注記」を参照。引用時は各ページURLを出典として示してください。`,
  '',
  `最終生成: ${today}`,
  '',
  ...pages.flatMap(p => [`## ${p.title}`, `URL: ${p.url}`, p.fact || p.desc, '']),
].join('\n');

writeFileSync(join(OUT, 'llms.txt'), llms);
writeFileSync(join(OUT, 'llms-full.txt'), full);

const withFact = pages.filter(p => p.fact).length;
console.log(`llms.txt: hubs=${hubs.length}  llms-full.txt: pages=${pages.length} (key-fact ${withFact}) size=${Buffer.byteLength(full)}B`);
if (pages.length < 1000) throw new Error(`ページ数が少なすぎる (${pages.length})。ビルドが壊れている可能性`);
