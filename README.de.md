# tokipet

[English](README.md) · [中文](README.zh.md) · [Español](README.es.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Deutsch**

🌐 **[tokipet.vercel.app](https://tokipet.vercel.app)** · 📦 **[npm](https://www.npmjs.com/package/tokipet)**

Ein Pixel-Haustier, das in der **Claude-Code-Statusleiste** wohnt und mit jedem verbrannten Token wächst.

```
  ( Coden = Geld verbrennen )
   /    __
       o'')}____//
        `_/      )
        (_/\_/\_/
 BISCUIT Lv.12 ✦ First Flame ▰▰▰▰▰▱▱▱ 3.20M tok (/CLIadd /talktopet)
```

Es liest die Transkriptdateien, die Claude Code ohnehin nach `~/.claude/projects/`
schreibt — lokal, passiv und mit **null** eigenem Token-Verbrauch — und verwandelt
deine echte Arbeit in ein kleines Leben unter der Eingabezeile: Es spaziert, macht
Nickerchen, zieht dich auf, sorgt sich um deine Grind-Stunden und feiert jeden Burn.

## Installation

```sh
npm install -g tokipet
pet setup
```

Claude Code neu starten — dein Hund wartet schon.

> `EACCES: permission denied`? Installiere mit `sudo npm install -g tokipet` — aber niemals sudo für `pet setup`.

`pet setup` verdrahtet alles automatisch: den Statusleisten-Renderer, einen
Tipp-Erkennungs-Hook und zwei Slash-Befehle — sorgfältig in `~/.claude/settings.json`
gemerged (mit Backup; `pet setup --remove` macht alles rückgängig).

## In Claude Code

| Befehl       | Funktion |
|--------------|----------|
| `/CLIadd`    | öffnet das TOKIPET-Fenster: Tiere · Backyard · Abzeichen · Sprache |
| `/talktopet` | sag irgendwas — es gehorcht (Sitz / Schlafen / Vollgas / Fressen…) und antwortet in seiner Rolle |

## Was in der Leiste wohnt

- **6 Bewohner** — Hund, Eule (sie fliegt) und Schwein sind Starter; Kuh, Spinne und
  Robbe ziehen als Abzeichen-Geschenke ein. Jedes Tier hat Namen, Stimme und Gangart.
- **2 lebendige Szenen** — eine Stadt, deren Fenster mit deiner Burn-Rate aufleuchten,
  und ein Blumenfeld mit Schmetterlingsbesuch.
- **4 Dekorationen** — Wolke, Baum, Saturn, ein Apfelgriebs.

## Wie es wächst

- **Level** aus Lifetime-Tokens (Input + Output + Cache), gezählt ab dem Installationstag.
  Kumulativ — ein neues Terminal setzt nie etwas zurück.
- **Abzeichen** aus Grind-Stunden (nur Zeit mit aktivem Token-Burn zählt):
  1h · 22h · 44h · 88h · 8888h — jedes trägt ein festes Geschenk.
- **Ein ehrliches Profil** — erkennt deinen Claude-Plan, bepreist deinen Burn zu
  API-Listenpreisen, verfolgt das Wochenfenster und sagt dir, ob sich das Abo bezahlt hat.
- **Sechs Sprachen** — ENG · 中文 · ESP · 日本語 · 한국어 · DEU.

## CLI

```sh
pet setup            # in Claude Code verdrahten
pet setup --remove   # alles von setup rückgängig machen
pet                  # das TOKIPET-Fenster direkt öffnen
pet --scan           # Lifetime-Token-Zahl ausgeben und beenden
pet --reset          # Zustand löschen und neu anfangen
```

## Privatsphäre

Alles lokal. Eine Zustandsdatei (`~/.tokipet/state.json`), keine Konten,
keine Analytics, keine Netzwerkaufrufe — niemals.

## Voraussetzungen

Claude Code + Node.js ≥ 16, auf macOS, Linux oder Windows.
True-Color-Terminals bekommen die volle Palette.
