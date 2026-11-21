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
  beginNarrativeScene,
  narrativeLines,
  acknowledgeNarrativeLine,
  completeNarrativeScene,
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
  compileCampaignWorld,
  createCampaignMissionFactory
} from '../public/js/engine/campaign-world.js';
import { compileCampaignEncounterGates } from '../public/js/engine/campaign-encounter-gates.js';
import { compileCampaignQuestJournal } from '../public/js/engine/campaign-quest-journal.js';
import { compileCampaignCombatStaging } from '../public/js/engine/campaign-combat-staging.js';
import { compileCampaignEnvironmentArt } from '../public/js/engine/campaign-environment-art.js';
import {
  compileFullCampaignBundle,
  AREA_META,
  WORLD_EDGES,
  validateAreaConnectivity,
  placeAuthoredAnchor
} from '../public/js/engine/campaign-world-builder.js';
import { NAV_GROUPS } from '../public/js/engine/campaign-field-menu.js';

const STORY_PATH = new URL('../public/assets/aeon/story/campaign.json', import.meta.url);
const WORLD_PATH = new URL('../public/assets/aeon/story/opening-world-review-candidate.json', import.meta.url);
const ENV_PATH = new URL('../public/assets/aeon/environment/environment-art.json', import.meta.url);
const ICON_PATH = new URL('../public/assets/aeon/icons/icon-manifest.json', import.meta.url);
const MANIFEST_PATH = new URL('../public/assets/aeon/asset-manifest.json', import.meta.url);
const AEON_PUBLIC_ROOT = new URL('../public/', import.meta.url);

function loadPublicEnvironmentArt() {
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
  return { envManifest, environmentArt: compileCampaignEnvironmentArt(envManifest, images) };
}

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

test('compiler rejects disconnected rooms without mutating collision and rejects blocked/missing anchors without relocating', () => {
  // 1. Disconnected walkable room MUST throw and MUST NOT tunnel through the separating wall
  const w = 10, h = 8;
  const col = new Array(w * h).fill(1);
  // Room A (x:1..3, y:2..5) and Room B (x:6..8, y:2..5) separated by solid wall x:4..5
  for (let y = 2; y <= 5; y++) {
    for (let x = 1; x <= 3; x++) col[y * w + x] = 0;
    for (let x = 6; x <= 8; x++) col[y * w + x] = 0;
  }
  const snapshotBefore = col.slice();
  assert.throws(
    () => validateAreaConnectivity('TEST_DISC', col, w, h, 2, 3),
    /disconnected walkable tile/i
  );
  assert.deepEqual(col, snapshotBefore, 'Connectivity validator must NEVER mutate collision geometry');

  // 2. Anchor placement MUST reject missing, blocked, solid-terrain, portal-approach, and colliding anchors
  const terr = new Array(w * h).fill(0);
  terr[3 * w + 2] = 2; // water conflict
  const ctx = {
    w, h, collision: col, terrainLayer: terr,
    occupied: new Set(['1,2']),
    portalApproaches: new Set(['3,3'])
  };
  assert.throws(() => placeAuthoredAnchor('TEST', 'missing_obj', null, ctx), /missing authored anchor/i);
  assert.throws(() => placeAuthoredAnchor('TEST', 'blocked_wall', [4, 3], ctx), /blocked by solid geometry/i);
  assert.throws(() => placeAuthoredAnchor('TEST', 'solid_terrain', [2, 3], ctx), /conflicts with solid terrain/i);
  assert.throws(() => placeAuthoredAnchor('TEST', 'blocks_door', [3, 3], ctx), /blocks a doorway approach/i);
  assert.throws(() => placeAuthoredAnchor('TEST', 'duplicate_tile', [1, 2], ctx), /collides with another authored object/i);
  assert.deepEqual(placeAuthoredAnchor('TEST', 'valid_console', [2, 4], ctx), [2, 4]);
});

