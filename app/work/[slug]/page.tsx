import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, muniBySlug, censusAt, CENSUS_IND, CENSUS_IND_TO_SLUG, fmt, fmtSigned, pct, rank, LATEST_CENSUS, PREV_CENSUS } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const c = censusAt(m.code, LATEST_CENSUS)!;
  return {
    title: `${m.name}の就業者数・産業別就業者・昼夜間人口比率（${LATEST_CENSUS}年国勢調査）`,
    description: `${m.name}（岩手県）の就業者数は${fmt(c.workers)}人、労働力率${fmt(c.labor_rate != null ? Math.round(c.labor_rate * 10) / 10 : null)}%、昼夜間人口比率${fmt(c.dn_ratio != null ? Math.round(c.dn_ratio * 10) / 10 : null)}（${LATEST_CENSUS}年国勢調査）。産業大分類別の就業者数と第1〜3次産業の構成、${PREV_CENSUS}年比を掲載。`,
    alternates: { canonical: `/work/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const c = censusAt(m.code, LATEST_CENSUS)!, c0 = censusAt(m.code, PREV_CENSUS)!;
  const p = censusAt(PREF.code, LATEST_CENSUS)!;
  const rows = MUNIS.map(mm => { const x = censusAt(mm.code, LATEST_CENSUS)!; return { m: mm, workers: x.workers, rate: x.labor_rate, dn: x.dn_ratio, day: x.day_pop }; });
  const rW = rank(rows, r => r.workers), rR = rank(rows, r => r.rate), rD = rank(rows, r => r.dn);
  const me = rows.find(r => r.m.code === m.code)!;
  const inds = CENSUS_IND.map(ci => ({ ci, now: (c[ci.key] as number | null) ?? null, prev: (c0[ci.key] as number | null) ?? null }))
    .filter(x => x.ci.code !== 'T' || (x.now ?? 0) > 0 || (x.prev ?? 0) > 0);
  const byW = [...inds].sort((a, b) => (b.now ?? -1) - (a.now ?? -1));
  const dn = c.dn_ratio != null ? Math.round(c.dn_ratio * 10) / 10 : null;
  const title = `${m.name}の就業者・産業別就業者数（${LATEST_CENSUS}年国勢調査）`;
  const sentence = `${m.name}の就業者数は${LATEST_CENSUS}年国勢調査で${fmt(c.workers)}人（労働力率${fmt(c.labor_rate != null ? Math.round(c.labor_rate * 10) / 10 : null)}%、県内${rW.get(me) ?? '—'}位）。昼間人口は${fmt(c.day_pop)}人で昼夜間人口比率は${fmt(dn)}、第3次産業が就業者の${fmt(Math.round(c.w3 / c.workers * 1000) / 10)}%を占める。`;
  return (
    <>
      <Breadcrumb items={[{ name: '就業・昼夜間人口', href: '/work/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/work/${m.slug}/`}
        keywords={[m.name, '就業者数', '産業別就業者', '昼夜間人口比率', '労働力率', '国勢調査', '岩手県']} temporal={`${PREV_CENSUS}/${LATEST_CENSUS}`} sourceKeys={['census']} />
      <h1>{title}</h1>
      <MuniStrip family="work" current={m.code} />
      <p className="key-fact">
        {m.name}の就業者数は<strong>{fmt(c.workers)}人</strong>（{LATEST_CENSUS}年10月1日、県内<strong>{rW.get(me) ?? '—'}位</strong>）。労働力率{fmt(c.labor_rate != null ? Math.round(c.labor_rate * 10) / 10 : null)}%、
        昼夜間人口比率<strong>{fmt(dn)}</strong>（県内{rD.get(me) ?? '—'}位）。最も就業者が多い産業は{byW[0].ci.name}の{fmt(byW[0].now)}人。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">就業者数（{LATEST_CENSUS}年）</div><div className="stat-value">{fmt(c.workers)}</div><div className="stat-sub">{PREV_CENSUS}年比 {fmtSigned(pct(c.workers, c0.workers), '%')}</div></div>
        <div className="stat"><div className="stat-label">労働力率</div><div className="stat-value">{fmt(c.labor_rate != null ? Math.round(c.labor_rate * 10) / 10 : null)}%</div><div className="stat-sub">15歳以上人口 {fmt(c.pop15)}人・県内{rR.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">昼夜間人口比率</div><div className="stat-value">{fmt(dn)}</div><div className="stat-sub">昼間人口 {fmt(c.day_pop)}人・100超で流入超過</div></div>
        <div className="stat"><div className="stat-label">第1次産業</div><div className="stat-value">{fmt(Math.round(c.w1 / c.workers * 1000) / 10)}%</div><div className="stat-sub">{fmt(c.w1)}人</div></div>
        <div className="stat"><div className="stat-label">第2次産業</div><div className="stat-value">{fmt(Math.round(c.w2 / c.workers * 1000) / 10)}%</div><div className="stat-sub">{fmt(c.w2)}人</div></div>
        <div className="stat"><div className="stat-label">第3次産業</div><div className="stat-value">{fmt(Math.round(c.w3 / c.workers * 1000) / 10)}%</div><div className="stat-sub">{fmt(c.w3)}人</div></div>
      </div>
      <Tools family="work" slug={m.slug} label={`${m.name}の全年データ`} />

      <h2>産業大分類別の就業者数（{PREV_CENSUS}年 → {LATEST_CENSUS}年）</h2>
      <BarChart title={`${m.name}の産業別就業者数（${LATEST_CENSUS}年、人）`} items={byW.map(x => ({ label: x.ci.code + ' ' + x.ci.name.slice(0, 8), value: x.now }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>産業大分類</th><th>{LATEST_CENSUS}年</th><th>{PREV_CENSUS}年</th><th>増減</th><th>増減率</th><th>構成比</th><th>県の構成比</th></tr></thead>
          <tbody>
            {byW.map(x => { const ch = pct(x.now, x.prev); const pv = (p[x.ci.key] as number | null) ?? null; const sl = CENSUS_IND_TO_SLUG[x.ci.key];
              return (<tr key={x.ci.key}>
                <td>{sl ? <Link href={`/industry/${sl}/${m.slug}/`}>{x.ci.code} {x.ci.name}</Link> : `${x.ci.code} ${x.ci.name}`}</td>
                <td>{fmt(x.now)}</td><td>{fmt(x.prev)}</td>
                <td className={x.now != null && x.prev != null && x.now - x.prev < 0 ? 'neg' : x.now != null && x.prev != null && x.now - x.prev > 0 ? 'pos' : ''}>{x.now != null && x.prev != null ? fmtSigned(x.now - x.prev) : '—'}</td>
                <td className={ch != null && ch < 0 ? 'neg' : ch != null ? 'pos' : ''}>{fmtSigned(ch, '%')}</td>
                <td>{x.now != null ? (x.now / c.workers * 100).toFixed(1) + '%' : '—'}</td>
                <td>{pv != null ? (pv / p.workers * 100).toFixed(1) + '%' : '—'}</td>
              </tr>); })}
            <tr className="hl"><td>就業者数（総数）</td><td>{fmt(c.workers)}</td><td>{fmt(c0.workers)}</td><td>{fmtSigned(c.workers - c0.workers)}</td><td>{fmtSigned(pct(c.workers, c0.workers), '%')}</td><td>100%</td><td>100%</td></tr>
          </tbody>
        </table>
      </div>

      <h2>通勤・通学と昼間人口</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>項目</th><th>{LATEST_CENSUS}年</th><th>{PREV_CENSUS}年</th></tr></thead>
          <tbody>
            <tr><td>昼間人口</td><td>{fmt(c.day_pop)}人</td><td>{fmt(c0.day_pop)}人</td></tr>
            <tr><td>常住人口（国勢調査人口）</td><td>{fmt(c.total)}人</td><td>{fmt(c0.total)}人</td></tr>
            <tr className="hl"><td>昼夜間人口比率</td><td>{fmt(dn)}</td><td>{fmt(c0.dn_ratio != null ? Math.round(c0.dn_ratio * 10) / 10 : null)}</td></tr>
            <tr><td>{LATEST_CENSUS}年：通勤者／{PREV_CENSUS}年：15歳以上自宅外就業者</td><td>{fmt(c.commute)}人</td><td>{fmt(c0.commute)}人</td></tr>
            <tr><td>通学者（15歳以上）</td><td>{fmt(c.school)}人</td><td>{fmt(c0.school)}人</td></tr>
          </tbody>
        </table>
      </div>
      <p>昼夜間人口比率は昼間人口÷常住人口×100。100を超えると通勤・通学で入ってくる人が出ていく人より多い（流入超過）、100未満はその逆。</p>

      <h2>県内の位置</h2>
      <BarChart title={`市町村別 昼夜間人口比率（${LATEST_CENSUS}年）`} items={[...rows].sort((a, b) => (b.dn ?? -1) - (a.dn ?? -1)).map(x => ({ label: x.m.name, value: x.dn != null ? Math.round(x.dn * 10) / 10 : null }))} highlight={m.name} />
      <p>他の市町村：{MUNIS.filter(x => x.code !== m.code).map((x, k) => <span key={x.code}>{k ? '・' : ''}<Link href={`/work/${x.slug}/`}>{x.name}</Link></span>)}</p>
      <p>関連：<Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link>・<Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link>・<Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯の推移</Link></p>
      <Cta muni={m.name} topic="就業者数・昼夜間人口" />
      <CiteBox title={title} path={`/work/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['census']} extra={[
        '就業者数は15歳以上の就業者。産業大分類は日本標準産業分類による。',
        `${LATEST_CENSUS}年は不詳補完結果のため「分類不能の産業」が計上されない。${PREV_CENSUS}年との産業別の比較はこの違いを含む。`,
        '「通勤者」（2020年）と「15歳以上自宅外就業者」（2015年）は定義が異なるため、単純比較はできない。',
      ]} />
    </>
  );
}
