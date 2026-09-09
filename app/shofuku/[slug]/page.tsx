import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, shofukuAt, shofukuPref, shofukuServicesOf, shofukuUrlRate, shofukuPer10k, popAt, fmt, rank, SHOFUKU_ASOF_LABEL, LATEST_POP } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const r = shofukuAt(m.code)!, sv = shofukuServicesOf(m.code);
  return {
    title: `${m.name}の障害福祉サービス事業所（${SHOFUKU_ASOF_LABEL}時点）`,
    description: `${m.name}（岩手県）の障害福祉サービス事業所は${SHOFUKU_ASOF_LABEL}時点で${fmt(r.offices)}事業所・${sv.length}種別。${sv.slice(0, 3).map(x => `${x.service}${x.cell.offices}`).join('、')}など。人口1万人当たりと県内33市町村の順位つき。`,
    alternates: { canonical: `/shofuku/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const r = shofukuAt(m.code)!, sv = shofukuServicesOf(m.code);
  const per = shofukuPer10k(r.offices, m.code), rate = shofukuUrlRate(r);
  const rows = MUNIS.map(mm => {
    const x = shofukuAt(mm.code)!;
    return { m: mm, n: x.offices, per: shofukuPer10k(x.offices, mm.code), rate: shofukuUrlRate(x) };
  });
  const rT = rank(rows, x => x.n), rP = rank(rows, x => x.per);
  const me = rows.find(x => x.m.code === m.code)!;
  const P = shofukuPref();
  const prefPop = MUNIS.reduce((a, x) => a + (popAt(x.code, LATEST_POP)?.total ?? 0), 0);
  const prefPer = prefPop ? Math.round((P.offices / prefPop) * 10000 * 100) / 100 : null;
  const pop = popAt(m.code, LATEST_POP);
  const here = new Set(sv.map(x => x.service));
  const absent = shofukuServicesOf('03201').map(x => x.service).filter(s => !here.has(s));
  const title = `${m.name}の障害福祉サービス事業所（${SHOFUKU_ASOF_LABEL}時点）`;
  const sentence = `${m.name}の障害福祉サービス事業所は${SHOFUKU_ASOF_LABEL}時点で${fmt(r.offices)}事業所・${sv.length}種別で、人口1万人当たり${fmt(per)}事業所（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPer)}事業所）。最も多い種別は${sv[0]?.service ?? '—'}の${fmt(sv[0]?.cell.offices)}事業所。`;
  return (
    <>
      <Breadcrumb items={[{ name: '障害福祉サービス事業所', href: '/shofuku/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/shofuku/${m.slug}/`}
        keywords={[m.name, '障害福祉サービス', '就労継続支援', '放課後等デイサービス', 'グループホーム', '岩手県']} temporal={SHOFUKU_ASOF_LABEL} sourceKeys={['shofuku']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の障害福祉サービス事業所は{SHOFUKU_ASOF_LABEL}時点で<strong>{fmt(r.offices)}事業所・{sv.length}種別</strong>。
        人口1万人当たり<strong>{fmt(per)}事業所</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}事業所）。
        最も多い種別は<strong>{sv[0]?.service ?? '—'}の{fmt(sv[0]?.cell.offices)}事業所</strong>。ホームページ公表率は{rate == null ? '—' : `${fmt(rate)}%`}（県平均{fmt(shofukuUrlRate(P))}%）。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">事業所数（{SHOFUKU_ASOF_LABEL}）</div><div className="stat-value">{fmt(r.offices)}</div><div className="stat-sub">延べ事業所・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">人口1万人当たり</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">事業所・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPer)}）</div></div>
        <div className="stat"><div className="stat-label">サービス種別</div><div className="stat-value">{sv.length}</div><div className="stat-sub">種別が域内にある</div></div>
        <div className="stat"><div className="stat-label">ホームページ公表率</div><div className="stat-value">{rate == null ? '—' : `${fmt(rate)}%`}</div><div className="stat-sub">{fmt(r.with_url)} / {fmt(r.offices)}事業所</div></div>
        {pop && <div className="stat"><div className="stat-label">人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(pop.total)}</div><div className="stat-sub">人 → <Link href={`/population/${m.slug}/`}>人口の推移を見る</Link></div></div>}
      </div>
      <BarChart title={`${m.name}のサービス種別ごとの事業所数（${SHOFUKU_ASOF_LABEL}時点）`} items={sv.map(x => ({ label: x.service, value: x.cell.offices }))} unit="事業所" />
      <h2>サービス種別ごとの内訳</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>サービス種別</th><th>事業所</th><th>HP公表</th><th>公表率</th><th>県内合計</th></tr></thead>
          <tbody>
            {sv.map(x => <tr key={x.service}><td className="wrap">{x.service}</td><td>{fmt(x.cell.offices)}</td><td>{fmt(x.cell.with_url)}</td>
              <td>{fmt(shofukuUrlRate(x.cell))}%</td><td>{fmt(shofukuPref(x.service).offices)}</td></tr>)}
            <tr className="hl"><td>合計（延べ）</td><td>{fmt(r.offices)}</td><td>{fmt(r.with_url)}</td><td>{rate == null ? '—' : `${fmt(rate)}%`}</td><td>{fmt(P.offices)}</td></tr>
          </tbody>
        </table>
      </div>
      {absent.length > 0 && <><h2>{m.name}にない主なサービス</h2>
        <p>盛岡市にあって{m.name}には{SHOFUKU_ASOF_LABEL}時点で事業所がない種別: {absent.join('、')}。</p></>}
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/kaigo/${m.slug}/`}>{m.name}の介護サービス事業所</Link></li>
        <li><Link href={`/welfare/${m.slug}/`}>{m.name}の介護施設・国保</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/shofuku/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['shofuku']} extra={[
        '各自治体が障害福祉サービス等情報公表システムに登録した事業所が対象。登録が反映されていない事業所は含まれない場合がある。',
        '1つの法人が同じ場所で複数のサービスを提供している場合、サービス種別ごとに別々の事業所として数える。合計は延べ事業所数。',
        '「HP公表」は事業所URLが登録されている事業所の数。',
        `人口1万人当たりは、事業所数を${LATEST_POP}年1月1日の住民基本台帳人口で割った本サイトの計算値。`,
        '高齢者向けの介護サービス事業所は別ページにある。制度が異なるため合算しないこと。',
      ]} />
    </>
  );
}
