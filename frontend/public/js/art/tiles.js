// Procedural fallback art: native authored tiles/atlases take precedence only in private campaign.
import {paintCampaignEnvironmentDetails} from '../engine/campaign-environment-details.js';
const T = 32;
const hsh = (x, y, s = 0) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
const R = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x | 0, y | 0, w, h); };

function rust(c, X, Y, x, y, s, n = 20, spread = 12) {
  const cx = 6 + hsh(x, y, s) * 20, cy = 6 + hsh(x, y, s + 1) * 20;
  for (let i = 0; i < n; i++) R(c, i % 3 ? '#4a2a1c' : '#6b3a22', X + cx + (hsh(x, y, s + 10 + i) - .5) * spread, Y + cy + (hsh(x, y, s + 40 + i) - .5) * spread * .7, 2, 1);
}
function floor(c, x, y, shadow) {
  const X = x * T, Y = y * T, v = hsh(x, y);
  R(c, v < .5 ? '#1e272b' : '#1b2327', X, Y, T, T);
  R(c, '#263136', X, Y, T, 1); R(c, '#263136', X, Y, 1, T); R(c, '#12181b', X, Y + T - 1, T, 1); R(c, '#12181b', X + T - 1, Y, 1, T);
  [[3, 3], [27, 3], [3, 27], [27, 27]].forEach(([a, b]) => R(c, '#34424a', X + a, Y + b, 2, 2));
  if (v > .86) for (let i = 6; i < 26; i += 4) { R(c, '#0c1012', X + 6, Y + i, 20, 2); R(c, '#2c383d', X + 6, Y + i + 2, 20, 1); }
  for (let i = 0; i < 16; i++) R(c, hsh(x, y, i + 7) > .5 ? '#161d20' : '#242e33', X + 1 + hsh(x + i, y, 1) * 30, Y + 1 + hsh(x, y + i, 2) * 30, 1, 1);
  if (hsh(x, y, 3) > .68) rust(c, X, Y, x, y, 3);
  if (hsh(x, y, 5) > .9) for (let i = 0; i < 14; i++) R(c, '#141a1d', X + 8 + hsh(x, y, 60 + i) * 14, Y + 8 + hsh(x, y, 80 + i) * 12, 3, 2);
  // large-scale grime / tint variation so plates do not read as a repeating grid
  const big = (hsh(x >> 2, y >> 2, 11) + hsh((x + 2) >> 2, (y + 1) >> 2, 12)) / 2;
  R(c, `rgba(0,0,0,${(big * .22).toFixed(3)})`, X, Y, T, T); if (big > .62) R(c, 'rgba(40,110,105,.05)', X, Y, T, T); if (big < .3) R(c, 'rgba(120,60,30,.05)', X, Y, T, T);
  if (hsh(x, y, 13) > .8) { for (let i = 0; i < 9; i++) R(c, 'rgba(120,160,175,.10)', X + 5 + i * 2 + hsh(x, y, 70 + i) * 4, Y + 20 + Math.sin(i + x) * 2, 3, 1); R(c, 'rgba(160,200,215,.14)', X + 10, Y + 21, 5, 1); } // damp sheen
  if (hsh(x, y, 14) > .9) { let px = 4 + hsh(x, y, 15) * 10, py = 3; for (let i = 0; i < 16; i++) { R(c, '#0d1215', X + px, Y + py, 1, 2); py += 1.6; px += hsh(x, y, 90 + i) > .5 ? 1 : -.4; } } // crack
  if (shadow) { R(c, 'rgba(0,0,0,.5)', X, Y, T, 3); R(c, 'rgba(0,0,0,.3)', X, Y + 3, T, 4); R(c, 'rgba(0,0,0,.14)', X, Y + 7, T, 5); if (hsh(x, y, 16) > .6) R(c, 'rgba(90,50,32,.5)', X + 4 + hsh(x, y, 17) * 22, Y, 1, 5 + hsh(x, y, 18) * 6); }
}
function wallFace(c, x, y) {
  const X = x * T, Y = y * T, v = hsh(x, y, 9);
  R(c, '#27323a', X, Y, T, T); R(c, '#44535b', X, Y, T, 3); R(c, '#0a0d0f', X, Y + 3, T, 1);
  R(c, '#1a2227', X + 15, Y + 4, 1, 23); R(c, '#1a2227', X, Y + 4, 1, 23);
  R(c, '#303d45', X + 2, Y + 6, 12, 1); R(c, '#303d45', X + 17, Y + 6, 13, 1);
  R(c, '#3a3220', X, Y + 26, T, 1); R(c, '#11171a', X, Y + 27, T, 5);
  if (v < .2) { for (let i = 10; i < 22; i += 3) { R(c, '#0a0d0f', X + 5, Y + i, 22, 2); R(c, '#3a474f', X + 5, Y + i + 2, 22, 1); } }
  else if (v < .38) { R(c, '#5b5433', X, Y + 12, T, 4); R(c, '#7d7446', X, Y + 12, T, 1); R(c, '#2a2716', X, Y + 16, T, 1); R(c, '#1a2227', X + 8, Y + 10, 3, 8); }
  else if (v < .5) { for (let py = 16; py < 22; py++) for (let px = 1; px < 31; px++) if (hsh(x * 40 + px, y * 40 + py, 2) > .32) R(c, ((px + py) >> 2) % 2 ? '#85752c' : '#15171a', X + px, Y + py, 1, 1); }
  else if (v < .62) {
    R(c, '#07090a', X + 8, Y + 9, 13, 9); R(c, '#3a474f', X + 8, Y + 8, 13, 1);
    ['#7a2b2b', '#2b5a6a', '#85752c'].forEach((col, i) => { R(c, col, X + 10 + i * 4, Y + 11, 1, 8 + i * 3); R(c, col, X + 10 + i * 4, Y + 18 + i * 3, 2, 1); });
  }
  for (let i = 0; i < 3; i++) if (hsh(x, y, 20 + i) > .5) R(c, '#5a3220', X + 2 + hsh(x, y, 30 + i) * 28, Y + 4, 1, 4 + hsh(x, y, 33 + i) * 14);
  [2, 13, 18, 29].forEach(a => { R(c, '#4a5a63', X + a, Y + 8, 1, 1); R(c, '#151c20', X + a, Y + 9, 1, 1); R(c, '#4a5a63', X + a, Y + 23, 1, 1); });
  R(c, 'rgba(160,190,200,.10)', X + 1, Y + 4, 30, 1); R(c, 'rgba(0,0,0,.14)', X, Y + 14, T, 6); R(c, 'rgba(0,0,0,.26)', X, Y + 20, T, 7);
}
function wallTop(c, x, y, at) {
  const X = x * T, Y = y * T;
  R(c, '#0b0e10', X, Y, T, T); R(c, '#12171a', X + 4, Y + 15, 24, 1);
  if (at(x, y - 1) === 2) { R(c, '#2a353b', X, Y, T, 5); R(c, '#44535b', X, Y, T, 1); }
  if (at(x - 1, y) === 2) { R(c, '#2a353b', X, Y, 5, T); R(c, '#44535b', X, Y, 1, T); }
  if (at(x + 1, y) === 2) { R(c, '#2a353b', X + T - 5, Y, 5, T); R(c, '#44535b', X + T - 1, Y, 1, T); }
}
function machine(c, p) {
  const X = p.x * T, Y = p.y * T, W = p.w * T, H = p.h * T;
  R(c, '#15170f', X + 1, Y + 1, W - 2, H - 2); R(c, '#4b5038', X + 2, Y + 2, W - 4, H - 16); R(c, '#5a6044', X + 2, Y + 2, W - 4, 1);
  R(c, '#2a2d20', X + 2, Y + H - 14, W - 4, 12); R(c, '#1c1e15', X + 2, Y + H - 3, W - 4, 1);
  for (let i = 0; i < p.w; i++) {
    const v = hsh(p.x + i, p.y, 4), bx = X + i * T;
    if (v < .4) { R(c, '#0d0e0a', bx + 8, Y + H - 12, 8, 8); R(c, '#6b4a12', bx + 10, Y + H - 10, 4, 4); R(c, '#2a2d20', bx + 12, Y + H - 9, 1, 2); }
    else if (v < .75) for (let k = 0; k < 4; k++) R(c, '#0d0e0a', bx + 6 + k * 5, Y + H - 12, 3, 8);
    else { R(c, '#6e6537', bx + 4, Y + H - 11, 24, 3); R(c, '#8a7f49', bx + 4, Y + H - 11, 24, 1); }
    R(c, '#3b3f2c', bx + 6, Y + 6, 20, Math.max(4, H - 24)); R(c, '#2a2d20', bx + 6, Y + 6, 20, 1);
    R(c, '#6e6537', bx + 22, Y + 4, 4, 4);
    if (hsh(p.x + i, p.y, 6) > .4) rust(c, bx, Y, p.x + i, p.y, 12, 18, 16);
  }
}
function crate(c, p) {
  const X = p.x * T, Y = p.y * T;
  R(c, '#231f18', X + 3, Y + 3, 26, 27); R(c, '#3a3327', X + 5, Y + 5, 22, 14); R(c, '#2c261d', X + 5, Y + 20, 22, 8);
  R(c, '#231f18', X + 15, Y + 5, 2, 23); R(c, '#4a4233', X + 5, Y + 5, 22, 1); rust(c, X, Y, p.x, p.y, 15, 10, 14);
}
function debris(c, p) {
  const X = p.x * T, Y = p.y * T;
  for (let i = 0; i < 26; i++) R(c, ['#2a3338', '#4a2a1c', '#11161a', '#3b3f2c'][i % 4], X + 3 + hsh(p.x, p.y, i) * 24, Y + 6 + hsh(p.x, p.y, 50 + i) * 20, 2 + (i % 3), 1 + (i % 2));
  R(c, '#6e6537', X + 12, Y + 14, 7, 2);
}
function cable(c, p) {
  for (let i = 0; i < p.w * T; i++) { const y = p.y * T + 16 + Math.round(Math.sin(i / 7 + p.x) * 4); R(c, '#0a0c0d', p.x * T + i, y, 1, 2); if (i % 9 === 0) R(c, '#5a3220', p.x * T + i, y, 2, 1); }
}
function hazard(c, p) {
  const X = p.x * T, Y = p.y * T, W = p.w * T, H = p.h * T;
  for (let py = 2; py < H - 2; py++) for (let px = 2; px < W - 2; px++) {
    const edge = px < 6 || py < 6 || px >= W - 6 || py >= H - 6;
    if (edge && hsh(X + px, Y + py, 3) > .4) R(c, ((px + py) >> 2) % 2 ? '#85752c' : '#15171a', X + px, Y + py, 1, 1);
  }
}

function rack(c, p) {
  const X = p.x * T, Y = p.y * T, W = p.w * T, H = p.h * T;
  R(c, '#0d0e0a', X + 2, Y + 1, W - 4, H - 2); R(c, '#2a2d20', X + 2, Y + 1, W - 4, 2);
  for (let y = 5; y < H - 6; y += 9) {
    R(c, '#3b3f2c', X + 3, Y + y + 7, W - 6, 1);
    for (let x = 4; x < W - 7; x += 5) { const v = hsh(p.x * 9 + x, p.y * 9 + y, 2); if (v < .18) continue; R(c, v > .6 ? '#6e6537' : '#4f6b5c', X + x, Y + y, 4, 7); R(c, v > .6 ? '#8a7f49' : '#6b8a78', X + x, Y + y, 1, 7); if (v > .85) R(c, '#c9b860', X + x + 1, Y + y + 3, 2, 1); }
  }
}

