// Motion page carousel — replicated from home page
(function () {
    var cards = Array.from(document.querySelectorAll('.project-card'));
    var totalCards = cards.length;
    var POS_CLASSES = ['pos-center', 'pos-left', 'pos-right', 'pos-far-left', 'pos-far-right'];

    var activeIndex = 0;
    var isTransitioning = false;
    var TRANSITION_MS = 700;

    function removePositions(card) {
        POS_CLASSES.forEach(function (cls) { card.classList.remove(cls); });
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

    function nextCard() {
        if (activeIndex < totalCards - 1) {
            activeIndex++;
        } else {
            activeIndex = 0;
        }
        positionCards();
        updateCardVideos();
    }

    function prevCard() {
        if (activeIndex > 0) {
            activeIndex--;
        } else {
            activeIndex = totalCards - 1;
        }
        positionCards();
        updateCardVideos();
    }

    // Initial position (no transitions yet)
    positionCards();
    updateCardVideos();

    // Enable transitions after a frame so initial positions don't animate
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            document.querySelector('.carousel-viewport').classList.add('carousel-ready');
        });
    });

    // Wheel navigation — one swipe gesture = one card move
    var gestureMovedCard = false;
    var gestureTimer = null;

    document.addEventListener('wheel', function (e) {
        if (document.querySelector('.modal-overlay.modal-open')) return;
        e.preventDefault();

        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(function () {
            gestureMovedCard = false;
        }, 50);

        if (gestureMovedCard) return;

        var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(delta) < 5) return;

        gestureMovedCard = true;

        if (delta > 0) {
            nextCard();
        } else {
            prevCard();
        }
    }, { passive: false });

    // Touch support
    var touchStartX = 0;
    var touchStartY = 0;

    document.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
        if (isTransitioning) return;

        var deltaX = touchStartX - e.changedTouches[0].clientX;
        var deltaY = touchStartY - e.changedTouches[0].clientY;
        var minSwipe = 50;

        if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) return;

        isTransitioning = true;

        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
            if (deltaX > 0) nextCard(); else prevCard();
        } else {
            if (deltaY > 0) nextCard(); else prevCard();
        }

        setTimeout(function () {
            isTransitioning = false;
        }, TRANSITION_MS);
    }, { passive: true });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (document.querySelector('.modal-overlay.modal-open')) return;
        if (isTransitioning) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            isTransitioning = true;
            nextCard();
            setTimeout(function () { isTransitioning = false; }, TRANSITION_MS);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            isTransitioning = true;
            prevCard();
            setTimeout(function () { isTransitioning = false; }, TRANSITION_MS);
        }
    });

    // Autoplay video on active (center) card, pause on others
    function updateCardVideos() {
        cards.forEach(function (card) {
            var video = card.querySelector('.project-video');
            if (!video) return;
            if (card.classList.contains('pos-center')) {
                var p = video.play();
                if (p && p.catch) p.catch(function () {});
            } else {
                video.pause();
            }
        });
    }

    // Card click → animated modal open
    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            if (!card.classList.contains('pos-center')) return;
            var modalId = card.getAttribute('data-modal');
            if (!modalId) return;
            var modal = document.getElementById(modalId);
            if (!modal) return;

            var cardVideo = card.querySelector('.project-video');
            if (!cardVideo) {
                modal.classList.add('modal-open');
                document.body.style.overflow = 'hidden';
                return;
            }

            // Measure the card video's current position
            var cardRect = cardVideo.getBoundingClientRect();

            // Pull the actual video out of the card and into a fixed flying wrapper
            var flyingEl = document.createElement('div');
            flyingEl.className = 'flying-video';
            flyingEl.style.left = cardRect.left + 'px';
            flyingEl.style.top = cardRect.top + 'px';
            flyingEl.style.width = cardRect.width + 'px';
            flyingEl.style.height = cardRect.height + 'px';

            // Move the real video into the flying wrapper
            cardVideo.classList.remove('project-video');
            cardVideo.classList.add('flying-video-el');
            flyingEl.appendChild(cardVideo);
            document.body.appendChild(flyingEl);

            // Show the modal overlay but keep content faded
            modal.classList.add('modal-open', 'modal-animated');
            document.body.style.overflow = 'hidden';

            // Reset scroll so measurement is accurate
            var modalContent = modal.querySelector('.modal-content');
            if (modalContent) modalContent.scrollTop = 0;

            // Ensure fade-in elements are hidden
            var fadeItems = modal.querySelectorAll('.modal-fade-in');
            fadeItems.forEach(function (el) { el.classList.remove('revealed'); });

            // Force layout so modal is at its final position (transition: none)
            modal.offsetHeight;

            // Measure target now that modal is fully laid out
            requestAnimationFrame(function () {
                var target = modal.querySelector('.modal-video-target');

                // Set target height from video's natural aspect ratio so it doesn't collapse
                var vw = cardVideo.videoWidth;
                var vh = cardVideo.videoHeight;
                if (vw && vh) {
                    target.style.aspectRatio = vw + ' / ' + vh;
                } else {
                    // Fallback: use the card video's current dimensions
                    target.style.aspectRatio = cardRect.width + ' / ' + cardRect.height;
                }

                // Force layout so target has correct size before measuring
                target.offsetHeight;

                var targetRect = target.getBoundingClientRect();

                // Animate to the target position
                requestAnimationFrame(function () {
                    flyingEl.style.left = targetRect.left + 'px';
                    flyingEl.style.top = targetRect.top + 'px';
                    flyingEl.style.width = targetRect.width + 'px';
                    flyingEl.style.height = targetRect.height + 'px';
                });

                // After animation ends, drop the video into the modal target
                flyingEl.addEventListener('transitionend', function handler(e) {
                    if (e.target !== flyingEl) return;
                    flyingEl.removeEventListener('transitionend', handler);

                    // Move the video into the modal target slot
                    cardVideo.classList.remove('flying-video-el');
                    target.appendChild(cardVideo);
                    flyingEl.remove();

                    // Unmute and add controls if target has data-unmute
                    if (target.hasAttribute('data-unmute')) {
                        cardVideo.muted = false;
                        cardVideo.controls = true;
                    }

                    // Stagger-reveal the rest of the modal content
                    fadeItems.forEach(function (el, i) {
                        setTimeout(function () {
                            el.classList.add('revealed');
                        }, i * 80);
                    });
                });
            });
        });
    });

    // Close modal helper
    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('modal-open', 'modal-animated');
        document.body.style.overflow = '';

        // Move the video back to its original card
        var target = modal.querySelector('.modal-video-target');
        if (target) {
            var video = target.querySelector('video');
            if (video) {
                // Re-mute and remove controls before returning to card
                video.muted = true;
                video.controls = false;

                // Find the card that owns this modal
                var modalId = modal.id;
                var ownerCard = document.querySelector('.project-card[data-modal="' + modalId + '"]');
                if (ownerCard) {
                    video.classList.add('project-video');
                    ownerCard.appendChild(video);
                }
            }
        }

        // Reset fade-in items
        var fadeItems = modal.querySelectorAll('.modal-fade-in');
        fadeItems.forEach(function (el) { el.classList.remove('revealed'); });
    }

    // Close modal via X button
    document.querySelectorAll('.modal-close').forEach(function (btn) {
        btn.addEventListener('click', function () {
            closeModal(btn.closest('.modal-overlay'));
        });
    });

    // Close modal on overlay click (outside content)
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var openModal = document.querySelector('.modal-overlay.modal-open');
            if (openModal) closeModal(openModal);
        }
    });

    // Exit animation for any link that navigates away
    function triggerExit(href) {
        var navbar = document.querySelector('.navbar');
        var navLinks = navbar.querySelectorAll('.nav-link');
        var logoEl = navbar.querySelector('.nav-logo');

        navLinks.forEach(function (link) {
            link.style.animation = 'none';
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        });

        logoEl.style.animation = 'none';
        logoEl.style.opacity = '1';

        navbar.offsetHeight;

        navbar.classList.add('nav-exiting');
        document.body.classList.add('page-exit-active');

        setTimeout(function () {
            window.location.href = href;
        }, 500);
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
