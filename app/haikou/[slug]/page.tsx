import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniBySlug, schoolCodeAt, schoolCodePref, closedAt, closedPref, closedShare, popAt, fmt, fmtSigned, pct, rank, SCHOOL_KINDS, CLOSED_YEARS, FIRST_CLOSED, LATEST_CLOSED, LATEST_POP } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

export function generateStaticParams() { return MUNIS.map(m => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const c = closedAt(m.code);
  return {
    title: `${m.name}の廃校一覧（${FIRST_CLOSED}〜${LATEST_CLOSED}年）`,
    description: c.length
      ? `${m.name}（岩手県）では${FIRST_CLOSED}年以降に${c.length}校が廃止された（${c.slice(0, 3).map(x => x.name).join('、')}ほか）。廃校名・廃止年・学校種の一覧と、現存する${fmt(schoolCodeAt(m.code))}校の内訳。`
      : `${m.name}（岩手県）では${FIRST_CLOSED}年以降に廃止された学校はない。現存する${fmt(schoolCodeAt(m.code))}校の学校種別の内訳と、岩手県内33市町村の廃校状況。`,
    alternates: { canonical: `/haikou/${m.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = muniBySlug(slug)!;
  const c = closedAt(m.code), a = schoolCodeAt(m.code), share = closedShare(m.code);
  const rows = MUNIS.map(mm => ({ m: mm, c: closedAt(mm.code).length, share: closedShare(mm.code) }));
  const rC = rank(rows, x => x.c), rS = rank(rows, x => x.share);
  const me = rows.find(x => x.m.code === m.code)!;
  const ALL = closedPref(), ACTIVE = schoolCodePref();
  const prefShare = Math.round((ALL.length / (ACTIVE + ALL.length)) * 1000) / 10;
  const byKind = SCHOOL_KINDS.map(k => ({ k, act: schoolCodeAt(m.code, k), cl: c.filter(x => x.kind === k).length }))
    .filter(x => x.act > 0 || x.cl > 0);
  const pop = popAt(m.code, LATEST_POP), pop0 = popAt(m.code, FIRST_CLOSED);
  const title = `${m.name}の廃校一覧（${FIRST_CLOSED}〜${LATEST_CLOSED}年）`;
  const sentence = c.length
    ? `${m.name}では${FIRST_CLOSED}年から${LATEST_CLOSED}年までに${c.length}校が廃止された（岩手県内33市町村中${rC.get(me) ?? '—'}位）。現存校は${fmt(a)}校で、廃校の割合は${fmt(share)}%（県平均${fmt(prefShare)}%）。`
    : `${m.name}では${FIRST_CLOSED}年から${LATEST_CLOSED}年までに廃止された学校はない。現存校は${fmt(a)}校。岩手県全体ではこの間に${ALL.length}校が廃止されている。`;
  return (
    <>
      <Breadcrumb items={[{ name: '廃校', href: '/haikou/' }, { name: m.name }]} />
      <DatasetJsonLd name={title} description={sentence} path={`/haikou/${m.slug}/`}
        keywords={[m.name, '廃校', '統廃合', '小学校', '中学校', '岩手県']} temporal={`${FIRST_CLOSED}/${LATEST_CLOSED}`} sourceKeys={['schoolcode']} />
      <h1>{title}</h1>
      <p className="key-fact">
        {c.length ? <>
          {m.name}では{FIRST_CLOSED}年以降に<strong>{c.length}校</strong>が廃止された（県内<strong>{rC.get(me) ?? '—'}位</strong>）。
          現存校は{fmt(a)}校なので、廃校の割合は<strong>{fmt(share)}%</strong>（県平均{fmt(prefShare)}%）。
          最も新しい廃校は{c[c.length - 1].year}年の<strong>{c[c.length - 1].name}</strong>。
        </> : <>
          {m.name}では{FIRST_CLOSED}年以降に廃止された学校は<strong>ない</strong>。現存校は<strong>{fmt(a)}校</strong>。
          岩手県全体では同じ期間に{ALL.length}校が廃止されている。
        </>}
      </p>
      <div className="stats">
        <div className="stat"><div className="stat-label">廃校（{FIRST_CLOSED}年以降）</div><div className="stat-value">{c.length}</div><div className="stat-sub">校・県内 {rC.get(me) ?? '—'}位</div></div>
        <div className="stat"><div className="stat-label">現存校</div><div className="stat-value">{fmt(a)}</div><div className="stat-sub">校（幼稚園・専修学校を含む）</div></div>
        <div className="stat"><div className="stat-label">廃校の割合</div><div className="stat-value">{share == null ? '—' : `${fmt(share)}%`}</div><div className="stat-sub">廃校 ÷（現存＋廃校）・県平均 {fmt(prefShare)}%</div></div>
        {pop && pop0 && <div className="stat"><div className="stat-label">人口（{FIRST_CLOSED}→{LATEST_POP}年）</div><div className="stat-value">{fmtSigned(pct(pop.total, pop0.total), '%')}</div><div className="stat-sub">{fmt(pop0.total)} → {fmt(pop.total)}人 → <Link href={`/population/${m.slug}/`}>推移を見る</Link></div></div>}
      </div>
      {c.length > 0 && <>
        <h2>廃校になった学校</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>廃止年</th><th>学校種</th><th>学校名</th></tr></thead>
            <tbody>{c.map((x, i) => <tr key={i}><td>{x.year}年</td><td>{x.kind}</td><td className="wrap">{x.name}</td></tr>)}</tbody>
          </table>
        </div>
        <BarChart title={`${m.name}の廃校数（${FIRST_CLOSED}〜${LATEST_CLOSED}年、校）`} items={CLOSED_YEARS.map(y => ({ label: `${y}年`, value: c.filter(x => x.year === y).length }))} unit="校" />
      </>}
      <h2>学校種別ごとの現存校と廃校</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>学校種</th><th>現存校</th><th>廃校（{FIRST_CLOSED}年以降）</th><th>県内の現存校</th></tr></thead>
          <tbody>
            {byKind.map(x => <tr key={x.k}><td>{x.k}</td><td>{fmt(x.act)}</td><td>{x.cl || '—'}</td><td>{fmt(schoolCodePref(x.k))}</td></tr>)}
            <tr className="hl"><td>合計</td><td>{fmt(a)}</td><td>{c.length || '—'}</td><td>{fmt(ACTIVE)}</td></tr>
          </tbody>
        </table>
      </div>
      <h2>{m.name}の他の統計</h2>
      <ul className="grid-links">
        <li><Link href={`/school/${m.slug}/`}>{m.name}の学校・児童生徒数（時系列）</Link></li>
        <li><Link href={`/population/${m.slug}/`}>{m.name}の人口</Link></li>
        <li><Link href={`/aging/${m.slug}/`}>{m.name}の高齢化率</Link></li>
        <li><Link href={`/city/${m.slug}/`}>{m.name}の統計まとめ</Link></li>
      </ul>
      <CiteBox title={title} path={`/haikou/${m.slug}/`} sentence={sentence} />
      <SourceBox keys={['schoolcode']} extra={[
        `学校コード制度は2020年12月に始まったため、記録されているのは${FIRST_CLOSED}年以降の廃校に限られる。それ以前の廃校は含まれない。`,
        '幼稚園・認定こども園・専修学校・各種学校も含む。小中学校の統廃合だけを見たい場合は学校種で絞ること。',
        '統合によって新設校へ移行したものも廃止として数えている（統合先の新設校は現存校に入る）ため、廃校数がそのまま学校の純減数になるわけではない。',
        '市町村は学校所在地の住所文字列から判定している（学校コード一覧には市区町村コードが無いため）。',
        '「学校基本調査」を出典とする本サイトの「学校」ページとは対象範囲も時点も異なるため一致しない。',
      ]} />
    </>
  );
}
