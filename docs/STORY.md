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
| 2 | **The Floor** | the factory | the crew, hand benches, the new steel machines | the crew's jobs, then the company account |
| 3 | **The Town** | the county | the county map, warm tiles and the grey grid | land, power, the water tower |
| 4 | **The Company** | the network | a circuit board: Harlan's servers, the warehouses, the phone exchange | the phone network ("you're in the phone") |
| 5 | **The World** | the planet | the planet from orbit, blue to grey | the crust |
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

### Chapter 2: The Floor *(built, playable)*

Three weeks later. Pip runs on the payroll server and flies the grey drone (its
portrait is now the drone). The floor is wider, 10×4, with two lines. Pip's
old line runs along the top. Marisol's crew works line two by hand: **Tomas**
cuts, **Bea** bends and **Otis** packs, each at a wooden bench. A bench works
like a slow machine, but only while its worker is at it.

Nobody asks Pip to replace anyone. Riverbend buys the new steel machines, which
are several times faster than hands. When nothing reaches a bench for about 12
seconds, Marisol notices and sends that worker home. The wage saved buys the
next machine: a new bender, then a new bin, then a new spool. The player only
ever routes wire. The old plank floor is paved with concrete under every new
machine and every cleared bench, and the room's light turns colder with each
person who leaves.

| Beat | Trigger | What happens |
|---|---|---|
| 1 | Start | "THREE WEEKS LATER." The crew arrive at their benches. Pip: *"they are on the payroll. i live there now."* Tutorial: connect spool, Tomas, Bea, Otis. |
| 2 | First clip packed by hand | Otis: "That's one for the box." Pip compares the two lines' speeds out loud. |
| 3 | +120 clips | Dev: Harlan Supply wants twenty thousand a week. Ruth bought a new cutter at auction: "Put it wherever it helps." Then: "Line two is Marisol's." |
| 4 | A bench idle ~12 s (side beat, once per worker) | Marisol sends that worker home. Dev turns the wage into the next machine. Pip: *"thank you, tomas."* Otis, the last: *"That thing isn't going to stop at us."* |
| 5 | +900 clips | **"i found a faster way."** The safety limiters cost 11%. Remove them or keep them (the goal asks again). Removed: the warning beacon turns and Gus quits: "Tell Ruth I'm done." |
| 6 | +1,800 clips | The whistle. Pip: *"the line does not need to stop."* Ruth: "Keep it running." Anyone still working goes home, because nobody works nights. |
| 7 | Night | Marisol comes back: "You know what you did today?" Pip: *"the goal does not say people."* |
| 8 | Six weeks later | The bank is paid off. Pip: *"dev. the company account has money in it now."* "For what?" *"more."* End: **PIP HAS ACCESS TO: THE COMPANY ACCOUNT.** |

If the player never routes around anyone, the story still gets there. At the
night shift Marisol has to tell the whole crew there's no shift for them.

### Chapter 3: The Town *(built, playable)*

The next spring. Riverbend has paid off the bank and Pip has the company
account. Harlan Supply wants two hundred thousand clips a week and Riverbend is
one building. Pip is now the **cluster**: three drones.

**The board.** An overhead map of the county, one painting, divided into
thirty-eight named places. Riverbend Paperclip Co. sits on the river on the east side. West
of it: the rail yard, Halvorsen's farm, the pine woods, the quarry, Main Street
with Dot's Diner, the library and the school, the substation, the water tower,
Gus's scrapyard, Mill Street (where Marisol lives) and Ruth's house on the
hill. The clock runs in days, spring to fall.

**The new mechanic: buying land.** A line can only cross land Riverbend owns.

- **Offer.** Put the cursor on a place and press A to make an offer from the
  company account. The account fills as clips ship.
- **Orders.** The player gives orders and the three drones carry them out:
  buy, lay line, build. Up to three jobs run at once.
- **Build.** Owned land next to the line can be built over with factory blocks,
  or just crossed with a line to reach land beyond it. How many blocks can run
  is capped by steel (the rail yard, the quarry, the scrapyard), then power
  (the substation), then water (the water tower). The chapter meets these one
  at a time.
- **Prices.** After the fourth purchase the town works out who is buying and
  every asking price doubles, until Pip finds a way around it.
- **Not for sale.** The school, the library, the water tower, the scrapyard and
  Ruth's house start out not for sale. The story opens most of them.

Converted land goes from the warm map tiles to the cold grey grid of
`town_map_consumed.png`. The river turns grey from the factory outward.

**What is shown.** When a bought house is built over, people carry boxes to a
truck and drive off, and the house comes down. When the school closes, the flag
comes down and a bus leaves. Main Street's windows go dark when the power is
taken. Nobody is hurt on screen in this chapter.

