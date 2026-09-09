import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, houjinAt, houjinNewAt, houjinClosedAt, houjinPref, houjinNewPref, houjinClosedPref, corpsPerKpop, yugenShare, fmt, rank, HOUJIN_KINDS, HOUJIN_YEARS, HOUJIN_ASOF_LABEL, FIRST_HOUJIN_YEAR, LATEST_HOUJIN_YEAR, LATEST_POP } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県33市町村の法人数（${HOUJIN_ASOF_LABEL}時点・株式会社／有限会社／合同会社）`;
const T = houjinPref();
const CLOSED = houjinClosedPref();

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県に登記されている法人は${HOUJIN_ASOF_LABEL}時点で${fmt(T)}社。株式会社${fmt(houjinPref('株式会社'))}・有限会社${fmt(houjinPref('有限会社'))}・合同会社${fmt(houjinPref('合同会社'))}。国税庁の法人番号公表サイトの全件データから、33市町村別の法人数・人口千人当たり・新設数を一覧。`,
  alternates: { canonical: '/houjin/' },
};

const MAIN = ['株式会社', '有限会社', '合同会社', '合資会社', 'その他の設立登記法人'];

export default function Page() {
  const rows = MUNIS.map(m => ({
    m, n: houjinAt(m.code), per: corpsPerKpop(houjinAt(m.code), m.code),
    yug: yugenShare(m.code), closed: houjinClosedAt(m.code),
    recent: HOUJIN_YEARS.reduce((a, y) => a + houjinNewAt(m.code, y), 0),
  }));
  const rT = rank(rows, r => r.n), rP = rank(rows, r => r.per), rY = rank(rows, r => r.yug);
  const byTotal = [...rows].sort((a, b) => b.n - a.n);
  const byPer = [...rows].filter(r => r.per != null).sort((a, b) => b.per! - a.per!);
  const byYug = [...rows].filter(r => r.yug != null).sort((a, b) => b.yug! - a.yug!);
  const newTotal = HOUJIN_YEARS.reduce((a, y) => a + houjinNewPref(y), 0);
  const prefYug = Math.round((houjinPref('有限会社') / T) * 1000) / 10;
  const sentence = `岩手県に登記されている法人は${HOUJIN_ASOF_LABEL}時点で${fmt(T)}社。株式会社${fmt(houjinPref('株式会社'))}社、有限会社${fmt(houjinPref('有限会社'))}社、合同会社${fmt(houjinPref('合同会社'))}社で、新設できなくなって20年たつ有限会社が全体の${fmt(prefYug)}%を占める。${FIRST_HOUJIN_YEAR}年以降に法人番号が指定された法人は${fmt(newTotal)}社。登記記録が閉鎖された法人は累計で${fmt(CLOSED)}社ある。`;
  return (
    <>
      <Breadcrumb items={[{ name: '法人数' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/houjin/" keywords={['岩手県', '法人数', '株式会社', '有限会社', '合同会社', '法人番号', '市町村別']} temporal={HOUJIN_ASOF_LABEL} sourceKeys={['houjin']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県に登記されている法人は{HOUJIN_ASOF_LABEL}時点で<strong>{fmt(T)}社</strong>（株式会社{fmt(houjinPref('株式会社'))}・有限会社{fmt(houjinPref('有限会社'))}・合同会社{fmt(houjinPref('合同会社'))}）。<strong>2006年に新設できなくなった有限会社が、いまも全体の{fmt(prefYug)}%を占める</strong>。{FIRST_HOUJIN_YEAR}年以降に新しく法人番号が指定されたのは{fmt(newTotal)}社。登記記録が閉鎖された法人は<strong>累計{fmt(CLOSED)}社</strong>（閉鎖時期は問わない）。法人数が最も多いのは<strong>{byTotal[0].m.name}（{fmt(byTotal[0].n)}社）</strong>、人口千人当たりでは<strong>{byPer[0].m.name}（{fmt(byPer[0].per)}社）</strong>。</p>
      <LineChart title={`岩手県で新しく法人番号が指定された法人の数（${FIRST_HOUJIN_YEAR}〜${LATEST_HOUJIN_YEAR}年、社）`} unit="社" zero
        series={[{ label: '新規指定', points: HOUJIN_YEARS.map(y => ({ x: y, y: houjinNewPref(y) })) }]} />
      <BarChart title={`法人種別ごとの数（岩手県、${HOUJIN_ASOF_LABEL}時点）`} items={HOUJIN_KINDS.map(k => ({ label: k, value: houjinPref(k) })).filter(x => x.value > 0)} unit="社" />
      <BarChart title={`法人数（${HOUJIN_ASOF_LABEL}時点、市町村別）`} items={byTotal.map(r => ({ label: r.m.name, value: r.n }))} unit="社" />
      <BarChart title={`人口千人当たりの法人数（市町村別）`} items={byPer.map(r => ({ label: r.m.name, value: r.per }))} unit="社" />
      <BarChart title={`有限会社が占める割合（市町村別、%）`} items={byYug.map(r => ({ label: r.m.name, value: r.yug }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>法人数</th><th>順位</th><th>千人当たり</th><th>順位</th><th>有限会社率</th><th>順位</th><th>{FIRST_HOUJIN_YEAR}年〜の新規</th><th>閉鎖</th>{MAIN.map(k => <th key={k}>{k}</th>)}</tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{fmt(T)}</td><td>—</td><td>—</td><td>—</td><td>{fmt(prefYug)}%</td><td>—</td><td>{fmt(newTotal)}</td><td>{fmt(CLOSED)}</td>{MAIN.map(k => <td key={k}>{fmt(houjinPref(k))}</td>)}</tr>
            {byTotal.map(r => (
              <tr key={r.m.code}><td><Link href={`/houjin/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{fmt(r.n)}</td><td>{rT.get(r) ?? '—'}位</td>
                <td>{fmt(r.per)}</td><td>{rP.get(r) ?? '—'}位</td>
                <td>{r.yug == null ? '—' : `${fmt(r.yug)}%`}</td><td>{rY.get(r) ?? '—'}位</td>
                <td>{fmt(r.recent)}</td><td>{fmt(r.closed)}</td>
                {MAIN.map(k => <td key={k}>{fmt(houjinAt(r.m.code, k))}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => <li key={m.code}><Link href={`/houjin/${m.slug}/`}>{m.name}の法人数<small>{fmt(houjinAt(m.code))}社・株式会社{fmt(houjinAt(m.code, '株式会社'))}</small></Link></li>)}</ul>
      <CiteBox title={TITLE} path="/houjin/" sentence={sentence} />
      <SourceBox keys={['houjin']} extra={[
        '登記されている法人の数であり、事業所の数でも「営業している会社」の数でもない。休眠会社や本店だけを置く法人も含まれる。事業所ベースの数字は「産業・事業所」（経済センサス）のページを参照。',
        '「現存」は登記記録の閉鎖等年月日が入っていない法人。「閉鎖」は解散・移転・合併などで登記記録が閉鎖された法人の累計で、倒産件数ではない。',
        `「${FIRST_HOUJIN_YEAR}年〜の新規」は法人番号の指定年月日がその年の法人の数。法人番号は2015年10月に既存法人へ一斉付番されたため、実質的な新設分を見るには2016年以降を使う必要がある。`,
        '有限会社は2006年の会社法施行で新設できなくなった。現存する有限会社はすべて2006年以前に設立された会社（特例有限会社）で、その割合は地域の会社構成の古さの目安になる。',
        `人口千人当たりは、法人数を${LATEST_POP}年1月1日の住民基本台帳人口で割った本サイトの計算値。`,
        '旧滝沢村（03305）で登記記録が閉鎖された法人1件は、滝沢市に合算している。',
      ]} />
    </>
  );
}
