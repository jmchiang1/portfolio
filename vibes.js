// Vibes page — iframe scaling, mobile menu, bg controls, page transitions
(function () {
    'use strict';

    // ============================================
    // Iframe preview scaling
    // Each iframe is rendered at a fixed desktop viewport (1400×875) and
    // scaled to fit its container so the preview looks like a real desktop.
    // ============================================
    var IFRAME_NATIVE_WIDTH = 1400;

    function scaleIframes() {
        var frames = document.querySelectorAll('.vibes-card-frame');
        frames.forEach(function (frame) {
            var iframe = frame.querySelector('.vibes-card-iframe');
            if (!iframe) return;
            var width = frame.clientWidth;
            if (!width) return;
            var scale = width / IFRAME_NATIVE_WIDTH;
            iframe.style.transform = 'scale(' + scale + ')';
        });
    }

    // Fade in iframes once they're loaded so we don't show a white flash
    function bindIframeLoad() {
        var iframes = document.querySelectorAll('.vibes-card-iframe');
        iframes.forEach(function (iframe) {
            iframe.addEventListener('load', function () {
                iframe.classList.add('is-loaded');
            });
            // Fallback — if load doesn't fire within 8s, reveal anyway
            setTimeout(function () {
                iframe.classList.add('is-loaded');
            }, 8000);
        });
    }

    scaleIframes();
    bindIframeLoad();

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scaleIframes, 80);
    });

    // ============================================
    // Cards — click anywhere on card opens the live site
    // (the inner iframe is pointer-events: none, so click bubbles up)
    // ============================================
    var cards = document.querySelectorAll('.vibes-card');
    cards.forEach(function (card) {
        var liveUrl = card.getAttribute('data-live');
        if (!liveUrl) return;

        card.addEventListener('click', function (e) {
            // If the user clicked a real link/button inside the card, let it handle itself
            if (e.target.closest('a, button')) return;
            window.open(liveUrl, '_blank', 'noopener,noreferrer');
        });
    });

    // ============================================
    // Page transitions on internal nav links — handled by the shared
    // GSAP transitions module (transitions.js)
    // ============================================
    if (window.PageTransitions) PageTransitions.bindNavLinks();

    // ============================================
    // Mobile menu (hamburger)
    // ============================================
    var hamburger = document.querySelector('.hamburger');
    var mobileMenu = document.querySelector('.mobile-menu');

    if (hamburger && mobileMenu) {
        function closeMenu(cb) {
            hamburger.classList.remove('is-open');
            mobileMenu.classList.remove('menu-open');
            mobileMenu.classList.add('menu-closing');
            setTimeout(function () {
                mobileMenu.classList.remove('menu-closing');
                if (cb) cb();
            }, 450);
        }

        hamburger.addEventListener('click', function () {
            if (mobileMenu.classList.contains('menu-open')) {
                closeMenu();
            } else {
                mobileMenu.classList.remove('menu-closing');
                hamburger.classList.add('is-open');
                mobileMenu.classList.add('menu-open');
            }
        });

        var mobileLinks = mobileMenu.querySelectorAll('.mobile-menu-link');
        mobileLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href || href === '#' || href.startsWith('#')) return;

            link.addEventListener('click', function (e) {
                e.preventDefault();
                closeMenu(function () {
                    if (window.PageTransitions) PageTransitions.exit(href);
                    else window.location.href = href;
                });
            });
        });
    }

})();
