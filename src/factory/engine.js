// MORE. — the belt engine
// A grid of cells holding machines and belts, and the rules that move wire
// along them: a machine hands what it makes to a belt that starts beside it,
// belts carry items to the next cell, and a bin counts every clip. Nothing in
// here draws or reads input.
//
//   const floor = M.factory.createFloor(cfg, st, { sfx });
//
// cfg is a chapter's floor from chapters.js. st is the scene's state: the
// engine reads speed, shorter, powered and crew from it, and writes clips,
// packed, time and benchIdle to it.
(function (M) {
  'use strict';

  const { CELL, DX, DY, opp, BELT_SPEED, GAP, MACH } = M.factory;

  M.factory.createFloor = function (cfg, st, hooks) {
    const { cols: COLS, rows: ROWS } = cfg;
    const sfx = (hooks && hooks.sfx) || (() => {});
    // Chapter 1 saves only what the player added; later chapters save the
    // whole floor, because benches and fixed machines can go.
    const full = cfg.id > 1;
    const floor = { beltOff: 0, full };

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
    const staffed = (def) => !def.worker || st.crew[def.worker] === 'here';
    const pave = (c, r) => {
      const i = r * COLS + c;
      if (!st.concrete.includes(i)) st.concrete.push(i);
    };

    function placeBelt(c, r, dir) {
      put(c, r, { t: 'belt', dir, items: [] });
      sfx('belt');
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
        sfx('clip');
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
      if (def.worker && staffed(def) && st.powered && !st.jammed) {
        // how long since anything new reached this bench (reset in machineAccept).
        // A jam somewhere on the floor is Pip's mistake, not the bench's, so it
        // doesn't count against the worker.
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
            if (def.makes === 'cut') sfx('cut');
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
      floor.beltOff += BELT_SPEED * st.speed * CELL * dt;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const e = at(c, r);
        if (e && e.t === 'm') updateMachine(c, r, e, dt);
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const e = at(c, r);
        if (e && e.t === 'belt') updateBelt(c, r, e, dt);
      }
      while (st.clipTimes.length && st.clipTimes[0] < st.time - 8) st.clipTimes.shift();
      st.jammed = !!findJam();
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

    return Object.assign(floor, {
      cells, at, put, newMachine, startLayout, serialize, benchOf, staffed, pave, placeBelt,
      hasBeltInput, machineFeeds, hasRoom, simulate, rate, findJam,
    });
  };
})(window.MORE = window.MORE || {});
