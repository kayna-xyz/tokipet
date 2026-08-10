# tokipet

**English** · [中文](README.zh.md) · [Español](README.es.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

🌐 **[tokipet.vercel.app](https://tokipet.vercel.app)** · 📦 **[npm](https://www.npmjs.com/package/tokipet)**

A pixel pet that lives in the **Claude Code status bar** and grows on every token you burn.

```
  ( coding = burning money )
   /    __
       o'')}____//
        `_/      )
        (_/\_/\_/
 BISCUIT Lv.12 ✦ First Flame ▰▰▰▰▰▱▱▱ 3.20M tok (/CLIadd /talktopet)
```

It reads the transcript files Claude Code already writes to `~/.claude/projects/` —
locally, passively, spending **zero** tokens of its own — and turns your real work
into a small life under the input box: it walks, naps, teases you, worries about
your grind hours, and celebrates every burn.

## Install

```sh
npm install -g tokipet
pet setup
```

Restart Claude Code. Your dog is already waiting.

> `EACCES: permission denied`? Install with `sudo npm install -g tokipet` — but never use sudo for `pet setup`.

`pet setup` wires everything automatically: the status bar renderer, a typing-awareness
hook, and two slash commands — merged carefully into `~/.claude/settings.json`
(a backup is kept; `pet setup --remove` reverts it all).

## In Claude Code

| command      | what it does |
|--------------|--------------|
| `/CLIadd`    | opens the TOKIPET window: pets · backyard · badges · language |
| `/talktopet` | say anything — it obeys (sit / sleep / zoomies / eat…) and answers in character |

## What lives in the bar

- **6 residents** — dog, owl (it flies), pig are starters; cow, spider and seal
  arrive as badge gifts. Every animal has a name, a voice, and a gait.
- **2 living scenes** — a city whose windows light up with your burn rate,
  a flower field with a visiting butterfly.
- **4 decorations** — cloud, tree, Saturn, an apple core.

## How it grows

- **Levels** from lifetime tokens (input + output + cache), counted from the day
  you install. Cumulative — a new terminal never resets it.
- **Badges** from grind hours (only time actively burning counts):
  1h · 22h · 44h · 88h · 8888h — each carries a fixed gift.
- **An honest profile** — detects your Claude plan, prices your burn at API list
  rates, tracks the weekly window, and tells you if the subscription paid for itself.
- **Six languages** — ENG · 中文 · ESP · 日本語 · 한국어 · DEU.

## CLI

```sh
pet setup            # wire into Claude Code
pet setup --remove   # undo everything setup added
pet                  # open the TOKIPET window directly
pet --scan           # print lifetime token count and exit
pet --reset          # wipe state and start over
```

## Privacy

Everything is local. One state file (`~/.tokipet/state.json`), no accounts,
no analytics, no network calls — ever.

## Requirements

Claude Code + Node.js ≥ 16, on macOS, Linux, or Windows. True-color terminals
get the full palette.
