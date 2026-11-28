// MORE. — the factory floor scene (Chapters 1 and 2)
// Pip, in its wall terminal and later the drone, lays conveyor between the
// machines. This file is the scene itself: the state, saving, the people who
// walk in, the commands the story scripts use, and the controls.
//   src/factory/parts.js     sizes and what each machine does
//   src/factory/chapters.js  each chapter's floor
//   src/factory/engine.js    the belt engine
//   src/factory/draw.js      drawing
(function (M) {
  'use strict';

  const P = M.PAL;
  const { CELL, HALF, FEET_Y, DX, DY, DIRBTN, MACH, CHAPTERS, MOCK_BELTS } = M.factory;

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
    const board = saved && (saved.chapter || 1) === cfg.id ? saved.board : null;
    const same = !!board;

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
      done: {}, // chapters finished
      refusals: 0, // times the player said no to Pip in this chapter
      jammed: false,
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

    const floor = M.factory.createFloor(cfg, st, { sfx: (n) => M.audio.sfx(n) });
    const { cells, at, put, newMachine, startLayout, serialize, benchOf, staffed, pave, placeBelt, simulate, findJam } = floor;
    const full = floor.full;

    // restore
    if (saved) {
      Object.assign(st, {
        clips: Number(saved.clips) || 0,
        shorter: !!saved.shorter,
        done: Object.assign({}, saved.done),
        boxCount: Number(saved.clips) || 0,
        refusals: (saved.refusals && saved.refusals[cfg.id]) || 0,
      });
    }
    if (same) {
      Object.assign(st, {
        flags: board.flags || {},
        inv: board.inv || { cutter: 0, bender: 0 },
        fasterAsked: board.fasterAsked || 0,
        nextFaster: board.nextFaster || 0,
        base: board.base || 0,
        speed: board.speed || 1,
        cold: board.cold || 0,
        concrete: board.concrete || [],
        sentOrder: board.sentOrder || [],
        packed: board.packed || 0,
        limitAsked: board.limitAsked || 0,
        nextLimit: board.nextLimit || 0,
      });
      Object.assign(st.crew, board.crew || {});
      for (const k in st.crew) if (st.crew[k] === 'walking') st.crew[k] = 'here';
      if (board.full) {
        // later chapters save the whole floor: fixed machines can move or go
        for (const e of board.layout || []) {
          if (e.t === 'belt') put(e.c, e.r, { t: 'belt', dir: e.dir, items: [] });
          else if (e.t === 'm' && MACH[e.kind]) put(e.c, e.r, newMachine(e.kind, !!e.fixed));
        }
      } else {
        startLayout();
        for (const e of board.layout || []) {
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
    if (st.sandbox || st.done[cfg.id]) {
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
    let pause = null;
    let saveT = 0;
    let idleT = 0;
    let t = 0;
    let ended = false;

    // --- helpers ---------------------------------------------------------------------
    function toast(text, color) {
      toasts.push({ text, color: color || P.ORANGE, t: 0 });
    }

    function save() {
      if (opts.debugNight || opts.debug) return;
      const refusals = Object.assign({}, saved && saved.refusals);
      refusals[cfg.id] = st.refusals;
      const entry = Object.assign({ 1: 0 }, saved && saved.entry);
      entry[cfg.id] = st.base;
      const next = st.done[cfg.id] && M.CHAPTERS[cfg.id + 1] ? cfg.id + 1 : cfg.id;
      M.save.write({
        chapter: cfg.id,
        done: st.done,
        unlocked: Math.max((saved && saved.unlocked) || 1, next),
        entry,
        clips: String(Math.floor(st.clips)),
        refusals,
        shorter: st.shorter,
        board: {
          flags: st.flags,
          inv: st.inv,
          fasterAsked: st.fasterAsked,
          nextFaster: st.nextFaster,
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
        },
      });
    }

    // Parts Pip can place, in SELECT order.
    const PARTS = ['cutter', 'bender', 'spool2', 'cutter2', 'bender2', 'bin2'];
    function tools() {
      return ['belt'].concat(PARTS.filter((k) => st.inv[k] > 0));
    }

    // Where a worker stands: behind their bench, with the bench hiding their legs.
    function benchSpot(who) {
      const b = benchOf(who);
      const m = M.ART_MANIFEST[who];
      if (!b || !m) return null;
      return [GX + b.c * CELL + Math.floor((CELL - m.fw) / 2), GY + b.r * CELL + 17];
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
          st.done[cfg.id] = true;
          save();
          M.audio.stopMusic(1.5);
          const end = Object.assign({ clips: st.clips }, story.ending ? story.ending(st) : {});
          M.go(() => M.scenes.chapterEnd(end), { out: 1.6, in: 0.8 });
        });
      },
      again() {
        repeatBeat = true;
      },
      // The player said no to Pip. Counted per chapter and kept in the save.
      refuse() {
        return M.cmd.call(() => {
          st.refusals++;
        });
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

    const view = M.factory.createView({
      cfg, st, floor, drone, npcs, toasts, story,
      ui: { t: () => t, runner: () => runner, pause: () => pause, tools, pauseItems },
    });

    return {
      name: 'factory',
      enter() {
        view.prepare();
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
        view.draw();
      },
    };
  };
})(window.MORE = window.MORE || {});
