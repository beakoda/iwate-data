import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, houjinAt, houjinNewAt, houjinClosedAt, houjinPref, houjinNewPref, houjinClosedPref, corpsPerKpop, yugenShare, popAt, econAt, fmt, rank, HOUJIN_KINDS, HOUJIN_YEARS, HOUJIN_ASOF_LABEL, FIRST_HOUJIN_YEAR, LATEST_HOUJIN_YEAR, LATEST_POP } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!;
  return {
    title: `${m.name}の法人数（${HOUJIN_ASOF_LABEL}時点）`,
    description: `${m.name}（岩手県）に登記されている法人は${HOUJIN_ASOF_LABEL}時点で${fmt(houjinAt(m.code))}社。株式会社${fmt(houjinAt(m.code, '株式会社'))}・有限会社${fmt(houjinAt(m.code, '有限会社'))}・合同会社${fmt(houjinAt(m.code, '合同会社'))}。人口千人当たりと県内33市町村の順位、${FIRST_HOUJIN_YEAR}年以降の新設数を国税庁の法人番号データから集計。`,
    alternates: { canonical: `/houjin/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const n = houjinAt(m.code), per = corpsPerKpop(n, m.code), yug = yugenShare(m.code);
  const closed = houjinClosedAt(m.code);
  const recent = HOUJIN_YEARS.reduce((a, y) => a + houjinNewAt(m.code, y), 0);
  const rows = MUNIS.map(mm => ({ m: mm, n: houjinAt(mm.code), per: corpsPerKpop(houjinAt(mm.code), mm.code), yug: yugenShare(mm.code) }));
  const rT = rank(rows, x => x.n), rP = rank(rows, x => x.per), rY = rank(rows, x => x.yug);
  const me = rows.find(x => x.m.code === m.code)!;
  const T = houjinPref();
  const prefPop = MUNIS.reduce((a, x) => a + (popAt(x.code, LATEST_POP)?.total ?? 0), 0);
  const prefPer = prefPop ? Math.round((T / prefPop) * 1000 * 10) / 10 : null;
  const prefYug = Math.round((houjinPref('有限会社') / T) * 1000) / 10;
  const pop = popAt(m.code, LATEST_POP);
  const estab = econAt(m.code, 'AR')?.['2021']?.estab ?? null;
  const kinds = HOUJIN_KINDS.map(k => ({ k, n: houjinAt(m.code, k) })).filter(x => x.n > 0);
  const title = `${m.name}の法人数（${HOUJIN_ASOF_LABEL}時点）`;
  const sentence = `${m.name}に登記されている法人は${HOUJIN_ASOF_LABEL}時点で${fmt(n)}社で、人口千人当たり${fmt(per)}社（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPer)}社）。株式会社${fmt(houjinAt(m.code, '株式会社'))}社、有限会社${fmt(houjinAt(m.code, '有限会社'))}社（全体の${fmt(yug)}%）。${FIRST_HOUJIN_YEAR}年以降に新しく法人番号が指定されたのは${fmt(recent)}社。`;
  return (
    <>
      <Breadcrumb items={[{ name: '法人数', href: '/houjin/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/houjin/${m.slug}/`}
        keywords={[m.name, '法人数', '株式会社', '有限会社', '合同会社', '法人番号', '岩手県']} temporal={HOUJIN_ASOF_LABEL} sourceKeys={['houjin']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}に登記されている法人は{HOUJIN_ASOF_LABEL}時点で<strong>{fmt(n)}社</strong>。
        人口千人当たり<strong>{fmt(per)}社</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}社）。
        有限会社が<strong>{fmt(yug)}%</strong>（県平均{fmt(prefYug)}%、県内{rY.get(me) ?? '—'}位）を占める。
        {FIRST_HOUJIN_YEAR}年以降の新規は{fmt(recent)}社。登記記録が閉鎖された法人は累計{fmt(closed)}社。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">法人数（{HOUJIN_ASOF_LABEL}）</div><div className="stat-value">{fmt(n)}</div><div className="stat-sub">社・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口千人当たり</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">社・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPer)}）</div></div>
        <div className="stat"><div className="stat-label">有限会社の割合</div><div className="stat-value">{yug == null ? '—' : `${fmt(yug)}%`}</div><div className="stat-sub">{fmt(houjinAt(m.code, '有限会社'))}社・県平均 {fmt(prefYug)}%</div></div>
        <div className="stat"><div className="stat-label">{FIRST_HOUJIN_YEAR}年以降の新規</div><div className="stat-value">{fmt(recent)}</div><div className="stat-sub">社・閉鎖 {fmt(closed)}社</div></div>
        {pop && <div className="stat"><div className="stat-label">人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(pop.total)}</div><div className="stat-sub">人 → <Link href={`/population/${m.slug}/`}>人口の推移を見る</Link></div></div>}
        {estab != null && <div className="stat"><div className="stat-label">事業所数（2021年経済センサス）</div><div className="stat-value">{fmt(estab)}</div><div className="stat-sub">所 → <Link href={`/city/${m.slug}/`}>産業別の内訳を見る</Link></div></div>}
      </div>
      <LineChart title={`${m.name}で新しく法人番号が指定された法人の数（${FIRST_HOUJIN_YEAR}〜${LATEST_HOUJIN_YEAR}年、社）`} unit="社" zero
        series={[{ label: '新規指定', points: HOUJIN_YEARS.map(y => ({ x: y, y: houjinNewAt(m.code, y) })) }]} />
      <h2>法人種別ごとの内訳</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>法人種別</th><th>{m.name}</th><th>構成比</th><th>県内合計</th><th>県内の構成比</th></tr></thead>
          <tbody>
            {kinds.map(x => <tr key={x.k}><td className="wrap">{x.k}</td><td>{fmt(x.n)}</td>
              <td>{fmt(Math.round((x.n / n) * 1000) / 10)}%</td><td>{fmt(houjinPref(x.k))}</td>
              <td>{fmt(Math.round((houjinPref(x.k) / T) * 1000) / 10)}%</td></tr>)}
            <tr className="hl"><td>合計</td><td>{fmt(n)}</td><td>100%</td><td>{fmt(T)}</td><td>100%</td></tr>
          </tbody>
        </table>
      </div>
      <h2>年ごとの新規指定</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年</th><th>{m.name}</th><th>県内合計</th></tr></thead>
          <tbody>{HOUJIN_YEARS.map(y => <tr key={y}><td>{y}年</td><td>{fmt(houjinNewAt(m.code, y))}</td><td>{fmt(houjinNewPref(y))}</td></tr>)}
            <tr className="hl"><td>合計</td><td>{fmt(recent)}</td><td>{fmt(HOUJIN_YEARS.reduce((a, y) => a + houjinNewPref(y), 0))}</td></tr></tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href="/industry/">産業大分類別の市町村ランキング</Link></li>
        <li><Link href={`/economy/${m.slug}/`}>{m.name}の所得・製造業</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/houjin/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['houjin']} extra={[
        '登記されている法人の数であり、事業所の数でも「営業している会社」の数でもない。休眠会社や本店だけを置く法人も含まれる。',
        '「閉鎖」は解散・移転・合併などで登記記録が閉鎖された法人の累計で、倒産件数ではない。',
        `法人番号は2015年10月に既存法人へ一斉付番されたため、新設分を見るには${FIRST_HOUJIN_YEAR}年以降を使う必要がある。`,
        '有限会社は2006年の会社法施行で新設できなくなった。現存するものはすべて2006年以前に設立された会社。',
        `人口千人当たりは、法人数を${LATEST_POP}年1月1日の住民基本台帳人口で割った本サイトの計算値。`,
      ]} />
    </>
  );
}
