#!/usr/bin/env bash
# 月次データ更新（n8n の Execute Command から呼ぶ。手動でも可）
#
#   ESTAT_APP_ID=xxxx bash scripts/update.sh          # 取得→検算→ビルド→commit/push→MCP deploy
#   ESTAT_APP_ID=xxxx bash scripts/update.sh --check  # 取得して差分を報告するだけ（何も書かない）
#
# 必要な環境変数
#   ESTAT_APP_ID          e-Stat API の appId（必須。ファイルに書かない）
#   CLOUDFLARE_API_TOKEN  Workers 編集権限のトークン（任意。無ければ MCP deploy を飛ばす）
# 前提: このリポジトリの clone、git push できる認証（deploy key か PAT）、node 20+、python3 が VPS にあること。
# サイト本体は GitHub push → Cloudflare Pages が自動ビルドするので、ここでは push まで。
#
# 終了コード: 0=変更なし or 更新完了 / 1=失敗（検算 assert・ビルド・push のどれか）
# 最終行に必ず「RESULT: ...」を出す。n8n はこの行で分岐する。
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/.bin:$PATH"
STAMP=$(date +%Y-%m-%d)

if [ -z "${ESTAT_APP_ID:-}" ]; then echo "RESULT: FAIL ESTAT_APP_ID unset"; exit 1; fi

echo "== git pull"
git pull --ff-only -q

echo "== fetch e-Stat"
set +e
python3 scripts/fetch_estat.py ${1:-} | tee /tmp/iwate-fetch.log
rc=${PIPESTATUS[0]}
set -e
if [ "$rc" = 0 ]; then echo "RESULT: NOCHANGE $STAMP"; exit 0; fi
if [ "$rc" != 3 ]; then echo "RESULT: FAIL fetch rc=$rc"; exit 1; fi
if [ "${1:-}" = "--check" ]; then echo "RESULT: CHANGED (check only) $STAMP $(grep '^changed:' /tmp/iwate-fetch.log)"; exit 0; fi

echo "== build_data (検算 assert。ここで止まったら raw を直すか SSDS の定義を見直す。assert を緩めない)"
python3 scripts/build_data.py
python3 scripts/build_map.py

echo "== next build（ページが全部生成できるか）"
[ -d node_modules ] || npm ci --no-audit --no-fund
npx next build >/tmp/iwate-next.log 2>&1 || { tail -30 /tmp/iwate-next.log; echo "RESULT: FAIL next build"; exit 1; }
PAGES=$(grep -c '<loc>' out/sitemap.xml || true)
echo "sitemap pages: $PAGES"
[ "$PAGES" -ge 1086 ] || { echo "RESULT: FAIL sitemap has $PAGES pages (<1086)"; exit 1; }

echo "== commit / push"
git add raw/ssds data/dataset.json
if git diff --cached --quiet; then echo "RESULT: NOCHANGE $STAMP (nothing to commit)"; exit 0; fi
git -c user.name="iwate-data bot" -c user.email="bot@iwate-data.jp" commit -q -m "data: e-Stat update $STAMP ($(grep '^changed:' /tmp/iwate-fetch.log | cut -d' ' -f2-))"
git push -q

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "== MCP deploy"
  (cd mcp && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && npx wrangler deploy >/tmp/iwate-mcp.log 2>&1) || { tail -20 /tmp/iwate-mcp.log; echo "RESULT: FAIL mcp deploy (site pushed)"; exit 1; }
else
  echo "== MCP deploy skipped (CLOUDFLARE_API_TOKEN unset)"
fi

echo "RESULT: UPDATED $STAMP $(grep '^changed:' /tmp/iwate-fetch.log) pages=$PAGES"
