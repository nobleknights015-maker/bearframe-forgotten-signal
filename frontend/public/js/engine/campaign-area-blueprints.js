// Bespoke spatial architecture & worldbuilding blueprints for all 29 Aeon Circuit sectors (A00-A28).
// Every sector is handcrafted as a believable, purposeful place with substantial JRPG scale,
// structurally integrated multi-tile entrance assemblies (zero floating doors), zero auto-tunneling,
// and explicit semantic anchors for every story object, NPC, save point, supply cache, quest & encounter.
// Contains NO screenplay dialogue, lore text, or private story copy.

// Terrain layer codes (rendered by tiles.js paintCampaignTerrainCell):
//  1 = paved stone/metal walkway with curbs
//  2 = deep water / coolant canal basin (solid collision=1)
//  3 = multi-step stairway / ramp
//  4 = viaduct / cliff drop-off safety guardrail edge (solid collision=1)
//  5 = organic moss / grass / wildflower ground transition
//  6 = recessed energy / relay conduit trench
//  7 = timber boardwalk / wooden pier bridge over water
//  8 = building roof / shelter cap (solid collision=1)
//  9 = building exterior facade wall with illuminated windows (solid collision=1)
// 10 = natural packed-earth / stone dirt trail
// 11 = elevated railway track bed (ballast + sleepers + twin rails)
// 12 = rocky cliff / canyon escarpment face (solid collision=1)
// 13 = dense wetland reeds / forest canopy foliage border (solid collision=1)
// 14 = interior ceremonial runner / woven plaza rug / cryo hazard deck
// 15 = collapsed masonry rubble / broken ruins
// 16 = cryo stasis pod bank embedded in bulkhead (solid collision=1)
// 17 = laboratory / control-room workstation console bank (solid collision=1)
// 18 = archive bookshelf / vault data-canister storage rack (solid collision=1)
// 19 = carved architectural column / cathedral buttress pillar (solid collision=1)
// 20 = weathered ancient stone ruin wall draped with moss & roots (solid collision=1)

export const AREA_DIMENSIONS = Object.freeze({
  A00: { w: 42, h: 24 }, // Benchmark #1: Stasis Hollow (5-zone cryogenic facility)
  A01: { w: 28, h: 16 }, // Auxiliary Stasis Corridor & Root Breach
  A02: { w: 44, h: 26 }, // Benchmark #2: Rootway Ruins (canyon, waterfall, pavilion, creek)
  A03: { w: 32, h: 18 }, // Filter Basin Waterworks
  A04: { w: 24, h: 16 }, // Upper Rootway Overlook Shrine
  A05: { w: 34, h: 20 }, // Relay Court Communications Hub
  A06: { w: 30, h: 18 }, // Mail Vault Sorting Facility
  A07: { w: 26, h: 16 }, // Lower Relay Service Conduit
  A08: { w: 32, h: 18 }, // Flooded Quay Wharf & Water-Lock
  A09: { w: 40, h: 24 }, // Lantern Shelf Multi-Building Settlement
  A10: { w: 30, h: 18 }, // Shelf Air-Exchange Turbine Plant
  A11: { w: 26, h: 16 }, // Upper Lantern Residential Terrace
  A12: { w: 40, h: 18 }, // Broken Sky-Rail Cantilevered Viaduct
  A13: { w: 30, h: 16 }, // Switchyard Overpass & Canyon Ramp
  A14: { w: 26, h: 16 }, // Ravine Under-Deck Floor
  A15: { w: 46, h: 28 }, // Benchmark #3: Survey Wetland (outpost, islets, boardwalks)
  A16: { w: 34, h: 18 }, // Floodgate Pier & Hydro-Pump Station
  A17: { w: 26, h: 16 }, // Highland Survey Ridge Camp
  A18: { w: 38, h: 24 }, // Census Archive Grand Library Nave
  A19: { w: 24, h: 15 }, // Sealed Records Annex Vault
  A20: { w: 32, h: 18 }, // Return Haven Fortified Courtyard
  A21: { w: 40, h: 22 }, // Quarantine Spine Multi-Chamber Containment Wing
  A22: { w: 24, h: 15 }, // Quarantine Observation Wing
  A23: { w: 28, h: 16 }, // Cathedral Antechamber Processional Bridge
  A24: { w: 44, h: 30 }, // Benchmark #4: Control Cathedral Cruciform Basilica
  A25: { w: 26, h: 18 }, // Quiet Engine Core Suspended Arena
  A26: { w: 32, h: 18 }, // WARD-7 Switch Chamber & Surface Lift
  A27: { w: 30, h: 16 }, // Surface Ascent Landing & Elevator Headhouse
  A28: { w: 34, h: 18 }  // First Morning Overlook Promontory
});

function createGridBuilder(w, h) {
  // Start fully solid (1) so every sector is CARVED deliberately into rooms, buildings, or landscapes
  const col = new Array(w * h).fill(1);
  const terr = new Array(w * h).fill(0);
  const waterfalls = [];
  const lightShafts = [];
  const lamps = [];
  const details = [];
  const portalSlots = {};
  const anchors = {
    start: null,
    save: null,
    crate: null,
    bench: null,
    ambient: null,
    npcs: [],
    scenes: [],
    sceneById: {},
    sidequests: [],
    sidequestById: {},
    puzzles: [],
    battles: [],
    drone: null
  };

  const inB = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const setC = (x, y, v) => { if (inB(x, y)) col[y * w + x] = v; };
  const setT = (x, y, v) => { if (inB(x, y)) terr[y * w + x] = v; };
  const getC = (x, y) => (inB(x, y) ? col[y * w + x] : 1);
  const getT = (x, y) => (inB(x, y) ? terr[y * w + x] : 0);

  const carve = (x0, y0, x1, y1, tCode = 0) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (x >= 1 && y >= 2 && x <= w - 2 && y <= h - 3) {
          setC(x, y, 0);
          if (tCode !== null && tCode !== undefined) setT(x, y, tCode);
        }
      }
    }
  };

  const wall = (x0, y0, x1, y1, tCode = 0) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        setC(x, y, 1);
        setT(x, y, tCode);
      }
    }
  };

  const WALKABLE_TERRAIN = new Set([1, 3, 5, 6, 7, 10, 11, 14, 15]);
  const paintT = (x0, y0, x1, y1, tCode) => {
    const floorOnly = WALKABLE_TERRAIN.has(tCode);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (floorOnly && getC(x, y) !== 0) continue;
        setT(x, y, tCode);
      }
    }
  };

  // Multi-tile exterior building with corrugated/slate roof (8) meeting lit windowed facade wall (9)
  const building = (x0, y0, x1, y1) => {
    const facadeY = y1;
    for (let y = y0; y < facadeY; y++) {
      for (let x = x0; x <= x1; x++) { setC(x, y, 1); setT(x, y, 8); }
    }
    for (let x = x0; x <= x1; x++) { setC(x, facadeY, 1); setT(x, facadeY, 9); }
  };

  // Water basin (solid water cells)
  const water = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { setC(x, y, 1); setT(x, y, 2); }
  };

  // Walkable wooden pier / boardwalk over water
  const bridge = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x >= 1 && y >= 2 && x <= w - 2 && y <= h - 3) { setC(x, y, 0); setT(x, y, 7); }
    }
  };

  const SOLID_TERRAIN = new Set([2, 4, 8, 9, 12, 13, 16, 17, 18, 19, 20]);
  const ensureWalkableTerrain = (x, y, assembly) => {
    if (!inB(x, y)) return;
    if (SOLID_TERRAIN.has(getT(x, y))) {
      const t = assembly === 'bridge_exit' ? 7 : assembly === 'rail_gantry' ? 11 : assembly === 'trail_exit' ? 10 : 1;
      setT(x, y, t);
    }
  };
  const ensureSolidTerrain = (x, y) => {
    if (!inB(x, y)) return;
    if (WALKABLE_TERRAIN.has(getT(x, y))) setT(x, y, 0);
  };

  // Structurally embedded portal registration with architectural assembly metadata
  const portal = (toId, tx, ty, dir, art, label, style = 'bulkhead', opts = {}) => {
    const px = Math.max(1, Math.min(w - 2, tx));
    const py = Math.max(2, Math.min(h - 3, ty));
    setC(px, py, 0);
    ensureWalkableTerrain(px, py, opts.assembly);
    const inDx = dir === 'right' ? -1 : dir === 'left' ? 1 : 0;
    const inDy = dir === 'down' ? -1 : dir === 'up' ? 1 : 0;
    if (px + inDx >= 1 && px + inDx <= w - 2 && py + inDy >= 2 && py + inDy <= h - 3) {
      setC(px + inDx, py + inDy, 0);
      ensureWalkableTerrain(px + inDx, py + inDy, opts.assembly);
    }
    if (opts.frame !== false) {
      const frameWall = (x, y) => { setC(x, y, 1); ensureSolidTerrain(x, y); };
      if (dir === 'up') {
        frameWall(px, py - 1);
        if (px - 1 >= 0 && getC(px - 1, py - 1) === 0) frameWall(px - 1, py - 1);
        if (px + 1 < w && getC(px + 1, py - 1) === 0) frameWall(px + 1, py - 1);
      } else if (dir === 'down') {
        frameWall(px, py + 1);
        if (opts.jambs !== false) {
          if (px - 1 >= 1) frameWall(px - 1, py + 1);
          if (px + 1 <= w - 2) frameWall(px + 1, py + 1);
        }
      } else if (dir === 'right') {
        frameWall(px + 1, py);
        if (opts.jambs !== false) {
          frameWall(px + 1, py - 1);
          frameWall(px + 1, py + 1);
        }
      } else if (dir === 'left') {
        frameWall(px - 1, py);
        if (opts.jambs !== false) {
          frameWall(px - 1, py - 1);
          frameWall(px - 1, py + 1);
        }
      }
    }
    portalSlots[`to_${toId}`] = {
      tx: px, ty: py, dir, art, label, style,
      ...(opts.assembly ? { assembly: opts.assembly } : {})
    };
  };

  return {
    w, h, col, terr, waterfalls, lightShafts, lamps, details, portalSlots, anchors,
    setC, setT, getC, getT, carve, wall, paintT, building, water, bridge, portal
  };
}

// Helper for carving an interior partition wall with a framed doorway gap
function partitionV(b, x, y0, y1, gapY, gapH = 2) {
  b.wall(x, y0, x, y1, 0);
  for (let y = gapY; y < gapY + gapH; y++) { b.setC(x, y, 0); b.setT(x, y, 1); }
}
function partitionH(b, y, x0, x1, gapX, gapW = 2) {
  b.wall(x0, y, x1, y, 0);
  for (let x = gapX; x < gapX + gapW; x++) { b.setC(x, y, 0); b.setT(x, y, 1); }
}

