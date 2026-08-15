/* ALIPH prototype — i18n, film strip, why-aliph, what-we-do, contact */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
gsap.registerPlugin(ScrollTrigger);

/* ══════════ media holders ══════════
   Stand-in until the agency's photographs land.

   It is an <img> with an inline SVG data URI, not a <div>: every image is
   styled through `img` selectors, so swapping the element type would
   silently drop object-fit, the tonal grade and the sizing. This way
   landing real media is only a src change.

   Don't go back to an external placeholder service (picsum meant 20+
   third-party requests and constant rate-limiting), and don't use an empty
   src — that re-requests the document. */
const HOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'" +
  " preserveAspectRatio='none'%3E%3Crect width='4' height='3' fill='%23c6c5ba'/%3E%3C/svg%3E";

/* Paint one holder. The sections carry work in four formats — film, reel,
   poster, still — so a holder can become a <video> as well as an <img>.

   Video never preloads and only plays on screen: the Drive's horizontal
   videos are 55–384 MB and four autoplaying would undo every phone fix. */
function setHolder(box, item) {
  if (!box) return;
  const poster = (item && item.src) || HOLDER;

  if (item && item.video) {
    let v = box.querySelector("video");
    if (!v) {
      box.textContent = "";
      v = document.createElement("video");
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "none";
      box.appendChild(v);
      playWhenVisible(v);
    }
    if (v.dataset.src !== item.video) {
      v.dataset.src = item.video;
      v.poster = poster;
      v.src = item.video;
    }
    return;
  }

  let img = box.querySelector("img");
  if (!img) {
    box.textContent = "";
    img = document.createElement("img");
    img.alt = "";
    box.appendChild(img);
  }
  if (img.getAttribute("src") !== poster) img.src = poster;
}

function playWhenVisible(v) {
  if (!window.IntersectionObserver) return;
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !prefersReduced) v.play().catch(() => { });
    else v.pause();
  }, { rootMargin: "100px" }).observe(v);
}

/* ══════════ i18n ══════════ */
const I18N = {
  navHome: { ar: "الرئيسيّة", en: "Home" },
  navWork: { ar: "الأعمال", en: "Work" },
  navAbout: { ar: "من نحن", en: "About" },

  /* hero */
  hero1: { ar: "نبدأ من حيث", en: "We start where" },
  hero2: { ar: "تبدأ الأشياء.", en: "things begin." },
  /* the boxed letter completes the first word: أ + لِف / A + liph */
  heroPara: {
    ar: "لِف وكالة تبدأ من الحرف الأوّل. لكل علامةٍ نقطة أصلٍ تُبنى منها وتعود إليها، وعملنا هو العثور على تلك النقطة، من الألِف إلى الياء.",
    en: "liph is an agency that begins at the first letter. Every brand has an origin point it is built from and returns to; our work is finding that point, then drawing the whole system from it: the name, the identity, the voice, and the way the brand shows up in the world. We design, we shoot, and we build the sites and systems that run it all. From A to Z.",
  },
  /* the dropcap letter is baked into the sprite; this is what screen
     readers get */
  dropLetter: { ar: "أ", en: "A" },
  heroMeta1: { ar: "منذ ٢٠٢٤", en: "Since 2024" },
  heroMeta2: { ar: "القدس — جبل الزيتون", en: "Jerusalem — Mount of Olives" },
  /* heroMeta3 is assigned below, derived from CATS — the literal that used to
     sit here was dead (overwritten at boot) and still carried the pre-rename
     short labels. A second copy of this list has gone stale twice already. */
  btnWork: { ar: "كل الأعمال", en: "ALL WORK" },
  btnAbout: { ar: "تعرّف على ألِف", en: "Get to know Aliph" },

  /* services */
  svcBanner: { ar: "ماذا نقدم؟", en: "What we do?" },
  svc1: { ar: "تصميم جرافيكي", en: "Graphic Design" },
  svc2: { ar: "صناعة محتوى", en: "Media Production" },
  svc3: { ar: "تطوير برمجيات", en: "Software Development" },

  /* the example switcher under "what we do" */
  swPrev: { ar: "المثال السابق", en: "Previous example" },
  swNext: { ar: "المثال التالي", en: "Next example" },
  reelPrev: { ar: "الوسيط السابق", en: "Previous item" },
  reelNext: { ar: "الوسيط التالي", en: "Next item" },

  /* why aliph — three editorial blocks, each carrying work in its holders */
  storyBanner: { ar: "لماذا ألِف؟", en: "Why Aliph?" },

  w1Title: { ar: "صوت واحد، حرفان، ولغتان.", en: "One sound, two letters, two languages." },
  w1Para: {
    ar: "ألِف أوّل الحروف، والنقطة التي يبدأ منها كل شيء. اسمٌ من حرفين، وصوتٌ واحد في لغتين: نكتب بالعربيّة أوّلًا، ثم باللاتينيّة — لا ترجمةً حرفيّة، بل نصّين يقولان الشيء نفسه بالطريقة التي تليق بكلٍّ منهما. ما يصلح في اتّجاهٍ واحد لا يصلح تلقائيًّا في الآخر، والفرق بينهما هو نصف العمل.",
    en: "Alif is the first letter, and the point everything starts from. A name of two letters and one voice in two languages: we write Arabic first, then Latin — not a literal translation but two texts saying the same thing the way each one should. What works in one direction does not automatically work in the other, and that difference is half the work.",
  },
  w2Title: { ar: "نبحث عن النقطة، ثم نرسم.", en: "We find the point, then draw the system." },

  /* ⚠️ Blocks 2 and 3 lost their body copy on 2026-08-11 when they became a
     carousel and a gallery wall, and the twenty orphaned entries went with
     it — w1Cap, w2BodyA/B, w2Rail, w2Cap1-3, w3Cap and the twelve w3Para*.
     They are in git history if the copy pass wants them back. Block 1 is the
     only why-block still carrying a paragraph. */

  w3Title: { ar: "أن تبدو النتيجة حتميّة.", en: "That the result feels inevitable." },
  whyOutro: {
    ar: "الحكاية كاملةً — كيف بدأت الوكالة، وكيف نشتغل، وما الذي نقيس عليه عملنا.",
    en: "The whole story — how the agency started, how we work, and what we measure the work against.",
  },

  /* contact */
  cBand: { ar: "لنبدأ من الألِف", en: "Let's start from the Aliph" },
  cLabelMail: { ar: "للمشاريع والتعاون", en: "Projects & collaboration" },
  cLabelPhone: { ar: "هاتف", en: "Phone" },
  cLabelWhats: { ar: "واتساب", en: "WhatsApp" },
  cLabelPlace: { ar: "الوكالة", en: "The agency" },
  cPlace: { ar: "القدس — جبل الزيتون", en: "Jerusalem — Mount of Olives" },
  cClock: { ar: "بتوقيت القدس", en: "Jerusalem time" },
  legal: { ar: "ألِف © ٢٠٢٦ — جميع الحقوق محفوظة", en: "Aliph © 2026 — All rights reserved" },

  /* library + about */
  libTitle: { ar: "الأرشيف", en: "Archive" },
  libStats: { ar: "الأحدث أوّلًا", en: "Newest first" },
  mPlay: { ar: "شغّل الفيلم", en: "Play film" },
  libIndex: { ar: "فهرس", en: "Index" },
  libGallery: { ar: "معرض", en: "Gallery" },
  aboutBanner: { ar: "من نحن؟", en: "Who are we?" },

  /* project profile sheet */
  pfOpen: { ar: "افتح الملف", en: "Open profile" },
  pfDetails: { ar: "التفاصيل", en: "Details" },
  pfShots: { ar: "لقطات", en: "Screenshots" },
  pfAbout: { ar: "عن المشروع", en: "About this project" },
  pfClose: { ar: "إغلاق", en: "Close" },
  pfPreview: { ar: "معاينة الموقع", en: "Open live preview" },
  pfPreviewNote: {
    ar: "نسخة معاينة — لا تُجمع أيّ بيانات ولا تُرسل أيّ استمارة.",
    en: "Preview build — no data is collected and no form is submitted.",
  },
  pfService: { ar: "الخدمة", en: "Service" },
  pfDate: { ar: "التاريخ", en: "Date" },
  cap1: { ar: "من جلسة تصوير — البلدة القديمة", en: "From a shoot — the Old City" },
  cap2: { ar: "وراء الكواليس — تجهيز فعاليّة", en: "Behind the scenes — event setup" },
  cap3: { ar: "نقاش تصميم — الوكالة", en: "Design discussion — the agency" },
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
  /* about — the long read */
  abLead: {
    ar: "ألِف وكالة إبداعية من القدس — من جبل الزيتون تحديدًا. بدأت بفكرة واحدة: أنّ العلامة ليست شعارًا يُرسم، بل نظام يُبنى من نقطة أصله. واسمنا نفسه هو أوّل الحروف: النقطة التي تبدأ منها كل كلمة، والمقياس الذي تُرسم عليه بقيّة الحروف.",
    en: "Aliph is a creative agency from Jerusalem — from the Mount of Olives, to be exact. It began on a single idea: that a brand is not a logo you draw, but a system you build from its point of origin. Our name is that point — the first letter, the place every word starts, and the measure the rest of the letters are drawn against.",
  },
  abP2: {
    ar: "نعمل بالعربيّة أوّلًا. ليست العربيّة عندنا لغةً تُضاف بعد أن يجهز التصميم الإنجليزي، بل هي اللغة التي يُرسم عليها النظام من السطر الأوّل: الخط، والاتّجاه، والإيقاع، وشكل الأرقام. ثم تأتي الإنجليزيّة لتقف إلى جانبها بالكفاءة نفسها، لا كترجمة متأخّرة.",
    en: "We work in Arabic first. Arabic isn't a language we bolt on once the English design is finished — it's the language the system is drawn in from the first line: the type, the direction, the rhythm, the shape of the numerals. English then stands beside it with equal care, not as a late translation.",
  },
  abP3: {
    ar: "نحن فريق صغير عن قصد. يعني ذلك أنّ من تُحدّثه في الاجتماع الأوّل هو نفسه من يعمل على مشروعك، وأنّ العمل لا يمرّ عبر طبقات حتى يفقد ما بدأ به. ويعني أيضًا أننا نختار المشاريع التي نستطيع أن نمنحها ما تستحقّه من وقت.",
    en: "We are small on purpose. It means the person you meet first is the person who does the work, and that nothing passes through so many hands that it loses what it started as. It also means we take on the projects we can give the time they deserve.",
  },
  abP4: {
    ar: "من الحرف الأوّل إلى آخر تفصيل: نصمّم الهويّة وما يُطبع منها، ونصوّر ما تحتاجه لتظهر — صورًا وفيديو وريلز — ونبرمج المواقع والأنظمة التي تُشغّلها. ثلاث خدمات على الورق، لكنها في العمل خطّ واحد متّصل — وهذا هو الفرق.",
    en: "From the first letter to the last detail: we design the identity and everything printed from it, shoot what it needs in order to appear — stills, film and reels — and build the sites and systems that keep it running. Three services on paper — one continuous line in practice, and that is the whole difference.",
  },
  abPull: {
    ar: "لا نسلّم شعارًا ونمضي. نسلّم نظامًا يعرف كيف يتصرّف.",
    en: "We don't hand over a logo and walk away. We hand over a system that knows how to behave.",
  },
  abFact1k: { ar: "التأسيس", en: "Founded" },
  abFact1v: { ar: "٢٠٢٤", en: "2024" },
  abFact2k: { ar: "المقرّ", en: "Based in" },
  abFact2v: { ar: "القدس — جبل الزيتون", en: "Jerusalem — Mount of Olives" },
  abFact3k: { ar: "اللغات", en: "Languages" },
  abFact3v: { ar: "عربي / إنجليزي", en: "Arabic / English" },
  abFact4k: { ar: "الخدمات", en: "Services" },
  abFact4v: { ar: "ثلاث", en: "Three" },

  svcAboutBanner: { ar: "ماذا نقدّم؟", en: "What we offer" },
  abWhat: { ar: "ما نفعله", en: "What we do" },
  abWhy: { ar: "لماذا نحن", en: "Why us" },
  abDoes: { ar: "يشمل", en: "Includes" },
};

