// Decoding video is the heaviest thing these pages do, so looping thumbnails
// only play while someone can see them. Videos opt in with data-autoplay.
// On the home carousel only the centred card plays; the rest rest on a poster.
(function () {
    'use strict';

    var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-autoplay]'));
    if (!videos.length) return;

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = new Set();
    var api = window.VideoBudget = { hold: false, refresh: refresh };

    function wanted(v) {
        if (reduce || api.hold || !visible.has(v)) return false;
        var card = v.closest('.project-card');
        if (card && !document.body.classList.contains('grid-mode')) return card.classList.contains('pos-center');
        return true;
    }

    function sync(v) {
        if (wanted(v)) {
            if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) {
            v.pause();
        }
    }

    function refresh() { videos.forEach(sync); }

    if (!('IntersectionObserver' in window)) {
        videos.forEach(function (v) { visible.add(v); });
        refresh();
        return;
    }

    var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
            sync(e.target);
        });
    }, { threshold: 0.05 });
    videos.forEach(function (v) { seen.observe(v); });

    // The carousel recentres by swapping classes
    var moves = new MutationObserver(refresh);
    var cards = document.querySelectorAll('.project-card');
    Array.prototype.forEach.call(cards, function (c) { moves.observe(c, { attributes: true, attributeFilter: ['class'] }); });
    if (cards.length) moves.observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