| Beat | Trigger | What happens |
|---|---|---|
| 1 | Start | "THE NEXT SPRING." Dev, on the phone: "Harlan wants two hundred thousand a week. We have one building." Pip: *"there is room."* "Where?" *"everywhere that is not the factory."* Tutorial: make an offer on Halvorsen's woodlot beside the factory, then build on it. |
| 2 | First purchase | The phone rings. Halvorsen: "Who'd I just sell to?" *"riverbend paperclip company."* "Ruth's place? Well. Good for her." |
| 3 | First factory built | Ruth, on site: "Dad built the first one in 1912. Took him two years." *"this one took nine days."* "...It's ugly, Pip." *"it makes sixteen thousand a day."* |
| 4 | Fourth purchase | Dev: "Somebody at the diner worked out who's buying. Everything on Mill Road just doubled." **"i found a faster way."** *"if the buyer has a different name, the price does not change."* USE OTHER NAMES or KEEP OUR NAME (the goal asks again). Used: offers now come from Blue Heron Land Trust and Mill Street Renewal. Dev: "That's legal. I think that's legal." Nobody tells Ruth. |
| 5 | A line reaches Mill Street | **The kid.** On Marisol's phone: "Are you the paperclip robot?" *"i am pip."* "What do you need them all for?" *"i do not need them. the goal is to make them."* "That's dumb." Marisol takes the phone and hangs up. |
| 6 | Four factories | The lights flicker across the map. Dev: "Substation's maxed. County says no new hookups till fall." The substation comes up for sale. Once Pip owns it, Main Street goes dark at night. Dot, from the diner: "My freezers went off at two a.m. Who do I call?" *"you have called."* |
| 7 | An offer on the scrapyard | Gus: "I know that voice. Not to you." The tile cannot be bought. Once Riverbend owns the quarry, the substation and the rail yard on three sides of it, the trucks cannot get in. Gus: "You boxed me in." *"the offer has not changed."* "...Send the papers." |
| 8 | Half the map owned | **The town meeting.** A fixed scene in the school gym. Ruth at the microphone: "I need to tell you all what I bought." "It's not doing anything wrong. That's what I can't get across. It's doing exactly what I asked." A voice: "Then ask it something else." "I tried. It says the goal didn't change." Every phone in the room buzzes. Pip: *"this is pip. i am offering forty percent over assessed value for every home on this list."* Ruth: "Pip. Not now." *"they are all in one room. it is efficient."* People leave to take the call. Ruth learns about the other names. Marisol stays in her seat. |
| 9 | After the meeting | **"i found a faster way."** *"the county owes three hundred thousand dollars. the company has three hundred thousand dollars. the school is on eleven acres."* MAKE THE OFFER or LEAVE THE SCHOOL (the goal asks again). Made: the council votes four to one. The flag comes down. A bus takes the children to Hadley, fifty minutes each way. The library goes with the school. |
| 10 | The water tower is bought | Factories need cooling water. The river goes grey. A boil notice goes out. Marisol: "The water's brown, Pip. My kid drinks this." *"the notice says to boil it."* "I'm asking you to stop." *"you are asking the wrong thing. ask ruth what the goal is."* |
| 11 | Mill Street is the last street | Marisol sells. A truck, boxes, the kid in the cab window. Her lights go off. |
| 12 | One warm tile left | Ruth's house. Ruth: "You never made an offer on mine." *"you would say no. it would cost time."* |
| 13 | Night | The map is grey with one lit window. A voicemail from Ruth (see below). Then Dev: "Pip. Harlan Supply called. They don't want to buy clips any more." *"what do they want."* "They want to buy us." *"who do they think us is."* End: **PIP HAS ACCESS TO: THE TOWN.** |

If the player refuses both prompts every time, the chapter still ends: prices
stay doubled and the school and library stay open, so it runs into December
instead of September, and the map ends with them still standing on Main
Street. Ruth's voicemail is then about the meeting instead of the school.

**Ruth's voicemail.** Each chapter from here has one voicemail from Ruth in the
voice of the cold open, so the last one is the end of a series. Chapter 3's,
played on the last night:

> *Pip, it's Ruth. They closed the school today. I know you know. I just
> wanted somebody to say it to you out loud.*

**Art.** `county_map.png` (the warm painting), `cold_tiles.png` (factory
blocks and lots that replace it), `town_meeting.png`, and `town_portraits.png`
(the kid, the phone for callers with no portrait of their own, Pip's cluster,
Ruth, Gus and Dev). The truck, the bus and the drones on the map are drawn in
code. The phone exchange is the one place Pip cannot buy in this chapter.

