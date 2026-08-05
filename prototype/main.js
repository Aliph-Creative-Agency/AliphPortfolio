/* ALIPH prototype v04 — i18n, film strip, interactive marquee, story, contact */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
gsap.registerPlugin(ScrollTrigger);

/* ══════════ i18n ══════════ */
const I18N = {
  navHome: { ar: "الرئيسيّة", en: "Home" },
  navWork: { ar: "الأعمال", en: "Work" },
  navAbout: { ar: "من نحن", en: "About" },

  /* hero */
  heroEyebrow: { ar: "استوديو إبداعي — القدس، جبل الزيتون", en: "A creative studio — Jerusalem, Mount of Olives" },
  hero1: { ar: "نبدأ من حيث", en: "We start where" },
  hero2: { ar: "تبدأ الأشياء.", en: "things begin." },
  /* the boxed letter completes the first word: أ + لِف / A + liph */
  heroPara: {
    ar: "لِف استوديو يبدأ من الحرف الأوّل. لكل علامةٍ نقطة أصلٍ تُبنى منها وتعود إليها، وعملنا هو العثور على تلك النقطة، ثم رسم النظام كاملًا منها: الاسم، والهويّة، والصوت، والطريقة التي تظهر بها العلامة في العالم. نصنع الهويّات والحملات والفعاليّات، ونبني المواقع والأنظمة التي تُشغّلها — من الألِف إلى الياء.",
    en: "liph is a studio that begins at the first letter. Every brand has an origin point it is built from and returns to; our work is finding that point, then drawing the whole system from it: the name, the identity, the voice, and the way the brand shows up in the world. Identities, campaigns and events — and the sites and systems that run them. From A to Z.",
  },
  /* the dropcap letter is baked into the crumple sprite; this is the copy
     screen readers get */
  dropLetter: { ar: "أ", en: "A" },
  heroMeta1: { ar: "منذ ٢٠٢٤", en: "Since 2024" },
  heroMeta2: { ar: "القدس — جبل الزيتون", en: "Jerusalem — Mount of Olives" },
  heroMeta3: { ar: "هويّات · تسويق · فعاليّات · تقنيّة", en: "Identity · Marketing · Events · Technology" },
  btnWork: { ar: "كل الأعمال", en: "ALL WORK" },
  btnAbout: { ar: "تعرّف على ألِف", en: "Get to know Aliph" },

  /* services */
  svcBanner: { ar: "ماذا نفعل؟", en: "What we do?" },
  svc1: { ar: "هويّات بصريّة", en: "Identities" },
  svc2: { ar: "تسويق ومحتوى إبداعي", en: "Creative Marketing" },
  svc3: { ar: "تنظيم فعاليّات", en: "Events" },
  svc4: { ar: "حلول تقنيّة", en: "Technical Solutions" },
  svc1Label: { ar: "IDENTITY", en: "هويّات بصريّة" },
  svc2Label: { ar: "CREATIVE", en: "تسويق ومحتوى إبداعي" },
  svc3Label: { ar: "EVENTS", en: "تنظيم فعاليّات" },
  svc4Label: { ar: "TECHNOLOGY", en: "حلول تقنيّة" },

  /* latest-work slider */
  slLatest: { ar: "أحدث الأعمال", en: "Latest work" },
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
  libStats: { ar: "الأحدث أوّلًا", en: "Newest first" },
  libIndex: { ar: "فهرس", en: "Index" },
  libGallery: { ar: "معرض", en: "Gallery" },
  aboutBanner: { ar: "من نحن؟", en: "Who are we?" },

  /* project profile sheet (technical solutions) */
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
  pfPrev: { ar: "السابق", en: "Previous" },
  pfNext: { ar: "التالي", en: "Next" },
  pfService: { ar: "الخدمة", en: "Service" },
  pfDate: { ar: "التاريخ", en: "Date" },
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
  /* about — the long read */
  abLead: {
    ar: "ألِف استوديو إبداعي من القدس — من جبل الزيتون تحديدًا. بدأ سنة ٢٠٢٤ بفكرة واحدة: أنّ العلامة ليست شعارًا يُرسم، بل نظام يُبنى من نقطة أصله. واسمنا نفسه هو أوّل الحروف: النقطة التي تبدأ منها كل كلمة، والمقياس الذي تُرسم عليه بقيّة الحروف.",
    en: "Aliph is a creative studio from Jerusalem — from the Mount of Olives, to be exact. It began in 2024 on a single idea: that a brand is not a logo you draw, but a system you build from its point of origin. Our name is that point — the first letter, the place every word starts, and the measure the rest of the letters are drawn against.",
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
    ar: "من الحرف الأوّل إلى آخر تفصيل: نبني الهويّة، ونصنع المحتوى والحملات التي تنشرها، وننظّم الفعاليّات التي تلتقي فيها بجمهورك، ونبرمج المواقع والأنظمة التي تُشغّلها. أربع خدمات على الورق، لكنها في العمل خطّ واحد متّصل — وهذا هو الفرق.",
    en: "From the first letter to the last detail: we build the identity, make the content and campaigns that carry it, run the events where you meet your audience, and write the sites and systems that keep it running. Four services on paper — one continuous line in practice, and that is the whole difference.",
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
  abFact4v: { ar: "أربع", en: "Four" },

  svcAboutBanner: { ar: "ماذا نقدّم؟", en: "What we offer" },
  abWhat: { ar: "ما نفعله", en: "What we do" },
  abWhy: { ar: "لماذا نحن", en: "Why us" },
  abDoes: { ar: "يشمل", en: "Includes" },
};

/* one section per service on the about page — what we do, why us, and the
   concrete deliverables underneath */
const SERVICES = [
  {
    id: "identity", tag: "IDENTITY", seed: "aliph-svc1",
    what: {
      ar: "نبني الهويّة من نقطة أصلها، لا من شكلها. نبحث أوّلًا في الاسم والحكاية والمكان عن النقطة التي تُبنى منها العلامة، ثم نرسم منها النظام كاملًا: الشعار، ولوحة الألوان، والخطوط، ونبرة الصوت، والقرطاسيّة، وقواعد الظهور اليوميّة.",
      en: "We build an identity from its origin point, not from its shape. First we look in the name, the story and the place for the point the brand is built from, then we draw the whole system out of it: the mark, the palette, the type, the tone of voice, the stationery, and the rules for showing up every day.",
    },
    why: {
      ar: "لأننا لا نسلّم شعارًا ونمضي — نسلّم نظامًا يعرف كيف يتصرّف حين لا نكون موجودين: في المطبوع، وعلى الشاشة، وفي الشارع، وبين يديّ من يستعمله كل يوم. ولأنّ العربيّة عندنا ليست ترجمةً لاحقة؛ نصمّم بها من السطر الأوّل، فلا يخرج حرفٌ مكسورٌ لأنّ النظام وُضع لغيره.",
      en: "Because we don't hand over a logo and walk away — we hand over a system that knows how to behave when we're not in the room: in print, on screen, in the street, in the hands of whoever uses it daily. And because Arabic isn't an afterthought here; we design in it from the first line, so nothing arrives broken because the system was built for another script.",
    },
    does: {
      ar: ["دليل الهويّة", "الشعار ومشتقّاته", "نظام الألوان والخطوط", "القرطاسيّة", "التغليف واللافتات", "قوالب المنصّات"],
      en: ["Brand guidelines", "Logo & lockups", "Color & type system", "Stationery", "Packaging & signage", "Channel templates"],
    },
  },
  {
    id: "creative", tag: "CREATIVE", seed: "aliph-svc2",
    what: {
      ar: "من الفكرة إلى المنشور: نضع مفهوم الحملة، ونصوّر موادّها، ونكتب نصوصها، وندير نشرها ومتابعة أرقامها على المنصّات. التصوير والكتابة والحملة عندنا خطّ واحد، لا ثلاث جهات تتناوب على العمل نفسه وتتبادل اللوم عند أوّل تأخير.",
      en: "From the idea to the post: we set the campaign concept, shoot its material, write its copy, and run the rollout and the numbers across channels. Photography, writing and campaign are one line here — not three suppliers taking turns on the same job and trading blame at the first delay.",
    },
    why: {
      ar: "لأنّ المحتوى الذي يُصنع داخل الهويّة يبدو مختلفًا عن المحتوى الذي يُلصق عليها. نحن نعرف علامتك من الداخل، غالبًا لأننا من بناها، فكل صورة وكل جملة تخرج من النظام نفسه لا من خارجه. وهذا تحديدًا تاريخنا الطويل: التصوير والإعلان هما ما كنّا نفعله قبل أن نصير استوديو كاملًا.",
      en: "Because content made inside the identity looks different from content stuck onto it. We know your brand from the inside, often because we built it, so every frame and every line comes out of the same system rather than beside it. And this is where our longest history is: photography and advertising are what we did before we became a full studio.",
    },
    does: {
      ar: ["مفهوم الحملة", "التصوير الفوتوغرافي والفيديو", "كتابة المحتوى", "إدارة المنصّات", "الإعلانات المدفوعة", "التقارير الشهريّة"],
      en: ["Campaign concept", "Photography & video", "Copywriting", "Channel management", "Paid media", "Monthly reporting"],
    },
  },
  {
    id: "events", tag: "EVENTS", seed: "aliph-svc3",
    what: {
      ar: "نتولّى الفعاليّة كاملةً أو نمسك جزأها البصري: هويّة الفعاليّة، وتوزيع المساحة، واللافتات والمطبوعات، وبرنامج اليوم، والتوثيق المصوّر من أوّل ساعة تجهيز إلى آخر ضيف يغادر.",
      en: "We take on the whole event or hold its visual half: the event identity, the spatial layout, the signage and printed matter, the run of the day, and the photographic record from the first hour of setup to the last guest leaving.",
    },
    why: {
      ar: "لأنّ الفعاليّة أقسى اختبار للهويّة: كل شيء يحدث مرّةً واحدة وأمام الناس، ولا توجد نسخة ثانية. خبرتنا في التصوير تجعلنا نجهّز المكان وفي بالنا كيف سيبدو في الصورة، لا كيف يبدو للعين فقط — فيبقى بعد انتهاء اليوم أرشيفٌ مصنوعٌ بالعناية نفسها التي صُنع بها اليوم.",
      en: "Because an event is the hardest test an identity takes: everything happens once, in front of people, with no second cut. Our photography background means we dress a space thinking about how it will read in the frame, not only to the eye — so what's left when the day ends was made with the same care as the day itself.",
    },
    does: {
      ar: ["هويّة الفعاليّة", "الدعوات والمطبوعات", "اللافتات وتوزيع المساحة", "إدارة البرنامج", "التوثيق المصوّر", "محتوى ما بعد الفعاليّة"],
      en: ["Event identity", "Invitations & print", "Signage & spatial layout", "Programme management", "Photographic coverage", "Post-event content"],
    },
  },
  {
    id: "tech", tag: "TECHNOLOGY", seed: "aliph-svc4",
    what: {
      ar: "نبني المواقع والأنظمة والتطبيقات التي تحتاجها العلامة لتشتغل فعلًا: موقع تعريفي أو متجر، نظام تسجيل أو حجز، لوحة إدارة يفهمها صاحبها، أو أداة داخليّة تختصر عملًا يدويًّا يتكرّر كل شهر.",
      en: "We build the sites, systems and apps a brand needs to actually run: a presence site or a store, a registration or booking system, an admin panel its owner can understand, or an internal tool that removes a manual job repeated every month.",
    },
    why: {
      ar: "لأنّ الفرق بين موقعٍ جميل وموقعٍ يعمل هو أن يبنيه من يفهم الهويّة والبرمجة معًا. نحن نصمّم ونبرمج تحت سقف واحد، فلا يضيع التصميم في الترجمة إلى كود، ولا يُسلَّم نظام لا يشبه صاحبه. ونبني بالعربيّة أوّلًا: الاتّجاه، والخط، وشكل الأرقام، والاستمارات — لا كإصلاحٍ يُضاف في آخر أسبوع.",
      en: "Because the difference between a site that looks good and a site that works is having it built by people who understand both the identity and the code. We design and engineer under one roof, so nothing is lost translating design into code and no system ships looking unlike its owner. And we build Arabic-first: direction, type, numerals and forms — not as a patch added in the final week.",
    },
    does: {
      ar: ["مواقع تعريفيّة ومتاجر", "أنظمة تسجيل وحجز", "لوحات إدارة", "تطبيقات هاتف", "أتمتة وربط الأنظمة", "استضافة ومتابعة"],
      en: ["Sites & storefronts", "Registration & booking systems", "Admin dashboards", "Mobile apps", "Automation & integrations", "Hosting & maintenance"],
    },
  },
];

const CATS = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "identity", ar: "هويّات بصريّة", en: "Identities" },
  { id: "creative", ar: "تسويق ومحتوى إبداعي", en: "Creative Marketing" },
  { id: "events", ar: "تنظيم فعاليّات", en: "Events" },
  { id: "tech", ar: "حلول تقنيّة", en: "Technical Solutions" },
];