/* one section per service on the about page */
const SERVICES = [
  {
    id: "design", tag: "GRAPHIC DESIGN", seed: "aliph-svc1",
    what: {
      ar: "نبني الهويّة من نقطة أصلها، لا من شكلها. نبحث أوّلًا في الاسم والحكاية والمكان عن النقطة التي تُبنى منها العلامة، ثم نرسم منها النظام كاملًا: الشعار، ولوحة الألوان، والخطوط، ونبرة الصوت، والقرطاسيّة، وقواعد الظهور اليوميّة.",
      en: "We build an identity from its origin point, not from its shape. First we look in the name, the story and the place for the point the brand is built from, then we draw the whole system out of it: the mark, the palette, the type, the tone of voice, the stationery, and the rules for showing up every day.",
    },
    why: {
      ar: "لأننا لا نسلّم شعارًا ونمضي — نسلّم نظامًا يعرف كيف يتصرّف حين لا نكون موجودين: في المطبوع، وعلى الشاشة، وفي الشارع، وبين يديّ من يستعمله كل يوم. ولأنّ العربيّة عندنا ليست ترجمةً لاحقة؛ نصمّم بها من السطر الأوّل، فلا يخرج حرفٌ مكسورٌ لأنّ النظام وُضع لغيره.",
      en: "Because we don't hand over a logo and walk away — we hand over a system that knows how to behave when we're not in the room: in print, on screen, in the street, in the hands of whoever uses it daily. And because Arabic isn't an afterthought here; we design in it from the first line, so nothing arrives broken because the system was built for another script.",
    },
    does: {
      ar: ["دليل الهويّة", "الشعار ومشتقّاته", "نظام الألوان والخطوط", "القرطاسيّة", "المطبوعات والملصقات", "التغليف واللافتات"],
      en: ["Brand guidelines", "Logo & lockups", "Color & type system", "Stationery", "Printables & posters", "Packaging & signage"],
    },
  },
  {
    id: "photo", tag: "MEDIA PRODUCTION", seed: "aliph-svc2",
    what: {
      ar: "نصوّر ما تحتاجه العلامة لتظهر: جلسات ثابتة للمنتج والمكان والوجوه، وفيديو أفقي للحملات والتعريف، وريلز عموديّة للمنصّات. ومعها التوثيق الكامل للفعاليّات — من أوّل ساعة تجهيز إلى آخر ضيف يغادر.",
      en: "We shoot what a brand needs in order to appear: stills of the product, the place and the faces; horizontal video for campaigns and profiles; vertical reels for the feed. And full coverage of events — from the first hour of setup to the last guest leaving.",
    },
    why: {
      ar: "لأنّ الصورة التي تُلتقط داخل الهويّة تبدو مختلفة عن الصورة التي تُلصق عليها. نحن نعرف علامتك من الداخل، غالبًا لأننا من بناها، فكل لقطة تخرج من النظام نفسه لا من خارجه. وهذا تحديدًا تاريخنا الأطول: التصوير هو ما كنّا نفعله قبل أن نصير وكالة كاملة.",
      en: "Because a frame shot inside the identity looks different from a frame stuck onto it. We know your brand from the inside, often because we built it, so every shot comes out of the same system rather than beside it. And this is where our longest history is: photography is what we did before we became a full agency.",
    },
    does: {
      ar: ["تصوير المنتج والمكان", "بورتريه ووجوه", "فيديو أفقي وتعريفي", "ريلز عموديّة", "تغطية الفعاليّات", "المونتاج والتلوين"],
      en: ["Product & place photography", "Portraiture", "Horizontal & profile video", "Vertical reels", "Event coverage", "Edit & grade"],
    },
  },
  {
    id: "tech", tag: "SOFTWARE DEVELOPMENT", seed: "aliph-svc3",
    what: {
      ar: "نبني المواقع والأنظمة والتطبيقات التي تحتاجها العلامة لتشتغل فعلًا: بورتفوليو أو موقع تعريفي، صفحة هبوط لحملة، متجر، نظام تسجيل أو حجز، لوحة إدارة يفهمها صاحبها، أو تطبيق هاتف.",
      en: "We build the sites, systems and apps a brand needs to actually run: a portfolio or presence site, a campaign landing page, a store, a registration or booking system, an admin panel its owner can understand, or a mobile app.",
    },
    why: {
      ar: "لأنّ الفرق بين موقعٍ جميل وموقعٍ يعمل هو أن يبنيه من يفهم الهويّة والبرمجة معًا. نحن نصمّم ونبرمج تحت سقف واحد، فلا يضيع التصميم في الترجمة إلى كود، ولا يُسلَّم نظام لا يشبه صاحبه. ونبني بالعربيّة أوّلًا: الاتّجاه، والخط، وشكل الأرقام، والاستمارات — لا كإصلاحٍ يُضاف في آخر أسبوع.",
      en: "Because the difference between a site that looks good and a site that works is having it built by people who understand both the identity and the code. We design and engineer under one roof, so nothing is lost translating design into code and no system ships looking unlike its owner. And we build Arabic-first: direction, type, numerals and forms — not as a patch added in the final week.",
    },
    does: {
      ar: ["بورتفوليو ومواقع تعريفيّة", "صفحات هبوط ومتاجر", "أنظمة تسجيل وحجز", "لوحات إدارة", "تطبيقات هاتف", "استضافة ومتابعة"],
      en: ["Portfolios & presence sites", "Landing pages & storefronts", "Registration & booking systems", "Admin dashboards", "Mobile apps", "Hosting & maintenance"],
    },
  },
];

const CATS = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "design", ar: "تصميم جرافيكي", en: "Graphic Design" },
  { id: "photo", ar: "صناعة محتوى", en: "Media Production" },
  { id: "tech", ar: "تطوير برمجيات", en: "Software Development" },
];

/* The hero's third meta slot lists what the agency does, and a typed copy of
   that list has now gone stale twice: it still read "هويّات · تسويق ·
   فعاليّات · تقنيّة" — the FOUR services retired on 2026-08-08 — and the JS
   fallback beside it still had the pre-rename short labels. Derived, so the
   taxonomy is the only place this can be changed. */
I18N.heroMeta3 = {
  ar: CATS.filter((c) => c.id !== "all").map((c) => c.ar).join(" · "),
  en: CATS.filter((c) => c.id !== "all").map((c) => c.en).join(" · "),
};

/* The example switcher steps through these subcategories, not through
   projects. `desc` speaks about the category and subcategory together. */
const SUBCATS = {
  design: [
    {
      id: "logos", ar: "شعارات", en: "Logos", seed: "aliph-d1",
      desc: {
        ar: "الشعار هو النقطة التي يُبنى منها كل ما بعده: نرسمه بمشتقّاته وأحجامه وحالاته، ونسلّمه بقواعد استعماله لا كملفٍّ وحيد. ونختبره حيث سيعيش فعلًا: على لافتة، وعلى فنجان، وفي صورة شخصيّة مربّعة بحجم ظفر الإبهام. الشعار الذي ينجو من هذه الثلاثة ينجو من كل شيء بعدها.",
        en: "The mark is the point everything after it is built from: we draw it with its lockups, sizes and states, and hand it over with the rules for using it — not as a single file. And we test it where it will actually live: on a sign, on a cup, and in a square avatar the size of a thumbnail. A mark that survives those three survives everything after them."
      }
    },
    {
      id: "print", ar: "مطبوعات", en: "Printables", seed: "aliph-d2",
      desc: {
        ar: "قرطاسيّة، وقوائم، ودعوات، وكتيّبات — مصمّمة للورق أوّلًا: المقاسات، والهوامش، والحبر، وما يحدث للحرف العربي حين يُطبع صغيرًا. ونحسب الكلفة قبل الجمال: عدد الألوان، ونوع الورق، وما إذا كان التصميم يحتمل الطباعة الرقميّة أم يحتاج أوفست. المطبوع الذي لا يستطيع صاحبه إعادة طباعته هو تصميم استُعمل مرّة واحدة.",
        en: "Stationery, menus, invitations and booklets — designed for paper first: trim sizes, margins, ink, and what happens to an Arabic letter when it prints small. And we cost it before we prettify it: how many inks, which stock, and whether it survives digital printing or needs offset. Printed matter its owner can't reprint is a design that got used once."
      }
    },
    {
      id: "posters", ar: "ملصقات", en: "Posters", seed: "aliph-d3",
      desc: {
        ar: "الملصق يُقرأ من عشرة أمتار ثم من نصف متر. نصمّمه ليقول شيئًا واحدًا من بعيد، ويكافئ من اقترب بتفصيلٍ لم يره أوّل مرّة. ونصمّمه ليُصوَّر أيضًا: نصف من سيرونه لن يمرّوا بجانبه، بل سيرونه في صورة على الهاتف. ما يعمل على الجدار ولا يعمل في المربّع الصغير نصف عمل.",
        en: "A poster is read from ten metres, then from half a metre. We design it to say one thing from far away and reward whoever steps closer with a detail they missed. And we design it to be photographed too: half the people who see it will never walk past it — they will see it in a picture on a phone. What works on a wall and dies in a small square is half a job."
      }
    },
  ],
  photo: [
    {
      id: "reels", ar: "ريلز", en: "Reels", seed: "aliph-p1",
      desc: {
        ar: "فيديو عمودي قصير للمنصّات: يُصوَّر ويُركَّب ليعمل بلا صوت في أوّل ثانيتين، ثم يكافئ من رفع الصوت. ونكتب الريل قبل تصويره: لقطة تفتح، وفكرة واحدة، ونهاية تُغري بالإعادة. أمّا التصوير أوّلًا ثم البحث عن قصّة في المونتاج فهو أطول طريق إلى أضعف نتيجة.",
        en: "Short vertical video for the feed: shot and cut to work muted in the first two seconds, then to reward whoever turns the sound on. And we write the reel before shooting it: an opening frame, one idea, and an ending that earns a replay. Shooting first and hunting for a story in the edit is the longest route to the weakest result."
      }
    },
    {
      id: "video", ar: "فيديو أفقي", en: "Video", seed: "aliph-p2",
      desc: {
        ar: "فيديو تعريفي وحملات: مقابلات، ومشاهد مكان، ومنتج في يد صاحبه — مونتاج وتلوين ضمن نظام العلامة اللوني. ونصوّر ليُقتطع: من كل جلسة يخرج الفيلم الطويل، ونسخة قصيرة للمنصّات، ولقطات صامتة تصلح للموقع. الميزانيّة نفسها، وثلاثة استعمالات بدل واحد.",
        en: "Profile films and campaigns: interviews, place, and the product in its owner's hands — edited and graded inside the brand's own colour system. And we shoot for reuse: every session yields the long film, a short cut for social, and silent clips the website can use. Same budget, three uses instead of one."
      }
    },
    {
      id: "stills", ar: "صور ثابتة", en: "Stills", seed: "aliph-p3",
      desc: {
        ar: "جلسات للمنتج والمكان والوجوه، وتوثيق الفعاليّات. نسلّم مكتبة صور تكفي سنةً من النشر، لا عشر لقطات تنفد في شهر. ونسلّمها مرتّبة ومسمّاة ومقصوصة بالمقاسات التي ستُستعمل بها فعلًا، لا مجلّدًا فيه ثمانمئة ملفّ. المكتبة التي لا يستطيع صاحبها أن يجد فيها صورة هي مكتبة لم تُسلَّم.",
        en: "Sessions for product, place and faces, and event coverage. We deliver an image library that carries a year of publishing, not ten frames that run out in a month. And we hand them over ordered, named and cropped to the sizes they will actually be used at — not a folder of eight hundred files. A library its owner can't find a picture in is a library that was never delivered."
      }
    },
  ],
  tech: [
    {
      id: "portfolio", ar: "بورتفوليو", en: "Portfolios", seed: "aliph-t1",
      desc: {
        ar: "موقع يعرض العمل كما يستحقّ أن يُعرض: سريع على شبكة الهاتف، عربيّ الاتّجاه من السطر الأوّل، ويُحدَّث دون أن تحتاج إلى مبرمج. ونبنيه ليُحدَّث في خمس دقائق: مشروع جديد يعني صورًا وسطرين، لا مكالمة مع مبرمج. البورتفوليو الذي لا يُحدَّث يصبح خلال سنة أسوأ من عدمه.",
        en: "A site that shows the work the way it deserves: fast on mobile data, right-to-left from the first line, and updatable without needing a developer. And we build it to be updated in five minutes: a new project means pictures and two lines, not a call with a developer. A portfolio nobody updates is, within a year, worse than none."
      }
    },
    {
      id: "landing", ar: "صفحات هبوط", en: "Landing pages", seed: "aliph-t2",
      desc: {
        ar: "صفحة واحدة لحملة واحدة، مبنيّة حول فعلٍ واحد: التسجيل، أو الشراء، أو الحجز. ومعها الأرقام التي تقول إن كانت تعمل. ونقيس ما يهمّ فقط: كم وصل، وكم بدأ، وكم أكمل، وأين توقّف الباقون. ثلاثة أرقام تُقرأ في دقيقة خير من لوحة فيها أربعون رقمًا لا يفتحها أحد.",
        en: "One page for one campaign, built around a single action: register, buy, or book. And the numbers that say whether it works. And we measure only what matters: how many arrived, how many started, how many finished, and where the rest stopped. Three numbers read in a minute beat a dashboard of forty nobody opens."
      }
    },
    {
      id: "apps", ar: "تطبيقات", en: "Apps", seed: "aliph-t3",
      desc: {
        ar: "أنظمة تسجيل وحجز، ولوحات إدارة، وتطبيقات هاتف — تُبنى لمن يشغّلها يوميًّا، لا لمن يراها في العرض التقديمي. ونبدأ من أصعب يوم لا من أسهله: ماذا يحدث حين تنقطع الشبكة، وحين يصل مئة شخص معًا، وحين يضغط أحدهم زرًّا مرّتين. النظام الذي يُبنى لليوم الهادئ ينكسر في اليوم الذي بُني لأجله.",
        en: "Registration and booking systems, admin panels and mobile apps — built for whoever runs them daily, not for whoever sees them in the pitch deck. And we start from the hardest day, not the easiest: what happens when the network drops, when a hundred people arrive at once, and when somebody taps a button twice. A system built for the quiet day breaks on the day it was built for."
      }
    },
  ],
};