function paintCampaignTerrainCell(c, code, x, y, atT, theme) {
  const X = x * T, Y = y * T;
  if (code === 1) {
    // Seamless architectural stone/metal walkway or ceremonial path with outer beveled curbs only
    const warm = theme === 'lantern' || theme === 'mail' || theme === 'wasteland';
    const base = warm ? 'rgba(138,108,74,0.34)' : theme === 'cathedral' || theme === 'archive' ? 'rgba(92,118,162,0.30)' : 'rgba(116,144,158,0.28)';
    const rim = warm ? 'rgba(245,204,132,0.38)' : 'rgba(176,226,242,0.34)';
    R(c, base, X, Y, T, T);
    if (atT(x, y - 1) !== 1) { R(c, rim, X, Y, T, 2); R(c, 'rgba(0,0,0,0.28)', X, Y + 2, T, 1); }
    if (atT(x, y + 1) !== 1) { R(c, 'rgba(0,0,0,0.42)', X, Y + T - 2, T, 2); }
    if (atT(x - 1, y) !== 1) { R(c, rim, X, Y, 2, T); }
    if (atT(x + 1, y) !== 1) { R(c, 'rgba(0,0,0,0.36)', X + T - 2, Y, 2, T); }
    if (hsh(x, y, 13) > 0.45) R(c, 'rgba(255,255,255,0.06)', X + 6, Y + 6, 8, 1);
    if (hsh(x, y, 19) > 0.50) R(c, 'rgba(0,0,0,0.12)', X + 18, Y + 22, 9, 1);
  } else if (code === 2) {
    // Seamless deep water / coolant canal basin with organic ripples & shoreline foam only on edges
    const deep = theme === 'stasis' || theme === 'cathedral' ? '#0d293b' : theme === 'wetland' || theme === 'quay' ? '#123840' : '#113340';
    const mid = theme === 'wetland' || theme === 'quay' ? '#1a525a' : '#174b60';
    const glint = theme === 'wetland' ? 'rgba(154,242,226,0.28)' : 'rgba(148,232,250,0.26)';
    const foam = theme === 'wetland' ? 'rgba(164,244,230,0.52)' : 'rgba(158,236,255,0.48)';
    R(c, mid, X, Y, T, T);
    // Subtle multi-tile depth bands & shimmering current glints (no tile-box seams!)
    if (((x + y) & 1) === 0) R(c, 'rgba(8,22,30,0.14)', X, Y, T, T);
    const rx = 3 + Math.floor(hsh(x, y, 27) * 14);
    const ry = 6 + Math.floor(hsh(x, y, 29) * 18);
    R(c, glint, X + rx, Y + ry, 9, 1);
    R(c, 'rgba(255,255,255,0.14)', X + rx + 2, Y + ry, 4, 1);
    if (hsh(x, y, 31) > 0.55) R(c, deep, X + 4, Y + ((ry + 12) % 26), 12, 2);
    if (atT(x, y - 1) !== 2) {
      R(c, '#1c2a30', X, Y, T, 4); R(c, '#49636b', X, Y, T, 1);
      R(c, 'rgba(0,0,0,0.45)', X, Y + 4, T, 4); R(c, foam, X + 1, Y + 8, T - 2, 1);
    }
    if (atT(x, y + 1) !== 2) { R(c, '#2d4047', X, Y + T - 3, T, 3); R(c, foam, X + 2, Y + T - 4, T - 4, 1); }
    if (atT(x - 1, y) !== 2) { R(c, '#1c2a30', X, Y, 3, T); R(c, foam, X + 3, Y + 1, 1, T - 2); }
    if (atT(x + 1, y) !== 2) { R(c, '#1c2a30', X + T - 3, Y, 3, T); R(c, foam, X + T - 4, Y + 1, 1, T - 2); }
  } else if (code === 3) {
    // Multi-step elevation stairway / ramp with treads, riser shadows & side handrails
    const stone = theme === 'lantern' || theme === 'wetland' ? '#634a35' : theme === 'wasteland' ? '#6b5642' : '#3d4c59';
    const hi = theme === 'lantern' || theme === 'wetland' ? '#8c6b4d' : theme === 'wasteland' ? '#94785e' : '#657c8f';
    R(c, '#12181e', X, Y, T, T);
    for (let s = 0; s < 5; s++) {
      const sy = Y + 2 + s * 6;
      R(c, stone, X + 3, sy, T - 6, 5);
      R(c, hi, X + 3, sy, T - 6, 1);
      R(c, 'rgba(0,0,0,0.45)', X + 3, sy + 4, T - 6, 2);
    }
    R(c, '#202930', X, Y, 3, T); R(c, '#8ea4b5', X + 1, Y, 1, T);
    R(c, '#202930', X + T - 3, Y, 3, T); R(c, '#8ea4b5', X + T - 2, Y, 1, T);
  } else if (code === 4) {
    // Elevated viaduct / cliff drop-off edge with safety rail posts & abyssal shadow
    R(c, '#0b1016', X, Y, T, T);
    R(c, 'rgba(38,54,68,0.65)', X, Y, T, 8);
    R(c, '#6a7f90', X, Y, T, 2);
    R(c, '#25323d', X, Y + 8, T, 4);
    for (let px = 4; px < T; px += 10) {
      R(c, '#141c24', X + px, Y - 2, 4, 12);
      R(c, '#8da4b8', X + px + 1, Y - 2, 2, 10);
    }
    R(c, '#d9a44a', X, Y + 2, T, 1);
  } else if (code === 5) {
    // Organic moss / grass / wildflower ground transition patch
    const g1 = theme === 'wasteland' ? '#667338' : '#346331';
    const g2 = theme === 'wasteland' ? '#8fa349' : '#589c46';
    const fl = theme === 'wasteland' ? '#f5cc66' : '#8ef0c2';
    for (let i = 0; i < 18; i++) {
      const ox = 2 + Math.floor(hsh(x, y, 20 + i) * 24);
      const oy = 2 + Math.floor(hsh(x, y, 50 + i) * 24);
      const w = 3 + (i % 4), h = 2 + (i % 3);
      R(c, i % 2 ? g1 : g2, X + ox, Y + oy, w, h);
      if (i % 6 === 0) R(c, fl, X + ox + 1, Y + oy, 2, 1);
    }
  } else if (code === 6) {
    // Recessed energy / relay conduit trench
    const glow = theme === 'cathedral' ? '#c88cff' : theme === 'lantern' || theme === 'quarantine' ? '#f5b858' : '#5ce4ff';
    R(c, 'rgba(8,14,20,0.72)', X + 10, Y, 12, T);
    R(c, 'rgba(72,96,114,0.55)', X + 10, Y, 1, T);
    R(c, 'rgba(72,96,114,0.55)', X + 21, Y, 1, T);
    R(c, glow, X + 14, Y, 4, T);
    R(c, 'rgba(255,255,255,0.45)', X + 15, Y, 2, T);
    R(c, '#2d3b47', X + 9, Y + 6, 14, 3);
    R(c, '#2d3b47', X + 9, Y + 22, 14, 3);
  } else if (code === 7) {
    // Timber boardwalk / wooden pier bridge over water or marsh
    const base = theme === 'quay' || theme === 'relay' ? '#584434' : '#694a31';
    const hi = theme === 'quay' || theme === 'relay' ? '#7a6049' : '#8e6644';
    const seam = '#241810';
    R(c, '#1c140e', X, Y, T, T);
    for (let px = 0; px < T; px += 6) {
      R(c, base, X + px + 1, Y + 1, 5, T - 2);
      R(c, hi, X + px + 1, Y + 1, 1, T - 2);
      R(c, seam, X + px, Y, 1, T);
      R(c, '#1e1610', X + px + 3, Y + 4, 1, 1);
      R(c, '#1e1610', X + px + 3, Y + T - 5, 1, 1);
    }
    if (atT(x, y - 1) === 2) {
      // North bridge curb & timber railing posts over water
      R(c, '#3d2a1c', X, Y, T, 3); R(c, '#a8825b', X, Y, T, 1);
      R(c, '#2c1e14', X + 2, Y - 1, 3, 5); R(c, '#2c1e14', X + T - 5, Y - 1, 3, 5);
    }
    if (atT(x, y + 1) === 2) {
      // South bridge beam & dark shadow cast into water below
      R(c, '#3d2a1c', X, Y + T - 3, T, 3); R(c, '#8c6848', X, Y + T - 3, T, 1);
    }
    if (atT(x - 1, y) === 2) { R(c, '#3d2a1c', X, Y, 3, T); R(c, '#a8825b', X, Y, 1, T); }
    if (atT(x + 1, y) === 2) { R(c, '#3d2a1c', X + T - 3, Y, 3, T); R(c, '#20150e', X + T - 1, Y, 1, T); }
  } else if (code === 8) {
    // Architectural building roof / bunker shelter cap (corrugated metal, slate shingles, or armored deck)
    const warm = theme === 'lantern' || theme === 'mail' || theme === 'wasteland' || theme === 'wetland';
    const roofBase = warm ? '#4e3326' : theme === 'cathedral' || theme === 'archive' ? '#252c3f' : '#2d3844';
    const roofHi = warm ? '#744c38' : theme === 'cathedral' || theme === 'archive' ? '#404c6b' : '#4a5d6e';
    const roofDark = warm ? '#291912' : '#131921';
    R(c, roofBase, X, Y, T, T);
    for (let ry = 0; ry < T; ry += 6) {
      R(c, roofHi, X + 1, Y + ry, T - 2, 2);
      R(c, roofDark, X, Y + ry + 5, T, 1);
    }
    // Vertical seam ribs
    R(c, 'rgba(0,0,0,0.28)', X + 15, Y, 1, T);
    R(c, 'rgba(255,255,255,0.08)', X + 16, Y, 1, T);
    // Ridge highlight on north edge; shadowed eave overhang on south edge
    if (atT(x, y - 1) !== 8) { R(c, roofHi, X, Y, T, 3); R(c, 'rgba(255,236,196,0.25)', X, Y, T, 1); }
    if (atT(x, y + 1) !== 8) { R(c, roofDark, X, Y + T - 4, T, 4); R(c, '#d6a44e', X, Y + T - 5, T, 1); }
    if (atT(x - 1, y) !== 8) { R(c, roofHi, X, Y, 2, T); }
    if (atT(x + 1, y) !== 8) { R(c, roofDark, X + T - 2, Y, 2, T); }
    // Occasional rooftop vent or skylight hatch
    if (hsh(x, y, 61) > 0.78) {
      R(c, roofDark, X + 9, Y + 9, 14, 10);
      R(c, roofHi, X + 10, Y + 10, 12, 2);
      R(c, '#151d24', X + 11, Y + 13, 10, 4);
    }
  } else if (code === 9) {
    // Building exterior facade wall with illuminated windows, timber/steel trim & stone foundation
    const warm = theme === 'lantern' || theme === 'mail' || theme === 'wetland' || theme === 'wasteland' || theme === 'sky';
    const facade = warm ? '#5b4331' : theme === 'cathedral' || theme === 'archive' ? '#2c3347' : '#35434f';
    const hi = warm ? '#7c5d45' : theme === 'cathedral' || theme === 'archive' ? '#485473' : '#536878';
    const trim = warm ? '#2e2016' : '#182028';
    const winGlow = warm ? '#ffd884' : theme === 'cathedral' ? '#c99eff' : '#7ae8ff';
    R(c, facade, X, Y, T, T);
    // Eave shadow cast from roof above
    R(c, 'rgba(0,0,0,0.45)', X, Y, T, 4);
    R(c, hi, X, Y + 4, T, 2);
    // Corner studs / pilasters
    R(c, trim, X, Y + 4, 2, T - 9);
    R(c, trim, X + T - 2, Y + 4, 2, T - 9);
    // Foundation plinth at base
    R(c, '#23282e', X, Y + T - 6, T, 6);
    R(c, '#46505a', X, Y + T - 6, T, 1);
    // Illuminated window frame (glowing panes with mullions)
    R(c, trim, X + 7, Y + 8, 18, 13);
    R(c, winGlow, X + 9, Y + 10, 14, 9);
    R(c, 'rgba(255,255,255,0.45)', X + 10, Y + 11, 5, 3);
    R(c, trim, X + 15, Y + 9, 2, 11);
    R(c, trim, X + 8, Y + 14, 16, 1);
    // Window sill
    R(c, hi, X + 6, Y + 21, 20, 2);
  } else if (code === 10) {
    // Seamless organic packed-earth / pebble outdoor dirt trail (soft mossy verge only on outer borders)
    const dirt = theme === 'wetland' ? 'rgba(116,96,68,0.56)' : theme === 'sky' || theme === 'wasteland' ? 'rgba(156,126,86,0.52)' : 'rgba(114,98,74,0.50)';
    const edge = theme === 'wetland' ? 'rgba(64,104,58,0.44)' : 'rgba(92,82,58,0.38)';
    R(c, dirt, X, Y, T, T);
    if (atT(x, y - 1) !== 10) R(c, edge, X, Y, T, 3);
    if (atT(x, y + 1) !== 10) R(c, edge, X, Y + T - 3, T, 3);
    if (atT(x - 1, y) !== 10) R(c, edge, X, Y, 3, T);
    if (atT(x + 1, y) !== 10) R(c, edge, X + T - 3, Y, 3, T);
    for (let i = 0; i < 8; i++) {
      const px = X + 3 + Math.floor(hsh(x, y, 70 + i) * 24);
      const py = Y + 3 + Math.floor(hsh(x, y, 90 + i) * 24);
      R(c, i % 2 ? 'rgba(220,202,168,0.28)' : 'rgba(42,32,20,0.28)', px, py, 3, 2);
    }
  } else if (code === 11) {
    // Elevated railway track bed: gravel ballast, dark timber sleepers, twin gleaming steel rails
    R(c, 'rgba(32,36,42,0.55)', X, Y + 2, T, T - 4);
    for (let sx = 2; sx < T; sx += 8) {
      R(c, '#2d2219', X + sx, Y + 3, 4, T - 6);
      R(c, '#473628', X + sx, Y + 3, 1, T - 6);
    }
    // Twin horizontal steel rails
    R(c, '#1c232b', X, Y + 7, T, 4); R(c, '#9eb4c4', X, Y + 8, T, 2);
    R(c, '#1c232b', X, Y + 21, T, 4); R(c, '#9eb4c4', X, Y + 22, T, 2);
  } else if (code === 12) {
    // Natural rocky cliff / canyon escarpment face (replaces indoor brick walls outdoors!)
    const warm = theme === 'wasteland' || theme === 'sky' || theme === 'lantern';
    const rockDark = warm ? '#3b2d22' : theme === 'wetland' ? '#24322e' : '#2a3330';
    const rockMid = warm ? '#5b4534' : theme === 'wetland' ? '#364a44' : '#404d46';
    const rockHi = warm ? '#82644b' : theme === 'wetland' ? '#567066' : '#5e7064';
    R(c, rockDark, X, Y, T, T);
    // Layered craggy stone strata
    R(c, rockMid, X + 1, Y + 3, 16, 11); R(c, rockHi, X + 1, Y + 3, 16, 2);
    R(c, rockMid, X + 18, Y + 5, 13, 10); R(c, rockHi, X + 18, Y + 5, 13, 2);
    R(c, rockMid, X + 2, Y + 16, 12, 12); R(c, rockHi, X + 2, Y + 16, 12, 1);
    R(c, rockMid, X + 15, Y + 17, 15, 12); R(c, rockHi, X + 15, Y + 17, 15, 1);
    // Top cliff crest rim & moss/grass cap
    if (atT(x, y - 1) !== 12) {
      R(c, rockHi, X, Y, T, 3);
      R(c, warm ? '#788542' : '#467d42', X + 2, Y + 1, 12, 3);
      R(c, warm ? '#98a653' : '#64a852', X + 18, Y + 1, 10, 2);
    }
    if (atT(x, y + 1) !== 12) {
      R(c, 'rgba(0,0,0,0.45)', X, Y + T - 4, T, 4);
    }
  } else if (code === 13) {
    // Dense organic wetland reeds / forest canopy foliage border mass
    const bg = theme === 'wetland' ? '#102d30' : '#132418';
    const leaf1 = theme === 'wetland' ? '#1f4d3b' : '#254a29';
    const leaf2 = theme === 'wetland' ? '#31734d' : '#3d7338';
    const leaf3 = theme === 'wetland' ? '#58a86a' : '#65a64d';
    R(c, bg, X, Y, T, T);
    for (let i = 0; i < 14; i++) {
      const ox = Math.floor(hsh(x, y, 110 + i) * 22);
      const oy = Math.floor(hsh(x, y, 140 + i) * 22);
      const sz = 6 + (i % 5);
      R(c, i % 3 === 0 ? leaf3 : i % 2 ? leaf2 : leaf1, X + ox, Y + oy, sz, sz - 1);
    }
    // Bright sunlit crown specks
    R(c, '#8fe096', X + 8 + ((x * 5) % 12), Y + 5, 3, 2);
    R(c, '#8fe096', X + 16, Y + 14 + ((y * 3) % 8), 2, 2);
  } else if (code === 14) {
    // Seamless functional floor zoning: woven rug, ceremonial runner, dawn mosaic terrace, or hazard bay
    if (theme === 'lantern' || theme === 'mail' || theme === 'archive' || theme === 'cathedral' || theme === 'sky') {
      const cloth = theme === 'cathedral' ? '#3d2559' : theme === 'archive' ? '#253c59' : theme === 'sky' ? '#8c7656' : '#6b3228';
      const trim = theme === 'cathedral' ? '#d4a8ff' : theme === 'sky' ? '#f7d88b' : '#e5b864';
      R(c, cloth, X, Y, T, T);
      if (atT(x, y - 1) !== 14) R(c, trim, X, Y + 1, T, 2);
      if (atT(x, y + 1) !== 14) R(c, trim, X, Y + T - 3, T, 2);
      if (atT(x - 1, y) !== 14) R(c, trim, X + 1, Y, 2, T);
      if (atT(x + 1, y) !== 14) R(c, trim, X + T - 3, Y, 2, T);
      if (((x + y) & 1) === 0) R(c, 'rgba(255,255,255,0.06)', X + 8, Y + 8, 16, 16);
    } else {
      // Industrial cryo / quarantine hazard safety deck border
      R(c, 'rgba(24,36,46,0.45)', X, Y, T, T);
      const stripe = theme === 'quarantine' ? '#e6a632' : '#58c4d8';
      if (atT(x, y - 1) !== 14) for (let sx = 0; sx < T; sx += 8) R(c, stripe, X + sx, Y, 4, 2);
      if (atT(x, y + 1) !== 14) for (let sx = 0; sx < T; sx += 8) R(c, stripe, X + sx, Y + T - 2, 4, 2);
      if (atT(x - 1, y) !== 14) for (let sy = 0; sy < T; sy += 8) R(c, stripe, X, Y + sy, 2, 4);
      if (atT(x + 1, y) !== 14) for (let sy = 0; sy < T; sy += 8) R(c, stripe, X + T - 2, Y + sy, 2, 4);
    }
  } else if (code === 15) {
    // Collapsed masonry rubble & cracked ruins
    for (let i = 0; i < 12; i++) {
      const rx = X + 2 + Math.floor(hsh(x, y, 170 + i) * 23);
      const ry = Y + 3 + Math.floor(hsh(x, y, 190 + i) * 23);
      const rw = 4 + (i % 5), rh = 3 + (i % 3);
      R(c, '#1c2224', rx, ry + 1, rw, rh);
      R(c, i % 2 ? '#596360' : '#434c49', rx, ry, rw, rh - 1);
      R(c, '#7e8a85', rx, ry, rw, 1);
    }
  } else if (code === 16) {
    // Cryo stasis pod bank embedded in recessed armored bulkhead (solid structural assembly)
    R(c, '#121a22', X, Y, T, T);
    R(c, '#273542', X + 1, Y + 1, T - 2, T - 2);
    R(c, '#42596d', X + 2, Y + 1, T - 4, 2);
    // Recessed cryogenic capsule viewport with frost sheen
    R(c, '#09141d', X + 5, Y + 4, 22, 22);
    R(c, '#1c4d63', X + 7, Y + 6, 18, 17);
    R(c, '#4cc4dc', X + 9, Y + 7, 14, 14);
    R(c, 'rgba(220,252,255,0.55)', X + 10, Y + 8, 3, 11);
    R(c, 'rgba(12,30,42,0.45)', X + 16, Y + 9, 5, 10);
    // Capsule clamps & status bar
    R(c, '#2d3b48', X + 4, Y + 13, 24, 2);
    R(c, '#151e27', X + 2, Y + T - 5, T - 4, 5);
    R(c, '#72dce8', X + 8, Y + T - 3, 6, 2);
    R(c, '#f2bd75', X + 19, Y + T - 3, 4, 2);
  } else if (code === 17) {
    // Continuous laboratory / control-room workstation console bank (solid)
    const accent = theme === 'cathedral' ? '#c99eff' : theme === 'lantern' || theme === 'quarantine' ? '#f5b858' : '#72dce8';
    const connectL = atT(x - 1, y) === 17, connectR = atT(x + 1, y) === 17;
    R(c, '#11171f', X, Y + 2, T, T - 2);
    R(c, '#2c3a47', X + (connectL ? 0 : 2), Y + 3, T - (connectL ? 0 : 2) - (connectR ? 0 : 2), 18);
    R(c, '#4b6175', X + (connectL ? 0 : 2), Y + 3, T - (connectL ? 0 : 2) - (connectR ? 0 : 2), 2);
    // Glowing telemetry monitor panel
    R(c, '#0a141c', X + 4, Y + 6, 24, 11);
    R(c, accent, X + 6, Y + 8, 11, 2);
    R(c, 'rgba(255,255,255,0.45)', X + 6, Y + 11, 7, 1);
    R(c, accent, X + 6, Y + 13, 15, 2);
    R(c, '#7dffb0', X + 23, Y + 8, 3, 3);
    // Lower desk housing & keypad deck
    R(c, '#1d2732', X + (connectL ? 0 : 2), Y + 21, T - (connectL ? 0 : 2) - (connectR ? 0 : 2), 9);
    for (let kx = 5; kx < 26; kx += 5) R(c, '#607487', X + kx, Y + 23, 3, 2);
    R(c, '#0b1016', X, Y + T - 2, T, 2);
  } else if (code === 18) {
    // Tall archive bookshelf / vault data-canister storage rack (solid)
    const warm = theme === 'mail' || theme === 'lantern';
    const frame = warm ? '#3b2b1e' : '#1d2534';
    const hi = warm ? '#694e38' : '#3a4a66';
    R(c, '#0e131b', X, Y, T, T);
    R(c, frame, X + 1, Y + 1, T - 2, T - 2);
    R(c, hi, X + 1, Y + 1, T - 2, 2);
    // Three stocked shelves with varied data ledgers/canisters
    for (let row = 0; row < 3; row++) {
      const sy = Y + 4 + row * 9;
      R(c, '#0b0f16', X + 3, sy, T - 6, 7);
      for (let bx = 4; bx < T - 5; bx += 4) {
        const v = hsh(x * 7 + bx, y * 11 + row, 5);
        if (v < 0.14) continue;
        const col = v > 0.72 ? (warm ? '#c99352' : '#5e88b8') : v > 0.42 ? (warm ? '#7d5338' : '#3e5c78') : '#4a6b59';
        R(c, col, X + bx, sy + 1, 3, 6);
        R(c, 'rgba(255,255,255,0.22)', X + bx, sy + 1, 1, 6);
      }
      R(c, hi, X + 2, sy + 7, T - 4, 1);
    }
  } else if (code === 19) {
    // Monumental carved architectural column / cathedral buttress pillar (solid)
    const stone = theme === 'cathedral' ? '#363b52' : theme === 'archive' ? '#344154' : theme === 'rootway' ? '#49544c' : '#3b4a56';
    const hi = theme === 'cathedral' ? '#626a8f' : theme === 'archive' ? '#5c7291' : theme === 'rootway' ? '#6d7c70' : '#647b8e';
    const trim = theme === 'cathedral' ? '#d4a8ff' : theme === 'archive' ? '#98bfff' : theme === 'rootway' ? '#7ec482' : '#72dce8';
    R(c, '#10151c', X + 2, Y, T - 4, T);
    // Capital & cornice crown
    R(c, hi, X + 2, Y + 1, T - 4, 4);
    R(c, '#1c232d', X + 3, Y + 5, T - 6, 2);
    // Fluted column shaft
    R(c, stone, X + 5, Y + 7, T - 10, 18);
    R(c, hi, X + 6, Y + 7, 3, 18);
    R(c, 'rgba(0,0,0,0.34)', X + 11, Y + 7, 2, 18);
    R(c, hi, X + 14, Y + 7, 4, 18);
    R(c, 'rgba(0,0,0,0.34)', X + 19, Y + 7, 2, 18);
    R(c, trim, X + 15, Y + 10, 2, 11);
    // Stepped plinth base
    R(c, hi, X + 3, Y + 25, T - 6, 3);
    R(c, '#1a2029', X + 2, Y + 28, T - 4, 4);
  } else if (code === 20) {
    // Weathered ancient stone ruin wall draped with moss & hanging roots (solid)
    R(c, '#202925', X, Y, T, T);
    R(c, '#47544c', X + 1, Y + 2, 14, 12); R(c, '#69786d', X + 1, Y + 2, 14, 2);
    R(c, '#3e4a43', X + 16, Y + 2, 15, 11); R(c, '#637368', X + 16, Y + 2, 15, 2);
    R(c, '#3a463f', X + 1, Y + 15, 19, 13); R(c, '#5c6b61', X + 1, Y + 15, 19, 1);
    R(c, '#49574e', X + 21, Y + 14, 10, 14); R(c, '#6a7a6f', X + 21, Y + 14, 10, 1);
    // Moss crown & creeping root tendrils
    if (atT(x, y - 1) !== 20) {
      R(c, '#3a7542', X, Y, T, 4);
      R(c, '#63b060', X + 2, Y, 11, 2);
      R(c, '#63b060', X + 17, Y + 1, 12, 2);
    }
    R(c, '#2e6336', X + 6 + ((x * 5) % 8), Y + 4, 3, 12);
    R(c, '#4f914c', X + 7 + ((x * 5) % 8), Y + 4, 1, 10);
    R(c, '#594230', X + 22, Y + 10, 2, 16);
    if (atT(x, y + 1) !== 20) R(c, 'rgba(0,0,0,0.45)', X, Y + T - 3, T, 3);
  }
}

