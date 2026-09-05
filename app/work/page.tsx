import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, censusAt, CENSUS_IND, fmt, fmtSigned, pct, rank, LATEST_CENSUS, PREV_CENSUS } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の就業者数・昼夜間人口比率（${LATEST_CENSUS}年国勢調査）`;
const p = censusAt(PREF.code, LATEST_CENSUS)!;
const p0 = censusAt(PREF.code, PREV_CENSUS)!;
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の就業者数は${fmt(p.workers)}人、労働力率${fmt(Math.round((p.labor_rate ?? 0) * 10) / 10)}%（${LATEST_CENSUS}年国勢調査）。市町村別の就業者数・労働力率・昼夜間人口比率と、産業大分類別就業者数の${PREV_CENSUS}年比を一覧。`,
  alternates: { canonical: '/work/' },
};

export default function Page() {
  const rows = MUNIS.map(m => { const c = censusAt(m.code, LATEST_CENSUS)!, c0 = censusAt(m.code, PREV_CENSUS)!;
    return { m, c, c0, dn: c.dn_ratio != null ? Math.round(c.dn_ratio * 10) / 10 : null }; });
  const rW = rank(rows, x => x.c.workers), rD = rank(rows, x => x.dn), rR = rank(rows, x => x.c.labor_rate);
  const byDn = [...rows].sort((a, b) => (b.dn ?? -1) - (a.dn ?? -1));
  const inds = CENSUS_IND.filter(ci => ci.code !== 'T').map(ci => ({ ci, now: (p[ci.key] as number | null) ?? null, prev: (p0[ci.key] as number | null) ?? null }))
    .sort((a, b) => (b.now ?? -1) - (a.now ?? -1));
  const sentence = `岩手県の就業者数は${LATEST_CENSUS}年国勢調査で${fmt(p.workers)}人（${PREV_CENSUS}年比${fmtSigned(pct(p.workers, p0.workers), '%')}）。昼夜間人口比率が最も高いのは${byDn[0].m.name}の${fmt(byDn[0].dn)}、最も低いのは${byDn[byDn.length - 1].m.name}の${fmt(byDn[byDn.length - 1].dn)}。`;
  return (
    <>
      <Breadcrumb items={[{ name: '就業・昼夜間人口' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/work/" keywords={['岩手県', '就業者数', '労働力率', '昼夜間人口比率', '産業別就業者', '国勢調査']} temporal={`${PREV_CENSUS}/${LATEST_CENSUS}`} sourceKeys={['census']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の就業者数は<strong>{fmt(p.workers)}人</strong>（{LATEST_CENSUS}年10月1日、{PREV_CENSUS}年比{fmtSigned(pct(p.workers, p0.workers), '%')}）。第1次{fmt(Math.round(p.w1 / p.workers * 1000) / 10)}%・第2次{fmt(Math.round(p.w2 / p.workers * 1000) / 10)}%・第3次{fmt(Math.round(p.w3 / p.workers * 1000) / 10)}%。昼夜間人口比率が最も高いのは<strong>{byDn[0].m.name}（{fmt(byDn[0].dn)}）</strong>。</p>

      <h2>岩手県の産業大分類別就業者数</h2>
      <BarChart title={`岩手県 産業別就業者数（${LATEST_CENSUS}年、人）`} items={inds.map(x => ({ label: x.ci.code + ' ' + x.ci.name.slice(0, 8), value: x.now }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>産業大分類</th><th>{LATEST_CENSUS}年</th><th>{PREV_CENSUS}年</th><th>増減率</th><th>構成比</th></tr></thead>
          <tbody>
            {inds.map(x => { const ch = pct(x.now, x.prev); return <tr key={x.ci.key}><td>{x.ci.code} {x.ci.name}</td><td>{fmt(x.now)}</td><td>{fmt(x.prev)}</td><td className={ch != null && ch < 0 ? 'neg' : ch != null ? 'pos' : ''}>{fmtSigned(ch, '%')}</td><td>{x.now != null ? (x.now / p.workers * 100).toFixed(1) + '%' : '—'}</td></tr>; })}
            <tr className="hl"><td>就業者数（総数）</td><td>{fmt(p.workers)}</td><td>{fmt(p0.workers)}</td><td>{fmtSigned(pct(p.workers, p0.workers), '%')}</td><td>100%</td></tr>
          </tbody>
        </table>
      </div>

      <h2>市町村別 昼夜間人口比率</h2>
      <BarChart title={`昼夜間人口比率（${LATEST_CENSUS}年）`} items={byDn.map(x => ({ label: x.m.name, value: x.dn }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>就業者数</th><th>順位</th><th>労働力率</th><th>順位</th><th>昼間人口</th><th>昼夜間人口比率</th><th>順位</th><th>第1次</th><th>第2次</th><th>第3次</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県</td><td>{fmt(p.workers)}</td><td>—</td><td>{fmt(Math.round((p.labor_rate ?? 0) * 10) / 10)}%</td><td>—</td><td>{fmt(p.day_pop)}</td><td>{fmt(Math.round((p.dn_ratio ?? 0) * 10) / 10)}</td><td>—</td><td>{fmt(Math.round(p.w1 / p.workers * 1000) / 10)}%</td><td>{fmt(Math.round(p.w2 / p.workers * 1000) / 10)}%</td><td>{fmt(Math.round(p.w3 / p.workers * 1000) / 10)}%</td></tr>
            {byDn.map(x => <tr key={x.m.code}>
              <td><Link href={`/work/${x.m.slug}/`}>{x.m.name}</Link></td>
              <td>{fmt(x.c.workers)}</td><td>{rW.get(x) ?? '—'}位</td>
              <td>{fmt(x.c.labor_rate != null ? Math.round(x.c.labor_rate * 10) / 10 : null)}%</td><td>{rR.get(x) ?? '—'}位</td>
              <td>{fmt(x.c.day_pop)}</td><td>{fmt(x.dn)}</td><td>{rD.get(x) ?? '—'}位</td>
              <td>{fmt(Math.round(x.c.w1 / x.c.workers * 1000) / 10)}%</td>
              <td>{fmt(Math.round(x.c.w2 / x.c.workers * 1000) / 10)}%</td>
              <td>{fmt(Math.round(x.c.w3 / x.c.workers * 1000) / 10)}%</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const c = censusAt(m.code, LATEST_CENSUS)!; return <li key={m.code}><Link href={`/work/${m.slug}/`}>{m.name}の就業者・昼夜間人口<small>就業者{fmt(c.workers)}人・昼夜間{fmt(c.dn_ratio != null ? Math.round(c.dn_ratio * 10) / 10 : null)}</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/work/" sentence={sentence} />
      <SourceBox keys={['census']} extra={['就業者数は15歳以上の就業者。昼夜間人口比率＝昼間人口÷常住人口×100。', `${LATEST_CENSUS}年は不詳補完結果のため「分類不能の産業」が計上されない。`]} />
    </>
  );
}
