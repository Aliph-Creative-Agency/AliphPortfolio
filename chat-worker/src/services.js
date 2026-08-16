/* ══════════════════════════════════════════════════════════════════
   THE SERVICE TAXONOMY — the one thing that must stay in sync
   with the site.

   These three ids are the same join key `prototype/main.js` uses
   (`CATS`, `SUBCATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`,
   `data-service`). Plan §3: if the studio's services change again,
   this list and `CATS` move together.

   ⚠️ Changed 2026-08-08 from four services to three. The old `identity`
   and `creative` ids are gone: identity work is now `design`, and
   `creative` split — the shooting went to `photo`, the printed and
   posted output to `design`. `events` disappeared as a service; event
   work is classified by what was actually delivered (coverage → photo,
   signage and print → design). A visitor still says "فعالية" though,
   so those keywords are kept and pointed at the service that does it.

   ⚠️ Renamed twice, and the ids did not move either time — only the labels.
   2026-08-10: تصميم → تصميم جرافيكي, تصوير → تصوير احترافي, برمجة → تطوير
   برمجيات. 2026-08-11: تصوير احترافي → صناعة محتوى (Media Production), which
   widened `photo` from photography to everything the feed is made of.
   `kw` deliberately keeps the short forms; a visitor types "تصميم", and
   "تصوير" still routes here because they still shoot.

   ⚠️ `examples` and `kw` are PLACEHOLDERS written by me, not by the
   studio. Plan §10.1 asks ألف for 2–3 real examples per service, and
   the classifier is only as good as its anchors. Replace them before
   this goes near a visitor.
   ══════════════════════════════════════════════════════════════════ */

export const SERVICES = [
  {
    id: "design",
    ar: "تصميم جرافيكي",
    en: "Graphic Design",
    examples: {
      ar: "شعار ونظام بصري لمقهى جديد، دليل هويّة لمؤسّسة، ملصق، قائمة طعام، تغليف منتج",
      en: "a logo and visual system for a new café, a brand guide for an institution, a poster, a menu, product packaging",
    },
    kw: {
      ar: ["تصميم", "ديزاين", "هويه", "هويات", "لوجو", "شعار", "علامه تجاريه", "براند",
           "دليل هويه", "تغليف", "بطاقات", "ريبراند", "نظام بصري", "الوان الشركه",
           "ملصق", "بوستر", "مطبوعات", "طباعه", "قائمه طعام", "منيو", "دعوات",
           "لافته", "لافتات", "بروشور", "كتيب"],
      en: ["design", "graphic design", "logo", "logotype", "brand", "branding", "rebrand",
           "identity", "packaging", "stationery", "guidelines", "brandbook", "wordmark",
           "visual system", "poster", "print", "printable", "printing", "menu",
           "invitation", "signage", "brochure", "booklet", "flyer"],
    },
  },
  {
    id: "photo",
    ar: "صناعة محتوى",
    en: "Media Production",
    examples: {
      ar: "تصوير منتجات، جلسة تصوير لمطعم، فيديو تعريفي، ريلز للمنصّات، تغطية فعاليّة",
      en: "product photography, a shoot for a restaurant, a profile film, reels for social, event coverage",
    },
    /* ⚠️ The social keywords sit here for want of anywhere better. Dropping
       `creative` removed the only service that covered RUNNING an account —
       the three services describe what gets made, not who posts it. A visitor
       asking "حدا يدير الإنستغرام" is routed to the service that produces the
       feed's material. Plan §10.1: ask the studio whether they still take
       channel management, and if so it needs naming somewhere. */
    kw: {
      ar: ["تصوير", "مصور", "صور", "صوره", "فوتو", "فيديو", "فيلم", "ريلز", "ريل",
           "مونتاج", "تلوين", "جلسه تصوير", "بورتريه", "تغطيه", "توثيق",
           "فعاليه", "فعاليات", "حدث", "افتتاح", "معرض", "مؤتمر", "حفل", "عرس",
           "انستغرام", "انستقرام", "سوشيال", "تيك توك", "منشورات", "محتوي"],
      en: ["photography", "photo", "photos", "photographer", "shoot", "photoshoot",
           "video", "film", "footage", "reels", "reel", "editing", "grading",
           "portrait", "coverage", "documentation", "event", "events", "opening",
           "exhibition", "conference", "wedding", "festival",
           "instagram", "social", "social media", "tiktok", "posts", "content"],
    },
  },
  {
    id: "tech",
    ar: "حلول تقنية وبرمجية",
    en: "Tech & Software Solutions",
    examples: {
      ar: "موقع بورتفوليو، صفحة هبوط لحملة، متجر إلكتروني، نظام تسجيل، تطبيق",
      en: "a portfolio site, a campaign landing page, an online store, a registration system, an app",
    },
    kw: {
      ar: ["برمجه", "مبرمج", "موقع", "مواقع", "ويب", "تطبيق", "ابليكيشن", "نظام",
           "منصه", "بورتفوليو", "صفحه هبوط", "لاندنج", "متجر الكتروني", "حجز",
           "تسجيل", "اتمته", "لوحه تحكم", "داشبورد", "دومين", "استضافه"],
      en: ["engineering", "development", "developer", "website", "web", "site", "app",
           "application", "software", "platform", "system", "portfolio", "landing page",
           "ecommerce", "e-commerce", "shop", "booking", "registration", "automation",
           "dashboard", "api", "domain", "hosting"],
    },
  },
];

export const SERVICE_IDS = SERVICES.map((s) => s.id);

export const byId = (id) => SERVICES.find((s) => s.id === id);

/** "تصميم و تصوير" — joined the way the language does. */
export function nameList(ids, lang) {
  const names = ids.map((id) => byId(id)).filter(Boolean).map((s) => s[lang]);
  if (names.length <= 1) return names[0] || "";
  const last = names.pop();
  return names.join(lang === "ar" ? "، " : ", ") + (lang === "ar" ? " و" : " and ") + last;
}
