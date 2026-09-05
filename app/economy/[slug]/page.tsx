import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, econAt2, econSeries, econPrefAt, incomePerTaxpayer, popAt, fmt, fmtSigned, pct, rank, ECON_YEARS, LATEST_ECON, FIRST_ECON, MFG_GAP_YEAR } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = econAt2(m.code, LATEST_ECON)!;
  return {
    title: `${m.name}の課税対象所得・製造品出荷額・耕地面積（${FIRST_ECON}〜${LATEST_ECON}年）`,
    description: `${m.name}（岩手県）の納税義務者1人当たり課税対象所得は${LATEST_ECON}年に${fmt(incomePerTaxpayer(r))}円、製造品出荷額等は${fmt(r.mfg_shipment)}百万円、耕地面積は${fmt(r.farmland)}ha。県内33市町村の順位つき。`,
    alternates: { canonical: `/economy/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = econSeries(m.code);
  const r = econAt2(m.code, LATEST_ECON)!, r0 = econAt2(m.code, FIRST_ECON)!;
  const pref = econPrefAt(LATEST_ECON);
  const per = incomePerTaxpayer(r), per0 = incomePerTaxpayer(r0), prefPer = incomePerTaxpayer(pref);
  const pop = popAt(m.code, LATEST_ECON)?.total ?? null;
  const rows = MUNIS.map(mm => { const x = econAt2(mm.code, LATEST_ECON)!; return { m: mm, per: incomePerTaxpayer(x), mfg: x.mfg_shipment, farm: x.farmland, w: x.mfg_workers }; });
  const rI = rank(rows, x => x.per), rM = rank(rows, x => x.mfg), rF = rank(rows, x => x.farm), rW = rank(rows, x => x.w);
  const me = rows.find(x => x.m.code === m.code)!;
  const title = `${m.name}の課税対象所得・製造品出荷額・耕地面積（${FIRST_ECON}〜${LATEST_ECON}年）`;
  const sentence = `${m.name}の納税義務者1人当たり課税対象所得は${LATEST_ECON}年に${fmt(per)}円で、岩手県内33市町村中${rI.get(me) ?? '—'}位（県平均${fmt(prefPer)}円）。製造品出荷額等は${fmt(r.mfg_shipment)}百万円（県内${rM.get(me) ?? '—'}位）、耕地面積は${fmt(r.farmland)}ha（県内${rF.get(me) ?? '—'}位）。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '所得・製造業・農地', href: '/economy/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/economy/${m.slug}/`}
        keywords={[m.name, '課税対象所得', '納税義務者', '製造品出荷額', '製造業', '耕地面積', '岩手県']} temporal={`${FIRST_ECON}/${LATEST_ECON}`} sourceKeys={['economy']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の納税義務者1人当たり課税対象所得は{LATEST_ECON}年に<strong>{fmt(per)}円</strong>（{FIRST_ECON}年比{fmtSigned(pct(per, per0), '%')}）で、岩手県内<strong>{rI.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}円）。
        製造品出荷額等は<strong>{fmt(r.mfg_shipment)}百万円</strong>で県内{rM.get(me) ?? '—'}位、耕地面積は{fmt(r.farmland)}haで県内{rF.get(me) ?? '—'}位。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">1人当たり課税対象所得（{LATEST_ECON}年）</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">円・県内 {rI.get(me) ?? '—'}位（県平均 {fmt(prefPer)}円）</div></div>
        <div className="stat"><div className="stat-label">課税対象所得の総額</div><div className="stat-value">{fmt(r.taxable_income)}</div><div className="stat-sub">千円・納税義務者 {fmt(r.taxpayers)}人</div></div>
        {pop && <div className="stat"><div className="stat-label">人口に対する納税義務者の割合</div><div className="stat-value">{Math.round((r.taxpayers ?? 0) / pop * 1000) / 10}</div><div className="stat-sub">%（住民基本台帳人口 {fmt(pop)}人）</div></div>}
        <div className="stat"><div className="stat-label">製造品出荷額等</div><div className="stat-value">{fmt(r.mfg_shipment)}</div><div className="stat-sub">百万円・県内 {rM.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">製造業（{LATEST_ECON}年）</div><div className="stat-value">{fmt(r.mfg_estab)}</div><div className="stat-sub">事業所・従業者 {fmt(r.mfg_workers)}人・県内 {rW.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">耕地面積</div><div className="stat-value">{fmt(r.farmland)}</div><div className="stat-sub">ha・県内 {rF.get(me) ?? '—'}位・{FIRST_ECON}年比 {fmtSigned(pct(r.farmland, r0.farmland), '%')}</div></div>
      </div>
      <LineChart title={`${m.name}の納税義務者1人当たり課税対象所得（${FIRST_ECON}〜${LATEST_ECON}年、円）`} unit="円"
        series={[
          { label: m.name, points: s.map(x => ({ x: x.year, y: incomePerTaxpayer(x) ?? 0 })) },
          { label: '岩手県33市町村平均', points: ECON_YEARS.map(y => ({ x: y, y: incomePerTaxpayer(econPrefAt(y)) ?? 0 })) },
        ]} />
      <LineChart title={`${m.name}の製造品出荷額等と耕地面積（${FIRST_ECON}〜${LATEST_ECON}年）`} zero
        series={[
          { label: '製造品出荷額等(百万円)', points: s.filter(x => x.mfg_shipment != null).map(x => ({ x: x.year, y: x.mfg_shipment as number })) },
          { label: '耕地面積(ha)', points: s.filter(x => x.farmland != null).map(x => ({ x: x.year, y: x.farmland as number })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>課税対象所得(千円)</th><th>納税義務者</th><th>1人当たり(円)</th><th>製造品出荷額等(百万円)</th><th>製造業事業所</th><th>製造業従業者</th><th>耕地面積(ha)</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.taxable_income)}</td><td>{fmt(x.taxpayers)}</td><td>{fmt(incomePerTaxpayer(x))}</td>
                <td>{fmt(x.mfg_shipment)}</td><td>{fmt(x.mfg_estab)}</td><td>{fmt(x.mfg_workers)}</td><td>{fmt(x.farmland)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/industry/manufacturing/${m.slug}/`}>{m.name}の製造業（経済センサス）</Link></li>
        <li><Link href={`/work/${m.slug}/`}>{m.name}の就業者</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/economy/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['economy']} extra={[
        '「課税対象所得」は市町村民税の所得割の課税対象となった前年の所得の合計（千円）で、住民の平均年収ではない。「1人当たり」は課税対象所得÷納税義務者数（所得割）で本サイトの計算値。所得のない人・課税されない人は分母に入らない。',
        `製造業の事業所数・従業者数は${MFG_GAP_YEAR}年が空欄（工業統計調査が経済センサス‐活動調査に統合された年で、市区町村別の収録がない）。製造業は従業者4人以上の事業所が対象。`,
        '耕地面積は有効3桁で丸められた値。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
