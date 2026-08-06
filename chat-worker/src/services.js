/* ══════════════════════════════════════════════════════════════════
   THE SERVICE TAXONOMY — the one thing that must stay in sync
   with the site.

   These four ids are the same join key `prototype/main.js` uses
   (`CATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`,
   `data-service`). Plan §3: if the studio's services change again,
   this list and `CATS` move together.

   ⚠️ `examples` and `kw` are PLACEHOLDERS written by me, not by the
   studio. Plan §10.1 asks ألف for 2–3 real examples per service, and
   the classifier is only as good as its anchors. Replace them before
   this goes near a visitor.
   ══════════════════════════════════════════════════════════════════ */

export const SERVICES = [
  {
    id: "identity",
    ar: "هويّات بصريّة",
    en: "Identities",
    examples: {
      ar: "شعار ونظام بصري لمقهى جديد، دليل هويّة لمؤسّسة، تغليف منتج",
      en: "a logo and visual system for a new café, a brand guide for an institution, product packaging",
    },
    kw: {
      ar: ["هويه", "هويات", "لوجو", "شعار", "علامه تجاريه", "براند", "دليل هويه",
           "تغليف", "بطاقات", "ريبراند", "نظام بصري", "الوان الشركه"],
      en: ["logo", "logotype", "brand", "branding", "rebrand", "identity", "packaging",
           "stationery", "guidelines", "brandbook", "wordmark", "visual system"],
    },
  },
  {
    id: "creative",
    ar: "تسويق ومحتوى إبداعي",
    en: "Creative Marketing",
    examples: {
      ar: "إدارة إنستغرام لمطعم، تصوير منتجات، حملة إعلانية، كتابة محتوى",
      en: "running a restaurant's Instagram, product photography, an ad campaign, content writing",
    },
    kw: {
      ar: ["تسويق", "محتوي", "سوشيال", "انستغرام", "انستقرام", "فيسبوك", "تيك توك",
           "حمله", "اعلان", "اعلانات", "تصوير", "فيديو", "ريلز", "كتابه", "كوبي", "منشورات"],
      en: ["marketing", "content", "social", "social media", "instagram", "facebook",
           "tiktok", "campaign", "ads", "advertising", "photography", "photo", "video",
           "reels", "copywriting", "posts", "seo"],
    },
  },
  {
    id: "events",
    ar: "تنظيم فعاليّات",
    en: "Events",
    examples: {
      ar: "افتتاح فرع، معرض، مؤتمر، تفعيل ميداني",
      en: "a branch opening, an exhibition, a conference, a field activation",
    },
    kw: {
      ar: ["فعاليه", "فعاليات", "حدث", "افتتاح", "معرض", "مؤتمر", "حفل", "تنظيم",
           "بوث", "جناح", "ورشه", "احتفال", "اطلاق منتج"],
      en: ["event", "events", "opening", "launch party", "exhibition", "conference",
           "activation", "booth", "ceremony", "workshop", "festival"],
    },
  },
  {
    id: "tech",
    ar: "حلول تقنيّة",
    en: "Technical Solutions",
    examples: {
      ar: "موقع إلكتروني، نظام تسجيل، تطبيق، أتمتة عمليّات",
      en: "a website, a registration system, an app, process automation",
    },
    kw: {
      ar: ["موقع", "مواقع", "ويب", "تطبيق", "ابليكيشن", "نظام", "برمجه", "منصه",
           "متجر الكتروني", "حجز", "تسجيل", "اتمته", "لوحه تحكم", "داشبورد", "دومين"],
      en: ["website", "web", "site", "app", "application", "software", "platform",
           "system", "ecommerce", "e-commerce", "shop", "booking", "registration",
           "automation", "dashboard", "api", "domain"],
    },
  },
];

export const SERVICE_IDS = SERVICES.map((s) => s.id);

export const byId = (id) => SERVICES.find((s) => s.id === id);

/** "هويّات بصريّة و تسويق ومحتوى إبداعي" — joined the way the language does. */
export function nameList(ids, lang) {
  const names = ids.map((id) => byId(id)).filter(Boolean).map((s) => s[lang]);
  if (names.length <= 1) return names[0] || "";
  const last = names.pop();
  return names.join(lang === "ar" ? "، " : ", ") + (lang === "ar" ? " و" : " and ") + last;
}
