import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, farmAt, farmSeries, farmPrefAt, totalFarms, fmt, fmtSigned, pct, rank, LATEST_FARM, FIRST_FARM, LAST_ABANDONED_YEAR } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = farmAt(m.code, LATEST_FARM)!;
  return {
    title: `${m.name}の農家数・耕作放棄地の推移（${FIRST_FARM}〜${LATEST_FARM}年）`,
    description: `${m.name}（岩手県）の販売農家は${LATEST_FARM}年に${fmt(r.sales_farms)}戸、自給的農家${fmt(r.self_farms)}戸、総農家数${fmt(totalFarms(r))}戸。県内33市町村の順位つきで農林業センサスから集計。`,
    alternates: { canonical: `/farm/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = farmSeries(m.code);
  const r = farmAt(m.code, LATEST_FARM)!, r0 = farmAt(m.code, FIRST_FARM)!, ra = farmAt(m.code, LAST_ABANDONED_YEAR)!;
  const pref = farmPrefAt(LATEST_FARM), prefA = farmPrefAt(LAST_ABANDONED_YEAR);
  const rows = MUNIS.map(mm => { const x = farmAt(mm.code, LATEST_FARM)!, xa = farmAt(mm.code, LAST_ABANDONED_YEAR)!; return { m: mm, s: x.sales_farms, t: totalFarms(x), a: xa.abandoned }; });
  const rS = rank(rows, x => x.s), rT = rank(rows, x => x.t), rA = rank(rows, x => x.a);
  const me = rows.find(x => x.m.code === m.code)!;
  const title = `${m.name}の農家数・耕作放棄地の推移（${FIRST_FARM}〜${LATEST_FARM}年）`;
  const sentence = `${m.name}の販売農家は${LATEST_FARM}年に${fmt(r.sales_farms)}戸で、岩手県内33市町村中${rS.get(me) ?? '—'}位。${FIRST_FARM}年の${fmt(r0.sales_farms)}戸から${fmtSigned(pct(r.sales_farms, r0.sales_farms), '%')}。自給的農家${fmt(r.self_farms)}戸を合わせた総農家数は${fmt(totalFarms(r))}戸。耕作放棄地面積は${LAST_ABANDONED_YEAR}年に${fmt(ra.abandoned)}haで県内${rA.get(me) ?? '—'}位。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '農家数・耕作放棄地', href: '/farm/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/farm/${m.slug}/`}
        keywords={[m.name, '農家数', '販売農家', '自給的農家', '専業農家', '兼業農家', '耕作放棄地', '農林業センサス', '岩手県']} temporal={`${FIRST_FARM}/${LATEST_FARM}`} sourceKeys={['farm']} />
      <h1>{title}</h1>
      <MuniStrip family="farm" current={m.code} />
      <p className="key-fact">
        {m.name}の販売農家は{LATEST_FARM}年に<strong>{fmt(r.sales_farms)}戸</strong>で岩手県内<strong>{rS.get(me) ?? '—'}位</strong>。{FIRST_FARM}年（{fmt(r0.sales_farms)}戸）から<strong>{fmtSigned(pct(r.sales_farms, r0.sales_farms), '%')}</strong>。
        自給的農家{fmt(r.self_farms)}戸を合わせた総農家数は{fmt(totalFarms(r))}戸（県内{rT.get(me) ?? '—'}位）。耕作放棄地は{LAST_ABANDONED_YEAR}年に{fmt(ra.abandoned)}ha。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">販売農家（{LATEST_FARM}年）</div><div className="stat-value">{fmt(r.sales_farms)}</div><div className="stat-sub">戸・県内 {rS.get(me) ?? '—'}位・{FIRST_FARM}年比 {fmtSigned(pct(r.sales_farms, r0.sales_farms), '%')}</div></div>
        <div className="stat"><div className="stat-label">自給的農家</div><div className="stat-value">{fmt(r.self_farms)}</div><div className="stat-sub">戸・{FIRST_FARM}年 {fmt(r0.self_farms)}戸</div></div>
        <div className="stat"><div className="stat-label">総農家数</div><div className="stat-value">{fmt(totalFarms(r))}</div><div className="stat-sub">戸・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">専業農家（{LAST_ABANDONED_YEAR}年）</div><div className="stat-value">{fmt(ra.full_farms)}</div><div className="stat-sub">戸・兼業農家 {fmt(ra.part_farms)}戸</div></div>
        <div className="stat"><div className="stat-label">耕作放棄地（{LAST_ABANDONED_YEAR}年）</div><div className="stat-value">{fmt(ra.abandoned)}</div><div className="stat-sub">ha・県内 {rA.get(me) ?? '—'}位・{FIRST_FARM}年 {fmt(r0.abandoned)}ha</div></div>
      </div>
      <Tools family="farm" slug={m.slug} label={`${m.name}の全年データ`} />
      <LineChart title={`${m.name}の農家数（${FIRST_FARM}〜${LATEST_FARM}年、戸）`} unit="戸" zero
        series={[
          { label: '販売農家', points: s.map(x => ({ x: x.year, y: x.sales_farms ?? 0 })) },
          { label: '自給的農家', points: s.map(x => ({ x: x.year, y: x.self_farms ?? 0 })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>販売農家</th><th>自給的農家</th><th>総農家数</th><th>専業農家</th><th>兼業農家</th><th>耕作放棄地(ha)</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.sales_farms)}</td><td>{fmt(x.self_farms)}</td><td>{fmt(totalFarms(x))}</td>
                <td>{fmt(x.full_farms)}</td><td>{fmt(x.part_farms)}</td><td>{fmt(x.abandoned)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/economy/${m.slug}/`}>{m.name}の所得・製造業・耕地面積</Link></li>
        <li><Link href={`/work/${m.slug}/`}>{m.name}の産業別就業者</Link></li>
        <li><Link href={`/industry/agriculture-fishery/`}>岩手県の農林漁業の事業所</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <Cta muni={m.name} topic="農家数" />
      <CiteBox title={title} path={`/farm/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['farm']} extra={[
        '販売農家＝経営耕地30a以上、または農産物販売金額50万円以上の農家。自給的農家はそれ未満。総農家数＝販売農家＋自給的農家（本サイトの計算値）。',
        `専業・兼業の区分と耕作放棄地面積は2015年農林業センサス（表章年${LAST_ABANDONED_YEAR}年）までの調査項目で、2020年センサスでは調査されていない。`,
        '農林業センサスは5年ごとの調査のため、値は5年刻みになる。農業経営体（法人を含む）の統計とは集計単位が異なる。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
