import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, envAt, envSeries, envPrefAt, envPrefPerDay, fmt, fmtSigned, pct, rank, ENV_YEARS, LATEST_ENV, FIRST_ENV } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = envAt(m.code, LATEST_ENV)!;
  return {
    title: `${m.name}のごみ排出量・リサイクル率の推移（${FIRST_ENV}〜${LATEST_ENV}年度）`,
    description: `${m.name}（岩手県）のごみ総排出量は${LATEST_ENV}年度に${fmt(r.gomi_total)}t、1人1日当たり${fmt(r.gomi_per_day)}g、リサイクル率${fmt(r.recycle_rate)}%。県内33市町村の順位つきで一般廃棄物処理事業実態調査から集計。`,
    alternates: { canonical: `/garbage/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const s = envSeries(m.code);
  const r = envAt(m.code, LATEST_ENV)!, r0 = envAt(m.code, FIRST_ENV)!;
  const rows = MUNIS.map(mm => { const x = envAt(mm.code, LATEST_ENV)!; return { m: mm, t: x.gomi_total, p: x.gomi_per_day, rc: x.recycle_rate, f: x.flush_rate }; });
  const rT = rank(rows, x => x.t), rP = rank(rows, x => x.p), rR = rank(rows, x => x.rc), rF = rank(rows, x => x.f);
  const me = rows.find(x => x.m.code === m.code)!;
  const prefPerDay = envPrefPerDay(LATEST_ENV);
  const title = `${m.name}のごみ排出量・リサイクル率の推移（${FIRST_ENV}〜${LATEST_ENV}年度）`;
  const sentence = `${m.name}のごみ総排出量は${LATEST_ENV}年度に${fmt(r.gomi_total)}tで、1人1日当たり${fmt(r.gomi_per_day)}g（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPerDay)}g）。リサイクル率は${fmt(r.recycle_rate)}%で県内${rR.get(me) ?? '—'}位、${FIRST_ENV}年度（${fmt(r0.recycle_rate)}%）から${fmtSigned(Math.round(((r.recycle_rate ?? 0) - (r0.recycle_rate ?? 0)) * 10) / 10, 'ポイント')}。`;
  const merged = [...new Set(s.flatMap(x => x.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: 'ごみ・生活インフラ', href: '/garbage/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/garbage/${m.slug}/`}
        keywords={[m.name, 'ごみ排出量', 'リサイクル率', '最終処分量', '水洗化率', '一般廃棄物', '岩手県']} temporal={`${FIRST_ENV}/${LATEST_ENV}`} sourceKeys={['env']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}のごみ総排出量は{LATEST_ENV}年度に<strong>{fmt(r.gomi_total)}t</strong>（{FIRST_ENV}年度比{fmtSigned(pct(r.gomi_total, r0.gomi_total), '%')}）。
        1人1日当たり<strong>{fmt(r.gomi_per_day)}g</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPerDay)}g）、リサイクル率は<strong>{fmt(r.recycle_rate)}%</strong>で県内{rR.get(me) ?? '—'}位。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">ごみ総排出量（{LATEST_ENV}年度）</div><div className="stat-value">{fmt(r.gomi_total)}</div><div className="stat-sub">t・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">1人1日当たり排出量</div><div className="stat-value">{fmt(r.gomi_per_day)}</div><div className="stat-sub">g・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPerDay)}g）</div></div>
        <div className="stat"><div className="stat-label">リサイクル率</div><div className="stat-value">{fmt(r.recycle_rate)}</div><div className="stat-sub">%・県内 {rR.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">最終処分量</div><div className="stat-value">{fmt(r.landfill)}</div><div className="stat-sub">t・総排出量の{r.gomi_total ? Math.round((r.landfill ?? 0) / r.gomi_total * 1000) / 10 : '—'}%</div></div>
        <div className="stat"><div className="stat-label">計画収集人口</div><div className="stat-value">{fmt(r.gomi_collect_pop)}</div><div className="stat-sub">人</div></div>
        <div className="stat"><div className="stat-label">水洗化率</div><div className="stat-value">{fmt(r.flush_rate)}</div><div className="stat-sub">%・県内 {rF.get(me) ?? '—'}位・非水洗化人口 {fmt(r.nonflush_pop)}人</div></div>
      </div>
      <LineChart title={`${m.name}のごみ総排出量（${FIRST_ENV}〜${LATEST_ENV}年度、t）`} unit="t" zero
        series={[
          { label: 'ごみ総排出量', points: s.map(x => ({ x: x.year, y: x.gomi_total ?? 0 })) },
          { label: '最終処分量', points: s.map(x => ({ x: x.year, y: x.landfill ?? 0 })) },
        ]} />
      <LineChart title={`${m.name}の1人1日当たり排出量とリサイクル率（${FIRST_ENV}〜${LATEST_ENV}年度）`} zero
        series={[
          { label: '1人1日当たり(g)', points: s.filter(x => x.gomi_per_day != null).map(x => ({ x: x.year, y: x.gomi_per_day as number })) },
          { label: 'リサイクル率(%)', points: s.filter(x => x.recycle_rate != null).map(x => ({ x: x.year, y: x.recycle_rate as number })) },
        ]} />
      <h2>年度別データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>年度</th><th>ごみ総排出量(t)</th><th>1人1日当たり(g)</th><th>リサイクル率(%)</th><th>最終処分量(t)</th><th>計画収集人口</th><th>水洗化率(%)</th><th>非水洗化人口</th></tr></thead>
          <tbody>
            {s.map(x => (
              <tr key={x.year}><td>{x.year}年度</td><td>{fmt(x.gomi_total)}</td><td>{fmt(x.gomi_per_day)}</td><td>{fmt(x.recycle_rate)}</td>
                <td>{fmt(x.landfill)}</td><td>{fmt(x.gomi_collect_pop)}</td><td>{fmt(x.flush_rate)}</td><td>{fmt(x.nonflush_pop)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯</Link></li>
        <li><Link href={`/household/${m.slug}/`}>{m.name}の世帯</Link></li>
        <li><Link href={`/building/${m.slug}/`}>{m.name}の住宅着工</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/garbage/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['env']} extra={[
        '「ごみ総排出量」は計画収集量＋直接搬入量＋自家処理量＋集団回収量。年度の値。',
        '1人1日当たり排出量・リサイクル率・水洗化率は市町村ごとの公表値をそのまま掲載している。',
        '比較に用いた「県平均」の1人1日当たりは、33市町村の総排出量を計画収集人口で割った本サイトの計算値（公表値の人口加重平均とは数g程度ずれる）。',
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している（率は合算できないため、合併年をまたぐ年は空欄になることがある）。`] : []),
      ]} />
    </>
  );
}
