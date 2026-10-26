#!/usr/bin/env python3
"""Fix Tokyo ward dissolve (shapely polygonize) + finer HK coastline."""
import json
import math
import os
import time
import urllib.request

from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union, polygonize

import importlib.util
spec = importlib.util.spec_from_file_location("fb", "/home/z/my-project/scripts/fetch-boundaries.py")
# Reuse helpers by importing functions selectively (guard main with __name__)
fb = importlib.util.module_from_spec(spec)
import sys
sys.modules["fb"] = fb
spec.loader.exec_module(fb)  # main() won't run (guarded)

OUT = "/home/z/my-project/src/data/boundaries"
UA = {"User-Agent": "72HWarning-demo/1.0 (sandbox boundary fetch)"}


def rings_via_polygonize(full):
    nodes, way_nds = {}, []
    for el in full["elements"]:
        if el.get("type") == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])
        elif el.get("type") == "way":
            way_nds.append(el.get("nodes", []))
        elif el.get("type") == "relation":
            refs = {m["ref"] for m in el.get("members", []) if m.get("type") == "way" and m.get("role") in ("outer", "")}
    lines = []
    for nds in way_nds:
        # only ways that belong to the relation outer ring(s) — approximate: all ways in full.json response
        pts = [nodes[n] for n in nds if n in nodes]
        if len(pts) >= 2:
            lines.append(LineString(pts))
    merged = unary_union(lines)
    polys = [p for p in polygonize(merged) if p.area > 0]
    if not polys:
        return []
    # take the largest polygon (ward itself), or all significant ones
    polys.sort(key=lambda p: p.area, reverse=True)
    return [polys[0]]


def km_area(geom):
    lat = geom.centroid.y
    return geom.area * (111.32 ** 2) * max(0.05, math.cos(math.radians(lat)))


def round_geom(geom, tol, min_part_deg2=0.0005):
    simp = geom.simplify(tol, preserve_topology=True)
    def round_poly(p):
        ring = [(round(x, 4), round(y, 4)) for x, y in p.exterior.coords]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        return Polygon(ring)
    if isinstance(simp, Polygon):
        parts = [round_poly(simp)]
    else:
        parts = [round_poly(g) for g in simp.geoms if g.area > min_part_deg2]
    return parts


def write(hazard, label, osm, parts):
    if len(parts) == 1:
        geom_out = {"type": "Polygon", "coordinates": [[list(c) for c in parts[0].exterior.coords]]}
    else:
        geom_out = {"type": "MultiPolygon", "coordinates": [[[list(c) for c in p.exterior.coords]] for p in parts]}
    fc = {"type": "FeatureCollection", "features": [{
        "type": "Feature",
        "properties": {"key": hazard, "name": label, "osm": osm},
        "geometry": geom_out}]}
    path = os.path.join(OUT, f"{hazard}.json")
    with open(path, "w") as f:
        json.dump(fc, f, separators=(",", ":"))
    g = unary_union(parts)
    b = g.bounds
    print(f"  wrote {path}: parts={len(parts)} pts={sum(len(p.exterior.coords) for p in parts)} "
          f"kb={os.path.getsize(path) / 1024:.1f} area={km_area(g):.0f}km2 bbox=({b[0]:.4f},{b[1]:.4f},{b[2]:.4f},{b[3]:.4f})")


def fetch(rid):
    req = urllib.request.Request(f"https://api.openstreetmap.org/api/0.6/relation/{rid}/full.json", headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


WARDS = [1761742, 1758897, 1761717, 1758858, 1758878, 1758888, 1758891, 3554015, 3554304,
         1758936, 1758947, 1759474, 1759477, 1543056, 1543055, 1759506, 1760038, 1760040,
         1760078, 1760119, 1760124, 1761718, 1761743]

# ── Tokyo ──
print("=== quake · Tokyo 23 wards (polygonize)")
polys = []
for rid in WARDS:
    full = fetch(rid)
    got = rings_via_polygonize(full)
    if got:
        polys.append(got[0])
    else:
        print(f"  !! ward R{rid}: no polygon")
    time.sleep(0.7)
union = unary_union(polys)
print(f"  wards ok={len(polys)} union area={km_area(union):.0f} km2 (expect ~627)")
parts = round_geom(union, 0.0008)
write("quake", "Tokyo · 23 Special Wards", "OSM ward relations ×23", parts)

# ── Hong Kong (finer) ──
print("=== epidemic · Hong Kong (finer tolerance)")
full = fetch(913110)
got = rings_via_polygonize(full)
print(f"  polygons found: {len(got)}, top areas: {[round(km_area(p)) for p in got[:6]]}")
# SAR = union of significant polygons (HK Island + Kowloon + NT + Lantau + minor islands)
big = [p for p in got if km_area(p) > 2]
union = unary_union(big)
parts = round_geom(union, 0.00035)
write("epidemic", "Hong Kong SAR", "R913110", parts)
