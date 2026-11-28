// MORE. — the factory floor: sizes, directions and what each machine does
// Shared by the belt engine (engine.js), the drawing code (draw.js), the
// chapter floors (chapters.js) and the scene (scenes/factory.js).
(function (M) {
  'use strict';

  const CELL = 32;
  const HALF = CELL / 2;
  const WALL_Y = 28; // top of the brick wall band (below the HUD)
  const FLOOR_Y = 68; // where the wall meets the floor
  const FEET_Y = 207; // baseline for people standing beside the line
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const DIRBTN = ['up', 'right', 'down', 'left'];
  const opp = (d) => (d + 2) % 4;

  const BELT_SPEED = 2.0; // cells per second
  const GAP = 0.45; // minimum spacing between items, in cells

  // base: which old machine a newer one stands in for (for jam hints).
  // worker: a hand bench only runs while that person is at it.
  const MACH = {
    spool: { name: 'SPOOL', art: 'spool', period: 0.5, makes: 'wire', info: 'SPOOL: MAKES WIRE' },
    cutter: { name: 'CUTTER', art: 'cutter', period: 0.5, takes: 'wire', makes: 'cut', info: 'CUTTER: WIRE > PIECES' },
    bender: { name: 'BENDER', art: 'bender', period: 0.8, takes: 'cut', makes: 'clip', info: 'BENDER: PIECES > CLIPS' },
    box: { name: 'BIN', art: 'bin', sink: true, takes: 'clip', info: 'BIN: COUNTS CLIPS' },
    // Chapter 2: the new steel machines
    spool2: { name: 'NEW SPOOL', art: 'spool2', base: 'spool', modern: true, period: 0.3, makes: 'wire', info: 'NEW SPOOL: MAKES WIRE' },
    cutter2: { name: 'NEW CUTTER', art: 'cutter2', base: 'cutter', modern: true, period: 0.3, takes: 'wire', makes: 'cut', info: 'NEW CUTTER: WIRE > PIECES' },
    bender2: { name: 'NEW BENDER', art: 'bender2', base: 'bender', modern: true, period: 0.4, takes: 'cut', makes: 'clip', info: 'NEW BENDER: PIECES > CLIPS' },
    bin2: { name: 'NEW BIN', art: 'bin2', base: 'box', modern: true, sink: true, takes: 'clip', info: 'NEW BIN: COUNTS CLIPS' },
    // Chapter 2: Marisol's crew, working by hand
    bench_cut: { name: "TOMAS'S BENCH", art: 'bench_cut', base: 'cutter', worker: 'tomas', period: 1.8, takes: 'wire', makes: 'cut', info: 'TOMAS CUTS WIRE BY HAND' },
    bench_bend: { name: "BEA'S BENCH", art: 'bench_bend', base: 'bender', worker: 'bea', period: 2.4, takes: 'cut', makes: 'clip', info: 'BEA BENDS CLIPS BY HAND' },
    bench_pack: { name: "OTIS'S TABLE", art: 'bench_pack', base: 'box', worker: 'otis', sink: true, period: 0.9, takes: 'clip', info: 'OTIS PACKS CLIPS BY HAND' },
  };

  M.factory = { CELL, HALF, WALL_Y, FLOOR_Y, FEET_Y, DX, DY, DIRBTN, opp, BELT_SPEED, GAP, MACH };
})(window.MORE = window.MORE || {});