/* ══════════ the media archive ══════════
   Every file the agency put in the Drive, served from R2.

   ⚠️ GENERATED. Do not hand-edit: `d` is read out of each file's own metadata
   — EXIF DateTimeOriginal for a photograph, the container's creation_time for
   a film — and a typed copy of seventy dates is wrong the first time anything
   is added. Rebuild it from the originals rather than patching a row.

   ⚠️ `d: null` is the truth, not a gap to fill. The nine design pieces are
   1080x1350 PNG exports with an empty EXIF block: there is no date in them to
   read. They sort to the end of the run and show no date. A real one has to
   come from the agency — see HANDOFF.

   Video is on R2 because it has to be: Workers cap a single static asset at
   25 MiB and these run 28-84 MB. The photographs are there too, so the
   archive has one address. `r` is width/height, used to give each tile the
   shape of the thing inside it — the design work is 4:5 and does NOT crop,
   which is why this page sizes from the ratio instead of forcing a grid. */
const R2 = "https://pub-0b1a78477e8542a28db190d86f861426.r2.dev";
const MEDIA = [
  { f: "design-grillit-1.webp", c: "design", r: 0.8, d: null },
  { f: "design-grillit-2.webp", c: "design", r: 0.8, d: null },
  { f: "design-grillit-3.webp", c: "design", r: 0.8, d: null },
  { f: "design-shawarma-habash-1.webp", c: "design", r: 0.8, d: null },
  { f: "design-shawarma-habash-2.webp", c: "design", r: 0.8, d: null },
  { f: "design-shawarma-mix-1.webp", c: "design", r: 0.8, d: null },
  { f: "design-shawarma-mix-2.webp", c: "design", r: 0.8, d: null },
  { f: "design-shawarma-veal-1.webp", c: "design", r: 0.8, d: null },
  { f: "design-shawarma-veal-2.webp", c: "design", r: 0.8, d: null },
  { f: "pics-Agreements-09-dsc05463.webp", c: "photo", r: 1.4995, d: "2026-07-28" },
  { f: "pics-Agreements-10-dsc05514.webp", c: "photo", r: 1.4995, d: "2026-07-28" },
  { f: "pics-Agreements-11-dsc05764.webp", c: "photo", r: 1.4995, d: "2026-07-28" },
  { f: "pics-Agreements-12-dsc05824.webp", c: "photo", r: 1.4995, d: "2026-07-28" },
  { f: "pics-Interactive-36-dsc02566.webp", c: "photo", r: 1.4995, d: "2026-07-18" },
  { f: "pics-Interactive-37-dsc03223.webp", c: "photo", r: 1.4995, d: "2026-07-18" },
  { f: "pics-Interactive-38-dsc03254.webp", c: "photo", r: 1.4995, d: "2026-07-18" },
  { f: "pics-Interactive-39-dsc03986.webp", c: "photo", r: 1.4995, d: "2026-07-18" },
  { f: "pics-Interactive-40-dsc04052.webp", c: "photo", r: 1.4995, d: "2026-06-04" },
  { f: "pics-Interactive-41-dsc04135.webp", c: "photo", r: 1.4995, d: "2026-06-04" },
  { f: "pics-Interactive-42-dsc04152.webp", c: "photo", r: 1.4995, d: "2026-06-04" },
  { f: "pics-Queen-retreat-52-copy-of-0c2a0144.webp", c: "photo", r: 0.6669, d: "2026-07-21" },
  { f: "pics-Queen-retreat-53-copy-of-0c2a0153.webp", c: "photo", r: 0.6669, d: "2026-07-21" },
  { f: "pics-Queen-retreat-54-copy-of-0c2a0158.webp", c: "photo", r: 0.6669, d: "2026-07-21" },
  { f: "pics-Queen-retreat-55-copy-of-0c2a0240.webp", c: "photo", r: 1.4995, d: "2026-07-21" },
  { f: "pics-Queen-retreat-56-copy-of-0c2a0257.webp", c: "photo", r: 1.4995, d: "2026-07-21" },
  { f: "pics-Queen-retreat-57-copy-of-0c2a9757.webp", c: "photo", r: 1.4995, d: "2026-07-21" },
  { f: "pics-Queen-retreat-58-copy-of-0c2a9810.webp", c: "photo", r: 0.6669, d: "2026-07-21" },
  { f: "pics-Queen-retreat-59-copy-of-0c2a9812.webp", c: "photo", r: 1.4995, d: "2026-07-21" },
  { f: "pics-Queen-retreat-60-copy-of-copy-of-0c2a0144.webp", c: "photo", r: 0.6669, d: "2026-07-21" },
  { f: "pics-food-14-dsc00666.webp", c: "photo", r: 0.6669, d: "2026-03-22" },
  { f: "pics-food-15-dsc00669.webp", c: "photo", r: 0.6669, d: "2026-03-22" },
  { f: "pics-food-16-dsc00710.webp", c: "photo", r: 0.6669, d: "2026-03-22" },
  { f: "pics-food-17-dsc00763.webp", c: "photo", r: 0.6669, d: "2026-03-22" },
  { f: "pics-food-18-dsc00778.webp", c: "photo", r: 0.6669, d: "2026-03-22" },
  { f: "pics-food-19-dsc00812-2.webp", c: "photo", r: 1.4995, d: "2026-03-22" },
  { f: "pics-food-20-dsc00890.webp", c: "photo", r: 1.4995, d: "2026-03-22" },
  { f: "pics-food-21-dsc03454.webp", c: "photo", r: 1.4995, d: "2026-05-29" },
  { f: "pics-food-22-dsc03532.webp", c: "photo", r: 1.4995, d: "2026-05-29" },
  { f: "pics-food-23-dsc03582.webp", c: "photo", r: 1.4995, d: "2026-05-29" },
  { f: "pics-food-24-dsc03667.webp", c: "photo", r: 0.6669, d: "2026-05-29" },
  { f: "pics-group-pics-25-img.webp", c: "photo", r: 1.4995, d: "2026-03-17" },
  { f: "pics-group-pics-26-dsc04631.webp", c: "photo", r: 1.4995, d: "2026-05-17" },
  { f: "pics-group-pics-27-dsc07110.webp", c: "photo", r: 1.4995, d: "2026-06-05" },
  { f: "pics-idk-category-28-dsc00020.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-29-dsc00032.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-30-dsc00036.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-31-dsc00405.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-32-dsc00644.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-33-dsc00914.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-34-dsc00968.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-idk-category-35-dsc01002.webp", c: "photo", r: 1.4995, d: "2026-06-19" },
  { f: "pics-official-visits-43-dsc08794.webp", c: "photo", r: 1.4995, d: "2026-06-09" },
  { f: "pics-official-visits-44-dsc08817.webp", c: "photo", r: 1.4995, d: "2026-06-09" },
  { f: "pics-official-visits-45-dsc09024.webp", c: "photo", r: 1.4995, d: "2026-06-09" },
  { f: "pics-portraits-46-2j6a5679.webp", c: "photo", r: 0.6669, d: "2026-07-15" },
  { f: "pics-portraits-47-2j6a5684.webp", c: "photo", r: 0.6669, d: "2026-07-15" },
  { f: "pics-portraits-48-2j6a5694.webp", c: "photo", r: 0.6669, d: "2026-07-15" },
  { f: "pics-public-services-49-img.webp", c: "photo", r: 1.4995, d: "2026-03-17" },
  { f: "pics-public-services-50-img.webp", c: "photo", r: 1.4995, d: "2026-03-17" },
  { f: "pics-public-services-51-img.webp", c: "photo", r: 1.4995, d: "2026-03-17" },
  { f: "pics-students-61-dsc04057.webp", c: "photo", r: 1.4995, d: "2026-07-18" },
  { f: "pics-students-62-dsc07902.webp", c: "photo", r: 1.4995, d: "2026-06-05" },
  { f: "pics-students-63-dsc07931.webp", c: "photo", r: 1.4995, d: "2026-06-05" },
  { f: "horizontal-film-bader.mp4", c: "photo", r: 1.7778, d: "2026-05-25", v: 1, p: "horizontal-film-bader.webp" },
  { f: "reels-copy-of-bader-4.mp4", c: "photo", r: 0.5625, d: "2026-07-03", v: 1, p: "reels-copy-of-bader-4.webp" },
  { f: "reels-irth-draft1.mp4", c: "photo", r: 0.5625, d: "2026-05-17", v: 1, p: "reels-irth-draft1.webp" },
  { f: "reels-child-section-final.mp4", c: "photo", r: 0.5625, d: "2026-03-27", v: 1, p: "reels-child-section-final.webp" },
  { f: "reels-draft2-show.mp4", c: "photo", r: 0.5625, d: "2026-05-25", v: 1, p: "reels-draft2-show.webp" },
  { f: "reels-finallllllllllll.mp4", c: "photo", r: 0.5625, d: "2026-03-18", v: 1, p: "reels-finallllllllllll.webp" },
  { f: "reels-dardashat.mp4", c: "photo", r: 0.5625, d: "2025-02-20", v: 1, p: "reels-dardashat.webp" },
  /* Recovered 2026-08-15. These five had come down as ~2.4 KB of Google's
     "can't scan for viruses" interstitial rather than the film — a 200 that
     wrote a plausible-looking file. Getting past it needs a cookie jar and the
     hidden confirm token replayed back.
     ⚠️ What `video/` holds for these five is a WEB DERIVATIVE, not the master.
     They arrived as edit masters at 11-25 Mbps — final-hasoub was 209 MB for
     68 seconds, which a 10 Mbps visitor cannot stream in real time. Re-encoded
     at CRF 22 under a 5.5 Mbps ceiling: same resolution, same length, and
     1125 MB down to 224 MB.

     The masters are NOT gone. They are on R2 under `master/` at full quality,
     which is the distinction the no-compression position actually turns on —
     a slot and an archive are different assets, and the argument for a
     derivative was never an argument for discarding the original. */
  /* The sixth. Drive refused this one outright — "Can't download file", not
     the scan interstitial — so the agency fetched it by hand. Same treatment
     as the rest. */
  { f: "reels-alif-tuktuk.mp4", c: "photo", r: 0.5625, d: "2026-08-01", v: 1, p: "reels-alif-tuktuk.webp" },
  { f: "reels-connect-edited.mp4", c: "photo", r: 0.5625, d: "2026-08-02", v: 1, p: "reels-connect-edited.webp" },
  { f: "reels-einar-edited.mp4", c: "photo", r: 0.5625, d: "2026-05-19", v: 1, p: "reels-einar-edited.webp" },
  { f: "horizontal-maqasid.mp4", c: "photo", r: 1.7778, d: "2026-08-04", v: 1, p: "horizontal-maqasid.webp" },
  { f: "horizontal-final-hasoub.mp4", c: "photo", r: 1.7778, d: "2026-03-04", v: 1, p: "horizontal-final-hasoub.webp" },
  { f: "horizontal-tone-colored.mp4", c: "photo", r: 1.7778, d: "2026-02-08", v: 1, p: "horizontal-tone-colored.webp" },
];

/* `date` is "YYYY-MM"; the archive is one continuous run, newest first,
   with no year sections and no piece counts. A `profile` is what opens the
   preview sheet — any project given one gets the sheet. */
