# n8n 月次更新

VPS 上の n8n から `scripts/update.sh` を月1回叩く。`iwate-data-update.workflow.json` をインポートして使う。

## VPS 側の準備（初回だけ）

```bash
# 1. clone（push できる認証で。deploy key か PAT）
git clone git@github.com:beakoda/iwate-data.git /opt/iwate-data
cd /opt/iwate-data && npm ci && (cd mcp && npm ci)

# 2. まず「今の raw を完全再現できるか」を確認する。ここが cron を有効にする条件
ESTAT_APP_ID=xxxx python3 scripts/fetch_estat.py --check
#   → 10系列すべて "unchanged" なら fetch_estat.py は原データを正しく再現している
#   → "CHANGED" が出たら、e-Stat 側に新しい年が出たか、取得ロジックの差。差分行を見て判断（新年分なら update.sh を回す）

# 3. 通しで1回（変更が無ければ何もしない）
ESTAT_APP_ID=xxxx CLOUDFLARE_API_TOKEN=yyyy bash scripts/update.sh
```

## n8n 側

- n8n を動かしているプロセス（docker-compose なら `environment:`）に `ESTAT_APP_ID` と `CLOUDFLARE_API_TOKEN` を入れる。ワークフロー JSON やリポジトリには書かない。
- n8n が docker の場合、`/opt/iwate-data` をコンテナにマウントし、コンテナ内に git / node / python3 が要る（公式イメージには python3 が無いので、`n8nio/n8n` を base にした Dockerfile で `apk add python3 git` するか、Execute Command を `ssh host bash /opt/iwate-data/scripts/update.sh` にする）。
- 「Gmail 通知」ノードの credential と `sendTo` を自分のものにする。Slack にしたければそのノードだけ差し替え。
- スケジュールは毎月3日 04:00 JST（timezone を Asia/Tokyo に）。

## 何が起きるか

1. `git pull`
2. `fetch_estat.py` が e-Stat API から10系列を取り直し、`raw/ssds/*.csv` と比べる。差が無ければ `RESULT: NOCHANGE` で終了（通知なし）
3. 差があれば `build_data.py`（市町村33計＝県値の検算 assert）→ `build_map.py` → `next build`（sitemap 1086 ページ以上）
4. 通れば `raw/ssds` と `data/dataset.json` を commit / push → Cloudflare Pages が自動ビルドして本番反映
5. `CLOUDFLARE_API_TOKEN` があれば `mcp/` を `wrangler deploy`
6. 最終行 `RESULT: UPDATED …` / `RESULT: FAIL …` をメールで通知

検算で止まった（`RESULT: FAIL`）ときは、assert を緩めるのではなく raw の差分と SSDS の定義（`build_data.py` の `SSDS`）を見直す。県値が無い列・年、市町村値が無い列・年は自動でスキップされるので、止まるのは本当に合計が合わないとき。
