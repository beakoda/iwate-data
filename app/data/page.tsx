import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, SITE, GENERATED } from '@/lib/data';
import { FAMILIES } from '@/lib/csv';
import { Breadcrumb, Cta } from '@/components/Shell';

const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL || '';
const PRICE = '3,300';
const TITLE = '岩手県33市町村 統計データ集（Excel）';

export const metadata: Metadata = {
  title: TITLE,
  description: `本サイトの全${Object.keys(FAMILIES).length}分野・33市町村・全年のデータを1つのExcelにまとめたデータ集。出典シート付き、検算済み。各ページのCSVは無料。`,
  alternates: { canonical: '/data/' },
};

export default function Page() {
  const fams = Object.entries(FAMILIES);
  const rowCount = fams.reduce((a, [, f]) => a + MUNIS.length * f.years.length, 0);
  return (
    <>
      <Breadcrumb items={[{ name: 'データ集（Excel）' }]} />
      <h1>{TITLE}</h1>
      <p className="key-fact">本サイトに載っている<strong>{fams.length}分野・33市町村・約{Math.round(rowCount / 1000)}千行</strong>のデータを、分野ごとのシートに分けた1つのExcelファイル。すべて政府統計の公表値で、<strong>市町村合計が県公表値と一致することを機械的に検算済み</strong>。出典・注記シート付き。</p>

      <div className="stats">
        <div className="stat"><div className="stat-label">価格（税込・買い切り）</div><div className="stat-value">¥{PRICE}</div><div className="stat-sub">{GENERATED}版・xlsx形式</div></div>
        <div className="stat"><div className="stat-label">収録</div><div className="stat-value">{fams.length}分野</div><div className="stat-sub">{fams.reduce((a, [, f]) => a + f.cols.length, 0)}指標・33市町村</div></div>
        <div className="stat"><div className="stat-label">行数</div><div className="stat-value">{rowCount.toLocaleString('ja-JP')}</div><div className="stat-sub">市町村×年の行（分野合計）</div></div>
      </div>
      <div className="tools">
        {BUY_URL
          ? <a className="btn primary" href={BUY_URL} rel="noopener">Excelデータ集を購入する（¥{PRICE}）</a>
          : <a className="btn primary" href={`${SITE.publisherUrl}contact/?ref=iwate-data-xlsx`} rel="noopener">購入を申し込む（¥{PRICE}・請求書払い可）</a>}
        <a className="btn" href="/csv/population/all.csv" download>無料サンプル: 人口・世帯の全市町村CSV</a>
      </div>

      <h2>誰に向いているか</h2>
      <p>市町村ごとの数字を<strong>複数の分野にまたがって</strong>並べたい人向けです。出店・開業の商圏調査、議会や行政の資料、大学のレポート、不動産・医療・介護の事業計画、地方紙の企画記事。1分野だけなら各ページのCSV（無料）で足ります。</p>

      <h2>収録内容</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>シート</th><th>指標</th><th>年</th><th>行数</th><th>無料CSV</th></tr></thead>
          <tbody>
            {fams.map(([key, f]) => (
              <tr key={key}><td>{f.label}</td><td style={{ whiteSpace: 'normal', textAlign: 'left' }}>{f.cols.map(c => c[1]).join('・')}</td>
                <td>{f.years[0]}〜{f.years[f.years.length - 1]}{f.yearLabel ?? '年'}（{f.years.length}時点）</td>
                <td>{(MUNIS.length * f.years.length).toLocaleString('ja-JP')}</td>
                <td><a href={`/csv/${key}/all.csv`} download>CSV</a></td></tr>))}
            <tr><td>出典・注記</td><td style={{ whiteSpace: 'normal', textAlign: 'left' }}>各分野の統計名・表名・URL・時点・注意点（合併の扱い、率の計算方法、系列の切れ目）</td><td>—</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>
      </div>

      <h2>形式</h2>
      <ul>
        <li>1分野＝1シート。列は「市町村コード・市町村・年・各指標」の縦持ち（ロング形式）。ピボットテーブルにそのまま掛けられます</li>
        <li>数値はすべて出典統計の公表値。推計・按分・補完はしていません。秘匿・非公表は空欄</li>
        <li>合併前の旧町村（滝沢村・藤沢町・川井村）は現在の市に合算し、注記シートに明記</li>
        <li>各ページの「CSVで保存」と同じ内容です。Excel版は全分野を1ファイルにまとめ、出典シートを付けたもの</li>
      </ul>

      <h2>正直な注意</h2>
      <p>元データはすべて政府統計（e-Stat）で、誰でも無料で取得できます。お金をいただいているのは、<strong>33市町村×{fams.length}分野×十数年分を集めて、市町村合計が県の公表値と一致することを検算し、1ファイルに整えた手間</strong>に対してです。ご自身でe-Statから取れる方は、そちらをお使いください。</p>
      <p>利用条件は本サイトと同じ<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" rel="noopener">CC BY 4.0</a>（出典として「{SITE.name}」を明記すれば、商用を含め自由に利用できます）。</p>

      <h2>更新</h2>
      <p>統計の公表に合わせて年1回程度更新します。購入した版の再ダウンロードは無期限、更新版は再購入です。</p>
      <p><small>版: {GENERATED}。お問い合わせは<a href={`${SITE.publisherUrl}contact/`} rel="noopener">運営会社の問い合わせフォーム</a>へ。</small></p>

      <Cta topic="複数分野の" />
    </>
  );
}
