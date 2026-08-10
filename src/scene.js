'use strict';
const SP = require('./sprites');
const D = require('./data');
const CAPYF = require('./capyframes');

// ------------------------------------------------------- moon base palette
const SKY_TOP = [16, 14, 34];
const SKY_BOT = [34, 32, 56];
const MOON = [168, 174, 184];      // surface
const MOON_HI = [190, 196, 204];   // horizon light / rim
const MOON_SPECK = [140, 146, 158];
const MOON_DARK = [118, 124, 138];
const CRATER_IN = [52, 56, 74];
const DOME = [122, 128, 142];
const DOME_HI = [174, 182, 194];
const DOME_DK = [88, 92, 106];
const STAR = [226, 228, 240];
const STAR_DIM = [120, 122, 148];

const lerp = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

// pixel Earth seen from the moon
const EARTH = SP.S(
  '....CCUU....',
  '..CCUUGUUU..',
  '.CUUGGUUGUU.',
  '.UUGUUUUGGU.',
  'UUGGGUUUGGUU',
  'UUUGGUUUUUUU',
  'UUUUUUGGUUUU',
  '.UGUUUGGGUU.',
  '.UUGUUUUGU..',
  '..UUUUCCU...',
  '....UUCC....'
);

class Pet {
  constructor(app) {
    this.app = app;
    this.x = 30;
    this.dir = 1;
    this.state = 'idle';
    this.stateT = 0;
    this.stateDur = 20;
    this.lastBurnAt = Date.now();
  }

  usesPack() { return this.app.state.activePet === 'capy'; }
  packAnim() { return CAPYF.SIZES[24]; }

  art() { return SP.PETS_ART[this.app.state.activePet] || SP.PETS_ART.panda; }
  width() { return this.usesPack() ? this.packAnim().walk[0][0].length : this.art().idle[0].length; }
  height() { return this.usesPack() ? this.packAnim().walk[0].length : this.art().idle.length; }
  groundY() { return this.app.groundTopY(); }

  unlockedActions() {
    const t = this.app.state.tokensTotal;
    return D.ACTIONS.filter(a => t >= a.unlock).map(a => a.id);
  }

  setState(s, dur) { this.state = s; this.stateT = 0; this.stateDur = dur; }

  excite() {
    this.lastBurnAt = Date.now();
    if (['sleep', 'idle', 'walk', 'blink'].includes(this.state)) this.setState('happy', 16);
  }

  pat() {
    this.lastBurnAt = Date.now();
    this.setState('happy', 14);
    const cx = this.x + this.width() / 2;
    this.app.floats.push({ px: cx - 2, py: this.groundY() - this.height() - 7, vy: -0.5, ttl: 14, sprite: SP.HEART });
  }

  update() {
    this.stateT++;
    const idleMs = Date.now() - this.lastBurnAt;

    if (this.state === 'walk') {
      this.x += this.dir * 0.7;
      const maxX = this.app.cv.pw - this.width() - 2;
      if (this.x <= 2) { this.x = 2; this.dir = 1; }
      if (this.x >= maxX) { this.x = maxX; this.dir = -1; }
    }
    if (this.stateT < this.stateDur) return;

    const acts = this.unlockedActions();
    if (idleMs > 8 * 60 * 1000 && !this.app.demo) { this.setState('sleep', 80); return; }
    const pool = ['idle', 'idle', 'blink', 'walk', 'walk'];
    if (acts.includes('eat')) pool.push('eat');
    if (acts.includes('wave')) pool.push('wave');
    if (acts.includes('dance')) pool.push('dance');
    if (acts.includes('flip')) pool.push('flip');
    const next = pool[Math.floor(Math.random() * pool.length)];
    const durs = { idle: 14 + Math.random() * 20, blink: 3, walk: 24 + Math.random() * 40, eat: 30, wave: 18, dance: 26, flip: 12 };
    if (next === 'walk' && Math.random() < 0.5) this.dir = -this.dir;
    this.setState(next, durs[next] || 16);
  }

  draw(cv) {
    if (this.usesPack()) return this.drawPack(cv);
    this.drawLegacy(cv);
  }

