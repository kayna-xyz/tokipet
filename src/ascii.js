'use strict';
// ASCII pets + backyard decorations for the status bar.
// Every pet: base/walk (left), baseR/walkR (right), strideL/strideR legs
// while moving (optional), lieL/lieR sleeping pose (optional).
// Fliers (owl) set fly:true and provide flyA/flyB wing-flap frames — they
// lift off the ground while moving instead of striding.

// -------------------------------------------------------- shared palette
// Warm, humane tones (Claude-ish): terracotta coral, cream, sage, gold.
const PALETTE = {
  coral: [217, 119, 87],
  cream: [226, 217, 200],
  sand: [206, 162, 108],
  pink: [226, 145, 155],
  sage: [134, 162, 118],
  gold: [222, 168, 20],
  sky: [138, 166, 193],
  stone: [148, 144, 152],
  dimstone: [112, 110, 122],
  bark: [162, 122, 86],
  mist: [172, 180, 190],
};

// ------------------------------------------------------------------- DOG
const DOG = {
  name: 'DOG',
  given: 'BISCUIT',
  color: PALETTE.sand,
  base: [
    '  __      _',
    "o'')}____//",
    ' `_/      )',
    ' (_(_/-(_/',
  ],
  walk: [
    '  __',
    "o'')}____\\\\",
    ' `_/      )',
    ' (_(_/-(_/',
  ],
  baseR: [
    '_      __',
    "\\\\____{(''o",
    "(      \\_'",
    ' \\_)-\\_)_)',
  ],
  walkR: [
    '       __',
    "//____{(''o",
    "(      \\_'",
    ' \\_)-\\_)_)',
  ],
  strideL: ' (_/\\_/\\_/',
  strideR: ' \\_/\\_/\\_)',
  lieL: ['   __      _', "  o'')}____//", '  (_________/'],
  lieR: ['  _      __', "\\\\____{(''o", '\\_________)'],
};

// ------------------------------------------------------------------- OWL
// Owls fly: while moving they lift off and flap (flyA/flyB alternate).
// Perched they blink; asleep they close both eyes.
const OWL_BASE = [
  '   ___',
  '`\\/{o,o}',
  ' / /)  )',
  '/,--"-"-',
];
const OWL_BLINK = [
  '   ___',
  '`\\/{-,-}',
  ' / /)  )',
  '/,--"-"-',
];
const OWL = {
  name: 'OWL',
  given: 'NOVA',
  color: PALETTE.coral,
  fly: true,
  base: OWL_BASE,
  walk: OWL_BLINK,
  baseR: OWL_BASE,
  walkR: OWL_BLINK,
  // 3-row soaring frames: upstroke / downstroke; the statusline adds an
  // altitude bob so the flight reads as wing-beats, not hopping
  flyA: [
    '\\\\  ___  //',
    ' \\\\{o,o}//',
    '    ( )',
  ],
  flyB: [
    '   ___',
    ' _{o,o}_',
    '/  ( )  \\',
  ],
  lieL: OWL_BLINK,
  lieR: OWL_BLINK,
};

// ------------------------------------------------------------------- PIG
// user-supplied classic; tail flicks 9/6 while wagging
const PIG = {
  name: 'PIG',
  given: 'MOMO',
  color: PALETTE.pink,
  base: [
    '    _____',
    '^..^     \\9',
    '(oo)_____/',
    '   WW  WW',
  ],
  walk: [
    '    _____',
    '^..^     \\6',
    '(oo)_____/',
    '   WW  WW',
  ],
  baseR: [
    '   _____',
    ' e/     ^..^',
    '  \\_____(oo)',
    '    WW  WW',
  ],
  walkR: [
    '   _____',
    ' a/     ^..^',
    '  \\_____(oo)',
    '    WW  WW',
  ],
  strideL: '   vv  vv',
  strideR: '    vv  vv',
  lieL: [
    '    _____',
    '^--^     \\9',
    '(--)_____/',
    '   WW  WW',
  ],
  lieR: [
    '   _____',
    ' e/     ^--^',
    '  \\_____(--)',
    '    WW  WW',
  ],
};

