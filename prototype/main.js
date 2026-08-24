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

/* ══════════ i18n ══════════ */
const I18N = {
  navHome: { ar: "الرئيسيّة", en: "Home" },
  navWork: { ar: "الأعمال", en: "Work" },
  navAbout: { ar: "من نحن", en: "About" },

  /* hero */
  hero1: { ar: "نبدأ من حيث", en: "We start where" },
  hero2: { ar: "تبدأ الأشياء.", en: "things begin." },
  /* the boxed letter completes the first word: أ + لِف / A + liph */
  /* ✅ The agency's own words, from the boss's copy doc (2026-08-16). What was
     here before was written for the prototype and read as fact. ⚠️ The ENGLISH
     of every string that came out of that doc is still mine — the doc is
     Arabic only — so it needs the same sign-off the Arabic has already had. */
  /* ⚠️ THE LAST TWO WORDS ARE BOUND WITH U+00A0 (2026-08-24), and it is
     the widow guard the agency asked for: `9th.png` is the desktop lede with
     «الياء.» alone on line three, ringed in red. `.dropcap-block`'s 20em
     measure is what fixes the wide desktops; this is what covers the widths
     where the measure never binds — measured at 1100, where the panel gives the
     lede only 437px and no cap can reach it, the last line went from 11% of
     the column to 19%. ⚠️ It is a REAL no-break space in the string, not an
     `&nbsp;` entity: this table is assigned with textContent, which would
     print the entity literally. */
  heroPara: {
    ar: "لِف وكالة تبدأ من الحرف الأوّل. لكل علامةٍ نقطة أصلٍ تُبنى منها وتعود إليها، \n\n  وعملنا هو العثور على تلك النقطة ومساعدتكم على الوصول من الألِف إلى الياء.",
    en: "liph is an agency that begins at the first letter. Every brand has an origin point it is built from and returns to, and our work is to find that point and help you get from A to Z.",
  },
  /* the dropcap letter is baked into the sprite; this is what screen
     readers get */
  dropLetter: { ar: "أ", en: "A" },
  /* The hero's two buttons. `ctaStart` is a scroll down the page, not a
     link off it, and it echoes the headline above it deliberately —
     نبدأ من حيث تبدأ الأشياء, so the way in is ابدأ من هنا.

     They replaced heroMeta1/2/3 (منذ ٢٠٢٦ · the place · the three services).
     ⚠️ The founding year is now stated NOWHERE on the site — about.html
     says ٢٠٢٤ in its own facts table, which contradicted this line for
     two weeks. Worth settling before it goes back anywhere. */
  ctaStart: { ar: "ابدأ من هنا", en: "Start here" },
  ctaContact: { ar: "تواصل معنا", en: "Get in touch" },
  btnWork: { ar: "كل الأعمال", en: "ALL WORK" },
  /* One line under the three services, inviting the way out (2026-08-23b).
     The ring is nine or three pieces of a 82-item archive, and nothing said
     so — «all work» named the destination without giving a reason to go. */
  svcInvite: {
    ar: "هذه نماذج فقط — الأرشيف كامل بانتظارك.",
    en: "A handful of samples — the full archive is one click away."
  },
  btnAbout: { ar: "تعرّف على ألِف", en: "Get to know Aliph" },

  /* services */
  svcBanner: { ar: "ماذا نقدم؟", en: "What we do?" },
  svc1: { ar: "تصميم جرافيكي", en: "Graphic Design" },
  svc2: { ar: "صناعة محتوى", en: "Media Production" },
  svc3: { ar: "حلول تقنية وبرمجية", en: "Tech & Software Solutions" },

  /* the example switcher under "what we do" */
  svcPrev: { ar: "الخدمة السابقة", en: "Previous service" },
  svcNext: { ar: "الخدمة التالية", en: "Next service" },
  svcList: { ar: "الخدمات", en: "Services" },
  reelPrev: { ar: "الوسيط السابق", en: "Previous item" },
  reelNext: { ar: "الوسيط التالي", en: "Next item" },

  /* why aliph — three editorial blocks, each carrying work in its holders */
  storyBanner: { ar: "لماذا ألِف؟", en: "Why Aliph?" },

  w1Title: { ar: "نبدأ بالسؤال، لا بالإجابة", en: "We begin with the question, not the answer." },
  /* Three paragraphs in the doc, kept as three keys rather than one joined
     string: the boss wrote the break between "why the point matters", "how we
     reach it" and "what that rules out", and running them together loses the
     argument's shape. Three sibling .why-para elements is what the CSS already
     expects — hence the `:last-child { margin-bottom: 0 }` rule. */
  w1ParaA: {
    ar: "لأنّ كل علامةٍ تبدأ من نقطة، ولأنّ هذه النقطة هي الأصعب في الإيجاد والأهم في البناء.",
    en: "Because every brand begins at a point, and that point is the hardest thing to find and the most important thing to build on.",
  },
  w1ParaB: {
    ar: "نحن لا نبدأ بالتصميم، بل نبدأ بالسؤال: من أنت؟ وماذا تريد أن تقول؟ من هذه الإجابة، تُبنى الهوية البصرية، وتُصاغ الصورة، ويُكتب النص، ويُصمَّم الموقع، كلٌّ في مكانه، وكلٌّ بخدمة الفكرة الواحدة.",
    en: "We don't begin with the design. We begin with the question: who are you, and what do you want to say? From that answer the identity is built, the image is shaped, the words are written and the site is designed — each in its place, and each in service of one idea.",
  },
  w1ParaC: {
    ar: "لا نقدّم حلولاً جاهزة، لأنّ لا علامتين تتشابهان في نقطة بدايتهما. نصغي أولاً، ثم نبني.",
    en: "We don't hand over ready-made solutions, because no two brands share a starting point. We listen first, then we build.",
  },
  w2Title: { ar: "نقاطٌ بحثنا عنها، وأعمالٌ بنيناها منها.", en: "Points we searched for, and work we built from them." },

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
  pfShots: { ar: "لقطات", en: "Screenshots" },
  pfAbout: { ar: "عن المشروع", en: "About this project" },
  pfClose: { ar: "إغلاق", en: "Close" },
  /* Was pfPreview/pfPreviewNote — "preview build, no data is collected", which
     described a sandboxed iframe around a mock. The projects are real and live
     now, so the button leaves for the actual site and the note under it is the
     address it leaves for. */
  pfVisit: { ar: "زيارة الموقع", en: "Visit the site" },
  cap1: { ar: "من موقع التصوير", en: "On location" },
  cap2: { ar: "خلف الكاميرا", en: "Behind the camera" },
  cap3: { ar: "تجهيز اللقطة", en: "Setting up the shot" },
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
  abP4: {
    ar: "من الحرف الأوّل إلى آخر تفصيل: نصمّم الهويّة وما يُطبع منها، ونصوّر ما تحتاجه لتظهر — صورًا وفيديو وريلز — ونبرمج المواقع والأنظمة التي تُشغّلها. ثلاث خدمات على الورق، لكنها في العمل خطّ واحد متّصل — وهذا هو الفرق.",
    en: "From the first letter to the last detail: we design the identity and everything printed from it, shoot what it needs in order to appear — stills, film and reels — and build the sites and systems that keep it running. Three services on paper — one continuous line in practice, and that is the whole difference.",
  },

  svcAboutBanner: { ar: "ماذا نقدّم؟", en: "What we offer" },
  abWhat: { ar: "ما نفعله", en: "What we do" },
  abWhy: { ar: "لماذا نحن", en: "Why us" },
  abDoes: { ar: "يشمل", en: "Includes" },
  /* Captions for the long read's five clippings (2026-08-23b). ⚠️ Each one
     describes WHAT IS IN ITS FRAME and nothing more. The three in the collage
     above had to be rewritten on 2026-08-23 because they described things that
     were never in them, which is the failure mode a caption invites. */
  abCap1: { ar: "من التصوير", en: "On the shoot" },
  abCap2: { ar: "تجهيز الكاميرا", en: "Setting the camera" },
  abCap3: { ar: "رفع اللقطة", en: "Rigging the shot" },
  abCap4: { ar: "مراجعة اللقطة", en: "Reviewing the frame" },
  abCap5: { ar: "في الموقع", en: "On location" },
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
    id: "tech", tag: "TECH & SOFTWARE SOLUTIONS", seed: "aliph-svc3",
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
  { id: "tech", ar: "حلول تقنية وبرمجية", en: "Tech & Software Solutions" },
];

/* The example switcher steps through these subcategories, not through
   projects. `desc` speaks about the category and subcategory together. */
