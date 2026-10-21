import type { Metadata } from 'next';
import Link from 'next/link';
import { fmt, rank, SITE } from '@/lib/data';
import { BarChart } from '@/components/Chart';
import { Breadcrumb, SourceBox, CiteBox, DatasetJsonLd, Cta } from '@/components/Shell';
import { WEB_CATS, WEB_META, WEB_CHECKS, WEB_ASOF_LABEL, CHECK_LABEL, WEB_ALL, webAt, webPref, passRate, share, webMunis } from '@/lib/web';

const P = webPref();
const GAP = share(P.seo_high_aeo_low, P.audited);
const TITLE = `岩手県内${fmt(P.audited)}サイトのSEO・AI検索対応度（${WEB_ASOF_LABEL}実測）`;
const MIN_N = 10; // 平均点を出す最低件数（これ未満の市町村は件数だけ示す）
const sentence = `公的オープンデータとGoogleマップに登録された岩手県内の事業所のWebサイト${fmt(P.audited)}件を実測したところ、平均点はSEO（従来の検索）が${fmt(P.avg_seo)}点、AI検索への対応が${fmt(P.avg_aeo)}点だった。SEOが60点以上なのにAI検索対応が60点未満のサイトが${fmt(GAP)}%を占め、FAQの構造化データを持つサイトは${fmt(passRate(P, 'faq'))}%、llms.txt を置いているサイトは${fmt(passRate(P, 'llms-txt'))}%にとどまる（いわてデータ調べ、${WEB_ASOF_LABEL}）。`;

export const metadata: Metadata = {
  title: TITLE,
  description: sentence,
  alternates: { canonical: '/web/' },
};

