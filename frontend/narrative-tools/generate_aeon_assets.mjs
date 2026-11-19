#!/usr/bin/env node
// Pure-Node Sea-of-Stars-grade pixel-art & sprite generator for Aeon Circuit: The Silent Wake.
// Wraps the upgraded Bearframe Sprite Studio rigs (sprite-rig.js + machine-rig.js) and
// synthesizes 42 character world/battle sheets, 14 bust portraits, 10 biome palettes,
// 7 animated doorway sets, and 5 multi-tile scenery atlases under public/assets/aeon/.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../public/assets/aeon');
const STUDIO_LIB = resolve(__dirname, '../public/studio/lib');

// ---------------- Minimal DOM/Canvas2D Shim for Node ----------------
class PixelImageData {
  constructor(w, h) {
    this.width = w | 0;
    this.height = h | 0;
    this.data = new Uint8ClampedArray(this.width * this.height * 4);
  }
}

function parseColor(col) {
  if (!col || col === 'transparent') return [0, 0, 0, 0];
  if (col.startsWith('#')) {
    const h = col.slice(1);
    if (h.length === 3) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), 255];
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16),
      h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255];
  }
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i.exec(col);
  if (m) return [+m[1] | 0, +m[2] | 0, +m[3] | 0, m[4] !== undefined ? Math.round(+m[4] * 255) : 255];
  return [0, 0, 0, 255];
}

class PixelContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '#000000';
    this.globalAlpha = 1;
    this.imageSmoothingEnabled = false;
    this._stack = [];
    this._tx = 0;
    this._ty = 0;
    this._sx = 1;
    this._sy = 1;
  }
  save() { this._stack.push([this._tx, this._ty, this._sx, this._sy, this.globalAlpha, this.fillStyle]); }
  restore() { const s = this._stack.pop(); if (s) [this._tx, this._ty, this._sx, this._sy, this.globalAlpha, this.fillStyle] = s; }
  translate(x, y) { this._tx += x * this._sx; this._ty += y * this._sy; }
  scale(x, y) { this._sx *= x; this._sy *= y; }
  createImageData(w, h) { return new PixelImageData(w, h); }
  getImageData(sx, sy, sw, sh) {
    const out = new PixelImageData(sw, sh), src = this.canvas._buf, W = this.canvas.width, H = this.canvas.height;
    for (let y = 0; y < sh; y++) {
      const py = sy + y; if (py < 0 || py >= H) continue;
      for (let x = 0; x < sw; x++) {
        const px = sx + x; if (px < 0 || px >= W) continue;
        const si = (py * W + px) * 4, di = (y * sw + x) * 4;
        out.data[di] = src[si]; out.data[di + 1] = src[si + 1]; out.data[di + 2] = src[si + 2]; out.data[di + 3] = src[si + 3];
      }
    }
    return out;
  }
  putImageData(img, dx, dy) {
    const dst = this.canvas._buf, W = this.canvas.width, H = this.canvas.height;
    for (let y = 0; y < img.height; y++) {
      const py = (dy | 0) + y; if (py < 0 || py >= H) continue;
      for (let x = 0; x < img.width; x++) {
        const px = (dx | 0) + x; if (px < 0 || px >= W) continue;
        const si = (y * img.width + x) * 4, di = (py * W + px) * 4;
        dst[di] = img.data[si]; dst[di + 1] = img.data[si + 1]; dst[di + 2] = img.data[si + 2]; dst[di + 3] = img.data[si + 3];
      }
    }
  }
  clearRect(x, y, w, h) {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.canvas.width, Math.round(x + w)), y1 = Math.min(this.canvas.height, Math.round(y + h));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
      const i = (py * this.canvas.width + px) * 4;
      this.canvas._buf[i] = 0; this.canvas._buf[i + 1] = 0; this.canvas._buf[i + 2] = 0; this.canvas._buf[i + 3] = 0;
    }
  }
  _blend(px, py, r, g, b, a) {
    if (px < 0 || py < 0 || px >= this.canvas.width || py >= this.canvas.height || a <= 0) return;
    const effA = (a / 255) * this.globalAlpha;
    if (effA <= 0) return;
    const i = (py * this.canvas.width + px) * 4, d = this.canvas._buf;
    if (effA >= 0.999) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; return; }
    const da = d[i + 3] / 255, oa = effA + da * (1 - effA);
    if (oa <= 0) return;
    d[i] = Math.round((r * effA + d[i] * da * (1 - effA)) / oa);
    d[i + 1] = Math.round((g * effA + d[i + 1] * da * (1 - effA)) / oa);
    d[i + 2] = Math.round((b * effA + d[i + 2] * da * (1 - effA)) / oa);
    d[i + 3] = Math.round(oa * 255);
  }
  fillRect(x, y, w, h) {
    const [r, g, b, a] = parseColor(this.fillStyle);
    let x0 = Math.round(this._tx + x * this._sx), x1 = Math.round(this._tx + (x + w) * this._sx);
    let y0 = Math.round(this._ty + y * this._sy), y1 = Math.round(this._ty + (y + h) * this._sy);
    if (x1 < x0) [x0, x1] = [x1, x0];
    if (y1 < y0) [y0, y1] = [y1, y0];
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) this._blend(px, py, r, g, b, a);
  }
  drawImage(img, ...args) {
    let sx = 0, sy = 0, sw = img.width, sh = img.height, dx = 0, dy = 0, dw = img.width, dh = img.height;
    if (args.length === 2) [dx, dy] = args;
    else if (args.length === 4) [dx, dy, dw, dh] = args;
    else if (args.length === 8) [sx, sy, sw, sh, dx, dy, dw, dh] = args;
    const buf = img._buf;
    for (let y = 0; y < dh; y++) {
      const srcY = Math.floor(sy + (y + 0.5) * sh / dh);
      if (srcY < 0 || srcY >= img.height) continue;
      for (let x = 0; x < dw; x++) {
        const srcX = Math.floor(sx + (x + 0.5) * sw / dw);
        if (srcX < 0 || srcX >= img.width) continue;
        const si = (srcY * img.width + srcX) * 4;
        if (buf[si + 3] === 0) continue;
        const tx = Math.floor(this._tx + (dx + x + 0.5) * this._sx);
        const ty = Math.floor(this._ty + (dy + y + 0.5) * this._sy);
        this._blend(tx, ty, buf[si], buf[si + 1], buf[si + 2], buf[si + 3]);
      }
    }
  }
}

class PixelCanvas {
  constructor(w = 32, h = 32) { this._w = w; this._h = h; this._buf = new Uint8ClampedArray(w * h * 4); this._ctx = new PixelContext(this); }
  get width() { return this._w; }
  set width(v) { this._w = v | 0; this._buf = new Uint8ClampedArray(this._w * this._h * 4); }
  get height() { return this._h; }
  set height(v) { this._h = v | 0; this._buf = new Uint8ClampedArray(this._w * this._h * 4); }
  getContext() { return this._ctx; }
}

globalThis.ImageData = PixelImageData;
globalThis.document = { createElement: tag => tag === 'canvas' ? new PixelCanvas() : {} };

const { drawAndroid, poseFor, shade } = await import(STUDIO_LIB + '/sprite-rig.js');
const { renderRig } = await import(STUDIO_LIB + '/machine-rig.js');
const { MACHINE_PRESETS } = await import(STUDIO_LIB + '/machine-presets.js');

// ---------------- Fast Zero-Dep PNG Encoder ----------------
const CRC_TABLE = Array.from({ length: 256 }, (_, i) => {
  let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const b = Buffer.allocUnsafe(12 + data.length);
  b.writeUInt32BE(data.length, 0);
  b.write(type, 4, 4, 'ascii');
  data.copy(b, 8);
  b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
  return b;
}
function encodePng(cv) {
  const w = cv.width, h = cv.height, raw = Buffer.allocUnsafe(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const ro = y * (1 + w * 4), so = y * w * 4;
    raw[ro] = 0;
    Buffer.from(cv._buf.buffer, cv._buf.byteOffset + so, w * 4).copy(raw, ro + 1);
  }
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
async function writePng(relPath, cv) {
  const full = resolve(ROOT, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, encodePng(cv));
}

// Pixel helpers for bespoke environmental & portrait art
const hsh = (x, y, s = 0) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
function pxSet(cv, x, y, col, alpha = 1) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;
  const [r, g, b, a] = typeof col === 'string' ? parseColor(col) : [...col, 255];
  cv.getContext()._blend(x, y, r, g, b, Math.round(a * alpha));
}
function box(cv, x, y, w, h, col, alpha = 1) {
  const c = cv.getContext(); c.save(); c.globalAlpha *= alpha; c.fillStyle = col; c.fillRect(x | 0, y | 0, w | 0, h | 0); c.restore();
}
function bevelBox(cv, x, y, w, h, base, border = '#0b0e12') {
  box(cv, x, y, w, h, border);
  box(cv, x + 1, y + 1, w - 2, h - 2, base);
  box(cv, x + 1, y + 1, w - 2, 1, shade(base, 0.32));
  box(cv, x + 1, y + 1, 1, h - 2, shade(base, 0.22));
  box(cv, x + 1, y + h - 2, w - 2, 1, shade(base, -0.35));
  box(cv, x + w - 2, y + 1, 1, h - 2, shade(base, -0.25));
}
function disc(cv, cx, cy, r, col, alpha = 1) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy <= r * r) pxSet(cv, Math.round(cx + dx), Math.round(cy + dy), col, alpha);
  }
}
function radialGlow(cv, cx, cy, r, col, maxA = 0.5) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const d = Math.hypot(dx, dy) / r;
    if (d < 1) pxSet(cv, Math.round(cx + dx), Math.round(cy + dy), col, maxA * (1 - d) * (1 - d));
  }
}

