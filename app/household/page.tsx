import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, houseAt, housePrefAt, hhShare, fmt, fmtSigned, pct, rank, HOUSE_YEARS, LATEST_HOUSE, PREV_HOUSE, FIRST_HOUSE, FIRST_POP75_YEAR } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の世帯・高齢世帯・単独世帯（${FIRST_HOUSE}〜${LATEST_HOUSE}年）`;
const pNow = housePrefAt(LATEST_HOUSE);
const pPrev = housePrefAt(PREV_HOUSE);
const pFirst = housePrefAt(FIRST_HOUSE);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の一般世帯数は${LATEST_HOUSE}年に${fmt(pNow.general_hh)}世帯、うち単独世帯${fmt(pNow.single_hh)}世帯（${fmt(hhShare(pNow.single_hh, pNow.general_hh))}%）、65歳以上の単独世帯${fmt(pNow.eld_single_hh)}世帯。33市町村別に国勢調査から集計。`,
  alternates: { canonical: '/household/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const h = houseAt(m.code, LATEST_HOUSE)!, h0 = houseAt(m.code, FIRST_HOUSE)!, hp = houseAt(m.code, PREV_HOUSE)!;
    return { m, h, h0, hp,
      single: hhShare(h.single_hh, h.general_hh), eldS: hhShare(h.eld_single_hh, h.general_hh),
      nuc: hhShare(h.nuclear_hh, h.general_hh) };
  });
  const rH = rank(rows, r => r.h.general_hh), rS = rank(rows, r => r.single), rE = rank(rows, r => r.eldS);
  const by = [...rows].sort((a, b) => (b.h.general_hh ?? 0) - (a.h.general_hh ?? 0));
  const byE = [...rows].filter(r => r.eldS != null).sort((a, b) => b.eldS! - a.eldS!);
  const byS = [...rows].filter(r => r.single != null).sort((a, b) => b.single! - a.single!);
  const sentence = `岩手県の一般世帯数は${LATEST_HOUSE}年に${fmt(pNow.general_hh)}世帯で、うち単独世帯が${fmt(pNow.single_hh)}世帯（${fmt(hhShare(pNow.single_hh, pNow.general_hh))}%）、65歳以上の単独世帯が${fmt(pNow.eld_single_hh)}世帯（${fmt(hhShare(pNow.eld_single_hh, pNow.general_hh))}%）。65歳以上の単独世帯の割合が最も高いのは${byE[0].m.name}（${fmt(byE[0].eldS)}%）。`;
  return (
    <>
      <Breadcrumb items={[{ name: '世帯・高齢世帯' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/household/" keywords={['岩手県', '世帯数', '単独世帯', '高齢者単身世帯', '核家族', '外国人人口', '国勢調査', '市町村別']} temporal={`${FIRST_HOUSE}/${LATEST_HOUSE}`} sourceKeys={['household']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の一般世帯数は{LATEST_HOUSE}年に<strong>{fmt(pNow.general_hh)}世帯</strong>（{FIRST_HOUSE}年比{fmtSigned(pct(pNow.general_hh, pFirst.general_hh), '%')}）。うち単独世帯が<strong>{fmt(pNow.single_hh)}世帯（{fmt(hhShare(pNow.single_hh, pNow.general_hh))}%）</strong>、65歳以上の単独世帯が<strong>{fmt(pNow.eld_single_hh)}世帯（{fmt(hhShare(pNow.eld_single_hh, pNow.general_hh))}%）</strong>。65歳以上の単独世帯の割合が最も高いのは<strong>{byE[0].m.name}（{fmt(byE[0].eldS)}%）</strong>、単独世帯の割合が最も高いのは<strong>{byS[0].m.name}（{fmt(byS[0].single)}%）</strong>。</p>
      <LineChart title={`岩手県の世帯の内訳（${FIRST_HOUSE}〜${LATEST_HOUSE}年、世帯）`} unit="世帯" zero
        series={[
          { label: '一般世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: housePrefAt(y).general_hh ?? 0 })) },
          { label: '単独世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: housePrefAt(y).single_hh ?? 0 })) },
          { label: '核家族世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: housePrefAt(y).nuclear_hh ?? 0 })) },
          { label: '65歳以上の単独世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: housePrefAt(y).eld_single_hh ?? 0 })) },
        ]} />
      <BarChart title={`65歳以上の単独世帯の割合（${LATEST_HOUSE}年、一般世帯に占める%）`} items={byE.map(r => ({ label: r.m.name, value: r.eldS }))} unit="%" />
      <BarChart title={`単独世帯の割合（${LATEST_HOUSE}年、一般世帯に占める%）`} items={byS.map(r => ({ label: r.m.name, value: r.single }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>一般世帯 {LATEST_HOUSE}年</th><th>順位</th><th>{FIRST_HOUSE}年比</th><th>単独世帯</th><th>割合</th><th>順位</th><th>65歳以上単独</th><th>割合</th><th>順位</th><th>高齢夫婦のみ</th><th>核家族</th><th>外国人人口</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.general_hh)}</td><td>—</td><td>{fmtSigned(pct(pNow.general_hh, pFirst.general_hh), '%')}</td><td>{fmt(pNow.single_hh)}</td><td>{fmt(hhShare(pNow.single_hh, pNow.general_hh))}%</td><td>—</td><td>{fmt(pNow.eld_single_hh)}</td><td>{fmt(hhShare(pNow.eld_single_hh, pNow.general_hh))}%</td><td>—</td><td>{fmt(pNow.eld_couple_hh)}</td><td>{fmt(pNow.nuclear_hh)}</td><td>{fmt(pNow.foreign)}</td></tr>
            {by.map(r => (
              <tr key={r.m.code}><td><Link href={`/household/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.h.general_hh)}</td><td>{rH.get(r) ?? '—'}位</td>
                <td className={pct(r.h.general_hh, r.h0.general_hh)! < 0 ? 'neg' : 'pos'}>{fmtSigned(pct(r.h.general_hh, r.h0.general_hh), '%')}</td>
                <td>{fmt(r.h.single_hh)}</td><td>{fmt(r.single)}%</td><td>{rS.get(r) ?? '—'}位</td>
                <td>{fmt(r.h.eld_single_hh)}</td><td>{fmt(r.eldS)}%</td><td>{rE.get(r) ?? '—'}位</td>
                <td>{fmt(r.h.eld_couple_hh)}</td><td>{fmt(r.h.nuclear_hh)}</td><td>{fmt(r.h.foreign)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const h = houseAt(m.code, LATEST_HOUSE)!; return <li key={m.code}><Link href={`/household/${m.slug}/`}>{m.name}の世帯<small>{LATEST_HOUSE}年 一般世帯{fmt(h.general_hh)}・65歳以上単独{fmt(h.eld_single_hh)}</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/household/" sentence={sentence} />
      <SourceBox keys={['household']} extra={[
        '「一般世帯」は施設等の世帯を除く世帯。割合の分母は一般世帯数。',
        `75歳以上人口は${FIRST_POP75_YEAR}年以降のみ収録されており、${FIRST_HOUSE}年は空欄。`,
        '人口集中地区（DID）人口は、該当する地区のない市町村では空欄になる。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と一致することを確認している。',
      ]} />
    </>
  );
}
