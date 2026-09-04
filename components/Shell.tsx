import Link from 'next/link';
import { SITE, SOURCES, GENERATED } from '@/lib/data';

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