/* Every project carries a one-line brief so the "latest work" slider on the
   home page can speak about whichever piece is on screen (placeholder copy).
   `date` is "YYYY-MM" — the archive is one continuous run, newest first, with
   no year sections and no piece counts anywhere.
   Technical-solutions entries additionally carry a `profile`, which is what
   opens the preview sheet (screenshots + details, plus a live preview for
   sites). Any project given a `profile` gets the sheet, so the other three
   services can be extended the same way later. */
const PROJECTS = [
  { ar: "مؤسّسة بنيان", en: "Bunyan Foundation", date: "2026-05", cat: "identity", seed: "aliph01",
    desc: { ar: "حضورٌ أوضح وأكثر حداثة، مع الحفاظ على روح العلامة المألوفة: شعار، ألوان، تغليف، وظهور يومي.",
            en: "A clearer, more modern presence that keeps the brand's familiar spirit: mark, colors, packaging, and daily touchpoints." } },
  { ar: "بوّابة عودة الملكة", en: "Queen's Retreat Portal", date: "2026-05", cat: "tech", seed: "aliphT1",
    desc: { ar: "موقع ونظام تسجيل لخلوة عودة الملكة: صفحة هبوط، استمارة، ولوحة متابعة للمشرفين.",
            en: "A site and registration system for the Queen's Retreat: landing page, form, and an organiser dashboard." },
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
    } },
  { ar: "مواسم الزيتون", en: "Olive Seasons", date: "2026-04", cat: "creative", seed: "aliph02",
    desc: { ar: "توثيق بصري لموسم القطف من الحقل إلى المعصرة، بهويّة لونيّة واحدة وقصص يوميّة.",
            en: "A visual record of the harvest from field to press — one tonal identity and daily stories." } },
  { ar: "ورشة الخط", en: "Calligraphy Workshop", date: "2026-03", cat: "events", seed: "aliph03",
    desc: { ar: "ورشة مفتوحة في الاستوديو: برنامج، مطبوعات، وتغطية كاملة لليومين.",
            en: "An open workshop at the studio: program, printed matter, and full two-day coverage." } },
  { ar: "حارة النصارى", en: "Christian Quarter", date: "2026-03", cat: "creative", seed: "aliph04",
    desc: { ar: "سلسلة مصوّرة عن تفاصيل الحارة ووجوهها، بالأبيض والأسود.",
            en: "A photographed series on the quarter's details and faces, in black and white." } },
  { ar: "دفتر الحضور", en: "Attendance Book", date: "2026-02", cat: "tech", seed: "aliphT2",
    desc: { ar: "تطبيق حضور للفعاليّات يعمل من الهاتف: مسح رمز، تسجيل فوري، وتقرير في نهاية اليوم.",
            en: "A phone-first event check-in app: scan a code, log instantly, and get a report at day's end." },
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
    } },
  { ar: "مقهى الجبل", en: "Mountain Café", date: "2026-02", cat: "identity", seed: "aliph05",
    desc: { ar: "هويّة كاملة لمقهى صغير: اسم، شعار، قائمة، ولوحة واجهة.",
            en: "A complete identity for a small café: name, mark, menu, and shopfront." } },
  { ar: "معرض التراث", en: "Heritage Fair", date: "2026-02", cat: "events", seed: "aliph06",
    desc: { ar: "تنظيم معرض ثلاثة أيام: توزيع المساحة، لافتات، وتوثيق مصوّر.",
            en: "A three-day fair: spatial layout, signage, and photographic documentation." } },
  { ar: "سوق البلدة", en: "Old Town Market", date: "2026-01", cat: "creative", seed: "aliph07",
    desc: { ar: "حملة إعلانيّة كاملة لإحياء السوق القديم: مفهوم، تصوير، وإدارة منصّات لثلاثة أشهر.",
            en: "A full campaign to revive the old market: concept, photography, and three months of channel management." } },
  { ar: "جبل الزيتون", en: "Mount of Olives", date: "2026-01", cat: "creative", seed: "aliph08",
    desc: { ar: "لقطات من الجبل عند الفجر — مادّة أساس لمكتبة الصور.",
            en: "Shots from the mount at first light — base material for the image library." } },
  { ar: "متجر بنيان", en: "Bunyan Shop", date: "2025-11", cat: "tech", seed: "aliphT3",
    desc: { ar: "متجر إلكتروني بسيط لمنتجات المؤسّسة: كتالوج، سلّة، ودفع محلّي.",
            en: "A simple storefront for the foundation's products: catalogue, cart, and local payment." },
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
    } },
  { ar: "ليالي رمضان", en: "Ramadan Nights", date: "2025-10", cat: "events", seed: "aliph09",
    desc: { ar: "فعاليّة مجتمعيّة على مدار الشهر: برنامج، هويّة للفعاليّة، وتغطية يوميّة.",
            en: "A month-long community event: program, event identity, and daily coverage." } },
  { ar: "البلدة القديمة", en: "The Old City", date: "2025-09", cat: "creative", seed: "aliph10",
    desc: { ar: "أرشيف مصوّر للأزقّة والأبواب، صُوّر على مدار فصلين.",
            en: "A photographic archive of alleys and doorways, shot across two seasons." } },
  { ar: "مهرجان الصيف", en: "Summer Festival", date: "2025-08", cat: "events", seed: "aliph11",
    desc: { ar: "مهرجان مفتوح: هويّة بصريّة، لافتات موقع، وتوثيق مباشر.",
            en: "An open-air festival: visual identity, site signage, and live documentation." } },
  { ar: "دار الأيتام", en: "Orphanage Campaign", date: "2025-06", cat: "creative", seed: "aliph12",
    desc: { ar: "حملة تبرّعات هادئة تعتمد على الحكاية لا على الصخب.",
            en: "A quiet fundraising campaign built on story rather than volume." } },
  { ar: "مطعم الديوان", en: "Al-Diwan Restaurant", date: "2025-05", cat: "identity", seed: "aliph13",
    desc: { ar: "هويّة مطعم: شعار، قوائم، قرطاسيّة، ونظام لافتات.",
            en: "A restaurant identity: mark, menus, stationery, and a signage system." } },
  { ar: "لوحة المواسم", en: "Seasons Dashboard", date: "2025-04", cat: "tech", seed: "aliphT4",
    desc: { ar: "لوحة داخليّة تجمع أرقام الحملات من كل المنصّات في شاشة واحدة.",
            en: "An internal dashboard pulling campaign numbers from every channel onto one screen." },
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
    } },
  { ar: "أسبوع التصميم", en: "Design Week", date: "2025-03", cat: "events", seed: "aliph14",
    desc: { ar: "برنامج أسبوع كامل: جدول، مطبوعات، وتغطية للجلسات.",
            en: "A week-long program: schedule, printed matter, and session coverage." } },
  { ar: "افتتاح المكتبة", en: "Library Opening", date: "2024-11", cat: "events", seed: "aliph15",
    desc: { ar: "افتتاح مكتبة الحيّ: دعوات، لافتات، وتوثيق الليلة.",
            en: "A neighbourhood library opening: invitations, signage, and coverage of the night." } },
  { ar: "حملة التخرّج", en: "Graduation Campaign", date: "2024-09", cat: "creative", seed: "aliph16",
    desc: { ar: "حملة موسميّة للجامعات: مفهوم، تصوير، ونشر على المنصّات.",
            en: "A seasonal campaign for universities: concept, photography, and channel rollout." } },
  { ar: "بيت الشباب", en: "Youth House", date: "2024-07", cat: "identity", seed: "aliph17",
    desc: { ar: "هويّة مرنة لمركز شبابي، تتحمّل أيدي كثيرة وتظلّ متماسكة.",
            en: "A flexible identity for a youth centre — it survives many hands and stays coherent." } },
  { ar: "نادي القراءة", en: "Reading Club", date: "2024-05", cat: "creative", seed: "aliph18",
    desc: { ar: "محتوى شهري لنادي قراءة: أغلفة، اقتباسات، ومنشورات.",
            en: "Monthly content for a reading club: covers, pull quotes, and posts." } },
  { ar: "عرس فلسطيني", en: "Palestinian Wedding", date: "2024-03", cat: "creative", seed: "aliph19",
    desc: { ar: "توثيق عرس كامل من التحضير إلى آخر رقصة.",
            en: "A full wedding documented from preparation to the last dance." } },
];

