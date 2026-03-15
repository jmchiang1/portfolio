// Page entrance — fade black cover to white
(function () {
    var cover = document.querySelector('.page-transition-cover');
    var header = document.querySelector('.cs-header');

    // Fade out black cover
    setTimeout(function () {
        if (cover) {
            cover.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
            cover.style.opacity = '0';
            setTimeout(function () { cover.remove(); }, 400);
        }
    }, 50);

    // Reveal header
    setTimeout(function () {
        if (header) header.classList.add('cs-visible');
    }, 150);
})();

// Exit animation when clicking logo
(function () {
    var logo = document.querySelector('.nav-logo');
    if (!logo) return;

    logo.addEventListener('click', function (e) {
        var href = logo.getAttribute('href');
        if (!href) return;

        e.preventDefault();

        var navbar = document.querySelector('.navbar');
        var navLinks = navbar.querySelectorAll('.nav-link');

        // Freeze nav-links at visible state
        navLinks.forEach(function (link) {
            link.style.animation = 'none';
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        });

        navbar.offsetHeight;

        navbar.classList.add('nav-exiting');
        document.body.classList.add('cs-exiting');

        setTimeout(function () {
            window.location.href = href;
        }, 700);
    });
})();
