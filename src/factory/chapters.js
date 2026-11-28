// MORE. — the factory floor: each chapter's room
// Grid size, where the machines start, the props on the wall and which story
// script runs there. To add a floor, add an entry here and a script in
// src/story/.
(function (M) {
  'use strict';

  // Where the old line's machines sit.
  const START_LAYOUT = [
    ['spool', 0, 0],
    ['cutter', 4, 1],
    ['bender', 2, 3],
    ['box', 7, 3],
  ];

  const MOCK_BELTS = [
    [1, 0, 1], [2, 0, 2], [2, 1, 1], [3, 1, 1], [5, 1, 2], [5, 2, 3], [4, 2, 3], [3, 2, 3], [2, 2, 3],
    [1, 2, 3], [0, 2, 2], [0, 3, 1], [1, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 1], [6, 3, 1],
  ];

  // Chapter 2: two lines across the whole floor. Pip's old line runs along
  // the top; Marisol's crew works the second line by hand.
  const FLOOR_LAYOUT = [
    ['spool', 0, 0],
    ['cutter', 2, 0],
    ['bender', 4, 0],
    ['box', 6, 0],
    ['spool', 0, 2],
    ['bench_cut', 2, 2],
    ['bench_bend', 5, 2],
    ['bench_pack', 8, 2],
  ];
  const FLOOR_BELTS = [
    [1, 0, 1],
    [3, 0, 1],
    [5, 0, 1],
  ];

  const CHAPTERS = {
    1: {
      id: 1,
      story: 'ch1',
      cols: 8,
      rows: 4,
      gx: 64,
      gy: 76,
      spots: [42, 22, 2], // standing spots left of the grid, nearest first
      layout: START_LAYOUT,
      belts: [],
      start: [2, 1],
      props: [['window', 14, -36], ['board', 98, -34], ['panel', 240, -36], ['door', 334, -37], ['coffee', 338, 2], ['pallet', 336, 98]],
    },
    2: {
      id: 2,
      story: 'ch2',
      cols: 10,
      rows: 4,
      gx: 56,
      gy: 76,
      spots: [32, 14, -2],
      layout: FLOOR_LAYOUT,
      belts: FLOOR_BELTS,
      start: [3, 1],
      props: [['window', 14, -36], ['board', 98, -34], ['panel', 240, -36], ['door', 334, -37]],
      beacon: { x: 286, y: -35 },
    },
  };
  const TERMINAL = { x: 172, y: 36 }; // Pip's wall box

  Object.assign(M.factory, { CHAPTERS, MOCK_BELTS, TERMINAL });
})(window.MORE = window.MORE || {});
