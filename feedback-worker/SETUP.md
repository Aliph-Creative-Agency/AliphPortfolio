# Aliph feedback form — setup

The form is a Cloudflare Worker: it serves the page from [public/](public/) and
appends every submission to a Google Sheet. Everything below is one-time.

It is the **third deployable** in this repo — the site (`../wrangler.toml`, no
`main`, assets only) and the chat backend (`../chat-worker`) are the other two.
Deploying this cannot affect either. Run `wrangler` from **this** directory.

> 🔴 The three values in step 4 are secrets. They do not go in
> [wrangler.toml](wrangler.toml), which is committed.

---

## 1. Create the Google Sheet

1. Go to <https://sheets.google.com> and create a spreadsheet — call it
   something like *ملاحظات عملاء ألِف*.
2. Leave the first tab **empty**. The Worker writes the Arabic header row by
   itself on the first submission it ever receives.
3. Copy the **Sheet ID** out of the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_LONG_ID`**`/edit`

## 2. Create a Google service account

> ⚠️ You can **reuse the Queen's Retreat service account** instead of making a
> new one — it already exists and already has the Sheets API enabled. If you do,
> skip to step 3 with its `client_email` and `private_key`, and share the new
> Sheet with it. A separate account is tidier if these ever change hands
> separately; the same account is one less thing to rotate.

1. <https://console.cloud.google.com> → create a project (e.g. `aliph-feedback`).
2. **APIs & Services → Library** → search **Google Sheets API** → **Enable**.
3. **APIs & Services → Credentials → Create Credentials → Service account.**
   Any name (e.g. `sheet-writer`). Skip the optional role and user steps.
4. Open the service account → **Keys** → **Add key → Create new key → JSON** →
   download it.
5. Two values out of that JSON:
   - `client_email` — like `sheet-writer@aliph-feedback.iam.gserviceaccount.com`
   - `private_key` — the block starting `-----BEGIN PRIVATE KEY-----`

## 3. Share the Sheet with the service account

In the spreadsheet: **Share** → paste the `client_email` → **Editor** → untick
"Notify people".

⚠️ Skipping this is the single most common way this fails, and the error it
produces is a 403 from Google that says nothing about sharing.

## 4. Add the three secrets

From this directory:

```bash
npx wrangler secret put SHEET_ID
```

```bash
npx wrangler secret put GOOGLE_SA_EMAIL
```

```bash
npx wrangler secret put GOOGLE_SA_PRIVATE_KEY
```

Or in the dashboard: **Workers & Pages → aliph-feedback → Settings → Variables
and Secrets**, all three as **Secret**, not as Variable.

`GOOGLE_SA_PRIVATE_KEY` is the whole value including the `BEGIN`/`END` lines.
Pasting it through a dashboard sometimes turns the newlines into literal `\n` —
[src/index.js](src/index.js) already handles that, so either form works.

## 5. Deploy

```bash
npx wrangler deploy
```

That publishes to `https://aliph-feedback.ceo-6c6.workers.dev`. Then:

- open it, submit one test entry, and confirm the row lands in the Sheet
- delete the test row afterwards; nothing caches it

## 6. Give it a real address

Two options, and **neither one touches the site's own deploy** — both are
routing, configured in the Cloudflare dashboard on the `aliphcreative.com` zone.

**A subdomain** — `feedback.aliphcreative.com`

> Workers & Pages → aliph-feedback → Settings → Domains & Routes → **Add custom
> domain** → `feedback.aliphcreative.com`. Cloudflare creates the DNS record.

**A path on the main domain** — `aliphcreative.com/feedback`

> Same screen → **Add route** → `aliphcreative.com/feedback*` → zone
> `aliphcreative.com`. Requests matching that path go to this Worker; everything
> else still goes to the site.
>
> ⚠️ The route has to be `/feedback*` with the star, because the page also
> fetches `/style.css`, `/app.js` and `/assets/…` — without the star those fall
> through to the site Worker and 404. If you take this option, move the page's
> assets under `/feedback/` first, or the form will load unstyled.
>
> ✅ The one real gain: same origin as the site, so the language a client picked
> on `aliphcreative.com` carries into the form (`localStorage` is per-origin —
> see the note in [public/app.js](public/app.js)).

The subdomain is the simpler of the two and is what this is built for as it
stands.

---

## What lands in the Sheet

Ten columns, written in Arabic whichever language the visitor filled in — the
language they used is its own column at the end.

| # | column | notes |
|---|---|---|
| A | التاريخ والوقت | `YYYY-MM-DD HH:MM`, **Asia/Jerusalem**, not UTC |
| B | الاسم أو المؤسسة | |
| C | الخدمة | multi-select, comma-joined; «أخرى» carries what they typed |
| D | أسلوب التواصل | |
| E | قيمة الخدمة | |
| F | أكثر ما أعجبهم | free text |
| G | انعكاس الرؤية | |
| H | التقييم العام | **plain `1`–`5`** so the column can be averaged |
| I | ما يمكن تحسينه | free text |
| J | لغة النموذج | العربية / English |

Deleting a row does nothing but delete a row — unlike Queen's Retreat, nothing
here counts capacity, so the Sheet is a log and not a source of truth.

## Notes

- **Spam.** There is a honeypot field and a four-second floor on how fast the
  form can be completed. Both are speed bumps. If this ever gets abused for
  real, the answer is **Cloudflare Turnstile** — add the widget to the page and
  verify the token in `handleFeedback` before the append. Nothing else in the
  Worker needs to change.
- **Free text is capped at 2000 characters** per field and the name at 120, in
  the Worker, not just in the markup. A public endpoint that writes to someone
  else's spreadsheet has to bound what it will write.
- **The fonts and the linen are copied, not linked.** `public/assets/` carries
  its own 508 KB of WOFF2 and the 381 KB `fabric.webp`. Linking them from the
  main site would make this page's first paint depend on that site being up,
  and would need CORS headers there that it does not currently send.
- ⚠️ **The palette is duplicated** at the top of [public/style.css](public/style.css).
  If the ink, cream or terracotta ever move in `../prototype/style.css`, they
  have to move here too.
- **`noindex`** is set in the page head. This is a link the agency sends to a
  client, not something that should turn up in a search for Aliph.
