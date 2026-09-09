import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, iryouAt, iryouPref, urlRate, facPer10k, fmt, rank, IRYOU_TYPES, IRYOU_ASOF_LABEL } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の病院・診療所・歯科・薬局の数とホームページ公表率（${IRYOU_ASOF_LABEL}時点）`;
const pAll = iryouPref();
const pRate = urlRate(pAll);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の医療機関・薬局は${IRYOU_ASOF_LABEL}時点で${fmt(pAll.facilities)}施設。うちホームページを届け出ているのは${fmt(pAll.with_url)}施設（${fmt(pRate)}%）。病院・診療所・歯科・薬局・助産所の種別ごとに、33市町村別の施設数・HP公表率・人口1万人当たりを一覧。`,
  alternates: { canonical: '/iryou/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = iryouAt(m.code)!;
    return { m, r, rate: urlRate(r), per: facPer10k(r.facilities, m.code) };
  });
  const rT = rank(rows, r => r.r.facilities), rP = rank(rows, r => r.per), rR = rank(rows, r => r.rate);
  const byTotal = [...rows].sort((a, b) => b.r.facilities - a.r.facilities);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const byRate = [...rows].filter(r => r.rate != null).sort((a, b) => b.rate! - a.rate!);
  const dent = iryouPref('歯科'), clinic = iryouPref('診療所'), hosp = iryouPref('病院'), ph = iryouPref('薬局');
  const sentence = `岩手県の医療機関・薬局は${IRYOU_ASOF_LABEL}時点で${fmt(pAll.facilities)}施設（病院${fmt(hosp.facilities)}・診療所${fmt(clinic.facilities)}・歯科${fmt(dent.facilities)}・薬局${fmt(ph.facilities)}）。ホームページを届け出ている施設は全体の${fmt(pRate)}%で、病院は${fmt(urlRate(hosp))}%ある一方、歯科は${fmt(urlRate(dent))}%にとどまる。`;
  return (
    <>
      <Breadcrumb items={[{ name: '医療機関・薬局' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/iryou/" keywords={['岩手県', '病院', '診療所', '歯科医院', '薬局', 'ホームページ', '医療情報ネット', '市町村別']} temporal={IRYOU_ASOF_LABEL} sourceKeys={['iryou']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の医療機関・薬局は{IRYOU_ASOF_LABEL}時点で<strong>{fmt(pAll.facilities)}施設</strong>（病院{fmt(hosp.facilities)}・診療所{fmt(clinic.facilities)}・歯科{fmt(dent.facilities)}・薬局{fmt(ph.facilities)}・助産所{fmt(iryouPref('助産所').facilities)}）。案内用ホームページを届け出ているのは<strong>{fmt(pAll.with_url)}施設・{fmt(pRate)}%</strong>。<strong>病院は{fmt(urlRate(hosp))}%</strong>が公表しているのに対し、<strong>歯科は{fmt(urlRate(dent))}%</strong>、診療所は{fmt(urlRate(clinic))}%、薬局は{fmt(urlRate(ph))}%にとどまる。施設数が最も多いのは{byTotal[0].m.name}（{fmt(byTotal[0].r.facilities)}施設）だが、人口1万人当たりでは{byPer[0].m.name}（{fmt(byPer[0].per)}施設）が最も多い。</p>
      <BarChart title={`施設種別ごとのホームページ公表率（岩手県、${IRYOU_ASOF_LABEL}時点、%）`} items={IRYOU_TYPES.map(t => ({ label: t, value: urlRate(iryouPref(t)) }))} unit="%" />
      <BarChart title={`医療機関・薬局の数（${IRYOU_ASOF_LABEL}時点、市町村別）`} items={byTotal.map(r => ({ label: r.m.name, value: r.r.facilities }))} unit="施設" />
      <BarChart title={`人口1万人当たりの施設数（市町村別）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} unit="施設" />
      <BarChart title={`ホームページ公表率（市町村別、%）`} items={byRate.map(r => ({ label: r.m.name, value: r.rate }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>合計</th><th>順位</th><th>人口1万人当たり</th><th>順位</th><th>HP公表</th><th>公表率</th><th>順位</th>{IRYOU_TYPES.map(t => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pAll.facilities)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pAll.with_url)}</td><td>{fmt(pRate)}%</td><td>—</td>{IRYOU_TYPES.map(t => <td key={t}>{fmt(iryouPref(t).facilities)}</td>)}</tr>
            {byTotal.map(r => (
              <tr key={r.m.code}><td><Link href={`/iryou/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.facilities)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td>{fmt(r.per)}</td><td>{rP.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.with_url)}</td><td>{r.rate == null ? '—' : `${fmt(r.rate)}%`}</td><td>{rR.get(r) ?? '—'}位</td>
                {IRYOU_TYPES.map(t => <td key={t}>{fmt(iryouAt(r.m.code, t)?.facilities ?? 0)}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <h2>施設種別ごとの県内合計</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>施設種別</th><th>施設数</th><th>HPを届け出ている施設</th><th>公表率</th><th>1施設もない市町村</th></tr></thead>
          <tbody>
            {IRYOU_TYPES.map(t => {
              const c = iryouPref(t);
              const zero = MUNIS.filter(m => (iryouAt(m.code, t)?.facilities ?? 0) === 0);
              return <tr key={t}><td>{t}</td><td>{fmt(c.facilities)}</td><td>{fmt(c.with_url)}</td><td>{fmt(urlRate(c))}%</td>
                <td className="wrap">{zero.length ? `${zero.length}（${zero.map(m => m.name).join('・')}）` : '—'}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = iryouAt(m.code)!; return <li key={m.code}><Link href={`/iryou/${m.slug}/`}>{m.name}の病院・歯科・薬局<small>{fmt(r.facilities)}施設・HP公表 {fmt(urlRate(r))}%</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/iryou/" sentence={sentence} />
      <SourceBox keys={['iryou']} extra={[
        '医療機能情報提供制度・薬局機能情報提供制度に届出のある施設が対象。休止中や届出前の施設は含まれない。厚生労働省「医療施設調査」の施設数（本サイトの「病院・医師」「歯科診療所」ページ）とは定義も時点も異なるため一致しない。',
        '「HP公表」は、施設が案内用ホームページアドレス（薬局は薬局のホームページアドレス）を届け出ている施設の数。ホームページを持っていても届け出ていなければ0として数えるため、実際の保有率はこれより高い可能性がある。逆に、届出URLが現在も生きているかまでは確認していない。',
        '「診療所」は歯科を除く一般診療所。歯科診療所は「歯科」として別に数えている。',
        `人口1万人当たりは、施設数を住民基本台帳人口で割った本サイトの計算値。`,
        '市区町村コードが空欄の施設が1件（歯科）あり、届け出られている所在地から市町村を判定して算入している。',
      ]} />
    </>
  );
}
