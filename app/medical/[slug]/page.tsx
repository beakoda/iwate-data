import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, medAt, medSeries, medPrefAt, per100kMed, popAt, dentalAt, fmt, fmtSigned, pct, rank, MED_YEARS, LATEST_MED, FIRST_MED, LATEST_DOC_YEAR } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = medAt(m.code, LATEST_MED)!; const rd = medAt(m.code, LATEST_DOC_YEAR)!;
  return {
    title: `${m.name}の病院数・病床数・医師数（${FIRST_MED}〜${LATEST_MED}年）`,
    description: `${m.name}（岩手県）の病院は${LATEST_MED}年に${fmt(r.hospitals)}施設・病床${fmt(r.hosp_beds)}床、医師数は${LATEST_DOC_YEAR}年に${fmt(rd.doctors)}人。人口10万人当たりと県内33市町村の順位を医療施設調査・医師歯科医師薬剤師統計から集計。`,
    alternates: { canonical: `/medical/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = medSeries(m.code);
  const r = medAt(m.code, LATEST_MED)!, r0 = medAt(m.code, FIRST_MED)!, rd = medAt(m.code, LATEST_DOC_YEAR)!;
  const pref = medPrefAt(LATEST_MED), prefD = medPrefAt(LATEST_DOC_YEAR);
  const rows = MUNIS.map(mm => {
    const x = medAt(mm.code, LATEST_MED)!, xd = medAt(mm.code, LATEST_DOC_YEAR)!;
    return { m: mm, beds: x.hosp_beds, hosp: x.hospitals, doctors: xd.doctors,
      bedsK: per100kMed(x.hosp_beds, mm.code, LATEST_MED), docK: per100kMed(xd.doctors, mm.code, LATEST_DOC_YEAR) };
  });
  const rB = rank(rows, x => x.beds), rBK = rank(rows, x => x.bedsK), rD = rank(rows, x => x.doctors), rDK = rank(rows, x => x.docK);
  const me = rows.find(x => x.m.code === m.code)!;
  const bedsK = per100kMed(r.hosp_beds, m.code, LATEST_MED), docK = per100kMed(rd.doctors, m.code, LATEST_DOC_YEAR);
  const prefBedsK = pref.hosp_beds != null ? Math.round((pref.hosp_beds / MUNIS.reduce((a, x) => a + (popAt(x.code, LATEST_MED)?.total ?? 0), 0)) * 100000 * 10) / 10 : null;
  const prefDocK = prefD.doctors != null ? Math.round((prefD.doctors / MUNIS.reduce((a, x) => a + (popAt(x.code, LATEST_DOC_YEAR)?.total ?? 0), 0)) * 100000 * 10) / 10 : null;
  const title = `${m.name}の病院数・病床数・医師数（${FIRST_MED}〜${LATEST_MED}年）`;
  const noHosp = (r.hospitals ?? 0) === 0;
  const sentence = noHosp
    ? `${m.name}には${LATEST_MED}年時点で病院（病床20床以上）が1つもなく、一般診療所が${fmt(r.clinics)}施設・歯科診療所が${fmt(r.dental_clinics)}施設。医師数は${LATEST_DOC_YEAR}年に${fmt(rd.doctors)}人で、人口10万人当たり${fmt(docK)}人（岩手県平均${fmt(prefDocK)}人）。`
    : `${m.name}の病院は${LATEST_MED}年に${fmt(r.hospitals)}施設・病床${fmt(r.hosp_beds)}床で、人口10万人当たり${fmt(bedsK)}床（岩手県内33市町村中${rBK.get(me) ?? '—'}位、県平均${fmt(prefBedsK)}床）。医師数は${LATEST_DOC_YEAR}年に${fmt(rd.doctors)}人で、人口10万人当たり${fmt(docK)}人。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '病院・病床・医師', href: '/medical/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/medical/${m.slug}/`}
        keywords={[m.name, '病院数', '病床数', '医師数', '歯科医師数', '薬剤師数', '医療施設調査', '岩手県']} temporal={`${FIRST_MED}/${LATEST_MED}`} sourceKeys={['medical']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {noHosp
          ? <>{m.name}には{LATEST_MED}年時点で<strong>病院（病床20床以上）が1つもない</strong>。一般診療所{fmt(r.clinics)}施設・歯科診療所{fmt(r.dental_clinics)}施設で、一般診療所の病床は{fmt(r.clinic_beds)}床。</>
          : <>{m.name}の病院は{LATEST_MED}年に<strong>{fmt(r.hospitals)}施設</strong>・病床<strong>{fmt(r.hosp_beds)}床</strong>（{FIRST_MED}年比{fmtSigned(pct(r.hosp_beds, r0.hosp_beds), '%')}）。人口10万人当たり<strong>{fmt(bedsK)}床</strong>で岩手県内<strong>{rBK.get(me) ?? '—'}位</strong>（県平均{fmt(prefBedsK)}床）。</>}
        {' '}医師数は{LATEST_DOC_YEAR}年に<strong>{fmt(rd.doctors)}人</strong>（人口10万人当たり{fmt(docK)}人・県内{rDK.get(me) ?? '—'}位）。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">病院数（{LATEST_MED}年）</div><div className="stat-value">{fmt(r.hospitals)}</div><div className="stat-sub">施設・うち一般病院 {fmt(r.gen_hospitals)}</div></div>
        <div className="stat"><div className="stat-label">病院病床数</div><div className="stat-value">{fmt(r.hosp_beds)}</div><div className="stat-sub">床・県内 {rB.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口10万人当たり病床</div><div className="stat-value">{fmt(bedsK)}</div><div className="stat-sub">床・県内 {rBK.get(me) ?? '—'}位（県平均 {fmt(prefBedsK)}）</div></div>
        <div className="stat"><div className="stat-label">医師数（{LATEST_DOC_YEAR}年）</div><div className="stat-value">{fmt(rd.doctors)}</div><div className="stat-sub">人・県内 {rD.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口10万人当たり医師</div><div className="stat-value">{fmt(docK)}</div><div className="stat-sub">人・県内 {rDK.get(me) ?? '—'}位（県平均 {fmt(prefDocK)}）</div></div>
        <div className="stat"><div className="stat-label">歯科医師・薬剤師（{LATEST_DOC_YEAR}年）</div><div className="stat-value">{fmt(rd.dentists)}</div><div className="stat-sub">人（歯科医師）・薬剤師 {fmt(rd.pharmacists)}人</div></div>
        <div className="stat"><div className="stat-label">一般診療所（{LATEST_MED}年）</div><div className="stat-value">{fmt(r.clinics)}</div><div className="stat-sub">施設・病床 {fmt(r.clinic_beds)}床</div></div>
        <div className="stat"><div className="stat-label">歯科診療所（{LATEST_MED}年）</div><div className="stat-value">{fmt(r.dental_clinics)}</div><div className="stat-sub">施設 → <Link href={`/dental/${m.slug}/`}>推移を見る</Link></div></div>
      </div>
      <LineChart title={`${m.name}の病床数（${FIRST_MED}〜${LATEST_MED}年、床）`} unit="床" zero
        series={[
          { label: '病院病床', points: s.map(x => ({ x: x.year, y: x.hosp_beds ?? 0 })) },
          { label: '一般診療所病床', points: s.map(x => ({ x: x.year, y: x.clinic_beds ?? 0 })) },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>病院数</th><th>一般病院</th><th>病院病床</th><th>一般診療所</th><th>一般診療所病床</th><th>歯科診療所</th><th>医師数</th><th>歯科医師数</th><th>薬剤師数</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.hospitals)}</td><td>{fmt(x.gen_hospitals)}</td><td>{fmt(x.hosp_beds)}</td>
                <td>{fmt(x.clinics)}</td><td>{fmt(x.clinic_beds)}</td><td>{fmt(x.dental_clinics)}</td>
                <td>{fmt(x.doctors)}</td><td>{fmt(x.dentists)}</td><td>{fmt(x.pharmacists)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/dental/${m.slug}/`}>{m.name}の歯科診療所</Link></li>
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link></li>
        <li><Link href={`/vital/${m.slug}/`}>{m.name}の出生・死亡</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/medical/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['medical']} extra={[
        '病院は病床20床以上、一般診療所は19床以下（無床を含む）。病床は所在地の市町村に計上され、その市町村の住民が使う病床数ではない。',
        `医師数・歯科医師数・薬剤師数は隔年調査のため直近は${LATEST_DOC_YEAR}年。従業地（勤務先の所在地）別で、住所地別ではない。`,
        '人口10万人当たりは住民基本台帳人口（各年1月1日）を分母にした本サイトの計算値。',
        '病院の開設・廃止や移転があると、病床はその年から所在地の市町村に計上される。2019〜2020年に盛岡市の病院病床が減り矢巾町が増えているのは、この所在地ベースの集計によるもの。市町村をまたぐ比較・時系列の解釈では注意すること。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
