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
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
};
const pIco = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${prepIco[k] || ""}</svg>`;
const prepDay = (s) => new Date(s + "T12:00:00");
const prepFmt = (s, o) => prepDay(s).toLocaleDateString("en-CA", o || { month: "short", day: "numeric" });
const LOGO = (sz) =>
  `<svg class="logo" width="${sz}" height="${sz}" viewBox="0 0 64 64" role="img" aria-label="Project UltraViolet"><circle cx="32" cy="32" r="28" fill="none" stroke="var(--scrub)" stroke-width="5"/><text x="32" y="43" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" style="font-stretch:112%" font-size="29" fill="var(--scrub)">uV</text></svg>`;
const provName = (k) => (MED_PROV.find((p) => p[0] === k) || [, k])[1];
const testLabel = (s) => (s.m === "y" ? "MCAT" : s.m === "cars" ? "MCAT (CARS only)" : s.m === "n" ? "No MCAT" : "Check");

/* ---------- sidebar: every school, grouped by region ---------- */
function buildNav() {
  const nav = $("#nav");
  const q = ($("#q").value || "").trim().toLowerCase();
  const item = (id, label, sub) => `<button class="navitem" data-id="${id}"><span>${label}${sub ? `<span class="navsub">${sub}</span>` : ""}</span></button>`;
  let h = q ? "" : item("home", "Home") + item("schools", "All schools") + item("guides", "Guides") + item("coaching", "Coaching");
  MED_PROV.forEach(([k, name]) => {
    const list = MED_SCHOOLS.filter((s) => s.prov === k && (!q || (s.name + " " + s.short + " " + s.city).toLowerCase().includes(q)));
    if (!list.length) return;
    h += `<div class="navgroup">${name}</div>` + list.map((s) => item("school-" + s.id, acctEsc(s.id === "mcgillp" ? "McGill Med-P" : s.short), acctEsc(s.city.split(" · ")[0]))).join("");
  });
  nav.innerHTML = h || `<p class="note" style="padding:8px 12px">No school matches “${acctEsc(q)}”.</p>`;
  nav.querySelectorAll(".navitem").forEach((b) => (b.onclick = () => go(b.dataset.id)));
  const sel = $("#msel");
  sel.innerHTML =
    `<option value="home">Home</option><option value="schools">All schools</option><option value="guides">Guides</option><option value="coaching">Coaching</option>` +
    MED_PROV.map(([k, name]) => `<optgroup label="${name}">${MED_SCHOOLS.filter((s) => s.prov === k).map((s) => `<option value="school-${s.id}">${acctEsc(s.id === "mcgillp" ? "McGill Med-P" : s.short)}</option>`).join("")}</optgroup>`).join("");
  sel.onchange = (e) => go(e.target.value);
  mark();
}
function mark() {
  const id = hashParts()[0];
  document.querySelectorAll(".navitem").forEach((b) => b.setAttribute("aria-current", b.dataset.id === id ? "true" : "false"));
  const sel = $("#msel");
  if (sel) sel.value = [...sel.options].some((o) => o.value === id) ? id : "home";
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
    `<footer class="sitefoot"><span>© ${new Date().getFullYear()} Project UltraViolet</span><a href="#about">About</a><a href="#privacy">Privacy policy</a><a href="#terms">Terms of use</a><a href="https://projectinfrared.org" target="_blank" rel="noopener">Sister site: Project Infrared ↗</a><span>General information only. Not affiliated with any medical school. Always confirm requirements on the school’s own website.</span></footer>`,
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
  <h2>Coming up</h2>
  <div class="grid-cards uvdue">${up.length ? up.map((e) => `<a class="gc" href="${e.id ? "#school-" + e.id : "#guides/applying"}"><b>${prepFmt(e.d, { month: "long", day: "numeric", year: "numeric" })}${e.est ? " (expected)" : ""}</b><span>${acctEsc(e.who)} application deadline</span></a>`).join("") : `<p class="note">No deadlines left this cycle. New dates appear as schools post them.</p>`}</div>
  <h2>Start here</h2>
  <div class="grid-cards toolcards">
    <a class="gc" href="#schools"><b>Compare every school</b><span>Seats, tests, deadlines and how to apply, side by side.</span></a>
    <a class="gc" href="#guides/applying"><b>How applying works</b><span>OMSAS, Quebec, the Prairies, BC and Atlantic Canada, explained.</span></a>
    <a class="gc" href="#account/med-school" data-needacct><b>Track your applications</b><span>Pick your schools and get one deadline list, a checklist and a tracker.</span></a>
    <a class="gc" href="#coaching"><b>Work with a coach</b><span>1-on-1 help from students who got into the school you want.</span></a>
  </div>
  <p class="note">School figures come from each school’s admissions pages and the AFMC’s admission requirements guide. Always check the school’s own site before you apply.</p>`;
  const f = $(".uvfind");
  f.onsubmit = (e) => {
    e.preventDefault();
    const v = $("#uvfind").value.trim().toLowerCase();
    const s = all.find((x) => x.name.toLowerCase() === v) || all.find((x) => (x.name + " " + x.short + " " + x.city).toLowerCase().includes(v));
    go(s ? "school-" + s.id : "schools");
  };
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

/* ---------- Guides ---------- */
const GUIDES = [
  ["applying", "How applying works", "One application in Ontario, separate forms everywhere else. What each region expects."],
  ["timeline", "Your application year, month by month", "From booking the MCAT to offer day.", true],
  ["requirements", "GPA, prerequisites and tests", "How schools weigh grades, the MCAT and Casper.", true],
  ["sketch", "The Autobiographical Sketch and essays", "Activities, verifiers and writing about yourself.", true],
  ["interviews", "MMI and panel interviews", "Formats, practice and what interviewers look for.", true],
  ["pathways", "Pathways and special streams", "Indigenous, Black, rural, francophone and other streams.", true],
];
PAGES.guides = (slug) => {
  if (slug === "applying") return guideApplying();
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Guides</p><h1>Guides</h1><p class="lede">Plain-language guides to each part of applying to medical school in Canada.</p>
  <div class="grid-cards">${GUIDES.map(([k, t, d, soon]) => (soon ? `<div class="gc uvsoon"><b>${t}</b><span>${d}</span><span class="hubtag">Coming soon</span></div>` : `<a class="gc" href="#guides/${k}"><b>${t}</b><span>${d}</span></a>`)).join("")}</div>`;
};
function guideApplying() {
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / <a href="#guides">Guides</a> / How applying works</p><h1>How applying works</h1>
  <p class="lede">Canada has no single national application. Ontario’s seven schools share one system; every other school runs its own.</p>
  ${MED_PROV.map(([k, name, sys, txt]) => `<section class="box"><h2>${name}</h2><p class="specmeta"><span>${acctEsc(sys)}</span></p><p>${txt}</p><p class="note">Schools: ${MED_SCHOOLS.filter((s) => s.prov === k && s.id !== "mcgillp").map((s) => `<a href="#school-${s.id}">${acctEsc(s.short)}</a>`).join(" · ")}</p></section>`).join("")}
  <p class="srcs">Source: <a class="src" href="${MED_SRC}" target="_blank" rel="noopener">AFMC Admission Requirements of Canadian Faculties of Medicine 2027 ↗</a></p>`;
}

/* ---------- Coaching ---------- */
const SERVICES = [
  ["strategy", "1-on-1 coaching", "General strategy or school-specific, 30 or 60 minutes."],
  ["interviews", "Mock interviews", "MMI or panel practice for a specific school, with written feedback."],
  ["review", "Application review", "Sketch, essays or letters, returned with comments."],
  ["packages", "Packages", "Bundles of sessions and reviews at a lower price."],
];
PAGES.coaching = () => {
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Coaching</p><h1>Coaching</h1>
  <p class="lede">Work 1-on-1 with medical students who got into the school you’re aiming for. Booking opens soon.</p>
  <div class="grid-cards">${SERVICES.map(([, t, d]) => `<div class="gc"><b>${t}</b><span>${d}</span></div>`).join("")}</div>
  <h2>Coaches</h2><div id="uvcoaches"><p class="note">Loading…</p></div>
  <section class="box uvjoin"><h2>Become a coach</h2><p>Are you a Canadian medical student? Help applicants get into your school and get paid for it. Every coach is reviewed before they appear here.</p><a class="btn" href="#become-coach">Apply to coach</a></section>`;
  loadCoaches("#uvcoaches");
};
async function loadCoaches(sel, school) {
  const el = $(sel);
  if (!el) return;
  if (!Acct.sb) return (el.innerHTML = `<p class="note">Coach profiles appear here once coaching opens.</p>`);
  let q = Acct.sb.from("coaches").select("user_id,display_name,headline,bio,schools,services").eq("visible", true).order("created_at");
  if (school) q = q.contains("schools", [school]);
  const { data, error } = await q;
  if (!$(sel)) return;
  if (error || !data || !data.length) {
    el.innerHTML = `<p class="note">${school ? "No coaches for this school yet." : "No coaches listed yet."} The first coaches are being onboarded now. <a href="#become-coach">Want to be one?</a></p>`;
    return;
  }
  el.innerHTML = `<div class="grid-cards">${data.map((c) => `<div class="gc uvcoach"><b>${acctEsc(c.display_name)}</b>${c.headline ? `<span>${acctEsc(c.headline)}</span>` : ""}<span>${(c.schools || []).map((k) => acctEsc((medSchool(k) || { short: k }).short)).join(" · ")}</span><span class="note">${acctEsc((c.bio || "").slice(0, 180))}</span><button class="btn" disabled>Booking opens soon</button></div>`).join("")}</div>`;
}
function uvCoachTab(s) {
  return `<p class="lede">Get help from students who got into ${acctEsc(s.short)}.</p><div id="uvschoolcoaches"><p class="note">Loading…</p></div>
  <section class="box uvjoin"><h3>Got into ${acctEsc(s.short)}?</h3><p>Coach applicants for your school. <a href="#become-coach">Apply to coach</a></p></section>`;
}
function wireCoachTab(id) {
  if ($("#uvschoolcoaches")) loadCoaches("#uvschoolcoaches", id);
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
  $("#q").addEventListener("input", buildNav);
  const mn = document.querySelector(".mobile-nav");
  mn.querySelector(".drawerbtn").onclick = () => {
    document.documentElement.classList.add("drawer");
    $("#q").focus();
  };
  document.querySelector(".drawerclose").onclick = () => document.documentElement.classList.remove("drawer");
  render();
}
