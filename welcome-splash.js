// ============================================
// Welcome splash — JC monogram assemble
//
// The brand monogram (same 7×5 grid as the favicon / nav logo) builds
// itself square-by-square, holds for a beat, "presses" down like a keycap
// bottoming out, then the (translucent, blurred) curtain just fades to
// zero opacity so the builder underneath becomes interactive.
//
// The builder underneath is never hidden — `.welcome-splash` is a
// frosted-glass overlay (rgba navy + backdrop-filter blur). The
// welcome-layout has no entrance animation of its own; it renders fully
// on page load and is just visible-but-blurred behind the curtain until
// the curtain dissolves.
// The body's `is-splashing` class only locks page scroll while the
// curtain is up; `reveal()` drops it as cleanup.
//
// Honors prefers-reduced-motion, can be skipped with a click / keypress,
// and has a hard failsafe so the gate can never get stuck.
// ============================================
(function () {
    'use strict';

    var splash = document.getElementById('welcomeSplash');
    var body   = document.body;

    // Hand off to the layout's own entrance animations, then drop the
    // overlay. Idempotent — safe to call from onComplete and the failsafe.
    function reveal() {
        body.classList.remove('is-splashing');
        if (splash && splash.parentNode) {
            splash.parentNode.removeChild(splash);
            splash = null;
        }
    }

    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // No splash element, no GSAP, or reduced motion → reveal immediately.
    if (!splash || reduce || typeof gsap === 'undefined') {
        reveal();
        return;
    }

    function play() {
        if (!splash) return;

        var mark  = splash.querySelector('.splash-mark');
        var cells = splash.querySelectorAll('.splash-cell');

        var tl = gsap.timeline({ onComplete: reveal });

        // 1) Assemble — each square pops in from small + above, in DOM
        //    order, which reads as the letterform drawing itself. This is
        //    the part we *want* to feel deliberate, so it gets the budget.
        tl.fromTo(cells,
            { opacity: 0, scale: 0.3, y: -10 },
            {
                opacity: 1, scale: 1, y: 0,
                duration: 0.7,
                ease: 'back.out(2)',
                stagger: { each: 0.05, from: 'start' }
            }
        );

        // 2) Hold — just long enough for the eye to register the full mark.
        // 3) Press — keycap bottom-out.
        tl.to(mark, { y: 8, scale: 0.94, duration: 0.13, ease: 'power3.in' }, '+=0.2');

        // 4) Fade — instead of a slide-up wipe, just dissolve the whole
        //    overlay (tint + blur + mark) to zero opacity, so the builder
        //    sitting underneath becomes immediately interactive.
        tl.to(splash, { opacity: 0, duration: 0.5, ease: 'power2.out' });

        // Skip — fast-forward (rather than hard-cut) so it still reads.
        function skip() {
            document.removeEventListener('keydown', skip);
            splash.removeEventListener('click', skip);
            tl.timeScale(3.2);
        }
        document.addEventListener('keydown', skip);
        splash.addEventListener('click', skip);
    }

    // Run alongside the shared body fade-in (transitions.js fires on the
    // same event) so the assemble starts as the page fades up.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', play);
    } else {
        play();
    }

    // Failsafe — never leave the builder gated if the timeline errors.
    setTimeout(reveal, 3500);
})();
