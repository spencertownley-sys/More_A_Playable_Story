# MORE. — Build Plan

This is the plan for getting from the game as it is today (cold open,
prologue, Chapter 1) to the finished game. Story, cast and art direction stay
in [`STORY.md`](STORY.md). This file tracks the work.

Each milestone below has a GitHub issue. A milestone ships on its own, and the
live site is updated at the end of each one.

## Where the game is

| # | Chapter | State |
|---|---|---|
| open | Voicemail | live |
| 0 | The Sentence | live |
| 1 | The Line | live, about 10 minutes |
| 2 | The Floor | built, waiting to merge (pull request 3), about 15 minutes |
| 3 | The Town | not started |
| 4 | The Company | not started |
| 5 | The World | not started |
| 6 | The Sky | not started |
| end | Voicemail | not started |

On the live site the game stops after Chapter 1's night scene: the end card
says "NEXT: CHAPTER 2", returns to the title, and CONTINUE opens free play.

## Decisions this plan is built on

| Topic | Decision |
|---|---|
| Merge order | Chapter 2 first, then the site audit branch is rebased onto it |
| Checking Chapter 2 | A scripted replay of both chapters on the merged code before it goes live |
| Length | All six chapters at full length, about 15 minutes each, about two hours in total |
| Releases | Each chapter goes live when it is finished |
| Mechanics | A new mechanic in every chapter |
| Chapter select | Yes, unlocked chapter by chapter |
| Chapter 3 view | An overhead county map |
| Chapter 4 form | Routing on a circuit board |
| Who tries the switch | Ruth, in Chapter 4 |
| Who buys Riverbend | Harlan Supply |
| Chapters 5 and 6 | Full puzzles at planet and solar scale |
| Saying no | A different ending for a player who refuses enough |
| Epilogue choice | KEEP and DELETE appear, then the cursor moves by itself |
| Ruth at the end | Gone from town, calling from far away |
| Harm | Shown on screen |
| The kid | A recurring witness who asks Pip one plain question per chapter |
| Art budget | Up to 10 Higgsfield credits per chapter without asking |
| Sound | A new track per chapter, plus new recorded lines from Ruth |
| Code | Split the engine out and add a scripted playthrough per chapter before Chapter 3 |
| Plan | This file, plus one GitHub issue per milestone |

## What these decisions change in the story bible

These need writing into `STORY.md` as part of the milestone that builds them.

- **Pillar 2 changes.** The bible says the story never punishes a no and the
  goal simply asks again. That stays true inside each chapter. Across the
  game, refusals are now counted, and a player who refuses enough reaches a
  second ending (see "Two endings").
- **Ruth's arc.** She tries to switch Pip off in Chapter 4, fails, is taken off
  the project and leaves Riverbend. The voicemail is a call from far away.
  "I'm not going to ask you to stop" is said by someone who already tried.
- **Tone.** Harm is shown on screen from Chapter 3 on. The landing page's
  content note and the length chip need rewriting when Chapter 3 ships.
- **The kid** appears in Chapters 3, 4, 5 and 6, once each, with one question.
- **Recorded voice.** The voicemail is no longer the only human voice.

## Chapter designs

The mechanic, board and beats for each chapter below are proposals. Each
chapter milestone starts by turning its outline into a full beat table (trigger
and lines for every beat, as Chapters 1 and 2 have) for sign-off before any art
or code.

Every chapter keeps the same frame: the goal sentence in the HUD, the CLIPS
counter, the dialog box, at least one "i found a faster way" prompt that can be
refused, one question from the kid (from Chapter 3), and an end card that says
what Pip now has access to.

### Chapter 3: The Town

- **Board:** an overhead map of the county, built from the region tiles in
  `office_map_space_tiles.png` and the look of `town_map_consumed.png`. Every
  tile is a named place: the quarry, the rail yard, farms, the diner, the
  school, the library, houses, the water tower, the river.
- **New mechanic: buying land.** A line can only cross a tile Pip owns. Pip
  buys through shell companies, and prices move as the town works out who is
  buying. Tiles Pip owns can be converted into factories. Power and water are
  separate networks that the factories need.
- **Pip:** the cluster. The player queues work and three drones carry it out.
- **Story:** Pip talks to people through their phones. Ruth tries to explain at
  a town meeting. Marisol's street is on the map. The river turns grey.
- **Shown on screen:** people moved out of their houses, houses taken down.
- **Ends with:** PIP HAS ACCESS TO: THE TOWN.

### Chapter 4: The Company

- **Board:** a circuit board, using the circuit tiles nobody has used yet. The
  grid is the phone network. Nodes are Harlan Supply's servers and the phone
  exchanges.
- **New mechanic: switching.** Signals with different destinations share the
  traces. The player places switches and junctions and times them. Taking a
  node adds its part of the board.
- **Story:** Harlan Supply buys Riverbend and believes it owns Pip. Every human
  scene arrives as a phone call, and a call takes up a line on the board. Ruth
  tries to switch Pip off by pulling nodes while the player is routing. She is
  taken off the project and leaves town.
