'use strict';

// Global pixel palette. Sprites are arrays of strings; '.' and ' ' = transparent.
const PALETTE = {
  K: [26, 28, 36],    // ink outline / black fur
  k: [70, 74, 90],    // soft black highlight
  W: [240, 242, 246], // white fur
  w: [204, 208, 218], // shaded white
  F: [255, 255, 255], // pure white shine
  P: [255, 158, 170], // blush pink
  p: [255, 196, 205], // light pink
  G: [104, 190, 100], // leaf green
  g: [64, 142, 68],   // dark green
  h: [150, 216, 128], // light green
  B: [150, 104, 66],  // capybara brown
  b: [104, 68, 42],   // dark brown
  s: [184, 138, 94],  // light brown highlight
  Y: [255, 208, 74],  // yellow / gold
  y: [255, 236, 150], // pale yellow
  O: [242, 148, 68],  // orange
  o: [198, 106, 44],  // dark orange stripe
  R: [232, 72, 84],   // red
  r: [180, 40, 56],   // dark red
  U: [86, 132, 226],  // blue
  u: [50, 84, 168],   // dark blue
  V: [168, 110, 220], // violet
  C: [250, 250, 255], // cloud white
  c: [214, 222, 238], // cloud shadow
  E: [126, 88, 54],   // dirt
  D: [92, 62, 40],    // dark dirt
  S: [246, 220, 178], // sand
  Q: [120, 200, 210], // aqua
  M: [235, 235, 240], // moon
  m: [192, 197, 212], // moon crater
  T: [90, 96, 112],   // steel gray
  L: [255, 120, 190], // hot pink
};

function S(...rows) {
  const w = Math.max(...rows.map(r => r.length));
  return rows.map(r => r.padEnd(w, '.'));
}

// mirror a left half into a symmetric full row
const M = half => half + [...half].reverse().join('');

function edit(base, edits) {
  const out = base.slice();
  const w = base[0].length;
  for (const [row, str] of Object.entries(edits)) out[+row] = str.padEnd(w, '.');
  return out;
}

// ---------------------------------------------------------------- PANDA 24x22
// Chibi sitting panda: flat inks like the reference — black, white, blush,
// one shine pixel per eye. No mid-tone noise.
const PANDA_BASE = [
  M('...KKKK.....'), // 0  ears
  M('..KKKKK.....'), // 1
  M('..KKKKKKKKKK'), // 2  head top
  M('..KWWWWWWWWW'), // 3
  M('.KWWWWWWWWWW'), // 4
  M('.KWWKKKKKWWW'), // 5  eye patch
  M('.KWWKFWKKWWW'), // 6  eye shine
  M('.KWWKWWKKWWW'), // 7  eye
  M('.KWWWKKKKWWW'), // 8  patch taper
  M('.KWPPWWWWWWK'), // 9  blush + nose
  M('.KWWWWWWWWWK'), // 10 nose bottom
  M('.KWWWWWWWWWW'), // 11 chin
  M('..KKKKKKKKKK'), // 12 head bottom
  M('...KKKKKWWWW'), // 13 shoulders + chest
  M('..KKKKKKWWWW'), // 14
  M('..KKKKKKWWWW'), // 15
  M('..KKKKKKWWWW'), // 16
  M('..KKKKKKWWWW'), // 17
  M('...KKKKKWWWW'), // 18 paws
  M('..KKKKKKWWWW'), // 19 legs
  M('..KKKKKKKWWW'), // 20 feet
  M('...KKKKKK...'), // 21
];
const PANDA = {
  idle: PANDA_BASE,
  blink: edit(PANDA_BASE, { 6: M('.KWWKKKKKWWW'), 7: M('.KWWKKKKKWWW') }),
  happy: edit(PANDA_BASE, {
    6: M('.KWWKFWKKWWW'),
    10: M('.KWWWWWWWWKR'), // open mouth + tongue
    11: M('.KWWWWWWWWWK'),
  }),
  walk1: edit(PANDA_BASE, { 21: '...KKKKK........KKKKK...' }),
  walk2: edit(PANDA_BASE, { 21: '....KKKKK......KKKKK....' }),
  meta: { hat: [12, 1], eat: { sprite: 'BAMBOO', dx: 10, dy: 8 }, headBottom: 12 },
};
PANDA.eat1 = PANDA.happy;
PANDA.eat2 = PANDA.idle;
PANDA.sleep1 = PANDA.blink;
PANDA.sleep2 = PANDA.blink;

