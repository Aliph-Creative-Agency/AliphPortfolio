/* ALIPH prototype v05 — i18n, film strip, why-aliph, what-we-do, contact */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
gsap.registerPlugin(ScrollTrigger);

/* ══════════ media holders ══════════
   Every photograph on this site is still to come from the studio, so
   there is nothing to load yet. This is the stand-in.

   ⚠️ It is an <img> with an inline SVG data URI, NOT a <div>. Every
   image on the site is styled through `img` selectors — object-fit,
   the grayscale grade, the sizing — and swapping the element type
   silently drops all of it. This way the markup, the alt text and the
   cascade are exactly what they will be once real photographs land:
   the only thing that changes then is the src.

   ⚠️ Do NOT go back to an external placeholder service. The previous
   one (picsum.photos) meant 20+ third-party requests per page, was
   rate-limited constantly, and left the page full of empty frames on
   a phone — see the loading notes in HANDOFF.md. An empty `src=""` is
   not an option either: it re-requests the document itself. */
const HOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'" +
  " preserveAspectRatio='none'%3E%3Crect width='4' height='3' fill='%23c6c5ba'/%3E%3C/svg%3E";

/* Paint one media holder. The remodelled sections hold work in four formats —
   a horizontal film, a vertical reel, a poster and a still — so a holder has
   to be able to become a <video> as well as an <img>.

   ⚠️ A holder only ever plays while it is on screen, and never preloads. The
   Drive's horizontal videos are 55–384 MB; four of those autoplaying would
   undo every phone fix from session 8 on its own. Poster frame first, bytes
   only if the visitor actually scrolls to it.

   Real media hasn't landed yet, so `item.src`/`item.video` are absent today
   and every holder paints HOLDER — but into the element the real asset will
   use, so landing the media stays a src change, not a markup change. */
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
    ar: "لِف استوديو يبدأ من الحرف الأوّل. لكل علامةٍ نقطة أصلٍ تُبنى منها وتعود إليها، وعملنا هو العثور على تلك النقطة، ثم رسم النظام كاملًا منها: الاسم، والهويّة، والصوت، والطريقة التي تظهر بها العلامة في العالم. نصمّم، ونصوّر، ونبرمج المواقع والأنظمة التي تُشغّلها — من الألِف إلى الياء.",
    en: "liph is a studio that begins at the first letter. Every brand has an origin point it is built from and returns to; our work is finding that point, then drawing the whole system from it: the name, the identity, the voice, and the way the brand shows up in the world. We design, we shoot, and we build the sites and systems that run it all. From A to Z.",
  },
  /* the dropcap letter is baked into the crumple sprite; this is the copy
     screen readers get */
  dropLetter: { ar: "أ", en: "A" },
  heroMeta1: { ar: "منذ ٢٠٢٤", en: "Since 2024" },
  heroMeta2: { ar: "القدس — جبل الزيتون", en: "Jerusalem — Mount of Olives" },
  heroMeta3: { ar: "تصميم · تصوير · برمجة", en: "Design · Film · Engineering" },
  btnWork: { ar: "كل الأعمال", en: "ALL WORK" },
  btnAbout: { ar: "تعرّف على ألِف", en: "Get to know Aliph" },

  /* services */
  svcBanner: { ar: "ماذا نفعل؟", en: "What we do?" },
  svc1: { ar: "تصميم", en: "Design" },
  svc2: { ar: "تصوير", en: "Film & Photography" },
  svc3: { ar: "برمجة", en: "Engineering" },

  /* the example switcher under "what we do" */
  swPrev: { ar: "المثال السابق", en: "Previous example" },
  swNext: { ar: "المثال التالي", en: "Next example" },

  /* why aliph — three editorial blocks, each carrying real work in its
     media holders. The essay runs beside the portfolio rather than after it. */
  storyBanner: { ar: "لماذا ألِف؟", en: "Why Aliph?" },

  w1Title: { ar: "صوت واحد، حرفان، ولغتان.", en: "One sound, two letters, two languages." },
  w1Para: {
    ar: "يستمدّ ألِف اسمه من الألف: أوّل حروف الأبجدية العربية، والنقطة التي تبدأ منها كل كلمة، والمقياس الذي تُرسم عليه بقيّة الحروف. ويحمل الاسم معنًى ثانيًا: أَلِفَ، أي اعتاد واطمأنّ واقترب. لذلك يقف الاستوديو عند المعنيين معًا: ثقة الخطوة الأولى، ودفء الشيء المألوف. بدأنا سنة ٢٠٢٤ من غرفة واحدة في جبل الزيتون، بكاميرا واحدة وفكرة واحدة: أنّ العلامة ليست شعارًا يُرسم بل نظامًا يُبنى. منذ ذلك الحين ونحن نشتغل بالعربيّة أوّلًا — ليست ترجمةً تُضاف بعد أن يجهز التصميم، بل اللغة التي يُرسم عليها النظام من السطر الأوّل. نشتغل على الهويّات وما يُطبع منها، ونصوّر ما تحتاجه العلامة لتظهر، ونبرمج المواقع والأنظمة التي تُشغّلها — ثلاثة أعمال تبدو منفصلة على الورق، لكنها في الاستوديو خطّ واحد لا ينقطع. ولأنّ الفريق صغير، تبقى المسافة بين الفكرة وتنفيذها قصيرة: يُقرَّر الشيء في الصباح ويُجرَّب في المساء، ولا ينتظر دوره في طابور بين أقسام.",
    en: "Aliph takes its name from the alif: the first letter of the Arabic alphabet, the point every word starts from, and the measure the other letters are drawn against. The name carries a second meaning too — alifa, to grow familiar, to draw near, to be at ease. So the studio stands on both: the confidence of the first step, and the warmth of the familiar. We started in 2024 out of one room on the Mount of Olives, with one camera and one idea: that a brand is not a logo you draw but a system you build. We have worked Arabic-first ever since — not a translation added once the design is finished, but the language the system is drawn in from the first line. We work on identities and everything printed from them, shoot what a brand needs in order to appear, and build the sites and systems that keep it running — three jobs that look separate on paper and are one unbroken line inside the studio. And because the team is small, the distance between an idea and its execution stays short: a thing is decided in the morning and tried the same evening, rather than queuing between departments.",
  },
  w1Cap: { ar: "من جلسة تصوير — البلدة القديمة", en: "From a shoot — the Old City" },

  w2Title: { ar: "نبحث عن النقطة، ثم نرسم النظام.", en: "We find the point, then draw the system." },
  /* block 2 — row A, two paragraphs so the column sets like a news column */

  /* block 2 — row C */

  w3ParaA: {
    ar: "لا نسلّم شعارًا ونمضي. نسلّم نظامًا يعرف كيف يتصرّف: في المطبوع، وعلى الشاشة، وفي الشارع، وبين يديّ من يستعمله كل يوم. وحين ينتهي العمل، يُختم بختم الاستوديو — علامة ملكيّة صغيرة تقول إن هذا العمل خرج من هنا.",
    en: "We don't hand over a logo and walk away. We hand over a system that knows how to behave: in print, on screen, in the street, and in the hands of whoever uses it daily. And when the work is done, it carries the studio's seal — a small mark of authorship saying this came from here.",
  },
  w3ParaB: {
    ar: "والاختبار الحقيقي يأتي بعد التسليم بسنة: حين تُطبع لافتة لم نرها، ويُكتب منشور لم نكتبه، وتُصوَّر جلسة لم نحضرها — ويظلّ الكلّ يشبه بعضه. ذلك وحده يقول إن النظام اشتغل، لا الإعجاب الذي يناله العرض التقديمي في يومه الأوّل.",
    en: "The real test arrives a year after handover: when a sign gets printed that we never saw, a post goes out that we never wrote, a shoot happens we were not at — and all of it still looks like the same brand. That, on its own, says the system worked; not the applause a deck gets on the day it is shown.",
  },
  w3ParaC: {
    ar: "لذلك نكتب القواعد بلغة من سيستعملها، لا بلغة المصمّمين. نقول: هذا الشعار لا يوضع على صورة مزدحمة، وهذا اللون لا يُستعمل للنصّ الصغير، وهذه المسافة لا تُقلّ عن كذا — بأمثلة تُرى لا بمصطلحات تُحفظ. النظام الذي لا يُفهم لا يُتّبع، ومهما كان مدروسًا فإنّه ينهار في الشهر الثالث.",
    en: "So we write the rules in the language of whoever will use them, not in the language of designers. This mark does not go on a busy photograph; this colour is not used for small text; this margin never goes below so much — shown as examples rather than stated as terms. A system nobody understands is a system nobody follows, and however considered it is, it collapses by the third month.",
  },

  w3Para2A: {
    ar: "ونحن فريق صغير عن قصد: من تُحدّثه في الاجتماع الأوّل هو نفسه من يعمل على مشروعك، ولا يمرّ العمل عبر طبقات حتى يفقد ما بدأ به. نصمّم ونصوّر ونبرمج تحت سقف واحد، فلا يضيع شيء في الانتقال من يدٍ إلى يد.",
    en: "And we are small on purpose: the person you meet first is the person who does the work, and nothing passes through so many hands that it loses what it started as. We design, shoot and build under one roof, so nothing is lost handing off.",
  },
  w3Para2B: {
    ar: "ومعنى ذلك أيضًا أنّنا نختار المشاريع التي نستطيع أن نمنحها ما تستحقّه من وقت، وأنّنا نقول «لا» أكثر ممّا يتوقّع أحد من استوديو في سنته الثانية. الرفض هنا ليس ترفًا؛ هو الطريقة الوحيدة التي يبقى بها العمل الذي نقبله على مستوى واحد.",
    en: "It also means we take on the projects we can give the time they deserve, and that we say no more often than anyone expects of a studio in its second year. Refusing is not a luxury here; it is the only way the work we do accept stays at one level.",
  },
  w3Para2C: {
    ar: "وحين ينتهي المشروع لا تنتهي العلاقة. تبقى الملفّات مرتّبة ومسلَّمة كاملةً بلا رهائن، ويبقى الباب مفتوحًا للسؤال بعد شهر أو بعد سنة. العلامة التي بنيناها معكم تكبر بعدنا، وهذا هو المقصود منها أصلًا.",
    en: "And when a project ends the relationship doesn't. The files stay ordered and are handed over in full with nothing held hostage, and the door stays open for a question a month or a year later. The brand we built with you grows after us — which was the point of building it that way.",
  },

  w3ParaD: {
    ar: "ونقيس ما نستطيع قياسه. كم استغرق الموظّف الجديد حتى أخرج منشورًا صحيحًا وحده؟ كم مرّة اضطرّ أحد أن يسأل عن اللون؟ كم ملفًّا خرج خارج القالب؟ هذه أرقام مملّة، لكنها تقول عن صحّة النظام أكثر ممّا يقوله أيّ إعجاب.",
    en: "And we measure what can be measured. How long before a new employee produced a correct post on their own? How many times did someone have to ask about a colour? How many files went out off-template? These are boring numbers, and they say more about the health of a system than any compliment does.",
  },
  w3ParaE: {
    ar: "وما لا يُقاس نحكم عليه بالعين وحدها: هل يبدو المطبوع وكأنّه خرج من المكان نفسه الذي خرج منه الموقع؟ هل الصورة التي التُقطت الشهر الماضي تجلس بجانب صورة السنة الماضية دون أن تفضحها؟ الاتّساق شعور قبل أن يكون قاعدة.",
    en: "And what can't be measured we judge by eye alone: does the printed piece look like it came from the same place as the site? Does a photograph taken last month sit beside one from last year without showing it up? Consistency is a feeling before it is a rule.",
  },
  w3ParaF: {
    ar: "ولذلك نُبقي النظام مفتوحًا للنموّ لا مغلقًا على نفسه: مساحة للألوان التي ستُضاف، ولخدمة لم تبدأ بعد، ولفرعٍ في مدينة أخرى. الهويّة التي لا تتّسع لما لم يحدث بعد تصبح قيدًا في السنة الثالثة.",
    en: "So we keep the system open to growth rather than sealed: room for colours that will be added, for a service that hasn't started, for a branch in another city. An identity with no room for what hasn't happened yet becomes a constraint by year three.",
  },

  w3Para2D: {
    ar: "ونحبّ العمل الطويل أكثر من العمل السريع. المشروع الذي نعود إليه كل موسم نعرف تفاصيله كما يعرف صاحبه، ونستطيع أن نقترح قبل أن يُطلب منّا. أمّا العمل الذي يمرّ مرّة واحدة فيبقى مهما أُتقن غريبًا عن صاحبه قليلًا.",
    en: "And we prefer long work to fast work. A project we come back to each season we know as well as its owner does, and we can suggest things before being asked. Work that passes through once stays, however well made, a little foreign to the person who owns it.",
  },
  w3Para2E: {
    ar: "ونكتب كل شيء. القرار الذي اتُّخذ في مكالمة يُدوَّن في السطر التالي، والسبب معه — لأنّ السؤال «لماذا فعلنا هذا؟» يأتي دائمًا، وغالبًا بعد أن ينسى الجميع. الذاكرة المكتوبة هي ما يجعل الفريق الصغير يتصرّف كفريق كبير.",
    en: "And we write everything down. A decision taken on a call is recorded in the next line, with its reason — because the question \u201cwhy did we do this?\u201d always comes, usually after everyone has forgotten. Written memory is what lets a small team behave like a large one.",
  },
  w3Para2F: {
    ar: "وفي النهاية، المقياس واحد: أن ينظر صاحب العلامة إلى ما بين يديه فيقول إنّ هذا يشبهه — لا أنّه جميل، ولا أنّه عصري، بل أنّه يشبهه. كل ما نفعله قبل ذلك خدمةٌ لهذه الجملة.",
    en: "And in the end there is one measure: that the owner looks at what is in their hands and says it looks like them — not that it is beautiful, not that it is modern, but that it looks like them. Everything we do before that is in service of that one sentence.",
  },
  /* the wide short line that crosses the whole left region in block 2 */
  /* the column sitting under the tall rail */
  /* Block 2 is ONE body of copy that wraps around the two floated
     pictures — not three columns sitting beside them. Merged from the
     old w2ParaA/A2/A3/B/C/C2/C3 on 2026-08-09 at the user's request. */
  w2Body: {
    ar: "لكل علامة نقطة أصل تُبنى منها وتعود إليها. عملنا هو العثور على تلك النقطة أوّلًا — في الاسم، أو في الحكاية، أو في المكان — ثم رسم النظام كاملًا منها: الشعار، والألوان، والخط، والصوت، وطريقة الظهور اليوميّة. لا نبدأ من الشكل، بل ننتهي إليه. الشعار الذي يخرج في الأسبوع الأوّل يكون غالبًا شعارًا جميلًا لا يخصّ أحدًا؛ والذي يخرج بعد أن نفهم من أين تبدأ العلامة يصعب تخيّلها بغيره. ونعرض مبكرًا وبصوت مرتفع: مسوّدة في الأسبوع الأوّل خير من عرضٍ مكتمل في الشهر الثالث، لأنّ التصحيح وقتها لا يزال رخيصًا. أسوأ ما يحدث لمشروع أن يُبنى كاملًا في الظلّ ثم يُكشف مرّةً واحدة. ولأنّ النقطة لا تُعطى في اجتماع، نبدأ بالأسئلة المملّة: من يشتري؟ ومتى؟ وما الذي يُقال عنكم حين لا تكونون في الغرفة؟ من هناك تخرج المسوّدات الأولى، وتُجرّب على الورق قبل الشاشة، ويُرمى منها أكثر ممّا يُبقى — وهذا وحده ما يجعل ما يبقى يستحقّ أن يُرى. ثم يثبّت النظام نفسه: حبر أزرق عميق يمسك البنية، وكريمي دافئ يمنحها مساحة للتنفّس، ودرجات من الطين والزيتون حولهما. الخطّ من عائلة Idris — قسوة حادّة للعناوين، وقسوة مسطّحة للنصوص. وما يُسلَّم ليس ملفًّا واحدًا بل دفتر كامل: مقاسات، ومسافات، وأمثلة لما يُفعل وما لا يُفعل — حتّى يستطيع من يأتي بعدنا أن يكمل من حيث وقفنا دون أن يسأل. ولا نصمّم شيئًا لا نعرف كيف يُصنع. نسأل عن المطبعة قبل أن نرسم، وعن الشاشة قبل أن نلوّن، وعن اليد التي ستمسك الملفّ بعد شهر. النظام الذي لا يمكن تنفيذه ليس نظامًا، بل رأي جميل.",
    en: "Every brand has an origin point it is built from and returns to. Our work is to find that point first — in the name, the story, or the place — then draw the whole system from it: the mark, the colors, the type, the voice, and the everyday appearance. We don't start at the form; we arrive at it. A mark drawn in the first week is usually a handsome mark that belongs to nobody. One drawn after we understand where the brand begins is hard to imagine it without. And we show early and out loud: a rough draft in the first week beats a finished presentation in the third month, because at that point correcting it is still cheap. The worst thing that happens to a project is being built whole in the dark and revealed all at once. And because the point is never handed to you in a meeting, we begin with the boring questions: who buys, when, and what gets said about you when you are not in the room. Then the system settles: a deep ink blue holds the structure, a warm cream gives it room to breathe, and tones of clay and olive sit around them. The type is the Idris family — a sharp cut for headlines, a flat cut for text. What gets handed over is not one file but a whole book: sizes, spacing, and worked examples of what to do and what not to do — so whoever comes after us can carry on from where we stopped without having to ask. And we don't design anything without knowing how it gets made. We ask about the press before drawing, about the screen before colouring, and about the hands that will hold the file a month later. A system that cannot be produced isn't a system — it's a handsome opinion.",
  },
  w2Rail: {
    ar: "الملصق يُقرأ من عشرة أمتار ثم من نصف متر: يقول شيئًا واحدًا من بعيد، ويكافئ من اقترب بتفصيلٍ لم يره أوّل مرّة. ولأنّه يُطبع مرّةً واحدة، نعامله معاملة ما لا يُصحّح: نختبر الأحجام على الجدار قبل المطبعة، ونقرأ النصّ بصوتٍ عالٍ، ونسأل من لم يره من قبل عمّا فهمه في أوّل ثانيتين.",
    en: "A poster is read from ten metres, then from half a metre: it says one thing from far away, and rewards whoever steps closer with a detail they missed.",
  },
  w2Cap1: { ar: "تجارب الخط", en: "Type trials" },
  w2Cap2: { ar: "المطبوعات", en: "Printed matter" },
  w2Cap3: { ar: "ملصق — ليالي رمضان", en: "Poster — Ramadan Nights" },

  w3Title: { ar: "أن تبدو النتيجة حتميّة.", en: "That the result feels inevitable." },
  w3Cap: { ar: "الختم على العمل", en: "The seal on the work" },
  whyOutro: {
    ar: "الحكاية كاملةً — كيف بدأ الاستوديو، وكيف نشتغل، وما الذي نقيس عليه عملنا.",
    en: "The whole story — how the studio started, how we work, and what we measure the work against.",
  },

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

