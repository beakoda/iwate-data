import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, muniBySlug, popSeries, popAt, fmt, fmtSigned, pct, rank, LATEST_POP } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const p = popAt(m.code, LATEST_POP)!, p0 = popAt(m.code, 2013)!;
  const title = `${m.name}の人口・世帯数の推移（2013〜${LATEST_POP}年）`;
  return { title, description: `${m.name}（岩手県）の人口は${LATEST_POP}年1月1日に${fmt(p.total)}人（2013年${fmt(p0.total)}人、${fmtSigned(pct(p.total, p0.total), '%')}）。世帯数、出生・死亡、転入・転出の推移と県内順位を住民基本台帳から集計。`, alternates: { canonical: `/population/${m.slug}/` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = popSeries(m.code); const latest = s[s.length - 1], first = s[0], prev = s[s.length - 2];
  const rows = MUNIS.map(mm => { const p = popAt(mm.code, LATEST_POP)!, p0 = popAt(mm.code, 2013)!; return { m: mm, p, chg: pct(p.total, p0.total) }; });
  const rPop = rank(rows, x => x.p.total), rChg = rank(rows, x => x.chg);
  const me = rows.find(x => x.m.code === m.code)!;
  const pref = popAt(PREF.code, LATEST_POP)!, pref0 = popAt(PREF.code, 2013)!;
  const title = `${m.name}の人口・世帯数の推移（2013〜${LATEST_POP}年）`;
  const cum = s.slice(1).reduce((a, x) => ({ nat: a.nat + x.births - x.deaths, soc: a.soc + x.in - x.out }), { nat: 0, soc: 0 });
  const sentence = `${m.name}の人口は${LATEST_POP}年1月1日時点で${fmt(latest.total)}人。2013年（${fmt(first.total)}人）比${fmtSigned(pct(latest.total, first.total), '%')}（岩手県全体は${fmtSigned(pct(pref.total, pref0.total), '%')}）。${LATEST_POP - 1}年の自然増減${fmtSigned(latest.births - latest.deaths, '人')}、社会増減${fmtSigned(latest.in - latest.out, '人')}。`;
  const bySocial = [...MUNIS].map(mm => ({ label: mm.name, value: popAt(mm.code, LATEST_POP)!.in - popAt(mm.code, LATEST_POP)!.out })).sort((a, b) => b.value - a.value);
  return (
    <>
      <Breadcrumb items={[{ name: '人口・世帯', href: '/population/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/population/${m.slug}/`} keywords={[m.name, '人口', '推移', '世帯数', '転入', '転出', '出生', '死亡', '岩手県']} temporal={`2013/${LATEST_POP}`} sourceKeys={['population']} />
      <h1>{title}</h1>
      <MuniStrip family="population" current={m.code} />
      <p className="key-fact"><strong>{m.name}の人口は{fmt(latest.total)}人</strong>（{LATEST_POP}年1月1日）。県内33市町村中<strong>{rPop.get(me)}位</strong>。2013年比<strong>{fmtSigned(pct(latest.total, first.total), '%')}</strong>（増減率は県内{rChg.get(me)}位、県全体{fmtSigned(pct(pref.total, pref0.total), '%')}）。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(latest.total)}</div><div className="stat-sub">前年比 {fmtSigned(latest.total - prev.total)}（{fmtSigned(pct(latest.total, prev.total), '%')}）</div></div>
        <div className="stat"><div className="stat-label">世帯数</div><div className="stat-value">{fmt(latest.households)}</div><div className="stat-sub">1世帯 {(latest.total / latest.households).toFixed(2)}人</div></div>
        <div className="stat"><div className="stat-label">自然増減（{LATEST_POP - 1}年）</div><div className="stat-value">{fmtSigned(latest.births - latest.deaths)}</div><div className="stat-sub">出生 {fmt(latest.births)}・死亡 {fmt(latest.deaths)}</div></div>
        <div className="stat"><div className="stat-label">社会増減（{LATEST_POP - 1}年）</div><div className="stat-value">{fmtSigned(latest.in - latest.out)}</div><div className="stat-sub">転入 {fmt(latest.in)}・転出 {fmt(latest.out)}</div></div>
      </div>
      <Tools family="population" slug={m.slug} label={`${m.name}の全年データ`} />
      <p>2013〜{LATEST_POP - 1}年の{s.length - 1}年間の累計では、自然増減{fmtSigned(cum.nat, '人')}、社会増減{fmtSigned(cum.soc, '人')}。人口減少の主因は{Math.abs(cum.nat) >= Math.abs(cum.soc) ? '自然減（死亡が出生を上回る）' : '社会減（転出が転入を上回る）'}です。</p>
      <LineChart title={`${m.name}の人口の推移（各年1月1日）`} series={[{ label: '人口', points: s.map(x => ({ x: x.year, y: x.total })) }]} unit="人" />
      <LineChart title={`${m.name}の出生・死亡・転入・転出（前年1年間）`} series={[{ label: '出生', points: s.map(x => ({ x: x.year, y: x.births })) }, { label: '死亡', points: s.map(x => ({ x: x.year, y: x.deaths })) }, { label: '転入', points: s.map(x => ({ x: x.year, y: x.in })) }, { label: '転出', points: s.map(x => ({ x: x.year, y: x.out })) }]} unit="人" zero />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年（1月1日）</th><th>人口</th><th>前年比</th><th>世帯数</th><th>出生</th><th>死亡</th><th>自然増減</th><th>転入</th><th>転出</th><th>社会増減</th></tr></thead>
          <tbody>{s.map((x, i) => <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.total)}</td><td className={i && x.total - s[i - 1].total < 0 ? 'neg' : 'pos'}>{i ? fmtSigned(x.total - s[i - 1].total) : '—'}</td><td>{fmt(x.households)}</td><td>{fmt(x.births)}</td><td>{fmt(x.deaths)}</td><td className={x.births - x.deaths < 0 ? 'neg' : 'pos'}>{fmtSigned(x.births - x.deaths)}</td><td>{fmt(x.in)}</td><td>{fmt(x.out)}</td><td className={x.in - x.out < 0 ? 'neg' : 'pos'}>{fmtSigned(x.in - x.out)}</td></tr>)}</tbody>
        </table>
      </div>
      <h2>県内の位置づけ（{LATEST_POP - 1}年 社会増減）</h2>
      <BarChart title="転入−転出（人）" items={bySocial} unit="人" highlight={m.name} />
      <p>他の市町村：{MUNIS.filter(x => x.code !== m.code).map((x, i) => <span key={x.code}>{i ? '・' : ''}<Link href={`/population/${x.slug}/`}>{x.name}</Link></span>)}</p>
      <p>関連：<Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link>・<Link href={`/dental/${m.slug}/`}>{m.name}の歯科診療所数</Link></p>
      <Cta muni={m.name} topic="人口" />
      <CiteBox title={title} path={`/population/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['population']} extra={['出生・死亡・転入・転出は各年の前年1月1日〜12月31日の1年間。転入・転出は国内・国外の合計。', ...(m.code === '03216' ? ['2013年は滝沢村（2014年1月に市制施行）の数値。'] : [])]} />
    </>
  );
}
