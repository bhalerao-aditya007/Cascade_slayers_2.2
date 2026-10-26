#!/usr/bin/env python3
"""Add Hong Kong's islands (separate OSM relations) to the epidemic boundary."""
import json
import math
import os
import time
import urllib.parse
import urllib.request

from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union, polygonize

UA = {"User-Agent": "72HWarning-demo/1.0 (sandbox boundary fetch)"}
OUT = "/home/z/my-project/src/data/boundaries/epidemic.json"

ISLAND_QUERIES = [
    "香港島 Hong Kong Island",  # prefer explicit
    "大嶼山 Lantau Island",
    "南丫島 Lamma Island",
    "青衣 Tsing Yi",
    "長洲 Cheung Chau",
    "坪洲 Peng Chau",
    "鴨脷洲 Ap Lei Chau",
    "馬灣 Ma Wan",
]


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def photon(query):
    q = urllib.parse.quote(query)
    d = get_json(f"https://photon.komoot.io/api?q={q}&limit=5")
    for f in d.get("features", []):
        p = f["properties"]
        if p.get("osm_type") != "R":
            continue
        g = f.get("geometry") or {}
        c = g.get("coordinates") or [999, 999]
        if 113.7 <= c[0] <= 114.6 and 21.9 <= c[1] <= 23.0:
            return p.get("osm_id"), p.get("name")
    return None, None


def poly_from_relation(rid):
    full = get_json(f"https://api.openstreetmap.org/api/0.6/relation/{rid}/full.json")
    nodes, lines = {}, []
    for el in full["elements"]:
        if el.get("type") == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])
        elif el.get("type") == "way":
            pts = [nodes[n] for n in el.get("nodes", []) if n in nodes]
            if len(pts) >= 2:
                lines.append(LineString(pts))
    merged = unary_union(lines)
    polys = [p for p in polygonize(merged) if p.area > 1e-6]
    if not polys:
        return None
    polys.sort(key=lambda p: p.area, reverse=True)
    return polys[0]


def round_poly(p):
    ring = [(round(x, 4), round(y, 4)) for x, y in p.exterior.coords]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return ring


# load existing mainland polygon
with open(OUT) as f:
    fc = json.load(f)
mainland = fc["features"][0]["geometry"]["coordinates"]
parts = [mainland[0] if fc["features"][0]["geometry"]["type"] == "Polygon" else None]
if parts[0] is None:
    parts = [p[0] for p in mainland]
print(f"existing parts: {len(parts)}")

for query in ISLAND_QUERIES:
    rid, name = photon(query)
    if not rid:
        print(f"  {query}: NOT FOUND")
        continue
    try:
        p = poly_from_relation(rid)
    except Exception as e:
        print(f"  {query} R{rid}: fetch fail {e}")
        continue
    if p is None or p.area * 111.32 * 111.32 * 0.93 < 0.5:  # < ~0.5 km2 skip
        print(f"  {query} R{rid}: too small / no polygon")
        continue
    p = p.simplify(0.0004, preserve_topology=True)
    parts.append(round_poly(p))
    km2 = p.area * 111.32 * 111.32 * 0.93
    print(f"  {query} R{rid}: +{km2:.0f} km2")
    time.sleep(0.8)

fc["features"][0]["geometry"] = {
    "type": "MultiPolygon",
    "coordinates": [[ring] for ring in parts],
}
fc["features"][0]["properties"]["osm"] = "R913110 + island relations"
with open(OUT, "w") as f:
    json.dump(fc, f, separators=(",", ":"))
print(f"wrote {OUT}: parts={len(parts)} kb={os.path.getsize(OUT) / 1024:.1f}")
