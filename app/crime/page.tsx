import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, crimeAt, crimePrefAt, crimePerKpop, fmt, fmtSigned, pct, rank, CRIME_YEARS, CRIME_TYPES, LATEST_CRIME, CRIME_FULL_FROM } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の街頭犯罪発生件数（${CRIME_FULL_FROM}〜${LATEST_CRIME}年・自転車盗／車上ねらいほか7手口）`;
const pNow = crimePrefAt(LATEST_CRIME);
const pFirst = crimePrefAt(CRIME_FULL_FROM);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の街頭犯罪（自転車盗・車上ねらい・部品ねらい・自動販売機ねらい・自動車盗・オートバイ盗・ひったくりの7手口）は${LATEST_CRIME}年に${fmt(pNow.total)}件。岩手県警のオープンデータ（事件1件ごとの発生記録）を市町村×年×手口で集計し、人口千人当たりと県内順位を一覧。`,
  alternates: { canonical: '/crime/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = crimeAt(m.code, LATEST_CRIME)!, r0 = crimeAt(m.code, CRIME_FULL_FROM)!;
    return { m, r, r0, per: crimePerKpop(r.total, m.code, LATEST_CRIME) };
  });
  const rT = rank(rows, r => r.r.total), rP = rank(rows, r => r.per);
  const byTotal = [...rows].sort((a, b) => b.r.total - a.r.total);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const zero = rows.filter(r => r.r.total === 0).map(r => r.m.name);
  const bikeShare = pNow.total ? Math.round((pNow['自転車盗'] / pNow.total) * 1000) / 10 : null;
  const sentence = `岩手県の街頭犯罪7手口の発生件数は${LATEST_CRIME}年に${fmt(pNow.total)}件で、${CRIME_FULL_FROM}年（${fmt(pFirst.total)}件）から${fmtSigned(pct(pNow.total, pFirst.total), '%')}。最多手口は自転車盗の${fmt(pNow['自転車盗'])}件（全体の${fmt(bikeShare)}%）。市町村別では${byTotal[0].m.name}が${fmt(byTotal[0].r.total)}件で最も多く、人口千人当たりでは${byPer[0].m.name}が${fmt(byPer[0].per)}件で最も多い。`;
  return (
    <>
      <Breadcrumb items={[{ name: '街頭犯罪' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/crime/" keywords={['岩手県', '犯罪', 'street crime', '自転車盗', '車上ねらい', '治安', '市町村別', '岩手県警']} temporal={`${CRIME_FULL_FROM}/${LATEST_CRIME}`} sourceKeys={['crime']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の街頭犯罪7手口は{LATEST_CRIME}年に<strong>{fmt(pNow.total)}件</strong>（{CRIME_FULL_FROM}年比{fmtSigned(pct(pNow.total, pFirst.total), '%')}）。うち<strong>自転車盗が{fmt(pNow['自転車盗'])}件</strong>で全体の{fmt(bikeShare)}%を占める。件数が最も多いのは<strong>{byTotal[0].m.name}（{fmt(byTotal[0].r.total)}件）</strong>だが、人口千人当たりでは<strong>{byPer[0].m.name}（{fmt(byPer[0].per)}件）</strong>が最も多い。{LATEST_CRIME}年に発生が1件もなかったのは<strong>{zero.length}市町村</strong>。</p>
      <LineChart title={`岩手県の街頭犯罪発生件数（${CRIME_FULL_FROM}〜${LATEST_CRIME}年、件）`} unit="件" zero
        series={[{ label: '7手口の合計', points: CRIME_YEARS.filter(y => y >= CRIME_FULL_FROM).map(y => ({ x: y, y: crimePrefAt(y).total })) }]} />
      <LineChart title={`手口別の発生件数（岩手県、${CRIME_FULL_FROM}〜${LATEST_CRIME}年、件）`} unit="件" zero
        series={CRIME_TYPES.map(t => ({ label: t, points: CRIME_YEARS.filter(y => y >= CRIME_FULL_FROM).map(y => ({ x: y, y: crimePrefAt(y)[t] })) }))} />
      <BarChart title={`街頭犯罪の発生件数（${LATEST_CRIME}年、市町村別）`} items={byTotal.map(r => ({ label: r.m.name, value: r.r.total }))} unit="件" />
      <BarChart title={`人口千人当たりの発生件数（${LATEST_CRIME}年、市町村別）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} unit="件" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>{LATEST_CRIME}年 合計</th><th>順位</th><th>千人当たり</th><th>順位</th><th>{CRIME_FULL_FROM}年</th>{CRIME_TYPES.map(t => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.total)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pFirst.total)}</td>{CRIME_TYPES.map(t => <td key={t}>{fmt(pNow[t])}</td>)}</tr>
            {byTotal.map(r => (
              <tr key={r.m.code}><td><Link href={`/crime/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.total)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td>{fmt(r.per)}</td><td>{rP.get(r) ?? '—'}位</td><td>{fmt(r.r0.total)}</td>
                {CRIME_TYPES.map(t => <td key={t}>{fmt(r.r[t])}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = crimeAt(m.code, LATEST_CRIME)!; return <li key={m.code}><Link href={`/crime/${m.slug}/`}>{m.name}の街頭犯罪<small>{LATEST_CRIME}年 {fmt(r.total)}件</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/crime/" sentence={sentence} />
      <SourceBox keys={['crime']} extra={[
        '対象は岩手県警がオープンデータとして公開している7手口（自転車盗・車上ねらい・部品ねらい・自動販売機ねらい・自動車盗・オートバイ盗・ひったくり）のみ。刑法犯認知件数の全体ではないため、「治安の良し悪し」を直接示す数字ではない。',
        'このページの数値は「犯罪オープンデータ」（岩手県警察）を本サイトが市町村×年×手口に集計して作成したもので、岩手県警察が作成・公表した表ではない。原データの利用条件は公共データ利用規約（第1.0版・PDL1.0）。',
        `${CRIME_YEARS[0]}〜${CRIME_FULL_FROM - 1}年は一部の手口・一部の期間しか公開されていないため、このページの県計・グラフは${CRIME_FULL_FROM}年以降のみを使っている。市町村別ページには全期間を掲載。`,
        '年は「発生年月日（始期）」の年。市町村は「発生地」であり、被害者の居住地ではない。',
        '人口千人当たりは、その年の件数を翌年1月1日の住民基本台帳人口で割った本サイトの計算値。',
        '発生件数は昼間人口や自転車の利用状況に大きく左右される。通勤・通学の流入が多い市町村ほど、居住人口当たりでは高く出る。',
      ]} />
    </>
  );
}