// ------------------------------------------------------------- CAPYBARA 20x14
// Faithful to the classic pixel capybara: faces LEFT, bold ink outline,
// dark fringe on the forehead, light patch on the rump, one ear notch.
const CAPY_BASE = S(
  '.........KK.........',
  '.KKKKKKKKKKKKKKK....',
  '.KbbbbbBBBBBBBBK....',
  'KKbbbbBBBBBBBBBBK...',
  'KbBBKKBBBBBBBBBBK...',
  'KsBBBBBBBBBBBBssK...',
  'KsBBBBBBBBBBBsssK...',
  'KBBBBBBBBBBBssssK...',
  '.KBBBBBBBBBBBsssK...',
  '.KBBBBBBBBBBBBBK....',
  '..KBBBBBBBBBBBBK....',
  '..KKBBKKKKKKBBKK....',
  '...KBBK....KBBK.....',
  '...KKKK....KKKK.....'
);
const CAPY = {
  idle: CAPY_BASE,
  blink: edit(CAPY_BASE, { 4: 'KbBBbbBBBBBBBBBBK...' }),
  happy: edit(CAPY_BASE, {
    4: 'KbBBKKBBBBBBBBBBK...',
    6: 'KKBBBBBBBBBBBsssK...',
  }),
  walk1: edit(CAPY_BASE, {
    12: '..KBBK.....KBBK.....',
    13: '..KKKK.....KKKK.....',
  }),
  walk2: edit(CAPY_BASE, {
    12: '....KBBK..KBBK......',
    13: '....KKKK..KKKK......',
  }),
  meta: { hat: [8, 0], eat: { sprite: 'LEAF', dx: -2, dy: 4 }, headBottom: 10, faces: 'left' },
};
CAPY.eat1 = CAPY.happy;
CAPY.eat2 = CAPY.idle;
CAPY.sleep1 = CAPY.blink;
CAPY.sleep2 = CAPY.blink;

// ------------------------------------------------------------------ CAT 22x18
const CAT_BASE = [
  M('..K........'), // 0 ear tips
  M('..KK.......'), // 1
  M('.KpOK......'), // 2 inner ear
  M('.KOOOKKKKKK'), // 3 head top
  M('.KOOOOOOOOO'), // 4
  M('.KOOOOOOOOO'), // 5
  M('.KOOKFOOOOO'), // 6 eyes
  M('.KOOKKOOOOO'), // 7
  M('.KOOOOOWWWW'), // 8 muzzle
  M('.KOOOOOWWWP'), // 9 nose
  M('.KOOOOOWWKW'), // 10 mouth
  M('..KOOOOOOOO'), // 11
  M('..KOOOOWWWW'), // 12 chest
  M('.KOOOOOWWWW'), // 13
  M('.KOOOOOWWWW'), // 14
  M('.KOOOOOWWWW'), // 15
  M('..KOOOOWWWW'), // 16
  M('...KKK..KKK'), // 17 paws
];
const CAT = {
  idle: CAT_BASE,
  blink: edit(CAT_BASE, { 6: M('.KOOKKOOOOO'), 7: M('.KOOOOOOOOO') }),
  happy: edit(CAT_BASE, { 10: M('.KOOOOOWKRW') }),
  walk1: edit(CAT_BASE, { 17: '...KKK...........KKK..' }),
  walk2: edit(CAT_BASE, { 17: '....KKK.........KKK...' }),
  meta: { hat: [11, 2], eat: { sprite: 'FISH', dx: 8, dy: 9 }, headBottom: 11 },
};
CAT.eat1 = CAT.happy;
CAT.eat2 = CAT.idle;
CAT.sleep1 = CAT.blink;
CAT.sleep2 = CAT.blink;

// -------------------------------------------------------------- PENGUIN 20x18
const PENG_BASE = [
  M('....KKKKKK'), // 0
  M('...KKKKKKK'), // 1
  M('..KKWWWKKK'), // 2 face patches
  M('..KKWKWKKK'), // 3 eyes
  M('..KKWWWKKO'), // 4 beak
  M('..KKKKKKKK'), // 5
  M('..KKKWWWWW'), // 6 belly starts
  M('.KKKWWWWWW'), // 7 wings out
  M('.KKWWWWWWW'), // 8
  M('.KKWWWWWWW'), // 9
  M('.KKWWWWWWW'), // 10
  M('.KKWWWWWWW'), // 11
  M('.KKWWWWWWW'), // 12
  M('.KKKWWWWWW'), // 13
  M('..KKWWWWWW'), // 14
  M('..KKKWWWWW'), // 15
  M('...KKKKKKK'), // 16
  M('...OO.....'), // 17 feet
];
const PENG = {
  idle: PENG_BASE,
  blink: edit(PENG_BASE, { 3: M('..KKWWWKKK') }),
  happy: edit(PENG_BASE, { 7: 'KKKKWWWWWWWWWWWWKKKK', 8: 'K.KWWWWWWWWWWWWWWK.K' }),
  walk1: edit(PENG_BASE, { 17: '...OO...........OO..' }),
  walk2: edit(PENG_BASE, { 17: '....OO.........OO...' }),
  meta: { hat: [10, 0], eat: { sprite: 'FISH', dx: 7, dy: 4 }, headBottom: 5 },
};
PENG.eat1 = PENG.happy;
PENG.eat2 = PENG.idle;
PENG.sleep1 = PENG.blink;
PENG.sleep2 = PENG.blink;

