# tokipet

[English](README.md) · [中文](README.zh.md) · [Español](README.es.md) · [日本語](README.ja.md) · **한국어** · [Deutsch](README.de.md)

🌐 **[tokipet.vercel.app](https://tokipet.vercel.app)** · 📦 **[npm](https://www.npmjs.com/package/tokipet)**

**Claude Code 상태 바**에 사는 픽셀 펫. 토큰을 태울 때마다 자랍니다.

```
  ( 코딩 = 돈 태우기 )
   /    __
       o'')}____//
        `_/      )
        (_/\_/\_/
 BISCUIT Lv.12 ✦ First Flame ▰▰▰▰▰▱▱▱ 3.20M tok (/CLIadd /talktopet)
```

Claude Code가 이미 `~/.claude/projects/`에 기록하는 트랜스크립트를 로컬에서
수동적으로 읽기만 합니다 — 자체 토큰 소비는 **0**. 당신의 실제 작업이
입력창 아래의 작은 생명이 됩니다: 산책하고, 낮잠 자고, 당신을 놀리고,
너무 오래 달리면 걱정하고, 태울 때마다 환호합니다.

## 설치

```sh
npm install -g tokipet
pet setup
```

Claude Code를 재시작하면, 강아지가 이미 기다리고 있습니다.

`pet setup`이 모든 걸 자동으로 연결합니다: 상태 바 렌더러, 타이핑 감지 훅,
슬래시 커맨드 2개 — `~/.claude/settings.json`에 조심스럽게 병합됩니다
(백업 유지, `pet setup --remove`로 전부 되돌릴 수 있어요).

## Claude Code 안에서

| 커맨드       | 기능 |
|--------------|------|
| `/CLIadd`    | TOKIPET 창 열기: 펫 · 백야드 · 배지 · 언어 |
| `/talktopet` | 아무 말이나 — 명령을 따르고(앉아 / 자 / 전력질주 / 밥…), 캐릭터로 대답합니다 |

## 바에 사는 것들

- **주민 6마리** — 강아지, 부엉이(날 수 있음), 돼지가 스타터. 젖소·거미·물범은
  배지 보상으로 입주합니다. 모두 이름과 목소리와 걸음걸이가 있어요.
- **살아있는 씬 2개** — 태우는 속도에 따라 창문이 켜지는 도시, 나비가 찾아오는 꽃밭.
- **장식 4개** — 구름, 나무, 토성, 사과 심.

## 성장 방식

- **레벨**은 누적 토큰(입력 + 출력 + 캐시)에서. 설치한 날부터 누적되며,
  새 터미널을 열어도 절대 리셋되지 않습니다.
- **배지**는 그라인드 시간에서(실제로 토큰을 태우는 시간만 계산):
  1h · 22h · 44h · 88h · 8888h — 각각 정해진 선물이 있습니다.
- **정직한 프로필** — Claude 플랜을 감지하고, 태운 토큰을 API 정가로 환산하고,
  주간 한도를 추적해 구독료 본전을 뽑았는지 알려줍니다.
- **6개 언어** — ENG · 中文 · ESP · 日本語 · 한국어 · DEU.

## CLI

```sh
pet setup            # Claude Code에 연결
pet setup --remove   # setup이 추가한 것 전부 되돌리기
pet                  # TOKIPET 창 바로 열기
pet --scan           # 누적 토큰 수 출력 후 종료
pet --reset          # 상태를 지우고 처음부터
```

## 프라이버시

전부 로컬입니다. 상태 파일 하나(`~/.tokipet/state.json`), 계정 없음,
분석 없음, 네트워크 요청 없음 — 영원히.

## 요구 사항

Claude Code + Node.js ≥ 16, macOS / Linux / Windows.
트루컬러 터미널에서 풀 팔레트를 볼 수 있습니다.
