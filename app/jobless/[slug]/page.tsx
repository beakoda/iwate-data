import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, joblessAt, joblessSeries, joblessPrefAt, joblessRate, elderWorkerShare, fmt, fmtSigned, pct, rank, LATEST_JOBLESS, FIRST_JOBLESS } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = joblessAt(m.code, LATEST_JOBLESS)!;
  return {
    title: `${m.name}の完全失業率・就業者数の推移（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年）`,
    description: `${m.name}（岩手県）の完全失業率は${LATEST_JOBLESS}年に${fmt(joblessRate(r))}%、完全失業者${fmt(r.jobless)}人、就業者${fmt(r.workers)}人。県内33市町村の順位つきで国勢調査から集計。`,
    alternates: { canonical: `/jobless/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = joblessSeries(m.code);
  const r = joblessAt(m.code, LATEST_JOBLESS)!, r0 = joblessAt(m.code, FIRST_JOBLESS)!;
  const pref = joblessPrefAt(LATEST_JOBLESS);
  const rate = joblessRate(r), rate0 = joblessRate(r0), prefRate = joblessRate(pref);
  const e65 = elderWorkerShare(r), prefE65 = elderWorkerShare(pref);
  const rows = MUNIS.map(mm => { const x = joblessAt(mm.code, LATEST_JOBLESS)!; return { m: mm, rate: joblessRate(x), w: x.workers, e: elderWorkerShare(x) }; });
  const rR = rank(rows, x => x.rate), rW = rank(rows, x => x.w), rE = rank(rows, x => x.e);
  const me = rows.find(x => x.m.code === m.code)!;
  const title = `${m.name}の完全失業率・就業者数の推移（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年）`;
  const sentence = `${m.name}の完全失業率は${LATEST_JOBLESS}年に${fmt(rate)}%（完全失業者${fmt(r.jobless)}人、労働力人口${fmt(r.labor)}人）で、岩手県内33市町村中${rR.get(me) ?? '—'}位（県平均${fmt(prefRate)}%）。${FIRST_JOBLESS}年の${fmt(rate0)}%から${fmtSigned(Math.round(((rate ?? 0) - (rate0 ?? 0)) * 10) / 10, 'ポイント')}。就業者は${fmt(r.workers)}人で、うち65歳以上が${fmt(r.workers65)}人（${fmt(e65)}%）。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '完全失業率・労働力', href: '/jobless/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/jobless/${m.slug}/`}
        keywords={[m.name, '完全失業率', '失業率', '労働力人口', '就業者数', '高齢者就業', '国勢調査', '岩手県']} temporal={`${FIRST_JOBLESS}/${LATEST_JOBLESS}`} sourceKeys={['jobless']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の完全失業率は{LATEST_JOBLESS}年に<strong>{fmt(rate)}%</strong>で岩手県内<strong>{rR.get(me) ?? '—'}位</strong>（県平均{fmt(prefRate)}%）。
        完全失業者{fmt(r.jobless)}人、労働力人口{fmt(r.labor)}人で、{FIRST_JOBLESS}年の{fmt(rate0)}%から<strong>{fmtSigned(Math.round(((rate ?? 0) - (rate0 ?? 0)) * 10) / 10, 'ポイント')}</strong>。就業者{fmt(r.workers)}人のうち65歳以上は{fmt(r.workers65)}人（{fmt(e65)}%）。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">完全失業率（{LATEST_JOBLESS}年）</div><div className="stat-value">{fmt(rate)}</div><div className="stat-sub">%・県内 {rR.get(me) ?? '—'}位（県平均 {fmt(prefRate)}%）</div></div>
        <div className="stat"><div className="stat-label">完全失業者数</div><div className="stat-value">{fmt(r.jobless)}</div><div className="stat-sub">人・{FIRST_JOBLESS}年 {fmt(r0.jobless)}人</div></div>
        <div className="stat"><div className="stat-label">労働力人口</div><div className="stat-value">{fmt(r.labor)}</div><div className="stat-sub">人・{FIRST_JOBLESS}年比 {fmtSigned(pct(r.labor, r0.labor), '%')}</div></div>
        <div className="stat"><div className="stat-label">就業者数</div><div className="stat-value">{fmt(r.workers)}</div><div className="stat-sub">人・県内 {rW.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">65歳以上の就業者</div><div className="stat-value">{fmt(r.workers65)}</div><div className="stat-sub">人・就業者の {fmt(e65)}%・県内 {rE.get(me) ?? '—'}位（県平均 {fmt(prefE65)}%）</div></div>
      </div>
      <LineChart title={`${m.name}の完全失業率（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年、%）`} unit="%" zero
        series={[{ label: '完全失業率', points: s.map(x => ({ x: x.year, y: joblessRate(x) ?? 0 })) }]} />
      <LineChart title={`${m.name}の労働力人口・就業者数（${FIRST_JOBLESS}〜${LATEST_JOBLESS}年、人）`} unit="人" zero
        series={[
          { label: '労働力人口', points: s.map(x => ({ x: x.year, y: x.labor ?? 0 })) },
          { label: '就業者数', points: s.map(x => ({ x: x.year, y: x.workers ?? 0 })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>労働力人口</th><th>就業者数</th><th>完全失業者</th><th>完全失業率</th><th>65歳以上就業者</th><th>就業者比</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.labor)}</td><td>{fmt(x.workers)}</td><td>{fmt(x.jobless)}</td>
                <td>{fmt(joblessRate(x))}%</td><td>{fmt(x.workers65)}</td><td>{fmt(elderWorkerShare(x))}%</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/work/${m.slug}/`}>{m.name}の産業別就業者・昼夜間人口</Link></li>
        <li><Link href={`/education/${m.slug}/`}>{m.name}の最終学歴</Link></li>
        <li><Link href={`/industry/${m.slug}/`}>{m.name}の産業・事業所</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/jobless/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['jobless']} extra={[
        '完全失業者＝仕事がなく、仕事を探していて、すぐ就ける状態にあった人（調査週間中）。ハローワークの求職者数とは別の概念。',
        '「完全失業率」「就業者に占める65歳以上の割合」は本サイトの計算値。労働力人口＝就業者＋完全失業者。',
        '国勢調査は5年ごとの調査のため、値は5年刻みになる。市町村に住む人の状態であり、その市町村で働く人の数ではない（後者は/industry/を参照）。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
