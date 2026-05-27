// Page entrance — fade black cover to white, stagger nav-links down
(function () {
    var cover = document.querySelector('.page-transition-cover');
    var navbar = document.querySelector('.navbar');

    // Start nav-links entrance animation
    navbar.classList.add('nav-entering');

    // Fade out black cover to reveal white page
    setTimeout(function () {
        if (cover) {
            cover.style.transition = 'opacity 0.28s cubic-bezier(0.25, 0.1, 0.25, 1)';
            cover.style.opacity = '0';
            setTimeout(function () { cover.remove(); }, 300);
        }
    }, 50);
})();

// Exit animation for navigation
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

        if (logoEl) {
            logoEl.style.animation = 'none';
            logoEl.style.opacity = '1';
        }

        navbar.offsetHeight;

        navbar.classList.add('nav-exiting');
        document.body.classList.add('cs-exiting');

        setTimeout(function () {
            window.location.href = href;
        }, 340);
    }

    var logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', function (e) {
            e.preventDefault();
            triggerExit(logo.getAttribute('href'));
        });
    }

    var allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#')) return;
        link.addEventListener('click', function (e) {
            e.preventDefault();
            triggerExit(href);
        });
    });

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
                closeMenu(function () { triggerExit(href); });
            });
        });
    }
})();

// Scroll-triggered section animations
(function () {
    var sections = document.querySelectorAll('.cs-section, .cs-header, .cs-divider');

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
        if (i === 0) return;
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

// ============================================
// Feature switch — click a tab to swap the Solution Overview clip.
// The active clip autoplays (muted, looping) while the switch is on screen;
// others pause and reset. Tab / tabpanel pattern with arrow-key support.
// Mirrors SkillCat's sk-feature-switch behavior.
// ============================================
(function () {
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.sk-feature-switch').forEach(function (sw) {
        var btns = Array.prototype.slice.call(sw.querySelectorAll('.sk-feature-btn'));
        var panels = Array.prototype.slice.call(sw.querySelectorAll('.sk-feature-panel'));
        if (!btns.length) return;

        var inView = false;

        function activeVideo() {
            var p = sw.querySelector('.sk-feature-panel.is-active');
            return p && p.querySelector('video');
        }
        function playActive() {
            if (reduceMotion || !inView) return;
            var v = activeVideo();
            if (!v) return;
            v.muted = true; v.loop = true;
            var pr = v.play();
            if (pr && pr.catch) pr.catch(function () { /* autoplay blocked */ });
        }
        function activate(flow, focus) {
            btns.forEach(function (b) {
                var on = b.getAttribute('data-flow') === flow;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
                if (on && focus) b.focus();
            });
            panels.forEach(function (p) {
                var on = p.getAttribute('data-flow') === flow;
                p.classList.toggle('is-active', on);
                var v = p.querySelector('video');
                if (v && !on) { try { v.pause(); v.currentTime = 0; } catch (e) {} }
            });
            playActive();
        }

        btns.forEach(function (b, i) {
            b.addEventListener('click', function () { activate(b.getAttribute('data-flow')); });
            b.addEventListener('keydown', function (e) {
                var dir = 0;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') dir = 1;
                else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') dir = -1;
                else return;
                e.preventDefault();
                var next = (i + dir + btns.length) % btns.length;
                activate(btns[next].getAttribute('data-flow'), true);
            });
        });

        // Only autoplay while the selector is actually on screen.
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    inView = e.isIntersecting;
                    if (inView) playActive();
                    else { var v = activeVideo(); if (v) { try { v.pause(); } catch (err) {} } }
                });
            }, { threshold: 0.25 }).observe(sw);
        } else {
            inView = true; playActive();
        }
    });
})();
