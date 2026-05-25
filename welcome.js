// ============================================
// Welcome — first-visit visitor card gate
// Configure → submit → persist → enter portfolio
// ============================================
(function () {
    'use strict';

    // ---------- DOM refs ----------
    var nameInput      = document.getElementById('visitorName');
    var rerollBtn      = document.getElementById('rerollName');
    var cardEl         = document.getElementById('buildCard');
    var cardName       = document.getElementById('cardName');
    var cardSerial     = document.getElementById('cardSerial');
    var cardDate       = document.getElementById('cardDate');
    var cardSignature  = document.getElementById('cardSignature');
    var cardKeyboard   = document.getElementById('cardKeyboard');
    var specLayout     = document.getElementById('specLayout');
    var specCase       = document.getElementById('specCase');
    var specCaseSwatch = document.getElementById('specCaseSwatch');
    var specSwitch     = document.getElementById('specSwitch');
    var specSwitchIcon = document.getElementById('specSwitchIcon');
    var specKeycap     = document.getElementById('specKeycap');
    var specKeycapSwatch = document.getElementById('specKeycapSwatch');
    var submitBtn      = document.getElementById('welcomeSubmit');
    var statusEl       = document.getElementById('welcomeStatus');
    var skipLink       = document.getElementById('welcomeSkip');
    var footTime       = document.getElementById('footTime');

    // ---------- Generated name pool ----------
    var ADJECTIVES = [
        'Tactile', 'Linear', 'Clicky', 'Lubed', 'Cream', 'Brass', 'Velvet',
        'Crisp', 'Quiet', 'Thocky', 'Clacky', 'Steady', 'Holy', 'Inky',
        'Bright', 'Polished', 'Solder', 'Frosted', 'Foamed', 'Marbled',
        'Cherry', 'Topre', 'Bobo', 'Plate', 'Sprung'
    ];
    var NOUNS = [
        'Ember', 'Spruce', 'Comet', 'Falcon', 'Nimbus', 'Quartz', 'Marigold',
        'Otter', 'Pollen', 'Drift', 'Echo', 'Lantern', 'Cypher', 'Atlas',
        'Beacon', 'Glimmer', 'Pebble', 'Cricket', 'Aspen', 'Cinder', 'Sable',
        'Indigo', 'Saffron', 'Onyx', 'Pine', 'Lark', 'Plume', 'Vesper'
    ];

    function rollName() {
        var a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        var n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        return (a + ' ' + n).toUpperCase();
    }

    // ---------- Build state ----------
    var CASES = {
        white:    { color: '#f4f4f6', text: '#1c1c20', textDim: 'rgba(28,28,32,0.55)'   },
        charcoal: { color: '#36383d', text: '#ffffff', textDim: 'rgba(255,255,255,0.55)' },
        navy:     { color: '#1c2c54', text: '#ffffff', textDim: 'rgba(255,255,255,0.6)'  },
        crimson:  { color: '#9c1f2e', text: '#ffffff', textDim: 'rgba(255,255,255,0.6)'  },
        matcha:   { color: '#93a564', text: '#1a1e10', textDim: 'rgba(26,30,16,0.6)'      }
    };

    var KEYCAPS = {
        black:  { color: '#16161d', legend: '#f3f3f3' },
        white:  { color: '#f4f4f6', legend: '#1d1a14' },
        violet: { color: '#7c5cf2', legend: '#ffffff' },
        yellow: { color: '#f4e21f', legend: '#1a1a10' },
        cream:  { color: '#e7dcc2', legend: '#1d1a14' }
    };

    var SWITCHES = {
        tactile: { icon: 'ph-circle-half' },
        linear:  { icon: 'ph-line-segment' },
        clicky:  { icon: 'ph-wave-sine'   }
    };

    var build = {
        id:         null,   // set when editing an existing card
        name:       '',
        layout:     '60',
        layoutName: '60%',
        caseKey:    'white',
        caseName:   'White',
        switchKey:  'tactile',
        switchName: 'Tactile',
        keycapKey:  'black',
        keycapName: 'Black',
        serial:     0
    };

    // ---------- Mini-keyboard generators ----------
    // Each row is a flex container; keys get fixed widths (via --u)
    // so the keyboard sizes naturally to its layout rather than
    // stretching to fill the card.
    //
    // Tokens are objects produced by the helpers below.
    function k(name, size)   { return { k: name, s: size || 1 }; }
    function mod(name, size) { return { k: name, s: size || 1, mod: true }; }
    function acc(name, size) { return { k: name, s: size || 1, accent: true }; }
    function sp(name)        { return { k: name || 'space', s: 6.25, space: true }; }
    function gap(size)       { return { gap: true, s: size || 1 }; }

    function buildKeyboard(layout) {
        cardKeyboard.setAttribute('data-layout', layout);
        cardKeyboard.innerHTML = '';

        var rows;
        if (layout === '60')        rows = LAYOUT_60;
        else if (layout === '75')   rows = LAYOUT_75;
        else                        rows = LAYOUT_TKL;

        rows.forEach(function (row) {
            var rowEl = document.createElement('div');
            rowEl.className = 'kb-row';
            row.forEach(function (tok) {
                rowEl.appendChild(renderKey(tok));
            });
            cardKeyboard.appendChild(rowEl);
        });
    }

    function renderKey(tok) {
        var el = document.createElement('div');

        if (tok.gap) {
            el.className = 'kb-gap ' + sizeToClass(tok.s);
            return el;
        }

        var cls = 'kb-key';
        if (tok.space)  cls += ' kb-space';
        else            cls += ' ' + sizeToClass(tok.s);
        if (tok.mod)    cls += ' kb-mod';
        if (tok.accent) cls += ' kb-accent';
        el.className = cls;
        if (tok.k) el.setAttribute('data-key', tok.k);
        return el;
    }

    function sizeToClass(n) {
        if (n === 0.5)       return 'kb-0-5';
        if (n === 1.25)      return 'kb-1-25u';
        if (n === 1.5)       return 'kb-1-5u';
        if (n === 1.75)      return 'kb-1-75u';
        if (n === 2)         return 'kb-2u';
        if (n === 2.25)      return 'kb-2-25u';
        if (n === 2.75)      return 'kb-2-75u';
        return 'kb-1u';
    }

    // Each layout below maps a real key code to every cap so the
    // physical keyboard can light up the matching cap on press.
    //
    //   60%   = 5 rows × 15u  — no fn row, no nav, no arrows
    //   75%   = 6 rows × 16u  — fn row + 1u nav column + arrows
    //   TKL   = 6 rows × 18.5u — TKL with full nav cluster

    var LAYOUT_60 = [
        [acc('esc'), k('1'), k('2'), k('3'), k('4'), k('5'), k('6'), k('7'), k('8'), k('9'), k('0'), k('dash'), k('equal'), mod('bksp', 2)],
        [mod('tab', 1.5), k('q'), k('w'), k('e'), k('r'), k('t'), k('y'), k('u'), k('i'), k('o'), k('p'), k('lbracket'), k('rbracket'), mod('bslash', 1.5)],
        [mod('caps', 1.75), k('a'), k('s'), k('d'), k('f'), k('g'), k('h'), k('j'), k('k'), k('l'), k('semi'), k('quote'), acc('enter', 2.25)],
        [mod('lshift', 2.25), k('z'), k('x'), k('c'), k('v'), k('b'), k('n'), k('m'), k('comma'), k('period'), k('slash'), mod('rshift', 2.75)],
        [mod('lctrl', 1.25), mod('lwin', 1.25), mod('lalt', 1.25), sp(), mod('ralt', 1.25), mod('rwin', 1.25), mod('menu', 1.25), mod('rctrl', 1.25)]
    ];

    var LAYOUT_75 = [
        [acc('esc'), mod('f1'), mod('f2'), mod('f3'), mod('f4'), mod('f5'), mod('f6'), mod('f7'), mod('f8'), mod('f9'), mod('f10'), mod('f11'), mod('f12'), mod('del'), mod('home'), mod('end')],
        [k('grave'), k('1'), k('2'), k('3'), k('4'), k('5'), k('6'), k('7'), k('8'), k('9'), k('0'), k('dash'), k('equal'), mod('bksp', 2), mod('pgup')],
        [mod('tab', 1.5), k('q'), k('w'), k('e'), k('r'), k('t'), k('y'), k('u'), k('i'), k('o'), k('p'), k('lbracket'), k('rbracket'), mod('bslash', 1.5), mod('pgdn')],
        [mod('caps', 1.75), k('a'), k('s'), k('d'), k('f'), k('g'), k('h'), k('j'), k('k'), k('l'), k('semi'), k('quote'), acc('enter', 2.25), mod('home')],
        [mod('lshift', 2.25), k('z'), k('x'), k('c'), k('v'), k('b'), k('n'), k('m'), k('comma'), k('period'), k('slash'), mod('rshift', 1.75), k('up'), mod('end')],
        [mod('lctrl', 1.25), mod('lwin', 1.25), mod('lalt', 1.25), sp(), mod('ralt', 1.25), mod('fn', 1.25), gap(0.5), k('left'), k('down'), k('right')]
    ];

    var LAYOUT_TKL = [
        [acc('esc'), gap(0.5), mod('f1'), mod('f2'), mod('f3'), mod('f4'), gap(0.5), mod('f5'), mod('f6'), mod('f7'), mod('f8'), gap(0.5), mod('f9'), mod('f10'), mod('f11'), mod('f12'), gap(1), mod('prtsc'), mod('scrlk'), mod('pause')],
        [k('grave'), k('1'), k('2'), k('3'), k('4'), k('5'), k('6'), k('7'), k('8'), k('9'), k('0'), k('dash'), k('equal'), mod('bksp', 2), gap(0.5), mod('ins'), mod('home'), mod('pgup')],
        [mod('tab', 1.5), k('q'), k('w'), k('e'), k('r'), k('t'), k('y'), k('u'), k('i'), k('o'), k('p'), k('lbracket'), k('rbracket'), mod('bslash', 1.5), gap(0.5), mod('del'), mod('end'), mod('pgdn')],
        [mod('caps', 1.75), k('a'), k('s'), k('d'), k('f'), k('g'), k('h'), k('j'), k('k'), k('l'), k('semi'), k('quote'), acc('enter', 2.25), gap(0.5), gap(1), gap(1), gap(1)],
        [mod('lshift', 2.25), k('z'), k('x'), k('c'), k('v'), k('b'), k('n'), k('m'), k('comma'), k('period'), k('slash'), mod('rshift', 2.75), gap(0.5), gap(1), k('up'), gap(1)],
        [mod('lctrl', 1.25), mod('lwin', 1.25), mod('lalt', 1.25), sp(), mod('ralt', 1.25), mod('rwin', 1.25), mod('menu', 1.25), mod('rctrl', 1.25), gap(0.5), k('left'), k('down'), k('right')]
    ];

    // ---------- Card updaters ----------
    function applyCase() {
        var c = CASES[build.caseKey];
        cardEl.style.setProperty('--case-color', c.color);
        cardEl.style.setProperty('--case-text', c.text);
        cardEl.style.setProperty('--case-text-dim', c.textDim);
        specCase.textContent = build.caseName;
        specCaseSwatch.style.setProperty('--swatch-color', c.color);
    }

    function applyKeycaps() {
        var k = KEYCAPS[build.keycapKey];
        cardEl.style.setProperty('--keycap-color', k.color);
        cardEl.style.setProperty('--keycap-legend', k.legend);
        specKeycap.textContent = build.keycapName;
        specKeycapSwatch.style.setProperty('--swatch-color', k.color);
    }

    function applySwitch() {
        specSwitch.textContent = build.switchName;
        specSwitchIcon.className = 'ph ' + SWITCHES[build.switchKey].icon;
    }

    function applyLayout() {
        specLayout.textContent = build.layoutName;
        buildKeyboard(build.layout);
    }

    function applyName(name) {
        build.name = name;
        cardName.textContent = name || '—';
        cardSignature.textContent = 'x  ' + (name ? name.split(' ').map(function (w) { return w.charAt(0); }).join('') : '__');
    }

    function bumpCard() {
        cardEl.classList.remove('bouncing');
        // restart the animation by forcing reflow
        void cardEl.offsetWidth;
        cardEl.classList.add('bouncing');
    }

    // ---------- Card metadata ----------
    function todayString() {
        var d = new Date();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        var yy = String(d.getFullYear()).slice(-2);
        return mm + '/' + dd + '/' + yy;
    }

    function generateSerial() {
        // 4-digit serial. Bump by 1 each visit on this device so the
        // user gets some sense of "visitor No.", while staying stateless
        // before the DB confirms.
        var base = parseInt(localStorage.getItem('jc_visitor_serial') || '1037', 10);
        if (isNaN(base)) base = 1037;
        var next = base + 1;
        try { localStorage.setItem('jc_visitor_serial', String(next)); } catch (e) {}
        return next;
    }

    // ---------- Status bar clock ----------
    function tickClock() {
        if (!footTime) return;
        var d = new Date();
        footTime.textContent =
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0') + ':' +
            String(d.getSeconds()).padStart(2, '0');
    }

    // ---------- Supabase ----------
    var supa = null;
    function getSupabase() {
        if (supa) return supa;
        var url = window.SUPABASE_URL;
        var key = window.SUPABASE_ANON_KEY;
        if (!url || !key || typeof window.supabase === 'undefined') return null;
        supa = window.supabase.createClient(url, key);
        return supa;
    }

    function saveVisitor(payload) {
        var client = getSupabase();
        if (!client) return Promise.resolve({ persisted: false });
        var query = build.id
            ? client.from('visitors').update(payload).eq('id', build.id)
            : client.from('visitors').insert(payload);
        return query.select().single().then(function (res) {
            if (res.error) throw res.error;
            return { persisted: true, row: res.data, updated: !!build.id };
        });
    }

    // ---------- Submit ----------
    function setStatus(msg, kind) {
        // The status line is optional chrome — bail if it isn't on the page so
        // a missing element never blocks the save → navigate flow.
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.classList.remove('is-error', 'is-success');
        if (kind === 'error')   statusEl.classList.add('is-error');
        if (kind === 'success') statusEl.classList.add('is-success');
    }

    function handleSubmit() {
        var name = (nameInput.value || '').trim().toUpperCase();
        if (!name) {
            nameInput.focus();
            setStatus('Pick a name first — or hit the shuffle.', 'error');
            return;
        }
        applyName(name);

        var payload = {
            name: name,
            layout: build.layoutName,
            case_color: build.caseName,
            switch_type: build.switchName,
            keycaps: build.keycapName,
            serial: build.serial
        };

        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        var iconEl = submitBtn.querySelector('i');
        if (iconEl) iconEl.className = 'ph ph-circle-notch';

        // Save the card locally regardless of backend success so the
        // portfolio can greet returning visitors. Preserve `id` if editing
        // so the next save still hits UPDATE.
        try {
            var local = Object.assign({}, payload, {
                id:         build.id || null,
                case_key:   build.caseKey,
                keycap_key: build.keycapKey,
                switch_key: build.switchKey,
                layout_key: build.layout,
                // Stash the resolved hex colors so the home-page handoff
                // animation can rebuild a mini keyboard without a colour map.
                case_hex:      (CASES[build.caseKey]     || {}).color,
                keycap_hex:    (KEYCAPS[build.keycapKey]  || {}).color,
                keycap_legend: (KEYCAPS[build.keycapKey]  || {}).legend,
                issued_at:  new Date().toISOString()
            });
            localStorage.setItem('jc_visitor', JSON.stringify(local));
            localStorage.setItem('jc_welcomed', '1');
        } catch (e) {}

        saveVisitor(payload)
            .then(function (result) {
                // First insert returns the row's id — stash it so future
                // edits go through UPDATE instead of creating a duplicate.
                if (result.persisted && result.row && result.row.id) {
                    build.id = result.row.id;
                    try {
                        var saved = JSON.parse(localStorage.getItem('jc_visitor') || '{}');
                        saved.id = result.row.id;
                        localStorage.setItem('jc_visitor', JSON.stringify(saved));
                    } catch (e) {}
                }

                var msg = result.persisted
                    ? (result.updated ? 'Updated. Stepping inside…' : 'Saved. Stepping inside…')
                    : 'Saved locally. Stepping inside…';
                setStatus(msg, 'success');
                exitToPortfolio(true);
            })
            .catch(function (err) {
                // Don't block entry on a backend hiccup — keep the local card.
                console.warn('[welcome] supabase save failed', err);
                setStatus('Saved locally. Stepping inside…', 'success');
                exitToPortfolio(true);
            });
    }

    function exitToPortfolio(captureCard) {
        // Only hand the card off to the home page when the visitor actually built
        // & saved one. On skip we clear any snapshot so the home page plays no
        // keyboard fly-in at all.
        try {
            if (captureCard) {
                // Snapshot the EXACT visitor card — full markup (the card's colour
                // vars are already inline) and on-screen rect — so the home page can
                // show the same card at the same position, then fly it into the
                // Visitors tab. Captured before the exit transform runs.
                var cardNode = document.getElementById('buildCard');
                var kbNode   = document.getElementById('cardKeyboard');
                if (cardNode) {
                    var r   = cardNode.getBoundingClientRect();
                    var kcs = kbNode ? getComputedStyle(kbNode) : null;
                    sessionStorage.setItem('jc_kb_handoff', JSON.stringify({
                        html:  cardNode.outerHTML,
                        left:  r.left, top: r.top, width: r.width, height: r.height,
                        u:     kcs ? (kcs.getPropertyValue('--u') || '').trim() : '',
                        gap:   kcs ? (kcs.getPropertyValue('--kb-gap') || '').trim() : ''
                    }));
                }
            } else {
                sessionStorage.removeItem('jc_kb_handoff');
            }
        } catch (e) {}

        document.body.classList.add('welcome-exiting');
        setTimeout(function () { window.location.href = '/'; }, 480);
    }

    // ---------- Wire up controls ----------
    function pickInGroup(selector, attr, handler) {
        document.querySelectorAll(selector).forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll(selector).forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                handler(btn);
                bumpCard();
            });
        });
    }

    pickInGroup('.layout-btn', 'data-layout', function (btn) {
        build.layout = btn.getAttribute('data-layout');
        var nameMap = { '60': '60%', '75': '75%', 'tkl': 'TKL' };
        build.layoutName = nameMap[build.layout] || build.layout;
        applyLayout();
    });

    pickInGroup('[data-case]', 'data-case', function (btn) {
        build.caseKey = btn.getAttribute('data-case');
        build.caseName = btn.getAttribute('data-name');
        applyCase();
    });

    var switchSounds = {
        linear:  new Audio('assets/sounds/linear.mp3'),
        tactile: new Audio('assets/sounds/tactile.mp3'),
        clicky:  new Audio('assets/sounds/clicky.mp3')
    };
    Object.keys(switchSounds).forEach(function (k) {
        switchSounds[k].preload = 'auto';
        switchSounds[k].volume = 0.55;
    });
    // Cloning a preloaded Audio reuses the cached buffer, so overlapping
    // plays during fast typing don't cut each other off.
    function playSwitchSound(key) {
        var src = switchSounds[key];
        if (!src) return;
        try {
            var clone = src.cloneNode();
            clone.volume = src.volume;
            clone.play().catch(function () {});
        } catch (e) {}
    }

    pickInGroup('[data-switch]', 'data-switch', function (btn) {
        build.switchKey = btn.getAttribute('data-switch');
        build.switchName = btn.getAttribute('data-name');
        playSwitchSound(build.switchKey);
        applySwitch();
    });

    pickInGroup('[data-keycap]', 'data-keycap', function (btn) {
        build.keycapKey = btn.getAttribute('data-keycap');
        build.keycapName = btn.getAttribute('data-name');
        applyKeycaps();
    });

    rerollBtn.addEventListener('click', function () {
        nameInput.value = rollName();
        applyName(nameInput.value);
        bumpCard();
    });

    nameInput.addEventListener('input', function () {
        applyName(nameInput.value.toUpperCase());
    });

    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    });

    submitBtn.addEventListener('click', handleSubmit);

    if (skipLink) {
        skipLink.addEventListener('click', function (e) {
            e.preventDefault();
            try { localStorage.setItem('jc_welcomed', '1'); } catch (err) {}
            exitToPortfolio(false);
        });
    }

    // ---------- Live keypress feedback ----------
    // When the visitor types on their real keyboard, the matching cap
    // on the rendered board lights up. e.code is layout-independent so
    // Shift+1 still highlights the "1" cap, not "!".
    var CODE_MAP = {
        Backquote: 'grave', Minus: 'dash', Equal: 'equal',
        BracketLeft: 'lbracket', BracketRight: 'rbracket', Backslash: 'bslash',
        Semicolon: 'semi', Quote: 'quote',
        Comma: 'comma', Period: 'period', Slash: 'slash',
        Tab: 'tab', Space: 'space', Escape: 'esc', Enter: 'enter',
        Backspace: 'bksp', CapsLock: 'caps',
        ShiftLeft: 'lshift', ShiftRight: 'rshift',
        ControlLeft: 'lctrl', ControlRight: 'rctrl',
        AltLeft: 'lalt', AltRight: 'ralt',
        MetaLeft: 'lwin', MetaRight: 'rwin',
        ContextMenu: 'menu',
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        PageUp: 'pgup', PageDown: 'pgdn',
        Home: 'home', End: 'end', Insert: 'ins', Delete: 'del',
        PrintScreen: 'prtsc', ScrollLock: 'scrlk', Pause: 'pause',
        F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4', F5: 'f5', F6: 'f6',
        F7: 'f7', F8: 'f8', F9: 'f9', F10: 'f10', F11: 'f11', F12: 'f12',
        NumLock: 'num',
        NumpadAdd: 'npadd', NumpadSubtract: 'npsub',
        NumpadMultiply: 'npmul', NumpadDivide: 'npdiv',
        NumpadEnter: 'npenter', NumpadDecimal: 'npdot'
    };

    function normalizeKey(e) {
        var code = e.code;
        if (!code) return null;
        if (/^Key[A-Z]$/.test(code))  return code.slice(3).toLowerCase();
        if (/^Digit[0-9]$/.test(code)) return code.slice(5);
        if (/^Numpad[0-9]$/.test(code)) return 'np' + code.slice(6);
        return CODE_MAP[code] || null;
    }

    function pressKey(name, on) {
        if (!name) return;
        var btn = cardKeyboard.querySelector('[data-key="' + name + '"]');
        if (btn) btn.classList.toggle('is-pressed', on);
    }

    function clearPressed() {
        var nodes = cardKeyboard.querySelectorAll('.is-pressed');
        for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove('is-pressed');
    }

    document.addEventListener('keydown', function (e) {
        pressKey(normalizeKey(e), true);
        if (!e.repeat) playSwitchSound(build.switchKey);
    }, { passive: true });
    document.addEventListener('keyup',   function (e) { pressKey(normalizeKey(e), false); }, { passive: true });
    window.addEventListener('blur', clearPressed);

    // ---------- 3D Card Tilt (GSAP) ----------
    // Tilts the visitor card toward the cursor for a subtle "physical card"
    // feel. Skipped on touch / reduced-motion.
    (function setupCardTilt() {
        if (typeof gsap === 'undefined' || !cardEl) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var MAX_TILT = 10;
        var LIFT     = 14;
        var rect     = null;

        function refreshRect() { rect = cardEl.getBoundingClientRect(); }

        var quickRotX = gsap.quickTo(cardEl, 'rotateX', { duration: 0.5, ease: 'power2.out' });
        var quickRotY = gsap.quickTo(cardEl, 'rotateY', { duration: 0.5, ease: 'power2.out' });
        var quickZ    = gsap.quickTo(cardEl, 'z',       { duration: 0.5, ease: 'power2.out' });

        gsap.set(cardEl, { transformPerspective: 1000, transformOrigin: 'center center' });

        cardEl.addEventListener('mouseenter', function () {
            refreshRect();
            quickZ(LIFT);
        });

        cardEl.addEventListener('mousemove', function (e) {
            if (!rect) refreshRect();
            var px = (e.clientX - rect.left) / rect.width;
            var py = (e.clientY - rect.top)  / rect.height;
            quickRotY((px - 0.5) * 2 * MAX_TILT);
            quickRotX(-(py - 0.5) * 2 * MAX_TILT);
        });

        cardEl.addEventListener('mouseleave', function () {
            gsap.to(cardEl, {
                rotateX: 0, rotateY: 0, z: 0,
                duration: 0.8, ease: 'power3.out', overwrite: 'auto'
            });
        });

        window.addEventListener('resize', refreshRect);
        window.addEventListener('scroll', refreshRect, { passive: true });
    })();

    // ---------- Edit mode ----------
    // If localStorage has a card with a server-side `id`, the visitor is
    // editing their existing entry. Pull the saved selections into `build`
    // and reflect them in the UI.
    function loadExisting() {
        try {
            var raw = localStorage.getItem('jc_visitor');
            if (!raw) return null;
            var v = JSON.parse(raw);
            if (!v || !v.id) return null;
            return v;
        } catch (e) { return null; }
    }

    function selectOption(selector, attr, value) {
        document.querySelectorAll(selector).forEach(function (b) {
            b.classList.toggle('active', b.getAttribute(attr) === value);
        });
    }

    function applyExisting(v) {
        build.id         = v.id;
        build.serial     = v.serial || build.serial;
        build.layout     = v.layout_key  || build.layout;
        build.layoutName = v.layout      || build.layoutName;
        build.caseKey    = v.case_key    || build.caseKey;
        build.caseName   = v.case_color  || build.caseName;
        build.switchKey  = v.switch_key  || build.switchKey;
        build.switchName = v.switch_type || build.switchName;
        build.keycapKey  = v.keycap_key  || build.keycapKey;
        build.keycapName = v.keycaps     || build.keycapName;
        build.name       = v.name        || build.name;

        selectOption('.layout-btn',  'data-layout',  build.layout);
        selectOption('[data-case]',  'data-case',    build.caseKey);
        selectOption('[data-switch]','data-switch',  build.switchKey);
        selectOption('[data-keycap]','data-keycap',  build.keycapKey);
    }

    function applyEditModeChrome() {
        document.body.classList.add('welcome-editing');
        var submitLabel = submitBtn.querySelector('span');
        if (submitLabel) submitLabel.textContent = 'Save changes';
    }

    // ---------- Init ----------
    function init() {
        var existing = loadExisting();

        if (existing) {
            applyExisting(existing);
            cardSerial.textContent = 'NO. ' + String(build.serial).padStart(4, '0');
            cardDate.textContent = todayString();
            applyCase();
            applyKeycaps();
            applySwitch();
            applyLayout();
            nameInput.value = build.name;
            applyName(build.name);
            applyEditModeChrome();
        } else {
            build.serial = generateSerial();
            cardSerial.textContent = 'NO. ' + String(build.serial).padStart(4, '0');
            cardDate.textContent = todayString();
            applyCase();
            applyKeycaps();
            applySwitch();
            applyLayout();
            var seedName = rollName();
            nameInput.value = seedName;
            applyName(seedName);
        }

        // The keyboard uses width:fit-content; if it's first built before the
        // entrance animation / web fonts settle it can cache a collapsed size
        // (shows as a tiny square until a layout change rebuilds it). Rebuild
        // once layout is stable so it always renders at full size on first load.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { buildKeyboard(build.layout); });
        });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { buildKeyboard(build.layout); });
        }

        tickClock();
        setInterval(tickClock, 1000);
    }

    init();
})();
