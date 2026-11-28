// MORE. — drawing Harlan's network (Chapter 4)
// The circuit board, its traces, the orders and calls on them, the nodes with
// their switches and timers, the HUD and the panel.
//
//   const view = M.net.createView({ st, net, story, ui });
//   view.draw();
(function (M) {
  'use strict';

  const P = M.PAL;
  const N = M.net;
  const COPPER = '#c8773f';
  const COPPER_DK = '#7a4424';
  const ASLEEP = '#1c3a28';
  const MONTHS = [['OCT', 31], ['NOV', 30], ['DEC', 31], ['JAN', 31], ['FEB', 28], ['MAR', 31]];
  const ART = { pip: 'node_pip', relay: 'node_relay', depot: 'node_depot', exchange: 'node_exchange', bank: 'node_bank', office: 'node_office' };
  const fmt = (n) => Math.floor(n).toLocaleString('en-US');

  // Day 0 is the first of October.
  N.date = function (day) {
    let d = Math.floor(day);
    for (const [name, len] of MONTHS) {
      if (d < len) return name + ' ' + (d + 1);
      d -= len;
    }
    return 'MAR 31';
  };

  const FULL = { OCT: 'OCTOBER', NOV: 'NOVEMBER', DEC: 'DECEMBER', JAN: 'JANUARY', FEB: 'FEBRUARY', MAR: 'MARCH' };
  N.month = (day) => FULL[N.date(day).slice(0, 3)];

  N.createView = function (env) {
    const g = M.gfx;
    const { st, net, story, ui } = env;
    const Y0 = N.MAP_Y;

    function line(x0, y0, x1, y1, col, w) {
      const h = y0 === y1;
      if (h) g.rect(Math.min(x0, x1) - (w >> 1), Y0 + y0 - (w >> 1), Math.abs(x1 - x0) + w, w, col);
      else g.rect(x0 - (w >> 1), Y0 + Math.min(y0, y1) - (w >> 1), w, Math.abs(y1 - y0) + w, col);
    }

    function drawTrace(tr) {
      const to = net.by[tr.to];
      const live = net.awake(to) && !to.dark && !net.by[tr.from].dark;
      for (let k = 1; k < tr.pts.length; k++) {
        const [x0, y0] = tr.pts[k - 1];
        const [x1, y1] = tr.pts[k];
        line(x0, y0, x1, y1, P.INK, 4);
        line(x0, y0, x1, y1, !live ? (to.dark || net.by[tr.from].dark ? '#181818' : ASLEEP) : tr.call ? '#8890a8' : COPPER_DK, 2);
        if (live && !tr.call) line(x0, y0, x1, y1, COPPER, 1);
      }
      if (tr.call && live) {
        // a call holds the line: white dashes running along it
        const off = (ui.t() * 30) % 8;
        for (let d = off; d < tr.len; d += 8) {
          const [x, y] = net.at(tr, d);
          g.rect(Math.round(x) - 1, Y0 + Math.round(y) - 1, 2, 2, P.WHITE);
        }
      }
      for (const o of tr.orders) {
        const [x, y] = net.at(tr, o.d);
        g.rect(Math.round(x) - 2, Y0 + Math.round(y) - 2, 4, 4, P.INK);
        g.rect(Math.round(x) - 1, Y0 + Math.round(y) - 1, 3, 3, P.ORANGE);
        g.rect(Math.round(x) - 1, Y0 + Math.round(y) - 1, 1, 1, P.YELLOW);
      }
    }

    // Small arrows on a switch: lit on the ways orders will go.
    function drawSwitch(n) {
      n.exits.forEach((tr, i) => {
        const [x1, y1] = tr.pts[1];
        const dx = Math.sign(x1 - n.x);
        const dy = Math.sign(y1 - n.y);
        const lit = n.mode >= n.exits.length || n.mode === i;
        const ax = n.x + dx * 15;
        const ay = Y0 + n.y + dy * 15;
        const col = lit ? P.YELLOW : '#40483c';
        for (let k = 0; k < 3; k++) {
          if (dx) g.rect(ax - dx * k, ay - k, 1, k * 2 + 1, col);
          else g.rect(ax - k, ay - dy * k, k * 2 + 1, 1, col);
        }
      });
    }

    function drawNode(n) {
      const awake = net.awake(n);
      const x = n.x - 11;
      const y = Y0 + n.y - 11;
      let art = ART[n.kind];
      if (n.kind === 'depot' && n.on > 0) art = 'node_depot_on';
      if (n.kind === 'pip' && n.dark) art = 'node_dead';
      g.ctx.globalAlpha = awake ? 1 : 0.3;
      g.draw(art, x, y);
      g.ctx.globalAlpha = 1;
      if (n.dark) {
        g.ctx.globalAlpha = 0.72;
        g.rect(x, y, 22, 22, '#06080a');
        g.ctx.globalAlpha = 1;
        return;
      }
      if (!awake) return;
      if (n.kind === 'depot' && n.ever) {
        // how long this depot will keep running on its last order
        const k = Math.max(0, Math.min(1, n.on / N.TUNE.stayOn));
        g.rect(x + 1, y + 23, 20, 3, P.INK);
        g.rect(x + 2, y + 24, Math.round(18 * k), 1, k > 0.3 ? P.ORANGE : Math.floor(ui.t() * 6) % 2 ? P.RED : P.ORANGE);
      }
      if (n.need && !n.open) {
        g.rect(x + 1, y + 23, 20, 3, P.INK);
        g.rect(x + 2, y + 24, Math.round((18 * n.got) / n.need), 1, P.CREAM);
        // a padlock, more or less
        g.rect(x + 8, y - 4, 6, 4, P.INK);
        g.rect(x + 9, y - 3, 4, 3, P.CREAM);
      }
      if (net.isSwitch(n)) drawSwitch(n);
    }

    // The night shift, walking out of a depot that has just come online.
    function drawWalkers() {
      for (const w of ui.walkers()) {
        const a = Math.max(0, 1 - w.t / 3.2);
        g.ctx.globalAlpha = a;
        for (let i = 0; i < 4; i++) {
          const k = Math.max(0, w.t - i * 0.35);
          const x = Math.round(w.x - 6 + i * 4 + (i % 2));
          const y = Math.round(Y0 + w.y + 14 + k * 7);
          g.rect(x, y, 2, 2, P.CREAM);
          g.rect(x, y + 2, 2, 2, ['#3a5a8a', '#7a4424', '#4a6a3a', '#5a5a6a'][i]);
        }
        g.ctx.globalAlpha = 1;
      }
    }

    function drawCursor(n) {
      const col = Math.floor(ui.t() * 3) % 2 ? P.ORANGE : P.YELLOW;
      const x0 = n.x - 13;
      const y0 = Y0 + n.y - 13;
      const S = 26;
      const L = 6;
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x0 + S - 1, y0, -1, 1], [x0, y0 + S - 1, 1, -1], [x0 + S - 1, y0 + S - 1, -1, -1]]) {
        g.rect(sx > 0 ? cx : cx - L + 1, cy, L, 1, col);
        g.rect(cx, sy > 0 ? cy : cy - L + 1, 1, L, col);
      }
    }

    function drawHUD() {
      g.box(0, 0, 136, 28);
      g.draw('clip_icon', 9, 6);
      g.text('CLIPS', 26, 6, P.STEEL_LT);
      g.text(ui.count(st.clips), 26, 15, P.WHITE);
      g.box(136, 0, 248, 28);
      g.text('GOAL: MAKE AS MANY', 146, 6, P.ORANGE);
      const hide = st.goalBlink > 0 && Math.floor(ui.t() * 5) % 2 === 0;
      g.text(hide ? 'PAPERCLIPS AS' : 'PAPERCLIPS AS POSSIBLE', 146, 15, P.ORANGE);
    }

    function status(n) {
      const A = M.input.label('a');
      if (n.dark) return 'NO POWER';
      if (!net.awake(n)) return 'NOT REACHED YET';
      if (n.need && !n.open) return 'LOCKED. ORDERS IN: ' + n.got + '/' + n.need;
      if (net.isSwitch(n)) return A + ': SWITCH. ' + net.modeName(n);
      if (n.kind === 'depot') return n.on > 0 ? 'RUNNING. ' + Math.ceil(n.on) + 'S OF ORDERS LEFT' : n.ever ? 'STOPPED. NEEDS AN ORDER' : 'WAITING FOR AN ORDER';
      if (n.kind === 'pip') return st.paused ? 'PAUSED' : 'ORDERS GO OUT FROM HERE';
      return 'OPEN';
    }

    function drawPanel() {
      const L = M.dialogLayout();
      M.drawDialogFrame();
      M.drawPortrait(M.CAST.pip.portrait);
      const n = ui.cursor();
      const s = status(n);
      // a long switch setting takes the name's line too
      const long = s.length > 37;
      g.text(long ? s.slice(0, s.indexOf('. ') + 1) : n.name, L.tx, L.ty, P.ORANGE);
      g.text(long ? s.slice(s.indexOf('. ') + 2) : s, L.tx, L.ty + L.lh, P.CREAM);
      g.text(story.objective(st, net), L.tx, L.ty + L.lh * 2, P.STEEL_LT);
      if (!st.sandbox) g.textRight(st.online * N.PER_DEPOT + '/40  ' + N.date(st.day), L.W - 14, L.ty + L.lh * 2, P.STEEL_DK);
    }

    function drawToasts() {
      ui.toasts().forEach((to, i) => {
        const a = Math.min(1, (2.6 - to.t) / 0.4);
        g.ctx.globalAlpha = Math.max(0, a);
        const y = 194 - Math.min(3, to.t * 12) - i * 12;
        const w = to.text.length * 8 + 10;
        g.rect(g.W - 6 - w, y - 3, w, 13, P.SHADOW);
        g.textRight(to.text, g.W - 11, y, to.color);
        g.ctx.globalAlpha = 1;
      });
    }

    function drawPause() {
      const items = ui.pauseItems();
      const w = 150;
      const x = Math.round((g.W - w) / 2);
      g.box(x, 92, w, 74);
      g.textCenter('PAUSED', g.W / 2, 102, P.STEEL_LT);
      items.forEach((l, i) => {
        const y = 120 + i * 13;
        if (i === ui.pause().sel) g.text('▶', x + 12, y, P.ORANGE);
        g.text(l, x + 24, y, i === ui.pause().sel ? P.ORANGE : P.CREAM);
      });
    }

    return {
      draw() {
        const runner = ui.runner();
        g.clear(P.INK);
        if (st.backdrop) {
          g.draw(st.backdrop, 0, 0);
          if (st.backdropDim > 0) g.tint('#141830', st.backdropDim);
        } else {
          g.draw('board_bg', 0, Y0);
          for (const tr of net.traces) drawTrace(tr);
          for (const n of net.nodes) drawNode(n);
          drawWalkers();
          if (!runner && !st.sandbox) drawCursor(ui.cursor());
          if (st.night > 0) {
            g.ctx.save();
            g.ctx.beginPath();
            g.ctx.rect(0, Y0, N.MAP_W, N.MAP_H);
            g.ctx.clip();
            g.tint(P.NIGHT, st.night);
            g.ctx.restore();
          }
          if (st.paused) {
            g.box(92, Y0 + 66, 200, 30);
            g.textCenter(st.paused === true ? 'PAUSED FOR REVIEW' : st.paused, g.W / 2, Y0 + 77, Math.floor(ui.t() * 2) % 2 ? P.ORANGE : P.CREAM);
          }
          g.rect(0, 28, g.W, Y0 - 28, P.INK);
          g.rect(0, Y0 + N.MAP_H, g.W, 8, P.INK);
          drawHUD();
        }
        if (runner && M.dialog.active) runner.draw();
        else {
          if (!st.backdrop) drawPanel();
          if (runner) runner.draw();
        }
        if (!st.backdrop) drawToasts();
        if (ui.pause()) drawPause();
      },
    };
  };
})(window.MORE = window.MORE || {});