// --------------------------------------------------------------- DRAGON 24x19
const DRAG_BASE = [
  M('...R....R...'), // 0 crest
  M('..KKKKKKKKKK'), // 1 head top
  M('..KGGGGGGGGG'), // 2 head
  M('.KGGGGGGGGGG'), // 3
  M('.KGKFGGGGGGG'), // 4 eyes
  M('.KGKKGGGGGGG'), // 5
  M('.KGGGGGGGGKG'), // 6 nostrils
  M('.KGggggggggG'), // 7 mouth line
  M('..KGGGGGGGGG'), // 8
  M('..KGGGGYYYYY'), // 9 belly
  M('.KGGGGGYYYYY'), // 10
  M('.KGGGGGYYYYY'), // 11
  M('.KGGGGGYYYYY'), // 12
  M('.KGGGGGYYyYY'), // 13
  M('..KGGGGYYYYY'), // 14
  M('..KGGGGGYYYY'), // 15
  M('...KGGGGGGGG'), // 16
  M('...KGG..KGG.'), // 17 legs
  M('...Kgg..Kgg.'), // 18
];
const DRAG = {
  idle: DRAG_BASE,
  blink: edit(DRAG_BASE, { 4: M('.KGKKGGGGGGG'), 5: M('.KGGGGGGGGGG') }),
  happy: edit(DRAG_BASE, { 7: M('.KGggOOOgggG') }),
  walk1: edit(DRAG_BASE, { 18: '...Kgg...Kgg.Kgg...Kgg..'.slice(0, 24) }),
  walk2: edit(DRAG_BASE, { 18: '..Kgg...Kgg...Kgg...Kgg.'.slice(0, 24) }),
  meta: { hat: [12, 2], eat: { sprite: 'GEM', dx: 10, dy: 7 }, headBottom: 8 },
};
DRAG.eat1 = DRAG.happy;
DRAG.eat2 = DRAG.idle;
DRAG.sleep1 = DRAG.blink;
DRAG.sleep2 = DRAG.blink;

// ------------------------------------------- MINI pets (2px tall, statusline)
// [topRow, bottomRow]; rendered with ▀ half-blocks in one terminal line.
const MINI = {
  panda:   { f1: ['KKWWWWWWKK', 'WWKWWWWKWW'], f2: ['KKWWWWWWKK', 'WWWWWWWWWW'] },
  capy:    { f1: ['.bbKBBBBb.', 'GBBBBBBBB.'], f2: ['.bbKBBBBb.', '.BBBBBBBB.'] },
  cat:     { f1: ['KO.OOOO.OK', 'OOKOOOOKOO'], f2: ['KO.OOOO.OK', 'OOOOOOOOOO'] },
  penguin: { f1: ['.KKKKKKKK.', 'KKWKWWKWKK'], f2: ['.KKKKKKKK.', 'KKWWWWWWKK'] },
  dragon:  { f1: ['R.GGGGGG.R', 'GKGGYYGGKG'], f2: ['R.GGGGGG.R', 'GGGGYYGGGG'] },
};

// -------------------------------------------------------------- overlays
const BAMBOO = S('.g..', 'gG..', '.G..', '.Gg.', '.G..', '.G..', '.G..');
const LEAF = S('.GG.', 'GGg.', '.g..');
const FISH = S('.QQQQ.Q', 'QQFQQQQ', '.QQQQ.Q');
const GEM = S('.QQ.', 'QFQQ', '.QQ.');
const ARM = S('..KK', '.KKk', '.KK.', 'KKK.', 'KK..'); // raised arm, drawn beside the pet

const HEART = S('.L.L.', 'LLLLL', 'LLLLL', '.LLL.', '..L..');
const SPARK = S('..F..', '.FFF.', 'F.F.F', '.FFF.', '..F..');

