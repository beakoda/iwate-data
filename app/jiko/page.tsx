import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, trafficAt, trafficPrefAt, accPer10k, fatalRate, fmt, fmtSigned, pct, rank, TRAFFIC_YEARS, LATEST_TRAFFIC, FIRST_TRAFFIC } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の交通事故件数・死者数（${FIRST_TRAFFIC}〜${LATEST_TRAFFIC}年）`;
const P = trafficPrefAt(LATEST_TRAFFIC);
const P0 = trafficPrefAt(FIRST_TRAFFIC);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の人身交通事故は${LATEST_TRAFFIC}年に${fmt(P.accidents)}件、死者${fmt(P.deaths)}人、負傷者${fmt(P.injuries)}人。警察庁のオープンデータ（事故1件ごとの記録）を市町村×年で集計し、人口1万人当たりと県内順位を一覧。`,
  alternates: { canonical: '/jiko/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = trafficAt(m.code, LATEST_TRAFFIC)!, r0 = trafficAt(m.code, FIRST_TRAFFIC)!;
    return { m, r, r0, per: accPer10k(r.accidents, m.code, LATEST_TRAFFIC) };
  });
  const rT = rank(rows, r => r.r.accidents), rP = rank(rows, r => r.per);
  const byTotal = [...rows].sort((a, b) => b.r.accidents - a.r.accidents);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const deaths6 = TRAFFIC_YEARS.reduce((a, y) => a + trafficPrefAt(y).deaths, 0);
  const sentence = `岩手県の人身交通事故は${LATEST_TRAFFIC}年に${fmt(P.accidents)}件で、${FIRST_TRAFFIC}年（${fmt(P0.accidents)}件）から${fmtSigned(pct(P.accidents, P0.accidents), '%')}。死者は${fmt(P.deaths)}人（${FIRST_TRAFFIC}年${fmt(P0.deaths)}人）、負傷者は${fmt(P.injuries)}人。市町村別では${byTotal[0].m.name}が${fmt(byTotal[0].r.accidents)}件で最も多く、人口1万人当たりでは${byPer[0].m.name}が${fmt(byPer[0].per)}件で最も多い。`;
  return (
    <>
      <Breadcrumb items={[{ name: '交通事故' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/jiko/" keywords={['岩手県', '交通事故', '死者数', '負傷者', '人身事故', '市町村別', '警察庁']} temporal={`${FIRST_TRAFFIC}/${LATEST_TRAFFIC}`} sourceKeys={['traffic']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の人身交通事故は{LATEST_TRAFFIC}年に<strong>{fmt(P.accidents)}件</strong>（{FIRST_TRAFFIC}年比{fmtSigned(pct(P.accidents, P0.accidents), '%')}）、<strong>死者{fmt(P.deaths)}人</strong>・負傷者{fmt(P.injuries)}人。{FIRST_TRAFFIC}年からの6年間で県内で<strong>{deaths6}人</strong>が亡くなっている。件数が最も多いのは<strong>{byTotal[0].m.name}（{fmt(byTotal[0].r.accidents)}件）</strong>で県全体の{fmt(Math.round((byTotal[0].r.accidents / P.accidents) * 1000) / 10)}%を占める。人口1万人当たりでは<strong>{byPer[0].m.name}（{fmt(byPer[0].per)}件）</strong>。</p>
      <LineChart title={`岩手県の人身交通事故件数と負傷者数（${FIRST_TRAFFIC}〜${LATEST_TRAFFIC}年）`} unit="件" zero
        series={[
          { label: '人身事故件数', points: TRAFFIC_YEARS.map(y => ({ x: y, y: trafficPrefAt(y).accidents })) },
          { label: '負傷者数', points: TRAFFIC_YEARS.map(y => ({ x: y, y: trafficPrefAt(y).injuries })) },
        ]} />
      <LineChart title={`岩手県の交通事故死者数（${FIRST_TRAFFIC}〜${LATEST_TRAFFIC}年、人）`} unit="人" zero
        series={[{ label: '死者数', points: TRAFFIC_YEARS.map(y => ({ x: y, y: trafficPrefAt(y).deaths })) }]} />
      <BarChart title={`人身交通事故の件数（${LATEST_TRAFFIC}年、市町村別）`} items={byTotal.map(r => ({ label: r.m.name, value: r.r.accidents }))} unit="件" />
      <BarChart title={`人口1万人当たりの事故件数（${LATEST_TRAFFIC}年、市町村別）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} unit="件" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>{LATEST_TRAFFIC}年 事故</th><th>順位</th><th>1万人当たり</th><th>順位</th><th>死者</th><th>負傷者</th><th>死亡事故率</th><th>{FIRST_TRAFFIC}年 事故</th><th>6年の死者計</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(P.accidents)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(P.deaths)}</td><td>{fmt(P.injuries)}</td><td>{fmt(fatalRate(P))}%</td><td>{fmt(P0.accidents)}</td><td>{deaths6}</td></tr>
            {byTotal.map(r => {
              const d6 = TRAFFIC_YEARS.reduce((a, y) => a + (trafficAt(r.m.code, y)?.deaths ?? 0), 0);
              return <tr key={r.m.code}><td><Link href={`/jiko/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.accidents)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td>{fmt(r.per)}</td><td>{rP.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.deaths)}</td><td>{fmt(r.r.injuries)}</td><td>{r.r.accidents ? `${fmt(fatalRate(r.r))}%` : '—'}</td>
                <td>{fmt(r.r0.accidents)}</td><td>{d6}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = trafficAt(m.code, LATEST_TRAFFIC)!; return <li key={m.code}><Link href={`/jiko/${m.slug}/`}>{m.name}の交通事故<small>{LATEST_TRAFFIC}年 {fmt(r.accidents)}件・死者{fmt(r.deaths)}人</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/jiko/" sentence={sentence} />
      <SourceBox keys={['traffic']} extra={[
        '人身事故（人が死傷した事故）のみ。物損事故は含まれない。',
        '市町村は「発生地」であり、当事者の居住地ではない。通過交通の多い市町村では、居住人口当たりの件数が高く出る。',
        '死者数は事故発生から24時間以内に亡くなった人の数（警察庁の定義）。',
        '「死亡事故率」は死亡事故の件数を人身事故の件数で割った本サイトの計算値。',
        `人口1万人当たりは、その年の件数を翌年1月1日の住民基本台帳人口で割った本サイトの計算値。`,
        '警察庁のデータでは岩手県は都道府県コード21（JISコードの03ではない）。本サイトでは市区町村コードと突き合わせてJISコードに変換している。',
      ]} />
    </>
  );
}
