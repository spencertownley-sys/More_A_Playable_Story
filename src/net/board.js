// MORE. — Harlan's network (Chapter 4): the circuit board
// Nodes sit on a 16 x 7 grid of 24-pixel cells. Traces run outward from Pip's
// server: [from, to, corners on the way]. A locked node is the end of the line
// until enough orders have reached it; then it is a junction like any other
// and the next part of the board wakes up.
(function (M) {
  'use strict';

  const CELL = 24;
  // [id, column, row, kind, name, part of the board, orders needed to open it]
  const NODES = [
    ['pip', 0, 3, 'pip', "PIP'S SERVER", 1],
    ['a', 2, 3, 'relay', 'RELAY: HARLAN TRUNK', 1],
    ['b', 2, 1, 'relay', 'RELAY: NORTH DOCKS', 1],
    ['c', 2, 5, 'relay', 'RELAY: SOUTH DOCKS', 1],
    ['w1', 4, 1, 'depot', 'WAREHOUSES 1 TO 4', 1],
    ['w2', 0, 1, 'depot', 'WAREHOUSES 5 TO 8', 1],
    ['w3', 4, 5, 'depot', 'WAREHOUSES 9 TO 12', 1],
    ['w4', 0, 5, 'depot', 'WAREHOUSES 13 TO 16', 1],
    ['x', 6, 3, 'exchange', 'THE PHONE EXCHANGE', 1, 12],
    ['w5', 8, 1, 'depot', 'WAREHOUSES 17 TO 20', 2],
    ['w6', 8, 5, 'depot', 'WAREHOUSES 21 TO 24', 2],
    ['k', 10, 3, 'bank', 'FIRST COUNTY BANK', 2, 20],
    ['w7', 12, 1, 'depot', 'WAREHOUSES 25 TO 28', 3],
    ['w8', 12, 5, 'depot', 'WAREHOUSES 29 TO 32', 3],
    ['q', 13, 3, 'office', 'HARLAN HEAD OFFICE', 3, 20],
    ['w9', 15, 1, 'depot', 'WAREHOUSES 33 TO 36', 4],
    ['w10', 15, 5, 'depot', 'WAREHOUSES 37 TO 40', 4],
  ];
  const TRACES = [
    ['pip', 'a'],
    ['a', 'b'],
    ['a', 'x'],
    ['a', 'c'],
    ['b', 'w1'],
    ['b', 'w2'],
    ['c', 'w3'],
    ['c', 'w4'],
    ['x', 'w5', [[6, 1]]],
    ['x', 'k'],
    ['x', 'w6', [[6, 5]]],
    ['k', 'w7', [[10, 1]]],
    ['k', 'q'],
    ['k', 'w8', [[10, 5]]],
    ['q', 'w9', [[13, 1]]],
    ['q', 'w10', [[13, 5]]],
  ];
  const px = (c) => c * CELL + CELL / 2;

  M.net = {
    CELL,
    MAP_W: 384,
    MAP_H: 168,
    MAP_Y: 36,
    NODES: NODES.map(([id, c, r, kind, name, part, need]) => ({ id, x: px(c), y: px(r), kind, name, part, need: need || 0 })),
    TRACES: TRACES.map(([from, to, via]) => ({ from, to, via: (via || []).map(([c, r]) => [px(c), px(r)]) })),
    PER_DEPOT: 4, // warehouses each depot node stands for
  };
})(window.MORE = window.MORE || {});
