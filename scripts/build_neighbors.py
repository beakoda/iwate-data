#!/usr/bin/env python3
"""raw/iwate_map.geojson → data/neighbors.json（隣接する市町村の対応表）
   境界の頂点を共有している市町村どうしを「隣接」とみなす（1%簡素化版でも境界の線は共有されている）。
   並びは共有頂点の多い順（＝境界が長い順）、同数ならコード順。県外（宮城・秋田・青森）は対象外。
   月次 cron（scripts/update.sh）は触らない。地図データを差し替えたときだけ `npm run data` で作り直す。"""
import json, os
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'raw', 'iwate_map.geojson')
DS = os.path.join(HERE, '..', 'data', 'dataset.json')
OUT = os.path.join(HERE, '..', 'data', 'neighbors.json')

g = json.load(open(SRC, encoding='utf-8'))
codes = {m['code'] for m in json.load(open(DS, encoding='utf-8'))['municipalities']}

owners = defaultdict(set)
for f in g['features']:
    code = f['properties']['N03_007']
    geom = f['geometry']
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        for ring in poly:
            for p in ring:
                owners[(round(p[0], 6), round(p[1], 6))].add(code)

adj = defaultdict(Counter)
for cs in owners.values():
    for a in cs:
        for b in cs:
            if a != b:
                adj[a][b] += 1

out = {}
for c in sorted(codes):
    out[c] = [b for b, _ in sorted(adj[c].items(), key=lambda kv: (-kv[1], kv[0])) if b in codes]
    assert out[c], f'{c} に隣接市町村が見つからない（geojson の境界が共有されていない）'
# 隣接は対称であるはず
for a, bs in out.items():
    for b in bs:
        assert a in out[b], f'隣接が非対称: {a} → {b}'

with open(OUT, 'w', encoding='utf-8') as fp:
    json.dump(out, fp, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
print(f'neighbors: {len(out)} municipalities, {sum(len(v) for v in out.values()) // 2} pairs → {os.path.relpath(OUT)}')
