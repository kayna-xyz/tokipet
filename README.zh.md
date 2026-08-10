# tokipet

[English](README.md) · **中文** · [Español](README.es.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

🌐 **[tokipet.vercel.app](https://tokipet.vercel.app)** · 📦 **[npm](https://www.npmjs.com/package/tokipet)**

一只住在 **Claude Code 状态栏**里的像素宠物，你每烧一个 token，它就长大一点。

```
  ( 写代码就是烧钱 )
   /    __
       o'')}____//
        `_/      )
        (_/\_/\_/
 BISCUIT Lv.12 ✦ First Flame ▰▰▰▰▰▱▱▱ 3.20M tok (/CLIadd /talktopet)
```

它被动读取 Claude Code 本来就写在 `~/.claude/projects/` 里的会话记录——完全本地、
自己**零 token 消耗**——把你真实的工作变成输入框下面的一条小生命：它散步、打盹、
调侃你、担心你肝太久，并为你的每一次燃烧欢呼。

## 安装

```sh
npm install -g tokipet
pet setup
```

重启 Claude Code，你的狗已经在等你了。

`pet setup` 会自动接好一切：状态栏渲染器、打字感知 hook、两个斜杠命令——
小心地合并进 `~/.claude/settings.json`（自动备份；`pet setup --remove` 可完整还原）。

## 在 Claude Code 里

| 命令         | 作用 |
|--------------|------|
| `/CLIadd`    | 打开 TOKIPET 窗口：宠物 · 后院 · 徽章 · 语言 |
| `/talktopet` | 想说什么都行——它听得懂指令（坐下/睡觉/狂奔/吃饭…），并用自己的性格回话 |

## 状态栏里住着什么

- **6 位住户** —— 狗、猫头鹰（会飞）、猪是初始伙伴；奶牛、蜘蛛、海豹通过徽章奖励入住。
  每只动物都有名字、叫声和步态。
- **2 个活的场景** —— 窗户随你的燃烧速度亮灯的城市，和有蝴蝶来访的花田。
- **4 个装饰** —— 云、树、土星、苹果核。

## 它怎么成长

- **等级**来自累计 token（输入 + 输出 + 缓存），从安装那天起累积——换终端永不清零。
- **徽章**来自肝机小时（只计算真正在烧 token 的时间）：
  1h · 22h · 44h · 88h · 8888h——每一枚都带一份固定奖励。
- **一份诚实的档案** —— 检测你的 Claude 订阅计划，按 API 牌价折算你的燃烧总值，
  跟踪每周额度，并告诉你订阅回本了没有。
- **六种语言** —— ENG · 中文 · ESP · 日本語 · 한국어 · DEU。

## 命令行

```sh
pet setup            # 接入 Claude Code
pet setup --remove   # 完整撤销 setup 的所有改动
pet                  # 直接打开 TOKIPET 窗口
pet --scan           # 打印累计 token 数并退出
pet --reset          # 清空存档重新开始
```

## 隐私

一切都在本地。一个状态文件（`~/.tokipet/state.json`），没有账号、
没有埋点、没有任何网络请求——永远。

## 环境要求

Claude Code + Node.js ≥ 16，macOS / Linux / Windows 均可。
真彩色终端可获得完整配色。