/* one section per service on the about page — what we do, why us, and the
   concrete deliverables underneath */
const SERVICES = [
  {
    id: "design", tag: "DESIGN", seed: "aliph-svc1",
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
    id: "photo", tag: "FILM & PHOTO", seed: "aliph-svc2",
    what: {
      ar: "نصوّر ما تحتاجه العلامة لتظهر: جلسات ثابتة للمنتج والمكان والوجوه، وفيديو أفقي للحملات والتعريف، وريلز عموديّة للمنصّات. ومعها التوثيق الكامل للفعاليّات — من أوّل ساعة تجهيز إلى آخر ضيف يغادر.",
      en: "We shoot what a brand needs in order to appear: stills of the product, the place and the faces; horizontal video for campaigns and profiles; vertical reels for the feed. And full coverage of events — from the first hour of setup to the last guest leaving.",
    },
    why: {
      ar: "لأنّ الصورة التي تُلتقط داخل الهويّة تبدو مختلفة عن الصورة التي تُلصق عليها. نحن نعرف علامتك من الداخل، غالبًا لأننا من بناها، فكل لقطة تخرج من النظام نفسه لا من خارجه. وهذا تحديدًا تاريخنا الأطول: التصوير هو ما كنّا نفعله قبل أن نصير استوديو كاملًا.",
      en: "Because a frame shot inside the identity looks different from a frame stuck onto it. We know your brand from the inside, often because we built it, so every shot comes out of the same system rather than beside it. And this is where our longest history is: photography is what we did before we became a full studio.",
    },
    does: {
      ar: ["تصوير المنتج والمكان", "بورتريه ووجوه", "فيديو أفقي وتعريفي", "ريلز عموديّة", "تغطية الفعاليّات", "المونتاج والتلوين"],
      en: ["Product & place photography", "Portraiture", "Horizontal & profile video", "Vertical reels", "Event coverage", "Edit & grade"],
    },
  },
  {
    id: "tech", tag: "ENGINEERING", seed: "aliph-svc3",
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
  { id: "design", ar: "تصميم", en: "Design" },
  { id: "photo", ar: "تصوير", en: "Film & Photography" },
  { id: "tech", ar: "برمجة", en: "Engineering" },
];

/* Each service is shown through its subcategories: the example switcher under
   "what we do" steps through these, not through projects. `desc` is the line
   that speaks about the category and the subcategory together. */
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

/* Every project carries a one-line brief so the "latest work" slider on the
   home page can speak about whichever piece is on screen (placeholder copy).
   `date` is "YYYY-MM" — the archive is one continuous run, newest first, with
   no year sections and no piece counts anywhere.
   Technical-solutions entries additionally carry a `profile`, which is what
   opens the preview sheet (screenshots + details, plus a live preview for
   sites). Any project given a `profile` gets the sheet, so the other three
   services can be extended the same way later. */
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
      ar: "ورشة مفتوحة في الاستوديو: برنامج، مطبوعات، وتغطية كاملة لليومين.",
      en: "An open workshop at the studio: program, printed matter, and full two-day coverage."
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

/* the archive is one continuous run — newest first, no year sections */
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

const BAND_SPEED = 40;

let bandTween = null;

/* The group stays 4 frames — it is matched to the film tile, whose width is
   one group and whose sprocket pattern repeats in lockstep with it. Re-cutting
   the tile to 3 is a separate job (see resources/recut_film.py), so with three
   services photography takes two of the four slots. */
const FILM_FRAMES = [
  { seed: "aliphf1", svc: "design", cap: { ar: "مؤسّسة بنيان — هويّة", en: "Bunyan — identity" } },
  { seed: "aliphf5", svc: "photo", cap: { ar: "سوق البلدة — حملة", en: "Old Town Market — campaign" } },
  { seed: "aliphf7", svc: "photo", cap: { ar: "ليالي رمضان — تغطية", en: "Ramadan Nights — coverage" } },
  { seed: "aliphf9", svc: "tech", cap: { ar: "عودة الملكة — منصّة", en: "Queen's Retreat — platform" } },
];
const SERVICE_FRAMES = { design: 0, photo: 1, tech: 3 };
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
      `<img src="${HOLDER}" alt="">` +
      `<figcaption>${fr.cap[lang]}</figcaption>`;
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
   The contact band and the film strip both run continuously and never stop —
   including while you are scrolled a page and a half past them.
   Each one is a composited layer being retransformed every single frame, and
   on a phone that competes directly with the scroll itself. Desktop GPUs
   absorb it; phones are exactly where it shows up as "laggy when scrolling
   fast."

   The tween is PAUSED, not killed: resuming keeps x where it was, so nothing
   jumps when the strip scrolls back into view. `rootMargin` starts it again
   slightly before the edge so it is already moving by the time it's visible.
   Returns a getter for the current state, because rebuildLoops() makes new
   tweens and a new tween starts playing whether or not anyone can see it. */
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

/* ══════════ hero film strip: seamless loop + hover-to-service sync ══════════
   the strip runs continuously in ONE direction at a CONSTANT speed. one group
   of 4 frames is cloned across the strip and the film background tile is sized
   to exactly one group, so translating by one period is pixel-identical — the
   tween restart is invisible. hovering a service glides to its frame and stops. */
const filmLoop = (() => {
  const SPEED = 34;               // px per second, constant
  let tween = null, period = 0, first = [], ready = false;
  /* the hero is the tallest thing on the page and the film is its widest
     layer — see pauseOffscreen() above for why this matters on a phone */
  let onScreen = true;

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

  /* ⚠️ ALWAYS null the handle when killing. gsap's kill() does not clear the
     reference, and a killed tween still answers truthy — so setVisible() would
     call resume() on a corpse and the strip would never move again. That was
     the "film strip stops randomly" bug: hovering a service pick killed the
     tween while the hero was off screen, and nothing could revive it. */
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
    /* Paused rather than killed, so x survives and the strip picks up exactly
       where it left off when the hero scrolls back into view. */
    setVisible(v) {
      if (v === onScreen) return;
      onScreen = v;
      /* no live tween to resume — build a fresh one rather than assuming one
         is merely paused (see stop() above) */
      if (!tween) { if (v) run(); return; }
      v ? tween.resume() : tween.pause();
    },
  };
})();

