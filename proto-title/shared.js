// Title screen prototypes: shared helpers. Not linked from the site.
(function () {
    'use strict';

    var search = new URLSearchParams(location.search);
    var thumb = search.has('thumb');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var touch = matchMedia('(hover: none)').matches;

    if (thumb) document.documentElement.classList.add('is-thumb');

    var HOME = '../index.html';

    // The real case studies, in the home page's order
    var WORK = [
        { id: 'nocta', name: 'Nocta', year: '2026', status: 'Shipped', href: '../nocta.html', color: '#f0a47a', blurb: 'An AI companion for CPAP users.',
          poster: '../assets/nocta/v4/poster-sky.jpg', video: '../assets/nocta/v4/flow-sky.mp4', tall: true },
        { id: 'skillcat', name: 'SkillCat', year: '2026', status: 'In development', href: '../skillcat.html', color: '#f05523', blurb: 'Mobile learning for the skilled trades.',
          poster: '../assets/skillcat/B2B/poster-hero.jpg', video: '../assets/skillcat/B2B/hero.mp4' },
        { id: 'scriptchain', name: 'ScriptChain Health', short: 'ScriptChain', year: '2025', status: 'Handoff', href: '../scriptchain.html', color: '#48a9a6', blurb: 'Doctor-signed food and exercise plans.',
          poster: '../assets/scriptchain/poster-scriptchain-website.jpg', video: '../assets/scriptchain/scriptchain-website.mp4' },
        { id: 'mirror', name: 'Robinhood Mirror', short: 'Mirror', year: '2024', status: 'Concept', href: '../robinhood.html', color: '#c3f53c', blurb: 'Mirror trading for young investors.',
          poster: '../assets/robinhood-mockup.png' },
        { id: 'reveal', name: 'Reveal', year: '2024', status: 'Concept', href: '../reveal.html', color: '#5aa9ff', blurb: 'AR that uncovers hostile architecture.',
          poster: '../assets/reveal-large.png', video: '../assets/Reveal-animation.mp4' }
    ];

    // ---- Leaving -----------------------------------------------------------
    // The title stands in for the keyboard opening unless a version asks for it.
    function go(href, opts) {
        if (thumb) return;
        if (!(opts && opts.intro)) {
            try { sessionStorage.setItem('jc_intro_seen', '1'); } catch (e) {}
        }
        location.href = href;
    }

    function wait(ms) {
        return new Promise(function (done) { setTimeout(done, reduce ? Math.min(ms, 120) : ms); });
    }

    // Back from the home page should land on a fresh title
    addEventListener('pageshow', function (e) { if (e.persisted) location.reload(); });

    // ---- Sound -------------------------------------------------------------
    // Only ever called from a key press or click, so it never autoplays.
    var clip = null;
    function click(volume) {
        if (thumb) return;
        try {
            clip = clip || new Audio('../assets/sounds/clicky.mp3');
            var a = clip.cloneNode();
            a.volume = volume == null ? 0.35 : volume;
            var p = a.play();
            if (p && p.catch) p.catch(function () {});
        } catch (e) {}
    }

    // ---- Start input -------------------------------------------------------
    // Any key, click or tap. Links keep their own behaviour, and browser
    // shortcuts and Tab are left alone so the page stays keyboard navigable.
    function onStart(fn) {
        if (thumb) return;
        var fired = false;
        function fire() {
            if (fired) return;
            fired = true;
            click();
            fn();
        }
        addEventListener('keydown', function (e) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Escape') return;
            var el = document.activeElement;
            if (e.key === 'Enter' && el && el.matches('a')) return;
            e.preventDefault();
            fire();
        });
        addEventListener('pointerdown', function (e) {
            if (e.target.closest('a, button')) return;
            fire();
        });
        return fire;
    }

    // ---- Canvas ------------------------------------------------------------
    // Sizes a canvas to its box at a whole-number pixel scale, so a logical
    // pixel is always a clean square.
    function fit(canvas, unit) {
        var box = canvas.parentElement.getBoundingClientRect();
        var scale = Math.max(2, Math.floor(Math.min(box.width / unit.w, box.height / unit.h)));
        var w = Math.ceil(box.width / scale);
        var h = Math.ceil(box.height / scale);
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = (w * scale) + 'px';
        canvas.style.height = (h * scale) + 'px';
        return { w: w, h: h, scale: scale };
    }

    // Runs at a low, fixed frame rate: it reads as sprite animation and costs
    // almost nothing. Stops while the tab is hidden.
    function ticker(fps, fn) {
        var last = 0, frame = 0, step = 1000 / fps;
        function loop(now) {
            requestAnimationFrame(loop);
            if (document.hidden || now - last < step) return;
            last = now;
            fn(frame++, now);
        }
        requestAnimationFrame(loop);
    }

    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    function hex(c) {
        var n = parseInt(c.slice(1), 16);
        return [n >> 16 & 255, n >> 8 & 255, n & 255];
    }

    // Vertical sky bands blended with ordered dither, never a smooth gradient
    function ditherSky(w, h, stops) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var x2 = c.getContext('2d');
        var img = x2.createImageData(w, h);
        var cols = stops.map(hex);
        for (var y = 0; y < h; y++) {
            var f = (y / Math.max(1, h - 1)) * (cols.length - 1);
            var i = Math.min(cols.length - 2, Math.floor(f));
            var t = f - i;
            for (var x = 0; x < w; x++) {
                var pick = t > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? cols[i + 1] : cols[i];
                var o = (y * w + x) * 4;
                img.data[o] = pick[0];
                img.data[o + 1] = pick[1];
                img.data[o + 2] = pick[2];
                img.data[o + 3] = 255;
            }
        }
        x2.putImageData(img, 0, 0);
        return c;
    }

    function bayer(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }

    // A sprite on its own small canvas
    function sprite(rows, scale) {
        var c = document.createElement('canvas');
        c.width = rows[0].length;
        c.height = rows.length;
        c.className = 'pixel';
        c.style.width = (c.width * scale) + 'px';
        c.style.height = (c.height * scale) + 'px';
        PX.draw(c.getContext('2d'), rows, 0, 0);
        return c;
    }

    window.Title = {
        HOME: HOME, WORK: WORK, thumb: thumb, reduce: reduce, touch: touch,
        go: go, wait: wait, click: click, onStart: onStart,
        fit: fit, ticker: ticker, ditherSky: ditherSky, bayer: bayer, sprite: sprite
    };
})();
