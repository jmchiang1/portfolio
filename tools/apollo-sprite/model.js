// Apollo, the site mascot: a cartoon English cream golden retriever.
// Every frame is drawn from the shapes below (polygons and jointed legs,
// rasterised, shaded and outlined). Run tools/apollo-sprite/build.js after
// editing to rebuild assets/mascot/apollo.png and the frame map in
// mascot-chat.js.
var W = 50, H = 30, OX = 0;

var PAL = {
    o: '#3a2e24', w: '#fffdf8', c: '#f6efe1', s: '#e5d7bd', d: '#cbb791',
    a: '#ecd8b2', A: '#d2b98b', e: '#1a130e', m: '#6b3434', p: '#e7848f', h: '#f6b6bd',
    b: '#d7ea4a', B: '#a9bd2c', q: '#9a7458', Q: '#73533d', r: '#d9b896', k: '#1180f9', g: '#ffd25a'
};

// ---- geometry --------------------------------------------------------------
function inPoly(px, py, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
function segDist(px, py, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var t = ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1);
    t = Math.max(0, Math.min(1, t));
    var x = a[0] + t * dx - px, y = a[1] + t * dy - py;
    return [Math.sqrt(x * x + y * y), t];
}
function mask() { var m = []; for (var y = 0; y < H; y++) m.push(new Array(W).fill(false)); return m; }
function polyMask(pts) {
    var m = mask();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) m[y][x] = inPoly(x + 0.5 - OX, y + 0.5, pts);
    return m;
}
// chain: [[x, y, r], ...] — a limb of tapered capsules
function chainMask(ch, m) {
    m = m || mask();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        for (var i = 0; i < ch.length - 1; i++) {
            var dr = segDist(x + 0.5 - OX, y + 0.5, ch[i], ch[i + 1]);
            var r = ch[i][2] + (ch[i + 1][2] - ch[i][2]) * dr[1];
            if (dr[0] <= r) { m[y][x] = true; break; }
        }
    }
    return m;
}
function addPoly(m, pts) { var p = polyMask(pts); for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (p[y][x]) m[y][x] = true; return m; }
function move(pts, dx, dy) { return pts.map(function (p) { return [p[0] + dx, p[1] + dy].concat(p.slice(2)); }); }
function rot(pts, cx, cy, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return pts.map(function (p) { var x = p[0] - cx, y = p[1] - cy; return [cx + x * c - y * s, cy + x * s + y * c]; });
}

// Colour a part: light along its top edge, shade along its bottom edge and
// below `shadeY`; far parts are pushed a step darker.
function paint(g, m, o) {
    o = o || {};
    var base = o.base || 'c', top = o.top || 'w', low = o.low || 's', deep = o.deep || 'd';
    if (o.far) { base = 's'; top = 's'; low = 'd'; deep = 'd'; }
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        if (!m[y][x]) continue;
        var up = y > 0 && m[y - 1][x], dn = y < H - 1 && m[y + 1][x];
        var ch = base;
        if (o.shadeY != null && y >= o.shadeY) ch = low;
        if (!up && !o.noTop) ch = top;
        if (!dn) ch = (o.fringe && y >= o.fringe) ? deep : low;
        if (o.leftShade && x > 0 && !m[y][x - 1] && ch === base) ch = low;
        g[y][x] = ch;
    }
}
// Fill one-pixel pockets (3+ filled neighbours) so they don't outline as holes
function fillPockets(g) {
    for (var pass = 0; pass < 2; pass++) for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) {
        if (g[y][x] !== '.') continue;
        var n = [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]].filter(function (c) { return c !== '.'; });
        if (n.length >= 3) g[y][x] = 's';
    }
}
function outline(g) {
    fillPockets(g);
    var out = g.map(function (r) { return r.slice(); });
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        if (g[y][x] !== '.') continue;
        var n = (y > 0 && g[y - 1][x] !== '.') || (y < H - 1 && g[y + 1][x] !== '.') ||
                (x > 0 && g[y][x - 1] !== '.') || (x < W - 1 && g[y][x + 1] !== '.');
        if (n) out[y][x] = 'o';
    }
    return out;
}
function blank() { var g = []; for (var y = 0; y < H; y++) g.push(new Array(W).fill('.')); return g; }
function put(g, pts, ch) { pts.forEach(function (p) { if (p[1] >= 0 && p[1] < H && p[0] >= 0 && p[0] < W) g[p[1]][p[0]] = ch; }); }