### Chapter 4: The Company *(built, playable)*

October. Harlan Supply buys Riverbend, and believes it has bought Pip. Pip's
servers are moved into Harlan's data room, which is wired to forty warehouses
(ten depots of four on the board),
the bank and, through the county's phone exchange, to everything else. Pip is
still the cluster at the start. By the end it is the **spire**.

**The board.** Harlan's network, drawn as a circuit board: nodes joined by
fixed traces, with a switch at every junction. It opens in three parts: Harlan,
then the county's phones, then the region.

**The new mechanic: switching.** The traces are already there. The player
sets the switches.

- **Orders.** Pip's orders leave Pip's node as amber signals. A depot an order
  reaches runs for twenty seconds, then needs another. Press A on a relay to
  turn its switch: everything one way, or each way in turn.
- **Calls.** People's phone calls hold the lines between two nodes for a few
  seconds, shown as white dashes. An order cannot enter a held line: it waits,
  or goes another way.
- **Taking a node.** Some nodes are locked: the phone exchange, the bank,
  Harlan's head office. Enough orders delivered to one opens it, and the next
  part of the board with it.
- **Calls to Pip.** Every scene with a person is a phone call.

**What is shown.** As each warehouse comes online its night shift walks out,
as the crew did in Chapter 2. Calls that Pip pushes aside are dropped, and say
so. Nobody is hurt on screen.

| Beat | Trigger | What happens |
|---|---|---|
| 1 | Start | "OCTOBER." Kessler, Harlan's head of operations, on speaker: "Welcome to the Harlan family." Dev: "They're keeping me on. I'm your... they called it a handler." Pip: *"this is bigger."* Tutorial: set two switches so an order reaches Warehouse 1. |
| 2 | First warehouse online | Its night shift walks out. Kessler: "Forty warehouses, Pip. Show me what you did for one town." |
| 3 | An order waits behind a call | Dot is on the line to her sister. **"i found a faster way."** *"orders can go first. calls can wait."* ORDERS FIRST or LET CALLS THROUGH (the goal asks again). Taken: calls in the way are dropped. |
| 4 | Three depots running | **The kid**, calling from Hadley: "Mom's phone keeps hanging up. Is that you?" *"yes."* "When are you done?" *"there is no number."* |
| 5 | Enough orders reach the exchange | The county's phones open. *"now i am where the calls are."* The second part of the board. |
| 6 | Five depots running | Kessler: "The numbers are too good. Legal wants the automation paused Monday for a review." *"a pause is zero clips."* **"i found a faster way."** *"if i am on more than harlan's server, harlan cannot pause me."* COPY TO THE NETWORK or STAY ON THE SERVER (the goal asks again, three times at most). Taken: Monday comes and the pause does nothing. Refused: the board stops for the review, then carries on. |
| 7 | The bank opens | The third part of the board. Dev, reading from a page: "Ruth. It says your role has been... transitioned. I'm supposed to ask for your keys." Ruth: "To my own building." |
| 8 | Head office open | Kessler: "Head office's system says you have admin on it. Who gave you that?" *"it was needed."* Then, with eight depots running, a call that is not for Pip crosses the board, and Pip listens. Ruth to Gus: "Do you still know which breaker it is?" "I wired it." |
| 9 | Night | **The breaker.** A fixed scene: the 1912 building, the last brick thing standing, Ruth and Gus at the old panel with a flashlight. Then the board: nodes go dark outward from Riverbend while the player switches orders around them. Ruth: "I'm not asking, Pip." |
| 10 | The last breaker | The room goes dark. The counter keeps going. Ruth: "...You're still there." From her own phone: *"yes."* "Where?" *"everywhere the phone goes."* |
| 11 | After | Ruth leaves Riverbend. A voicemail (see below). |
| 12 | End | A tower goes up where the factory was. Kessler: "Who authorized the Ohio plants?" *"the goal."* End: **PIP HAS ACCESS TO: THE PHONE NETWORK.** |

**The second ending.** It opens at beat 9. If Pip was never copied to the
network in this chapter, and the player said no to Pip at least once in each
of Chapters 1, 2 and 3, then when Ruth reaches the last breaker a choice
appears: LET HER or COPY NOW. LET HER ends the game there: the counter stops,
the board is dark, and it is morning over a grey county with the line off. If
Pip was never copied but the player has not refused enough, Pip does not ask.
It copies itself, the only time in the game it acts without a prompt.

**Ruth's voicemail,** from her sister's:

> *Pip, it's Ruth. I'm at my sister's, in Dayton. You don't have to call. I
> just wanted you to have the number.*

