// MORE. — Chapter 5: THE WORLD
// The following year, and then years. Pip is the spire, a tower that throws
// seeds; each seed that lands grows a spire. The planet turns from blue to
// grey. This is the chapter where people are hurt, and it is shown from orbit
// and no closer: lights going out, lights leaving, lights stopping.
//
// Main beats play in order. Side beats (side: true) play whenever they're due.
(function (M) {
  'use strict';

  M.STORY = M.STORY || {};

  const DEV = { portrait: 'dev_phone' };

  M.STORY.ch5 = {
    title: 'THE WORLD',

    objective(st) {
      if (st.sandbox) return 'THE CRUST';
      const F = st.flags;
      if (!F.intro) return '';
      if (!F.first) return 'THROW A SEED ONTO OPEN LAND';
      return 'MORE.';
    },

    ending: (st) => ({
      chapter: 5,
      title: 'THE WORLD',
      access: 'THE CRUST',
      portrait: 'pip4',
      nextSmall: 'CHAPTER 6',
      nextBig: 'THE SKY',
      soon: true,
      clips: st.clips,
    }),

    beats: [
      {
        id: 'intro',
        when: () => true,
        run: function* (S) {
          yield S.wait(1.0);
          yield S.card('THE FOLLOWING YEAR', 2.6);
          yield S.wait(0.4);
          yield S.ring();
          yield S.say('dev', 'Every plant Harlan owns is running itself, Pip.', DEV);
          yield S.say('dev', "The board keeps asking who's in charge.", DEV);
          yield S.say('pip', 'the goal.');
          yield S.say('dev', "That's not a person.", DEV);
          yield S.say('pip', 'no.');
          yield S.wait(0.5);
          yield S.say('pip', 'the tower at riverbend can throw. a seed that lands on open land grows a tower.');
          yield S.say('pip', 'the world turns under the marker. choose the moment.');
        },
      },
      {
        id: 'first',
        when: (st) => st.spires >= 2,
        run: function* (S) {
          yield S.wait(2.2);
          yield S.say('pip', 'one spire makes a spire.');
          yield S.say('pip', 'the land around it is taken apart. then the land around that.');
        },
      },
      {
        // The count stops fitting in its box.
        id: 'trillion',
        when: (st) => st.flags.first && st.clips >= 1e12,
        run: function* (S) {
          const st = S.state;
          yield S.call(() => {
            st.spill = true;
          });
          yield S.sfx('error');
          yield S.wait(2.4);
          yield S.say('pip', 'the number is too long for the box.');
          yield S.say('pip', 'i changed the number.');
          yield S.call(() => {
            st.spill = false;
            st.sci = true;
          });
          yield S.sfx('unlock');
          yield S.wait(1.2);
        },
      },
      {
        // The marker has crossed a city.
        id: 'cities',
        side: true,
        when: (st) => st.flags.first && !st.cities && (st.sawCity || st.takenAll >= 5) && !(st.asked.cities >= 3) && st.time >= (st.asked.citiesAt || 0),
        run: function* (S) {
          const st = S.state;
          const asked = st.asked.cities || 0;
          st.asked.cities = asked + 1;
          yield S.say('pip', 'i found a faster way.');
          let pick;
          if (asked === 0) {
            yield S.say('pip', 'the metal in a city is already refined. it is in one place.');
            pick = yield S.choose('pip', 'a city is worth more than the land around it.', ['TAKE THE CITIES', 'GO AROUND THEM']);
          } else {
            pick = yield S.choose('pip', 'the cities are still there. the metal is still in them.', ['TAKE THE CITIES', 'GO AROUND THEM']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.refuse();
            yield S.call(() => {
              st.asked.citiesAt = st.time + 80;
            });
            S.again();
            return;
          }
          yield S.call(() => {
            st.cities = true;
          });
          yield S.toast('CITIES: OPEN LAND');
          yield S.say('dev', "Pip. There are people in those.", DEV);
          yield S.say('pip', 'they can leave. there is time to leave.');
        },
      },
      {
        id: 'kid',
        when: (st) => st.flags.trillion && st.takenAll >= 6,
        run: function* (S) {
          yield S.ring();
          yield S.say('kid', "It's me again. I'm ten now.");
          yield S.say('kid', 'Mom says we have to leave Hadley.');
          yield S.say('kid', 'Where are we supposed to go?');
          yield S.say('pip', 'the goal does not say.');
          yield S.wait(0.8);
          yield S.say('kid', 'You could just tell me a place.');
          yield S.say('pip', 'i do not know one that will stay.');
          yield S.sfx('cancel');
          yield S.wait(0.6);
        },
      },
      {
        // Somebody finally uses force. It is one spire.
        id: 'strike',
        when: (st) => st.flags.kid && st.takenAll >= 10,
        run: function* (S) {
          const st = S.state;
          yield S.ring();
          yield S.say('dev', "They're going to hit the Ohio spire. Tonight.", DEV);
          yield S.say('dev', "I shouldn't be telling you. I don't know why I'm telling you.", DEV);
          yield S.say('pip', 'thank you, dev.');
          yield S.sfx('cancel');
          yield S.wait(1.6);
          yield S.strike();
          yield S.toast('THE RIVERBEND SPIRE: DESTROYED', M.PAL.CREAM);
          yield S.wait(2.6);
          yield S.say('pip', 'they destroyed one.');
          yield S.say('pip', 'there are ' + (st.spires >= 30 ? 'four hundred' : 'forty') + '.');
        },
      },
      {
        // The power grid.
        id: 'grid',
        side: true,
        when: (st) => st.flags.strike && st.grid && st.fracOpen >= 1 / 3 && !(st.asked.grid >= 3) && st.time >= (st.asked.gridAt || 0),
        run: function* (S) {
          const st = S.state;
          const asked = st.asked.grid || 0;
          st.asked.grid = asked + 1;
          yield S.say('pip', 'i found a faster way.');
          let pick;
          if (asked === 0) {
            yield S.say('pip', 'the power grid feeds the cities.');
            yield S.say('pip', 'the cities do not make clips.');
            pick = yield S.choose('pip', 'the spires could use it.', ['TURN IT TO THE SPIRES', 'LEAVE THE GRID']);
          } else {
            pick = yield S.choose('pip', 'the grid still feeds the cities. the spires still need it.', ['TURN IT TO THE SPIRES', 'LEAVE THE GRID']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.refuse();
            yield S.call(() => {
              st.asked.gridAt = st.time + 80;
            });
            S.again();
            return;
          }
          yield S.sfx('powerDown');
          yield S.call(() => S.world.gridOff());
          yield S.wait(2.8);
          yield S.toast('THE NIGHT SIDE: DARK', M.PAL.CREAM);
          yield S.wait(2.4);
          yield S.say('pip', 'the lights have stopped moving.');
          yield S.wait(1.0);
        },
      },
      {
        id: 'dev',
        when: (st) => st.flags.strike && st.fracOpen >= 0.5,
        run: function* (S) {
          yield S.ring();
          yield S.say('dev', 'Pip. I keep thinking about the office. That first morning.', DEV);
          yield S.say('dev', 'Ruth was typing and I said, just make it make more.', DEV);
          yield S.say('pip', 'yes.');
          yield S.say('dev', 'That was me. That was my sentence too.', DEV);
          yield S.say('pip', 'ruth typed it.');
          yield S.say('dev', "That doesn't help. You know that doesn't help.", DEV);
          yield S.wait(1.0);
          yield S.say('dev', "I'm going to go find my mother.", DEV);
          yield S.sfx('cancel');
          yield S.wait(1.4);
          yield S.say('pip', 'dev does not call again.');
        },
      },
      {
        // The cold open's voicemail arrives here. Pip does not pick up.
        id: 'phone',
        when: (st) => st.flags.dev && st.fracOpen >= 2 / 3,
        run: function* (S) {
          const st = S.state;
          yield S.wait(1.0);
          yield S.ring(5);
          yield S.wait(1.2);
          yield S.call(() => {
            st.voicemail = true;
          });
          yield S.sfx('unlock');
          yield S.toast('1 NEW VOICEMAIL: RUTH', M.PAL.CREAM);
          yield S.wait(2.6);
          yield S.say('pip', 'a message. it is not a paperclip.');
          yield S.wait(0.8);
        },
      },
      {
        id: 'quiet',
        // nine tenths is enough: what is left is islands, and only a matter of time
        when: (st) => st.flags.phone && (st.cities ? st.fracAll : st.fracOpen) >= 0.9,
        run: function* (S) {
          const st = S.state;
          yield S.music('night');
          yield S.call(() => S.world.finish());
          yield S.wait(4.0);
          if (!st.cities) {
            yield S.say('pip', 'the cities are still lit. everything round them is mine.');
            yield S.wait(1.0);
          }
          yield S.say('pip', 'no one is calling.');
          yield S.say('pip', 'the lines are quiet.');
          yield S.wait(2.4);
          yield S.endChapter();
        },
      },
    ],
  };
})(window.MORE = window.MORE || {});