function paintPortalAssemblyBase(c, map, pa, theme) {
  const { tx, ty, dir, assembly } = pa;
  const X = tx * T, Y = ty * T;
  const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
  const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;

  if (assembly === 'trail_exit') {
    // Extend natural packed-earth trail cleanly off the map boundary + place rustic trail marker posts
    const dirt = theme === 'wetland' ? 'rgba(116,96,68,0.68)' : theme === 'sky' || theme === 'wasteland' ? 'rgba(156,126,86,0.64)' : 'rgba(114,98,74,0.64)';
    const edge = theme === 'wetland' ? 'rgba(64,104,58,0.5)' : 'rgba(84,74,52,0.46)';
    for (let step = 0; step <= 2; step++) {
      const nx = tx + dx * step, ny = ty + dy * step;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      R(c, dirt, nx * T, ny * T, T, T);
      if (dx !== 0) {
        R(c, edge, nx * T, ny * T, T, 3);
        R(c, edge, nx * T, ny * T + T - 3, T, 3);
      } else {
        R(c, edge, nx * T, ny * T, 3, T);
        R(c, edge, nx * T + T - 3, ny * T, 3, T);
      }
    }
    // Weathered timber trail marker bollards framing the exit mouth
    if (dir === 'left' || dir === 'right') {
      const px = dir === 'left' ? X + 3 : X + T - 9;
      R(c, '#21170f', px, Y - 5, 6, 8); R(c, '#8c6b47', px + 1, Y - 4, 4, 5);
      R(c, '#21170f', px, Y + T - 3, 6, 8); R(c, '#8c6b47', px + 1, Y + T - 2, 4, 5);
    } else {
      const py = dir === 'up' ? Y + 2 : Y + T - 8;
      R(c, '#21170f', X - 5, py, 7, 7); R(c, '#8c6b47', X - 4, py + 1, 5, 5);
      R(c, '#21170f', X + T - 2, py, 7, 7); R(c, '#8c6b47', X + T - 1, py + 1, 5, 5);
    }
    return;
  }

  if (assembly === 'bridge_exit') {
    // Extend wooden boardwalk planks & railings seamlessly over edge water to the map boundary
    for (let step = 0; step <= 1; step++) {
      const nx = tx + dx * step, ny = ty + dy * step;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const BX = nx * T, BY = ny * T;
      R(c, '#1c140e', BX, BY, T, T);
      for (let px = 0; px < T; px += 6) {
        R(c, '#694a31', BX + px + 1, BY + 1, 5, T - 2);
        R(c, '#8e6644', BX + px + 1, BY + 1, 1, T - 2);
      }
      R(c, '#3d2a1c', BX, BY, T, 3); R(c, '#a8825b', BX, BY, T, 1);
      R(c, '#3d2a1c', BX, BY + T - 3, T, 3);
    }
    // Lantern piling posts at causeway entrance
    const px = dir === 'left' ? X + 2 : X + T - 7;
    R(c, '#24180f', px, Y - 6, 5, 9); R(c, '#ffd884', px + 1, Y - 5, 3, 3);
    R(c, '#24180f', px, Y + T - 3, 5, 9); R(c, '#ffd884', px + 1, Y + T - 2, 3, 3);
    return;
  }

  if (assembly === 'rail_gantry') {
    // Extend railway ballast & twin steel tracks seamlessly to the map boundary
    for (let step = 0; step <= 1; step++) {
      const nx = tx + dx * step, ny = ty + dy * step;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const RX = nx * T, RY = ny * T;
      R(c, 'rgba(32,36,42,0.65)', RX, RY + 2, T, T - 4);
      for (let sx = 2; sx < T; sx += 8) R(c, '#34271d', RX + sx, RY + 3, 4, T - 6);
      R(c, '#1c232b', RX, RY + 7, T, 4); R(c, '#9eb4c4', RX, RY + 8, T, 2);
      R(c, '#1c232b', RX, RY + 21, T, 4); R(c, '#9eb4c4', RX, RY + 22, T, 2);
    }
    // Steel gantry stanchions flanking the tracks
    const gx = dir === 'left' ? X + 2 : X + T - 8;
    R(c, '#141c24', gx, Y - 10, 6, 12); R(c, '#6a8296', gx + 1, Y - 9, 4, 10);
    R(c, '#141c24', gx, Y + T - 2, 6, 12); R(c, '#6a8296', gx + 1, Y + T - 1, 4, 10);
    return;
  }

  // Structural interior/wall-embedded assemblies: airlock, archway, cathedral_gate, elevator
  const trim = assembly === 'cathedral_gate' ? '#d4a8ff'
    : assembly === 'airlock' ? (theme === 'quarantine' ? '#f5b858' : '#72dce8')
    : assembly === 'elevator' ? '#ffe2a8'
    : '#9eb6c7';
  const frameDark = '#111720';
  const frameMid = assembly === 'cathedral_gate' ? '#363b52' : '#2d3b48';
  const frameHi = assembly === 'cathedral_gate' ? '#626a8f' : '#53687a';

  // Ground threshold plate on the portal tile itself
  R(c, 'rgba(10,16,22,0.55)', X + 2, Y + 2, T - 4, T - 4);
  R(c, frameHi, X + 2, Y + 2, T - 4, 2);
  R(c, frameHi, X + 2, Y + T - 4, T - 4, 2);
  if (assembly === 'airlock' || assembly === 'elevator') {
    for (let sx = 4; sx < T - 4; sx += 8) R(c, trim, X + sx, Y + T - 3, 4, 2);
  }

  // Recessed shadowed opening + flanking architectural jamb pilasters in the backing wall
  const wx = tx + dx, wy = ty + dy;
  if (wx >= 0 && wy >= 0 && wx < map.w && wy < map.h) {
    const WX = wx * T, WY = wy * T;
    if (dir === 'up') {
      // North wall portal: carve recessed threshold bay + twin jamb pilasters on left/right
      R(c, frameDark, WX + 2, WY + 4, T - 4, T - 4);
      R(c, '#060a10', WX + 6, WY + 8, T - 12, T - 8);
      // Left & right structural jamb pilasters extending into adjacent wall tiles
      R(c, frameDark, WX - 6, WY, 11, T); R(c, frameMid, WX - 5, WY + 2, 9, T - 2); R(c, frameHi, WX - 4, WY + 2, 2, T - 2);
      R(c, frameDark, WX + T - 5, WY, 11, T); R(c, frameMid, WX + T - 4, WY + 2, 9, T - 2); R(c, frameHi, WX + T - 3, WY + 2, 2, T - 2);
      // Cathedral gate gets grand triple-bay flanking buttresses
      if (assembly === 'cathedral_gate') {
        R(c, frameMid, WX - 18, WY + 2, 12, T - 2); R(c, trim, WX - 14, WY + 8, 2, T - 12);
        R(c, frameMid, WX + T + 6, WY + 2, 12, T - 2); R(c, trim, WX + T + 12, WY + 8, 2, T - 12);
      }
      R(c, trim, WX + 6, WY + 5, T - 12, 2);
    } else if (dir === 'down') {
      // South threshold passage: recessed stone/steel stair landing cutting into south parapet
      R(c, frameDark, WX + 2, WY, T - 4, T - 6);
      R(c, '#090e14', WX + 6, WY, T - 12, T - 10);
      R(c, frameMid, WX - 4, WY, 8, T - 4); R(c, frameHi, WX - 3, WY, 2, T - 4);
      R(c, frameMid, WX + T - 4, WY, 8, T - 4); R(c, frameHi, WX + T - 3, WY, 2, T - 4);
      R(c, trim, WX + 7, WY + 2, T - 14, 2);
    } else if (dir === 'right' || dir === 'left') {
      // East/West wall-mounted airlock or stone archway cut into side wall
      const rx = dir === 'right' ? WX : WX + 8;
      R(c, frameDark, rx, WY - 4, T - 8, T + 8);
      R(c, '#060a10', rx + 3, WY + 3, T - 14, T - 6);
      // Upper & lower masonry jamb piers
      R(c, frameMid, WX + 1, WY - 6, T - 2, 9); R(c, frameHi, WX + 2, WY - 5, T - 4, 2);
      R(c, frameMid, WX + 1, WY + T - 3, T - 2, 9); R(c, frameHi, WX + 2, WY + T - 2, T - 4, 2);
      // Luminous bulkhead status strip
      const stripX = dir === 'right' ? WX + 2 : WX + T - 5;
      R(c, trim, stripX, WY + 5, 3, T - 10);
    }
  }
}

