import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, envAt, envPrefAt, envPrefPerDay, fmt, fmtSigned, pct, rank, ENV_YEARS, LATEST_ENV, FIRST_ENV } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村のごみ排出量・リサイクル率（${FIRST_ENV}〜${LATEST_ENV}年度）`;
const pNow = envPrefAt(LATEST_ENV);
const pFirst = envPrefAt(FIRST_ENV);
export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県のごみ総排出量は${LATEST_ENV}年度に${fmt(pNow.gomi_total)}t、1人1日当たり${fmt(envPrefPerDay(LATEST_ENV))}g。33市町村別のごみ排出量・1人1日当たり・リサイクル率・最終処分量・水洗化率を一覧。`,
  alternates: { canonical: '/garbage/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = envAt(m.code, LATEST_ENV)!, r0 = envAt(m.code, FIRST_ENV)!;
    return { m, r, r0 };
  });
  const rT = rank(rows, r => r.r.gomi_total), rP = rank(rows, r => r.r.gomi_per_day), rR = rank(rows, r => r.r.recycle_rate), rF = rank(rows, r => r.r.flush_rate);
  const byT = [...rows].sort((a, b) => (b.r.gomi_total ?? 0) - (a.r.gomi_total ?? 0));
  const byP = [...rows].filter(r => r.r.gomi_per_day != null).sort((a, b) => b.r.gomi_per_day! - a.r.gomi_per_day!);
  const byR = [...rows].filter(r => r.r.recycle_rate != null).sort((a, b) => b.r.recycle_rate! - a.r.recycle_rate!);
  const perDay = envPrefPerDay(LATEST_ENV), perDay0 = envPrefPerDay(FIRST_ENV);
  const sentence = `岩手県33市町村のごみ総排出量は${LATEST_ENV}年度に${fmt(pNow.gomi_total)}tで、${FIRST_ENV}年度（${fmt(pFirst.gomi_total)}t）から${fmtSigned(pct(pNow.gomi_total, pFirst.gomi_total), '%')}。1人1日当たりは${fmt(perDay)}gで、市町村別で最も少ないのは${byP[byP.length - 1].m.name}（${fmt(byP[byP.length - 1].r.gomi_per_day)}g）、リサイクル率が最も高いのは${byR[0].m.name}（${fmt(byR[0].r.recycle_rate)}%）。`;
  return (
    <>
      <Breadcrumb items={[{ name: 'ごみ・生活インフラ' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/garbage/" keywords={['岩手県', 'ごみ排出量', 'リサイクル率', '最終処分量', '1人1日当たりごみ', '水洗化率', '市町村別']} temporal={`${FIRST_ENV}/${LATEST_ENV}`} sourceKeys={['env']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県33市町村のごみ総排出量は{LATEST_ENV}年度に<strong>{fmt(pNow.gomi_total)}t</strong>（{FIRST_ENV}年度比{fmtSigned(pct(pNow.gomi_total, pFirst.gomi_total), '%')}）。1人1日当たりは<strong>{fmt(perDay)}g</strong>（{FIRST_ENV}年度{fmt(perDay0)}g）、最終処分量は{fmt(pNow.landfill)}t。1人1日当たりが最も多いのは<strong>{byP[0].m.name}（{fmt(byP[0].r.gomi_per_day)}g）</strong>、最も少ないのは<strong>{byP[byP.length - 1].m.name}（{fmt(byP[byP.length - 1].r.gomi_per_day)}g）</strong>。リサイクル率が最も高いのは<strong>{byR[0].m.name}（{fmt(byR[0].r.recycle_rate)}%）</strong>。</p>
      <LineChart title={`岩手県33市町村のごみ総排出量と最終処分量（${FIRST_ENV}〜${LATEST_ENV}年度、t）`} unit="t" zero
        series={[
          { label: 'ごみ総排出量', points: ENV_YEARS.map(y => ({ x: y, y: envPrefAt(y).gomi_total ?? 0 })) },
          { label: '最終処分量', points: ENV_YEARS.map(y => ({ x: y, y: envPrefAt(y).landfill ?? 0 })) },
        ]} />
      <BarChart title={`1人1日当たりのごみ排出量（${LATEST_ENV}年度、g）`} items={byP.map(r => ({ label: r.m.name, value: r.r.gomi_per_day }))} unit="g" />
      <BarChart title={`リサイクル率（${LATEST_ENV}年度、%）`} items={byR.map(r => ({ label: r.m.name, value: r.r.recycle_rate }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>ごみ総排出量 {LATEST_ENV}年度</th><th>順位</th><th>{FIRST_ENV}年度比</th><th>1人1日当たり</th><th>順位</th><th>リサイクル率</th><th>順位</th><th>最終処分量</th><th>水洗化率</th><th>順位</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(pNow.gomi_total)}</td><td>—</td><td>{fmtSigned(pct(pNow.gomi_total, pFirst.gomi_total), '%')}</td><td>{fmt(perDay)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(pNow.landfill)}</td><td>—</td><td>—</td></tr>
            {byT.map(r => (
              <tr key={r.m.code}><td><Link href={`/garbage/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.r.gomi_total)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td className={pct(r.r.gomi_total, r.r0.gomi_total)! < 0 ? 'neg' : 'pos'}>{fmtSigned(pct(r.r.gomi_total, r.r0.gomi_total), '%')}</td>
                <td>{fmt(r.r.gomi_per_day)}</td><td>{rP.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.recycle_rate)}%</td><td>{rR.get(r) ?? '—'}位</td>
                <td>{fmt(r.r.landfill)}</td><td>{fmt(r.r.flush_rate)}%</td><td>{rF.get(r) ?? '—'}位</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = envAt(m.code, LATEST_ENV)!; return <li key={m.code}><Link href={`/garbage/${m.slug}/`}>{m.name}のごみ<small>{LATEST_ENV}年度 {fmt(r.gomi_total)}t・1人1日{fmt(r.gomi_per_day)}g</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/garbage/" sentence={sentence} />
      <SourceBox keys={['env']} extra={[
        '「ごみ総排出量」は計画収集量＋直接搬入量＋自家処理量＋集団回収量。年度の値。',
        '1人1日当たり排出量とリサイクル率、水洗化率は市町村ごとの公表値。市町村をまたいで平均・合算はできないため、「岩手県（33市町村計）」欄の1人1日当たりは、33市町村の総排出量を計画収集人口で割った本サイトの計算値。',
        '「岩手県（33市町村計）」のごみ総排出量・最終処分量・計画収集人口・非水洗化人口は、総務省統計局が公表する岩手県の値と一致することを確認している。',
      ]} />
    </>
  );
}
