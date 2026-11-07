// Shared page transitions + nav logo.
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
//
// Logo:  A pixel keycap replaces whatever is in .nav-logo on every page, and
//        its LED blinks slowly. Honors prefers-reduced-motion.
(function () {
    'use strict';

    var ENTER_DURATION = 0.35;

    // ------------------------------------------------------------------
    // Logo — a single pixel keycap with JC on it, plotted on a 22x22 grid.
    // assets/logo-keycap.svg and assets/favicon.svg hold the same artwork.
    // ------------------------------------------------------------------
    var LOGO_SVG =
        '<svg class="nav-logo-svg" width="44" height="44" viewBox="0 0 22 22" shape-rendering="crispEdges"' +
        ' style="display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JC">' +
        '<path fill="#fafaf7" d="M1 1h20v1h-20zM1 2h1v1h-1zM20 2h1v1h-1zM1 3h20v1h-20zM1 4h20v1h-20zM1 5h20v1h-20zM1 6h4v1h-4zM8 6h2v1h-2zM13 6h8v1h-8zM1 7h5v1h-5zM7 7h2v1h-2zM10 7h3v1h-3zM14 7h7v1h-7zM1 8h5v1h-5zM7 8h2v1h-2zM10 8h11v1h-11zM1 9h5v1h-5zM7 9h2v1h-2zM10 9h11v1h-11zM1 10h2v1h-2zM4 10h2v1h-2zM7 10h2v1h-2zM10 10h11v1h-11zM1 11h2v1h-2zM4 11h2v1h-2zM7 11h2v1h-2zM10 11h3v1h-3zM14 11h7v1h-7zM1 12h3v1h-3zM6 12h4v1h-4zM13 12h8v1h-8zM1 13h20v1h-20zM1 14h20v1h-20zM1 15h20v1h-20zM1 16h20v1h-20zM1 17h20v1h-20zM1 18h20v1h-20z"/><path fill="#c3bfb6" d="M0 2h1v1h-1zM21 2h1v1h-1zM0 3h1v1h-1zM21 3h1v1h-1zM0 4h1v1h-1zM21 4h1v1h-1zM0 5h1v1h-1zM21 5h1v1h-1zM0 6h1v1h-1zM21 6h1v1h-1zM0 7h1v1h-1zM21 7h1v1h-1zM0 8h1v1h-1zM21 8h1v1h-1zM0 9h1v1h-1zM21 9h1v1h-1zM0 10h1v1h-1zM21 10h1v1h-1zM0 11h1v1h-1zM21 11h1v1h-1zM0 12h1v1h-1zM21 12h1v1h-1zM0 13h1v1h-1zM21 13h1v1h-1zM0 14h1v1h-1zM21 14h1v1h-1zM0 15h1v1h-1zM21 15h1v1h-1zM0 16h1v1h-1zM21 16h1v1h-1zM0 17h1v1h-1zM21 17h1v1h-1zM0 18h1v1h-1zM21 18h1v1h-1zM0 19h22v1h-22zM0 20h22v1h-22zM1 21h20v1h-20z"/><path fill="#ffffff" d="M2 2h18v1h-18z"/><path fill="#161514" d="M5 6h3v1h-3zM10 6h3v1h-3zM6 7h1v1h-1zM9 7h1v1h-1zM13 7h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM6 9h1v1h-1zM9 9h1v1h-1zM3 10h1v1h-1zM6 10h1v1h-1zM9 10h1v1h-1zM3 11h1v1h-1zM6 11h1v1h-1zM9 11h1v1h-1zM13 11h1v1h-1zM4 12h2v1h-2zM10 12h3v1h-3z"/><rect class="logo-led" x="16" y="5" width="3" height="3" fill="#1180f9"/>' +
        '</svg>';

    function replaceLogo() {
        // One source of truth for the markup; HTML files don't need touching.
        document.querySelectorAll('.nav-logo img, .nav-logo svg').forEach(function (el) {
            el.outerHTML = LOGO_SVG;
        });
    }

    // The keycap's LED ticks between two blues in hard steps.
    function startLogoBlink() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var led = document.querySelector('.nav-logo-svg .logo-led');
        if (!led) return;
        var on = false;
        setInterval(function () {
            on = !on;
            led.setAttribute('fill', on ? '#66d2ff' : '#1180f9');
        }, 900);
    }

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
        if (typeof gsap === 'undefined') {
            // Fallback when GSAP isn't loaded — instant reveal.
            document.body.style.opacity = '1';
            return;
        }
        gsap.to(document.body, {
            opacity: 1,
            duration: ENTER_DURATION,
            ease: 'power2.out'
        });
    }

    function onReady() {
        // Logo swap must happen before the body fades in so the user never
        // sees the old PNG flash through.
        replaceLogo();
        playEnter();
        startLogoBlink();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    window.PageTransitions = {
        exit: exit,
        bindNavLinks: bindNavLinks
    };
})();
