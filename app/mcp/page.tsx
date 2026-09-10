import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, SITE, SOURCES, GENERATED } from '@/lib/data';
import { DATASETS, DERIVED } from '@/mcp/src/catalog';
import { Breadcrumb, Cta } from '@/components/Shell';

const ENDPOINT = 'https://mcp.iwate-data.com/mcp';
const TITLE = '岩手データMCPサーバー（AIから直接引ける統計データ）';
const IND = DATASETS.reduce((a, d) => a + d.cols.length, 0) + DERIVED.length;

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県33市町村の統計を、ChatGPTやClaudeなどのAIから直接引けるMCPサーバー。${DATASETS.length}分野・${IND}指標。認証不要・無料。エンドポイントは ${ENDPOINT}。`,
  alternates: { canonical: '/mcp/' },
};

const TOOLS: [string, string][] = [
  ['list_municipalities', '岩手県33市町村の一覧（コード・名前・slug）'],
  ['list_datasets', `${DATASETS.length}分野・${IND}指標の一覧と、収録年・出典`],
  ['search_indicators', '「歯医者」「待機児童」「大卒」などの言葉から指標IDを探す'],
  ['get_municipality_stats', '1市町村の値。県内順位と県計つき。分野を省くと全分野、all_yearsで時系列'],
  ['rank_municipalities', '指標で33市町村をランキング'],
  ['compare_municipalities', '複数の市町村を横並びで比較'],
];

export default function Page() {
  return (
    <>
      <Breadcrumb items={[{ name: 'MCPサーバー' }]} />
      <h1>{TITLE}</h1>
      <p className="key-fact">このサイトに載っている<strong>{DATASETS.length}分野・{IND}指標・33市町村</strong>のデータを、AIから直接引けるようにした<strong>MCPサーバー</strong>を無料で公開しています。認証もAPIキーも要りません。エンドポイントは <code>{ENDPOINT}</code>。</p>

      <h2>何ができるか</h2>
      <p>AIに接続すると、「北上市の歯科は何軒あって、ホームページを出しているのは何%か」「岩手で廃校が多い市町村は」「待機児童と保育所の空き定員を市町村別に」といった質問に、<strong>推測ではなく出典つきの実数</strong>で答えられるようになります。返ってくる値には毎回、県内順位・県計・出典名・出典URL・このサイトの該当ページが付きます。</p>

      <h2>つなぎ方</h2>
      <p>MCPに対応したAIクライアント（Claude デスクトップ／Claude.ai のコネクタ、その他 MCP 対応ツール）で、リモートMCPサーバーとして次のURLを追加してください。</p>
      <pre><code>{ENDPOINT}</code></pre>
      <p>設定ファイルに直接書く場合の例:</p>
      <pre><code>{JSON.stringify({ mcpServers: { 'iwate-data': { type: 'http', url: ENDPOINT } } }, null, 2)}</code></pre>
      <p><small>Streamable HTTP（POST /mcp）のステートレス実装です。セッションもSSEも使いません。プロトコル版は 2025-06-18。</small></p>

      <h2>ツール</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ツール</th><th>用途</th></tr></thead>
          <tbody>{TOOLS.map(([n, d]) => <tr key={n}><td><code>{n}</code></td><td className="wrap">{d}</td></tr>)}</tbody>
        </table>
      </div>
      <p>あわせて <code>iwate-data://csv/&#123;分野&#125;</code> のリソースで、各分野の全市町村CSV（サイトの <Link href="/data/">CSVと同じ内容</Link>）をそのまま読めます。</p>

      <h2>収録している分野</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>分野ID</th><th>内容</th><th>指標数</th><th>出典</th><th>サイトの該当ページ</th></tr></thead>
          <tbody>
            {DATASETS.map(d => {
              const s = SOURCES[d.source];
              const n = d.cols.length + DERIVED.filter(x => x.dataset === d.id).length;
              return <tr key={d.id}><td><code>{d.id}</code></td><td className="wrap">{d.label}</td><td>{n}</td>
                <td className="wrap"><small>{s?.name ?? d.source}</small></td>
                <td><Link href={`/${d.path}/`}>/{d.path}/</Link></td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <h2>使うときの注意</h2>
      <ul>
        <li>数値は各統計の公表値をそのまま集計したものです。推計・補完はしていません。出せない値は空にしてあります</li>
        <li>e-Stat由来の分野は「33市町村の合計＝県の公表値」を機械的に検算しています。配布元のCSV/ZIPから作った分野（街頭犯罪・交通事故・介護事業所・障害福祉事業所・医療機関/薬局・廃校・法人数・保育所等）は、総数が原データと一致することを検算しています</li>
        <li>分野によって時点も定義も違います。とくに医療機関の数は「医療施設調査」と「医療情報ネット」で一致しません。各ツールの応答に付く出典と注記を必ず読んでください</li>
        <li>利用条件は本サイトと同じ<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" rel="noopener">CC BY 4.0</a>です。出典として「{SITE.name}」を明記すれば、商用を含め自由に使えます</li>
        <li>予告なく仕様を変えることがあります。業務で使う場合は<a href={`${SITE.publisherUrl}contact/?ref=iwate-data-mcp`} rel="noopener">運営会社</a>までご連絡ください</li>
      </ul>

      <h2>データを別の形で使いたい場合</h2>
      <ul className="grid-links">
        <li><Link href="/data/">Excelデータ集<small>全分野を1ファイルにまとめたもの（出典シート付き）</small></Link></li>
        <li><Link href="/city/">市町村別のまとめ<small>33市町村それぞれの主要指標</small></Link></li>
      </ul>
      <p><small>収録データの版: {GENERATED}。対象は岩手県{MUNIS.length}市町村。</small></p>
      <Cta muni="岩手県" topic="データ活用" />
    </>
  );
}
