// About page: character select. Each roster slot is a career chapter, and the
// sprite changes outfit with it. Sprites are original, plotted as text grids.
(function () {
    'use strict';

    var stage = document.getElementById('selectStage');
    if (!stage) return;

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Sprite ------------------------------------------------------------
    var BASE = {
        K: '#1a1822', H: '#3a3246', h: '#75688f', S: '#f7d3b5', s: '#e5ab86',
        W: '#ffffff', B: '#24406e', b: '#3f79c9', M: '#c0705a', R: '#f2a7a0',
        P: '#34344a', p: '#4c4c66', O: '#f3f3f1', o: '#b9b8b2',
        Y: '#ffc940', y: '#d98f1f', A: '#1180f9', G: '#c3bfb6', F: '#fafaf7', I: '#161514', Q: '#ff9fb3', T: '#d8352a'
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

    var BODY = [
        '...........KSSK...........',
        '.........KKCCCCKK.........',
        '........KCCCCLCCCK........',
        '.......KCCCCCLCCCCK.......',
        '.......KCCKCCCCCKCK.......',
        '.......KCcKCCCCCKCK.......',
        '.......KCcKCCCCCKcK.......',
        '.......KSSKCCCCCKSK.......',
        '........KKKcccccKK........',
        '.........KPPPPPPK.........',
        '.........KPPKKPPK.........',
        '.........KPPKKPPK.........',
        '.........KPpKKPpK.........',
        '.........KOOKKOOK.........',
        '........KOOOKKOOOK........',
        '........KKKKKKKKKK........'
    ];

    // Outfits with their own silhouette. All are 16 rows, like BODY.
    var OUTFITS = {
        // White coat over scrubs, stethoscope around the neck
        doctor: [
            '...........KSSK...........',
            '.........KKCEECKK.........',
            '........KCCIEEICCK........',
            '.......KCCCIEEICCCK.......',
            '.......KCCKCICICKCK.......',
            '.......KCcKCICICKCK.......',
            '.......KCcKCCGCCKcK.......',
            '.......KSSKCCcCCKSK.......',
            '........KKKCCcCCKK........',
            '.........KCCcCCCK.........',
            '.........KcCKKCcK.........',
            '.........KPPKKPPK.........',
            '.........KPpKKPpK.........',
            '.........KOOKKOOK.........',
            '........KOOOKKOOOK........',
            '........KKKKKKKKKK........'
        ],
        // Navy suit, white dress shirt with cuffs showing, tie
        suit: [
            '...........KSSK...........',
            '.........KKCNNCKK.........',
            '........KCCCNTNCCK........',
            '.......KCCCCNTNCCCK.......',
            '.......KCCKCNTNCKCK.......',
            '.......KCcKCCTCCKCK.......',
            '.......KNNKCCTCCKNK.......',
            '.......KSSKCCCCCKSK.......',
            '........KKKcccccKK........',
            '.........KPPPPPPK.........',
            '.........KPPKKPPK.........',
            '.........KPPKKPPK.........',
            '.........KPpKKPpK.........',
            '.........KOOKKOOK.........',
            '........KOOOKKOOOK........',
            '........KKKKKKKKKK........'
        ],
        // Short sleeves, collar and buttons, then pants
        polo: [
            '...........KSSK...........',
            '.........KKLLLLKK.........',
            '........KCCCLLCCCK........',
            '.......KCCCCCWCCCCK.......',
            '.......KCCKCCWCCKCK.......',
            '.......KSSKCCCCCKSK.......',
            '.......KSSKCCCCCKSK.......',
            '.......KSSKCCCCCKSK.......',
            '........KKKcccccKK........',
            '.........KPPPPPPK.........',
            '.........KPPKKPPK.........',
            '.........KPPKKPPK.........',
            '.........KPpKKPpK.........',
            '.........KOOKKOOK.........',
            '........KOOOKKOOOK........',
            '........KKKKKKKKKK........'
        ],
        // Long gown with a coloured stole down the front
        gown: [
            '...........KSSK...........',
            '.........KKUCCUKK.........',
            '........KCCUCCUCCK........',
            '.......KCCCUCCUCCCK.......',
            '.......KCCKUCCUKCCK.......',
            '.......KCcKUCCUKCcK.......',
            '.......KCcKUCCUKCcK.......',
            '.......KSSKUCCUKSSK.......',
            '........KKKUCCUKKK........',
            '.........KCUCCUCK.........',
            '.........KCuCCuCK.........',
            '........KCCCCCCCCK........',
            '........KcCCCCCCcK........',
            '........KKKKKKKKKK........',
            '..........KOKKOK..........',
            '..........KKKKKK..........'
        ]
    };

    // Gear drawn over the head. dy is relative to the top of the sprite.
    var GEAR = {
        hardhat: { dy: -3, rows: [
            '.........KKKKKKKK.........',
            '.......KKYYYYYYYYKK.......',
            '......KYYYYYYyYYYYYK......',
            '.....KYYYYYYYyYYYYYYK.....',
            '....KYYYYYYYYyYYYYYYYK....',
            '....KYYYYYYYYyYYYYYYYK....',
            '...KYYYYYYYYYYYYYYYYYYK...',
            '...KYYYYYYYYYYYYYYYYYYYK..',
            '..KKKKKKKKKKKKKKKKKKKKKKK.'
        ] },
        gradcap: { dy: -4, rows: [
            '............KKK...........',
            '.........KKKCCCKKK........',
            '......KKKCCCUUCCCCKKK.....',
            '...KKKCCCCCCCCCCCCCCCKKK..',
            '......KKKCCCCCCCCCKKK.U...',
            '......KCCKKKKKKKKKCCK.U...',
            '......KKKKKKKKKKKKKKK.UU..',
            '......................UU..'
        ] },
        headset: { dy: -1, rows: [
            '.........AAAAAAAA.........',
            '......AAA........AAA......',
            '.....A..............A.....',
            '....A................A....',
            '...A..................A...',
            '...A..................A...',
            '..A....................A..',
            '..A....................A..',
            '..A....................A..',
            '.AA....................AA.',
            '.AA....................AA.',
            '.AA....................AA.',
            '.AA....................AA.',
            '.AA....................AA.'
        ] },
        // The classic doctor's head mirror
        headmirror: { dy: 3, rows: [
            '...........KKKKK..........',
            '..........KWWWWWK.........',
            '..KGGGGGGGKWbWWWKGGGGGGK..',
            '..KGGGGGGGKWWWWWKGGGGGGK..',
            '..........KWWWWWK.........',
            '...........KKKKK..........'
        ] }
    };

    // ---- Chapters ----------------------------------------------------------
    var CHAPTERS = [
        { id: 'today', label: 'Today', title: 'Product Designer & Design Engineer',
          era: '#1180f9', soft: '#66d2ff', body: { C: '#2f7df0', c: '#1b58b8', L: '#7fc4ff' }, gear: [],
          klass: 'Designer who codes', guild: 'New York City', years: 'Available now',
          text: ['I focus on crafting clean, modern digital experiences that balance usability, visual clarity, and strong interaction design. I\'m especially interested in the details that make products feel seamless, from user flows and interface systems to motion, responsiveness, and overall polish.',
                 'My background spans UX/UI design, prototyping, research, and front-end development, which lets me think beyond static screens and design with execution in mind.'] },
        { id: 'skillcat', label: 'SkillCat', title: 'Design Engineer', logo: 'assets/Companies/skillcat.png',
          era: '#f05523', soft: '#ffb18f', body: { C: '#f05523', c: '#b23a14', L: '#ffb18f' }, gear: ['hardhat'],
          klass: 'Design Engineer', guild: 'SkillCat', years: '2025 to 2026', href: '/skillcat', hrefLabel: 'Read the SkillCat case study',
          text: ['Led design and front-end development for a mobile learning platform focused on trade skills. Built UI components, prototyped interactions, and bridged the gap between design and engineering.'] },
        { id: 'scriptchain', label: 'ScriptChain', title: 'Technical Product Designer', logo: 'assets/Companies/scriptchain.png',
          era: '#48a9a6', soft: '#a9e6e2', outfit: 'doctor', body: { C: '#f4f7f6', c: '#c7d3d0', E: '#2f9c95', I: '#2a3240', P: '#1f6f6a', p: '#2f8f88' }, gear: ['headmirror'],
          klass: 'Technical Product Designer', guild: 'ScriptChain Health', years: '2025', href: '/scriptchain', hrefLabel: 'Read the ScriptChain case study',
          text: ['Designed patient-facing dashboards and data visualization tools for a health-tech startup. Conducted user research and usability testing to simplify complex medical data workflows.'] },
        { id: 'parsons', label: 'Parsons', title: 'M.S. Communication Design', logo: 'assets/Companies/parsons.png',
          era: '#e0343c', soft: '#ffb3b0', outfit: 'gown', body: { C: '#4a4a5c', c: '#343444', U: '#ff4a52', u: '#c92a33' }, gear: ['gradcap'],
          klass: 'Graduate student', guild: 'Parsons School of Design', years: 'Class of 2025', href: '/nocta', hrefLabel: 'Read the Nocta case study',
          text: ['Studied digital product design. Nocta began here as my capstone, then grew into a live beta.'] },
        { id: 'colab', label: 'Co.Lab', title: 'Product Designer',
          era: '#8a63e8', soft: '#cdb9ff', body: { C: '#7a4fe0', c: '#5a35ad', L: '#c7b3ff' }, gear: ['headset'],
          klass: 'Product Designer', guild: 'Co.Lab', years: '2024',
          text: ['Worked with product managers and developers on a platform that generates custom career roadmaps from a person\'s goals, and integrated the OpenAI Assistants API to personalize recommendations.'] },
        { id: 'jpm', label: 'JPMorgan', title: 'Software Engineer', logo: 'assets/Companies/chase-logo.jpg',
          era: '#2f6fd8', soft: '#a8c8ff', outfit: 'suit', body: { C: '#2a4a94', c: '#1f3875', N: '#ffffff', P: '#2a4a94', p: '#3a5cb0', O: '#3a3440' }, gear: [],
          klass: 'Software Engineer', guild: 'JPMorgan Chase', years: '2022',
          text: ['Developed internal tools and front-end features for financial applications. Collaborated with cross-functional teams to deliver scalable, production-ready code.'] },
        { id: 'omnicom', label: 'Omnicom', title: 'Marketing Analyst', logo: 'assets/Companies/omd.png',
          era: '#d9a21b', soft: '#ffe08a', outfit: 'polo', body: { C: '#2e7d5b', c: '#1f5a41', L: '#7fd0a8', P: '#b89a6a', p: '#cdb285', O: '#6a4326' }, gear: [],
          klass: 'Marketing Analyst', guild: 'Omnicom Media Group', years: '2018 to 2019',
          text: ['Analyzed campaign performance data and consumer insights to optimize digital marketing strategies for major brand clients across multiple channels.'] },
        { id: 'ub', label: 'Buffalo', title: 'B.S. Business Administration', logo: 'assets/Companies/ub-logo.jpg',
          era: '#1a6fd8', soft: '#9cc8ff', outfit: 'gown', body: { C: '#4a4a5c', c: '#343444', U: '#3f96ff', u: '#1f6fd8' }, gear: ['gradcap'],
          klass: 'Undergraduate', guild: 'University at Buffalo', years: 'Class of 2018',
          text: ['Studied business before moving into marketing, engineering and design.'] }
    ];

    function plot(ctx, rows, x, y, pal) {
        for (var r = 0; r < rows.length; r++) {
            for (var c = 0; c < rows[r].length; c++) {
                var col = pal[rows[r].charAt(c)];
                if (!col) continue;
                ctx.fillStyle = col;
                ctx.fillRect(x + c, y + r, 1, 1);
            }
        }
    }

    function drawHero(ctx, chapter, x, y) {
        var pal = Object.assign({}, BASE, chapter.body);
        plot(ctx, HEAD, x, y, pal);
        plot(ctx, OUTFITS[chapter.outfit] || BODY, x, y + HEAD.length, pal);
        chapter.gear.forEach(function (g) { plot(ctx, GEAR[g].rows, x, y + GEAR[g].dy, pal); });
    }

    var BIT = [
        '................', '.......AA.......', '.......AA.......', '.......GG.......',
        '...FFFFFFFFFF...', '..FFFFFFFFFFFF..', '.GFFFFFFFFFFFFG.', '.GFFFIIFFIIFFFG.',
        '.GFFFIIFFIIFFFG.', '.GFQQFFFFFFQQFG.', '.GFQQFFIIFFQQFG.', '.GFFFFFFFFFFFFG.',
        '.GGFFFFFFFFFFGG.', '.GGGGGGGGGGGGGG.', '..GGGGGGGGGGGG..', '................'
    ];

    // ---- Stage -------------------------------------------------------------
    var SW = 88, SH = 46;
    var sx = stage.getContext('2d');
    stage.width = SW; stage.height = SH;

    // No scenery: the character stands on top of the nameplate
    function paintStage(chapter, hop, bob) {
        sx.clearRect(0, 0, SW, SH);
        drawHero(sx, chapter, 18, SH - HEAD.length - BODY.length - hop);
        plot(sx, BIT, 56, SH - 15 + bob, BASE);
    }

    // ---- Roster ------------------------------------------------------------
    var rosterEl = document.getElementById('selectRoster');
    var journeyEl = document.getElementById('selectJourney');
    var summaryEl = document.getElementById('selectSummary');
    var root = document.querySelector('.about-layout');
    var current = 0, hop = 0, t = 0;

    CHAPTERS.forEach(function (ch, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', ch.title + ', ' + ch.guild);
        var cv = document.createElement('canvas');
        cv.width = 34; cv.height = 34;
        var c = cv.getContext('2d');
        c.fillStyle = ch.era;
        c.fillRect(0, 0, 34, 34);
        c.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (var y = 0; y < 34; y += 2) for (var x = (y / 2 % 2) * 2; x < 34; x += 4) c.fillRect(x, y, 2, 2);
        drawHero(c, ch, 4, 5);
        b.appendChild(cv);
        var s = document.createElement('span');
        s.textContent = ch.label;
        b.appendChild(s);
        b.addEventListener('click', function () { pick(i); });
        rosterEl.appendChild(b);
        ch.slot = b;

        if (ch.id === 'today') return;
        var li = document.createElement('li');
        var j = document.createElement('button');
        j.type = 'button';
        j.innerHTML = '<b></b><span></span><time></time>';
        j.children[0].textContent = ch.title;
        j.children[1].textContent = ch.guild;
        j.children[2].textContent = ch.years;
        j.addEventListener('click', function () {
            pick(i);
            document.querySelector('.select').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
        li.appendChild(j);
        journeyEl.appendChild(li);
        ch.row = j;
    });

    function renderSummary(ch) {
        var html = '<div class="summary-head"><h2></h2>' + (ch.logo ? '<img class="summary-logo" alt="">' : '') + '</div>' +
            '<dl class="summary-stats">' +
                '<div><dt>Class</dt><dd data-f="klass"></dd></div>' +
                '<div><dt>Guild</dt><dd data-f="guild"></dd></div>' +
                '<div><dt>Era</dt><dd data-f="years"></dd></div>' +
            '</dl>';
        summaryEl.innerHTML = html;
        summaryEl.querySelector('h2').textContent = ch.title;
        if (ch.logo) summaryEl.querySelector('img').src = ch.logo;
        summaryEl.querySelectorAll('[data-f]').forEach(function (d) { d.textContent = ch[d.dataset.f]; });
        ch.text.forEach(function (p) {
            var el = document.createElement('p');
            el.className = 'summary-text';
            el.textContent = p;
            summaryEl.appendChild(el);
        });
        if (ch.href) {
            var a = document.createElement('a');
            a.className = 'summary-link';
            a.href = ch.href;
            a.textContent = ch.hrefLabel;
            summaryEl.appendChild(a);
        }
    }

    // Every chapter gets the height of the tallest one, so the card and the
    // roster below it never move. Measured, so it holds at any width.
    function equalizeSummary() {
        summaryEl.setAttribute('aria-live', 'off');
        summaryEl.style.minHeight = '';
        var tallest = 0;
        CHAPTERS.forEach(function (ch) {
            renderSummary(ch);
            tallest = Math.max(tallest, summaryEl.offsetHeight);
        });
        summaryEl.style.minHeight = tallest + 'px';
        renderSummary(CHAPTERS[current]);
        summaryEl.setAttribute('aria-live', 'polite');
    }

    function pick(i) {
        current = i;
        var ch = CHAPTERS[i];
        root.style.setProperty('--era', ch.era);
        root.style.setProperty('--era-soft', ch.soft);
        CHAPTERS.forEach(function (c, k) {
            c.slot.setAttribute('aria-pressed', k === i ? 'true' : 'false');
            if (c.row) c.row.setAttribute('aria-current', k === i ? 'true' : 'false');
        });
        renderSummary(ch);
        hop = reduce ? 0 : 2;
        paintStage(ch, hop, 0);
    }

    addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('input, textarea')) return;
        var n = CHAPTERS.length, cols = innerWidth < 900 ? 4 : n;
        var step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols < n ? cols : 0, ArrowUp: cols < n ? -cols : 0 }[e.key];
        if (!step) return;
        e.preventDefault();
        var next = (current + step + n) % n;
        pick(next);
        CHAPTERS[next].slot.focus({ preventScroll: true });
    });

    pick(0);
    equalizeSummary();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeSummary);

    var resizeTimer;
    addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(equalizeSummary, 120);
    });

    // Idle: a two-frame bounce, and the hop that lands a new selection
    if (!reduce) {
        setInterval(function () {
            if (document.hidden || stage.getBoundingClientRect().bottom < 0) return;
            t++;
            if (hop > 0) hop -= 1;
            paintStage(CHAPTERS[current], hop, t % 4 < 2 ? 0 : 1);
        }, 180);
    }
})();
