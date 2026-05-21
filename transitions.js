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
// Logo:  A 7×5 grid SVG monogram (JC) replaces the static logo.png on every
//        page. After the body fade-in completes, a slow, sparse flashing
//        loop tints a random cell to the accent color for ~550ms, then picks
//        a new one after a 1.2–2.5s gap. Honors prefers-reduced-motion.
(function () {
    'use strict';

    var ENTER_DURATION = 0.35;

    // ------------------------------------------------------------------
    // Logo — geometric JC monogram laid out on a 7-col × 5-row grid.
    //
    // Each cell is 10×10 with a 2px gap (so cell-pitch is 12). The top row
    // is a continuous bar — J's top bar, a bridge cell (col 3), and C's
    // top bar — so the two letters read as a single connected glyph. The
    // middle row is deliberately empty: it creates a pixelated, broken-up
    // feel that reads as a stylized monogram rather than a perfect block
    // letterform.
    // ------------------------------------------------------------------
    var LOGO_SVG =
        '<svg class="nav-logo-svg" width="51" height="36" viewBox="0 0 82 58"' +
        ' style="color:#fff;display:block"' +
        ' xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JC">' +
            '<style>.logo-cell{fill:currentColor;transition:fill 0.55s ease}</style>' +
            // Row 0 — full top bar with bridge cell at col 3 connecting J and C
            '<rect class="logo-cell" x="0"  y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="12" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="24" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="36" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="48" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="72" y="0"  width="10" height="10" rx="2"/>' +
            // Row 1 — stems
            '<rect class="logo-cell" x="24" y="12" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="48" y="12" width="10" height="10" rx="2"/>' +
            // Row 2 — intentionally empty (the "missing" row)
            // Row 3 — stems resume
            '<rect class="logo-cell" x="24" y="36" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="48" y="36" width="10" height="10" rx="2"/>' +
            // Row 4 — bottom bars (J hook on left, C bottom on right)
            '<rect class="logo-cell" x="0"  y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="12" y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="24" y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="48" y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="72" y="48" width="10" height="10" rx="2"/>' +
        '</svg>';

    function replaceLogo() {
        // Swap any <img> inside .nav-logo for the inline SVG. Doing it in JS
        // means a single source-of-truth for the markup; HTML files don't need
        // to be touched per-page.
        document.querySelectorAll('.nav-logo img').forEach(function (img) {
            img.outerHTML = LOGO_SVG;
        });
    }

    function startLogoFlash() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var cells = document.querySelectorAll('.nav-logo-svg .logo-cell');
        if (!cells.length) return;

        var FLASH_COLOR = '#66d2ff';
        var HOLD_MS = 550;          // how long the cell stays tinted before fading back
        var MIN_GAP_MS = 1200;      // shortest pause between flashes (keeps it sparse)
        var MAX_GAP_MS = 2500;      // longest pause between flashes
        var lastIdx = -1;

        function tick() {
            // Avoid flashing the same cell twice in a row — keeps the pattern
            // feeling random rather than landing on the same square repeatedly.
            var i;
            do { i = Math.floor(Math.random() * cells.length); }
            while (i === lastIdx && cells.length > 1);
            lastIdx = i;

            var cell = cells[i];
            cell.style.fill = FLASH_COLOR;
            setTimeout(function () { cell.style.fill = ''; }, HOLD_MS);

            var nextGap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
            setTimeout(tick, nextGap);
        }

        // Kick off after the page-enter fade has settled.
        setTimeout(tick, 1800);
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
        startLogoFlash();
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
