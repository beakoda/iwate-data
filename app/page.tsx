import Link from 'next/link';
import { MUNIS, INDUSTRIES, PREF, dentalAt, popAt, econAt, fmt, fmtSigned, LATEST_DENTAL, LATEST_POP, SITE, censusAt, agingRate, LATEST_CENSUS } from '@/lib/data';

export default function Home() {
  const d = dentalAt(PREF.code, LATEST_DENTAL)!; const d0 = dentalAt(PREF.code, 2009)!;
  const p = popAt(PREF.code, LATEST_POP)!; const p0 = popAt(PREF.code, 2013)!;
  const e = econAt(PREF.code, 'AR')!;
  const c = censusAt(PREF.code, LATEST_CENSUS)!;
  const json = { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url, description: SITE.description,
    publisher: { '@type': 'Organization', name: SITE.publisher, url: SITE.publisherUrl } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      <section className="hero">
        <h1>岩手県の統計を、市町村×業種の粒度で。</h1>
        <p className="lead">{SITE.name}は、政府統計（e-Stat）に散らばる岩手県33市町村のデータを、一つの数字・一つのグラフ・一つの出典にまとめて公開するデータサイトです。記者・行政・研究・事業者の方が、そのまま引用できる形にしています。</p>
      </section>
      <div className="stats">
        <div className="stat"><div className="stat-label">岩手県の歯科診療所数（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(d.dent, '施設')}</div><div className="stat-sub">2009年比 {fmtSigned(d.dent - d0.dent, '施設')}</div></div>
        <div className="stat"><div className="stat-label">岩手県の人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(p.total, '人')}</div><div className="stat-sub">2013年比 {fmtSigned(p.total - p0.total, '人')}</div></div>
        <div className="stat"><div className="stat-label">岩手県の民営事業所数（2021年）</div><div className="stat-value">{fmt(e['2021'].estab, '事業所')}</div><div className="stat-sub">従業者 {fmt(e['2021'].workers, '人')}</div></div>
        <div className="stat"><div className="stat-label">岩手県の高齢化率（{LATEST_CENSUS}年）</div><div className="stat-value">{fmt(agingRate(c))}%</div><div className="stat-sub">平均年齢 {fmt(c.avg_age != null ? Math.round(c.avg_age * 10) / 10 : null)}歳</div></div>
      </div>
      <div className="cards">
        <div className="card"><h2>歯科診療所数の推移</h2><p>医療施設調査（厚労省）から、市町村別の歯科診療所数・一般診療所数を2009〜{LATEST_DENTAL}年で。人口10万人当たりと県内順位つき。</p><Link className="more" href="/dental/">県全体と市町村ランキングを見る →</Link></div>
        <div className="card"><h2>人口・世帯・自然増減・社会増減</h2><p>住民基本台帳（総務省）から、各市町村の人口・世帯数、出生・死亡、転入・転出を2013〜{LATEST_POP}年で。</p><Link className="more" href="/population/">市町村別の人口動態を見る →</Link></div>
        <div className="card"><h2>産業別の事業所数・従業者数・売上</h2><p>経済センサス（2016年・2021年）から、産業大分類×市町村の事業所数・従業者数・売上（収入）金額。</p><Link className="more" href="/industry/">業種別ランキングを見る →</Link></div>
        <div className="card"><h2>高齢化率・年齢構成</h2><p>国勢調査（2015年・2020年）から、市町村別の高齢化率・年少人口割合・平均年齢・年齢中位数・人口密度。5年間の変化つき。</p><Link className="more" href="/aging/">高齢化率ランキングを見る →</Link></div>
        <div className="card"><h2>就業者・産業別就業者・昼夜間人口</h2><p>国勢調査から、市町村別の就業者数・労働力率・産業大分類別就業者数と、昼間人口・昼夜間人口比率。</p><Link className="more" href="/work/">就業と昼夜間人口を見る →</Link></div>
      </div>
      <h2>市町村から探す</h2>
      <ul className="grid-links">
        {MUNIS.map(m => <li key={m.code}><Link href={`/city/${m.slug}/`}>{m.name}<small>{m.gun || m.kind}・歯科{fmt(dentalAt(m.code, LATEST_DENTAL)?.dent)}施設・人口{fmt(popAt(m.code, LATEST_POP)?.total)}人</small></Link></li>)}
      </ul>
      <h2>業種から探す</h2>
      <ul className="grid-links">
        {INDUSTRIES.filter(i => i.code !== 'AR').map(i => <li key={i.code}><Link href={`/industry/${i.slug}/`}>{i.code} {i.name}<small>県内 {fmt(econAt(PREF.code, i.code)?.['2021']?.estab)} 事業所</small></Link></li>)}
      </ul>
    </>
  );
}
