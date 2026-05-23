// keyboard-handoff.js
// After a visitor builds their keyboard on welcome.html, this replays the EXACT
// keyboard (snapshotted on exit) on the home page at the SAME on-screen spot it
// occupied on the welcome screen, then flies it into the "Visitors" nav tab so
// they learn their creation lives there. Plays once per build.
(function () {
    'use strict';

    var raw = sessionStorage.getItem('jc_kb_handoff');
    if (!raw) return;
    sessionStorage.removeItem('jc_kb_handoff');

    var h;
    try { h = JSON.parse(raw); } catch (e) { return; }
    if (!h || !h.html) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function findTab() {
        // Desktop: the Visitors nav link. Mobile: it's hidden, so aim at the
        // hamburger (which opens the menu containing Visitors).
        var tab = document.querySelector('.navbar .nav-links a[href="visitors.html"]');
        if (!tab || tab.offsetParent === null) {
            tab = document.querySelector('.navbar .hamburger') || tab;
        }
        return tab;
    }

    function pulseTab(tab) {
        if (!tab || !tab.animate) return;
        // Glow the tab text via the Web Animations API rather than a CSS class:
        // the nav links stay visible through a forwards-filled entrance
        // animation, and swapping the CSS `animation` would drop that fill and
        // hide the link. WAAPI layers on top without touching it.
        var base = getComputedStyle(tab).color;
        tab.animate([
            { color: base, textShadow: 'none' },
            { color: '#66d2ff', textShadow: '0 0 14px rgba(102, 210, 255, 0.9), 0 0 30px rgba(17, 128, 249, 0.55)', offset: 0.35 },
            { color: base, textShadow: 'none' }
        ], { duration: 950, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }

    function run() {
        var tab = findTab();
        if (!tab) return;
        if (reduce) { pulseTab(tab); return; }

        // Wrapper pinned exactly where the card sat on the welcome screen. The
        // card's colour vars are already inline in the snapshot HTML.
        var fly = document.createElement('div');
        fly.className = 'kb-fly';
        fly.style.left = h.left + 'px';
        fly.style.top  = h.top + 'px';
        if (h.width) fly.style.width = h.width + 'px';
        fly.innerHTML = h.html;

        // Pin the keyboard's key unit + gap so it's pixel-identical to welcome.
        var kb = fly.querySelector('.build-card-keyboard');
        if (kb) {
            if (h.u)   kb.style.setProperty('--u', h.u);
            if (h.gap) kb.style.setProperty('--kb-gap', h.gap);
        }
        document.body.appendChild(fly);

        // Appear in place (quick fade so it doesn't pop) — no movement yet.
        fly.animate([{ opacity: 0 }, { opacity: 1 }],
            { duration: 240, easing: 'ease-out', fill: 'both' });

        // Hold so the eye registers the card, then fly the whole thing into the tab.
        setTimeout(function () {
            var fr = fly.getBoundingClientRect();
            var tr = tab.getBoundingClientRect();
            var dx = (tr.left + tr.width / 2) - (fr.left + fr.width / 2);
            var dy = (tr.top + tr.height / 2) - (fr.top + fr.height / 2);
            var endScale = fr.width ? Math.max(0.06, Math.min(tr.width, 80) / fr.width) : 0.18;

            var anim = fly.animate(
                [{ transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
                 { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + endScale + ')', opacity: 0 }],
                { duration: 820, easing: 'cubic-bezier(0.6, 0, 0.35, 1)', fill: 'forwards' }
            );
            // Glow the Visitors text right as the card lands in it.
            setTimeout(function () { pulseTab(tab); }, 640);
            anim.onfinish = function () { fly.remove(); };
        }, 700);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 250); });
    } else {
        setTimeout(run, 250);
    }
})();