test('private Director Cut v2 story skips optional SC-060/SC-061 and routes CHOICE-07', (t) => {
  if (!fs.existsSync(STORY_PATH)) {
    t.skip('NOT RUN — private campaign story JSON is not installed in this public workspace');
    return;
  }
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

  // Test CHOICE-07 branching between reclassify and isolate (bound to SC-042/SC-043)
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

test('full 29-area private world compiles cleanly with environment art and 0 blocked reachability', (t) => {
  if (!fs.existsSync(WORLD_PATH) || !fs.existsSync(ENV_PATH)) {
    t.skip('NOT RUN — private compiled world file is not installed in this public workspace');
    return;
  }
  const world = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
  const { environmentArt } = loadPublicEnvironmentArt();
  const reach = auditCampaignGameplayReachability(world);
  const portals = auditCampaignPortalApproaches(world);
  assert.equal(reach.blockedCount, 0, JSON.stringify(reach.blocked));
  assert.equal(portals.inaccessiblePortals, 0, JSON.stringify(portals.blockedPortals));

  const factory = createCampaignMissionFactory(world, { environmentArt });
  assert.equal(factory.graph.ids.length, 29);
  for (const id of factory.graph.ids) {
    const mission = factory.missionForSync(id);
    assert.ok(mission, `Expected compiled mission for ${id}`);
    assert.ok(mission.environmentDetails, `Expected layered environmentDetails for ${id}`);
    assert.ok(Array.isArray(mission.terrainLayer), `Expected terrainLayer for ${id}`);
  }
});

test('end-to-end Director Cut v2 playthrough completes all 10 main quests, 7 choices, 10 mandatory bosses, and both endings for all 4 Sleepers', (t) => {
  if (!fs.existsSync(STORY_PATH) || !fs.existsSync(WORLD_PATH)) {
    t.skip('NOT RUN — private Director Cut v2 files are not installed in this public workspace');
    return;
  }
  const content = JSON.parse(fs.readFileSync(STORY_PATH, 'utf8'));
  const world = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const graph = compileCampaignWorld(world);
  const gates = compileCampaignEncounterGates(world, content);
  const questJournal = compileCampaignQuestJournal(content, world);
  const combatStaging = compileCampaignCombatStaging(world.combat, { worldSpec: world, content, manifest });
  const encById = new Map(content.encounters.map(e => [e.id, e]));
  const combatById = new Map(world.combat.encounters.map(e => [e.id, e]));

  // Verify all 4 approved Sleeper starters initialize cleanly with matching battle sheets
  for (const starterId of ['sleeper_A', 'sleeper_B', 'sleeper_C', 'sleeper_D']) {
    const roster = combatStaging.roster(starterId);
    assert.equal(roster.length, 1);
    assert.equal(roster[0].artId, starterId);
  }

  const reachableMaps = (fromId, flags) => {
    const seen = new Set([fromId]);
    const q = [fromId];
    while (q.length) {
      const id = q.shift();
      const m = graph.get(id);
      for (const p of m.layers.find(l => l.name === 'portals').objects) {
        const req = p.properties.requiresFlag;
        if (req && !flags[req]) continue;
        const to = p.properties.toMap;
        if (!seen.has(to)) { seen.add(to); q.push(to); }
      }
    }
    return seen;
  };

  const findTrigger = (trigger, sceneId) => {
    const hits = [];
    if (world.openingScene?.trigger === trigger) hits.push({ area: world.startArea, kind: 'opening' });
    for (const m of world.maps) {
      if (m.entryTrigger === trigger) hits.push({ area: m.id, kind: 'entry' });
      for (const e of m.entities || []) {
        if (e.trigger === trigger && (!e.sceneId || e.sceneId === sceneId)) hits.push({ area: m.id, kind: 'entity' });
      }
    }
    return hits;
  };

  for (const [branch, expectedResolution, choice01] of [
    ['RECLASSIFY', 'reclassify', 'SHELTER'],
    ['ISOLATE', 'isolate', 'WORKSHOP']
  ]) {
    let state = createNarrativeState(content);
    let flags = { ...state.flags };
    const encounters = {};
    let currentArea = world.startArea;
    let bossesCleared = 0;

    for (let step = 0; step < 120; step++) {
      const scene = nextNarrativeScene(content, state);
      if (!scene) break;
      if (branch === 'ISOLATE' && scene.id === 'SC-042') {
        state = { ...state, skipped: { ...state.skipped, 'SC-042': true } };
        continue;
      }
      const hits = findTrigger(scene.trigger, scene.id);
      assert.ok(hits.length > 0, `No staged trigger for ${scene.id}`);
      const reach = reachableMaps(currentArea, flags);
      const targetHit = hits.find(h => reach.has(h.area));
      assert.ok(targetHit, `Progression softlock: cannot reach ${scene.id} (${hits.map(h => h.area).join('/')}) from ${currentArea}`);
      currentArea = targetHit.area;

      state = beginNarrativeScene(content, { ...state, flags: { ...state.flags, ...flags } }, scene.id, { trigger: scene.trigger });
      for (let g = 0; g < 100; g++) {
        const pendingChoices = content.choices.filter(c => c.scene.split('/').includes(scene.id) && !state.choices[c.id]);
        const readyChoice = pendingChoices.find(c => {
          const gate = world.choiceGates[c.id];
          return gate && (gate.afterLine === null || state.linesRead[gate.afterLine]);
        });
        if (readyChoice) {
          const opts = Object.keys(readyChoice.options);
          const pick = readyChoice.id === 'CHOICE-07'
            ? [branch]
            : readyChoice.id === 'CHOICE-01'
              ? [choice01]
              : opts.slice(0, readyChoice.selection_count || 1);
          state = applyNarrativeChoice(content, state, readyChoice.id, pick);
          flags = { ...flags, ...state.flags };
          continue;
        }
        const nextLine = narrativeLines(content, state).find(l => !state.linesRead[l.line_id]);
        if (nextLine) {
          state = acknowledgeNarrativeLine(content, state, nextLine.line_id);
          flags = { ...flags, ...state.flags };
          continue;
        }
        break;
      }

      let pendingBat = gates.pendingForScene(scene.id, { encounters, flags });
      while (pendingBat) {
        const cSpec = combatById.get(pendingBat.encounterId);
        assert.equal(cSpec?.mapId, currentArea, `Boss ${pendingBat.encounterId} area mismatch for ${scene.id}`);
        encounters[pendingBat.encounterId] = { outcome: 'victory' };
        const srcEnc = encById.get(pendingBat.encounterId);
        if (srcEnc?.set_flag) flags[srcEnc.set_flag] = true;
        bossesCleared++;
        pendingBat = gates.pendingForScene(scene.id, { encounters, flags });
      }

      state = completeNarrativeScene(content, state, scene.id);
      if (scene.id === 'SC-042' && state.enums.final_resolution === 'reclassify') {
        state = { ...state, skipped: { ...state.skipped, 'SC-043': true } };
      }
      flags = { ...flags, ...state.flags };
    }

    assert.equal(nextNarrativeScene(content, state), null, 'All scenes must conclude');
    assert.equal(bossesCleared, 10, 'All 10 mandatory boss stages must trigger and resolve');
    assert.equal(Object.keys(state.choices).length, 7, 'All 7 choice contracts must be decided');
    assert.equal(state.enums.final_resolution, expectedResolution);
    assert.equal(flags.game_completed, true);
    assert.equal(flags.credits_unlocked, true);
    const projectedQuests = questJournal.project(flags);
    for (const mq of content.quests.filter(q => q.id.startsWith('MS-'))) {
      assert.ok(projectedQuests[mq.title]?.startsWith('COMPLETE — '), `Main quest ${mq.id} must be COMPLETE`);
    }
  }
});

test('full-scale 29-sector Director Cut stress compilation passes strict zero-tunneling, zero-relocation & architecture audit', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const { environmentArt } = loadPublicEnvironmentArt();

  // Build a complete synthetic Director's Cut v2 payload exercising ALL 64 scenes, 20 sidequests,
  // 14 optional battles, 10 bosses, non-combat puzzles, ambient records, and save points across all 29 areas.
  const allAreaIds = Object.keys(AREA_META);
  const allScenes = [];
  for (let i = 0; i <= 63; i++) {
    const sid = `SC-${String(i).padStart(3, '0')}`;
    allScenes.push({
      id: sid,
      trigger: sid === 'SC-000' ? 'NEW_GAME' : `TRIG_${sid.replace('-', '_')}`,
      title: i % 3 === 0 ? `Console ${sid}` : i % 3 === 1 ? `Switch ${sid}` : `Pod ${sid}`,
      dialogue: [],
      sets: `done_${sid.toLowerCase().replace('-', '_')}`
    });
  }
  const allQuests = [];
  for (let i = 1; i <= 20; i++) {
    const qid = `SQ-${String(i).padStart(2, '0')}`;
    allQuests.push({ id: qid, title: `Sidequest ${qid}`, completion_flags: `sq_${i}_done` });
  }
  const optionalBattleAreas = {
    'EN-001': 'A02', 'EN-004': 'A03', 'EN-008': 'A06', 'EN-009': 'A08',
    'EN-012': 'A10', 'EN-014': 'A10', 'EN-018': 'A12', 'EN-022': 'A15',
    'EN-023': 'A16', 'EN-027': 'A18', 'EN-029': 'A18', 'EN-034': 'A21',
    'EN-038': 'A24', 'EN-054': 'A26'
  };
  const allEncounters = [
    ...Object.entries(optionalBattleAreas).map(([id, area]) => ({
      id, kind: 'battle', area, units: `Squad ${id}`, set_flag: `${id.toLowerCase().replace('-', '_')}_done`
    })),
    { id: 'EN-005', kind: 'boss', area: 'A03', units: 'Boss', set_flag: 'boss_b01_defeated' },
    { id: 'EN-010', kind: 'boss', area: 'A08', units: 'Boss', set_flag: 'boss_b02_defeated' },
    { id: 'EN-015', kind: 'boss', area: 'A10', units: 'Boss', set_flag: 'boss_b03_defeated' },
    { id: 'EN-020', kind: 'boss', area: 'A13', units: 'Boss', set_flag: 'boss_b04_resolved' },
    { id: 'EN-025', kind: 'boss', area: 'A16', units: 'Boss', set_flag: 'boss_b05_resolved' },
    { id: 'EN-030', kind: 'boss', area: 'A18', units: 'Boss', set_flag: 'boss_b06_defeated' },
    { id: 'EN-037', kind: 'boss', area: 'A21', units: 'Boss', set_flag: 'boss_b07_defeated' },
    { id: 'EN-041', kind: 'boss', area: 'A25', units: 'Boss', set_flag: 'boss_b08_p1' },
    { id: 'EN-042', kind: 'boss', area: 'A25', units: 'Boss', set_flag: 'boss_b08_p2' },
    { id: 'EN-043', kind: 'boss', area: 'A25', units: 'Boss', set_flag: 'final_resolution_selected' },
    // Non-combat puzzles across all 29 sectors (2 per sector)
    ...allAreaIds.flatMap((area, idx) => [
      { id: `PZ-${String(idx * 2 + 1).padStart(2, '0')}`, kind: 'puzzle', area, set_flag: `pz_${area.toLowerCase()}_1` },
      { id: `PZ-${String(idx * 2 + 2).padStart(2, '0')}`, kind: 'hazard', area, set_flag: `pz_${area.toLowerCase()}_2` }
    ])
  ];

  const syntheticRaw = {
    schemaVersion: 1,
    revision: 2,
    flagSchema: { gameplay_flags: ['game_started'], exclusive_enums: {}, relationships: {} },
    areas: allAreaIds.map(id => ({
      id,
      name: `Synthetic Sector ${id}`,
      save_point: 'yes',
      story_purpose: 'Strict architectural verification'
    })),
    scenes: allScenes,
    dialogue: allAreaIds.map(id => ({ area: id, scene_id: 'ambient', speaker: 'SYSTEM', text: 'Ambient record.' })),
    choices: [],
    insertions: [],
    quests: allQuests,
    encounters: allEncounters
  };

  const { content, world } = compileFullCampaignBundle(syntheticRaw, manifest);
  assert.equal(world.maps.length, 29);
  assert.equal(world.combat.encounters.length, 24);
  assert.equal(world.mandatoryCombats.length, 10);
  assert.ok(content.flagSchema.gameplay_flags.includes('act2_complete'));

  // 1. Gameplay reachability & portal approach audit
  const reach = auditCampaignGameplayReachability(world);
  const portals = auditCampaignPortalApproaches(world);
  assert.equal(reach.blockedCount, 0, JSON.stringify(reach.blocked));
  assert.equal(portals.inaccessiblePortals, 0, JSON.stringify(portals.blockedPortals));

  // 2. Mission factory & environment art verification
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
    assert.ok(Array.isArray(mission.portalAssemblies) && mission.portalAssemblies.length >= 1, `Expected portalAssemblies on ${id}`);
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

  // 3. Benchmark substantial scale verification
  const mapById = new Map(world.maps.map(m => [m.id, m]));
  assert.ok(mapById.get('A00').width >= 40 && mapById.get('A00').height >= 22, 'A00 Stasis Hollow must be substantial multi-room scale');
  assert.ok(mapById.get('A02').width >= 42 && mapById.get('A02').height >= 24, 'A02 Rootway Ruins must be substantial outdoor scale');
  assert.ok(mapById.get('A15').width >= 44 && mapById.get('A15').height >= 26, 'A15 Survey Wetland must be substantial outdoor marsh scale');
  assert.ok(mapById.get('A24').width >= 42 && mapById.get('A24').height >= 28, 'A24 Control Cathedral must be monumental basilica scale');

  // 4. Deep Architectural Integrity Audit across ALL 29 sectors
  const oppDir = { right: 'left', left: 'right', up: 'down', down: 'up' };
  const wallMountedArt = new Set([
    'service', 'overgrown', 'elevator', 'archive_seal', 'cathedral_gate',
    'roof_hatch', 'water_lock', 'sluice_gate', 'quarantine_lock',
    'airlock_east', 'airlock_west', 'arch_east', 'arch_west', 'south_threshold'
  ]);
  const naturalOutdoorArt = new Set(['trail_passage', 'bridge_passage', 'rail_gantry', 'arch_east', 'arch_west', 'south_threshold']);
  const solidTerrainCodes = new Set([2, 4, 8, 9, 12, 13, 16, 17, 18, 19, 20]);
  const walkableTerrainCodes = new Set([1, 3, 5, 6, 7, 10, 11, 14, 15]);
  const layoutFingerprints = new Set();
  const seenStoryTriggers = new Set();

  for (const m of world.maps) {
    const col = m.layers.find(l => l.name === 'collision').data;
    const fp = `${m.width}x${m.height}:${col.join('')}:${m.terrainLayer.join(',')}`;
    layoutFingerprints.add(fp);

    // 4a. Zero disconnected walkable rooms/islands (re-validate strictly)
    validateAreaConnectivity(m.id, col, m.width, m.height, Math.floor(m.start.x / 32), Math.floor(m.start.y / 32));

    // 4b. Structural terrain codes MUST agree 100% with collision geometry
    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < m.width; x++) {
        const idx = y * m.width + x;
        const tc = m.terrainLayer[idx];
        const c = col[idx];
        if (solidTerrainCodes.has(tc)) {
          assert.equal(c, 1, `Collision mismatch in ${m.id} at (${x},${y}): solid structural terrain code ${tc} is walkable`);
        }
        if (walkableTerrainCodes.has(tc)) {
          assert.equal(c, 0, `Collision mismatch in ${m.id} at (${x},${y}): walkable terrain code ${tc} is blocked`);
        }
      }
    }

    // 4c. Zero duplicate story triggers or overlapping entity tiles
    const entityTiles = new Set([`${Math.floor(m.start.x / 32)},${Math.floor(m.start.y / 32)}`]);
    for (const e of m.entities || []) {
      const k = `${e.tx},${e.ty}`;
      assert.ok(!entityTiles.has(k), `Overlapping entity in ${m.id} at (${e.tx},${e.ty}): ${e.id}`);
      entityTiles.add(k);
      if (e.trigger && e.sceneId) {
        const tk = `${e.sceneId}:${e.trigger}`;
        assert.ok(!seenStoryTriggers.has(tk), `Duplicate critical story trigger ${tk} in ${m.id}`);
        seenStoryTriggers.add(tk);
      }
    }

    // 4d. Doorway architectural support, entrance assemblies, reciprocity & zero scenery concealment
    const portalsList = m.layers.find(l => l.name === 'portals').objects;
    for (const p of portalsList) {
      const props = p.properties;
      const tx = p.x / 32, ty = p.y / 32;
      assert.ok(props.portalLabel && props.portalLabel.length > 0, `Portal ${m.id}:${p.name} missing bespoke architectural label`);
      assert.ok(props.portalAssembly, `Portal ${m.id}:${p.name} missing portalAssembly descriptor`);

      if (wallMountedArt.has(props.portalArt)) {
        const dx = props.facing === 'right' ? 1 : props.facing === 'left' ? -1 : 0;
        const dy = props.facing === 'down' ? 1 : props.facing === 'up' ? -1 : 0;
        const wx = tx + dx, wy = ty + dy;
        assert.ok(
          wx >= 0 && wy >= 0 && wx < m.width && wy < m.height && col[wy * m.width + wx] === 1,
          `Floating door detected at ${m.id}:${p.name} (${tx},${ty}) facing ${props.facing} art=${props.portalArt}`
        );
      }

      // Check NO background or foreground scenery intersects the entrance clearance box
      for (const d of m.environmentDetails || []) {
        if (d.layer === 'ground') continue;
        const dw = d.sw / 32, dh = d.sh / 32;
        const overlapsPortalZone = d.tx < tx + 2 && d.tx + dw > tx - 1 && d.ty < ty + 2 && d.ty + dh > ty - 1;
        assert.ok(!overlapsPortalZone, `Scenery ${d.id} conceals entrance ${m.id}:${p.name} at (${tx},${ty})`);
      }

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

  assert.equal(layoutFingerprints.size, 29, `Expected 29 unique area floor plans, got ${layoutFingerprints.size}`);

  // 5. Verify natural outdoor landscape exits on exterior regions
  for (const extId of ['A02', 'A04', 'A12', 'A13', 'A15', 'A17', 'A27', 'A28']) {
    const m = mapById.get(extId);
    const portalsList = m.layers.find(l => l.name === 'portals').objects;
    for (const p of portalsList) {
      const art = p.properties.portalArt;
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

