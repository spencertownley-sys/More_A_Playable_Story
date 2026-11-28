// Concatenates the game's scripts, in load order, into site/play.bundle.js so
// play.html makes one script request instead of many. The files under
// src/ stay the source of truth: edit them, then run
//
//   node tools/bundle.mjs           -> rewrites site/play.bundle.js
//   node tools/bundle.mjs --check   -> exits 1 if the bundle is out of date
//
// Order matters (each file adds to the shared M object), so it is listed here.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORDER = [
  'src/core/palette.js',
  'src/core/font.js',
  'src/core/gfx.js',
  'src/core/input.js',
  'src/core/audio.js',
  'src/core/save.js',
  'src/core/script.js',
  'src/core/dialog.js',
  'src/art/sprites.js',
  'src/data/art.js',
  'src/data/music.js',
  'src/data/voicemail-data.js',
  'src/story/cast.js',
  'src/story/voicemail.js',
  'src/story/prologue.js',
  'src/story/chapter1.js',
  'src/story/chapter2.js',
  'src/factory/parts.js',
  'src/factory/chapters.js',
  'src/factory/engine.js',
  'src/factory/draw.js',
  'src/scenes/intro.js',
  'src/scenes/prologue.js',
  'src/scenes/factory.js',
  'src/scenes/chapter-end.js',
  'src/main.js',
];

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [relative(root, p)] : [];
  });
}
const missing = walk(join(root, 'src')).filter((f) => !ORDER.includes(f));
if (missing.length) {
  console.error('Not listed in tools/bundle.mjs ORDER: ' + missing.join(', '));
  process.exit(1);
}

const out = ORDER.map((f) => `/* ${f} */\n${readFileSync(join(root, f), 'utf8').replace(/\s+$/, '')}\n`).join(';\n');
const target = join(root, 'site/play.bundle.js');

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(target, 'utf8'); } catch (e) { /* missing */ }
  if (current !== out) {
    console.error('site/play.bundle.js is out of date: run node tools/bundle.mjs');
    process.exit(1);
  }
  console.log('site/play.bundle.js is up to date');
} else {
  writeFileSync(target, out);
  console.log(`site/play.bundle.js: ${ORDER.length} scripts, ${(out.length / 1024).toFixed(0)} KB`);
}
