'use strict';
const SP = require('./sprites');
const { Canvas } = require('./canvas');
const term = require('./term');
const { TokenSource } = require('./tokens');
const store = require('./state');
const D = require('./data');
const { Pet, Scene } = require('./scene');
const { Win95 } = require('./win95');
const { makeGame } = require('./games');

const FPS = 8;
const WHITE = [240, 242, 246];
const INK = [16, 18, 26];
const GOLD = [255, 208, 74];
const DIM = [130, 140, 160];

class App {
  constructor(opts) {
    this.demo = !!opts.demo;
    this.startInMenu = !!opts.menu;
    this.state = store.load();
    this.source = new TokenSource(this.state, { demo: this.demo });
    this.cv = new Canvas(this.cols(), this.rowsAvail());
    this.pet = new Pet(this);
    this.scene = new Scene(this);
    this.win = null;         // Win95 instance when open
    this.game = null;        // active minigame
    this.mode = 'scene';
    this.tick = 0;
    this.floats = [];        // {px,py,vy,ttl, text?|sprite?}
    this.banners = [];       // unlock banners queue: {text, ttl}
    this.lastSave = Date.now();
    this.confetti = [];
  }

  cols() { return Math.max(60, Math.min(process.stdout.columns || 80, 160)); }
  rowsAvail() { return Math.max(16, Math.min(process.stdout.rows || 24, 44)); }
  groundTopY() { return this.cv.ph - 6; }

  // aliveAt heartbeat tells `pet statusline` that this app owns the token counter
  save() {
    if (this.demo) return; // demo is a sandbox
    this.state.aliveAt = Date.now();
    store.save(this.state);
  }
  bell() { process.stdout.write('\x07'); }

  // ------------------------------------------------------------ lifecycle
  async run() {
    term.enter();
    process.stdin.on('data', b => this.onInput(b));
    process.stdout.on('resize', () => {
      this.cv.resize(this.cols(), this.rowsAvail());
      process.stdout.write('\x1b[2J');
    });
    const quit = () => this.quit();
    process.on('SIGINT', quit);
    process.on('SIGTERM', quit);
    process.on('exit', () => term.leave());

    if (!this.state.firstRunDone) await this.intro();
    if (this.startInMenu) this.openWindow();

    this.timer = setInterval(() => this.frame(), 1000 / FPS);
    this.pollTimer = setInterval(() => this.pollTokens(), 2000);
    this.saveTimer = setInterval(() => this.save(), 15000); // heartbeat
    this.save();
  }

  quit() {
    clearInterval(this.timer);
    clearInterval(this.pollTimer);
    clearInterval(this.saveTimer);
    if (!this.demo) { this.state.aliveAt = 0; store.save(this.state); } // hand counter back to statusline
    term.leave();
    const lv = D.level(this.state.tokensTotal);
    console.log(`\n  your ${this.state.activePet} (Lv.${lv}) is waiting for you. ${D.fmt(this.state.tokensTotal)} tokens burned so far.\n`);
    process.exit(0);
  }

