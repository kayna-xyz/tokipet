'use strict';
const SP = require('./sprites');
const D = require('./data');

const NIGHTBG = [26, 32, 52];
const WHITE = [240, 242, 246];
const GOLD = [255, 208, 74];
const GREEN = [104, 190, 100];
const DIM = [140, 150, 180];

// ------------------------------------------------------------- Bamboo Catch
class BambooCatch {
  constructor(app) {
    this.app = app;
    this.name = 'bamboo';
    this.reset();
  }
  reset() {
    this.px = 30; this.vx = 0;
    this.items = []; // {x,y,vy,gold}
    this.score = 0;
    this.ticks = 0;
    this.total = 45 * 8; // 45s at 8fps
    this.done = false;
  }
  key(k) {
    if (this.done && (k === 'enter' || k === 'space')) return this.app.endGame(this);
    if (k === 'escape' || k === 'q') return this.app.endGame(this);
    if (k === 'left') this.vx = -3;
    if (k === 'right') this.vx = 3;
  }
  update() {
    if (this.done) return;
    this.ticks++;
    const cv = this.app.cv;
    if (this.ticks >= this.total) {
      this.done = true;
      const coins = Math.max(1, Math.floor(this.score / 3));
      this.earned = coins;
      this.app.awardCoins(coins, this.score, this.name);
      return;
    }
    const petW = SP.PETS_ART[this.app.state.activePet].idle[0].length;
    this.px = Math.max(2, Math.min(cv.pw - petW - 2, this.px + this.vx));
    this.vx *= 0.6;
    const diff = 1 + this.ticks / this.total;
    if (Math.random() < 0.10 * diff) {
      this.items.push({
        x: 4 + Math.random() * (cv.pw - 10),
        y: 8,
        vy: 0.8 + Math.random() * 0.9 * diff,
        gold: Math.random() < 0.12,
      });
    }
    const art = SP.PETS_ART[this.app.state.activePet].idle;
    const petTop = cv.ph - 6 - art.length;
    for (const it of this.items) {
      it.y += it.vy;
      if (!it.caught && it.y >= petTop && it.y < petTop + art.length - 2 &&
          it.x >= this.px - 2 && it.x <= this.px + art[0].length + 1) {
        it.caught = true;
        this.score += it.gold ? 5 : 1;
        this.flash = 3;
      }
    }
    this.items = this.items.filter(it => !it.caught && it.y < cv.ph - 4);
  }
  draw(cv, tick) {
    cv.clear(NIGHTBG);
    // floor
    cv.rect(0, cv.ph - 6, cv.pw, 6, [50, 90, 60]);
    cv.rect(0, cv.ph - 6, cv.pw, 1, GREEN);
    // pet as catcher
    const art = SP.PETS_ART[this.app.state.activePet];
    const frame = (this.flash && this.flash-- > 0) ? (art.happy || art.idle) : art.idle;
    cv.sprite(frame, Math.round(this.px), cv.ph - 6 - frame.length);
    // falling bamboo
    for (const it of this.items) {
      cv.sprite(SP.BAMBOO, Math.round(it.x), Math.round(it.y), it.gold ? { tint: GOLD } : {});
    }
    // HUD
    const secs = Math.max(0, Math.ceil((this.total - this.ticks) / 8));
    cv.txt(2, 0, ` BAMBOO CATCH `, WHITE, [16, 52, 166]);
    cv.txt(2, 1, ` score ${this.score}   time ${secs}s `, WHITE);
    cv.txt(2, 2, ` gold bamboo = 5 pts `, DIM);
    if (this.done) {
      cv.txtCenter(Math.floor(cv.rows / 2) - 1, `  TIME!  score ${this.score}  ->  +$${this.earned} coins  `, [10, 10, 10], GOLD);
      cv.txtCenter(Math.floor(cv.rows / 2) + 1, '[enter] back to your pet', WHITE);
    }
  }
}

