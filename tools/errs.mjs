// Scroll the whole page like a visitor and report anything that broke.
//
//   node tools/errs.mjs            # desktop
//   node tools/errs.mjs 390 844    # phone
//
// Checks: console errors and uncaught exceptions, horizontal overflow (the page
// body must never scroll sideways), and that the reduced-motion path still
// unpins everything. Exits non-zero if anything failed, so it can gate a deploy.

import { withPage, goto, sleep, PAGE } from './cdp.mjs';

const width = Number(process.argv[2]) || 1440;
const height = Number(process.argv[3]) || 900;
let failed = false;

await withPage(async session => {
  const logs = [];
  await session.send('Log.enable');
  session.on(m => {
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      logs.push('console: ' + m.params.entry.text);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      logs.push('exception: ' + (m.params.exceptionDetails.exception?.description || '?'));
    }
  });

  // --- normal motion
  await goto(session, { width, height, settle: 2500 });
  const docH = await session.eval('document.documentElement.scrollHeight');
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    await session.eval(`window.scrollTo(0, ${Math.round((i / steps) * (docH - height))})`);
    await sleep(150);
  }
  await sleep(600);

  const overflow = await session.eval(
    'JSON.stringify({ scrollW: document.documentElement.scrollWidth, inner: window.innerWidth })');
  const { scrollW, inner } = JSON.parse(overflow);
  const sideways = scrollW > inner + 1;

  console.log(`viewport      ${width}x${height}`);
  console.log(`document      ${docH}px tall`);
  console.log(`h-overflow    ${sideways ? `FAIL ${scrollW} > ${inner}` : 'ok'}`);
  if (sideways) failed = true;

  // --- reduced motion: every section should unpin, so the page gets shorter
  await session.send('Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await goto(session, { url: PAGE, width, height, settle: 2200 });
  const reduced = await session.eval(`JSON.stringify({
    flagged: document.documentElement.classList.contains('reduced'),
    h: document.documentElement.scrollHeight,
    pin: getComputedStyle(document.querySelector('.hero-pin')).position,
    wok: document.getElementById('wokTemp').textContent
  })`);
  const r = JSON.parse(reduced);
  const okReduced = r.flagged && r.pin === 'relative' && r.h < docH;
  console.log(`reduced-motion ${okReduced ? 'ok' : 'FAIL'}  ` +
              `(flagged=${r.flagged} pin=${r.pin} height=${r.h} wok=${r.wok})`);
  if (!okReduced) failed = true;

  console.log(`console       ${logs.length ? 'FAIL' : 'clean'}`);
  logs.slice(0, 15).forEach(l => console.log('   ' + l));
  if (logs.length) failed = true;
});

console.log(failed ? '\nFAILED' : '\nall clear');
process.exit(failed ? 1 : 0);
