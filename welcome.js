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
        tactile: { svg: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" style="vertical-align:-0.125em" aria-hidden="true"><rect x="8" y="2" width="8" height="2"/><rect x="4" y="4" width="8" height="2"/><rect x="16" y="4" width="4" height="2"/><rect x="2" y="6" width="12" height="2"/><rect x="18" y="6" width="4" height="2"/><rect x="2" y="8" width="12" height="2"/><rect x="20" y="8" width="2" height="2"/><rect x="2" y="10" width="12" height="2"/><rect x="20" y="10" width="2" height="2"/><rect x="2" y="12" width="12" height="2"/><rect x="20" y="12" width="2" height="2"/><rect x="2" y="14" width="12" height="2"/><rect x="20" y="14" width="2" height="2"/><rect x="2" y="16" width="12" height="2"/><rect x="18" y="16" width="4" height="2"/><rect x="4" y="18" width="8" height="2"/><rect x="16" y="18" width="4" height="2"/><rect x="8" y="20" width="8" height="2"/></svg>' },
        linear:  { svg: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" style="vertical-align:-0.125em" aria-hidden="true"><rect x="18" y="4" width="6" height="2"/><rect x="16" y="6" width="4" height="2"/><rect x="14" y="8" width="4" height="2"/><rect x="12" y="10" width="4" height="2"/><rect x="10" y="12" width="4" height="2"/><rect x="8" y="14" width="4" height="2"/><rect x="6" y="16" width="4" height="2"/><rect x="0" y="18" width="6" height="2"/></svg>' },
        clicky:  { svg: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" style="vertical-align:-0.125em" aria-hidden="true"><rect x="6" y="6" width="4" height="2"/><rect x="18" y="6" width="4" height="2"/><rect x="4" y="8" width="2" height="2"/><rect x="10" y="8" width="2" height="2"/><rect x="16" y="8" width="2" height="2"/><rect x="22" y="8" width="2" height="2"/><rect x="4" y="10" width="2" height="2"/><rect x="10" y="10" width="2" height="2"/><rect x="16" y="10" width="2" height="2"/><rect x="0" y="12" width="6" height="2"/><rect x="10" y="12" width="8" height="2"/><rect x="22" y="12" width="2" height="2"/></svg>'   }
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

    // ---------- Mini-keyboard generator ----------
    // Layouts, token builders, and the per-key renderer all live in
    // keyboard-layouts.js so this page, the home handoff replay, and the
    // visitors gallery render the exact same keyboard from the same data.
    var KB = window.KbLayouts;

    function buildKeyboard(layout) {
        cardKeyboard.setAttribute('data-layout', layout);
        cardKeyboard.innerHTML = '';

        var def = KB.LAYOUTS[layout] || KB.LAYOUTS['60'];
        def.rows.forEach(function (row) {
            var rowEl = document.createElement('div');
            rowEl.className = 'kb-row';
            row.forEach(function (tok) {
                rowEl.appendChild(KB.renderKeyDom(tok));
            });
            cardKeyboard.appendChild(rowEl);
        });
    }

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
        specSwitchIcon.innerHTML = SWITCHES[build.switchKey].svg;
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
        if (iconEl) iconEl.className = 'hn hn-circle-notch';

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
