# Screenshot the three real client sites for the work page's profile sheets.
#
# Driven over CDP rather than Chrome's `--screenshot` flag, because that flag
# only ever captures the top of the page at scroll 0, and these are long
# scrolling pages — a shot taken without scrolling shows the same first screen
# every time.
#
# ⚠️ Edge headless will not answer CDP until it has written DevToolsActivePort,
# so the port is read from that file rather than assumed.

import json, os, shutil, subprocess, sys, time, urllib.request
import websocket

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "shots")   # raw captures; gitignored
PROFILE = os.path.join(HERE, "edge-cdp-%d" % int(time.time()))
PORT = 9366


def say(s):
    sys.stdout.write(str(s) + "\n")
    sys.stdout.flush()


class Browser:
    def __init__(self, w=1440, h=900):
        self.proc = subprocess.Popen(
            # ⚠️ --disable-extensions is not tidiness. A fresh --user-data-dir
            # still picked up the signed-in profile's extensions, and the CDP
            # target list came back led by a Grammarly signup tab — so the
            # first "page" target is NOT this browser's blank tab, and driving
            # it screenshots somebody else's page.
            [EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
             "--disable-extensions", "--disable-sync",
             "--disable-component-extensions-with-background-pages",
             "--no-first-run", "--no-default-browser-check",
             "--user-data-dir=" + PROFILE,
             "--remote-debugging-port=%d" % PORT,
             # ⚠️ Without this the HTTP endpoint answers /json perfectly well
             # and then the WebSocket upgrade 403s: Chromium refuses a CDP
             # socket whose Origin it did not expect. "the port is open" is
             # NOT evidence that CDP is reachable.
             "--remote-allow-origins=*",
             "--window-size=%d,%d" % (w, h), "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.ws = None
        self.n = 0
        last = None
        for _ in range(60):
            try:
                pages = json.load(urllib.request.urlopen(
                    "http://127.0.0.1:%d/json" % PORT, timeout=2))
                tgt = [p for p in pages if p["type"] == "page"
                       and p.get("url", "").startswith("about:blank")]
                if tgt:
                    self.ws = websocket.create_connection(
                        tgt[0]["webSocketDebuggerUrl"], timeout=90,
                        max_size=200 * 1024 * 1024)
                    break
            except Exception as e:
                last = e
                time.sleep(0.5)
        if not self.ws:
            raise SystemExit("Edge never came up on CDP: %s: %s"
                             % (type(last).__name__, last))
        self.send("Page.enable")
        self.send("Runtime.enable")

    def send(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(method + ": " + str(msg["error"]))
                return msg.get("result", {})

    def js(self, expr):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True,
                      awaitPromise=True)
        return r.get("result", {}).get("value")

    def goto(self, url, settle=3.5):
        self.send("Page.navigate", url=url)
        time.sleep(settle)
        # Fonts and lazy images decide the layout; a shot taken before they
        # land is a picture of the fallback face.
        try:
            self.js("document.fonts && document.fonts.ready.then(()=>1)")
        except Exception:
            pass
        time.sleep(0.6)

    def size(self, w, h, mobile=False):
        self.send("Emulation.setDeviceMetricsOverride", width=w, height=h,
                  deviceScaleFactor=1, mobile=mobile)

    def scroll(self, y, settle=1.4):
        self.js("window.scrollTo({top:%d,behavior:'instant'})" % y)
        time.sleep(settle)

    def height(self):
        return self.js("document.documentElement.scrollHeight") or 0

    def shot(self, name):
        import base64
        d = self.send("Page.captureScreenshot", format="png",
                      captureBeyondViewport=False)
        p = os.path.join(OUT, name + ".png")
        open(p, "wb").write(base64.b64decode(d["data"]))
        say("  %-28s %6.0f KB" % (name + ".png", os.path.getsize(p) / 1024))
        return p

    def kill(self):
        try:
            self.ws.close()
        except Exception:
            pass
        self.proc.terminate()


def run(jobs):
    os.makedirs(OUT, exist_ok=True)
    b = Browser()
    try:
        for job in jobs:
            slug, url, stops = job[0], job[1], job[2]
            # Optional per-site preparation, run after load. Nothing needs it
            # today; it stays because a live client site can grow a cookie bar
            # or a dev overlay at any time, and a portfolio screenshot must not
            # show one.
            prep = job[3] if len(job) > 3 else None
            say("%s  %s" % (slug, url))
            b.size(1440, 900)
            b.goto(url)
            if prep:
                b.js(prep)
                time.sleep(1.2)
            h = b.height()
            say("  page height %d" % h)
            for i, frac in enumerate(stops):
                b.scroll(int(max(0, (h - 900) * frac)))
                b.shot("%s-%d" % (slug, i + 1))
            # one phone frame per project: these are all mobile-first pages and
            # the sheet should say so
            b.size(390, 844, mobile=True)
            b.goto(url, settle=3.0)
            if prep:
                b.js(prep)
                time.sleep(1.0)
            b.scroll(0)
            b.shot("%s-m" % slug)
    finally:
        b.kill()


if __name__ == "__main__":
    run(json.load(open(os.path.join(HERE, "shoot_jobs.json"), encoding="utf-8")))