export default function Page() {
  const cats = WEB_CATS.map(c => ({ c, r: webPref(c) })).sort((a, b) => b.r.audited - a.r.audited);
  const checks = WEB_CHECKS.map(id => ({ id, ...CHECK_LABEL[id], rate: passRate(P, id) }));
  const munis = webMunis();
  const big = munis.filter(x => x.c.audited >= MIN_N);
  const rAvg = rank(big, x => x.c.avg_overall);
  const rankOf = new Map(big.map(x => [x.m.code, rAvg.get(x)]));
  const byAvg = [...big].sort((a, b) => (b.c.avg_overall ?? 0) - (a.c.avg_overall ?? 0));
  const failed = P.sites - P.audited;
  return (
    <>
      <Breadcrumb items={[{ name: 'Webサイト調査' }]} />
      <DatasetJsonLd name={TITLE} description={sentence} path="/web/" keywords={['岩手県', 'SEO', 'AI検索', 'LLMO', 'GEO', 'ホームページ', '医療機関', '介護事業所', '飲食店', '工務店', '市町村別']} temporal={WEB_META.collected} sourceKeys={['websurvey', 'iryou', 'kaigo', 'shofuku']} />
      <h1>{TITLE}</h1>
      <p className="key-fact">{sentence.replace(/（いわてデータ調べ.*）。$/, '。')}</p>
      <p>Googleの検索結果で上位に出るための対策（SEO）と、ChatGPTやGoogleのAIによる概要などAIの回答に引用されるための対策（AI検索対応、LLMO・GEOとも呼ばれる）は、見られる項目が違います。岩手県内で実際に公開されているサイトが、それぞれにどこまで対応しているかを、同じ物差しで一斉に測りました。</p>

      <h2>業種別の結果</h2>
      <BarChart title="業種別の平均点（総合、100点満点）" items={cats.map(x => ({ label: x.c, value: x.r.avg_overall }))} unit="点" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>業種</th><th>対象サイト</th><th>取得できた</th><th>総合</th><th>SEO</th><th>AI検索</th><th>SEOは60点以上・AIは60点未満</th><th>S・A評価</th></tr></thead>
          <tbody>
            <tr className="hl"><td>全業種</td><td>{fmt(P.sites)}</td><td>{fmt(P.audited)}</td><td>{fmt(P.avg_overall)}</td><td>{fmt(P.avg_seo)}</td><td>{fmt(P.avg_aeo)}</td><td>{fmt(GAP)}%</td><td>{fmt(share(P.grade_S + P.grade_A, P.audited))}%</td></tr>
            {cats.map(({ c, r }) => (
              <tr key={c}><td>{c}</td><td>{fmt(r.sites)}</td><td>{fmt(r.audited)}</td><td>{fmt(r.avg_overall)}</td><td>{fmt(r.avg_seo)}</td><td>{fmt(r.avg_aeo)}</td>
                <td>{fmt(share(r.seo_high_aeo_low, r.audited))}%</td><td>{fmt(share(r.grade_S + r.grade_A, r.audited))}%</td></tr>))}
          </tbody>
        </table>
      </div>

      <h2>項目別：できているサイトの割合</h2>
      <p>取得できた{fmt(P.audited)}サイトのうち、各項目の基準を満たしていたサイトの割合です。SEOの基本項目は多くのサイトが満たしている一方、AI検索向けの項目は軒並み低くなっています。</p>
      <BarChart title="AI検索対応の項目別 達成率（%）" items={checks.filter(x => x.axis === 'AI').sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0)).map(x => ({ label: x.label, value: x.rate }))} unit="%" />
      <BarChart title="SEOの項目別 達成率（%）" items={checks.filter(x => x.axis === 'SEO').sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0)).map(x => ({ label: x.label, value: x.rate }))} unit="%" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>区分</th><th>項目</th><th>満たしていたサイト</th><th>割合</th></tr></thead>
          <tbody>{checks.map(x => <tr key={x.id}><td>{x.axis === 'AI' ? 'AI検索' : 'SEO'}</td><td>{x.label}</td><td>{fmt(P[`pass_${x.id}`])}</td><td>{fmt(x.rate)}%</td></tr>)}</tbody>
        </table>
      </div>
      <p>robots.txt でAI関連のクローラ（GPTBot・ClaudeBot・Google-Extended など）を1つ以上拒否していたサイトは{fmt(P.ai_bots_blocked)}サイト。WordPress で作られていたサイトは{fmt(P.wordpress)}サイト（{fmt(share(P.wordpress, P.audited))}%）でした。</p>

      <h2>市町村別の結果</h2>
      <p>サイトの所在地は、そのURLを公表している事業所の所在地です。取得できたサイトが{MIN_N}件未満の市町村は、件数だけを示し平均点は出していません。登録住所から市町村を判定できなかった{fmt(webAt(WEB_ALL, '00000')?.sites ?? 0)}サイトは、市町村別の表に含めていません（県全体の集計には含む）。</p>
      <BarChart title={`市町村別の平均点（総合、取得${MIN_N}サイト以上の市町村）`} items={byAvg.map(x => ({ label: x.m.name, value: x.c.avg_overall }))} unit="点" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>市町村</th><th>対象サイト</th><th>取得できた</th><th>総合</th><th>順位</th><th>SEO</th><th>AI検索</th></tr></thead>
          <tbody>{munis.map(({ m, c }) => {
            const ok = c.audited >= MIN_N;
            return <tr key={m.code}><td>{m.name}</td><td>{fmt(c.sites)}</td><td>{fmt(c.audited)}</td>
              <td>{ok ? fmt(c.avg_overall) : '—'}</td><td>{ok ? `${rankOf.get(m.code)}位` : '—'}</td>
              <td>{ok ? fmt(c.avg_seo) : '—'}</td><td>{ok ? fmt(c.avg_aeo) : '—'}</td></tr>;
          })}</tbody>
        </table>
      </div>

      <section className="cta" aria-label="自分のサイトを診断する">
        <h2>自分のサイトは何点か</h2>
        <p>この調査と同じ25項目で、お手持ちのサイトをその場で診断できます（無料・登録不要）。</p>
        <div className="tools"><a className="btn primary" href={`${SITE.publisherUrl}seo-aeo-checker?ref=iwate-data-web`} rel="noopener">SEO × AI検索 無料診断へ</a></div>
      </section>

      <h2>調べ方</h2>
      <ul>
        <li>対象：医療情報ネット（病院・診療所・歯科診療所・薬局・助産所）、介護サービス情報公表システム、障害福祉サービス等情報公表システム、gBizINFO（法人基本情報）の各オープンデータと、Googleマップの事業者情報（DataForSEO経由で取得）に、岩手県内の事業所として登録されているWebサイトのURL。同じサイト（同じドメイン）を登録している事業所が複数ある場合は1サイトとして数えた。SNS・地図サービス・官公庁や市町村のサイトと、Googleマップで同じURLを10か所以上が登録しているもの（全国チェーンなど）は除いた</li>
        <li>件数：対象{fmt(P.sites)}サイトのうち、{fmt(P.audited)}サイトのトップページを取得できた。残る{fmt(failed)}サイトは、サーバーが応答しない・ページが存在しない・証明書の不備などで取得できなかった</li>
        <li>判定：トップページのHTMLと robots.txt・sitemap.xml・llms.txt を取得し、SEO15項目・AI検索対応10項目を判定した。各項目は「満たす1点・一部満たす0.5点・満たさない0点」を重みづけして100点満点にし、総合はSEOとAI検索対応の平均。検索順位やアクセス数、AIに実際に引用されたかどうかは見ていない</li>
        <li>評価：総合90点以上をS、75点以上をA、60点以上をB、40点以上をC、それ未満をDとした</li>
        <li>時点：URLの原データは {WEB_META.sources.map(x => x.replace('iryou=', '医療情報ネット ').replace('kaigo=', '介護 ').replace('shofuku=', '障害福祉 ').replace('gbiz=', 'gBizINFO ').replace('gmap=', 'Googleマップ ')).join('、')} 時点。サイトの取得は{WEB_META.collected}</li>
        <li>個別のサイト名・事業者名は公表しない。判定の仕組みは公開している（<a href="https://github.com/beakoda/iwate-data/tree/main/scripts/web_survey" rel="noopener">判定スクリプト</a>）</li>
      </ul>

      <CiteBox title={TITLE} path="/web/" sentence={sentence} />
      <Cta topic="Webサイトの対応状況" />
      <SourceBox keys={['websurvey', 'iryou', 'kaigo', 'shofuku']} extra={[
        'Webサイトを公的データかGoogleマップに登録している事業所が母集団のため、サイトを持たない事業所や、どちらにもURLを載せていない事業所は含まれない。県内のサイト全体の無作為標本ではない。業種は母集団ごとの分類（医療・介護の届出種別、法人の業種、Googleマップのカテゴリ）をおおまかにまとめたもので、どれにも当てはまらないものは「その他の事業所・団体」とした。',
        '市町村別・業種別の件数は、そのサイトを公表している事業所のうち最初に見つかったものの所在地・種別で数えている。法人の本部サイトを複数市町村の事業所が公表している場合も、1つの市町村に計上される。',
      ]} />
      <p><small>関連：<Link href="/iryou/">病院・薬局の数とHP公表率</Link>／<Link href="/kaigo/">介護事業所</Link>／<Link href="/shofuku/">障害福祉事業所</Link>／<Link href="/ai/">AI推薦調査</Link></small></p>
    </>
  );
}
