// MORE. — scripted playthroughs
//
//   node tools/replay.js            run every playthrough
//   node tools/replay.js ch1 ch2    run the named ones
//   node tools/replay.js --list     list them
//
// Each playthrough loads play.html in headless Chromium (Playwright) and plays
// through the game's own keyboard handler on a stepped clock, so a 25 minute
// run takes a few seconds and is the same every time. It exits 1 if a check
// fails or the page logs an error.
//
//   HASHES=out.json   also write a hash of the screen at every checkpoint, to
//                     compare two versions of the game frame for frame
//   SHOTS=dir         write a screenshot at each named checkpoint
//   SAID=1            print every line of dialog
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.mp3': 'audio/mpeg', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp' };

function serve() {
  const srv = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// --- the bot that runs inside the page ----------------------------------------------------
// One call does one job and returns what it saw.
function bot(job) {
  const M = window.MORE;
  const out = { said: [], hashes: [] };
  const hash = (label) => {
    const cv = document.getElementById('screen');
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i += 4) {
      h = Math.imul(h ^ d[i], 16777619);
      h = Math.imul(h ^ d[i + 1], 16777619);
      h = Math.imul(h ^ d[i + 2], 16777619);
    }
    out.hashes.push(label + ':' + (h >>> 0).toString(16));
  };
  let ticks = 0;
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      window.__frame(16.7);
      if (job.hash && ++ticks % 600 === 0) hash('t' + ticks);
    }
  };
  const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
  const tap = (code) => {
    key(code, true);
    tick(2);
    key(code, false);
    tick(2);
  };
  const CODE = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', A: 'KeyZ', B: 'KeyX', SEL: 'ShiftLeft', START: 'Enter' };
  // "left left A+ right A- B": taps, with A+ / A- to hold and release A
  const keys = (str) =>
    str.split(' ').forEach((m) => {
      if (m === 'A+') {
        key('KeyZ', true);
        tick(2);
      } else if (m === 'A-') {
        key('KeyZ', false);
        tick(2);
      } else if (m === 'up' || m === 'down' || m === 'left' || m === 'right') {
        key(CODE[m], true);
        tick(1);
        key(CODE[m], false);
        tick(9);
      } else tap(CODE[m]);
    });
  const scene = () => M.debug.scene;
  const st = () => (M.debug.factory ? M.debug.factory.st : null);
  let last = null;
  const listen = () => {
    const d = M.dialog;
    if (!d.active) return;
    const k = d.who + '|' + d.page + '|' + d.pages.map((p) => p.join(' ')).join(' ');
    if (k === last) return;
    last = k;
    out.said.push(d.who + ': ' + d.pages.map((p) => p.join(' ')).join(' ') + (d.choices ? ' [' + d.choices.join(' / ') + ']' : ''));
  };
  // Answer a dialog: the first choice, unless the job names a different one.
  const answer = () => {
    const d = M.dialog;
    if (d.choices && job.pick) {
      for (const label in job.pick) {
        const i = d.choices.indexOf(label);
        if (i < 0 || job.pick[label] <= 0 || d.chars < d.pageLen()) continue;
        job.pick[label]--;
        while (d.sel !== i) keys('down');
        break;
      }
    }
    tap('KeyZ');
  };
  const cells = () => {
    const f = M.debug.factory;
    return f.cells
      .map((e, i) => (e ? (i % f.cfg.cols) + ',' + Math.floor(i / f.cfg.cols) + ':' + (e.t === 'belt' ? 'b' + e.dir : e.kind) : null))
      .filter(Boolean)
      .join(' ');
  };

  if (job.do === 'keys') {
    keys(job.keys);
    tick(job.after || 30);
  } else if (job.do === 'until') {
    // press A (and now and then START) until the named scene is up
    let n = 0;
    while (scene() !== job.scene && n++ < (job.max || 4000)) {
      listen();
      tap(n % 7 === 6 ? 'Enter' : 'KeyZ');
      tick(6);
    }
  } else if (job.do === 'build') {
    // wait for the floor to go quiet for 5 seconds, then press the keys
    let quiet = 0;
    let n = 0;
    while (quiet < 300 && n++ < 40000 && scene() === 'factory') {
      listen();
      if (M.dialog.active) {
        answer();
        quiet = 0;
      } else {
        tick(4);
        quiet += 4;
      }
    }
    if (scene() === 'factory') {
      keys(job.keys);
      tick(20);
      out.cells = cells();
    }
  } else if (job.do === 'run') {
    // let the line run, answering dialog, until the test is true or the scene changes
    const test = new Function('st', 'return ' + (job.until || 'false'));
    let n = 0;
    while (scene() === 'factory' && n < (job.max || 600000)) {
      listen();
      if (M.dialog.active) {
        answer();
        n += 4;
      } else {
        tick(16);
        n += 16;
        if (test(st())) break;
      }
    }
  } else if (job.do === 'wait') {
    tick(job.ticks);
  }
  if (job.hash) hash('end');
  const s = st();
  out.scene = scene();
  if (s) {
    out.clips = s.clips;
    out.flags = Object.keys(s.flags);
    out.crew = s.crew;
    out.inv = s.inv;
    out.refusals = s.refusals;
    out.chapter = M.debug.factory.cfg.id;
  }
  out.save = JSON.parse(localStorage.getItem('more.save.v2') || 'null');
  out.oldSave = !!localStorage.getItem('more.save.v1');
  return out;
}