  // ------------------------------------------------------- first-run intro
  async intro() {
    const cv = this.cv;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const center = Math.floor(cv.rows / 2);

    // scan with progress bar
    let lastDraw = 0;
    const drawScan = (i, n, tok) => {
      cv.clear([24, 30, 58]);
      cv.txtCenter(center - 4, 'P E T . E X E', GOLD);
      cv.txtCenter(center - 2, 'scanning your token history...', WHITE);
      const w = 34;
      const f = n ? Math.round((i / n) * w) : w;
      cv.txtCenter(center, '[' + '█'.repeat(f) + '░'.repeat(w - f) + ']', [104, 190, 100]);
      cv.txtCenter(center + 2, `${D.fmt(tok)} tokens found`, DIM);
      process.stdout.write(cv.render());
    };
    drawScan(0, 1, 0);
    const res = await this.source.scanAll(async (i, n, tok) => {
      const now = Date.now();
      if (now - lastDraw > 60) { drawScan(i, n, tok); lastDraw = now; await sleep(1); }
    });
    this.state.tokensTotal = res.tokens;
    this.state.createdAt = Date.now();
    // mark existing unlocks as already-notified so we don't spam banners
    this.state.notifiedUnlocks = D.allUnlockables()
      .filter(u => res.tokens >= u.at).map(u => u.kind + ':' + u.id);
    drawScan(1, 1, res.tokens);
    await sleep(600);

    // egg hatch
    const lv = D.level(this.state.tokensTotal);
    const eggX = Math.floor(cv.pw / 2) - 6;
    const eggY = cv.ph - 8 - 12;
    const frames = [SP.EGG, SP.EGG, SP.EGG_CRACK1, SP.EGG, SP.EGG_CRACK1, SP.EGG_CRACK2, SP.EGG_CRACK2];
    for (let i = 0; i < frames.length; i++) {
      this.scene.draw(cv, i);
      const wob = i % 2 === 0 ? 0 : 1;
      cv.sprite(frames[i], eggX + wob, eggY);
      cv.txtCenter(2, res.tokens > 0
        ? `you have burned ${D.fmt(res.tokens)} tokens across ${res.sessions} sessions`
        : 'a wild egg appeared in your terminal', WHITE, INK);
      cv.txtCenter(3, 'something is hatching...', DIM, INK);
      process.stdout.write(cv.render());
      await sleep(i < 3 ? 450 : 280);
      this.bell();
    }
    // confetti + reveal
    for (let i = 0; i < 60; i++) {
      this.confetti.push({
        x: Math.random() * cv.pw, y: Math.random() * cv.ph * 0.4,
        vy: 0.4 + Math.random(), vx: (Math.random() - 0.5) * 0.6,
        c: [[255, 208, 74], [232, 72, 84], [104, 190, 100], [86, 132, 226], [255, 120, 190]][i % 5],
      });
    }
    for (let f = 0; f < 24; f++) {
      this.scene.draw(cv, f);
      const art = SP.PETS_ART.panda;
      const petH = art.idle.length;
      cv.sprite(f % 4 < 2 ? art.happy : art.idle, eggX - 4, this.groundTopY() - petH - (f < 6 ? (6 - f) : 0));
      for (const p of this.confetti) {
        p.x += p.vx; p.y += p.vy;
        cv.px(Math.round(p.x), Math.round(p.y), p.c);
      }
      cv.txtCenter(2, `IT'S A PANDA!  born at Lv.${lv}`, INK, GOLD);
      if (f > 8) cv.txtCenter(4, 'it grows every time Claude burns tokens', WHITE, INK);
      if (f > 14) cv.txtCenter(cv.rows - 2, 'click your pet to open the menu · press any key to start', WHITE, INK);
      process.stdout.write(cv.render());
      await sleep(120);
    }
    this.confetti = [];
    this.state.firstRunDone = true;
    this.save();
    await new Promise(resolve => {
      const h = () => { process.stdin.off('data', h); resolve(); };
      process.stdin.on('data', h);
    });
  }

  // ------------------------------------------------------------ token flow
  pollTokens() {
    const delta = this.source.poll();
    if (delta <= 0) return;
    const before = this.state.tokensTotal;
    this.state.tokensTotal += delta;
    this.onBurn(delta, before);
  }

