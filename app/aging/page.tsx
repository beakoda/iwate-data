import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, censusAt, agingRate, youthRate, workingRate, fmt, fmtSigned, rank, LATEST_CENSUS, PREV_CENSUS } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の高齢化率ランキング（${LATEST_CENSUS}年国勢調査）`;
const p = censusAt(PREF.code, LATEST_CENSUS)!;
const p0 = censusAt(PREF.code, PREV_CENSUS)!;
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の高齢化率は${fmt(agingRate(p))}%（${LATEST_CENSUS}年国勢調査）。33市町村別の高齢化率・年少人口割合・平均年齢・人口密度を一覧とランキングで比較。${PREV_CENSUS}年からの変化つき。`,
  alternates: { canonical: '/aging/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const c = censusAt(m.code, LATEST_CENSUS)!, c0 = censusAt(m.code, PREV_CENSUS)!;
    return { m, c, aging: agingRate(c), prev: agingRate(c0), youth: youthRate(c), work: workingRate(c) };
  });
  const r = rank(rows, x => x.aging);
  const by = [...rows].sort((a, b) => (b.aging ?? -1) - (a.aging ?? -1));
  const top = by[0], low = by[by.length - 1];
  const prefAging = agingRate(p), prefPrev = agingRate(p0);
  const sentence = `岩手県の高齢化率は${LATEST_CENSUS}年国勢調査で${fmt(prefAging)}%（${PREV_CENSUS}年${fmt(prefPrev)}%）。県内で最も高いのは${top.m.name}の${fmt(top.aging)}%、最も低いのは${low.m.name}の${fmt(low.aging)}%。`;
  return (
    <>
      <Breadcrumb items={[{ name: '高齢化率・年齢構成' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/aging/" keywords={['岩手県', '高齢化率', '年齢構成', '市町村別', 'ランキング', '国勢調査']} temporal={`${PREV_CENSUS}/${LATEST_CENSUS}`} sourceKeys={['census']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の高齢化率は<strong>{fmt(prefAging)}%</strong>（{LATEST_CENSUS}年10月1日）。{PREV_CENSUS}年の{fmt(prefPrev)}%から{fmtSigned(Math.round(((prefAging ?? 0) - (prefPrev ?? 0)) * 10) / 10)}ポイント。県内で最も高いのは<strong>{top.m.name}の{fmt(top.aging)}%</strong>、最も低いのは<strong>{low.m.name}の{fmt(low.aging)}%</strong>で、その差は{fmt(Math.round(((top.aging ?? 0) - (low.aging ?? 0)) * 10) / 10)}ポイント。</p>
      <BarChart title={`市町村別 高齢化率（${LATEST_CENSUS}年、％）`} items={by.map(x => ({ label: x.m.name, value: x.aging }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>順位</th><th>市町村</th><th>高齢化率</th><th>{PREV_CENSUS}年</th><th>変化</th><th>年少人口割合</th><th>生産年齢人口割合</th><th>平均年齢</th><th>人口</th><th>人口密度</th></tr></thead>
          <tbody>
            <tr className="hl"><td>—</td><td>岩手県</td><td>{fmt(prefAging)}%</td><td>{fmt(prefPrev)}%</td><td>{fmtSigned(Math.round(((prefAging ?? 0) - (prefPrev ?? 0)) * 10) / 10)}pt</td><td>{fmt(youthRate(p))}%</td><td>{fmt(workingRate(p))}%</td><td>{fmt(p.avg_age != null ? Math.round(p.avg_age * 10) / 10 : null)}歳</td><td>{fmt(p.total)}</td><td>{fmt(p.density)}</td></tr>
            {by.map(x => { const d = x.aging != null && x.prev != null ? Math.round((x.aging - x.prev) * 10) / 10 : null; return (
              <tr key={x.m.code}><td>{r.get(x) ?? '—'}</td><td><Link href={`/aging/${x.m.slug}/`}>{x.m.name}</Link></td>
                <td>{fmt(x.aging)}%</td><td>{fmt(x.prev)}%</td>
                <td className={d != null && d > 0 ? 'neg' : d != null ? 'pos' : ''}>{fmtSigned(d)}pt</td>
                <td>{fmt(x.youth)}%</td><td>{fmt(x.work)}%</td>
                <td>{fmt(x.c.avg_age != null ? Math.round(x.c.avg_age * 10) / 10 : null)}歳</td>
                <td>{fmt(x.c.total)}</td><td>{fmt(x.c.density)}</td></tr>); })}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const c = censusAt(m.code, LATEST_CENSUS)!; return <li key={m.code}><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率<small>{fmt(agingRate(c))}%・平均年齢{fmt(c.avg_age != null ? Math.round(c.avg_age * 10) / 10 : null)}歳</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/aging/" sentence={sentence} />
      <SourceBox keys={['census']} extra={['高齢化率・年少人口割合・生産年齢人口割合は年齢3区分の合計を分母として算出。総人口には年齢「不詳」が含まれる。']} />
    </>
  );
}
