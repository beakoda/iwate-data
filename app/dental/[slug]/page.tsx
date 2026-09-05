import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, muniBySlug, dentalSeries, dentalAt, per100k, fmt, fmtSigned, pct, rank, LATEST_DENTAL, popAt } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const d = dentalAt(m.code, LATEST_DENTAL)!; const d0 = dentalAt(m.code, 2009)!;
  const title = `${m.name}の歯科診療所数の推移（2009〜${LATEST_DENTAL}年）`;
  return { title, description: `${m.name}（岩手県）の歯科診療所数は${LATEST_DENTAL}年に${d.dent}施設（2009年${d0.dent}施設）。一般診療所数、人口10万人当たり施設数、県内33市町村中の順位を厚労省「医療施設調査」から集計。`, alternates: { canonical: `/dental/${m.slug}/` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = dentalSeries(m.code); const latest = s[s.length - 1], first = s[0], prev = s[s.length - 2];
  const peak = s.reduce((a, b) => (b.dent > a.dent ? b : a));
  const rows = MUNIS.map(mm => ({ m: mm, d: dentalAt(mm.code, LATEST_DENTAL)!, per: per100k(dentalAt(mm.code, LATEST_DENTAL)!.dent, mm.code, LATEST_DENTAL) }));
  const rCount = rank(rows, r => r.d.dent), rPer = rank(rows, r => r.per);
  const me = rows.find(r => r.m.code === m.code)!;
  const prefPer = per100k(dentalAt(PREF.code, LATEST_DENTAL)!.dent, PREF.code, LATEST_DENTAL);
  const share = Math.round(latest.dent / dentalAt(PREF.code, LATEST_DENTAL)!.dent * 1000) / 10;
  const title = `${m.name}の歯科診療所数の推移（2009〜${LATEST_DENTAL}年）`;
  const perSeries = s.map(r => ({ x: r.year, y: per100k(r.dent, m.code, r.year) })).filter(p => p.y != null);
  const prefPerSeries = s.map(r => ({ x: r.year, y: per100k(dentalAt(PREF.code, r.year)!.dent, PREF.code, r.year) })).filter(p => p.y != null);
  const merged = [...new Set(s.flatMap(r => r.merged))];
  const sentence = `${m.name}の歯科診療所数は${LATEST_DENTAL}年時点で${fmt(latest.dent)}施設。2009年（${fmt(first.dent)}施設）比${fmtSigned(latest.dent - first.dent)}施設で、人口10万人当たりでは${fmt(me.per)}施設（岩手県平均${fmt(prefPer)}、県内${rPer.get(me) ?? '—'}位）。`;
  const neighbors = [...rows].sort((a, b) => b.d.dent - a.d.dent);
  return (
    <>
      <Breadcrumb items={[{ name: '歯科診療所', href: '/dental/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/dental/${m.slug}/`} keywords={[m.name, '歯科診療所数', '推移', '歯科医院', '一般診療所数', '岩手県']} temporal={`2009/${LATEST_DENTAL}`} sourceKeys={['dental', 'population']} />
      <h1>{title}</h1>
      <MuniStrip family="dental" current={m.code} />
      <p className="key-fact"><strong>{m.name}の歯科診療所は{fmt(latest.dent)}施設</strong>（{LATEST_DENTAL}年10月1日）。岩手県内33市町村中<strong>{rCount.get(me)}位</strong>、県全体の{share}%。人口10万人当たり{fmt(me.per)}施設（県平均{fmt(prefPer)}）で<strong>{rPer.get(me) ?? '—'}位</strong>。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">歯科診療所数（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(latest.dent)}</div><div className="stat-sub">前年比 {fmtSigned(latest.dent - prev.dent)} ／ 2009年比 {fmtSigned(latest.dent - first.dent)}</div></div>
        <div className="stat"><div className="stat-label">人口10万人当たり</div><div className="stat-value">{fmt(me.per)}</div><div className="stat-sub">県平均 {fmt(prefPer)}・県内{rPer.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">一般診療所数（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(latest.gen)}</div><div className="stat-sub">うち有床 {fmt(latest.gen_with_beds)}・病床 {fmt(latest.gen_beds)}床</div></div>
        <div className="stat"><div className="stat-label">ピーク</div><div className="stat-value">{peak.year}年</div><div className="stat-sub">{fmt(peak.dent)}施設 → 現在 {fmtSigned(latest.dent - peak.dent)}</div></div>
      </div>
      <Tools family="dental" slug={m.slug} label={`${m.name}の全年データ`} />
      <LineChart title={`${m.name}の歯科診療所数・一般診療所数（2009〜${LATEST_DENTAL}年）`} series={[{ label: '歯科診療所', points: s.map(r => ({ x: r.year, y: r.dent })) }, { label: '一般診療所', points: s.map(r => ({ x: r.year, y: r.gen })) }]} unit="施設" zero />
      <LineChart title={`人口10万人当たり歯科診療所数：${m.name}と岩手県（2012〜${LATEST_DENTAL}年）`} series={[{ label: m.name, points: perSeries }, { label: '岩手県', points: prefPerSeries, color: '#949494' }]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年（10月1日）</th><th>歯科診療所</th><th>前年比</th><th>一般診療所</th><th>うち有床</th><th>人口（翌年1月1日）</th><th>歯科 人口10万対</th><th>県 人口10万対</th></tr></thead>
          <tbody>{s.map((r, i) => { const diff = i ? r.dent - s[i - 1].dent : null; const p = popAt(m.code, r.year + 1); return (
            <tr key={r.year}><td>{r.year}年</td><td>{fmt(r.dent)}</td><td className={diff != null && diff < 0 ? 'neg' : diff != null && diff > 0 ? 'pos' : ''}>{diff == null ? '—' : fmtSigned(diff)}</td><td>{fmt(r.gen)}</td><td>{fmt(r.gen_with_beds)}</td><td>{fmt(p?.total)}</td><td>{fmt(per100k(r.dent, m.code, r.year))}</td><td>{fmt(per100k(dentalAt(PREF.code, r.year)!.dent, PREF.code, r.year))}</td></tr>); })}</tbody>
        </table>
      </div>
      <h2>県内の位置づけ（{LATEST_DENTAL}年）</h2>
      <BarChart title="歯科診療所数の市町村別比較（施設）" items={neighbors.map(r => ({ label: r.m.name, value: r.d.dent }))} unit="施設" highlight={m.name} />
      <p>他の市町村：{MUNIS.filter(x => x.code !== m.code).map((x, i) => <span key={x.code}>{i ? '・' : ''}<Link href={`/dental/${x.slug}/`}>{x.name}</Link></span>)}</p>
      <p>関連：<Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link>・<Link href={`/population/${m.slug}/`}>{m.name}の人口動態</Link>・<Link href="/industry/medical/">医療，福祉の事業所数ランキング</Link></p>
      <Cta muni={m.name} topic="歯科診療所数" />
      <CiteBox title={title} path={`/dental/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['dental', 'population']} extra={[`人口10万人当たりは、各年10月1日の施設数を翌年1月1日の住民基本台帳人口で除して算出（住基人口は2013年以降のため、10万対は2012年以降）。`, ...(merged.length ? [`${merged.join('・')}（合併・市制施行前）の数値は${m.name}に合算。`] : [])]} />
    </>
  );
}
