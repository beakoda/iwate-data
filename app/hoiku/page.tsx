import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, hoikuAt, hoikuPref, hoikuFillRate, hoikuSlack, hoikuHidden, fmt, rank, HOIKU_ASOF_LABEL } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の保育所等の定員・申込者・待機児童（${HOIKU_ASOF_LABEL}時点）`;
const P = hoikuPref();
const PFILL = hoikuFillRate(P);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の保育所等の利用定員は${HOIKU_ASOF_LABEL}時点で${fmt(P.capacity)}人、申込者は${fmt(P.applicants)}人で、待機児童は${fmt(P.waiting)}人。定員に対する申込は${fmt(PFILL)}%で、${fmt(hoikuSlack(P))}人分の空きがある。33市町村別に定員・申込者・充足率を一覧。`,
  alternates: { canonical: '/hoiku/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = hoikuAt(m.code)!;
    return { m, r, fill: hoikuFillRate(r), slack: hoikuSlack(r), hidden: hoikuHidden(r) };
  });
  const rF = rank(rows, r => r.fill), rC = rank(rows, r => r.r.capacity);
  const byFill = [...rows].filter(r => r.fill != null).sort((a, b) => b.fill! - a.fill!);
  const byCap = [...rows].sort((a, b) => b.r.capacity - a.r.capacity);
  const over = rows.filter(r => (r.slack ?? 0) < 0);
  const low = [...byFill].reverse();
  const hidden = rows.reduce((a, r) => a + (r.hidden ?? 0), 0);
  const sentence = `岩手県の保育所等の利用定員は${HOIKU_ASOF_LABEL}時点で${fmt(P.capacity)}人、申込者は${fmt(P.applicants)}人で、国の定義による待機児童は33市町村すべてで0人。定員に対する申込は${fmt(PFILL)}%にとどまり、県全体で${fmt(hoikuSlack(P))}人分の空きがある。申込が定員を上回っているのは${over.length ? over.map(r => r.m.name).join('・') : 'なし'}。`;
  return (
    <>
      <Breadcrumb items={[{ name: '保育所等' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/hoiku/" keywords={['岩手県', '保育所', '認定こども園', '待機児童', '利用定員', '市町村別']} temporal={HOIKU_ASOF_LABEL} sourceKeys={['hoiku']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の保育所等の利用定員は{HOIKU_ASOF_LABEL}時点で<strong>{fmt(P.capacity)}人</strong>、申込者は<strong>{fmt(P.applicants)}人</strong>。<strong>待機児童は33市町村すべてで0人</strong>で、定員に対する申込は{fmt(PFILL)}%、県全体で<strong>{fmt(hoikuSlack(P))}人分の空き</strong>がある。申込が定員を上回っているのは{over.length ? <strong>{over.map(r => r.m.name).join('・')}だけ</strong> : 'ない'}。充足率が最も低いのは<strong>{low[0].m.name}（{fmt(low[0].fill)}%）</strong>で、定員の半分ほどしか埋まっていない。</p>
      <BarChart title={`定員に対する申込の割合（${HOIKU_ASOF_LABEL}時点、市町村別、%）`} items={byFill.map(r => ({ label: r.m.name, value: r.fill }))} unit="%" />
      <BarChart title={`保育所等の利用定員（${HOIKU_ASOF_LABEL}時点、市町村別、人）`} items={byCap.map(r => ({ label: r.m.name, value: r.r.capacity }))} unit="人" />
      <BarChart title={`定員の空き（定員 − 申込者、人）`} items={[...rows].sort((a, b) => (b.slack ?? 0) - (a.slack ?? 0)).map(r => ({ label: r.m.name, value: r.slack }))} unit="人" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>利用定員</th><th>順位</th><th>申込者</th><th>充足率</th><th>順位</th><th>空き</th><th>待機児童</th><th>特定園のみ希望</th><th>求職活動休止</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(P.capacity)}</td><td>—</td><td>{fmt(P.applicants)}</td><td>{fmt(PFILL)}%</td><td>—</td><td>{fmt(hoikuSlack(P))}</td><td>{fmt(P.waiting)}</td><td>{fmt(P.specific_only)}</td><td>{fmt(P.job_paused)}</td></tr>
            {byCap.map(r => (
              <tr key={r.m.code}><td><Link href={`/hoiku/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.capacity)}</td><td>{rC.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.applicants)}</td><td>{r.fill == null ? '—' : `${fmt(r.fill)}%`}</td><td>{rF.get(r) ?? '—'}位</td>
                <td className={(r.slack ?? 0) < 0 ? 'neg' : ''}>{fmt(r.slack)}</td>
                <td>{fmt(r.r.waiting)}</td><td>{fmt(r.r.specific_only)}</td><td>{fmt(r.r.job_paused)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>待機児童に数えない子ども</h2>
      <p>国の定義では、育児休業中の人、特定の園だけを希望している人、求職活動を休止している人は「待機児童」に数えない。岩手県ではこれに当たる子どもが<strong>{fmt(hidden)}人</strong>（特定の園だけを希望{fmt(P.specific_only)}人、求職活動を休止{fmt(P.job_paused)}人、育児休業中{fmt(P.on_leave)}人）いる。待機児童0人でも、希望する園に入れていない家庭はある。</p>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = hoikuAt(m.code)!; return <li key={m.code}><Link href={`/hoiku/${m.slug}/`}>{m.name}の保育所等<small>定員{fmt(r.capacity)}人・申込{fmt(r.applicants)}人・充足率{fmt(hoikuFillRate(r))}%</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/hoiku/" sentence={sentence} />
      <SourceBox keys={['hoiku']} extra={[
        '利用定員は保育所・幼保連携型認定こども園・幼稚園型認定こども園等・地域型保育事業・特例保育等・企業主導型保育事業・地方単独事業の合計。幼稚園（1号認定のみ）は含まれない。',
        '「充足率」は申込者数を利用定員で割った本サイトの計算値。定員は年齢区分ごとに決まっているため、全体で空きがあっても0歳児だけ埋まっている、といったことは起こりうる。',
        '「待機児童」は国の定義によるもの。育児休業中・特定の園のみ希望・求職活動を休止している場合は待機児童に数えないため、0人でも希望どおりに預けられていない家庭はある。',
        '市区町村からの報告を単純に積み上げた数値で、こども家庭庁が公表する参考資料。',
        '保育所の施設数の時系列は「学校」ページ（学校基本調査の幼稚園）や「介護施設・国保」とは別の統計で、いずれとも一致しない。',
      ]} />
    </>
  );
}
