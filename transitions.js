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
    // Logo — geometric JC monogram laid out on an 8-col × 6-row grid.
    //
    // Each cell is 10×10 with a 2px gap (so cell-pitch is 12). The top
    // bar runs across cols 1–7, leaving col 0 empty so the bar feels
    // weighted toward C. Two vertical stems at col 3 (J) and col 5 (C)
    // descend through rows 1–4. The bottom uses scattered cells: an
    // isolated square at (row 4, col 0), J's foot at (row 5, cols 1–2),
    // and C's bottom at (row 5, cols 6–7). The intentionally missing
    // squares give the monogram a pixelated, broken-up feel rather than
    // a perfect block letterform.
    // ------------------------------------------------------------------
    var LOGO_SVG =
        '<svg class="nav-logo-svg" width="64" height="48" viewBox="0 0 94 70"' +
        ' style="color:#fff;display:block"' +
        ' xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JC">' +
            '<style>.logo-cell{fill:currentColor;transition:fill 0.55s ease}</style>' +
            // Row 0 — top bar (cols 1–7; col 0 left empty)
            '<rect class="logo-cell" x="12" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="24" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="36" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="48" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="72" y="0"  width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="84" y="0"  width="10" height="10" rx="2"/>' +
            // Row 1 — stems (col 3, col 5)
            '<rect class="logo-cell" x="36" y="12" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="12" width="10" height="10" rx="2"/>' +
            // Row 2 — stems
            '<rect class="logo-cell" x="36" y="24" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="24" width="10" height="10" rx="2"/>' +
            // Row 3 — stems
            '<rect class="logo-cell" x="36" y="36" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="36" width="10" height="10" rx="2"/>' +
            // Row 4 — stems plus isolated cell at far left (col 0)
            '<rect class="logo-cell" x="0"  y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="36" y="48" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="60" y="48" width="10" height="10" rx="2"/>' +
            // Row 5 — J foot (cols 1–2) and C bottom (cols 6–7)
            '<rect class="logo-cell" x="12" y="60" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="24" y="60" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="72" y="60" width="10" height="10" rx="2"/>' +
            '<rect class="logo-cell" x="84" y="60" width="10" height="10" rx="2"/>' +
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
        var HOLD_MS = 550;            // how long each cell stays tinted before fading back
        var MIN_GAP_MS = 1100;        // shortest pause between batches
        var MAX_GAP_MS = 2200;        // longest pause between batches
        var BATCH_SIZE = 5;           // cells lit per batch (staggered, not simultaneous)
        var STAGGER_MIN_MS = 90;      // min delay between cells within a batch — spaced wide
        var STAGGER_MAX_MS = 180;     // enough that no two cells flash at the same moment
        // Carry the previous batch forward so we don't immediately re-flash
        // a cell we just dimmed — keeps the pattern feeling random.
        var recent = [];

        function tick() {
            var picked = [];
            var attempts = 0;
            // Pick distinct cells that weren't in the last batch. Bail out after
            // 50 attempts so a tiny grid with lots of recents can't hang us.
            while (picked.length < BATCH_SIZE && attempts < 50) {
                var i = Math.floor(Math.random() * cells.length);
                if (picked.indexOf(i) === -1 && recent.indexOf(i) === -1) {
                    picked.push(i);
                }
                attempts++;
            }

            picked.forEach(function (i, order) {
                var stagger = order * (STAGGER_MIN_MS + Math.random() * (STAGGER_MAX_MS - STAGGER_MIN_MS));
                setTimeout(function () {
                    cells[i].style.fill = FLASH_COLOR;
                    setTimeout(function () { cells[i].style.fill = ''; }, HOLD_MS);
                }, stagger);
            });
            recent = picked.slice();

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
