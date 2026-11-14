# Aliph admin: required fixes

Updated 2026-11-14 after the blockers round: live version 638126fd, code main eb329fd (U-04 gallery bar + Publish, U-20 film frames fixed).
Earlier: admin build live as 7496ed8f (main 7aaddf0). Source: the use-case QA run (paused at 17 of 25 tasks, so the
visitor sweep, the two-tabs / unsaved-draft cases and the final design review are still to come) plus what is left from the first QA.

| Bucket | Open | Meaning |
|---|---|---|
| LAUNCH | 0 | the boss cannot finish a task, data loss, or a visitor page is wrong |
| SOON | 29 | works, with friction |
| COSMETIC | 30 | looks wrong, works |
| Already fixed | 5 | found by QA, fixed in the fix round (listed at the end) |

Checks still needed on a real iPhone: items marked "verify".

## SOON (29)

### U-01: The dashboard never says where Publish is
- Where: case UC-01 step 02 · edge, webkit
- Likely cause: prototype/admin/index.html: no Publish control or sentence on the dashboard (grepped index.html)
- Screenshot: `.orchestration/teams/usecases/shots/UC-01/edge/02-where-publish.png`

### U-02: Admin touch targets under 44 px on the phone (bar 30 px tall, Reset 47x22, popover Cancel/Done 32 px, modal buttons 32 px)
- Where: case UC-01, UC-02 step UC-02 03, 07 · webkit
- Likely cause: prototype/admin/editor.css:28 and :58 (min-height 30px), :79 (min-height 22px), :104 (32px)
- Verify: real iPhone
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/webkit/03-popover.png`

### U-07: WebKit draws the Arabic font (Idris) without dots: "نبدأ" shows as "سدأ" (public and admin)
- Where: case UC-02 step 09 (and every AR shot) · webkit · AR
- Likely cause: font or Playwright WebKit engine, not traced
- Verify: real iPhone Safari (LAUNCH if real)
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/webkit/09-pub-ar.png`

