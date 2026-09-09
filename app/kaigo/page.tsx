import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, kaigoAt, kaigoPrefAt, kaigoServicesOf, officesPerElderly, fmt, fmtSigned, pct, rank, KAIGO_SNAPS, KAIGO_SERVICES, LATEST_KAIGO, FIRST_KAIGO, kaigoLabel, LATEST_CENSUS } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の介護サービス事業所数（${kaigoLabel(LATEST_KAIGO)}時点・サービス種別ごと）`;
const pNow = kaigoPrefAt(LATEST_KAIGO);
const pFirst = kaigoPrefAt(FIRST_KAIGO);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の介護サービス事業所は${kaigoLabel(LATEST_KAIGO)}時点で${fmt(pNow.offices)}事業所。訪問介護・通所介護・グループホームなど${KAIGO_SERVICES.length}のサービス種別ごとに、33市町村別の事業所数と定員、高齢者千人当たりを一覧。厚生労働省の介護サービス情報公表システムの事業所個票から集計。`,
  alternates: { canonical: '/kaigo/' },
};

/** 一覧表に出す主要サービス（岩手県内の事業所数が多い順の上位） */
const MAIN = ['訪問介護', '通所介護', '居宅介護支援', '認知症対応型共同生活介護', '短期入所生活介護', '訪問看護', '介護老人福祉施設', '地域密着型通所介護'];

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = kaigoAt(m.code, LATEST_KAIGO)!, r0 = kaigoAt(m.code, FIRST_KAIGO)!;
    return { m, r, r0, per: officesPerElderly(r.offices, m.code, LATEST_CENSUS) };
  });
  const rT = rank(rows, r => r.r.offices), rP = rank(rows, r => r.per);
  const byTotal = [...rows].sort((a, b) => b.r.offices - a.r.offices);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const svRank = KAIGO_SERVICES.map(s => ({ s, c: kaigoPrefAt(LATEST_KAIGO, s) })).sort((a, b) => b.c.offices - a.c.offices);
  const gone = KAIGO_SERVICES.filter(s => kaigoPrefAt(FIRST_KAIGO, s).offices > 0 && kaigoPrefAt(LATEST_KAIGO, s).offices === 0);
  const sentence = `岩手県の介護サービス事業所は${kaigoLabel(LATEST_KAIGO)}時点で${fmt(pNow.offices)}事業所で、${kaigoLabel(FIRST_KAIGO)}（${fmt(pFirst.offices)}事業所）から${fmtSigned(pct(pNow.offices, pFirst.offices), '%')}。最も多い種別は${svRank[0].s}の${fmt(svRank[0].c.offices)}事業所。市町村別では${byTotal[0].m.name}が${fmt(byTotal[0].r.offices)}事業所で最も多く、65歳以上人口千人当たりでは${byPer[0].m.name}が${fmt(byPer[0].per)}事業所で最も多い。`;
  return (
    <>
      <Breadcrumb items={[{ name: '介護サービス事業所' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/kaigo/" keywords={['岩手県', '介護サービス', '訪問介護', '通所介護', 'グループホーム', '事業所数', '市町村別']} temporal={`${FIRST_KAIGO}/${LATEST_KAIGO}`} sourceKeys={['kaigo']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の介護サービス事業所は{kaigoLabel(LATEST_KAIGO)}時点で<strong>{fmt(pNow.offices)}事業所</strong>（{kaigoLabel(FIRST_KAIGO)}比{fmtSigned(pct(pNow.offices, pFirst.offices), '%')}）。最も多い種別は<strong>{svRank[0].s}の{fmt(svRank[0].c.offices)}事業所</strong>、次いで{svRank[1].s}が{fmt(svRank[1].c.offices)}。市町村別では<strong>{byTotal[0].m.name}（{fmt(byTotal[0].r.offices)}事業所）</strong>が最多だが、65歳以上人口千人当たりでは<strong>{byPer[0].m.name}（{fmt(byPer[0].per)}事業所）</strong>が最も手厚い。</p>
      <BarChart title={`サービス種別ごとの事業所数（岩手県、${kaigoLabel(LATEST_KAIGO)}時点）`} items={svRank.filter(x => x.c.offices > 0).map(x => ({ label: x.s, value: x.c.offices }))} unit="事業所" />
      <BarChart title={`介護サービス事業所数（${kaigoLabel(LATEST_KAIGO)}時点、市町村別）`} items={byTotal.map(r => ({ label: r.m.name, value: r.r.offices }))} unit="事業所" />
      <BarChart title={`65歳以上人口千人当たりの事業所数（${LATEST_CENSUS}年国勢調査の65歳以上人口が分母）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} unit="事業所" />
      <h2>市町村別（主要サービス）</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>全種別</th><th>順位</th><th>高齢者千人当たり</th><th>順位</th><th>{kaigoLabel(FIRST_KAIGO)}</th>{MAIN.map(s => <th key={s}>{s}</th>)}</tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.offices)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pFirst.offices)}</td>{MAIN.map(s => <td key={s}>{fmt(kaigoPrefAt(LATEST_KAIGO, s).offices)}</td>)}</tr>
            {byTotal.map(r => (
              <tr key={r.m.code}><td><Link href={`/kaigo/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.offices)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td>{fmt(r.per)}</td><td>{rP.get(r) ?? '—'}位</td><td>{fmt(r.r0.offices)}</td>
                {MAIN.map(s => <td key={s}>{fmt(kaigoAt(r.m.code, LATEST_KAIGO, s)?.offices ?? 0)}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <h2>サービス種別ごとの県内合計</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>サービス種別</th><th>{kaigoLabel(LATEST_KAIGO)}</th><th>{kaigoLabel(FIRST_KAIGO)}</th><th>増減</th><th>定員合計</th><th>実施市町村数</th></tr></thead>
          <tbody>
            {svRank.map(x => {
              const o = kaigoPrefAt(FIRST_KAIGO, x.s);
              const n = MUNIS.filter(m => (kaigoAt(m.code, LATEST_KAIGO, x.s)?.offices ?? 0) > 0).length;
              return <tr key={x.s}><td className="wrap">{x.s}</td><td>{fmt(x.c.offices)}</td><td>{fmt(o.offices)}</td>
                <td>{fmtSigned(x.c.offices - o.offices)}</td><td>{x.c.capacity ? fmt(x.c.capacity) : '—'}</td><td>{n} / 33</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = kaigoAt(m.code, LATEST_KAIGO)!; return <li key={m.code}><Link href={`/kaigo/${m.slug}/`}>{m.name}の介護サービス事業所<small>{kaigoLabel(LATEST_KAIGO)} {fmt(r.offices)}事業所・{kaigoServicesOf(m.code, LATEST_KAIGO).length}種別</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/kaigo/" sentence={sentence} />
      <SourceBox keys={['kaigo']} extra={[
        '公表システムに登録されている事業所を数えたもので、休止中・新規指定直後などで公表が反映されていない事業所は含まれない場合がある。指定事業所数の公式集計（介護サービス施設・事業所調査）とは一致しない。',
        '1つの法人が同じ住所で複数のサービスを提供している場合、サービス種別ごとに別々の事業所として数える。市町村の「全種別」の数は延べ事業所数であり、建物や法人の数ではない。',
        `定員は公表されている値の合計。訪問系・居宅介護支援など定員の概念がないサービスや、未記入の事業所は0として扱っているため、定員は施設系サービスでのみ意味を持つ。`,
        `高齢者千人当たりは、${kaigoLabel(LATEST_KAIGO)}時点の事業所数を${LATEST_CENSUS}年国勢調査の65歳以上人口で割った本サイトの計算値。時点が異なる点に注意。`,
        ...(gone.length ? [`${kaigoLabel(FIRST_KAIGO)}にはあり${kaigoLabel(LATEST_KAIGO)}に県内で0になった種別: ${gone.join('・')}。`] : []),
        '施設数・定員の時系列（2010年以降）は「介護施設・国保」のページ（社会福祉施設等調査）を参照。出典・調査時点が異なるため数値は一致しない。',
      ]} />
    </>
  );
}
