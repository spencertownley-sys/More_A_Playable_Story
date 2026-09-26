// MORE. — cast
// The cast from the Higgsfield character sheets (assets/higgsfield/).
// portrait: art key (portrait_<key> in the art manifest).
// blip: dialog voice pitch in Hz. speed: characters per second.
(function (M) {
  'use strict';

  const P = M.PAL;

  M.CAST = {
    none: { name: null, portrait: null, color: P.CREAM, blip: 600, speed: 45 },
    caption: { name: null, portrait: null, color: P.STEEL_LT, blip: 1400, speed: 55 },
    // Pip: the wall terminal in Chapter 1, the payroll server's drone after.
    pip: { name: 'PIP', noTab: true, portrait: 'pip1', color: P.ORANGE, blip: 330, speed: 24 },
    // Ruth runs Riverbend Paperclip Co. She installs Pip and writes the sentence.
    ruth: { name: 'RUTH', portrait: 'ruth', color: P.CREAM, blip: 760, speed: 40 },
    // Dev keeps the books and worries about the bank.
    dev: { name: 'DEV', portrait: 'dev', color: P.CREAM, blip: 680, speed: 44 },
    // Marisol runs the line.
    marisol: { name: 'MARISOL', portrait: 'marisol', color: P.CREAM, blip: 820, speed: 42 },
    // Gus has fixed every machine on the floor at least twice.
    gus: { name: 'GUS', portrait: 'gus', color: P.CREAM, blip: 470, speed: 34 },
    kid: { name: 'KID', portrait: 'kid', color: P.CREAM, blip: 980, speed: 46 },
  };
})(window.MORE = window.MORE || {});
