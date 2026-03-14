// Page entrance — fade black cover to white, stagger nav-links down
(function () {
    var cover = document.querySelector('.page-transition-cover');
    var navbar = document.querySelector('.navbar');

    // Start nav-links entrance animation
    navbar.classList.add('nav-entering');

    // Fade out black cover to reveal white page
    setTimeout(function () {
        if (cover) {
            cover.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
            cover.style.opacity = '0';
            setTimeout(function () { cover.remove(); }, 400);
        }
    }, 50);
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
        var navLinks = navbar.querySelectorAll('.nav-link');

        // Freeze nav-links at their current visible state
        navLinks.forEach(function (link) {
            link.style.animation = 'none';
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        });

        // Force reflow so inline styles apply before transition starts
        navbar.offsetHeight;

        // Animate everything out simultaneously
        navbar.classList.add('nav-exiting');
        document.body.classList.add('cs-exiting');

        // Navigate after exit animation completes
        setTimeout(function () {
            window.location.href = href;
        }, 700);
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
