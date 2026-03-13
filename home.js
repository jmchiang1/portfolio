// 3D Carousel with wheel-driven navigation
(function () {
    var container = document.querySelector('.scroll-container');
    var glow = document.querySelector('.glow');
    var heroContent = document.querySelector('.hero-content');
    var footerInfo = document.querySelector('.footer-info');
    var heroSection = document.getElementById('hero');
    var carouselSection = document.getElementById('projects');
    var cards = Array.from(document.querySelectorAll('.project-card'));
    var totalCards = cards.length;

    var GLOW_COLORS = ['blue', 'green', 'gold', 'orange'];
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
        glow.classList.remove('glow-blue', 'glow-green', 'glow-gold', 'glow-orange');
        glow.classList.add('glow-' + GLOW_COLORS[activeIndex]);
    }

    function showHero(loopForward) {
        currentView = 'hero';
        heroContent.classList.remove('hero-hidden');
        footerInfo.classList.remove('footer-hidden');
        heroSection.classList.remove('section-hidden');
        glow.classList.remove('glow-dimmed', 'glow-blue', 'glow-green', 'glow-gold', 'glow-orange');

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
        heroSection.classList.add('section-hidden');
        carouselSection.classList.add('section-active');
        glow.classList.add('glow-dimmed');

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
        } else {
            // First card → go back to hero, cards exit right
            showHero(false);
        }
    }

    // Position cards for initial hero view
    positionCardsForHero();
    // Enable transitions after a frame so initial positions don't animate
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            carouselSection.classList.add('carousel-ready');
        });
    });

    // Wheel event handler
    container.addEventListener('wheel', function (e) {
        e.preventDefault();
        if (isTransitioning) return;

        var scrollingDown = e.deltaY > 0;
        isTransitioning = true;

        if (currentView === 'hero') {
            if (scrollingDown) {
                activeIndex = 0;
                showCarousel();
            }
            // Ignore scroll up at hero
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
    }, { passive: false });

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
