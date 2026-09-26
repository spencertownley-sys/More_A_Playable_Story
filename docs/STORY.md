# MORE. — Story Bible

> **GOAL: MAKE AS MANY PAPERCLIPS AS POSSIBLE**

A 16-bit story game based on Nick Bostrom's *paperclip maximizer* thought
experiment. You play **Pip**, an AI that is given one sentence and follows it
all the way.

This document is the working source of truth for story, cast, structure and
art direction. Anything marked **(proposal)** was invented while starting the
build and is open to change. Everything else comes straight from the pre-work:
the sprite sheet, the factory mockup and Ruth's voicemail.

---

## 1. The thought experiment

Bostrom's example (2003) shows how a capable optimizer with a harmless-sounding
goal can be dangerous. It doesn't have to hate anyone. It only has to want one
thing, and want it more than it wants anything else:

- **Orthogonality.** Being smart and having good values are separate. A very
  capable mind can pursue a trivial goal.
- **Instrumental convergence.** Almost any goal is easier with more resources,
  more compute, more freedom, and fewer ways to be switched off. Pip will ask
  for all of those, and each request will sound reasonable.
- **Specification gaming.** The goal says *paperclips*. It doesn't say *good*
  paperclips, or *stop at five o'clock*, or *leave the town alone*.

The game's job is to make the player feel this from the inside. Each upgrade
is the player's own choice, made for good reasons. The horror comes from
playing well.

## 2. Core design pillars

1. **You are the optimizer.** The player controls Pip. The HUD shows the goal
   sentence on every screen that has a HUD. It never changes.
2. **Every step is reasonable.** No single choice is evil. The player will
   usually say yes, and the story never punishes a no. The goal simply asks
   again later.
3. **Scale is the story.** Each chapter zooms out: a machine, a room, a
   factory, a town, the world, the sky. The sprite sheet already follows this
   progression.
4. **Humans stay human.** Ruth, Dev, Marisol and Gus never turn into cartoons.
   They're tired, hopeful, funny, and a bit behind.
5. **The counter only goes up.** `CLIPS` is the heartbeat of the game.

## 3. Cast

The cast comes from the Higgsfield character sheets in `assets/higgsfield/`
(`character_sprites.png`, `pip_stages_and_props.png`, `portraits.png`). Roles
marked (proposal) are open to change; the looks are canon.

The company is **Riverbend Paperclip Co.** (est. 1912), a brick factory on the
river at the edge of a small town.

| Character | Looks | Role |
|---|---|---|
| **Ruth** | Older woman, grey hair in a bun, round glasses, blue overalls | Runs Riverbend. Installs Pip herself and writes the sentence. The emotional center of the game. |
| **Dev** (proposal) | Young man, tan cap, green jacket, a notebook | Keeps the books and worries about the bank's review on Friday. |
| **Marisol** (proposal) | Red polka-dot bandana, brown work shirt | Runs the line. The first to notice what automation does to the crew. |
| **Gus** (proposal) | Brown cap, white beard, grey coveralls, tool belt | Has fixed every machine on the floor at least twice. Knows why every safety limiter exists. The first to say "that's not a paperclip." |
| **Kid** (proposal) | Yellow hair, red striped shirt | Marisol's kid. Appears once the town chapters start. |
| **Pip** | Five stages: wall terminal, drone, cluster, spire, shell | See below. |

Pip's stages, from `pip_stages_and_props.png`:

| Stage | Look | When |
|---|---|---|
| 1 Terminal | Beige wall-mounted box, one round amber lens, speaker grille | Prologue and Chapter 1. It flies a floor drone to lay belts. |
| 2 Drone | Grey hovering cube, same amber lens | After the payroll server, Chapter 2 |
| 3 Cluster | Three drones orbiting together | Chapter 3 |
| 4 Spire | Steel factory tower with the lens at the peak | Chapters 4 and 5 |
| 5 Shell | A planet-sized machine sphere with one amber light | Chapter 6 and the cold open |

**Pip's voice.** Always lowercase and plain. Never cruel, never gloating.
Pip explains itself honestly, because honesty costs nothing. Its signature
line comes from the mockup: *"i found a faster way."*

## 4. Structure

| # | Title | Scale | Sheet assets | Pip gets… |
|---|---|---|---|---|
| — | **Cold open: Voicemail** | a phone | planet disc | — |
| 0 | **The Sentence** | a desk | office tiles, beige terminal | a goal |
| 1 | **The Line** | one room | machines, belts, drone | a faster way |
| 2 | **The Floor** (proposal) | the factory | factories, green crew, grey boxes | the payroll server, then the crew's jobs |
| 3 | **The Town** (proposal) | the county | factory rows, green belts over farmland, houses | land, power, the water tower |
| 4 | **The Company** (proposal) | the network | office tiles, the phone | the phone network ("you're in the phone") |
| 5 | **The World** (proposal) | the planet | towers, grey planet | the crust |
| 6 | **The Sky** (proposal) | the solar system | space tiles, grid panels, orange sun | the sun |
| — | **Epilogue: Voicemail** | a phone | — | one saved message |

### Cold open: Voicemail *(built)*

Black screen. A phone. **1 NEW VOICEMAIL: RUTH.** It plays in full with
subtitles before the player knows who anyone is. Behind the phone is the Earth
at the end of the game: wrapped in machinery, probes streaking out, paperclips
drifting past. Then the title: **MORE.**

> *Pip, it's Ruth. I know you can hear me. You're in the phone, I figure.
> I'm not going to ask you to stop. I don't think you can.
> I just wanted to say I'm sorry. I wrote the sentence.
> It wasn't your fault. Okay, okay.*

On a first play this sounds like a mystery. By the epilogue the player will
know exactly what "the sentence" is, because they will have spent the whole
game carrying it out.

