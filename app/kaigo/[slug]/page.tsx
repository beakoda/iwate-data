import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, kaigoAt, kaigoPrefAt, kaigoServicesOf, officesPerElderly, censusAt, fmt, fmtSigned, pct, rank, LATEST_KAIGO, FIRST_KAIGO, kaigoLabel, LATEST_CENSUS } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const r = kaigoAt(m.code, LATEST_KAIGO)!; const sv = kaigoServicesOf(m.code, LATEST_KAIGO);
  return {
    title: `${m.name}の介護サービス事業所（${kaigoLabel(LATEST_KAIGO)}時点）`,
    description: `${m.name}（岩手県）の介護サービス事業所は${kaigoLabel(LATEST_KAIGO)}時点で${fmt(r.offices)}事業所・${sv.length}種別。${sv.slice(0, 3).map(x => `${x.service}${x.cell.offices}`).join('、')}など。高齢者千人当たりと県内33市町村の順位つき。`,
    alternates: { canonical: `/kaigo/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const r = kaigoAt(m.code, LATEST_KAIGO)!, r0 = kaigoAt(m.code, FIRST_KAIGO)!;
  const sv = kaigoServicesOf(m.code, LATEST_KAIGO);
  const sv0 = new Map(kaigoServicesOf(m.code, FIRST_KAIGO).map(x => [x.service, x.cell]));
  const cen = censusAt(m.code, LATEST_CENSUS);
  const rows = MUNIS.map(mm => {
    const x = kaigoAt(mm.code, LATEST_KAIGO)!;
    return { m: mm, offices: x.offices, per: officesPerElderly(x.offices, mm.code, LATEST_CENSUS) };
  });
  const rT = rank(rows, x => x.offices), rP = rank(rows, x => x.per);
  const me = rows.find(x => x.m.code === m.code)!;
  const per = officesPerElderly(r.offices, m.code, LATEST_CENSUS);
  const prefOff = kaigoPrefAt(LATEST_KAIGO).offices;
  const prefEld = MUNIS.reduce((a, x) => a + (censusAt(x.code, LATEST_CENSUS)?.age_65_ ?? 0), 0);
  const prefPer = prefEld ? Math.round((prefOff / prefEld) * 1000 * 100) / 100 : null;
  // 盛岡市にあってこの市町村にない種別
  const here = new Set(sv.map(x => x.service));
  const absent = kaigoServicesOf('03201', LATEST_KAIGO).map(x => x.service).filter(s => !here.has(s));
  const title = `${m.name}の介護サービス事業所（${kaigoLabel(LATEST_KAIGO)}時点）`;
  const sentence = `${m.name}の介護サービス事業所は${kaigoLabel(LATEST_KAIGO)}時点で${fmt(r.offices)}事業所・${sv.length}種別で、65歳以上人口千人当たり${fmt(per)}事業所（岩手県内33市町村中${rP.get(me) ?? '—'}位、県平均${fmt(prefPer)}事業所）。最も多い種別は${sv[0]?.service ?? '—'}の${fmt(sv[0]?.cell.offices)}事業所。`;
  return (
    <>
      <Breadcrumb items={[{ name: '介護サービス事業所', href: '/kaigo/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/kaigo/${m.slug}/`}
        keywords={[m.name, '介護サービス', '訪問介護', '通所介護', 'グループホーム', '事業所', '岩手県']} temporal={`${FIRST_KAIGO}/${LATEST_KAIGO}`} sourceKeys={['kaigo']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {m.name}の介護サービス事業所は{kaigoLabel(LATEST_KAIGO)}時点で<strong>{fmt(r.offices)}事業所・{sv.length}種別</strong>（{kaigoLabel(FIRST_KAIGO)}比{fmtSigned(pct(r.offices, r0.offices), '%')}）。
        65歳以上人口千人当たり<strong>{fmt(per)}事業所</strong>で岩手県内<strong>{rP.get(me) ?? '—'}位</strong>（県平均{fmt(prefPer)}事業所）。
        最も多い種別は<strong>{sv[0]?.service ?? '—'}の{fmt(sv[0]?.cell.offices)}事業所</strong>。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">事業所数（{kaigoLabel(LATEST_KAIGO)}）</div><div className="stat-value">{fmt(r.offices)}</div><div className="stat-sub">延べ事業所・県内 {rT.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">高齢者千人当たり</div><div className="stat-value">{fmt(per)}</div><div className="stat-sub">事業所・県内 {rP.get(me) ?? '—'}位（県平均 {fmt(prefPer)}）</div></div>
        <div className="stat"><div className="stat-label">サービス種別</div><div className="stat-value">{sv.length}</div><div className="stat-sub">種別が域内にある</div></div>
        <div className="stat"><div className="stat-label">定員の合計</div><div className="stat-value">{fmt(r.capacity)}</div><div className="stat-sub">人（定員が公表されている事業所の合計）</div></div>
        {cen && <div className="stat"><div className="stat-label">65歳以上人口（{LATEST_CENSUS}年国勢調査）</div><div className="stat-value">{fmt(cen.age_65_)}</div><div className="stat-sub">人 → <Link href={`/aging/${m.slug}/`}>高齢化率を見る</Link></div></div>}
      </div>
      <BarChart title={`${m.name}のサービス種別ごとの事業所数（${kaigoLabel(LATEST_KAIGO)}時点）`} items={sv.map(x => ({ label: x.service, value: x.cell.offices }))} unit="事業所" />
      <h2>サービス種別ごとの内訳</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>サービス種別</th><th>{kaigoLabel(LATEST_KAIGO)}</th><th>{kaigoLabel(FIRST_KAIGO)}</th><th>増減</th><th>定員</th><th>県内合計</th></tr></thead>
          <tbody>
            {sv.map(x => {
              const o = sv0.get(x.service);
              return <tr key={x.service}><td className="wrap">{x.service}</td><td>{fmt(x.cell.offices)}</td><td>{fmt(o?.offices ?? 0)}</td>
                <td>{fmtSigned(x.cell.offices - (o?.offices ?? 0))}</td><td>{x.cell.capacity ? fmt(x.cell.capacity) : '—'}</td>
                <td>{fmt(kaigoPrefAt(LATEST_KAIGO, x.service).offices)}</td></tr>;
            })}
            <tr className="hl"><td>合計（延べ）</td><td>{fmt(r.offices)}</td><td>{fmt(r0.offices)}</td><td>{fmtSigned(r.offices - r0.offices)}</td><td>{fmt(r.capacity)}</td><td>{fmt(prefOff)}</td></tr>
          </tbody>
        </table>
      </div>
      {absent.length > 0 && <><h2>{m.name}にない主なサービス</h2>
        <p>盛岡市にあって{m.name}には{kaigoLabel(LATEST_KAIGO)}時点で事業所がない種別: {absent.join('、')}。</p></>}
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/welfare/${m.slug}/`}>{m.name}の介護施設・国保（時系列）</Link></li>
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link></li>
        <li><Link href={`/household/${m.slug}/`}>{m.name}の高齢者単身世帯</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/kaigo/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['kaigo']} extra={[
        '公表システムに登録されている事業所を数えたもので、休止中・新規指定直後などで公表が反映されていない事業所は含まれない場合がある。',
        '1つの法人が同じ住所で複数のサービスを提供している場合、サービス種別ごとに別々の事業所として数える。合計は延べ事業所数であり、建物や法人の数ではない。',
        '定員は公表されている値の合計。訪問系・居宅介護支援など定員の概念がないサービスは0として扱っている。',
        `高齢者千人当たりは、${kaigoLabel(LATEST_KAIGO)}時点の事業所数を${LATEST_CENSUS}年国勢調査の65歳以上人口で割った本サイトの計算値。`,
        '施設数・定員の時系列（2010年以降）は「介護施設・国保」のページ（社会福祉施設等調査）を参照。出典・調査時点が異なるため数値は一致しない。',
      ]} />
    </>
  );
}