const PROJECTS = [
  {
    ar: "مؤسّسة بنيان", en: "Bunyan Foundation", date: "2026-05", cat: "design", seed: "aliph01",
    desc: {
      ar: "حضورٌ أوضح وأكثر حداثة، مع الحفاظ على روح العلامة المألوفة: شعار، ألوان، تغليف، وظهور يومي.",
      en: "A clearer, more modern presence that keeps the brand's familiar spirit: mark, colors, packaging, and daily touchpoints."
    }
  },
  {
    ar: "بوّابة عودة الملكة", en: "Queen's Retreat Portal", date: "2026-05", cat: "tech", seed: "aliphT1",
    desc: {
      ar: "موقع ونظام تسجيل لخلوة عودة الملكة: صفحة هبوط، استمارة، ولوحة متابعة للمشرفين.",
      en: "A site and registration system for the Queen's Retreat: landing page, form, and an organiser dashboard."
    },
    profile: {
      kind: "site",
      tagline: { ar: "موقع · نظام تسجيل · لوحة إدارة", en: "Website · Registration · Admin dashboard" },
      body: {
        ar: "بُني الموقع ليقوم بعملين في آنٍ واحد: أن يقول حكاية الخلوة بهدوء، وأن يدير تسجيل المشاركات من أوّل ضغطة إلى آخر تأكيد. الاستمارة تكتب مباشرةً إلى جدول المنظّمات، والتأكيد يصل بالبريد خلال ثوانٍ، ولوحة المتابعة تُظهر الأعداد والحالات لحظةً بلحظة دون أن يفتح أحد ملفًّا.",
        en: "The site does two jobs at once: tell the retreat's story quietly, and run registration end to end. The form writes straight to the organisers' sheet, confirmation lands by email within seconds, and the dashboard shows counts and statuses live without anyone opening a file.",
      },
      meta: [
        { k: { ar: "العميل", en: "Client" }, v: { ar: "عودة الملكة", en: "Queen's Retreat" } },
        { k: { ar: "النوع", en: "Type" }, v: { ar: "موقع + نظام تسجيل", en: "Website + registration system" } },
        { k: { ar: "المنصّة", en: "Platform" }, v: { ar: "الويب — حاسوب وهاتف", en: "Web — desktop & mobile" } },
        { k: { ar: "التقنيّات", en: "Stack" }, v: { ar: "Cloudflare Workers · Google Sheets · JS", en: "Cloudflare Workers · Google Sheets · JS" }, latin: true },
        { k: { ar: "اللغات", en: "Languages" }, v: { ar: "عربي / إنجليزي", en: "Arabic / English" } },
      ],
      shots: ["aliphT1a", "aliphT1b", "aliphT1c", "aliphT1d", "aliphT1e"],
      preview: "preview/site-demo.html",
    }
  },
  {
    ar: "مواسم الزيتون", en: "Olive Seasons", date: "2026-04", cat: "photo", seed: "aliph02",
    desc: {
      ar: "توثيق بصري لموسم القطف من الحقل إلى المعصرة، بهويّة لونيّة واحدة وقصص يوميّة.",
      en: "A visual record of the harvest from field to press — one tonal identity and daily stories."
    }
  },
  {
    ar: "ورشة الخط", en: "Calligraphy Workshop", date: "2026-03", cat: "design", seed: "aliph03",
    desc: {
      ar: "ورشة مفتوحة في الوكالة: برنامج، مطبوعات، وتغطية كاملة لليومين.",
      en: "An open workshop at the agency: program, printed matter, and full two-day coverage."
    }
  },
  {
    ar: "حارة النصارى", en: "Christian Quarter", date: "2026-03", cat: "photo", seed: "aliph04",
    desc: {
      ar: "سلسلة مصوّرة عن تفاصيل الحارة ووجوهها، بالأبيض والأسود.",
      en: "A photographed series on the quarter's details and faces, in black and white."
    }
  },
  {
    ar: "دفتر الحضور", en: "Attendance Book", date: "2026-02", cat: "tech", seed: "aliphT2",
    desc: {
      ar: "تطبيق حضور للفعاليّات يعمل من الهاتف: مسح رمز، تسجيل فوري، وتقرير في نهاية اليوم.",
      en: "A phone-first event check-in app: scan a code, log instantly, and get a report at day's end."
    },
    profile: {
      kind: "app",
      tagline: { ar: "تطبيق · أندرويد و iOS · يعمل دون اتصال", en: "App · Android & iOS · Works offline" },
      body: {
        ar: "وُلد التطبيق من مشكلة عمليّة: طوابير على باب الفعاليّة وقوائم ورقيّة تضيع. الآن يمسح المنظّم رمز الدعوة فيُسجَّل الحضور في أقل من ثانية، ويظلّ كل شيء يعمل إذا انقطعت الشبكة ثم يزامن نفسه حين تعود. في نهاية اليوم يخرج تقرير جاهز: كم حضر، ومتى، ومن لم يأتِ.",
        en: "It came out of a practical problem: queues at the door and paper lists that go missing. An organiser scans the invitation code and attendance is logged in under a second; everything keeps working if the network drops and syncs itself when it returns. At day's end a report comes out ready: who came, when, and who didn't.",
      },
      meta: [
        { k: { ar: "العميل", en: "Client" }, v: { ar: "داخلي — أدوات ألِف", en: "Internal — Aliph tooling" } },
        { k: { ar: "النوع", en: "Type" }, v: { ar: "تطبيق هاتف", en: "Mobile application" } },
        { k: { ar: "المنصّة", en: "Platform" }, v: { ar: "أندرويد · iOS", en: "Android · iOS" } },
        { k: { ar: "التقنيّات", en: "Stack" }, v: { ar: "React Native · SQLite · Workers", en: "React Native · SQLite · Workers" }, latin: true },
        { k: { ar: "اللغات", en: "Languages" }, v: { ar: "عربي / إنجليزي", en: "Arabic / English" } },
      ],
      shots: ["aliphT2a", "aliphT2b", "aliphT2c", "aliphT2d"],
    }
  },
  {
    ar: "مقهى الجبل", en: "Mountain Café", date: "2026-02", cat: "design", seed: "aliph05",
    desc: {
      ar: "هويّة كاملة لمقهى صغير: اسم، شعار، قائمة، ولوحة واجهة.",
      en: "A complete identity for a small café: name, mark, menu, and shopfront."
    }
  },
  {
    ar: "معرض التراث", en: "Heritage Fair", date: "2026-02", cat: "design", seed: "aliph06",
    desc: {
      ar: "تنظيم معرض ثلاثة أيام: توزيع المساحة، لافتات، وتوثيق مصوّر.",
      en: "A three-day fair: spatial layout, signage, and photographic documentation."
    }
  },
  {
    ar: "سوق البلدة", en: "Old Town Market", date: "2026-01", cat: "photo", seed: "aliph07",
    desc: {
      ar: "حملة إعلانيّة كاملة لإحياء السوق القديم: مفهوم، تصوير، وإدارة منصّات لثلاثة أشهر.",
      en: "A full campaign to revive the old market: concept, photography, and three months of channel management."
    }
  },
  {
    ar: "جبل الزيتون", en: "Mount of Olives", date: "2026-01", cat: "photo", seed: "aliph08",
    desc: {
      ar: "لقطات من الجبل عند الفجر — مادّة أساس لمكتبة الصور.",
      en: "Shots from the mount at first light — base material for the image library."
    }
  },
  {
    ar: "متجر بنيان", en: "Bunyan Shop", date: "2025-11", cat: "tech", seed: "aliphT3",
    desc: {
      ar: "متجر إلكتروني بسيط لمنتجات المؤسّسة: كتالوج، سلّة، ودفع محلّي.",
      en: "A simple storefront for the foundation's products: catalogue, cart, and local payment."
    },
    profile: {
      kind: "site",
      tagline: { ar: "موقع · متجر إلكتروني · لوحة تحكّم", en: "Website · Online store · Control panel" },
      body: {
        ar: "متجر مبنيّ على قاعدة أن من يديره ليس تقنيًّا. الكتالوج يُحدَّث من لوحة واحدة بالعربيّة، والصفحة تُحمَّل سريعًا على شبكة الهاتف، والدفع يمرّ عبر مزوّد محلّي. الهويّة البصريّة للمؤسّسة انتقلت إلى الشاشة كما هي: الحبر، والكريمي، وسطر الأساس نفسه.",
        en: "A store built on the premise that whoever runs it isn't technical. The catalogue updates from one Arabic panel, pages load fast on mobile data, and payment goes through a local provider. The foundation's identity carried onto the screen intact: the ink, the cream, the same baseline rule.",
      },
      meta: [
        { k: { ar: "العميل", en: "Client" }, v: { ar: "مؤسّسة بنيان", en: "Bunyan Foundation" } },
        { k: { ar: "النوع", en: "Type" }, v: { ar: "متجر إلكتروني", en: "E-commerce" } },
        { k: { ar: "المنصّة", en: "Platform" }, v: { ar: "الويب — حاسوب وهاتف", en: "Web — desktop & mobile" } },
        { k: { ar: "التقنيّات", en: "Stack" }, v: { ar: "Astro · Stripe · Workers KV", en: "Astro · Stripe · Workers KV" }, latin: true },
        { k: { ar: "اللغات", en: "Languages" }, v: { ar: "عربي / إنجليزي", en: "Arabic / English" } },
      ],
      shots: ["aliphT3a", "aliphT3b", "aliphT3c", "aliphT3d"],
      preview: "preview/site-demo.html",
    }
  },
  {
    ar: "ليالي رمضان", en: "Ramadan Nights", date: "2025-10", cat: "photo", seed: "aliph09",
    desc: {
      ar: "فعاليّة مجتمعيّة على مدار الشهر: برنامج، هويّة للفعاليّة، وتغطية يوميّة.",
      en: "A month-long community event: program, event identity, and daily coverage."
    }
  },
  {
    ar: "البلدة القديمة", en: "The Old City", date: "2025-09", cat: "photo", seed: "aliph10",
    desc: {
      ar: "أرشيف مصوّر للأزقّة والأبواب، صُوّر على مدار فصلين.",
      en: "A photographic archive of alleys and doorways, shot across two seasons."
    }
  },
  {
    ar: "مهرجان الصيف", en: "Summer Festival", date: "2025-08", cat: "design", seed: "aliph11",
    desc: {
      ar: "مهرجان مفتوح: هويّة بصريّة، لافتات موقع، وتوثيق مباشر.",
      en: "An open-air festival: visual identity, site signage, and live documentation."
    }
  },
  {
    ar: "دار الأيتام", en: "Orphanage Campaign", date: "2025-06", cat: "photo", seed: "aliph12",
    desc: {
      ar: "حملة تبرّعات هادئة تعتمد على الحكاية لا على الصخب.",
      en: "A quiet fundraising campaign built on story rather than volume."
    }
  },
  {
    ar: "مطعم الديوان", en: "Al-Diwan Restaurant", date: "2025-05", cat: "design", seed: "aliph13",
    desc: {
      ar: "هويّة مطعم: شعار، قوائم، قرطاسيّة، ونظام لافتات.",
      en: "A restaurant identity: mark, menus, stationery, and a signage system."
    }
  },
  {
    ar: "لوحة المواسم", en: "Seasons Dashboard", date: "2025-04", cat: "tech", seed: "aliphT4",
    desc: {
      ar: "لوحة داخليّة تجمع أرقام الحملات من كل المنصّات في شاشة واحدة.",
      en: "An internal dashboard pulling campaign numbers from every channel onto one screen."
    },
    profile: {
      kind: "app",
      tagline: { ar: "أداة داخليّة · لوحة قياس · تقارير آليّة", en: "Internal tool · Analytics · Automated reports" },
      body: {
        ar: "قبلها كان تقرير الحملة يُجمَّع يدويًّا من خمس منصّات كل شهر. الآن تُسحب الأرقام آليًّا وتُعرض على شاشة واحدة بلغة العميل: ماذا نُشر، وكم وصل، وأين تحرّك الاهتمام. التقرير الشهري يخرج ملفًّا مصمَّمًا بهويّة ألِف دون أن يلمسه أحد.",
        en: "Before it, a campaign report was assembled by hand from five platforms every month. Now the numbers pull automatically onto one screen in the client's language: what went out, how far it reached, where interest moved. The monthly report exports as a designed file in Aliph's identity without anyone touching it.",
      },
      meta: [
        { k: { ar: "العميل", en: "Client" }, v: { ar: "داخلي — أدوات ألِف", en: "Internal — Aliph tooling" } },
        { k: { ar: "النوع", en: "Type" }, v: { ar: "لوحة قياس", en: "Analytics dashboard" } },
        { k: { ar: "المنصّة", en: "Platform" }, v: { ar: "الويب — سطح المكتب", en: "Web — desktop" } },
        { k: { ar: "التقنيّات", en: "Stack" }, v: { ar: "Node · Meta & TikTok APIs · Charts", en: "Node · Meta & TikTok APIs · Charts" }, latin: true },
        { k: { ar: "اللغات", en: "Languages" }, v: { ar: "عربي / إنجليزي", en: "Arabic / English" } },
      ],
      shots: ["aliphT4a", "aliphT4b", "aliphT4c"],
    }
  },
  {
    ar: "أسبوع التصميم", en: "Design Week", date: "2025-03", cat: "design", seed: "aliph14",
    desc: {
      ar: "برنامج أسبوع كامل: جدول، مطبوعات، وتغطية للجلسات.",
      en: "A week-long program: schedule, printed matter, and session coverage."
    }
  },
  {
    ar: "افتتاح المكتبة", en: "Library Opening", date: "2024-11", cat: "design", seed: "aliph15",
    desc: {
      ar: "افتتاح مكتبة الحيّ: دعوات، لافتات، وتوثيق الليلة.",
      en: "A neighbourhood library opening: invitations, signage, and coverage of the night."
    }
  },
  {
    ar: "حملة التخرّج", en: "Graduation Campaign", date: "2024-09", cat: "photo", seed: "aliph16",
    desc: {
      ar: "حملة موسميّة للجامعات: مفهوم، تصوير، ونشر على المنصّات.",
      en: "A seasonal campaign for universities: concept, photography, and channel rollout."
    }
  },
  {
    ar: "بيت الشباب", en: "Youth House", date: "2024-07", cat: "design", seed: "aliph17",
    desc: {
      ar: "هويّة مرنة لمركز شبابي، تتحمّل أيدي كثيرة وتظلّ متماسكة.",
      en: "A flexible identity for a youth centre — it survives many hands and stays coherent."
    }
  },
  {
    ar: "نادي القراءة", en: "Reading Club", date: "2024-05", cat: "design", seed: "aliph18",
    desc: {
      ar: "محتوى شهري لنادي قراءة: أغلفة، اقتباسات، ومنشورات.",
      en: "Monthly content for a reading club: covers, pull quotes, and posts."
    }
  },
  {
    ar: "عرس فلسطيني", en: "Palestinian Wedding", date: "2024-03", cat: "photo", seed: "aliph19",
    desc: {
      ar: "توثيق عرس كامل من التحضير إلى آخر رقصة.",
      en: "A full wedding documented from preparation to the last dance."
    }
  },
];

