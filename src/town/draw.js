// MORE. — drawing the county map (Chapter 3)
// The warm painting, and over it whatever Riverbend has done to each place:
// survey stakes on land it owns, conveyor across land it has lined, rubble and
// scaffolding while it builds, then cold factory blocks. Also the river going
// grey, Main Street going dark, the drones, the HUD and the panel.
//
//   const view = M.town.createView({ st, town, story, ui });
//   view.prepare();  view.draw();
(function (M) {
  'use strict';

  const P = M.PAL;
  const T = M.town;
  const BELT = { green: '#306838', shine: '#3c7c44', rail: '#787878', dark: '#303030' };
  const MONTHS = [['MAR', 31], ['APR', 30], ['MAY', 31], ['JUN', 30], ['JUL', 31], ['AUG', 31], ['SEP', 30], ['OCT', 31], ['NOV', 30], ['DEC', 31]];
  const fmt = (n) => Math.floor(n).toLocaleString('en-US');

  // Day 0 is the twenty-first of March.
  T.date = function (day) {
    let d = Math.floor(day) + 20;
    for (const [name, len] of MONTHS) {
      if (d < len) return name + ' ' + (d + 1);
      d -= len;
    }
    return 'DEC 31';
  };

  // The same painting with the colour taken out of it.
  let coldMap = null;
  let lamp = null; // Ruth's lit window, found on the painting
  function buildCold() {
    if (coldMap) return coldMap;
    const im = M.gfx.art('county_map');
    const cv = document.createElement('canvas');
    cv.width = T.MAP_W;
    cv.height = T.MAP_H;
    const cx = cv.getContext('2d');
    if (!im || !im.naturalWidth) return (coldMap = cv);
    cx.drawImage(im, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height);
    const ruth = T.PLACES.find((p) => p.id === 'ruth');
    let best = -1;
    for (let i = 0; i < d.data.length; i += 4) {
      const r = d.data[i];
      const g = d.data[i + 1];
      const b = d.data[i + 2];
      const x = (i / 4) % cv.width;
      const y = Math.floor(i / 4 / cv.width);
      if (x >= ruth.x && x < ruth.x + ruth.w && y >= ruth.y && y < ruth.y + ruth.h && r + g - 2 * b > best && r > 200) {
        best = r + g - 2 * b;
        lamp = [x, y];
      }
      const l = (r * 3 + g * 6 + b) / 10;
      d.data[i] = l * 0.58;
      d.data[i + 1] = l * 0.64;
      d.data[i + 2] = l * 0.78;
    }
    cx.putImageData(d, 0, 0);
    return (coldMap = cv);
  }

  // The grey county, for scenes that show it after the fact.
  T.coldMap = buildCold;

  T.createView = function (env) {
    const g = M.gfx;
    const { st, town, story, ui } = env;
    const Y0 = T.MAP_Y;
    const centre = (p) => [p.x + p.w / 2, Y0 + p.y + p.h / 2];

    const clipTo = (p, up, fn) => {
      g.ctx.save();
      g.ctx.beginPath();
      g.ctx.rect(p.x, Y0 + p.y - up, p.w, p.h + up);
      g.ctx.clip();
      fn();
      g.ctx.restore();
    };
    const fill = (p, name) => {
      const im = g.art(name);
      if (!im || !im.naturalWidth) return;
      clipTo(p, 0, () => {
        for (let y = 0; y < p.h; y += 24) for (let x = 0; x < p.w; x += 24) g.ctx.drawImage(im, p.x + x, Y0 + p.y + y);
      });
    };
    const cold = (p) => g.ctx.drawImage(coldMap, p.x, p.y, p.w, p.h, p.x, Y0 + p.y, p.w, p.h);

    function drawFactory(p) {
      fill(p, 'lot_paved');
      const nx = Math.max(1, Math.floor(p.w / 24));
      const ny = Math.max(1, Math.floor(p.h / 24));
      const ox = Math.floor((p.w - nx * 24) / 2);
      const oy = Math.max(0, Math.floor((p.h - ny * 24) / 2));
      clipTo(p, 3, () => {
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            // more smokestacks toward the end of the chapter
            const n = 1 + ((i * 7 + j * 3 + p.x + (st.flags.meeting ? 2 : 0)) % (st.flags.meeting ? 4 : 2));
            const im = g.art('block' + Math.min(4, n));
            if (im && im.naturalWidth) g.ctx.drawImage(im, p.x + ox + i * 24, Y0 + p.y + oy + (j + 1) * 24 - im.height);
          }
        }
      });
    }

    function drawStakes(p) {
      const x = p.x;
      const y = Y0 + p.y;
      for (let i = 1; i < p.w - 1; i += 4) {
        g.rect(x + i, y + 1, 2, 1, P.ORANGE);
        g.rect(x + i, y + p.h - 2, 2, 1, P.ORANGE);
      }
      for (let i = 1; i < p.h - 1; i += 4) {
        g.rect(x + 1, y + i, 1, 2, P.ORANGE);
        g.rect(x + p.w - 2, y + i, 1, 2, P.ORANGE);
      }
      for (const [cx, cy] of [[x, y], [x + p.w - 2, y], [x, y + p.h - 2], [x + p.w - 2, y + p.h - 2]]) g.rect(cx, cy, 2, 2, P.WHITE);
    }

    // A conveyor from the middle of a place to each neighbour it joins.
    function strip(x0, y0, x1, y1) {
      const h = y0 === y1;
      const a = Math.min(h ? x0 : y0, h ? x1 : y1);
      const len = Math.abs(h ? x1 - x0 : y1 - y0) + 4;
      const off = Math.floor(ui.t() * 8) % 4;
      if (h) {
        g.rect(a - 2, y0 - 3, len, 6, BELT.dark);
        g.rect(a - 2, y0 - 2, len, 4, BELT.green);
        for (let i = (x1 > x0 ? off : 3 - off); i < len; i += 4) g.rect(a - 2 + i, y0 - 2, 1, 4, BELT.shine);
      } else {
        g.rect(x0 - 3, a - 2, 6, len, BELT.dark);
        g.rect(x0 - 2, a - 2, 4, len, BELT.green);
        for (let i = (y1 > y0 ? off : 3 - off); i < len; i += 4) g.rect(x0 - 2, a - 2 + i, 4, 1, BELT.shine);
      }
    }
    function drawLine(p) {
      const [cx, cy] = centre(p);
      for (const id of p.next) {
        const q = town.by[id];
        if (q.s !== 'line' && q.s !== 'factory' && q.s !== 'held') continue;
        // the middle of the edge the two places share
        const ex = Math.max(p.x, q.x) + (Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) / 2;
        const ey = Y0 + Math.max(p.y, q.y) + (Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)) / 2;
        if (q.x >= p.x + p.w || q.x + q.w <= p.x) {
          const edge = q.x >= p.x + p.w ? p.x + p.w - 1 : p.x;
          strip(cx, cy, cx, Math.round(ey));
          strip(Math.round(cx), Math.round(ey), edge, Math.round(ey));
        } else {
          const edge = q.y >= p.y + p.h ? Y0 + p.y + p.h - 1 : Y0 + p.y;
          strip(cx, cy, Math.round(ex), cy);
          strip(Math.round(ex), Math.round(cy), Math.round(ex), edge);
        }
      }
    }

    function drawPlace(p) {
      const building = p.job && p.job.type === 'build' && p.job.drone >= 0;
      if (building) {
        fill(p, p.job.t / p.job.dur < 0.35 ? 'lot_rubble' : 'lot_scaffold');
      } else if (p.s === 'factory' && p.kind !== 'riverbend') {
        drawFactory(p);
      } else if (p.s === 'held') {
        if (p.kind === 'power') fill(p, 'lot_power');
        else if (p.kind === 'water') fill(p, 'lot_water');
        else cold(p);
      } else if (p.s === 'line') {
        if (p.kind !== 'public') drawStakes(p);
        drawLine(p);
      } else if (p.s === 'owned') {
        drawStakes(p);
      } else if (st.dark && (p.kind === 'shop' || p.kind === 'library' || p.kind === 'school')) {
        // the power went to the factories: nothing lit on Main Street
        g.ctx.globalAlpha = 0.5;
        g.rect(p.x, Y0 + p.y, p.w, p.h, '#0a0c28');
        g.ctx.globalAlpha = 1;
      }
      if (p.kind === 'riverbend' && st.flags.meeting) cold(p);
    }

    function drawRiver() {
      if (st.grey <= 0) return;
      // grey spreads up and down the river from the factory
      const mid = town.by.bridge.y + 6;
      const reach = Math.ceil(st.grey * T.MAP_H);
      const y0 = Math.max(0, mid - reach);
      const y1 = Math.min(T.MAP_H, mid + reach);
      g.ctx.drawImage(coldMap, T.RIVER.x, y0, T.RIVER.w, y1 - y0, T.RIVER.x, Y0 + y0, T.RIVER.w, y1 - y0);
      if (town.by.bridge.s !== 'line') {
        const b = town.by.bridge;
        g.ctx.drawImage(g.art('county_map'), b.x, b.y, b.w, b.h, b.x, Y0 + b.y, b.w, b.h);
      }
    }

    function drawDrone(d) {
      const x = Math.round(d.x);
      const y = Math.round(d.y + Math.sin(ui.t() * 3 + d.i * 2) * 1.2);
      g.ctx.globalAlpha = 0.35;
      g.rect(x - 2, y + 6, 5, 1, P.INK);
      g.ctx.globalAlpha = 1;
      g.rect(x - 3, y - 3, 7, 6, '#1c1c20');
      g.rect(x - 2, y - 2, 5, 4, '#8a8f98');
      g.rect(x - 2, y - 2, 5, 1, '#b4b8c0');
      g.rect(x - 1, y - 1, 2, 2, P.ORANGE);
    }

    // People leaving: a truck, or the school bus.
    function drawMove(mv) {
      const x = Math.round(mv.x);
      const y = Math.round(mv.y);
      if (mv.t < mv.pack) {
        // carrying boxes out
        for (let i = 0; i < 3; i++) {
          const k = (mv.t * 1.4 + i * 0.33) % 1;
          g.rect(x - 8 + Math.round(k * 8) - i, y - 5 + i * 3, 2, 3, i === 1 ? '#c8773f' : P.CREAM);
          if (k < 0.8) g.rect(x - 8 + Math.round(k * 8) - i + 2, y - 4 + i * 3, 2, 2, '#b08850');
        }
      }
      const bus = mv.kind === 'bus';
      g.rect(x - 1, y + 5, 12, 1, 'rgba(0,0,0,0.35)');
      g.rect(x, y, bus ? 12 : 10, 5, bus ? P.YELLOW : P.CREAM);
      g.rect(x + (mv.dir > 0 ? (bus ? 9 : 7) : 0), y + 1, 3, 4, bus ? P.YELLOW : '#a03020');
      if (bus) for (let i = 1; i < 9; i += 3) g.rect(x + i, y + 1, 2, 2, '#283048');
      g.rect(x + 1, y + 5, 2, 1, P.INK);
      g.rect(x + (bus ? 9 : 7), y + 5, 2, 1, P.INK);
    }

    function drawCursor(p) {
      const col = Math.floor(ui.t() * 3) % 2 ? P.ORANGE : P.YELLOW;
      const x0 = p.x;
      const y0 = Y0 + p.y;
      const L = Math.min(6, Math.floor(Math.min(p.w, p.h) / 2));
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x0 + p.w - 1, y0, -1, 1], [x0, y0 + p.h - 1, 1, -1], [x0 + p.w - 1, y0 + p.h - 1, -1, -1]]) {
        g.rect(sx > 0 ? cx : cx - L + 1, cy, L, 1, col);
        g.rect(cx, sy > 0 ? cy : cy - L + 1, 1, L, col);
        g.rect(sx > 0 ? cx : cx - L + 1, cy + sy, L, 1, P.INK);
        g.rect(cx + sx, sy > 0 ? cy : cy - L + 1, 1, L, P.INK);
      }
    }

    function drawHUD() {
      g.box(0, 0, 136, 28);
      g.draw('clip_icon', 9, 6);
      g.text('CLIPS', 26, 6, P.STEEL_LT);
      g.text(fmt(st.clips), 26, 15, P.WHITE);
      g.box(136, 0, 248, 28);
      g.text('GOAL: MAKE AS MANY', 146, 6, P.ORANGE);
      const hide = st.goalBlink > 0 && Math.floor(ui.t() * 5) % 2 === 0;
      g.text(hide ? 'PAPERCLIPS AS' : 'PAPERCLIPS AS POSSIBLE', 146, 15, P.ORANGE);
    }

    function status(p) {
      const A = M.input.label('a');
      if (p.job) return p.job.drone < 0 ? 'WAITING FOR A DRONE' : { buy: 'PAPERWORK', line: 'LAYING LINE', build: 'BUILDING' }[p.job.type] + ' ' + Math.floor((p.job.t / p.job.dur) * 100) + '%';
      const why = town.refusal(p, st.tool);
      if (p.s === 'wild' && p.kind !== 'public') {
        if (!p.sale) return ui.notForSale(p);
        return A + ': OFFER $' + fmt(town.price(p)) + 'K';
      }
      if (p.s === 'factory') return p.kind === 'riverbend' ? 'EST. 1912' : p.blocks + (p.blocks > 1 ? ' BLOCKS' : ' BLOCK') + (town.network.has(p.id) ? '' : ', NO LINE');
      if (p.s === 'held') return { rail: 'STEEL BY RAIL', scrap: 'STEEL FROM SCRAP', quarry: 'ORE', power: 'POWER', water: 'WATER' }[p.kind];
      if (why) return why;
      if (p.kind === 'public') return A + ': RUN A LINE ACROSS';
      return A + ': ' + (st.tool === 'line' ? 'LAY LINE' : 'BUILD') + '  ' + M.input.label('sel') + ': ' + (st.tool === 'line' ? 'BUILD' : 'LINE');
    }

    function drawPanel() {
      const L = M.dialogLayout();
      M.drawDialogFrame();
      M.drawPortrait(M.CAST.pip.portrait);
      const p = ui.cursor();
      g.text(p.name, L.tx, L.ty, P.ORANGE);
      g.text(status(p), L.tx, L.ty + L.lh, P.CREAM);
      g.textRight('$' + fmt(st.money) + 'K', L.W - 14, L.ty + L.lh, st.money < 1 ? P.GRID : P.WHITE);
      g.text(story.objective(st, town), L.tx, L.ty + L.lh * 2, P.STEEL_LT);
      const c = st.caps;
      if (c && !st.sandbox) {
        const cap = Math.min(c.steel, c.power, c.water);
        const txt = st.short ? st.short.toUpperCase() + ' ' + st.working + '/' + st.built : T.date(st.day);
        g.textRight(txt, L.W - 14, L.ty + L.lh * 2, st.short && Math.floor(ui.t() * 2) % 2 ? P.ORANGE : P.STEEL_DK);
        void cap;
      }
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
      prepare() {
        buildCold();
      },
      // Just the county, as it stands: no cursor, drones, HUD or panel.
      drawMap() {
        g.draw('county_map', 0, Y0);
        drawRiver();
        for (const p of town.places) drawPlace(p);
      },
      draw() {
        const runner = ui.runner();
        g.clear(P.INK);
        if (st.backdrop) {
          // a fixed scene (the town meeting) in place of the map
          g.draw(st.backdrop, 0, 0);
          if (st.backdropDim > 0) g.tint('#3a2a50', st.backdropDim);
        } else {
          g.draw('county_map', 0, Y0);
          drawRiver();
          for (const p of town.places) drawPlace(p);
          for (const mv of ui.moves()) drawMove(mv);
          if (!runner && !st.sandbox) drawCursor(ui.cursor());
          for (const d of ui.drones()) drawDrone(d);
          if (st.night > 0) {
            g.ctx.save();
            g.ctx.beginPath();
            g.ctx.rect(0, Y0, T.MAP_W, T.MAP_H);
            g.ctx.clip();
            g.tint(P.NIGHT, st.night);
            g.ctx.restore();
            if (lamp) {
              // one lit window
              g.rect(lamp[0] - 1, Y0 + lamp[1] - 1, 3, 3, P.YELLOW);
              g.rect(lamp[0], Y0 + lamp[1], 1, 1, P.WHITE);
            }
          }
          g.rect(0, 28, g.W, Y0 - 28, P.INK);
          g.rect(0, Y0 + T.MAP_H, g.W, 8, P.INK);
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
