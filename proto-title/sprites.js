// Title screen prototypes: sprites. Self-contained, not linked from the site.
// The character is copied from about-select.js, so it matches the About page.
// All sprites are original, plotted by hand as text grids.
(function () {
    'use strict';

    var PAL = {
        K: '#1a1822', H: '#3a3246', h: '#75688f', S: '#f7d3b5', s: '#e5ab86',
        W: '#ffffff', B: '#24406e', b: '#3f79c9', C: '#2f7df0', c: '#1b58b8',
        L: '#7fc4ff', P: '#34344a', p: '#4c4c66', O: '#f3f3f1', o: '#b9b8b2', M: '#c0705a',
        F: '#fafaf7', G: '#c3bfb6', A: '#1180f9', I: '#161514', R: '#f2a7a0', Q: '#ff9fb3',
        Y: '#ffc940', y: '#d98f1f', N: '#f0a47a', n: '#fbd3ba', T: '#48a9a6', t: '#d9f3f1',
        E: '#5aa9ff', e: '#16324f', V: '#c3f53c', v: '#eafcc0', Z: '#f05523', z: '#ffb18f'
    };

    var HEAD = [
        '........KKKKKKKKKK........',
        '......KKHHHHHHKHHHKK......',
        '.....KHHHhhHHHKHHhHHK.....',
        '....KHHhhHHHHHKHHHhHHK....',
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
        '.KHhHSSSSSSBbSSSSSSBbSHK..',
        '..KKHsSSSSSSSSSSSSSSSSK...',
        '....KsRRSSSSSSSSSSRRSK....',
        '....KssSSSSSSSMMSSSSSK....',
        '.....KKssSSSSSSSSSSKK.....',
        '.......KKKssssssKKK.......',
        '..........KKKKKK..........'
    ];

    var TORSO = [
        '...........KSSK...........',
        '.........KKCCCCKK.........',
        '........KCCCCLCCCK........',
        '.......KCCCCCLCCCCK.......',
        '.......KCCKCCCCCKCK.......',
        '.......KCcKCCCCCKCK.......',
        '.......KCcKCCCCCKcK.......',
        '.......KSSKCCCCCKSK.......',
        '........KKKcccccKK........'
    ];

    var LEGS = {
        stand: [
            '.........KPPPPPPK.........',
            '.........KPPKKPPK.........',
            '.........KPPKKPPK.........',
            '.........KPpKKPpK.........',
            '.........KOOKKOOK.........',
            '........KOOOKKOOOK........',
            '........KKKKKKKKKK........'
        ],
        stride: [
            '.........KPPPPPPK.........',
            '........KPPPKKPPPK........',
            '.......KPPK..KPPPK........',
            '......KPpK....KPpK........',
            '.....KOOK......KOOK.......',
            '....KOOOK.....KOOOK.......',
            '....KKKKK.....KKKKK.......'
        ],
        pass: [
            '.........KPPPPPPK.........',
            '..........KPPPPK..........',
            '..........KPPPPK..........',
            '..........KPpPpK..........',
            '..........KOOOOK..........',
            '.........KOOOOOOK.........',
            '.........KKKKKKKK.........'
        ]
    };

    function hero(legs) { return HEAD.concat(TORSO, LEGS[legs]); }

    var BIT = [
        '................', '.......AA.......', '.......AA.......', '.......GG.......',
        '...FFFFFFFFFF...', '..FFFFFFFFFFFF..', '.GFFFFFFFFFFFFG.', '.GFFFIIFFIIFFFG.',
        '.GFFFIIFFIIFFFG.', '.GFQQFFFFFFQQFG.', '.GFQQFFIIFFQQFG.', '.GFFFFFFFFFFFFG.',
        '.GGFFFFFFFFFFGG.', '.GGGGGGGGGGGGGG.', '..GGGGGGGGGGGG..', '................'
    ];

    var ICONS = {
        nocta: [
            '................', '.....NNNNN......', '...NNNNNN.......', '..NNNNNN........',
            '..NNNNN.....n...', '.NNNNNN.........', '.NNNNNN.........', '.NNNNNNN........',
            '.NNNNNNN.......N', '.nNNNNNNN.....NN', '..nNNNNNNNNNNNN.', '..nnNNNNNNNNNNN.',
            '...nnNNNNNNNNN..', '.....nnNNNNN....', '................', '................'
        ],
        skillcat: [
            '................', '......ZZZZ......', '....ZZzzZZZZ....', '...ZZzZZZZZZZ...',
            '..ZZzZZZZZZZZZ..', '..ZZZZZKZZZZZZ..', '..ZZZZZKZZZZZZ..', '.ZZZZZZKZZZZZZZ.',
            '.ZZZZZZKZZZZZZZ.', 'ZZZZZZZZZZZZZZZZ', 'ZZZZZZZZZZZZZZZZ', 'KKKKKKKKKKKKKKKK',
            '................', '................', '................', '................'
        ],
        scriptchain: [
            '................', '.....TTTTTT.....', '.....TttttT.....', '.....TttttT.....',
            '.....TttttT.....', '.TTTTTttttTTTTT.', '.TtttttttttttTT.', '.TtttttttttttTT.',
            '.TtttttttttttTT.', '.TTTTTttttTTTTT.', '.....TttttT.....', '.....TttttT.....',
            '.....TttttT.....', '.....TTTTTT.....', '................', '................'
        ],
        mirror: [
            '................', '.......VV.......', '......VVv.......', '.....VVVv.......',
            '....VVVVv..v....', '...VVVVVv..vv...', '..VVVVVVv..vvv..', '.VVVVVVVv..vvvv.',
            '..VVVVVVv..vvv..', '...VVVVVv..vv...', '....VVVVv..v....', '.....VVVv.......',
            '......VVv.......', '.......VV.......', '................', '................'
        ],
        reveal: [
            '................', '................', '.....EEEEEE.....', '...EEWWWWWWEE...',
            '..EWWWWeeWWWWE..', '.EWWWWeeeeWWWWE.', 'EWWWWeeWWeeWWWWE', 'EWWWWeeWWeeWWWWE',
            '.EWWWWeeeeWWWWE.', '..EWWWWeeWWWWE..', '...EEWWWWWWEE...', '.....EEEEEE.....',
            '................', '................', '................', '................'
        ]
    };

    function draw(ctx, rows, x, y) {
        for (var r = 0; r < rows.length; r++) {
            for (var c = 0; c < rows[r].length; c++) {
                var col = PAL[rows[r].charAt(c)];
                if (!col) continue;
                ctx.fillStyle = col;
                ctx.fillRect(x + c, y + r, 1, 1);
            }
        }
    }

    // Small deterministic random, so scenes look the same on every load
    function rng(seed) {
        return function () {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };
    }

    window.PX = {
        HERO: { stand: hero('stand'), stride: hero('stride'), pass: hero('pass') },
        WALK: ['stride', 'pass', 'stride', 'stand'],
        BIT: BIT, ICONS: ICONS, draw: draw, rng: rng
    };
})();