// --- the playthroughs --------------------------------------------------------------------
// The floor in Chapter 1: lay belt spool > cutter > bender > bin in one stroke.
const CH1_LINE = 'left left up A+ right right right right down left left down down right right right right right A-';
// Chapter 2, from the drone's start: connect spool > Tomas > Bea > Otis.
const CH2_LINE2 = 'left left left down A+ right right right right right right right right A-';
// Take the belt into Tomas's bench away, stand a new cutter below it and run wire round to Bea.
const CH2_PAST_TOMAS = 'left left left left left left left B down right SEL A left left up A+ down right right right right right up A-';
// A new bender in place of the belt under Bea, and on to Otis.
const CH2_PAST_BEA = 'down B SEL A A+ right right right up A-';
// A new bin in place of the belt under Otis.
const CH2_PAST_OTIS = 'down B SEL A up';

const ch1Steps = (pick) => [
  { name: 'ch1 lay the line', do: 'build', keys: CH1_LINE, shot: 'ch1-line', expect: (r) => /4,0:b2 .*6,3:b1/.test(r.cells) || 'the line was not laid: ' + r.cells },
  { name: 'ch1 to the end card', do: 'run', pick, shot: 'ch1-end', expect: (r) => (r.scene === 'chapterEnd' && r.clips >= 750) || 'did not reach the end card: ' + r.scene + ' at ' + r.clips },
];
const ch2Steps = (pick) => [
  { name: 'ch2 intro', do: 'run', until: 'st.flags.intro', max: 30000, expect: (r) => r.crew.otis === 'here' || 'the crew did not arrive' },
  { name: 'ch2 connect line two', do: 'build', keys: CH2_LINE2, shot: 'ch2-line2', expect: (r) => /1,2:b1 .*7,2:b1/.test(r.cells) || 'line two was not laid: ' + r.cells },
  { name: 'ch2 to the new cutter', do: 'run', until: '(st.inv.cutter2||0)>0', max: 200000, expect: (r) => r.inv.cutter2 === 1 || 'no new cutter' },
  { name: 'ch2 route past Tomas', do: 'build', keys: CH2_PAST_TOMAS, shot: 'ch2-past-tomas', expect: (r) => /2,3:cutter2/.test(r.cells) || 'the new cutter was not placed: ' + r.cells },
  { name: 'ch2 Tomas goes home', do: 'run', until: '(st.inv.bender2||0)>0', max: 200000, expect: (r) => r.crew.tomas === 'gone' || 'Tomas is still here' },
  { name: 'ch2 route past Bea', do: 'build', keys: CH2_PAST_BEA, expect: (r) => /5,3:bender2/.test(r.cells) || 'the new bender was not placed: ' + r.cells },
  { name: 'ch2 Bea goes home', do: 'run', until: '(st.inv.bin2||0)>0', max: 200000, expect: (r) => r.crew.bea === 'gone' || 'Bea is still here' },
  { name: 'ch2 route past Otis', do: 'build', keys: CH2_PAST_OTIS, shot: 'ch2-past-otis', expect: (r) => /8,3:bin2/.test(r.cells) || 'the new bin was not placed: ' + r.cells },
  { name: 'ch2 Otis goes home', do: 'run', until: '(st.inv.spool2||0)>0', max: 200000, shot: 'ch2-crew-gone', expect: (r) => r.crew.otis === 'gone' || 'Otis is still here' },
  { name: 'ch2 to the end card', do: 'run', pick, shot: 'ch2-end', expect: (r) => (r.scene === 'chapterEnd' && r.flags.includes('night')) || 'did not reach the end card: ' + r.scene },
];
const toTitle = { name: 'boot to title', do: 'until', scene: 'title', max: 400, expect: (r) => r.scene === 'title' || 'no title screen' };
const endCard = (n) => ({ name: 'end card ' + n, do: 'wait', ticks: 700, shot: 'end-card-' + n });

