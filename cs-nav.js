// ============================================
// Case-study section nav — scroll-spy + sliding pill
// The active link tracks the section in view; a single pill indicator
// glides between links as you cross each section threshold, and follows
// the cursor on hover (snapping back to the active link on leave).
// ============================================
(function () {
    var nav = document.querySelector('.cs-nav-links');
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('.nav-link[href^="#"]'));
    var items = links
        .map(function (link) {
            return { link: link, section: document.getElementById(link.getAttribute('href').slice(1)) };
        })
        .filter(function (it) { return it.section; });

    // Nothing to slide between on single-section pages.
    if (items.length < 2) return;

    var indicator = document.createElement('span');
    indicator.className = 'cs-nav-indicator';
    nav.insertBefore(indicator, nav.firstChild);

    var activeIndex = 0;
    var hoverIndex = -1;

    function place(index) {
        var link = items[index].link;
        indicator.style.width = link.offsetWidth + 'px';
        indicator.style.height = link.offsetHeight + 'px';
        indicator.style.top = link.offsetTop + 'px';
        indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    }

    function setActiveClasses() {
        for (var i = 0; i < items.length; i++) {
            items[i].link.classList.toggle('active', i === activeIndex);
        }
    }

    function render() {
        place(hoverIndex >= 0 ? hoverIndex : activeIndex);
        setActiveClasses();
    }

    // The active section is the last whose top has crossed a line ~38% down
    // the viewport — that crossing is the threshold that hands the pill to
    // the next / previous section.
    function spy() {
        var line = window.innerHeight * 0.38;
        var next = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i].section.getBoundingClientRect().top <= line) next = i;
        }
        // Snap to the last section once the page is scrolled to the bottom.
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            next = items.length - 1;
        }
        if (next === activeIndex) return;
        activeIndex = next;
        setActiveClasses();
        // Only move the pill if the cursor isn't currently steering it.
        if (hoverIndex < 0) place(activeIndex);
    }

    items.forEach(function (it, i) {
        it.link.addEventListener('mouseenter', function () { hoverIndex = i; place(i); });
        it.link.addEventListener('mouseleave', function () { hoverIndex = -1; place(activeIndex); });
    });

    function reposition() { place(hoverIndex >= 0 ? hoverIndex : activeIndex); }

    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });

    // Position once before enabling the transition so it doesn't slide in
    // from the left on first paint.
    requestAnimationFrame(function () {
        spy();
        render();
        requestAnimationFrame(function () { indicator.classList.add('ready'); });
    });

    // Web fonts can change link widths after first paint — re-measure.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(reposition);
    }
})();
