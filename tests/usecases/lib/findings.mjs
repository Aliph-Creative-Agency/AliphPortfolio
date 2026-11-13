// Findings registry of the use-case QA. The orchestrator renders REPORT.md from this + runs/*.jsonl.
// Every case task adds its findings here in the same commit as its script (see findings-check.mjs).
// bucket: LAUNCH (data loss, security hole, visitor page wrong, boss cannot finish the task) | SOON (works with
// friction) | COSMETIC (looks wrong, works) | NOT (investigated, works as designed: not a finding).
// Shot paths are relative to ORCH/teams/usecases/shots/. cause "unknown" = not traced (what was grepped is said).
// fx = first-QA cross-reference (F-xx); fromObaida = came from OBAIDA-NOTES.md.

const base = { fx: "", fromObaida: false, verify: "", lang: "EN (admin UI)" };
const f = (o) => ({ ...base, ...o });

export const FINDINGS = [
  f({ id: "U-01", bucket: "SOON", title: "The dashboard never says where Publish is", uc: "UC-01", steps: "02", configs: "edge, webkit",
    shot: "UC-01/edge/02-where-publish.png", cause: "prototype/admin/index.html: no Publish control or sentence on the dashboard (grepped index.html)" }),
  f({ id: "U-02", bucket: "SOON", title: "Admin touch targets under 44 px on the phone (bar 30 px tall, Reset 47x22, popover Cancel/Done 32 px, modal buttons 32 px)", uc: "UC-01, UC-02", steps: "UC-02 03, 07", configs: "webkit",
    shot: "UC-02/webkit/03-popover.png", cause: "prototype/admin/editor.css:28 and :58 (min-height 30px), :79 (min-height 22px), :104 (32px)", verify: "real iPhone" }),
  f({ id: "U-03", bucket: "COSMETIC", title: "Chip says \"Saved\" after Cancel with no change (was \"Draft\")", uc: "UC-01", steps: "06", configs: "edge, webkit",
    shot: "UC-01/edge/06-cancel.png", cause: "prototype/admin/editor.js:125 (refreshChip sets Saved whenever nothing is pending)" }),
  f({ id: "U-04", bucket: "LAUNCH", title: "The gallery page has no Publish and no link back to the dashboard or editor", uc: "UC-01", steps: "08, 09", configs: "edge, webkit",
    shot: "UC-01/edge/09-gallery-way-out.png", cause: "prototype/admin/gallery/*: no back link, no Publish (grepped gallery entry html)" }),
  f({ id: "U-05", bucket: "COSMETIC", title: "Edit popover heading shows the raw key (\"hero1 | hero\", \"abLead | ab-read\")", uc: "UC-01, UC-02, UC-03", steps: "UC-02 03, UC-03 02", configs: "edge, webkit",
    shot: "UC-02/edge/03-popover.png", cause: "prototype/admin/editor.js:587 (ed-pop-key span gets the key as text)" }),
  f({ id: "U-06", bucket: "COSMETIC", title: "No admin icon; /favicon.ico is 404 on every admin page", uc: "UC-01", steps: "01", configs: "edge, webkit",
    shot: "UC-01/edge/01-dashboard.png", cause: "prototype/admin/index.html has no icon link (grepped index.html)" }),
  f({ id: "U-07", bucket: "SOON", title: "WebKit draws the Arabic font (Idris) without dots: \"نبدأ\" shows as \"سدأ\" (public and admin)", uc: "UC-02", steps: "09 (and every AR shot)", configs: "webkit", lang: "AR",
    shot: "UC-02/webkit/09-pub-ar.png", cause: "font or Playwright WebKit engine, not traced", verify: "real iPhone Safari (LAUNCH if real)" }),
  f({ id: "U-08", bucket: "SOON", title: "Phone gallery: the picture grid starts about 3 screens down, under the ring panels", uc: "UC-01", steps: "08", configs: "webkit",
    shot: "UC-01/webkit/08-gallery.png", cause: "prototype/admin/gallery/* layout (panels before grid), not traced further" }),
  f({ id: "U-09", bucket: "COSMETIC", title: "History says \"Nothing has been published yet.\" on a live site (revisions list empty on a fresh local DB)", uc: "UC-01", steps: "10", configs: "edge, webkit",
    shot: "UC-01/edge/10-history.png", cause: "prototype/admin/editor.js:753 (message for an empty api.revisions list; wording, and the live site predates the revision log)" }),
  f({ id: "U-10", bucket: "COSMETIC", title: "The Published toast is dir=rtl on the Arabic page: the English sentence shows \".Published. The live site is now revision 1\" (full stop at the wrong end)", uc: "UC-02", steps: "08", configs: "edge, webkit", lang: "AR page, EN toast",
    shot: "UC-02/edge/08-publish.png", cause: "prototype/admin/editor.css:131 .ed-toast inherits direction from the page; no dir=\"ltr\" on the toast" }),
  f({ id: "U-11", bucket: "COSMETIC", title: "Phone: the toast (y 729-784) overlaps the bar (top 767)", uc: "UC-02", steps: "08", configs: "webkit",
    shot: "UC-02/webkit/08-publish.png", cause: "prototype/admin/editor.css:131 .ed-toast position vs .ed-bar" }),
  f({ id: "U-12", bucket: "COSMETIC", title: "Phone: the bar grows from 2 to 3 rows (43 to 113 px) once the chip says Saved and the button reads \"Publish (1)\"; eats about 13% of the screen", uc: "UC-02", steps: "04", configs: "webkit",
    shot: "UC-02/webkit/04-type-fix.png", cause: "prototype/admin/editor.css:20 .ed-bar wraps at 390 px (@media max-width 520 at :64 only trims gap)" }),
  f({ id: "U-13", bucket: "SOON", title: "About lead popover hint (\"Saved as a draft while you type. Esc ...\") never says Enter / line breaks are refused", uc: "UC-03", steps: "02", configs: "edge, webkit",
    shot: "UC-03/edge/02-open-lead.png", cause: "prototype/admin/editor.js:592 (the hint names line breaks only for rich fields)" }),
  f({ id: "U-14", bucket: "SOON", title: "About lead box accepts Enter; the page previews one run-on block, then the save fails (chip \"Not saved: line breaks are not allowed here\"); the text stays on the page after Done and after reload (browser backup), the server never has it, Publish stays disabled. The boss cannot publish line breaks at all (CASES expected them)", uc: "UC-03", steps: "03, 04, 05", configs: "edge, webkit", lang: "AR",
    shot: "UC-03/edge/04-done-unsaved.png", cause: "prototype/admin/editor.js:515 (Enter/paste guard only when cur.collapse; kind text fields like abLead take Enter) + worker/src/validate.ts:79 (CONTROL_OR_NL refuses it)" }),
  f({ id: "U-15", bucket: "NOT", title: "Over-max text: counter turns red (525/519) and chip says \"Not saved: longer than 519 characters\"", uc: "UC-03", steps: "06", configs: "edge, webkit",
    shot: "UC-03/edge/06-over-max.png", cause: "works as designed" }),
  f({ id: "U-16", bucket: "NOT", title: "After a reload of a refused save the page shows the unsaved text, but the chip still says \"Not saved: line breaks are not allowed here\", so the boss is told. Guard stays in uc-03 step 5 as known(\"U-16\")", uc: "UC-03", steps: "05", configs: "edge, webkit",
    shot: "UC-03/edge/05-reload-unsaved.png", cause: "works as designed (leader checked the shots)" }),
  f({ id: "U-17", bucket: "SOON", title: "Phone: after a long unbroken text the edit popover is entirely off screen (y 2722-3088 in 844)", uc: "UC-03", steps: "06", configs: "webkit",
    shot: "UC-03/webkit/06-over-max.png", cause: "prototype/admin/editor.js popover placement (no clamp to viewport on phone), not traced to a line", verify: "re-check with long paragraphs in the iPhone case (U-15 task)" }),
  f({ id: "U-18", bucket: "COSMETIC", title: "Edge: the popover sits on the paragraph being edited (popover y 483-849 over paragraph 319-529), so the lower lines cannot be read while typing", uc: "UC-03", steps: "03", configs: "edge",
    shot: "UC-03/edge/03-type-P3.png", cause: "prototype/admin/editor.js:506 (popover top = field top + 8)" }),
  f({ id: "U-19", bucket: "SOON", title: "Publish gives no feedback until the editor has settled: in 1 of 3 Edge runs the publish modal was not there 5 s after the click (step 8 then published fine; the rerun passed)", uc: "UC-02", steps: "07", configs: "edge",
    shot: "UC-02/edge/07-publish-modal.png", cause: "prototype/admin/editor.js:351-358 (settled() = flush + api.changes + loadNames must resolve before the modal opens; no busy state on the button)", verify: "PLAUSIBLE: seen once; uc-02 step 7 now records the click-to-modal delay" }),
  f({ id: "U-20", bucket: "LAUNCH", title: "The boss cannot choose the hero picture he wants to change: on desktop none of the film frames on screen opens the picture editor; on the phone a tap opens a RANDOM one (home.film.4 in the run), not frame 1. Only 4 of the 24 frames are editable (the first group, which travels in and out of view); the rest are clones", uc: "UC-04a", steps: "02, 09", configs: "edge, webkit", fromObaida: false,
    shot: "UC-04a/edge/02-click-frame.png", cause: "prototype/main.js:5322-5327 (tagFilm tags the first .film-group only; buildFilm() clones the group, the clones carry no data-es so editor-media.js:33 tagHolders never makes them clickable). The case reaches frame 1 by a programmatic click so the rest of the flow is still proven", verify: "click a frame by hand in /admin/edit/ on the real build" }),
  f({ id: "U-21", bucket: "SOON", title: "After the new hero photo is uploaded the frames on screen still show the OLD picture (the editor only swaps the 4 tagged originals, not their clones); the boss sees no change until he publishes", uc: "UC-04a", steps: "05", configs: "edge",
    shot: "UC-04a/edge/05-upload-done.png", cause: "prototype/admin/editor-media.js:103-106 eachHolder() touches only [data-es] holders (same root cause as U-20)" }),
  f({ id: "U-23", bucket: "SOON", title: "Alt texts typed for a hero film frame (Arabic and English) are saved to the draft and published, but never reach the public page: every public frame-1 <img> has alt=\"\"", uc: "UC-04a", steps: "11, 12, 14", configs: "edge, webkit", lang: "AR + EN public",
    shot: "UC-04a/edge/11-pub-ar.png", cause: "prototype/main.js:2431-2436 (the home.film.N merge copies v.src only, never v.alt; buildFilm() writes alt=\"\")" }),
  f({ id: "U-24", bucket: "COSMETIC", title: "The status chip stays \"Draft\" while a picture is uploaded and its alt texts are typed (they are saved: server row read back); only Publish (1) shows something happened", uc: "UC-04a", steps: "06", configs: "edge, webkit",
    shot: "UC-04a/edge/06-alt-text.png", cause: "prototype/admin/editor-media.js save() does not drive the editor chip (editor.js:125 refreshChip only counts text fields)" }),
  f({ id: "U-25", bucket: "SOON", title: "Opening the picture drawer for a hero frame also opens the site's own lightbox, covering the page and the change; it stays open after the drawer is closed (boss must find the lightbox x). Seen on desktop with a programmatic click on frame 1 (the only way to reach it)", uc: "UC-04a", steps: "03, 07", configs: "edge",
    shot: "UC-04a/edge/07-close.png", cause: "prototype/main.js:3481-3499 lightbox selector includes .film-frame and the editor does not suppress it (editor-media.js click handler)", verify: "PLAUSIBLE: needs a real click on a tagged frame (see U-20)" }),
  f({ id: "U-26", bucket: "COSMETIC", title: "A landscape photo in the portrait hero frame is centre-cropped by about 42% of its width (the HERO-PHOTO label loses its first and last letter); the drawer shows the whole picture with no crop preview or hint", uc: "UC-04a", steps: "11", configs: "edge, webkit",
    shot: "UC-04a/webkit/12-pub-en.png", cause: "prototype/style.css .film-frame img object-fit: cover (by design); admin drawer thumb shows the uncropped file" }),
  f({ id: "U-27", bucket: "SOON", title: "A boss who drops a video on the hero film frame is told only \"This is a picture slot. Choose a JPEG, PNG or WebP picture.\" and not where a video CAN go (the reel carousel further down Home); nothing in the editor says which Home holders take video", uc: "UC-04b", steps: "02", configs: "edge, webkit",
    shot: "UC-04b/edge/02-video-in-picture-slot.png", cause: "prototype/admin/editor-media.js:353 (message for kind=video on a non-preview slot)" }),
  f({ id: "U-28", bucket: "COSMETIC", title: "The Video drawer for a reel shows the internal slot name (home.media.2) next to the title and, under a small SQUARE crop of the poster (the HERO-VIDEO label is cut to ERO-VIDE), the full file addresses of poster and film in monospace; the picture drawer does the same with home.film.1 and the poster path", uc: "UC-04b", steps: "03, 05", configs: "edge, webkit",
    shot: "UC-04b/edge/05-upload-done.png", cause: "prototype/admin/editor-media.js drawer head (.ed-panel-page = slot id) and the .ed-media-src line; thumb css object-fit cover in a square" }),
  f({ id: "U-29", bucket: "COSMETIC", title: "A normal landscape 16:9 film uploaded to a reel is shown in the 9:16 reel box with only about a third of its width (the HERO-VIDEO label loses both ends, the poster frame is the same crop); neither the drawer nor the upload message warns that a vertical film is expected", uc: "UC-04b", steps: "05, 10", configs: "edge (webkit: poster was a 3:2 seed, not comparable)",
    shot: "UC-04b/edge/10-pub-ar.png", cause: "prototype/style.css .reel-slide img/video object-fit: cover in a 9:16 box (by design for vertical reels); no hint in editor-media.js" }),
  f({ id: "U-30", bucket: "COSMETIC", title: "When a media drawer opens, the focus ring of the autofocused Alt text (Arabic) field shows only as an orange line above and below the field (the sides are cut off)", uc: "UC-04b", steps: "03", configs: "edge, webkit",
    shot: "UC-04b/webkit/03-open-reel.png", cause: "not traced (looked in editor.css for the focus style of .ed-media inputs; probably the outline is clipped by the drawer body overflow)", verify: "PLAUSIBLE: only seen in shots, not measured" }),
];

export const bucketCounts = () => {
  const n = { LAUNCH: 0, SOON: 0, COSMETIC: 0 };
  for (const x of FINDINGS) if (x.bucket in n) n[x.bucket]++;
  return n;
};
export const nextFreeId = () => "U-" + String(Math.max(0, ...FINDINGS.map((x) => +x.id.slice(2))) + 1).padStart(2, "0");