// ---- body parts (cartoon) ----------------------------------------------------
var HEAD = [[31.5, 8], [31.8, 5], [33.2, 2.6], [35.4, 0.9], [38.2, 0.2], [41, 0.4], [43.2, 1.6], [44.6, 3.4], [45.2, 5.0],
    [46.8, 5.4], [48.2, 6.2], [48.7, 7.6], [48.4, 9.2], [47.2, 10.2], [45.4, 10.8],
    [44, 12.6], [41.6, 14], [38.4, 14.4], [35.2, 13.8], [32.8, 12.2], [31.6, 10.4]];
var EAR = [[32.8, 3.6], [36.4, 3.2], [38, 5.6], [38.3, 10], [37.2, 14.2], [35, 15], [33, 13], [32.2, 8]];
function torsoPts(hx, hy) {
    return [[33 + hx * 0.7, 11 + hy * 0.7], [29, 13.2 + hy * 0.2], [23, 13.6], [17.5, 13.8], [15, 14.8], [13.6, 17], [13.6, 20], [14.8, 22.4],
        [17, 24], [19.5, 23.4], [22, 24.2], [24.5, 23.4], [27, 24.2], [29.5, 23.4], [32, 24], [34.6, 23.4],
        [36.4, 23.4], [37.4, 22.2], [38.6, 22.0], [39, 20.4], [40, 19.4], [39.6, 17.6], [40, 15.8], [38.6 + hx * 0.5, 14.2 + hy * 0.6]];
}
var TAIL = [[16, 14.6], [14, 13.2], [12, 11.2], [10.2, 9], [8.6, 6.8], [7.6, 4.8], [6.2, 3.6], [4.6, 3.6], [3.6, 4.8], [3.8, 6.6], [3.0, 7.8],
    [3.8, 9.4], [3.4, 10.8], [4.8, 11.6], [5.0, 13.0], [6.8, 13.4], [7.6, 15.0], [9.6, 15.0], [11.0, 16.4], [13.0, 16.2], [15.4, 17.6]];
var TAIL_PIVOT = [15.5, 15.8];

function frontLeg(x, u, lift, bob) {
    var paw = [x + 0.4 + u * 2.2, 27.4 - lift * 1.5, 1.65];
    return chainMask([[x, 21.5 + bob, 2.0], [x + u * 1.0, 24.8 + bob * 0.5 - lift * 0.6, 1.8], paw, [paw[0] + 1.0, paw[1] + 0.2, 1.5]]);
}
function backLeg(x, u, lift, bob) {
    var paw = [x + 0.4 + u * 2.2, 27.4 - lift * 1.5, 1.65];
    return chainMask([[x - 0.8, 20.4 + bob, 3.4], [x + u * 0.8, 24.0 + bob * 0.5 - lift * 0.6, 2.0], paw, [paw[0] + 1.0, paw[1] + 0.2, 1.5]]);
}

