// Shared page transitions.
//
// Exit:  Navigate immediately — no fade, no nav stagger, no class toggles.
//        Whatever is on screen when the user clicks stays put until the
//        browser swaps to the next page. (Was a GSAP timeline previously.)
//
// Enter: A brief body opacity fade from 0 → 1. Pages set `body { opacity: 0 }`
//        inline in <head> to avoid FOUC; this script fades it back in on
//        DOMContentLoaded. The per-element CSS entrance keyframes still run
//        inside the fading body, so the staggered nav + content reveal feels
//        like one coordinated transition.
(function () {
    'use strict';
    if (typeof gsap === 'undefined') return;

    var ENTER_DURATION = 0.35;

    function exit(href) {
        window.location.href = href;
    }

    function bindNavLinks() {
        var logo = document.querySelector('.nav-logo');
        if (logo) {
            logo.addEventListener('click', function (e) {
                var href = logo.getAttribute('href');
                if (!href) return;
                e.preventDefault();
                exit(href);
            });
        }

        document.querySelectorAll('.nav-link').forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) return;
            if (href === '#' || href.charAt(0) === '#') return;
            if (/^https?:\/\//.test(href)) return;
            if (link.target === '_blank') return;
            link.addEventListener('click', function (e) {
                e.preventDefault();
                exit(href);
            });
        });
    }

    function playEnter() {
        // The `<style>body { opacity: 0 }</style>` in each page's <head> prevents
        // FOUC during initial paint. Inline opacity overrides that rule once
        // GSAP starts tweening, and we leave inline opacity: 1 so the CSS rule
        // can't snap the body back to invisible after the tween completes.
        gsap.to(document.body, {
            opacity: 1,
            duration: ENTER_DURATION,
            ease: 'power2.out'
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', playEnter);
    } else {
        playEnter();
    }

    window.PageTransitions = {
        exit: exit,
        bindNavLinks: bindNavLinks
    };
})();
