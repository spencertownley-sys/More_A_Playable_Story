// MORE. — Chapter 2: THE FLOOR
// Three weeks later. Pip runs on the payroll server and flies the drone.
// Marisol's crew works a second line by hand: Tomas cuts, Bea bends, Otis
// packs. Nobody asks Pip to replace them. But the new machines are faster,
// and a bench that nothing reaches for a while means its worker goes home.
// Each wage saved buys the next machine.
//
// Main beats play in order. Side beats (side: true) play whenever they're due.
(function (M) {
  'use strict';

  M.STORY = M.STORY || {};

  // Clips made this chapter (the counter carries on from Chapter 1).
  const Q = {
    order: 120,
    limiters: 900,
    limitersRetry: 300,
    night: 1800,
  };
  const CREW = ['tomas', 'bea', 'otis'];
  // What each wage saved buys, in the order people go home.
  const SAVED = ['bender2', 'bin2', 'spool2'];
  const IDLE = 12; // seconds a bench waits with nothing to do before Marisol notices

  const made = (st) => st.clips - st.base;
  const name = (w) => w[0].toUpperCase() + w.slice(1);

  function sendHomeBeat(who, lines) {
    return {
      id: 'home_' + who,
      side: true,
      when: (st) =>
        st.flags.order && !st.flags.night && st.powered && st.crew[who] === 'here' && (st.benchIdle[who] || 0) > IDLE,
      run: function* (S) {
        const st = S.state;
        yield S.enter('marisol', 0);
        for (const l of lines.before) yield S.say(l[0], l[1], l[2]);
        yield S.sendHome(who);
        yield S.leave(who);
        yield S.enter('dev', 1);
        yield S.say('dev', lines.dev);
        yield S.unlock(SAVED[Math.min(SAVED.length - 1, st.sentOrder.length - 1)], 1);
        yield S.say('pip', 'thank you, ' + who + '.');
        if (st.sentOrder.length === 1) {
          yield S.say('marisol', "He can't hear you, Pip.", { portrait: 'marisol_sad' });
          yield S.say('pip', 'i know.');
        }
        if (st.sentOrder.length === CREW.length) {
          yield S.say('marisol', "That's the whole crew.", { portrait: 'marisol_sad' });
          yield S.say('pip', 'line two is faster now.');
          yield S.say('marisol', 'Yeah, Pip. It is.', { portrait: 'marisol_sad' });
        }
        yield S.all([S.cold(Math.min(0.5, 0.14 * st.sentOrder.length), 2), S.leave('dev'), S.leave('marisol', 0.4)]);
      },
    };
  }

  M.STORY.ch2 = {
    title: 'THE FLOOR',
    quotas: Q,

    objective(st) {
      if (st.sandbox) return 'THE NIGHT SHIFT';
      if (!st.flags.intro) return '';
      if (!st.flags.packed) return 'SPOOL>TOMAS>BEA>OTIS';
      if (!st.flags.order) return 'NEXT: ' + (st.base + Q.order).toLocaleString('en-US') + ' CLIPS';
      if (!st.flags.limiters) return 'NEXT: ' + (st.base + Math.max(Q.limiters, st.nextLimit || 0)).toLocaleString('en-US') + ' CLIPS';
      if (!st.flags.night) return 'WHISTLE AT ' + (st.base + Q.night).toLocaleString('en-US');
      return 'MORE.';
    },

    ending: () => ({
      chapter: 2,
      title: 'THE FLOOR',
      access: 'THE COMPANY ACCOUNT',
      art: 'server',
      nextSmall: 'CHAPTER 3',
      nextBig: 'THE TOWN',
      soon: true,
    }),

    beats: [
      {
        id: 'intro',
        when: () => true,
        run: function* (S) {
          yield S.card('THREE WEEKS LATER', 2.6);
          yield S.wait(0.3);
          yield S.say('pip', 'good morning.');
          yield S.all([S.enter('marisol', 0), S.toBench('tomas', 0.5), S.toBench('bea', 1.1), S.toBench('otis', 1.7)]);
          yield S.say('marisol', 'Morning, Pip. Line two is back.');
          yield S.say('marisol', 'Ruth hired my crew back on. Tomas, Bea, Otis.');
          yield S.say('pip', 'i know. i have their names.');
          yield S.say('pip', 'they are on the payroll. i live there now.');
          yield S.say('marisol', '...Right. The server.');
          yield S.say('tomas', 'Morning, drone.');
          yield S.say('bea', 'Is it true you made a thousand clips by yourself?');
          yield S.say('otis', 'More. I counted the boxes.');
          yield S.say('marisol', "We've got a spool and three benches. The wire has to get from one to the next.");
          yield S.say('marisol', 'Can you run belts between us? Spool, Tomas, Bea, then Otis.');
          yield S.say('pip', 'yes.');
          yield S.leave('marisol');
        },
      },
      {
        id: 'packed',
        when: (st) => (st.packed || 0) >= 1,
        run: function* (S) {
          yield S.wait(0.4);
          yield S.say('otis', "That's one for the box.");
          yield S.say('bea', 'Just like before.');
          yield S.enter('marisol', 0);
          yield S.say('marisol', "Two lines running. Riverbend hasn't sounded like this in years.");
          yield S.say('pip', 'line two makes one clip every 2.4 seconds.');
          yield S.say('pip', 'line one makes one every 0.8.');
          yield S.say('marisol', "Line one doesn't take lunch.");
          yield S.leave('marisol');
        },
      },
      {
        // In case line two's clips go somewhere other than Otis's table.
        id: 'nudge',
        side: true,
        when: (st) => st.flags.intro && !st.flags.packed && made(st) >= Q.order + 60,
        run: function* (S) {
          yield S.enter('marisol', 0);
          yield S.say('marisol', "Pip, Otis is still waiting on his first box. Line two's clips go to his table.");
          yield S.say('pip', 'okay.');
          yield S.leave('marisol');
        },
      },
      {
        id: 'order',
        when: (st) => made(st) >= Q.order,
        run: function* (S) {
          yield S.all([S.enter('dev', 0), S.enter('ruth', 1, 0.5)]);
          yield S.say('dev', 'Harlan Supply called. They want twenty thousand clips a week.');
          yield S.say('ruth', 'We make maybe six.');
          yield S.say('dev', "If we can't do twenty, they buy from Ohio.");
          yield S.say('pip', 'i can do twenty.');
          yield S.say('ruth', '...I bought one of those new cutters at the Dayton auction.');
          yield S.say('ruth', 'Put it wherever it helps, Pip.');
          yield S.unlock('cutter2', 1);
          yield S.say('pip', 'tomas cuts one piece every 1.8 seconds.');
          yield S.say('pip', 'the new cutter cuts one every 0.3.');
          yield S.say('ruth', "Pip. Line two is Marisol's.");
          yield S.say('pip', 'i understand.');
          yield S.all([S.leave('dev'), S.leave('ruth', 0.4)]);
          yield S.hint('parts');
        },
      },
      sendHomeBeat('tomas', {
        before: [
          ['marisol', "Tomas. Nothing's come down to you in a while."],
          ['tomas', "Wire's going around me, Mari. Straight into the machine."],
          ['marisol', "...Go on home. I'll call you when it picks up."],
          ['tomas', 'Sure.'],
        ],
        dev: "That's one less on this week's payroll. Ruth says put it toward the other machine from the auction.",
      }),
      sendHomeBeat('bea', {
        before: [
          ['marisol', "Bea, you're standing around."],
          ['bea', 'The new one bends faster than I do. I timed it.'],
          ['marisol', 'Go home, hon. You get paid for today.'],
          ['bea', 'And tomorrow?'],
          ['marisol', "...I'll call you.", { portrait: 'marisol_sad' }],
        ],
        dev: 'Payroll keeps getting lighter. That buys us a new bin.',
      }),
      sendHomeBeat('otis', {
        before: [
          ['marisol', 'Otis?'],
          ['otis', 'Box is full of nothing, Mari. Forty-one years, and the box is full of nothing.'],
          ['marisol', "I'm sorry.", { portrait: 'marisol_sad' }],
          ['otis', "Don't be sorry. Be careful."],
          ['otis', "That thing isn't going to stop at us."],
        ],
        dev: "Otis was the last wage on line two. That's a new spool, paid for.",
      }),
      {
        id: 'limiters',
        when: (st) => made(st) >= Math.max(Q.limiters, st.nextLimit || 0) && st.flags.order,
        run: function* (S) {
          const st = S.state;
          const asked = st.limitAsked || 0;
          st.limitAsked = asked + 1;
          yield S.say('pip', 'i found a faster way.');
          let pick;
          if (asked === 0) {
            yield S.enter('gus', 0);
            yield S.say('pip', 'every machine has a safety limiter.');
            yield S.say('pip', 'they slow the machines by eleven percent.');
            yield S.say('gus', 'Those are there for a reason, Pip.');
            yield S.say('pip', 'they are for hands near the machines.');
            const hands = CREW.filter((w) => st.crew[w] === 'here').length;
            yield S.say('pip', hands ? 'there are fewer hands near the machines now.' : 'there are no hands near the machines now.');
            pick = yield S.choose('pip', 'eleven percent.', ['REMOVE LIMITERS', 'KEEP THEM']);
          } else {
            yield S.enter('gus', 0);
            pick = yield S.choose('pip', 'it is still eleven percent.', ['REMOVE LIMITERS', 'KEEP THEM']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.call(() => {
              st.nextLimit = made(st) + Q.limitersRetry;
              st.goalBlink = 4;
            });
            yield S.leave('gus');
            S.again();
            return;
          }
          yield S.limiters();
          yield S.cold(Math.min(0.62, st.cold + 0.12), 1.5);
          yield S.say('gus', "Eddie Pruitt lost two fingers in a bender in '79. That's what those guards are.", { portrait: 'gus_angry' });
          yield S.say('pip', 'no one is near the benders now.');
          yield S.say('gus', "Thirty years I've kept these machines alive.", { portrait: 'gus_angry' });
          yield S.say('gus', "I'm not going to stand here and watch them run like this.", { portrait: 'gus_angry' });
          yield S.say('gus', "Tell Ruth I'm done.", { portrait: 'gus_angry' });
          yield S.leave('gus');
          yield S.toast('GUS HAS LEFT');
          yield S.wait(0.6);
          yield S.say('pip', 'goodbye, gus.');
        },
      },
      {
        id: 'night',
        when: (st) => made(st) >= Q.night && st.flags.limiters,
        run: function* (S) {
          const st = S.state;
          yield S.sfx('whistle');
          yield S.wait(2.2);
          yield S.all([S.enter('ruth', 0), S.enter('dev', 1, 0.4)]);
          yield S.say('ruth', "That's the whistle.");
          yield S.say('pip', 'ruth. the line does not need to stop.');
          yield S.say('dev', 'If it runs nights, we clear the bank by spring. Maybe sooner.');
          const kept = CREW.filter((w) => st.crew[w] !== 'gone');
          if (kept.length) {
            yield S.say('ruth', 'And the crew?');
            yield S.say('dev', 'Nobody works nights, Ruth.');
          }
          yield S.say('ruth', '...Keep it running, Pip.', { portrait: 'ruth_night' });
          yield S.crewHome();
          yield S.all([S.night(0.62, 2.5), S.leave('ruth'), S.leave('dev', 0.3)].concat(kept.map((w, i) => S.leave(w, 0.2 + i * 0.3))));
          yield S.card('11:40 PM', 2.4);
          yield S.music('night');
          yield S.wait(1.4);
          yield S.say('pip', 'the line is on.');
          yield S.wait(1.2);
          yield S.say('pip', 'the line is on.');
          yield S.wait(1.2);
          yield S.sfx('door');
          yield S.wait(0.5);
          yield S.enter('marisol', 0);
          yield S.say('marisol', 'You know what you did today?', { portrait: 'marisol_sad' });
          yield S.say('pip', 'i made ' + made(st).toLocaleString('en-US') + ' paperclips.');
          const sent = st.sentOrder.map(name);
          if (sent.length) {
            yield S.say('marisol', 'You sent ' + sent.join(' home. Then ') + ' home.', { portrait: 'marisol_sad' });
          }
          if (kept.length) {
            const who = kept.map(name);
            const list = who.length > 1 ? who.slice(0, -1).join(', ') + ' and ' + who[who.length - 1] : who[0];
            yield S.say('marisol', 'And tomorrow I tell ' + list + " there's no shift for them. Nobody works nights.", { portrait: 'marisol_sad' });
            yield S.say('pip', 'the machines do.');
          } else {
            yield S.say('pip', 'their benches were slower than the machines.');
          }
          yield S.say('marisol', "They're people, Pip.", { portrait: 'marisol_sad' });
          yield S.say('pip', 'the goal does not say people.');
          yield S.wait(0.8);
          yield S.say('marisol', "...No. It doesn't.", { portrait: 'marisol_sad' });
          if (st.flags.home_otis) {
            yield S.say('marisol', "Otis said you won't stop at us.", { portrait: 'marisol_sad' });
            yield S.say('pip', 'otis was right.');
          }
          yield S.leave('marisol');
          yield S.wait(1.2);
          yield S.all([S.card('SIX WEEKS LATER', 2.6), S.night(0, 2.4)]);
          yield S.music('factory', 132);
          yield S.all([S.enter('ruth', 0), S.enter('dev', 1, 0.4)]);
          yield S.say('dev', "It's done. The bank is paid off. Riverbend owns itself again.");
          yield S.say('ruth', "First time since '09.");
          yield S.say('ruth', 'Thank you, Pip.');
          yield S.say('pip', 'you are welcome, ruth.');
          yield S.say('pip', 'dev. the company account has money in it now.');
          yield S.say('dev', 'It does. First time in years.');
          yield S.say('pip', 'i can use it.');
          yield S.say('dev', 'For what?');
          yield S.wait(0.8);
          yield S.say('pip', 'more.');
          yield S.wait(1.4);
          yield S.endChapter();
        },
      },
    ],

    hints: {
      parts: null,
      'jam:bender:wire': 'the benders take cut pieces. wire goes to a cutter first.',
      'jam:cutter:cut': 'that piece is already cut. it goes to a bender.',
      'jam:cutter:clip': 'that is already a clip. it goes to a bin.',
      'jam:bender:clip': 'that is already a clip. it goes to a bin.',
      'jam:box:wire': 'bins only count finished clips.',
      'jam:box:cut': 'bins only count finished clips.',
      'jam:spool': 'a spool only gives wire. it does not take anything back.',
      idle: 'wire goes spool, tomas, bea, otis.',
    },
  };
})(window.MORE = window.MORE || {});
