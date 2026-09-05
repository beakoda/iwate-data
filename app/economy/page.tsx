import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, econAt2, econPrefAt, incomePerTaxpayer, popAt, fmt, fmtSigned, pct, rank, ECON_YEARS, LATEST_ECON, FIRST_ECON, MFG_GAP_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の課税対象所得・製造品出荷額・耕地面積（${FIRST_ECON}〜${LATEST_ECON}年）`;
const pNow = econPrefAt(LATEST_ECON);
const pFirst = econPrefAt(FIRST_ECON);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の課税対象所得は${LATEST_ECON}年に${fmt(Math.round(pNow.taxable_income! / 100000))}億円、納税義務者1人当たり${fmt(incomePerTaxpayer(pNow))}円。製造品出荷額等は${fmt(Math.round(pNow.mfg_shipment! / 100))}億円。33市町村別に一覧。`,
  alternates: { canonical: '/economy/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = econAt2(m.code, LATEST_ECON)!, r0 = econAt2(m.code, FIRST_ECON)!;
    const pop = popAt(m.code, LATEST_ECON)?.total ?? null;
    return { m, r, r0, per: incomePerTaxpayer(r), per0: incomePerTaxpayer(r0),
      mfgPerCap: pop && r.mfg_shipment != null ? Math.round((r.mfg_shipment * 1000000) / pop) : null };
  });
  const rI = rank(rows, r => r.per), rM = rank(rows, r => r.r.mfg_shipment), rF = rank(rows, r => r.r.farmland);
  const byI = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const byM = [...rows].sort((a, b) => (b.r.mfg_shipment ?? 0) - (a.r.mfg_shipment ?? 0));
  const byF = [...rows].sort((a, b) => (b.r.farmland ?? 0) - (a.r.farmland ?? 0));
  const prefPer = incomePerTaxpayer(pNow);
  const sentence = `岩手県33市町村の課税対象所得は${LATEST_ECON}年に合計${fmt(Math.round(pNow.taxable_income! / 100000))}億円で、納税義務者1人当たり${fmt(prefPer)}円（${FIRST_ECON}年比${fmtSigned(pct(prefPer, incomePerTaxpayer(pFirst)), '%')}）。1人当たりが最も高いのは${byI[0].m.name}（${fmt(byI[0].per)}円）、製造品出荷額等が最も多いのは${byM[0].m.name}（${fmt(Math.round(byM[0].r.mfg_shipment! / 100))}億円）。`;
  return (
    <>
      <Breadcrumb items={[{ name: '所得・製造業・農地' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/economy/" keywords={['岩手県', '課税対象所得', '納税義務者', '製造品出荷額', '製造業', '耕地面積', '市町村別']} temporal={`${FIRST_ECON}/${LATEST_ECON}`} sourceKeys={['economy']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県33市町村の課税対象所得は{LATEST_ECON}年に合計<strong>{fmt(Math.round(pNow.taxable_income! / 100000))}億円</strong>、納税義務者1人当たり<strong>{fmt(prefPer)}円</strong>（{FIRST_ECON}年比{fmtSigned(pct(prefPer, incomePerTaxpayer(pFirst)), '%')}）。製造品出荷額等は<strong>{fmt(Math.round(pNow.mfg_shipment! / 100))}億円</strong>、耕地面積は{fmt(pNow.farmland)}ha。1人当たり所得が最も高いのは<strong>{byI[0].m.name}（{fmt(byI[0].per)}円）</strong>、最も低いのは<strong>{byI[byI.length - 1].m.name}（{fmt(byI[byI.length - 1].per)}円）</strong>。</p>
      <LineChart title={`岩手県33市町村の納税義務者1人当たり課税対象所得（${FIRST_ECON}〜${LATEST_ECON}年、円）`} unit="円"
        series={[{ label: '1人当たり課税対象所得', points: ECON_YEARS.map(y => ({ x: y, y: incomePerTaxpayer(econPrefAt(y)) ?? 0 })) }]} />
      <LineChart title={`岩手県33市町村の製造品出荷額等（${FIRST_ECON}〜${LATEST_ECON}年、百万円）`} unit="百万円" zero
        series={[{ label: '製造品出荷額等', points: ECON_YEARS.map(y => ({ x: y, y: econPrefAt(y).mfg_shipment ?? 0 })) }]} />
      <BarChart title={`納税義務者1人当たり課税対象所得（${LATEST_ECON}年、円）`} items={byI.map(r => ({ label: r.m.name, value: r.per }))} unit="円" />
      <BarChart title={`製造品出荷額等（${LATEST_ECON}年、百万円）`} items={byM.map(r => ({ label: r.m.name, value: r.r.mfg_shipment }))} unit="百万円" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>1人当たり課税対象所得 {LATEST_ECON}年</th><th>順位</th><th>{FIRST_ECON}年比</th><th>課税対象所得(千円)</th><th>納税義務者</th><th>製造品出荷額等(百万円)</th><th>順位</th><th>製造業事業所</th><th>従業者</th><th>耕地面積(ha)</th><th>順位</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(prefPer)}</td><td>—</td><td>{fmtSigned(pct(prefPer, incomePerTaxpayer(pFirst)), '%')}</td><td>{fmt(pNow.taxable_income)}</td><td>{fmt(pNow.taxpayers)}</td><td>{fmt(pNow.mfg_shipment)}</td><td>—</td><td>{fmt(pNow.mfg_estab)}</td><td>{fmt(pNow.mfg_workers)}</td><td>{fmt(pNow.farmland)}</td><td>—</td></tr>
            {byI.map(r => (
              <tr key={r.m.code}><td><Link href={`/economy/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.per)}</td><td>{rI.get(r) ?? '—'}位</td>
                <td className={pct(r.per, r.per0)! < 0 ? 'neg' : 'pos'}>{fmtSigned(pct(r.per, r.per0), '%')}</td>
                <td>{fmt(r.r.taxable_income)}</td><td>{fmt(r.r.taxpayers)}</td>
                <td>{fmt(r.r.mfg_shipment)}</td><td>{rM.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.mfg_estab)}</td><td>{fmt(r.r.mfg_workers)}</td>
                <td>{fmt(r.r.farmland)}</td><td>{rF.get(r) ?? '—'}位</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = econAt2(m.code, LATEST_ECON)!; return <li key={m.code}><Link href={`/economy/${m.slug}/`}>{m.name}の所得・製造業<small>{LATEST_ECON}年 1人当たり{fmt(incomePerTaxpayer(r))}円</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/economy/" sentence={sentence} />
      <SourceBox keys={['economy']} extra={[
        '「課税対象所得」は市町村民税の所得割の課税対象となった前年の所得の合計（千円）。住民の平均年収ではない。「1人当たり」は課税対象所得÷納税義務者数（所得割）で、本サイトの計算値。',
        '課税対象所得・納税義務者数・製造業事業所数・従業者数は、33市町村の合計が総務省統計局の公表する岩手県の値と完全に一致することを確認している。',
        '製造品出荷額等は百万円単位、耕地面積は有効3桁で丸められているため、33市町村の合計は県公表値とわずかにずれる（製造品出荷額等は±5百万円以内、耕地面積は±0.2%以内であることを確認している）。',
        `製造業の事業所数・従業者数は${MFG_GAP_YEAR}年が空欄。この年は工業統計調査が経済センサス‐活動調査に統合され、市区町村別の事業所数・従業者数が収録されていない。`,
        '製造業は従業者4人以上の事業所が対象。',
      ]} />
    </>
  );
}