// ----------------------------------------------------------------- Pet Pong
class PetPong {
  constructor(app) {
    this.app = app;
    this.name = 'pong';
    this.reset();
  }
  reset() {
    const cv = this.app.cv;
    this.py = cv.ph / 2;   // player paddle (left)
    this.ey = cv.ph / 2;   // pet paddle (right)
    this.ball = { x: cv.pw / 2, y: cv.ph / 2, vx: 1.6, vy: 0.8 };
    this.ps = 0; this.es = 0;
    this.done = false;
    this.paddleH = 10;
  }
  key(k) {
    if (this.done && (k === 'enter' || k === 'space')) return this.app.endGame(this);
    if (k === 'escape' || k === 'q') return this.app.endGame(this);
    if (k === 'up') this.py -= 4;
    if (k === 'down') this.py += 4;
  }
  update() {
    if (this.done) return;
    const cv = this.app.cv;
    const H = cv.ph, W = cv.pw;
    this.py = Math.max(6, Math.min(H - 6 - this.paddleH, this.py));
    // pet AI: follows with lag
    const target = this.ball.y - this.paddleH / 2;
    this.ey += Math.max(-2.2, Math.min(2.2, (target - this.ey) * 0.25));
    this.ey = Math.max(6, Math.min(H - 6 - this.paddleH, this.ey));

    const b = this.ball;
    b.x += b.vx; b.y += b.vy;
    if (b.y <= 5 || b.y >= H - 5) b.vy = -b.vy;
    // player paddle at x=4
    if (b.vx < 0 && b.x <= 6 && b.x >= 4 && b.y >= this.py - 1 && b.y <= this.py + this.paddleH + 1) {
      b.vx = -b.vx * 1.04;
      b.vy += ((b.y - (this.py + this.paddleH / 2)) / this.paddleH) * 1.6;
    }
    // pet paddle at right
    if (b.vx > 0 && b.x >= W - 7 && b.x <= W - 5 && b.y >= this.ey - 1 && b.y <= this.ey + this.paddleH + 1) {
      b.vx = -b.vx * 1.04;
      b.vy += ((b.y - (this.ey + this.paddleH / 2)) / this.paddleH) * 1.6;
    }
    if (b.x < 0) { this.es++; this.serve(-1); }
    if (b.x > W) { this.ps++; this.serve(1); }
    if (this.ps >= 5 || this.es >= 5) {
      this.done = true;
      const win = this.ps >= 5;
      this.earned = win ? 25 : 5;
      this.app.awardCoins(this.earned, this.ps, this.name);
      this.won = win;
    }
  }
  serve(dir) {
    const cv = this.app.cv;
    this.ball = { x: cv.pw / 2, y: cv.ph / 2, vx: 1.6 * dir, vy: (Math.random() - 0.5) * 2 };
  }
  draw(cv, tick) {
    cv.clear([20, 24, 40]);
    // court
    for (let y = 6; y < cv.ph - 5; y += 4) cv.rect(Math.floor(cv.pw / 2), y, 1, 2, [70, 80, 110]);
    cv.rect(0, 4, cv.pw, 1, DIM); cv.rect(0, cv.ph - 5, cv.pw, 1, DIM);
    // paddles
    cv.rect(4, Math.round(this.py), 2, this.paddleH, WHITE);
    cv.rect(cv.pw - 6, Math.round(this.ey), 2, this.paddleH, GOLD);
    // pet face floats near its paddle
    const art = SP.PETS_ART[this.app.state.activePet];
    cv.sprite(art.idle, cv.pw - 24, Math.round(this.ey) - 2);
    // ball
    cv.rect(Math.round(this.ball.x), Math.round(this.ball.y), 2, 2, WHITE);
    cv.txt(2, 0, ` PET PONG   you ${this.ps} : ${this.es} pet   first to 5 `, WHITE, [16, 52, 166]);
    if (this.done) {
      const msg = this.won ? `  YOU WIN!  +$${this.earned} coins  ` : `  pet wins... +$${this.earned} pity coins  `;
      cv.txtCenter(Math.floor(cv.rows / 2), msg, [10, 10, 10], this.won ? GOLD : [200, 200, 210]);
      cv.txtCenter(Math.floor(cv.rows / 2) + 2, '[enter] back to your pet', WHITE);
    }
  }
}

function makeGame(id, app) {
  if (id === 'bamboo') return new BambooCatch(app);
  if (id === 'pong') return new PetPong(app);
  return null;
}

module.exports = { makeGame };
