// MORE. — drawing the factory floor
// The room (painted once), belts in the tileset's look, the items riding them,
// machines, people, the drone, the HUD and the panel under the floor. The
// scene hands over what to draw; nothing in here changes the game.
//
//   const view = M.factory.createView({ cfg, st, floor, drone, npcs, toasts, story, ui });
//   view.prepare();  view.draw();
//
// ui gives the scene's moving parts: t(), runner(), pause(), tools(), pauseItems().
(function (M) {
  'use strict';

  const P = M.PAL;
  const { CELL, HALF, WALL_Y, FLOOR_Y, DX, DY, opp, MACH, TERMINAL } = M.factory;

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

  M.factory.createView = function (env) {
    const g = M.gfx;
    const { cfg, st, floor, drone, npcs, toasts, story, ui } = env;
    const { cols: COLS, rows: ROWS, gx: GX, gy: GY } = cfg;
    const { at, machineFeeds, staffed, rate } = floor;
    const { tools, pauseItems } = ui;
    const cellCenter = (c, r) => [GX + c * CELL + HALF, GY + r * CELL + HALF];
    let roomCanvas = null;

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
      const phase = Math.floor(floor.beltOff) % 6;
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
          if (it.jam && Math.floor(ui.t() * 4) % 2 === 0) g.spr(M.ART.spr.jam, Math.round(x - 3), Math.round(y - 11));
        }
      }
    }

    // A worker at their bench, drawn before it so the bench hides their legs.
    function drawWorker(m) {
      const def = MACH[m.kind];
      const n = npcs[def.worker];
      if (!n || n.gone || !n.atBench) return;
      const working = staffed(def) && st.powered && m.busy > 0;
      const f = working && Math.floor(ui.t() * 5) % 2 ? 1 : 0;
      g.frame(def.worker, f, n.x, n.y - M.ART_MANIFEST[def.worker].fh + (working && f ? -1 : 0));
      // nothing to work on: a little "..." over their head
      if (staffed(def) && m.idle > 5 && m.busy <= 0 && m.inBuf === 0 && Math.floor(ui.t() * 2) % 2 === 0) {
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
      const shake = busy && Math.floor(ui.t() * 20) % 2 === 0 ? 1 : 0;
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
      const col = Math.floor(ui.t() * 3) % 2 ? P.ORANGE : P.YELLOW;
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
      const bob = Math.round(Math.sin(ui.t() * 3.2) * 1.2);
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
      if (Math.floor(ui.t() * 1.5) % 4 === 0) g.rect(TERMINAL.x + m.glow[0] + 1, TERMINAL.y + m.glow[1] + 1, 1, 1, P.YELLOW);
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
      const k = (Math.sin(ui.t() * 7) + 1) / 2;
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
        const talking = ui.runner() && M.dialog.active && M.dialog.who === n.who && M.dialog.chars < M.dialog.pageLen();
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
        const by = (talking && Math.floor(ui.t() * 8) % 2) || (walking && n.dir === 0 && step) ? -1 : 0;
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
      const hide = st.goalBlink > 0 && Math.floor(ui.t() * 5) % 2 === 0;
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
        if (i === ui.pause().sel) g.text('▶', x + 12, y, P.ORANGE);
        g.text(l, x + 24, y, i === ui.pause().sel ? P.ORANGE : P.CREAM);
      });
    }

    return {
      prepare() {
        roomCanvas = buildRoom(cfg);
        buildItems();
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
          if (!ui.runner()) drawCursor();
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
          if (ui.runner() && M.dialog.active) ui.runner().draw();
          else {
            drawPanel();
            if (ui.runner()) ui.runner().draw();
          }
          drawToasts();
          if (ui.pause()) drawPause();
      },
    };
  };
})(window.MORE = window.MORE || {});
