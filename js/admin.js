/* ============================================================
   ADMIN DASHBOARD (#admin/<tab>). Admins only; every figure comes from
   security-definer functions that refuse anyone else (admin_traffic,
   admin_users, admin_coaching, admin_stats) or from tables admins can read.
   ============================================================ */
const ADM_TABS = [["overview", "Overview"], ["traffic", "Traffic"], ["content", "Content"], ["accounts", "Accounts"], ["coaching", "Coaching"], ["feedback", "Feedback"], ["news", "News"], ["health", "Site health"]];
let ADM_DAYS = 30, ADM_FILTER = "pending", ADM_FB = "new";
const ADM_CACHE = {};
const admPct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const tzName = (tz) => (!tz || tz === "unknown" ? "Unknown" : tz.split("/").pop().replace(/_/g, " "));
const schoolName = (k) => (medSchool(k) || { short: k }).short;
function pageLabel(p) {
  if (!p || p === "home") return "Home";
  const [a, b] = p.split("/");
  if (a.startsWith("school-")) return schoolName(a.slice(7)) + (b ? " · " + b.replace(/-/g, " ") : " · overview");
  if (a === "guides") return b ? "Guide: " + ((GUIDES.find((g) => g[0] === b) || [, b])[1]) : "Guides";
  return { schools: "All schools", coaching: "Coaching", account: "Profile", "become-coach": "Become a coach", about: "About", privacy: "Privacy", terms: "Terms", admin: "Admin" }[a] || p;
}
async function admLoad(key, fn) {
  const k = key + ":" + ADM_DAYS;
  if (!ADM_CACHE[k] || Date.now() - ADM_CACHE[k].t > 60000) ADM_CACHE[k] = { t: Date.now(), p: fn() };
  return ADM_CACHE[k].p;
}
const admTraffic = () => admLoad("traffic", () => Acct.sb.rpc("admin_traffic", { days: ADM_DAYS }));
const admUsers = () => admLoad("users", () => Acct.sb.rpc("admin_users", { days: ADM_DAYS }));
const admCoaching = () => admLoad("coaching", () => Acct.sb.rpc("admin_coaching"));
const admStats = () => admLoad("stats", () => Acct.sb.rpc("admin_stats"));