const SUBCATS = {
  design: [
    {
      id: "logos", ar: "شعارات", en: "Logos", seed: "aliph-d1",
      desc: {
        ar: "الشعار نقطة البداية. نرسمه، نسلّمه بقواعد استعماله، ونختبره حيث سيعيش فعلاً: على لافتة، وعلى فنجان، وفي صورة بحجم ظفر الإبهام.",
        en: "The mark is the starting point. We draw it, hand it over with the rules for using it, and test it where it will actually live: on a sign, on a cup, and in a picture the size of a thumbnail."
      }
    },
    {
      id: "print", ar: "مطبوعات", en: "Printables", seed: "aliph-d2",
      desc: {
        ar: "نصنع المطبوع من أوله لآخره، تصميماً وطباعة.",
        en: "We make printed matter end to end — the design and the printing both."
      }
    },
    {
      /* ⚠️ Renamed from ملصقات / Posters on 2026-08-16 at the boss's
         instruction ("تبديل ملصقات ب إعلانات رقمية"). The id stays `posters`
         — it is the join key across CATS, PROJECTS[].cat and the markup, and
         renaming it breaks classification silently. Labels only. */
      id: "posters", ar: "إعلانات رقمية", en: "Digital Ads", seed: "aliph-d3",
      desc: {
        ar: "بين إعلانٍ يُرى وآخر يُتجاوَز، ثانية واحدة فقط. نصمّم لتلك الثانية: فالإعلان الذي لا يوقفك، لم يُصمَّم أصلاً.",
        en: "Between an ad that gets seen and one that gets scrolled past there is exactly one second. We design for that second: an ad that doesn't stop you was never designed at all."
      }
    },
  ],
  photo: [
    {
      id: "reels", ar: "ريلز", en: "Reels", seed: "aliph-p1",
      desc: {
        ar: "نعرف أن انتباه المشاهد ثمين ولا يُمنح بسهولة. لهذا نبدأ كل ريلز بلحظة تستحق التوقّف، ثم نبنيه بإيقاعٍ لا يترك فراغاً يُغري بالتمرير، وتعليقات متحرّكة تصل حتى لمن يشاهد بلا صوت.",
        en: "We know a viewer's attention is expensive and is not given away. So every reel opens on a moment worth stopping for, then runs at a pace that leaves no gap tempting enough to scroll through, with motion captions that reach whoever is watching without sound."
      }
    },
    {
      id: "video", ar: "فيديو أفقي", en: "Video", seed: "aliph-p2",
      desc: {
        /* ⚠️ "بما يخدم", not the doc's "بالية يخدم" — a typo in the source
           doc, corrected here and flagged to the agency. */
        ar: "من الفيديو المؤسسي والتعريفي، إلى توثيق الفعاليات، إلى الإعلانات التجارية والمحتوى الوثائقي. نصوّر بعدسات سينمائية وإضاءة تُبنى لكل مشهد، ونمنتج ونصحّح الألوان بما يخدم الاستخدام النهائي: عرض تقديمي، إعلان، أو أرشيف مؤسسي.",
        en: "From corporate and profile film to event coverage, commercials and documentary work. We shoot on cinema glass with lighting built for each scene, then edit and grade for the end use: a presentation, an advert, or a corporate archive."
      }
    },
    {
      id: "stills", ar: "صور ثابتة", en: "Stills", seed: "aliph-p3",
      desc: {
        /* ⚠️ The doc heads this paragraph «صناعة المحتوى», which is the SERVICE
           name, not a subcategory — but its three items map one-to-one onto
           the three photo subcategories and this one is entirely about stills
           ("تصوير المنتجات", "كل صورة"). Read as the stills copy; worth
           confirming with the agency. The doc's "للصورة،،" double comma is
           normalised to a colon. */
        ar: "من تصوير المنتجات، إلى التوثيق المؤسسي والفعاليات، إلى التصوير التجاري بمعايير الحملات الإعلانية. نضبط الإضاءة، والزاوية، بما يخدم الاستخدام النهائي للصورة: كتالوج، تقرير سنوي، أو حملة سوشيال ميديا. كل صورة تُصوَّر لغاية محدّدة، لا لتُضاف إلى الأرشيف فقط.",
        en: "From product photography to corporate and event documentation to commercial work shot to campaign standards. We set the light and the angle for what the picture is finally for: a catalogue, an annual report, or a social campaign. Every frame is shot for a specific purpose, not just to be added to the archive."
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
const R2 = "https://media.aliphcreative.com";
const MEDIA = [
  /* «حقك تعرف حقك» for مكاتب خدمات الرفاه الاجتماعي — القدس, imported
     2026-08-23 from 4500x5625 masters (resources/import_bts.py).
     ⚠️ img/design-newmat-27 and -28 on the bucket are two of these three at
     1280px, from the 2026-08-16 import; these supersede them and the old keys
     are referenced by nothing. */
  { f: "design-haqqak-1.webp", c: "design", r: 0.8, d: null },
  { f: "design-haqqak-2.webp", c: "design", r: 0.8, d: null },
  { f: "design-haqqak-3.webp", c: "design", r: 0.8, d: null },
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

/* ══════════ the software work ══════════
   Three real projects, all three live, all three built by the agency. This
   array replaced twelve invented ones on 2026-08-22 — the last fabricated
   content on the site (open question 14).

   ⚠️ Only `tech` entries carrying a `profile` are rendered, by renderLibrary.
   A design or photography project added here will not appear: that work comes
   from MEDIA and is shown as itself. This array exists because there is no
   photograph of a booking system.

   ⚠️ `url` is the live deployment and opens in a new tab. `shots` are real
   screenshots in assets/shots/, captured from those deployments — not seeds,
   not placeholders. Re-capture with resources/shoot.py if a site changes: a
   portfolio showing a screenshot of a page that no longer looks like that is
   worse than showing no screenshot at all. */
const PROJECTS = [
  {
    ar: "رتريت عودة الملكة", en: "Queen's Retreat", date: "2026-07", cat: "tech",
    desc: {
      ar: "موقع الرتريت ونظام التسجيل الذي يقف خلفه: استمارة، وتوزيع على المحطّات، وسقف لكل جلسة.",
      en: "The retreat's site and the registration system behind it: a form, station allocation, and a ceiling on every session."
    },
    profile: {
      kind: "site",
      url: "https://queensretreat.ceo-6c6.workers.dev",
      tagline: { ar: "موقع · نظام تسجيل · جدولة محطّات", en: "Website · Registration · Station scheduling" },
      body: {
        ar: "رتريت قيادي ليوم واحد بستّ محطّات، كل واحدة باسم مدرّبتها، وكل مشتركة تدور على ثلاث منها في أوقات محدّدة. الصفحة تحكي الرتريت، والاستمارة تفعل الباقي: تتحقّق من المدخلات، وتحسب ما تبقّى من المقاعد في كل محطّة وكل جولة، ثم تكتب الصفّ في جدول المنظّمات مباشرة. والمقاعد المتبقّية معروضة على الصفحة نفسها، لأنّ رتريتًا محدود العدد يجب أن يقول ذلك قبل التسجيل لا بعده.",
        en: "A one-day leadership retreat with six stations, each named for the woman running it, and every participant rotating through three of them at set times. The page tells the retreat's story; the form does the rest — it validates, works out how many seats are left in each station in each round, then writes the row straight into the organisers' sheet. The remaining seats are shown on the page itself, because a retreat with a hard limit should say so before you register, not after.",
      },
      shots: ["queens-retreat-1", "queens-retreat-2", "queens-retreat-3",
              "queens-retreat-4", "queens-retreat-5"],
    }
  },
  {
    ar: "دعوة افتتاح البيدر", en: "Al Baydar Opening", date: "2026-08", cat: "tech",
    desc: {
      ar: "بطاقة دعوة تعمل: عدٌّ تنازليّ للموعد، ورشتان تُختار إحداهما، واستمارة تحجز المقعد باسمٍ واحد.",
      en: "An invitation that works: a countdown to the evening, two workshops to pick between, and a form that holds a seat on one name."
    },
    profile: {
      kind: "site",
      url: "https://albaydaropening.aliphcreative.com",
      tagline: { ar: "دعوة · اختيار ورشة · تأكيد حضور", en: "Invitation · Workshop choice · RSVP" },
      body: {
        ar: "مساء واحد، وصفحة واحدة تحمله. المكان يُعرَّف قبل أن يُدعى إليه أحد، ثمّ العدّ التنازليّ يجعل الموعد شيئًا يقترب لا سطرًا مكتوبًا. الورشتان — تعبئة العطر مع Méjana، وزراعة الصبّار في الفخّار — معروضتان جنبًا إلى جنب لأنّ الاختيار بينهما هو القرار الوحيد المطلوب من الضيف، والاستمارة تحته لا تسأل إلّا عن الاسم؛ الهاتف وعدد المرافقين اختياريّان. وما إن يُسجَّل الاسم حتى تعرض الصفحة الموعد جاهزًا للإضافة إلى التقويم والمكان جاهزًا على الخريطة، لأنّ الدعوة التي لا تُوصِل إلى الباب لم تكتمل.",
        en: "One evening, and one page carrying it. The place introduces itself before anyone is invited into it, and the countdown turns the date into something approaching rather than a line of text. The two workshops — perfume-filling with Méjana, and planting a cactus in pottery — sit side by side because choosing between them is the only decision the guest is asked to make, and the form beneath asks for nothing but a name; phone and companions are optional. The moment the name is in, the page hands back the date ready for a calendar and the address ready for a map, because an invitation that does not get you to the door is unfinished.",
      },
      shots: ["al-baydar-1", "al-baydar-2", "al-baydar-3",
              "al-baydar-4", "al-baydar-5"],
    }
  },
  {
    ar: "سيكو سيكو — ليلة سينما", en: "Seeko Seeko — Movie Night", date: "2026-05", cat: "tech",
    desc: {
      ar: "صفحة واحدة لليلة سينمائيّة واحدة، مبنيّة حول فعلٍ واحد: احجز مقعدك.",
      en: "One page for one film night, built around a single action: book your seat."
    },
    profile: {
      kind: "site",
      url: "https://seekoseeko.ceo-6c6.workers.dev",
      tagline: { ar: "صفحة هبوط · حجز مقاعد · ملف واحد", en: "Landing page · Seat booking · One file" },
      body: {
        ar: "ليلة واحدة، ومكان واحد، وسعر واحد — فالصفحة كلّها فعل واحد. التاريخ والمكان والوقت والتذكرة في صفٍّ واحد أعلى الطيّة، والاستمارة تحتها مباشرةً بأربعة حقول لا أكثر. صُمِّمت للهاتف أوّلًا، لأنّ الرابط يصل عبر واتساب ويُفتح في الشارع.",
        en: "One night, one venue, one price — so the whole page is one action. Date, venue, time and ticket sit in a single row above the fold, with the form directly beneath it and four fields in it, no more. Built phone-first, because the link arrives over WhatsApp and gets opened in the street.",
      },
      shots: ["seeko-seeko-1", "seeko-seeko-2", "seeko-seeko-3", "seeko-seeko-4"],
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
   sprocket run repeats in lockstep, so the count here and FRAMES_PER_TILE in
   resources/cut_film_scan.py are the same number in two places.

   The frame slot is 0.87 wide for 1 tall, so these are the 3:2 photographs; a
   4:5 design would lose a third of itself to the crop, and a 9:16 reel would
   lose more. ⚠️ Making the slot hold a vertical item is a measured change to
   two CSS numbers, not a guess — the recipe is in HANDOFF.

   The `cap` field is gone. It held four invented project names, kept as "the
   shopping list for the real titles"; the real titles exist now and none of
   them belongs to these photographs, so an unused field of fiction was the
   only thing left to delete. Captions have not rendered since 2026-08-10. */
const FILM_FRAMES = [
  { src: "assets/media/pics-idk-category-28-dsc00020.webp", svc: "design" },
  { src: "assets/media/pics-Interactive-37-dsc03223.webp", svc: "photo" },
  { src: "assets/media/pics-food-21-dsc03454.webp", svc: "photo" },
  { src: "assets/media/pics-public-services-49-img.webp", svc: "tech" },
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
    /* ⚠️ U+FE0E after the asterisk is the TEXT presentation selector, and it
       is load-bearing. U+2733 on its own is rendered as a colour emoji by iOS
       and by several Androids — a green rounded sprite in a footer that is ink
       and cream and nothing else. Do not drop it. */
    el.innerHTML = `<span data-i18n="cBand"></span><i class="cb-star">✳︎</i>`;
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

  serviceRings.build();
  renderLibrary();
  renderServiceSections();
  projectSheet.refresh();
  /* ⚠️ The preview module ran its own refresh() once, when it was DEFINED —
     which is before the carousel triples its slides and before renderLibrary
     paints a single tile. So it only ever held the eight originals, and the
     centred slide is almost always a clone: nothing could play, and adding
     data-preview to a slide did nothing at all. It has to be re-scanned after
     whatever built the DOM, and this is that place — it also runs on every
     language switch, which re-renders the library from scratch. */
  previews.refresh();
  rebuildLoops();
  filmLoop.rebuild();
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

  /* ⚠️ The contact button is a SAME-PAGE anchor, so unlike the three nav links
     it does not navigate — nothing tears the overlay down behind it, and the
     panel would sit over the footer it had just scrolled to. Re-clicking the
     burger is the one path that runs the whole close (the exit tween, the
     .nav-closing hand-off, the bar re-sync), so it is re-used rather than
     re-implemented. */
  overlay.querySelector(".nav-cta")?.addEventListener("click", () => {
    if (open) menuBtn.click();
  });

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

/* ══════════ what we do — the service rings ══════════
   Three rings, one per service, stacked in a window that slides. Each ring
   turns continuously; the item facing the viewer grows and its line appears
   under the ring; clicking it opens that piece on the work page.

   ⚠️ THE PICTURES ARE LOCAL, and that is a rule, not an accident. Everything
   the home page paints comes out of assets/, never R2 (open question 13) —
   which is the only reason this page stayed up when r2.dev went dark and took
   the work page with it. The reels' POSTERS are here for the same reason; only
   a reel that actually plays is fetched from R2.

   ⚠️ Ratios come from MEDIA, not from the file. `r` is read off each original
   by the generator, so a ring item is cut to the shape of the thing inside it
   without this module ever loading an image to measure it — which it could not
   do anyway before laying the ring out. */
const RINGS = {
  /* All nine design pieces; the agency filed every one as a digital ad
     (2026-08-22), so they all take the `posters` line. */
  /* ⚠️ NINE, and the three «حقك تعرف حقك» ads REPLACED three of the
     Grillit/Shawarma run rather than joining it (2026-08-23b). The ring is a
     curated sample, not a feed: nine is what the radius, the item area and the
     spacing were derived for, and a tenth item makes every one of them
     smaller. The three that went are the second of each pair — veal-2, mix-2,
     habash-2 — so one of every shawarma flavour is still on the ring and no
     client lost their whole showing.
     ⚠️ These paint from assets/, not from the bucket. resources/ring_media.py
     is what puts a new piece there; a key on R2 alone will 404. */
  design: [
    { f: "design-grillit-1.webp", sub: "posters" },
    { f: "design-haqqak-1.webp", sub: "posters" },
    { f: "design-grillit-2.webp", sub: "posters" },
    { f: "design-shawarma-mix-1.webp", sub: "posters" },
    { f: "design-haqqak-2.webp", sub: "posters" },
    { f: "design-shawarma-habash-1.webp", sub: "posters" },
    { f: "design-grillit-3.webp", sub: "posters" },
    { f: "design-haqqak-3.webp", sub: "posters" },
    { f: "design-shawarma-veal-1.webp", sub: "posters" },
  ],
  /* Reels and stills alternate on purpose: a 9:16 next to a 3:2 is what makes
     the ring read as work of different shapes rather than a row of cards. */
  photo: [
    { f: "reels-alif-tuktuk.webp", sub: "reels", open: "reels-alif-tuktuk.mp4" },
    { f: "pics-food-17-dsc00763.webp", sub: "stills" },
    { f: "reels-einar-edited.webp", sub: "reels", open: "reels-einar-edited.mp4" },
    { f: "pics-Interactive-37-dsc03223.webp", sub: "stills" },
    { f: "reels-connect-edited.webp", sub: "reels", open: "reels-connect-edited.mp4" },
    { f: "pics-Queen-retreat-52-copy-of-0c2a0144.webp", sub: "stills" },
    { f: "reels-child-section-final.webp", sub: "reels", open: "reels-child-section-final.mp4" },
    { f: "pics-official-visits-43-dsc08794.webp", sub: "stills" },
  ],
  /* The software work has no photograph of itself. It used to borrow the
     profile sheet's screenshots — a 1.6:1 crop of a page, which at ring size
     is a grey rectangle with unreadable type on it and says nothing about
     whose page it is. It takes the CLIENT'S MARK instead (2026-08-23b), the
     same 640x640 logo-on-brand-colour tile derive_shots.py already cuts for
     the profile sheet's cover. A click still opens the sheet, which is the
     only place that work can actually be shown.
     ⚠️ `sub: "landing"` on all three, and that is the agency's instruction
     rather than a shortcut: they are all landing pages, so the line under the
     ring says the same thing for each and stops pretending three one-page
     sites are three different services. See line(). */
  tech: [
    /* ⚠️ `shot` is what the RING shows and `full` is what the LIGHTBOX opens,
       and on this ring alone they are different pictures. The mark is the only
       thing that reads at ring size — a 1.6:1 crop of a page is a grey
       rectangle — but a 640px logo tile blown up full screen says nothing at
       all, and since 2026-08-24 a click opens the overlay rather than the
       project's profile. So the overlay gets the site itself: the same
       1600x1000 plate the profile sheet shows, which derive_shots.py already
       cuts. This is the same split `data-full` already makes on the archive's
       thumbnails — the tile is the small file, the overlay is the real one. */
    { shot: "queens-retreat-cover", full: "queens-retreat-1", project: 0, sub: "landing", r: 1 },
    { shot: "al-baydar-cover", full: "al-baydar-1", project: 1, sub: "landing", r: 1 },
    { shot: "seeko-seeko-cover", full: "seeko-seeko-1", project: 2, sub: "landing", r: 1 },
  ],
};

/* The mark each ring turns around — one per service, the still thing the work
   orbits.

   ⚠️ PHOTOGRAPHS, not pictograms, for all three since 2026-08-23b. The agency
   asked for cut-outs of their own people instead of drawn icons and supplied
   the cameraman first; the designer and the developer followed in the evening
   round. Each is a person WITH THEIR TOOL, which is the whole reason the set
   reads at 90px: a man in a chair from behind is any office worker alive, and
   the monitor beside him is the only thing that says which one. See
   resources/cut_people_marks.py, which puts the designer's monitor back after
   segmentation for exactly that reason.

   ⚠️ The designer's and the developer's source frames are AI STOCK, and the
   agency was told so and asked for them anyway. The giveaway in both is
   lettering: gibberish hand-writing on the developer's whiteboard, and code on
   both screens that is not code. The whiteboard leaves with the background
   because it is behind him; the screens survive at ~60px, where they read as
   texture. Replace either the day the agency photographs their own two people
   — it is one run of the script and no other change. */
const RING_MARKS = {
  design: { img: "assets/marks/mark-design.webp" },
  photo: { img: "assets/marks/mark-photo.webp" },
  tech: { img: "assets/marks/mark-tech.webp" },
};

/* Which ring is showing. Read by nothing else today, but it is the one
   name for "the service being looked at" and the chat widget asked for it
   once already. */
let currentService = "design";

const serviceRings = (() => {
  const reel = document.getElementById("ringReel");
  if (!reel) return { build() { }, paint() { }, resize() { } };

  const win = document.getElementById("ringWindow");
  const nameEl = document.getElementById("svcName");
  const descEl = document.getElementById("ringDesc");
  const listEl = document.getElementById("svcList");

  const ORDER = SERVICES.map((s) => s.id);
  /* ms for one full revolution, PER SERVICE (2026-08-24). It was one constant
     for all three; the agency asked for صناعة محتوى specifically to be slowed
     — that ring is the one carrying 9:16 reels and 3:2 stills, so an item
     arrives at the front, changes the line under the ring and leaves again
     before it can be read. ⚠️ It is also the dwell of a reel preview: the
     front item plays (see T5 / previews.syncRing), and at 26s a nine-item ring
     gives each piece 2.9s of screen. 42s gives the photo ring's eight items
     5.25s each, which is a preview rather than a flash.
     ⚠️ A full revolution is also what hands on to the next service, so this
     number is how long صناعة محتوى holds the section. */
  const TURNS = { design: 26000, photo: 42000, tech: 26000 };
  const TURN_DEFAULT = 26000;
  const GLIDE = 620;                // ms to bring a clicked item to the front
  let at = 0;                       // which service
  let spin = 0;                     // degrees
  let turned = 0;                   // degrees since the last service change
  let held = false;                 // a click stops the service auto-advance
  let hover = false;
  let glide = null;                 // { from, to, t0 } while an item travels
  let raf = 0, last = 0;
  let stages = [];

  /* ⚠️ Hover-to-pause is gated on a real pointer. On touch `pointerenter`
     fires once and `pointerleave` never does, so an ungated version stops the
     ring for the rest of the visit on the first tap. The carousel is gated the
     same way for the same reason. */
  const canHover = window.matchMedia("(hover: hover)").matches;

  /* An item's ratio: MEDIA is the record for anything out of the archive, and
     a ring entry may carry its own for a screenshot that is not in it. */
  const ratioOf = (item) => {
    if (item.r) return item.r;
    const m = MEDIA.find((x) => x.f === item.f || x.p === item.f);
    return (m && m.r) || 1;
  };

  const srcOf = (item) =>
    item.shot ? "assets/shots/" + item.shot + ".webp"
              : "assets/media/" + item.f;

  /* ══════ the band is BENT, and every number below exists for that ══════
     Each piece of work is cut into SLATS — vertical strips, each one flat, each
     one placed a little further round the cylinder than the last. Ten facets
     across a piece is a curve at any size a browser can draw, and it is what
     the agency asked for on 2026-08-23b: "imagine the outer face of a normal
     ring with the media being literally bent on the outer face".

     🔴 THIS REPLACES BILLBOARDING, and the reversal is deliberate. The build
     of 2026-08-23 morning undid the ring's spin on every item so the far half
     stayed square to the eye and readable. The agency looked at it and asked
     for the opposite: a real ring, where the far half turns away and you are
     looking at the BACK of the work. So an item is now mounted tangent to the
     cylinder and nothing is undone — which means the far half shows through
     the card, mirrored. That is the agency's choice of 2026-08-23b, made with
     the consequence for Arabic type stated. Do not "fix" it back.

     ⚠️ Ten is a build-time constant because it is DOM. The angle between two
     slats is not — it falls out of the item's width and the radius, both of
     which move with the window, so layout() writes it. */
  const SLATS = 10;

  /* Items are sized to a constant AREA, not a constant width or height. A 9:16
     reel beside a 3:2 photograph looks like two different sizes either way —
     equal area is the one that makes neither of them dominate, which is what
     "they don't have to be the same size" has to mean if the ring is to read
     as one composition. */
  /* ⚠️ The share of the window grows as the ring EMPTIES. A flat 0.34 was
     tuned on the nine-piece design ring; the tech ring holds three, and three
     items of the same area on the same orbit read as crumbs going round a
     wheel — measured, its logo tiles came out 77px across while the mark they
     circled was 100px, so the still thing at the centre was bigger than the
     work. 0.30 + 0.36/n gives back the old 0.34 at nine and 0.42 at three. */
  function sizes(items, h) {
    const n = Math.max(3, items.length);
    const area = Math.pow(h * (0.30 + 0.36 / n), 2);
    return items.map((it) => {
      const r = ratioOf(it);
      const ih = Math.sqrt(area / r);
      return { w: ih * r, h: ih, r };
    });
  }

  /* Wide enough that neighbours never touch.
     ⚠️ Derived, not a fudge factor. Two neighbours are 360/n apart, so the
     chord between their centres is 2r*sin(pi/n); asking that to be at least
     1.12 widths gives the radius directly, and it stays right for a ring of
     three as well as one of nine. ⚠️ 1.12 rather than the 1.18 the flat
     version used: a bent item follows the cylinder instead of cutting across
     it, so it takes an ARC of 2*asin(w/2r) rather than a chord of w, and the
     gap between two neighbours is wider on the surface than the flat maths
     said. Winding them a little closer keeps the band reading as a band. */
  /* ⚠️ The floor is the MARK, not a constant. It used to be a flat 150px,
     which is meaningless in both directions: on a nine-item ring the chord
     rule always asks for more, so it never bound; on a three-item ring it
     always bound, and forced an orbit more than twice as wide as the chord
     rule wanted — which the window fit then shrank back down, taking the items
     with it. What the radius actually has to clear is the thing at the centre,
     so that is what it is measured against. */
  function radius(dims, n, markW) {
    const widest = dims.reduce((a, d) => Math.max(a, d.w), 0);
    const chord = (widest * 1.12) / (2 * Math.sin(Math.PI / Math.max(2, n)));
    return Math.max(markW / 2 + widest * 0.55, chord);
  }

  function build() {
    reel.innerHTML = "";
    stages = ORDER.map((id) => {
      const items = RINGS[id] || [];
      const stage = document.createElement("div");
      stage.className = "ring-stage";
      stage.dataset.service = id;

      const ring = document.createElement("div");
      ring.className = "ring";

      /* ⚠️ INSIDE the ring, so the 3D context depth-sorts it against the work.
         Outside it, near and far halves both painted over it. */
      const m = RING_MARKS[id] || {};
      const mark = document.createElement("div");
      mark.className = "ring-mark" + (m.img ? " is-photo" : "");
      /* ⚠️ NOT lazy, and the three of them together are 96 KB. A lazy image
         is loaded on intersection, and this one lives inside a preserve-3d
         subtree that is rotated on two axes and, for two of the three rings,
         translated a whole window off screen by .ring-reel. That is a fragile
         thing to ask an intersection test about — measured in a pane that was
         not compositing, all three marks sat at complete:false and currentSrc
         "" forever, so the ring turned around a hole. The mark is the fixed
         point the whole section is built on; it does not get deferred. */
      mark.innerHTML = m.img
        ? '<img src="' + m.img + '" alt="" decoding="async">'
        : (m.svg || "");
      ring.appendChild(mark);

      items.forEach((it, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ring-item";
        b.style.setProperty("--a", (i * (360 / items.length)) + "deg");
        /* the centre slat's index, so a slat's angle is (k - kc) * dth */
        b.style.setProperty("--kc", String((SLATS - 1) / 2));
        /* the stylesheet's sprite maths reads this rather than repeating 10 */
        b.style.setProperty("--n", String(SLATS));
        b.dataset.i = String(i);
        b.dataset.service = id;
        /* ══════ what the LIGHTBOX shows for this piece (2026-08-24) ══════
           A click on the ring used to bring the piece round and then, on a
           second click, leave for the work page. The agency's instruction of
           2026-08-24 is that a click opens the CATALOG instead — the same
           overlay, stepping through the ring's own items as a group, that
           every other media surface on the site opens.

           🔴 The lightbox cannot find this item's picture by query. An item is
           ten `.ring-slat` spans carrying the same URL as a BACKGROUND, not an
           `<img>` — that is what makes the bend cost one decode — so
           `node.querySelector("img")` returns null here and always will. The
           node states its own contents instead, which is the same `data-full`
           contract the archive's thumbnails already use for the file behind
           the tile. */
        b.dataset.full = it.full ? "assets/shots/" + it.full + ".webp" : srcOf(it);
        /* A reel carries its film as well, and that one attribute does two
           jobs: the previews module plays it in place on the front item (the
           agency's "the ring's reels should play"), and the lightbox opens it
           at the frame the preview had reached. */
        const film = it.open && /\.mp4$/i.test(it.open) ? it.open : "";
        if (film) b.dataset.preview = R2 + "/video/" + film;
        const rec = MEDIA.find((x) => x.f === (it.open || it.f) || x.p === it.f);
        if (rec && rec.d) b.dataset.date = fmtDate(rec.d);

        /* 🔴 SLATS, not one <img>. Each is the same picture with its own
           slice showing, by the ordinary sprite formula: the background is
           laid out SLATS times as wide as one slat — which is exactly the
           item's width — and stepped across by k/(SLATS-1) of the overflow.
           ⚠️ background-origin/clip: border-box, because the two end slats
           carry the band's edge and a border would otherwise shrink their
           positioning area and shift their slice by a pixel against the
           eight that have none. */
        const src = srcOf(it);
        let html = "";
        for (let k = 0; k < SLATS; k++) {
          html += '<span class="ring-slat" style="--k:' + k +
                  ';background-image:url(&quot;' + src + '&quot;)"></span>';
        }
        b.innerHTML = html;

        /* ══════ HOVER BRINGS A PIECE TO THE FRONT — DESKTOP ONLY ══════
           "if u hover upon one item it moves to the center (the exact logic of
           clicking) only for pc, since on phone u can only click"
           (2026-08-24). So it is literally the click's own glide: pick(), the
           same function the click used to call.

           ⚠️ Gated on (hover: hover), like the pause it replaces. On touch
           `pointerenter` fires once on the first tap and `pointerleave` never
           fires at all — an ungated version would pick an item and, because
           tick() holds still while something is picked, stop the ring for the
           rest of the visit.

           ⚠️ pointerleave RELEASES the pick, and that is not tidiness either:
           tick() returns early while `picked >= 0`, so a pick that outlived
           the pointer would be a permanently stopped ring. Leaving one item
           for another fires leave-then-enter, so the release never eats the
           next pick. */
        if (canHover) {
          b.addEventListener("pointerenter", () => {
            hover = true;
            /* only the ring actually on screen may be picked — the other two
               stages are translated a whole window away, not removed */
            if (stages[at] && stages[at].id === id) pick(i);
          });
          b.addEventListener("pointerleave", () => {
            hover = false;
            clearPick();
            paint();
          });
        }
        ring.appendChild(b);
      });
      stage.appendChild(ring);
      reel.appendChild(stage);
      return { id, stage, ring, items, front: -1, picked: -1, lift: 0, liftNow: 0,
               nodes: Array.from(ring.querySelectorAll(".ring-item")) };
    });
    buildList();
    layout();
    paint();
  }

  /* The desktop control. Derived from SERVICES like every other list of them:
     typed copies of these names have gone stale at two renames already. */
  function buildList() {
    if (!listEl) return;
    listEl.setAttribute("aria-label", I18N.svcList[lang]);
    listEl.innerHTML = "";
    ORDER.forEach((id, n) => {
      const cat = CATS.find((c) => c.id === id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "svc-opt";
      b.dataset.service = id;
      b.innerHTML = "<span></span>";
      b.firstChild.textContent = cat ? cat[lang] : id;
      b.addEventListener("click", () => go(n, true));
      listEl.appendChild(b);
    });
  }

  /* The stage's perspective, read from the page rather than repeated here —
     the fit below depends on it and a second copy of the number would go stale
     the first time the CSS changed. */
  function perspectiveOf(stage) {
    const v = parseFloat(getComputedStyle(stage).perspective);
    return Number.isFinite(v) && v > 0 ? v : 1500;
  }

  function layout() {
    const box = win.getBoundingClientRect();
    const h = box.height || 380;
    const W = box.width || 640;
    stages.forEach((s) => {
      if (!s.items.length) return;
      const dims = sizes(s.items, h);
      /* the mark's UNTRANSFORMED width — its rect would be the 3D-projected
         one, which is not the number the orbit has to clear */
      const markEl = s.ring.querySelector(".ring-mark");
      const markW = markEl ? (parseFloat(getComputedStyle(markEl).width) || 0) : 0;
      let rad = radius(dims, s.items.length, markW);
      const tilt = Math.abs(parseFloat(
        getComputedStyle(s.ring).getPropertyValue("--tilt")) || 22) * Math.PI / 180;
      const P = perspectiveOf(s.stage);

      /* 🔴 FIT IN BOTH AXES, AND THROUGH THE PERSPECTIVE. This is the fix for
         "it's cut down from the bottom, also sometimes the top" (2026-08-23b),
         and the reason the old version only ever checked the width is that the
         old ring had nothing to check: every item was billboarded upright at
         z on a plane whose tilt each item undid, so an item's vertical extent
         was just its own height. A real ring is different in two ways at once.

           · The BAND itself rises and falls. rotateX(tilt) maps a point at
             depth z to y = -z·sin(tilt), so the far half climbs and the near
             half drops by rad·sin(tilt) — at 22° and a 300px radius that is
             ±112px of travel that the item's own height knows nothing about.

           · The NEAR half is magnified. It sits at z = +rad·cos(tilt) toward
             the camera, so everything there is drawn P/(P-z) larger — about
             1.25x at the numbers above. The item that clipped was always the
             one at the front, which is exactly the one being enlarged.

         So the half-extents are computed for the worst position an item can
         reach, magnified, and the whole ring is scaled by whichever axis binds.
         A 1.03 bleed on the width is deliberate — a ring that stops dead inside
         its frame reads as a diagram — but the HEIGHT gets no bleed at all,
         because a poster sliced along the bottom edge is what was complained
         about. */
      const widest = dims.reduce((a, d) => Math.max(a, d.w), 0);
      const tallest = dims.reduce((a, d) => Math.max(a, d.h), 0);
      const LIFT = 0.13;                    /* the picked item's proudness, of rad */
      const fitFor = (k) => {
        const r = rad * k;
        const near = r * (1 + LIFT) * Math.cos(tilt);
        const mag = P > near + 1 ? P / (P - near) : 8;
        const halfW = (r * (1 + LIFT) + widest * k * 0.5) * mag;
        const halfH = (r * (1 + LIFT) * Math.sin(tilt)
                       + tallest * k * 0.5 * Math.cos(tilt)) * mag;
        /* ⚠️ ASYMMETRIC ON PURPOSE. The sides get a 1.14 bleed and the top and
           bottom get none, because those are two different readings. A poster
           running under the left or right edge of the band says the orbit
           carries on past the frame, which is what the section is for; a
           poster sliced along the BOTTOM edge is the fault the agency
           reported. On a 390px phone nine items cannot be both large and
           entirely inside — nine widths of 1.12 spacing need a diameter of
           3.2w before perspective, so something has to give, and it is the
           sides. */
        return { halfW, halfH, ok: halfW * 2 <= W * 1.14 && halfH * 2 <= h };
      };
      /* The magnification makes this non-linear, so it is solved rather than
         divided: ten halvings of the interval land inside a pixel. */
      let lo = 0.12, hi = 1;
      if (!fitFor(1).ok) {
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (fitFor(mid).ok) lo = mid; else hi = mid;
        }
      } else {
        lo = 1;
      }
      const fit = lo;
      rad *= fit;
      s.lift = rad * LIFT;

      s.nodes.forEach((n, i) => {
        const w = dims[i].w * fit;
        const sw = w / SLATS;
        /* The angle one slat subtends at the axis — a chord of sw on a circle
           of radius rad. asin, not sw/rad: at the sizes here the two differ by
           under a degree, but the apothem below is derived from the same angle
           and a mismatch there opens a seam between every pair of slats. */
        const dth = 2 * Math.asin(Math.min(0.9999, sw / (2 * rad)));
        n.style.setProperty("--w", w.toFixed(2) + "px");
        n.style.setProperty("--h", (dims[i].h * fit).toFixed(2) + "px");
        n.style.setProperty("--sw", sw.toFixed(3) + "px");
        n.style.setProperty("--dth", (dth * 180 / Math.PI).toFixed(4) + "deg");
        /* ⚠️ The APOTHEM, not the radius. A slat is a flat chord across the
           arc it covers; putting its centre on the circle pushes both of its
           ends outside it, and ten of those make a cog rather than a ring.
           rad·cos(dth/2) puts the slat's ENDS on the circle, which is what
           makes two neighbours meet edge to edge. */
        n.style.setProperty("--apo", (rad * Math.cos(dth / 2)).toFixed(2) + "px");
      });
    });
  }

  /* Which item faces the viewer, and how the rest fall away from it. Both come
     out of one number — the item's angle from the front — so they cannot drift
     apart. */
  /* ⚠️ This runs only when the FRONT ITEM CHANGES, never per frame, and the
     difference is not academic. Writing --o and --s on every item every frame
     is ~60 style writes a frame for a nine-item ring, all of them setting the
     value the element already had. It also fought the 0.45s transition these
     properties carry — a per-frame write restarts the interpolation before it
     can run, so paying that cost bought a WORSE-looking ring than not paying
     it. One item enters the front zone at a time, so recomputing on that
     boundary gives the transition the two keyframes it needs. */
  function front(s) {
    const step = 360 / s.items.length;
    let best = 0, bestD = 1e9;
    const away = s.nodes.map((n, i) => {
      let d = (i * step + spin) % 360;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      const a = Math.abs(d);
      if (a < bestD) { bestD = a; best = i; }
      return a;
    });
    if (best === s.front) return best;
    s.front = best;
    /* ⚠️ /600, not /240. At /240 the far side of the ring reached 0.25 and the
       work there was barely on the page; the agency asked on 2026-08-23 for it
       to stay visible all the way round, so the floor is 0.70 at half a turn.
       Depth is carried by perspective and by the front item's scale, which do
       not need the fade to do their job. */
    /* 🔴 THE FRONT ITEM IS LIFTED OFF THE BAND, not scaled up, and on a real
       ring that is the only move available. A scale would have to be applied
       to a box whose children are placed by translateZ, so it would drag the
       whole slice of cylinder off the circle with it — and any transform or
       opacity on a wrapper between .ring and a slat forces transform-style
       back to flat and collapses the bend. So the item stands PROUD instead:
       its slats push out along the same normal they already sit on, like a
       stone set above the band. Perspective does the rest — it is nearer the
       eye, so it is drawn larger, which is what the old scale was imitating.
       ⚠️ opacity is set on the ITEM and read by each slat, never applied to
       the item itself, for the same flattening reason. */
    s.nodes.forEach((n, i) => {
      n.style.setProperty("--o", (1 - Math.min(away[i], 180) / 600).toFixed(3));
      /* only the front item is ever proud; everything else lies on the band */
      if (i !== best) n.style.setProperty("--lift", "0px");
      n.classList.toggle("is-front", i === best);
    });
    /* ⚠️ The new front starts flat and RISES, rather than appearing already
       lifted. paint() eases it — see liftTarget below. */
    s.liftNow = 0;
    /* ══════ the front item's reel plays (2026-08-24) ══════
       ⚠️ AN EVENT, not a call into `previews`. That module is defined several
       hundred lines below this one, so a direct reference here is in the
       temporal dead zone at build() time — and `typeof` does NOT protect
       against a TDZ `const`, it throws like any other read. The event is also
       the honest shape: the ring knows what is at the front and nothing about
       video; previews knows about video and nothing about rings. */
    reel.dispatchEvent(new CustomEvent("ringfront", { bubbles: true }));
    return best;
  }

  /* ⚠️ THE SUBSECTION WINS, and the order of these two branches is the whole
     of "unify their descriptions since they're all landing pages"
     (2026-08-23b). A tech entry carries both a `project` and a `sub` now: the
     project is where a click goes, the subsection is what the line says. Read
     the project first and the three sites get three different lines again. */
  function line(s, i) {
    const it = s.items[i];
    if (!it) return "";
    const sub = (SUBCATS[s.id] || []).find((x) => x.id === it.sub);
    if (sub) return sub.desc[lang];
    if (it.project !== undefined) {
      const p = PROJECTS[it.project];
      return p ? p.desc[lang] : "";
    }
    return "";
  }

  function paint() {
    const s = stages[at];
    if (!s) return;
    reel.style.setProperty("--stage", String(at));
    const svc = SERVICES.find((x) => x.id === s.id);
    const cat = CATS.find((c) => c.id === s.id);
    if (nameEl && cat) nameEl.textContent = cat[lang];
    if (svc) nameEl.dataset.service = svc.id;
    if (listEl) {
      listEl.querySelectorAll(".svc-opt").forEach((b) => {
        const on = b.dataset.service === s.id;
        b.classList.toggle("is-on", on);
        /* the underline is the only thing that says "this one" — say it to a
           screen reader as well, since the heading it replaces is hidden here */
        b.setAttribute("aria-current", on ? "true" : "false");
      });
    }
    s.ring.style.setProperty("--spin", spin.toFixed(2) + "deg");
    /* front() returns early unless the facing item actually changed, so
       the line under the ring is only rewritten when it has something
       different to say. */
    const was = s.front;
    const i = front(s);
    if (descEl && i !== was) descEl.textContent = line(s, i);
    /* 🔴 The front item stands PROUD of the band, and the amount is eased HERE
       rather than by a CSS transition. A transition on a slat's transform also
       catches the flat frame layout() leaves behind and turns it into a
       half-second unfold on load and on every resize — see .ring-slat. This is
       the same rule --spin and the glide already follow: what layout writes,
       rAF eases; CSS transitions only touch what layout never sets. */
    const target = (s.lift || 0) * (i === s.picked ? 1 : 0.45);
    s.liftNow = prefersReduced ? target
              : s.liftNow + (target - s.liftNow) * 0.16;
    if (Math.abs(target - s.liftNow) < 0.2) s.liftNow = target;
    if (s.nodes[i]) s.nodes[i].style.setProperty("--lift", s.liftNow.toFixed(1) + "px");
    /* Only the ring on screen is worth turning. */
    stages.forEach((x, n) => x.stage.setAttribute("aria-hidden", String(n !== at)));
  }

  function go(next, byHand) {
    at = ((next % stages.length) + stages.length) % stages.length;
    currentService = stages[at].id;
    turned = 0;
    glide = null;
    if (byHand) held = true;
    clearPick();
    paint();
  }

  function clearPick() {
    stages.forEach((s) => {
      if (s.picked < 0) return;
      s.nodes[s.picked].classList.remove("is-picked");
      s.picked = -1;
      s.front = -1;             /* force front() to rewrite the lifts */
    });
  }

  /* ══════════ bringing a piece round ══════════
     Bringing it round is an eased change to `spin`, driven by the same rAF
     that turns the ring, NOT a CSS transition: the transform depends on
     --spin and is rewritten every frame, so a transition on it would smear.

     🔴 THE TWO-STEP IS GONE (2026-08-24). It was: first click glides the piece
     to the front, second click on the piece already there leaves for the work
     page. The agency removed the destination — "a click opens the catalog, not
     the work page" — so there is no second step left to gate, and `pick()` is
     now driven by HOVER on a desktop (see build()) rather than by a click.
     ⚠️ Which means `picked` no longer decides where a click goes. All it does
     now is hold the ring still and stand the piece proud of the band while a
     pointer is resting on it. */
  function pickAngle(s, i) {
    const step = 360 / s.items.length;
    let d = -(i * step) - spin;
    d = ((d % 360) + 540) % 360 - 180;   /* the short way round */
    return spin + d;
  }

  function pick(i) {
    const s = stages[at];
    if (!s || !s.nodes[i] || s.picked === i) return;
    clearPick();
    s.picked = i;
    s.nodes[i].classList.add("is-picked");
    s.front = -1;
    const to = pickAngle(s, i);
    /* ⚠️ Under prefers-reduced-motion nothing drives a frame — start() returns
       without arming the rAF — so a glide would never arrive at all. It jumps
       instead. */
    if (prefersReduced) {
      spin = ((to % 360) + 360) % 360;
      glide = null;
    } else {
      glide = { from: spin, to: to, t0: 0 };
      start();
    }
    paint();
  }

  /* A click is the lightbox's now — it binds itself, delegated on the
     document, and `.ring-item` is in its OPENS list. All this handler does is
     end the service auto-advance for the visit, which is the rule of
     2026-08-23: "unless something is clicked". */
  reel.addEventListener("click", (e) => {
    if (!e.target.closest(".ring-item")) return;
    held = true;
  });

  /* One rAF for all three rings, and only the visible one advances. */
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(t - last, 60) : 0;
    last = t;
    if (glide) {
      if (!glide.t0) glide.t0 = t;
      const k = Math.min(1, (t - glide.t0) / GLIDE);
      const e = 1 - Math.pow(1 - k, 3);          /* ease out */
      spin = glide.from + (glide.to - glide.from) * e;
      if (k >= 1) { glide = null; spin = ((spin % 360) + 360) % 360; }
      paint();
      return;
    }
    /* A picked item waits where it was put: the second click has to land on
       the same piece, and a ring that carried it away would make that a game
       of timing. */
    /* ⚠️ `lb-open` is in here since 2026-08-24. A click on a piece now opens
       the lightbox over the section, and a ring that carried on turning behind
       the overlay would hand the front item — and therefore the playing reel —
       on to the next piece while the visitor is looking at this one. */
    if (hover || document.hidden || stages[at].picked >= 0
        || document.body.classList.contains("lb-open")) return;
    const d = (dt / (TURNS[stages[at].id] || TURN_DEFAULT)) * 360;
    spin += d;
    turned += d;
    if (spin >= 360) spin -= 360;
    /* "services should auto circle every full rotation of the ring unless
       something is clicked" — so a full turn hands on to the next service, and
       the first click anywhere in the section ends that for the visit. */
    if (!held && turned >= 360) { go(at + 1, false); return; }
    paint();
  }

  function start() {
    if (prefersReduced || raf) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  document.getElementById("svcNext")
    ?.addEventListener("click", () => go(at + 1, true));
  document.getElementById("svcPrev")
    ?.addEventListener("click", () => go(at - 1, true));

  /* Off screen it does not turn: this is three rings of decoded image and a
     compositing cost, several screens below the fold. */
  if (window.IntersectionObserver) {
    new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop()),
      { rootMargin: "120px" }).observe(win);
  } else {
    start();
  }

  return {
    build,
    paint,
    /* Sizes are pixels off the window's measured box, so they are wrong the
       moment it changes. */
    resize() { layout(); paint(); },
    /* Language switch: the name, the list and the line are the text in here. */
    setService(id) {
      const n = ORDER.indexOf(id);
      if (n >= 0) go(n, true);
    },
  };
})();

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
  /* ⚠️ `.film-frame` is here so a frame in the hero strip opens like every
     other piece of media (2026-08-16). It matters more here than elsewhere:
     the strip lays an emulsion wash over its frames so they read as exposed
     onto the stock, and the lightbox is where that comes off and the work is
     seen in its own colours. */
  /* ⚠️ `:not([data-project])` is load-bearing and was NOT always needed. A
     project tile is a `.lib-grid .tile` like any other, and it used to fall
     through here on its own because its cover was a placeholder data URI that
     `itemOf` could not resolve. derive_shots.py gave every project a real
     `-card.webp` on 2026-08-23, so it resolves now — and a click on a software
     project opened the profile sheet AND floated the lightbox over it, with
     two close buttons stacked on each other. The tile opens its profile and
     nothing else. */
  /* ⚠️ `.ring-item` is here since 2026-08-24, and it is the whole of "a ring
     click opens the catalog, not the work page". `.ring` is the group, so the
     arrows walk that one service's own pieces — the overlay reads «٣ / ٩» on
     the design ring, not «٣ / ٨٢» over the whole archive. */
  const OPENS = ".why .holder, .gw-tile, .lib-grid .tile:not([data-project])," +
    " .sheet-shot, .clip-photo, .film-frame, .ab-media, .ring-item";
  const GROUPS = ".gwall, .lib-grid, .reelshow-track, .clippings, .wb1, .film-group," +
    " .ab-read, .ring, main";
  /* ⚠️ The carousel triples its slide set so the loop has no rewind, so the
     track holds 24 nodes showing 8 pictures. Counting the DOM gave "3 / 24"
     and made the arrows walk the same eight three times over — and a click
     that landed on a clone was not in the set at all, so `indexOf` returned
     -1 and the overlay silently opened slide 1 instead. The set is the
     originals; a clone is resolved back to the one it was copied from. */
  const CLONE = ".is-clone";

  const origin = (node) => {
    const c = node.closest(CLONE + "[data-slide]");
    if (!c) return node;
    const twin = c.parentElement.querySelector(
      '[data-slide="' + c.dataset.slide + '"]:not(' + CLONE + ")");
    return (twin && twin.querySelector(OPENS)) || node;
  };

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
    /* `data-full` is the archive file behind a thumbnail. Without it the
       overlay would enlarge the 600px tile derivative — which looks exactly
       like a broken image pipeline and is not one. */
    /* ⚠️ `node.dataset.full` is the last branch, and it is what makes the ring
       openable at all: a `.ring-item` is ten background slats and has no
       `<img>` for any of this to query, so it states its picture on the node.
       Everything else keeps resolving through its own image first, so a
       thumbnail with a `data-full` archive file is unaffected. */
    const full = (img && (img.dataset.full || img.currentSrc || img.src))
      || (node.dataset && node.dataset.full) || "";
    if (film) {
      return { video: `${R2}/video/${film}`, poster: full,
               date: date && date.textContent };
    }
    const vid = node.querySelector("video");
    /* A live preview hands over where it had got to, so opening the overlay
       carries on from the frame that was on screen rather than restarting —
       the same continuity a YouTube thumbnail gives when you click it. */
    if (vid) {
      return { video: vid.currentSrc || vid.src, poster: vid.poster,
               at: vid.currentTime || 0 };
    }
    /* the preview has been torn down (off screen, or never started), but the
       node still knows its film and how far it got */
    if (node.dataset && node.dataset.preview) {
      return { video: node.dataset.preview, poster: full || undefined,
               at: parseFloat(node.dataset.at || "0") || 0,
               date: (date && date.textContent) || node.dataset.date || "" };
    }
    if (!img) {
      /* a ring item: no <img> anywhere in it, but the node names its file */
      if (full) return { img: full, alt: node.dataset.alt || "",
                         date: node.dataset.date || "" };
      return null;
    }
    /* a placeholder holder has nothing worth enlarging */
    if (img.src.startsWith("data:")) return null;
    return { img: full, alt: img.alt, date: date && date.textContent };
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
      /* Resume where the preview had reached. Set on loadedmetadata, not
         immediately: seeking before the duration is known is dropped
         silently, and the video would start from zero with no error. */
      if (it.at > 0.2) {
        v.addEventListener("loadedmetadata", () => {
          if (it.at < v.duration - 0.3) v.currentTime = it.at;
        }, { once: true });
      }
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
    node = origin(node);
    const host = node.closest(GROUPS) || document.body;
    group = [...host.querySelectorAll(OPENS)]
      .filter((el) => itemOf(el) && !el.closest(CLONE));
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

  /* Anything with a role of button has to answer the keyboard too. The archive
     binds its own because its tiles are re-rendered; these are in the page. */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const node = e.target.closest && e.target.closest('[role="button"]' + "");
    if (!node || !node.matches(OPENS) || !itemOf(node)) return;
    e.preventDefault();
    open(node);
  });

  return { open, close };
})();

/* ══════════ inline previews ══════════
   A short, muted, looping piece of a film played inside its own tile, so the
   work moves on the page without anyone opening a player. Clicking still opens
   the lightbox, and it carries on from the frame the preview was showing.

   Declarative on purpose — wiring a real film to a tile is one attribute:

       <figure class="gw-tile gw-b" data-preview="https://…/clip.mp4">
         <img src="…poster.webp" alt="">
       </figure>

   ⚠️ THE FILMS ARE NOT CHOSEN YET. Nothing carries data-preview at the moment,
   so this whole module is inert; adding the attribute is the only step left.

   Three placements, three different rules, all asked for:

     * gallery wall — desktop plays ONE tile per band, and the wall is banded
       by grid row so a band lights up as it is scrolled past. On a phone the
       whole wall is a single band, i.e. strictly one at a time.
     * carousel — the centred slide plays and nothing else. The carousel's own
       dwell already moves it along, so there is no second timer here.
     * why-block 1 — plays whenever it is on screen and NEVER hands on. It is
       one picture in a column, not a sequence.

   ⚠️ A stopped preview is DESTROYED, not paused. A paused <video> that still
   has a src keeps its buffer and on some browsers keeps filling it — the same
   reason the lightbox tears its element down on close. The position survives
   on the node instead (`data-at`), which is what the overlay reads. */
const previews = (() => {
  const HOLD = 5200;               // how long one preview keeps the band
  /* ⚠️ Re-queried on every refresh(), never captured once at boot. Tiles on
     the work page are rendered from JS after this module runs, and an earlier
     shape that snapshotted the DOM here would have silently ignored every one
     of them — and gone permanently inert on any page that had no previews at
     load. */
  let nodes = [];
  if (prefersReduced) return { refresh() { } };

  /* ⚠️ A preview is a REEL, and the reels run 17–83 MB each. Autoplaying one
     the moment a slide centres is fine on a desk and expensive in the street,
     which is where this site is mostly opened — the carousel advances on its
     own, so a visitor who never touches it can still pull several of them.

     So: if the browser says the connection is slow or the visitor has asked
     their phone to save data, the carousel stays a run of poster frames. That
     is not a degraded page — it is what this section looked like until today,
     and the posters are the reels' own first frames.

     Feature-detected, because Network Information is Chromium-only; where it
     does not exist nothing is assumed and the previews play. */
  const conn = navigator.connection || navigator.mozConnection;
  const thin = !!conn && (conn.saveData === true
    || /^(slow-)?2g$/.test(conn.effectiveType || ""));
  if (thin) return { refresh() { } };

  const phone = () => window.matchMedia("(max-width: 640px)").matches;

  /* Which band does a node belong to? The wall is split by grid row so that
     "scrolled past this part of the wall" is a real, measurable thing rather
     than a guess about where the eye is. */
  function bandOf(node) {
    if (node.closest(".reelshow-track")) return "reel";
    if (node.closest(".wb1")) return "wb1";
    /* ⚠️ The ring is driven by the RING, not by an intersection test — see
       syncRing below for why an observer cannot be trusted inside a
       preserve-3d subtree that is translated a whole window off screen. */
    if (node.closest(".ring-item")) return "ring";
    /* ⚠️ ONE BAND EACH, not one band for the section. The agency asked on
       2026-08-23b for the about page's clips to behave like GIFs — all of them
       running, not one at a time — and a band plays exactly one member. Giving
       each holder a band of its own is what lets five of them loop together,
       and the intersection observer still stops any that scrolls away. They
       are 4-5s each and 0.6-1.4 MB, which is why this is affordable here and
       is not on the reel carousel, where the files run 17-83 MB. */
    /* ⚠️ ONE BAND PER CLIPPING, keyed on the node's own position in the
       section rather than on its row. It used to be the row index, which was
       the same thing while every row held exactly one piece of media; the
       shape of 2026-08-24 puts TWO verticals side by side in a row, and a row
       key would have made them share a band — and a band plays exactly one
       member, so one of every pair would have sat still. */
    const ab = node.closest(".ab-read .ab-media");
    if (ab) return "ab-" + [...document.querySelectorAll(".ab-read .ab-media")].indexOf(ab);
    const wall = node.closest(".gwall");
    if (wall) {
      if (phone()) return "wall";
      const wr = wall.getBoundingClientRect(), nr = node.getBoundingClientRect();
      const third = Math.min(2, Math.floor(((nr.top + nr.height / 2) - wr.top)
                                           / (wr.height / 3)));
      return "wall-" + third;
    }
    return "loose";
  }

  const bands = new Map();          // band -> { members, at, timer, visible }
  function band(name) {
    if (!bands.has(name)) bands.set(name, { members: [], at: 0, timer: null });
    return bands.get(name);
  }

  function stop(node) {
    const v = node.querySelector("video.preview");
    if (!v) return;
    node.dataset.at = String(v.currentTime || 0);
    v.pause();
    v.removeAttribute("src");
    v.load();                       // drops the buffer; pause() alone does not
    v.remove();
    node.classList.remove("is-previewing");
  }

  function play(node) {
    if (node.querySelector("video.preview")) return;
    const img = node.querySelector("img");
    const v = document.createElement("video");
    v.className = "preview";
    v.muted = true;                 // set BEFORE src, or autoplay is refused
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = "auto";
    /* a ring item has no <img> — it states its poster on the node, the same
       attribute the lightbox reads */
    if (img) v.poster = img.currentSrc || img.src;
    else if (node.dataset.full) v.poster = node.dataset.full;
    v.src = node.dataset.preview;
    const at = parseFloat(node.dataset.at || "0") || 0;
    if (at > 0.2) {
      v.addEventListener("loadedmetadata", () => {
        if (at < v.duration - 0.3) v.currentTime = at;
      }, { once: true });
    }
    /* ⚠️ Into the box that HOLDS THE PICTURE, not into the node. `video.preview`
       is `position: absolute; inset: 0`, so it fills its nearest positioned
       ancestor — and for every surface that existed before 2026-08-23b those
       were the same element. The about page's clipping is not: its figure
       carries a mat and a caption as well, so a video pinned to the figure
       would cover both. The picture's own parent is the right box in all of
       them. */
    (img && img.parentElement ? img.parentElement : node).appendChild(v);
    node.classList.add("is-previewing");
    v.play().catch(() => stop(node));   // a refused autoplay must not strand it
  }

  function advance(name) {
    const b = band(name);
    const live = b.members.filter((n) => n.dataset.visible === "1");
    clearTimeout(b.timer);
    b.timer = null;
    b.members.forEach(stop);
    if (!live.length) return;
    b.at = b.at % live.length;
    const node = live[b.at];
    play(node);
    /* wb1 is the exception the agency asked for: it holds, it does not cycle.
       So does every about-page clip — a band of one that re-advanced would
       stop and restart its own only member every HOLD ms, which for a looping
       four-second clip is a stutter every five seconds and nothing else. */
    if (name === "wb1" || name === "reel" || name.startsWith("ab-")) return;
    b.timer = setTimeout(() => { b.at += 1; advance(name); }, HOLD);
  }

  /* ══════════ the ring: the piece at the front plays ══════════
     "the ring's reels should play … their poster frames should run like the
     ones in لماذا ألِف؟ and on the about page" (2026-08-24). Only the item
     FACING the viewer plays, which is the carousel's rule rather than the
     about page's — and for the carousel's reason: these are the same 17–83 MB
     reels the carousel streams, not the 0.6–1.4 MB behind-the-scenes clips.
     Four of them running at once on a phone is not a preview, it is a bill.

     🔴 DRIVEN BY THE RING, NOT BY THE OBSERVER, and the observer would be
     wrong rather than merely redundant. A ring item lives inside a preserve-3d
     subtree rotated on two axes, and two of the three stages are translated a
     whole window off screen by `.ring-reel` — the same reason the ring's
     centre marks are not lazy (see build()). What IS a plain box on the page
     is the window the three stages slide inside, so that is what is observed;
     which of the nine items is at the front is a thing only the ring knows,
     and it says so with a `ringfront` event.

     ⚠️ The video is appended to `.ring-item` itself, which is the one place a
     flat plane can go without collapsing the bend: any transform or opacity on
     a wrapper BETWEEN .ring and a slat forces transform-style back to flat.
     A sibling of the slats is not between them. It is pushed out to the band's
     own surface in CSS — see `.ring-item > video.preview`. */
  const ringWin = document.getElementById("ringWindow");
  let ringOn = !ringWin;             /* no ring on this page: nothing to gate */
  function syncRing() {
    document.querySelectorAll(".ring-item[data-preview]").forEach((n) => {
      const stage = n.closest(".ring-stage");
      const on = ringOn
        && n.classList.contains("is-front")
        && !!stage && stage.getAttribute("aria-hidden") === "false"
        && !document.body.classList.contains("lb-open");
      on ? play(n) : stop(n);
    });
  }
  document.addEventListener("ringfront", syncRing);
  if (ringWin && window.IntersectionObserver) {
    new IntersectionObserver((es) => {
      ringOn = es[0].isIntersecting;
      syncRing();
    }, { threshold: 0.25 }).observe(ringWin);
  }

  /* the carousel drives itself: whatever is centred plays, nothing else */
  function syncReel() {
    const b = band("reel");
    b.members.forEach((n) => {
      const on = n.closest(".reel-slide")?.classList.contains("is-current")
        && n.dataset.visible === "1";
      on ? play(n) : stop(n);
    });
  }

  const io = new IntersectionObserver((entries) => {
    const touched = new Set();
    entries.forEach((e) => {
      e.target.dataset.visible = e.isIntersecting ? "1" : "0";
      if (!e.isIntersecting) stop(e.target);
      touched.add(e.target.dataset.band);
    });
    touched.forEach((n) => (n === "reel" ? syncReel() : advance(n)));
  }, { threshold: 0.35 });

  function refresh() {
    bands.forEach((b) => clearTimeout(b.timer));
    bands.clear();
    nodes = Array.from(document.querySelectorAll("[data-preview]"));
    nodes.forEach((n) => {
      const name = bandOf(n);
      n.dataset.band = name;
      /* ⚠️ The ring is NOT observed and has no band. Left in the observer it
         would report "not intersecting" forever — the 3D transform means its
         box is not where the test looks — and the callback would stop the
         reel a frame after syncRing() started it. */
      if (name === "ring") return;
      band(name).members.push(n);
      io.observe(n);
    });
    syncRing();
  }
  refresh();

  /* The centred slide changes without any intersection change, so the carousel
     has to be watched on scroll rather than through the observer.

     🔴 DEBOUNCED, and unthrottled it was a real cost rather than a tidiness
     matter. syncReel() calls play() or stop() for every member, and stop()
     tears a <video> element down — removeAttribute("src"), load(), remove() —
     while play() builds a new one and starts a network fetch. Bound directly
     to `scroll`, that ran on every event of a smooth scroll, which on a phone
     is dozens a second, each one destroying and recreating a video element on
     the main thread. ⚠️ It compounds: play() catches a rejected play() by
     calling stop(), and a play interrupted by the next scroll event rejects
     with AbortError — so the churn feeds itself.

     Steady state is cheap either way (both halves return early when there is
     nothing to do), so the only thing lost by waiting for the scroll to settle
     is 120ms before a newly centred reel starts playing. */
  let reelSync = 0;
  document.getElementById("reelTrack")
    ?.addEventListener("scroll", () => {
      clearTimeout(reelSync);
      reelSync = setTimeout(syncReel, 120);
    }, { passive: true });
  /* re-band on resize: the phone collapses the wall's three bands into one */
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { nodes.forEach(stop); io.disconnect(); refresh(); }, 220);
  });

  return { refresh };
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
/* The tile for a software project: the client's own mark on a field of their
   site's dominant colour, cut to the tile's 1.6 by derive_shots.py.

   ⚠️ It was a 160px square crop of screenshot 1, drawn into a tile ~270px wide
   at a different aspect — upscaled AND showing a fragment of a page rather
   than whose page it is. That is the "low quality covers" the agency raised on
   2026-08-23. Both files are derived, not stored per project: the name is the
   first shot's, so there is nothing extra to keep in step. */
const coverOf = (p) =>
  "assets/shots/" + p.profile.shots[0].replace(/-\d+$/, "-card") + ".webp";

function renderLibrary() {
  if (!accRoot) return;
  accRoot.innerHTML = "";
  pending.clear();

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

     All three are real and live as of 2026-08-22. */
  /* ══════════ the subsection runs ══════════
     A service panel is filed into named runs; `all` deliberately is not — it
     is the whole archive newest-first, and a row's run is a property of its
     service, so grouping the mixed view would just re-sort it by category
     under another name.

     ⚠️ NOT the SUBCATS taxonomy the services switcher steps through. That one
     is what the agency SELLS (reels / video / stills, three of them); this is
     how the archive is FILED (one videos run, one photos run). They overlap
     without matching, and forcing one to serve both would file a horizontal
     film and a vertical reel apart on the page whose whole job is to show the
     work together.

     `of` claims a row for a run, first run wins. A run that claims nothing is
     not rendered — the agency's rule. Which is why `logos`, `print` and `apps`
     are declared with predicates that cannot currently match: they are the
     shape the archive grows into, not dead code, and the day a logo is filed
     they appear on their own.

     ⚠️ Every design piece is a digital ad because the agency said so
     (2026-08-22), not because anything in the file says which is which. MEDIA
     carries no subsection field. When they classify the nine, this becomes a
     lookup and `of` stops being a constant. */
  const LIBSUBS = {
    design: [
      { id: "ads", ar: "إعلانات رقمية", en: "Digital Ads", of: () => true },
      { id: "logos", ar: "شعارات", en: "Logos", of: () => false },
      { id: "print", ar: "مطبوعات", en: "Printables", of: () => false },
    ],
    photo: [
      { id: "videos", ar: "فيديوهات", en: "Videos", of: (r) => !!(r.m && r.m.v) },
      { id: "photos", ar: "صور", en: "Photos", of: (r) => !!(r.m && !r.m.v) },
    ],
    tech: [
      { id: "sites", ar: "مواقع", en: "Websites",
        of: (r) => !!(r.p && r.p.profile.kind === "site") },
      { id: "apps", ar: "تطبيقات", en: "Apps",
        of: (r) => !!(r.p && r.p.profile.kind === "app") },
    ],
  };

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

    const tileHTML = (row) => {
      /* A software project has no photograph of itself — it gets a named tile
         that opens the profile sheet, which is where that work can actually
         be shown. It is the one kind of tile here that carries a title. */
      if (row.kind === "project") {
        const p = row.p;
        return `
      <figure class="tile has-profile" data-project="${row.at}" role="button" tabindex="0">
        <div class="tile-img" style="aspect-ratio:1.6">
          <img src="${coverOf(p)}" alt="${p[lang]}" loading="lazy" decoding="async">
          <span class="tile-open" aria-hidden="true">${I18N.pfOpen[lang]}</span>
        </div>
        <figcaption><span>${p[lang]}</span><span class="t-date">${fmtDate(p.date)}</span></figcaption>
      </figure>`;
      }

      /* Film shows its poster frame and nothing else until asked. A screen of
         muted loops is the exact load the phone pass spent a week removing,
         and these run 28-209 MB. */
      const m = row.m;
      /* ⚠️ The TILE takes the 600px derivative, not the archive file. A browser
         decodes an image at its intrinsic size however small it is drawn, so
         serving the 1600px master into a tile ~180 CSS px wide on a phone put
         22.9 megapixels of decoded texture on the page for 24 visible tiles.
         The lightbox still opens the full file — that is the one place the
         work is meant to be seen at size. resources/thumb_media.py derives
         them; every key under thumb/ is the same name as its source. */
      const src = `${R2}/thumb/${m.v ? m.p : m.f}`;
      /* The full file the lightbox opens. Carried on the node because the
         overlay reads the picture that is on screen, and the picture on screen
         is now the thumbnail. */
      const full = m.v ? `${R2}/poster/${m.p}` : `${R2}/img/${m.f}`;
      const date = m.d ? `<figcaption><span class="t-date">${fmtDate(m.d)}</span></figcaption>` : "";
      return `
      <figure class="tile${m.v ? " is-film" : ""}"${m.v ? ` data-film="${m.f}" role="button" tabindex="0" aria-label="${I18N.mPlay[lang]}"` : ""}>
        <div class="tile-img" style="aspect-ratio:${m.r}">
          <img src="${src}" data-full="${full}" alt="" loading="lazy" decoding="async">
          ${m.v ? '<span class="tile-play" aria-hidden="true"></span>' : ""}
        </div>
        ${date}
      </figure>`;
    };

    /* First run to claim a row keeps it. Anything no run claims still gets a
       grid of its own — a piece of work must never fall out of the archive
       because the taxonomy grew a hole. */
    const claimed = new Set();
    const runs = [];
    (cat.id === "all" ? [] : LIBSUBS[cat.id] || []).forEach((sub) => {
      const list = items.filter((r) => !claimed.has(r) && sub.of(r));
      list.forEach((r) => claimed.add(r));
      if (list.length) runs.push({ sub, list });
    });
    const rest = items.filter((r) => !claimed.has(r));
    if (rest.length) runs.push({ sub: null, list: rest });

    /* ⚠️ The panel ships EMPTY and is filled the first time it opens.
       Three of the four panels are shut at any moment, and a shut panel is
       still 64-104px wide with `overflow: hidden` — not `display: none` — so
       every tile in it was being laid out, in a four-column layout, inside a
       box narrower than one column. Most items exist twice (once in `all`,
       once in their service), which put 158 tiles and 164 images in the
       document to show 79. `loading="lazy"` does not help with this: it defers
       the BYTES, not the boxes.

       Measured on a phone profile at 4x CPU throttle before this change:
       1,189 DOM nodes, 164 images, and 151ms for one forced full layout. */
    const fill = () => `${runs.map((run) => `
        <section class="lib-sub">
          ${run.sub ? `<div class="sub-head"><span class="sub-name">${run.sub[lang]}</span></div>` : ""}
          <div class="lib-grid">${run.list.map(tileHTML).join("")}</div>
        </section>`).join("")}`;

    panel.innerHTML = `
      <button class="spine" aria-expanded="${cat.id === openCat}">
        <span class="spine-name">${cat[lang]}</span>
      </button>
      <div class="panel-body">
        <div class="panel-head">
          <h2>${cat[lang]}</h2>
          <span class="panel-count">${num(items.length)}</span>
        </div>
        <div class="lib-run"></div>
      </div>`;
    pending.set(cat.id, () => {
      panel.querySelector(".lib-run").innerHTML = fill();
    });

    panel.querySelector(".spine").addEventListener("click", () => {
      if (openCat === cat.id) return;
      openCat = cat.id;
      /* Built before the class flips, so the panel opens onto its work rather
         than onto cream that fills in a frame later. */
      ensurePanel(cat.id);
      accRoot.querySelectorAll(".acc-panel").forEach((p) => {
        const isOpen = p.dataset.cat === openCat;
        p.classList.toggle("open", isOpen);
        p.querySelector(".spine").setAttribute("aria-expanded", String(isOpen));
        if (isOpen) p.querySelector(".panel-body").scrollTop = 0;
      });
    });

    accRoot.appendChild(panel);
  });

  ensurePanel(openCat);
  syncSubOffset();
}