  // sprite-pack rendering (capybara) — frames indexed into CAPYF.PAL
  drawPack(cv) {
    const A = this.packAnim();
    const t = this.stateT;
    let anim, fi;
    switch (this.state) {
      case 'walk': anim = A.walk; fi = (t >> 1) % anim.length; break;
      case 'sleep': anim = A.sleep; fi = Math.min(anim.length - 1, t >> 2); break;
      case 'happy': case 'dance': case 'flip': case 'wave':
        anim = A.happy; fi = (t >> 1) % anim.length; break;
      case 'eat': anim = A.sleep; fi = Math.min(anim.length - 1, t >> 2); break;
      case 'blink': case 'idle': default:
        anim = A.idle; fi = (t >> 2) % anim.length; break;
    }
    const frame = anim[fi];
    const x = Math.round(this.x);
    const y = this.groundY() - frame.length;
    const flipX = this.dir < 0; // pack faces right
    cv.spriteIdx(frame, CAPYF.PAL, x, y, { flipX });

    if (this.state === 'sleep' && ((t >> 3) & 1)) {
      cv.txt(x + this.width() + 1, Math.floor((y + 2) / 2), 'z', [180, 190, 220]);
      cv.txt(x + this.width() + 3, Math.floor(y / 2), 'Z', [150, 160, 200]);
    }
    if (this.state === 'happy' && ((t >> 2) & 1)) {
      cv.sprite(SP.SPARK, x - 6, y + 2);
      cv.sprite(SP.SPARK, x + this.width() + 1, y + 6);
    }
  }

  drawLegacy(cv) {
    const art = this.art();
    const meta = art.meta || {};
    const t = this.stateT;
    const alt = (t >> 2) & 1;
    let frame = art.idle, dy = 0, flipY = false, arms = 0;

    switch (this.state) {
      case 'idle': frame = ((t >> 3) & 3) === 3 ? art.blink : art.idle; break;
      case 'blink': frame = art.blink; break;
      case 'walk': frame = alt ? art.walk1 : art.walk2; dy = alt ? 0 : -1; break;
      case 'sleep': frame = alt ? art.sleep1 : art.sleep2; break;
      case 'eat': frame = alt ? art.eat1 : art.eat2; break;
      case 'happy': frame = art.happy; dy = alt ? -2 : 0; break;
      case 'wave': frame = art.happy; arms = 1; break;
      case 'dance': frame = art.happy; arms = 2; dy = alt ? -1 : 0; break;
      case 'flip': {
        const ph = t / this.stateDur;
        dy = -Math.round(Math.sin(ph * Math.PI) * 12);
        flipY = ph > 0.25 && ph < 0.75;
        frame = art.happy;
        break;
      }
    }

    const x = Math.round(this.x);
    const y = this.groundY() - frame.length + dy;
    const flipX = meta.faces === 'left' ? this.dir > 0 : this.dir < 0;
    cv.sprite(frame, x, y, { flipX, flipY });

    if (arms > 0) {
      const armY = y + Math.round(frame.length * 0.28) - (alt ? 1 : 0);
      cv.sprite(SP.ARM, x + this.width() - 2, armY, {});
      if (arms === 2) cv.sprite(SP.ARM, x - 2, armY + (alt ? 1 : 0), { flipX: true });
    }
    if (this.state === 'eat' && meta.eat) {
      const food = SP[meta.eat.sprite];
      const fx = flipX ? x + this.width() - meta.eat.dx - food[0].length : x + meta.eat.dx;
      cv.sprite(food, fx, y + meta.eat.dy + (alt ? 1 : 0), { flipX });
    }
    const hatId = this.app.state.equippedHat;
    if (hatId && SP.HATS[hatId] && !flipY && meta.hat) {
      const hat = SP.HATS[hatId];
      const hw = hat.art[0].length;
      const anchorX = flipX ? this.width() - meta.hat[0] : meta.hat[0];
      cv.sprite(hat.art, x + anchorX - Math.floor(hw / 2), y + meta.hat[1] - hat.art.length + hat.overlap, { flipX });
    }
    if (this.state === 'sleep' && ((t >> 3) & 1)) {
      cv.txt(x + this.width(), Math.floor((y - 2) / 2), 'z', [180, 190, 220]);
      cv.txt(x + this.width() + 2, Math.floor((y - 5) / 2), 'Z', [150, 160, 200]);
    }
    if (this.state === 'happy' && alt) {
      cv.sprite(SP.SPARK, x - 6, y - 2);
      cv.sprite(SP.SPARK, x + this.width() + 1, y + 3);
    }
  }

  hitbox() {
    const w = this.width(), h = this.height();
    const y = this.groundY() - h;
    return { x: Math.round(this.x) - 1, y: Math.floor(y / 2) - 1, w: w + 2, h: Math.ceil(h / 2) + 2 };
  }
}

