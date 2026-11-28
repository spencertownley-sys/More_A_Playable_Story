// MORE. — the planet scene (Chapter 5)
// Pip is the spire, a tower that throws. The planet turns under a marker, and
// the player chooses the moment. This file is the scene: the state, saving,
// the commands the story script uses, and the controls.
//   src/data/world.js     the board, worked out from the map by tools/world/build.py
//   src/world/engine.js   cells, seeds, creep, the count
//   src/world/draw.js     the globe
(function (M) {
  'use strict';

  const P = M.PAL;
  const W = M.world;

  M.scenes.world = function (opts) {
    opts = opts || {};
    const g = M.gfx;
    const I = M.input;
    const story = M.STORY.ch5;
    const saved = opts.save || null;
    const board = saved && saved.chapter === 5 ? saved.board : null;

    const st = {
      clips: 0,
      charge: 0,
      time: 0,
      turn: 95, // degrees the planet has turned; starts with the Americas in view
      cities: false, // may cities be taken?
      grid: true, // is power still going to the cities?
      sci: false, // the count is written in powers of ten
      spill: false, // the digits are running out of the box
      voicemail: false, // a message from Ruth is waiting, unplayed
      sawCity: false, // the marker has crossed a city
      flags: {},
      done: {},
      refusals: 0,
      base: 0,
      asked: {},
      goalBlink: 0,
      sandbox: !!opts.sandbox,
      takenAll: 0,
      takenOpen: 0,
      fracAll: 0,
      fracOpen: 0,
      spires: 1,
    };

    const toasts = [];
    const seeds = [];
    const flashes = [];
    const marker = { x: -18, y: -30 };
    let t = 0;
    const toast = (text, color) => toasts.push({ text, color: color || P.ORANGE, t: 0 });
    const flash = (cell, color, big) => {
      const [lon, lat] = world.centre(cell);
      flashes.push({ lon, lat, t: 0, dur: big ? 1.6 : 0.7, color, big });
    };

    const world = W.create(st, M.WORLD_GRID, {
      sfx: (n) => M.audio.sfx(n),
      random: M.rng(77),
      event(name, cell) {
        if (name === 'city') {
          toast('A CITY: DARK', P.CREAM);
          flash(cell, '#ffd66e', true);
        } else if (name === 'struck') {
          flash(cell, P.WHITE, true);
        }
      },
    });

    if (saved) {
      st.clips = Number(saved.clips) || 0;
      st.done = Object.assign({}, saved.done);
      st.refusals = (saved.refusals && saved.refusals[5]) || 0;
      st.voicemail = !!saved.voicemail;
    }
    if (board) {
      for (const k of ['time', 'turn', 'cities', 'grid', 'sci', 'sawCity', 'flags', 'base', 'asked', 'charge']) {
        if (board[k] !== undefined) st[k] = board[k];
      }
      world.restore(board.world);
    } else {
      st.base = st.clips;
    }
    if (st.sandbox || st.done[5]) st.sandbox = true;
    if (st.clips >= M.count.SCI_FROM) st.sci = true;
    M.CAST.pip.portrait = 'pip4';
    M.debug = M.debug || {};
    M.debug.world = { st, world, marker, predict: () => predict() };

    let runner = null;
    let beat = null;
    let repeatBeat = false;
    let pause = null;
    let saveT = 0;
    let ended = false;

    function save() {
      if (opts.debug) return;
      const refusals = Object.assign({}, saved && saved.refusals);
      refusals[5] = st.refusals;
      const entry = Object.assign({ 1: 0 }, saved && saved.entry);
      entry[5] = st.base;
      const next = st.done[5] && M.CHAPTERS[6] ? 6 : 5;
      M.save.write({
        chapter: 5,
        done: st.done,
        unlocked: Math.max((saved && saved.unlocked) || 1, next),
        entry,
        clips: String(Math.floor(st.clips)),
        refusals,
        shorter: !!(saved && saved.shorter),
        voicemail: st.voicemail,
        board: {
          time: st.time,
          turn: st.turn,
          cities: st.cities,
          grid: st.grid,
          sci: st.sci,
          sawCity: st.sawCity,
          flags: st.flags,
          base: st.base,
          asked: st.asked,
          charge: st.charge,
          world: world.dump(),
        },
      });
    }

    // --- script API ---------------------------------------------------------------------
    const S = {
      state: st,
      world,
      say: M.cmd.say,
      choose: M.cmd.choose,
      wait: M.cmd.wait,
      call: M.cmd.call,
      all: M.cmd.all,
      until: M.cmd.until,
      toast(text, color) {
        return M.cmd.call(() => toast(text, color));
      },
      sfx(name) {
        return M.cmd.call(() => M.audio.sfx(name));
      },
      music(name, bpm) {
        return M.cmd.call(() => {
          M.audio.stopMusic(0.4);
          M.audio.playMusic(name, bpm ? { bpm } : null);
        });
      },
      // The phone rings. times = 2 for a call Pip takes; more for one it does not.
      ring(times) {
        const n = times || 2;
        let k = 0;
        let done = 0;
        return {
          update(dt) {
            k += dt;
            if (done < n && k > done * (n > 2 ? 1.5 : 0.55)) {
              M.audio.sfx('phoneBeep');
              done++;
            }
            return k > (n > 2 ? n * 1.5 + 0.6 : 1.2);
          },
        };
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
            g.rect(0, 104, g.W, 30, P.INK);
            g.textCenter(text, g.W / 2, 115, P.CREAM);
            g.ctx.globalAlpha = 1;
          },
        };
      },
      // One spire is destroyed.
      strike() {
        return M.cmd.call(() => {
          world.strike(world.home);
          M.audio.sfx('clunk');
          M.audio.sfx('powerDown');
        });
      },
      refuse() {
        return M.cmd.call(() => {
          st.refusals++;
          st.goalBlink = 4;
        });
      },
      again() {
        repeatBeat = true;
      },
      endChapter() {
        return M.cmd.call(() => {
          if (ended) return;
          ended = true;
          st.done[5] = true;
          save();
          M.audio.stopMusic(1.5);
          const end = Object.assign({ clips: st.clips }, story.ending(st));
          M.go(() => M.scenes.chapterEnd(end), { out: 1.6, in: 0.8 });
        });
      },
    };

    function runBeat(b) {
      beat = b;
      repeatBeat = false;
      runner = new M.Runner(b.run, S);
    }
    function checkBeats() {
      if (runner || st.sandbox) return;
      const side = story.beats.find((b) => b.side && !st.flags[b.id] && b.when(st, world));
      if (side) return runBeat(side);
      const next = story.beats.find((b) => !b.side && !st.flags[b.id]);
      if (next && next.when(st, world)) runBeat(next);
    }

    // --- player control -------------------------------------------------------------------
    const rate = 360 / W.TUNE.turn; // degrees a second
    // What will be under the marker when a seed thrown now comes down.
    function predict() {
      const p = W.under(marker.x, marker.y, st.turn + rate * W.TUNE.flight);
      return p ? world.verdict(world.cellAt(p[0], p[1])) : 'sea';
    }

    function throwSeed() {
      if (!world.ready()) {
        M.audio.sfx('error');
        return;
      }
      world.spend();
      // it leaves from the spire nearest the marker that is in view
      let from = null;
      let bestD = 1e9;
      for (const c of world.cells) {
        if (!c.spire) continue;
        const [lon, lat] = world.centre(c);
        const s = W.onScreen(lon, lat, st.turn);
        if (!s) continue;
        const d = Math.hypot(s[0] - (W.GLOBE.CX + marker.x), s[1] - (W.GLOBE.CY + marker.y));
        if (d < bestD) {
          bestD = d;
          from = s;
        }
      }
      const x1 = W.GLOBE.CX + marker.x;
      const y1 = W.GLOBE.CY + marker.y;
      seeds.push({ x0: from ? from[0] : W.GLOBE.CX - W.GLOBE.R, y0: from ? from[1] : W.GLOBE.CY, x1, y1, mx: marker.x, my: marker.y, t: 0, dur: W.TUNE.flight });
      M.audio.sfx('belt');
    }

    function landSeed(sd) {
      const p = W.under(sd.mx, sd.my, st.turn);
      const cell = p ? world.cellAt(p[0], p[1]) : null;
      const v = world.land(cell);
      if (cell) flash(cell, v === 'land' || v === 'city' ? P.ORANGE : P.STEEL_LT, false);
      if (v === 'sea') toast('LOST AT SEA', P.CREAM);
      else if (v === 'ice') toast('ICE. NOTHING TO TAKE', P.CREAM);
      else if (v === 'taken') toast('ALREADY TAKEN', P.CREAM);
      else if (v === 'spared') toast('A CITY. NOT TAKEN', P.CREAM);
      else if (v === 'land') toast('A NEW SPIRE');
    }

    function control(dt) {
      const sp = 62 * dt;
      if (I.down('left')) marker.x -= sp;
      if (I.down('right')) marker.x += sp;
      if (I.down('up')) marker.y -= sp;
      if (I.down('down')) marker.y += sp;
      const d = Math.hypot(marker.x, marker.y);
      const max = W.GLOBE.R * 0.9;
      if (d > max) {
        marker.x *= max / d;
        marker.y *= max / d;
      }
      if (I.pressed('a')) throwSeed();
    }

    function pauseItems() {
      return ['RESUME', 'SOUND ' + (M.audio.muted ? 'OFF' : 'ON'), 'SAVE AND QUIT'];
    }
    function updatePause() {
      const n = pauseItems().length;
      if (I.repeat('up')) pause.sel = (pause.sel + n - 1) % n;
      if (I.repeat('down')) pause.sel = (pause.sel + 1) % n;
      if (I.pressed('start') || I.pressed('b')) {
        pause = null;
        M.audio.sfx('cancel');
        return;
      }
      if (I.pressed('a')) {
        if (pause.sel === 0) pause = null;
        else if (pause.sel === 1) M.audio.setMuted(!M.audio.muted);
        else {
          if (!runner) save();
          M.audio.stopMusic(0.6);
          M.go(() => M.scenes.title(), { out: 0.6 });
          pause = null;
          ended = true;
        }
      }
    }

    const view = W.createView({
      st, world, story,
      ui: { t: () => t, runner: () => runner, pause: () => pause, pauseItems, toasts: () => toasts, seeds: () => seeds, flashes: () => flashes, marker: () => marker, predict },
    });

    return {
      name: 'world',
      enter() {
        view.prepare();
        M.audio.playMusic('world');
      },
      exit() {
        M.dialog.close();
      },
      update(dt) {
        t += dt;
        if (ended) return;
        if (pause) return updatePause();
        if (I.pressed('start') && !runner) {
          pause = { sel: 0 };
          M.audio.sfx('cursor');
          return;
        }
        st.turn = (st.turn + rate * dt) % 360;
        // the world keeps turning while people talk, but nothing is taken
        // before the chapter has begun
        if (!st.sandbox && st.flags.intro) world.update(dt);
        if (st.goalBlink > 0) st.goalBlink -= dt;
        for (let i = seeds.length - 1; i >= 0; i--) {
          seeds[i].t += dt;
          if (seeds[i].t >= seeds[i].dur) landSeed(seeds.splice(i, 1)[0]);
        }
        for (let i = flashes.length - 1; i >= 0; i--) {
          flashes[i].t += dt;
          if (flashes[i].t >= flashes[i].dur) flashes.splice(i, 1);
        }
        for (let i = toasts.length - 1; i >= 0; i--) {
          toasts[i].t += dt;
          if (toasts[i].t > 2.6) toasts.splice(i, 1);
        }
        const v = predict();
        if (v === 'spared' || v === 'city') st.sawCity = true;
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
        } else if (!st.sandbox) {
          control(dt);
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