/* one continuous run — newest first, no year sections */
const byDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

const MONTHS = {
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيّار", "حزيران",
    "تمّوز", "آب", "أيلول", "تشرين الأوّل", "تشرين الثاني", "كانون الأوّل"],
  en: ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"],
};

let lang = localStorage.getItem("aliph-lang") === "en" ? "en" : "ar";

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function num(n) {
  const s = String(n);
  return lang === "ar" ? s.replace(/[0-9]/g, (d) => AR_DIGITS[+d]) : s;
}
const dirSign = () => (document.documentElement.dir === "rtl" ? 1 : -1);

/* "2026-05" → "أيّار ٢٠٢٦" / "May 2026" */
function fmtDate(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${MONTHS[lang][+m - 1]} ${num(y)}`;
}

/* ══════════ seamless infinite loop ══════════
   Clones a track's children until it is wider than the host plus two
   periods, then travels exactly one period and repeats. Shifting periodic
   content by one period is pixel-identical, so the restart is invisible. */
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

const BAND_SPEED = 40;

let bandTween = null;

/* Four frames, matched to the film tile: the tile is one group wide and its
   sprocket run repeats in lockstep. Re-cutting it to three is a separate job
   (resources/recut_film.py), so photography takes two of the four slots. */
/* The frame slot is landscape, so these are the 3:2 photographs; a 4:5 design
   would lose a third of itself to the crop. ⚠️ The captions are still invented
   project names — real ones are pending from the agency. */
const FILM_FRAMES = [
  { src: "assets/media/pics-idk-category-28-dsc00020.webp", svc: "design", cap: { ar: "مؤسّسة بنيان — هويّة", en: "Bunyan — identity" } },
  { src: "assets/media/pics-Interactive-37-dsc03223.webp", svc: "photo", cap: { ar: "سوق البلدة — حملة", en: "Old Town Market — campaign" } },
  { src: "assets/media/pics-food-21-dsc03454.webp", svc: "photo", cap: { ar: "ليالي رمضان — تغطية", en: "Ramadan Nights — coverage" } },
  { src: "assets/media/pics-public-services-49-img.webp", svc: "tech", cap: { ar: "عودة الملكة — منصّة", en: "Queen's Retreat — platform" } },
];
const SERVICE_FRAMES = { design: 0, photo: 1, tech: 3 };
const filmScroll = document.getElementById("filmScroll");

/* One group = the four frames, cloned across the strip, with the film tile
   sized to exactly one group so the sprockets repeat in step. */
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
    /* Captions removed 2026-08-10: every one was an invented project name
       ("مؤسّسة بنيان — هويّة") and they now sit over real client work, which
       reads as a false credit. `cap` is kept in FILM_FRAMES on purpose — it
       is the shopping list for the real titles.
       NOT lazy: the strip is cloned across several viewport widths and
       travels continuously, so a deferred frame pops in mid-scroll. */
    fig.innerHTML = `<img src="${fr.src || HOLDER}" alt="" decoding="async">`;
    group.appendChild(fig);
  });
  filmScroll.appendChild(group);
  return group;
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

/* ══════════ don't animate what isn't on screen ══════════
   The contact band and film strip retransform a composited layer every
   frame, which on a phone competes with the scroll itself.

   Paused, not killed, so x survives and nothing jumps on return. Returns a
   getter because rebuilds make new tweens, and a new tween plays whether or
   not anyone can see it. */
function pauseOffscreen(el, getTween) {
  if (!el || !window.IntersectionObserver) return () => true;
  let visible = true;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    const t = getTween();
    if (!t) return;
    visible ? t.resume() : t.pause();
  }, { rootMargin: "150px" }).observe(el);
  return () => visible;
}

let bandVisible = () => true;
let loopWatchersReady = false;

function rebuildLoops() {
  if (bandTween) bandTween.kill();
  bandTween = makeLoop(document.getElementById("contactBandTrack"), BAND_SPEED);

  if (!loopWatchersReady) {
    bandVisible = pauseOffscreen(document.querySelector(".contact-band"), () => bandTween);
    loopWatchersReady = true;
  }
  /* a fresh tween plays on creation — honour where the page actually is */
  if (bandTween && !bandVisible()) bandTween.pause();
}

/* ══════════ hero film strip ══════════
   One direction, constant speed. One group of four frames is cloned across
   the strip and the film tile is sized to one group, so translating by a
   period is pixel-identical and the restart is invisible. */
const filmLoop = (() => {
  const SPEED = 34;               // px per second, constant
  let tween = null, period = 0, first = [], ready = false;
  /* the hero is the tallest thing on the page and the film its widest layer */
  let onScreen = true;

  const strip = () => document.querySelector(".filmstrip");

  /* the visible film window, measured against the strip itself so it works
     whether the panel sits beside the film or above it */
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

  /* the x that centres frame i, before choosing which period-copy to use */
  function wantX(i) {
    const f = first[i];
    return windowCenter() - (originX() + f.offsetLeft + f.offsetWidth / 2);
  }

  /* nearest x that centres frame i in the film window (period-aware) */
  function xForFrame(i) {
    const want = wantX(i);
    const cur = gsap.getProperty(filmScroll, "x") || 0;
    return want + Math.round((cur - want) / period) * period;
  }

  /* What has to land correctly is the content's leading edge in strip
     coordinates (originX + x), not x itself — under RTL a max-content track
     is right-aligned, so originX is a large negative number and x cancels it.
     Seeding from wantX() alone left a blank gap at the start of the EN
     layout. Content is periodic, so shift by whole periods until that edge
     sits one period before the window, leaving room to travel either way. */
  function seedX(i) {
    const want = wantX(i);
    const lead = originX() + want;
    let target = lead % period;
    if (target > 0) target -= period;   /* (-P, 0]  */
    target -= period;                   /* (-2P, -P] */
    return want + (target - lead);
  }

  /* Always null the handle when killing: gsap's kill() doesn't clear it and a
     killed tween still answers truthy, so setVisible() would call resume()
     on a corpse and the strip would never move again. */
  function stop() {
    if (tween) tween.kill();
    tween = null;
  }

  function run() {
    stop();
    if (prefersReduced || !ready || !onScreen) return;
    const from = gsap.getProperty(filmScroll, "x") || 0;
    tween = gsap.fromTo(filmScroll,
      { x: from },
      { x: from + dirSign() * period, duration: period / SPEED, ease: "none", repeat: -1 }
    );
  }

  return {
    rebuild() {
      stop();
      ready = false;
      const group = buildFilm();
      if (!group) return;
      gsap.set(filmScroll, { x: 0 });
      period = group.getBoundingClientRect().width;
      if (!period) return;
      /* one film tile per group, so the sprocket run repeats in step with the
         frames; the frame slot is a quarter of the tile's own aspect, so the
         scan is shown unstretched */
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
      stop();
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
    /* Paused rather than killed, so x survives and the strip resumes where it
       left off. */
    setVisible(v) {
      if (v === onScreen) return;
      onScreen = v;
      /* no live tween to resume — build a fresh one rather than assume it is
         merely paused */
      if (!tween) { if (v) run(); return; }
      v ? tween.resume() : tween.pause();
    },
  };
})();

/* ══════════ ransom-note letters in the headline ══════════
   One letter per line is set as a pasted paper clipping.

   Only the two verbs نبدأ and تبدأ (and "start"); الأشياء and ألِف were
   ruled out by the user.

   Arabic shaping is the hazard: pulling a letter into its own element can
   force its neighbours into isolated forms and break the word. It is safe
   here because the letter before the أ is د, which never joins forward, so
   that أ already rendered isolated. splitSafe() enforces the rule rather
   than trusting it. */
const RANSOM_WORDS = { ar: ["نبدأ", "تبدأ"], en: ["start"] };
/* Arabic letters that never connect to the letter following them */
const NON_JOINING = new Set(["ا", "أ", "إ", "آ", "د", "ذ", "ر", "ز", "و", "ؤ", "ء", "ة"]);

function splitSafe(word, i) {
  /* Latin has no joining, so every split is safe. Without this the Arabic
     rule rejects "start" — "t" is not in the non-joining set. */
  if (!/[؀-ۿ]/.test(word)) return true;
  const joinedBefore = i > 0 && !NON_JOINING.has(word[i - 1]);
  const joinsAfter = i < word.length - 1 && !NON_JOINING.has(word[i]);
  return !joinedBefore && !joinsAfter;
}

/* The agency's own clippings, cut by resources/cut_ransom.py — 16 scraps
   per language. Some are red, purple or blue-ruled against an ink-and-cream
   palette: deliberate, since a ransom note that matches isn't one. Shorten
   this list to restrict it. */
const RANSOM_COUNT = 16;
const pad2 = (n) => String(n).padStart(2, "0");

/** Wrap the target letter of the first matching word in its own clipping.
    `ring` is the sequence of scraps this letter cycles through. */
function liftRansom(line, ring) {
  const variant = ring[0];
  const text = line.textContent;
  for (const w of RANSOM_WORDS[lang] || []) {
    const at = text.indexOf(w);
    if (at < 0) continue;
    const rel = lang === "ar" ? w.lastIndexOf("أ") : w.indexOf("a");
    if (rel < 0 || !splitSafe(w, rel)) continue;
    const k = at + rel;

    const chip = document.createElement("span");
    chip.className = "ransom";
    /* the letter stays in the accessibility tree and in a copy-paste of the
       headline — only its pixels are replaced */
    const sr = document.createElement("span");
    sr.className = "ransom-sr";
    sr.textContent = text[k];

    const img = document.createElement("img");
    img.src = "assets/img/ransom/" + lang + "-" + pad2(variant) + ".webp";
    img.alt = "";
    img.decoding = "async";
    /* if a scrap 404s, fall back to the real letter rather than leave a hole */
    img.addEventListener("error", () => chip.classList.add("no-scrap"), { once: true });

    chip.append(sr, img);
    chip._ring = ring;
    chip._at = 0;
    /* a small pool of angles, so a repeated scrap still lands differently */
    chip._tilt = [-5.5, 3.5, -2, 5, -4];

    /* Warm the rest of the ring now: a swap that has to fetch first shows a gap
       where the letter was. */
    ring.slice(1).forEach((v) => {
      const pre = new Image();
      pre.src = "assets/img/ransom/" + lang + "-" + pad2(v) + ".webp";
    });

    /* rebuilt from text nodes, not innerHTML — a stray tag would be most
       visible here of all places */
    line.textContent = "";
    line.append(text.slice(0, k), chip, text.slice(k + 1));
    return chip;
  }
  return null;
}

/* ── the cycle ───────────────────────────────────────────────────
   Every couple of seconds a chip swaps scrap and angle. Hard cuts, not
   tweens: paper doesn't ease from one piece into another, and a cross-fade
   reads as a slideshow.

   Each chip runs on its own randomised interval — sharing one made both
   letters flip in lockstep, which reads as a mechanism. Paused when the hero
   leaves the viewport, same rule as the loops. */
const ransomCycle = (() => {
  let calls = [];
  let chips = [];
  let running = false;

  function swap(chip) {
    const ring = chip._ring;
    chip._at = (chip._at + 1) % ring.length;
    const img = chip.querySelector("img");
    if (img) img.src = "assets/img/ransom/" + lang + "-" + pad2(ring[chip._at]) + ".webp";
    /* re-pasted by hand, so the angle changes with the scrap */
    gsap.set(chip, { rotate: chip._tilt[chip._at % chip._tilt.length] });
  }

  function schedule(chip) {
    /* Uneven on purpose — a steady beat is a metronome, not a hand — and wide
       enough that the two letters don't drift into step. */
    const wait = 0.65 + Math.random() * 0.85;
    calls.push(gsap.delayedCall(wait, () => {
      if (!running) return;
      swap(chip);
      schedule(chip);
    }));
  }

  return {
    reset(list) {
      this.stop();
      chips = list;
    },
    start() {
      if (running || prefersReduced || !chips.length) return;
      running = true;
      chips.forEach(schedule);
    },
    stop() {
      running = false;
      calls.forEach((c) => c.kill());
      calls = [];
    },
  };
})();

let ransomFirstRun = true;
function initRansom() {
  /* A different scrap each load, never the same one twice on the page: two
     identical clippings read as a repeated graphic rather than as letters. */
  const bag = Array.from({ length: RANSOM_COUNT }, (_, i) => i + 1);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  /* Each chip gets its own slice of the bag. Kept short because every scrap
     in a ring gets fetched and this is the hero; different slices per load,
     so the set changes between visits without pulling all 16. */
  const RING_LEN = 5;
  const chips = [];
  document.querySelectorAll(".hero-title .line").forEach((line) => {
    const ring = bag.slice(chips.length * RING_LEN, (chips.length + 1) * RING_LEN);
    const chip = liftRansom(line, ring);
    if (chip) chips.push(chip);
  });
  if (!chips.length) return;

  chips.forEach((c) => gsap.set(c, { rotate: c._tilt[0] }));
  ransomCycle.reset(chips);
  if (prefersReduced) return;

  /* First run waits for the line reveal to finish. A language switch re-snaps
     immediately instead — a 1.5s pause after tapping the toggle reads as lag. */
  gsap.from(chips, {
    yPercent: -170,
    rotate: 0,
    opacity: 0,
    duration: ransomFirstRun ? 0.5 : 0.4,
    stagger: 0.14,
    delay: ransomFirstRun ? 1.5 : 0.05,
    ease: "power4.out",
  });
  ransomFirstRun = false;
  ransomCycle.start();
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

  buildBandSource();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const entry = I18N[el.dataset.i18n];
    if (entry) el.textContent = entry[lang];
  });
  /* must run after the [data-i18n] loop above, which rewrites the headline's
     textContent and destroys the chips */
  initRansom();

  svcPicker.render();
  renderLibrary();
  renderServiceSections();
  projectSheet.refresh();
  rebuildLoops();
  filmLoop.rebuild();
  fitPicks();
  tickClock();
}

/* ══════════ service names, set to fill their line ══════════
   They are the section's headline, so they should run the width of the
   column rather than sit in the middle of it.

   This cannot be a fixed vw: "Film & Photography" against تصوير means any
   single value either wraps in English or leaves Arabic floating. Text width
   is proportional to font-size, so one probe measurement is enough —
   everything horizontal in the row is in em, including the gap, for that to
   hold. */
function fitPicks() {
  const row = document.querySelector(".svc-picks");
  if (!row) return;
  const MIN = 15;                     // below this it stops being a headline
  const PROBE = 40;

  const avail = row.clientWidth;
  row.style.fontSize = PROBE + "px";

  /* `white-space: nowrap` does NOT work here — it governs line breaking inside
     a text run, not flex wrapping, so the row still wrapped and scrollWidth
     came back equal to clientWidth. `width: max-content` + `flex-wrap: nowrap`
     is what asks for the one-line intrinsic width. Both restored before
     anything can paint. */
  const wrap = row.style.flexWrap, wide = row.style.width;
  row.style.flexWrap = "nowrap";
  row.style.width = "max-content";
  const natural = row.getBoundingClientRect().width;
  row.style.flexWrap = wrap;
  row.style.width = wide;
  if (!natural || !avail) { row.style.fontSize = ""; return; }

  /* Sized to land exactly on the container, sub-pixel rounding tips the row
     into a second line at some widths. Half a percent of headroom is
     invisible and keeps it on one line everywhere. */
  const size = ((PROBE * avail) / natural) * 0.996;
  const MAX = 58;                     // cap so service titles don't over-expand
  row.style.fontSize = Math.min(MAX, Math.max(MIN, size)) + "px";
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
    if (prefersReduced) {
      document.body.classList.remove("nav-closing");
      return;
    }
    /* a second click mid-flight must not leave two tweens fighting over the
       same element — or .nav-closing stranded on the body by a cancelled
       onComplete, which would pin the overlay visible over the page */
    gsap.killTweensOf([overlay, ...items]);

    if (open) {
      document.body.classList.remove("nav-closing");
      gsap.fromTo(overlay, { yPercent: -100 }, { yPercent: 0, duration: 0.65, ease: "power4.inOut" });
      gsap.fromTo(items,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.07, delay: 0.3, ease: "power3.out" }
      );
    } else {
      /* ⚠️ The exit tween was already here and did nothing visible. The
         overlay is only painted while the body carries .nav-open, and that
         class comes off on this same frame — so the panel vanished instantly
         and the 0.55s slide ran on something nobody could see. `.nav-closing`
         keeps it painted for exactly as long as the tween needs, and comes
         off in onComplete.

         The items leave in the reverse order they arrived, and faster: an
         exit that takes as long as the entrance reads as hesitation. */
      document.body.classList.add("nav-closing");
      gsap.to(items, {
        yPercent: 40,
        opacity: 0,
        duration: 0.26,
        stagger: { each: 0.05, from: "end" },
        ease: "power3.in",
      });
      gsap.to(overlay, {
        yPercent: -100,
        duration: 0.5,
        delay: 0.14,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(overlay, { yPercent: 0 });
          gsap.set(items, { clearProps: "transform,opacity" });
          document.body.classList.remove("nav-closing");
        },
      });
    }
  });
}

/* ══════════ menu button: invert over dark sections ══════════
   The burger is fixed above the page, so whatever scrolls under it decides
   its colour. Every opaque ink field is listed here.

   The load curtain is deliberately NOT listed: it covers the button anyway,
   and counting it left the button stuck dark after the curtain lifted. */
const DARK_UNDER = [
  ".filmstrip", ".banner", ".footer",
  ".testi", ".sw-stage", ".svc-pick.is-active",
].join(",");

/* The one thing here that does real main-thread work per scroll frame:
   elementsFromPoint forces a synchronous layout flush and a full hit test.
   queueMenuSync below spaces it out. */
/** Is the point at this element's centre sitting over a dark section? */
function overDark(el) {
  const r = el.getBoundingClientRect();
  const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  for (const node of stack) {
    if (node === el || el.contains(node)) continue;
    if (node === document.body || node === document.documentElement) break;
    if (node.closest(DARK_UNDER)) return true;
  }
  return false;
}

function syncMenuBtn() {
  if (document.body.classList.contains("nav-open")) return;
  /* The burger and the language pill sit at opposite corners and are routinely
     over different sections, so each is sampled on its own. */
  if (menuBtn) menuBtn.classList.toggle("on-dark", overDark(menuBtn));
  const langPill = document.querySelector(".masthead .lang-switch");
  if (langPill) langPill.classList.toggle("on-dark", overDark(langPill));
}

/* Every frame was overkill: inverting ~100ms late is imperceptible and buys
   back five of every six hit tests. The trailing sync is what keeps it
   honest — without it the button can be left wrong wherever scrolling stops. */
const MENU_SYNC_MS = 100;
let menuTick = false, lastMenuSync = 0, menuSettle;
function queueMenuSync() {
  clearTimeout(menuSettle);
  menuSettle = setTimeout(syncMenuBtn, 140);
  if (menuTick || performance.now() - lastMenuSync < MENU_SYNC_MS) return;
  menuTick = true;
  requestAnimationFrame(() => {
    menuTick = false;
    lastMenuSync = performance.now();
    syncMenuBtn();
  });
}
window.addEventListener("scroll", queueMenuSync, { passive: true });
window.addEventListener("resize", queueMenuSync);

/* ══════════ what we do — picker + example switcher ══════════
   The arrows step through the selected service's subcategories, not its
   projects. Deliberately not animated: the swap is a straight repaint. */
let currentService = "design";

const svcPicker = (() => {
  const stage = document.getElementById("swStage");
  if (!stage) return { setService() { }, render() { }, next() { }, prev() { } };

  const media = document.getElementById("swMedia");
  const elName = document.getElementById("swName");
  const elDesc = document.getElementById("swDesc");
  const elIndex = document.getElementById("swIndex");
  const elTotal = document.getElementById("swTotal");

  let items = [], idx = 0;

  function paint() {
    const s = items[idx];
    if (!s) return;
    elName.textContent = s[lang];
    elDesc.textContent = s.desc ? s.desc[lang] : "";
    elIndex.textContent = num(String(idx + 1).padStart(2, "0"));
    elTotal.textContent = num(String(items.length).padStart(2, "0"));
    setHolder(media, s);
  }

  function go(next) {
    if (!items.length) return;
    idx = ((next % items.length) + items.length) % items.length;
    paint();
  }

  return {
    setService(id) { items = SUBCATS[id] || []; idx = 0; paint(); },
    render() {
      items = SUBCATS[currentService] || [];
      idx = Math.min(idx, Math.max(items.length - 1, 0));
      paint();
    },
    next() { go(idx + 1); },
    prev() { go(idx - 1); },
  };
})();

function activateService(id, scroll) {
  const cells = document.querySelectorAll(".svc-pick");
  if (!cells.length) return;
  cells.forEach((b) => {
    const on = b.dataset.service === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  currentService = id;
  svcPicker.setService(id);
  if (scroll) {
    document.getElementById("services").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  }
}

document.getElementById("swNext")?.addEventListener("click", () => svcPicker.next());
document.getElementById("swPrev")?.addEventListener("click", () => svcPicker.prev());

document.querySelectorAll(".svc-pick").forEach((btn) => {
  btn.addEventListener("click", () => activateService(btn.dataset.service, false));
  /* No filmLoop.focus()/blur() here: the strip is three screens up, so the
     glide drove nothing visible while pointing the loop at a frame off
     screen — which is how the strip ended up stopped. focus() still exists
     for anything near the hero that wants it. */
});

const band = document.querySelector(".contact-band");
if (band) {
  band.addEventListener("mouseenter", () => bandTween && bandTween.pause());
  band.addEventListener("mouseleave", () => bandTween && bandTween.resume());
}

/* ══════════ hero dropcap: the paper uncrumples ══════════
   A 24-frame sprite baked from the crumple clip. GSAP scrubs a frame index
   and we set background-position — no video decode, no runtime chroma key.
   Frame 0 is the tight ball, frame 23 the flat printed sheet. */
/* Hover runs the whole way back to the ball — stopping part-way just looked
   like a sheet that had failed to open. */
const CRUMPLE = { cols: 6, rows: 4, n: 24, rest: 23, crushed: 0 };

function initDropCap() {
  const cap = document.querySelector(".dropcap[data-cap]");
  if (!cap || cap.dataset.bound) return;
  cap.dataset.bound = "1";

  const sheet = cap.querySelector(".dc-sheet");
  if (!sheet) return;

  const setFrame = (v) => {
    const i = Math.max(0, Math.min(CRUMPLE.n - 1, Math.round(v)));
    const c = i % CRUMPLE.cols;
    const r = (i / CRUMPLE.cols) | 0;
    sheet.style.backgroundPosition =
      `${(c / (CRUMPLE.cols - 1)) * 100}% ${(r / (CRUMPLE.rows - 1)) * 100}%`;
  };

  if (prefersReduced) { setFrame(CRUMPLE.rest); return; }

  const st = { f: 0 };
  setFrame(0);
  /* ease "none" — the frames are evenly spaced in time, so easing would fight
     the motion baked into the clip */
  const play = (to, dur) => gsap.to(st, {
    f: to, duration: dur, ease: "none", overwrite: true,
    onUpdate: () => setFrame(st.f),
  });

  /* don't start until the sprite has decoded, or the first frames land on an
     empty background */
  const src = getComputedStyle(sheet).backgroundImage.slice(5, -2);
  const img = new Image();
  const start = () => gsap.delayedCall(0.55, () => play(CRUMPLE.rest, 0.95));
  img.onload = start;
  img.onerror = start;
  img.src = src;

  /* hover scrunches it shut and lets it fall open again */
  /* the two durations differ on purpose — crushing paper is faster than it
     relaxing back open */
  cap.addEventListener("mouseenter", () => play(CRUMPLE.crushed, 0.5));
  cap.addEventListener("mouseleave", () => play(CRUMPLE.rest, 0.85));
}

/* ══════════ lightbox ══════════
   Click any picture or film and it opens full size over a dimmed page.

   ⚠️ The ماذا نفعل؟ switcher is deliberately excluded. Its stage is a control
   — the arrows step through examples and a click there means "next", not
   "bigger". Everything else on the site is in.

   Built in JS rather than written into all three pages: it is chrome, it is
   identical everywhere, and three copies of the same markup is three places to
   forget. The <video> is created per open and destroyed on close so nothing
   keeps buffering behind a closed overlay. */
const lightbox = (() => {
  /* Every media surface that should open, and the container that decides what
     counts as "the same set" for the arrow keys. */
  const OPENS = ".why .holder, .gw-tile, .lib-grid .tile, .sheet-shot, .clip-photo, .asvc-media";
  const GROUPS = ".gwall, .lib-grid, .reelshow-track, .clippings, .wb1, main";

  let root, stage, capEl, countEl, group = [], at = 0, lastFocus = null;

  function build() {
    root = document.createElement("div");
    root.className = "lb";
    root.hidden = true;
    root.innerHTML = `
      <div class="lb-scrim" data-lb-close></div>
      <button class="lb-close" data-lb-close type="button" aria-label="${I18N.pfClose[lang]}">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M4 4l12 12M16 4L4 16"/>
        </svg>
      </button>
      <button class="lb-step lb-prev" type="button" aria-label="${I18N.reelPrev[lang]}">
        <svg viewBox="0 0 12 22" fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 1 2 11l7 10"/></svg>
      </button>
      <button class="lb-step lb-next" type="button" aria-label="${I18N.reelNext[lang]}">
        <svg viewBox="0 0 12 22" fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 1l7 10-7 10"/></svg>
      </button>
      <div class="lb-body" role="dialog" aria-modal="true">
        <div class="lb-stage"></div>
        <p class="lb-cap"><span class="lb-count"></span><span class="lb-date"></span></p>
      </div>`;
    document.body.appendChild(root);
    stage = root.querySelector(".lb-stage");
    capEl = root.querySelector(".lb-date");
    countEl = root.querySelector(".lb-count");

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-lb-close]")) return close();
      if (e.target.closest(".lb-prev")) return step(-1);
      if (e.target.closest(".lb-next")) return step(1);
    });
  }

  /* What should the overlay show for this tile? A film tile names its file on
     the node; everything else is just the picture already on screen. */
  function itemOf(node) {
    const film = node.dataset && node.dataset.film;
    const img = node.querySelector("img");
    const date = node.querySelector(".t-date");
    if (film) {
      return { video: `${R2}/video/${film}`, poster: img && img.src,
               date: date && date.textContent };
    }
    const vid = node.querySelector("video");
    if (vid) return { video: vid.currentSrc || vid.src, poster: vid.poster };
    if (!img) return null;
    /* a placeholder holder has nothing worth enlarging */
    if (img.src.startsWith("data:")) return null;
    return { img: img.currentSrc || img.src, alt: img.alt,
             date: date && date.textContent };
  }

  function paint() {
    const it = itemOf(group[at]);
    stage.textContent = "";
    if (!it) return;
    if (it.video) {
      const v = document.createElement("video");
      v.src = it.video;
      if (it.poster) v.poster = it.poster;
      v.controls = true;
      v.playsInline = true;
      v.autoplay = !prefersReduced;
      v.preload = "auto";
      stage.appendChild(v);
    } else {
      const i = document.createElement("img");
      i.src = it.img;
      i.alt = it.alt || "";
      stage.appendChild(i);
    }
    capEl.textContent = it.date || "";
    countEl.textContent = group.length > 1
      ? `${num(at + 1)} / ${num(group.length)}` : "";
    root.classList.toggle("has-steps", group.length > 1);
  }

  function step(d) {
    if (group.length < 2) return;
    at = (at + d + group.length) % group.length;
    paint();
  }

  function open(node) {
    if (!root) build();
    const host = node.closest(GROUPS) || document.body;
    group = [...host.querySelectorAll(OPENS)].filter(itemOf);
    at = Math.max(0, group.indexOf(node));
    if (!group.length) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("lb-open");
    paint();
    root.querySelector(".lb-close").focus();
  }

  function close() {
    if (!root || root.hidden) return;
    /* drop the <video> rather than pause it — a paused element with a src
       keeps its buffer and, on some browsers, keeps filling it */
    stage.textContent = "";
    root.hidden = true;
    document.body.classList.remove("lb-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("keydown", (e) => {
    if (!root || root.hidden) return;
    if (e.key === "Escape") return close();
    /* the arrows follow READING order, so they flip with the language */
    if (e.key === "ArrowLeft") return step(document.documentElement.dir === "rtl" ? 1 : -1);
    if (e.key === "ArrowRight") return step(document.documentElement.dir === "rtl" ? -1 : 1);
  });

  /* ⚠️ Delegated with a drag guard. The carousel is a scroll-snap scroller, so
     a swipe that starts on a slide ends with a click on it — without this,
     every swipe on a phone would open the overlay. */
  let downX = 0, downY = 0;
  document.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; }, true);
  document.addEventListener("click", (e) => {
    if (Math.abs(e.clientX - downX) > 10 || Math.abs(e.clientY - downY) > 10) return;
    if (e.target.closest(".lb")) return;
    /* the switcher stage is a control, not a picture */
    if (e.target.closest(".sw-stage, .sheet-thumbs, .lb-open")) return;
    const node = e.target.closest(OPENS);
    if (!node || !itemOf(node)) return;
    e.preventDefault();
    open(node);
  });

  return { open, close };
})();

/* ══════════ index page motion ══════════ */
const page = document.body.dataset.page;

if (page === "index" && !prefersReduced) {
  gsap.from(".rule-double", { scaleX: 0, transformOrigin: "right center", duration: 1, ease: "power3.inOut" });
  gsap.from(".hero-panel", { opacity: 0, y: 34, duration: 1, delay: 0.35, ease: "power3.out" });
  gsap.from(".hero-title .line", { yPercent: 110, duration: 1, stagger: 0.12, delay: 0.5, ease: "power4.out" });

  gsap.utils.toArray(".banner h2").forEach((el) => {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  /* لماذا ألِف؟ and ماذا نفعل؟ are deliberately not animated — they are a
     printed sheet. The banners above them still rise, being page furniture
     rather than section content. */
}

/* ══════════ library: category accordion ══════════ */
const accRoot = document.getElementById("accRoot");
let openCat = "all";

/* One continuous run, newest first — the media itself and its date, nothing
   else. The agency's call (2026-08-12): show the work now, organise it into
   named projects later. So there are no titles, no captions and no profile
   sheet here; PROJECTS is still in this file and is what the sheet will read
   when those exist.

   ⚠️ Each tile is sized from `r`, the medium's own ratio, NOT from a shared
   grid aspect. The design work is 4:5 with type baked in and every crop cuts
   the words — the one thing this archive must not do (see HANDOFF). Mixed
   ratios are why the run is a column layout rather than a grid of equal
   cells. */
function renderLibrary() {
  if (!accRoot) return;
  accRoot.innerHTML = "";

  /* Undated sorts LAST, not to 1970. The nine design pieces carry no date at
     all, and an empty string compares below every real one — which would file
     the newest work as the oldest. Ties break on filename so the order is
     stable between renders. */
  const byNewest = (a, b) =>
    (b.d || "").localeCompare(a.d || "") || (a.key || "").localeCompare(b.key || "");

  /* ⚠️ Two different kinds of thing share this run, and they are not
     interchangeable.

     `design` and `photo` come from MEDIA — the Drive, shown as itself with a
     date and nothing else. `tech` cannot: the software work is sites, systems
     and apps, and there is no photograph of a booking system. It comes from
     PROJECTS instead and each entry opens the profile sheet, which is the only
     way to actually show that work — what it is, what it runs on, what it was
     for. Same tile, different payload.

     ⚠️ The tech entries and their screenshots are still PLACEHOLDER content
     (see HANDOFF). The sheet is real; what it currently displays is not. */
  const rows = (catId) => {
    const media = (catId === "all" ? MEDIA : MEDIA.filter((m) => m.c === catId))
      .map((m) => ({ kind: "media", d: m.d, key: m.f, m }));
    const projects = (catId === "all" || catId === "tech")
      ? PROJECTS.filter((p) => p.cat === "tech" && p.profile)
        .map((p) => ({ kind: "project", d: p.date, key: p.en,
                       p, at: PROJECTS.indexOf(p) }))
      : [];
    return [...media, ...projects].sort(byNewest);
  };

  CATS.forEach((cat) => {
    const items = rows(cat.id);
    /* a category with nothing in it is a spine opening onto cream */
    if (!items.length) return;

    const panel = document.createElement("section");
    panel.className = "acc-panel" + (cat.id === openCat ? " open" : "");
    panel.dataset.cat = cat.id;

    const tiles = items.map((row) => {
      /* A software project has no photograph of itself — it gets a named tile
         that opens the profile sheet, which is where that work can actually
         be shown. It is the one kind of tile here that carries a title. */
      if (row.kind === "project") {
        const p = row.p;
        return `
      <figure class="tile has-profile" data-project="${row.at}" role="button" tabindex="0">
        <div class="tile-img" style="aspect-ratio:1.6">
          <img src="${HOLDER}" alt="${p[lang]}" loading="lazy">
          <span class="tile-open" aria-hidden="true">${I18N.pfOpen[lang]}</span>
        </div>
        <figcaption><span>${p[lang]}</span><span class="t-date">${fmtDate(p.date)}</span></figcaption>
      </figure>`;
      }

      /* Film shows its poster frame and nothing else until asked. A screen of
         muted loops is the exact load the phone pass spent a week removing,
         and these run 28-209 MB. */
      const m = row.m;
      const src = m.v ? `${R2}/poster/${m.p}` : `${R2}/img/${m.f}`;
      const date = m.d ? `<figcaption><span class="t-date">${fmtDate(m.d)}</span></figcaption>` : "";
      return `
      <figure class="tile${m.v ? " is-film" : ""}"${m.v ? ` data-film="${m.f}" role="button" tabindex="0" aria-label="${I18N.mPlay[lang]}"` : ""}>
        <div class="tile-img" style="aspect-ratio:${m.r}">
          <img src="${src}" alt="" loading="lazy" decoding="async">
          ${m.v ? '<span class="tile-play" aria-hidden="true"></span>' : ""}
        </div>
        ${date}
      </figure>`;
    }).join("");

    panel.innerHTML = `
      <button class="spine" aria-expanded="${cat.id === openCat}">
        <span class="spine-name">${cat[lang]}</span>
      </button>
      <div class="panel-body">
        <div class="panel-head">
          <h2>${cat[lang]}</h2>
          <span class="panel-count">${num(items.length)}</span>
        </div>
        <div class="lib-run">
          <div class="lib-grid">${tiles}</div>
        </div>
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

/* Delegated once on the root, which survives every re-render.

   Only the project tiles are handled here. Film used to play inline in its own
   tile; it opens in the lightbox now like every other piece of media, which is
   both bigger and one behaviour instead of two. The lightbox binds itself at
   the document and ignores anything it cannot enlarge — a project tile carries
   the placeholder data URI, so it falls through to this. */
if (accRoot) {
  const openSheet = (node) => projectSheet.open(+node.dataset.project);

  accRoot.addEventListener("click", (e) => {
    const node = e.target.closest("[data-project]");
    if (node) openSheet(node);
  });
  accRoot.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const node = e.target.closest("[data-project], [data-film]");
    if (!node) return;
    e.preventDefault();
    if (node.dataset.project) return openSheet(node);
    lightbox.open(node);
  });
}

