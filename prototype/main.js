/* ALIPH prototype v04 — i18n, film strip, interactive marquee, story, contact */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
gsap.registerPlugin(ScrollTrigger);

/* ══════════ i18n ══════════ */
const I18N = {
  navHome: { ar: "الرئيسيّة", en: "Home" },
  navWork: { ar: "الأعمال", en: "Work" },
  navAbout: { ar: "من نحن", en: "About" },
  metaPlace: { ar: "القدس، جبل الزيتون", en: "Jerusalem, Mount of Olives" },
  metaIssue: { ar: "العدد ٠١ — حزيران ٢٠٢٦", en: "Issue 01 — June 2026" },

  /* hero */
  heroEyebrow: { ar: "استوديو إبداعي — القدس، جبل الزيتون", en: "A creative studio — Jerusalem, Mount of Olives" },
  hero1: { ar: "نبدأ من حيث", en: "We start where" },
  hero2: { ar: "تبدأ الأشياء.", en: "things begin." },
  /* the boxed letter completes the first word: أ + لِف / A + liph */
  heroPara: {
    ar: "لِف استوديو يبدأ من الحرف الأوّل. لكل علامةٍ نقطة أصلٍ تُبنى منها وتعود إليها، وعملنا هو العثور على تلك النقطة، ثم رسم النظام كاملًا منها: الاسم، والهويّة، والصوت، والطريقة التي تظهر بها العلامة في العالم. نصنع الهويّات والمحتوى والحملات والفعاليّات — من الألِف إلى الياء.",
    en: "liph is a studio that begins at the first letter. Every brand has an origin point it is built from and returns to; our work is finding that point, then drawing the whole system from it: the name, the identity, the voice, and the way the brand shows up in the world. Identities, content, campaigns and events — from A to Z.",
  },
  heroMeta1: { ar: "منذ ٢٠٢٤", en: "Since 2024" },
  heroMeta2: { ar: "١٩ مشروعًا", en: "19 projects" },
  heroMeta3: { ar: "هويّات · محتوى · تسويق · فعاليّات", en: "Identity · Content · Marketing · Events" },
  btnWork: { ar: "كل الأعمال", en: "ALL WORK" },
  btnAbout: { ar: "تعرّف على ألِف", en: "Get to know Aliph" },

  /* testimonials */
  testiBanner: { ar: "ماذا قالوا عنّا", en: "What they said" },
  testiLabel: { ar: "WORD OF MOUTH", en: "شهادات" },

  /* film captions */
  fr1: { ar: "البلدة القديمة — تصوير", en: "The Old City — photography" },
  fr2: { ar: "مواسم الزيتون", en: "Olive Seasons" },
  fr3: { ar: "ليالي رمضان — فعاليّة", en: "Ramadan Nights — event" },
  fr4: { ar: "ورشة الخط", en: "Calligraphy workshop" },
  fr5: { ar: "سوق البلدة — حملة", en: "Old Town Market — campaign" },
  fr6: { ar: "جبل الزيتون", en: "Mount of Olives" },

  /* services */
  svcBanner: { ar: "ماذا نفعل؟", en: "What we do?" },
  svc1: { ar: "هويّات بصريّة", en: "Identities" },
  svc2: { ar: "صناعة محتوى", en: "Content" },
  svc3: { ar: "تسويق مبتكر", en: "Marketing" },
  svc4: { ar: "تنظيم فعاليّات", en: "Events" },
  svc1Label: { ar: "IDENTITY", en: "هويّات بصريّة" },
  svc2Label: { ar: "CONTENT", en: "صناعة محتوى" },
  svc3Label: { ar: "MARKETING", en: "تسويق مبتكر" },
  svc4Label: { ar: "EVENTS", en: "تنظيم فعاليّات" },
  svcCta: { ar: "كل الأعمال في الأرشيف", en: "All work in the archive" },

  /* story */
  storyBanner: { ar: "لماذا ألِف؟", en: "Why Aliph?" },
  st1Eyebrow: { ar: "الاسم", en: "The Name" },
  st1Title: { ar: "صوت واحد، حرفان، ولغتان.", en: "One sound, two letters, two languages." },
  st1Para: {
    ar: "يستمدّ ألِف اسمه من الألف: أوّل حروف الأبجدية العربية، والنقطة التي تبدأ منها كل كلمة، والمقياس الذي تُرسم عليه بقيّة الحروف. ويحمل الاسم معنًى ثانيًا: أَلِفَ، أي اعتاد واطمأنّ واقترب. لذلك يقف الاستوديو عند المعنيين معًا: ثقة الخطوة الأولى، ودفء الشيء المألوف.",
    en: "Aliph takes its name from the alif: the first letter of the Arabic alphabet, the point every word starts from, and the measure the other letters are drawn against. The name carries a second meaning too — alifa, to grow familiar, to draw near, to be at ease. So the studio stands on both: the confidence of the first step, and the warmth of the familiar.",
  },
  st1Pull: { ar: "بداية، وسطر أساس، في الوقت نفسه.", en: "A beginning and a baseline, at once." },
  st1Cap1: { ar: "دفتر الهويّة — الصفحة الأولى", en: "Identity notebook — first page" },
  st1Cap2: { ar: "تجارب الخط", en: "Type trials" },
  st1Cap3: { ar: "الحرف الأوّل", en: "The first letter" },

  st2Eyebrow: { ar: "الطريقة", en: "The Method" },
  st2Title: { ar: "نبحث عن النقطة، ثم نرسم النظام.", en: "We find the point, then draw the system." },
  st2Para: {
    ar: "لكل علامة نقطة أصل تُبنى منها وتعود إليها. عملنا هو العثور على تلك النقطة أوّلًا — في الاسم، أو في الحكاية، أو في المكان — ثم رسم النظام كاملًا منها: الشعار، والألوان، والخط، والصوت، وطريقة الظهور اليوميّة. لا نبدأ من الشكل، بل ننتهي إليه.",
    en: "Every brand has an origin point it is built from and returns to. Our work is to find that point first — in the name, the story, or the place — then draw the whole system from it: the mark, the colors, the type, the voice, and the everyday appearance. We don't start at the form; we arrive at it.",
  },
  st2Pull: { ar: "من الألِف إلى الياء.", en: "From A to Z." },
  st2Cap1: { ar: "جلسة عمل — الاستوديو", en: "Working session — the studio" },
  st2Cap2: { ar: "مسوّدات أوّليّة", en: "Early drafts" },
  st2Cap3: { ar: "اختبار على الورق", en: "Tested on paper" },

  st3Eyebrow: { ar: "النظام", en: "The System" },
  st3Title: { ar: "ألوان من التراب، لا من الصخب.", en: "Colors from the soil, not from noise." },
  st3Para: {
    ar: "حبر أزرق عميق يثبّت النظام البصري، وكريمي دافئ يمنحه مساحة للتنفّس. وحول هذين اللونين تأتي درجات طبيعيّة من الطين والزيتون. الخطّ من عائلة Idris: قسوة حادّة للعناوين، وقسوة مسطّحة للنصوص. والنتيجة نظام مدروس، هادئ، ملموس، وواضح الانتماء إلى ألِف.",
    en: "A deep ink blue anchors the visual system, and a warm cream gives it room to breathe. Around those two sit natural tones drawn from clay and olive. The type is the Idris family: a sharp cut for headlines, a flat cut for text. The result is a system that is considered, quiet, tactile, and unmistakably Aliph.",
  },
  st3Pull: { ar: "تعبير قوي في الأعلى، وهدوء مقروء تحته.", en: "Strong voice above, quiet reading below." },
  st3Cap1: { ar: "القرطاسيّة", en: "Stationery" },
  st3Cap2: { ar: "المطبوعات", en: "Printed matter" },
  st3Cap3: { ar: "لوحة الألوان", en: "The palette" },

  st4Eyebrow: { ar: "الوعد", en: "The Promise" },
  st4Title: { ar: "أن تبدو النتيجة حتميّة.", en: "That the result feels inevitable." },
  st4Para: {
    ar: "لا نسلّم شعارًا ونمضي. نسلّم نظامًا يعرف كيف يتصرّف: في المطبوع، وعلى الشاشة، وفي الشارع، وبين يديّ من يستعمله كل يوم. وحين ينتهي العمل، يُختم بختم الاستوديو — علامة ملكيّة صغيرة تقول إن هذا العمل خرج من هنا.",
    en: "We don't hand over a logo and walk away. We hand over a system that knows how to behave: in print, on screen, in the street, and in the hands of whoever uses it daily. And when the work is done, it carries the studio's seal — a small mark of authorship saying this came from here.",
  },
  st4Pull: { ar: "راسخة، مدروسة، لا تُخطئها العين.", en: "Rooted, considered, impossible to miss." },
  st4Cap1: { ar: "تسليم مشروع", en: "Project handover" },
  st4Cap2: { ar: "الختم على العمل", en: "The seal on the work" },
  st4Cap3: { ar: "في الشارع", en: "Out in the street" },

  /* contact */
  cBand: { ar: "لنبدأ من الألِف", en: "Let's start from the Aliph" },
  cLabelMail: { ar: "للمشاريع والتعاون", en: "Projects & collaboration" },
  cLabelPhone: { ar: "هاتف / واتساب", en: "Phone / WhatsApp" },
  cLabelPlace: { ar: "الاستوديو", en: "The studio" },
  cPlace: { ar: "القدس — جبل الزيتون", en: "Jerusalem — Mount of Olives" },
  cClock: { ar: "بتوقيت القدس", en: "Jerusalem time" },
  legal: { ar: "ألِف © ٢٠٢٦ — جميع الحقوق محفوظة", en: "Aliph © 2026 — All rights reserved" },

  /* library + about */
  libTitle: { ar: "الأرشيف", en: "Archive" },
  libStats: { ar: "٣ سنوات / ١٩ مشروعًا", en: "3 years / 19 projects" },
  libIndex: { ar: "فهرس", en: "Index" },
  libGallery: { ar: "معرض", en: "Gallery" },
  aboutBanner: { ar: "من نحن؟", en: "Who are we?" },
  teamBanner: { ar: "الفريق", en: "The Team" },
  cap1: { ar: "من جلسة تصوير — البلدة القديمة", en: "From a shoot — the Old City" },
  cap2: { ar: "وراء الكواليس — تجهيز فعاليّة", en: "Behind the scenes — event setup" },
  cap3: { ar: "نقاش تصميم — الاستوديو", en: "Design discussion — the studio" },
  quote: {
    ar: "«النتيجة يجب أن تبدو حتميّة: راسخة، مدروسة، وذات شخصيّة لا تُخطئها العين.»",
    en: "“The result should feel inevitable: rooted, considered, with a personality the eye can't miss.”",
  },
  quoteCite: { ar: "— دفتر ألِف", en: "— The Aliph notebook" },
  aboutH: { ar: "صوت واحد، حرفان، ولغتان.", en: "One sound, two letters, two languages." },
  aboutP: {
    ar: "نحن فريق صغير من القدس يصنع الهويّات والمحتوى من حرفها الأوّل. نبدأ من النقطة التي تُبنى منها الأشياء، ونرسم منها نظامًا كاملًا: الاسم، والهويّة، والصوت، والطريقة التي تظهر بها العلامة في العالم.",
    en: "We are a small team from Jerusalem crafting identities and content from their first letter. We start at the point things are built from, and draw a complete system out of it: the name, the identity, the voice, and the way the brand shows up in the world.",
  },
  m1Name: { ar: "عبد الله", en: "Abdallah" },
  m1Role: { ar: "مؤسّس — إدارة إبداعيّة", en: "Founder — Creative Direction" },
  m2Name: { ar: "جنى", en: "Jana" },
  m2Role: { ar: "تصميم — هويّات بصريّة", en: "Design — Visual Identities" },
  m3Name: { ar: "قريبًا", en: "Coming soon" },
  m3Role: { ar: "تصوير — توثيق", en: "Photography — Documentation" },
};

