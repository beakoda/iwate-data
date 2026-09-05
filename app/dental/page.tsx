import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, dentalSeries, dentalAt, per100k, fmt, fmtSigned, pct, rank, LATEST_DENTAL, popAt } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';
import { IwateMap } from '@/components/Map';

const TITLE = `岩手県の歯科診療所数の推移（2009〜${LATEST_DENTAL}年）と市町村別ランキング`;
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の歯科診療所数は${LATEST_DENTAL}年に${fmt(dentalAt(PREF.code, LATEST_DENTAL)!.dent)}施設。2009年からの推移、33市町村の施設数・人口10万人当たり施設数のランキングを厚労省「医療施設調査」から集計。`,
  alternates: { canonical: '/dental/' },
};

export default function Page() {
  const s = dentalSeries(PREF.code);
  const latest = s[s.length - 1], first = s[0], prev = s[s.length - 2];
  const peak = s.reduce((a, b) => (b.dent > a.dent ? b : a));
  const rows = MUNIS.map(m => ({ m, d: dentalAt(m.code, LATEST_DENTAL)!, d0: dentalAt(m.code, 2009)!, per: per100k(dentalAt(m.code, LATEST_DENTAL)!.dent, m.code, LATEST_DENTAL) }));
  const rCount = rank(rows, r => r.d.dent); const rPer = rank(rows, r => r.per);
  const byCount = [...rows].sort((a, b) => b.d.dent - a.d.dent);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const prefPer = per100k(latest.dent, PREF.code, LATEST_DENTAL);
  return (
    <>
      <Breadcrumb items={[{ name: '歯科診療所' }]} />
      <DatasetJsonLd name={TITLE} description={metadata.description as string} path="/dental/" keywords={['岩手県', '歯科診療所数', '推移', '市町村別', '人口10万人当たり', '医療施設調査']} temporal={`2009/${LATEST_DENTAL}`} sourceKeys={['dental', 'population']} />
      <h1>{TITLE}</h1>
      <MuniStrip family="dental" />
      <p className="key-fact">岩手県の歯科診療所数は<strong>{fmt(latest.dent)}施設</strong>（{LATEST_DENTAL}年10月1日）。ピークの{peak.year}年（{fmt(peak.dent)}施設）から<strong>{fmt(peak.dent - latest.dent)}施設減</strong>、2009年比では{fmtSigned(pct(latest.dent, first.dent), '%')}。人口10万人当たりでは{fmt(prefPer)}施設。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">歯科診療所数（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(latest.dent)}</div><div className="stat-sub">前年比 {fmtSigned(latest.dent - prev.dent)}</div></div>
        <div className="stat"><div className="stat-label">一般診療所数（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(latest.gen)}</div><div className="stat-sub">前年比 {fmtSigned(latest.gen - prev.gen)}</div></div>
        <div className="stat"><div className="stat-label">人口10万人当たり歯科診療所</div><div className="stat-value">{fmt(prefPer)}</div><div className="stat-sub">人口は{LATEST_DENTAL + 1}年1月1日住基</div></div>
        <div className="stat"><div className="stat-label">歯科診療所が最多の市町村</div><div className="stat-value">{byCount[0].m.name}</div><div className="stat-sub">{fmt(byCount[0].d.dent)}施設（県の{Math.round(byCount[0].d.dent / latest.dent * 100)}%）</div></div>
      </div>
      <IwateMap title={`人口10万人当たり歯科診療所数（${LATEST_DENTAL}年）`} unit="施設" decimals={1} family="dental" values={rows.map(x => ({ code: x.m.code, value: x.per ?? null }))} />
      <Tools family="dental" slug="all" label="33市町村の全年データ" />

      <LineChart title={`岩手県の歯科診療所数・一般診療所数の推移（2009〜${LATEST_DENTAL}年）`} series={[{ label: '歯科診療所', points: s.map(r => ({ x: r.year, y: r.dent })) }, { label: '一般診療所', points: s.map(r => ({ x: r.year, y: r.gen })) }]} unit="施設" />
      <h2>市町村別ランキング（{LATEST_DENTAL}年）</h2>
      <BarChart title="歯科診療所数（施設）" items={byCount.map(r => ({ label: r.m.name, value: r.d.dent }))} unit="施設" />
      <BarChart title={`人口10万人当たり歯科診療所数（人口は${LATEST_DENTAL + 1}年1月1日）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>歯科診療所（{LATEST_DENTAL}年）</th><th>順位</th><th>2009年</th><th>増減</th><th>人口10万対</th><th>順位</th><th>一般診療所</th><th>人口（{LATEST_DENTAL + 1}年）</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県</td><td>{fmt(latest.dent)}</td><td>—</td><td>{fmt(first.dent)}</td><td>{fmtSigned(latest.dent - first.dent)}</td><td>{fmt(prefPer)}</td><td>—</td><td>{fmt(latest.gen)}</td><td>{fmt(popAt(PREF.code, LATEST_DENTAL + 1)?.total)}</td></tr>
            {byCount.map(r => { const diff = r.d.dent - r.d0.dent; return (
              <tr key={r.m.code}><td><Link href={`/dental/${r.m.slug}/`}>{r.m.name}</Link></td><td>{fmt(r.d.dent)}</td><td>{rCount.get(r)}位</td><td>{fmt(r.d0.dent)}</td><td className={diff < 0 ? 'neg' : diff > 0 ? 'pos' : ''}>{fmtSigned(diff)}</td><td>{fmt(r.per)}</td><td>{rPer.get(r) ?? '—'}位</td><td>{fmt(r.d.gen)}</td><td>{fmt(popAt(r.m.code, LATEST_DENTAL + 1)?.total)}</td></tr>); })}
          </tbody>
        </table>
      </div>
      <h2>市町村別の推移ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => <li key={m.code}><Link href={`/dental/${m.slug}/`}>{m.name}の歯科診療所数<small>{fmt(dentalAt(m.code, LATEST_DENTAL)!.dent)}施設（{LATEST_DENTAL}年）</small></Link></li>)}</ul>
      <Cta topic="歯科診療所数" />
      <CiteBox title={TITLE} path="/dental/" sentence={`岩手県の歯科診療所数は${LATEST_DENTAL}年時点で${fmt(latest.dent)}施設、${peak.year}年のピーク（${fmt(peak.dent)}施設）から${fmt(peak.dent - latest.dent)}施設減少している（厚生労働省「医療施設調査」）。`} />
      <SourceBox keys={['dental', 'population']} extra={['人口10万人当たりは、医療施設調査（各年10月1日）の施設数を、翌年1月1日の住民基本台帳人口で除して算出。', '合併・市制施行前の旧自治体（滝沢村、藤沢町、川井村）は現行の市に合算。']} />
    </>
  );
}
