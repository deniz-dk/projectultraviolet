// Project UltraViolet: The Sunday newsletter (Supabase Edge Function "uv-newsletter").
// - POST from the Sunday 8 a.m. schedule (header x-cron-key = app_secrets.cron_key): sends this week's issue
//   to every member with the newsletter switched on and a confirmed email, filtered by the topics they picked
//   and the schools they saved. The issue is newsletter/<Sunday>.json on the live site, written by the Saturday sweep.
// - POST {"preview_to":"you@example.com"} with the same header: sends that one address this week's issue (not logged).
// - GET ?u=<email_token>: one-click unsubscribe. GET ?status=1: whether sending is set up (no personal data).
// Needs the secret RESEND_API_KEY (Supabase → Edge Functions → Secrets).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SITE = "https://projectuv.com";
const FROM = "The Sunday from Project UltraViolet <newsletter@projectuv.com>";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND = Deno.env.get("RESEND_API_KEY") || "";
const SELF = Deno.env.get("SUPABASE_URL")! + "/functions/v1/uv-newsletter";

type Item = { topic: string; title: string; summary: string; source: string; url: string; schools?: string[]; date?: string };
type Issue = { week: string; subject: string; intro?: string; items: Item[] };

const TOPICS: Record<string, [string, string, string]> = {
  // label, gradient start, gradient end (same colours as the site's news cards)
  talk: ["Talk of the week", "#7c3aed", "#ec4899"],
  resources: ["Resources people shared", "#0f766e", "#38bdf8"],
  debate: ["Debates and controversies", "#b91c1c", "#f97316"],
  insider: ["Insider tips", "#4338ca", "#06b6d4"],
  schools: ["News from your schools", "#5b21b6", "#6366f1"],
  dates: ["Deadlines and dates", "#0369a1", "#8b5cf6"],
};
const ORDER = ["talk", "resources", "debate", "insider", "schools", "dates"];
const SCHOOL: Record<string, string> = {
  uoft: "Toronto", mac: "McMaster", western: "Western", queens: "Queen’s", ottawa: "Ottawa", nosm: "NOSM", tmu: "TMU", mcgill: "McGill", mcgillp: "McGill Med-P",
  udem: "Montréal", laval: "Laval", sherb: "Sherbrooke", mun: "Memorial", dal: "Dalhousie", umanitoba: "Manitoba", usask: "Saskatchewan", ualberta: "Alberta",
  ucalgary: "Calgary", ubc: "UBC", sfu: "SFU",
};

