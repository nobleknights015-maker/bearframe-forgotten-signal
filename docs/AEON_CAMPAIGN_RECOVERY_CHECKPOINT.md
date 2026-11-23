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

3. **Responsive Android Landscape, Offline Fonts, Asset Loader Fix & APK Build Pipeline (Phase 5)**
   - Fixed `Owner PNG missing: assets/aeon/environment/doors/sluice_gate_closed.png` in `frontend/public/js/engine/campaign-environment-art.js` by replacing the unthrottled 71-image `Promise.all` burst with bounded concurrency (`6` workers) and 3-attempt backoff retry, reducing transient proxy drops and peak image-decode memory on 4 GB RAM Android devices.
   - Updated `frontend/serve.js` with `Content-Length`, `.woff2`/`.woff` MIME types, static caching (`max-age=300`) for images/fonts, and a constant-time token-gated private APK download endpoint (`/private-apk/<48-96-hex-token>/Aeon-Circuit-The-Silent-Wake.apk`) serving strictly from `.gitignore`d `private-export/` with `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store, private`.
   - Bundled local SIL OFL 1.1 pixel fonts (`frontend/public/assets/fonts/silkscreen-{400,700}.woff2`, `vt323-400.woff2`) and removed external `fonts.googleapis.com` links from `frontend/public/campaign.html` for 100% air-gapped offline rendering.
   - Added Moto G (2025) landscape safety rules in `frontend/public/css/campaign.css` (`844×390`, `915×412`, `720×360`, `max-height: 520px`) for side-view combat panels/canvases, campaign modals, dialogue boxes, cinematics, and consolidated dropdown navigation (`>= 44px` menu toggle, zero horizontal overflow).
   - Added Android mipmap launcher icons (`mdpi`–`xxxhdpi`), `sensorLandscape` orientation lock, 4 GB RAM WebView optimizations, `scripts/build-private-aeon-apk.sh`, `android/ci/verify-offline-aeon-apk.sh`, and `.github/workflows/aeon-private-offline-apk.yml` (private-repo-only workflow with API 35 emulator smoke job):
     - **Public default build** (`gradle -p android :app:assembleDebug`): strictly excludes `assets/aeon/story/**`, `portraits/**`, `assets/world/**`, and `assets/battlers/**` from packaged APK assets and preserves Ghost Signal / Engine Lab behavior.
     - **Owner-private offline APK build** (`gradle -p android :app:assembleDebug -PaeonOfflineBuild=true` or `:app:assembleRelease -PaeonOfflineBuild=true`): validates local compiled campaign JSON (refusing compilation if absent), packages it offline inside the APK, sets `applicationId` to `labs.bearframe.aeoncircuit` with label `"Aeon Circuit: The Silent Wake"`, and boots `campaign.html` directly with zero runtime JSON import.

## Verification Matrix

| Check | Result | Notes |
| --- | --- | --- |
| Director's Cut v2 campaign compilation (`build_full_campaign.mjs`) | **PASS** | Compiled `campaign.json` (465 KB) & `opening-world-review-candidate.json` (645 KB) into `.gitignore`d `frontend/public/assets/aeon/story/` |
| Private campaign preflight (`--review` & `--release`) | **PASS** | `29/29` reachable sectors, `64/64` staged scenes, `30/30` staged quests, `61` encounters (`24` combat, `10` mandatory battles), `42` characters, `problems: []` |
| Full Node test suite (`node --test frontend/tests/*.test.mjs`) | **PASS** | `246/246` passing, `0` failed, `0` skipped (all private-campaign tests executed and passed against real source files) |
| Owner-private offline Android APK build (`-PaeonOfflineBuild=true`) | **PASS** | Compiled `private-export/Aeon-Circuit-The-Silent-Wake.apk` (`3,429,823` bytes, `labs.bearframe.aeoncircuit`, `versionName 2.0.0-aeon-offline`, `minSdk 26`, `targetSdk 35`, `LAUNCH_CAMPAIGN=true`, `sensorLandscape`); passes `verify-offline-aeon-apk.sh`, `aapt dump badging`, and `apksigner verify`; embeds `270` offline assets (`campaign.json`, `opening-world-review-candidate.json`, `71` environment PNGs, `14` portraits, `42` battlers, `42` world sprites, `3` local `.woff2` fonts, `5` mipmap icons) |
| Token-gated private APK download endpoint (`/private-apk/<token>/...`) | **PASS** | Verified `200 OK`, `application/vnd.android.package-archive`, exact `Content-Length`, SHA-256 byte-for-byte download parity, `Cache-Control: no-store, private`, `X-Robots-Tag: noindex, nofollow`, and `404` on invalid token or direct `/private-export/` path |
| Live Chromium offline gameplay QA (`campaign.html`) | **PASS** | `0` external requests (`blockedExternal: []`), `Silkscreen` 400/700 + `VT323` 400 loaded locally, `0` console/page/network errors, `hasImportPrompt: false`, New Campaign -> Sleeper select -> opening `SC-000` dialogue verified at Moto G (2025) `844×390` with `overflowX: false` |
| Frozen Ghost Signal files untouched | **PASS** | `index.html`, `css/game.css`, `js/ui.js`, `studio/index.html` unmodified |
| Local build & lint (`npm run lint && npm run build`) | **PASS** | All JS/MJS syntax checks and frontend build succeeded cleanly |
| Android AVD emulator execution in container | **NOT RUN** | Blocked by gVisor container kernel (`Linux 4.19.0-gvisor`, no `/dev/kvm`, no QEMU); automated API 35 emulator job provided in `.github/workflows/aeon-private-offline-apk.yml` |

## Remaining Steps for Device Hardware Testing

1. **Moto G (2025) hardware install & airplane-mode QA**: Download `Aeon-Circuit-The-Silent-Wake.apk` via the private token-gated link, sideload on Android, and verify airplane-mode launch, movement, side-view combat, dropdown menus, dialogue/cutscenes, and Save/Continue persistence across force-stop/relaunch.
2. **Optional private GitHub CI emulator run**: Run `.github/workflows/aeon-private-offline-apk.yml` in a private repository for automated API 35 AVD emulator smoke testing if desired.
