import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, eduAt, eduSeries, eduPrefAt, eduShare, fmt, fmtSigned, pct, rank, LATEST_EDU, FIRST_EDU } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = eduAt(m.code, LATEST_EDU)!;
  return {
    title: `${m.name}の最終学歴・大卒率（${FIRST_EDU}・${LATEST_EDU}年）`,
    description: `${m.name}（岩手県）の大学・大学院卒業者は${LATEST_EDU}年に${fmt(r.grad_univ)}人、大卒率は${fmt(eduShare(r.grad_univ, r.grad_total))}%。県内33市町村の順位つきで国勢調査から集計。`,
    alternates: { canonical: `/education/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = eduSeries(m.code);
  const r = eduAt(m.code, LATEST_EDU)!, r0 = eduAt(m.code, FIRST_EDU)!;
  const pref = eduPrefAt(LATEST_EDU);
  const u = eduShare(r.grad_univ, r.grad_total), u0 = eduShare(r0.grad_univ, r0.grad_total);
  const prefU = eduShare(pref.grad_univ, pref.grad_total);
  const c = eduShare(r.grad_col, r.grad_total), h = eduShare(r.grad_hs, r.grad_total), j = eduShare(r.grad_jhs, r.grad_total);
  const rows = MUNIS.map(mm => { const x = eduAt(mm.code, LATEST_EDU)!; return { m: mm, u: eduShare(x.grad_univ, x.grad_total), n: x.grad_univ, h: eduShare(x.grad_hs, x.grad_total) }; });
  const rU = rank(rows, x => x.u), rN = rank(rows, x => x.n);
  const me = rows.find(x => x.m.code === m.code)!;
  const title = `${m.name}の最終学歴・大卒率（${FIRST_EDU}・${LATEST_EDU}年）`;
  const sentence = `${m.name}の大学・大学院卒業者は${LATEST_EDU}年に${fmt(r.grad_univ)}人で、卒業者${fmt(r.grad_total)}人に占める割合（大卒率）は${fmt(u)}%。岩手県内33市町村中${rU.get(me) ?? '—'}位（県平均${fmt(prefU)}%）で、${FIRST_EDU}年の${fmt(u0)}%から${fmtSigned(Math.round(((u ?? 0) - (u0 ?? 0)) * 10) / 10, 'ポイント')}。短大・高専卒は${fmt(c)}%、高校・旧中卒は${fmt(h)}%、小中学校卒は${fmt(j)}%。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '最終学歴・大卒率', href: '/education/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/education/${m.slug}/`}
        keywords={[m.name, '最終学歴', '大卒率', '大学卒業者', '短大', '高専', '学歴', '国勢調査', '岩手県']} temporal={`${FIRST_EDU}/${LATEST_EDU}`} sourceKeys={['education']} />
      <h1>{title}</h1>
      <MuniStrip family="education" current={m.code} />
      <p className="key-fact">
        {m.name}の大学・大学院卒業者は{LATEST_EDU}年に<strong>{fmt(r.grad_univ)}人</strong>、卒業者に占める割合は<strong>{fmt(u)}%</strong>で岩手県内<strong>{rU.get(me) ?? '—'}位</strong>（県平均{fmt(prefU)}%）。
        {FIRST_EDU}年の{fmt(u0)}%から<strong>{fmtSigned(Math.round(((u ?? 0) - (u0 ?? 0)) * 10) / 10, 'ポイント')}</strong>。短大・高専卒{fmt(c)}%、高校・旧中卒{fmt(h)}%、小中学校卒{fmt(j)}%。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">大卒率（{LATEST_EDU}年）</div><div className="stat-value">{fmt(u)}</div><div className="stat-sub">%・県内 {rU.get(me) ?? '—'}位（県平均 {fmt(prefU)}%）</div></div>
        <div className="stat"><div className="stat-label">大学・大学院卒</div><div className="stat-value">{fmt(r.grad_univ)}</div><div className="stat-sub">人・県内 {rN.get(me) ?? '—'}位・{FIRST_EDU}年比 {fmtSigned(pct(r.grad_univ, r0.grad_univ), '%')}</div></div>
        <div className="stat"><div className="stat-label">短大・高専卒</div><div className="stat-value">{fmt(r.grad_col)}</div><div className="stat-sub">人・{fmt(c)}%</div></div>
        <div className="stat"><div className="stat-label">高校・旧中卒</div><div className="stat-value">{fmt(r.grad_hs)}</div><div className="stat-sub">人・{fmt(h)}%</div></div>
        <div className="stat"><div className="stat-label">小学校・中学校卒</div><div className="stat-value">{fmt(r.grad_jhs)}</div><div className="stat-sub">人・{fmt(j)}%・{FIRST_EDU}年比 {fmtSigned(pct(r.grad_jhs, r0.grad_jhs), '%')}</div></div>
        <div className="stat"><div className="stat-label">卒業者総数</div><div className="stat-value">{fmt(r.grad_total)}</div><div className="stat-sub">人・{FIRST_EDU}年比 {fmtSigned(pct(r.grad_total, r0.grad_total), '%')}</div></div>
      </div>
      <Tools family="education" slug={m.slug} label={`${m.name}の全年データ`} />
      <BarChart title={`${m.name}の最終学歴別 構成比（${LATEST_EDU}年、%）`} unit="%"
        items={[
          { label: '小学校・中学校', value: j },
          { label: '高校・旧中', value: h },
          { label: '短大・高専', value: c },
          { label: '大学・大学院', value: u },
        ]} />
      <h2>年次データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>卒業者総数</th><th>小中学校卒</th><th>高校・旧中卒</th><th>短大・高専卒</th><th>大学・大学院卒</th><th>大卒率</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年</td><td>{fmt(x.grad_total)}</td><td>{fmt(x.grad_jhs)}</td><td>{fmt(x.grad_hs)}</td>
                <td>{fmt(x.grad_col)}</td><td>{fmt(x.grad_univ)}</td><td>{fmt(eduShare(x.grad_univ, x.grad_total))}%</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/jobless/${m.slug}/`}>{m.name}の完全失業率</Link></li>
        <li><Link href={`/school/${m.slug}/`}>{m.name}の学校・児童生徒数</Link></li>
        <li><Link href={`/work/${m.slug}/`}>{m.name}の産業別就業者</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <Cta muni={m.name} topic="大卒率" />
      <CiteBox title={title} path={`/education/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['education']} extra={[
        '「卒業者総数」は15歳以上人口から在学者・未就学者・学歴不詳を除いた数。分母が異なるため、15歳以上人口に対する比率とは一致しない。',
        '「大卒率」などの構成比は各区分÷卒業者総数で、本サイトの計算値。',
        '最終学歴は国勢調査で10年ごと（西暦末尾0の年）にしか調査されないため、2010年と2020年の2時点のみ。',
        'その市町村に住む人の学歴であり、出身地や勤務地ではない。進学・就職での転出入が数字に強く影響する。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
