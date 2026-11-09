#!/usr/bin/env python3
"""Local preview for the portfolio.

Serves the site the way GitHub Pages does, so clean URLs work (/motion serves
motion.html, /nocta serves nocta.html), and reloads the open page whenever a
file is saved, like VS Code's Live Server. Nothing to install: standard library
only.

    python3 tools/dev-server.py          # http://127.0.0.1:4173
    python3 tools/dev-server.py 5502     # another port
"""
import http.server
import os
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
WATCH = ('.html', '.css', '.js', '.svg', '.json', '.png', '.jpg', '.webp', '.mp4')
SKIP = {'.git', 'node_modules', '.claude', 'supabase'}

# Added to every HTML page: listens for a save and reloads
RELOAD = (b'<script>(function () { var s = new EventSource("/__reload");'
          b' s.onmessage = function () { location.reload(); }; })();</script>')

version = 0
changed = threading.Condition()


def signature():
    newest = 0
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for name in files:
            if name.endswith(WATCH):
                try:
                    newest = max(newest, os.stat(os.path.join(folder, name)).st_mtime)
                except OSError:
                    pass
    return newest


def watch():
    global version
    last = signature()
    while True:
        time.sleep(0.6)
        now = signature()
        if now != last:
            last = now
            with changed:
                version += 1
                changed.notify_all()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # /motion -> motion.html, as on GitHub Pages
    def translate_path(self, path):
        full = super().translate_path(path)
        if not os.path.exists(full) and not os.path.splitext(full)[1] and os.path.exists(full + '.html'):
            return full + '.html'
        if os.path.isdir(full) and os.path.exists(os.path.join(full, 'index.html')):
            return os.path.join(full, 'index.html')
        return full

    def do_GET(self):
        if self.path.startswith('/__reload'):
            return self.stream_reloads()
        full = self.translate_path(self.path)
        if full.endswith('.html') and os.path.isfile(full):
            return self.send_page(full)
        return super().do_GET()

    def send_page(self, full):
        with open(full, 'rb') as f:
            body = f.read()
        at = body.rfind(b'</body>')
        body = body[:at] + RELOAD + body[at:] if at >= 0 else body + RELOAD
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # Nothing is cached, so a saved change always shows on the next load
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def stream_reloads(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.end_headers()
        seen = version
        try:
            while True:
                with changed:
                    changed.wait(timeout=15)
                    now = version
                if now != seen:
                    self.wfile.write(b'data: reload\n\n')
                    self.wfile.flush()
                    return
                self.wfile.write(b': still here\n\n')  # keeps the connection open
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, fmt, *args):
        if not self.path.startswith('/__reload'):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    threading.Thread(target=watch, daemon=True).start()
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    server.daemon_threads = True
    print('Portfolio preview: http://127.0.0.1:%d  (Ctrl+C to stop)' % PORT)
    server.serve_forever()