const CATS = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "identity", ar: "هويّات بصريّة", en: "Identities" },
  { id: "content", ar: "صناعة محتوى", en: "Content" },
  { id: "marketing", ar: "تسويق مبتكر", en: "Marketing" },
  { id: "events", ar: "تنظيم فعاليّات", en: "Events" },
];

const PROJECTS = [
  { ar: "مؤسّسة بنيان", en: "Bunyan Foundation", year: 2026, count: 32, cat: "identity", seed: "aliph01" },
  { ar: "مواسم الزيتون", en: "Olive Seasons", year: 2026, count: 47, cat: "content", seed: "aliph02" },
  { ar: "ورشة الخط", en: "Calligraphy Workshop", year: 2026, count: 15, cat: "events", seed: "aliph03" },
  { ar: "حارة النصارى", en: "Christian Quarter", year: 2026, count: 22, cat: "content", seed: "aliph04" },
  { ar: "مقهى الجبل", en: "Mountain Café", year: 2026, count: 18, cat: "identity", seed: "aliph05" },
  { ar: "معرض التراث", en: "Heritage Fair", year: 2026, count: 26, cat: "events", seed: "aliph06" },
  { ar: "سوق البلدة", en: "Old Town Market", year: 2026, count: 21, cat: "marketing", seed: "aliph07" },
  { ar: "جبل الزيتون", en: "Mount of Olives", year: 2026, count: 12, cat: "content", seed: "aliph08" },
  { ar: "ليالي رمضان", en: "Ramadan Nights", year: 2025, count: 64, cat: "events", seed: "aliph09" },
  { ar: "البلدة القديمة", en: "The Old City", year: 2025, count: 33, cat: "content", seed: "aliph10" },
  { ar: "مهرجان الصيف", en: "Summer Festival", year: 2025, count: 41, cat: "events", seed: "aliph11" },
  { ar: "دار الأيتام", en: "Orphanage Campaign", year: 2025, count: 17, cat: "marketing", seed: "aliph12" },
  { ar: "مطعم الديوان", en: "Al-Diwan Restaurant", year: 2025, count: 25, cat: "identity", seed: "aliph13" },
  { ar: "أسبوع التصميم", en: "Design Week", year: 2025, count: 19, cat: "events", seed: "aliph14" },
  { ar: "افتتاح المكتبة", en: "Library Opening", year: 2024, count: 29, cat: "events", seed: "aliph15" },
  { ar: "حملة التخرّج", en: "Graduation Campaign", year: 2024, count: 36, cat: "marketing", seed: "aliph16" },
  { ar: "بيت الشباب", en: "Youth House", year: 2024, count: 14, cat: "identity", seed: "aliph17" },
  { ar: "نادي القراءة", en: "Reading Club", year: 2024, count: 11, cat: "content", seed: "aliph18" },
  { ar: "عرس فلسطيني", en: "Palestinian Wedding", year: 2024, count: 53, cat: "content", seed: "aliph19" },
];

