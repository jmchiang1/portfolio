// 3D Carousel with wheel-driven navigation
(function () {
    var container = document.querySelector('.scroll-container');
    var glow = document.querySelector('.glow');
    var heroContent = document.querySelector('.hero-content');
    var footerInfo = document.querySelector('.footer-info');
    var carouselSection = document.getElementById('projects');
    var cards = Array.from(document.querySelectorAll('.project-card'));
    var totalCards = cards.length;

    // Carousel counter
    var counter = document.querySelector('.carousel-counter');
    var counterCurrent = counter && counter.querySelector('.counter-current');
    var counterTotal = counter && counter.querySelector('.counter-total');
    var counterName = counter && counter.querySelector('.counter-name');

    // Carousel prev/next buttons — desktop nav for the carousel view.
    var navPrev = document.querySelector('.carousel-nav-prev');
    var navNext = document.querySelector('.carousel-nav-next');
    var cardNames = cards.map(function (c) {
        var titleEl = c.querySelector('.project-title');
        // strip any trailing icon text — use only the leading text node
        return titleEl ? titleEl.firstChild.textContent.trim() : '';
    });
    if (counterTotal) counterTotal.textContent = String(totalCards).padStart(2, '0');

    function pad2(n) { return String(n).padStart(2, '0'); }

    function updateCounter() {
        if (!counter) return;
        counterCurrent.textContent = pad2(activeIndex + 1);
        var newName = cardNames[activeIndex];
        if (counterName.textContent !== newName) {
            counterName.classList.add('counter-name-changing');
            setTimeout(function () {
                counterName.textContent = newName;
                counterName.classList.remove('counter-name-changing');
            }, 180);
        }
    }

    function setCounterVisible(visible) {
        if (!counter) return;
        counter.classList.toggle('counter-visible', visible);
    }

    // Mirrors the counter's visibility so the prev/next buttons hide with it.
    function setNavVisible(visible) {
        if (navPrev) navPrev.classList.toggle('nav-visible', visible);
        if (navNext) navNext.classList.toggle('nav-visible', visible);
    }

    // Layout toggle — FLIP animate the same cards between carousel and 2-col grid.
    // Mobile only has the carousel view; the grid + toggle are hidden by CSS.
    var layoutToggle = document.querySelector('.layout-toggle');
    var layoutMode = 'carousel'; // 'carousel' or 'grid'
    var FLIP_DURATION = 700;
    var FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

    function flipCards(applyClassChange) {
        // First — capture current positions/sizes
        var first = cards.map(function (c) {
            var r = c.getBoundingClientRect();
            return { left: r.left, top: r.top, width: r.width, height: r.height };
        });

        // Apply layout change (instant)
        applyClassChange();

        // Last — read new positions/sizes after reflow
        var last = cards.map(function (c) {
            var r = c.getBoundingClientRect();
            return { left: r.left, top: r.top, width: r.width, height: r.height };
        });

        // Invert + Play — animate each card from its old position to identity
        cards.forEach(function (card, i) {
            var f = first[i];
            var l = last[i];
            // Skip if card has no real layout (e.g. width 0)
            if (l.width === 0 || l.height === 0) return;

            var dx = f.left - l.left;
            var dy = f.top - l.top;
            var sx = f.width / l.width;
            var sy = f.height / l.height;

            // Cancel pos-* class transforms during FLIP by setting inline transform
            card.style.transition = 'none';
            card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ')';
            card.style.transformOrigin = 'top left';

            // Force reflow so the inverse transform is committed before we animate
            card.offsetHeight;

            // Play
            card.style.transition = 'transform ' + FLIP_DURATION + 'ms ' + FLIP_EASING;
            card.style.transform = '';

            // Cleanup after animation
            (function (cardEl) {
                setTimeout(function () {
                    cardEl.style.transition = '';
                    cardEl.style.transform = '';
                    cardEl.style.transformOrigin = '';
                }, FLIP_DURATION + 50);
            })(card);
        });
    }

    // FLIP a list of elements through a layout change — they smoothly translate
    // (and scale) from their old positions to their new ones.
    function flipElements(elements, applyFn, duration, easing) {
        duration = duration || FLIP_DURATION;
        easing = easing || FLIP_EASING;

        var firsts = elements.map(function (el) {
            return el.getBoundingClientRect();
        });

        applyFn();

        var lasts = elements.map(function (el) {
            return el.getBoundingClientRect();
        });

        elements.forEach(function (el, i) {
            var f = firsts[i];
            var l = lasts[i];
            if (l.width === 0 || l.height === 0) return;
            if (f.width === 0 || f.height === 0) return;

            var dx = f.left - l.left;
            var dy = f.top - l.top;
            var sx = f.width / l.width;
            var sy = f.height / l.height;

            el.style.transition = 'none';
            el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ')';
            el.style.transformOrigin = 'top left';

            // Force reflow so the inverse transform is committed before we animate
            el.offsetHeight;

            el.style.transition = 'transform ' + duration + 'ms ' + easing;
            el.style.transform = '';

            (function (elRef) {
                setTimeout(function () {
                    elRef.style.transition = '';
                    elRef.style.transform = '';
                    elRef.style.transformOrigin = '';
                }, duration + 50);
            })(el);
        });
    }

    // Cross-fade: fade everything out together, swap layout, then stagger fade-in.
    // The stagger order is determined by the caller so each mode can flow naturally.
    function crossFade(applyFn, getStaggerOrder) {
        var FADE_OUT_MS = 220;
        var FADE_IN_MS = 380;
        var STAGGER_MS = 70;
        var EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
        // Preserve the cards' CSS transform transition so they still rotate
        // smoothly into pos-* positions if user navigates during the cross-fade
        var CARD_TRANSFORM_TRANSITION = 'transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)';
        var allElements = [heroContent, footerInfo].concat(cards);

        function transitionFor(el, opacityRule) {
            // Cards need transform transition preserved; hero/footer just need opacity
            return cards.indexOf(el) !== -1
                ? opacityRule + ', ' + CARD_TRANSFORM_TRANSITION
                : opacityRule;
        }

        // Fade everything out simultaneously (no stagger going out — keeps it snappy)
        allElements.forEach(function (el) {
            el.style.transition = transitionFor(el, 'opacity ' + FADE_OUT_MS + 'ms ' + EASE);
            el.style.opacity = '0';
        });

        setTimeout(function () {
            applyFn();
            // Force reflow so the new layout is committed before fading back in
            document.body.offsetHeight;

            var orderedElements = getStaggerOrder
                ? getStaggerOrder(heroContent, footerInfo, cards)
                : allElements;

            orderedElements.forEach(function (el, i) {
                var delay = i * STAGGER_MS;
                var opacityRule = 'opacity ' + FADE_IN_MS + 'ms ' + EASE + ' ' + delay + 'ms';
                el.style.transition = transitionFor(el, opacityRule);
                el.style.opacity = '1';
            });

            // Cleanup after the last element finishes its fade-in
            var totalDuration = (orderedElements.length - 1) * STAGGER_MS + FADE_IN_MS + 50;
            setTimeout(function () {
                orderedElements.forEach(function (el) {
                    el.style.transition = '';
                    el.style.opacity = '';
                });
            }, totalDuration);
        }, FADE_OUT_MS);
    }

    function setGridMode() {
        crossFade(function () {
            layoutMode = 'grid';
            document.body.classList.add('grid-mode');
            heroContent.classList.remove('hero-hidden');
            footerInfo.classList.remove('footer-hidden');
        }, function (hero, footer, cardsArr) {
            // Top-to-bottom: hero → footer (sits just below hero) → cards row by row
            return [hero, footer].concat(cardsArr);
        });

        if (layoutToggle) {
            layoutToggle.querySelector('i').className = 'hn hn-image';
            layoutToggle.setAttribute('data-tooltip', 'Layout: Carousel view');
            layoutToggle.setAttribute('aria-label', 'Switch to carousel view');
        }
        cards.forEach(function (c) {
            var v = c.querySelector('.project-video');
            if (v) v.pause();
        });
    }

    function setCarouselMode() {
        if (window.scrollY > 0) window.scrollTo(0, 0);

        crossFade(function () {
            layoutMode = 'carousel';
            document.body.classList.remove('grid-mode');
        }, function (hero, footer, cardsArr) {
            // Hero + footer are the visible elements in carousel mode — surface them
            // first so neither feels delayed, then stagger the cards (most offscreen)
            return [hero, footer].concat(cardsArr);
        });

        if (layoutToggle) {
            layoutToggle.querySelector('i').className = 'hn hn-grid';
            layoutToggle.setAttribute('data-tooltip', 'Layout: Grid view');
            layoutToggle.setAttribute('aria-label', 'Switch to grid view');
        }
    }

    if (layoutToggle) {
        layoutToggle.addEventListener('click', function () {
            if (layoutMode === 'carousel') setGridMode();
            else setCarouselMode();
        });
    }

    // Card-indexed glow colors (matches DOM card order):
    // Nocta=blue, ScriptChain=green, Robinhood=gold, SkillCat=orange,
    // Reveal=blue, NovaCore=violet, Mindscapes=pink
    var GLOW_COLORS = ['blue', 'green', 'gold', 'orange', 'blue', 'violet', 'pink'];
    var POS_CLASSES = ['pos-center', 'pos-left', 'pos-right', 'pos-far-left', 'pos-far-right',
                       'pos-hero-peek', 'pos-back-left', 'pos-back-right'];

    var activeIndex = 0;
    var isTransitioning = false;
    var TRANSITION_MS = 450;

    // Glow entry animation → hand off to CSS transitions
    glow.addEventListener('animationend', function handler(e) {
        if (e.animationName === 'glow-enter') {
            glow.classList.add('glow-ready');
            glow.removeEventListener('animationend', handler);
        }
    });

    function removePositions(card) {
        POS_CLASSES.forEach(function (cls) { card.classList.remove(cls); });
    }

    // The cards sit on one ring. The active card is in the centre, its neighbours
    // peek in on either side, and the rest wait on the far side.
    // Shortest signed distance around the ring from the active slot
    function ringDiff(slot) {
        var n = cards.length;
        var d = ((slot - activeIndex) % n + n) % n;
        return d > n / 2 ? d - n : d;
    }

    function poseFor(diff) {
        if (diff === 0) return 'pos-center';
        if (diff === -1) return 'pos-left';
        if (diff === 1) return 'pos-right';
        return diff < 0 ? 'pos-back-left' : 'pos-back-right';
    }

    function positionRing() {
        cards.forEach(function (el, slot) {
            removePositions(el);
            el.classList.add(poseFor(ringDiff(slot)));
        });
    }

    function updateGlow() {
        glow.classList.remove('glow-blue', 'glow-green', 'glow-gold', 'glow-orange', 'glow-violet', 'glow-pink');
        glow.classList.add('glow-' + GLOW_COLORS[activeIndex % GLOW_COLORS.length]);
    }

    // The ring keeps turning past either end
    function turn(direction) {
        activeIndex = (activeIndex + direction + totalCards) % totalCards;
        positionRing();
        updateGlow();
        updateCounter();
    }

    // Initial load: start every card offscreen on its own side of the ring so
    // they swing into place
    cards.forEach(function (card, i) {
        removePositions(card);
        card.classList.add(ringDiff(i) < 0 ? 'pos-far-left' : 'pos-far-right');
    });

    carouselSection.classList.add('section-active');
    glow.classList.add('glow-dimmed');
    updateCounter();
    updateGlow();
    setCounterVisible(true);
    setNavVisible(true);

    // After entrance animation, switch to class-driven state so transitions work
    heroContent.addEventListener('animationend', function handler() {
        heroContent.classList.add('entered');
        heroContent.removeEventListener('animationend', handler);
    });
    footerInfo.addEventListener('animationend', function handler() {
        footerInfo.classList.add('entered');
        footerInfo.removeEventListener('animationend', handler);
    });
    // The counter sits a fixed gap under the cards rather than at the bottom of
    // the window, so it stays with the card on tall screens. Measured from the
    // tallest card, so it doesn't move as the cards change.
    var COUNTER_GAP = 18;
    function placeCounter() {
        if (!counter || document.body.classList.contains('grid-mode') || innerWidth <= 640) {
            if (counter) counter.style.top = '';
            return;
        }
        var centre = cards[activeIndex].getBoundingClientRect();
        var tallest = Math.max.apply(null, cards.map(function (c) { return c.offsetHeight; }));
        counter.style.top = Math.round(centre.top + centre.height / 2 + tallest / 2 + COUNTER_GAP) + 'px';
        counter.style.bottom = 'auto';
    }
    placeCounter();
    window.addEventListener('resize', placeCounter);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCounter);

    // Enable transitions after a frame, then swing the ring into place
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            carouselSection.classList.add('carousel-ready');
            setTimeout(positionRing, 400);
        });
    });


    // Wheel event handler — one swipe gesture = one card move.
    //
    // Two layers of debouncing keep fast swipes from piling up:
    //   1. `gestureMovedCard`: only the first wheel event in a continuous
    //      gesture (defined as <50ms between events) triggers a move.
    //   2. `isTransitioning`: even across separate gestures, ignore wheel
    //      input while the previous card transition is still in flight.
    // Without (2), rapid flick-flick-flick would stack moves on top of an
    // unfinished transition and the carousel could end up in a stuck state.
    var gestureMovedCard = false;
    var gestureTimer = null;

    container.addEventListener('wheel', function (e) {
        // In grid mode: page scrolls naturally, no carousel nav
        if (layoutMode === 'grid') return;

        e.preventDefault();

        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(function () {
            gestureMovedCard = false;
        }, 50);

        if (gestureMovedCard) return;
        if (isTransitioning) return;

        var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(delta) < 5) return;

        gestureMovedCard = true;
        isTransitioning = true;
        setTimeout(function () { isTransitioning = false; }, TRANSITION_MS);

        turn(delta > 0 ? 1 : -1);
    }, { passive: false });

    // Prev/next button + arrow-key nav — desktop affordance for the carousel
    // since the wheel/swipe gesture isn't obvious on a laptop. Both routes
    // share the same `isTransitioning` guard the wheel handler uses so rapid
    // input can't stack moves mid-animation.
    function stepCarousel(direction) {
        if (layoutMode === 'grid') return;
        if (isTransitioning) return;
        isTransitioning = true;
        setTimeout(function () { isTransitioning = false; }, TRANSITION_MS);
        turn(direction);
    }

    if (navPrev) navPrev.addEventListener('click', function () { stepCarousel(-1); });
    if (navNext) navNext.addEventListener('click', function () { stepCarousel(1); });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        // Let inputs / contenteditable own the arrow keys.
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (layoutMode === 'grid') return;
        e.preventDefault();
        stepCarousel(e.key === 'ArrowRight' ? 1 : -1);
    });

    // Video hover play/pause
    cards.forEach(function (card) {
        var video = card.querySelector('.project-video');
        if (!video) return;

        card.addEventListener('mouseenter', function () {
            // Carousel: only pos-center plays. Grid mode: any card plays.
            if (layoutMode === 'grid' || card.classList.contains('pos-center')) {
                video.currentTime = 0;
                video.play().catch(function () {});
            }
        });

        card.addEventListener('mouseleave', function () {
            video.pause();
        });
    });

    // Project card click → use shared GSAP exit transition
    cards.forEach(function (card) {
        if (card.tagName !== 'A') return;

        card.addEventListener('click', function (e) {
            // In carousel mode only the center card navigates; a peeking card
            // turns the ring toward itself instead. In grid mode any card navigates.
            if (layoutMode === 'carousel' && !card.classList.contains('pos-center')) {
                e.preventDefault();
                if (card.classList.contains('pos-right')) stepCarousel(1);
                else if (card.classList.contains('pos-left')) stepCarousel(-1);
                return;
            }
            // External links (target="_blank") just open natively — no page-exit transition
            if (card.getAttribute('target') === '_blank') return;
            e.preventDefault();

            var href = card.getAttribute('href');

            if (window.PageTransitions) PageTransitions.exit(href);
            else window.location.href = href;
        });
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

            // Wait for closing animation to finish, then clean up
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

        // Mobile menu link clicks → close menu then exit animation
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

    // Touch support
    var touchStartY = 0;
    var touchStartX = 0;

    container.addEventListener('touchstart', function (e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', function (e) {
        if (isTransitioning) return;

        var deltaY = touchStartY - e.changedTouches[0].clientY;
        var deltaX = touchStartX - e.changedTouches[0].clientX;

        // Require a minimum swipe distance
        var minSwipe = 50;
        if (Math.abs(deltaY) < minSwipe && Math.abs(deltaX) < minSwipe) return;

        // In grid mode: page scrolls naturally, no carousel nav
        if (layoutMode === 'grid') return;

        isTransitioning = true;
        var scrollingDown = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY > 0 : deltaX > 0;

        turn(scrollingDown ? 1 : -1);

        setTimeout(function () {
            isTransitioning = false;
        }, TRANSITION_MS);
    }, { passive: true });
})();