/* ══════════ ransom-note letters in the hero headline ══════════
   One letter per headline line is lifted out and set as a newspaper
   clipping — an ink chip carrying cream type, pasted in at an angle.

   ⚠️ ONLY the two verbs: نبدأ and تبدأ (and "start" in English). الأشياء and
   ألِف were ruled out by the user — don't add them back.

   ⚠️ ARABIC SHAPING — the thing that makes this dangerous. Pulling a letter
   into its own element can force the letters around it into isolated forms
   and visibly break the word. It is safe for these two for a specific
   reason, not by luck: in both نبدأ and تبدأ the letter before the أ is د,
   which never joins forward, so that أ was already rendering isolated.
   Measured: whole 90.25px vs split 90.27px.
   `splitSafe()` enforces the rule rather than trusting it, so if the copy
   ever changes to a word whose أ follows a joining letter (ب ت ن س ع …),
   that word is left whole instead of shattered. */
const RANSOM_WORDS = { ar: ["نبدأ", "تبدأ"], en: ["start"] };
/* Arabic letters that never connect to the letter following them. */
const NON_JOINING = new Set(["ا", "أ", "إ", "آ", "د", "ذ", "ر", "ز", "و", "ؤ", "ء", "ة"]);

function splitSafe(word, i) {
  /* Latin has no joining behaviour, so every split is safe. Without this the
     Arabic rule rejects "start" — "t" is not in the non-joining set. */
  if (!/[؀-ۿ]/.test(word)) return true;
  const joinedBefore = i > 0 && !NON_JOINING.has(word[i - 1]);
  const joinsAfter = i < word.length - 1 && !NON_JOINING.has(word[i]);
  return !joinedBefore && !joinsAfter;
}