/* ══════════ project profile sheet ══════════
   Cover, a big screenshot with a thumb strip, a details table and the
   write-up; sites also get a browser-chrome frame running a preview build.
   Only projects carrying a `profile` open it. */
const projectSheet = (() => {
  const root = document.getElementById("sheet");
  if (!root) return { open() { }, close() { }, refresh() { } };

  const el = (id) => document.getElementById(id);
  const sheet = root.querySelector(".sheet");
  const shot = el("sheetShot");
  const thumbs = el("sheetThumbs");
  const webview = el("webview");
  const wvFrame = el("wvFrame");

  let current = null, shotIdx = 0, lastFocus = null;

  const shotSrc = () => HOLDER;

  function paintShot(i) {
    const shots = current.profile.shots;
    shotIdx = ((i % shots.length) + shots.length) % shots.length;
    shot.src = shotSrc(shots[shotIdx], 1600, 1000);
    thumbs.querySelectorAll("button").forEach((b, n) =>
      b.classList.toggle("on", n === shotIdx));
    if (!prefersReduced) {
      gsap.fromTo(shot, { opacity: 0.25, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" });
    }
  }

  function paint() {
    const p = current, pr = p.profile;
    el("sheetCover").src = shotSrc(p.seed, 300, 300);
    el("sheetTitle").textContent = p[lang];
    el("sheetTagline").textContent = pr.tagline[lang];
    el("sheetDetailsK").textContent = I18N.pfDetails[lang];
    el("sheetAboutK").textContent = I18N.pfAbout[lang];
    el("sheetShotsK").textContent = I18N.pfShots[lang];
    el("sheetBody").textContent = pr.body[lang];
    el("sheetClose").setAttribute("aria-label", I18N.pfClose[lang]);

    el("sheetMeta").innerHTML = pr.meta.map((m) => `
      <div class="sm-row">
        <dt>${m.k[lang]}</dt>
        <dd${m.latin ? ' class="latin" lang="en" dir="ltr"' : ""}>${m.v[lang]}</dd>
      </div>`).join("") + `
      <div class="sm-row">
        <dt>${I18N.pfService[lang]}</dt>
        <dd>${CATS.find((c) => c.id === p.cat)[lang]}</dd>
      </div>
      <div class="sm-row">
        <dt>${I18N.pfDate[lang]}</dt>
        <dd>${fmtDate(p.date)}</dd>
      </div>`;

    thumbs.innerHTML = pr.shots.map((s, i) => `
      <button type="button" data-shot="${i}" aria-label="${I18N.pfShots[lang]} ${num(i + 1)}">
        <img src="${shotSrc(s, 320, 200)}" alt="" loading="lazy">
      </button>`).join("");

    /* only sites get a live preview; apps just show their screenshots */
    const cta = el("sheetPreview");
    const note = el("sheetNote");
    const hasPreview = pr.kind === "site" && pr.preview;
    cta.hidden = !hasPreview;
    note.hidden = !hasPreview;
    if (hasPreview) {
      cta.querySelector(".ob-label").textContent = I18N.pfPreview[lang];
      note.textContent = I18N.pfPreviewNote[lang];
    }
    el("wvNote").textContent = I18N.pfPreviewNote[lang];

    paintShot(0);
  }

  thumbs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-shot]");
    if (b) paintShot(+b.dataset.shot);
  });

  /* ── the browser-chrome preview ── */
  function openWebview() {
    const pr = current.profile;
    const slug = current.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    el("wvUrl").textContent = `preview.aliphcreative.com/${slug}`;
    wvFrame.src = pr.preview;
    webview.hidden = false;
    if (!prefersReduced) {
      gsap.fromTo(webview, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(webview.querySelector(".wv-window"),
        { y: 30, scale: 0.97 }, { y: 0, scale: 1, duration: 0.5, ease: "power3.out" });
    }
  }
  function closeWebview() {
    webview.hidden = true;
    wvFrame.src = "about:blank";   // stop the preview build the moment it closes
  }
  el("sheetPreview").addEventListener("click", openWebview);
  webview.addEventListener("click", (e) => {
    if (e.target.closest("[data-wv-close]")) closeWebview();
  });

  function open(i) {
    const p = PROJECTS[i];
    if (!p || !p.profile) return;
    current = p;
    lastFocus = document.activeElement;
    paint();
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("sheet-open");
    el("sheetClose").focus();
    if (!prefersReduced) {
      gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
      gsap.fromTo(sheet, { y: 46, scale: 0.985 },
        { y: 0, scale: 1, duration: 0.6, ease: "power3.out" });
    }
  }

  function close() {
    closeWebview();
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sheet-open");
    current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || root.hidden) return;
    if (!webview.hidden) closeWebview();
    else close();
  });

  return {
    open,
    close,
    /* language switch while the sheet is open */
    refresh() { if (current) paint(); },
  };
})();

