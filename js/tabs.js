/* Tabs on every tabbed page (schools, profile, admin): the selected box slides between tabs when you tap one,
   and on touch screens you can swipe the page left or right to move between tabs. Ported from Project Infrared. */
/* Tab bar indicator: the red underline slides between tabs and the titles fade between grey and red,
   both when tapping a tab and while swiping. */
let TABANIM = null;
const tabBar = (path) => {
  let bar = path.querySelector(".tabind");
  if (!bar) {
    bar = document.createElement("i");
    bar.className = "tabind";
    bar.setAttribute("aria-hidden", "true");
    path.appendChild(bar);
  }
  return bar;
};
const rgbOf = (el, prop) => (getComputedStyle(el)[prop].match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
const mixRgb = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
// Paint the tab bar part-way (t from 0 to 1) between tab a and tab b
// The box carries a white copy of every tab label, so text turns white exactly where the box covers it
function paintTabs(path, a, b, t) {
  const btns = path.querySelectorAll("button"),
    A = btns[a],
    B = btns[b] || A,
    bar = tabBar(path);
  if (!bar.firstChild) {
    const lay = document.createElement("span");
    lay.className = "tabind-in";
    btns.forEach((x) => {
      const l = document.createElement("span");
      l.textContent = x.textContent;
      l.style.cssText = `left:${x.offsetLeft}px;top:${x.offsetTop}px;width:${x.offsetWidth}px;height:${x.offsetHeight}px`;
      lay.appendChild(l);
    });
    bar.appendChild(lay);
  }
  if (!path.classList.contains("tabmoving")) {
    path.classList.add("tabsettle", "tabmoving");
    void path.offsetWidth;
    path.classList.remove("tabsettle");
  }
  const left = A.offsetLeft + (B.offsetLeft - A.offsetLeft) * t;
  bar.style.left = left + "px";
  bar.style.width = A.offsetWidth + (B.offsetWidth - A.offsetWidth) * t + "px";
  bar.firstChild.style.transform = `translateX(${-left}px)`;
}
function clearTabPaint(path) {
  if (!path) return;
  // Hand back to the real selected tab in one frame, with no colour fade in between
  path.classList.add("tabsettle");
  path.classList.remove("tabmoving", "tabease");
  void path.offsetWidth;
  path.classList.remove("tabsettle");
  const bar = path.querySelector(".tabind");
  if (bar) bar.remove();
}
function tabCols(path) {
  const on = path.querySelector('button[aria-selected="true"]'),
    off = path.querySelector('button:not([aria-selected="true"])');
  return { on: rgbOf(on, "color"), off: off ? rgbOf(off, "color") : rgbOf(on, "color") };
}
// Remember where the underline was before a tap re-renders the tabs
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest && e.target.closest("#main .path button");
    if (!b || b.getAttribute("aria-selected") === "true") return;
    const path = b.parentElement,
      btns = [...path.querySelectorAll("button")];
    if (!TABANIM) TABANIM = { from: btns.findIndex((x) => x.getAttribute("aria-selected") === "true"), scroll: path.scrollLeft, cols: tabCols(path) };
  },
  true,
);
// After the re-render, slide the underline from the old tab to the new one
function runTabAnim() {
  const A = TABANIM;
  TABANIM = null;
  const path = document.querySelector("#main .path");
  if (!A || !path || A.from < 0) return;
  const btns = [...path.querySelectorAll("button")],
    to = btns.findIndex((x) => x.getAttribute("aria-selected") === "true");
  if (to < 0 || to === A.from) return;
  path.scrollLeft = A.scroll;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  paintTabs(path, A.from, to, A.t || 0, A.cols);
  void path.offsetWidth;
  path.classList.add("tabease");
  requestAnimationFrame(() => {
    paintTabs(path, A.from, to, 1, A.cols);
    const nb = btns[to];
    path.scrollTo({ left: Math.max(0, nb.offsetLeft - (path.clientWidth - nb.offsetWidth) / 2), behavior: "smooth" });
    setTimeout(() => clearTabPaint(path), 280);
  });
}

/* Swipe left or right on a specialty or subspecialty page to move between its tabs (touch screens only).
   The panel follows the finger, the neighbouring tab slides in beside it, and the tab bar follows along. */