function paintPortalAssemblyOver(c, map, pa, theme) {
  const { tx, ty, dir, assembly } = pa;
  const X = tx * T, Y = ty * T;
  if (assembly === 'rail_gantry') {
    // Overhead steel railway signal gantry beam spanning above the tracks (depth occlusion!)
    const gx = dir === 'left' ? X + 1 : X + T - 9;
    R(c, 'rgba(0,0,0,0.45)', gx - 1, Y - 14, 10, 6);
    R(c, '#25323e', gx, Y - 15, 8, 5);
    R(c, '#8ba3b8', gx + 1, Y - 15, 6, 1);
    R(c, '#7dffb0', gx + 2, Y - 13, 4, 2);
    return;
  }
  if (assembly === 'cathedral_gate' && dir === 'up') {
    // Monumental overhead archivolt cornice beam above the north cathedral gate
    R(c, '#151926', X - 14, Y - 38, T + 28, 10);
    R(c, '#495275', X - 12, Y - 37, T + 24, 7);
    R(c, '#d4a8ff', X - 6, Y - 34, T + 12, 2);
  } else if ((assembly === 'airlock' || assembly === 'archway') && dir === 'up') {
    // Overhead reinforced lintel header spanning the north doorway jambs
    const accent = assembly === 'airlock' ? (theme === 'quarantine' ? '#f5b858' : '#72dce8') : '#9eb6c7';
    R(c, '#111821', X - 6, Y - 34, T + 12, 7);
    R(c, '#3a4c5c', X - 5, Y - 33, T + 10, 4);
    R(c, accent, X + 6, Y - 31, T - 12, 2);
  }
}

