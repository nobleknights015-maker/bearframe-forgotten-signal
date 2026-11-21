import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAMPAIGN_GEAR,
  CAMPAIGN_CONSUMABLES,
  levelForXp,
  applyCampaignLevelProgression,
  effectiveUnitStats
} from '../public/js/engine/campaign-gear.js';
import { equipItem, createCampaignParty } from '../public/js/engine/rpg-party.js';
import {
  createNarrativeState,
  nextNarrativeScene,
  skipOptionalNarrativeScene,
  applyNarrativeChoice
} from '../public/js/engine/narrative-runtime.js';
import {
  formatCampaignDialogue,
  formatCampaignSpeaker,
  portraitIdForSpeaker
} from '../public/js/engine/campaign-cinematics.js';
import {
  auditCampaignGameplayReachability,
  auditCampaignPortalApproaches,
  createCampaignMissionFactory
} from '../public/js/engine/campaign-world.js';
import { compileCampaignEnvironmentArt } from '../public/js/engine/campaign-environment-art.js';
import { compileFullCampaignBundle, AREA_META, WORLD_EDGES } from '../public/js/engine/campaign-world-builder.js';
import { NAV_GROUPS } from '../public/js/engine/campaign-field-menu.js';

const STORY_PATH = new URL('../public/assets/aeon/story/campaign.json', import.meta.url);
const WORLD_PATH = new URL('../public/assets/aeon/story/opening-world-review-candidate.json', import.meta.url);
const ENV_PATH = new URL('../public/assets/aeon/environment/environment-art.json', import.meta.url);
const ICON_PATH = new URL('../public/assets/aeon/icons/icon-manifest.json', import.meta.url);
const MANIFEST_PATH = new URL('../public/assets/aeon/asset-manifest.json', import.meta.url);
const AEON_PUBLIC_ROOT = new URL('../public/', import.meta.url);

test('campaign gear catalog enforces lineage rules and progression scales deterministically', () => {
  assert.ok(CAMPAIGN_GEAR['calibrated-wrench']);
  assert.ok(CAMPAIGN_GEAR['signal-conductor']);
  assert.ok(CAMPAIGN_CONSUMABLES['repair-kit']);
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(20), 2);
  assert.equal(levelForXp(80), 3);

  const partyState = createCampaignParty({
    members: [
      { id: 'sleeper', lineage: 'sleeper', name: 'Sleeper', level: 1, xp: 0, hp: 20, maxHp: 32, ep: 8, maxEp: 12, attack: 10, defense: 4, speed: 9 },
      { id: 'rill', lineage: 'echo', name: 'Rill', level: 1, xp: 0, hp: 30, maxHp: 38, ep: 12, maxEp: 18, attack: 9, defense: 5, speed: 10 }
    ],
    active: ['sleeper', 'rill'],
    equipment: {
      sleeper: { weapon: 'legacy-tool', armor: null, accessory: null },
      rill: { weapon: 'echo-clamp', armor: null, accessory: null }
    },
    inventory: {
      'calibrated-wrench': 1,
      'echo-link': 1,
      'patched-plating': 1
    }
  });

  // Equip Sleeper weapon and check lineage rejection for Echo weapon on Sleeper
  const eqOk = equipItem(partyState, 'sleeper', 'weapon', 'calibrated-wrench', CAMPAIGN_GEAR);
  assert.equal(eqOk.equipment.sleeper.weapon, 'calibrated-wrench');
  assert.equal(eqOk.inventory['calibrated-wrench'], undefined);
  assert.equal(eqOk.inventory['legacy-tool'], 1);

  assert.throws(
    () => equipItem(eqOk, 'sleeper', 'weapon', 'echo-link', CAMPAIGN_GEAR),
    /cannot equip|lineage|incompatible/i
  );

  const stats = effectiveUnitStats(eqOk.members[0], eqOk.equipment);
  assert.equal(stats.attack, 13);
  assert.equal(stats.defense, 5);

  const worldForLevel = {
    party: structuredClone(eqOk.members),
    equipment: structuredClone(eqOk.equipment),
    inventory: structuredClone(eqOk.inventory),
    progression: { xp: 85, credits: 40 }
  };
  const leveled = applyCampaignLevelProgression(worldForLevel);
  assert.equal(leveled.leveledUp.length, 2);
  assert.equal(leveled.world.party[0].level, 3);
  assert.equal(leveled.world.party[1].level, 3);
  assert.ok(leveled.world.party[0].maxHp > 32);
  assert.ok(leveled.world.party[0].attack > 10);
});