  onBurn(delta, before) {
    const after = this.state.tokensTotal;
    this.state.lastBurnAt = Date.now();
    this.pet.excite();
    const cx = this.pet.x + this.pet.width() / 2;
    this.floats.push({
      px: cx, py: this.groundTopY() - this.pet.height() - 4,
      vy: -0.7, ttl: 18, text: '+' + D.fmt(delta), color: GOLD,
    });
    // level up?
    if (D.level(after) > D.level(before)) {
      this.banners.push({ text: `LEVEL UP! your pet is now Lv.${D.level(after)}`, ttl: FPS * 4 });
      this.bell();
    }
    // new unlocks?
    for (const u of D.allUnlockables()) {
      const key = u.kind + ':' + u.id;
      if (after >= u.at && before < u.at && !this.state.notifiedUnlocks.includes(key)) {
        this.state.notifiedUnlocks.push(key);
        const label = { pet: 'NEW PET', action: 'NEW MOVE', hat: 'NEW ITEM', game: 'NEW GAME' }[u.kind];
        this.banners.push({ text: `${label} UNLOCKED: ${u.name}!`, ttl: FPS * 5 });
        this.bell();
      }
    }
    if (Date.now() - this.lastSave > 10000) { this.save(); this.lastSave = Date.now(); }
  }

  awardCoins(coins, score, gameId) {
    this.state.bonusCoins += coins;
    const prev = this.state.highScores[gameId];
    if (prev == null || score > prev) this.state.highScores[gameId] = score;
    this.save();
  }

  // -------------------------------------------------------------- UI flow
  openWindow() { this.win = this.win || new Win95(this); this.mode = 'window'; }
  closeWindow() { this.mode = 'scene'; }
  startGame(id) {
    this.game = makeGame(id, this);
    if (this.game) this.mode = 'game';
  }
  endGame() { this.game = null; this.mode = 'window'; }

  onInput(buf) {
    for (const ev of term.parseInput(buf)) {
      if (ev.type === 'key') this.onKey(ev.key);
      else if (ev.type === 'mouse' && ev.down) this.onClick(ev.x, ev.y);
    }
  }

  onKey(k) {
    if (k === 'ctrl-c') return this.quit();
    if (this.mode === 'game' && this.game) return this.game.key(k);
    if (k === 'q') return this.quit();
    if (this.mode === 'window') {
      if (k === 'escape' || k === 'i') return this.closeWindow();
      if (k === 'tab') {
        const tabs = ['stats', 'pets', 'closet', 'games'];
        this.win.tab = tabs[(tabs.indexOf(this.win.tab) + 1) % tabs.length];
      }
      return;
    }
    // scene keys
    if (k === 'i' || k === 'enter') return this.openWindow();
    if (k === 's') { this.win = this.win || new Win95(this); this.win.tab = 'stats'; return this.openWindow(); }
    if (k === 'p') { this.win = this.win || new Win95(this); this.win.tab = 'pets'; return this.openWindow(); }
    if (k === 'c') { this.win = this.win || new Win95(this); this.win.tab = 'closet'; return this.openWindow(); }
    if (k === 'g') { this.win = this.win || new Win95(this); this.win.tab = 'games'; return this.openWindow(); }
    if (k === 'space') return this.pet.pat();
    if (k === 'b' && this.demo) { // demo: burn fake tokens
      const before = this.state.tokensTotal;
      this.state.tokensTotal += 25000;
      this.onBurn(25000, before);
    }
  }

  onClick(x, y) {
    if (this.mode === 'window' && this.win) {
      const r = this.win.hit(x, y);
      if (r) { r.fn(); return; }
      this.closeWindow();
      return;
    }
    if (this.mode === 'scene') {
      const hb = this.pet.hitbox();
      if (x >= hb.x && x < hb.x + hb.w && y >= hb.y && y < hb.y + hb.h) {
        this.openWindow(); // click pet -> menu (as designed)
        this.pet.pat();
      }
    }
  }

