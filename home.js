// 3D Carousel with wheel-driven navigation
(function () {
    var container = document.querySelector('.scroll-container');
    var glow = document.querySelector('.glow');
    var heroContent = document.querySelector('.hero-content');
    var footerInfo = document.querySelector('.footer-info');
    var swipeHint = document.querySelector('.hero-swipe-hint');
    var socialLinks = document.querySelector('.social-links');
    var heroSection = document.getElementById('hero');
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

    // Mirrors the counter's visibility so the prev/next buttons fade in
    // with the carousel and fade out when returning to hero.
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
            if (swipeHint) swipeHint.classList.remove('swipe-hint-hidden');
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
            if (currentView === 'carousel') {
                heroContent.classList.add('hero-hidden');
                footerInfo.classList.add('footer-hidden');
                if (swipeHint) swipeHint.classList.add('swipe-hint-hidden');
            }
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
                       'pos-hero-peek', 'pos-hero-peek-left', 'pos-hero-back', 'pos-back-left', 'pos-back-right'];

    var currentView = 'hero'; // 'hero' or 'carousel'
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

    // Cards ride a ring. In the hero view the ring sits on a half step, so no
    // card is in front of the monitor: card 0 peeks right, the last card peeks
    // left, the opposite card parks blurred behind the screen, the rest hide.
    var RING_STEP = 360 / totalCards;

    function heroAngle(i) {
        var a = ((i + 0.5) * RING_STEP) % 360;
        return a > 180 ? a - 360 : a;
    }

    // Shortest signed distance around the ring from the active card
    function ringDiff(i) {
        var d = ((i - activeIndex) % totalCards + totalCards) % totalCards;
        return d > totalCards / 2 ? d - totalCards : d;
    }

    function positionCardsForHero() {
        cards.forEach(function (card, i) {
            removePositions(card);
            var a = heroAngle(i);
            if (Math.abs(a) <= RING_STEP / 2 + 0.01) card.classList.add(a > 0 ? 'pos-hero-peek' : 'pos-hero-peek-left');
            else if (Math.abs(a) >= 180 - RING_STEP / 2 - 0.01) card.classList.add('pos-hero-back');
            else card.classList.add(a > 0 ? 'pos-far-right' : 'pos-far-left');
        });
    }

    function positionCards() {
        cards.forEach(function (card, i) {
            removePositions(card);

            var diff = ringDiff(i);
            if (diff === 0) card.classList.add('pos-center');
            else if (diff === -1) card.classList.add('pos-left');
            else if (diff === 1) card.classList.add('pos-right');
            else card.classList.add(diff < 0 ? 'pos-back-left' : 'pos-back-right');
        });
    }

    function updateGlow() {
        glow.classList.remove('glow-blue', 'glow-green', 'glow-gold', 'glow-orange', 'glow-violet', 'glow-pink');
        glow.classList.add('glow-' + GLOW_COLORS[activeIndex % GLOW_COLORS.length]);
    }

    function showHero() {
        currentView = 'hero';
        heroContent.classList.remove('hero-hidden');
        footerInfo.classList.remove('footer-hidden');
        if (swipeHint) swipeHint.classList.remove('swipe-hint-hidden');
        if (socialLinks) socialLinks.classList.remove('social-hidden');
        heroSection.classList.remove('section-hidden');
        glow.classList.remove('glow-dimmed', 'glow-blue', 'glow-green', 'glow-gold', 'glow-orange');
        setCounterVisible(false);
        setNavVisible(false);

        positionCardsForHero();

        // Keep carousel on top during exit animation, then drop it behind
        setTimeout(function () {
            if (currentView === 'hero') {
                carouselSection.classList.remove('section-active');
            }
        }, TRANSITION_MS);
    }

    function showCarousel() {
        currentView = 'carousel';
        heroContent.classList.add('hero-hidden');
        footerInfo.classList.add('footer-hidden');
        if (swipeHint) swipeHint.classList.add('swipe-hint-hidden');
        if (socialLinks) socialLinks.classList.add('social-hidden');
        heroSection.classList.add('section-hidden');
        carouselSection.classList.add('section-active');
        glow.classList.add('glow-dimmed');
        updateCounter();
        setCounterVisible(true);
        setNavVisible(layoutMode === 'carousel');

        positionCards();

        updateGlow();
    }

    function nextCard() {
        if (activeIndex < totalCards - 1) {
            activeIndex++;
            positionCards();
            updateGlow();
            updateCounter();
        } else {
            // Last card → the ring keeps turning back round to the hero
            showHero();
        }
    }

    function prevCard() {
        if (activeIndex > 0) {
            activeIndex--;
            positionCards();
            updateGlow();
            updateCounter();
        } else {
            // First card → turn back to the hero
            showHero();
        }
    }

    // Initial load: start every card offscreen on its own side of the ring so
    // they swing into their hero spots alongside the monitor entrance
    cards.forEach(function (card, i) {
        removePositions(card);
        card.classList.add(heroAngle(i) < 0 ? 'pos-far-left' : 'pos-far-right');
    });

    // After entrance animation, switch to class-driven state so transitions work
    heroContent.addEventListener('animationend', function handler() {
        heroContent.classList.add('entered');
        heroContent.removeEventListener('animationend', handler);
    });
    footerInfo.addEventListener('animationend', function handler() {
        footerInfo.classList.add('entered');
        footerInfo.removeEventListener('animationend', handler);
    });
    if (swipeHint) {
        swipeHint.addEventListener('animationend', function handler() {
            swipeHint.classList.add('entered');
            swipeHint.removeEventListener('animationend', handler);
        });
    }
    // Enable transitions after a frame, then swing the ring into its hero
    // positions alongside the monitor entrance
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            carouselSection.classList.add('carousel-ready');
            setTimeout(positionCardsForHero, 400);
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

        var scrollingDown = delta > 0;

        if (currentView === 'hero') {
            if (scrollingDown) {
                activeIndex = 0;
                showCarousel();
            }
        } else {
            if (scrollingDown) {
                nextCard();
            } else {
                prevCard();
            }
        }
    }, { passive: false });

    // Prev/next button + arrow-key nav — desktop affordance for the carousel
    // since the wheel/swipe gesture isn't obvious on a laptop. Both routes
    // share the same `isTransitioning` guard the wheel handler uses so rapid
    // input can't stack moves mid-animation. From the hero, either key
    // enters the carousel (right → first card, left → last card) so the
    // arrow keys behave as a continuous horizontal nav across the page.
    function stepCarousel(direction) {
        if (layoutMode === 'grid') return;
        if (isTransitioning) return;
        isTransitioning = true;
        setTimeout(function () { isTransitioning = false; }, TRANSITION_MS);
        if (currentView === 'hero') {
            activeIndex = direction > 0 ? 0 : totalCards - 1;
            showCarousel();
            return;
        }
        if (direction > 0) nextCard();
        else prevCard();
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
                if (card.matches('.pos-right, .pos-hero-peek')) stepCarousel(1);
                else if (card.matches('.pos-left, .pos-hero-peek-left')) stepCarousel(-1);
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

        if (currentView === 'hero') {
            if (scrollingDown) {
                activeIndex = 0;
                showCarousel();
            }
        } else {
            if (scrollingDown) {
                nextCard();
            } else {
                prevCard();
            }
        }

        setTimeout(function () {
            isTransitioning = false;
        }, TRANSITION_MS);
    }, { passive: true });
})();

