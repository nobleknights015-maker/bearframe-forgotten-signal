// Aeon Circuit Director's Cut v2 Storyboard Cinematics, Portraits, Callsign Customization,
// Dialogue Log, Speed Control, Save Terminals, Interactive Noncombat Encounters, and Epilogue Credits.

const ROOT = new URL('../../assets/aeon/', import.meta.url);
const $=id=>document.getElementById(id);

const SPEAKER_PORTRAIT_MAP = Object.freeze({
  GUARDIAN: 'guardian',
  PICA: 'pica',
  RILL: 'rill',
  MIYA: 'miya',
  NOLL: 'noll',
  VES: 'ves',
  ILEN: 'ilen',
  TALLA: 'talla',
  'WARD-7': 'ward7',
  'WARD-7 / VOICE SYNTHESIS': 'ward7',
  AUDITOR: 'registry_auditor',
  'OLD POD DISPLAY': 'system',
  SYSTEM: 'system'
});

export function portraitIdForSpeaker(speaker = '', starterId = 'sleeper_A') {
  const s = String(speaker || '').trim().toUpperCase();
  if (!s || s === 'SYSTEM' || s === 'OLD POD DISPLAY') return null;
  if (s === 'SLEEPER' || s.startsWith('SLEEPER ') || s === 'YOU') return starterId;
  for (const [prefix, id] of Object.entries(SPEAKER_PORTRAIT_MAP)) {
    if (s === prefix || s.startsWith(prefix)) return id === 'system' ? null : id;
  }
  return null;
}

const PRONOUN_SETS = Object.freeze({
  'they/them': { subj: 'they', obj: 'them', poss: 'their', copula: 'are' },
  'she/her': { subj: 'she', obj: 'her', poss: 'her', copula: 'is' },
  'he/him': { subj: 'he', obj: 'him', poss: 'his', copula: 'is' },
  'it/its': { subj: 'it', obj: 'it', poss: 'its', copula: 'is' }
});

export function formatCampaignDialogue(text = '', world = null) {
  const callsign = world?.stats?.callsign || 'SLEEPER';
  const pronKey = world?.stats?.pronouns || 'they/them';
  const p = PRONOUN_SETS[pronKey] || PRONOUN_SETS['they/them'];
  return String(text)
    .replaceAll('{CALLSIGN}', callsign)
    .replaceAll('{they}', p.subj)
    .replaceAll('{them}', p.obj)
    .replaceAll('{their}', p.poss)
    .replaceAll('{are}', p.copula);
}

export function formatCampaignSpeaker(speaker = '', world = null, starterId = 'sleeper_A') {
  const raw = String(speaker || 'SYSTEM').trim();
  if (raw.toUpperCase() === 'SLEEPER') {
    const cs = world?.stats?.callsign;
    return cs ? cs.toUpperCase() : starterId.replace('_', ' ').toUpperCase();
  }
  return raw.toUpperCase();
}

