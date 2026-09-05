import Link from 'next/link';
import { IwateMap } from '@/components/Map';
import { MUNIS, INDUSTRIES, PREF, dentalAt, popAt, econAt, fmt, fmtSigned, LATEST_DENTAL, LATEST_POP, SITE, censusAt, agingRate, LATEST_CENSUS, buildPrefAt, LATEST_BUILD, FIRST_BUILD, vitalPrefAt, LATEST_VITAL, FIRST_VITAL, naturalChange, housePrefAt, LATEST_HOUSE, FIRST_HOUSE, hhShare, medPrefAt, LATEST_MED, FIRST_MED, LATEST_DOC_YEAR, welPrefAt, LATEST_WEL, FIRST_WEL, schoolPrefAt, LATEST_SCHOOL, FIRST_SCHOOL, econPrefAt, LATEST_ECON, FIRST_ECON, incomePerTaxpayer, envPrefAt, envPrefPerDay, LATEST_ENV, FIRST_ENV, joblessPrefAt, joblessRate, LATEST_JOBLESS, FIRST_JOBLESS, eduPrefAt, eduShare, LATEST_EDU, FIRST_EDU, farmPrefAt, totalFarms, LATEST_FARM, FIRST_FARM, LAST_ABANDONED_YEAR } from '@/lib/data';

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
        <div className="tools">
          <Link className="btn primary" href="/city/">市町村を選んで見る</Link>
          <Link className="btn" href="/data/">全データをExcelで入手する</Link>
        </div>
      </section>
      <IwateMap title={`高齢化率（${LATEST_CENSUS}年、%）— 市町村をクリックすると統計まとめへ`} unit="%" decimals={1} family="city"
        values={MUNIS.map(m => ({ code: m.code, value: agingRate(censusAt(m.code, LATEST_CENSUS)) ?? null }))} />
      <div className="stats">
        <div className="stat"><div className="stat-label">岩手県の歯科診療所数（{LATEST_DENTAL}年）</div><div className="stat-value">{fmt(d.dent, '施設')}</div><div className="stat-sub">2009年比 {fmtSigned(d.dent - d0.dent, '施設')}</div></div>
        <div className="stat"><div className="stat-label">岩手県の人口（{LATEST_POP}年1月1日）</div><div className="stat-value">{fmt(p.total, '人')}</div><div className="stat-sub">2013年比 {fmtSigned(p.total - p0.total, '人')}</div></div>
        <div className="stat"><div className="stat-label">岩手県の民営事業所数（2021年）</div><div className="stat-value">{fmt(e['2021'].estab, '事業所')}</div><div className="stat-sub">従業者 {fmt(e['2021'].workers, '人')}</div></div>
        <div className="stat"><div className="stat-label">岩手県の高齢化率（{LATEST_CENSUS}年）</div><div className="stat-value">{fmt(agingRate(c))}%</div><div className="stat-sub">平均年齢 {fmt(c.avg_age != null ? Math.round(c.avg_age * 10) / 10 : null)}歳</div></div>
        <div className="stat"><div className="stat-label">岩手県の自然増減（{LATEST_VITAL}年）</div><div className="stat-value">{fmtSigned(naturalChange(vitalPrefAt(LATEST_VITAL)), '人')}</div><div className="stat-sub">出生 {fmt(vitalPrefAt(LATEST_VITAL).births, '人')}・死亡 {fmt(vitalPrefAt(LATEST_VITAL).deaths, '人')}</div></div>
        <div className="stat"><div className="stat-label">65歳以上の単独世帯（{LATEST_HOUSE}年）</div><div className="stat-value">{fmt(housePrefAt(LATEST_HOUSE).eld_single_hh, '世帯')}</div><div className="stat-sub">一般世帯の {fmt(hhShare(housePrefAt(LATEST_HOUSE).eld_single_hh, housePrefAt(LATEST_HOUSE).general_hh))}%</div></div>
        <div className="stat"><div className="stat-label">岩手県の病院病床（{LATEST_MED}年）</div><div className="stat-value">{fmt(medPrefAt(LATEST_MED).hosp_beds, '床')}</div><div className="stat-sub">病院 {fmt(medPrefAt(LATEST_MED).hospitals, '施設')}・医師 {fmt(medPrefAt(LATEST_DOC_YEAR).doctors, '人')}（{LATEST_DOC_YEAR}年）</div></div>
        <div className="stat"><div className="stat-label">1人当たり課税対象所得（{LATEST_ECON}年）</div><div className="stat-value">{fmt(incomePerTaxpayer(econPrefAt(LATEST_ECON)), '円')}</div><div className="stat-sub">納税義務者 {fmt(econPrefAt(LATEST_ECON).taxpayers, '人')}</div></div>
        <div className="stat"><div className="stat-label">小学校の児童数（{LATEST_SCHOOL}年）</div><div className="stat-value">{fmt(schoolPrefAt(LATEST_SCHOOL).es_pupils, '人')}</div><div className="stat-sub">{fmt(schoolPrefAt(LATEST_SCHOOL).es, '校')}・{FIRST_SCHOOL}年比 {fmtSigned(schoolPrefAt(LATEST_SCHOOL).es! - schoolPrefAt(FIRST_SCHOOL).es!, '校')}</div></div>
        <div className="stat"><div className="stat-label">完全失業率（{LATEST_JOBLESS}年）</div><div className="stat-value">{fmt(joblessRate(joblessPrefAt(LATEST_JOBLESS)), '%')}</div><div className="stat-sub">完全失業者 {fmt(joblessPrefAt(LATEST_JOBLESS).jobless, '人')}・{FIRST_JOBLESS}年 {fmt(joblessRate(joblessPrefAt(FIRST_JOBLESS)), '%')}</div></div>
        <div className="stat"><div className="stat-label">大学・大学院卒の割合（{LATEST_EDU}年）</div><div className="stat-value">{fmt(eduShare(eduPrefAt(LATEST_EDU).grad_univ, eduPrefAt(LATEST_EDU).grad_total), '%')}</div><div className="stat-sub">{fmt(eduPrefAt(LATEST_EDU).grad_univ, '人')}・{FIRST_EDU}年 {fmt(eduShare(eduPrefAt(FIRST_EDU).grad_univ, eduPrefAt(FIRST_EDU).grad_total), '%')}</div></div>
        <div className="stat"><div className="stat-label">販売農家（{LATEST_FARM}年）</div><div className="stat-value">{fmt(farmPrefAt(LATEST_FARM).sales_farms, '戸')}</div><div className="stat-sub">総農家 {fmt(totalFarms(farmPrefAt(LATEST_FARM)), '戸')}・{FIRST_FARM}年 {fmt(farmPrefAt(FIRST_FARM).sales_farms, '戸')}</div></div>
        <div className="stat"><div className="stat-label">住宅着工（{LATEST_BUILD}年）</div><div className="stat-value">{fmt(buildPrefAt(LATEST_BUILD).bldg_house, '棟')}</div><div className="stat-sub">居住専用住宅・床面積 {fmt(buildPrefAt(LATEST_BUILD).floor_house)}m²</div></div>
      </div>
      <div className="cards">
        <div className="card"><h2>歯科診療所数の推移</h2><p>医療施設調査（厚労省）から、市町村別の歯科診療所数・一般診療所数を2009〜{LATEST_DENTAL}年で。人口10万人当たりと県内順位つき。</p><Link className="more" href="/dental/">県全体と市町村ランキングを見る →</Link></div>
        <div className="card"><h2>人口・世帯・自然増減・社会増減</h2><p>住民基本台帳（総務省）から、各市町村の人口・世帯数、出生・死亡、転入・転出を2013〜{LATEST_POP}年で。</p><Link className="more" href="/population/">市町村別の人口動態を見る →</Link></div>
        <div className="card"><h2>産業別の事業所数・従業者数・売上</h2><p>経済センサス（2016年・2021年）から、産業大分類×市町村の事業所数・従業者数・売上（収入）金額。</p><Link className="more" href="/industry/">業種別ランキングを見る →</Link></div>
        <div className="card"><h2>高齢化率・年齢構成</h2><p>国勢調査（2015年・2020年）から、市町村別の高齢化率・年少人口割合・平均年齢・年齢中位数・人口密度。5年間の変化つき。</p><Link className="more" href="/aging/">高齢化率ランキングを見る →</Link></div>
        <div className="card"><h2>就業者・産業別就業者・昼夜間人口</h2><p>国勢調査から、市町村別の就業者数・労働力率・産業大分類別就業者数と、昼間人口・昼夜間人口比率。</p><Link className="more" href="/work/">就業と昼夜間人口を見る →</Link></div>
        <div className="card"><h2>住宅着工・建築着工</h2><p>建築着工統計（国交省）から、市町村別の居住専用住宅の着工棟数・床面積・工事費予定額を{FIRST_BUILD}〜{LATEST_BUILD}年で。</p><Link className="more" href="/building/">市町村別の住宅着工を見る →</Link></div>
        <div className="card"><h2>病院・病床・医師</h2><p>医療施設調査・医師歯科医師薬剤師統計から、市町村別の病院数・病床数・医師数・歯科医師数・薬剤師数を{FIRST_MED}〜{LATEST_MED}年で。人口10万人当たりつき。</p><Link className="more" href="/medical/">市町村別の医療体制を見る →</Link></div>
        <div className="card"><h2>学校・児童生徒</h2><p>学校基本調査から、市町村別の幼稚園・小学校・中学校・高校の学校数と児童生徒数・教員数を{FIRST_SCHOOL}〜{LATEST_SCHOOL}年で。1校当たり児童数つき。</p><Link className="more" href="/school/">市町村別の学校を見る →</Link></div>
        <div className="card"><h2>完全失業率・労働力</h2><p>国勢調査から、市町村別の完全失業率・完全失業者数・労働力人口・就業者数と65歳以上の就業者を{FIRST_JOBLESS}〜{LATEST_JOBLESS}年で。県内順位つき。</p><Link className="more" href="/jobless/">市町村別の失業率を見る →</Link></div>
        <div className="card"><h2>最終学歴・大卒率</h2><p>国勢調査から、市町村別の最終学歴人口（小中学校・高校・短大高専・大学大学院）と構成比を{FIRST_EDU}年・{LATEST_EDU}年の2時点で。</p><Link className="more" href="/education/">市町村別の学歴を見る →</Link></div>
        <div className="card"><h2>農家数・耕作放棄地</h2><p>農林業センサスから、市町村別の販売農家・自給的農家・専業兼業別の農家数と耕作放棄地面積を{FIRST_FARM}〜{LATEST_FARM}年で。</p><Link className="more" href="/farm/">市町村別の農家を見る →</Link></div>
        <div className="card"><h2>所得・製造業・農地</h2><p>市町村税課税状況等の調・工業統計・耕地面積統計から、市町村別の課税対象所得と納税義務者、製造品出荷額等、耕地面積を{FIRST_ECON}〜{LATEST_ECON}年で。</p><Link className="more" href="/economy/">市町村別の所得と産業を見る →</Link></div>
        <div className="card"><h2>ごみ・生活インフラ</h2><p>一般廃棄物処理事業実態調査から、市町村別のごみ総排出量・1人1日当たり排出量・リサイクル率・最終処分量・水洗化率を{FIRST_ENV}〜{LATEST_ENV}年度で。</p><Link className="more" href="/garbage/">市町村別のごみを見る →</Link></div>
        <div className="card"><h2>介護施設・国民健康保険</h2><p>社会福祉施設等調査から、市町村別の特別養護老人ホーム・有料老人ホームの施設数と定員、国民健康保険被保険者数を{FIRST_WEL}〜{LATEST_WEL}年で。高齢者千人当たりつき。</p><Link className="more" href="/welfare/">市町村別の介護施設を見る →</Link></div>
        <div className="card"><h2>出生・死亡・婚姻・離婚</h2><p>人口動態調査から、市町村別の出生数・死亡数・自然増減・婚姻件数・離婚件数を{FIRST_VITAL}〜{LATEST_VITAL}年で。人口千人当たりと県内順位つき。</p><Link className="more" href="/vital/">市町村別の人口動態を見る →</Link></div>
        <div className="card"><h2>全データを一括で（Excel）</h2><p>上の全ファミリーを1つのExcelにまとめたデータ集。33市町村×全年・出典シート付き。各ページからはCSVを無料でダウンロードできます。</p><Link className="more" href="/data/">データ集について →</Link></div>
        <div className="card"><h2>世帯・高齢者単身世帯</h2><p>国勢調査から、市町村別の一般世帯数・単独世帯・65歳以上の単独世帯・高齢夫婦のみの世帯・核家族世帯を{FIRST_HOUSE}〜{LATEST_HOUSE}年で。</p><Link className="more" href="/household/">世帯の内訳を見る →</Link></div>
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
