import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, PREF, muniBySlug, censusAt, agingRate, youthRate, workingRate, fmt, fmtSigned, pct, rank, LATEST_CENSUS, PREV_CENSUS, FIRST_CENSUS, CENSUS_YEARS } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const c = censusAt(m.code, LATEST_CENSUS)!;
  return {
    title: `${m.name}の高齢化率・年齢構成（${LATEST_CENSUS}年国勢調査）`,
    description: `${m.name}（岩手県）の高齢化率は${fmt(agingRate(c))}%（${LATEST_CENSUS}年国勢調査）。65歳以上${fmt(c.age_65_)}人、15歳未満${fmt(c.age_0_14)}人、平均年齢${fmt(c.avg_age && Math.round(c.avg_age * 10) / 10)}歳。${PREV_CENSUS}年からの変化と県内33市町村の順位。`,
    alternates: { canonical: `/aging/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const c = censusAt(m.code, LATEST_CENSUS)!, c0 = censusAt(m.code, PREV_CENSUS)!;
  const p = censusAt(PREF.code, LATEST_CENSUS)!;
  const rows = MUNIS.map(mm => {
    const x = censusAt(mm.code, LATEST_CENSUS)!, x0 = censusAt(mm.code, PREV_CENSUS)!;
    return { m: mm, aging: agingRate(x), youth: youthRate(x), work: workingRate(x), avg: x.avg_age, med: x.median_age, dens: x.density, total: x.total, prevAging: agingRate(x0) };
  });
  const rA = rank(rows, r => r.aging), rY = rank(rows, r => r.youth), rD = rank(rows, r => r.dens);
  const me = rows.find(r => r.m.code === m.code)!;
  const prefAging = agingRate(p);
  const title = `${m.name}の高齢化率・年齢構成（${LATEST_CENSUS}年国勢調査）`;
  const diff = me.aging != null && me.prevAging != null ? Math.round((me.aging - me.prevAging) * 10) / 10 : null;
  const sentence = `${m.name}の高齢化率は${LATEST_CENSUS}年国勢調査で${fmt(me.aging)}%（65歳以上${fmt(c.age_65_)}人）。岩手県平均${fmt(prefAging)}%、県内33市町村中${rA.get(me) ?? '—'}位で、${PREV_CENSUS}年（${fmt(me.prevAging)}%）から${fmtSigned(diff)}ポイント。`;
  const byAging = [...rows].sort((a, b) => (b.aging ?? -1) - (a.aging ?? -1));
  const cF = censusAt(m.code, FIRST_CENSUS)!;
  const ages = [
    { label: '15歳未満', first: cF.age_0_14, prev: c0.age_0_14, now: c.age_0_14 },
    { label: '15〜64歳', first: cF.age_15_64, prev: c0.age_15_64, now: c.age_15_64 },
    { label: '65歳以上', first: cF.age_65_, prev: c0.age_65_, now: c.age_65_ },
  ];
  return (
    <>
      <Breadcrumb items={[{ name: '高齢化率・年齢構成', href: '/aging/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/aging/${m.slug}/`}
        keywords={[m.name, '高齢化率', '年齢構成', '人口ピラミッド', '国勢調査', '岩手県']} temporal={`${FIRST_CENSUS}/${LATEST_CENSUS}`} sourceKeys={['census']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の高齢化率は<strong>{fmt(me.aging)}%</strong>（{LATEST_CENSUS}年10月1日）。岩手県平均{fmt(prefAging)}%、県内33市町村中<strong>{rA.get(me) ?? '—'}位</strong>。
        {PREV_CENSUS}年の{fmt(me.prevAging)}%から<strong>{fmtSigned(diff)}ポイント</strong>。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">高齢化率（65歳以上）</div><div className="stat-value">{fmt(me.aging)}%</div><div className="stat-sub">県平均 {fmt(prefAging)}%・県内{rA.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">年少人口割合（15歳未満）</div><div className="stat-value">{fmt(me.youth)}%</div><div className="stat-sub">県内{rY.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">生産年齢人口割合</div><div className="stat-value">{fmt(me.work)}%</div><div className="stat-sub">15〜64歳 {fmt(c.age_15_64)}人</div></div>
        <div className="stat"><div className="stat-label">平均年齢</div><div className="stat-value">{fmt(c.avg_age != null ? Math.round(c.avg_age * 10) / 10 : null)}歳</div><div className="stat-sub">年齢中位数 {fmt(c.median_age != null ? Math.round(c.median_age * 10) / 10 : null)}歳</div></div>
        <div className="stat"><div className="stat-label">人口密度</div><div className="stat-value">{fmt(c.density)}</div><div className="stat-sub">人/km²・面積 {fmt(c.area_km2)}km²・県内{rD.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">国勢調査人口</div><div className="stat-value">{fmt(c.total)}</div><div className="stat-sub">{PREV_CENSUS}年比 {fmtSigned(pct(c.total, c0.total), '%')}</div></div>
      </div>

      <h2>年齢3区分別人口（{FIRST_CENSUS}年 → {LATEST_CENSUS}年）</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>区分</th><th>{FIRST_CENSUS}年</th><th>{PREV_CENSUS}年</th><th>{LATEST_CENSUS}年</th><th>{PREV_CENSUS}年からの増減</th><th>{FIRST_CENSUS}年からの増減率</th><th>{LATEST_CENSUS}年の構成比</th></tr></thead>
          <tbody>
            {ages.map(a => { const d = a.now - a.prev; const denom = c.age_0_14 + c.age_15_64 + c.age_65_; return (
              <tr key={a.label}><td>{a.label}</td><td>{fmt(a.first)}</td><td>{fmt(a.prev)}</td><td>{fmt(a.now)}</td>
                <td className={d < 0 ? 'neg' : d > 0 ? 'pos' : ''}>{fmtSigned(d)}</td>
                <td className={pct(a.now, a.first)! < 0 ? 'neg' : 'pos'}>{fmtSigned(pct(a.now, a.first), '%')}</td>
                <td>{(a.now / denom * 100).toFixed(1)}%</td></tr>); })}
            <tr className="hl"><td>総人口（年齢不詳を含む）</td><td>{fmt(cF.total)}</td><td>{fmt(c0.total)}</td><td>{fmt(c.total)}</td><td>{fmtSigned(c.total - c0.total)}</td><td>{fmtSigned(pct(c.total, cF.total), '%')}</td><td>100%</td></tr>
          </tbody>
        </table>
      </div>

      <LineChart title={`${m.name}と岩手県の高齢化率（${FIRST_CENSUS}〜${LATEST_CENSUS}年、国勢調査）`} unit="%"
        series={[
          { label: m.name, points: CENSUS_YEARS.map(y => ({ x: y, y: agingRate(censusAt(m.code, y)) })) },
          { label: '岩手県', points: CENSUS_YEARS.map(y => ({ x: y, y: agingRate(censusAt(PREF.code, y)) })), color: '#949494' },
        ]} />
      <LineChart title={`${m.name}の国勢調査人口（${FIRST_CENSUS}〜${LATEST_CENSUS}年、人）`} zero
        series={[{ label: m.name, points: CENSUS_YEARS.map(y => ({ x: y, y: censusAt(m.code, y)!.total })) }]} />

      <h2>県内33市町村の高齢化率（{LATEST_CENSUS}年）</h2>
      <BarChart title="高齢化率の市町村別比較（％）" items={byAging.map(r => ({ label: r.m.name, value: r.aging }))} unit="%" highlight={m.name} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>高齢化率</th><th>順位</th><th>{PREV_CENSUS}年</th><th>変化</th><th>年少人口割合</th><th>平均年齢</th><th>人口</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県</td><td>{fmt(prefAging)}%</td><td>—</td><td>{fmt(agingRate(censusAt(PREF.code, PREV_CENSUS)))}%</td><td>—</td><td>{fmt(youthRate(p))}%</td><td>{fmt(p.avg_age != null ? Math.round(p.avg_age * 10) / 10 : null)}歳</td><td>{fmt(p.total)}</td></tr>
            {byAging.map(r => { const dd = r.aging != null && r.prevAging != null ? Math.round((r.aging - r.prevAging) * 10) / 10 : null; return (
              <tr key={r.m.code} className={r.m.code === m.code ? 'hl' : ''}>
                <td><Link href={`/aging/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.aging)}%</td><td>{rA.get(r) ?? '—'}位</td><td>{fmt(r.prevAging)}%</td>
                <td className={dd != null && dd > 0 ? 'neg' : dd != null ? 'pos' : ''}>{fmtSigned(dd)}pt</td>
                <td>{fmt(r.youth)}%</td><td>{fmt(r.avg != null ? Math.round(r.avg * 10) / 10 : null)}歳</td><td>{fmt(r.total)}</td>
              </tr>); })}
          </tbody>
        </table>
      </div>

      <p>関連：<Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link>・<Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯の推移（住民基本台帳）</Link>・<Link href={`/work/${m.slug}/`}>{m.name}の就業者・昼夜間人口</Link></p>
      <CiteBox title={title} path={`/aging/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['census']} extra={[
        '高齢化率・年少人口割合・生産年齢人口割合は、年齢3区分（15歳未満／15〜64歳／65歳以上）の合計を分母として算出。総人口には年齢「不詳」が含まれるため、総人口を分母にした値とは一致しない。',
        `${LATEST_CENSUS}年の年齢別人口は「令和2年国勢調査に関する不詳補完結果」の数値。`,
        `${FIRST_CENSUS}年は市町村合併前の旧自治体を現行の市町村に合算している（藤沢町→一関市、滝沢村→滝沢市）。2005年以前は合併前の自治体が多く対応表が必要なため未収録。`,
      ]} />
    </>
  );
}