/* marquee items — the four services link to the services section */
const MQ_ITEMS = [
  { key: "svc1", target: "identity" },
  { key: "svc2", target: "content" },
  { key: "svc3", target: "marketing" },
  { key: "svc4", target: "events" },
];

const TESTIMONIALS = [
  {
    seed: "alipht1",
    quote: {
      ar: "سلّمونا هويّة تبدو وكأنها كانت موجودة دائمًا. كل تفصيل مدروس، ومن أوّل اجتماع شعرنا أننا بين أيدٍ أمينة.",
      en: "They handed us an identity that felt like it had always existed. Every detail considered — from the first meeting we felt we were in safe hands.",
    },
    name: { ar: "ريم قاسم", en: "Reem Qasem" },
    role: { ar: "مؤسّسة — مقهى الجبل", en: "Founder — Mountain Café" },
  },
  {
    seed: "alipht2",
    quote: {
      ar: "التصوير الذي أنتجه ألِف لموسم الزيتون رفع علامتنا مستوىً كاملًا. صور تحكي، لا تزيّن فقط.",
      en: "The photography Aliph produced for our olive season lifted the brand a whole level. Images that tell a story, not just decorate.",
    },
    name: { ar: "أبو خالد", en: "Abu Khaled" },
    role: { ar: "مزارع — مواسم الزيتون", en: "Grower — Olive Seasons" },
  },
  {
    seed: "alipht3",
    quote: {
      ar: "أداروا حملة السوق من الفكرة إلى آخر منشور بهدوءٍ واحتراف. النتائج تكلّمت عن نفسها.",
      en: "They ran the market campaign from concept to the last post with calm and craft. The results spoke for themselves.",
    },
    name: { ar: "لجنة السوق", en: "Market Committee" },
    role: { ar: "سوق البلدة القديمة", en: "Old Town Market" },
  },
  {
    seed: "alipht4",
    quote: {
      ar: "نظّموا فعاليّتنا ووثّقوها كأنهم جزء من الفريق. مهنيّون، ودودون، ودقيقون في كل خطوة.",
      en: "They organized and documented our event as if part of the team. Professional, warm, and precise at every step.",
    },
    name: { ar: "دار الشباب", en: "Youth House" },
    role: { ar: "ليالي رمضان", en: "Ramadan Nights" },
  },
];

