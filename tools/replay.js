// Usage: node tools/replay.js .   (needs Playwright, and Chapter 2's code: pull request 3)
// Set SAVE='<json>' to test CONTINUE from an existing save instead of a new game.
// Screenshots are written to the current directory as replay-*.png.
// Scripted replay: title -> prologue -> Chapter 1 -> end card -> Chapter 2 -> end card.
// Drives the game through its own keyboard handler with a stepped clock.
const { chromium } = require('playwright');
const path = require('path');
const root = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 640 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(() => {
    window.__cb = null; window.__ts = 0;
    window.requestAnimationFrame = (cb) => { window.__cb = cb; return 1; };
    window.__frame = (ms) => { const cb = window.__cb; window.__cb = null; window.__ts += ms; cb(window.__ts); };
  });
  await p.goto('file://' + path.resolve(root, 'play.html'));
  await p.waitForFunction(() => !!window.__cb);
  const log = [];
  const shot = async (n) => { await p.evaluate(() => window.__frame(17)); await p.screenshot({ path: 'replay-' + n + '.png' }); };

  // One page-side bot call. Returns when `until` is reached or the tick budget runs out.
  const run = (job) => p.evaluate((job) => {
    const M = window.MORE;
    const tick = (n = 1) => { for (let i = 0; i < n; i++) window.__frame(16.7); };
    const fast = (n) => { for (let i = 0; i < n; i += 8) window.__frame(133.4); };
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
    const tap = (code) => { key(code, true); tick(2); key(code, false); tick(2); };
    const D = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    const move = (d) => { key(D[d], true); tick(1); key(D[d], false); tick(9); };
    const scene = () => M.debug.scene;
    const st = () => M.debug.factory && M.debug.factory.st;
    const out = { said: [], notes: [] };
    let lastLine = null;
    const noteDialog = () => {
      const d = M.dialog;
      if (d.active) { const k = d.who + '|' + d.page + '|' + (d.pages[0] || []).join(' '); if (k !== lastLine) { lastLine = k; out.said.push(d.who + ': ' + d.pages.map((x) => x.join(' ')).join(' ') + (d.choices ? ' [' + d.choices.join(' / ') + ']' : '')); } }
    };
    // Mash A through any dialog until the floor has been quiet for 5 seconds.
    const settle = () => { let quiet = 0, n = 0; while (quiet < 300 && n++ < 40000 && scene() === 'factory') { noteDialog(); if (M.dialog.active) { tap('KeyZ'); quiet = 0; } else { tick(4); quiet += 4; } } };
    const cellsDump = () => { const f = M.debug.factory; const c = f.cells; const o = []; const flat = Array.isArray(c[0]) ? c.flat() : c; flat.forEach((e, i) => { if (e) o.push((i % f.cfg.cols) + ',' + Math.floor(i / f.cfg.cols) + ':' + (e.t === 'belt' ? 'b' + e.dir : e.kind)); }); return o.join(' '); };
    const path = (moves) => moves.split(' ').forEach((m) => { if (m === 'A+') { key('KeyZ', true); tick(2); } else if (m === 'A-') { key('KeyZ', false); tick(2); } else if (m === 'B') tap('KeyX'); else if (m === 'SEL') tap('ShiftLeft'); else if (m === 'A') tap('KeyZ'); else move(m); });

    if (job.kind === 'until') {
      // generic: tap keys until scene changes to target
      let n = 0;
      while (scene() !== job.scene && n++ < job.max) { noteDialog(); tap(n % 7 === 6 ? 'Enter' : 'KeyZ'); tick(6); }
      out.scene = scene(); out.n = n; return out;
    }
    if (job.kind === 'menu') { path(job.keys); tick(30); out.scene = scene(); return out; }
    if (job.kind === 'build') {
      settle();
      if (scene() !== 'factory') { out.scene = scene(); return out; }
      path(job.keys);
      tick(20);
      out.cells = cellsDump(); out.clips = st().clips; out.inv = JSON.stringify(st().inv); out.scene = scene();
      return out;
    }
    if (job.kind === 'produce') {
      // run the line, answering dialog (first option), until a predicate or scene change
      let n = 0;
      const pred = new Function('st', 'return ' + job.until);
      while (scene() === 'factory' && n < job.max) {
        noteDialog();
        if (M.dialog.active) { tap('KeyZ'); n += 4; } else { fast(16); n += 16; }
        if (!M.dialog.active && pred(st())) { break; }
      }
      const s = st();
      out.scene = scene(); out.ticks = n; out.clips = s && s.clips; out.flags = s && Object.keys(s.flags).join(','); out.crew = s && JSON.stringify(s.crew || null); out.inv = s && JSON.stringify(s.inv);
      return out;
    }
    if (job.kind === 'wait') { fast(job.ticks); out.scene = scene(); return out; }
  }, job);
  const step = async (label, job) => { const r = await run(job); const said = r.said; delete r.said; log.push({ label, ...r, lines: said.length }); console.log(label, JSON.stringify(r), 'lines:' + said.length); if (process.env.SAID) said.forEach((s) => console.log('    ' + s)); return r; };

  if (process.env.SAVE) await p.evaluate((s) => localStorage.setItem('more.save.v1', s), process.env.SAVE);
  await step('boot->title', { kind: 'until', scene: 'title', max: 400 });
  if (process.env.SAVE) {
    await shot('title-continue');
    await step('CONTINUE', { kind: 'menu', keys: 'A A' });
    await step('to floor', { kind: 'until', scene: 'factory', max: 600 });
    await step('ch2 opens', { kind: 'produce', until: 'st.flags.intro', max: 20000 });
    await shot('continue-ch2');
    console.log('save now:', await p.evaluate(() => localStorage.getItem('more.save.v1')));
  } else {
    await step('NEW GAME', { kind: 'menu', keys: 'A up up A' });
    await step('prologue', { kind: 'until', scene: 'factory', max: 4000 });
    await shot('ch1-start');
    await step('ch1 lay line', { kind: 'build', keys: 'left left up A+ right right right right down left left down down right right right right right A-' });
    await shot('ch1-line');
    await step('ch1 to whistle+night', { kind: 'produce', until: 'false', max: 400000 });
    await shot('ch1-end');
    console.log('save after ch1:', await p.evaluate(() => localStorage.getItem('more.save.v1')));
    await step('end card 1', { kind: 'wait', ticks: 700 });
    await step('into ch2', { kind: 'until', scene: 'factory', max: 800 });
    await shot('ch2-start');
    await step('ch2 intro', { kind: 'produce', until: 'st.flags.intro', max: 30000 });
    await step('ch2 connect line two', { kind: 'build', keys: 'left left left down A+ right right right right right right right right A-' });
    await shot('ch2-line2');
    await step('ch2 to new cutter', { kind: 'produce', until: '(st.inv.cutter2||0)>0', max: 200000 });
    // drone is on Otis's table (8,2). New cutter at (2,3), route wire past Tomas into Bea.
    await step('ch2 bypass Tomas', { kind: 'build', keys: 'left left left left left left left B down right SEL A left left up A+ down right right right right right up A-' });
    await shot('ch2-bypass-tomas');
    await step('ch2 Tomas home', { kind: 'produce', until: '(st.inv.bender2||0)>0', max: 200000 });
    // drone on Bea's bench (5,2). New bender replaces the belt at (5,3), then on to Otis.
    await step('ch2 bypass Bea', { kind: 'build', keys: 'down B SEL A A+ right right right up A-' });
    await step('ch2 Bea home', { kind: 'produce', until: '(st.inv.bin2||0)>0', max: 200000 });
    // drone on Otis's table (8,2). New bin replaces the belt at (8,3).
    await step('ch2 bypass Otis', { kind: 'build', keys: 'down B SEL A up' });
    await shot('ch2-bypass-otis');
    await step('ch2 Otis home', { kind: 'produce', until: '(st.inv.spool2||0)>0', max: 200000 });
    await shot('ch2-crew-gone');
    await step('ch2 to the end', { kind: 'produce', until: 'false', max: 600000 });
    await shot('ch2-end');
    await step('end card 2', { kind: 'wait', ticks: 700 });
    await shot('ch2-endcard');
    console.log('save after ch2:', await p.evaluate(() => localStorage.getItem('more.save.v1')));
    await step('back to title', { kind: 'until', scene: 'title', max: 400 });
  }
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
