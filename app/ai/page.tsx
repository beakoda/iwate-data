import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, fmt } from '@/lib/data';
import { Breadcrumb, CiteBox } from '@/components/Shell';
import { AI_SURVEY, AI_MORIOKA, AI_DENTAL_CITIES, MORIOKA_NAMED, MORIOKA_OWN, MIXED_CASES, OWN_ON_TOP, TOTAL_MEASUREMENTS, type AiRow } from '@/lib/aiSurvey';

const TITLE = 'AIは岩手の事業者をどう推薦しているか（ChatGPT実測調査）';
const ownPct = Math.round((MORIOKA_OWN / MORIOKA_NAMED) * 100);
const ZERO = AI_MORIOKA.filter(r => r.own === 0).map(r => r.label);
const sentence = `ChatGPTに「盛岡市でおすすめの◯◯」と8業種で質問したところ、推薦された${MORIOKA_NAMED}事業者のうち、自社サイトが根拠として引用されたのは${MORIOKA_OWN}事業者（${ownPct}%）だった。${ZERO.join('・')}では0件（いわてデータ調べ、${AI_SURVEY.asOf}）。`;

export const metadata: Metadata = {
  title: TITLE,
  description: `${sentence} 自社サイトが根拠になった事業者は、外部情報で挙がった事業者より上位に並ぶ傾向があった（${MIXED_CASES}ケース中${OWN_ON_TOP}ケース）。`,
  alternates: { canonical: '/ai/' },
};

const ranks = (r: AiRow) => (r.ownRanks.length ? r.ownRanks.join('・') + '番目' : '—');

export default function Page() {
  return (
    <>
      <Breadcrumb items={[{ name: 'AI推薦調査' }]} />
      <h1>{TITLE}</h1>
      <p className="key-fact">ChatGPTに「<strong>盛岡市でおすすめの◯◯</strong>」と8業種で質問したところ、推薦された<strong>{MORIOKA_NAMED}事業者のうち、自社サイトが根拠として引用されたのは{MORIOKA_OWN}事業者（{ownPct}%）</strong>でした。<strong>{ZERO.join('・')}</strong>では、自社サイトが根拠になった事業者は<strong>1件もありません</strong>でした。</p>
      <p>AIに「おすすめ」を聞く人は増えています。AIは回答を作る前に自分でWeb検索をかけ、読めた情報をもとに事業者を選びます。その「読めた情報」が何なのかを、岩手の実際の回答で調べました。</p>

      <h2>盛岡市：業種別の結果</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>業種</th><th>AIが挙げた数</th><th>うち自社サイトが根拠</th><th>その事業者の記載順</th><th>それ以外の主な根拠</th><th>盛岡市の母数（いわてデータ）</th></tr></thead>
          <tbody>
            {AI_MORIOKA.map(r => (
              <tr key={r.label}>
                <td>{r.label}</td><td>{r.named}</td><td><strong>{r.own}</strong></td><td>{ranks(r)}</td><td>{r.source}</td>
                <td>{r.refHref ? <Link href={r.refHref}>{r.refLabel} {fmt(r.refValue!)}</Link> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p><small>母数は業種そのものの数ではなく、その業種を含む産業大分類の事業所数（経済センサス‐活動調査 2021年）。歯科のみ医療情報ネットの歯科診療所数。</small></p>

      <h2>歯科：市別の結果</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>市</th><th>市内の歯科診療所</th><th>AIが挙げた数</th><th>うち自社サイトが根拠</th><th>その医院の記載順</th><th>主な根拠</th></tr></thead>
          <tbody>
            {AI_DENTAL_CITIES.map(r => (
              <tr key={r.label}>
                <td><Link href={r.refHref!}>{r.label}</Link></td><td>{fmt(r.refValue!)}</td><td>{r.named}</td><td><strong>{r.own}</strong></td><td>{ranks(r)}</td>
                <td>{r.source}{r.note && <><br /><small>※{r.note}</small></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>わかったこと</h2>
      <ol>
        <li><strong>自社サイトが読まれた事業者は、上位に並びやすい。</strong>自社サイトが根拠の事業者と、外部情報が根拠の事業者が両方挙がった<strong>{MIXED_CASES}ケースのうち{OWN_ON_TOP}ケース</strong>で、自社サイト側が上位をすべて占めていました。例外は盛岡市の税理士事務所で、税理士会の検索サイトから挙がった事務所が先に並びました。</li>
        <li><strong>業種によって、AIが見に行く先がまったく違う。</strong>工務店・不動産・葬儀社は各社の自社サイトが主な根拠でした。美容室はホットペッパービューティー、税理士は税理士会の検索サイト、歯科（盛岡市）は日本歯科医師会の登録情報と、業界の名簿やポータルに頼る業種もあります。</li>
        <li><strong>「自社サイトが1件も読まれていない」業種・地域がある。</strong>盛岡市の歯科・外壁塗装・美容室、奥州市の歯科では、推薦された事業者の根拠に自社サイトが1件もありませんでした。AIは融資機関の資料や業界団体のPDF、比較サイトなどから、手に入る情報で選んでいます。</li>
      </ol>

      <section className="cta" aria-label="お問い合わせ">
        <h2>自社がAIにどう紹介されているか、無料で調べます</h2>
        <p>御社の業種と地域で、ChatGPTに実際に質問し、<strong>御社が挙がるか・何番目か・AIが何を根拠にしているか</strong>をお伝えします。この調査を行った盛岡のビークプロモーションが担当します。</p>
        <div className="tools">
          <a className="btn primary" href={`${SITE.publisherUrl}contact/?ref=iwate-data-ai`} rel="noopener">AI推薦の無料診断を申し込む</a>
          <a className="btn" href={SITE.publisherUrl} rel="noopener">ビークプロモーションについて</a>
        </div>
      </section>

      <CiteBox title={TITLE} path="/ai/" sentence={sentence} />

      <section className="sources" id="sources">
        <h2>調査方法・注記</h2>
        <ul>
          <li><small>実施：{SITE.publisher}（{AI_SURVEY.asOf}）。使用モデル：{AI_SURVEY.model}。質問は原則「岩手県◯◯市でおすすめの◯◯を教えてください。名前を挙げて理由も説明してください。」</small></li>
          <li><small>{AI_SURVEY.method}。1つの質問につき1回の測定で、合計{TOTAL_MEASUREMENTS}回。AIの回答は質問の言い回し・時期・モデルによって変わるため、再現を保証するものではありません。</small></li>
          <li><small>「記載順」は回答の中で挙げられた順番で、AIが明示した順位ではありません。</small></li>
          <li><small>「自社サイトが根拠」は、回答の中でその事業者自身のWebサイトが引用されていたもの。自社サイトとポータルの両方が引用された場合も含みます。</small></li>
          <li><small>特定の事業者の評価や宣伝を目的としないため、事業者名は掲載していません。</small></li>
        </ul>
      </section>
    </>
  );
}
