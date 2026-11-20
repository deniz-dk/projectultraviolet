/* ============================================================
   PROJECT ULTRAVIOLET: core. Navigation, routing and the public pages.
   School data (MED_SCHOOLS, MED_PROV, deadlines) lives in medprep.js;
   the full school pages (#school-<id>) live in medschools.js.
   ============================================================ */
const $ = (s) => document.querySelector(s);
let tab = 0;
let WANT_TAB = "";
let TABPEEK = null;
const TIPS = {};
const UV_SCHOOLS = () => MED_SCHOOLS.filter((s) => s.id !== "mcgillp");

/* ---------- small helpers (same names as Project Infrared, so shared modules work) ---------- */
const slugOf = (t) => t.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
function hashParts() {
  let h = location.hash.slice(1);
  try { h = decodeURIComponent(h); } catch (e) {}
  const k = h.indexOf("/");
  return k < 0 ? [h || "home", ""] : [h.slice(0, k) || "home", h.slice(k + 1)];
}
function setTabHash(base, slug) {
  try { history.replaceState(null, "", "#" + base + (slug ? "/" + slug : "")); } catch (e) {}
}
const rateBar = (label, n) => {
  const v = Math.max(0, Math.min(5, Math.round(+n || 0)));
  return `<span class="rl">${label}</span><span class="rbar" role="img" aria-label="${v} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span><span class="rn">${v} of 5</span>`;
};
const bl = (a) => (a && a.length ? `<ul class="b">${a.map((x) => `<li>${x}</li>`).join("")}</ul>` : "<p class='note'>Not applicable.</p>");
const fmt = (n) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("en-CA"));
const prepIco = {
  cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  up: '<path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  down: '<path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" stroke="currentColor" stroke-width="1.8"/>',
  chat: '<path d="M5 5h14v10H9l-4 4V5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  users: '<circle cx="9" cy="9" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15 6.5a3 3 0 0 1 0 5.6M17 14.8c1.8.5 3 1.9 3.4 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
};
const pIco = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${prepIco[k] || ""}</svg>`;
const prepDay = (s) => new Date(s + "T12:00:00");
const prepFmt = (s, o) => prepDay(s).toLocaleDateString("en-CA", o || { month: "short", day: "numeric" });
let LOGO_N = 0; // each logo needs its own gradient id: a hidden logo earlier in the page would otherwise blank the rest
const LOGO = (sz, n = ++LOGO_N) =>
  `<svg class="logo" width="${sz}" height="${sz}" viewBox="0 0 64 64" role="img" aria-label="Project UltraViolet"><defs><linearGradient id="uvlg${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".55" stop-color="#6366f1"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs><circle cx="32" cy="32" r="28" fill="none" stroke="url(#uvlg${n})" stroke-width="5"/><text x="32" y="43" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" style="font-stretch:112%" font-size="29" fill="url(#uvlg${n})">uV</text></svg>`;
const provName = (k) => (MED_PROV.find((p) => p[0] === k) || [, k])[1];
const testLabel = (s) => (s.m === "y" ? "MCAT" : s.m === "cars" ? "MCAT (CARS only)" : s.m === "n" ? "No MCAT" : "Check");

/* ---------- sidebar: every school, grouped by region ---------- */
function buildNav() {
  const nav = $("#nav");
  const q = ($("#q").value || "").trim().toLowerCase();
  const item = (id, label, sub) => `<button class="navitem" data-id="${id}"><span>${label}${sub ? `<span class="navsub">${sub}</span>` : ""}</span></button>`;
  let h = q ? "" : item("home", "Home") + item("schools", "All schools") + item("guides", "Guides") + item("news", "News") + item("money", "Money") + item("coaching", "Coaching");
  MED_PROV.forEach(([k, name]) => {
    const list = MED_SCHOOLS.filter((s) => s.prov === k && (!q || (s.name + " " + s.short + " " + s.city).toLowerCase().includes(q)));
    if (!list.length) return;
    h += `<div class="navgroup">${name}</div>` + list.map((s) => item("school-" + s.id, acctEsc(s.id === "mcgillp" ? "McGill Med-P" : s.short), acctEsc(s.city.split(" · ")[0]))).join("");
  });
  nav.innerHTML = h || `<p class="note" style="padding:8px 12px">No school matches “${acctEsc(q)}”.</p>`;
  nav.querySelectorAll(".navitem").forEach((b) => (b.onclick = () => go(b.dataset.id)));
  const sel = $("#msel");
  sel.innerHTML =
    `<option value="home">Home</option><option value="schools">All schools</option><option value="guides">Guides</option><option value="news">News</option><option value="money">Money</option><option value="coaching">Coaching</option>` +
    MED_PROV.map(([k, name]) => `<optgroup label="${name}">${MED_SCHOOLS.filter((s) => s.prov === k).map((s) => `<option value="school-${s.id}">${acctEsc(s.id === "mcgillp" ? "McGill Med-P" : s.short)}</option>`).join("")}</optgroup>`).join("");
  sel.onchange = (e) => go(e.target.value);
  mark();
}
function mark() {
  const id = hashParts()[0];
  document.querySelectorAll(".navitem").forEach((b) => b.setAttribute("aria-current", b.dataset.id === id ? "true" : "false"));
  const sel = $("#msel");
  if (!sel) return;
  const old = sel.querySelector('option[value="__cur"]');
  if (old) old.remove();
  if ([...sel.options].some((o) => o.value === id)) return (sel.value = id);
  const h1 = document.querySelector("#main h1");
  const label = id === "home" ? "" : { account: "My profile", admin: "Admin" }[id] || (h1 ? h1.textContent.trim() : "");
  if (!label) return (sel.value = "home");
  sel.insertAdjacentHTML("afterbegin", `<option value="__cur" disabled>${acctEsc(label.length > 34 ? label.slice(0, 33) + "…" : label)}</option>`);
  sel.value = "__cur";
}
function go(id) {
  tab = 0;
  location.hash = id;
}

