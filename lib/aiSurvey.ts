/**
 * AI推薦調査（ビークプロモーション実施）。ChatGPT に「◯◯市でおすすめの◯◯」と質問し、
 * 回答に挙がった事業者と、その根拠として引用された情報源の種類を集計したもの。
 * 特定の事業者の評価・宣伝を目的としないため、事業者名は掲載しない（集計値のみ）。
 * 元データ（事業者名つき）は社内保管: work/internal/岩手歯科_AI推薦調査_2026-09.csv ほか。
 */
export const AI_SURVEY = {
  model: 'ChatGPT（GPT-5.4／Web検索有効）',
  asOf: '2026年9月',
  method: '各業種・市町村につき1回質問し、回答に挙がった事業者ごとに「AIが根拠として引用した情報源」を分類',
};

export type AiRow = {
  label: string;      // 業種名 or 市町村名
  named: number;      // AIが挙げた事業者数
  own: number;        // うち自社サイトが根拠として引用された数
  ownRanks: number[]; // その事業者の記載順
  source: string;     // 主な根拠
  date: string;
  note?: string;
  refLabel?: string;  // いわてデータ上の母数の説明
  refValue?: number;
  refHref?: string;
};

/** 盛岡市 × 業種 */
export const AI_MORIOKA: AiRow[] = [
  { label: '工務店', named: 5, own: 4, ownRanks: [1, 2, 3, 4], source: '自社サイト', date: '2026-09-24', refLabel: '建設業の事業所', refValue: 1081, refHref: '/industry/construction/morioka/' },
  { label: '不動産会社', named: 5, own: 4, ownRanks: [1, 2, 3, 4], source: '自社サイト', date: '2026-09-24', refLabel: '不動産業・物品賃貸業の事業所', refValue: 1485, refHref: '/industry/realestate/morioka/' },
  { label: '葬儀社', named: 4, own: 3, ownRanks: [1, 2, 3], source: '自社サイト', date: '2026-09-24', refLabel: '生活関連サービス業・娯楽業の事業所', refValue: 1219, refHref: '/industry/lifestyle/morioka/' },
  { label: '整骨院', named: 4, own: 2, ownRanks: [1, 2], source: '自社サイト／柔道整復師会の名簿', date: '2026-09-24', refLabel: '医療・福祉の事業所', refValue: 1371, refHref: '/industry/medical/morioka/' },
  { label: '税理士事務所', named: 5, own: 2, ownRanks: [3, 4], source: '税理士会の検索サイト', date: '2026-09-24', refLabel: '学術研究・専門技術サービス業の事業所', refValue: 725, refHref: '/industry/professional/morioka/' },
  { label: '歯科', named: 5, own: 0, ownRanks: [], source: '日本歯科医師会の登録情報', date: '2026-09-24', refLabel: '歯科診療所', refValue: 180, refHref: '/iryou/morioka/' },
  { label: '外壁塗装', named: 5, own: 0, ownRanks: [], source: '公的融資機関の資料・業界団体の名簿・比較サイト', date: '2026-09-24', refLabel: '建設業の事業所', refValue: 1081, refHref: '/industry/construction/morioka/' },
  { label: '美容室', named: 7, own: 0, ownRanks: [], source: 'ホットペッパービューティー', date: '2026-09-24', refLabel: '生活関連サービス業・娯楽業の事業所', refValue: 1219, refHref: '/industry/lifestyle/morioka/' },
];

/** 歯科 × 市（件数の多い8市） */
export const AI_DENTAL_CITIES: AiRow[] = [
  { label: '盛岡市', named: 5, own: 0, ownRanks: [], source: '日本歯科医師会の登録情報', date: '2026-09-24', refValue: 180, refHref: '/iryou/morioka/' },
  { label: '奥州市', named: 5, own: 0, ownRanks: [], source: '口コミポータル', date: '2026-09-24', refValue: 51, refHref: '/iryou/oshu/' },
  { label: '一関市', named: 6, own: 1, ownRanks: [1], source: '口コミポータル・市の資料', date: '2026-09-24', refValue: 40, refHref: '/iryou/ichinoseki/' },
  { label: '北上市', named: 4, own: 4, ownRanks: [1, 2, 3, 4], source: '自社サイト', date: '2026-09-16', note: 'インプラント・ホワイトニング対応の条件つきで質問', refValue: 35, refHref: '/iryou/kitakami/' },
  { label: '花巻市', named: 7, own: 7, ownRanks: [1, 2, 3, 4, 5, 6, 7], source: '自社サイト', date: '2026-09-18', note: '矯正・ホワイトニング対応の条件つきで質問', refValue: 34, refHref: '/iryou/hanamaki/' },
  { label: '滝沢市', named: 5, own: 2, ownRanks: [1, 2], source: '自社サイト・厚生局の名簿', date: '2026-09-24', refValue: 19, refHref: '/iryou/takizawa/' },
  { label: '大船渡市', named: 5, own: 1, ownRanks: [1], source: '医療情報ネット・市の資料', date: '2026-09-24', refValue: 14, refHref: '/iryou/ofunato/' },
  { label: '宮古市', named: 5, own: 3, ownRanks: [1, 2, 3], source: '自社サイト・市の一覧', date: '2026-09-24', refValue: 13, refHref: '/iryou/miyako/' },
];

const sum = (rows: AiRow[], k: 'named' | 'own') => rows.reduce((a, r) => a + r[k], 0);
export const MORIOKA_NAMED = sum(AI_MORIOKA, 'named');
export const MORIOKA_OWN = sum(AI_MORIOKA, 'own');

/**
 * 「自社サイトが根拠の事業者」と「それ以外が根拠の事業者」が両方挙がったケースで、
 * 自社サイト側が上位に並んだか（全員が上位を占めたか）を判定する。
 */
function ownOnTop(r: AiRow): boolean | null {
  if (r.own === 0 || r.own === r.named) return null;
  return r.ownRanks.every((x, i) => x === i + 1);
}
const judged = [...AI_MORIOKA, ...AI_DENTAL_CITIES].map(ownOnTop).filter((x): x is boolean => x !== null);
export const MIXED_CASES = judged.length;
export const OWN_ON_TOP = judged.filter(Boolean).length;
export const TOTAL_MEASUREMENTS = AI_MORIOKA.length + AI_DENTAL_CITIES.length - 1; // 盛岡市の歯科は両表に重複
