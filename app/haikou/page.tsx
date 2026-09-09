import type { Metadata } from 'next';
import Link from 'next/link';
import { MUNIS, muniByCode, schoolCodeAt, schoolCodePref, closedAt, closedPref, closedShare, fmt, rank, SCHOOL_KINDS, CLOSED_YEARS, FIRST_CLOSED, LATEST_CLOSED } from '@/lib/data';
import { LineChart, BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd } from '@/components/Shell';

const TITLE = `岩手県で廃校になった学校の一覧（${FIRST_CLOSED}〜${LATEST_CLOSED}年・128校）`;
const ALL = closedPref();
const ACTIVE = schoolCodePref();

export const metadata: Metadata = {
  title: TITLE,
  description: `岩手県では${FIRST_CLOSED}年以降に${ALL.length}校が廃止された（小学校${ALL.filter(x => x.kind === '小学校').length}・中学校${ALL.filter(x => x.kind === '中学校').length}・幼稚園${ALL.filter(x => x.kind === '幼稚園').length}ほか）。文部科学省の学校コード一覧から、33市町村別に廃校名・廃止年・学校種を一覧。`,
  alternates: { canonical: '/haikou/' },
};

export default function Page() {
  const rows = MUNIS.map(m => ({ m, c: closedAt(m.code).length, a: schoolCodeAt(m.code), share: closedShare(m.code) }));
  const rC = rank(rows, r => r.c), rS = rank(rows, r => r.share);
  const byClosed = [...rows].sort((a, b) => b.c - a.c);
  const byShare = [...rows].filter(r => r.share != null && r.c > 0).sort((a, b) => b.share! - a.share!);
  const none = rows.filter(r => r.c === 0).map(r => r.m.name);
  const byKind = SCHOOL_KINDS.map(k => ({ k, n: ALL.filter(x => x.kind === k).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  const sentence = `岩手県では${FIRST_CLOSED}年から${LATEST_CLOSED}年までに${ALL.length}校が廃止された。内訳は${byKind.slice(0, 3).map(x => `${x.k}${x.n}校`).join('・')}など。市町村別では${byClosed[0].m.name}が${byClosed[0].c}校で最も多く、現存校を含めた全体に占める割合では${byShare[0].m.name}の${fmt(byShare[0].share)}%が最も高い。`;
  return (
    <>
      <Breadcrumb items={[{ name: '廃校' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/haikou/" keywords={['岩手県', '廃校', '統廃合', '小学校', '中学校', '学校コード', '市町村別']} temporal={`${FIRST_CLOSED}/${LATEST_CLOSED}`} sourceKeys={['schoolcode']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">岩手県では{FIRST_CLOSED}年以降に<strong>{ALL.length}校</strong>が廃止された（{byKind.map(x => `${x.k}${x.n}`).join('・')}）。現存するのは{fmt(ACTIVE)}校なので、<strong>この6年で県内の学校の{fmt(Math.round((ALL.length / (ACTIVE + ALL.length)) * 1000) / 10)}%が姿を消した</strong>計算になる。廃校が最も多いのは<strong>{byClosed[0].m.name}（{byClosed[0].c}校）</strong>、次いで{byClosed[1].m.name}（{byClosed[1].c}校）。1校も廃止されていないのは{none.length}市町村。</p>
      <LineChart title={`岩手県で廃止された学校の数（${FIRST_CLOSED}〜${LATEST_CLOSED}年、校）`} unit="校" zero
        series={[{ label: '廃止された学校', points: CLOSED_YEARS.map(y => ({ x: y, y: ALL.filter(x => x.year === y).length })) }]} />
      <BarChart title={`学校種別ごとの廃校数（${FIRST_CLOSED}〜${LATEST_CLOSED}年）`} items={byKind.map(x => ({ label: x.k, value: x.n }))} unit="校" />
      <BarChart title={`廃校数（市町村別、${FIRST_CLOSED}〜${LATEST_CLOSED}年）`} items={byClosed.filter(r => r.c > 0).map(r => ({ label: r.m.name, value: r.c }))} unit="校" />
      <BarChart title={`廃校の割合（廃校 ÷ 現存校＋廃校、%）`} items={byShare.map(r => ({ label: r.m.name, value: r.share }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>廃校</th><th>順位</th><th>現存校</th><th>廃校の割合</th><th>順位</th>{CLOSED_YEARS.map(y => <th key={y}>{y}</th>)}</tr></thead>
          <tbody>
            <tr className="hl"><td>岩手県（33市町村計）</td><td>{ALL.length}</td><td>—</td><td>{fmt(ACTIVE)}</td><td>{fmt(Math.round((ALL.length / (ACTIVE + ALL.length)) * 1000) / 10)}%</td><td>—</td>
              {CLOSED_YEARS.map(y => <td key={y}>{ALL.filter(x => x.year === y).length}</td>)}</tr>
            {byClosed.map(r => (
              <tr key={r.m.code}><td><Link href={`/haikou/${r.m.slug}/`}>{r.m.name}</Link></td>
                <td>{r.c}</td><td>{rC.get(r) ?? '—'}位</td><td>{fmt(r.a)}</td>
                <td>{r.share == null ? '—' : `${fmt(r.share)}%`}</td><td>{r.c > 0 ? `${rS.get(r) ?? '—'}位` : '—'}</td>
                {CLOSED_YEARS.map(y => <td key={y}>{closedAt(r.m.code).filter(x => x.year === y).length || ''}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <h2>廃校になった学校（{FIRST_CLOSED}〜{LATEST_CLOSED}年、全{ALL.length}校）</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>廃止年</th><th>学校種</th><th>学校名</th><th>市町村</th></tr></thead>
          <tbody>
            {[...ALL].sort((a, b) => b.year - a.year || a.code.localeCompare(b.code) || a.name.localeCompare(b.name)).map((x, i) => (
              <tr key={i}><td>{x.year}年</td><td>{x.kind}</td><td className="wrap">{x.name}</td>
                <td><Link href={`/haikou/${muniByCode(x.code)!.slug}/`}>{muniByCode(x.code)!.name}</Link></td></tr>))}
          </tbody>
        </table>
      </div>
      <h2>市町村別ページ</h2>
      <ul className="grid-links">{MUNIS.map(m => <li key={m.code}><Link href={`/haikou/${m.slug}/`}>{m.name}の廃校<small>{closedAt(m.code).length}校（{FIRST_CLOSED}年以降）・現存 {fmt(schoolCodeAt(m.code))}校</small></Link></li>)}</ul>
      <CiteBox title={TITLE} path="/haikou/" sentence={sentence} />
      <SourceBox keys={['schoolcode']} extra={[
        `学校コード制度は2020年12月に始まったため、廃止年月日が記録されているのは${FIRST_CLOSED}年以降の廃校に限られる。それ以前の廃校はこの一覧に含まれない。「岩手県の廃校のすべて」ではない点に注意。`,
        '幼稚園・認定こども園・専修学校・各種学校も学校コードの対象なので含めている。小中学校の統廃合だけを見たい場合は学校種で絞ること。',
        '廃止年は「廃止年月日」の年。統合によって新設校へ移行したものも廃止として数えている（統合先の新設校は現存校に入る）ため、廃校数がそのまま学校の純減数になるわけではない。',
        '市町村は学校所在地の住所文字列から判定している（学校コード一覧には市区町村コードが無いため）。33市町村すべてに判定でき、判定できなかった学校は0件。',
        '現存校数・廃校数は「学校基本調査」を出典とする本サイトの「学校」ページとは対象範囲も時点も異なるため一致しない。',
      ]} />
    </>
  );
}
