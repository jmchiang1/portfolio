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
            layoutToggle.querySelector('i').className = 'ph ph-slideshow';
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
            layoutToggle.querySelector('i').className = 'ph ph-squares-four';
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
    var POS_CLASSES = ['pos-center', 'pos-left', 'pos-right', 'pos-far-left', 'pos-far-right', 'pos-hero-peek'];

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

    // Hero view: Nocta peeks from right, rest hidden right
    function positionCardsForHero() {
        cards.forEach(function (card, i) {
            removePositions(card);
            if (i === 0) card.classList.add('pos-hero-peek');
            else card.classList.add('pos-far-right');
        });
    }

    // Hero view after looping forward from last card:
    // All cards exit left, then Nocta snaps to far-right and animates to hero-peek
    function positionCardsForHeroLoopForward() {
        cards.forEach(function (card, i) {
            removePositions(card);
            if (i === 0) {
                // Snap Nocta to far-right instantly, then animate to hero-peek
                card.style.transition = 'none';
                card.classList.add('pos-far-right');
                // Force reflow so the snap takes effect before re-enabling transitions
                card.offsetHeight;
                card.style.transition = '';
                requestAnimationFrame(function () {
                    card.classList.remove('pos-far-right');
                    card.classList.add('pos-hero-peek');
                });
            } else {
                // All other cards exit to the left
                card.classList.add('pos-far-left');
            }
        });
    }

    function positionCards() {
        cards.forEach(function (card, i) {
            removePositions(card);

            var diff = i - activeIndex;
            if (diff === 0) card.classList.add('pos-center');
            else if (diff === -1) card.classList.add('pos-left');
            else if (diff === 1) card.classList.add('pos-right');
            else if (diff < -1) card.classList.add('pos-far-left');
            else card.classList.add('pos-far-right');
        });
    }

    function updateGlow() {
        glow.classList.remove('glow-blue', 'glow-green', 'glow-gold', 'glow-orange', 'glow-violet', 'glow-pink');
        glow.classList.add('glow-' + GLOW_COLORS[activeIndex % GLOW_COLORS.length]);
    }

    function showHero(loopForward) {
        currentView = 'hero';
        heroContent.classList.remove('hero-hidden');
        footerInfo.classList.remove('footer-hidden');
        if (swipeHint) swipeHint.classList.remove('swipe-hint-hidden');
        if (socialLinks) socialLinks.classList.remove('social-hidden');
        heroSection.classList.remove('section-hidden');
        glow.classList.remove('glow-dimmed', 'glow-blue', 'glow-green', 'glow-gold', 'glow-orange');
        setCounterVisible(false);

        if (loopForward) {
            positionCardsForHeroLoopForward();
        } else {
            positionCardsForHero();
        }

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

        // Cards that were on the left but need to be on the right (after a loop)
        // should silently snap to far-right first, then animate to their target position.
        var crossingCards = [];
        cards.forEach(function (card, i) {
            var wasLeft = card.classList.contains('pos-far-left') || card.classList.contains('pos-left');
            var diff = i - activeIndex;
            var willBeRight = diff >= 1;
            if (wasLeft && willBeRight) {
                crossingCards.push(card);
                card.style.transition = 'none';
                removePositions(card);
                card.classList.add('pos-far-right');
            }
        });

        // Force reflow so the snap to far-right takes effect
        if (crossingCards.length) cards[0].offsetHeight;

        // Re-enable transitions on snapped cards so they animate to their target
        crossingCards.forEach(function (card) { card.style.transition = ''; });

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
            // Last card → loop back to hero, continue left direction
            showHero(true);
        }
    }

    function prevCard() {
        if (activeIndex > 0) {
            activeIndex--;
            positionCards();
            updateGlow();
            updateCounter();
        } else {
            // First card → go back to hero, cards exit right
            showHero(false);
        }
    }

    // Initial load: start ALL cards offscreen (including Nocta) so Nocta can
    // animate in alongside the hero + footer entrance, instead of being pre-placed
    cards.forEach(function (card) {
        removePositions(card);
        card.classList.add('pos-far-right');
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
    // Enable transitions after a frame, then animate Nocta in from offscreen
    // to its hero-peek position alongside the hero content entrance
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            carouselSection.classList.add('carousel-ready');
            setTimeout(function () {
                cards[0].classList.remove('pos-far-right');
                cards[0].classList.add('pos-hero-peek');
            }, 400);
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
            // In carousel mode only the center card navigates; in grid mode any card does
            if (layoutMode === 'carousel' && !card.classList.contains('pos-center')) return;
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

// Hero name — typewriter animation on initial load
(function () {
    var heading = document.querySelector('.hero-heading');
    if (!heading) return;

    var fullText = (heading.textContent || '').trim();
    if (!fullText) return;

    // Preserve the name for screen readers regardless of typing state
    heading.setAttribute('aria-label', fullText);
    heading.innerHTML = '<span class="hero-typed"></span><span class="hero-cursor" aria-hidden="true">|</span>';

    var typed = heading.querySelector('.hero-typed');
    var START_DELAY_MS = 600;  // kicks in shortly after hero entrance begins (0.3s)
    var CHAR_MS = 100;         // per-character speed

    var cursor = heading.querySelector('.hero-cursor');
    var i = 0;
    function typeNext() {
        if (i < fullText.length) {
            typed.textContent = fullText.substring(0, i + 1);
            i++;
            setTimeout(typeNext, CHAR_MS);
        } else {
            // Typing complete — fade out the cursor after a short hold
            setTimeout(function () {
                if (cursor) cursor.classList.add('hero-cursor-hidden');
            }, 500);
        }
    }
    setTimeout(typeNext, START_DELAY_MS);
})();