// Enforce Canon: draw Bearframe chest logo + glow ONLY for Miya ('bearframe_exploration_miya')
function applyBearframeEmblem(cv, fx, fy, fw, fh, frameRow, hot) {
  if (frameRow === 1 || frameRow === 3) return; // down/right only
  const cx = Math.round(fx + fw * 0.5), cy = Math.round(fy + fh * 0.41);
  const col = hot ? '#8ffcf3' : '#3fe3d4';
  box(cv, cx - 2, cy - 1, 4, 3, '#101820');
  pxSet(cv, cx - 1, cy - 1, col); pxSet(cv, cx, cy - 1, col);
  pxSet(cv, cx - 1, cy, '#d6fffb'); pxSet(cv, cx, cy, '#d6fffb');
  pxSet(cv, cx - 2, cy - 2, col); pxSet(cv, cx + 1, cy - 2, col);
}

// Helper for cloning and modifying machine rigs
function cloneRig(base, overrides = {}) {
  const r = JSON.parse(JSON.stringify(base));
  Object.assign(r, overrides);
  if (overrides.colors) r.colors = { ...base.colors, ...overrides.colors };
  if (overrides.weather) r.weather = { ...base.weather, ...overrides.weather };
  return r;
}

const makeDroneRig = (colors, size = 48, weather = { rust: 0.4, moss: 0.25, wear: 0.45 }, ring = true) => {
  const P = (id, p, s, x, y, w, h, o = {}) => ({ id, p, s, x, y, w, h, ...o });
  const cx = size / 2, cy = size * 0.54;
  const f = [
    P('body', null, 'plate', cx, cy, 24, 18, { oy: 9, m: 1 }),
    P('core', 'body', 'disc', 0, 1, 10, 8, { ox: 5, oy: 4, c: 'under', z: 1 }),
    P('eye', 'body', 'disc', 0, 1, 6, 5, { ox: 3, oy: 2.5, g: 'glow', z: 2 }),
    P('armL', 'body', 'taper', -13, 3, 4, 12, { t: 0.2, c: 'dark', z: -1 }),
    P('armR', 'body', 'taper', 13, 3, 4, 12, { t: 0.2, c: 'dark', z: -1 }),
    P('finT', 'body', 'plate', 0, -11, 14, 4, { c: 'accent', z: 2 }),
    ...(ring ? [P('halo', 'body', 'ring', 0, -13, 28, 7, { ox: 14, oy: 3.5, th: 2, seg: 10, c: 'dark', g: 'glow', z: -2 })] : []),
    P('thr', 'body', 'taper', 0, 10, 8, 5, { t: 0.1, c: 'dark', z: -1 }),
  ];
  const s = [
    P('body', null, 'plate', cx, cy, 20, 18, { oy: 9, m: 1 }),
    P('pack', 'body', 'plate', -9, -1, 8, 13, { c: 'dark', z: -1 }),
    P('eye', 'body', 'disc', 8, 0, 6, 6, { ox: 3, oy: 3, g: 'glow', z: 2 }),
    P('armR', 'body', 'taper', 4, 6, 4, 11, { r: -25, t: 0.2, c: 'dark', z: 1 }),
    ...(ring ? [P('halo', 'body', 'ring', 0, -13, 24, 6, { ox: 12, oy: 3, th: 2, seg: 8, c: 'dark', g: 'glow', z: -2 })] : []),
  ];
  return {
    name: 'Ghost Grid Automaton', w: size, h: size, tiles: [1, 1], colors, weather,
    views: { down: f, up: f.filter(p => p.id !== 'eye'), right: s },
    anims: {
      idle: { body: { y: [1.5, 0] }, eye: { glow: [0.3, 0] }, ...(ring ? { halo: { spin: 1 } } : {}) },
      walk: { body: { y: [1.5, 0, 2], rot: [3, 0] }, armL: { rot: [12, 0] }, armR: { rot: [12, 0.5] }, ...(ring ? { halo: { spin: 2 } } : {}) },
      attack: { body: { x: [4, 0, 0.5] }, eye: { glow: [0.4, 0, 2] }, armR: { rot: [-35, 0, 0.5] }, ...(ring ? { halo: { spin: 3 } } : {}) },
      charge: { body: { y: [2, 0], jit: 0.8 }, eye: { glow: [0.4, 0, 3] }, ...(ring ? { halo: { spin: 5, glow: [0.4, 0, 3] } } : {}) },
      hurt: { body: { x: [-3, 0, 0.5], rot: [-9, 0, 0.5] }, eye: { flick: 0.6 } },
      malfunction: { body: { jit: 2 }, eye: { flick: 0.7 }, armL: { jit: 14 } },
      defeat: { body: { yTo: 12, rotTo: 35 }, eye: { glowTo: -1 }, ...(ring ? { halo: { glowTo: -1 } } : {}) }
    }
  };
};

// Standard timing spec helper for battle actions (columns: 6, rows: 9)
function battleAnimTable(attackReleaseMs = 260) {
  return {
    idle:    { row: 0, frames: 4, durationsMs: [240, 240, 240, 240], loop: true },
    attack:  { row: 1, frames: 4, durationsMs: [90, 110, 120, 130], loop: false, events: [{ kind: 'release', atMs: attackReleaseMs }] },
    ranged:  { row: 2, frames: 4, durationsMs: [100, 110, 110, 130], loop: false, events: [{ kind: 'release', atMs: attackReleaseMs }] },
    cast:    { row: 3, frames: 4, durationsMs: [110, 120, 120, 140], loop: false, events: [{ kind: 'release', atMs: attackReleaseMs }] },
    guard:   { row: 4, frames: 3, durationsMs: [140, 180, 180], loop: true },
    hit:     { row: 5, frames: 3, durationsMs: [90, 130, 150], loop: false },
    down:    { row: 6, frames: 3, durationsMs: [140, 180, 240], loop: false, holdLast: true },
    victory: { row: 7, frames: 4, durationsMs: [160, 160, 160, 220], loop: false, holdLast: true },
    charge:  { row: 8, frames: 4, durationsMs: [110, 110, 110, 110], loop: true }
  };
}

const ACTION_MAP = [
  ['idle', 'idle'], ['attack', 'attack'], ['ranged', 'scan'], ['cast', 'charge'],
  ['guard', 'crouch'], ['hit', 'hurt'], ['down', 'defeat'], ['victory', 'idle'], ['charge', 'charge']
];
const MACHINE_ACTION_MAP = [
  ['idle', 'idle'], ['attack', 'attack'], ['ranged', 'attack'], ['cast', 'charge'],
  ['guard', 'idle'], ['hit', 'hurt'], ['down', 'defeat'], ['victory', 'idle'], ['charge', 'charge']
];

function renderHumanWorldSheet(cfg, fw, fh, isBearframe = false) {
  const cv = new PixelCanvas(fw * 9, fh * 4);
  const dirs = ['down', 'left', 'right', 'up'];
  for (let row = 0; row < 4; row++) {
    const dir = dirs[row];
    for (let col = 0; col < 9; col++) {
      const f = new PixelCanvas(fw, fh);
      const pose = col === 0 ? poseFor('idle', 0, 4) : poseFor('walk', col - 1, 8);
      drawAndroid(f.getContext(), cfg, dir, pose, fw, fh);
      if (isBearframe) applyBearframeEmblem(f, 0, 0, fw, fh, ['down', 'up', 'right', 'left'].indexOf(dir), col % 3 === 0);
      cv.getContext().drawImage(f, col * fw, row * fh);
    }
  }
  return cv;
}

function renderHumanBattleSheet(cfg, size, isBearframe = false) {
  const cv = new PixelCanvas(size * 6, size * 9);
  const anims = battleAnimTable();
  for (const [bName, rigAnim] of ACTION_MAP) {
    const spec = anims[bName];
    for (let col = 0; col < spec.frames; col++) {
      const f = new PixelCanvas(size, size);
      const pose = poseFor(rigAnim, col, spec.frames);
      drawAndroid(f.getContext(), cfg, 'right', pose, size, size);
      if (isBearframe) applyBearframeEmblem(f, 0, 0, size, size, 2, pose.hot);
      cv.getContext().drawImage(f, col * size, spec.row * size);
    }
  }
  return cv;
}

function renderMachineWorldSheet(rig, fw, fh) {
  const cv = new PixelCanvas(fw * 9, fh * 4);
  const dirs = ['down', 'left', 'right', 'up'];
  for (let row = 0; row < 4; row++) {
    const dir = dirs[row];
    for (let col = 0; col < 9; col++) {
      const f = new PixelCanvas(fw, fh);
      renderRig(f.getContext(), rig, dir, col === 0 ? 'idle' : 'walk', col === 0 ? 0 : col - 1, col === 0 ? 4 : 8, fw, fh);
      cv.getContext().drawImage(f, col * fw, row * fh);
    }
  }
  return cv;
}

