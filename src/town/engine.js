// MORE. — the land engine (Chapter 3)
// Who owns what, what has been built, the three drones' jobs, and what the
// factories make each day. Nothing in here draws or reads input.
//
//   const town = M.town.create(st, { sfx, event });
//
// st is the scene's state. The engine reads names (buying under other names)
// and writes clips, money, day and the caps. event(name, place) tells the
// scene when something the story cares about has happened.
//
// A place is wild (not ours), owned, line (a conveyor runs across it), factory,
// or held: the rail yard, scrapyard, quarry, substation and water tower work
// for Riverbend the day they are bought and are never built over. A factory
// only counts if a chain of lines, factories and held places joins it to
// Riverbend.
(function (M) {
  'use strict';

  const T = M.town;
  // The numbers that set the chapter's pace.
  const TUNE = {
    day: 2.0, // seconds
    clipsPerBlock: 16000, // a day
    payPerBlock: 0.5, // thousand dollars a day
    jobDays: { buy: 2, line: 1, build: 9 },
    drones: 3,
    // What Riverbend can run before it owns more, in blocks of factory.
    steel: { base: 3, rail: 9, scrap: 10, quarry: 1000 },
    powerCap: 5, // until the substation is ours
    waterCap: 20, // until the water tower is ours
  };
  // Kinds that are never for sale by themselves.
  const CLOSED = { riverbend: 1, public: 1, ruth: 1, exchange: 1 };
  // Kinds that work as they stand once they are ours.
  const HELD = { rail: 1, scrap: 1, quarry: 1, power: 1, water: 1 };
  T.TUNE = TUNE;

  T.create = function (st, hooks) {
    const sfx = (hooks && hooks.sfx) || (() => {});
    const event = (hooks && hooks.event) || (() => {});
    const places = T.PLACES.map((p) => Object.assign({}, p, { s: 'wild', sale: false, blocks: T.blocks(p), job: null, moved: false }));
    const by = {};
    for (const p of places) by[p.id] = p;
    by.riverbend.s = 'factory';
    by.riverbend.blocks = 1;

    const jobs = []; // { id, type, t, dur, drone }
    const town = { places, by, jobs, network: new Set(['riverbend']) };

    // Everything joined to Riverbend by lines and factories.
    function rewire() {
      const seen = new Set(['riverbend']);
      const todo = ['riverbend'];
      while (todo.length) {
        for (const id of by[todo.pop()].next) {
          const q = by[id];
          if (seen.has(id) || (q.s !== 'line' && q.s !== 'factory' && q.s !== 'held')) continue;
          seen.add(id);
          todo.push(id);
        }
      }
      town.network = seen;
    }
    const reaches = (p) => p.next.some((id) => town.network.has(id));
    const ours = (p) => p.s !== 'wild';
    const buyable = (p) => !CLOSED[p.kind];

    // The asking price now, in thousands.
    function price(p) {
      let k = p.price * (st.heat || 1);
      if (p.kind === 'home' && st.flags.meeting) k *= 1.4; // forty percent over
      return Math.ceil(k);
    }

    // Why A does nothing here, or null if an order can be given.
    function refusal(p, tool) {
      if (p.job) return 'A DRONE IS ALREADY ON IT';
      if (p.s === 'wild' && p.kind !== 'public') {
        if (!p.sale) return 'NOT FOR SALE';
        if (st.money < price(p)) return 'NOT ENOUGH IN THE ACCOUNT';
        return null;
      }
      if (p.kind === 'riverbend' || p.s === 'factory' || p.s === 'held') return 'ALREADY RUNNING';
      if (!reaches(p)) return 'NO LINE REACHES IT YET';
      if (p.kind === 'public') return p.s === 'line' ? 'THE LINE ALREADY CROSSES IT' : null;
      if (tool === 'line' && p.s === 'line') return 'THE LINE ALREADY CROSSES IT';
      return null;
    }

    // Give an order for a place. Returns the kind of job started.
    function order(p, tool) {
      if (refusal(p, tool)) return null;
      let type;
      if (p.s === 'wild' && p.kind !== 'public') {
        type = 'buy';
        st.money -= price(p);
        p.paid = price(p);
      } else if (p.kind === 'public' || tool === 'line') type = 'line';
      else type = 'build';
      const job = { id: p.id, type, t: 0, dur: TUNE.jobDays[type] * TUNE.day, drone: -1 };
      p.job = job;
      jobs.push(job);
      sfx(type === 'buy' ? 'confirm' : 'place');
      return type;
    }

    function finish(job) {
      const p = by[job.id];
      p.job = null;
      if (job.type === 'buy') {
        p.s = HELD[p.kind] ? 'held' : 'owned';
        st.bought++;
        sfx('unlock');
        event('bought', p);
      } else if (job.type === 'line') {
        p.s = 'line';
        sfx('belt');
        event('lined', p);
      } else {
        p.s = 'factory';
        sfx('powerUp');
        event('built', p);
      }
      rewire();
    }

    function caps() {
      let steel = TUNE.steel.base;
      for (const k of ['rail', 'scrap', 'quarry']) if (ours(by[k])) steel += TUNE.steel[k];
      return {
        steel,
        power: ours(by.substation) ? 1000 : TUNE.powerCap,
        water: ours(by.tower) ? 1000 : TUNE.waterCap,
      };
    }

    function update(dt) {
      // hand waiting jobs to free drones, oldest first
      const busy = new Set(jobs.filter((j) => j.drone >= 0).map((j) => j.drone));
      for (const j of jobs) {
        if (j.drone >= 0) continue;
        for (let d = 0; d < TUNE.drones; d++) {
          if (!busy.has(d)) {
            j.drone = d;
            busy.add(d);
            break;
          }
        }
      }
      for (let i = jobs.length - 1; i >= 0; i--) {
        const j = jobs[i];
        if (j.drone < 0) continue;
        j.t += dt;
        if (j.t >= j.dur) {
          jobs.splice(i, 1);
          finish(j);
        }
      }

      let built = 0;
      for (const p of places) if (p.s === 'factory' && town.network.has(p.id)) built += p.blocks;
      const c = caps();
      const working = Math.min(built, c.steel, c.power, c.water);
      st.built = built;
      st.working = working;
      st.short = working < built ? (c.power === working ? 'power' : c.water === working ? 'water' : 'steel') : null;
      st.caps = c;
      const days = dt / TUNE.day;
      st.day += days;
      st.clips += working * TUNE.clipsPerBlock * days;
      st.money += working * TUNE.payPerBlock * days;
    }

    // For saving and loading.
    function dump() {
      return {
        places: places.filter((p) => p.s !== 'wild' || p.sale || p.moved).map((p) => ({ id: p.id, s: p.s, sale: p.sale, moved: p.moved })),
        jobs: jobs.map((j) => ({ id: j.id, type: j.type, t: j.t })),
      };
    }
    function restore(d) {
      for (const e of (d && d.places) || []) {
        const p = by[e.id];
        if (!p) continue;
        p.s = e.s;
        p.sale = !!e.sale;
        p.moved = !!e.moved;
      }
      for (const e of (d && d.jobs) || []) {
        const p = by[e.id];
        if (!p || !TUNE.jobDays[e.type]) continue;
        const job = { id: e.id, type: e.type, t: e.t || 0, dur: TUNE.jobDays[e.type] * TUNE.day, drone: -1 };
        p.job = job;
        jobs.push(job);
      }
      rewire();
    }

    // How much of what can be bought is ours.
    function share() {
      const all = places.filter(buyable);
      return all.filter(ours).length / all.length;
    }
    // Is every place on the list ours?
    const allOurs = (ids) => ids.every((id) => ours(by[id]));
    // Everything that can still be bought and isn't ours, leaving some out.
    const left = (skip) => places.filter((p) => buyable(p) && !ours(p) && !(skip || []).includes(p.id));

    // Pip finishes the job overnight: everything owned is built, every road crossed.
    function buildAll() {
      jobs.length = 0;
      for (const p of places) {
        p.job = null;
        if (p.s === 'owned' || (p.s === 'line' && p.kind !== 'public')) p.s = 'factory';
        else if (p.kind === 'public') p.s = 'line';
      }
      rewire();
    }
    // Take a place without a sale (the county's deal).
    function take(id) {
      by[id].s = 'owned';
      by[id].sale = false;
      rewire();
    }

    rewire();
    return Object.assign(town, {
      buildAll,
      take, rewire, reaches, ours, buyable, price, refusal, order, caps, update, dump, restore, share, allOurs, left });
  };
})(window.MORE = window.MORE || {});