let lang = localStorage.getItem("aliph-lang") === "en" ? "en" : "ar";

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function num(n) {
  const s = String(n);
  return lang === "ar" ? s.replace(/[0-9]/g, (d) => AR_DIGITS[+d]) : s;
}
const dirSign = () => (document.documentElement.dir === "rtl" ? 1 : -1);

/* ══════════ seamless infinite loop helper ══════════
   Wraps a track's children into one group, clones it until the track
   is wider than 2 viewports, then translates by exactly one group
   period with a modulo modifier — so the wrap point is invisible. */
function makeLoop(track, speed) {
  if (!track || prefersReduced) return null;
  const cs = getComputedStyle(track);
  const gap = cs.columnGap && cs.columnGap !== "normal" ? parseFloat(cs.columnGap) : 0;

  const group = document.createElement("div");
  group.className = "loop-group";
  group.style.cssText = `display:flex;align-items:center;flex:0 0 auto;column-gap:${gap}px;height:${track.classList.contains("film-track") ? "100%" : "auto"
    };`;
  while (track.firstChild) group.appendChild(track.firstChild);
  track.appendChild(group);

  const groupW = group.getBoundingClientRect().width;
  if (!groupW) return null;
  const period = groupW + gap;

  const copies = Math.ceil((window.innerWidth * 2) / period) + 1;
  for (let i = 0; i < copies; i++) track.appendChild(group.cloneNode(true));

  gsap.set(track, { x: 0 });
  return gsap.to(track, {
    x: dirSign() * period,
    duration: period / speed,
    ease: "none",
    repeat: -1,
    modifiers: { x: gsap.utils.unitize((v) => parseFloat(v) % period) },
  });
}

