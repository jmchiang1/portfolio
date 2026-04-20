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

    // Rotating role title — sync wrapper width to the current role so each
    // role is visually centered (the whole heading stays centered via parent flex)
    (function () {
        var wrapper = document.querySelector('.rotator-wrapper');
        var items = document.querySelectorAll('.rotator-item');
        if (!wrapper || !items.length) return;

        function measureWidths() {
            return Array.from(items).map(function (item) {
                return item.getBoundingClientRect().width;
            });
        }

        var widths = measureWidths();
        wrapper.style.width = widths[0] + 'px';

        // CSS keyframe phase → item index (holds between these timestamps):
        //   0ms    → item 0 (Product Designer)
        //   2400ms → item 1 (Software Engineer)      [20% of 12s]
        //   4800ms → item 2 (Design Engineer)        [40%]
        //   7200ms → item 3 (Technical Product…)    [60%]
        //   9600ms → item 4 (Product Designer loop) [80%]
        var PHASE_STARTS_MS = [0, 2400, 4800, 7200, 9600];
        var CYCLE_MS = 12000;

        var startTime = performance.now();
        var currentPhase = 0;

        function tick() {
            var elapsed = (performance.now() - startTime) % CYCLE_MS;
            var phase = 0;
            for (var i = PHASE_STARTS_MS.length - 1; i >= 0; i--) {
                if (elapsed >= PHASE_STARTS_MS[i]) {
                    phase = i;
                    break;
                }
            }
            if (phase !== currentPhase) {
                wrapper.style.width = widths[phase] + 'px';
                currentPhase = phase;
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // Re-measure on resize / font-size changes
        window.addEventListener('resize', function () {
            widths = measureWidths();
            wrapper.style.width = widths[currentPhase] + 'px';
        });
    })();
})();

