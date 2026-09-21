// ============================================
// Apollo Racket Club case study — page transitions, scroll reveal, media embeds
// ============================================

// Page entrance — fade cover away, stagger nav-links in
(function () {
    var cover = document.querySelector('.page-transition-cover');
    var navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.add('nav-entering');

    setTimeout(function () {
        if (cover) {
            cover.style.transition = 'opacity 0.28s cubic-bezier(0.25, 0.1, 0.25, 1)';
            cover.style.opacity = '0';
            setTimeout(function () { cover.remove(); }, 300);
        }
    }, 50);
})();

// Exit animation for navigation + mobile menu
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
        if (logoEl) { logoEl.style.animation = 'none'; logoEl.style.opacity = '1'; }

        navbar.offsetHeight; // reflow

        navbar.classList.add('nav-exiting');
        document.body.classList.add('cs-exiting');

        setTimeout(function () { window.location.href = href; }, 300);
    }

    var logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', function (e) {
            e.preventDefault();
            triggerExit(logo.getAttribute('href'));
        });
    }

    document.querySelectorAll('.nav-link').forEach(function (link) {
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
        mobileMenu.querySelectorAll('.mobile-menu-link').forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href || href === '#' || href.startsWith('#')) return;
            link.addEventListener('click', function (e) {
                e.preventDefault();
                closeMenu(function () { triggerExit(href); });
            });
        });
    }
})();

// Scroll-triggered section reveal
(function () {
    var sections = document.querySelectorAll('.cs-section, .cs-header, .cs-divider');
    if (sections.length > 0) sections[0].classList.add('cs-visible');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('cs-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

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
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
})();

// ============================================
// Video / embed source probing.
// Each .sk-video shows a labeled placeholder until its real source exists.
// We probe the source (metadata only) and reveal the media once it loads,
// so the author can drop files into /assets/apollo/ and they light up
// automatically — no markup changes needed.
// ============================================
(function () {
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.sk-video').forEach(function (fig) {
        var video = fig.querySelector('video.sk-video-el');
        var img = fig.querySelector('img.sk-embed-img');

        function reveal() { fig.classList.add('is-ready'); }

        // Static image embed (e.g. spec sample)
        if (img && !video) {
            var srcImg = img.getAttribute('src');
            if (!srcImg) return;
            var probeImg = new Image();
            probeImg.onload = reveal;
            probeImg.src = srcImg;
            return;
        }

        if (!video) return;

        var sourceEl = video.querySelector('source');
        var src = sourceEl ? sourceEl.getAttribute('src') : video.getAttribute('src');
        if (!src) return;

        var wantsAutoplay = video.hasAttribute('autoplay');
        var replay = fig.querySelector('.sk-replay');

        // Probe with a throwaway element so we don't fight the real <video>.
        var probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.muted = true;

        probe.addEventListener('loadedmetadata', function () {
            reveal();
            video.preload = 'metadata';
            video.load();

            if (wantsAutoplay && !reduceMotion) {
                var p = video.play();
                if (p && p.catch) p.catch(function () { /* autoplay blocked — controls/replay remain */ });
            }
            if (replay) {
                replay.hidden = false;
                replay.addEventListener('click', function () {
                    video.currentTime = 0;
                    var pr = video.play();
                    if (pr && pr.catch) pr.catch(function () {});
                });
            }
        });

        // error → source not present yet; keep the placeholder.
        probe.addEventListener('error', function () { /* no-op */ });

        probe.src = src;
    });
})();

// ============================================
// V1 / V2 identity toggle.
// Tab / tabpanel pattern with arrow-key support. The outgoing panel plays its
// exit before the incoming one enters, so switching back mirrors switching
// forward instead of cutting.
// ============================================
(function () {
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var OUT = 160;

    document.querySelectorAll('[data-versions]').forEach(function (root) {
        var tabs = Array.prototype.slice.call(root.querySelectorAll('.ap-ver-tab'));
        var panels = Array.prototype.slice.call(root.querySelectorAll('.ap-ver-panel'));
        if (tabs.length < 2) return;

        var busy = false;

        function panelFor(ver) {
            return panels.filter(function (p) { return p.getAttribute('data-ver') === ver; })[0];
        }

        function activate(ver, focus) {
            var next = panelFor(ver);
            var current = panels.filter(function (p) { return p.classList.contains('is-active'); })[0];
            if (!next || busy || current === next) return;

            tabs.forEach(function (t) {
                var on = t.getAttribute('data-ver') === ver;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
                if (on && focus) t.focus();
            });

            function show() {
                next.classList.add('is-active', 'is-entering');
                if (reduceMotion) {
                    next.classList.remove('is-entering');
                    busy = false;
                    return;
                }
                // Next frame, drop is-entering so the transition runs.
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        next.classList.remove('is-entering');
                        busy = false;
                    });
                });
            }

            if (!current || reduceMotion) {
                if (current) current.classList.remove('is-active', 'is-leaving');
                show();
                return;
            }

            busy = true;
            current.classList.add('is-leaving');
            setTimeout(function () {
                current.classList.remove('is-active', 'is-leaving');
                show();
            }, OUT);
        }

        tabs.forEach(function (tab, i) {
            tab.addEventListener('click', function () {
                activate(tab.getAttribute('data-ver'));
            });
            tab.addEventListener('keydown', function (e) {
                var dir = 0;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
                else return;
                e.preventDefault();
                var nextTab = tabs[(i + dir + tabs.length) % tabs.length];
                activate(nextTab.getAttribute('data-ver'), true);
            });
        });
    });
})();
