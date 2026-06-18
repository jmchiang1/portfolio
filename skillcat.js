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
    }, {
        // Trigger as soon as ANY part of the next section is within 240px of
        // the bottom of the viewport — sections finish fading in *before*
        // the reader's eye reaches them, so no blank gap between sections.
        threshold: 0,
        rootMargin: '0px 0px 240px 0px',
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

// ============================================
// Before & After — wipe slider across the comparison strip.
// A native <input type="range"> drives the wipe position; we just sync the
// --pos CSS var so the clip-path and handle update together.
// ============================================
(function () {
    document.querySelectorAll('.sk-compare').forEach(function (cmp) {
        var input = cmp.querySelector('.sk-compare-input');
        if (!input) return;
        function update(v) {
            cmp.style.setProperty('--pos', v + '%');
        }
        input.addEventListener('input', function () {
            update(parseFloat(input.value));
        });
        // Initial sync — defaults to 0 so the Before strip is fully visible until drag.
        update(parseFloat(input.value) || 0);
    });
})();


// ============================================
// AI-in-the-process notes — collapsed to a compact pill (just the ✦ + label);
// clicking the toggle expands the note out to the full content width to reveal
// the detail. The collapsed width is measured from the toggle (--ai-note-collapsed)
// so the pill wraps its label exactly, whatever the font metrics resolve to.
// ============================================
(function () {
    var notes = Array.prototype.slice.call(document.querySelectorAll('.sk-ai-note'));
    if (!notes.length) return;

    function measure() {
        notes.forEach(function (note) {
            var toggle = note.querySelector('.sk-ai-note-toggle');
            var parent = note.parentElement;
            if (!toggle || !parent) return;
            var toggleW = Math.ceil(toggle.getBoundingClientRect().width);
            // collapsed pill = toggle's intrinsic width + the aside's L/R borders (2px + 1px),
            // with a 1px cushion so sub-pixel rounding never clips the label.
            note.style.setProperty('--ai-note-collapsed', (toggleW + 4) + 'px');
            // detail = the width that opens up beside the toggle at full span:
            // the section's content width − the aside borders − the toggle. Fixing
            // it keeps the detail text from reflowing as the note animates open.
            var full = parent.getBoundingClientRect().width;
            var detail = Math.max(0, Math.floor(full - 3 - toggleW));
            note.style.setProperty('--ai-note-detail', detail + 'px');
        });
    }

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure, { passive: true });

    // Click anywhere on the card to toggle. The handler lives on the card; clicks
    // on the inner button bubble up here, and keyboard activation of the button
    // (Enter / Space) fires a click that bubbles too — so it stays accessible.
    notes.forEach(function (note) {
        var toggle = note.querySelector('.sk-ai-note-toggle');
        note.addEventListener('click', function () {
            var open = note.classList.toggle('is-open');
            if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });
})();


// ============================================
// Showcase device toggle — swaps the redesign band between the mobile phone
// fan and the desktop browser-window deck. Hiding the inactive view with the
// `hidden` attribute (display:none) lets the per-item fade replay on each swap.
// ============================================
(function () {
    var toggle = document.querySelector('.sk-device-toggle');
    if (!toggle) return;
    var section = toggle.closest('.sk-showcase');
    if (!section) return;
    var btns = Array.prototype.slice.call(toggle.querySelectorAll('.sk-device-btn'));
    var views = Array.prototype.slice.call(section.querySelectorAll('.sk-device-view'));

    function activate(device, focus) {
        btns.forEach(function (b) {
            var on = b.getAttribute('data-device') === device;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
            b.tabIndex = on ? 0 : -1;
            if (on && focus) b.focus();
        });
        views.forEach(function (v) {
            var on = v.getAttribute('data-device') === device;
            v.classList.toggle('is-active', on);
            if (on) v.removeAttribute('hidden');
            else v.setAttribute('hidden', '');
        });
        toggle.classList.toggle('is-desktop', device === 'desktop');
    }

    btns.forEach(function (b, i) {
        b.addEventListener('click', function () { activate(b.getAttribute('data-device')); });
        b.addEventListener('keydown', function (e) {
            var dir = 0;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
            else return;
            e.preventDefault();
            var next = (i + dir + btns.length) % btns.length;
            activate(btns[next].getAttribute('data-device'), true);
        });
    });
})();


// ============================================
// NDA gate — blurs the redesigned screens (media inside sections marked
// .sk-nda) until the correct password is entered. The correct password adds
// .nda-unlocked to <body>, which reveals everything via CSS. This is a visual
// courtesy gate, not real security — the assets are still downloaded.
// ============================================
(function () {
    // ▸▸▸ Set your NDA password here ◂◂◂
    var PASSWORD = 'skillcat';
    var STORAGE_KEY = 'sk-nda-unlocked';

    var sections = Array.prototype.slice.call(document.querySelectorAll('.sk-nda'));
    var pill = document.querySelector('.sk-nda-pill');
    var modal = document.querySelector('.sk-nda-modal');
    if (!sections.length || !pill || !modal) return;

    var countEl = pill.querySelector('.sk-nda-count');
    var unlockBtn = pill.querySelector('.sk-nda-unlock');
    var form = modal.querySelector('.sk-nda-form');
    var input = modal.querySelector('.sk-nda-input');
    var errorEl = modal.querySelector('.sk-nda-error');
    var closeBtn = modal.querySelector('.sk-nda-modal-close');

    // Every protected media frame inside the protected sections.
    var frames = [];
    sections.forEach(function (sec) {
        var found = sec.querySelectorAll('.sk-lineup-frame, .sk-deck-frame, .sk-video-frame');
        Array.prototype.forEach.call(found, function (f) {
            // The admin-dashboard V1→Vn iterations are early WIP — not under NDA.
            if (f.closest('.sk-feature-switch--versions-desk')) return;
            frames.push(f);
        });
    });

    // Already unlocked in this browser? Reveal and skip the gate.
    var unlocked = false;
    try { unlocked = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}
    if (unlocked || !frames.length) {
        document.body.classList.add('nda-unlocked');
        return;
    }

    // Blur + cover each frame.
    frames.forEach(function (f) {
        f.classList.add('sk-nda-frame');
        var cover = document.createElement('div');
        cover.className = 'sk-nda-cover';
        cover.innerHTML =
            '<i class="hn hn-lock" aria-hidden="true"></i>' +
            '<span class="sk-nda-cover-label">NDA-protected</span>' +
            '<span class="sk-nda-cover-hint">tap to unlock</span>';
        cover.addEventListener('click', openModal);
        f.appendChild(cover);
    });

    countEl.textContent = frames.length;

    // Reveal (and animate in) the pill only once "The Redesign" section scrolls
    // into view — not on initial page load.
    var firstProtected = document.querySelector('.sk-showcase') || sections[0];
    if (firstProtected && 'IntersectionObserver' in window) {
        var pillIO = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                pill.removeAttribute('hidden');
                pillIO.disconnect();
            }
        }, { threshold: 0 });
        pillIO.observe(firstProtected);
    } else {
        pill.removeAttribute('hidden');
    }

    var lastFocused = null;

    function openModal() {
        lastFocused = document.activeElement;
        errorEl.setAttribute('hidden', '');
        input.value = '';
        modal.classList.remove('is-closing');
        modal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(function () { input.focus(); }, 60);
    }

    function closeModal() {
        modal.classList.add('is-closing');
        var done = false;
        var finish = function () {
            if (done) return;
            done = true;
            modal.removeEventListener('animationend', finish);
            modal.setAttribute('hidden', '');
            modal.classList.remove('is-closing');
            document.body.style.overflow = '';
            if (lastFocused && lastFocused.focus) lastFocused.focus();
        };
        modal.addEventListener('animationend', finish);
        setTimeout(finish, 320); // fallback (reduced motion / missed event)
    }

    function unlock() {
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
        // Reveal the screens (CSS transitions the blur/cover out).
        document.body.classList.add('nda-unlocked');
        // Close the modal instantly (the reveal is the feedback).
        modal.setAttribute('hidden', '');
        modal.classList.remove('is-closing');
        document.body.style.overflow = '';
        // Fade the pill out, then remove it + the covers once faded.
        pill.classList.add('is-closing');
        setTimeout(function () {
            pill.setAttribute('hidden', '');
            pill.classList.remove('is-closing');
            document.querySelectorAll('.sk-nda-cover').forEach(function (c) { c.remove(); });
        }, 500);
    }

    unlockBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
    });
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value === PASSWORD) {
            unlock();
        } else {
            errorEl.removeAttribute('hidden');
            input.value = '';
            input.focus();
        }
    });
})();
