#!/usr/bin/env python3
"""販売用 Excel データ集を作る。`npm run build` 後に実行する（out/csv/*/all.csv を読むので、
サイトのCSVと中身が必ず一致する）。出力はリポジトリに含めない（有料商品）。
  python3 scripts/build_xlsx.py  →  dist/iwate-data_YYYY-MM-DD.xlsx
"""
import csv, io, json, os, re, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT_DIR = os.path.join(ROOT, 'out', 'csv')
DIST = os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)
today = datetime.date.today().isoformat()
ds = json.load(open(os.path.join(ROOT, 'data', 'dataset.json'), encoding='utf-8'))
SOURCES = ds['sources']

# lib/csv.ts のレジストリからシート名と出典キーを拾う（並び順もそのまま）
ts = io.open(os.path.join(ROOT, 'lib', 'csv.ts'), encoding='utf-8').read()
FAM = re.findall(r"^  (\w+): \{ label: '([^']+)'", ts, re.M)
SRC_KEY = {'dental': 'dental', 'population': 'population', 'aging': 'census', 'work': 'census', 'building': 'building',
           'vital': 'vital', 'household': 'household', 'medical': 'medical', 'welfare': 'welfare', 'garbage': 'env',
           'economy': 'economy', 'school': 'school', 'jobless': 'jobless', 'education': 'education', 'farm': 'farm',
           # 非 e-Stat 系（2026-09 追加）
           'crime': 'crime', 'jiko': 'traffic', 'kaigo': 'kaigo', 'iryou': 'iryou', 'shofuku': 'shofuku',
           'school_code': 'schoolcode', 'houjin': 'houjin', 'hoiku': 'hoiku'}

# lib/csv.ts にファミリーを足したらここにも出典キーを足すこと。
# 足し忘れるとExcelデータ集（有料商品）のビルドが落ちる。何が足りないかを先に出す。
_missing = [k for k, _label in FAM if k not in SRC_KEY]
if _missing:
    raise SystemExit(f'SRC_KEY に出典キーが無いファミリー: {_missing}\n'
                     f'  scripts/build_xlsx.py の SRC_KEY に追記すること'
                     f'（dataset.json の sources のキーを指定する）')
# 原データの利用条件（2026-09-10 に各機関の規約を実読して確認）。
# components/Shell.tsx の PROCESSING と対になる。出典を足したらここも足すこと。
TERMS_ESTAT = ('政府統計の総合窓口（e-Stat）。政府標準利用規約に準拠し商用利用可。出典明記が必要。'
               '加工した場合はその旨の記載が必要で、国が作成したかのような公表は不可')
TERMS = {
    'crime': '公共データ利用規約（第1.0版・PDL1.0）。商用可。出典明記＋加工の明示が必要',
    'kaigo': '厚生労働省ウェブサイト利用規約＝公共データ利用規約（第1.0版・PDL1.0）。オープンデータとして営利目的の二次利用可と明示。出典明記＋加工の明示が必要',
    'iryou': '医療情報ネット利用規約。権利は厚生労働省および各都道府県に帰属し、転載時は出所の明記が必要。商用利用の禁止規定は無い',
    'schoolcode': '文部科学省ウェブサイト利用規約（政府標準利用規約2.0準拠）。商用可。出典明記＋加工の明示が必要。数値データ・簡単な表は著作権の対象外',
    'traffic': '警察庁ウェブサイト利用規約＝公共データ利用規約（第1.0版・PDL1.0）。商用可。出典明記＋加工の明示が必要',
    'houjin': '国税庁法人番号公表サイト利用規約＝公共データ利用規約（第1.0版・PDL1.0）。商用可。出典明記＋加工の明示が必要',
    'hoiku': 'こども家庭庁コピーライトポリシー＝公共データ利用規約（第1.0版・PDL1.0）。商用可。出典明記＋加工の明示が必要',
    'shofuku': 'WAM NET のオープンデータ（官民データ活用推進基本法に基づく公開。営利・非営利を問わず二次利用可と明示）。出所の明記が必要',
}

_bad = [(k, v) for k, v in SRC_KEY.items() if v not in SOURCES]
if _bad:
    raise SystemExit(f'sources に存在しない出典キーを指している: {_bad}')

FONT = 'Meiryo'
head_font = Font(name=FONT, bold=True, color='FFFFFF', size=10)
head_fill = PatternFill('solid', fgColor='0017C1')
body_font = Font(name=FONT, size=10)
thin = Side(style='thin', color='D8D8DB')