function renderMachineBattleSheet(rig, size) {
  const cv = new PixelCanvas(size * 6, size * 9);
  const anims = battleAnimTable();
  for (const [bName, rigAnim] of MACHINE_ACTION_MAP) {
    const spec = anims[bName];
    for (let col = 0; col < spec.frames; col++) {
      const f = new PixelCanvas(size, size);
      renderRig(f.getContext(), rig, 'right', rigAnim, col, spec.frames, size, size);
      cv.getContext().drawImage(f, col * size, spec.row * size);
    }
  }
  return cv;
}

// ---------------- 42 Character Definitions (Strict Canon) ----------------
const baseSleeper = { head: 'band', fins: false, modules: false, armor: 'light', cloak: 'none', harness: true, pouches: true, backpack: false, antenna: false, damage: 2 };
const baseEcho = { head: 'mono', fins: false, modules: false, armor: 'light', cloak: 'short', harness: true, pouches: true, backpack: false, antenna: false, damage: 3 };

const SENTINEL_BASE = MACHINE_PRESETS['Heavy Sentinel (humanoid titan)']();
const HEXAPOD_BASE = MACHINE_PRESETS['Hexapod Cartography Engine']();
const ARCHIVE_BASE = MACHINE_PRESETS['Archive Sentinel (floating boss)']();
const DRONE_BASE = MACHINE_PRESETS['Micro-drone (flyer)']();

// Custom WARD-7 stationary monolith rig
const WARD7_RIG = (() => {
  const P = (id, p, s, x, y, w, h, o = {}) => ({ id, p, s, x, y, w, h, ...o });
  const parts = [
    P('base', null, 'plate', 48, 86, 42, 14, { ox: 21, oy: 14, c: 'dark', m: 1 }),
    P('mid', 'base', 'plate', 0, -32, 34, 24, { oy: 12, c: 'bone', m: 1 }),
    P('top', 'mid', 'plate', 0, -24, 26, 20, { oy: 10, c: 'dark' }),
    P('glass', 'mid', 'glass', 0, -6, 16, 22, { g: 'glow', z: 2 }),
    P('eye1', 'top', 'disc', -5, -2, 6, 6, { ox: 3, oy: 3, g: 'accent', z: 3 }),
    P('eye2', 'top', 'disc', 5, -2, 6, 6, { ox: 3, oy: 3, g: 'glow', z: 3 }),
    P('sealL', 'mid', 'banner', -20, -10, 7, 26, { c: 'cloth', z: 1 }),
    P('sealR', 'mid', 'banner', 20, -10, 7, 26, { c: 'cloth', z: 1 }),
  ];
  return {
    name: 'WARD-7 Controller', w: 96, h: 96, tiles: [2, 2],
    colors: { bone: '#6f747b', dark: '#23272e', under: '#0e1014', glow: '#ffb020', accent: '#ff4b3a', cloth: '#592929', moss: '#4a5f32', rust: '#7e4020', brass: '#988149' },
    weather: { rust: 0.45, moss: 0.15, wear: 0.5 },
    views: { down: parts, up: parts, right: parts },
    anims: {
      idle: { mid: { y: [0.6, 0] }, glass: { glow: [0.3, 0] }, eye1: { glow: [0.25, 0] } },
      walk: { mid: { y: [0.8, 0] }, glass: { glow: [0.35, 0] } },
      attack: { glass: { glow: [0.5, 0, 2] }, eye1: { glow: [0.5, 0, 2] } },
      charge: { mid: { jit: 0.5 }, glass: { glow: [0.6, 0, 3] }, eye1: { glow: [0.6, 0, 3] } },
      hurt: { mid: { x: [-2, 0, 0.5] }, glass: { flick: 0.7 } },
      malfunction: { mid: { jit: 1.5 }, glass: { flick: 0.8 }, eye1: { flick: 0.8 } },
      defeat: { mid: { yTo: 8 }, glass: { glowTo: -1 }, eye1: { glowTo: -1 }, eye2: { glowTo: -1 } }
    }
  };
})();

