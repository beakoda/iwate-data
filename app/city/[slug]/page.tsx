import type { Metadata } from 'next';
import Link from 'next/link';
import { INDUSTRIES, MUNIS, PREF, muniBySlug, econAt, popAt, dentalAt, per100k, fmt, fmtSigned, pct, rank, LATEST_DENTAL, LATEST_POP, censusAt, agingRate, LATEST_CENSUS } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const title = `${m.name}の統計データまとめ｜人口・事業所・産業・歯科診療所`;
  return { title, description: `${m.name}（岩手県）の人口${fmt(popAt(m.code, LATEST_POP)!.total)}人、民営事業所${fmt(econAt(m.code, 'AR')!['2021'].estab)}、歯科診療所${fmt(dentalAt(m.code, LATEST_DENTAL)!.dent)}施設。産業大分類別の事業所数・従業者数・売上、人口動態、医療施設を政府統計から一覧。`, alternates: { canonical: `/city/${m.slug}/` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const p = popAt(m.code, LATEST_POP)!, p0 = popAt(m.code, 2013)!;
  const d = dentalAt(m.code, LATEST_DENTAL)!;
  const all = econAt(m.code, 'AR')!;
  const cen = censusAt(m.code, LATEST_CENSUS)!;
  const inds = INDUSTRIES.filter(i => i.code !== 'AR').map(i => { const e = econAt(m.code, i.code) || {}; const pe = econAt(PREF.code, i.code)!; return { i, e21: e['2021'], e16: e['2016'], share: e['2021']?.estab != null ? e['2021'].estab / all['2021'].estab! : null, prefShare: pe['2021'].estab! / econAt(PREF.code, 'AR')!['2021'].estab! }; });
  const byE = [...inds].sort((a, b) => (b.e21?.estab ?? -1) - (a.e21?.estab ?? -1));
  const popRank = rank(MUNIS.map(mm => mm), mm => popAt(mm.code, LATEST_POP)!.total).get(m)!;
  const estRank = rank(MUNIS.map(mm => mm), mm => econAt(mm.code, 'AR')!['2021'].estab).get(m)!;
  const title = `${m.name}の統計データまとめ`;
  const specialties = inds.filter(x => x.share != null && x.prefShare > 0).map(x => ({ ...x, lq: x.share! / x.prefShare })).filter(x => (x.e21?.estab ?? 0) >= 5).sort((a, b) => b.lq - a.lq).slice(0, 3);
  const sentence = `${m.name}の人口は${fmt(p.total)}人（${LATEST_POP}年1月1日、県内${popRank}位）、民営事業所は${fmt(all['2021'].estab)}事業所・従業者${fmt(all['2021'].workers)}人（2021年、県内${estRank}位）、歯科診療所は${fmt(d.dent)}施設（${LATEST_DENTAL}年）。`;
  return (
    <>
      <Breadcrumb items={[{ name: '市町村別', href: '/city/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/city/${m.slug}/`} keywords={[m.name, '統計', '人口', '事業所数', '産業', '歯科診療所', '岩手県']} temporal={`2009/${LATEST_POP}`} sourceKeys={['population', 'econ2021', 'econ2016', 'dental', 'census']} />
      <h1>{title}</h1>
      <p className="lead">{m.gun ? `${m.gun}` : '岩手県'}{m.name}の公的統計を1ページに。各項目の詳細ページに推移グラフと年次表があります。</p>
      <p className="key-fact">{sentence}</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">人口（{LATEST_POP}年）</div><div className="stat-value">{fmt(p.total)}</div><div className="stat-sub">2013年比 {fmtSigned(pct(p.total, p0.total), '%')}・<Link href={`/population/${m.slug}/`}>推移</Link></div></div>
        <div className="stat"><div className="stat-label">世帯数</div><div className="stat-value">{fmt(p.households)}</div><div className="stat-sub">1世帯 {(p.total / p.households).toFixed(2)}人</div></div>
        <div className="stat"><div className="stat-label">民営事業所（2021年）</div><div className="stat-value">{fmt(all['2021'].estab)}</div><div className="stat-sub">2016年比 {fmtSigned(pct(all['2021'].estab, all['2016']?.estab), '%')}</div></div>
        <div className="stat"><div className="stat-label">従業者数（2021年）</div><div className="stat-value">{fmt(all['2021'].workers)}</div><div className="stat-sub">人口千人当たり {Math.round(all['2021'].workers! / popAt(m.code, 2021)!.total * 1000)}人</div></div>
        <div className="stat"><div className="stat-label">歯科診療所（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(d.dent)}</div><div className="stat-sub">人口10万対 {fmt(per100k(d.dent, m.code, LATEST_DENTAL))}・<Link href={`/dental/${m.slug}/`}>推移</Link></div></div>
        <div className="stat"><div className="stat-label">一般診療所（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(d.gen)}</div><div className="stat-sub">うち有床 {fmt(d.gen_with_beds)}</div></div>
        <div className="stat"><div className="stat-label">高齢化率（{LATEST_CENSUS}年）</div><div className="stat-value">{fmt(agingRate(cen))}%</div><div className="stat-sub">平均年齢 {fmt(cen.avg_age != null ? Math.round(cen.avg_age * 10) / 10 : null)}歳・<Link href={`/aging/${m.slug}/`}>詳細</Link></div></div>
        <div className="stat"><div className="stat-label">就業者数（{LATEST_CENSUS}年）</div><div className="stat-value">{fmt(cen.workers)}</div><div className="stat-sub">昼夜間人口比率 {fmt(cen.dn_ratio != null ? Math.round(cen.dn_ratio * 10) / 10 : null)}・<Link href={`/work/${m.slug}/`}>詳細</Link></div></div>
      </div>
      {specialties.length > 0 && <p>県全体の産業構成と比べて事業所の比率が高い産業（特化係数上位）：{specialties.map((x, k) => <span key={x.i.code}>{k ? '、' : ''}<Link href={`/industry/${x.i.slug}/`}>{x.i.name}</Link>（{x.lq.toFixed(2)}倍）</span>)}。</p>}
      <h2>産業大分類別の事業所数・従業者数（2021年経済センサス）</h2>
      <BarChart title={`${m.name}の産業別事業所数（2021年）`} items={byE.map(r => ({ label: r.i.code + ' ' + r.i.name.slice(0, 8), value: r.e21?.estab ?? null }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>産業大分類</th><th>事業所 2021</th><th>2016</th><th>増減率</th><th>構成比</th><th>県の構成比</th><th>従業者 2021</th><th>2016</th><th>売上 2021（百万円）</th></tr></thead>
          <tbody>
            <tr className="hl"><td>全産業（公務を除く）</td><td>{fmt(all['2021'].estab)}</td><td>{fmt(all['2016']?.estab)}</td><td>{fmtSigned(pct(all['2021'].estab, all['2016']?.estab), '%')}</td><td>100%</td><td>100%</td><td>{fmt(all['2021'].workers)}</td><td>{fmt(all['2016']?.workers)}</td><td>非公表</td></tr>
            {byE.map(r => { const c = pct(r.e21?.estab, r.e16?.estab); return <tr key={r.i.code}><td>{r.e21?.estab != null ? <Link href={`/industry/${r.i.slug}/${m.slug}/`}>{r.i.code} {r.i.name}</Link> : <Link href={`/industry/${r.i.slug}/`}>{r.i.code} {r.i.name}</Link>}</td><td>{fmt(r.e21?.estab)}</td><td>{fmt(r.e16?.estab)}</td><td className={c != null && c < 0 ? 'neg' : c != null ? 'pos' : ''}>{fmtSigned(c, '%')}</td><td>{r.share == null ? '—' : (r.share * 100).toFixed(1) + '%'}</td><td>{(r.prefShare * 100).toFixed(1)}%</td><td>{fmt(r.e21?.workers)}</td><td>{fmt(r.e16?.workers)}</td><td>{r.e21?.sales_raw === '...' ? '非公表' : r.e21?.sales_raw === 'X' ? '秘匿' : r.e21?.sales_raw === '-' ? '—' : fmt(r.e21?.sales)}</td></tr>; })}
          </tbody>
        </table>
      </div>
      <h2>詳細ページ</h2>
      <ul className="grid-links">
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯数の推移<small>出生・死亡・転入・転出 2013〜{LATEST_POP}年</small></Link></li>
        <li><Link href={`/dental/${m.slug}/`}>{m.name}の歯科診療所数の推移<small>一般診療所・人口10万対 2009〜{LATEST_DENTAL}年</small></Link></li>
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率・年齢構成<small>年齢3区分・平均年齢・人口密度（国勢調査）</small></Link></li>
        <li><Link href={`/work/${m.slug}/`}>{m.name}の就業者・昼夜間人口<small>産業別就業者・労働力率・昼夜間人口比率（国勢調査）</small></Link></li>
        <li><Link href={`/building/${m.slug}/`}>{m.name}の住宅着工・建築着工<small>居住専用住宅の着工棟数・床面積 2011〜2024年</small></Link></li>
      </ul>
      <p>他の市町村：{MUNIS.filter(x => x.code !== m.code).map((x, k) => <span key={x.code}>{k ? '・' : ''}<Link href={`/city/${x.slug}/`}>{x.name}</Link></span>)}</p>
      <CiteBox title={title} path={`/city/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['population', 'econ2021', 'econ2016', 'dental', 'census']} extra={['特化係数＝当該市町村の産業別事業所構成比 ÷ 岩手県の産業別事業所構成比（事業所5以上の産業のみ表示）。']} />
    </>
  );
}