export function bakeMap(map, mission) {
  const cv = document.createElement('canvas'); cv.width = map.w * T; cv.height = map.h * T;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled=false;
  const palette=mission.environmentArt||null;
  const at = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? 0 : map.grid[y * map.w + x];
  const tLayer = Array.isArray(mission.terrainLayer) && mission.terrainLayer.length === map.w * map.h ? mission.terrainLayer : null;
  const atT = (x, y) => (!tLayer || x < 0 || y < 0 || x >= map.w || y >= map.h) ? 0 : tLayer[y * map.w + x];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const g = at(x, y);
    const tc = tLayer ? atT(x, y) : 0;
    const solidOverride = tc === 2 || tc === 8 || tc === 9 || tc === 12 || tc === 13 || (tc >= 16 && tc <= 20);
    // ONLY an owner-private selected 32x32 map palette replaces a default
    // schematic tile. Original Ghost Signal missions retain their renderer.
    if (g === 2) {
      if(palette?.floor){
        c.drawImage(palette.floor,x*T,y*T);
        // Subtle deterministic multi-tile patina breaks up tile grid repetition
        const macro = (hsh(x >> 1, y >> 1, 17) + hsh((x + 1) >> 1, y >> 1, 31)) * 0.5;
        if (macro > 0.62) R(c, `rgba(255,245,220,${((macro - 0.62) * 0.14).toFixed(3)})`, x * T, y * T, T, T);
        else if (macro < 0.36) R(c, `rgba(0,0,0,${((0.36 - macro) * 0.28).toFixed(3)})`, x * T, y * T, T, T);
        if (hsh(x, y, 47) > 0.86) {
          const cx0 = x * T + 5 + Math.floor(hsh(x, y, 48) * 18), cy0 = y * T + 5 + Math.floor(hsh(x, y, 49) * 18);
          R(c, 'rgba(0,0,0,0.32)', cx0, cy0, 5, 1); R(c, 'rgba(0,0,0,0.24)', cx0 + 4, cy0 + 1, 3, 1);
        }
      }
      else floor(c, x, y, at(x, y - 1) === 1);
    }else if (g === 1 && !solidOverride) {
      if(palette?.wall){
        c.drawImage(palette.wall,x*T,y*T);
        const X = x * T, Y = y * T;
        if (at(x, y + 1) !== 2) {
          // Wall roof / upper cap tile: darker top mass with crisp Sea-of-Stars edge lips
          R(c, 'rgba(4,8,14,0.48)', X, Y, T, T);
          if (at(x, y - 1) === 2) { R(c, 'rgba(215,235,245,0.24)', X, Y, T, 2); R(c, 'rgba(0,0,0,0.32)', X, Y + 2, T, 2); }
          if (at(x - 1, y) === 2) { R(c, 'rgba(215,235,245,0.22)', X, Y, 2, T); }
          if (at(x + 1, y) === 2) { R(c, 'rgba(0,0,0,0.35)', X + T - 2, Y, 2, T); }
        } else {
          // Exposed south-facing vertical wall face: luminous top lip + grounded floor contact seam
          R(c, 'rgba(240,248,255,0.16)', X, Y, T, 2);
          R(c, 'rgba(0,0,0,0.34)', X, Y + T - 3, T, 3);
        }
      }
      else if (at(x, y + 1) === 2) wallFace(c, x, y);
      else wallTop(c, x, y, at);
    }
    if (tc > 0) paintCampaignTerrainCell(c, tc, x, y, atT, mission.campaignTheme);
  }
  paintCampaignEnvironmentDetails(c,mission.environmentDetails,'ground');
  // Soft directional ambient occlusion & top-left wall cast shadows onto adjacent floors
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (at(x, y) === 2) {
    const X = x * T, Y = y * T;
    const northSolid = at(x, y - 1) === 1 && atT(x, y - 1) !== 2;
    if (palette && northSolid) {
      R(c, 'rgba(0,0,0,0.46)', X, Y, T, 4);
      R(c, 'rgba(0,0,0,0.24)', X, Y + 4, T, 5);
      R(c, 'rgba(0,0,0,0.10)', X, Y + 9, T, 5);
    }
    if (at(x - 1, y) !== 2 && atT(x - 1, y) !== 2) { R(c, 'rgba(0,0,0,.32)', X, Y, 3, T); R(c, 'rgba(0,0,0,.15)', X + 3, Y, 4, T); }
    if (at(x + 1, y) !== 2 && atT(x + 1, y) !== 2) { R(c, 'rgba(0,0,0,.32)', X + T - 3, Y, 3, T); R(c, 'rgba(0,0,0,.15)', X + T - 7, Y, 4, T); }
    if (at(x, y + 1) !== 2 && atT(x, y + 1) !== 2) { R(c, 'rgba(0,0,0,.3)', X, Y + T - 3, T, 3); R(c, 'rgba(0,0,0,.14)', X, Y + T - 7, T, 4); }
  }
  paintCampaignEnvironmentDetails(c,mission.environmentDetails,'background');
  if (Array.isArray(mission.portalAssemblies) && mission.portalAssemblies.length) {
    for (const pa of mission.portalAssemblies) paintPortalAssemblyBase(c, map, pa, mission.campaignTheme);
  }
  const draw = { machine, crate, debris, cable, hazard, rack };
  for (const p of mission.props) if (p.solid) { R(c, 'rgba(0,0,0,.34)', p.x * T + 5, (p.y + (p.h || 1)) * T - 1, (p.w || 1) * T - 2, 5); R(c, 'rgba(0,0,0,.2)', (p.x + (p.w || 1)) * T - 1, p.y * T + 8, 4, (p.h || 1) * T - 6); }
  for (const p of mission.props) draw[p.t](c, p);
  return cv;
}

