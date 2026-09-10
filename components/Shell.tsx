import Link from 'next/link';
import { SITE, SOURCES, GENERATED, MUNIS } from '@/lib/data';

export function Breadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  const all = [{ name: 'ホーム', href: '/' }, ...items];
  const json = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: all.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, ...(it.href ? { item: SITE.url + it.href } : {}) })),
  };
  return (
    <nav aria-label="パンくずリスト" className="breadcrumb">
      <ol>{all.map((it, i) => <li key={i}>{it.href && i < all.length - 1 ? <Link href={it.href}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}</li>)}</ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
    </nav>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/** 加工の明示が必要な出典（公共データ利用規約1.0 / 政府標準利用規約2.0 系）。
 *  「編集・加工したことの記載」と「国・自治体が作成したかのような公表の禁止」が条件に入っているため、
 *  該当キーを使うページには必ずこの一文を出す。出典キーを足したらここも見直すこと。 */
const PROCESSING: Record<string, string> = {
  crime: '本ページの数値は「オープンデータ（街頭犯罪等の発生状況）」（岩手県警察）を本サイトが市町村×年×手口に集計して作成したもので、岩手県警察が作成・公表した表ではない。原データの利用条件は公共データ利用規約（第1.0版・PDL1.0）。',
  kaigo: '本ページの数値は「介護サービス情報公表システム オープンデータ」（厚生労働省）の事業所個票を本サイトが市町村×サービス種別に集計して作成したもので、厚生労働省が作成・公表した表ではない。原データの利用条件は公共データ利用規約（第1.0版・PDL1.0）。',
  iryou: '本ページの数値は「医療情報ネット（ナビイ）」（厚生労働省・各都道府県）の施設個票を本サイトが市町村×施設種別に集計して作成したもので、厚生労働省・各都道府県が作成・公表した表ではない。',
  schoolcode: '本ページの数値は「学校コード」一覧（文部科学省）を本サイトが市町村×学校種に集計して作成したもので、文部科学省が作成・公表した表ではない。',
  traffic: '本ページの数値は「交通事故統計情報のオープンデータ」本票（警察庁）の事故個票を本サイトが市町村×年に集計して作成したもので、警察庁が作成・公表した表ではない。原データの利用条件は公共データ利用規約（第1.0版・PDL1.0）。',
  houjin: '本ページの数値は「法人番号公表サイト」全件データ（国税庁）を本サイトが市町村×法人種別に集計して作成したもので、国税庁が作成・公表した表ではない。原データの利用条件は公共データ利用規約（第1.0版・PDL1.0）。',
  hoiku: '本ページの数値は「保育所等関連状況取りまとめ」（こども家庭庁）を本サイトが市町村別に整理して作成したもので、こども家庭庁が作成・公表した表ではない。原データの利用条件は公共データ利用規約（第1.0版・PDL1.0）。',
  shofuku: '本ページの数値は「障害福祉サービス等情報公表システム」オープンデータ（独立行政法人福祉医療機構 WAM NET）の事業所個票を本サイトが市町村×サービス種別に集計して作成したもので、同機構が作成・公表した表ではない。',
};

export function SourceBox({ keys, extra }: { keys: string[]; extra?: string[] }) {
  return (
    <section className="sources" id="sources">
      <h2>出典・注記</h2>
      <ul>
        {keys.map(k => <li key={k}><a href={SOURCES[k].url} rel="noopener" target="_blank">{SOURCES[k].name}</a><br /><small>{SOURCES[k].note}</small></li>)}
        {keys.filter(k => PROCESSING[k]).map(k => <li key={`p-${k}`}><small>{PROCESSING[k]}</small></li>)}
        {extra?.map((e, i) => <li key={i}><small>{e}</small></li>)}
      </ul>
      <p><small>数値は出典統計の公表値をそのまま集計したもので、推計・補完は行っていません。最終更新: {GENERATED}</small></p>
    </section>
  );
}

export function CiteBox({ title, path, sentence }: { title: string; path: string; sentence: string }) {
  const url = SITE.url + path;
  return (
    <section className="cite">
      <h2>この統計を引用する</h2>
      <p className="cite-sentence">{sentence}</p>
      <dl>
        <dt>出典表記例</dt>
        <dd><code>{SITE.name}「{title}」（{url}、{GENERATED}閲覧）</code></dd>
        <dt>リンク</dt>
        <dd><code>{`<a href="${url}">${title}</a>`}</code></dd>
      </dl>
      <p><small>本ページの図表・数値は出典を明記のうえ自由に引用・転載できます。元データは各ページの「出典・注記」に記載した公的統計・公開データです。</small></p>
    </section>
  );
}

export function DatasetJsonLd({ name, description, path, keywords, temporal, sourceKeys }:
  { name: string; description: string; path: string; keywords: string[]; temporal: string; sourceKeys: string[] }) {
  const json = {
    '@context': 'https://schema.org', '@type': 'Dataset', name, description, url: SITE.url + path,
    keywords, temporalCoverage: temporal, spatialCoverage: { '@type': 'Place', name: '岩手県' },
    license: 'https://creativecommons.org/licenses/by/4.0/', inLanguage: 'ja',
    creator: { '@type': 'Organization', name: SITE.publisher, url: SITE.publisherUrl },
    isBasedOn: sourceKeys.map(k => ({ '@type': 'Dataset', name: SOURCES[k].name, url: SOURCES[k].url })),
    dateModified: GENERATED,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

/** 33市町村へのジャンプ帯。current は市町村コード。family はパス先頭（例: 'jobless'）。 */
export function MuniStrip({ family, current }: { family: string; current?: string }) {
  return (
    <nav aria-label="市町村を選ぶ">
      <ul className="muni-strip">
        {MUNIS.map(m => <li key={m.code}><Link href={`/${family}/${m.slug}/`} aria-current={m.code === current ? 'page' : undefined}>{m.name}</Link></li>)}
      </ul>
    </nav>
  );
}

/** CSVダウンロードなどのツール行。family と slug（'all' で全市町村） */
export function Tools({ family, slug, label }: { family: string; slug: string; label?: string }) {
  return (
    <div className="tools">
      <a className="btn" href={`/csv/${family}/${slug}.csv`} download>⬇ {label ?? 'このページのデータ'}をCSVで保存</a>
      {slug !== 'all' && <a className="btn" href={`/csv/${family}/all.csv`} download>⬇ 33市町村すべてのCSV</a>}
      <Link className="btn" href="/data/">📊 全データ一括（Excel）</Link>
    </div>
  );
}

/** 運営会社への相談導線。muni を渡すと文言が市町村名入りになる。 */
export function Cta({ muni, topic }: { muni?: string; topic?: string }) {
  const where = muni ? `${muni}で` : '岩手県内で';
  return (
    <section className="cta" aria-label="お問い合わせ">
      <h2>{where}集客・開業・出店を考えている事業者の方へ</h2>
      <p>このページの{topic ? topic + 'などの' : ''}数字をもとに、商圏の見立てからWeb集客（ホームページ・広告・MEO・AI検索対策）までを、盛岡のビークプロモーションが引き受けます。初回の相談とデータの読み解きは無料です。</p>
      <div className="tools">
        <a className="btn primary" href={`${SITE.publisherUrl}contact/?ref=iwate-data`} rel="noopener">データをもとに相談する（無料）</a>
        <a className="btn" href={SITE.publisherUrl} rel="noopener">ビークプロモーションについて</a>
      </div>
    </section>
  );
}

/** 埋め込みコードの表示 */
export function EmbedBox({ slug, name }: { slug: string; name: string }) {
  const src = `${SITE.url}/embed/city/${slug}/`;
  const code = `<iframe src="${src}" width="100%" height="320" style="border:1px solid #D8D8DB;border-radius:8px" loading="lazy" title="${name}の主要統計（いわてデータ）"></iframe>`;
  return (
    <section className="embed-box">
      <h2>{name}の統計をサイトに埋め込む</h2>
      <p>下のコードを貼ると、{name}の主要指標カードが表示されます（出典リンク付き・無料）。自治体・議員・不動産・医療機関のサイトでご利用ください。</p>
      <textarea readOnly rows={3} defaultValue={code} />
      <p><small>プレビュー: <a href={src}>{src}</a></small></p>
    </section>
  );
}
