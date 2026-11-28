// MORE. — the switching engine (Chapter 4)
// Orders leave Pip's node and follow the traces. At a junction the switch
// decides which way they go: one exit, or each in turn. A depot that an order
// reaches runs for a while and then needs another. Phone calls hold the lines
// they cross, and an order cannot enter a held line. Nothing in here draws or
// reads input.
//
//   const net = M.net.create(st, { sfx, event, random });
//
// st is the scene's state. The engine reads priority, paused and source from
// it and writes clips, day, online and waited to it.
(function (M) {
  'use strict';

  const N = M.net;
  // The numbers that set the chapter's pace.
  const TUNE = {
    day: 12, // seconds: the chapter runs from October into November
    speed: 70, // pixels a second along a trace
    gap: 9, // closest two orders can follow each other, in pixels
    every: [1.0, 0.7, 0.45, 0.3], // seconds between orders, by how many locked nodes are open
    stayOn: 20, // seconds a depot runs on one order
    intake: 1.5, // seconds a locked node takes over each order
    clipsPerDepot: 54000000, // a day
    callEvery: [5, 9], // seconds between phone calls
    callFor: [5, 8], // how long one holds its lines
  };
  N.TUNE = TUNE;

  N.create = function (st, hooks) {
    const sfx = (hooks && hooks.sfx) || (() => {});
    const event = (hooks && hooks.event) || (() => {});
    const random = (hooks && hooks.random) || Math.random;

    const nodes = N.NODES.map((n) => Object.assign({}, n, { exits: [], mode: 0, turn: 0, got: 0, open: !n.need, on: 0, ever: false, dark: false, into: null }));
    const by = {};
    for (const n of nodes) by[n.id] = n;
    const traces = N.TRACES.map((t, i) => {
      const pts = [[by[t.from].x, by[t.from].y], ...t.via, [by[t.to].x, by[t.to].y]];
      let len = 0;
      const legs = [];
      for (let k = 1; k < pts.length; k++) {
        const d = Math.abs(pts[k][0] - pts[k - 1][0]) + Math.abs(pts[k][1] - pts[k - 1][1]);
        legs.push(d);
        len += d;
      }
      const tr = { i, from: t.from, to: t.to, pts, legs, len, orders: [], call: null };
      by[t.from].exits.push(tr);
      by[t.to].into = tr;
      return tr;
    });
    // relays with more than one way out start by sending everything the first way
    const calls = [];
    const net = { nodes, by, traces, calls };
    let emitT = 0;
    let callT = 4;
    let waitT = 0;

    // Which parts of the board are awake: part 1, plus one for each locked node opened.
    const awake = (n) => {
      if (n.part === 1) return true;
      if (n.part === 2) return by.x.open;
      if (n.part === 3) return by.k.open;
      return by.q.open;
    };
    const isSwitch = (n) => n.exits.length > 1 && (n.open || !n.need) && !n.dark;
    // A switch's settings in order: each exit alone, then every exit in turn.
    const modes = (n) => n.exits.length + 1;
    const modeName = (n) => {
      if (n.mode >= n.exits.length) return 'EACH IN TURN';
      return 'ALL TO ' + by[n.exits[n.mode].to].name;
    };
    function turn(n, back) {
      if (!isSwitch(n)) return false;
      n.mode = (n.mode + (back ? modes(n) - 1 : 1)) % modes(n);
      sfx('rotate');
      return true;
    }

    const opened = () => ['x', 'k', 'q'].filter((id) => by[id].open).length;
    const room = (tr) => !tr.orders.length || tr.orders[tr.orders.length - 1].d >= TUNE.gap;
    const usable = (tr) => !by[tr.to].dark && awake(by[tr.to]);

    function drop(call) {
      const i = calls.indexOf(call);
      if (i < 0) return;
      calls.splice(i, 1);
      for (const tr of call.path) if (tr.call === call) tr.call = null;
      st.dropped = (st.dropped || 0) + 1;
      event('dropped', call);
    }

    // Send an order out of a node. False if it has to wait where it is.
    function send(n) {
      const all = n.exits.filter(usable);
      if (!all.length) return 'lost';
      const pick = n.mode < n.exits.length && usable(n.exits[n.mode]) ? [n.exits[n.mode]] : all;
      for (let k = 0; k < pick.length; k++) {
        const tr = pick[(n.turn + k) % pick.length];
        if (tr.call) {
          if (!st.priority) {
            waitT += 0.25; // turned away by a call
            continue;
          }
          drop(tr.call); // orders first
        }
        if (!room(tr)) continue;
        tr.orders.push({ d: 0 });
        n.turn = (n.turn + k + 1) % Math.max(1, pick.length);
        return true;
      }
      // held up: is it a call in the way?
      if (pick.some((tr) => tr.call)) waitT += 1 / 60;
      return false;
    }

    function arrive(n) {
      if (n.kind === 'depot') {
        if (!n.ever) {
          n.ever = true;
          event('online', n);
        }
        n.on = TUNE.stayOn;
        return true;
      }
      if (n.need && !n.open) {
        if (n.busy > 0) return false; // still working on the last one
        n.busy = TUNE.intake;
        n.got++;
        if (n.got >= n.need) {
          n.open = true;
          n.mode = n.exits.length; // a new junction starts by sharing
          sfx('unlock');
          event('opened', n);
        }
        return true;
      }
      const r = send(n);
      return r === true || r === 'lost';
    }

    // The lines between two nodes: up from each to where their branches meet.
    function between(a, b) {
      const up = (n) => {
        const out = [];
        while (n.into) {
          out.push(n.into);
          n = by[n.into.from];
        }
        return out;
      };
      const pa = up(a);
      const pb = up(b);
      return pa.filter((t) => !pb.includes(t)).concat(pb.filter((t) => !pa.includes(t)));
    }

    function placeCall() {
      const ends = nodes.filter((n) => awake(n) && !n.dark && (n.kind === 'depot' || n.need || n.kind === 'pip'));
      if (ends.length < 2) return;
      const a = ends[Math.floor(random() * ends.length)];
      let b = ends[Math.floor(random() * ends.length)];
      if (a === b) b = ends[(ends.indexOf(a) + 1) % ends.length];
      const path = between(a, b).filter((t) => !t.call);
      if (!path.length) return;
      const who = N.CALLERS[Math.floor(random() * N.CALLERS.length)];
      const call = { who, path, t: 0, dur: TUNE.callFor[0] + random() * (TUNE.callFor[1] - TUNE.callFor[0]) };
      for (const tr of path) tr.call = call;
      calls.push(call);
      event('call', call);
    }

    function update(dt) {
      if (st.paused) return;
      // calls come and go
      if (st.callsOn) {
        callT -= dt;
        if (callT <= 0) {
          callT = TUNE.callEvery[0] + random() * (TUNE.callEvery[1] - TUNE.callEvery[0]);
          placeCall();
        }
      }
      for (let i = calls.length - 1; i >= 0; i--) {
        const c = calls[i];
        c.t += dt;
        if (c.t >= c.dur) {
          calls.splice(i, 1);
          for (const tr of c.path) if (tr.call === c) tr.call = null;
        }
      }
      // orders leave the source
      const src = by[st.source || 'pip'];
      emitT += dt;
      const every = TUNE.every[opened()];
      if (src && !src.dark && emitT >= every) {
        if (send(src) === true) emitT = 0;
        else emitT = every;
      }
      // and move along the traces
      for (const tr of traces) {
        for (let i = 0; i < tr.orders.length; i++) {
          const o = tr.orders[i];
          const lim = i > 0 ? tr.orders[i - 1].d - TUNE.gap : tr.len;
          o.d = Math.min(o.d + TUNE.speed * dt, Math.max(o.d, lim));
          if (i === 0 && o.d >= tr.len) {
            if (by[tr.to].dark || arrive(by[tr.to])) {
              tr.orders.shift();
              i--;
            }
          }
        }
      }
      if (waitT > 1.2) st.waited = true;
      for (const n of nodes) if (n.busy > 0) n.busy -= dt;
      // depots run down
      let online = 0;
      for (const n of nodes) {
        if (n.kind !== 'depot') continue;
        if (n.dark) n.on = 0;
        if (n.on > 0) {
          n.on -= dt;
          online++;
        }
      }
      st.online = online;
      st.best = Math.max(st.best || 0, online);
      const days = dt / TUNE.day;
      st.time = (st.time || 0) + dt;
      st.day += days;
      st.clips += online * TUNE.clipsPerDepot * days;
    }

    // A node loses power: nothing reaches it or passes through it again.
    function darken(id) {
      const n = by[id];
      n.dark = true;
      n.on = 0;
      for (const tr of n.exits) tr.orders.length = 0;
      if (n.into) n.into.orders.length = 0;
      for (const c of calls.slice()) if (c.path.some((t) => t.to === id || t.from === id)) drop(c);
      sfx('powerDown');
    }

    function dump() {
      return {
        nodes: nodes.map((n) => ({ id: n.id, mode: n.mode, got: n.got, open: n.open, on: Math.max(0, n.on), ever: n.ever, dark: n.dark })),
      };
    }
    function restore(d) {
      for (const e of (d && d.nodes) || []) {
        const n = by[e.id];
        if (!n) continue;
        Object.assign(n, { mode: Math.min(e.mode || 0, n.exits.length), got: e.got || 0, open: !!e.open || !n.need, on: e.on || 0, ever: !!e.ever, dark: !!e.dark });
      }
    }

    // where an order sits on its trace, in map pixels
    function at(tr, d) {
      let left = d;
      for (let k = 0; k < tr.legs.length; k++) {
        if (left <= tr.legs[k] || k === tr.legs.length - 1) {
          const [x0, y0] = tr.pts[k];
          const [x1, y1] = tr.pts[k + 1];
          const f = tr.legs[k] ? Math.min(1, left / tr.legs[k]) : 0;
          return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
        }
        left -= tr.legs[k];
      }
      return tr.pts[0];
    }

    by.a.mode = 0;
    return Object.assign(net, { awake, isSwitch, modeName, turn, opened, update, darken, dump, restore, at });
  };

  // Who is on the line when a call crosses the board.
  N.CALLERS = [
    'DOT TO HER SISTER',
    'HALVORSEN TO HIS SON',
    'THE SCHOOL IN HADLEY',
    'A NIGHT NURSE',
    'BEA TO HER MOTHER',
    'TOMAS TO A JOB LINE',
    'OTIS TO HIS DAUGHTER',
    'THE PHARMACY',
    'A WRONG NUMBER',
    'THE COUNTY CLERK',
  ];
})(window.MORE = window.MORE || {});
