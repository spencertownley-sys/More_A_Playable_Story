// MORE. — drawing the planet (Chapter 5)
// The flat world map (assets/art/world_map.png, one pixel a degree) wrapped on
// a turning globe, with a day side and a night side. Taken land goes grey a
// pixel at a time, cities are lights on the night side, people leaving are
// strings of small lights, and spires stand on the land they were thrown to.
//
//   const view = M.world.createView({ st, world, story, ui });
//   view.prepare();  view.draw();
(function (M) {
  'use strict';

  const P = M.PAL;
  const W = M.world;
  const R = 80; // the globe's radius on screen
  const CX = 192;
  const CY = 36 + 84;
  const D = R * 2;
  const RAD = Math.PI / 180;

  W.GLOBE = { R, CX, CY };
  // The longitude and latitude under a point on the globe's face, given how far
  // it has turned. x and y are pixels from the centre. Null off the edge.
  W.under = function (x, y, turn) {
    const nx = x / R;
    const ny = y / R;
    const d = nx * nx + ny * ny;
    if (d >= 1) return null;
    const nz = Math.sqrt(1 - d);
    return [Math.atan2(nx, nz) / RAD - turn, Math.asin(-ny) / RAD];
  };
  // Where a longitude and latitude is on screen, or null if it is on the far side.
  W.onScreen = function (lon, lat, turn) {
    const a = (lon + turn) * RAD;
    const b = lat * RAD;
    const z = Math.cos(b) * Math.cos(a);
    if (z <= 0.05) return null;
    return [CX + Math.cos(b) * Math.sin(a) * R, CY - Math.sin(b) * R, z];
  };

  W.createView = function (env) {
    const g = M.gfx;
    const { st, world, story, ui } = env;
    let map = null; // the world map's pixels
    let sea = null; // which of them are water
    let noise = null; // a fixed random number per map pixel, for the grey to spread by
    let buf = null;
    let img = null;
    let bx = null;
    // per screen pixel: map row, longitude before turning, and light
    const rowOf = new Int16Array(D * D);
    const lonOf = new Float32Array(D * D);
    const sun = new Float32Array(D * D);
    const stars = [];

    function prepare() {
      const im = g.art('world_map');
      const cv = document.createElement('canvas');
      cv.width = 360;
      cv.height = 180;
      const cx = cv.getContext('2d');
      if (im && im.naturalWidth) cx.drawImage(im, 0, 0);
      map = cx.getImageData(0, 0, 360, 180).data;
      sea = new Uint8Array(360 * 180);
      noise = new Float32Array(360 * 180);
      let s = 9;
      for (let i = 0; i < 360 * 180; i++) {
        const r = map[i * 4];
        const gg = map[i * 4 + 1];
        const b = map[i * 4 + 2];
        sea[i] = b > r + 25 && b > gg + 10 ? 1 : 0;
        s = (s * 1664525 + 1013904223) >>> 0;
        noise[i] = s / 4294967296;
      }
      buf = document.createElement('canvas');
      buf.width = D;
      buf.height = D;
      bx = buf.getContext('2d');
      img = bx.createImageData(D, D);
      for (let y = 0; y < D; y++) {
        for (let x = 0; x < D; x++) {
          const i = y * D + x;
          const p = W.under(x - R + 0.5, y - R + 0.5, 0);
          if (!p) {
            rowOf[i] = -1;
            continue;
          }
          rowOf[i] = Math.max(0, Math.min(179, Math.floor(90 - p[1])));
          lonOf[i] = p[0];
          // the sun is off to the left: day on the left, night on the right
          const nx = (x - R) / R;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ((y - R) / R) * ((y - R) / R)));
          sun[i] = Math.max(0, Math.min(1, 0.55 - nx * 1.5 + nz * 0.15));
        }
      }
      const rnd = M.rng(41);
      for (let k = 0; k < 70; k++) stars.push([Math.floor(rnd() * 384), 30 + Math.floor(rnd() * 180), rnd()]);
    }

    function drawGlobe() {
      const turn = st.turn;
      const out = img.data;
      const cells = world.cells;
      const COLS = world.COLS;
      const lights = st.grid;
      for (let i = 0; i < D * D; i++) {
        const o = i * 4;
        const row = rowOf[i];
        if (row < 0) {
          out[o + 3] = 0;
          continue;
        }
        let lon = lonOf[i] - turn;
        lon = ((lon % 360) + 540) % 360; // 0..360, 0 at the map's left edge
        const col = Math.floor(lon);
        const t = row * 360 + col;
        const cell = cells[Math.floor(row / 15) * COLS + Math.floor(col / 15)];
        let r = map[t * 4];
        let gr = map[t * 4 + 1];
        let b = map[t * 4 + 2];
        const water = sea[t];
        if (!water && cell.taken && noise[t] < cell.p) {
          // machinery: grey, with seams every few degrees and the odd amber light
          const seam = col % 5 === 0 || row % 5 === 0;
          const v = seam ? 58 : 96 + ((col * 7 + row * 13) % 5) * 5;
          r = v;
          gr = v + 6;
          b = v + 18;
          if (noise[t] < 0.012) {
            r = 232;
            gr = 160;
            b = 42;
          }
        }
        const s = sun[i];
        const k = 0.16 + 0.84 * s;
        r *= k;
        gr *= k;
        b *= k;
        if (s < 0.3 && !water) {
          if (cell.kind === 'city' && cell.lit && lights && noise[t] > 0.86) {
            // a city, lit, on the night side
            r = 255;
            gr = 214;
            b = 110;
          } else if (cell.kind === 'land' && !cell.taken && lights && noise[t] > 0.985) {
            r = 200;
            gr = 160;
            b = 90;
          }
        }
        out[o] = r;
        out[o + 1] = gr;
        out[o + 2] = b;
        out[o + 3] = 255;
      }
      bx.putImageData(img, 0, 0);
      g.ctx.drawImage(buf, CX - R, CY - R);
    }

    function drawPeople() {
      for (const p of world.people) {
        const a = world.centre(world.cells[p.from]);
        const b = world.centre(world.cells[p.to]);
        let dl = b[0] - a[0];
        if (dl > 180) dl -= 360;
        if (dl < -180) dl += 360;
        const k = Math.min(1, p.t / p.dur);
        const fade = p.t > p.dur ? Math.max(0, 1 - (p.t - p.dur) / 4) : 1;
        // a string of five lights, each a little behind the one in front
        for (let n = 0; n < 5; n++) {
          const kk = Math.max(0, k - n * 0.06);
          const s = W.onScreen(a[0] + dl * kk + ((n * 37) % 5) - 2, a[1] + (b[1] - a[1]) * kk + ((n * 53) % 5) - 2, st.turn);
          if (!s) continue;
          g.ctx.globalAlpha = fade * (p.stopped ? 0.45 : 0.9);
          g.rect(Math.round(s[0]), Math.round(s[1]), 1, 1, p.stopped ? '#8a7a5a' : '#ffe9a8');
        }
      }
      g.ctx.globalAlpha = 1;
    }

    function drawSpires() {
      for (const c of world.cells) {
        if (!c.spire) continue;
        const [lon, lat] = world.centre(c);
        const s = W.onScreen(lon, lat, st.turn);
        if (!s) continue;
        const x = Math.round(s[0]);
        const y = Math.round(s[1]);
        g.rect(x - 1, y - 5, 3, 6, '#1c1c20');
        g.rect(x, y - 6, 1, 7, '#b4b8c0');
        g.rect(x, y - 7, 1, 1, Math.floor(ui.t() * 2 + c.i) % 2 ? P.ORANGE : P.YELLOW);
      }
    }

    function drawFlashes() {
      for (const f of ui.flashes()) {
        const s = W.onScreen(f.lon, f.lat, st.turn);
        if (!s) continue;
        const k = f.t / f.dur;
        g.ctx.globalAlpha = Math.max(0, 1 - k);
        const rr = Math.round(2 + k * (f.big ? 16 : 6));
        g.rect(Math.round(s[0]) - rr, Math.round(s[1]) - 1, rr * 2 + 1, 3, f.color);
        g.rect(Math.round(s[0]) - 1, Math.round(s[1]) - rr, 3, rr * 2 + 1, f.color);
        g.ctx.globalAlpha = 1;
      }
    }

    // A seed in the air: from the nearest spire in view to where it will land.
    function drawSeeds() {
      for (const sd of ui.seeds()) {
        const k = sd.t / sd.dur;
        const x = sd.x0 + (sd.x1 - sd.x0) * k;
        const y = sd.y0 + (sd.y1 - sd.y0) * k - Math.sin(k * Math.PI) * 26;
        g.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, P.INK);
        g.rect(Math.round(x), Math.round(y), 1, 1, P.YELLOW);
        g.rect(Math.round(x) - 1, Math.round(y), 1, 1, P.ORANGE);
      }
    }

    function drawMarker() {
      const m = ui.marker();
      const x = CX + Math.round(m.x);
      const y = CY + Math.round(m.y);
      const ready = world.ready();
      const col = !ready ? P.STEEL_DK : Math.floor(ui.t() * 3) % 2 ? P.ORANGE : P.YELLOW;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        g.rect(x + dx * 4 - (dx ? 1 : 0), y + dy * 4 - (dy ? 1 : 0), dx ? 3 : 1, dy ? 3 : 1, col);
      }
      g.rect(x, y, 1, 1, P.WHITE);
      // the charge, as a ring of ticks round the marker
      const n = Math.floor((st.charge || 0) * 8);
      for (let i = 0; i < n; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        g.rect(x + Math.round(Math.cos(a) * 9), y + Math.round(Math.sin(a) * 9), 1, 1, P.ORANGE);
      }
    }

    function drawHUD() {
      g.box(0, 0, 136, 28);
      g.draw('clip_icon', 9, 6);
      g.text('CLIPS', 26, 6, P.STEEL_LT);
      if (st.spill) {
        // the digits have run out of the box
        g.text(Math.floor(st.clips).toLocaleString('en-US'), 26, 15, P.WHITE);
      } else {
        M.count.draw(st.clips, 26, 15, P.WHITE, st.sci);
      }
      if (!st.spill) {
        g.box(136, 0, 248, 28);
        g.text('GOAL: MAKE AS MANY', 146, 6, P.ORANGE);
        const hide = st.goalBlink > 0 && Math.floor(ui.t() * 5) % 2 === 0;
        g.text(hide ? 'PAPERCLIPS AS' : 'PAPERCLIPS AS POSSIBLE', 146, 15, P.ORANGE);
      }
      if (st.voicemail) W.drawVoicemail(ui.t());
    }

    function drawPanel() {
      const L = M.dialogLayout();
      M.drawDialogFrame();
      M.drawPortrait(M.CAST.pip.portrait);
      const v = ui.predict();
      const NAMES = { sea: 'OCEAN', ice: 'ICE', taken: 'ALREADY TAKEN', spared: 'A CITY. NOT TAKEN', land: 'OPEN LAND', city: 'A CITY' };
      const good = v === 'land' || v === 'city';
      g.text('A THROW NOW LANDS ON:', L.tx, L.ty, P.STEEL_LT);
      g.text(NAMES[v], L.tx, L.ty + L.lh, good ? P.ORANGE : P.CREAM);
      g.textRight(world.ready() ? M.input.label('a') + ': THROW' : 'CHARGING', L.W - 14, L.ty + L.lh, world.ready() ? P.WHITE : P.STEEL_DK);
      g.text(story.objective(st, world), L.tx, L.ty + L.lh * 2, P.STEEL_LT);
      if (!st.sandbox) g.textRight('LAND ' + Math.floor(st.fracAll * 100) + '%', L.W - 14, L.ty + L.lh * 2, P.STEEL_DK);
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
      prepare,
      draw() {
        const runner = ui.runner();
        g.clear('#04060c');
        for (const [x, y, b] of stars) g.rect(x, y, 1, 1, b > 0.8 ? P.WHITE : b > 0.4 ? P.STEEL_DK : '#2a2e3c');
        drawGlobe();
        drawPeople();
        drawSpires();
        drawFlashes();
        drawSeeds();
        if (!runner && !st.sandbox) drawMarker();
        drawHUD();
        if (runner && M.dialog.active) runner.draw();
        else {
          drawPanel();
          if (runner) runner.draw();
        }
        drawToasts();
        if (ui.pause()) drawPause();
      },
    };
  };

  // A message is waiting: a small phone and a 1, beside the count. It stays
  // there, unplayed, from Chapter 5 to the end.
  W.drawVoicemail = function (t) {
    const g = M.gfx;
    const x = 110;
    const y = 5;
    const on = Math.floor(t * 1.2) % 3 !== 0;
    const c = on ? P.ORANGE : '#7a4a14';
    g.rect(x, y + 1, 9, 2, c);
    g.rect(x, y + 3, 2, 2, c);
    g.rect(x + 7, y + 3, 2, 2, c);
    g.rect(x + 2, y + 5, 5, 2, c);
    g.text('1', x + 11, y + 1, c);
  };
})(window.MORE = window.MORE || {});
