import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, welAt, welPrefAt, capPerElderly, censusAt, popAt, fmt, fmtSigned, pct, rank, WEL_YEARS, LATEST_WEL, FIRST_WEL, WEL_SWITCH_YEAR, LATEST_CENSUS } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の特別養護老人ホーム・有料老人ホーム・国保（${FIRST_WEL}〜${LATEST_WEL}年）`;
const pNow = welPrefAt(LATEST_WEL);
const pFirst = welPrefAt(FIRST_WEL);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の介護老人福祉施設（特別養護老人ホーム）は${LATEST_WEL}年に${fmt(pNow.tokuyo)}施設・定員${fmt(pNow.tokuyo_cap)}人、有料老人ホームは${fmt(pNow.yuryo)}施設・定員${fmt(pNow.yuryo_cap)}人。33市町村別に施設数・定員・国民健康保険被保険者数を一覧。`,
  alternates: { canonical: '/welfare/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = welAt(m.code, LATEST_WEL)!, r0 = welAt(m.code, FIRST_WEL)!;
    return { m, r, r0,
      capE: capPerElderly(r.tokuyo_cap, m.code, LATEST_CENSUS),
      yuryoE: capPerElderly(r.yuryo_cap, m.code, LATEST_CENSUS) };
  });
  const rC = rank(rows, r => r.r.tokuyo_cap), rE = rank(rows, r => r.capE), rY = rank(rows, r => r.r.yuryo_cap);
  const byCap = [...rows].sort((a, b) => (b.r.tokuyo_cap ?? 0) - (a.r.tokuyo_cap ?? 0));
  const byE = [...rows].filter(r => r.capE != null).sort((a, b) => b.capE! - a.capE!);
  const byY = [...rows].sort((a, b) => (b.r.yuryo_cap ?? 0) - (a.r.yuryo_cap ?? 0));
  const noYuryo = rows.filter(r => (r.r.yuryo ?? 0) === 0).map(r => r.m.name);
  const sentence = `岩手県の介護老人福祉施設（特別養護老人ホーム）は${LATEST_WEL}年に${fmt(pNow.tokuyo)}施設・定員${fmt(pNow.tokuyo_cap)}人で、${FIRST_WEL}年（${fmt(pFirst.tokuyo)}施設・${fmt(pFirst.tokuyo_cap)}人）から定員は${fmtSigned(pct(pNow.tokuyo_cap, pFirst.tokuyo_cap), '%')}。有料老人ホームは${fmt(pNow.yuryo)}施設・定員${fmt(pNow.yuryo_cap)}人で、同期間に${fmtSigned(pct(pNow.yuryo_cap, pFirst.yuryo_cap), '%')}。`;
  return (
    <>
      <Breadcrumb items={[{ name: '介護施設・国保' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/welfare/" keywords={['岩手県', '特別養護老人ホーム', '介護老人福祉施設', '有料老人ホーム', '定員', '国民健康保険', '市町村別']} temporal={`${FIRST_WEL}/${LATEST_WEL}`} sourceKeys={['welfare']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の介護老人福祉施設（特別養護老人ホーム）は{LATEST_WEL}年に<strong>{fmt(pNow.tokuyo)}施設・定員{fmt(pNow.tokuyo_cap)}人</strong>（{FIRST_WEL}年比{fmtSigned(pct(pNow.tokuyo_cap, pFirst.tokuyo_cap), '%')}）。有料老人ホームは<strong>{fmt(pNow.yuryo)}施設・定員{fmt(pNow.yuryo_cap)}人</strong>で同{fmtSigned(pct(pNow.yuryo_cap, pFirst.yuryo_cap), '%')}と大きく増えた。65歳以上人口千人当たりの特養定員が最も多いのは<strong>{byE[0].m.name}（{fmt(byE[0].capE)}人）</strong>。有料老人ホームが1施設もないのは<strong>{noYuryo.length}市町村</strong>。国民健康保険被保険者数は{fmt(pNow.kokuho)}人（{FIRST_WEL}年比{fmtSigned(pct(pNow.kokuho, pFirst.kokuho), '%')}）。</p>
      <LineChart title={`岩手県の老人ホーム定員（${FIRST_WEL}〜${LATEST_WEL}年、人）`} unit="人" zero
        series={[
          { label: '特別養護老人ホーム', points: WEL_YEARS.map(y => ({ x: y, y: welPrefAt(y).tokuyo_cap ?? 0 })) },
          { label: '有料老人ホーム', points: WEL_YEARS.map(y => ({ x: y, y: welPrefAt(y).yuryo_cap ?? 0 })) },
        ]} />
      <LineChart title={`岩手県の国民健康保険被保険者数（${FIRST_WEL}〜${LATEST_WEL}年、人）`} unit="人" zero
        series={[{ label: '国保被保険者', points: WEL_YEARS.map(y => ({ x: y, y: welPrefAt(y).kokuho ?? 0 })) }]} />
      <BarChart title={`特別養護老人ホームの定員（${LATEST_WEL}年、市町村別）`} items={byCap.map(r => ({ label: r.m.name, value: r.r.tokuyo_cap }))} unit="人" />
      <BarChart title={`65歳以上人口千人当たりの特養定員（${LATEST_WEL}年定員 ÷ ${LATEST_CENSUS}年国勢調査の65歳以上人口）`} items={byE.map(r => ({ label: r.m.name, value: r.capE }))} unit="人" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>特養 {LATEST_WEL}年</th><th>定員</th><th>順位</th><th>高齢者千人当たり</th><th>順位</th><th>{FIRST_WEL}年の定員</th><th>有料老人ホーム</th><th>定員</th><th>順位</th><th>国保被保険者</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.tokuyo)}</td><td>{fmt(pNow.tokuyo_cap)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pFirst.tokuyo_cap)}</td><td>{fmt(pNow.yuryo)}</td><td>{fmt(pNow.yuryo_cap)}</td><td>—</td><td>{fmt(pNow.kokuho)}</td></tr>
            {byCap.map(r => (
              <tr key={r.m.code}><td><Link href={`/welfare/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.tokuyo)}</td><td>{fmt(r.r.tokuyo_cap)}</td><td>{rC.get(r) ?? '—'}位</td>
                <td>{fmt(r.capE)}</td><td>{rE.get(r) ?? '—'}位</td><td>{fmt(r.r0.tokuyo_cap)}</td>
                <td>{fmt(r.r.yuryo)}</td><td>{fmt(r.r.yuryo_cap)}</td><td>{rY.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.kokuho)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = welAt(m.code, LATEST_WEL)!; return <li key={m.code}><Link href={`/welfare/${m.slug}/`}>{m.name}の介護施設<small>{LATEST_WEL}年 特養{fmt(r.tokuyo)}施設・定員{fmt(r.tokuyo_cap)}人</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/welfare/" sentence={sentence} />
      <SourceBox keys={['welfare']} extra={[
        `施設数・定員は${WEL_SWITCH_YEAR - 1}年までが詳細票、${WEL_SWITCH_YEAR}年以降が基本票。市区町村別はこの切替でしか全期間つながらない。両票は定員がわずかに異なるため、${WEL_SWITCH_YEAR}年の前後をまたぐ変化には切替分が含まれる。`,
        '「介護老人福祉施設」は特別養護老人ホームのこと。介護老人保健施設（老健）は別の施設種別で、この表には含まれない。',
        `高齢者千人当たりは、${LATEST_WEL}年の定員を${LATEST_CENSUS}年国勢調査の65歳以上人口で割った本サイトの計算値。時点が異なる点に注意。`,
        '国民健康保険被保険者数は各年度末。後期高齢者医療制度（75歳以上）の対象者は含まれない。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と一致することを確認している。',
      ]} />
    </>
  );
}
