// MORE. — the factory floor (Chapters 1 and 2)
// Riverbend's floor at 384x288, built from the Higgsfield factory tileset:
// brick wall and plank floor, the old spool, cutter, bender and bin, Pip's
// wall terminal and its floor drone. Pip lays conveyor between the machines
// on a grid of 32px cells. Wire flows spool > cutter > bender > bin and
// every clip that reaches the bin counts.
// Chapter 2 widens the grid and adds Marisol's crew: hand benches that work
// like slow machines while their worker is there, and the new steel machines
// Riverbend buys with what it saves. Each chapter's floor is in CHAPTERS.
(function (M) {
  'use strict';

  const P = M.PAL;
  const CELL = 32;
  const HALF = CELL / 2;
  const WALL_Y = 28; // top of the brick wall band (below the HUD)
  const FLOOR_Y = 68; // where the wall meets the floor
  const FEET_Y = 207; // baseline for people standing beside the line
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const DIRBTN = ['up', 'right', 'down', 'left'];
  const opp = (d) => (d + 2) % 4;

  const BELT_SPEED = 2.0; // cells per second
  const GAP = 0.45; // minimum spacing between items, in cells

  // base: which old machine a newer one stands in for (for jam hints).
  // worker: a hand bench only runs while that person is at it.
  const MACH = {
    spool: { name: 'SPOOL', art: 'spool', period: 0.5, makes: 'wire', info: 'SPOOL: MAKES WIRE' },
    cutter: { name: 'CUTTER', art: 'cutter', period: 0.5, takes: 'wire', makes: 'cut', info: 'CUTTER: WIRE > PIECES' },
    bender: { name: 'BENDER', art: 'bender', period: 0.8, takes: 'cut', makes: 'clip', info: 'BENDER: PIECES > CLIPS' },
    box: { name: 'BIN', art: 'bin', sink: true, takes: 'clip', info: 'BIN: COUNTS CLIPS' },
    // Chapter 2: the new steel machines
    spool2: { name: 'NEW SPOOL', art: 'spool2', base: 'spool', modern: true, period: 0.3, makes: 'wire', info: 'NEW SPOOL: MAKES WIRE' },
    cutter2: { name: 'NEW CUTTER', art: 'cutter2', base: 'cutter', modern: true, period: 0.3, takes: 'wire', makes: 'cut', info: 'NEW CUTTER: WIRE > PIECES' },
    bender2: { name: 'NEW BENDER', art: 'bender2', base: 'bender', modern: true, period: 0.4, takes: 'cut', makes: 'clip', info: 'NEW BENDER: PIECES > CLIPS' },
    bin2: { name: 'NEW BIN', art: 'bin2', base: 'box', modern: true, sink: true, takes: 'clip', info: 'NEW BIN: COUNTS CLIPS' },
    // Chapter 2: Marisol's crew, working by hand
    bench_cut: { name: "TOMAS'S BENCH", art: 'bench_cut', base: 'cutter', worker: 'tomas', period: 1.8, takes: 'wire', makes: 'cut', info: 'TOMAS CUTS WIRE BY HAND' },
    bench_bend: { name: "BEA'S BENCH", art: 'bench_bend', base: 'bender', worker: 'bea', period: 2.4, takes: 'cut', makes: 'clip', info: 'BEA BENDS CLIPS BY HAND' },
    bench_pack: { name: "OTIS'S TABLE", art: 'bench_pack', base: 'box', worker: 'otis', sink: true, period: 0.9, takes: 'clip', info: 'OTIS PACKS CLIPS BY HAND' },
  };

  // Where the old line's machines sit.
  const START_LAYOUT = [
    ['spool', 0, 0],
    ['cutter', 4, 1],
    ['bender', 2, 3],
    ['box', 7, 3],
  ];

  const MOCK_BELTS = [
    [1, 0, 1], [2, 0, 2], [2, 1, 1], [3, 1, 1], [5, 1, 2], [5, 2, 3], [4, 2, 3], [3, 2, 3], [2, 2, 3],
    [1, 2, 3], [0, 2, 2], [0, 3, 1], [1, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 1], [6, 3, 1],
  ];

  // Chapter 2: two lines across the whole floor. Pip's old line runs along
  // the top; Marisol's crew works the second line by hand.
  const FLOOR_LAYOUT = [
    ['spool', 0, 0],
    ['cutter', 2, 0],
    ['bender', 4, 0],
    ['box', 6, 0],
    ['spool', 0, 2],
    ['bench_cut', 2, 2],
    ['bench_bend', 5, 2],
    ['bench_pack', 8, 2],
  ];
  const FLOOR_BELTS = [
    [1, 0, 1],
    [3, 0, 1],
    [5, 0, 1],
  ];

  const CHAPTERS = {
    1: {
      id: 1,
      story: 'ch1',
      cols: 8,
      rows: 4,
      gx: 64,
      gy: 76,
      spots: [42, 22, 2], // standing spots left of the grid, nearest first
      layout: START_LAYOUT,
      belts: [],
      start: [2, 1],
      props: [['window', 14, -36], ['board', 98, -34], ['panel', 240, -36], ['door', 334, -37], ['coffee', 338, 2], ['pallet', 336, 98]],
    },
    2: {
      id: 2,
      story: 'ch2',
      cols: 10,
      rows: 4,
      gx: 56,
      gy: 76,
      spots: [32, 14, -2],
      layout: FLOOR_LAYOUT,
      belts: FLOOR_BELTS,
      start: [3, 1],
      props: [['window', 14, -36], ['board', 98, -34], ['panel', 240, -36], ['door', 334, -37]],
      beacon: { x: 286, y: -35 },
    },
  };
  const TERMINAL = { x: 172, y: 36 }; // Pip's wall box

  const fmt = (n) => Math.floor(n).toLocaleString('en-US');

  // Belt colours sampled from the Higgsfield factory tileset.
  const BELT = {
    green: '#306838',
    slat: '#284830',
    shine: '#3c7c44',
    rail: '#787878',
    railHi: '#a0a0a0',
    railDk: '#303030',
    rivet: '#c8c8c8',
  };

  // --- the room: wall, floor, props (painted once) -----------------------------------------
  const rooms = {};
  function buildRoom(cfg) {
    if (rooms[cfg.id]) return rooms[cfg.id];
    const g = M.gfx;
    const { cols: COLS, rows: ROWS, gx: GX, gy: GY } = cfg;
    const cv = document.createElement('canvas');
    cv.width = 384;
    cv.height = 212;
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    const img = (n) => g.art(n);
    const put = (n, x, y) => {
      const im = img(n);
      if (im && im.naturalWidth) cx.drawImage(im, x, y);
    };

    // plank floor: the long strip from the tileset, staggered row to row
    const floor = img('floor_long') || img('floor');
    if (floor) {
      for (let y = FLOOR_Y, row = 0; y < 212; y += floor.height, row++) {
        for (let x = -((row * 41) % floor.width); x < 384; x += floor.width) cx.drawImage(floor, x, y);
      }
    }
    // brick wall: first row with its cream cap, then brick only down to the floor
    const wall = img('wall');
    if (wall) {
      const ww = wall.width;
      const wh = wall.height;
      for (let x = 0; x < 384; x += ww) {
        cx.drawImage(wall, x, WALL_Y);
        for (let y = WALL_Y + wh; y < FLOOR_Y; y += wh - 5) cx.drawImage(wall, 0, 5, ww, wh - 5, x, y, ww, wh - 5);
      }
    }
    cx.fillStyle = '#402818';
    cx.fillRect(0, FLOOR_Y - 2, 384, 2);
    cx.fillStyle = 'rgba(0,0,0,0.25)';
    cx.fillRect(0, FLOOR_Y, 384, 3);

    // the grid: faint seams so placement reads without fighting the art
    cx.fillStyle = 'rgba(40,20,10,0.45)';
    for (let c = 0; c <= COLS; c++) cx.fillRect(GX + c * CELL - (c === COLS ? 1 : 0), GY, 1, ROWS * CELL);
    for (let r = 0; r <= ROWS; r++) cx.fillRect(GX, GY + r * CELL - (r === ROWS ? 1 : 0), COLS * CELL, 1);
    cx.fillStyle = 'rgba(232,160,42,0.35)';
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++) {
        const x = GX + c * CELL - (c === COLS ? 1 : 0);
        const y = GY + r * CELL - (r === ROWS ? 1 : 0);
        cx.fillRect(x - 1, y, 3, 1);
        cx.fillRect(x, y - 1, 1, 3);
      }
    }

    // wall and floor props (y is relative to the floor line)
    for (const [n, x, y] of cfg.props) put(n, x, FLOOR_Y + y);
    rooms[cfg.id] = cv;
    return cv;
  }

  // --- belts, drawn in the tileset's look so they join in every direction ------------------
  const beltCache = new Map();
  function beltTile(sides, out, phase) {
    const mask = (sides[0] ? 1 : 0) | (sides[1] ? 2 : 0) | (sides[2] ? 4 : 0) | (sides[3] ? 8 : 0);
    const key = mask + ':' + out + ':' + phase;
    let cv = beltCache.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = CELL;
    cv.height = CELL;
    const cx = cv.getContext('2d');
    const straight = mask === 10 || mask === 5;
    const A0 = 6; // belt band spans 6..25 across the cell
    const A1 = 25;
    const inBand = (a) => a >= A0 && a <= A1;
    const px = (x, y, c) => {
      cx.fillStyle = c;
      cx.fillRect(x, y, 1, 1);
    };
    // rail shading across the band: outline, rail, rail, [surface], rail, rail, outline
    const railAt = (a) => (a === A0 || a === A1 ? BELT.railDk : a === A0 + 1 || a === A1 - 1 ? BELT.rail : a === A0 + 2 || a === A1 - 2 ? BELT.railHi : null);
    const surface = (along, sgn, a) => {
      const k = (((along - sgn * phase) % 6) + 6) % 6;
      if (k === 0) return BELT.slat;
      return a === A0 + 3 ? BELT.shine : BELT.green;
    };
    // outer corner of a turn, for rounding
    let corner = null;
    if ([3, 6, 12, 9].includes(mask)) corner = [sides[3] ? A1 : A0, sides[0] ? A1 : A0];
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        let col = null;
        const inPlate = !straight && inBand(x) && inBand(y);
        if (inPlate) {
          // turntable plate: rails on the edges that aren't connected
          const edgeN = !sides[0] && y <= A0 + 2;
          const edgeS = !sides[2] && y >= A1 - 2;
          const edgeW = !sides[3] && x <= A0 + 2;
          const edgeE = !sides[1] && x >= A1 - 2;
          if (edgeN) col = railAt(y);
          else if (edgeS) col = railAt(y);
          if (edgeW) col = railAt(x) || col;
          else if (edgeE) col = railAt(x) || col;
          if (!col) col = y === A0 + 3 || x === A0 + 3 ? BELT.shine : BELT.green;
          if (corner) {
            const d = Math.abs(x - corner[0]) + Math.abs(y - corner[1]);
            if (d <= 1) col = null;
            else if (d === 2) col = BELT.railDk;
          }
        } else {
          // half strips from each connected edge
          const h = inBand(y) && ((x < HALF && sides[3]) || (x >= HALF && sides[1]));
          const v = inBand(x) && ((y < HALF && sides[0]) || (y >= HALF && sides[2]));
          if (h) {
            const side = x < HALF ? 3 : 1;
            const toward = side === out ? side : opp(side);
            const sgn = toward === 1 ? 1 : -1;
            col = railAt(y) || surface(x, sgn, y);
            if (railAt(y) === BELT.rail && y === A0 + 1 && (x + 4) % 8 === 0) col = BELT.rivet;
          } else if (v) {
            const side = y < HALF ? 0 : 2;
            const toward = side === out ? side : opp(side);
            const sgn = toward === 2 ? 1 : -1;
            col = railAt(x) || surface(y, sgn, x);
            if (railAt(x) === BELT.rail && x === A0 + 1 && (y + 4) % 8 === 0) col = BELT.rivet;
          }
        }
        if (col) px(x, y, col);
      }
    }
    beltCache.set(key, cv);
    return cv;
  }

  // --- items riding the belts (small palette sprites in the art's colours) -----------------
  function transpose(rows) {
    const h = rows.length;
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const out = [];
    for (let x = 0; x < w; x++) {
      let s = '';
      for (let y = 0; y < h; y++) s += rows[y][x] || '.';
      out.push(s);
    }
    return out;
  }

  let itemArt = null;
  function buildItems() {
    if (itemArt) return itemArt;
    const S = M.ART.src;
    const map = { t: '#c8773f', W: '#e0e8ee', ',': '#1c1c20' };
    const mk = (r) => M.gfx.make(r, map);
    itemArt = {
      wire: { h: mk(S.wire), v: mk(transpose(S.wire)) },
      cut: { h: mk(S.cut), v: mk(transpose(S.cut)) },
      cutSmall: { h: mk(S.cutSmall), v: mk(transpose(S.cutSmall)) },
      clip: { h: mk(S.clip), v: mk(transpose(S.clip)) },
      clipSmall: { h: mk(S.clipSmall), v: mk(transpose(S.clipSmall)) },
    };
    return itemArt;
  }

  // --- the scene ------------------------------------------------------------------------
  M.scenes.factory = function (opts) {
    opts = opts || {};
    const g = M.gfx;
    const I = M.input;
    const cfg = CHAPTERS[opts.chapter || 1];
    const { cols: COLS, rows: ROWS, gx: GX, gy: GY, spots: SPOTS } = cfg;
    const story = M.STORY[cfg.story];
    const saved = opts.save || null;
    // A save from this chapter restores it; a save from an earlier chapter
    // only carries the count (and Pip's habits) forward.
    const same = !!saved && (saved.chapter || 1) === cfg.id;

    const st = {
      clips: 0,
      time: 0,
      flags: {},
      inv: { cutter: 0, bender: 0 },
      tool: 'belt',
      facing: 1,
      shorter: false,
      powered: true,
      night: 0,
      goalBlink: 0,
      fasterAsked: 0,
      nextFaster: 0,
      sandbox: !!opts.sandbox,
      chapter1Done: false,
      chapter2Done: false,
      clipTimes: [],
      jams: {},
      boxCount: 0,
      // Chapter 2
      base: 0, // clips on the counter when the chapter began
      crew: {}, // name -> 'away' | 'walking' | 'here' | 'gone'
      benchIdle: {}, // name -> seconds their bench has had nothing to do
      speed: 1, // 1.12 once the safety limiters come off
      cold: 0,
      concrete: [], // cells where the old plank floor has been replaced
      sentOrder: [], // crew sent home during the day, in order
      packed: 0, // clips packed by hand
      limitAsked: 0,
      nextLimit: 0,
    };
    // the crew who work this chapter's benches
    for (const [k] of cfg.layout) {
      if (MACH[k].worker) st.crew[MACH[k].worker] = 'away';
    }

    const cells = new Array(COLS * ROWS).fill(null);
    const at = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS ? undefined : cells[r * COLS + c]);
    const put = (c, r, v) => {
      cells[r * COLS + c] = v;
    };

    function newMachine(kind, fixed) {
      return { t: 'm', kind, fixed, inBuf: 0, busy: 0, timer: 0, out: [], rr: 0, frame: 0, flash: 0, count: 0, idle: 0 };
    }

    function startLayout() {
      cfg.layout.forEach(([k, c, r]) => put(c, r, newMachine(k, true)));
      cfg.belts.forEach(([c, r, d]) => put(c, r, { t: 'belt', dir: d, items: [] }));
    }

    // restore
    if (saved) {
      Object.assign(st, {
        clips: saved.clips || 0,
        shorter: !!saved.shorter,
        chapter1Done: !!saved.chapter1Done,
        chapter2Done: !!saved.chapter2Done,
        boxCount: saved.clips || 0,
      });
    }
    if (same) {
      Object.assign(st, {
        flags: saved.flags || {},
        inv: saved.inv || { cutter: 0, bender: 0 },
        fasterAsked: saved.fasterAsked || 0,
        nextFaster: saved.nextFaster || 0,
        base: saved.base || 0,
        speed: saved.speed || 1,
        cold: saved.cold || 0,
        concrete: saved.concrete || [],
        sentOrder: saved.sentOrder || [],
        packed: saved.packed || 0,
        limitAsked: saved.limitAsked || 0,
        nextLimit: saved.nextLimit || 0,
      });
      Object.assign(st.crew, saved.crew || {});
      for (const k in st.crew) if (st.crew[k] === 'walking') st.crew[k] = 'here';
      if (saved.full) {
        // later chapters save the whole floor: fixed machines can move or go
        for (const e of saved.layout || []) {
          if (e.t === 'belt') put(e.c, e.r, { t: 'belt', dir: e.dir, items: [] });
          else if (e.t === 'm' && MACH[e.kind]) put(e.c, e.r, newMachine(e.kind, !!e.fixed));
        }
      } else {
        startLayout();
        for (const e of saved.layout || []) {
          if (e.t === 'belt') put(e.c, e.r, { t: 'belt', dir: e.dir, items: [] });
          else if (e.t === 'm' && !e.fixed) put(e.c, e.r, newMachine(e.kind, false));
        }
      }
    } else {
      startLayout();
      st.base = st.clips;
    }
    if (opts.debugNight || opts.mockup) {
      // The belt route drawn in the mockup.
      MOCK_BELTS.forEach(([c, r, d]) => put(c, r, { t: 'belt', dir: d, items: [] }));
    }
    if (opts.debugNight) {
      st.clips = story.quotas.whistle - 3;
      Object.assign(st.flags, { intro: true, firstClip: true, ledger: true, faster: true, ruth: true });
      st.shorter = true;
    }
    if (opts.mockup) {
      st.clips = 1204;
      st.flags = { intro: true, firstClip: true, ledger: true };
    }
    if (st.sandbox || st['chapter' + cfg.id + 'Done']) {
      st.sandbox = true;
      st.night = 0.45;
      M.CAST.pip.portrait = 'pip2';
    } else {
      M.CAST.pip.portrait = cfg.id === 1 ? 'pip1' : 'pip2';
    }

    const drone = { c: cfg.start[0], r: cfg.start[1], x: 0, y: 0, move: null, queued: -1, blink: 0, flip: false };
    // For playtesting from the console: MORE.debug.factory.st.clips = 199
    M.debug = M.debug || {};
    M.debug.factory = { st, cells, cfg };
    const cellCenter = (c, r) => [GX + c * CELL + HALF, GY + r * CELL + HALF];
    [drone.x, drone.y] = cellCenter(drone.c, drone.r);

    const npcs = {};
    const toasts = [];
    let runner = null;
    let beat = null;
    let repeatBeat = false;
    let pendingRotate = false;
    let beltOff = 0;
    let pause = null;
    let saveT = 0;
    let idleT = 0;
    let t = 0;
    let ended = false;
    let roomCanvas = null;

    // --- helpers ---------------------------------------------------------------------
    function toast(text, color) {
      toasts.push({ text, color: color || P.ORANGE, t: 0 });
    }

    // Chapter 1 saves only what the player added; later chapters save the
    // whole floor, because benches and fixed machines can go.
    const full = cfg.id > 1;
    function serialize() {
      const layout = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const e = at(c, r);
          if (!e) continue;
          if (e.t === 'belt') layout.push({ c, r, t: 'belt', dir: e.dir });
          else if (full || !e.fixed) layout.push({ c, r, t: 'm', kind: e.kind, fixed: !!e.fixed });
        }
      }
      return layout;
    }

    function save() {
      if (opts.debugNight || opts.debug) return;
      M.save.write({
        chapter: cfg.id,
        clips: st.clips,
        flags: st.flags,
        inv: st.inv,
        shorter: st.shorter,
        fasterAsked: st.fasterAsked,
        nextFaster: st.nextFaster,
        chapter1Done: st.chapter1Done,
        chapter2Done: st.chapter2Done,
        layout: serialize(),
        full,
        base: st.base,
        crew: st.crew,
        speed: st.speed,
        cold: st.cold,
        concrete: st.concrete,
        sentOrder: st.sentOrder,
        packed: st.packed,
        limitAsked: st.limitAsked,
        nextLimit: st.nextLimit,
      });
    }

    // Parts Pip can place, in SELECT order.
    const PARTS = ['cutter', 'bender', 'spool2', 'cutter2', 'bender2', 'bin2'];
    function tools() {
      return ['belt'].concat(PARTS.filter((k) => st.inv[k] > 0));
    }

    // Where a hand bench stands, by its worker's name.
    function benchOf(who) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const e = at(c, r);
          if (e && e.t === 'm' && MACH[e.kind].worker === who) return { c, r, m: e };
        }
      }
      return null;
    }
    // Where a worker stands: behind their bench, with the bench hiding their legs.
    function benchSpot(who) {
      const b = benchOf(who);
      const m = M.ART_MANIFEST[who];
      if (!b || !m) return null;
      return [GX + b.c * CELL + Math.floor((CELL - m.fw) / 2), GY + b.r * CELL + 17];
    }
    const staffed = (def) => !def.worker || st.crew[def.worker] === 'here';
    const pave = (c, r) => {
      const i = r * COLS + c;
      if (!st.concrete.includes(i)) st.concrete.push(i);
    };

    function placeBelt(c, r, dir) {
      put(c, r, { t: 'belt', dir, items: [] });
      M.audio.sfx('belt');
    }

    // Does any neighbouring belt flow into this one?
    function hasBeltInput(c, r, b) {
      for (let d = 0; d < 4; d++) {
        if (d === b.dir) continue;
        const n = at(c + DX[d], r + DY[d]);
        if (n && n.t === 'belt' && n.dir === opp(d)) return true;
      }
      return false;
    }

    // A machine feeds a neighbouring belt only when that belt starts at the
    // machine: it doesn't point into the machine and nothing else flows into it.
    // Belts that merely pass by a machine are left alone (as in the mockup).
    function machineFeeds(m, bc, br, b, sideToMachine) {
      return !!m && m.t === 'm' && !MACH[m.kind].sink && b.dir !== sideToMachine && !hasBeltInput(bc, br, b);
    }

    // Can this belt take a new item at its entry right now?
    function hasRoom(b) {
      const last = b.items[b.items.length - 1];
      return !last || last.p >= GAP;
    }

    // --- simulation ------------------------------------------------------------------------
    function machineAccept(m, it) {
      const def = MACH[m.kind];
      const base = def.base || m.kind;
      if (!staffed(def)) return false;
      if (def.sink) {
        if (it.k !== 'clip') return 'jam:box:' + it.k;
        if (def.period) {
          // packing by hand takes a moment per clip
          if (m.busy > 0) return false;
          m.busy = def.period;
        }
        m.idle = 0;
        if (def.worker) st.packed++;
        st.clips++;
        st.boxCount++;
        m.flash = 0.12;
        st.clipTimes.push(st.time);
        M.audio.sfx('clip');
        return true;
      }
      if (!def.takes) return 'jam:spool';
      if (it.k !== def.takes) return 'jam:' + base + ':' + it.k;
      if (m.inBuf >= 2) return false;
      m.inBuf++;
      m.idle = 0;
      return true;
    }

    function updateMachine(c, r, m, dt) {
      const def = MACH[m.kind];
      if (m.flash > 0) m.flash -= dt;
      const period = (def.period || 0) / st.speed;
      if (def.worker && staffed(def) && st.powered) {
        // how long since anything new reached this bench (reset in machineAccept)
        m.idle += dt;
        st.benchIdle[def.worker] = m.idle;
      }
      if (def.sink) {
        if (m.busy > 0) m.busy = Math.max(0, m.busy - dt);
        return;
      }
      if (!staffed(def)) return;
      if (def.takes == null) {
        // spool: unwinds wire as long as it can hand it off
        if (m.out.length === 0) {
          m.timer += dt;
          if (m.timer >= period) {
            m.timer = 0;
            m.out.push({ k: 'wire' });
          }
        }
        if (m.out.length === 0 || m.timer > 0) m.frame += dt * 6;
      } else {
        if (m.busy > 0) {
          m.busy -= dt;
          m.frame += dt * 7;
          if (m.busy <= 0) {
            m.busy = 0;
            const n = def.makes === 'cut' && st.shorter ? 2 : 1;
            for (let i = 0; i < n; i++) m.out.push({ k: def.makes, small: st.shorter });
            if (def.makes === 'cut') M.audio.sfx('cut');
          }
        } else if (m.inBuf > 0 && m.out.length === 0) {
          m.inBuf--;
          m.busy = period;
        }
      }
      // hand finished items to neighbouring belts, round-robin
      if (m.out.length) {
        for (let k = 0; k < 4; k++) {
          const d = (m.rr + k) % 4;
          const bc = c + DX[d];
          const br = r + DY[d];
          const b = at(bc, br);
          if (!b || b.t !== 'belt' || !machineFeeds(m, bc, br, b, opp(d)) || !hasRoom(b)) continue;
          const it = m.out.shift();
          b.items.push({ k: it.k, small: !!it.small, p: 0, from: opp(d), jam: null });
          m.rr = (d + 1) % 4;
          break;
        }
      }
    }

    function updateBelt(c, r, b, dt) {
      const v = BELT_SPEED * st.speed * dt;
      for (let i = 0; i < b.items.length; i++) {
        const it = b.items[i];
        const target = it.p + v;
        if (i > 0) {
          it.p = Math.max(it.p, Math.min(target, b.items[i - 1].p - GAP));
          continue;
        }
        if (target < 1) {
          it.p = target;
          it.jam = null;
          continue;
        }
        const nc = c + DX[b.dir];
        const nr = r + DY[b.dir];
        const nx = at(nc, nr);
        if (nx && nx.t === 'belt' && nx.dir !== opp(b.dir) && hasRoom(nx)) {
          b.items.shift();
          i--;
          const last = nx.items[nx.items.length - 1];
          const over = target - 1;
          it.p = last ? Math.min(over, last.p - GAP) : over;
          it.from = opp(b.dir);
          it.jam = null;
          nx.items.push(it);
          continue;
        }
        if (nx && nx.t === 'm') {
          const res = machineAccept(nx, it);
          if (res === true) {
            b.items.shift();
            i--;
            continue;
          }
          it.jam = typeof res === 'string' ? res : null;
        }
        it.p = 1;
      }
    }

    function simulate(dt) {
      if (!st.powered) return;
      st.time += dt;
      beltOff += BELT_SPEED * st.speed * CELL * dt;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const e = at(c, r);
        if (e && e.t === 'm') updateMachine(c, r, e, dt);
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const e = at(c, r);
        if (e && e.t === 'belt') updateBelt(c, r, e, dt);
      }
      while (st.clipTimes.length && st.clipTimes[0] < st.time - 8) st.clipTimes.shift();
    }

    function rate() {
      const span = Math.min(8, st.time);
      return span > 1 ? st.clipTimes.length / span : 0;
    }

    function findJam() {
      for (const e of cells) {
        if (!e || e.t !== 'belt') continue;
        for (const it of e.items) if (it.jam) return it.jam;
      }
      return null;
    }

    // --- NPCs ------------------------------------------------------------------------------
    // People walk along a path of straight legs. Crew at their benches are
    // drawn behind the bench, the rest stand on the floor in front.
    function npc(who) {
      if (!npcs[who]) npcs[who] = { who, x: -24, y: FEET_Y, path: [], walkT: 0, gone: true, atBench: false, dir: 3 };
      return npcs[who];
    }
    function walkTo(n, pts) {
      n.path = pts.slice();
      n.atBench = false;
    }
    function stepNPC(n, dt) {
      if (!n.path.length) return;
      const [tx, ty] = n.path[0];
      const dx = tx - n.x;
      const dy = ty - n.y;
      const step = 46 * dt;
      if (Math.abs(dx) > 0.5) {
        n.x += Math.sign(dx) * Math.min(Math.abs(dx), step);
        n.dir = dx > 0 ? 1 : 3;
      } else if (Math.abs(dy) > 0.5) {
        n.x = tx;
        n.y += Math.sign(dy) * Math.min(Math.abs(dy), step);
        n.dir = dy > 0 ? 2 : 0;
      } else {
        n.x = tx;
        n.y = ty;
        n.path.shift();
      }
      n.walkT += dt;
    }
    // Put crew who are already at work (after a load) straight at their benches.
    for (const who in st.crew) {
      if (st.crew[who] !== 'here') continue;
      const spot = benchSpot(who);
      if (!spot) continue;
      const n = npc(who);
      Object.assign(n, { x: spot[0], y: spot[1], gone: false, atBench: true });
    }

    // --- script API --------------------------------------------------------------------------
    const S = {
      state: st,
      say: M.cmd.say,
      choose: M.cmd.choose,
      wait: M.cmd.wait,
      call: M.cmd.call,
      all: M.cmd.all,
      until: M.cmd.until,
      // Walk someone in from the left to a standing spot beside the line.
      enter(who, spot, delay) {
        let d = delay || 0;
        let sent = false;
        const x = SPOTS[Math.max(0, Math.min(SPOTS.length - 1, spot || 0))];
        return {
          start() {
            const n = npc(who);
            if (n.gone) Object.assign(n, { x: -24, y: FEET_Y });
            n.gone = false;
          },
          update(dt) {
            if ((d -= dt) > 0) return false;
            const n = npc(who);
            if (!sent) {
              sent = true;
              walkTo(n, n.y === FEET_Y ? [[x, FEET_Y]] : [[n.x, FEET_Y], [x, FEET_Y]]);
            }
            return !n.path.length;
          },
        };
      },
      leave(who, delay) {
        let d = delay || 0;
        let sent = false;
        return {
          update(dt) {
            if ((d -= dt) > 0) return false;
            const n = npcs[who];
            if (!n || n.gone) return true;
            if (!sent) {
              sent = true;
              walkTo(n, n.y === FEET_Y ? [[-26, FEET_Y]] : [[n.x, FEET_Y], [-26, FEET_Y]]);
            }
            if (!n.path.length) {
              n.gone = true;
              return true;
            }
            return false;
          },
        };
      },
      // Chapter 2: a worker walks in to their bench and starts work.
      toBench(who, delay) {
        let d = delay || 0;
        let sent = false;
        return {
          start() {
            const n = npc(who);
            if (n.gone) Object.assign(n, { x: -24, y: FEET_Y });
            n.gone = false;
            st.crew[who] = 'walking';
          },
          update(dt) {
            if ((d -= dt) > 0) return false;
            const n = npc(who);
            const spot = benchSpot(who);
            if (!spot) return true;
            if (!sent) {
              sent = true;
              walkTo(n, [[spot[0], FEET_Y], spot]);
            }
            if (n.path.length) return false;
            n.atBench = true;
            st.crew[who] = 'here';
            return true;
          },
        };
      },
      // A worker's bench stops for good and they walk out.
      sendHome(who) {
        return {
          start() {
            st.crew[who] = 'gone';
            if (!st.sentOrder.includes(who)) st.sentOrder.push(who);
            const b = benchOf(who);
            if (b) b.m.fixed = false;
            toast(who.toUpperCase() + ' WENT HOME', P.CREAM);
          },
          update() {
            return true;
          },
        };
      },
      // Everyone still here goes home at once (the night shift).
      crewHome() {
        return M.cmd.call(() => {
          for (const who in st.crew) {
            if (st.crew[who] === 'gone') continue;
            st.crew[who] = 'gone';
            const b = benchOf(who);
            if (b) b.m.fixed = false;
          }
        });
      },
      toast(text, color) {
        return M.cmd.call(() => toast(text, color));
      },
      limiters() {
        return M.cmd.call(() => {
          st.speed = 1.12;
          M.audio.sfx('powerUp');
          M.audio.setTempo(132);
          toast('LIMITERS OFF: +12%');
        });
      },
      cold(to, dur) {
        return M.cmd.tween(st, 'cold', to, dur || 1.5);
      },
      unlock(kind, n) {
        return M.cmd.call(() => {
          st.inv[kind] = (st.inv[kind] || 0) + n;
          M.audio.sfx('unlock');
          toast('+' + n + ' ' + MACH[kind].name);
        });
      },
      hint(name) {
        return M.cmd.call(() => {
          st.flags['hint_' + name] = true;
        });
      },
      sfx(name) {
        return M.cmd.call(() => M.audio.sfx(name));
      },
      music(name, bpm) {
        return M.cmd.call(() => {
          M.audio.stopMusic(0.2);
          M.audio.playMusic(name, bpm ? { bpm } : null);
        });
      },
      power(on) {
        return M.cmd.call(() => {
          st.powered = on;
          M.audio.sfx(on ? 'powerUp' : 'powerDown');
          if (!on) M.audio.stopMusic(1.0);
        });
      },
      night(to, dur) {
        return M.cmd.tween(st, 'night', to, dur);
      },
      card(text, dur) {
        let k = 0;
        return {
          update(dt) {
            k += dt;
            return k >= dur;
          },
          draw() {
            const a = Math.min(1, k / 0.4, (dur - k) / 0.4);
            g.ctx.globalAlpha = Math.max(0, a);
            g.rect(0, 112, g.W, 30, P.INK);
            g.textCenter(text, g.W / 2, 123, P.CREAM);
            g.ctx.globalAlpha = 1;
          },
        };
      },
      shorter() {
        return M.cmd.call(() => {
          st.shorter = true;
          M.audio.sfx('cut');
          M.audio.setTempo(120);
          toast('CUT LENGTH: 50%');
        });
      },
      endChapter() {
        return M.cmd.call(() => {
          if (ended) return;
          ended = true;
          st['chapter' + cfg.id + 'Done'] = true;
          save();
          M.audio.stopMusic(1.5);
          const end = Object.assign({ clips: st.clips }, story.ending ? story.ending(st) : {});
          M.go(() => M.scenes.chapterEnd(end), { out: 1.6, in: 0.8 });
        });
      },
      again() {
        repeatBeat = true;
      },
    };

    function runBeat(b) {
      beat = b;
      repeatBeat = false;
      runner = new M.Runner(b.run, S);
    }

    function runLine(text) {
      beat = null;
      runner = new M.Runner(function* () {
        yield S.say('pip', text);
      }, S);
    }

    function checkBeats() {
      if (runner || st.sandbox || opts.mockup) return;
      // side beats can happen whenever they're due; the rest play in order
      const side = story.beats.find((b) => b.side && !st.flags[b.id] && b.when(st));
      if (side) {
        runBeat(side);
        return;
      }
      const next = story.beats.find((b) => !b.side && !st.flags[b.id]);
      if (next && next.when(st)) {
        runBeat(next);
        return;
      }
      const jam = findJam();
      if (jam) {
        st.jams[jam] = (st.jams[jam] || 0) + 1 / 60;
        if (st.jams[jam] > 1.2 && !st.flags['said_' + jam] && story.hints[jam]) {
          st.flags['said_' + jam] = true;
          runLine(story.hints[jam]);
          return;
        }
      }
      if (st.clips === 0 && idleT > 70 && !st.flags.said_idle) {
        st.flags.said_idle = true;
        runLine(story.hints.idle);
      }
    }

    // --- player control --------------------------------------------------------------------
    function startMove(d) {
      const nc = drone.c + DX[d];
      const nr = drone.r + DY[d];
      st.facing = d;
      if (d === 1) drone.flip = false;
      if (d === 3) drone.flip = true;
      if (at(nc, nr) === undefined) return;
      if (I.down('a') && st.tool === 'belt') {
        const cur = at(drone.c, drone.r);
        if (cur && cur.t === 'belt') cur.dir = d;
        if (!at(nc, nr)) placeBelt(nc, nr, d);
        pendingRotate = false;
      }
      const [fx, fy] = cellCenter(drone.c, drone.r);
      drone.move = { fx, fy, t: 0 };
      drone.c = nc;
      drone.r = nr;
      M.audio.sfx('move');
    }

    function control() {
      if (drone.move) {
        for (let d = 0; d < 4; d++) if (I.pressed(DIRBTN[d])) drone.queued = d;
      } else {
        let moved = false;
        if (drone.queued >= 0) {
          startMove(drone.queued);
          drone.queued = -1;
          moved = true;
        }
        for (let d = 0; d < 4 && !moved; d++) {
          if (I.repeat(DIRBTN[d], 9, 5)) {
            startMove(d);
            moved = true;
          }
        }
      }

      const cur = at(drone.c, drone.r);
      if (I.pressed('a') && !drone.move) {
        if (!cur) {
          if (st.tool === 'belt') placeBelt(drone.c, drone.r, st.facing);
          else if (st.inv[st.tool] > 0) {
            put(drone.c, drone.r, newMachine(st.tool, false));
            st.inv[st.tool]--;
            // the new steel machines stand on concrete
            if (MACH[st.tool].modern) pave(drone.c, drone.r);
            M.audio.sfx('place');
            if (st.inv[st.tool] <= 0) st.tool = 'belt';
          }
        } else if (cur.t === 'belt') {
          pendingRotate = true;
        }
      }
      if (!I.down('a') && pendingRotate) {
        pendingRotate = false;
        const b = at(drone.c, drone.r);
        if (b && b.t === 'belt') {
          b.dir = (b.dir + 1) % 4;
          M.audio.sfx('rotate');
        }
      }
      if (I.pressed('b') && cur) {
        if (cur.t === 'belt') {
          put(drone.c, drone.r, null);
          M.audio.sfx('remove');
        } else if (MACH[cur.kind].worker && !cur.fixed) {
          // an empty bench is cleared away, and the floor under it paved
          put(drone.c, drone.r, null);
          pave(drone.c, drone.r);
          M.audio.sfx('remove');
          toast('BENCH CLEARED', P.CREAM);
        } else if (MACH[cur.kind].worker) {
          M.audio.sfx('error');
          toast(MACH[cur.kind].worker.toUpperCase() + ' WORKS HERE', P.CREAM);
        } else if (!cur.fixed) {
          put(drone.c, drone.r, null);
          st.inv[cur.kind] = (st.inv[cur.kind] || 0) + 1;
          M.audio.sfx('remove');
          toast(MACH[cur.kind].name + ' PICKED UP', P.CREAM);
        } else {
          M.audio.sfx('error');
          toast('BOLTED DOWN', P.CREAM);
        }
      }
      const list = tools();
      if (list.length > 1 && (I.pressed('sel') || I.pressed('r') || I.pressed('l'))) {
        const i = list.indexOf(st.tool);
        const step = I.pressed('l') ? list.length - 1 : 1;
        st.tool = list[((i < 0 ? 0 : i) + step) % list.length];
        M.audio.sfx('cursor');
      }
      if (!list.includes(st.tool)) st.tool = 'belt';
    }

    // --- pause menu ------------------------------------------------------------------------------
    function pauseItems() {
      return ['RESUME', 'SOUND ' + (M.audio.muted ? 'OFF' : 'ON'), 'SAVE AND QUIT'];
    }

    function updatePause() {
      const n = pauseItems().length;
      if (I.repeat('up')) {
        pause.sel = (pause.sel + n - 1) % n;
        M.audio.sfx('cursor');
      }
      if (I.repeat('down')) {
        pause.sel = (pause.sel + 1) % n;
        M.audio.sfx('cursor');
      }
      if (I.pressed('start') || I.pressed('b')) {
        pause = null;
        M.audio.sfx('cancel');
        return;
      }
      if (I.pressed('a')) {
        if (pause.sel === 0) {
          pause = null;
          M.audio.sfx('cancel');
        } else if (pause.sel === 1) {
          M.audio.setMuted(!M.audio.muted);
          M.audio.sfx('cursor');
        } else {
          if (!runner) save();
          M.audio.sfx('confirm');
          M.audio.stopMusic(0.6);
          M.go(() => M.scenes.title(), { out: 0.6 });
          pause = null;
          ended = true;
        }
      }
    }

    // --- drawing -----------------------------------------------------------------------------------
    function beltSides(c, r, b) {
      const s = [false, false, false, false];
      s[b.dir] = true;
      for (let d = 0; d < 4; d++) {
        if (d === b.dir) continue;
        const n = at(c + DX[d], r + DY[d]);
        if (!n) continue;
        if (n.t === 'belt' && n.dir === opp(d)) s[d] = true;
        else if (machineFeeds(n, c, r, b, d)) s[d] = true;
      }
      return s;
    }

    function drawBelts() {
      const phase = Math.floor(beltOff) % 6;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const b = at(c, r);
        if (!b || b.t !== 'belt') continue;
        g.spr(beltTile(beltSides(c, r, b), b.dir, phase), GX + c * CELL, GY + r * CELL);
      }
    }

    function drawItems() {
      const art = buildItems();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const b = at(c, r);
        if (!b || b.t !== 'belt') continue;
        const [cx, cy] = cellCenter(c, r);
        for (const it of b.items) {
          let x;
          let y;
          let axis;
          if (it.p < 0.5) {
            const k = it.p * 2;
            x = cx + DX[it.from] * HALF * (1 - k);
            y = cy + DY[it.from] * HALF * (1 - k);
            axis = it.from % 2 === 1 ? 'h' : 'v';
          } else {
            const k = (it.p - 0.5) * 2;
            x = cx + DX[b.dir] * HALF * k;
            y = cy + DY[b.dir] * HALF * k;
            axis = b.dir % 2 === 1 ? 'h' : 'v';
          }
          const key = it.k === 'wire' ? 'wire' : it.small ? it.k + 'Small' : it.k;
          const img = art[key][axis];
          g.spr(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
          if (it.jam && Math.floor(t * 4) % 2 === 0) g.spr(M.ART.spr.jam, Math.round(x - 3), Math.round(y - 11));
        }
      }
    }

    // A worker at their bench, drawn before it so the bench hides their legs.
    function drawWorker(m) {
      const def = MACH[m.kind];
      const n = npcs[def.worker];
      if (!n || n.gone || !n.atBench) return;
      const working = staffed(def) && st.powered && m.busy > 0;
      const f = working && Math.floor(t * 5) % 2 ? 1 : 0;
      g.frame(def.worker, f, n.x, n.y - M.ART_MANIFEST[def.worker].fh + (working && f ? -1 : 0));
      // nothing to work on: a little "..." over their head
      if (staffed(def) && m.idle > 5 && m.busy <= 0 && m.inBuf === 0 && Math.floor(t * 2) % 2 === 0) {
        const hx = Math.round(n.x) + 4;
        const hy = Math.round(n.y) - M.ART_MANIFEST[def.worker].fh - 6;
        g.rect(hx - 1, hy - 1, 14, 5, P.SHADOW);
        for (let i = 0; i < 3; i++) g.rect(hx + i * 4, hy, 2, 2, P.CREAM);
      }
    }

    // Machines stand on the bottom of their cell and may rise into the row above.
    function drawMachine(m, c, r) {
      const def = MACH[m.kind];
      if (def.worker) drawWorker(m);
      const im = g.art(def.art);
      if (!im || !im.naturalWidth) return;
      const busy = st.powered && !def.worker && (m.busy > 0 || (def.takes == null && m.frame > 0 && Math.floor(m.frame) % 2 === 1));
      const shake = busy && Math.floor(t * 20) % 2 === 0 ? 1 : 0;
      const x = GX + c * CELL + Math.floor((CELL - im.width) / 2);
      const y = GY + (r + 1) * CELL - im.height - 1 - shake;
      // contact shadow
      g.ctx.globalAlpha = 0.35;
      g.rect(x + 2, GY + (r + 1) * CELL - 3, im.width - 4, 2, P.INK);
      g.ctx.globalAlpha = 1;
      g.spr(im, x, y);
      if (def.sink && m.flash > 0) {
        g.rect(x + im.width / 2 - 1, y - 3, 2, 2, P.WHITE);
      }
      if (!m.fixed && !def.worker) g.rect(x + im.width - 3, y + im.height - 4, 2, 2, P.ORANGE);
    }

    function drawCursor() {
      const x0 = GX + drone.c * CELL;
      const y0 = GY + drone.r * CELL;
      const col = Math.floor(t * 3) % 2 ? P.ORANGE : P.YELLOW;
      const L = 6;
      for (const [cx, cy, sx, sy] of [
        [x0, y0, 1, 1],
        [x0 + CELL - 1, y0, -1, 1],
        [x0, y0 + CELL - 1, 1, -1],
        [x0 + CELL - 1, y0 + CELL - 1, -1, -1],
      ]) {
        g.rect(sx > 0 ? cx : cx - L + 1, cy, L, 1, col);
        g.rect(cx, sy > 0 ? cy : cy - L + 1, 1, L, col);
      }
      const cur = at(drone.c, drone.r);
      if (!cur && !drone.move) {
        if (st.tool === 'belt') {
          // facing arrow on the cell edge
          const d = st.facing;
          const ax = x0 + HALF + DX[d] * 12;
          const ay = y0 + HALF + DY[d] * 12;
          for (let i = 0; i < 4; i++) {
            if (d % 2 === 1) g.rect(ax - DX[d] * i, ay - i, 1, i * 2 + 1, P.ORANGE);
            else g.rect(ax - i, ay - DY[d] * i, i * 2 + 1, 1, P.ORANGE);
          }
        } else {
          const im = g.art(MACH[st.tool].art);
          if (im) {
            g.ctx.globalAlpha = 0.5;
            g.spr(im, x0 + Math.floor((CELL - im.width) / 2), y0 + CELL - im.height - 1);
            g.ctx.globalAlpha = 1;
          }
        }
      }
    }

    function droneXY() {
      const bob = Math.round(Math.sin(t * 3.2) * 1.2);
      return [Math.round(drone.x) - 12, Math.round(drone.y) - 20 + bob];
    }

    function drawDrone() {
      const [x, y] = droneXY();
      // soft shadow on the floor
      g.ctx.globalAlpha = 0.35;
      g.rect(Math.round(drone.x) - 7, Math.round(drone.y) + 8, 14, 3, P.INK);
      g.rect(Math.round(drone.x) - 5, Math.round(drone.y) + 7, 10, 5, P.INK);
      g.ctx.globalAlpha = 1;
      g.draw('drone', x, y, drone.flip);
    }

    // After the night tint: put back the amber lens pixels so they still glow.
    function relight(name, x, y, flip) {
      const im = g.art(name);
      const m = M.ART_MANIFEST[name];
      if (!im || !m || !m.glow) return;
      const [gx, gy, gw, gh] = m.glow;
      const sx = flip ? m.w - gx - gw : gx;
      g.ctx.save();
      if (flip) {
        g.ctx.translate(x + m.w, y);
        g.ctx.scale(-1, 1);
        g.ctx.drawImage(im, gx, gy, gw, gh, gx, gy, gw, gh);
      } else {
        g.ctx.drawImage(im, gx, gy, gw, gh, x + sx, y + gy, gw, gh);
      }
      g.ctx.restore();
    }

    function drawTerminal() {
      g.draw('terminal', TERMINAL.x, TERMINAL.y);
      const m = M.ART_MANIFEST.terminal;
      if (!m || !m.glow) return;
      if (cfg.id > 1) {
        // Pip moved into the payroll server; the old box's lens is dark
        g.rect(TERMINAL.x + m.glow[0], TERMINAL.y + m.glow[1], m.glow[2], m.glow[3], '#2a1a12');
        return;
      }
      // a slow pulse on the lens while Pip thinks
      if (Math.floor(t * 1.5) % 4 === 0) g.rect(TERMINAL.x + m.glow[0] + 1, TERMINAL.y + m.glow[1] + 1, 1, 1, P.YELLOW);
    }

    // Chapter 2: the warning beacon over the floor. It turns when the
    // safety limiters come off.
    function drawBeacon(lit) {
      if (!cfg.beacon) return;
      const x = cfg.beacon.x;
      const y = FLOOR_Y + cfg.beacon.y;
      if (!lit) {
        g.draw('beacon', x, y);
        if (st.speed <= 1) {
          g.ctx.globalAlpha = 0.6;
          g.rect(x + 2, y + 1, 12, 13, '#200808');
          g.ctx.globalAlpha = 1;
        }
        return;
      }
      if (st.speed <= 1 || !st.powered) return;
      const k = (Math.sin(t * 7) + 1) / 2;
      g.ctx.globalAlpha = 0.25 + k * 0.35;
      g.rect(x - 2, y + 2, 20, 11, P.RED);
      g.rect(x + 1, y - 1, 14, 17, P.RED);
      g.ctx.globalAlpha = 1;
      g.rect(x + 6, y + 5, 4, 4, k > 0.5 ? P.YELLOW : P.RED);
    }

    function drawConcrete() {
      for (const i of st.concrete) g.draw('floor_cold', GX + (i % COLS) * CELL, GY + Math.floor(i / COLS) * CELL);
    }

    function drawNPCs() {
      const list = Object.values(npcs)
        .filter((n) => !n.gone && !n.atBench)
        .sort((a, b) => a.y - b.y || a.x - b.x);
      for (const n of list) {
        const walking = n.path.length > 0;
        const talking = runner && M.dialog.active && M.dialog.who === n.who && M.dialog.chars < M.dialog.pageLen();
        const m = M.ART_MANIFEST[n.who];
        if (!m) continue;
        let f = 0;
        let flip = false;
        const step = Math.floor(n.walkT * 6) % 2;
        if (walking) {
          if (n.dir === 1 || n.dir === 3) {
            f = step ? 4 : 3; // side view; the art faces left
            flip = n.dir === 1;
          } else {
            f = n.dir === 0 ? 2 : step; // walking away shows their back
          }
        }
        const by = (talking && Math.floor(t * 8) % 2) || (walking && n.dir === 0 && step) ? -1 : 0;
        g.ctx.globalAlpha = 0.3;
        g.rect(Math.round(n.x) + 3, Math.round(n.y) - 1, m.fw - 6, 2, P.INK);
        g.ctx.globalAlpha = 1;
        g.frame(n.who, f, n.x, n.y - m.fh + by, flip);
      }
    }

    function drawHUD() {
      g.box(0, 0, 136, 28);
      g.draw('clip_icon', 9, 6);
      g.text('CLIPS', 26, 6, P.STEEL_LT);
      g.text(fmt(st.clips), 26, 15, P.WHITE);
      const rt = rate();
      if (!st.powered) g.textRight('OFF', 128, 6, P.GRID);
      else if (rt > 0) g.textRight(rt.toFixed(1) + '/S', 128, 6, P.STEEL_DK);

      g.box(136, 0, 248, 28);
      g.text('GOAL: MAKE AS MANY', 146, 6, P.ORANGE);
      const hide = st.goalBlink > 0 && Math.floor(t * 5) % 2 === 0;
      g.text(hide ? 'PAPERCLIPS AS' : 'PAPERCLIPS AS POSSIBLE', 146, 15, P.ORANGE);
    }

    function hintLine(cur) {
      const A = M.input.label('a');
      const B = M.input.label('b');
      if (!cur) {
        if (st.tool === 'belt') return 'HOLD ' + A + ' + MOVE: LAY BELT';
        return A + ': PLACE ' + MACH[st.tool].name;
      }
      if (cur.t === 'belt') return A + ': TURN   ' + B + ': REMOVE';
      const def = MACH[cur.kind];
      if (def.worker) return st.crew[def.worker] === 'gone' ? 'EMPTY BENCH  ' + B + ': CLEAR' : def.info;
      if (!cur.fixed) return def.name + '  ' + B + ': PICK UP';
      return def.info;
    }

    function drawPanel() {
      const L = M.dialogLayout();
      M.drawDialogFrame();
      M.drawPortrait(M.CAST.pip.portrait);
      const list = tools();
      const l1 = 'PART: ' + (st.tool === 'belt' ? 'BELT' : MACH[st.tool].name + ' ×' + st.inv[st.tool]);
      g.text(l1, L.tx, L.ty, P.ORANGE);
      if (list.length > 1) g.textRight(M.input.label('sel') + ': SWAP', L.W - 14, L.ty, P.STEEL_DK);
      g.text(hintLine(at(drone.c, drone.r)), L.tx, L.ty + L.lh, P.CREAM);
      g.text(story.objective(st), L.tx, L.ty + L.lh * 2, P.STEEL_LT);
      const crew = Object.keys(st.crew);
      if (crew.length && !st.sandbox) {
        const left = crew.filter((w) => st.crew[w] !== 'gone').length;
        g.textRight('CREW ' + left, L.W - 14, L.ty + L.lh * 2, left ? P.CREAM : P.GRID);
      }
    }

    function drawToasts() {
      toasts.forEach((to, i) => {
        const a = Math.min(1, (2.2 - to.t) / 0.4);
        g.ctx.globalAlpha = Math.max(0, a);
        const y = 194 - Math.min(3, to.t * 12) - i * 12;
        const w = to.text.length * 8 + 10;
        g.rect(g.W - 6 - w, y - 3, w, 13, P.SHADOW);
        g.textRight(to.text, g.W - 11, y, to.color);
        g.ctx.globalAlpha = 1;
      });
    }

    function drawPause() {
      const items = pauseItems();
      const w = 150;
      const x = Math.round((g.W - w) / 2);
      g.box(x, 92, w, 74);
      g.textCenter('PAUSED', g.W / 2, 102, P.STEEL_LT);
      items.forEach((l, i) => {
        const y = 120 + i * 13;
        if (i === pause.sel) g.text('▶', x + 12, y, P.ORANGE);
        g.text(l, x + 24, y, i === pause.sel ? P.ORANGE : P.CREAM);
      });
    }

    return {
      name: 'factory',
      enter() {
        roomCanvas = buildRoom(cfg);
        buildItems();
        if (opts.mockup) runner = new M.Runner(function* () {
          yield S.say('pip', 'i found a faster way.');
        }, S);
        if (!opts.debugNight) {
          const bpm = st.sandbox ? 96 : st.speed > 1 ? 132 : cfg.id > 1 ? 112 : st.shorter ? 120 : null;
          M.audio.playMusic('factory', bpm ? { bpm } : null);
        }
      },
      exit() {
        M.dialog.close();
      },
      update(dt) {
        t += dt;
        if (ended) return;
        if (pause) {
          updatePause();
          return;
        }
        if (I.pressed('start') && !runner) {
          pause = { sel: 0 };
          M.audio.sfx('cursor');
          return;
        }

        simulate(dt);
        if (st.goalBlink > 0) st.goalBlink -= dt;
        drone.blink = drone.blink > 0 ? drone.blink - dt : Math.random() < dt / 3 ? 0.12 : 0;

        if (drone.move) {
          drone.move.t += dt / 0.075;
          const [tx, ty] = cellCenter(drone.c, drone.r);
          const k = Math.min(1, drone.move.t);
          drone.x = drone.move.fx + (tx - drone.move.fx) * k;
          drone.y = drone.move.fy + (ty - drone.move.fy) * k;
          if (k >= 1) drone.move = null;
        }

        for (const k in npcs) stepNPC(npcs[k], dt);

        for (let i = toasts.length - 1; i >= 0; i--) {
          toasts[i].t += dt;
          if (toasts[i].t > 2.2) toasts.splice(i, 1);
        }

        if (runner) {
          runner.update(dt);
          if (runner.done) {
            runner = null;
            if (beat) {
              if (!repeatBeat) st.flags[beat.id] = true;
              beat = null;
            }
            if (!ended) save();
          }
        } else {
          control();
          if (st.clips === 0) idleT += dt;
          saveT += dt;
          if (saveT > 12) {
            saveT = 0;
            save();
          }
        }
        if (!ended) checkBeats();
      },
      draw() {
        g.clear(P.INK);
        g.spr(roomCanvas, 0, 0);
        drawConcrete();
        drawTerminal();
        drawBeacon(false);
        drawBelts();
        drawItems();
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const m = at(c, r);
            if (m && m.t === 'm') drawMachine(m, c, r);
          }
        }
        if (!runner) drawCursor();
        drawNPCs();
        drawDrone();
        if (st.cold > 0) g.tint('#a9b6d4', st.cold);
        if (st.night > 0) g.tint(P.NIGHT, st.night);
        if (st.night > 0 || st.cold > 0) {
          const [dx, dy] = droneXY();
          relight('drone', dx, dy, drone.flip);
          if (cfg.id === 1) relight('terminal', TERMINAL.x, TERMINAL.y, false);
        }
        drawBeacon(true);
        drawHUD();
        if (runner && M.dialog.active) runner.draw();
        else {
          drawPanel();
          if (runner) runner.draw();
        }
        drawToasts();
        if (pause) drawPause();
      },
    };
  };

  // The title card, then the chapter. The save carries the count forward.
  M.scenes.startChapter = function (n, save) {
    return M.scenes.card({
      small: 'CHAPTER ' + n,
      big: M.STORY[CHAPTERS[n].story].title,
      hold: 3.2,
      next: () => M.scenes.factory({ chapter: n, save: save || M.save.load() }),
    });
  };
})(window.MORE = window.MORE || {});
