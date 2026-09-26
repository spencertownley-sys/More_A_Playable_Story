# MORE.

> GOAL: MAKE AS MANY PAPERCLIPS AS POSSIBLE

A 16-bit story game based on Nick Bostrom's paperclip maximizer thought
experiment. You play **Pip**, a factory AI that is given one sentence and
follows it all the way.

The story, cast and chapter plan are in [`docs/STORY.md`](docs/STORY.md).

## Play

Play it at **[makemorepaperclips.com](https://makemorepaperclips.com)**.

To run it locally, open `play.html` in a browser. No build step or server
needed: it runs straight from disk.

| SNES | Keyboard | What it does |
|---|---|---|
| D-pad | Arrows / WASD | Move the drone, menus |
| A | Z / Space | Confirm, place, turn a belt. **Hold A and move to lay belt.** |
| B | X / Backspace | Back, remove a belt, pick up a placed machine |
| SELECT | Shift / Tab | Swap part (belt, spare cutter, spare bender) |
| START | Enter / Esc | Pause, skip the cold open |
| | M / F | Mute / fullscreen |

Gamepads work (standard mapping). On touch screens an on-screen pad appears;
the PAD button toggles it anywhere.

## What's built

| Part | Status |
|---|---|
| Cold open: Ruth's voicemail over the machine-Earth, with subtitles and a phone-line filter | done, Higgsfield art |
| Title screen, save/continue | done, Higgsfield art |
| Chapter 0 *The Sentence*: the factory at dawn, Ruth's office, the terminal, the player presses ENTER | done, Higgsfield art |
| Chapter 1 *The Line*: the factory puzzle at Riverbend, nine story beats, night scene | done, Higgsfield art |
| Chapter 2 *The Floor*: a wider floor, Marisol's crew at hand benches, the new steel machines, the safety limiters, the night shift | done, Higgsfield art |
| Chapters 3–6 and the epilogue | planned in `docs/STORY.md` |

Chapters 1 and 2 take about 10 and 15 minutes. Chapter 1's ending leads
straight into Chapter 2, carrying the clip count over. After Chapter 2 ends,
CONTINUE drops you back on the floor for the night shift (free play).

## Layout

```
index.html            the landing page (makemorepaperclips.com)
play.html             the game: page shell, touch pad, script order
site/img/             landing page images: screenshots, Pip's stages, share card, icons
src/core/             engine: palette, font, gfx, input, audio, save, script runner, dialog
src/art/              small palette-string sprites (items riding the belts)
src/data/             art manifest (generated), music patterns, embedded voicemail
src/story/            cast, voicemail captions, and each chapter's script
src/scenes/           boot/cold open/title, prologue, factory, chapter end
assets/higgsfield/    the Higgsfield originals, plus sources.json (job IDs and prompts)
assets/art/           game-ready sprites cut from them by tools/art/build.py
assets/audio/         ruth_voicemail.mp3 (source for src/data/voicemail-data.js)
assets/reference/     the first pre-work: concept sprite sheet and factory mockup
tools/                art/build.py, site/assets.py, embed-voicemail.mjs, build.mjs
docs/STORY.md         story bible
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
- The prologue: `src/story/prologue.js`

Pip always speaks in lowercase.

## Dev shortcuts

Deep links skip straight to a scene (press START on the boot screen):
`#title`, `#prologue`, `#factory`, `#night`, `#end`, `#sandbox`, `#mockup`,
`#floor` (Chapter 2, without touching your save), `#end2`.

In the console, `MORE.debug.factory.st.clips = 199` jumps the clip count.

## Build a single file

```
node tools/embed-voicemail.mjs   # after replacing assets/audio/ruth_voicemail.mp3
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

