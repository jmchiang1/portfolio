// ============================================
// ScriptChain Health case study — page transitions, scroll reveal, video embeds
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
// so the author can drop files into /assets/skillcat/ and they light up
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
// Flow selector — click a feature button to swap the phone video.
// The active flow's clip autoplays (muted, looping) for a live demo feel
// while the selector is on screen; others pause and reset. Tab / tabpanel
// pattern with arrow-key support.
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
            if (pr && pr.catch) pr.catch(function () { /* autoplay blocked — controls remain */ });
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
