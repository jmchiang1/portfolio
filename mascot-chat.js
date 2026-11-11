// Apollo — Jonathan's English cream golden retriever, drawn as a pixel cartoon,
// who walks the bottom of every page and answers visitors' questions.
//
// Injects Apollo (the launcher), a once-per-session greeting bubble, and a
// chat panel. Questions go to the `ask-jon` Supabase Edge Function, which
// streams Claude's reply back as plain text (see supabase/functions/ask-jon).
//
// Apollo strolls along the floor of the window: he sniffs, naps, chases a
// tennis ball that bounces in, and now and then a squirrel. He leaves the
// ball on the floor; drag and let go to throw it, and he runs it down (or
// leaps to catch it) and brings it back. Hovering stops him for a pet;
// clicking opens the chat, and he trots over to lie beside it.
// His frames come from assets/mascot/apollo.png, built from
// tools/apollo-sprite/model.js by tools/apollo-sprite/build.js.
//
// Pages do full reloads, so the conversation, open/closed state and Apollo's
// spot on the floor live in sessionStorage and pick up on the next page.
(function () {
    'use strict';

    var ENDPOINT = 'https://ngpjycfwqhuxxngowwst.supabase.co/functions/v1/ask-jon';
    var STORAGE_KEY = 'jc-bit-chat-v1';
    var GREETED_KEY = 'jc-bit-greeted';
    var POS_KEY = 'jc-apollo-pos';
    // Keep in sync with MAX_MESSAGES / MAX_CHARS in the edge function.
    var HISTORY_LIMIT = 15;
    var INPUT_LIMIT = 600;

    var GREETING = "Woof! I'm **Apollo**, Jonathan's golden retriever. Ask me about his projects, process, or background.";
    // Starter questions, shown as chips. Their answers are written here, so
    // they reply instantly without calling Claude; typing the same question
    // (ignoring case and punctuation) gets the same answer. Keep the facts in
    // line with supabase/functions/ask-jon/knowledge.ts.
    var SUGGESTIONS = [
        {
            q: 'What does Jonathan do?',
            a: "Jonathan is a **product designer and design engineer** in New York. He takes products from research and UX/UI through brand and motion, then builds them in code so prototypes are real and handoff is smooth.\n\n" +
               "He's **open to full-time roles**. His most recent role was Design Engineer at [SkillCat](/skillcat), redesigning a mobile learning platform for the skilled trades. He's also founding [Apollo Racket Club](/apollo), an indoor badminton club."
        },
        {
            q: 'Tell me about Nocta',
            a: "**Nocta** is an AI companion for CPAP users. It turns a machine's overnight data into one plain-language story: what happened, what likely caused it, and the one thing to try next.\n\n" +
               "Jonathan did it solo, from research (a survey of 14 CPAP users and 6 interviews) through brand, UX/UI and a working React build. It started as his Parsons capstone. Read the [case study](/nocta) or try it at [noctaapp.com](https://www.noctaapp.com/)."
        },
        {
            q: 'What tools does he use?',
            a: "- **Design:** Figma, After Effects, Claude Design, ChatGPT Images, Nano Banana 2\n" +
               "- **Code:** HTML/CSS, JavaScript, React, Claude Code, Cursor\n\n" +
               "He leans on Claude Code and Cursor to turn Figma designs into working prototypes, and his projects also use TypeScript, Next.js, Tailwind and Supabase. More on the [About page](/about)."
        },
        {
            q: 'How can I contact him?',
            a: "The best way to reach Jonathan is on [LinkedIn](https://www.linkedin.com/in/jmchiang5/). His [resume](/assets/Jonathan-Chiang-Design-Resume-2026.pdf) has his contact details too, and his code lives on [GitHub](https://github.com/jmchiang1)."
        }
    ];

    function normalize(q) {
        return q.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    var PRESETS = {};
    SUGGESTIONS.forEach(function (s) { PRESETS[normalize(s.q)] = s.a; });

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // sprite-map:start (written by tools/apollo-sprite/build.js; do not edit)
    var SPRITE = {
        url: 'assets/mascot/apollo.png?v=59ab4c22',
        cell: [50, 30],
        cells: 36,
        frames: {"stand": [0], "walk": [1,2,3,4,5,6], "walkhappy": [7,8,9,10,11,12], "run": [13,14,15,16], "runball": [17,18,19,20], "happy": [21,22,23,24], "sniff": [25,26], "ball": [27,28], "lie": [29,30], "sleep": [31,32], "toy": [33], "squirrel": [34,35]}
    };
    // sprite-map:end

    var ICON_CLOSE = '<svg width="14" height="14" viewBox="0 0 7 7" aria-hidden="true"><path fill="currentColor" d="M0 0h1v1H0zM1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 2h1v1H4zM5 1h1v1H5zM6 0h1v1H6zM2 4h1v1H2zM1 5h1v1H1zM0 6h1v1H0zM4 4h1v1H4zM5 5h1v1H5zM6 6h1v1H6z"/></svg>';
    var ICON_RESET = '<svg width="14" height="14" viewBox="0 0 7 7" aria-hidden="true"><path fill="currentColor" d="M2 0h3v1H2zM1 1h1v1H1zM5 1h1v1H5zM0 2h1v3H0zM6 2h1v1H6zM1 5h1v1H1zM2 6h3v1H2zM5 5h1v1H5zM4 2h3v1H4zM6 3h1v1H6z"/></svg>';
    var ICON_SEND = '<svg width="14" height="14" viewBox="0 0 7 7" aria-hidden="true"><path fill="currentColor" d="M3 0h1v7H3zM2 1h1v1H2zM4 1h1v1H4zM1 2h1v1H1zM5 2h1v1H5zM0 3h1v1H0zM6 3h1v1H6z"/></svg>';

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    var state = load();      // { messages: [{ role, content }], open: bool }
    var busy = false;
    var controller = null;   // AbortController for the in-flight reply

    function load() {
        try {
            var saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
            if (saved && Array.isArray(saved.messages)) return saved;
        } catch (e) { /* private mode or corrupt — start fresh */ }
        return { messages: [], open: false };
    }

    function save() {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    // ------------------------------------------------------------------
    // Markup
    // ------------------------------------------------------------------
    var root = document.createElement('div');
    root.className = 'mc-root';
    root.innerHTML =
        '<div class="mc-floor" aria-hidden="true">' +
            '<span class="mc-sprite mc-toy" hidden></span>' +
            '<span class="mc-toy-hint" hidden>Throw me!</span>' +
            '<span class="mc-sprite mc-squirrel" hidden></span>' +
            '<span class="mc-z" hidden>z</span><span class="mc-z" hidden>z</span><span class="mc-z" hidden>z</span>' +
            '<span class="mc-bang" hidden>!</span>' +
        '</div>' +
        '<div class="mc-bubble" hidden>' +
            '<button type="button" class="mc-bubble-text">Woof! I\'m <strong>Apollo</strong>. Ask me anything about Jonathan.</button>' +
            '<button type="button" class="mc-bubble-close" aria-label="Dismiss">' + ICON_CLOSE + '</button>' +
        '</div>' +
        '<section class="mc-panel" id="mc-panel" role="dialog" aria-labelledby="mc-name" hidden>' +
            '<header class="mc-head">' +
                '<div class="mc-head-bot"><span class="mc-sprite mc-head-dog"></span></div>' +
                '<div class="mc-head-text">' +
                    '<p class="mc-name" id="mc-name">Apollo</p>' +
                    '<p class="mc-status">Ask me about Jonathan</p>' +
                '</div>' +
                '<button type="button" class="mc-icon-btn mc-reset" aria-label="Start a new chat" title="Start over">' + ICON_RESET + '</button>' +
                '<button type="button" class="mc-icon-btn mc-close" aria-label="Close chat" title="Close">' + ICON_CLOSE + '</button>' +
            '</header>' +
            '<div class="mc-log" role="log" aria-live="polite"></div>' +
            '<div class="mc-chips" role="group" aria-label="Suggested questions"></div>' +
            '<form class="mc-form">' +
                '<label class="mc-sr" for="mc-input">Ask Apollo a question</label>' +
                '<textarea class="mc-input" id="mc-input" rows="1" maxlength="' + INPUT_LIMIT + '" placeholder="Ask about Jonathan…" autocomplete="off"></textarea>' +
                '<button type="submit" class="mc-send" aria-label="Send" disabled>' + ICON_SEND + '</button>' +
            '</form>' +
            '<p class="mc-foot">Apollo is an AI and can get things wrong. Answers come from this site.</p>' +
        '</section>' +
        '<button type="button" class="mc-launcher" aria-controls="mc-panel" aria-expanded="false" aria-label="Chat with Apollo, Jonathan\'s dog">' +
            '<span class="mc-sprite mc-dog"></span>' +
        '</button>';

    var launcher = root.querySelector('.mc-launcher');
    var bubble = root.querySelector('.mc-bubble');
    var panel = root.querySelector('.mc-panel');
    var log = root.querySelector('.mc-log');
    var chips = root.querySelector('.mc-chips');
    var form = root.querySelector('.mc-form');
    var input = root.querySelector('.mc-input');
    var send = root.querySelector('.mc-send');

    // ------------------------------------------------------------------
    // Light markdown: **bold**, [links](/page.html), "- " bullets,
    // paragraphs. Text is escaped first, so only these tags can appear.
    // ------------------------------------------------------------------
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function inline(s) {
        return escapeHtml(s)
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
                if (!/^(https?:\/\/|mailto:|\/|[\w-]+\.html)/i.test(url)) return label;
                var external = /^https?:\/\//i.test(url) && url.indexOf(location.host) === -1;
                return '<a href="' + url + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
            })
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }

    function renderRich(text) {
        var html = '';
        var para = [];
        var list = [];
        function flushPara() { if (para.length) html += '<p>' + para.join('<br>') + '</p>'; para = []; }
        function flushList() { if (list.length) html += '<ul><li>' + list.join('</li><li>') + '</li></ul>'; list = []; }
        text.trim().split('\n').forEach(function (line) {
            var bullet = line.match(/^\s*[-*•]\s+(.*)$/);
            if (bullet) { flushPara(); list.push(inline(bullet[1])); }
            else if (!line.trim()) { flushPara(); flushList(); }
            else { flushList(); para.push(inline(line)); }
        });
        flushPara();
        flushList();
        return html;
    }

    // ------------------------------------------------------------------
    // Rendering
    // ------------------------------------------------------------------
    function addMessage(role, content, extraClass) {
        var el = document.createElement('div');
        el.className = 'mc-msg mc-msg-' + (role === 'user' ? 'user' : 'bot') + (extraClass ? ' ' + extraClass : '');
        if (role === 'user') el.textContent = content;
        else el.innerHTML = renderRich(content);
        log.appendChild(el);
        scrollToEnd();
        return el;
    }

    function addTyping() {
        var el = document.createElement('div');
        el.className = 'mc-msg mc-msg-bot mc-typing';
        el.setAttribute('aria-label', 'Apollo is typing');
        el.innerHTML = '<span></span><span></span><span></span>';
        log.appendChild(el);
        scrollToEnd();
        return el;
    }

    function scrollToEnd() {
        log.scrollTop = log.scrollHeight;
    }

    function renderAll() {
        log.innerHTML = '';
        addMessage('assistant', GREETING);
        state.messages.forEach(function (m) { addMessage(m.role, m.content); });
        renderChips();
    }

    function renderChips() {
        chips.innerHTML = '';
        chips.hidden = state.messages.length > 0;
        if (chips.hidden) return;
        SUGGESTIONS.forEach(function (s) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'mc-chip';
            b.textContent = s.q;
            b.addEventListener('click', function () { ask(s.q); });
            chips.appendChild(b);
        });
    }

    var mood = null;
    function setMood(next) {
        mood = next;
        root.classList.toggle('is-thinking', mood === 'thinking');
        root.classList.toggle('is-talking', mood === 'talking');
        paintHead();
    }

    function syncSend() {
        send.disabled = busy || !input.value.trim();
    }

    function autosize() {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    }

    // ------------------------------------------------------------------
    // Reply sources — both call onText with each new piece of the reply
    // and resolve when it's complete.
    // ------------------------------------------------------------------
    function streamReply(history, signal, onText) {
        return fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history }),
            signal: signal
        }).then(function (res) {
            if (!res.ok || !res.body) {
                var err = new Error('HTTP ' + res.status);
                err.status = res.status;
                throw err;
            }
            var reader = res.body.getReader();
            var decoder = new TextDecoder();
            function pump() {
                return reader.read().then(function (chunk) {
                    if (chunk.done) {
                        onText(decoder.decode());
                        return;
                    }
                    onText(decoder.decode(chunk.value, { stream: true }));
                    return pump();
                });
            }
            return pump();
        });
    }

    // Plays a preset answer back a few words at a time, after a short
    // thinking beat, so it feels like Apollo's live replies.
    function playPreset(text, signal, onText) {
        return new Promise(function (resolve, reject) {
            var words = text.match(/\S+\s*/g) || [text];
            var i = 0;
            var timer = setTimeout(tick, 600);
            signal.addEventListener('abort', function () {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
            });
            function tick() {
                var n = reduceMotion ? words.length : 2 + Math.floor(Math.random() * 3);
                onText(words.slice(i, i + n).join(''));
                i += n;
                if (i < words.length) timer = setTimeout(tick, 40);
                else resolve();
            }
        });
    }

    // ------------------------------------------------------------------
    // Asking
    // ------------------------------------------------------------------
    function ask(question) {
        question = question.trim().slice(0, INPUT_LIMIT);
        if (!question || busy) return;

        busy = true;
        state.messages.push({ role: 'user', content: question });
        save();
        chips.hidden = true;
        addMessage('user', question);
        input.value = '';
        autosize();
        syncSend();

        var typing = addTyping();
        var bubbleEl = null;
        var reply = '';
        var frame = 0;
        setMood('thinking');

        // Last HISTORY_LIMIT turns, always starting on a visitor message.
        var history = state.messages.slice(-HISTORY_LIMIT);
        if (history[0].role !== 'user') history = history.slice(1);
        history = history.map(function (m) {
            return { role: m.role, content: m.content.slice(0, INPUT_LIMIT * 6) };
        });

        controller = new AbortController();

        function paint() {
            frame = 0;
            if (!bubbleEl) {
                typing.remove();
                bubbleEl = addMessage('assistant', reply);
                setMood('talking');
            } else {
                bubbleEl.innerHTML = renderRich(reply);
                scrollToEnd();
            }
        }

        function onText(text) {
            if (!text) return;
            reply += text;
            if (!frame) frame = requestAnimationFrame(paint);
        }

        var preset = PRESETS[normalize(question)];
        var source = preset
            ? playPreset(preset, controller.signal, onText)
            : streamReply(history, controller.signal, onText);

        source.then(function () {
            if (frame) cancelAnimationFrame(frame);
            if (!reply.trim()) throw new Error('empty reply');
            paint();
            state.messages.push({ role: 'assistant', content: reply.trim() });
            save();
        }).catch(function (err) {
            if (frame) cancelAnimationFrame(frame);
            typing.remove();
            if (err.name === 'AbortError') return;
            if (reply.trim()) {
                // Cut off mid-reply: keep what arrived so the transcript stays valid.
                paint();
                state.messages.push({ role: 'assistant', content: reply.trim() });
                save();
                return;
            }
            // Nothing arrived: drop the question so it can be re-sent as is.
            state.messages.pop();
            save();
            if (!input.value) {
                input.value = question;
                autosize();
            }
            addMessage('assistant', err.status === 429
                ? "I need a quick breather. Try me again in a few minutes!"
                : "Oops, I got tangled in my leash and couldn't answer that. Mind trying again?", 'mc-msg-error');
        }).then(function () {
            busy = false;
            controller = null;
            setMood(null);
            syncSend();
        });
    }

    function reset() {
        if (controller) controller.abort();
        state.messages = [];
        save();
        renderAll();
        input.focus();
    }

    // ------------------------------------------------------------------
    // Open / close (both directions animated; see mascot-chat.css)
    // ------------------------------------------------------------------
    function animateOut(el, done) {
        if (el.hidden) return;
        el.classList.remove('is-entering');
        el.classList.add('is-leaving');
        el.addEventListener('animationend', function handler(e) {
            if (e.target !== el) return;
            el.removeEventListener('animationend', handler);
            el.classList.remove('is-leaving');
            el.hidden = true;
            if (done) done();
        });
    }

    function animateIn(el) {
        el.classList.remove('is-leaving');
        el.hidden = false;
        el.classList.add('is-entering');
        el.addEventListener('animationend', function handler(e) {
            if (e.target !== el) return;
            el.removeEventListener('animationend', handler);
            el.classList.remove('is-entering');
        });
    }

    function open(animate) {
        hideBubble();
        root.classList.add('is-open');
        launcher.setAttribute('aria-expanded', 'true');
        if (animate) animateIn(panel);
        else panel.hidden = false;
        scrollToEnd();
        state.open = true;
        save();
        dogChat(true);
        if (animate) input.focus({ preventScroll: true });
    }

    // keepFocus: closed by a click elsewhere, so leave focus where it landed
    function close(keepFocus) {
        if (!root.classList.contains('is-open')) return;
        root.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        animateOut(panel);
        state.open = false;
        save();
        dogChat(false);
        if (keepFocus !== true) launcher.focus({ preventScroll: true });
    }

    function hideBubble() {
        try { sessionStorage.setItem(GREETED_KEY, '1'); } catch (e) { /* ignore */ }
        animateOut(bubble);
    }

    function maybeGreet() {
        var greeted = false;
        try { greeted = sessionStorage.getItem(GREETED_KEY) === '1'; } catch (e) { /* ignore */ }
        if (greeted || state.open || state.messages.length) return;
        setTimeout(function () {
            if (root.classList.contains('is-open') || document.documentElement.classList.contains('title-hold')) {
                if (!root.classList.contains('is-open')) setTimeout(maybeGreet, 2000);
                return;
            }
            dogGreet(4);
            animateIn(bubble);
            setTimeout(function () { if (!bubble.hidden) hideBubble(); }, 9000);
        }, 3200);
    }

    // ==================================================================
    // Apollo on the floor
    // ==================================================================
    var SC = 2;                                   // screen px per sprite pixel
    var CW = SPRITE.cell[0], CH = SPRITE.cell[1];
    var DW = CW * SC, DH = CH * SC;
    var FLOOR_PAD = 2;                            // his paws sit this far above the bottom edge
    var HEAD_X = 39, MOUTH_X = 47, MOUTH_Y = 10;  // sprite pixels, facing right
    var MOUTH_H = DH - MOUTH_Y * SC;              // mouth height above the floor, standing
    var BALL_R = 5 * SC;                          // the tennis ball is 10 sprite pixels across
    var G = 1500;                                 // gravity, px/s² (ball and his jumps)
    var CHASE_V = 330, JUMP_MAX = 150;            // a thrown ball gets his top speed; how high he can leap
    var THREW_KEY = 'jc-apollo-threw';
    var RATE = { stand: 1, walk: 10, walkhappy: 12, run: 12, runball: 12, happy: 6, sniff: 3, ball: 4, lie: 1, sleep: 1.2 };
    var WALK_V = 54, TROT_V = 80, RUN_V = 260;

    var dogSprite = launcher.querySelector('.mc-dog');
    var headSprite = root.querySelector('.mc-head-dog');
    var toyEl = root.querySelector('.mc-toy');
    var hintEl = root.querySelector('.mc-toy-hint');
    var sqEl = root.querySelector('.mc-squirrel');
    var zEls = root.querySelectorAll('.mc-z');
    var bangEl = root.querySelector('.mc-bang');

    function cellPos(i, ox, oy) {
        return (-(i * CW + (ox || 0)) * SC) + 'px ' + (-(oy || 0) * SC) + 'px';
    }

    function paintHead() {
        var f = SPRITE.frames[mood === 'talking' ? 'happy' : 'stand'][0];
        headSprite.style.backgroundPosition = cellPos(f, 30, 0);
    }

    var vw = 0, vh = 0, minX = 8, maxX = 400;
    function measure() {
        vw = document.documentElement.clientWidth || innerWidth;
        vh = innerHeight;
        // Keep clear of the fixed buttons in the bottom-right corner
        var right = vw - 8;
        ['.social-links', '.back-to-top'].forEach(function (sel) {
            var el = document.querySelector(sel);
            if (!el || !el.offsetWidth) return;
            var r = el.getBoundingClientRect();
            if (r.bottom > vh - DH - 24 && r.left > vw / 2) right = Math.min(right, r.left - 12);
        });
        minX = 8;
        maxX = Math.max(minX + 120, right - DW);
        if (maxX > vw - DW - 8) maxX = vw - DW - 8;
    }

    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    function spot(from) {
        var to = from + (Math.random() < 0.5 ? -1 : 1) * rnd(140, 380);
        if (to < minX || to > maxX) to = from - (to - from);
        return Math.max(minX, Math.min(maxX, to));
    }
    function headX() { return sim.dir > 0 ? sim.x + HEAD_X * SC : sim.x + (CW - HEAD_X) * SC; }
    function mouthX() { return sim.dir > 0 ? sim.x + MOUTH_X * SC : sim.x + (CW - MOUTH_X) * SC; }
    // Where he stands so his mouth is at x, approaching from side `dir`
    function standFor(x, dir) { return dir > 0 ? x - MOUTH_X * SC : x - (CW - MOUTH_X) * SC; }
    function threwBefore() { try { return sessionStorage.getItem(THREW_KEY) === '1'; } catch (e) { return false; } }

    // ---- Tasks: Apollo works through a queue of these ----------------
    var T = {
        walk: function (to, anim, v) { return { k: 'move', to: to, v: v || WALK_V, anim: anim || 'walk' }; },
        run: function (to, anim) { return { k: 'move', to: to, v: RUN_V, anim: anim || 'run' }; },
        pose: function (anim, dur, face) { return { k: 'pose', anim: anim, dur: dur, face: face }; },
        act: function (fn) { return { k: 'act', fn: fn }; },
        until: function (anim, test) { return { k: 'until', anim: anim, test: test }; },
        chaseBall: function () { return { k: 'chaseBall' }; },
        chaseSq: function () { return { k: 'chaseSq' }; },
        catchBall: function () { return { k: 'catchBall' }; },
        bring: function () { return { k: 'bring' }; },
        chat: function () { return { k: 'chat' }; }
    };

    function strollPlan() {
        var a = spot(sim.x);
        return [T.walk(a), T.pose('sniff', rnd(1.2, 2.4)), T.walk(spot(a)), T.pose('stand', rnd(1.5, 3.5))];
    }
    function idlePlan() {
        return [T.pose('happy', 1.4), T.pose('stand', rnd(2, 4)), T.pose('sniff', 1.6)];
    }
    function napPlan() {
        return [T.pose('lie', 2), T.pose('sleep', rnd(8, 14)), T.pose('lie', 1), T.pose('stand', 0.5)];
    }
    // A tennis ball bounces in from the right; he runs it down and brings it back
    function fetchPlan() {
        var home = Math.max(minX, Math.min(sim.x, maxX - 200));
        return [
            T.act(function (s) {
                s.ball = { x: vw + 12, y: -360, vx: -rnd(430, 620), vy: -160, held: false, rest: false, a: 1, fade: false };
            }),
            T.pose('happy', 0.6, 1),
            T.chaseBall(),
            T.act(function (s) { if (s.ball) s.ball.held = true; }),
            T.pose('ball', 0.5),
            T.run(home, 'runball'),
            T.pose('ball', 0.6, 1),
            T.act(dropBall),
            T.act(function (s) { if (!threwBefore()) s.hint = 6; }),
            T.pose('happy', 1.8, 1)
        ];
    }

    // He sets the ball down just in front of his nose; it stays for the visitor
    function dropBall(s) {
        var b = s.ball;
        if (!b) return;
        b.held = false; b.rest = false; b.thrown = false; b.fade = false; b.a = 1; b.idle = 0;
        b.x = mouthX() + s.dir * BALL_R;
        b.y = -MOUTH_H + 6; b.vx = s.dir * 50; b.vy = 0;
    }

    // The visitor picked up the ball: he perks up, waits for the throw, runs
    // it down (leaping if it's coming down within reach), and brings it back
    // to where it was thrown from
    function throwPlan() {
        var plan = [];
        if (sim.anim === 'sleep' || sim.anim === 'lie') plan.push(T.act(function (s) { s.alert = 0.7; }), T.pose('stand', 0.4));
        return plan.concat([
            T.catchBall(),
            T.pose('ball', 0.35),
            T.bring(),
            T.pose('ball', 0.45),
            T.act(dropBall),
            T.pose('happy', 2.6),
            T.pose('stand', 1.4)
        ]);
    }
    // A squirrel stops ahead of him, he spots it, it bolts and he gives chase
    function squirrelPlan() {
        var flee = sim.x < vw / 2 ? 1 : -1;
        var stopAt = Math.max(minX + 40, Math.min(maxX, sim.x + flee * 420));
        return [
            T.act(function (s) {
                s.dir = flee;
                s.sq = { x: flee > 0 ? vw + 10 : -14 * SC - 10, dir: -flee, stop: stopAt, state: 'in', t: 0, flee: flee };
            }),
            T.until('sniff', function (s) { return s.sq && s.sq.state === 'sit'; }),
            T.act(function (s) { s.alert = 0.9; }),
            T.pose('stand', 0.9),
            T.act(function (s) { if (s.sq) { s.sq.state = 'flee'; s.sq.dir = s.sq.flee; } }),
            T.pose('stand', 0.15),
            T.chaseSq(),
            T.pose('stand', 1.3),
            T.act(function (s) { s.off = false; s.dir = -flee; }),
            T.walk(flee > 0 ? maxX - 120 : minX + 160, 'walkhappy', TROT_V),
            T.pose('happy', 1.6)
        ];
    }

    var MIX = ['stroll', 'fetch', 'idle', 'stroll', 'nap', 'stroll', 'squirrel', 'stroll', 'idle', 'nap'];
    function nextPlan() {
        var m = MIX[sim.cycle++ % MIX.length];
        if (m === 'fetch' && !sim.ball) return fetchPlan();
        if (m === 'squirrel') return squirrelPlan();
        if (m === 'nap') return napPlan();
        if (m === 'idle') return idlePlan();
        return strollPlan();
    }

    // The chat opened: trot over beside the panel and settle down facing it
    function chatPlan() {
        var r = panel.getBoundingClientRect();
        var plan = [];
        if (r.width && r.width < vw - 120) {
            var to = Math.max(minX, Math.min(maxX, r.right + 12));
            plan.push(Math.abs(to - sim.x) > 220 ? T.run(to, 'run') : T.walk(to, 'walkhappy', TROT_V));
        }
        plan.push(T.pose('stand', 0.3, -1), T.chat());
        return plan;
    }

    var sim = {
        x: 40, dir: 1, anim: 'stand', ft: 0, q: [], task: null, hover: false, off: false,
        ball: null, sq: null, alert: 0, greet: 0, hint: 0, cycle: 0, t: 0,
        jy: 0, jv: 0, throwFrom: null      // jump height above the floor and its speed
    };

    function moveToward(to, v, dt) {
        var d = to - sim.x;
        if (Math.abs(d) < 2) { sim.x = to; return true; }
        sim.dir = d > 0 ? 1 : -1;
        sim.x += sim.dir * Math.min(Math.abs(d), v * dt);
        return false;
    }

    // Ball and squirrel heights are measured up from the floor (negative = up)
    function stepBall(b, dt) {
        if (!b || b.held || b.drag) return;
        if (b.fade) b.a = Math.max(0, b.a - dt * 2);
        if (b.rest) {
            // Left alone on the floor long enough, it fades away
            b.idle = (b.idle || 0) + dt;
            if (b.idle > 45 && !b.fade) b.fade = true;
            return;
        }
        var r = BALL_R;
        b.vy += G * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.roll = (b.roll || 0) + Math.abs(b.vx) * dt;
        b.flight = (b.flight || 0) + dt;
        if (b.y > -r) {
            b.y = -r;
            b.vy = Math.abs(b.vy) < 90 ? 0 : -b.vy * 0.52;
            b.vx *= 0.85;
        }
        if (b.y < -(vh - r)) { b.y = -(vh - r); b.vy = Math.abs(b.vy) * 0.5; }
        if (b.vy === 0) {
            b.vx *= Math.pow(0.25, dt);
            if (Math.abs(b.vx) < 14) { b.vx = 0; b.rest = true; b.idle = 0; }
        }
        // Walls: the left edge always; the right edge once it's in view
        if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x < vw - r) b.inside = true;
        if (b.inside && b.x > vw - r) { b.x = vw - r; b.vx = -Math.abs(b.vx) * 0.6; }
    }

    // Jumps: height above the floor, falling back under gravity
    function stepJump(s, dt) {
        if (s.jy <= 0 && s.jv <= 0) return;
        s.jv -= G * dt;
        s.jy += s.jv * dt;
        if (s.jy <= 0) { s.jy = 0; s.jv = 0; }
    }

    function stepSq(q, dt) {
        if (!q) return;
        q.t += dt;
        if (q.state === 'in') {
            q.x += q.dir * 270 * dt;
            if ((q.dir < 0 && q.x <= q.stop) || (q.dir > 0 && q.x >= q.stop)) { q.x = q.stop; q.state = 'sit'; }
        } else if (q.state === 'flee') {
            q.x += q.dir * 340 * dt;
            if (q.x > vw + 40 || q.x < -14 * SC - 40) q.state = 'gone';
        }
    }

    function step(dt) {
        var s = sim;
        s.t += dt;
        s.alert = Math.max(0, s.alert - dt);
        s.greet = Math.max(0, s.greet - dt);
        s.hint = Math.max(0, s.hint - dt);
        stepBall(s.ball, dt);
        stepJump(s, dt);
        stepSq(s.sq, dt);
        if (s.ball && s.ball.a <= 0) s.ball = null;
        if (s.sq && s.sq.state === 'gone') s.sq = null;

        var anim = s.anim;
        var k = s.task;
        var calm = !k || k.k === 'pose' || k.k === 'move';
        // He only stops for a pet or to say hi once he's fully on screen
        var onScreen = s.x >= minX - 2 && s.x <= vw - DW;
        if (!s.off && calm && onScreen && (s.hover || s.greet > 0) && (!k || k.k !== 'chat')) {
            anim = 'happy';
        } else {
            if (!s.task) {
                if (!s.q.length) s.q = nextPlan();
                s.task = s.q.shift();
                s.task.time = 0;
            }
            k = s.task;
            k.time += dt;
            var done = false;
            if (k.k === 'act') { k.fn(s); done = true; }
            else if (k.k === 'pose') { anim = k.anim; if (k.face) s.dir = k.face; done = k.time >= k.dur; }
            else if (k.k === 'move') { anim = k.anim; done = moveToward(k.to, k.v, dt); }
            else if (k.k === 'until') { anim = k.anim; done = k.test(s) || k.time > 8; }
            else if (k.k === 'chat') {
                anim = mood === 'talking' ? 'happy' : (mood === 'thinking' || s.hover) ? 'stand' : 'lie';
            } else if (k.k === 'chaseBall') {
                var b = s.ball;
                if (!b) done = true;
                else {
                    var dir = b.x > s.x + DW / 2 ? 1 : -1;
                    // his nose meets the near side of the ball
                    var target = Math.max(minX, Math.min(maxX, dir > 0 ? b.x - BALL_R - (MOUTH_X - 2) * SC : b.x + BALL_R - (CW - MOUTH_X + 2) * SC));
                    if (Math.abs(target - s.x) < 6 || k.time > 7) {
                        s.dir = dir;
                        anim = 'happy';
                        done = b.rest || b.vy === 0 || k.time > 7;
                    } else {
                        anim = 'run';
                        moveToward(target, RUN_V, dt);
                    }
                }
            } else if (k.k === 'catchBall') {
                var cb = s.ball;
                if (!cb || cb.held) done = true;
                else if (cb.drag) {
                    // The visitor is holding it: face it, wag, wait
                    if (s.jy === 0) s.dir = cb.x > s.x + DW / 2 ? 1 : -1;
                    anim = 'happy';
                } else {
                    var hb = -cb.y;                          // ball height above the floor
                    var mh = MOUTH_H + s.jy;                 // his mouth's height
                    var dx = cb.x - mouthX(), dy = hb - mh;
                    // A ball just let go of right at his nose doesn't count until it's on its way
                    var catchable = (cb.flight || 0) > 0.25 || cb.vy > 0;
                    if ((catchable && dx * dx + dy * dy < (BALL_R + 12) * (BALL_R + 12)) ||
                        (s.jy === 0 && hb < BALL_R + 6 && Math.abs(dx) < BALL_R + 10) || k.time > 10) {
                        cb.held = true;                      // got it
                        done = true;
                    } else {
                        var cd = cb.x > s.x + DW / 2 ? 1 : -1;
                        var to = Math.max(-DW * 0.3, Math.min(vw - DW * 0.7, standFor(cb.x, cd)));
                        var under = Math.abs(to - s.x) < 6;
                        moveToward(to, CHASE_V, dt);
                        // On the ground he always faces the ball, so his mouth is on its side
                        if (s.jy === 0) s.dir = cd;
                        // Coming down within reach: leap for it
                        if (s.jy === 0 && Math.abs(dx) < 44 && dy > 8 && dy < JUMP_MAX && cb.vy > -200) {
                            s.jv = Math.sqrt(2 * G * (dy + 8));
                        }
                        anim = under && s.jy === 0 ? 'happy' : 'run';
                    }
                }
            } else if (k.k === 'bring') {
                // Run it back so his mouth ends up where it was thrown from
                var from = s.throwFrom == null ? s.x + DW / 2 : s.throwFrom;
                var bd = from > s.x + DW / 2 ? 1 : -1;
                var dest = Math.max(minX, Math.min(maxX, standFor(from, bd)));
                anim = 'runball';
                done = s.jy === 0 && (moveToward(dest, RUN_V, dt) || k.time > 6);
            } else if (k.k === 'chaseSq') {
                var q = s.sq;
                var d = q ? q.flee : s.dir;
                anim = 'run';
                s.dir = d;
                s.x += d * 300 * dt;
                if (s.x > vw + 30 || s.x < -DW - 30) {
                    s.off = true;
                    s.x = d > 0 ? vw + 30 : -DW - 30;
                    done = true;
                }
            }
            if (done) s.task = null;
        }
        if (anim !== s.anim) { s.anim = anim; s.ft = 0; }
        s.ft += dt * (RATE[s.anim] || 4);
    }

    // ---- Drawing: only touch the DOM when something changed ----------
    var last = {};
    function set(el, key, prop, value) {
        if (last[key] === value) return;
        last[key] = value;
        el.style[prop] = value;
    }
    function show(el, key, on) {
        if (last[key] === on) return;
        last[key] = on;
        el.hidden = !on;
    }

    // Like show(), but plays the element's leaving animation before hiding it
    function fadeShow(el, key, on) {
        if (last[key] === on) return;
        last[key] = on;
        clearTimeout(el._leave);
        if (on) { el.classList.remove('is-leaving'); el.hidden = false; return; }
        el.classList.add('is-leaving');
        el._leave = setTimeout(function () { el.hidden = true; el.classList.remove('is-leaving'); }, 200);
    }

    function render() {
        var s = sim;
        var floor = vh - FLOOR_PAD;
        var list = SPRITE.frames[s.anim] || SPRITE.frames.stand;
        var cell = list[Math.floor(s.ft) % list.length];
        // In the air he holds the stretched-out gallop frame
        if (s.jy > 0) cell = SPRITE.frames[s.ball && s.ball.held ? 'runball' : 'run'][0];
        var top = floor - DH;
        set(launcher, 'dogT', 'transform', 'translate3d(' + Math.round(s.x) + 'px,' + Math.round(top - s.jy) + 'px,0)');
        if (last.dogJ !== Math.round(s.jy)) { last.dogJ = Math.round(s.jy); launcher.style.setProperty('--mc-jy', last.dogJ + 'px'); }
        set(launcher, 'dogV', 'visibility', s.off ? 'hidden' : '');
        set(dogSprite, 'dogF', 'backgroundPosition', cellPos(cell));
        set(dogSprite, 'dogD', 'transform', s.dir < 0 ? 'scaleX(-1)' : '');

        var b = s.ball;
        show(toyEl, 'toyOn', !!(b && !b.held));
        if (b && !b.held) {
            // It turns in quarter steps as it travels, so the pixels stay crisp
            var turn = (Math.floor((b.roll || 0) / (BALL_R * 1.6)) % 4) * 90 * (b.vx < 0 ? -1 : 1);
            set(toyEl, 'toyT', 'transform', 'translate3d(' + Math.round(b.x - BALL_R) + 'px,' + Math.round(floor + b.y - BALL_R) + 'px,0) rotate(' + turn + 'deg)');
            set(toyEl, 'toyA', 'opacity', b.a.toFixed(2));
        }
        var hintOn = !!(b && !b.held && !b.drag && b.rest && !b.fade && (s.hint > 0 || toyHover));
        fadeShow(hintEl, 'hint', hintOn);
        if (hintOn) {
            var hw = hintEl.offsetWidth || 80;
            set(hintEl, 'hintT', 'transform', 'translate3d(' + Math.round(Math.max(8, Math.min(vw - hw - 8, b.x - hw / 2))) + 'px,' + Math.round(floor + b.y - BALL_R - 30) + 'px,0)');
        }

        var q = s.sq;
        show(sqEl, 'sqOn', !!q);
        if (q) {
            var f = q.state === 'sit' ? Math.floor(q.t * 2) % 2 : Math.floor(q.t * 10) % 2;
            set(sqEl, 'sqT', 'transform', 'translate3d(' + Math.round(q.x) + 'px,' + (floor - 10 * SC) + 'px,0) scaleX(' + q.dir + ')');
            set(sqEl, 'sqF', 'backgroundPosition', cellPos(SPRITE.frames.squirrel[f]));
        }

        var hx = headX();
        var sleeping = s.anim === 'sleep' && !s.off;
        for (var i = 0; i < zEls.length; i++) {
            show(zEls[i], 'z' + i, sleeping);
            if (!sleeping) continue;
            var p = (s.t * 0.45 + i / 3) % 1;
            var zx = hx + s.dir * (6 + p * 26), zy = top + 6 * SC - p * 54;
            zEls[i].style.transform = 'translate3d(' + zx.toFixed(0) + 'px,' + zy.toFixed(0) + 'px,0) scale(' + (0.7 + p * 0.5).toFixed(2) + ')';
            zEls[i].style.opacity = (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85).toFixed(2);
        }

        show(bangEl, 'bang', s.alert > 0 && !s.off);
        if (s.alert > 0) set(bangEl, 'bangT', 'transform', 'translate3d(' + Math.round(hx - 8) + 'px,' + (top - 46) + 'px,0)');

        if (!bubble.hidden) {
            var bw = bubble.offsetWidth || 240;
            set(bubble, 'bubL', 'left', Math.round(Math.max(12, Math.min(vw - bw - 12, hx - 30))) + 'px');
        }
    }

    function savePos() {
        try { sessionStorage.setItem(POS_KEY, JSON.stringify({ x: sim.off ? null : Math.round(sim.x), dir: sim.dir, at: Date.now() })); } catch (e) { /* ignore */ }
    }

    function dogChat(on) {
        if (reduceMotion) return;
        if (on) {
            if (sim.ball && sim.ball.held) dropBall(sim);
            sim.jy = 0; sim.jv = 0;
            sim.sq = null;
            if (sim.off) { sim.off = false; sim.x = sim.x > vw / 2 ? maxX : minX; }
            sim.q = chatPlan();
        } else {
            sim.q = [T.pose('stand', 0.6), T.pose('happy', 1.2)];
        }
        sim.task = null;
    }

    function dogGreet(sec) {
        if (sim.task && sim.task.k !== 'pose' && sim.task.k !== 'move') return;
        sim.greet = sec;
    }

    // ---- Throwing the ball ------------------------------------------
    var toyHover = false;
    var drag = null;
    function wireThrow() {
        toyEl.addEventListener('pointerenter', function () { toyHover = true; });
        toyEl.addEventListener('pointerleave', function () { toyHover = false; });

        toyEl.addEventListener('pointerdown', function (e) {
            var b = sim.ball;
            if (!b || b.held || e.button > 0) return;
            e.preventDefault();
            toyEl.setPointerCapture(e.pointerId);
            var now = performance.now();
            drag = { id: e.pointerId, t0: now, sx: e.clientX, sy: e.clientY, pts: [{ x: e.clientX, y: e.clientY, t: now }],
                     ox: b.x - e.clientX, oy: b.y - e.clientY };
            b.drag = true; b.rest = false; b.fade = false; b.a = 1; b.idle = 0; b.vx = 0; b.vy = 0; b.inside = true;
            sim.hint = 0;
            document.documentElement.classList.add('mc-grabbing');
            // He perks up as soon as you pick it up
            if (!root.classList.contains('is-open')) {
                if (sim.off) { sim.off = false; sim.x = sim.x > vw / 2 ? vw - DW * 0.5 : -DW * 0.5; }
                if (sim.sq && sim.sq.state !== 'flee') { sim.sq.state = 'flee'; sim.sq.dir = sim.sq.flee || 1; }
                sim.greet = 0;
                sim.q = throwPlan();
                sim.task = null;
            }
        });

        toyEl.addEventListener('pointermove', function (e) {
            if (!drag || e.pointerId !== drag.id) return;
            var b = sim.ball;
            if (!b) return;
            b.x = Math.max(BALL_R, Math.min(vw - BALL_R, e.clientX + drag.ox));
            b.y = Math.max(-(vh - BALL_R), Math.min(-BALL_R, e.clientY + drag.oy));
            var now = performance.now();
            drag.pts.push({ x: e.clientX, y: e.clientY, t: now });
            while (drag.pts.length > 2 && now - drag.pts[0].t > 90) drag.pts.shift();
        });

        function release(e) {
            if (!drag || e.pointerId !== drag.id) return;
            var b = sim.ball, d = drag;
            drag = null;
            document.documentElement.classList.remove('mc-grabbing');
            if (!b) return;
            b.drag = false; b.thrown = true; b.rest = false; b.roll = 0; b.flight = 0;
            var now = performance.now();
            var first = d.pts[0];
            var dt = Math.max(16, now - first.t) / 1000;
            var vx = (e.clientX - first.x) / dt, vy = (e.clientY - first.y) / dt;
            var moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
            if (moved < 6 && now - d.t0 < 300) {
                // A tap pops it up into the air
                vx = (Math.random() < 0.5 ? -1 : 1) * rnd(80, 180);
                vy = -rnd(650, 800);
            }
            var sp = Math.hypot(vx, vy), cap = 2600;
            if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
            b.vx = vx; b.vy = vy;
            sim.throwFrom = e.clientX;
            try { sessionStorage.setItem(THREW_KEY, '1'); } catch (err) { /* ignore */ }
        }
        toyEl.addEventListener('pointerup', release);
        toyEl.addEventListener('pointercancel', release);
    }

    function startDog() {
        var img = 'url("' + SPRITE.url + '")';
        var size = (SPRITE.cells * DW) + 'px ' + DH + 'px';
        root.querySelectorAll('.mc-sprite').forEach(function (el) {
            el.style.backgroundImage = img;
            el.style.backgroundSize = size;
        });
        paintHead();
        toyEl.style.backgroundPosition = cellPos(SPRITE.frames.toy[0]);
        measure();
        window.addEventListener('resize', function () { measure(); sim.x = Math.max(minX, Math.min(sim.x, maxX)); render(); });

        // Reduced motion: he rests in the corner and doesn't roam
        if (reduceMotion) {
            sim.x = minX;
            sim.anim = 'lie';
            sim.ft = 1;
            render();
            return;
        }

        var saved = null;
        try { saved = JSON.parse(sessionStorage.getItem(POS_KEY)); } catch (e) { /* ignore */ }
        if (saved && saved.x != null && Date.now() - saved.at < 30 * 60 * 1000) {
            sim.x = Math.max(minX, Math.min(saved.x, maxX));
            sim.dir = saved.dir < 0 ? -1 : 1;
            sim.q = [T.pose('stand', rnd(0.8, 2))];
        } else {
            // First page of the visit: he trots in from the left edge
            sim.x = -DW * 0.6;
            sim.q = [T.walk(rnd(80, Math.min(240, maxX)), 'walkhappy', 120), T.pose('happy', 1.2)];
        }
        if (state.open) { sim.x = Math.max(minX, Math.min(maxX, sim.x)); sim.q = chatPlan(); }

        launcher.addEventListener('pointerenter', function () { sim.hover = true; });
        launcher.addEventListener('pointerleave', function () { sim.hover = false; });
        wireThrow();
        if (saved && saved.x != null) sim.cycle = Math.floor(Math.random() * 3);
        window.addEventListener('pagehide', savePos);
        document.addEventListener('visibilitychange', function () { if (document.hidden) savePos(); });

        var prev = performance.now();
        var since = 0;
        function frame(now) {
            var dt = Math.min(0.1, (now - prev) / 1000);
            prev = now;
            // Hold still while Home's title screen is up
            if (!document.documentElement.classList.contains('title-hold')) {
                step(dt);
                since += dt;
                if (since > 1) { since = 0; measure(); }
            }
            render();
            requestAnimationFrame(frame);
        }
        render();
        requestAnimationFrame(frame);
    }

    // ------------------------------------------------------------------
    // Wire up
    // ------------------------------------------------------------------
    // Clicking Apollo toggles the chat
    launcher.addEventListener('click', function () {
        if (root.classList.contains('is-open')) close();
        else open(true);
    });
    root.querySelector('.mc-close').addEventListener('click', function () { close(); });
    root.querySelector('.mc-reset').addEventListener('click', reset);
    root.querySelector('.mc-bubble-text').addEventListener('click', function () { open(true); });
    root.querySelector('.mc-bubble-close').addEventListener('click', hideBubble);

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        ask(input.value);
    });

    input.addEventListener('input', function () { autosize(); syncSend(); });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            ask(input.value);
        }
    });

    panel.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });

    // Escape closes the chat from anywhere on the page. Captured first, so
    // page shortcuts (e.g. the typing test) don't also act on it.
    window.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !root.classList.contains('is-open')) return;
        e.stopPropagation();
        close();
    }, true);

    // A click or tap outside the panel closes it. pointerdown, not click, so a
    // text selection dragged out of the panel doesn't count as outside.
    document.addEventListener('pointerdown', function (e) {
        if (!root.classList.contains('is-open')) return;
        if (panel.contains(e.target) || launcher.contains(e.target) || toyEl.contains(e.target)) return;
        close(true);
    }, true);

    // Don't let page-level shortcuts (e.g. the typing test) see chat keystrokes.
    root.addEventListener('keydown', function (e) { e.stopPropagation(); });

    function mount() {
        document.body.appendChild(root);
        renderAll();
        startDog();
        if (state.open) open(false);
        maybeGreet();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
