# iwate-data（いわてデータ）

岩手県33市町村の公的統計を「市町村×業種」の粒度で公開するデータハブ。Beak所有のストック資産（被リンク供給源）。

**開発を始める前に [HANDOFF.md](./HANDOFF.md) を読むこと。** 現在の状態・守るべきルール・次にやることはすべてそこにある（Claude Code / Codex / Gemini CLI 共通の引き継ぎ元）。

## 構成
- `raw/` — e-Stat から取得した原データCSV（数値はすべてここ由来。捏造・補完なし）
  - `dental_2009_2016.csv`, `dental_2017_2024.csv` — 医療施設調査 二次医療圏・市区町村編 第2表（歯科・一般診療所）
  - `population_2013_2026.csv` — 住民基本台帳人口・世帯・出生・死亡・転入・転出（各年1/1）
  - `econ_census_2021_major.csv` — 令和3年経済センサス 第4-1表（産業大分類×市町村：事業所・従業者・売上）
  - `econ_census_2016_major.csv` — 平成28年経済センサス 第8表（産業大分類×市町村：事業所・従業者）
- `scripts/build_data.py` — raw → `data/dataset.json`（合併前自治体の合算、整合性assert）
- `app/` — Next.js 15 App Router、`output: 'export'` の完全静的サイト（クライアントJSほぼ無し、SVGチャートはビルド時描画）
- ページ: `/`, `/dental/`, `/dental/[市町村]/`×33, `/population/`, `/population/[市町村]/`×33, `/industry/`, `/industry/[業種]/`×17, `/city/`, `/city/[市町村]/`×33 = 121ページ

## ビルド
```
npm install
npm run data       # raw/ → data/dataset.json（データ更新時のみ。生成物はコミットする）
npm run build      # next build → out/（Cloudflare Pagesが叩くのはこれ）
npx serve out
```
本番URLは `NEXT_PUBLIC_SITE_URL`（既定 https://iwate-data.jp）。canonical / JSON-LD / sitemap に使う。

## 各ページの型（記者キーワード設計）
1. H1 = 「◯◯市の△△の推移（年〜年）」
2. key-fact 1文（数字＋順位＋県平均）→ そのまま引用できる
3. スタットタイル → SVG折れ線 → 年次表 → 県内比較バー
4. 「この統計を引用する」ブロック（出典表記例・リンクHTML）
5. 出典・注記（e-Stat の表名・URL・時点・注意）
6. JSON-LD: Dataset + BreadcrumbList

## 次にやること
- e-Stat API（appId）で `raw/` を自動更新（`scripts/fetch_estat.py` を追加予定）。中分類・小分類、介護施設、学校、住宅着工、商業、農業センサスを同じ型で追加
- PC-2 のローカルLLMで「地元の一言」（各ページ2〜3文の解説）をバッチ生成 → `data/notes/*.md` として差し込み
- GSC 登録 → 90日計測 → 顧客サイトへの参照リンク設計
- 埋め込みウィジェット（iframe + Powered by）
