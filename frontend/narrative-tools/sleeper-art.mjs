// Coherent, high-craft pixel-art generator for the four selectable Ancient Sleepers
// (sleeper_A Vanguard, sleeper_B Surveyist, sleeper_C Technician, sleeper_D Courier).
// Ensures a single unmistakable visual identity across:
//   - 128x128 bust portraits (character picker, dialogue, status/party menus, cutscenes)
//   - 32x56 overworld exploration sprites (naturally proportioned 34-38px JRPG height on 32px tiles)
//   - 64x64 side-view battle sprites (full heroic combat resolution, all 9 action rows)
import { shade } from '../public/studio/lib/sprite-rig.js';

export const SLEEPER_IDS = Object.freeze(['sleeper_A', 'sleeper_B', 'sleeper_C', 'sleeper_D']);

export const SLEEPER_PROFILES = Object.freeze({
  sleeper_A: {
    id: 'sleeper_A',
    role: 'VANGUARD',
    archetype: 'Bastion Frame',
    tagline: 'Crested heavy bastion · Ivory plating & copper mantle',
    // Natural JRPG overworld height inside 32x56 (anchored at y=55)
    worldHeight: 38,
    battleHeight: 52,
    colors: {
      armor: '#ddd5c2',
      armorHi: '#f4efe2',
      armorSh: '#a89f8b',
      armorDk: '#6c6558',
      trim: '#3c5a78',
      trimHi: '#5e84a8',
      trimDk: '#1f3145',
      under: '#141b24',
      glow: '#68ecff',
      glowHi: '#d8fbff',
      glowDk: '#1e7a96',
      cloth: '#b85c2a',
      clothHi: '#dc7c44',
      clothDk: '#7a3716',
      metal: '#c89b4b',
      metalHi: '#f0cc7a',
      bg1: '#0a1824',
      bg2: '#17344a',
      rim: '#68ecff'
    }
  },
  sleeper_B: {
    id: 'sleeper_B',
    role: 'SURVEYIST',
    archetype: 'Pathfinder Frame',
    tagline: 'Hooded ranger · Olive poncho & brass rangefinder',
    worldHeight: 37,
    battleHeight: 51,
    colors: {
      armor: '#586c76',
      armorHi: '#8098a3',
      armorSh: '#3a4a52',
      armorDk: '#212c32',
      trim: '#c49d46',
      trimHi: '#e6c572',
      trimDk: '#785d22',
      under: '#12191c',
      glow: '#52f5c0',
      glowHi: '#d4ffee',
      glowDk: '#1d8265',
      cloth: '#4b6b47',
      clothHi: '#6b9164',
      clothDk: '#2d442b',
      leather: '#6e4a2e',
      leatherDk: '#422a18',
      bg1: '#0b1916',
      bg2: '#1c3930',
      rim: '#52f5c0'
    }
  },
  sleeper_C: {
    id: 'sleeper_C',
    role: 'TECHNICIAN',
    archetype: 'Relay Frame',
    tagline: 'Copper-wire mane · Amber goggles & dynamo pack',
    worldHeight: 35,
    battleHeight: 49,
    colors: {
      armor: '#3f7360',
      armorHi: '#629c86',
      armorSh: '#294f42',
      armorDk: '#183028',
      trim: '#c97e38',
      trimHi: '#eca55c',
      trimDk: '#7c481c',
      under: '#141e1b',
      glow: '#ffbe3b',
      glowHi: '#fff0b0',
      glowDk: '#9e6612',
      hair: '#c66a30',
      hairHi: '#ec9252',
      hairDk: '#7a3a16',
      cloth: '#5e3c28',
      clothHi: '#84583c',
      clothDk: '#3a2215',
      bg1: '#151910',
      bg2: '#2d371e',
      rim: '#ffbe3b'
    }
  },
  sleeper_D: {
    id: 'sleeper_D',
    role: 'COURIER',
    archetype: 'Zephyr Frame',
    tagline: 'Winged aero-visor · Silver fringe & crimson scarf',
    worldHeight: 34,
    battleHeight: 48,
    colors: {
      armor: '#473c5c',
      armorHi: '#6e5e8a',
      armorSh: '#2f2640',
      armorDk: '#1b1526',
      trim: '#d8d2e2',
      trimHi: '#f4f0fa',
      trimDk: '#8a829c',
      under: '#130f1a',
      glow: '#ff6eb4',
      glowHi: '#ffd6eb',
      glowDk: '#9c2662',
      cloth: '#cf2d44',
      clothHi: '#f2586c',
      clothDk: '#821828',
      hair: '#dce2ec',
      hairHi: '#ffffff',
      hairDk: '#8e96a8',
      bg1: '#1a0e1b',
      bg2: '#381b35',
      rim: '#ff6eb4'
    }
  }
});

// ---- Minimal pixel drawing primitives on PixelCanvas / Canvas2D ----
function px(ctx, x, y, col, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  ctx.globalAlpha = 1;
}

function rect(ctx, x, y, w, h, col, a = 1) {
  if (w <= 0 || h <= 0) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
}

function disc(ctx, cx, cy, r, col, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
  const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.25) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function ellipse(ctx, cx, cy, rx, ry, col, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1.02) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function glowDisc(ctx, cx, cy, r, col, maxA = 0.45) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < r) {
        const a = maxA * (1 - d / r) ** 2;
        if (a > 0.02) px(ctx, x, y, col, a);
      }
    }
  }
}

function line(ctx, x0, y0, x1, y1, col, thickness = 1, a = 1) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    ctx.fillRect(x, y, thickness, thickness);
  }
  ctx.globalAlpha = 1;
}

function shadedBox(ctx, x, y, w, h, main, hi, sh, dk = null) {
  rect(ctx, x, y, w, h, main);
  if (w >= 2 && h >= 2) {
    rect(ctx, x, y, w, 1, hi);
    rect(ctx, x, y, 1, h - 1, hi);
    rect(ctx, x + w - 1, y + 1, 1, h - 1, sh);
    rect(ctx, x + 1, y + h - 1, w - 1, 1, dk || sh);
  }
}

