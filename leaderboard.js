// ============================================
// Typing leaderboard. The ten fastest timed runs for each test length live in a
// panel that slides in from the right, so the scores are on this page but off
// the typing screen. The results modal adds a run to it. Scores are in the
// Supabase table `typing_scores` (supabase-migration-2026-11-typing-leaderboard.sql).
// If the table can't be reached, the panel says so and the form stays hidden.
// ============================================
(function () {
    'use strict';

    var TABLE = 'typing_scores';
    var SHOW = 10;
    var NAME_KEY = 'jc_typer_name';
    var LATEST_KEY = 'jc_typer_latest'; // your last saved score: { id, duration }
    var SLIDE_MS = 320; // keep in step with .leaderboard's transition in typing.css

    var panel = document.getElementById('leaderboardPanel');
    var openBtn = document.getElementById('leaderboardBtn');
    var list = document.getElementById('leaderboardList');
    var empty = document.getElementById('leaderboardEmpty');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.leaderboard-tab'));
    var form = document.getElementById('trophySubmit');
    var nameInput = document.getElementById('trophyName');
    var submitBtn = document.getElementById('trophySubmitBtn');
    var submitText = submitBtn && submitBtn.querySelector('.trophy-submit-text');
    if (!panel || !list) return;

    var client = null;
    try {
        if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        }
    } catch (e) { client = null; }

    var ready = !!client;  // false once the table turns out to be unreachable
    var board = 15;        // the length the panel is showing
    var run = null;        // the run the form would submit
    var latest = null;     // your last saved score, highlighted on its board
    try { latest = JSON.parse(localStorage.getItem(LATEST_KEY) || 'null'); } catch (e) { latest = null; }
    var loading = 0;
    var closeTimer = 0;

    function testSeconds() {
        var btn = document.querySelector('.duration-btn.active');
        return btn ? parseInt(btn.dataset.duration, 10) : 15;
    }

    function message(text) {
        list.innerHTML = '';
        empty.textContent = text;
        empty.hidden = false;
    }

    function unavailable() {
        ready = false;
        form.hidden = true;
        message('The leaderboard isn\'t available right now.');
    }

    function row(entry, rank, extraClass) {
        var li = document.createElement('li');
        li.className = 'leaderboard-row' + (extraClass || '');
        var r = document.createElement('span');
        r.className = 'leaderboard-rank';
        r.textContent = rank;
        var who = document.createElement('span');
        who.className = 'leaderboard-name';
        who.textContent = entry.name;
        if (latest && entry.id === latest.id) {
            var you = document.createElement('span');
            you.className = 'leaderboard-you';
            you.textContent = 'You';
            who.appendChild(you);
        }
        var wpm = document.createElement('span');
        wpm.className = 'leaderboard-wpm';
        var num = document.createElement('b');
        num.textContent = entry.wpm;
        wpm.append(num, document.createTextNode(' wpm'));
        var acc = document.createElement('span');
        acc.className = 'leaderboard-acc';
        acc.textContent = entry.accuracy + '%';
        li.append(r, who, wpm, acc);
        return li;
    }

    // Your latest score isn't in the top ten: show it under the list with its rank
    function showLatestBelow() {
        client.from(TABLE).select('id, name, wpm, accuracy').eq('id', latest.id).maybeSingle().then(function (res) {
            if (res.error || !res.data) return;
            var mine = res.data;
            client.from(TABLE).select('id', { count: 'exact', head: true })
                .eq('duration', board).gt('wpm', mine.wpm)
                .then(function (count) {
                    if (count.error || board !== latest.duration) return;
                    var label = document.createElement('li');
                    label.className = 'leaderboard-latest-label';
                    label.textContent = 'Your latest';
                    var li = row(mine, count.count + 1, ' is-mine');
                    li.style.setProperty('--i', SHOW);
                    list.append(label, li);
                });
        });
    }

    function render(rows) {
        list.innerHTML = '';
        if (!rows.length) {
            message('No scores yet. Finish a ' + board + ' second test to set the first one.');
            return;
        }
        empty.hidden = true;
        var mineShown = false;
        rows.forEach(function (entry, i) {
            var isMine = !!latest && entry.id === latest.id;
            mineShown = mineShown || isMine;
            var li = row(entry, i + 1, (i < 3 ? ' is-top-' + (i + 1) : '') + (isMine ? ' is-mine' : ''));
            li.style.setProperty('--i', i);
            list.appendChild(li);
        });
        if (latest && latest.duration === board && !mineShown) showLatestBelow();
    }

    function load() {
        tabs.forEach(function (tab) {
            var on = parseInt(tab.dataset.board, 10) === board;
            tab.classList.toggle('active', on);
            tab.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (!ready) { unavailable(); return; }
        var ticket = ++loading;
        client.from(TABLE)
            .select('id, name, wpm, accuracy')
            .eq('duration', board)
            .order('wpm', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(SHOW)
            .then(function (res) {
                if (ticket !== loading) return; // a newer request is on its way
                if (res.error) { unavailable(); return; }
                render(res.data || []);
            }, unavailable);
    }

    // ---- The panel ----
    function isOpen() {
        return !panel.hidden && panel.classList.contains('is-open');
    }

    function open(seconds) {
        clearTimeout(closeTimer);
        // Opens on the board with your latest saved score, else the length you're testing
        board = seconds || (latest && latest.duration) || testSeconds();
        load();
        panel.hidden = false;
        panel.offsetHeight; // start the slide from off screen
        panel.classList.add('is-open');
        openBtn.setAttribute('aria-expanded', 'true');
        panel.querySelector('.typing-modal-close').focus({ preventScroll: true });
    }

    function close() {
        if (!isOpen()) return;
        panel.classList.remove('is-open'); // slides back out
        openBtn.setAttribute('aria-expanded', 'false');
        closeTimer = setTimeout(function () { panel.hidden = true; }, SLIDE_MS);
        openBtn.focus({ preventScroll: true });
    }

    openBtn.addEventListener('click', function () { open(); });
    panel.querySelectorAll('[data-close-board]').forEach(function (el) {
        el.addEventListener('click', close);
    });
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            board = parseInt(tab.dataset.board, 10);
            load();
        });
    });

    // Escape closes the panel and nothing else (captured ahead of typing.js,
    // whose Escape restarts the test)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) {
            e.stopPropagation();
            close();
        }
    }, true);

    // ---- Adding a run ----
    function setButton(state, label) {
        submitBtn.classList.remove('is-saving', 'is-saved', 'is-failed');
        if (state) submitBtn.classList.add(state);
        submitText.textContent = label;
    }

    document.addEventListener('typing:finished', function (e) {
        run = e.detail;
        var eligible = ready && run.mode === 'time' && run.wpm >= 1;
        form.hidden = !eligible;
        if (!eligible) return;
        nameInput.disabled = false;
        submitBtn.disabled = false;
        setButton(null, 'Submit');
        try { nameInput.value = localStorage.getItem(NAME_KEY) || ''; } catch (err) {}
    });

    // A failed save says so on the button and leaves the modal open
    function failed() {
        setButton('is-failed', 'Retry');
        nameInput.disabled = false;
        submitBtn.disabled = false;
    }

    // Submit: the button shows saving, then saved, then the modal closes and the
    // leaderboard slides in on this run's board with the new score marked
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = nameInput.value.replace(/\s+/g, ' ').trim().slice(0, 20);
        if (!run || !name) { nameInput.focus(); return; }
        nameInput.disabled = true;
        submitBtn.disabled = true;
        setButton('is-saving', 'Saving');
        var started = Date.now();
        var seconds = run.duration;

        var entry = { name: name, wpm: run.wpm, accuracy: run.accuracy, duration: run.duration };
        client.from(TABLE).insert(entry).select('id').single().then(function (res) {
            if (res.error) { failed(); return; }
            try { localStorage.setItem(NAME_KEY, name); } catch (err) {}
            latest = { id: res.data.id, duration: seconds };
            try { localStorage.setItem(LATEST_KEY, JSON.stringify(latest)); } catch (err) {}
            // Let "Saving" read for a moment even on a fast connection
            setTimeout(function () {
                setButton('is-saved', 'Saved');
                setTimeout(function () {
                    if (typeof window.closeModals === 'function') window.closeModals();
                    setTimeout(function () { open(seconds); }, 260);
                }, 450);
            }, Math.max(0, 500 - (Date.now() - started)));
        }, failed);
    });
})();
