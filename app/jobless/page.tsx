import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, joblessAt, joblessPrefAt, joblessRate, elderWorkerShare, fmt, fmtSigned, pct, rank, JOBLESS_YEARS, LATEST_JOBLESS, FIRST_JOBLESS } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';
import { IwateMap } from '@/components/Map';

const TITLE = `岩手県33市町村の完全失業率・労働力人口（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年）`;
const pNow = joblessPrefAt(LATEST_JOBLESS);
const pFirst = joblessPrefAt(FIRST_JOBLESS);
const prefRate = joblessRate(pNow);
const prefRate0 = joblessRate(pFirst);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の完全失業率は${LATEST_JOBLESS}年に${fmt(prefRate)}%、完全失業者${fmt(pNow.jobless)}人、労働力人口${fmt(pNow.labor)}人。33市町村別に完全失業率・就業者数・65歳以上就業者を国勢調査から一覧。`,
  alternates: { canonical: '/jobless/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = joblessAt(m.code, LATEST_JOBLESS)!, r0 = joblessAt(m.code, FIRST_JOBLESS)!;
    return { m, r, r0, rate: joblessRate(r), rate0: joblessRate(r0), e65: elderWorkerShare(r) };
  });
  const rR = rank(rows, x => x.rate), rW = rank(rows, x => x.r.workers), rE = rank(rows, x => x.e65);
  const byRate = [...rows].filter(x => x.rate != null).sort((a, b) => b.rate! - a.rate!);
  const byW = [...rows].sort((a, b) => (b.r.workers ?? 0) - (a.r.workers ?? 0));
  const byE65 = [...rows].filter(x => x.e65 != null).sort((a, b) => b.e65! - a.e65!);
  const prefE65 = elderWorkerShare(pNow);
  const sentence = `岩手県の完全失業率は${LATEST_JOBLESS}年に${fmt(prefRate)}%（完全失業者${fmt(pNow.jobless)}人、労働力人口${fmt(pNow.labor)}人）で、${FIRST_JOBLESS}年の${fmt(prefRate0)}%から低下した。市町村別で最も高いのは${byRate[0].m.name}（${fmt(byRate[0].rate)}%）、最も低いのは${byRate[byRate.length - 1].m.name}（${fmt(byRate[byRate.length - 1].rate)}%）。就業者に占める65歳以上の割合は県全体で${fmt(prefE65)}%。`;
  return (
    <>
      <Breadcrumb items={[{ name: '完全失業率・労働力' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/jobless/" keywords={['岩手県', '完全失業率', '失業率', '労働力人口', '就業者数', '完全失業者', '高齢者就業', '国勢調査', '市町村別']} temporal={`${FIRST_JOBLESS}/${LATEST_JOBLESS}`} sourceKeys={['jobless']} />
      <h1>{TITLE}</h1>
      <MuniStrip family="jobless" />
      <p className="key-fact">岩手県の完全失業率は{LATEST_JOBLESS}年に<strong>{fmt(prefRate)}%</strong>（完全失業者{fmt(pNow.jobless)}人、労働力人口{fmt(pNow.labor)}人）で、{FIRST_JOBLESS}年の{fmt(prefRate0)}%から{fmtSigned(Math.round(((prefRate ?? 0) - (prefRate0 ?? 0)) * 10) / 10, 'ポイント')}。市町村別で最も高いのは<strong>{byRate[0].m.name}（{fmt(byRate[0].rate)}%）</strong>、最も低いのは<strong>{byRate[byRate.length - 1].m.name}（{fmt(byRate[byRate.length - 1].rate)}%）</strong>。就業者に占める65歳以上の割合は県全体で{fmt(prefE65)}%。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">完全失業率（{LATEST_JOBLESS}年）</div><div className="stat-value">{fmt(prefRate)}</div><div className="stat-sub">%・{FIRST_JOBLESS}年 {fmt(prefRate0)}%</div></div>
        <div className="stat"><div className="stat-label">完全失業者数</div><div className="stat-value">{fmt(pNow.jobless)}</div><div className="stat-sub">人・{FIRST_JOBLESS}年比 {fmtSigned(pct(pNow.jobless, pFirst.jobless), '%')}</div></div>
        <div className="stat"><div className="stat-label">労働力人口</div><div className="stat-value">{fmt(pNow.labor)}</div><div className="stat-sub">人・{FIRST_JOBLESS}年比 {fmtSigned(pct(pNow.labor, pFirst.labor), '%')}</div></div>
        <div className="stat"><div className="stat-label">65歳以上の就業者</div><div className="stat-value">{fmt(pNow.workers65)}</div><div className="stat-sub">人・就業者の {fmt(prefE65)}%</div></div>
      </div>
      <IwateMap title={`完全失業率（${LATEST_JOBLESS}年、%）`} unit="%" decimals={1} family="jobless" values={rows.map(x => ({ code: x.m.code, value: x.rate ?? null }))} />
      <Tools family="jobless" slug="all" label="33市町村の全年データ" />

      <LineChart title={`岩手県の完全失業率（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年、%）`} unit="%" zero
        series={[{ label: '完全失業率', points: JOBLESS_YEARS.map(y => ({ x: y, y: joblessRate(joblessPrefAt(y)) ?? 0 })) }]} />
      <LineChart title={`岩手県の労働力人口・就業者数（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年、人）`} unit="人" zero
        series={[
          { label: '労働力人口', points: JOBLESS_YEARS.map(y => ({ x: y, y: joblessPrefAt(y).labor ?? 0 })) },
          { label: '就業者数', points: JOBLESS_YEARS.map(y => ({ x: y, y: joblessPrefAt(y).workers ?? 0 })) },
        ]} />
      <BarChart title={`完全失業率（${LATEST_JOBLESS}年、市町村別）`} items={byRate.map(x => ({ label: x.m.name, value: x.rate }))} unit="%" />
      <BarChart title={`就業者に占める65歳以上の割合（${LATEST_JOBLESS}年）`} items={byE65.map(x => ({ label: x.m.name, value: x.e65 }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>完全失業率 {LATEST_JOBLESS}年</th><th>順位</th><th>{FIRST_JOBLESS}年</th><th>完全失業者</th><th>労働力人口</th><th>就業者数</th><th>順位</th><th>65歳以上就業者</th><th>就業者比</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(prefRate)}%</td><td>—</td><td>{fmt(prefRate0)}%</td><td>{fmt(pNow.jobless)}</td><td>{fmt(pNow.labor)}</td><td>{fmt(pNow.workers)}</td><td>—</td><td>{fmt(pNow.workers65)}</td><td>{fmt(prefE65)}%</td></tr>
            {byRate.map(x => (
              <tr key={x.m.code}><td><Link href={`/jobless/${x.m.slug}/`}>{x.m.name}</Link></td>
                <td>{fmt(x.rate)}%</td><td>{rR.get(x) ?? '—'}位</td><td>{fmt(x.rate0)}%</td>
                <td>{fmt(x.r.jobless)}</td><td>{fmt(x.r.labor)}</td><td>{fmt(x.r.workers)}</td><td>{rW.get(x) ?? '—'}位</td>
                <td>{fmt(x.r.workers65)}</td><td>{fmt(x.e65)}%</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = joblessAt(m.code, LATEST_JOBLESS)!; return <li key={m.code}><Link href={`/jobless/${m.slug}/`}>{m.name}の完全失業率<small>{LATEST_JOBLESS}年 {fmt(joblessRate(r))}%・就業者{fmt(r.workers)}人</small></Link></li>; })}</ul>
      <Cta topic="完全失業率" />
      <CiteBox title={TITLE} path="/jobless/" sentence={sentence} />
      <SourceBox keys={['jobless']} extra={[
        '完全失業者＝仕事がなく、仕事を探していて、すぐ就ける状態にあった人（調査週間中）。ハローワークの求職者数とは別の概念。',
        '「完全失業率」は完全失業者÷労働力人口で、本サイトの計算値。労働力人口＝就業者＋完全失業者。',
        '国勢調査は5年ごとの調査のため、値は5年刻みになる。市町村に住む人の状態であり、その市町村で働く人の数ではない。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と全指標・全年で一致することを確認している。',
      ]} />
    </>
  );
}
