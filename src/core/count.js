// MORE. — writing the clip count
// Up to a billion the count is written out in digits, then in billions. Past a
// trillion it is written in powers of ten, the way Pip changes it in Chapter 5: 3.21 x 10 with the
// power raised.
(function (M) {
  'use strict';

  const SCI_FROM = 1e12;

  // { digits } below a trillion, { mantissa, power } from there on.
  function parts(n, sci) {
    n = Math.max(0, n);
    if (!sci && n < 1e9) return { digits: Math.floor(n).toLocaleString('en-US') };
    // from a billion the digits no longer fit the HUD's box
    if (!sci && n < SCI_FROM) return { digits: (Math.floor(n / 1e7) / 100).toFixed(n < 1e11 ? 2 : 1) + ' BILLION' };
    let power = Math.floor(Math.log10(Math.max(1, n)));
    let mantissa = Math.floor((n / Math.pow(10, power)) * 100) / 100;
    if (mantissa >= 10) {
      mantissa /= 10;
      power++;
    }
    return { mantissa: mantissa.toFixed(2), power: String(power) };
  }

  function width(n, sci) {
    const p = parts(n, sci);
    return p.digits ? p.digits.length * 8 : (p.mantissa.length + 3 + p.power.length) * 8;
  }

  // Draw the count with its left edge at x. Returns the width used.
  function draw(n, x, y, color, sci) {
    const g = M.gfx;
    const p = parts(n, sci);
    if (p.digits) {
      g.text(p.digits, x, y, color);
      return p.digits.length * 8;
    }
    const head = p.mantissa + '×10';
    g.text(head, x, y, color);
    g.text(p.power, x + head.length * 8, y - 4, color);
    return (head.length + p.power.length) * 8;
  }

  function drawCenter(n, cx, y, color, sci) {
    return draw(n, Math.round(cx - width(n, sci) / 2), y, color, sci);
  }

  // Plain text, for saves and logs: "3.21 X 10^14".
  function text(n, sci) {
    const p = parts(n, sci);
    return p.digits || p.mantissa + ' X 10^' + p.power;
  }

  M.count = { SCI_FROM, parts, width, draw, drawCenter, text };
})(window.MORE = window.MORE || {});
