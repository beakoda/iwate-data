import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, vitalAt, vitalPrefAt, popAt, naturalChange, fmt, fmtSigned, pct, rank, VITAL_YEARS, LATEST_VITAL, FIRST_VITAL, FIRST_MIGR_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';
import { IwateMap } from '@/components/Map';

const TITLE = `岩手県33市町村の出生・死亡・婚姻・離婚（${FIRST_VITAL}〜${LATEST_VITAL}年）`;
const pNow = vitalPrefAt(LATEST_VITAL);
const pPrev = vitalPrefAt(LATEST_VITAL - 1);
const pFirst = vitalPrefAt(FIRST_VITAL);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の出生数は${LATEST_VITAL}年に${fmt(pNow.births)}人、死亡数は${fmt(pNow.deaths)}人で自然増減は${fmtSigned(naturalChange(pNow))}人。33市町村別の出生・死亡・自然増減・婚姻・離婚を${FIRST_VITAL}年から一覧。`,
  alternates: { canonical: '/vital/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const v = vitalAt(m.code, LATEST_VITAL)!, v0 = vitalAt(m.code, FIRST_VITAL)!;
    const pop = popAt(m.code, LATEST_VITAL)?.total ?? null;
    return { m, v, v0, nat: naturalChange(v),
      birthK: pop && v.births != null ? Math.round((v.births / pop) * 1000 * 10) / 10 : null,
      deathK: pop && v.deaths != null ? Math.round((v.deaths / pop) * 1000 * 10) / 10 : null };
  });
  const rB = rank(rows, r => r.v.births), rBK = rank(rows, r => r.birthK);
  const by = [...rows].sort((a, b) => (b.v.births ?? 0) - (a.v.births ?? 0));
  const byK = [...rows].filter(r => r.birthK != null).sort((a, b) => b.birthK! - a.birthK!);
  const natPref = naturalChange(pNow);
  const sentence = `岩手県の出生数は${LATEST_VITAL}年に${fmt(pNow.births)}人（${FIRST_VITAL}年比${fmtSigned(pct(pNow.births, pFirst.births), '%')}）、死亡数は${fmt(pNow.deaths)}人で、自然増減は${fmtSigned(natPref)}人。市町村別で出生数が最も多いのは${by[0].m.name}（${fmt(by[0].v.births)}人）。`;
  return (
    <>
      <Breadcrumb items={[{ name: '出生・死亡・婚姻・離婚' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/vital/" keywords={['岩手県', '出生数', '死亡数', '自然増減', '婚姻件数', '離婚件数', '人口動態', '市町村別']} temporal={`${FIRST_VITAL}/${LATEST_VITAL}`} sourceKeys={['vital']} />
      <h1>{TITLE}</h1>
      <MuniStrip family="vital" />
      <p className="key-fact">岩手県の出生数は{LATEST_VITAL}年に<strong>{fmt(pNow.births)}人</strong>（前年比{fmtSigned(pct(pNow.births, pPrev.births), '%')}、{FIRST_VITAL}年比{fmtSigned(pct(pNow.births, pFirst.births), '%')}）、死亡数は<strong>{fmt(pNow.deaths)}人</strong>で自然増減は<strong>{fmtSigned(natPref)}人</strong>。婚姻{fmt(pNow.marriages)}件・離婚{fmt(pNow.divorces)}件。市町村別で出生数が最も多いのは<strong>{by[0].m.name}（{fmt(by[0].v.births)}人）</strong>、人口千人当たりでは<strong>{byK[0].m.name}（{fmt(byK[0].birthK)}人）</strong>。</p>
      <IwateMap title={`人口千人当たり出生数（${LATEST_VITAL}年）`} unit="人" decimals={1} family="vital" values={rows.map(x => ({ code: x.m.code, value: x.birthK ?? null }))} />
      <Tools family="vital" slug="all" label="33市町村の全年データ" />

      <LineChart title={`岩手県の出生数と死亡数（${FIRST_VITAL}〜${LATEST_VITAL}年、人）`} unit="人" zero
        series={[
          { label: '出生数', points: VITAL_YEARS.map(y => ({ x: y, y: vitalPrefAt(y).births ?? 0 })) },
          { label: '死亡数', points: VITAL_YEARS.map(y => ({ x: y, y: vitalPrefAt(y).deaths ?? 0 })) },
        ]} />
      <LineChart title={`岩手県の婚姻件数と離婚件数（${FIRST_VITAL}〜${LATEST_VITAL}年、件）`} unit="件" zero
        series={[
          { label: '婚姻件数', points: VITAL_YEARS.map(y => ({ x: y, y: vitalPrefAt(y).marriages ?? 0 })) },
          { label: '離婚件数', points: VITAL_YEARS.map(y => ({ x: y, y: vitalPrefAt(y).divorces ?? 0 })) },
        ]} />
      <BarChart title={`出生数（${LATEST_VITAL}年、市町村別）`} items={by.map(r => ({ label: r.m.name, value: r.v.births }))} unit="人" />
      <BarChart title={`人口千人当たりの出生数（${LATEST_VITAL}年）`} items={byK.map(r => ({ label: r.m.name, value: r.birthK }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>出生数 {LATEST_VITAL}年</th><th>順位</th><th>死亡数</th><th>自然増減</th><th>人口千人当たり出生</th><th>順位</th><th>婚姻</th><th>離婚</th><th>{FIRST_VITAL}年の出生</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.births)}</td><td>—</td><td>{fmt(pNow.deaths)}</td><td className="neg">{fmtSigned(natPref)}</td><td>—</td><td>—</td><td>{fmt(pNow.marriages)}</td><td>{fmt(pNow.divorces)}</td><td>{fmt(pFirst.births)}</td></tr>
            {by.map(r => (
              <tr key={r.m.code}><td><Link href={`/vital/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.v.births)}</td><td>{rB.get(r) ?? '—'}位</td><td>{fmt(r.v.deaths)}</td>
                <td className={r.nat != null && r.nat < 0 ? 'neg' : r.nat != null ? 'pos' : ''}>{fmtSigned(r.nat)}</td>
                <td>{fmt(r.birthK)}</td><td>{rBK.get(r) ?? '—'}位</td>
                <td>{fmt(r.v.marriages)}</td><td>{fmt(r.v.divorces)}</td><td>{fmt(r.v0.births)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const v = vitalAt(m.code, LATEST_VITAL)!; return <li key={m.code}><Link href={`/vital/${m.slug}/`}>{m.name}の出生・死亡<small>{LATEST_VITAL}年 出生{fmt(v.births)}人・死亡{fmt(v.deaths)}人</small></Link></li>; })}</ul>
      <Cta topic="出生数" />
      <CiteBox title={TITLE} path="/vital/" sentence={sentence} />
      <SourceBox keys={['vital']} extra={[
        '出生数・死亡数・婚姻件数・離婚件数は人口動態調査（各年1〜12月）。住民基本台帳の出生・死亡（/population/）とは定義も集計期間も異なるため、直接比較しない。',
        '2011年の沿岸市町村の死亡数には東日本大震災による死亡が含まれる。',
        `転入者数・転出者数は${FIRST_MIGR_YEAR}年以降のみ市区町村別に収録され、県内の市町村間移動を含む。県計と単純に一致しない。`,
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と一致することを確認している。',
      ]} />
    </>
  );
}
