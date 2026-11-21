# Aeon Circuit: Source-Audited World Design Recovery — Continuity Checkpoint

**Date:** 2026-11-20  
**Target Repository:** `bearframe-forgotten-signal` (public development checkpoint — zero private screenplay, lore, or restricted art included)  
**Engine Compatibility:** Preserves Ghost Signal core engine, frozen legacy files (`index.html`, `css/game.css`, `js/ui.js`, `studio/index.html`), 32×32 portal/collision contracts, save slots, and approved responsive dropdown UI.

---

## 1. Completed Architectural & Compiler Fixes

### Priority 1 — World Compiler Integrity (`campaign-world-builder.js`)
- **Removed `ensureRoomConnectivity()` auto-tunneling:** Replaced with exported non-mutating `validateAreaConnectivity(id, collision, w, h, startTx, startTy)`. Any unreachable walkable pocket now throws a precise layout error listing exact coordinates instead of carving tunnels through walls, cliffs, buildings, machinery, or water.
- **Removed `takeFreeTile()` / `takeAnchorTile()` silent relocation & fallback portals:** Replaced with exported strict `placeAuthoredAnchor(id, role, anchor, ctx)`. Every start position, save terminal, supply cache, rest bench, ambient record, NPC, story scene, sidequest, puzzle, encounter, and stealth drone must have an explicit, walkable, non-colliding, non-portal-approach coordinate in `campaign-area-blueprints.js` or compilation fails immediately.

### Priority 2 — Substantial Handcrafted Scale (`campaign-area-blueprints.js`)
- Rebuilt all 4 flagship benchmark sectors to substantial multi-zone JRPG scale:
  - **`A00` Stasis Hollow (`42×24`)**: 5-zone subterranean cryogenic complex (Cryo-Pod Awakening Ward, Diagnostic Control Room, Maintenance & Cryo-Storage Bay, Security Checkpoint Hall, Armored East Airlock Vestibule).
  - **`A02` Rootway Ruins (`44×26`)**: Irregular limestone canyon & forest canopy perimeter, twin NW waterfalls & plunge pool, winding lower creek with 2 timber bridges, central colonnaded plaza, north ascending cliff pass, and NE Collapsed Multi-Room Research Pavilion.
  - **`A15` Survey Wetland (`46×28`)**: Multi-islet turquoise wetland archipelago, 3 cliff waterfalls, NW Survey Outpost + Bunkhouse wharf, interconnected timber boardwalk causeways, central gathering islet, south loop boardwalk, north ridge pass, and east Floodgate Pier.
  - **`A24` Control Cathedral (`44×30`)**: Cruciform vaulted basilica framed by 4 reflecting basins and twin waterfalls, colonnaded violet-trimmed nave runner, north ceremonial stair & Engine Core Cathedral Gate, south Archive Annex, and east Switch Choir.
- Upgraded major hubs (`A09` Lantern Shelf `40×24`, `A12` Broken Sky-Rail `40×18`, `A18` Census Archive `38×24`, `A21` Quarantine Spine `40×22`) and enriched all remaining 21 sectors with explicit structural geometry and semantic anchors.
- Enforced `paintT` floor-only preservation for walkable overlays, strict portal threshold/frame terrain alignment, and seamless building roof-to-facade alignment across all exterior structures.

### Priority 3 & 4 — Architectural Entrance Assemblies & Structural Tilework (`campaign-doorways.js`, `campaign-world.js`, `campaign-environment-details.js`, `tiles.js`)
- Added validated `portalAssembly` descriptors (`airlock`, `archway`, `cathedral_gate`, `elevator`, `trail_exit`, `bridge_exit`, `rail_gantry`) rendered across `bakeMap` (`paintPortalAssemblyBase`) and `bakeOver` (`paintPortalAssemblyOver`) for recessed openings, jamb pilasters, overhead lintels/archivolts/gantries (depth occlusion), and continuous edge trails/boardwalks/rails.
- Protected a strict 3×3 entrance clearance zone around both portal thresholds and backing walls so foreground/background scenery never conceals entrances.
- Added 5 solid structural tilework codes (`16` cryo stasis pod banks, `17` workstation console banks, `18` archive bookshelves/storage racks, `19` carved architectural columns/buttresses, `20` moss-draped ancient ruin walls) with 100% visual-to-collision parity.
- Kept legacy Ghost Signal maps and fixtures without `portalAssembly` 100% untouched.

### Live Runtime Fixes Found During Chromium Verification (`main.js`, `campaign-game.js`)
- Fixed `main.js` root `/` campaign boot detection (`document.body.classList.contains('aeon-campaign')`) so serving `campaign.html` at `/` launches Aeon Circuit instead of falling back to Ghost Signal Mission 01.
- Made `updateHudArea` in `campaign-game.js` null-safe (`area.name || area.title || area.id`).

---

## 2. Verification Results (`PASS` / `FAIL` / `NOT RUN`)

| Check | Result | Details |
| :--- | :--- | :--- |
| Full Node.js Test Suite (`node --test frontend/tests/*.test.mjs`) | **243 PASS / 0 FAIL / 2 NOT RUN** | Includes strict zero-tunneling & zero-relocation unit tests and full 29-sector Director's Cut stress audit (64 scenes, 20 sidequests, 24 battles/bosses, 58 puzzles, 29 ambient records, 29 save terminals, 9/9 scenery atlases, 0 collision-terrain mismatches, 0 floating doors, 0 overlapping entities). |
| Private Director's Cut v2 Story & Compiled World Tests (`campaign-directors-cut.test.mjs` tests 5 & 6) | **2 NOT RUN (`t.skip`)** | Private story/world JSON files are excluded from this public workspace by policy; explicitly reported as `SKIP NOT RUN`, never reported as `PASS`. |
| Live Chromium Interactive Gameplay & Visual Audit (`1280×720`) | **PASS** | Verified live keyboard movement, solid wall/object collision, progression-gated airlock lock state, reciprocal portal travel (`A02↔A04`, `A15↔A16`, `A24↔A25`), and visual inspection of both full-area overviews and live gameplay screenshots for `A00`, `A02`, `A15`, `A24`, plus hub overviews `A09`, `A12`, `A18`, `A21`. Zero runtime console/page errors. |
| Responsive Mobile Landscape Viewport & Dropdown Menu (`844×390`) | **PASS** | Verified 16:9 letterboxed pixel viewport, unclipped HUD bar, and full 12-tab responsive Field Record dropdown menu with zero clipping or overlap. |
| Frontend Build & Lint (`npm run lint && npm run build`) | **PASS** | Clean static build and lint pass with zero frozen-file modifications. |

---

## 3. Remaining Release Tasks
1. **Owner-Hardware Private Campaign Import Verification:** Import the private `Aeon_Circuit_Directors_Cut_v2_campaign.json` locally on owner hardware to execute the 2 private-file tests currently marked `NOT RUN` and validate every private cutscene binding against the newly authored semantic anchors.
2. **Extended Hub & Sector Gameplay Pass:** Perform additional interactive playtests through intermediate sectors (`A03`–`A08`, `A10`–`A14`, `A16`–`A23`, `A25`–`A28`) during full story playthrough.
3. **Repository Sync:** Commit and push this verified public checkpoint to `bearframe-forgotten-signal` (never touching `bearframe-ghost-signal` or committing private lore/screenplay assets).