### U-08: Phone gallery: the picture grid starts about 3 screens down, under the ring panels
- Where: case UC-01 step 08 · webkit
- Likely cause: prototype/admin/gallery/* layout (panels before grid), not traced further
- Screenshot: `.orchestration/teams/usecases/shots/UC-01/webkit/08-gallery.png`

### U-13: About lead popover hint ("Saved as a draft while you type. Esc ...") never says Enter / line breaks are refused
- Where: case UC-03 step 02 · edge, webkit
- Likely cause: prototype/admin/editor.js:592 (the hint names line breaks only for rich fields)
- Screenshot: `.orchestration/teams/usecases/shots/UC-03/edge/02-open-lead.png`

### U-14: About lead box accepts Enter; the page previews one run-on block, then the save fails (chip "Not saved: line breaks are not allowed here"); the text stays on the page after Done and after reload (browser backup), the server never has it, Publish stays disabled. The boss cannot publish line breaks at all (CASES expected them)
- Where: case UC-03 step 03, 04, 05 · edge, webkit · AR
- Likely cause: prototype/admin/editor.js:515 (Enter/paste guard only when cur.collapse; kind text fields like abLead take Enter) + worker/src/validate.ts:79 (CONTROL_OR_NL refuses it)
- Screenshot: `.orchestration/teams/usecases/shots/UC-03/edge/04-done-unsaved.png`

### U-17: Phone: after a long unbroken text the edit popover is entirely off screen (y 2722-3088 in 844)
- Where: case UC-03 step 06 · webkit
- Likely cause: prototype/admin/editor.js popover placement (no clamp to viewport on phone), not traced to a line
- Verify: re-check with long paragraphs in the iPhone case (U-15 task)
- Screenshot: `.orchestration/teams/usecases/shots/UC-03/webkit/06-over-max.png`

### U-19: Publish gives no feedback until the editor has settled: in 1 of 3 Edge runs the publish modal was not there 5 s after the click (step 8 then published fine; the rerun passed)
- Where: case UC-02 step 07 · edge
- Likely cause: prototype/admin/editor.js:351-358 (settled() = flush + api.changes + loadNames must resolve before the modal opens; no busy state on the button)
- Verify: PLAUSIBLE: seen once; uc-02 step 7 now records the click-to-modal delay
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/edge/07-publish-modal.png`

### U-21: After the new hero photo is uploaded the frames on screen still show the OLD picture (the editor only swaps the 4 tagged originals, not their clones); the boss sees no change until he publishes
- Where: case UC-04a step 05 · edge
- Likely cause: prototype/admin/editor-media.js:103-106 eachHolder() touches only [data-es] holders (same root cause as U-20)
- Screenshot: `.orchestration/teams/usecases/shots/UC-04a/edge/05-upload-done.png`

### U-23: Alt texts typed for a hero film frame (Arabic and English) are saved to the draft and published, but never reach the public page: every public frame-1 <img> has alt=""
- Where: case UC-04a step 11, 12, 14 · edge, webkit · AR + EN public
- Likely cause: prototype/main.js:2431-2436 (the home.film.N merge copies v.src only, never v.alt; buildFilm() writes alt="")
- Screenshot: `.orchestration/teams/usecases/shots/UC-04a/edge/11-pub-ar.png`

### U-25: Opening the picture drawer for a hero frame also opens the site's own lightbox, covering the page and the change; it stays open after the drawer is closed (boss must find the lightbox x). Seen on desktop with a programmatic click on frame 1 (the only way to reach it)
- Where: case UC-04a step 03, 07 · edge
- Likely cause: prototype/main.js:3481-3499 lightbox selector includes .film-frame and the editor does not suppress it (editor-media.js click handler)
- Verify: PLAUSIBLE: needs a real click on a tagged frame (see U-20)
- Screenshot: `.orchestration/teams/usecases/shots/UC-04a/edge/07-close.png`

### U-27: A boss who drops a video on the hero film frame is told only "This is a picture slot. Choose a JPEG, PNG or WebP picture." and not where a video CAN go (the reel carousel further down Home); nothing in the editor says which Home holders take video
- Where: case UC-04b step 02 · edge, webkit
- Likely cause: prototype/admin/editor-media.js:353 (message for kind=video on a non-preview slot)
- Screenshot: `.orchestration/teams/usecases/shots/UC-04b/edge/02-video-in-picture-slot.png`

### U-31: Add files: if the boss chooses the files first and then sets the Batch Category/Sub (Photo, Reels), NO row changes; all 9 rows stay Design / unfiled and would be uploaded to the wrong category. Only rows chosen AFTER the batch is set follow it
- Where: case UC-05a step 02, 03 · edge, webkit
- Likely cause: prototype/admin/gallery/add.js:79-86 (stage() copies the batch values once at staging time) and :127-131 (the batch selects only refresh their own sub list, no row is updated)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/03-batch-category.png`

### U-33: Text typed into the gallery drawer's Alt text fields and then Close pressed (or the drawer dismissed) without Save details is dropped with no warning; reopening shows the old value. The editor autosaves, so the boss expects the same
- Where: case UC-05a step 09 · edge, webkit
- Likely cause: prototype/admin/gallery/drawer.js (draw() rebuilds the form from `it`; no dirty check on #drawer-close / dialog cancel)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/09-close-unsaved.png`

### U-34: New uploads do not appear in the order the boss chose them: eight photos uploaded 1..8 sit in the grid as 2,6,3,8,1,4,7,5 (different every run), because pieces of the same month tie on date and then sort on a random id
- Where: case UC-05a step 05 · edge, webkit
- Likely cause: prototype/admin/gallery/gallery.js:44-50 byOrder (date desc, then a.id.localeCompare; new ids are random: worker/src/publish.ts:72 crypto.randomUUID / upload id prefix)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/05-reload-photo-tab.png`

### U-38: On the phone, after tapping Upload at the bottom of a 9-row list, the uploading row is scrolled off the top and the only thing in view is a grey button still reading 'Upload 9 file(s)': the boss sees nothing happening and no 'n of 9' counter
- Where: case UC-05a step 04 · webkit
- Likely cause: prototype/admin/gallery/add.js:73-77 summary() (button text only counts ready rows; no overall progress); rows are not scrolled into view
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/webkit/04a-mid-upload.png`

### U-39: Moving two new photos and pressing Save order writes an override row for EVERY piece of the run (all 54 default photos as well): the draft jumps to 63 changed, and the Publish window says only 'Gallery: 63 changes' (64 in the bar) for 9 uploads + 1 order + 1 ring; it never says an order changed, so the boss cannot check what he is about to publish
- Where: case UC-05b step 04, 08 · edge, webkit
- Likely cause: prototype/admin/gallery/order.js:84-90 (POST sends every id of the run with its rev) and prototype/admin/editor.js:302-316 changeList() (Gallery line is a bare count)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05b/edge/08a-modal.png`

### U-40: The alt texts the boss typed for the new pieces never reach the public page: every /library tile and the lightbox picture have alt="" (EN and AR), so a screen reader hears nothing for the 8 photos
- Where: case UC-05b step 10, 12 · edge, webkit
- Likely cause: prototype/main.js:3612 (lightbox reads node.dataset.alt, which the library tile builder never sets) and :3646 i.alt = it.alt \|\| ""; the published alt is copied at :2389 but not used (same family as U-23)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05b/edge/12-pub-library-en.png`

### U-43: An empty New client form flags only the Arabic name (small lowercase 'name is required'); the English name, first and also required, gets no error and no focus
- Where: case UC-06a step 03 · edge, webkit
- Likely cause: prototype/admin/gallery/clients.js:112-117 (shows the one field the server names; worker returns a single field error, English name is checked after Arabic)
- Screenshot: `.orchestration/teams/usecases/shots/UC-06a/edge/03-add-empty.png`

### U-45: After assigning pieces to a client the tiles show nothing about it (tile label is 'name, Reels, changed'); the boss has to open every drawer to see who a piece belongs to
- Where: case UC-06a step 07, 08 · edge, webkit
- Likely cause: prototype/admin/gallery/gallery.js tile markup has no client field (grepped gallery.js/assign.js)
- Screenshot: `.orchestration/teams/usecases/shots/UC-06a/edge/08-done-and-drawer.png`

### U-46: The Publish modal after creating a client and assigning 4 pieces says only 'Publish 5 changes to the live site? Gallery: 5 changes': the client and the assignments are not named (same family as U-39)
- Where: case UC-06a step 10 · edge, webkit
- Likely cause: prototype/admin/editor.js:304-312 (changeList folds sections gallery and clients into one 'Gallery: N changes' line)
- Screenshot: `.orchestration/teams/usecases/shots/UC-06a/edge/10a-modal.png`

### U-48: On /library the client caption sits in one row with the date, so a long client name (AR or EN) is squeezed into a narrow column: on the phone (2-column grid, ~156 px tiles) the EN name breaks mid-word ("Mukabbi / r Social") and runs to 5 lines, the AR name to 5-6 lines of one word each; on the desktop it takes 2 lines beside the date
- Where: case UC-06b step 03, 04 · webkit, edge · AR + EN
- Likely cause: prototype/style.css:3561-3569 .tile figcaption (flex row with .t-date nowrap) and :5688 .t-client overflow-wrap:anywhere (breaks inside words instead of wrapping on spaces first)
- Screenshot: `.orchestration/teams/usecases/shots/UC-06b/webkit/04-pub-library-en.png`

### U-49: On the phone every CLOSED section of /library (All, Graphic Design, Media Production, Tech) is about 713 px tall: its title, then blank space the height of the hidden content, so a visitor scrolls through screens of nothing to reach the next section (seen under the Clients index and in the client view, where the 4 pieces of the client are in the first, open panel and the others are blank)
- Where: case UC-06b step 05, 06, 07a · webkit · AR + EN
- Likely cause: prototype/style.css:5066-5083 .acc-panel min-height 64px but .panel-body { height: 74vh } stays in flow when closed (only opacity 0); measured closed panel height 713 at 390x844
- Verify: PLAUSIBLE: measured in WebKit 390x844 and read from the CSS; confirm on a real iPhone
- Screenshot: `.orchestration/teams/usecases/shots/UC-06b/webkit/06-pub-index-en.png`

### U-50: The Discard window after hiding one piece and deleting another says only 'Discard 2 unpublished changes? ... Gallery: 2 changes': it does not name the pieces nor say that one is a hide and one a delete, so the boss throws away work he cannot see (Discard cannot be undone; same family as U-46 for Publish)
- Where: case UC-07 step 07 · edge, webkit
- Likely cause: prototype/admin/editor.js:304-312 (changeList folds gallery + clients into one 'Gallery: N changes' line) used by startDiscard editor.js:384-389; the change rows carry only {section, id} (worker/src/editor/diff.ts:83), no hidden/deleted flag
- Screenshot: `.orchestration/teams/usecases/shots/UC-07/edge/07-discard-modal.png`

### U-56: Text popover: Done / Cancel sit below where the on-screen keyboard ends (popover y 563-595, keyboard line ~y 508), so the boss must dismiss the keyboard to finish
- Where: case UC-08 step 02 · webkit
- Likely cause: prototype/admin/editor.js:592 popover is placed under the field with both textareas stacked; Done is the last row (about 336 px keyboard assumed, no visualViewport handling grepped)
- Verify: real iPhone Safari
- Screenshot: `.orchestration/teams/usecases/shots/UC-08/webkit/02-tap-hero.png`

### U-57: Gallery drawer: Save details sits at y 703-740, below the keyboard line (~y 508) while the boss types the alt text
- Where: case UC-08 step 11 · webkit
- Likely cause: prototype/admin/gallery/drawer.js + gallery.css: the alt fields come before Save details in one scrolling column (no sticky action row grepped)
- Verify: real iPhone Safari
- Screenshot: `.orchestration/teams/usecases/shots/UC-08/webkit/11-alt-photo-1.png`

### U-62: A text file renamed .jpg is refused with "This file could not be read (is it a format the browser decodes?)." and a .pdf / .heic with "That file type is not accepted.": neither says what IS accepted, the first talks about the browser
- Where: case UC-09a step 02 · edge, webkit
- Likely cause: prototype/admin/gallery/add.js:24-29 WHY texts; the editor's list of formats (editor-media.js:330) is not reused
- Screenshot: `.orchestration/teams/usecases/shots/UC-09a/webkit/02-bad-batch.png`

### U-65: A film over 300 MB is refused after 3 s with "That file is too large.": the server said "video over 300 MB" but the page throws the number away, and nothing on the page states the limit beforehand
- Where: case UC-09a step 04 · edge
- Likely cause: prototype/admin/gallery/add.js:24-31 WHY.toolarge ignores the server text (worker/src/gallery/multipart.ts:51 json error "video over 300 MB", 413); editor-media.js:332 the same "That file is too large."
- Verify: WebKit cannot show it here (blob video not decodable, row says "could not be read" at once): real iPhone Safari
- Screenshot: `.orchestration/teams/usecases/shots/UC-09a/edge/04-big-video.png`

### U-67: Editor typing while offline: the chip just says "Offline" (amber) and Publish greys out; it does not say the typed text is only held in this page until the network is back, so closing the tab then loses it. After coming back online it did save ("Saved", text in the draft)
- Where: case UC-09a step 07 · edge, webkit
- Likely cause: prototype/admin/editor.js:175 setChip("offline", "Offline"): no explanation; the popover hint still says "Saved as a draft while you type"
- Screenshot: `.orchestration/teams/usecases/shots/UC-09a/edge/07a-offline.png`

## COSMETIC (30)

### U-03: Chip says "Saved" after Cancel with no change (was "Draft")
- Where: case UC-01 step 06 · edge, webkit
- Likely cause: prototype/admin/editor.js:125 (refreshChip sets Saved whenever nothing is pending)
- Screenshot: `.orchestration/teams/usecases/shots/UC-01/edge/06-cancel.png`

### U-05: Edit popover heading shows the raw key ("hero1 \| hero", "abLead \| ab-read")
- Where: case UC-01, UC-02, UC-03 step UC-02 03, UC-03 02 · edge, webkit
- Likely cause: prototype/admin/editor.js:587 (ed-pop-key span gets the key as text)
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/edge/03-popover.png`

### U-06: No admin icon; /favicon.ico is 404 on every admin page
- Where: case UC-01 step 01 · edge, webkit
- Likely cause: prototype/admin/index.html has no icon link (grepped index.html)
- Screenshot: `.orchestration/teams/usecases/shots/UC-01/edge/01-dashboard.png`

### U-09: History says "Nothing has been published yet." on a live site (revisions list empty on a fresh local DB)
- Where: case UC-01 step 10 · edge, webkit
- Likely cause: prototype/admin/editor.js:753 (message for an empty api.revisions list; wording, and the live site predates the revision log)
- Screenshot: `.orchestration/teams/usecases/shots/UC-01/edge/10-history.png`

### U-10: The Published toast is dir=rtl on the Arabic page: the English sentence shows ".Published. The live site is now revision 1" (full stop at the wrong end)
- Where: case UC-02 step 08 · edge, webkit · AR page, EN toast
- Likely cause: prototype/admin/editor.css:131 .ed-toast inherits direction from the page; no dir="ltr" on the toast
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/edge/08-publish.png`

### U-11: Phone: the toast (y 729-784) overlaps the bar (top 767)
- Where: case UC-02 step 08 · webkit
- Likely cause: prototype/admin/editor.css:131 .ed-toast position vs .ed-bar
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/webkit/08-publish.png`

### U-12: Phone: the bar grows from 2 to 3 rows (43 to 113 px) once the chip says Saved and the button reads "Publish (1)"; eats about 13% of the screen
- Where: case UC-02 step 04 · webkit
- Likely cause: prototype/admin/editor.css:20 .ed-bar wraps at 390 px (@media max-width 520 at :64 only trims gap)
- Screenshot: `.orchestration/teams/usecases/shots/UC-02/webkit/04-type-fix.png`

### U-18: Edge: the popover sits on the paragraph being edited (popover y 483-849 over paragraph 319-529), so the lower lines cannot be read while typing
- Where: case UC-03 step 03 · edge
- Likely cause: prototype/admin/editor.js:506 (popover top = field top + 8)
- Screenshot: `.orchestration/teams/usecases/shots/UC-03/edge/03-type-P3.png`

### U-24: The status chip stays "Draft" while a picture is uploaded and its alt texts are typed (they are saved: server row read back); only Publish (1) shows something happened
- Where: case UC-04a step 06 · edge, webkit
- Likely cause: prototype/admin/editor-media.js save() does not drive the editor chip (editor.js:125 refreshChip only counts text fields)
- Screenshot: `.orchestration/teams/usecases/shots/UC-04a/edge/06-alt-text.png`

### U-26: A landscape photo in the portrait hero frame is centre-cropped by about 42% of its width (the HERO-PHOTO label loses its first and last letter); the drawer shows the whole picture with no crop preview or hint
- Where: case UC-04a step 11 · edge, webkit
- Likely cause: prototype/style.css .film-frame img object-fit: cover (by design); admin drawer thumb shows the uncropped file
- Screenshot: `.orchestration/teams/usecases/shots/UC-04a/webkit/12-pub-en.png`

### U-28: The Video drawer for a reel shows the internal slot name (home.media.2) next to the title and, under a small SQUARE crop of the poster (the HERO-VIDEO label is cut to ERO-VIDE), the full file addresses of poster and film in monospace; the picture drawer does the same with home.film.1 and the poster path
- Where: case UC-04b step 03, 05 · edge, webkit
- Likely cause: prototype/admin/editor-media.js drawer head (.ed-panel-page = slot id) and the .ed-media-src line; thumb css object-fit cover in a square
- Screenshot: `.orchestration/teams/usecases/shots/UC-04b/edge/05-upload-done.png`

### U-29: A normal landscape 16:9 film uploaded to a reel is shown in the 9:16 reel box with only about a third of its width (the HERO-VIDEO label loses both ends, the poster frame is the same crop); neither the drawer nor the upload message warns that a vertical film is expected
- Where: case UC-04b step 05, 10 · edge (webkit: poster was a 3:2 seed, not comparable)
- Likely cause: prototype/style.css .reel-slide img/video object-fit: cover in a 9:16 box (by design for vertical reels); no hint in editor-media.js
- Screenshot: `.orchestration/teams/usecases/shots/UC-04b/edge/10-pub-ar.png`

### U-30: When a media drawer opens, the focus ring of the autofocused Alt text (Arabic) field shows only as an orange line above and below the field (the sides are cut off)
- Where: case UC-04b step 03 · edge, webkit
- Likely cause: not traced (looked in editor.css for the focus style of .ed-media inputs; probably the outline is clipped by the drawer body overflow)
- Verify: PLAUSIBLE: only seen in shots, not measured
- Screenshot: `.orchestration/teams/usecases/shots/UC-04b/webkit/03-open-reel.png`

### U-32: The gallery drawer saves only on Save details, the editor's picture drawer saves by itself; the replace button is 'Replace file…' here and 'Upload new' in the editor, and the status line says 'changed, not published' where the editor chip says 'Draft'. Two words for one action across the two admin screens
- Where: case UC-05a step 06 · edge, webkit
- Likely cause: prototype/admin/gallery/drawer.js:125-127 vs prototype/admin/editor-media.js (Upload new)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/06-open-photo-1.png`

### U-35: A new piece is named by a random prefix plus the file name without its extension (kxgkfw-photo-1, 35itaw-video) on the tile, the drawer title and the confirm texts, not by the name the boss chose (photo-1.jpg, video.mp4); search by file name needs the prefix
- Where: case UC-05a step 05, 06 · edge, webkit
- Likely cause: prototype/admin/gallery/gallery.js:33 fileName = it.id.split('/').pop() and the upload id built from a random prefix + name (admin/shared/media.js upload())
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/06-open-photo-1.png`

### U-36: While rows upload the layout jumps: the row that is uploading loses its Remove button, so its Category/Sub selects and progress bar shift about 30 px right of the waiting rows (and back when it is done)
- Where: case UC-05a step 04 · edge
- Likely cause: prototype/admin/gallery/add.js:47-70 drawRow() (:65-69) appends Remove only when status is ready; the row is a flex line with no fixed columns
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/04a-mid-upload.png`

### U-37: The upload progress bars are the browser's own bright blue (and a grey well), the only blue on the admin; the site look is ink on cream with a terracotta accent
- Where: case UC-05a step 04 · edge, webkit
- Likely cause: prototype/admin/gallery/gallery.css:48 .adm-prog sets only the size (no accent-color / ::-webkit-progress-value)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05a/edge/04a-mid-upload.png`

### U-41: On the phone, the first Earlier tap replaces the two-line Reorder hint by a one-line position note, so the page below the run shifts up about 5 px while the boss is mid-reorder
- Where: case UC-05b step 02 · webkit
- Likely cause: prototype/admin/gallery/order.js:126-139 (.adm-run-note text swapped, height not reserved)
- Screenshot: `.orchestration/teams/usecases/shots/UC-05b/webkit/02-move-8-first.png`

### U-42: On /library (Photo panel) the big sub-section name 'صور' / 'Photos' is drawn on top of the first picture of its run (it covers the top of the new photo-8 and its corner marker) instead of sitting above the grid; same on desktop and phone
- Where: case UC-05b step 09 · edge, webkit
- Likely cause: not traced (looked at the shots only; sub-title overlay vs .lib-grid in prototype/style.css)
- Verify: PLAUSIBLE: seen in shots after scrolling the sub-section to the top of the screen
- Screenshot: `.orchestration/teams/usecases/shots/UC-05b/webkit/09-pub-library-ar.png`

### U-44: Select mode: the tick box on each tile is 24x24 px on the phone (the whole tile does tick, so tapping works; the box only looks small)
- Where: case UC-06a step 05 · webkit
- Likely cause: prototype/admin/gallery/gallery.css .adm-tick (24px); decorate() in assign.js:76
- Verify: real iPhone
- Screenshot: `.orchestration/teams/usecases/shots/UC-06a/webkit/05-select-mode.png`

### U-47: Phone Clients row: the two names share a ~140 px column, the Arabic name wraps to 3 lines in small type under a wrapped English name (row grows tall, Edit/Delete only 35 px high)
- Where: case UC-06a step 04 · webkit
- Likely cause: prototype/admin/gallery/gallery.css .adm-client / .adm-cnames (not traced further)
- Screenshot: `.orchestration/teams/usecases/shots/UC-06a/webkit/04-fill-c1.png`

### U-51: History rows describe a gallery change by its raw file id ('Library · Gallery · pics-Agreements-10-dsc05514.webp', '... · 3mqrtc-photo-3') and never say what happened to it (hidden, unhidden, deleted, added); a text change says only 'Home · Hero · AR', not the words, so the boss cannot tell which revision to restore
- Where: case UC-07 step 12 · edge, webkit
- Likely cause: prototype/admin/editor.js:281-287 rowLabel (gallery -> c.id) and :732-733 revRow (changeLabel = rowLabel(c, false), no text)
- Screenshot: `.orchestration/teams/usecases/shots/UC-07/edge/12-history-panel.png`

### U-52: The gallery's Delete confirm box opens glued to the TOP-LEFT corner of the desktop window, far from the drawer on the right where Delete was pressed (on the phone it covers the drawer's title and Close)
- Where: case UC-07 step 05 · edge, webkit
- Likely cause: prototype/style.css:114 '* { margin: 0 }' (loaded by gallery/index.html:8) removes the UA 'dialog:modal { margin: auto }' centring; gallery.css:69 .adm-confirm sets no margin/inset
- Screenshot: `.orchestration/teams/usecases/shots/UC-07/edge/05-delete-p2-confirm.png`

### U-53: Two admin looks: the editor's Publish / Discard / Restore windows, toast and History panel are set in the system sans-serif (Segoe UI) on white with small grey-bordered buttons, while the gallery, its drawer and confirm box use the site serif on cream with ink buttons; the same kind of 'Are you sure?' window looks like two different apps
- Where: case UC-07 step 05, 07, 12, 13 · edge, webkit
- Likely cause: prototype/admin/editor.css:16, :86, :97 (font: system-ui, 'Segoe UI', sans-serif) vs prototype/admin/gallery/gallery.css:69 (var(--font-body))
- Verify: may be a deliberate 'tool chrome vs site' choice: designer to confirm
- Screenshot: `.orchestration/teams/usecases/shots/UC-07/edge/07-discard-modal.png`

### U-54: On /library (AR, desktop), once the Photo panel is scrolled, the site header's menu icon is drawn on top of the bar title 'الأرشيف' and a faint word shows under the language pill: the page's own bar and the fixed header overlap
- Where: case UC-07 step 02, 21 · edge · AR
- Likely cause: not traced (no CSS grep done): fixed site header vs the /library bar .lib-bar .lib-title
- Verify: PLAUSIBLE: seen in two shots after scrollIntoView of a tile; re-check by scrolling by hand (the header may be mid-transition)
- Screenshot: `.orchestration/teams/usecases/shots/UC-07/edge/21-pub-library-c-ar.png`

### U-58: Ring pick rows are ragged on the phone: Earlier / Later / Remove wrap onto 1 to 3 lines depending on the name length, 28 px high buttons
- Where: case UC-08 step 13 · webkit
- Likely cause: prototype/admin/gallery/gallery.css:78 .adm-pick is display:flex; flex-wrap:wrap with a 5.6rem picture + number + name + 3 buttons
- Screenshot: `.orchestration/teams/usecases/shots/UC-08/webkit/13-ring-photo-5.png`

### U-59: Photo ring lists picks as a blank grey thumbnail with a tiny "unknown" tag and no explanation of what they are
- Where: case UC-08 step 13 (and 10 above the fold) · webkit
- Likely cause: prototype/admin/gallery/rings.js:55 a pick whose id is not among the gallery items gets the badge "unknown"; the thumbnail is empty. PLAUSIBLY a local-only data gap (default picks reels-*.webp)
- Verify: same screen on the real data
- Screenshot: `.orchestration/teams/usecases/shots/UC-08/webkit/13-ring-photo-5.png`

### U-60: A refused file in the Add files list is marked only by red-brown message text and an empty grey bar: no icon, border or background, and its Category/Sub selects stay live
- Where: case UC-09a step 02 · edge, webkit
- Likely cause: prototype/admin/gallery/gallery.css:50 .adm-row[data-status="error"] .adm-rmsg { color: var(--accent) } is the only error style; add.js:62 drawRow keeps the selects
- Screenshot: `.orchestration/teams/usecases/shots/UC-09a/webkit/02-bad-batch.png`

### U-63: Same wrong file, two wordings: the editor picture drawer says "That file could not be read. Use a JPEG, PNG or WebP picture, or an MP4 or WebM film." (good: says what to do), the gallery says "That file type is not accepted."
- Where: case UC-09a step 02, 03 · edge, webkit
- Likely cause: prototype/admin/editor-media.js:327 mediaMessage vs prototype/admin/gallery/add.js:24 WHY: two separate message tables
- Screenshot: `.orchestration/teams/usecases/shots/UC-09a/edge/03a-pdf-message.png`

### U-68: After the failed upload the page throws an uncaught "Failed to fetch" / "Load failed" (the gallery refresh after the batch is unguarded), so the item count and tiles are not refreshed while offline
- Where: case UC-09a step 05 · edge, webkit
- Likely cause: prototype/admin/gallery/add.js:123 go() awaits load() with no try/catch, called from a click handler
- Screenshot: `.orchestration/teams/usecases/shots/UC-09a/edge/05a-network-error.png`

## Left over from the first QA (not in the list above)

- F-04 SOON (tests only): the visual check flips between two renders of one gallery tile.
- F-11 COSMETIC: a long English client name wraps to 3 lines on `/library?client=` on a phone (rule is 2).
- F-13 SOON: the lightbox cannot be swiped on a phone, only the arrow buttons work.
- F-16 COSMETIC: `/about` in Arabic on a phone shifts slightly while loading on a slow connection.
- F-19 COSMETIC: the testimonial business line is just under the readable contrast level on a phone.
- Backlog: keyboard focus does not return to the tile when the lightbox closes; one autosave test is timing-sensitive.

## Already fixed in the fix round (5)

- U-04 (LAUNCH, blockers round): The gallery page has no Publish and no link back to the dashboard or editor
- U-20 (LAUNCH, blockers round): The boss cannot choose the hero picture he wants to change: on desktop none of the film frames on screen opens the picture editor; on the phone a tap opens a RANDOM one (home.film.4 in the run), not frame 1. Only 4 of the 24 frames are editable (the first group, which travels in and out of view); the rest are clones
- U-55 (LAUNCH, first QA F-08): On an iPhone-sized touch screen, tapping the heading does not open the text editor: 3 taps, nothing (only a mouse-style click opens it)
- U-61 (SOON, first QA F-09): A refused or failed upload row cannot be removed or retried: no Remove / Retry button, the boss must reload the page to clear it (and a reload drops the other rows too)
- U-66 (SOON, first QA F-09): Network drop mid-upload: the row says "The network failed; try again." (Edge) or the raw browser text "Load failed" (WebKit, the iPhone engine), with no Retry button and no word about being offline / checking the Wi-Fi; the partly filled bar stays beside it

Also done: R2 rule clears half-finished uploads after 1 day. Still to check on a real iPhone: tap-to-edit (F-08), the film-frame tap (U-20), Arabic dots (U-07), and that a changed film picture shows on every copy in the strip (not covered by a test).