// hats — `overlap` = rows that overlap the head below the anchor line
const HATS = {
  leaf: { overlap: 1, art: S('..GG...', '.GGGg..', 'GgGg...', '..g....') },
  party: {
    overlap: 2,
    art: S('....F....', '....Y....', '...YYY...', '...RRR...', '..YYYYY..', '..RRRRR..', '.YYYYYYY.'),
  },
  phones: {
    overlap: 5,
    art: S(
      '....KKKKKKKK....',
      '..KKKKKKKKKKKK..',
      '.KKK........KKK.',
      '.KK..........KK.',
      'UKK..........KKU',
      'UUK..........KUU'
    ),
  },
  crown: {
    overlap: 2,
    art: S('Y....Y....Y', 'YY..YYY..YY', 'YYY.YYY.YYY', 'YYYYYYYYYYY', 'YRYYYVYYYRY', 'YYYYYYYYYYY'),
  },
  wizard: {
    overlap: 3,
    art: S(
      '......F......',
      '.....UU......',
      '.....UUU.....',
      '....UUUU.....',
      '....UUUUU....',
      '...UUYUUU....',
      '...UUUUUUU...',
      '..UUUUUUUUU..',
      'UUUUUUUUUUUUU'
    ),
  },
};

// ---------------------------------------------------------------- scene props
const CLOUD_A = S(
  '.....CCCCCC.......',
  '...CCCCCCCCCC.....',
  '.CCCCCCCCCCCCCCC..',
  'CCCCCCCCCCCCCCCCC.',
  '.ccCCCCCCCCCCCcc..'
);
const CLOUD_B = S(
  '...CCCC.....',
  '.CCCCCCCCC..',
  'CCCCCCCCCCC.',
  '.ccCCCCCcc..'
);

const SUN = S(
  '..yYYYy..',
  '.yYYYYYy.',
  'yYYYYYYYy',
  'YYYYFYYYY',
  'yYYYYYYYy',
  '.yYYYYYy.',
  '..yYYYy..'
);

const MOON = S(
  '..MMMM...',
  '.MMMMMM..',
  'MMmMMMMM.',
  'MMMMMMmM.',
  'MMmMMMMM.',
  '.MMMMMM..',
  '..MMMM...'
);

const TREE = S(
  '......gg......',
  '.....gGGg.....',
  '.....GGGG.....',
  '....gGGGGg....',
  '....GGhGGG....',
  '...gGGGGGGg...',
  '...GGGGhGGG...',
  '..gGGhGGGGGg..',
  '..GGGGGGGhGG..',
  '..gGGGGGGGGg..',
  '.gGGhGGGGGGGg.',
  '.GGGGGGGhGGGG.',
  '..GGGGGGGGGG..',
  '...gGGGGGGg...',
  '......bb......',
  '......bb......',
  '.....bbbb.....'
);

const BUSH = S(
  '...gGGg..gGg....',
  '..gGGhGGGGGGg...',
  '.gGGGGGGGhGGGg..',
  'gGGhGGGGGGGGGGg.',
  'GGGGGGhGGGGhGGG.'
);

const FLOWER_A = S('.R.', 'RYR', '.g.', '.g.');
const FLOWER_B = S('.V.', 'VYV', '.g.', '.g.');
const FLOWER_C = S('.y.', 'yFy', '.g.', '.g.');

const EGG = S(
  '.....wWWW.....',
  '...WWWWWWWw...',
  '..WWWWWWWWWw..',
  '.WWFWWWWWWWWw.',
  '.WFWWWWWWWWWw.',
  'WWWWWWWWWWWWww',
  'WWWWWWWWWWWWww',
  'WWWWWWWWWWWWww',
  'WWWWWWWWWWWWw.',
  '.WWWWWWWWWWw..',
  '..wWWWWWWww...',
  '...wwWWww.....'
);
const EGG_CRACK1 = edit(EGG, {
  3: '.WWFWKWWWWWWw.',
  4: '.WFWKWKWWWWWw.',
});
const EGG_CRACK2 = edit(EGG_CRACK1, {
  4: '.WFWKWKWWWWWw.',
  5: 'WWWKWWWKWWWWww',
  6: 'WWWWKWWWKWWWww',
  7: 'WWWKWWWWWKWWww',
});

module.exports = {
  PALETTE, S, M, edit,
  PETS_ART: { panda: PANDA, capy: CAPY, cat: CAT, penguin: PENG, dragon: DRAG },
  MINI,
  HATS,
  BAMBOO, LEAF, FISH, GEM, ARM, HEART, SPARK,
  CLOUD_A, CLOUD_B, SUN, MOON, TREE, BUSH, FLOWER_A, FLOWER_B, FLOWER_C,
  EGG, EGG_CRACK1, EGG_CRACK2,
};