/* The user's own clippings, cut from resources/ransom {arb,eng}.png by
   resources/cut_ransom.py — 16 torn scraps per language, each a different
   paper, typeface and colour.
   ⚠️ Some are red, purple, brown or blue-ruled, and the site's palette is
   ink + cream only with terracotta reserved. Using them all is the deliberate
   choice: a ransom note that matches isn't one. To restrict it to the
   neutral scraps, shorten this list — nothing else has to change. */
const RANSOM_COUNT = 16;
const pad2 = (n) => String(n).padStart(2, "0");

/** Wrap the target letter of the first matching word in its own clipping.
    `ring` is the sequence of scraps this letter will cycle through. */
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
       headline — only its pixels are replaced by the scrap */
    const sr = document.createElement("span");
    sr.className = "ransom-sr";
    sr.textContent = text[k];

    const img = document.createElement("img");
    img.src = "assets/img/ransom/" + lang + "-" + pad2(variant) + ".webp";
    img.alt = "";
    img.decoding = "async";
    /* If the scrap 404s, fall back to the real letter rather than leaving a
       hole in the middle of the word. */
    img.addEventListener("error", () => chip.classList.add("no-scrap"), { once: true });

    chip.append(sr, img);
    chip._ring = ring;
    chip._at = 0;
    /* a small pool of angles per chip, so a repeat of the same scrap still
       lands differently */
    chip._tilt = [-5.5, 3.5, -2, 5, -4];

    /* Warm the rest of the ring now. A swap that has to fetch first shows a
       gap where the letter was — the one frame of this effect that would
       look broken rather than deliberate. */
    ring.slice(1).forEach((v) => {
      const pre = new Image();
      pre.src = "assets/img/ransom/" + lang + "-" + pad2(v) + ".webp";
    });

    /* rebuilt from text nodes, not innerHTML — the copy is ours but the
       headline is also the one place a stray tag would be most visible */
    line.textContent = "";
    line.append(text.slice(0, k), chip, text.slice(k + 1));
    return chip;
  }
  return null;
}

