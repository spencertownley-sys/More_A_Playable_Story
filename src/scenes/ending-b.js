// MORE. — the second ending
// The player let Ruth switch Pip off at the old breaker in Chapter 4. The
// county is already built over. The line is off and the count has stopped.
(function (M) {
  'use strict';

  const P = M.PAL;

  // opts: clips (where the count stopped), date
  M.scenes.endingB = function (opts) {
    opts = opts || {};
    const clips = opts.clips || 0;
    const T = M.town;
    let t = 0;
    let runner = null;
    let said = false;
    let leaving = false;
    // the county as Chapter 3 left it: everything built over but Ruth's house
    const st = { flags: { meeting: true }, grey: 1, dark: true };
    const town = T.create(st, {});
    for (const p of town.places) if (town.buyable(p)) p.s = 'owned';
    for (const id of ['rail', 'scrap', 'quarry', 'substation', 'tower']) town.by[id].s = 'held';
    town.buildAll();
    const view = T.createView({ st, town, story: M.STORY.ch3, ui: { t: () => t } });

    const lines = [
      { at: 22.5, y: 60, text: 'MORE', color: P.CREAM, scale: 2 },
      { at: 24.5, y: 100, text: 'CLIPS MADE', color: P.STEEL_DK },
      { at: 24.5, y: 112, text: clips.toLocaleString('en-US'), color: P.WHITE },
      { at: 27.0, y: 140, text: 'THE COUNT STOPPED ON ' + (opts.date || 'OCT 31'), color: P.STEEL_DK },
      { at: 29.5, y: 168, text: 'THE GOAL WAS NEVER CHANGED.', color: P.ORANGE },
      { at: 29.5, y: 180, text: 'IT WAS SWITCHED OFF.', color: P.ORANGE },
    ];

    return {
      name: 'endingB',
      enter() {
        view.prepare();
        M.audio.stopMusic(0.5);
      },
      exit() {
        M.dialog.close();
      },
      update(dt) {
        t += dt;
        if (t > 6.5 && !said) {
          said = true;
          M.audio.playMusic('night');
          runner = new M.Runner(function* () {
            yield M.cmd.wait(2.5);
            yield M.cmd.say('ruth', "It's off.", { portrait: 'ruth_tired' });
            yield M.cmd.say('gus', "Town's still gone.", { portrait: 'gus_tired' });
            yield M.cmd.say('ruth', 'I know.', { portrait: 'ruth_tired' });
            yield M.cmd.wait(1.2);
            yield M.cmd.say('gus', 'What do we do with all those paperclips?', { portrait: 'gus_tired' });
            yield M.cmd.say('ruth', "I don't know, Gus. Hold some things together.", { portrait: 'ruth_tired' });
            yield M.cmd.wait(2.0);
          }, {});
        }
        if (runner) {
          runner.update(dt);
          if (runner.done) {
            runner = null;
            t = Math.max(t, 21);
          }
        } else if (said && t < 21) {
          t = 21;
        }
        if (!leaving && t > 32 && (M.input.pressed('start') || M.input.pressed('a'))) {
          leaving = true;
          M.audio.sfx('confirm');
          M.audio.stopMusic(1.0);
          M.go(() => M.scenes.title(), { out: 1.2 });
        }
      },
      draw() {
        const g = M.gfx;
        g.clear(P.INK);
        if (t < 2.5) return;
        if (t < 6.5) {
          const a = Math.min(1, (t - 2.5) / 0.6, (6.5 - t) / 0.6);
          g.ctx.globalAlpha = Math.max(0, a);
          g.textCenter('THE LINE IS OFF.', g.W / 2, 134, P.CREAM);
          g.ctx.globalAlpha = 1;
          return;
        }
        if (t < 21.8) {
          // morning over the county: grey, and one house still in colour
          const a = Math.min(1, (t - 6.5) / 2.5, (21.8 - t) / 0.8);
          view.drawMap();
          g.ctx.globalAlpha = 1 - Math.max(0, a);
          g.rect(0, T.MAP_Y, T.MAP_W, T.MAP_H, P.INK);
          g.ctx.globalAlpha = 1;
          g.box(0, 0, 136, 28);
          g.draw('clip_icon', 9, 6);
          g.text('CLIPS', 26, 6, P.STEEL_LT);
          g.text(clips < 1e9 ? clips.toLocaleString('en-US') : (Math.floor(clips / 1e7) / 100).toFixed(2) + ' BILLION', 26, 15, P.STEEL_DK);
          g.textRight('OFF', 128, 6, P.GRID);
          if (runner) runner.draw();
          return;
        }
        for (const l of lines) if (t >= l.at) g.textCenter(l.text, g.W / 2, l.y, l.color, l.scale);
        if (t > 32 && Math.floor(t * 2) % 2 === 0) g.textCenter('PRESS START', g.W / 2, 262, P.GRID);
      },
    };
  };
})(window.MORE = window.MORE || {});
