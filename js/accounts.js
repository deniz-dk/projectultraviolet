/* ============================================================
   ACCOUNTS: email/password sign-in through Supabase, the profile page
   (#account), the coach application (#become-coach) and the admin panel (#admin).
   Roles live in public.profiles.role (student / coach / admin). The database
   enforces every rule; these pages only show what the rules allow.
   ============================================================ */
const ACCT_CFG = { url: "__SUPABASE_URL__", key: "__SUPABASE_KEY__" };
const Acct = { sb: null, user: null, on: false, known: false, pulling: false, prefs: {}, profile: null, app: null, coach: null };
const acctEsc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const acctHome = () => location.origin + location.pathname;
const isAdmin = () => !!(Acct.profile && Acct.profile.role === "admin");

/* ---------- sync ---------- */
let acctPushTimer = null;
function acctPush() {
  if (!Acct.user || Acct.pulling) return;
  clearTimeout(acctPushTimer);
  acctPushTimer = setTimeout(async () => {
    const row = { user_id: Acct.user.id, med: Acct.prefs.med || null, updated_at: new Date().toISOString() };
    const { error } = await Acct.sb.from("user_prefs").upsert(row);
    if (error) console.warn("Couldn't save to your account:", error.message);
  }, 400);
}
async function acctPull() {
  Acct.pulling = true;
  try {
    const [p, u, a] = await Promise.all([
      Acct.sb.from("profiles").select("full_name,role,created_at").eq("id", Acct.user.id).maybeSingle(),
      Acct.sb.from("user_prefs").select("*").eq("user_id", Acct.user.id).maybeSingle(),
      Acct.sb.from("coach_applications").select("*").eq("user_id", Acct.user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    Acct.profile = p.data || { role: "student" };
    Acct.prefs = { med: (u.data && u.data.med) || null, newsletter: !!(u.data && u.data.newsletter), coaching_waitlist: !!(u.data && u.data.coaching_waitlist) };
    Acct.app = (a.data && a.data[0]) || null;
    Acct.coach = null;
    if (Acct.profile.role === "coach") {
      const c = await Acct.sb.from("coaches").select("*").eq("user_id", Acct.user.id).maybeSingle();
      Acct.coach = c.data || null;
    }
  } catch (e) {
    console.warn("Couldn't load your account:", e.message || e);
  }
  Acct.pulling = false;
  refreshAll();
}
function refreshAll() {
  const y = window.scrollY;
  acctBar();
  render();
  mark();
  window.scrollTo(0, y);
}

/* ---------- sidebar account row ---------- */
function acctBar() {
  let el = document.querySelector(".acctbar");
  if (!el) {
    document.querySelector(".brand-sub").insertAdjacentHTML("afterend", '<div class="acctbar"></div>');
    el = document.querySelector(".acctbar");
  }
  if (!Acct.on) return el.remove();
  const name = (Acct.profile && Acct.profile.full_name) || (Acct.user && Acct.user.email) || "";
  const pb = document.querySelector(".profbtn");
  if (pb) {
    pb.classList.toggle("in", !!Acct.user);
    pb.innerHTML = Acct.user ? `<span class="profini">${acctEsc(name[0] ? name[0].toUpperCase() : "?")}</span>` : "Log in";
    pb.onclick = () => (Acct.user ? go("account") : openAcct("login"));
  }
  el.innerHTML = Acct.user
    ? `<div class="acctwho"><span class="acctdot" aria-hidden="true">${acctEsc(name[0].toUpperCase())}</span><span class="acctmail" title="${acctEsc(Acct.user.email)}">${acctEsc(name)}</span></div><div class="acctlinks"><button type="button" data-a="account">My profile</button>${isAdmin() ? '<button type="button" data-a="admin">Admin</button>' : ""}<button type="button" data-a="logout">Log out</button></div>`
    : `<div class="acctlinks out"><button type="button" class="acctprimary" data-a="signup">Create account</button><button type="button" data-a="login">Log in</button></div><p class="acctwhy">Free: save schools and track every deadline in one place.</p>`;
  el.querySelectorAll("button[data-a]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = b.dataset.a;
        if (a === "logout") acctLogout();
        else if (a === "account" || a === "admin") go(a);
        else openAcct(a);
      }),
  );
}

/* ---------- dialog ---------- */
function acctDialog() {
  let d = document.getElementById("acctdlg");
  if (!d) {
    document.body.insertAdjacentHTML("beforeend", '<dialog id="acctdlg" aria-labelledby="accttitle"><button type="button" class="acctx" aria-label="Close">✕</button><div class="acctbody"></div></dialog>');
    d = document.getElementById("acctdlg");
    d.querySelector(".acctx").onclick = () => d.close();
    d.addEventListener("click", (e) => e.target === d && d.close());
    window.addEventListener("hashchange", () => d.open && d.close());
  }
  return d;
}
const pwField = (id, label, auto) =>
  `<label class="acctf"><span>${label}</span><span class="pwwrap"><input id="${id}" type="password" autocomplete="${auto}" required minlength="8"><button type="button" class="pwshow" data-for="${id}">Show</button></span></label>`;
const VIEWS = {
  login: (why) => `<h2 id="accttitle">Log in</h2>${why ? `<p class="acctnote">${acctEsc(why)}</p>` : ""}
    <form data-f="login"><label class="acctf"><span>Email</span><input id="a_email" type="email" autocomplete="email" required></label>${pwField("a_pw", "Password", "current-password")}
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Log in</button></form>
    <p class="acctalt"><button type="button" data-go="forgot">Forgot your password?</button> · <button type="button" data-go="signup">Create an account</button></p>`,
  signup: (why) => `<h2 id="accttitle">Create your free account</h2><p class="acctnote">${why ? acctEsc(why) : "Save schools, get one deadline list for all of them, and apply to coach."}</p>
    <form data-f="signup"><label class="acctf"><span>Name</span><input id="a_name" type="text" autocomplete="name" maxlength="80" required></label><label class="acctf"><span>Email</span><input id="a_email" type="email" autocomplete="email" required></label>${pwField("a_pw", "Password (8+ characters)", "new-password")}
    <label class="acctcheck"><input id="a_terms" type="checkbox" required><span>I’m 16 or older and agree to the <a href="#terms" target="_blank" rel="noopener">Terms of Use</a> and <a href="#privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>
    <label class="acctcheck"><input id="a_mail" type="checkbox"><span>Email me deadline reminders and new guides. Optional; turn it off any time.</span></label>
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Create account</button></form>
    <p class="acctalt">Already have one? <button type="button" data-go="login">Log in</button></p>`,
  forgot: () => `<h2 id="accttitle">Reset your password</h2><p class="acctnote">We’ll email you a link. Open it on this device and browser.</p>
    <form data-f="forgot"><label class="acctf"><span>Email</span><input id="a_email" type="email" autocomplete="email" required></label>
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Send reset link</button></form>
    <p class="acctalt"><button type="button" data-go="login">Back to log in</button></p>`,
  password: (why) => `<h2 id="accttitle">${why === "reset" ? "Choose a new password" : "Change your password"}</h2>
    <form data-f="password">${pwField("a_pw", "New password (8+ characters)", "new-password")}${pwField("a_pw2", "Confirm new password", "new-password")}
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Save password</button></form>`,
  feedback: () => `<h2 id="accttitle">Send feedback</h2><p class="acctnote">Spotted something wrong, or have an idea? It goes straight to the team.</p>
    <form data-f="feedback"><label class="acctf"><span>What kind?</span><select id="a_kind"><option value="error">Something on the site is wrong</option><option value="data">I have data or a source to suggest</option><option value="idea">Feature idea</option><option value="other">Something else</option></select></label>
    <label class="acctf"><span>Message</span><textarea id="a_msg" rows="6" minlength="5" maxlength="4000" required></textarea></label>
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Send</button></form>`,
  verify: (email) => `<h2 id="accttitle">Check your email</h2><p class="acctnote">We sent an email to <b>${acctEsc(email)}</b>. Tap <b>Confirm my email</b> in it, or type the code here. Check spam if it isn’t there.</p>
    <form data-f="verify" data-email="${acctEsc(email)}"><label class="acctf"><span>Code from the email</span><input id="a_code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="12" required></label>
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Confirm</button></form>`,
  confirmlink: () => `<h2 id="accttitle">Confirm your email</h2><p class="acctnote">One more tap and your account is ready.</p>
    <form data-f="confirmlink"><p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">Confirm my email</button></form>`,
  msg: (t) => `<h2 id="accttitle">${t[0]}</h2><p class="acctnote">${t[1]}</p><button type="button" class="btn acctgo" data-close>OK</button>`,
};
function openAcct(view, arg) {
  if (!Acct.on) return alertOff();
  if ((view === "feedback" || view === "password") && !Acct.user && arg !== "reset") return openAcct("login", view === "feedback" ? "Log in to send feedback." : "");
  const d = acctDialog();
  d.querySelector(".acctbody").innerHTML = VIEWS[view](arg);
  d.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => openAcct(b.dataset.go)));
  d.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => d.close()));
  d.querySelectorAll(".pwshow").forEach(
    (b) =>
      (b.onclick = () => {
        const i = document.getElementById(b.dataset.for);
        i.type = i.type === "password" ? "text" : "password";
        b.textContent = i.type === "password" ? "Show" : "Hide";
      }),
  );
  const f = d.querySelector("form");
  if (f) f.onsubmit = (e) => (e.preventDefault(), submitAcct(f.dataset.f, f));
  if (!d.open) d.showModal();
  const first = d.querySelector("input:not([type=checkbox]),textarea,button.acctgo");
  if (first && !matchMedia("(pointer: coarse)").matches) first.focus({ preventScroll: true });
}
function alertOff() {
  const d = acctDialog();
  d.querySelector(".acctbody").innerHTML = VIEWS.msg(["Accounts aren’t available here", "Accounts work on projectuv.com."]);
  d.querySelector("[data-close]").onclick = () => d.close();
  d.showModal();
}
const ERRS = [
  [/invalid login credentials/i, "That email and password don’t match. Check both, or reset your password."],
  [/email not confirmed/i, "Confirm your email first: open the link we sent you. Check spam if it isn’t there."],
  [/otp_expired|token has expired|expired or is invalid|invalid.*(otp|token)|link is invalid/i, "That code or link has expired or was already used. Ask for a new email and use the newest one."],
  [/rate limit|too many|security purposes/i, "Too many tries. Wait a minute and try again."],
  [/password should be|weak/i, "Choose a stronger password: at least 8 characters, ideally a short phrase."],
  [/already registered|already exists/i, "There’s already an account with that email. Log in instead."],
  [/fetch|network/i, "Couldn’t reach the server. Check your connection and try again."],
];
const errText = (e) => (ERRS.find(([re]) => re.test((e && e.message) || "")) || [, (e && e.message) || "Something went wrong. Try again."])[1];
async function submitAcct(kind, f) {
  const err = f.querySelector(".accterr"), btn = f.querySelector(".acctgo"), v = (id) => (f.querySelector("#" + id) || {}).value || "";
  err.textContent = "";
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = "Working…";
  try {
    if (kind === "login") {
      const { error } = await Acct.sb.auth.signInWithPassword({ email: v("a_email").trim(), password: v("a_pw") });
      if (error) throw error;
      track("login");
      acctDialog().close();
    } else if (kind === "signup") {
      if (!document.getElementById("a_terms").checked) throw new Error("Please agree to the Terms of Use and Privacy Policy.");
      const email = v("a_email").trim();
      const { data, error } = await Acct.sb.auth.signUp({
        email,
        password: v("a_pw"),
        options: { emailRedirectTo: acctHome() + "?confirmed=1", data: { full_name: v("a_name").trim().slice(0, 80), email_ok: document.getElementById("a_mail").checked, terms_accepted_at: new Date().toISOString() } },
      });
      if (error) throw error;
      track("signup");
      if (data.session) acctDialog().close();
      else openAcct("verify", email);
    } else if (kind === "verify") {
      const token = v("a_code").replace(/\D/g, "");
      const { error } = await Acct.sb.auth.verifyOtp({ email: f.dataset.email, token, type: "signup" });
      if (error) throw error;
      acctDialog().close();
    } else if (kind === "confirmlink") {
      const q = new URLSearchParams(location.search);
      const { error } = await Acct.sb.auth.verifyOtp({ token_hash: q.get("token_hash"), type: q.get("type") || "signup" });
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
      if (error) return openAcct("msg", ["That link didn’t work", "It has expired or was already used. Try logging in: if your email is confirmed, you’re all set. If not, sign up again with the same email to get a new code."]);
      openAcct("msg", ["You’re in", "Your email is confirmed and you’re signed in. Save schools and track every deadline from your profile."]);
    } else if (kind === "forgot") {
      const { error } = await Acct.sb.auth.resetPasswordForEmail(v("a_email").trim(), { redirectTo: acctHome() + "?reset=1" });
      if (error) throw error;
      openAcct("msg", ["Check your email", "If there’s an account for that address, a reset link is on its way."]);
    } else if (kind === "password") {
      if (v("a_pw") !== v("a_pw2")) throw new Error("The two passwords don’t match.");
      const { error } = await Acct.sb.auth.updateUser({ password: v("a_pw") });
      if (error) throw error;
      openAcct("msg", ["Password saved", "Use your new password next time you log in."]);
    } else if (kind === "feedback") {
      const { error } = await Acct.sb.from("feedback").insert({ email: Acct.user.email, page: "#" + hashParts().filter(Boolean).join("/"), kind: v("a_kind"), message: v("a_msg").trim() });
      if (error) throw error;
      openAcct("msg", ["Thanks!", "Your feedback was sent."]);
    }
    if (kind === "verify") openAcct("msg", ["You’re in", "Your email is confirmed and you’re signed in."]);
  } catch (e) {
    err.textContent = errText(e);
    btn.disabled = false;
    btn.textContent = label;
  }
}
async function acctLogout() {
  await Acct.sb.auth.signOut();
  if (["account", "admin"].includes(hashParts()[0])) go("home");
}

