import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, schoolAt, schoolPrefAt, pupilsPerSchool, fmt, fmtSigned, pct, rank, SCHOOL_YEARS, LATEST_SCHOOL, FIRST_SCHOOL } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の小中学校数・児童生徒数（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年）`;
const pNow = schoolPrefAt(LATEST_SCHOOL);
const pFirst = schoolPrefAt(FIRST_SCHOOL);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の小学校は${LATEST_SCHOOL}年に${fmt(pNow.es)}校・児童${fmt(pNow.es_pupils)}人、中学校は${fmt(pNow.jhs)}校・生徒${fmt(pNow.jhs_students)}人。33市町村別に幼稚園・小学校・中学校・高校の学校数と児童生徒数、教員数を一覧。`,
  alternates: { canonical: '/school/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = schoolAt(m.code, LATEST_SCHOOL)!, r0 = schoolAt(m.code, FIRST_SCHOOL)!;
    return { m, r, r0, pps: pupilsPerSchool(r.es_pupils, r.es), tot: (r.es_pupils ?? 0) + (r.jhs_students ?? 0) };
  });
  const rE = rank(rows, r => r.r.es_pupils), rP = rank(rows, r => r.pps), rS = rank(rows, r => r.r.es);
  const byE = [...rows].sort((a, b) => (b.r.es_pupils ?? 0) - (a.r.es_pupils ?? 0));
  const byP = [...rows].filter(r => r.pps != null).sort((a, b) => b.pps! - a.pps!);
  const prefPps = pupilsPerSchool(pNow.es_pupils, pNow.es);
  const sentence = `岩手県の小学校は${LATEST_SCHOOL}年に${fmt(pNow.es)}校・児童${fmt(pNow.es_pupils)}人で、${FIRST_SCHOOL}年（${fmt(pFirst.es)}校・${fmt(pFirst.es_pupils)}人）から学校は${fmtSigned(pNow.es! - pFirst.es!, '校')}、児童は${fmtSigned(pct(pNow.es_pupils, pFirst.es_pupils), '%')}。中学校は${fmt(pNow.jhs)}校・生徒${fmt(pNow.jhs_students)}人、幼稚園は${fmt(pNow.kg)}園。小学校1校当たりの児童数は${fmt(prefPps)}人。`;
  return (
    <>
      <Breadcrumb items={[{ name: '学校・児童生徒' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/school/" keywords={['岩手県', '小学校', '中学校', '高校', '幼稚園', '児童数', '生徒数', '教員数', '学校統廃合', '市町村別']} temporal={`${FIRST_SCHOOL}/${LATEST_SCHOOL}`} sourceKeys={['school']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の小学校は{LATEST_SCHOOL}年に<strong>{fmt(pNow.es)}校・児童{fmt(pNow.es_pupils)}人</strong>で、{FIRST_SCHOOL}年から学校は<strong>{fmtSigned(pNow.es! - pFirst.es!, '校')}</strong>、児童は<strong>{fmtSigned(pct(pNow.es_pupils, pFirst.es_pupils), '%')}</strong>。中学校は{fmt(pNow.jhs)}校・生徒{fmt(pNow.jhs_students)}人、幼稚園は{fmt(pNow.kg)}園（{FIRST_SCHOOL}年{fmt(pFirst.kg)}園）。小学校1校当たりの児童数は{fmt(prefPps)}人で、最も多いのは<strong>{byP[0].m.name}（{fmt(byP[0].pps)}人）</strong>、最も少ないのは<strong>{byP[byP.length - 1].m.name}（{fmt(byP[byP.length - 1].pps)}人）</strong>。</p>
      <LineChart title={`岩手県の児童・生徒数（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年、人）`} unit="人" zero
        series={[
          { label: '小学校 児童数', points: SCHOOL_YEARS.map(y => ({ x: y, y: schoolPrefAt(y).es_pupils ?? 0 })) },
          { label: '中学校 生徒数', points: SCHOOL_YEARS.map(y => ({ x: y, y: schoolPrefAt(y).jhs_students ?? 0 })) },
          { label: '高校 生徒数', points: SCHOOL_YEARS.map(y => ({ x: y, y: schoolPrefAt(y).hs_students ?? 0 })) },
        ]} />
      <LineChart title={`岩手県の学校数（${FIRST_SCHOOL}〜${LATEST_SCHOOL}年、校）`} unit="校" zero
        series={[
          { label: '小学校', points: SCHOOL_YEARS.map(y => ({ x: y, y: schoolPrefAt(y).es ?? 0 })) },
          { label: '中学校', points: SCHOOL_YEARS.map(y => ({ x: y, y: schoolPrefAt(y).jhs ?? 0 })) },
          { label: '幼稚園', points: SCHOOL_YEARS.map(y => ({ x: y, y: schoolPrefAt(y).kg ?? 0 })) },
        ]} />
      <BarChart title={`小学校の児童数（${LATEST_SCHOOL}年、市町村別）`} items={byE.map(r => ({ label: r.m.name, value: r.r.es_pupils }))} unit="人" />
      <BarChart title={`小学校1校当たりの児童数（${LATEST_SCHOOL}年）`} items={byP.map(r => ({ label: r.m.name, value: r.pps }))} unit="人" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>小学校 {LATEST_SCHOOL}年</th><th>児童数</th><th>順位</th><th>{FIRST_SCHOOL}年比</th><th>1校当たり</th><th>順位</th><th>小学校教員</th><th>中学校</th><th>生徒数</th><th>高校</th><th>生徒数</th><th>幼稚園</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.es)}</td><td>{fmt(pNow.es_pupils)}</td><td>—</td><td>{fmtSigned(pct(pNow.es_pupils, pFirst.es_pupils), '%')}</td><td>{fmt(prefPps)}</td><td>—</td><td>{fmt(pNow.es_teachers)}</td><td>{fmt(pNow.jhs)}</td><td>{fmt(pNow.jhs_students)}</td><td>{fmt(pNow.hs)}</td><td>{fmt(pNow.hs_students)}</td><td>{fmt(pNow.kg)}</td></tr>
            {byE.map(r => (
              <tr key={r.m.code}><td><Link href={`/school/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.es)}</td><td>{fmt(r.r.es_pupils)}</td><td>{rE.get(r) ?? '—'}位</td>
                <td className="neg">{fmtSigned(pct(r.r.es_pupils, r.r0.es_pupils), '%')}</td>
                <td>{fmt(r.pps)}</td><td>{rP.get(r) ?? '—'}位</td><td>{fmt(r.r.es_teachers)}</td>
                <td>{fmt(r.r.jhs)}</td><td>{fmt(r.r.jhs_students)}</td>
                <td>{fmt(r.r.hs)}</td><td>{fmt(r.r.hs_students)}</td><td>{fmt(r.r.kg)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = schoolAt(m.code, LATEST_SCHOOL)!; return <li key={m.code}><Link href={`/school/${m.slug}/`}>{m.name}の学校<small>{LATEST_SCHOOL}年 小{fmt(r.es)}校{fmt(r.es_pupils)}人・中{fmt(r.jhs)}校{fmt(r.jhs_students)}人</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/school/" sentence={sentence} />
      <SourceBox keys={['school']} extra={[
        '学校の所在地でカウントしており、その市町村に住む子どもの数ではない。高校は県立・私立を含み、通学区域は市町村をまたぐ。',
        '「1校当たり児童数」は児童数÷小学校数で、本サイトの計算値。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と全10指標・全14年で一致することを確認している。',
      ]} />
    </>
  );
}
