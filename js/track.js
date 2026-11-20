/* ============================================================
   ANONYMOUS ANALYTICS: page views and a few actions, written to public.events.
   No names, emails or IP addresses: a random visitor id kept in this browser,
   a random id per visit, the page, where the visit came from, device size,
   time zone and language. Skipped for admins (so your own visits don't count),
   for Do Not Track, and anywhere accounts aren't connected (the preview).
   ============================================================ */
const Track = { on: false, vid: "", sid: "", ref: "", errs: 0, last: "" };
const trRand = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 24);
function trackInit() {
  if (!Acct.sb || navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return; // local testing isn't real traffic
  try {
    Track.vid = localStorage.getItem("uv-vid") || trRand();
    localStorage.setItem("uv-vid", Track.vid);
    Track.sid = sessionStorage.getItem("uv-sid") || trRand();
    sessionStorage.setItem("uv-sid", Track.sid);
    // Where this visit came from: the referring site, or a ?utm_source= tag. Kept for the whole visit.
    Track.ref = sessionStorage.getItem("uv-ref");
    if (Track.ref == null) {
      const q = new URLSearchParams(location.search);
      let r = q.get("utm_source") || "";
      if (!r && document.referrer) {
        try {
          const h = new URL(document.referrer).hostname.replace(/^www\./, "");
          if (h !== location.hostname.replace(/^www\./, "")) r = h;
        } catch (e) {}
      }
      Track.ref = r.slice(0, 200);
      sessionStorage.setItem("uv-ref", Track.ref);
    }
  } catch (e) {
    return; // storage blocked: don't track
  }
  Track.on = true;
  window.addEventListener("error", (e) => {
    if (Track.errs++ < 5) track("error", ((e.message || "error") + (e.filename ? " @ " + e.filename.split("/").pop() + ":" + e.lineno : "")).slice(0, 300));
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="http"]');
    if (a && !a.href.includes(location.hostname)) {
      try { track("outbound", new URL(a.href).hostname.replace(/^www\./, "") + new URL(a.href).pathname.slice(0, 60)); } catch (x) {}
    }
  });
}
function track(kind, detail) {
  if (!Track.on || (Acct.profile && Acct.profile.role === "admin")) return;
  const path = hashParts().filter(Boolean).join("/").slice(0, 200);
  if (kind === "view") {
    if (path === Track.last) return; // re-renders of the same page aren't new views
    Track.last = path;
  }
  const w = window.innerWidth;
  const row = {
    visitor: Track.vid, session: Track.sid, kind, path, ref: Track.ref || null,
    device: w < 640 ? "phone" : w < 1024 ? "tablet" : "desktop",
    tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || "").slice(0, 60) || null,
    lang: (navigator.language || "").slice(0, 20) || null,
    detail: detail ? String(detail).slice(0, 300) : null,
    signed_in: !!Acct.user,
  };
  // Wait until we know whether this is an admin, so your own visits are never counted
  const send = () => !(Acct.profile && Acct.profile.role === "admin") && Acct.sb.from("events").insert(row).then(() => {}, () => {});
  if (Acct.known && (!Acct.user || Acct.profile)) send();
  else setTimeout(send, 2500);
}
let trSearchT = null;
function trackSearch(q) {
  clearTimeout(trSearchT);
  q = (q || "").trim();
  if (q.length < 2) return;
  trSearchT = setTimeout(() => track("search", q.toLowerCase()), 1500);
}
