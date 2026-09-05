#!/usr/bin/env python3
"""raw/iwate_map.geojson（国土数値情報 行政区域を1%簡素化したもの）→ data/map.json
   等角図法（緯度方向をcos補正）で 600x640 のviewBoxに投影し、Douglas-Peuckerで間引く。
   出典表記: 「国土数値情報（行政区域データ）（国土交通省）」を加工"""
import json, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'raw', 'iwate_map.geojson')
OUT = os.path.join(HERE, '..', 'data', 'map.json')
W, H, PAD = 600, 640, 8
TOL = 0.6  # px

def dp(pts, tol):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    imax, dmax = 0, -1
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / L
        if d > dmax: imax, dmax = i, d
    if dmax > tol:
        return dp(pts[:imax + 1], tol)[:-1] + dp(pts[imax:], tol)
    return [pts[0], pts[-1]]

g = json.load(open(SRC, encoding='utf-8'))
rings_by_code = {}
for f in g['features']:
    code = f['properties']['N03_007']
    geom = f['geometry']
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    rings_by_code.setdefault(code, []).extend(polys)

lons = [p[0] for polys in rings_by_code.values() for poly in polys for ring in poly for p in ring]
lats = [p[1] for polys in rings_by_code.values() for poly in polys for ring in poly for p in ring]
lon0, lon1, lat0, lat1 = min(lons), max(lons), min(lats), max(lats)
k = math.cos(math.radians((lat0 + lat1) / 2))
sx = (W - 2 * PAD) / ((lon1 - lon0) * k)
sy = (H - 2 * PAD) / (lat1 - lat0)
s = min(sx, sy)
ox = (W - (lon1 - lon0) * k * s) / 2
oy = (H - (lat1 - lat0) * s) / 2

def proj(lon, lat):
    return ((lon - lon0) * k * s + ox, (lat1 - lat) * s + oy)

paths, centroids = {}, {}
total_pts = 0
for code, polys in rings_by_code.items():
    d = []
    best = None
    for poly in polys:
        for ri, ring in enumerate(poly):
            raw = [proj(*p[:2]) for p in ring]
            if ri == 0:
                # 最大の外周の重心（面積加重、間引き前の座標）をラベル位置に
                a = cx = cy = 0.0
                for i in range(len(raw) - 1):
                    (x0, y0), (x1_, y1_) = raw[i], raw[i + 1]
                    cr = x0 * y1_ - x1_ * y0
                    a += cr; cx += (x0 + x1_) * cr; cy += (y0 + y1_) * cr
                if abs(a) > 1e-6:
                    area = abs(a) / 2
                    if best is None or area > best[0]:
                        best = (area, cx / (3 * a), cy / (3 * a))
            # 閉じたリングは始点と終点が同じでDPが潰れるので、始点から最遠の点で2分割してから間引く
            far = max(range(len(raw)), key=lambda i: (raw[i][0]-raw[0][0])**2 + (raw[i][1]-raw[0][1])**2)
            pts = dp(raw[:far + 1], TOL)[:-1] + dp(raw[far:], TOL)
            if len(pts) < 4: continue
            total_pts += len(pts)
            d.append('M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
    paths[code] = ''.join(d)
    centroids[code] = [round(best[1], 1), round(best[2], 1)]

# ラベル位置の手動補正（重心が県境に寄る細長い自治体）
ADJ = {}
for c, (dx, dy) in ADJ.items():
    centroids[c][0] += dx; centroids[c][1] += dy

json.dump({'viewBox': f'0 0 {W} {H}', 'paths': paths, 'centroids': centroids,
           'credit': '「国土数値情報（行政区域データ）（国土交通省）」を加工'},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', OUT, os.path.getsize(OUT), 'bytes', total_pts, 'points', len(paths), 'munis')