/* ── the cycle ───────────────────────────────────────────────────
   The letter keeps being re-cut and re-pasted: every couple of seconds a
   chip swaps to a different scrap at a different angle. Hard cuts, not
   tweens — paper does not ease from one piece into another, and a
   cross-fade would read as a slideshow instead of stop-motion.

   ⚠️ Each chip runs on its own randomised interval. Sharing one would make
   both letters flip in lockstep, which instantly reads as a mechanism.

   ⚠️ Paused when the hero leaves the viewport, for the same reason the
   marquee and film strip are — a timer redrawing a composited layer while
   you scroll somewhere else is exactly the cost we cut earlier. */
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
    /* Uneven on purpose — a steady beat is a metronome, not a hand. The
       spread also has to stay wide enough that the two letters don't drift
       into step with each other. */
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
  /* A different scrap on every load, and never the same one twice on the
     page — two identical clippings would read as a repeated graphic rather
     than as letters cut from whatever was to hand. */
  const bag = Array.from({ length: RANSOM_COUNT }, (_, i) => i + 1);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  /* Each chip gets its own slice of the bag — RING_LEN scraps it will cycle
     through. Kept short on purpose: every scrap in a ring gets fetched, and
     this is the hero. Different slices per load, so the set a visitor sees
     changes between visits without pulling all 16. */
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

  /* First run waits for the line reveal to finish (delay 0.5 + duration 1).
     A language switch re-snaps them immediately instead — a 1.5s pause after
     tapping the toggle would just read as lag. */
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
  /* must run after the [data-i18n] loop above — that loop rewrites the
     headline's textContent and destroys the chips every time */
  initRansom();

  svcPicker.render();
  renderLibrary();
  renderServiceSections();
  projectSheet.refresh();
  rebuildLoops();
  filmLoop.rebuild();
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
  ".filmstrip", ".banner", ".footer",
  ".testi", ".sw-stage", ".svc-pick.is-active",
].join(",");

