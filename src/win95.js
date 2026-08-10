'use strict';
const SP = require('./sprites');
const D = require('./data');

// Win95 system palette (flat, no gradients)
const DESKTOP = [0, 128, 128];
const FACE = [192, 192, 192];
const HI = [255, 255, 255];
const SH = [128, 128, 128];
const DK = [10, 10, 10];
const NAVY = [0, 0, 128];
const CREAM = [255, 255, 228];
const WHITE = [255, 255, 255];
const INK = [0, 0, 0];
const DIS = [128, 128, 128];
const GREEN = [0, 128, 0];

const TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'pets', label: 'Pets' },
  { id: 'closet', label: 'Closet' },
  { id: 'games', label: 'Games' },
];

// RULE: 1px bevel lines live only in pixel rows that carry no text.
// A text cell repaints both pixels of its row, so chrome and text never share rows.

class Win95 {
  constructor(app) {
    this.app = app;
    this.tab = 'stats';
    this.regions = [];
  }

  hit(x, y) {
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r;
    }
    return null;
  }
  region(x, y, w, h, fn) { this.regions.push({ x, y, w, h, fn }); }

  // raised button around ONE text row: bevel px go in the rows above/below
  button(cv, cx, cy, w, label, opts = {}) {
    const { pressed = false, disabled = false } = opts;
    const x = cx, pxTop = cy * 2, pxBot = cy * 2 + 1;
    cv.cellRect(cx, cy, w, 1, pressed ? [176, 176, 176] : FACE);
    const a = pressed ? DK : HI, b = pressed ? HI : DK;
    cv.rect(x, pxTop - 1, w, 1, a);          // top line (bottom px of row above)
    cv.rect(x, pxBot + 1, w, 1, b);          // bottom line (top px of row below)
    cv.rect(x - 1, pxTop - 1, 1, 4, a);      // left edge
    cv.rect(x + w, pxTop - 1, 1, 4, b);      // right edge
    const tx = cx + Math.max(0, Math.floor((w - label.length) / 2));
    cv.txt(tx, cy, label, disabled ? DIS : (pressed ? NAVY : INK), pressed ? [176, 176, 176] : FACE);
  }

  draw(cv) {
    this.regions = [];
    const W = Math.min(52, cv.cols - 4);
    const H = Math.min(19, cv.rows - 2);
    const cx = Math.floor((cv.cols - W) / 2);
    const cy = Math.floor((cv.rows - H) / 2);
    const px = cx, py = cy * 2, pw = W, ph = H * 2;

    // modal: flat teal desktop behind the window — nothing noisy shows through
    cv.rect(0, 0, cv.pw, cv.ph, DESKTOP);
    cv.text.clear();

    // window: gray face, single 1px raised bevel
    cv.rect(px, py, pw, ph, FACE);
    cv.rect(px, py, pw, 1, HI);
    cv.rect(px, py, 1, ph, HI);
    cv.rect(px, py + ph - 1, pw, 1, DK);
    cv.rect(px + pw - 1, py, 1, ph, DK);

    // title bar: flat navy, one text row (pixel rows py+2..py+3)
    cv.rect(px + 2, py + 2, pw - 4, 2, NAVY);
    cv.txt(cx + 3, cy + 1, 'PET.EXE', WHITE, NAVY);
    // close button on the title bar
    cv.cellRect(cx + W - 6, cy + 1, 3, 1, FACE);
    cv.txt(cx + W - 6, cy + 1, ' X ', INK, FACE);
    this.region(cx + W - 6, cy + 1, 3, 1, () => this.app.closeWindow());

    // nav buttons row (cy+3), spacer rows cy+2 and cy+4 hold their bevels
    let bx = cx + 3;
    for (const t of TABS) {
      const w = t.label.length + 2;
      const active = this.tab === t.id;
      this.button(cv, bx, cy + 3, w, t.label, { pressed: active });
      const id = t.id;
      this.region(bx, cy + 3, w, 1, () => { this.tab = id; });
      bx += w + 2;
    }

    // content panel: cream, 1px sunken bevel on text-free pixel rows
    const p0 = cy + 5, p1 = cy + H - 3;             // text rows inside panel
    const plx = px + 3, prx = px + pw - 4;          // pixel cols
    const pty = p0 * 2 - 1, pby = (p1 + 1) * 2;     // pixel rows (in spacer rows)
    cv.rect(plx, pty, prx - plx + 1, pby - pty + 1, CREAM);
    cv.rect(plx, pty, prx - plx + 1, 1, SH);
    cv.rect(plx, pty, 1, pby - pty + 1, SH);
    cv.rect(plx, pby, prx - plx + 1, 1, HI);
    cv.rect(prx, pty, 1, pby - pty + 1, HI);

    const c = { x: cx + 5, y: p0, w: W - 10, h: p1 - p0 + 1 };
    if (this.tab === 'stats') this.drawStats(cv, c);
    else if (this.tab === 'pets') this.drawPets(cv, c);
    else if (this.tab === 'closet') this.drawCloset(cv, c);
    else if (this.tab === 'games') this.drawGames(cv, c);

    // status text on the face, bottom row
    const coins = D.coins(this.app.state);
    cv.txt(cx + 3, cy + H - 2, `${D.fmt(this.app.state.tokensTotal)} tokens`, INK, FACE);
    const money = `$${coins}`;
    cv.txt(cx + W - 3 - money.length, cy + H - 2, money, INK, FACE);

    // swallow clicks anywhere on window
    this.regions.unshift({ x: cx, y: cy, w: W, h: H, fn: () => {} });
  }

  drawStats(cv, c) {
    const st = this.app.state;
    const t = st.tokensTotal;
    const lv = D.level(t);
    const petMeta = D.PETS.find(p => p.id === st.activePet);
    const art = SP.PETS_ART[st.activePet];

    // portrait at native pixel size on the cream panel
    const portX = c.x + 1, portY = c.y * 2 + 2;
    cv.sprite(art.idle, portX, portY);
    if (st.equippedHat && SP.HATS[st.equippedHat] && art.meta && art.meta.hat) {
      const hat = SP.HATS[st.equippedHat];
      const hw = hat.art[0].length;
      cv.sprite(hat.art, portX + art.meta.hat[0] - Math.floor(hw / 2),
        portY + art.meta.hat[1] - hat.art.length + hat.overlap);
    }

    const ix = c.x + 25;
    const iw = c.x + c.w - ix;
    cv.txt(ix, c.y, `${petMeta.name}  Lv.${lv}`, INK, CREAM);
    const prog = D.levelProgress(t);
    const barW = Math.max(8, iw - 1);
    const fill = Math.round(barW * prog);
    cv.txt(ix, c.y + 2, '█'.repeat(fill) + '░'.repeat(barW - fill), GREEN, CREAM);
    cv.txt(ix, c.y + 3, `${D.fmt(t)} tokens burned`, INK, CREAM);
    cv.txt(ix, c.y + 4, `next: ${D.fmt(D.levelFloor(lv + 1))}`, DIS, CREAM);
    cv.txt(ix, c.y + 6, `coins: $${D.coins(st)}`, INK, CREAM);

    cv.txt(c.x + 1, c.y + c.h - 3, 'MILESTONES', DIS, CREAM);
    let mx = c.x + 1, my = c.y + c.h - 2;
    for (const m of D.MILESTONES) {
      const got = t >= m.at;
      const s = `[${got ? 'x' : ' '}]${m.name}`;
      if (mx + s.length > c.x + c.w) { mx = c.x + 1; my++; }
      if (my > c.y + c.h - 1) break;
      cv.txt(mx, my, s, got ? GREEN : DIS, CREAM);
      mx += s.length + 1;
    }
  }

  drawPets(cv, c) {
    const st = this.app.state;
    let y = c.y;
    for (const p of D.PETS) {
      if (y >= c.y + c.h) break;
      const unlocked = st.tokensTotal >= p.unlock;
      const active = st.activePet === p.id;
      if (!unlocked) {
        cv.txt(c.x + 1, y, `${'???'.padEnd(10)}unlocks at ${D.fmt(p.unlock)} tokens`, DIS, CREAM);
      } else {
        const btn = active ? '<< active' : '[ choose ]';
        cv.txt(c.x + 1, y, `${p.name.padEnd(10)}${btn}`, active ? NAVY : INK, CREAM);
        if (!active) {
          const id = p.id;
          this.region(c.x + 1, y, c.w - 1, 1, () => { st.activePet = id; this.app.save(); });
        }
      }
      if (unlocked && y + 1 < c.y + c.h) cv.txt(c.x + 3, y + 1, p.desc.slice(0, c.w - 4), DIS, CREAM);
      y += 2;
    }
  }

  drawCloset(cv, c) {
    const st = this.app.state;
    const coins = D.coins(st);
    let y = c.y;
    cv.txt(c.x + 1, y, `coins: $${coins}   (2000 tokens = $1)`, DIS, CREAM);
    y += 2;
    for (const h of D.HAT_ITEMS) {
      if (y >= c.y + c.h) break;
      const unlocked = st.tokensTotal >= h.unlock;
      const owned = st.ownedHats.includes(h.id);
      const worn = st.equippedHat === h.id;
      let action, col = INK;
      if (!unlocked) { action = `unlocks at ${D.fmt(h.unlock)}`; col = DIS; }
      else if (!owned) { action = `[ buy $${h.price} ]`; col = coins >= h.price ? INK : DIS; }
      else if (worn) { action = '<< worn   [ take off ]'; col = NAVY; }
      else { action = '[ wear ]'; }
      cv.txt(c.x + 1, y, `${(unlocked ? h.name : '???').padEnd(13)}${action}`.slice(0, c.w - 1), col, CREAM);
      if (unlocked) {
        const item = h;
        this.region(c.x + 1, y, c.w - 1, 1, () => {
          if (!st.ownedHats.includes(item.id)) {
            if (D.coins(st) >= item.price) {
              st.spentCoins += item.price;
              st.ownedHats.push(item.id);
              st.equippedHat = item.id;
              this.app.save();
              this.app.bell();
            }
          } else if (st.equippedHat === item.id) {
            st.equippedHat = null; this.app.save();
          } else {
            st.equippedHat = item.id; this.app.save();
          }
        });
      }
      y += 1;
    }
    if (st.equippedHat && SP.HATS[st.equippedHat] && y + 1 < c.y + c.h) {
      cv.sprite(SP.HATS[st.equippedHat].art, c.x + 3, (y + 1) * 2);
    }
  }

  drawGames(cv, c) {
    const st = this.app.state;
    let y = c.y;
    for (const g of D.GAMES) {
      if (y >= c.y + c.h) break;
      const unlocked = st.tokensTotal >= g.unlock;
      const hs = st.highScores[g.id];
      if (!unlocked) {
        cv.txt(c.x + 1, y, `${'???'.padEnd(15)}unlocks at ${D.fmt(g.unlock)} tokens`, DIS, CREAM);
      } else {
        cv.txt(c.x + 1, y, `${g.name.padEnd(15)}[ PLAY ]${hs != null ? '  best: ' + hs : ''}`, INK, CREAM);
        const id = g.id;
        this.region(c.x + 1, y, c.w - 1, 1, () => this.app.startGame(id));
      }
      if (y + 1 < c.y + c.h) cv.txt(c.x + 3, y + 1, g.desc.slice(0, c.w - 4), DIS, CREAM);
      y += 2;
    }
    cv.txt(c.x + 1, c.y + c.h - 1, 'arrows move - esc quits a game', DIS, CREAM);
  }
}

module.exports = { Win95 };
