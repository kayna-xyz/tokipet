'use strict';

// All progression content. Thresholds are lifetime tokens burned.

const PETS = [
  { id: 'panda',   name: 'PANDA',    unlock: 0,          desc: 'loves bamboo & big context windows' },
  { id: 'capy',    name: 'CAPYBARA', unlock: 250_000,    desc: 'unbothered. moisturized. in your terminal.' },
  { id: 'cat',     name: 'CAT',      unlock: 1_000_000,  desc: 'sits on your keyboard, burns your tokens' },
  { id: 'penguin', name: 'PENGUIN',  unlock: 5_000_000,  desc: 'ships code on ice' },
  { id: 'dragon',  name: 'DRAGON',   unlock: 20_000_000, desc: 'hoards tokens instead of gold' },
];

const ACTIONS = [
  { id: 'blink', name: 'Blink',     unlock: 0 },
  { id: 'walk',  name: 'Walk',      unlock: 0 },
  { id: 'sleep', name: 'Nap',       unlock: 0 },
  { id: 'eat',   name: 'Snack',     unlock: 25_000 },
  { id: 'wave',  name: 'Wave',      unlock: 100_000 },
  { id: 'dance', name: 'Dance',     unlock: 300_000 },
  { id: 'flip',  name: 'Backflip',  unlock: 1_000_000 },
];

const HAT_ITEMS = [
  { id: 'leaf',   name: 'Lucky Leaf',    unlock: 50_000,     price: 15 },
  { id: 'party',  name: 'Party Hat',     unlock: 150_000,    price: 40 },
  { id: 'phones', name: 'Headphones',    unlock: 500_000,    price: 120 },
  { id: 'crown',  name: 'Crown',         unlock: 2_000_000,  price: 400 },
  { id: 'wizard', name: 'Wizard Hat',    unlock: 10_000_000, price: 1500 },
];

const GAMES = [
  { id: 'bamboo', name: 'Bamboo Catch', unlock: 100_000,   desc: 'catch falling bamboo, earn coins' },
  { id: 'pong',   name: 'Pet Pong',     unlock: 1_000_000, desc: 'first to 5 vs your pet' },
];

const MILESTONES = [
  { at: 10_000,        name: 'Spark' },
  { at: 100_000,       name: 'Campfire' },
  { at: 1_000_000,     name: 'Bonfire' },
  { at: 10_000_000,    name: 'Inferno' },
  { at: 100_000_000,   name: 'Supernova' },
  { at: 1_000_000_000, name: 'Big Bang' },
];

function level(tokens) {
  return Math.max(1, Math.floor(Math.sqrt(tokens / 20_000)));
}
function levelFloor(lv) { return lv * lv * 20_000; }
function levelProgress(tokens) {
  const lv = level(tokens);
  const lo = levelFloor(lv), hi = levelFloor(lv + 1);
  return Math.max(0, Math.min(1, (tokens - lo) / (hi - lo)));
}

function coins(state) {
  return Math.floor(state.tokensTotal / 2000) + (state.bonusCoins || 0) - (state.spentCoins || 0);
}

// every unlockable with its threshold, for "new unlock" detection
function allUnlockables() {
  const out = [];
  for (const p of PETS) if (p.unlock > 0) out.push({ kind: 'pet', id: p.id, name: p.name, at: p.unlock });
  for (const a of ACTIONS) if (a.unlock > 0) out.push({ kind: 'action', id: a.id, name: a.name, at: a.unlock });
  for (const h of HAT_ITEMS) out.push({ kind: 'hat', id: h.id, name: h.name, at: h.unlock });
  for (const g of GAMES) out.push({ kind: 'game', id: g.id, name: g.name, at: g.unlock });
  return out;
}

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}

// ------------------------------------------------------------- badges
// Earned by grind hours (time actively burning tokens). Each badge
// carries a fixed gift — 3 pets + 2 decorations across the 5 tiers.
const BADGES = [
  { id: 'flame', icon: '✦', hours: 1, en: 'First Flame', zh: '初火', reward: { kind: 'pet', id: 'cow' } },
  { id: 'nightrider', icon: '◆', hours: 22, en: 'Midnight Rider', zh: '夜航员', reward: { kind: 'pet', id: 'spider' } },
  { id: 'monk', icon: '★', hours: 44, en: 'Terminal Monk', zh: '终端苦行僧', reward: { kind: 'pet', id: 'seal' } },
  { id: 'alchemist', icon: '♛', hours: 88, en: 'Token Alchemist', zh: '炼金术师', reward: { kind: 'deco', id: 'saturn' } },
  { id: 'taste', icon: '❀', hours: 8888, en: 'Taste Immortal', zh: '审美真神', reward: { kind: 'deco', id: 'apple' } },
];

function grindHours(state) { return (state.grindMs || 0) / 3_600_000; }
function badgeEarned(state, b) { return grindHours(state) >= b.hours; }
function badgeName(b, state) { return (state && state.lang) === 'zh' ? b.zh : b.en; }
// hours needed to unlock a given pet/deco (null = not badge-gated)
function rewardHours(kind, id) {
  const b = BADGES.find(x => x.reward.kind === kind && x.reward.id === id);
  return b ? b.hours : null;
}

// ------------------------------------------- token value & days-in-use
// API list prices per 1M tokens (Sonnet-class): in $3, out $15,
// cache-read $0.30, cache-write $3.75. Tokens counted before we started
// splitting by type are valued at a blended $0.80/M (cache-read heavy).
function tokenValueUSD(state) {
  const u = state.usageSplit || {};
  const covered = (u.inp || 0) + (u.out || 0) + (u.cr || 0) + (u.cw || 0);
  const precise = ((u.inp || 0) * 3 + (u.out || 0) * 15 + (u.cr || 0) * 0.3 + (u.cw || 0) * 3.75) / 1e6;
  const legacy = Math.max(0, (state.tokensTotal || 0) - covered) * 0.8 / 1e6;
  return precise + legacy;
}

function daysUsed(state) {
  const t0 = state.installedAt || state.createdAt || Date.now();
  return Math.max(1, Math.ceil((Date.now() - t0) / 86_400_000));
}

// --------------------------------------------------- Claude plan detection
// Read the rate-limit tier Claude Code stores in ~/.claude.json.
// avgWeek = editorial estimate of what a typical user on that plan burns
// per week (cache reads included) — for the "how do I compare" line.
const PLANS = [
  { re: /max_20x/, id: 'max20', name: 'Max 20x', price: 200, avgWeek: 350e6 },
  { re: /max_5x|max(?!_20)/, id: 'max5', name: 'Max 5x', price: 100, avgWeek: 120e6 },
  { re: /pro/, id: 'pro', name: 'Pro', price: 20, avgWeek: 30e6 },
];

let _planCache;
function plan() {
  if (_planCache !== undefined) return _planCache;
  _planCache = null;
  try {
    const fs = require('fs'), os = require('os');
    const j = JSON.parse(fs.readFileSync(os.homedir() + '/.claude.json', 'utf8'));
    const oa = j.oauthAccount || {};
    const tier = oa.userRateLimitTier || oa.organizationRateLimitTier || '';
    _planCache = PLANS.find(p => p.re.test(tier)) || null;
  } catch { /* no claude.json */ }
  return _planCache;
}

module.exports = {
  PETS, ACTIONS, HAT_ITEMS, GAMES, MILESTONES,
  level, levelFloor, levelProgress, coins, allUnlockables, fmt,
  BADGES, grindHours, badgeEarned, badgeName, rewardHours, tokenValueUSD, daysUsed, plan,
};
