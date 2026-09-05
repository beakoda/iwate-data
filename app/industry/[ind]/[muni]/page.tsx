import type { Metadata } from 'next';
import Link from 'next/link';
import { INDUSTRIES, MUNIS, PREF, industryBySlug, muniBySlug, econAt, popAt, fmt, fmtSigned, pct, rank } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

/** 2021年の事業所数が公表されている「産業×市町村」の組み合わせだけページ化する（空ページを作らない）。 */
function pairs() {
  const out: { ind: string; muni: string }[] = [];
  for (const i of INDUSTRIES) {
    if (i.code === 'AR') continue;
    for (const m of MUNIS) {
      const e = econAt(m.code, i.code)?.['2021'];
      if (e && e.estab != null) out.push({ ind: i.slug, muni: m.slug });
    }
  }
  return out;
}
export function generateStaticParams() { return pairs(); }

function load(indSlug: string, muniSlug: string) {
  const i = industryBySlug(indSlug)!, m = muniBySlug(muniSlug)!;
  const e21 = econAt(m.code, i.code)!['2021'], e16 = econAt(m.code, i.code)?.['2016'];
  const all21 = econAt(m.code, 'AR')!['2021'], all16 = econAt(m.code, 'AR')?.['2016'];
  const p21 = econAt(PREF.code, i.code)!['2021'], pAll21 = econAt(PREF.code, 'AR')!['2021'];
  const pop = popAt(m.code, 2021)!.total;
  const share = e21.estab != null && all21.estab ? e21.estab / all21.estab : null;
  const prefShare = p21.estab! / pAll21.estab!;
  const lq = share != null ? Math.round((share / prefShare) * 100) / 100 : null;
  const perK = e21.estab != null ? Math.round((e21.estab / pop) * 1000 * 100) / 100 : null;
  return { i, m, e21, e16, all21, all16, p21, pAll21, pop, share, prefShare, lq, perK };
}

