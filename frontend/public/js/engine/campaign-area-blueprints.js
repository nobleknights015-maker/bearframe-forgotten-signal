// Bespoke spatial architecture & worldbuilding blueprints for all 29 Aeon Circuit sectors (A00-A28).
// Every sector has a unique architectural floor plan or outdoor landscape composition, structurally
// integrated doorways/passages (zero floating doors), and geographically meaningful functional anchors.
// Contains NO screenplay dialogue, lore text, or private story copy.

// Terrain layer codes (rendered by tiles.js paintCampaignTerrainCell):
//  1 = paved stone/metal walkway with curbs
//  2 = deep water / coolant canal basin (usually collision=1)
//  3 = multi-step stairway / ramp
//  4 = viaduct / cliff drop-off safety guardrail edge
//  5 = organic moss / grass / wildflower ground transition
//  6 = recessed energy / relay conduit trench
//  7 = timber boardwalk / wooden pier bridge over water
//  8 = building roof / shelter cap (collision=1)
//  9 = building exterior facade wall with illuminated windows (collision=1)
// 10 = natural packed-earth / stone dirt trail
// 11 = elevated railway track bed (ballast + sleepers + twin rails)
// 12 = rocky cliff / canyon escarpment face (collision=1)
// 13 = dense wetland reeds / forest canopy foliage border (collision=1)
// 14 = interior ceremonial runner / woven plaza rug / cryo hazard deck
// 15 = collapsed masonry rubble / broken ruins

export const AREA_DIMENSIONS = Object.freeze({
  A00: { w: 28, h: 16 }, A01: { w: 24, h: 14 }, A02: { w: 30, h: 18 }, A03: { w: 28, h: 16 },
  A04: { w: 22, h: 15 }, A05: { w: 28, h: 17 }, A06: { w: 26, h: 15 }, A07: { w: 24, h: 15 },
  A08: { w: 26, h: 16 }, A09: { w: 30, h: 18 }, A10: { w: 26, h: 16 }, A11: { w: 24, h: 15 },
  A12: { w: 28, h: 15 }, A13: { w: 26, h: 15 }, A14: { w: 24, h: 15 }, A15: { w: 30, h: 18 },
  A16: { w: 28, h: 16 }, A17: { w: 24, h: 15 }, A18: { w: 28, h: 18 }, A19: { w: 22, h: 14 },
  A20: { w: 26, h: 16 }, A21: { w: 30, h: 16 }, A22: { w: 22, h: 14 }, A23: { w: 24, h: 14 },
  A24: { w: 30, h: 18 }, A25: { w: 24, h: 16 }, A26: { w: 26, h: 16 }, A27: { w: 26, h: 15 },
  A28: { w: 28, h: 16 }
});

