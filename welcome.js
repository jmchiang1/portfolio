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
        graphite: { color: '#1f1f24', text: '#ffffff', textDim: 'rgba(255,255,255,0.55)' },
        midnight: { color: '#1a2747', text: '#ffffff', textDim: 'rgba(255,255,255,0.6)'  },
        ember:    { color: '#c0673f', text: '#1a0d05', textDim: 'rgba(26,13,5,0.6)'      },
        moss:     { color: '#3a5b3f', text: '#f4f1e3', textDim: 'rgba(244,241,227,0.6)'  },
        bone:     { color: '#e6dccb', text: '#1c1a14', textDim: 'rgba(28,26,20,0.55)'    }
    };

    var KEYCAPS = {
        cream:      { color: '#e7dcc2', legend: '#1d1a14' },
        bow:        { color: '#13131a', legend: '#f3f3f3' },
        olivia:     { color: '#e9dcd4', legend: '#1e1e22' },
        botanical:  { color: '#1c2a26', legend: '#cbb88a' },
        dolch:      { color: '#2a2a2e', legend: '#f5d97a' }
    };

    var SWITCHES = {
        linear:  { icon: 'ph-line-segment' },
        tactile: { icon: 'ph-circle-half' },
        clicky:  { icon: 'ph-wave-sine'   }
    };

    var build = {
        name:       '',
        layout:     '60',
        layoutName: '60%',
        caseKey:    'graphite',
        caseName:   'Graphite',
        switchKey:  'tactile',
        switchName: 'Tactile',
        keycapKey:  'cream',
        keycapName: 'Cream',
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
        else if (layout === 'tkl')  rows = LAYOUT_TKL;
        else                        rows = LAYOUT_100;

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
    //   100%  = 6 rows × 23u  — TKL + 4u numpad

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

    var LAYOUT_100 = [
        [acc('esc'), gap(0.5), mod('f1'), mod('f2'), mod('f3'), mod('f4'), gap(0.5), mod('f5'), mod('f6'), mod('f7'), mod('f8'), gap(0.5), mod('f9'), mod('f10'), mod('f11'), mod('f12'), gap(1), mod('prtsc'), mod('scrlk'), mod('pause'), gap(0.5), gap(1), gap(1), gap(1), gap(1)],
        [k('grave'), k('1'), k('2'), k('3'), k('4'), k('5'), k('6'), k('7'), k('8'), k('9'), k('0'), k('dash'), k('equal'), mod('bksp', 2), gap(0.5), mod('ins'), mod('home'), mod('pgup'), gap(0.5), mod('num'), mod('npdiv'), mod('npmul'), mod('npsub')],
        [mod('tab', 1.5), k('q'), k('w'), k('e'), k('r'), k('t'), k('y'), k('u'), k('i'), k('o'), k('p'), k('lbracket'), k('rbracket'), mod('bslash', 1.5), gap(0.5), mod('del'), mod('end'), mod('pgdn'), gap(0.5), k('np7'), k('np8'), k('np9'), mod('npadd')],
        [mod('caps', 1.75), k('a'), k('s'), k('d'), k('f'), k('g'), k('h'), k('j'), k('k'), k('l'), k('semi'), k('quote'), acc('enter', 2.25), gap(0.5), gap(1), gap(1), gap(1), gap(0.5), k('np4'), k('np5'), k('np6'), gap(1)],
        [mod('lshift', 2.25), k('z'), k('x'), k('c'), k('v'), k('b'), k('n'), k('m'), k('comma'), k('period'), k('slash'), mod('rshift', 2.75), gap(0.5), gap(1), k('up'), gap(1), gap(0.5), k('np1'), k('np2'), k('np3'), acc('npenter')],
        [mod('lctrl', 1.25), mod('lwin', 1.25), mod('lalt', 1.25), sp(), mod('ralt', 1.25), mod('rwin', 1.25), mod('menu', 1.25), mod('rctrl', 1.25), gap(0.5), k('left'), k('down'), k('right'), gap(0.5), mod('np0', 2), k('npdot'), gap(1)]
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
        return client.from('visitors').insert(payload).select().single().then(function (res) {
            if (res.error) throw res.error;
            return { persisted: true, row: res.data };
        });
    }

    // ---------- Submit ----------
    function setStatus(msg, kind) {
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
        // portfolio can greet returning visitors.
        try {
            localStorage.setItem('jc_visitor', JSON.stringify(Object.assign({}, payload, {
                case_key: build.caseKey,
                keycap_key: build.keycapKey,
                switch_key: build.switchKey,
                layout_key: build.layout,
                issued_at: new Date().toISOString()
            })));
            localStorage.setItem('jc_welcomed', '1');
        } catch (e) {}

        saveVisitor(payload)
            .then(function (result) {
                if (result.persisted) {
                    setStatus('Saved. Stepping inside…', 'success');
                } else {
                    setStatus('Saved locally. Stepping inside…', 'success');
                }
                exitToPortfolio();
            })
            .catch(function (err) {
                // Don't block entry on a backend hiccup — keep the local card.
                console.warn('[welcome] supabase save failed', err);
                setStatus('Saved locally. Stepping inside…', 'success');
                exitToPortfolio();
            });
    }

    function exitToPortfolio() {
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
        var nameMap = { '60': '60%', '75': '75%', 'tkl': 'TKL', '100': '100%' };
        build.layoutName = nameMap[build.layout] || build.layout;
        applyLayout();
    });

    pickInGroup('[data-case]', 'data-case', function (btn) {
        build.caseKey = btn.getAttribute('data-case');
        build.caseName = btn.getAttribute('data-name');
        applyCase();
    });

    pickInGroup('[data-switch]', 'data-switch', function (btn) {
        build.switchKey = btn.getAttribute('data-switch');
        build.switchName = btn.getAttribute('data-name');
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
            exitToPortfolio();
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

    document.addEventListener('keydown', function (e) { pressKey(normalizeKey(e), true); }, { passive: true });
    document.addEventListener('keyup',   function (e) { pressKey(normalizeKey(e), false); }, { passive: true });
    window.addEventListener('blur', clearPressed);

    // ---------- Init ----------
    function init() {
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

        tickClock();
        setInterval(tickClock, 1000);
    }

    init();
})();
