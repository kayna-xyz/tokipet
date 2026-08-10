'use strict';
// `pet statusline` — the ASCII companion strip under the Claude Code input box.
// One main companion lives in the bar: a PET (dog/owl/pig) or a SCENE
// (city / flower field) — scenes react to your coding behavior too.
// Ambient decos (cloud, tree) stack with anything.
// Token counting is cumulative since the skill was first enabled (never
// resets when a terminal opens). /CLIadd opens the config home.

const fs = require('fs');
const os = require('os');
const store = require('./state');
const { TokenSource } = require('./tokens');
const D = require('./data');
const { PETS, DECOS, PALETTE, petArt, petName, petColor } = require('./ascii');
const { tr } = require('./lang');

const esc = s => `\x1b[${s}m`;
const FG = ([r, g, b]) => esc(`38;2;${r};${g};${b}`);
const R = esc('0');
const GOLD = FG(PALETTE.gold);
const GREEN = FG([104, 170, 104]);
const GRAY = FG([136, 142, 155]);
const CORAL = FG(PALETTE.coral);
const BUBBLE = PALETTE.cream;

const H = 5; // strip height in rows (stats line excluded)

function run() {
  let sj = {};
  try { sj = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* optional */ }

  const state = store.load();

  // first run of the skill: stamp install time and skip pre-existing history
  // so the counter means "burned since you got the backyard", cumulatively.
  if (!state.installedAt) {
    state.installedAt = Date.now();
    if (!state.tokensTotal) new TokenSource(state).baseline();
    store.save(state);
  }

  const appAlive = Date.now() - (state.aliveAt || 0) < 30_000;
  const prevBurnAt = state.lastBurnAt || 0;

  // official rate-limit gauges ride along in the statusline stdin — persist
  // them (plus a token count for the current 7-day window) for the profile
  let dirty = false;
  if (sj.rate_limits && sj.rate_limits.seven_day) {
    const rl = sj.rate_limits;
    const wk = state.week || (state.week = { resetsAt: 0, tokens: 0 });
    if (wk.resetsAt !== rl.seven_day.resets_at) { wk.resetsAt = rl.seven_day.resets_at; wk.tokens = 0; dirty = true; }
    const gauges = { five: rl.five_hour && rl.five_hour.used_percentage, seven: rl.seven_day.used_percentage };
    if (!state.rateLimits || state.rateLimits.seven !== gauges.seven || state.rateLimits.five !== gauges.five) dirty = true;
    state.rateLimits = gauges;
  }

  let delta = 0;
  if (!appAlive) {
    const src = new TokenSource(state);
    try { delta = src.poll(); } catch { delta = 0; }
    if (delta > 0) {
      state.tokensTotal += delta;
      if (state.week) state.week.tokens += delta;
      // grind clock: time actively burning; gaps over 5 min don't count
      state.grindMs = (state.grindMs || 0) + Math.min(Date.now() - prevBurnAt, 5 * 60_000);
      state.lastBurnAt = Date.now();
      dirty = true;
    }
  }
  if (dirty) store.save(state);

  const t = state.tokensTotal;
  const lv = D.level(t);
  const petId = PETS[state.activePet] ? state.activePet : 'dog';
  const scene = state.scene && DECOS[state.scene] && DECOS[state.scene].type === 'scene' ? state.scene : null;

  // ---- mood / burn context ----
  const now = Date.now();
  const sinceBurn = now - (state.lastBurnAt || 0);
  const burning = delta > 0 || sinceBurn < 20_000;
  const alt = Math.floor(now / 1000) % 2 === 0;
  const tick = alt;
  const tick4 = Math.floor(now / 1000) % 4;
  let mood = 'idle', note = '';
  if (burning) {
    mood = 'happy';
    note = delta > 0 ? ` ${GOLD}+${D.fmt(delta)}` : ` ${GOLD}*`;
  } else if (sinceBurn > 30 * 60 * 1000) {
    mood = 'sleep';
    note = ` ${GRAY}zZ`;
  }

  // ---- lane width ----
  let width = state.stripWidth || 0;
  if (!width) {
    try {
      const out = require('child_process').execSync('(stty size < /dev/tty) 2>/dev/null', { timeout: 300, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      width = parseInt(out.trim().split(/\s+/)[1], 10) || 0;
    } catch { /* no tty */ }
  }
  if (!width) width = parseInt(process.env.COLUMNS, 10) || 110;
  width = Math.max(40, Math.min(width, 300));

  const span = Math.max(8, width - 22);
  const pingpong = (tm, speed) => {
    const ph = ((tm / 1000 * speed) % (span * 2)) / span;
    return { x: 2 + Math.round((ph < 1 ? ph : 2 - ph) * span), dir: ph < 1 ? 'right' : 'left' };
  };

  const SLOT = 10000;
  const slot = Math.floor(now / SLOT);
  const rng = n => Math.abs((Math.sin((slot + n) * 127.1) * 43758.5453) % 1);

  // ---- char-grid compositor with a parallel color plane ----
  // tint: rgb array, or a fn(ch) -> rgb for per-glyph coloring, or null.
  const grid = Array.from({ length: H }, () => []);
  const cgrid = Array.from({ length: H }, () => []);
  const ink = (tint, ch) => (typeof tint === 'function' ? tint(ch) : tint) || null;
  const put = (r, c, s, tint) => {
    if (r < 0 || r >= H) return;
    const row = grid[r], crow = cgrid[r];
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== ' ') { const at = Math.max(0, c + i); row[at] = s[i]; crow[at] = ink(tint, s[i]); }
    }
  };
  const putSolid = (r, c, s, tint) => {
    if (r < 0 || r >= H) return;
    const row = grid[r], crow = cgrid[r];
    const start = s.search(/\S/);
    if (start < 0) return;
    const end = s.length - 1 - [...s].reverse().join('').search(/\S/);
    for (let i = start; i <= end; i++) { const at = Math.max(0, c + i); row[at] = s[i]; crow[at] = ink(tint, s[i]); }
  };
  const tintOf = d => d.tint ? (ch => (d.tint.chars && d.tint.chars[ch]) || d.tint.base) : null;

  // the scene (if any) docks at the right edge — reserve its band first
  let sceneGeom = null;
  if (scene) {
    const w = Math.max(...DECOS[scene].rows.map(r => r.length));
    const cx = Math.max(1, width - w - 2);
    sceneGeom = { cx, w };
  }

  // ambient decorations first (behind everything); each slides left from its
  // natural spot until it stops overlapping the scene or a placed neighbor
  const bands = sceneGeom ? [[sceneGeom.cx, sceneGeom.cx + sceneGeom.w]] : [];
  for (const id of state.backyard || []) {
    const d = DECOS[id];
    if (!d || d.type !== 'ambient') continue;
    const w = Math.max(...d.rows.map(r => r.length));
    let dx = Math.round(width * d.xFrac);
    while (dx > 0 && bands.some(([a, b]) => dx + w >= a - 1 && dx <= b + 1)) dx--;
    bands.push([dx, dx + w]);
    const top = d.anchor === 'sky' ? 0 : H - d.rows.length;
    d.rows.forEach((r, i) => put(top + i, dx, r, tintOf(d)));
  }

  let act = 'scene', dir = 'left', x = 2;
  const L = tr(state);

  if (scene) {
    // ================= SCENE companion (reacts to your coding) =============
    const d = DECOS[scene];
    const tintFn = tintOf(d);
    const { cx, w } = sceneGeom;
    x = cx; dir = 'left';
    let rows = d.rows.slice();

    if (scene === 'city') {
      if (tick && d.smokeAlt) { rows[0] = d.smokeAlt[0]; rows[1] = d.smokeAlt[1]; } // boat smoke puffs
      // windows light up with your burn rate; the city sleeps when you do
      const minSlot = Math.floor(now / 60000);
      const p = burning ? 0.75 : sinceBurn < 5 * 60000 ? 0.35 : 0.08;
      for (let r = 0; r <= 3; r++) {
        rows[r] = rows[r].replace(/"/g, (m, off) => {
          const h = Math.abs(Math.sin((r * 131 + off * 17 + minSlot) * 12.9898) * 43758.5453) % 1;
          return h < p ? '#' : '"';
        });
      }
      rows.forEach((r, i) => put(H - rows.length + i, cx, r, tintFn));
      if (delta > 100000) { // fireworks over the skyline
        for (let i = 0; i < 4; i++) put(0, cx + 4 + Math.floor(rng(i + 2) * (w - 8)), ['*', '.', '+', '*'][i], PALETTE.gold);
      }
    } else if (scene === 'flowers') {
      // the blooms sway both ways while tokens burn; roots stay planted
      const sway = burning ? (tick ? 1 : -1) : 0;
      rows.forEach((r, i) => put(H - rows.length + i, cx + (i < 3 ? sway : 0), r, tintFn));
      if (burning && delta > 100000) {
        for (let i = 0; i < 3; i++) put(0, cx + 3 + Math.floor(rng(i + 4) * (w - 6)), '*', PALETTE.gold);
      }
      if (!burning && mood !== 'sleep') { // a butterfly visits while you think
        const bx = cx - 4 + Math.floor(((now / 1500) % (w + 8)));
        put(tick ? 0 : 1, bx, 'εз', PALETTE.pink);
      }
    }
  } else {
    // ================= PET companion =======================================
    const pdef = PETS[petId];
    const pcol = petColor(petId);
    const acts = ['walk', 'walk', 'walk', 'sit', 'bark', 'zoom', 'dig', 'spin', 'ball', 'eat', 'jump', 'chat'];
    act = acts[Math.floor(rng(0) * acts.length)];

    const forced = state.forcedAct && now < state.forcedAct.until ? state.forcedAct.act : null;
    if (forced === 'sleep') mood = 'sleep';
    else if (forced && mood !== 'sleep') act = forced;

    // gentle speeds: ~1-2 columns between refreshes, zoomies twice that
    let fx = '', moving = false;
    if (mood === 'sleep') {
      ({ x, dir } = pingpong(slot * SLOT, 3));
    } else if (mood === 'happy' && !forced) {
      ({ x, dir } = pingpong(now, 3)); moving = true;
    } else if (act === 'walk') {
      ({ x, dir } = pingpong(now, 2)); moving = true;
    } else if (act === 'zoom') {
      ({ x, dir } = pingpong(now, 6)); moving = true; fx = tick ? ' !!' : ' !';
    } else {
      ({ x, dir } = pingpong(slot * SLOT, 3));
      if (act === 'sit') fx = tick ? '' : ' ~';
      else if (act === 'bark') fx = state.muted ? '' : (tick ? ' ' + L.barkWord[petId] : '');
      else if (act === 'dig') fx = tick ? ' *dig dig*' : ' *dig*';
      else if (act === 'spin') dir = tick ? 'left' : 'right';
      else if (act === 'ball' || act === 'eat') dir = 'right';
      else if (act === 'jump') fx = tick ? ' !' : '';
    }

    // animation clock: stationary poses tick with wall time, but anything
    // moving keys off ground covered — one stride (or wing-beat) per 2
    // columns, so legs always animate with travel however often we refresh
    const stepAlt = Math.floor(x / 2) % 2 === 0;
    const wagAlt = (act === 'sit' || act === 'bark') ? !tick : alt;
    const flying = !!pdef.fly && moving && mood !== 'sleep'; // owls travel airborne, wings flapping
    const pet = petArt(petId, mood, moving ? stepAlt : wagAlt, dir, moving);
    if (fx) pet[0] = pet[0] + fx;
    if (mood !== 'sleep' && mood !== 'happy' && !flying) {
      if (act === 'ball') {
        const dd = [2, 4, 6, 4][tick4];
        const row = Math.max(0, (dd === 6 ? pet.length - 3 : pet.length - 2));
        pet[row] = pet[row] + ' '.repeat(dd) + 'o';
      } else if (act === 'eat') {
        if (petId === 'cow') { // cows graze the pasture, they don't get a bowl
          pet[0] = pet[0] + (tick ? '  munch munch' : '  munch');
        } else {
          pet[pet.length - 1] = pet[pet.length - 1] + '  \\__/';
          pet[0] = pet[0] + (tick ? '  nom nom' : '  nom');
        }
      }
    }
    // the cow's pasture: tufts rooted at fixed spots — grass never moves
    if (petId === 'cow') {
      const tufts = [0.12, 0.3, 0.52, 0.74, 0.9].map(f => Math.round(width * f));
      tufts.forEach((tx, i) => putSolid(H - 1, tx, i % 2 ? '.,,' : ',.,', PALETTE.sage));
      if (act === 'eat' && mood !== 'sleep') {
        // grazing: walk up to the nearest tuft and eat it head-down
        const pw = Math.max(...pet.map(r => r.length));
        const tx = tufts.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
        x = Math.max(0, tx - pw + 2); // mouth (facing right) lands on the tuft
      }
    }
    // fliers bob between two altitudes with the wing-beat; jumpers hop one row
    const lift = flying ? (stepAlt ? 2 : 1) : (act === 'jump' && mood !== 'sleep' && tick ? 1 : 0);
    const petTop = H - pet.length - lift;
    pet.forEach((r, i) => putSolid(petTop + i, x, r, pcol));
  }

  // ---- speech bubbles (shared) ----
  const durMin = sj.cost && sj.cost.total_duration_ms ? sj.cost.total_duration_ms / 60000 : 0;
  let promptAge = Infinity;
  try {
    const ts = parseInt(fs.readFileSync(os.homedir() + '/.tokipet/last-prompt', 'utf8'), 10);
    promptAge = now / 1000 - ts;
  } catch { /* none */ }

  const prog = D.levelProgress(t);
  let bubble = null;
  const ackFresh = state.talkAckAt && now - state.talkAckAt < 15_000;
  if (ackFresh && !scene) bubble = state.talkAck;
  else if (!state.muted && mood !== 'sleep') {
    if (promptAge < 6) bubble = L.typing;
    else if (delta > 0 && now - prevBurnAt > 90_000) bubble = L.cheer;
    else if (delta > 100000) bubble = L.bigburn;
    else if (durMin > 90 && slot % 12 < 2) bubble = L.rest((durMin / 60).toFixed(1));
    else if (prog > 0.92) bubble = L.almostLv(lv + 1);
    else if (prog < 0.03 && mood === 'happy') bubble = L.levelUp(lv);
    else if (!scene && act === 'chat') {
      const pool = [L.sounds[petId], ...L.chatter];
      bubble = pool[Math.floor(rng(7) * pool.length)];
    }
  }
  if (bubble) {
    const bx = Math.max(0, scene ? 2 : (dir === 'right' ? x + 8 : x));
    putSolid(0, bx, '( ' + bubble + ' )', BUBBLE);
    if (!scene) put(1, dir === 'right' ? x + 10 : x + 3, dir === 'right' ? '\\' : '/', BUBBLE);
  }

  // ---- stats line ----
  const who = scene ? DECOS[scene].name : petName(petId);
  const fill = Math.round(8 * prog);
  const bar = GREEN + '▰'.repeat(fill) + GRAY + '▱'.repeat(8 - fill);
  const cost = sj.cost && sj.cost.total_cost_usd != null ? ` ${GRAY}$${sj.cost.total_cost_usd.toFixed(2)}${R}` : '';
  let badge = '';
  if (state.showBadge && (state.claimedBadges || []).includes(state.showBadge)) {
    const b = D.BADGES.find(x => x.id === state.showBadge);
    if (b) badge = ` ${GOLD}${b.icon} ${D.badgeName(b, state)}${R}`;
  }
  const stats = `${CORAL}${who}${R} Lv.${lv}${badge} ${bar}${R} ${GRAY}${D.fmt(t)} tok${R}${cost}${note}${R} ${GRAY}(/CLIadd /talktopet)${R}`;

  // ---- render: emit color escapes only when the run's color changes ----
  const lines = grid.map((row, r) => {
    let out = '⠀', cur = '';
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (!ch || ch === ' ') { out += ' '; continue; }
      const col = cgrid[r][i];
      const key = col ? col.join() : '';
      if (key !== cur) { out += col ? FG(col) : R; cur = key; }
      out += ch;
    }
    return out.replace(/\s+$/, '') + R;
  });
  process.stdout.write([...lines, stats].join('\n'));
}

module.exports = { run };
