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
})();

// Show social links when Experience section is in view, hide when scrolled above it
(function () {
    var experienceSection = document.getElementById('experience');
    var socialLinks = document.querySelector('.social-links');
    if (!experienceSection || !socialLinks) return;

    function checkVisibility() {
        var rect = experienceSection.getBoundingClientRect();
        // Show when Experience reaches the middle of the screen
        if (rect.top < window.innerHeight / 2) {
            socialLinks.classList.remove('social-hidden');
        } else {
            socialLinks.classList.add('social-hidden');
        }
    }

    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();
})();