export function buildAreaArchitecture(id, meta) {
  const dims = AREA_DIMENSIONS[id] || { w: meta.w || 28, h: meta.h || 16 };
  const b = createGridBuilder(dims.w, dims.h);
  const { w, h } = b;

  switch (id) {
    // =========================================================================
    // ACT 0 — STASIS WING (Ancient Subterranean Cryogenic Research Complex)
    // =========================================================================
    case 'A00': {
      // BENCHMARK #1: A00 Stasis Hollow (42x24) — 5-Zone Subterranean Cryogenic Facility
      // 1. Cryo-Pod Awakening Ward (NW, x:2..13, y:3..13)
      b.carve(2, 4, 13, 13, 0);
      b.carve(4, 3, 11, 3, 0); // recessed north cryo pod gallery
      // Bank of recessed dormant Cryo Stasis Pods (16) lining the north & west alcoves
      b.wall(2, 3, 3, 3, 16);
      b.wall(5, 2, 6, 2, 16);
      b.wall(9, 2, 10, 2, 16);
      b.wall(12, 3, 13, 3, 16);
      b.wall(2, 6, 2, 7, 16);
      b.wall(2, 10, 2, 11, 16);
      b.paintT(4, 5, 11, 11, 14); // hazard-bordered cryogenic bay deck
      b.paintT(7, 3, 8, 13, 6);   // twin glowing main stasis power bus conduits
      b.paintT(11, 8, 13, 9, 1);  // exit walkway toward diagnostic bulkhead

      // Structural Bulkhead Partition #1 separating Cryo Ward from Diagnostic Control Lab
      partitionV(b, 14, 3, 13, 8, 2);

      // 2. Life-Support & Diagnostic Control Room (North-Center, x:15..28, y:3..13)
      b.carve(15, 3, 28, 13, 0);
      // Raised north telemetry deck with continuous Lab Workstation Consoles (17)
      b.wall(16, 2, 20, 2, 17);
      b.wall(23, 2, 27, 2, 17);
      b.paintT(16, 3, 27, 5, 1);   // elevated diagnostic deck
      b.paintT(20, 6, 23, 6, 3);   // broad steel stairs down to central atrium
      b.paintT(15, 8, 28, 9, 1);   // primary east-west facility corridor
      b.paintT(21, 7, 22, 13, 6);  // life-support power conduit feeding south bay
      // Structural console island in center-south of lab
      b.wall(17, 11, 19, 11, 17);
      b.wall(24, 11, 26, 11, 17);

      // Horizontal Bulkhead Partition #2 opening south into Maintenance & Cryo-Storage Bay
      partitionH(b, 14, 2, 28, 19, 3);

      // 3. Maintenance & Cryo-Storage Bay (South-West & South-Center, x:3..27, y:15..20)
      b.carve(3, 15, 27, 20, 0);
      // Storage racking aisles (18) & coolant pipe trench (6)
      b.wall(4, 15, 6, 15, 18);
      b.wall(10, 15, 12, 15, 18);
      b.wall(4, 20, 7, 20, 18);
      b.wall(14, 18, 15, 20, 18);
      b.paintT(8, 16, 26, 17, 1);
      b.paintT(19, 15, 21, 17, 1);
      b.paintT(22, 18, 26, 19, 14); // maintenance hazard workpad
      b.paintT(11, 19, 12, 19, 15); // minor floor masonry collapse near old conduit
      // Secondary service corridor connecting Storage Bay east to Security Checkpoint
      partitionV(b, 28, 15, 20, 16, 2);

      // Structural Bulkhead Partition #3 into Security Checkpoint Hall
      partitionV(b, 29, 3, 14, 8, 2);

      // 4. Security Checkpoint Hall (East-Center, x:30..34, y:6..18)
      b.carve(30, 6, 34, 18, 0);
      b.wall(30, 6, 30, 6, 19); b.wall(34, 6, 34, 6, 19); // armored checkpoint pillars
      b.wall(30, 14, 30, 14, 19); b.wall(34, 14, 34, 14, 19);
      b.wall(31, 5, 33, 5, 17); // checkpoint security monitoring console bank
      b.paintT(30, 8, 34, 10, 14);
      b.paintT(31, 11, 33, 17, 1);
      b.paintT(29, 16, 31, 17, 1); // connect south maintenance exit cleanly!
      b.setC(29, 16, 0); b.setC(29, 17, 0);

      // Structural Bulkhead Partition #4 into East Armored Airlock Vestibule
      partitionV(b, 35, 6, 18, 10, 3);

      // 5. Armored East Airlock Vestibule (x:36..40, y:8..14)
      b.carve(36, 8, 40, 14, 1);
      b.paintT(36, 10, 40, 12, 14); // pressurized airlock floor plating
      b.wall(37, 8, 38, 8, 17);     // airlock pressure-gauge bank
      b.portal('A01', 40, 11, 'right', 'airlock_east', 'AUX CORRIDOR AIRLOCK', 'bulkhead', { assembly: 'airlock' });

      // Explicit semantic anchors — ZERO silent relocation
      b.anchors.start = [6, 9, 'right']; // Sleeper wakes in Cryo-Pod Awakening Ward
      b.anchors.npcs = [[32, 9]]; // Guardian stationed in Security Checkpoint Hall
      b.anchors.save = [21, 4];   // Save Terminal centered on north Diagnostic Control Deck
      b.anchors.crate = [7, 18];  // Supply Cache tucked inside Maintenance & Cryo-Storage Bay
      b.anchors.ambient = [26, 4]; // Field Record on east diagnostic bench
      b.anchors.sceneById = {
        'SC-001': [4, 7],   // Sleeper Cryo Pod Awakening Terminal (Cryo Ward West)
        'SC-002': [5, 5],   // Cryo Pod Bay inspection (Cryo Ward NW)
        'SC-003': [10, 5],  // Secondary Stasis Pod / Diagnostic readout (Cryo Ward NE)
        'SC-048': [17, 4],  // Life-Support Telemetry Console (Diagnostic Lab West)
        'SC-004': [38, 10]  // Airlock Override Switch (East Airlock Vestibule)
      };
      b.anchors.scenes = [[25, 10], [10, 12], [20, 10], [32, 12]];
      b.anchors.puzzles = [[24, 18], [16, 19], [32, 14], [11, 16]];
      b.anchors.battles = [[23, 19], [32, 16]];
      b.lightShafts.push({ x: 6, y: 1, w: 3, h: 9, color: '#7eeeff', alpha: 0.12 });
      b.lightShafts.push({ x: 20, y: 1, w: 4, h: 9, color: '#88e8ff', alpha: 0.11 });
      b.lightShafts.push({ x: 31, y: 4, w: 3, h: 8, color: '#a8f4ff', alpha: 0.09 });
      b.lamps.push(
        { x: 7, y: 5, r: 120, color: '#72dce8', flicker: false },
        { x: 21, y: 5, r: 135, color: '#72dce8', flicker: false },
        { x: 11, y: 17, r: 110, color: '#f2bd75', flicker: true },
        { x: 24, y: 18, r: 105, color: '#72dce8', flicker: false },
        { x: 32, y: 10, r: 115, color: '#72dce8', flicker: false },
        { x: 38, y: 11, r: 95, color: '#7dffb0', flicker: false }
      );
      break;
    }

    case 'A01': {
      // Auxiliary Stasis Corridor (28x16) — Utility Wing, Collapsed Ceiling & Root Breach
      b.carve(1, 6, 5, 10, 1);
      b.portal('A00', 1, 8, 'left', 'airlock_west', 'STASIS HOLLOW AIRLOCK', 'bulkhead', { assembly: 'airlock' });
      partitionV(b, 6, 3, 12, 7, 3);
      // Main utility corridor with collapsed moss ceiling breach & south generator alcove
      b.carve(7, 3, 18, 12, 0);
      b.wall(8, 2, 10, 2, 17);
      b.wall(15, 2, 17, 2, 18);
      b.paintT(9, 3, 14, 5, 5);
      b.paintT(10, 4, 12, 4, 15);
      b.paintT(7, 7, 18, 9, 1);
      b.wall(7, 11, 10, 12, 18);
      b.paintT(12, 11, 17, 12, 14);
      // East overgrown stone breach tunnel leading into Rootway (A02)
      partitionV(b, 19, 3, 12, 7, 3);
      b.carve(20, 6, 26, 10, 10);
      b.wall(20, 5, 26, 5, 20);
      b.wall(20, 11, 26, 11, 20);
      b.paintT(21, 6, 24, 6, 5);
      b.paintT(22, 10, 24, 10, 15);
      b.portal('A02', 26, 8, 'right', 'arch_east', 'ROOTWAY BREACH', 'hatch', { assembly: 'archway' });

      b.anchors.start = [4, 8, 'right'];
      b.anchors.save = [15, 11];
      b.anchors.ambient = [12, 11];
      b.anchors.scenes = [[11, 6], [16, 6], [23, 8]];
      b.anchors.puzzles = [[13, 10], [17, 10], [9, 10], [22, 7]];
      b.anchors.battles = [[15, 8], [21, 9]];
      b.lightShafts.push({ x: 10, y: 1, w: 4, h: 7, color: '#a8ffaa', alpha: 0.14 });
      b.lamps.push(
        { x: 3, y: 8, r: 90, color: '#72dce8', flicker: true },
        { x: 13, y: 6, r: 120, color: '#8ef5a8', flicker: false },
        { x: 24, y: 8, r: 100, color: '#a4f096', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 1 — ROOTWAY (Overgrown Ruined Canyon, Waterworks & Upper Shrine)
    // =========================================================================
    case 'A02': {
      // BENCHMARK #2: A02 Rootway Ruins (44x26) — Overgrown Canyon, Waterfall Gorge, Collapsed Pavilion & Creek
      // Natural jagged canyon cliff & forest canopy perimeter (ZERO rectangular bunker box!)
      b.wall(0, 0, w - 1, 2, 12);         // north limestone canyon cliffs
      b.wall(0, h - 3, w - 1, h - 1, 13); // south dense forest canopy & roots
      b.wall(0, 2, 1, h - 3, 12);         // west canyon cliff wall (Stasis tunnel emerges here)
      b.wall(w - 2, 2, w - 1, h - 3, 12); // east cliff wall (Aqueduct mouth carved here)

      // Carve expansive irregular canyon basin
      b.carve(2, 4, 41, 22, 0);
      // Organic rocky outcrops & dense canopy overhangs breaking every straight edge
      b.wall(2, 3, 6, 6, 13);
      b.wall(2, 17, 6, 22, 13);
      b.wall(7, 20, 11, 22, 13);
      b.wall(37, 19, 41, 22, 13);
      b.wall(37, 3, 41, 6, 12);
      b.wall(15, 3, 17, 4, 12);
      b.wall(25, 3, 36, 4, 12); // north cliff escarpment backing the Collapsed Pavilion

      // 1. North-West Twin Waterfall Gorge & Deep Turquoise Plunge Pool feeding the creek
      b.waterfalls.push({ x: 8, y: 1, w: 2, h: 3, color: 'rgba(72,216,198,0.80)' });
      b.waterfalls.push({ x: 12, y: 1, w: 2, h: 3, color: 'rgba(72,216,198,0.78)' });
      b.water(7, 4, 14, 7);
      b.water(9, 8, 12, 9);
      b.paintT(6, 8, 8, 9, 5);
      b.paintT(13, 8, 15, 9, 5);

      // 2. Winding Rainwater Creek sweeping across lower canyon + 2 Weathered Timber Bridges
      b.water(7, 16, 36, 18);
      b.water(10, 15, 14, 16);
      b.water(24, 17, 29, 19);
      b.water(34, 15, 37, 17);
      b.bridge(12, 15, 14, 18); // West timber footbridge
      b.bridge(27, 16, 29, 19); // East timber footbridge

      // 3. North Ascending Cliff Gorge & Stone Stairway toward Upper Overlook (A04)
      b.carve(19, 2, 23, 6, 10);
      b.paintT(19, 6, 23, 7, 3); // broad weathered stone steps climbing into north pass
      // Terraced Central Ancient Stone Plaza flanked by carved weathered stone columns (19)
      b.paintT(16, 8, 26, 13, 1);
      b.wall(16, 8, 16, 8, 19); b.wall(26, 8, 26, 8, 19);
      b.wall(16, 13, 16, 13, 19); b.wall(26, 13, 26, 13, 19);
      b.paintT(19, 11, 20, 11, 15); // crumbled central masonry beside Pica's trap

      // 4. Collapsed Multi-Room Research Pavilion (NE, x:29..39, y:5..12) built with Mossy Ruin Walls (20)
      b.wall(29, 5, 39, 5, 20);
      b.wall(29, 6, 29, 11, 20);
      b.wall(39, 6, 39, 10, 20);
      b.wall(34, 6, 34, 8, 20); // interior ruined partition wall separating vestibule & storage room
      b.wall(29, 12, 31, 12, 20);
      b.wall(36, 12, 38, 12, 20);
      b.paintT(30, 6, 38, 11, 1); // preserved flagstone pavilion floor
      b.paintT(32, 12, 35, 12, 15); // collapsed south doorway rubble (walkable entrance!)
      b.paintT(30, 10, 31, 11, 15);

      // 5. Natural Organic Dirt Trails & Lush Wildflower Verges connecting all 3 exits cleanly
      b.paintT(1, 12, 16, 14, 10);  // west entry trail from Stasis Breach
      b.paintT(20, 2, 22, 14, 10);  // north-south spine to Upper Shrine Trail
      b.paintT(26, 12, 42, 14, 10); // east canyon road toward Filter Basin Aqueduct
      b.paintT(13, 19, 28, 21, 10); // south meadow creekside path
      b.paintT(3, 9, 6, 11, 5);
      b.paintT(16, 19, 24, 22, 5);
      b.paintT(31, 20, 35, 21, 5);
      b.paintT(30, 14, 33, 15, 5);

      // Three geographically natural entrances:
      b.portal('A01', 1, 13, 'left', 'arch_west', 'STASIS BREACH TUNNEL', 'hatch', { assembly: 'archway' });
      b.portal('A04', 21, 2, 'up', 'trail_passage', 'UPPER SHRINE TRAIL', 'hatch', { frame: false, assembly: 'trail_exit' });
      b.portal('A03', 42, 13, 'right', 'arch_east', 'FILTER BASIN AQUEDUCT', 'bulkhead', { assembly: 'archway' });

      // Explicit semantic anchors
      b.anchors.start = [5, 13, 'right'];
      b.anchors.npcs = [[21, 10]]; // Pica trapped in the central mossy ruin plaza
      b.anchors.save = [14, 10];   // Save Beacon beside the waterfall terrace
      b.anchors.crate = [36, 7];   // Supply Cache tucked inside the Collapsed Research Pavilion's east room
      b.anchors.ambient = [19, 20]; // Field Record in the south wildflower clearing across the bridges
      b.anchors.sceneById = {
        'SC-005': [10, 12],
        'SC-006': [24, 10]
      };
      b.anchors.scenes = [[32, 8], [18, 10], [26, 11]];
      b.anchors.battles = [[31, 20], [16, 20]]; // Filter Crawler patrolling south creek bank
      b.anchors.puzzles = [[31, 7], [23, 11], [15, 21], [37, 11]];
      b.lightShafts.push({ x: 8, y: 0, w: 4, h: 10, color: '#c4ffb0', alpha: 0.14 });
      b.lightShafts.push({ x: 19, y: 0, w: 4, h: 10, color: '#fff0a8', alpha: 0.13 });
      b.lightShafts.push({ x: 32, y: 3, w: 4, h: 9, color: '#d8ffb8', alpha: 0.10 });
      b.lamps.push(
        { x: 5, y: 13, r: 105, color: '#82e896', flicker: false },
        { x: 14, y: 10, r: 115, color: '#72dce8', flicker: false },
        { x: 21, y: 10, r: 140, color: '#c2f59a', flicker: false },
        { x: 35, y: 8, r: 115, color: '#f2bd75', flicker: true },
        { x: 20, y: 20, r: 110, color: '#82e896', flicker: false },
        { x: 40, y: 13, r: 95, color: '#72dce8', flicker: false }
      );
      break;
    }

    case 'A03': {
      // Filter Basin (32x18) — Dual Settling Waterworks, Elevated Catwalks & Boss Control Deck
      b.carve(1, 6, 5, 11, 1);
      partitionV(b, 6, 3, 14, 8, 2);
      b.carve(7, 3, 24, 14, 0);
      b.water(8, 4, 14, 6);
      b.water(17, 4, 23, 6);
      b.water(8, 12, 14, 13);
      b.waterfalls.push({ x: 10, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.78)' });
      b.waterfalls.push({ x: 19, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.78)' });
      b.paintT(7, 8, 24, 9, 1);
      b.bridge(15, 3, 16, 8);
      b.wall(18, 11, 19, 11, 17); // filtration control baffle for stealth cover
      b.wall(21, 11, 22, 11, 19);
      partitionV(b, 25, 3, 14, 8, 2);
      b.carve(26, 5, 30, 12, 1);
      b.wall(27, 4, 29, 4, 17);
      b.paintT(26, 8, 26, 9, 3);

      b.portal('A02', 1, 8, 'left', 'arch_west', 'ROOTWAY AQUEDUCT', 'bulkhead', { assembly: 'archway' });
      b.portal('A05', 30, 8, 'right', 'airlock_east', 'RELAY COURT BULKHEAD', 'bulkhead', { assembly: 'airlock' });

      b.anchors.start = [3, 8, 'right'];
      b.anchors.save = [15, 3];
      b.anchors.ambient = [16, 13];
      b.anchors.battles = [[20, 13], [11, 10]];
      b.anchors.scenes = [[12, 8], [21, 8], [28, 7], [28, 10]];
      b.anchors.puzzles = [[16, 11], [23, 12], [9, 10], [27, 11]];
      b.anchors.drone = { start: [17, 8], zone: [15, 7, 24, 14], waypoints: [[17, 8], [23, 8], [23, 13], [17, 13]] };
      b.lightShafts.push({ x: 14, y: 1, w: 4, h: 8, color: '#7ce8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 4, y: 8, r: 95, color: '#72dce8', flicker: false },
        { x: 16, y: 8, r: 125, color: '#72dce8', flicker: true },
        { x: 28, y: 8, r: 105, color: '#f2bd75', flicker: false }
      );
      break;
    }

    case 'A04': {
      // Upper Rootway Overlook (24x16) — Semicircular Forest Cliff Clearing & Ruined Shrine
      b.wall(0, 0, w - 1, 2, 13);
      b.wall(0, 2, 2, h - 1, 12);
      b.wall(w - 3, 2, w - 1, h - 1, 13);
      b.wall(0, h - 3, w - 1, h - 1, 12);
      b.carve(4, 3, 19, 12, 0);
      b.carve(3, 5, 20, 11, 0);
      b.carve(10, 11, 13, 13, 10);
      b.wall(3, 3, 4, 4, 13); b.wall(19, 3, 20, 4, 13);
      b.wall(8, 3, 8, 4, 20); b.wall(15, 3, 15, 4, 20); // ancient mossy shrine colonnade
      b.paintT(9, 4, 14, 7, 1);
      b.paintT(11, 8, 12, 8, 3);
      b.paintT(5, 5, 7, 10, 5);
      b.paintT(16, 5, 18, 10, 5);
      b.paintT(10, 9, 13, 13, 10);
      b.paintT(5, 4, 6, 4, 15);
      b.portal('A02', 11, 13, 'down', 'trail_passage', 'ROOTWAY DESCENT', 'hatch', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [11, 11, 'up'];
      b.anchors.save = [13, 5];
      b.anchors.crate = [5, 8];
      b.anchors.sidequests = [[11, 5], [13, 6]];
      b.anchors.ambient = [17, 8];
      b.anchors.scenes = [[10, 6], [14, 6]];
      b.anchors.puzzles = [[7, 10], [16, 10], [6, 6], [17, 6]];
      b.anchors.battles = [[15, 10], [8, 10]];
      b.lightShafts.push({ x: 10, y: 0, w: 4, h: 8, color: '#ffe8a8', alpha: 0.16 });
      b.lamps.push(
        { x: 11, y: 5, r: 125, color: '#f2bd75', flicker: false },
        { x: 6, y: 8, r: 90, color: '#9cf5a8', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 2 — RELAY COURT (Communications Hub, Mail Vault, Under-Conduit & Quay)
    // =========================================================================
    case 'A05': {
      // Relay Court Main Hall (34x20) — Multi-Wing Communications Hub & Shutter Gallery
      b.carve(1, 7, 5, 12, 1);
      partitionV(b, 6, 3, 16, 8, 3);
      b.carve(7, 3, 26, 16, 0);
      // North raised Relay Command Gallery (where Rill is trapped behind shutters)
      b.wall(7, 6, 12, 6, 0); b.wall(21, 6, 26, 6, 0);
      b.wall(9, 2, 13, 2, 17); b.wall(20, 2, 24, 2, 17);
      b.paintT(8, 3, 25, 5, 1);
      b.paintT(15, 6, 18, 6, 3);
      b.paintT(11, 7, 11, 16, 6);
      b.paintT(22, 7, 22, 16, 6);
      // Tactical server baffle pillars in stealth wing
      b.wall(16, 9, 17, 9, 17);
      b.wall(16, 13, 17, 13, 17);
      b.wall(20, 11, 20, 11, 19);
      partitionV(b, 27, 3, 16, 8, 3);
      b.carve(28, 7, 32, 12, 1);
      b.carve(14, 16, 19, 17, 1);
      b.paintT(15, 16, 18, 16, 3);

      b.portal('A03', 1, 9, 'left', 'airlock_west', 'FILTER BASIN LOCK', 'bulkhead', { assembly: 'airlock' });
      b.portal('A06', 32, 9, 'right', 'airlock_east', 'MAIL VAULT LOCK', 'bulkhead', { assembly: 'airlock' });
      b.portal('A07', 16, 17, 'down', 'south_threshold', 'LOWER CONDUIT STAIRS', 'bulkhead', { assembly: 'archway' });

      b.anchors.start = [4, 9, 'right'];
      b.anchors.npcs = [[16, 4]]; // Rill in north Relay Command Gallery
      b.anchors.save = [9, 4];
      b.anchors.ambient = [24, 4];
      b.anchors.scenes = [[13, 9], [19, 9], [13, 13], [24, 9]];
      b.anchors.puzzles = [[10, 14], [24, 14], [19, 14], [9, 11]];
      b.anchors.battles = [[23, 12], [10, 12]];
      b.anchors.drone = { start: [23, 8], zone: [15, 7, 26, 15], waypoints: [[23, 8], [25, 14], [15, 14], [15, 8]] };
      b.lightShafts.push({ x: 15, y: 1, w: 4, h: 9, color: '#9cd8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 16, y: 4, r: 130, color: '#92d6ea', flicker: false },
        { x: 16, y: 12, r: 115, color: '#92d6ea', flicker: false },
        { x: 30, y: 9, r: 95, color: '#f2bd75', flicker: false }
      );
      break;
    }

    case 'A06': {
      // Mail Vault (30x18) — Partitioned Multi-Room Sorting Facility & Clerk's Archive
      b.carve(1, 6, 7, 12, 1);
      partitionV(b, 8, 3, 14, 8, 2);
      b.carve(9, 3, 22, 14, 0);
      b.paintT(11, 8, 20, 12, 14);
      partitionH(b, 6, 9, 22, 14, 3); // North Clerk's Vault
      b.wall(10, 2, 13, 2, 18); b.wall(18, 2, 21, 2, 18); // tall mail sorting racks!
      b.wall(10, 14, 12, 14, 18); b.wall(19, 14, 21, 14, 18);
      b.paintT(10, 3, 21, 5, 1);
      partitionV(b, 23, 3, 14, 8, 2);
      b.carve(24, 6, 28, 12, 1);

      b.portal('A05', 1, 9, 'left', 'airlock_west', 'RELAY COURT', 'bulkhead', { assembly: 'airlock' });
      b.portal('A08', 28, 9, 'right', 'airlock_east', 'FLOODED QUAY LOCK', 'bulkhead', { assembly: 'airlock' });

      b.anchors.start = [4, 9, 'right'];
      b.anchors.save = [15, 4];
      b.anchors.crate = [11, 4];
      b.anchors.ambient = [20, 4];
      b.anchors.sidequests = [[18, 4], [12, 5]];
      b.anchors.battles = [[15, 12], [19, 11]];
      b.anchors.scenes = [[12, 9], [17, 9], [20, 9]];
      b.anchors.puzzles = [[13, 13], [17, 13], [11, 11], [25, 11]];
      b.lightShafts.push({ x: 14, y: 1, w: 3, h: 7, color: '#ffd898', alpha: 0.10 });
      b.lamps.push(
        { x: 4, y: 9, r: 95, color: '#f2bd75', flicker: false },
        { x: 15, y: 9, r: 125, color: '#f2bd75', flicker: false },
        { x: 26, y: 9, r: 95, color: '#72dce8', flicker: true }
      );
      break;
    }

    case 'A07': {
      // Lower Relay Conduit (26x16) — Z-Bend Underground Service Bypass
      b.carve(3, 2, 10, 6, 1);
      b.paintT(5, 3, 8, 3, 3);
      b.carve(5, 6, 9, 12, 0);
      b.paintT(7, 5, 7, 12, 6);
      b.carve(10, 7, 19, 13, 0);
      b.water(12, 12, 17, 13);
      b.paintT(10, 8, 19, 10, 1);
      b.wall(12, 6, 16, 6, 17);
      partitionV(b, 20, 7, 13, 9, 2);
      b.carve(21, 8, 24, 11, 1);

      b.portal('A05', 6, 2, 'up', 'service', 'RELAY COURT STAIRS', 'bulkhead', { assembly: 'airlock' });
      b.portal('A09', 24, 9, 'right', 'airlock_east', 'LANTERN SHELF APPROACH', 'bulkhead', { assembly: 'airlock' });

      b.anchors.start = [6, 4, 'down'];
      b.anchors.save = [14, 8];
      b.anchors.ambient = [18, 11];
      b.anchors.scenes = [[12, 9], [16, 9]];
      b.anchors.puzzles = [[11, 11], [17, 9], [8, 10], [15, 10]];
      b.anchors.battles = [[14, 10], [18, 9]];
      b.lamps.push(
        { x: 6, y: 4, r: 95, color: '#92d6ea', flicker: false },
        { x: 14, y: 9, r: 120, color: '#72dce8', flicker: true },
        { x: 22, y: 9, r: 95, color: '#f8cb7c', flicker: false }
      );
      break;
    }

    case 'A08': {
      // Flooded Quay (32x18) — L-Shaped Harbor Wharf, Timber Piers & East Water-Lock Gatehouse
      b.water(2, 10, w - 3, h - 3);
      b.water(18, 6, w - 3, h - 3);
      b.waterfalls.push({ x: 21, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.76)' });
      b.carve(1, 3, 17, 9, 1);
      b.carve(1, 9, 9, 14, 1);
      b.wall(4, 2, 7, 2, 18); // harbor cargo racks
      b.wall(11, 2, 14, 2, 17);
      b.bridge(17, 6, 25, 8);
      b.bridge(9, 12, 21, 13);
      b.bridge(21, 8, 22, 12);
      b.building(25, 2, 30, 5, 3);
      b.carve(25, 6, 30, 10, 1);

      b.portal('A06', 1, 6, 'left', 'airlock_west', 'MAIL VAULT DOCK', 'bulkhead', { assembly: 'airlock' });
      b.portal('A09', 30, 7, 'right', 'arch_east', 'LANTERN WATER-LOCK', 'bulkhead', { assembly: 'archway' });

      b.anchors.start = [3, 6, 'right'];
      b.anchors.save = [5, 13];
      b.anchors.ambient = [7, 11];
      b.anchors.battles = [[13, 6], [14, 12]];
      b.anchors.scenes = [[21, 7], [15, 7], [27, 8]];
      b.anchors.puzzles = [[8, 5], [11, 8], [26, 9], [16, 12]];
      b.lightShafts.push({ x: 12, y: 1, w: 3, h: 8, color: '#7ce8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 6, y: 6, r: 105, color: '#72dce8', flicker: false },
        { x: 20, y: 7, r: 120, color: '#72dce8', flicker: true },
        { x: 27, y: 7, r: 110, color: '#f8cb7c', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 3 — LANTERN SHELF (Substantial Multi-Building Cliffside Settlement)
    // =========================================================================
    case 'A09': {
      // Lantern Shelf Commons (40x24) — 5-Building Cliffside Settlement, Cobbled Streets & Hearth Square
      b.wall(0, 0, w - 1, 1, 12);
      b.wall(0, h - 2, w - 1, h - 2, 4); // scenic canyon cliff parapet south
      b.carve(1, 3, 38, 21, 0);
      b.carve(18, 2, 21, 5, 1);   // north avenue climbing to Upper Terrace (A11)
      b.carve(18, 19, 21, 21, 10); // south switchback trail to Ravine (A14)

      // 5 Distinct Roofed Settlement Buildings forming real streets & alleys!
      b.building(3, 2, 11, 6, 3);   // Building 1 (NW): Noll's Lantern Workshop
      b.building(25, 2, 34, 6, 3);  // Building 2 (NE): Archive Liaison Office & Supply Depot
      b.building(3, 16, 10, 20, 3); // Building 3 (SW): Communal Shelter House
      b.building(28, 15, 36, 19, 3); // Building 4 (SE): Lantern Canteen & Bunkhouse
      b.building(12, 17, 15, 20, 2); // Building 5 (South): Watchtower Kiosk

      // Cobbled village avenues, terraced stairs & warm central hearth plaza
      b.paintT(1, 8, 38, 12, 1);
      b.paintT(18, 2, 21, 21, 1);
      b.paintT(18, 3, 21, 4, 3);    // stone steps ascending to A11
      b.paintT(14, 9, 25, 14, 14);  // central communal hearth square
      b.paintT(12, 7, 16, 7, 5);
      b.paintT(23, 15, 26, 18, 5);
      b.paintT(3, 13, 6, 15, 5);

      b.portal('A08', 1, 9, 'left', 'arch_west', 'FLOODED QUAY GATE', 'bulkhead', { assembly: 'archway' });
      b.portal('A07', 1, 14, 'left', 'arch_west', 'LOWER CONDUIT TUNNEL', 'bulkhead', { assembly: 'archway' });
      b.portal('A11', 19, 2, 'up', 'trail_passage', 'UPPER TERRACE LANE', 'bulkhead', { frame: false, assembly: 'trail_exit' });
      b.portal('A10', 38, 10, 'right', 'airlock_east', 'AIR-EXCHANGE PLANT', 'bulkhead', { assembly: 'airlock' });
      b.portal('A14', 19, 21, 'down', 'trail_passage', 'RAVINE SWITCHBACK', 'hatch', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [5, 10, 'right'];
      b.anchors.npcs = [[19, 10], [8, 7], [29, 7]]; // Ves in hearth square, Noll outside workshop, Ilen by Archive Office
      b.anchors.bench = [11, 16]; // Rest bench beside Shelter House porch
      b.anchors.save = [23, 7];
      b.anchors.crate = [35, 13];
      b.anchors.ambient = [16, 16];
      b.anchors.scenes = [[16, 11], [22, 11], [19, 13], [26, 10], [15, 8], [24, 13]];
      b.anchors.sidequests = [[4, 7], [11, 7], [26, 7], [33, 7], [13, 13], [25, 16], [30, 20], [8, 14]];
      b.anchors.puzzles = [[16, 18], [23, 19], [34, 8], [13, 10]];
      b.anchors.battles = [[34, 12], [27, 13]];
      b.lightShafts.push({ x: 17, y: 0, w: 5, h: 10, color: '#ffdf96', alpha: 0.13 });
      b.lamps.push(
        { x: 8, y: 7, r: 125, color: '#f8cb7c', flicker: true },
        { x: 19, y: 11, r: 155, color: '#ffd480', flicker: false },
        { x: 29, y: 7, r: 125, color: '#f8cb7c', flicker: true },
        { x: 11, y: 16, r: 110, color: '#f8cb7c', flicker: false },
        { x: 32, y: 20, r: 115, color: '#f8cb7c', flicker: false },
        { x: 36, y: 10, r: 100, color: '#72dce8', flicker: false }
      );
      break;
    }

    case 'A10': {
      // Shelf Air-Exchange Plant (30x18) — Twin Turbine Bays & Elevated Boss Deck
      b.carve(1, 7, 5, 10, 1);
      partitionV(b, 6, 3, 14, 8, 2);
      b.carve(7, 3, 22, 14, 0);
      b.wall(9, 4, 11, 5, 17); b.wall(18, 4, 20, 5, 17); // turbine control housings
      b.wall(9, 12, 11, 13, 19); b.wall(18, 12, 20, 13, 19);
      b.paintT(12, 6, 17, 11, 14);
      b.paintT(7, 8, 22, 9, 1);
      b.paintT(14, 3, 15, 14, 6);
      partitionV(b, 23, 3, 14, 8, 2);
      b.carve(24, 6, 28, 11, 1);
      b.paintT(24, 8, 28, 9, 11);

      b.portal('A09', 1, 8, 'left', 'airlock_west', 'LANTERN COMMONS', 'bulkhead', { assembly: 'airlock' });
      b.portal('A12', 28, 8, 'right', 'rail_gantry', 'SKY-RAIL GANTRY', 'exit', { assembly: 'rail_gantry' });

      b.anchors.start = [3, 8, 'right'];
      b.anchors.save = [8, 3];
      b.anchors.ambient = [21, 3];
      b.anchors.scenes = [[14, 8], [16, 8]];
      b.anchors.battles = [[15, 13], [13, 13]];
      b.anchors.puzzles = [[12, 4], [17, 4], [25, 10], [8, 11]];
      b.lightShafts.push({ x: 13, y: 1, w: 4, h: 8, color: '#ffd488', alpha: 0.11 });
      b.lamps.push(
        { x: 4, y: 8, r: 95, color: '#f8cb7c', flicker: false },
        { x: 15, y: 8, r: 135, color: '#f8cb7c', flicker: false },
        { x: 26, y: 8, r: 100, color: '#92d6ea', flicker: true }
      );
      break;
    }

    case 'A11': {
      // Upper Lantern Terrace (26x16) — Quiet Cliffside Residential Street with Two Homes
      b.wall(0, 0, w - 1, 2, 12);
      b.carve(2, 4, 23, 13, 0);
      b.building(3, 2, 10, 5, 3);
      b.building(15, 2, 22, 5, 3);
      b.wall(2, 11, 6, 13, 12); b.wall(19, 11, 23, 13, 12);
      b.paintT(3, 6, 22, 9, 1);
      b.paintT(11, 4, 14, 13, 1);
      b.paintT(12, 11, 13, 11, 3);
      b.paintT(4, 10, 8, 10, 5); b.paintT(17, 10, 21, 10, 5);
      b.portal('A09', 12, 13, 'down', 'trail_passage', 'LANTERN COMMONS STEPS', 'bulkhead', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [12, 11, 'up'];
      b.anchors.save = [13, 5];
      b.anchors.sidequests = [[6, 6], [19, 6], [9, 6]];
      b.anchors.ambient = [12, 4];
      b.anchors.scenes = [[10, 7], [15, 7]];
      b.anchors.puzzles = [[8, 9], [17, 9], [5, 8], [20, 8]];
      b.anchors.battles = [[16, 10], [9, 10]];
      b.lightShafts.push({ x: 11, y: 0, w: 4, h: 8, color: '#ffe29c', alpha: 0.13 });
      b.lamps.push(
        { x: 6, y: 6, r: 110, color: '#f8cb7c', flicker: true },
        { x: 19, y: 6, r: 110, color: '#f8cb7c', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 4 — BROKEN SKY-RAIL (Cantilevered Viaduct, Switchyard & Under-Ravine)
    // =========================================================================
    case 'A12': {
      // Broken Sky-Rail Viaduct (40x18) — Expansive Open-Air Railway Span Over Canyon Sky!
      b.carve(1, 6, 38, 12, 0);
      // Two viaduct structures: West Signal Box Cabin + East Switchman's Shed
      b.building(9, 2, 16, 6, 3);
      b.building(27, 2, 33, 6, 3);
      // Continuous twin railway tracks running east-west across the full viaduct
      b.paintT(1, 8, 38, 9, 11);
      b.paintT(1, 7, 38, 7, 1);   // north service walkway
      b.paintT(1, 10, 38, 12, 1); // south maintenance deck
      b.wall(1, 13, 38, 13, 4);   // cantilevered canyon safety guardrail
      // South emergency stair tower descending to Ravine Under-Deck (A14)
      b.carve(19, 12, 21, 15, 1);
      b.paintT(20, 13, 20, 14, 3);
      b.paintT(24, 11, 26, 11, 15);
      b.wall(22, 6, 23, 6, 17); // mid-span signal relay panel

      b.portal('A10', 1, 8, 'left', 'rail_gantry', 'AIR-EXCHANGE GANTRY', 'exit', { frame: false, assembly: 'rail_gantry' });
      b.portal('A13', 38, 8, 'right', 'rail_gantry', 'SWITCHYARD TRACK', 'exit', { frame: false, assembly: 'rail_gantry' });
      b.portal('A14', 20, 15, 'down', 'south_threshold', 'RAVINE LADDER', 'hatch', { assembly: 'archway' });

      b.anchors.start = [4, 7, 'right'];
      b.anchors.save = [7, 6];
      b.anchors.crate = [35, 6];
      b.anchors.ambient = [18, 6];
      b.anchors.sidequests = [[12, 7], [30, 7]];
      b.anchors.battles = [[28, 11], [15, 11]];
      b.anchors.scenes = [[10, 10], [25, 7], [32, 10]];
      b.anchors.puzzles = [[17, 11], [23, 7], [34, 11], [7, 11]];
      b.anchors.drone = { start: [24, 7], zone: [21, 6, 36, 12], waypoints: [[24, 7], [35, 7], [35, 11], [24, 11]] };
      b.lightShafts.push({ x: 5, y: 0, w: 4, h: 9, color: '#ffe5a8', alpha: 0.14 });
      b.lightShafts.push({ x: 20, y: 0, w: 4, h: 9, color: '#ffe5a8', alpha: 0.13 });
      b.lamps.push(
        { x: 5, y: 7, r: 100, color: '#92d6ea', flicker: false },
        { x: 13, y: 7, r: 115, color: '#f8cb7c', flicker: true },
        { x: 30, y: 7, r: 115, color: '#92d6ea', flicker: false }
      );
      break;
    }

    case 'A13': {
      // Switchyard Overpass (30x16) — Y-Split Railway Yard, Signal Tower & Wetland Descent
      b.carve(1, 5, 28, 11, 0);
      b.carve(16, 4, 28, 12, 0);
      b.building(6, 2, 12, 5, 2);
      b.wall(1, 12, 18, 12, 4);
      b.wall(19, 13, 28, 13, 12);
      b.paintT(1, 7, 15, 7, 11);
      b.paintT(15, 6, 23, 6, 11);
      b.paintT(15, 10, 23, 10, 11);
      b.paintT(24, 7, 28, 10, 10);
      b.paintT(25, 8, 26, 9, 3);

      b.portal('A12', 1, 7, 'left', 'rail_gantry', 'SKY-RAIL VIADUCT', 'exit', { frame: false, assembly: 'rail_gantry' });
      b.portal('A15', 28, 8, 'right', 'trail_passage', 'WETLAND DESCENT TRAIL', 'exit', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [4, 7, 'right'];
      b.anchors.bench = [9, 6];
      b.anchors.save = [13, 5];
      b.anchors.ambient = [14, 10];
      b.anchors.sidequests = [[15, 5], [11, 10]];
      b.anchors.scenes = [[18, 8], [21, 8], [23, 8], [19, 11]];
      b.anchors.puzzles = [[17, 5], [22, 5], [16, 11], [23, 11]];
      b.anchors.battles = [[20, 7], [20, 11]];
      b.lightShafts.push({ x: 15, y: 0, w: 5, h: 10, color: '#ffe8b0', alpha: 0.15 });
      b.lamps.push(
        { x: 9, y: 6, r: 110, color: '#ffe2a8', flicker: false },
        { x: 20, y: 8, r: 130, color: '#ffe2a8', flicker: false }
      );
      break;
    }

    case 'A14': {
      // Ravine Under-Deck (26x16) — Eroded Canyon Floor Beneath the Viaduct
      b.wall(0, 0, w - 1, 2, 12);
      b.wall(0, h - 3, w - 1, h - 1, 12);
      b.wall(0, 2, 1, h - 3, 12);
      b.wall(w - 2, 2, w - 1, h - 3, 12);
      b.carve(2, 4, 23, 12, 0);
      b.carve(4, 2, 8, 4, 10);
      b.carve(17, 2, 21, 4, 1);
      b.wall(11, 6, 13, 8, 12);
      b.paintT(5, 2, 7, 10, 10);
      b.paintT(6, 10, 19, 11, 10);
      b.paintT(18, 3, 20, 10, 10);
      b.paintT(15, 5, 16, 6, 15);
      b.paintT(3, 11, 5, 12, 5);

      b.portal('A09', 6, 2, 'up', 'trail_passage', 'LANTERN SWITCHBACK', 'hatch', { frame: false, assembly: 'trail_exit' });
      b.portal('A12', 19, 2, 'up', 'roof_hatch', 'SKY-RAIL LADDER', 'hatch', { assembly: 'elevator' });

      b.anchors.start = [6, 5, 'down'];
      b.anchors.save = [12, 10];
      b.anchors.ambient = [16, 9];
      b.anchors.scenes = [[9, 8], [16, 7]];
      b.anchors.puzzles = [[4, 8], [21, 9], [10, 11], [15, 11]];
      b.anchors.battles = [[14, 10], [8, 9]];
      b.lamps.push(
        { x: 6, y: 4, r: 95, color: '#f2bd75', flicker: false },
        { x: 19, y: 4, r: 95, color: '#92d6ea', flicker: true }
      );
      break;
    }

    // =========================================================================
    // ACT 5 — SURVEY WETLAND (Organic Coastal Marsh, Outpost & Boardwalk Network)
    // =========================================================================
    case 'A15': {
      // BENCHMARK #3: A15 Survey Wetland (46x28) — Expansive Marsh, Twin-Building Outpost & Raised Boardwalks
      // Fill basin with deep marsh water (2), north mossy cliffs (12) & dense cypress reed banks (13)
      b.water(0, 2, w - 1, h - 1);
      b.wall(0, 0, w - 1, 2, 12);         // north mossy limestone crags
      b.wall(0, h - 2, 12, h - 1, 13);    // SW reed & cypress bank
      b.wall(28, h - 2, w - 1, h - 1, 13); // SE reed bank
      b.wall(0, 3, 2, 7, 13);
      b.wall(42, 3, w - 1, 8, 13);
      b.wall(15, 22, 17, 25, 13);         // southern marsh reed islet

      // Three cascading waterfalls feeding the wetland lagoon
      b.waterfalls.push({ x: 16, y: 1, w: 2, h: 3, color: 'rgba(70,214,208,0.82)' });
      b.waterfalls.push({ x: 27, y: 1, w: 2, h: 3, color: 'rgba(70,214,208,0.80)' });
      b.waterfalls.push({ x: 37, y: 1, w: 2, h: 3, color: 'rgba(70,214,208,0.78)' });

      // 1. West Mountain Descent Landing (arriving from A13 Switchyard Ramp)
      b.carve(1, 11, 9, 17, 10);
      b.water(8, 16, 9, 17); // organic eroded shoreline
      b.paintT(2, 11, 6, 12, 5);
      b.paintT(2, 16, 6, 17, 5);

      // 2. North-West Timber Survey Outpost Compound on pilings (2 real roofed buildings + dock!)
      b.carve(4, 6, 15, 10, 0);
      b.building(4, 2, 10, 5, 3);  // Main Survey Outpost Station (illuminated windows)
      b.building(12, 3, 15, 5, 2); // Timber Equipment & Sample Shed
      b.paintT(5, 6, 14, 9, 1);
      b.bridge(6, 10, 7, 11);      // timber stairs/walkway connecting Outpost down to West Landing

      // 3. Dual Timber Boardwalks crossing the Western Marsh Channel to the Central Survey Island
      b.bridge(9, 13, 16, 15);
      b.bridge(14, 8, 18, 9);      // upper outpost boardwalk directly into north side of island

      // 4. Broad Organic Central Vegetated Survey Island (x:16..31, y:7..19)
      b.carve(16, 8, 30, 18, 0);
      b.carve(18, 7, 29, 19, 0);
      // Erode corners so shoreline looks truly organic & natural
      b.water(16, 8, 17, 8); b.water(16, 17, 17, 18);
      b.water(29, 8, 30, 9); b.water(29, 17, 30, 18);
      b.paintT(18, 11, 28, 15, 10);
      b.paintT(18, 8, 20, 10, 5);
      b.paintT(26, 9, 28, 11, 5);
      b.paintT(19, 16, 22, 18, 5);
      b.paintT(25, 16, 28, 18, 5);
      b.wall(20, 9, 21, 9, 20); // ancient mossy survey cairn marker on island

      // 5. North Waterfall Dam & Highland Ridge Trail climbing to A17
      b.carve(22, 2, 25, 7, 10);
      b.paintT(22, 5, 25, 6, 3); // stone steps climbing past twin waterfalls

      // 6. South Survey Observation Pier Loop & SE Mossy Hummock Islet
      b.bridge(22, 19, 24, 23);
      b.bridge(24, 22, 32, 23);
      b.carve(32, 19, 37, 24, 0); // SE mossy hummock islet
      b.water(37, 19, 37, 20); b.water(32, 24, 33, 24);
      b.paintT(33, 20, 36, 23, 5);
      b.bridge(35, 15, 36, 19);   // cross-pier linking SE islet back up to main East Causeway!

      // 7. Long Raised East Timber Causeway spanning the Eastern Lagoon to A16 Floodgate Pier
      b.bridge(30, 12, 44, 14);

      // Three 100% natural outdoor exits extending cleanly off-map (ZERO floating doors!):
      b.portal('A13', 1, 14, 'left', 'trail_passage', 'SWITCHYARD RAMP', 'hatch', { frame: false, assembly: 'trail_exit' });
      b.portal('A17', 23, 2, 'up', 'trail_passage', 'HIGHLAND RIDGE TRAIL', 'hatch', { frame: false, assembly: 'trail_exit' });
      b.portal('A16', 44, 13, 'right', 'bridge_passage', 'FLOODGATE BOARDWALK', 'bulkhead', { frame: false, assembly: 'bridge_exit' });

      // Explicit semantic anchors
      b.anchors.start = [5, 14, 'right'];
      b.anchors.npcs = [[23, 13]]; // Miya greeting party at Central Survey Island camp
      b.anchors.save = [8, 7];     // Save Terminal right on the Survey Outpost Station porch
      b.anchors.crate = [35, 21];  // Supply Cache tucked on the SE Mossy Hummock Islet
      b.anchors.ambient = [12, 7]; // Field Record outside the Equipment Shed
      b.anchors.sidequests = [[23, 22], [33, 22], [11, 9]]; // SQ-10 beacon on South Observation Pier
      b.anchors.scenes = [[21, 14], [25, 14], [19, 12]];
      b.anchors.puzzles = [[26, 12], [20, 16], [34, 22], [7, 12]];
      b.anchors.battles = [[27, 16], [33, 20]];
      b.lightShafts.push({ x: 20, y: 0, w: 5, h: 11, color: '#9cf5c8', alpha: 0.13 });
      b.lightShafts.push({ x: 6, y: 0, w: 4, h: 8, color: '#ffe5a8', alpha: 0.11 });
      b.lamps.push(
        { x: 8, y: 7, r: 120, color: '#f8cb7c', flicker: true },
        { x: 23, y: 13, r: 150, color: '#82e896', flicker: false },
        { x: 23, y: 22, r: 105, color: '#72dce8', flicker: false },
        { x: 35, y: 21, r: 105, color: '#72dce8', flicker: false },
        { x: 40, y: 13, r: 105, color: '#82e896', flicker: false }
      );
      break;
    }

    case 'A16': {
      // Floodgate Pier & Pump Station (34x18) — Marsh Causeway, Hydro-Pump House & Archive Cliff
      b.water(0, 2, w - 1, h - 1);
      b.wall(0, 0, w - 1, 2, 12);
      b.wall(w - 3, 2, w - 1, h - 1, 12);
      b.waterfalls.push({ x: 10, y: 1, w: 2, h: 3, color: 'rgba(64,204,218,0.78)' });
      b.waterfalls.push({ x: 22, y: 1, w: 2, h: 3, color: 'rgba(64,204,218,0.78)' });
      b.bridge(1, 8, 8, 9);
      b.carve(9, 4, 20, 14, 1);
      b.building(11, 2, 18, 5, 3);
      b.bridge(21, 7, 28, 10);
      b.carve(28, 6, 31, 11, 1);

      b.portal('A15', 1, 8, 'left', 'bridge_passage', 'SURVEY WETLAND PIER', 'bulkhead', { frame: false, assembly: 'bridge_exit' });
      b.portal('A18', 31, 8, 'right', 'arch_east', 'CENSUS ARCHIVE SEAL', 'exit', { assembly: 'archway' });

      b.anchors.start = [4, 8, 'right'];
      b.anchors.save = [14, 6];
      b.anchors.ambient = [17, 6];
      b.anchors.battles = [[13, 12], [18, 12]];
      b.anchors.scenes = [[24, 8], [16, 9], [29, 9]];
      b.anchors.puzzles = [[11, 9], [19, 9], [15, 13], [26, 9]];
      b.lightShafts.push({ x: 14, y: 0, w: 4, h: 9, color: '#72dce8', alpha: 0.12 });
      b.lamps.push(
        { x: 14, y: 6, r: 125, color: '#72dce8', flicker: false },
        { x: 29, y: 8, r: 115, color: '#98bfff', flicker: false }
      );
      break;
    }

    case 'A17': {
      // Highland Survey Ridge (26x16) — Crescent Cliffside Camp Overlooking Dawn Sky
      b.carve(3, 5, 22, 12, 0);
      b.carve(5, 4, 20, 13, 0);
      b.carve(11, 12, 14, 13, 10);
      b.wall(3, 4, 21, 4, 4);
      b.building(16, 5, 21, 8, 2);
      b.wall(2, 10, 4, 13, 12); b.wall(21, 11, 23, 13, 12);
      b.paintT(5, 6, 10, 10, 5);
      b.paintT(11, 6, 14, 13, 10);
      b.paintT(12, 11, 13, 11, 3);
      b.portal('A15', 12, 13, 'down', 'trail_passage', 'WETLAND DESCENT', 'hatch', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [12, 11, 'up'];
      b.anchors.bench = [18, 9];
      b.anchors.save = [15, 9];
      b.anchors.ambient = [6, 9];
      b.anchors.sidequests = [[7, 7], [9, 6]];
      b.anchors.scenes = [[12, 6], [14, 7], [10, 8], [14, 10], [8, 9]];
      b.anchors.puzzles = [[6, 6], [17, 11], [10, 10], [19, 10]];
      b.anchors.battles = [[9, 10], [16, 10]];
      b.lightShafts.push({ x: 9, y: 0, w: 5, h: 9, color: '#ffe8a8', alpha: 0.16 });
      b.lamps.push(
        { x: 18, y: 9, r: 120, color: '#ffe2a8', flicker: true },
        { x: 8, y: 7, r: 105, color: '#ffe2a8', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 6 — CENSUS ARCHIVE (Monumental Vaulted Library & Records Annex)
    // =========================================================================
    case 'A18': {
      // Census Archive Grand Nave (38x24) — Vaulted Library with 4 Partitioned Reading Stack Wings
      b.carve(1, 9, 6, 14, 1);
      partitionV(b, 7, 3, 20, 10, 3);
      b.carve(8, 3, 29, 20, 0);
      // 4 Partitioned Reading Stack Rooms lined with tall Archive Bookshelves (18)!
      partitionH(b, 8, 8, 14, 10, 3);
      partitionH(b, 15, 8, 14, 10, 3);
      partitionH(b, 8, 23, 29, 25, 3);
      partitionH(b, 15, 23, 29, 25, 3);
      b.wall(9, 2, 13, 2, 18); b.wall(24, 2, 28, 2, 18);
      b.wall(8, 20, 13, 20, 18); b.wall(24, 20, 29, 20, 18);
      b.wall(8, 4, 8, 6, 18); b.wall(29, 4, 29, 6, 18);
      b.wall(8, 17, 8, 19, 18); b.wall(29, 17, 29, 19, 18);
      // Carved stone columns (19) flanking the grand ceremonial index nave
      for (const py of [6, 11, 16]) {
        b.wall(15, py, 15, py, 19);
        b.wall(22, py, 22, py, 19);
      }
      b.paintT(16, 3, 21, 20, 14);
      b.paintT(15, 3, 15, 20, 6);
      b.paintT(22, 3, 22, 20, 6);
      b.paintT(17, 6, 20, 7, 3);
      partitionV(b, 30, 3, 20, 10, 3);
      b.carve(31, 9, 36, 14, 1);

      b.portal('A16', 1, 11, 'left', 'arch_west', 'FLOODGATE ARCH', 'exit', { assembly: 'archway' });
      b.portal('A19', 18, 3, 'up', 'archive_seal', 'SEALED RECORDS ANNEX', 'bulkhead', { assembly: 'archway' });
      b.portal('A20', 36, 11, 'right', 'arch_east', 'RETURN HAVEN ARCH', 'exit', { assembly: 'archway' });

      b.anchors.start = [4, 11, 'right'];
      b.anchors.npcs = [[18, 9]]; // Ilen blocking central census steps
      b.anchors.save = [11, 5];   // Save terminal inside NW Reading Room
      b.anchors.crate = [26, 18]; // Supply Cache inside SE Stack Wing
      b.anchors.ambient = [26, 5];
      b.anchors.battles = [[11, 18], [26, 6], [19, 18]];
      b.anchors.scenes = [[18, 11], [18, 14], [17, 12], [20, 12], [18, 17], [17, 15]];
      b.anchors.puzzles = [[12, 6], [25, 17], [10, 12], [27, 12]];
      b.lightShafts.push({ x: 17, y: 1, w: 4, h: 12, color: '#a8c8ff', alpha: 0.13 });
      b.lamps.push(
        { x: 11, y: 5, r: 105, color: '#f2bd75', flicker: false },
        { x: 18, y: 11, r: 155, color: '#98bfff', flicker: false },
        { x: 26, y: 18, r: 105, color: '#f2bd75', flicker: false }
      );
      break;
    }

    case 'A19': {
      // Sealed Records Annex (24x15) — Intimate Two-Chamber Archival Vault
      b.carve(9, 10, 14, 12, 1);
      partitionH(b, 9, 3, 20, 11, 2);
      b.carve(3, 3, 20, 8, 0);
      partitionV(b, 11, 3, 8, 5, 2);
      b.wall(4, 2, 9, 2, 18); b.wall(13, 2, 19, 2, 18);
      b.paintT(4, 4, 9, 7, 14);
      b.paintT(13, 4, 19, 7, 14);
      b.portal('A18', 11, 12, 'down', 'south_threshold', 'CENSUS NAVE', 'bulkhead', { assembly: 'archway' });

      b.anchors.start = [11, 10, 'up'];
      b.anchors.save = [8, 4];
      b.anchors.sidequests = [[6, 5], [16, 5], [18, 6]];
      b.anchors.ambient = [13, 10];
      b.anchors.scenes = [[7, 6], [15, 6]];
      b.anchors.puzzles = [[5, 7], [18, 7], [9, 6], [14, 4]];
      b.anchors.battles = [[15, 7], [6, 7]];
      b.lamps.push(
        { x: 6, y: 5, r: 105, color: '#f2bd75', flicker: false },
        { x: 16, y: 5, r: 105, color: '#f2bd75', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 7 — RETURN HAVEN & QUARANTINE SPINE
    // =========================================================================
    case 'A20': {
      // Return Haven Outpost (32x18) — Fortified Courtyard Shelter Before the Quarantine Gate
      b.wall(0, 0, w - 1, 2, 12);
      b.carve(1, 4, 30, 15, 0);
      b.building(4, 2, 14, 6, 3);  // Warm Bunkhouse & Aid Station
      b.building(18, 12, 25, 15, 2); // Supply Depot Shack
      b.wall(2, 13, 6, 15, 12);
      b.paintT(1, 7, 30, 10, 1);
      b.paintT(8, 8, 16, 12, 14);
      b.paintT(7, 13, 12, 14, 5);
      b.wall(27, 4, 30, 6, 0); b.wall(27, 11, 30, 14, 0);
      b.paintT(26, 7, 30, 10, 14);

      b.portal('A18', 1, 8, 'left', 'arch_west', 'CENSUS ARCHIVE', 'bulkhead', { assembly: 'archway' });
      b.portal('A21', 30, 9, 'right', 'airlock_east', 'QUARANTINE SPINE LOCK', 'bulkhead', { assembly: 'airlock' });

      b.anchors.start = [4, 8, 'right'];
      b.anchors.npcs = [[12, 8], [8, 7]]; // Ves & Talla in courtyard
      b.anchors.bench = [14, 7];
      b.anchors.save = [18, 6];
      b.anchors.crate = [22, 10];
      b.anchors.ambient = [16, 13];
      b.anchors.sidequests = [[10, 13], [24, 7]];
      b.anchors.scenes = [[12, 10], [20, 8]];
      b.anchors.puzzles = [[15, 11], [23, 6], [9, 11], [25, 9]];
      b.anchors.battles = [[24, 9], [17, 11]];
      b.lightShafts.push({ x: 10, y: 0, w: 4, h: 9, color: '#ffdf96', alpha: 0.13 });
      b.lamps.push(
        { x: 11, y: 8, r: 135, color: '#f8cb7c', flicker: false },
        { x: 27, y: 9, r: 105, color: '#f09238', flicker: true }
      );
      break;
    }

    case 'A21': {
      // Quarantine Spine (40x22) — Multi-Chamber Containment Wing with Lab, Staggered Baffles & Boss Deck
      // Chamber 1 (West Decon Entry & Intake Monitoring)
      b.carve(1, 5, 10, 17, 0);
      b.wall(3, 4, 8, 4, 17);
      b.paintT(2, 8, 9, 14, 14);
      // Bulkhead Partition 1 (upper offset choke)
      partitionV(b, 11, 3, 18, 6, 3);
      // Chamber 2 (Central Containment Hall + North Observation Lock + WARD-7 Monolith)
      b.carve(12, 3, 27, 18, 0);
      b.paintT(19, 3, 20, 18, 6);
      // Staggered security cover baffles & monitoring consoles
      b.wall(15, 8, 16, 11, 17);
      b.wall(23, 8, 24, 11, 17);
      b.wall(15, 15, 16, 15, 19); b.wall(23, 15, 24, 15, 19);
      b.paintT(12, 6, 27, 7, 1);
      b.paintT(12, 13, 27, 14, 1);
      // Bulkhead Partition 2 (lower offset choke)
      partitionV(b, 28, 3, 18, 13, 3);
      // Chamber 3 (East Inner Lock & Boss Containment Deck)
      b.carve(29, 5, 38, 17, 0);
      b.wall(31, 4, 36, 4, 17);
      b.paintT(30, 8, 37, 14, 14);

      b.portal('A20', 1, 11, 'left', 'airlock_west', 'RETURN HAVEN LOCK', 'bulkhead', { assembly: 'airlock' });
      b.portal('A22', 19, 3, 'up', 'quarantine_lock', 'OBSERVATION WING', 'bulkhead', { assembly: 'airlock' });
      b.portal('A23', 38, 11, 'right', 'airlock_east', 'CATHEDRAL ANTECHAMBER', 'bulkhead', { assembly: 'airlock' });

      b.anchors.start = [4, 11, 'right'];
      b.anchors.npcs = [[19, 10]]; // WARD-7 interface monolith in central containment hall
      b.anchors.save = [6, 6];
      b.anchors.crate = [35, 6];
      b.anchors.ambient = [31, 16];
      b.anchors.sidequests = [[6, 16], [14, 17]];
      b.anchors.battles = [[25, 16], [33, 15]];
      b.anchors.scenes = [[14, 6], [25, 6], [33, 9], [31, 13], [35, 13], [14, 13], [33, 7], [22, 13]];
      b.anchors.puzzles = [[17, 16], [22, 16], [8, 15], [31, 7]];
      b.anchors.drone = { start: [18, 13], zone: [12, 5, 27, 17], waypoints: [[18, 13], [26, 13], [26, 6], [13, 6]] };
      b.lightShafts.push({ x: 18, y: 1, w: 4, h: 10, color: '#ffad52', alpha: 0.11 });
      b.lamps.push(
        { x: 6, y: 11, r: 110, color: '#f09238', flicker: true },
        { x: 19, y: 10, r: 145, color: '#f09238', flicker: false },
        { x: 34, y: 11, r: 125, color: '#98bfff', flicker: false }
      );
      break;
    }

    case 'A22': {
      // Quarantine Observation Wing (24x15) — Glass-Windowed Viewing Gallery & Specimen Bay
      b.carve(9, 10, 14, 12, 1);
      partitionH(b, 9, 3, 20, 11, 2);
      b.carve(3, 3, 20, 8, 0);
      b.wall(11, 3, 11, 4, 9);
      b.wall(11, 7, 11, 8, 9);
      b.wall(4, 2, 8, 2, 17);
      b.wall(15, 2, 19, 2, 16); // cryo specimen pods!
      b.paintT(4, 4, 9, 7, 1);
      b.paintT(13, 4, 19, 7, 14);
      b.portal('A21', 11, 12, 'down', 'south_threshold', 'QUARANTINE SPINE', 'bulkhead', { assembly: 'airlock' });

      b.anchors.start = [11, 10, 'up'];
      b.anchors.save = [6, 4];
      b.anchors.ambient = [17, 5];
      b.anchors.scenes = [[8, 6], [15, 6]];
      b.anchors.puzzles = [[5, 7], [18, 7], [14, 4], [9, 5]];
      b.anchors.battles = [[16, 7], [7, 7]];
      b.lamps.push(
        { x: 6, y: 5, r: 105, color: '#72dce8', flicker: false },
        { x: 17, y: 5, r: 110, color: '#72dce8', flicker: true }
      );
      break;
    }

    case 'A23': {
      // Cathedral Antechamber (28x16) — Solemn Processional Bridge Over Coolant Chasms
      b.water(3, 3, 24, 5);
      b.water(3, 11, 24, 13);
      b.carve(1, 6, 26, 10, 1);
      // Monumental carved stone colonnade pillars along processional bridge
      for (const px of [7, 13, 19]) {
        b.wall(px, 6, px, 6, 19);
        b.wall(px, 10, px, 10, 19);
      }
      b.paintT(2, 8, 25, 8, 14);
      b.paintT(22, 7, 22, 9, 3);

      b.portal('A21', 1, 8, 'left', 'airlock_west', 'QUARANTINE SPINE', 'bulkhead', { assembly: 'airlock' });
      b.portal('A24', 26, 8, 'right', 'arch_east', 'CONTROL CATHEDRAL', 'bulkhead', { assembly: 'archway' });

      b.anchors.start = [4, 8, 'right'];
      b.anchors.save = [10, 7];
      b.anchors.ambient = [16, 9];
      b.anchors.scenes = [[14, 8], [18, 8]];
      b.anchors.puzzles = [[9, 9], [16, 7], [21, 7], [11, 9]];
      b.anchors.battles = [[15, 8], [20, 9]];
      b.lightShafts.push({ x: 12, y: 1, w: 4, h: 9, color: '#b4c8ff', alpha: 0.13 });
      b.lamps.push(
        { x: 5, y: 8, r: 100, color: '#98bfff', flicker: false },
        { x: 23, y: 8, r: 125, color: '#e2a8ff', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 8 — CONTROL CATHEDRAL (Monumental Cruciform Basilica & Sanctum)
    // =========================================================================
    case 'A24': {
      // BENCHMARK #4: A24 Control Cathedral (44x30) — Monumental Cruciform Sci-Fi Basilica
      // 1. West Narthex Portico (x:1..8, y:10..19)
      b.carve(1, 10, 8, 19, 1);
      b.wall(3, 10, 3, 10, 19); b.wall(3, 19, 3, 19, 19);
      b.wall(6, 10, 6, 10, 19); b.wall(6, 19, 6, 19, 19);
      b.paintT(1, 14, 8, 15, 14);
      // Grand Narthex Screen Wall dividing portico from the Basilica Nave
      partitionV(b, 9, 4, 25, 13, 4);

      // 2. Grand Central Nave, Side Cloister Aisles & Cruciform Transepts (x:10..33, y:4..25)
      b.carve(10, 4, 33, 25, 0);
      // Elevated North Choir Apse leading up to Monumental Quiet Engine Gate (A25)
      b.carve(18, 2, 25, 5, 1);
      // Four Recessed Abyssal Coolant Canals framing the cruciform transept corners + twin waterfalls!
      b.water(10, 4, 14, 8);  b.water(29, 4, 33, 8);
      b.water(10, 21, 14, 25); b.water(29, 21, 33, 25);
      b.waterfalls.push({ x: 11, y: 2, w: 2, h: 3, color: 'rgba(136,208,255,0.80)' });
      b.waterfalls.push({ x: 30, y: 2, w: 2, h: 3, color: 'rgba(136,208,255,0.80)' });

      // Double Colonnade of Monumental Carved Cathedral Pillars (19) framing the Nave & Cloisters
      for (const px of [14, 18, 25, 29]) {
        b.wall(px, 11, px, 11, 19);
        b.wall(px, 18, px, 18, 19);
      }
      // North Transept Save Sanctuary & South Transept Reliquary Console Banks (17)
      b.wall(15, 3, 17, 3, 17);
      b.wall(26, 3, 28, 3, 17);
      b.wall(16, 26, 19, 26, 18); // south archive reliquary stacks
      b.wall(24, 26, 27, 26, 18);

      // Ceremonial Basilica Nave Runner, Twin Violet Energy Conduits & Octagonal Crossing Dais
      b.paintT(10, 14, 33, 15, 14);
      b.paintT(20, 3, 20, 25, 6);
      b.paintT(23, 3, 23, 25, 6);
      b.paintT(19, 6, 24, 7, 3);    // broad ceremonial choir staircase ascending to A25 Gate
      b.paintT(16, 12, 27, 17, 1);  // raised central crossing sanctuary platform
      b.paintT(18, 13, 25, 16, 14); // inner ceremonial dais carpet
      b.paintT(15, 9, 28, 10, 1);   // north cloister walkway
      b.paintT(15, 19, 28, 20, 1);  // south cloister walkway

      // Grand Sanctuary Screen Wall dividing Nave from East Control Apse
      partitionV(b, 34, 4, 25, 13, 4);

      // 3. East Raised Control Apse & WARD-7 Sanctum Vestibule (x:35..42, y:10..19)
      b.carve(35, 10, 42, 19, 1);
      b.wall(36, 9, 40, 9, 17);   // apse telemetry control banks
      b.wall(36, 20, 40, 20, 17);
      b.paintT(36, 12, 36, 17, 3); // broad ascending steps to apse platform
      b.paintT(37, 14, 42, 15, 14);

      // Three monumental integrated entrances:
      b.portal('A23', 1, 14, 'left', 'arch_west', 'CATHEDRAL ANTECHAMBER', 'bulkhead', { assembly: 'archway' });
      b.portal('A25', 21, 2, 'up', 'cathedral_gate', 'QUIET ENGINE CORE', 'bulkhead', { assembly: 'cathedral_gate' });
      b.portal('A26', 42, 14, 'right', 'arch_east', 'WARD-7 SANCTUM', 'bulkhead', { assembly: 'archway' });

      // Explicit semantic anchors
      b.anchors.start = [4, 14, 'right'];
      b.anchors.save = [16, 5];   // Save Sanctuary in North Transept Chapel
      b.anchors.crate = [16, 24]; // Supply Reliquary in South Transept Alcove
      b.anchors.ambient = [27, 5]; // Field Record in NE Choir Chapel
      b.anchors.battles = [[26, 24], [19, 23], [24, 23]]; // EN-038 Regulators patrolling south transept
      b.anchors.scenes = [[21, 14], [24, 14], [39, 14], [19, 14], [21, 10]];
      b.anchors.puzzles = [[16, 10], [27, 10], [16, 19], [27, 19]];
      b.anchors.drone = { start: [22, 12], zone: [15, 9, 28, 20], waypoints: [[22, 12], [28, 12], [28, 17], [15, 17]] };
      b.lightShafts.push({ x: 19, y: 0, w: 6, h: 15, color: '#dcb8ff', alpha: 0.15 });
      b.lightShafts.push({ x: 37, y: 8, w: 3, h: 9, color: '#72e8ff', alpha: 0.12 });
      b.lamps.push(
        { x: 5, y: 14, r: 115, color: '#e2a8ff', flicker: false },
        { x: 21, y: 14, r: 185, color: '#e2a8ff', flicker: false },
        { x: 21, y: 5, r: 135, color: '#ff8a8a', flicker: true },
        { x: 21, y: 24, r: 130, color: '#98bfff', flicker: false },
        { x: 39, y: 14, r: 125, color: '#5ce4ff', flicker: false }
      );
      break;
    }

    case 'A25': {
      // Quiet Engine Core Chamber (26x18) — Suspended Octagonal Reactor Boss Arena
      b.water(1, 2, w - 2, h - 3);
      b.carve(5, 4, 20, 13, 1);
      b.carve(7, 3, 18, 14, 1);
      b.bridge(11, 14, 14, 15);
      b.wall(6, 5, 6, 5, 19); b.wall(19, 5, 19, 5, 19);
      b.wall(6, 12, 6, 12, 19); b.wall(19, 12, 19, 12, 19);
      b.paintT(12, 3, 13, 14, 6);
      b.paintT(9, 6, 16, 11, 14);
      b.paintT(11, 12, 14, 12, 3);
      b.portal('A24', 12, 15, 'down', 'south_threshold', 'CONTROL CATHEDRAL', 'bulkhead', { assembly: 'archway' });

      b.anchors.start = [12, 13, 'up'];
      b.anchors.save = [8, 12];
      b.anchors.ambient = [17, 12];
      b.anchors.scenes = [[12, 8], [14, 8]];
      b.anchors.puzzles = [[8, 6], [17, 6], [8, 10], [17, 10]];
      b.anchors.battles = [[13, 10], [10, 8]];
      b.lightShafts.push({ x: 11, y: 0, w: 4, h: 11, color: '#ff8888', alpha: 0.14 });
      b.lamps.push(
        { x: 12, y: 8, r: 160, color: '#ff7070', flicker: true },
        { x: 7, y: 8, r: 95, color: '#e2a8ff', flicker: false },
        { x: 18, y: 8, r: 95, color: '#e2a8ff', flicker: false }
      );
      break;
    }

    case 'A26': {
      // WARD-7 Switch Chamber & Surface Lift (32x18) — Tapered Ascending High Sanctum
      b.carve(1, 6, 6, 12, 1);
      b.carve(7, 4, 23, 14, 0);
      b.carve(24, 6, 30, 12, 1);
      b.paintT(9, 5, 9, 13, 3);
      b.paintT(18, 5, 18, 13, 3);
      b.paintT(10, 6, 17, 12, 14);
      b.paintT(19, 7, 29, 11, 14);
      b.wall(11, 4, 11, 4, 19); b.wall(11, 14, 11, 14, 19);
      b.wall(21, 4, 21, 4, 19); b.wall(21, 14, 21, 14, 19);
      b.wall(13, 3, 16, 3, 17);

      b.portal('A24', 1, 9, 'left', 'arch_west', 'CATHEDRAL NAVE', 'bulkhead', { assembly: 'archway' });
      b.portal('A27', 30, 9, 'right', 'airlock_east', 'SURFACE ELEVATOR', 'exit', { assembly: 'elevator' });

      b.anchors.start = [4, 9, 'right'];
      b.anchors.npcs = [[22, 9]]; // WARD-7 Switch Monolith
      b.anchors.save = [14, 5];
      b.anchors.crate = [14, 13];
      b.anchors.ambient = [16, 5];
      b.anchors.scenes = [[12, 9], [15, 9], [25, 9], [25, 11]];
      b.anchors.puzzles = [[12, 7], [16, 11], [20, 7], [20, 11]];
      b.anchors.battles = [[17, 9], [24, 7]];
      b.lightShafts.push({ x: 20, y: 0, w: 4, h: 11, color: '#72f0ff', alpha: 0.15 });
      b.lamps.push(
        { x: 14, y: 9, r: 130, color: '#5ce4ff', flicker: false },
        { x: 22, y: 9, r: 145, color: '#5ce4ff', flicker: false },
        { x: 28, y: 9, r: 105, color: '#ffe2a8', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 9 — SURFACE MORNING (Emerging Into Daylight & First Morning Overlook)
    // =========================================================================
    case 'A27': {
      // Surface Ascent Landing (30x16) — Armored Elevator Headhouse Opening Onto Mountain Trail
      b.carve(1, 5, 28, 12, 0);
      b.building(1, 2, 7, 5, 3);
      b.wall(0, 6, 0, 11, 9);
      b.wall(1, 12, 8, 13, 12);
      b.wall(9, 13, 28, 13, 4);
      b.paintT(8, 5, 16, 6, 5);
      b.paintT(18, 5, 25, 6, 5);
      b.paintT(2, 8, 28, 10, 10);
      b.paintT(15, 8, 16, 10, 3);

      b.portal('A26', 1, 9, 'left', 'airlock_west', 'SURFACE ELEVATOR', 'exit', { assembly: 'elevator' });
      b.portal('A28', 28, 9, 'right', 'trail_passage', 'FIRST MORNING RIDGE', 'exit', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [4, 9, 'right'];
      b.anchors.save = [9, 6];
      b.anchors.ambient = [13, 11];
      b.anchors.sidequests = [[12, 6], [20, 6]];
      b.anchors.scenes = [[19, 9], [23, 9]];
      b.anchors.puzzles = [[10, 11], [18, 11], [24, 11], [14, 7]];
      b.anchors.battles = [[21, 11], [17, 7]];
      b.lightShafts.push({ x: 10, y: 0, w: 5, h: 10, color: '#ffebb0', alpha: 0.17 });
      b.lightShafts.push({ x: 20, y: 0, w: 5, h: 10, color: '#ffebb0', alpha: 0.16 });
      b.lamps.push(
        { x: 4, y: 7, r: 105, color: '#ffe2a8', flicker: false },
        { x: 18, y: 9, r: 145, color: '#ffe8b0', flicker: false }
      );
      break;
    }

    case 'A28':
    default: {
      // First Morning Overlook (34x18) — Panoramic Curved Hilltop Promontory Facing Sunrise
      b.carve(1, 6, 30, 12, 0);
      b.carve(5, 4, 29, 14, 0);
      b.carve(10, 3, 26, 15, 0);
      b.wall(8, 15, 28, 15, 4);
      b.wall(30, 5, 31, 13, 12);
      b.wall(2, 3, 4, 5, 12);
      b.wall(15, 5, 15, 5, 19); b.wall(15, 13, 15, 13, 19);
      b.paintT(1, 8, 14, 10, 10);
      b.paintT(14, 5, 27, 13, 1);
      b.paintT(14, 6, 14, 12, 3);
      b.paintT(6, 4, 11, 6, 5);
      b.paintT(6, 12, 11, 14, 5);
      b.paintT(16, 3, 23, 4, 5);
      b.paintT(21, 7, 27, 11, 14);
      b.paintT(4, 6, 5, 6, 15);

      b.portal('A27', 1, 9, 'left', 'trail_passage', 'SURFACE LANDING', 'exit', { frame: false, assembly: 'trail_exit' });

      b.anchors.start = [4, 9, 'right'];
      b.anchors.npcs = [[25, 9]]; // First Morning Messenger facing sunrise
      b.anchors.save = [12, 7];
      b.anchors.ambient = [12, 11];
      b.anchors.scenes = [[17, 9], [20, 8], [20, 10], [23, 9]];
      b.anchors.puzzles = [[17, 6], [17, 12], [23, 6], [23, 12]];
      b.anchors.battles = [[19, 12], [19, 6]];
      b.lightShafts.push({ x: 10, y: 0, w: 6, h: 12, color: '#ffedb5', alpha: 0.18 });
      b.lightShafts.push({ x: 20, y: 0, w: 7, h: 12, color: '#fff2c4', alpha: 0.18 });
      b.lamps.push(
        { x: 17, y: 9, r: 155, color: '#ffe8b0', flicker: false },
        { x: 25, y: 9, r: 165, color: '#fff0c0', flicker: false }
      );
      break;
    }
  }

  return {
    w, h,
    collision: b.col,
    terrainLayer: b.terr,
    waterfalls: b.waterfalls,
    lightShafts: b.lightShafts,
    lamps: b.lamps,
    details: b.details,
    portalSlots: b.portalSlots,
    anchors: b.anchors,
    skyBackdrop: meta.sky || null
  };
}
