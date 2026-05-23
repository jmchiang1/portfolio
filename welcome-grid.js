// ============================================
// Welcome — interactive mesh grid (welcome page only)
//
// The background line grid is normally a CSS-painted background-image, so
// there are no elements to animate. Here we redraw that same grid as a mesh
// of points on a <canvas> and "pull" the points toward the cursor each frame
// — the lines stretch toward the mouse like a rubber sheet, then spring back
// when it leaves.
//
// GSAP's role: gsap.ticker drives the render loop (one shared RAF with the
// rest of the page's GSAP work). The per-point motion is a cheap lerp toward
// a target position, which gives the springy settle without a tween per point.
//
// Falls back to the static CSS #background-grid when GSAP is missing or the
// visitor prefers reduced motion.
// ============================================
(function () {
    'use strict';

    var canvas = document.getElementById('welcomeGrid');
    if (!canvas) return;

    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof gsap === 'undefined') return; // keep the static CSS grid

    var ctx     = canvas.getContext('2d');
    var cssGrid = document.getElementById('background-grid');

    // ---- tunables ----
    var SPACING  = 24;     // cell size — matches the CSS grid
    var RADIUS   = 170;    // cursor influence radius (px)
    var STRENGTH = 0.5;    // how far points are pulled toward the cursor (0–1)
    var EASE     = 0.12;   // per-frame approach to target — the spring feel
    var LINE     = 'rgba(255, 255, 255, 0.07)';            // resting line color
    var HOT      = 'rgba(80, 160, 240, 0.32)';             // accent glow at cursor

    var w, h, dpr, cols, rows, pts;
    var mouse   = { x: -9999, y: -9999, active: false };
    var running = false;

    function idx(r, c) { return r * (cols + 1) + c; }

    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cols = Math.ceil(w / SPACING);
        rows = Math.ceil(h / SPACING);
        // Center the mesh so lines aren't biased toward a corner.
        var offX = (w - cols * SPACING) / 2;
        var offY = (h - rows * SPACING) / 2;

        pts = [];
        for (var r = 0; r <= rows; r++) {
            for (var c = 0; c <= cols; c++) {
                var ox = offX + c * SPACING;
                var oy = offY + r * SPACING;
                pts.push({ ox: ox, oy: oy, x: ox, y: oy });
            }
        }
    }

    function render() {
        var moved = false;
        var R2 = RADIUS * RADIUS;

        for (var i = 0; i < pts.length; i++) {
            var p = pts[i];
            var tx = p.ox, ty = p.oy;

            if (mouse.active) {
                var dx = mouse.x - p.ox;
                var dy = mouse.y - p.oy;
                var d2 = dx * dx + dy * dy;
                if (d2 < R2) {
                    var f = 1 - Math.sqrt(d2) / RADIUS; // 1 at cursor → 0 at edge
                    f = f * f;                          // ease the falloff
                    tx = p.ox + dx * STRENGTH * f;      // pull toward the cursor
                    ty = p.oy + dy * STRENGTH * f;
                }
            }

            p.x += (tx - p.x) * EASE;
            p.y += (ty - p.y) * EASE;
            if (Math.abs(tx - p.x) > 0.05 || Math.abs(ty - p.y) > 0.05) moved = true;
        }

        // Once the cursor has left and the mesh has settled, snap to rest,
        // draw one clean frame, and stop the loop so we idle at zero cost.
        if (!mouse.active && !moved) {
            for (var j = 0; j < pts.length; j++) { pts[j].x = pts[j].ox; pts[j].y = pts[j].oy; }
            draw();
            stop();
            return;
        }

        draw();
    }

    // Trace every grid line into the current path (reused by the base and
    // glow passes so we don't duplicate the loop).
    function tracePath() {
        ctx.beginPath();
        var r, c, p;
        for (r = 0; r <= rows; r++) {                 // horizontal lines
            p = pts[idx(r, 0)];
            ctx.moveTo(p.x, p.y);
            for (c = 1; c <= cols; c++) { p = pts[idx(r, c)]; ctx.lineTo(p.x, p.y); }
        }
        for (c = 0; c <= cols; c++) {                 // vertical lines
            p = pts[idx(0, c)];
            ctx.moveTo(p.x, p.y);
            for (r = 1; r <= rows; r++) { p = pts[idx(r, c)]; ctx.lineTo(p.x, p.y); }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        // Base grid.
        ctx.lineWidth   = 1;
        ctx.strokeStyle = LINE;
        tracePath();
        ctx.stroke();

        // Additive glow that brightens the lines being pulled in — a radial
        // gradient stroke under 'lighter' so only the near-cursor lines light
        // up (and fade to nothing at the influence radius).
        if (mouse.active) {
            var hot = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, RADIUS);
            hot.addColorStop(0, HOT);
            hot.addColorStop(1, 'rgba(80, 160, 240, 0)');
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth   = 1.2;
            ctx.strokeStyle = hot;
            tracePath();
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = 1;
        }

        // Edge fade — mirror the CSS radial mask so the grid melts into the bg.
        ctx.globalCompositeOperation = 'destination-in';
        var cx = w / 2, cy = h / 2;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
        g.addColorStop(0,   'rgba(0,0,0,1)');
        g.addColorStop(0.6, 'rgba(0,0,0,1)');
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
    }

    // ---- loop control ----
    function start() {
        if (running) return;
        running = true;
        gsap.ticker.add(render);
    }
    function stop() {
        if (!running) return;
        running = false;
        gsap.ticker.remove(render);
    }

    // ---- events ----
    window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
        start();
    }, { passive: true });

    // Spring back when the cursor leaves the window or it loses focus.
    document.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget && !e.toElement) { mouse.active = false; start(); }
    });
    window.addEventListener('blur', function () { mouse.active = false; start(); });

    // Don't burn frames in a background tab.
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else if (mouse.active) start();
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { build(); draw(); if (mouse.active) start(); }, 150);
    });

    // ---- init ----
    function init() {
        build();
        draw();                                    // paint the resting grid
        if (cssGrid) cssGrid.style.display = 'none'; // hand off from the CSS grid
        canvas.classList.add('is-live');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