export async function generateMetadata({ params }: { params: Promise<{ ind: string; muni: string }> }): Promise<Metadata> {
  const { ind, muni } = await params; const d = load(ind, muni);
  return {
    title: `${d.m.name}の${d.i.name}｜事業所数・従業者数（2021年経済センサス）`,
    description: `${d.m.name}（岩手県）の${d.i.name}は${fmt(d.e21.estab)}事業所・従業者${fmt(d.e21.workers)}人（2021年6月1日）。2016年比、岩手県内33市町村の順位、人口千人当たり、特化係数を政府統計から集計。`,
    alternates: { canonical: `/industry/${d.i.slug}/${d.m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ ind: string; muni: string }> }) {
  const { ind, muni } = await params; const d = load(ind, muni);
  const { i, m, e21, e16, all21, all16, p21 } = d;

  const rows = MUNIS.map(mm => {
    const e = econAt(mm.code, i.code)?.['2021'];
    return { m: mm, estab: e?.estab ?? null, workers: e?.workers ?? null };
  });
  const rowsK = MUNIS.map(mm => {
    const e = econAt(mm.code, i.code)?.['2021'];
    const pp = popAt(mm.code, 2021)!.total;
    return { m: mm, perK: e?.estab != null ? Math.round((e.estab / pp) * 1000 * 100) / 100 : null };
  });
  const rE = rank(rows, r => r.estab), rW = rank(rows, r => r.workers), rK = rank(rowsK, r => r.perK);
  const meK = rowsK.find(r => r.m.code === m.code)!;
  const me = rows.find(r => r.m.code === m.code)!;
  const nInd = rows.filter(r => r.estab != null).length;

  // 同一市町村内での他産業（構成比の比較用）
  const mine = INDUSTRIES.filter(x => x.code !== 'AR').map(x => {
    const e = econAt(m.code, x.code)?.['2021'];
    return { x, estab: e?.estab ?? null, workers: e?.workers ?? null };
  }).sort((a, b) => (b.estab ?? -1) - (a.estab ?? -1));
  const myRankInMuni = mine.filter(r => r.estab != null).findIndex(r => r.x.code === i.code) + 1;

  const title = `${m.name}の${i.name}：事業所数・従業者数（2021年）`;
  const chg = pct(e21.estab, e16?.estab);
  const salesTxt = e21.sales_raw === '...' ? '非公表' : e21.sales_raw === 'X' ? '秘匿' : e21.sales_raw === '-' ? '該当なし' : fmt(e21.sales) + '百万円';
  const sentence = `${m.name}の${i.name}の民営事業所は2021年6月1日時点で${fmt(e21.estab)}事業所、従業者${fmt(e21.workers)}人。岩手県内で事業所数${rE.get(me) ?? '—'}位（公表${nInd}市町村中）、${m.name}の全産業${fmt(all21.estab)}事業所の${d.share == null ? '—' : (d.share * 100).toFixed(1) + '%'}を占める。`;

  return (
    <>
      <Breadcrumb items={[{ name: '産業・事業所', href: '/industry/' }, { name: i.name, href: `/industry/${i.slug}/` }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/industry/${i.slug}/${m.slug}/`}
        keywords={[m.name, i.name, '事業所数', '従業者数', '経済センサス', '岩手県']} temporal="2016/2021" sourceKeys={['econ2021', 'econ2016']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の{i.name}は<strong>{fmt(e21.estab)}事業所</strong>・従業者<strong>{fmt(e21.workers)}人</strong>（2021年6月1日）。
        岩手県内<strong>{rE.get(me) ?? '—'}位</strong>（公表{nInd}市町村中）、{m.name}の全産業に占める割合は{d.share == null ? '—' : (d.share * 100).toFixed(1) + '%'}
        （県全体では{(d.prefShare * 100).toFixed(1)}%）。{d.lq != null && <>特化係数<strong>{d.lq.toFixed(2)}</strong>。</>}
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">事業所数（2021年）</div><div className="stat-value">{fmt(e21.estab)}</div><div className="stat-sub">2016年 {fmt(e16?.estab)}／{fmtSigned(chg, '%')}</div></div>
        <div className="stat"><div className="stat-label">従業者数（2021年）</div><div className="stat-value">{fmt(e21.workers)}</div><div className="stat-sub">1事業所当たり {e21.estab && e21.workers != null ? (e21.workers / e21.estab).toFixed(1) + '人' : '—'}</div></div>
        <div className="stat"><div className="stat-label">人口千人当たり事業所</div><div className="stat-value">{fmt(d.perK)}</div><div className="stat-sub">県内{rK.get(meK) ?? '—'}位・人口は2021年1月1日住基</div></div>
        <div className="stat"><div className="stat-label">特化係数</div><div className="stat-value">{d.lq == null ? '—' : d.lq.toFixed(2)}</div><div className="stat-sub">1.00＝県平均と同じ構成比</div></div>
        <div className="stat"><div className="stat-label">売上（収入）金額</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>{salesTxt}</div><div className="stat-sub">外国の会社・法人でない団体を除く</div></div>
        <div className="stat"><div className="stat-label">町内の産業順位</div><div className="stat-value">{myRankInMuni || '—'}位</div><div className="stat-sub">{m.name}の産業大分類17区分中（事業所数）</div></div>
      </div>

      <h2>2016年との比較</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>項目</th><th>2016年</th><th>2021年</th><th>増減</th><th>増減率</th></tr></thead>
          <tbody>
            <tr><td>事業所数</td><td>{fmt(e16?.estab)}</td><td>{fmt(e21.estab)}</td><td>{e16?.estab != null && e21.estab != null ? fmtSigned(e21.estab - e16.estab) : '—'}</td><td className={chg != null && chg < 0 ? 'neg' : chg != null ? 'pos' : ''}>{fmtSigned(chg, '%')}</td></tr>
            <tr><td>従業者数</td><td>{fmt(e16?.workers)}</td><td>{fmt(e21.workers)}</td><td>{e16?.workers != null && e21.workers != null ? fmtSigned(e21.workers - e16.workers) : '—'}</td><td>{fmtSigned(pct(e21.workers, e16?.workers), '%')}</td></tr>
            <tr><td>（参考）{m.name}の全産業 事業所数</td><td>{fmt(all16?.estab)}</td><td>{fmt(all21.estab)}</td><td>{all16?.estab != null && all21.estab != null ? fmtSigned(all21.estab - all16.estab) : '—'}</td><td>{fmtSigned(pct(all21.estab, all16?.estab), '%')}</td></tr>
          </tbody>
        </table>
      </div>

      <h2>県内での位置（{i.name}の市町村別事業所数）</h2>
      <BarChart title={`岩手県の${i.name}：市町村別事業所数（2021年）`} items={[...rows].sort((a, b) => (b.estab ?? -1) - (a.estab ?? -1)).map(r => ({ label: r.m.name, value: r.estab }))} highlight={m.name} />
      <p>従業者数では県内{rW.get(me) ?? '—'}位。岩手県全体の{i.name}は{fmt(p21.estab)}事業所・従業者{fmt(p21.workers)}人で、<Link href={`/industry/${i.slug}/`}>全市町村の一覧はこちら</Link>。</p>

      <h2>{m.name}の産業別の内訳（2021年）</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>産業大分類</th><th>事業所</th><th>従業者</th><th>構成比</th></tr></thead>
          <tbody>
            {mine.map(r => (
              <tr key={r.x.code} className={r.x.code === i.code ? 'hl' : ''}>
                <td>{r.estab != null ? <Link href={`/industry/${r.x.slug}/${m.slug}/`}>{r.x.name}</Link> : r.x.name}</td>
                <td>{fmt(r.estab)}</td><td>{fmt(r.workers)}</td>
                <td>{r.estab != null && all21.estab ? (r.estab / all21.estab * 100).toFixed(1) + '%' : '—'}</td>
              </tr>
            ))}
            <tr className="hl"><td>全産業（公務を除く）</td><td>{fmt(all21.estab)}</td><td>{fmt(all21.workers)}</td><td>100%</td></tr>
          </tbody>
        </table>
      </div>

      <p>他の市町村の{i.name}：{rows.filter(r => r.estab != null && r.m.code !== m.code).map((r, k) => <span key={r.m.code}>{k ? '・' : ''}<Link href={`/industry/${i.slug}/${r.m.slug}/`}>{r.m.name}</Link></span>)}</p>
      <p>関連：<Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link>・<Link href={`/population/${m.slug}/`}>{m.name}の人口動態</Link>・<Link href={`/industry/${i.slug}/`}>岩手県の{i.name}ランキング</Link></p>

      <CiteBox title={title} path={`/industry/${i.slug}/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['econ2021', 'econ2016']} extra={[
        '特化係数＝当該市町村の当該産業の事業所構成比 ÷ 岩手県の同産業の事業所構成比。1.00で県平均と同じ、1を超えるほどその産業に偏っている。',
        '人口千人当たりは2021年1月1日の住民基本台帳人口で算出。',
        '「秘匿」は事業所数が少なく個別の値が特定されるため公表されていない項目、「非公表」は当該表で集計されていない項目。',
      ]} />
    </>
  );
}