function drawStoryboardArt(canvas, shot, areaId, starterId) {
  if (!canvas || !shot) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.imageSmoothingEnabled = false;

  // Determine biome atmosphere from scene location / area
  const text = `${shot.framing} ${shot.art_and_vfx} ${shot.blocking_and_action}`.toLowerCase();
  const isSky = text.includes('sky') || text.includes('roof') || text.includes('horizon') || ['A13', 'A15', 'A17', 'A28'].includes(areaId);
  const isLantern = text.includes('lantern') || text.includes('amber') || text.includes('lamp') || ['A09', 'A10', 'A20'].includes(areaId);
  const isCathedral = text.includes('engine') || text.includes('cathedral') || ['A24', 'A25', 'A26'].includes(areaId);
  const isRoot = text.includes('root') || text.includes('moss') || text.includes('vine') || ['A02', 'A03', 'A04'].includes(areaId);

  // Sea of Stars twilight atmospheric backdrop gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  if (isSky) {
    grad.addColorStop(0, '#0f2035');
    grad.addColorStop(0.55, '#294c68');
    grad.addColorStop(1, '#5d4b58');
  } else if (isLantern) {
    grad.addColorStop(0, '#12151e');
    grad.addColorStop(0.6, '#262328');
    grad.addColorStop(1, '#14171c');
  } else if (isCathedral) {
    grad.addColorStop(0, '#0a0f18');
    grad.addColorStop(0.6, '#142234');
    grad.addColorStop(1, '#0c1218');
  } else if (isRoot) {
    grad.addColorStop(0, '#091518');
    grad.addColorStop(0.6, '#132826');
    grad.addColorStop(1, '#0b1815');
  } else {
    grad.addColorStop(0, '#091119');
    grad.addColorStop(0.6, '#162534');
    grad.addColorStop(1, '#0d141c');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Distant layered silhouettes (broken girders, towers, clouds, or roots)
  for (let i = 0; i < 12; i++) {
    const x = (i * 38 + 11) % W;
    const bh = 28 + ((i * 23) % 58);
    ctx.fillStyle = isSky ? 'rgba(20, 32, 48, 0.55)' : 'rgba(8, 13, 19, 0.72)';
    ctx.fillRect(x, H - 34 - bh, 18 + (i % 3) * 6, bh);
    if (i % 3 === 0) {
      ctx.fillStyle = isLantern ? 'rgba(242, 189, 117, 0.45)' : 'rgba(114, 220, 232, 0.35)';
      ctx.fillRect(x + 6, H - 28 - bh, 4, 2);
    }
  }

  // Horizon floor platform
  ctx.fillStyle = isRoot ? '#1d3228' : isSky ? '#2b3948' : '#18222d';
  ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = isLantern ? '#4e4231' : '#2e4154';
  ctx.fillRect(0, H - 36, W, 2);

  // Perspective grid lines on deck
  for (let gx = -40; gx < W + 40; gx += 32) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(gx, H - 34, 1, 34);
  }

  // Narrative motif elements matching framing
  if (text.includes('pod')) {
    for (let px = 64; px <= 300; px += 58) {
      const lit = px === 180;
      ctx.fillStyle = '#0e1720';
      ctx.fillRect(px, 34, 34, 80);
      ctx.fillStyle = lit ? '#27596e' : '#1b2836';
      ctx.fillRect(px + 2, 36, 30, 76);
      ctx.fillStyle = lit ? 'rgba(114, 220, 232, 0.5)' : 'rgba(90, 120, 140, 0.2)';
      ctx.fillRect(px + 6, 44, 22, 54);
      if (lit) {
        ctx.fillStyle = '#d8f9ff';
        ctx.fillRect(px + 12, 56, 10, 3);
      }
    }
  } else if (isLantern || text.includes('lamp')) {
    for (let lx = 54; lx <= 326; lx += 68) {
      const r = 34;
      const g = ctx.createRadialGradient(lx, 74, 2, lx, 74, r);
      g.addColorStop(0, 'rgba(255, 206, 120, 0.55)');
      g.addColorStop(1, 'rgba(255, 206, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - r, 74 - r, r * 2, r * 2);
      ctx.fillStyle = '#2d3540';
      ctx.fillRect(lx - 1, 32, 2, 40);
      ctx.fillStyle = '#f8cb7c';
      ctx.fillRect(lx - 4, 70, 8, 9);
    }
  } else if (isSky) {
    // Dawn horizon sun/clouds in Sea of Stars tones
    const sunG = ctx.createRadialGradient(255, 76, 4, 255, 76, 86);
    sunG.addColorStop(0, 'rgba(255, 214, 152, 0.72)');
    sunG.addColorStop(0.45, 'rgba(220, 130, 118, 0.28)');
    sunG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunG;
    ctx.fillRect(160, 0, 190, 140);
    // Cloud bands
    ctx.fillStyle = 'rgba(255, 226, 190, 0.22)';
    ctx.fillRect(42, 42, 108, 6);
    ctx.fillRect(218, 30, 124, 5);
    ctx.fillRect(130, 62, 86, 4);
  }

  // Hanging bioluminescent / pollen particles
  for (let p = 0; p < 22; p++) {
    const px = (p * 47 + 19) % W;
    const py = (p * 29 + 13) % (H - 38);
    ctx.fillStyle = isLantern ? 'rgba(255, 212, 130, 0.55)' : 'rgba(130, 232, 244, 0.45)';
    ctx.fillRect(px, py, 2, 2);
  }

  // Subtle letterbox bars for cinematic storyboard shot feel
  ctx.fillStyle = '#05080d';
  ctx.fillRect(0, 0, W, 10);
  ctx.fillRect(0, H - 10, W, 10);
  ctx.fillStyle = 'rgba(114, 220, 232, 0.35)';
  ctx.fillRect(0, 10, W, 1);
  ctx.fillRect(0, H - 11, W, 1);

  // Framing watermark label top-left
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#f2bd75';
  ctx.fillText(String(shot.framing || 'SCENE'), 12, 23);
  ctx.font = '8px monospace';
  ctx.fillStyle = '#b9cdd9';
  ctx.fillText(String(shot.blocking_and_action || '').slice(0, 56), 12, H - 16);
}

