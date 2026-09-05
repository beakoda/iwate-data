import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, schoolAt, schoolSeries, schoolPrefAt, pupilsPerSchool, censusAt, fmt, fmtSigned, pct, rank, SCHOOL_YEARS, LATEST_SCHOOL, FIRST_SCHOOL } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = schoolAt(m.code, LATEST_SCHOOL)!;
  return {
    title: `${m.name}の小中学校数・児童生徒数の推移（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年）`,
    description: `${m.name}（岩手県）の小学校は${LATEST_SCHOOL}年に${fmt(r.es)}校・児童${fmt(r.es_pupils)}人、中学校は${fmt(r.jhs)}校・生徒${fmt(r.jhs_students)}人。1校当たり児童数と県内33市町村の順位を学校基本調査から集計。`,
    alternates: { canonical: `/school/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = schoolSeries(m.code);
  const r = schoolAt(m.code, LATEST_SCHOOL)!, r0 = schoolAt(m.code, FIRST_SCHOOL)!;
  const pref = schoolPrefAt(LATEST_SCHOOL);
  const pps = pupilsPerSchool(r.es_pupils, r.es), prefPps = pupilsPerSchool(pref.es_pupils, pref.es);
  const rows = MUNIS.map(mm => { const x = schoolAt(mm.code, LATEST_SCHOOL)!; return { m: mm, p: x.es_pupils, sc: x.es, pps: pupilsPerSchool(x.es_pupils, x.es) }; });
  const rE = rank(rows, x => x.p), rP = rank(rows, x => x.pps), rS = rank(rows, x => x.sc);
  const me = rows.find(x => x.m.code === m.code)!;
  const closed = (r0.es ?? 0) - (r.es ?? 0);
  const title = `${m.name}の小中学校数・児童生徒数の推移（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年）`;
  const sentence = `${m.name}の小学校は${LATEST_SCHOOL}年に${fmt(r.es)}校・児童${fmt(r.es_pupils)}人で、${FIRST_SCHOOL}年（${fmt(r0.es)}校・${fmt(r0.es_pupils)}人）から学校は${fmtSigned((r.es ?? 0) - (r0.es ?? 0), '校')}、児童は${fmtSigned(pct(r.es_pupils, r0.es_pupils), '%')}。1校当たりの児童数は${fmt(pps)}人（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPps)}人）。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '学校・児童生徒', href: '/school/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/school/${m.slug}/`}
        keywords={[m.name, '小学校', '中学校', '幼稚園', '児童数', '生徒数', '教員数', '学校基本調査', '岩手県']} temporal={`${FIRST_SCHOOL}/${LATEST_SCHOOL}`} sourceKeys={['school']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の小学校は{LATEST_SCHOOL}年に<strong>{fmt(r.es)}校・児童{fmt(r.es_pupils)}人</strong>。{FIRST_SCHOOL}年（{fmt(r0.es)}校・{fmt(r0.es_pupils)}人）から学校は<strong>{fmtSigned((r.es ?? 0) - (r0.es ?? 0), '校')}</strong>、児童は<strong>{fmtSigned(pct(r.es_pupils, r0.es_pupils), '%')}</strong>。
        1校当たり<strong>{fmt(pps)}人</strong>で岩手県内{rP.get(me) ?? '—'}位（県平均{fmt(prefPps)}人）。中学校は{fmt(r.jhs)}校・生徒{fmt(r.jhs_students)}人。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">小学校（{LATEST_SCHOOL}年）</div><div className="stat-value">{fmt(r.es)}</div><div className="stat-sub">校・{FIRST_SCHOOL}年から {fmtSigned((r.es ?? 0) - (r0.es ?? 0), '校')}</div></div>
        <div className="stat"><div className="stat-label">小学校 児童数</div><div className="stat-value">{fmt(r.es_pupils)}</div><div className="stat-sub">人・県内 {rE.get(me) ?? '—'}位・{FIRST_SCHOOL}年比 {fmtSigned(pct(r.es_pupils, r0.es_pupils), '%')}</div></div>
        <div className="stat"><div className="stat-label">小学校1校当たり児童数</div><div className="stat-value">{fmt(pps)}</div><div className="stat-sub">人・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPps)}人）</div></div>
        <div className="stat"><div className="stat-label">小学校 教員数</div><div className="stat-value">{fmt(r.es_teachers)}</div><div className="stat-sub">人・教員1人当たり児童 {r.es_teachers ? Math.round((r.es_pupils ?? 0) / r.es_teachers * 10) / 10 : '—'}人</div></div>
        <div className="stat"><div className="stat-label">中学校（{LATEST_SCHOOL}年）</div><div className="stat-value">{fmt(r.jhs)}</div><div className="stat-sub">校・生徒 {fmt(r.jhs_students)}人・教員 {fmt(r.jhs_teachers)}人</div></div>
        <div className="stat"><div className="stat-label">高校・幼稚園（{LATEST_SCHOOL}年）</div><div className="stat-value">{fmt(r.hs)}</div><div className="stat-sub">高校（生徒 {fmt(r.hs_students)}人）・幼稚園 {fmt(r.kg)}園（{fmt(r.kg_pupils)}人）</div></div>
      </div>
      <LineChart title={`${m.name}の児童・生徒数（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年、人）`} unit="人" zero
        series={[
          { label: '小学校 児童数', points: s.map(x => ({ x: x.year, y: x.es_pupils ?? 0 })) },
          { label: '中学校 生徒数', points: s.map(x => ({ x: x.year, y: x.jhs_students ?? 0 })) },
        ]} />
      <LineChart title={`${m.name}の学校数（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年、校）`} unit="校" zero
        series={[
          { label: '小学校', points: s.map(x => ({ x: x.year, y: x.es ?? 0 })) },
          { label: '中学校', points: s.map(x => ({ x: x.year, y: x.jhs ?? 0 })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>幼稚園</th><th>在園者</th><th>小学校</th><th>教員</th><th>児童数</th><th>1校当たり</th><th>中学校</th><th>教員</th><th>生徒数</th><th>高校</th><th>生徒数</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.kg)}</td><td>{fmt(x.kg_pupils)}</td>
                <td>{fmt(x.es)}</td><td>{fmt(x.es_teachers)}</td><td>{fmt(x.es_pupils)}</td><td>{fmt(pupilsPerSchool(x.es_pupils, x.es))}</td>
                <td>{fmt(x.jhs)}</td><td>{fmt(x.jhs_teachers)}</td><td>{fmt(x.jhs_students)}</td>
                <td>{fmt(x.hs)}</td><td>{fmt(x.hs_students)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の年少人口・高齢化率</Link></li>
        <li><Link href={`/vital/${m.slug}/`}>{m.name}の出生数</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/school/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['school']} extra={[
        '学校の所在地でカウントしており、その市町村に住む子どもの数ではない。高校は県立・私立を含み、通学区域は市町村をまたぐ。',
        '「1校当たり児童数」「教員1人当たり児童数」は本サイトの計算値。',
        ...(closed > 0 ? [`${FIRST_SCHOOL}年から${LATEST_SCHOOL}年までに小学校が${closed}校減っている。統廃合と学校の新設の差し引きであり、内訳は本統計からは分からない。`] : []),
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
