// About page — nav exit animations
(function () {
    function triggerExit(href) {
        var navbar = document.querySelector('.navbar');
        var navLinks = navbar.querySelectorAll('.nav-link');
        var logoEl = navbar.querySelector('.nav-logo');

        navLinks.forEach(function (link) {
            link.style.animation = 'none';
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        });

        logoEl.style.animation = 'none';
        logoEl.style.opacity = '1';

        navbar.offsetHeight;

        navbar.classList.add('nav-exiting');
        document.body.classList.add('page-exit-active');

        setTimeout(function () {
            window.location.href = href;
        }, 500);
    }

    // Logo click
    var logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', function (e) {
            e.preventDefault();
            triggerExit(logo.getAttribute('href'));
        });
    }

    // Nav-links that navigate to other pages
    var allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#')) return;
        link.addEventListener('click', function (e) {
            e.preventDefault();
            triggerExit(href);
        });
    });

    // Hamburger menu toggle (mobile)
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
                    triggerExit(href);
                });
            });
        });
    }

    // Experience rows — click to expand/collapse
    var expRows = document.querySelectorAll('.exp-row');
    expRows.forEach(function (row) {
        var header = row.querySelector('.exp-row-header');
        if (!header) return;
        header.addEventListener('click', function () {
            var isOpen = row.classList.toggle('is-open');
            header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });

    // Photo scroll carousel — drive horizontal translate from page scroll position
    (function () {
        var section = document.querySelector('.photo-scroll-section');
        if (!section) return;
        var track = section.querySelector('.photo-scroll-track');
        var slides = Array.prototype.slice.call(section.querySelectorAll('.photo-slide'));
        var dots = Array.prototype.slice.call(section.querySelectorAll('.photo-dot'));
        var N = slides.length;
        if (!track || N === 0) return;

        // Reduced motion: CSS fallback takes over — skip scroll hijack math
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var mobileMQ = window.matchMedia('(max-width: 640px)');
        var ticking = false;
        var lastActiveIdx = -1;

        // Gate the scroll-driven transforms until the CSS entrance animation
        // finishes, otherwise JS inline transforms would clash with the keyframes.
        // Entrance timing: last slide delay (0.75s) + duration (0.8s) ≈ 1550ms.
        var entered = false;
        var ENTER_TOTAL_MS = 1550;

        function clearInlineStyles() {
            track.style.transform = '';
            slides.forEach(function (s) {
                s.style.transform = '';
                s.style.opacity = '';
            });
            lastActiveIdx = -1;
        }

        function update() {
            ticking = false;
            // On mobile, CSS renders photos as a bento grid — no carousel math
            if (mobileMQ.matches) {
                clearInlineStyles();
                return;
            }
            var rect = section.getBoundingClientRect();
            var vh = window.innerHeight;
            var vw = window.innerWidth;
            var scrollable = section.offsetHeight - vh;
            if (scrollable <= 0) return;

            var progress = Math.max(0, Math.min(1, -rect.top / scrollable));

            var first = slides[0];
            var slideW = first.offsetWidth;
            var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            var step = slideW + gap;

            var idxFloat = progress * (N - 1);
            var center = idxFloat * step + slideW / 2;
            var tx = vw / 2 - center;
            // Track centering always runs — no CSS animation on the track, so
            // this positions slide 0 in the viewport center from first paint
            track.style.transform = 'translate3d(' + tx + 'px, 0, 0)';

            // Per-slide scale/opacity is driven by the CSS entrance animation
            // until it finishes, then JS takes over based on scroll position
            if (!entered) return;

            // Focus the centered slide — others subtly recede
            slides.forEach(function (s, i) {
                var dist = Math.abs(i - idxFloat);
                var scale = Math.max(0.9, 1 - dist * 0.08);
                var opacity = Math.max(0.45, 1 - dist * 0.28);
                s.style.transform = 'scale(' + scale + ')';
                s.style.opacity = opacity;
            });

            var activeIdx = Math.round(idxFloat);
            if (activeIdx !== lastActiveIdx) {
                dots.forEach(function (d, i) {
                    d.classList.toggle('active', i === activeIdx);
                });
                lastActiveIdx = activeIdx;
            }
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();

        // After the staggered entrance finishes, release CSS animation and
        // let the scroll-driven carousel take over. Suppress the 0.15s opacity/
        // transform transition for the handoff frame so the shift from keyframe
        // end-state (translateY(0), opacity 1) to JS-computed (scale, opacity by
        // distance) is instant — otherwise you see a brief shimmer/shift.
        setTimeout(function () {
            slides.forEach(function (s) {
                s.style.transition = 'none';
                s.style.animation = 'none';
            });
            entered = true;
            update();
            // Restore transition on the next frame so subsequent scroll updates
            // animate smoothly again
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    slides.forEach(function (s) { s.style.transition = ''; });
                });
            });
        }, ENTER_TOTAL_MS);
    })();

    // Rotating role title — typewriter effect that types + deletes each role
    (function () {
        var textEl = document.querySelector('.rotator-text');
        if (!textEl) return;

        var WORDS = [
            'Product Designer',
            'Software Engineer',
            'Design Engineer',
            'Technical Product Designer',
            'Creative Technologist'
        ];

        var TYPE_MS = 75;        // per-character typing speed
        var DELETE_MS = 40;      // per-character delete speed (faster than typing)
        var HOLD_FULL_MS = 2000; // pause when word fully typed
        var HOLD_EMPTY_MS = 400; // pause before next word starts

        var wordIdx = 0;
        var charIdx = 0;
        var isDeleting = false;

        function tick() {
            var word = WORDS[wordIdx];
            if (isDeleting) {
                charIdx--;
                textEl.textContent = word.substring(0, charIdx);
                if (charIdx === 0) {
                    isDeleting = false;
                    wordIdx = (wordIdx + 1) % WORDS.length;
                    setTimeout(tick, HOLD_EMPTY_MS);
                } else {
                    setTimeout(tick, DELETE_MS);
                }
            } else {
                charIdx++;
                textEl.textContent = word.substring(0, charIdx);
                if (charIdx === word.length) {
                    isDeleting = true;
                    setTimeout(tick, HOLD_FULL_MS);
                } else {
                    setTimeout(tick, TYPE_MS);
                }
            }
        }

        // Start after a brief delay to let the hero fade in
        setTimeout(tick, 600);
    })();
})();

