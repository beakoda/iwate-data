import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, crimeAt, crimeSeries, crimePrefAt, crimePerKpop, crimePrefPerKpop, popAt, fmt, fmtSigned, pct, rank, CRIME_YEARS, CRIME_TYPES, LATEST_CRIME, FIRST_CRIME, CRIME_FULL_FROM, LATEST_POP } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = crimeAt(m.code, LATEST_CRIME)!;
  return {
    title: `${m.name}の街頭犯罪発生件数（${CRIME_FULL_FROM}〜${LATEST_CRIME}年）`,
    description: `${m.name}（岩手県）の街頭犯罪7手口は${LATEST_CRIME}年に${fmt(r.total)}件（自転車盗${fmt(r['自転車盗'])}件・車上ねらい${fmt(r['車上ねらい'])}件）。人口千人当たりと県内33市町村の順位を、岩手県警のオープンデータから集計。`,
    alternates: { canonical: `/crime/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = crimeSeries(m.code);
  const r = crimeAt(m.code, LATEST_CRIME)!, r0 = crimeAt(m.code, CRIME_FULL_FROM)!;
  const pref = crimePrefAt(LATEST_CRIME);
  const pop = popAt(m.code, Math.min(LATEST_CRIME + 1, LATEST_POP));
  const rows = MUNIS.map(mm => {
    const x = crimeAt(mm.code, LATEST_CRIME)!;
    return { m: mm, total: x.total, per: crimePerKpop(x.total, mm.code, LATEST_CRIME), bike: x['自転車盗'], car: x['車上ねらい'] };
  });
  const rT = rank(rows, x => x.total), rP = rank(rows, x => x.per);
  const me = rows.find(x => x.m.code === m.code)!;
  const per = crimePerKpop(r.total, m.code, LATEST_CRIME);
  const prefPer = crimePrefPerKpop(LATEST_CRIME);
  const top = [...CRIME_TYPES].sort((a, b) => (r[b] ?? 0) - (r[a] ?? 0))[0];
  const title = `${m.name}の街頭犯罪発生件数（${CRIME_FULL_FROM}〜${LATEST_CRIME}年）`;
  const sentence = `${m.name}の街頭犯罪7手口は${LATEST_CRIME}年に${fmt(r.total)}件で、人口千人当たり${fmt(per)}件（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPer)}件）。最も多い手口は${top}の${fmt(r[top])}件。`;
  return (
    <>
      <Breadcrumb items={[{ name: '街頭犯罪', href: '/crime/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/crime/${m.slug}/`}
        keywords={[m.name, '犯罪', '自転車盗', '車上ねらい', '治安', '岩手県', '岩手県警']} temporal={`${CRIME_FULL_FROM}/${LATEST_CRIME}`} sourceKeys={['crime']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の街頭犯罪7手口は{LATEST_CRIME}年に<strong>{fmt(r.total)}件</strong>（{CRIME_FULL_FROM}年比{fmtSigned(pct(r.total, r0.total), '%')}）。
        人口千人当たり<strong>{fmt(per)}件</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}件）。
        最も多い手口は<strong>{top}の{fmt(r[top])}件</strong>。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">発生件数（{LATEST_CRIME}年・7手口計）</div><div className="stat-value">{fmt(r.total)}</div><div className="stat-sub">件・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口千人当たり</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">件・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPer)}）</div></div>
        <div className="stat"><div className="stat-label">自転車盗（{LATEST_CRIME}年）</div><div className="stat-value">{fmt(r['自転車盗'])}</div><div className="stat-sub">件・全体の {r.total ? Math.round((r['自転車盗'] / r.total) * 1000) / 10 : 0}%</div></div>
        <div className="stat"><div className="stat-label">車上ねらい（{LATEST_CRIME}年）</div><div className="stat-value">{fmt(r['車上ねらい'])}</div><div className="stat-sub">件・部品ねらい {fmt(r['部品ねらい'])}件</div></div>
        {pop && <div className="stat"><div className="stat-label">人口（{Math.min(LATEST_CRIME + 1, LATEST_POP)}年1月1日）</div><div className="stat-value">{fmt(pop.total)}</div><div className="stat-sub">人 → <Link href={`/population/${m.slug}/`}>人口の推移を見る</Link></div></div>}
      </div>
      <LineChart title={`${m.name}の街頭犯罪発生件数（${CRIME_FULL_FROM}〜${LATEST_CRIME}年、件）`} unit="件" zero
        series={[{ label: '7手口の合計', points: s.filter(x => x.year >= CRIME_FULL_FROM).map(x => ({ x: x.year, y: x.total })) }]} />
      <LineChart title={`${m.name}の手口別発生件数（${CRIME_FULL_FROM}〜${LATEST_CRIME}年、件）`} unit="件" zero
        series={CRIME_TYPES.map(t => ({ label: t, points: s.filter(x => x.year >= CRIME_FULL_FROM).map(x => ({ x: x.year, y: x[t] ?? 0 })) }))} />
      <h2>年次データ（{FIRST_CRIME}〜{LATEST_CRIME}年）</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th>{CRIME_TYPES.map(t => <th key={t}>{t}</th>)}<th>合計</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td>{CRIME_TYPES.map(t => <td key={t}>{fmt(x[t] ?? 0)}</td>)}<td>{fmt(x.total)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口</Link></li>
        <li><Link href={`/household/${m.slug}/`}>{m.name}の世帯</Link></li>
        <li><Link href={`/work/${m.slug}/`}>{m.name}の就業者・昼間人口</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/crime/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['crime']} extra={[
        '対象は岩手県警がオープンデータとして公開している7手口のみで、刑法犯認知件数の全体ではない。',
        `${FIRST_CRIME}〜${CRIME_FULL_FROM - 1}年は一部の手口・一部の期間しか公開されていない。年次データの表には公開値をそのまま載せているが、この2年と${CRIME_FULL_FROM}年以降を単純比較しないこと。`,
        '年は「発生年月日（始期）」の年。市町村は「発生地」であり、被害者の居住地ではない。',
        `人口千人当たりは、${LATEST_CRIME}年の件数を${Math.min(LATEST_CRIME + 1, LATEST_POP)}年1月1日の住民基本台帳人口で割った本サイトの計算値。`,
        '発生件数は昼間人口や駐輪・駐車の状況に左右される。通勤・通学の流入が多い市町村ほど、居住人口当たりでは高く出る。',
      ]} />
    </>
  );
}
