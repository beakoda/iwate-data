# HANDOFF

> Claude Code / Codex / Gemini CLI を切り替えて開発する。作業開始時にこのファイルと `git status` / `git diff` を読み、末尾の「次にやること」から続行する。作業内容が変わったらこのファイルを更新してからコミットする。

最終更新: 2026-09-04 / 更新者: Claude Code

---

## 1. このプロジェクトは何か

**iwate-data（いわてデータ）** — 岩手県33市町村の公的統計を「市町村 × 業種」の粒度で公開する完全静的サイト。
ビークプロモーション株式会社（盛岡）が**自社所有するストック資産**で、目的は2つ。

1. 統計・記者キーワードで検索流入を取り、被リンクを自然に集める
2. 集めた権威を顧客サイト（歯科・工務店など）へ参照リンクで配給する

したがって **数字の正確さが商品価値そのもの**。推定・補完・丸めによる捏造は絶対に禁止（§4）。

## 2. 現在の状態

- リモート: `https://github.com/beakoda/iwate-data.git`（Public、**全33ファイル反映済み**）。`main` が正。作業前に必ず `git pull`
- ローカルにクローンが無ければ `git clone https://github.com/beakoda/iwate-data.git`
- ビルド: 121ページ生成成功。全33市町村の主要数値を raw CSV と突き合わせ検算済み
- デプロイ: **稼働中** → https://iwate-data.pages.dev （Cloudflare Pages プロジェクト `iwate-data`、`main` への push で自動デプロイ。理由は下記）
- 環境変数 `NEXT_PUBLIC_SITE_URL` は現在 `https://iwate-data.pages.dev`（**暫定**）。独自ドメイン取得後に差し替えること
- ドメイン: `iwate-data.jp` が空きで第一候補（未取得。お名前.com等で取得し、NSをCloudflareへ）

### デプロイ先を Cloudflare Pages にした理由（2026-09-04 決定）

Vercel Hobby は規約上使えない。商用の定義が「そのDeploymentが、制作に関わった**誰か**の金銭的利益のために使われること（コードを書いた従業員・受託者を含む）」で、顧客サイトへ権威を配給する自社営業資産である本件は明確に該当する。違反はアカウント停止になり得るので、育ててから止まるのが最悪。
一方 Vercel Pro（$20/月）も不要。本サイトは `output: 'export'` の純静的で、サーバー関数・ISR・画像最適化を一切使っておらず、Vercel固有の価値をゼロも使わない。
Cloudflare Pages は無料枠に商用制限がなく、静的アセットのリクエストは無料・無制限、GitHub連携でpush→自動デプロイと運用感も同じ。

Cloudflare Pages の設定値:

| 項目 | 値 |
|---|---|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| 環境変数 | `NEXT_PUBLIC_SITE_URL`（現在は暫定で `https://iwate-data.pages.dev`） |

リポジトリ側は対応済み:

- `.nvmrc`（`22`）— ビルドイメージのNodeを固定。v3ビルドイメージの既定は22.16.0だが、古いイメージに当たっても壊れないようにピン留めしてある。`NODE_VERSION` の環境変数設定は不要
- `public/_headers` — Cloudflare Pages のヘッダー設定。`public/` の中身は `out/` にそのままコピーされる。`/_next/static/*` は immutable で1年キャッシュ、HTMLは毎回再検証。**`X-Frame-Options` は意図的に設定していない**（§6-C の埋め込みウィジェット構想を潰すため）
- 静的出力は `out/dental/morioka/index.html` の形（`trailingSlash: true`）。Cloudflare Pages がそのまま `/dental/morioka/` で配信する。`404.html` も出力済み

### ページ構成（121ページ）

| パス | 数 | 内容 |
|---|---|---|
| `/` | 1 | ハブ。全カテゴリへの導線 |
| `/dental/` `/dental/[slug]/` | 1+33 | 歯科・一般診療所数の推移（2009–2024） |
| `/population/` `/population/[slug]/` | 1+33 | 人口・世帯・出生死亡転入転出（2013–2026） |
| `/industry/` `/industry/[ind]/` | 1+17 | 産業大分類別の市町村ランキング（2016/2021） |
| `/city/` `/city/[slug]/` | 1+33 | 市町村ごとの全指標まとめ |

さらに `/sitemap.xml`, `/robots.txt`。

## 3. アーキテクチャ

```
raw/*.csv              e-Stat から取得した原データ（人手でも自動でも、ここが唯一の真実）
  ↓ scripts/build_data.py     合併自治体の合算・整合性assert
data/dataset.json      生成物だがコミットする（CI側でPython不要にするため）
  ↓ lib/data.ts               JSONを読んで型付きヘルパを提供
app/**/page.tsx        ビルド時に全ページを静的生成（output: 'export' → out/）
```

- Next.js 15.5.2 App Router / React 19 / TypeScript
- `output: 'export'`, `trailingSlash: true`, `images.unoptimized`
- **クライアントJSはゼロ**。グラフは `components/Chart.tsx` がビルド時にSVGを直接吐く
- デザインはデジタル庁デザインシステム（DADS）のトークン準拠 — Noto Sans JP / 本文16px / line-height 1.7 / Blue-900 `#0017C1` / gray `#767676` `#1A1A1C` / ブレークポイント768px。`app/globals.css` に集約
- Next 15 なので **`params` は Promise**。ページは `async` にして `const { slug } = await params` すること

