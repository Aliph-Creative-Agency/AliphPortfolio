# -*- coding: utf-8 -*-
"""Extract / rebuild source comments without ever touching code.

scan(text, js) -> list of (start, end, kind) spans for real comments only.
It is string- and regex-literal-aware, so a "//" inside a URL or a "/*" inside
a CSS url() is never mistaken for a comment.

rebuild() splices new comment text into the ORIGINAL code segments, so the
code between comments is copied verbatim and cannot drift. verify() then
re-extracts both versions and asserts the code halves are byte-identical.
"""
import io, json, re, sys

ID = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$")


def scan(t, js):
    """Return comment spans [(start, end, kind)] — kind is 'block' or 'line'."""
    out, i, n = [], 0, len(t)
    prev = ""                      # last significant char, for regex detection
    while i < n:
        c = t[i]
        # string literals
        if c in "\"'" or (js and c == "`"):
            q, i = c, i + 1
            while i < n:
                if t[i] == "\\":
                    i += 2; continue
                if t[i] == q:
                    i += 1; break
                i += 1
            prev = q
            continue
        if c == "/" and i + 1 < n:
            nxt = t[i + 1]
            if nxt == "*":
                j = t.find("*/", i + 2)
                j = n if j == -1 else j + 2
                out.append((i, j, "block")); i = j; continue
            if nxt == "/" and js:
                j = t.find("\n", i)
                j = n if j == -1 else j
                out.append((i, j, "line")); i = j; continue
            if js and prev not in ID and prev not in ")]":
                # regex literal — skip it so /.../ contents aren't parsed
                i += 1
                while i < n:
                    if t[i] == "\\":
                        i += 2; continue
                    if t[i] == "[":
                        while i < n and t[i] != "]":
                            i += 2 if t[i] == "\\" else 1
                    if t[i] == "/":
                        i += 1; break
                    if t[i] == "\n":
                        break
                    i += 1
                prev = "/"
                continue
        if not c.isspace():
            prev = c
        i += 1
    return out


def split(t, js):
    """-> (code_segments, comments). len(code) == len(comments) + 1."""
    spans = scan(t, js)
    code, comments, last = [], [], 0
    for s, e, _ in spans:
        code.append(t[last:s]); comments.append(t[s:e]); last = e
    code.append(t[last:])
    return code, comments


def rebuild(code, comments):
    out = []
    for i, seg in enumerate(code):
        out.append(seg)
        if i < len(comments):
            out.append(comments[i])
    return "".join(out)


def codeonly(t, js):
    """Normalised code text, for proving nothing but comments moved."""
    code, _ = split(t, js)
    joined = "".join(code)
    return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n", joined)).strip()


FILES = {
    "prototype/style.css": False,
    "prototype/main.js": True,
    "prototype/chat/aliph-chat.css": False,
    "prototype/chat/aliph-chat.js": True,
}

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "dump":
        f = sys.argv[2]
        t = io.open(f, encoding="utf-8").read()
        code, comments = split(t, FILES[f])
        for i, c in enumerate(comments):
            line = t[:t.index(c)].count("\n") + 1 if c in t else 0
            print("### %d  (line ~%d, %d chars)" % (i, line, len(c)))
            print(c)
            print()
    elif cmd == "count":
        for f, js in FILES.items():
            t = io.open(f, encoding="utf-8").read()
            _, comments = split(t, js)
            print("%-32s %3d comments, %5d comment chars" %
                  (f, len(comments), sum(len(c) for c in comments)))
    elif cmd == "verify":
        base = json.load(io.open(sys.argv[2], encoding="utf-8"))
        ok = True
        for f, js in FILES.items():
            now = codeonly(io.open(f, encoding="utf-8").read(), js)
            same = now == base[f]
            ok &= same
            print("%-32s code identical: %s" % (f, "YES" if same else "*** NO ***"))
        sys.exit(0 if ok else 1)
    elif cmd == "snapshot":
        base = {f: codeonly(io.open(f, encoding="utf-8").read(), js)
                for f, js in FILES.items()}
        json.dump(base, io.open(sys.argv[2], "w", encoding="utf-8"))
        print("snapshot written")