const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const torontoDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" }); // YYYY-MM-DD
const nice = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
const safeUrl = (u: string) => (/^https:\/\//i.test(u || "") ? u : SITE + "/#newsletter");

async function cronKey() {
  const { data } = await sb.from("app_secrets").select("value").eq("name", "cron_key").maybeSingle();
  return data?.value || "";
}

function page(title: string, msg: string) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="margin:0;background:#f4f3f8;font-family:Helvetica,Arial,sans-serif;color:#15121f"><div style="max-width:460px;margin:60px auto;background:#fff;border:1px solid #e4e0ee;border-radius:16px;padding:28px"><p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#7c3aed">Project UltraViolet</p><h1 style="margin:0 0 12px;font-size:24px">${title}</h1><p style="margin:0 0 20px;line-height:1.5;color:#4b4660">${msg}</p><a href="${SITE}/#account/notifications" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px">Email settings</a></div></body>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}

// One story as a card: a coloured band like the site's news covers, then the headline, our summary and the source
function card(i: Item) {
  const [label, c1, c2] = TOPICS[i.topic] || TOPICS.talk;
  const tags = (i.schools || []).map((s) => SCHOOL[s]).filter(Boolean).join(", ");
  return `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e0ee;border-radius:14px;overflow:hidden;background:#ffffff">
<tr><td style="background:${c1};background-image:linear-gradient(135deg,${c1},${c2});padding:14px 18px"><span style="font:800 11px/1.2 Helvetica,Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#ffffff">${esc(i.source)}</span></td></tr>
<tr><td style="padding:14px 18px 16px"><p style="margin:0 0 6px;font:800 11px Helvetica,Arial,sans-serif;letter-spacing:1.3px;text-transform:uppercase;color:${c1}">${esc(label)}${tags ? `<span style="color:#8a85a0;font-weight:600;letter-spacing:0;text-transform:none"> · ${esc(tags)}</span>` : ""}</p>
<a href="${esc(safeUrl(i.url))}" style="font:700 17px/1.3 Helvetica,Arial,sans-serif;color:#15121f;text-decoration:none">${esc(i.title)}</a>
<p style="margin:8px 0 10px;font:15px/1.5 Helvetica,Arial,sans-serif;color:#4b4660">${esc(i.summary)}</p>
<a href="${esc(safeUrl(i.url))}" style="font:700 14px Helvetica,Arial,sans-serif;color:#7c3aed;text-decoration:none">Read it →</a></td></tr></table></td></tr>`;
}

function email(issue: Issue, items: Item[], unsub: string, personal: boolean) {
  const groups = ORDER.map((k) => [k, items.filter((i) => i.topic === k)] as const).filter(([, l]) => l.length);
  const body = groups
    .map(([k, l]) => `<tr><td style="padding:18px 0 10px"><p style="margin:0;font:800 12px Helvetica,Arial,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#8a85a0">${esc(TOPICS[k][0])}</p></td></tr>${l.map(card).join("")}`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(issue.subject)}</title></head><body style="margin:0;padding:0;background:#f4f3f8">
<div style="display:none;max-height:0;overflow:hidden">${esc(issue.intro || issue.subject)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f8;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="background:#0b0718;background-image:linear-gradient(135deg,#1b0f3d,#0b1027);border-radius:18px 18px 0 0;padding:24px 26px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="${SITE}/icon-192.png" width="38" height="38" alt="" style="display:block;border:0;border-radius:10px"></td><td style="padding-left:12px;font:800 18px Helvetica,Arial,sans-serif;letter-spacing:.6px;text-transform:uppercase;color:#ffffff">Project UltraViolet</td></tr></table>
<p style="margin:20px 0 4px;font:800 12px Helvetica,Arial,sans-serif;letter-spacing:1.8px;text-transform:uppercase;color:#a5b4fc">The Sunday · ${esc(nice(issue.week))}</p>
<h1 style="margin:0;font:800 26px/1.15 Helvetica,Arial,sans-serif;color:#ffffff">${esc(issue.subject)}</h1>
${issue.intro ? `<p style="margin:12px 0 0;font:15px/1.55 Helvetica,Arial,sans-serif;color:#c4b5fd">${esc(issue.intro)}</p>` : ""}</td></tr>
<tr><td style="background:#ffffff;padding:8px 22px 6px;border-left:1px solid #e4e0ee;border-right:1px solid #e4e0ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 22px"><tr><td style="border-radius:10px;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed,#0ea5e9)"><a href="${SITE}/#account" style="display:inline-block;padding:13px 22px;font:700 15px Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:10px">Open my profile</a></td></tr></table></td></tr>
<tr><td style="background:#ffffff;border:1px solid #e4e0ee;border-top:0;border-radius:0 0 18px 18px;padding:0 22px 24px"><p style="margin:0;padding-top:16px;border-top:1px solid #efedf5;font:12px/1.6 Helvetica,Arial,sans-serif;color:#8a85a0">
${personal ? "Picked for the topics and schools in your settings. " : ""}Summaries are ours; forum posts are other applicants’ views, not official advice. Always confirm requirements with the school.<br>
<a href="${unsub}" style="color:#8a85a0">Unsubscribe</a> · <a href="${SITE}/#account/notifications" style="color:#8a85a0">Choose topics</a> · <a href="${SITE}" style="color:#8a85a0">projectuv.com</a><br>Project UltraViolet · London, Ontario, Canada</p></td></tr>
</table></td></tr></table></body></html>`;
}

// Which stories a member gets: their topics (none picked = all), and school news only for schools they saved (plus stories with no school)
function pick(issue: Issue, topics: string[], schools: string[]) {
  return issue.items.filter((i) => {
    if (topics.length && !topics.includes(i.topic)) return false;
    if (i.topic === "schools" && i.schools && i.schools.length && schools.length) return i.schools.some((s) => schools.includes(s));
    return true;
  });
}

async function sendBatch(msgs: { to: string; subject: string; html: string; unsub: string }[]) {
  let failed = 0;
  for (let k = 0; k < msgs.length; k += 100) {
    const chunk = msgs.slice(k, k + 100).map((m) => ({ from: FROM, to: m.to, subject: m.subject, html: m.html, headers: { "List-Unsubscribe": `<${m.unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }));
    const r = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" }, body: JSON.stringify(chunk) });
    if (!r.ok) failed += chunk.length;
  }
  return failed;
}

