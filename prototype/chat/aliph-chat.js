/* ══════════════════════════════════════════════════════════════════
   ALIPH CHAT WIDGET — stage 1: shell + fallback
   See aliph-chatbot-plan.md §11. This stage builds the launcher, the
   panel, and the unavailable state — the failure path first, so the
   widget can never render a dead chat box.

   NOTHING IS WIRED TO A MODEL YET. The health probe has no backend to
   reach, so the widget correctly and permanently shows the contact card.
   That is the expected stage-1 behaviour, not a bug. Stage 3 sets
   CONFIG.endpoint and the chat surface starts appearing on its own.

   To review the chat surface before a backend exists, load any page with
   ?chat=up (and ?chat=down to force the fallback back).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const CONFIG = {
    /* Stage 3 points these at the Worker. While `endpoint` is null the
       widget skips the probe entirely and goes straight to fallback —
       no failed request, no console noise. */
    endpoint: null,          // e.g. "https://chat.aliphcreative.com/api/chat"
    health: null,            // e.g. "https://chat.aliphcreative.com/api/health"
    healthTimeoutMs: 4000,

    /* ⚠️ Confirm these against the studio before launch — plan §10.3.
       They currently mirror the site's contact footer. */
    email: "info@aliphcreative.com",
    phone: "+972528745090",
    phoneLabel: "+972 52 8745 090",
    whatsapp: "972528745090",
  };

  const T = {
    launch:   { ar: "اسألوا ألِف", en: "Ask Aliph" },
    title:    { ar: "مساعد ألِف", en: "Aliph assistant" },
    sub:      { ar: "يدلّكم على الخدمة المناسبة", en: "Points you to the right service" },
    close:    { ar: "إغلاق", en: "Close" },

    /* the unavailable state */
    downMark:  { ar: "غير متاح", en: "Unavailable" },
    downTitle: { ar: "المساعد غير متاح حاليًّا.", en: "The assistant is offline right now." },
    downNote: {
      ar: "تواصلوا مع الفريق مباشرةً — نردّ عادةً في اليوم نفسه.",
      en: "Reach the team directly — we usually reply the same day.",
    },
    kMail:  { ar: "بريد", en: "Email" },
    kPhone: { ar: "هاتف", en: "Phone" },
    kWhats: { ar: "واتساب", en: "WhatsApp" },

    /* the chat surface */
    greeting: {
      ar: "أهلًا. صِفوا فكرتكم بسطر أو سطرين، وأدلّكم على الخدمة التي تقع تحتها.",
      en: "Hello. Describe your idea in a line or two and I'll tell you which service it falls under.",
    },
    placeholder: { ar: "اكتبوا فكرتكم…", en: "Describe your idea…" },
    send:        { ar: "إرسال", en: "Send" },
    privacy: {
      ar: "لا نحتفظ بسجلّ المحادثة. لا نناقش الأسعار — الفريق يتكفّل بذلك.",
      en: "We don't keep chat history. We don't discuss pricing — the team handles that.",
    },
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Resolve the icons against this file's own URL so the widget keeps
     working from whatever depth it's embedded at. `document.currentScript`
     is only valid while the script is executing, so it must be read here
     at parse time — not later, inside start(), where it is null.
     (`import.meta` is not an option: this is a classic script, and it
     would be a parse-time SyntaxError.) */
  const HERE = (document.currentScript && document.currentScript.src) || location.href;
  const ICONS = {
    seal: new URL("../assets/img/HalfAliph-Stamp-cream.svg", HERE).href,
    mark: new URL("../assets/img/Aliph-Icon-cream.svg", HERE).href,
  };

  /* ── language: follow the site, don't own it ──────────────────────
     main.js writes <html lang> on every switch. Observing that attribute
     keeps the widget in sync without main.js having to know it exists. */
  const readLang = () => (document.documentElement.lang === "en" ? "en" : "ar");
  let lang = readLang();
  const t = (k) => T[k][lang];

  /* ?chat=up / ?chat=down forces a state for design review */
  const forced = new URLSearchParams(location.search).get("chat");

  let root, panel, launcher, bodyEl, footEl, open = false, healthy = false, lastFocus = null;

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ── build ──────────────────────────────────────────────────────── */
  function build() {
    root = el("div", "aliph-chat is-idle");
    root.dir = lang === "ar" ? "rtl" : "ltr";
    root.style.setProperty("--ac-origin", lang === "ar" ? "left" : "right");

    launcher = el("button", "ac-launcher");
    launcher.type = "button";
    launcher.innerHTML = `<img src="${ICONS.seal}" alt="">`;
    launcher.setAttribute("aria-expanded", "false");

    panel = el("div", "ac-panel");
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    /* non-modal on purpose: the page stays usable behind it */
    panel.setAttribute("aria-modal", "false");
    panel.tabIndex = -1;

    panel.innerHTML = `
      <header class="ac-head">
        <span class="ac-head-id">
          <img src="${ICONS.mark}" alt="">
          <span>
            <span class="ac-title"></span>
            <small class="ac-sub"></small>
          </span>
        </span>
        <button class="ac-close" type="button">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16"/>
          </svg>
        </button>
      </header>
      <div class="ac-body"></div>
      <div class="ac-foot"></div>`;

    bodyEl = panel.querySelector(".ac-body");
    footEl = panel.querySelector(".ac-foot");

    root.append(launcher, panel);
    document.body.appendChild(root);

    launcher.addEventListener("click", show);
    panel.querySelector(".ac-close").addEventListener("click", hide);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) hide();
    });

    paint();
  }

  /* ── the two body states ────────────────────────────────────────── */
  function paintDown() {
    const rows = [
      { k: t("kMail"), v: CONFIG.email, href: "mailto:" + CONFIG.email },
      { k: t("kPhone"), v: CONFIG.phoneLabel, href: "tel:" + CONFIG.phone },
      { k: t("kWhats"), v: CONFIG.phoneLabel, href: "https://wa.me/" + CONFIG.whatsapp },
    ];
    bodyEl.innerHTML = `
      <span class="ac-down-mark">${t("downMark")}</span>
      <p class="ac-down-title">${t("downTitle")}</p>
      <p class="ac-down-note">${t("downNote")}</p>
      <div class="ac-rule"></div>
      <div class="ac-contacts">
        ${rows.map((r) => `
          <a class="ac-contact" href="${r.href}"${r.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>
            <span class="ac-contact-k">${r.k}</span>
            <span class="ac-contact-v">${r.v}</span>
          </a>`).join("")}
      </div>`;
    /* no composer when there's nothing to send to */
    footEl.innerHTML = `<p class="ac-privacy">${t("privacy")}</p>`;
  }

  function paintUp() {
    bodyEl.innerHTML = `
      <div class="ac-log">
        <div class="ac-msg ac-msg-bot">${t("greeting")}</div>
      </div>`;
    footEl.innerHTML = `
      <form class="ac-form">
        <textarea class="ac-input" rows="1" placeholder="${t("placeholder")}"></textarea>
        <button class="ac-send" type="submit" aria-label="${t("send")}" disabled>
          <svg viewBox="0 0 34 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M1 6h31"/><path d="M25 1c1.4 2.4 3.6 4 8 5-4.4 1-6.6 2.6-8 5"/>
          </svg>
        </button>
      </form>
      <p class="ac-privacy">${t("privacy")}</p>`;

    /* Stage 1 ships the composer inert on purpose: there is no model to
       answer, and a box that swallows messages is worse than one that
       plainly cannot be used yet. Stage 3 replaces this block. */
    const input = footEl.querySelector(".ac-input");
    const send = footEl.querySelector(".ac-send");
    input.addEventListener("input", () => {
      send.disabled = !input.value.trim();
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 96) + "px";
    });
    footEl.querySelector(".ac-form").addEventListener("submit", (e) => e.preventDefault());
  }

  function paint() {
    panel.querySelector(".ac-title").textContent = t("title");
    panel.querySelector(".ac-sub").textContent = t("sub");
    panel.querySelector(".ac-close").setAttribute("aria-label", t("close"));
    launcher.setAttribute("aria-label", t("launch"));
    panel.setAttribute("aria-label", t("title"));
    (healthy ? paintUp : paintDown)();
  }

  /* ── open / close ───────────────────────────────────────────────── */
  function show() {
    open = true;
    lastFocus = document.activeElement;
    root.classList.remove("is-idle");
    root.classList.add("is-open");
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (!reduced && window.gsap) {
      gsap.fromTo(panel,
        { opacity: 0, y: 18, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" });
    }
    /* Focus the composer when there is one to type into. In the fallback
       state focus the panel itself, not the first contact link — landing
       a terracotta focus ring on an email address makes the card read as
       an error rather than an offer. */
    const input = panel.querySelector(".ac-input");
    (input || panel).focus({ preventScroll: true });
  }

  function hide() {
    open = false;
    root.classList.remove("is-open");
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ── health probe ───────────────────────────────────────────────────
     Decides which body the panel shows. With no endpoint configured it
     resolves false immediately — no request is made at all. Any failure
     (down, quota exhausted, timeout, CORS) lands in the same place: the
     contact card. */
  async function probe() {
    if (forced) return forced === "up";
    if (!CONFIG.health) return false;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), CONFIG.healthTimeoutMs);
      const res = await fetch(CONFIG.health, { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) return false;
      const data = await res.json();
      return data.ok === true && data.quotaRemaining !== 0;
    } catch {
      return false;
    }
  }

  /* ── boot ───────────────────────────────────────────────────────── */
  function start() {
    build();
    probe().then((ok) => {
      healthy = ok;
      paint();
    });

    /* the site's language switch rewrites <html lang>; mirror it */
    new MutationObserver(() => {
      const next = readLang();
      if (next === lang) return;
      lang = next;
      root.dir = lang === "ar" ? "rtl" : "ltr";
      root.style.setProperty("--ac-origin", lang === "ar" ? "left" : "right");
      paint();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
