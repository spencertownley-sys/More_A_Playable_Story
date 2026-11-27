// MORE. — end of chapter card
(function (M) {
  'use strict';

  const P = M.PAL;

  // opts: chapter, title, clips, access (what Pip has now), art (a sprite to
  // show under it; default Pip's drone portrait), nextSmall/nextBig, soon (the
  // next chapter isn't built yet), next (scene to go to; default the title).
  M.scenes.chapterEnd = function (opts) {
    opts = Object.assign(
      { chapter: 1, title: 'THE LINE', access: 'THE PAYROLL SERVER', nextSmall: 'CHAPTER 2', nextBig: 'THE FLOOR' },
      opts
    );
    const clips = opts.clips || 0;
    let t = 0;
    let shown = 0;
    let leaving = false;
    const lines = [
      { at: 0.6, y: 40, text: 'CHAPTER ' + opts.chapter, color: P.STEEL_DK },
      { at: 1.2, y: 54, text: opts.title, color: P.CREAM, scale: 2 },
      { at: 2.6, y: 94, text: 'CLIPS MADE', color: P.STEEL_DK },
      { at: 2.6, y: 106, count: true, color: P.WHITE },
      { at: 4.6, y: 134, text: 'PIP NOW HAS ACCESS TO', color: P.STEEL_DK },
      { at: 5.4, y: 146, text: opts.access, color: P.ORANGE },
      { at: 7.4, y: 248, text: 'NEXT: ' + opts.nextSmall + (opts.soon ? ' (COMING SOON)' : ''), color: P.STEEL_DK },
      { at: 7.4, y: 260, text: opts.nextBig, color: P.CREAM },
    ];

    return {
      name: 'chapterEnd',
      enter() {
        M.CAST.pip.portrait = 'pip2';
        M.audio.playMusic('end');
      },
      update(dt) {
        t += dt;
        const n = lines.filter((l) => t >= l.at).length;
        if (n > shown) {
          shown = n;
          M.audio.sfx('tick');
        }
        if (!leaving && t > 8.5 && (M.input.pressed('start') || M.input.pressed('a'))) {
          leaving = true;
          M.audio.sfx('confirm');
          M.go(opts.next || (() => M.scenes.title()), { out: 1.0 });
        }
      },
      draw() {
        const g = M.gfx;
        g.clear(P.INK);
        for (const l of lines) {
          if (t < l.at) continue;
          if (l.count) {
            const k = Math.min(1, (t - l.at) / 1.6);
            g.textCenter(Math.floor(clips * k).toLocaleString('en-US'), g.W / 2, l.y, l.color);
          } else {
            g.textCenter(l.text, g.W / 2, l.y, l.color, l.scale);
          }
        }
        // what Pip has now, shown for the first time
        if (t > 6.2) {
          const im = opts.art && g.art(opts.art);
          if (im && im.naturalWidth) g.ctx.drawImage(im, Math.round(g.W / 2 - im.width), 158, im.width * 2, im.height * 2);
          else M.drawPortrait('pip2', g.W / 2 - 26, 170, 52);
        }
        if (t > 8.5 && Math.floor(t * 2) % 2 === 0) g.textCenter('PRESS START', g.W / 2, 276, P.GRID);
      },
    };
  };
})(window.MORE = window.MORE || {});
