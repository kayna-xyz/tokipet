# tokipet

[English](README.md) · [中文](README.zh.md) · [Español](README.es.md) · **日本語** · [한국어](README.ko.md) · [Deutsch](README.de.md)

🌐 **[tokipet.vercel.app](https://tokipet.vercel.app)** · 📦 **[npm](https://www.npmjs.com/package/tokipet)**

**Claude Code のステータスバー**に住むピクセルペット。トークンを燃やすたびに育ちます。

```
  ( コーディング = お金を燃やすこと )
   /    __
       o'')}____//
        `_/      )
        (_/\_/\_/
 BISCUIT Lv.12 ✦ First Flame ▰▰▰▰▰▱▱▱ 3.20M tok (/CLIadd /talktopet)
```

Claude Code が `~/.claude/projects/` に書き込むトランスクリプトを、ローカルで受動的に
読み取るだけ——自分では**トークンを一切消費しません**。あなたの実際の作業が、
入力ボックスの下の小さな命になります：散歩して、昼寝して、あなたをからかって、
働きすぎを心配して、バーンのたびに喜びます。

## インストール

```sh
npm install -g tokipet
pet setup
```

Claude Code を再起動すれば、犬がもう待っています。

> `EACCES: permission denied` が出たら `sudo npm install -g tokipet` でインストール——ただし `pet setup` には絶対 sudo を付けないでください。

`pet setup` がすべて自動で配線します：ステータスバーのレンダラー、タイピング検知フック、
2 つのスラッシュコマンド——`~/.claude/settings.json` に慎重にマージされます
（バックアップ付き。`pet setup --remove` で完全に元に戻せます）。

## Claude Code の中で

| コマンド     | 機能 |
|--------------|------|
| `/CLIadd`    | TOKIPET ウィンドウを開く：ペット · バックヤード · バッジ · 言語 |
| `/talktopet` | 何でも話しかけて——命令に従い（おすわり／寝る／全力疾走／ごはん…）、キャラクターとして返事します |

## バーに住むもの

- **6 匹の住人** —— 犬・フクロウ（飛べる）・ブタが最初の仲間。ウシ・クモ・アザラシは
  バッジの報酬としてやってきます。全員に名前と鳴き声と歩き方があります。
- **2 つの生きたシーン** —— バーン量に合わせて窓が灯る街と、蝶が訪れる花畑。
- **4 つの飾り** —— 雲、木、土星、リンゴの芯。

## 成長のしくみ

- **レベル**は累計トークン（入力 + 出力 + キャッシュ）から。インストール日から累積し、
  新しいターミナルを開いてもリセットされません。
- **バッジ**は稼働時間から（実際にトークンを燃やしている時間だけカウント）：
  1h · 22h · 44h · 88h · 8888h——それぞれに決まったギフト付き。
- **正直なプロフィール** —— あなたの Claude プランを検出し、バーンを API 価格で換算、
  週間ウィンドウを追跡して、サブスクの元が取れたかを教えます。
- **6 言語対応** —— ENG · 中文 · ESP · 日本語 · 한국어 · DEU。

## CLI

```sh
pet setup            # Claude Code に配線する
pet setup --remove   # setup の変更をすべて元に戻す
pet                  # TOKIPET ウィンドウを直接開く
pet --scan           # 累計トークン数を表示して終了
pet --reset          # 状態を消去してやり直す
```

## プライバシー

すべてローカルです。状態ファイルは 1 つ（`~/.tokipet/state.json`）。
アカウントなし、解析なし、ネットワーク通信なし——永遠に。

## 動作環境

Claude Code + Node.js ≥ 16（macOS / Linux / Windows）。
トゥルーカラー対応ターミナルでフルパレットになります。
