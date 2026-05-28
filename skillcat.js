// ============================================
// SkillCat case study — page transitions, scroll reveal, video embeds
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

// ============================================
// Iteration scrubber — drag V1 → V2 → V3 and all 5 phones cross-fade
// together. Drives a native range input (for keyboard + drag) and tweens
// to a stop when a stop button is clicked.
// ============================================
(function () {
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.sk-scrubber').forEach(function (scrub) {
        var input = scrub.querySelector('.sk-scrubber-input');
        var thumb = scrub.querySelector('.sk-scrubber-thumb');
        var fill  = scrub.querySelector('.sk-scrubber-fill');
        var ticks = scrub.querySelectorAll('.sk-scrubber-tick');
        var stops = scrub.querySelectorAll('.sk-scrub-stop');
        var phones = scrub.querySelectorAll('.sk-scrub-phone');
        if (!input || !phones.length) return;

        var stopCount = stops.length || 3;
        var max = stopCount - 1;

        function update(t) {
            if (t < 0) t = 0; else if (t > max) t = max;
            var pct = (t / max) * 100;
            if (thumb) thumb.style.left = pct + '%';
            if (fill) fill.style.width = pct + '%';

            // Each version's opacity peaks at its stop and falls off linearly
            // toward its neighbours (1 at its own stop, 0 at the adjacent ones).
            phones.forEach(function (p) {
                var imgs = p.querySelectorAll('img');
                imgs.forEach(function (img, i) {
                    img.style.opacity = Math.max(0, 1 - Math.abs(t - i));
                });
            });

            // Stop label: the nearest one is "active"
            var nearest = Math.round(t);
            stops.forEach(function (s, i) {
                s.classList.toggle('is-active', i === nearest);
            });
            ticks.forEach(function (tk, i) {
                tk.classList.toggle('is-passed', t >= i - 0.001);
            });
        }

        function placeTicks() {
            ticks.forEach(function (tk, i) {
                tk.style.left = ((i / max) * 100) + '%';
            });
        }

        input.addEventListener('input', function () {
            update(parseFloat(input.value));
        });

        function tweenTo(target) {
            var from = parseFloat(input.value);
            if (reduceMotion) { input.value = target; update(target); return; }
            var dur = 450, start = performance.now();
            function step(now) {
                var k = Math.min(1, (now - start) / dur);
                var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
                var v = from + (target - from) * e;
                input.value = v;
                update(v);
                if (k < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        stops.forEach(function (s, i) {
            s.addEventListener('click', function () { tweenTo(i); });
        });

        placeTicks();
        update(parseFloat(input.value) || 0);
    });
})();

// ============================================
// Testing — per-flow tabs.
// The 3 flow-result cards in #testing act as a tablist; clicking one swaps the
// .sk-flow-panel below. Arrow keys move between tabs (with wrap). Uses the same
// data-flow scoping pattern as sk-feature-switch, but the cards aren't .sk-feature-btn
// so they need their own tiny activator.
// ============================================
(function () {
    var list = document.querySelector('#testing .sk-flow-results[role="tablist"]');
    if (!list) return;

    var tabs = Array.prototype.slice.call(list.querySelectorAll('.sk-flow-result[role="tab"]'));
    var panels = Array.prototype.slice.call(
        document.querySelectorAll('#testing .sk-flow-panels .sk-flow-panel[role="tabpanel"]')
    );
    if (!tabs.length || !panels.length) return;

    function activate(flow, focus) {
        tabs.forEach(function (t) {
            var on = t.getAttribute('data-flow') === flow;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
            t.tabIndex = on ? 0 : -1;
            if (on && focus) t.focus();
        });
        panels.forEach(function (p) {
            var on = p.getAttribute('data-flow') === flow;
            p.classList.toggle('is-active', on);
            // [hidden] mirrors .is-active so AT users get the same view as sighted users.
            if (on) p.removeAttribute('hidden');
            else p.setAttribute('hidden', '');
        });
    }

    tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () {
            activate(tab.getAttribute('data-flow'));
        });
        tab.addEventListener('keydown', function (e) {
            var dir = 0;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
            else if (e.key === 'Home') { activate(tabs[0].getAttribute('data-flow'), true); e.preventDefault(); return; }
            else if (e.key === 'End') { activate(tabs[tabs.length - 1].getAttribute('data-flow'), true); e.preventDefault(); return; }
            else return;
            e.preventDefault();
            var next = (i + dir + tabs.length) % tabs.length;
            activate(tabs[next].getAttribute('data-flow'), true);
        });
    });
})();