// Face, in head space
var EYE = { e: [[41, 5], [42, 5], [41, 6], [42, 6], [41, 7], [42, 7]], w: [[41, 5]] };
var EYE_HAPPY = { e: [[40, 7], [41, 6], [42, 6], [43, 7]] };
var EYE_SHUT = { e: [[40, 7], [41, 8], [42, 8], [43, 7]] };
var NOSE = [[46, 5], [47, 5], [46, 6], [47, 6], [47, 7]];
var MOUTH = [[43, 9], [44, 10], [45, 10], [46, 9]];
var MOUTH_OPEN = { m: [[43, 9], [44, 10], [45, 10], [46, 10], [46, 9]], p: [[44, 11], [45, 11], [44, 12], [45, 12]] };
var CHEEK = [[39, 10], [40, 10]];
// The ball he carries, drawn over his mouth (top-left at head column 42, row 7)
var BALL_IN_MOUTH = { at: [42, 7], rows: [
    '..oooo..',
    '.obbbwo.',
    'obbbwbbo',
    'obwwbbbo',
    'owbbbbBo',
    'obbbbBBo',
    '.oBBBBo.',
    '..oooo..'
] };

function dog(o) {
    o = o || {};
    var bob = o.bob || 0, hx = o.hx || 0, hy = (o.hy || 0) + bob, dy = o.dy || 0;
    var g = blank();
    var L = o.legs || [[0, 0], [0, 0], [0, 0], [0, 0]]; // far back, far front, near back, near front
    if (!o.lying) {
        paint(g, backLeg(21, L[0][0], L[0][1], bob), { far: true, noTop: true });
        paint(g, frontLeg(31.6, L[1][0], L[1][1], bob), { far: true, noTop: true });
    } else {
        paint(g, chainMask([[31, 26, 1.6], [40.5, 27.4, 1.5]]), { far: true, noTop: true });
    }
    paint(g, polyMask(move(rot(TAIL, TAIL_PIVOT[0], TAIL_PIVOT[1], o.tail || 0), 0, bob + dy)), { shadeY: 15 + bob + dy });
    paint(g, polyMask(move(torsoPts(hx, hy - dy), 0, bob + dy)), { shadeY: 21 + bob + dy });
    if (!o.lying) {
        paint(g, backLeg(18.4, L[2][0], L[2][1], bob), { shadeY: 25, noTop: true, leftShade: true });
        paint(g, frontLeg(34.2, L[3][0], L[3][1], bob), { shadeY: 26, noTop: true, leftShade: true });
    } else {
        paint(g, chainMask([[17.5, 25, 3.4], [22, 27.4, 1.6], [23.5, 27.6, 1.5]]), { shadeY: 26, noTop: true });
        paint(g, chainMask([[34.5, 25.6, 1.7], [42.5, 27.4, 1.6]]), { shadeY: 27, noTop: true });
    }
    paint(g, polyMask(move(HEAD, hx, hy)), { shadeY: 12 + hy });
    var ex = o.earLift ? -1 : 0;
    var em = polyMask(move(EAR, hx + ex * 0.4, hy + ex));
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        if (!em[y][x]) continue;
        var edge = x === 0 || !em[y][x - 1] || y === H - 1 || !em[y + 1][x];
        g[y][x] = edge ? 'A' : 'a';
    }
    var off = function (pts) { return pts.map(function (p) { return [Math.round(p[0] + hx), Math.round(p[1] + hy)]; }); };
    var out = outline(g);
    var eye = o.shut ? EYE_SHUT : (o.joy ? EYE_HAPPY : EYE);
    put(out, off(eye.e), 'e');
    if (eye.w) put(out, off(eye.w), 'w');
    put(out, off(NOSE), 'e');
    put(out, off(CHEEK), 'h');
    if (o.ball) {
        BALL_IN_MOUTH.rows.forEach(function (row, y) {
            for (var x = 0; x < row.length; x++) {
                if (row[x] !== '.') put(out, off([[BALL_IN_MOUTH.at[0] + x, BALL_IN_MOUTH.at[1] + y]]), row[x]);
            }
        });
    }
    else if (o.open) { put(out, off(MOUTH_OPEN.m), 'm'); put(out, off(MOUTH_OPEN.p), 'p'); }
    else put(out, off(MOUTH), 'o');
    return out.map(function (r) { return r.join(''); });
}

