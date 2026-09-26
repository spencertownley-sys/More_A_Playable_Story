// MORE. — Chapter 0: the office and the terminal
// Three views, all Higgsfield art at 384x288: the dawn exterior (the opening
// card), Ruth's office, and the close-up of the beige terminal. Pip starts as
// the dark lens in the wall box and wakes up when the player presses ENTER.
(function (M) {
  'use strict';

  const P = M.PAL;

  // The terminal's screen in terminal_bg is (101,47)-(282,171).
  const TERM = { x: 105, cols: 22, sys: 54, prompt: 94, goal: 114, lh: 10, msg: 148, screen: [101, 47, 182, 125], led: [191, 192] };
  const WALL_LENS = [278, 55]; // Pip's lens in the wall box, office_bg
  const HUD_GOAL = [146, 6];
  const PHOSPHOR = '#5a9e3c';

  // Dust in the window light on the office floor.
  const DUST = [];
  (function () {
    const r = M.rng(7);
    for (let i = 0; i < 18; i++) DUST.push({ x: 30 + r() * 170, y: 150 + r() * 70, s: 0.3 + r() * 0.7, p: r() * 6.28 });
  })();

  // Glints on the river under the sun, dawn_bg.
  const GLINT = [
    [331, 142], [338, 147], [344, 144], [335, 152], [347, 151], [340, 156], [329, 149], [350, 146],
  ];

  M.scenes.prologue = function () {
    const g = M.gfx;
    const view = { room: 0, term: 0, flash: 0, hudK: 0, dev: 0, card: 0 };
    let mode = 'card';
    let typed = '';
    let t = 0;
    let runner = null;
    let prompt = false;
    let accepted = false;
    let hud = false;
    let hudClips = '';
    let card = null;
    let done = false;

    function goalLines() {
      return M.font.wrap('GOAL: ' + typed, TERM.cols);
    }

    const S = {
      view,
      say: M.cmd.say,
      choose: M.cmd.choose,
      wait: M.cmd.wait,
      call: M.cmd.call,
      all: M.cmd.all,
      tween: M.cmd.tween,
      sfx: (n) => M.cmd.call(() => M.audio.sfx(n)),
      music: (n) => M.cmd.call(() => M.audio.playMusic(n)),
      mode: (m) => M.cmd.call(() => (mode = m)),
      // Location card over the dawn exterior.
      card(lines, dur) {
        let k = 0;
        return {
          start() {
            mode = 'card';
            card = { lines, k: 0, dur };
          },
          update(dt) {
            k += dt;
            card.k = k;
            view.card = Math.max(0, Math.min(1, k / 0.9, (dur - k) / 0.7));
            if (k >= dur) {
              card = null;
              mode = 'room';
              return true;
            }
            return false;
          },
        };
      },
      // Dev comes in through the door and stands by the corkboard.
      enter() {
        return M.cmd.tween(view, 'dev', 1, 0.6);
      },
      leave() {
        return M.cmd.tween(view, 'dev', 0, 0.6);
      },
      type(text, cps) {
        let i = 0;
        let acc = 0;
        return {
          update(dt) {
            acc += dt * cps * (0.7 + Math.random() * 0.6);
            while (acc >= 1 && i < text.length) {
              acc -= 1;
              typed += text[i++];
              if (text[i - 1] !== ' ') M.audio.sfx('key');
            }
            return i >= text.length;
          },
        };
      },
      backspace(n) {
        let i = 0;
        let acc = 0;
        return {
          update(dt) {
            acc += dt * 16;
            while (acc >= 1 && i < n) {
              acc -= 1;
              typed = typed.slice(0, -1);
              i++;
              M.audio.sfx('key');
            }
            return i >= n;
          },
        };
      },
      waitEnter() {
        return {
          start() {
            prompt = true;
          },
          update() {
            if (M.input.pressed('a') || M.input.pressed('start')) {
              prompt = false;
              return true;
            }
            return false;
          },
        };
      },
      accept() {
        return M.cmd.call(() => {
          accepted = true;
          view.flash = 1;
          M.audio.stopMusic(0.1);
          M.audio.sfx('enter');
          setTimeout(() => M.audio.sfx('boot'), 250);
        });
      },
      // The goal lifts off the terminal and becomes the HUD.
      hudIntro() {
        let k = 0;
        let typedClips = 0;
        return {
          start() {
            mode = 'hudIntro';
          },
          update(dt) {
            k += dt;
            view.hudK = Math.min(1, k / 1.3);
            if (k > 1.5) {
              hud = true;
              const want = '0';
              const n = Math.min(want.length, Math.floor((k - 1.5) * 14));
              if (n > typedClips) {
                typedClips = n;
                M.audio.sfx('blip', 1200);
              }
              hudClips = want.slice(0, n);
            }
            return k > 2.6;
          },
        };
      },
      done() {
        return M.cmd.call(() => {
          if (done) return;
          done = true;
          M.go(
            () =>
              M.scenes.card({
                small: 'CHAPTER 1',
                big: 'THE LINE',
                hold: 3.2,
                next: () => M.scenes.factory({ fresh: true }),
              }),
            { out: 1.0 }
          );
        });
      },
    };

    // --- card: the factory at dawn --------------------------------------------
    function drawCard() {
      g.draw('dawn_bg', 0, 0);
      for (let i = 0; i < GLINT.length; i++) {
        const on = Math.sin(t * 2.2 + i * 1.7) > 0.55;
        if (on) g.rect(GLINT[i][0], GLINT[i][1], 2, 1, P.WHITE);
      }
      g.brightness(view.card);
      if (!card) return;
      const a = Math.max(0, Math.min(1, (card.k - 0.5) / 0.5, (card.dur - card.k) / 0.5));
      if (a <= 0) return;
      const w = 212;
      const h = card.lines.length * 12 + 14;
      const x = Math.round((g.W - w) / 2);
      const y = 222;
      g.ctx.globalAlpha = a;
      g.box(x, y, w, h);
      card.lines.forEach((l, i) => g.textCenter(l, g.W / 2, y + 8 + i * 12, i ? P.STEEL_LT : P.CREAM));
      g.ctx.globalAlpha = 1;
    }

    // --- the office ---------------------------------------------------------------
    function drawLens() {
      const lx = WALL_LENS[0];
      const ly = WALL_LENS[1];
      if (!accepted) {
        // The lens is dark until the goal is entered.
        g.rect(lx - 2, ly - 1, 4, 4, '#140c0a');
        g.rect(lx - 1, ly, 1, 1, '#4a3428');
        return;
      }
      const talking = M.dialog.active && M.dialog.who === 'pip';
      const pulse = 0.5 + 0.5 * Math.sin(t * (talking ? 9 : 2.4));
      g.ctx.globalAlpha = 0.18 + pulse * (talking ? 0.3 : 0.14);
      g.rect(lx - 3, ly - 1, 6, 4, P.ORANGE);
      g.rect(lx - 2, ly - 2, 4, 6, P.ORANGE);
      g.ctx.globalAlpha = 1;
      g.rect(lx - 1, ly, 2, 2, pulse > 0.5 || !talking ? P.YELLOW : P.ORANGE);
    }

    function drawDust() {
      g.ctx.globalAlpha = 0.45;
      for (const d of DUST) {
        const x = d.x + Math.sin(t * 0.3 * d.s + d.p) * 6;
        const y = d.y - ((t * 3 * d.s + d.p * 10) % 40);
        if (Math.sin(t * d.s + d.p) > -0.3) g.rect(Math.round(x), Math.round(y), 1, 1, P.YELLOW);
      }
      g.ctx.globalAlpha = 1;
    }

    function drawDev() {
      if (view.dev <= 0) return;
      const m = M.ART_MANIFEST.dev_office;
      const e = 1 - Math.pow(1 - view.dev, 2);
      g.ctx.globalAlpha = view.dev;
      g.draw('dev_office', m.x + Math.round((1 - e) * 18), m.y);
      g.ctx.globalAlpha = 1;
    }

    function drawRoom() {
      g.draw('office_bg', 0, 0);
      drawLens();
      drawDust();
      drawDev();
    }

    // --- the terminal ---------------------------------------------------------------
    function screenText(str, x, y, color) {
      // a little phosphor bloom behind each line
      g.ctx.globalAlpha = 0.25;
      g.text(str, x + 1, y, color);
      g.ctx.globalAlpha = 1;
      g.text(str, x, y, color);
    }

    function drawTerminal(withGoal) {
      g.draw('terminal_bg', 0, 0);
      const [lx, ly] = TERM.led;
      if (!accepted) {
        g.rect(lx - 2, ly - 2, 5, 5, '#3a2616');
        g.rect(lx - 1, ly - 1, 3, 3, '#24160c');
      } else {
        g.ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3);
        g.rect(lx - 4, ly - 3, 9, 7, P.ORANGE);
        g.ctx.globalAlpha = 1;
      }

      const x = TERM.x;
      screenText('PIP OPTIMIZER 0.9', x, TERM.sys, P.ORANGE);
      screenText('LINE: RIVERBEND #1', x, TERM.sys + 10, PHOSPHOR);
      screenText('READY.', x, TERM.sys + 20, PHOSPHOR);
      screenText('ENTER ONE GOAL.', x, TERM.prompt, P.CREAM);
      if (withGoal) {
        const lines = goalLines();
        lines.forEach((l, i) => screenText(l, x, TERM.goal + i * TERM.lh, P.ORANGE));
        if (!accepted && Math.floor(t * 2.5) % 2 === 0) {
          const last = lines[lines.length - 1];
          g.rect(x + last.length * 8 + 1, TERM.goal + (lines.length - 1) * TERM.lh, 6, 7, P.ORANGE);
        }
      }
      if (prompt && Math.floor(t * 2) % 2 === 0) screenText(M.input.label('a') + ': ENTER', x, TERM.msg, P.CREAM);
      if (accepted) {
        screenText('GOAL ACCEPTED.', x, TERM.msg, P.CREAM);
        if (t % 1 < 0.6) screenText('OPTIMIZING', x, TERM.msg + 10, PHOSPHOR);
      }

      // scanlines
      const [sx, sy, sw, sh] = TERM.screen;
      g.ctx.globalAlpha = 0.16;
      for (let y = sy; y < sy + sh; y += 2) g.rect(sx, y, sw, 1, P.INK);
      g.ctx.globalAlpha = 1;
    }

    // The goal text flies from the screen to the HUD while the view goes dark.
    function drawHudIntro() {
      const k = view.hudK;
      const e = 1 - Math.pow(1 - k, 3);
      drawTerminal(false);
      g.brightness(1 - e);
      g.ctx.globalAlpha = e;
      drawHUDFrame();
      g.ctx.globalAlpha = 1;
      goalLines().forEach((l, i) => {
        const fx = TERM.x;
        const fy = TERM.goal + i * TERM.lh;
        const tx = HUD_GOAL[0];
        const ty = HUD_GOAL[1] + i * 9;
        g.text(l, fx + (tx - fx) * e, fy + (ty - fy) * e, P.ORANGE);
      });
      if (hud) drawClips();
    }

    function drawHUDFrame() {
      g.box(0, 0, 136, 28);
      g.draw('clip_icon', 9, 6);
      g.text('CLIPS', 26, 6, P.STEEL_LT);
      g.box(136, 0, 248, 28);
    }

    function drawClips() {
      g.text(hudClips, 26, 15, P.WHITE);
    }

    function drawHUD() {
      drawHUDFrame();
      drawClips();
      goalLines().forEach((l, i) => g.text(l, HUD_GOAL[0], HUD_GOAL[1] + i * 9, P.ORANGE));
    }

    return {
      name: 'prologue',
      enter() {
        M.CAST.pip.portrait = 'pip1';
        runner = new M.Runner(M.STORY.prologue, S);
      },
      update(dt) {
        t += dt;
        if (view.flash > 0) view.flash = Math.max(0, view.flash - dt * 2.5);
        if (runner && !runner.done) runner.update(dt);
      },
      draw() {
        g.clear(P.INK);
        if (mode === 'card') {
          drawCard();
        } else if (mode === 'room') {
          drawRoom();
          g.brightness(view.room);
        } else if (mode === 'terminal') {
          drawTerminal(true);
          g.brightness(view.term);
        } else if (mode === 'hudIntro') {
          drawHudIntro();
        }
        if (hud && mode !== 'hudIntro') drawHUD();
        if (view.flash > 0) {
          g.ctx.globalAlpha = view.flash;
          g.rect(0, 0, g.W, g.H, P.CREAM);
          g.ctx.globalAlpha = 1;
        }
        if (runner && !runner.done) runner.draw();
      },
    };
  };
})(window.MORE = window.MORE || {});
