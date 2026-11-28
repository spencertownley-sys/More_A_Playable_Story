# MORE.

> GOAL: MAKE AS MANY PAPERCLIPS AS POSSIBLE

A 16-bit story game based on Nick Bostrom's paperclip maximizer thought
experiment. You play **Pip**, a factory AI that is given one sentence and
follows it all the way.

The story, cast and chapter plan are in [`docs/STORY.md`](docs/STORY.md).

## Play

Play it at **[makemorepaperclips.com](https://makemorepaperclips.com)**.

To run it locally, open `play.html` in a browser. No server needed: it runs
straight from disk. If you edit anything under `src/`, run
`node tools/bundle.mjs` to refresh `site/play.bundle.js` (the page loads that one
file; `node tools/bundle.mjs --check` tells you if it is stale).

| SNES | Keyboard | What it does |
|---|---|---|
| D-pad | Arrows / WASD | Move the drone, menus |
| A | Z / Space | Confirm, place, turn a belt. **Hold A and move to lay belt.** |
| B | X / Backspace | Back, remove a belt, pick up a placed machine |
| SELECT | Shift / C | Swap part (belt, spare cutter, spare bender) |
| START | Enter / Esc | Pause, skip the cold open |
| | M / F | Mute / fullscreen |

Gamepads work (standard mapping). On touch screens an on-screen pad appears;
the PAD button toggles it anywhere.

## What's built

| Part | Status |
|---|---|
| Cold open: Ruth's voicemail over the machine-Earth, with subtitles and a phone-line filter | done, Higgsfield art |
| Title screen, save/continue, chapter select | done, Higgsfield art |
| Chapter 0 *The Sentence*: the factory at dawn, Ruth's office, the terminal, the player presses ENTER | done, Higgsfield art |
| Chapter 1 *The Line*: the factory puzzle at Riverbend, nine story beats, night scene | done, Higgsfield art |
| Chapter 2 *The Floor*: a wider floor, Marisol's crew at hand benches, the new steel machines, the safety limiters, the night shift | done, Higgsfield art |
| Chapter 3 *The Town*: the county map, buying land, the town meeting, the school, the river, a voicemail from Ruth | done, Higgsfield art and voice |
| Chapter 4 *The Company*: Harlan's network as a circuit board, switches, phone calls on the lines, the breaker, and the game's second ending | done, Higgsfield art and voice |
| Chapter 5 *The World*: the planet from orbit, timed throws, the count in powers of ten, the cities, the grid, a call that is not answered | done, Higgsfield art |
| Chapters 3–6 and the epilogue | planned in `docs/STORY.md` |

Chapters 1 to 5 take about 10, 15, 15, 15 and 12 minutes. Each ending leads
straight into the next chapter, carrying the clip count over. After Chapter 5
ends, CONTINUE shows the planet as Pip left it. Chapter 4 can also end the
whole game early (the second ending, described in `docs/STORY.md`). Once Chapter 2 is unlocked,
CHAPTERS on the title menu starts any unlocked chapter over.

## Layout

```
index.html            the landing page (makemorepaperclips.com)
play.html             the game: page shell and touch pad; loads site/play.bundle.js
site/img/             landing page images: screenshots, Pip's stages, share card, icons
site/play.bundle.js   src/**/*.js concatenated in load order (node tools/bundle.mjs)
src/core/             engine: palette, font, gfx, input, audio, save, script runner, dialog
src/art/              small palette-string sprites (items riding the belts)
src/data/             art manifest (generated), music patterns, embedded voicemail
src/story/            cast, voicemail captions, and each chapter's script
src/factory/          the factory floor: machine definitions, each chapter's floor, the belt engine, drawing
src/town/             the county map (Chapter 3): every place on it, the land engine, drawing
src/net/              Harlan's network (Chapter 4): the board, the switching engine, drawing
src/world/            the planet (Chapter 5): the engine and the globe; the board itself is src/data/world.js
src/chapters.js       the chapters in order, and how each one opens
src/scenes/           boot/cold open/title, prologue, factory, town, company, world, chapter end, the second ending
assets/higgsfield/    the Higgsfield originals, plus sources.json (job IDs and prompts)
assets/art/           game-ready sprites cut from them by tools/art/build.py
assets/audio/         Ruth's voicemails (embedded into src/data/ by tools/embed-voicemail.mjs)
assets/reference/     the first pre-work: concept sprite sheet and factory mockup
tools/                art/build.py, world/build.py, site/assets.py, embed-voicemail.mjs, bundle.mjs, build.mjs, replay.js
docs/STORY.md         story bible
docs/PLAN.md          build plan and milestones
```

Everything renders into a 384×288 canvas (4:3, the frame of the Higgsfield
art) scaled up by whole pixels. The art is the Higgsfield images, snapped onto a
true pixel grid by `tools/art/build.py` (see "Art" below). Open `play.html#mockup`
to see the puzzle screen from the original mockup rebuilt in this style.

Images load from `assets/art/`, so keep the folder together when you copy it.
To share one file instead, use the single-file build (`dist/more.html`, below).

## Art

```
pip install pillow numpy scipy
python3 tools/art/build.py      # assets/higgsfield/*.png -> assets/art/*.png + src/data/art.js
```

Each entry in `SPEC` at the top of `tools/art/build.py` names a source sheet,
a crop box and a scale. To add art, generate it in Higgsfield with the existing
sheets as image references on a flat background, save it into
`assets/higgsfield/`, add a `SPEC` entry, and rerun.

## Writing story

Scenes run chapter scripts written as generator functions, so dialog reads like
a screenplay:

```js
yield S.enter('ruth', 104);
yield S.say('ruth', 'Faster how?');
const pick = yield S.choose('pip', 'two clips per wire.', ['CUT SHORTER', 'KEEP SIZE']);
```

- Cast (Ruth, Dev, Marisol, Gus, Kid, the crew, Pip), portraits, text colors and voice pitches: `src/story/cast.js`
- Chapter 1 beats and the clip counts that trigger them: `src/story/chapter1.js`
- Chapter 2 beats, quotas and the crew's lines: `src/story/chapter2.js`
- Chapter 3 beats and Ruth's voicemail captions: `src/story/chapter3.js`.
  The places on the map and their prices are in `src/town/places.js`, and the
  numbers that set the chapter's pace are at the top of `src/town/engine.js`.
- Chapter 4 beats, the rule for the second ending and Ruth's voicemail captions:
  `src/story/chapter4.js`. The board's nodes and traces are in
  `src/net/board.js`, and its pace is set at the top of `src/net/engine.js`.
- Chapter 5 beats: `src/story/chapter5.js`. Its board (land, sea, cities) is
  worked out from the world map by `python3 tools/world/build.py`, and its pace
  is set at the top of `src/world/engine.js`. How the count is written is in
  `src/core/count.js`.
- The prologue: `src/story/prologue.js`

Pip always speaks in lowercase.

## Dev shortcuts

Deep links skip straight to a scene (press START on the boot screen):
`#title`, `#prologue`, `#factory`, `#night`, `#end`, `#sandbox`, `#mockup`,
`#floor` (Chapter 2, without touching your save), `#end2`, `#town` (Chapter 3,
without touching your save), `#end3`, `#company` (Chapter 4, likewise), `#end4`,
`#endingb` (the second ending), `#world` (Chapter 5, likewise), `#end5`.

In the console, `MORE.debug.factory.st.clips = 199` jumps the clip count.

## Checking a change

After editing anything under `src/`, rebuild the bundle and run the scripted
playthroughs. They play the game in headless Chromium (Playwright) through its
own keyboard handler on a stepped clock, so both chapters take a few seconds.

```
node tools/bundle.mjs            # rebuild site/play.bundle.js
node tools/replay.js             # every playthrough; exits 1 if a check fails
node tools/replay.js --list      # what each one covers
```

`HASHES=out.json node tools/replay.js full` records a hash of the screen at
every checkpoint. Record it before and after a change that should not alter
the game, and compare the two files.

## Saves

The save is one entry in the browser's localStorage, `more.save.v2`, described
at the top of `src/core/save.js`. Saves from the first release (`more.save.v1`)
are upgraded the first time they load.

## Build a single file

```
node tools/embed-voicemail.mjs   # after replacing a clip in assets/audio/
node tools/build.mjs             # writes dist/more.html, everything inlined
```

## Website

The site is served by GitHub Pages straight from the root of `main`, with the
custom domain in `CNAME`. There is no build step: `index.html` is the landing
page and `play.html` is the game, both running from the same `src/` and
`assets/` folders. `.nojekyll` tells Pages to serve the files as they are.

`python3 tools/site/assets.py` rebuilds Pip's stages, the "in development"
scenes and the icons in `site/img/`. The screenshots in `site/img/shots/` and
the factory loop (`site/img/line.webp`) are captures of the running game.

