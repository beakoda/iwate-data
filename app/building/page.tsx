import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, buildAt, buildPrefAt, popAt, fmt, fmtSigned, pct, rank, BUILD_YEARS, LATEST_BUILD, FIRST_BUILD, LAST_COST_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';
import { IwateMap } from '@/components/Map';

const TITLE = `岩手県33市町村の住宅着工・建築着工（${FIRST_BUILD}〜${LATEST_BUILD}年）`;
const pNow = buildPrefAt(LATEST_BUILD);
const pPrev = buildPrefAt(LATEST_BUILD - 1);
const pFirst = buildPrefAt(FIRST_BUILD);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の居住専用住宅の着工は${LATEST_BUILD}年に${fmt(pNow.bldg_house)}棟（床面積${fmt(pNow.floor_house)}m²）。33市町村別の着工棟数・床面積・1棟当たり床面積・人口千人当たりを${FIRST_BUILD}年から一覧。`,
  alternates: { canonical: '/building/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const b = buildAt(m.code, LATEST_BUILD)!, b0 = buildAt(m.code, FIRST_BUILD)!, bp = buildAt(m.code, LATEST_BUILD - 1)!;
    const pop = popAt(m.code, LATEST_BUILD)?.total ?? null;
    const total = BUILD_YEARS.reduce((a, y) => a + (buildAt(m.code, y)?.bldg_house ?? 0), 0);
    return { m, b, b0, bp, total, perK: pop ? Math.round((b.bldg_house / pop) * 1000 * 100) / 100 : null,
      per: b.bldg_house ? Math.round(b.floor_house / b.bldg_house * 10) / 10 : null };
  });
  const rH = rank(rows, r => r.b.bldg_house), rK = rank(rows, r => r.perK);
  const by = [...rows].sort((a, b) => b.b.bldg_house - a.b.bldg_house);
  const byK = [...rows].filter(r => r.perK != null).sort((a, b) => b.perK! - a.perK!);
  const sentence = `岩手県の居住専用住宅の着工は${LATEST_BUILD}年に${fmt(pNow.bldg_house)}棟（前年比${fmtSigned(pct(pNow.bldg_house, pPrev.bldg_house), '%')}、${FIRST_BUILD}年比${fmtSigned(pct(pNow.bldg_house, pFirst.bldg_house), '%')}）。市町村別では${by[0].m.name}が${fmt(by[0].b.bldg_house)}棟で最も多い。`;
  return (
    <>
      <Breadcrumb items={[{ name: '住宅着工・建築着工' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/building/" keywords={['岩手県', '住宅着工', '建築着工', '着工棟数', '市町村別', '工務店', '建築着工統計']} temporal={`${FIRST_BUILD}/${LATEST_BUILD}`} sourceKeys={['building']} />
      <h1>{TITLE}</h1>
      <MuniStrip family="building" />
      <p className="key-fact">岩手県の居住専用住宅の着工は{LATEST_BUILD}年に<strong>{fmt(pNow.bldg_house)}棟</strong>・床面積{fmt(pNow.floor_house)}m²。前年比{fmtSigned(pct(pNow.bldg_house, pPrev.bldg_house), '%')}、{FIRST_BUILD}年比{fmtSigned(pct(pNow.bldg_house, pFirst.bldg_house), '%')}。市町村別で最も多いのは<strong>{by[0].m.name}（{fmt(by[0].b.bldg_house)}棟）</strong>、人口千人当たりでは<strong>{byK[0].m.name}（{fmt(byK[0].perK)}棟）</strong>。</p>
      <IwateMap title={`人口千人当たり居住専用住宅の着工棟数（${LATEST_BUILD}年）`} unit="棟" decimals={2} family="building" values={rows.map(x => ({ code: x.m.code, value: x.perK ?? null }))} />
      <Tools family="building" slug="all" label="33市町村の全年データ" />

      <LineChart title={`岩手県の居住専用住宅 着工棟数（${FIRST_BUILD}〜${LATEST_BUILD}年、棟）`} unit="棟" zero
        series={[{ label: '岩手県', points: BUILD_YEARS.map(y => ({ x: y, y: buildPrefAt(y).bldg_house })) }]} />
      <BarChart title={`居住専用住宅の着工棟数（${LATEST_BUILD}年、市町村別）`} items={by.map(r => ({ label: r.m.name, value: r.b.bldg_house }))} unit="棟" />
      <BarChart title={`人口千人当たりの住宅着工棟数（${LATEST_BUILD}年）`} items={byK.map(r => ({ label: r.m.name, value: r.perK }))} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>住宅着工 {LATEST_BUILD}年</th><th>順位</th><th>前年比</th><th>{FIRST_BUILD}年</th><th>床面積(m²)</th><th>1棟当たり(m²)</th><th>人口千人当たり</th><th>順位</th><th>{FIRST_BUILD}〜{LATEST_BUILD}累計</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.bldg_house)}</td><td>—</td><td>{fmtSigned(pct(pNow.bldg_house, pPrev.bldg_house), '%')}</td><td>{fmt(pFirst.bldg_house)}</td><td>{fmt(pNow.floor_house)}</td><td>{fmt(Math.round(pNow.floor_house / pNow.bldg_house * 10) / 10)}</td><td>—</td><td>—</td><td>{fmt(BUILD_YEARS.reduce((a, y) => a + buildPrefAt(y).bldg_house, 0))}</td></tr>
            {by.map(r => { const d = pct(r.b.bldg_house, r.bp.bldg_house); return (
              <tr key={r.m.code}><td><Link href={`/building/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.b.bldg_house)}</td><td>{rH.get(r) ?? '—'}位</td>
                <td className={d != null && d < 0 ? 'neg' : d != null ? 'pos' : ''}>{fmtSigned(d, '%')}</td>
                <td>{fmt(r.b0.bldg_house)}</td><td>{fmt(r.b.floor_house)}</td><td>{fmt(r.per)}</td>
                <td>{fmt(r.perK)}</td><td>{rK.get(r) ?? '—'}位</td><td>{fmt(r.total)}</td></tr>); })}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const b = buildAt(m.code, LATEST_BUILD)!; return <li key={m.code}><Link href={`/building/${m.slug}/`}>{m.name}の住宅着工<small>{LATEST_BUILD}年 {fmt(b.bldg_house)}棟・{fmt(b.floor_house)}m²</small></Link></li>; })}</ul>
      <Cta topic="住宅着工" />
      <CiteBox title={TITLE} path="/building/" sentence={sentence} />
      <SourceBox keys={['building']} extra={[
        '「居住専用住宅」は用途大分類Ａ。棟数は建築物の数で、共同住宅の戸数とは異なる。',
        '「岩手県（33市町村計）」は市町村別の値の合計。国土交通省が公表する岩手県の値と一致することを確認している。',
        `工事費予定額は${LAST_COST_YEAR}年までの統計表にのみ収録。`,
      ]} />
    </>
  );
}
