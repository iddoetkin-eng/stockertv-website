/* ============================================================
   StockerTV — site interactions
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
     1. Top bar — scroll state + mobile menu
     ============================================================ */

  var topbar = $("#topbar");
  var menuBtn = $("#menuBtn");
  var topnav = $("#topnav");

  function onScrollBar() {
    topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScrollBar, { passive: true });
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

  /* ============================================================
     2. Exchange sessions — shared data
        Hours are the exchanges' regular sessions in local time.
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
      var open = ex.days.indexOf(day) !== -1 && mins >= ex.open && mins < ex.close;
      return open;
    } catch (e) {
      return false;
    }
  }

  /* ============================================================
     3. Wire ticker — system status wire (factual, self-referential)
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
     4. Reveal on scroll — auto-tagged
     ============================================================ */

  var revealTargets = $all(
    [
      ".kicker", "h2", ".section-sub",
      ".agents-grid li", ".agents-more",
      ".rep-card", ".clip",
      ".fleet-copy", ".fleet-phone",
      ".int-card", ".scale-stats > div", ".sessions",
      ".who-card", ".cta-inner", ".sources-lede", ".sources-row li"
    ].join(",")
  );

  revealTargets.forEach(function (el, i) {
    el.classList.add("rv");
  });

  /* stagger siblings inside grids */
  $all(".agents-grid, .rep-grid, .lineup, .int-grid, .scale-stats, .sources-row").forEach(function (grid) {
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
    if (deskScript) {
      deskScript.textContent = SCRIPT_TEXT;
    }
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

    /* 1. headline */
    deskDelay(function () {
      deskSetStatus("STORY DETECTED");
      typeInto(deskHeadline, HEADLINE, 16);
    }, 700);

    /* 2. checks */
    deskDelay(function () { deskSetStatus("VERIFYING"); deskChecks[0] && deskChecks[0].classList.add("on"); }, 2400);
    deskDelay(function () { deskChecks[1] && deskChecks[1].classList.add("on"); }, 3200);
    deskDelay(function () { deskChecks[2] && deskChecks[2].classList.add("on"); }, 4000);

    /* 3. script */
    deskDelay(function () {
      deskSetStatus("WRITING — 71 WORDS");
      typeInto(deskScript, SCRIPT_TEXT, 14, function () {
        /* 4. meters */
        deskSetStatus("GATES — QUALITY & INTEGRITY");
        if (qBar) qBar.style.width = "86%";
        if (iBar) iBar.style.width = "100%";
        deskDelay(function () {
          if (qVal) qVal.textContent = "95 / 110";
          if (iVal) iVal.textContent = "100 / 100";
          deskSetStatus("CLEARED FOR AIR");
        }, 1100);
        /* 5. loop */
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

  /* per-step mini consoles for mobile (rail is hidden there) */
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
    } else {
      /* keep at least one active; only dim when another takes over */
      if (parseInt(el.getAttribute("data-stage"), 10) !== currentStage) {
        el.classList.remove("on");
      }
    }
  }, { threshold: 0, rootMargin: "-42% 0px -42% 0px" });

  /* initial state */
  currentStage = -1;
  setStage(1);
  psteps[0] && psteps[0].classList.add("on");

  /* ============================================================
     8. Video tiles — click to play, one at a time
     ============================================================ */

  var players = $all(".clip, .air-tile");

  function stopPlayer(btn) {
    var v = $("video", btn);
    if (v) { v.pause(); v.currentTime = 0; }
    btn.classList.remove("playing");
  }

  players.forEach(function (btn) {
    var video = $("video", btn);
    if (!video) return;

    btn.addEventListener("click", function () {
      if (btn.classList.contains("playing")) {
        stopPlayer(btn);
        return;
      }
      players.forEach(function (other) { if (other !== btn) stopPlayer(other); });

      if (!video.src) video.src = btn.getAttribute("data-video");
      btn.classList.add("playing");
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () { btn.classList.remove("playing"); });
      }
    });

    video.addEventListener("ended", function () { stopPlayer(btn); });
    video.addEventListener("error", function () { stopPlayer(btn); });
  });

  /* ============================================================
     9. Fleet — brand theme switcher
     ============================================================ */

  var fleetPhone = $("#fleetPhone");
  var phoneBrand = $("#phoneBrand");
  var phoneAttrib = $("#phoneAttrib");
  var fbrands = $all(".fbrand");

  fbrands.forEach(function (btn) {
    btn.addEventListener("click", function () {
      fbrands.forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      var color = getComputedStyle(btn).getPropertyValue("--fb").trim();
      if (fleetPhone) fleetPhone.style.setProperty("--fb", color);
      if (phoneBrand) phoneBrand.textContent = btn.getAttribute("data-short");
      if (phoneAttrib) phoneAttrib.textContent = btn.getAttribute("data-name") + " · Source: Reuters · 14:08 UTC";
    });
  });

  /* ============================================================
     10. Sessions board + UTC clock
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
