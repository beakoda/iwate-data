import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, houseAt, housePrefAt, censusAt, hhShare, fmt, fmtSigned, pct, rank, HOUSE_YEARS, LATEST_HOUSE, PREV_HOUSE, FIRST_HOUSE, FIRST_POP75_YEAR } from '@/lib/data';
import { LineChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, MuniStrip, Tools, Cta } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!; const h = houseAt(m.code, LATEST_HOUSE)!;
  return {
    title: `${m.name}の世帯数・高齢者単身世帯・単独世帯（${FIRST_HOUSE}〜${LATEST_HOUSE}年）`,
    description: `${m.name}（岩手県）の一般世帯数は${LATEST_HOUSE}年に${fmt(h.general_hh)}世帯、うち単独世帯${fmt(h.single_hh)}世帯、65歳以上の単独世帯${fmt(h.eld_single_hh)}世帯（${fmt(hhShare(h.eld_single_hh, h.general_hh))}%）。県内33市町村の順位を国勢調査から集計。`,
    alternates: { canonical: `/household/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const h = houseAt(m.code, LATEST_HOUSE)!, h0 = houseAt(m.code, FIRST_HOUSE)!, hp = houseAt(m.code, PREV_HOUSE)!;
  const pref = housePrefAt(LATEST_HOUSE);
  const cen = censusAt(m.code, LATEST_HOUSE);
  const rows = MUNIS.map(mm => {
    const x = houseAt(mm.code, LATEST_HOUSE)!;
    return { m: mm, gh: x.general_hh, single: hhShare(x.single_hh, x.general_hh), eldS: hhShare(x.eld_single_hh, x.general_hh), eldC: hhShare(x.eld_couple_hh, x.general_hh) };
  });
  const rH = rank(rows, r => r.gh), rS = rank(rows, r => r.single), rE = rank(rows, r => r.eldS);
  const me = rows.find(r => r.m.code === m.code)!;
  const singleP = hhShare(h.single_hh, h.general_hh), eldSP = hhShare(h.eld_single_hh, h.general_hh), eldCP = hhShare(h.eld_couple_hh, h.general_hh), nucP = hhShare(h.nuclear_hh, h.general_hh);
  const hhSize = h.general_hh && cen ? Math.round((cen.total / h.general_hh) * 100) / 100 : null;
  const title = `${m.name}の世帯数・高齢者単身世帯・単独世帯（${FIRST_HOUSE}〜${LATEST_HOUSE}年）`;
  const sentence = `${m.name}の一般世帯数は${LATEST_HOUSE}年に${fmt(h.general_hh)}世帯で、65歳以上の単独世帯は${fmt(h.eld_single_hh)}世帯（一般世帯の${fmt(eldSP)}%、岩手県内33市町村中${rE.get(me) ?? '—'}位）。単独世帯は${fmt(h.single_hh)}世帯（${fmt(singleP)}%）で、${FIRST_HOUSE}年（${fmt(h0.single_hh)}世帯）から${fmtSigned(pct(h.single_hh, h0.single_hh), '%')}。`;
  const merged = [...new Set(HOUSE_YEARS.flatMap(y => houseAt(m.code, y)?.merged || []))];
  return (
    <>
      <Breadcrumb items={[{ name: '世帯・高齢世帯', href: '/household/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/household/${m.slug}/`}
        keywords={[m.name, '世帯数', '単独世帯', '高齢者単身世帯', '核家族', '国勢調査', '岩手県']} temporal={`${FIRST_HOUSE}/${LATEST_HOUSE}`} sourceKeys={['household']} />
      <h1>{title}</h1>
      <MuniStrip family="household" current={m.code} />
      <p className="key-fact">
        {m.name}の一般世帯数は{LATEST_HOUSE}年に<strong>{fmt(h.general_hh)}世帯</strong>（{PREV_HOUSE}年比{fmtSigned(pct(h.general_hh, hp.general_hh), '%')}）。
        65歳以上の単独世帯は<strong>{fmt(h.eld_single_hh)}世帯</strong>で一般世帯の<strong>{fmt(eldSP)}%</strong>、岩手県内<strong>{rE.get(me) ?? '—'}位</strong>（県平均{fmt(hhShare(pref.eld_single_hh, pref.general_hh))}%）。
        単独世帯は{fmt(h.single_hh)}世帯（{fmt(singleP)}%）。
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">一般世帯数（{LATEST_HOUSE}年）</div><div className="stat-value">{fmt(h.general_hh)}</div><div className="stat-sub">世帯・県内 {rH.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">1世帯当たり人員</div><div className="stat-value">{fmt(hhSize)}</div><div className="stat-sub">人（国勢調査人口÷一般世帯数）</div></div>
        <div className="stat"><div className="stat-label">単独世帯</div><div className="stat-value">{fmt(h.single_hh)}</div><div className="stat-sub">世帯・{fmt(singleP)}%・県内 {rS.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">65歳以上の単独世帯</div><div className="stat-value">{fmt(h.eld_single_hh)}</div><div className="stat-sub">世帯・{fmt(eldSP)}%・県内 {rE.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">高齢夫婦のみの世帯</div><div className="stat-value">{fmt(h.eld_couple_hh)}</div><div className="stat-sub">世帯・{fmt(eldCP)}%（夫65歳以上・妻60歳以上）</div></div>
        <div className="stat"><div className="stat-label">核家族世帯</div><div className="stat-value">{fmt(h.nuclear_hh)}</div><div className="stat-sub">世帯・{fmt(nucP)}%</div></div>
        {h.pop75 != null && <div className="stat"><div className="stat-label">75歳以上人口</div><div className="stat-value">{fmt(h.pop75)}</div><div className="stat-sub">人{cen ? `・総人口の${Math.round(h.pop75 / cen.total * 1000) / 10}%` : ''}</div></div>}
        {h.foreign != null && <div className="stat"><div className="stat-label">外国人人口</div><div className="stat-value">{fmt(h.foreign)}</div><div className="stat-sub">人</div></div>}
        {h.did_pop != null && <div className="stat"><div className="stat-label">人口集中地区（DID）人口</div><div className="stat-value">{fmt(h.did_pop)}</div><div className="stat-sub">人{cen ? `・総人口の${Math.round(h.did_pop / cen.total * 1000) / 10}%` : ''}</div></div>}
      </div>
      <Tools family="household" slug={m.slug} label={`${m.name}の全年データ`} />
      <LineChart title={`${m.name}の世帯の内訳（${FIRST_HOUSE}〜${LATEST_HOUSE}年、世帯）`} unit="世帯" zero
        series={[
          { label: '一般世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: houseAt(m.code, y)?.general_hh ?? 0 })) },
          { label: '単独世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: houseAt(m.code, y)?.single_hh ?? 0 })) },
          { label: '核家族世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: houseAt(m.code, y)?.nuclear_hh ?? 0 })) },
          { label: '65歳以上の単独世帯', points: HOUSE_YEARS.map(y => ({ x: y, y: houseAt(m.code, y)?.eld_single_hh ?? 0 })) },
        ]} />
      <h2>国勢調査年別データ</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>項目</th>{HOUSE_YEARS.map(y => <th key={y}>{y}年</th>)}<th>県計（{LATEST_HOUSE}年）</th></tr></thead>
          <tbody>
            {([['世帯数（総数）', 'households'], ['一般世帯数', 'general_hh'], ['核家族世帯', 'nuclear_hh'], ['単独世帯', 'single_hh'], ['高齢夫婦のみの世帯', 'eld_couple_hh'], ['65歳以上の単独世帯', 'eld_single_hh'], ['75歳以上人口', 'pop75'], ['外国人人口', 'foreign'], ['人口集中地区人口', 'did_pop']] as const).map(([label, key]) => (
              <tr key={key}><td>{label}</td>
                {HOUSE_YEARS.map(y => <td key={y}>{fmt(houseAt(m.code, y)?.[key] ?? null)}</td>)}
                <td>{fmt(pref[key] ?? null)}</td></tr>))}
            <tr><td>65歳以上の単独世帯の割合</td>
              {HOUSE_YEARS.map(y => { const x = houseAt(m.code, y); return <td key={y}>{fmt(hhShare(x?.eld_single_hh, x?.general_hh))}%</td>; })}
              <td>{fmt(hhShare(pref.eld_single_hh, pref.general_hh))}%</td></tr>
            <tr><td>単独世帯の割合</td>
              {HOUSE_YEARS.map(y => { const x = houseAt(m.code, y); return <td key={y}>{fmt(hhShare(x?.single_hh, x?.general_hh))}%</td>; })}
              <td>{fmt(hhShare(pref.single_hh, pref.general_hh))}%</td></tr>
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link></li>
        <li><Link href={`/vital/${m.slug}/`}>{m.name}の出生・死亡</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口・世帯</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <Cta muni={m.name} topic="世帯構成" />
      <CiteBox title={title} path={`/household/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['household']} extra={[
        '「一般世帯」は施設等の世帯を除く世帯。割合の分母は一般世帯数。',
        '「高齢夫婦のみの世帯」は夫65歳以上・妻60歳以上の夫婦1組のみの一般世帯。',
        `75歳以上人口は${FIRST_POP75_YEAR}年以降のみ収録。`,
        ...(merged.length ? [`合併前の${merged.join('・')}の値を合算している。`] : []),
      ]} />
    </>
  );
}
