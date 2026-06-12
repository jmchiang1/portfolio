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

// Pause off-screen videos. The page ships several autoplay/loop clips; letting
// them all decode at once makes scrolling janky, so only the ones near the
// viewport are kept playing.
(function () {
    var vids = document.querySelectorAll('video[autoplay]');
    if (!vids.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            var v = entry.target;
            if (entry.isIntersecting) {
                var p = v.play();
                if (p && p.catch) p.catch(function () {});
            } else {
                v.pause();
            }
        });
    }, { rootMargin: '200px 0px' });

    vids.forEach(function (v) { io.observe(v); });
})();

// ============================================
// Iterations toggle — V1 / V2 / V3 segmented control swaps the phone row.
// The sliding thumb is positioned by the active button's index (--i); hiding
// the inactive views with `hidden` lets the per-phone stagger replay on swap.
// ============================================
(function () {
    var toggle = document.querySelector('.nx-iter-toggle');
    if (!toggle) return;
    var section = toggle.closest('#iterations');
    if (!section) return;
    var btns = Array.prototype.slice.call(toggle.querySelectorAll('.nx-iter-btn'));
    var views = Array.prototype.slice.call(section.querySelectorAll('.nx-iter-view'));

    function activate(ver, focus) {
        btns.forEach(function (b, i) {
            var on = b.getAttribute('data-ver') === ver;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
            b.tabIndex = on ? 0 : -1;
            if (on) {
                toggle.style.setProperty('--i', i);
                if (focus) b.focus();
            }
        });
        views.forEach(function (v) {
            var on = v.getAttribute('data-ver') === ver;
            v.classList.toggle('is-active', on);
            if (on) v.removeAttribute('hidden');
            else v.setAttribute('hidden', '');
        });
    }

    btns.forEach(function (b, i) {
        b.addEventListener('click', function () { activate(b.getAttribute('data-ver')); });
        b.addEventListener('keydown', function (e) {
            var dir = 0;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
            else return;
            e.preventDefault();
            var next = (i + dir + btns.length) % btns.length;
            activate(btns[next].getAttribute('data-ver'), true);
        });
    });
})();

// ============================================
// Competitor lightbox — click a card to see all of that competitor's screens.
// Image paths are built from the card's data-comp + data-count:
//   assets/nocta/competition/<comp>/<comp>-<n>.png
// ============================================
(function () {
    var lb = document.getElementById('nx-lightbox');
    if (!lb) return;
    var titleEl = lb.querySelector('.nx-lightbox-title');
    var rowEl = lb.querySelector('.nx-lightbox-row');
    var closeBtn = lb.querySelector('.nx-lightbox-close');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.nx-comp-card[data-comp]'));
    var lastFocused = null;

    function open(card) {
        var comp = card.getAttribute('data-comp');
        var count = parseInt(card.getAttribute('data-count'), 10) || 0;
        var nameEl = card.querySelector('.nx-comp-name');
        var name = nameEl ? nameEl.textContent : comp;
        titleEl.textContent = name;
        rowEl.innerHTML = '';
        for (var i = 1; i <= count; i++) {
            var img = document.createElement('img');
            img.src = 'assets/nocta/competition/' + comp + '/' + comp + '-' + i + '.png';
            img.alt = name + ' — screen ' + i + ' of ' + count;
            img.loading = 'lazy';
            rowEl.appendChild(img);
        }
        rowEl.scrollLeft = 0;
        lastFocused = card;
        lb.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function close() {
        lb.setAttribute('hidden', '');
        rowEl.innerHTML = '';
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    cards.forEach(function (card) {
        card.addEventListener('click', function () { open(card); });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
        });
    });

    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !lb.hasAttribute('hidden')) close();
    });
})();