const FILM_SPEED = 40;      /* px per second */
const MQ_SPEED = 40;
const BAND_SPEED = 40;

let mqTween = null, bandTween = null, filmTween = null, perfTween = null;
const filmTrack = document.getElementById("filmTrack");
const filmSource = filmTrack ? filmTrack.innerHTML : "";

function buildMarqueeSource() {
  const track = document.getElementById("marqueeTrack");
  if (!track) return;
  track.innerHTML = "";
  MQ_ITEMS.forEach((it) => {
    const el = document.createElement("span");
    el.className = "mq-item";
    el.dataset.target = it.target;
    el.innerHTML = `<span data-i18n="${it.key}"></span><i class="mq-star">✳</i>`;
    track.appendChild(el);
  });
  const brand = document.createElement("span");
  brand.className = "mq-item";
  brand.innerHTML = `<span class="latin" lang="en">ALIPH CREATIVE</span><i class="mq-star">✳</i>`;
  track.appendChild(brand);
}

function buildBandSource() {
  const track = document.getElementById("contactBandTrack");
  if (!track) return;
  track.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const el = document.createElement("span");
    el.className = "cb-item";
    el.innerHTML = `<span data-i18n="cBand"></span><i class="cb-star">✳</i>`;
    track.appendChild(el);
  }
}

/* perforation bars: scroll the real film tile in lockstep with the frames */
function startPerf() {
  const perfs = document.querySelectorAll(".perf-strip");
  if (!perfs.length || prefersReduced) return;
  const tileW = (4322 / 508) * 508;         /* native tile width at 508px height */
  perfs.forEach((el) => gsap.set(el, { backgroundPositionX: "0px" }));
  perfTween = gsap.to(perfs, {
    backgroundPositionX: dirSign() * tileW,
    duration: tileW / (FILM_SPEED * 1),    /* perfs are denser; tuned to feel synced */
    ease: "none",
    repeat: -1,
    modifiers: {
      backgroundPositionX: gsap.utils.unitize((v) => (parseFloat(v) % tileW), "px"),
    },
  });
}

function rebuildLoops() {
  [mqTween, bandTween, filmTween, perfTween].forEach((t) => t && t.kill());
  filmTween = makeLoop(filmTrack, FILM_SPEED);
  mqTween = makeLoop(document.getElementById("marqueeTrack"), MQ_SPEED);
  bandTween = makeLoop(document.getElementById("contactBandTrack"), BAND_SPEED);
  startPerf();
}

