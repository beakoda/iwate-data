import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, welAt, welSeries, welPrefAt, capPerElderly, censusAt, popAt, fmt, fmtSigned, pct, rank, WEL_YEARS, LATEST_WEL, FIRST_WEL, WEL_SWITCH_YEAR, LATEST_CENSUS } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = welAt(m.code, LATEST_WEL)!;
  return {
    title: `${m.name}の特別養護老人ホーム・有料老人ホームの定員（${FIRST_WEL}〜${LATEST_WEL}年）`,
    description: `${m.name}（岩手県）の介護老人福祉施設（特別養護老人ホーム）は${LATEST_WEL}年に${fmt(r.tokuyo)}施設・定員${fmt(r.tokuyo_cap)}人、有料老人ホームは${fmt(r.yuryo)}施設・定員${fmt(r.yuryo_cap)}人。高齢者千人当たりと県内33市町村の順位を社会福祉施設等調査から集計。`,
    alternates: { canonical: `/welfare/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = welSeries(m.code);
  const r = welAt(m.code, LATEST_WEL)!, r0 = welAt(m.code, FIRST_WEL)!;
  const pref = welPrefAt(LATEST_WEL);
  const cen = censusAt(m.code, LATEST_CENSUS);
  const rows = MUNIS.map(mm => {
    const x = welAt(mm.code, LATEST_WEL)!;
    return { m: mm, cap: x.tokuyo_cap, yc: x.yuryo_cap, capE: capPerElderly(x.tokuyo_cap, mm.code, LATEST_CENSUS), kokuho: x.kokuho };
  });
  const rC = rank(rows, x => x.cap), rE = rank(rows, x => x.capE), rY = rank(rows, x => x.yc);
  const me = rows.find(x => x.m.code === m.code)!;
  const capE = capPerElderly(r.tokuyo_cap, m.code, LATEST_CENSUS);
  const prefE = pref.tokuyo_cap != null ? Math.round((pref.tokuyo_cap / MUNIS.reduce((a, x) => a + (censusAt(x.code, LATEST_CENSUS)?.age_65_ ?? 0), 0)) * 1000 * 10) / 10 : null;
  const title = `${m.name}の特別養護老人ホーム・有料老人ホームの定員（${FIRST_WEL}〜${LATEST_WEL}年）`;
  const sentence = `${m.name}の介護老人福祉施設（特別養護老人ホーム）は${LATEST_WEL}年に${fmt(r.tokuyo)}施設・定員${fmt(r.tokuyo_cap)}人で、65歳以上人口千人当たり${fmt(capE)}人（岩手県内33市町村中${rE.get(me) ?? '—'}位、県平均${fmt(prefE)}人）。有料老人ホームは${fmt(r.yuryo)}施設・定員${fmt(r.yuryo_cap)}人。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '介護施設・国保', href: '/welfare/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/welfare/${m.slug}/`}
        keywords={[m.name, '特別養護老人ホーム', '介護老人福祉施設', '有料老人ホーム', '定員', '国民健康保険', '岩手県']} temporal={`${FIRST_WEL}/${LATEST_WEL}`} sourceKeys={['welfare']} />
      <h1>{title}</h1>
      <MuniStrip family="welfare" current={m.code} />
      <p className="key-fact">
        {m.name}の介護老人福祉施設（特別養護老人ホーム）は{LATEST_WEL}年に<strong>{fmt(r.tokuyo)}施設・定員{fmt(r.tokuyo_cap)}人</strong>（{FIRST_WEL}年比{fmtSigned(pct(r.tokuyo_cap, r0.tokuyo_cap), '%')}）。
        65歳以上人口千人当たり<strong>{fmt(capE)}人</strong>で岩手県内<strong>{rE.get(me) ?? '—'}位</strong>（県平均{fmt(prefE)}人）。
        有料老人ホームは{fmt(r.yuryo)}施設・定員{fmt(r.yuryo_cap)}人。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">特別養護老人ホーム（{LATEST_WEL}年）</div><div className="stat-value">{fmt(r.tokuyo)}</div><div className="stat-sub">施設・定員 {fmt(r.tokuyo_cap)}人・県内 {rC.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">高齢者千人当たり特養定員</div><div className="stat-value">{fmt(capE)}</div><div className="stat-sub">人・県内 {rE.get(me) ?? '—'}位（県平均 {fmt(prefE)}）</div></div>
        <div className="stat"><div className="stat-label">有料老人ホーム（{LATEST_WEL}年）</div><div className="stat-value">{fmt(r.yuryo)}</div><div className="stat-sub">施設・定員 {fmt(r.yuryo_cap)}人・県内 {rY.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">老人ホーム定員の合計</div><div className="stat-value">{fmt((r.tokuyo_cap ?? 0) + (r.yuryo_cap ?? 0))}</div><div className="stat-sub">人（特養＋有料）</div></div>
        <div className="stat"><div className="stat-label">国民健康保険被保険者（{LATEST_WEL}年度末）</div><div className="stat-value">{fmt(r.kokuho)}</div><div className="stat-sub">人・{FIRST_WEL}年比 {fmtSigned(pct(r.kokuho, r0.kokuho), '%')}</div></div>
        {cen && <div className="stat"><div className="stat-label">65歳以上人口（{LATEST_CENSUS}年国勢調査）</div><div className="stat-value">{fmt(cen.age_65_)}</div><div className="stat-sub">人 → <Link href={`/aging/${m.slug}/`}>高齢化率を見る</Link></div></div>}
      </div>
      <Tools family="welfare" slug={m.slug} label={`${m.name}の全年データ`} />
      <LineChart title={`${m.name}の老人ホーム定員（${FIRST_WEL}〜${LATEST_WEL}年、人）`} unit="人" zero
        series={[
          { label: '特別養護老人ホーム', points: s.map(x => ({ x: x.year, y: x.tokuyo_cap ?? 0 })) },
          { label: '有料老人ホーム', points: s.map(x => ({ x: x.year, y: x.yuryo_cap ?? 0 })) },
        ]} />
      <LineChart title={`${m.name}の国民健康保険被保険者数（${FIRST_WEL}〜${LATEST_WEL}年、人）`} unit="人" zero
        series={[{ label: '国保被保険者', points: s.filter(x => x.kokuho != null).map(x => ({ x: x.year, y: x.kokuho as number })) }]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>特養 施設数</th><th>特養 定員</th><th>有料老人ホーム 施設数</th><th>有料 定員</th><th>国保被保険者</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年{x.year === WEL_SWITCH_YEAR ? '〜' : ''}</td><td>{fmt(x.tokuyo)}</td><td>{fmt(x.tokuyo_cap)}</td>
                <td>{fmt(x.yuryo)}</td><td>{fmt(x.yuryo_cap)}</td><td>{fmt(x.kokuho)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link></li>
        <li><Link href={`/household/${m.slug}/`}>{m.name}の高齢者単身世帯</Link></li>
        <li><Link href={`/medical/${m.slug}/`}>{m.name}の病院・医師</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <Cta muni={m.name} topic="介護施設" />
      <CiteBox title={title} path={`/welfare/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['welfare']} extra={[
        `施設数・定員は${WEL_SWITCH_YEAR - 1}年までが詳細票、${WEL_SWITCH_YEAR}年以降が基本票。${WEL_SWITCH_YEAR}年の前後をまたぐ変化には票の切替分が含まれる。`,
        '「介護老人福祉施設」は特別養護老人ホームのこと。介護老人保健施設（老健）は含まれない。',
        `高齢者千人当たりは、${LATEST_WEL}年の定員を${LATEST_CENSUS}年国勢調査の65歳以上人口で割った本サイトの計算値。時点が異なる点に注意。`,
        '国民健康保険被保険者数は各年度末。後期高齢者医療制度（75歳以上）の対象者は含まれない。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
