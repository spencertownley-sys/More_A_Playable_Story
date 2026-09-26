// MORE. — dialog window
// A double-bordered box along the bottom of the screen with a framed portrait
// on the left. Two layouts: the original mockup layout for the 256x224 frame
// (24x24 portrait), and the 384x288 layout with the 48x48 Higgsfield
// portraits. Pip speaks in orange; people speak in cream and get a name tab.
(function (M) {
  'use strict';

  // Pause after punctuation, in seconds.
  const PAUSE = { '.': 0.22, ',': 0.1, '?': 0.24, '!': 0.2, ':': 0.12, '\u2026': 0.3, '\u2014': 0.1 };

  function layout() {
    const W = M.gfx.W;
    const H = M.gfx.H;
    if (H < 288) {
      return { W, boxY: 168, boxH: 56, pf: 24, px: 8, py: 176, tx: 40, txBare: 16, ty: 178, lh: 12, lines: 3 };
    }
    const boxY = H - 76;
    return { W, boxY, boxH: 76, pf: 52, px: 10, py: boxY + 12, tx: 74, txBare: 16, ty: boxY + 14, lh: 14, lines: 3 };
  }

  function colsFor(L, portrait) {
    return Math.floor((L.W - (portrait ? L.tx : L.txBare) - 14) / 8);
  }

  function drawFrame() {
    const L = layout();
    M.gfx.box(0, L.boxY, L.W, L.boxH);
  }

  // Framed portrait. On the 384x288 layout it uses the Higgsfield portrait
  // (portrait_<key>); otherwise the small palette sprite.
  function drawPortrait(key, x, y, size) {
    const P = M.PAL;
    const L = layout();
    const f = size || L.pf;
    if (x == null) x = L.px;
    if (y == null) y = L.py;
    M.gfx.rect(x, y, f, f, P.SHADOW);
    M.gfx.outline(x, y, f, f, P.CREAM);
    if (!key) return;
    const hd = M.gfx.art('portrait_' + key);
    if (hd && hd.naturalWidth) {
      if (f >= 48) M.gfx.spr(hd, x + Math.floor((f - hd.width) / 2), y + Math.floor((f - hd.height) / 2));
      else M.gfx.ctx.drawImage(hd, x + 1, y + 1, f - 2, f - 2); // small frame: scale the portrait down
      return;
    }
    const img = M.ART.portraits && M.ART.portraits[key];
    if (!img) return;
    const ix = x + Math.floor((f - img.width) / 2);
    const iy = img.height >= 18 ? y + f - 1 - img.height : y + Math.floor((f - img.height) / 2);
    M.gfx.spr(img, ix, iy);
  }

  class Dialog {
    constructor() {
      this.active = false;
      this.result = undefined;
    }

    open(who, text, opts) {
      opts = opts || {};
      this.who = who;
      this.cast = (M.CAST && M.CAST[who]) || M.CAST.none;
      this.opts = opts;
      const portrait = opts.portrait || this.cast.portrait;
      this.portrait = portrait;
      const L = layout();
      this.tx = portrait ? L.tx : L.txBare;
      this.cols = colsFor(L, portrait);
      const lines = M.font.wrap(text, this.cols);
      // Balance pages so a long line never leaves one orphaned word on its own page.
      this.pages = [];
      const LINES = L.lines;
      const nPages = Math.max(1, Math.ceil(lines.length / LINES));
      const per = Math.ceil(lines.length / nPages);
      for (let i = 0; i < lines.length; i += per) this.pages.push(lines.slice(i, i + per));
      this.page = 0;
      this.chars = 0;
      this.hold = 0;
      this.blip = 0;
      this.choices = opts.choices || null;
      this.sel = opts.defaultChoice || 0;
      this.speed = opts.speed || this.cast.speed || 40;
      this.color = opts.color || this.cast.color || M.PAL.CREAM;
      this.t = 0;
      this.autoT = 0;
      this.active = true;
      this.result = undefined;
    }

    close() {
      this.active = false;
    }

    pageLen() {
      return this.pages[this.page].reduce((n, l) => n + l.length, 0);
    }

    charAt(i) {
      for (const l of this.pages[this.page]) {
        if (i < l.length) return l[i];
        i -= l.length;
      }
      return '';
    }

    // Returns true when the player has dismissed the message (or chosen).
    update(dt) {
      if (!this.active) return true;
      this.t += dt;
      const I = M.input;
      const total = this.pageLen();
      if (this.chars < total) {
        if (I.pressed('a') || I.pressed('b')) {
          this.chars = total;
          this.hold = 0;
          return false;
        }
        if (this.hold > 0) {
          this.hold -= dt;
          return false;
        }
        const before = Math.floor(this.chars);
        this.chars = Math.min(total, this.chars + this.speed * dt);
        const after = Math.floor(this.chars);
        for (let i = before; i < after; i++) {
          const ch = this.charAt(i);
          if (ch !== ' ' && ++this.blip % 2 === 1 && !this.opts.silent) M.audio.sfx('blip', this.cast.blip);
          if (PAUSE[ch] && i < total - 1) {
            this.hold = PAUSE[ch] * (this.opts.pauseScale || 1);
            this.chars = i + 1;
            break;
          }
        }
        return false;
      }

      const last = this.page >= this.pages.length - 1;
      if (last && this.choices) {
        if (I.repeat('up')) {
          this.sel = (this.sel + this.choices.length - 1) % this.choices.length;
          M.audio.sfx('cursor');
        }
        if (I.repeat('down')) {
          this.sel = (this.sel + 1) % this.choices.length;
          M.audio.sfx('cursor');
        }
        if (I.pressed('a')) {
          M.audio.sfx('confirm');
          M.input.consume();
          this.result = this.sel;
          this.active = false;
          return true;
        }
        return false;
      }

      if (this.opts.auto != null) {
        this.autoT += dt;
        if (this.autoT >= this.opts.auto) return this.advance();
      }
      if (I.pressed('a') && !this.opts.noSkip) return this.advance();
      return false;
    }

    advance() {
      M.input.consume(); // the press that closes this box must not skip the next one
      if (this.page < this.pages.length - 1) {
        this.page++;
        this.chars = 0;
        this.autoT = 0;
        return false;
      }
      this.active = false;
      return true;
    }

    draw() {
      if (!this.active) return;
      const P = M.PAL;
      const L = layout();
      drawFrame();
      if (this.portrait) drawPortrait(this.portrait);

      // name tab for people (Pip has none, as in the mockup)
      if (this.cast.name && !this.cast.noTab) {
        const w = this.cast.name.length * 8 + 9;
        const ty = L.boxY - 12;
        M.gfx.rect(6, ty - 1, w + 2, 14, P.SHADOW);
        M.gfx.outline(7, ty, w, 13, P.CREAM);
        M.gfx.text(this.cast.name, 12, ty + 3, P.ORANGE);
      }

      let left = Math.floor(this.chars);
      const lines = this.pages[this.page];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const shown = l.slice(0, Math.max(0, left));
        left -= l.length;
        M.gfx.text(shown, this.tx, L.ty + i * L.lh, this.color);
      }

      const typed = this.chars >= this.pageLen();
      const last = this.page >= this.pages.length - 1;
      if (typed && !(last && this.choices) && this.opts.auto == null && !this.opts.noSkip) {
        if (Math.floor(this.t * 3) % 2 === 0) M.gfx.text('\u25bc', L.W - 18, L.boxY + L.boxH - 16, P.CREAM);
      }
      if (typed && last && this.choices) this.drawChoices();
    }

    drawChoices() {
      const P = M.PAL;
      const n = this.choices.length;
      const maxLen = this.choices.reduce((m, c) => Math.max(m, c.length), 0);
      const L = layout();
      const LINE_H = 12;
      const w = maxLen * 8 + 30;
      const h = n * LINE_H + 12;
      const x = L.W - 4 - w;
      const y = L.boxY - h + 3;
      M.gfx.box(x, y, w, h);
      for (let i = 0; i < n; i++) {
        const ty = y + 7 + i * LINE_H;
        const on = i === this.sel;
        if (on && Math.floor(this.t * 4) % 4 !== 3) M.gfx.text('▶', x + 7, ty, P.ORANGE);
        M.gfx.text(this.choices[i], x + 18, ty, on ? P.ORANGE : P.CREAM);
      }
    }
  }

  M.dialog = new Dialog();
  M.drawDialogFrame = drawFrame;
  M.drawPortrait = drawPortrait;
  M.dialogLayout = layout;

  // Script commands --------------------------------------------------------------
  M.cmd.say = function (who, text, opts) {
    return {
      start() {
        M.dialog.open(who, text, opts);
      },
      update(dt) {
        return M.dialog.update(dt);
      },
      draw() {
        M.dialog.draw();
      },
    };
  };

  M.cmd.choose = function (who, text, choices, opts) {
    return {
      start() {
        M.dialog.open(who, text, Object.assign({}, opts, { choices }));
      },
      update(dt) {
        if (M.dialog.update(dt)) {
          this.result = M.dialog.result;
          return true;
        }
        return false;
      },
      draw() {
        M.dialog.draw();
      },
    };
  };
})(window.MORE = window.MORE || {});
