// Shared Chrome DevTools Protocol helper.
//
// The browser extension isn't always connected, and headless Chrome's
// --screenshot + --virtual-time-budget combination is unreliable on a page that
// runs a permanent requestAnimationFrame loop (it captures blank frames). So we
// drive a real headless Chrome over CDP instead: launch it, connect, script it,
// screenshot, kill it. Needs Node 22+ for the global WebSocket.

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = resolve(ROOT, 'tools/.out');
export const PAGE = 'file://' + resolve(ROOT, 'index.html');

// created on import so tools can write into it before launching a browser
mkdirSync(OUT, { recursive: true });

const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Launch headless Chrome on a random high port and wait for CDP to answer. */
export async function launch() {
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = `/tmp/chrome-saep-${port}`;
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  for (let i = 0; i < 40; i++) {
    await sleep(400);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return { port, child };
    } catch { /* not up yet */ }
  }
  child.kill();
  throw new Error('Chrome did not expose a CDP port — is it installed at ' + CHROME + '?');
}

class Session {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve: res, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method) {
        this.listeners.forEach(fn => fn(m));
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, reject) => this.pending.set(id, { resolve: res, reject }));
  }
  on(fn) { this.listeners.push(fn); }
  once(method, timeout = 20000) {
    return new Promise((res, reject) => {
      const t = setTimeout(() => reject(new Error('timed out waiting for ' + method)), timeout);
      const fn = m => {
        if (m.method === method) {
          clearTimeout(t);
          this.listeners = this.listeners.filter(x => x !== fn);
          res(m.params);
        }
      };
      this.listeners.push(fn);
    });
  }
  /** Evaluate in the page. Returns the value of the final expression. */
  async eval(expr, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate',
      { expression: expr, awaitPromise, returnByValue: true });
    if (r.exceptionDetails) {
      throw new Error('page threw: ' +
        (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
    }
    return r.result?.value;
  }
}

/** Attach to the launched browser's first page target. */
export async function attach(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find(t => t.type === 'page');
  if (!page) throw new Error('no page target to attach to');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const s = new Session(ws);
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  return s;
}

/** Launch + attach + run + always tear down. */
export async function withPage(fn) {
  const { port, child } = await launch();
  let session;
  try {
    session = await attach(port);
    return await fn(session);
  } finally {
    try { session?.ws.close(); } catch { /* already gone */ }
    child.kill('SIGKILL');
  }
}

/**
 * Load the page, then scroll so that `selector` sits at `offset` (0..1) through
 * its own pinned scroll span. Waits for fonts and for the loader to clear.
 */
export async function goto(session, { url = PAGE, selector, offset = 0.5, width = 1440,
                                      height = 900, dpr = 1, mobile = false, settle = 3000 } = {}) {
  await session.send('Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: dpr, mobile });
  const loaded = session.once('Page.loadEventFired');
  await session.send('Page.navigate', { url });
  await loaded;
  await session.eval('document.fonts.ready.then(() => 1)', true);
  await sleep(500);
  let info = null;
  if (selector) {
    info = await session.eval(`(function () {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return 'NO MATCH for ' + ${JSON.stringify(selector)};
      var top = el.getBoundingClientRect().top + window.scrollY;
      var span = Math.max(el.offsetHeight - window.innerHeight, 0);
      var y = Math.round(top + span * ${offset});
      window.scrollTo(0, y);
      return JSON.stringify({ y: y, top: Math.round(top), h: el.offsetHeight, span: span });
    })()`);
  }
  // the loader runs ~1.25s then fades; the accent lerps in over another second
  await sleep(settle);
  return info;
}
