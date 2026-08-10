'use strict';
const { PALETTE } = require('./sprites');

const TRUECOLOR = /truecolor|24bit/i.test(process.env.COLORTERM || '') ||
  /iterm|kitty|alacritty|wezterm|ghostty|vscode/i.test(process.env.TERM_PROGRAM || '' + (process.env.TERM || ''));

function to256([r, g, b]) {
  // grayscale ramp gives better fidelity for near-grays
  if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12) {
    const v = Math.round(((r + g + b) / 3 - 8) / 10);
    if (v <= 0) return 16;
    if (v >= 24) return 231;
    return 232 + v - 1;
  }
  const q = v => Math.round((v / 255) * 5);
  return 16 + 36 * q(r) + 6 * q(g) + q(b);
}

function fgSeq(c) { return TRUECOLOR ? `38;2;${c[0]};${c[1]};${c[2]}` : `38;5;${to256(c)}`; }
function bgSeq(c) { return TRUECOLOR ? `48;2;${c[0]};${c[1]};${c[2]}` : `48;5;${to256(c)}`; }

class Canvas {
  constructor(cols, rows) { this.resize(cols, rows); }

  resize(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.pw = cols;       // pixel width (1 pixel per column)
    this.ph = rows * 2;   // pixel height (2 pixels per row via ▀)
    this.pix = new Array(this.ph);
    for (let y = 0; y < this.ph; y++) this.pix[y] = new Array(this.pw).fill(null);
    this.text = new Map(); // "x,y" -> {ch, fg, bg|null}
  }

  clear(color) {
    for (let y = 0; y < this.ph; y++) this.pix[y].fill(color);
    this.text.clear();
  }

  px(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.pw || y >= this.ph) return;
    this.pix[y][x] = c;
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  // sprite: array of strings, chars looked up in PALETTE ('.'/' ' transparent)
  sprite(sp, x, y, opts = {}) {
    const { flipX = false, flipY = false, tint = null } = opts;
    const h = sp.length;
    for (let j = 0; j < h; j++) {
      const row = sp[flipY ? h - 1 - j : j];
      const w = row.length;
      for (let i = 0; i < w; i++) {
        const ch = row[flipX ? w - 1 - i : i];
        if (ch === '.' || ch === ' ') continue;
        const c = tint || PALETTE[ch];
        if (c) this.px(x + i, y + j, c);
      }
    }
  }

  spriteW(sp) { return sp[0] ? sp[0].length : 0; }

  // palette-indexed frame (arrays of ints, -1 = transparent)
  spriteIdx(frame, pal, x, y, opts = {}) {
    const { flipX = false } = opts;
    for (let j = 0; j < frame.length; j++) {
      const row = frame[j];
      const w = row.length;
      for (let i = 0; i < w; i++) {
        const idx = row[flipX ? w - 1 - i : i];
        if (idx >= 0 && pal[idx]) this.px(x + i, y + j, pal[idx]);
      }
    }
  }

  // text overlay in CELL coords. bg=null -> inherit underlying pixel color
  txt(cx, cy, s, fg, bg = null) {
    cx |= 0; cy |= 0;
    for (let i = 0; i < s.length; i++) {
      const x = cx + i;
      if (x < 0 || x >= this.cols || cy < 0 || cy >= this.rows) continue;
      this.text.set(x + ',' + cy, { ch: s[i], fg, bg });
    }
  }

  txtCenter(cy, s, fg, bg = null) {
    this.txt(Math.floor((this.cols - s.length) / 2), cy, s, fg, bg);
  }

  // fill a cell region's background (paints both pixels of each cell)
  cellRect(cx, cy, w, h, c) {
    this.rect(cx, cy * 2, w, h * 2, c);
  }

  render() {
    const out = ['\x1b[?2026h\x1b[H'];
    const BLACK = [0, 0, 0];
    for (let cy = 0; cy < this.rows; cy++) {
      out.push(`\x1b[${cy + 1};1H`);
      let lastFg = null, lastBg = null;
      const top = this.pix[cy * 2], bot = this.pix[cy * 2 + 1];
      for (let x = 0; x < this.cols; x++) {
        const t = this.text.get(x + ',' + cy);
        let ch, fg, bg;
        if (t) {
          ch = t.ch; fg = t.fg;
          bg = t.bg || top[x] || BLACK;
        } else {
          const tc = top[x] || BLACK, bc = bot[x] || BLACK;
          if (tc === bc) { ch = ' '; fg = null; bg = tc; }
          else { ch = '▀'; fg = tc; bg = bc; }
        }
        let esc = '';
        if (fg && fg !== lastFg) { esc += fgSeq(fg) + ';'; lastFg = fg; }
        if (bg !== lastBg) { esc += bgSeq(bg) + ';'; lastBg = bg; }
        if (esc) out.push('\x1b[' + esc.slice(0, -1) + 'm');
        out.push(ch);
      }
      out.push('\x1b[0m');
    }
    out.push('\x1b[?2026l');
    return out.join('');
  }
}

module.exports = { Canvas, TRUECOLOR };