export function createCampaignCinematics({ game, ui, content, sfx, readWorld, commitWorld, narrativeRef }) {
  const SPEED_LEVELS = [1, 2, 10]; // 1x, 2x, INSTANT
  let speedIndex = 0;
  const reducedMotionKey = 'bearframe_aeon_reduced_motion';
  let reducedMotion = false;
  try {
    reducedMotion = localStorage.getItem(reducedMotionKey) === '1' ||
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  } catch {}
  document.body?.classList?.toggle('reduced-motion', reducedMotion);

  const backlog = [];
  const storyboardMap = new Map();
  for (const shot of content.storyboards || []) {
    if (!storyboardMap.has(shot.scene_id)) storyboardMap.set(shot.scene_id, []);
    storyboardMap.get(shot.scene_id).push(shot);
  }

  // Enhance UI typewriter speed non-destructively (ui.js itself remains locked/frozen)
  const origUpdate = ui.update.bind(ui);
  ui.update = dt => {
    const mult = SPEED_LEVELS[speedIndex] || 1;
    origUpdate(dt * mult);
  };

  const layer = $('cinematic-layer');
  const canvas = $('cinematic-canvas');
  const capText = $('cinematic-caption-text');
  const shotTag = $('cinematic-shot-tag');
  const portraitWrap = $('dialog-portrait-wrap');
  const portraitImg = $('dialog-portrait');
  const speedBtn = $('btn-dialog-speed');
  const logBtn = $('btn-dialog-log');
  const skipBtn = $('btn-dialog-skip');
  const hudLogBtn = $('campaign-log-btn');
  const motionBtn = $('set-motion');
  const modal = $('campaign-modal');

  const syncSpeedLabel = () => {
    if (!speedBtn) return;
    speedBtn.textContent = speedIndex === 2 ? 'INSTANT' : speedIndex === 1 ? 'SPEED 2X' : 'SPEED 1X';
  };
  const syncMotionLabel = () => {
    if (motionBtn) motionBtn.textContent = reducedMotion ? 'ON' : 'OFF';
    document.body?.classList?.toggle('reduced-motion', reducedMotion);
  };
  syncSpeedLabel();
  syncMotionLabel();

  if (motionBtn) {
    motionBtn.onclick = () => {
      reducedMotion = !reducedMotion;
      try { localStorage.setItem(reducedMotionKey, reducedMotion ? '1' : '0'); } catch {}
      syncMotionLabel();
      sfx?.blip?.();
    };
  }

  const updatePortrait = (speaker, starterId) => {
    if (!portraitWrap || !portraitImg) return;
    const pid = portraitIdForSpeaker(speaker, starterId);
    if (!pid) {
      portraitWrap.classList.add('empty');
      portraitImg.removeAttribute('src');
      return;
    }
    portraitWrap.classList.remove('empty');
    portraitImg.src = new URL('portraits/' + pid + '.png', ROOT).href;
    portraitImg.alt = speaker + ' portrait';
  };

  const showStoryboardShot = ({ sceneId, index = 0, total = 1, areaId = 'A00', starterId = 'sleeper_A' }) => {
    const shots = storyboardMap.get(sceneId);
    if (!shots || !shots.length || !layer || !canvas) {
      layer?.classList.add('hidden');
      return;
    }
    const shotIdx = Math.min(shots.length - 1, Math.floor((index / Math.max(1, total)) * shots.length));
    const shot = shots[shotIdx];
    layer.classList.remove('hidden');
    drawStoryboardArt(canvas, shot, areaId, starterId);
    if (capText) capText.textContent = (shot.audio_and_caption || shot.blocking_and_action || '').slice(0, 68);
    if (shotTag) shotTag.textContent = `SHOT ${String(shotIdx + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`;
  };

  const hideStoryboard = () => {
    layer?.classList.add('hidden');
    portraitWrap?.classList.add('empty');
  };

  const recordLine = ({ speaker, text, sceneId }) => {
    backlog.push({ speaker, text, sceneId, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (backlog.length > 160) backlog.shift();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.replaceChildren();
  };

  const openModal = (titleText, buildBody) => {
    if (!modal) return;
    const prevMode = game.mode;
    const panel = document.createElement('section');
    panel.className = 'panel campaign-wide';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    const head = document.createElement('div');
    head.className = 'case-head';
    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'menu-btn sm';
    closeBtn.textContent = 'CLOSE';
    const done = (restore = true) => {
      closeModal();
      if (restore && ['rpgmenu', 'dialog', 'choice'].includes(game.mode)) game.mode = prevMode;
    };
    closeBtn.onclick = () => done(true);
    head.append(h2, closeBtn);
    panel.append(head);
    buildBody(panel, () => done(true), closeModal);
    modal.replaceChildren(panel);
    modal.classList.remove('hidden');
    panel.querySelector('button,input')?.focus();
  };

  const openLogModal = () => {
    const entries = [...backlog].reverse();
    openModal('DIALOGUE ARCHIVE // RECENT TRANSMISSIONS', (panel, done) => {
      const list = document.createElement('ul');
      list.className = 'campaign-log-list';
      if (!entries.length) {
        const empty = document.createElement('li');
        empty.className = 'campaign-log-row';
        empty.textContent = 'No field dialogue recorded yet.';
        list.append(empty);
      } else {
        for (const item of entries) {
          const li = document.createElement('li');
          li.className = 'campaign-log-row';
          const sp = document.createElement('div');
          sp.className = 'campaign-log-speaker';
          sp.textContent = `${item.speaker} · ${item.sceneId || 'FIELD'}`;
          const tx = document.createElement('div');
          tx.textContent = item.text;
          li.append(sp, tx);
          list.append(li);
        }
      }
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'menu-btn sm';
      back.textContent = 'RESUME';
      back.onclick = done;
      panel.append(list, back);
    });
  };

  if (speedBtn) {
    speedBtn.addEventListener('pointerdown', e => e.stopPropagation());
    speedBtn.addEventListener('click', e => {
      e.stopPropagation();
      speedIndex = (speedIndex + 1) % SPEED_LEVELS.length;
      syncSpeedLabel();
      sfx?.blip?.();
    });
  }
  if (logBtn) {
    logBtn.addEventListener('pointerdown', e => e.stopPropagation());
    logBtn.addEventListener('click', e => { e.stopPropagation(); openLogModal(); });
  }
  if (hudLogBtn) hudLogBtn.addEventListener('click', () => openLogModal());
  if (skipBtn) {
    skipBtn.addEventListener('pointerdown', e => e.stopPropagation());
    skipBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!narrativeRef?.current) return;
      sfx?.beep?.();
      narrativeRef.current.skipActiveLines();
    });
  }

  // Callsign and Pronoun customization triggered at SC-001
  const promptCallsign = (world) => new Promise(resolve => {
    if (!modal) { resolve({ callsign: world?.stats?.callsign || 'Wren', pronouns: 'they/them' }); return; }
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    const h2 = document.createElement('h2');
    h2.textContent = 'CHASSIS IDENTITY // DESIGNATION';
    const note = document.createElement('p');
    note.className = 'fine';
    note.textContent = 'Guardian asks for a spoken designation so others can address you clearly.';
    const input = document.createElement('input');
    input.className = 'campaign-input';
    input.maxLength = 18;
    input.value = world?.stats?.callsign || 'Kestrel';
    input.setAttribute('aria-label', 'Sleeper Callsign');

    let selectedPronouns = world?.stats?.pronouns || 'they/them';
    const pRow = document.createElement('div');
    pRow.className = 'campaign-pronouns';
    const buttons = [];
    for (const p of Object.keys(PRONOUN_SETS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu-btn sm' + (p === selectedPronouns ? ' active' : '');
      b.textContent = p.toUpperCase();
      b.onclick = () => {
        selectedPronouns = p;
        for (const x of buttons) x.classList.remove('active');
        b.classList.add('active');
      };
      buttons.push(b);
      pRow.append(b);
    }
    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'menu-btn';
    confirm.textContent = 'CONFIRM DESIGNATION';
    confirm.onclick = () => {
      const callsign = (input.value || '').trim().replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 18) || 'Kestrel';
      closeModal();
      sfx?.beep?.();
      resolve({ callsign, pronouns: selectedPronouns });
    };
    panel.append(h2, note, input, pRow, confirm);
    modal.replaceChildren(panel);
    modal.classList.remove('hidden');
    input.focus();
  });

  // Save Terminal with Full Party Restoration + Discovered Sector Fast-Travel
  const openSaveTerminal = ({ areaName, journal, onHealAndSave, fastTravelTargets = [], onFastTravel }) => {
    openModal(`SAVE TERMINAL // ${areaName}`, (panel, done) => {
      const world = journal.readWorld();
      const strip = document.createElement('div');
      strip.className = 'campaign-party-strip';
      for (const m of world.party || []) {
        const chip = document.createElement('div');
        chip.className = 'campaign-party-chip';
        chip.textContent = `${m.name || m.id} LV${m.level || 1}\nHP ${m.hp}/${m.maxHp} · EP ${m.ep}/${m.maxEp}`;
        strip.append(chip);
      }
      const status = document.createElement('p');
      status.className = 'fine';
      status.textContent = 'Restores full party integrity & EP and writes a verified dual-record save.';

      const actions = document.createElement('div');
      actions.className = 'btn-row';
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'menu-btn';
      saveBtn.textContent = 'RECOVER & SAVE RECORD';
      saveBtn.onclick = () => {
        const ok = onHealAndSave();
        status.textContent = ok ? 'ALL UNITS RECOVERED AND RECORD VERIFIED.' : 'SAVE ERROR — RETRY';
        if (ok) {
          const updated = journal.readWorld();
          strip.replaceChildren();
          for (const m of updated.party || []) {
            const chip = document.createElement('div');
            chip.className = 'campaign-party-chip';
            chip.textContent = `${m.name || m.id} LV${m.level || 1}\nHP ${m.hp}/${m.maxHp} · EP ${m.ep}/${m.maxEp}`;
            strip.append(chip);
          }
        }
      };
      actions.append(saveBtn);
      panel.append(strip, status, actions);

      if (fastTravelTargets.length > 0) {
        const ftTitle = document.createElement('p');
        ftTitle.className = 'fine';
        ftTitle.textContent = 'RELAY TRANSIT // RETURN TO DISCOVERED SECTOR:';
        const ftRow = document.createElement('div');
        ftRow.className = 'campaign-puzzle-grid';
        for (const t of fastTravelTargets) {
          const tb = document.createElement('button');
          tb.type = 'button';
          tb.className = 'menu-btn sm';
          tb.textContent = `${t.id} ${t.name}`;
          tb.onclick = () => { done(); onFastTravel?.(t.id); };
          ftRow.append(tb);
        }
        panel.append(ftTitle, ftRow);
      }
    });
  };

  // Interactive noncombat puzzle / repair / social / escort / stealth challenge modal
  const openNoncombatEncounter = (spec, onResolved) => {
    openModal(`${spec.id} // ${String(spec.kind || 'PUZZLE').toUpperCase()}`, (panel, done) => {
      const desc = document.createElement('pre');
      desc.style.cssText = 'white-space:pre-wrap;font-size:calc(var(--u)*9.5);line-height:1.12';
      desc.textContent = `AREA: ${spec.area}\nUNITS / APPARATUS: ${spec.units}\nSITUATION: ${spec.setup}\nTELEGRAPH: ${spec.telegraph}\nOBJECTIVE: ${spec.win_condition}`;

      const feedback = document.createElement('p');
      feedback.className = 'fine';
      feedback.textContent = `TACTIC: ${spec.planned_tactics}`;

      // Build interactive 3-step sequence or tactical choice puzzle
      const row = document.createElement('div');
      row.className = 'btn-row';
      let step = 0;
      const sequence = ['OBSERVE TELEGRAPH', 'ALIGN CIRCUIT', 'COMPLETE ACTION'];
      const hintSteps = spec.kind === 'stealth' || spec.kind === 'stealth_or_resource'
        ? ['TRACK CONE CYCLE', 'TIMED CROSSING', 'HOLD SILENCE']
        : spec.kind === 'social' || spec.kind === 'ethical' || spec.kind === 'cooperation'
          ? ['LISTEN CAREFULLY', 'STATE HONEST FACT', 'RESPECT CONSENT']
          : sequence;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-btn';
      btn.textContent = `STEP 1: ${hintSteps[0]}`;
      btn.onclick = () => {
        step++;
        if (step < hintSteps.length) {
          sfx?.blip?.();
          btn.textContent = `STEP ${step + 1}: ${hintSteps[step]}`;
          feedback.textContent = `PROGRESS ${step}/${hintSteps.length} — ${spec.alternate || spec.win_condition}`;
        } else {
          sfx?.pickup?.();
          done();
          onResolved(spec);
        }
      };

      const alt = document.createElement('button');
      alt.type = 'button';
      alt.className = 'menu-btn sm';
      alt.textContent = 'CAREFUL BYPASS';
      alt.onclick = () => {
        sfx?.pickup?.();
        done();
        onResolved(spec);
      };
      row.append(btn, alt);
      panel.append(desc, feedback, row);
    });
  };

  const openEpilogueCredits = (world, stats = {}) => {
    const resolution = world?.narrative?.enums?.final_resolution || 'reclassify';
    const rillTrust = (world?.flags?.trust_rill_1 ? 1 : 0) + (world?.flags?.trust_rill_2 ? 1 : 0);
    const miyaTrust = (world?.flags?.trust_miya_1 ? 1 : 0) + (world?.flags?.miya_marker_corrected ? 1 : 0);
    const completedQuests = Object.entries(world?.flags || {}).filter(([, v]) => v === true).length;
    openModal('AEON CIRCUIT: THE SILENT WAKE // EPILOGUE & CREDITS', (panel, done) => {
      const pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;font-size:calc(var(--u)*9.5);line-height:1.15;overflow:auto;max-height:calc(var(--u)*155)';
      pre.textContent =
`FIRST MORNING RECORDED
------------------------------------------
RESOLUTION ROUTE ....... ${resolution.toUpperCase()}
ARCHIVES ............... ${resolution === 'reclassify' ? 'PRESERVED WITH EXCEPTION RULE' : 'DARKENED BY MANUAL SEVERANCE'}
RILL STANDING .......... ${rillTrust >= 2 ? 'PERSONAL LETTER SENT' : 'FREED FROM RELAY LOOP'}
MIYA STANDING .......... ${miyaTrust >= 1 ? 'FIELD MAPS UPDATED TOGETHER' : 'SURVEY REPORT QUEUED'}
MILESTONES RECORDED .... ${completedQuests}
EXPEDITION TIME ........ ${Math.floor((stats.time || 0) / 60)}m ${Math.floor((stats.time || 0) % 60)}s

CREDITS
Engine Foundation ...... Ghost Signal JRPG Engine
Universe & Lore ........ Bearframe Lore Bible Revision 4.10
Screenplay ............. Aeon Circuit: The Silent Wake (Director's Cut v2)
Art & Sprites .......... Bearframe Sprite Studio & Sea-of-Stars Lighting Pipeline

Thank you for walking carefully across the dawn.`;
      const cont = document.createElement('button');
      cont.type = 'button';
      cont.className = 'menu-btn';
      cont.textContent = 'CONTINUE FREE EXPLORATION';
      cont.onclick = done;
      panel.append(pre, cont);
    });
  };

  return Object.freeze({
    updatePortrait,
    showStoryboardShot,
    hideStoryboard,
    recordLine,
    openLogModal,
    promptCallsign,
    openSaveTerminal,
    openNoncombatEncounter,
    openEpilogueCredits
  });
}
