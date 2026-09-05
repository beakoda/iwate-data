import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, popSeries, popAt, fmt, fmtSigned, pct, rank, LATEST_POP } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';
import { IwateMap } from '@/components/Map';

const TITLE = `岩手県の人口・世帯数の推移と市町村別ランキング（2013〜${LATEST_POP}年）`;
export const metadata: Metadata = { title: TITLE, description: `岩手県の人口は${LATEST_POP}年1月1日に${fmt(popAt(PREF.code, LATEST_POP)!.total)}人。33市町村の人口・世帯数・出生・死亡・転入・転出・増減率を住民基本台帳から集計。`, alternates: { canonical: '/population/' } };

export default function Page() {
  const s = popSeries(PREF.code); const latest = s[s.length - 1], first = s[0], prev = s[s.length - 2];
  const rows = MUNIS.map(m => { const p = popAt(m.code, LATEST_POP)!, p0 = popAt(m.code, 2013)!, pp = popAt(m.code, LATEST_POP - 1)!; return { m, p, p0, chg: pct(p.total, p0.total), yoy: pct(p.total, pp.total), natural: p.births - p.deaths, social: p.in - p.out }; });
  const byPop = [...rows].sort((a, b) => b.p.total - a.p.total);
  const byChg = [...rows].sort((a, b) => b.chg! - a.chg!);
  const r = rank(rows, x => x.p.total);
  return (
    <>
      <Breadcrumb items={[{ name: '人口・世帯' }]} />
      <DatasetJsonLd name={TITLE} description={metadata.description as string} path="/population/" keywords={['岩手県', '人口', '市町村別', '推移', '世帯数', '転入', '転出', '住民基本台帳']} temporal={`2013/${LATEST_POP}`} sourceKeys={['population']} />
      <h1>{TITLE}</h1>
      <MuniStrip family="population" />
      <p className="key-fact">岩手県の人口は<strong>{fmt(latest.total)}人</strong>（{LATEST_POP}年1月1日、住民基本台帳）。前年比{fmtSigned(latest.total - prev.total, '人')}、2013年比<strong>{fmtSigned(pct(latest.total, first.total), '%')}</strong>。{LATEST_POP - 1}年の自然増減は{fmtSigned(latest.births - latest.deaths, '人')}、社会増減は{fmtSigned(latest.in - latest.out, '人')}。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(latest.total)}</div><div className="stat-sub">前年比 {fmtSigned(latest.total - prev.total)}</div></div>
        <div className="stat"><div className="stat-label">世帯数</div><div className="stat-value">{fmt(latest.households)}</div><div className="stat-sub">1世帯 {(latest.total / latest.households).toFixed(2)}人</div></div>
        <div className="stat"><div className="stat-label">出生／死亡（{LATEST_POP - 1}年）</div><div className="stat-value">{fmt(latest.births)}／{fmt(latest.deaths)}</div><div className="stat-sub">自然増減 {fmtSigned(latest.births - latest.deaths)}</div></div>
        <div className="stat"><div className="stat-label">転入／転出（{LATEST_POP - 1}年）</div><div className="stat-value">{fmt(latest.in)}／{fmt(latest.out)}</div><div className="stat-sub">社会増減 {fmtSigned(latest.in - latest.out)}</div></div>
      </div>
      <IwateMap title={`人口の増減率（2013→${LATEST_POP}年、%）`} unit="%" decimals={1} family="population" values={rows.map(x => ({ code: x.m.code, value: x.chg ?? null }))} />
      <Tools family="population" slug="all" label="33市町村の全年データ" />

      <LineChart title={`岩手県の人口の推移（各年1月1日、2013〜${LATEST_POP}年）`} series={[{ label: '人口', points: s.map(x => ({ x: x.year, y: x.total })) }]} unit="人" />
      <LineChart title="出生数・死亡数・転入・転出（前年1年間）" series={[{ label: '出生', points: s.map(x => ({ x: x.year, y: x.births })) }, { label: '死亡', points: s.map(x => ({ x: x.year, y: x.deaths })) }, { label: '転入', points: s.map(x => ({ x: x.year, y: x.in })) }, { label: '転出', points: s.map(x => ({ x: x.year, y: x.out })) }]} unit="人" zero />
      <h2>市町村別ランキング（{LATEST_POP}年1月1日）</h2>
      <BarChart title="人口（人）" items={byPop.map(x => ({ label: x.m.name, value: x.p.total }))} unit="人" />
      <BarChart title="2013年→{LATEST_POP}年 人口増減率（%）" items={byChg.map(x => ({ label: x.m.name, value: x.chg }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>人口</th><th>順位</th><th>前年比</th><th>2013年比</th><th>世帯数</th><th>出生</th><th>死亡</th><th>自然増減</th><th>転入</th><th>転出</th><th>社会増減</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県</td><td>{fmt(latest.total)}</td><td>—</td><td>{fmtSigned(pct(latest.total, prev.total), '%')}</td><td>{fmtSigned(pct(latest.total, first.total), '%')}</td><td>{fmt(latest.households)}</td><td>{fmt(latest.births)}</td><td>{fmt(latest.deaths)}</td><td>{fmtSigned(latest.births - latest.deaths)}</td><td>{fmt(latest.in)}</td><td>{fmt(latest.out)}</td><td>{fmtSigned(latest.in - latest.out)}</td></tr>
            {byPop.map(x => <tr key={x.m.code}><td><Link href={`/population/${x.m.slug}/`}>{x.m.name}</Link></td><td>{fmt(x.p.total)}</td><td>{r.get(x)}位</td><td className={x.yoy! < 0 ? 'neg' : 'pos'}>{fmtSigned(x.yoy, '%')}</td><td className={x.chg! < 0 ? 'neg' : 'pos'}>{fmtSigned(x.chg, '%')}</td><td>{fmt(x.p.households)}</td><td>{fmt(x.p.births)}</td><td>{fmt(x.p.deaths)}</td><td className={x.natural < 0 ? 'neg' : 'pos'}>{fmtSigned(x.natural)}</td><td>{fmt(x.p.in)}</td><td>{fmt(x.p.out)}</td><td className={x.social < 0 ? 'neg' : 'pos'}>{fmtSigned(x.social)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <h2>市町村別の推移ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => <li key={m.code}><Link href={`/population/${m.slug}/`}>{m.name}の人口動態<small>{fmt(popAt(m.code, LATEST_POP)!.total)}人（{LATEST_POP}年）</small></Link></li>)}</ul>
      <Cta topic="人口" />
      <CiteBox title={TITLE} path="/population/" sentence={`岩手県の人口は${LATEST_POP}年1月1日時点で${fmt(latest.total)}人、2013年比${fmtSigned(pct(latest.total, first.total), '%')}（総務省「住民基本台帳に基づく人口、人口動態及び世帯数調査」）。`} />
      <SourceBox keys={['population']} extra={['出生・死亡・転入・転出は各年の前年1月1日〜12月31日の1年間。転入・転出は国内・国外の合計。', '滝沢村（2013年）は滝沢市に含めて表示。']} />
    </>
  );
}
