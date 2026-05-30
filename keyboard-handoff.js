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
            { color: '#ffffff', textShadow: '0 0 14px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.55)', offset: 0.35 },
            { color: base, textShadow: 'none' }
        ], { duration: 950, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }

    // Little "+1" tag that pops next to the Visitors tab as the card lands,
    // signalling one keyboard was just added to that tab. Pinned to the tab's
    // current rect (fixed) so it never disturbs the nav layout, then removed.
    function showPlusOne(tab, reduceMotion) {
        if (!tab || !tab.animate) return;
        var tr = tab.getBoundingClientRect();
        var badge = document.createElement('div');
        badge.className = 'kb-plus-one';
        badge.textContent = '+1';
        document.body.appendChild(badge);

        // Sit beside the target, vertically centered. On desktop that's just
        // right of the "Visitors" text; on mobile the target is the hamburger
        // (pinned to the right edge), so the badge goes to its LEFT to stay
        // comfortably on-screen.
        if (tab.classList && tab.classList.contains('hamburger')) {
            badge.style.left = (tr.left - badge.offsetWidth - 6) + 'px';
        } else {
            badge.style.left = (tr.right + 6) + 'px';
        }
        badge.style.top  = (tr.top + tr.height / 2 - badge.offsetHeight / 2) + 'px';

        // Pop in fast, hold fully visible ~1s, then fade out (≈0.1→0.77 of 1500ms).
        var frames = reduceMotion
            ? [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.77 }, { opacity: 0 }]
            : [{ opacity: 0, transform: 'translateY(6px) scale(0.6)' },
               { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.1 },
               { opacity: 1, transform: 'translateY(-2px) scale(1)', offset: 0.77 },
               { opacity: 0, transform: 'translateY(-12px) scale(0.95)' }];

        var a = badge.animate(frames,
            { duration: 1500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
        a.onfinish = function () { badge.remove(); };
    }

    function run() {
        var tab = findTab();
        if (!tab) return;
        if (reduce) { pulseTab(tab); showPlusOne(tab, true); return; }

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

        // Appear instantly at the exact spot the welcome card occupied — no fade.
        // The welcome card stays full-opacity through its exit, so this reads as
        // the same card persisting across the navigation rather than popping in.

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
            // Glow the Visitors text + drop a "+1" tag right as the card lands.
            setTimeout(function () { pulseTab(tab); showPlusOne(tab, false); }, 640);
            anim.onfinish = function () { fly.remove(); };
        }, 700);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 250); });
    } else {
        setTimeout(run, 250);
    }
})();
