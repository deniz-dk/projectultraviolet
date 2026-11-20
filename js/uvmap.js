/* Home page map: every medical school as a glowing dot on a dark map of Canada.
   A soft light drifts across the map and follows the mouse; dots it passes light up and show their names.
   Hover or tap a dot for the school's seats and deadline; click to open it. Dot size follows first-year seats. */
function uvMapHtml() {
  const C = UV_CANADA, S = UV_SCHOOLS().filter((s) => C.pts[s.id]);
  const r = (s) => (4.2 + Math.sqrt(+s.seats || 40) / 3).toFixed(1);
  const dots = S.map((s) => {
    const [x, y] = C.pts[s.id];
    const k = [...s.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const ripple = (n) => `<circle class="rip" r="${r(s)}" style="animation-delay:${(((k * (n + 3)) % 47) / 10).toFixed(1)}s;animation-duration:${(3.6 + (k % 13) / 6).toFixed(1)}s"/>`;
    return `<g class="uvdot" data-id="${s.id}" transform="translate(${x} ${y})"><circle class="halo" r="${(r(s) * 3.2).toFixed(1)}"/>${ripple(0)}${ripple(1)}<circle class="core" r="${r(s)}"/></g>`;
  }).join("");
  const seats = UV_SCHOOLS().reduce((a, s) => a + (+s.seats || 0), 0);
  // City labels, one per cluster, shown when the light passes
  const LAB = [["ubc", "Vancouver", -8, -14, "end"], ["ualberta", "Edmonton", 0, -16, "middle"], ["ucalgary", "Calgary", -10, 18, "end"], ["usask", "Saskatoon", 0, -15, "middle"], ["umanitoba", "Winnipeg", 0, -15, "middle"], ["nosm", "Sudbury", -6, -12, "end"], ["uoft", "Toronto", 10, 22, "start"], ["ottawa", "Ottawa", -10, -12, "end"], ["mcgill", "Montréal", -2, 22, "middle"], ["laval", "Québec", 0, -14, "middle"], ["dal", "Halifax", 10, 14, "start"], ["mun", "St. John’s", 0, -14, "middle"]];
  const labels = LAB.filter(([id]) => C.pts[id]).map(([id, t, dx, dy, a]) => `<text class="uvlab" data-for="${id}" x="${C.pts[id][0] + dx}" y="${C.pts[id][1] + dy}" text-anchor="${a}">${t}</text>`).join("");
  const reg = MED_PROV.map(([k, n]) => [n, UV_SCHOOLS().filter((s) => s.prov === k)]).filter(([, l]) => l.length);
  return `<section class="uvmap" aria-label="Map of Canada's medical schools">
    <div class="uvmaphead"><span class="uvkick">Coast to coast</span><h2>${UV_SCHOOLS().length} programs, ${seats.toLocaleString("en-CA")} first-year seats</h2></div>

    <svg class="uvmapsvg" viewBox="140 258 740 372" role="img" aria-label="Medical schools across Canada">
      <defs>
        <radialGradient id="uvspot"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <mask id="uvspotm"><rect width="${C.W}" height="${C.H}" fill="#000"/><circle class="uvspotc" cx="620" cy="500" r="105" fill="url(#uvspot)"/></mask>
        <radialGradient id="uvglowg"><stop offset="0" stop-color="#a78bfa" stop-opacity=".38"/><stop offset=".5" stop-color="#6366f1" stop-opacity=".12"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></radialGradient>
        <linearGradient id="uvland" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
      </defs>
      <circle class="uvglow" cx="620" cy="500" r="130" fill="url(#uvglowg)"/>
      <path class="land" d="${C.d}"/>
      <path class="land lit" d="${C.d}" mask="url(#uvspotm)"/>
      ${dots}
    </svg>
    <div class="uvmaptip" hidden></div>
    <ul class="uvmapreg">${reg.map(([n, l]) => `<li><b>${l.length}</b><span>${acctEsc(n)}</span><small>${l.reduce((a, s) => a + (+s.seats || 0), 0).toLocaleString("en-CA")} seats</small></li>`).join("")}</ul>
    <ul class="uvmaplist">${S.map((s) => `<li><a href="#school-${s.id}">${acctEsc(s.short)}</a></li>`).join("")}</ul>
  </section>`;
}
function wireUvMap() {
  const box = document.querySelector(".uvmap");
  if (!box) return;
  const svg = box.querySelector("svg"), spot = box.querySelector(".uvspotc"), glow = box.querySelector(".uvglow"), tip = box.querySelector(".uvmaptip");
  const C = UV_CANADA, dots = [...box.querySelectorAll(".uvdot")], labs = [...box.querySelectorAll(".uvlab")];
  const P = dots.map((g) => ({ g, id: g.dataset.id, x: C.pts[g.dataset.id][0], y: C.pts[g.dataset.id][1] }));
  const VB = svg.getAttribute("viewBox").split(" ").map(Number);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const st = { cur: { x: 620, y: 500 }, tgt: { x: 620, y: 500 }, mode: "idle", hold: 0, raf: 0, vis: true, pin: null };
  const toMap = (cx, cy) => {
    const r = svg.getBoundingClientRect();
    return { x: VB[0] + ((cx - r.left) / r.width) * VB[2], y: VB[1] + ((cy - r.top) / r.height) * VB[3] };
  };
  const paint = () => {
    spot.setAttribute("cx", st.cur.x.toFixed(1));
    spot.setAttribute("cy", st.cur.y.toFixed(1));
    glow.setAttribute("cx", st.cur.x.toFixed(1));
    glow.setAttribute("cy", st.cur.y.toFixed(1));
    P.forEach((p) => {
      const d = Math.hypot(p.x - st.cur.x, p.y - st.cur.y);
      p.g.style.setProperty("--lit", Math.max(0, 1 - d / 95).toFixed(2));
    });
    labs.forEach((l) => {
      const p = C.pts[l.dataset.for], d = Math.hypot(p[0] - st.cur.x, p[1] - st.cur.y);
      l.style.opacity = Math.max(0, Math.min(1, (1 - d / 170) * 1.8)).toFixed(2);
    });
  };
  // Idle: drift slowly along the band where the schools are
  const tick = (t) => {
    if (st.mode === "idle" && !reduce) {
      const s = t / 1000;
      st.tgt = { x: 520 + 330 * Math.sin(s * 0.16), y: 500 + 45 * Math.sin(s * 0.31 + 1) };
    }
    if (st.mode === "hold" && Date.now() > st.hold) st.mode = "idle";
    const k = st.mode === "idle" ? 0.04 : 0.22;
    st.cur.x += (st.tgt.x - st.cur.x) * k;
    st.cur.y += (st.tgt.y - st.cur.y) * k;
    paint();
    st.raf = st.vis && box.isConnected ? requestAnimationFrame(tick) : 0;
  };
  paint();
  st.raf = requestAnimationFrame(tick);
  if ("IntersectionObserver" in window)
    new IntersectionObserver(([e]) => {
      st.vis = e.isIntersecting;
      if (st.vis && !st.raf && box.isConnected) st.raf = requestAnimationFrame(tick);
    }).observe(box);
  // Schools near a point (Toronto, Montréal and Vancouver dots overlap, so list them together)
  const near = (m) => {
    const by = P.map((p) => [p, Math.hypot(p.x - m.x, p.y - m.y)]).sort((a, b) => a[1] - b[1]);
    if (!by.length || by[0][1] > 26) return [];
    return by.filter(([, d]) => d < by[0][1] + 14).map(([p]) => p);
  };
  const cyc = medDefaultCycle();
  const showTip = (list) => {
    dots.forEach((g) => g.classList.remove("on"));
    if (!list.length) return (tip.hidden = true);
    list.forEach((p) => p.g.classList.add("on"));
    tip.innerHTML = list
      .map((p) => {
        const s = medSchool(p.id), mn = medMain(s, cyc);
        return `<a href="#school-${s.id}"><b>${acctEsc(s.short)}</b><span>${acctEsc(s.city.split(",")[0])} · ${s.seats} seats · deadline ${prepFmt(mn.d, { month: "short", day: "numeric" })}${mn.est ? " (expected)" : ""}</span></a>`;
      })
      .join("");
    tip.hidden = false;
    const r = svg.getBoundingClientRect(), b = box.getBoundingClientRect(), p = list[0];
    const px = r.left - b.left + ((p.x - VB[0]) / VB[2]) * r.width, py = r.top - b.top + ((p.y - VB[1]) / VB[3]) * r.height;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(b.width - tw - 8, px - tw / 2)) + "px";
    tip.style.top = (py - th - 16 < 8 ? py + 18 : py - th - 16) + "px";
  };
  svg.addEventListener("pointermove", (e) => {
    const m = toMap(e.clientX, e.clientY);
    if (e.pointerType === "mouse") return (st.mode = "mouse"), (st.tgt = m), showTip(near(m));
    // Touch: the light follows the finger; no school cards on phones
    st.mode = "hold";
    st.hold = Date.now() + 4000;
    st.tgt = m;
  });
  box.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    st.mode = "idle";
    showTip([]);
  });
  svg.addEventListener("click", (e) => {
    const m = toMap(e.clientX, e.clientY), list = near(m);
    if (!matchMedia("(hover: hover)").matches) {
      // Touch: a tap only moves the light
      st.mode = "hold";
      st.hold = Date.now() + 4000;
      st.tgt = m;
      return;
    }
    if (list.length === 1) go("school-" + list[0].id);
  });
}
