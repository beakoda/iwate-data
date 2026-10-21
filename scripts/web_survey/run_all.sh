#!/bin/bash
# 収集→診断→集計を通しで実行する（ConoHa で nohup 実行する前提。ssh が切れても止まらない）
# ログ: /root/websurvey.log（最後に ALLDONE と出たら完了）
cd "$(dirname "$0")/../.." || exit 1
S=scripts/web_survey/websurvey.py
python3 $S collect && python3 $S audit --workers 16 && python3 $S export && python3 $S stats
echo "gmap費用(USD): $(cat ~/iwate-web-survey/gmap_cost.txt 2>/dev/null || echo なし)"
echo ALLDONE
