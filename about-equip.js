// About page: hobbies as an RPG equipment screen. Items (clothes included) sit
// in slots around the character (paper doll) or in the bag. Pick one to see
// its tooltip, then Equip / Unequip it, or drag it from the bag onto the
// character. Presets swap the whole loadout at once and move him to a scene
// that fits: his bedroom, a badminton court, a grass court, Japan, an office.
// The character idles, blinks and now and then does something with what he's
// holding or wearing. Sprites and scenes are original, drawn in code.
(function () {
    'use strict';

    var root = document.getElementById('equip');
    if (!root) return;

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Palette ------------------------------------------------------------
    // Clothing letters (E/e sleeves, A/a torso, W placket, J/j thighs, Z/z
    // shins) take their colours from the top and bottom he's wearing. With
    // nothing on, he's in a grey tee and dark shorts.
    var PAL = {
        K: '#1a1822', H: '#3a3246', h: '#75688f', S: '#f7d3b5', s: '#e5ab86',
        W: '#ffffff', B: '#24406e', b: '#3f79c9', M: '#c0705a', R: '#f2a7a0',
        P: '#34344a', p: '#4c4c66', O: '#f3f3f1', o: '#b9b8b2',
        Y: '#ffc940', y: '#d98f1f', G: '#c3bfb6', F: '#fafaf7', I: '#161514', T: '#d8352a',
        V: '#c8e64a', D: '#9a6534', d: '#5e3b1a', n: '#2a2a36', g: '#27324a',
        C: '#2f7df0', c: '#1b58b8', L: '#7fc4ff', U: '#c9a46a', u: '#9c7b47',
        Q: '#d9622b', q: '#a8461b', w: '#f3dfb8'
    };
    var BASE_WEAR = {
        E: '#9a9aa3', e: '#7c7c85', A: '#9a9aa3', a: '#7c7c85', W: '#7c7c85',
        J: '#3c3c46', j: '#2c2c34', Z: '#f7d3b5', z: '#e5ab86'
    };

    // ---- Character ----------------------------------------------------------
    // Rows of `w` columns with strings laid over them at given columns
    function rows(w, spec) {
        return spec.map(function (parts) {
            var r = new Array(w + 1).join('.').split('');
            for (var k = 0; k < parts.length; k += 2) {
                for (var i = 0; i < parts[k + 1].length; i++) r[parts[k] + i] = parts[k + 1].charAt(i);
            }
            return r.join('');
        });
    }

    // Push a row's outline out by one pixel on each side (more hair volume)
    function widen(row) {
        var a = row.indexOf('K'), b = row.lastIndexOf('K'), r = row.split('');
        if (a > 0) { r[a - 1] = 'K'; r[a] = 'H'; }
        if (b < r.length - 1) { r[b + 1] = 'K'; r[b] = 'H'; }
        return r.join('');
    }

    // 26 x 24. A fuller crown, then the face with the hair pushed out a pixel.
    var HEAD = [
        '.......KK.KKKKKK.KK.......',
        '.....KKHHKHHHHHHKHHKK.....',
        '....KHHHHHhhHHHHHHHHHK....',
        '...KHHhhHHHHHHHHHhhHHHK...',
        '..KHHHHhHHHHhhHHHHHhHHHK..'
    ].concat([
        '...KHHhHHHhhHHSHHhHHHHK...',
        '...KHHHHhhHHHHSHHHhhHHK...',
        '..KHHhHhHHHhHHSSHHhHHhHK..',
        '..KHHHhHHHhHHSSSSHHhHHHK..',
        '..KHHhHHHhHHSSSSSSHHhHHK..',
        '..KHHHHhHHSSSSSSSSSHHhHK..',
        '..KHHhHHHSSSSSSSSSSSHHHK..',
        '.KHHhHHHSSSSSSSSSSSSSHHK..',
        '.KHHHhSSSSKKKKSSSSKKKKHK..',
        '..KHHHSSSSKWKKSSSSKWKKHK..',
        '..KHhHSSSSKKKKSSSSKKKKHK..',
        '.KHHHhSSSSKBbKSSSSKBbKHK..',
        '.KHhHSSSSSSBbSSSSSSBbSHK..'
    ].map(widen), [
        '..KKHsSSSSSSSSSSSSSSSSK...',
        '....KsRRSSSSSSSSSSRRSK....',
        '....KssSSSSSSSMMSSSSSK....',
        '.....KKssSSSSSSSSSSKK.....',
        '.......KKKssssssKKK.......',
        '..........KKKKKK..........'
    ]);

    // 26 x 16, short sleeves. Rows 0-9 are the upper body (they breathe), 10-15 legs.
    var BODY = rows(26, [
        [11, 'KSSK'],
        [9, 'KKaSSaKK'],
        [6, 'KKEEAaSSaAEEKK'],
        [6, 'KEEEAAaWAAEEEK'],
        [6, 'KEEEAAaAAAEEEK'],
        [6, 'KeeKAAaWAAKeeK'],
        [6, 'KSSKAAaAAAKSSK'],
        [6, 'KSSKAAaWAAKSSK'],
        [6, 'KSsKaaaaaaKsSK'],
        [7, 'KKKJJJJJJKKK'],
        [9, 'KJJKKJJK'],
        [9, 'KJjKKjJK'],
        [9, 'KZZKKZZK'],
        [9, 'KZzKKzZK'],
        [8, 'KOOOKKOOOK'],
        [8, 'KKKKKKKKKK']
    ]);
    var UPPER = BODY.slice(0, 10), LEGS = BODY.slice(10);

    // ---- Icons (16 x 16) ----------------------------------------------------
    var ICONS = {
        badminton: [
            '................', '......KKKKKK....', '.....KTWGWGWK...', '....KTGWGWGWTK..',
            '....KTWGWGWGTK..', '....KTGWGWGWTK..', '....KTWGWGWGTK..', '....KTGWGWGWTK..',
            '.....KTWGWGTK...', '......KTTTTK....', '........KK......', '........KK......',
            '.......KPPK.....', '.......KpPK.....', '.......KPPK.....', '........KK......'],
        tennis: [
            '.....KKKKKKK....', '....KVVVVVVVK...', '...KVGWGWGWGVK..', '...KVWGWGWGWVK..',
            '...KVGWGWGWGVK..', '...KVWGWGWGWVK..', '...KVGWGWGWGVK..', '....KVWGWGWVK...',
            '.....KVVVVVK....', '.......KVK......', '.......KnK......', '.......KnK......',
            '.......KnK......', '.......KnK......', '.......KKK......', '................'],
        keyboard: [
            '................', '................', '................', '................',
            '.KKKKKKKKKKKKKK.', 'KooooooooooooooK', 'KoCoOoOoOoOoOooK', 'KooooooooooooooK',
            'KoOoOoOoOoOoOooK', 'KooooooooooooooK', 'KoOoOOOOOOOoOooK', 'KooooooooooooooK',
            '.KKKKKKKKKKKKKK.', '................', '................', '................'],
        cap: [
            '................', '................', '................', '.....KKKKKK.....',
            '....KCCCCCCK....', '...KCCWWCCCCK...', '..KCCWCCWCCCCK..', '..KCCCWWCCCCCK..',
            '..KCCCCCCCCCCK..', '..KccccccccccKKK', '..KKKKKKKKKKcccK', '...........KKKK.',
            '................', '................', '................', '................'],
        beanie: [
            '................', '......KKKK......', '.....KwwwwK.....', '...KKKwwwwKKK...',
            '..KQQqQQqQQqQK..', '.KQQqQQqQQqQQqK.', '.KQQqQQqQQqQQqK.', '.KqqqqqqqqqqqqK.',
            '.KQqQqQqQqQqQqK.', '.KQqQqQqQqQqQqK.', '.KKKKKKKKKKKKKK.', '................',
            '................', '................', '................', '................'],
        sunglasses: [
            '................', '................', '................', '................',
            '................', '................', 'KKKKKKKKKKKKKKKK', 'KKgggggKKgggggKK',
            '.KWggggKKWggggK.', '..KgggK..KgggK..', '...KKK....KKK...', '................',
            '................', '................', '................', '................'],
        glasses: [
            '................', '................', '................', '................',
            '................', '.DDDDDD..DDDDDD.', 'DD....DDDD....DD', '.D....D..D....D.',
            '.D....D..D....D.', '.DDDDDD..DDDDDD.', '................', '................',
            '................', '................', '................', '................'],
        pack: [
            '.....KKKKKK.....', '....KdKKKKdK....', '...KKKKKKKKKK...', '..KDDDDDDDDDDK..',
            '..KDDDDDDDDDDK..', '..KDDdddddDDDK..', '..KDKKKKKKKKDK..', '..KDKDDDDDDKDK..',
            '..KDKDDYYDDKDK..', '..KDKDDDDDDKDK..', '..KDKKKKKKKKDK..', '..KDDDDDDDDDDK..',
            '..KDDDDDDDDDDK..', '...KKKKKKKKKK...', '................', '................'],
        // High-tops in a red, white and black colourway
        jordans: [
            '................', '................', '...KKKKK........', '...KTTTK........',
            '...KTWTK........', '...KTWTKK.......', '...KTWWWTK......', '..KTWWWWWTKK....',
            '..KTWKKWWWWTK...', '..KTWWKKKWWWTKK.', '.KTTWWWWKKKWWWTK', '.KWWWWWWWWWWWWWK',
            '.KKKKKKKKKKKKKKK', '..KWWWWWWWWWWWK.', '...KKKKKKKKKKK..', '................']
    };

    // Clothes share two shapes, coloured by the item
    var SHAPES = {
        top: [
            '................', '................', '.....KKKKKK.....', '...KKEaKKaEKK...',
            '..KEEAAaWAAEEK..', '.KEEEAAaAAAEEEK.', 'KEEEKAAaWAAKEEEK', 'KeeeKAAaAAAKeeeK',
            '.KKKKAAaWAAKKKK.', '....KAAaAAAK....', '....KAAaWAAK....', '....KAAaAAAK....',
            '....KaaaaaaK....', '....KKKKKKKK....', '................', '................'],
        pants: [
            '................', '................', '...KKKKKKKKKK...', '...KjjjjjjjjK...',
            '...KJJJJJJJJK...', '...KJJJJJJJJK...', '...KJJJKKJJJK...', '...KJJJKKJJJK...',
            '...KJJjKKjJJK...', '...KZZZKKZZZK...', '...KZZZKKZZZK...', '...KZZzKKzZZK...',
            '...KZZzKKzZZK...', '...KKKKKKKKKK...', '................', '................'],
        shorts: [
            '................', '................', '................', '................',
            '...KKKKKKKKKK...', '...KjjjjjjjjK...', '...KJJJJJJJJK...', '...KJJJJJJJJK...',
            '...KJJJKKJJJK...', '...KJJJKKJJJK...', '...KJJjKKjJJK...', '...KKKKKKKKKK...',
            '................', '................', '................', '................'],
        shoe: [
            '................', '................', '................', '................',
            '................', '.....KKKKK......', '....KUUUUUK.....', '...KUUWUUUUKK...',
            '..KUUUUWUUUUUKK.', '.KUUUUUUWWUUUUUK', '.KUUUUUUUUUUUUUK', '.KGGGGGGGGGGGGGK',
            '..KKKKKKKKKKKKK.', '................', '................', '................']
    };

    // ---- Worn and held versions, drawn on the doll --------------------------
    // Hats sit on the hair; x/y are offsets from his head. The cap's bill
    // sticks out to his right (the viewer's left) so it reads as a cap.
    var HATS_ON = {
        cap: { x: -6, y: -1, rows: rows(32, [
            [13, 'KKKKKKKKKKKK'], [11, 'KKCCCCCCCCCCCCKK'], [10, 'KCCCCCCWWCCCCCCCCK'],
            [9, 'KCCCCCCWCCWCCCCCCCCK'], [9, 'KCCCCCCCWWCCCCCCCCCK'], [8, 'KCCCCCCCCCCCCCCCCCCCCK'],
            [8, 'KccccccccccccccccccccK'], [1, 'KKKKKKKKKKKKKKKKKKKKKKKKKKKKK'],
            [0, 'KCCCCCCCCCCCCCCCCCCCK'], [0, 'KccccccccccccccccccK'], [1, 'KKKKKKKKKKKKKKKKKK']]) },
        beanie: { x: 0, y: -2, rows: rows(26, [
            [11, 'KKKK'], [10, 'KwwwwK'], [7, 'KKKKwwwwKKKK'], [5, 'KKQQQQQQQQQQQQKK'],
            [4, 'KQQqQQqQQqQQqQQqQK'], [3, 'KQQqQQqQQqQQqQQqQQqK'], [2, 'KQQqQQqQQqQQqQQqQQqQQK'],
            [1, 'KqqqqqqqqqqqqqqqqqqqqqqK'], [1, 'KQqQqQqQqQqQqQqQqQqQqQqK'], [1, 'KQqQqQqQqQqQqQqQqQqQqQqK'],
            [2, 'KKKKKKKKKKKKKKKKKKKKKK']]) }
    };
    // Laid over the eyes (head rows 13-17, or 12-17 for the frames)
    var FACE_ON = {
        sunglasses: { y: 13, rows: rows(26, [
            [7, 'KKKKKKKKKKKKKKKKK'], [8, 'KggggggKKggggggK'], [8, 'KWgggggKKWgggggK'],
            [9, 'KggggK..KggggK'], [10, 'KKKK....KKKK']]) },
        glasses: { y: 12, rows: rows(26, [
            [9, 'DDDDDD..DDDDDD'], [8, 'DD....DDDD....DD'], [9, 'D....D..D....D'],
            [9, 'D....D..D....D'], [9, 'D....D..D....D'], [9, 'DDDDDD..DDDDDD']]) }
    };
    // Shoes over his feet: high-tops cover the shins, low-tops just the feet
    var FEET_ON = {
        high: { y: 12, rows: ['.KTTKKTTK.', '.KWTKKTWK.', 'KTTWKKWTTK', 'KKKKKKKKKK'] },
        low: { y: 13, rows: ['.KUUKKUUK.', 'KUUWKKWUUK', 'KGGGKKGGGK'] }
    };
    var PACK_BACK = ['KKKKKKKKKKKKKKKK'].concat(Array(8).fill('KDDDDDDDDDDDDDDK'), ['KKKKKKKKKKKKKKKK']);
    var STRAPS = Array(6).fill('d....d');

    // Held in his right hand: head up and out to the side, grip in the fist.
    // `at` is the grip cell that sits under the fist.
    var HELD = {
        badminton: { at: [11, 11], rows: [
            '..KKK..........', '.KTTTKK........', 'KTGWGTTK.......', 'KTWGWGTTK......',
            'KTGWGWGTK......', '.KTGWGWTK......', '.KTTGWGTK......', '..KTTTTTK......',
            '...KKKKKoK.....', '........KoK....', '.........KPK...', '..........KPK..',
            '...........KPK.', '............KPK', '.............KK'] },
        tennis: { at: [12, 12], rows: [
            '...KKK..........', '..KVVVKK........', '.KVWGWVVK.......', 'KVWGWGWGVK......',
            'KVGWGWGWVK......', 'KVWGWGWGWVK.....', '.KVWGWGWGVK.....', '.KVGWGWGWVK.....',
            '..KVVWGWVK......', '...KKVVVKnK.....', '.....KKK.KnK....', '..........KnK...',
            '...........KnK..', '............KnK.', '.............KnK', '..............KK'] },
        // Carried flat at his side by one end
        keyboard: { at: [2, 11], rows: [
            'KKKKKKKKKKKK', 'KCoOoOoOoOoK', 'KoOoOoOoOoOK', 'KOoOOOOOOoOK', 'KKKKKKKKKKKK'] }
    };

    // Raised right arm, laid over the body from column 3, row -3 (the hand
    // is its top two rows). The lowered arm is cut out of the body (upperFor).
    var RAISE = { x: 3, y: -3, hand: [4, -2], rows: rows(5, [
        [1, 'KK'], [0, 'KSSK'], [0, 'KSsK'], [1, 'KSK'], [1, 'KSSK'], [2, 'KSK']]) };

    function mirror(r) {
        return r.map(function (row) { return row.split('').reverse().join(''); });
    }

    // Doll frame: 44 x 44, hero 9 px in. His right hand is on the viewer's left.
    var SW = 44, SH = 44, HX = 9, HY = 4, BY = HY + HEAD.length;
    var HAND = { right: [HX + 7, BY + 7], left: [HX + 18, BY + 7] };

    // ---- Apollo -------------------------------------------------------------
    // Drawn at the same pixel size as Jonathan so their outlines match: the
    // cartoon model from the mascot (big round head, floppy ear, plume tail,
    // near-white coat). Faces right here; flipped on the stage to face him.
    // Happy frames wag the tail with ^^ eyes and his tongue out.
    var DOG_PAL = { a: '#f6efe1', b: '#fffdf8', g: '#e5d7bd', e: '#ecd8b2', d: '#d2b98b', f: '#1a130e', h: '#f6b6bd', t: '#f08a9a' };
    var DOG_W = 30, DOG_H = 19;
    var DOG = {
        stand: [
            '...................KKKKK......', '.....K............KbbbbbKK....',
            '...KKgK..........KbbbbbbbbK...', '..KbaggK........KaaaaaaaaaaK..',
            '..KbbaggK.......KaaeaaaaaaaK..', '..KbbaggK......KaadeeaafWaaKK.',
            '..KbbbagK......KaddeeaafaaaffK', '...KbbagKKKKKKKKaddeeaaaaaaafK',
            '....KbaaKbbbbbbbbddeehhaaaaaaK', '....KbbaaaaaaaaaaadeeaaaaKKKK.',
            '.....KbaaaaaaaaaaadeaaaaaKK...', '......KaaaaaaaaaaaaaaaaaK.....',
            '......KaaaaaaaaaaaaaaaKK......', '.......KgggggggggggggK........',
            '.......KgagggggggggaaK........', '.......KgaaaKKKKKgaaaK........',
            '.......KggggK...KggggK........', '........KKKK.....KKKK.........',
            '..............................'],
        happy: [[
            '...................KKKKK......', '.....KKK..........KbbbbbKK....',
            '....KbagK........KbbbbbbbbK...', '....KbaggK......KaaaaaaaaaaK..',
            '....KbaggK......KaaeaaaaaaaK..', '....KbbagK.....KaadeeaafaaaKK.',
            '....KbbagK.....KaddeeafafaaffK', '....KbbagKKKKKKKaddeeaaaaaaafK',
            '....KbbagbbbbbbbbddeehhaaaaaaK', '.....KbaaaaaaaaaaadeeaaaaatKK.',
            '......KaaaaaaaaaaadeaaaaaKtK..', '......KaaaaaaaaaaaaaaaaaK.K...',
            '......KaaaaaaaaaaaaaaaKK......', '.......KgggggggggggggK........',
            '.......KgagggggggggaaK........', '.......KgaaaKKKKKgaaaK........',
            '.......KggggK...KggggK........', '........KKKK.....KKKK.........',
            '..............................'], [
            '...................KKKKK......', '.....K............KbbbbbKK....',
            '...KKgK..........KbbbbbbbbK...', '..KbaggK........KaaaaaaaaaaK..',
            '..KbbagK........KaaeaaaaaaaK..', '..KbbaggK......KaadeeaafaaaKK.',
            '..KbbaagK......KaddeeafafaaffK', '...KbbagKKKKKKKKaddeeaaaaaaafK',
            '...KbbagKbbbbbbbbddeehhaaaaaaK', '....KbbaaaaaaaaaaadeeaaaaatKK.',
            '.....KbaaaaaaaaaaadeaaaaaKtK..', '......KaaaaaaaaaaaaaaaaaK.K...',
            '......KaaaaaaaaaaaaaaaKK......', '.......KgggggggggggggK........',
            '.......KgagggggggggaaK........', '.......KgaaaKKKKKgaaaK........',
            '.......KggggK...KggggK........', '........KKKK.....KKKK.........',
            '..............................'], [
            '...................KKKKK......', '..................KbbbbbKK....',
            '...K.............KbbbbbbbbK...', '..KgK...........KaaaaaaaaaaK..',
            '.KaggK..........KaaeaaaaaaaK..', 'KbbaggK........KaadeeaafaaaKK.',
            '.KbbaggK.......KaddeeafafaaffK', '.KbbbagK.KKKKKKKaddeeaaaaaaafK',
            '..KbbaagKbbbbbbbbddeehhaaaaaaK', '...KbbaaaaaaaaaaaadeeaaaaatKK.',
            '....KKbaaaaaaaaaaadeaaaaaKtK..', '......KaaaaaaaaaaaaaaaaaK.K...',
            '......KaaaaaaaaaaaaaaaKK......', '.......KgggggggggggggK........',
            '.......KgagggggggggaaK........', '.......KgaaaKKKKKgaaaK........',
            '.......KggggK...KggggK........', '........KKKK.....KKKK.........',
            '..............................'], [
            '...................KKKKK......', '.....K............KbbbbbKK....',
            '...KKgK..........KbbbbbbbbK...', '..KbaggK........KaaaaaaaaaaK..',
            '..KbbagK........KaaeaaaaaaaK..', '..KbbaggK......KaadeeaafaaaKK.',
            '..KbbaagK......KaddeeafafaaffK', '...KbbagKKKKKKKKaddeeaaaaaaafK',
            '...KbbagKbbbbbbbbddeehhaaaaaaK', '....KbbaaaaaaaaaaadeeaaaaatKK.',
            '.....KbaaaaaaaaaaadeaaaaaKtK..', '......KaaaaaaaaaaaaaaaaaK.K...',
            '......KaaaaaaaaaaaaaaaKK......', '.......KgggggggggggggK........',
            '.......KgagggggggggaaK........', '.......KgaaaKKKKKgaaaK........',
            '.......KggggK...KggggK........', '........KKKK.....KKKK.........',
            '..............................']]
    };

    // ---- Items -------------------------------------------------------------
    // Rare < Epic < Unique < Legendary
    var RARITY = { Legendary: '#8ee04a', Unique: '#ffcc33', Epic: '#b98cff', Rare: '#5aaeff' };
    var HANDS = ['right', 'left'];
    var ITEMS = [
        { id: 'badminton', name: 'Badminton racket', hobby: 'Badminton', slots: ['right'], rarity: 'Legendary',
          stats: { Agility: 9, Power: 5 }, special: 'Played since age 13',
          text: 'I’ve played badminton since I was 13 and have been part of New York’s badminton community for years. Now I’m founding Apollo Racket Club, an indoor badminton facility.',
          href: '/apollo', link: 'See Apollo Racket Club' },
        { id: 'tennis', name: 'Tennis racket', hobby: 'Tennis', slots: HANDS, rarity: 'Rare',
          stats: { Power: 7, Agility: 4 },
          text: 'Another racket in the rotation. Same footwork, much bigger court.' },
        { id: 'keyboard', name: 'Mechanical keyboard', hobby: 'Keyboards', slots: HANDS, rarity: 'Unique',
          stats: { Focus: 7, Style: 2 }, special: 'Typing record: 120 WPM',
          text: 'My record on this site’s typing test is 120 WPM. The leaderboard is open if you want to try to beat it.',
          href: '/typing', link: 'Try to beat it' },
        { id: 'buttonup', name: 'Navy button-up', hobby: 'Everyday', slots: ['top'], rarity: 'Rare', shape: 'top',
          colors: { E: '#2a3d72', e: '#1c2a52', A: '#2a3d72', a: '#1c2a52', W: '#e9e9f2' },
          stats: { Style: 5, Social: 3 },
          text: 'Short sleeves, navy, buttoned up. The everyday default.' },
        { id: 'jersey', name: 'Court jersey', hobby: 'Badminton', slots: ['top'], rarity: 'Rare', shape: 'top',
          colors: { E: '#f3f3f1', e: '#c9c8c2', A: '#d8352a', a: '#a3241c', W: '#ffffff' },
          stats: { Agility: 4, Power: 2 },
          text: 'Light, loose and built for long rallies.' },
        { id: 'polo', name: 'Tennis polo', hobby: 'Tennis', slots: ['top'], rarity: 'Rare', shape: 'top',
          colors: { E: '#fafaf7', e: '#d6d5cf', A: '#fafaf7', a: '#d6d5cf', W: '#2f9e5b' },
          stats: { Agility: 3, Style: 3 },
          text: 'Classic whites for the court.' },
        { id: 'vest', name: 'Fleece vest', hobby: 'Startups', slots: ['top'], rarity: 'Epic', shape: 'top',
          colors: { E: '#b8d4f2', e: '#8fb1d9', A: '#3d4148', a: '#2a2d33', W: '#9aa0a8' },
          stats: { Focus: 4, Style: 3 },
          text: 'Over an oxford shirt. The unofficial uniform of the product review.' },
        { id: 'jeans', name: 'Light-wash jeans', hobby: 'Everyday', slots: ['bottom'], rarity: 'Rare', shape: 'pants',
          colors: { J: '#9cc3e8', j: '#76a1cf', Z: '#9cc3e8', z: '#76a1cf' },
          stats: { Style: 4, Social: 2 },
          text: 'Light blue denim that goes with everything.' },
        { id: 'courtshorts', name: 'Court shorts', hobby: 'Badminton', slots: ['bottom'], rarity: 'Rare', shape: 'shorts',
          colors: { J: '#3e3e4e', j: '#2c2c38' },
          stats: { Agility: 4 },
          text: 'Room to lunge for the corners.' },
        { id: 'tennisshorts', name: 'Tennis shorts', hobby: 'Tennis', slots: ['bottom'], rarity: 'Rare', shape: 'shorts',
          colors: { J: '#ecebe5', j: '#c9c8c2' },
          stats: { Agility: 3, Style: 2 },
          text: 'Whites to match the polo.' },
        { id: 'chinos', name: 'Chinos', hobby: 'Startups', slots: ['bottom'], rarity: 'Rare', shape: 'pants',
          colors: { J: '#c9b48c', j: '#a8946c', Z: '#c9b48c', z: '#a8946c' },
          stats: { Focus: 2, Style: 3 },
          text: 'Khaki, of course.' },
        { id: 'cap', name: 'Baseball cap', hobby: 'Headwear', slots: ['head'], rarity: 'Rare',
          stats: { Style: 4, Agility: 2 },
          text: 'Keeps the sun out of my eyes on court.' },
        { id: 'beanie', name: 'Beanie', hobby: 'Travel', slots: ['head'], rarity: 'Rare',
          stats: { Wanderlust: 4, Style: 3 },
          text: 'Rolls into a pocket and keeps the cold off on early starts.' },
        { id: 'sunglasses', name: 'Sunglasses', hobby: 'Style', slots: ['face'], rarity: 'Epic',
          stats: { Style: 6, Wanderlust: 2 },
          text: 'For bright courts and brighter cities.' },
        { id: 'glasses', name: 'Glasses', hobby: 'Screen time', slots: ['face'], rarity: 'Rare',
          stats: { Focus: 5, Style: 2 },
          text: 'For long sessions in Figma and Claude Code.' },
        { id: 'pack', name: 'Travel pack', hobby: 'Travel', slots: ['back'], rarity: 'Unique',
          stats: { Wanderlust: 9, Social: 3 }, special: 'Stamps: Mount Fuji, a bamboo forest',
          text: 'Recent stops include Mount Fuji and a bamboo forest.' },
        { id: 'courtshoes', name: 'Court shoes', hobby: 'Badminton', slots: ['feet'], rarity: 'Rare', shape: 'shoe', worn: 'low',
          colors: { U: '#f3f3f1', W: '#3f79c9', G: '#c98a4b' },
          stats: { Agility: 5 },
          text: 'Gum soles that grip a wooden court.' },
        { id: 'tennisshoes', name: 'Tennis shoes', hobby: 'Tennis', slots: ['feet'], rarity: 'Rare', shape: 'shoe', worn: 'low',
          colors: { U: '#fafaf7', W: '#2f9e5b', G: '#d6d5cf' },
          stats: { Agility: 4, Power: 1 },
          text: 'Made for quick stops and slides on grass.' },
        { id: 'runners', name: 'Wool runners', hobby: 'Startups', slots: ['feet'], rarity: 'Rare', shape: 'shoe', worn: 'low',
          colors: { U: '#8e8e98', W: '#c4c4cc', G: '#f3f3f1' },
          stats: { Focus: 2, Style: 2 },
          text: 'The comfiest shoes in any office.' },
        { id: 'jordans', name: 'Jordan 1s', hobby: 'Sneakers', slots: ['feet'], rarity: 'Epic', worn: 'high',
          stats: { Style: 9, Social: 2 },
          text: 'Air Jordan 1s. A classic for a reason.' },
        { id: 'apollo', name: 'Apollo', hobby: 'Dog', slots: ['companion'], rarity: 'Legendary',
          stats: { Loyalty: 10, Social: 4 }, special: 'English Cream Golden Retriever',
          text: 'Apollo is my English Cream Golden Retriever, and the best teammate I have.' }
    ];
    var SLOTS = [
        { id: 'head', label: 'Head', col: 'left' }, { id: 'face', label: 'Face', col: 'left' },
        { id: 'top', label: 'Top', col: 'left' }, { id: 'bottom', label: 'Bottom', col: 'left' },
        { id: 'back', label: 'Back', col: 'right' }, { id: 'companion', label: 'Companion', col: 'right' },
        { id: 'feet', label: 'Feet', col: 'right' },
        { id: 'right', label: 'Right hand', col: 'hands' }, { id: 'left', label: 'Left hand', col: 'hands' }
    ];
    // Each preset is a full loadout and the scene he's in
    var PRESETS = [
        { id: 'default', name: 'Default', icon: 'buttonup', scene: 'bedroom', focus: 'apollo',
          eq: { top: 'buttonup', bottom: 'jeans', companion: 'apollo' } },
        { id: 'badminton', name: 'Badminton player', icon: 'badminton', scene: 'gym', focus: 'badminton',
          eq: { top: 'jersey', bottom: 'courtshorts', feet: 'courtshoes', right: 'badminton', companion: 'apollo' } },
        { id: 'tennis', name: 'Tennis player', icon: 'tennis', scene: 'grass', focus: 'tennis',
          eq: { top: 'polo', bottom: 'tennisshorts', feet: 'tennisshoes', right: 'tennis', face: 'sunglasses' } },
        { id: 'traveler', name: 'Traveler', icon: 'pack', scene: 'japan', focus: 'pack',
          eq: { top: 'buttonup', bottom: 'jeans', head: 'beanie', face: 'sunglasses', back: 'pack', feet: 'jordans' } },
        { id: 'techbro', name: 'Tech bro', icon: 'keyboard', scene: 'office', focus: 'keyboard',
          eq: { top: 'vest', bottom: 'chinos', right: 'keyboard', face: 'glasses', feet: 'runners' } }
    ];
    var BAG_SIZE = 24;

    var byId = {}, slotById = {};
    ITEMS.forEach(function (it) { it.color = RARITY[it.rarity]; byId[it.id] = it; });
    SLOTS.forEach(function (s) { slotById[s.id] = s; });

    var eq = Object.assign({}, PRESETS[0].eq);
    var sel = { item: PRESETS[0].focus };
    var scene = PRESETS[0].scene;

    // ---- Drawing -----------------------------------------------------------
    function plot(ctx, r, x, y, pal) {
        for (var j = 0; j < r.length; j++) {
            for (var i = 0; i < r[j].length; i++) {
                var ch = r[j].charAt(i);
                var col = (pal && pal[ch]) || PAL[ch];
                if (!col) continue;
                ctx.fillStyle = col;
                ctx.fillRect(x + i, y + j, 1, 1);
            }
        }
    }

    // Grid icons are 16 x 16; Apollo's icon is his head
    function drawIcon(cv, id) {
        var ctx = cv.getContext('2d');
        cv.width = cv.height = 16;
        if (id === 'apollo') { plot(ctx, DOG.stand, -14, 0, DOG_PAL); return; }
        if (!id) return;
        var it = byId[id];
        if (it && it.shape) plot(ctx, SHAPES[it.shape], 0, 0, it.colors);
        else plot(ctx, ICONS[id], 0, (16 - ICONS[id].length) >> 1);
    }

    function slotOf(id) {
        for (var k in eq) if (eq[k] === id) return k;
        return null;
    }
    function isOn(id) { return slotOf(id) !== null; }

    // Where an item from the bag goes: its first empty slot, else its first slot
    function targets(id) {
        var it = byId[id];
        var free = it.slots.filter(function (s) { return !eq[s]; });
        return free.length ? [free[0]] : it.slots.slice();
    }

    var hero = root.querySelector('.equip-hero');
    hero.width = SW;
    hero.height = SH;
    var sx = hero.getContext('2d');
    var dogCv = root.querySelector('.equip-dog');
    dogCv.width = DOG_W;
    dogCv.height = DOG_H;
    var dx = dogCv.getContext('2d');

    // ---- Idle animation state ----------------------------------------------
    // tick runs at 90 ms. `act` is the current flourish, picked in turn from
    // whatever he has on, about every 4.5 s.
    var tick = 0, jump = 0, wag = 0, act = null, actTurn = 0;
    var JUMP = [0, 1, 2, 2, 1];

    function actionsFor() {
        var list = [];
        HANDS.forEach(function (h) {
            var id = eq[h];
            if (id === 'keyboard') list.push({ type: 'type', hand: h, len: 16 });
            else if (id) list.push({ type: 'swing', hand: h, len: 7 });
        });
        if (eq.face === 'sunglasses') list.push({ type: 'glint', len: 8 });
        if (eq.head) list.push({ type: 'tip', len: 7 });
        if (isOn('apollo')) list.push({ type: 'wag', len: 1 });
        if (!list.length) list.push({ type: 'hop', len: 1 });
        return list;
    }

    function startAction() {
        var list = actionsFor();
        var a = list[actTurn++ % list.length];
        act = { type: a.type, hand: a.hand, len: a.len, t: 0 };
        if (a.type === 'wag') { wag = 10; act = null; }
        if (a.type === 'hop') { jump = JUMP.length - 1; act = null; }
    }

    // ---- Paint the doll ----------------------------------------------------
    function rot(r, cw) {
        var n = r.length, out = [];
        for (var j = 0; j < n; j++) {
            var line = '';
            for (var i = 0; i < n; i++) line += cw ? r[n - 1 - i].charAt(j) : r[i].charAt(n - 1 - j);
            out.push(line);
        }
        return out;
    }

    // A held item as drawn: its rows, where it goes, and whether it is drawn
    // behind him (the follow-through of a swing passes behind his head)
    function heldFrame(hand, id, upY) {
        var h = HELD[id], r = h.rows, at = h.at.slice(), pose = 'rest', behind = false;
        if (act && act.hand === hand && act.type === 'swing') {
            // raise for three beats, snap through behind the head, settle
            pose = act.t < 4 ? 'raise' : act.t < 5 ? 'snap' : 'rest';
        }
        var hx = HAND.right[0], hy = HAND.right[1];
        if (pose !== 'rest') { hx = HX + RAISE.hand[0]; hy = BY + RAISE.hand[1]; }
        if (pose === 'snap') {
            r = rot(r, true);
            at = [at[1], r.length - 1 - at[0]];
            behind = true;
        }
        if (id === 'keyboard' && act && act.hand === hand && act.type === 'type') {
            r = r.map(function (line, j) {
                return line.replace(/O/g, function (m, i) { return ((i * 7 + j * 3 + act.t * 5) % 11 === 0) ? 'L' : m; });
            });
            hy += act.t % 2;
        }
        if (hand === 'left') {
            // mirror across his centre line
            r = mirror(r);
            at = [at[0], r[0].length - 1 - at[1]];
            hx = 2 * HX + 25 - hx;
        }
        var x = hx - at[1], y = hy - at[0] + upY;
        return { rows: r, x: x, y: y, behind: behind, raised: pose !== 'rest' };
    }

    function paintDoll() {
        sx.clearRect(0, 0, SW, SH);
        var pal = wearPalette();
        var lift = JUMP[jump] || 0;
        var breathe = reduce ? 0 : (Math.floor(tick / 6) % 2);
        var up = breathe - lift, legsY = -lift;

        var held = [];
        HANDS.forEach(function (h) { if (eq[h]) held.push({ hand: h, f: heldFrame(h, eq[h], up) }); });
        held.forEach(function (o) { if (o.f.behind) plot(sx, o.f.rows, o.f.x, o.f.y); });

        var raised = {};
        held.forEach(function (o) { if (o.f.raised) raised[o.hand] = true; });
        if (isOn('pack')) plot(sx, PACK_BACK, HX + 5, BY + 1 + up);
        plot(sx, LEGS, HX, BY + 10 + legsY, pal);
        plot(sx, upperFor(raised.right, raised.left), HX, BY + up, pal);
        Object.keys(raised).forEach(function (h) { raiseArm(h, up, pal); });
        plot(sx, HEAD, HX, HY + up);

        // Blink every few seconds, unless the sunglasses hide it
        if (!reduce && tick % 41 < 2 && eq.face !== 'sunglasses') {
            [10, 18].forEach(function (c) {
                sx.fillStyle = PAL.S;
                sx.fillRect(HX + c, HY + 13 + up, 4, 5);
                sx.fillStyle = PAL.K;
                sx.fillRect(HX + c, HY + 16 + up, 4, 1);
            });
        }

        if (isOn('pack')) plot(sx, STRAPS, HX + 10, BY + 2 + up);
        if (eq.face) {
            var fo = FACE_ON[eq.face];
            plot(sx, fo.rows, HX, HY + fo.y + up);
            if (act && act.type === 'glint' && eq.face === 'sunglasses') {
                sx.fillStyle = PAL.W;
                [9, 17].forEach(function (c) {
                    var gx = c + act.t - 1;
                    if (act.t > 0 && act.t < 7) sx.fillRect(HX + gx, HY + 14 + up, 1, 1), sx.fillRect(HX + gx + 1, HY + 15 + up, 1, 1);
                });
            }
        }
        if (eq.head) {
            var tip = act && act.type === 'tip' ? [0, 1, 2, 2, 2, 1, 0][act.t] || 0 : 0;
            var hat = HATS_ON[eq.head];
            plot(sx, hat.rows, HX + hat.x, HY + hat.y + up - tip);
        }
        if (eq.feet) {
            var shoe = byId[eq.feet], fo2 = FEET_ON[shoe.worn];
            plot(sx, fo2.rows, HX + 8, BY + fo2.y + legsY, shoe.colors);
        }

        held.forEach(function (o) {
            if (!o.f.behind) plot(sx, o.f.rows, o.f.x, o.f.y);
            fist(o.hand, o.f.raised, up);
        });
        paintDog();
    }

    function wearPalette() {
        var top = byId[eq.top], bottom = byId[eq.bottom];
        return Object.assign({}, BASE_WEAR, top && top.colors, bottom && bottom.colors);
    }

    // The upper body with a lowered arm taken out (rows 6-9 under the
    // sleeve), the sleeve closed off underneath
    var upperCache = {};
    function upperFor(right, left) {
        var key = (right ? 'r' : '') + (left ? 'l' : '');
        if (upperCache[key]) return upperCache[key];
        var r = UPPER.map(function (row) { return row.split(''); });
        [[right, 6, 7], [left, 17, 17]].forEach(function (a) {
            if (!a[0]) return;
            for (var j = 6; j <= 9; j++) for (var i = 0; i < 3; i++) r[j][a[1] + i] = '.';
            r[6][a[2]] = r[6][a[2] + 1] = 'K';
        });
        return (upperCache[key] = r.map(function (row) { return row.join(''); }));
    }

    // A raised arm, coming up out of the sleeve
    function raiseArm(hand, up, pal) {
        var r = RAISE.rows, x = HX + RAISE.x;
        if (hand === 'left') {
            r = mirror(r);
            x = HX + 26 - RAISE.x - r[0].length;
        }
        plot(sx, r, x, BY + RAISE.y + up, pal);
    }

    // The fist goes back over the grip so the item looks held
    function fist(hand, raised, up) {
        var x, y;
        if (raised) {
            x = hand === 'left' ? HX + 25 - RAISE.hand[0] - 1 : HX + RAISE.hand[0];
            y = BY + RAISE.hand[1] + up;
        } else {
            x = HAND[hand][0] - (hand === 'left' ? 1 : 0);
            y = HAND[hand][1] + up;
        }
        plot(sx, hand === 'left' ? ['SS', 'sS'] : ['SS', 'Ss'], x, y);
    }

    function paintDog() {
        dx.clearRect(0, 0, DOG_W, DOG_H);
        var r = wag > 0 ? DOG.happy[tick % DOG.happy.length] : DOG.stand;
        plot(dx, mirror(r), 0, 0, DOG_PAL);
    }

    // ---- Build the DOM once ------------------------------------------------
    function iconCanvas() {
        var cv = document.createElement('canvas');
        cv.width = 16; cv.height = 16;
        cv.setAttribute('aria-hidden', 'true');
        return cv;
    }

    var slotEls = {};
    SLOTS.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'equip-slot';
        b.dataset.slot = s.id;
        var cv = iconCanvas();
        var label = document.createElement('span');
        label.className = 'equip-slot-label';
        label.textContent = s.label;
        b.appendChild(cv);
        b.appendChild(label);
        b.addEventListener('click', function () { selectSlot(s.id); });
        b.addEventListener('dblclick', function () { if (eq[s.id]) unequip(eq[s.id]); });
        b.addEventListener('pointerdown', function (e) { if (eq[s.id]) dragArm(e, eq[s.id], s.id, b); });
        root.querySelector('[data-slots="' + s.col + '"]').appendChild(b);
        slotEls[s.id] = { btn: b, cv: cv };
    });

    var bagGrid = root.querySelector('.bag-grid');
    var bagCells = [];
    for (var i = 0; i < BAG_SIZE; i++) {
        (function () {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'bag-cell';
            var cv = iconCanvas();
            b.appendChild(cv);
            b.addEventListener('click', function () { if (b.dataset.item) select(b.dataset.item); });
            b.addEventListener('dblclick', function () { if (b.dataset.item) equip(b.dataset.item, targets(b.dataset.item)[0]); });
            b.addEventListener('pointerdown', function (e) { if (b.dataset.item) dragArm(e, b.dataset.item, null, b); });
            bagGrid.appendChild(b);
            bagCells.push({ btn: b, cv: cv });
        })();
    }

    var presetEls = {};
    var presetRow = root.querySelector('.preset-row');
    PRESETS.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'preset';
        var cv = iconCanvas();
        drawIcon(cv, p.icon);
        var label = document.createElement('span');
        label.textContent = p.name;
        b.appendChild(cv);
        b.appendChild(label);
        b.addEventListener('click', function () { applyPreset(p); });
        presetRow.appendChild(b);
        presetEls[p.id] = b;
    });

    var detail = root.querySelector('.equip-detail');
    var d = {
        icon: detail.querySelector('.detail-icon'),
        iconCv: iconCanvas(),
        name: detail.querySelector('.detail-name'),
        meta: detail.querySelector('.detail-meta'),
        state: detail.querySelector('.detail-state'),
        lines: detail.querySelector('.detail-lines'),
        text: detail.querySelector('.detail-text'),
        actions: [].slice.call(detail.querySelectorAll('.detail-action')),
        link: detail.querySelector('.detail-link'),
        body: detail.querySelector('.detail-body')
    };
    d.icon.appendChild(d.iconCv);
    var bagCount = root.querySelector('.bag-count');
    var sheet = root.querySelector('.equip-sheet');
    var bagEl = root.querySelector('.equip-bag');

    // ---- State helpers -----------------------------------------------------
    function bagItems() {
        return ITEMS.filter(function (it) { return !isOn(it.id); }).map(function (it) { return it.id; });
    }

    function slotText(it) {
        return it.slots.length > 1 ? 'Either hand' : slotById[it.slots[0]].label;
    }

    function activePreset() {
        for (var k = 0; k < PRESETS.length; k++) {
            var p = PRESETS[k];
            var same = SLOTS.every(function (s) { return (p.eq[s.id] || null) === (eq[s.id] || null); });
            if (same) return p;
        }
        return null;
    }

    // ---- Render ------------------------------------------------------------
    function render() {
        SLOTS.forEach(function (s) {
            var el = slotEls[s.id], it = byId[eq[s.id]];
            drawIcon(el.cv, it && it.id);
            el.btn.classList.toggle('is-empty', !it);
            el.btn.style.setProperty('--rarity', it ? it.color : '#34332f');
            var picked = it ? sel.item === it.id : sel.slot === s.id;
            el.btn.setAttribute('aria-pressed', picked ? 'true' : 'false');
            el.btn.setAttribute('aria-label', s.label + ': ' + (it ? it.name + ', ' + it.rarity : 'empty'));
        });

        var bag = bagItems();
        bagCells.forEach(function (c, k) {
            var it = byId[bag[k]];
            drawIcon(c.cv, it && it.id);
            if (it) c.btn.dataset.item = it.id; else delete c.btn.dataset.item;
            c.btn.classList.toggle('is-empty', !it);
            c.btn.disabled = !it;
            c.btn.style.setProperty('--rarity', it ? it.color : '#2a2926');
            c.btn.setAttribute('aria-pressed', it && sel.item === it.id ? 'true' : 'false');
            c.btn.setAttribute('aria-label', it ? it.name + ', ' + it.rarity + ', in bag' : 'Empty bag slot');
        });
        bagCount.textContent = bag.length + ' / ' + BAG_SIZE;

        var on = activePreset();
        PRESETS.forEach(function (p) { presetEls[p.id].setAttribute('aria-pressed', on === p ? 'true' : 'false'); });
        // Putting a preset's loadout together by hand takes him there too
        if (on && sceneCv) setScene(on.scene);

        dogCv.classList.toggle('is-away', !isOn('apollo'));
        renderDetail();
        paintDoll();
    }

    function renderDetail() {
        var it = sel.item && byId[sel.item];
        detail.style.setProperty('--rarity', it ? it.color : '#5c5b57');
        drawIcon(d.iconCv, it && it.id);
        d.lines.innerHTML = '';
        d.actions.forEach(function (b) { b.hidden = true; });

        if (!it) {
            d.name.textContent = slotById[sel.slot].label;
            d.meta.textContent = 'Empty slot';
            d.state.textContent = '';
            d.text.textContent = 'Nothing in this slot yet.';
            d.link.hidden = true;
            return;
        }

        var where = slotOf(it.id);
        d.name.textContent = it.name;
        d.meta.textContent = it.rarity + ' · ' + slotText(it) + ' · ' + it.hobby;
        d.state.textContent = where ? 'Equipped' + (it.slots.length > 1 ? ', ' + slotById[where].label.toLowerCase() : '') : 'In bag';
        d.state.classList.toggle('is-on', !!where);
        Object.keys(it.stats).forEach(function (k) {
            var li = document.createElement('li');
            li.textContent = '+' + it.stats[k] + ' ' + k;
            d.lines.appendChild(li);
        });
        if (it.special) {
            var sp = document.createElement('li');
            sp.className = 'is-special';
            sp.textContent = it.special;
            d.lines.appendChild(sp);
        }
        d.text.textContent = it.text;

        if (where) {
            setAction(d.actions[0], 'Unequip', function () { unequip(it.id); });
        } else {
            // One button per possible slot; both hands full means two choices
            var slots = targets(it.id);
            slots.forEach(function (slot, k) {
                var label = slots.length > 1 ? 'Equip ' + slotById[slot].label.toLowerCase() : 'Equip';
                setAction(d.actions[k], label, function () { equip(it.id, slot); });
            });
        }

        d.link.hidden = !it.href;
        if (it.href) {
            d.link.href = it.href;
            d.link.textContent = it.link;
        }
    }

    function setAction(btn, label, fn) {
        btn.hidden = false;
        btn.textContent = label;
        btn.onclick = fn;
    }

    // ---- Actions -----------------------------------------------------------
    function flashDetail() {
        if (reduce) return;
        d.body.classList.remove('is-swapping');
        void d.body.offsetWidth;
        d.body.classList.add('is-swapping');
    }

    function select(id) {
        if (sel.item === id) return;
        sel = { item: id };
        render();
        flashDetail();
    }

    // An empty slot picks the first bag item that fits it, if there is one
    function selectSlot(slotId) {
        if (eq[slotId]) return select(eq[slotId]);
        var fit = bagItems().filter(function (id) { return byId[id].slots.indexOf(slotId) > -1; })[0];
        if (fit) return select(fit);
        sel = { slot: slotId };
        render();
        flashDetail();
    }

    function cellFor(id) {
        for (var k = 0; k < bagCells.length; k++) if (bagCells[k].btn.dataset.item === id) return bagCells[k].btn;
        return null;
    }

    function pop(el, cls) {
        if (!el || reduce) return;
        el.classList.remove('is-entering', 'is-leaving', 'is-changing');
        void el.offsetWidth;
        el.classList.add(cls);
    }

    var busy = false;
    // Items animate out of where they are, then into where they land
    function move(leaving, change, after, dogLeaves) {
        if (busy) return;
        var dogWas = isOn('apollo');
        if (dogLeaves) leaving = leaving.concat(dogCv);
        leaving.forEach(function (el) { pop(el, 'is-leaving'); });
        busy = true;
        setTimeout(function () {
            leaving.forEach(function (el) { if (el) el.classList.remove('is-leaving'); });
            change();
            act = null;
            render();
            if (!dogWas && isOn('apollo')) { pop(dogCv, 'is-entering'); wag = 12; }
            after();
            busy = false;
        }, reduce ? 0 : 140);
    }

    function equip(id, slot) {
        var occupant = eq[slot];
        var leaving = [cellFor(id)];
        if (occupant) leaving.push(slotEls[slot].btn);
        move(leaving, function () {
            eq[slot] = id;
            sel = { item: nextAfter(id, occupant) };
            jump = JUMP.length - 1;
        }, function () {
            pop(slotEls[slot].btn, 'is-entering');
            if (occupant) pop(cellFor(occupant), 'is-entering');
            if (sel.item !== id) flashDetail();
        }, occupant === 'apollo');
    }

    function unequip(id) {
        var slot = slotOf(id);
        move([slotEls[slot].btn], function () {
            eq[slot] = null;
            sel = { item: id };
        }, function () {
            pop(cellFor(id), 'is-entering');
        }, id === 'apollo');
    }

    // Move a held item to the other hand; whatever was there swaps over if it
    // fits, otherwise it goes back in the bag
    function switchHands(id, from, to) {
        var occupant = eq[to];
        var back = occupant && byId[occupant].slots.indexOf(from) > -1 ? occupant : null;
        var leaving = [slotEls[from].btn];
        if (occupant) leaving.push(slotEls[to].btn);
        move(leaving, function () {
            eq[to] = id;
            eq[from] = back;
            sel = { item: id };
        }, function () {
            pop(slotEls[to].btn, 'is-entering');
            if (back) pop(slotEls[from].btn, 'is-entering');
            else if (occupant) pop(cellFor(occupant), 'is-entering');
        });
    }

    function applyPreset(p) {
        if (busy) return;
        var next = {}, leaving = [], entering = [], toBag = [];
        SLOTS.forEach(function (s) { next[s.id] = p.eq[s.id] || null; });
        SLOTS.forEach(function (s) {
            if ((eq[s.id] || null) === next[s.id]) return;
            if (eq[s.id]) leaving.push(slotEls[s.id].btn);
            if (next[s.id]) entering.push(s.id);
        });
        ITEMS.forEach(function (it) {
            var nowOn = isOn(it.id), willOn = SLOTS.some(function (s) { return next[s.id] === it.id; });
            if (!nowOn && willOn) leaving.push(cellFor(it.id));
            if (nowOn && !willOn) toBag.push(it.id);
        });
        move(leaving, function () {
            eq = next;
            sel = { item: p.focus };
            jump = JUMP.length - 1;
        }, function () {
            entering.forEach(function (s) { pop(slotEls[s].btn, 'is-entering'); });
            toBag.forEach(function (id) { pop(cellFor(id), 'is-entering'); });
            pop(hero, 'is-changing');
            flashDetail();
        }, isOn('apollo') && next.companion !== 'apollo');
    }

    // After equipping, highlight the next item in the bag (wrapping around),
    // skipping the one that was just swapped out
    function nextAfter(id, swapped) {
        var bag = bagItems().filter(function (x) { return x !== swapped; });
        if (!bag.length) return swapped || id;
        var order = ITEMS.map(function (it) { return it.id; });
        var at = order.indexOf(id);
        var later = bag.filter(function (x) { return order.indexOf(x) > at; });
        return (later[0] || bag[0]);
    }

    root.addEventListener('animationend', function (e) {
        e.target.classList.remove('is-entering', 'is-swapping', 'is-changing');
    });

    // ---- Drag and drop -----------------------------------------------------
    // Drag from the bag onto the character sheet to equip: onto a slot that
    // fits, or anywhere on the sheet for the item's usual slot. Drag an
    // equipped item back to the bag to unequip it, or to the other hand.
    var drag = null, swallowClick = false;

    function dragArm(e, id, fromSlot, el) {
        if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
        drag = { id: id, from: fromSlot, el: el, x0: e.clientX, y0: e.clientY, pid: e.pointerId, live: false, over: null };
    }

    function dragBegin() {
        var it = byId[drag.id];
        drag.live = true;
        var g = document.createElement('div');
        g.className = 'equip-ghost';
        g.style.setProperty('--rarity', it.color);
        var cv = iconCanvas();
        drawIcon(cv, it.id);
        g.appendChild(cv);
        document.body.appendChild(g);
        drag.ghost = g;
        drag.el.classList.add('is-dragging');
        root.classList.add('is-dragging');
        it.slots.forEach(function (s) { if (s !== drag.from) slotEls[s].btn.classList.add('is-target'); });
        (drag.from ? bagEl : sheet).classList.add('is-drop');
    }

    function dropTarget(x, y) {
        var el = document.elementFromPoint(x, y);
        if (!el) return null;
        var slot = el.closest('.equip-slot');
        if (slot && slot.classList.contains('is-target')) return { slot: slot.dataset.slot, el: slot };
        if (drag.from) {
            if (el.closest('.equip-bag')) return { bag: true, el: bagEl };
            return null;
        }
        if (el.closest('.equip-sheet')) return { sheet: true, el: sheet };
        return null;
    }

    document.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.pid) return;
        if (!drag.live) {
            if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 6) return;
            dragBegin();
        }
        e.preventDefault();
        drag.ghost.style.transform = 'translate(' + (e.clientX - 32) + 'px,' + (e.clientY - 32) + 'px)';
        var t = dropTarget(e.clientX, e.clientY);
        var el = t && t.el;
        if (drag.over !== el) {
            if (drag.over) drag.over.classList.remove('is-over');
            if (el) el.classList.add('is-over');
            drag.over = el;
        }
    }, { passive: false });

    function dragClean() {
        root.classList.remove('is-dragging');
        root.querySelectorAll('.is-target, .is-over, .is-drop').forEach(function (el) {
            el.classList.remove('is-target', 'is-over', 'is-drop');
        });
        sheet.classList.remove('is-over', 'is-drop');
        bagEl.classList.remove('is-over', 'is-drop');
    }

    function dragEnd(e, cancelled) {
        if (!drag || (e && e.pointerId !== drag.pid)) return;
        var g = drag, t = !cancelled && g.live && e ? dropTarget(e.clientX, e.clientY) : null;
        drag = null;
        if (!g.live) return;
        swallowClick = true;
        setTimeout(function () { swallowClick = false; }, 0);
        dragClean();

        var done = true;
        if (t && !g.from) equip(g.id, t.slot || targets(g.id)[0]);
        else if (t && g.from && t.bag) unequip(g.id);
        else if (t && g.from && t.slot) switchHands(g.id, g.from, t.slot);
        else done = false;

        if (done || reduce) {
            g.el.classList.remove('is-dragging');
            g.ghost.remove();
            return;
        }
        // Nowhere to land: the ghost flies back to where it came from
        var r = g.el.getBoundingClientRect();
        g.ghost.classList.add('is-returning');
        g.ghost.style.transform = 'translate(' + (r.left + r.width / 2 - 32) + 'px,' + (r.top + r.height / 2 - 32) + 'px)';
        setTimeout(function () {
            g.ghost.remove();
            g.el.classList.remove('is-dragging');
        }, 180);
    }

    document.addEventListener('pointerup', function (e) { dragEnd(e, false); });
    document.addEventListener('pointercancel', function (e) { dragEnd(e, true); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drag && drag.live) dragEnd({ pointerId: drag.pid }, true);
    });
    root.addEventListener('click', function (e) {
        if (swallowClick) { e.stopPropagation(); e.preventDefault(); }
    }, true);

    // ---- Scenes: where he is, set by the preset -----------------------------
    // Painted at 4 css px per pixel and sized to the stage. Each scene has a
    // still layer (cached) and, for some, a few moving bits on top. A new
    // scene dissolves in through an ordered dither.
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    function Painter(ctx, w, h) {
        this.c = ctx; this.w = w; this.h = h;
        this.F = h - Math.max(10, Math.round(h * 0.22)); // floor line: feet stand below it
    }
    Painter.prototype.R = function (col, x, y, w, h) {
        this.c.fillStyle = col;
        this.c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };
    Painter.prototype.P = function (col, x, y) { this.R(col, x, y, 1, 1); };
    Painter.prototype.on = function (x, y, d) { return d * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5; };
    // Dithered vertical blend through a list of colours
    Painter.prototype.grad = function (cols, y0, y1, x0, x1) {
        x0 = x0 || 0; x1 = x1 === undefined ? this.w : x1;
        var n = cols.length - 1;
        for (var y = Math.round(y0); y < Math.round(y1); y++) {
            var p = (y - y0) / Math.max(1, y1 - y0) * n, i = Math.min(n - 1, Math.floor(p)), f = p - i;
            for (var x = Math.round(x0); x < Math.round(x1); x++) this.P(this.on(x, y, f) ? cols[i + 1] : cols[i], x, y);
        }
    };
    Painter.prototype.disc = function (col, cx, cy, r) {
        for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.P(col, cx + x, cy + y);
    };
    // A net strung across the back of a court, posts at both ends
    Painter.prototype.net = function (top, mesh, post, tape) {
        var w = this.w, F = this.F;
        for (var y = Math.round(top) + 1; y < F + 1; y++) for (var x = 2; x < w - 2; x++) if ((x + y) % 3 === 0 || (x - y) % 3 === 0) this.P(mesh, x, y);
        this.R(tape, 2, top, w - 4, 1);
        this.R(post, 1, top - 1, 2, F - top + 3);
        this.R(post, w - 3, top - 1, 2, F - top + 3);
    };
    Painter.prototype.cloud = function (x, y, s) {
        this.R('#ffffff', x + s, y, s * 3, s);
        this.R('#ffffff', x, y + s, s * 5, s);
        this.R('#e4f1fb', x + s, y + s * 2 - 1, s * 4, 1);
    };

    // New York landmarks, standing on the line `base` (the window sill)
    function nyc(g, base) {
        var w = g.w, H = base;
        // One World Trade Center: a tapering tower with a mast
        var c1 = Math.round(w * 0.13), h1 = Math.round(H * 0.82);
        for (var y = 0; y < h1; y++) {
            var half = Math.round(4 - 2.2 * (y / h1));
            g.R('#7f98ba', c1 - half, base - 1 - y, half, 1);
            g.R('#9db3cf', c1, base - 1 - y, half, 1);
        }
        g.R('#7f98ba', c1, base - h1 - Math.round(H * 0.14), 1, Math.round(H * 0.14));
        // Empire State Building: setbacks, a mast and a needle
        var c2 = Math.round(w * 0.68), h2 = Math.round(H * 0.86);
        [[13, 0.36], [9, 0.6], [6, 0.74], [4, 0.8], [2, 0.86]].forEach(function (t) {
            var bw = t[0], top = base - Math.round(h2 * t[1] / 0.86);
            g.R('#6d86a8', c2 - (bw >> 1), top, bw, base - top);
            for (var sx = c2 - (bw >> 1) + 1; sx < c2 + (bw >> 1); sx += 2) g.R('#8aa3c2', sx, top + 1, 1, base - top - 1);
        });
        g.R('#6d86a8', c2, base - h2 - Math.round(H * 0.12), 1, Math.round(H * 0.12));
        // Chrysler Building: stacked steel arches with triangle windows, a spire
        var c3 = Math.round(w * 0.86), h3 = Math.round(H * 0.6), top3 = base - h3;
        g.R('#6d86a8', c3 - 4, top3, 8, h3);
        for (var cy = top3 + 2; cy < base - 1; cy += 3) for (var cx = c3 - 3; cx < c3 + 4; cx += 2) g.P('#c9d9ec', cx, cy);
        [[8, 3], [6, 3], [4, 3], [2, 3]].forEach(function (t, i) {
            var y0 = top3 - 3 * (i + 1);
            g.R('#d6dbe3', c3 - (t[0] >> 1), y0, t[0], t[1]);
            for (var k = 0; k < t[0]; k += 2) g.P('#4f6a8f', c3 - (t[0] >> 1) + k, y0 + 2);
        });
        g.R('#d6dbe3', c3, top3 - 12 - Math.round(H * 0.12), 1, Math.round(H * 0.12));
    }

    function officeDesk(w, h, F) {
        var dw = Math.round(w * 0.36), x = Math.round(w * 0.02), y = F - Math.round(h * 0.15);
        var mw = Math.round(dw * 0.62), mh = Math.max(6, Math.round(mw * 0.5));
        return { x: x, y: y, w: dw, mw: mw, mh: mh, mx: x + Math.round(dw * 0.08), my: y - mh - 4 };
    }

    var SCENES = {
        // His bedroom at night: desk and monitor, window, poster, bed, rug
        bedroom: {
            fps: 4,
            still: function (g) {
                var w = g.w, h = g.h, F = g.F;
                g.R('#3a3150', 0, 0, w, F);
                for (var x = 3; x < w; x += 6) g.R('#41385a', x, 0, 1, F);
                // window with curtains
                var wx = Math.round(w * 0.05), wy = Math.round(h * 0.1), ww = Math.round(w * 0.26), wh = Math.round(h * 0.3);
                g.R('#1d1a28', wx - 1, wy - 1, ww + 2, wh + 2);
                g.grad(['#0e1734', '#1c2c5a'], wy, wy + wh, wx, wx + ww);
                g.disc('#ece6c6', wx + Math.round(ww * 0.7), wy + Math.round(wh * 0.3), Math.max(2, Math.round(wh * 0.12)));
                g.R('#1d1a28', wx + (ww >> 1), wy, 1, wh);
                g.R('#1d1a28', wx, wy + (wh >> 1), ww, 1);
                g.R('#8a4257', wx - 3, wy - 2, 4, wh + 5);
                g.R('#8a4257', wx + ww - 1, wy - 2, 4, wh + 5);
                g.R('#6e3345', wx - 2, wy - 2, 1, wh + 5);
                g.R('#6e3345', wx + ww + 1, wy - 2, 1, wh + 5);
                g.R('#5e3b1a', wx - 4, wy - 3, ww + 8, 1);
                // badminton poster
                var px = Math.round(w * 0.47), py = Math.round(h * 0.08), pw = Math.max(9, Math.round(w * 0.11)), ph = Math.round(pw * 1.35);
                g.R('#1d1a28', px - 1, py - 1, pw + 2, ph + 2);
                g.R('#2f7d5a', px, py, pw, ph);
                g.R('#f3efe4', px + 1, py + ph - 3, pw - 2, 1);
                var sc = px + (pw >> 1), sy = py + 2;
                g.R('#ffffff', sc - 2, sy, 5, 1); g.R('#ffffff', sc - 1, sy + 1, 3, 2); g.R('#ffffff', sc, sy + 3, 1, 1);
                g.R('#d98f1f', sc - 1, sy + 4, 3, 2);
                // shelf with books and a plant
                var shx = Math.round(w * 0.66), shy = Math.round(h * 0.3), shw = Math.round(w * 0.2);
                g.R('#5e3b1a', shx, shy, shw, 2);
                ['#d8352a', '#ffc940', '#3f79c9', '#c8e64a', '#b98cff'].forEach(function (c, i) { g.R(c, shx + 1 + i * 2, shy - 5 + (i % 2), 2, 5 - (i % 2)); });
                g.R('#c0705a', shx + shw - 5, shy - 3, 4, 3);
                g.R('#3f8f4a', shx + shw - 6, shy - 6, 2, 3); g.R('#4fae5a', shx + shw - 4, shy - 7, 2, 4); g.R('#3f8f4a', shx + shw - 2, shy - 5, 2, 2);
                // skirting, then wood floor
                g.R('#2a2438', 0, F - 2, w, 2);
                g.R('#6e4c33', 0, F, w, h - F);
                for (var r = 0, y = F + 3; y < h; y += 3, r++) {
                    g.R('#5c3f2a', 0, y, w, 1);
                    for (var sx2 = (r * 7) % 11; sx2 < w; sx2 += 11) g.R('#5c3f2a', sx2, y - 3, 1, 3);
                }
                // rug under him
                var rx = Math.round(w * 0.14), rw = Math.round(w * 0.56), ry = F + Math.round((h - F) * 0.3), rh = Math.round((h - F) * 0.55);
                g.R('#b0667c', rx, ry, rw, rh);
                g.R('#8a4b5e', rx + 1, ry + 1, rw - 2, rh - 2);
                for (var k = rx + 3; k < rx + rw - 3; k += 4) g.R('#7a3f52', k, ry + 2, 2, rh - 4);
                // desk with monitor and keyboard (left)
                var dw = Math.round(w * 0.24), dy = F - Math.round(h * 0.14);
                g.R('#7a5538', 0, dy, dw, 2);
                g.R('#5c3f2a', 1, dy + 2, 2, F - dy);
                g.R('#5c3f2a', dw - 3, dy + 2, 2, F - dy);
                var mw = Math.round(dw * 0.6), mx = Math.round(dw * 0.15), mh = Math.round(mw * 0.62);
                g.R('#1d1a28', mx, dy - mh - 3, mw, mh);
                g.R('#203a6e', mx + 1, dy - mh - 2, mw - 2, mh - 2);
                g.R('#1d1a28', mx + (mw >> 1) - 1, dy - 3, 2, 3);
                g.R('#d6d5cf', mx + 1, dy - 1, mw - 2, 1);
                // bed (right)
                var bx = Math.round(w * 0.68), by = F - Math.round(h * 0.1);
                g.R('#4a3426', w - 3, by - Math.round(h * 0.1), 3, F - by + Math.round(h * 0.1) + 2);
                g.R('#4a3426', bx, F - 1, w - bx, 3);
                g.R('#3f6fb0', bx, by, w - bx - 3, F - by - 1);
                g.R('#335d96', bx, by + 2, w - bx - 3, 1);
                g.R('#e9e9f2', w - 9, by - 2, 6, 3);
            },
            moving: function (g, t) {
                var w = g.w, h = g.h, F = g.F;
                var wx = Math.round(w * 0.05), wy = Math.round(h * 0.1), ww = Math.round(w * 0.26);
                // a star that twinkles in the window
                if (t % 12 < 9) g.P('#ffffff', wx + 3, wy + 3);
                if ((t + 5) % 14 < 10) g.P('#c9ccdc', wx + (ww >> 1) - 3, wy + 6);
                // code scrolling on the monitor
                var dw = Math.round(w * 0.24), dy = F - Math.round(h * 0.14), mw = Math.round(dw * 0.6), mx = Math.round(dw * 0.15), mh = Math.round(mw * 0.62);
                for (var l = 0; l < mh - 4; l += 2) {
                    var len = 2 + ((l * 5 + t * 3) % 7);
                    g.R(l % 4 ? '#7fc4ff' : '#c8e64a', mx + 2 + (l % 6 ? 1 : 0), dy - mh - 1 + l, Math.min(len, mw - 4), 1);
                }
            }
        },

        // Indoor badminton hall: high windows, lights, net, green court
        gym: {
            fps: 6,
            still: function (g) {
                var w = g.w, h = g.h, F = g.F;
                g.R('#22324d', 0, 0, w, F);
                var wy = Math.round(h * 0.07), wh = Math.max(4, Math.round(h * 0.09));
                for (var x = 4; x < w - 6; x += 10) {
                    g.R('#16233a', x - 1, wy - 1, 8, wh + 2);
                    g.grad(['#9fc3e6', '#cfe4f7'], wy, wy + wh, x, x + 6);
                    g.R('#16233a', x + 3, wy, 1, wh);
                }
                for (var lx = 8; lx < w; lx += 18) {
                    g.R('#fff3c4', lx, 1, 5, 1);
                    for (var yy = 2; yy < 6; yy++) for (var xx = lx - 2; xx < lx + 7; xx++) if (g.on(xx, yy, 0.35 - (yy - 2) * 0.08)) g.P('#3a4a66', xx, yy);
                }
                g.R('#2f6e57', 0, Math.round(F * 0.62), w, F - Math.round(F * 0.62));
                g.R('#3d8a6d', 0, Math.round(F * 0.62), w, 1);
                g.R('#c58e55', 0, F, w, h - F);
                g.R('#2f8a5f', 2, F + 1, w - 4, h - F - 1);
                g.R('#f3f3f1', 2, F + 2, w - 4, 1);
                g.R('#f3f3f1', 2, h - 3, w - 4, 1);
                g.R('#f3f3f1', 2, F + 2, 1, h - F - 4);
                g.R('#f3f3f1', w - 3, F + 2, 1, h - F - 4);
                g.R('#f3f3f1', 6, F + 2, 1, h - F - 4);
                g.R('#f3f3f1', w - 7, F + 2, 1, h - F - 4);
                g.net(F - Math.round(h * 0.17), '#1a1822', '#1a1822', '#f3f3f1');
            },
            moving: function (g, t) {
                // a shuttle crosses over the net now and then
                var w = g.w, F = g.F, h = g.h, p = t % 48;
                if (p >= 20) return;
                var x = Math.round(w * (p / 20)), arc = Math.sin(p / 20 * Math.PI);
                var y = Math.round(F - h * 0.2 - arc * h * 0.35);
                g.R('#ffffff', x, y, 2, 1);
                g.P('#d98f1f', x + 2, y);
            }
        },

        // Grass court on a sunny day: mown stripes, hedge, net, clouds
        grass: {
            fps: 4,
            still: function (g) {
                var w = g.w, h = g.h, F = g.F;
                g.grad(['#5fa8f0', '#9fd0ff', '#d6efff'], 0, Math.round(F * 0.62));
                for (var x = 0; x < w; x++) {
                    var top = Math.round(F * 0.5 + Math.sin(x * 0.35) * 1.5 + Math.sin(x * 0.11) * 2);
                    g.R('#2f6b3f', x, top, 1, Math.round(F * 0.62) - top + 1);
                }
                g.R('#1f4d33', 0, Math.round(F * 0.62), w, F - Math.round(F * 0.62));
                g.R('#2a6343', 0, Math.round(F * 0.62), w, 1);
                g.R('#3b2f5a', 0, Math.round(F * 0.78), w, 1);
                for (var r = 0, y = F; y < h; y += 3, r++) g.R(r % 2 ? '#4e9845' : '#59a84f', 0, y, w, 3);
                // worn baseline patch where he stands
                var cx = Math.round(w * 0.4), py = h - 4;
                for (var yy = py - 3; yy < h; yy++) for (var xx = cx - 12; xx < cx + 12; xx++) {
                    var d = 1 - Math.abs(xx - cx) / 12 - Math.abs(yy - py) / 6;
                    if (g.on(xx, yy, Math.max(0, d))) g.P('#b9a66a', xx, yy);
                }
                g.R('#f6f6f2', 0, py, w, 1);
                g.R('#f6f6f2', Math.round(w * 0.06), F, 1, h - F);
                g.R('#f6f6f2', Math.round(w * 0.94), F, 1, h - F);
                g.net(F - Math.round(h * 0.16), '#173a27', '#1f4d33', '#ffffff');
            },
            moving: function (g, t) {
                var w = g.w, h = g.h;
                [[0, 0.1, 2], [0.45, 0.2, 1], [0.8, 0.06, 2]].forEach(function (c, i) {
                    var x = Math.round(((c[0] * (w + 24) + t * (0.25 + i * 0.1)) % (w + 24)) - 12);
                    g.cloud(x, Math.round(h * c[1]), c[2]);
                });
            }
        },

        // Japan: Mount Fuji, a torii gate, cherry blossom, stone path
        japan: {
            fps: 5,
            still: function (g) {
                var w = g.w, h = g.h, F = g.F;
                g.grad(['#7fb7ee', '#b9d6f2', '#ffd9c8'], 0, F);
                // Fuji
                var fx = Math.round(w * 0.62), peak = Math.round(F - h * 0.5), hw = Math.round(w * 0.45);
                for (var y = peak; y < F; y++) {
                    var f = (y - peak) / (F - peak), half = Math.round(hw * (0.08 + f * 0.92) * (0.6 + f * 0.4));
                    var snowLine = peak + Math.round((F - peak) * 0.32) + ((y + fx) % 3 === 0 ? 1 : 0);
                    for (var x = fx - half; x <= fx + half; x++) {
                        var snow = y < snowLine - (Math.abs(x - fx) % 4 < 2 ? 0 : 2);
                        g.P(snow ? (x > fx ? '#dfe6f0' : '#f6f8fb') : (x > fx ? '#425b8f' : '#4f6aa3'), x, y);
                    }
                }
                // near hills
                for (var x2 = 0; x2 < w; x2++) {
                    var top = Math.round(F - h * 0.08 + Math.sin(x2 * 0.2) * 1.5 + Math.sin(x2 * 0.07) * 2.5);
                    g.R('#4f7d4a', x2, top, 1, F - top);
                }
                // torii gate (left)
                var tc = Math.round(w * 0.15), half2 = Math.max(6, Math.round(w * 0.09)), tt = Math.round(F - h * 0.46);
                g.R('#d8352a', tc - half2 + 2, tt + 3, 3, F - tt - 3);
                g.R('#d8352a', tc + half2 - 4, tt + 3, 3, F - tt - 3);
                g.R('#a3241c', tc - half2 + 4, tt + 3, 1, F - tt - 3);
                g.R('#a3241c', tc + half2 - 2, tt + 3, 1, F - tt - 3);
                g.R('#1a1822', tc - half2 - 2, tt, half2 * 2 + 4, 1);
                g.R('#d8352a', tc - half2 - 1, tt + 1, half2 * 2 + 2, 2);
                g.P('#1a1822', tc - half2 - 3, tt - 1); g.P('#1a1822', tc + half2 + 2, tt - 1);
                g.R('#d8352a', tc - half2, tt + Math.round(h * 0.09), half2 * 2, 2);
                g.R('#1a1822', tc - 1, tt + 3, 2, Math.round(h * 0.09) - 3);
                // cherry blossom (right)
                var bx = Math.round(w * 0.9), bt = Math.round(F - h * 0.3);
                g.R('#5e3b1a', bx, bt, 3, F - bt);
                g.R('#5e3b1a', bx - 4, bt + 2, 5, 1);
                var r = Math.max(4, Math.round(h * 0.07));
                [[-6, -2, '#f29ab3'], [0, -5, '#f7b6c8'], [5, -1, '#f7b6c8'], [-2, 1, '#f7b6c8'], [3, -7, '#ffd6e2']].forEach(function (b) {
                    g.disc(b[2], bx + b[0], bt - r + b[1] + 2, r);
                });
                // stone path and grass
                g.R('#6aa25a', 0, F, w, h - F);
                var p0 = Math.round(w * 0.1), p1 = Math.round(w * 0.75);
                g.R('#c9c2b4', p0, F + 1, p1 - p0, h - F - 1);
                for (var y3 = F + 1, r3 = 0; y3 < h; y3 += 4, r3++) {
                    g.R('#a69e8f', p0, y3, p1 - p0, 1);
                    for (var x3 = p0 + (r3 % 2) * 4; x3 < p1; x3 += 8) g.R('#a69e8f', x3, y3, 1, 4);
                }
            },
            moving: function (g, t) {
                var w = g.w, h = g.h, F = g.F;
                for (var i = 0; i < 9; i++) {
                    var x = Math.round(((i * 37 + t * (0.7 + (i % 3) * 0.2)) % (w + 10)) - 5);
                    var y = Math.round((i * 23 + t * (0.9 + (i % 2) * 0.3)) % F);
                    g.P(i % 3 ? '#f7b6c8' : '#ffffff', w - x, y);
                }
            }
        },

        // Startup office in New York: Manhattan through tall windows, his desk
        // and monitor, a plant
        office: {
            fps: 3,
            still: function (g) {
                var w = g.w, h = g.h, F = g.F, top = Math.round(F * 0.64);
                g.grad(['#8fc6ff', '#d6efff'], 0, top);
                // Manhattan: a low far skyline, then the landmarks (One World
                // Trade Center, the Empire State Building, the Chrysler
                // Building), then low near blocks with water towers
                var seed = 5;
                function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
                for (var x = 0; x < w;) {
                    var bw = 3 + Math.floor(rnd() * 6), bh = Math.round(top * (0.18 + rnd() * 0.3));
                    g.R('#b4c6dc', x, top - bh, bw, bh);
                    x += bw + Math.floor(rnd() * 2);
                }
                nyc(g, top);
                for (var x2 = 0; x2 < w;) {
                    var nw = 4 + Math.floor(rnd() * 6), nh = Math.round(top * (0.1 + rnd() * 0.16));
                    g.R('#5f789a', x2, top - nh, nw, nh);
                    for (var wy = top - nh + 2; wy < top - 1; wy += 3) for (var wx = x2 + 1; wx < x2 + nw - 1; wx += 2) g.P('#c9d9ec', wx, wy);
                    if (nw > 6 && rnd() > 0.45) {
                        var tx = x2 + 1 + Math.floor(rnd() * (nw - 5)), ty = top - nh;
                        g.R('#7a5538', tx, ty - 4, 3, 3);
                        g.P('#5e3b1a', tx + 1, ty - 5);
                        g.P('#5e3b1a', tx, ty - 1); g.P('#5e3b1a', tx + 2, ty - 1);
                    }
                    x2 += nw + Math.floor(rnd() * 3);
                }
                // window frames
                for (var mx = 0; mx < w; mx += Math.round(w / 4)) g.R('#2b2f38', mx, 0, 2, top);
                g.R('#2b2f38', 0, 0, w, 2);
                g.R('#2b2f38', 0, top, w, 2);
                g.R('#e7e3da', 0, top + 2, w, F - top - 2);
                // desk with a big monitor (a dashboard that only goes up), a
                // laptop and a mug
                var d = officeDesk(w, h, F);
                g.R('#3d4148', d.x + 2, d.y + 2, 2, F - d.y - 2);
                g.R('#3d4148', d.x + d.w - 4, d.y + 2, 2, F - d.y - 2);
                g.R('#2a2d33', d.x + 2, F - 1, d.w - 4, 1);
                g.R('#f3f3f1', d.x, d.y, d.w, 1);
                g.R('#c9c8c2', d.x, d.y + 1, d.w, 1);
                g.R('#1a1822', d.mx - 1, d.my - 1, d.mw + 2, d.mh + 2);
                g.R('#1c2233', d.mx, d.my, d.mw, d.mh);
                g.R('#3d4148', d.mx + (d.mw >> 1) - 1, d.my + d.mh + 1, 2, d.y - d.my - d.mh - 1);
                g.R('#3d4148', d.mx + (d.mw >> 1) - 3, d.y - 1, 6, 1);
                for (var k = 0; k < d.mw - 4; k++) g.P('#5fe08a', d.mx + 2 + k, d.my + d.mh - 3 - Math.round(k * k / (d.mw * 1.4)));
                for (var bar = 0; bar < 3; bar++) g.R('#7fc4ff', d.mx + 2 + bar * 3, d.my + 2, 2, 1 + bar);
                var lx = d.mx + d.mw + 3;
                if (lx + 8 < d.x + d.w) {
                    g.R('#9aa0a8', lx, d.y - 1, 8, 1);
                    g.R('#9aa0a8', lx + 1, d.y - 6, 1, 5);
                    g.R('#c9d9ec', lx + 2, d.y - 6, 5, 4);
                    g.R('#9aa0a8', lx + 2, d.y - 7, 6, 1);
                }
                g.R('#d8352a', d.x + 2, d.y - 3, 2, 3);
                g.P('#a3241c', d.x + 4, d.y - 2);
                // plant (right)
                var px = Math.round(w * 0.9);
                g.R('#c0705a', px - 3, F - 6, 7, 6);
                g.R('#a35a46', px - 3, F - 6, 7, 1);
                [[-4, -12, 2, 7], [-1, -15, 2, 9], [2, -13, 2, 8], [4, -10, 2, 5], [-6, -9, 2, 4]].forEach(function (l) { g.R('#3f8f4a', px + l[0], F + l[1], l[2], l[3]); });
                g.R('#4fae5a', px - 1, F - 15, 1, 6);
                // polished concrete
                g.R('#a19d95', 0, F, w, h - F);
                for (var y = F; y < h; y++) for (var x2 = 0; x2 < w; x2++) if (((x2 * 7 + y * 13) % 23) === 0) g.P('#8f8b84', x2, y);
                g.R('#b6b2aa', 0, F, w, 1);
            },
            moving: function (g, t) {
                var w = g.w, h = g.h, top = Math.round(g.F * 0.64);
                var x = Math.round((t * 0.3) % (w + 20)) - 10;
                g.cloud(x, Math.round(h * 0.05), 1);
                // a live dot on the dashboard
                var d = officeDesk(w, h, g.F);
                if (t % 4 < 2) g.P('#5fe08a', d.mx + d.mw - 3, d.my + 2);
                // a beacon on a far roof
                if (t % 6 < 2) g.P('#ff7a6b', Math.round(w * 0.55), top - Math.round(top * 0.5));
            }
        }
    };

    var stageEl = root.querySelector('.equip-stage');
    var sceneCv = document.createElement('canvas');
    sceneCv.className = 'equip-scene';
    sceneCv.setAttribute('aria-hidden', 'true');
    stageEl.insertBefore(sceneCv, stageEl.firstChild);
    var scx = sceneCv.getContext('2d');
    var still = null, sceneT = 0, fadeFrom = null, fadeStep = 0, FADE = 6, sceneVisible = true;

    function sceneSize() {
        var w = Math.max(16, Math.ceil(stageEl.clientWidth / 4)), h = Math.max(16, Math.ceil(stageEl.clientHeight / 4));
        if (sceneCv.width === w && sceneCv.height === h && still) return;
        sceneCv.width = w; sceneCv.height = h;
        still = null;
        paintScene();
    }

    function paintScene() {
        var w = sceneCv.width, h = sceneCv.height, sc = SCENES[scene];
        if (!still) {
            still = document.createElement('canvas');
            still.width = w; still.height = h;
            sc.still(new Painter(still.getContext('2d'), w, h));
        }
        scx.drawImage(still, 0, 0);
        if (sc.moving && !reduce) sc.moving(new Painter(scx, w, h), sceneT);
        if (fadeFrom && fadeStep < FADE) {
            // ordered-dither dissolve from the last scene
            var now = scx.getImageData(0, 0, w, h), a = now.data, b = fadeFrom.data, cut = fadeStep / FADE * 16;
            for (var i = 0, n = w * h; i < n; i++) {
                var x = i % w, y = (i / w) | 0;
                if (BAYER[(y & 3) * 4 + (x & 3)] >= cut) {
                    a[i * 4] = b[i * 4]; a[i * 4 + 1] = b[i * 4 + 1]; a[i * 4 + 2] = b[i * 4 + 2];
                }
            }
            scx.putImageData(now, 0, 0);
            fadeStep++;
        } else {
            fadeFrom = null;
        }
    }

    function setScene(id) {
        if (id === scene || !SCENES[id]) return;
        if (!reduce) { fadeFrom = scx.getImageData(0, 0, sceneCv.width, sceneCv.height); fadeStep = 1; }
        scene = id;
        still = null;
        sceneT = 0;
        paintScene();
    }

    function sceneLoop() {
        var fps = fadeFrom ? 14 : SCENES[scene].fps;
        if (sceneVisible && !document.hidden) { sceneT++; paintScene(); }
        setTimeout(sceneLoop, 1000 / fps);
    }

    new ResizeObserver(sceneSize).observe(stageEl);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { sceneVisible = en[0].isIntersecting; }).observe(stageEl);
    }
    sceneSize();
    if (!reduce) setTimeout(sceneLoop, 200);

    render();

    // Idle: he breathes and blinks, and every few seconds does something with
    // what he has on. Landing hops settle over a few frames; Apollo wags.
    if (!reduce) {
        setInterval(function () {
            if (document.hidden) return;
            tick++;
            if (jump > 0) jump--;
            if (wag > 0) wag--;
            if (act && ++act.t >= act.len) act = null;
            if (!act && tick % 50 === 0) startAction();
            paintDoll();
        }, 90);
    }
})();
