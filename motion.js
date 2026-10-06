// Motion page — vibes-style grid layout
(function () {
    var cards = Array.from(document.querySelectorAll('.motion-card'));

    // Every thumbnail autoplays muted on loop so the grid feels alive.
    // Sound only kicks in once a card is opened into its modal (below).
    cards.forEach(function (card) {
        var video = card.querySelector('.project-video');
        if (!video) return;

        video.muted = true;
        video.loop = true;
        video.setAttribute('autoplay', '');
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
    });

    // ---- Project modal -------------------------------------------------
    // One shared modal. Opening a card flies its preview video into
    // .modal-video-target and shows the matching .modal-panel; prev/next
    // swaps the video + panel in place; closing flies the video back home.
    var modal = document.getElementById('motion-modal');
    var modalContent = modal.querySelector('.modal-content');
    var modalScroll = modal.querySelector('.modal-scroll');
    var target = modal.querySelector('.modal-video-target');
    var pagerCount = modal.querySelector('.modal-pager-count');
    var EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
    var FLY_RADIUS = '4px';
    var currentIndex = -1;
    var busy = false;

    function cardVideo(i) {
        return cards[i].querySelector('video');
    }

    function panelFor(i) {
        return modal.querySelector('.modal-panel[data-project="' + cards[i].getAttribute('data-modal') + '"]');
    }

    function playQuietly(video) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
    }

    // Shared fly helper — moves `video` into a fixed wrapper at `from`,
    // transitions it to `to`, then hands it to `done`.
    function fly(video, from, to, fromRadius, toRadius, done) {
        var flyingEl = document.createElement('div');
        flyingEl.className = 'flying-video';
        flyingEl.style.left = from.left + 'px';
        flyingEl.style.top = from.top + 'px';
        flyingEl.style.width = from.width + 'px';
        flyingEl.style.height = from.height + 'px';
        flyingEl.style.borderRadius = fromRadius;

        video.classList.remove('project-video');
        flyingEl.appendChild(video);
        document.body.appendChild(flyingEl);
        playQuietly(video);

        flyingEl.offsetHeight;
        requestAnimationFrame(function () {
            flyingEl.style.left = to.left + 'px';
            flyingEl.style.top = to.top + 'px';
            flyingEl.style.width = to.width + 'px';
            flyingEl.style.height = to.height + 'px';
            flyingEl.style.borderRadius = toRadius;
        });

        var finished = false;
        function finish(e) {
            if (finished || (e && e.target !== flyingEl)) return;
            finished = true;
            flyingEl.removeEventListener('transitionend', finish);
            done(video);
            flyingEl.remove();
        }
        flyingEl.addEventListener('transitionend', finish);
        setTimeout(finish, 700); // safety net if transitionend never fires
    }

    // Portrait tiles (panels with data-video-bg) letterbox inside the 16:9
    // slot on their own background colour, and stay uncropped while flying
    function fitToPanel(video, panel) {
        var bg = panel && panel.getAttribute('data-video-bg');
        video.style.objectFit = bg ? 'contain' : '';
        video.style.background = bg || '';
    }

    // Drop a video into the modal slot (sound + controls if the panel allows)
    function mountInTarget(video, panel) {
        fitToPanel(video, panel);
        target.appendChild(video);
        if (panel && panel.hasAttribute('data-unmute')) {
            video.muted = false;
            video.controls = true;
        }
        playQuietly(video);
    }

    // Return a video to its card frame as a muted, looping thumbnail
    function mountInCard(video, i) {
        var frame = cards[i].querySelector('.motion-card-frame');
        var overlay = frame.querySelector('.motion-card-frame-overlay');
        video.muted = true;
        video.controls = false;
        fitToPanel(video, null);
        video.classList.add('project-video');
        frame.insertBefore(video, overlay);
        playQuietly(video);
    }

    function pauseExtras(panel) {
        if (!panel) return;
        panel.querySelectorAll('.modal-extras video').forEach(function (v) { v.pause(); });
    }

    // Show panel i (hidden attr + dialog label + counter); fade items start hidden
    function showPanel(i) {
        modal.querySelectorAll('.modal-panel').forEach(function (p) { p.hidden = true; });
        var panel = panelFor(i);
        if (panel) panel.hidden = false;
        target.style.background = (panel && panel.getAttribute('data-video-bg')) || '';
        // Mobile recordings get a tall video column with the info beside it
        modal.classList.toggle('modal-portrait', !!(panel && panel.hasAttribute('data-portrait')));
        var title = panel && panel.querySelector('.modal-title');
        modalContent.setAttribute('aria-label', title ? title.textContent.trim() : '');
        pagerCount.textContent = (i + 1) + '/' + cards.length;
        modalScroll.scrollTop = 0;
        return panel;
    }

    function revealFadeItems(panel) {
        if (!panel) return;
        panel.querySelectorAll('.modal-fade-in').forEach(function (el, i) {
            setTimeout(function () { el.classList.add('revealed'); }, i * 80);
        });
    }

    function hideFadeItems() {
        modal.querySelectorAll('.modal-fade-in').forEach(function (el) { el.classList.remove('revealed'); });
    }

    function openModal(i) {
        if (busy || currentIndex !== -1) return;
        busy = true;
        currentIndex = i;
        var video = cardVideo(i);
        var fromRect = video.getBoundingClientRect();

        hideFadeItems();
        var panel = showPanel(i);
        modal.classList.add('modal-open', 'modal-animated');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.offsetHeight;

        fitToPanel(video, panel);
        fly(video, fromRect, target.getBoundingClientRect(), FLY_RADIUS, '0px', function (v) {
            mountInTarget(v, panel);
            revealFadeItems(panel);
            busy = false;
        });
    }

    function closeModal() {
        if (busy || currentIndex === -1) return;
        busy = true;
        var i = currentIndex;
        var video = target.querySelector('video');
        var panel = panelFor(i);
        pauseExtras(panel);
        hideFadeItems();

        var fromRect = target.getBoundingClientRect();
        // Bring the owning card on screen first (it may have changed via
        // prev/next) so the video has somewhere visible to land.
        var frame = cards[i].querySelector('.motion-card-frame');
        var frameRect = frame.getBoundingClientRect();
        if (frameRect.bottom < 0 || frameRect.top > window.innerHeight) {
            window.scrollTo({
                top: window.scrollY + frameRect.top - (window.innerHeight - frameRect.height) / 2,
                behavior: 'instant'
            });
            frameRect = frame.getBoundingClientRect();
        }

        video.muted = true;
        video.controls = false;
        modal.classList.remove('modal-open', 'modal-animated');
        modal.setAttribute('aria-hidden', 'true');

        fly(video, fromRect, frameRect, '0px', FLY_RADIUS, function (v) {
            mountInCard(v, i);
            document.body.style.overflow = '';
            currentIndex = -1;
            busy = false;
        });
    }

    // Prev/next — slide the card out, swap video + panel, slide back in
    function step(dir) {
        if (busy || currentIndex === -1) return;
        busy = true;
        var prev = currentIndex;
        var next = (prev + dir + cards.length) % cards.length;
        var shift = dir > 0 ? -40 : 40;

        var out = modalContent.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(' + shift + 'px)' }
        ], { duration: 180, easing: 'ease-in', fill: 'forwards' });

        out.onfinish = function () {
            pauseExtras(panelFor(prev));
            var oldVideo = target.querySelector('video');
            if (oldVideo) mountInCard(oldVideo, prev);

            hideFadeItems();
            currentIndex = next;
            var panel = showPanel(next);
            var video = cardVideo(next);
            video.classList.remove('project-video');
            mountInTarget(video, panel);

            var inAnim = modalContent.animate([
                { opacity: 0, transform: 'translateX(' + (-shift) + 'px)' },
                { opacity: 1, transform: 'translateX(0)' }
            ], { duration: 380, easing: EASE_OUT });
            out.cancel();
            revealFadeItems(panel);
            inAnim.onfinish = function () { busy = false; };
        };
    }

    cards.forEach(function (card, i) {
        card.addEventListener('click', function () { openModal(i); });
    });

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-prev').addEventListener('click', function () { step(-1); });
    modal.querySelector('.modal-next').addEventListener('click', function () { step(1); });

    // Close on backdrop click (outside the card / pager)
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    // Escape closes; arrow keys page through projects
    document.addEventListener('keydown', function (e) {
        if (currentIndex === -1) return;
        if (e.key === 'Escape') return closeModal();
        if (e.target.tagName === 'VIDEO') return; // let focused videos seek
        if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
    });

    // Desktop nav-link + logo exits — handled by the shared GSAP transitions module
    if (window.PageTransitions) PageTransitions.bindNavLinks();

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
                    if (window.PageTransitions) PageTransitions.exit(href);
                    else window.location.href = href;
                });
            });
        });
    }
})();