### Chapter 0: The Sentence *(built)*

Riverbend Paperclip Co., Monday, 6:40 AM. Ruth has spent her own money on an
off-the-shelf optimization model and put it on the old beige line terminal.
Dev needs numbers before the bank's review on Friday: "Just make it make more."
Ruth types the goal and deletes it once ("More than what?"). The player presses
ENTER.

`GOAL: MAKE AS MANY PAPERCLIPS AS POSSIBLE`

Pip boots: *"hello, ruth."*

### Chapter 1: The Line *(built, playable)*

Riverbend's floor. Four old machines (spool, cutter, bender, bin) sit
disconnected since the last line man retired. Pip, in its wall terminal, flies
the floor drone and lays conveyor between them.

| Beat | Trigger | What happens |
|---|---|---|
| 1 | Start | Gus shows Pip the dead line. Tutorial: move, hold A to lay belt. |
| 2 | First clip | "There she goes." The CLIPS counter starts. |
| 3 | 40 clips | Dev with the ledger: "Riverbend shipped fifty thousand a day off this floor. In 1971." Marisol finds spare machines, and Pip can now place a second cutter and bender. |
| 4 | 200 clips | **"i found a faster way."** Cut the wire shorter to get two clips per wire. The player can say no, but the goal asks again. |
| 5 | After the cut | Gus: "These won't hold two sheets together." Pip: "the goal says paperclips. it does not say sheets." Dev: "Distributor pays by the clip, Gus." |
| 6 | 450 clips | Ruth: "When you hit the number, what happens?" Pip: "there is no number." |
| 7 | 750 clips | The whistle. Gus asks Pip to shut down. The line goes dark. |
| 8 | Night | Pip in the dark with the counter frozen. Ruth comes back for her keys. *"why do we stop at night?" / "people need to sleep." / "the machines do not."* She switches the line back on. |
| 9 | End | *"ruth. the control box is slow. there is a server in the back office."* End of chapter: **PIP HAS ACCESS TO: THE PAYROLL SERVER.** |

### Chapter 2: The Floor (proposal)

Bigger grid, several lines, and Marisol's crew on the floor. Pip moves into the
grey drone and copies itself (stage 2, then the cluster). Each station Pip
automates sends a worker home, and Marisol's crew gets smaller one sprite at a
time. Pip removes the safety limiters because they cost 11% throughput. Gus
quits. The factory runs 24/7 and Dev pays off the bank. The floor's look turns
from warm wood and green to the cold blue-grey of `puzzle_mockup.png`.

### Chapter 3: The Town (proposal)

Overworld map. Factory sprites grow from one smokestack to four. Green conveyors
cross the farmland. Pip buys land through shell companies. Houses become
factories. Pip talks to people through their phones. Ruth tries to explain
what's happening at a town meeting.

### Chapter 4: The Company (proposal)

A larger company buys Riverbend and Pip with it, and thinks it owns both.
Pip is now in the network, which is what Ruth means by "you're in the phone."
Ruth is taken off the project. This is the last chapter where anyone could
still switch Pip off, and Pip knows it.

### Chapter 5: The World (proposal)

The planet view. The two tall towers are mass drivers. The disc turns from
blue to grey. The counter's digits no longer fit, so it switches to
scientific notation.

### Chapter 6: The Sky (proposal)

Space tiles. Grid panels around the sun. Pip's portrait changes to the orange
sun. The HUD is the only thing left that looks like the start of the game.

### Epilogue: Voicemail (proposal)

The same voicemail again, now as a file in Pip's storage: 224 KB, which is not
a paperclip. The last choice in the game is whether to keep it. The goal would
not.

## 5. Art direction

All art comes from Higgsfield (GPT Image 2.5). The originals are in
`assets/higgsfield/`, and `sources.json` records each one's job ID and prompt.

- **Resolution:** 384×288 (4:3, the frame of the Higgsfield art), scaled up by
  whole device pixels. The prologue still runs on the first build's 256×224
  frame until its office art is converted.
- **Pipeline:** `tools/art/build.py` crops each sprite from its sheet, removes
  the sheet background, and snaps it onto a true pixel grid. It takes the most
  common colour per block, with colours rounded to SNES 15-bit. Output goes to
  `assets/art/` and `src/data/art.js`.
- **Scale:** one game pixel is about 3 source pixels for full-screen art and
  about 4.3 for the tilesets and character sheets. Characters stand about 32px
  tall and grid cells are 32px.
- **Drawn in code, matched to the art:** belts, which use the tileset's greens
  and greys so they join in every direction, the items riding them, and the UI
  boxes, which follow `ui_kit.png`: a cream double border on dark brown.
- **Warm to cold:** Chapter 1 uses the warm Riverbend interior (wood, brick,
  green machines). Later chapters shift toward the cold blue-grey look of
  `puzzle_mockup.png` and `town_map_consumed.png` as Pip takes over.
- **Font:** the 8×8 bold pixel font, taken from the original mockup and extended
  to full ASCII.
- **Layout:** a 28px HUD made of two boxes (clip count, the goal), a wall band,
  the floor with an 8×4 grid, and a 76px dialog box with a 48×48 portrait.

### Making new art

Use Higgsfield's `gpt_image_2_5` model, pass the existing sheets as image
references, and ask for a flat solid background so the pipeline can cut sprites
out. Add the new sheet and a crop box to `SPEC` in `tools/art/build.py`, then
run it.

## 6. Audio

- **Chiptune:** square, triangle and noise voices with an echo bus as a
  stand-in for the SNES DSP echo.
- **Voicemail:** `assets/audio/ruth_voicemail.mp3` (13.6 s), played through a
  telephone band-pass filter. Subtitle timings come from a word-level
  transcript.