test('cinematics formatter binds callsign, pronouns, and portrait mappings', () => {
  const world = { stats: { callsign: 'Vesper', pronouns: 'she/her' } };
  assert.equal(
    formatCampaignDialogue('{CALLSIGN} checked {their} rig because {they} {are} ready.', world),
    'Vesper checked her rig because she is ready.'
  );
  assert.equal(formatCampaignSpeaker('Sleeper', world, 'sleeper_C'), 'VESPER');
  assert.equal(formatCampaignSpeaker('Guardian', world, 'sleeper_C'), 'GUARDIAN');
  assert.equal(portraitIdForSpeaker('SLEEPER', 'sleeper_C'), 'sleeper_C');
  assert.equal(portraitIdForSpeaker('WARD-7 / VOICE SYNTHESIS', 'sleeper_A'), 'ward7');
  assert.equal(portraitIdForSpeaker('SYSTEM', 'sleeper_A'), null);
});

test('expanded environment asset library and UI icon sheet meet Sea-of-Stars breadth requirements', () => {
  const envManifest = JSON.parse(fs.readFileSync(ENV_PATH, 'utf8'));
  const iconManifest = JSON.parse(fs.readFileSync(ICON_PATH, 'utf8'));
  assert.equal(Object.keys(envManifest.palettes).length, 14);
  assert.equal(Object.keys(envManifest.doorways).length, 17);
  assert.equal(Object.keys(envManifest.objects).length, 9);
  assert.equal(Object.keys(iconManifest.icons).length, 20);

  const iconPng = fs.readFileSync(new URL(iconManifest.sheet, AEON_PUBLIC_ROOT));
  assert.equal(iconPng.readUInt32BE(16), 160);
  assert.equal(iconPng.readUInt32BE(20), 32);

  const navIds = NAV_GROUPS.flatMap(g => g.items.map(i => i.id));
  assert.equal(navIds.length, 12);
  for (const req of ['status', 'party', 'items', 'equipment', 'skills', 'quests', 'worldmap', 'dialogue', 'save', 'settings', 'help', 'title']) {
    assert.ok(navIds.includes(req), `Missing consolidated nav item: ${req}`);
  }
  assert.ok(WORLD_EDGES.length >= 28, 'World map graph must link all 29 sectors');
});

test('private Director Cut v2 story skips optional SC-060/SC-061 and routes CHOICE-07', () => {
  if (!fs.existsSync(STORY_PATH)) return;
  const content = JSON.parse(fs.readFileSync(STORY_PATH, 'utf8'));
  assert.equal(content.scenes.length, 64);
  assert.equal(content.encounters.length, 61);
  assert.equal(content.choices.length, 7);

  let st = createNarrativeState(content);
  for (const sid of ['SC-060', 'SC-061']) {
    const idx = content.scenes.findIndex(s => s.id === sid);
    assert.ok(idx > 0, `Expected ${sid} in scenes`);
    const synth = createNarrativeState(content, {
      completed: Object.fromEntries(content.scenes.slice(0, idx).map(s => [s.id, true]))
    });
    assert.equal(nextNarrativeScene(content, synth)?.id, sid);
    const afterSkip = skipOptionalNarrativeScene(content, synth, sid);
    assert.equal(afterSkip.skipped[sid], true);
    assert.notEqual(nextNarrativeScene(content, afterSkip)?.id, sid);
  }

  // Test CHOICE-07 branching between reclassify and sever (bound to SC-042/SC-043)
  const choice07 = content.choices.find(c => c.id === 'CHOICE-07');
  assert.ok(choice07);
  const optKeys = Object.keys(choice07.options);
  assert.equal(optKeys.length, 2);

  st = createNarrativeState(content, { activeScene: 'SC-042' });
  const branchA = applyNarrativeChoice(content, st, 'CHOICE-07', optKeys[0]);
  const branchB = applyNarrativeChoice(content, st, 'CHOICE-07', optKeys[1]);
  assert.notEqual(branchA.enums.final_resolution, branchB.enums.final_resolution);
  assert.ok(['reclassify', 'isolate'].includes(branchA.enums.final_resolution));
  assert.ok(['reclassify', 'isolate'].includes(branchB.enums.final_resolution));
});

