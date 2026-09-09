import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, iryouAt, iryouPref, urlRate, facPer10k, popAt, fmt, rank, IRYOU_TYPES, IRYOU_ASOF, IRYOU_ASOF_LABEL, LATEST_POP } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const r = iryouAt(m.code)!;
  return {
    title: `${m.name}の病院・診療所・歯科・薬局の数（${IRYOU_ASOF_LABEL}時点）`,
    description: `${m.name}（岩手県）の医療機関・薬局は${IRYOU_ASOF_LABEL}時点で${fmt(r.facilities)}施設（歯科${fmt(iryouAt(m.code, '歯科')?.facilities ?? 0)}・薬局${fmt(iryouAt(m.code, '薬局')?.facilities ?? 0)}）。ホームページ公表率${fmt(urlRate(r))}%、人口1万人当たりの施設数と県内33市町村の順位を医療情報ネットから集計。`,
    alternates: { canonical: `/iryou/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const r = iryouAt(m.code)!;
  const rate = urlRate(r), per = facPer10k(r.facilities, m.code);
  const popYear = Math.min(Number(IRYOU_ASOF.slice(0, 4)) + 1, LATEST_POP);
  const pop = popAt(m.code, popYear);
  const rows = MUNIS.map(mm => {
    const x = iryouAt(mm.code)!;
    return { m: mm, n: x.facilities, rate: urlRate(x), per: facPer10k(x.facilities, mm.code) };
  });
  const rT = rank(rows, x => x.n), rP = rank(rows, x => x.per), rR = rank(rows, x => x.rate);
  const me = rows.find(x => x.m.code === m.code)!;
  const pAll = iryouPref(), prefRate = urlRate(pAll);
  const prefPop = MUNIS.reduce((a, x) => a + (popAt(x.code, popYear)?.total ?? 0), 0);
  const prefPer = prefPop ? Math.round((pAll.facilities / prefPop) * 10000 * 100) / 100 : null;
  const zero = IRYOU_TYPES.filter(t => (iryouAt(m.code, t)?.facilities ?? 0) === 0);
  const title = `${m.name}の病院・診療所・歯科・薬局の数（${IRYOU_ASOF_LABEL}時点）`;
  const sentence = `${m.name}の医療機関・薬局は${IRYOU_ASOF_LABEL}時点で${fmt(r.facilities)}施設で、人口1万人当たり${fmt(per)}施設（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPer)}施設）。案内用ホームページを届け出ているのは${fmt(r.with_url)}施設・${fmt(rate)}%（県平均${fmt(prefRate)}%）。`;
  return (
    <>
      <Breadcrumb items={[{ name: '医療機関・薬局', href: '/iryou/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/iryou/${m.slug}/`}
        keywords={[m.name, '病院', '診療所', '歯科医院', '薬局', 'ホームページ', '岩手県']} temporal={IRYOU_ASOF_LABEL} sourceKeys={['iryou']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の医療機関・薬局は{IRYOU_ASOF_LABEL}時点で<strong>{fmt(r.facilities)}施設</strong>。
        人口1万人当たり<strong>{fmt(per)}施設</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}施設）。
        案内用ホームページを届け出ているのは<strong>{fmt(r.with_url)}施設・{fmt(rate)}%</strong>（県平均{fmt(prefRate)}%、県内{rR.get(me) ?? '—'}位）。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">医療機関・薬局の合計</div><div className="stat-value">{fmt(r.facilities)}</div><div className="stat-sub">施設・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口1万人当たり</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">施設・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPer)}）</div></div>
        <div className="stat"><div className="stat-label">ホームページ公表率</div><div className="stat-value">{fmt(rate)}%</div><div className="stat-sub">{fmt(r.with_url)} / {fmt(r.facilities)}施設・県平均 {fmt(prefRate)}%</div></div>
        {pop && <div className="stat"><div className="stat-label">人口（{popYear}年1月1日）</div><div className="stat-value">{fmt(pop.total)}</div><div className="stat-sub">人 → <Link href={`/population/${m.slug}/`}>人口の推移を見る</Link></div></div>}
      </div>
      <BarChart title={`${m.name}の施設種別ごとの数（${IRYOU_ASOF_LABEL}時点）`} items={IRYOU_TYPES.map(t => ({ label: t, value: iryouAt(m.code, t)?.facilities ?? 0 }))} unit="施設" />
      <h2>施設種別ごとの内訳</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>施設種別</th><th>施設数</th><th>HPを届け出ている施設</th><th>公表率</th><th>県内合計</th><th>県の公表率</th></tr></thead>
          <tbody>
            {IRYOU_TYPES.map(t => {
              const c = iryouAt(m.code, t) ?? { facilities: 0, with_url: 0 };
              const p = iryouPref(t);
              return <tr key={t}><td>{t}</td><td>{fmt(c.facilities)}</td><td>{fmt(c.with_url)}</td>
                <td>{c.facilities ? `${fmt(urlRate(c))}%` : '—'}</td><td>{fmt(p.facilities)}</td><td>{fmt(urlRate(p))}%</td></tr>;
            })}
            <tr className="hl"><td>合計</td><td>{fmt(r.facilities)}</td><td>{fmt(r.with_url)}</td><td>{fmt(rate)}%</td><td>{fmt(pAll.facilities)}</td><td>{fmt(prefRate)}%</td></tr>
          </tbody>
        </table>
      </div>
      {zero.length > 0 && <p>{IRYOU_ASOF_LABEL}時点で{m.name}に届出のある施設が1つもない種別: <strong>{zero.join('、')}</strong>。</p>}
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/medical/${m.slug}/`}>{m.name}の病院・医師（時系列）</Link></li>
        <li><Link href={`/dental/${m.slug}/`}>{m.name}の歯科診療所（時系列）</Link></li>
        <li><Link href={`/kaigo/${m.slug}/`}>{m.name}の介護サービス事業所</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/iryou/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['iryou']} extra={[
        '医療機能情報提供制度・薬局機能情報提供制度に届出のある施設が対象。休止中や届出前の施設は含まれない。「医療施設調査」を出典とする本サイトの他ページとは定義も時点も異なるため一致しない。',
        '「HP公表」は案内用ホームページアドレス（薬局は薬局のホームページアドレス）を届け出ている施設の数。持っていても届け出ていなければ0として数える。届出URLが現在も生きているかまでは確認していない。',
        '「診療所」は歯科を除く一般診療所。',
        '人口1万人当たりは、施設数を住民基本台帳人口で割った本サイトの計算値。',
      ]} />
    </>
  );
}
