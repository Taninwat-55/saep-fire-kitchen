// Render every procedural motif large, on one contact sheet.
//
//   node tools/proof.mjs        ->  tools/.out/proof.png
//
// Why this exists: at the size the motifs appear on the page, a wrong drawing
// still reads as "some glowing line art". Blown up to 760px the mistakes are
// obvious and immediate — the first chilli cluster read unmistakably as a
// cannabis leaf, and the makrut leaf read as a fish skeleton. Neither was
// visible in a page screenshot. Run this after touching INGREDIENTS.
//
// It slices the geometry helpers and the INGREDIENTS object straight out of
// index.html, so the sheet can never drift from the real drawings.

import { readFileSync, writeFileSync } from 'node:fs';
import { withPage, sleep, ROOT, OUT } from './cdp.mjs';

const src = readFileSync(`${ROOT}/index.html`, 'utf8');
const from = src.indexOf('function bez(p0,p1,p2,p3,n){');
const to = src.indexOf('var DPR = Math.min(');
if (from < 0 || to < 0 || to < from) {
  throw new Error('could not find the geometry block in index.html — ' +
    'the anchors "function bez(" and "var DPR = Math.min(" moved.');
}
const geometry = src.slice(from, to);

const page = `<!DOCTYPE html><meta charset="utf-8"><title>motif proof</title>
<style>
 body{background:#0A0806;color:#EDE5D6;font:12px ui-monospace,monospace;margin:0;padding:14px}
 .g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
 figure{margin:0;border:1px solid #241b14}
 canvas{display:block;width:100%;aspect-ratio:1}
 figcaption{padding:6px 8px;color:#9C9182;letter-spacing:.16em;text-transform:uppercase}
</style>
<div class="g" id="g"></div>
<script>
function clamp(v,a,b){return v<a?a:(v>b?b:v)}
function lerp(a,b,t){return a+(b-a)*t}
function easeInOut(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
${geometry}
// the accent each motif actually appears in on the page
var COLORS={chili:[255,61,23],leaf:[200,232,90],fish:[134,174,190],
            palm:[224,145,63],grass:[136,119,230],
            krajang:[255,61,23],krajangSmall:[255,61,23]};
var g=document.getElementById('g');
Object.keys(INGREDIENTS).forEach(function(name){
  var f=document.createElement('figure');
  f.innerHTML='<canvas width="760" height="760"></canvas><figcaption>'+name+'</figcaption>';
  g.appendChild(f);
  var cv=f.querySelector('canvas'), ctx=cv.getContext('2d');
  var c=COLORS[name]||[237,229,214], col='rgb('+c.join(',')+')';
  ctx.save();
  ctx.translate(380,380);
  var sc=760/340; ctx.scale(sc,sc);
  var S=ing(name), k=1/sc;
  // the same three passes the page uses: bloom, glow, line
  ctx.globalAlpha=.09; drawStrokes(ctx,S,1,col,14*k);
  ctx.globalAlpha=.20; drawStrokes(ctx,S,1,col,5.5*k);
  ctx.globalAlpha=.95; drawStrokes(ctx,S,1,col,1.9*k);
  ctx.restore();
  // centre cross, to judge placement in the 340-unit box
  ctx.strokeStyle='rgba(237,229,214,.14)'; ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(380,0); ctx.lineTo(380,760);
  ctx.moveTo(0,380); ctx.lineTo(760,380);
  ctx.stroke();
});
document.title='proof:'+Object.keys(INGREDIENTS).length;
</script>`;

const file = `${OUT}/proof.html`;
writeFileSync(file, page);

await withPage(async session => {
  await session.send('Emulation.setDeviceMetricsOverride',
    { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });
  const loaded = session.once('Page.loadEventFired');
  await session.send('Page.navigate', { url: 'file://' + file });
  await loaded;
  await sleep(1200);
  const n = await session.eval('Object.keys(INGREDIENTS).length');
  const shot = await session.send('Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: true });
  writeFileSync(`${OUT}/proof.png`, Buffer.from(shot.data, 'base64'));
  console.log(`${n} motifs  ->  ${OUT}/proof.png`);
});
