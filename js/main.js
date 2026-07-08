/* ============================================================
   StockerTV — site interactions · v2 monochrome
   No dependencies. Progressive enhancement throughout:
   every section reads correctly with JS disabled.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function onIntersect(els, cb, options) {
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { cb(el, true); });
      return null;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { cb(entry.target, entry.isIntersecting, io); });
    }, options || { threshold: 0.18 });
    els.forEach(function (el) { io.observe(el); });
    return io;
  }

  /* ============================================================
     1. Top bar — scroll state, mobile menu, active section
     ============================================================ */

  var topbar = $("#topbar");
  var menuBtn = $("#menuBtn");
  var topnav = $("#topnav");
  var scrollProgress = $("#scrollProgress");

  function onScrollBar() {
    topbar.classList.toggle("is-scrolled", window.scrollY > 8);
    if (scrollProgress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      scrollProgress.style.width = pct.toFixed(2) + "%";
    }
  }
  window.addEventListener("scroll", onScrollBar, { passive: true });
  window.addEventListener("resize", onScrollBar, { passive: true });
  onScrollBar();

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = topnav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $all("a", topnav).forEach(function (a) {
      a.addEventListener("click", function () {
        topnav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* active-section highlight */
  var navLinks = $all("a", topnav);
  var sectionForLink = {};
  navLinks.forEach(function (a) {
    var id = (a.getAttribute("href") || "").replace("#", "");
    var sec = document.getElementById(id);
    if (sec) sectionForLink[id] = a;
  });

  onIntersect(Object.keys(sectionForLink).map(function (id) { return document.getElementById(id); }),
    function (el, visible) {
      if (!visible) return;
      navLinks.forEach(function (a) { a.classList.remove("active"); });
      var link = sectionForLink[el.id];
      if (link) link.classList.add("active");
    }, { threshold: 0, rootMargin: "-40% 0px -55% 0px" });

  /* ============================================================
     2. Exchange sessions — shared data
     ============================================================ */

  var EXCHANGES = [
    { code: "NYSE",   city: "New York",  tz: "America/New_York",  open: 570,  close: 960,  days: [1, 2, 3, 4, 5] },
    { code: "NASDAQ", city: "New York",  tz: "America/New_York",  open: 570,  close: 960,  days: [1, 2, 3, 4, 5] },
    { code: "TSX",    city: "Toronto",   tz: "America/Toronto",   open: 570,  close: 960,  days: [1, 2, 3, 4, 5] },
    { code: "LSE",    city: "London",    tz: "Europe/London",     open: 480,  close: 990,  days: [1, 2, 3, 4, 5] },
    { code: "FWB",    city: "Frankfurt", tz: "Europe/Berlin",     open: 540,  close: 1050, days: [1, 2, 3, 4, 5] },
    { code: "TASE",   city: "Tel Aviv",  tz: "Asia/Jerusalem",    open: 599,  close: 1035, days: [0, 1, 2, 3, 4] },
    { code: "NSE",    city: "Mumbai",    tz: "Asia/Kolkata",      open: 555,  close: 930,  days: [1, 2, 3, 4, 5] },
    { code: "SSE",    city: "Shanghai",  tz: "Asia/Shanghai",     open: 570,  close: 900,  days: [1, 2, 3, 4, 5] },
    { code: "SZSE",   city: "Shenzhen",  tz: "Asia/Shanghai",     open: 570,  close: 900,  days: [1, 2, 3, 4, 5] },
    { code: "HKEX",   city: "Hong Kong", tz: "Asia/Hong_Kong",    open: 570,  close: 960,  days: [1, 2, 3, 4, 5] },
    { code: "TSE",    city: "Tokyo",     tz: "Asia/Tokyo",        open: 540,  close: 900,  days: [1, 2, 3, 4, 5] },
    { code: "ASX",    city: "Sydney",    tz: "Australia/Sydney",  open: 600,  close: 960,  days: [1, 2, 3, 4, 5] }
  ];

  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function exchangeState(ex) {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: ex.tz, hour12: false, weekday: "short", hour: "numeric", minute: "numeric"
      }).formatToParts(new Date());
      var get = function (type) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
        return "";
      };
      var day = DAY_INDEX[get("weekday")];
      var mins = (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10);
      return ex.days.indexOf(day) !== -1 && mins >= ex.open && mins < ex.close;
    } catch (e) {
      return false;
    }
  }

  /* ============================================================
     3. Wire ticker — system status wire
     ============================================================ */

  var wireTrack = $("#wireTrack");

  function buildWire() {
    if (!wireTrack) return;
    var items = [];
    EXCHANGES.forEach(function (ex) {
      var open = exchangeState(ex);
      items.push(
        '<span class="wire-item"><b class="' + (open ? "up" : "closed") + '">' + ex.code + "</b> " +
        ex.city + " · " + (open ? "SESSION OPEN" : "closed") + "</span>"
      );
    });
    items.push('<span class="wire-item"><b>WATCHER</b> scanning 32,000+ companies</span>');
    items.push('<span class="wire-item"><b>EDGAR</b> polled — 5 minute cadence</span>');
    items.push('<span class="wire-item"><b>DESKS</b> 5 reporters standing by</span>');
    items.push('<span class="wire-item"><b>INTEGRITY</b> 24 rules · 3 layers armed</span>');
    items.push('<span class="wire-item"><b>TIER-1</b> Bloomberg · Reuters · WSJ · FT · EDGAR</span>');
    var half = items.join("");
    wireTrack.innerHTML = half + half; /* duplicate for seamless loop */
  }

  buildWire();
  setInterval(buildWire, 60000);

  /* ============================================================
     4. Reveal on scroll
     ============================================================ */

  var revealTargets = $all(
    [
      ".kicker", "h2", ".section-sub",
      ".agents-grid li", ".agents-more",
      ".rep-card",
      ".xp-controls", ".xp-stage", ".xp-note",
      ".int-card", ".scale-stats > div", ".sessions",
      ".who-card", ".cta-inner", ".sources-lede", ".sources-row li"
    ].join(",")
  );

  revealTargets.forEach(function (el) { el.classList.add("rv"); });

  $all(".agents-grid, .rep-grid, .int-grid, .scale-stats, .sources-row").forEach(function (grid) {
    $all(".rv", grid).forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 55, 440) + "ms";
    });
  });

  onIntersect(revealTargets, function (el, visible, io) {
    if (visible) {
      el.classList.add("in");
      if (io) io.unobserve(el);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  /* ============================================================
     5. Count-up numbers
     ============================================================ */

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (REDUCED || !target) return;
    var start = null;
    var DUR = 1300;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  onIntersect($all("[data-count]"), function (el, visible, io) {
    if (visible) {
      animateCount(el);
      if (io) io.unobserve(el);
    }
  }, { threshold: 0.6 });

  /* ============================================================
     6. Hero live desk — looping demo
     ============================================================ */

  var HEADLINE = "NVIDIA reports record fourth-quarter results — 8-K filed 16:01 ET";
  var SCRIPT_TEXT =
    "Hi, I'm Gerardo. NVIDIA reported record fourth-quarter results, with data-center revenue reaching " +
    "thirty point eight billion dollars, according to the company's filing. The company stated that demand " +
    "for its new architecture exceeded supply through the quarter. Management disclosed that gross margin " +
    "widened to seventy-six percent, while the automotive segment posted its strongest quarter to date. " +
    "That's the financial update.";

  var deskHeadline = $("#deskHeadline");
  var deskChecks = $all("#deskChecks li");
  var deskScript = $("#deskScript");
  var deskCaret = $("#deskCaret");
  var deskStatus = $("#deskStatus");
  var qVal = $("#qVal"), iVal = $("#iVal");
  var qBar = $("#qBar"), iBar = $("#iBar");

  var deskTimers = [];

  function deskSetStatus(text) {
    if (deskStatus) deskStatus.innerHTML = '<span class="live-dot"></span> ' + text;
  }

  function deskDelay(fn, ms) {
    deskTimers.push(setTimeout(fn, ms));
  }

  function typeInto(el, text, speed, done) {
    var i = 0;
    var node = document.createTextNode("");
    var ref = (el === deskScript && deskCaret && deskCaret.parentNode === el) ? deskCaret : null;
    el.insertBefore(node, ref);
    var timer = setInterval(function () {
      i += 2;
      node.nodeValue = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(timer);
        node.nodeValue = text;
        if (done) done();
      }
    }, speed);
    deskTimers.push(timer);
  }

  function deskFinalState() {
    if (deskHeadline) deskHeadline.textContent = HEADLINE;
    deskChecks.forEach(function (li) { li.classList.add("on"); });
    if (deskScript) deskScript.textContent = SCRIPT_TEXT;
    if (qVal) qVal.textContent = "95 / 110";
    if (iVal) iVal.textContent = "100 / 100";
    if (qBar) qBar.style.width = "86%";
    if (iBar) iBar.style.width = "100%";
    deskSetStatus("CLEARED FOR AIR");
  }

  function deskReset() {
    deskTimers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    deskTimers = [];
    if (deskHeadline) deskHeadline.textContent = "";
    deskChecks.forEach(function (li) { li.classList.remove("on"); });
    if (deskScript) {
      deskScript.innerHTML = "";
      if (deskCaret) deskScript.appendChild(deskCaret);
    }
    if (qVal) qVal.textContent = "—";
    if (iVal) iVal.textContent = "—";
    if (qBar) qBar.style.width = "0";
    if (iBar) iBar.style.width = "0";
  }

  function deskRun() {
    if (!deskHeadline || !deskScript) return;
    deskReset();
    deskSetStatus("WATCHING THE WIRE");

    deskDelay(function () {
      deskSetStatus("STORY DETECTED");
      typeInto(deskHeadline, HEADLINE, 16);
    }, 700);

    deskDelay(function () { deskSetStatus("VERIFYING"); deskChecks[0] && deskChecks[0].classList.add("on"); }, 2400);
    deskDelay(function () { deskChecks[1] && deskChecks[1].classList.add("on"); }, 3200);
    deskDelay(function () { deskChecks[2] && deskChecks[2].classList.add("on"); }, 4000);

    deskDelay(function () {
      deskSetStatus("WRITING — 71 WORDS");
      typeInto(deskScript, SCRIPT_TEXT, 14, function () {
        deskSetStatus("GATES — QUALITY & INTEGRITY");
        if (qBar) qBar.style.width = "86%";
        if (iBar) iBar.style.width = "100%";
        deskDelay(function () {
          if (qVal) qVal.textContent = "95 / 110";
          if (iVal) iVal.textContent = "100 / 100";
          deskSetStatus("CLEARED FOR AIR");
        }, 1100);
        deskDelay(deskRun, 9000);
      });
    }, 4800);
  }

  if (REDUCED) {
    deskFinalState();
  } else {
    var deskEl = $("#desk");
    var deskStarted = false;
    onIntersect(deskEl ? [deskEl] : [], function (el, visible) {
      if (visible && !deskStarted) {
        deskStarted = true;
        deskRun();
      }
    }, { threshold: 0.35 });
  }

  /* hero air tile */
  var heroPlay = $("#heroPlay");
  if (heroPlay) {
    var heroVideo = $("video", heroPlay);
    heroPlay.addEventListener("click", function () {
      if (heroPlay.classList.contains("playing")) {
        heroVideo.pause();
        heroVideo.currentTime = 0;
        heroPlay.classList.remove("playing");
        return;
      }
      xpStopAll();
      if (!heroVideo.src) heroVideo.src = heroPlay.getAttribute("data-video");
      heroPlay.classList.add("playing");
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () { heroPlay.classList.remove("playing"); });
    });
    heroVideo.addEventListener("ended", function () { heroPlay.classList.remove("playing"); heroVideo.currentTime = 0; });
    heroVideo.addEventListener("error", function () { heroPlay.classList.remove("playing"); });
  }

  /* ============================================================
     7. Scrollytelling pipeline
     ============================================================ */

  var STAGE_NAMES = [
    "STAGE 01 · WATCH", "STAGE 02 · ENRICH", "STAGE 03 · VERIFY",
    "STAGE 04 · ASSIGN", "STAGE 05 · WRITE", "STAGE 06 · GATE", "STAGE 07 · AIR"
  ];

  var STAGE_LINES = [
    [
      '<span class="hl">wire.scan</span>    tier1=5 sources · 24/7',
      '<span class="hl">edgar.poll</span>   cadence=5m · new filings: 3',
      'match        <span class="hl">NVDA</span> · 8-K · filed 16:01 ET',
      'dedup        not seen before <span class="ok">✓ QUEUED</span>'
    ],
    [
      'company.load <span class="hl">NVIDIA Corp</span> · NASDAQ · T1',
      'file         sector, financials, 52-wk range',
      'history      last 3 stories loaded — no repeat',
      'context      <span class="ok">✓ CASE FILE READY</span>'
    ],
    [
      'facts.extract   8 claims · 3 citations',
      'edgar.crosscheck <span class="ok">8/8 PASS</span> vs official filing',
      'links.validate  <span class="ok">3/3 LIVE</span> · retained',
      'unverified      0 — <span class="ok">✓ CLEARED TO WRITE</span>'
    ],
    [
      'router.class  FINANCIAL_UPDATE',
      'desk          <span class="hl">GERARDO · FINANCIAL</span>',
      'voice         confident analyst · leads with the number',
      'assign        <span class="ok">✓ ON DESK</span>'
    ],
    [
      'draft      71 words · 40-second read',
      'numbers    written as words · 2 of 3 max',
      'attribution "reported" · "stated" · "disclosed"',
      'style      <span class="ok">✓ HOUSE STYLE ENFORCED</span>'
    ],
    [
      'quality.score   <span class="ok">95 / 110</span> · gate 35',
      'L1 forbidden-phrases scan   <span class="ok">PASS</span>',
      'L2 AI meaning check         <span class="ok">PASS</span>',
      'L3 tone & balance review    <span class="ok">PASS</span> · integrity <span class="ok">100</span>'
    ],
    [
      'render     avatar broadcast · captions burned',
      'languages  EN · ES · PT — written natively',
      'package    MP4 + HLS · audit receipt attached',
      'deliver    <span class="ok">✓ ON AIR — 47s TOTAL</span>'
    ]
  ];

  var pipeNodes = $all("#pipeNodes li");
  var pipeProgress = $("#pipeProgress");
  var pipePacket = $("#pipePacket");
  var pipeStageName = $("#pipeStageName");
  var pipeConsole = $("#pipeConsole");
  var psteps = $all(".pstep");
  var currentStage = 0;
  var consoleTimer = null;

  function renderConsole(el, stageIdx, instant) {
    var lines = STAGE_LINES[stageIdx];
    if (!el || !lines) return;
    if (consoleTimer) { clearInterval(consoleTimer); consoleTimer = null; }
    if (instant || REDUCED) {
      el.innerHTML = lines.join("\n");
      return;
    }
    el.innerHTML = "";
    var i = 0;
    consoleTimer = setInterval(function () {
      el.innerHTML = lines.slice(0, i + 1).join("\n");
      i++;
      if (i >= lines.length) { clearInterval(consoleTimer); consoleTimer = null; }
    }, 190);
  }

  function setStage(n) {
    if (n === currentStage) return;
    currentStage = n;
    var idx = n - 1;

    pipeNodes.forEach(function (li, i) {
      li.classList.toggle("on", i === idx);
      li.classList.toggle("done", i < idx);
    });

    if (pipeProgress && pipePacket && pipeNodes.length > 1) {
      var pct = (idx / (pipeNodes.length - 1)) * 100;
      pipeProgress.style.height = pct + "%";
      pipePacket.style.top = pct + "%";
    }

    if (pipeStageName) pipeStageName.textContent = STAGE_NAMES[idx];
    renderConsole(pipeConsole, idx);
  }

  psteps.forEach(function (step, i) {
    var mini = document.createElement("pre");
    mini.className = "pstep-console";
    mini.setAttribute("aria-hidden", "true");
    mini.innerHTML = STAGE_LINES[i] ? STAGE_LINES[i].join("\n") : "";
    step.appendChild(mini);
  });

  onIntersect(psteps, function (el, visible) {
    if (visible) {
      el.classList.add("on");
      setStage(parseInt(el.getAttribute("data-stage"), 10));
    } else if (parseInt(el.getAttribute("data-stage"), 10) !== currentStage) {
      el.classList.remove("on");
    }
  }, { threshold: 0, rootMargin: "-42% 0px -42% 0px" });

  currentStage = -1;
  setStage(1);
  psteps[0] && psteps[0].classList.add("on");

  /* ============================================================
     8. EXPERIENCE — interactive product demo
     ============================================================ */

  var V = {
    nvdaEN: "https://leoofwrctjxtkmhqphtw.supabase.co/storage/v1/object/public/Tradetok%20videos/NVIDIA%20Q4%20Record%20Financial%20Update_1080p_caption.mp4",
    nvdaES: "https://leoofwrctjxtkmhqphtw.supabase.co/storage/v1/object/public/Tradetok%20videos/SPANISH%20VIDEO.mp4",
    baxFR:  "https://leoofwrctjxtkmhqphtw.supabase.co/storage/v1/object/public/Tradetok%20videos/FRENCH%20VIDEO.mp4",
    ibkrEN: "https://leoofwrctjxtkmhqphtw.supabase.co/storage/v1/object/public/Tradetok%20videos/Interactive%20Brokers%20Update.mp4",
    metaEN: "https://leoofwrctjxtkmhqphtw.supabase.co/storage/v1/object/public/Tradetok%20videos/Meta%20Financial%20Update%202026.mp4"
  };

  var XP_DATA = {
    gerardo: {
      name: "Gerardo", desk: "FINANCIAL", img: "assets/reporters/GERRARDO.jpg",
      langs: {
        EN: { video: V.nvdaEN, tick: "NVDA ▲ 3.4%", spark: "NVDA · SESSION",
              head: "NVIDIA reports record fourth-quarter results",
              src: "<b>REUTERS</b> · 14:08 UTC · source-verified",
              script: "Hi, I'm Gerardo. NVIDIA reported record fourth-quarter results, with data-center revenue reaching thirty point eight billion dollars, according to the company's filing. The company stated that demand for its new architecture exceeded supply through the quarter. Management disclosed that gross margin widened to seventy-six percent. That's the financial update." },
        ES: { video: V.nvdaES, tick: "NVDA ▲ 3.4%", spark: "NVDA · SESIÓN",
              head: "NVIDIA presenta resultados récord del cuarto trimestre",
              src: "<b>REUTERS</b> · 14:08 UTC · verificado en origen",
              script: "Hola, soy Gerardo. NVIDIA presentó resultados récord del cuarto trimestre, con ingresos de centros de datos de treinta coma ocho mil millones de dólares, según la presentación de la compañía. Es la actualización financiera." },
        FR: { video: V.baxFR, tick: "BAX ▲ 1.8%", spark: "BAX · SÉANCE",
              head: "Baxter publie ses résultats du troisième trimestre",
              src: "<b>ÉDITION FRANÇAISE</b> · vérifié à la source",
              script: "Bonjour, je suis Gerardo. Baxter a publié ses résultats du troisième trimestre, selon le communiqué de la société. C'est le point financier." }
      }
    },
    liam: {
      name: "Liam", desk: "OPERATIONS", img: "assets/reporters/LIAM.jpg",
      langs: {
        EN: { video: V.ibkrEN, tick: "IBKR ▲ 2.1%", spark: "IBKR · SESSION",
              head: "Interactive Brokers reports continued account growth",
              src: "<b>OPERATIONS DESK</b> · source-verified",
              script: "Hey, I'm Liam. Interactive Brokers reported continued growth in client accounts, according to the company's monthly disclosure. The company stated that global expansion of its platform operations continued through the period. That's the operations update." }
      }
    },
    annie: {
      name: "Annie", desk: "PRODUCT", img: "assets/reporters/ANNIE.jpg",
      langs: {
        EN: { video: V.metaEN, tick: "META ▲ 2.6%", spark: "META · SESSION",
              head: "Meta details its 2026 platform update",
              src: "<b>PRODUCT DESK</b> · source-verified",
              script: "Hi, I'm Annie. Meta detailed its twenty twenty-six platform update, according to the company's announcement. The company stated that the rollout reaches all markets this quarter. That's the product update." }
      }
    },
    sophia: {
      name: "Sophia", desk: "LEGAL & RISKS", img: "assets/reporters/SOPHIA.jpg", sim: true,
      langs: {
        EN: { tick: "LEGAL & RISKS", spark: "DESK · PREVIEW",
              head: "The legal and risks desk — cautious by design",
              src: "<b>SIMULATED PREVIEW</b> · no live story selected",
              script: "Hi, I'm Sophia. On this desk, language stays cautious and precise — \"alleged\", \"filed\", \"proposed\" — and a verdict is never called before the court's. That's the legal and risks update.",
              captions: [
                "“Hi, I'm Sophia.”",
                "Lawsuits, regulatory actions, and risk — reported with precise, cautious language.",
                "“Alleged” and “filed” — never a verdict before the court's.",
                "“That's the legal and risks update.”"
              ] }
      }
    },
    maya: {
      name: "Maya", desk: "PRESS RELEASE", img: "assets/reporters/MAYA.jpg", sim: true,
      langs: {
        EN: { tick: "PRESS RELEASE", spark: "DESK · PREVIEW",
              head: "The press release desk — formal and neutral",
              src: "<b>SIMULATED PREVIEW</b> · no live story selected",
              script: "Hi, I'm Maya. This desk reports on official announcements in formal, neutral language — no contractions, no hype, and never an endorsement. That's the press release update.",
              captions: [
                "“Hi, I'm Maya.”",
                "Official announcements and investor communications, reported formally and neutrally.",
                "Reports on the announcement — never for it.",
                "“That's the press release update.”"
              ] }
      }
    }
  };

  var XP_BRANDS = {
    meridian: { text: "Meridian", cls: "b-serif", domain: "meridianmarkets.com" },
    crescent: { text: "Crescent", cls: "b-caps", domain: "crescentprivate.bank" },
    vantage:  { text: "vantage.", cls: "b-lower", domain: "vantagetrade.com" },
    aurum:    { text: "Aurum",   cls: "b-mono", domain: "aurumwealth.com" }
  };

  var xpStage = $("#xpStage");
  var xpState = { rep: "gerardo", lang: "EN", brand: "meridian", device: "phone" };
  var xpWidgets = $all(".widget[data-frame]");
  var xpCaptionTimer = null;

  function xpEls(widget, key) { return $all('[data-xp="' + key + '"]', widget); }

  /* seeded sparkline so each story has a stable, distinct chart */
  function sparkPath(seedStr) {
    var seed = 0;
    for (var i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 2147483647;
    function rnd() { seed = (seed * 48271) % 2147483647; return seed / 2147483647; }
    var pts = [];
    var y = 14 + rnd() * 6;
    for (var x = 0; x <= 100; x += 5) {
      y += (rnd() - 0.44) * 4.2;
      y = Math.max(3, Math.min(21, y));
      pts.push([x, y]);
    }
    var line = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    var fill = line + " L100,24 L0,24 Z";
    return { line: line, fill: fill };
  }

  function xpAnimateSpark(path) {
    if (REDUCED || !path.getTotalLength) return;
    try {
      var len = path.getTotalLength();
      path.style.transition = "none";
      path.style.strokeDasharray = len + " " + len;
      path.style.strokeDashoffset = len;
      void path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.2,0.6,0.2,1)";
      path.style.strokeDashoffset = "0";
    } catch (e) { /* non-rendered SVG */ }
  }

  function xpStopAll() {
    xpWidgets.forEach(function (w) {
      var video = xpEls(w, "video")[0];
      var player = xpEls(w, "player")[0];
      if (video) { video.pause(); video.currentTime = 0; }
      if (player) player.classList.remove("playing");
    });
    if (heroPlay && heroPlay.classList.contains("playing")) {
      var hv = $("video", heroPlay);
      if (hv) { hv.pause(); hv.currentTime = 0; }
      heroPlay.classList.remove("playing");
    }
  }

  function xpStartCaptions(story) {
    if (xpCaptionTimer) { clearInterval(xpCaptionTimer); xpCaptionTimer = null; }
    if (!story.captions) return;
    var idx = 0;
    function setCap() {
      xpWidgets.forEach(function (w) {
        var cap = xpEls(w, "caption")[0];
        if (cap) cap.textContent = story.captions[idx];
      });
      idx = (idx + 1) % story.captions.length;
    }
    setCap();
    if (!REDUCED) xpCaptionTimer = setInterval(setCap, 3200);
  }

  function xpRender(animate) {
    var rep = XP_DATA[xpState.rep];
    if (!rep) return;
    var availableLangs = Object.keys(rep.langs);
    if (availableLangs.indexOf(xpState.lang) === -1) xpState.lang = "EN";
    var story = rep.langs[xpState.lang];
    var brand = XP_BRANDS[xpState.brand];
    var spark = sparkPath(xpState.rep + xpState.lang);

    xpStopAll();

    xpWidgets.forEach(function (w) {
      xpEls(w, "poster").forEach(function (el) { el.src = rep.img; });
      xpEls(w, "tick").forEach(function (el) { el.textContent = story.tick; });
      xpEls(w, "head").forEach(function (el) { el.textContent = story.head; });
      xpEls(w, "src").forEach(function (el) { el.innerHTML = story.src; });
      xpEls(w, "sidehead").forEach(function (el) { el.textContent = story.head; });
      xpEls(w, "sidesrc").forEach(function (el) { el.innerHTML = story.src; });
      xpEls(w, "script").forEach(function (el) { el.textContent = story.script; });
      xpEls(w, "repname").forEach(function (el) { el.textContent = rep.name; });
      xpEls(w, "repdesk").forEach(function (el) { el.textContent = rep.desk; });
      xpEls(w, "sparklabel").forEach(function (el) { el.textContent = story.spark; });

      xpEls(w, "sparkline").forEach(function (el) {
        el.setAttribute("d", spark.line);
        if (animate) xpAnimateSpark(el);
      });
      xpEls(w, "sparkfill").forEach(function (el) { el.setAttribute("d", spark.fill); });

      var player = xpEls(w, "player")[0];
      if (player) player.classList.toggle("sim", !!rep.sim);

      xpEls(w, "brand").forEach(function (el) {
        el.textContent = brand.text;
        el.className = "w-brand " + brand.cls;
      });

      $all(".w-rep", w).forEach(function (btn) {
        btn.classList.toggle("is-on", btn.getAttribute("data-rep") === xpState.rep);
      });

      $all(".w-lang", w).forEach(function (btn) {
        var lang = btn.getAttribute("data-lang");
        var available = availableLangs.indexOf(lang) !== -1;
        btn.disabled = !available;
        btn.classList.toggle("is-on", lang === xpState.lang);
        btn.setAttribute("aria-pressed", lang === xpState.lang ? "true" : "false");
      });
    });

    xpEls(document, "domain").forEach(function (el) { el.textContent = brand.domain; });

    if (rep.sim) xpStartCaptions(story);
    else if (xpCaptionTimer) { clearInterval(xpCaptionTimer); xpCaptionTimer = null; }
  }

  /* wire up widget controls (both frames share state) */
  xpWidgets.forEach(function (w) {
    $all(".w-rep", w).forEach(function (btn) {
      btn.addEventListener("click", function () {
        xpState.rep = btn.getAttribute("data-rep");
        xpState.lang = "EN";
        xpRender(true);
      });
    });

    $all(".w-lang", w).forEach(function (btn) {
      btn.addEventListener("click", function () {
        xpState.lang = btn.getAttribute("data-lang");
        xpRender(true);
      });
    });

    var playBtn = xpEls(w, "play")[0];
    var video = xpEls(w, "video")[0];
    var player = xpEls(w, "player")[0];
    if (playBtn && video && player) {
      playBtn.addEventListener("click", function () {
        var rep = XP_DATA[xpState.rep];
        var story = rep.langs[xpState.lang];
        if (!story.video) return;
        if (player.classList.contains("playing")) { xpStopAll(); return; }
        xpStopAll();
        if (video.getAttribute("data-current") !== story.video) {
          video.src = story.video;
          video.setAttribute("data-current", story.video);
        }
        player.classList.add("playing");
        var p = video.play();
        if (p && p.catch) p.catch(function () { player.classList.remove("playing"); });
      });
      video.addEventListener("ended", function () { player.classList.remove("playing"); video.currentTime = 0; });
      video.addEventListener("error", function () { player.classList.remove("playing"); });
      /* tap the playing video to stop */
      video.addEventListener("click", function () { xpStopAll(); });
    }
  });

  /* brand pills */
  $all(".fbrand").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $all(".fbrand").forEach(function (b) { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("is-on");
      btn.setAttribute("aria-pressed", "true");
      xpState.brand = btn.getAttribute("data-brand");
      xpRender(false);
    });
  });

  /* device segmented control */
  var deviceSeg = $("#deviceSeg");
  var segThumb = $("#segThumb");

  function segPosition() {
    if (!deviceSeg || !segThumb) return;
    var on = $(".is-on", deviceSeg);
    if (!on) return;
    segThumb.style.left = on.offsetLeft + "px";
    segThumb.style.width = on.offsetWidth + "px";
  }

  if (deviceSeg) {
    $all("button", deviceSeg).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all("button", deviceSeg).forEach(function (b) { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-on");
        btn.setAttribute("aria-pressed", "true");
        xpState.device = btn.getAttribute("data-device");
        if (xpStage) xpStage.setAttribute("data-device", xpState.device);
        xpStopAll();
        segPosition();
        /* re-draw sparkline in the newly visible frame */
        xpRender(true);
      });
    });
    segPosition();
    window.addEventListener("resize", segPosition);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(segPosition);
  }

  /* phone status-bar clock — real local time */
  function phoneClock() {
    var now = new Date();
    var h = now.getHours() % 12 || 12;
    var m = String(now.getMinutes()).padStart(2, "0");
    xpEls(document, "clock").forEach(function (el) { el.textContent = h + ":" + m; });
  }
  phoneClock();
  setInterval(phoneClock, 30000);

  /* initial render (animate sparkline when scrolled into view) */
  xpRender(false);
  var xpStarted = false;
  onIntersect(xpStage ? [xpStage] : [], function (el, visible) {
    if (visible && !xpStarted) {
      xpStarted = true;
      xpRender(true);
    }
  }, { threshold: 0.25 });

  /* ============================================================
     9. Sessions board + UTC clock
     ============================================================ */

  var sessionsGrid = $("#sessionsGrid");
  var utcClock = $("#utcClock");

  function renderSessions() {
    if (!sessionsGrid) return;
    sessionsGrid.innerHTML = EXCHANGES.map(function (ex) {
      var open = exchangeState(ex);
      return (
        "<li class=\"" + (open ? "open" : "closed") + "\"><b>" + ex.code + "</b><span>" + ex.city + "</span>" +
        "<span class=\"st\">" + (open ? "OPEN" : "CLOSED") + "</span></li>"
      );
    }).join("");
  }

  function renderClock() {
    if (!utcClock) return;
    var now = new Date();
    var hh = String(now.getUTCHours()).padStart(2, "0");
    var mm = String(now.getUTCMinutes()).padStart(2, "0");
    var ss = String(now.getUTCSeconds()).padStart(2, "0");
    utcClock.textContent = hh + ":" + mm + ":" + ss + " UTC";
  }

  renderSessions();
  renderClock();
  setInterval(renderClock, 1000);
  setInterval(renderSessions, 30000);

})();
