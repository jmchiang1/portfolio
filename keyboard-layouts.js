// ============================================
// keyboard-layouts.js
// Single source of truth for the mini-keyboard layouts and renderer used
// across welcome.html (build flow), home.html (handoff replay) and
// visitors.html (saved-builds gallery). Exposes window.KbLayouts.
//
// Token shape (kept tiny and serializable):
//   { k: 'esc', s: 1 }                  — a key (1u by default)
//   { k: 'caps', s: 1.75, mod: true }   — modifier (slightly darker cap)
//   { k: 'enter', s: 2.25, accent: true } — accent (legend-coloured cap)
//   { k: 'space', s: 6.25, space: true }  — spacebar
//   { gap: true, s: 0.5 }               — invisible spacer
//
// Sizes are encoded as discrete CSS classes (kb-1u, kb-1-25u, …) so every
// renderer lays out keys via the same kb-* CSS — no `--key-units` drift.
// ============================================
(function () {
    'use strict';

    // ---- Token builders ----------------------------------------------------
    function k(name, size)   { return { k: name, s: size || 1 }; }
    function mod(name, size) { return { k: name, s: size || 1, mod: true }; }
    function acc(name, size) { return { k: name, s: size || 1, accent: true }; }
    function sp(name)        { return { k: name || 'space', s: 6.25, space: true }; }
    function gap(size)       { return { gap: true, s: size || 1 }; }

    // ---- Layouts -----------------------------------------------------------
    // Keep these the SINGLE source of truth — both welcome.js and visitors.html
    // import them via window.KbLayouts so the saved keyboard always matches
    // the one the visitor built.

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

    // Aliased by both internal keys ('60'/'75'/'tkl') and display names
    // ('60%'/'75%'/'TKL') so callers can pass either without normalising.
    var LAYOUTS = {
        '60':  { units: 15,   rows: LAYOUT_60  },
        '60%': { units: 15,   rows: LAYOUT_60  },
        '75':  { units: 16,   rows: LAYOUT_75  },
        '75%': { units: 16,   rows: LAYOUT_75  },
        'tkl': { units: 18.5, rows: LAYOUT_TKL },
        'TKL': { units: 18.5, rows: LAYOUT_TKL }
    };

    // ---- Renderer ----------------------------------------------------------
    function sizeToClass(n) {
        if (n === 0.5)  return 'kb-0-5';
        if (n === 1.25) return 'kb-1-25u';
        if (n === 1.5)  return 'kb-1-5u';
        if (n === 1.75) return 'kb-1-75u';
        if (n === 2)    return 'kb-2u';
        if (n === 2.25) return 'kb-2-25u';
        if (n === 2.75) return 'kb-2-75u';
        if (n === 3)    return 'kb-3u';
        return 'kb-1u';
    }

    // HTML-string form — used by visitors.html (innerHTML) and anywhere a
    // string is more convenient than a DOM node.
    function renderKeyHtml(tok) {
        if (tok.gap) {
            return '<div class="kb-gap ' + sizeToClass(tok.s) + '"></div>';
        }
        var cls = 'kb-key';
        if (tok.space)  cls += ' kb-space';
        else            cls += ' ' + sizeToClass(tok.s);
        if (tok.mod)    cls += ' kb-mod';
        if (tok.accent) cls += ' kb-accent';
        var keyAttr = tok.k ? ' data-key="' + tok.k + '"' : '';
        return '<div class="' + cls + '"' + keyAttr + '></div>';
    }

    // DOM-element form — used by welcome.js (createElement-style assembly).
    function renderKeyDom(tok) {
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

    function renderKeyboardHtml(layoutName) {
        var def = LAYOUTS[layoutName] || LAYOUTS['60'];
        return def.rows.map(function (row) {
            return '<div class="kb-row">' + row.map(renderKeyHtml).join('') + '</div>';
        }).join('');
    }

    function getUnits(layoutName) {
        var def = LAYOUTS[layoutName] || LAYOUTS['60'];
        return def.units;
    }

    // ---- Public surface ----------------------------------------------------
    window.KbLayouts = {
        // Tokens
        k: k, mod: mod, acc: acc, sp: sp, gap: gap,
        // Data
        LAYOUTS: LAYOUTS,
        LAYOUT_60: LAYOUT_60,
        LAYOUT_75: LAYOUT_75,
        LAYOUT_TKL: LAYOUT_TKL,
        // Helpers
        sizeToClass:        sizeToClass,
        renderKeyHtml:      renderKeyHtml,
        renderKeyDom:       renderKeyDom,
        renderKeyboardHtml: renderKeyboardHtml,
        getUnits:           getUnits
    };
})();
