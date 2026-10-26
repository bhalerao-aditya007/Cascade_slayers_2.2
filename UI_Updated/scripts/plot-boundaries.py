#!/usr/bin/env python3
"""Render all boundary GeoJSONs to one contact-sheet PNG for visual QA."""
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import fontManager

fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['DejaVu Sans']

BASE = "/home/z/my-project/src/data/boundaries"
KEYS = ["flood", "heat", "epidemic", "grid", "quake", "chem"]

fig, axes = plt.subplots(2, 3, figsize=(16, 10), constrained_layout=True)
fig.suptitle("72H Warning — real OSM city boundaries (visual QA)", fontsize=13)

for ax, key in zip(axes.flat, KEYS):
    with open(f"{BASE}/{key}.json") as f:
        fc = json.load(f)
    g = fc["features"][0]["geometry"]
    name = fc["features"][0]["properties"]["name"]
    polys = [g["coordinates"]] if g["type"] == "Polygon" else [p for p in g["coordinates"]]
    for poly in polys:
        ring = poly[0]
        xs = [c[0] for c in ring]
        ys = [c[1] for c in ring]
        ax.plot(xs, ys, color="#4cc2ff", lw=1.1)
        ax.fill(xs, ys, color="#4cc2ff", alpha=0.18)
    ax.set_aspect(1 / 0.86)  # rough lat correction
    ax.set_title(f"{key} · {name}", fontsize=10)
    ax.grid(alpha=0.2, lw=0.4)
    ax.tick_params(labelsize=7)

out = "/home/z/my-project/scripts/boundary-qa.png"
fig.savefig(out, dpi=110)
print("wrote", out)