// ---------------------------------------------------------- moon base scene
class Scene {
  constructor(app) {
    this.app = app;
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      this.stars.push([Math.random(), Math.random(), Math.random(), Math.random() < 0.3]);
    }
  }

  draw(cv, tick) {
    const pw = cv.pw, ph = cv.ph;
    const horizon = Math.floor(ph * 0.52);

    // deep space sky
    for (let y = 0; y < horizon; y++) {
      const c = lerp(SKY_TOP, SKY_BOT, y / horizon);
      for (let x = 0; x < pw; x++) cv.px(x, y, c);
    }
    for (const [fx, fy, tw, dim] of this.stars) {
      const y = Math.floor(fy * (horizon - 2));
      if ((tick / 10 + tw * 12) % 12 < 10.5) {
        cv.px(Math.floor(fx * pw), y, dim ? STAR_DIM : STAR);
      }
    }

    // Earth, upper right
    cv.sprite(EARTH, Math.floor(pw * 0.78), Math.floor(ph * 0.08));

    // moon surface with a slightly wavy horizon
    for (let x = 0; x < pw; x++) {
      const hY = horizon + Math.round(Math.sin(x * 0.05) * 1.5);
      cv.px(x, hY, MOON_HI);
      for (let y = hY + 1; y < ph; y++) {
        const n = (x * 31 + y * 17) % 41;
        cv.px(x, y, n < 3 ? MOON_SPECK : (n > 38 ? MOON_HI : MOON));
      }
    }

    // dome base (left): glass dome + cylindrical airlock module
    const dcx = Math.floor(pw * 0.3), drx = Math.floor(pw * 0.15), dry = Math.floor(ph * 0.26);
    const domeBase = horizon + 4;
    for (let x = dcx - drx; x <= dcx + drx; x++) {
      const dx = (x - dcx) / drx;
      const hh = Math.round(dry * Math.sqrt(Math.max(0, 1 - dx * dx)));
      for (let y = domeBase - hh; y <= domeBase; y++) {
        const edge = y === domeBase - hh;
        cv.px(x, y, edge ? DOME_DK : (dx > 0.55 ? DOME_DK : DOME));
      }
    }
    // dome highlight blob
    for (let j = -3; j <= 3; j++) for (let i = -6; i <= 6; i++) {
      if ((i * i) / 36 + (j * j) / 9 <= 1) cv.px(dcx - 2 + i, domeBase - dry + 6 + j, DOME_HI);
    }
    // airlock module in front-left
    const mx = Math.floor(pw * 0.08), mw = Math.floor(pw * 0.14), mTop = domeBase - 9, mBot = domeBase + 5;
    for (let x = mx; x < mx + mw; x++) {
      for (let y = mTop; y <= mBot; y++) {
        const edge = y === mTop || y === mBot || x === mx || x === mx + mw - 1;
        cv.px(x, y, edge ? DOME_DK : (y < mTop + 3 ? DOME_HI : DOME));
      }
    }
    cv.rect(mx + Math.floor(mw / 2), mTop + 1, 1, mBot - mTop - 1, DOME_DK); // door seam
    cv.px(mx + 2, mTop + 4, MOON_HI); cv.px(mx + 2, mTop + 6, MOON_HI);     // panel lights

    // crater (right)
    const ccx = Math.floor(pw * 0.74), crx = Math.floor(pw * 0.13);
    const ccy = Math.floor(ph * 0.72), cry = Math.max(3, Math.floor(ph * 0.06));
    for (let x = ccx - crx; x <= ccx + crx; x++) {
      const dx = (x - ccx) / crx;
      const hh = Math.round(cry * Math.sqrt(Math.max(0, 1 - dx * dx)));
      for (let y = ccy - hh; y <= ccy + hh; y++) cv.px(x, y, CRATER_IN);
      if (hh > 0) {
        cv.px(x, ccy - hh - 1, MOON_HI);      // upper rim catches light
        cv.px(x, ccy + hh + 1, MOON_DARK);    // lower rim shadow
      }
    }
    // rim rocks
    for (const [ox, oy] of [[-crx, 2], [crx - 2, 3], [-4, cry + 2], [6, cry + 1]]) {
      cv.rect(ccx + ox, ccy + oy, 3, 2, MOON_DARK);
      cv.rect(ccx + ox, ccy + oy - 1, 2, 1, MOON_HI);
    }

    // scattered rocks + footprints
    cv.rect(Math.floor(pw * 0.5), horizon + 8, 4, 2, MOON_DARK);
    cv.rect(Math.floor(pw * 0.5) + 1, horizon + 7, 2, 1, MOON_HI);
    cv.rect(Math.floor(pw * 0.62), ph - 6, 3, 2, MOON_DARK);
    for (let i = 0; i < 6; i++) {
      const fx = mx + mw + 4 + i * 7;
      const fy = domeBase + 8 + Math.round(i * 1.8);
      if (fy < ph - 2) {
        cv.rect(fx, fy, 2, 1, MOON_SPECK);
        cv.rect(fx + 3, fy + 1, 2, 1, MOON_SPECK);
      }
    }
  }
}

module.exports = { Pet, Scene };
