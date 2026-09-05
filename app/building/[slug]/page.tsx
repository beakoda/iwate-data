import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, buildAt, buildSeries, buildPrefAt, popAt, fmt, fmtSigned, pct, rank, BUILD_YEARS, LATEST_BUILD, FIRST_BUILD, LAST_COST_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const b = buildAt(m.code, LATEST_BUILD)!;
  return {
    title: `${m.name}の住宅着工・建築着工の推移（${FIRST_BUILD}〜${LATEST_BUILD}年）`,
    description: `${m.name}（岩手県）の居住専用住宅の着工は${LATEST_BUILD}年に${fmt(b.bldg_house)}棟・床面積${fmt(b.floor_house)}m²。建築物全体の着工棟数、1棟当たり床面積、人口千人当たり着工、県内33市町村の順位を建築着工統計から集計。`,
    alternates: { canonical: `/building/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = buildSeries(m.code);
  const b = buildAt(m.code, LATEST_BUILD)!, b0 = buildAt(m.code, FIRST_BUILD)!, bp = buildAt(m.code, LATEST_BUILD - 1)!;
  const pref = buildPrefAt(LATEST_BUILD);
  const pop = popAt(m.code, LATEST_BUILD)?.total ?? null;
  const rows = MUNIS.map(mm => {
    const x = buildAt(mm.code, LATEST_BUILD)!; const p = popAt(mm.code, LATEST_BUILD)?.total ?? null;
    return { m: mm, house: x.bldg_house, all: x.bldg_all, floor: x.floor_house, perK: p ? Math.round((x.bldg_house / p) * 1000 * 100) / 100 : null };
  });
  const rH = rank(rows, r => r.house), rK = rank(rows, r => r.perK);
  const me = rows.find(r => r.m.code === m.code)!;
  const total14 = s.reduce((a, r) => a + r.bldg_house, 0);
  const peak = s.reduce((a, r) => (r.bldg_house > a.bldg_house ? r : a));
  const perHouse = b.bldg_house ? Math.round(b.floor_house / b.bldg_house * 10) / 10 : null;
  const title = `${m.name}の住宅着工・建築着工の推移（${FIRST_BUILD}〜${LATEST_BUILD}年）`;
  const sentence = `${m.name}の居住専用住宅の着工は${LATEST_BUILD}年に${fmt(b.bldg_house)}棟（床面積${fmt(b.floor_house)}m²、1棟当たり${fmt(perHouse)}m²）。岩手県内33市町村中${rH.get(me) ?? '—'}位で、${FIRST_BUILD}年（${fmt(b0.bldg_house)}棟）からの14年間の累計は${fmt(total14)}棟。`;
  const costYears = s.filter(r => r.cost_house != null && r.cost_house > 0);
  const merged = [...new Set(s.flatMap(r => r.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '住宅着工・建築着工', href: '/building/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/building/${m.slug}/`}
        keywords={[m.name, '住宅着工', '建築着工', '着工棟数', '床面積', '工務店', '岩手県']} temporal={`${FIRST_BUILD}/${LATEST_BUILD}`} sourceKeys={['building']} />
      <h1>{title}</h1>
      <MuniStrip family="building" current={m.code} />
      <p className="key-fact">
        {m.name}の居住専用住宅の着工は{LATEST_BUILD}年に<strong>{fmt(b.bldg_house)}棟</strong>（床面積{fmt(b.floor_house)}m²）。
        前年比{fmtSigned(pct(b.bldg_house, bp.bldg_house), '%')}、岩手県内<strong>{rH.get(me) ?? '—'}位</strong>（県全体{fmt(pref.bldg_house)}棟の{Math.round(b.bldg_house / pref.bldg_house * 1000) / 10}%）。
        ピークは{peak.year}年の{fmt(peak.bldg_house)}棟。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">居住専用住宅の着工（{LATEST_BUILD}年）</div><div className="stat-value">{fmt(b.bldg_house)}</div><div className="stat-sub">棟・前年比 {fmtSigned(pct(b.bldg_house, bp.bldg_house), '%')}</div></div>
        <div className="stat"><div className="stat-label">住宅の着工床面積</div><div className="stat-value">{fmt(b.floor_house)}</div><div className="stat-sub">m²・1棟当たり {fmt(perHouse)}m²</div></div>
        <div className="stat"><div className="stat-label">建築物すべての着工</div><div className="stat-value">{fmt(b.bldg_all)}</div><div className="stat-sub">棟・床面積 {fmt(b.floor_all)}m²</div></div>
        <div className="stat"><div className="stat-label">人口千人当たり着工</div><div className="stat-value">{fmt(me.perK)}</div><div className="stat-sub">棟・県内{rK.get(me) ?? '—'}位（住宅）</div></div>
        <div className="stat"><div className="stat-label">{FIRST_BUILD}〜{LATEST_BUILD}年の累計</div><div className="stat-value">{fmt(total14)}</div><div className="stat-sub">棟（居住専用住宅）</div></div>
        <div className="stat"><div className="stat-label">居住産業併用建築物（{LATEST_BUILD}年）</div><div className="stat-value">{fmt(b.bldg_mixed)}</div><div className="stat-sub">棟・店舗兼住宅など</div></div>
      </div>
      <Tools family="building" slug={m.slug} label={`${m.name}の全年データ`} />

      <LineChart title={`${m.name}の居住専用住宅 着工棟数（${FIRST_BUILD}〜${LATEST_BUILD}年）`} unit="棟" zero
        series={[{ label: m.name, points: s.map(r => ({ x: r.year, y: r.bldg_house })) }]} />
      <LineChart title={`${m.name}の着工床面積（居住専用住宅、m²）`} zero
        series={[{ label: '床面積', points: s.map(r => ({ x: r.year, y: r.floor_house })) }]} />

      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>住宅 着工棟数</th><th>前年比</th><th>住宅 床面積(m²)</th><th>1棟当たり(m²)</th><th>建築物すべて 棟数</th><th>すべて 床面積(m²)</th><th>住宅の工事費予定額(万円)</th></tr></thead>
          <tbody>
            {s.map((r, i) => { const d = i ? pct(r.bldg_house, s[i - 1].bldg_house) : null; return (
              <tr key={r.year}><td>{r.year}年</td><td>{fmt(r.bldg_house)}</td>
                <td className={d != null && d < 0 ? 'neg' : d != null ? 'pos' : ''}>{fmtSigned(d, '%')}</td>
                <td>{fmt(r.floor_house)}</td><td>{r.bldg_house ? fmt(Math.round(r.floor_house / r.bldg_house * 10) / 10) : '—'}</td>
                <td>{fmt(r.bldg_all)}</td><td>{fmt(r.floor_all)}</td>
                <td>{r.year > LAST_COST_YEAR ? '公表なし' : fmt(r.cost_house)}</td></tr>); })}
          </tbody>
        </table>
      </div>
      {costYears.length > 0 && (
        <p>工事費予定額から見た1棟当たりの単価は、{costYears[costYears.length - 1].year}年で
          <strong>{fmt(Math.round((costYears[costYears.length - 1].cost_house! / costYears[costYears.length - 1].bldg_house) * 10) / 10)}万円</strong>
          （居住専用住宅、着工時の予定額）。{LAST_COST_YEAR}年までの数値で、{LAST_COST_YEAR + 1}年以降は市区町村別の工事費が公表されていない。</p>
      )}

      <h2>県内の位置（{LATEST_BUILD}年）</h2>
      <BarChart title="居住専用住宅の着工棟数（市町村別、棟）" items={[...rows].sort((a, b2) => b2.house - a.house).map(r => ({ label: r.m.name, value: r.house }))} unit="棟" highlight={m.name} />
      <BarChart title="人口千人当たりの住宅着工棟数（市町村別）" items={[...rows].filter(r => r.perK != null).sort((a, b2) => b2.perK! - a.perK!).map(r => ({ label: r.m.name, value: r.perK }))} highlight={m.name} />
      <p>他の市町村：{MUNIS.filter(x => x.code !== m.code).map((x, k) => <span key={x.code}>{k ? '・' : ''}<Link href={`/building/${x.slug}/`}>{x.name}</Link></span>)}</p>
      <p>関連：<Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link>・<Link href={`/industry/construction/${m.slug}/`}>{m.name}の建設業（事業所・従業者）</Link>・<Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯の推移</Link></p>
      <Cta muni={m.name} topic="住宅着工" />
      <CiteBox title={title} path={`/building/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['building']} extra={[
        '「居住専用住宅」は用途大分類Ａ。店舗兼住宅などは「居住産業併用建築物」（用途大分類Ｃ）として別に集計される。',
        '棟数は建築物の数であり、共同住宅の戸数（新設住宅着工戸数）とは異なる。',
        '人口千人当たりは同年1月1日の住民基本台帳人口で算出。',
        `工事費予定額は${LAST_COST_YEAR}年までの統計表にのみ収録。着工時点の予定額で、実際の工事費とは異なる。`,
        ...(merged.length ? ['合併前の旧自治体（滝沢村・藤沢町）の数値は現行の市町村に合算。'] : []),
      ]} />
    </>
  );
}
