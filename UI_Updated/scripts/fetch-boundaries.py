#!/usr/bin/env python3
"""Fetch REAL OSM city boundaries for the 72H Warning demo (v2 — OSM API + Photon).

Sources:
  - api.openstreetmap.org/api/0.6/relation/{id}/full.json  (geometry)
  - photon.komoot.io (resolve Tokyo ward relation ids)

Output: src/data/boundaries/{hazard}.json  (FeatureCollection, simplified, real coords)
"""
import json
import math
import os
import time
import urllib.parse
import urllib.request

from shapely.geometry import Polygon, MultiPolygon, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

OUT_DIR = "/home/z/my-project/src/data/boundaries"
UA = {"User-Agent": "72HWarning-demo/1.0 (sandbox boundary fetch; contact: demo@example.com)"}

SINGLE = [
    # hazard, relation id, label, tolerance_deg
    ("flood", 4773565, "Dhaka District · Bangladesh", 0.0016),
    ("heat", 111257, "City of Phoenix · Arizona", 0.0010),
    ("epidemic", 913110, "Hong Kong SAR", 0.0010),
    ("grid", 1942586, "National Capital Territory of Delhi", 0.0012),
    ("chem", 1976080, "Bhopal District · Madhya Pradesh", 0.0013),
]

TOKYO_WARDS = ["千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区",
               "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区",
               "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区",
               "葛飾区", "江戸川区"]

OSM_API = "https://api.openstreetmap.org/api/0.6/relation/{}/full.json"


def get_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print(f"    attempt {attempt + 1} failed: {e}")
            time.sleep(2.5)
    raise RuntimeError(f"failed: {url}")


def rings_from_relation(full):
    """stitch outer member ways into closed rings of [lng,lat]."""
    nodes, ways, members = {}, {}, []
    for el in full["elements"]:
        t = el.get("type")
        if t == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])
        elif t == "way":
            ways[el["id"]] = el.get("nodes", [])
        elif t == "relation":
            for m in el.get("members", []):
                if m.get("type") == "way" and m.get("role") in ("outer", ""):
                    members.append(m["ref"])
    open_paths = []
    for wid in members:
        nds = ways.get(wid)
        if not nds:
            continue
        pts = [nodes[n] for n in nds if n in nodes]
        if len(pts) < 2:
            continue
        if pts[0] == pts[-1]:
            open_paths.append(pts)  # treat as closed
        else:
            open_paths.append(pts)
    # stitch
    rings = []
    used = [False] * len(open_paths)
    for i, p in enumerate(open_paths):
        if used[i]:
            continue
        used[i] = True
        ring = list(p)
        changed = True
        while changed and ring[0] != ring[-1]:
            changed = False
            for j, q in enumerate(open_paths):
                if used[j]:
                    continue
                if q[0] == ring[-1]:
                    ring.extend(q[1:]); used[j] = True; changed = True
                elif q[-1] == ring[-1]:
                    ring.extend(list(reversed(q))[1:]); used[j] = True; changed = True
                elif q[-1] == ring[0]:
                    ring = q + ring[1:]; used[j] = True; changed = True
                elif q[0] == ring[0]:
                    ring = list(reversed(q)) + ring[1:]; used[j] = True; changed = True
        if ring[0] == ring[-1] and len(ring) >= 4:
            rings.append(ring)
    return rings


def to_geom(rings):
    polys = []
    for r in rings:
        try:
            p = Polygon(r)
            if p.is_valid and p.area > 0:
                polys.append(p)
            else:
                p2 = make_valid(p)
                if p2.area > 0:
                    polys.append(p2 if isinstance(p2, Polygon) else p2.geoms[0])
        except Exception:
            pass
    return polys


def km_area(geom):
    lat = geom.centroid.y
    return geom.area * (111.32 ** 2) * max(0.05, math.cos(math.radians(lat)))


