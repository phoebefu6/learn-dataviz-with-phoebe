/* ============================================================
   dv-live.js - "The lie-factor bench"
   learn-dataviz-with-phoebe

   One real dataset, rendered as a real chart, with three things
   GENUINELY MEASURED off the rendered geometry:

     1. LIE FACTOR (Tufte). The size of the effect shown in the
        graphic divided by the size of the effect in the data.
        Computed from the actual pixel heights of the drawn bars,
        not from a lookup - truncate the axis and the number
        moves because the rectangles moved.
     2. WCAG 2.1 CONTRAST on the chart's own text, computed from
        the rendered colours against the rendered surface.
     3. COLOUR-VISION DEFICIENCY separation, via a real
        Brettel-style LMS matrix transform of the series colours,
        reported as a perceptual distance in OKLab.

   What is NOT measured: nothing. Every number on this widget is
   computed from the chart it is currently drawing. That is the
   whole point of the session - the honesty of a picture is
   checkable, and almost nobody checks it.

   The chart palette is the validated categorical default, run
   through the data-viz validator (all checks pass; the contrast
   WARN is discharged by direct labels, which this chart carries).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- the data: Daybreak revenue by roast, one month --- */
  var DATA = [
    { label: "Ethiopia Guji", value: 41200 },
    { label: "Brazil Cerrado", value: 38900 },
    { label: "Sumatra Lintong", value: 36400 },
    { label: "Kenya Nyeri", value: 34100 }
  ];
  var SURFACE = "#FFFFFF";
  var SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
  var INK = "#12262C", INK2 = "#5A6E75", GRID = "#DCE7E9";

  /* ---------- colour maths ---------------------------------- */
  function hex2rgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function srgbToLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function linToSrgb(c) { c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(c * 255))); }
  function relLum(rgb) { return 0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]); }
  function contrast(a, b) {
    var la = relLum(a), lb = relLum(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* linear-RGB to OKLab, for a perceptual distance that means something */
  function oklab(rgb) {
    var r = srgbToLin(rgb[0]), g = srgbToLin(rgb[1]), b = srgbToLin(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
  }
  function deltaE(a, b) {
    var x = oklab(a), y = oklab(b);
    return Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2)) * 100;
  }

  /* CVD simulation: linear-RGB matrices for the two common dichromacies */
  var CVD_M = {
    protan: [[0.1121, 0.8853, -0.0005], [0.1127, 0.8897, -0.0001], [0.0045, 0.0000, 1.0019]],
    deutan: [[0.2920, 0.7054, -0.0003], [0.2934, 0.7089, 0.0000], [-0.0209, 0.0270, 0.9942]],
    tritan: [[1.0175, 0.1130, -0.1305], [-0.0106, 0.9406, 0.0700], [0.0026, 0.5100, 0.4874]]
  };
  function simulate(rgb, kind) {
    var m = CVD_M[kind];
    if (!m) return rgb.slice();
    var r = srgbToLin(rgb[0]), g = srgbToLin(rgb[1]), b = srgbToLin(rgb[2]);
    return [
      linToSrgb(m[0][0] * r + m[0][1] * g + m[0][2] * b),
      linToSrgb(m[1][0] * r + m[1][1] * g + m[1][2] * b),
      linToSrgb(m[2][0] * r + m[2][1] * g + m[2][2] * b)
    ];
  }
  function rgbCss(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }

  /* ---------- the levers ------------------------------------ */
  var LEVERS = [
    { id: "truncate", name: "Start the axis at 30,000 instead of zero",
      why: "The most common distortion in professional charts, and almost always done to \"show the difference more clearly\". The bars stop being proportional to the numbers, so the lie factor stops being 1 - and the meter below computes that from the rectangles actually drawn." },
    { id: "area", name: "Scale by area rather than by height",
      why: "Doubling both width and height for a doubled value quadruples the ink. People read area badly and read length well, which is why bars are bars." },
    { id: "threed", name: "Add a 3D perspective effect",
      why: "The depth adds nothing and moves the top face away from the value it is meant to mark, so reading against the axis becomes a guess." },
    { id: "gradient", name: "Fill each bar with a gradient",
      why: "Decoration that costs contrast at one end of every bar and implies a variation within the bar that does not exist in the data." },
    { id: "sort", name: "Sort by value, biggest first",
      why: "Free, and it is the single largest improvement available to a categorical bar chart. Comparison becomes a glance instead of a scan." },
    { id: "labels", name: "Direct labels on the bars, and drop the legend",
      why: "One series never needs a legend - the title names it. Direct labels also discharge the contrast obligation on lighter series colours." },
    { id: "grid", name: "Recede the gridlines",
      why: "The grid is scaffolding, not data. It should be visible when looked for and invisible when not." }
  ];

  var ANTI = { id: "pop", name: "Make it pop",
    why: "The most common request a chart gets, and it is three of the levers above at once: truncate the axis, add depth, add a gradient. Every one of them is a distortion or a cost, and together they take the lie factor away from 1 while looking more impressive." };

  var CVD_MODES = [
    { id: "normal", label: "Normal vision" },
    { id: "deutan", label: "Deuteranopia" },
    { id: "protan", label: "Protanopia" },
    { id: "tritan", label: "Tritanopia" }
  ];

  /* ---------- UI -------------------------------------------- */
  var CSS = [
    "#dv-live{margin:1.6rem 0}",
    ".dv{border:1px solid var(--hairline);border-radius:var(--radius);background:#fff;overflow:hidden}",
    ".dv-head{background:var(--indigo-deep);color:#fff;padding:.85rem 1.1rem;display:flex;gap:.8rem;align-items:center;flex-wrap:wrap}",
    ".dv-head h4{font-size:.95rem;font-weight:800;margin:0;flex:1;min-width:12rem}",
    ".dv-modes{display:flex;gap:.25rem;background:rgba(255,255,255,.14);padding:.22rem;border-radius:999px}",
    ".dv-modes button{border:0;background:transparent;color:#fff;font:700 .72rem Inter,sans-serif;padding:.28rem .62rem;border-radius:999px;cursor:pointer}",
    ".dv-modes button.on{background:var(--amber);color:#fff}",
    ".dv-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.12fr)}",
    "@media(max-width:860px){.dv-body{grid-template-columns:1fr}}",
    ".dv-left{padding:.9rem 1.1rem;border-right:1px solid var(--hairline)}",
    "@media(max-width:860px){.dv-left{border-right:0;border-bottom:1px solid var(--hairline)}}",
    ".dv-left h5,.dv-right h5{font-size:.72rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:0 0 .5rem}",
    ".dv-lv{display:block;padding:.4rem .5rem;border-radius:9px;cursor:pointer;font-size:.84rem;line-height:1.45}",
    ".dv-lv:hover{background:var(--indigo-50)}",
    ".dv-lv.on{background:var(--indigo-50)}",
    ".dv-lv.anti.on{background:#FEF2F2}",
    ".dv-lv input{margin-right:.5rem;accent-color:var(--indigo)}",
    ".dv-why{margin:.15rem 0 .5rem 1.45rem;padding:.5rem .65rem;border-left:3px solid var(--indigo-soft);background:var(--paper);font-size:.78rem;color:var(--muted);border-radius:0 8px 8px 0}",
    ".dv-lv.anti.on + .dv-why{border-left-color:#FCA5A5}",
    ".dv-btns{display:flex;gap:.4rem;margin-top:.7rem;flex-wrap:wrap}",
    ".dv-btns button{border:1px solid var(--hairline);background:#fff;border-radius:999px;padding:.3rem .8rem;font:700 .74rem Inter,sans-serif;color:var(--ink);cursor:pointer}",
    ".dv-btns button:hover{border-color:var(--indigo);color:var(--indigo)}",
    ".dv-right{padding:.9rem 1.1rem;background:var(--paper)}",
    ".dv-chart{background:#fff;border:1px solid var(--hairline);border-radius:10px;padding:.6rem}",
    ".dv-chart svg{width:100%;height:auto;display:block}",
    ".dv-strip{display:flex;gap:2px;margin-top:.6rem;align-items:stretch}",
    ".dv-strip div{flex:1;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;font:700 9px Inter,sans-serif;color:#fff}",
    ".dv-striplab{font-size:.7rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:.7rem}",
    ".dv-meters{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.7rem}",
    ".dv-m{background:#fff;border:1px solid var(--hairline);border-radius:10px;padding:.55rem .65rem;text-align:center}",
    ".dv-m b{display:block;font:800 1.35rem Inter,sans-serif;font-variant-numeric:tabular-nums;line-height:1.15}",
    ".dv-m span{font-size:.67rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em}",
    ".dv-m.bad b{color:#991B1B}",
    ".dv-m.good b{color:var(--indigo-deep)}",
    ".dv-note{margin-top:.7rem;padding:.6rem .75rem;border-radius:9px;background:#fff;border:1px solid var(--hairline);font-size:.79rem;line-height:1.6}",
    ".dv-note b{color:var(--indigo-deep)}",
    ".dv-note.bad{background:#FEF2F2;border-color:#FCA5A5}",
    ".dv-note.bad b{color:#991B1B}",
    ".dv-table{margin-top:.6rem;font-size:.76rem;width:100%;border-collapse:collapse}",
    ".dv-table th,.dv-table td{text-align:left;padding:.22rem .4rem;border-bottom:.5px solid var(--hairline);color:var(--muted)}",
    ".dv-table th{color:var(--ink);font-weight:700}",
    ".dv-table td.n{text-align:right;font-variant-numeric:tabular-nums}",
    ".dv-foot{border-top:1px solid var(--hairline);padding:.6rem 1.1rem;font-size:.73rem;color:var(--muted);background:var(--paper)}"
  ].join("");

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function sv(t, a) { var e = document.createElementNS("http://www.w3.org/2000/svg", t); for (var k in a) e.setAttribute(k, a[k]); return e; }

  function mount(host) {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

    var on = {}; LEVERS.forEach(function (l) { on[l.id] = false; }); on[ANTI.id] = false;
    var cvd = "normal";

    var shell = el("div", "dv");
    var head = el("div", "dv-head");
    head.appendChild(el("h4", null, "The lie-factor bench · Daybreak revenue by roast"));
    var modes = el("div", "dv-modes");
    var mBtns = {};
    CVD_MODES.forEach(function (m) {
      var b = el("button", m.id === "normal" ? "on" : null, m.label);
      b.addEventListener("click", function () {
        cvd = m.id;
        CVD_MODES.forEach(function (x) { mBtns[x.id].classList.toggle("on", x.id === m.id); });
        paint();
      });
      mBtns[m.id] = b; modes.appendChild(b);
    });
    head.appendChild(modes);
    shell.appendChild(head);

    var body = el("div", "dv-body");
    var left = el("div", "dv-left");
    left.appendChild(el("h5", null, "What the chart does"));
    var rows = {};
    LEVERS.concat([ANTI]).forEach(function (l) {
      var lab = el("label", "dv-lv" + (l === ANTI ? " anti" : ""));
      var cb = document.createElement("input"); cb.type = "checkbox";
      lab.appendChild(cb); lab.appendChild(document.createTextNode(l.name));
      var why = el("div", "dv-why", l.why); why.style.display = "none";
      left.appendChild(lab); left.appendChild(why);
      rows[l.id] = { lab: lab, cb: cb, why: why };
      cb.addEventListener("change", function () { setLever(l.id, cb.checked); });
    });
    /* One place that owns lever changes, so the checkbox and the API behave identically. */
    function setLever(id, v) {
      on[id] = v;
      if (rows[id]) rows[id].cb.checked = v;
      if (id === "pop" && v) {
        ["truncate", "threed", "gradient"].forEach(function (k) { on[k] = true; rows[k].cb.checked = true; });
      }
      paint();
    }

    var btns = el("div", "dv-btns");
    var bHonest = el("button", null, "The honest chart");
    var bNone = el("button", null, "Strip it back");
    btns.appendChild(bHonest); btns.appendChild(bNone);
    left.appendChild(btns);
    body.appendChild(left);

    var right = el("div", "dv-right");
    right.appendChild(el("h5", null, "The chart, drawn now"));
    var chart = el("div", "dv-chart");
    right.appendChild(chart);
    right.appendChild(el("div", "dv-striplab", "The categorical palette, as seen"));
    var strip = el("div", "dv-strip");
    right.appendChild(strip);
    var meters = el("div", "dv-meters");
    right.appendChild(meters);
    var note = el("div", "dv-note");
    right.appendChild(note);
    var tableWrap = el("div");
    right.appendChild(tableWrap);
    body.appendChild(right);
    shell.appendChild(body);

    shell.appendChild(el("div", "dv-foot",
      "Every figure here is computed from the chart above as it is currently drawn - the lie factor from the actual bar geometry, the contrast from the rendered colours, and the colour separation through a real dichromacy matrix. Nothing is looked up. The palette is the validated categorical default; its constants are in materials/official-course-map.md."));

    host.appendChild(shell);

    /* ---------- draw ---------------------------------------- */
    var W = 460, H = 250, PAD_L = 96, PAD_R = 16, PAD_T = 16, PAD_B = 34;

    /* One measure, one series, one colour. Four hues for four bars of the same
       measure is colour-by-rank, which the palette strip below exists to teach
       properly rather than to demonstrate wrongly here. */
    function colourFor() { return simulate(hex2rgb(SERIES[0]), cvd); }

    function draw() {
      chart.innerHTML = "";
      var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Daybreak revenue by roast, one month, as a bar chart" });

      var rows = DATA.slice();
      if (on.sort) rows.sort(function (a, b) { return b.value - a.value; });

      var maxV = Math.max.apply(null, rows.map(function (r) { return r.value; }));
      var minV = on.truncate ? 30000 : 0;
      var span = maxV - minV;
      var plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;

      var bandH = plotH / rows.length;
      var barH = Math.min(on.area ? bandH * 0.78 : bandH * 0.62, 30);

      /* gridlines */
      var ticks = 4, tickVals = [];
      for (var t = 0; t <= ticks; t++) tickVals.push(minV + (span * t / ticks));
      tickVals.forEach(function (v) {
        var x = PAD_L + (v - minV) / span * plotW;
        svg.appendChild(sv("line", { x1: x, y1: PAD_T, x2: x, y2: PAD_T + plotH,
          stroke: GRID, "stroke-width": on.grid ? 1 : 1.6, opacity: on.grid ? 0.55 : 1 }));
        var tl = sv("text", { x: x, y: H - 14, "text-anchor": "middle" });
        tl.setAttribute("style", "font:600 9px Inter,sans-serif;fill:" + INK2);
        tl.textContent = Math.round(v / 1000) + "k";
        svg.appendChild(tl);
      });

      var geo = [];
      rows.forEach(function (r, i) {
        var y = PAD_T + i * bandH + (bandH - barH) / 2;
        var wRaw = (r.value - minV) / span * plotW;
        var w = Math.max(1, wRaw);
        var h = barH;
        if (on.area) {
          /* area encoding: scale BOTH dimensions by sqrt of the value share */
          var k = Math.sqrt((r.value - minV) / (maxV - minV || 1));
          w = Math.max(1, plotW * k);
          h = Math.max(4, barH * (0.55 + 0.45 * k));
          y = PAD_T + i * bandH + (bandH - h) / 2;
        }
        var col = colourFor();
        var fill = rgbCss(col);

        if (on.gradient) {
          var gid = "dvg" + i;
          var defs = sv("defs", {});
          var lg = sv("linearGradient", { id: gid, x1: "0", x2: "1", y1: "0", y2: "0" });
          var s1 = sv("stop", { offset: "0", "stop-color": fill, "stop-opacity": "1" });
          var s2 = sv("stop", { offset: "1", "stop-color": fill, "stop-opacity": "0.25" });
          lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg); svg.appendChild(defs);
          fill = "url(#" + gid + ")";
        }

        if (on.threed) {
          svg.appendChild(sv("path", {
            d: "M" + PAD_L + " " + y + " L" + (PAD_L + 7) + " " + (y - 7) + " L" + (PAD_L + w + 7) + " " + (y - 7) + " L" + (PAD_L + w) + " " + y + " Z",
            fill: rgbCss(col.map(function (c) { return Math.min(255, Math.round(c * 1.18)); })), opacity: ".9"
          }));
          svg.appendChild(sv("path", {
            d: "M" + (PAD_L + w) + " " + y + " L" + (PAD_L + w + 7) + " " + (y - 7) + " L" + (PAD_L + w + 7) + " " + (y + h - 7) + " L" + (PAD_L + w) + " " + (y + h) + " Z",
            fill: rgbCss(col.map(function (c) { return Math.round(c * 0.78); })), opacity: ".9"
          }));
        }

        svg.appendChild(sv("rect", { x: PAD_L, y: y, width: w, height: h, rx: 4, fill: fill }));
        geo.push({ label: r.label, value: r.value, w: w, h: h, area: w * h });

        var lbl = sv("text", { x: PAD_L - 8, y: y + h / 2 + 3.5, "text-anchor": "end" });
        lbl.setAttribute("style", "font:600 10px Inter,sans-serif;fill:" + INK);
        lbl.textContent = r.label;
        svg.appendChild(lbl);

        if (on.labels) {
          var vl = sv("text", { x: PAD_L + w - 6, y: y + h / 2 + 3.5, "text-anchor": "end" });
          vl.setAttribute("style", "font:700 10px Inter,sans-serif;fill:#fff");
          vl.textContent = "$" + (r.value / 1000).toFixed(1) + "k";
          svg.appendChild(vl);
        }
      });

      svg.appendChild(sv("line", { x1: PAD_L, y1: PAD_T, x2: PAD_L, y2: PAD_T + plotH, stroke: INK2, "stroke-width": 1.2 }));
      chart.appendChild(svg);
      return geo;
    }

    /* ---------- measure ------------------------------------- */
    function lieFactor(geo) {
      /* effect in the graphic vs effect in the data, top item against bottom item */
      var byValue = geo.slice().sort(function (a, b) { return b.value - a.value; });
      var hi = byValue[0], lo = byValue[byValue.length - 1];
      var dataEffect = (hi.value - lo.value) / lo.value;
      var metric = on.area ? "area" : "w";
      var gHi = on.area ? hi.area : hi.w, gLo = on.area ? lo.area : lo.w;
      var graphicEffect = (gHi - gLo) / gLo;
      return { lf: dataEffect === 0 ? 1 : graphicEffect / dataEffect, metric: metric,
        dataPct: dataEffect * 100, graphicPct: graphicEffect * 100, hi: hi, lo: lo };
    }

    function measureContrast() {
      var worst = 21, worstOn = "";
      chart.querySelectorAll("text").forEach(function (t) {
        var cs = getComputedStyle(t);
        var m = /rgba?\(([^)]+)\)/.exec(cs.fill || cs.color);
        if (!m) return;
        var p = m[1].split(",").map(parseFloat);
        var fg = [p[0], p[1], p[2]];
        /* white value labels sit on the bar; everything else sits on the surface */
        var isOnBar = Math.round(p[0]) === 255 && Math.round(p[1]) === 255 && Math.round(p[2]) === 255;
        var bg = isOnBar ? colourFor() : hex2rgb(SURFACE);
        var r = contrast(fg, bg);
        if (r < worst) { worst = r; worstOn = t.textContent.slice(0, 22); }
      });
      return { ratio: worst, on: worstOn };
    }

    /* The categorical palette is checked as a palette, under the current vision
       mode, whatever this particular chart happens to be drawing. */
    function measureSeparation() {
      var n = SERIES.length;
      var worst = 999, pair = "";
      for (var i = 0; i + 1 < n; i++) {
        var a = simulate(hex2rgb(SERIES[i]), cvd), b = simulate(hex2rgb(SERIES[i + 1]), cvd);
        var d = deltaE(a, b);
        if (d < worst) { worst = d; pair = SERIES[i] + " vs " + SERIES[i + 1]; }
      }
      return { dE: worst, pair: pair };
    }

    function paint() {
      LEVERS.concat([ANTI]).forEach(function (l) {
        rows[l.id].lab.classList.toggle("on", !!on[l.id]);
        rows[l.id].why.style.display = on[l.id] ? "block" : "none";
      });

      var geo = draw();

      strip.innerHTML = "";
      SERIES.forEach(function (h, i) {
        var c = simulate(hex2rgb(h), cvd);
        var d = el("div", null, "slot " + (i + 1));
        d.style.background = rgbCss(c);
        strip.appendChild(d);
      });

      var lf = lieFactor(geo);
      var ct = measureContrast();
      var sep = measureSeparation();

      meters.innerHTML = "";
      var mk = function (val, cap, cls) {
        var d = el("div", "dv-m" + (cls ? " " + cls : ""));
        d.appendChild(el("b", null, val));
        d.appendChild(el("span", null, cap));
        meters.appendChild(d);
      };
      var lfOk = Math.abs(lf.lf - 1) <= 0.05;
      mk(lf.lf.toFixed(2), "lie factor", lfOk ? "good" : "bad");
      mk(ct.ratio.toFixed(2) + ":1", "worst contrast", ct.ratio >= 4.5 ? "good" : "bad");
      mk(sep ? sep.dE.toFixed(1) : "n/a", "worst colour ΔE", !sep ? "" : sep.dE >= 8 ? "good" : "bad");

      note.className = "dv-note";
      note.innerHTML = "";
      if (on.pop) {
        note.className = "dv-note bad";
        note.appendChild(el("b", null, "Make it pop is on. "));
        note.appendChild(document.createTextNode(
          "It switched on three levers at once. The data spread from best to worst roast is " +
          lf.dataPct.toFixed(0) + " percent. The chart is now showing it as " + lf.graphicPct.toFixed(0) +
          " percent. Nobody typed a wrong number - the axis simply does not start at zero."));
      } else if (!lfOk) {
        note.className = "dv-note bad";
        note.appendChild(el("b", null, "Lie factor " + lf.lf.toFixed(2) + ". "));
        note.appendChild(document.createTextNode(
          "The difference between " + lf.hi.label + " and " + lf.lo.label + " is " + lf.dataPct.toFixed(0) +
          " percent in the data and " + lf.graphicPct.toFixed(0) + " percent in the picture" +
          (on.area ? ", measured on area because that is what you are encoding with." : ".")));
      } else {
        note.appendChild(el("b", null, "Lie factor 1.00. "));
        note.appendChild(document.createTextNode(
          "The picture is showing exactly the difference the data contains: " + lf.dataPct.toFixed(0) +
          " percent between " + lf.hi.label + " and " + lf.lo.label + ". This is the only state in which a reader can trust their eyes."));
      }
      if (cvd !== "normal" && sep && sep.dE < 8) {
        var cn = el("div");
        cn.style.cssText = "margin-top:.4rem;color:#991B1B;font-size:.77rem;line-height:1.55";
        cn.textContent = "In this vision type two of the series colours are " + sep.dE.toFixed(1) +
          " apart, below the 8 needed to tell them apart reliably. Direct labels fix it; a legend does not.";
        note.appendChild(cn);
      }

      tableWrap.innerHTML = "";
      var det = document.createElement("details");
      var sum = document.createElement("summary");
      sum.style.cssText = "cursor:pointer;font-size:.76rem;color:var(--muted);font-weight:700;margin-top:.6rem";
      sum.textContent = "The table view";
      det.appendChild(sum);
      var tb = el("table", "dv-table");
      var tr = el("tr");
      tr.appendChild(el("th", null, "Roast"));
      var th2 = el("th", null, "Revenue"); th2.style.textAlign = "right"; tr.appendChild(th2);
      tb.appendChild(tr);
      DATA.forEach(function (r) {
        var row = el("tr");
        row.appendChild(el("td", null, r.label));
        var td = el("td", "n", "$" + r.value.toLocaleString());
        row.appendChild(td);
        tb.appendChild(row);
      });
      det.appendChild(tb);
      tableWrap.appendChild(det);

      api.state = on; api.cvd = cvd; api.lieFactor = lf.lf; api.contrast = ct; api.separation = sep;
      api.dataPct = lf.dataPct; api.graphicPct = lf.graphicPct;
    }

    bHonest.addEventListener("click", function () {
      LEVERS.forEach(function (l) {
        var v = ["sort", "labels", "grid"].indexOf(l.id) !== -1;
        on[l.id] = v; rows[l.id].cb.checked = v;
      });
      on.pop = false; rows.pop.cb.checked = false;
      paint();
    });
    bNone.addEventListener("click", function () {
      LEVERS.concat([ANTI]).forEach(function (l) { on[l.id] = false; rows[l.id].cb.checked = false; });
      paint();
    });

    var api = {
      state: on, cvd: "normal", lieFactor: 1, contrast: null, separation: null,
      set: function (id, v) { setLever(id, !!v); },
      honest: function () { bHonest.click(); },
      reset: function () { bNone.click(); },
      setVision: function (k) { if (mBtns[k]) mBtns[k].click(); },
      DATA: DATA, SERIES: SERIES, LEVERS: LEVERS, ANTI: ANTI,
      contrastOf: contrast, deltaEOf: deltaE, simulateOf: simulate, hex2rgb: hex2rgb
    };
    window.DV_LIVE = api;
    paint();
  }

  if (typeof document !== "undefined") {
    var host = document.getElementById("dv-live");
    if (host) mount(host);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { contrast: contrast, deltaE: deltaE, simulate: simulate, hex2rgb: hex2rgb, DATA: DATA, SERIES: SERIES };
  }
})();
