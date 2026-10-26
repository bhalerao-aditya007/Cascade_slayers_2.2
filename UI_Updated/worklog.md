# Project Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Rebuild the 72H Warning dashboard as an immersive, professional, scroll-driven 3D experience using three.js — two-layer UX (immersive scroll narrative + dense OPS operational layer), per the user's Codrops/Active Theory/Lusion/Locomotive art direction.

Work Log:
- Initialized fullstack environment (Next.js 16 + Tailwind 4 + shadcn/ui).
- Installed `three@0.186`, `@types/three`, `lenis@1.3`.
- `src/lib/crisis-data.ts` — full simulated crisis model: META, 6 systems, 9 sectors (world + SVG map coords), 9-step cascade chain, 6 interventions, counterfactual engine (`computeOutcome`, `counterfactualSeries`), 24-entry event log.
- `src/lib/scene-state.ts` — mutable singleton (progress, anchors, zonesReveal, cascadeStep, intervention, pointer, paused) kept outside React to avoid 60fps re-renders.
- `src/lib/store.ts` — zustand UI store (section, opsOpen, interventions); intervention setters write effectiveness into sceneState.
- `src/components/three/CityScene.tsx` — fixed WebGL layer: ~2k instanced buildings (seeded RNG, downtown falloff, harbor industrial low-rise), instanced emissive window bands, 5 pulsing risk-zone rings/discs/beacons, 7 cascade nodes + 8 bezier tube edges with traveling pulses, ember particles, ground grid, FogExp2, CatmullRom camera spline through 5 waypoints keyed to section anchors, pointer parallax, intervention red→green mood lerp, DPR cap, reduced-motion support, full disposal.
- `src/components/hud/Hud.tsx` — top progress hairline, brand bar with live section indicator, OPS MODE button, right section rail, mission clock, live-status strip.
- `src/components/hud/Loader.tsx` — cinematic boot screen tied to first WebGL render (scene-ready event, 6s failsafe).
- Sections: `Overview` (hero stats + system chips), `Spatial` (synced sector list + SVG risk map + hover interrogation), `Cascade` (340vh sticky scroll-activated 9-step chain synced to 3D edges), `Intervention` (6 shadcn sliders + presets + live outcome tiles + recharts counterfactual), `Finale` (OPS CTA + footer).
- `src/components/ops/OpsOverlay.tsx` — dense operational layer: 6 live KPIs, 2 charts (population counterfactual, MW restoration), system status table, sector register, dependency matrix, event log, intervention summary bar; ESC close, lenis scroll lock, data-lenis-prevent.
- `src/app/page.tsx` — composition + Lenis smooth scroll + rAF scroll→sceneState bridge + section observer.
- `globals.css` — 72H design system (carbon/warm palette, glass, editorial type, reveal choreography, grain/vignette, slider theming, lenis css).
- `layout.tsx` — dark theme + metadata; `next.config.ts` — allowedDevOrigins for the preview host.

Stage Summary:
- Verified end-to-end with agent-browser: hero/spatial/cascade/intervention/OPS screenshots all render (VLM-confirmed), BALANCED preset drives sliders (65/55/50/45/60/40) and outcomes (412k→240k affected, 68h→44h recovery), OPS overlay shows 2 tables (15 rows) + 2 charts + event log, ESC closes, sector hover sync works, mobile 390px has zero horizontal overflow, zero page errors, lint clean.
- Key decisions: two-layer UX per user spec (scroll controls presentation; OPS = stable data layer); no GSAP/SplitText (licensing) — CSS/IO choreography instead; intervention state shared between narrative + OPS via zustand; 3D reads a module singleton for 60fps without React re-renders.

---
Task ID: 2
Agent: main (Z.ai)
Task: Rebuild 72H Warning as a demo-first crisis console per user pivot: choose 1 of 6 calamities → animated simulation on a real city map → detailed 72h model predictions. Apple-designer aesthetic (dark pro theme, restraint, content-first). Replaces the scroll-driven three.js build.