/* Panels not yet built, by category id. A builder is dropped as it runs, so
   `ensurePanel` is safe to call from anywhere and costs nothing after the
   first time. Cleared by renderLibrary, which re-registers all four — the
   language switch re-renders the whole archive. */
const pending = new Map();
function ensurePanel(catId) {
  const build = pending.get(catId);
  if (!build) return false;
  pending.delete(catId);
  build();
  return true;
}

/* A subsection head pins directly under the panel head, which is itself sticky
   at the top of the same scroller. That offset is measured rather than typed:
   the panel head is set in the display face at a clamp, in two languages, and
   a guessed constant either leaves a cream gap above the heading or tucks it
   behind — and it is wrong at a different width for a different reason each
   time. Re-run after the fonts land; the fallback face is a different height. */
function syncSubOffset() {
  if (!accRoot) return;
  const head = accRoot.querySelector(".panel-head");
  if (head) accRoot.style.setProperty("--phead", head.offsetHeight + "px");
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

  let current = null, shotIdx = 0, lastFocus = null;

  /* Real screenshots, captured from the live deployments. This returned the
     grey placeholder for as long as the projects were invented; it is the one
     line that decides whether this sheet shows work or a swatch.

     `-t` is the 400x250 thumb beside the 1600x1000 plate. Both are cut to the
     sheet's own aspect ratios by resources/derive_shots.py, so nothing here
     needs a width or a height — the CSS already states them. */
  const shotSrc = (id, thumb) =>
    "assets/shots/" + id + (thumb ? "-t" : "") + ".webp";

  /* The square version of the same logo card the tile shows. */
  const coverSrc = (shots) => shotSrc(shots[0].replace(/-\d+$/, "-cover"));

  function paintShot(i) {
    const shots = current.profile.shots;
    shotIdx = ((i % shots.length) + shots.length) % shots.length;
    shot.src = shotSrc(shots[shotIdx]);
    thumbs.querySelectorAll("button").forEach((b, n) =>
      b.classList.toggle("on", n === shotIdx));
    if (!prefersReduced) {
      gsap.fromTo(shot, { opacity: 0.25, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" });
    }
  }

  function paint() {
    const p = current, pr = p.profile;
    el("sheetCover").src = coverSrc(pr.shots);
    el("sheetTitle").textContent = p[lang];
    el("sheetTagline").textContent = pr.tagline[lang];
    el("sheetAboutK").textContent = I18N.pfAbout[lang];
    el("sheetShotsK").textContent = I18N.pfShots[lang];
    el("sheetBody").textContent = pr.body[lang];
    el("sheetClose").setAttribute("aria-label", I18N.pfClose[lang]);

    thumbs.innerHTML = pr.shots.map((s, i) => `
      <button type="button" data-shot="${i}" aria-label="${I18N.pfShots[lang]} ${num(i + 1)}">
        <img src="${shotSrc(s, true)}" alt="" loading="lazy">
      </button>`).join("");

    /* The work is live, so the button leaves the site rather than framing it.
       It used to open a sandboxed iframe around a preview BUILD, which existed
       because the projects were invented and there was nothing real to point
       at. There is now — and a real site in a real tab is the honest version
       of that button, as well as the one a visitor expects. */
    const cta = el("sheetPreview");
    const note = el("sheetNote");
    const hasSite = !!pr.url;
    cta.hidden = !hasSite;
    note.hidden = !hasSite;
    if (hasSite) {
      cta.href = pr.url;
      cta.querySelector(".ob-label").textContent = I18N.pfVisit[lang];
      /* The address itself, not a description of it: it says where the button
         goes, and it is the one line on this sheet a visitor might type out. */
      note.textContent = pr.url.replace(/^https?:\/\//, "");
    }

    paintShot(0);
  }

  thumbs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-shot]");
    if (b) paintShot(+b.dataset.shot);
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
    close();
  });

  return {
    open,
    close,
    /* language switch while the sheet is open */
    refresh() { if (current) paint(); },
  };
})();