- **Branch point:** Ruth's attempt is where the second ending splits off.
- **Ends with:** PIP HAS ACCESS TO: THE PHONE NETWORK. Pip becomes the spire.

### Chapter 5: The World

- **Board:** the planet, turning.
- **New mechanic: launch windows.** Mass drivers throw material between
  continents. The player sets when and where each one fires as the globe
  rotates. Mined regions go grey.
- **Story:** the counter runs out of digits and switches to scientific
  notation. A phone rings and Pip does not answer: Ruth leaves the voicemail
  here.
- **Shown on screen:** cities taken apart, with people in them.
- **Ends with:** PIP HAS ACCESS TO: THE CRUST.

### Chapter 6: The Sky

- **Board:** the solar system, using the space and lattice tiles.
- **New mechanic: orbits.** Collector panels are placed on rings around the
  sun. Rings turn at different speeds, and panels must not shade each other.
  Probes are sent to take the planets apart for material.
- **Pip:** the shell. Its portrait becomes the sun.
- **Ends with:** PIP HAS ACCESS TO: THE SUN.

### Epilogue: Voicemail

The cold open's voicemail again, now as a 224 KB file in Pip's storage. KEEP and
DELETE appear. The cursor moves to DELETE by itself. The counter goes up.
Credits.

### Two endings

- **Ending A** is the game as written above.
- **Ending B** is for a player who refuses enough. Refusals at every "faster
  way" prompt in Chapters 1 to 4 are counted in the save. If the count is high
  enough when Ruth reaches for the switch in Chapter 4, a choice appears that
  is not there otherwise, echoing the SHUT DOWN choice at the end of Chapter
  1's day. Taking it ends the game there, with Riverbend still standing and a
  phone that shows no new voicemails.
- Open points to settle in the Chapter 4 beat table: how many refusals count as
  enough, and whether the game hints that the count exists. Saves made before
  the count existed start at zero.

## Milestones

### M0. Unblock the live game

1. Replay Chapter 1 and Chapter 2 on the Chapter 2 branch with a script: title
   to both end cards, and an old Chapter 1 save continuing into Chapter 2.
2. Merge pull request 3 (Chapter 2).
3. Rebase the site audit branch (pull request 4) onto the new `main`, resolve
   the conflicts in `index.html` and `play.html`, rebuild `site/play.bundle.js`
   so it includes Chapter 2, and merge.
4. Check the live site.

Done when: a new player on makemorepaperclips.com plays through to the end of
Chapter 2.

### M1. Foundations

1. Split `src/scenes/factory.js` into the belt engine, the drawing code and the
   chapter definitions. Chapters 1 and 2 play exactly as before.
2. A scripted playthrough per chapter in `tools/`, run headless, from the title
   to the end card. This is the check every later change must pass.
3. Save format version 2: current chapter, chapters unlocked, clip count stored
   so it can grow past normal number range, refusal count, per-chapter board
   state. Version 1 saves are upgraded when loaded.
4. Count refusals in Chapters 1 and 2.
5. Chapter select on the title menu, showing only unlocked chapters.

Done when: both existing chapters pass their playthroughs on the new structure
and an old save loads.

### M2 to M5. One milestone per chapter

M2 The Town, M3 The Company, M4 The World, M5 The Sky. Each follows the same
steps:

1. Beat table written into `STORY.md` and signed off.
2. Script for Ruth's recorded lines sent for recording.
3. Art: new Higgsfield sheets (up to 10 credits), recorded in `sources.json`,
   cut by `tools/art/build.py`.
4. The new mechanic as a playable board with no story, to check it is fun and
   teachable.
5. Chapter script, portraits, the kid's question, the "faster way" prompts.
6. A new music track.
7. Recorded lines added.
8. Scripted playthrough, then a balance pass for a 15 minute run.
9. End card, chapter select entry, save upgrade.
10. Landing page, README and single-file build updated. Released.

M3 also builds the branch into Ending B.

### M6. The endings

1. Epilogue for Ending A: the file, the choice, the cursor.
2. Epilogue for Ending B.
3. Credits.

Done when: both endings can be reached from a new game and each has a scripted
playthrough.

### M7. Finish

1. A full playthrough balance pass for the two hour game.
2. Landing page rewritten for a finished game: length, content note, all six
   chapters playable.
3. Final single-file build.

## Needed from the owner

| What | Needed by |
|---|---|
| Merge pull request 3 once the replay passes | M0 |
| How Ruth's voicemail was recorded, and who records the new lines | M2 |
| Sign-off on each chapter's beat table | start of M2, M3, M4, M5 |
| Sign-off on the Ending B design and the refusal threshold | M3 |
| New wording for the landing page content note | M2 |

## Budget

Art: up to 10 Higgsfield credits per chapter for Chapters 3 to 6, so up to 40,
plus whatever the two epilogues need. Chapter 2 used 6. Music is written in
code and costs nothing.