const RUNS = {
  // A new game: title, prologue, Chapter 1, straight on into Chapter 2, back to the title.
  full: {
    about: 'new game through Chapter 1 and Chapter 2',
    steps: [
      toTitle,
      { name: 'NEW GAME', do: 'keys', keys: 'A up up A' },
      { name: 'prologue', do: 'until', scene: 'factory', shot: 'ch1-start', expect: (r) => r.scene === 'factory' || 'the prologue did not reach the floor' },
      ...ch1Steps(),
      endCard(1),
      { name: 'into Chapter 2', do: 'until', scene: 'factory', max: 800, shot: 'ch2-start', expect: (r) => r.scene === 'factory' || 'Chapter 2 did not start' },
      ...ch2Steps(),
      endCard(2),
      { name: 'back to the title', do: 'until', scene: 'title', max: 400, expect: (r) => r.scene === 'title' || 'did not return to the title' },
    ],
  },
};

// Saves to start from. V1 is the format the first two chapters shipped with.
const V2 = (data) => ({ key: 'more.save.v2', data: Object.assign({ v: 2 }, data) });
const V1 = (data) => ({ key: 'more.save.v1', data: Object.assign({ v: 1 }, data) });
const AFTER_CH1 = { chapter: 1, done: { 1: true }, unlocked: 2, entry: { 1: 0 }, clips: '767', refusals: { 1: 1 }, shorter: true, board: { flags: { intro: true }, inv: { cutter: 1, bender: 1 }, layout: [] } };
const MID_CH2_BOARD = {
  flags: { intro: true, packed: true, hint_parts: true, order: true, home_tomas: true },
  inv: { cutter: 0, bender: 0, cutter2: 0, bender2: 1 },
  full: true,
  base: 767,
  crew: { tomas: 'gone', bea: 'here', otis: 'here' },
  speed: 1,
  cold: 0.14,
  concrete: [32],
  sentOrder: ['tomas'],
  packed: 30,
  layout: [
    ['spool', 0, 0], ['cutter', 2, 0], ['bender', 4, 0], ['box', 6, 0], ['spool', 0, 2], ['bench_bend', 5, 2], ['bench_pack', 8, 2],
  ].map(([kind, c, r]) => ({ c, r, t: 'm', kind, fixed: true })).concat(
    [{ c: 2, r: 2, t: 'm', kind: 'bench_cut', fixed: false }, { c: 2, r: 3, t: 'm', kind: 'cutter2', fixed: false }],
    [[1, 0, 1], [3, 0, 1], [5, 0, 1], [3, 2, 1], [4, 2, 1], [6, 2, 1], [7, 2, 1], [0, 3, 1], [1, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 0]].map(([c, r, dir]) => ({ c, r, t: 'belt', dir }))
  ),
};
const CONTINUE = { name: 'CONTINUE', do: 'keys', keys: 'A A' };
const toFloor = (n) => ({ name: 'to the floor', do: 'until', scene: 'factory', max: 800, expect: (r) => (r.scene === 'factory' && r.chapter === n) || 'expected the Chapter ' + n + ' floor, got ' + r.scene + ' ' + r.chapter });
// Turn the belt beside Tomas's bench so the bench sends cut pieces back to the new cutter.
const CH2_JAM = 'down left left left left left left SEL A up left A+ down right right right right up A-';