function tickClock() {
  const el = document.getElementById("clockTime");
  if (!el) return;
  el.textContent = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  /* restore untranslated film frames before translating, so clones stay clean */
  if (filmTrack) filmTrack.innerHTML = filmSource;
  buildMarqueeSource();
  buildBandSource();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const entry = I18N[el.dataset.i18n];
    if (entry) el.textContent = entry[lang];
  });
  document.querySelectorAll(".sc-num[data-num]").forEach((el) => {
    el.textContent = num(el.dataset.num);
  });
  document.querySelectorAll(".story-index").forEach((el, i) => {
    el.textContent = num("0" + (i + 1));
  });

  renderExample(currentService);
  renderLibrary();
  rebuildLoops();
  initScatter();
  tickClock();
}

/* language switch (pill) — click or keyboard */
function toggleLang() {
  lang = lang === "ar" ? "en" : "ar";
  localStorage.setItem("aliph-lang", lang);
  applyI18n();
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".js-lang")) toggleLang();
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("js-lang")) {
    e.preventDefault();
    toggleLang();
  }
});

/* ══════════ page transition curtain ══════════ */
const curtain = document.getElementById("curtain");
if (curtain && !prefersReduced) {
  gsap.to(curtain, {
    yPercent: -100,
    duration: 0.8,
    delay: 0.15,
    ease: "power4.inOut",
    onComplete: () => (curtain.style.display = "none"),
  });
} else if (curtain) {
  curtain.style.display = "none";
}
window.addEventListener("pageshow", (e) => {
  if (e.persisted && curtain) curtain.style.display = "none";
});

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href$='.html']");
  if (!a || prefersReduced || !curtain) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("http")) return;
  e.preventDefault();
  curtain.style.display = "flex";
  gsap.fromTo(curtain,
    { yPercent: 100 },
    { yPercent: 0, duration: 0.6, ease: "power4.inOut", onComplete: () => (window.location.href = href) }
  );
});

/* ══════════ nav overlay + burger morph ══════════ */
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("navOverlay");
if (menuBtn && overlay) {
  const items = overlay.querySelectorAll(".nav-item");
  let open = false;
  menuBtn.addEventListener("click", () => {
    open = !open;
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    if (prefersReduced) return;
    if (open) {
      gsap.fromTo(overlay, { yPercent: -100 }, { yPercent: 0, duration: 0.65, ease: "power4.inOut" });
      gsap.fromTo(items,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.07, delay: 0.3, ease: "power3.out" }
      );
    } else {
      gsap.to(overlay, {
        yPercent: -100,
        duration: 0.55,
        ease: "power4.inOut",
        onComplete: () => gsap.set(overlay, { yPercent: 0 }),
      });
    }
  });
}

/* ══════════ what we do — awards strip + example ══════════ */
const EXAMPLES = {
  identity: {
    kicker: { ar: "مثال — هويّة بصريّة", en: "Example — visual identity" },
    title: { ar: "مؤسّسة بنيان بحلّتها الجديدة", en: "Bunyan Foundation, renewed" },
    desc: {
      ar: "حضورٌ أوضح وأكثر حداثة، مع الحفاظ على روح العلامة القريبة والمألوفة: شعار، ألوان، تغليف، وظهور يومي.",
      en: "A clearer, more modern presence that keeps the brand's familiar spirit: logo, colors, packaging, and daily touchpoints.",
    },
    seed: "aliphsvc1",
  },
  content: {
    kicker: { ar: "مثال — صناعة محتوى", en: "Example — content creation" },
    title: { ar: "مواسم الزيتون: توثيق بصري", en: "Olive Seasons: a visual record" },
    desc: {
      ar: "سلسلة محتوى مصوّر لمواسم القطف، من الحقل إلى المعصرة: ٤٧ لقطة، وقصص يوميّة، وهويّة لونيّة واحدة.",
      en: "A photographed content series across the harvest, from field to press: 47 shots, daily stories, one visual tone.",
    },
    seed: "aliphsvc2",
  },
  marketing: {
    kicker: { ar: "مثال — تسويق مبتكر", en: "Example — creative marketing" },
    title: { ar: "حملة سوق البلدة", en: "The Old Town Market campaign" },
    desc: {
      ar: "حملة إعلانيّة كاملة لإحياء السوق القديم: مفهوم، تصوير، وإدارة منصّات لثلاثة أشهر متواصلة.",
      en: "A full campaign to revive the old market: concept, photography, and three months of channel management.",
    },
    seed: "aliphsvc3",
  },
  events: {
    kicker: { ar: "مثال — تنظيم فعاليّات", en: "Example — event production" },
    title: { ar: "ليالي رمضان", en: "Ramadan Nights" },
    desc: {
      ar: "تنظيم وتوثيق فعاليّة مجتمعيّة على مدار الشهر: برنامج، هويّة بصريّة للفعاليّة، وتغطية يوميّة.",
      en: "A month-long community event, organized and documented: program, event identity, and daily coverage.",
    },
    seed: "aliphsvc4",
  },
};

