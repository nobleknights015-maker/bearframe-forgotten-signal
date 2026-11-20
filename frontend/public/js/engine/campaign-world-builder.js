// Shared pure-JS Director's Cut v2 campaign world compiler.
// Used identically by both the offline CLI builder (build_full_campaign.mjs)
// and the client-side private campaign installer (campaign-game.js).
// Contains NO screenplay dialogue, lore text, or private story copy.

const ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,95}$/;

export const AREA_META = Object.freeze({
  A00: { w: 24, h: 14, region: 'Stasis Wing',      arch: 'stasis_cryo_bay',   palette: 'stasis_hollow',     theme: 'stasis',     atlas: 'atlas_ruins_flora',          altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#72dce8', sky: 'abyss_vault',      act: 0, mx: 6,  my: 54 },
  A01: { w: 20, h: 12, region: 'Stasis Wing',      arch: 'stasis_cryo_bay',   palette: 'stasis_hollow',     theme: 'stasis',     atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_ruins_flora',          doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#72dce8', sky: 'abyss_vault',      act: 0, mx: 12, my: 54 },
  A02: { w: 26, h: 15, region: 'Rootway',          arch: 'rootway_ravine',    palette: 'rootway_ruins',     theme: 'rootway',    atlas: 'atlas_ruins_flora',          altAtlas: 'atlas_wetland_water',        doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#82e896', sky: 'canopy_ruins',     act: 1, mx: 18, my: 54 },
  A03: { w: 24, h: 14, region: 'Rootway',          arch: 'filter_basin',      palette: 'flooded_quay',      theme: 'quay',       atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_wetland_water',        doorStyle: 'bulkhead', doorArt: 'sluice_gate',     lampColor: '#72dce8', sky: 'wetland_mist',     act: 1, mx: 24, my: 54 },
  A04: { w: 20, h: 13, region: 'Rootway',          arch: 'rootway_ravine',    palette: 'rootway_ruins',     theme: 'rootway',    atlas: 'atlas_ruins_flora',          altAtlas: 'atlas_wasteland_exterior',   doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#f2bd75', sky: 'canopy_ruins',     act: 1, mx: 18, my: 34 },
  A05: { w: 24, h: 15, region: 'Relay Court',      arch: 'relay_colonnade',   palette: 'relay_court',       theme: 'relay',      atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_archive_cathedral',    doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#92d6ea', sky: 'abyss_vault',      act: 2, mx: 30, my: 54 },
  A06: { w: 22, h: 14, region: 'Relay Court',      arch: 'relay_colonnade',   palette: 'mail_vault',        theme: 'mail',       atlas: 'atlas_settlement_interiors', altAtlas: 'atlas_archive_cathedral',    doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f2bd75', sky: 'abyss_vault',      act: 2, mx: 36, my: 46 },
  A07: { w: 20, h: 13, region: 'Relay Court',      arch: 'relay_colonnade',   palette: 'relay_court',       theme: 'relay',      atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#92d6ea', sky: 'abyss_vault',      act: 2, mx: 30, my: 72 },
  A08: { w: 22, h: 14, region: 'Relay Court',      arch: 'filter_basin',      palette: 'flooded_quay',      theme: 'quay',       atlas: 'atlas_wetland_water',        altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'water_lock',      lampColor: '#72dce8', sky: 'wetland_mist',     act: 2, mx: 41, my: 54 },
  A09: { w: 26, h: 16, region: 'Lantern Shelf',    arch: 'lantern_plaza',     palette: 'lantern_shelter',   theme: 'lantern',    atlas: 'atlas_shelter_warmth',       altAtlas: 'atlas_settlement_interiors', doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f8cb7c', sky: 'wasteland_canyon', act: 3, mx: 46, my: 62 },
  A10: { w: 22, h: 14, region: 'Lantern Shelf',    arch: 'relay_colonnade',   palette: 'lantern_shelter',   theme: 'lantern',    atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_shelter_warmth',       doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f8cb7c', sky: 'abyss_vault',      act: 3, mx: 52, my: 62 },
  A11: { w: 20, h: 13, region: 'Lantern Shelf',    arch: 'lantern_plaza',     palette: 'mail_vault',        theme: 'mail',       atlas: 'atlas_settlement_interiors', altAtlas: 'atlas_shelter_warmth',       doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f2bd75', sky: 'abyss_vault',      act: 3, mx: 46, my: 38 },
  A12: { w: 26, h: 14, region: 'Broken Sky-Rail',  arch: 'sky_viaduct',       palette: 'broken_rail',       theme: 'relay',      atlas: 'atlas_sky_rail',             altAtlas: 'atlas_wasteland_exterior',   doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#92d6ea', sky: 'wasteland_canyon', act: 4, mx: 58, my: 54 },
  A13: { w: 24, h: 14, region: 'Broken Sky-Rail',  arch: 'sky_viaduct',       palette: 'wasteland_ridge',   theme: 'wasteland',  atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_sky_rail',             doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 4, mx: 63, my: 46 },
  A14: { w: 20, h: 13, region: 'Broken Sky-Rail',  arch: 'sky_viaduct',       palette: 'broken_rail',       theme: 'wasteland',  atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_sky_rail',             doorStyle: 'hatch',    doorArt: 'service',         lampColor: '#f2bd75', sky: 'wasteland_canyon', act: 4, mx: 55, my: 78 },
  A15: { w: 26, h: 15, region: 'Survey Wetland',   arch: 'wetland_boardwalk', palette: 'survey_wetland',    theme: 'wetland',    atlas: 'atlas_wetland_water',        altAtlas: 'atlas_ruins_flora',          doorStyle: 'bulkhead', doorArt: 'sluice_gate',     lampColor: '#82e896', sky: 'wetland_mist',     act: 5, mx: 68, my: 54 },
  A16: { w: 24, h: 14, region: 'Survey Wetland',   arch: 'filter_basin',      palette: 'wetland_pier',      theme: 'wetland',    atlas: 'atlas_wetland_water',        altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'water_lock',      lampColor: '#72dce8', sky: 'wetland_mist',     act: 5, mx: 73, my: 54 },
  A17: { w: 22, h: 13, region: 'Survey Wetland',   arch: 'dawn_overlook',     palette: 'wasteland_ridge',   theme: 'wasteland',  atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_shelter_warmth',       doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 5, mx: 68, my: 32 },
  A18: { w: 26, h: 16, region: 'Census Archive',   arch: 'archive_nave',      palette: 'census_archive',    theme: 'archive',    atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_settlement_interiors', doorStyle: 'exit',     doorArt: 'archive_seal',    lampColor: '#98bfff', sky: 'abyss_vault',      act: 6, mx: 78, my: 54 },
  A19: { w: 20, h: 13, region: 'Census Archive',   arch: 'archive_nave',      palette: 'mail_vault',        theme: 'mail',       atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_settlement_interiors', doorStyle: 'bulkhead', doorArt: 'archive_seal',    lampColor: '#f2bd75', sky: 'abyss_vault',      act: 6, mx: 78, my: 34 },
  A20: { w: 22, h: 14, region: 'Return Haven',     arch: 'lantern_plaza',     palette: 'lantern_shelter',   theme: 'lantern',    atlas: 'atlas_settlement_interiors', altAtlas: 'atlas_shelter_warmth',       doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f8cb7c', sky: 'wasteland_canyon', act: 7, mx: 83, my: 54 },
  A21: { w: 26, h: 16, region: 'Quarantine Spine', arch: 'quarantine_spine',  palette: 'quarantine_spine',  theme: 'quarantine', atlas: 'atlas_quarantine_void',      altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'quarantine_lock', lampColor: '#f09238', sky: 'abyss_vault',      act: 7, mx: 88, my: 54 },
  A22: { w: 20, h: 13, region: 'Quarantine Spine', arch: 'quarantine_spine',  palette: 'quarantine_spine',  theme: 'quarantine', atlas: 'atlas_quarantine_void',      altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'quarantine_lock', lampColor: '#72dce8', sky: 'abyss_vault',      act: 7, mx: 88, my: 34 },
  A23: { w: 20, h: 13, region: 'Quarantine Spine', arch: 'quarantine_spine',  palette: 'quarantine_spine',  theme: 'quarantine', atlas: 'atlas_quarantine_void',      altAtlas: 'atlas_archive_cathedral',    doorStyle: 'bulkhead', doorArt: 'cathedral_gate',  lampColor: '#98bfff', sky: 'abyss_vault',      act: 7, mx: 92, my: 54 },
  A24: { w: 26, h: 16, region: 'Control Cathedral',arch: 'cathedral_sanctum', palette: 'control_cathedral', theme: 'cathedral',  atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'cathedral_gate',  lampColor: '#e2a8ff', sky: 'abyss_vault',      act: 8, mx: 95, my: 54 },
  A25: { w: 24, h: 14, region: 'Control Cathedral',arch: 'cathedral_sanctum', palette: 'control_cathedral', theme: 'cathedral',  atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'cathedral_gate',  lampColor: '#ff7070', sky: 'abyss_vault',      act: 8, mx: 95, my: 34 },
  A26: { w: 22, h: 15, region: 'Control Cathedral',arch: 'cathedral_sanctum', palette: 'control_cathedral', theme: 'cathedral',  atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_bunker_machinery',     doorStyle: 'exit',     doorArt: 'elevator',        lampColor: '#5ce4ff', sky: 'abyss_vault',      act: 8, mx: 95, my: 72 },
  A27: { w: 22, h: 13, region: 'Surface Morning',  arch: 'dawn_overlook',     palette: 'sky_morning',       theme: 'sky',        atlas: 'atlas_sky_rail',             altAtlas: 'atlas_wasteland_exterior',   doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 9, mx: 89, my: 82 },
  A28: { w: 24, h: 14, region: 'Surface Morning',  arch: 'dawn_overlook',     palette: 'sky_morning',       theme: 'sky',        atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_sky_rail',             doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 9, mx: 95, my: 86 }
});

export const WORLD_EDGES = Object.freeze([
  ['A00', 'A01', 'right', 'aux_relay_open'],
  ['A01', 'A02', 'right', null],
  ['A02', 'A03', 'right', null],
  ['A02', 'A04', 'up', null],
  ['A03', 'A05', 'right', 'boss_b01_defeated'],
  ['A05', 'A06', 'right', null],
  ['A05', 'A07', 'down', null],
  ['A06', 'A08', 'right', null],
  ['A07', 'A09', 'right', null],
  ['A08', 'A09', 'right', 'boss_b02_defeated'],
  ['A09', 'A10', 'right', null],
  ['A09', 'A11', 'up', null],
  ['A09', 'A14', 'down', null],
  ['A10', 'A12', 'right', 'boss_b03_defeated'],
  ['A12', 'A13', 'right', null],
  ['A12', 'A14', 'down', null],
  ['A13', 'A15', 'right', 'boss_b04_resolved'],
  ['A15', 'A16', 'right', null],
  ['A15', 'A17', 'up', null],
  ['A16', 'A18', 'right', 'boss_b05_resolved'],
  ['A18', 'A19', 'up', null],
  ['A18', 'A20', 'right', 'boss_b06_defeated'],
  ['A20', 'A21', 'right', null],
  ['A21', 'A22', 'up', null],
  ['A21', 'A23', 'right', null],
  ['A23', 'A24', 'right', 'boss_b07_defeated'],
  ['A24', 'A25', 'up', null],
  ['A24', 'A26', 'right', null],
  ['A26', 'A27', 'right', 'final_resolution_selected'],
  ['A27', 'A28', 'right', null]
]);
const EDGES = WORLD_EDGES;

const oppDir = { right: 'left', left: 'right', up: 'down', down: 'up' };

const ATLAS_CROPS = {
  atlas_ruins_flora: {
    bg: [
      { sx: 0, sy: 96, sw: 64, sh: 64 },
      { sx: 64, sy: 96, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 },
      { sx: 256, sy: 0, sw: 64, sh: 64 },
      { sx: 256, sy: 96, sw: 64, sh: 64 }
    ],
    fg: [{ sx: 416, sy: 0, sw: 64, sh: 64 }],
    ground: [
      { sx: 320, sy: 0, sw: 32, sh: 32 },
      { sx: 352, sy: 0, sw: 64, sh: 32 },
      { sx: 128, sy: 96, sw: 64, sh: 32 },
      { sx: 192, sy: 96, sw: 64, sh: 32 }
    ]
  },
  atlas_bunker_machinery: {
    bg: [
      { sx: 128, sy: 0, sw: 64, sh: 64 },
      { sx: 0, sy: 96, sw: 64, sh: 64 },
      { sx: 64, sy: 96, sw: 64, sh: 64 },
      { sx: 192, sy: 0, sw: 64, sh: 64 },
      { sx: 0, sy: 0, sw: 32, sh: 64 }
    ],
    fg: [{ sx: 192, sy: 96, sw: 64, sh: 64 }],
    ground: [
      { sx: 256, sy: 0, sw: 64, sh: 32 },
      { sx: 320, sy: 0, sw: 64, sh: 32 },
      { sx: 128, sy: 96, sw: 64, sh: 32 }
    ]
  },
  atlas_shelter_warmth: {
    bg: [
      { sx: 0, sy: 96, sw: 64, sh: 64 },
      { sx: 64, sy: 96, sw: 64, sh: 64 },
      { sx: 32, sy: 0, sw: 64, sh: 64 },
      { sx: 256, sy: 0, sw: 64, sh: 64 },
      { sx: 0, sy: 0, sw: 32, sh: 64 }
    ],
    fg: [{ sx: 128, sy: 96, sw: 64, sh: 64 }],
    ground: [
      { sx: 160, sy: 0, sw: 96, sh: 64 },
      { sx: 96, sy: 0, sw: 64, sh: 32 }
    ]
  },
  atlas_archive_cathedral: {
    bg: [
      { sx: 0, sy: 96, sw: 64, sh: 64 },
      { sx: 224, sy: 0, sw: 32, sh: 64 }
    ],
    fg: [{ sx: 160, sy: 96, sw: 64, sh: 64 }],
    ground: [
      { sx: 160, sy: 0, sw: 64, sh: 32 },
      { sx: 64, sy: 96, sw: 96, sh: 32 }
    ]
  },
  atlas_sky_rail: {
    bg: [
      { sx: 0, sy: 0, sw: 128, sh: 64 },
      { sx: 64, sy: 96, sw: 64, sh: 64 },
      { sx: 288, sy: 0, sw: 32, sh: 64 }
    ],
    fg: [{ sx: 128, sy: 96, sw: 64, sh: 64 }],
    ground: [
      { sx: 0, sy: 96, sw: 64, sh: 32 },
      { sx: 192, sy: 0, sw: 64, sh: 32 },
      { sx: 256, sy: 0, sw: 32, sh: 32 }
    ]
  },
  atlas_wetland_water: {
    bg: [
      { sx: 0, sy: 0, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 },
      { sx: 128, sy: 0, sw: 64, sh: 64 }
    ],
    fg: [{ sx: 320, sy: 0, sw: 64, sh: 64 }],
    ground: [
      { sx: 192, sy: 0, sw: 64, sh: 32 },
      { sx: 256, sy: 0, sw: 64, sh: 32 }
    ]
  },
  atlas_quarantine_void: {
    bg: [
      { sx: 0, sy: 0, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 },
      { sx: 128, sy: 0, sw: 64, sh: 64 }
    ],
    fg: [{ sx: 256, sy: 0, sw: 64, sh: 64 }],
    ground: [
      { sx: 192, sy: 0, sw: 64, sh: 32 }
    ]
  },
  atlas_wasteland_exterior: {
    bg: [
      { sx: 0, sy: 0, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 },
      { sx: 128, sy: 0, sw: 64, sh: 64 },
      { sx: 256, sy: 0, sw: 64, sh: 64 }
    ],
    fg: [],
    ground: [
      { sx: 192, sy: 0, sw: 64, sh: 32 }
    ]
  },
  atlas_settlement_interiors: {
    bg: [
      { sx: 0, sy: 0, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 },
      { sx: 128, sy: 0, sw: 64, sh: 64 },
      { sx: 256, sy: 0, sw: 64, sh: 64 }
    ],
    fg: [],
    ground: [
      { sx: 192, sy: 0, sw: 64, sh: 32 }
    ]
  }
};

const SCENE_AREA = {
  'SC-000': 'A00', 'SC-001': 'A00', 'SC-002': 'A00', 'SC-003': 'A00', 'SC-048': 'A00', 'SC-004': 'A00',
  'SC-005': 'A02', 'SC-006': 'A02',
  'SC-007': 'A03', 'SC-008': 'A03', 'SC-009': 'A03',
  'SC-010': 'A05', 'SC-011': 'A05',
  'SC-012': 'A06', 'SC-049': 'A06',
  'SC-013': 'A08', 'SC-014': 'A05',
  'SC-015': 'A09', 'SC-016': 'A09', 'SC-050': 'A09',
  'SC-017': 'A10',
  'SC-018': 'A09', 'SC-051': 'A09', 'SC-060': 'A09',
  'SC-019': 'A12', 'SC-020': 'A12',
  'SC-021': 'A13', 'SC-052': 'A13', 'SC-022': 'A13',
  'SC-023': 'A15', 'SC-024': 'A16',
  'SC-025': 'A17', 'SC-061': 'A17', 'SC-026': 'A17', 'SC-053': 'A17',
  'SC-027': 'A18', 'SC-028': 'A18', 'SC-054': 'A18', 'SC-029': 'A18', 'SC-030': 'A18', 'SC-055': 'A18',
  'SC-031': 'A20',
  'SC-032': 'A21', 'SC-033': 'A21', 'SC-062': 'A21',
  'SC-034': 'A23',
  'SC-056': 'A21', 'SC-035': 'A21', 'SC-036': 'A21', 'SC-037': 'A21', 'SC-057': 'A21',
  'SC-038': 'A24', 'SC-039': 'A24', 'SC-058': 'A24',
  'SC-040': 'A25',
  'SC-063': 'A26', 'SC-041': 'A26', 'SC-042': 'A26', 'SC-043': 'A26',
  'SC-044': 'A27',
  'SC-045': 'A28', 'SC-046': 'A28', 'SC-059': 'A28', 'SC-047': 'A28'
};

const AREA_ENTRY_TRIGGER = {
  A02: 'ENTER_ROOTWAY',
  A09: 'ENTER_LANTERN_SHELF',
  A12: 'ENTER_BROKEN_LINE',
  A15: 'ENTER_SURVEY_EDGE',
  A18: 'ENTER_CENSUS_ARCHIVE',
  A24: 'act7_complete'
};

const AREA_CRATES = {
  A00: { id: 'crate_a00', flag: 'crate_a00_kit', grant: { 'repair-kit': 2, 'coolant-pack': 1 } },
  A02: { id: 'crate_a02', flag: 'crate_a02_wrench', grant: { 'calibrated-wrench': 1, 'patched-plating': 1 } },
  A04: { id: 'crate_a04', flag: 'crate_a04_coolant', grant: { 'coolant-pack': 2, 'repair-kit': 1 } },
  A06: { id: 'crate_a06', flag: 'crate_a06_blade', grant: { 'legacy-blade': 1, 'echo-link': 1 } },
  A09: { id: 'crate_a09', flag: 'crate_a09_charm', grant: { 'noll-lantern-charm': 1, 'spare-cell': 1 } },
  A12: { id: 'crate_a12', flag: 'crate_a12_weave', grant: { 'insulation-weave': 1, 'signal-conductor': 1 } },
  A15: { id: 'crate_a15', flag: 'crate_a15_emitter', grant: { 'foundry-module': 1, 'spare-cell': 1 } },
  A18: { id: 'crate_a18', flag: 'crate_a18_stamp', grant: { 'unsent-seal': 1, 'coolant-pack': 2 } },
  A20: { id: 'crate_a20', flag: 'crate_a20_shroud', grant: { 'lantern-shroud': 1, 'spare-cell': 1 } },
  A21: { id: 'crate_a21', flag: 'crate_a21_pike', grant: { 'resonance-pike': 1, 'survey-emitter': 1 } },
  A24: { id: 'crate_a24', flag: 'crate_a24_carapace', grant: { 'ward-carapace': 1, 'spare-cell': 2 } },
  A26: { id: 'crate_a26', flag: 'crate_a26_cell', grant: { 'sky-compass': 1, 'spare-cell': 2 } }
};

const SIDEQUEST_AREA = {
  'SQ-01': 'A06', 'SQ-02': 'A09', 'SQ-03': 'A09', 'SQ-04': 'A04',
  'SQ-05': 'A09', 'SQ-06': 'A09', 'SQ-07': 'A19', 'SQ-08': 'A11',
  'SQ-09': 'A19', 'SQ-10': 'A15', 'SQ-11': 'A12', 'SQ-12': 'A09',
  'SQ-13': 'A27', 'SQ-14': 'A21', 'SQ-15': 'A13', 'SQ-16': 'A09',
  'SQ-17': 'A09', 'SQ-18': 'A17', 'SQ-19': 'A11', 'SQ-20': 'A20'
};

const AREA_NPCS = {
  A00: [{ id: 'npc_guardian', artId: 'npc_guardian', label: 'GUARDIAN', trigger: 'STEP_INTO_GUARDIAN_RANGE', sceneId: 'SC-001', dir: 'down' }],
  A02: [{ id: 'npc_pica_trapped', artId: 'ghostgrid_utility_pica', label: 'PICA', trigger: 'INTERACT_PICA_TRAP', sceneId: 'SC-006', dir: 'right' }],
  A05: [{ id: 'npc_rill_trapped', artId: 'echo_industrial_maintenance', label: 'RILL', trigger: 'POWER_SHUTTERS', sceneId: 'SC-011', dir: 'down' }],
  A09: [
    { id: 'npc_ves_a09', artId: 'npc_ves', label: 'VES', trigger: 'TALK_VES', sceneId: 'SC-016', dir: 'left' },
    { id: 'npc_noll_a09', artId: 'npc_noll', label: 'NOLL', trigger: 'OPTIONAL_REPAIR_LAMP', sceneId: 'SC-060', dir: 'down' },
    { id: 'npc_ilen_a09', artId: 'npc_ilen', label: 'ILEN', trigger: 'APPROACH_ARCHIVE_SEAL', sceneId: 'SC-050', dir: 'left' }
  ],
  A15: [{ id: 'npc_miya_a15', artId: 'bearframe_exploration_miya', label: 'MIYA', trigger: 'ENTER_SURVEY_EDGE', sceneId: 'SC-023', dir: 'left' }],
  A18: [{ id: 'npc_ilen_a18', artId: 'npc_ilen', label: 'ILEN', trigger: 'ILEN_BLOCKS_CENSUS', sceneId: 'SC-055', dir: 'down' }],
  A20: [
    { id: 'npc_ves_a20', artId: 'npc_ves', label: 'VES', trigger: 'TALK_TO_VES_WITH_PROOF_MISSION', sceneId: 'SC-031', dir: 'left' },
    { id: 'npc_talla_a20', artId: 'npc_talla', label: 'TALLA', ambientArea: 'A20', dir: 'down' }
  ],
  A21: [{ id: 'npc_ward7_a21', artId: 'ward7_monolith', label: 'WARD-7 INTERFACE', trigger: 'CONTACT_WARD7', sceneId: 'SC-035', dir: 'down' }],
  A26: [{ id: 'npc_ward7_a26', artId: 'ward7_monolith', label: 'WARD-7 SWITCH', trigger: 'BOSS_DEFEATED_AND_PROOFS_PRESENT', sceneId: 'SC-041', dir: 'down' }],
  A28: [{ id: 'npc_messenger_a28', artId: 'echo_messenger_old', label: 'FIRST MORNING', trigger: 'EPILOGUE', sceneId: 'SC-047', dir: 'down' }]
};

const NON_MANDATORY_BATTLES = new Set([
  'EN-001', 'EN-004', 'EN-008', 'EN-009', 'EN-012', 'EN-014',
  'EN-018', 'EN-022', 'EN-023', 'EN-027', 'EN-029', 'EN-034', 'EN-038', 'EN-054'
]);

const STEALTH_CONFIG = {
  A03: { zoneId: 'a03_filter_watch', conseq: 'encounter', enc: 'EN-004' },
  A05: { zoneId: 'a05_shutter_lane', conseq: 'alarm', enc: null },
  A12: { zoneId: 'a12_rail_watch', conseq: 'encounter', enc: 'EN-018' },
  A21: { zoneId: 'a21_spine_watch', conseq: 'encounter', enc: 'EN-034' },
  A24: { zoneId: 'a24_catwalk_watch', conseq: 'encounter', enc: 'EN-038' }
};

const BATTLE_ROSTER = {
  'EN-001': { trigger: 'FIGHT_EN_001', xp: 25, items: { 'repair-kit': 1 }, enemies: [{ id: 'crawler_1', artId: 'grid_sump_crab', name: 'Filter Crawler', hp: 28, maxHp: 28, attack: 8, defense: 2, speed: 9 }] },
  'EN-004': { trigger: 'FIGHT_EN_004', xp: 30, items: { 'coolant-pack': 1 }, enemies: [{ id: 'watcher_a03', artId: 'ward_micro_drone', name: 'Filter Watcher', hp: 32, maxHp: 32, attack: 9, defense: 3, speed: 12 }] },
  'EN-005': { trigger: null, xp: 60, items: { 'repair-kit': 1, 'coolant-pack': 1 }, enemies: [{ id: 'fuse_warden', artId: 'boss_fuse_warden', name: 'Fuse Warden', hp: 64, maxHp: 64, attack: 12, defense: 4, speed: 10, tactics: 'charged-strike' }] },
  'EN-008': { trigger: 'FIGHT_EN_008', xp: 40, items: { 'repair-kit': 1 }, enemies: [
    { id: 'sorter_1', artId: 'grid_scaffold_rig', name: 'Sorter Arm A', hp: 34, maxHp: 34, attack: 10, defense: 3, speed: 10 },
    { id: 'sorter_2', artId: 'grid_scaffold_rig', name: 'Sorter Arm B', hp: 34, maxHp: 34, attack: 10, defense: 3, speed: 9 }
  ]},
  'EN-009': { trigger: 'FIGHT_EN_009', xp: 45, items: { 'coolant-pack': 1 }, enemies: [
    { id: 'skimmer_1', artId: 'grid_sump_crab', name: 'Silt Skimmer A', hp: 36, maxHp: 36, attack: 11, defense: 3, speed: 11 },
    { id: 'skimmer_2', artId: 'grid_sump_crab', name: 'Silt Skimmer B', hp: 36, maxHp: 36, attack: 11, defense: 3, speed: 10 }
  ]},
  'EN-010': { trigger: null, xp: 85, items: { 'spare-cell': 1 }, enemies: [{ id: 'quay_grapple', artId: 'boss_quay_grapple', name: 'Quay Grapple', hp: 96, maxHp: 96, attack: 15, defense: 5, speed: 11, tactics: 'charged-strike' }] },
  'EN-012': { trigger: 'FIGHT_EN_012', xp: 55, items: { 'coolant-pack': 1 }, enemies: [
    { id: 'wisp_1', artId: 'grid_turbine_mite', name: 'Coolant Wisp A', hp: 40, maxHp: 40, attack: 12, defense: 3, speed: 14 },
    { id: 'wisp_2', artId: 'grid_turbine_mite', name: 'Coolant Wisp B', hp: 40, maxHp: 40, attack: 12, defense: 3, speed: 13 }
  ]},
  'EN-014': { trigger: 'FIGHT_EN_014', xp: 70, items: { 'repair-kit': 1 }, enemies: [
    { id: 'runner_1', artId: 'grid_sweeper', name: 'Maint Runner A', hp: 44, maxHp: 44, attack: 13, defense: 4, speed: 12 },
    { id: 'turret_1', artId: 'grid_perimeter_turret', name: 'Relay Turret', hp: 48, maxHp: 48, attack: 14, defense: 6, speed: 8 }
  ]},
  'EN-015': { trigger: null, xp: 110, items: { 'spare-cell': 1, 'lantern-shroud': 1 }, enemies: [{ id: 'reg_auditor', artId: 'boss_registry_auditor', name: 'Registry Auditor', hp: 125, maxHp: 125, attack: 17, defense: 6, speed: 12, tactics: 'charged-strike' }] },
  'EN-018': { trigger: 'FIGHT_EN_018', xp: 80, items: { 'coolant-pack': 1 }, enemies: [
    { id: 'clamp_1', artId: 'grid_rail_walker', name: 'Rail Clamp A', hp: 52, maxHp: 52, attack: 15, defense: 5, speed: 12 },
    { id: 'clamp_2', artId: 'grid_rail_walker', name: 'Rail Clamp B', hp: 52, maxHp: 52, attack: 15, defense: 5, speed: 11 }
  ]},
  'EN-020': { trigger: null, xp: 130, items: { 'spare-cell': 1 }, enemies: [{ id: 'switchyard_mast', artId: 'boss_switchyard_mast', name: 'Switchyard Mast', hp: 148, maxHp: 148, attack: 19, defense: 6, speed: 13, tactics: 'charged-strike' }] },
  'EN-022': { trigger: 'FIGHT_EN_022', xp: 90, items: { 'repair-kit': 2 }, enemies: [
    { id: 'hatch_1', artId: 'grid_shutter_drone', name: 'Defense Hatch A', hp: 56, maxHp: 56, attack: 16, defense: 5, speed: 13 },
    { id: 'hatch_2', artId: 'grid_shutter_drone', name: 'Defense Hatch B', hp: 56, maxHp: 56, attack: 16, defense: 5, speed: 12 }
  ]},
  'EN-023': { trigger: 'FIGHT_EN_023', xp: 95, items: { 'coolant-pack': 1 }, enemies: [
    { id: 'silt_a16', artId: 'grid_sump_crab', name: 'Silt Skimmer', hp: 58, maxHp: 58, attack: 17, defense: 5, speed: 13 },
    { id: 'jet_a16', artId: 'grid_pump_frame', name: 'Pressure Jet', hp: 62, maxHp: 62, attack: 16, defense: 6, speed: 11 }
  ]},
  'EN-025': { trigger: null, xp: 150, items: { 'spare-cell': 1 }, enemies: [
    { id: 'flood_l', artId: 'boss_floodgate_warden', name: 'Floodgate Left', hp: 90, maxHp: 90, attack: 18, defense: 6, speed: 12, tactics: 'charged-strike' },
    { id: 'flood_r', artId: 'boss_floodgate_warden', name: 'Floodgate Right', hp: 90, maxHp: 90, attack: 18, defense: 6, speed: 11 }
  ]},
  'EN-027': { trigger: 'FIGHT_EN_027', xp: 110, items: { 'coolant-pack': 1 }, enemies: [
    { id: 'arch_1', artId: 'grid_census_clerk', name: 'Archive Sentry A', hp: 66, maxHp: 66, attack: 18, defense: 6, speed: 13 },
    { id: 'arch_2', artId: 'grid_census_clerk', name: 'Archive Sentry B', hp: 66, maxHp: 66, attack: 18, defense: 6, speed: 12 }
  ]},
  'EN-029': { trigger: 'FIGHT_EN_029', xp: 120, items: { 'spare-cell': 1 }, enemies: [
    { id: 'scan_1', artId: 'grid_telemetry_eye', name: 'Counting Scanner', hp: 64, maxHp: 64, attack: 19, defense: 5, speed: 15 },
    { id: 'turret_a18', artId: 'grid_perimeter_turret', name: 'Hall Turret', hp: 74, maxHp: 74, attack: 20, defense: 7, speed: 9 }
  ]},
  'EN-030': { trigger: null, xp: 175, items: { 'spare-cell': 1 }, enemies: [{ id: 'counting_tower', artId: 'boss_counting_tower', name: 'Counting Tower', hp: 195, maxHp: 195, attack: 22, defense: 8, speed: 12, tactics: 'charged-strike' }] },
  'EN-034': { trigger: 'FIGHT_EN_034', xp: 130, items: { 'repair-kit': 2 }, enemies: [
    { id: 'qwatch_1', artId: 'grid_quarantine_unit', name: 'Quarantine Watcher', hp: 72, maxHp: 72, attack: 21, defense: 6, speed: 14 },
    { id: 'qclamp_1', artId: 'grid_lock_sentinel', name: 'Spine Clamp', hp: 78, maxHp: 78, attack: 20, defense: 7, speed: 11 }
  ]},
  'EN-037': { trigger: null, xp: 195, items: { 'spare-cell': 2 }, enemies: [{ id: 'ward_sentinel', artId: 'boss_ward_sentinel', name: 'Ward Sentinel', hp: 220, maxHp: 220, attack: 24, defense: 8, speed: 14, tactics: 'charged-strike' }] },
  'EN-038': { trigger: 'FIGHT_EN_038', xp: 140, items: { 'coolant-pack': 2 }, enemies: [
    { id: 'reg_1', artId: 'grid_cathedral_guard', name: 'Current Regulator A', hp: 82, maxHp: 82, attack: 22, defense: 7, speed: 13 },
    { id: 'reg_2', artId: 'grid_cathedral_guard', name: 'Current Regulator B', hp: 82, maxHp: 82, attack: 22, defense: 7, speed: 12 }
  ]},
  'EN-041': { trigger: null, xp: 160, items: { 'spare-cell': 1 }, enemies: [{ id: 'qe_stage1', artId: 'boss_quiet_engine', name: 'Quiet Engine I', hp: 165, maxHp: 165, attack: 24, defense: 8, speed: 14, tactics: 'charged-strike' }] },
  'EN-042': { trigger: null, xp: 180, items: { 'spare-cell': 1 }, enemies: [{ id: 'qe_stage2', artId: 'boss_quiet_engine', name: 'Quiet Engine II', hp: 190, maxHp: 190, attack: 26, defense: 8, speed: 15, tactics: 'charged-strike' }] },
  'EN-043': { trigger: null, xp: 240, items: { 'spare-cell': 2 }, enemies: [{ id: 'qe_stage3', artId: 'boss_quiet_engine', name: 'Quiet Engine Core', hp: 245, maxHp: 245, attack: 28, defense: 9, speed: 16, tactics: 'charged-strike' }] },
  'EN-054': { trigger: 'FIGHT_EN_054', xp: 155, items: { 'spare-cell': 2 }, enemies: [
    { id: 'cache_reg', artId: 'grid_vault_warden', name: 'Vault Regulator', hp: 92, maxHp: 92, attack: 23, defense: 8, speed: 13 },
    { id: 'cache_hatch', artId: 'grid_shutter_drone', name: 'Defense Hatch', hp: 70, maxHp: 70, attack: 20, defense: 6, speed: 14 }
  ]}
};

function buildBespokeAreaBlueprint(id, meta) {
  const { w, h, arch, theme } = meta;
  const col = new Array(w * h).fill(0);
  const terr = new Array(w * h).fill(0);
  const waterfalls = [];
  const lightShafts = [];

  const setC = (x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) col[y * w + x] = v; };
  const setT = (x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) terr[y * w + x] = v; };
  const fillC = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setC(x, y, v); };
  const fillT = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setT(x, y, v); };

  // Outer perimeter masonry (2 rows north for tall facade/machinery, 2 rows south for framing)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y <= 1 || y >= h - 2 || x <= 0 || x >= w - 1) setC(x, y, 1);
    }
  }

  const midX = Math.floor(w / 2);
  const midY = Math.floor(h / 2);

  if (arch === 'stasis_cryo_bay') {
    // Stepped cryo-wing alcoves, glowing central power conduit, raised upper maintenance deck with twin stairs
    fillC(2, 2, 3, 2, 1);
    fillC(w - 4, 2, w - 3, 2, 1);
    fillC(midX - 1, 2, midX, 2, 1);
    fillT(midX, 3, midX, h - 3, 6);
    fillT(2, midY, w - 3, midY, 1);
    fillT(5, 4, 6, 4, 3);
    fillT(w - 7, 4, w - 6, 4, 3);
    fillT(2, 3, w - 3, 3, 1);
    lightShafts.push({ x: 4, y: 1, w: 2, h: 6, color: '#88e8ff', alpha: 0.11 });
    lightShafts.push({ x: w - 8, y: 1, w: 2, h: 6, color: '#88e8ff', alpha: 0.09 });
  } else if (arch === 'rootway_ravine') {
    // Organic overgrown ruins with protruding stone buttresses, subterranean rainwater canal, twin plank crossings & waterfall
    fillC(1, 2, 2, 3, 1);
    fillC(w - 3, 2, w - 2, 3, 1);
    fillC(1, h - 3, 2, h - 3, 1);
    fillC(w - 3, h - 3, w - 2, h - 3, 1);
    // Recessed rainwater channel across lower-mid courtyard (impassable except across two wide timber bridges)
    const canalY = h - 4;
    fillT(3, canalY, w - 4, canalY, 2);
    fillC(3, canalY, w - 4, canalY, 1);
    // Two wide dry crossings
    fillC(Math.max(4, midX - 5), canalY, Math.max(5, midX - 4), canalY, 0);
    fillT(Math.max(4, midX - 5), canalY, Math.max(5, midX - 4), canalY, 1);
    fillC(Math.min(w - 6, midX + 3), canalY, Math.min(w - 5, midX + 4), canalY, 0);
    fillT(Math.min(w - 6, midX + 3), canalY, Math.min(w - 5, midX + 4), canalY, 1);
    // Mossy stone transitions & stepped terrace stairs
    fillT(3, 3, 6, 4, 5);
    fillT(w - 7, 4, w - 4, 6, 5);
    fillT(midX - 1, 5, midX, 5, 3);
    fillT(2, midY, w - 3, midY, 1);
    waterfalls.push({ x: midX - 3, y: 1, w: 2, h: 2, color: 'rgba(64,198,192,0.72)' });
    lightShafts.push({ x: 6, y: 1, w: 3, h: 7, color: '#b4ffaa', alpha: 0.12 });
    lightShafts.push({ x: w - 9, y: 1, w: 2, h: 6, color: '#ffe69a', alpha: 0.10 });
  } else if (arch === 'filter_basin') {
    // Flooded industrial sluice chamber: twin recessed water basins + central elevated catwalk with stairs + dual waterfalls
    fillT(3, 4, midX - 3, 5, 2); fillC(3, 4, midX - 3, 5, 1);
    fillT(midX + 3, 4, w - 4, 5, 2); fillC(midX + 3, 4, w - 4, 5, 1);
    fillT(midX - 1, 3, midX + 1, h - 3, 1);
    fillT(midX - 1, 6, midX + 1, 6, 3);
    fillT(2, h - 4, w - 3, h - 4, 1);
    waterfalls.push({ x: 5, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.76)' });
    waterfalls.push({ x: w - 7, y: 1, w: 2, h: 3, color: 'rgba(54,192,222,0.76)' });
    lightShafts.push({ x: midX - 1, y: 1, w: 2, h: 5, color: '#72dce8', alpha: 0.10 });
  } else if (arch === 'relay_colonnade') {
    // Symmetrical industrial court with colonnade pillars, recessed relay conduits & stepped command terrace
    const colL = Math.max(4, midX - 5);
    const colR = Math.min(w - 5, midX + 5);
    setC(colL, 4, 1); setC(colR, 4, 1);
    if (h >= 14) { setC(colL, h - 5, 1); setC(colR, h - 5, 1); }
    fillT(midX - 3, 3, midX + 3, 4, 1);
    fillT(midX - 1, 5, midX + 1, 5, 3);
    fillT(colL + 1, 3, colL + 1, h - 3, 6);
    fillT(colR - 1, 3, colR - 1, h - 3, 6);
    fillT(2, midY + 1, w - 3, midY + 1, 1);
    lightShafts.push({ x: midX - 2, y: 1, w: 3, h: 6, color: '#a8d8ff', alpha: 0.09 });
  } else if (arch === 'lantern_plaza') {
    // Multi-wing warm settlement plaza: recessed stone lanes, stepped north market terrace, cozy timber corners
    fillC(1, 2, 2, 2, 1); fillC(w - 3, 2, w - 2, 2, 1);
    fillT(3, 3, w - 4, 4, 1);
    fillT(midX - 2, 5, midX + 1, 5, 3);
    fillT(3, midY + 1, w - 4, midY + 2, 1);
    fillT(4, h - 4, 6, h - 4, 5);
    fillT(w - 7, h - 4, w - 5, h - 4, 5);
    lightShafts.push({ x: 5, y: 1, w: 2, h: 6, color: '#ffd988', alpha: 0.12 });
    lightShafts.push({ x: w - 8, y: 1, w: 3, h: 6, color: '#ffd988', alpha: 0.12 });
  } else if (arch === 'sky_viaduct') {
    // Elevated open-air viaduct bridge cantilevered over clouds/canyon: south cliff guardrail edge + rail bed + stepped platform
    fillC(1, 2, 3, 2, 1); fillC(w - 4, 2, w - 2, 2, 1);
    fillT(2, h - 2, w - 3, h - 2, 4); // visible safety rail along south viaduct cliff edge
    fillT(2, midY - 1, w - 3, midY, 1);
    fillT(midX - 2, 4, midX + 1, 4, 3);
    fillT(3, 3, 5, 3, 5);
    fillT(w - 6, 3, w - 4, 3, 5);
    lightShafts.push({ x: 4, y: 0, w: 3, h: 8, color: '#ffe5a8', alpha: 0.14 });
    lightShafts.push({ x: midX + 2, y: 0, w: 3, h: 8, color: '#ffe5a8', alpha: 0.13 });
  } else if (arch === 'wetland_boardwalk') {
    // Expansive marsh boardwalk spanning deep turquoise water pools with twin aqueduct waterfalls & timber piers
    fillT(2, 3, w - 3, h - 3, 2);
    fillC(2, 3, w - 3, h - 3, 1);
    // Main horizontal boardwalk + central marsh island + north/south pier branches
    fillC(1, midY - 1, w - 2, midY + 1, 0); fillT(1, midY - 1, w - 2, midY + 1, 1);
    fillC(midX - 4, 3, midX + 4, h - 3, 0); fillT(midX - 4, 3, midX + 4, h - 3, 1);
    fillC(2, 2, 5, midY + 1, 0); fillT(2, 2, 5, midY + 1, 1);
    fillC(w - 6, 2, w - 3, midY + 1, 0); fillT(w - 6, 2, w - 3, midY + 1, 1);
    fillT(midX - 1, 4, midX + 1, 4, 3);
    fillT(midX - 3, 5, midX - 2, 5, 5); fillT(midX + 2, 5, midX + 3, 5, 5);
    waterfalls.push({ x: 7, y: 1, w: 2, h: 3, color: 'rgba(66,204,200,0.78)' });
    waterfalls.push({ x: w - 9, y: 1, w: 2, h: 3, color: 'rgba(66,204,200,0.78)' });
    lightShafts.push({ x: midX - 2, y: 1, w: 3, h: 7, color: '#9cf5c8', alpha: 0.11 });
  } else if (arch === 'archive_nave') {
    // Grand vaulted census library nave: side bookshelf alcoves, ceremonial center aisle, stepped reading gallery
    fillC(3, 5, 4, 5, 1); fillC(w - 5, 5, w - 4, 5, 1);
    if (h >= 14) { fillC(3, h - 5, 4, h - 5, 1); fillC(w - 5, h - 5, w - 4, h - 5, 1); }
    fillT(midX - 2, 3, midX + 2, h - 3, 1);
    fillT(midX - 2, 5, midX + 2, 5, 3);
    fillT(midX - 3, 3, midX - 3, h - 3, 6);
    fillT(midX + 3, 3, midX + 3, h - 3, 6);
    lightShafts.push({ x: midX - 1, y: 1, w: 2, h: 8, color: '#a8c8ff', alpha: 0.12 });
    lightShafts.push({ x: 5, y: 1, w: 2, h: 6, color: '#ffd994', alpha: 0.08 });
  } else if (arch === 'quarantine_spine') {
    // Segmented high-security containment spine with bulkhead baffles, glowing amber conduit track & decon stairs
    fillC(Math.max(5, midX - 5), 2, Math.max(5, midX - 5), 4, 1);
    fillC(Math.min(w - 6, midX + 5), 2, Math.min(w - 6, midX + 5), 4, 1);
    fillC(Math.max(5, midX - 5), h - 4, Math.max(5, midX - 5), h - 3, 1);
    fillC(Math.min(w - 6, midX + 5), h - 4, Math.min(w - 6, midX + 5), h - 3, 1);
    fillT(2, midY, w - 3, midY, 1);
    fillT(midX, 3, midX, h - 3, 6);
    fillT(midX - 1, 5, midX + 1, 5, 3);
    lightShafts.push({ x: midX - 1, y: 1, w: 2, h: 6, color: '#ffad52', alpha: 0.10 });
  } else if (arch === 'cathedral_sanctum') {
    // Monumental Control Cathedral: octagonal dais, twin monolith colonnade, dual coolant falls, violet/cyan conduits
    fillC(4, 4, 4, 5, 1); fillC(w - 5, 4, w - 5, 5, 1);
    fillC(4, h - 5, 4, h - 4, 1); fillC(w - 5, h - 5, w - 5, h - 4, 1);
    fillT(midX - 3, 3, midX + 3, 6, 1);
    fillT(midX - 2, 7, midX + 2, 7, 3);
    fillT(midX - 1, 3, midX - 1, h - 3, 6);
    fillT(midX + 1, 3, midX + 1, h - 3, 6);
    fillT(2, 4, 3, h - 4, 2); fillC(2, 4, 3, h - 4, 1);
    fillT(w - 4, 4, w - 3, h - 4, 2); fillC(w - 4, 4, w - 3, h - 4, 1);
    // Keep east/west portal lanes wide open across water channels
    fillC(1, midY - 1, 4, midY + 1, 0); fillT(1, midY - 1, 4, midY + 1, 1);
    fillC(w - 5, midY - 1, w - 2, midY + 1, 0); fillT(w - 5, midY - 1, w - 2, midY + 1, 1);
    waterfalls.push({ x: 2, y: 1, w: 2, h: 3, color: 'rgba(120,210,255,0.74)' });
    waterfalls.push({ x: w - 4, y: 1, w: 2, h: 3, color: 'rgba(120,210,255,0.74)' });
    lightShafts.push({ x: midX - 2, y: 0, w: 4, h: 9, color: '#d8b4ff', alpha: 0.14 });
  } else {
    // dawn_overlook: Open sunlit highland terrace with panoramic south guardrail cliff, stone stairs & wildflowers
    fillC(1, 2, 2, 2, 1); fillC(w - 3, 2, w - 2, 2, 1);
    fillT(2, h - 2, w - 3, h - 2, 4);
    fillT(3, 3, w - 4, 4, 1);
    fillT(midX - 2, 5, midX + 1, 5, 3);
    fillT(3, 6, 6, h - 4, 5);
    fillT(w - 7, 6, w - 4, h - 4, 5);
    fillT(midX - 2, 6, midX + 1, h - 3, 1);
    lightShafts.push({ x: 3, y: 0, w: 4, h: 8, color: '#ffe6a8', alpha: 0.16 });
    lightShafts.push({ x: w - 9, y: 0, w: 4, h: 8, color: '#ffe6a8', alpha: 0.15 });
  }

  // Ensure central spawn & inner walkways are always clear
  fillC(midX - 1, midY - 1, midX + 1, midY + 1, 0);

  return { collision: col, terrainLayer: terr, waterfalls, lightShafts, skyBackdrop: meta.sky || null };
}

function ensureRoomConnectivity(collision, w, h, startTx, startTy) {
  // BFS from start; if any walkable island is disconnected, carve a clean 1-tile link toward center
  const markReachable = () => {
    const seen = new Uint8Array(w * h);
    const q = [startTy * w + startTx];
    seen[q[0]] = 1;
    for (let i = 0; i < q.length; i++) {
      const p = q[i], x = p % w, y = Math.floor(p / w);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 1 || ny < 2 || nx >= w - 1 || ny >= h - 2) continue;
        const ni = ny * w + nx;
        if (seen[ni] || collision[ni] !== 0) continue;
        seen[ni] = 1; q.push(ni);
      }
    }
    return seen;
  };
  let seen = markReachable();
  for (let y = 2; y < h - 2; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (collision[y * w + x] === 0 && !seen[y * w + x]) {
        // Carve orthogonal corridor toward start
        let cx = x, cy = y;
        while (cx !== startTx) { collision[cy * w + cx] = 0; cx += cx < startTx ? 1 : -1; }
        while (cy !== startTy) { collision[cy * w + cx] = 0; cy += cy < startTy ? 1 : -1; }
        seen = markReachable();
      }
    }
  }
}

export function compileFullCampaignBundle(raw, manifest) {
  if (!raw || raw.schemaVersion !== 1 || !Array.isArray(raw.scenes) || !Array.isArray(raw.areas) || !raw.flagSchema) {
    throw new TypeError('Invalid Director\'s Cut campaign JSON source');
  }
  const VALID_ART = new Set((manifest?.characters || []).map(c => c.id));
  const content = structuredClone(raw);
  const flagSet = new Set(content.flagSchema.gameplay_flags || []);
  const addFlag = tok => {
    const t = String(tok || '').trim();
    if (!t || t === 'none' || t.includes('=')) return;
    if (ID_RE.test(t) && !['__proto__', 'prototype', 'constructor'].includes(t)) flagSet.add(t);
  };
  for (const sc of content.scenes || []) {
    for (const part of String(sc.sets || '').split(';')) addFlag(part);
    if (sc.id === 'SC-014' && !String(sc.sets || '').includes('act2_complete')) {
      sc.sets = sc.sets ? `${sc.sets};act2_complete` : 'act2_complete';
      addFlag('act2_complete');
    }
  }
  for (const en of content.encounters || []) addFlag(en.set_flag);
  for (const q of content.quests || []) {
    addFlag(q.completion_flags);
    if (q.start_trigger && /^[a-z]/.test(q.start_trigger)) addFlag(q.start_trigger);
  }
  for (const extra of [
    'act2_complete', 'after_pica_repaired', 'callsign_customized',
    'crate_a00_kit', 'crate_a02_wrench', 'crate_a04_coolant', 'crate_a06_blade',
    'crate_a09_charm', 'crate_a12_weave', 'crate_a15_emitter', 'crate_a18_stamp',
    'crate_a20_shroud', 'crate_a21_pike', 'crate_a24_carapace', 'crate_a26_cell'
  ]) addFlag(extra);
  content.flagSchema.gameplay_flags = [...flagSet];

  const areaIds = new Set(content.areas.map(a => a.id));
  const portalsByArea = Object.fromEntries(content.areas.map(a => [a.id, []]));
  for (const [from, to, dir, reqFlag] of EDGES) {
    if (!areaIds.has(from) || !areaIds.has(to)) continue;
    portalsByArea[from].push({ to, dir, reqFlag, name: `to_${to}` });
    portalsByArea[to].push({ to: from, dir: oppDir[dir], reqFlag: null, name: `to_${from}` });
  }

  const maps = [];
  for (const area of content.areas) {
    const id = area.id;
    const meta = AREA_META[id] || AREA_META.A00;
    const { w, h } = meta;
    const bp = buildBespokeAreaBlueprint(id, meta);
    const collision = bp.collision;
    const startTx = Math.floor(w / 2), startTy = Math.floor(h / 2);
    collision[startTy * w + startTx] = 0;
    ensureRoomConnectivity(collision, w, h, startTx, startTy);
    const start = { x: startTx * 32 + 16, y: startTy * 32 + 16, dir: 'right' };

    const occupied = new Set([`${startTx},${startTy}`]);
    const takeFreeTile = (tx, ty) => {
      for (let rad = 0; rad < 10; rad++) {
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const x = Math.max(2, Math.min(w - 3, tx + dx));
            const y = Math.max(3, Math.min(h - 4, ty + dy));
            const k = `${x},${y}`;
            if (collision[y * w + x] === 0 && !occupied.has(k)) {
              occupied.add(k);
              return [x, y];
            }
          }
        }
      }
      throw new Error(`No free tile near (${tx},${ty}) in ${id}`);
    };

    const rawPortals = portalsByArea[id] || [];
    const portalObjects = rawPortals.map((p, idx) => {
      let tx, ty;
      if (p.dir === 'right') { tx = w - 2; ty = Math.min(h - 4, Math.max(3, Math.floor(h / 2) + (idx % 2 ? -2 : 0))); }
      else if (p.dir === 'left') { tx = 1; ty = Math.min(h - 4, Math.max(3, Math.floor(h / 2) + (idx % 2 ? 2 : 0))); }
      else if (p.dir === 'up') { tx = Math.min(w - 3, Math.max(3, Math.floor(w / 2) - 3 + idx * 2)); ty = 2; }
      else { tx = Math.min(w - 3, Math.max(3, Math.floor(w / 2) + 2 + idx * 2)); ty = h - 3; }

      const key = `${tx},${ty}`;
      if (collision[ty * w + tx] !== 0 || occupied.has(key)) {
        [tx, ty] = takeFreeTile(tx, ty);
      } else {
        occupied.add(key);
      }
      const targetMeta = AREA_META[p.to] || AREA_META.A00;
      return {
        id: idx + 1,
        name: p.name,
        x: tx * 32,
        y: ty * 32,
        width: 32,
        height: 32,
        properties: {
          toMap: p.to,
          toPortal: `to_${id}`,
          facing: p.dir,
          portalStyle: targetMeta.doorStyle,
          portalArt: targetMeta.doorArt,
          ...(p.reqFlag ? { requiresFlag: p.reqFlag } : {})
        }
      };
    });

    const entities = [];
    const triggers = [];

    if (area.save_point === 'yes') {
      const [tx, ty] = takeFreeTile(3, 3);
      entities.push({ id: `save_${id.toLowerCase()}`, type: 'save', tx, ty, interact: true, solid: true, label: 'SAVE TERMINAL' });
    }

    if (AREA_CRATES[id]) {
      const cr = AREA_CRATES[id];
      const [tx, ty] = takeFreeTile(w - 4, h - 4);
      entities.push({
        id: cr.id, type: 'crate', tx, ty, interact: true, solid: true,
        hideAfterFlag: cr.flag, grantItems: cr.grant, label: 'SUPPLY CACHE'
      });
    }

    for (const npc of AREA_NPCS[id] || []) {
      const [tx, ty] = takeFreeTile(Math.floor(w / 2) - 2, 4);
      entities.push({
        id: npc.id, type: 'npc', artId: npc.artId, dir: npc.dir || 'down',
        tx, ty, interact: true, solid: true, label: npc.label,
        ...(npc.trigger ? { trigger: npc.trigger } : {}),
        ...(npc.sceneId ? { sceneId: npc.sceneId } : {}),
        ...(npc.ambientArea ? { ambientArea: npc.ambientArea } : {})
      });
    }

    const hasAmbient = (content.dialogue || []).some(d => d.area === id && d.scene_id === 'ambient');
    if (hasAmbient && !entities.some(e => e.ambientArea === id)) {
      const [tx, ty] = takeFreeTile(4, h - 4);
      entities.push({ id: `ambient_${id.toLowerCase()}`, type: 'note', tx, ty, interact: true, label: 'FIELD RECORD', ambientArea: id });
    }

    if (['A09', 'A13', 'A17', 'A20'].includes(id)) {
      const [tx, ty] = takeFreeTile(Math.floor(w / 2) + 3, 4);
      entities.push({ id: `bench_${id.toLowerCase()}`, type: 'bench', tx, ty, interact: true, solid: true, label: 'REST BENCH' });
    }

    const usedTriggers = new Set(entities.map(e => e.trigger).filter(Boolean));
    const areaScenes = content.scenes.filter(s => SCENE_AREA[s.id] === id);
    for (const sc of areaScenes) {
      if (sc.trigger === 'NEW_GAME' || sc.trigger === AREA_ENTRY_TRIGGER[id]) continue;
      if (usedTriggers.has(sc.trigger)) continue;
      usedTriggers.add(sc.trigger);

      const lowerTitle = ((sc.title || '') + ' ' + (sc.trigger || '')).toLowerCase();
      const isPod = lowerTitle.includes('pod');
      const isTerminal = lowerTitle.includes('console') || lowerTitle.includes('case') || lowerTitle.includes('uplink') || lowerTitle.includes('cylinder') || lowerTitle.includes('ledger') || lowerTitle.includes('archive') || lowerTitle.includes('receiver');
      const isSwitch = lowerTitle.includes('switch') || lowerTitle.includes('breaker') || lowerTitle.includes('reclassify') || lowerTitle.includes('isolate') || lowerTitle.includes('repeater') || lowerTitle.includes('bridge') || lowerTitle.includes('exchanger');
      const [tx, ty] = takeFreeTile(Math.floor(w / 2) + 1, Math.floor(h / 2) - 1);

      entities.push({
        id: `${isPod || isTerminal || isSwitch ? 'obj' : 'evt'}_${sc.id.toLowerCase().replace('-', '_')}`,
        type: isPod ? 'pod' : isSwitch ? 'switch' : isTerminal ? 'terminal' : 'puzzle',
        tx, ty, interact: true, solid: true,
        trigger: sc.trigger, sceneId: sc.id,
        label: String(sc.title || sc.id).replace(/\s*\(Act \d+\)/, '').toUpperCase().slice(0, 28)
      });
    }

    for (const [sqId, sqArea] of Object.entries(SIDEQUEST_AREA)) {
      if (sqArea !== id) continue;
      const sq = (content.quests || []).find(q => q.id === sqId);
      if (!sq) continue;
      const [tx, ty] = takeFreeTile(5, h - 4);
      entities.push({
        id: `sq_node_${sqId.toLowerCase().replace('-', '_')}`,
        type: 'terminal', tx, ty, interact: true, solid: true,
        sidequestId: sqId,
        label: sq.title.toUpperCase().slice(0, 26)
      });
    }

    const noncombat = (content.encounters || []).filter(en => en.area === id && !['battle', 'boss'].includes(en.kind));
    for (const en of noncombat) {
      const [tx, ty] = takeFreeTile(w - 5, 4);
      entities.push({
        id: `enc_obj_${en.id.toLowerCase().replace('-', '_')}`,
        type: 'puzzle', tx, ty, interact: true, solid: true,
        encounterId: en.id, doneFlag: en.set_flag || undefined,
        label: `${en.id} ${String(en.kind || 'PUZZLE').toUpperCase()}`
      });
    }

    for (const en of (content.encounters || []).filter(e => e.area === id && NON_MANDATORY_BATTLES.has(e.id))) {
      const [tx, ty] = takeFreeTile(w - 4, Math.floor(h / 2));
      entities.push({
        id: `battle_${en.id.toLowerCase().replace('-', '_')}`,
        type: 'switch', tx, ty, interact: true, solid: true,
        trigger: `FIGHT_${en.id.replace('-', '_')}`,
        label: `ENGAGE ${String(en.units || en.id).toUpperCase().slice(0, 22)}`
      });
    }

    // Build reserved cell mask so background/foreground atlas art strictly respects collision === 1 & never overlaps gameplay objects
    const reserved = new Set();
    reserved.add(`${startTx},${startTy}`);
    for (const p of portalObjects) reserved.add(`${p.x / 32},${p.y / 32}`);
    for (const e of entities) reserved.add(`${e.tx},${e.ty}`);
    const canPlaceSolidDetail = (tx, ty, sw, sh) => {
      const tw = sw / 32, th = sh / 32;
      if (tx < 0 || ty < 0 || tx + tw > w || ty + th > h) return false;
      for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) {
        const cx = tx + dx, cy = ty + dy;
        if (collision[cy * w + cx] !== 1 || reserved.has(`${cx},${cy}`)) return false;
      }
      return true;
    };

    const primaryCrops = ATLAS_CROPS[meta.atlas] || ATLAS_CROPS.atlas_ruins_flora;
    const altCrops = ATLAS_CROPS[meta.altAtlas] || primaryCrops;
    const bgPool = [
      ...primaryCrops.bg.map(c => ({ atlas: meta.atlas, ...c })),
      ...altCrops.bg.slice(0, 2).map(c => ({ atlas: meta.altAtlas || meta.atlas, ...c }))
    ];
    const fgPool = [
      ...primaryCrops.fg.map(c => ({ atlas: meta.atlas, ...c })),
      ...altCrops.fg.map(c => ({ atlas: meta.altAtlas || meta.atlas, ...c }))
    ];
    const groundPool = [
      ...primaryCrops.ground.map(c => ({ atlas: meta.atlas, ...c })),
      ...altCrops.ground.slice(0, 1).map(c => ({ atlas: meta.altAtlas || meta.atlas, ...c }))
    ];

    const envDetails = [];
    const bgUsed = new Set();
    const areaNum = parseInt(id.slice(1), 10) || 0;
    const wfCols = new Set();
    for (const wf of bp.waterfalls) for (let dx = 0; dx < (wf.w || 1); dx++) wfCols.add(wf.x + dx);

    // North wall architectural storytelling (staggered multi-atlas monuments, arches, consoles, shelves, crags)
    for (let x = 2, slot = 0; x <= w - 4 && bgPool.length; x += 3, slot++) {
      const pick = bgPool[(slot + areaNum) % bgPool.length];
      const tw = pick.sw / 32, th = pick.sh / 32;
      if (th > 2) continue;
      let ok = canPlaceSolidDetail(x, 0, pick.sw, pick.sh);
      for (let dx = 0; dx < tw; dx++) if (bgUsed.has(x + dx) || wfCols.has(x + dx)) ok = false;
      if (!ok) continue;
      for (let dx = 0; dx < tw; dx++) bgUsed.add(x + dx);
      envDetails.push({
        id: `bg_${id.toLowerCase()}_${x}`, atlas: pick.atlas, layer: 'background',
        tx: x, ty: 0, sx: pick.sx, sy: pick.sy, sw: pick.sw, sh: pick.sh
      });
      x += Math.max(0, tw - 2);
    }

    // Foreground architectural framing on south rim (hanging moss, lantern strands, decon gantries, vaulted ribs)
    if (fgPool.length) {
      const fgPositions = [2, Math.max(6, Math.floor(w / 2) - 1), w - 5];
      fgPositions.forEach((fx, fi) => {
        const pick = fgPool[(fi + areaNum) % fgPool.length];
        if (canPlaceSolidDetail(fx, h - 2, pick.sw, pick.sh)) {
          envDetails.push({
            id: `fg_${id.toLowerCase()}_${fi}`, atlas: pick.atlas, layer: 'foreground',
            tx: fx, ty: h - 2, sx: pick.sx, sy: pick.sy, sw: pick.sw, sh: pick.sh
          });
        }
      });
    }

    // Ground details (rugs, grates, lily pads, rail tracks, moss beds, cables, puddle reflections)
    const groundAnchors = [
      [3, 4], [Math.max(4, Math.floor(w / 2) - 3), Math.max(4, Math.floor(h / 2) - 1)],
      [w - 7, 5], [5, h - 5], [Math.min(w - 6, Math.floor(w / 2) + 2), h - 5]
    ];
    groundAnchors.forEach(([gx, gy], gi) => {
      if (!groundPool.length) return;
      const pick = groundPool[(gi + areaNum) % groundPool.length];
      const tw = pick.sw / 32, th = pick.sh / 32;
      if (gx >= 2 && gy >= 3 && gx + tw <= w - 2 && gy + th <= h - 2) {
        envDetails.push({
          id: `gr_${id.toLowerCase()}_${gi}`, atlas: pick.atlas, layer: 'ground',
          tx: gx, ty: gy, sx: pick.sx, sy: pick.sy, sw: pick.sw, sh: pick.sh
        });
      }
    });

    // Properly positioned TILE-COORDINATE Sea-of-Stars lamps for warm/cool atmospheric pools
    const lamps = [
      { x: 3, y: 2, r: 98, color: meta.lampColor, flicker: true },
      { x: Math.floor(w / 2), y: Math.floor(h / 2) - 1, r: 118, color: meta.lampColor, flicker: false },
      { x: w - 4, y: 2, r: 98, color: meta.lampColor, flicker: true },
      { x: Math.max(4, Math.floor(w / 3)), y: h - 3, r: 88, color: '#72dce8', flicker: false },
      { x: Math.min(w - 5, Math.floor((w * 2) / 3)), y: h - 3, r: 88, color: meta.lampColor, flicker: true }
    ];

    const scConf = STEALTH_CONFIG[id];
    const drones = scConf ? [{
      start: [Math.floor(w / 2) + 2, 4],
      zone: [Math.floor(w / 2) - 1, 3, w - 3, h - 4],
      waypoints: [
        [Math.floor(w / 2) + 2, 4],
        [w - 4, 4],
        [w - 4, h - 5],
        [Math.floor(w / 2) + 2, h - 5]
      ]
    }] : [];

    const security = scConf ? {
      defaultMode: 'normal',
      zones: [{
        id: scConf.zoneId,
        x: (Math.floor(w / 2) - 1) * 32,
        y: 3 * 32,
        w: (w - 3 - (Math.floor(w / 2) - 1) + 1) * 32,
        h: (h - 4 - 3 + 1) * 32,
        mode: 'stealth',
        consequence: scConf.conseq,
        ...(scConf.enc ? { encounterId: scConf.enc } : {})
      }]
    } : undefined;

    maps.push({
      id, name: area.name, act: meta.act,
      orientation: 'orthogonal', tilewidth: 32, tileheight: 32, width: w, height: h,
      environmentPalette: meta.palette, campaignTheme: meta.theme,
      environmentDetails: envDetails,
      terrainLayer: bp.terrainLayer,
      waterfalls: bp.waterfalls,
      lightShafts: bp.lightShafts,
      skyBackdrop: bp.skyBackdrop,
      saveTerminal: area.save_point === 'yes',
      ...(AREA_ENTRY_TRIGGER[id] ? { entryTrigger: AREA_ENTRY_TRIGGER[id] } : {}),
      start,
      layers: [
        { type: 'tilelayer', name: 'collision', data: collision },
        { type: 'objectgroup', name: 'portals', objects: portalObjects }
      ],
      entities, triggers,
      props: [
        ...(meta.arch === 'stasis_cryo_bay' || meta.arch === 'relay_colonnade' || meta.arch === 'quarantine_spine'
          ? [{ t: 'cable', x: 3, y: h - 4, w: Math.min(8, w - 6), h: 1, solid: false }]
          : []),
        ...(meta.arch === 'rootway_ravine' || meta.arch === 'sky_viaduct'
          ? [{ t: 'debris', x: w - 5, y: 3, w: 1, h: 1, solid: false }]
          : [])
      ],
      lamps, drones,
      objective: area.story_purpose || 'Explore the sector',
      objectives: [],
      ...(security ? { security } : {})
    });
  }

  const makeStarter = (id, name, hp, ep, atk, def, spd) => ([{
    id: 'sleeper', artId: id, lineage: 'sleeper', name,
    hp, maxHp: hp, ep, maxEp: ep, attack: atk, defense: def, speed: spd,
    skills: ['pulse', 'repair', 'guard'], level: 1, xp: 0
  }]);
  const partyByStarter = {
    sleeper_A: makeStarter('sleeper_A', 'Sleeper A', 48, 22, 13, 5, 14),
    sleeper_B: makeStarter('sleeper_B', 'Sleeper B', 50, 20, 12, 6, 13),
    sleeper_C: makeStarter('sleeper_C', 'Sleeper C', 44, 26, 14, 4, 15),
    sleeper_D: makeStarter('sleeper_D', 'Sleeper D', 46, 24, 13, 5, 16)
  };

  const combatEncounters = [];
  for (const en of content.encounters || []) {
    if (en.kind && !['battle', 'boss'].includes(en.kind)) continue;
    const spec = BATTLE_ROSTER[en.id];
    if (!spec) throw new Error('Missing battle roster for ' + en.id);
    if (VALID_ART.size) {
      for (const unit of spec.enemies) {
        if (!VALID_ART.has(unit.artId)) throw new Error('Invalid artId ' + unit.artId);
      }
    }
    combatEncounters.push({
      id: en.id, mapId: en.area,
      ...(spec.trigger ? { trigger: spec.trigger } : {}),
      enemies: spec.enemies.map(e => ({ ...e, ep: 0, maxEp: 0 })),
      rewards: { xp: spec.xp, items: spec.items },
      canFlee: en.kind !== 'boss'
    });
  }

  const layoutDigest = 'directors-cut-v2-full-29areas';
  const presentChoiceIds = new Set((content.choices || []).map(c => c.id));
  const fullChoiceGates = {
    'CHOICE-01': { afterLine: 'SC-016-D008' },
    'CHOICE-02': { afterLine: 'SC-049-D010' },
    'CHOICE-03': { afterLine: 'SC-052-D012' },
    'CHOICE-04': { afterLine: 'SC-055-D014' },
    'CHOICE-05': { afterLine: 'SC-062-D008' },
    'CHOICE-06': { afterLine: 'SC-056-D009' },
    'CHOICE-07': { afterLine: null }
  };
  const choiceGates = Object.fromEntries(
    Object.entries(fullChoiceGates).filter(([id]) => presentChoiceIds.has(id))
  );

  const presentQuestIds = new Set((content.quests || []).map(q => q.id));
  const questBindings = [
    { questId: 'MS-00', startFlag: 'game_started', completeFlag: 'mission_accepted' },
    { questId: 'MS-01', startFlag: 'mission_accepted', completeFlag: 'quiet_cycle_phase_1' },
    { questId: 'MS-02', startFlag: 'quiet_cycle_phase_1', completeFlag: 'act2_complete' },
    { questId: 'MS-03', startFlag: 'act2_complete', completeFlag: 'air_exchange_restored' }
  ].filter(b => presentQuestIds.has(b.questId));

  const presentSceneIds = new Set((content.scenes || []).map(s => s.id));
  const presentCombatIds = new Set(combatEncounters.map(e => e.id));
  const mandatoryCombats = [
    { sceneId: 'SC-008', encounterId: 'EN-005', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-013', encounterId: 'EN-010', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-017', encounterId: 'EN-015', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-022', encounterId: 'EN-020', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-024', encounterId: 'EN-025', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-030', encounterId: 'EN-030', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-036', encounterId: 'EN-037', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-040', encounterId: 'EN-041', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-040', encounterId: 'EN-042', saveOutcomeRequired: 'victory' },
    { sceneId: 'SC-040', encounterId: 'EN-043', saveOutcomeRequired: 'victory' }
  ].filter(m => presentSceneIds.has(m.sceneId) && presentCombatIds.has(m.encounterId));

  const world = {
    schemaVersion: 1,
    campaignRevision: content.revision,
    status: 'authored-blockout-review-candidate',
    layoutDigest,
    requiresNavigationQA: true,
    requiresEnvironmentArt: true,
    startArea: maps[0]?.id || 'A00',
    openingScene: { sceneId: content.scenes[0]?.id || 'SC-000', trigger: content.scenes[0]?.trigger || 'NEW_GAME' },
    maps,
    choiceGates,
    questBindings,
    mandatoryCombats,
    combat: {
      schemaVersion: 1,
      campaignRevision: content.revision,
      layoutDigest,
      partyByStarter,
      encounters: combatEncounters
    }
  };

  return { content, world };
}
