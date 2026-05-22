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

    // Card click → animated modal open (flying-video animation lifts the
    // card's preview video into the modal's video target)
    cards.forEach(function (card) {
        card.addEventListener('click', function () {
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

                // Find the card that owns this modal and put the video back
                // inside its frame (so the overlay sits on top of it again)
                var modalId = modal.id;
                var ownerCard = document.querySelector('.motion-card[data-modal="' + modalId + '"]');
                var ownerFrame = ownerCard && ownerCard.querySelector('.motion-card-frame');
                var ownerOverlay = ownerFrame && ownerFrame.querySelector('.motion-card-frame-overlay');
                if (ownerFrame) {
                    video.classList.add('project-video');
                    if (ownerOverlay) ownerFrame.insertBefore(video, ownerOverlay);
                    else ownerFrame.appendChild(video);
                }

                // Resume the muted loop so the thumbnail keeps playing in the grid.
                var p = video.play();
                if (p && p.catch) p.catch(function () {});
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