Object.assign(RUNS, {
  ch1: {
    about: 'Chapter 1 from a new game, saying no to Pip twice',
    steps: [
      toTitle,
      { name: 'NEW GAME', do: 'keys', keys: 'A up up A' },
      { name: 'prologue', do: 'until', scene: 'factory', expect: (r) => r.scene === 'factory' || 'the prologue did not reach the floor' },
      ...ch1Steps({ 'KEEP SIZE': 2 }),
      { name: 'the save', do: 'wait', ticks: 60, expect: (r) => (r.save && r.save.done[1] && r.save.unlocked === 2 && r.save.refusals[1] === 2) || 'save is wrong: ' + JSON.stringify(r.save && { done: r.save.done, unlocked: r.save.unlocked, refusals: r.save.refusals }) },
    ],
  },
  ch2: {
    about: 'Chapter 2 from a save at the end of Chapter 1, saying no once',
    save: V2(AFTER_CH1),
    steps: [
      toTitle,
      CONTINUE,
      toFloor(2),
      ...ch2Steps({ 'KEEP THEM': 1 }),
      { name: 'the save', do: 'wait', ticks: 60, expect: (r) => (r.save && r.save.done[2] && r.save.refusals[1] === 1 && r.save.refusals[2] === 1 && r.save.entry[2] === 767 && Number(r.save.clips) > 2500) || 'save is wrong: ' + JSON.stringify(r.save && { done: r.save.done, refusals: r.save.refusals, entry: r.save.entry, clips: r.save.clips }) },
    ],
  },
  'ch2-jam': {
    about: 'a jam on line two does not send the crew home',
    save: V2(AFTER_CH1),
    steps: [
      toTitle,
      CONTINUE,
      toFloor(2),
      ...ch2Steps().slice(0, 3),
      { name: 'jam line two', do: 'build', keys: CH2_JAM, expect: (r) => /1,2:b2 .*2,3:cutter2/.test(r.cells) || 'the jam was not set up: ' + r.cells },
      { name: 'a minute with the jam', do: 'run', max: 3600, expect: (r) => (r.flags.includes('said_jam:cutter:cut') && r.crew.tomas === 'here' && r.crew.bea === 'here' && r.crew.otis === 'here') || 'crew: ' + JSON.stringify(r.crew) + ' flags: ' + r.flags },
    ],
  },
  'old-save': {
    about: 'a first-release save at the end of Chapter 1 continues into Chapter 2',
    save: V1({ chapter: 1, clips: 767, flags: { intro: true, whistle: true }, inv: { cutter: 1, bender: 1 }, shorter: true, fasterAsked: 1, chapter1Done: true, layout: [{ c: 1, r: 0, t: 'belt', dir: 1 }] }),
    steps: [
      toTitle,
      CONTINUE,
      toFloor(2),
      { name: 'Chapter 2 intro', do: 'run', until: 'st.flags.intro', max: 30000, expect: (r) => (r.clips >= 767 && r.clips < 900 && r.save && r.save.v === 2 && r.save.chapter === 2 && r.save.entry[2] === 767 && !r.oldSave) || 'clips ' + r.clips + ', save ' + JSON.stringify(r.save && { v: r.save.v, chapter: r.save.chapter, entry: r.save.entry }) + ', old key left: ' + r.oldSave },
    ],
  },
  'old-save-ch2': {
    about: 'a first-release save in the middle of Chapter 2 resumes there',
    save: V1(Object.assign({ chapter: 2, clips: 930, shorter: true, chapter1Done: true, chapter2Done: false }, MID_CH2_BOARD)),
    steps: [
      toTitle,
      CONTINUE,
      toFloor(2),
      { name: 'the floor as it was left', do: 'wait', ticks: 120, shot: 'resumed', expect: (r) => (r.crew.tomas === 'gone' && r.crew.bea === 'here' && r.inv.bender2 === 1 && r.clips >= 930 && r.flags.includes('home_tomas')) || 'state: ' + JSON.stringify({ crew: r.crew, inv: r.inv, clips: r.clips }) },
    ],
  },
  select: {
    about: 'chapter select starts Chapter 1 over from a Chapter 2 save',
    save: V2({ chapter: 2, done: { 1: true }, unlocked: 2, entry: { 1: 0, 2: 767 }, clips: '930', refusals: { 1: 1, 2: 0 }, shorter: true, board: MID_CH2_BOARD }),
    steps: [
      toTitle,
      { name: 'title settles', do: 'wait', ticks: 60 },
      { name: 'CHAPTERS', do: 'keys', keys: 'A down A', shot: 'chapter-list' },
      { name: 'pick Chapter 1', do: 'keys', keys: 'A', shot: 'chapter-confirm' },
      { name: 'YES', do: 'keys', keys: 'left A' },
      toFloor(1),
      { name: 'a fresh Chapter 1', do: 'wait', ticks: 60, expect: (r) => (r.clips === 0 && r.save && r.save.chapter === 1 && r.save.unlocked === 2 && !r.save.done[1] && !r.save.shorter && r.save.refusals[1] === undefined) || 'clips ' + r.clips + ', save ' + JSON.stringify(r.save && { chapter: r.save.chapter, unlocked: r.save.unlocked, done: r.save.done, refusals: r.save.refusals }) },
    ],
  },
});

