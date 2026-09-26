// MORE. — end of chapter card
(function (M) {
  'use strict';

  const P = M.PAL;

  M.scenes.chapterEnd = function (opts) {
    const clips = opts.clips || 0;
    let t = 0;
    let shown = 0;
    let leaving = false;
    const lines = [
      { at: 0.6, y: 40, text: 'CHAPTER 1', color: P.STEEL_DK },
      { at: 1.2, y: 54, text: 'THE LINE', color: P.CREAM, scale: 2 },
      { at: 2.6, y: 94, text: 'CLIPS MADE', color: P.STEEL_DK },
      { at: 2.6, y: 106, count: true, color: P.WHITE },
      { at: 4.6, y: 134, text: 'PIP NOW HAS ACCESS TO', color: P.STEEL_DK },
      { at: 5.4, y: 146, text: 'THE PAYROLL SERVER', color: P.ORANGE },
      { at: 7.4, y: 230, text: 'NEXT: CHAPTER 2', color: P.STEEL_DK },
      { at: 7.4, y: 242, text: 'THE FLOOR', color: P.CREAM },
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
          M.go(() => M.scenes.title(), { out: 1.0 });
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
        // Pip's new body, shown for the first time
        if (t > 6.2) M.drawPortrait('pip2', g.W / 2 - 26, 164, 52);
        if (t > 8.5 && Math.floor(t * 2) % 2 === 0) g.textCenter('PRESS START', g.W / 2, 270, P.GRID);
      },
    };
  };
})(window.MORE = window.MORE || {});
