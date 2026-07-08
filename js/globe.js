/* ============================================================
   StockerTV — Living globe
   A rotating dot-sphere of the real Earth. Scripts launch from
   the world's exchanges as they clear the desk. Canvas 2D, no
   dependencies, monochrome, 60fps, offscreen-paused.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("globeCanvas");
  if (!canvas) return;

  var stage = document.getElementById("globeStage");
  var packetLayer = document.getElementById("globePackets");
  var logEl = document.getElementById("globeLog");
  var hudMarkets = document.getElementById("globeMarkets");
  var tooltip = document.getElementById("globeTip");
  var hint = document.getElementById("globeHint");

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");

  /* ---------- packed land mask (180 x 90, base64 bits, MSB-first) ---------- */
  var MASK_W = 180, MASK_H = 90;
  var MASK_B64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AP/AAAAAAAAAAAAAAAAAAAAAAAAf//////AAAAAAAAAAAAAAAAAAAAAAA//////+AA/wAAAAB4AAAAAAAAAAAAAP+////4AA/AAAAAAGAAAAAAAAAAAOAP4f///4AAAAAB8AD34AAAAAAAAAB4Af8AP//4AAAAAHAAH/wAAAAAAAAAD/wz/gP//wAAAAAGAADf/+AAAAAH/4Pvw534H//wAAH+AAAAP////sDvwP////4fw+H//AAAf/4D8AP////8//+f//////g/H/w/AA/+Y/8AP///////AH/////8g8D+AeAD+/7/zx////////AH/////gD8B8AAAH4///8H///////+AD/////gD2AYAAAH4B//4Z//////vwAAwH///gD/AAAAGG4f//5/////+AcAACAB///8D/AAAAHAAf////////8A8AAAAA////n/wAAALAH/////////+A4AAAAAP///n/4AAADD///////////AwAAAAAP/////YAAAAf//+H///////gAAAAAAD////8YAAAA///+D///////AAAAAAAD////8AAAAA//4ODP/////8AAAAAAAD////wAAAAP//4PPf/////5gAAAAAAD////gAAAAPz///n//////DAAAAAAAD///+AAAAAPjb//n/////uDAAAAAAAB///8AAAAAPsZ///////8GGAAAAAAAB///4AAAAAH/Av//////9CeAAAAAAAA///wAAAAAP/AA//////8B8AAAAAAAAf/3gAAAAAf/xh//////+BgAAAAAAAAP/AAAAAAAf/8//f/////gAAAAAAAAAH+AAAAAAA/////v/////gAAAAAAAAAC+AAAAAAB/////3/////gAAAAAAAAAB/AAAAAAB/////zA/z//wAAAAAAAAAAfAAAAAAD////v/Afz/4gAAAAAAgAAAfgDwAAAB/////+Afh/AAAAAAAAAAAAP8AwAAAA////3+Afg/AwAAAAAAAAAAD/AAAAAA/////8AeAfgwAAAAAAAAAAAPgAAAAA/////wAeAfgwAAAAAAAAAAABhwAAAB/////wAMAPwQAAAAAAAAAAABx+AAAB/////wAMAAAcAAAAAAAAAAAA//AAAA/////wACAAAMAAAAAAAAAAAAH/gAAAfn///gAAAsDMAAAAAAAAAAAAH/8AAAAD///AAAA8HAAAAAAAAAAAAAH/+AAAAB//+AAAAYPSAAAAAAAAAAAAP++AAAAB//4AAAAMe6wAAAAAAAAAAAP48AAAAB//4AAAAMLw+AAAAAAAAAAAP8P+AAAA//4AAAAGAwfyAAAAAAAAAAP8//gAAAf/wAAAADwAD+AAAAAAAAAAP///gAAAf/wAAAAA/8A4AAAAAAAAAAH///gAAAf/4AAAAAAoAMAAAAAAAAAAH///AAAAf/4AAAAAAAQAAAAAAAAAAAD//+AAAA//4wAAAAAEwAAAAAAAAAAAD//+AAAA//5wAAAAAP4wAAAAAAAAAAA//+AAAA//jwAAAAAP9wAAAAAAAAAAAf/+AAAA//DgAAAAA//4AAAAAAAAAAAf/8AAAAf/DgAAAAD//4AAAAAAAAAAAf/4AAAAf+DgAAAAD//8AAAAAAAAAAA//gAAAAf+AAAAAAH/5+AAAAAAAAAAA/PgAAAAP+AAAAAAH/5+AAAAAAAAAAA/PAAAAAH8AAAAAAD//+AAAAAAAAAAA/MAAAAAH8AAAAAAD8f+AAAAAAAAAAA/IAAAAAHwAAAAAADwG8AAAAAAAAAAA/gAAAAAAAAAAAAAAAB8AAAAAAAAAAB/gAAAAAAAAAAAAAAAB4AHAAAAAAAAB8AAAAAAAAAAAAAAAAAAAOAAAAAAAAB8AAAAAAAAAAAAAAAAAYAcAAAAAAAAB8AAAAAAAAAAAAAAAAAAA4AAAAAAAAB4AAAAAAAAAAAAAAAAAABwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAfAAf/+//gAAAAAAAAAAAeAAAAAAAAP//H//////wAAAAAAAAAA/AAAAEf/////////////gAAAAAAH+D/AAAB///////////////wAAAH//P///AAAH///////////////gAAD///////AAP///////////////8AAF///////4B4/////////////////gAO//////////////////////////+AAA///////////////////////////w//////////////////////////////////////////////////////////////////////////////////////////";
  var maskBits = (function () {
    var bin = atob(MASK_B64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  })();
  function isLand(lat, lon) {
    var x = Math.floor(((lon + 180) / 360) * MASK_W);
    var y = Math.floor(((90 - lat) / 180) * MASK_H);
    if (x < 0) x = 0; if (x >= MASK_W) x = MASK_W - 1;
    if (y < 0) y = 0; if (y >= MASK_H) y = MASK_H - 1;
    var bi = y * MASK_W + x;
    return (maskBits[bi >> 3] >> (7 - (bi & 7))) & 1;
  }

  /* ---------- exchanges ---------- */
  var DESKS = ["FINANCIAL", "OPERATIONS", "PRODUCT", "LEGAL & RISK", "PRESS"];
  var EX = [
    { c: "NYSE",   city: "New York",   lat: 40.71,  lon: -74.01, tz: "America/New_York",  o: 570, e: 960,  d: [1,2,3,4,5], p: ["NVDA","AAPL","JPM","XOM","KO","DIS","BA","PFE"] },
    { c: "NASDAQ", city: "New York",   lat: 40.70,  lon: -73.90, tz: "America/New_York",  o: 570, e: 960,  d: [1,2,3,4,5], p: ["MSFT","AMZN","TSLA","META","GOOGL","AMD","NFLX","INTC"] },
    { c: "TSX",    city: "Toronto",    lat: 43.65,  lon: -79.38, tz: "America/Toronto",   o: 570, e: 960,  d: [1,2,3,4,5], p: ["SHOP","RY","ENB","TD","CNR"] },
    { c: "B3",     city: "São Paulo",  lat: -23.55, lon: -46.63, tz: "America/Sao_Paulo", o: 600, e: 1020, d: [1,2,3,4,5], p: ["PETR4","VALE3","ITUB","B3SA3"] },
    { c: "BMV",    city: "Mexico City",lat: 19.43,  lon: -99.13, tz: "America/Mexico_City",o: 510, e: 900, d: [1,2,3,4,5], p: ["AMXL","WALMEX","FEMSA","GFNORTE"] },
    { c: "LSE",    city: "London",     lat: 51.51,  lon: -0.13,  tz: "Europe/London",     o: 480, e: 990,  d: [1,2,3,4,5], p: ["HSBA","AZN","SHEL","ULVR","BP"] },
    { c: "EURONEXT",city:"Paris",      lat: 48.85,  lon: 2.35,   tz: "Europe/Paris",      o: 540, e: 1050, d: [1,2,3,4,5], p: ["MC","OR","TTE","SAN","AIR"] },
    { c: "FWB",    city: "Frankfurt",  lat: 50.11,  lon: 8.68,   tz: "Europe/Berlin",     o: 540, e: 1050, d: [1,2,3,4,5], p: ["SAP","SIE","VOW3","ALV","BMW"] },
    { c: "SIX",    city: "Zurich",     lat: 47.37,  lon: 8.54,   tz: "Europe/Zurich",     o: 540, e: 1050, d: [1,2,3,4,5], p: ["NESN","ROG","NOVN","UBSG"] },
    { c: "OMX",    city: "Stockholm",  lat: 59.33,  lon: 18.06,  tz: "Europe/Stockholm",  o: 540, e: 1050, d: [1,2,3,4,5], p: ["VOLVB","ERICB","ATCOA"] },
    { c: "TASE",   city: "Tel Aviv",   lat: 32.07,  lon: 34.79,  tz: "Asia/Jerusalem",    o: 599, e: 1035, d: [0,1,2,3,4], p: ["TEVA","NICE","ESLT","ICL"] },
    { c: "JSE",    city: "Johannesburg",lat:-26.20, lon: 28.04,  tz: "Africa/Johannesburg",o:540, e: 1020, d: [1,2,3,4,5], p: ["NPN","FSR","SOL","MTN"] },
    { c: "NSE",    city: "Mumbai",     lat: 19.08,  lon: 72.88,  tz: "Asia/Kolkata",      o: 555, e: 930,  d: [1,2,3,4,5], p: ["RELIANCE","TCS","INFY","HDFCBANK"] },
    { c: "SSE",    city: "Shanghai",   lat: 31.23,  lon: 121.47, tz: "Asia/Shanghai",     o: 570, e: 900,  d: [1,2,3,4,5], p: ["600519","601398","600036"] },
    { c: "HKEX",   city: "Hong Kong",  lat: 22.32,  lon: 114.17, tz: "Asia/Hong_Kong",    o: 570, e: 960,  d: [1,2,3,4,5], p: ["0700","9988","0939","3690"] },
    { c: "TSE",    city: "Tokyo",      lat: 35.68,  lon: 139.65, tz: "Asia/Tokyo",        o: 540, e: 900,  d: [1,2,3,4,5], p: ["7203","6758","9984","8306"] },
    { c: "KRX",    city: "Seoul",      lat: 37.57,  lon: 126.98, tz: "Asia/Seoul",        o: 540, e: 930,  d: [1,2,3,4,5], p: ["005930","000660","035420"] },
    { c: "SGX",    city: "Singapore",  lat: 1.29,   lon: 103.85, tz: "Asia/Singapore",    o: 540, e: 1020, d: [1,2,3,4,5], p: ["D05","O39","Z74"] },
    { c: "ASX",    city: "Sydney",     lat: -33.87, lon: 151.21, tz: "Australia/Sydney",  o: 600, e: 960,  d: [1,2,3,4,5], p: ["BHP","CBA","CSL","RIO"] }
  ];
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function isOpen(ex) {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: ex.tz, hour12: false, weekday: "short", hour: "numeric", minute: "numeric" }).formatToParts(new Date());
      var g = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ""; };
      var day = DAY_INDEX[g("weekday")];
      var mins = (parseInt(g("hour"), 10) % 24) * 60 + parseInt(g("minute"), 10);
      return ex.d.indexOf(day) !== -1 && mins >= ex.o && mins < ex.e;
    } catch (err) { return false; }
  }

  /* lat/lon -> unit vector */
  function toVec(lat, lon) {
    var la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
    return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
  }
  EX.forEach(function (ex) { ex.v = toVec(ex.lat, ex.lon); });

  /* ---------- land point cloud (Fibonacci sphere, land only) ---------- */
  var pts = (function () {
    var out = [];
    var N = 11000, ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var th = i * ga;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var lat = Math.asin(y) * 180 / Math.PI;
      var lon = Math.atan2(z, x) * 180 / Math.PI;
      if (isLand(lat, lon)) out.push(x, y, z);
    }
    return new Float32Array(out);
  })();

  /* ---------- sizing ---------- */
  var W = 0, H = 0, cx = 0, cy = 0, R = 0, dpr = 1;
  function resize() {
    var rect = stage.getBoundingClientRect();
    W = Math.round(rect.width); H = Math.round(rect.height);
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.42;
  }

  /* ---------- rotation state ---------- */
  var yaw = -1.3, tilt = -0.32, spin = 0.12, inertia = 0;
  var dragging = false, lastX = 0, lastY = 0, sYaw = 0, sTilt = 0, sPX = 0, sPY = 0, moved = false;

  /* ---------- ambient great-circle arcs ---------- */
  var arcs = [];
  function slerpArc(a, b, lift, steps) {
    var dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    dot = Math.max(-1, Math.min(1, dot));
    var om = Math.acos(dot), so = Math.sin(om) || 1e-6, pts2 = [];
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var w1 = Math.sin((1 - t) * om) / so, w2 = Math.sin(t * om) / so;
      var x = a[0]*w1 + b[0]*w2, y = a[1]*w1 + b[1]*w2, z = a[2]*w1 + b[2]*w2;
      var m = 1 + lift * Math.sin(Math.PI * t);
      pts2.push(x * m, y * m, z * m);
    }
    return new Float32Array(pts2);
  }
  function spawnArc() {
    var a = EX[(Math.random() * EX.length) | 0], b = EX[(Math.random() * EX.length) | 0];
    if (a === b) return;
    arcs.push({ pts: slerpArc(a.v, b.v, 0.22, 44), life: 0, ttl: 5.5 + Math.random() * 3, head: 0 });
  }
  if (!REDUCED) { spawnArc(); spawnArc(); spawnArc(); }

  /* ---------- script emission ---------- */
  var packets = [];
  var emitAcc = 0, emitNext = 1.1;

  function pushLog(ex, ticker, desk) {
    if (!logEl) return;
    var row = document.createElement("div");
    row.className = "glog-row";
    row.innerHTML = '<span class="glog-dot"></span><b>' + ticker + '</b><span class="glog-desk">' + desk +
      '</span><span class="glog-city">' + ex.city + '</span><span class="glog-air">▲ aired</span>';
    logEl.insertBefore(row, logEl.firstChild);
    while (logEl.children.length > 5) logEl.removeChild(logEl.lastChild);
    requestAnimationFrame(function () { row.classList.add("in"); });
  }

  function emit() {
    var open = EX.filter(function (e) { return e._front && e._open; });
    var pool = open.length ? open : EX.filter(function (e) { return e._front; });
    if (!pool.length) return;
    var ex = pool[(Math.random() * pool.length) | 0];
    var ticker = ex.p[(Math.random() * ex.p.length) | 0];
    var desk = DESKS[(Math.random() * DESKS.length) | 0];

    var dx = ex._sx - cx, dy = ex._sy - cy, dl = Math.hypot(dx, dy) || 1;
    dx /= dl; dy /= dl;

    if (!REDUCED) {
      packets.push({ x0: ex._sx, y0: ex._sy, dx: dx, dy: dy, life: 0, ttl: 2.6, beam: 0.85 });
      if (packetLayer) {
        var el = document.createElement("div");
        el.className = "globe-packet";
        el.innerHTML = '<span class="gp-dot"></span><b>' + ticker + '</b><span>' + desk + '</span>';
        packetLayer.appendChild(el);
        packets[packets.length - 1].el = el;
        packets[packets.length - 1].tx = ticker;
      }
    }
    pushLog(ex, ticker, desk);
  }

  /* ---------- alpha buckets for the dot field ---------- */
  var BUCKETS = 6;

  function frame(dt) {
    ctx.clearRect(0, 0, W, H);

    /* subtle sphere silhouette */
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha = 1;

    if (dragging) {
      /* yaw/tilt set by pointer handlers */
    } else {
      yaw += (spin + inertia) * dt;
      inertia *= 0.94;
      if (Math.abs(inertia) < 0.001) inertia = 0;
    }

    var cY = Math.cos(yaw), sY = Math.sin(yaw), cT = Math.cos(tilt), sT = Math.sin(tilt);

    /* project one vector -> [sx, sy, depth] */
    function proj(x, y, z) {
      var x1 = x * cY + z * sY;
      var z1 = -x * sY + z * cY;
      var y1 = y;
      var y2 = y1 * cT - z1 * sT;
      var z2 = y1 * sT + z1 * cT;
      return [cx + x1 * R, cy - y2 * R, z2];
    }

    /* --- land dots, bucketed by depth for cheap depth-fade --- */
    var paths = [];
    for (var b = 0; b < BUCKETS; b++) paths.push([]);
    for (var i = 0; i < pts.length; i += 3) {
      var x = pts[i], y = pts[i + 1], z = pts[i + 2];
      var x1 = x * cY + z * sY;
      var z1 = -x * sY + z * cY;
      var y2 = y * cT - z1 * sT;
      var z2 = y * sT + z1 * cT;
      if (z2 <= 0.02) continue;
      var sx = cx + x1 * R, sy = cy - y2 * R;
      var bi = (z2 * BUCKETS) | 0; if (bi >= BUCKETS) bi = BUCKETS - 1;
      paths[bi].push(sx, sy);
    }
    for (var bb = 0; bb < BUCKETS; bb++) {
      var arr = paths[bb];
      if (!arr.length) continue;
      var depth = (bb + 0.5) / BUCKETS;
      ctx.globalAlpha = 0.16 + depth * 0.72;
      var rad = 0.75 + depth * 1.05;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      for (var k = 0; k < arr.length; k += 2) {
        ctx.moveTo(arr[k] + rad, arr[k + 1]);
        ctx.arc(arr[k], arr[k + 1], rad, 0, 6.2832);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* --- ambient arcs --- */
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
    for (var a = arcs.length - 1; a >= 0; a--) {
      var arc = arcs[a];
      arc.life += dt; arc.head += dt * 0.42;
      if (arc.head > 1.15) arc.head = 0;
      var fade = Math.min(arc.life / 0.8, 1) * (1 - Math.max(0, arc.life - (arc.ttl - 1)));
      if (fade < 0) fade = 0;
      var ap = arc.pts, count = ap.length / 3;
      var px = 0, py = 0, pv = false;
      for (var s = 0; s < count; s++) {
        var pr = proj(ap[s * 3], ap[s * 3 + 1], ap[s * 3 + 2]);
        var vis = pr[2] > 0;
        if (vis && pv) {
          ctx.globalAlpha = 0.05 + 0.15 * fade;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(pr[0], pr[1]); ctx.stroke();
          var tt = s / (count - 1);
          if (Math.abs(tt - arc.head) < 0.05) {
            ctx.globalAlpha = 0.55 * fade;
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(pr[0], pr[1], 1.8, 0, 6.2832); ctx.fill();
          }
        }
        px = pr[0]; py = pr[1]; pv = vis;
      }
      if (arc.life > arc.ttl) { arcs.splice(a, 1); spawnArc(); }
    }
    ctx.globalAlpha = 1;

    /* --- exchange nodes --- */
    var openCount = 0;
    for (var n = 0; n < EX.length; n++) {
      var ex = EX[n];
      var p = proj(ex.v[0], ex.v[1], ex.v[2]);
      ex._sx = p[0]; ex._sy = p[1]; ex._front = p[2] > 0.02;
      ex._open = isOpen(ex);
      if (ex._open) openCount++;
      if (!ex._front) continue;
      var d = p[2];
      /* halo */
      var hr = (ex._open ? 7 : 4) + d * 3;
      var grad = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], hr);
      grad.addColorStop(0, "rgba(255,255,255," + (0.5 * (0.4 + d * 0.6)) + ")");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p[0], p[1], hr, 0, 6.2832); ctx.fill();
      /* core */
      ctx.globalAlpha = 0.5 + d * 0.5;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p[0], p[1], ex._open ? 2.2 : 1.5, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
      /* open-market pulse ring */
      if (ex._open && !REDUCED) {
        var pr2 = ((nowSec * 0.9 + n * 0.3) % 1);
        ctx.globalAlpha = (1 - pr2) * 0.4 * (0.4 + d * 0.6);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], 3 + pr2 * 12, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    if (hudMarkets) hudMarkets.textContent = openCount + (openCount === 1 ? " market open" : " markets open");

    /* --- launch beams (canvas) --- */
    for (var q = packets.length - 1; q >= 0; q--) {
      var pk = packets[q];
      pk.life += dt;
      var lt = pk.life / pk.ttl;
      if (pk.beam > 0) {
        var bl = Math.min(pk.life / 0.5, 1);
        var len = bl * 46;
        var hx = pk.x0 + pk.dx * len, hy = pk.y0 + pk.dy * len;
        var g2 = ctx.createLinearGradient(pk.x0, pk.y0, hx, hy);
        var ba = (1 - Math.max(0, (pk.life - 0.35) / 0.45)) * 0.9;
        g2.addColorStop(0, "rgba(255,255,255,0)");
        g2.addColorStop(1, "rgba(255,255,255," + Math.max(0, ba) + ")");
        ctx.strokeStyle = g2; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(pk.x0, pk.y0); ctx.lineTo(hx, hy); ctx.stroke();
        if (pk.life > 0.8) pk.beam = 0;
      }
      /* DOM packet */
      if (pk.el) {
        var e = easeOut(Math.min(lt, 1));
        var travel = (W < 640 ? 66 : 116) * e;
        var px = pk.x0 + pk.dx * travel;
        var py = pk.y0 + pk.dy * travel - 10 * e;
        var op = lt < 0.16 ? lt / 0.16 : Math.max(0, 1 - (lt - 0.16) / 0.84);
        var sc = 0.72 + 0.28 * Math.min(lt / 0.2, 1);
        pk.el.style.transform = "translate(-50%,-50%) translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
        pk.el.style.opacity = op.toFixed(3);
      }
      if (pk.life >= pk.ttl) {
        if (pk.el && pk.el.parentNode) pk.el.parentNode.removeChild(pk.el);
        packets.splice(q, 1);
      }
    }

    /* emission scheduling */
    if (!REDUCED) {
      emitAcc += dt;
      if (emitAcc >= emitNext) { emitAcc = 0; emitNext = 1.0 + Math.random() * 1.4; emit(); }
    }
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------- loop ---------- */
  var running = false, rafId = null, prev = 0, nowSec = 0;
  function tick(ts) {
    if (!running) return;
    if (!prev) prev = ts;
    var dt = Math.min((ts - prev) / 1000, 0.05);
    prev = ts; nowSec = ts / 1000;
    frame(dt);
    rafId = requestAnimationFrame(tick);
  }
  function start() {
    if (running) return;
    running = true; prev = 0;
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  /* ---------- interaction ---------- */
  function setYawTilt(px, py) {
    yaw = sYaw + (px - sPX) * 0.006;
    tilt = Math.max(-0.95, Math.min(0.55, sTilt - (py - sPY) * 0.005));
  }
  stage.addEventListener("pointerdown", function (ev) {
    if (REDUCED) return;
    dragging = true; moved = false;
    sPX = ev.clientX; sPY = ev.clientY; sYaw = yaw; sTilt = tilt; lastX = ev.clientX; lastY = ev.clientY;
    stage.setPointerCapture && stage.setPointerCapture(ev.pointerId);
    stage.classList.add("grabbing");
    if (hint) hint.classList.add("gone");
  });
  stage.addEventListener("pointermove", function (ev) {
    /* tooltip (hover, non-dragging) */
    if (!dragging) { updateTooltip(ev); return; }
    if (Math.abs(ev.clientX - sPX) + Math.abs(ev.clientY - sPY) > 3) moved = true;
    inertia = (ev.clientX - lastX) * 0.02;
    lastX = ev.clientX; lastY = ev.clientY;
    setYawTilt(ev.clientX, ev.clientY);
  });
  function endDrag(ev) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("grabbing");
    if (stage.releasePointerCapture && ev && ev.pointerId != null) { try { stage.releasePointerCapture(ev.pointerId); } catch (e) {} }
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("pointerleave", function (ev) { if (!dragging) hideTooltip(); });

  function updateTooltip(ev) {
    if (!tooltip || REDUCED) return;
    var rect = stage.getBoundingClientRect();
    var mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    var best = null, bd = 16;
    for (var i = 0; i < EX.length; i++) {
      var ex = EX[i]; if (!ex._front) continue;
      var d = Math.hypot(ex._sx - mx, ex._sy - my);
      if (d < bd) { bd = d; best = ex; }
    }
    if (best) {
      tooltip.innerHTML = '<b>' + best.c + '</b> · ' + best.city + '<span class="' + (best._open ? "gt-open" : "gt-closed") + '">' + (best._open ? "SESSION OPEN" : "CLOSED") + '</span>';
      tooltip.style.transform = "translate(-50%,-100%) translate(" + best._sx + "px," + (best._sy - 12) + "px)";
      tooltip.classList.add("show");
      stage.classList.add("hoverable");
    } else {
      hideTooltip();
    }
  }
  function hideTooltip() { if (tooltip) { tooltip.classList.remove("show"); stage.classList.remove("hoverable"); } }

  /* ---------- lifecycle ---------- */
  resize();
  function onResize() { resize(); if (REDUCED || !running) frame(0); }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(onResize);
    ro.observe(stage);
  } else {
    window.addEventListener("resize", onResize);
  }

  if (REDUCED) {
    /* single static frame + a couple of log rows */
    frame(0);
    for (var z = 0; z < 3; z++) {
      var ex = EX[(z * 6) % EX.length];
      pushLog(ex, ex.p[0], DESKS[z % DESKS.length]);
    }
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.08 });
    io.observe(stage);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (isOnScreen()) start();
    });
  } else {
    start();
  }
  function isOnScreen() {
    var r = stage.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }
})();