/* ---------- Profile (#account) ---------- */
const ACC_TABS = () => [["overview", "Overview"], ["med-school", "Med schools"], ["news", "News"], ["notifications", "Notifications"], ["settings", "Settings"]].concat(Acct.profile && Acct.profile.role === "coach" ? [["coach", "Coach profile"]] : []);
PAGES.account = (slug) => {
  if (!Acct.on || !Acct.known) return ($("#main").innerHTML = `<h1>Your profile</h1><p class="note">Loading…</p>`);
  if (!Acct.user) {
    $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Profile</p><h1>Your profile</h1><p class="lede">Log in to save schools, track every deadline and keep your checklist in one place.</p><p class="uvacts"><button class="btn" data-a="signup">Create a free account</button> <button class="btn ghost" data-a="login">Log in</button></p>`;
    document.querySelectorAll("#main [data-a]").forEach((b) => (b.onclick = () => openAcct(b.dataset.a)));
    return;
  }
  if (!Acct.profile) return ($("#main").innerHTML = `<h1>Your profile</h1><p class="note">Loading…</p>`);
  const tabs = ACC_TABS(), tab = tabs.some((t) => t[0] === slug) ? slug : "overview";
  const P = Acct.profile, role = P.role || "student";
  const roleTag = { student: "Student", coach: "Coach", admin: "Admin" }[role];
  const since = P.created_at ? new Date(P.created_at).toLocaleDateString("en-CA", { month: "long", year: "numeric" }) : "";
  const nAlerts = accAlerts().filter((a) => a.hot).length;
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Profile</p>
  <div class="hubcard hubhead"><span class="hubavatar" aria-hidden="true">${acctEsc(((P.full_name || Acct.user.email)[0] || "?").toUpperCase())}</span><div class="hubwho">
    <div class="hubname"><span id="uvnameshow">${acctEsc(P.full_name || "Add your name")}</span><b class="hubtag uvrole">${roleTag}</b><button type="button" class="uvedit" data-editname aria-label="Edit your name">${pIco("pen")}Edit</button></div>
    <form class="hubuser" id="uvname" hidden><input id="uvnamein" maxlength="80" value="${acctEsc(P.full_name || "")}" placeholder="Your name" aria-label="Your name"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-cancelname>Cancel</button></form>
    <p class="hubmail">${acctEsc(Acct.user.email)}${since ? ` · Member since ${since}` : ""}</p></div>
    <div class="uvacts">${isAdmin() ? `<a class="btn" href="#admin">Open admin panel</a>` : ""}${coachStatusBtn()}</div></div>
  <div class="pathanchor"></div><div class="pathwrap"><div class="path" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${k === tab}" data-acctab="${k}">${t}${k === "notifications" && nAlerts ? ` <span class="uvbadge">${nAlerts}</span>` : ""}</button>`).join("")}</div></div>
  <div class="panel acctpanel">${ACC_PANELS[tab]()}</div>`;
  document.querySelectorAll("#main [data-acctab]").forEach((b) => (b.onclick = () => go("account/" + b.dataset.acctab)));
  const form = $("#uvname");
  $("[data-editname]").onclick = () => ((form.hidden = false), $("#uvnamein").focus());
  $("[data-cancelname]").onclick = () => (form.hidden = true);
  form.onsubmit = (e) => (e.preventDefault(), saveName($("#uvnamein").value));
  (ACC_WIRE[tab] || (() => {}))();
  accLoadExtras(tab);
};
const renderAccount = () => PAGES.account(hashParts()[1]);
async function saveName(v) {
  const n = String(v).trim().slice(0, 80);
  const { error } = await Acct.sb.from("profiles").update({ full_name: n || null }).eq("id", Acct.user.id);
  if (error) return alert("Couldn’t save your name: " + error.message);
  Acct.profile.full_name = n || null;
  acctBar();
  renderAccount();
  afterRender();
}

/* Feedback and news load once per visit to the profile, then fill their places on the current tab */
async function accLoadExtras(tab) {
  if (!Acct.extras || Date.now() - Acct.extras.t > 60000) {
    const [fb, news] = await Promise.all([
      Acct.sb.from("feedback").select("kind,message,status,reply,created_at").eq("user_id", Acct.user.id).order("created_at", { ascending: false }).limit(20),
      Acct.sb.from("news").select("id,created_at,school,title,body,url").eq("published", true).order("created_at", { ascending: false }).limit(60),
    ]);
    Acct.extras = { t: Date.now(), fb: fb.data || [], news: news.data || [] };
    if (hashParts()[0] === "account" && hashParts()[1] === tab) {
      const y = scrollY;
      renderAccount();
      afterRender();
      scrollTo(0, y);
    }
  }
}
const mySchools = () => (Acct.prefs.med && Acct.prefs.med.mine ? Object.keys(Acct.prefs.med.mine).filter((k) => Acct.prefs.med.mine[k].st !== "no") : []);

/* Everything worth telling this person, newest and most urgent first */
function accAlerts() {
  const out = [], now = medToday();
  if (typeof medState === "function") {
    const M = medState();
    medTimeline(M)
      .filter((e) => !e.when && !medPast(e) && ["due", "test", "int", "mine", "offer"].includes(e.k))
      .forEach((e) => {
        const days = Math.round((prepDay(e.d) - now) / 864e5);
        if (days <= 30) out.push({ hot: days <= 7, icon: "cal", t: `${e.t}${e.est ? " (expected)" : ""}`, s: `${e.who} · ${prepFmt(e.d, { weekday: "short", month: "short", day: "numeric" })} · ${days === 0 ? "today" : days === 1 ? "tomorrow" : "in " + days + " days"}`, href: "#account/med-school", d: e.d });
      });
  }
  const a = Acct.app;
  if (a && a.status !== "pending") out.push({ hot: a.status === "needs_info", icon: "check", t: { approved: "Your coach application was approved", rejected: "Your coach application wasn’t approved", needs_info: "We need more information for your coach application" }[a.status], s: a.reviewer_note || "", href: a.status === "approved" ? "#account/coach" : "#become-coach" });
  ((Acct.extras && Acct.extras.fb) || []).filter((f) => f.reply).forEach((f) => out.push({ icon: "chat", t: "Reply to your feedback", s: f.reply, href: "#account/settings" }));
  const mine = mySchools();
  ((Acct.extras && Acct.extras.news) || []).filter((n) => (!n.school || mine.includes(n.school)) && Date.now() - new Date(n.created_at) < 14 * 864e5).forEach((n) => out.push({ icon: "chat", t: n.title, s: (n.school ? (medSchool(n.school) || {}).short + " · " : "") + "News", href: "#account/news" }));
  if (typeof UV_NEWS !== "undefined") UV_NEWS.filter((n) => Date.now() - new Date(n.d + "T12:00:00") < 14 * 864e5 && (!mine.length || mine.some((id) => uvNewsFor(id).includes(n)))).forEach((n) => out.push({ icon: "chat", t: n.t, s: n.src + " · News", href: "#account/news" }));
  if (!mine.length) out.push({ icon: "users", t: "Pick the schools you’re applying to", s: "Your deadlines, interviews and offers will show up here.", href: "#account/med-school" });
  return out;
}
const alertList = (items) => (items.length ? `<ul class="uvalerts">${items.map((x) => `<li class="${x.hot ? "hot" : ""}"><a href="${x.href || "#account"}"><span class="uvaico">${pIco(x.icon)}</span><span><b>${acctEsc(x.t)}</b>${x.s ? `<small>${acctEsc(x.s)}</small>` : ""}</span></a></li>`).join("")}</ul>` : `<p class="note">Nothing new. You’re all caught up.</p>`);

/* News: posts from the team, plus what changed this cycle at your schools (from the school pages) */
function accNews(limit) {
  const mine = mySchools(), all = !mine.length;
  const posts = ((Acct.extras && Acct.extras.news) || []).filter((n) => all || !n.school || mine.includes(n.school)).map((n) => ({ when: n.created_at, school: n.school, t: n.title, body: n.body, url: n.url }));
  const changes = [];
  (all ? UV_SCHOOLS().map((s) => s.id) : mine).forEach((id) => (((typeof msx === "function" && msx(id).ch) || [])).forEach(([tag, txt]) => changes.push({ school: id, tag, t: txt })));
  if (typeof UV_NEWS !== "undefined") {
    const seen = new Set();
    (all ? UV_NEWS : mine.flatMap(uvNewsFor)).forEach((n) => { if (!seen.has(n)) seen.add(n), posts.push({ when: n.d + "T12:00:00", uv: n }); });
    posts.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  }
  const postHtml = posts.length ? uvNewsGrid(posts.slice(0, limit || 50).map((n) => n.uv || uvPost({ created_at: n.when, school: n.school, title: n.t, body: n.body, url: n.url })), true) : "";
  const chHtml = changes.slice(0, limit || 200).map((c) => `<li><span class="msct k-${(c.tag || "").toLowerCase()}">${acctEsc(c.tag || "")}</span><span><a href="#school-${c.school}/admissions">${acctEsc((medSchool(c.school) || { short: c.school }).short)}</a> · ${c.t}</span></li>`).join("");
  return { posts: postHtml, changes: chHtml ? `<ul class="msch uvchanges">${chHtml}</ul>` : "", all, nPosts: posts.length, nChanges: changes.length };
}

const ACC_PANELS = {
  overview() {
    const N = accNews(3), al = accAlerts();
    return `<div class="hubgrid">${typeof medCard === "function" ? medCard() : ""}
      <section class="hubcard"><h2>${pIco("cal")}Coming up</h2><p class="hubsub">Deadlines, replies and updates for you.</p>${alertList(al.slice(0, 4))}${al.length > 4 ? `<p><a href="#account/notifications">See all ${al.length} →</a></p>` : ""}</section>
      <section class="hubcard"><h2>${pIco("chat")}News</h2><p class="hubsub">${N.all ? "Across all schools. Save schools to see just yours." : "For the schools on your list."}</p>${N.posts || (N.changes ? `<p class="note">What changed this cycle:</p>${accNews(4).changes}` : `<p class="note">No news yet.</p>`)}<p><a href="#account/news">All news →</a></p></section>
      <section class="hubcard hubwide"><h2>${pIco("users")}Keep going</h2><div class="grid-cards uvquick"><a class="gc" href="#guides/timeline"><b>Your year, month by month</b><span>Every date this cycle.</span></a><a class="gc" href="#schools"><b>Compare schools</b><span>Seats, tests and deadlines side by side.</span></a><a class="gc" href="#guides/interviews"><b>Interview formats</b><span>Which school uses which.</span></a><a class="gc" href="#coaching"><b>Coaching</b><span>1-on-1 help from students who got in.</span></a></div></section></div>`;
  },
  "med-school"() {
    return `<div class="hubgrid">${medSchoolCards()}</div>`;
  },
  news() {
    const N = accNews();
    return `<div class="hubgrid"><section class="hubcard hubwide"><h2>${pIco("chat")}News for your schools</h2><p class="hubsub">${N.all ? "Showing every school. Save your schools on the Med schools tab to narrow this down." : "Showing news for " + mySchools().map((k) => acctEsc((medSchool(k) || {}).short || k)).join(", ") + ", plus news for everyone."}</p>${N.posts || `<p class="note">Nothing posted yet. School announcements and new guides will appear here.</p>`}</section>
      <section class="hubcard hubwide"><h2>${pIco("check")}What changed this cycle</h2><p class="hubsub">Changes to requirements and process at ${N.all ? "every school" : "your schools"}, from each school’s admissions pages.</p>${N.changes || `<p class="note">No changes listed for these schools.</p>`}</section></div>`;
  },
  notifications() {
    const al = accAlerts();
    return `<div class="hubgrid"><section class="hubcard hubwide"><h2>${pIco("cal")}Notifications</h2><p class="hubsub">Deadlines in the next 30 days at your schools, replies from us and news. Items due within a week are highlighted.</p>${alertList(al)}</section>
      <section class="hubcard"><h2>${pIco("chat")}Email</h2><p class="hubsub">What we send to ${acctEsc(Acct.user.email)}.</p>
        <label class="uvtoggle"><input type="checkbox" data-pref="newsletter" ${Acct.prefs.newsletter ? "checked" : ""}><span><b>Deadline reminders and new guides</b><small>A short email when a deadline at one of your schools is coming up or a new guide is out.</small></span></label>
        <label class="uvtoggle"><input type="checkbox" data-pref="coaching_waitlist" ${Acct.prefs.coaching_waitlist ? "checked" : ""}><span><b>Tell me when coaching opens</b><small>One email the day booking goes live.</small></span></label>
        <p class="hubmsg" role="status" id="uvprefmsg"></p></section>
      <section class="hubcard"><h2>${pIco("lock")}Account emails</h2><p class="hubsub">Always sent, because they keep your account safe.</p><ul class="b"><li>Confirming your email</li><li>Password resets</li><li>Changes to your email address</li></ul></section></div>`;
  },
  settings() {
    const fb = (Acct.extras && Acct.extras.fb) || [];
    const st = { new: "Received", reviewing: "Looking into it", fixed: "Fixed", wont_fix: "Closed" };
    return `<div class="hubgrid"><section class="hubcard"><h2>${pIco("pen")}Profile</h2><p class="hubsub">Shown on your profile and to coaches you book.</p>
        <form id="setname" class="uvform"><label class="acctf"><span>Name</span><input name="n" maxlength="80" value="${acctEsc(Acct.profile.full_name || "")}"></label><div class="uvacts"><button class="btn" type="submit">Save name</button></div></form>
        <p class="acctf"><span>Email</span>${acctEsc(Acct.user.email)}</p></section>
      <section class="hubcard"><h2>${pIco("lock")}Sign-in</h2><p class="hubsub">Password and sessions.</p><div class="uvacts"><button class="btn ghost" data-a="password">Change password</button><button class="btn ghost" data-signout>Log out</button></div>
        <p class="note">Last signed in ${Acct.user.last_sign_in_at ? new Date(Acct.user.last_sign_in_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "just now"}.</p></section>
      <section class="hubcard"><h2>${pIco("chat")}Feedback</h2><p class="hubsub">Spotted something wrong, or have an idea?</p><div class="uvacts"><button class="btn ghost" data-a="feedback">Send feedback</button></div>
        ${fb.length ? `<h3 class="uvsub">What you’ve sent</h3><ul class="uvfb">${fb.map((f) => `<li><span class="hubtag${f.status === "fixed" ? " good" : ""}">${st[f.status] || f.status}</span> ${acctEsc(f.message.length > 90 ? f.message.slice(0, 89) + "…" : f.message)}${f.reply ? `<small>Reply: ${acctEsc(f.reply)}</small>` : ""}</li>`).join("")}</ul>` : ""}</section>
      <section class="hubcard"><h2>${pIco("x")}Your data</h2><p class="hubsub">Everything you’ve saved lives in your account. Deleting it removes your profile, schools, checklist and settings for good.</p><p class="uvdanger"><button class="linkbtn danger" data-del>Delete my account</button></p></section></div>`;
  },
  coach() {
    return `<div class="hubgrid">${coachCard()}</div>`;
  },
};
const ACC_WIRE = {
  "med-school": () => wireMed(),
  overview: () => {},
  notifications: () =>
    document.querySelectorAll("#main [data-pref]").forEach(
      (c) =>
        (c.onchange = async () => {
          const msg = $("#uvprefmsg"), k = c.dataset.pref;
          const { error } = await Acct.sb.from("user_prefs").update({ [k]: c.checked }).eq("user_id", Acct.user.id);
          msg.className = "hubmsg" + (error ? " err" : "");
          msg.textContent = error ? "Couldn’t save. Try again." : "Saved.";
          if (error) c.checked = !c.checked;
          else {
            Acct.prefs[k] = c.checked;
            if (k === "coaching_waitlist" && c.checked) track("waitlist", "account");
          }
        }),
    ),
  settings: () => {
    $("#setname").onsubmit = (e) => (e.preventDefault(), saveName(e.target.n.value));
    document.querySelectorAll("#main .acctpanel [data-a]").forEach((b) => (b.onclick = () => openAcct(b.dataset.a)));
    $("[data-signout]").onclick = acctLogout;
    $("[data-del]").onclick = async () => {
      if (!confirm("Delete your account and everything saved in it? This can’t be undone.")) return;
      const { error } = await Acct.sb.rpc("delete_my_account");
      if (error) return alert("Couldn’t delete your account: " + error.message);
      await Acct.sb.auth.signOut();
      go("home");
    };
  },
  coach: () => wireCoachCard(),
};
function coachStatusBtn() {
  const a = Acct.app;
  if (Acct.profile && Acct.profile.role !== "student") return "";
  if (!a) return "";
  const t = { pending: "Coach application: under review", needs_info: "Coach application: more info needed", rejected: "Coach application: not approved", approved: "Coach application: approved" }[a.status];
  return `<a class="hubtag" href="#become-coach">${t}</a>`;
}

/* ---------- Coach profile (approved coaches, on the profile page) ---------- */
function coachCard() {
  const c = Acct.coach;
  if (!c) return `<section class="hubcard hubwide"><h2>${pIco("check")}Your coach profile</h2><p class="note">Couldn’t load your coach profile. Refresh the page, or send feedback if it keeps happening.</p></section>`;
  const has = (arr, k) => (arr || []).includes(k);
  return `<section class="hubcard hubwide uvcoachcard"><h2>${pIco("check")}Your coach profile</h2>
    <p class="hubsub">${c.visible ? `<span class="hubtag good">Live</span> Students can see you on the coaching page and on your schools’ pages.` : `<span class="hubtag">Not live yet</span> Your profile goes live once booking and payouts are set up. You can get it ready now.`}</p>
    <form id="coachprof" class="uvform">
      <div class="uvrow"><label class="acctf"><span>Name shown to students</span><input name="display_name" required minlength="2" maxlength="80" value="${acctEsc(c.display_name)}"></label>
      <label class="acctf"><span>Headline</span><input name="headline" maxlength="120" value="${acctEsc(c.headline || "")}" placeholder="e.g. MS2 at Western · panel interview prep"></label></div>
      <label class="acctf"><span>Bio</span><textarea name="bio" rows="4" maxlength="1500">${acctEsc(c.bio || "")}</textarea></label>
      <fieldset class="acctf"><legend>Schools you coach for</legend><div class="uvchecks">${UV_SCHOOLS().map((s) => `<label><input type="checkbox" name="schools" value="${s.id}" ${has(c.schools, s.id) ? "checked" : ""}> ${acctEsc(s.short)}</label>`).join("")}</div></fieldset>
      <fieldset class="acctf"><legend>What you help with</legend><div class="uvchecks">${COACH_SERVICES.map(([k, t]) => `<label><input type="checkbox" name="services" value="${k}" ${has(c.services, k) ? "checked" : ""}> ${t}</label>`).join("")}</div></fieldset>
      <div class="uvacts"><button class="btn" type="submit">Save coach profile</button><span class="hubmsg" role="status"></span></div>
    </form>
    <p class="note">Coming next for coaches: prices, weekly availability, bookings and payouts.</p></section>`;
}
function wireCoachCard() {
  const f = $("#coachprof");
  if (!f) return;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f), msg = f.querySelector(".hubmsg");
    const row = { display_name: String(fd.get("display_name")).trim(), headline: String(fd.get("headline")).trim() || null, bio: String(fd.get("bio")).trim() || null, schools: fd.getAll("schools"), services: fd.getAll("services") };
    if (!row.schools.length) return (msg.className = "hubmsg err"), (msg.textContent = "Pick at least one school.");
    const { data, error } = await Acct.sb.from("coaches").update(row).eq("user_id", Acct.user.id).select().single();
    msg.className = "hubmsg" + (error ? " err" : "");
    msg.textContent = error ? "Couldn’t save: " + error.message : "Saved.";
    if (!error) Acct.coach = data;
  };
}

/* ---------- Coach application (#become-coach) ---------- */
const COACH_SERVICES = [["strategy", "General strategy"], ["interviews", "Interviews (MMI / panel)"], ["writing", "Essays and sketch"], ["review", "Full application review"]];
PAGES["become-coach"] = () => {
  const intro = `<p class="crumb"><a href="#home">Home</a> / <a href="#coaching">Coaching</a> / Become a coach</p><h1>Become a coach</h1>
  <p class="lede">Help applicants get into your school. You set your availability; we handle bookings and payments.</p>
  <ol class="uvsteps"><li><b>Apply</b> with your school, year and how you got in.</li><li><b>We review</b> every application by hand, usually within a week.</li><li><b>Set up</b> your profile, prices, availability and payouts.</li><li><b>Go live</b> on your school’s page.</li></ol>`;
  if (!Acct.on || !Acct.known) return ($("#main").innerHTML = intro + `<p class="note">Loading…</p>`);
  if (!Acct.user) {
    $("#main").innerHTML = intro + `<p><button class="btn" data-a="signup">Create an account to apply</button> <button class="btn ghost" data-a="login">Log in</button></p>`;
    document.querySelectorAll("#main [data-a]").forEach((b) => (b.onclick = () => openAcct(b.dataset.a, b.dataset.a === "signup" ? "Create a free account, then fill in the coach application." : "")));
    return;
  }
  const a = Acct.app;
  if (Acct.profile.role === "coach") return ($("#main").innerHTML = intro + `<section class="box good"><h2>You’re an approved coach</h2><p>Set up your coach profile from <a href="#account">your profile page</a>. Prices, availability and payouts come next; we’ll email you when they’re ready.</p></section>`);
  if (a && a.status === "pending") return ($("#main").innerHTML = intro + `<section class="box"><h2>Application received</h2><p>Thanks, ${acctEsc(a.full_name)}. We’re reviewing it and will email you at ${acctEsc(Acct.user.email)}.</p><p class="note">Submitted ${new Date(a.created_at).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}.</p></section>`);
  const banner =
    a && a.status === "needs_info"
      ? `<section class="box"><h2>We need a bit more information</h2><p>${acctEsc(a.reviewer_note || "Please update your application below.")}</p></section>`
      : a && a.status === "rejected"
        ? `<section class="box bad"><h2>Your last application wasn’t approved</h2>${a.reviewer_note ? `<p>${acctEsc(a.reviewer_note)}</p>` : ""}<p>You’re welcome to apply again.</p></section>`
        : "";
  const v = a && a.status === "needs_info" ? a : {};
  const has = (arr, k) => (arr || []).includes(k);
  $("#main").innerHTML = intro + banner + `<form id="coachform" class="hubcard uvform">
    <h2>Your application</h2>
    <label class="acctf"><span>Full name</span><input name="full_name" required maxlength="80" value="${acctEsc(v.full_name || (Acct.profile && Acct.profile.full_name) || "")}"></label>
    <div class="uvrow"><label class="acctf"><span>Your medical school</span><select name="med_school" required><option value="">Choose…</option>${UV_SCHOOLS().map((s) => `<option ${v.med_school === s.name ? "selected" : ""}>${acctEsc(s.name)}</option>`).join("")}<option ${v.med_school === "Other" ? "selected" : ""}>Other</option></select></label>
    <label class="acctf"><span>Year or level</span><select name="training_level" required>${["", "Incoming MS1", "MS1", "MS2", "MS3", "MS4", "Resident", "Physician"].map((t) => `<option value="${t}" ${v.training_level === t ? "selected" : ""}>${t || "Choose…"}</option>`).join("")}</select></label></div>
    <fieldset class="acctf"><legend>Schools you can coach for</legend><div class="uvchecks">${UV_SCHOOLS().map((s) => `<label><input type="checkbox" name="schools" value="${s.id}" ${has(v.schools_coached, s.id) ? "checked" : ""}> ${acctEsc(s.short)}</label>`).join("")}</div></fieldset>
    <fieldset class="acctf"><legend>What you can help with</legend><div class="uvchecks">${COACH_SERVICES.map(([k, t]) => `<label><input type="checkbox" name="services" value="${k}" ${has(v.services, k) ? "checked" : ""}> ${t}</label>`).join("")}</div></fieldset>
    <label class="acctf"><span>Your admissions story</span><textarea name="admissions_story" rows="5" minlength="20" maxlength="3000" required placeholder="Where you applied, where you interviewed, where you got in, and what you learned.">${acctEsc(v.admissions_story || "")}</textarea></label>
    <label class="acctf"><span>Short bio for your public profile</span><textarea name="bio" rows="4" minlength="20" maxlength="1500" required>${acctEsc(v.bio || "")}</textarea></label>
    <fieldset class="acctf"><legend>Conflict of interest</legend><p class="note">Do you currently sit on an admissions committee, review files, or interview applicants for any medical school?</p>
      <div class="uvchecks"><label><input type="radio" name="conflict" value="no" ${v.conflict_role === false || v.conflict_role == null ? "checked" : ""}> No</label><label><input type="radio" name="conflict" value="yes" ${v.conflict_role ? "checked" : ""}> Yes</label></div>
      <textarea name="conflict_details" rows="2" maxlength="1000" placeholder="If yes, which school and role?">${acctEsc(v.conflict_details || "")}</textarea></fieldset>
    <label class="acctf"><span>Proof of enrolment (PDF, PNG or JPG, up to 5 MB)</span><input type="file" name="proof" accept="application/pdf,image/png,image/jpeg"${v.proof_path ? "" : " required"}>${v.proof_path ? `<small class="note">Already uploaded. Add a new file only to replace it.</small>` : ""}</label>
    <label class="acctcheck"><input type="checkbox" name="agree" required><span>The information above is true, and I agree to the coach terms (shared with approved coaches before they go live).</span></label>
    <p class="accterr" role="alert"></p><button class="btn acctgo" type="submit">${a && a.status === "needs_info" ? "Send updated application" : "Submit application"}</button></form>`;
  $("#coachform").onsubmit = submitCoachApp;
};
async function submitCoachApp(e) {
  e.preventDefault();
  const f = e.target, err = f.querySelector(".accterr"), btn = f.querySelector(".acctgo");
  const fd = new FormData(f), all = (n) => fd.getAll(n);
  err.textContent = "";
  if (!all("schools").length) return (err.textContent = "Pick at least one school you can coach for.");
  if (!all("services").length) return (err.textContent = "Pick at least one thing you can help with.");
  const conflict = fd.get("conflict") === "yes";
  if (conflict && !String(fd.get("conflict_details")).trim()) return (err.textContent = "Tell us which school and role.");
  btn.disabled = true;
  btn.textContent = "Sending…";
  try {
    let proof_path = Acct.app && Acct.app.status === "needs_info" ? Acct.app.proof_path : null;
    const file = fd.get("proof");
    if (file && file.size) {
      if (file.size > 5 * 1024 * 1024) throw new Error("That file is over 5 MB.");
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z]/g, "");
      proof_path = `${Acct.user.id}/proof-${Date.now()}.${ext}`;
      const up = await Acct.sb.storage.from("coach-docs").upload(proof_path, file, { contentType: file.type });
      if (up.error) throw up.error;
    }
    const row = {
      full_name: String(fd.get("full_name")).trim(),
      med_school: fd.get("med_school"),
      training_level: fd.get("training_level"),
      schools_coached: all("schools"),
      services: all("services"),
      admissions_story: String(fd.get("admissions_story")).trim(),
      bio: String(fd.get("bio")).trim(),
      conflict_role: conflict,
      conflict_details: conflict ? String(fd.get("conflict_details")).trim() : null,
      proof_path,
    };
    const res =
      Acct.app && Acct.app.status === "needs_info"
        ? await Acct.sb.from("coach_applications").update(Object.assign(row, { status: "pending" })).eq("id", Acct.app.id).select().single()
        : await Acct.sb.from("coach_applications").insert(Object.assign(row, { agreed_terms: true })).select().single();
    if (res.error) throw res.error;
    Acct.app = res.data;
    track("coach_apply");
    PAGES["become-coach"]();
    afterRender();
    window.scrollTo(0, 0);
  } catch (x) {
    err.textContent = /one_open|duplicate/.test(x.message || "") ? "You already have an application under review." : x.message || "Couldn’t send. Try again.";
    btn.disabled = false;
    btn.textContent = "Submit application";
  }
}

/* ---------- start ---------- */
function acctInit() {
  if (!window.supabase || /__SUPABASE/.test(ACCT_CFG.url)) {
    acctBar();
    return;
  }
  Acct.sb = window.supabase.createClient(ACCT_CFG.url, ACCT_CFG.key, { auth: { persistSession: true, detectSessionInUrl: true } });
  Acct.on = true;
  const qs = new URLSearchParams(location.search);
  Acct.sb.auth.onAuthStateChange((ev, session) => {
    const was = Acct.user && Acct.user.id;
    Acct.user = session ? session.user : null;
    Acct.known = true;
    if (ev === "PASSWORD_RECOVERY" || (qs.get("reset") && session)) setTimeout(() => openAcct("password", "reset"), 50);
    if (Acct.user && Acct.user.id !== was) setTimeout(acctPull, 0);
    else if (!Acct.user) {
      Acct.profile = null;
      Acct.prefs = {};
      Acct.app = null;
      Acct.coach = null;
      Acct.extras = null;
      setTimeout(refreshAll, 0);
    }
  });
  trackInit();
  if (qs.get("confirmed")) history.replaceState(null, "", location.pathname + location.hash);
  // Links from our emails: ?token_hash=…&type=signup asks for one tap (so email scanners can't use the link up)
  const urlErr = qs.get("error_description") || new URLSearchParams(location.hash.slice(1)).get("error_description");
  Acct.sb.auth.getSession().then(({ data }) => {
    if (qs.get("token_hash")) {
      if (data.session) {
        history.replaceState(null, "", location.pathname + location.hash);
        openAcct("msg", ["You’re signed in", "Your email is already confirmed."]);
      } else openAcct("confirmlink");
    } else if (urlErr) {
      history.replaceState(null, "", location.pathname);
      openAcct("msg", ["That link didn’t work", acctEsc(urlErr.replace(/\+/g, " ")) + ". Links expire after an hour and work once; ask for a new one if you need to."]);
    }
  });
  acctBar();
}