function applyPixelOutline(ctx, w, h, col = '#0a0b10') {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 20 ? 1 : 0;
  const n = parseInt(col.slice(1), 16);
  const cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) ||
          (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        d[i * 4] = cr; d[i * 4 + 1] = cg; d[i * 4 + 2] = cb; d[i * 4 + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ============================================================================
// 1. HIGH-CRAFT 128x128 BUST PORTRAITS (4 Unmistakable Sleeper Identities)
// ============================================================================
export function renderSleeperPortrait(cv, id) {
  const prof = SLEEPER_PROFILES[id];
  if (!prof) return false;
  const ctx = cv.getContext('2d');
  const C = prof.colors;

  // Atmospheric gradient backdrop tailored to each Sleeper
  const parseHex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = parseHex(C.bg1), [r2, g2, b2] = parseHex(C.bg2);
  for (let y = 0; y < 128; y++) {
    const t = y / 127;
    rect(ctx, 0, y, 128, 1, `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`);
    if (y % 4 === 0) rect(ctx, 0, y, 128, 1, '#000000', 0.14);
  }
  glowDisc(ctx, 64, 54, 58, C.rim, 0.28);

  // Subtle unique background architectural motif per Sleeper
  if (id === 'sleeper_A') {
    // Vanguard: heavy diagonal chevron armor ribs in background
    for (let i = 0; i < 4; i++) {
      line(ctx, 8, 18 + i * 24, 34, 6 + i * 24, C.rim, 1, 0.16);
      line(ctx, 120, 18 + i * 24, 94, 6 + i * 24, C.rim, 1, 0.16);
    }
  } else if (id === 'sleeper_B') {
    // Surveyist: contour compass arcs & rangefinder ticks
    for (let a = 0; a < 360; a += 18) {
      const rad = a * Math.PI / 180;
      px(ctx, 64 + Math.cos(rad) * 48, 52 + Math.sin(rad) * 44, C.rim, 0.35);
    }
    line(ctx, 10, 52, 24, 52, C.trim, 1, 0.25);
    line(ctx, 104, 52, 118, 52, C.trim, 1, 0.25);
  } else if (id === 'sleeper_C') {
    // Technician: signal waveforms & relay nodes
    for (let x = 10; x < 118; x += 4) {
      const wy = Math.round(22 + Math.sin(x * 0.18) * 6);
      rect(ctx, x, wy, 2, 2, C.glow, 0.24);
    }
    for (let i = 0; i < 5; i++) rect(ctx, 14 + i * 24, 10, 2, 2, C.glowHi, 0.45);
  } else if (id === 'sleeper_D') {
    // Courier: diagonal speed-streaks across backdrop
    for (let i = 0; i < 6; i++) {
      line(ctx, 6 + i * 18, 28 + (i % 3) * 18, 40 + i * 18, 12 + (i % 3) * 18, C.clothHi, 1, 0.22);
    }
  }

  // Paint character bust onto a transparent layer so we get a crisp pixel outline!
  const bust = new cv.constructor(128, 128);
  const b = bust.getContext('2d');

  if (id === 'sleeper_A') {
    // === SLEEPER A: VANGUARD (Broad-shouldered Crested Bastion) ===
    // Wide armored back collar
    shadedBox(b, 26, 74, 76, 54, C.trim, C.trimHi, C.trimDk);
    // Broad sculpted ivory chestplate & layered shoulder pauldrons
    for (let y = 78; y < 128; y++) {
      const spread = Math.min(18, Math.floor((y - 78) * 0.4));
      rect(b, 22 - spread * 0.4, y, 84 + spread * 0.8, 1, C.armor);
    }
    // Massive beveled shoulder pauldrons (right = ivory plated, left = copper mantle draped over armor)
    shadedBox(b, 80, 76, 34, 46, C.armor, C.armorHi, C.armorSh, C.armorDk);
    rect(b, 84, 82, 26, 4, C.trim);
    rect(b, 86, 92, 22, 2, C.armorSh);
    rect(b, 104, 80, 4, 4, C.metal);

    // Armored gorget & chest V-plate
    shadedBox(b, 42, 82, 44, 46, C.trim, C.trimHi, C.trimDk);
    // Ivory breastplate chevron
    for (let row = 0; row < 20; row++) {
      const inset = Math.floor(row * 0.65);
      rect(b, 45 + inset, 86 + row, 38 - inset * 2, 1, row < 3 ? C.armorHi : C.armor);
    }
    // Glowing cyan chest slit (vertical-V bastion core, NOT a bear emblem)
    rect(b, 59, 94, 10, 14, C.under);
    rect(b, 62, 96, 4, 10, C.glow);
    rect(b, 63, 97, 2, 6, C.glowHi);

    // Asymmetric burnt-copper mantle draped across left shoulder + brass clasp
    for (let y = 76; y < 128; y++) {
      const w = 38 + Math.min(16, Math.floor((y - 76) * 0.35));
      rect(b, 12, y, w, 1, C.cloth);
      rect(b, 14, y, 6, 1, C.clothHi);
      rect(b, 26, y, 4, 1, C.clothDk);
      rect(b, 38, y, 3, 1, C.clothDk);
    }
    shadedBox(b, 40, 82, 11, 9, C.metal, C.metalHi, '#7a5820');
    rect(b, 44, 85, 3, 3, C.under);

    // Armored neck column
    rect(b, 52, 66, 24, 18, C.under);
    rect(b, 55, 68, 4, 14, C.trim);
    rect(b, 69, 68, 4, 14, C.trim);

    // Sculpted Angular Knight-Visor Helmet (wider brow, tapered jaw)
    for (let y = 20; y < 70; y++) {
      let halfW = 22;
      if (y < 28) halfW = 14 + (y - 20);
      else if (y > 54) halfW = 22 - Math.floor((y - 54) * 0.55);
      rect(b, 64 - halfW, y, halfW * 2, 1, C.armor);
      rect(b, 64 - halfW, y, 4, 1, C.armorHi);
      rect(b, 64 + halfW - 4, y, 4, 1, C.armorSh);
    }
    // Tall central bronze-edged dorsal crest fin!
    shadedBox(b, 59, 6, 10, 24, C.trim, C.trimHi, C.trimDk);
    rect(b, 62, 5, 4, 22, C.metal);
    rect(b, 63, 6, 2, 18, C.metalHi);
    // Cheek armor vents & brow ridge
    rect(b, 42, 34, 44, 4, C.armorHi);
    rect(b, 43, 38, 42, 18, C.under);
    // Center nose bridge splitting the twin angled chevron optics
    for (let y = 38; y < 60; y++) {
      rect(b, 61, y, 6, 1, y < 44 ? C.armorHi : C.armor);
    }
    // Sharp angled V-chevron ice-cyan eyes
    for (let i = 0; i < 12; i++) {
      const dy = Math.floor(i * 0.32);
      rect(b, 46 + i, 43 + dy, 2, 4, C.glow);
      rect(b, 47 + i, 44 + dy, 1, 2, C.glowHi);
      rect(b, 80 - i, 43 + dy, 2, 4, C.glow);
      rect(b, 80 - i, 44 + dy, 1, 2, C.glowHi);
    }
    // Chin guard & weathered battle scratch
    shadedBox(b, 51, 59, 26, 9, C.trim, C.trimHi, C.trimDk);
    rect(b, 56, 62, 16, 2, C.under);
    line(b, 74, 26, 80, 34, C.armorDk, 1);

  } else if (id === 'sleeper_B') {
    // === SLEEPER B: SURVEYIST (Hooded Pathfinder with Poncho & Brass Cyclops Lens) ===
    // Trailing rear fiber-optic braid / sensor ribbons peeking out from under hood
    for (let i = 0; i < 3; i++) {
      line(b, 32 + i * 4, 62, 16 + i * 5, 118, i === 1 ? C.trim : C.armorDk, 3);
      px(b, 18 + i * 5, 112, C.glow);
    }
    // Sweeping asymmetric olive travel poncho & draped cowl shoulders
    for (let y = 70; y < 128; y++) {
      const halfW = 34 + Math.min(24, Math.floor((y - 70) * 0.5));
      rect(b, 64 - halfW, y, halfW * 2, 1, C.cloth);
      rect(b, 64 - halfW + 2, y, 10, 1, C.clothHi);
      rect(b, 64 + halfW - 12, y, 10, 1, C.clothDk);
    }
    // Poncho vertical fold shadows & stitched hem trim
    for (let fx = 28; fx <= 96; fx += 14) {
      rect(b, fx, 78, 3, 50, C.clothDk, 0.75);
      rect(b, fx + 3, 80, 2, 46, C.clothHi, 0.45);
    }
    // Twin-canister survey pack tops peeking behind shoulders
    shadedBox(b, 20, 58, 14, 22, C.armor, C.armorHi, C.armorDk);
    rect(b, 23, 62, 8, 3, C.trim);
    shadedBox(b, 94, 58, 14, 22, C.armor, C.armorHi, C.armorDk);
    rect(b, 97, 62, 8, 3, C.trim);

    // Diagonal leather bandolier + brass compass drum across chest
    line(b, 36, 78, 92, 126, C.leather, 8);
    line(b, 36, 77, 92, 125, '#8c603d', 2);
    disc(b, 60, 102, 10, C.trimDk);
    disc(b, 60, 102, 8, C.trim);
    disc(b, 60, 102, 5, C.under);
    disc(b, 60, 102, 3, C.glow);
    px(b, 59, 101, C.glowHi);

    // Deep draped ranger hood silhouette (pointed cowl peak!)
    for (let y = 10; y < 80; y++) {
      let halfW;
      if (y < 24) halfW = 10 + Math.floor((y - 10) * 1.45);
      else if (y < 58) halfW = 30 + Math.floor((y - 24) * 0.12);
      else halfW = 34 + Math.floor((y - 58) * 0.25);
      rect(b, 64 - halfW, y, halfW * 2, 1, C.cloth);
      rect(b, 64 - halfW + 2, y, 6, 1, C.clothHi);
      rect(b, 64 + halfW - 7, y, 5, 1, C.clothDk);
    }
    // Dark recessed hood cavity around domed slate head
    ellipse(b, 64, 48, 22, 24, '#0c1213');
    // Elongated domed steel faceplate inside hood
    ellipse(b, 64, 49, 18, 20, C.armor);
    ellipse(b, 62, 46, 15, 16, C.armorHi, 0.35);
    // Dark recessed optic band
    rect(b, 48, 39, 32, 16, C.under);
    // Asymmetric brass-ringed cyclops rangefinder lens (offset right) + secondary dot left
    disc(b, 70, 47, 9, C.trimDk);
    disc(b, 70, 47, 7, C.trim);
    disc(b, 70, 47, 5, C.glow);
    disc(b, 68, 45, 2, C.glowHi);
    // Left micro-sensor lens & reticle bracket
    disc(b, 53, 47, 3, C.trim);
    disc(b, 53, 47, 2, C.glow);
    rect(b, 49, 46, 2, 2, C.trimHi);
    // Hood scarf wrap across lower chin/neck
    shadedBox(b, 38, 66, 52, 14, C.clothDk, C.cloth, '#1e2e1d');
    rect(b, 44, 70, 40, 3, C.clothHi);

  } else if (id === 'sleeper_C') {
    // === SLEEPER C: TECHNICIAN (Copper Wire-Hair Mane, Brass Ear Discs, Antenna & Amber Goggles) ===
    // Glowing dynamo coil pack peeking behind shoulders
    shadedBox(b, 20, 68, 88, 34, C.armorDk, C.armor, '#0f1c18');
    rect(b, 24, 72, 12, 18, C.trim);
    rect(b, 92, 72, 12, 18, C.trim);
    rect(b, 27, 75, 6, 12, C.glow);
    rect(b, 95, 75, 6, 12, C.glow);

    // Tall angled whip antenna on right temple with amber beacon tip!
    line(b, 88, 34, 102, 7, C.trim, 3);
    line(b, 89, 34, 103, 7, C.trimHi, 1);
    disc(b, 103, 7, 4, C.glow);
    disc(b, 102, 6, 2, C.glowHi);

    // Swept-back synthetic copper-wire "hair" locks (distinct organic-industrial silhouette!)
    const lockPaths = [
      [44, 24, 24, 48], [46, 20, 22, 64], [52, 16, 28, 76],
      [78, 18, 98, 54], [82, 24, 102, 68], [72, 15, 92, 38]
    ];
    for (const [x0, y0, x1, y1] of lockPaths) {
      line(b, x0, y0, x1, y1, C.hairDk, 7);
      line(b, x0 + 1, y0 - 1, x1 + 1, y1 - 1, C.hair, 4);
      line(b, x0 + 2, y0 - 1, x1 + 1, y1 - 2, C.hairHi, 1);
    }

    // Compact agile shoulders & leather utility apron/harness
    shadedBox(b, 26, 84, 76, 44, C.armor, C.armorHi, C.armorSh, C.armorDk);
    // Ribbed copper shoulder joints
    disc(b, 32, 92, 11, C.trimDk); disc(b, 32, 92, 8, C.trim);
    disc(b, 96, 92, 11, C.trimDk); disc(b, 96, 92, 8, C.trim);
    // Leather apron bib & tool straps
    shadedBox(b, 44, 86, 40, 42, C.cloth, C.clothHi, C.clothDk);
    rect(b, 46, 94, 36, 4, C.trim);
    rect(b, 54, 102, 20, 12, C.under);
    rect(b, 57, 105, 14, 6, C.glow);
    rect(b, 59, 106, 10, 2, C.glowHi);

    // Slender neck with exposed copper coils
    rect(b, 55, 68, 18, 18, C.under);
    for (let ny = 70; ny < 84; ny += 4) rect(b, 57, ny, 14, 2, C.trim);

    // Rounded expressive head with open brow crown + messy swept copper bangs
    ellipse(b, 64, 47, 21, 23, C.armor);
    ellipse(b, 61, 42, 16, 16, C.armorHi, 0.35);
    // Copper-wire hair crown & swept bangs across forehead
    ellipse(b, 64, 25, 22, 10, C.hair);
    for (let bx = 44; bx <= 80; bx += 6) {
      const len = 8 + ((bx * 3) % 7);
      rect(b, bx, 20, 5, len, C.hair);
      rect(b, bx + 1, 20, 2, len - 2, C.hairHi);
    }

    // Oversized round brass ear-receiver discs on both sides!
    disc(b, 40, 48, 9, C.trimDk); disc(b, 40, 48, 7, C.trim); disc(b, 40, 48, 3, C.glow);
    disc(b, 88, 48, 9, C.trimDk); disc(b, 88, 48, 7, C.trim); disc(b, 88, 48, 3, C.glow);

    // Flip-down brass binocular goggle array with glowing warm amber lenses!
    rect(b, 45, 39, 38, 16, C.under);
    rect(b, 44, 37, 40, 3, C.trimHi); // brow rail
    disc(b, 54, 47, 8, C.trimDk); disc(b, 54, 47, 6, C.trim); disc(b, 54, 47, 4, C.glow); px(b, 52, 45, C.glowHi);
    disc(b, 74, 47, 8, C.trimDk); disc(b, 74, 47, 6, C.trim); disc(b, 74, 47, 4, C.glow); px(b, 72, 45, C.glowHi);
    // Tiny center bridge telemetry dot
    rect(b, 63, 45, 2, 3, C.glowHi);
    // Cheek plating & small mouth grille
    rect(b, 56, 61, 16, 4, C.armorDk);
    for (let gx = 58; gx < 70; gx += 3) rect(b, gx, 62, 2, 2, C.armorHi);

  } else if (id === 'sleeper_D') {
    // === SLEEPER D: COURIER (Winged Aero-Visor, Silver Fringe & Billowing Crimson Scarf) ===
    // Dramatic billowing crimson wind-scarf tail sweeping right & left behind shoulders!
    for (let i = 0; i < 16; i++) {
      const y = 78 + i * 2;
      const sway = Math.round(Math.sin(i * 0.45) * 6);
      rect(b, 78 + sway, y, 42 - i, 4, i % 4 === 0 ? C.clothHi : C.cloth);
      rect(b, 82 + sway, y + 2, 36 - i, 2, C.clothDk);
    }
    // Sleek slender shoulders (obsidian-plum + crisp silver trim blades)
    for (let y = 84; y < 128; y++) {
      const halfW = 28 + Math.min(14, Math.floor((y - 84) * 0.35));
      rect(b, 64 - halfW, y, halfW * 2, 1, C.armor);
      rect(b, 64 - halfW + 2, y, 5, 1, C.trim);
      rect(b, 64 + halfW - 7, y, 5, 1, C.trim);
    }
    // Silver collarbone harness + slim rose-magenta chest core line
    shadedBox(b, 48, 92, 32, 36, C.armorDk, C.armor, C.under);
    rect(b, 52, 98, 24, 3, C.trim);
    rect(b, 62, 102, 4, 16, C.glow);
    rect(b, 63, 104, 2, 12, C.glowHi);

    // High-wrapped layered crimson wind-scarf collar covering lower chin/neck!
    for (let y = 66; y < 94; y++) {
      const halfW = 27 + Math.round(Math.sin((y - 66) * 0.2) * 3);
      rect(b, 64 - halfW, y, halfW * 2, 1, y < 71 ? C.clothHi : y % 5 === 0 ? C.clothDk : C.cloth);
    }
    line(b, 40, 74, 88, 82, C.clothDk, 2);
    line(b, 39, 72, 87, 80, C.clothHi, 1);

    // Twin swept aerodynamic silver ear-wings (swept diagonally UP & OUT — unmistakably NOT Bearframe boxes!)
    for (let i = 0; i < 22; i++) {
      const lx = 42 - i, ly = 42 - Math.floor(i * 1.05);
      const rx = 86 + i, ry = 42 - Math.floor(i * 1.05);
      rect(b, lx, ly, 4, 9 - Math.floor(i * 0.25), i < 14 ? C.trim : C.trimHi);
      rect(b, lx, ly + 4, 3, 2, C.glow);
      rect(b, rx - 3, ry, 4, 9 - Math.floor(i * 0.25), i < 14 ? C.trim : C.trimHi);
      rect(b, rx - 2, ry + 4, 3, 2, C.glow);
    }

    // Sleek sculpted aerodynamic helmet dome (slender oval with pointed jaw)
    for (let y = 18; y < 68; y++) {
      let halfW = 19;
      if (y < 30) halfW = 11 + Math.floor((y - 18) * 0.72);
      else if (y > 50) halfW = Math.max(10, 19 - Math.floor((y - 50) * 0.55));
      rect(b, 64 - halfW, y, halfW * 2, 1, C.armor);
      rect(b, 64 - halfW + 1, y, 3, 1, C.armorHi);
      rect(b, 64 + halfW - 4, y, 3, 1, C.armorDk);
    }
    // Crisp silver aero-stripe down crown
    rect(b, 61, 18, 6, 14, C.trim);
    rect(b, 63, 18, 2, 12, C.trimHi);

    // Cropped synthetic silver-white hair fringe peeking beneath brow!
    for (let i = 0; i < 7; i++) {
      const fx = 46 + i * 5;
      const flen = [10, 13, 9, 12, 8, 13, 10][i];
      rect(b, fx, 27, 4, flen, C.hair);
      rect(b, fx + 1, 27, 2, flen - 2, C.hairHi);
      rect(b, fx, 27 + flen - 2, 4, 2, C.hairDk);
    }

    // Curved smoked-glass half-visor & expressive tall glowing rose-magenta eyes!
    rect(b, 47, 39, 34, 18, C.under);
    // Expressive tall dual eyes with crisp white catchlights
    rect(b, 51, 42, 9, 10, C.glowDk);
    rect(b, 52, 43, 7, 8, C.glow);
    rect(b, 53, 44, 3, 3, C.glowHi);
    px(b, 57, 49, C.glowHi);

    rect(b, 68, 42, 9, 10, C.glowDk);
    rect(b, 69, 43, 7, 8, C.glow);
    rect(b, 70, 44, 3, 3, C.glowHi);
    px(b, 74, 49, C.glowHi);

    // Subtle smoked visor shine line
    line(b, 48, 41, 60, 40, '#ffffff', 1, 0.25);
    line(b, 68, 40, 80, 41, '#ffffff', 1, 0.25);
  }

  applyPixelOutline(b, 128, 128, '#08090f');
  ctx.drawImage(bust, 0, 0);

  // Subtle rim glow on face optics
  if (id === 'sleeper_A') glowDisc(ctx, 64, 46, 20, C.glow, 0.22);
  else if (id === 'sleeper_B') glowDisc(ctx, 70, 47, 16, C.glow, 0.3);
  else if (id === 'sleeper_C') { glowDisc(ctx, 54, 47, 13, C.glow, 0.26); glowDisc(ctx, 74, 47, 13, C.glow, 0.26); }
  else if (id === 'sleeper_D') glowDisc(ctx, 64, 47, 18, C.glow, 0.26);

  // Clean industrial corner frame trim
  rect(ctx, 0, 0, 128, 2, C.trim);
  rect(ctx, 0, 126, 128, 2, C.trim);
  rect(ctx, 0, 0, 2, 128, C.trim);
  rect(ctx, 126, 0, 2, 128, C.trim);
  rect(ctx, 2, 2, 6, 2, C.glow); rect(ctx, 2, 2, 2, 6, C.glow);
  rect(ctx, 120, 2, 6, 2, C.glow); rect(ctx, 124, 2, 2, 6, C.glow);
  rect(ctx, 2, 124, 6, 2, C.glow); rect(ctx, 2, 120, 2, 6, C.glow);
  rect(ctx, 120, 124, 6, 2, C.glow); rect(ctx, 124, 120, 2, 6, C.glow);
  return true;
}

// ============================================================================
// 2. NATURALLY PROPORTIONED JRPG OVERWORLD SPRITES (32x56 frames, 34-38px tall)
//    Feet anchored solidly at y=54..55 (anchor [16, 56]), crisp 1:1 native pixels!
// ============================================================================
const WALK_CYCLE = [
  { bob: 0, lY: 0, rY: 0, stride: 0, arm: 0, sway: 0 },
  { bob: 1, lY: 2, rY: 0, stride: 2, arm: -2, sway: 1 },
  { bob: 0, lY: 3, rY: 0, stride: 3, arm: -2, sway: 2 },
  { bob: 0, lY: 1, rY: 0, stride: 1, arm: -1, sway: 1 },
  { bob: 0, lY: 0, rY: 0, stride: 0, arm: 0, sway: 0 },
  { bob: 1, lY: 0, rY: 2, stride: -2, arm: 2, sway: -1 },
  { bob: 0, lY: 0, rY: 3, stride: -3, arm: 2, sway: -2 },
  { bob: 0, lY: 0, rY: 1, stride: -1, arm: 1, sway: -1 }
];

export function renderSleeperWorldFrame(cv, id, dir, col) {
  const prof = SLEEPER_PROFILES[id];
  if (!prof) return false;
  const C = prof.colors;
  const w = cv.width, h = cv.height; // 32 x 56
  const tmp = new cv.constructor(w, h);
  const c = tmp.getContext('2d');

  const isIdle = col === 0;
  const wp = isIdle ? { bob: 0, lY: 0, rY: 0, stride: 0, arm: 0, sway: 0 } : WALK_CYCLE[(col - 1) % 8];
  const bob = wp.bob;
  const footY = 55; // exact bottom anchor matching fieldSpriteAnchorY=56 (1px outline hits y=55)

  // Per-Sleeper proportion metrics (all naturally sized 34-38px tall on 32px tiles!)
  const M = {
    sleeper_A: { legH: 11, torsoH: 11, torsoW: 12, headW: 10, headH: 10, legW: 4, shoulderW: 4 },
    sleeper_B: { legH: 11, torsoH: 11, torsoW: 10, headW: 11, headH: 11, legW: 3, shoulderW: 3 },
    sleeper_C: { legH: 10, torsoH: 10, torsoW: 9,  headW: 10, headH: 10, legW: 3, shoulderW: 3 },
    sleeper_D: { legH: 10, torsoH: 9,  torsoW: 8,  headW: 9,  headH: 9,  legW: 3, shoulderW: 2 }
  }[id];

  const hipY = footY - M.legH;
  const torsoY = hipY - M.torsoH + bob;
  const headY = torsoY - M.headH + 1;
  const cx = 16;

  // Render 'right' for both 'right' and 'left' (then mirror cleanly for 'left')
  const drawDir = dir === 'left' ? 'right' : dir;

  if (drawDir === 'down' || drawDir === 'up') {
    const front = drawDir === 'down';
    const lx = cx - M.legW - 1, rx = cx + 1;

    // Back capes / scarves / ribbons behind body when facing down
    if (front) {
      if (id === 'sleeper_A') {
        // Asymmetric left-shoulder copper mantle peeking behind torso
        rect(c, cx - 9, torsoY + 1, 5, 14, C.clothDk);
        rect(c, cx - 8, torsoY + 2, 3, 12, C.cloth);
      } else if (id === 'sleeper_B') {
        // Sweeping olive poncho hem behind legs
        rect(c, cx - 9, torsoY + 2, 18, 14, C.clothDk);
        rect(c, cx - 8 + (wp.sway > 0 ? 1 : 0), torsoY + 3, 16, 12, C.cloth);
      } else if (id === 'sleeper_D') {
        // Flowing crimson scarf tail visible to the side
        rect(c, cx + 4, torsoY + 1, 4, 10 + (wp.sway > 0 ? 1 : 0), C.clothDk);
        rect(c, cx + 5 + (wp.sway > 0 ? 1 : 0), torsoY + 2, 3, 9, C.cloth);
      }
    }

    // Legs & boots
    const drawLeg = (x, lift, dark) => {
      const colMain = dark ? C.armorSh : C.armor;
      const colTrim = dark ? C.trimDk : C.trim;
      rect(c, x, hipY, M.legW, M.legH - 3 - lift, colMain);
      rect(c, x, hipY + Math.max(2, M.legH - 6 - lift), M.legW, 1, C.under); // knee seam
      rect(c, x, footY - 3 - lift, M.legW, 3, colTrim); // boot
      rect(c, x, footY - 1 - lift, M.legW, 1, C.under); // sole
    };
    drawLeg(lx, wp.lY, false);
    drawLeg(rx, wp.rY, false);

    // Arms
    const armX1 = cx - Math.floor(M.torsoW / 2) - 3;
    const armX2 = cx + Math.floor(M.torsoW / 2) + 1;
    rect(c, armX1, torsoY + 2 + wp.arm, 3, 8, C.armorSh);
    rect(c, armX1, torsoY + 8 + wp.arm, 3, 2, C.under);
    rect(c, armX2, torsoY + 2 - wp.arm, 3, 8, C.armor);
    rect(c, armX2, torsoY + 8 - wp.arm, 3, 2, C.under);

    // Torso
    const tx = cx - Math.floor(M.torsoW / 2);
    shadedBox(c, tx, torsoY, M.torsoW, M.torsoH, C.armor, C.armorHi, C.armorSh);
    rect(c, tx, torsoY + M.torsoH - 2, M.torsoW, 2, C.trimDk); // waist belt

    if (id === 'sleeper_A') {
      // Heavy pauldrons + chest chevron + copper mantle draped over left shoulder
      shadedBox(c, tx - 3, torsoY, 4, 5, C.armor, C.armorHi, C.armorSh);
      shadedBox(c, tx + M.torsoW - 1, torsoY, 4, 5, C.armor, C.armorHi, C.armorSh);
      if (front) {
        rect(c, tx + 2, torsoY + 1, M.torsoW - 4, 6, C.trim);
        rect(c, cx - 1, torsoY + 2, 2, 4, C.glow);
        // Copper mantle front flap on left shoulder + brass buckle
        rect(c, tx - 3, torsoY, 6, 8, C.cloth);
        rect(c, tx - 2, torsoY + 1, 2, 6, C.clothHi);
        px(c, tx + 2, torsoY + 2, C.metalHi);
      } else {
        // Back copper half-cape
        rect(c, tx - 3, torsoY + 1, 9, 13, C.cloth);
        rect(c, tx - 2, torsoY + 2, 3, 11, C.clothHi);
        rect(c, tx + 4, torsoY + 3, 4, 6, C.trim);
      }
    } else if (id === 'sleeper_B') {
      // Draped olive poncho over torso + bandolier + rear twin survey pack
      if (front) {
        rect(c, tx - 3, torsoY, M.torsoW + 6, 9, C.cloth);
        rect(c, tx - 2, torsoY + 1, 3, 7, C.clothHi);
        rect(c, tx + M.torsoW, torsoY + 1, 2, 7, C.clothDk);
        line(c, tx - 1, torsoY + 1, tx + M.torsoW, torsoY + 9, C.leather, 1);
        rect(c, cx - 1, torsoY + 4, 2, 2, C.trimHi); // brass compass
      } else {
        rect(c, tx - 3, torsoY, M.torsoW + 6, 12, C.cloth);
        // Twin survey canisters on back
        shadedBox(c, cx - 5, torsoY + 1, 4, 8, C.armor, C.armorHi, C.armorDk);
        shadedBox(c, cx + 1, torsoY + 1, 4, 8, C.armor, C.armorHi, C.armorDk);
        rect(c, cx - 4, torsoY + 3, 2, 1, C.trimHi);
        rect(c, cx + 2, torsoY + 3, 2, 1, C.trimHi);
      }
    } else if (id === 'sleeper_C') {
      // Verdigris utility vest + copper shoulder joints + glowing amber dynamo pack on back
      rect(c, tx - 2, torsoY, 3, 4, C.trim);
      rect(c, tx + M.torsoW - 1, torsoY, 3, 4, C.trim);
      if (front) {
        rect(c, tx + 1, torsoY + 1, M.torsoW - 2, 7, C.cloth);
        rect(c, cx - 1, torsoY + 3, 3, 2, C.glow);
      } else {
        shadedBox(c, cx - 4, torsoY + 1, 8, 8, C.armorDk, C.trim, C.under);
        rect(c, cx - 2, torsoY + 3, 4, 4, C.glow);
        rect(c, cx - 1, torsoY + 4, 2, 2, C.glowHi);
      }
    } else if (id === 'sleeper_D') {
      // Sleek plum/silver vest + high crimson wind-scarf collar + trailing scarf tail
      rect(c, tx - 1, torsoY, 2, 3, C.trim);
      rect(c, tx + M.torsoW - 1, torsoY, 2, 3, C.trim);
      if (front) {
        rect(c, cx - 1, torsoY + 3, 2, 4, C.glow);
        // High wrapped crimson scarf around neck
        rect(c, tx - 2, torsoY - 1, M.torsoW + 4, 4, C.cloth);
        rect(c, tx - 1, torsoY - 1, M.torsoW + 2, 1, C.clothHi);
      } else {
        // Billowing crimson scarf streaming down back
        rect(c, tx - 2, torsoY - 1, M.torsoW + 4, 4, C.cloth);
        rect(c, cx - 3 + wp.sway, torsoY + 2, 6, 11, C.cloth);
        rect(c, cx - 2 + wp.sway, torsoY + 3, 2, 9, C.clothHi);
      }
    }

    // Head (with unmistakable silhouette per Sleeper!)
    const hx = cx - Math.floor(M.headW / 2);
    if (id === 'sleeper_A') {
      // Crested angular ivory helm
      shadedBox(c, hx, headY, M.headW, M.headH, C.armor, C.armorHi, C.armorSh);
      // Tall dorsal crest fin
      rect(c, cx - 1, headY - 4, 2, 6, C.metal);
      px(c, cx - 1, headY - 4, C.metalHi);
      if (front) {
        rect(c, hx + 1, headY + 4, M.headW - 2, 4, C.under);
        rect(c, cx - 1, headY + 4, 2, 5, C.armor);
        rect(c, hx + 1, headY + 5, 3, 2, C.glow);
        rect(c, hx + M.headW - 4, headY + 5, 3, 2, C.glow);
      } else {
        rect(c, cx - 1, headY + 1, 2, 7, C.trim);
      }
    } else if (id === 'sleeper_B') {
      // Pointed draped olive hood!
      rect(c, hx - 1, headY + 1, M.headW + 2, M.headH, C.cloth);
      rect(c, hx + 1, headY - 1, M.headW - 2, 3, C.clothHi);
      rect(c, cx - 2, headY - 2, 4, 2, C.cloth);
      if (front) {
        rect(c, hx + 1, headY + 3, M.headW - 2, 6, C.under);
        // Brass cyclops lens offset right + micro dot left
        rect(c, cx, headY + 4, 4, 4, C.trim);
        rect(c, cx + 1, headY + 5, 2, 2, C.glow);
        px(c, cx + 1, headY + 5, C.glowHi);
        px(c, hx + 2, headY + 6, C.glow);
      } else {
        // Rear fiber-optic braid trailing down hood back
        rect(c, cx - 2, headY + 6, 4, 6, C.clothDk);
        rect(c, cx - 1 + (wp.sway > 0 ? 1 : 0), headY + 9, 2, 5, C.trim);
        px(c, cx - 1 + (wp.sway > 0 ? 1 : 0), headY + 13, C.glow);
      }
    } else if (id === 'sleeper_C') {
      // Copper wire-hair crown + brass round ear-discs + tall right whip antenna + amber goggles!
      shadedBox(c, hx, headY + 1, M.headW, M.headH - 1, C.armor, C.armorHi, C.armorSh);
      // Messy swept copper wire-hair top & side locks
      rect(c, hx - 1, headY - 1, M.headW + 2, 4, C.hair);
      rect(c, hx, headY - 1, M.headW - 2, 2, C.hairHi);
      rect(c, hx - 2, headY + 2, 2, 5, C.hairDk);
      rect(c, hx + M.headW, headY + 2, 2, 5, C.hairDk);
      // Brass ear-receiver discs
      rect(c, hx - 2, headY + 4, 2, 3, C.trimHi);
      rect(c, hx + M.headW, headY + 4, 2, 3, C.trimHi);
      // Tall angled whip antenna on right!
      rect(c, hx + M.headW, headY - 4, 1, 6, C.trim);
      rect(c, hx + M.headW + 1, headY - 6, 1, 3, C.trimHi);
      px(c, hx + M.headW + 1, headY - 6, C.glowHi);
      if (front) {
        rect(c, hx + 1, headY + 4, M.headW - 2, 4, C.under);
        rect(c, hx + 1, headY + 5, 3, 2, C.glow);
        rect(c, hx + M.headW - 4, headY + 5, 3, 2, C.glow);
        px(c, hx + 2, headY + 5, C.glowHi);
        px(c, hx + M.headW - 3, headY + 5, C.glowHi);
      } else {
        // Flowing copper cable-hair down back of head
        rect(c, hx, headY + 2, M.headW, 7, C.hair);
        rect(c, hx + 2, headY + 3, 2, 6, C.hairHi);
        rect(c, hx + 6, headY + 4, 2, 5, C.hairDk);
      }
    } else if (id === 'sleeper_D') {
      // Sleek plum aero-helmet + twin swept silver ear-wings + silver bangs + rose eyes!
      shadedBox(c, hx, headY + 1, M.headW, M.headH - 1, C.armor, C.armorHi, C.armorDk);
      // Swept silver ear-wings flaring up & out!
      rect(c, hx - 2, headY + 2, 2, 3, C.trim);
      rect(c, hx - 3, headY, 2, 3, C.trimHi);
      rect(c, hx + M.headW, headY + 2, 2, 3, C.trim);
      rect(c, hx + M.headW + 1, headY, 2, 3, C.trimHi);
      rect(c, cx - 1, headY + 1, 2, 3, C.trimHi);
      if (front) {
        // Silver hair fringe peeking under brow
        rect(c, hx + 1, headY + 2, M.headW - 2, 2, C.hairHi);
        rect(c, hx + 1, headY + 4, M.headW - 2, 4, C.under);
        // Tall glowing rose-magenta eyes
        rect(c, hx + 1, headY + 4, 3, 3, C.glow);
        px(c, hx + 2, headY + 4, C.glowHi);
        rect(c, hx + M.headW - 4, headY + 4, 3, 3, C.glow);
        px(c, hx + M.headW - 3, headY + 4, C.glowHi);
      } else {
        rect(c, hx + 1, headY + 3, M.headW - 2, 5, C.armorDk);
        rect(c, cx - 1, headY + 2, 2, 6, C.trim);
      }
    }
  } else {
    // === SIDE PROFILE (facing right; 'left' mirrors cleanly afterwards) ===
    const stride = wp.stride;

    // Back cape / scarf / pack behind side profile
    if (id === 'sleeper_A') {
      // Copper half-cape flowing slightly behind back
      rect(c, cx - 9, torsoY + 1, 5, 13, C.clothDk);
      rect(c, cx - 8, torsoY + 2, 4, 11, C.cloth);
    } else if (id === 'sleeper_B') {
      // Twin survey pack + sweeping olive poncho back
      shadedBox(c, cx - 9, torsoY + 1, 4, 8, C.armor, C.armorHi, C.armorDk);
      rect(c, cx - 10, torsoY + 3, 6, 12, C.clothDk);
      rect(c, cx - 8, torsoY + 2, 6, 12, C.cloth);
    } else if (id === 'sleeper_C') {
      // Glowing amber dynamo backpack!
      shadedBox(c, cx - 9, torsoY + 1, 5, 8, C.armorDk, C.trim, C.under);
      rect(c, cx - 8, torsoY + 3, 3, 4, C.glow);
      px(c, cx - 7, torsoY + 4, C.glowHi);
    } else if (id === 'sleeper_D') {
      // Billowing crimson wind-scarf streaming dramatically behind runner!
      const sw = wp.sway;
      rect(c, cx - 12, torsoY + 1 + Math.max(0, sw), 9, 4, C.cloth);
      rect(c, cx - 11, torsoY + 1 + Math.max(0, sw), 7, 1, C.clothHi);
      rect(c, cx - 14, torsoY + 4 + (sw > 0 ? 1 : 0), 7, 3, C.clothDk);
    }

    // Back leg + front leg with clear walking stride
    const drawSideLeg = (dx, lift, dark) => {
      const colMain = dark ? C.armorSh : C.armor;
      const colBoot = dark ? C.trimDk : C.trim;
      rect(c, cx - 2 + dx, hipY, M.legW, M.legH - 3 - lift, colMain);
      rect(c, cx - 2 + dx, footY - 3 - lift, M.legW + 2, 3, colBoot);
      rect(c, cx - 2 + dx, footY - 1 - lift, M.legW + 2, 1, C.under);
    };
    drawSideLeg(-stride, stride > 0 ? 1 : 0, true);
    drawSideLeg(stride, stride < 0 ? 1 : 0, false);

    // Side Torso
    const tw = Math.max(6, M.torsoW - 2);
    shadedBox(c, cx - Math.floor(tw / 2), torsoY, tw, M.torsoH, C.armor, C.armorHi, C.armorSh);
    rect(c, cx - Math.floor(tw / 2), torsoY + M.torsoH - 2, tw, 2, C.trimDk);

    if (id === 'sleeper_A') {
      rect(c, cx - 4, torsoY + 1, 8, 5, C.cloth);
      rect(c, cx + 1, torsoY + 2, 3, 4, C.trim);
      px(c, cx + 3, torsoY + 3, C.glow);
    } else if (id === 'sleeper_B') {
      rect(c, cx - 5, torsoY, 10, 9, C.cloth);
      rect(c, cx - 4, torsoY + 1, 3, 7, C.clothHi);
      line(c, cx - 2, torsoY + 1, cx + 3, torsoY + 8, C.leather, 1);
    } else if (id === 'sleeper_C') {
      rect(c, cx - 3, torsoY + 1, 6, 7, C.cloth);
      rect(c, cx - 1, torsoY + 1, 3, 3, C.trim);
    } else if (id === 'sleeper_D') {
      rect(c, cx - 5, torsoY - 1, 10, 4, C.cloth);
      rect(c, cx - 4, torsoY - 1, 8, 1, C.clothHi);
      px(c, cx + 2, torsoY + 4, C.glow);
    }

    // Swinging near arm
    rect(c, cx - 1 + wp.arm, torsoY + 2, 3, 7, C.armor);
    rect(c, cx - 1 + wp.arm, torsoY + 8, 3, 2, C.under);

    // Side Head
    const hx = cx - Math.floor(M.headW / 2);
    if (id === 'sleeper_A') {
      shadedBox(c, hx, headY, M.headW, M.headH, C.armor, C.armorHi, C.armorSh);
      // Tall swept crest fin along top of helm!
      rect(c, hx + 1, headY - 4, 7, 4, C.trim);
      rect(c, hx + 2, headY - 4, 5, 2, C.metalHi);
      // Side cyan chevron visor
      rect(c, hx + M.headW - 4, headY + 4, 4, 3, C.under);
      rect(c, hx + M.headW - 3, headY + 5, 3, 2, C.glow);
    } else if (id === 'sleeper_B') {
      // Draped hood + trailing rear ribbon + projecting brass lens!
      rect(c, hx - 2, headY, M.headW + 2, M.headH, C.cloth);
      rect(c, hx - 1, headY - 1, M.headW - 1, 2, C.clothHi);
      rect(c, hx - 4, headY + 5, 3, 6, C.trim); // sensor ribbon
      rect(c, hx + M.headW - 4, headY + 3, 4, 6, C.under);
      rect(c, hx + M.headW - 2, headY + 4, 3, 4, C.trim);
      rect(c, hx + M.headW - 1, headY + 5, 2, 2, C.glow);
    } else if (id === 'sleeper_C') {
      // Swept copper wire-hair mane + round brass ear-disc + tall rear whip antenna + amber goggle!
      shadedBox(c, hx, headY + 1, M.headW, M.headH - 1, C.armor, C.armorHi, C.armorSh);
      rect(c, hx - 3, headY, 7, 7, C.hair);
      rect(c, hx - 2, headY - 1, 7, 3, C.hairHi);
      rect(c, hx - 1, headY + 4, 3, 3, C.trimHi); // brass ear disc
      // Whip antenna rising behind ear
      rect(c, hx - 1, headY - 5, 1, 6, C.trim);
      px(c, hx - 2, headY - 6, C.glowHi);
      // Projecting amber goggle lens
      rect(c, hx + M.headW - 4, headY + 4, 5, 4, C.trim);
      rect(c, hx + M.headW - 2, headY + 5, 3, 2, C.glow);
      px(c, hx + M.headW - 1, headY + 5, C.glowHi);
    } else if (id === 'sleeper_D') {
      // Aerodynamic plum/silver helm + swept back silver wing + silver fringe + rose eye!
      shadedBox(c, hx, headY + 1, M.headW, M.headH - 1, C.armor, C.armorHi, C.armorDk);
      // Swept-back silver aero wing!
      rect(c, hx - 4, headY - 1, 5, 3, C.trimHi);
      rect(c, hx - 2, headY + 1, 4, 3, C.trim);
      px(c, hx - 3, headY, C.glow);
      // Silver hair fringe + expressive rose eye
      rect(c, hx + M.headW - 4, headY + 2, 4, 2, C.hairHi);
      rect(c, hx + M.headW - 4, headY + 4, 4, 4, C.under);
      rect(c, hx + M.headW - 3, headY + 4, 3, 3, C.glow);
      px(c, hx + M.headW - 2, headY + 4, C.glowHi);
    }
  }

  applyPixelOutline(c, w, h, '#08090e');
  const out = cv.getContext('2d');
  out.save();
  if (dir === 'left') {
    out.translate(w, 0);
    out.scale(-1, 1);
  }
  out.drawImage(tmp, 0, 0);
  out.restore();
  return true;
}

// ============================================================================
// 3. HEROIC 64x64 SIDE-VIEW BATTLE SPRITES (All 9 Action Rows, Matching Identity)
// ============================================================================
export function renderSleeperBattleFrame(cv, id, actionName, col, totalFrames) {
  const prof = SLEEPER_PROFILES[id];
  if (!prof) return false;
  const C = prof.colors;
  const S = cv.width; // 64
  const tmp = new cv.constructor(S, S);
  const c = tmp.getContext('2d');

  const t = totalFrames > 1 ? col / (totalFrames - 1) : 0;
  let lean = 0, bob = 0, lunge = 0, armRaise = 0, flare = false, isDown = false, isGuard = false, isVictory = false;

  if (actionName === 'idle') {
    bob = (col % 2 === 1) ? 1 : 0;
  } else if (actionName === 'attack') {
    const k = Math.sin(t * Math.PI);
    lunge = Math.round(k * 7);
    lean = Math.round(k * 3);
    armRaise = Math.round(k * 6);
    flare = col === 1 || col === 2;
  } else if (actionName === 'ranged' || actionName === 'cast') {
    const k = Math.sin(t * Math.PI);
    lunge = Math.round(k * 3);
    armRaise = Math.round(k * 5);
    flare = col >= 1 && col <= 2;
  } else if (actionName === 'charge') {
    bob = 2 + (col % 2);
    flare = true;
  } else if (actionName === 'guard') {
    bob = 3; lean = -2; isGuard = true;
  } else if (actionName === 'hit') {
    lean = col % 2 === 0 ? -4 : -2; bob = 1;
  } else if (actionName === 'down') {
    bob = Math.round(t * 9); lean = -Math.round(t * 4); isDown = col === totalFrames - 1;
  } else if (actionName === 'victory') {
    bob = col === 1 ? -3 : 0;
    armRaise = col >= 1 ? 7 : 2;
    isVictory = true;
    flare = col >= 2;
  }

  const footY = 61;
  const cx = 28 + lunge + lean;

  const M = {
    sleeper_A: { legH: 16, torsoH: 15, torsoW: 13, headW: 13, headH: 13, legW: 5 },
    sleeper_B: { legH: 16, torsoH: 15, torsoW: 11, headW: 14, headH: 14, legW: 4 },
    sleeper_C: { legH: 15, torsoH: 13, torsoW: 11, headW: 13, headH: 13, legW: 4 },
    sleeper_D: { legH: 15, torsoH: 12, torsoW: 10, headW: 12, headH: 12, legW: 4 }
  }[id];

  const effLegH = Math.max(6, M.legH - (actionName === 'down' ? bob : 0));
  const hipY = footY - effLegH;
  const torsoY = hipY - M.torsoH + (actionName === 'down' ? 1 : Math.min(3, bob));
  const headY = torsoY - M.headH + 1;

  // 1. Back cape / poncho / dynamo pack / billowing crimson scarf
  if (id === 'sleeper_A') {
    const capeH = Math.min(21, footY - torsoY - 1);
    rect(c, cx - 15 - (lunge > 2 ? 2 : 0), torsoY + 1, 10, capeH, C.clothDk);
    rect(c, cx - 14 - (lunge > 2 ? 2 : 0), torsoY + 2, 7, Math.max(8, capeH - 2), C.cloth);
    rect(c, cx - 13 - (lunge > 2 ? 2 : 0), torsoY + 3, 3, Math.max(6, capeH - 5), C.clothHi);
  } else if (id === 'sleeper_B') {
    // Twin survey pack & flowing olive poncho back
    const ponchoH = Math.min(18, footY - torsoY - 3);
    shadedBox(c, cx - 14, torsoY, 7, 13, C.armor, C.armorHi, C.armorDk);
    rect(c, cx - 13, torsoY + 3, 5, 2, C.trimHi);
    rect(c, cx - 16 - (lunge > 1 ? 2 : 0), torsoY + 4, 12, ponchoH, C.clothDk);
    rect(c, cx - 14 - (lunge > 1 ? 2 : 0), torsoY + 3, 10, Math.max(8, ponchoH - 1), C.cloth);
  } else if (id === 'sleeper_C') {
    // Glowing amber dynamo pack + cable coils!
    shadedBox(c, cx - 15, torsoY, 8, 13, C.armorDk, C.trim, C.under);
    rect(c, cx - 13, torsoY + 3, 4, 7, flare ? C.glowHi : C.glow);
    if (flare) glowDisc(c, cx - 11, torsoY + 6, 7, C.glow, 0.5);
  } else if (id === 'sleeper_D') {
    // Dramatic billowing crimson wind-scarf trailing behind!
    const whip = lunge > 2 ? 4 : (col % 2 ? 1 : -1);
    line(c, cx - 4, torsoY + 1, cx - 22 - whip, torsoY + 5, C.cloth, 5);
    line(c, cx - 4, torsoY, cx - 20 - whip, torsoY + 4, C.clothHi, 2);
    line(c, cx - 6, torsoY + 4, cx - 24 - whip, torsoY + 11, C.clothDk, 3);
  }

  // 2. Heroic side-stance legs
  const legSpread = isDown ? 5 : (lunge > 2 ? 6 : 3);
  const drawBattleLeg = (dx, dark) => {
    const colA = dark ? C.armorSh : C.armor;
    const colB = dark ? C.trimDk : C.trim;
    const thighH = Math.max(3, effLegH - 5);
    shadedBox(c, cx - 2 + dx, hipY, M.legW, thighH, colA, dark ? C.armor : C.armorHi, C.armorDk);
    rect(c, cx - 2 + dx, hipY + Math.floor(thighH / 2), M.legW, 2, C.under);
    shadedBox(c, cx - 2 + dx, footY - 5, M.legW + 3, 5, colB, dark ? C.trim : C.trimHi, C.under);
  };
  drawBattleLeg(-legSpread, true);
  drawBattleLeg(legSpread, false);

  // 3. Torso & signature armor/garment
  const tx = cx - Math.floor(M.torsoW / 2);
  shadedBox(c, tx, torsoY, M.torsoW, M.torsoH, C.armor, C.armorHi, C.armorSh, C.armorDk);
  rect(c, tx, torsoY + M.torsoH - 3, M.torsoW, 3, C.trimDk);

  if (id === 'sleeper_A') {
    shadedBox(c, tx - 2, torsoY, 8, 9, C.cloth, C.clothHi, C.clothDk);
    rect(c, tx + 6, torsoY + 2, 6, 8, C.trim);
    rect(c, tx + 9, torsoY + 4, 2, 4, flare ? C.glowHi : C.glow);
    rect(c, tx + 4, torsoY + 3, 3, 3, C.metalHi);
  } else if (id === 'sleeper_B') {
    rect(c, tx - 3, torsoY, M.torsoW + 6, 13, C.cloth);
    rect(c, tx - 2, torsoY + 1, 4, 11, C.clothHi);
    line(c, tx - 1, torsoY + 1, tx + M.torsoW + 1, torsoY + 12, C.leather, 2);
    disc(c, tx + 6, torsoY + 6, 2, C.trimHi);
  } else if (id === 'sleeper_C') {
    shadedBox(c, tx + 1, torsoY + 1, M.torsoW - 2, 10, C.cloth, C.clothHi, C.clothDk);
    rect(c, tx + 5, torsoY + 4, 4, 4, flare ? C.glowHi : C.glow);
    disc(c, tx + 1, torsoY + 3, 3, C.trim);
  } else if (id === 'sleeper_D') {
    rect(c, tx + 2, torsoY + 4, 6, 6, C.armorDk);
    rect(c, tx + 6, torsoY + 5, 2, 4, flare ? C.glowHi : C.glow);
    // High wrapped crimson scarf collar
    shadedBox(c, tx - 3, torsoY - 2, M.torsoW + 6, 6, C.cloth, C.clothHi, C.clothDk);
  }

  // 4. Sculpted Head matching portrait & overworld 1:1
  const hx = cx - Math.floor(M.headW / 2) + 1;
  if (id === 'sleeper_A') {
    shadedBox(c, hx, headY, M.headW, M.headH, C.armor, C.armorHi, C.armorSh);
    // Tall dorsal bronze-edged crest fin
    shadedBox(c, hx + 1, headY - 6, 9, 6, C.trim, C.trimHi, C.trimDk);
    rect(c, hx + 2, headY - 6, 7, 2, C.metalHi);
    // Angled cyan chevron visor
    rect(c, hx + M.headW - 6, headY + 5, 6, 4, C.under);
    rect(c, hx + M.headW - 5, headY + 6, 5, 2, flare ? C.glowHi : C.glow);
  } else if (id === 'sleeper_B') {
    // Deep draped olive hood + rear sensor ribbon + brass cyclops lens
    rect(c, hx - 3, headY, M.headW + 3, M.headH, C.cloth);
    rect(c, hx - 1, headY - 2, M.headW - 1, 3, C.clothHi);
    line(c, hx - 3, headY + 7, hx - 9, headY + 16, C.trim, 2);
    px(c, hx - 9, headY + 16, C.glow);
    rect(c, hx + M.headW - 6, headY + 4, 6, 7, C.under);
    disc(c, hx + M.headW - 2, headY + 7, 3, C.trim);
    disc(c, hx + M.headW - 2, headY + 7, 2, flare ? C.glowHi : C.glow);
  } else if (id === 'sleeper_C') {
    // Swept copper wire-hair + brass ear disc + tall angled whip antenna + amber flip-goggle!
    shadedBox(c, hx, headY + 1, M.headW, M.headH - 1, C.armor, C.armorHi, C.armorSh);
    rect(c, hx - 5, headY - 1, 11, 9, C.hair);
    rect(c, hx - 3, headY - 2, 10, 4, C.hairHi);
    disc(c, hx + 1, headY + 6, 3, C.trimHi);
    line(c, hx, headY, hx - 3, headY - 9, C.trim, 2);
    disc(c, hx - 3, headY - 9, 2, flare ? C.glowHi : C.glow);
    // Projecting amber goggle lens
    rect(c, hx + M.headW - 5, headY + 4, 6, 5, C.trim);
    rect(c, hx + M.headW - 3, headY + 5, 4, 3, flare ? C.glowHi : C.glow);
  } else if (id === 'sleeper_D') {
    // Sleek aero-visor + swept silver ear-wing + silver bangs + expressive rose eye!
    shadedBox(c, hx, headY + 1, M.headW, M.headH - 1, C.armor, C.armorHi, C.armorDk);
    // Twin swept silver aero-wing!
    line(c, hx + 1, headY + 5, hx - 7, headY - 3, C.trimHi, 3);
    line(c, hx + 2, headY + 6, hx - 5, headY, C.glow, 1);
    rect(c, hx + M.headW - 6, headY + 2, 6, 3, C.hairHi);
    rect(c, hx + M.headW - 6, headY + 5, 6, 5, C.under);
    rect(c, hx + M.headW - 5, headY + 5, 4, 4, flare ? C.glowHi : C.glow);
    px(c, hx + M.headW - 4, headY + 6, '#ffffff');
  }

  // 5. Forearm + Signature Sleeper Weapon / Stance
  const armY = torsoY + 3 - Math.floor(armRaise * 0.6);
  const armX = cx + 2;
  if (isGuard) {
    if (id === 'sleeper_A') {
      // Heavy raised bastion shield
      shadedBox(c, cx + 6, torsoY - 3, 7, 22, C.armor, C.armorHi, C.trimDk);
      rect(c, cx + 8, torsoY + 1, 3, 14, C.glow);
    } else {
      shadedBox(c, cx + 5, torsoY - 1, 6, 16, C.trim, C.trimHi, C.under);
      rect(c, cx + 7, torsoY + 2, 2, 10, C.glow);
    }
  } else if (!isDown) {
    // Raised / attacking / idle weapon arm
    shadedBox(c, armX, armY, 6, 5, C.armor, C.armorHi, C.armorSh);
    rect(c, armX + 5, armY, 3, 4, C.under);
    if (id === 'sleeper_A') {
      // Bastion Breaker Baton + Shield Gauntlet
      const bx = armX + 7, by = isVictory ? armY - 12 : (flare ? armY - 2 : armY - 4);
      shadedBox(c, bx, by, 4, isVictory ? 15 : 13, C.trim, C.metalHi, C.trimDk);
      if (flare) {
        rect(c, bx + 3, by - 2, 10, 4, C.glow);
        rect(c, bx + 5, by - 1, 6, 2, C.glowHi);
      }
    } else if (id === 'sleeper_B') {
      // Brass Survey Carbine / Staff
      shadedBox(c, armX + 5, armY - 1, 14, 4, C.trim, C.trimHi, C.trimDk);
      rect(c, armX + 16, armY, 3, 2, flare ? C.glowHi : C.glow);
      if (flare) rect(c, armX + 19, armY, 9, 2, C.glow);
    } else if (id === 'sleeper_C') {
      // Arc-Coil Wrench / Emitter
      shadedBox(c, armX + 5, armY - 2, 11, 4, C.trim, C.trimHi, C.trimDk);
      rect(c, armX + 14, armY - 4, 4, 8, C.armorHi);
      rect(c, armX + 15, armY - 2, 3, 4, flare ? C.glowHi : C.glow);
      if (flare) glowDisc(c, armX + 17, armY, 7, C.glow, 0.55);
    } else if (id === 'sleeper_D') {
      // Twin-Edge Courier Speed Blade
      line(c, armX + 6, armY + 2, armX + 19, armY - (flare ? 6 : 2), C.trimHi, 2);
      line(c, armX + 8, armY + 2, armX + 18, armY - (flare ? 5 : 1), C.glow, 1);
      if (flare) line(c, armX + 14, armY - 7, armX + 24, armY + 4, C.glowHi, 2);
    }
  }

  applyPixelOutline(c, S, S, '#08090e');
  cv.getContext('2d').drawImage(tmp, 0, 0);
  return true;
}

// ============================================================================
// 4. PROPORTIONAL OVERWORLD SCALE ADAPTER FOR HUMANOID NPCs & COMPANIONS
//    Compresses legacy 52px-tall drawAndroid output cleanly into natural 37px
//    JRPG overworld height anchored at y=55, preserving crisp 1px dark outline!
// ============================================================================
export function scaleHumanoidWorldFrameToJrpg(srcCanvas, targetHeight = 37) {
  const w = srcCanvas.width, h = srcCanvas.height; // 32 x 56
  const dst = new srcCanvas.constructor(w, h);
  const dctx = dst.getContext('2d');
  const sctx = srcCanvas.getContext('2d');
  const sdata = sctx.getImageData(0, 0, w, h).data;

  // Find actual opaque bounding box of source sprite
  let minY = h, maxY = -1, minX = w, maxX = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (sdata[(y * w + x) * 4 + 3] > 20) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxY < minY) return srcCanvas;
  const srcH = maxY - minY + 1;
  const srcW = maxX - minX + 1;
  if (srcH <= targetHeight + 1) return srcCanvas;

  // Preserve crisp proportions (slightly wider horizontal retention so JRPG characters read cleanly)
  const scaleY = targetHeight / srcH;
  const scaleX = Math.min(1, scaleY * 1.12);
  const outH = Math.round(srcH * scaleY);
  const outW = Math.max(10, Math.round(srcW * scaleX));
  const dx = Math.round((w - outW) / 2);
  const dy = h - 1 - outH; // bottom-anchored solidly at y=55

  // Nearest-neighbor copy of interior pixels first (skipping only outer dark outline), then re-apply crisp 1px outline!
  const isTransparent = (px, py) => px < 0 || py < 0 || px >= w || py >= h || sdata[(py * w + px) * 4 + 3] < 20;
  for (let y = 0; y < outH; y++) {
    const sy = minY + Math.min(srcH - 1, Math.floor((y + 0.5) / scaleY));
    for (let x = 0; x < outW; x++) {
      const sx = minX + Math.min(srcW - 1, Math.floor((x + 0.5) / scaleX));
      const si = (sy * w + sx) * 4;
      const a = sdata[si + 3];
      if (a < 20) continue;
      const r = sdata[si], g = sdata[si + 1], b = sdata[si + 2];
      const onEdge = isTransparent(sx - 1, sy) || isTransparent(sx + 1, sy) || isTransparent(sx, sy - 1) || isTransparent(sx, sy + 1);
      if (onEdge && r <= 18 && g <= 18 && b <= 22) continue;
      dctx.fillStyle = `rgb(${r},${g},${b})`;
      dctx.fillRect(dx + x, dy + y, 1, 1);
    }
  }
  applyPixelOutline(dctx, w, h, '#08070b');
  return dst;
}
