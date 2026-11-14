import Link from 'next/link';
import { SITE, SOURCES, GENERATED, MUNIS, neighborsOf, type Muni } from '@/lib/data';
import { FAMILIES } from '@/lib/csv';
import localLinks from '@/data/local-links.json';

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
  websurvey: '本ページの数値は、医療情報ネット（厚生労働省・各都道府県）、介護サービス情報公表システム オープンデータ（厚生労働省）、障害福祉サービス等情報公表システム オープンデータ（WAM NET）、gBizINFO（経済産業省）、Googleマップの事業者情報に登録されたURLをもとに、本サイトが各Webサイトを取得・判定して作成した独自調査の結果で、これらの機関が作成・公表したものではない。',
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

// 同じ運営会社（ビークプロモーション）の地域メディアへの案内。統計の先にある「実際の手続き・費用」を探す人向け。
const MEDIA = {
  machishika: { name: 'MACHISHIKA（マチシカ）岩手版', url: 'https://machi-shika.com/iwate/', desc: '岩手県内の歯科医院が公式サイトで公表している歯列矯正・インプラントの料金を、出典と調査日つきで整理しています。' },
  okuri: { name: 'おくりの段取り帖', url: 'https://okuri-dandori.com/iwate/iwate-okuyami-madoguchi/', desc: '岩手県の市町村別に、亡くなったあとの手続き窓口・火葬場・葬祭費を、公的機関の情報をもとに確認日つきでまとめています。' },
  kazai: { name: '実家じまいガイド 岩手版', url: 'https://kazai-seiri.com/iwate/', desc: '実家じまい・遺品整理の順番と、自治体の公開資料で一般廃棄物収集運搬の許可を確認できた業者を掲載しています。' },
  gaiheki: { name: '塗装の相場帳', url: 'https://gaiheki-tosou.net/', desc: '外壁塗装の相場・助成金・見積書の見方を、自治体公式を一次ソースに、調査日つきで掲載しています（岩手県33市町村）。' },
  homyhome: { name: 'HomyHome.jp', url: 'https://homyhome.jp/', desc: '外構・エクステリア・お庭づくりの費用相場と助成金を、地域版ごとにレンジと出典つきで整理しています。' },
} as const;
// 同じ市町村の、姉妹メディアのページ（data/local-links.json。検索に出しているページだけを載せる）
const LOCAL_LABEL = {
  gaiheki: (n: string) => ({ site: '塗装の相場帳', text: `${n}の外壁塗装に使える助成金・補助金`, note: '制度名・補助率・上限額・申請のタイミングを、市町村の公式情報で確認日つきで整理' }),
  kazai: (n: string) => ({ site: '実家じまいガイド', text: `${n}の遺品整理・不用品回収の許可業者`, note: '一般廃棄物収集運搬の許可を、自治体の公開一覧で1社ずつ確認したリスト' }),
  okuri: (n: string) => ({ site: 'おくりの段取り帖', text: `${n}の火葬場・死亡届・葬祭費`, note: '亡くなったあとの手続きの窓口・料金・期限' }),
} as const;
export function LocalMedia({ slug, name, keys, lead }: { slug: string; name: string; keys: (keyof typeof LOCAL_LABEL)[]; lead?: string }) {
  const e = (localLinks as Record<string, Partial<Record<keyof typeof LOCAL_LABEL, string>>>)[slug] ?? {};
  const items = keys.filter(k => e[k]).map(k => ({ k, url: e[k]!, ...LOCAL_LABEL[k](name) }));
  if (!items.length) return null;
  return (
    <section className="sources" aria-label={`${name}の暮らしの手続き`}>
      <h2>{name}の暮らしの手続き・業者を調べる</h2>
      {lead && <p>{lead}</p>}
      <ul>
        {items.map(x => <li key={x.k}><a href={x.url} rel="noopener">{x.text}</a>（{x.site}）— {x.note}</li>)}
      </ul>
      <p><small>いずれも本サイトと同じビークプロモーション株式会社が運営しています。</small></p>
    </section>
  );
}

