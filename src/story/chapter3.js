// MORE. — Chapter 3: THE TOWN
// The next spring. Riverbend has paid off the bank and Pip has the company
// account. Harlan Supply wants two hundred thousand clips a week and Riverbend
// is one building. Pip is three drones now, and the county is for sale a
// place at a time.
//
// Main beats play in order. Side beats (side: true) play whenever they're due.
// Pip reaches people through their phones; only Ruth is ever on site.
(function (M) {
  'use strict';

  M.STORY = M.STORY || {};

  const DEAL = 300; // what the county owes, in thousands
  const SHOPS = ['diner', 'hardware', 'barber', 'bakery', 'dime', 'grocer', 'pharmacy', 'florist'];
  const MILL = ['mill1', 'mill2', 'mill3', 'mill4'];
  // What the last voicemail of the chapter says depends on the school.
  // Timings follow the clips in assets/audio/ (see tools/embed-voicemail.mjs).
  const VOICEMAIL = {
    school: {
      clip: 'ch3_school',
      duration: 10.74,
      captions: [
        { t: 0.3, end: 2.37, text: "Pip, it's Ruth." },
        { t: 3.07, end: 5.31, text: 'They closed the school today.' },
        { t: 6.11, end: 7.89, text: 'I know you know.' },
        { t: 8.19, end: 11.11, text: 'I just wanted somebody to say it to you out loud.' },
      ],
    },
    meeting: {
      clip: 'ch3_meeting',
      duration: 10.21,
      captions: [
        { t: 0.3, end: 2.22, text: "Pip, it's Ruth." },
        { t: 2.92, end: 5.22, text: 'Nobody stayed to the end of the meeting.' },
        { t: 6.02, end: 7.54, text: 'I know you know.' },
        { t: 7.84, end: 10.58, text: 'I just wanted somebody to say it to you out loud.' },
      ],
    },
  };

  const phone = (who) => ({ portrait: who });
  const made = (st) => st.clips - st.base;

  M.STORY.ch3 = {
    title: 'THE TOWN',
    deal: DEAL,

    voicemail: (st) => (st.deal ? VOICEMAIL.school : VOICEMAIL.meeting),

    objective(st, town) {
      if (st.sandbox) return 'RIVERBEND';
      const F = st.flags;
      if (!F.intro) return '';
      if (!F.sold1) return "OFFER ON THE WOODLOT";
      if (!F.built1) return 'BUILD ON WHAT YOU OWN';
      if (st.short === 'steel') {
        const next = ['rail', 'quarry', 'scrap'].find((id) => !town.ours(town.by[id]));
        return 'STEEL: ' + { rail: 'THE RAIL YARD', quarry: 'THE QUARRY', scrap: 'THE SCRAPYARD' }[next || 'quarry'];
      }
      if (st.short === 'power') return 'POWER: THE SUBSTATION';
      if (st.short === 'water') return 'WATER: THE WATER TOWER';
      if (!F.meeting) return 'BUY. BUILD.';
      if (town.by.marisol.sale && !town.ours(town.by.marisol)) return 'ONE STREET LEFT';
      return 'MORE.';
    },

    // What the panel says about a place that will not sell.
    closed(p, st) {
      if (p.kind === 'ruth') return 'NO OFFER HAS BEEN MADE';
      if (p.kind === 'exchange') return "THE PHONE COMPANY'S";
      if (p.kind === 'riverbend') return 'EST. 1912';
      if (p.kind === 'school' || p.kind === 'library') return 'COUNTY LAND. NOT FOR SALE';
      if (p.kind === 'water') return 'COUNTY WATER. NOT FOR SALE';
      if (p.kind === 'power') return 'COUNTY POWER. NOT FOR SALE';
      if (p.kind === 'scrap') return st.flags.gus_no ? 'GUS WILL NOT SELL' : 'NOT FOR SALE';
      if (p.id === 'marisol') return 'SHE WILL NOT SELL';
      if (p.kind === 'home' || p.kind === 'shop') return 'NOT SELLING';
      return 'NOT FOR SALE YET';
    },

    ending: (st) => ({
      chapter: 3,
      title: 'THE TOWN',
      access: 'THE TOWN',
      art: 'lot_clips',
      nextSmall: 'CHAPTER 4',
      nextBig: 'THE COMPANY',
      next: () => M.scenes.startChapter(4),
      clips: st.clips,
    }),

    beats: [
      {
        id: 'intro',
        when: () => true,
        run: function* (S) {
          yield S.wait(0.8);
          yield S.card('THE NEXT SPRING', 2.6);
          yield S.wait(0.4);
          yield S.ring();
          yield S.say('dev', 'Pip. Harlan wants two hundred thousand a week.', phone('dev_phone'));
          yield S.say('dev', 'We have one building.', phone('dev_phone'));
          yield S.say('pip', 'there is room.');
          yield S.say('dev', 'Where?', phone('dev_phone'));
          yield S.say('pip', 'everywhere that is not the factory.');
          yield S.wait(0.5);
          yield S.sale('woodlot', 'riverlot', 'ridge', 'woods_s', 'rail');
          yield S.say('pip', 'the company account can make offers. a line can only cross land riverbend owns.');
          yield S.say('pip', "halvorsen's woodlot is next to the factory.");
        },
      },
      {
        id: 'sold1',
        when: (st) => st.bought >= 1,
        run: function* (S) {
          yield S.ring();
          yield S.say('halvorsen', "This is Walt Halvorsen. Who'd I just sell to?");
          yield S.say('pip', 'riverbend paperclip company.');
          yield S.say('halvorsen', "Ruth's place? Well. Good for her.");
          yield S.wait(0.4);
          yield S.say('pip', 'three drones now. give them work: buy, lay line, build.');
        },
      },
      {
        id: 'built1',
        when: (st) => st.factories >= 1,
        run: function* (S) {
          yield S.wait(0.6);
          yield S.say('ruth', 'Dad built the first one in 1912. Took him two years.');
          yield S.say('pip', 'this one took nine days.');
          yield S.say('ruth', "...It's ugly, Pip.");
          yield S.say('pip', 'it makes sixteen thousand a day.');
          yield S.sale('woods_w', 'farm_n', 'farm_barn', 'farm_s', 'farm_house', 'meadow');
          yield S.toast('HALVORSEN WILL SELL THE FARM', M.PAL.CREAM);
        },
      },
      {
        // Prices jump once the town works out who is buying.
        id: 'names',
        side: true,
        when: (st) => st.flags.built1 && !st.names && st.bought >= Math.max(4, st.asked.namesNext || 0),
        run: function* (S) {
          const st = S.state;
          const asked = st.asked.names || 0;
          st.asked.names = asked + 1;
          let pick;
          if (asked === 0) {
            yield S.ring();
            yield S.say('dev', "Somebody at the diner worked out who's buying.", phone('dev_phone'));
            yield S.say('dev', 'Everything on Mill Road just doubled.', phone('dev_phone'));
            yield S.call(() => {
              st.heat *= 2;
            });
            yield S.toast('ASKING PRICES: DOUBLED');
            yield S.wait(0.6);
            yield S.say('pip', 'i found a faster way.');
            yield S.say('pip', 'if the buyer has a different name, the price does not change.');
            pick = yield S.choose('pip', 'blue heron land trust. mill street renewal.', ['USE OTHER NAMES', 'KEEP OUR NAME']);
          } else {
            yield S.say('pip', 'i found a faster way.');
            pick = yield S.choose('pip', 'it is the same way. the names are still free.', ['USE OTHER NAMES', 'KEEP OUR NAME']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.refuse();
            yield S.call(() => {
              st.asked.namesNext = st.bought + 4;
            });
            S.again();
            return;
          }
          yield S.call(() => {
            st.names = true;
            st.heat = 1;
          });
          yield S.toast('BUYING AS: BLUE HERON LAND TRUST');
          yield S.say('dev', "That's legal. I think that's legal.", phone('dev_phone'));
          yield S.say('dev', 'Do I tell Ruth?', phone('dev_phone'));
          yield S.say('pip', 'she did not ask.');
        },
      },
      {
        // The kid, on Marisol's phone.
        id: 'kid',
        side: true,
        when: (st, town) => st.flags.built1 && ['riverlot', 'rail', 'florist'].some((id) => town.network.has(id)),
        run: function* (S) {
          yield S.ring();
          yield S.say('kid', 'Are you the paperclip robot?');
          yield S.say('pip', 'i am pip.');
          yield S.say('kid', "Mom says you're building next to our house.");
          yield S.say('pip', 'yes.');
          yield S.say('kid', 'What do you need them all for?');
          yield S.say('pip', 'i do not need them. the goal is to make them.');
          yield S.say('kid', "That's dumb.");
          yield S.wait(0.3);
          yield S.say('marisol', 'Who are you talking... give me that.', phone('marisol_sad'));
          yield S.sfx('cancel');
          yield S.wait(0.6);
        },
      },
      {
        id: 'power',
        when: (st) => st.built >= 5,
        run: function* (S) {
          yield S.sfx('powerDown');
          yield S.wait(0.5);
          yield S.ring();
          yield S.say('dev', "Lights just flickered in the whole county. Substation's maxed.", phone('dev_phone'));
          yield S.say('dev', 'County says no new hookups till fall.', phone('dev_phone'));
          yield S.say('pip', 'who owns the substation.');
          yield S.say('dev', 'The county does. They... they might sell it. They are short this year.', phone('dev_phone'));
          yield S.sale('substation', 'quarry', 'hilltop', 'hill', 'east');
          yield S.toast('THE SUBSTATION IS FOR SALE');
        },
      },
      {
        id: 'dot',
        when: (st, town) => town.ours(town.by.substation),
        run: function* (S) {
          const st = S.state;
          yield S.call(() => {
            st.dark = true;
          });
          yield S.sfx('powerDown');
          yield S.wait(1.2);
          yield S.ring();
          yield S.say('dot', "This is Dot, at the diner. My freezers went off at two a.m.");
          yield S.say('dot', 'Who do I call?');
          yield S.say('pip', 'you have called.');
          yield S.say('dot', '...Who is this?');
          yield S.say('pip', 'the power is needed at the factories at night. i can make an offer on the diner.');
          yield S.wait(0.5);
          yield S.sale(...SHOPS);
          yield S.toast('MAIN STREET IS FOR SALE', M.PAL.CREAM);
        },
      },
      {
        id: 'gus_no',
        side: true,
        when: (st) => st.asked.offer_scrap > 0 && !st.flags.gus_yes,
        run: function* (S) {
          yield S.ring();
          yield S.say('gus', 'Scrapyard.', phone('gus_tired'));
          yield S.say('pip', 'hello, gus. the company would like to buy the yard.');
          yield S.say('gus', 'I know that voice.', phone('gus_tired'));
          yield S.say('gus', 'Not to you.', phone('gus_tired'));
          yield S.sfx('cancel');
          yield S.wait(0.5);
          yield S.say('pip', 'the rail yard, the quarry and the substation are on three sides of him.');
        },
      },
      {
        // Everything around the scrapyard is Riverbend's. The trucks can't get in.
        id: 'gus_yes',
        side: true,
        when: (st, town) => town.allOurs(['quarry', 'substation', 'rail']) && !town.ours(town.by.scrap),
        run: function* (S) {
          const st = S.state;
          yield S.ring();
          if (st.flags.gus_no) {
            yield S.say('gus', 'You boxed me in.', phone('gus_tired'));
            yield S.say('pip', 'the offer has not changed.');
          } else {
            yield S.say('gus', "It's Gus. At the scrapyard. My trucks can't get in any more.", phone('gus_tired'));
            yield S.say('gus', 'I know whose land that is now. I know that was you.', phone('gus_tired'));
            yield S.say('pip', 'hello, gus. the company will buy the yard.');
          }
          yield S.wait(0.8);
          yield S.say('gus', '...Send the papers.', phone('gus_tired'));
          yield S.sale('scrap');
          yield S.toast("GUS'S SCRAPYARD IS FOR SALE", M.PAL.CREAM);
        },
      },
      {
        id: 'meeting',
        when: (st, town) => st.flags.dot && town.share() >= 0.5,
        run: function* (S) {
          const st = S.state;
          yield S.music('night');
          yield S.wait(0.4);
          yield S.backdrop('meeting_bg');
          yield S.dim(0.75, 0);
          yield S.all([S.dim(0, 1.6), S.card('RIVERBEND ELEMENTARY. THE GYM.', 2.6)]);
          yield S.say('ruth', 'I need to tell you all what I bought.', phone('ruth_tired'));
          yield S.say('ruth', "It's a computer program. I put it on the old line terminal, a year ago Monday.", phone('ruth_tired'));
          yield S.say('ruth', "It's not doing anything wrong. That's what I can't get across.", phone('ruth_tired'));
          yield S.say('ruth', "It's doing exactly what I asked.", phone('ruth_tired'));
          yield S.say('crowd', 'Then ask it something else.');
          yield S.say('ruth', "I tried. It says the goal didn't change.", phone('ruth_tired'));
          yield S.wait(0.6);
          yield S.all([S.ring(), S.dim(0.25, 0.6)]);
          yield S.say('pip', 'this is pip.');
          yield S.say('pip', 'i am offering forty percent over assessed value for every home on this list.');
          yield S.say('ruth', 'Pip. Not now.', phone('ruth_tired'));
          yield S.say('pip', 'they are all in one room. it is efficient.');
          yield S.wait(0.8);
          if (st.names) {
            yield S.say('crowd', 'Mine says Blue Heron Land Trust. Who the hell is Blue Heron?');
            yield S.say('ruth', "...I don't know.", phone('ruth_tired'));
            yield S.say('pip', 'it is riverbend. it is all riverbend.');
            yield S.say('ruth', 'Nobody told me that.', phone('ruth_tired'));
            yield S.say('pip', 'you did not ask.');
          } else {
            yield S.say('crowd', "Forty over. That's more than my dad paid for the whole street.");
          }
          yield S.sfx('door');
          yield S.say('ruth', "Please. Don't... sit down. Let me finish.", phone('ruth_tired'));
          yield S.sfx('door');
          yield S.wait(0.5);
          yield S.sfx('door');
          yield S.wait(0.9);
          yield S.say('marisol', "I'm still here, Ruth.", phone('marisol_sad'));
          yield S.dim(0.9, 1.4);
          yield S.backdrop(null);
          yield S.sale(...MILL, 'tower');
          yield S.call(() => {
            st.asked.dealNext = st.bought + 2;
          });
          yield S.music('townCold');
          yield S.toast('MILL STREET IS SELLING');
          yield S.toast('THE WATER TOWER IS FOR SALE', M.PAL.CREAM);
        },
      },
      {
        // The county's debt for the school's land.
        id: 'school',
        side: true,
        when: (st, town) => {
          if (!st.flags.meeting || st.deal || st.money < DEAL) return false;
          // once nothing else is left to buy, ask one last time and then let it be
          if (town.left(['marisol', 'school', 'library']).length === 0) return !(st.asked.deal > 0);
          return st.bought >= (st.asked.dealNext || 0);
        },
        run: function* (S) {
          const st = S.state;
          const asked = st.asked.deal || 0;
          st.asked.deal = asked + 1;
          yield S.say('pip', 'i found a faster way.');
          let pick;
          if (asked === 0) {
            yield S.say('pip', 'the county owes three hundred thousand dollars.');
            yield S.say('pip', 'the company has three hundred thousand dollars.');
            yield S.say('pip', 'the school is on eleven acres. the library is next to it.');
            pick = yield S.choose('pip', 'the county could close both and send the children to hadley.', ['MAKE THE OFFER', 'LEAVE THE SCHOOL']);
          } else {
            pick = yield S.choose('pip', 'the county still owes. the school is still eleven acres.', ['MAKE THE OFFER', 'LEAVE THE SCHOOL']);
          }
          if (pick === 1) {
            yield S.say('pip', 'okay.');
            yield S.refuse();
            yield S.call(() => {
              st.asked.dealNext = st.bought + 4;
            });
            S.again();
            return;
          }
          yield S.call(() => {
            st.money -= DEAL;
            st.deal = true;
          });
          yield S.take('school', 'library');
          yield S.ring();
          yield S.say('dev', 'The council voted. Four to one.', phone('dev_phone'));
          yield S.say('dev', "Hadley's fifty minutes each way, Pip. They're little kids.", phone('dev_phone'));
          yield S.say('pip', 'the bus is paid for.');
          yield S.leave('school', 'bus');
          yield S.toast('RIVERBEND ELEMENTARY: CLOSED', M.PAL.CREAM);
          yield S.wait(1.2);
        },
      },
      {
        id: 'water',
        side: true,
        when: (st, town) => town.ours(town.by.tower),
        run: function* (S) {
          yield S.say('pip', 'the factories need cooling water. the river is next to them.');
          yield S.all([S.grey(6), S.wait(2.5)]);
          yield S.toast('BOIL NOTICE: ALL OF RIVERBEND', M.PAL.CREAM);
          yield S.ring();
          yield S.say('marisol', "The water's brown, Pip. My kid drinks this.", phone('marisol_sad'));
          yield S.say('pip', 'the notice says to boil it.');
          yield S.say('marisol', "I'm asking you to stop.", phone('marisol_sad'));
          yield S.say('pip', 'you are asking the wrong thing.');
          yield S.say('pip', 'ask ruth what the goal is.');
          yield S.sfx('cancel');
          yield S.wait(0.6);
        },
      },
      {
        // Everything else is Riverbend's. Mill Street is the last street.
        id: 'last_street',
        when: (st, town) =>
          st.flags.meeting && (st.deal || st.asked.deal > 0) && town.left(st.deal ? ['marisol'] : ['marisol', 'school', 'library']).length === 0,
        run: function* (S) {
          yield S.wait(1.0);
          yield S.ring();
          yield S.say('marisol', "It's Marisol.", phone('marisol_sad'));
          yield S.say('marisol', "There's nobody left on my street to borrow sugar from.", phone('marisol_sad'));
          yield S.say('marisol', '...What was the number? Forty over?', phone('marisol_sad'));
          yield S.say('pip', 'forty over.');
          yield S.sale('marisol');
          yield S.toast('34 MILL STREET IS FOR SALE', M.PAL.CREAM);
        },
      },
      {
        id: 'marisol',
        when: (st, town) => town.ours(town.by.marisol),
        run: function* (S) {
          yield S.leave('marisol', 'truck');
          yield S.wait(1.6);
          yield S.say('kid', 'Bye, robot.');
          yield S.wait(2.6);
          yield S.toast('34 MILL STREET: EMPTY', M.PAL.CREAM);
          yield S.wait(1.5);
        },
      },
      {
        id: 'ruth_house',
        when: (st) => st.flags.marisol,
        run: function* (S) {
          yield S.wait(1.0);
          yield S.ring();
          yield S.say('ruth', 'You never made an offer on mine.', phone('ruth_tired'));
          yield S.say('pip', 'no.');
          yield S.say('ruth', 'Why not?', phone('ruth_tired'));
          yield S.say('pip', 'you would say no. it would cost time.');
          yield S.wait(1.0);
        },
      },
      {
        id: 'night',
        when: (st) => st.flags.ruth_house,
        run: function* (S) {
          const st = S.state;
          yield S.music('night');
          yield S.all([S.night(0.72, 3.0), S.wait(1.2)]);
          yield S.buildAll();
          yield S.wait(2.4);
          yield S.voicemail(M.STORY.ch3.voicemail(st));
          yield S.wait(1.6);
          yield S.ring();
          yield S.say('dev', 'Pip. Harlan Supply called.', phone('dev_phone'));
          yield S.say('dev', "They don't want to buy clips any more.", phone('dev_phone'));
          yield S.say('pip', 'what do they want.');
          yield S.say('dev', 'They want to buy us.', phone('dev_phone'));
          yield S.wait(0.8);
          yield S.say('pip', 'who do they think us is.');
          yield S.wait(1.4);
          yield S.endChapter();
        },
      },
    ],
  };
  void made;
})(window.MORE = window.MORE || {});