// ------------------------------------------------------------------- COW
// user-supplied classic; only the tail flicks — the 'w' (udder) stays put
const COW = {
  name: 'COW',
  given: 'CLOVER',
  color: PALETTE.cream,
  badge: true,
  base: [
    ' (__)',
    ' (oo)------/`',
    ' (__)    ||',
    '   ||--w||',
  ],
  walk: [
    ' (__)',
    ' (oo)------/,',
    ' (__)    ||',
    '   ||--w||',
  ],
  baseR: [
    '        (__)',
    ' `\\------(oo)',
    '   ||    (__)',
    '   ||w--||',
  ],
  walkR: [
    '        (__)',
    ' ,/------(oo)',
    '   ||    (__)',
    '   ||w--||',
  ],
  lieL: [' (__)', ' (--)------/`', ' (__)____||__'],
  lieR: ['        (__)', ' `\\------(--)', ' __||____(__)'],
};

// ---------------------------------------------------------------- SPIDER
// user-supplied classic; symmetric, so both directions share art —
// the legs re-splay as it scuttles
const SPIDER_A = [
  '/\\ \\  / /\\',
  '//\\\\ .. //\\\\',
  '//\\((  ))/\\\\',
  '/  < `\' >  \\',
];
const SPIDER_B = [
  '\\/ /  \\ \\/',
  '//\\\\ .. //\\\\',
  '//\\((  ))/\\\\',
  '\\  < `\' >  /',
];
const SPIDER = {
  name: 'SPIDER',
  given: 'WEBSTER',
  color: [168, 150, 190],
  badge: true,
  base: SPIDER_A,
  walk: SPIDER_B,
  baseR: SPIDER_A,
  walkR: SPIDER_B,
  lieL: SPIDER_A,
  lieR: SPIDER_A,
};

// ------------------------------------------------------------------ SEAL
// user-supplied classic; it faces where it pleases (both directions share)
const SEAL_A = [
  '    ___',
  '   /  .\\',
  '  /  =__|',
  ' ~~~~~~~~~',
];
const SEAL_B = [
  '    ___',
  '   /  -\\',
  '  /  =__|',
  ' ~~~~~~~~~',
];
const SEAL = {
  name: 'SEAL',
  given: 'PEBBLE',
  color: [158, 178, 196],
  badge: true,
  base: SEAL_A,
  walk: SEAL_B,
  baseR: SEAL_A,
  walkR: SEAL_B,
  lieL: SEAL_B,
  lieR: SEAL_B,
};

const PETS = { dog: DOG, owl: OWL, pig: PIG, cow: COW, spider: SPIDER, seal: SEAL };
const PET_ORDER = ['dog', 'owl', 'pig', 'cow', 'spider', 'seal'];

