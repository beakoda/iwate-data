import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, hoikuAt, hoikuPref, hoikuFillRate, hoikuSlack, hoikuHidden, popAt, fmt, rank, HOIKU_ASOF_LABEL, LATEST_POP } from '@/lib/data';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = hoikuAt(m.code)!;
  return {
    title: `${m.name}の保育所等の定員・申込者・待機児童（${HOIKU_ASOF_LABEL}時点）`,
    description: `${m.name}（岩手県）の保育所等の利用定員は${HOIKU_ASOF_LABEL}時点で${fmt(r.capacity)}人、申込者${fmt(r.applicants)}人、待機児童${fmt(r.waiting)}人。定員に対する申込は${fmt(hoikuFillRate(r))}%で、空きは${fmt(hoikuSlack(r))}人分。県内33市町村の順位つき。`,
    alternates: { canonical: `/hoiku/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const r = hoikuAt(m.code)!;
  const fill = hoikuFillRate(r), slack = hoikuSlack(r), hidden = hoikuHidden(r);
  const rows = MUNIS.map(mm => { const x = hoikuAt(mm.code)!; return { m: mm, cap: x.capacity, fill: hoikuFillRate(x) }; });
  const rC = rank(rows, x => x.cap), rF = rank(rows, x => x.fill);
  const me = rows.find(x => x.m.code === m.code)!;
  const P = hoikuPref(), pFill = hoikuFillRate(P);
  const pop = popAt(m.code, LATEST_POP);
  const title = `${m.name}の保育所等の定員・申込者・待機児童（${HOIKU_ASOF_LABEL}時点）`;
  const sentence = `${m.name}の保育所等の利用定員は${HOIKU_ASOF_LABEL}時点で${fmt(r.capacity)}人（岩手県内33市町村中${rC.get(me) ?? '—'}位）、申込者は${fmt(r.applicants)}人。定員に対する申込は${fmt(fill)}%（県平均${fmt(pFill)}%）で、${slack != null && slack >= 0 ? `${fmt(slack)}人分の空きがある` : `申込が定員を${fmt(-(slack ?? 0))}人分上回っている`}。待機児童は${fmt(r.waiting)}人。`;
  return (
    <>
      <Breadcrumb items={[{ name: '保育所等', href: '/hoiku/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/hoiku/${m.slug}/`}
        keywords={[m.name, '保育所', '認定こども園', '待機児童', '利用定員', '岩手県']} temporal={HOIKU_ASOF_LABEL} sourceKeys={['hoiku']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の保育所等の利用定員は{HOIKU_ASOF_LABEL}時点で<strong>{fmt(r.capacity)}人</strong>、申込者は<strong>{fmt(r.applicants)}人</strong>。
        定員に対する申込は<strong>{fmt(fill)}%</strong>（県平均{fmt(pFill)}%、県内{rF.get(me) ?? '—'}位）で、
        {slack != null && slack >= 0 ? <>空きは<strong>{fmt(slack)}人分</strong>。</> : <>申込が定員を<strong>{fmt(-(slack ?? 0))}人分</strong>上回っている。</>}
        待機児童は<strong>{fmt(r.waiting)}人</strong>。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">利用定員</div><div className="stat-value">{fmt(r.capacity)}</div><div className="stat-sub">人・県内 {rC.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">申込者</div><div className="stat-value">{fmt(r.applicants)}</div><div className="stat-sub">人</div></div>
        <div className="stat"><div className="stat-label">充足率（申込 ÷ 定員）</div><div className="stat-value">{fill == null ? '—' : `${fmt(fill)}%`}</div><div className="stat-sub">県内 {rF.get(me) ?? '—'}位（県平均 {fmt(pFill)}%）</div></div>
        <div className="stat"><div className="stat-label">待機児童</div><div className="stat-value">{fmt(r.waiting)}</div><div className="stat-sub">人（国の定義）</div></div>
        {pop && <div className="stat"><div className="stat-label">人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(pop.total)}</div><div className="stat-sub">人 → <Link href={`/population/${m.slug}/`}>人口の推移を見る</Link></div></div>}
      </div>
      <h2>内訳</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>項目</th><th>{m.name}</th><th>岩手県（33市町村計）</th></tr></thead>
          <tbody>
            <tr><td>利用定員</td><td>{fmt(r.capacity)}人</td><td>{fmt(P.capacity)}人</td></tr>
            <tr><td>申込者</td><td>{fmt(r.applicants)}人</td><td>{fmt(P.applicants)}人</td></tr>
            <tr><td>定員の空き（定員 − 申込）</td><td className={(slack ?? 0) < 0 ? 'neg' : ''}>{fmt(slack)}人</td><td>{fmt(hoikuSlack(P))}人</td></tr>
            <tr className="hl"><td>待機児童（国の定義）</td><td>{fmt(r.waiting)}人</td><td>{fmt(P.waiting)}人</td></tr>
            <tr><td>育児休業中で待機児童に数えない</td><td>{fmt(r.on_leave)}人</td><td>{fmt(P.on_leave)}人</td></tr>
            <tr><td>特定の園のみ希望で待機児童に数えない</td><td>{fmt(r.specific_only)}人</td><td>{fmt(P.specific_only)}人</td></tr>
            <tr><td>求職活動を休止していて待機児童に数えない</td><td>{fmt(r.job_paused)}人</td><td>{fmt(P.job_paused)}人</td></tr>
            <tr><td>上記3つの合計</td><td>{fmt(hidden)}人</td><td>{fmt(hoikuHidden(P))}人</td></tr>
          </tbody>
        </table>
      </div>
      {(hidden ?? 0) > 0 && <p>{m.name}では待機児童{fmt(r.waiting)}人だが、育児休業中・特定の園のみ希望・求職活動休止で待機児童に数えられていない子どもが<strong>{fmt(hidden)}人</strong>いる。</p>}
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/haikou/${m.slug}/`}>{m.name}の廃校</Link></li>
        <li><Link href={`/school/${m.slug}/`}>{m.name}の学校・児童生徒数</Link></li>
        <li><Link href={`/vital/${m.slug}/`}>{m.name}の出生・死亡</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/hoiku/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['hoiku']} extra={[
        '利用定員は保育所・幼保連携型認定こども園・幼稚園型認定こども園等・地域型保育事業・特例保育等・企業主導型保育事業・地方単独事業の合計。幼稚園（1号認定のみ）は含まれない。',
        '「充足率」は申込者数を利用定員で割った本サイトの計算値。定員は年齢区分ごとに決まっているため、全体で空きがあっても0歳児だけ埋まっていることはある。',
        '「待機児童」は国の定義によるもの。育児休業中・特定の園のみ希望・求職活動を休止している場合は数えない。',
        '市区町村からの報告を単純に積み上げた数値で、こども家庭庁が公表する参考資料。',
      ]} />
    </>
  );
}