/* ---------- router ---------- */
const PAGES = {};
function render() {
  TABPEEK = null;
  const [id, slug] = hashParts();
  WANT_TAB = slug;
  tab = 0;
  document.body.classList.toggle("is-home", id === "home");
  (PAGES[id] || PAGES.home)(slug);
  afterRender();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => {
  render();
  mark();
  document.documentElement.classList.remove("drawer");
});

function afterRender() {
  document.querySelectorAll("#main .rcard").forEach((el) => {
    const t = TIPS[(el.querySelector(".rl") || {}).textContent];
    if (t) el.title = t;
  });
  document.querySelectorAll("#main .path").forEach((p) => {
    const f = () => p.classList.toggle("more", p.scrollLeft + p.clientWidth < p.scrollWidth - 4);
    f();
    p.onscroll = f;
  });
  setNavH();
  markStuck();
  addSiteFoot();
  mark();
  if (typeof track === "function") track("view");
}
function navH() {
  const m = document.querySelector(".mobile-nav");
  return m && getComputedStyle(m).display !== "none" ? m.getBoundingClientRect().height : 0;
}
function setNavH() {
  const h = navH();
  document.documentElement.style.setProperty("--navh", (h ? h - 1 : 0) + "px");
}
function tabsStuck() {
  const a = document.querySelector("#main .pathanchor"), p = document.querySelector("#main .pathwrap");
  if (!a || !p) return false;
  return a.getBoundingClientRect().top + 26 <= (parseFloat(getComputedStyle(p).top) || 0) + 0.5;
}
function toTabs() {
  const a = document.querySelector("#main .pathanchor"), p = document.querySelector("#main .pathwrap");
  if (!a || !p) return;
  window.scrollTo(0, a.getBoundingClientRect().top + window.scrollY + 26 - (parseFloat(getComputedStyle(p).top) || 0));
  markStuck();
}
function markStuck() {
  const p = document.querySelector("#main .pathwrap");
  if (p) p.classList.toggle("stuck", tabsStuck());
}
window.addEventListener("scroll", markStuck, { passive: true });
window.addEventListener("resize", setNavH);
function addSiteFoot() {
  const m = $("#main");
  if (!m || m.querySelector(".sitefoot")) return;
  m.insertAdjacentHTML(
    "beforeend",
    `<footer class="sitefoot"><span>© ${new Date().getFullYear()} Project UltraViolet</span><a href="#about">About</a><a href="#privacy">Privacy policy</a><a href="#terms">Terms of use</a><a href="#become-coach">Become a coach</a><a href="https://projectinfrared.org" target="_blank" rel="noopener">Sister site: Project Infrared ↗</a><span>General information only. Not affiliated with any medical school. Always confirm requirements on the school’s own website.</span></footer>`,
  );
}

/* ---------- next deadlines across every school ---------- */
function uvUpcoming(n) {
  const cyc = medDefaultCycle(), seen = {}, out = [];
  UV_SCHOOLS().forEach((s) => {
    const e = medMain(s, cyc);
    if (!e || medPast(e)) return;
    const key = s.sys === "OMSAS" ? "omsas" : s.id;
    if (seen[key]) return;
    seen[key] = 1;
    out.push({ d: e.d, est: e.est, who: s.sys === "OMSAS" ? "OMSAS (all 7 Ontario schools)" : s.name, id: s.sys === "OMSAS" ? "" : s.id });
  });
  return out.sort((a, b) => a.d.localeCompare(b.d)).slice(0, n);
}

