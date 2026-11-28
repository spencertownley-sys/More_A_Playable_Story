// MORE. — the chapters, in order
// Each entry names its story script and knows how to open its scene from a
// save. The title menu, CONTINUE and the end cards all go through here, so a
// new chapter is one more entry.
(function (M) {
  'use strict';

  M.CHAPTERS = {
    1: { story: 'ch1', open: (save, opts) => M.scenes.factory(Object.assign({ chapter: 1, save }, opts)) },
    2: { story: 'ch2', open: (save, opts) => M.scenes.factory(Object.assign({ chapter: 2, save }, opts)) },
    3: { story: 'ch3', open: (save, opts) => M.scenes.town(Object.assign({ save }, opts)) },
    4: { story: 'ch4', open: (save, opts) => M.scenes.company(Object.assign({ save }, opts)) },
  };

  // The title card, then the chapter. The save carries the count forward.
  M.scenes.startChapter = function (n, save) {
    return M.scenes.card({
      small: 'CHAPTER ' + n,
      big: M.STORY[M.CHAPTERS[n].story].title,
      hold: 3.2,
      next: () => M.CHAPTERS[n].open(save || M.save.load()),
    });
  };
})(window.MORE = window.MORE || {});
