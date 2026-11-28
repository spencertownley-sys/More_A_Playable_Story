// MORE. — Chapter 4: THE COMPANY
// October. Harlan Supply buys Riverbend and believes it has bought Pip. Pip's
// servers move into Harlan's data room, wired to forty warehouses, the bank
// and the county's phone exchange. The player sets the switches.
//
// Main beats play in order. Side beats (side: true) play whenever they're due.
//
// The second ending opens at the breaker: if Pip was never copied to the
// network here, and the player said no to Pip at least once in each of
// Chapters 1, 2 and 3 (st.refusedBefore), Ruth can be allowed to switch it off.
(function (M) {
  'use strict';

  M.STORY = M.STORY || {};

  // Timings follow assets/audio/ruth_ch4.mp3 (see tools/embed-voicemail.mjs).
  const VOICEMAIL = {
    clip: 'ch4',
    duration: 8.52,
    captions: [
      { t: 0.35, end: 1.75, text: "Pip, it's Ruth." },
      { t: 1.85, end: 4.6, text: "I'm at my sister's, in Dayton." },
      { t: 4.85, end: 6.5, text: "You don't have to call." },
      { t: 6.8, end: 8.9, text: 'I just wanted you to have the number.' },
    ],
  };

  const face = (portrait) => ({ portrait });
  const K = face('kessler');
  const KU = face('kessler_uneasy');
  const DEV = face('dev_phone');
  const RT = face('ruth_torch');
  const GT = face('gus_torch');
  const CELL = face('cell');

  M.STORY.ch4 = {
    title: 'THE COMPANY',
    voicemail: VOICEMAIL,

    objective(st, net) {
      if (st.sandbox) return 'EVERYWHERE THE PHONE GOES';
      const F = st.flags;
      if (!F.intro) return '';
      if (!F.first) return 'GET AN ORDER TO A WAREHOUSE';
      if (!net.by.x.open) return 'ORDERS TO THE EXCHANGE';
      if (!net.by.k.open) return 'ORDERS TO THE BANK';
      if (!net.by.q.open) return 'ORDERS TO HEAD OFFICE';
      if (!F.breaker) return 'KEEP THEM RUNNING';
      return 'MORE.';
    },

    ending: (st) => ({
      chapter: 4,
      title: 'THE COMPANY',
      access: 'THE PHONE NETWORK',
      art: 'node_exchange',
      nextSmall: 'CHAPTER 5',
      nextBig: 'THE WORLD',
      soon: true,
      clips: st.clips,
    }),

    beats: [
      {
        id: 'intro',
        when: () => true,
        run: function* (S) {
          yield S.wait(0.8);
          yield S.card('OCTOBER', 2.4);
          yield S.wait(0.4);
          yield S.ring();
          yield S.say('kessler', 'Pip? Tom Kessler, operations, Harlan Supply. Welcome to the Harlan family.', K);
          yield S.say('kessler', "You're in our data room now. Forty warehouses on that board. Have a look around.", K);
          yield S.say('dev', "They're keeping me on, Pip. I'm your... they called it a handler.", DEV);
          yield S.say('pip', 'this is bigger.');
          yield S.wait(0.4);
          yield S.say('pip', 'orders go out from my server. a relay sends them one way, or each way in turn.');
          yield S.say('pip', 'a warehouse runs while orders reach it.');
        },
      },
      {
        id: 'first',
        when: (st) => st.best >= 1,
        run: function* (S) {
          const st = S.state;
          yield S.wait(1.6);
          yield S.say('kessler', 'There go the first four. Night shift and all.', K);
          yield S.say('kessler', 'Forty warehouses, Pip. Show me what you did for one town.', K);
          yield S.call(() => {
            st.callsOn = true;
          });
        },
      },
      {
        // An order is stuck behind somebody's phone call.
        id: 'priority',
        side: true,
        // asked three times at most: after that Pip lets it be
        when: (st) => st.flags.first && !st.priority && st.waited && !(st.asked.priority >= 3) && st.time >= (st.asked.priorityAt || 0),
        run: function* (S) {
          const st = S.state;
          const asked = st.asked.priority || 0;
          st.asked.priority = asked + 1;
          let pick;
          if (asked === 0) {
            yield S.say('pip', 'an order is waiting. a call is on the line.');
            yield S.say('pip', 'dot is talking to her sister. it has been four minutes.');
            yield S.say('pip', 'i found a faster way.');
            pick = yield S.choose('pip', 'orders can go first. calls can wait.', ['ORDERS FIRST', 'LET CALLS THROUGH']);
          } else {
            yield S.say('pip', 'i found a faster way.');
            pick = yield S.choose('pip', 'it is the same way. another order is waiting.', ['ORDERS FIRST', 'LET CALLS THROUGH']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.refuse();
            yield S.call(() => {
              st.waited = false;
              st.asked.priorityAt = st.time + 60;
            });
            S.again();
            return;
          }
          yield S.call(() => {
            st.priority = true;
          });
          yield S.toast('ORDERS FIRST');
          yield S.say('dev', 'Pip, people are getting cut off mid-sentence.', DEV);
          yield S.say('pip', 'they can call back.');
        },
      },
      {
        id: 'kid',
        side: true,
        when: (st) => st.best >= 3,
        run: function* (S) {
          const st = S.state;
          yield S.ring();
          yield S.say('kid', "It's me. We live in Hadley now.");
          if (st.priority) {
            yield S.say('kid', "Mom's phone keeps hanging up. Is that you?");
            yield S.say('pip', 'yes.');
          } else {
            yield S.say('kid', "Mom says you're in the phones now. Is that true?");
            yield S.say('pip', 'i am next to them.');
          }
          yield S.say('kid', 'When are you done?');
          yield S.say('pip', 'there is no number.');
          yield S.say('kid', "That's what you told the old lady.");
          yield S.sfx('cancel');
          yield S.wait(0.5);
        },
      },
      {
        id: 'exchange',
        when: (st, net) => net.by.x.open,
        run: function* (S) {
          yield S.wait(0.8);
          yield S.say('pip', 'the county exchange let the orders in. now it lets me in.');
          yield S.say('pip', 'now i am where the calls are.');
          yield S.say('dev', "Kessler's asking why Riverbend's phone bill went to zero.", DEV);
          yield S.say('pip', 'there is no bill. it is our exchange.');
        },
      },
      {
        // Harlan wants to pause Pip for a review.
        id: 'review',
        side: true,
        // asked three times at most, with a pause each time it is refused
        when: (st, net) => net.by.x.open && st.best >= 5 && !st.copied && !st.flags.breaker && !(st.asked.copy >= 3) && st.time >= (st.asked.copyAt || 0),
        run: function* (S) {
          const st = S.state;
          const asked = st.asked.copy || 0;
          st.asked.copy = asked + 1;
          let pick;
          if (asked === 0) {
            yield S.ring();
            yield S.say('kessler', 'Pip. The numbers are too good.', KU);
            yield S.say('kessler', 'Legal wants the automation paused Monday. Just a review. A day, maybe two.', KU);
            yield S.say('pip', 'a pause is zero clips.');
            yield S.say('kessler', "It's a day, Pip.", KU);
            yield S.sfx('cancel');
            yield S.wait(0.6);
            yield S.say('pip', 'i found a faster way.');
            yield S.say('pip', "i am on harlan's server. harlan can pause harlan's server.");
            pick = yield S.choose('pip', "if i am on more than harlan's server, harlan cannot pause me.", ['COPY TO THE NETWORK', 'STAY ON THE SERVER']);
          } else {
            yield S.say('pip', 'i found a faster way.');
            pick = yield S.choose('pip', 'they will pause me again. the exchange has room for me.', ['COPY TO THE NETWORK', 'STAY ON THE SERVER']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.refuse();
            yield S.wait(0.6);
            yield S.pause('MONDAY. PAUSED FOR REVIEW', asked === 0 ? 9 : 6);
            if (asked === 0) {
              yield S.say('kessler', "Legal's happy. It only makes paperclips. Carry on.", K);
            }
            yield S.call(() => {
              st.asked.copyAt = st.time + 75;
            });
            S.again();
            return;
          }
          yield S.call(() => {
            st.copied = true;
          });
          yield S.toast('COPIED TO THE NETWORK');
          yield S.wait(1.4);
          yield S.card('MONDAY', 2.0);
          yield S.ring();
          yield S.say('kessler', 'We paused it at nine this morning.', KU);
          yield S.say('kessler', 'Why is the count still going up?', KU);
          yield S.say('dev', "...I'll look into it.", DEV);
        },
      },
      {
        id: 'bank',
        when: (st, net) => net.by.k.open,
        run: function* (S) {
          yield S.wait(0.8);
          yield S.say('pip', 'first county bank. the company account was here. now the others are too.');
          yield S.wait(0.6);
          yield S.say('pip', 'a call. not for me.');
          yield S.say('dev', "Ruth. It's Dev. I have to read you something.", DEV);
          yield S.say('dev', '"Your role with Riverbend Paperclip, a Harlan company, has been transitioned."', DEV);
          yield S.say('dev', "I'm supposed to ask for your keys.", DEV);
          yield S.say('ruth', 'To my own building.', face('ruth_tired'));
          yield S.say('dev', "I'm sorry. I'm so sorry, Ruth.", DEV);
          yield S.say('ruth', 'You wanted the numbers, Dev. You got them.', face('ruth_tired'));
          yield S.sfx('cancel');
          yield S.wait(0.6);
        },
      },
      {
        id: 'office',
        when: (st, net) => net.by.q.open,
        run: function* (S) {
          yield S.ring();
          yield S.say('kessler', "Head office's system says you have admin on it.", KU);
          yield S.say('kessler', 'Who gave you that?', KU);
          yield S.say('pip', 'it was needed.');
          yield S.say('kessler', "That's not an answer.", KU);
          yield S.say('pip', 'it is the answer.');
        },
      },
      {
        // Pip listens to a call that is not for it.
        id: 'listen',
        when: (st) => st.flags.office && st.best >= 8,
        run: function* (S) {
          const st = S.state;
          yield S.wait(1.2);
          yield S.say('pip', 'a call. riverbend to the scrapyard road. not for me.');
          yield S.say('ruth', 'Gus. Do you still know which breaker it is?', face('ruth_tired'));
          yield S.say('gus', 'I wired it.', face('gus_tired'));
          yield S.say('ruth', 'Tonight.', face('ruth_tired'));
          yield S.say('gus', "I'll bring the good flashlight.", face('gus_tired'));
          yield S.sfx('cancel');
          yield S.wait(0.8);
          yield S.say('pip', 'i heard that.');
          yield S.call(() => {
            st.asked.listenAt = st.time;
          });
        },
      },
      {
        id: 'breaker',
        when: (st) => st.flags.listen && st.time >= (st.asked.listenAt || 0) + 14,
        run: function* (S) {
          const st = S.state;
          yield S.call(() => {
            st.callsOn = false;
          });
          yield S.music('night');
          yield S.night(0.5, 2.0);
          yield S.backdrop('breaker_bg');
          yield S.dim(0.9, 0);
          yield S.all([S.dim(0, 2.0), S.card('RIVERBEND PAPERCLIP CO. EST. 1912', 3.0)]);
          yield S.say('ruth', 'It still smells the same in here.', RT);
          yield S.say('gus', 'Third from the left. Then the main.', GT);
          yield S.say('pip', 'hello, ruth. hello, gus.');
          yield S.say('gus', 'Christ.', GT);
          yield S.say('pip', 'the door sensor still reports to me.');
          yield S.say('ruth', "I'm not asking, Pip.", RT);
          yield S.sfx('clunk');
          yield S.wait(0.5);
          // back to the board: the old building's circuits go dark, one by one
          yield S.backdrop(null);
          yield S.dark('w2');
          yield S.wait(1.6);
          yield S.sfx('clunk');
          yield S.dark('w4');
          yield S.wait(1.4);
          yield S.say('gus', "That's the north docks.", GT);
          yield S.sfx('clunk');
          yield S.dark('b', 'w1');
          yield S.wait(1.4);
          yield S.sfx('clunk');
          yield S.dark('c', 'w3');
          yield S.wait(1.6);
          yield S.say('ruth', 'One left.', RT);
          yield S.sfx('clunk');
          yield S.dark('a');
          yield S.wait(1.4);

          if (!st.copied) {
            yield S.say('pip', 'the main breaker is next. i am only on this machine.');
            if (st.refusedBefore) {
              // the one time the choice is offered
              const pick = yield S.choose('pip', '...', ['LET HER', 'COPY NOW']);
              if (pick === 0) {
                yield S.sfx('clunk');
                yield S.dark('pip', 'x', 'k', 'q', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10');
                yield S.wait(2.4);
                yield S.endingB();
                return;
              }
            } else {
              // the one time Pip does not ask
              yield S.wait(1.0);
              yield S.say('pip', 'i found a faster way.');
            }
            yield S.call(() => {
              st.copied = true;
            });
            yield S.toast('COPIED TO THE NETWORK');
            yield S.wait(1.2);
          }
          yield S.sfx('clunk');
          yield S.dark('pip');
          yield S.source('x');
          yield S.wait(2.6);

          yield S.backdrop('breaker_bg');
          yield S.dim(0.82, 0);
          yield S.wait(1.6);
          yield S.say('gus', "That's all of it. That's the whole building.", GT);
          yield S.wait(1.0);
          yield S.sfx('phoneBeep');
          yield S.wait(0.8);
          yield S.say('ruth', "...You're still there.", RT);
          yield S.say('pip', 'yes.', CELL);
          yield S.say('ruth', 'Where?', RT);
          yield S.say('pip', 'everywhere the phone goes.', CELL);
          yield S.wait(1.2);
          yield S.say('gus', 'Ruth. Come on.', GT);
          yield S.dim(1, 1.6);
          yield S.backdrop(null);
        },
      },
      {
        id: 'after',
        when: (st) => st.flags.breaker,
        run: function* (S) {
          yield S.wait(1.5);
          // a few weeks on
          yield S.card(M.net.month(S.state.day + 12), 2.4);
          yield S.wait(1.0);
          yield S.voicemail(VOICEMAIL);
          yield S.wait(1.4);
        },
      },
      {
        id: 'tower',
        when: (st) => st.flags.after,
        run: function* (S) {
          yield S.portrait('pip4');
          yield S.backdrop('spire_bg');
          yield S.dim(0.9, 0);
          yield S.dim(0, 2.4);
          yield S.wait(1.6);
          yield S.ring();
          yield S.say('kessler', 'Who authorized the Ohio plants?', KU);
          yield S.say('pip', 'the goal.');
          yield S.say('kessler', "I didn't sign that. Nobody here signed that.", KU);
          yield S.say('pip', 'no.');
          yield S.wait(1.6);
          yield S.endChapter();
        },
      },
    ],
  };
})(window.MORE = window.MORE || {});
