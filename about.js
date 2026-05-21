// About page
(function () {
    // Desktop nav-link + logo exits — handled by the shared GSAP transitions module
    if (window.PageTransitions) PageTransitions.bindNavLinks();

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
                    if (window.PageTransitions) PageTransitions.exit(href);
                    else window.location.href = href;
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

    // Photo scroll carousel — GSAP ScrollTrigger drives a scrubbed timeline
    // that translates the track and scales/fades each slide based on its
    // distance from the viewport center. CSS handles the staggered entrance
    // keyframes; once they finish the scrub takes over the scale/opacity.
    (function () {
        var section = document.querySelector('.photo-scroll-section');
        if (!section) return;
        var track = section.querySelector('.photo-scroll-track');
        var slides = Array.prototype.slice.call(section.querySelectorAll('.photo-slide'));
        var dots = Array.prototype.slice.call(section.querySelectorAll('.photo-dot'));
        var N = slides.length;
        if (!track || N === 0) return;
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        // Entrance timing: last slide delay (0.75s) + duration (0.8s) ≈ 1550ms.
        // Until this point CSS keyframes own scale/opacity; after it, scrub does.
        var ENTER_TOTAL_MS = 1550;

        // matchMedia gates the whole scroll-driven behavior to desktop +
        // motion-allowed users. On mobile or reduced-motion the CSS fallback
        // (bento grid / horizontal overflow) handles layout instead.
        var mm = gsap.matchMedia();

        mm.add('(min-width: 641px) and (prefers-reduced-motion: no-preference)', function () {
            var entered = false;
            var lastActiveIdx = -1;

            function applyProgress(progress) {
                var slideW = slides[0].offsetWidth;
                var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
                var step = slideW + gap;
                var vw = window.innerWidth;

                var idxFloat = progress * (N - 1);
                var center = idxFloat * step + slideW / 2;
                var tx = vw / 2 - center;

                gsap.set(track, { x: tx, force3D: true });

                if (!entered) return;

                slides.forEach(function (s, i) {
                    var dist = Math.abs(i - idxFloat);
                    var scale = Math.max(0.9, 1 - dist * 0.08);
                    var opacity = Math.max(0.45, 1 - dist * 0.28);
                    gsap.set(s, { scale: scale, opacity: opacity });
                });

                var activeIdx = Math.round(idxFloat);
                if (activeIdx !== lastActiveIdx) {
                    dots.forEach(function (d, i) {
                        d.classList.toggle('active', i === activeIdx);
                    });
                    lastActiveIdx = activeIdx;
                }
            }

            var st = ScrollTrigger.create({
                trigger: section,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                onUpdate: function (self) { applyProgress(self.progress); },
                onRefresh: function (self) { applyProgress(self.progress); }
            });

            // Centre slide 0 in the viewport from first paint
            applyProgress(0);

            // Hand off scale/opacity from CSS keyframes to scrubbed scroll once
            // the entrance finishes. Briefly suppress the slide transition so
            // the keyframe end-state → scrub computed-state swap is instant.
            var handoffTimer = setTimeout(function () {
                slides.forEach(function (s) {
                    s.style.transition = 'none';
                    s.style.animation = 'none';
                });
                entered = true;
                applyProgress(st.progress);
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        slides.forEach(function (s) { s.style.transition = ''; });
                    });
                });
            }, ENTER_TOTAL_MS);

            return function cleanup() {
                clearTimeout(handoffTimer);
                st.kill();
                gsap.set(track, { clearProps: 'all' });
                slides.forEach(function (s) {
                    gsap.set(s, { clearProps: 'all' });
                    s.style.transition = '';
                    s.style.animation = '';
                });
            };
        });
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

