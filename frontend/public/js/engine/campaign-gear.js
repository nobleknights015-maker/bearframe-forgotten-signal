// Curated Aeon Circuit equipment catalog, consumable definitions, and level progression math.
// Compatible with rpg-party.js equipItem/battleParty and combat lineages.

export const CAMPAIGN_GEAR = Object.freeze({
  // Sleeper chassis weapons
  'legacy-tool': Object.freeze({ slot: 'weapon', attack: 0, defense: 0, speed: 0, allowedLineages: ['sleeper'], label: 'Legacy Maintenance Tool' }),
  'calibrated-wrench': Object.freeze({ slot: 'weapon', attack: 3, defense: 1, speed: 0, allowedLineages: ['sleeper'], label: 'Calibrated Servo Wrench' }),
  'legacy-blade': Object.freeze({ slot: 'weapon', attack: 6, defense: 0, speed: 1, allowedLineages: ['sleeper'], label: 'Ancient Alloy Blade' }),
  'resonance-pike': Object.freeze({ slot: 'weapon', attack: 11, defense: 1, speed: 2, allowedLineages: ['sleeper'], label: 'Resonance Harmonic Edge' }),
  // Echo chassis weapons
  'echo-clamp': Object.freeze({ slot: 'weapon', attack: 2, defense: 1, speed: 0, allowedLineages: ['echo'], label: 'Rill Service Clamp' }),
  'echo-link': Object.freeze({ slot: 'weapon', attack: 4, defense: 1, speed: 2, allowedLineages: ['echo'], label: 'Synchronized Echo Link' }),
  'signal-conductor': Object.freeze({ slot: 'weapon', attack: 8, defense: 2, speed: 3, allowedLineages: ['echo'], label: 'Relay Harmonic Conductor' }),
  // Ghost-Grid / Utility / Bearframe weapons
  'foundry-module': Object.freeze({ slot: 'weapon', attack: 9, defense: 1, speed: 2, allowedLineages: ['ghost-grid', 'modern'], label: 'Bearframe Pulse Emitter' }),
  'survey-emitter': Object.freeze({ slot: 'weapon', attack: 13, defense: 2, speed: 3, allowedLineages: ['ghost-grid', 'modern'], label: 'Survey Edge Optic Array' }),
  // Armor (all allied lineages)
  'patched-plating': Object.freeze({ slot: 'armor', attack: 0, defense: 2, speed: 0, label: 'Patched Composite Plating' }),
  'insulation-weave': Object.freeze({ slot: 'armor', attack: 0, defense: 4, speed: 1, label: 'Insulated Conduit Jacket' }),
  'lantern-shroud': Object.freeze({ slot: 'armor', attack: 1, defense: 7, speed: 1, label: 'Lantern Shelf Reinforced Shell' }),
  'ward-carapace': Object.freeze({ slot: 'armor', attack: 1, defense: 10, speed: 2, label: 'Quiet Engine Shielding' }),
  // Accessories
  'scuffed-tag': Object.freeze({ slot: 'accessory', attack: 0, defense: 1, speed: 1, label: 'Sleeper Serial Tag' }),
  'noll-lantern-charm': Object.freeze({ slot: 'accessory', attack: 1, defense: 2, speed: 2, label: 'Noll Hand-Soldered Lantern Core' }),
  'unsent-seal': Object.freeze({ slot: 'accessory', attack: 2, defense: 2, speed: 3, label: 'Mail Vault Bronze Stamp' }),
  'sky-compass': Object.freeze({ slot: 'accessory', attack: 3, defense: 3, speed: 4, label: 'Sky Ledge Brass Sextant' })
});

export const CAMPAIGN_CONSUMABLES = Object.freeze({
  'repair-kit': Object.freeze({ label: 'Field Repair Kit', healHp: 28, healEp: 0, desc: 'Restores 28 HP to one allied frame.' }),
  'coolant-pack': Object.freeze({ label: 'Coolant Cell Pack', healHp: 12, healEp: 10, desc: 'Restores 12 HP and 10 EP.' }),
  'spare-cell': Object.freeze({ label: 'Stabilized Spare Cell', healHp: 45, healEp: 15, desc: 'Restores 45 HP and 15 EP.' })
});

export function levelForXp(xp = 0) {
  let lvl = 1;
  while (lvl < 30 && xp >= 20 * lvl * lvl) lvl++;
  return lvl;
}

export function nextLevelXp(level = 1) {
  return 20 * level * level;
}

/**
 * Apply level-up stat increases deterministically when party XP crosses thresholds.
 * Returns { world, leveledUp: [{ id, name, oldLevel, newLevel }] }.
 */
export function applyCampaignLevelProgression(world) {
  if (!world || !Array.isArray(world.party)) return { world, leveledUp: [] };
  const totalXp = world.progression?.xp || 0;
  const targetLevel = levelForXp(totalXp);
  const next = structuredClone(world);
  const leveledUp = [];
  for (const member of next.party) {
    const oldLevel = member.level || 1;
    member.xp = totalXp;
    if (targetLevel > oldLevel) {
      const gained = targetLevel - oldLevel;
      const isSleeper = member.lineage === 'sleeper';
      const isEcho = member.lineage === 'echo';
      member.level = targetLevel;
      member.maxHp += gained * (isSleeper ? 7 : isEcho ? 8 : 6);
      member.hp = Math.min(member.maxHp, member.hp + gained * 8);
      member.maxEp = (member.maxEp || 0) + gained * (isSleeper ? 3 : 4);
      member.ep = Math.min(member.maxEp, (member.ep || 0) + gained * 4);
      member.attack += gained * (isSleeper ? 3 : isEcho ? 2 : 3);
      member.defense += gained * (isEcho ? 2 : 1);
      member.speed += gained * (member.id === 'miya' ? 2 : 1);
      leveledUp.push({ id: member.id, name: member.name || member.id, oldLevel, newLevel: targetLevel });
    }
  }
  return { world: next, leveledUp };
}

export function effectiveUnitStats(unit, equipment = {}) {
  const gear = equipment?.[unit.id] || {};
  let attack = unit.attack || 1;
  let defense = unit.defense || 0;
  let speed = unit.speed || 1;
  for (const itemId of Object.values(gear)) {
    const def = CAMPAIGN_GEAR[itemId];
    if (!def) continue;
    if (def.allowedLineages && !def.allowedLineages.includes(unit.lineage)) continue;
    attack += def.attack || 0;
    defense += def.defense || 0;
    speed += def.speed || 0;
  }
  return { attack, defense, speed };
}