/* ---------- Home ---------- */
PAGES.home = () => {
  const all = UV_SCHOOLS();
  const seats = all.reduce((a, s) => a + (+s.seats || 0), 0);
  const up = uvUpcoming(4);
  $("#main").innerHTML = `<section class="uvhero" aria-label="Project UltraViolet">
    <div class="herotitle">${LOGO(44)}<h1>Project UltraViolet<span class="ver">beta</span></h1></div>
    <p class="uvtag">Your way into Canadian medicine.</p>
    <p class="lede">Requirements, deadlines, interviews and real costs for every Canadian medical school, in one place and free. When you want a hand, book a coach who got in.</p>
    <form class="uvfind" role="search"><input id="uvfind" type="search" placeholder="Find a school: Toronto, McGill, UBC…" aria-label="Find a school" list="uvlist"><datalist id="uvlist">${all.map((s) => `<option value="${acctEsc(s.name)}">`).join("")}</datalist><button class="btn" type="submit">Go</button></form>
    <div class="statrow topstats"><div class="stat"><b>${all.length}</b><span>Canadian MD programs</span></div><div class="stat"><b>${seats.toLocaleString("en-CA")}</b><span>First-year seats <span class="tag s">Sourced</span></span></div><div class="stat"><b>${MED_PROV.length}</b><span>Ways to apply, by region</span></div><div class="stat"><b>Free</b><span>Every school page and guide</span></div></div>
  </section>
  ${typeof uvMapHtml === "function" ? uvMapHtml() : ""}
  <h2>Coming up</h2>
  <div class="grid-cards uvdue">${up.length ? up.map((e) => `<a class="gc" href="${e.id ? "#school-" + e.id : "#guides/applying"}"><b>${prepFmt(e.d, { month: "long", day: "numeric", year: "numeric" })}${e.est ? " (expected)" : ""}</b><span>${acctEsc(e.who)} application deadline</span></a>`).join("") : `<p class="note">No deadlines left this cycle. New dates appear as schools post them.</p>`}</div>
  ${typeof UV_NEWS !== "undefined" ? `<h2>Latest news</h2><div class="uvnhome">${uvNewsGrid(UV_NEWS.slice().sort((a, b) => b.d.localeCompare(a.d)).slice(0, 3), true)}</div><p><a href="#news">All school news this year →</a></p>` : ""}
  <h2>Start here</h2>
  <div class="grid-cards toolcards">
    <a class="gc" href="#schools"><b>Compare every school</b><span>Seats, tests, deadlines and how to apply, side by side.</span></a>
    <a class="gc" href="#guides/applying"><b>How applying works</b><span>OMSAS, Quebec, the Prairies, BC and Atlantic Canada, explained.</span></a>
    <a class="gc" href="#account/med-school" data-needacct><b>Track your applications</b><span>Pick your schools and get one deadline list, a checklist and a tracker.</span></a>
    <a class="gc" href="#money"><b>Plan how to pay for it</b><span>Tuition at every school, a borrowing planner, OSAP and lines of credit.</span></a>
    <a class="gc" href="#coaching"><b>Work with a coach</b><span>1-on-1 help from students who got into the school you want.</span></a>
  </div>
  <p class="note">School figures come from each school’s admissions pages and the AFMC’s admission requirements guide. Always check the school’s own site before you apply.</p>`;
  const f = $(".uvfind");
  f.onsubmit = (e) => {
    e.preventDefault();
    const v = $("#uvfind").value.trim().toLowerCase();
    if (v) track("search", v);
    const s = all.find((x) => x.name.toLowerCase() === v) || all.find((x) => (x.name + " " + x.short + " " + x.city).toLowerCase().includes(v));
    go(s ? "school-" + s.id : "schools");
  };
  if (typeof wireUvMap === "function") wireUvMap();
  wireNeedAcct();
};
function wireNeedAcct() {
  document.querySelectorAll("#main [data-needacct]").forEach(
    (a) =>
      (a.onclick = (e) => {
        if (Acct.user) return;
        e.preventDefault();
        openAcct("signup", "Create a free account to track your schools and deadlines.");
      }),
  );
}

/* ---------- News: every school's stories this year ---------- */
let NEWS_PROV = "all";
PAGES.news = () => {
  const reg = { on: "Ontario", qc: "Quebec", atl: "Atlantic", pr: "Prairies", bc: "BC" };
  const inReg = (n) => NEWS_PROV === "all" || n.w.includes(NEWS_PROV) || n.w.some((x) => (medSchool(x) || {}).prov === NEWS_PROV);
  const list = UV_NEWS.filter(inReg).sort((a, b) => b.d.localeCompare(a.d));
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / News</p><h1>School news, ${new Date().getFullYear()}</h1>
  <p class="lede">New seats, new schools, changed requirements and interview formats, and when results went out. Each school’s page has its own News tab, with what applicants report on forums.</p>
  <div class="chips uvchips" role="group" aria-label="Region">${[["all", "All"]].concat(MED_PROV.map((p) => [p[0], p[1]])).map(([k, n]) => `<button class="chip" data-p="${k}" aria-pressed="${NEWS_PROV === k}">${n}</button>`).join("")}</div>
  ${list.length ? uvNewsGrid(list, true, true) : `<p class="note">No news for this region yet.</p>`}
  <p class="note">Gathered from school, government and news sources, and from applicant forums where marked. Last checked November 2026.</p>`;
  document.querySelectorAll(".uvchips .chip").forEach((c) => (c.onclick = () => ((NEWS_PROV = c.dataset.p), PAGES.news(), afterRender())));
};

