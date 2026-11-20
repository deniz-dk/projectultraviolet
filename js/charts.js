/* ============================================================
   CHARTS for the admin dashboard. Plain SVG/HTML, one hue per chart (validated
   violet: #7c3aed light, #8b5cf6 dark via --uv-chart), thin marks, recessive grid,
   hover readouts that are also reachable as tables (no value is hover-only).
   ============================================================ */
const chEsc = (t) => acctEsc(t);
const chNum = (n) => (n == null ? "—" : Number(n).toLocaleString("en-CA"));

/* Line chart over days. series: [{d:"2026-11-20", v:12}]. Hover/focus: crosshair + tooltip. */
function lineChart(id, series, label, opts = {}) {
  const W = 760, H = opts.h || 220, L = 40, R = 14, T = 16, B = 28;
  if (!series.length) return `<p class="note">No data yet.</p>`;
  const max = Math.max(1, ...series.map((p) => p.v));
  const nice = (m) => { const p = Math.pow(10, Math.floor(Math.log10(m))); return Math.ceil(m / p) * p; };
  const top = nice(max);
  const x = (i) => L + (series.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (series.length - 1));
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const pts = series.map((p, i) => [x(i), y(p.v)]);
  const line = pts.map(([a, b], i) => (i ? "L" : "M") + a.toFixed(1) + " " + b.toFixed(1)).join("");
  const area = line + `L${pts[pts.length - 1][0].toFixed(1)} ${H - B}L${pts[0][0].toFixed(1)} ${H - B}Z`;
  const ticks = [0, top / 2, top];
  const every = Math.ceil(series.length / 8);
  const fmtD = (d) => prepFmt(d, { month: "short", day: "numeric" });
  const ptsAttr = acctEsc(JSON.stringify(series.map((p, i) => [p.d, p.v, +x(i).toFixed(1), +y(p.v).toFixed(1)])));
  return `<figure class="chfig" data-chart="${id}" data-pts="${ptsAttr}"><figcaption>${chEsc(label)}</figcaption>
  <div class="chwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${chEsc(label)}: ${series.length} days, peak ${chNum(max)}">
    ${ticks.map((t) => `<line class="chgrid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="chax" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${chNum(Math.round(t))}</text>`).join("")}
    ${series.map((p, i) => ((i % every === 0 && series.length - 1 - i >= every / 2) || i === series.length - 1 ? `<text class="chax" x="${x(i)}" y="${H - 8}" text-anchor="middle">${fmtD(p.d)}</text>` : "")).join("")}
    <path class="charea" d="${area}"/><path class="chline" d="${line}"/>
    <line class="chcross" x1="0" x2="0" y1="${T}" y2="${H - B}" hidden/><circle class="chdot" r="4.5" hidden/>
    <rect class="chhit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" tabindex="0" aria-label="Move across to read each day"/>
  </svg><div class="chtip" hidden></div></div>
  <details class="chtable"><summary>Show as a table</summary><div class="tw"><table class="uvtable"><thead><tr><th>Day</th><th>${chEsc(opts.unit || "Count")}</th></tr></thead><tbody>${series.slice().reverse().map((p) => `<tr><td>${fmtD(p.d)}</td><td class="num">${chNum(p.v)}</td></tr>`).join("")}</tbody></table></div></details></figure>`;
}
function wireCharts(root) {
  (root || document).querySelectorAll(".chfig[data-chart]").forEach((fig) => {
    const svg = fig.querySelector("svg"), hit = fig.querySelector(".chhit"), tip = fig.querySelector(".chtip");
    const cross = fig.querySelector(".chcross"), dot = fig.querySelector(".chdot");
    const data = JSON.parse(fig.dataset.pts || "[]");
    let cur = -1;
    const show = (i) => {
      cur = Math.max(0, Math.min(data.length - 1, i));
      const [d, v, px, py] = data[cur];
      cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.hidden = false;
      dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.hidden = false;
      tip.textContent = "";
      const b = document.createElement("b"); b.textContent = chNum(v);
      const s = document.createElement("span"); s.textContent = prepFmt(d, { weekday: "short", month: "short", day: "numeric" });
      tip.append(b, s); tip.hidden = false;
      const r = svg.getBoundingClientRect(), k = r.width / 760;
      tip.style.left = Math.min(r.width - 120, Math.max(0, px * k - 50)) + "px";
      tip.style.top = Math.max(0, py * k - 54) + "px";
    };
    const hide = () => { cross.hidden = dot.hidden = tip.hidden = true; };
    const near = (e) => {
      const r = svg.getBoundingClientRect(), vx = ((e.clientX - r.left) / r.width) * 760;
      let best = 0;
      data.forEach((p, i) => { if (Math.abs(p[2] - vx) < Math.abs(data[best][2] - vx)) best = i; });
      return best;
    };
    hit.addEventListener("pointermove", (e) => show(near(e)));
    hit.addEventListener("pointerleave", hide);
    hit.addEventListener("focus", () => show(cur < 0 ? data.length - 1 : cur));
    hit.addEventListener("blur", hide);
    hit.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") (show(cur - 1), e.preventDefault());
      if (e.key === "ArrowRight") (show(cur + 1), e.preventDefault());
    });
  });
}

/* Ranked horizontal bars: [{k, n, label?, href?, sub?}]. Values are printed, so nothing is hover-only. */
function barList(items, opts = {}) {
  if (!items || !items.length) return `<p class="note">${opts.empty || "No data yet."}</p>`;
  const list = items.slice(0, opts.limit || 12), max = Math.max(1, ...list.map((x) => +x.n || 0));
  const total = opts.pctOf || 0;
  return `<ol class="chbars">${list
    .map((x) => {
      const lab = chEsc(x.label || x.k || "—"), w = Math.max(1.5, (100 * (+x.n || 0)) / max);
      return `<li title="${lab}: ${chNum(x.n)}"><span class="chbl">${x.href ? `<a href="${x.href}">${lab}</a>` : lab}${x.sub ? `<small>${chEsc(x.sub)}</small>` : ""}</span><span class="chbt"><i style="width:${w}%"></i></span><span class="chbv">${chNum(x.n)}${total ? `<small>${Math.round((100 * x.n) / total)}%</small>` : ""}</span></li>`;
    })
    .join("")}</ol>`;
}

/* Small vertical bars for a fixed set of buckets (hours of day, weekdays). */
function columnChart(items, label) {
  const max = Math.max(1, ...items.map((x) => x.n));
  return `<figure class="chfig"><figcaption>${chEsc(label)}</figcaption><div class="chcols" role="img" aria-label="${chEsc(label)}">${items
    .map((x) => `<span class="chcol" title="${chEsc(x.k)}: ${chNum(x.n)}" tabindex="0"><i style="height:${Math.max(2, (100 * x.n) / max)}%"></i><em>${chNum(x.n)}</em><b>${chEsc(x.short ?? x.k)}</b></span>`)
    .join("")}</div></figure>`;
}

/* Funnel: each step's share of the first. */
function funnel(steps) {
  const first = Math.max(1, steps[0].n);
  return `<ol class="chfunnel">${steps.map((s, i) => `<li><span class="chbl">${chEsc(s.k)}</span><span class="chbt"><i style="width:${Math.max(1.5, (100 * s.n) / first)}%"></i></span><span class="chbv">${chNum(s.n)}<small>${i ? Math.round((100 * s.n) / first) + "%" : ""}</small></span></li>`).join("")}</ol>`;
}

/* A KPI tile with the change against the previous period. */
function kpi(label, value, prev, opts = {}) {
  let delta = "";
  if (prev != null && value != null && !isNaN(prev)) {
    if (+prev === 0) delta = +value > 0 ? `<small class="chup">new</small>` : "";
    else {
      const pc = Math.round((100 * (value - prev)) / prev);
      delta = `<small class="${pc >= 0 ? "chup" : "chdown"}">${pc >= 0 ? "▲" : "▼"} ${Math.abs(pc)}% vs previous</small>`;
    }
  }
  return `<div class="stat"><b>${value == null ? "—" : chNum(value) + (opts.suffix || "")}</b><span>${chEsc(label)}</span>${delta}${opts.note ? `<small>${chEsc(opts.note)}</small>` : ""}</div>`;
}