// -------------------------------------------------------- backyard items
// type 'scene': a standalone companion that REPLACES the pet and reacts to
//               your coding behavior on its own
// type 'ambient': small decoration that stacks with anything
// tint: { base: rgb, chars: { char: rgb } } — per-glyph coloring
const DECOS = {
  city: {
    name: 'CITY',
    type: 'scene',
    // windows (") light up as tokens burn; boat smoke puffs; fireworks on
    // big burns — rendered dynamically in statusline. 5 rows tall.
    rows: [
      ' __    _    __    ___               ( )',
      '|""|  |"|  |""|  |"""|  __       _._ `_',
      '|""|  |"|__|""|  |"""| |""|     (__((_(',
      '|""|  |"|  |""|  |"""| |""|    \\\'-:--:-.',
      '"\'\'"\'"\'"\'\'"""\'\'\'""""\'\'""\'""~~~~\'-----\'~~~~',
    ],
    smokeAlt: [
      ' __    _    __    ___                o',
      '|""|  |"|  |""|  |"""|  __       _._( )',
    ],
    tint: {
      base: PALETTE.stone,
      chars: {
        '#': PALETTE.gold,
        '"': PALETTE.dimstone,
        '~': PALETTE.sky,
        '(': PALETTE.cream, ')': PALETTE.cream, 'o': PALETTE.mist, '`': PALETTE.mist,
      },
    },
  },
  flowers: {
    name: 'FLOWERS',
    type: 'scene',
    // sways both ways while tokens burn; a butterfly visits when you idle.
    // 5 rows; every stem sits exactly on its bloom (cols 4/13/22/31).
    rows: [
      '  vVVVv    wWWWw   (_)@(_)   vVVVv',
      '  (___)    (___)    (___)    (___)',
      '    Y        Y       ~Y~       Y',
      '   \\|/      \\|/      \\|/      \\|/',
      '\\\\\\\\|////\\\\\\\\|////\\\\\\\\|////\\\\\\\\|////',
    ],
    tint: {
      base: PALETTE.sage,
      chars: {
        '@': PALETTE.coral,
        'w': PALETTE.gold, 'W': PALETTE.gold,
        'v': PALETTE.pink, 'V': PALETTE.pink,
        '(': PALETTE.cream, ')': PALETTE.cream, '_': PALETTE.cream,
      },
    },
  },
  cloud: {
    name: 'CLOUD',
    type: 'ambient',
    anchor: 'sky',
    xFrac: 0.78,
    rows: ['   .--.', '.-(    ).', '(___.__)__)'],
    tint: { base: PALETTE.mist },
  },
  tree: {
    name: 'TREE',
    type: 'ambient',
    anchor: 'ground',
    xFrac: 0.1,
    rows: ['   ^', '  /|\\', ' //|\\\\', '   |'],
    tint: { base: PALETTE.sage, chars: { '|': PALETTE.bark } },
  },
  saturn: {
    name: 'SATURN',
    type: 'ambient',
    badge: true,
    anchor: 'sky',
    xFrac: 0.86,
    rows: [
      '     .::.',
      '  ,MM8&&.:\'',
      ' MMM88&&&:\'',
      '.:MM88&&&&',
      ':\'  \'MM8&\'',
    ],
    tint: {
      base: [212, 162, 96],
      chars: { '.': PALETTE.cream, ':': PALETTE.cream, "'": PALETTE.cream, '&': PALETTE.gold },
    },
  },
  apple: {
    name: 'APPLE CORE',
    type: 'ambient',
    badge: true,
    anchor: 'ground',
    xFrac: 0.9,
    rows: [
      ' ,--./,-.',
      '/,-._.--~\\',
      ' __}  {',
      '\\`-._,-`-,',
      ' `._,._,\'',
    ],
    tint: { base: PALETTE.coral, chars: { '}': PALETTE.cream, '{': PALETTE.cream, '_': PALETTE.cream } },
  },
};
const DECO_ORDER = ['city', 'flowers', 'cloud', 'tree', 'saturn', 'apple'];

// returns art rows for a pet in a given state
// state: 'idle' | 'blink' | 'happy' | 'sleep'
function petArt(petId, state, alt = false, dir = 'left', moving = false) {
  const p = PETS[petId] || PETS.dog;
  const right = dir === 'right';
  if (state === 'sleep') {
    const rows = (right ? p.lieR : p.lieL || p.base).slice();
    rows[0] = rows[0] + (alt ? '  z Z' : '  Z z');
    return rows.filter(r => r !== '');
  }
  // fliers take to the air while moving: alternate wing-flap frames
  if (moving && p.fly && p.flyA) {
    const rows = (alt ? p.flyA : p.flyB).slice();
    if (state === 'happy') rows[0] = rows[0] + (alt ? '  *' : ' *');
    return rows;
  }
  const wag = (state === 'happy' && alt) || (state === 'idle' && alt);
  let rows = (right ? (wag ? p.walkR : p.baseR) : (wag ? p.walk : p.base)).slice();
  if (moving) {
    const stride = right ? p.strideR : p.strideL;
    if (stride && alt) rows[rows.length - 1] = stride;
  }
  if (state === 'happy') rows[0] = rows[0] + (alt ? '  *' : ' *');
  return rows;
}

function petName(petId) { const p = PETS[petId] || PETS.dog; return p.given || p.name; }
function petColor(petId) { return (PETS[petId] || PETS.dog).color; }

module.exports = { PETS, PET_ORDER, DECOS, DECO_ORDER, PALETTE, petArt, petName, petColor };