function createGridBuilder(w, h) {
  // Start fully solid (1) so every sector is CARVED into true irregular rooms, buildings, or landscapes
  const col = new Array(w * h).fill(1);
  const terr = new Array(w * h).fill(0);
  const waterfalls = [];
  const lightShafts = [];
  const lamps = [];
  const portalSlots = {};
  const anchors = {
    start: null,
    save: null,
    crate: null,
    bench: null,
    ambient: null,
    npcs: [],
    scenes: [],
    sidequests: [],
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

  const paintT = (x0, y0, x1, y1, tCode) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setT(x, y, tCode);
  };

  // Construct an actual multi-tile exterior building with roof (8) and lit windowed facade wall (9)
  const building = (x0, y0, x1, y1, roofRows = Math.max(1, y1 - y0)) => {
    const facadeY = y1;
    const roofEnd = Math.min(y1 - 1, y0 + roofRows - 1);
    for (let y = y0; y <= roofEnd; y++) {
      for (let x = x0; x <= x1; x++) { setC(x, y, 1); setT(x, y, 8); }
    }
    for (let x = x0; x <= x1; x++) { setC(x, facadeY, 1); setT(x, facadeY, 9); }
  };

  // Water basin (solid water cells)
  const water = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { setC(x, y, 1); setT(x, y, 2); }
  };

  // Walkable wooden pier / bridge over water
  const bridge = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x >= 1 && y >= 2 && x <= w - 2 && y <= h - 3) { setC(x, y, 0); setT(x, y, 7); }
    }
  };

  // Structurally embedded portal registration: ensures approach floor + framing jambs/architecture
  const portal = (toId, tx, ty, dir, art, label, style = 'bulkhead', opts = {}) => {
    // Ensure portal tile itself is walkable and inside safe bounds
    const px = Math.max(1, Math.min(w - 2, tx));
    const py = Math.max(2, Math.min(h - 3, ty));
    setC(px, py, 0);
    // Clear an inward approach tile so arrival & interaction are never cramped
    const inDx = dir === 'right' ? -1 : dir === 'left' ? 1 : 0;
    const inDy = dir === 'down' ? -1 : dir === 'up' ? 1 : 0;
    if (px + inDx >= 1 && px + inDx <= w - 2 && py + inDy >= 2 && py + inDy <= h - 3) {
      setC(px + inDx, py + inDy, 0);
    }
    // Enforce structural framing jambs for interior doors/airlocks/arches so ZERO doors float in open floor
    if (opts.frame !== false) {
      if (dir === 'up') {
        setC(px, py - 1, 1);
        if (px - 1 >= 0 && getC(px - 1, py - 1) === 0) setC(px - 1, py - 1, 1);
        if (px + 1 < w && getC(px + 1, py - 1) === 0) setC(px + 1, py - 1, 1);
      } else if (dir === 'down') {
        setC(px, py + 1, 1);
        if (opts.jambs !== false) {
          if (px - 1 >= 1) setC(px - 1, py + 1, 1);
          if (px + 1 <= w - 2) setC(px + 1, py + 1, 1);
        }
      } else if (dir === 'right') {
        setC(px + 1, py, 1);
        if (opts.jambs !== false) {
          setC(px + 1, py - 1, 1);
          setC(px + 1, py + 1, 1);
        }
      } else if (dir === 'left') {
        setC(px - 1, py, 1);
        if (opts.jambs !== false) {
          setC(px - 1, py - 1, 1);
          setC(px - 1, py + 1, 1);
        }
      }
    }
    portalSlots[`to_${toId}`] = { tx: px, ty: py, dir, art, label, style };
  };

  return {
    w, h, col, terr, waterfalls, lightShafts, lamps, portalSlots, anchors,
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
  const dims = AREA_DIMENSIONS[id] || { w: meta.w || 24, h: meta.h || 14 };
  const b = createGridBuilder(dims.w, dims.h);
  const { w, h } = b;

  switch (id) {
    // =========================================================================
    // ACT 0 — STASIS WING (Ancient Subterranean Cryogenic Bunker Complex)
    // =========================================================================
    case 'A00': {
      // BENCHMARK #1: A00 Stasis Hollow — 3-Room Cryogenic Vault & Airlock Complex
      // Room 1 (West): Stepped Cryo-Awakening Alcove (x:2..9, y:3..12)
      b.carve(2, 4, 9, 12, 0);
      b.carve(3, 3, 8, 3, 0); // recessed north cryo-pod bay
      b.paintT(3, 5, 8, 10, 14); // hazard-bordered cryo deck
      b.paintT(5, 3, 5, 12, 6);  // glowing main stasis power conduit

      // Structural Bulkhead Partition separating Cryo Bay from Central Diagnostic Atrium
      partitionV(b, 10, 3, 12, 7, 2);

      // Room 2 (Center): Diagnostic Atrium with raised north console gallery & south equipment nook
      b.carve(11, 3, 21, 12, 0);
      b.wall(11, 3, 12, 3, 0); b.wall(20, 3, 21, 3, 0); // stepped north diagnostic niche
      b.paintT(13, 3, 19, 4, 1); // upper diagnostic deck
      b.paintT(15, 5, 17, 5, 3); // broad stairs down to atrium floor
      b.paintT(11, 7, 21, 8, 1); // main transit lane
      b.paintT(16, 6, 16, 12, 6); // secondary power bus
      // South recessed storage alcove (partial divider wall)
      b.wall(13, 10, 13, 12, 0); b.wall(19, 10, 19, 12, 0);
      b.paintT(14, 11, 18, 12, 14);

      // Structural Bulkhead Partition into East Airlock Vestibule
      partitionV(b, 22, 3, 12, 7, 2);

      // Room 3 (East): Narrow Armored Airlock Vestibule leading directly to A01
      b.carve(23, 5, 26, 10, 1);
      b.paintT(23, 7, 26, 8, 14);
      b.portal('A01', 26, 7, 'right', 'airlock_east', 'AUX CORRIDOR AIRLOCK', 'bulkhead');

      b.anchors.start = [5, 8, 'right'];
      b.anchors.npcs = [[8, 6]]; // Guardian positioned inside cryo-bay entrance
      b.anchors.save = [16, 3]; // Save terminal centered in north diagnostic niche
      b.anchors.crate = [16, 11]; // Supply cache tucked inside south storage alcove
      b.anchors.scenes = [[4, 4], [7, 4], [14, 4], [19, 6], [24, 6]];
      b.anchors.ambient = [12, 11];
      b.lightShafts.push({ x: 5, y: 1, w: 2, h: 7, color: '#7eeeff', alpha: 0.12 });
      b.lightShafts.push({ x: 15, y: 1, w: 3, h: 7, color: '#88e8ff', alpha: 0.10 });
      b.lamps.push(
        { x: 5, y: 3, r: 95, color: '#72dce8', flicker: false },
        { x: 16, y: 4, r: 115, color: '#72dce8', flicker: false },
        { x: 16, y: 11, r: 85, color: '#f2bd75', flicker: true },
        { x: 24, y: 7, r: 90, color: '#7dffb0', flicker: false }
      );
      break;
    }

    case 'A01': {
      // Auxiliary Stasis Corridor — L-shaped Utility Wing + Collapsed Root Breach
      // West entry vestibule from A00
      b.carve(1, 6, 5, 9, 1);
      b.portal('A00', 1, 7, 'left', 'airlock_west', 'STASIS HOLLOW AIRLOCK', 'bulkhead');
      // Partition into main utility hall
      partitionV(b, 6, 4, 11, 7, 2);
      // North collapsed ceiling breach where moss & vines first break into the bunker
      b.carve(7, 3, 15, 10, 0);
      b.paintT(8, 3, 13, 5, 5);
      b.paintT(9, 4, 11, 4, 15);
      b.paintT(7, 7, 15, 8, 1);
      // South auxiliary generator bay
      b.wall(7, 10, 10, 10, 0);
      b.carve(11, 10, 15, 11, 14);
      // East overgrown breach tunnel into Rootway (A02)
      partitionV(b, 16, 3, 11, 7, 2);
      b.carve(17, 6, 22, 9, 10);
      b.paintT(18, 6, 21, 6, 5);
      b.paintT(19, 9, 21, 9, 15);
      b.portal('A02', 22, 7, 'right', 'arch_east', 'ROOTWAY BREACH', 'hatch');

      b.anchors.start = [4, 7, 'right'];
      b.anchors.save = [13, 11];
      b.anchors.scenes = [[10, 6], [14, 5]];
      b.lightShafts.push({ x: 9, y: 1, w: 3, h: 6, color: '#a8ffaa', alpha: 0.14 });
      b.lamps.push(
        { x: 3, y: 7, r: 85, color: '#72dce8', flicker: true },
        { x: 11, y: 5, r: 105, color: '#8ef5a8', flicker: false },
        { x: 20, y: 7, r: 95, color: '#a4f096', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 1 — ROOTWAY (Overgrown Ruined Ravine, Sluice Waterworks & Upper Shrine)
    // =========================================================================
    case 'A02': {
      // BENCHMARK #2: A02 Rootway Ruins — Organic Ravine, Ruined Pavilion & Rainwater Stream
      // Natural canyon cliff & dense canopy perimeter (ZERO artificial bunker box!)
      b.wall(0, 0, w - 1, 2, 12); // rocky cliff escarpment north
      b.wall(0, h - 3, w - 1, h - 1, 13); // overgrown forest/vine ravine rim south
      b.wall(0, 2, 1, h - 3, 12); // west canyon wall (where Stasis tunnel emerges)
      b.wall(w - 2, 2, w - 1, h - 3, 12); // east aqueduct rock wall

      // Irregular organic open ravine floor
      b.carve(2, 4, 27, 14, 0);
      b.carve(12, 2, 16, 4, 10); // north cliffside ascending gorge toward A04
      b.wall(2, 3, 6, 4, 13);   // NW dense canopy overhang
      b.wall(2, 13, 5, 14, 13); // SW foliage bank
      b.wall(23, 13, 27, 14, 13); // SE foliage bank
      b.wall(19, 3, 22, 4, 12); // NE crag outcrop

      // Winding subterranean rainwater stream cutting organically across lower ravine + waterfall!
      b.water(6, 11, 23, 12);
      b.water(10, 10, 14, 11);
      b.water(20, 12, 24, 13);
      b.waterfalls.push({ x: 8, y: 1, w: 2, h: 3, color: 'rgba(72,210,196,0.78)' });
      b.water(7, 4, 10, 5); // plunge pool beneath waterfall!
      // Two weathered timber footbridges spanning the stream
      b.bridge(8, 11, 9, 12);
      b.bridge(18, 11, 19, 12);

      // Partially collapsed stone ruin pavilion in East-North courtyard (real walls + broken masonry)
      b.wall(20, 5, 25, 5, 0);
      b.wall(20, 6, 20, 8, 0);
      b.wall(25, 6, 25, 7, 0);
      b.paintT(21, 6, 24, 8, 1);
      b.paintT(20, 9, 22, 9, 15); // crumbled southern wall rubble

      // Organic dirt trail & stone terrace connecting all 3 exits cleanly
      b.paintT(1, 7, 14, 8, 10);
      b.paintT(13, 2, 15, 9, 10);
      b.paintT(13, 5, 15, 5, 3); // stone ruin stairs rising to north pass
      b.paintT(14, 8, 28, 9, 10);
      b.paintT(3, 5, 6, 6, 5);
      b.paintT(16, 4, 18, 6, 5);
      b.paintT(11, 13, 17, 14, 5);

      // Three geographically natural exits:
      b.portal('A01', 1, 7, 'left', 'arch_west', 'STASIS BREACH TUNNEL', 'hatch');
      b.portal('A04', 14, 2, 'up', 'trail_passage', 'UPPER SHRINE TRAIL', 'hatch', { frame: false });
      b.portal('A03', 28, 8, 'right', 'arch_east', 'FILTER BASIN AQUEDUCT', 'bulkhead');

      b.anchors.start = [4, 7, 'right'];
      b.anchors.npcs = [[15, 7]]; // Pica trapped at the central moss-draped terrace
      b.anchors.save = [12, 6];
      b.anchors.crate = [23, 7]; // Supply cache tucked inside the collapsed stone pavilion!
      b.anchors.battles = [[21, 10]]; // Filter Crawler patrolling east trail
      b.anchors.scenes = [[11, 7], [17, 7]];
      b.anchors.ambient = [12, 13];
      b.lightShafts.push({ x: 6, y: 0, w: 3, h: 8, color: '#c4ffb0', alpha: 0.14 });
      b.lightShafts.push({ x: 14, y: 0, w: 3, h: 7, color: '#fff0a8', alpha: 0.12 });
      b.lamps.push(
        { x: 4, y: 7, r: 95, color: '#82e896', flicker: false },
        { x: 14, y: 7, r: 120, color: '#c2f59a', flicker: false },
        { x: 23, y: 7, r: 100, color: '#f2bd75', flicker: true },
        { x: 14, y: 13, r: 90, color: '#72dce8', flicker: false }
      );
      break;
    }

    case 'A03': {
      // Filter Basin — Dual Sunken Waterworks Tanks, Elevated Catwalks & Boss Control Deck
      b.carve(1, 5, 5, 9, 1); // West aqueduct intake vestibule
      partitionV(b, 6, 3, 12, 7, 2);
      b.carve(7, 3, 21, 12, 0);
      // Twin flooded settling basins with cascading intake waterfalls
      b.water(8, 4, 13, 6);
      b.water(15, 4, 20, 6);
      b.water(8, 10, 13, 11);
      b.waterfalls.push({ x: 10, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.78)' });
      b.waterfalls.push({ x: 17, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.78)' });
      // Elevated catwalks & stealth cover pillars
      b.paintT(7, 7, 21, 8, 1);
      b.bridge(14, 3, 14, 7);
      b.wall(16, 10, 17, 10, 0); // filtration baffle for stealth cover
      // East raised Sluice Control Deck & Fuse Warden Boss Arena
      partitionV(b, 22, 3, 12, 7, 2);
      b.carve(23, 4, 26, 11, 1);
      b.paintT(23, 7, 23, 8, 3); // stairs up to control lock

      b.portal('A02', 1, 7, 'left', 'arch_west', 'ROOTWAY AQUEDUCT', 'bulkhead');
      b.portal('A05', 26, 7, 'right', 'airlock_east', 'RELAY COURT BULKHEAD', 'bulkhead');

      b.anchors.start = [3, 7, 'right'];
      b.anchors.save = [14, 3];
      b.anchors.battles = [[18, 11]];
      b.anchors.scenes = [[12, 8], [19, 8], [24, 6]];
      b.anchors.drone = { start: [15, 8], zone: [13, 7, 21, 12], waypoints: [[15, 8], [20, 8], [20, 11], [15, 11]] };
      b.lightShafts.push({ x: 13, y: 1, w: 3, h: 7, color: '#7ce8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 4, y: 7, r: 90, color: '#72dce8', flicker: false },
        { x: 14, y: 8, r: 115, color: '#72dce8', flicker: true },
        { x: 24, y: 7, r: 100, color: '#f2bd75', flicker: false }
      );
      break;
    }

    case 'A04': {
      // Upper Rootway Overlook — Semicircular Forest Cliff Clearing & Ruined Shrine
      b.wall(0, 0, w - 1, 2, 13);
      b.wall(0, 2, 2, h - 1, 12);
      b.wall(w - 3, 2, w - 1, h - 1, 13);
      b.wall(0, h - 3, w - 1, h - 1, 12);
      // Organic curved hilltop clearing
      b.carve(4, 3, 17, 11, 0);
      b.carve(3, 5, 18, 10, 0);
      b.carve(9, 10, 12, 12, 10); // south descending trail mouth
      b.wall(3, 3, 4, 4, 13); b.wall(17, 3, 18, 4, 13);
      // Central stone shrine dais with stairs & wildflower ring
      b.paintT(8, 4, 13, 6, 1);
      b.paintT(10, 7, 11, 7, 3);
      b.paintT(5, 5, 7, 9, 5);
      b.paintT(14, 5, 16, 9, 5);
      b.paintT(9, 8, 12, 12, 10);
      b.paintT(5, 4, 6, 4, 15);
      b.portal('A02', 10, 12, 'down', 'trail_passage', 'ROOTWAY DESCENT', 'hatch', { frame: false });

      b.anchors.start = [10, 10, 'up'];
      b.anchors.crate = [5, 8];
      b.anchors.sidequests = [[11, 5]];
      b.anchors.ambient = [15, 7];
      b.lightShafts.push({ x: 9, y: 0, w: 4, h: 8, color: '#ffe8a8', alpha: 0.16 });
      b.lamps.push(
        { x: 10, y: 5, r: 120, color: '#f2bd75', flicker: false },
        { x: 6, y: 8, r: 85, color: '#9cf5a8', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 2 — RELAY COURT (Communications Hub, Mail Vault, Under-Conduit & Quay)
    // =========================================================================
    case 'A05': {
      // Relay Court Main Hall — T-Shaped Communications Hub with Shutter Gallery & Stealth Wing
      b.carve(1, 6, 5, 10, 1); // west arrival airlock hall
      partitionV(b, 6, 3, 13, 7, 3);
      // Grand central court
      b.carve(7, 3, 21, 13, 0);
      // North raised Relay Command Gallery (where Rill is trapped behind shutters)
      b.wall(7, 5, 11, 5, 0); b.wall(17, 5, 21, 5, 0);
      b.paintT(8, 3, 20, 4, 1);
      b.paintT(13, 5, 15, 5, 3);
      // Twin illuminated relay conduits running north-south
      b.paintT(10, 6, 10, 13, 6);
      b.paintT(18, 6, 18, 13, 6);
      // Stealth cover server baffles on east wing
      b.wall(15, 8, 16, 8, 0);
      b.wall(15, 11, 16, 11, 0);
      // East Mail Vault vestibule
      partitionV(b, 22, 3, 13, 7, 2);
      b.carve(23, 6, 26, 9, 1);
      // South descending stairwell alcove to A07
      b.carve(12, 13, 16, 14, 1);
      b.paintT(13, 13, 15, 13, 3);

      b.portal('A03', 1, 8, 'left', 'airlock_west', 'FILTER BASIN LOCK', 'bulkhead');
      b.portal('A06', 26, 7, 'right', 'airlock_east', 'MAIL VAULT LOCK', 'bulkhead');
      b.portal('A07', 14, 14, 'down', 'south_threshold', 'LOWER CONDUIT STAIRS', 'bulkhead');

      b.anchors.start = [4, 8, 'right'];
      b.anchors.npcs = [[14, 3]]; // Rill in north command gallery
      b.anchors.save = [8, 3];
      b.anchors.scenes = [[12, 7], [14, 9], [19, 7]];
      b.anchors.drone = { start: [19, 7], zone: [14, 6, 21, 13], waypoints: [[19, 7], [20, 12], [14, 12], [14, 7]] };
      b.lightShafts.push({ x: 13, y: 1, w: 3, h: 7, color: '#9cd8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 14, y: 4, r: 120, color: '#92d6ea', flicker: false },
        { x: 14, y: 10, r: 105, color: '#92d6ea', flicker: false },
        { x: 24, y: 7, r: 85, color: '#f2bd75', flicker: false }
      );
      break;
    }

    case 'A06': {
      // Mail Vault — Partitioned Multi-Room Sorting Facility & Clerk's Alcove
      b.carve(1, 5, 7, 10, 1); // West receiving room
      partitionV(b, 8, 3, 12, 7, 2);
      // Central sorting bay with hazard deck & mail aisles
      b.carve(9, 3, 18, 12, 0);
      b.paintT(10, 6, 17, 9, 14);
      // North clerk's vault partition with doorway
      partitionH(b, 5, 9, 18, 13, 2);
      b.paintT(10, 3, 17, 4, 1);
      // East loading dock leading to Flooded Quay (A08)
      partitionV(b, 19, 3, 12, 7, 2);
      b.carve(20, 5, 24, 10, 1);

      b.portal('A05', 1, 7, 'left', 'airlock_west', 'RELAY COURT', 'bulkhead');
      b.portal('A08', 24, 7, 'right', 'airlock_east', 'FLOODED QUAY LOCK', 'bulkhead');

      b.anchors.start = [4, 7, 'right'];
      b.anchors.crate = [11, 3];
      b.anchors.sidequests = [[16, 3]];
      b.anchors.battles = [[14, 10]];
      b.anchors.scenes = [[12, 7], [15, 7]];
      b.lightShafts.push({ x: 13, y: 1, w: 2, h: 6, color: '#ffd898', alpha: 0.10 });
      b.lamps.push(
        { x: 4, y: 7, r: 90, color: '#f2bd75', flicker: false },
        { x: 14, y: 7, r: 115, color: '#f2bd75', flicker: false },
        { x: 22, y: 7, r: 90, color: '#72dce8', flicker: true }
      );
      break;
    }

    case 'A07': {
      // Lower Relay Conduit — Stepped Z-Bend Underground Service Bypass
      // North stairwell room arriving from A05
      b.carve(3, 2, 9, 6, 1);
      b.paintT(5, 3, 7, 3, 3);
      // Narrow vertical maintenance shaft bending east
      b.carve(5, 6, 8, 11, 0);
      b.paintT(6, 5, 6, 11, 6);
      // Central underground junction bay with coolant channel
      b.carve(9, 7, 17, 12, 0);
      b.water(11, 11, 15, 12);
      b.paintT(9, 8, 17, 9, 1);
      // East pressurized exit corridor toward Lantern Shelf (A09)
      partitionV(b, 18, 7, 12, 8, 2);
      b.carve(19, 7, 22, 10, 1);

      b.portal('A05', 6, 2, 'up', 'service', 'RELAY COURT STAIRS', 'bulkhead');
      b.portal('A09', 22, 8, 'right', 'airlock_east', 'LANTERN SHELF APPROACH', 'bulkhead');

      b.anchors.start = [6, 4, 'down'];
      b.anchors.save = [13, 7];
      b.anchors.ambient = [16, 10];
      b.lamps.push(
        { x: 6, y: 4, r: 95, color: '#92d6ea', flicker: false },
        { x: 13, y: 8, r: 110, color: '#72dce8', flicker: true },
        { x: 20, y: 8, r: 90, color: '#f8cb7c', flicker: false }
      );
      break;
    }

    case 'A08': {
      // Flooded Quay — L-Shaped Industrial Wharf Over Deep Subterranean Canal
      // Deep flooded canal filling south & southeast
      b.water(2, 9, w - 3, h - 3);
      b.water(16, 6, w - 3, h - 3);
      b.waterfalls.push({ x: 18, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.75)' });
      // North & West concrete cargo wharf
      b.carve(1, 3, 15, 8, 1);
      b.carve(1, 8, 8, 12, 1);
      // Timber pier fingers extending across the flooded harbor to the East Water-Lock Gatehouse
      b.bridge(15, 6, 21, 7);
      b.bridge(8, 10, 17, 10);
      b.bridge(17, 7, 18, 10);
      // East Gatehouse Dock (building roof + facade guarding the lock to Lantern Shelf)
      b.building(21, 2, 24, 4, 2);
      b.carve(21, 5, 24, 8, 1);

      b.portal('A06', 1, 5, 'left', 'airlock_west', 'MAIL VAULT DOCK', 'bulkhead');
      b.portal('A09', 24, 6, 'right', 'arch_east', 'LANTERN WATER-LOCK', 'bulkhead');

      b.anchors.start = [3, 5, 'right'];
      b.anchors.battles = [[11, 6]];
      b.anchors.scenes = [[18, 6]]; // Quay Grapple boss arena on pier!
      b.anchors.save = [4, 11];
      b.lightShafts.push({ x: 10, y: 1, w: 3, h: 7, color: '#7ce8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 5, y: 5, r: 100, color: '#72dce8', flicker: false },
        { x: 16, y: 6, r: 110, color: '#72dce8', flicker: true },
        { x: 22, y: 6, r: 105, color: '#f8cb7c', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 3 — LANTERN SHELF (Multi-Building Cliffside Settlement)
    // =========================================================================
    case 'A09': {
      // Lantern Shelf Commons — Authentic Village Plaza with 3 Roofed Buildings, Streets & Hearth!
      b.wall(0, 0, w - 1, 1, 12); // rocky cliff shelf backdrop north
      b.wall(0, h - 2, w - 1, h - 2, 4); // single cliff drop-off guardrail overlooking canyon sky
      // Carve village streets & central plaza
      b.carve(1, 3, 28, 15, 0);
      b.carve(13, 2, 16, 4, 1); // north street ascending to Upper Terrace (A11)
      b.carve(13, 14, 16, 15, 10); // south switchback trail to Ravine (A14)

      // BUILDING 1 (NW): Noll's Lantern Workshop (roof + warm lit windowed facade)
      b.building(3, 2, 10, 5, 3);
      // BUILDING 2 (NE): Archive Liaison Office & Supply Depot
      b.building(18, 2, 26, 5, 3);
      // BUILDING 3 (SW): Communal Shelter House & Rest Porch
      b.building(3, 12, 9, 15, 3);
      // South-east rocky cliff garden
      b.wall(21, 13, 27, 15, 12);
      b.paintT(19, 13, 20, 14, 5);

      // Cobbled village avenues & warm woven central hearth plaza
      b.paintT(1, 6, 28, 9, 1);
      b.paintT(13, 2, 16, 15, 1);
      b.paintT(13, 3, 16, 3, 3); // terraced steps up to A11
      b.paintT(11, 7, 18, 11, 14); // central communal hearth rug/square
      b.paintT(10, 12, 12, 14, 5);

      // Five distinct geographically coherent village exits (2 west, 1 north, 1 east, 1 south):
      b.portal('A08', 1, 6, 'left', 'arch_west', 'FLOODED QUAY GATE', 'bulkhead');
      b.portal('A07', 1, 10, 'left', 'arch_west', 'LOWER CONDUIT TUNNEL', 'bulkhead');
      b.portal('A11', 14, 2, 'up', 'trail_passage', 'UPPER TERRACE LANE', 'bulkhead', { frame: false });
      b.portal('A10', 28, 8, 'right', 'airlock_east', 'AIR-EXCHANGE PLANT', 'bulkhead');
      b.portal('A14', 14, 15, 'down', 'trail_passage', 'RAVINE SWITCHBACK', 'hatch', { frame: false });

      b.anchors.start = [5, 8, 'right'];
      b.anchors.npcs = [[14, 8], [7, 6], [21, 6]]; // Ves in plaza, Noll outside workshop, Ilen by archive office!
      b.anchors.bench = [10, 13]; // Rest bench right outside the Shelter House
      b.anchors.save = [17, 6];
      b.anchors.crate = [25, 11];
      b.anchors.scenes = [[12, 9], [16, 9], [14, 11], [19, 9], [12, 6]];
      b.anchors.sidequests = [[4, 6], [9, 6], [19, 6], [24, 6], [11, 11], [17, 11], [11, 14], [18, 12]];
      b.lightShafts.push({ x: 12, y: 0, w: 4, h: 8, color: '#ffdf96', alpha: 0.13 });
      b.lamps.push(
        { x: 7, y: 6, r: 115, color: '#f8cb7c', flicker: true },
        { x: 14, y: 9, r: 135, color: '#ffd480', flicker: false },
        { x: 22, y: 6, r: 115, color: '#f8cb7c', flicker: true },
        { x: 10, y: 13, r: 100, color: '#f8cb7c', flicker: false },
        { x: 26, y: 8, r: 95, color: '#72dce8', flicker: false }
      );
      break;
    }

    case 'A10': {
      // Shelf Air-Exchange Plant — Twin Turbine Bays & Elevated Boss Deck
      b.carve(1, 6, 5, 9, 1);
      partitionV(b, 6, 3, 12, 7, 2);
      // Central turbine hall with dual recessed air ducts & boss arena floor
      b.carve(7, 3, 19, 12, 0);
      b.wall(9, 4, 10, 5, 0); b.wall(16, 4, 17, 5, 0); // turbine intake housings
      b.wall(9, 10, 10, 11, 0); b.wall(16, 10, 17, 11, 0);
      b.paintT(11, 6, 15, 9, 14); // central Registry Auditor arena
      b.paintT(7, 7, 19, 8, 1);
      b.paintT(13, 3, 13, 12, 6);
      // East Sky-Rail access gantry vestibule
      partitionV(b, 20, 3, 12, 7, 2);
      b.carve(21, 5, 24, 10, 1);
      b.paintT(21, 7, 24, 8, 11); // railway track stub leading out to Sky-Rail

      b.portal('A09', 1, 7, 'left', 'airlock_west', 'LANTERN COMMONS', 'bulkhead');
      b.portal('A12', 24, 7, 'right', 'rail_gantry', 'SKY-RAIL GANTRY', 'exit');

      b.anchors.start = [3, 7, 'right'];
      b.anchors.scenes = [[13, 7]];
      b.anchors.battles = [[13, 11]];
      b.anchors.save = [8, 3];
      b.lightShafts.push({ x: 12, y: 1, w: 3, h: 7, color: '#ffd488', alpha: 0.11 });
      b.lamps.push(
        { x: 4, y: 7, r: 90, color: '#f8cb7c', flicker: false },
        { x: 13, y: 7, r: 125, color: '#f8cb7c', flicker: false },
        { x: 22, y: 7, r: 95, color: '#92d6ea', flicker: true }
      );
      break;
    }

    case 'A11': {
      // Upper Lantern Terrace — Quiet Cliffside Residential Street with Two Dwellings
      b.wall(0, 0, w - 1, 2, 12);
      b.carve(2, 4, 21, 12, 0);
      // Two cozy roofed hillside homes framing a stone lane
      b.building(3, 2, 9, 5, 3);
      b.building(14, 2, 20, 5, 3);
      b.wall(2, 10, 6, 12, 12); b.wall(17, 10, 21, 12, 12);
      b.paintT(3, 6, 20, 8, 1);
      b.paintT(10, 4, 13, 12, 1);
      b.paintT(11, 11, 12, 11, 3);
      b.paintT(4, 9, 8, 9, 5); b.paintT(15, 9, 19, 9, 5);
      b.portal('A09', 11, 12, 'down', 'trail_passage', 'LANTERN COMMONS STEPS', 'bulkhead', { frame: false });

      b.anchors.start = [11, 10, 'up'];
      b.anchors.sidequests = [[6, 6], [17, 6]];
      b.anchors.ambient = [12, 5];
      b.lightShafts.push({ x: 10, y: 0, w: 3, h: 7, color: '#ffe29c', alpha: 0.13 });
      b.lamps.push(
        { x: 6, y: 6, r: 105, color: '#f8cb7c', flicker: true },
        { x: 17, y: 6, r: 105, color: '#f8cb7c', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 4 — BROKEN SKY-RAIL (Cantilevered Viaduct, Switchyard & Under-Ravine)
    // =========================================================================
    case 'A12': {
      // Broken Sky-Rail Viaduct — Cantilevered Open-Air Railway Span Over Canyon Sky!
      // Leave rows 0..2 and rows 12..14 mostly open void (g=0, t=0) so wasteland_canyon parallax shines!
      b.carve(1, 5, 26, 10, 0);
      // North concrete signal-box cabin built onto the viaduct deck (real stealth cover!)
      b.building(9, 2, 15, 5, 3);
      // Elevated steel railway tracks running seamlessly east-west across the entire bridge!
      b.paintT(1, 7, 26, 8, 11);
      b.paintT(1, 6, 26, 6, 1); // north service walkway
      b.paintT(1, 9, 26, 10, 1); // south maintenance deck
      // South cantilevered safety guardrail edge overlooking the canyon abyss
      b.wall(1, 11, 26, 11, 4);
      // South emergency maintenance stair bay descending to A14 Ravine
      b.carve(13, 10, 15, 12, 1);
      b.paintT(14, 11, 14, 11, 3);
      b.paintT(21, 9, 23, 9, 15); // crumbled parapet rubble

      b.portal('A10', 1, 7, 'left', 'rail_gantry', 'AIR-EXCHANGE GANTRY', 'exit', { frame: false });
      b.portal('A13', 26, 7, 'right', 'rail_gantry', 'SWITCHYARD TRACK', 'exit', { frame: false });
      b.portal('A14', 14, 12, 'down', 'south_threshold', 'RAVINE LADDER', 'hatch');

      b.anchors.start = [4, 6, 'right'];
      b.anchors.save = [7, 5];
      b.anchors.crate = [24, 5];
      b.anchors.sidequests = [[11, 6]];
      b.anchors.battles = [[19, 9]];
      b.anchors.scenes = [[8, 8], [18, 6]];
      b.anchors.drone = { start: [17, 6], zone: [15, 5, 24, 10], waypoints: [[17, 6], [24, 6], [24, 9], [17, 9]] };
      b.lightShafts.push({ x: 4, y: 0, w: 3, h: 8, color: '#ffe5a8', alpha: 0.14 });
      b.lightShafts.push({ x: 19, y: 0, w: 3, h: 8, color: '#ffe5a8', alpha: 0.13 });
      b.lamps.push(
        { x: 5, y: 6, r: 95, color: '#92d6ea', flicker: false },
        { x: 12, y: 6, r: 110, color: '#f8cb7c', flicker: true },
        { x: 22, y: 6, r: 100, color: '#92d6ea', flicker: false }
      );
      break;
    }

    case 'A13': {
      // Switchyard Overpass — Y-Split Railway Yard, Signal Booth & Canyon Descent Ramp
      b.carve(1, 5, 24, 10, 0);
      b.carve(14, 4, 24, 11, 0);
      b.building(6, 2, 11, 4, 2); // switchyard signal tower
      b.wall(1, 11, 16, 11, 4);   // south canyon guardrail
      b.wall(17, 12, 24, 12, 12); // rocky eastern ridge descending toward wetland
      // Twin diverging tracks
      b.paintT(1, 7, 14, 7, 11);
      b.paintT(14, 6, 20, 6, 11);
      b.paintT(14, 9, 20, 9, 11);
      // East rocky descent trail leading down to A15 Survey Wetland
      b.paintT(21, 7, 24, 9, 10);
      b.paintT(22, 8, 23, 8, 3);

      b.portal('A12', 1, 7, 'left', 'rail_gantry', 'SKY-RAIL VIADUCT', 'exit', { frame: false });
      b.portal('A15', 24, 8, 'right', 'trail_passage', 'WETLAND DESCENT TRAIL', 'exit', { frame: false });

      b.anchors.start = [4, 7, 'right'];
      b.anchors.bench = [8, 5]; // scenic lookout bench by signal tower
      b.anchors.sidequests = [[13, 5]];
      b.anchors.scenes = [[16, 7], [18, 8], [20, 7]]; // Switchyard Mast boss arena
      b.lightShafts.push({ x: 14, y: 0, w: 4, h: 9, color: '#ffe8b0', alpha: 0.15 });
      b.lamps.push(
        { x: 9, y: 5, r: 105, color: '#ffe2a8', flicker: false },
        { x: 18, y: 7, r: 120, color: '#ffe2a8', flicker: false }
      );
      break;
    }

    case 'A14': {
      // Ravine Under-Deck — Irregular Eroded Canyon Floor Beneath the Viaduct
      b.wall(0, 0, w - 1, 2, 12);
      b.wall(0, h - 3, w - 1, h - 1, 12);
      b.wall(0, 2, 1, h - 3, 12);
      b.wall(w - 2, 2, w - 1, h - 3, 12);
      b.carve(2, 4, 21, 11, 0);
      b.carve(4, 2, 7, 4, 10);  // NW switchback ramp up to Lantern Shelf (A09)
      b.carve(16, 2, 19, 4, 1); // NE ladder pier up to Sky-Rail (A12)
      b.wall(10, 6, 12, 7, 12); // central canyon boulder outcrop
      b.paintT(5, 2, 6, 9, 10);
      b.paintT(6, 9, 17, 10, 10);
      b.paintT(17, 3, 18, 9, 10);
      b.paintT(14, 5, 15, 6, 15); // fallen viaduct steel debris
      b.paintT(3, 10, 5, 11, 5);

      b.portal('A09', 5, 2, 'up', 'trail_passage', 'LANTERN SWITCHBACK', 'hatch', { frame: false });
      b.portal('A12', 17, 2, 'up', 'roof_hatch', 'SKY-RAIL LADDER', 'hatch');

      b.anchors.start = [6, 5, 'down'];
      b.anchors.save = [11, 9];
      b.anchors.ambient = [15, 8];
      b.lamps.push(
        { x: 6, y: 4, r: 95, color: '#f2bd75', flicker: false },
        { x: 17, y: 4, r: 95, color: '#92d6ea', flicker: true }
      );
      break;
    }

    // =========================================================================
    // ACT 5 — SURVEY WETLAND (Organic Outdoor Marsh, Floodgate Pier & Ridge Camp)
    // =========================================================================
    case 'A15': {
      // BENCHMARK #3: A15 Survey Wetland — True Irregular Outdoor Marsh, Islets & Boardwalks!
      // Fill ENTIRE map canvas with deep marsh water (2), north limestone cliffs (12) & cypress reeds (13)
      // ZERO rectangular bunker walls!
      b.water(0, 2, w - 1, h - 1);
      b.wall(0, 0, w - 1, 2, 12); // jagged mossy limestone crags north
      b.wall(0, h - 2, 9, h - 1, 13); // SW cypress reed bank
      b.wall(19, h - 2, w - 1, h - 1, 13); // SE reed bank
      b.wall(0, 3, 2, 5, 13);
      b.wall(26, 3, w - 1, 5, 13);

      // Twin natural waterfalls spilling off north crags into the marsh lagoon!
      b.waterfalls.push({ x: 9, y: 1, w: 2, h: 3, color: 'rgba(70,214,208,0.80)' });
      b.waterfalls.push({ x: 22, y: 1, w: 2, h: 3, color: 'rgba(70,214,208,0.80)' });

      // West rocky landing bank (where canyon ramp arrives from A13 Switchyard)
      b.carve(1, 7, 6, 11, 10);
      b.paintT(2, 7, 5, 7, 5);
      // Northwest elevated islet with weathered Survey Outpost Cabin on pilings!
      b.carve(3, 5, 7, 7, 0);
      b.building(3, 2, 7, 4, 2);

      // Winding timber boardwalk (7) across western marsh channel to Central Survey Island
      b.bridge(6, 9, 11, 10);

      // Irregular central vegetated survey island (organic shape, moss, wildflower tufts, Miya's station)
      b.carve(11, 5, 19, 12, 0);
      b.carve(12, 4, 18, 13, 0);
      b.water(11, 5, 11, 6); b.water(19, 11, 19, 12); // erode corners so island is organic!
      b.paintT(13, 6, 17, 10, 10);
      b.paintT(12, 5, 13, 6, 5);
      b.paintT(17, 5, 18, 7, 5);
      b.paintT(12, 11, 14, 12, 5);
      b.paintT(16, 11, 18, 12, 5);

      // North stone ridge trail climbing past the waterfall toward A17 Highland Ridge
      b.carve(14, 2, 16, 5, 10);
      b.paintT(14, 4, 16, 4, 3);

      // South-central fishing/survey spur pier (for sidequest & exploration loop!)
      b.bridge(14, 13, 16, 15);
      b.bridge(16, 14, 21, 14);
      b.carve(21, 12, 24, 14, 0); // small SE mossy hummock islet with Supply Cache!
      b.paintT(22, 13, 23, 13, 5);

      // East long wooden boardwalk pier spanning the eastern lagoon to A16 Floodgate Pier
      b.bridge(19, 8, 28, 9);
      b.bridge(22, 10, 22, 12); // cross-pier connecting SE hummock back to main boardwalk

      // Three 100% natural outdoor exits (ZERO floating vault doors!):
      b.portal('A13', 1, 9, 'left', 'trail_passage', 'SWITCHYARD RAMP', 'hatch', { frame: false });
      b.portal('A17', 15, 2, 'up', 'trail_passage', 'HIGHLAND RIDGE TRAIL', 'hatch', { frame: false });
      b.portal('A16', 28, 8, 'right', 'bridge_passage', 'FLOODGATE BOARDWALK', 'bulkhead', { frame: false });

      b.anchors.start = [4, 9, 'right'];
      b.anchors.npcs = [[15, 8]]; // Miya greeting party at central survey island
      b.anchors.save = [5, 5]; // Save beacon right beside Survey Outpost Cabin porch!
      b.anchors.crate = [23, 13]; // Supply Cache on the SE marsh islet
      b.anchors.sidequests = [[15, 14]]; // Sidequest beacon on the south survey pier
      b.anchors.scenes = [[14, 9]];
      b.lightShafts.push({ x: 13, y: 0, w: 4, h: 9, color: '#9cf5c8', alpha: 0.13 });
      b.lightShafts.push({ x: 4, y: 0, w: 3, h: 7, color: '#ffe5a8', alpha: 0.10 });
      b.lamps.push(
        { x: 5, y: 5, r: 105, color: '#f8cb7c', flicker: true },
        { x: 15, y: 8, r: 130, color: '#82e896', flicker: false },
        { x: 23, y: 13, r: 90, color: '#72dce8', flicker: false },
        { x: 26, y: 8, r: 95, color: '#82e896', flicker: false }
      );
      break;
    }

    case 'A16': {
      // Floodgate Pier & Pump Station — Marsh Causeway, Pump House & Archive Seal Cliff
      b.water(0, 2, w - 1, h - 1);
      b.wall(0, 0, w - 1, 2, 12);
      b.wall(w - 3, 2, w - 1, h - 1, 12); // eastern cliffside housing the Census Archive entrance!
      b.waterfalls.push({ x: 8, y: 1, w: 2, h: 3, color: 'rgba(64,204,218,0.78)' });
      b.waterfalls.push({ x: 18, y: 1, w: 2, h: 3, color: 'rgba(64,204,218,0.78)' });
      // West arrival boardwalk from A15
      b.bridge(1, 7, 7, 8);
      // Central Pump Station Platform + Roofed Hydro-Pump House
      b.carve(8, 4, 17, 12, 1);
      b.building(10, 2, 15, 4, 2);
      // Twin inspection catwalks flanking the floodgate boss causeway
      b.bridge(18, 6, 23, 9);
      b.carve(23, 5, 25, 10, 1); // Archive threshold terrace built into east cliff!

      b.portal('A15', 1, 7, 'left', 'bridge_passage', 'SURVEY WETLAND PIER', 'bulkhead', { frame: false });
      b.portal('A18', 25, 7, 'right', 'arch_east', 'CENSUS ARCHIVE SEAL', 'exit');

      b.anchors.start = [4, 7, 'right'];
      b.anchors.save = [12, 5];
      b.anchors.battles = [[11, 10]];
      b.anchors.scenes = [[20, 7]]; // Floodgate Warden boss arena on causeway
      b.lightShafts.push({ x: 12, y: 0, w: 3, h: 8, color: '#72dce8', alpha: 0.12 });
      b.lamps.push(
        { x: 12, y: 5, r: 115, color: '#72dce8', flicker: false },
        { x: 24, y: 7, r: 110, color: '#98bfff', flicker: false }
      );
      break;
    }

    case 'A17': {
      // Highland Survey Ridge — Crescent Cliffside Camp Overlooking Dawn Sky
      // Leave upper north & NW open void so dawn_sky clouds & horizon sweep across the ridge!
      b.carve(3, 5, 20, 11, 0);
      b.carve(5, 4, 18, 12, 0);
      b.carve(10, 11, 13, 12, 10); // south descent path to A15
      b.wall(3, 4, 19, 4, 4); // scenic cliff guardrail overlooking sky!
      b.building(15, 5, 19, 7, 2); // small timber ranger lean-to cabin
      b.wall(2, 9, 4, 12, 12); b.wall(19, 10, 21, 12, 12);
      b.paintT(5, 6, 9, 9, 5);
      b.paintT(10, 6, 13, 12, 10);
      b.paintT(11, 11, 12, 11, 3);
      b.portal('A15', 11, 12, 'down', 'trail_passage', 'WETLAND DESCENT', 'hatch', { frame: false });

      b.anchors.start = [11, 10, 'up'];
      b.anchors.bench = [16, 8];
      b.anchors.sidequests = [[7, 7]];
      b.anchors.scenes = [[11, 6], [13, 7], [9, 8], [14, 8]];
      b.lightShafts.push({ x: 8, y: 0, w: 5, h: 9, color: '#ffe8a8', alpha: 0.16 });
      b.lamps.push(
        { x: 16, y: 8, r: 115, color: '#ffe2a8', flicker: true },
        { x: 8, y: 7, r: 100, color: '#ffe2a8', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 6 — CENSUS ARCHIVE (Monumental Vaulted Library & Records Annex)
    // =========================================================================
    case 'A18': {
      // Census Archive Grand Nave — Cross-Shaped Vaulted Library with Partitioned Reading Wings
      b.carve(1, 7, 5, 10, 1); // West grand seal vestibule
      partitionV(b, 6, 3, 14, 8, 2);
      // Central vaulted nave
      b.carve(7, 3, 21, 14, 0);
      // Partitioned North-West & South-West Reading Stack Rooms (real interior walls!)
      partitionH(b, 6, 7, 11, 9, 2);
      partitionH(b, 11, 7, 11, 9, 2);
      // Partitioned North-East & South-East Stack Rooms
      partitionH(b, 6, 17, 21, 19, 2);
      partitionH(b, 11, 17, 21, 19, 2);
      // Ceremonial central carpet runner & illuminated index conduits
      b.paintT(12, 3, 16, 14, 14);
      b.paintT(11, 3, 11, 14, 6);
      b.paintT(17, 3, 17, 14, 6);
      b.paintT(13, 6, 15, 6, 3); // stairs up to north Records Annex seal
      // East exit vestibule toward Return Haven (A20)
      partitionV(b, 22, 3, 14, 8, 2);
      b.carve(23, 7, 26, 10, 1);

      b.portal('A16', 1, 8, 'left', 'arch_west', 'FLOODGATE ARCH', 'exit');
      b.portal('A19', 14, 3, 'up', 'archive_seal', 'SEALED RECORDS ANNEX', 'bulkhead');
      b.portal('A20', 26, 8, 'right', 'arch_east', 'RETURN HAVEN ARCH', 'exit');

      b.anchors.start = [3, 8, 'right'];
      b.anchors.npcs = [[14, 7]]; // Ilen blocking central census steps
      b.anchors.save = [9, 4]; // Save terminal in NW reading room
      b.anchors.crate = [19, 13]; // Supply cache in SE stack alcove
      b.anchors.battles = [[9, 13], [19, 4]];
      b.anchors.scenes = [[14, 9], [14, 11], [13, 8], [15, 8], [14, 13]];
      b.lightShafts.push({ x: 13, y: 1, w: 3, h: 10, color: '#a8c8ff', alpha: 0.13 });
      b.lamps.push(
        { x: 9, y: 4, r: 95, color: '#f2bd75', flicker: false },
        { x: 14, y: 8, r: 130, color: '#98bfff', flicker: false },
        { x: 19, y: 13, r: 95, color: '#f2bd75', flicker: false }
      );
      break;
    }

    case 'A19': {
      // Sealed Records Annex — Intimate Two-Chamber Archival Vault
      b.carve(8, 9, 13, 11, 1); // South entry vestibule
      partitionH(b, 8, 3, 18, 10, 2);
      // Twin north study chambers divided by a central catalog arch
      b.carve(3, 3, 18, 7, 0);
      partitionV(b, 10, 3, 7, 5, 2);
      b.paintT(4, 4, 8, 6, 14);
      b.paintT(12, 4, 17, 6, 14);
      b.portal('A18', 10, 11, 'down', 'south_threshold', 'CENSUS NAVE', 'bulkhead');

      b.anchors.start = [10, 10, 'up'];
      b.anchors.sidequests = [[6, 5], [15, 5]];
      b.anchors.ambient = [12, 9];
      b.lamps.push(
        { x: 6, y: 5, r: 100, color: '#f2bd75', flicker: false },
        { x: 15, y: 5, r: 100, color: '#f2bd75', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 7 — RETURN HAVEN & QUARANTINE SPINE
    // =========================================================================
    case 'A20': {
      // Return Haven Outpost — Fortified Courtyard Shelter Before the Quarantine Gate
      b.wall(0, 0, w - 1, 2, 12);
      b.carve(1, 4, 24, 13, 0);
      // North warm bunkhouse building & South supply depot shack
      b.building(4, 2, 12, 5, 3);
      b.building(15, 11, 21, 13, 2);
      b.wall(2, 11, 5, 13, 12);
      // Cobbled courtyard + warm hearth carpet
      b.paintT(1, 6, 24, 9, 1);
      b.paintT(7, 7, 13, 10, 14);
      b.paintT(6, 11, 10, 12, 5);
      // Heavy East Quarantine Airlock Gatehouse framing exit to A21
      b.wall(22, 4, 24, 6, 0); b.wall(22, 10, 24, 12, 0);
      b.paintT(21, 7, 24, 9, 14);

      b.portal('A18', 1, 7, 'left', 'arch_west', 'CENSUS ARCHIVE', 'bulkhead');
      b.portal('A21', 24, 8, 'right', 'airlock_east', 'QUARANTINE SPINE LOCK', 'bulkhead');

      b.anchors.start = [3, 7, 'right'];
      b.anchors.npcs = [[10, 7], [7, 6]]; // Ves & Talla in courtyard
      b.anchors.bench = [11, 6];
      b.anchors.save = [15, 6];
      b.anchors.crate = [18, 9];
      b.anchors.sidequests = [[8, 11]];
      b.lightShafts.push({ x: 9, y: 0, w: 3, h: 8, color: '#ffdf96', alpha: 0.13 });
      b.lamps.push(
        { x: 9, y: 7, r: 125, color: '#f8cb7c', flicker: false },
        { x: 22, y: 8, r: 100, color: '#f09238', flicker: true }
      );
      break;
    }

    case 'A21': {
      // Quarantine Spine — 3 Sequential High-Security Airlock Chambers with Staggered Baffles!
      // Chamber 1 (West Decon Entry)
      b.carve(1, 4, 8, 12, 0);
      b.paintT(2, 6, 7, 10, 14);
      // Thick Partition Bulkhead 1 (offset upper choke passage!)
      partitionV(b, 9, 3, 13, 5, 2);
      b.wall(10, 3, 10, 4, 0); b.wall(10, 8, 10, 13, 0);
      // Chamber 2 (Central Containment Hall + North Observation Door + WARD-7 Terminal)
      b.carve(11, 3, 19, 13, 0);
      b.paintT(15, 3, 15, 13, 6);
      b.wall(13, 7, 13, 9, 0); b.wall(17, 7, 17, 9, 0); // tactical stealth cover baffles!
      b.paintT(11, 5, 19, 6, 1);
      b.paintT(11, 10, 19, 11, 1);
      // Thick Partition Bulkhead 2 (offset lower choke passage!)
      partitionV(b, 20, 3, 13, 10, 2);
      // Chamber 3 (East Inner Lock & Boss Containment Deck)
      b.carve(21, 4, 28, 12, 0);
      b.paintT(22, 6, 27, 10, 14);

      b.portal('A20', 1, 8, 'left', 'airlock_west', 'RETURN HAVEN LOCK', 'bulkhead');
      b.portal('A22', 15, 3, 'up', 'quarantine_lock', 'OBSERVATION WING', 'bulkhead');
      b.portal('A23', 28, 8, 'right', 'airlock_east', 'CATHEDRAL ANTECHAMBER', 'bulkhead');

      b.anchors.start = [3, 8, 'right'];
      b.anchors.npcs = [[15, 8]]; // WARD-7 interface monolith in central chamber
      b.anchors.save = [5, 5];
      b.anchors.crate = [26, 5];
      b.anchors.sidequests = [[5, 11]];
      b.anchors.battles = [[18, 11]];
      b.anchors.scenes = [[12, 5], [18, 5], [24, 8], [22, 10], [25, 10], [12, 11], [24, 6]];
      b.anchors.drone = { start: [14, 10], zone: [11, 4, 19, 12], waypoints: [[14, 10], [18, 10], [18, 5], [14, 5]] };
      b.lightShafts.push({ x: 14, y: 1, w: 2, h: 7, color: '#ffad52', alpha: 0.11 });
      b.lamps.push(
        { x: 5, y: 8, r: 95, color: '#f09238', flicker: true },
        { x: 15, y: 8, r: 120, color: '#f09238', flicker: false },
        { x: 25, y: 8, r: 110, color: '#98bfff', flicker: false }
      );
      break;
    }

    case 'A22': {
      // Quarantine Observation Wing — Glass-Windowed Viewing Gallery & Isolated Lab Bay
      b.carve(8, 9, 13, 11, 1);
      partitionH(b, 8, 3, 18, 10, 2);
      b.carve(3, 3, 18, 7, 0);
      // Clinical observation window wall dividing West Gallery from East Specimen Bay
      b.wall(10, 3, 10, 4, 9);
      b.wall(10, 7, 10, 7, 9);
      b.paintT(4, 4, 8, 6, 1);
      b.paintT(12, 4, 17, 6, 14);
      b.portal('A21', 10, 11, 'down', 'south_threshold', 'QUARANTINE SPINE', 'bulkhead');

      b.anchors.start = [10, 10, 'up'];
      b.anchors.save = [5, 4];
      b.anchors.ambient = [15, 5];
      b.lamps.push(
        { x: 6, y: 5, r: 100, color: '#72dce8', flicker: false },
        { x: 15, y: 5, r: 105, color: '#72dce8', flicker: true }
      );
      break;
    }

    case 'A23': {
      // Cathedral Antechamber — Solemn Processional Bridge Flanked by Coolant Chasms
      b.water(3, 3, 20, 4);
      b.water(3, 10, 20, 11);
      b.carve(1, 5, 22, 9, 1);
      // Monumental colonnade pillars along processional bridge
      b.wall(7, 5, 7, 5, 0); b.wall(7, 9, 7, 9, 0);
      b.wall(15, 5, 15, 5, 0); b.wall(15, 9, 15, 9, 0);
      b.paintT(2, 7, 21, 7, 14); // ceremonial runner leading up to Cathedral Gate
      b.paintT(18, 6, 18, 8, 3); // grand ascending steps

      b.portal('A21', 1, 7, 'left', 'airlock_west', 'QUARANTINE SPINE', 'bulkhead');
      b.portal('A24', 22, 7, 'right', 'arch_east', 'CONTROL CATHEDRAL', 'bulkhead');

      b.anchors.start = [3, 7, 'right'];
      b.anchors.scenes = [[12, 7]];
      b.lightShafts.push({ x: 11, y: 1, w: 3, h: 8, color: '#b4c8ff', alpha: 0.13 });
      b.lamps.push(
        { x: 5, y: 7, r: 95, color: '#98bfff', flicker: false },
        { x: 19, y: 7, r: 115, color: '#e2a8ff', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 8 — CONTROL CATHEDRAL (Grand Basilica, Core Engine & WARD-7 Sanctum)
    // =========================================================================
    case 'A24': {
      // BENCHMARK #4: A24 Control Cathedral — True Monumental Cruciform Basilica Floor Plan!
      // West Narthex Portico (x:1..5, y:7..10)
      b.carve(1, 7, 5, 10, 1);
      // Grand Narthex Screen Wall dividing portico from main basilica nave
      partitionV(b, 6, 3, 14, 8, 2);

      // Central Basilica Nave + Side Cloister Loops (x:7..22, y:3..14)
      b.carve(7, 3, 22, 14, 0);
      // North Choir Apse recess leading up to Quiet Engine Core (A25)
      b.carve(12, 2, 17, 4, 1);
      // Twin recessed abyssal coolant canals flanking the outer cloister walls + twin waterfalls!
      b.water(7, 3, 9, 5); b.water(7, 12, 9, 14);
      b.water(20, 3, 22, 5); b.water(20, 12, 22, 14);
      b.waterfalls.push({ x: 8, y: 1, w: 2, h: 3, color: 'rgba(128,208,255,0.78)' });
      b.waterfalls.push({ x: 20, y: 1, w: 2, h: 3, color: 'rgba(128,208,255,0.78)' });

      // Monumental Basilica Colonnade Pillars separating Central Nave from Side Cloisters
      for (const px of [10, 14, 18]) {
        b.wall(px, 6, px, 6, 0);
        b.wall(px, 11, px, 11, 0);
      }

      // Ceremonial Nave Runner, Twin Violet Conduits & Stepped Octagonal Sanctuary Dais
      b.paintT(7, 8, 22, 9, 14);
      b.paintT(13, 3, 13, 14, 6);
      b.paintT(16, 3, 16, 14, 6);
      b.paintT(13, 4, 16, 5, 3); // broad ceremonial choir steps up to A25 gate
      b.paintT(11, 7, 18, 10, 1); // central sanctuary dais platform
      b.paintT(12, 8, 17, 9, 14);

      // East Sanctuary Apse Partition leading to WARD-7 Switch Chamber (A26)
      partitionV(b, 23, 3, 14, 8, 2);
      b.carve(24, 6, 28, 11, 1);
      b.paintT(24, 8, 28, 9, 14);

      b.portal('A23', 1, 8, 'left', 'arch_west', 'CATHEDRAL ANTECHAMBER', 'bulkhead');
      b.portal('A25', 14, 2, 'up', 'cathedral_gate', 'QUIET ENGINE CORE', 'bulkhead');
      b.portal('A26', 28, 8, 'right', 'arch_east', 'WARD-7 SANCTUM', 'bulkhead');

      b.anchors.start = [3, 8, 'right'];
      b.anchors.save = [11, 4]; // Save terminal in north cloister chapel
      b.anchors.crate = [11, 13]; // Supply cache in south cloister alcove
      b.anchors.battles = [[19, 13]];
      b.anchors.scenes = [[14, 8], [16, 8], [26, 8]];
      b.anchors.drone = { start: [17, 7], zone: [11, 6, 21, 11], waypoints: [[17, 7], [21, 7], [21, 10], [17, 10]] };
      b.lightShafts.push({ x: 13, y: 0, w: 4, h: 10, color: '#dcb8ff', alpha: 0.15 });
      b.lightShafts.push({ x: 25, y: 1, w: 2, h: 7, color: '#72e8ff', alpha: 0.11 });
      b.lamps.push(
        { x: 4, y: 8, r: 95, color: '#e2a8ff', flicker: false },
        { x: 14, y: 8, r: 145, color: '#e2a8ff', flicker: false },
        { x: 14, y: 4, r: 110, color: '#ff8a8a', flicker: true },
        { x: 26, y: 8, r: 110, color: '#5ce4ff', flicker: false }
      );
      break;
    }

    case 'A25': {
      // Quiet Engine Core Chamber — Suspended Octagonal Reactor Boss Arena Over Abyssal Coolant
      b.water(1, 2, w - 2, h - 3);
      // Octagonal suspended reactor arena
      b.carve(5, 4, 18, 11, 1);
      b.carve(7, 3, 16, 12, 1);
      // South bridge connecting from Cathedral Choir Gate (A24)
      b.bridge(10, 12, 13, 13);
      // Radial power conduits converging on central Quiet Engine Dais
      b.paintT(11, 3, 12, 12, 6);
      b.paintT(8, 6, 15, 9, 14);
      b.paintT(10, 10, 13, 10, 3);
      b.portal('A24', 11, 13, 'down', 'south_threshold', 'CONTROL CATHEDRAL', 'bulkhead');

      b.anchors.start = [11, 11, 'up'];
      b.anchors.scenes = [[11, 7]]; // 3-Phase Quiet Engine Boss encounter
      b.lightShafts.push({ x: 10, y: 0, w: 4, h: 10, color: '#ff8888', alpha: 0.14 });
      b.lamps.push(
        { x: 11, y: 7, r: 145, color: '#ff7070', flicker: true },
        { x: 7, y: 7, r: 90, color: '#e2a8ff', flicker: false },
        { x: 16, y: 7, r: 90, color: '#e2a8ff', flicker: false }
      );
      break;
    }

    case 'A26': {
      // WARD-7 Switch Chamber & Surface Lift — Tapered Ascending High Sanctum
      b.carve(1, 6, 6, 10, 1);
      b.carve(7, 4, 18, 12, 0);
      b.carve(19, 6, 24, 10, 1);
      // Twin ascending stair tiers leading eastward to WARD-7 Switch & Surface Elevator
      b.paintT(8, 5, 8, 11, 3);
      b.paintT(15, 5, 15, 11, 3);
      b.paintT(9, 6, 14, 10, 14);
      b.paintT(16, 7, 23, 9, 14);
      b.wall(10, 4, 10, 4, 0); b.wall(10, 12, 10, 12, 0);
      b.wall(17, 4, 17, 4, 0); b.wall(17, 12, 17, 12, 0);

      b.portal('A24', 1, 8, 'left', 'arch_west', 'CATHEDRAL NAVE', 'bulkhead');
      b.portal('A27', 24, 8, 'right', 'airlock_east', 'SURFACE ELEVATOR', 'exit');

      b.anchors.start = [3, 8, 'right'];
      b.anchors.npcs = [[17, 8]]; // WARD-7 Switch Monolith
      b.anchors.save = [12, 5];
      b.anchors.crate = [12, 11];
      b.anchors.scenes = [[11, 8], [13, 8], [20, 8]];
      b.lightShafts.push({ x: 16, y: 0, w: 3, h: 10, color: '#72f0ff', alpha: 0.15 });
      b.lamps.push(
        { x: 12, y: 8, r: 120, color: '#5ce4ff', flicker: false },
        { x: 18, y: 8, r: 130, color: '#5ce4ff', flicker: false },
        { x: 23, y: 8, r: 100, color: '#ffe2a8', flicker: false }
      );
      break;
    }

    // =========================================================================
    // ACT 9 — SURFACE MORNING (Emerging Into Daylight & First Morning Overlook)
    // =========================================================================
    case 'A27': {
      // Surface Ascent Landing — Bunker Elevator Headhouse Opening Onto Sunlit Mountain Trail
      // Open dawn sky along north/south drop-offs!
      b.carve(1, 5, 24, 11, 0);
      // West armored Surface Elevator Headhouse embedded in hillside!
      b.building(1, 2, 6, 5, 3);
      b.wall(0, 6, 0, 10, 9);
      b.wall(1, 11, 7, 12, 12);
      // Panoramic cliff guardrail on south ridge
      b.wall(8, 12, 24, 12, 4);
      // Sunlit wildflower slopes & packed-earth mountain trail winding east to A28
      b.paintT(7, 5, 14, 6, 5);
      b.paintT(16, 5, 22, 6, 5);
      b.paintT(2, 7, 24, 9, 10);
      b.paintT(13, 7, 14, 9, 3);

      b.portal('A26', 1, 8, 'left', 'airlock_west', 'SURFACE ELEVATOR', 'exit');
      b.portal('A28', 24, 8, 'right', 'trail_passage', 'FIRST MORNING RIDGE', 'exit', { frame: false });

      b.anchors.start = [4, 8, 'right'];
      b.anchors.sidequests = [[11, 6]];
      b.anchors.scenes = [[17, 8]];
      b.lightShafts.push({ x: 9, y: 0, w: 5, h: 10, color: '#ffebb0', alpha: 0.17 });
      b.lightShafts.push({ x: 18, y: 0, w: 4, h: 10, color: '#ffebb0', alpha: 0.16 });
      b.lamps.push(
        { x: 4, y: 6, r: 100, color: '#ffe2a8', flicker: false },
        { x: 16, y: 8, r: 135, color: '#ffe8b0', flicker: false }
      );
      break;
    }

    case 'A28':
    default: {
      // First Morning Overlook — Panoramic Curved Hilltop Promontory Facing Endless Dawn Sky
      b.carve(1, 6, 25, 11, 0);
      b.carve(5, 4, 24, 12, 0);
      b.carve(9, 3, 21, 13, 0);
      // Weathered stone promontory parapet overlooking endless dawn horizon
      b.wall(7, 13, 23, 13, 4);
      b.wall(25, 5, 25, 11, 12);
      b.wall(2, 3, 4, 5, 12);
      // Ancient amphitheater stone steps facing the sunrise + wildflower fields
      b.paintT(1, 7, 12, 9, 10);
      b.paintT(12, 5, 22, 11, 1);
      b.paintT(12, 6, 12, 10, 3);
      b.paintT(6, 4, 10, 6, 5);
      b.paintT(6, 10, 10, 12, 5);
      b.paintT(14, 3, 19, 4, 5);
      b.paintT(18, 6, 22, 10, 14);
      b.paintT(4, 5, 5, 5, 15);

      b.portal('A27', 1, 8, 'left', 'trail_passage', 'SURFACE LANDING', 'exit', { frame: false });

      b.anchors.start = [4, 8, 'right'];
      b.anchors.npcs = [[20, 8]]; // First Morning Messenger facing sunrise
      b.anchors.scenes = [[14, 8], [16, 7], [16, 9], [18, 8]];
      b.lightShafts.push({ x: 8, y: 0, w: 5, h: 11, color: '#ffedb5', alpha: 0.18 });
      b.lightShafts.push({ x: 17, y: 0, w: 6, h: 11, color: '#fff2c4', alpha: 0.18 });
      b.lamps.push(
        { x: 14, y: 8, r: 140, color: '#ffe8b0', flicker: false },
        { x: 21, y: 8, r: 150, color: '#fff0c0', flicker: false }
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
    portalSlots: b.portalSlots,
    anchors: b.anchors,
    skyBackdrop: meta.sky || null
  };
}