(function () {
  let g = null;
  const GAP = 24;
  const scrollsX = (el) => {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.matches && el.matches("input, textarea, select, .path, .tipbox")) return true;
      const o = getComputedStyle(el).overflowX;
      if ((o === "auto" || o === "scroll") && el.scrollWidth > el.clientWidth + 2) return true;
    }
    return false;
  };
  // Make the incoming tab look exactly like it will once it opens: the same headings, acronym underlines,
  // Unknown tags, charts and calculators, plus the page footer and links that sit below every tab.
  const tidy = (el) => {
    let sib = g.panel.nextElementSibling;
    for (; sib; sib = sib.nextElementSibling) el.appendChild(sib.cloneNode(true));
  };
  const makePeek = (dir) => {
    const k = g.cur + dir;
    if (!g.btns[k]) return null;
    if (!TABPEEK) return { el: null, k, dir };
    const el = document.createElement("div");
    el.className = "panel tabpeek";
    el.setAttribute("aria-hidden", "true");
    try { el.innerHTML = TABPEEK(k); } catch (e) { return null; }
    // Line the incoming tab up with where it will sit once it opens
    const r = g.panel.getBoundingClientRect(),
      pw = document.querySelector("#main .pathwrap"),
      stuck = tabsStuck(),
      top = stuck ? (parseFloat(getComputedStyle(pw).top) || 0) - 26 + g.d : r.top;
    el.style.cssText = `position:fixed;left:${r.left}px;top:${top}px;width:${r.width}px;height:${Math.max(0, innerHeight - top)}px;overflow:hidden;pointer-events:none;z-index:5;background:var(--bg);animation:none`;
    document.body.appendChild(el);
    tidy(el);
    return { el, k, dir };
  };
  const place = (dx) => {
    g.panel.style.transform = `translateX(${dx}px)`;
    g.trail.forEach((x) => (x.style.transform = `translateX(${dx}px)`)); // footer and links below the tab move with it
    if (g.peek && g.peek.el) g.peek.el.style.transform = `translateX(${dx + (g.peek.dir > 0 ? 1 : -1) * (g.w + GAP)}px)`;
    const k = g.peek ? g.peek.k : g.cur;
    paintTabs(g.path, g.cur, k, g.peek ? Math.min(1, Math.abs(dx) / (g.w + GAP)) : 0, g.cols);
  };
  const reset = () => {
    if (!g) return;
    if (g.peek && g.peek.el) g.peek.el.remove();
    g.panel.style.transition = g.panel.style.transform = g.panel.style.willChange = "";
    g.trail.forEach((x) => (x.style.transition = x.style.transform = ""));
    clearTabPaint(g.path);
    g = null;
  };
  document.addEventListener("touchstart", (e) => {
    if (g && g.anim) return;
    if (g) reset();
    if (e.touches.length !== 1) return;
    const t = e.touches[0],
      panel = e.target.closest && e.target.closest("#main .panel"),
      path = document.querySelector("#main .path"),
      anchor = document.querySelector("#main .pathanchor");
    if (!panel || !path || !anchor) return;
    if (t.clientX < 20 || t.clientX > innerWidth - 20) return; // leave the browser's edge swipes alone
    if (scrollsX(e.target)) return;
    // Charts you scrub with a finger (income distribution, degree bar, sliders) keep the gesture to themselves
    if (e.target.closest(".mstr, .mdebt, .chfig, .uvmap, .mbars, input[type=range], [data-noswipe]")) return;
    const btns = [...path.querySelectorAll("button")],
      trail = [];
    for (let x = panel.nextElementSibling; x; x = x.nextElementSibling) trail.push(x);
    g = { panel, path, btns, trail, cur: btns.findIndex((b) => b.getAttribute("aria-selected") === "true"), sx: t.clientX, sy: t.clientY, lx: t.clientX, lt: Date.now(), v: 0, mode: 0, dx: 0, w: panel.getBoundingClientRect().width, d: panel.getBoundingClientRect().top - anchor.getBoundingClientRect().top, peek: null };
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!g || g.anim) return;
    const t = e.touches[0], dx = t.clientX - g.sx, dy = t.clientY - g.sy;
    if (!g.mode) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.2 && !(window.getSelection && String(window.getSelection()).length)) {
        g.mode = 1;
        g.cols = tabCols(g.path);
        g.panel.style.willChange = "transform";
      } else { g = null; return; }
    }
    e.preventDefault();
    const dir = dx < 0 ? 1 : -1;
    if (!g.peek || g.peek.dir !== dir) {
      if (g.peek && g.peek.el) g.peek.el.remove();
      g.peek = makePeek(dir);
    }
    const now = Date.now();
    g.v = (t.clientX - g.lx) / Math.max(1, now - g.lt);
    g.lx = t.clientX; g.lt = now;
    g.dx = g.peek ? dx : dx * 0.25; // rubber-band at the first and last tab
    place(g.dx);
  }, { passive: false });
  const end = () => {
    if (!g || g.anim) return;
    if (!g.mode) { g = null; return; }
    const go = g.peek && (Math.abs(g.dx) > g.w * 0.3 || (Math.abs(g.v) > 0.45 && Math.sign(g.v) === Math.sign(g.dx)));
    const ease = "transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)";
    g.anim = true;
    g.panel.style.transition = ease;
    g.trail.forEach((x) => (x.style.transition = ease));
    if (g.peek && g.peek.el) g.peek.el.style.transition = ease;
    g.path.classList.add("tabease");
    requestAnimationFrame(() => place(go ? -g.peek.dir * (g.w + GAP) : 0));
    setTimeout(() => {
      if (!go) return reset();
      const k = g.peek.k, pk = g.peek.el, path = g.path, sl = path.scrollLeft;
      g.peek = null;
      g.panel.style.transition = "";
      g = null;
      // Swap in the real tab without the usual fade, keeping the tab bar where it is
      TABANIM = { from: -1 }; // the swipe already moved the underline
      path.querySelectorAll("button")[k].click();
      const npanel = document.querySelector("#main .panel");
      if (npanel) npanel.style.animation = "none"; // it is already on screen, so no fade-in
      TABANIM = null;
      const np = document.querySelector("#main .path");
      if (np) {
        np.scrollLeft = sl;
        const nb = np.querySelector('button[aria-selected="true"]');
        if (nb) np.scrollTo({ left: Math.max(0, nb.offsetLeft - (np.clientWidth - nb.offsetWidth) / 2), behavior: "smooth" });
      }
      if (pk) pk.remove();
    }, 250);
  };
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });

})();