async function loadIssue(week: string): Promise<Issue | null> {
  const r = await fetch(`${SITE}/newsletter/${week}.json`, { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return null;
  const j = await r.json();
  return j && Array.isArray(j.items) ? j : null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("u")) {
    const { data } = await sb.from("user_prefs").update({ newsletter: false }).eq("email_token", url.searchParams.get("u")!).select("user_id");
    return data && data.length ? page("You’re unsubscribed", "You won’t get The Sunday any more. You can turn it back on in your email settings any time.") : page("Link expired", "We couldn’t find that subscription. You can manage emails in your settings.");
  }
  if (req.method === "POST" && url.searchParams.get("u")) {
    // One-click unsubscribe from the mail app (List-Unsubscribe-Post)
    await sb.from("user_prefs").update({ newsletter: false }).eq("email_token", url.searchParams.get("u")!);
    return new Response("ok");
  }
  if (req.method === "GET" && url.searchParams.get("status")) {
    return Response.json({ resend_key_set: !!RESEND, today: torontoDate() }, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") return new Response("Not found", { status: 404 });
  const key = await cronKey();
  if (!key || req.headers.get("x-cron-key") !== key) return new Response("Forbidden", { status: 403 });
  if (!RESEND) return Response.json({ error: "RESEND_API_KEY isn't set in Supabase → Edge Functions → Secrets" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const week: string = body.week || torontoDate();
  const issue = await loadIssue(week);
  if (!issue) return Response.json({ skipped: `No issue at ${SITE}/newsletter/${week}.json` });

  if (body.preview_to) {
    const unsub = `${SITE}/#account/notifications`;
    const failed = await sendBatch([{ to: body.preview_to, subject: "[Preview] " + issue.subject, html: email(issue, issue.items, unsub, false), unsub }]);
    return Response.json({ preview: body.preview_to, failed });
  }
  const { data: done } = await sb.from("nl_sends").select("week").eq("week", week).maybeSingle();
  if (done) return Response.json({ skipped: "Already sent this week" });

  // Members with the newsletter on and a confirmed email
  const { data: prefs } = await sb.from("user_prefs").select("user_id, nl_topics, med, email_token").eq("newsletter", true);
  const msgs: { to: string; subject: string; html: string; unsub: string }[] = [];
  for (const p of prefs || []) {
    const { data: u } = await sb.auth.admin.getUserById(p.user_id);
    const user = u?.user;
    if (!user?.email || !user.email_confirmed_at) continue;
    const schools = p.med && p.med.mine ? Object.keys(p.med.mine).filter((k) => p.med.mine[k]?.st !== "no") : [];
    const items = pick(issue, p.nl_topics || [], schools);
    if (!items.length) continue;
    const unsub = `${SELF}?u=${p.email_token}`;
    msgs.push({ to: user.email, subject: issue.subject, html: email(issue, items, unsub, true), unsub });
  }
  const failed = msgs.length ? await sendBatch(msgs) : 0;
  await sb.from("nl_sends").insert({ week, subject: issue.subject, recipients: msgs.length - failed, failed, note: `${issue.items.length} stories` });
  return Response.json({ week, sent: msgs.length - failed, failed });
});
