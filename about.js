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

