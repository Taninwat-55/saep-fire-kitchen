// Screenshot any section of the page at any scroll position and viewport.
//
//   node tools/shots.mjs                              # a default sweep
//   node tools/shots.mjs "#menu" 0.1                  # one shot
//   node tools/shots.mjs "#wok" 0.8 390 844 2         # phone, 2x
//   node tools/shots.mjs '[{"name":"a","sel":"#hero","off":0}]'
//
// PNGs land in tools/.out/. The `off` value is how far through that section's
// pinned scroll span to sit: 0 is its first frame, 1 its last. Sections without
// a pin (#heat, #room, #reserve) have a span of 0, so off is ignored there.

import { writeFileSync } from 'node:fs';
import { withPage, goto, OUT } from './cdp.mjs';

const DEFAULT = [
  { name: 'hero',    sel: '#hero',                     off: 0 },
  { name: 'stmt',    sel: '#statement',                off: 0.5 },
  { name: 'phet',    sel: '.chapter',                  off: 0.5 },
  { name: 'priao',   sel: '.chapter:nth-of-type(4)',   off: 0.5 },
  { name: 'khem',    sel: '.chapter:nth-of-type(5)',   off: 0.5 },
  { name: 'waan',    sel: '.chapter:nth-of-type(6)',   off: 0.5 },
  { name: 'hom',     sel: '.chapter:nth-of-type(7)',   off: 0.5 },
  { name: 'balance', sel: '#balance',                  off: 0.85 },
  { name: 'wok',     sel: '#wok',                      off: 0.82 },
  { name: 'menu',    sel: '#menu',                     off: 0.1 },
  { name: 'heat',    sel: '#heat',                     off: 0.5 },
  { name: 'room',    sel: '#room',                     off: 0.3 },
  { name: 'reserve', sel: '#reserve',                  off: 0.4 },
];

// NOTE: .chapter:nth-of-type(N) counts every <section>, not just chapters —
// the five tastes are 3, 4, 5, 6, 7.

const [a, b, c, d, e] = process.argv.slice(2);
let shots;
if (!a) {
  shots = DEFAULT;
} else if (a.trim().startsWith('[')) {
  shots = JSON.parse(a);
} else {
  shots = [{
    name: a.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'shot',
    sel: a, off: b === undefined ? 0.5 : Number(b),
    w: c ? Number(c) : 1440, h: d ? Number(d) : 900, dpr: e ? Number(e) : 1,
  }];
}

await withPage(async session => {
  for (const s of shots) {
    const info = await goto(session, {
      selector: s.sel, offset: s.off ?? 0.5,
      width: s.w ?? 1440, height: s.h ?? 900,
      dpr: s.dpr ?? 1, mobile: !!s.mobile, settle: s.settle ?? 3000,
    });
    const shot = await session.send('Page.captureScreenshot', { format: 'png' });
    const file = `${OUT}/${s.name}.png`;
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    console.log(`${(s.name + ' ').padEnd(10, '.')} ${info}  ->  ${file}`);
  }
});