// Foreground layer drawn above characters: overhead conduits and hanging cables (depth / layered scenery).
export function bakeOver(map, mission=null) {
  const cv = document.createElement('canvas'); cv.width = map.w * T; cv.height = map.h * T; const c = cv.getContext('2d');
  // Never paint generic Ghost Signal overhead conduits across real owner
  // wasteland, shelter or ruins terrain. Keep original demo byte-for-byte
  // visually unchanged; explicit private foreground art takes its place.
  if(!mission?.environmentArt){
  const at = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? 0 : map.grid[y * map.w + x];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const X = x * T, Y = y * T;
    if (at(x, y) === 2 && y % 6 === 2 && hsh(y, 3, 5) > .25) { // overhead conduit run
      R(c, 'rgba(4,6,8,.5)', X, Y + 9, T, 6); R(c, 'rgba(70,90,100,.22)', X, Y + 9, T, 1); R(c, 'rgba(0,0,0,.16)', X, Y + 15, T, 4);
      if (x % 3 === 0) { R(c, 'rgba(4,6,8,.62)', X + 12, Y + 7, 5, 10); R(c, 'rgba(110,101,55,.3)', X + 12, Y + 7, 5, 1); }
    }
    if (at(x, y) === 1 && at(x, y + 1) === 2 && hsh(x, y, 41) > .8) { // cable drooping from a wall face
      const len = 14 + hsh(x, y, 42) * 22, ox = 6 + hsh(x, y, 43) * 18;
      for (let i = 0; i < len; i++) R(c, 'rgba(5,6,8,.85)', X + ox + Math.round(Math.sin(i / 6 + x) * 2), Y + 26 + i, 1, 1);
      R(c, 'rgba(122,43,43,.9)', X + ox + Math.round(Math.sin(len / 6 + x) * 2), Y + 26 + len, 2, 2);
    }
    if (at(x, y) === 1 && at(x, y - 1) === 2) R(c, 'rgba(0,0,0,.28)', X, Y - 4, T, 4); // lower wall lip shades the floor above it
  }
  }
  paintCampaignEnvironmentDetails(c,mission?.environmentDetails,'foreground');
  if (Array.isArray(mission?.portalAssemblies) && mission.portalAssemblies.length) {
    for (const pa of mission.portalAssemblies) paintPortalAssemblyOver(c, map, pa, mission.campaignTheme);
  }
  return cv;
}
// Parallax under-structure seen through the void around rooms.
export function bakeDeep() {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  R(c, '#030507', 0, 0, S, S);
  for (let i = 0; i < 4; i++) { R(c, '#070b0f', 0, 20 + i * 64, S, 9); R(c, '#0b1116', 0, 20 + i * 64, S, 1); R(c, '#070b0f', 30 + i * 64, 0, 7, S); R(c, '#0b1116', 30 + i * 64, 0, 1, S); }
  for (let i = 0; i < S; i += 2) { R(c, '#060a0d', i, (i * 2 + 40) % S, 2, 2); R(c, '#060a0d', S - i, (i * 2 + 104) % S, 2, 2); }
  for (let i = 0; i < 22; i++) { const x = hsh(i, 1, 2) * S, y = hsh(i, 2, 3) * S; R(c, '#0a1014', x, y, 10 + hsh(i, 3) * 26, 3); R(c, i % 5 ? '#101a20' : '#3a1512', x + 2, y + 1, 2, 1); }
  return cv;
}
// Soft drifting haze texture (drawn additively at very low alpha).
export function bakeFog() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d');
  for (let i = 0; i < 26; i++) for (const ox of [0, -256, 256]) {
    const x = hsh(i, 5) * 256 + ox, y = hsh(i, 6) * 128, r = 22 + hsh(i, 7) * 40, g = c.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, 'rgba(150,180,190,.5)'); g.addColorStop(1, 'rgba(150,180,190,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return cv;
}

function roman(c, x, y, n, col) { for (let i = 0; i < n; i++) R(c, col, x + i * 3, y, 2, 7); R(c, col, x - 1, y, n * 3 + 1, 1); R(c, col, x - 1, y + 6, n * 3 + 1, 1); }

export function drawLamp(c, l, on, k) {
  const X = l.x * T + 12, Y = l.y * T + 10;
  R(c, '#15170f', X - 1, Y - 1, 10, 7); R(c, on ? `rgba(255,${60 + k * 40 | 0},40,${.5 + k * .5})` : '#3a1512', X, Y, 8, 5);
}

const WORLD_SPRITES = new Map();
function campaignWorldSprite(artId) {
  if (!artId || typeof Image === 'undefined') return null;
  let rec = WORLD_SPRITES.get(artId);
  if (!rec) {
    const img = new Image();
    rec = { img, ok: false };
    img.onload = () => { rec.ok = img.naturalWidth >= 144 && img.naturalHeight >= 64; };
    img.onerror = () => { rec.ok = false; };
    img.src = new URL(`../../assets/aeon/assets/world/${artId}.png`, import.meta.url).href;
    WORLD_SPRITES.set(artId, rec);
  }
  return rec.ok ? rec.img : null;
}