wb = Workbook()
ws = wb.active; ws.title = 'はじめに'
intro = [
    ['岩手県33市町村 統計データ集', ''],
    ['版', today],
    ['作成', 'いわてデータ（ビークプロモーション株式会社、盛岡市）'],
    ['URL', 'https://iwate-data.com/data/'],
    ['', ''],
    ['内容', '政府統計（e-Stat）と各府省・自治体のオープンデータの公表値を、岩手県33市町村×年で整理したもの。1分野＝1シート、縦持ち（ロング形式）。'],
    ['検算', '各分野で、33市町村の合計が作成機関の公表する岩手県の値（公表が無い分野は原データの総件数）と一致することを機械的に確認しています（率・原単位を除く）。'],
    ['空欄', '秘匿（X）・非公表（...）・該当なし（-）・未調査の年は空欄。推計・按分・補完はしていません。'],
    ['合併', '旧滝沢村（03305）→滝沢市、旧藤沢町（03422）→一関市、旧川井村（03487）→宮古市 に合算しています。'],
    ['利用条件', 'CC BY 4.0。出典として「いわてデータ」を明記すれば商用を含め自由に利用できます。原データの著作権は各統計の作成機関に帰属します。'],
    ['加工の明示', '本データ集は各機関の公開データを「いわてデータ」が市町村×年に集計・整理したものであり、各機関が作成・公表した表ではありません。再配布・引用の際もこの点を明記してください（公共データ利用規約 第1.0版 等の条件によります）。「出典・注記」シートに分野ごとの利用条件を記載しています。'],
    ['注意', '「従業者数」（経済センサス：その市町村の事業所で働く人）と「就業者数」（国勢調査：その市町村に住む働く人）は別の概念です。'],
    ['', ''],
    ['シート一覧', ''],
]
for k, label in FAM:
    intro.append([label, f"出典: {SOURCES[SRC_KEY[k]]['name']}"])
for r in intro: ws.append(r)
ws['A1'].font = Font(name=FONT, bold=True, size=14)
for row in ws.iter_rows(min_row=2):
    for c in row: c.font = body_font; c.alignment = Alignment(wrap_text=True, vertical='top')
    row[0].font = Font(name=FONT, bold=True, size=10)
ws.column_dimensions['A'].width = 22; ws.column_dimensions['B'].width = 110

total_rows = 0
for k, label in FAM:
    path = os.path.join(OUT_DIR, k, 'all.csv')
    rows = list(csv.reader(io.open(path, encoding='utf-8-sig', newline='')))
    sh = wb.create_sheet(label[:31])
    for i, r in enumerate(rows):
        if i == 0:
            sh.append(r)
        else:
            out = []
            for j, v in enumerate(r):
                if j < 2: out.append(v)              # コード・市町村名は文字列のまま（先頭0を守る）
                elif v == '': out.append(None)
                else:
                    try: out.append(int(v)) if re.fullmatch(r'-?\d+', v) else out.append(float(v))
                    except ValueError: out.append(v)
            sh.append(out)
    total_rows += len(rows) - 1
    for c in sh[1]:
        c.font = head_font; c.fill = head_fill; c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    sh.row_dimensions[1].height = 32
    for row in sh.iter_rows(min_row=2):
        for c in row:
            c.font = body_font; c.border = Border(bottom=thin)
            if isinstance(c.value, (int, float)) and c.column > 3: c.number_format = '#,##0.##' if isinstance(c.value, float) else '#,##0'
    sh.freeze_panes = 'D2'
    sh.auto_filter.ref = sh.dimensions
    widths = [10, 12, 8] + [max(12, min(28, len(h) * 1.6)) for h in rows[0][3:]]
    for j, w in enumerate(widths, 1): sh.column_dimensions[get_column_letter(j)].width = w

# 出典・注記シート
so = wb.create_sheet('出典・注記')
so.append(['分野', '統計名・表名', 'URL', '注記', '原データの利用条件'])
for k, label in FAM:
    s = SOURCES[SRC_KEY[k]]
    so.append([label, s['name'], s['url'], s.get('note', ''), TERMS.get(SRC_KEY[k], TERMS_ESTAT)])
for c in so[1]: c.font = head_font; c.fill = head_fill
for row in so.iter_rows(min_row=2):
    for c in row: c.font = body_font; c.alignment = Alignment(wrap_text=True, vertical='top')
for col, w in zip('ABCDE', (18, 50, 40, 70, 60)): so.column_dimensions[col].width = w

out = os.path.join(DIST, f'iwate-data_{today}.xlsx')
wb.save(out)
print('ok', out, os.path.getsize(out), 'bytes', total_rows, 'rows', len(FAM), 'sheets')
