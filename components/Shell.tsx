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

export function SourceBox({ keys, extra }: { keys: string[]; extra?: string[] }) {
  return (
    <section className="sources" id="sources">
      <h2>出典・注記</h2>
      <ul>
        {keys.map(k => <li key={k}><a href={SOURCES[k].url} rel="noopener" target="_blank">{SOURCES[k].name}</a><br /><small>{SOURCES[k].note}</small></li>)}
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
      <p><small>本ページの図表・数値は出典を明記のうえ自由に引用・転載できます。元データは政府統計です。</small></p>
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
      <a className="btn primary" href={`${SITE.publisherUrl}contact/?ref=iwate-data`} rel="noopener">データをもとに相談する（無料）</a>
      <a className="btn" href={SITE.publisherUrl} rel="noopener">ビークプロモーションについて</a>
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