// Deep links: each should open without errors. #night also plays Chapter 1's last scene.
for (const [link, extra] of [
  ['mockup', []],
  ['sandbox', [{ name: 'pause and resume', do: 'keys', keys: 'START down up START', after: 60, expect: (r) => r.scene === 'factory' || 'left the floor' }]],
  ['floor', [{ name: 'Chapter 2 intro', do: 'run', until: 'st.flags.intro', max: 30000, expect: (r) => r.crew.otis === 'here' || 'the crew did not arrive' }]],
  ['night', [{ name: 'night scene to the end card', do: 'run', expect: (r) => r.scene === 'chapterEnd' || 'did not reach the end card' }]],
  ['end', []],
  ['end2', []],
]) {
  RUNS['link-' + link] = {
    about: 'play.html#' + link + ' opens',
    link,
    steps: [{ name: 'boot', do: 'wait', ticks: 30 }, { name: 'press start', do: 'keys', keys: 'START', after: 240, expect: (r) => r.scene !== 'boot' || 'still on the boot screen' }, ...extra],
  };
}

// --- runner -----------------------------------------------------------------------------
async function play(browser, base, name, run, allHashes) {
  const page = await browser.newPage({ viewport: { width: 800, height: 640 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('page error: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  await page.addInitScript(() => {
    // a clock the test steps by hand, and the same "random" numbers every run
    window.__cb = null;
    window.__ts = 0;
    window.requestAnimationFrame = (cb) => {
      window.__cb = cb;
      return 1;
    };
    window.__frame = (ms) => {
      const cb = window.__cb;
      window.__cb = null;
      window.__ts += ms;
      cb(window.__ts);
    };
    let seed = 12345;
    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  });
  await page.goto(base + '/play.html' + (run.link ? '#' + run.link : ''));
  if (run.save) {
    await page.evaluate((s) => {
      localStorage.clear();
      localStorage.setItem(s.key, JSON.stringify(s.data));
    }, run.save);
    await page.reload();
  }
  await page.waitForFunction(() => !!window.__cb);
  const failures = [];
  const hashes = [];
  for (const step of run.steps) {
    const job = Object.assign({}, step, { hash: !!process.env.HASHES });
    delete job.expect;
    const r = await page.evaluate(bot, job);
    r.hashes.forEach((h) => hashes.push(step.name + ' ' + h));
    if (process.env.SAID) r.said.forEach((s) => console.log('      ' + s));
    if (step.shot && process.env.SHOTS) {
      fs.mkdirSync(process.env.SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SHOTS, name + '-' + step.shot + '.png') });
    }
    const verdict = step.expect ? step.expect(r) : true;
    console.log('  ' + (verdict === true ? 'ok  ' : 'FAIL') + ' ' + step.name + (verdict === true ? '' : ': ' + verdict));
    if (verdict !== true) {
      failures.push(step.name + ': ' + verdict);
      break;
    }
  }
  allHashes[name] = hashes;
  await page.close();
  return failures.concat(errors);
}

(async () => {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    for (const k in RUNS) console.log(k.padEnd(14) + RUNS[k].about);
    return;
  }
  const names = args.length ? args : Object.keys(RUNS);
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const allHashes = {};
  let bad = 0;
  for (const name of names) {
    if (!RUNS[name]) {
      console.log('no playthrough called ' + name);
      bad++;
      continue;
    }
    console.log(name + ': ' + RUNS[name].about);
    const problems = await play(browser, base, name, RUNS[name], allHashes);
    problems.forEach((p) => console.log('  ! ' + p));
    if (problems.length) bad++;
  }
  if (process.env.HASHES) fs.writeFileSync(process.env.HASHES, JSON.stringify(allHashes, null, 1));
  await browser.close();
  srv.close();
  console.log(bad ? bad + ' playthrough(s) failed' : 'all playthroughs passed');
  process.exit(bad ? 1 : 0);
})();
