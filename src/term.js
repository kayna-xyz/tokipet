'use strict';

// Terminal lifecycle + input parsing (keys and SGR mouse clicks).

let active = false;

function enter() {
  if (active) return;
  active = true;
  process.stdout.write('\x1b[?1049h\x1b[?25l\x1b[?1000h\x1b[?1006h');
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();
}

function leave() {
  if (!active) return;
  active = false;
  process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l\x1b[0m');
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
}

const KEYMAP = {
  '\x1b[A': 'up', '\x1b[B': 'down', '\x1b[C': 'right', '\x1b[D': 'left',
  '\x1bOA': 'up', '\x1bOB': 'down', '\x1bOC': 'right', '\x1bOD': 'left',
  '\r': 'enter', '\n': 'enter', '\t': 'tab', ' ': 'space',
  '\x7f': 'backspace', '\x1b': 'escape',
};

// Parses a stdin chunk into events: {type:'key',key} | {type:'mouse',x,y,down}
function parseInput(buf) {
  const s = buf.toString('utf8');
  const events = [];
  let i = 0;
  while (i < s.length) {
    // SGR mouse: ESC [ < b ; x ; y (M|m)
    const m = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])/.exec(s.slice(i));
    if (m) {
      const btn = +m[1];
      if ((btn & 3) !== 3 && btn < 32) { // ignore motion/wheel
        events.push({ type: 'mouse', x: +m[2] - 1, y: +m[3] - 1, down: m[4] === 'M', btn: btn & 3 });
      }
      i += m[0].length;
      continue;
    }
    let matched = false;
    for (const seq of Object.keys(KEYMAP)) {
      if (seq.length > 1 && s.startsWith(seq, i)) {
        events.push({ type: 'key', key: KEYMAP[seq] });
        i += seq.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = s[i];
    if (ch === '\x03') events.push({ type: 'key', key: 'ctrl-c' });
    else if (KEYMAP[ch]) events.push({ type: 'key', key: KEYMAP[ch] });
    else if (ch >= ' ' && ch <= '~') events.push({ type: 'key', key: ch.toLowerCase() });
    i++;
  }
  return events;
}

module.exports = { enter, leave, parseInput };
