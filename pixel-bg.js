// ============================================
// Animated pixel backgrounds.
//
// Each scene paints into a low-resolution buffer that the browser scales up
// with hard pixels, at a few frames a second so it reads as sprite animation
// and stays cheap. Pages show Stars; the other scenes can be previewed with
// ?bg=<id>.
//
// Only pages with #background-grid get this, so case studies keep their own
// backgrounds. Reduced motion paints one still frame. Painting stops in hidden
// tabs and while the page is scrolling, so it never competes with the scroll.
// ?bg=<id> previews a scene on the page background.
// ============================================
(function () {
    'use strict';

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

    function rgb(hex) {
        var n = parseInt(hex.slice(1), 16);
        return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0;
    }

    function rng(seed) {
        return function () {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };
    }

    // ---- Drawing surface -----------------------------------------------------
    function Surface(w, h) {
        this.w = w; this.h = h;
        this.buf = new Uint32Array(w * h);
    }
    Surface.prototype.fill = function (c) { this.buf.fill(c); };
    Surface.prototype.set = function (x, y, c) {
        x |= 0; y |= 0;
        if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.buf[y * this.w + x] = c;
    };
    Surface.prototype.rect = function (x, y, w, h, c) {
        for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c);
    };
    // Ordered dither: density runs from 0 (none) to 1 (solid)
    Surface.prototype.on = function (x, y, density) {
        return density * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5;
    };
    // Vertical sky ramp between colours, dithered across each band
    Surface.prototype.sky = function (cols, height) {
        var n = cols.length - 1, H = height || this.h;
        for (var y = 0; y < H; y++) {
            var p = y / H * n, i = Math.min(n - 1, Math.floor(p)), f = p - i;
            for (var x = 0; x < this.w; x++) {
                this.buf[y * this.w + x] = this.on(x, y, f) ? cols[i + 1] : cols[i];
            }
        }
    };

    // ---- Scenes --------------------------------------------------------------
    var SCENES = {};

    SCENES.stars = {
        name: 'Stars',
        fps: 5,
        init: function (s) {
            var r = rng(7), n = Math.round(s.w * s.h / 520), a = [];
            for (var i = 0; i < n; i++) {
                a.push({ x: r() * s.w, y: r() * s.h, z: i % 3, ph: Math.floor(r() * 90) });
            }
            return { stars: a, bg: rgb('#161514'), glow: rgb('#16314f'), glow2: rgb('#1e4a7c'),
                     cols: [rgb('#3c3e4e'), rgb('#65687c'), rgb('#c9ccdc')], shoot: null, r: r };
        },
        frame: function (s, st, t) {
            s.fill(st.bg);
            var speed = [0.05, 0.11, 0.2];
            st.stars.forEach(function (p) {
                if ((t + p.ph) % 90 < 4) return; // twinkle
                var x = ((p.x - t * speed[p.z]) % s.w + s.w) % s.w;
                s.set(x, p.y, st.cols[p.z]);
                if (p.z === 2 && p.ph % 3 === 0 && (t + p.ph) % 90 < 24) { s.set(x + 1, p.y, st.cols[1]); s.set(x - 1, p.y, st.cols[1]); s.set(x, p.y + 1, st.cols[1]); s.set(x, p.y - 1, st.cols[1]); }
            });

            // A shooting star now and then
            if (!st.shoot && st.r() < 0.012) st.shoot = { x: st.r() * s.w * 0.7, y: st.r() * s.h * 0.4, l: 0 };
            if (st.shoot) {
                var q = st.shoot; q.l++;
                for (var k = 0; k < 7; k++) s.set(q.x + q.l * 4 - k * 2, q.y + q.l * 2 - k, k < 2 ? st.cols[2] : st.cols[1]);
                if (q.l > 14) st.shoot = null;
            }

            // Dithered light along the bottom. It rolls slowly, so it's cached
            // and only redrawn every few frames.
            var R = Math.round(s.h * 0.26), top = s.h - R;
            if (!st.band || t % 3 === 0) {
                st.band = st.band || [];
                st.band.length = 0;
                for (var x = 0; x < s.w; x++) {
                    var wave = Math.sin(x * 0.055 + t * 0.2) * 0.11 + Math.sin(x * 0.023 - t * 0.13) * 0.08;
                    for (var y = top; y < s.h; y++) {
                        var d = Math.pow((y - top) / R, 1.5) * 0.74 + wave * ((y - top) / R + 0.25);
                        if (s.on(x, y, d)) st.band.push(y * s.w + x, d > 0.56 ? st.glow2 : st.glow);
                    }
                }
            }
            for (var i = 0; i < st.band.length; i += 2) s.buf[st.band[i]] = st.band[i + 1];
        }
    };

    SCENES.city = {
        name: 'City',
        fps: 3,
        init: function (s) {
            var r = rng(21), back = new Surface(s.w, s.h), wins = [], blinks = [];
            back.sky(['#100e22', '#14112a', '#1a1434', '#241a3e', '#322048'].map(rgb));
            for (var i = 0; i < s.w * s.h / 700; i++) back.set(r() * s.w, r() * s.h * 0.55, rgb(r() > 0.7 ? '#c9cfe6' : '#6d7196'));

            // Moon
            var mx = Math.round(s.w * 0.78), my = Math.round(s.h * 0.2), mr = Math.max(9, Math.round(s.h * 0.07));
            for (var y = -mr; y <= mr; y++) for (var x = -mr; x <= mr; x++) {
                if (x * x + y * y <= mr * mr) back.set(mx + x, my + y, rgb(((x + 3) * (x + 3) + (y - 2) * (y - 2)) % 53 < 2 ? '#8e92a8' : '#aeb2c6'));
            }

            // Two rows of buildings. Each building is sized to fit its own window
            // grid, so every window sits in a tidy column and row inside its walls.
            var PITCH_X = 4, PITCH_Y = 5, WIN = 2, MARGIN = 2;
            var rows = [
                { tall: 0.5, wall: '#1b173a', edge: '#2a2452', off: '#26204c', lit: '#8a7046', on: 0.22 },
                { tall: 0.32, wall: '#100e24', edge: '#221d42', off: '#1e1a3a', lit: '#d9ab5c', on: 0.34 }
            ];

            rows.forEach(function (L, li) {
                L.boxes = [];
                L.wins = [];
                L.blinks = [];
                for (var bx = -2; bx < s.w;) {
                    var cols = 2 + Math.floor(r() * 6);
                    var bw = (cols - 1) * PITCH_X + WIN + MARGIN * 2;
                    var floors = Math.max(2, Math.round(s.h * (0.1 + r() * L.tall) / PITCH_Y));
                    var bh = (floors - 1) * PITCH_Y + WIN + MARGIN + 3;
                    var by = s.h - bh;
                    var busy = L.on * (0.6 + r() * 0.8);

                    back.rect(bx, by, bw, bh, rgb(L.wall));
                    back.rect(bx, by, bw, 1, rgb(L.edge));
                    L.boxes.push({ x: bx, y: by, w: bw, h: bh });

                    if (r() > 0.68) {
                        back.rect(bx + (bw >> 1), by - 8, 1, 8, rgb(L.wall));
                        L.blinks.push({ x: bx + (bw >> 1), y: by - 9, ph: Math.floor(r() * 24) });
                    }

                    for (var f = 0; f < floors; f++) {
                        for (var c = 0; c < cols; c++) {
                            L.wins.push({ x: bx + MARGIN + c * PITCH_X, y: by + 3 + f * PITCH_Y, on: r() < busy, c: rgb(L.lit), dim: rgb(L.off) });
                        }
                    }
                    bx += bw + 1;
                }
            });

            // Whatever a front building stands in front of stays hidden behind it
            function behindFront(p, w, h) {
                return rows[1].boxes.some(function (b) {
                    return p.x < b.x + b.w && p.x + w > b.x && p.y < b.y + b.h && p.y + h > b.y;
                });
            }
            rows[0].wins = rows[0].wins.filter(function (w) { return !behindFront(w, WIN, WIN); });
            rows[0].blinks = rows[0].blinks.filter(function (b) { return !behindFront(b, 1, 1); });
            wins = rows[0].wins.concat(rows[1].wins);
            blinks = rows[0].blinks.concat(rows[1].blinks);

            return { back: back.buf, wins: wins, blinks: blinks, r: r, plane: -40, red: rgb('#ff5a4d'), white: rgb('#f3f3f1') };
        },
        frame: function (s, st, t) {
            s.buf.set(st.back);
            if (t % 2 === 0) { var w = st.wins[Math.floor(st.r() * st.wins.length)]; if (w) w.on = !w.on; }
            st.wins.forEach(function (w) { s.rect(w.x, w.y, 2, 2, w.on ? w.c : w.dim); });
            st.blinks.forEach(function (b) { if ((t + b.ph) % 24 < 6) s.set(b.x, b.y, st.red); });
            st.plane += 0.5;
            if (st.plane > s.w + 40) st.plane = -40;
            var py = Math.round(s.h * 0.13);
            s.rect(st.plane, py, 5, 1, st.white);
            if (t % 10 < 3) s.set(st.plane + 6, py, st.red);
        }
    };

    SCENES.rain = {
        name: 'Rain',
        fps: 8,
        init: function (s) {
            var r = rng(5), back = new Surface(s.w, s.h), drops = [], n = Math.round(s.w * s.h / 340);
            back.sky(['#0f131f', '#121827', '#172033', '#1d2a42'].map(rgb));
            for (var bx = 0; bx < s.w;) {
                var bw = 14 + Math.floor(r() * 28), bh = Math.round(s.h * (0.16 + r() * 0.3));
                back.rect(bx, s.h - bh, bw, bh, rgb('#141b2c'));
                bx += bw + 1 + Math.floor(r() * 3);
            }
            for (var i = 0; i < n; i++) drops.push({ x: r() * s.w, y: r() * s.h, l: 3 + Math.floor(r() * 4), v: 3 + r() * 3, c: i % 3 });
            return { back: back.buf, drops: drops, r: r, rip: [],
                     cols: [rgb('#222e45'), rgb('#31455f'), rgb('#4f6d94')], water: rgb('#22314c') };
        },
        frame: function (s, st) {
            s.buf.set(st.back);
            st.drops.forEach(function (d) {
                d.y += d.v; d.x -= d.v * 0.3;
                if (d.y > s.h) {
                    if (st.rip.length < 40) st.rip.push({ x: d.x, y: s.h - 3 - Math.floor(st.r() * 12), a: 0 });
                    d.y = -d.l; d.x = st.r() * (s.w + 30);
                }
                if (d.x < 0) d.x += s.w;
                for (var k = 0; k < d.l; k++) s.set(d.x + k * 0.3, d.y - k, st.cols[d.c]);
            });
            st.rip = st.rip.filter(function (p) {
                p.a++;
                s.rect(p.x - p.a * 2, p.y, 2, 1, st.cols[1]);
                s.rect(p.x + p.a * 2, p.y, 2, 1, st.cols[1]);
                return p.a < 5;
            });
        }
    };

    SCENES.keys = {
        name: 'Keycaps',
        fps: 6,
        init: function (s) {
            var r = rng(13), caps = [], n = Math.round(s.w * s.h / 1300);
            var kinds = [['#2d2c29', '#42413d', '#141311'], ['#3a3936', '#54534e', '#141311'], ['#3a3936', '#54534e', '#141311'],
                         ['#f3f3f1', '#ffffff', '#8d8c88'], ['#1180f9', '#66d2ff', '#0a4a9a']].map(function (k) { return k.map(rgb); });
            for (var i = 0; i < n; i++) {
                var z = i % 3;
                caps.push({ x: r() * s.w, y: r() * s.h, z: z, size: [6, 9, 13][z], v: [0.22, 0.4, 0.66][z], ph: r() * 6.28,
                            k: kinds[r() < 0.14 ? 3 + Math.floor(r() * 2) : Math.floor(r() * 3)] });
            }
            caps.sort(function (a, b) { return a.z - b.z; });
            return { caps: caps, bg: rgb('#161514') };
        },
        frame: function (s, st, t) {
            s.fill(st.bg);
            st.caps.forEach(function (c) {
                c.y += c.v;
                if (c.y > s.h + 16) c.y = -16;
                var x = Math.round(c.x + Math.sin(c.ph + t * 0.05) * 3), y = Math.round(c.y), n = c.size;
                s.rect(x + 1, y + 2, n - 2, n, c.k[2]);
                s.rect(x, y + 1, n, n - 1, c.k[2]);
                s.rect(x + 1, y, n - 2, n - 2, c.k[0]);
                s.rect(x + 2, y, n - 4, 1, c.k[1]);
            });
        }
    };

    SCENES.aurora = {
        name: 'Aurora',
        fps: 5,
        init: function (s) {
            var r = rng(31), back = new Surface(s.w, s.h);
            back.sky(['#0a0e1e', '#0e1428', '#121a32', '#16213a'].map(rgb));
            for (var i = 0; i < s.w * s.h / 420; i++) back.set(r() * s.w, r() * s.h * 0.8, rgb(r() > 0.75 ? '#d8dcec' : '#5f6688'));
            var ridge = [], y = s.h * 0.86;
            for (var x = 0; x < s.w; x++) {
                y += (r() - 0.5) * 3 + (s.h * 0.86 - y) * 0.03;
                ridge[x] = Math.round(y);
                back.rect(x, ridge[x], 1, s.h - ridge[x], rgb('#0b0f1c'));
            }
            return { back: back.buf, ridge: ridge,
                     c1: rgb('#156256'), c2: rgb('#1d4c74'), c3: rgb('#463478'), hi: rgb('#23977a') };
        },
        frame: function (s, st, t) {
            s.buf.set(st.back);
            var bands = [[0.42, 0.055, 0.09, st.c1, 0.3], [0.5, 0.041, -0.07, st.c2, 0.26], [0.36, 0.07, 0.05, st.c3, 0.22]];
            bands.forEach(function (b, bi) {
                for (var x = 0; x < s.w; x++) {
                    var top = s.h * b[0] + Math.sin(x * b[1] + t * b[2]) * s.h * 0.07 + Math.sin(x * b[1] * 0.37 - t * b[2] * 0.6) * s.h * 0.05;
                    var len = s.h * b[4] * (0.65 + 0.35 * Math.sin(x * 0.03 + t * 0.06 + bi));
                    var yi = Math.max(0, Math.round(top)), end = Math.min(st.ridge[x], Math.round(top + len));
                    for (var y = yi; y < end; y++) {
                        var f = 1 - (y - top) / len;
                        var d = f * f * 0.58;
                        if (s.on(x, y, d)) s.buf[y * s.w + x] = (bi === 0 && f > 0.82) ? st.hi : b[3];
                    }
                }
            });
        }
    };

    SCENES.off = {
        name: 'Off',
        fps: 0,
        init: function () { return { bg: rgb('#161514') }; },
        frame: function (s, st) { s.fill(st.bg); }
    };


    var host = document.getElementById('background-grid');
    if (!host) return;

    // ---- Stage ---------------------------------------------------------------
    var canvas = document.createElement('canvas');
    canvas.id = 'pixelBg';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    document.documentElement.classList.add('has-pixel-bg');

    var ctx = canvas.getContext('2d', { alpha: false });
    var surface, image, state, tick = 0;

    function chosen() {
        var q = /[?&]bg=([a-z]+)/.exec(location.search);
        return q && SCENES[q[1]] ? q[1] : 'stars';
    }

    var current = chosen();

    function size() {
        var k = innerWidth < 760 ? 3 : 4;
        var w = Math.ceil(innerWidth / k), h = Math.ceil(innerHeight / k);
        canvas.width = w; canvas.height = h;
        surface = new Surface(w, h);
        image = ctx.createImageData(w, h);
        state = SCENES[current].init(surface);
    }

    function draw() {
        SCENES[current].frame(surface, state, tick);
        new Uint32Array(image.data.buffer).set(surface.buf);
        ctx.putImageData(image, 0, 0);
    }

    size();
    draw();

    // Paint on a timer set by the scene, and sit out while the page is moving
    var scrolling = false, scrollTimer;
    function markScroll() {
        scrolling = true;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () { scrolling = false; }, 200);
    }
    addEventListener('scroll', markScroll, { passive: true });
    addEventListener('wheel', markScroll, { passive: true });

    function loop() {
        var fps = SCENES[current].fps;
        if (!document.hidden && !scrolling && fps) {
            tick++;
            draw();
        }
        setTimeout(loop, 1000 / (fps || 2));
    }
    if (!reduce) setTimeout(loop, 200);

    var resizeTimer;
    addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { size(); draw(); }, 150);
    });
})();