// Hero monitor — types out the intro and the footer lines together
(function () {
    var monitor = document.querySelector('.hero-monitor');
    if (monitor) {
        // Hand off from the entrance keyframes so the hide/show transition works
        monitor.addEventListener('animationend', function handler(e) {
            if (e.target !== monitor) return;
            monitor.classList.add('entered');
            monitor.removeEventListener('animationend', handler);
        });
    }

    var heading = document.querySelector('.hero-heading');
    if (!heading) return;
    // Preserve the name for screen readers regardless of typing state
    heading.setAttribute('aria-label', (heading.textContent || '').trim());

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // The intro types first (name → tagline); once the tagline lands, both
    // footer columns type in together. [element, ms per character, pause]
    var intro = [[heading, 60, 450], [document.querySelector('.hero-tagline'), 24, 220]];
    var footerColumns = Array.prototype.map.call(
        document.querySelectorAll('.footer-info .footer-text'),
        function (el) { return [[el, 16, 200]]; }
    );

    // Split each text node into a typed span + an invisible remainder so the
    // final layout is reserved up front and nothing reflows while typing.
    function prepare(el) {
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        return nodes.filter(function (n) { return n.nodeValue.length; }).map(function (n) {
            var done = document.createElement('span');
            var rest = document.createElement('span');
            rest.className = 'type-rest';
            rest.textContent = n.nodeValue;
            n.parentNode.insertBefore(done, n);
            n.parentNode.replaceChild(rest, n);
            return { done: done, rest: rest, text: rest.textContent };
        });
    }

    function makeCaret() {
        var caret = document.createElement('span');
        caret.className = 'type-caret';
        caret.setAttribute('aria-hidden', 'true');
        return caret;
    }

    // Blank every line up front (so the footer stays empty while the intro
    // types), returning a queue of lines ready to type.
    function toQueue(lines) {
        return lines
            .filter(function (l) { return l[0] && l[0].offsetParent !== null; })
            .map(function (l) { return { parts: prepare(l[0]), ms: l[1], delay: l[2] }; });
    }

    // Types a queue line by line. The intro keeps its caret blinking at the
    // end; each footer caret is removed once its column finishes.
    function runStream(queue, keepCaret, onDone) {
        var caret = makeCaret();

        function typeLine(li) {
            if (li >= queue.length) {
                if (!keepCaret && caret.parentNode) caret.parentNode.removeChild(caret);
                if (onDone) onDone();
                return;
            }
            var line = queue[li];
            var pi = 0, ci = 0;
            function step() {
                if (pi >= line.parts.length) return typeLine(li + 1);
                var part = line.parts[pi];
                if (ci === 0) part.done.parentNode.insertBefore(caret, part.rest);
                ci++;
                part.done.textContent = part.text.slice(0, ci);
                part.rest.textContent = part.text.slice(ci);
                var ch = part.text.charAt(ci - 1);
                if (ci >= part.text.length) { pi++; ci = 0; }
                setTimeout(step, ch === ' ' ? line.ms * 0.5 : line.ms);
            }
            setTimeout(step, line.delay);
        }
        typeLine(0);
    }

    var introQueue = toQueue(intro);
    var footerQueues = footerColumns.map(toQueue);
    runStream(introQueue, true, function () {
        footerQueues.forEach(function (q) { runStream(q, false); });
    });
})();
