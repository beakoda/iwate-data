# いわてデータ MCP サーバー

岩手県33市町村の公的統計（サイトと同じ `data/dataset.json`）を、AIエージェントから直接引ける MCP サーバー。Cloudflare Worker 1本、DB無し、認証無し。

## エンドポイント

- `POST /mcp` — MCP Streamable HTTP（ステートレス。セッション・SSEなし。JSON-RPC をそのまま返す）
- `GET /` — 説明ページ

## ツール

| ツール | 用途 |
|---|---|
| `list_municipalities` | 33市町村（コード・名前・slug） |
| `list_datasets` | 15分野・112指標（派生指標含む）・収録年・出典 |
| `search_indicators` | 「大卒」「歯医者」などから指標IDを探す |
| `get_municipality_stats` | 1市町村の値（県内順位・県値つき。dataset省略で全分野、all_yearsで時系列） |
| `rank_municipalities` | 指標で33市町村をランキング |
| `compare_municipalities` | 複数市町村を横並び |

リソース: `iwate-data://csv/{dataset}`（サイトの `/csv/{dataset}/all.csv` と同内容）。

派生指標（高齢化率・完全失業率・大卒率・1人当たり所得など）は `src/catalog.ts` の `DERIVED`。列定義 `DATASETS` は `lib/csv.ts` の `FAMILIES` と揃えること。

## 開発・デプロイ

```bash
cd mcp
npm install
npm run dev            # http://localhost:8787/mcp
npm test               # 公式SDKのクライアントで全ツールを叩く
npx wrangler login     # 手動デプロイする時だけ（通常は不要）
npm run deploy         # → https://iwate-data-mcp.oda-2ba.workers.dev
```

**通常は手動デプロイ不要。** Cloudflare の Workers Builds が GitHub リポジトリ（beakoda/iwate-data）に連携済みで、`main` への push ごとに自動でビルド・デプロイされる。
ビルド設定（Workers & Pages → iwate-data-mcp → Settings → Build）: root directory `/`、build command `cd mcp && npm install --no-audit --no-fund`、deploy command `cd mcp && npx wrangler deploy`。
カスタムドメイン `mcp.iwate-data.com` 設定済み。

`data/dataset.json` はバンドルしているが、更新して push すれば自動で再デプロイされるので手作業は不要。

## クライアント側の登録

- Claude.ai: 設定 → コネクタ → カスタムコネクタを追加 → `https://mcp.iwate-data.com/mcp`
- Claude Code: `claude mcp add --transport http iwate-data https://mcp.iwate-data.com/mcp`
- Cursor / その他: Streamable HTTP の URL として同じものを登録