export function RelatedMedia({ keys, lead }: { keys: (keyof typeof MEDIA)[]; lead: string }) {
  return (
    <section className="sources" aria-label="関連メディア">
      <h2>関連メディア</h2>
      <p>{lead}</p>
      <ul>
        {keys.map(k => <li key={k}><a href={MEDIA[k].url} rel="noopener">{MEDIA[k].name}</a> — {MEDIA[k].desc}</li>)}
      </ul>
      <p><small>いずれも本サイトと同じビークプロモーション株式会社が運営しています。</small></p>
    </section>
  );
}

/** /{family}/{slug}/ → /csv/{family}/{slug}.csv、/{family}/ → /csv/{family}/all.csv（CSVが生成されている分野だけ）。 */
function csvFor(path: string): string | null {
  const mm = path.match(/^\/([a-z]+)\/(?:([a-z0-9-]+)\/)?$/);
  if (!mm || !FAMILIES[mm[1]]) return null;
  const slug = mm[2] ?? 'all';
  if (slug !== 'all' && !MUNIS.some(m => m.slug === slug)) return null;
  return `/csv/${mm[1]}/${slug}.csv`;
}

export function DatasetJsonLd({ name, description, path, keywords, temporal, sourceKeys }:
  { name: string; description: string; path: string; keywords: string[]; temporal: string; sourceKeys: string[] }) {
  const csv = csvFor(path);
  const json = {
    '@context': 'https://schema.org', '@type': 'Dataset', name, description, url: SITE.url + path,
    keywords, temporalCoverage: temporal, spatialCoverage: { '@type': 'Place', name: '岩手県' },
    license: 'https://creativecommons.org/licenses/by/4.0/', inLanguage: 'ja',
    creator: { '@type': 'Organization', name: SITE.publisher, url: SITE.publisherUrl },
    isBasedOn: sourceKeys.map(k => ({ '@type': 'Dataset', name: SOURCES[k].name, url: SOURCES[k].url })),
    dateModified: GENERATED, isAccessibleForFree: true,
    ...(csv ? { distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: SITE.url + csv }] } : {}),
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

/** 送客用のUTM付きURL。utm_campaign はページ種別（例: population / population-hub / industry-muni）、utm_content は市町村スラッグ。 */
export function utm(url: string, campaign: string, content?: string) {
  const q = new URLSearchParams({ utm_source: 'iwate-data', utm_medium: 'referral', utm_campaign: campaign });
  if (content) q.set('utm_content', content);
  return `${url}?${q.toString()}`;
}
const CHECKER_URL = 'https://beak-promo.jp/seo-aeo-checker';
const CONTACT_URL = 'https://beak-promo.jp/contact';

/** 地域で集客したい事業者向けの控えめな案内。muni を渡すと見出しが市町村名入りになる。
 *  campaign＝ページ種別（UTM の utm_campaign）、slug＝市町村スラッグ（utm_content）。 */
export function Cta({ muni, topic, campaign, slug }: { muni?: string; topic?: string; campaign: string; slug?: string }) {
  const where = muni ? `${muni}で` : '岩手県内で';
  return (
    <aside className="cta" aria-label="事業者の方へ">
      <h2>{where}集客を考えている事業者の方へ</h2>
      <p>自社のホームページが検索結果やAIの回答でどう扱われているかは、URLを入れるだけの無料診断で確かめられます（登録不要・約60秒）。{topic ? `このページの${topic}などの数字を使った商圏の見立てや、` : '商圏の見立てや、'}ホームページ・広告のご相談は、本サイトを運営する盛岡市のビークプロモーションが承ります。</p>
      <div className="tools">
        <a className="btn primary" href={utm(CHECKER_URL, campaign, slug)}>無料でSEO・AI検索診断をする</a>
        <a className="btn" href={utm(CONTACT_URL, campaign, slug)}>相談する</a>
      </div>
    </aside>
  );
}

/** 隣接する市町村の同じ統計へのリンク。exists で「ページがある市町村だけ」に絞れる（産業クロスページ用）。 */
export function Nearby({ code, label, href, exists }: { code: string; label: string; href: (m: Muni) => string; exists?: (m: Muni) => boolean }) {
  const list = neighborsOf(code).filter(m => !exists || exists(m));
  if (!list.length) return null;
  return (
    <p className="nearby">隣接する市町村の{label}：{list.map((m, k) => <span key={m.code}>{k ? '・' : ''}<Link href={href(m)}>{m.name}</Link></span>)}</p>
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
