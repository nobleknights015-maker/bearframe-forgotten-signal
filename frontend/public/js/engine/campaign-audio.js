// Procedural WebAudio biome themes, combat cues, and SFX helper for Aeon Circuit.
// Uses pure WebAudio synthesis atop existing Sfx without altering Ghost Signal's audio.js.

const BIOME_SCALES = Object.freeze({
  stasis: { notes: [220, 261.6, 329.6, 392, 440], tempoMs: 680, wave: 'triangle', vol: 0.042 },
  rootway: { notes: [196, 233.1, 293.7, 349.2, 466.2], tempoMs: 560, wave: 'sine', vol: 0.045 },
  relay: { notes: [246.9, 293.7, 370.0, 440, 493.9], tempoMs: 490, wave: 'triangle', vol: 0.040 },
  lantern: { notes: [261.6, 329.6, 392.0, 493.9, 587.3], tempoMs: 540, wave: 'sine', vol: 0.048 },
  sky: { notes: [293.7, 349.2, 440.0, 523.3, 659.3], tempoMs: 620, wave: 'triangle', vol: 0.045 },
  archive: { notes: [174.6, 207.7, 261.6, 311.1, 392.0], tempoMs: 600, wave: 'sine', vol: 0.042 },
  cathedral: { notes: [146.8, 174.6, 220.0, 261.6, 329.6], tempoMs: 660, wave: 'sawtooth', vol: 0.025 },
  combat: { notes: [164.8, 196.0, 246.9, 293.7, 329.6, 392.0], tempoMs: 250, wave: 'square', vol: 0.028 },
  boss: { notes: [130.8, 155.6, 196.0, 207.7, 261.6, 311.1], tempoMs: 210, wave: 'sawtooth', vol: 0.032 },
  ending: { notes: [261.6, 329.6, 392.0, 523.3, 659.3, 784.0], tempoMs: 520, wave: 'triangle', vol: 0.05 }
});

const AREA_THEME_MAP = Object.freeze({
  A00: 'stasis', A01: 'stasis',
  A02: 'rootway', A03: 'rootway', A04: 'rootway',
  A05: 'relay', A06: 'relay', A07: 'relay', A08: 'relay',
  A09: 'lantern', A10: 'lantern', A11: 'lantern',
  A12: 'sky', A13: 'sky', A14: 'sky', A15: 'sky', A16: 'sky', A17: 'sky',
  A18: 'archive', A19: 'archive', A20: 'lantern',
  A21: 'archive', A22: 'relay', A23: 'archive',
  A24: 'cathedral', A25: 'cathedral', A26: 'cathedral',
  A27: 'sky', A28: 'ending'
});

export function createCampaignAudio(sfx) {
  let theme = null;
  let timer = null;
  let step = 0;
  let muted = false;

  const stopMusic = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const playNote = () => {
    if (muted || !theme || !sfx?.ctx || sfx.ctx.state !== 'running') return;
    const spec = BIOME_SCALES[theme] || BIOME_SCALES.stasis;
    const freq = spec.notes[(step + Math.floor(step / 4)) % spec.notes.length];
    const harmonic = step % 4 === 0 ? freq * 0.5 : null;
    sfx.tone(freq, (spec.tempoMs / 1000) * 0.82, spec.wave, spec.vol, null, 0);
    if (harmonic) {
      sfx.tone(harmonic, (spec.tempoMs / 1000) * 1.4, 'sine', spec.vol * 0.7, null, 0.04);
    }
    step++;
  };

  const setTheme = next => {
    if (next === theme && timer) return;
    theme = BIOME_SCALES[next] ? next : 'stasis';
    stopMusic();
    step = 0;
    const spec = BIOME_SCALES[theme];
    timer = setInterval(playNote, spec.tempoMs);
  };

  return Object.freeze({
    themeForArea: areaId => AREA_THEME_MAP[areaId] || 'stasis',
    setTheme,
    setAreaTheme: areaId => setTheme(AREA_THEME_MAP[areaId] || 'stasis'),
    setMuted: on => { muted = !!on; },
    get currentTheme() { return theme; },
    battleStrike: () => { sfx?.noise?.(0.12, 0.14, 1100); sfx?.tone?.(190, 0.16, 'sawtooth', 0.12, 85); },
    battlePulse: () => { sfx?.tone?.(420, 0.22, 'triangle', 0.12, 920); sfx?.tone?.(640, 0.18, 'sine', 0.08, 1280, 0.08); },
    battleRepair: () => { sfx?.tone?.(440, 0.12, 'sine', 0.09, 660); sfx?.tone?.(660, 0.18, 'triangle', 0.08, 880, 0.09); },
    battleGuard: () => { sfx?.tone?.(280, 0.16, 'square', 0.07, 360); },
    battleVictory: () => {
      sfx?.tone?.(523.3, 0.12, 'triangle', 0.11);
      sfx?.tone?.(659.3, 0.12, 'triangle', 0.11, null, 0.12);
      sfx?.tone?.(784.0, 0.24, 'triangle', 0.12, null, 0.24);
    },
    levelUp: () => {
      sfx?.tone?.(587.3, 0.1, 'triangle', 0.11);
      sfx?.tone?.(740.0, 0.1, 'triangle', 0.11, null, 0.1);
      sfx?.tone?.(880.0, 0.12, 'triangle', 0.11, null, 0.2);
      sfx?.tone?.(1174.7, 0.28, 'sine', 0.12, null, 0.32);
    },
    saveTerminal: () => {
      sfx?.charge?.();
      sfx?.tone?.(660, 0.16, 'sine', 0.09, 880, 0.12);
    },
    puzzleSolve: () => {
      sfx?.pickup?.();
    },
    stop: stopMusic
  });
}
