#!/usr/bin/env node
// Builds the complete Director's Cut v2 campaign.json and opening-world-review-candidate.json
// using the shared pure-JS compiler in frontend/public/js/engine/campaign-world-builder.js.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileFullCampaignBundle } from '../public/js/engine/campaign-world-builder.js';

const ROOT = process.cwd();
const OUT_DIR = resolve(ROOT, 'frontend/public/assets/aeon/story');
mkdirSync(OUT_DIR, { recursive: true });

const PRIMARY_CAMPAIGN = resolve(ROOT, 'public/assets/aistudio/Aeon_Circuit_Directors_Cut_v2_campaign_32d9d7d4.json');
const BACKUP_CAMPAIGN = resolve(ROOT, 'private-export/aistudio/Aeon_Circuit_Directors_Cut_v2_campaign_32d9d7d4.json');
const CLI_PATH = process.argv[2] ? resolve(ROOT, process.argv[2]) : null;
const SRC_PATH = CLI_PATH && existsSync(CLI_PATH)
  ? CLI_PATH
  : existsSync(PRIMARY_CAMPAIGN)
    ? PRIMARY_CAMPAIGN
    : BACKUP_CAMPAIGN;

if (!existsSync(SRC_PATH)) {
  throw new Error('Private campaign source not found at ' + PRIMARY_CAMPAIGN + ' or ' + BACKUP_CAMPAIGN);
}

const raw = JSON.parse(readFileSync(SRC_PATH, 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'frontend/public/assets/aeon/asset-manifest.json'), 'utf8'));
const { content, world } = compileFullCampaignBundle(raw, manifest);

writeFileSync(resolve(OUT_DIR, 'campaign.json'), JSON.stringify(content, null, 2) + '\n');
writeFileSync(resolve(OUT_DIR, 'opening-world-review-candidate.json'), JSON.stringify(world, null, 2) + '\n');

const stagedTriggers = new Set(['NEW_GAME']);
for (const m of world.maps) {
  if (m.entryTrigger) stagedTriggers.add(m.entryTrigger);
  for (const e of m.entities) if (e.trigger) stagedTriggers.add(e.trigger);
  for (const t of m.triggers) if (t.trigger) stagedTriggers.add(t.trigger);
}
console.log(JSON.stringify({
  ok: true,
  areas: world.maps.length,
  scenesStaged: content.scenes.filter(x => stagedTriggers.has(x.trigger)).length,
  combatEncounters: world.combat.encounters.length,
  mandatoryBattles: world.mandatoryCombats.length,
  flags: content.flagSchema.gameplay_flags.length
}, null, 2));
