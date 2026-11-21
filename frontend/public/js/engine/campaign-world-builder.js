// Shared pure-JS Director's Cut v2 campaign world compiler.
// Used identically by both the offline CLI builder (build_full_campaign.mjs)
// and the client-side private campaign installer (campaign-game.js).
// Contains NO screenplay dialogue, lore text, or private story copy.

import { AREA_DIMENSIONS, buildAreaArchitecture } from './campaign-area-blueprints.js';

const ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,95}$/;

export const AREA_META = Object.freeze({
  A00: { ...AREA_DIMENSIONS.A00, region: 'Stasis Wing',      arch: 'stasis_cryo_bay',   palette: 'stasis_hollow',     theme: 'stasis',     atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#72dce8', sky: 'abyss_vault',      act: 0, mx: 6,  my: 54 },
  A01: { ...AREA_DIMENSIONS.A01, region: 'Stasis Wing',      arch: 'stasis_cryo_bay',   palette: 'stasis_hollow',     theme: 'stasis',     atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_ruins_flora',          doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#72dce8', sky: 'abyss_vault',      act: 0, mx: 12, my: 54 },
  A02: { ...AREA_DIMENSIONS.A02, region: 'Rootway',          arch: 'rootway_ravine',    palette: 'rootway_ruins',     theme: 'rootway',    atlas: 'atlas_ruins_flora',          altAtlas: 'atlas_wetland_water',        doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#82e896', sky: 'canopy_ruins',     act: 1, mx: 18, my: 54 },
  A03: { ...AREA_DIMENSIONS.A03, region: 'Rootway',          arch: 'filter_basin',      palette: 'flooded_quay',      theme: 'quay',       atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_wetland_water',        doorStyle: 'bulkhead', doorArt: 'sluice_gate',     lampColor: '#72dce8', sky: 'wetland_mist',     act: 1, mx: 24, my: 54 },
  A04: { ...AREA_DIMENSIONS.A04, region: 'Rootway',          arch: 'rootway_ravine',    palette: 'rootway_ruins',     theme: 'rootway',    atlas: 'atlas_ruins_flora',          altAtlas: 'atlas_wasteland_exterior',   doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#f2bd75', sky: 'canopy_ruins',     act: 1, mx: 18, my: 34 },
  A05: { ...AREA_DIMENSIONS.A05, region: 'Relay Court',      arch: 'relay_colonnade',   palette: 'relay_court',       theme: 'relay',      atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_archive_cathedral',    doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#92d6ea', sky: 'abyss_vault',      act: 2, mx: 30, my: 54 },
  A06: { ...AREA_DIMENSIONS.A06, region: 'Relay Court',      arch: 'relay_colonnade',   palette: 'mail_vault',        theme: 'mail',       atlas: 'atlas_settlement_interiors', altAtlas: 'atlas_archive_cathedral',    doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f2bd75', sky: 'abyss_vault',      act: 2, mx: 36, my: 46 },
  A07: { ...AREA_DIMENSIONS.A07, region: 'Relay Court',      arch: 'relay_colonnade',   palette: 'relay_court',       theme: 'relay',      atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#92d6ea', sky: 'abyss_vault',      act: 2, mx: 30, my: 72 },
  A08: { ...AREA_DIMENSIONS.A08, region: 'Relay Court',      arch: 'filter_basin',      palette: 'flooded_quay',      theme: 'quay',       atlas: 'atlas_wetland_water',        altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'water_lock',      lampColor: '#72dce8', sky: 'wetland_mist',     act: 2, mx: 41, my: 54 },
  A09: { ...AREA_DIMENSIONS.A09, region: 'Lantern Shelf',    arch: 'lantern_plaza',     palette: 'lantern_shelter',   theme: 'lantern',    atlas: 'atlas_shelter_warmth',       altAtlas: 'atlas_settlement_interiors', doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f8cb7c', sky: 'wasteland_canyon', act: 3, mx: 46, my: 62 },
  A10: { ...AREA_DIMENSIONS.A10, region: 'Lantern Shelf',    arch: 'relay_colonnade',   palette: 'lantern_shelter',   theme: 'lantern',    atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_shelter_warmth',       doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f8cb7c', sky: 'abyss_vault',      act: 3, mx: 52, my: 62 },
  A11: { ...AREA_DIMENSIONS.A11, region: 'Lantern Shelf',    arch: 'lantern_plaza',     palette: 'mail_vault',        theme: 'mail',       atlas: 'atlas_settlement_interiors', altAtlas: 'atlas_shelter_warmth',       doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f2bd75', sky: 'abyss_vault',      act: 3, mx: 46, my: 38 },
  A12: { ...AREA_DIMENSIONS.A12, region: 'Broken Sky-Rail',  arch: 'sky_viaduct',       palette: 'broken_rail',       theme: 'relay',      atlas: 'atlas_sky_rail',             altAtlas: 'atlas_wasteland_exterior',   doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#92d6ea', sky: 'wasteland_canyon', act: 4, mx: 58, my: 54 },
  A13: { ...AREA_DIMENSIONS.A13, region: 'Broken Sky-Rail',  arch: 'sky_viaduct',       palette: 'wasteland_ridge',   theme: 'wasteland',  atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_sky_rail',             doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 4, mx: 63, my: 46 },
  A14: { ...AREA_DIMENSIONS.A14, region: 'Broken Sky-Rail',  arch: 'sky_viaduct',       palette: 'broken_rail',       theme: 'wasteland',  atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_sky_rail',             doorStyle: 'hatch',    doorArt: 'service',         lampColor: '#f2bd75', sky: 'wasteland_canyon', act: 4, mx: 55, my: 78 },
  A15: { ...AREA_DIMENSIONS.A15, region: 'Survey Wetland',   arch: 'wetland_boardwalk', palette: 'survey_wetland',    theme: 'wetland',    atlas: 'atlas_wetland_water',        altAtlas: 'atlas_ruins_flora',          doorStyle: 'bulkhead', doorArt: 'sluice_gate',     lampColor: '#82e896', sky: 'wetland_mist',     act: 5, mx: 68, my: 54 },
  A16: { ...AREA_DIMENSIONS.A16, region: 'Survey Wetland',   arch: 'filter_basin',      palette: 'wetland_pier',      theme: 'wetland',    atlas: 'atlas_wetland_water',        altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'water_lock',      lampColor: '#72dce8', sky: 'wetland_mist',     act: 5, mx: 73, my: 54 },
  A17: { ...AREA_DIMENSIONS.A17, region: 'Survey Wetland',   arch: 'dawn_overlook',     palette: 'wasteland_ridge',   theme: 'wasteland',  atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_shelter_warmth',       doorStyle: 'hatch',    doorArt: 'overgrown',       lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 5, mx: 68, my: 32 },
  A18: { ...AREA_DIMENSIONS.A18, region: 'Census Archive',   arch: 'archive_nave',      palette: 'census_archive',    theme: 'archive',    atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_settlement_interiors', doorStyle: 'exit',     doorArt: 'archive_seal',    lampColor: '#98bfff', sky: 'abyss_vault',      act: 6, mx: 78, my: 54 },
  A19: { ...AREA_DIMENSIONS.A19, region: 'Census Archive',   arch: 'archive_nave',      palette: 'mail_vault',        theme: 'mail',       atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_settlement_interiors', doorStyle: 'bulkhead', doorArt: 'archive_seal',    lampColor: '#f2bd75', sky: 'abyss_vault',      act: 6, mx: 78, my: 34 },
  A20: { ...AREA_DIMENSIONS.A20, region: 'Return Haven',     arch: 'lantern_plaza',     palette: 'lantern_shelter',   theme: 'lantern',    atlas: 'atlas_settlement_interiors', altAtlas: 'atlas_shelter_warmth',       doorStyle: 'bulkhead', doorArt: 'service',         lampColor: '#f8cb7c', sky: 'wasteland_canyon', act: 7, mx: 83, my: 54 },
  A21: { ...AREA_DIMENSIONS.A21, region: 'Quarantine Spine', arch: 'quarantine_spine',  palette: 'quarantine_spine',  theme: 'quarantine', atlas: 'atlas_quarantine_void',      altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'quarantine_lock', lampColor: '#f09238', sky: 'abyss_vault',      act: 7, mx: 88, my: 54 },
  A22: { ...AREA_DIMENSIONS.A22, region: 'Quarantine Spine', arch: 'quarantine_spine',  palette: 'quarantine_spine',  theme: 'quarantine', atlas: 'atlas_quarantine_void',      altAtlas: 'atlas_bunker_machinery',     doorStyle: 'bulkhead', doorArt: 'quarantine_lock', lampColor: '#72dce8', sky: 'abyss_vault',      act: 7, mx: 88, my: 34 },
  A23: { ...AREA_DIMENSIONS.A23, region: 'Quarantine Spine', arch: 'quarantine_spine',  palette: 'quarantine_spine',  theme: 'quarantine', atlas: 'atlas_quarantine_void',      altAtlas: 'atlas_archive_cathedral',    doorStyle: 'bulkhead', doorArt: 'cathedral_gate',  lampColor: '#98bfff', sky: 'abyss_vault',      act: 7, mx: 92, my: 54 },
  A24: { ...AREA_DIMENSIONS.A24, region: 'Control Cathedral',arch: 'cathedral_sanctum', palette: 'control_cathedral', theme: 'cathedral',  atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'cathedral_gate',  lampColor: '#e2a8ff', sky: 'abyss_vault',      act: 8, mx: 95, my: 54 },
  A25: { ...AREA_DIMENSIONS.A25, region: 'Control Cathedral',arch: 'cathedral_sanctum', palette: 'control_cathedral', theme: 'cathedral',  atlas: 'atlas_bunker_machinery',     altAtlas: 'atlas_quarantine_void',      doorStyle: 'bulkhead', doorArt: 'cathedral_gate',  lampColor: '#ff7070', sky: 'abyss_vault',      act: 8, mx: 95, my: 34 },
  A26: { ...AREA_DIMENSIONS.A26, region: 'Control Cathedral',arch: 'cathedral_sanctum', palette: 'control_cathedral', theme: 'cathedral',  atlas: 'atlas_archive_cathedral',    altAtlas: 'atlas_bunker_machinery',     doorStyle: 'exit',     doorArt: 'elevator',        lampColor: '#5ce4ff', sky: 'abyss_vault',      act: 8, mx: 95, my: 72 },
  A27: { ...AREA_DIMENSIONS.A27, region: 'Surface Morning',  arch: 'dawn_overlook',     palette: 'sky_morning',       theme: 'sky',        atlas: 'atlas_sky_rail',             altAtlas: 'atlas_wasteland_exterior',   doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 9, mx: 89, my: 82 },
  A28: { ...AREA_DIMENSIONS.A28, region: 'Surface Morning',  arch: 'dawn_overlook',     palette: 'sky_morning',       theme: 'sky',        atlas: 'atlas_wasteland_exterior',   altAtlas: 'atlas_ruins_flora',          doorStyle: 'exit',     doorArt: 'roof_hatch',      lampColor: '#ffe2a8', sky: 'dawn_sky',         act: 9, mx: 95, my: 86 }
});

export const WORLD_EDGES = Object.freeze([
  ['A00', 'A01', 'right', 'aux_relay_open'],
  ['A01', 'A02', 'right', null],
  ['A02', 'A03', 'right', null],
  ['A02', 'A04', 'up', null],
  ['A03', 'A05', 'right', 'quiet_cycle_phase_1'],
  ['A05', 'A06', 'right', null],
  ['A05', 'A07', 'down', null],
  ['A06', 'A08', 'right', null],
  ['A07', 'A09', 'right', 'act2_complete'],
  ['A08', 'A09', 'right', 'act2_complete'],
  ['A09', 'A10', 'right', null],
  ['A09', 'A11', 'up', null],
  ['A09', 'A14', 'down', 'first_priority_visible'],
  ['A10', 'A12', 'right', 'first_priority_visible'],
  ['A12', 'A13', 'right', null],
  ['A12', 'A14', 'down', null],
  ['A13', 'A15', 'right', 'boss_b04_resolved'],
  ['A15', 'A16', 'right', null],
  ['A15', 'A17', 'up', null],
  ['A16', 'A18', 'right', 'local_receiver_pinged'],
  ['A18', 'A19', 'up', null],
  ['A18', 'A20', 'right', 'privacy_proof_agreed'],
  ['A20', 'A21', 'right', null],
  ['A21', 'A22', 'up', null],
  ['A21', 'A23', 'right', null],
  ['A23', 'A24', 'right', 'act7_complete'],
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
  'SC-013': 'A08', 'SC-014': 'A08',
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

const SOLID_TERRAIN_OVERRIDES = new Set([2, 8, 9, 12, 13, 16, 17, 18, 19, 20]);

function inferPortalAssembly(portalArt) {
  if (portalArt === 'trail_passage') return 'trail_exit';
  if (portalArt === 'bridge_passage') return 'bridge_exit';
  if (portalArt === 'rail_gantry') return 'rail_gantry';
  if (portalArt === 'cathedral_gate') return 'cathedral_gate';
  if (portalArt === 'elevator' || portalArt === 'roof_hatch') return 'elevator';
  if (['airlock_east', 'airlock_west', 'quarantine_lock', 'service'].includes(portalArt)) return 'airlock';
  return 'archway';
}

/**
 * Pure, architecture-preserving connectivity validator.
 * NEVER tunnels through walls, buildings, cliffs, machinery, or water.
 * Throws a descriptive error identifying exact disconnected tiles so authored
 * blueprint geometry is corrected deliberately.
 */
export function validateAreaConnectivity(id, collision, w, h, startTx, startTy) {
  if (!Number.isInteger(startTx) || !Number.isInteger(startTy) ||
      startTx < 1 || startTy < 2 || startTx > w - 2 || startTy > h - 3) {
    throw new Error(`Architecture error in ${id}: start position (${startTx},${startTy}) is out of valid interior bounds`);
  }
  if (collision[startTy * w + startTx] !== 0) {
    throw new Error(`Architecture error in ${id}: start position (${startTx},${startTy}) is blocked by solid collision`);
  }
  const seen = new Uint8Array(w * h);
  const startIdx = startTy * w + startTx;
  const q = [startIdx];
  seen[startIdx] = 1;
  for (let i = 0; i < q.length; i++) {
    const p = q[i], x = p % w, y = Math.floor(p / w);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (seen[ni] || collision[ni] !== 0) continue;
      seen[ni] = 1;
      q.push(ni);
    }
  }
  const disconnected = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (collision[y * w + x] === 0 && !seen[y * w + x]) {
        disconnected.push(`(${x},${y})`);
      }
    }
  }
  if (disconnected.length) {
    const sample = disconnected.slice(0, 6).join(', ');
    throw new Error(
      `Architecture error in ${id}: ${disconnected.length} disconnected walkable tile(s) unreachable from start (${startTx},${startTy}): ${sample}`
    );
  }
  return seen;
}

/**
 * Strict authored-anchor validator.
 * Mandatory story objects, NPCs, portals, save terminals, supply caches,
 * sidequests, puzzles, and battles MUST occupy their explicit authored tile.
 * Never silently relocates objects to arbitrary nearby tiles.
 */
export function placeAuthoredAnchor(id, role, anchor, ctx) {
  const { w, h, collision, terrainLayer, occupied, portalApproaches } = ctx;
  if (!Array.isArray(anchor) || anchor.length < 2 || !Number.isInteger(anchor[0]) || !Number.isInteger(anchor[1])) {
    throw new Error(`Layout error in ${id}: missing authored anchor for ${role}`);
  }
  const [tx, ty] = anchor;
  if (tx < 1 || ty < 2 || tx > w - 2 || ty > h - 3) {
    throw new Error(`Layout error in ${id}: authored anchor for ${role} at (${tx},${ty}) is out of bounds (${w}x${h})`);
  }
  const idx = ty * w + tx;
  if (collision[idx] !== 0) {
    throw new Error(`Layout error in ${id}: authored anchor for ${role} at (${tx},${ty}) is blocked by solid geometry (terrain=${terrainLayer[idx]})`);
  }
  if (SOLID_TERRAIN_OVERRIDES.has(terrainLayer[idx])) {
    throw new Error(`Layout error in ${id}: authored anchor for ${role} at (${tx},${ty}) conflicts with solid terrain code ${terrainLayer[idx]}`);
  }
  const k = `${tx},${ty}`;
  if (portalApproaches.has(k)) {
    throw new Error(`Layout error in ${id}: authored anchor for ${role} at (${tx},${ty}) blocks a doorway approach`);
  }
  if (occupied.has(k)) {
    throw new Error(`Layout error in ${id}: authored anchor for ${role} at (${tx},${ty}) collides with another authored object`);
  }
  occupied.add(k);
  return [tx, ty];
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
    if (sc.id === 'SC-057' && !String(sc.sets || '').includes('act7_complete')) {
      sc.sets = sc.sets ? `${sc.sets};act7_complete` : 'act7_complete';
      addFlag('act7_complete');
    }
  }
  for (const en of content.encounters || []) addFlag(en.set_flag);
  for (const q of content.quests || []) {
    addFlag(q.completion_flags);
    if (q.start_trigger && /^[a-z]/.test(q.start_trigger)) addFlag(q.start_trigger);
  }
  for (const extra of [
    'act2_complete', 'act7_complete', 'after_pica_repaired', 'callsign_customized',
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
    const meta = AREA_META[id];
    if (!meta) throw new Error(`Architecture error: unknown campaign sector ${id}`);
    const bp = buildAreaArchitecture(id, meta);
    const { w, h, collision, terrainLayer } = bp;

    // Validate explicit authored start position & full room connectivity WITHOUT mutating geometry
    const startSpec = bp.anchors?.start;
    if (!Array.isArray(startSpec) || startSpec.length < 2) {
      throw new Error(`Layout error in ${id}: missing authored start anchor`);
    }
    const startTx = startSpec[0], startTy = startSpec[1], startDir = startSpec[2] || 'right';
    const reachableMask = validateAreaConnectivity(id, collision, w, h, startTx, startTy);
    const start = { x: startTx * 32 + 16, y: startTy * 32 + 16, dir: startDir };

    const occupied = new Set([`${startTx},${startTy}`]);
    const portalApproaches = new Set();
    const entranceClearance = new Set();

    // Place structurally embedded doorways/passages strictly from each area's architectural blueprint
    const rawPortals = portalsByArea[id] || [];
    const portalObjects = rawPortals.map((p, idx) => {
      const slot = bp.portalSlots?.[p.name];
      if (!slot) {
        throw new Error(`Architecture error in ${id}: missing authored portalSlot for ${p.name}`);
      }
      const targetMeta = AREA_META[p.to] || AREA_META.A00;
      const tx = slot.tx;
      const ty = slot.ty;
      const facing = slot.dir || p.dir;
      const portalStyle = slot.style || targetMeta.doorStyle;
      const portalArt = slot.art || targetMeta.doorArt;
      const portalLabel = slot.label || null;
      const portalAssembly = slot.assembly || inferPortalAssembly(portalArt);

      if (!Number.isInteger(tx) || !Number.isInteger(ty) || tx < 1 || ty < 2 || tx > w - 2 || ty > h - 3) {
        throw new Error(`Architecture error in ${id}: portal ${p.name} at (${tx},${ty}) is out of bounds`);
      }
      if (collision[ty * w + tx] !== 0 || reachableMask[ty * w + tx] !== 1) {
        throw new Error(`Architecture error in ${id}: portal ${p.name} at (${tx},${ty}) is blocked or unreachable`);
      }
      const pk = `${tx},${ty}`;
      if (occupied.has(pk)) {
        throw new Error(`Architecture error in ${id}: portal ${p.name} at (${tx},${ty}) overlaps another authored position`);
      }
      occupied.add(pk);

      // Verify and protect the inward approach tile directly in front of the doorway
      const inDx = facing === 'right' ? -1 : facing === 'left' ? 1 : 0;
      const inDy = facing === 'down' ? -1 : facing === 'up' ? 1 : 0;
      const ax = tx + inDx, ay = ty + inDy;
      if (ax < 1 || ay < 2 || ax > w - 2 || ay > h - 3 || collision[ay * w + ax] !== 0) {
        throw new Error(`Architecture error in ${id}: portal ${p.name} inward approach (${ax},${ay}) is blocked`);
      }
      portalApproaches.add(`${ax},${ay}`);

      // Reserve the full architectural entrance clearance zone from background/foreground scenery
      const outDx = -inDx, outDy = -inDy;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          entranceClearance.add(`${tx + dx},${ty + dy}`);
          entranceClearance.add(`${tx + outDx + dx},${ty + outDy + dy}`);
        }
      }

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
          facing,
          portalStyle,
          portalArt,
          portalAssembly,
          ...(portalLabel ? { portalLabel } : {}),
          ...(p.reqFlag ? { requiresFlag: p.reqFlag } : {})
        }
      };
    });

    const anchorCtx = { w, h, collision, terrainLayer, occupied, portalApproaches };
    const place = (role, anchor) => placeAuthoredAnchor(id, role, anchor, anchorCtx);

    const entities = [];
    const triggers = [];

    if (area.save_point === 'yes') {
      const [tx, ty] = place('save_terminal', bp.anchors?.save);
      entities.push({ id: `save_${id.toLowerCase()}`, type: 'save', tx, ty, interact: true, solid: true, label: 'SAVE TERMINAL' });
    }

    if (AREA_CRATES[id]) {
      const cr = AREA_CRATES[id];
      const [tx, ty] = place(`supply_crate:${cr.id}`, bp.anchors?.crate);
      entities.push({
        id: cr.id, type: 'crate', tx, ty, interact: true, solid: true,
        hideAfterFlag: cr.flag, grantItems: cr.grant, label: 'SUPPLY CACHE'
      });
    }

    (AREA_NPCS[id] || []).forEach((npc, ni) => {
      const [tx, ty] = place(`npc:${npc.id}`, bp.anchors?.npcs?.[ni]);
      entities.push({
        id: npc.id, type: 'npc', artId: npc.artId, dir: npc.dir || 'down',
        tx, ty, interact: true, solid: true, label: npc.label,
        ...(npc.trigger ? { trigger: npc.trigger } : {}),
        ...(npc.sceneId ? { sceneId: npc.sceneId } : {}),
        ...(npc.ambientArea ? { ambientArea: npc.ambientArea } : {})
      });
    });

    const hasAmbient = (content.dialogue || []).some(d => d.area === id && d.scene_id === 'ambient');
    if (hasAmbient && !entities.some(e => e.ambientArea === id)) {
      const [tx, ty] = place('ambient_record', bp.anchors?.ambient);
      entities.push({ id: `ambient_${id.toLowerCase()}`, type: 'note', tx, ty, interact: true, label: 'FIELD RECORD', ambientArea: id });
    }

    if (['A09', 'A13', 'A17', 'A20'].includes(id)) {
      const [tx, ty] = place('rest_bench', bp.anchors?.bench);
      entities.push({ id: `bench_${id.toLowerCase()}`, type: 'bench', tx, ty, interact: true, solid: true, label: 'REST BENCH' });
    }

    const usedTriggers = new Set(entities.map(e => e.trigger).filter(Boolean));
    const areaScenes = content.scenes.filter(s => SCENE_AREA[s.id] === id);
    let sceneIdx = 0;
    for (const sc of areaScenes) {
      if (sc.trigger === 'NEW_GAME' || sc.trigger === AREA_ENTRY_TRIGGER[id]) continue;
      if (usedTriggers.has(sc.trigger)) continue;
      usedTriggers.add(sc.trigger);

      const lowerTitle = ((sc.title || '') + ' ' + (sc.trigger || '')).toLowerCase();
      const isPod = lowerTitle.includes('pod');
      const isTerminal = lowerTitle.includes('console') || lowerTitle.includes('case') || lowerTitle.includes('uplink') || lowerTitle.includes('cylinder') || lowerTitle.includes('ledger') || lowerTitle.includes('archive') || lowerTitle.includes('receiver');
      const isSwitch = lowerTitle.includes('switch') || lowerTitle.includes('breaker') || lowerTitle.includes('reclassify') || lowerTitle.includes('isolate') || lowerTitle.includes('repeater') || lowerTitle.includes('bridge') || lowerTitle.includes('exchanger');
      const explicitSceneAnchor = bp.anchors?.sceneById?.[sc.id] ?? bp.anchors?.scenes?.[sceneIdx++];
      const [tx, ty] = place(`scene:${sc.id}`, explicitSceneAnchor);

      entities.push({
        id: `${isPod || isTerminal || isSwitch ? 'obj' : 'evt'}_${sc.id.toLowerCase().replace('-', '_')}`,
        type: isPod ? 'pod' : isSwitch ? 'switch' : isTerminal ? 'terminal' : 'puzzle',
        tx, ty, interact: true, solid: true,
        trigger: sc.trigger, sceneId: sc.id,
        label: String(sc.title || sc.id).replace(/\s*\(Act \d+\)/, '').toUpperCase().slice(0, 28)
      });
    }

    let sqIdx = 0;
    for (const [sqId, sqArea] of Object.entries(SIDEQUEST_AREA)) {
      if (sqArea !== id) continue;
      const sq = (content.quests || []).find(q => q.id === sqId);
      if (!sq) continue;
      const explicitSqAnchor = bp.anchors?.sidequestById?.[sqId] ?? bp.anchors?.sidequests?.[sqIdx++];
      const [tx, ty] = place(`sidequest:${sqId}`, explicitSqAnchor);
      entities.push({
        id: `sq_node_${sqId.toLowerCase().replace('-', '_')}`,
        type: 'terminal', tx, ty, interact: true, solid: true,
        sidequestId: sqId,
        label: sq.title.toUpperCase().slice(0, 26)
      });
    }

    const noncombat = (content.encounters || []).filter(en => en.area === id && !['battle', 'boss'].includes(en.kind));
    noncombat.forEach((en, pi) => {
      const explicitPuzzleAnchor = bp.anchors?.puzzleById?.[en.id] ?? bp.anchors?.puzzles?.[pi];
      const [tx, ty] = place(`encounter:${en.id}`, explicitPuzzleAnchor);
      entities.push({
        id: `enc_obj_${en.id.toLowerCase().replace('-', '_')}`,
        type: 'puzzle', tx, ty, interact: true, solid: true,
        encounterId: en.id, doneFlag: en.set_flag || undefined,
        label: `${en.id} ${String(en.kind || 'PUZZLE').toUpperCase()}`
      });
    });

    const optionalBattles = (content.encounters || []).filter(e => e.area === id && NON_MANDATORY_BATTLES.has(e.id));
    optionalBattles.forEach((en, bi) => {
      const explicitBattleAnchor = bp.anchors?.battleById?.[en.id] ?? bp.anchors?.battles?.[bi];
      const [tx, ty] = place(`battle:${en.id}`, explicitBattleAnchor);
      entities.push({
        id: `battle_${en.id.toLowerCase().replace('-', '_')}`,
        type: 'switch', tx, ty, interact: true, solid: true,
        trigger: `FIGHT_${en.id.replace('-', '_')}`,
        label: `ENGAGE ${String(en.units || en.id).toUpperCase().slice(0, 22)}`
      });
    });

    // Purposeful, entrance-respecting architectural dressing:
    // - Blueprint-authored `bp.details` come first
    // - Wall/foreground atlas accents ONLY dress plain solid masonry (collision===1 && terrainLayer===0)
    //   and NEVER overlap bespoke structural tiles (16-20), buildings (8/9), cliffs (12), water (2),
    //   waterfalls, or ANY portal entrance clearance box!
    const reserved = new Set();
    reserved.add(`${startTx},${startTy}`);
    for (const p of portalObjects) reserved.add(`${p.x / 32},${p.y / 32}`);
    for (const e of entities) reserved.add(`${e.tx},${e.ty}`);
    for (const k of portalApproaches) reserved.add(k);

    const wfCols = new Set();
    for (const wf of bp.waterfalls) for (let dx = 0; dx < (wf.w || 1); dx++) wfCols.add(wf.x + dx);

    const canPlaceWallDetail = (tx, ty, sw, sh, checkSouthWalkable) => {
      const tw = sw / 32, th = sh / 32;
      if (tx < 0 || ty < 0 || tx + tw > w || ty + th > h) return false;
      let touchesWalkable = false;
      for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) {
        const cx = tx + dx, cy = ty + dy;
        const key = `${cx},${cy}`;
        if (collision[cy * w + cx] !== 1 || terrainLayer[cy * w + cx] !== 0) return false;
        if (reserved.has(key) || entranceClearance.has(key)) return false;
      }
      if (checkSouthWalkable) {
        const checkY = ty + th;
        if (checkY < h) {
          for (let dx = 0; dx < tw; dx++) if (collision[checkY * w + (tx + dx)] === 0) touchesWalkable = true;
        }
      } else {
        const checkY = ty - 1;
        if (checkY >= 0) {
          for (let dx = 0; dx < tw; dx++) if (collision[checkY * w + (tx + dx)] === 0) touchesWalkable = true;
        }
      }
      return touchesWalkable;
    };

    const canPlaceGroundDetail = (tx, ty, sw, sh) => {
      const tw = sw / 32, th = sh / 32;
      if (tx < 1 || ty < 2 || tx + tw > w - 1 || ty + th > h - 2) return false;
      for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) {
        const cx = tx + dx, cy = ty + dy;
        const key = `${cx},${cy}`;
        const tc = terrainLayer[cy * w + cx];
        if (collision[cy * w + cx] !== 0 || reserved.has(key) || entranceClearance.has(key)) return false;
        if (tc !== 0 && tc !== 10) return false;
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
    const groundUsed = new Set();
    const areaNum = parseInt(id.slice(1), 10) || 0;

    // 1. Place explicit blueprint-authored structural/scenery compositions first
    if (Array.isArray(bp.details)) {
      for (const d of bp.details) {
        const tw = d.sw / 32, th = d.sh / 32;
        if (d.layer === 'ground') {
          if (!canPlaceGroundDetail(d.tx, d.ty, d.sw, d.sh)) {
            throw new Error(`Layout error in ${id}: authored ground detail ${d.id} at (${d.tx},${d.ty}) conflicts with terrain/reserved tiles`);
          }
          for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) groundUsed.add(`${d.tx + dx},${d.ty + dy}`);
        } else {
          if (!canPlaceWallDetail(d.tx, d.ty, d.sw, d.sh, d.layer === 'background')) {
            throw new Error(`Layout error in ${id}: authored ${d.layer} detail ${d.id} at (${d.tx},${d.ty}) conflicts with walls or entrance clearance`);
          }
          for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) bgUsed.add(`${d.tx + dx},${d.ty + dy}`);
        }
        envDetails.push({ ...d });
      }
    }

    // 2. Restrained architectural wall dressing (spaced cleanly, never crowding doors or custom tilework)
    for (let x = 2, slot = 0; x <= w - 4 && bgPool.length; x += 5, slot++) {
      const pick = bgPool[(slot + areaNum) % bgPool.length];
      const tw = pick.sw / 32, th = pick.sh / 32;
      if (th > 2) continue;
      let placedY = -1;
      for (const tryY of [0, 1]) {
        let ok = canPlaceWallDetail(x, tryY, pick.sw, pick.sh, true);
        for (let dx = 0; dx < tw; dx++) {
          if (bgUsed.has(`${x + dx},${tryY}`) || wfCols.has(x + dx)) ok = false;
        }
        if (ok) { placedY = tryY; break; }
      }
      if (placedY < 0) continue;
      for (let dx = 0; dx < tw; dx++) bgUsed.add(`${x + dx},${placedY}`);
      envDetails.push({
        id: `bg_${id.toLowerCase()}_${x}`, atlas: pick.atlas, layer: 'background',
        tx: x, ty: placedY, sx: pick.sx, sy: pick.sy, sw: pick.sw, sh: pick.sh
      });
      x += Math.max(0, tw - 2);
    }

    // 3. Foreground architectural framing on south masonry rims (strictly clear of portals & bespoke tiles)
    if (fgPool.length) {
      const fgPositions = [2, Math.max(6, Math.floor(w / 2) - 1), w - 5];
      fgPositions.forEach((fx, fi) => {
        const pick = fgPool[(fi + areaNum) % fgPool.length];
        if (canPlaceWallDetail(fx, h - 2, pick.sw, pick.sh, false)) {
          envDetails.push({
            id: `fg_${id.toLowerCase()}_${fi}`, atlas: pick.atlas, layer: 'foreground',
            tx: fx, ty: h - 2, sx: pick.sx, sy: pick.sy, sw: pick.sw, sh: pick.sh
          });
        }
      });
    }

    // 4. Subtle floor/ground accents on clean open floor/trail tiles (max 3 per area, clear of entrances)
    const candidateGround = [];
    for (let gy = 4; gy <= h - 4; gy += 3) {
      for (let gx = 3; gx <= w - 4; gx += 5) candidateGround.push([gx, gy]);
    }
    let groundPlaced = 0;
    for (let ci = 0; ci < candidateGround.length && groundPlaced < 3 && groundPool.length; ci++) {
      const [gx, gy] = candidateGround[(ci * 3 + areaNum) % candidateGround.length];
      const pick = groundPool[(groundPlaced + areaNum) % groundPool.length];
      const tw = pick.sw / 32, th = pick.sh / 32;
      if (!canPlaceGroundDetail(gx, gy, pick.sw, pick.sh)) continue;
      let overlap = false;
      for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) if (groundUsed.has(`${gx + dx},${gy + dy}`)) overlap = true;
      if (overlap) continue;
      for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) groundUsed.add(`${gx + dx},${gy + dy}`);
      envDetails.push({
        id: `gr_${id.toLowerCase()}_${groundPlaced}`, atlas: pick.atlas, layer: 'ground',
        tx: gx, ty: gy, sx: pick.sx, sy: pick.sy, sw: pick.sw, sh: pick.sh
      });
      groundPlaced++;
    }

    const lamps = bp.lamps?.length ? bp.lamps : [
      { x: startTx, y: Math.max(2, startTy - 1), r: 105, color: meta.lampColor, flicker: false },
      { x: Math.floor(w / 2), y: Math.floor(h / 2), r: 115, color: meta.lampColor, flicker: true }
    ];

    const scConf = STEALTH_CONFIG[id];
    const dSpec = bp.anchors?.drone;
    if (scConf && !dSpec) {
      throw new Error(`Layout error in ${id}: stealth sector missing authored drone patrol spec`);
    }
    const drones = scConf ? [{
      start: dSpec.start,
      zone: dSpec.zone,
      waypoints: dSpec.waypoints
    }] : [];

    const security = scConf ? (() => {
      const z = dSpec.zone;
      return {
        defaultMode: 'normal',
        zones: [{
          id: scConf.zoneId,
          x: z[0] * 32,
          y: z[1] * 32,
          w: (z[2] - z[0] + 1) * 32,
          h: (z[3] - z[1] + 1) * 32,
          mode: 'stealth',
          consequence: scConf.conseq,
          ...(scConf.enc ? { encounterId: scConf.enc } : {})
        }]
      };
    })() : undefined;

    maps.push({
      id, name: area.name, act: meta.act,
      orientation: 'orthogonal', tilewidth: 32, tileheight: 32, width: w, height: h,
      environmentPalette: meta.palette, campaignTheme: meta.theme,
      environmentDetails: envDetails,
      terrainLayer,
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
      props: [],
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
