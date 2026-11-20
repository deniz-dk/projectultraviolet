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
PAGES.account = (slug) => {
  if (!Acct.on || !Acct.known) return ($("#main").innerHTML = `<h1>Your profile</h1><p class="note">Loading…</p>`);
  if (!Acct.user) {
    $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Profile</p><h1>Your profile</h1><p class="lede">Log in to save schools, track every deadline and keep your checklist in one place.</p><p class="uvacts"><button class="btn" data-a="signup">Create a free account</button> <button class="btn ghost" data-a="login">Log in</button></p>`;
    document.querySelectorAll("#main [data-a]").forEach((b) => (b.onclick = () => openAcct(b.dataset.a)));
    return;
  }
  const P = Acct.profile || {}, role = P.role || "student";
  const roleTag = { student: "Student", coach: "Coach", admin: "Admin" }[role];
  const since = P.created_at ? new Date(P.created_at).toLocaleDateString("en-CA", { month: "long", year: "numeric" }) : "";
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Profile</p>
  <div class="hubcard hubhead"><span class="hubavatar" aria-hidden="true">${acctEsc(((P.full_name || Acct.user.email)[0] || "?").toUpperCase())}</span><div class="hubwho">
    <div class="hubname"><span id="uvnameshow">${acctEsc(P.full_name || "Add your name")}</span><b class="hubtag uvrole">${roleTag}</b><button type="button" class="uvedit" data-editname aria-label="Edit your name">${pIco("pen")}Edit</button></div>
    <form class="hubuser" id="uvname" hidden><input id="uvnamein" maxlength="80" value="${acctEsc(P.full_name || "")}" placeholder="Your name" aria-label="Your name"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-cancelname>Cancel</button></form>
    <p class="hubmail">${acctEsc(Acct.user.email)}${since ? ` · Member since ${since}` : ""}</p></div>
    <div class="uvacts">${isAdmin() ? `<a class="btn" href="#admin">Open admin panel</a>` : ""}${coachStatusBtn()}</div></div>
  <div class="hubgrid">${medSchoolCards()}</div>
  <div class="hubgrid">${role === "coach" ? coachCard() : ""}
    <section class="hubcard"><h2>${pIco("cal")}Email</h2><p class="hubsub">What we send to ${acctEsc(Acct.user.email)}.</p>
      <label class="uvtoggle"><input type="checkbox" data-pref="newsletter" ${Acct.prefs.newsletter ? "checked" : ""}><span><b>Deadline reminders and new guides</b><small>A short email when a deadline is coming up or a new guide is out.</small></span></label>
      <label class="uvtoggle"><input type="checkbox" data-pref="coaching_waitlist" ${Acct.prefs.coaching_waitlist ? "checked" : ""}><span><b>Tell me when coaching opens</b><small>One email the day booking goes live.</small></span></label>
      <p class="hubmsg" role="status" id="uvprefmsg"></p></section>
    <section class="hubcard"><h2>${pIco("lock")}Account</h2><p class="hubsub">Password, feedback and your data.</p><div class="uvacts"><button class="btn ghost" data-a="password">Change password</button><button class="btn ghost" data-a="feedback">Send feedback</button></div><div id="uvmyfb"></div><p class="uvdanger"><button class="linkbtn danger" data-del>Delete my account</button></p></section></div>`;
  loadMyFeedback();
  wireMed();
  const form = $("#uvname"), show = () => ((form.hidden = false), $("#uvnamein").focus());
  $("[data-editname]").onclick = show;
  $("[data-cancelname]").onclick = () => (form.hidden = true);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const n = $("#uvnamein").value.trim().slice(0, 80);
    const { error } = await Acct.sb.from("profiles").update({ full_name: n || null }).eq("id", Acct.user.id);
    if (error) return alert("Couldn’t save your name: " + error.message);
    Acct.profile.full_name = n || null;
    acctBar();
    renderAccount();
    afterRender();
  };
  document.querySelectorAll("#main [data-pref]").forEach(
    (c) =>
      (c.onchange = async () => {
        const msg = $("#uvprefmsg"), k = c.dataset.pref;
        const { error } = await Acct.sb.from("user_prefs").update({ [k]: c.checked }).eq("user_id", Acct.user.id);
        msg.className = "hubmsg" + (error ? " err" : "");
        msg.textContent = error ? "Couldn’t save. Try again." : "Saved.";
        if (error) c.checked = !c.checked;
        else Acct.prefs[k] = c.checked;
      }),
  );
  wireCoachCard();
  document.querySelectorAll("#main [data-a]").forEach((b) => (b.onclick = () => openAcct(b.dataset.a)));
  $("[data-del]").onclick = async () => {
    if (!confirm("Delete your account and everything saved in it? This can’t be undone.")) return;
    const { error } = await Acct.sb.rpc("delete_my_account");
    if (error) return alert("Couldn’t delete your account: " + error.message);
    await Acct.sb.auth.signOut();
    go("home");
  };
};
const renderAccount = () => PAGES.account(hashParts()[1]);
async function loadMyFeedback() {
  const { data } = await Acct.sb.from("feedback").select("kind,message,status,reply,created_at").eq("user_id", Acct.user.id).order("created_at", { ascending: false }).limit(10);
  const el = $("#uvmyfb");
  if (!el || !data || !data.length) return;
  const st = { new: "Received", reviewing: "Looking into it", fixed: "Fixed", wont_fix: "Closed" };
  el.innerHTML = `<h3 class="uvsub">Your feedback</h3><ul class="uvfb">${data.map((f) => `<li><span class="hubtag${f.status === "fixed" ? " good" : ""}">${st[f.status] || f.status}</span> ${acctEsc(f.message.length > 90 ? f.message.slice(0, 89) + "…" : f.message)}${f.reply ? `<small>Reply: ${acctEsc(f.reply)}</small>` : ""}</li>`).join("")}</ul>`;
}
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
    PAGES["become-coach"]();
    afterRender();
    window.scrollTo(0, 0);
  } catch (x) {
    err.textContent = /one_open|duplicate/.test(x.message || "") ? "You already have an application under review." : x.message || "Couldn’t send. Try again.";
    btn.disabled = false;
    btn.textContent = "Submit application";
  }
}

