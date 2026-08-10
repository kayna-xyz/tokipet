'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = path.join(os.homedir(), '.tokipet');
const FILE = path.join(DIR, 'state.json');

const DEFAULTS = {
  firstRunDone: false,
  createdAt: 0,
  installedAt: 0,          // first time the statusline skill ran — token counting starts here
  tokensTotal: 0,          // cumulative burn since install (never decreases)
  tokensSpent: 0,          // spent in the pet shop; wallet = total - spent
  usageSplit: { inp: 0, out: 0, cr: 0, cw: 0 },  // per-type split for $ valuation
  frontendMsgs: 0,         // frontend-flavored asks seen (taste badge)
  claimedBadges: [],
  showBadge: null,         // badge id pinned to the status bar
  username: null,          // planet name, assigned on first /CLIadd visit
  ownedPets: ['dog'],      // dog/owl/pig are always owned; blind-box pets add here
  ownedDecos: [],          // blind-box decorations (saturn, apple core)
  bonusCoins: 0,
  spentCoins: 0,
  activePet: 'dog',
  equippedHat: null,
  ownedHats: [],
  notifiedUnlocks: [],
  highScores: {},
  fileOffsets: {},
  recentIds: [],
};

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state));
  } catch { /* best effort */ }
}

function reset() {
  try { fs.unlinkSync(FILE); } catch { /* ok */ }
}

module.exports = { load, save, reset, FILE };
