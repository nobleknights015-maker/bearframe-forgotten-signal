# Aeon Circuit: The Silent Wake — Complete Campaign Recovery Checkpoint

## Summary

This checkpoint integrates the compiled Director's Cut v2 campaign into the 29-sector world architecture while preserving all public repository boundaries, keeping private lore and unpublished screenplay bundles excluded via `.gitignore`, and leaving the original Ghost Signal engine files untouched.

## Key Engineering Fixes Completed

1. **Real Campaign Compilation & World Validation (Phase 1)**
   - Added the 5th authored puzzle anchor in `A21` so all 61 campaign encounters map to explicit authored placements with zero silent relocation or auto-tunneling.
   - Re-staged post-boss transition scenes (`SC-014` in `A08`), added `act7_complete` progression gating on `SC-057`, and tightened Act-boundary doorway flags in `WORLD_EDGES` to eliminate premature-entry softlocks across Acts 1–9.
   - Verified `preflight_private_campaign.mjs` in both `--review` and `--release` profiles (`29/29` reachable sectors, `64/64` scenes, `30/30` quests, `24` combat encounters, `10` mandatory battles, `problems: []`).

2. **Playable Campaign & Narrative Runtime Fixes (Phases 2 & 4)**
   - Synchronized `world.flags` (from battles, noncombat puzzles, and sidequests) into `campaign-narrative.js` snapshots so conditional dialogue lines never desync.
   - Fixed `CHOICE-07` finale branch switching (`SC-042` / `SC-043`) skip-set cleanup so both endings (`RECLASSIFY` and `ISOLATE`) complete deterministically.
   - Fixed `release()` in `campaign-narrative.js` to clear pending dialogue callbacks and hide `#dialog` whenever `SKIP` finishes a scene, preventing the dialogue overlay from remaining stuck over exploration.
   - Added live next-objective HUD guidance (`syncObjectiveUi`) and an animated amber world-space beacon (`tiles.js`) for active story objects and next-step doorways.
   - Completed all 20 sidequest bindings (`SQ-01`–`SQ-20`), including dialogue-less requests (`SQ-17`–`SQ-20`), with prerequisite checks, XP awards, and automatic level-up progression.
   - Hardened battle/boss encounter dispatch in `campaign-game.js` so locked or already-cleared battles never fall through to noncombat puzzle modals.

3. **Responsive Android Landscape & Owner-Private Offline APK Support (Phase 5)**
   - Added Moto G (2025) landscape safety rules in `frontend/public/css/campaign.css` (`844×390`, `915×412`, `max-height: 520px`) for side-view combat panels/canvases, campaign modals, dialogue boxes, cinematics, and consolidated dropdown navigation (`>= 44px` menu toggle, zero horizontal overflow).
   - Updated `android/app/build.gradle.kts`, `android/app/src/main/AndroidManifest.xml`, and `android/app/src/main/java/labs/bearframe/ghostsignal/MainActivity.java`:
     - **Public default build** (`gradle -p android :app:assembleDebug`): strictly excludes `assets/aeon/story/**` from packaged APK assets and preserves existing Ghost Signal / Engine Lab behavior.
     - **Owner-private offline APK build** (`gradle -p android :app:assembleDebug -PaeonOfflineBuild=true` or `:app:assembleRelease -PaeonOfflineBuild=true`): validates local compiled campaign JSON, packages it offline inside the APK, sets `applicationId` to `labs.bearframe.aeoncircuit` with label `"Aeon Circuit: The Silent Wake"`, and boots `campaign.html` directly with zero runtime JSON import.
     - Fixed `WebViewAssetLoader` asset routing in `MainActivity.java` so `assets/aeon/*` falls back to packaged APK assets whenever no owner-installed override exists in internal storage.

## Verification Matrix

| Check | Result | Notes |
| --- | --- | --- |
| Private campaign compile (`build_full_campaign.mjs`) | **PASS** | 29 areas, 64 scenes, 24 combat, 10 mandatory battles, 137 flags (local `.gitignore`d output) |
| Private campaign preflight (`--review`) | **PASS** | `problems: []` |
| Private campaign preflight (`--release`) | **PASS** | `42` characters, `4` portraits, `29/29` reachable, `64/64` scenes, `30/30` quests, `problems: []` |
| Full Node test suite (`node --test frontend/tests/*.test.mjs`) | **PASS** | `246/246` passing, `0` failed, `0` skipped (includes E2E playthrough for all 4 Sleepers, all 10 main quests, 7 choices, 10 mandatory bosses, and both endings) |
| Live Chromium walkthrough (`1280×720`) | **PASS** | Title, 4 Sleepers, `SC-000`–`SC-004`, Callsign/Pronouns (`Vesper` / `she/her`), Dropdown Menu, 29-sector World Map, Quests, Save/Reload/Continue, real doorway transit `A00 -> A01 -> A02`, live `EN-001` side-view combat turn, `0` console/page errors |
| Live Chromium visual inspection (`A00`, `A02`, `A15`, `A24`, Combat, Menu, World Map) | **PASS** | Verified in-game captures; caught and resolved stuck `#dialog` box after clicking `SKIP` |
| Responsive layout QA (`844×390`, `915×412`, `1024×768`) | **PASS** | Side-view combat (`panelH: 355 <= 390`, `minBtnH: 36`), dropdown menu (`toggleH: 44`, `drawerBottom: 380 <= 390`), `overflowX: false` across all tested sizes |
| Frozen Ghost Signal files untouched | **PASS** | `index.html`, `css/game.css`, `js/ui.js`, `studio/index.html` unmodified |
| Local build & lint (`npm run lint && npm run build`) | **PASS** | All JS/MJS syntax checks and frontend build succeeded cleanly |
| Control-plane RPC (`compile_applet` / `lint_applet`) | **NOT RUN** | Control-plane gateway returned HTTP 504 timeout; local `npm run lint && npm run build` passed directly |
| Android Gradle APK compilation (`assembleDebug` / `-PaeonOfflineBuild=true`) | **NOT RUN** | JDK 17, Gradle, and Android SDK Platform 35 are not installed in this container |
| Physical Moto G (2025) hardware & >30-minute save soak | **NOT RUN** | Requires physical target device or Android emulator outside this environment |

## Prioritized Remaining Follow-Ups (On Owner Workstation / Device)

1. **Build owner-private offline APK**: After running `node frontend/narrative-tools/build_full_campaign.mjs` locally with the private source JSONs, build via:
   ```bash
   gradle -p android :app:assembleDebug -PaeonOfflineBuild=true
   ```
   (or `:app:assembleRelease -PaeonOfflineBuild=true` signed with your private keystore).
2. **Moto G (2025) hardware soak test**: Install the APK, play offline with airplane mode enabled, verify touch/gamepad controls, audio resume after HOME/backgrounding, and Save/Continue persistence across force-stop/relaunch.
3. **Optional local pixel font bundling**: `campaign.html` falls back gracefully offline, while bundling locally licensed `Silkscreen` and `VT323` `.woff2` files will guarantee identical offline typography on air-gapped Android devices.
