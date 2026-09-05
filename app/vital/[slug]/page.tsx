import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, vitalAt, vitalSeries, vitalPrefAt, popAt, naturalChange, socialChange, fmt, fmtSigned, pct, rank, VITAL_YEARS, LATEST_VITAL, FIRST_VITAL, FIRST_MIGR_YEAR } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const v = vitalAt(m.code, LATEST_VITAL)!;
  return {
    title: `${m.name}の出生数・死亡数・婚姻・離婚の推移（${FIRST_VITAL}〜${LATEST_VITAL}年）`,
    description: `${m.name}（岩手県）の出生数は${LATEST_VITAL}年に${fmt(v.births)}人、死亡数は${fmt(v.deaths)}人、自然増減は${fmtSigned(naturalChange(v))}人。婚姻・離婚件数、人口千人当たり、県内33市町村の順位を人口動態調査から集計。`,
    alternates: { canonical: `/vital/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = vitalSeries(m.code);
  const v = vitalAt(m.code, LATEST_VITAL)!, v0 = vitalAt(m.code, FIRST_VITAL)!, vp = vitalAt(m.code, LATEST_VITAL - 1)!;
  const pref = vitalPrefAt(LATEST_VITAL);
  const pop = popAt(m.code, LATEST_VITAL)?.total ?? null;
  const rows = MUNIS.map(mm => {
    const x = vitalAt(mm.code, LATEST_VITAL)!; const p = popAt(mm.code, LATEST_VITAL)?.total ?? null;
    return { m: mm, births: x.births, deaths: x.deaths, nat: naturalChange(x),
      birthK: p && x.births != null ? Math.round((x.births / p) * 1000 * 10) / 10 : null };
  });
  const rB = rank(rows, r => r.births), rBK = rank(rows, r => r.birthK);
  const me = rows.find(r => r.m.code === m.code)!;
  const nat = naturalChange(v), soc = socialChange(v);
  const cumNat = s.reduce((a, r) => a + (naturalChange(r) ?? 0), 0);
  const birthK = pop && v.births != null ? Math.round((v.births / pop) * 1000 * 10) / 10 : null;
  const title = `${m.name}の出生数・死亡数・婚姻・離婚の推移（${FIRST_VITAL}〜${LATEST_VITAL}年）`;
  const sentence = `${m.name}の出生数は${LATEST_VITAL}年に${fmt(v.births)}人、死亡数は${fmt(v.deaths)}人で、自然増減は${fmtSigned(nat)}人。岩手県内33市町村中${rB.get(me) ?? '—'}位（出生数）で、${FIRST_VITAL}年からの14年間の自然減の累計は${fmt(Math.abs(cumNat))}人。`;
  const merged = [...new Set(s.flatMap(r => r.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '出生・死亡・婚姻・離婚', href: '/vital/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/vital/${m.slug}/`}
        keywords={[m.name, '出生数', '死亡数', '自然増減', '婚姻件数', '離婚件数', '人口動態', '岩手県']} temporal={`${FIRST_VITAL}/${LATEST_VITAL}`} sourceKeys={['vital']} />
      <h1>{title}</h1>
      <MuniStrip family="vital" current={m.code} />
      <p className="key-fact">
        {m.name}の出生数は{LATEST_VITAL}年に<strong>{fmt(v.births)}人</strong>（前年比{fmtSigned(pct(v.births, vp.births), '%')}）、死亡数は<strong>{fmt(v.deaths)}人</strong>で、自然増減は<strong>{fmtSigned(nat)}人</strong>。
        岩手県内<strong>{rB.get(me) ?? '—'}位</strong>（県全体{fmt(pref.births)}人の{pref.births ? Math.round((v.births ?? 0) / pref.births * 1000) / 10 : '—'}%）。
        {FIRST_VITAL}年（{fmt(v0.births)}人）からの14年間の自然減の累計は{fmt(Math.abs(cumNat))}人。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">出生数（{LATEST_VITAL}年）</div><div className="stat-value">{fmt(v.births)}</div><div className="stat-sub">人・県内 {rB.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">死亡数（{LATEST_VITAL}年）</div><div className="stat-value">{fmt(v.deaths)}</div><div className="stat-sub">人・出生の{v.births ? Math.round((v.deaths ?? 0) / v.births * 10) / 10 : '—'}倍</div></div>
        <div className="stat"><div className="stat-label">自然増減</div><div className="stat-value">{fmtSigned(nat)}</div><div className="stat-sub">人・{FIRST_VITAL}年以降の累計 {fmtSigned(cumNat)}人</div></div>
        <div className="stat"><div className="stat-label">人口千人当たり出生</div><div className="stat-value">{fmt(birthK)}</div><div className="stat-sub">人・県内 {rBK.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">婚姻件数（{LATEST_VITAL}年）</div><div className="stat-value">{fmt(v.marriages)}</div><div className="stat-sub">件・離婚 {fmt(v.divorces)}件</div></div>
        {soc != null && <div className="stat"><div className="stat-label">社会増減（{LATEST_VITAL}年）</div><div className="stat-value">{fmtSigned(soc)}</div><div className="stat-sub">人・転入{fmt(v.in_migr)}／転出{fmt(v.out_migr)}</div></div>}
      </div>
      <Tools family="vital" slug={m.slug} label={`${m.name}の全年データ`} />
      <LineChart title={`${m.name}の出生数と死亡数（${FIRST_VITAL}〜${LATEST_VITAL}年、人）`} unit="人" zero
        series={[
          { label: '出生数', points: s.map(r => ({ x: r.year, y: r.births ?? 0 })) },
          { label: '死亡数', points: s.map(r => ({ x: r.year, y: r.deaths ?? 0 })) },
        ]} />
      <LineChart title={`${m.name}の婚姻件数と離婚件数（${FIRST_VITAL}〜${LATEST_VITAL}年、件）`} unit="件" zero
        series={[
          { label: '婚姻件数', points: s.map(r => ({ x: r.year, y: r.marriages ?? 0 })) },
          { label: '離婚件数', points: s.map(r => ({ x: r.year, y: r.divorces ?? 0 })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>出生数</th><th>死亡数</th><th>自然増減</th><th>婚姻件数</th><th>離婚件数</th><th>転入者数</th><th>転出者数</th><th>社会増減</th></tr></thead>
          <tbody>
            {s.map(r => { const n = naturalChange(r), sc = socialChange(r); return (
              <tr key={r.year}><td>{r.year}年</td><td>{fmt(r.births)}</td><td>{fmt(r.deaths)}</td>
                <td className={n != null && n < 0 ? 'neg' : n != null ? 'pos' : ''}>{fmtSigned(n)}</td>
                <td>{fmt(r.marriages)}</td><td>{fmt(r.divorces)}</td>
                <td>{fmt(r.in_migr)}</td><td>{fmt(r.out_migr)}</td>
                <td className={sc != null && sc < 0 ? 'neg' : sc != null ? 'pos' : ''}>{fmtSigned(sc)}</td></tr>); })}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯</Link></li>
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link></li>
        <li><Link href={`/household/${m.slug}/`}>{m.name}の世帯・高齢世帯</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <Cta muni={m.name} topic="出生数" />
      <CiteBox title={title} path={`/vital/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['vital']} extra={[
        '出生数・死亡数・婚姻件数・離婚件数は人口動態調査（各年1〜12月）。住民基本台帳の出生・死亡（/population/）とは定義も集計期間も異なるため、直接比較しない。',
        '2011年の沿岸市町村の死亡数には東日本大震災による死亡が含まれる。',
        `転入者数・転出者数は${FIRST_MIGR_YEAR}年以降のみ収録。県内の市町村間移動を含む。`,
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