/* ══════════ about: one section per service ══════════ */
const svcAboutRoot = document.getElementById("svcAbout");
function renderServiceSections() {
  if (!svcAboutRoot) return;
  svcAboutRoot.innerHTML = SERVICES.map((s, i) => {
    const cat = CATS.find((c) => c.id === s.id);
    return `
      <article class="asvc" data-svc="${s.id}">
        <figure class="asvc-media">
          <img src="${HOLDER}" alt="" loading="lazy">
          <figcaption class="asvc-tag latin" lang="en">${s.tag}</figcaption>
        </figure>
        <div class="asvc-body">
          <span class="asvc-index">${num("0" + (i + 1))}</span>
          <h3 class="asvc-name">${cat[lang]}</h3>
          <div class="asvc-rule"></div>
          <div class="asvc-block">
            <span class="asvc-k">${I18N.abWhat[lang]}</span>
            <p>${s.what[lang]}</p>
          </div>
          <div class="asvc-block">
            <span class="asvc-k">${I18N.abWhy[lang]}</span>
            <p>${s.why[lang]}</p>
          </div>
          <div class="asvc-block">
            <span class="asvc-k">${I18N.abDoes[lang]}</span>
            <ul class="asvc-list">${s.does[lang].map((d) => `<li>${d}</li>`).join("")}</ul>
          </div>
        </div>
      </article>`;
  }).join("");
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
  gsap.utils.toArray(".clip, .ab-p, .ab-fact").forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 26, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
    });
  });
  /* the service sections are rendered by JS, so bind after the first paint */
  requestAnimationFrame(() => {
    gsap.utils.toArray(".asvc").forEach((el) => {
      gsap.from(el.querySelector(".asvc-media"), {
        opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 78%" },
      });
      gsap.from(el.querySelectorAll(".asvc-index, .asvc-name, .asvc-block"), {
        opacity: 0, y: 24, duration: 0.7, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 78%" },
      });
    });
  });
}

