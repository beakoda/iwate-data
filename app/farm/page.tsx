import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, farmAt, farmPrefAt, totalFarms, fmt, fmtSigned, pct, rank, FARM_YEARS, LATEST_FARM, FIRST_FARM, LAST_ABANDONED_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';
import { IwateMap } from '@/components/Map';

const TITLE = `岩手県33市町村の農家数・耕作放棄地（${FIRST_FARM}〜${LATEST_FARM}年）`;
const pNow = farmPrefAt(LATEST_FARM);
const pFirst = farmPrefAt(FIRST_FARM);
const pAb = farmPrefAt(LAST_ABANDONED_YEAR);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の販売農家は${LATEST_FARM}年に${fmt(pNow.sales_farms)}戸、総農家数${fmt(totalFarms(pNow))}戸。33市町村別に販売農家・自給的農家・専業兼業別の農家数と耕作放棄地面積を農林業センサスから一覧。`,
  alternates: { canonical: '/farm/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = farmAt(m.code, LATEST_FARM)!, r0 = farmAt(m.code, FIRST_FARM)!, ra = farmAt(m.code, LAST_ABANDONED_YEAR)!;
    return { m, r, r0, ra, tot: totalFarms(r), tot0: totalFarms(r0) };
  });
  const rS = rank(rows, x => x.r.sales_farms), rA = rank(rows, x => x.ra.abandoned);
  const byS = [...rows].sort((a, b) => (b.r.sales_farms ?? 0) - (a.r.sales_farms ?? 0));
  const byA = [...rows].filter(x => x.ra.abandoned != null).sort((a, b) => (b.ra.abandoned ?? 0) - (a.ra.abandoned ?? 0));
  const sentence = `岩手県の販売農家は${LATEST_FARM}年に${fmt(pNow.sales_farms)}戸で、${FIRST_FARM}年の${fmt(pFirst.sales_farms)}戸から${fmtSigned(pct(pNow.sales_farms, pFirst.sales_farms), '%')}。自給的農家${fmt(pNow.self_farms)}戸を合わせた総農家数は${fmt(totalFarms(pNow))}戸。販売農家が最も多いのは${byS[0].m.name}（${fmt(byS[0].r.sales_farms)}戸）。耕作放棄地面積は${LAST_ABANDONED_YEAR}年に${fmt(pAb.abandoned)}haで、最も広いのは${byA[0].m.name}（${fmt(byA[0].ra.abandoned)}ha）。`;
  return (
    <>
      <Breadcrumb items={[{ name: '農家数・耕作放棄地' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/farm/" keywords={['岩手県', '農家数', '販売農家', '自給的農家', '専業農家', '兼業農家', '耕作放棄地', '農林業センサス', '市町村別']} temporal={`${FIRST_FARM}/${LATEST_FARM}`} sourceKeys={['farm']} />
      <h1>{TITLE}</h1>
      <MuniStrip family="farm" />
      <p className="key-fact">岩手県の販売農家は{LATEST_FARM}年に<strong>{fmt(pNow.sales_farms)}戸</strong>で、{FIRST_FARM}年の{fmt(pFirst.sales_farms)}戸から<strong>{fmtSigned(pct(pNow.sales_farms, pFirst.sales_farms), '%')}</strong>。自給的農家{fmt(pNow.self_farms)}戸を合わせた総農家数は{fmt(totalFarms(pNow))}戸。販売農家が最も多いのは<strong>{byS[0].m.name}（{fmt(byS[0].r.sales_farms)}戸）</strong>、次いで{byS[1].m.name}（{fmt(byS[1].r.sales_farms)}戸）。耕作放棄地面積は{LAST_ABANDONED_YEAR}年に<strong>{fmt(pAb.abandoned)}ha</strong>で、最も広いのは{byA[0].m.name}（{fmt(byA[0].ra.abandoned)}ha）。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">販売農家（{LATEST_FARM}年）</div><div className="stat-value">{fmt(pNow.sales_farms)}</div><div className="stat-sub">戸・{FIRST_FARM}年比 {fmtSigned(pct(pNow.sales_farms, pFirst.sales_farms), '%')}</div></div>
        <div className="stat"><div className="stat-label">自給的農家</div><div className="stat-value">{fmt(pNow.self_farms)}</div><div className="stat-sub">戸・{FIRST_FARM}年比 {fmtSigned(pct(pNow.self_farms, pFirst.self_farms), '%')}</div></div>
        <div className="stat"><div className="stat-label">総農家数</div><div className="stat-value">{fmt(totalFarms(pNow))}</div><div className="stat-sub">戸・販売＋自給的</div></div>
        <div className="stat"><div className="stat-label">耕作放棄地（{LAST_ABANDONED_YEAR}年）</div><div className="stat-value">{fmt(pAb.abandoned)}</div><div className="stat-sub">ha・{FIRST_FARM}年 {fmt(pFirst.abandoned)}ha</div></div>
      </div>
      <IwateMap title={`販売農家数（${LATEST_FARM}年）`} unit="戸" decimals={0} family="farm" values={rows.map(x => ({ code: x.m.code, value: x.r.sales_farms ?? null }))} />
      <Tools family="farm" slug="all" label="33市町村の全年データ" />

      <LineChart title={`岩手県の農家数（${FIRST_FARM}〜${LATEST_FARM}年、戸）`} unit="戸" zero
        series={[
          { label: '販売農家', points: FARM_YEARS.map(y => ({ x: y, y: farmPrefAt(y).sales_farms ?? 0 })) },
          { label: '自給的農家', points: FARM_YEARS.map(y => ({ x: y, y: farmPrefAt(y).self_farms ?? 0 })) },
        ]} />
      <BarChart title={`販売農家数（${LATEST_FARM}年、市町村別）`} items={byS.map(x => ({ label: x.m.name, value: x.r.sales_farms }))} unit="戸" />
      <BarChart title={`耕作放棄地面積（${LAST_ABANDONED_YEAR}年、市町村別）`} items={byA.map(x => ({ label: x.m.name, value: x.ra.abandoned }))} unit="ha" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>販売農家 {LATEST_FARM}年</th><th>順位</th><th>{FIRST_FARM}年比</th><th>自給的農家</th><th>総農家数</th><th>専業農家 {LAST_ABANDONED_YEAR}年</th><th>兼業農家</th><th>耕作放棄地 {LAST_ABANDONED_YEAR}年</th><th>順位</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.sales_farms)}</td><td>—</td><td>{fmtSigned(pct(pNow.sales_farms, pFirst.sales_farms), '%')}</td><td>{fmt(pNow.self_farms)}</td><td>{fmt(totalFarms(pNow))}</td><td>{fmt(pAb.full_farms)}</td><td>{fmt(pAb.part_farms)}</td><td>{fmt(pAb.abandoned)}</td><td>—</td></tr>
            {byS.map(x => (
              <tr key={x.m.code}><td><Link href={`/farm/${x.m.slug}/`}>{x.m.name}</Link></td>
                <td>{fmt(x.r.sales_farms)}</td><td>{rS.get(x) ?? '—'}位</td>
                <td className="neg">{fmtSigned(pct(x.r.sales_farms, x.r0.sales_farms), '%')}</td>
                <td>{fmt(x.r.self_farms)}</td><td>{fmt(x.tot)}</td>
                <td>{fmt(x.ra.full_farms)}</td><td>{fmt(x.ra.part_farms)}</td>
                <td>{fmt(x.ra.abandoned)}</td><td>{rA.get(x) ?? '—'}位</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = farmAt(m.code, LATEST_FARM)!; return <li key={m.code}><Link href={`/farm/${m.slug}/`}>{m.name}の農家数<small>{LATEST_FARM}年 販売農家{fmt(r.sales_farms)}戸・総農家{fmt(totalFarms(r))}戸</small></Link></li>; })}</ul>
      <Cta topic="農家数" />
      <CiteBox title={TITLE} path="/farm/" sentence={sentence} />
      <SourceBox keys={['farm']} extra={[
        '販売農家＝経営耕地30a以上、または農産物販売金額50万円以上の農家。自給的農家はそれ未満。総農家数＝販売農家＋自給的農家（本サイトの計算値）。',
        '専業・兼業の区分と耕作放棄地面積は2015年農林業センサス（表章年2014年）までの調査項目で、2020年センサスでは調査されていない。このため該当欄は2014年の値。',
        '農林業センサスは5年ごとの調査のため、値は5年刻みになる。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と一致することを確認している（耕作放棄地の2009年のみ、ha単位の丸めにより1ha多い）。',
      ]} />
    </>
  );
}
