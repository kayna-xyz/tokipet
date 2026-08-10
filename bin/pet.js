#!/usr/bin/env node
'use strict';
if (process.argv[2] === 'statusline') {
  require('../src/statusline').run();
  return;
}
if (process.argv[2] === 'talk') {
  require('../src/talk').run(process.argv.slice(3).join(' '));
  return;
}
if (process.argv[2] === 'setup') {
  require('../src/setup').run(process.argv.slice(3));
  return;
}
if (process.argv[2] === 'window') {
  require('../src/setup').openWindow();
  return;
}
if (!process.argv[2] || process.argv[2] === 'home') {
  if (process.stdout.isTTY) {
    require('../src/home').run();
    return;
  }
}
require('../src/app').main(process.argv.slice(2)).catch(err => {
  try { require('../src/term').leave(); } catch { /* ignore */ }
  console.error(err);
  process.exit(1);
});
