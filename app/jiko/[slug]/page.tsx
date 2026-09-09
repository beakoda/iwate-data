import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, trafficAt, trafficSeries, trafficPrefAt, accPer10k, fatalRate, popAt, fmt, fmtSigned, pct, rank, TRAFFIC_YEARS, LATEST_TRAFFIC, FIRST_TRAFFIC, LATEST_POP } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = trafficAt(m.code, LATEST_TRAFFIC)!;
  return {
    title: `${m.name}の交通事故件数・死者数（${FIRST_TRAFFIC}〜${LATEST_TRAFFIC}年）`,
    description: `${m.name}（岩手県）の人身交通事故は${LATEST_TRAFFIC}年に${fmt(r.accidents)}件、死者${fmt(r.deaths)}人、負傷者${fmt(r.injuries)}人。人口1万人当たりと県内33市町村の順位を、警察庁のオープンデータから集計。`,
    alternates: { canonical: `/jiko/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = trafficSeries(m.code);
  const r = trafficAt(m.code, LATEST_TRAFFIC)!, r0 = trafficAt(m.code, FIRST_TRAFFIC)!;
  const per = accPer10k(r.accidents, m.code, LATEST_TRAFFIC);
  const rows = MUNIS.map(mm => {
    const x = trafficAt(mm.code, LATEST_TRAFFIC)!;
    return { m: mm, n: x.accidents, per: accPer10k(x.accidents, mm.code, LATEST_TRAFFIC), d: x.deaths };
  });
  const rT = rank(rows, x => x.n), rP = rank(rows, x => x.per);
  const me = rows.find(x => x.m.code === m.code)!;
  const P = trafficPrefAt(LATEST_TRAFFIC);
  const prefPop = MUNIS.reduce((a, x) => a + (popAt(x.code, Math.min(LATEST_TRAFFIC + 1, LATEST_POP))?.total ?? 0), 0);
  const prefPer = prefPop ? Math.round((P.accidents / prefPop) * 10000 * 10) / 10 : null;
  const d6 = TRAFFIC_YEARS.reduce((a, y) => a + (trafficAt(m.code, y)?.deaths ?? 0), 0);
  const pop = popAt(m.code, Math.min(LATEST_TRAFFIC + 1, LATEST_POP));
  const title = `${m.name}の交通事故件数・死者数（${FIRST_TRAFFIC}〜${LATEST_TRAFFIC}年）`;
  const sentence = `${m.name}の人身交通事故は${LATEST_TRAFFIC}年に${fmt(r.accidents)}件で、人口1万人当たり${fmt(per)}件（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPer)}件）。死者${fmt(r.deaths)}人・負傷者${fmt(r.injuries)}人で、${FIRST_TRAFFIC}年からの6年間の死者は${d6}人。`;
  return (
    <>
      <Breadcrumb items={[{ name: '交通事故', href: '/jiko/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/jiko/${m.slug}/`}
        keywords={[m.name, '交通事故', '死者数', '負傷者', '人身事故', '岩手県']} temporal={`${FIRST_TRAFFIC}/${LATEST_TRAFFIC}`} sourceKeys={['traffic']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の人身交通事故は{LATEST_TRAFFIC}年に<strong>{fmt(r.accidents)}件</strong>（{FIRST_TRAFFIC}年比{fmtSigned(pct(r.accidents, r0.accidents), '%')}）。
        人口1万人当たり<strong>{fmt(per)}件</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}件）。
        {LATEST_TRAFFIC}年の死者は{fmt(r.deaths)}人、{FIRST_TRAFFIC}年からの6年間では<strong>{d6}人</strong>。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">人身事故（{LATEST_TRAFFIC}年）</div><div className="stat-value">{fmt(r.accidents)}</div><div className="stat-sub">件・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口1万人当たり</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">件・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPer)}）</div></div>
        <div className="stat"><div className="stat-label">死者（{LATEST_TRAFFIC}年）</div><div className="stat-value">{fmt(r.deaths)}</div><div className="stat-sub">人・6年計 {d6}人</div></div>
        <div className="stat"><div className="stat-label">負傷者（{LATEST_TRAFFIC}年）</div><div className="stat-value">{fmt(r.injuries)}</div><div className="stat-sub">人・死亡事故率 {r.accidents ? `${fmt(fatalRate(r))}%` : '—'}</div></div>
        {pop && <div className="stat"><div className="stat-label">人口（{Math.min(LATEST_TRAFFIC + 1, LATEST_POP)}年1月1日）</div><div className="stat-value">{fmt(pop.total)}</div><div className="stat-sub">人 → <Link href={`/population/${m.slug}/`}>人口の推移を見る</Link></div></div>}
      </div>
      <LineChart title={`${m.name}の人身交通事故件数と負傷者数（${FIRST_TRAFFIC}〜${LATEST_TRAFFIC}年）`} unit="件" zero
        series={[
          { label: '人身事故件数', points: s.map(x => ({ x: x.year, y: x.accidents })) },
          { label: '負傷者数', points: s.map(x => ({ x: x.year, y: x.injuries })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>人身事故</th><th>うち死亡事故</th><th>死者</th><th>負傷者</th><th>1万人当たり</th></tr></thead>
          <tbody>
            {s.map(x => <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.accidents)}</td><td>{fmt(x.fatal_accidents)}</td>
              <td>{fmt(x.deaths)}</td><td>{fmt(x.injuries)}</td><td>{fmt(accPer10k(x.accidents, m.code, x.year))}</td></tr>)}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/crime/${m.slug}/`}>{m.name}の街頭犯罪</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口</Link></li>
        <li><Link href={`/work/${m.slug}/`}>{m.name}の就業者・昼夜間人口</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/jiko/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['traffic']} extra={[
        '人身事故（人が死傷した事故）のみ。物損事故は含まれない。',
        '市町村は「発生地」であり、当事者の居住地ではない。通過交通の多い市町村では居住人口当たりの件数が高く出る。',
        '死者数は事故発生から24時間以内に亡くなった人の数（警察庁の定義）。',
        '人口1万人当たりは、その年の件数を翌年1月1日の住民基本台帳人口で割った本サイトの計算値。',
      ]} />
    </>
  );
}