test('full 29-area world compiles cleanly with environment art and 0 blocked reachability', () => {
  if (!fs.existsSync(WORLD_PATH) || !fs.existsSync(ENV_PATH)) return;
  const world = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
  const envManifest = JSON.parse(fs.readFileSync(ENV_PATH, 'utf8'));
  const readDims = rel => {
    const buf = fs.readFileSync(new URL(rel, AEON_PUBLIC_ROOT));
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  };
  const images = new Map();
  for (const d of Object.values(envManifest.doorways)) {
    if (d.closed) images.set(d.closed, readDims(d.closed));
    if (d.open) images.set(d.open, readDims(d.open));
  }
  for (const p of Object.values(envManifest.palettes)) {
    images.set(p.floor, readDims(p.floor));
    images.set(p.wall, readDims(p.wall));
  }
  for (const s of Object.values(envManifest.objects || {})) {
    images.set(s, readDims(s));
  }
  const environmentArt = compileCampaignEnvironmentArt(envManifest, images);
  const reach = auditCampaignGameplayReachability(world);
  const portals = auditCampaignPortalApproaches(world);
  assert.equal(reach.blockedCount, 0, JSON.stringify(reach.blocked));
  assert.equal(portals.inaccessiblePortals, 0, JSON.stringify(portals.blockedPortals));

  const factory = createCampaignMissionFactory(world, { environmentArt });
  assert.equal(factory.graph.ids.length, 29);
  const usedAtlases = new Set();
  const usedPalettes = new Set();
  let mapsWithWaterfalls = 0;
  let mapsWithSky = 0;
  let mapsWithLightShafts = 0;
  for (const id of factory.graph.ids) {
    const mapSpec = world.maps.find(m => m.id === id);
    const mission = factory.missionForSync(id);
    assert.ok(mission, `Expected compiled mission for ${id}`);
    assert.ok(mission.environmentDetails, `Expected layered environmentDetails for ${id}`);
    assert.ok(Array.isArray(mission.terrainLayer), `Expected terrainLayer for ${id}`);
    assert.ok(mapSpec?.environmentPalette, `Expected environmentPalette for ${id}`);
    usedPalettes.add(mapSpec.environmentPalette);
    if (mission.waterfalls?.length) mapsWithWaterfalls++;
    if (mission.skyBackdrop) mapsWithSky++;
    if (mission.lightShafts?.length) mapsWithLightShafts++;
    for (const item of mapSpec?.environmentDetails || []) {
      if (item.atlas) usedAtlases.add(item.atlas);
    }
  }
  assert.equal(usedAtlases.size, 9, `All 9 scenery atlases must be actively used, got: ${[...usedAtlases].join(', ')}`);
  assert.ok(usedPalettes.size >= 13, `Expected rich regional palette diversity, got ${usedPalettes.size}`);
  assert.ok(mapsWithWaterfalls >= 4, `Expected animated waterfalls in wetland/waterworks/cathedral maps, got ${mapsWithWaterfalls}`);
  assert.ok(mapsWithSky >= 10, `Expected parallax sky backdrops across exterior/ruin areas, got ${mapsWithSky}`);
  assert.ok(mapsWithLightShafts >= 15, `Expected volumetric light shafts across sectors, got ${mapsWithLightShafts}`);
});

