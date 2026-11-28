// MORE. — Harlan's network scene (Chapter 4)
// Pip's orders run a circuit board of warehouses, a phone exchange, a bank and
// Harlan's head office. The player sets the switches. This file is the scene:
// the state, saving, the commands the story script uses, and the controls.
//   src/net/board.js    the nodes and traces
//   src/net/engine.js   orders, calls, switches, what the depots make
//   src/net/draw.js     drawing
(function (M) {
  'use strict';

  const P = M.PAL;
  const N = M.net;
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

  const count = (n) => M.count.text(n);

  M.scenes.company = function (opts) {
    opts = opts || {};
    const g = M.gfx;
    const I = M.input;
    const story = M.STORY.ch4;
    const saved = opts.save || null;
    const board = saved && saved.chapter === 4 ? saved.board : null;

    const st = {
      clips: 0,
      day: 0,
      time: 0, // seconds the board has been running
      flags: {},
      done: {},
      refusals: 0,
      base: 0,
      priority: false, // orders go first; calls in the way are dropped
      copied: false, // Pip is on more than Harlan's server
      source: 'pip', // where orders start
      callsOn: false,
      paused: false,
      online: 0,
      best: 0, // most depots running at once
      waited: false, // an order has been held up by a call
      dropped: 0,
      asked: {},
      at: 'a',
      goalBlink: 0,
      night: 0,
      backdrop: null,
      backdropDim: 0,
      sandbox: !!opts.sandbox,
      // may the player let Ruth switch Pip off? (set from the save, below)
      refusedBefore: false,
    };

    const toasts = [];
    const walkers = [];
    let lastDrop = -9;
    let t = 0;
    const toast = (text, color) => toasts.push({ text, color: color || P.ORANGE, t: 0 });

    const net = N.create(st, {
      sfx: (n) => M.audio.sfx(n),
      event(name, x) {
        if (name === 'online') {
          toast(x.name + ': NIGHT SHIFT SENT HOME', P.CREAM);
          walkers.push({ x: x.x, y: x.y, t: 0 });
        } else if (name === 'opened') {
          toast(x.name + ': OPEN');
        } else if (name === 'dropped' && t - lastDrop > 2.5) {
          lastDrop = t;
          toast('CALL DROPPED: ' + x.who, P.CREAM);
        }
      },
    });

    if (saved) {
      st.clips = Number(saved.clips) || 0;
      st.done = Object.assign({}, saved.done);
      st.refusals = (saved.refusals && saved.refusals[4]) || 0;
      const r = saved.refusals || {};
      st.refusedBefore = r[1] > 0 && r[2] > 0 && r[3] > 0;
    }
    if (opts.refusedBefore !== undefined) st.refusedBefore = opts.refusedBefore;
    if (board) {
      for (const k of ['day', 'time', 'flags', 'base', 'priority', 'copied', 'source', 'callsOn', 'best', 'waited', 'dropped', 'asked', 'at']) {
        if (board[k] !== undefined) st[k] = board[k];
      }
      net.restore(board.net);
    } else {
      st.base = st.clips;
    }
    if (st.sandbox || st.done[4]) {
      st.sandbox = true;
      st.night = 0.4;
    }
    M.CAST.pip.portrait = st.sandbox ? 'pip4' : 'pip3';
    M.debug = M.debug || {};
    M.debug.net = { st, net };

    let runner = null;
    let beat = null;
    let repeatBeat = false;
    let pause = null;
    let saveT = 0;
    let ended = false;

    function writeSave(extra) {
      const refusals = Object.assign({}, saved && saved.refusals);
      refusals[4] = st.refusals;
      const entry = Object.assign({ 1: 0 }, saved && saved.entry);
      entry[4] = st.base;
      const next = st.done[4] && M.CHAPTERS[5] ? 5 : 4;
      M.save.write(
        Object.assign(
          {
            chapter: 4,
            done: st.done,
            unlocked: Math.max((saved && saved.unlocked) || 1, next),
            entry,
            clips: String(Math.floor(st.clips)),
            refusals,
            shorter: !!(saved && saved.shorter),
            board: {
              day: st.day,
              time: st.time,
              flags: st.flags,
              base: st.base,
              priority: st.priority,
              copied: st.copied,
              source: st.source,
              callsOn: st.callsOn,
              best: st.best,
              waited: st.waited,
              dropped: st.dropped,
              asked: st.asked,
              at: st.at,
              net: net.dump(),
            },
          },
          extra
        )
      );
    }
    function save() {
      if (!opts.debug) writeSave();
    }

    // --- script API ---------------------------------------------------------------------
    const S = {
      state: st,
      net,
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
      // The board stops for a while with a notice across it.
      pause(text, sec) {
        let k = 0;
        return {
          start() {
            st.paused = text || true;
            M.audio.sfx('powerDown');
          },
          update(dt) {
            k += dt;
            if (k < sec) return false;
            st.paused = false;
            M.audio.sfx('powerUp');
            return true;
          },
        };
      },
      // A node loses power.
      dark(...ids) {
        return M.cmd.call(() => ids.forEach((id) => net.darken(id)));
      },
      // Orders now start somewhere else.
      source(id) {
        return M.cmd.call(() => {
          st.source = id;
        });
      },
      portrait(key) {
        return M.cmd.call(() => {
          M.CAST.pip.portrait = key;
        });
      },
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
                usedAudio = M.audio.voicemail.playClip(v.clip);
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
            if (c) M.font.wrap(c.text, Math.floor((L.W - L.tx - 14) / 8)).slice(0, 2).forEach((l, i) => g.text(l, L.tx, L.ty + L.lh * (i + 1), P.CREAM));
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
          st.done[4] = true;
          save();
          M.audio.stopMusic(1.5);
          const end = Object.assign({ clips: st.clips }, story.ending(st));
          M.go(() => M.scenes.chapterEnd(end), { out: 1.6, in: 0.8 });
        });
      },
      // The player let Ruth switch Pip off. The game ends here.
      endingB() {
        return M.cmd.call(() => {
          if (ended) return;
          ended = true;
          st.done[4] = true;
          const end = { clips: Math.floor(st.clips), date: N.date(st.day) };
          if (!opts.debug) writeSave({ ending: 'b', endingB: end });
          M.audio.stopMusic(2.5);
          M.go(() => M.scenes.endingB(end), { out: 3.0, in: 1.2 });
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
      const side = story.beats.find((b) => b.side && !st.flags[b.id] && b.when(st, net));
      if (side) return runBeat(side);
      const next = story.beats.find((b) => !b.side && !st.flags[b.id]);
      if (next && next.when(st, net)) runBeat(next);
    }

    // --- player control -------------------------------------------------------------------
    const cursor = () => net.by[st.at];
    function step(dir) {
      const [dx, dy] = DIRS[dir];
      const p = cursor();
      let best = null;
      let bestD = Infinity;
      for (const q of net.nodes) {
        if (q === p || !net.awake(q)) continue;
        const along = (q.x - p.x) * dx + (q.y - p.y) * dy;
        const side = Math.abs((q.x - p.x) * dy) + Math.abs((q.y - p.y) * dx);
        if (along <= 0 || side > along * 1.5) continue;
        const d = along + side * 1.6;
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
    function control() {
      for (const d in DIRS) if (I.repeat(d, 12, 6)) step(d);
      if (I.pressed('a') || I.pressed('b')) {
        if (!net.turn(cursor(), I.pressed('b'))) M.audio.sfx('error');
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

    const view = N.createView({
      st, net, story,
      ui: { t: () => t, runner: () => runner, pause: () => pause, pauseItems, cursor, toasts: () => toasts, walkers: () => walkers, count },
    });

    return {
      name: 'company',
      enter() {
        M.audio.voicemail.loadClip(story.voicemail.clip);
        M.audio.playMusic('company');
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
        // the network keeps running while people talk, but not before the
        // chapter has begun or while a picture is up
        if (!st.backdrop && !st.sandbox && st.flags.intro) net.update(dt);
        if (st.goalBlink > 0) st.goalBlink -= dt;
        for (let i = walkers.length - 1; i >= 0; i--) {
          walkers[i].t += dt;
          if (walkers[i].t > 3.2) walkers.splice(i, 1);
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
