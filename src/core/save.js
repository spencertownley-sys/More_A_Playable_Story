// MORE. — save data (browser localStorage; the game runs fine without it)
//
// Version 2:
//   chapter    the chapter the player is in
//   done       { 1: true, ... } chapters finished
//   unlocked   the highest chapter that can be started from the title menu
//   entry      { 1: 0, 2: 767, ... } the clip count on entering each chapter
//   clips      the clip count, as a string of digits so it can outgrow a number
//   refusals   { 1: 2, ... } times the player said no to Pip, by chapter
//   shorter    Pip cuts the wire short (chosen in Chapter 1, kept for good)
//   board      the current chapter's own state: flags, layout, crew and so on
// Version 1 saves (Chapters 1 and 2 as first released) are upgraded on load.
(function (M) {
  'use strict';

  const KEY = 'more.save.v2';
  const OLD_KEY = 'more.save.v1';
  const BOARD = ['flags', 'inv', 'fasterAsked', 'nextFaster', 'layout', 'full', 'base', 'crew', 'speed', 'cold', 'concrete', 'sentOrder', 'packed', 'limitAsked', 'nextLimit'];

  function upgrade(o) {
    const chapter = o.chapter || 1;
    const done = {};
    if (o.chapter1Done) done[1] = true;
    if (o.chapter2Done) done[2] = true;
    const entry = { 1: 0 };
    if (chapter === 2) entry[2] = o.base || 0;
    const board = {};
    for (const k of BOARD) if (o[k] !== undefined) board[k] = o[k];
    return {
      v: 2,
      savedAt: o.savedAt,
      chapter,
      done,
      unlocked: Math.max(chapter, done[1] ? 2 : 1),
      entry,
      clips: String(Math.floor(o.clips || 0)),
      refusals: {}, // not counted before version 2
      shorter: !!o.shorter,
      board,
    };
  }

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function load() {
    const s = read(KEY);
    if (s && s.v === 2) return s;
    const old = read(OLD_KEY);
    if (!old) return null;
    const up = upgrade(old);
    try {
      localStorage.setItem(KEY, JSON.stringify(up));
      localStorage.removeItem(OLD_KEY);
    } catch (e) {
      /* keep playing from the upgraded copy */
    }
    return up;
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(Object.assign({ v: 2, savedAt: Date.now() }, data)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(OLD_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  // The save to start chapter n over from: the count goes back to what it was
  // on entering it, and that chapter and everything after it is undone. What
  // has been unlocked stays unlocked.
  function restartFrom(s, n) {
    const done = {};
    const refusals = {};
    const entry = {};
    for (const k in s.done || {}) if (+k < n) done[k] = s.done[k];
    for (const k in s.refusals || {}) if (+k < n) refusals[k] = s.refusals[k];
    for (const k in s.entry || {}) if (+k <= n) entry[k] = s.entry[k];
    if (entry[n] === undefined) entry[n] = n === 1 ? 0 : Number(s.clips) || 0;
    return {
      chapter: n,
      done,
      unlocked: s.unlocked || n,
      entry,
      clips: String(entry[n]),
      refusals,
      shorter: n > 1 && !!s.shorter,
      board: null,
    };
  }

  M.save = { load, write, clear, upgrade, restartFrom, has: () => !!load() };
})(window.MORE = window.MORE || {});
