// ============================================
// SkillCat hotspot position editor
// Activates only when ?edit appears in the URL. Lets you drag any dot to
// reposition it inside its phone frame. Switch versions with the V1/V2/V3/V4
// tabs to edit each version's dots. Click "Copy positions" when done — the
// output is paste-back-friendly text describing every dot's new top/left %.
// ============================================
(function () {
    var params = new URLSearchParams(location.search);
    if (!params.has('edit')) return;

    document.documentElement.classList.add('sk-edit-mode');

    // Edit-mode styling — bigger handles, hide note tooltips, show frame outline.
    var style = document.createElement('style');
    style.textContent = [
        '.sk-edit-mode .sk-video-frame { outline: 2px dashed rgba(255,255,255,0.18); outline-offset: 0; }',
        // Give the LI an actual hit area larger than the dot itself, so the user can grab
        // anywhere near the dot, not just on the 16px button.
        '.sk-edit-mode .sk-hot {',
        '    cursor: grab;',
        '    width: 44px;',
        '    height: 44px;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    border-radius: 50%;',
        '    background: rgba(232,85,46,0.06);',
        '    user-select: none;',
        '    touch-action: none;',
        '}',
        '.sk-edit-mode .sk-hot:hover { background: rgba(232,85,46,0.18); }',
        '.sk-edit-mode .sk-hot.is-dragging { cursor: grabbing; z-index: 999; background: rgba(232,85,46,0.3); }',
        '.sk-edit-mode .sk-hot-dot {',
        '    transform: none !important;',
        '    animation: none !important;',
        '    background: #fff;',
        '    width: 22px;',
        '    height: 22px;',
        '    border: 3px solid var(--sk-orange);',
        '    box-shadow: 0 0 0 4px rgba(232,85,46,0.35);',
        '    cursor: grab;',
        '    pointer-events: none;', // disable button events; drag fires on the LI instead
        '}',
        '.sk-edit-mode .sk-hot-note { display: none !important; }',
        // Tiny number badge next to each dot so it's easy to track index when reading the dump
        '.sk-edit-mode .sk-hot::after {',
        '    content: attr(data-edit-idx);',
        '    position: absolute;',
        '    top: -4px;',
        '    left: 14px;',
        '    background: var(--sk-orange);',
        '    color: #fff;',
        '    font-family: "Space Mono", monospace;',
        '    font-size: 10px;',
        '    font-weight: 700;',
        '    padding: 2px 5px;',
        '    border-radius: 3px;',
        '    line-height: 1;',
        '    pointer-events: none;',
        '}',
        '.sk-edit-panel {',
        '    position: fixed;',
        '    top: 80px;',
        '    right: 20px;',
        '    width: 300px;',
        '    background: rgba(0,0,0,0.92);',
        '    border: 1px solid var(--sk-orange);',
        '    border-radius: 10px;',
        '    padding: 16px;',
        '    color: #fff;',
        '    font-family: "IBM Plex Mono", monospace;',
        '    font-size: 12px;',
        '    line-height: 1.4;',
        '    z-index: 9999;',
        '    backdrop-filter: blur(8px);',
        '    box-shadow: 0 8px 24px rgba(0,0,0,0.5);',
        '}',
        '.sk-edit-panel h4 { margin: 0 0 6px 0; font-family: var(--sk-serif); font-size: 14px; color: var(--sk-orange); }',
        '.sk-edit-panel p { margin: 6px 0; color: rgba(255,255,255,0.7); font-size: 11px; }',
        '.sk-edit-panel button {',
        '    background: var(--sk-orange);',
        '    color: #fff;',
        '    border: none;',
        '    padding: 8px 12px;',
        '    border-radius: 6px;',
        '    font-family: inherit;',
        '    font-size: 12px;',
        '    cursor: pointer;',
        '    margin-top: 8px;',
        '    width: 100%;',
        '}',
        '.sk-edit-panel button:hover { background: var(--sk-orange-2, #ff8a5c); }',
        '.sk-edit-panel .sk-edit-status { color: #7cd9a3; margin-top: 8px; font-size: 11px; min-height: 14px; }',
    ].join('\n');
    document.head.appendChild(style);

    // Number each dot per panel so the dump is easy to map back.
    document.querySelectorAll('.sk-feature-panel').forEach(function (panel) {
        var i = 1;
        panel.querySelectorAll('.sk-hot').forEach(function (h) {
            h.setAttribute('data-edit-idx', i++);
        });
    });

    // Drag implementation — pointer-based, percentages relative to the parent
    // sk-video-frame. Centers the dot on the cursor (since CSS uses translate(-50%,-50%)).
    var dragging = null;
    var frame = null;

    // Drag on the <li> itself — the dot button is set to pointer-events: none in edit
    // mode so all clicks fall through to here. Way more reliable than fighting button events.
    document.querySelectorAll('.sk-hot').forEach(function (hot) {
        hot.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dragging = hot;
            frame = hot.closest('.sk-video').querySelector('.sk-video-frame');
            hot.classList.add('is-dragging');
            setStatus('Dragging dot ' + (hot.getAttribute('data-edit-idx') || '?') + '…', '#ff8a5c');
        });
    });

    document.addEventListener('mousemove', function (e) {
        if (!dragging || !frame) return;
        var rect = frame.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        // Clamp to frame bounds.
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        dragging.style.left = x.toFixed(1) + '%';
        dragging.style.top  = y.toFixed(1) + '%';
    });

    document.addEventListener('mouseup', function () {
        if (dragging) {
            var idx = dragging.getAttribute('data-edit-idx') || '?';
            var t = dragging.style.top, l = dragging.style.left;
            dragging.classList.remove('is-dragging');
            persistPositions();
            setStatus('Dropped dot ' + idx + ' at top:' + t + ' left:' + l, '#7cd9a3');
        }
        dragging = null;
        frame = null;
    });

    // Touch support — drag on mobile / iPad. Mirrors the mouse handlers.
    document.querySelectorAll('.sk-hot').forEach(function (hot) {
        hot.addEventListener('touchstart', function (e) {
            e.preventDefault();
            dragging = hot;
            frame = hot.closest('.sk-video').querySelector('.sk-video-frame');
            hot.classList.add('is-dragging');
        }, { passive: false });
    });
    document.addEventListener('touchmove', function (e) {
        if (!dragging || !frame) return;
        e.preventDefault();
        var t = e.touches[0];
        var rect = frame.getBoundingClientRect();
        var x = ((t.clientX - rect.left) / rect.width) * 100;
        var y = ((t.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        dragging.style.left = x.toFixed(1) + '%';
        dragging.style.top  = y.toFixed(1) + '%';
    }, { passive: false });
    document.addEventListener('touchend', function () {
        if (dragging) {
            dragging.classList.remove('is-dragging');
            persistPositions();
        }
        dragging = null;
        frame = null;
    });

    // Persist to localStorage so positions survive a page reload.
    function persistPositions() {
        var snapshot = collectPositions();
        try { localStorage.setItem('sk-hotspot-positions', JSON.stringify(snapshot)); } catch (e) {}
    }

    // On load, rehydrate any previously-saved positions (only if they exist for
    // an exact (screen, version, index, note) match — so it's safe across edits).
    function rehydrate() {
        var saved;
        try { saved = JSON.parse(localStorage.getItem('sk-hotspot-positions') || 'null'); } catch (e) { saved = null; }
        if (!saved) return;
        Object.keys(saved).forEach(function (key) {
            var entries = saved[key];
            var panel = findPanelByKey(key);
            if (!panel) return;
            var hots = panel.querySelectorAll('.sk-hot');
            entries.forEach(function (entry, i) {
                var h = hots[i];
                if (!h) return;
                var current = (h.querySelector('.sk-hot-note').textContent || '').trim().slice(0, 50);
                if (entry.note && current && entry.note.slice(0, 50) !== current) return; // mismatch → skip
                h.style.top = entry.top;
                h.style.left = entry.left;
            });
        });
    }

    function findPanelByKey(key) {
        // Key format: "<screen-title>-V<n>"
        var m = key.match(/^(.+)-V(\d+)$/);
        if (!m) return null;
        var title = m[1];
        var version = m[2];
        var sws = document.querySelectorAll('.sk-feature-switch--versions');
        for (var i = 0; i < sws.length; i++) {
            var t = sws[i].querySelector('.sk-feature-screen-title').textContent.trim();
            if (t === title) {
                return sws[i].querySelector('.sk-feature-stage .sk-feature-panel[data-flow="' + version + '"]');
            }
        }
        return null;
    }

    function collectPositions() {
        var out = {};
        document.querySelectorAll('.sk-feature-switch--versions').forEach(function (sw) {
            var title = sw.querySelector('.sk-feature-screen-title').textContent.trim();
            sw.querySelectorAll('.sk-feature-stage .sk-feature-panel').forEach(function (panel) {
                var flow = panel.getAttribute('data-flow');
                var key = title + '-V' + flow;
                var hots = panel.querySelectorAll('.sk-hot');
                out[key] = Array.from(hots).map(function (h) {
                    var note = (h.querySelector('.sk-hot-note').textContent || '').trim();
                    return {
                        top: h.style.top || '',
                        left: h.style.left || '50%',
                        note: note,
                    };
                });
            });
        });
        return out;
    }

    function formatAsHtmlSnippets() {
        var pos = collectPositions();
        var lines = [];
        Object.keys(pos).forEach(function (key) {
            lines.push('=== ' + key + ' ===');
            pos[key].forEach(function (entry, i) {
                var top = entry.top || '50%';
                var left = (entry.left && entry.left !== '50%') ? entry.left : null;
                var styleStr = left ? ('top:' + top + ';left:' + left) : ('top:' + top);
                lines.push((i + 1) + '. style="' + styleStr + '"  — ' + entry.note);
            });
            lines.push('');
        });
        return lines.join('\n');
    }

    // The floating edit panel — controls + status.
    var panel = document.createElement('div');
    panel.className = 'sk-edit-panel';
    panel.innerHTML = [
        '<h4>Hotspot editor</h4>',
        '<p>Drag any dot to move it inside its phone frame. Switch versions with the V tabs to edit each version\'s dots.</p>',
        '<button id="sk-edit-copy" type="button">Copy positions</button>',
        '<button id="sk-edit-download" type="button">Download JSON</button>',
        '<button id="sk-edit-reset" type="button" style="background:transparent;border:1px solid rgba(255,255,255,0.2)">Clear saved (reset)</button>',
        '<div class="sk-edit-status" id="sk-edit-status">Edits autosave to localStorage.</div>',
    ].join('');
    document.body.appendChild(panel);

    var statusEl = document.getElementById('sk-edit-status');
    function setStatus(msg, color) {
        statusEl.textContent = msg;
        statusEl.style.color = color || '#7cd9a3';
        setTimeout(function () {
            statusEl.textContent = 'Edits autosave to localStorage.';
            statusEl.style.color = '#7cd9a3';
        }, 3000);
    }

    document.getElementById('sk-edit-copy').addEventListener('click', function () {
        var text = formatAsHtmlSnippets();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
                function () { setStatus('Copied! Paste back to Claude.'); },
                function () { fallbackCopy(text); }
            );
        } else {
            fallbackCopy(text);
        }
    });

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); setStatus('Copied (legacy mode).'); }
        catch (e) { setStatus('Copy failed — see console.', '#ff8a5c'); console.log(text); }
        document.body.removeChild(ta);
    }

    document.getElementById('sk-edit-download').addEventListener('click', function () {
        var blob = new Blob([JSON.stringify(collectPositions(), null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'hotspot-positions.json';
        a.click();
        URL.revokeObjectURL(url);
        setStatus('Downloaded hotspot-positions.json');
    });

    document.getElementById('sk-edit-reset').addEventListener('click', function () {
        if (!confirm('Clear all saved hotspot positions from this browser? (HTML is unchanged.)')) return;
        try { localStorage.removeItem('sk-hotspot-positions'); } catch (e) {}
        setStatus('Cleared saved positions — reload to revert dots.', '#ff8a5c');
    });

    rehydrate();
})();