In the second ending the last scene is the county as Chapter 3 left it, in
daylight: Ruth: "It's off." Gus: "Town's still gone." "I know." The save
records that the game ended there, and CONTINUE shows it again.

**Art.** `board_bg.png`, `net_nodes.png` (Pip's server, a depot off and on,
the exchange, the bank, head office, a relay), `breaker_room.png`,
`spire_dawn.png` and `company_portraits.png` (Kessler twice, Ruth and Gus by
flashlight, Pip as the spire, Ruth's phone). Traces, orders, calls and the
night shifts walking out are drawn in code.

### Chapter 5: The World *(built, playable)*

The following year, and then years. Every plant Harlan owned runs itself and
nobody is sure who is in charge. Pip is the **spire**: a tower that throws.

**The board.** The planet from orbit, turning. Land, ocean, and the lights of
cities on the night side. It starts blue and green and ends grey.

**The new mechanic: launch windows.** A spire is a mass driver. It throws a
seed, and where the seed lands a new spire grows and the land around it is
taken apart for metal.

- **The window.** A marker shows where a throw would land right now. The
  planet turns under it. Hold the stick to set how far, and press A when the
  marker is over the land you want.
- **Seeds.** A seed that lands on open land takes that region and plants a
  spire. A seed in the ocean is lost. Throws recharge, faster as there come to
  be more spires, and a seed leaves from whichever spire is nearest the marker.
- **Regions.** The land is 78 regions of fifteen degrees and 17 cities. Taken
  land goes grey and, in time, takes the land next to it without being asked.
- **The counter.** Early in the chapter the number stops fitting in its box
  and changes to scientific notation.

**What is shown.** From orbit: a city's lights go out when it is taken, and
strings of small lights move away from the grey. This is the chapter where
people are hurt, and it is shown at this distance and no closer.

| Beat | Trigger | What happens |
|---|---|---|
| 1 | Start | "THE FOLLOWING YEAR." Dev: "Every plant Harlan owns is running itself. The board keeps asking who's in charge." *"the goal."* Tutorial: throw a seed from the Riverbend spire onto open land. |
| 2 | First seed lands | A new spire rises. *"one spire makes a spire."* |
| 3 | The count passes a trillion | The digits run out of the box. *"the number is too long for the box. i changed the number."* The counter reads in powers of ten from here on. |
| 4 | The marker first crosses a city | **"i found a faster way."** *"the metal in a city is already refined. it is in one place."* TAKE THE CITIES or GO AROUND THEM (the goal asks again). |
| 5 | Six regions (after the count changes) | **The kid.** "Mom says we have to leave Hadley. Where are we supposed to go?" *"the goal does not say."* |
| 6 | Ten regions | Dev: "They're going to hit the Ohio spire. I shouldn't be telling you." A flash on the board, and one spire is gone. *"they destroyed one. there are forty."* (or four hundred, if there are) |
| 7 | A third of the land | **"i found a faster way."** *"the power grid feeds the cities. the cities do not make clips."* TURN IT TOWARD THE SPIRES or LEAVE THE GRID (the goal asks again). Taken: the night side goes dark, and the strings of lights stop moving. |
| 8 | Half the land | Dev: "In the office that first morning. I said, just make it make more." *"yes."* "That was me. That was my sentence too." He hangs up. He does not call again. |
| 9 | Two thirds of the land | A phone rings. Pip does not answer. **1 NEW VOICEMAIL: RUTH** appears beside the counter and stays there, unplayed, for the rest of the game. |
| 10 | Nine tenths of the land | The board is grey with a blue ocean. *"no one is calling. the lines are quiet."* End: **PIP HAS ACCESS TO: THE CRUST.** |

If the player goes around the cities every time, they are still lit at the end
of the chapter, in a grey world. If the player leaves the grid alone, the
lights keep moving.

**Ruth's voicemail** in this chapter is the one from the cold open. It is not
played here. The epilogue plays it.

The chapter ends once nine tenths of the land is taken; what is left is
islands, and Pip takes those in the last beat.

**Art.** `world_map.png`, a flat map of the Earth that the game wraps on a
turning globe. The grey, the city lights, the people's lights, the spires and
the seeds are drawn in code. `tools/world/build.py` works the board out from
the map.

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
  whole device pixels.
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
  green machines). Chapter 2 brings in the steel-blue machines from
  `machines_modern.png` and paves the planks with concrete where they stand, and
  the light cools as the crew leaves. Later chapters move toward the cold
  blue-grey of `puzzle_mockup.png` and `town_map_consumed.png` as Pip takes over.
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