/* ---------- All schools: one comparison table ---------- */
let SCH_PROV = "all";
PAGES.schools = () => {
  const cyc = medDefaultCycle();
  const rows = UV_SCHOOLS()
    .filter((s) => SCH_PROV === "all" || s.prov === SCH_PROV)
    .map((s) => {
      const e = medMain(s, cyc);
      return `<tr><td><a href="#school-${s.id}"><b>${acctEsc(s.short)}</b></a><br><small>${acctEsc(s.city)}</small></td><td>${provName(s.prov)}</td><td>${acctEsc(s.sys)}</td><td class="num">${s.seats}</td><td>${testLabel(s)}</td><td>${s.c ? "Yes" : "No"}</td><td>${e ? prepFmt(e.d, { month: "short", day: "numeric", year: "numeric" }) + (e.est ? "*" : "") : "—"}</td></tr>`;
    })
    .join("");
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / All schools</p><h1>Every Canadian medical school</h1>
  <p class="lede">All ${UV_SCHOOLS().length} MD programs side by side. Open a school for admissions, program, cost and city details.</p>
  <div class="chips uvchips" role="group" aria-label="Region">${[["all", "All"]].concat(MED_PROV.map((p) => [p[0], p[1]])).map(([k, n]) => `<button class="chip" data-p="${k}" aria-pressed="${SCH_PROV === k}">${n}</button>`).join("")}</div>
  <div class="tw"><table class="uvtable"><thead><tr><th>School</th><th>Region</th><th>Apply through</th><th>Seats</th><th>Tests</th><th>Casper</th><th>Deadline (${MED_CYCLES[cyc].split(" · ")[0]})</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="note">Seats are first-year places. * Expected date, based on last cycle, until the school posts this cycle’s. <a href="${MED_SRC}" target="_blank" rel="noopener">AFMC admission requirements ↗</a></p>`;
  document.querySelectorAll(".uvchips .chip").forEach((c) => (c.onclick = () => ((SCH_PROV = c.dataset.p), PAGES.schools(), afterRender())));
};

/* ---------- Guides (built from the school data, so they stay in step with the school pages) ---------- */
const GUIDES = [
  ["applying", "How applying works", "One application in Ontario, separate forms everywhere else. What each region expects."],
  ["timeline", "Your application year, month by month", "Every opening date, test sitting, deadline, interview window and offer day in one calendar."],
  ["requirements", "Grades and tests, school by school", "GPA rules, the MCAT and Casper for every program."],
  ["interviews", "Interviews: MMI, panel and more", "What each format is, and which school uses which."],
  ["sketch", "Activities, sketch and essays", "How to describe what you’ve done, pick verifiers and answer essay questions."],
  ["pathways", "Pathways and special streams", "Indigenous, Black, rural, francophone and other admission streams."],
];
const GUIDE_PAGES = {};
const guideHead = (k) => {
  const g = GUIDES.find((x) => x[0] === k);
  return `<p class="crumb"><a href="#home">Home</a> / <a href="#guides">Guides</a> / ${g[1]}</p><h1>${g[1]}</h1>`;
};
const guideNext = (k) => {
  const i = GUIDES.findIndex((x) => x[0] === k), n = GUIDES[(i + 1) % GUIDES.length];
  return `<a class="gc uvnext" href="#guides/${n[0]}"><span>Next guide</span><b>${n[1]} →</b></a>`;
};
const srcLine = () => `<p class="srcs">Source: <a class="src" href="${MED_SRC}" target="_blank" rel="noopener">AFMC Admission Requirements of Canadian Faculties of Medicine 2027 ↗</a> and each school’s admissions pages. Always confirm with the school.</p>`;
PAGES.guides = (slug) => {
  if (GUIDE_PAGES[slug]) return GUIDE_PAGES[slug]();
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Guides</p><h1>Guides</h1><p class="lede">Plain-language guides to each part of applying to medical school in Canada.</p>
  <div class="grid-cards uvguides">${GUIDES.map(([k, t, d]) => `<a class="gc" href="#guides/${k}"><b>${t}</b><span>${d}</span></a>`).join("")}</div>`;
};
GUIDE_PAGES.applying = () => {
  $("#main").innerHTML = `${guideHead("applying")}
  <p class="lede">Canada has no single national application. Ontario’s seven schools share one system; every other school runs its own.</p>
  ${MED_PROV.map(([k, name, sys, txt]) => `<section class="box uvregion"><h2>${name}</h2><p class="specmeta"><span>${acctEsc(sys)}</span></p><p>${txt}</p><p class="note">Schools: ${MED_SCHOOLS.filter((s) => s.prov === k && s.id !== "mcgillp").map((s) => `<a href="#school-${s.id}">${acctEsc(s.short)}</a>`).join(" · ")}</p></section>`).join("")}
  ${srcLine()}${guideNext("applying")}`;
};
GUIDE_PAGES.timeline = () => {
  const cyc = medDefaultCycle(), list = [];
  medOmsas(cyc).forEach((e) => list.push(Object.assign({}, e, { who: "All 7 Ontario schools (OMSAS)" })));
  UV_SCHOOLS().forEach((s) => medEvents(s, cyc).forEach((e) => list.push(Object.assign({}, e, { who: s.short, sid: s.id }))));
  list.sort((a, b) => a.d.localeCompare(b.d));
  const months = {};
  list.forEach((e) => {
    const k = e.d.slice(0, 7);
    (months[k] = months[k] || []).push(e);
  });
  const mName = (k) => prepFmt(k + "-15", { month: "long", year: "numeric" });
  const est = cyc !== MED_BASE;
  $("#main").innerHTML = `${guideHead("timeline")}
  <p class="lede">Every date for the ${MED_CYCLES[cyc].split(" · ")[0]}, from the first application opening to offer day. Classes start in ${cyc}.</p>
  ${est ? `<p class="note">These are expected dates, based on last cycle. Schools post new dates through the year; each one is updated here when it’s posted.</p>` : ""}
  <div class="uvtl-tools"><a class="btn" href="#account/med-school" data-needacct>Get a deadline list for just your schools</a></div>
  ${Object.entries(months)
    .map(
      ([k, evs]) => `<section class="uvmonth"><h2>${mName(k)}</h2><ul class="uvtl">${evs
        .map(
          (e) => `<li class="k-${e.k}${medPast(e) ? " past" : ""}"><span class="uvtl-d">${e.when ? acctEsc(e.when) : prepFmt(e.d, { month: "short", day: "numeric" }) + (e.end ? "–" + prepFmt(e.end, { month: "short", day: "numeric" }) : "")}</span><span class="uvtl-t"><b>${acctEsc(e.t)}</b><small>${e.sid ? `<a href="#school-${e.sid}">${acctEsc(e.who)}</a>` : acctEsc(e.who)} · ${MED_KIND[e.k] || ""}</small></span></li>`,
        )
        .join("")}</ul></section>`,
    )
    .join("")}
  ${typeof UV_RESULTS !== "undefined" ? `<h2>When results actually went out last cycle</h2><p>Schools give windows; these are the days results really arrived for 2026 entry. Use them to plan, not to predict: dates shift a little every year.</p>
  <div class="tw"><table class="uvtable"><thead><tr><th>Date</th><th>School</th><th>What went out</th><th>How we know</th></tr></thead><tbody>${UV_RESULTS.slice().sort((a, b) => a[2].localeCompare(b[2])).map(([id, what, d, how, u]) => `<tr><td>${prepFmt(d, { month: "short", day: "numeric" })}</td><td><a href="#school-${id}/news">${acctEsc((medSchool(id) || {}).short || id)}</a></td><td>${acctEsc(what)}</td><td><a href="${u}" target="_blank" rel="noopener">${how === "Official" ? "School’s own post" : "Applicants on Premed 101"} ↗</a></td></tr>`).join("")}</tbody></table></div>` : ""}
  <section class="box"><h2>Casper test dates</h2><p>Casper is required by ${UV_SCHOOLS().filter((s) => s.c).length} schools: ${UV_SCHOOLS().filter((s) => s.c).map((s) => acctEsc(s.short)).join(", ")}. ${cyc === MED_BASE ? "Sittings this cycle:" : "Last cycle’s sittings, to plan around until the new dates are posted:"}</p><p>${MED_CASPER.map((d) => prepFmt(d, { month: "short", day: "numeric", year: "numeric" })).join(" · ")}</p><p class="note">Book early; popular sittings fill up. Pick a sitting that leaves time for scores to reach your schools before their deadlines.</p></section>
  ${srcLine()}${guideNext("timeline")}`;
  wireNeedAcct();
};
GUIDE_PAGES.requirements = () => {
  const all = UV_SCHOOLS();
  const n = (f) => all.filter(f).length;
  $("#main").innerHTML = `${guideHead("requirements")}
  <p class="lede">Every school looks at your grades and most look at a test score, but each has its own rules.</p>
  <div class="statrow topstats"><div class="stat"><b>${n((s) => s.m === "y")}</b><span>Require the full MCAT</span></div><div class="stat"><b>${n((s) => s.m === "cars")}</b><span>Use only the CARS section</span></div><div class="stat"><b>${n((s) => s.m === "n")}</b><span>Don’t use the MCAT</span></div><div class="stat"><b>${n((s) => s.c)}</b><span>Require Casper</span></div>${n((s) => !["y", "cars", "n"].includes(s.m)) ? `<div class="stat"><b>${n((s) => !["y", "cars", "n"].includes(s.m))}</b><span>Still to confirm MCAT rules (${all.filter((s) => !["y", "cars", "n"].includes(s.m)).map((s) => acctEsc(s.short)).join(", ")})</span></div>` : ""}</div>
  <div class="split plain"><section><h3>Grades</h3><p>Schools convert your marks to their own scale. Ontario schools use the OMSAS 4.0 scale; others use percentages or their own formula, and many count only your best or most recent years. A school’s minimum is rarely enough: look at the average for admitted students on its page.</p></section>
  <section><h3>Tests</h3><p>The MCAT has four sections. Some schools set a minimum in each, some look only at CARS (the reading section), and some don’t use it. Casper is an online situational-judgement test; your scores go straight to your schools from Acuity Insights.</p></section></div>
  ${MED_PROV.map(([k, name]) => `<h2>${name}</h2><div class="uvreq">${all.filter((s) => s.prov === k).map((s) => {
    const d = msdOf(s.id);
    return `<article class="box"><h3><a href="#school-${s.id}/admissions">${acctEsc(s.name)}</a></h3><p class="uvreq-tags"><span class="hubtag">${testLabel(s)}</span><span class="hubtag">${s.c ? "Casper" : "No Casper"}</span></p>${d && d.adm ? `<p><b>Grades:</b> ${d.adm.gpa}</p>` : ""}<p><b>Tests:</b> ${acctEsc(s.tests)}</p></article>`;
  }).join("")}</div>`).join("")}
  ${srcLine()}${guideNext("requirements")}`;
};
GUIDE_PAGES.interviews = () => {
  const all = UV_SCHOOLS();
  const has = (re) => all.filter((s) => re.test(s.int || "")).length;
  $("#main").innerHTML = `${guideHead("interviews")}
  <p class="lede">An interview invitation means your file made the cut. Most schools now interview online, and most use some form of the MMI.</p>
  <div class="statrow topstats"><div class="stat"><b>${has(/MMI/i)}</b><span>Schools using an MMI</span></div><div class="stat"><b>${has(/panel/i)}</b><span>Using a panel</span></div><div class="stat"><b>${has(/virtual|online|asynchronous/i)}</b><span>Interview online</span></div><div class="stat"><b>${has(/in-person/i)}</b><span>Interview in person</span></div></div>
  <div class="split"><div class="box"><h3>MMI (multiple mini interview)</h3><p>A circuit of short stations, each with its own interviewer and scenario: an ethical dilemma, a role-play with an actor, a discussion question or a task. Every station is scored separately, so one weak station won’t sink you.</p></div>
  <div class="box"><h3>Panel or personal interview</h3><p>A longer conversation with one or more interviewers about you, your experiences and why medicine. U of T’s modified personal interview (MPI) is a series of short one-on-one interviews, each focused on a different quality.</p></div></div>
  <h2>How to prepare</h2><ul class="b"><li>Practise out loud, on a timer, with someone who will give honest feedback.</li><li>For ethics stations, name the people affected, the values in tension and a reasonable plan; there’s rarely one right answer.</li><li>Know your own file: be ready to talk about anything in your application.</li><li>For online interviews, test your camera, sound and lighting, and use a quiet room.</li><li>Read the school’s instructions closely: format, timing and what’s allowed change between schools and years.</li></ul>
  ${typeof UV_NEWS !== "undefined" ? `<h2>What changed this year</h2>${uvNewsGrid(UV_NEWS.filter((n) => n.tag === "interview").sort((a, b) => b.d.localeCompare(a.d)), true)}
  <h2>What applicants say</h2><ul class="b">${Object.entries(UV_HEARD).flatMap(([id, l]) => l.filter((x) => /interview|MMI|MPI|MEM|Kira|recorded/i.test(x[1])).map((x) => `<li><a href="#school-${id}/news">${acctEsc((medSchool(id) || {}).short || id)}</a>: ${x[1]}${x[2] ? ` <a href="${x[2]}" target="_blank" rel="noopener">Source ↗</a>` : ""}</li>`)).join("")}</ul><p class="note">From applicant forums, mainly Premed 101. Other applicants’ experiences, not official rules.</p>` : ""}
  <h2>Format at each school</h2><div class="tw"><table class="uvtable"><thead><tr><th>School</th><th>Interview</th></tr></thead><tbody>${all.map((s) => `<tr><td><a href="#school-${s.id}"><b>${acctEsc(s.short)}</b></a></td><td>${acctEsc(s.int || "Check the school’s site.")}</td></tr>`).join("")}</tbody></table></div>
  <p class="note">Want to practise with someone who interviewed there? <a href="#coaching">Mock interviews</a> are coming to the coaching page.</p>
  ${srcLine()}${guideNext("interviews")}`;
};
GUIDE_PAGES.sketch = () => {
  const on = MED_PROV.find((p) => p[0] === "on");
  $("#main").innerHTML = `${guideHead("sketch")}
  <p class="lede">Beyond grades and tests, schools want to know what you’ve done and what you took from it. This is where most of your writing happens.</p>
  <div class="split plain"><section><h3>In Ontario: the Autobiographical Sketch</h3><p>${on ? on[3].split(". ").slice(0, 3).join(". ") + "." : ""}</p></section>
  <section><h3>Everywhere else</h3><p>Each school has its own version: an activity list, short-answer questions, essays or a mix. Read each school’s instructions for what counts, how many entries you can list and how long each one can be.</p></section></div>
  <h2>Describing your activities</h2><ul class="b"><li>Start your list months before applications open. Go back through your years: jobs, volunteering, research, clubs, sports, caregiving, arts and anything you did consistently.</li><li>Lead with what you did and what changed because of it, not just your title.</li><li>Be specific: numbers, how long, how often, who you worked with.</li><li>Paid work and family responsibilities count. Schools want to see how you spent your time, not only the impressive titles.</li><li>Be accurate. Verifiers can be contacted, and anything listed can come up in an interview.</li></ul>
  <h2>Choosing verifiers and referees</h2><ul class="b"><li>Pick people who actually saw your work and can confirm it.</li><li>Ask early, tell them what you listed, and give them time.</li><li>For reference letters, choose people who know you well over people with impressive titles.</li></ul>
  <h2>Essays and short answers</h2><ul class="b"><li>Answer the question that was asked. Many strong applicants lose marks by writing a general essay.</li><li>Use one or two concrete examples rather than a list.</li><li>Show reflection: what you learned, what you would do differently and how it shaped you.</li><li>Write in your own voice, then cut. Have someone who knows you read it.</li></ul>
  <p class="note">Want someone to read your drafts? <a href="#coaching">Application review</a> is coming to the coaching page.</p>
  ${srcLine()}${guideNext("sketch")}`;
};
GUIDE_PAGES.pathways = () => {
  const rows = UV_SCHOOLS()
    .map((s) => {
      const d = msdOf(s.id), ex = (d && d.adm && d.adm.extra) || [];
      const lines = ex.filter((t) => /pathway|stream|program|indigenous|black|rural|francophone|seats for/i.test(t) && !/most common previous universities/i.test(t));
      return lines.length ? `<article class="box"><h3><a href="#school-${s.id}/admissions">${acctEsc(s.name)}</a></h3>${bl(lines)}</article>` : "";
    })
    .filter(Boolean)
    .join("");
  const missing = UV_SCHOOLS().filter((s) => {
    const d = msdOf(s.id), ex = (d && d.adm && d.adm.extra) || [];
    return !ex.some((t) => /pathway|stream|program|indigenous|black|rural|francophone|seats for/i.test(t) && !/most common previous universities/i.test(t));
  });
  $("#main").innerHTML = `${guideHead("pathways")}
  <p class="lede">Many schools run separate admission streams with their own requirements, reviewers or reserved seats. If one fits you, it can change how your file is read.</p>
  <div class="split plain"><section><h3>Who they’re for</h3><p>Common streams include Indigenous applicants, Black applicants, rural and northern applicants, francophone applicants, people from groups underrepresented in medicine, and combined MD/PhD programs.</p></section>
  <section><h3>How they work</h3><p>Each school sets its own rules: some have separate files or interviews, some reserve seats, some ask for documents or community connections. Read the stream’s page on the school’s site and contact its office if anything is unclear.</p></section></div>
  <h2>Streams by school</h2><div class="uvreq">${rows}</div>
  ${missing.length ? `<p class="note">We haven’t listed streams for ${missing.map((s) => `<a href="#school-${s.id}">${acctEsc(s.short)}</a>`).join(", ")} yet. Check their admissions sites, which often describe pathways that aren’t in the AFMC summary.</p>` : ""}
  ${srcLine()}${guideNext("pathways")}`;
};

