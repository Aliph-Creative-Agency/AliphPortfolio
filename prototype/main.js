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

  /* latest-work slider */
  slLatest: { ar: "أحدث الأعمال", en: "Latest work" },
  slPieces: { ar: "قطعة", en: "pieces" },
  stampNew: { ar: "مؤخّرًا", en: "Latest" },

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

/* every project carries a one-line brief so the "latest work" slider on the
   home page can speak about whichever piece is on screen (placeholder copy) */
const PROJECTS = [
  { ar: "مؤسّسة بنيان", en: "Bunyan Foundation", year: 2026, count: 32, cat: "identity", seed: "aliph01",
    desc: { ar: "حضورٌ أوضح وأكثر حداثة، مع الحفاظ على روح العلامة المألوفة: شعار، ألوان، تغليف، وظهور يومي.",
            en: "A clearer, more modern presence that keeps the brand's familiar spirit: mark, colors, packaging, and daily touchpoints." } },
  { ar: "مواسم الزيتون", en: "Olive Seasons", year: 2026, count: 47, cat: "content", seed: "aliph02",
    desc: { ar: "توثيق بصري لموسم القطف من الحقل إلى المعصرة، بهويّة لونيّة واحدة وقصص يوميّة.",
            en: "A visual record of the harvest from field to press — one tonal identity and daily stories." } },
  { ar: "ورشة الخط", en: "Calligraphy Workshop", year: 2026, count: 15, cat: "events", seed: "aliph03",
    desc: { ar: "ورشة مفتوحة في الاستوديو: برنامج، مطبوعات، وتغطية كاملة لليومين.",
            en: "An open workshop at the studio: program, printed matter, and full two-day coverage." } },
  { ar: "حارة النصارى", en: "Christian Quarter", year: 2026, count: 22, cat: "content", seed: "aliph04",
    desc: { ar: "سلسلة مصوّرة عن تفاصيل الحارة ووجوهها، بالأبيض والأسود.",
            en: "A photographed series on the quarter's details and faces, in black and white." } },
  { ar: "مقهى الجبل", en: "Mountain Café", year: 2026, count: 18, cat: "identity", seed: "aliph05",
    desc: { ar: "هويّة كاملة لمقهى صغير: اسم، شعار، قائمة، ولوحة واجهة.",
            en: "A complete identity for a small café: name, mark, menu, and shopfront." } },
  { ar: "معرض التراث", en: "Heritage Fair", year: 2026, count: 26, cat: "events", seed: "aliph06",
    desc: { ar: "تنظيم معرض ثلاثة أيام: توزيع المساحة، لافتات، وتوثيق مصوّر.",
            en: "A three-day fair: spatial layout, signage, and photographic documentation." } },
  { ar: "سوق البلدة", en: "Old Town Market", year: 2026, count: 21, cat: "marketing", seed: "aliph07",
    desc: { ar: "حملة إعلانيّة كاملة لإحياء السوق القديم: مفهوم، تصوير، وإدارة منصّات لثلاثة أشهر.",
            en: "A full campaign to revive the old market: concept, photography, and three months of channel management." } },
  { ar: "جبل الزيتون", en: "Mount of Olives", year: 2026, count: 12, cat: "content", seed: "aliph08",
    desc: { ar: "لقطات من الجبل عند الفجر — مادّة أساس لمكتبة الصور.",
            en: "Shots from the mount at first light — base material for the image library." } },
  { ar: "ليالي رمضان", en: "Ramadan Nights", year: 2025, count: 64, cat: "events", seed: "aliph09",
    desc: { ar: "فعاليّة مجتمعيّة على مدار الشهر: برنامج، هويّة للفعاليّة، وتغطية يوميّة.",
            en: "A month-long community event: program, event identity, and daily coverage." } },
  { ar: "البلدة القديمة", en: "The Old City", year: 2025, count: 33, cat: "content", seed: "aliph10",
    desc: { ar: "أرشيف مصوّر للأزقّة والأبواب، صُوّر على مدار فصلين.",
            en: "A photographic archive of alleys and doorways, shot across two seasons." } },
  { ar: "مهرجان الصيف", en: "Summer Festival", year: 2025, count: 41, cat: "events", seed: "aliph11",
    desc: { ar: "مهرجان مفتوح: هويّة بصريّة، لافتات موقع، وتوثيق مباشر.",
            en: "An open-air festival: visual identity, site signage, and live documentation." } },
  { ar: "دار الأيتام", en: "Orphanage Campaign", year: 2025, count: 17, cat: "marketing", seed: "aliph12",
    desc: { ar: "حملة تبرّعات هادئة تعتمد على الحكاية لا على الصخب.",
            en: "A quiet fundraising campaign built on story rather than volume." } },
  { ar: "مطعم الديوان", en: "Al-Diwan Restaurant", year: 2025, count: 25, cat: "identity", seed: "aliph13",
    desc: { ar: "هويّة مطعم: شعار، قوائم، قرطاسيّة، ونظام لافتات.",
            en: "A restaurant identity: mark, menus, stationery, and a signage system." } },
  { ar: "أسبوع التصميم", en: "Design Week", year: 2025, count: 19, cat: "events", seed: "aliph14",
    desc: { ar: "برنامج أسبوع كامل: جدول، مطبوعات، وتغطية للجلسات.",
            en: "A week-long program: schedule, printed matter, and session coverage." } },
  { ar: "افتتاح المكتبة", en: "Library Opening", year: 2024, count: 29, cat: "events", seed: "aliph15",
    desc: { ar: "افتتاح مكتبة الحيّ: دعوات، لافتات، وتوثيق الليلة.",
            en: "A neighbourhood library opening: invitations, signage, and coverage of the night." } },
  { ar: "حملة التخرّج", en: "Graduation Campaign", year: 2024, count: 36, cat: "marketing", seed: "aliph16",
    desc: { ar: "حملة موسميّة للجامعات: مفهوم، تصوير، ونشر على المنصّات.",
            en: "A seasonal campaign for universities: concept, photography, and channel rollout." } },
  { ar: "بيت الشباب", en: "Youth House", year: 2024, count: 14, cat: "identity", seed: "aliph17",
    desc: { ar: "هويّة مرنة لمركز شبابي، تتحمّل أيدي كثيرة وتظلّ متماسكة.",
            en: "A flexible identity for a youth centre — it survives many hands and stays coherent." } },
  { ar: "نادي القراءة", en: "Reading Club", year: 2024, count: 11, cat: "content", seed: "aliph18",
    desc: { ar: "محتوى شهري لنادي قراءة: أغلفة، اقتباسات، ومنشورات.",
            en: "Monthly content for a reading club: covers, pull quotes, and posts." } },
  { ar: "عرس فلسطيني", en: "Palestinian Wedding", year: 2024, count: 53, cat: "content", seed: "aliph19",
    desc: { ar: "توثيق عرس كامل من التحضير إلى آخر رقصة.",
            en: "A full wedding documented from preparation to the last dance." } },
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
   Wraps a track's children into one group and clones it until the track is
   wider than the host plus two periods. The tween then travels exactly one
   period and repeats: shifting periodic content by one period is pixel-
   identical, so the restart is invisible — no modifier needed. */
function makeLoop(track, speed) {
  if (!track || prefersReduced) return null;
  const cs = getComputedStyle(track);
  const gap = cs.columnGap && cs.columnGap !== "normal" ? parseFloat(cs.columnGap) : 0;

  const group = document.createElement("div");
  group.className = "loop-group";
  group.style.cssText = `display:flex;align-items:center;flex:0 0 auto;column-gap:${gap}px;`;
  while (track.firstChild) group.appendChild(track.firstChild);
  track.appendChild(group);

  const groupW = group.getBoundingClientRect().width;
  if (!groupW) return null;
  const period = groupW + gap;

  /* the content must stay wider than the host plus the full travel range */
  const host = track.parentElement;
  const viewW = host ? host.getBoundingClientRect().width : window.innerWidth;
  const copies = Math.ceil(viewW / period) + 2;
  for (let i = 0; i < copies; i++) track.appendChild(group.cloneNode(true));

  /* a max-content track is right-aligned under RTL, so measure its natural
     offset and seed one period before the host's start edge */
  gsap.set(track, { x: 0 });
  const baseLeft = track.getBoundingClientRect().left - host.getBoundingClientRect().left;
  const from = -baseLeft - period;

  gsap.set(track, { x: from });
  return gsap.to(track, {
    x: from + dirSign() * period,
    duration: period / speed,
    ease: "none",
    repeat: -1,
  });
}

const MQ_SPEED = 40;
const BAND_SPEED = 40;

let mqTween = null, bandTween = null;

/* 4 hero film frames — one per service, in service order */
const FILM_FRAMES = [
  { seed: "aliphf1", svc: "identity",  cap: { ar: "مؤسّسة بنيان — هويّة", en: "Bunyan — identity" } },
  { seed: "aliphf3", svc: "content",   cap: { ar: "مواسم الزيتون — محتوى", en: "Olive Seasons — content" } },
  { seed: "aliphf5", svc: "marketing", cap: { ar: "سوق البلدة — حملة", en: "Old Town Market — campaign" } },
  { seed: "aliphf7", svc: "events",    cap: { ar: "ليالي رمضان — فعاليّة", en: "Ramadan Nights — event" } },
];
const SERVICE_FRAMES = { identity: 0, content: 1, marketing: 2, events: 3 };
const filmScroll = document.getElementById("filmScroll");

/* One group = the 4 frames. The group is cloned across the strip and the film
   background tile is sized to exactly one group width, so the sprocket pattern
   repeats in lockstep with the frames and the loop has no seam. */
function buildFilm() {
  if (!filmScroll) return;
  filmScroll.innerHTML = "";
  const group = document.createElement("div");
  group.className = "film-group";
  FILM_FRAMES.forEach((fr, i) => {
    const fig = document.createElement("figure");
    fig.className = "film-frame";
    fig.dataset.frame = i;
    fig.dataset.service = fr.svc;
    fig.innerHTML =
      `<img src="https://picsum.photos/seed/${fr.seed}/1200/800" alt="">` +
      `<figcaption>${fr.cap[lang]}</figcaption>`;
    group.appendChild(fig);
  });
  filmScroll.appendChild(group);
  return group;
}

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

function rebuildLoops() {
  [mqTween, bandTween].forEach((t) => t && t.kill());
  mqTween = makeLoop(document.getElementById("marqueeTrack"), MQ_SPEED);
  bandTween = makeLoop(document.getElementById("contactBandTrack"), BAND_SPEED);
}

/* ══════════ hero film strip: seamless loop + hover-to-service sync ══════════
   the strip runs continuously in ONE direction at a CONSTANT speed. one group
   of 4 frames is cloned across the strip and the film background tile is sized
   to exactly one group, so translating by one period is pixel-identical — the
   tween restart is invisible. hovering a service glides to its frame and stops. */
const filmLoop = (() => {
  const SPEED = 34;               // px per second, constant
  let tween = null, period = 0, first = [], ready = false;

  const strip = () => document.querySelector(".filmstrip");

  /* the visible film window, measured against the strip itself so this works
     whether the panel sits beside the film (desktop) or above it (mobile) */
  function windowCenter() {
    const el = strip();
    const panel = document.querySelector(".hero-panel");
    if (!el) return 0;
    const s = el.getBoundingClientRect();
    if (!panel) return s.width / 2;
    const p = panel.getBoundingClientRect();
    /* stacked: the panel is above the strip, so the whole strip is window */
    if (p.bottom <= s.top + 1 || p.top >= s.bottom - 1) return s.width / 2;
    /* side by side: the panel hugs one edge, the window is the other side */
    const [ws, we] = (p.left - s.left) >= (s.right - p.right)
      ? [s.left, p.left] : [p.right, s.right];
    return (ws + we) / 2 - s.left;
  }

  /* layout x of the strip's origin, independent of the current translation */
  function originX() {
    const s = strip().getBoundingClientRect();
    const cur = gsap.getProperty(filmScroll, "x") || 0;
    return filmScroll.getBoundingClientRect().left - s.left - cur;
  }

  /* the x that centers frame i, before choosing which period-copy to use */
  function wantX(i) {
    const f = first[i];
    return windowCenter() - (originX() + f.offsetLeft + f.offsetWidth / 2);
  }

  /* nearest x that centers frame i in the film window (period-aware) */
  function xForFrame(i) {
    const want = wantX(i);
    const cur = gsap.getProperty(filmScroll, "x") || 0;
    return want + Math.round((cur - want) / period) * period;
  }

  /* Seeding straight from wantX() can leave the content's leading edge inside
     the window — that was the blank gap at the start of the EN (LTR) layout,
     where the window sits on the far side from the panel so want came out
     large and positive.
     What has to land in the right place is the content's leading edge in
     strip coordinates (originX + x), NOT x itself: under RTL a max-content
     track is right-aligned, so originX is a large negative number and x is
     the positive translation that cancels it.
     Content is periodic, so shift by whole periods until that leading edge
     sits in (-P, -2P] — one full period before the window, with room for the
     tween to travel a period in either direction and still cover it. A copy
     of frame i stays centered, because the shift is a multiple of a period. */
  function seedX(i) {
    const want = wantX(i);
    const lead = originX() + want;
    let target = lead % period;
    if (target > 0) target -= period;   /* (-P, 0]  */
    target -= period;                   /* (-2P, -P] */
    return want + (target - lead);
  }

  function run() {
    if (tween) tween.kill();
    if (prefersReduced || !ready) return;
    const from = gsap.getProperty(filmScroll, "x") || 0;
    tween = gsap.fromTo(filmScroll,
      { x: from },
      { x: from + dirSign() * period, duration: period / SPEED, ease: "none", repeat: -1 }
    );
  }

  return {
    rebuild() {
      if (tween) tween.kill();
      ready = false;
      const group = buildFilm();
      if (!group) return;
      gsap.set(filmScroll, { x: 0 });
      period = group.getBoundingClientRect().width;
      if (!period) return;
      /* one scanned film tile per group, so the sprocket run repeats in step
         with the frames and the loop stays seamless. the frame slot is 1/4 of
         the tile's own aspect, so the scan is shown unstretched */
      filmScroll.style.setProperty("--pitch", period + "px");
      /* cover the window for every x the loop and focus jumps can reach */
      const viewW = strip().getBoundingClientRect().width;
      const copies = Math.ceil(viewW / period) + 4;
      for (let i = 0; i < copies; i++) filmScroll.appendChild(group.cloneNode(true));
      first = Array.from(group.children);
      ready = true;
      gsap.set(filmScroll, { x: seedX(0) });
      run();
    },
    focus(id) {
      const i = SERVICE_FRAMES[id];
      if (i == null || !ready) return;
      if (tween) tween.kill();
      if (!prefersReduced) {
        gsap.to(filmScroll, { x: xForFrame(i), duration: 0.85, ease: "power3.inOut", overwrite: true });
      }
      filmScroll.classList.add("has-pop");
      filmScroll.querySelectorAll(".film-frame").forEach((f) => {
        f.classList.toggle("pop", +f.dataset.frame === i);
      });
    },
    blur() {
      filmScroll.classList.remove("has-pop");
      filmScroll.querySelectorAll(".film-frame.pop").forEach((f) => f.classList.remove("pop"));
      run();
    },
  };
})();

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

  svcSlider.render();
  renderLibrary();
  rebuildLoops();
  filmLoop.rebuild();
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
    onComplete: () => {
      curtain.style.display = "none";
      queueMenuSync();
    },
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
    /* the overlay forces cream bars; on close, re-read what's underneath */
    if (!open) queueMenuSync();
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

/* ══════════ menu button: invert over dark sections ══════════
   The burger is fixed above the page, so whatever scrolls under it decides
   its colour. Every opaque ink-field in the design is listed here; if one is
   in the hit-stack under the button's centre it is what's actually visible,
   because nothing cream is ever painted on top of them.
   The load curtain is deliberately NOT in this list: it covers the button
   anyway, and counting it would leave the button stuck dark after the
   curtain lifts, since nothing re-samples until the first scroll. */
const DARK_UNDER = [
  ".filmstrip", ".banner", ".marquee", ".story-panel.ink", ".footer",
  ".testi", ".sl-stage", ".service-cell.is-active",
].join(",");

function syncMenuBtn() {
  if (!menuBtn || document.body.classList.contains("nav-open")) return;
  const r = menuBtn.getBoundingClientRect();
  const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  let dark = false;
  for (const el of stack) {
    if (el === menuBtn || menuBtn.contains(el)) continue;
    if (el === document.body || el === document.documentElement) break;
    if (el.closest(DARK_UNDER)) { dark = true; break; }
  }
  menuBtn.classList.toggle("on-dark", dark);
}

let menuTick = false;
function queueMenuSync() {
  if (menuTick) return;
  menuTick = true;
  requestAnimationFrame(() => { menuTick = false; syncMenuBtn(); });
}
window.addEventListener("scroll", queueMenuSync, { passive: true });
window.addEventListener("resize", queueMenuSync);

/* ══════════ what we do — awards strip + latest-work slider ══════════
   The stage shows the newest projects in whichever service is selected,
   newest first. Mechanics are unchanged from the old example panel — the
   service cells still drive it — but each service now carries several
   pieces, so prev/next step through that category's latest work. */
const SLIDER_MAX = 5;

let currentService = "identity";

const svcSlider = (() => {
  const stage = document.getElementById("slStage");
  const slides = document.getElementById("slSlides");
  if (!stage || !slides) return { setService() {}, render() {}, next() {}, prev() {} };

  const wipe = document.getElementById("slWipe");
  const stamp = document.getElementById("slStamp");
  const elKicker = document.getElementById("slKicker");
  const elTitle = document.getElementById("slTitle");
  const elMeta = document.getElementById("slMeta");
  const elDesc = document.getElementById("slDesc");
  const elIndex = document.getElementById("slIndex");
  const elTotal = document.getElementById("slTotal");
  const elCap = document.getElementById("slPlateCap");
  const elTag = document.getElementById("slPlateTag");
  const elBar = document.getElementById("slProgressBar");

  const line = elTitle.querySelector(".line");
  const SVC_TAG = { identity: "IDENTITY", content: "CONTENT", marketing: "MARKETING", events: "EVENTS" };

  let items = [], idx = 0, busy = false;

  const rtl = () => document.documentElement.dir === "rtl";
  const stampRot = () => (rtl() ? -7 : 7);
  const svcName = (id) => {
    const c = CATS.find((c) => c.id === id);
    return c ? c[lang] : "";
  };

  function pick(catId) {
    return PROJECTS
      .filter((p) => p.cat === catId)
      .sort((a, b) => b.year - a.year || b.count - a.count)
      .slice(0, SLIDER_MAX);
  }

  /* one <img> lives in the stage and is swapped behind the wipe; the rest
     are warmed in the background so the swap never shows a blank frame */
  function ensureImg() {
    let img = slides.querySelector("img");
    if (!img) {
      slides.innerHTML = `<div class="sl-slide"><img alt=""></div>`;
      img = slides.querySelector("img");
    }
    return img;
  }
  const src = (p) => `https://picsum.photos/seed/${p.seed}/1200/900`;
  function preload() {
    items.forEach((p) => { const i = new Image(); i.src = src(p); });
  }

  /* write both sides for the current item — no animation. the .line node is
     reused rather than rebuilt so tweens can hold a stable reference to it */
  function paint() {
    const p = items[idx];
    if (!p) return;
    elKicker.textContent = `${I18N.slLatest[lang]} — ${svcName(currentService)}`;
    line.textContent = p[lang];
    elMeta.innerHTML =
      `<span class="sl-year">${num(p.year)}</span>` +
      `<span class="sl-sep">·</span>` +
      `<span class="sl-count">${num(p.count)} ${I18N.slPieces[lang]}</span>`;
    elDesc.textContent = p.desc ? p.desc[lang] : "";
    elIndex.textContent = num(String(idx + 1).padStart(2, "0"));
    elTotal.textContent = num(String(items.length).padStart(2, "0"));
    elCap.textContent = p[lang];
    elTag.textContent = SVC_TAG[currentService] || "";
    elBar.style.width = `${((idx + 1) / items.length) * 100}%`;
    /* only the newest piece in a category wears the stamp. GSAP writes
       inline styles, so the resting state has to be set here too or the
       CSS :not(.on) rule loses to a leftover inline opacity */
    const newest = idx === 0;
    stamp.classList.toggle("on", newest);
    gsap.set(stamp, newest
      ? { opacity: 1, scale: 1, rotate: stampRot() }
      : { opacity: 0 });
    ensureImg().src = src(p);
  }

  /* the swap: the text lifts out and an ink bar sweeps in from the leading
     edge; content changes behind it; the bar sweeps off the far edge and the
     photo settles out of a slow zoom while the new text drops in.
     Everything that depends on the new content is created *after* paint(),
     so no tween is left pointing at the previous slide's values. */
  function go(next, dir, force) {
    if (busy || !items.length) return;
    const target = ((next % items.length) + items.length) % items.length;
    if (target === idx && !force) return;
    idx = target;

    if (prefersReduced || !wipe) { paint(); return; }
    busy = true;
    const isRtl = rtl();
    /* the bar enters from the side the new slide travels in from */
    const enter = dir > 0 ? (isRtl ? "right" : "left") : (isRtl ? "left" : "right");
    const exit = enter === "left" ? "right" : "left";

    gsap.timeline({ onComplete: () => (busy = false) })
      .set(wipe, { transformOrigin: `${enter} center`, scaleX: 0 })
      .to(wipe, { scaleX: 1, duration: 0.42, ease: "power3.in" }, 0)
      .to(line, { yPercent: -108, duration: 0.34, ease: "power3.in" }, 0)
      .to([elMeta, elDesc], { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, 0)
      .add(() => {
        paint();
        gsap.set(line, { yPercent: 108 });
        gsap.fromTo(slides.querySelector("img"),
          { scale: 1.14, xPercent: dir * (isRtl ? 3 : -3) },
          { scale: 1, xPercent: 0, duration: 1.5, ease: "power3.out" });
        if (idx === 0) {
          gsap.fromTo(stamp,
            { opacity: 0, scale: 0.7, rotate: 0 },
            { opacity: 1, scale: 1, rotate: stampRot(), duration: 0.55, delay: 0.36, ease: "back.out(2.2)" });
        }
      })
      .set(wipe, { transformOrigin: `${exit} center` })
      .to(wipe, { scaleX: 0, duration: 0.52, ease: "power3.out" })
      .to(line, { yPercent: 0, duration: 0.6, ease: "power4.out" }, "-=0.46")
      .fromTo([elMeta, elDesc],
        { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" }, "-=0.5");
  }

  return {
    /* switching service jumps to that category's newest piece — forced,
       because the index is usually already 0 but the content has changed */
    setService(catId) {
      items = pick(catId);
      preload();
      go(0, 1, true);
    },
    /* language switch / first boot: repaint in place, no transition */
    render() {
      items = pick(currentService);
      idx = Math.min(idx, Math.max(items.length - 1, 0));
      preload();
      gsap.set([line, elMeta, elDesc], { clearProps: "all" });
      paint();
    },
    next() { go(idx + 1, 1); },
    prev() { go(idx - 1, -1); },
  };
})();

function activateService(id, scroll) {
  const cells = document.querySelectorAll(".service-cell");
  if (!cells.length) return;
  cells.forEach((b) => {
    const on = b.dataset.service === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  currentService = id;
  svcSlider.setService(id);
  if (scroll) {
    document.getElementById("services").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  }
}

document.getElementById("slNext")?.addEventListener("click", () => svcSlider.next());
document.getElementById("slPrev")?.addEventListener("click", () => svcSlider.prev());

document.querySelectorAll(".service-cell").forEach((btn) => {
  btn.addEventListener("click", () => activateService(btn.dataset.service, false));
  /* hovering a service drives the hero film strip to its two frames */
  btn.addEventListener("mouseenter", () => filmLoop.focus(btn.dataset.service));
  btn.addEventListener("mouseleave", () => filmLoop.blur());
});

/* marquee: hover pauses the loop + syncs the film, click jumps to that service */
const marquee = document.getElementById("marquee");
if (marquee) {
  marquee.addEventListener("mouseenter", () => mqTween && mqTween.pause());
  marquee.addEventListener("mouseleave", () => mqTween && mqTween.resume());
  marquee.addEventListener("mouseover", (e) => {
    const item = e.target.closest(".mq-item[data-target]");
    if (item) filmLoop.focus(item.dataset.target);
  });
  marquee.addEventListener("mouseout", (e) => {
    const item = e.target.closest(".mq-item[data-target]");
    const to = e.relatedTarget && e.relatedTarget.closest(".mq-item[data-target]");
    if (item && !to) filmLoop.blur();
  });
  marquee.addEventListener("click", (e) => {
    const item = e.target.closest(".mq-item[data-target]");
    if (item) activateService(item.dataset.target, true);
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

/* ══════════ hero dropcap: torn paper that unfolds ══════════
   Each of the two sheets is drawn as two halves clipped to the top and the
   bottom of the same box, sharing a fold line down the middle. Swinging the
   halves on rotateX opens the paper like a folded note; at rotateX(0) both
   halves carry the identical background at the identical size, so the seam
   closes invisibly. The letter unfurls from the fold as the sheet flattens. */
function initPaperCap() {
  const cap = document.querySelector(".dropcap[data-paper]");
  if (!cap || cap.dataset.bound) return;
  cap.dataset.bound = "1";

  const back = cap.querySelector(".sheet-back");
  const front = cap.querySelector(".sheet-front");
  const crease = cap.querySelector(".crease");
  const letter = cap.querySelector(".dc-letter");
  if (!back || !front || !letter) return;

  const halves = (sheet) => [sheet.querySelector(".half-t"), sheet.querySelector(".half-b")];
  const [bt, bb] = halves(back);
  const [ft, fb] = halves(front);
  const allHalves = [bt, bb, ft, fb];

  /* flat, letter showing — the resting state and the whole story for
     anyone who asked us not to animate */
  const flatten = () => {
    gsap.set(allHalves, { rotateX: 0 });
    gsap.set(crease, { opacity: 0 });
    gsap.set(letter, { opacity: 1, scaleY: 1, y: 0 });
  };
  if (prefersReduced) { flatten(); return; }

  /* folded shut: both halves stood up on the crease, letter hidden inside */
  gsap.set([bt, ft], { rotateX: -94, transformOrigin: "50% 50%" });
  gsap.set([bb, fb], { rotateX: 94, transformOrigin: "50% 50%" });
  gsap.set(crease, { opacity: 1 });
  gsap.set(letter, { opacity: 0, scaleY: 0.12, y: 0, transformOrigin: "50% 50%" });

  const idle = () => {
    /* the paper never sits perfectly still — a slow breath on the whole
       stack plus a hair of residual fold, so it keeps reading as paper */
    gsap.to(cap, {
      rotateY: 2.4, rotateX: -1.6, duration: 5.5,
      ease: "sine.inOut", repeat: -1, yoyo: true,
    });
    gsap.to([ft, bt], {
      rotateX: -2.4, duration: 4.2, ease: "sine.inOut", repeat: -1, yoyo: true,
    });
    gsap.to([fb, bb], {
      rotateX: 1.8, duration: 4.9, ease: "sine.inOut", repeat: -1, yoyo: true,
    });
  };

  /* the unfold: back sheet opens first and the front follows a beat later,
     so you read two separate sheets rather than one thick one */
  gsap.timeline({ delay: 0.85, onComplete: idle })
    .to([bt, bb], { rotateX: 0, duration: 1.15, ease: "power3.out" })
    .to([ft, fb], { rotateX: 0, duration: 1.25, ease: "power3.out" }, "-=0.98")
    .to(crease, { opacity: 0, duration: 0.75, ease: "power2.out" }, "-=0.85")
    .to(letter, { opacity: 1, scaleY: 1, duration: 0.85, ease: "power4.out" }, "-=0.72");

  /* hover: the sheet half-closes again, as if you'd caught it mid-fold */
  const hoverTo = (v) => {
    gsap.killTweensOf([ft, fb, bt, bb, crease, letter]);
    gsap.to([ft, bt], { rotateX: -v * 15, duration: 0.55, ease: "power3.out" });
    gsap.to([fb, bb], { rotateX: v * 12, duration: 0.55, ease: "power3.out" });
    gsap.to(crease, { opacity: v * 0.85, duration: 0.55, ease: "power2.out" });
    gsap.to(letter, {
      scale: 1 + v * 0.07, y: -v * 4, duration: 0.55, ease: "power3.out",
    });
  };
  cap.addEventListener("mouseenter", () => hoverTo(1));
  cap.addEventListener("mouseleave", () => {
    hoverTo(0);
    gsap.delayedCall(0.6, idle);
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
}

/* ══════════ boot ══════════ */
applyI18n();
initPaperCap();
syncMenuBtn();
setInterval(tickClock, 20000);

/* widths measured before the Idris fonts land are wrong, which leaves a gap in
   the loops — remeasure once the fonts are actually applied */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    rebuildLoops();
    filmLoop.rebuild();
    queueMenuSync();
  });
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    rebuildLoops();
    filmLoop.rebuild();
  }, 250);
});
