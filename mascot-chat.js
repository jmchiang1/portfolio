// Bit — a pixel keycap mascot who answers visitors' questions about Jonathan.
//
// Injects a launcher (Bit), a once-per-session greeting bubble, and a chat
// panel. Questions go to the `ask-jon` Supabase Edge Function, which streams
// Claude's reply back as plain text (see supabase/functions/ask-jon).
//
// Pages do full reloads, so the conversation and open/closed state live in
// sessionStorage and pick up where they left off on the next page.
//
// Bit lives in the bottom-left corner (positioned in mascot-chat.css).
(function () {
    'use strict';

    var ENDPOINT = 'https://ngpjycfwqhuxxngowwst.supabase.co/functions/v1/ask-jon';
    var STORAGE_KEY = 'jc-bit-chat-v1';
    var GREETED_KEY = 'jc-bit-greeted';
    // Keep in sync with MAX_MESSAGES / MAX_CHARS in the edge function.
    var HISTORY_LIMIT = 15;
    var INPUT_LIMIT = 600;

    var GREETING = "Hi! I'm **Bit**, Jonathan's little keycap helper. Ask me about his projects, process, or background.";
    // Starter questions, shown as chips. Their answers are written here, so
    // they reply instantly without calling Claude; typing the same question
    // (ignoring case and punctuation) gets the same answer. Keep the facts in
    // line with supabase/functions/ask-jon/knowledge.ts.
    var SUGGESTIONS = [
        {
            q: 'What does Jonathan do?',
            a: "Jonathan is a **product designer and design engineer** in New York. He takes products from research and UX/UI through brand and motion, then builds them in code so prototypes are real and handoff is smooth.\n\n" +
               "His most recent role was Design Engineer at [SkillCat](/skillcat.html), redesigning a mobile learning platform for the skilled trades. He's also founding [Apollo Racket Club](/apollo.html), an indoor badminton club."
        },
        {
            q: 'Tell me about Nocta',
            a: "**Nocta** is an AI companion for CPAP users. It turns a machine's overnight data into one plain-language story: what happened, what likely caused it, and the one thing to try next.\n\n" +
               "Jonathan did it solo, from research (a survey of 14 CPAP users and 6 interviews) through brand, UX/UI and a working React build. It started as his Parsons capstone. Read the [case study](/nocta.html) or try the [live prototype](https://nocta-teal.vercel.app/)."
        },
        {
            q: 'What tools does he use?',
            a: "- **Design:** Figma, After Effects, Claude Design, ChatGPT Images, Nano Banana 2\n" +
               "- **Code:** HTML/CSS, JavaScript, React, Claude Code, Cursor\n\n" +
               "He leans on Claude Code and Cursor to turn Figma designs into working prototypes, and his projects also use TypeScript, Next.js, Tailwind and Supabase. More on the [About page](/about.html)."
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

    // ------------------------------------------------------------------
    // Mascot SVG — a white keycap (the nav's "active key") on a 16×16 grid
    // with an antenna whose tip pings in the site accent, like the logo.
    // ------------------------------------------------------------------
    function botSvg() {
        return '' +
            '<svg class="mc-bot" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
                '<rect class="mc-stem" x="7.5" y="2" width="1" height="2.5"/>' +
                '<rect class="mc-tip" x="7" y="0.5" width="2" height="2"/>' +
                // Keycap walls (shade), then the top face
                '<rect class="mc-skirt" x="2" y="5" width="12" height="10.5"/>' +
                '<rect class="mc-skirt" x="1" y="6" width="14" height="8.5"/>' +
                '<rect class="mc-face" x="3" y="4" width="10" height="9"/>' +
                '<rect class="mc-face" x="2" y="5" width="12" height="7"/>' +
                '<g class="mc-look"><g class="mc-eyes">' +
                    '<rect class="mc-ink mc-eye" x="5" y="7" width="1.5" height="2"/>' +
                    '<rect class="mc-ink mc-eye" x="9.5" y="7" width="1.5" height="2"/>' +
                    // Happy ^ ^ eyes, shown on hover
                    '<g class="mc-happy mc-ink">' +
                        '<rect x="4.75" y="8" width="0.75" height="0.75"/>' +
                        '<rect x="5.5" y="7.25" width="0.75" height="0.75"/>' +
                        '<rect x="6.25" y="8" width="0.75" height="0.75"/>' +
                        '<rect x="9.25" y="8" width="0.75" height="0.75"/>' +
                        '<rect x="10" y="7.25" width="0.75" height="0.75"/>' +
                        '<rect x="10.75" y="8" width="0.75" height="0.75"/>' +
                    '</g>' +
                '</g></g>' +
                '<rect class="mc-blush" x="3.5" y="9.5" width="1.5" height="1"/>' +
                '<rect class="mc-blush" x="11" y="9.5" width="1.5" height="1"/>' +
                '<rect class="mc-ink mc-mouth" x="7.25" y="10" width="1.5" height="0.75"/>' +
            '</svg>';
    }

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
        '<div class="mc-bubble" hidden>' +
            '<button type="button" class="mc-bubble-text">Hi! I\'m <strong>Bit</strong>. Ask me anything about Jonathan.</button>' +
            '<button type="button" class="mc-bubble-close" aria-label="Dismiss">' + ICON_CLOSE + '</button>' +
        '</div>' +
        '<section class="mc-panel" id="mc-panel" role="dialog" aria-labelledby="mc-name" hidden>' +
            '<header class="mc-head">' +
                '<div class="mc-head-bot">' + botSvg() + '</div>' +
                '<div class="mc-head-text">' +
                    '<p class="mc-name" id="mc-name">Bit</p>' +
                    '<p class="mc-status">Ask me about Jonathan</p>' +
                '</div>' +
                '<button type="button" class="mc-icon-btn mc-reset" aria-label="Start a new chat" title="Start over">' + ICON_RESET + '</button>' +
                '<button type="button" class="mc-icon-btn mc-close" aria-label="Close chat" title="Close">' + ICON_CLOSE + '</button>' +
            '</header>' +
            '<div class="mc-log" role="log" aria-live="polite"></div>' +
            '<div class="mc-chips" role="group" aria-label="Suggested questions"></div>' +
            '<form class="mc-form">' +
                '<label class="mc-sr" for="mc-input">Ask Bit a question</label>' +
                '<textarea class="mc-input" id="mc-input" rows="1" maxlength="' + INPUT_LIMIT + '" placeholder="Ask about Jonathan…" autocomplete="off"></textarea>' +
                '<button type="submit" class="mc-send" aria-label="Send" disabled>' + ICON_SEND + '</button>' +
            '</form>' +
            '<p class="mc-foot">Bit is an AI and can get things wrong. Answers come from this site.</p>' +
        '</section>' +
        '<button type="button" class="mc-launcher" aria-controls="mc-panel" aria-expanded="false" aria-label="Chat with Bit, Jonathan\'s assistant">' +
            '<span class="mc-launcher-body"><span class="mc-launcher-press">' + botSvg() + '</span></span>' +
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
        el.setAttribute('aria-label', 'Bit is typing');
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

    function setMood(mood) {
        root.classList.toggle('is-thinking', mood === 'thinking');
        root.classList.toggle('is-talking', mood === 'talking');
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
    // thinking beat, so it feels like Bit's live replies.
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
                : "Oops, my wires got crossed and I couldn't answer that. Mind trying again?", 'mc-msg-error');
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
        if (animate) input.focus({ preventScroll: true });
    }

    function close() {
        root.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        animateOut(panel);
        state.open = false;
        save();
        launcher.focus({ preventScroll: true });
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
            if (root.classList.contains('is-open')) return;
            animateIn(bubble);
            setTimeout(function () { if (!bubble.hidden) hideBubble(); }, 9000);
        }, 3200);
    }

    // ------------------------------------------------------------------
    // Eyes follow the cursor
    // ------------------------------------------------------------------
    function trackEyes() {
        if (reduceMotion) return;
        var looks = root.querySelectorAll('.mc-look');
        var x = 0;
        var y = 0;
        var ticking = false;
        function update() {
            ticking = false;
            looks.forEach(function (g) {
                var r = g.ownerSVGElement.getBoundingClientRect();
                if (!r.width) return;
                var dx = x - (r.left + r.width / 2);
                var dy = y - (r.top + r.height / 2);
                var d = Math.max(1, Math.hypot(dx, dy));
                var reach = Math.min(1, d / 240) * 0.7; // in 16-unit SVG space
                g.style.transform = 'translate(' + (dx / d * reach).toFixed(2) + 'px,' + (dy / d * reach).toFixed(2) + 'px)';
            });
        }
        window.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            x = e.clientX;
            y = e.clientY;
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });
    }

    // ------------------------------------------------------------------
    // Wire up
    // ------------------------------------------------------------------
    launcher.addEventListener('click', function () { open(true); });
    root.querySelector('.mc-close').addEventListener('click', close);
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

    // Don't let page-level shortcuts (e.g. the typing test) see chat keystrokes.
    root.addEventListener('keydown', function (e) { e.stopPropagation(); });

    function mount() {
        document.body.appendChild(root);
        renderAll();
        if (state.open) open(false);
        trackEyes();
        maybeGreet();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
