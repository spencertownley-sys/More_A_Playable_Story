// MORE. — the county map scene (Chapter 3)
// Pip, now three drones, buys the county a place at a time and builds over it.
// This file is the scene: the state, saving, the commands the story script
// uses, and the controls.
//   src/town/places.js   every place on the map
//   src/town/engine.js   who owns what, the drones' jobs, what the factories make
//   src/town/draw.js     drawing
(function (M) {
  'use strict';

  const P = M.PAL;
  const T = M.town;
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  // Who has to leave before a place is built over.
  const LEAVES = { home: 'truck', shop: 'truck', library: 'truck', school: 'bus' };

  M.scenes.town = function (opts) {
    opts = opts || {};
    const g = M.gfx;
    const I = M.input;
    const story = M.STORY.ch3;
    const saved = opts.save || null;
    const board = saved && saved.chapter === 3 ? saved.board : null;

    const st = {
      clips: 0,
      money: 8, // thousands of dollars in the company account
      day: 0,
      heat: 1, // how much over the odds the town is asking
      names: false, // buying under other names
      deal: false, // the county's debt for the school
      bought: 0,
      factories: 0, // places built over
      flags: {},
      tool: 'build',
      done: {},
      refusals: 0,
      base: 0,
      goalBlink: 0,
      night: 0,
      grey: 0, // how far the river has gone grey, 0..1
      dark: false, // Main Street's lights
      backdrop: null,
      backdropDim: 0,
      sandbox: !!opts.sandbox,
      asked: {}, // prompts: how many times asked, and when to ask again
      at: 'riverbend', // where the cursor is
      built: 1,
      working: 1,
      caps: null,
      short: null,
    };

    const toasts = [];
    const moves = [];
    const toast = (text, color) => toasts.push({ text, color: color || P.ORANGE, t: 0 });

    const town = T.create(st, {
      sfx: (n) => M.audio.sfx(n),
      event(name, p) {
        if (name === 'built') {
          st.factories++;
          toast(p.name + ': RUNNING');
        } else if (name === 'bought') {
          toast('BOUGHT: ' + p.name, P.CREAM);
        }
      },
    });

    if (saved) {
      st.clips = Number(saved.clips) || 0;
      st.done = Object.assign({}, saved.done);
      st.refusals = (saved.refusals && saved.refusals[3]) || 0;
    }
    if (board) {
      for (const k of ['money', 'day', 'heat', 'names', 'deal', 'bought', 'factories', 'flags', 'tool', 'base', 'grey', 'dark', 'asked', 'at']) {
        if (board[k] !== undefined) st[k] = board[k];
      }
      town.restore(board.town);
    } else {
      st.base = st.clips;
    }
    if (st.sandbox || st.done[3]) {
      st.sandbox = true;
      st.night = 0.55;
    }
    M.CAST.pip.portrait = 'pip3';
    M.debug = M.debug || {};
    M.debug.town = { st, town };

    const home = town.by.riverbend;
    const drones = [0, 1, 2].map((i) => ({ i, x: home.x + 8 + i * 7, y: T.MAP_Y + home.y + 10 + (i % 2) * 6 }));
    let runner = null;
    let beat = null;
    let repeatBeat = false;
    let pause = null;
    let saveT = 0;
    let t = 0;
    let ended = false;

    function save() {
      if (opts.debug) return;
      const refusals = Object.assign({}, saved && saved.refusals);
      refusals[3] = st.refusals;
      const entry = Object.assign({ 1: 0 }, saved && saved.entry);
      entry[3] = st.base;
      const next = st.done[3] && M.CHAPTERS[4] ? 4 : 3;
      M.save.write({
        chapter: 3,
        done: st.done,
        unlocked: Math.max((saved && saved.unlocked) || 1, next),
        entry,
        clips: String(Math.floor(st.clips)),
        refusals,
        shorter: !!(saved && saved.shorter),
        board: {
          money: st.money,
          day: st.day,
          heat: st.heat,
          names: st.names,
          deal: st.deal,
          bought: st.bought,
          factories: st.factories,
          flags: st.flags,
          tool: st.tool,
          base: st.base,
          grey: st.grey,
          dark: st.dark,
          asked: st.asked,
          at: st.at,
          town: town.dump(),
        },
      });
    }

    // --- script API ---------------------------------------------------------------------
    const S = {
      state: st,
      town,
      say: M.cmd.say,
      choose: M.cmd.choose,
      wait: M.cmd.wait,
      call: M.cmd.call,
      all: M.cmd.all,
      until: M.cmd.until,
      // These places come up for sale.
      sale(...ids) {
        return M.cmd.call(() => {
          for (const id of ids) if (town.by[id].s === 'wild') town.by[id].sale = true;
        });
      },
      take(...ids) {
        return M.cmd.call(() => ids.forEach((id) => town.take(id)));
      },
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
      // The phone rings twice.
      ring() {
        let k = 0;
        let n = 0;
        return {
          update(dt) {
            k += dt;
            if (n === 0 || (n === 1 && k > 0.55)) {
              M.audio.sfx('phoneBeep');
              n++;
            }
            return k > 1.2;
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
      // Swap the map for a fixed picture (the town meeting), and back.
      backdrop(name) {
        return M.cmd.call(() => {
          st.backdrop = name;
          st.backdropDim = 0;
        });
      },
      dim(to, dur) {
        return M.cmd.tween(st, 'backdropDim', to, dur);
      },
      night(to, dur) {
        return M.cmd.tween(st, 'night', to, dur);
      },
      grey(dur) {
        return M.cmd.tween(st, 'grey', 1, dur);
      },
      buildAll() {
        return M.cmd.call(() => {
          town.buildAll();
          moves.length = 0;
        });
      },
      // Someone leaves a place: a truck, or the school bus.
      leave(id, kind) {
        return M.cmd.call(() => depart(town.by[id], kind));
      },
      // A voicemail from Ruth: the phone, then her words on a clock.
      voicemail(v) {
        let k = 0;
        let phase = 'ring';
        let beeps = 0;
        let usedAudio = false;
        return {
          update(dt) {
            k += dt;
            if (phase === 'ring') {
              if (beeps === 0 && k > 0.6) beeps += M.audio.sfx('phoneBeep') || 1;
              if (beeps === 1 && k > 1.2) beeps += M.audio.sfx('phoneBeep') || 1;
              if (k > 2.4) {
                phase = 'play';
                k = 0;
                usedAudio = M.audio.voicemail.playClip ? M.audio.voicemail.playClip(v.clip) : false;
              }
              return false;
            }
            if (usedAudio) k = M.audio.voicemail.time;
            if (k > v.duration + 0.8) {
              M.audio.voicemail.stop();
              return true;
            }
            return false;
          },
          draw() {
            const L = M.dialogLayout();
            M.drawDialogFrame();
            M.drawPortrait('phone');
            g.text('1 NEW VOICEMAIL', L.tx, L.ty, P.STEEL_LT);
            g.textRight('RUTH', L.W - 14, L.ty, P.ORANGE);
            if (phase !== 'play') return;
            const c = v.captions.find((x) => k >= x.t && k < x.end);
            if (c) {
              const lines = M.font.wrap(c.text, Math.floor((L.W - L.tx - 14) / 8));
              lines.slice(0, 2).forEach((l, i) => g.text(l, L.tx, L.ty + L.lh * (i + 1), P.CREAM));
            }
          },
        };
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
          st.done[3] = true;
          save();
          M.audio.stopMusic(1.5);
          const end = Object.assign({ clips: st.clips }, story.ending(st));
          M.go(() => M.scenes.chapterEnd(end), { out: 1.6, in: 0.8 });
        });
      },
    };

    function depart(p, kind) {
      const dir = p.x + p.w / 2 < T.MAP_W / 2 ? -1 : 1;
      moves.push({ kind, x: p.x + p.w / 2 - 5, y: T.MAP_Y + p.y + p.h / 2, dir, t: 0, pack: 2.4 });
    }

    function runBeat(b) {
      beat = b;
      repeatBeat = false;
      runner = new M.Runner(b.run, S);
    }

    function checkBeats() {
      if (runner || st.sandbox) return;
      const side = story.beats.find((b) => b.side && !st.flags[b.id] && b.when(st, town));
      if (side) return runBeat(side);
      const next = story.beats.find((b) => !b.side && !st.flags[b.id]);
      if (next && next.when(st, town)) runBeat(next);
    }

    // --- player control -------------------------------------------------------------------
    const cursor = () => town.by[st.at];

    // The nearest place in a direction: mostly that way, and not far off to the side.
    function step(dir) {
      const [dx, dy] = DIRS[dir];
      const p = cursor();
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      let best = null;
      let bestD = Infinity;
      for (const q of town.places) {
        if (q === p) continue;
        // measure from the nearest point of q, so long thin places are reachable
        const qx = Math.max(q.x + 3, Math.min(cx, q.x + q.w - 3));
        const qy = Math.max(q.y + 3, Math.min(cy, q.y + q.h - 3));
        const along = (qx - cx) * dx + (qy - cy) * dy;
        const side = Math.abs((qx - cx) * dy) + Math.abs((qy - cy) * dx);
        const gap = dx ? (dx > 0 ? q.x - (p.x + p.w) : p.x - (q.x + q.w)) : dy > 0 ? q.y - (p.y + p.h) : p.y - (q.y + q.h);
        if (gap < -1 || along <= 0) continue;
        const d = gap * 2 + side * 1.5 + along * 0.2;
        if (d < bestD) {
          bestD = d;
          best = q;
        }
      }
      if (best) {
        st.at = best.id;
        M.audio.sfx('move');
      }
    }

    function notForSale(p) {
      return story.closed(p, st, town);
    }

    function act() {
      const p = cursor();
      const why = town.refusal(p, st.tool);
      if (why) {
        M.audio.sfx('error');
        toast(why === 'NOT FOR SALE' ? notForSale(p) : why, P.CREAM);
        // the story hears about offers on places that will not sell
        if (why === 'NOT FOR SALE') st.asked['offer_' + p.id] = (st.asked['offer_' + p.id] || 0) + 1;
        return;
      }
      const type = town.order(p, st.tool);
      if (type === 'build' && LEAVES[p.kind] && !p.moved) {
        p.moved = true;
        depart(p, LEAVES[p.kind]);
      }
    }

    function control() {
      for (const d in DIRS) if (I.repeat(d, 12, 6)) step(d);
      if (I.pressed('a')) act();
      if (I.pressed('sel') || I.pressed('r') || I.pressed('l')) {
        st.tool = st.tool === 'build' ? 'line' : 'build';
        M.audio.sfx('cursor');
      }
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

    function updateDrones(dt) {
      for (const d of drones) {
        const job = town.jobs.find((j) => j.drone === d.i);
        let tx = home.x + 8 + d.i * 7;
        let ty = T.MAP_Y + home.y + 10 + (d.i % 2) * 6;
        if (job) {
          const p = town.by[job.id];
          tx = p.x + p.w / 2 + Math.cos(t * 2 + d.i) * Math.min(6, p.w / 4);
          ty = T.MAP_Y + p.y + p.h / 2 - 6 + Math.sin(t * 2 + d.i) * 2;
        }
        const k = Math.min(1, dt * 4);
        d.x += (tx - d.x) * k;
        d.y += (ty - d.y) * k;
      }
    }

    const view = T.createView({
      st, town, story,
      ui: { t: () => t, runner: () => runner, pause: () => pause, pauseItems, cursor, drones: () => drones, moves: () => moves, toasts: () => toasts, notForSale },
    });

    return {
      name: 'town',
      enter() {
        view.prepare();
        if (M.audio.voicemail.loadClip) M.audio.voicemail.loadClip(story.voicemail(st).clip);
        M.audio.playMusic(st.flags.meeting ? 'townCold' : 'town');
      },
      exit() {
        M.dialog.close();
        M.audio.voicemail.stop();
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
        // the county keeps moving while people talk, but not before the chapter
        // has begun or while a picture is up
        if (!st.backdrop && !st.sandbox && st.flags.intro) town.update(dt);
        if (st.goalBlink > 0) st.goalBlink -= dt;
        updateDrones(dt);
        for (let i = moves.length - 1; i >= 0; i--) {
          const mv = moves[i];
          mv.t += dt;
          if (mv.t > mv.pack) mv.x += mv.dir * 34 * dt;
          if (mv.x < -16 || mv.x > T.MAP_W + 16) moves.splice(i, 1);
        }
        for (let i = toasts.length - 1; i >= 0; i--) {
          toasts[i].t += dt;
          if (toasts[i].t > 2.6) toasts.splice(i, 1);
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
        } else if (!st.sandbox) {
          control();
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