### 主要ファイル

| ファイル | 役割 |
|---|---|
| `scripts/build_data.py` | raw→JSON。`MUNI`（33市町村の code/name/slug/kind/gun）、`LEGACY`（合併前コード対応）、`IND`（産業大分類18件）、`SOURCES`（出典文言とURL）を定義。末尾で市町村合計＝県計を assert |
| `lib/data.ts` | `SITE` / `MUNIS` / `INDUSTRIES` / `SOURCES` / 年定数、`muniBySlug` `dentalSeries` `popAt` `econAt` `per100k` `fmt` `rank` などのヘルパ |
| `components/Chart.tsx` | `LineChart` / `BarChart`（純SVG、依存なし） |
| `components/Shell.tsx` | `Breadcrumb` `Stat` `SourceBox` `CiteBox` `DatasetJsonLd` |
| `app/layout.tsx` | ヘッダーナビ・フッター・共通メタ |

### データソース（すべて e-Stat）

| キー | 統計 | 期間 |
|---|---|---|
| `dental` | 厚労省 医療施設調査 二次医療圏・市区町村編 第2表 | 2009–2024（各年10/1） |
| `population` | 総務省 住民基本台帳 人口・世帯・動態 | 2013–2026（各年1/1） |
| `econ2021` | 令和3年経済センサス‐活動調査 第4-1表（事業所・従業者・売上） | 2021/6/1 |
| `econ2016` | 平成28年経済センサス‐活動調査 第8表（事業所・従業者） | 2016/6/1 |

合併・市制の扱い: `03305` 滝沢村→`03216` 滝沢市、`03422` 藤沢町→`03209` 一関市、`03487` 川井村→`03202` 宮古市。旧コードの値は現行自治体に合算し、注記に出す。

## 4. 守るべきルール（破ると資産価値が消える）

1. **数値は raw/*.csv 由来のみ**。推定・按分・補完・「だいたいこのくらい」は書かない。出せない年は「—」やnullで空ける
2. 秘匿記号を潰さない。`X`＝秘匿、`...`＝非公表、`-`＝該当なし。それぞれ別物として表示する（`num()` の扱いを変えないこと）
3. `scripts/build_data.py` の assert を無効化しない。市町村合計 ≠ 県計 になったら raw か対応表が壊れている
4. 全ページに出典（統計名・表名・URL・時点）と算出方法の注記を必ず載せる
5. 各ページ冒頭に **そのまま引用できる1文（key-fact）** を置く。数字＋県内順位＋県平均。これが被リンク獲得の本体
6. クライアントJSを足さない。静的HTMLのまま保つ
7. `data/dataset.json` は生成物だがコミットする。raw を変えたら `npm run data` を回して両方コミット

## 5. コマンド

```bash
npm install
npm run data     # raw/ → data/dataset.json（rawを更新したときだけ）
npm run build    # next build → out/（Cloudflare Pagesが叩くのはこれ。Python不要）
npm run dev
npx serve out    # 静的出力の確認
```

## 6. 次にやること

**A. 公開まで（最優先・順番通り）**

1. ~~GitHubへ反映~~ **完了**（全33ファイル、内容ハッシュ一致・クローンからのビルド成功を確認済み）
2. ~~Cloudflare Pages 連携・デプロイ~~ **完了**（121ページ配信・404・sitemap・キャッシュヘッダーまで実地検証済み）
3. `iwate-data.jp` を取得（お名前.com等）→ NSをCloudflareへ向ける → Pages のカスタムドメインに設定 → **環境変数 `NEXT_PUBLIC_SITE_URL` を `https://iwate-data.jp` に変更して再デプロイ**（canonical/JSON-LD/sitemapがこれを見るので、変更を忘れると pages.dev を正規URLとして出し続ける）
4. Google Search Console に登録、sitemap 送信、90日計測を開始

**B. データ拡張（公開後）**

5. e-Stat API の appId を取得（本人登録待ち）→ `scripts/fetch_estat.py` を追加して raw/ を自動更新
6. 産業中分類（約95業種）へ展開。同じ `/industry/[ind]/` の型を使う
7. 介護施設・学校・住宅着工・商業統計・農林業センサスを同じ型で追加

**C. 運用**

8. PC-2 のローカルLLMで各ページに「地元の一言」（2〜3文）をバッチ生成 → `data/notes/*.md` として差し込み
9. 埋め込みウィジェット（iframe + Powered by リンク）を作り、被リンクを取りに行く

## 7. 未解決・注意

- クラウド上のClaudeセッションからは `git push` できない（gitプロキシがセッション許可リポ外にcredentialを出さず403）。初回投入はGitHubのWebアップロードで行ったため、コミット履歴は `Add files via upload` が並んでいる（内容は検証済みで正）。**以降の push はローカルのCLIから行う**
- `public/_headers` はマッチするルールが**すべて**適用され、同名ヘッダーは連結される。`/*` に `Cache-Control` を書くと `/_next/static/*` の immutable 指定と二重になって壊れる（一度やらかして修正済み）。Cache-Control は個別ルールにだけ置くこと
- 経済センサス2021に産業大分類 A/B が別掲されず、`AB`（農林漁業）1本に統合してある。中分類展開時に再検討
- 住基人口は2013年からしかないため、人口10万対の指標は2012年以降しか出せない
