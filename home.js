// 3D Carousel with wheel-driven navigation
(function () {
    var container = document.querySelector('.scroll-container');
    var glow = document.querySelector('.glow');
    var heroContent = document.querySelector('.hero-content');
    var footerInfo = document.querySelector('.footer-info');
    var socialLinks = document.querySelector('.social-links');
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
        if (socialLinks) socialLinks.classList.remove('social-hidden');
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
        if (socialLinks) socialLinks.classList.add('social-hidden');
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

    // After entrance animation, switch to class-driven state so transitions work
    heroContent.addEventListener('animationend', function handler() {
        heroContent.classList.add('entered');
        heroContent.removeEventListener('animationend', handler);
    });
    footerInfo.addEventListener('animationend', function handler() {
        footerInfo.classList.add('entered');
        footerInfo.removeEventListener('animationend', handler);
    });
    // Enable transitions after a frame so initial positions don't animate
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            carouselSection.classList.add('carousel-ready');
        });
    });

    // Wheel event handler — one swipe gesture = one card move
    var gestureMovedCard = false;
    var gestureTimer = null;

    container.addEventListener('wheel', function (e) {
        e.preventDefault();

        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(function () {
            gestureMovedCard = false;
        }, 50);

        if (gestureMovedCard) return;

        var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(delta) < 5) return;

        gestureMovedCard = true;

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
            if (card.classList.contains('pos-center')) {
                video.currentTime = 0;
                video.play();
            }
        });

        card.addEventListener('mouseleave', function () {
            video.pause();
        });
    });

    // Project card click → collapse nav into dots, fade out content, navigate
    cards.forEach(function (card) {
        if (card.tagName !== 'A') return;

        card.addEventListener('click', function (e) {
            if (!card.classList.contains('pos-center')) return;
            e.preventDefault();

            var href = card.getAttribute('href');
            var navbar = document.querySelector('.navbar');
            var navLinks = navbar.querySelectorAll('.nav-link');

            // Ensure logo is fully visible (cancel any entrance animation)
            var logo = navbar.querySelector('.nav-logo');
            logo.style.animation = 'none';
            logo.style.opacity = '1';

            // Freeze nav-links in their current visible state
            navLinks.forEach(function (link) {
                link.style.animation = 'none';
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            });

            // Force reflow so inline styles apply before transition starts
            navbar.offsetHeight;

            // Animate everything out simultaneously
            navbar.classList.add('nav-exiting');
            container.classList.add('page-exit-active');

            // Navigate after exit animation completes
            setTimeout(function () {
                window.location.href = href;
            }, 500);
        });
    });

    // Nav-links that navigate to other pages (e.g. Motion)
    var allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#')) return;
        link.addEventListener('click', function (e) {
            e.preventDefault();

            var navbar = document.querySelector('.navbar');
            var navLinks = navbar.querySelectorAll('.nav-link');
            var logo = navbar.querySelector('.nav-logo');

            logo.style.animation = 'none';
            logo.style.opacity = '1';

            navLinks.forEach(function (l) {
                l.style.animation = 'none';
                l.style.opacity = '1';
                l.style.transform = 'translateY(0)';
            });

            navbar.offsetHeight;

            navbar.classList.add('nav-exiting');
            container.classList.add('page-exit-active');

            setTimeout(function () {
                window.location.href = href;
            }, 500);
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
                    var navbar = document.querySelector('.navbar');
                    navbar.classList.add('nav-exiting');
                    container.classList.add('page-exit-active');

                    setTimeout(function () {
                        window.location.href = href;
                    }, 500);
                });
            });
        });
    }

    // Background animation controls — switch + visibility
    var bgSwitch = document.querySelector('.bg-switch');
    var bgVisibility = document.querySelector('.bg-visibility');
    var dottedSurface = document.getElementById('dotted-surface');
    var bgPaths = document.getElementById('background-paths');
    var bgGrid = document.getElementById('background-grid');
    var bgAnim = 0; // 0 = dots, 1 = paths, 2 = grid
    var bgVisible = true;
    var BG_ICONS = ['ph-dots-nine', 'ph-tornado', 'ph-diamonds-four'];
    var BG_NAMES = ['Dots', 'Paths', 'Grid'];

    function applyBgState() {
        dottedSurface.classList.toggle('dots-hidden', !(bgAnim === 0 && bgVisible));
        bgPaths.classList.toggle('paths-visible', bgAnim === 1 && bgVisible);
        bgGrid.classList.toggle('grid-visible', bgAnim === 2 && bgVisible);
    }

    if (bgSwitch && bgVisibility && dottedSurface && bgPaths && bgGrid) {
        // Switch animation type
        bgSwitch.addEventListener('click', function () {
            bgAnim = (bgAnim + 1) % 3;
            var icon = bgSwitch.querySelector('i');
            icon.className = 'ph ' + BG_ICONS[bgAnim];
            bgSwitch.setAttribute('data-tooltip', BG_NAMES[bgAnim]);
            applyBgState();
        });

        // Toggle visibility
        bgVisibility.addEventListener('click', function () {
            bgVisible = !bgVisible;
            var icon = bgVisibility.querySelector('i');
            if (bgVisible) {
                icon.className = 'ph ph-eye';
                bgVisibility.setAttribute('data-tooltip', 'Hide');
                bgSwitch.classList.remove('bg-hidden');
            } else {
                icon.className = 'ph ph-eye-slash';
                bgVisibility.setAttribute('data-tooltip', 'Show');
                bgSwitch.classList.add('bg-hidden');
            }
            applyBgState();
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
