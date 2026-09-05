import type { Metadata } from 'next';
import Link from 'next/link';
import { INDUSTRIES, MUNIS, PREF, industryBySlug, econAt, popAt, fmt, fmtSigned, pct, rank } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return INDUSTRIES.filter(i => i.code !== 'AR').map(i => ({ ind: i.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ ind: string }> }): Promise<Metadata> {
  const { ind } = await params; const i = industryBySlug(ind)!; const e = econAt(PREF.code, i.code)!;
  const title = `岩手県の${i.name}：市町村別の事業所数・従業者数ランキング（2021年）`;
  return { title, description: `岩手県の${i.name}は${fmt(e['2021'].estab)}事業所・従業者${fmt(e['2021'].workers)}人（2021年経済センサス）。33市町村別の事業所数・従業者数・人口千人当たり・2016年からの増減を一覧。`, alternates: { canonical: `/industry/${i.slug}/` } };
}

export default async function Page({ params }: { params: Promise<{ ind: string }> }) {
  const { ind } = await params; const i = industryBySlug(ind)!;
  const pref = econAt(PREF.code, i.code)!; const prefAll = econAt(PREF.code, 'AR')!;
  const rows = MUNIS.map(m => { const e = econAt(m.code, i.code) || {}; const all = econAt(m.code, 'AR')!; const pop = popAt(m.code, 2021)!.total;
    return { m, e21: e['2021'], e16: e['2016'], perK: e['2021']?.estab != null ? Math.round(e['2021'].estab / pop * 1000 * 100) / 100 : null, share: e['2021']?.estab != null ? Math.round(e['2021'].estab / all['2021'].estab! * 1000) / 10 : null, chg: pct(e['2021']?.estab, e['2016']?.estab) }; });
  const rE = rank(rows, r => r.e21?.estab ?? null), rW = rank(rows, r => r.e21?.workers ?? null), rK = rank(rows, r => r.perK);
  const byE = [...rows].sort((a, b) => (b.e21?.estab ?? -1) - (a.e21?.estab ?? -1));
  const byK = [...rows].filter(r => r.perK != null).sort((a, b) => b.perK! - a.perK!);
  const title = `岩手県の${i.name}：市町村別の事業所数・従業者数ランキング（2021年）`;
  const top = byE[0];
  const prefPerK = Math.round(pref['2021'].estab! / popAt(PREF.code, 2021)!.total * 1000 * 100) / 100;
  const sentence = `岩手県の${i.name}の民営事業所は2021年6月1日時点で${fmt(pref['2021'].estab)}事業所（2016年比${fmtSigned(pct(pref['2021'].estab, pref['2016']?.estab), '%')}）、従業者${fmt(pref['2021'].workers)}人。事業所数が最も多いのは${top.m.name}の${fmt(top.e21?.estab)}事業所。`;
  return (
    <>
      <Breadcrumb items={[{ name: '産業・事業所', href: '/industry/' }, { name: i.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/industry/${i.slug}/`} keywords={['岩手県', i.name, '事業所数', '従業者数', '市町村別', '経済センサス']} temporal="2016/2021" sourceKeys={['econ2021', 'econ2016']} />
      <h1>{title}</h1>
      <p className="key-fact">岩手県の{i.name}は<strong>{fmt(pref['2021'].estab)}事業所</strong>、従業者<strong>{fmt(pref['2021'].workers)}人</strong>（2021年）。全産業に占める割合は事業所で{Math.round(pref['2021'].estab! / prefAll['2021'].estab! * 1000) / 10}%、従業者で{Math.round(pref['2021'].workers! / prefAll['2021'].workers! * 1000) / 10}%。2016年比で事業所{fmtSigned(pct(pref['2021'].estab, pref['2016']?.estab), '%')}、従業者{fmtSigned(pct(pref['2021'].workers, pref['2016']?.workers), '%')}。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">事業所数（県、2021年）</div><div className="stat-value">{fmt(pref['2021'].estab)}</div><div className="stat-sub">2016年 {fmt(pref['2016']?.estab)}</div></div>
        <div className="stat"><div className="stat-label">従業者数（県、2021年）</div><div className="stat-value">{fmt(pref['2021'].workers)}</div><div className="stat-sub">1事業所当たり {pref['2021'].estab ? (pref['2021'].workers! / pref['2021'].estab).toFixed(1) : '—'}人</div></div>
        <div className="stat"><div className="stat-label">売上（収入）金額（県）</div><div className="stat-value">{pref['2021'].sales_raw === '...' ? '非公表' : pref['2021'].sales_raw === 'X' ? '秘匿' : fmt(pref['2021'].sales)}</div><div className="stat-sub">百万円・外国の会社等を除く</div></div>
        <div className="stat"><div className="stat-label">人口千人当たり事業所（県）</div><div className="stat-value">{fmt(prefPerK)}</div><div className="stat-sub">人口は2021年1月1日住基</div></div>
      </div>
      <BarChart title={`${i.name}の事業所数（2021年）`} items={byE.map(r => ({ label: r.m.name, value: r.e21?.estab ?? null }))} />
      <BarChart title={`${i.name}の人口千人当たり事業所数（2021年）`} items={byK.map(r => ({ label: r.m.name, value: r.perK }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>事業所 2021</th><th>順位</th><th>2016</th><th>増減率</th><th>従業者 2021</th><th>順位</th><th>2016</th><th>売上 2021（百万円）</th><th>人口千人当たり</th><th>順位</th><th>全産業に占める割合</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県</td><td>{fmt(pref['2021'].estab)}</td><td>—</td><td>{fmt(pref['2016']?.estab)}</td><td>{fmtSigned(pct(pref['2021'].estab, pref['2016']?.estab), '%')}</td><td>{fmt(pref['2021'].workers)}</td><td>—</td><td>{fmt(pref['2016']?.workers)}</td><td>{pref['2021'].sales_raw === '...' ? '非公表' : pref['2021'].sales_raw === 'X' ? '秘匿' : fmt(pref['2021'].sales)}</td><td>{fmt(prefPerK)}</td><td>—</td><td>{Math.round(pref['2021'].estab! / prefAll['2021'].estab! * 1000) / 10}%</td></tr>
            {byE.map(r => <tr key={r.m.code}><td>{r.e21?.estab != null ? <Link href={`/industry/${i.slug}/${r.m.slug}/`}>{r.m.name}</Link> : <Link href={`/city/${r.m.slug}/`}>{r.m.name}</Link>}</td><td>{fmt(r.e21?.estab)}</td><td>{rE.get(r) ?? '—'}位</td><td>{fmt(r.e16?.estab)}</td><td className={r.chg != null && r.chg < 0 ? 'neg' : r.chg != null ? 'pos' : ''}>{fmtSigned(r.chg, '%')}</td><td>{fmt(r.e21?.workers)}</td><td>{rW.get(r) ?? '—'}位</td><td>{fmt(r.e16?.workers)}</td><td>{r.e21?.sales_raw === '...' ? '非公表' : r.e21?.sales_raw === 'X' ? '秘匿' : r.e21?.sales_raw === '-' ? '—' : fmt(r.e21?.sales)}</td><td>{fmt(r.perK)}</td><td>{rK.get(r) ?? '—'}位</td><td>{r.share == null ? '—' : r.share + '%'}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p>他の産業：{INDUSTRIES.filter(x => x.code !== 'AR' && x.code !== i.code).map((x, k) => <span key={x.code}>{k ? '・' : ''}<Link href={`/industry/${x.slug}/`}>{x.name}</Link></span>)}</p>
      <CiteBox title={title} path={`/industry/${i.slug}/`} sentence={sentence} />
      <SourceBox keys={['econ2021', 'econ2016']} extra={['人口千人当たりは2021年1月1日の住民基本台帳人口で算出。', '「秘匿」は事業所数が少なく個別の値が特定されるため公表されていない項目、「非公表」は当該表で集計されていない項目。']} />
    </>
  );
}
