// Motion page — vibes-style grid layout
(function () {
    var cards = Array.from(document.querySelectorAll('.motion-card'));

    // Hover-to-play — videos only play while the user is hovering the card
    cards.forEach(function (card) {
        var video = card.querySelector('.project-video');
        if (!video) return;

        card.addEventListener('mouseenter', function () {
            video.currentTime = 0;
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
        });

        card.addEventListener('mouseleave', function () {
            video.pause();
        });
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
                // Pause, re-mute and remove controls before returning to card
                video.pause();
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

    // Background visibility toggle — grid only
    var bgVisibility = document.querySelector('.bg-visibility');
    var bgGrid = document.getElementById('background-grid');

    if (bgVisibility && bgGrid) {
        bgVisibility.addEventListener('click', function () {
            var hidden = bgGrid.classList.toggle('grid-hidden');
            bgGrid.classList.toggle('grid-visible', !hidden);
            var icon = bgVisibility.querySelector('i');
            if (icon) icon.className = hidden ? 'ph ph-eye-slash' : 'ph ph-eye';
            bgVisibility.setAttribute('data-tooltip', hidden ? 'Show' : 'Hide');
        });
    }

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

    // ============================================
    // Easter egg — tap any hero logo chip 3 times in quick succession to
    // reveal the hidden typing test. The "psst" hint is a cursor-following
    // tooltip that only appears while a chip is hovered.
    // ============================================
    var chips = document.querySelectorAll('.hero-logo-chip');
    var hint = document.querySelector('.hero-hint');
    var CHIP_TARGET = 3;
    var CHIP_RESET_MS = 1500;
    var CHIP_BONK_MS = 180;
    var chipState = new WeakMap();

    // Cursor-following hint
    if (hint) {
        var hintX = 0, hintY = 0, hintVisible = false;
        var rafPending = false;

        function applyHintPosition() {
            rafPending = false;
            // Offset from cursor so the tooltip doesn't sit directly under it
            hint.style.transform = 'translate(' + (hintX + 16) + 'px, ' + (hintY + 16) + 'px)';
        }

        function moveHint(e) {
            hintX = e.clientX;
            hintY = e.clientY;
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(applyHintPosition);
            }
        }

        chips.forEach(function (chip) {
            chip.addEventListener('mouseenter', function (e) {
                hintX = e.clientX;
                hintY = e.clientY;
                applyHintPosition();
                if (!hintVisible) {
                    hint.classList.add('is-visible');
                    hintVisible = true;
                }
            });

            chip.addEventListener('mousemove', moveHint);

            chip.addEventListener('mouseleave', function () {
                if (hintVisible) {
                    hint.classList.remove('is-visible');
                    hintVisible = false;
                }
            });
        });
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            var s = chipState.get(chip) || { count: 0, timer: null };
            s.count += 1;

            chip.classList.remove('chip-bonk');
            void chip.offsetWidth; // restart transition
            chip.classList.add('chip-bonk');
            setTimeout(function () { chip.classList.remove('chip-bonk'); }, CHIP_BONK_MS);

            clearTimeout(s.timer);

            if (s.count >= CHIP_TARGET) {
                chipState.delete(chip);
                if (window.PageTransitions) PageTransitions.exit('typing.html');
                else window.location.href = 'typing.html';
                return;
            }

            s.timer = setTimeout(function () { chipState.delete(chip); }, CHIP_RESET_MS);
            chipState.set(chip, s);
        });
    });
})();