/* the archive is one continuous run — newest first, no year sections */
const byDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

const MONTHS = {
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيّار", "حزيران",
       "تمّوز", "آب", "أيلول", "تشرين الأوّل", "تشرين الثاني", "كانون الأوّل"],
  en: ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"],
};

/* marquee items — the four services link to the services section */
const MQ_ITEMS = [
  { key: "svc1", target: "identity" },
  { key: "svc2", target: "creative" },
  { key: "svc3", target: "events" },
  { key: "svc4", target: "tech" },
];

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
  { seed: "aliphf1", svc: "identity", cap: { ar: "مؤسّسة بنيان — هويّة", en: "Bunyan — identity" } },
  { seed: "aliphf5", svc: "creative", cap: { ar: "سوق البلدة — حملة", en: "Old Town Market — campaign" } },
  { seed: "aliphf7", svc: "events",   cap: { ar: "ليالي رمضان — فعاليّة", en: "Ramadan Nights — event" } },
  { seed: "aliphf9", svc: "tech",     cap: { ar: "عودة الملكة — منصّة", en: "Queen's Retreat — platform" } },
];
const SERVICE_FRAMES = { identity: 0, creative: 1, events: 2, tech: 3 };
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
  document.querySelectorAll(".sc-idx[data-num]").forEach((el) => {
    el.textContent = num(el.dataset.num);
  });
  document.querySelectorAll(".story-index").forEach((el, i) => {
    el.textContent = num("0" + (i + 1));
  });

  svcSlider.render();
  renderLibrary();
  renderServiceSections();
  projectSheet.refresh();
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
  const SVC_TAG = { identity: "IDENTITY", creative: "CREATIVE", events: "EVENTS", tech: "TECHNOLOGY" };

  let items = [], idx = 0, busy = false;

  const rtl = () => document.documentElement.dir === "rtl";
  const stampRot = () => (rtl() ? -7 : 7);
  const svcName = (id) => {
    const c = CATS.find((c) => c.id === id);
    return c ? c[lang] : "";
  };

  function pick(catId) {
    return PROJECTS.filter((p) => p.cat === catId).sort(byDate).slice(0, SLIDER_MAX);
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
    /* the separator is punctuation, not content — aria-hidden here too, or
       the repaint silently drops what the static markup declares */
    elMeta.innerHTML =
      `<span class="sl-date">${fmtDate(p.date)}</span>` +
      `<span class="sl-sep" aria-hidden="true">·</span>` +
      `<span class="sl-cat">${svcName(p.cat)}</span>`;
    elDesc.textContent = p.desc ? p.desc[lang] : "";
    elIndex.textContent = num(String(idx + 1).padStart(2, "0"));
    elTotal.textContent = num(String(items.length).padStart(2, "0"));
    elCap.textContent = p[lang];
    elTag.textContent = SVC_TAG[currentService] || "";
    elBar.style.transform = `scaleX(${(idx + 1) / items.length})`;
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

/* ══════════ hero dropcap: the paper uncrumples ══════════
   A 24-frame sprite baked from the crumple clip (blue surround keyed out,
   green paper face replaced with the letter, everything re-lit into the
   ink/cream palette with the original fold shading kept). GSAP scrubs a
   frame index and we set background-position — no video decode, no
   runtime chroma key, one 150KB image.
   Frame 0 is the tight ball, frame 23 the flat printed sheet. */
/* `crushed` is the tight ball, `rest` the flat printed sheet. Hover runs the
   whole way back to the ball — stopping part-way just looked like a sheet
   that had failed to open. */
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
  /* ease "none" — the frames are already evenly spaced in time, so any
     easing here would fight the motion baked into the clip */
  const play = (to, dur) => gsap.to(st, {
    f: to, duration: dur, ease: "none", overwrite: true,
    onUpdate: () => setFrame(st.f),
  });

  /* don't start until the sprite has actually decoded, or the first frames
     land on an empty background */
  const src = getComputedStyle(sheet).backgroundImage.slice(5, -2);
  const img = new Image();
  const start = () => gsap.delayedCall(0.55, () => play(CRUMPLE.rest, 0.95));
  img.onload = start;
  img.onerror = start;
  img.src = src;

  /* hover scrunches it part-way shut and lets it fall open again */
  /* crush it right down to the ball, then let it fall open again. the two
     durations are deliberately different — crushing paper is faster than
     it relaxing back open */
  cap.addEventListener("mouseenter", () => play(CRUMPLE.crushed, 0.5));
  cap.addEventListener("mouseleave", () => play(CRUMPLE.rest, 0.85));
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

/* the run is continuous — sorted newest first with no year grouping. a project
   that carries a `profile` gets an "open the sheet" affordance and its index in
   PROJECTS on the node, which is how the overlay finds it again. */
function renderLibrary() {
  if (!accRoot) return;
  accRoot.innerHTML = "";
  CATS.forEach((cat) => {
    const items = (cat.id === "all" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat.id))
      .slice().sort(byDate);

    const panel = document.createElement("section");
    panel.className = "acc-panel" + (cat.id === openCat ? " open" : "");
    panel.dataset.cat = cat.id;

    const hasProfile = (p) => !!p.profile;
    const at = (p) => PROJECTS.indexOf(p);

    const tiles = items.map((p) => `
      <figure class="tile${hasProfile(p) ? " has-profile" : ""}"${hasProfile(p) ? ` data-project="${at(p)}" role="button" tabindex="0"` : ""}>
        <div class="tile-img">
          <img src="https://picsum.photos/seed/${p.seed}/600/400" alt="${p[lang]}" loading="lazy">
          ${hasProfile(p) ? `<span class="tile-open" aria-hidden="true">${I18N.pfOpen[lang]}</span>` : ""}
        </div>
        <figcaption><span>${p[lang]}</span><span class="t-date">${fmtDate(p.date)}</span></figcaption>
      </figure>`).join("");

    const rows = items.map((p) => `
      <div class="lib-list-row${hasProfile(p) ? " has-profile" : ""}"${hasProfile(p) ? ` data-project="${at(p)}" role="button" tabindex="0"` : ""}>
        <span>${p[lang]}</span><span class="t-date">${fmtDate(p.date)}</span>
      </div>`).join("");

    panel.innerHTML = `
      <button class="spine" aria-expanded="${cat.id === openCat}">
        <span class="spine-name">${cat[lang]}</span>
      </button>
      <div class="panel-body">
        <div class="panel-head">
          <h2>${cat[lang]}</h2>
        </div>
        <div class="lib-run">
          <div class="lib-grid">${tiles}</div>
          <div class="lib-list">${rows}</div>
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

/* delegated once on the root, which survives every re-render */
if (accRoot) {
  accRoot.addEventListener("click", (e) => {
    const node = e.target.closest("[data-project]");
    if (node) projectSheet.open(+node.dataset.project);
  });
  accRoot.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const node = e.target.closest("[data-project]");
    if (!node) return;
    e.preventDefault();
    projectSheet.open(+node.dataset.project);
  });
}

/* ══════════ project profile sheet ══════════
   A cream broadsheet page that rises over the archive: cover + title, a big
   screenshot with a thumb strip, a details table, and the write-up. Sites also
   get a browser-chrome frame running a real preview build.
   Only projects carrying a `profile` open it, so the other services can be
   given one later without touching this code. */
const projectSheet = (() => {
  const root = document.getElementById("sheet");
  if (!root) return { open() {}, close() {}, refresh() {} };

  const el = (id) => document.getElementById(id);
  const sheet = root.querySelector(".sheet");
  const shot = el("sheetShot");
  const thumbs = el("sheetThumbs");
  const webview = el("webview");
  const wvFrame = el("wvFrame");

  let current = null, shotIdx = 0, lastFocus = null;

  const shotSrc = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

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
          <img src="https://picsum.photos/seed/${s.seed}/900/1150" alt="" loading="lazy">
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

/* ══════════ boot ══════════ */
applyI18n();
initDropCap();
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