/* ---------- Coaching ---------- */
const SERVICES = [
  ["strategy", "1-on-1 coaching", "General strategy or school-specific, 30 or 60 minutes."],
  ["interviews", "Mock interviews", "MMI or panel practice for a specific school, with written feedback."],
  ["review", "Application review", "Sketch, essays or letters, returned with comments."],
  ["packages", "Packages", "Bundles of sessions and reviews at a lower price."],
];
PAGES.coaching = () => {
  const on = !!(Acct.user && Acct.prefs.coaching_waitlist);
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Coaching</p><h1>Coaching</h1>
  <p class="lede">Work 1-on-1 with medical students who got into the school you’re aiming for.</p>
  <section class="uvsoonbar"><div><b>Booking opens soon.</b><span>Coaches are being reviewed and onboarded now. Get an email the day booking opens.</span></div><button type="button" class="btn${on ? " ghost" : ""}" data-wait>${on ? "You’re on the list ✓" : "Notify me"}</button></section>
  <h2>What you can book</h2>
  <div class="grid-cards uvservices">${SERVICES.map(([, t, d]) => `<div class="gc"><b>${t}</b><span>${d}</span></div>`).join("")}</div>
  <h2>How it works</h2>
  <ol class="uvsteps"><li><b>Pick a coach</b> who got into your target school, or filter by what you need help with.</li><li><b>Book a time</b> that suits you and pay securely online.</li><li><b>Meet online</b> and get written notes afterwards. Reviews come back by email.</li></ol>
  <h2>Coaches</h2><div id="uvcoaches"><p class="note">Loading…</p></div>`;
  $("[data-wait]").onclick = toggleWaitlist;
  loadCoaches("#uvcoaches");
};
async function toggleWaitlist() {
  if (!Acct.on) return alertOff();
  if (!Acct.user) return openAcct("signup", "Create a free account and we’ll email you the day coaching opens.");
  const v = !Acct.prefs.coaching_waitlist;
  const { error } = await Acct.sb.from("user_prefs").update({ coaching_waitlist: v }).eq("user_id", Acct.user.id);
  if (error) return alert("Couldn’t save: " + error.message);
  Acct.prefs.coaching_waitlist = v;
  if (v) track("waitlist", hashParts().join("/"));
  render();
}
async function loadCoaches(sel, school) {
  const el = $(sel);
  if (!el) return;
  if (!Acct.sb) return (el.innerHTML = `<p class="note">Coach profiles appear here once coaching opens.</p>`);
  let q = Acct.sb.from("coaches").select("user_id,display_name,headline,bio,schools,services").eq("visible", true).order("created_at");
  if (school) q = q.contains("schools", [school]);
  const { data, error } = await q;
  if (!$(sel)) return;
  if (error || !data || !data.length) {
    el.innerHTML = `<p class="note">${school ? "No coaches for this school yet. The first coaches are being onboarded now." : "No coaches listed yet. The first coaches are being onboarded now."}</p>`;
    return;
  }
  el.innerHTML = `<div class="grid-cards">${data.map((c) => `<div class="gc uvcoach"><b>${acctEsc(c.display_name)}</b>${c.headline ? `<span>${acctEsc(c.headline)}</span>` : ""}<span>${(c.schools || []).map((k) => acctEsc((medSchool(k) || { short: k }).short)).join(" · ")}</span><span class="note">${acctEsc((c.bio || "").slice(0, 180))}</span><button class="btn" disabled>Booking opens soon</button></div>`).join("")}</div>`;
}
function uvCoachTab(s) {
  const on = !!(Acct.user && Acct.prefs.coaching_waitlist);
  return `<div class="uvcoachtab"><p class="lede">1-on-1 help from students who got into ${acctEsc(s.short)}: mock ${acctEsc((s.int || "").match(/MMI/) ? "MMIs" : "interviews")}, application review and strategy.</p>
  <section class="uvsoonbar"><div><b>Booking opens soon.</b><span>Get an email the day coaches for ${acctEsc(s.short)} are bookable.</span></div><button type="button" class="btn${on ? " ghost" : ""}" data-wait>${on ? "You’re on the list ✓" : "Notify me"}</button></section>
  <h3>Coaches for ${acctEsc(s.short)}</h3><div id="uvschoolcoaches"><p class="note">Loading…</p></div></div>`;
}
function wireCoachTab(id) {
  if ($("#uvschoolcoaches")) loadCoaches("#uvschoolcoaches", id);
  const w = $("#main [data-wait]");
  if (w) w.onclick = toggleWaitlist;
}

/* ---------- About, Privacy, Terms ---------- */
PAGES.about = () => {
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / About</p><h1>About Project UltraViolet</h1>
  <p class="lede">A free guide to getting into medical school in Canada, from the team behind <a href="https://projectinfrared.org" target="_blank" rel="noopener">Project Infrared</a>.</p>
  <p>Project Infrared helps medical students choose a specialty. UltraViolet comes first: it helps pre-meds get into medical school. Every school page, guide and tool is free. Paid 1-on-1 coaching from current medical students is optional.</p>
  <p>We are not affiliated with any medical school, the AFMC or OMSAS. Requirements change every cycle, so always confirm them on the school’s own website.</p>
  <p>Questions or corrections? <button type="button" class="linkbtn" data-fb>Send feedback</button> or email <a href="mailto:hello@projectuv.com">hello@projectuv.com</a>.</p>`;
  const b = $("[data-fb]");
  if (b) b.onclick = () => openAcct("feedback");
};
PAGES.privacy = () => {
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Privacy policy</p><h1>Privacy policy</h1><p class="note"><b>Draft.</b> The full policy will be published before paid coaching opens.</p>
  <p>We collect the email and name you give us, the schools and checklist items you save, and anything you send through a coach application or feedback form. It is stored with Supabase in Canada (ca-central-1) and used only to run your account and this site.</p>
  <p>To see which pages are useful, we count visits anonymously: a random id kept in your browser, the page you opened, the site that sent you, your device size, time zone and language. We don’t record IP addresses, and we skip this entirely if your browser sends Do Not Track.</p>
  <p>We don’t sell your information. You can delete your account and saved data at any time from your profile. Coach applications, including any proof of enrolment you upload, are seen only by you and the site administrator.</p>
  <p>Questions: <a href="mailto:hello@projectuv.com">hello@projectuv.com</a>.</p>`;
};
PAGES.terms = () => {
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Terms of use</p><h1>Terms of use</h1><p class="note"><b>Draft.</b> Full terms, including coaching, refunds and the coach agreement, will be published before paid coaching opens.</p>
  <p>Project UltraViolet gives general information about applying to Canadian medical schools. It is not affiliated with any school, and nothing here guarantees admission. Requirements change; confirm them with each school.</p>
  <p>You must be 16 or older to create an account. Don’t misuse the site or other people’s accounts.</p>`;
};

/* ---------- boot ---------- */
function uvBoot() {
  buildNav();
  $("#q").addEventListener("input", () => (buildNav(), trackSearch($("#q").value)));
  const mn = document.querySelector(".mobile-nav");
  mn.querySelector(".drawerbtn").onclick = () => {
    document.documentElement.classList.add("drawer");
    $("#q").focus();
  };
  document.querySelector(".drawerclose").onclick = () => document.documentElement.classList.remove("drawer");
  render();
}
