# Aliph feedback form — setup

The form is a Cloudflare Worker: it serves the page from [public/](public/) and
appends every submission to a Google Sheet. Everything below is one-time.

It is the **third deployable** in this repo — the site (`../wrangler.toml`, no
`main`, assets only) and the chat backend (`../chat-worker`) are the other two.
Deploying this cannot affect either. Run `wrangler` from **this** directory.

> 🔴 The three values in step 4 are secrets. They do not go in
> [wrangler.toml](wrangler.toml), which is committed.

---

## 1. The Google Sheet

> ✅ **Done 2026-08-30.** The agency repurposed the Queen's Retreat
> registration spreadsheet: renamed, emptied, and its registrations exported to
> an `.xlsx` kept outside git. The ID is not written here — this file is
> committed, and the ID is one of the three secrets.
>
> 🔴 **Queen's Retreat had to be archived off that sheet first, and it was.**
> Its Worker read the same first tab and counted every row with a non-empty
> column B as an occupied seat — which is exactly what a feedback row has, the
> client's name. See the ARCHIVED block in that project's `src/worker.js`. Its
> page is still live as a portfolio piece; it just no longer touches a Sheet.

If you ever start a fresh one:

1. Go to <https://sheets.google.com> and create a spreadsheet — call it
   something like *ملاحظات عملاء ألِف*.
2. Leave the first tab **empty**. The Worker writes the Arabic header row by
   itself on the first submission it ever receives.
3. Copy the **Sheet ID** out of the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_LONG_ID`**`/edit`

## 2. Create a Google service account

> 🔴 **YOU CANNOT REUSE THE QUEEN'S RETREAT SERVICE ACCOUNT.** An earlier
> version of this file said you could, and it was wrong in a way that costs an
> afternoon to discover.
>
> **A Cloudflare secret cannot be read back** — not from the dashboard, not
> from `wrangler`. You can set one and you can overwrite one; you cannot see
> one. The Queen's Retreat Worker is *using* that private key, and nothing can
> show it to you. There is no key JSON anywhere on the studio machine either
> (Downloads, Desktop, Documents and the whole Projects tree were searched for
> `"type": "service_account"` — nothing).
>
> ⚠️ You **can** still read that account's `client_email`: open the Sheet →
> Share, and it is listed as an Editor. That is a trap, not a shortcut. An
> email without its private key authenticates nothing.
>
> ✅ So: make a new service account, under an account the agency controls, and
> **keep the downloaded JSON somewhere durable.** That file is the only copy of
> the key that will ever exist.

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

In the spreadsheet: **Share** → paste the **new** account's `client_email` →
**Editor** → untick "Notify people".

⚠️ The Queen's Retreat account may already be listed there as an Editor from
the sheet's previous life. That is harmless — its Worker no longer reads or
writes anything — but it is not the account this form uses, and leaving it does
not save you this step.

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

## 5. ✅ Already done — deployed, and at its real address

> The Worker is **live at <https://feedback.aliphcreative.com>** as of
> 2026-08-29. Steps 5 and 6 are recorded here because they explain the state
> you are walking into, not because there is anything left to do in them.

🔴 **Setting a secret needs the Worker to already exist** — `wrangler secret put`
answers `Worker "aliph-feedback" not found` otherwise. That is why the deploy
came first and why the form spent a window live with no Sheet behind it. It
says so on the page and refuses submissions with a 503 rather than losing them;
see `src/index.js`. **Adding the three secrets needs no redeploy** — they take
effect on their own and the notice clears itself.

⚠️ **`aliph-feedback.ceo-6c6.workers.dev` is OFF.** Declaring `routes` disables
workers.dev unless `workers_dev = true` says otherwise. One address is the right
end state, but do not read that host's silence as a broken deploy.

**Redeploying**, after a change to the page or the Worker:

```bash
npx wrangler deploy
```

🔴 **Read the deploy summary's trigger list, not the exit code.** It prints the
addresses it actually published to. A misplaced key in `wrangler.toml` does not
fail — it does nothing: `routes` written under `[observability]` became
`observability.routes`, and wrangler deployed happily to workers.dev with no
custom domain at all.

## 6. The address, and the alternative that was not taken

`feedback.aliphcreative.com` is a **custom domain declared in
[wrangler.toml](wrangler.toml)**, not a dashboard click — `custom_domain = true`
makes wrangler create the hostname and its DNS record at deploy time, so the
address lives with the thing it points at. **Neither this nor the alternative
touches the site's own deploy**; both are routing on the `aliphcreative.com`
zone, and the site keeps the apex and `www`.

**The alternative, still available** — `aliphcreative.com/feedback`

> A route rather than a custom domain: `aliphcreative.com/feedback*` on zone
> `aliphcreative.com`. Requests matching that path go to this Worker; everything
> else still goes to the site.
>
> ⚠️ The star is load-bearing, because the page also fetches `/style.css`,
> `/app.js` and `/assets/…` — without it those fall through to the site Worker
> and 404. Taking this option means moving the page's assets under `/feedback/`
> first, or the form loads unstyled.
>
> ✅ Its one real gain: same origin as the site, so the language a client picked
> on `aliphcreative.com` carries into the form (`localStorage` is per-origin —
> see the note in [public/app.js](public/app.js)).

## 7. The first real submission

🔴 **The Sheets append has never run.** Every validation path was exercised
against `wrangler dev` with no credentials at all, because they all return
before Sheets is touched — but the append itself needs the three secrets and a
shared Sheet, so the first submission after step 4 is the first time that code
executes.

- open <https://feedback.aliphcreative.com>, confirm the "not accepting
  responses" notice is **gone** and Send is enabled
- submit one test entry and confirm the row lands in the Sheet
- delete the test row afterwards; nothing caches it

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
