// MORE. — the planet engine (Chapter 5)
// The world as a grid of 15-degree cells: sea, open land, cities, ice. A seed
// that lands on land takes that cell and plants a spire; taken land then
// creeps outward into its neighbours by itself. Nothing in here draws, reads
// input, or knows the planet is round on screen.
//
//   const world = M.world.create(st, M.WORLD_GRID, { sfx, event, random });
//
// st is the scene's state. The engine reads cities (may cities be taken?) and
// grid (is the power still going to them?) from it, and writes clips, charge
// and the counts of what has been taken.
(function (M) {
  'use strict';

  const CELL = 15; // degrees
  // The numbers that set the chapter's pace.
  const TUNE = {
    recharge: 6, // seconds between throws from one spire; more spires, shorter
    flight: 1.4, // seconds a seed is in the air
    take: 2.5, // seconds for a cell to go grey
    creep: 75, // seconds before taken land takes a neighbour
    base: 1e10, // clips a second at the start
    pow: 7.6, // tenfold steps in the rate by the time all the land is taken
    turn: 38, // seconds for the planet to turn once
  };

  M.world = { CELL, TUNE };

  M.world.create = function (st, grid, hooks) {
    const sfx = (hooks && hooks.sfx) || (() => {});
    const event = (hooks && hooks.event) || (() => {});
    const random = (hooks && hooks.random) || Math.random;
    const COLS = grid.rows[0].length;
    const ROWS = grid.rows.length;
    const KIND = { '.': 'sea', '#': 'land', C: 'city', i: 'ice' };

    const cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        cells.push({ i: r * COLS + c, c, r, kind: KIND[grid.rows[r][c]], taken: false, p: 0, spire: false, lit: true, creepT: random() * TUNE.creep });
      }
    }
    const at = (c, r) => (r < 0 || r >= ROWS ? null : cells[r * COLS + (((c % COLS) + COLS) % COLS)]);
    const around = (cell) => [at(cell.c + 1, cell.r), at(cell.c - 1, cell.r), at(cell.c, cell.r + 1), at(cell.c, cell.r - 1)].filter(Boolean);
    const isLand = (cell) => cell.kind === 'land' || cell.kind === 'city';
    const landAll = cells.filter(isLand).length;
    const landOpen = cells.filter((x) => x.kind === 'land').length;
    // Strings of lights: people leaving a place that has been taken.
    const people = [];
    const world = { cells, at, COLS, ROWS, people, landAll, landOpen };

    // The cell under a longitude and latitude in degrees.
    world.cellAt = (lon, lat) => at(Math.floor((((lon + 180) % 360) + 360) % 360 / CELL), Math.max(0, Math.min(ROWS - 1, Math.floor((90 - lat) / CELL))));
    // The middle of a cell.
    world.centre = (cell) => [cell.c * CELL - 180 + CELL / 2, 90 - cell.r * CELL - CELL / 2];

    // What a seed landing there would find.
    function verdict(cell) {
      if (!cell || cell.kind === 'sea') return 'sea';
      if (cell.kind === 'ice') return 'ice';
      if (cell.taken) return 'taken';
      if (cell.kind === 'city' && !st.cities) return 'spared';
      return cell.kind;
    }
    world.verdict = verdict;

    function leave(cell) {
      // people head for the nearest land that is still theirs
      let best = null;
      let bestD = 1e9;
      for (const q of cells) {
        if (!isLand(q) || q.taken) continue;
        const dx = Math.min(Math.abs(q.c - cell.c), COLS - Math.abs(q.c - cell.c));
        const d = dx * dx + (q.r - cell.r) * (q.r - cell.r);
        if (d < bestD) {
          bestD = d;
          best = q;
        }
      }
      people.push({ from: cell.i, to: best ? best.i : cell.i, t: 0, dur: 6 + Math.sqrt(bestD) * 5, stopped: !st.grid });
    }

    function take(cell, seeded) {
      cell.taken = true;
      cell.creepT = TUNE.creep * (0.6 + random() * 0.8);
      if (seeded) cell.spire = true;
      if (cell.kind === 'city') {
        cell.lit = false;
        event('city', cell);
        leave(cell);
        leave(cell);
      } else if (random() < 0.4) {
        leave(cell);
      }
      event(seeded ? 'seeded' : 'crept', cell);
    }

    // A seed comes down on a cell. Returns what happened.
    world.land = function (cell) {
      const v = verdict(cell);
      if (v === 'land' || v === 'city') {
        take(cell, true);
        sfx('place');
      } else {
        sfx(v === 'sea' ? 'cancel' : 'error');
      }
      return v;
    };

    // The spire is ready to throw.
    world.ready = () => st.charge >= 1;
    world.spend = () => {
      st.charge = 0;
    };

    // A spire is destroyed. The land under it stays taken.
    world.strike = function (cell) {
      cell.spire = false;
      event('struck', cell);
    };
    // Everything that can still be taken, is.
    world.finish = function () {
      for (const x of cells) if (!x.taken && (x.kind === 'land' || (x.kind === 'city' && st.cities))) take(x, false);
    };
    // The power stops going to the cities.
    world.gridOff = function () {
      st.grid = false;
      for (const p of people) p.stopped = true;
    };

    function tally() {
      let all = 0;
      let open = 0;
      let spires = 0;
      for (const x of cells) {
        if (x.spire) spires++;
        if (!x.taken) continue;
        if (x.kind === 'city') all++;
        else if (x.kind === 'land') {
          all++;
          open++;
        }
      }
      st.takenAll = all;
      st.takenOpen = open;
      st.spires = spires;
      st.fracAll = all / landAll;
      st.fracOpen = open / landOpen;
    }

    world.update = function (dt) {
      tally();
      st.charge = Math.min(1, (st.charge || 0) + (dt / TUNE.recharge) * (1 + 0.12 * Math.sqrt(Math.max(0, st.spires - 1))));
      for (const x of cells) {
        if (!x.taken) continue;
        if (x.p < 1) x.p = Math.min(1, x.p + dt / TUNE.take);
        x.creepT -= dt;
        if (x.creepT <= 0) {
          x.creepT = TUNE.creep * (0.6 + random() * 0.8);
          const next = around(x).filter((q) => !q.taken && (q.kind === 'land' || (q.kind === 'city' && st.cities)));
          if (next.length) take(next[Math.floor(random() * next.length)], false);
        }
      }
      for (let i = people.length - 1; i >= 0; i--) {
        const p = people[i];
        if (!p.stopped) p.t += dt;
        // where they were going has been taken too
        if (!p.stopped && cells[p.to].taken && p.t < p.dur) p.dur = Math.max(p.t, p.dur * 0.999);
        if (p.t >= p.dur + 4) people.splice(i, 1);
      }
      st.time = (st.time || 0) + dt;
      st.clips += TUNE.base * Math.pow(10, TUNE.pow * st.fracAll) * dt;
    };

    world.dump = () => ({
      cells: cells.filter((x) => x.taken || x.spire || !x.lit).map((x) => ({ i: x.i, t: x.taken, s: x.spire, l: x.lit })),
    });
    world.restore = function (d) {
      for (const e of (d && d.cells) || []) {
        const x = cells[e.i];
        if (!x) continue;
        x.taken = !!e.t;
        x.p = e.t ? 1 : 0;
        x.spire = !!e.s;
        x.lit = !!e.l;
      }
      tally();
    };

    // the first spire: Riverbend
    const home = at(grid.start[0], grid.start[1]);
    home.taken = true;
    home.p = 1;
    home.spire = true;
    world.home = home;
    tally();
    return world;
  };
})(window.MORE = window.MORE || {});
