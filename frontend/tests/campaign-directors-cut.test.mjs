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

const STORY_PATH = new URL('../public/assets/aeon/story/campaign.json', import.meta.url);
const WORLD_PATH = new URL('../public/assets/aeon/story/opening-world-review-candidate.json', import.meta.url);
const ENV_PATH = new URL('../public/assets/aeon/environment/environment-art.json', import.meta.url);
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
  for (const id of factory.graph.ids) {
    const mission = factory.missionForSync(id);
    assert.ok(mission, `Expected compiled mission for ${id}`);
    assert.ok(mission.environmentDetails, `Expected layered environmentDetails for ${id}`);
  }
});
