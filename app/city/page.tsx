import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, popAt, econAt, dentalAt, fmt, LATEST_POP, LATEST_DENTAL } from '@/lib/data';
import { Breadcrumb } from '@/components/Shell';

export const metadata: Metadata = { title: '岩手県33市町村の統計データ一覧', description: '岩手県の14市15町4村それぞれの人口・事業所数・歯科診療所数と、産業別・人口動態の詳細ページへの入口。', alternates: { canonical: '/city/' } };

export default function Page() {
  const groups = [['市', MUNIS.filter(m => m.kind === '市')], ['町', MUNIS.filter(m => m.kind === '町')], ['村', MUNIS.filter(m => m.kind === '村')]] as const;
  return (
    <>
      <Breadcrumb items={[{ name: '市町村別' }]} />
      <h1>岩手県33市町村の統計データ</h1>
      <p className="lead">14市・15町・4村。各ページに人口、産業別の事業所数・従業者数・売上、歯科診療所数をまとめています。</p>
      {groups.map(([k, list]) => (
        <section key={k}>
          <h2>{k}（{list.length}）</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>市町村</th><th>人口（{LATEST_POP}年）</th><th>世帯数</th><th>民営事業所（2021年）</th><th>従業者数</th><th>歯科診療所（{LATEST_DENTAL}年）</th></tr></thead>
            <tbody>{list.map(m => { const p = popAt(m.code, LATEST_POP)!, e = econAt(m.code, 'AR')!['2021'], d = dentalAt(m.code, LATEST_DENTAL)!; return <tr key={m.code}><td><Link href={`/city/${m.slug}/`}>{m.gun ? m.gun + ' ' : ''}{m.name}</Link></td><td>{fmt(p.total)}</td><td>{fmt(p.households)}</td><td>{fmt(e.estab)}</td><td>{fmt(e.workers)}</td><td>{fmt(d.dent)}</td></tr>; })}</tbody>
          </table></div>
        </section>
      ))}
    </>
  );
}