test('shared campaign-world-builder compiles all 29 areas with public environment art and 0 blocked reachability', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const envManifest = JSON.parse(fs.readFileSync(ENV_PATH, 'utf8'));
  const readDims = rel => {
    const buf = fs.readFileSync(new URL(rel, AEON_PUBLIC_ROOT));
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  };
  const images = new Map();
  for (const d of Object.values(envManifest.doorways)) {
    if (d.closed) images.set(d.closed, readDims(d.closed));
    if (d.open) images.set(d.open, readDims(d.open));
  }
  for (const p of Object.values(envManifest.palettes)) {
    images.set(p.floor, readDims(p.floor));
    images.set(p.wall, readDims(p.wall));
  }
  for (const s of Object.values(envManifest.objects || {})) {
    images.set(s, readDims(s));
  }
  const environmentArt = compileCampaignEnvironmentArt(envManifest, images);

  const syntheticRaw = {
    schemaVersion: 1,
    revision: 2,
    flagSchema: { gameplay_flags: ['game_started'], exclusive_enums: {}, relationships: {} },
    areas: Object.keys(AREA_META).map((id, i) => ({
      id,
      name: `Synthetic Sector ${id}`,
      save_point: i % 4 === 0 ? 'yes' : 'no',
      story_purpose: 'Synthetic QA verification'
    })),
    scenes: [
      { id: 'SC-000', trigger: 'NEW_GAME', title: 'Synthetic Opening', dialogue: [], sets: 'game_started' },
      { id: 'SC-008', trigger: 'SYNTH_BOSS', title: 'Synthetic Boss', dialogue: [], sets: 'boss_b01_defeated' }
    ],
    dialogue: [],
    choices: [],
    insertions: [],
    quests: [],
    encounters: [
      { id: 'EN-001', kind: 'battle', area: 'A02', units: 'Crawler', set_flag: 'en001_done' },
      { id: 'EN-005', kind: 'boss', area: 'A03', units: 'Boss', set_flag: 'boss_b01_defeated' }
    ]
  };

  const { content, world } = compileFullCampaignBundle(syntheticRaw, manifest);
  assert.equal(world.maps.length, 29);
  assert.equal(world.combat.encounters.length, 2);
  assert.equal(world.mandatoryCombats.length, 1);
  assert.ok(content.flagSchema.gameplay_flags.includes('act2_complete'));

  const reach = auditCampaignGameplayReachability(world);
  const portals = auditCampaignPortalApproaches(world);
  assert.equal(reach.blockedCount, 0, JSON.stringify(reach.blocked));
  assert.equal(portals.inaccessiblePortals, 0, JSON.stringify(portals.blockedPortals));

  const factory = createCampaignMissionFactory(world, { environmentArt });
  assert.equal(factory.graph.ids.length, 29);
  const usedAtlases = new Set();
  const usedPalettes = new Set();
  let mapsWithWaterfalls = 0;
  let mapsWithSky = 0;
  let mapsWithLightShafts = 0;
  for (const id of factory.graph.ids) {
    const mapSpec = world.maps.find(m => m.id === id);
    const mission = factory.missionForSync(id);
    assert.ok(mission, `Expected compiled mission for ${id}`);
    assert.ok(mission.environmentDetails, `Expected layered environmentDetails for ${id}`);
    assert.ok(Array.isArray(mission.terrainLayer), `Expected terrainLayer for ${id}`);
    assert.ok(mapSpec?.environmentPalette, `Expected environmentPalette for ${id}`);
    usedPalettes.add(mapSpec.environmentPalette);
    if (mission.waterfalls?.length) mapsWithWaterfalls++;
    if (mission.skyBackdrop) mapsWithSky++;
    if (mission.lightShafts?.length) mapsWithLightShafts++;
    for (const item of mapSpec?.environmentDetails || []) {
      if (item.atlas) usedAtlases.add(item.atlas);
    }
  }
  assert.equal(usedAtlases.size, 9, `All 9 scenery atlases must be actively used, got: ${[...usedAtlases].join(', ')}`);
  assert.ok(usedPalettes.size >= 13, `Expected rich regional palette diversity, got ${usedPalettes.size}`);
  assert.ok(mapsWithWaterfalls >= 4, `Expected waterfalls, got ${mapsWithWaterfalls}`);
  assert.ok(mapsWithSky >= 10, `Expected sky backdrops, got ${mapsWithSky}`);
  assert.ok(mapsWithLightShafts >= 15, `Expected light shafts, got ${mapsWithLightShafts}`);

  // Architectural & World Design Integrity Audit across ALL 29 sectors
  const oppDir = { right: 'left', left: 'right', up: 'down', down: 'up' };
  const wallMountedArt = new Set([
    'service', 'overgrown', 'elevator', 'archive_seal', 'cathedral_gate',
    'roof_hatch', 'water_lock', 'sluice_gate', 'quarantine_lock',
    'airlock_east', 'airlock_west', 'arch_east', 'arch_west', 'south_threshold'
  ]);
  const naturalOutdoorArt = new Set(['trail_passage', 'bridge_passage', 'rail_gantry', 'arch_east', 'arch_west', 'south_threshold']);
  const layoutFingerprints = new Set();
  const mapById = new Map(world.maps.map(m => [m.id, m]));

  for (const m of world.maps) {
    const col = m.layers.find(l => l.name === 'collision').data;
    const fp = `${m.width}x${m.height}:${col.join('')}:${m.terrainLayer.join(',')}`;
    layoutFingerprints.add(fp);

    const portals = m.layers.find(l => l.name === 'portals').objects;
    for (const p of portals) {
      const props = p.properties;
      const tx = p.x / 32, ty = p.y / 32;
      assert.ok(props.portalLabel && props.portalLabel.length > 0, `Portal ${m.id}:${p.name} missing bespoke architectural label`);

      // Verify wall-mounted doors/airlocks/arches are embedded against a solid wall/structure (ZERO floating doors)
      if (wallMountedArt.has(props.portalArt)) {
        const dx = props.facing === 'right' ? 1 : props.facing === 'left' ? -1 : 0;
        const dy = props.facing === 'down' ? 1 : props.facing === 'up' ? -1 : 0;
        const wx = tx + dx, wy = ty + dy;
        assert.ok(
          wx >= 0 && wy >= 0 && wx < m.width && wy < m.height && col[wy * m.width + wx] === 1,
          `Floating door detected at ${m.id}:${p.name} (${tx},${ty}) facing ${props.facing} art=${props.portalArt}`
        );
      }

      // Verify geographic reciprocity with destination portal
      const destMap = mapById.get(props.toMap);
      assert.ok(destMap, `Missing destination map ${props.toMap} from ${m.id}`);
      const backPortal = destMap.layers.find(l => l.name === 'portals').objects.find(o => o.name === props.toPortal);
      assert.ok(backPortal, `Missing reciprocal portal ${props.toMap}:${props.toPortal}`);
      assert.equal(
        backPortal.properties.facing,
        oppDir[props.facing],
        `Geographic mismatch: ${m.id}->${props.toMap} faces ${props.facing}, return faces ${backPortal.properties.facing}`
      );
    }
  }

  // Every single one of the 29 sectors must have a unique bespoke floor plan
  assert.equal(layoutFingerprints.size, 29, `Expected 29 unique area floor plans, got ${layoutFingerprints.size}`);

  // Verify natural outdoor landscape exits on key exterior regions
  for (const extId of ['A02', 'A04', 'A12', 'A13', 'A15', 'A17', 'A27', 'A28']) {
    const m = mapById.get(extId);
    const portals = m.layers.find(l => l.name === 'portals').objects;
    for (const p of portals) {
      const art = p.properties.portalArt;
      // Allow real building/elevator doors ONLY if backed by a building facade (9) or interior masonry wall, otherwise natural passage
      const tx = p.x / 32, ty = p.y / 32;
      const dx = p.properties.facing === 'right' ? 1 : p.properties.facing === 'left' ? -1 : 0;
      const dy = p.properties.facing === 'down' ? 1 : p.properties.facing === 'up' ? -1 : 0;
      const backedByBuilding = m.terrainLayer[(ty + dy) * m.width + (tx + dx)] === 9;
      assert.ok(
        naturalOutdoorArt.has(art) || backedByBuilding || (extId === 'A27' && art === 'elevator'),
        `Exterior area ${extId}:${p.name} uses non-natural door art '${art}' without building facade`
      );
    }
  }
});