  // ------------------------------------------------------------ main loop
  frame() {
    this.tick++;
    const cv = this.cv;

    if (this.mode === 'game' && this.game) {
      this.game.update();
      this.game.draw(cv, this.tick);
      process.stdout.write(cv.render());
      return;
    }

    this.pet.update();
    this.scene.draw(cv, this.tick);
    this.pet.draw(cv);

    // floats
    for (const f of this.floats) {
      f.py += f.vy; f.ttl--;
      if (f.text) cv.txt(Math.round(f.px - f.text.length / 2), Math.floor(f.py / 2), f.text, f.color);
      else if (f.sprite) cv.sprite(f.sprite, Math.round(f.px), Math.round(f.py));
    }
    this.floats = this.floats.filter(f => f.ttl > 0);

    this.drawHud(cv);

    if (this.mode === 'window' && this.win) this.win.draw(cv);

    // banners on top of everything
    if (this.banners.length) {
      const b = this.banners[0];
      b.ttl--;
      if (b.ttl <= 0) this.banners.shift();
      else {
        const pad = '  ' + b.text + '  ';
        const y = 4;
        cv.txtCenter(y - 1, ' '.repeat(pad.length), INK, GOLD);
        cv.txtCenter(y, pad, INK, GOLD);
        cv.txtCenter(y + 1, ' '.repeat(pad.length), INK, GOLD);
      }
    }

    process.stdout.write(cv.render());
  }

  drawHud(cv) {
    const st = this.state;
    const lv = D.level(st.tokensTotal);
    const petName = (D.PETS.find(p => p.id === st.activePet) || {}).name || 'PET';
    cv.txt(1, 0, ` ${petName} Lv.${lv} `, WHITE, INK);
    const right = ` ${D.fmt(st.tokensTotal)} tokens · $${D.coins(st)} `;
    cv.txt(cv.cols - right.length - 1, 0, right, WHITE, INK);
    // xp bar
    const prog = D.levelProgress(st.tokensTotal);
    const barW = 16;
    const fill = Math.round(barW * prog);
    cv.txt(1, 1, '▐' + '█'.repeat(fill) + '░'.repeat(barW - fill) + '▌', [104, 190, 100], INK);
    const hint = this.demo
      ? ' [click pet] menu  [space] pat  [b] burn  [q] quit '
      : ' [click pet] menu  [space] pat  [q] quit ';
    cv.txt(1, cv.rows - 1, hint, DIM, INK);
    if (this.demo) cv.txt(cv.cols - 12, cv.rows - 1, ' DEMO MODE ', INK, GOLD);
  }
}

// ------------------------------------------------------------------- CLI
async function main(argv) {
  const args = new Set(argv);
  if (args.has('--help') || args.has('-h')) {
    console.log(`
  tokipet — a pixel pet that grows as your AI burns tokens

  usage: pet [command] [options]

    setup            wire tokipet into Claude Code (status bar + commands)
    setup --remove   undo everything setup added
    window           open the TOKIPET window in a new terminal

    --demo     simulated token burn (no Claude Code history needed)
    --reset    forget everything and start over
    --scan     print lifetime token count and exit
    --help     this

  in the pet window:
    click pet   open the Win95 menu (stats / pets / closet / games)
    space       pat your pet
    g/c/p/s     jump to games / closet / pets / stats
    q           quit (your pet keeps growing while you work)
`);
    return;
  }
  if (args.has('--reset')) {
    store.reset();
    console.log('  tokipet: state wiped. next launch starts fresh (hatch scene included).');
    return;
  }
  if (argv[0] === 'width') {
    const state = store.load();
    const n = parseInt(argv[1], 10);
    if (n >= 40 && n <= 300) {
      state.stripWidth = n;
      store.save(state);
      console.log(`  tokipet: statusline lane width set to ${n} columns.`);
    } else {
      console.log(`  current width: ${state.stripWidth || '(auto)'} — usage: pet width <40-300>`);
    }
    return;
  }
  if (args.has('--scan')) {
    const state = store.load();
    const src = new TokenSource({ ...state, fileOffsets: {}, recentIds: [] });
    const res = await src.scanAll();
    console.log(`  lifetime: ${res.tokens.toLocaleString()} tokens across ${res.sessions} sessions (${res.files} transcript files)`);
    return;
  }
  if (!process.stdout.isTTY) {
    console.error('tokipet needs an interactive terminal (try: pet --scan)');
    process.exit(1);
  }
  const app = new App({ demo: args.has('--demo'), menu: args.has('--menu') });
  await app.run();
}

module.exports = { main, App };
