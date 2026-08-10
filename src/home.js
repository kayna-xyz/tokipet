'use strict';
// CLI·BACKYARD — the /CLIadd config hub. A retro text TUI (crisp at any font
// size) where you choose what lives in the blank space of your status bar:
// pets, backyard decorations, badges (with blind-box prizes) and language.

const term = require('./term');
const store = require('./state');
const D = require('./data');
const { PETS, PET_ORDER, DECOS, DECO_ORDER, PALETTE, petArt, petColor } = require('./ascii');
const { tr, LANG_ORDER, LANG_LABEL } = require('./lang');

const esc = s => `\x1b[${s}m`;
const DIM = esc(2), BOLD = esc(1), R = esc(0);
const FG = ([r, g, b]) => esc(`38;2;${r};${g};${b}`);
const GREEN = FG([104, 170, 104]), GOLD = FG(PALETTE.gold), GRAY = FG([136, 142, 155]);
const CORAL = FG(PALETTE.coral), CREAM = FG(PALETTE.cream);

// ---------------------------------------------------------------- banner
// ANSI-shadow figlet — the tokipet front gate.
const FONT = {
  T: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
  O: [' ██████╗ ', '██╔═══██╗', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  K: ['██╗  ██╗', '██║ ██╔╝', '█████╔╝ ', '██╔═██╗ ', '██║  ██╗', '╚═╝  ╚═╝'],
  I: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
  P: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔═══╝ ', '██║     ', '╚═╝     '],
  E: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
};
const BANNER = [0, 1, 2, 3, 4, 5].map(r => 'TOKIPET'.split('').map(ch => FONT[ch][r]).join(''));
// two-tone like real ANSI-shadow art: rosy pink face, deep rose shadow
const FACE = FG([236, 130, 160]);
const SHADOW = FG([138, 76, 94]);
const paintBanner = row => SHADOW + row.replace(/█+/g, m => FACE + m + SHADOW) + R;

// every resident gets a planet for a name, assigned once at first visit
const PLANETS = ['MERCURY', 'VENUS', 'MARS', 'JUPITER', 'SATURN', 'URANUS',
  'NEPTUNE', 'PLUTO', 'CERES', 'ERIS', 'HAUMEA', 'MAKEMAKE', 'SEDNA', 'QUAOAR'];

// strip ANSI, then pad to visual width (for aligned columns)
const vpad = (s, n) => s + ' '.repeat(Math.max(0, n - s.replace(/\x1b\[[0-9;]*m/g, '').length));

class Home {
  constructor() {
    this.state = store.load();
    if (!this.state.username) {
      this.state.username = PLANETS[Math.floor(Math.random() * PLANETS.length)];
      this.save();
    }
    this.screen = 'home';
    this.tick = 0;
    this.msg = null;   // {text, color, until}
  }

  save() { store.save(this.state); }
  flash(text, color = GOLD) { this.msg = { text, color, until: Date.now() + 4000 }; }

  ownedPets() {
    // dog / owl / pig are default residents; the rest arrive via blind box
    const owned = new Set(['dog', 'owl', 'pig', ...(this.state.ownedPets || [])]);
    return owned;
  }
  ownedDecos() {
    return new Set(['city', 'flowers', 'cloud', 'tree', ...(this.state.ownedDecos || [])]);
  }

  run() {
    term.enter();
    process.stdin.on('data', b => {
      for (const ev of term.parseInput(b)) {
        if (ev.type === 'key') this.onKey(ev.key);
      }
    });
    const quit = () => this.quit();
    process.on('SIGINT', quit);
    process.on('SIGTERM', quit);
    process.on('exit', () => term.leave());
    this.timer = setInterval(() => { this.tick++; this.render(); }, 700);
    this.render();
  }

  quit() {
    clearInterval(this.timer);
    term.leave();
    console.log('\n  tokipet closed — your bar keeps living. (/CLIadd anytime)\n');
    process.exit(0);
  }

  onKey(k) {
    if (k === 'ctrl-c' || k === 'q') return this.quit();
    const st = this.state;
    if (this.screen === 'home') {
      if (k === '1' || k === 'p') this.screen = 'pet';
      else if (k === '2' || k === 'b') this.screen = 'backyard';
      else if (k === '3') this.screen = 'badges';
      else if (k === '4' || k === 'l') {
        const i = LANG_ORDER.indexOf(st.lang || 'en');
        st.lang = LANG_ORDER[(i + 1) % LANG_ORDER.length];
        this.save();
      }
    } else if (this.screen === 'pet') {
      if (k === 'escape' || k === 'h') { this.screen = 'home'; this.msg = null; }
      const i = parseInt(k, 10) - 1;
      if (!isNaN(i) && PET_ORDER[i]) this.tryAdopt(PET_ORDER[i]);
    } else if (this.screen === 'backyard') {
      if (k === 'escape' || k === 'h') { this.screen = 'home'; this.msg = null; }
      const i = parseInt(k, 10) - 1;
      if (!isNaN(i) && DECO_ORDER[i]) this.toggleDeco(DECO_ORDER[i]);
    } else if (this.screen === 'badges') {
      if (k === 'escape' || k === 'h') { this.screen = 'home'; this.msg = null; }
      const i = parseInt(k, 10) - 1;
      if (!isNaN(i) && D.BADGES[i]) this.touchBadge(D.BADGES[i]);
    }
    this.render();
  }

  tryAdopt(id) {
    const st = this.state, L = tr(st);
    if (!this.ownedPets().has(id)) return this.flash(`🔒 ${D.rewardHours('pet', id)}h`, GRAY);
    st.activePet = id;
    st.scene = null; // adopting a pet brings it back to the bar
    this.save();
    this.flash(L.uiAdopted(PETS[id].given), GREEN);
  }

  toggleDeco(id) {
    const st = this.state, L = tr(st);
    if (!this.ownedDecos().has(id)) return this.flash(`🔒 ${D.rewardHours('deco', id)}h`, GRAY);
    if (DECOS[id].type === 'scene') {
      // scenes are exclusive: they replace the pet (toggle off to get it back)
      st.scene = st.scene === id ? null : id;
    } else {
      const yard = st.backyard || (st.backyard = []);
      const at = yard.indexOf(id);
      if (at >= 0) yard.splice(at, 1); else yard.push(id);
    }
    this.save();
  }

  // badges: earned → claim (opens a blind box); claimed → pin/unpin
  touchBadge(b) {
    const st = this.state, L = tr(st);
    const claimed = (st.claimedBadges || []).includes(b.id);
    if (!claimed) {
      if (!D.badgeEarned(st, b)) return this.flash(L.uiBadgeNotYet, GRAY);
      st.claimedBadges = [...(st.claimedBadges || []), b.id];
      // each badge carries its fixed gift
      const prize = b.reward;
      const owned = prize.kind === 'pet' ? this.ownedPets().has(prize.id) : this.ownedDecos().has(prize.id);
      if (owned) { this.save(); return this.flash(L.bbEmpty, GOLD); }
      if (prize.kind === 'pet') {
        st.ownedPets = [...(st.ownedPets || []), prize.id];
        this.flash(L.bbWinPet(PETS[prize.id].given, L.species[prize.id]), GOLD);
      } else {
        st.ownedDecos = [...(st.ownedDecos || []), prize.id];
        this.flash(L.bbWinDeco(DECOS[prize.id].name), GOLD);
      }
      this.save();
      return;
    }
    if (st.showBadge === b.id) {
      st.showBadge = null;
      this.flash(L.uiBadgeUnpinnedMsg, GRAY);
    } else {
      st.showBadge = b.id;
      this.flash(L.uiBadgePinnedMsg(D.badgeName(b, st)), GREEN);
    }
    this.save();
  }

  header(lines) {
    const L = tr(this.state);
    const cols = process.stdout.columns || 80;
    lines.push('');
    if (cols >= BANNER[0].length + 4) {
      BANNER.forEach(row => lines.push('  ' + paintBanner(row)));
    } else {
      lines.push(`  ${BOLD}${CORAL}▌TOKIPET▐${R}`);
    }
    lines.push(`  ${GRAY}${L.uiSub}${R}`);
    lines.push('');
  }

  render() {
    const lines = [];
    this.header(lines);
    const alt = this.tick % 2 === 0;
    const st = this.state;
    const L = tr(st);

    if (this.screen === 'home') {
      lines.push(`  ${BOLD}[1]${R} ${L.uiPet}`);
      lines.push(`  ${BOLD}[2]${R} ${L.uiYard}`);
      lines.push(`  ${BOLD}[3]${R} ${L.uiBadges}`);
      lines.push(`  ${BOLD}[4]${R} ${L.uiLang}  ${GRAY}— ${LANG_LABEL[st.lang || 'en']}${R}`);
      // ---- stats footer, pinned to the bottom edge of the window ----
      const plan = D.plan();
      const hours = D.grindHours(st).toFixed(1);
      const value = D.tokenValueUSD(st);
      const rl = st.rateLimits;
      const footer = [`  ${GRAY}${'─'.repeat(58)}${R}`,
        `  ${CORAL}${BOLD}${st.username}${R} · Lv.${D.level(st.tokensTotal)}${plan ? ` · ${CORAL}Claude ${plan.name}${R}` : ''}`,
        `  ${BOLD}${D.fmt(st.tokensTotal)}${R} tok ${GOLD}≈ $${value >= 100 ? value.toFixed(0) : value.toFixed(2)}${R} · ${L.ftGrind(hours)}`];
      if (rl && rl.seven != null) footer.push(`  ${GREEN}${L.ftWeekLeft(100 - rl.seven)}${R}`);
      footer.push(`  ${DIM}${L.uiQuit}${R}`);
      const winRows = process.stdout.rows || 24;
      while (lines.length + footer.length + 1 < winRows) lines.push('');
      lines.push(...footer);
    } else if (this.screen === 'pet') {
      lines.push(`  ${BOLD}PET${R} ${GRAY}— ${L.uiPetHint}${R}`);
      lines.push('');
      const owned = this.ownedPets();
      for (let g = 0; g < PET_ORDER.length; g += 3) {
        const cards = PET_ORDER.slice(g, g + 3).map((id, j) => {
          const idx = g + j;
          const p = PETS[id];
          const has = owned.has(id);
          const active = st.activePet === id || (!PETS[st.activePet] && id === 'dog');
          const art = petArt(id, 'idle', alt, 'left', false);
          const w = Math.max(...art.map(l => l.length), 12) + 6;
          const head = `${active ? GREEN + '»' : ' '} [${idx + 1}] ${has ? p.given : '???'}${active ? ' ✓' : ''}${R}`;
          const tag = has
            ? `${GRAY}${L.species[id]}${p.badge ? ` · ${GOLD}${L.uiBadgeTag}${R}` : ''}${R}`
            : `${GRAY}🔒 ${D.rewardHours('pet', id)}h${R}`;
          const color = has ? FG(petColor(id)) : DIM;
          return { head, tag, art, w, color };
        });
        lines.push('  ' + cards.map(c => vpad(c.head, c.w)).join(''));
        for (let r = 0; r < 4; r++) {
          lines.push('  ' + cards.map(c => c.color + vpad(c.art[r] || '', c.w) + R).join(''));
        }
        lines.push('  ' + cards.map(c => vpad('    ' + c.tag, c.w)).join(''));
        lines.push('');
      }
    } else if (this.screen === 'backyard') {
      lines.push(`  ${BOLD}BACKYARD${R} ${GRAY}— ${L.uiYardHint}${R}`);
      lines.push(`  ${DIM}${L.uiYardNote1}${R}`);
      lines.push('');
      const owned = this.ownedDecos();
      DECO_ORDER.forEach((id, idx) => {
        const d = DECOS[id];
        const has = owned.has(id);
        const on = d.type === 'scene' ? st.scene === id : (st.backyard || []).includes(id);
        const status = !has ? `${GRAY}🔒 ${D.rewardHours('deco', id)}h${R}`
          : on ? GREEN + L.uiActive + R : GRAY + L.uiOff + R;
        lines.push(`  ${on ? GREEN + '»' : ' '} [${idx + 1}] ${(has ? d.name : '???').padEnd(11)}${status}`);
        const tint = d.tint ? FG(d.tint.base) : CREAM;
        d.rows.slice(0, 2).forEach(r => lines.push('        ' + (has ? tint : DIM) + r + R));
      });
    } else if (this.screen === 'badges') {
      const hours = D.grindHours(st);
      lines.push(`  ${BOLD}BADGES${R} ${GRAY}— ${L.uiBadgeHint}${R}`);
      lines.push('');
      // same card grid as the pet page: each badge shows its gift, just locked
      for (let g = 0; g < D.BADGES.length; g += 3) {
        const cards = D.BADGES.slice(g, g + 3).map((b, j) => {
          const i = g + j;
          const claimed = (st.claimedBadges || []).includes(b.id);
          const earned = D.badgeEarned(st, b);
          const pinned = st.showBadge === b.id;
          const pet = b.reward.kind === 'pet';
          const art = pet ? petArt(b.reward.id, 'idle', alt, 'left', false) : DECOS[b.reward.id].rows.slice(0, 4);
          const w = Math.max(...art.map(l => l.length), 16) + 6;
          const head = `${pinned ? GOLD + '»' : ' '} [${i + 1}] ${claimed ? GOLD : earned ? CREAM : DIM}${b.icon}${R} ${D.badgeName(b, st)}${R}`;
          const gift = pet ? `[PET] ${PETS[b.reward.id].given}` : DECOS[b.reward.id].name;
          let status;
          if (claimed) status = `${GREEN}✓ ${L.uiBadgeClaimed}${pinned ? GOLD + ' »' : ''}${R}`;
          else if (earned) status = `${GOLD}${L.uiBadgeReady.split('—')[0].trim()}${R}`;
          else status = `${GRAY}🔒 ${b.hours}h${R}`;
          const color = claimed ? (pet ? FG(petColor(b.reward.id)) : FG(DECOS[b.reward.id].tint.base))
            : earned ? CREAM : DIM;
          return { head, art, w, color, gift: `${GRAY}${gift}${R}`, status };
        });
        lines.push('  ' + cards.map(c => vpad(c.head, c.w)).join(''));
        for (let r = 0; r < 4; r++) {
          lines.push('  ' + cards.map(c => c.color + vpad(c.art[r] || '', c.w) + R).join(''));
        }
        lines.push('  ' + cards.map(c => vpad('    ' + c.gift, c.w)).join(''));
        lines.push('  ' + cards.map(c => vpad('    ' + c.status, c.w)).join(''));
        lines.push('');
      }
      lines.push(`  ${GRAY}${L.ftGrind(hours.toFixed(1))}${R}`);
    }

    if (this.msg && Date.now() < this.msg.until) {
      lines.push('');
      lines.push(`  ${this.msg.color}▸ ${this.msg.text}${R}`);
    }
    lines.push('');
    process.stdout.write('\x1b[2J\x1b[H' + lines.join('\r\n'));
  }
}

function run() { new Home().run(); }
module.exports = { run, Home };