const CHARACTERS = [
  // 4 Selectable Sleepers (Ancient pre-Bearframe synthetic sleepers, NO Bearframe displays!)
  { id: 'sleeper_A', name: 'Sleeper A (Vanguard)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseSleeper, armor: 'plated', cloak: 'short', build: 1, colors: { armor: '#c7c0ad', trim: '#38464c', under: '#14191e', glow: '#a9e6f2', cloak: '#8d5734', leather: '#493728' } } },
  { id: 'sleeper_B', name: 'Sleeper B (Surveyist)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseSleeper, head: 'mono', cloak: 'long', backpack: true, build: 0, colors: { armor: '#68747c', trim: '#8c7846', under: '#111519', glow: '#98eedc', cloak: '#5b442c', leather: '#3e3024' } } },
  { id: 'sleeper_C', name: 'Sleeper C (Technician)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseSleeper, backpack: true, antenna: true, armor: 'light', colors: { armor: '#557564', trim: '#7a683a', under: '#15201c', glow: '#f2c464', cloak: '#355046', leather: '#523424' } } },
  { id: 'sleeper_D', name: 'Sleeper D (Courier)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseSleeper, head: 'visor', cloak: 'long', build: -1, colors: { armor: '#a4928c', trim: '#4b373a', under: '#171216', glow: '#cdefff', cloak: '#722c2e', leather: '#472c27' } } },

  // Party Companions & Key Story NPCs
  { id: 'echo_industrial_maintenance', name: 'Rill (Echo Courier)', kind: 'human', ww: 32, wh: 56, bw: 96, bearframe: false,
    cfg: { ...baseEcho, cloak: 'short', backpack: true, colors: { armor: '#637178', trim: '#98633b', under: '#14191c', glow: '#f2b857', cloak: '#8f472d', leather: '#4a3525' } } },
  { id: 'ghostgrid_utility_pica', name: 'Pica (Ghost-Grid Utility)', kind: 'machine', ww: 32, wh: 56, bw: 64,
    rig: makeDroneRig({ bone: '#6f828a', dark: '#273138', under: '#0e1418', glow: '#53e6f2', accent: '#75a864', cloth: '#39555e', moss: '#4e7535', rust: '#6e4527', brass: '#9b864a' }, 44, { rust: 0.25, moss: 0.35, wear: 0.3 }, false) },
  { id: 'bearframe_exploration_miya', name: 'Miya (Bearframe Exploration)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: true,
    cfg: { head: 'visor', fins: false, modules: true, armor: 'plated', cloak: 'short', build: 0, pouches: true, harness: true, backpack: true, antenna: true, damage: 0,
      colors: { armor: '#e3e8ee', trim: '#28303b', under: '#11161d', glow: '#3fe3d4', cloak: '#246d64', leather: '#493c2e' } } },

  // Sanctuary & Settlement Echo Frames
  { id: 'npc_guardian', name: 'Guardian (Echo-SE7 Keeper)', kind: 'machine', ww: 64, wh: 72, bw: 96,
    rig: cloneRig(SENTINEL_BASE, { colors: { bone: '#9a958b', dark: '#2d333c', under: '#101318', glow: '#53d6e8', accent: '#e08932', cloth: '#6d2f2b', moss: '#567834', rust: '#804523', brass: '#9e884b' }, weather: { rust: 0.65, moss: 0.55, wear: 0.7 } }) },
  { id: 'npc_noll', name: 'Noll (Lamp Keeper)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseEcho, head: 'band', backpack: true, cloak: 'short', colors: { armor: '#8c7e64', trim: '#a3823d', under: '#181511', glow: '#ffd166', cloak: '#5c4b2f', leather: '#4a3622' } } },
  { id: 'npc_ves', name: 'Ves (Shelf Coordinator)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseEcho, head: 'visor', cloak: 'long', colors: { armor: '#687a77', trim: '#3b4a46', under: '#111917', glow: '#82e6c8', cloak: '#3e5c57', leather: '#41352b' } } },
  { id: 'npc_ilen', name: 'Ilen (Archive Painter)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseEcho, head: 'mono', cloak: 'short', build: 1, colors: { armor: '#968b86', trim: '#4d3a3a', under: '#171214', glow: '#e8a264', cloak: '#6d3939', leather: '#4c3227' } } },
  { id: 'npc_talla', name: 'Talla (Unpainted Echo)', kind: 'human', ww: 32, wh: 56, bw: 64, bearframe: false,
    cfg: { ...baseEcho, head: 'band', cloak: 'none', damage: 2, colors: { armor: '#8c949c', trim: '#444b52', under: '#121519', glow: '#d2e2ec', cloak: '#4d545c', leather: '#3a3a3d' } } },
  { id: 'ward7_monolith', name: 'WARD-7 Controller', kind: 'machine', ww: 64, wh: 64, bw: 96, rig: WARD7_RIG },

  // Major Bosses & Regular Ghost Grid Automata
  { id: 'old_sentry', name: 'Old Sentry', kind: 'machine', ww: 96, wh: 96, bw: 96,
    rig: makeDroneRig({ bone: '#8b8d7a', dark: '#2f3432', under: '#101312', glow: '#ffb020', accent: '#ff5232', cloth: '#54352c', moss: '#4e6c2b', rust: '#7d4421', brass: '#9b8347' }, 64, { rust: 0.65, moss: 0.3, wear: 0.65 }, true) },
  { id: 'boss_fuse_warden', name: 'Fuse Warden', kind: 'machine', ww: 64, wh: 84, bw: 128,
    rig: cloneRig(SENTINEL_BASE, { colors: { bone: '#868072', dark: '#2c3038', under: '#101217', glow: '#ff9e2c', accent: '#ff3b30', cloth: '#6b2c25', moss: '#4c6d2c', rust: '#884824', brass: '#b49042' }, weather: { rust: 0.8, moss: 0.45, wear: 0.75 } }) },
  { id: 'boss_quay_grapple', name: 'Quay Grapple Rig', kind: 'machine', ww: 96, wh: 72, bw: 128,
    rig: cloneRig(HEXAPOD_BASE, { colors: { bone: '#807668', dark: '#2f3137', under: '#111216', glow: '#ffa938', accent: '#d9532b', moss: '#49632c', rust: '#924b22', brass: '#aa8a44' }, weather: { rust: 0.85, moss: 0.25, wear: 0.7 } }) },
  { id: 'boss_registry_auditor', name: 'Registry Auditor', kind: 'machine', ww: 64, wh: 88, bw: 128,
    rig: cloneRig(ARCHIVE_BASE, { colors: { bone: '#aeb6be', dark: '#2c3640', under: '#0d131a', glow: '#ffaa2e', accent: '#ff4433', cloth: '#4a353e', moss: '#446338', rust: '#6e452d', brass: '#a89054' }, weather: { rust: 0.4, moss: 0.2, wear: 0.55 } }) },
  { id: 'boss_switchyard_mast', name: 'Switchyard Mast', kind: 'machine', ww: 64, wh: 88, bw: 128,
    rig: cloneRig(ARCHIVE_BASE, { colors: { bone: '#90887e', dark: '#30363d', under: '#101318', glow: '#ffcf48', accent: '#ff5232', cloth: '#66342b', moss: '#526d35', rust: '#8a4a24', brass: '#b38e46' }, weather: { rust: 0.7, moss: 0.35, wear: 0.65 } }) },
  { id: 'boss_floodgate_warden', name: 'Floodgate Construct', kind: 'machine', ww: 64, wh: 84, bw: 128,
    rig: cloneRig(SENTINEL_BASE, { colors: { bone: '#7d8a8e', dark: '#27333b', under: '#0d141a', glow: '#4ae0e6', accent: '#f29f33', cloth: '#2e5159', moss: '#4d7a42', rust: '#6b472d', brass: '#8c834c' }, weather: { rust: 0.5, moss: 0.8, wear: 0.6 } }) },
  { id: 'boss_counting_tower', name: 'Counting Tower', kind: 'machine', ww: 64, wh: 88, bw: 128,
    rig: cloneRig(ARCHIVE_BASE, { colors: { bone: '#c2bdb0', dark: '#2c333c', under: '#0e1116', glow: '#4ae8f5', accent: '#f5a638', cloth: '#543544', moss: '#507232', rust: '#754828', brass: '#b39552' }, weather: { rust: 0.35, moss: 0.55, wear: 0.45 } }) },
  { id: 'boss_ward_sentinel', name: 'Ward Sentinel', kind: 'machine', ww: 64, wh: 84, bw: 128,
    rig: cloneRig(SENTINEL_BASE, { colors: { bone: '#9c9ea4', dark: '#262b33', under: '#0d0f14', glow: '#ff4c3b', accent: '#ffae33', cloth: '#732626', moss: '#3f5732', rust: '#703824', brass: '#9e8249' }, weather: { rust: 0.5, moss: 0.2, wear: 0.6 } }) },
  { id: 'boss_quiet_engine', name: 'The Quiet Engine', kind: 'machine', ww: 96, wh: 72, bw: 128,
    rig: cloneRig(HEXAPOD_BASE, { colors: { bone: '#c7c2b6', dark: '#28323c', under: '#0a0e14', glow: '#3fe8f5', accent: '#ff6e3a', cloth: '#5a3240', moss: '#4e7532', rust: '#704424', brass: '#b5944d' }, weather: { rust: 0.45, moss: 0.75, wear: 0.5 } }) },

  // 20 Diverse Ghost Grid & Facility Units (completing exact 42 count)
  ...([
    ['grid_sweeper', '#7e888a', '#4be3ee', '#597a34', 0.4, false],
    ['grid_relay_hound', '#8d8070', '#ffaa38', '#4c662e', 0.6, true],
    ['grid_shutter_drone', '#6e7680', '#ff6438', '#3c522c', 0.5, true],
    ['grid_census_clerk', '#a2aab2', '#4fd8eb', '#3b5433', 0.3, true],
    ['grid_quarantine_unit', '#92969c', '#ff4738', '#394f30', 0.45, true],
    ['grid_rail_walker', '#887b69', '#ffc447', '#4e682c', 0.7, false],
    ['grid_turbine_mite', '#6a7a82', '#64ecff', '#52783e', 0.5, false],
    ['grid_sump_crab', '#5e7378', '#48e6cb', '#5a8238', 0.55, false],
    ['grid_beacon_float', '#b5afa2', '#70efff', '#4b6b33', 0.25, true],
    ['grid_cable_weasel', '#786f68', '#ff8e38', '#445c2c', 0.65, false],
    ['grid_lock_sentinel', '#8a8d96', '#ff5b38', '#3c542e', 0.5, true],
    ['grid_cathedral_guard', '#bcb5a6', '#4be8f2', '#456132', 0.3, true],
    ['grid_telemetry_eye', '#6e7b85', '#ffbe44', '#384e30', 0.4, true],
    ['grid_pump_frame', '#677c80', '#4ae3d4', '#557d36', 0.6, false],
    ['grid_scaffold_rig', '#8d8372', '#ffd258', '#46612e', 0.65, true],
    ['grid_vault_warden', '#969ca6', '#56d8f2', '#3c5634', 0.45, true],
    ['grid_perimeter_turret', '#7a8086', '#ff5438', '#4e6d30', 0.55, true],
    ['echo_messenger_old', '#757d84', '#e8b658', '#526e32', 0.6, false],
    ['echo_archivist', '#98948a', '#64d8ec', '#4a6932', 0.45, true],
    ['ward_micro_drone', '#7c848c', '#ff7840', '#3f5730', 0.35, true],
  ].map(([id, bone, glow, moss, rust, ring]) => ({
    id, name: id.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    kind: 'machine', ww: 48, wh: 48, bw: 64,
    rig: id === 'ward_micro_drone'
      ? cloneRig(DRONE_BASE, { w: 48, h: 48, colors: { bone, glow, moss } })
      : makeDroneRig({ bone, dark: '#293038', under: '#0d1116', glow, accent: '#ff9638', cloth: '#543532', moss, rust: '#7b4322', brass: '#9c8649' }, 48, { rust, moss: 0.4, wear: 0.5 }, ring)
  })))
];

// ---------------- High-Craft 128x128 Pixel Portraits ----------------
const PORTRAIT_SPECS = [
  { id: 'sleeper_A', armor: '#c7c0ad', trim: '#38464c', glow: '#a9e6f2', cloak: '#8d5734', bg1: '#0c1c22', bg2: '#1a3842', visor: 'band', bearframe: false },
  { id: 'sleeper_B', armor: '#68747c', trim: '#8c7846', glow: '#98eedc', cloak: '#5b442c', bg1: '#0f171a', bg2: '#1f3234', visor: 'mono', bearframe: false },
  { id: 'sleeper_C', armor: '#557564', trim: '#7a683a', glow: '#f2c464', cloak: '#355046', bg1: '#0f1a15', bg2: '#233b2e', visor: 'band', bearframe: false },
  { id: 'sleeper_D', armor: '#a4928c', trim: '#4b373a', glow: '#cdefff', cloak: '#722c2e', bg1: '#181115', bg2: '#331e24', visor: 'visor', bearframe: false },
  { id: 'rill',      armor: '#637178', trim: '#98633b', glow: '#f2b857', cloak: '#8f472d', bg1: '#191410', bg2: '#38261b', visor: 'mono', bearframe: false },
  { id: 'pica',      armor: '#6f828a', trim: '#273138', glow: '#53e6f2', cloak: '#39555e', bg1: '#0b181d', bg2: '#173842', visor: 'mono', bearframe: false },
  { id: 'miya',      armor: '#e3e8ee', trim: '#28303b', glow: '#3fe3d4', cloak: '#246d64', bg1: '#0b1e24', bg2: '#194552', visor: 'visor', bearframe: true },
  { id: 'guardian',  armor: '#9a958b', trim: '#2d333c', glow: '#53d6e8', cloak: '#6d2f2b', bg1: '#0d181e', bg2: '#1c3238', visor: 'mono', bearframe: false },
  { id: 'noll',      armor: '#8c7e64', trim: '#a3823d', glow: '#ffd166', cloak: '#5c4b2f', bg1: '#1a150b', bg2: '#382b15', visor: 'band', bearframe: false },
  { id: 'ves',       armor: '#687a77', trim: '#3b4a46', glow: '#82e6c8', cloak: '#3e5c57', bg1: '#0f1a18', bg2: '#1f3833', visor: 'visor', bearframe: false },
  { id: 'ilen',      armor: '#968b86', trim: '#4d3a3a', glow: '#e8a264', cloak: '#6d3939', bg1: '#171112', bg2: '#302022', visor: 'mono', bearframe: false },
  { id: 'talla',     armor: '#8c949c', trim: '#444b52', glow: '#d2e2ec', cloak: '#4d545c', bg1: '#121519', bg2: '#232930', visor: 'band', bearframe: false },
  { id: 'ward7',     armor: '#6f747b', trim: '#23272e', glow: '#ffb020', cloak: '#592929', bg1: '#19100e', bg2: '#381e18', visor: 'monolith', bearframe: false },
  { id: 'system',    armor: '#3f4b56', trim: '#1d242b', glow: '#7dffb0', cloak: '#1a2d28', bg1: '#081210', bg2: '#122922', visor: 'monolith', bearframe: false },
];

function renderPortrait(spec) {
  const cv = new PixelCanvas(128, 128);
  // Rich Sea-of-Stars atmospheric backdrop gradient + scanlines + rim glow
  for (let y = 0; y < 128; y++) {
    const t = y / 127;
    const [r1, g1, b1] = parseColor(spec.bg1), [r2, g2, b2] = parseColor(spec.bg2);
    const col = `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
    box(cv, 0, y, 128, 1, col);
    if (y % 3 === 0) box(cv, 0, y, 128, 1, '#000000', 0.16);
  }
  radialGlow(cv, 64, 48, 56, spec.glow, 0.24);
  // Parallax architectural circuit lattice behind bust
  for (let i = 0; i < 6; i++) {
    box(cv, 8 + i * 20, 10 + (i % 3) * 14, 14, 1, spec.glow, 0.24);
    box(cv, 15 + i * 20, 10 + (i % 3) * 14, 1, 16, spec.glow, 0.18);
    pxSet(cv, 15 + i * 20, 10 + (i % 3) * 14, '#ffffff', 0.35);
  }
  if (spec.visor === 'monolith') {
    bevelBox(cv, 24, 18, 80, 100, spec.armor, '#090b0f');
    bevelBox(cv, 30, 24, 68, 48, spec.trim, '#080a0e');
    radialGlow(cv, 64, 48, 28, spec.glow, 0.5);
    box(cv, 40, 42, 48, 12, '#07090d');
    box(cv, 44, 45, 16, 6, spec.glow);
    box(cv, 68, 45, 16, 6, spec.id === 'ward7' ? '#ff4b3a' : spec.glow);
    box(cv, 46, 46, 8, 2, '#ffffff', 0.8);
    for (let y = 78; y < 110; y += 5) {
      box(cv, 34, y, 60, 2, '#0b0e12');
      box(cv, 36, y - 1, 56, 1, shade(spec.armor, -0.25));
    }
    box(cv, 0, 0, 128, 2, spec.trim); box(cv, 0, 126, 128, 2, spec.trim);
    return cv;
  }
  // Sculpted cape / poncho draped across shoulders
  bevelBox(cv, 18, 80, 92, 48, shade(spec.cloak, -0.2), '#090b0e');
  for (let fx = 24; fx < 104; fx += 12) box(cv, fx, 84, 5, 44, shade(spec.cloak, 0.18), 0.7);
  // Layered shoulder pauldrons with beveled specular edge + rivet
  bevelBox(cv, 22, 84, 28, 36, spec.armor, '#090b0e');
  bevelBox(cv, 78, 84, 28, 36, spec.armor, '#090b0e');
  box(cv, 24, 86, 24, 3, shade(spec.armor, 0.35)); box(cv, 80, 86, 24, 3, shade(spec.armor, 0.35));
  box(cv, 27, 92, 3, 3, spec.trim); box(cv, 98, 92, 3, 3, spec.trim);
  // Upper chassis cuirass
  bevelBox(cv, 42, 84, 44, 44, spec.trim, '#090b0e');
  box(cv, 46, 86, 36, 4, shade(spec.trim, 0.28));
  // Neck column + braided cable conduits
  box(cv, 53, 66, 22, 20, '#11151b');
  box(cv, 56, 68, 4, 16, '#48525c'); box(cv, 68, 68, 4, 16, '#48525c');
  box(cv, 62, 68, 4, 16, '#272f38');
  // Bearframe Chest Emblem (ONLY Miya!) or Legacy Chest Vent
  if (spec.bearframe) {
    bevelBox(cv, 50, 93, 28, 22, '#0e151d', '#293846');
    radialGlow(cv, 64, 104, 16, spec.glow, 0.52);
    box(cv, 57, 100, 14, 9, spec.glow);
    box(cv, 55, 97, 4, 4, spec.glow); box(cv, 69, 97, 4, 4, spec.glow);
    box(cv, 61, 103, 6, 3, '#ebffff');
  } else {
    box(cv, 50, 97, 28, 10, '#0f1318');
    box(cv, 54, 101, 20, 2, spec.glow, 0.72);
    box(cv, 30, 95, 9, 1, '#0c0e12'); box(cv, 86, 104, 2, 8, '#0c0e12');
    if (spec.id !== 'talla') box(cv, 80, 96, 10, 6, '#6e472b', 0.45);
  }
  // Bearframe side-head display modules (ONLY Bearframes!)
  if (spec.bearframe) {
    bevelBox(cv, 31, 29, 11, 28, spec.trim, '#080a0d');
    bevelBox(cv, 86, 29, 11, 28, spec.trim, '#080a0d');
    radialGlow(cv, 36, 43, 10, spec.glow, 0.48); radialGlow(cv, 92, 43, 10, spec.glow, 0.48);
    box(cv, 34, 34, 5, 18, spec.glow); box(cv, 89, 34, 5, 18, spec.glow);
    box(cv, 35, 36, 2, 14, '#e6ffff'); box(cv, 90, 36, 2, 14, '#e6ffff');
  }
  // Sculpted Helmet Dome + Brow Rim + Chin Guard
  bevelBox(cv, 41, 18, 46, 52, spec.armor, '#080a0e');
  box(cv, 41, 18, 3, 3, spec.bg1); box(cv, 84, 18, 3, 3, spec.bg1); // chamfer crown corners
  box(cv, 45, 20, 38, 4, shade(spec.armor, 0.45));
  box(cv, 62, 19, 4, 16, shade(spec.armor, -0.18)); // center crest seam
  bevelBox(cv, 45, 35, 38, 22, '#0e1218', '#06080a');
  if (spec.visor === 'mono') {
    const ox = spec.id === 'rill' ? 69 : 64;
    radialGlow(cv, ox, 46, 14, spec.glow, 0.65);
    disc(cv, ox, 46, 7, spec.trim);
    disc(cv, ox, 46, 5, spec.glow);
    disc(cv, ox - 1, 44, 2, '#ffffff');
    if (spec.id === 'rill') { box(cv, 51, 39, 1, 15, '#07090b'); box(cv, 52, 45, 4, 1, '#07090b'); }
  } else if (spec.visor === 'visor') {
    box(cv, 61, 35, 6, 22, spec.armor);
    radialGlow(cv, 53, 46, 11, spec.glow, 0.48); radialGlow(cv, 75, 46, 11, spec.glow, 0.48);
    box(cv, 48, 43, 11, 5, spec.glow); box(cv, 69, 43, 11, 5, spec.glow);
    box(cv, 50, 44, 7, 2, '#ffffff'); box(cv, 71, 44, 7, 2, '#ffffff');
  } else {
    radialGlow(cv, 64, 46, 16, spec.glow, 0.45);
    box(cv, 49, 43, 30, 5, spec.glow);
    box(cv, 53, 44, 22, 2, '#f2ffff');
  }
  box(cv, 50, 61, 28, 6, shade(spec.armor, -0.22));
  box(cv, 54, 62, 20, 2, '#10141a');
  if (!spec.bearframe) {
    box(cv, 44, 27, 3, 2, spec.trim); box(cv, 81, 27, 3, 2, spec.trim);
    box(cv, 47, 63, 11, 2, '#734224', 0.72);
    if (spec.id === 'guardian') {
      box(cv, 43, 22, 10, 5, '#527834', 0.85);
      box(cv, 46, 20, 6, 4, '#6d9e46', 0.85);
    }
  }
  // Ornate Sea-of-Stars corner frame trim
  box(cv, 0, 0, 128, 2, spec.trim); box(cv, 0, 126, 128, 2, spec.trim);
  box(cv, 0, 0, 2, 128, spec.trim); box(cv, 126, 0, 2, 128, spec.trim);
  box(cv, 2, 2, 5, 5, spec.glow, 0.6); box(cv, 121, 2, 5, 5, spec.glow, 0.6);
  box(cv, 2, 121, 5, 5, spec.glow, 0.6); box(cv, 121, 121, 5, 5, spec.glow, 0.6);
  return cv;
}

// ---------------- 10 Sea-of-Stars Terrain Palettes (32x32) ----------------
const PALETTE_DEFS = {
  stasis_hollow:     { fl: ['#17242b', '#1b2b34', '#243a45', '#0e171c'], wl: ['#21323b', '#2d434f', '#3b5866', '#0c1317'], moss: '#4a7a42', rust: '#6e3d24', trim: '#70d2dc', backdrop: null },
  rootway_ruins:     { fl: ['#1f2b25', '#26352e', '#32453b', '#131b17'], wl: ['#2b3830', '#384a3f', '#4b6150', '#121915'], moss: '#5d913a', rust: '#754627', trim: '#84c256', backdrop: 'terrain' },
  relay_court:       { fl: ['#22272d', '#2a3038', '#353d47', '#14181d'], wl: ['#303842', '#3f4857', '#525f70', '#13171d'], moss: '#4e6c38', rust: '#8c4c26', trim: '#e09d38', backdrop: null },
  lantern_shelter:   { fl: ['#35281f', '#403025', '#4f3c2e', '#211812'], wl: ['#3f342c', '#524338', '#685548', '#1f1814'], moss: '#55783d', rust: '#8c4a26', trim: '#f5be58', backdrop: null },
  broken_rail:       { fl: ['#272623', '#312f2a', '#3d3a34', '#171614'], wl: ['#31373e', '#404852', '#535d69', '#14171c'], moss: '#5c803b', rust: '#944f28', trim: '#cfb058', backdrop: 'terrain' },
  survey_wetland:    { fl: ['#19282b', '#203336', '#2a4245', '#101b1d'], wl: ['#29393b', '#364b4d', '#486366', '#121c1e'], moss: '#5b9449', rust: '#754a2b', trim: '#56d8e3', backdrop: 'terrain' },
  census_archive:    { fl: ['#1f222b', '#272b36', '#313645', '#13151c'], wl: ['#2c313f', '#394152', '#4c556b', '#13161e'], moss: '#42613c', rust: '#6e492e', trim: '#c29e52', backdrop: null },
  quarantine_spine:  { fl: ['#1c2429', '#232c33', '#2d3840', '#11171b'], wl: ['#293338', '#35424a', '#465761', '#12171b'], moss: '#42633a', rust: '#7a4027', trim: '#eb913a', backdrop: null },
  control_cathedral: { fl: ['#171c27', '#1e2533', '#273042', '#0e121a'], wl: ['#242c3d', '#303b52', '#404e6b', '#0f131c'], moss: '#446848', rust: '#6b4730', trim: '#5adfff', backdrop: null },
  sky_morning:       { fl: ['#383e3b', '#454d49', '#56605b', '#242927'], wl: ['#4a5358', '#5e6970', '#77858c', '#282e33'], moss: '#6da849', rust: '#8c532e', trim: '#ffda75', backdrop: 'terrain' },
};

function makeFloorTile(def, seed = 0) {
  const cv = new PixelCanvas(32, 32);
  box(cv, 0, 0, 32, 32, def.fl[0]);
  // Offset ashlar flagstones with micro-bevels, mortar channels, and moss creeps
  const stones = [
    [0, 0, 18, 15], [18, 0, 14, 15],
    [0, 15, 11, 17], [11, 15, 21, 17]
  ];
  stones.forEach(([x, y, w, h], idx) => {
    const col = def.fl[(idx + seed) % 2 ? 1 : 0];
    box(cv, x + 1, y + 1, w - 2, h - 2, col);
    box(cv, x + 1, y + 1, w - 2, 1, def.fl[2]);
    box(cv, x + 1, y + 1, 1, h - 2, def.fl[2], 0.72);
    box(cv, x, y + h - 1, w, 1, def.fl[3]);
    box(cv, x + w - 1, y, 1, h, def.fl[3]);
    box(cv, x + 3, y + 3, 2, 1, def.trim, 0.14);
  });
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const n = hsh(x, y, seed + 11);
    if (n > 0.87) pxSet(cv, x, y, def.fl[2], 0.5);
    else if (n < 0.08) pxSet(cv, x, y, def.fl[3], 0.6);
    if ((x + y * 0.4) < 8 && hsh(x, y, 3 + seed) > 0.42) pxSet(cv, x, y, def.moss, 0.78);
    if (x > 24 && y < 7 && hsh(x, y, 9 + seed) > 0.5) pxSet(cv, x, y, def.rust, 0.65);
  }
  return cv;
}

function makeWallTile(def, seed = 0) {
  const cv = new PixelCanvas(32, 32);
  box(cv, 0, 0, 32, 32, def.wl[0]);
  // Layered coping blocks + carved dado rail + mossy overhangs + shadow base
  box(cv, 0, 0, 32, 6, def.wl[2]);
  box(cv, 0, 0, 32, 2, shade(def.wl[2], 0.3));
  box(cv, 0, 6, 32, 1, def.wl[3]);
  for (let bx = 0; bx < 32; bx += 16) {
    box(cv, bx + 1, 8, 14, 15, def.wl[1]);
    box(cv, bx + 1, 8, 14, 1, def.wl[2], 0.8);
    box(cv, bx + 15, 7, 1, 17, def.wl[3]);
    box(cv, bx + 3, 11, 2, 2, def.wl[3]); box(cv, bx + 11, 11, 2, 2, def.wl[3]);
  }
  box(cv, 0, 23, 32, 2, def.trim, 0.6);
  box(cv, 0, 25, 32, 7, def.wl[3]);
  for (let x = 1; x < 31; x += 2) {
    if (hsh(x, seed, 21) > 0.52) {
      const len = 4 + ((hsh(x, 7, seed) * 9) | 0);
      box(cv, x, 5, 2, len, shade(def.moss, -0.2), 0.9);
      box(cv, x, 6, 1, Math.max(2, len - 2), def.moss, 0.95);
    }
  }
  return cv;
}

// ---------------- 7 Animated Doorway Sets (64x64 / 32x64) ----------------
const DOOR_DEFS = {
  service:        { w: 64, h: 64, frame: '#3d454d', panel: '#59636d', trim: '#c79a48', lightClosed: '#ff4e3a', lightOpen: '#6cf0a8' },
  overgrown:      { w: 64, h: 64, frame: '#323f35', panel: '#495c4e', trim: '#5d8c42', lightClosed: '#e88b3a', lightOpen: '#7dffb0' },
  elevator:       { w: 64, h: 64, frame: '#2c343d', panel: '#485463', trim: '#46c6d9', lightClosed: '#ffb020', lightOpen: '#56f0d8' },
  archive_seal:   { w: 64, h: 64, frame: '#2c2f3b', panel: '#4a5063', trim: '#b8964e', lightClosed: '#ff5238', lightOpen: '#72f0e0' },
  cathedral_gate: { w: 64, h: 64, frame: '#232836', panel: '#3a455e', trim: '#58d4eb', lightClosed: '#ff7038', lightOpen: '#72f5ff' },
  roof_hatch:     { w: 32, h: 64, frame: '#363b42', panel: '#545b66', trim: '#d6a44e', lightClosed: '#ff4e3a', lightOpen: '#7dffb0' },
  water_lock:     { w: 64, h: 64, frame: '#28383d', panel: '#3d565e', trim: '#4ac8d8', lightClosed: '#ff9632', lightOpen: '#68f2c8' },
};

function makeDoorPair(spec) {
  const mk = (open) => {
    const cv = new PixelCanvas(spec.w, spec.h);
    const pad = 6, ix = pad, iy = 8, iw = spec.w - pad * 2, ih = spec.h - 10;
    bevelBox(cv, 2, 4, spec.w - 4, spec.h - 4, spec.frame, '#090b0f');
    box(cv, ix, iy, iw, ih, '#070a0d');
    const col = open ? spec.lightOpen : spec.lightClosed;
    if (open) {
      radialGlow(cv, spec.w / 2, spec.h / 2, 26, col, 0.42);
      box(cv, ix + 1, iy + 1, 5, ih - 2, spec.panel);
      box(cv, ix + iw - 6, iy + 1, 5, ih - 2, spec.panel);
      box(cv, ix + 6, iy + 2, iw - 12, ih - 4, col, 0.14);
      box(cv, ix + 6, iy + 1, iw - 12, 3, col, 0.65);
    } else {
      const half = Math.floor(iw / 2);
      bevelBox(cv, ix, iy, half, ih, spec.panel, '#0b0e12');
      bevelBox(cv, ix + half, iy, iw - half, ih, spec.panel, '#0b0e12');
      box(cv, ix + 4, iy + 14, iw - 8, 4, spec.trim, 0.9);
      box(cv, ix + 4, iy + ih - 18, iw - 8, 4, spec.trim, 0.9);
      box(cv, ix + half - 1, iy + 4, 2, ih - 8, '#0c1014');
    }
    box(cv, spec.w / 2 - 5, 2, 10, 4, '#101419');
    box(cv, spec.w / 2 - 4, 3, 8, 2, col);
    radialGlow(cv, spec.w / 2, 4, 10, col, 0.48);
    return cv;
  };
  return { closed: mk(false), open: mk(true) };
}

function paintSpriteOn(cv, ox, oy, w, h, fn) {
  const s = new PixelCanvas(w, h);
  fn(s);
  cv.getContext().drawImage(s, ox, oy);
}

function buildAtlases() {
  // 1. atlas_ruins_flora (512x512)
  const ruins = new PixelCanvas(512, 512);
  // (0,0) 64x96 Stasis Cryo-Pod (detailed armored chamber + condensation glass)
  paintSpriteOn(ruins, 0, 0, 64, 96, s => {
    bevelBox(s, 6, 8, 52, 84, '#2a3940', '#0a0f13');
    bevelBox(s, 10, 4, 44, 10, '#3e525c', '#0b1014');
    bevelBox(s, 13, 18, 38, 56, '#10242c', '#080f14');
    radialGlow(s, 32, 45, 26, '#5ae6f2', 0.62);
    // Faint sleeper silhouette inside frosty glass
    box(s, 27, 26, 10, 12, '#7ce8f5', 0.28);
    box(s, 24, 39, 16, 22, '#6cd5e8', 0.24);
    for (let y = 20; y < 72; y += 3) box(s, 16, y, 32, 1, '#9cf7ff', 0.36);
    box(s, 16, 20, 4, 48, '#e8ffff', 0.25); // glass specular streak
    bevelBox(s, 11, 74, 42, 16, '#394850', '#0a0e12');
    box(s, 18, 80, 10, 4, '#6cf2b8'); box(s, 36, 80, 10, 4, '#f2b857');
  });
  // (64,0) 64x64 Broken Stasis Pod / Browned Circuitry + moss
  paintSpriteOn(ruins, 64, 0, 64, 64, s => {
    bevelBox(s, 6, 6, 52, 54, '#2a2e32', '#0a0c0e');
    box(s, 12, 12, 40, 32, '#090c0e');
    box(s, 16, 16, 16, 24, '#6b3e22', 0.85);
    box(s, 32, 22, 16, 2, '#f29f33', 0.9);
    for (let x = 10; x < 52; x += 4) {
      const len = 5 + ((x * 7) % 9);
      box(s, x, 6, 3, len, '#466b2d'); box(s, x + 1, 7, 1, len - 2, '#6ca646');
    }
    box(s, 16, 48, 32, 6, '#3a4248'); box(s, 28, 50, 8, 2, '#ff4d3a');
  });
  // (128,0) 32x32 Protected Chip Case
  paintSpriteOn(ruins, 128, 0, 32, 32, s => {
    bevelBox(s, 3, 5, 26, 22, '#415249', '#0a0e0c');
    box(s, 7, 9, 18, 14, '#13211b');
    radialGlow(s, 16, 16, 9, '#7dffb0', 0.65);
    box(s, 12, 12, 8, 8, '#a6ffd0');
    box(s, 14, 14, 4, 4, '#ffffff');
  });
  // (160,0) 96x64 Gnarled Root Mass with bark highlights & leaf tufts
  paintSpriteOn(ruins, 160, 0, 96, 64, s => {
    for (let i = 0; i < 6; i++) {
      const rx = 10 + i * 14;
      for (let y = 4; y < 60; y++) {
        const x = rx + Math.round(Math.sin(y * 0.14 + i) * 6);
        box(s, x - 1, y, 9, 2, '#1c120a');
        box(s, x, y, 7, 2, i % 2 ? '#543c28' : '#694b32');
        box(s, x + 1, y, 2, 2, '#8a6949', 0.75);
        if (y % 6 === 0) { box(s, x + 2, y - 1, 5, 3, '#4c7a32'); box(s, x + 3, y - 1, 2, 2, '#73b34b'); }
      }
    }
  });
  // (256,0) 64x64 Dripping Pipe Manifold
  paintSpriteOn(ruins, 256, 0, 64, 64, s => {
    bevelBox(s, 4, 6, 56, 16, '#3e4e56', '#0b0e12');
    bevelBox(s, 10, 22, 12, 38, '#323f45', '#0a0d10');
    bevelBox(s, 42, 22, 12, 38, '#323f45', '#0a0d10');
    box(s, 14, 11, 36, 5, '#784a2a');
    box(s, 12, 44, 8, 12, '#4e7a3c');
    box(s, 28, 30, 6, 10, '#46b5c7', 0.55);
  });
  // (320,0) 32x32 Bioluminescent Moss / Ferns (ground layer!)
  paintSpriteOn(ruins, 320, 0, 32, 32, s => {
    for (let i = 0; i < 9; i++) {
      const fx = 4 + (i * 5) % 24, fy = 5 + ((i * 7) % 20);
      box(s, fx - 1, fy + 1, 6, 4, '#244520', 0.85);
      box(s, fx, fy, 5, 4, '#3d7032'); box(s, fx + 1, fy + 1, 3, 2, '#6eb852');
      if (i % 3 === 0) { pxSet(s, fx + 2, fy, '#a4ffd8'); radialGlow(s, fx + 2, fy, 6, '#54e6b8', 0.5); }
    }
  });
  // (352,0) 64x32 Rainwater / Coolant Puddle (ground layer!)
  paintSpriteOn(ruins, 352, 0, 64, 32, s => {
    for (let dy = -10; dy <= 10; dy++) for (let dx = -24; dx <= 24; dx++) {
      const q = (dx * dx) / 576 + (dy * dy) / 100;
      if (q <= 1) {
        pxSet(s, 32 + dx, 16 + dy, q > 0.75 ? '#0e242b' : '#19414d', 0.78);
        if (dy < -1 && (dx + dy) % 6 === 0) pxSet(s, 32 + dx, 16 + dy, '#88f0ff', 0.55);
      }
    }
  });
  // (416,0) 64x64 Hanging Moss & Ivy Canopy (foreground)
  paintSpriteOn(ruins, 416, 0, 64, 64, s => {
    for (let x = 1; x < 62; x += 3) {
      const len = 16 + ((hsh(x, 4, 2) * 40) | 0);
      box(s, x, 0, 3, len, '#264720', 0.92);
      box(s, x + 1, 1, 1, len - 3, '#63a147', 0.88);
      if (x % 9 === 0) pxSet(s, x + 1, len - 2, '#96edb8', 0.8);
    }
  });

  // 2. atlas_bunker_machinery (512x512)
  const mach = new PixelCanvas(512, 512);
  paintSpriteOn(mach, 0, 0, 32, 64, s => {
    bevelBox(s, 4, 6, 24, 52, '#3d454d', '#0b0e12');
    box(s, 8, 12, 16, 18, '#0b1419'); box(s, 11, 17, 10, 6, '#f5bd58');
    radialGlow(s, 16, 20, 10, '#f5bd58', 0.52);
    box(s, 9, 36, 14, 14, '#293038'); box(s, 12, 40, 8, 4, '#6cf2b8');
  });
  paintSpriteOn(mach, 32, 0, 96, 96, s => {
    bevelBox(s, 6, 8, 84, 80, '#39434d', '#0b0e12');
    disc(s, 32, 48, 22, '#11161c'); disc(s, 32, 48, 18, '#283138');
    box(s, 14, 46, 36, 4, '#5e6d7a'); box(s, 30, 30, 4, 36, '#5e6d7a');
    disc(s, 32, 48, 6, '#53e6f2');
    bevelBox(s, 60, 18, 24, 58, '#262f36', '#0a0d10');
    box(s, 64, 24, 16, 12, '#6cf2b8'); radialGlow(s, 72, 30, 13, '#6cf2b8', 0.45);
    box(s, 64, 44, 16, 24, '#141a1f');
  });
  paintSpriteOn(mach, 128, 0, 64, 64, s => {
    bevelBox(s, 4, 8, 56, 50, '#2e353d', '#0a0c10');
    box(s, 9, 13, 21, 15, '#0c1f24'); box(s, 34, 13, 21, 15, '#0c1f24');
    box(s, 12, 18, 14, 3, '#53e6f2'); box(s, 36, 18, 13, 3, '#f2b857');
    radialGlow(s, 19, 19, 10, '#53e6f2', 0.35);
    bevelBox(s, 9, 34, 46, 16, '#444e59', '#0b0d10');
  });
  paintSpriteOn(mach, 192, 0, 64, 64, s => {
    bevelBox(s, 6, 8, 22, 48, '#464d52', '#0b0d10');
    bevelBox(s, 36, 8, 22, 48, '#464d52', '#0b0d10');
    box(s, 10, 16, 14, 20, '#e0822d'); box(s, 40, 16, 14, 20, '#e0822d');
    radialGlow(s, 17, 26, 11, '#ffa938', 0.5); radialGlow(s, 47, 26, 11, '#ffa938', 0.5);
  });
  paintSpriteOn(mach, 256, 0, 64, 32, s => {
    for (let i = 0; i < 4; i++) {
      box(s, 0, 5 + i * 6, 64, 3, i % 2 ? '#1f262c' : '#3d3228');
      box(s, 12 + i * 11, 5 + i * 6, 6, 3, '#b5964f');
    }
  });
  paintSpriteOn(mach, 320, 0, 64, 32, s => {
    for (let x = 2; x < 62; x += 6) {
      box(s, x, 10, 3, 12, '#b08932', 0.88);
      box(s, x + 3, 10, 3, 12, '#181a1e', 0.88);
    }
  });

  // 3. atlas_shelter_warmth (512x512)
  const shelter = new PixelCanvas(512, 512);
  paintSpriteOn(shelter, 0, 0, 32, 64, s => {
    box(s, 12, 18, 8, 42, '#2d2824'); box(s, 14, 18, 3, 42, '#5e5348');
    bevelBox(s, 7, 5, 18, 15, '#635035', '#0e0b08');
    radialGlow(s, 16, 12, 16, '#ffd466', 0.78);
    box(s, 10, 8, 12, 9, '#ffeb9e');
  });
  paintSpriteOn(shelter, 32, 0, 64, 64, s => {
    bevelBox(s, 4, 18, 56, 40, '#573d29', '#140e09');
    box(s, 6, 20, 52, 14, '#7a573b');
    box(s, 12, 24, 16, 4, '#92a8b2'); box(s, 36, 23, 12, 6, '#e6ae55');
  });
  paintSpriteOn(shelter, 96, 0, 64, 32, s => {
    bevelBox(s, 4, 4, 24, 24, '#59422c', '#120d08');
    bevelBox(s, 30, 6, 28, 22, '#3b5954', '#0e1614');
    box(s, 32, 8, 24, 4, '#547d76');
  });
  paintSpriteOn(shelter, 160, 0, 96, 64, s => {
    bevelBox(s, 4, 4, 88, 56, '#6e322c', '#26100e');
    box(s, 10, 10, 76, 44, '#944a3b');
    box(s, 16, 16, 64, 32, '#b07240', 0.72);
    box(s, 22, 22, 52, 20, '#d19852', 0.4);
  });
  paintSpriteOn(shelter, 256, 0, 64, 64, s => {
    bevelBox(s, 8, 28, 24, 24, '#8c7253', '#1c150e');
    bevelBox(s, 32, 32, 22, 20, '#786248', '#1c150e');
    bevelBox(s, 16, 10, 22, 20, '#a38964', '#1c150e');
    box(s, 20, 18, 12, 3, '#cf5e3a');
  });

  // 4. atlas_archive_cathedral (512x512)
  const arch = new PixelCanvas(512, 512);
  paintSpriteOn(arch, 0, 0, 64, 96, s => {
    bevelBox(s, 4, 6, 56, 84, '#2a2e38', '#0a0b10');
    for (let y = 12; y < 80; y += 16) {
      box(s, 8, y + 12, 48, 2, '#7a653e');
      for (let x = 10; x < 52; x += 5) {
        box(s, x, y, 4, 12, hsh(x, y, 2) > 0.5 ? '#567a76' : '#856648');
      }
    }
  });
  paintSpriteOn(arch, 64, 0, 64, 96, s => {
    bevelBox(s, 10, 4, 44, 88, '#283140', '#0a0d14');
    box(s, 24, 10, 16, 76, '#141c29');
    radialGlow(s, 32, 48, 20, '#53e6f2', 0.55);
    box(s, 29, 14, 6, 68, '#53e6f2', 0.9);
  });
  paintSpriteOn(arch, 128, 0, 96, 96, s => {
    bevelBox(s, 10, 6, 76, 84, '#28303b', '#0a0d12');
    disc(s, 48, 48, 24, '#0d151c');
    radialGlow(s, 48, 48, 28, '#3fe8f5', 0.7);
    disc(s, 48, 48, 13, '#3fe8f5');
    disc(s, 48, 48, 5, '#e0ffff');
  });
  paintSpriteOn(arch, 224, 0, 32, 64, s => {
    bevelBox(s, 4, 12, 24, 46, '#333945', '#0b0d12');
    box(s, 9, 15, 14, 18, '#a68b4c');
    radialGlow(s, 16, 24, 11, '#ffd066', 0.58);
  });

  // 5. atlas_sky_rail (512x512)
  const sky = new PixelCanvas(512, 512);
  paintSpriteOn(sky, 0, 0, 128, 64, s => {
    bevelBox(s, 6, 10, 116, 42, '#4a3d35', '#100c0a');
    box(s, 10, 14, 108, 12, '#735640');
    box(s, 20, 28, 28, 10, '#222b33'); box(s, 76, 28, 28, 10, '#222b33');
    disc(s, 24, 52, 8, '#2b2d30'); disc(s, 46, 52, 8, '#2b2d30');
    disc(s, 82, 52, 8, '#2b2d30'); disc(s, 104, 52, 8, '#2b2d30');
  });
  paintSpriteOn(sky, 128, 0, 64, 96, s => {
    box(s, 8, 8, 6, 84, '#48525c'); box(s, 50, 8, 6, 84, '#48525c');
    for (let y = 16; y < 86; y += 18) bevelBox(s, 6, y, 52, 6, '#626d78', '#14181c');
    box(s, 28, 8, 8, 8, '#f5be58'); radialGlow(s, 32, 12, 14, '#f5be58', 0.55);
  });
  paintSpriteOn(sky, 192, 0, 64, 32, s => {
    box(s, 0, 6, 64, 6, '#5c666b'); box(s, 0, 6, 64, 2, '#8b989e');
    for (let x = 6; x < 64; x += 16) box(s, x, 12, 6, 18, '#464f54');
  });
  paintSpriteOn(sky, 256, 0, 32, 32, s => {
    for (let i = 0; i < 7; i++) {
      const fx = 4 + (i * 5) % 24, fy = 5 + (i * 7) % 20;
      box(s, fx, fy + 2, 2, 4, '#4e853d');
      box(s, fx - 1, fy, 4, 2, i % 2 ? '#ffd973' : '#9eeeff');
    }
  });
  paintSpriteOn(sky, 288, 0, 32, 64, s => {
    bevelBox(s, 10, 18, 12, 42, '#4f5861', '#101418');
    box(s, 12, 8, 8, 10, '#3fe3d4');
    radialGlow(s, 16, 13, 12, '#3fe3d4', 0.72);
  });

  return {
    atlas_ruins_flora: ruins,
    atlas_bunker_machinery: mach,
    atlas_shelter_warmth: shelter,
    atlas_archive_cathedral: arch,
    atlas_sky_rail: sky
  };
}

// ---------------- Execute Full Asset Generation ----------------
console.log('Generating Aeon Circuit sprites, portraits, tiles, doors & atlases into:', ROOT);

const manifestChars = [];
for (const ch of CHARACTERS) {
  const worldFile = `assets/world/${ch.id}.png`;
  const battleFile = `assets/battlers/${ch.id}.png`;
  const wSheet = ch.kind === 'human'
    ? renderHumanWorldSheet(ch.cfg, ch.ww, ch.wh, ch.bearframe)
    : renderMachineWorldSheet(ch.rig, ch.ww, ch.wh);
  const bSheet = ch.kind === 'human'
    ? renderHumanBattleSheet(ch.cfg, ch.bw, ch.bearframe)
    : renderMachineBattleSheet(ch.rig, ch.bw);
  await writePng(worldFile, wSheet);
  await writePng(battleFile, bSheet);
  manifestChars.push({
    id: ch.id,
    name: ch.name,
    world: {
      src: worldFile,
      frameWidth: ch.ww, frameHeight: ch.wh,
      columns: 9, rows: 4, idleColumn: 0, fps: 8,
      anchor: [Math.floor(ch.ww / 2), ch.wh],
      directions: ['down', 'left', 'right', 'up'],
      walkColumns: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    battle: {
      src: battleFile,
      frameWidth: ch.bw, frameHeight: ch.bw,
      columns: 6, rows: 9,
      animations: battleAnimTable()
    }
  });
}

await mkdir(ROOT, { recursive: true });
await writeFile(resolve(ROOT, 'asset-manifest.json'), JSON.stringify({
  schema: 'aeon.asset-library.v4',
  characters: manifestChars
}, null, 2));

for (const ps of PORTRAIT_SPECS) {
  await writePng(`portraits/${ps.id}.png`, renderPortrait(ps));
}

const envManifest = {
  schema: 'aeon.private-environment-art.v1',
  tileSize: 32,
  doorways: {},
  palettes: {},
  objects: {}
};

for (const [id, spec] of Object.entries(DOOR_DEFS)) {
  const { closed, open } = makeDoorPair(spec);
  const cPath = `assets/aeon/environment/doors/${id}_closed.png`;
  const oPath = `assets/aeon/environment/doors/${id}_open.png`;
  await writePng(`environment/doors/${id}_closed.png`, closed);
  await writePng(`environment/doors/${id}_open.png`, open);
  envManifest.doorways[id] = { closed: cPath, open: oPath };
}

let pIdx = 0;
for (const [id, def] of Object.entries(PALETTE_DEFS)) {
  const fPath = `assets/aeon/environment/terrain/${id}_floor.png`;
  const wPath = `assets/aeon/environment/terrain/${id}_wall.png`;
  await writePng(`environment/terrain/${id}_floor.png`, makeFloorTile(def, pIdx));
  await writePng(`environment/terrain/${id}_wall.png`, makeWallTile(def, pIdx));
  envManifest.palettes[id] = { floor: fPath, wall: wPath, ...(def.backdrop ? { backdrop: def.backdrop } : {}) };
  pIdx++;
}

const atlases = buildAtlases();
for (const [id, cv] of Object.entries(atlases)) {
  const aPath = `assets/aeon/environment/atlases/${id}.png`;
  await writePng(`environment/atlases/${id}.png`, cv);
  envManifest.objects[id] = aPath;
}

await mkdir(resolve(ROOT, 'environment'), { recursive: true });
await writeFile(resolve(ROOT, 'environment/environment-art.json'), JSON.stringify(envManifest, null, 2));
console.log(`Done! Generated ${manifestChars.length} character world+battle pairs, ${PORTRAIT_SPECS.length} portraits, ${Object.keys(DOOR_DEFS).length} door sets, ${Object.keys(PALETTE_DEFS).length} biome palettes, and ${Object.keys(atlases).length} scenery atlases.`);
