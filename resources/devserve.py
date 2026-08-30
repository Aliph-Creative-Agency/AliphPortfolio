"""A static server for the prototype that refuses to be cached.

`python -m http.server` sends Last-Modified and no Cache-Control, so Chrome
applies HEURISTIC freshness — 10% of the document's age — and serves style.css
and main.js out of its own cache WITHOUT revalidating. During a session that is
editing those two files that is not a nuisance, it is a source of false
readings: the page under test is the one from ten minutes ago, every
measurement taken against it is wrong, and nothing in the browser says so.
It cost most of an hour on 2026-08-30 before `performance.getEntriesByType`
showed main.js loading at its previous byte size straight from cache.

`Cache-Control: no-store` is the only directive that stops a store outright —
`no-cache` still stores and merely forces revalidation, which a 304 then
satisfies from the same stale entry.

    python resources/devserve.py [port] [dir]

Defaults to 8323 and ./prototype, which is the pair `.claude/launch.json`
starts as "aliph-prototype-nocache". Use it for anything being MEASURED; the
plain http.server configs are fine for a quick look.
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoStoreHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    # SimpleHTTPRequestHandler answers If-Modified-Since with a 304 on its own,
    # which hands back the stale entry the headers above just tried to forbid.
    def send_header(self, keyword, value):
        if keyword.lower() == "last-modified":
            return
        super().send_header(keyword, value)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8323
    root = sys.argv[2] if len(sys.argv) > 2 else "prototype"
    handler = partial(NoStoreHandler, directory=root)
    print("serving %s on http://localhost:%d with no-store" % (root, port))
    # ⚠️ THREADING, not HTTPServer. This page pulls fonts, a sprite, posters
    # and video; a single-threaded server answers one at a time and a media
    # request that keeps its connection open stalls every other asset behind
    # it. The page then hangs with only "/" served, which reads exactly like a
    # broken build rather than a blocked queue.
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
