// MORE. — the county map (Chapter 3): every place Riverbend can buy
// The map art (assets/art/county_map.png, 384x168) is one painting. Each place
// is a rectangle on it, in units of 6 map pixels: [id, name, x, y, w, h, kind,
// price]. Prices are in thousands of dollars before the town works out who is
// buying. To move a boundary, change the numbers here; nothing else knows them.
(function (M) {
  'use strict';

  const U = 6;
  // kind: what stands there. It decides who has to leave, and what the place
  // gives Riverbend once it is owned.
  const RAW = [
    ['riverbend', 'RIVERBEND PAPERCLIP CO.', 43, 8, 5, 7, 'riverbend', 0],
    ['woodlot', "HALVORSEN'S WOODLOT", 41, 4, 7, 4, 'woods', 3],
    ['riverlot', 'THE RIVER LOT', 43, 15, 5, 3, 'land', 3],
    ['ridge', 'PINE RIDGE', 34, 0, 14, 4, 'woods', 6],
    ['woods_s', 'THE PINE WOODS', 18, 4, 18, 4, 'woods', 8],
    ['woods_w', 'THE WEST WOODS', 18, 0, 16, 4, 'woods', 7],
    ['farm_n', "HALVORSEN'S NORTH FIELD", 0, 0, 18, 5, 'farm', 10],
    ['farm_barn', "HALVORSEN'S BARN", 0, 5, 12, 4, 'farm', 9],
    ['farm_house', "HALVORSEN'S HOUSE", 12, 5, 6, 4, 'home', 12],
    ['farm_s', "HALVORSEN'S SOUTH FIELD", 0, 9, 18, 5, 'farm', 10],
    ['meadow', 'THE MEADOW', 0, 14, 13, 4, 'land', 5],
    ['exchange', 'THE PHONE EXCHANGE', 13, 14, 5, 4, 'exchange', 0],
    ['quarry', 'DUNMORE QUARRY', 0, 18, 16, 10, 'quarry', 40],
    ['substation', 'THE COUNTY SUBSTATION', 16, 18, 8, 6, 'power', 16],
    ['scrap', "GUS'S SCRAPYARD", 16, 24, 8, 4, 'scrap', 15],
    ['tower', 'THE WATER TOWER', 36, 4, 5, 4, 'water', 45],
    ['diner', "DOT'S DINER", 18, 8, 6, 5, 'shop', 14],
    ['library', 'THE LIBRARY', 24, 8, 6, 5, 'library', 0],
    ['school', 'RIVERBEND ELEMENTARY', 30, 8, 4, 5, 'school', 0],
    ['hardware', 'THE HARDWARE STORE', 34, 8, 5, 5, 'shop', 12],
    ['barber', 'THE BARBER SHOP', 39, 8, 4, 5, 'shop', 10],
    ['road', 'MAIN STREET', 18, 13, 25, 2, 'public', 0],
    ['bakery', 'THE BAKERY', 18, 15, 5, 3, 'shop', 10],
    ['dime', 'THE FIVE AND DIME', 23, 15, 5, 3, 'shop', 10],
    ['grocer', 'THE GROCER', 28, 15, 4, 3, 'shop', 12],
    ['pharmacy', 'THE PHARMACY', 32, 15, 5, 3, 'shop', 12],
    ['florist', 'THE FLORIST', 37, 15, 6, 3, 'shop', 9],
    ['mill1', '2 TO 8 MILL STREET', 24, 18, 4, 7, 'home', 22],
    ['mill2', '10 TO 16 MILL STREET', 28, 18, 5, 7, 'home', 22],
    ['mill3', '18 TO 24 MILL STREET', 33, 18, 4, 7, 'home', 22],
    ['mill4', '26 TO 32 MILL STREET', 37, 18, 5, 7, 'home', 22],
    ['marisol', '34 MILL STREET', 42, 18, 6, 7, 'home', 22],
    ['rail', 'THE RAIL YARD', 24, 25, 24, 3, 'rail', 10],
    ['bridge', 'THE BRIDGE', 48, 13, 5, 2, 'public', 0],
    ['hilltop', 'THE HILL ROAD', 53, 0, 4, 5, 'land', 4],
    ['ruth', "RUTH'S HOUSE", 57, 0, 7, 5, 'ruth', 0],
    ['hill', 'THE HILL', 53, 5, 11, 9, 'woods', 8],
    ['east', 'THE EAST WOODS', 53, 14, 11, 14, 'woods', 9],
  ];

  const PLACES = RAW.map(([id, name, x, y, w, h, kind, price]) => ({ id, name, x: x * U, y: y * U, w: w * U, h: h * U, kind, price }));

  // Places share a boundary if their rectangles touch along at least 6 pixels.
  const touch = (a, b) => {
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return (ox === 0 && oy >= U) || (oy === 0 && ox >= U);
  };
  for (const p of PLACES) p.next = PLACES.filter((q) => q !== p && touch(p, q)).map((q) => q.id);

  M.town = {
    PLACES,
    MAP_W: 384,
    MAP_H: 168,
    MAP_Y: 36, // where the map sits on screen, under the HUD
    RIVER: { x: 48 * U, w: 5 * U }, // the river's strip of the map
    // A factory block is 24 pixels square; a place holds as many as fit.
    blocks: (p) => Math.max(1, Math.floor(p.w / 24) * Math.floor(p.h / 24)),
  };
})(window.MORE = window.MORE || {});