Work Log:
- Removed old scroll build (three/, hud/, sections/, ops/, scene-state, crisis-data, lenis scroll).
- Data engine `src/lib/sim/`: types.ts (layers/chains/interventions/episodes), core.ts (mulberry32 rng, curve helpers, T-clock formatting), zones.ts (20 real Chennai neighborhoods on stylised hex lattice + adjacency + bbox), hazards.ts (6 calamity meta, lead-time honesty badges), generate.ts (deterministic episode assembler: per-zone series w/ noise, pCritical, t-crit, city baseline, counterfactual curves, pipeline, sources).
- Six scenario scripts (scenarios/*.ts): flood (2-band monsoon, drain overload, substation blockage, river bumps), heat (WBGT dome, AC load, lagged ED surge), epidemic (syndromic lead, bed/ICU breach), grid (feeder cascade, ρ=1.12 supercritical, second wave), quake (M6.2 offshore, MMI field, liquefaction, ETAS aftershocks), chem (Cl₂ plume SW→NE, AEGL-2 corridor). Each with hand-authored ingest feeds, top-3 chains w/ stage ETAs + gates, 5 interventions w/ side effects, narrative steps, honesty notes, metrics.
- Tuned narratives via sanity harness: flood tips Z18/Z19 CRITICAL at T+0, grid Z12/Z15, quake MMI-VII coast + liquefaction marshes, chem/epidemic escalate inside forecast window.
- Store `src/lib/store.ts`: zustand phase machine (select→simulate→pipeline→forecast), fractional tHour playback, episode cache.
- UI: Landing.tsx (hero, 3-step strip, 6 hazard cards, reactive dot-field bg); MapView.tsx (MapLibre v5 + Carto dark, hex risk lattice via feature-state at 60fps, labels, click-select, ambient rotation, entrance fly-in, offline style fallback); EffectsCanvas.tsx (rain streaks/ripples, heat embers+vignette, epidemic pulse dots+transmission arcs, grid trip arcs+flicker, quake shockwave rings+screen shake+epicenter crosshair, chem plume cone+puffs); Timeline.tsx (dual-segment scrubber, event markers, chain-stage diamonds, speeds 1–8×, skip); SimPanel.tsx (live ingest feed, layer severity matrix, indicator tile+sparkline); PipelineCurtain.tsx (L0→L6 inference animation); forecast tabs: Overview (headline, t-critical, stats, 72h storyline, horizon jumps), Cascade (chain picker, stage flow cards, gantt w/ uncertainty, ρ+loops), Zones (sortable register, SHAP-style driver bars, zone band chart, Hawkes parents), Intervene (deploy toggles → live counterfactual 74%→50%, deadline clocks, side effects, MILP strip), Trust (model stack, calibration, ledger+canary live verify, source reliability incl. quarantined cluster).
- Fixed: maplibre-gl v6 worker-incompatibility with Next dev → pinned v5; maplibre position:relative override collapsing container → h-full sizing; scenario curve tuning (WX caps, HOS occupancy scaling, quake instant-onset).

Stage Summary:
- Verified end-to-end with agent-browser + VLM: landing (all 6 cards), flood full golden path (sim replay w/ streaming feed → pipeline → forecast → 5 tabs → deploy 2 interventions → counterfactual 74%→50% −24pts), quake (epicenter+coastal red zones, 9/10), chem (plume cone, 9/10), heat/grid smoke, trust verifications pass, back-nav, mobile 390px no overflow (9/10). Lint + tsc clean, zero runtime errors.
- Deliverable: single-route demo console (`/`) — select calamity → simulate on real Chennai map → 72h model outputs. Screenshots in /home/z/my-project/shots/.

---
Task ID: 3
Agent: main (Z.ai)
Task: Relocate each calamity to a famous world city with REAL OSM boundaries + rebuild the flow as a scrollable 3D experience (Codrops card-stacking/globe rotation + Bruno-Simon-style scroll-driven map camera), per user's latest direction.

Work Log:
- Boundaries (scripts/fetch-boundaries.py + fix-tokyo-hk.py + fix-hk-islands.py): resolved relation IDs via Photon (Nominatim/Overpass blocked); pulled geometry from api.openstreetmap.org relation/full.json; shapely polygonize + dissolve + Douglas-Peucker; wrote src/data/boundaries/{flood,heat,epidemic,grid,quake,chem}.json. Cities: Dhaka District (R4773565), City of Phoenix (R111257), Hong Kong SAR (R913110 + 8 island relations), NCT Delhi (R1942586), Tokyo 23 wards (23 ward relations dissolved), Bhopal District (R1976080). VLM-verified all 6 shapes + areas vs official figures.
- cities.ts: 6 city configs — real district seeds (Dhaka 20, Phoenix 20, HK 22, Delhi 20, Tokyo 20, Bhopal 20) with real centroids/pops/elevations/hospitals, per-city tz + currency + local ingest source names, famous-for + brief copy, per-city scroll camera keyframe paths.
- zones.ts rewritten: per-hazard hex lattices on real district centroids (lat-corrected km→deg), proximity neighbors, boundary loader, cameraAt(p) keyframe interpolator. hazards.ts retargeted to the six cities. core.ts fmtClock made city-tz aware.
- All 6 scenario scripts re-authored per city (flood→Dhaka Buriganga/chars/DMCH/Tejgaon 132kV; heat→Phoenix Maryvale UHI/NWS/APS-SRP/$; epidemic→HK Kwun Tong estate cluster/QEH/HA/HK$; grid→Delhi Bawana 400kV/trans-Yamuna/AIIMS; quake→Tokyo M7.3 north bay TMG scenario/Koto liquefaction/Bokutoh/¥; chem→Bhopal Govindpura NE drift class F/Hamidia/₹). generate.ts → zonesFor(hazard) + city source names.
- Store: phases select→brief→sim→pipeline→forecast→epilogue; setSimProgress(p) maps scroll→time; forecast playback kept.
- New components (src/components/experience/): Experience (Lenis root), SelectStage (hero + Codrops 3DStackMotion 6 cards, rAF transform stack, progress rail), GlobeCanvas (three.js dot globe + graticule + 6 pulsing city hotspots, damped scroll rotation), Session (single scroll engine: briefP/simP/phase sync/auto-scrolls), CityBrief (real-boundary SVG draw-on + famous-for stats), SimStage (pinned 560vh scroll-scrubbed replay: chapter rail, event captions, counts, SimPanel rail), ForecastStage (sticky console: ForecastPanel tabs + Timeline over the persistent map), SessionHud (01/02/03 phase tracker), Epilogue (metrics + honesty + run-another-city).
- MapView reworked into a persistent fixed layer: per-city boot, real boundary glow+fill+city label layers, hex risk lattice, scroll-scrubbed damped camera path (Bruno-Simon pattern), forecast ambient rotation, entrance flyTo. EffectsCanvas: per-episode zone lookups, city-corrected plume km→deg, rain strengthened (4.6×/0.5α/1.3px).
- Fixes during verification: hero/card overlap (card float clamped below 0 at top), Lenis stale maxScroll limit after session mount (resize() on mount + scrollTo), scrollToId manual y computation, Timeline/PipelineCurtain/SimPanel phase renames, ZonesTab neighborsFor.
- Verified end-to-end with agent-browser + VLM: hero/globe/cards → flood Dhaka full path (brief/boundary draw-on/scroll-scrub sim with rain+amber zones+captions/pipeline L0-L6/forecast 5 tabs/deploy 74%→58% −16pts/epilogue) → Tokyo quake (ward names, red Koto/Sumida/Arakawa, M7.3 mainshock rings + crosshair via timeline replay) → Delhi grid smoke (trans-Yamuna amber, BWN-404 caption, NCT boundary) → mobile 390px zero overflow through full flow. Lint + tsc clean, zero runtime errors. Recorded 64s demo video download/72h-warning-demo.webm.

Stage Summary:
- Deliverable: single-route scrollable demo — choose one of 6 calamities (each at its famous city) → city brief with actual OSM boundary → scroll-scrubbed simulation on the real city map (Bruno-style camera path) → L0-L6 inference curtain → full 72h forecast console (5 tabs, counterfactuals) → epilogue. Apple-grade dark glass UI; 3D card stack + rotating globe for selection; staggered 3D reveals for the console.
- Key decisions: real boundaries from OSM API (Photon for ID resolution since Nominatim blocked); one persistent MapLibre layer per session with scroll-owned camera; scroll = time in sim phase, play controls in forecast phase; Dhaka district/Bhopal district used where municipal boundaries are unmapped in OSM (labeled honestly).