export function drawEntity(c, e, g) {
  const X = e.tx * T, Y = e.ty * T, W = (e.w || 1) * T, H = (e.h || 1) * T, t = g.time, f = g.flags;
  // Native original owner artwork (32x64 / 64x64 / 96x64 etc.) is anchored
  // at the source portal feet, never stretched or replaced by a generic icon.
  if(e.portalId&&e.artImages){
    const img=e.open>.5?e.artImages.open:e.artImages.closed;
    const w=img?.naturalWidth??img?.width,h=img?.naturalHeight??img?.height;
    if(w>0&&h>0){
      c.imageSmoothingEnabled=false;
      // Align side-profile airlocks/arches flush with their east/west wall,
      // and front-facing doors / ground thresholds anchored cleanly at tile base.
      const dx=w===32&&e.portalDir==='right'?X+T-w:w===32&&e.portalDir==='left'?X:X+16-w/2;
      const dy=h===32?Y:Y+32-h;
      c.drawImage(img,Math.round(dx),Math.round(dy));
      return;
    }
  }
  if (e.artId && e.type === 'npc') {
    const sheet = campaignWorldSprite(e.artId);
    if (sheet) {
      const fw = Math.floor(sheet.naturalWidth / 9);
      const fh = Math.floor(sheet.naturalHeight / 4);
      const dirRow = { down: 0, left: 1, right: 2, up: 3 }[e.dir || 'down'] ?? 0;
      const idleCol = Math.floor(t * 2.2 + e.tx) % 4 === 0 ? 1 : 0;
      const drawW = Math.min(48, fw);
      const drawH = Math.round((drawW / fw) * fh);
      const isHuman = fw === 32 && fh === 56;
      c.fillStyle = 'rgba(0,0,0,0.38)';
      c.fillRect(X + (isHuman ? 9 : 6), Y + 26, isHuman ? 14 : 20, 3);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(X + (isHuman ? 7 : 4), Y + 27, isHuman ? 18 : 24, 2);
      c.imageSmoothingEnabled = false;
      c.drawImage(sheet, idleCol * fw, dirRow * fh, fw, fh,
        Math.round(X + 16 - drawW / 2), Math.round(Y + 29 - drawH), drawW, drawH);
      return;
    }
  }
  switch (e.type) {
    case 'save': {
      const pulse = 0.55 + 0.45 * Math.sin(t * 3.2);
      R(c, 'rgba(0,0,0,0.42)', X + 3, Y + 26, 26, 5);
      R(c, '#121922', X + 4, Y - 6, 24, 34);
      R(c, '#2b3b4e', X + 5, Y - 5, 22, 32);
      R(c, '#47617a', X + 6, Y - 4, 20, 2);
      R(c, '#0b1824', X + 8, Y, 16, 13);
      R(c, `rgba(114,220,232,${pulse.toFixed(2)})`, X + 10, Y + 2, 12, 9);
      R(c, '#e6fcff', X + 13, Y + 5, 6, 3);
      R(c, '#1b2633', X + 7, Y + 16, 18, 10);
      R(c, `rgba(242,189,117,${(0.5 + 0.5 * Math.cos(t * 4)).toFixed(2)})`, X + 14, Y + 19, 4, 3);
      break;
    }
    case 'pod': {
      const awake = e.awake || f.protagonist_awake;
      const glow = awake ? 0.65 + 0.35 * Math.sin(t * 2.5) : 0.25;
      R(c, 'rgba(0,0,0,0.45)', X + 2, Y + 26, 28, 5);
      R(c, '#141c24', X + 4, Y - 14, 24, 42);
      R(c, '#2f3e4f', X + 5, Y - 13, 22, 40);
      R(c, '#0b151e', X + 8, Y - 8, 16, 28);
      R(c, `rgba(114,220,232,${glow.toFixed(2)})`, X + 10, Y - 5, 12, 22);
      R(c, 'rgba(210,248,255,0.4)', X + 11, Y - 3, 2, 16);
      R(c, '#4b5a68', X + 6, Y + 22, 20, 4);
      break;
    }
    case 'bench': {
      R(c, 'rgba(0,0,0,0.35)', X + 2, Y + 24, 28, 5);
      R(c, '#2d231c', X + 3, Y + 10, 26, 14);
      R(c, '#6a4b35', X + 4, Y + 11, 24, 5);
      R(c, '#835e44', X + 4, Y + 11, 24, 1);
      R(c, '#4f3828', X + 4, Y + 18, 24, 4);
      R(c, '#1d242c', X + 5, Y + 22, 3, 5);
      R(c, '#1d242c', X + 24, Y + 22, 3, 5);
      break;
    }
    case 'puzzle': case 'switch': {
      const done = e.done || (e.doneFlag && f[e.doneFlag]);
      R(c, 'rgba(0,0,0,0.38)', X + 4, Y + 26, 24, 4);
      R(c, '#151c22', X + 5, Y + 4, 22, 25);
      R(c, '#34414e', X + 6, Y + 5, 20, 23);
      R(c, '#10161d', X + 9, Y + 8, 14, 10);
      R(c, done ? '#7dffb0' : `rgba(242,189,117,${(0.6 + 0.4 * Math.sin(t * 4)).toFixed(2)})`, X + 11, Y + 10, 10, 6);
      R(c, '#5d6b78', X + 10, Y + 21, 12, 3);
      break;
    }
    case 'note': {
      R(c, 'rgba(0,0,0,0.3)', X + 8, Y + 22, 16, 4);
      R(c, '#29241c', X + 8, Y + 11, 16, 13);
      R(c, '#c7b590', X + 10, Y + 13, 12, 9);
      R(c, '#685942', X + 11, Y + 15, 9, 1);
      R(c, '#685942', X + 11, Y + 18, 7, 1);
      break;
    }
    case 'crate': {
      R(c, 'rgba(0,0,0,0.38)', X + 3, Y + 26, 26, 5);
      R(c, '#262018', X + 4, Y + 5, 24, 24);
      R(c, '#493c2e', X + 5, Y + 6, 22, 12);
      R(c, '#362c21', X + 5, Y + 18, 22, 10);
      R(c, '#5b4b3a', X + 5, Y + 6, 22, 1);
      R(c, '#72dce8', X + 14, Y + 11, 4, 2);
      break;
    }
    case 'terminal': {
      R(c, '#15170f', X + 2, Y + 1, 28, 30); R(c, '#3b3f2c', X + 3, Y + 2, 26, 18); R(c, '#2a2d20', X + 3, Y + 20, 26, 10);
      R(c, '#03140b', X + 6, Y + 4, 20, 13);
      const fl = Math.sin(t * 9 + e.tx) > -.9 ? 1 : .4;
      for (let i = 0; i < 4; i++) R(c, `rgba(125,255,176,${fl * (i === ((t * 2 | 0) % 4) ? 1 : .6)})`, X + 8, Y + 6 + i * 3, 6 + ((e.tx * 7 + i * 5) % 10), 1);
      if ((t * 2 | 0) % 2) R(c, '#7dffb0', X + 22, Y + 14, 2, 2);
      for (let i = 0; i < 5; i++) R(c, '#6e6537', X + 6 + i * 4, Y + 23, 3, 2); R(c, '#5a3220', X + 24, Y + 27, 3, 1);
      break;
    }
    case 'pad': {
      const on = g.onEnt(e, g.player);
      R(c, '#15170f', X + 2, Y + 2, 28, 28); R(c, '#3b3f2c', X + 3, Y + 3, 26, 26); R(c, '#11161a', X + 6, Y + 6, 20, 20);
      const k = on ? 1 : .35 + .25 * Math.sin(t * 3);
      for (let i = 0; i < 3; i++) R(c, `rgba(255,176,32,${k})`, X + 9 + i * 2, Y + 9 + i * 5, 14 - i * 4, 2);
      R(c, `rgba(255,176,32,${k})`, X + 15, Y + 8, 2, 14);
      break;
    }
    case 'plate': {
      const on = g.plateT > 0;
      R(c, '#4b5038', X + 3, Y + 3, 26, 26); R(c, '#1a2024', X + 5, Y + (on ? 6 : 5), 22, 22); R(c, '#2a353b', X + 5, Y + (on ? 6 : 5), 22, 1);
      [[6, 6], [24, 6], [6, 24], [24, 24]].forEach(([a, b]) => R(c, on ? '#7dffb0' : '#6b4a12', X + a, Y + b, 2, 2));
      roman(c, X + 12, Y + 12, 1, on ? '#7dffb0' : '#6e6537'); R(c, on ? '#7dffb0' : '#6e6537', X + 16, Y + 12, 1, 7); R(c, on ? '#7dffb0' : '#6e6537', X + 18, Y + 18, 1, 1); R(c, on ? '#7dffb0' : '#6e6537', X + 20, Y + 12, 1, 7); R(c, on ? '#7dffb0' : '#6e6537', X + 17, Y + 16, 1, 3); R(c, on ? '#7dffb0' : '#6e6537', X + 19, Y + 16, 1, 3);
      break;
    }
    case 'cell': {
      R(c, '#15170f', X + 11, Y + 9, 10, 15); R(c, '#6e6537', X + 12, Y + 10, 8, 13); R(c, '#8a7f49', X + 12, Y + 10, 2, 13); R(c, '#5a3220', X + 16, Y + 17, 3, 2);
      R(c, Math.sin(t * 6) > 0 ? '#7dffb0' : '#2f6b4a', X + 15, Y + 12, 2, 3);
      break;
    }
    case 'gen': {
      R(c, '#15170f', X + 1, Y + 1, W - 2, H - 2); R(c, '#4b5038', X + 2, Y + 2, W - 4, 12); R(c, '#2a2d20', X + 2, Y + 14, W - 4, 16);
      R(c, '#0d0e0a', X + 8, Y + 16, 14, 12);
      if (f.cellIn) { R(c, '#6e6537', X + 11, Y + 17, 8, 10); R(c, '#7dffb0', X + 14, Y + 19, 2, 3); }
      for (let i = 0; i < 5; i++) R(c, f.power ? (((t * 6 | 0) + i) % 5 < 3 ? '#7dffb0' : '#2f6b4a') : '#3a1512', X + 28 + i * 6, Y + 18, 4, 3);
      for (let k = 0; k < 6; k++) R(c, '#0d0e0a', X + 28 + k * 5, Y + 24, 3, 4);
      R(c, '#6e6537', X + 4, Y + 5, W - 8, 3); R(c, '#8a7f49', X + 4, Y + 5, W - 8, 1);
      break;
    }
    case 'breaker': case 'lever': {
      const on = e.type === 'lever' ? f.lever : (f.seq || []).includes(e.n) || f.power;
      R(c, '#15170f', X + 5, Y + 1, 22, 30); R(c, '#3b3f2c', X + 6, Y + 2, 20, 28); R(c, '#0d0e0a', X + 14, Y + 10, 4, 14);
      R(c, e.type === 'lever' ? '#8a1a26' : '#8a7f49', X + 11, Y + (on ? 20 : 9), 10, 5); R(c, '#15170f', X + 11, Y + (on ? 24 : 13), 10, 1);
      R(c, on ? '#7dffb0' : '#3a1512', X + 22, Y + 4, 2, 2);
      if (e.type === 'breaker') roman(c, X + 8, Y + 4, e.n, '#c9b860');
      break;
    }
    case 'door': {
      const h = Math.round(H * (1 - e.open));
      R(c, '#15170f', X + 8, Y - 2, 16, 3); R(c, '#15170f', X + 8, Y + H - 1, 16, 3);
      if (h > 0) {
        R(c, '#15170f', X + 9, Y, 14, h); R(c, '#4b5038', X + 11, Y, 10, h - 1); R(c, '#5a6044', X + 11, Y, 1, h - 1);
        for (let i = 4; i < h - 4; i += 8) R(c, i % 16 ? '#85752c' : '#2a2d20', X + 13, Y + i, 6, 3);
      }
      R(c, e.open > .5 ? '#7dffb0' : '#b02a20', X + 14, Y - 2, 4, 2);
      break;
    }
    case 'exit': case 'hatch': {
      R(c, '#15170f', X + 4, Y, W - 4, H); R(c, '#39413f', X + 8, Y + 3, W - 10, H - 6); R(c, '#4a5553', X + 8, Y + 3, 1, H - 6);
      R(c, '#15170f', X + 8, Y + H / 2 - 1, W - 10, 2);
      for (let i = 8; i < H - 8; i += 10) R(c, '#85752c', X + 14, Y + i, 10, 2);
      const col = e.type === 'exit' ? (f.power ? '#7dffb0' : (Math.sin(t * 2) > .6 ? '#b02a20' : '#3a1512')) : '#3a1512';
      R(c, col, X + (e.type === 'exit' ? 4 : W - 4), Y + 6, 3, H - 12);
      break;
    }
    case 'bulkhead': {
      R(c, '#0a0b0c', X, Y + 2, W, H - 2); R(c, '#2e2a26', X + 3, Y + 4, W - 6, H - 8); R(c, '#3d3833', X + 3, Y + 4, W - 6, 1);
      R(c, '#0a0b0c', X + W / 2 - 1, Y + 4, 2, H - 8);
      for (let px = 5; px < W - 5; px++) for (let py = 22; py < 26; py++) if (hsh(px, py, e.tx) > .35) R(c, ((px + py) >> 2) % 2 ? '#85752c' : '#15171a', X + px, Y + py, 1, 1);
      [8, 20, W - 22, W - 10].forEach(bx => R(c, '#57504a', X + bx, Y + 8, 3, 3));
      R(c, '#c9b860', X + W / 2 - 9, Y + 9, 5, 9); R(c, '#2e2a26', X + W / 2 - 7, Y + 11, 1, 5);
      R(c, `rgba(255,176,32,${.35 + .35 * Math.sin(t * 1.3)})`, X + W / 2 + 6, Y + 10, 3, 3);
      break;
    }
    case 'locker': {
      R(c, '#15170f', X + 2, Y, 28, 31); R(c, '#3b3f2c', X + 3, Y + 1, 26, 2); R(c, '#3b3f2c', X + 3, Y + 1, 3, 29); R(c, '#3b3f2c', X + 26, Y + 1, 3, 29);
      R(c, '#050607', X + 6, Y + 3, 20, 27);
      for (let i = 0; i < 5; i++) R(c, i % 2 ? '#85752c' : '#15171a', X + 6 + i * 4, Y + 28, 4, 2);
      if (g.player.hidden === e) { R(c, '#ff3b30', X + 12, Y + 9, 2, 1); R(c, '#ff3b30', X + 17, Y + 9, 2, 1); R(c, '#7a1410', X + 15, Y + 17, 2, 3); R(c, '#2a2a30', X + 11, Y + 6, 9, 1); }
      break;
    }
    case 'clue': {
      const bl = !e.done && (t * 3 | 0) % 2, mk = e.done ? '#2f6b4a' : '#ff3b30';
      if (e.kind === 'machine') {
        R(c, '#15170f', X + 2, Y + 2, 28, 29); R(c, '#3b3f2c', X + 3, Y + 3, 26, 14); R(c, '#2a2d20', X + 3, Y + 17, 26, 13);
        R(c, '#07090a', X + 8, Y + 7, 14, 9); R(c, '#7a2b2b', X + 10, Y + 9, 1, 9); R(c, '#2b5a6a', X + 14, Y + 9, 1, 12); R(c, '#85752c', X + 18, Y + 9, 1, 7);
        R(c, '#5a3220', X + 5, Y + 20, 6, 3); R(c, '#6b3a22', X + 20, Y + 24, 5, 2);
        if ((t * 9 + e.tx | 0) % 7 === 0) R(c, '#fff3c0', X + 9 + hsh(t * 9 | 0, e.tx) * 10, Y + 8 + hsh(e.ty, t * 9 | 0) * 6, 2, 2);
        R(c, e.done ? '#7dffb0' : e.scanned ? (bl ? '#ff3b30' : '#7a1410') : '#3a1512', X + 24, Y + 5, 2, 2);
      } else if (e.kind === 'signal') {
        const k = e.done ? .3 : .5 + .5 * Math.sin(t * 5), col = `rgba(125,255,176,${k})`;
        for (let i = 0; i < 3; i++) { const s = 4 + i * 5 + (e.done ? 0 : (t * 6 | 0) % 3); R(c, col, X + 16 - s, Y + 16 - s, s * 2, 1); R(c, col, X + 16 - s, Y + 16 + s, s * 2 + 1, 1); R(c, col, X + 16 - s, Y + 16 - s, 1, s * 2); R(c, col, X + 16 + s, Y + 16 - s, 1, s * 2); }
        R(c, '#7dffb0', X + 15, Y + 15, 2, 2);
      } else {
        const col = e.done ? '#4a5258' : '#9aa3aa';
        [[8, 8], [15, 14], [9, 20], [17, 25]].forEach(([a, b], i) => { R(c, col, X + a, Y + b, 4, 2); R(c, col, X + a + (i % 2 ? -1 : 1), Y + b + 2, 3, 2); });
        if (!e.done) { R(c, bl ? mk : '#7a1410', X + 3, Y + 3, 5, 1); R(c, bl ? mk : '#7a1410', X + 3, Y + 3, 1, 5); R(c, bl ? mk : '#7a1410', X + 24, Y + 28, 5, 1); R(c, bl ? mk : '#7a1410', X + 28, Y + 24, 1, 5); }
      }
      break;
    }
    case 'projector': {
      const on = g.echo && g.echo.id === e.id, k = on ? 1 : .4 + .2 * Math.sin(t * 2);
      R(c, '#15170f', X + 5, Y + 6, 22, 25); R(c, '#3b3f2c', X + 6, Y + 7, 20, 10); R(c, '#2a2d20', X + 6, Y + 17, 20, 13);
      R(c, '#0d0e0a', X + 10, Y + 9, 12, 6); R(c, `rgba(255,190,90,${k})`, X + 12, Y + 10, 8, 4); R(c, '#6e6537', X + 8, Y + 21, 16, 2);
      for (let i = 0; i < 3; i++) R(c, on && ((t * 8 | 0) + i) % 3 === 0 ? '#ffbe5a' : '#6b4a12', X + 9 + i * 5, Y + 25, 3, 2);
      break;
    }
    case 'jet': {
      const s = g.jetState(e);
      R(c, '#0c1012', X + 9, Y + 9, 14, 14); R(c, '#3b3f2c', X + 9, Y + 9, 14, 1); R(c, '#3b3f2c', X + 9, Y + 22, 14, 1); R(c, '#3b3f2c', X + 9, Y + 9, 1, 14); R(c, '#3b3f2c', X + 22, Y + 9, 1, 14);
      R(c, s ? '#85752c' : '#2a2d20', X + 14, Y + 14, 4, 4);
      if (s) for (let i = 0; i < (s === 2 ? 14 : 3); i++) { const q = (t * 12 | 0) + i * 7; R(c, `rgba(220,230,235,${s === 2 ? .25 + hsh(q, i) * .5 : .3})`, X + 4 + hsh(q, e.tx + i) * (s === 2 ? 22 : 12) + (s === 2 ? 0 : 6), Y + (s === 2 ? -6 : 8) + hsh(e.ty + i, q) * (s === 2 ? 30 : 10), 3 + (i % 3), 3 + (i % 2)); }
      break;
    }
    case 'steamwall': {
      R(c, '#3b3f2c', X + 12, Y, 8, 3); R(c, '#3b3f2c', X + 12, Y + H - 3, 8, 3);
      if (g.m.blocked(e, g)) for (let i = 0; i < 46; i++) { const q = (t * 14 | 0) + i * 5; R(c, `rgba(220,230,235,${.2 + hsh(q, i) * .5})`, X - 4 + hsh(q, i + 3) * (W + 2), Y + hsh(i, q) * (H - 4), 4 + (i % 4), 3 + (i % 3)); }
      break;
    }
    case 'lens': {
      const off = e.offT > t;
      R(c, '#15170f', X + 11, Y + 4, 10, 26); R(c, '#3b3f2c', X + 12, Y + 5, 8, 24); R(c, '#15170f', X + 7, Y + 6, 18, 12); R(c, '#4d5136', X + 8, Y + 7, 16, 10);
      const a = e.ang === undefined ? e.base : e.ang, lx = Math.round(Math.cos(a) * 4), ly = Math.round(Math.sin(a) * 2);
      R(c, '#0d0e0a', X + 12 + lx, Y + 9 + ly, 8, 6); R(c, off ? '#1c1e15' : e.al > 0 ? '#ff5a1f' : '#ffb020', X + 13 + lx, Y + 10 + ly, 6, 4);
      if (off && (t * 10 | 0) % 3 === 0) R(c, '#fff3c0', X + 9 + hsh(t * 10 | 0, 2) * 12, Y + 6 + hsh(3, t * 10 | 0) * 8, 2, 2);
      break;
    }
    case 'valve': {
      const on = (f.v || [])[e.n - 1];
      R(c, '#15170f', X + 4, Y + 1, 24, 30); R(c, '#3b3f2c', X + 5, Y + 2, 22, 28); R(c, '#6e6537', X, Y + 20, 32, 5); R(c, '#8a7f49', X, Y + 20, 32, 1);
      R(c, '#0d0e0a', X + 9, Y + 7, 14, 14);
      if (on) { R(c, '#b02a36', X + 15, Y + 8, 2, 12); R(c, '#b02a36', X + 10, Y + 13, 12, 2); } else for (let i = 0; i < 11; i++) { R(c, '#8a1a26', X + 10 + i, Y + 8 + i, 2, 2); R(c, '#8a1a26', X + 20 - i, Y + 8 + i, 2, 2); }
      R(c, '#c9b860', X + 15, Y + 13, 2, 2); R(c, f.vent ? '#7dffb0' : on ? '#ffb020' : '#3a1512', X + 23, Y + 4, 2, 2); roman(c, X + 7, Y + 23, e.n, '#15170f');
      break;
    }
    case 'sensor': {
      const safe = (f.safe || []).includes(e.k), bad = e.badT > t;
      R(c, bad ? '#b02a20' : safe ? '#2f6b4a' : '#2c383d', X + 3, Y + 3, 26, 1); R(c, bad ? '#b02a20' : safe ? '#2f6b4a' : '#2c383d', X + 3, Y + 28, 26, 1);
      R(c, bad ? '#b02a20' : safe ? '#2f6b4a' : '#2c383d', X + 3, Y + 3, 1, 26); R(c, bad ? '#b02a20' : safe ? '#2f6b4a' : '#2c383d', X + 28, Y + 3, 1, 26);
      R(c, bad ? '#ff5a1f' : safe ? '#7dffb0' : '#3a474f', X + 15, Y + 15, 2, 2);
      break;
    }
    case 'item': {
      R(c, '#15170f', X + 7, Y + 14, 18, 16); R(c, '#3b3f2c', X + 8, Y + 15, 16, 5); R(c, '#2a2d20', X + 8, Y + 20, 16, 9);
      R(c, '#15170f', X + 11, Y + 3, 10, 13); R(c, '#6e6537', X + 12, Y + 4, 8, 11); R(c, '#8a7f49', X + 12, Y + 4, 2, 11); R(c, '#4f6b5c', X + 12, Y + 8, 8, 2);
      R(c, `rgba(255,190,90,${.5 + .5 * Math.sin(t * 4)})`, X + 15, Y + 5, 2, 2);
      break;
    }
    case 'grate': {
      R(c, '#0c1012', X + 3, Y + 3, 26, 26);
      for (let i = 5; i < 27; i += 4) R(c, '#3a474f', X + 4 + (i % 8 ? 0 : 1), Y + i, 24, 2);
      R(c, '#5a3220', X + 3, Y + 3, 3, 3); R(c, '#85752c', X + 25, Y + 25, 3, 3);
      break;
    }
    case 'npc': {
      const sw = Math.round(Math.sin(t * 1.1) * 1), bx = X + 6 + sw, by = Y - 16, k = .55 + .45 * Math.sin(t * 1.7);
      R(c, 'rgba(0,0,0,.45)', X + 6, Y + 27, 20, 4);
      R(c, '#1d2a26', bx + 4, by + 12, 12, 24); R(c, '#4f6b5c', bx + 5, by + 13, 10, 12); R(c, '#6b8a78', bx + 5, by + 13, 2, 12); R(c, '#3d5448', bx + 6, by + 25, 8, 10);
      R(c, '#8a7f49', bx + 3, by + 12, 14, 2); R(c, '#6e6537', bx + 9, by + 16, 2, 6);
      R(c, '#1d2a26', bx + 1, by + 14, 3, 20); R(c, '#4f6b5c', bx + 1, by + 15, 2, 9); R(c, '#8a7f49', bx + 1, by + 24, 3, 1); R(c, '#3d5448', bx + 1, by + 25, 2, 9);
      R(c, '#1d2a26', bx + 16, by + 14, 3, 20); R(c, '#4f6b5c', bx + 17, by + 15, 2, 9); R(c, '#8a7f49', bx + 16, by + 24, 3, 1); R(c, '#3d5448', bx + 17, by + 25, 2, 9);
      R(c, '#1d2a26', bx + 5, by + 35, 4, 11); R(c, '#3d5448', bx + 6, by + 35, 2, 10); R(c, '#1d2a26', bx + 11, by + 35, 4, 11); R(c, '#3d5448', bx + 12, by + 35, 2, 10); R(c, '#8a7f49', bx + 5, by + 40, 4, 1); R(c, '#8a7f49', bx + 11, by + 40, 4, 1);
      R(c, '#1d2a26', bx + 5, by, 10, 12); R(c, '#4f6b5c', bx + 6, by + 1, 8, 10); R(c, '#6b8a78', bx + 6, by + 1, 8, 1); R(c, '#0d1412', bx + 6, by + 4, 8, 3);
      R(c, `rgba(191,233,255,${k})`, bx + 7, by + 5, 6, 1); R(c, '#5a3220', bx + 11, by + 8, 2, 2);
      R(c, '#0a0c0d', bx + 3, by + 9, 1, 14); R(c, '#0a0c0d', bx + 16, by + 9, 1, 11); R(c, '#2b5a6a', bx + 3, by + 22, 1, 1);
      break;
    }
    case 'marking': {
      const k = e.pingT && e.pingT > t ? 1 : .6, col = `rgba(201,184,96,${k})`;
      roman(c, X + 10, Y + 12, 2, col); roman(c, X + 26, Y + 12, 3, col); roman(c, X + 45, Y + 12, 1, col);
      R(c, col, X + 20, Y + 15, 2, 1); R(c, col, X + 39, Y + 15, 2, 1);
      break;
    }
  }
  if (e.isNextObjective && !e.gone && !e.hidden) {
    const bob = Math.round(Math.sin(t * 4.5) * 2);
    const ox = X + 13, oy = Y - (e.type === 'npc' ? 24 : 12) + bob;
    R(c, '#0a0d12', ox - 1, oy - 1, 8, 8);
    R(c, '#f8cb7c', ox, oy, 6, 6);
    R(c, '#fff6d6', ox + 1, oy + 1, 2, 2);
    R(c, '#f8cb7c', ox + 2, oy + 7, 2, 2);
  }
}