def photon_ward_id(name):
    q = urllib.parse.quote(name)
    url = f"https://photon.komoot.io/api?q={q}&limit=8"
    d = get_json(url)
    for f in d.get("features", []):
        p = f["properties"]
        if p.get("osm_type") != "R" or p.get("name") != name:
            continue
        g = f.get("geometry") or {}
        c = g.get("coordinates") or [999, 999]
        if 139.3 <= c[0] <= 140.1 and 35.4 <= c[1] <= 36.0:
            return p.get("osm_id")
    return None


def finalize(hazard, label, osm, geom, tol):
    print(f"  raw pts={sum(len(g.exterior.coords) for g in ([geom] if isinstance(geom, Polygon) else geom.geoms))}, area={km_area(geom):.0f} km2")
    simp = geom.simplify(tol, preserve_topology=True)
    # round coords to 4 decimals
    def round_poly(p):
        ring = [(round(x, 4), round(y, 4)) for x, y in p.exterior.coords]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        return Polygon(ring)
    if isinstance(simp, Polygon):
        parts = [round_poly(simp)]
    else:
        parts = [round_poly(g) for g in simp.geoms if g.area > 0.0005]
    fc = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"key": hazard, "name": label, "osm": osm},
            "geometry": {
                "type": "MultiPolygon" if len(parts) > 1 else "Polygon",
                "coordinates": [[p.exterior.coords] if len(parts) > 1 else [p.exterior.coords][0:1] and [[list(c) for c in p.exterior.coords]] for p in parts][0:1][0] if False else
                ([[ [list(c) for c in p.exterior.coords] ] for p in parts] if len(parts) > 1 else [[list(c) for c in parts[0].exterior.coords]]),
            },
        }],
    }
    path = os.path.join(OUT_DIR, f"{hazard}.json")
    with open(path, "w") as f:
        json.dump(fc, f, separators=(",", ":"))
    b = geom.bounds
    pts = sum(len(p.exterior.coords) for p in parts)
    print(f"  wrote {path}: parts={len(parts)} pts={pts} kb={os.path.getsize(path) / 1024:.1f} bbox=({b[0]:.4f},{b[1]:.4f},{b[2]:.4f},{b[3]:.4f}) area={km_area(geom):.0f}km2")
    return {"bbox": [round(b[0], 4), round(b[1], 4), round(b[2], 4), round(b[3], 4)], "area_km2": round(km_area(geom)), "parts": len(parts), "points": pts}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    summary = {}
    for hazard, rid, label, tol in SINGLE:
        print(f"=== {hazard} (R{rid})")
        full = get_json(OSM_API.format(rid))
        polys = to_geom(rings_from_relation(full))
        if not polys:
            print("  !! no rings")
            continue
        geom = polys[0] if len(polys) == 1 else unary_union(polys)
        summary[hazard] = finalize(hazard, label, f"R{rid}", geom, tol)
        time.sleep(1.0)

    # Tokyo: 23 special wards, dissolved
    print("=== quake (Tokyo 23 wards)")
    ward_ids = []
    for w in TOKYO_WARDS:
        rid = photon_ward_id(w)
        print(f"  {w} -> R{rid}")
        if rid:
            ward_ids.append(rid)
        time.sleep(0.5)
    if len(ward_ids) < 20:
        print(f"  !! only {len(ward_ids)} wards resolved")
    polys = []
    for rid in ward_ids:
        full = get_json(OSM_API.format(rid))
        polys.extend(to_geom(rings_from_relation(full)))
        time.sleep(0.8)
    geom = unary_union(polys)
    summary["quake"] = finalize("quake", "Tokyo · 23 Special Wards", "R" + ",".join(map(str, ward_ids[:1])) + f" (+{len(ward_ids) - 1} wards)", geom, 0.0009)

    print("\n==== SUMMARY ====")
    print(json.dumps(summary, indent=2))
    with open(os.path.join(OUT_DIR, "_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)


if __name__ == "__main__":
    main()