PAGES.admin = async (slug) => {
  if (!Acct.known || (Acct.user && !Acct.profile)) return ($("#main").innerHTML = `<h1>Admin</h1><p class="note">Loading…</p>`);
  if (!isAdmin()) return ($("#main").innerHTML = `<h1>Admin</h1><p class="lede">This page is only for site administrators.</p>`);
  const tab = ADM_TABS.some((t) => t[0] === slug) ? slug : "overview";
  const ranged = ["overview", "traffic", "content", "accounts"].includes(tab);
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Admin</p>
  <div class="admhead"><h1>Admin</h1>${ranged ? `<div class="chips uvchips admrange" role="group" aria-label="Date range">${[[7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([d, t]) => `<button class="chip" data-days="${d}" aria-pressed="${ADM_DAYS === d}">${t}</button>`).join("")}<button class="chip" data-refresh title="Reload the figures">↻</button></div>` : ""}</div>
  <div class="pathanchor"></div><div class="pathwrap"><div class="path" role="tablist">${ADM_TABS.map(([k, t]) => `<button role="tab" aria-selected="${k === tab}" data-tab="${k}">${t}</button>`).join("")}</div></div>
  <div class="panel admpanel" id="admpanel"><p class="note">Loading…</p></div>`;
  document.querySelectorAll("#main [data-tab]").forEach((b) => (b.onclick = () => go("admin/" + b.dataset.tab)));
  document.querySelectorAll("#main [data-days]").forEach((b) => (b.onclick = () => ((ADM_DAYS = +b.dataset.days), PAGES.admin(tab), afterRender())));
  const rf = $("#main [data-refresh]");
  if (rf) rf.onclick = () => (Object.keys(ADM_CACHE).forEach((k) => delete ADM_CACHE[k]), PAGES.admin(tab), afterRender());
  try {
    await ADM_PANELS[tab]();
  } catch (e) {
    const el = $("#admpanel");
    if (el) el.innerHTML = `<p class="accterr">Couldn’t load this tab: ${acctEsc(e.message || e)}</p>`;
  }
  if ($("#admpanel")) wireCharts($("#admpanel"));
};
const admErr = (r) => r && r.error && `<p class="accterr">${acctEsc(r.error.message)}</p>`;
const admPanel = (html) => { const el = $("#admpanel"); if (el && hashParts()[0] === "admin") el.innerHTML = html; return el; };
const card = (title, body, sub, cls) => `<section class="hubcard admcard${cls ? " " + cls : ""}"><h2>${title}</h2>${sub ? `<p class="hubsub">${sub}</p>` : ""}${body}</section>`;
const rangeWord = () => `the last ${ADM_DAYS} days`;
const noTrafficYet = (T) => (!T.views ? `<div class="callout"><b>No visits recorded yet.</b> Tracking starts as soon as people visit. Your own visits aren’t counted, and nothing is recorded while the site is still private on Netlify.</div>` : "");

const ADM_PANELS = {
  async overview() {
    const [t, u, s] = await Promise.all([admTraffic(), admUsers(), admStats()]);
    if (t.error || u.error || s.error) return admPanel(admErr(t) || admErr(u) || admErr(s));
    const T = t.data, U = u.data, S = s.data, F = T.funnel;
    const todo = [];
    if (S.pending_apps) todo.push(`<a href="#admin/coaching">${S.pending_apps} coach application${S.pending_apps === 1 ? "" : "s"} waiting for review</a>`);
    if (S.feedback_new) todo.push(`<a href="#admin/feedback">${S.feedback_new} new feedback report${S.feedback_new === 1 ? "" : "s"}</a>`);
    if ((T.errors || []).length) todo.push(`<a href="#admin/health">${T.errors.length} page error${T.errors.length === 1 ? "" : "s"} seen by visitors</a>`);
    const signups = F.signups;
    admPanel(`${noTrafficYet(T)}
    <div class="statrow topstats admkpis">${kpi("Visitors", T.visitors, T.prev_visitors)}${kpi("Page views", T.views, T.prev_views)}${kpi("New accounts", U.new)}${kpi("Visitor → account", admPct(signups, T.visitors), null, { suffix: "%" })}${kpi("Visitors today", T.today_visitors)}${kpi("Coaching waitlist", S.waitlist)}</div>
    ${todo.length ? `<div class="admtodo"><b>Needs you</b><ul>${todo.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : `<div class="admtodo ok"><b>All caught up.</b> No applications or feedback waiting.</div>`}
    <div class="admgrid">${card("Visitors per day", lineChart("ov-vis", T.daily.map((d) => ({ d: d.d, v: d.visitors })), "Unique visitors per day", { unit: "Visitors" }), rangeWord(), "admwide")}
    ${card("From visit to account", funnel([{ k: "Visited the site", n: F.visitors }, { k: "Opened a school page", n: F.viewed_school }, { k: "Created an account", n: F.signups }, { k: "Saved a school", n: F.saved_school }, { k: "Joined the coaching waitlist", n: F.waitlist }]), "Unique visitors who did each step, " + rangeWord())}
    ${card("Most-viewed schools", barList((T.schools || []).map((x) => ({ k: schoolName(x.k), n: x.u, href: "#school-" + x.k })), { limit: 8 }), "Unique visitors")}
    ${card("Accounts", `<div class="statrow admmini">${kpi("Total", U.total)}${kpi("Signed in, 7 days", U.active_7)}${kpi("Newsletter", U.newsletter)}${kpi("Tracking schools", U.with_schools)}</div>`, "All time")}
    ${card("Where visitors come from", barList((T.refs || []).map((x) => ({ k: x.k, n: x.n })), { limit: 6 }), "Visits by source")}</div>`);
  },

  async traffic() {
    const t = await admTraffic();
    if (t.error) return admPanel(admErr(t));
    const T = t.data;
    const H = (T.hours || []).map((h) => ({ k: h.h + ":00", short: h.h % 6 === 0 ? String(h.h) : "", n: h.n }));
    const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    admPanel(`${noTrafficYet(T)}
    <div class="statrow topstats admkpis">${kpi("Visits (sessions)", T.sessions)}${kpi("Pages per visit", T.pages_per_session)}${kpi("Left after one page", T.bounce_rate, null, { suffix: "%" })}${kpi("Avg visit length", T.avg_session_min, null, { suffix: " min", note: "visits of 2+ pages" })}${kpi("Returning visitors", T.returning_pct, null, { suffix: "%" })}${kpi("Views while signed in", T.signed_in_pct, null, { suffix: "%" })}</div>
    <div class="admgrid">${card("Page views per day", lineChart("tr-views", T.daily.map((d) => ({ d: d.d, v: d.views })), "Page views per day", { unit: "Views" }), rangeWord(), "admwide")}
    ${card("Sources", barList((T.refs || []).map((x) => ({ k: x.k, n: x.n })), { limit: 12 }), "Visits by the site that sent them, or a ?utm_source= tag on your links")}
    ${card("Devices", barList((T.devices || []).map((x) => ({ k: x.k[0].toUpperCase() + x.k.slice(1), n: x.n })), { pctOf: T.visitors }), "Unique visitors by screen size")}
    ${card("Where visitors are", barList((T.regions || []).map((x) => ({ k: tzName(x.k), n: x.n, sub: x.k })), { limit: 10 }), "By the time zone their device is set to")}
    ${card("Languages", barList((T.langs || []).map((x) => ({ k: ({ en: "English", fr: "French" })[x.k] || x.k, n: x.n })), { pctOf: T.visitors }), "Browser language")}
    ${card("Time of day", columnChart(H, "Page views by hour, Toronto time"), "When to post on social media")}
    ${card("Day of the week", columnChart((T.weekdays || []).map((w) => ({ k: WD[w.w], n: w.n })), "Page views by weekday"), rangeWord())}</div>
    <p class="note">Visitors are counted by a random id kept in their browser, so the same person on a phone and a laptop counts twice, and clearing browser data starts a new id. Your own visits aren’t counted.</p>`);
  },

  async content() {
    const t = await admTraffic();
    if (t.error) return admPanel(admErr(t));
    const T = t.data;
    const found = (q) => MED_SCHOOLS.some((s) => (s.name + " " + s.short + " " + s.city).toLowerCase().includes(q));
    const all = UV_SCHOOLS(), seen = new Set((T.schools || []).map((x) => x.k));
    admPanel(`${noTrafficYet(T)}<div class="admgrid">
    ${card("Top pages", barList((T.pages || []).map((x) => ({ k: pageLabel(x.k), n: x.n, sub: x.u + " visitors", href: "#" + x.k })), { limit: 15 }), "Page views, " + rangeWord(), "admwide")}
    ${card("Schools by interest", barList((T.schools || []).map((x) => ({ k: schoolName(x.k), n: x.u, sub: x.n + " views", href: "#school-" + x.k })), { limit: 20 }), "Unique visitors to each school’s pages")}
    ${card("Schools nobody opened", all.filter((s) => !seen.has(s.id)).length ? `<p>${all.filter((s) => !seen.has(s.id)).map((s) => `<a href="#school-${s.id}">${acctEsc(s.short)}</a>`).join(" · ")}</p>` : `<p class="note">Every school was opened at least once.</p>`, rangeWord())}
    ${card("What people searched for", (T.searches || []).length ? `<ol class="chbars">${T.searches.map((x) => `<li><span class="chbl">${acctEsc(x.k)}${found(x.k) ? "" : ` <span class="hubtag">no match</span>`}</span><span class="chbt"><i style="width:${(100 * x.n) / T.searches[0].n}%"></i></span><span class="chbv">${chNum(x.n)}</span></li>`).join("")}</ol>` : `<p class="note">No searches yet.</p>`, "From the sidebar and home-page search. “No match” means no school matched: a hint for what to add.")}
    ${card("Links people clicked to leave", barList((T.outbound || []).map((x) => ({ k: x.k, n: x.n })), { limit: 12 }), "Mostly school admissions pages and sources")}</div>`);
  },

  async accounts() {
    const u = await admUsers();
    if (u.error) return admPanel(admErr(u));
    const U = u.data;
    const ST = Object.fromEntries((typeof MED_STATUS !== "undefined" ? MED_STATUS : []).map(([k, t]) => [k, t]));
    admPanel(`<div class="statrow topstats admkpis">${kpi("Accounts", U.total)}${kpi("Confirmed email", admPct(U.confirmed, U.total), null, { suffix: "%" })}${kpi("New", U.new, null, { note: rangeWord() })}${kpi("Signed in, 7 days", U.active_7)}${kpi("Signed in, 30 days", U.active_30)}${kpi("Newsletter opt-in", admPct(U.newsletter, U.total), null, { suffix: "%" })}</div>
    <div class="admgrid">${card("New accounts per day", lineChart("ac-new", (U.daily || []).map((d) => ({ d: d.d, v: d.n })), "New accounts per day", { unit: "Accounts" }), rangeWord(), "admwide")}
    ${card("Schools students are tracking", barList((U.tracked || []).map((x) => ({ k: schoolName(x.k), n: x.n, href: "#school-" + x.k })), { limit: 20, empty: "No one has saved a school yet." }), `${chNum(U.with_schools)} students track schools · ${U.avg_schools ?? 0} each on average`)}
    ${card("Where students are in the process", barList((U.statuses || []).map((x) => ({ k: ST[x.k] || x.k, n: x.n }))), "Status of every tracked school, across all students")}
    ${card("Roles", barList((U.roles || []).map((x) => ({ k: x.k[0].toUpperCase() + x.k.slice(1), n: x.n }))), "")}
    ${card("Newest accounts", (U.recent || []).length ? `<div class="tw"><table class="uvtable"><thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Email confirmed</th><th>Last sign-in</th></tr></thead><tbody>${U.recent.map((r) => `<tr><td>${acctEsc(r.name || "—")}</td><td>${acctEsc(r.role)}</td><td>${new Date(r.at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td><td>${r.confirmed ? "Yes" : "Not yet"}</td><td>${r.last ? new Date(r.last).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "—"}</td></tr>`).join("")}</tbody></table></div>` : `<p class="note">No accounts yet.</p>`, "Names only; emails stay private", "admwide")}</div>`);
  },

  async coaching() {
    const [c, t, u, apps, coaches] = await Promise.all([
      admCoaching(), admTraffic(), admUsers(),
      Acct.sb.from("coach_applications").select("*").eq("status", ADM_FILTER).order("created_at", { ascending: ADM_FILTER === "pending" }),
      Acct.sb.from("coaches").select("*").order("created_at"),
    ]);
    if (c.error) return admPanel(admErr(c));
    const C = c.data, A = Object.fromEntries((C.apps || []).map((x) => [x.k, x.n]));
    const views = Object.fromEntries(((t.data || {}).schools || []).map((x) => [x.k, x.u]));
    const tracked = Object.fromEntries(((u.data || {}).tracked || []).map((x) => [x.k, x.n]));
    const cov = Object.fromEntries((C.coverage || []).map((x) => [x.k, x]));
    const demand = UV_SCHOOLS().map((s) => ({ s, v: views[s.id] || 0, tr: tracked[s.id] || 0, c: (cov[s.id] || {}).n || 0, live: (cov[s.id] || {}).live || 0 })).sort((a, b) => b.tr + b.v - (a.tr + a.v));
    admPanel(`<div class="statrow topstats admkpis">${kpi("Waiting for review", A.pending || 0, null, { note: C.oldest_pending_days != null ? "oldest " + C.oldest_pending_days + " days" : "" })}${kpi("Approved coaches", C.coaches)}${kpi("Live on the site", C.live)}${kpi("Coaching waitlist", C.waitlist)}${kpi("Avg time to review", C.avg_review_days, null, { suffix: " days" })}${kpi("Rejected", A.rejected || 0)}</div>
    <div class="admgrid">${card("Where coaches are needed", `<div class="tw"><table class="uvtable"><thead><tr><th>School</th><th>Students tracking</th><th>Visitors</th><th>Coaches</th><th>Live</th></tr></thead><tbody>${demand.map((d) => `<tr class="${d.c === 0 && (d.tr || d.v) ? "admgap" : ""}"><td><a href="#school-${d.s.id}">${acctEsc(d.s.short)}</a></td><td class="num">${d.tr}</td><td class="num">${d.v}</td><td class="num">${d.c}</td><td class="num">${d.live}</td></tr>`).join("")}</tbody></table></div>`, "Demand (students tracking the school, and visitors in " + rangeWord() + ") against coaches. Highlighted rows have interest and no coach: recruit there first.", "admwide")}
    ${card("What coaches offer", barList((C.services || []).map((x) => ({ k: ((typeof COACH_SERVICES !== "undefined" ? COACH_SERVICES : []).find((s) => s[0] === x.k) || [, x.k])[1], n: x.n })), { empty: "No coaches yet." }), "Approved coaches by service")}
    ${card("Schools applicants offered", barList((C.applied_for || []).map((x) => ({ k: schoolName(x.k), n: x.n })), { empty: "No applications yet." }), "All applications, any status")}</div>
    <h2>Applications</h2>
    <div class="chips uvchips" role="group" aria-label="Filter">${[["pending", "Waiting for you"], ["needs_info", "Asked for info"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${ADM_FILTER === k}">${t}${A[k] ? ` (${A[k]})` : ""}</button>`).join("")}</div>
    <div id="admapps">${admAppsHtml(apps)}</div>
    <h2>Coaches</h2><p class="note">Approved coaches stay hidden until you show them, once their profile and payouts are set up.</p><div id="admcoaches">${admCoachesHtml(coaches)}</div>`);
    document.querySelectorAll("#admpanel [data-f]").forEach((b) => (b.onclick = () => ((ADM_FILTER = b.dataset.f), PAGES.admin("coaching"), afterRender())));
    wireAdmApps();
  },

  async feedback() {
    const fb = await Acct.sb.from("feedback").select("*").eq("status", ADM_FB).order("created_at", { ascending: false }).limit(200);
    const counts = await Acct.sb.from("feedback").select("status");
    const n = {};
    (counts.data || []).forEach((r) => (n[r.status] = (n[r.status] || 0) + 1));
    const FB_KIND = { error: "Something’s wrong", data: "Data or source", idea: "Idea", other: "Other" };
    admPanel(`<div class="chips uvchips" role="group" aria-label="Feedback filter">${[["new", "New"], ["reviewing", "Reviewing"], ["fixed", "Fixed"], ["wont_fix", "Won’t fix"]].map(([k, t]) => `<button class="chip" data-fb="${k}" aria-pressed="${ADM_FB === k}">${t}${n[k] ? ` (${n[k]})` : ""}</button>`).join("")}</div>
    <div id="admfb">${fb.error ? admErr(fb) : !fb.data.length ? `<p class="note">Nothing here.</p>` : fb.data.map((f) => `<article class="hubcard uvapp" data-fid="${f.id}"><div class="uvapphead"><div><b>${acctEsc(FB_KIND[f.kind] || f.kind)}</b>${f.page ? ` · <a class="note" href="${acctEsc(f.page)}">${acctEsc(pageLabel(f.page.replace(/^#/, "")))}</a>` : ""}</div><small class="note">${acctEsc(f.email || "deleted account")} · ${new Date(f.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</small></div>
      <p>${acctEsc(f.message)}</p>${f.reply ? `<p class="note">Your reply: ${acctEsc(f.reply)}</p>` : ""}
      <label class="acctf"><span>Reply (the sender sees it on their profile)</span><textarea rows="2" maxlength="2000" class="fbreply"></textarea></label>
      <div class="uvacts">${[["reviewing", "Reviewing"], ["fixed", "Fixed"], ["wont_fix", "Won’t fix"]].filter(([k]) => k !== f.status).map(([k, t]) => `<button class="btn ghost" data-fs="${k}">Mark ${t.toLowerCase()}</button>`).join("")}</div></article>`).join("")}</div>`);
    document.querySelectorAll("#admpanel [data-fb]").forEach((c) => (c.onclick = () => ((ADM_FB = c.dataset.fb), PAGES.admin("feedback"), afterRender())));
    document.querySelectorAll("#admfb [data-fs]").forEach(
      (b) =>
        (b.onclick = async () => {
          const cardEl = b.closest("[data-fid]"), reply = cardEl.querySelector(".fbreply").value.trim();
          const { error } = await Acct.sb.rpc("admin_update_feedback", { fid: +cardEl.dataset.fid, new_status: b.dataset.fs, new_reply: reply || null });
          if (error) return alert(error.message);
          delete ADM_CACHE["stats:" + ADM_DAYS];
          PAGES.admin("feedback");
          afterRender();
        }),
    );
  },

  async news() {
    const [r, nl, st] = await Promise.all([
      Acct.sb.from("news").select("*").order("created_at", { ascending: false }).limit(100),
      Acct.sb.rpc("admin_newsletter"),
      fetch(ACCT_CFG.url + "/functions/v1/uv-newsletter?status=1").then((x) => (x.ok ? x.json() : null)).catch(() => null),
    ]);
    const N = nl.data || {};
    const nlCard = `<section class="hubcard"><h2>The Sunday newsletter</h2><p class="hubsub">Sent Sundays at 8 a.m. to members with it switched on. Issues are written by the Saturday-night sweep. <a href="#newsletter">See issues</a></p>
      <div class="statrow"><div class="stat"><b>${nl.error ? "—" : chNum(N.subscribers || 0)}</b><span>Subscribers (confirmed emails)</span></div><div class="stat"><b>${N.last ? acctEsc(N.last.week) : "Not yet"}</b><span>Last sent${N.last ? ` to ${chNum(N.last.recipients)}${N.last.failed ? `, ${N.last.failed} failed` : ""}` : ""}</span></div><div class="stat"><b>${st ? (st.resend_key_set ? "Ready" : "Needs key") : "Not set up"}</b><span>Sending</span></div></div>
      ${st && !st.resend_key_set ? `<p class="callout"><b>One step left:</b> add the secret <code>RESEND_API_KEY</code> in Supabase → Edge Functions → Secrets, so the Sunday email can send.</p>` : ""}</section>`;
    admPanel(nlCard + `<form id="newsform" class="hubcard uvform"><h2>Post an update</h2><p class="hubsub">Shows on students’ profiles under News. Pick a school to show it to students tracking that school first.</p>
      <div class="uvrow"><label class="acctf"><span>Title</span><input name="title" required minlength="3" maxlength="160" placeholder="e.g. McMaster opens its 2027 application"></label>
      <label class="acctf"><span>School (optional)</span><select name="school"><option value="">All students</option>${UV_SCHOOLS().map((s) => `<option value="${s.id}">${acctEsc(s.short)}</option>`).join("")}</select></label></div>
      <label class="acctf"><span>Details (optional)</span><textarea name="body" rows="3" maxlength="4000"></textarea></label>
      <label class="acctf"><span>Link (optional, https://…)</span><input name="url" type="url" pattern="https://.*" maxlength="500"></label>
      <div class="uvacts"><button class="btn" type="submit">Publish</button><span class="hubmsg" role="status"></span></div></form>
    <h2>Posted</h2>${r.error ? admErr(r) : !r.data.length ? `<p class="note">Nothing posted yet.</p>` : r.data.map((n) => `<article class="hubcard uvapp" data-nid="${n.id}"><div class="uvapphead"><div><b>${acctEsc(n.title)}</b>${n.school ? ` · ${acctEsc(schoolName(n.school))}` : ""}${n.published ? "" : ` <span class="hubtag">Hidden</span>`}</div><small class="note">${new Date(n.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</small></div>${n.body ? `<p>${acctEsc(n.body)}</p>` : ""}${n.url ? `<p><a href="${acctEsc(n.url)}" target="_blank" rel="noopener">${acctEsc(n.url)}</a></p>` : ""}<div class="uvacts"><button class="btn ghost" data-pub="${!n.published}">${n.published ? "Hide" : "Show"}</button><button class="btn ghost danger" data-del>Delete</button></div></article>`).join("")}`);
    $("#newsform").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target), msg = e.target.querySelector(".hubmsg");
      const row = { title: String(fd.get("title")).trim(), school: fd.get("school") || null, body: String(fd.get("body")).trim() || null, url: String(fd.get("url")).trim() || null };
      const { error } = await Acct.sb.from("news").insert(row);
      if (error) return (msg.className = "hubmsg err"), (msg.textContent = error.message);
      PAGES.admin("news");
      afterRender();
    };
    document.querySelectorAll("#admpanel [data-nid]").forEach((a) => {
      const id = +a.dataset.nid;
      a.querySelector("[data-pub]").onclick = async (e) => {
        const { error } = await Acct.sb.from("news").update({ published: e.target.dataset.pub === "true" }).eq("id", id);
        if (error) return alert(error.message);
        PAGES.admin("news");
      };
      a.querySelector("[data-del]").onclick = async () => {
        if (!confirm("Delete this post?")) return;
        const { error } = await Acct.sb.from("news").delete().eq("id", id);
        if (error) return alert(error.message);
        PAGES.admin("news");
      };
    });
  },

  async health() {
    const t = await admTraffic();
    const T = (t.data || {});
    const cyc = medDefaultCycle();
    const expected = UV_SCHOOLS().filter((s) => { const e = medMain(s, cyc); return e && e.est; });
    const passed = UV_SCHOOLS().filter((s) => { const e = medMain(s, cyc); return e && medPast(e); });
    admPanel(`<div class="admgrid">
    ${card("Errors visitors hit", (T.errors || []).length ? `<div class="tw"><table class="uvtable"><thead><tr><th>Error</th><th>Page</th><th>Times</th><th>Last seen</th></tr></thead><tbody>${T.errors.map((e) => `<tr><td>${acctEsc(e.k)}</td><td>${acctEsc(pageLabel(e.p))}</td><td class="num">${e.n}</td><td>${new Date(e.last).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td></tr>`).join("")}</tbody></table></div>` : `<p class="note">No errors reported in ${rangeWord()}.</p>`, "JavaScript errors in visitors’ browsers, up to 5 per visit", "admwide")}
    ${card("School dates", `<p><b>${MED_CYCLES[cyc]}</b> is the cycle shown to students right now.</p><p>${expected.length ? `${expected.length} of ${UV_SCHOOLS().length} schools still show <i>expected</i> dates (copied from last cycle): ${expected.map((s) => acctEsc(s.short)).join(", ")}. Update them in <code>js/medprep.js</code> as schools post new dates.` : "Every school has posted dates for this cycle."}</p>${passed.length ? `<p class="note">Deadline already passed this cycle: ${passed.map((s) => acctEsc(s.short)).join(", ")}.</p>` : ""}`, "Keeps the timeline and deadline lists honest")}
    ${card("Services", `<ul class="b"><li><a href="https://supabase.com/dashboard/project/igdvjbgaawncwqwotvpr" target="_blank" rel="noopener">Supabase</a>: database, logins, logs and backups</li><li><a href="https://resend.com/emails" target="_blank" rel="noopener">Resend</a>: every email sent, opens and bounces</li><li><a href="https://app.netlify.com/projects/projectultraviolet" target="_blank" rel="noopener">Netlify</a>: deploys, domain and HTTPS, and whether the site is public</li><li><a href="https://github.com/deniz-dk/projectultraviolet" target="_blank" rel="noopener">GitHub</a>: the code and its history</li></ul>`, "Where to look when something’s off")}</div>`);
  },
};

function admAppsHtml(apps) {
  if (apps.error) return admErr(apps);
  if (!apps.data.length) return `<p class="note">Nothing here.</p>`;
  const sname = (k) => acctEsc(schoolName(k));
  return apps.data
    .map(
      (a) => `<article class="hubcard uvapp" data-id="${a.id}"><div class="uvapphead"><div><b>${acctEsc(a.full_name)}</b> · ${acctEsc(a.training_level)}, ${acctEsc(a.med_school)}</div><small class="note">${new Date(a.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</small></div>
      <p><b>Coaches for:</b> ${a.schools_coached.map(sname).join(", ")} · <b>Services:</b> ${a.services.map((k) => acctEsc((COACH_SERVICES.find((x) => x[0] === k) || [, k])[1])).join(", ")}</p>
      ${a.conflict_role ? `<p class="uvflag"><b>Conflict of interest declared:</b> ${acctEsc(a.conflict_details || "")}</p>` : `<p class="note">No conflict of interest declared.</p>`}
      <details><summary>Admissions story and bio</summary><p>${acctEsc(a.admissions_story)}</p><p><i>${acctEsc(a.bio)}</i></p></details>
      <p>${a.proof_path ? `<button type="button" class="linkbtn" data-proof="${acctEsc(a.proof_path)}">Open proof of enrolment</button>` : "No proof uploaded."}</p>
      ${a.reviewer_note ? `<p class="note">Your note: ${acctEsc(a.reviewer_note)}</p>` : ""}
      ${["pending", "needs_info"].includes(a.status) ? `<label class="acctf"><span>Note to the applicant (needed to ask for info; optional otherwise)</span><textarea rows="2" maxlength="2000" class="admnote"></textarea></label>
      <div class="uvacts"><button class="btn" data-d="approved">Approve</button><button class="btn ghost" data-d="needs_info">Ask for more info</button><button class="btn ghost danger" data-d="rejected">Reject</button><span class="hubmsg" role="status"></span></div>` : ""}</article>`,
    )
    .join("");
}
function admCoachesHtml(coaches) {
  if (coaches.error) return admErr(coaches);
  if (!coaches.data.length) return `<p class="note">No coaches yet.</p>`;
  return `<div class="tw"><table class="uvtable"><thead><tr><th>Coach</th><th>Schools</th><th>On the site</th><th></th></tr></thead><tbody>${coaches.data.map((c) => `<tr><td>${acctEsc(c.display_name)}${c.headline ? `<br><small>${acctEsc(c.headline)}</small>` : ""}</td><td>${c.schools.map((k) => acctEsc(schoolName(k))).join(", ")}</td><td>${c.visible ? "Shown" : "Hidden"}</td><td><button class="btn ghost" data-vis="${c.user_id}" data-show="${!c.visible}">${c.visible ? "Hide" : "Show"}</button></td></tr>`).join("")}</tbody></table></div>`;
}
function wireAdmApps() {
  const reload = () => (Object.keys(ADM_CACHE).forEach((k) => delete ADM_CACHE[k]), PAGES.admin("coaching"), afterRender());
  document.querySelectorAll("#admpanel [data-proof]").forEach(
    (b) =>
      (b.onclick = async () => {
        const { data, error } = await Acct.sb.storage.from("coach-docs").createSignedUrl(b.dataset.proof, 300);
        if (error) return alert(error.message);
        window.open(data.signedUrl, "_blank", "noopener");
      }),
  );
  document.querySelectorAll("#admpanel [data-d]").forEach(
    (b) =>
      (b.onclick = async () => {
        const c = b.closest(".uvapp"), note = c.querySelector(".admnote").value.trim(), msg = c.querySelector(".hubmsg");
        if (b.dataset.d === "needs_info" && !note) return (msg.className = "hubmsg err"), (msg.textContent = "Add a note saying what you need.");
        if (b.dataset.d === "rejected" && !confirm("Reject this application?")) return;
        c.querySelectorAll("button").forEach((x) => (x.disabled = true));
        const { error } = await Acct.sb.rpc("review_coach_application", { app_id: +c.dataset.id, decision: b.dataset.d, note: note || null });
        if (error) {
          msg.className = "hubmsg err";
          msg.textContent = error.message;
          c.querySelectorAll("button").forEach((x) => (x.disabled = false));
          return;
        }
        reload();
      }),
  );
  document.querySelectorAll("#admpanel [data-vis]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        const { error } = await Acct.sb.rpc("set_coach_visible", { coach: b.dataset.vis, show: b.dataset.show === "true" });
        if (error) return alert(error.message);
        reload();
      }),
  );
}