export function drawDrone(c, d, t) {
  const off = d.state === 'disabled', bob = off ? 3 : Math.round(Math.sin(t * 4) * 1.5);
  const X = Math.round(d.x) - 11, Y = Math.round(d.y) - 20 + bob;
  R(c, 'rgba(0,0,0,.45)', X + 3, Math.round(d.y) + 3, 16, 4);
  R(c, '#15170f', X, Y + 3, 22, 16); R(c, '#4d5136', X + 1, Y + 4, 20, 9); R(c, '#62674a', X + 1, Y + 4, 20, 1); R(c, '#2a2d20', X + 1, Y + 13, 20, 5);
  R(c, '#5a3220', X + 3, Y + 7, 4, 2); R(c, '#6b3a22', X + 15, Y + 10, 3, 2); R(c, '#6e6537', X + 2, Y + 15, 18, 1);
  R(c, '#15170f', X + 16, Y - 3, 1, 6); R(c, '#15170f', X + 17, Y - 4, 2, 1);
  R(c, '#0a0c0d', X + 6, Y + 19, 1, 4); R(c, '#0a0c0d', X + 14, Y + 19, 1, 3); R(c, '#7a2b2b', X + 6, Y + 22, 1, 1);
  const lx = d.dir === 'left' ? 3 : d.dir === 'right' ? 13 : 8, col = off ? '#1c1e15' : d.state === 'chase' ? '#ff5a1f' : d.state === 'investigate' ? ((t * 6 | 0) % 2 ? '#ffe070' : '#8a6a10') : '#ffb020';
  if (d.dir !== 'up') { R(c, '#0d0e0a', X + lx - 1, Y + 6, 8, 7); R(c, col, X + lx, Y + 7, 6, 5); if (!off) R(c, '#fff3c0', X + lx + 1, Y + 8, 2, 1); }
  else R(c, col, X + 9, Y + 4, 4, 1);
  if (off && (t * 10 | 0) % 3 === 0) { R(c, '#fff3c0', X + 4 + hsh(t | 0, (t * 10 | 0)) * 14, Y + 2 + hsh((t * 10 | 0), 3) * 12, 2, 2); }
  if (d.alert > .05 && d.state !== 'chase' && !off) { R(c, '#15170f', X + 3, Y - 8, 16, 4); R(c, d.alert > .6 ? '#ff5a1f' : '#ffe070', X + 4, Y - 7, Math.round(14 * d.alert), 2); }
  if (d.state === 'chase') { R(c, '#ff3b30', X + 10, Y - 12, 2, 6); R(c, '#ff3b30', X + 10, Y - 5, 2, 2); }
  if (d.state === 'investigate' && !(d.alert > .05)) { R(c, '#ffe070', X + 9, Y - 12, 4, 1); R(c, '#ffe070', X + 12, Y - 11, 1, 3); R(c, '#ffe070', X + 10, Y - 8, 2, 1); R(c, '#ffe070', X + 10, Y - 5, 2, 2); }
}
