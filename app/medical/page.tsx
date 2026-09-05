import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, medAt, medPrefAt, per100kMed, popAt, fmt, fmtSigned, pct, rank, MED_YEARS, LATEST_MED, FIRST_MED, LATEST_DOC_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の病院・病床・医師数（${FIRST_MED}〜${LATEST_MED}年）`;
const pNow = medPrefAt(LATEST_MED);
const pFirst = medPrefAt(FIRST_MED);
const pDoc = medPrefAt(LATEST_DOC_YEAR);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の病院数は${LATEST_MED}年に${fmt(pNow.hospitals)}施設、病院病床数は${fmt(pNow.hosp_beds)}床、医師数は${LATEST_DOC_YEAR}年に${fmt(pDoc.doctors)}人。33市町村別に病院・病床・医師・歯科医師・薬剤師を一覧。`,
  alternates: { canonical: '/medical/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = medAt(m.code, LATEST_MED)!, r0 = medAt(m.code, FIRST_MED)!, rd = medAt(m.code, LATEST_DOC_YEAR)!;
    return { m, r, r0, rd,
      bedsK: per100kMed(r.hosp_beds, m.code, LATEST_MED),
      docK: per100kMed(rd.doctors, m.code, LATEST_DOC_YEAR) };
  });
  const rB = rank(rows, r => r.r.hosp_beds), rBK = rank(rows, r => r.bedsK), rD = rank(rows, r => r.rd.doctors), rDK = rank(rows, r => r.docK);
  const byBeds = [...rows].sort((a, b) => (b.r.hosp_beds ?? 0) - (a.r.hosp_beds ?? 0));
  const byBK = [...rows].filter(r => r.bedsK != null).sort((a, b) => b.bedsK! - a.bedsK!);
  const byDK = [...rows].filter(r => r.docK != null).sort((a, b) => b.docK! - a.docK!);
  const noHosp = rows.filter(r => (r.r.hospitals ?? 0) === 0).map(r => r.m.name);
  const sentence = `岩手県の病院は${LATEST_MED}年に${fmt(pNow.hospitals)}施設・病床${fmt(pNow.hosp_beds)}床で、${FIRST_MED}年（${fmt(pFirst.hospitals)}施設・${fmt(pFirst.hosp_beds)}床）から病床は${fmtSigned(pct(pNow.hosp_beds, pFirst.hosp_beds), '%')}。医師数は${LATEST_DOC_YEAR}年に${fmt(pDoc.doctors)}人。33市町村のうち${noHosp.length}町村には病院が1つもない。`;
  return (
    <>
      <Breadcrumb items={[{ name: '病院・病床・医師' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/medical/" keywords={['岩手県', '病院数', '病床数', '医師数', '歯科医師数', '薬剤師数', '医療施設調査', '市町村別']} temporal={`${FIRST_MED}/${LATEST_MED}`} sourceKeys={['medical']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の病院は{LATEST_MED}年に<strong>{fmt(pNow.hospitals)}施設</strong>・病床<strong>{fmt(pNow.hosp_beds)}床</strong>（{FIRST_MED}年比{fmtSigned(pct(pNow.hosp_beds, pFirst.hosp_beds), '%')}）。医師数は{LATEST_DOC_YEAR}年に<strong>{fmt(pDoc.doctors)}人</strong>、歯科医師{fmt(pDoc.dentists)}人、薬剤師{fmt(pDoc.pharmacists)}人。33市町村のうち<strong>{noHosp.length}町村</strong>には病院が1つもない（{noHosp.join('・')}）。人口10万人当たり医師数が最も多いのは<strong>{byDK[0].m.name}（{fmt(byDK[0].docK)}人）</strong>。</p>
      <LineChart title={`岩手県の病院病床数と一般診療所病床数（${FIRST_MED}〜${LATEST_MED}年、床）`} unit="床" zero
        series={[
          { label: '病院病床', points: MED_YEARS.map(y => ({ x: y, y: medPrefAt(y).hosp_beds ?? 0 })) },
          { label: '一般診療所病床', points: MED_YEARS.map(y => ({ x: y, y: medPrefAt(y).clinic_beds ?? 0 })) },
        ]} />
      <BarChart title={`病院病床数（${LATEST_MED}年、市町村別）`} items={byBeds.map(r => ({ label: r.m.name, value: r.r.hosp_beds }))} unit="床" />
      <BarChart title={`人口10万人当たり医師数（${LATEST_DOC_YEAR}年）`} items={byDK.map(r => ({ label: r.m.name, value: r.docK }))} unit="人" />
      <BarChart title={`人口10万人当たり病院病床数（${LATEST_MED}年）`} items={byBK.map(r => ({ label: r.m.name, value: r.bedsK }))} unit="床" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>病院 {LATEST_MED}年</th><th>病院病床</th><th>順位</th><th>10万人当たり</th><th>順位</th><th>一般診療所病床</th><th>医師 {LATEST_DOC_YEAR}年</th><th>順位</th><th>10万人当たり</th><th>順位</th><th>歯科医師</th><th>薬剤師</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.hospitals)}</td><td>{fmt(pNow.hosp_beds)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pNow.clinic_beds)}</td><td>{fmt(pDoc.doctors)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pDoc.dentists)}</td><td>{fmt(pDoc.pharmacists)}</td></tr>
            {byBeds.map(r => (
              <tr key={r.m.code}><td><Link href={`/medical/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.hospitals)}</td><td>{fmt(r.r.hosp_beds)}</td><td>{rB.get(r) ?? '—'}位</td>
                <td>{fmt(r.bedsK)}</td><td>{rBK.get(r) ?? '—'}位</td><td>{fmt(r.r.clinic_beds)}</td>
                <td>{fmt(r.rd.doctors)}</td><td>{rD.get(r) ?? '—'}位</td><td>{fmt(r.docK)}</td><td>{rDK.get(r) ?? '—'}位</td>
                <td>{fmt(r.rd.dentists)}</td><td>{fmt(r.rd.pharmacists)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = medAt(m.code, LATEST_MED)!; return <li key={m.code}><Link href={`/medical/${m.slug}/`}>{m.name}の病院・医師<small>{LATEST_MED}年 病院{fmt(r.hospitals)}・病床{fmt(r.hosp_beds)}</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/medical/" sentence={sentence} />
      <SourceBox keys={['medical']} extra={[
        '病院は病床20床以上、一般診療所は19床以下（無床を含む）。病床数は所在地の市町村に計上され、その市町村の住民が使う病床数ではない。',
        `医師数・歯科医師数・薬剤師数は隔年調査のため、直近は${LATEST_DOC_YEAR}年。従業地（勤務先の所在地）別で、住所地別ではない。`,
        '人口10万人当たりは住民基本台帳人口（各年1月1日）を分母にした本サイトの計算値。',
        '病院の開設・廃止や移転があると、病床はその年から所在地の市町村に計上される。2019〜2020年に盛岡市の病院病床が減り矢巾町が増えているのは、この所在地ベースの集計によるもの。市町村をまたぐ比較・時系列の解釈では注意すること。',
        '歯科診療所数・一般診療所数はこの表の値が /dental/ の医療施設調査 第2表と全年・全市町村で一致することを確認している。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と一致することを確認している。',
      ]} />
    </>
  );
}
