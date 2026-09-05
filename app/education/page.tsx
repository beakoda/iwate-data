import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, eduAt, eduPrefAt, eduShare, fmt, fmtSigned, pct, rank, EDU_YEARS, LATEST_EDU, FIRST_EDU } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の最終学歴・大卒率（${FIRST_EDU}・${LATEST_EDU}年）`;
const pNow = eduPrefAt(LATEST_EDU);
const pFirst = eduPrefAt(FIRST_EDU);
const prefUniv = eduShare(pNow.grad_univ, pNow.grad_total);
const prefUniv0 = eduShare(pFirst.grad_univ, pFirst.grad_total);

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県の大学・大学院卒業者は${LATEST_EDU}年に${fmt(pNow.grad_univ)}人、卒業者に占める割合は${fmt(prefUniv)}%。33市町村別に最終学歴（小中学校・高校・短大高専・大学大学院）の人口と構成比を国勢調査から一覧。`,
  alternates: { canonical: '/education/' },
};

export default function Page() {
  const rows = MUNIS.map(m => {
    const r = eduAt(m.code, LATEST_EDU)!, r0 = eduAt(m.code, FIRST_EDU)!;
    return { m, r, r0,
      u: eduShare(r.grad_univ, r.grad_total), u0: eduShare(r0.grad_univ, r0.grad_total),
      c: eduShare(r.grad_col, r.grad_total), h: eduShare(r.grad_hs, r.grad_total), j: eduShare(r.grad_jhs, r.grad_total) };
  });
  const rU = rank(rows, x => x.u), rH = rank(rows, x => x.h);
  const byU = [...rows].filter(x => x.u != null).sort((a, b) => b.u! - a.u!);
  const prefCol = eduShare(pNow.grad_col, pNow.grad_total);
  const prefHs = eduShare(pNow.grad_hs, pNow.grad_total);
  const prefJhs = eduShare(pNow.grad_jhs, pNow.grad_total);
  const sentence = `岩手県の大学・大学院卒業者は${LATEST_EDU}年に${fmt(pNow.grad_univ)}人で、卒業者${fmt(pNow.grad_total)}人に占める割合（大卒率）は${fmt(prefUniv)}%。${FIRST_EDU}年の${fmt(prefUniv0)}%から上昇した。市町村別で最も高いのは${byU[0].m.name}（${fmt(byU[0].u)}%）、最も低いのは${byU[byU.length - 1].m.name}（${fmt(byU[byU.length - 1].u)}%）。高校・旧中卒は${fmt(prefHs)}%、小中学校卒は${fmt(prefJhs)}%。`;
  return (
    <>
      <Breadcrumb items={[{ name: '最終学歴・大卒率' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/education/" keywords={['岩手県', '最終学歴', '大卒率', '大学卒業者', '短大', '高専', '学歴', '国勢調査', '市町村別']} temporal={`${FIRST_EDU}/${LATEST_EDU}`} sourceKeys={['education']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県の大学・大学院卒業者は{LATEST_EDU}年に<strong>{fmt(pNow.grad_univ)}人</strong>、卒業者{fmt(pNow.grad_total)}人に占める割合は<strong>{fmt(prefUniv)}%</strong>で、{FIRST_EDU}年の{fmt(prefUniv0)}%から{fmtSigned(Math.round(((prefUniv ?? 0) - (prefUniv0 ?? 0)) * 10) / 10, 'ポイント')}。市町村別で最も高いのは<strong>{byU[0].m.name}（{fmt(byU[0].u)}%）</strong>、最も低いのは<strong>{byU[byU.length - 1].m.name}（{fmt(byU[byU.length - 1].u)}%）</strong>。短大・高専卒は{fmt(prefCol)}%、高校・旧中卒は{fmt(prefHs)}%、小中学校卒は{fmt(prefJhs)}%。</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">大学・大学院卒（{LATEST_EDU}年）</div><div className="stat-value">{fmt(prefUniv)}</div><div className="stat-sub">%・{fmt(pNow.grad_univ)}人・{FIRST_EDU}年 {fmt(prefUniv0)}%</div></div>
        <div className="stat"><div className="stat-label">短大・高専卒</div><div className="stat-value">{fmt(prefCol)}</div><div className="stat-sub">%・{fmt(pNow.grad_col)}人</div></div>
        <div className="stat"><div className="stat-label">高校・旧中卒</div><div className="stat-value">{fmt(prefHs)}</div><div className="stat-sub">%・{fmt(pNow.grad_hs)}人</div></div>
        <div className="stat"><div className="stat-label">小学校・中学校卒</div><div className="stat-value">{fmt(prefJhs)}</div><div className="stat-sub">%・{fmt(pNow.grad_jhs)}人・{FIRST_EDU}年比 {fmtSigned(pct(pNow.grad_jhs, pFirst.grad_jhs), '%')}</div></div>
      </div>
      <BarChart title={`大学・大学院卒の割合（${LATEST_EDU}年、市町村別）`} items={byU.map(x => ({ label: x.m.name, value: x.u }))} unit="%" />
      <BarChart title={`大学・大学院卒業者数（${LATEST_EDU}年、人）`} items={[...rows].sort((a, b) => (b.r.grad_univ ?? 0) - (a.r.grad_univ ?? 0)).map(x => ({ label: x.m.name, value: x.r.grad_univ }))} unit="人" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>大卒率 {LATEST_EDU}年</th><th>順位</th><th>{FIRST_EDU}年</th><th>大学・大学院卒</th><th>短大・高専卒</th><th>高校・旧中卒</th><th>小中学校卒</th><th>卒業者総数</th></tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(prefUniv)}%</td><td>—</td><td>{fmt(prefUniv0)}%</td><td>{fmt(pNow.grad_univ)}</td><td>{fmt(pNow.grad_col)}</td><td>{fmt(pNow.grad_hs)}</td><td>{fmt(pNow.grad_jhs)}</td><td>{fmt(pNow.grad_total)}</td></tr>
            {byU.map(x => (
              <tr key={x.m.code}><td><Link href={`/education/${x.m.slug}/`}>{x.m.name}</Link></td>
                <td>{fmt(x.u)}%</td><td>{rU.get(x) ?? '—'}位</td><td>{fmt(x.u0)}%</td>
                <td>{fmt(x.r.grad_univ)}</td><td>{fmt(x.r.grad_col)}</td><td>{fmt(x.r.grad_hs)}</td><td>{fmt(x.r.grad_jhs)}</td><td>{fmt(x.r.grad_total)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => { const r = eduAt(m.code, LATEST_EDU)!; return <li key={m.code}><Link href={`/education/${m.slug}/`}>{m.name}の最終学歴<small>{LATEST_EDU}年 大卒率{fmt(eduShare(r.grad_univ, r.grad_total))}%・{fmt(r.grad_univ)}人</small></Link></li>; })}</ul>
      <CiteBox title={TITLE} path="/education/" sentence={sentence} />
      <SourceBox keys={['education']} extra={[
        '「卒業者総数」は15歳以上人口から在学者・未就学者・学歴不詳を除いた数。分母が異なるため、15歳以上人口に対する比率とは一致しない。',
        '「大卒率」などの構成比は各区分÷卒業者総数で、本サイトの計算値。',
        '最終学歴は国勢調査で10年ごと（西暦末尾0の年）にしか調査されないため、2010年と2020年の2時点のみ。',
        'その市町村に住む人の学歴であり、出身地や勤務地ではない。',
        '「岩手県（33市町村計）」は市町村別の値の合計。総務省統計局が公表する岩手県の値と全5区分・両年で一致することを確認している。',
      ]} />
    </>
  );
}