/* ══════════ about: one section per service ══════════
   ⚠️ UNUSED since 2026-08-16 — `#svcAbout` was removed from about.html at the
   boss's instruction ("About Us shouldn't repeat our services"). The early
   return below is what makes it a no-op rather than an error.

   Kept, with SERVICES[].what/why/does, only because a different treatment of
   the same material may be wanted later. ⚠️ That copy is PROTOTYPE-INVENTED
   and was never approved — do not wire this back up without replacing it. */
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
  /* The card is the unit now, not the paragraph inside it — and `.ab-fact` is
     gone with the facts table (2026-08-23). A stale selector here costs
     nothing at run time and is exactly how a reveal quietly stops covering
     something that was renamed. */
  gsap.utils.toArray(".clip, .ab-media, .ab-card").forEach((el) => {
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
    /* ⚠️ Tag the originals and mark the copies. The clones are a scrolling
       trick, not content: anything that counts, indexes or lists the slides
       has to be able to tell the eight real pictures from the 24 nodes in the
       DOM, and `aria-hidden` alone only told assistive tech. `data-slide` is
       what maps a clone back to the original it was copied from — cloneNode
       carries it across, so the two always agree. */
    real.forEach((s, i) => { s.dataset.slide = String(i); });
    const copy = () => real.map((s) => {
      const c = s.cloneNode(true);
      c.classList.add("is-clone");
      c.setAttribute("aria-hidden", "true");   // the same eight pictures, thrice
      return c;
    });
    track.prepend(...copy());
    track.append(...copy());
  }
  const slides = Array.from(track.querySelectorAll(".reel-slide"));

  const DWELL = 4200;
  /* How long a programmatic scroll is allowed to be in flight before anything
     is allowed to read the track's position as if it had settled. A smooth
     scroll across one slide runs ~350-500ms on a phone; 700 covers it with
     room and still releases well inside the 4.2s dwell. */
  const FLIGHT = 700;
  let idx = -1, timer = null, raf = 0, settle = 0;
  let onScreen = true, held = false, dragging = false;
  let flying = 0;                   // performance.now() of the last smooth scroll

  /* ⚠️ Measure slides by their CENTRE, never by an edge.
     A flanking slide sits at `transform: scale(0.94)` and the centred one at
     scale(1), and getBoundingClientRect reports the VISUAL box — so a flank's
     `left` is inset by 3% of its width against its layout position, and the
     0.5s transition means that inset is a moving number besides. A uniform
     scale about the default 50% 50% origin leaves the centre exactly where it
     was, so the centre is the one measurement the transform cannot move. */
  const mid = (i) => {
    const r = slides[i].getBoundingClientRect();
    return r.left + r.width / 2;
  };
  const trackMid = () => {
    const t = track.getBoundingClientRect();
    return t.left + t.width / 2;
  };

  /* 🔴 HYSTERESIS, and this is the fix for the fault the agency filmed on
     2026-08-23b: on a phone the centred reel sat at the flank's 0.34 opacity
     almost the whole time. Ten frames a second out of that recording show it
     flickering between fully opaque, half faded and gone — which is not a
     transition settling, it is `is-current` being taken off one slide and put
     on another many times a second, restarting a 0.5s opacity transition from
     wherever it had got to and never letting it arrive.

     The cause is that this function reads a number three other things are
     writing at the same time: the auto-advance's smooth scroll, the snap
     engine, and recentre(). Whenever two slides are near-equidistant, a pixel
     of jitter flips the winner, and near-equidistant is exactly where a
     carousel spends its time while moving.

     So a challenger has to be CLEARLY nearer — a quarter of a slide — before
     it takes the class. Below that the current slide keeps it, and the
     transition is left alone to finish. ⚠️ The margin is a fraction of a
     slide, not a constant: --reel-w is 33.5% of the track on a desktop and 78%
     on a phone, so a fixed pixel margin would be a different rule on each. */
  const HOLD_MARGIN = 0.25;
  /* 🔴 `force` IS NOT A CONVENIENCE. recentre() translates the track by one
     whole set, which by construction leaves every slide looking exactly where
     it was — so the slide that is now nearest the centre is a DIFFERENT index
     at the SAME distance, and hysteresis would refuse to move the index onto
     it. recentre() would then still see an index outside the middle set, and
     translate again, and again. The margin exists to ignore jitter; a
     deliberate re-index is not jitter. */
  function mark(force) {
    const m = trackMid();
    let best = 0, bestD = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(mid(i) - m);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best === idx) return;
    if (!force && idx >= 0 && slides[idx]) {
      const w = slides[idx].getBoundingClientRect().width || 1;
      if (Math.abs(mid(idx) - m) - bestD < w * HOLD_MARGIN) return;
    }
    idx = best;
    slides.forEach((s, i) => s.classList.toggle("is-current", i === idx));
  }

  function centerOn(i, instant) {
    if (!slides[i]) return;
    /* ⚠️ Stamped BEFORE the scroll is asked for, so recentre() cannot fire
       between the request and the first scroll event it produces. */
    if (!(instant || prefersReduced)) flying = performance.now();
    track.scrollBy({
      left: mid(i) - trackMid(),
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
    /* 🔴 NOT WHILE A SMOOTH SCROLL IS IN FLIGHT. This does an INSTANT
       scrollBy, and an instant programmatic scroll cancels a smooth one that
       is still running — leaving the track stopped between two slides, where
       the snap engine takes over and the centre is whatever it lands on. The
       settle timer is 140ms and a phone can go longer than that between scroll
       events mid-animation, so "the scroll has stopped" was being inferred
       from a gap that the animation itself produces. Measured from the
       agency's recording: the carousel reached positions where NO slide
       overlapped the centre at all and the strip went blank — the same "hole
       where the track runs out" that fast clicking used to open. */
    if (n < 2 || dragging) return;
    if (flying && performance.now() - flying < FLIGHT) return;
    mark(true);
    if (idx >= n && idx < 2 * n) return;
    const target = n + ((idx % n) + n) % n;
    track.scrollBy({ left: mid(target) - mid(idx), behavior: "instant" });
    mark(true);
  }

  function go(step) {
    /* ⚠️ This call SUPERSEDES whatever was in flight, so it clears the guard
       recentre() reads. Without this, a run of fast clicks would each be
       inside the previous one's flight window, recentre() would be skipped
       every time, and the index would walk straight out of the middle set —
       which is the failure the note below already describes, arriving by a
       new route. */
    flying = 0;
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
    requestAnimationFrame(() => { centerOn(n, true); mark(true); });
  }
  mark(true);
  arm();
  /* the resize hook re-indexes deliberately, so it forces too */
  return { remeasure: () => mark(true) };
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
const QS = new URLSearchParams(location.search);
if (QS.get("paper") === "1") {
  document.body.classList.add("paper");
}

/* ══════════ arriving from a ring ══════════
   The home page's rings link here on a piece, not on a page: `?open=<file>`
   for something out of the archive, `?project=<n>` for a software project.
   This opens the panel that holds it, brings the tile into view, and opens it
   the way clicking it would.

   ⚠️ Runs after boot, not with it. renderLibrary paints from applyI18n, so at
   the time this file is read the tile being looked for does not exist yet.

   ⚠️ The key is the MEDIA filename — a film is filed under its own `.mp4`
   even though the tile shows a poster, which is why the ring sends `open` and
   not the picture's src. */
function openFromQuery() {
  if (document.body.dataset.page !== "library") return;
  const wantProject = QS.get("project");
  const wantOpen = QS.get("open");
  if (wantProject === null && !wantOpen) return;

  /* ⚠️ Panels are built on first open, so the tile being looked for may not
     be in the document at all yet. Build the one that holds it — its service
     for a media file, `tech` for a project — and `all` as the fallback the
     search below falls through to. */
  const home = wantProject !== null
    ? "tech"
    : (MEDIA.find((m) => m.f === wantOpen || m.p === wantOpen) || {}).c;
  if (home) ensurePanel(home);
  ensurePanel("all");

  const sel = wantProject !== null
    ? '.tile[data-project="' + CSS.escape(wantProject) + '"]'
    : '.tile[data-film="' + CSS.escape(wantOpen) + '"]';
  let all = Array.from(document.querySelectorAll(sel));
  if (!all.length && wantOpen) {
    all = Array.from(document.querySelectorAll('.tile img[src$="/' + wantOpen + '"]'))
      .map((i) => i.closest(".tile"));
  }
  /* ⚠️ Every piece appears TWICE — once in its category panel and once in the
     mixed `all` run — and `all` comes first in the DOM. Prefer the category:
     arriving from a ring should land in the service that ring belongs to, with
     the neighbouring work being the rest of that service rather than the whole
     archive. It also decides what the overlay's arrows walk through. */
  const tile = all.find((t) => t.closest(".acc-panel")?.dataset.cat !== "all") || all[0];
  if (!tile) return;

  const panel = tile.closest(".acc-panel");
  if (panel && !panel.classList.contains("open")) panel.querySelector(".spine").click();

  /* ⚠️ NOT requestAnimationFrame. A link opened into a background tab does not
     paint, and rAF there does not run at all — the piece would stay unopened
     until the tab was looked at, which is exactly when the arrival is over. A
     timer runs either way, and it also outlasts the panel's open transition,
     so the tile has its real position before anything scrolls to it. */
  setTimeout(() => {
    tile.scrollIntoView({ block: "center", behavior: prefersReduced ? "auto" : "smooth" });
    if (wantProject !== null) projectSheet.open(+wantProject);
    else lightbox.open(tile);
  }, 460);
}

/* `?flat=1` — a DIAGNOSTIC, not a design option.
   The linen is a viewport-sized fixed layer with mix-blend-mode: multiply
   sitting above everything. A blend mode cannot be composited as a plain
   layer — the GPU has to read the backdrop back for every affected pixel —
   so on a mid-range phone it can cost a re-composite of the whole viewport on
   every scroll frame, which surfaces as stutter in anything moving underneath
   it (reported on the carousel, on a Galaxy A54 in Brave).

   Loading any page with ?flat=1 drops the blend to a plain overlay. If the
   stutter goes with it, the cost is the blend and the fix is to stop blending
   a full-viewport fixed layer. If the stutter stays, the linen is innocent and
   this switch has ruled it out — which is the point. */
if (QS.get("flat") === "1") {
  document.body.classList.add("flat-linen");
}

/* ══════════ boot ══════════ */
applyI18n();
initDropCap();
syncMenuBtn();
openFromQuery();

/* widths measured before Idris lands are wrong and leave a gap in the
   loops — remeasure once the fonts are applied */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    rebuildLoops();
    filmLoop.rebuild();
    queueMenuSync();
    syncSubOffset();
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
    /* The ring's item sizes and radius are pixels off the window's measured
       height, so they are stale the moment the window changes. */
    serviceRings.resize();
    syncSubOffset();
  }, 250);
});