/* ⚠️ This is the one thing on the page that does real main-thread work on
   every scroll frame. `elementsFromPoint` forces a synchronous layout flush
   and a full hit test, and `closest()` then walks an 8-selector list for each
   element it returns. Correct, but not something to run 60 times a second on
   a phone — see queueMenuSync below, which spaces it out. */
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
  /* The burger and the language pill are pinned to OPPOSITE corners, so they
     are routinely over different sections at once — each is sampled on its
     own rather than sharing one answer. */
  if (menuBtn) menuBtn.classList.toggle("on-dark", overDark(menuBtn));
  const langPill = document.querySelector(".masthead .lang-switch");
  if (langPill) langPill.classList.toggle("on-dark", overDark(langPill));
}

/* Every frame was overkill: the burger inverting ~100ms after a dark band
   passes under it is imperceptible, and it buys back five of every six hit
   tests during a fast scroll. The trailing sync is what keeps it honest —
   without it the button can be left wrong wherever the scroll stops. */
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

/* ══════════ what we do — service picker + example switcher ══════════
   Three services, shown one at a time. The arrows step through that service's
   SUBCATEGORIES (logos / printables / posters …), not through projects — the
   right-hand column speaks about the category and the subcategory together.
   Deliberately not animated: the swap is a straight repaint. */
