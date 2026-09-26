// MORE. — boot screen, voicemail cold open, title, title cards
// These run at 384x288 on the Higgsfield backgrounds (see tools/art/build.py).
(function (M) {
  'use strict';

  const P = M.PAL;
  const G = () => M.gfx;

  // Small deterministic RNG so starfields look the same every time.
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function route(start) {
    switch (start) {
      case 'title':
        return M.scenes.title();
      case 'prologue':
        return M.scenes.prologue();
      case 'factory':
        return M.scenes.factory({ fresh: true });
      case 'night':
        return M.scenes.factory({ debugNight: true });
      case 'end':
        return M.scenes.chapterEnd({ clips: 1024 });
      case 'sandbox':
        return M.scenes.factory({ sandbox: true });
      case 'mockup':
        return M.scenes.factory({ mockup: true });
      default:
        return M.scenes.coldOpen();
    }
  }

  // Text with a 1px dark drop shadow, for reading over busy art.
  function shadowText(str, x, y, color, center) {
    const g = G();
    const f = center ? g.textCenter : g.text;
    f(str, x + 1, y + 1, P.SHADOW);
    f(str, x, y, color);
  }

  // --- boot: "press start" (browsers need a gesture before audio) ------------
  M.scenes.boot = function (start) {
    let t = 0;
    return {
      name: 'boot',
      update(dt) {
        t += dt;
        if (t > 0.3 && (M.input.any || M.pointerTapped)) {
          M.pointerTapped = false;
          M.audio.unlock();
          M.audio.sfx('confirm');
          M.go(() => route(start), { out: 0.5 });
        }
      },
      draw() {
        const g = G();
        const cx = g.W / 2;
        g.clear(P.INK);
        if (Math.floor(t * 2) % 2 === 0) g.textCenter('PRESS START', cx, 96, P.CREAM);
        g.textCenter('HEADPHONES ON', cx, 112, P.GRID);
        const rows = [
          ['ARROWS', 'MOVE'],
          ['Z', 'A  CONFIRM'],
          ['X', 'B  BACK'],
          ['SHIFT', 'SELECT'],
          ['ENTER', 'START'],
        ];
        rows.forEach((r, i) => {
          g.textRight(r[0], cx - 12, 150 + i * 12, P.STEEL_DK);
          g.text(r[1], cx + 4, 150 + i * 12, P.STEEL_LT);
        });
        g.textCenter('M MUTE   F FULLSCREEN', cx, 226, P.GRID);
        g.textCenter("AFTER NICK BOSTROM'S PAPERCLIP MAXIMIZER", cx, 262, P.FLOOR);
      },
    };
  };

  // --- cold open: the voicemail over the finished Earth ---------------------------
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  M.scenes.coldOpen = function () {
    const V = M.VOICEMAIL;
    const r = rng(3);
    const twinkles = Array.from({ length: 40 }, () => ({ x: Math.floor(r() * 384), y: Math.floor(r() * 150), p: r() * 6 }));
    let t = 0;
    let phase = 'ring';
    let playT = 0;
    let usedAudio = false;
    let waitT = 0;
    let endT = 0;
    let beeps = 0;

    function finish() {
      M.audio.voicemail.stop();
      phase = 'done';
      M.go(() => M.scenes.title(), { out: 1.4, in: 1.0 });
    }

    return {
      name: 'coldOpen',
      update(dt) {
        t += dt;
        if (phase !== 'done' && t > 0.5 && M.input.pressed('start')) {
          finish();
          return;
        }
        if (phase === 'ring') {
          if (beeps === 0 && t > 0.8) {
            M.audio.sfx('phoneBeep');
            beeps++;
          }
          if (beeps === 1 && t > 1.4) {
            M.audio.sfx('phoneBeep');
            beeps++;
          }
          if (t > 2.6) phase = 'wait';
        } else if (phase === 'wait') {
          waitT += dt;
          if (M.audio.voicemail.ready && M.audio.voicemail.play()) {
            usedAudio = true;
            phase = 'play';
          } else if (waitT > 2.5) {
            phase = 'play';
          }
        } else if (phase === 'play') {
          playT = usedAudio ? M.audio.voicemail.time : playT + dt;
          if (playT > V.duration + 0.3) {
            phase = 'after';
            endT = 0;
          }
        } else if (phase === 'after') {
          endT += dt;
          if (endT > 2.2) finish();
        }
      },

      draw() {
        const g = G();
        const W = g.W;
        g.clear(P.INK);
        g.draw('earth_bg', 0, 0);
        for (const s of twinkles) {
          if (Math.floor(t * 1.5 + s.p) % 6 === 0) g.rect(s.x, s.y, 1, 1, P.WHITE);
        }
        // darken the lower third so the phone and captions read
        g.ctx.globalAlpha = 0.62;
        g.rect(0, 168, W, 120, P.INK);
        g.ctx.globalAlpha = 1;

        // phone card
        const cw = 216;
        const x = Math.round((W - cw) / 2);
        const y = 178;
        g.box(x, y, cw, 38);
        g.text('VOICEMAIL', x + 9, y + 8, P.STEEL_LT);
        g.textRight(V.from, x + cw - 9, y + 8, P.CREAM);
        const dur = V.duration;
        const cur = phase === 'play' ? playT : phase === 'after' || phase === 'done' ? dur : 0;
        if (phase === 'ring' || phase === 'wait') {
          if (Math.floor(t * 2.5) % 2 === 0) g.text('1 NEW MESSAGE', x + 9, y + 22, P.ORANGE);
        } else {
          g.text(fmtTime(cur), x + 9, y + 22, P.CREAM);
          const bx = x + 50;
          const bw = cw - 104;
          g.rect(bx, y + 25, bw, 2, P.GRID);
          const fw = Math.round((bw * Math.min(cur, dur)) / dur);
          g.rect(bx, y + 25, fw, 2, P.ORANGE);
          g.rect(bx + fw - 1, y + 23, 3, 6, P.YELLOW);
          g.textRight(fmtTime(dur), x + cw - 9, y + 22, P.STEEL_DK);
        }

        // captions
        if (phase === 'play') {
          let cap = null;
          for (const c of V.captions) if (playT >= c.t && playT < c.end + 0.25) cap = c;
          if (cap) {
            const n = Math.floor((playT - cap.t) * 45);
            const lines = M.font.wrap(cap.text, 40);
            let left = n;
            lines.forEach((l, i) => {
              const shown = l.slice(0, Math.max(0, left));
              left -= l.length;
              shadowText(shown, W / 2 - (l.length * 8) / 2, 232 + i * 12, P.CREAM);
            });
          }
        }
        if (phase !== 'done' && t > 3) g.textRight('START SKIP', W - 6, g.H - 12, P.GRID);
      },
    };
  };

  // --- title ------------------------------------------------------------------------
  M.scenes.title = function () {
    let t = 0;
    let sel = 0;
    let menu = false;
    let confirming = false;
    let confirmSel = 1;
    const save = M.save.load();
    const items = () => [
      { id: 'new', label: 'NEW GAME' },
      { id: 'cont', label: 'CONTINUE', off: !save },
      { id: 'sound', label: 'SOUND ' + (M.audio.muted ? 'OFF' : 'ON') },
    ];
    if (save) sel = 1;

    function begin() {
      M.save.clear();
      M.audio.stopMusic(0.8);
      M.go(() => M.scenes.prologue(), { out: 0.8 });
    }

    function cont() {
      M.audio.stopMusic(0.8);
      const s = M.save.load();
      if (s && s.chapter1Done) M.go(() => M.scenes.factory({ sandbox: true, save: s }), { out: 0.8 });
      else if (s && s.chapter === 1) M.go(() => M.scenes.factory({ save: s }), { out: 0.8 });
      else M.go(() => M.scenes.prologue(), { out: 0.8 });
    }

    return {
      name: 'title',
      enter() {
        M.audio.playMusic('title');
      },
      update(dt) {
        t += dt;
        const I = M.input;
        if (!menu) {
          if (t > 0.6 && (I.pressed('start') || I.pressed('a'))) {
            menu = true;
            M.audio.sfx('confirm');
          }
          return;
        }
        if (confirming) {
          if (I.repeat('left') || I.repeat('right') || I.repeat('up') || I.repeat('down')) {
            confirmSel = 1 - confirmSel;
            M.audio.sfx('cursor');
          }
          if (I.pressed('b')) {
            confirming = false;
            M.audio.sfx('cancel');
          }
          if (I.pressed('a') || I.pressed('start')) {
            if (confirmSel === 0) {
              M.audio.sfx('confirm');
              begin();
            } else {
              confirming = false;
              M.audio.sfx('cancel');
            }
          }
          return;
        }
        const list = items();
        if (I.pressed('b')) {
          menu = false;
          M.audio.sfx('cancel');
          return;
        }
        if (I.repeat('up')) {
          do sel = (sel + list.length - 1) % list.length;
          while (list[sel].off);
          M.audio.sfx('cursor');
        }
        if (I.repeat('down')) {
          do sel = (sel + 1) % list.length;
          while (list[sel].off);
          M.audio.sfx('cursor');
        }
        if (I.pressed('a') || I.pressed('start')) {
          const it = list[sel];
          if (it.id === 'new') {
            if (save) {
              confirming = true;
              confirmSel = 1;
              M.audio.sfx('cursor');
            } else {
              M.audio.sfx('confirm');
              begin();
            }
          } else if (it.id === 'cont') {
            M.audio.sfx('confirm');
            cont();
          } else if (it.id === 'sound') {
            M.audio.setMuted(!M.audio.muted);
            M.audio.sfx('cursor');
          }
        }
      },
      draw() {
        const g = G();
        const W = g.W;
        g.draw('title_bg', 0, 0);
        // the full stop after MORE, blinking like a cursor
        if (t % 1.1 < 0.7) {
          g.rect(300, 55, 10, 10, P.SHADOW);
          g.rect(301, 56, 8, 8, P.ORANGE);
          g.rect(301, 56, 8, 2, P.YELLOW);
        }

        if (!menu) {
          if (Math.floor(t * 2) % 2 === 0) shadowText('PRESS START', W / 2, 262, P.CREAM, true);
          return;
        }
        const list = items();
        const bw = 132;
        const bh = list.length * 14 + 14;
        const bx = Math.round((W - bw) / 2);
        const by = 284 - bh;
        g.box(bx, by, bw, bh);
        list.forEach((it, i) => {
          const y = by + 9 + i * 14;
          const on = i === sel && !confirming;
          const col = it.off ? P.GRID : on ? P.ORANGE : P.CREAM;
          if (on) g.text('▶', bx + 12, y, P.ORANGE);
          g.text(it.label, bx + 26, y, col);
        });

        if (confirming) {
          const cw = 176;
          const cx = Math.round((W - cw) / 2);
          g.box(cx, 110, cw, 58);
          g.textCenter('ERASE SAVE AND', W / 2, 121, P.CREAM);
          g.textCenter('START OVER?', W / 2, 132, P.CREAM);
          ['YES', 'NO'].forEach((l, i) => {
            const x = i === 0 ? W / 2 - 44 : W / 2 + 20;
            if (i === confirmSel) g.text('▶', x - 12, 148, P.ORANGE);
            g.text(l, x, 148, i === confirmSel ? P.ORANGE : P.CREAM);
          });
        }
      },
    };
  };

  // --- title card ("CHAPTER 1 / THE LINE") --------------------------------------------
  M.scenes.card = function (opts) {
    let t = 0;
    let leaving = false;
    return {
      name: 'card',
      enter() {
        if (opts.sfx) M.audio.sfx(opts.sfx);
      },
      update(dt) {
        t += dt;
        if (leaving) return;
        if (t > (opts.hold || 3) || (t > 0.8 && M.input.pressed('a'))) {
          leaving = true;
          M.go(opts.next, { out: 0.6 });
        }
      },
      draw() {
        const g = G();
        const cx = g.W / 2;
        g.clear(P.INK);
        if (opts.small) g.textCenter(opts.small, cx, 118, P.STEEL_DK);
        if (opts.big && t > 0.4) g.textCenter(opts.big, cx, 134, P.CREAM, 2);
        if (opts.sub && t > 1.0) g.textCenter(opts.sub, cx, 164, P.ORANGE);
      },
    };
  };

  M.rng = rng;
  M.shadowText = shadowText;
})(window.MORE = window.MORE || {});