/* ══════════ block 2's reel carousel ══════════
   The DOM position belongs to the scroller; this only reads it.

   ⚠️ Everything here is measured with getBoundingClientRect, never with
   scrollLeft. Under RTL, scrollLeft's origin and sign still differ between
   engines — it is negative in some, counts down from the maximum in others —
   and Arabic is this site's default direction, so the buggy path would be
   the normal one. A centre-to-centre distance between two rects is the same
   number whichever way the document runs, and scrollBy takes a visual delta,
   so neither needs the dirSign() flip the rest of the file carries. */
const reelShow = (() => {
  const root = document.getElementById("reelShow");
  const track = document.getElementById("reelTrack");
  if (!root || !track) return { remeasure() { } };

  const real = Array.from(track.querySelectorAll(".reel-slide"));
  const n = real.length;
  if (!n) return { remeasure() { } };

  /* ── the loop ──
     Three copies of the set, with the carousel living in the middle one.
     That is what puts a neighbour on BOTH sides of every slide including the
     first and the last, and what lets "next" past the end carry on in the
     same direction instead of rewinding the whole track to slide 1.

     The wrap is invisible because the jump is between two clones showing the
     same picture at the same offset — the scroll position changes and not a
     pixel on screen does. It only ever happens once scrolling has settled,
     never mid-scroll and never under a live finger. */
  if (n > 1) {
    const copy = () => real.map((s) => {
      const c = s.cloneNode(true);
      c.setAttribute("aria-hidden", "true");   // the same eight pictures, thrice
      return c;
    });
    track.prepend(...copy());
    track.append(...copy());
  }
  const slides = Array.from(track.querySelectorAll(".reel-slide"));

  const DWELL = 4200;
  let idx = -1, timer = null, raf = 0, settle = 0;
  let onScreen = true, held = false, dragging = false;

  function mark() {
    const t = track.getBoundingClientRect();
    const mid = t.left + t.width / 2;
    let best = 0, bestD = Infinity;
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best === idx) return;
    idx = best;
    slides.forEach((s, i) => s.classList.toggle("is-current", i === idx));
  }

  function centerOn(i, instant) {
    const s = slides[i];
    if (!s) return;
    const t = track.getBoundingClientRect();
    const r = s.getBoundingClientRect();
    track.scrollBy({
      left: (r.left + r.width / 2) - (t.left + t.width / 2),
      /* "instant", not "auto". `auto` means "defer to CSS scroll-behavior",
         which this track sets to smooth — so the reduced-motion branch would
         animate exactly like the other one and the setting would do nothing.
         Only "instant" actually jumps. */
      behavior: instant || prefersReduced ? "instant" : "smooth",
    });
  }

  /* Move the centred slide back into the middle set without moving anything
     on screen. Deferred while a finger is down: a jump under a live drag
     fights the touch and reads as the carousel snatching itself away.

     ⚠️ This TRANSLATES by the distance between two equivalent slides — one
     whole set — rather than re-centring the target. The two are the same
     thing only when the track is already at rest, and this fires mid-flight
     as well: re-centring then would snap a running animation to a stop,
     where a translation preserves the exact visual offset and stays
     invisible. */
  function recentre() {
    if (n < 2 || dragging) return;
    mark();
    if (idx >= n && idx < 2 * n) return;
    const target = n + ((idx % n) + n) % n;
    const from = slides[idx].getBoundingClientRect().left;
    const to = slides[target].getBoundingClientRect().left;
    track.scrollBy({ left: to - from, behavior: "instant" });
    mark();
  }

  function go(step) {
    /* Come home BEFORE stepping, not on the next settle. Anyone clicking
       faster than the 140ms settle never lets it fire, and the index walks
       straight out of the middle set — measured, sixteen fast clicks reached
       slide 23 of 24 and opened a 319px hole where the track runs out. */
    recentre();
    centerOn(idx + step);
  }

  /* A self-resetting timeout rather than an interval, because every scroll
     re-arms it. That is what stops the carousel yanking itself forward out
     of a swipe the visitor is still in the middle of. */
  function arm() {
    disarm();
    if (prefersReduced || !onScreen || held || n < 2) return;
    timer = setTimeout(() => { timer = null; go(1); arm(); }, DWELL);
  }
  function disarm() {
    clearTimeout(timer);
    timer = null;
  }

  const settleSoon = () => {
    clearTimeout(settle);
    settle = setTimeout(recentre, 140);
  };

  track.addEventListener("scroll", () => {
    settleSoon();
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; mark(); arm(); });
  }, { passive: true });

  /* A touch scroll keeps firing `scroll` while the finger rests, so the
     settle timer alone would fire mid-drag. These bracket the gesture. */
  track.addEventListener("touchstart", () => { dragging = true; }, { passive: true });
  ["touchend", "touchcancel"].forEach((e) =>
    track.addEventListener(e, () => { dragging = false; settleSoon(); }, { passive: true }));

  document.getElementById("reelNext")?.addEventListener("click", () => go(1));
  document.getElementById("reelPrev")?.addEventListener("click", () => go(-1));

  /* Hover-to-hold is bound only for a real pointer. On touch, pointerenter
     fires on first tap and pointerleave never does, so binding it there
     would stop the carousel for good the moment anyone touched it. */
  if (window.matchMedia("(hover: hover)").matches) {
    root.addEventListener("pointerenter", () => { held = true; disarm(); });
    root.addEventListener("pointerleave", () => { held = false; arm(); });
  }

  /* same rule as the film strip and the ransom letters: no timer runs for a
     section nobody is looking at */
  if (window.IntersectionObserver) {
    new IntersectionObserver((e) => {
      onScreen = e[0].isIntersecting;
      onScreen ? arm() : disarm();
    }, { rootMargin: "120px" }).observe(root);
  }

  /* Open on the first slide of the MIDDLE set, so there is already a
     neighbour on both sides before anyone touches anything.

     ⚠️ Asserted TWICE, and the second one is not belt-and-braces. Prepending
     the leading clone set shifts an RTL scroller under us: the browser's
     scroll anchoring adjusts scrollLeft after the insert, so a centre
     computed in the same tick lands one slide out — measured, the carousel
     opened on slide 7 of 8. The rAF pass runs after that adjustment.
     `overflow-anchor: none` on the track stops it happening again later. */
  if (n > 1) {
    centerOn(n, true);
    requestAnimationFrame(() => { centerOn(n, true); mark(); });
  }
  mark();
  arm();
  return { remeasure: mark };
})();

/* The gallery wall's tap-to-lift is gone (2026-08-15). It existed to give
   touch some equivalent of the hover lift, and the lightbox is a better one:
   a tap now opens the picture full size instead of nudging it 10px. The lift
   is a pointer affordance only, and CSS already gates it behind
   `(hover: hover)`. */

/* Whole-site paper texture, off unless asked for: `?paper=1` on any page.
   A switch rather than a decision — the agency wants to see the site wearing
   it before choosing whether it belongs everywhere. Same query-string
   convention as the chat widget's `?chat=up`. */
if (new URLSearchParams(location.search).get("paper") === "1") {
  document.body.classList.add("paper");
}

/* ══════════ boot ══════════ */
applyI18n();
initDropCap();
syncMenuBtn();
setInterval(tickClock, 20000);

/* widths measured before Idris lands are wrong and leave a gap in the
   loops — remeasure once the fonts are applied */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    rebuildLoops();
    filmLoop.rebuild();
    /* fitPicks measures text, so it is wrong until Idris has landed — the
       fallback face is a different width entirely */
    fitPicks();
    queueMenuSync();
  });
}

/* WIDTH ONLY. On a phone the address bar collapsing fires `resize` with a
   changed height and an identical width. Rebuilding on those tore the film
   strip's DOM down and re-seeded x, so the strip snapped back to its start
   every time the address bar moved — which reads as "it stopped looping".
   Neither loop depends on viewport height. */
/* The film has its own module and its own observer: filmLoop.setVisible()
   has to gate run() too, or a hover-blur would restart the strip off screen. */
(() => {
  const strip = document.querySelector(".filmstrip");
  if (!strip || !window.IntersectionObserver) return;
  new IntersectionObserver(
    (e) => filmLoop.setVisible(e[0].isIntersecting),
    { rootMargin: "150px" },
  ).observe(strip);
})();

/* the ransom letters are a running timer like the loops — same rule, stop
   when nobody can see them */
(() => {
  const title = document.querySelector(".hero-title");
  if (!title || !window.IntersectionObserver) return;
  new IntersectionObserver(
    (e) => (e[0].isIntersecting ? ransomCycle.start() : ransomCycle.stop()),
    { rootMargin: "150px" },
  ).observe(title);
})();

let resizeTimer;
let lastW = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === lastW) return;
  lastW = window.innerWidth;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    rebuildLoops();
    filmLoop.rebuild();
    fitPicks();
  }, 250);
});
