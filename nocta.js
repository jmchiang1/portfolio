// Page entrance — dark bg with white dots → fade to white bg → dots expand to links
(function () {
    var cover = document.querySelector('.page-transition-cover');
    var navbar = document.querySelector('.navbar');

    // Phase 1: Dark background, white dots visible, navbar bg hidden
    navbar.classList.add('nav-dots-entrance');

    // Phase 2: After brief pause, start fading cover + transitioning navbar to light
    setTimeout(function () {
        // Fade out dark cover to reveal white page
        if (cover) {
            cover.style.transition = 'opacity 0.5s ease';
            cover.style.opacity = '0';
            setTimeout(function () { cover.remove(); }, 500);
        }

        // Transition dots from white to dark, bring in navbar bg
        navbar.classList.remove('nav-dots-entrance');
        navbar.classList.add('nav-dots-transition');
    }, 200);

    // Phase 3: After navbar bg settles, expand dots into nav-links
    setTimeout(function () {
        navbar.classList.remove('nav-dots-transition');
        navbar.classList.add('nav-dots-expanded');
    }, 700);
})();

// Exit animation when clicking logo to go back to home
(function () {
    var logo = document.querySelector('.nav-logo');
    if (!logo) return;

    logo.addEventListener('click', function (e) {
        var href = logo.getAttribute('href');
        if (!href) return;

        e.preventDefault();

        var navbar = document.querySelector('.navbar');

        // Step 1: Collapse nav-links into dots-three icon
        navbar.classList.remove('nav-dots-expanded');
        navbar.classList.add('nav-collapsing');

        // Fade out page content (but not navbar)
        document.body.classList.add('cs-exiting');

        // Step 2: After links collapse, transition navbar to dark state
        // (white dots, no bg) to match home page
        setTimeout(function () {
            navbar.classList.remove('nav-collapsing');
            navbar.classList.add('nav-dots-exit-dark');
        }, 350);

        // Step 3: Navigate after full transition
        setTimeout(function () {
            sessionStorage.setItem('nav-returning', 'true');
            window.location.href = href;
        }, 650);
    });
})();

// Scroll-triggered section animations
(function () {
    var sections = document.querySelectorAll('.cs-section, .cs-header, .cs-divider, .cs-hmw-section');

    // Immediately reveal the first section so it's visible when the page loads
    if (sections.length > 0) {
        sections[0].classList.add('cs-visible');
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('cs-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    sections.forEach(function (section, i) {
        if (i === 0) return; // skip first, already visible
        observer.observe(section);
    });
})();

// Back to top button visibility
(function () {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });
})();

// Active nav link tracking on scroll
(function () {
    var navLinks = document.querySelectorAll('.nav-links .nav-link');
    var sectionIds = [];

    navLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            sectionIds.push(href.substring(1));
        }
    });

    function updateActive() {
        var scrollY = window.scrollY + 120;
        var activeId = sectionIds[0];

        for (var i = 0; i < sectionIds.length; i++) {
            var el = document.getElementById(sectionIds[i]);
            if (el && el.offsetTop <= scrollY) {
                activeId = sectionIds[i];
            }
        }

        navLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (href === '#' + activeId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
})();