let currentService = "design";

const svcPicker = (() => {
  const stage = document.getElementById("swStage");
  if (!stage) return { setService() { }, render() { }, next() { }, prev() { } };

  const media = document.getElementById("swMedia");
  const elCap = document.getElementById("swCap");
  const elKicker = document.getElementById("swKicker");
  const elName = document.getElementById("swName");
  const elDesc = document.getElementById("swDesc");
  const elIndex = document.getElementById("swIndex");
  const elTotal = document.getElementById("swTotal");

  let items = [], idx = 0;

  const svcName = (id) => {
    const c = CATS.find((c) => c.id === id);
    return c ? c[lang] : "";
  };

  function paint() {
    const s = items[idx];
    if (!s) return;
    elKicker.textContent = svcName(currentService);
    elName.textContent = s[lang];
    elDesc.textContent = s.desc ? s.desc[lang] : "";
    elIndex.textContent = num(String(idx + 1).padStart(2, "0"));
    elTotal.textContent = num(String(items.length).padStart(2, "0"));
    elCap.textContent = `${svcName(currentService)} — ${s[lang]}`;
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
  /* ⚠️ No filmLoop.focus()/blur() here any more. The strip is three screens up,
     so the glide drove nothing anyone could see — and it was pointing the loop
     at a frame while the hero was off screen, which is how the strip ended up
     stopped. filmLoop.focus() still exists for whenever something NEAR the
     hero wants to drive it. */
});

const band = document.querySelector(".contact-band");
if (band) {
  band.addEventListener("mouseenter", () => bandTween && bandTween.pause());
  band.addEventListener("mouseleave", () => bandTween && bandTween.resume());
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

  gsap.utils.toArray(".banner h2").forEach((el) => {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  /* the remodelled sections — لماذا ألِف؟ and ماذا نفعل؟ — are deliberately
     not animated. They are a printed sheet: it doesn't assemble itself while
     you read it. The banners above them still rise, since those belong to the
     page furniture rather than to either section. */
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
          <img src="${HOLDER}" alt="${p[lang]}" loading="lazy">
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

/* ⚠️ WIDTH ONLY. On a phone, scrolling collapses and re-shows the browser's
   own address bar, and each of those fires `resize` with a changed HEIGHT and
   an identical width. Rebuilding on those was a real bug: every rebuild tears
   the film strip's DOM down, rebuilds it, and re-seeds x — so the strip
   visibly snapped back to its start each time the address bar moved, which
   reads as "the film strip stopped looping." The marquee restarted with it.
   Neither loop depends on viewport height, so a height change is not a
   reason to rebuild either of them. */
/* The film has its own module, so it gets its own observer rather than going
   through pauseOffscreen() — filmLoop.setVisible() has to gate run() too, or
   a hover-blur would restart the strip while it is off screen. */
(() => {
  const strip = document.querySelector(".filmstrip");
  if (!strip || !window.IntersectionObserver) return;
  new IntersectionObserver(
    (e) => filmLoop.setVisible(e[0].isIntersecting),
    { rootMargin: "150px" },
  ).observe(strip);
})();

/* The ransom letters keep re-cutting themselves, so they are a running timer
   like the loops are — same rule, stop when nobody can see them. */
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
  }, 250);
});