/* ---------- Admin panel (#admin) ---------- */
let ADM_FILTER = "pending";
let ADM_FB = "new";
PAGES.admin = async () => {
  if (!Acct.known) return ($("#main").innerHTML = `<h1>Admin</h1><p class="note">Loading…</p>`);
  if (!isAdmin()) return ($("#main").innerHTML = `<h1>Admin</h1><p class="lede">This page is only for site administrators.</p>`);
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Admin</p><h1>Admin</h1>
  <div class="statrow topstats" id="admstats"><div class="stat"><b>…</b><span>Loading</span></div></div>
  <h2>Coach applications</h2>
  <div class="chips uvchips" role="group" aria-label="Filter">${[["pending", "Waiting for you"], ["needs_info", "Asked for info"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${ADM_FILTER === k}">${t}</button>`).join("")}</div>
  <div id="admapps"><p class="note">Loading…</p></div>
  <h2>Coaches</h2><p class="note">Approved coaches stay hidden until you show them, once their profile and payouts are set up.</p><div id="admcoaches"><p class="note">Loading…</p></div>
  <h2>Feedback</h2><div class="chips uvchips" role="group" aria-label="Feedback filter">${[["new", "New"], ["reviewing", "Reviewing"], ["fixed", "Fixed"], ["wont_fix", "Won’t fix"]].map(([k, t]) => `<button class="chip" data-fb="${k}" aria-pressed="${ADM_FB === k}">${t}</button>`).join("")}</div><div id="admfb"><p class="note">Loading…</p></div>`;
  document.querySelectorAll("#main [data-fb]").forEach((c) => (c.onclick = () => ((ADM_FB = c.dataset.fb), PAGES.admin())));
  document.querySelectorAll("#main .uvchips .chip").forEach((c) => (c.onclick = () => ((ADM_FILTER = c.dataset.f), PAGES.admin())));
  const [apps, coaches, stats, fb] = await Promise.all([
    Acct.sb.from("coach_applications").select("*").eq("status", ADM_FILTER).order("created_at", { ascending: ADM_FILTER === "pending" }),
    Acct.sb.from("coaches").select("*").order("created_at"),
    Acct.sb.rpc("admin_stats"),
    Acct.sb.from("feedback").select("*").eq("status", ADM_FB).order("created_at", { ascending: false }).limit(100),
  ]);
  if (hashParts()[0] !== "admin") return;
  const S = stats.data || {};
  $("#admstats").innerHTML = stats.error
    ? `<p class="accterr">${acctEsc(stats.error.message)}</p>`
    : [["accounts", "Accounts"], ["new_this_week", "New this week"], ["pending_apps", "Applications waiting"], ["coaches", "Coaches"], ["waitlist", "Coaching waitlist"], ["feedback_new", "New feedback"]].map(([k, l]) => `<div class="stat"><b>${S[k] ?? 0}</b><span>${l}</span></div>`).join("");
  const FB_KIND = { error: "Something’s wrong", data: "Data or source", idea: "Idea", other: "Other" };
  $("#admfb").innerHTML = fb.error
    ? `<p class="accterr">${acctEsc(fb.error.message)}</p>`
    : !fb.data.length
      ? `<p class="note">Nothing here.</p>`
      : fb.data
          .map(
            (f) => `<article class="hubcard uvapp" data-fid="${f.id}"><div class="uvapphead"><div><b>${acctEsc(FB_KIND[f.kind] || f.kind)}</b>${f.page ? ` · <span class="note">${acctEsc(f.page)}</span>` : ""}</div><small class="note">${acctEsc(f.email || "deleted account")} · ${new Date(f.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</small></div>
      <p>${acctEsc(f.message)}</p>${f.reply ? `<p class="note">Your reply: ${acctEsc(f.reply)}</p>` : ""}
      <label class="acctf"><span>Reply (the sender sees it with their report)</span><textarea rows="2" maxlength="2000" class="fbreply"></textarea></label>
      <div class="uvacts">${[["reviewing", "Reviewing"], ["fixed", "Fixed"], ["wont_fix", "Won’t fix"]].filter(([k]) => k !== f.status).map(([k, t]) => `<button class="btn ghost" data-fs="${k}">Mark ${t.toLowerCase()}</button>`).join("")}</div></article>`,
          )
          .join("");
  document.querySelectorAll("#admfb [data-fs]").forEach(
    (b) =>
      (b.onclick = async () => {
        const card = b.closest("[data-fid]"), reply = card.querySelector(".fbreply").value.trim();
        const { error } = await Acct.sb.rpc("admin_update_feedback", { fid: +card.dataset.fid, new_status: b.dataset.fs, new_reply: reply || null });
        if (error) return alert(error.message);
        PAGES.admin();
      }),
  );
  const sname = (k) => acctEsc((medSchool(k) || { short: k }).short);
  $("#admapps").innerHTML = apps.error
    ? `<p class="accterr">${acctEsc(apps.error.message)}</p>`
    : !apps.data.length
      ? `<p class="note">Nothing here.</p>`
      : apps.data
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
  document.querySelectorAll("#admapps [data-proof]").forEach(
    (b) =>
      (b.onclick = async () => {
        const { data, error } = await Acct.sb.storage.from("coach-docs").createSignedUrl(b.dataset.proof, 300);
        if (error) return alert(error.message);
        window.open(data.signedUrl, "_blank", "noopener");
      }),
  );
  document.querySelectorAll("#admapps [data-d]").forEach(
    (b) =>
      (b.onclick = async () => {
        const card = b.closest(".uvapp"), note = card.querySelector(".admnote").value.trim(), msg = card.querySelector(".hubmsg");
        if (b.dataset.d === "needs_info" && !note) return (msg.className = "hubmsg err"), (msg.textContent = "Add a note saying what you need.");
        if (b.dataset.d === "rejected" && !confirm("Reject this application?")) return;
        card.querySelectorAll("button").forEach((x) => (x.disabled = true));
        const { error } = await Acct.sb.rpc("review_coach_application", { app_id: +card.dataset.id, decision: b.dataset.d, note: note || null });
        if (error) {
          msg.className = "hubmsg err";
          msg.textContent = error.message;
          card.querySelectorAll("button").forEach((x) => (x.disabled = false));
          return;
        }
        PAGES.admin();
      }),
  );
  $("#admcoaches").innerHTML = coaches.error
    ? `<p class="accterr">${acctEsc(coaches.error.message)}</p>`
    : !coaches.data.length
      ? `<p class="note">No coaches yet.</p>`
      : `<div class="tw"><table class="uvtable"><thead><tr><th>Coach</th><th>Schools</th><th>On the site</th><th></th></tr></thead><tbody>${coaches.data.map((c) => `<tr><td>${acctEsc(c.display_name)}</td><td>${c.schools.map(sname).join(", ")}</td><td>${c.visible ? "Shown" : "Hidden"}</td><td><button class="btn ghost" data-vis="${c.user_id}" data-show="${!c.visible}">${c.visible ? "Hide" : "Show"}</button></td></tr>`).join("")}</tbody></table></div>`;
  document.querySelectorAll("#admcoaches [data-vis]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        const { error } = await Acct.sb.rpc("set_coach_visible", { coach: b.dataset.vis, show: b.dataset.show === "true" });
        if (error) return alert(error.message);
        PAGES.admin();
      }),
  );
};

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
      setTimeout(refreshAll, 0);
    }
  });
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