// ---- animations -------------------------------------------------------------
function walkFrames(n, extra) {
    var f = [];
    for (var i = 0; i < n; i++) {
        var th = i / n * Math.PI * 2;
        var leg = function (ph) { var t = th + ph; return [-Math.cos(t) * 0.9, Math.max(0, Math.sin(t)) * 0.9]; };
        var L = [leg(0), leg(Math.PI), leg(Math.PI), leg(0)];
        var bob = (i % (n / 2)) === Math.floor(n / 4) ? -1 : 0;
        f.push(dog(Object.assign({ legs: L, bob: bob, tail: Math.sin(th * 2) * 0.1 }, extra || {})));
    }
    return f;
}
var RUN_POSES = [
    { legs: [[-1.5, 0.6], [1.5, 0.8], [-1.3, 0.5], [1.6, 0.7]], bob: -2, hy: -1, ear: true },
    { legs: [[-0.6, 0.9], [0.9, 0.2], [-0.3, 0.7], [0.6, 0]], bob: 0, hy: 0 },
    { legs: [[1.2, 0.3], [-0.8, 0.6], [1.5, 0], [-1.0, 0.5]], bob: -1, hy: 1, ear: true },
    { legs: [[0.5, 0], [-0.3, 0.9], [0.8, 0.3], [-0.5, 1.0]], bob: 0, hy: 0 }
];
function runFrames(extra) {
    return RUN_POSES.map(function (p, i) {
        return dog(Object.assign({ legs: p.legs, bob: p.bob, hy: p.hy, earLift: p.ear, open: true, tail: 0.15 - (i % 2) * 0.12 }, extra || {}));
    });
}

var FRAMES = {
    stand: [dog({})],
    walk: walkFrames(6),
    walkhappy: walkFrames(6, { open: true, joy: true }),
    run: runFrames(),
    runball: runFrames({ ball: true, open: false }),
    happy: [dog({ open: true, joy: true, tail: 0.22 }), dog({ open: true, joy: true, tail: -0.05 }), dog({ open: true, joy: true, tail: 0.22, hy: -1 }), dog({ open: true, joy: true, tail: -0.05 })],
    sniff: [dog({ hx: 1, hy: 4, tail: 0.05 }), dog({ hx: 1, hy: 5, tail: 0.05 })],
    ball: [dog({ ball: true, tail: 0.2 }), dog({ ball: true, tail: -0.05 })],
    lie: [dog({ lying: true, dy: 5, hy: 5, tail: -0.35 }), dog({ lying: true, dy: 5, hy: 5, open: true, joy: true, tail: -0.35 })],
    sleep: [dog({ lying: true, dy: 5, hy: 8, shut: true, tail: -0.4 }), dog({ lying: true, dy: 5, hy: 7, shut: true, tail: -0.4 })]
};

var SQUIRREL = [
    [
        '.ooo..........',
        'oqqqo.........',
        'oqQqqo........',
        'oqooqo....oo..',
        '.o.oqo...oqqo.',
        '...oqqoooqqeqo',
        '...oqQqqqqqqqe',
        '...oQqqrrrqoo.',
        '....oqoorroqo.',
        '....oo..oo.oo.'
    ],
    [
        '..............',
        '.ooo..........',
        'oqqqo.........',
        'oqQqqo....oo..',
        'oqooqo...oqqo.',
        '.o.oqqoooqqeqo',
        '...oqQqqqqqqqe',
        '..oqQqqrrrqoo.',
        '.oqo.oooroqo..',
        '.oo......oo...'
    ]
];
var BALL = [
    '...oooo...',
    '.oobbbwoo.',
    '.obbbbwbo.',
    'obbbbwbbbo',
    'obwwwbbbbo',
    'owbbbbbbBo',
    'obbbbbbBBo',
    '.obbbbBBo.',
    '.ooBBBBoo.',
    '...oooo...'
];

if (typeof module !== 'undefined') module.exports = { PAL: PAL, FRAMES: FRAMES, W: W, H: H, SQUIRREL: SQUIRREL, BALL: BALL };
