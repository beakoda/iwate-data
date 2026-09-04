import type { Metadata } from 'next';
import Link from 'next/link';
import { INDUSTRIES, PREF, econAt, fmt, fmtSigned, pct } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = '岩手県の産業別 事業所数・従業者数・売上（2021年経済センサス）';
export const metadata: Metadata = { title: TITLE, description: `岩手県の民営事業所は${fmt(econAt(PREF.code, 'AR')!['2021'].estab)}事業所、従業者${fmt(econAt(PREF.code, 'AR')!['2021'].workers)}人（2021年）。産業大分類別の事業所数・従業者数・売上金額と2016年からの増減、市町村別ランキングへの入口。`, alternates: { canonical: '/industry/' } };

export default function Page() {
  const inds = INDUSTRIES.filter(i => i.code !== 'AR');
  const all = econAt(PREF.code, 'AR')!;
  const rows = inds.map(i => { const e = econAt(PREF.code, i.code)!; return { i, e21: e['2021'], e16: e['2016'], chg: pct(e['2021'].estab, e['2016']?.estab) }; });
  const byEstab = [...rows].sort((a, b) => (b.e21.estab ?? 0) - (a.e21.estab ?? 0));
  const byWorkers = [...rows].sort((a, b) => (b.e21.workers ?? 0) - (a.e21.workers ?? 0));
  const top = byEstab[0];
  return (
    <>
      <Breadcrumb items={[{ name: '産業・事業所' }]} />
      <DatasetJsonLd name={TITLE} description={metadata.description as string} path="/industry/" keywords={['岩手県', '事業所数', '従業者数', '産業別', '経済センサス', '売上']} temporal="2016/2021" sourceKeys={['econ2021', 'econ2016']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の民営事業所は<strong>{fmt(all['2021'].estab)}事業所</strong>、従業者<strong>{fmt(all['2021'].workers)}人</strong>（2021年6月1日）。2016年比で事業所は{fmtSigned(pct(all['2021'].estab, all['2016']!.estab), '%')}、従業者は{fmtSigned(pct(all['2021'].workers, all['2016']!.workers), '%')}。事業所数が最も多い産業は{top.i.name}（{fmt(top.e21.estab)}事業所、全体の{Math.round(top.e21.estab! / all['2021'].estab! * 100)}%）。</p>
      <BarChart title="産業大分類別 事業所数（2021年）" items={byEstab.map(r => ({ label: r.i.code + ' ' + r.i.name.slice(0, 8), value: r.e21.estab }))} unit="" />
      <BarChart title="産業大分類別 従業者数（2021年、人）" items={byWorkers.map(r => ({ label: r.i.code + ' ' + r.i.name.slice(0, 8), value: r.e21.workers }))} unit="" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>産業大分類</th><th>事業所数 2021</th><th>2016</th><th>増減率</th><th>従業者数 2021</th><th>2016</th><th>増減率</th><th>売上（収入）金額 2021（百万円）</th><th>1事業所当たり従業者</th></tr></thead>
          <tbody>
            <tr className="hl"><td>全産業（公務を除く）</td><td>{fmt(all['2021'].estab)}</td><td>{fmt(all['2016']!.estab)}</td><td>{fmtSigned(pct(all['2021'].estab, all['2016']!.estab), '%')}</td><td>{fmt(all['2021'].workers)}</td><td>{fmt(all['2016']!.workers)}</td><td>{fmtSigned(pct(all['2021'].workers, all['2016']!.workers), '%')}</td><td>{all['2021'].sales_raw === '...' ? '非公表' : fmt(all['2021'].sales)}</td><td>{(all['2021'].workers! / all['2021'].estab!).toFixed(1)}</td></tr>
            {byEstab.map(r => <tr key={r.i.code}><td><Link href={`/industry/${r.i.slug}/`}>{r.i.code} {r.i.name}</Link></td><td>{fmt(r.e21.estab)}</td><td>{fmt(r.e16?.estab)}</td><td className={r.chg != null && r.chg < 0 ? 'neg' : 'pos'}>{fmtSigned(r.chg, '%')}</td><td>{fmt(r.e21.workers)}</td><td>{fmt(r.e16?.workers)}</td><td className={pct(r.e21.workers, r.e16?.workers)! < 0 ? 'neg' : 'pos'}>{fmtSigned(pct(r.e21.workers, r.e16?.workers), '%')}</td><td>{r.e21.sales_raw === '...' ? '非公表' : r.e21.sales_raw === 'X' ? '秘匿' : fmt(r.e21.sales)}</td><td>{r.e21.estab ? (r.e21.workers! / r.e21.estab).toFixed(1) : '—'}</td></tr>)}
          </tbody>
        </table>
      </div>
      <h2>業種別の市町村ランキング</h2>
      <ul className="grid-links">{inds.map(i => <li key={i.code}><Link href={`/industry/${i.slug}/`}>{i.code} {i.name}<small>{fmt(econAt(PREF.code, i.code)!['2021'].estab)}事業所・{fmt(econAt(PREF.code, i.code)!['2021'].workers)}人</small></Link></li>)}</ul>
      <CiteBox title={TITLE} path="/industry/" sentence={`岩手県の民営事業所数は2021年6月1日時点で${fmt(all['2021'].estab)}事業所（2016年比${fmtSigned(pct(all['2021'].estab, all['2016']!.estab), '%')}）、従業者数は${fmt(all['2021'].workers)}人（総務省・経済産業省「経済センサス‐活動調査」）。`} />
      <SourceBox keys={['econ2021', 'econ2016']} extra={['2016年と2021年で産業分類の一部（G1/G2等の細区分）は表記が異なるが、大分類の比較には影響しない。', '売上（収入）金額は「必要な事項の数値が得られた事業所」の集計で、事業所数・従業者数とは集計対象が異なる場合がある。']} />
    </>
  );
}
