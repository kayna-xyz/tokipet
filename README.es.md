# tokipet

[English](README.md) · [中文](README.zh.md) · **Español** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

🌐 **[tokipet.vercel.app](https://tokipet.vercel.app)** · 📦 **[npm](https://www.npmjs.com/package/tokipet)**

Una mascota de píxeles que vive en la **barra de estado de Claude Code** y crece con cada token que quemas.

```
  ( programar = quemar dinero )
   /    __
       o'')}____//
        `_/      )
        (_/\_/\_/
 BISCUIT Lv.12 ✦ First Flame ▰▰▰▰▰▱▱▱ 3.20M tok (/CLIadd /talktopet)
```

Lee los archivos de transcripción que Claude Code ya escribe en `~/.claude/projects/` —
de forma local y pasiva, gastando **cero** tokens propios — y convierte tu trabajo real
en una pequeña vida bajo el cuadro de entrada: pasea, duerme la siesta, te toma el pelo,
se preocupa por tus horas de esfuerzo y celebra cada quemada.

## Instalación

```sh
npm install -g tokipet
pet setup
```

Reinicia Claude Code. Tu perro ya te está esperando.

> ¿`EACCES: permission denied`? Instala con `sudo npm install -g tokipet` — pero nunca uses sudo con `pet setup`.

`pet setup` lo conecta todo automáticamente: el renderizador de la barra de estado,
un hook que detecta cuando escribes y dos comandos slash — fusionados con cuidado en
`~/.claude/settings.json` (se guarda copia de seguridad; `pet setup --remove` lo revierte todo).

## En Claude Code

| comando      | qué hace |
|--------------|----------|
| `/CLIadd`    | abre la ventana TOKIPET: mascotas · patio · insignias · idioma |
| `/talktopet` | dile lo que sea — obedece (sentarse / dormir / correr / comer…) y responde con carácter |

## Qué vive en la barra

- **6 residentes** — perro, búho (vuela) y cerdo de inicio; la vaca, la araña y la foca
  llegan como regalos de insignia. Cada animal tiene nombre, voz y forma de andar.
- **2 escenas vivas** — una ciudad cuyas ventanas se encienden con tu ritmo de quemado
  y un campo de flores con mariposa visitante.
- **4 decoraciones** — nube, árbol, Saturno, un corazón de manzana.

## Cómo crece

- **Niveles** por tokens acumulados (entrada + salida + caché), contados desde el día
  de la instalación. Acumulativo — una terminal nueva nunca lo reinicia.
- **Insignias** por horas de esfuerzo (solo cuenta el tiempo quemando de verdad):
  1h · 22h · 44h · 88h · 8888h — cada una trae un regalo fijo.
- **Un perfil honesto** — detecta tu plan de Claude, valora tu quemado a precio de API,
  sigue la ventana semanal y te dice si la suscripción se pagó sola.
- **Seis idiomas** — ENG · 中文 · ESP · 日本語 · 한국어 · DEU.

## CLI

```sh
pet setup            # conectar con Claude Code
pet setup --remove   # deshacer todo lo que añadió setup
pet                  # abrir la ventana TOKIPET directamente
pet --scan           # imprimir el total de tokens y salir
pet --reset          # borrar el estado y empezar de cero
```

## Privacidad

Todo es local. Un archivo de estado (`~/.tokipet/state.json`), sin cuentas,
sin analíticas, sin llamadas de red — nunca.

## Requisitos

Claude Code + Node.js ≥ 16, en macOS, Linux o Windows.
Las terminales true-color obtienen la paleta completa.
