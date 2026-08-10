'use strict';
// `pet talk <message>` — the /talktopet backend. Parses simple commands the
// pet obeys (mute / sit / sleep / jump / ball / zoom / eat), stores them in
// state, and prints a state summary for the chat model to reply in character.
// The voice follows the adopted pet: dog woofs, owl hoots, pig oinks.

const store = require('./state');
const D = require('./data');
const { PETS } = require('./ascii');
const { tr, perPet } = require('./lang');

const INTENTS = [
  { key: 'mute', re: /(闭嘴|安静|别说话|别叫|quiet|shut ?up|silence)/i, ack: 'ackMute', apply: s => { s.muted = true; } },
  { key: 'unmute', re: /(说话|出声|可以叫|unmute|speak|talk)/i, ack: 'ackUnmute', apply: s => { s.muted = false; } },
  { key: 'sleep', re: /(睡觉|去睡|趴下|sleep|lie down|nap)/i, ack: 'ackSleep', act: 'sleep', mins: 15 },
  { key: 'sit', re: /(坐下|坐好|sit)/i, ack: 'ackSit', act: 'sit', mins: 10 },
  { key: 'jump', re: /(跳|jump|hop)/i, ack: 'ackJump', act: 'jump', mins: 3 },
  { key: 'ball', re: /(玩球|球|ball|play)/i, ack: 'ackBall', act: 'ball', mins: 5 },
  { key: 'zoom', re: /(跑|冲刺|快跑|飞|run|zoom|fly)/i, ack: 'ackZoom', act: 'zoom', mins: 3 },
  { key: 'eat', re: /(吃|喂|饭|eat|feed|food)/i, ack: 'ackEat', act: 'eat', mins: 5 },
  { key: 'free', re: /(自由|随便|解散|free|as you were)/i, ack: 'ackFree', apply: s => { s.forcedAct = null; } },
];

function run(msg) {
  const state = store.load();
  const L = tr(state);
  const petId = PETS[state.activePet] ? state.activePet : 'dog';
  const species = PETS[petId].name;
  const text = (msg || '').trim();
  let applied = 'NONE';
  let ack = perPet(L.ackByPet, petId);

  for (const it of INTENTS) {
    if (it.re.test(text)) {
      ack = perPet(L[it.ack], petId) || it.ack;
      if (it.apply) it.apply(state);
      if (it.act) state.forcedAct = { act: it.act, until: Date.now() + it.mins * 60000 };
      applied = it.key + (it.mins ? ` (${it.mins} min)` : '');
      break;
    }
  }

  state.talkAck = ack;
  state.talkAckAt = Date.now();
  store.save(state);

  const lv = D.level(state.tokensTotal);
  const sinceBurn = (Date.now() - (state.lastBurnAt || 0)) / 60000;
  console.log(`USER SAID TO THE PET: "${text}"`);
  const an = /^[aeiou]/i.test(species) ? 'an' : 'a';
  const voice = { dog: 'woof', owl: 'hoot', pig: 'oink', cow: 'moo', spider: 'web-tapping', seal: 'arf' }[petId] || 'woof';
  console.log(`PET NAME: ${PETS[petId].given}`);
  console.log(`PET SPECIES: ${species} (stay in character — ${an} ${species.toLowerCase()} with a ${voice} voice; the owl flies instead of running)`);
  console.log(`PET STATE: Lv.${lv}, ${D.fmt(state.tokensTotal)} tokens burned lifetime, ` +
    `last token burn ${sinceBurn < 1 ? 'moments' : Math.round(sinceBurn) + ' min'} ago, ` +
    `muted=${!!state.muted}, forced-activity=${state.forcedAct ? state.forcedAct.act : 'none'}`);
  const langName = { en: 'English', zh: 'Chinese', es: 'Spanish', ja: 'Japanese', ko: 'Korean', de: 'German' }[state.lang] || 'English';
  console.log(`PET LANGUAGE: ${langName} (reply in this language)`);
  console.log(`COMMAND APPLIED: ${applied}`);
  console.log(`PET'S INSTANT REACTION (already shown in its status bar bubble): "${ack}"`);
}

module.exports = { run };