let currentService = "identity";

function renderExample(id) {
  const data = EXAMPLES[id];
  const kicker = document.getElementById("exampleKicker");
  if (!data || !kicker) return;
  kicker.textContent = data.kicker[lang];
  document.getElementById("exampleTitle").textContent = data.title[lang];
  document.getElementById("exampleDesc").textContent = data.desc[lang];
  const media = document.getElementById("exampleMedia");
  if (media) {
    media.innerHTML = `<img src="https://picsum.photos/seed/${data.seed}/1000/700" alt="" style="height:100%;width:100%;object-fit:cover;opacity:1;filter:grayscale(1) contrast(1.08)">`;
  }
}

function activateService(id, scroll) {
  const cells = document.querySelectorAll(".service-cell");
  if (!cells.length) return;
  cells.forEach((b) => {
    const on = b.dataset.service === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  currentService = id;
  if (prefersReduced) {
    renderExample(id);
  } else {
    gsap.to("#serviceExample", {
      opacity: 0, y: 10, duration: 0.22, ease: "power2.in",
      onComplete() {
        renderExample(id);
        gsap.to("#serviceExample", { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
      },
    });
  }
  if (scroll) {
    document.getElementById("services").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  }
}

document.querySelectorAll(".service-cell").forEach((btn) => {
  btn.addEventListener("click", () => activateService(btn.dataset.service, false));
});

/* marquee: hover pauses the loop, click jumps to that service */
const marquee = document.getElementById("marquee");
if (marquee) {
  marquee.addEventListener("mouseenter", () => mqTween && mqTween.pause());
  marquee.addEventListener("mouseleave", () => mqTween && mqTween.resume());
  marquee.addEventListener("click", (e) => {
    const item = e.target.closest(".mq-item[data-target]");
    if (item) activateService(item.dataset.target, true);
  });
}

/* hero film + contact band: pause on hover */
const filmstrip = document.getElementById("filmstrip");
if (filmstrip) {
  filmstrip.addEventListener("mouseenter", () => {
    filmTween && filmTween.pause();
    perfTween && perfTween.pause();
  });
  filmstrip.addEventListener("mouseleave", () => {
    filmTween && filmTween.resume();
    perfTween && perfTween.resume();
  });
}
const band = document.querySelector(".contact-band");
if (band) {
  band.addEventListener("mouseenter", () => bandTween && bandTween.pause());
  band.addEventListener("mouseleave", () => bandTween && bandTween.resume());
}

/* ══════════ story: scattered media parallax ══════════ */
const SCATTER_BASE = [-3, 2.4, -1.6];

function initScatter() {
  document.querySelectorAll("[data-scatter]").forEach((sc) => {
    if (sc.dataset.bound) return;
    sc.dataset.bound = "1";
    const cards = Array.from(sc.querySelectorAll(".scatter-card"));
    cards.forEach((c, i) => {
      c._base = SCATTER_BASE[i % SCATTER_BASE.length];
      gsap.set(c, { rotation: c._base });
    });
    if (prefersReduced) return;

    sc.addEventListener("mousemove", (e) => {
      const r = sc.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cards.forEach((c) => {
        const d = parseFloat(c.dataset.depth || 1);
        gsap.to(c, {
          x: -px * d * 16,
          y: -py * d * 13,
          rotation: c._base + px * d * 1.1,
          duration: 0.6,
          ease: "power2.out",
        });
      });
    });
    sc.addEventListener("mouseleave", () => {
      cards.forEach((c) =>
        gsap.to(c, { x: 0, y: 0, rotation: c._base, duration: 0.8, ease: "power3.out" })
      );
    });
  });
}

/* ══════════ index page motion ══════════ */
const page = document.body.dataset.page;

if (page === "index" && !prefersReduced) {
  gsap.from(".rule-double", { scaleX: 0, transformOrigin: "right center", duration: 1, ease: "power3.inOut" });
  gsap.from(".hero-panel", { opacity: 0, y: 34, duration: 1, delay: 0.35, ease: "power3.out" });
  gsap.from(".hero-title .line", { yPercent: 110, duration: 1, stagger: 0.12, delay: 0.5, ease: "power4.out" });
  gsap.from(".hero-rule", { scaleX: 0, duration: 1, delay: 0.9, ease: "power3.inOut" });

  gsap.utils.toArray(".banner h2").forEach((el) => {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  gsap.utils.toArray(".service-cell").forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 20, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 94%" },
    });
  });
  gsap.utils.toArray(".story-panel").forEach((panel) => {
    gsap.from(panel.querySelectorAll(".story-text > *"), {
      opacity: 0, y: 26, duration: 0.75, stagger: 0.09, ease: "power2.out",
      scrollTrigger: { trigger: panel, start: "top 65%" },
    });
    gsap.from(panel.querySelectorAll(".scatter-card"), {
      opacity: 0, scale: 0.94, y: 30, duration: 0.8, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: panel, start: "top 70%" },
    });
  });
}

/* ══════════ library: category accordion ══════════ */
const accRoot = document.getElementById("accRoot");
let openCat = "all";

function renderLibrary() {
  if (!accRoot) return;
  accRoot.innerHTML = "";
  CATS.forEach((cat) => {
    const items = cat.id === "all" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat.id);
    const years = [...new Set(items.map((p) => p.year))].sort((a, b) => b - a);

    const panel = document.createElement("section");
    panel.className = "acc-panel" + (cat.id === openCat ? " open" : "");
    panel.dataset.cat = cat.id;

    const yearsHtml = years.map((y) => {
      const yi = items.filter((p) => p.year === y);
      const tiles = yi.map((p) => `
        <figure class="tile">
          <div class="tile-img"><img src="https://picsum.photos/seed/${p.seed}/600/400" alt="${p[lang]}" loading="lazy"></div>
          <figcaption><span>${p[lang]}</span><span class="t-count">${num(p.count)}</span></figcaption>
        </figure>`).join("");
      const rows = yi.map((p) => `
        <div class="lib-list-row"><span>${p[lang]}</span><span class="t-count">${num(p.count)}</span></div>`).join("");
      return `
        <div class="lib-year">
          <div class="lib-year-head" aria-hidden="true">
            <span class="year-num">${num(y)}</span>
            <span class="year-count">${num(yi.length)}</span>
          </div>
          <div class="lib-grid">${tiles}</div>
          <div class="lib-list">${rows}</div>
        </div>`;
    }).join("");

    panel.innerHTML = `
      <button class="spine" aria-expanded="${cat.id === openCat}">
        <span class="spine-name">${cat[lang]}</span>
        <span class="spine-count">${num(items.length)}</span>
      </button>
      <div class="panel-body">
        <div class="panel-head">
          <h2>${cat[lang]}</h2>
          <span class="panel-count">${num(items.length)}</span>
        </div>
        ${yearsHtml}
      </div>`;

    panel.querySelector(".spine").addEventListener("click", () => {
      if (openCat === cat.id) return;
      openCat = cat.id;
      accRoot.querySelectorAll(".acc-panel").forEach((p) => {
        const isOpen = p.dataset.cat === openCat;
        p.classList.toggle("open", isOpen);
        p.querySelector(".spine").setAttribute("aria-expanded", String(isOpen));
        if (isOpen) p.querySelector(".panel-body").scrollTop = 0;
      });
    });

    accRoot.appendChild(panel);
  });
}

const viewIndex = document.getElementById("viewIndex");
const viewPhoto = document.getElementById("viewPhoto");
if (viewIndex && viewPhoto) {
  viewIndex.addEventListener("click", () => {
    document.body.classList.add("lib-index");
    viewIndex.classList.add("on");
    viewPhoto.classList.remove("on");
  });
  viewPhoto.addEventListener("click", () => {
    document.body.classList.remove("lib-index");
    viewPhoto.classList.add("on");
    viewIndex.classList.remove("on");
  });
}

/* ══════════ about page reveals ══════════ */
if (page === "about" && !prefersReduced) {
  gsap.utils.toArray(".banner h2").forEach((el) => {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  gsap.utils.toArray(".clip, .member").forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 26, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
    });
  });
  gsap.from(".footer-title .line", {
    yPercent: 110, duration: 1, stagger: 0.1, ease: "power4.out",
    scrollTrigger: { trigger: ".footer", start: "top 75%" },
  });
}

/* ══════════ boot ══════════ */
applyI18n();
setInterval(tickClock, 20000);
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rebuildLoops, 250);
});
