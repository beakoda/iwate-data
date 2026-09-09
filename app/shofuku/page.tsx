import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, shofukuAt, shofukuPref, shofukuServicesOf, shofukuUrlRate, shofukuPer10k, fmt, rank, SHOFUKU_SERVICES, SHOFUKU_ASOF_LABEL, LATEST_POP } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の障害福祉サービス事業所数（${SHOFUKU_ASOF_LABEL}時点）`;
const P = shofukuPref();

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の障害福祉サービス事業所は${SHOFUKU_ASOF_LABEL}時点で${fmt(P.offices)}事業所。就労継続支援・放課後等デイサービス・共同生活援助など${SHOFUKU_SERVICES.length}のサービス種別ごとに、33市町村別の事業所数・ホームページ公表率・人口1万人当たりを一覧。`,
  alternates: { canonical: '/shofuku/' },
};

const MAIN = ['居宅介護', '重度訪問介護', '就労継続支援Ｂ型', '放課後等デイサービス', '共同生活援助', '生活介護', '計画相談支援', '児童発達支援'];

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = shofukuAt(m.code)!;
    return { m, r, per: shofukuPer10k(r.offices, m.code), rate: shofukuUrlRate(r) };
  });
  const rT = rank(rows, r => r.r.offices), rP = rank(rows, r => r.per), rR = rank(rows, r => r.rate);
  const byTotal = [...rows].sort((a, b) => b.r.offices - a.r.offices);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const svRank = SHOFUKU_SERVICES.map(s => ({ s, c: shofukuPref(s) })).filter(x => x.c.offices > 0).sort((a, b) => b.c.offices - a.c.offices);
  const sentence = `岩手県の障害福祉サービス事業所は${SHOFUKU_ASOF_LABEL}時点で${fmt(P.offices)}事業所で、ホームページを公表しているのは${fmt(shofukuUrlRate(P))}%。最も多い種別は${svRank[0].s}の${fmt(svRank[0].c.offices)}事業所。市町村別では${byTotal[0].m.name}が${fmt(byTotal[0].r.offices)}事業所で最も多く、人口1万人当たりでは${byPer[0].m.name}が${fmt(byPer[0].per)}事業所で最も多い。`;
  return (
    <>
      <Breadcrumb items={[{ name: '障害福祉サービス事業所' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/shofuku/" keywords={['岩手県', '障害福祉サービス', '就労継続支援', '放課後等デイサービス', 'グループホーム', '事業所数', '市町村別']} temporal={SHOFUKU_ASOF_LABEL} sourceKeys={['shofuku']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の障害福祉サービス事業所は{SHOFUKU_ASOF_LABEL}時点で<strong>{fmt(P.offices)}事業所</strong>（{SHOFUKU_SERVICES.length}種別）。ホームページを公表しているのは<strong>{fmt(P.with_url)}事業所・{fmt(shofukuUrlRate(P))}%</strong>。最も多い種別は<strong>{svRank[0].s}の{fmt(svRank[0].c.offices)}事業所</strong>、次いで{svRank[1].s}が{fmt(svRank[1].c.offices)}。市町村別では<strong>{byTotal[0].m.name}（{fmt(byTotal[0].r.offices)}事業所）</strong>が最多、人口1万人当たりでは<strong>{byPer[0].m.name}（{fmt(byPer[0].per)}事業所）</strong>。</p>
      <BarChart title={`サービス種別ごとの事業所数（岩手県、${SHOFUKU_ASOF_LABEL}時点）`} items={svRank.map(x => ({ label: x.s, value: x.c.offices }))} unit="事業所" />
      <BarChart title={`障害福祉サービス事業所数（${SHOFUKU_ASOF_LABEL}時点、市町村別）`} items={byTotal.map(r => ({ label: r.m.name, value: r.r.offices }))} unit="事業所" />
      <BarChart title={`人口1万人当たりの事業所数（市町村別）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} unit="事業所" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>全種別</th><th>順位</th><th>1万人当たり</th><th>順位</th><th>HP公表率</th><th>順位</th>{MAIN.map(s => <th key={s}>{s}</th>)}</tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(P.offices)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(shofukuUrlRate(P))}%</td><td>—</td>{MAIN.map(s => <td key={s}>{fmt(shofukuPref(s).offices)}</td>)}</tr>
            {byTotal.map(r => (
              <tr key={r.m.code}><td><Link href={`/shofuku/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.offices)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td>{fmt(r.per)}</td><td>{rP.get(r) ?? '—'}位</td>
                <td>{r.rate == null ? '—' : `${fmt(r.rate)}%`}</td><td>{rR.get(r) ?? '—'}位</td>
                {MAIN.map(s => <td key={s}>{fmt(shofukuAt(r.m.code, s)?.offices ?? 0)}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <h2>サービス種別ごとの県内合計</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>サービス種別</th><th>事業所</th><th>HP公表</th><th>公表率</th><th>実施市町村数</th></tr></thead>
          <tbody>
            {svRank.map(x => {
              const n = MUNIS.filter(m => (shofukuAt(m.code, x.s)?.offices ?? 0) > 0).length;
              return <tr key={x.s}><td className="wrap">{x.s}</td><td>{fmt(x.c.offices)}</td><td>{fmt(x.c.with_url)}</td>
                <td>{fmt(shofukuUrlRate(x.c))}%</td><td>{n} / 33</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = shofukuAt(m.code)!; return <li key={m.code}><Link href={`/shofuku/${m.slug}/`}>{m.name}の障害福祉サービス事業所<small>{fmt(r.offices)}事業所・{shofukuServicesOf(m.code).length}種別</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/shofuku/" sentence={sentence} />
      <SourceBox keys={['shofuku']} extra={[
        '各自治体が障害福祉サービス等情報公表システムに登録した事業所が対象。登録が反映されていない事業所は含まれない場合がある。',
        '1つの法人が同じ場所で複数のサービスを提供している場合、サービス種別ごとに別々の事業所として数える。「全種別」は延べ事業所数であり、建物や法人の数ではない。',
        '「HP公表」は事業所URLが登録されている事業所の数。持っていても登録していなければ0として数える。',
        `人口1万人当たりは、事業所数を${LATEST_POP}年1月1日の住民基本台帳人口で割った本サイトの計算値。`,
        '市町村は事業所住所の文字列から判定している（データに市区町村コードの列が無いため）。33市町村すべてに判定でき、判定できなかった事業所は0件。',
        '高齢者向けの介護サービス事業所は別ページ（介護サービス事業所）にある。制度が異なるため合算しないこと。',
      ]} />
    </>
  );
}
