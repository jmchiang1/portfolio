// ============================================
// Title screen
//
// Plays over Home's live background on every arrival from outside the site and
// every refresh of Home:
//   1. The dark lifts through dither and "Press any key" waits. The press (which
//      is what lets a browser play sound) brings the name in from chunky blue
//      blocks, sharpening step by step to a rising chiptune.
//   2. The blue drops out of the letters, then the tagline and menu land.
//   3. Start Game turns the title into Home on one shared grid of blocks, in
//      Home's order, so Home builds itself piece by piece: the nav first, then
//      the cards, then the controls. Level Select goes straight to a case study,
//      and Resume and LinkedIn open in a new tab.
//
// Any input during the opening jumps to the menu, so nobody has to wait for it.
// Reduced motion gets a still screen. Replay with ?title. The flag script in
// index.html's <head> decides whether this runs.
// ============================================
(function () {
    'use strict';

    var root = document.documentElement;
    if (!root.classList.contains('title-on')) return;
    window.TitleScreen = true;

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var touch = matchMedia('(hover: none)').matches;

    var page     = document.querySelector('.scroll-container');

    var COVER_MS = 520;  // the dark lifts
    var STEP_MS = 120;   // each mosaic size holds this long
    var BUILD_MS = 1100; // the last of Home's pieces is in by about here
    var SWAP_CELL = 24;

    var COVER_CELL = 6;
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    // Block sizes, in cells of the name's own pixel grid, largest first
    var MOSAIC = [16, 12, 8, 6, 4, 3, 2];
    var RAMP = ['#0a4a9a', '#1180f9', '#7fc4ff', '#ffffff'];
    var T_END = (MOSAIC.length + 1) * STEP_MS + 20;

    var RESUME = 'assets/Jonathan-Chiang-Design-Resume-2026.pdf';
    var LINKEDIN = 'https://www.linkedin.com/in/jmchiang5/';

    // Keep in step with the cards on Home
    var LEVELS = [
        { name: 'Nocta', year: '2026', href: '/nocta', hint: 'An AI companion for CPAP users.' },
        { name: 'SkillCat', year: '2026', href: '/skillcat', hint: 'Mobile learning for the skilled trades.' },
        { name: 'ScriptChain', year: '2025', href: '/scriptchain', hint: 'Doctor-signed food and exercise plans.' },
        { name: 'Mirror', year: '2024', href: '/robinhood', hint: 'Mirror trading for young investors.' },
        { name: 'Reveal', year: '2024', href: '/reveal', hint: 'AR that uncovers hostile architecture.' }
    ];

    var raf = 0, clockTimer = 0, leaving = false, landed = false, chromeReleased = false, finished = false;
    var frames = [], t0 = 0, lastCover = -1;
    var homeLayers = [];

    // Press start. Browsers allow sound only after a key press, click or tap, so
    // the name waits for one: the dark lifts, the prompt blinks, and the first
    // press brings in the name with its sound.
    var playing = false, started = false, wantStart = false, nameT0 = 0, nameBus = null;

    try {
        sessionStorage.setItem('jc_title_seen', '1');
    } catch (e) {}

    // ---- Markup --------------------------------------------------------------
    var layer = document.createElement('div');
    layer.className = 'title-layer';
    layer.innerHTML =
        '<canvas class="title-cover" aria-hidden="true"></canvas>' +
        '<canvas class="title-fx" aria-hidden="true"></canvas>' +
        '<button class="title-press" type="button">' + (touch ? 'Tap to start' : 'Press any key') + '</button>' +
        '<div class="title-stage">' +
        '<div class="title-center">' +
            '<p class="title-logo">Jonathan Chiang</p>' +
            '<p class="title-tag">Turning product ideas into <em>shipped</em> experiences.</p>' +
            '<div class="title-lists">' +
                '<ul class="title-list title-menu">' +
                    '<li><button class="title-item" type="button" data-start data-hint="Enter the portfolio.">Start game</button></li>' +
                    '<li><button class="title-item" type="button" data-levels data-hint="Jump straight to a case study.">Level select</button></li>' +
                    '<li><a class="title-item" href="' + RESUME + '" target="_blank" rel="noopener noreferrer" data-hint="Open the PDF.">Resume</a></li>' +
                    '<li><a class="title-item" href="' + LINKEDIN + '" target="_blank" rel="noopener noreferrer" data-hint="Open to full-time roles. Say hi.">LinkedIn</a></li>' +
                '</ul>' +
                '<ul class="title-list title-levels is-away">' +
                    LEVELS.map(function (l) {
                        return '<li><a class="title-item" href="' + l.href + '" data-case data-hint="' + l.hint + '"><span>' + l.name + '</span><small>' + l.year + '</small></a></li>';
                    }).join('') +
                    '<li><button class="title-item title-back" type="button" data-back data-hint="Back to the main menu.">Back</button></li>' +
                '</ul>' +
            '</div>' +
            '<p class="title-hint" aria-live="polite"></p>' +
        '</div>' +
        '<div class="title-hud">' +
            '<span class="title-clock" aria-hidden="true">NYC</span>' +
            '<span class="title-details"><span>Product Designer &amp; Design Engineer based in NYC</span><span>Open to full-time roles</span><span>Previously at SkillCat</span></span>' +
            (touch ? '' : '<span class="title-keys" aria-hidden="true">Up/Down, Enter</span>') +
        '</div>' +
        '</div>';
    document.body.appendChild(layer);

    var cover = layer.querySelector('.title-cover');
    var fx    = layer.querySelector('.title-fx');
    var logo  = layer.querySelector('.title-logo');
    var stage = layer.querySelector('.title-stage');
    var menu   = layer.querySelector('.title-menu');
    var levels = layer.querySelector('.title-levels');
    var hint   = layer.querySelector('.title-hint');
    var press  = layer.querySelector('.title-press');
    var clock = layer.querySelector('.title-clock');
    var W = innerWidth, H = innerHeight, CX = W / 2, CY = H / 2;

    if (page) page.inert = true;

    // ---- Clock ---------------------------------------------------------------
    var fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', second: '2-digit' });
    function tick() { clock.textContent = 'NYC ' + fmt.format(new Date()); }
    tick();
    clockTimer = setInterval(tick, 1000);

    // ---- Finish --------------------------------------------------------------
    // Hands the page back. `title-played` goes on in the same tick, so Home's own
    // entrance animations never get a frame.
    function releaseChrome() {
        if (chromeReleased) return;
        chromeReleased = true;
        if (page) page.inert = false;
        root.classList.add('title-played');
        root.classList.remove('title-hold');
    }

    // Idempotent, so the page can never stay hidden.
    function finish() {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(raf);
        clearInterval(clockTimer);
        removeInput();
        releaseChrome();
        document.body.style.opacity = '1';
        homeLayers.forEach(function (h) { h.el.style.clipPath = ''; });
        root.classList.remove('title-on', 'title-live', 'title-swap');
        layer.remove();
        // Long enough for the last notes to finish
        if (audio) setTimeout(function () { audio.close(); }, 400);
    }

    // ---- Name ----------------------------------------------------------------
    // Reads the name's pixels off a canvas set up to match the page's text, so
    // the blocks resolve onto exactly where the real letters are.
    function buildFrames() {
        var box = logo.getBoundingClientRect();
        var style = getComputedStyle(logo);
        var size = parseFloat(style.fontSize);
        var lineH = parseFloat(style.lineHeight) || size * 0.9;
        var lines = Math.round(box.height / lineH) > 1 ? logo.textContent.split(' ') : [logo.textContent];
        var w = Math.ceil(box.width), h = Math.ceil(box.height);

        // Whole pixels, or the blocks show hairline seams between them
        var left = Math.round(box.left), top = Math.round(box.top);

        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var x = c.getContext('2d', { willReadFrequently: true });
        x.font = size + "px 'Jersey 25'";
        x.textAlign = 'center';
        x.textBaseline = 'alphabetic';
        x.fillStyle = '#fff';
        var m = x.measureText(logo.textContent);
        var asc = m.fontBoundingBoxAscent || size * 0.8;
        var desc = m.fontBoundingBoxDescent || size * 0.2;
        lines.forEach(function (text, i) {
            x.fillText(text, w / 2, i * lineH + (lineH - asc - desc) / 2 + asc);
        });
        var data = x.getImageData(0, 0, w, h).data;

        // Each block takes its colour from how much of the name it covers
        var cell = Math.max(2, Math.round(size / 24));
        frames = MOSAIC.concat(1).map(function (k) {
            var s = k * cell, blocks = [];
            for (var y = 0; y < h; y += s) {
                for (var bx = 0; bx < w; bx += s) {
                    var sum = 0, count = 0;
                    for (var j = y; j < Math.min(h, y + s); j += 2) {
                        for (var i = bx; i < Math.min(w, bx + s); i += 2) {
                            sum += data[(j * w + i) * 4 + 3];
                            count++;
                        }
                    }
                    var a = sum / count / 255;
                    if (k === 1 ? a > 0.45 : a > 0.08) {
                        blocks.push({
                            x: left + bx, y: top + y,
                            w: Math.min(s, w - bx), h: Math.min(s, h - y),
                            col: k === 1 ? RAMP[3] : RAMP[a < 0.26 ? 0 : a < 0.46 ? 1 : a < 0.66 ? 2 : 3]
                        });
                    }
                }
            }
            return blocks;
        });
    }

    // ---- Opening -------------------------------------------------------------
    function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

    var cctx, fctx, cw, ch, img, dpr;

    function setupCanvases() {
        cw = Math.ceil(W / COVER_CELL);
        ch = Math.ceil(H / COVER_CELL);
        cover.width = cw;
        cover.height = ch;
        cctx = cover.getContext('2d');
        img = cctx.createImageData(cw, ch);

        dpr = Math.min(2, devicePixelRatio || 1);
        fx.width = W * dpr;
        fx.height = H * dpr;
        fctx = fx.getContext('2d');
        fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // The dark lifts evenly through dither
    function drawCover(t) {
        var step = Math.floor(t / 45);
        if (step === lastCover) return;
        lastCover = step;
        var open = clamp01(t / COVER_MS);
        var px = new Uint32Array(img.data.buffer);
        for (var y = 0; y < ch; y++) {
            for (var x = 0; x < cw; x++) {
                px[y * cw + x] = open > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? 0 : 0xff0a0b0c;
            }
        }
        cctx.putImageData(img, 0, 0);
    }

    function drawName(t) {
        var blocks = frames[Math.min(frames.length - 1, Math.floor(t / STEP_MS))];
        fctx.clearRect(0, 0, W, H);
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i];
            fctx.fillStyle = b.col;
            fctx.fillRect(b.x, b.y, b.w, b.h);
        }
    }

    function frame(now) {
        if (landed) return;

        // The first frame's timestamp can land just before t0
        var t = Math.max(0, now - t0);
        try {
            drawCover(t);
            if (started) drawName(Math.max(0, now - nameT0));
        } catch (e) {
            land(true); // a broken opening must never leave anyone on a dark screen
            return;
        }
        if (started) {
            if (now - nameT0 < T_END) raf = requestAnimationFrame(frame);
            else land();
            return;
        }
        // Until the first press only the cover moves, and it stops once lifted
        if (t >= COVER_MS) layer.classList.add('is-waiting');
        if (t < COVER_MS + 90) raf = requestAnimationFrame(frame);
    }

    function start() {
        if (started || landed || leaving) return;
        if (!playing) { wantStart = true; return; } // pressed before the font was ready
        started = true;
        layer.classList.remove('is-waiting');
        layer.classList.add('is-started');

        // Picture and sound begin together once the audio is running. If it never
        // gets permission, the name still plays, silently.
        var begun = false;
        function begin() {
            if (begun || landed) return;
            begun = true;
            nameT0 = performance.now();
            nameSound();
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(frame);
        }
        if (audio) {
            audio.resume().then(begin, begin);
            setTimeout(begin, 150);
        } else {
            begin();
        }
    }

    function showMenu() {
        layer.classList.add('is-ready', 'is-entering');
        setTimeout(function () { layer.classList.remove('is-entering'); }, 800);
    }

    function land(now) {
        if (landed) return;
        landed = true;
        cancelAnimationFrame(raf);
        // Skipped part way: the rest of the name's sound fades out with it
        if (now && nameBus) nameBus.gain.setTargetAtTime(0, audio.currentTime, 0.02);
        layer.classList.remove('is-waiting');
        root.classList.add('title-live');
        cover.remove();
        fx.remove();
        layer.classList.add('is-logo', 'is-lit');
        if (now) showMenu();
        else setTimeout(showMenu, 200);
    }

    function play() {
        if (landed) return;
        try {
            setupCanvases();
            drawCover(0);
            root.classList.add('title-live');
            buildFrames();
        } catch (e) {
            land(true);
            return;
        }
        playing = true;
        t0 = performance.now();
        raf = requestAnimationFrame(frame);
        if (wantStart) start();
    }

    // ---- Start ---------------------------------------------------------------
    // The title turns into Home on one shared grid of blocks. When a block of the
    // title drops out, the same block of Home appears in that frame, so the two
    // never overlap and never leave a gap. The blocks go in Home's order, which is
    // what makes Home build itself piece by piece: each piece's blocks swap
    // together in a dither (the nav first, then the cards, then the controls
    // around them), and blocks over empty background clear first. Both sides are
    // live content, so the blocks are clip shapes on a few full-screen layers,
    // redrawn on a steady step rather than every frame.
    //
    // [selector, start ms, ms its blocks take, ms between repeats]. Listed top
    // layer first: a block goes to the first piece that covers it, so the arrows
    // win over the side cards they sit on.
    var BUILD = [
        ['.mc-bubble', 680, 200, 0],
        ['.mc-launcher', 600, 200, 0],
        ['.arena-tab', 640, 200, 0],
        ['.social-links .social-link', 500, 200, 60],
        ['.carousel-nav-prev', 520, 200, 0],
        ['.carousel-nav-next', 560, 200, 0],
        ['.carousel-counter', 560, 220, 0],
        ['.layout-toggle', 440, 200, 0],
        ['.hamburger', 160, 200, 0],
        ['.nav-logo', 100, 200, 0],
        ['.nav-links .nav-link', 150, 200, 55],
        ['.home-header', 200, 480, 0]
    ];
    var CLEAR_MS = 460;  // blocks over empty background are gone by here
    var SWAP_TICK = 33;  // the blocks move on this step, about 30 a second

    function onScreen(el) {
        if (!el.offsetWidth) return false;
        var r = el.getBoundingClientRect();
        return r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
    }

    function swapPieces() {
        var list = [];
        BUILD.forEach(function (b) {
            var n = 0;
            document.querySelectorAll(b[0]).forEach(function (el) {
                if (onScreen(el)) list.push({ box: el.getBoundingClientRect(), start: b[1] + b[3] * n++, span: b[2] });
            });
        });
        // The centre card leads and the rest follow. In grid view they go in reading order.
        var cards = Array.prototype.filter.call(document.querySelectorAll('.project-card'), onScreen);
        var grid = document.body.classList.contains('grid-mode');
        cards.sort(function (a, b) {
            if (!grid) return (b.classList.contains('pos-center') ? 1 : 0) - (a.classList.contains('pos-center') ? 1 : 0);
            var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            return ra.top - rb.top || ra.left - rb.left;
        });
        cards.forEach(function (el, i) {
            list.push({ box: el.getBoundingClientRect(), start: grid ? 220 + i * 60 : i ? 420 + (i - 1) * 50 : 220, span: i && !grid ? 420 : 520 });
        });
        return list;
    }

    function swapGrid() {
        var cols = Math.ceil(innerWidth / SWAP_CELL), rows = Math.ceil(innerHeight / SWAP_CELL), cells = new Array(cols * rows);

        // Every block a piece touches, its outline and shadow included, swaps with it
        swapPieces().forEach(function (p) {
            var c0 = Math.max(0, Math.floor((p.box.left - 4) / SWAP_CELL)), c1 = Math.min(cols - 1, Math.floor((p.box.right + 3) / SWAP_CELL));
            var r0 = Math.max(0, Math.floor((p.box.top - 4) / SWAP_CELL)), r1 = Math.min(rows - 1, Math.floor((p.box.bottom + 7) / SWAP_CELL));
            for (var r = r0; r <= r1; r++) {
                for (var c = c0; c <= c1; c++) {
                    if (cells[r * cols + c]) continue;
                    cells[r * cols + c] = {
                        x: c * SWAP_CELL, y: r * SWAP_CELL,
                        at: p.start + ((BAYER[(r & 3) * 4 + (c & 3)] / 15) * 0.7 + Math.random() * 0.3) * p.span
                    };
                }
            }
        });
        // The rest is empty background on Home: the title clears off it early,
        // in a dither drifting down the screen
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                if (cells[r * cols + c]) continue;
                cells[r * cols + c] = {
                    x: c * SWAP_CELL, y: r * SWAP_CELL,
                    at: ((BAYER[(r & 3) * 4 + (c & 3)] / 15) * 0.6 + Math.random() * 0.16 + (r / rows) * 0.24) * CLEAR_MS
                };
            }
        }
        return cells.sort(function (a, b) { return a.at - b.at; });
    }

    function blocks(cells, dx, dy) {
        var out = '';
        for (var i = 0; i < cells.length; i++) {
            out += 'M' + (cells[i].x - dx) + ' ' + (cells[i].y - dy) + 'h' + SWAP_CELL + 'v' + SWAP_CELL + 'h-' + SWAP_CELL + 'z';
        }
        return 'path("' + (out || 'M0 0') + '")';
    }

    function swap(done) {
        var clip = window.CSS && CSS.supports && CSS.supports('clip-path', 'path("M0 0h1v1z")');
        if (!clip) {
            stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'steps(4, end)', fill: 'forwards' });
            swapSound(240);
            setTimeout(done, 240);
            return;
        }

        // Everything on the page except the background, the title and the scripts.
        // A clip path is measured from its own element, so each keeps its offset.
        homeLayers = Array.prototype.filter.call(document.body.children, function (el) {
            return el !== layer && el.id !== 'background-grid' && el.tagName !== 'SCRIPT';
        }).map(function (el) {
            var box = el.getBoundingClientRect();
            return { el: el, x: box.left, y: box.top };
        });
        homeLayers.forEach(function (h) { h.el.style.clipPath = blocks([], 0, 0); });

        var cells = swapGrid(), start = performance.now(), shown = 0, lastTick = -1;
        swapSound(cells[cells.length - 1].at);
        // Home's side only ever grows, so each layer's outline is kept and added to
        var grown = {};
        function step(now) {
            var tick = Math.floor((now - start) / SWAP_TICK);
            if (tick !== lastTick) {
                lastTick = tick;
                var t = tick * SWAP_TICK, k = shown;
                while (k < cells.length && cells[k].at <= t) k++;
                if (k !== shown) {
                    var fresh = cells.slice(shown, k);
                    shown = k;
                    stage.style.clipPath = blocks(cells.slice(k), 0, 0);
                    homeLayers.forEach(function (h) {
                        var key = h.x + ',' + h.y;
                        if (!grown[key]) grown[key] = { seen: -1, path: '' };
                        var g = grown[key];
                        if (g.seen !== k) {
                            g.seen = k;
                            g.path += blocks(fresh, h.x, h.y).slice(6, -2);
                        }
                        h.el.style.clipPath = 'path("' + (g.path || 'M0 0') + '")';
                    });
                }
                if (shown >= cells.length) {
                    stage.style.visibility = 'hidden';
                    done();
                    return;
                }
            }
            raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
    }

    function leave() {
        if (leaving || finished) return;
        leaving = true;
        removeInput();
        layer.classList.add('is-out');

        if (reduce) { finish(); return; }

        root.classList.add('title-swap');
        releaseChrome();
        swap(finish);

        // Animation frames stop in a hidden tab, and the page still has to come back
        setTimeout(finish, BUILD_MS + 600);
    }

    // Closing to a case study: a dither fills the screen, then the page changes
    function goTo(href) {
        if (leaving) return;
        leaving = true;
        removeInput();
        if (reduce) { location.href = href; return; }
        var c = document.createElement('canvas');
        c.className = 'title-wipe';
        var w = c.width = Math.ceil(W / COVER_CELL), h = c.height = Math.ceil(H / COVER_CELL);
        layer.appendChild(c);
        var x = c.getContext('2d');
        x.fillStyle = '#161514';
        var frame = 0, frames = 9;
        var id = setInterval(function () {
            frame++;
            for (var py = 0; py < h; py++) {
                for (var px = 0; px < w; px++) {
                    if (frame / frames >= (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16) x.fillRect(px, py, 1, 1);
                }
            }
            if (frame >= frames) {
                clearInterval(id);
                location.href = href;
            }
        }, 42);
    }

    // ---- Sound ---------------------------------------------------------------
    // Sounds are made here, so there's no file to load. Browsers only allow sound
    // after a key press or click, so the audio starts on the first one (the press
    // that starts the title). The blip plays as the selection moves.
    var audio = null;

    function unlockSound() {
        if (audio) return;
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try { audio = new Ctx(); } catch (e) { audio = null; }
    }

    // The name's sound: a note rising with each mosaic step, then a chime as the
    // letters come sharp. Timed off the same steps as the picture.
    var NAME_NOTES = [196, 262, 330, 392, 523, 659, 784];

    function note(freq, at, len, type, vol, bus) {
        var tone = audio.createOscillator();
        var level = audio.createGain();
        tone.type = type;
        tone.frequency.setValueAtTime(freq, at);
        level.gain.setValueAtTime(vol, at);
        level.gain.exponentialRampToValueAtTime(0.0001, at + len);
        tone.connect(level);
        level.connect(bus || nameBus);
        tone.start(at);
        tone.stop(at + len + 0.02);
    }

    function nameSound() {
        if (!audio || audio.state !== 'running') return;
        nameBus = audio.createGain();
        nameBus.connect(audio.destination);
        var now = audio.currentTime + 0.01, step = STEP_MS / 1000;
        NAME_NOTES.forEach(function (f, i) { note(f, now + i * step, 0.07, 'square', 0.03); });
        var sharp = now + MOSAIC.length * step;
        note(1047, sharp, 0.55, 'triangle', 0.09);
        note(1568, sharp + 0.07, 0.45, 'square', 0.018);
    }

    // The title-to-Home sound: a confirm tick as Start is chosen, then a patter
    // of soft notes while the blocks swap, climbing as Home fills in. All
    // scheduled up front on the audio clock, so a busy frame can't knock it out
    // of time.
    var SWAP_SCALE = [392, 440, 523, 587, 659, 784, 880, 1047, 1175];

    function swapSound(ms) {
        if (!audio || audio.state !== 'running') return;
        var bus = audio.createGain();
        bus.connect(audio.destination);
        var now = audio.currentTime + 0.01, end = ms / 1000;
        buttonSound(now, 247, 330, 0.06, bus);
        buttonSound(now + 0.07, 330, 392, 0.05, bus);
        for (var t = 0.1; t < end - 0.06; t += 0.066) {
            var climb = Math.floor((t / end) * 6);
            var f = SWAP_SCALE[climb + Math.floor(Math.random() * 3)];
            note(f, now + t, 0.045, 'triangle', 0.035, bus);
        }
    }

    // A soft, low tick: a square wave with its top cut off, so it reads as a
    // retro button press without the bright edge. Moving the selection plays
    // one, and choosing Start plays two going up.
    function buttonSound(at, from, to, vol, bus) {
        var tone = audio.createOscillator();
        var soft = audio.createBiquadFilter();
        var level = audio.createGain();
        tone.type = 'square';
        tone.frequency.setValueAtTime(from, at);
        tone.frequency.setValueAtTime(to, at + 0.025);
        soft.type = 'lowpass';
        soft.frequency.value = 900;
        level.gain.setValueAtTime(vol, at);
        level.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
        tone.connect(soft);
        soft.connect(level);
        level.connect(bus || audio.destination);
        tone.start(at);
        tone.stop(at + 0.09);
    }

    function blip() {
        if (!audio) return;
        audio.resume().then(function () { buttonSound(audio.currentTime, 196, 247, 0.06); }, function () {});
    }

    // ---- Menu ----------------------------------------------------------------
    var current = menu, sel = 0;

    function rows() { return Array.prototype.slice.call(current.querySelectorAll('.title-item')); }

    function select(i) {
        var list = rows();
        sel = (i + list.length) % list.length;
        list.forEach(function (el, n) { el.classList.toggle('is-sel', n === sel); });
        hint.textContent = list[sel].dataset.hint;
    }

    function openList(list, index) {
        current.classList.add('is-away');
        list.classList.remove('is-away');
        current = list;
        select(index);
    }

    function confirm(el) {
        if (el.hasAttribute('data-start')) leave();
        else if (el.hasAttribute('data-levels')) openList(levels, 0);
        else if (el.hasAttribute('data-back')) openList(menu, 1);
        else if (el.hasAttribute('data-case')) goTo(el.getAttribute('href'));
        else el.click();
    }

    select(0);

    // ---- Input ---------------------------------------------------------------
    // Captured so arrows can't turn the carousel underneath. Browser shortcuts
    // and Tab are left alone.
    function onKey(e) {
        if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab' || e.key === 'Shift') return;
        e.preventDefault();
        e.stopPropagation();
        unlockSound();
        if (!started && !landed) { start(); return; }
        if (!landed) { if (!e.repeat) land(true); return; }
        if (e.repeat && (e.key === 'Enter' || e.key === ' ')) return;
        if (e.key === 'ArrowDown') { select(sel + 1); blip(); }
        else if (e.key === 'ArrowUp') { select(sel - 1); blip(); }
        else if (e.key === 'Enter' || e.key === ' ') confirm(rows()[sel]);
        else if (e.key === 'Escape' && current === levels) openList(menu, 1);
    }

    // A mouse press counts as permission for sound, but a touch only does once the
    // finger lifts, so touch starts on pointerup
    function onPointer(e) {
        unlockSound();
        if (!started && !landed) {
            if (e.pointerType !== 'touch') start();
            return;
        }
        if (!landed) land(true);
    }

    function onPointerUp(e) {
        if (started || landed || e.pointerType !== 'touch') return;
        unlockSound();
        start();
    }

    function onOver(e) {
        var el = e.target.closest('.title-item');
        var i = el ? rows().indexOf(el) : -1;
        if (i >= 0 && i !== sel) { select(i); blip(); }
    }

    // New-tab links keep their normal click, so popup rules never get in the way
    function onClick(e) {
        var el = e.target.closest('.title-item');
        if (!el || el.target === '_blank') return;
        e.preventDefault();
        confirm(el);
    }

    function onScroll(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!started && !landed) { start(); return; } // a scroll can't unlock sound, so this one plays silent
        if (!landed) land(true);
    }

    function removeInput() {
        document.removeEventListener('keydown', onKey, true);
        layer.removeEventListener('pointerdown', onPointer);
        layer.removeEventListener('pointerup', onPointerUp);
        layer.removeEventListener('pointerover', onOver);
        layer.removeEventListener('focusin', onOver);
        layer.removeEventListener('click', onClick);
        layer.removeEventListener('wheel', onScroll);
        layer.removeEventListener('touchmove', onScroll);
    }

    document.addEventListener('keydown', onKey, true);
    layer.addEventListener('pointerdown', onPointer);
    layer.addEventListener('pointerup', onPointerUp);
    layer.addEventListener('pointerover', onOver);
    layer.addEventListener('focusin', onOver);
    layer.addEventListener('click', onClick);
    layer.addEventListener('wheel', onScroll, { passive: false });
    layer.addEventListener('touchmove', onScroll, { passive: false });

    // ---- Go ------------------------------------------------------------------
    if (reduce) {
        land(true);
        return;
    }

    // The blocks have to resolve onto the real letters, so the font comes first. A
    // slow font network doesn't hold the page up for long.
    var fontReady = document.fonts && document.fonts.load ? document.fonts.load("120px 'Jersey 25'") : Promise.resolve();
    var waited = new Promise(function (done) { setTimeout(done, 1200); });
    Promise.race([fontReady, waited]).then(play, play);
})();
