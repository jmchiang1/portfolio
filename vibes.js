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

    // ============================================
    // Background visibility toggle — grid only
    // ============================================
    var bgVisibility = document.querySelector('.bg-visibility');
    var bgGrid = document.getElementById('background-grid');

    if (bgVisibility && bgGrid) {
        bgVisibility.addEventListener('click', function () {
            var hidden = bgGrid.classList.toggle('grid-hidden');
            bgGrid.classList.toggle('grid-visible', !hidden);
            var icon = bgVisibility.querySelector('i');
            if (icon) icon.className = hidden ? 'ph ph-eye-slash' : 'ph ph-eye';
            bgVisibility.setAttribute('data-tooltip', hidden ? 'Show' : 'Hide');
        });
    }

    // ============================================
    // Easter egg — tap any hero logo chip 3 times in quick succession to
    // reveal the hidden typing test. The "psst" hint is a cursor-following
    // tooltip that only appears while a chip is hovered.
    // ============================================
    var chips = document.querySelectorAll('.hero-logo-chip');
    var hint = document.querySelector('.hero-hint');
    var CHIP_TARGET = 3;
    var CHIP_RESET_MS = 1500;
    var CHIP_BONK_MS = 180;
    var chipState = new WeakMap();

    // Cursor-following hint
    if (hint) {
        var hintX = 0, hintY = 0, hintVisible = false;
        var rafPending = false;

        function applyHintPosition() {
            rafPending = false;
            hint.style.transform = 'translate(' + (hintX + 16) + 'px, ' + (hintY + 16) + 'px)';
        }

        function moveHint(e) {
            hintX = e.clientX;
            hintY = e.clientY;
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(applyHintPosition);
            }
        }

        chips.forEach(function (chip) {
            chip.addEventListener('mouseenter', function (e) {
                hintX = e.clientX;
                hintY = e.clientY;
                applyHintPosition();
                if (!hintVisible) {
                    hint.classList.add('is-visible');
                    hintVisible = true;
                }
            });

            chip.addEventListener('mousemove', moveHint);

            chip.addEventListener('mouseleave', function () {
                if (hintVisible) {
                    hint.classList.remove('is-visible');
                    hintVisible = false;
                }
            });
        });
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            var s = chipState.get(chip) || { count: 0, timer: null };
            s.count += 1;

            chip.classList.remove('chip-bonk');
            void chip.offsetWidth; // restart transition
            chip.classList.add('chip-bonk');
            setTimeout(function () { chip.classList.remove('chip-bonk'); }, CHIP_BONK_MS);

            clearTimeout(s.timer);

            if (s.count >= CHIP_TARGET) {
                chipState.delete(chip);
                if (window.PageTransitions) PageTransitions.exit('typing.html');
                else window.location.href = 'typing.html';
                return;
            }

            s.timer = setTimeout(function () { chipState.delete(chip); }, CHIP_RESET_MS);
            chipState.set(chip, s);
        });
    });
})();
