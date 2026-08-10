'use strict';
// `pet setup` — one-command install into Claude Code:
//   · statusLine  → ~/.claude/settings.json   (renders the pet strip)
//   · typing hook → ~/.claude/settings.json   (pet notices you typing)
//   · /CLIadd + /talktopet → ~/.claude/commands/
// Idempotent; `pet setup --remove` reverts everything it added.
// `pet window` opens the TOKIPET TUI in a new terminal (used by /CLIadd).

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const PET_JS = path.resolve(__dirname, '..', 'bin', 'pet.js');
const MARK = 'tokipet'; // ownership marker — we only ever remove what carries it

const nodeCmd = `node "${PET_JS}"`;

// portable typing hook (node is guaranteed — this package needs it)
const HOOK_CMD = 'node -e "const o=require(\'os\'),f=require(\'fs\'),p=o.homedir()+\'/.tokipet\';f.mkdirSync(p,{recursive:true});f.writeFileSync(p+\'/last-prompt\',String(Math.floor(Date.now()/1000)))"';

const CLIADD_MD = `---
description: Open the TOKIPET window — pets, scenes, badges & language for your status bar (${MARK})
allowed-tools: Bash(node:*)
---

Open the TOKIPET window:

!\`${nodeCmd} window && echo "TOKIPET opened"\`

The TOKIPET window just opened on the user's screen. Reply with ONE short
sentence: it's open — [1] pet (6 residents; cow/spider/seal unlock at 1h/22h/44h),
[2] backyard (scenes + ambient; saturn 88h, apple core 8888h), [3] badges
(grind-hour tiers, each carries its gift), [4] language
(ENG/中文/ESP/日本語/한국어/DEU), [q] quit. Nothing else.
`;

const TALKTOPET_MD = `---
description: Talk to your status-bar pet — say anything, it understands and talks back (${MARK})
argument-hint: <anything you want to say>
allowed-tools: Bash(node:*)
---

The user is talking to their status-bar pet. Say ANYTHING — chat, praise, complaints,
commands. The pet's backend has received it:

!\`${nodeCmd} talk $ARGUMENTS\`

Now reply AS the pet, fully in character:
- 1-3 short playful sentences, same language as the user
- consistent with PET STATE / COMMAND APPLIED above; if a command was applied
  (sit/sleep/mute/...), confirm obediently — if just muted, these are your last
  words before going quiet
- free conversation is welcome: react to whatever they said, reference their
  level / tokens / how hard they're working when it fits
- actions in *asterisks* are encouraged; no explanations, no formatting beyond that
`;

function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch { return {}; }
}
function saveSettings(s) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');
}
function isOurs(str) { return typeof str === 'string' && (str.includes(PET_JS) || str.includes('.tokipet') || str.includes('bin/pet.js')); }

function setup() {
  const s = loadSettings();

  // one-time backup before we ever touch the file
  const backup = SETTINGS + '.tokipet-backup';
  if (fs.existsSync(SETTINGS) && !fs.existsSync(backup)) fs.copyFileSync(SETTINGS, backup);

  // status line
  const replaced = s.statusLine && !isOurs(s.statusLine.command);
  s.statusLine = { type: 'command', command: `${nodeCmd} statusline` };

  // typing hook (append once)
  s.hooks = s.hooks || {};
  const list = s.hooks.UserPromptSubmit = s.hooks.UserPromptSubmit || [];
  const already = JSON.stringify(list).includes('.tokipet');
  if (!already) list.push({ hooks: [{ type: 'command', command: HOOK_CMD }] });

  saveSettings(s);

  // slash commands
  fs.mkdirSync(COMMANDS_DIR, { recursive: true });
  fs.writeFileSync(path.join(COMMANDS_DIR, 'CLIadd.md'), CLIADD_MD);
  fs.writeFileSync(path.join(COMMANDS_DIR, 'talktopet.md'), TALKTOPET_MD);

  console.log('');
  console.log('  tokipet moved in 🎉');
  console.log('');
  console.log('  wired into Claude Code:');
  console.log('    · status bar   → the pet strip renders under the input box');
  if (replaced) console.log('      (your previous statusLine was replaced — backup at settings.json.tokipet-backup)');
  console.log('    · typing hook  → the pet notices when you type');
  console.log('    · /CLIadd      → open the TOKIPET window (pets · backyard · badges · language)');
  console.log('    · /talktopet   → talk to your pet, it talks back');
  console.log('');
  console.log('  now restart Claude Code — your dog is already waiting.');
  console.log('  (undo anytime: pet setup --remove)');
  console.log('');
}

function remove() {
  const s = loadSettings();
  if (s.statusLine && isOurs(s.statusLine.command)) delete s.statusLine;
  if (s.hooks && Array.isArray(s.hooks.UserPromptSubmit)) {
    s.hooks.UserPromptSubmit = s.hooks.UserPromptSubmit.filter(h => !JSON.stringify(h).includes('.tokipet'));
    if (s.hooks.UserPromptSubmit.length === 0) delete s.hooks.UserPromptSubmit;
    if (Object.keys(s.hooks).length === 0) delete s.hooks;
  }
  saveSettings(s);
  for (const f of ['CLIadd.md', 'talktopet.md']) {
    const p = path.join(COMMANDS_DIR, f);
    try { if (fs.readFileSync(p, 'utf8').includes(MARK)) fs.unlinkSync(p); } catch { /* absent */ }
  }
  console.log('');
  console.log('  tokipet moved out. Claude Code config restored.');
  console.log('  your pet\'s memory is still at ~/.tokipet — delete that folder to forget it forever.');
  console.log('');
}

// `pet window` — open the TUI in a fresh terminal, per platform
function openWindow() {
  const { spawn, execSync } = require('child_process');
  const plat = process.platform;
  if (plat === 'darwin') {
    try { execSync('pkill -f "bin/pet.js$"', { stdio: 'ignore' }); } catch { /* none running */ }
    const sh = `node ${JSON.stringify(PET_JS)}`.replace(/"/g, '\\"');
    spawn('osascript',
      ['-e', 'tell application "Terminal" to activate',
       '-e', `tell application "Terminal" to do script "${sh}"`],
      { stdio: 'ignore', detached: true }).unref();
    return;
  }
  if (plat === 'win32') {
    spawn('cmd', ['/c', 'start', 'TOKIPET', 'cmd', '/k', 'node', PET_JS],
      { stdio: 'ignore', detached: true, windowsHide: false }).unref();
    return;
  }
  // linux: first terminal emulator that exists wins
  const terms = [
    ['x-terminal-emulator', ['-e', `node ${PET_JS}`]],
    ['gnome-terminal', ['--', 'node', PET_JS]],
    ['konsole', ['-e', 'node', PET_JS]],
    ['xterm', ['-e', 'node', PET_JS]],
  ];
  for (const [bin, args] of terms) {
    try {
      require('child_process').execSync(`command -v ${bin}`, { stdio: 'ignore' });
      spawn(bin, args, { stdio: 'ignore', detached: true }).unref();
      return;
    } catch { /* try next */ }
  }
  console.log('tokipet: no terminal emulator found — run `pet` directly in a terminal.');
}

function run(args) {
  if (args.includes('--remove') || args.includes('--uninstall')) return remove();
  return setup();
}

module.exports = { run, openWindow };
