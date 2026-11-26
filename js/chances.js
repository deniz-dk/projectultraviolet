/* ============================================================
   MY CHANCES (#account/chances + a card on the profile overview)
   Students enter what they have (GPA by year, MCAT sections, Casper
   quartile, R score for Quebec, home province, activities) and leave the
   rest blank. Each school is scored only on what it uses and what the
   student has entered, then sorted into Strong / Competitive / Reach /
   Long shot. Saved in user_prefs.med.stats (no extra table).
   Averages marked est are our estimates where a school doesn't publish one.
   This compares the numbers that decide interviews; interviews decide offers.
   ============================================================ */
const CH_PROV = [["on", "Ontario"], ["qc", "Quebec"], ["bc", "British Columbia"], ["ab", "Alberta"], ["sk", "Saskatchewan"], ["mb", "Manitoba"], ["ns", "Nova Scotia"], ["nb", "New Brunswick"], ["pe", "Prince Edward Island"], ["nl", "Newfoundland and Labrador"], ["north", "Yukon, NWT or Nunavut"]];
const CH_SEC = [["cpbs", "Chem/Phys"], ["cars", "CARS"], ["bbfl", "Bio/Biochem"], ["psbb", "Psych/Soc"]];
const CH_ACT = [["clinical", "Clinical or patient contact"], ["volunteer", "Volunteering"], ["research", "Research"], ["leader", "Leadership or clubs"], ["work", "Paid work"], ["arts", "Sports, arts or music"], ["other", "Other"]];
const CH_ROLE = [["m", "Member", 1], ["l", "Led or organized", 1.35], ["f", "Founded or ran it", 1.6]];
// g/m/c/e/r = weight of GPA, MCAT, Casper, activities, R score. gm: how the school reads GPA. mcat: all sections, CARS only, total only, or none.
// ref = competitive MCAT (total, or CARS for "cars"); min = hard minimums; home = provinces with most seats, share = their share.
const CH_SCH = {
  uoft: { gpa: 3.95, mcat: "all", ref: 513, min: { each: 125, oneLow: 124 }, w: { g: 45, m: 25, e: 30 } },
  mac: { gpa: 3.92, mcat: "cars", ref: 129, min: { cars: 123 }, casper: 1, w: { g: 32, m: 32, c: 32, e: 4 } },
  western: { gpa: 3.96, gm: "best2", mcat: "all", ref: 513, w: { g: 45, m: 30, e: 25 } },
  queens: { gpa: 3.92, est: 1, mcat: "all", ref: 510, casper: 1, min: { gpa: 3.0 }, w: { g: 35, m: 25, c: 15, e: 25 } },
  ottawa: { gpa: 3.94, est: 1, gm: "w3", mcat: "none", home: ["on"], share: 0.95, w: { g: 55, e: 45 } },
  nosm: { gpa: 3.86, est: 1, mcat: "none", home: ["on"], share: 0.9, w: { g: 50, e: 50 }, note: "Favours Northern Ontario, rural, Indigenous and Francophone applicants, which this can’t measure." },
  tmu: { gpa: 3.93, est: 1, mcat: "none", home: ["on"], share: 0.95, w: { g: 50, e: 50 } },
  york: { gpa: 3.92, est: 1, mcat: "total", ref: 505, min: { total: 495 }, home: ["on"], share: 0.9, w: { g: 40, m: 20, e: 40 }, note: "First class enters in 2028, pending accreditation. Rules are proposed." },
  mun: { gpa: 3.8, est: 1, mcat: "all", ref: 507, casper: 1, home: ["nl", "pe"], share: 0.95, w: { g: 35, m: 25, c: 15, e: 25 } },
  dal: { gpa: 3.85, est: 1, mcat: "all", ref: 508, casper: 1, home: ["ns", "nb", "pe"], share: 0.97, w: { g: 35, m: 25, c: 20, e: 20 } },
  umanitoba: { gpa: 3.9, est: 1, mcat: "all", ref: 510, casper: 1, home: ["mb"], share: 0.95, w: { g: 40, m: 30, c: 15, e: 15 } },
  usask: { gpa: 3.85, est: 1, mcat: "all", ref: 508, casper: 1, home: ["sk"], share: 0.9, w: { g: 40, m: 25, c: 15, e: 20 } },
  ualberta: { gpa: 3.9, est: 1, mcat: "all", ref: 511, min: { each: 124, carsOut: 128 }, home: ["ab"], share: 0.85, w: { g: 40, m: 20, e: 40 } },
  ucalgary: { gpa: 3.85, est: 1, mcat: "all", ref: 510, min: { carsOut: 128 }, home: ["ab"], share: 0.9, w: { g: 35, m: 25, e: 40 } },
  ubc: { gpa: 3.9, est: 1, mcat: "all", ref: 511, home: ["bc"], share: 0.9, w: { g: 40, m: 25, e: 35 } },
  mcgill: { rs: 35.5, mcat: "none", casper: 1, home: ["qc"], share: 0.97, w: { r: 70, c: 20, e: 10 } },
  mcgillp: { rs: 35, mcat: "none", casper: 1, home: ["qc"], share: 1, only: "qc", french: 1, w: { r: 70, c: 30 }, note: "For Quebec students finishing CEGEP." },
  udem: { rs: 35, mcat: "none", casper: 1, home: ["qc"], share: 0.97, french: 1, w: { r: 60, c: 40 } },
  laval: { rs: 35, mcat: "none", casper: 1, home: ["qc"], share: 0.97, french: 1, w: { c: 100 } },
  sherb: { rs: 34.5, mcat: "none", casper: 1, home: ["qc", "nb"], share: 0.97, french: 1, w: { r: 70, c: 30 } },
};
const CH_BANDS = [[0.62, "strong", "Strong"], [0.45, "comp", "Competitive"], [0.28, "reach", "Reach"], [0, "long", "Long shot"]];
const chanNum = (v, lo, hi) => { const n = parseFloat(v); return isFinite(n) && n >= lo && n <= hi ? n : null; };
const chLog = (x) => 1 / (1 + Math.exp(-x));

function chState() {
  const M = medState();
  const S = (M.stats = M.stats && typeof M.stats === "object" ? M.stats : {});
  S.gpa = Array.isArray(S.gpa) ? S.gpa.slice(0, 5) : [];
  S.mcat = Array.isArray(S.mcat) ? S.mcat.slice(0, 4) : [];
  S.acts = Array.isArray(S.acts) ? S.acts : [];
  if (!S.prov && M.prov && M.prov !== "all" && CH_PROV.some((p) => p[0] === M.prov)) S.prov = M.prov;
  return S;
}
const chHas = (S) => !!(S && (S.gpa.some((g) => g != null) || S.mcat.some((m) => m != null) || S.casper || S.r || S.acts.length));

// What the student has, cleaned up
function chFacts(S) {
  const g = S.gpa.map((v) => chanNum(v, 0, 4)).filter((v, i, a) => v != null);
  const yrs = S.gpa.map((v) => chanNum(v, 0, 4));
  const filled = yrs.filter((v) => v != null);
  const cum = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
  const best2 = filled.length >= 2 ? (filled.slice().sort((a, b) => b - a)[0] + filled.slice().sort((a, b) => b - a)[1]) / 2 : cum;
  const last = yrs.map((v, i) => [v, i]).filter((x) => x[0] != null).slice(-3).reverse();
  const w3 = last.length ? last.reduce((a, [v], i) => a + v * (3 - i), 0) / last.reduce((a, x, i) => a + (3 - i), 0) : null;
  const sec = S.mcat.map((v) => chanNum(v, 118, 132));
  const mcat = sec.every((v) => v != null) ? { sec, total: sec.reduce((a, b) => a + b, 0) } : sec[1] != null ? { sec, total: null } : null;
  return { gpa: g.length ? { cum, best2, w3 } : null, mcat, casper: chanNum(S.casper, 1, 4), r: chanNum(S.r, 20, 45), ec: chEc(S), prov: S.prov || null };
}

// Activities: hours (square root, so the first hundreds count most), role, a bonus for breadth, and publications
function chEc(S) {
  const acts = S.acts.filter((a) => chanNum(a.h, 1, 20000));
  if (!acts.length && !chanNum(S.pubs, 1, 99)) return null;
  const val = acts.map((a) => Math.sqrt(Math.min(+a.h, 1500) / 1500) * ((CH_ROLE.find((r) => r[0] === a.r) || CH_ROLE[0])[2])).sort((a, b) => b - a).slice(0, 8);
  const kinds = new Set(acts.map((a) => a.t));
  const breadth = ["clinical", "volunteer", "research", "leader"].filter((k) => kinds.has(k)).length * 0.05;
  return Math.min(1, val.reduce((a, b) => a + b, 0) / 4.2 + breadth + (chanNum(S.pubs, 0, 99) || 0) * 0.04);
}
const chEcLabel = (e) => (e == null ? "Not added" : e >= 0.8 ? "Standout" : e >= 0.6 ? "Solid" : e >= 0.35 ? "Building" : "Getting started");

// One school
function chSchool(id, F) {
  const C = CH_SCH[id], s = medSchool(id);
  if (!C || !s) return null;
  const out = { id, name: s.short || s.name, why: [], miss: [], stop: null, est: !!C.est };
  const home = !C.home || (F.prov && C.home.includes(F.prov));
  if (C.only && F.prov !== C.only) out.stop = "For Quebec residents only";
  const parts = [];
  const add = (k, sc, txt) => { parts.push([C.w[k], sc]); if (txt) out.why.push(txt); };
  // GPA or R score
  if (C.w.g) {
    if (F.gpa) {
      const v = C.gm === "best2" ? F.gpa.best2 : C.gm === "w3" ? F.gpa.w3 : F.gpa.cum;
      if (C.min && C.min.gpa && v < C.min.gpa) out.stop = `Needs a GPA of at least ${C.min.gpa.toFixed(1)}`;
      add("g", chLog((v - C.gpa) / 0.04), `GPA ${v.toFixed(2)}${C.gm === "best2" ? " (your best two years)" : C.gm === "w3" ? " (recent years count more)" : ""} vs about ${C.gpa.toFixed(2)} ${C.est ? "typical (our estimate)" : "average accepted"}`);
    } else out.miss.push("GPA");
  }
  if (C.w.r) {
    if (F.r) add("r", chLog((F.r - C.rs) / 0.6), `R score ${F.r.toFixed(1)} vs about ${C.rs} competitive (our estimate)`);
    else out.miss.push(F.prov === "qc" ? "R score" : "R score (Quebec)");
  }
  // MCAT
  if (C.mcat !== "none" && C.w.m) {
    const M = F.mcat, mn = C.min || {};
    if (C.mcat === "cars") {
      if (M && M.sec[1] != null) {
        if (mn.cars && M.sec[1] < mn.cars) out.stop = `Needs at least ${mn.cars} in CARS`;
        add("m", chLog((M.sec[1] - C.ref) / 1.2), `CARS ${M.sec[1]} vs about ${C.ref} competitive (our estimate)`);
      } else out.miss.push("MCAT CARS");
    } else if (M && M.total) {
      const low = M.sec.filter((v) => v < (mn.each || 0));
      if (mn.each && (low.length > 1 || (low.length === 1 && !(mn.oneLow && low[0] >= mn.oneLow)))) out.stop = `Needs at least ${mn.each} in each section${mn.oneLow ? ` (one ${mn.oneLow} allowed)` : ""}`;
      if (mn.carsOut && !home && M.sec[1] < mn.carsOut) out.stop = `Out-of-province applicants need ${mn.carsOut} in CARS`;
      if (mn.total && M.total < mn.total) out.stop = `Needs an MCAT total of at least ${mn.total}`;
      add("m", chLog((M.total - C.ref) / 3), `MCAT ${M.total} vs about ${C.ref} competitive (our estimate)`);
    } else out.miss.push("MCAT");
  }
  if (C.casper && C.w.c) {
    if (F.casper) add("c", [0, 0.12, 0.4, 0.68, 0.92][F.casper], `Casper ${["", "1st", "2nd", "3rd", "4th"][F.casper]} quartile`);
    else out.miss.push("Casper");
  }
  if (C.w.e) {
    if (F.ec != null) add("e", chLog((F.ec - 0.6) / 0.12), `Activities: ${chEcLabel(F.ec).toLowerCase()}`);
    else out.miss.push("activities");
  }
  if (!parts.length) return Object.assign(out, { score: null });
  let score = parts.reduce((a, [w, v]) => a + w * v, 0) / parts.reduce((a, [w]) => a + w, 0);
  const apps = typeof MSX !== "undefined" && MSX[id] && (MSX[id].tr || []).find((t) => /Applications/.test(t[0]));
  const per = apps ? apps[1].slice(-1)[0][1] / s.seats : null;
  if (per && per > 20) { score *= Math.max(0.75, 1 - (per - 20) * 0.006); out.why.push(`About ${Math.round(per)} applicants per seat`); }
  if (!home) {
    score *= Math.max(0.15, (1 - C.share) * 4);
    out.why.push(F.prov ? `Most seats go to ${C.home.map((p) => (CH_PROV.find((x) => x[0] === p) || [p, p])[1]).join(", ")} residents` : "Add your province: most seats go to local residents");
  }
  if (C.french) out.why.push("Taught in French");
  if (C.note) out.why.push(C.note);
  out.score = score;
  out.used = parts.length;
  out.need = parts.length + out.miss.length;
  out.band = out.stop ? ["stop", "Not eligible yet"] : CH_BANDS.find((b) => score >= b[0]).slice(1);
  return out;
}
function chResults(S) {
  const F = chFacts(S);
  const list = Object.keys(CH_SCH).map((id) => chSchool(id, F)).filter((x) => x && x.score != null);
  list.sort((a, b) => (!!a.stop - !!b.stop) || b.score - a.score);
  return { F, list };
}

const chRing = (p, sz) => `<span class="chring" style="--p:${p};--sz:${sz}px"><b>${p}<small>%</small></b></span>`;
const CH_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/></svg>';

/* The overview card */
function chCard() {
  const S = chState();
  if (!chHas(S)) {
    return `<section class="hubcard hubwide chcard chcta"><div><p class="chkick">New · Your chances</p><h2>${CH_ICO}See where you stand</h2>
      <p>Add your GPA by year, MCAT sections, Casper and activities. Skip anything you haven’t done yet. We’ll sort every Canadian medical school into strong, competitive, reach and long shot for you, and update it as your numbers change.</p>
      <div class="hubrow"><a class="btn" href="#account/chances" data-gotab="chances">Add my stats</a><span class="hubsub">About 3 minutes</span></div></div>
      <div class="chghosts" aria-hidden="true">${[[82, "Strong"], [61, "Competitive"], [38, "Reach"]].map(([p, l], i) => `<div class="chghost" style="--d:${i}">${chRing(p, 44)}<span><i></i><i></i></span><em class="chb ${["strong", "comp", "reach"][i]}">${l}</em></div>`).join("")}</div></section>`;
  }
  const R = chResults(S), top = R.list.filter((x) => !x.stop).slice(0, 5);
  const missing = ["GPA", "MCAT", "Casper", "activities"].filter((k) => R.list.some((x) => x.miss.includes(k)));
  return `<section class="hubcard hubwide chcard"><div class="chhead"><div><p class="chkick">Your chances</p><h2>${CH_ICO}Your best bets</h2><p class="hubsub">From the stats you entered${missing.length ? ` · add ${missing.join(", ")} to sharpen this` : ""}</p></div>
    <div class="hubrow"><a class="tbtn" href="#account/chances" data-gotab="chances">Edit my stats</a><a class="tbtn" href="#account/chances" data-gotab="chances">All schools</a></div></div>
    ${top.length ? `<ol class="chlist">${top.map((x, i) => chRow(x, i)).join("")}</ol>` : `<p class="note">None of the schools you can apply to fit yet. Open your stats to see why.</p>`}</section>`;
}
function chRow(x, i) {
  const p = Math.round(x.score * 100);
  return `<li><a class="chrow" href="#school-${x.id}/admissions"><span class="hubrank">${i + 1}</span><span class="chname"><b>${acctEsc(x.name)}</b><small>${acctEsc(x.stop || x.why[0] || "")}</small></span><span class="chbar"><i style="width:${p}%"></i></span><span class="chpct">${p}%</span><em class="chb ${x.band[0]}">${x.band[1]}</em></a></li>`;
}

/* The My chances tab */
function chPanel() {
  const S = chState();
  const yr = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5 or grad"];
  const opt = (arr, v) => arr.map(([k, l]) => `<option value="${k}"${k === v ? " selected" : ""}>${l}</option>`).join("");
  const form = `<section class="hubcard hubwide chcard chform"><p class="chkick">Your chances</p><h2>${CH_ICO}Your stats</h2>
    <p class="hubsub">Leave anything blank that you haven’t done yet; schools are scored only on what you’ve entered. Saves to your account as you type.</p>
    <div class="chgrid">
      <fieldset><legend>Where you live</legend><label class="chf">Province or territory<select data-ch="prov"><option value="">Choose…</option>${opt(CH_PROV, S.prov)}</select></label>
        <p class="chhelp">Most schools outside Ontario keep nearly all their seats for local residents.</p></fieldset>
      <fieldset><legend>GPA by year <small>4.0 scale (OMSAS)</small></legend><div class="chrowin">${yr.map((l, i) => `<label class="chf">${l}<input data-ch="gpa" data-i="${i}" inputmode="decimal" placeholder="—" value="${S.gpa[i] ?? ""}"></label>`).join("")}</div>
        <p class="chhelp">Use your school’s OMSAS conversion. Western reads your best two years; Ottawa counts recent years more. We do that for you.</p></fieldset>
      <fieldset><legend>MCAT <small>118 to 132 each</small></legend><div class="chrowin">${CH_SEC.map(([k, l], i) => `<label class="chf">${l}<input data-ch="mcat" data-i="${i}" inputmode="numeric" placeholder="—" value="${S.mcat[i] ?? ""}"></label>`).join("")}<span class="chtotal" data-chtotal></span></div>
        <p class="chhelp">Only have a practice score? Use it and come back when the real one is out.</p></fieldset>
      <fieldset><legend>Casper</legend><label class="chf">Your quartile<select data-ch="casper"><option value="">Not written yet</option>${opt([["4", "4th (top 25%)"], ["3", "3rd"], ["2", "2nd"], ["1", "1st (bottom 25%)"]], String(S.casper || ""))}</select></label>
        ${S.prov === "qc" ? `<label class="chf">R score (CEGEP)<input data-ch="r" inputmode="decimal" placeholder="—" value="${S.r ?? ""}"></label>` : ""}</fieldset>
    </div>
    <fieldset class="chacts"><legend>Activities <small data-chec></small></legend>
      <div class="chactlist">${S.acts.map((a, i) => chActRow(a, i)).join("")}</div>
      <div class="hubrow"><button type="button" class="tbtn" data-chadd>Add an activity</button><label class="chf chpubs">Publications or posters<input data-ch="pubs" inputmode="numeric" placeholder="0" value="${S.pubs ?? ""}"></label></div>
      <p class="chhelp">Total hours so far. The first few hundred hours in something count most, and leading or founding it counts more than taking part.</p></fieldset></section>`;
  return `<div class="hubgrid">${form}<section class="hubcard hubwide" data-chout></section></div>`;
}
function chActRow(a, i) {
  const opt = (arr, v) => arr.map(([k, l]) => `<option value="${k}"${k === v ? " selected" : ""}>${l}</option>`).join("");
  return `<div class="chact" data-ai="${i}"><input data-act="n" placeholder="What it is, e.g. hospital volunteer" value="${acctEsc(a.n || "")}"><select data-act="t">${opt(CH_ACT, a.t || "volunteer")}</select><input data-act="h" inputmode="numeric" placeholder="Hours" value="${a.h ?? ""}"><select data-act="r">${opt(CH_ROLE.map((r) => [r[0], r[1]]), a.r || "m")}</select><button type="button" class="linkbtn" data-actdel aria-label="Remove">✕</button></div>`;
}
function chOut() {
  const box = document.querySelector("#main [data-chout]");
  if (!box) return;
  const S = chState(), R = chResults(S);
  const tot = document.querySelector("#main [data-chtotal]");
  if (tot) tot.textContent = R.F.mcat && R.F.mcat.total ? `Total ${R.F.mcat.total}` : "";
  const ec = document.querySelector("#main [data-chec]");
  if (ec) ec.textContent = R.F.ec != null ? `· ${chEcLabel(R.F.ec)}` : "";
  if (!chHas(S)) return (box.innerHTML = `<h2>${CH_ICO}Your schools</h2><p class="note">Add anything above, even just one year of GPA, and your schools appear here.</p>`);
  const groups = [["strong", "Strong", "Your numbers are above what these schools usually take."], ["comp", "Competitive", "Right around their usual range."], ["reach", "Reach", "Below their usual range, but people get in."], ["long", "Long shot", "Well below, or most seats go to other provinces."], ["stop", "Not eligible yet", "A minimum or rule you don’t meet yet."]];
  box.innerHTML = `<h2>${CH_ICO}Your schools</h2><p class="hubsub">How your numbers compare with each school’s usual range for an interview. Interviews decide most offers, and averages marked as our estimate are approximate.</p>
    ${groups.map(([k, l, d]) => { const xs = R.list.filter((x) => x.band[0] === k); return xs.length ? `<div class="chgrp"><h3><em class="chb ${k}">${l}</em><span>${d}</span></h3><ul class="chfull">${xs.map((x) => { const p = Math.round(x.score * 100); return `<li>${chRing(p, 46)}<div><a href="#school-${x.id}/admissions"><b>${acctEsc(x.name)}</b></a>${x.stop ? `<p class="chstop">${acctEsc(x.stop)}</p>` : ""}<ul>${x.why.map((w) => `<li>${acctEsc(w)}</li>`).join("")}</ul>${x.miss.length ? `<p class="chmiss">Not counted yet: ${x.miss.join(", ")}</p>` : ""}</div></li>`; }).join("")}</ul></div>` : ""; }).join("")}
    <p class="note">SFU isn’t listed because it hasn’t posted its requirements. Want a second opinion? <a href="#coaching">Talk to a coach</a> who got in.</p>`;
}
function chSave() { chState().at = new Date().toISOString(); acctPush(); chOut(); }
function wireChances() {
  const S = chState(), main = document.querySelector("#main");
  main.querySelectorAll("[data-ch]").forEach((el) => (el.oninput = el.onchange = () => {
    const k = el.dataset.ch, v = el.value.trim();
    if (k === "gpa" || k === "mcat") S[k][+el.dataset.i] = v === "" ? null : v;
    else S[k] = v === "" ? null : v;
    if (k === "prov" && el.type !== "text") { chSave(); return render(); }
    el.classList.toggle("bad", v !== "" && (k === "gpa" ? chanNum(v, 0, 4) == null : k === "mcat" ? chanNum(v, 118, 132) == null : false));
    chSave();
  }));
  const wireActs = () => main.querySelectorAll(".chact").forEach((row) => {
    const a = S.acts[+row.dataset.ai];
    row.querySelectorAll("[data-act]").forEach((el) => (el.oninput = el.onchange = () => { a[el.dataset.act] = el.value; chSave(); }));
    row.querySelector("[data-actdel]").onclick = () => { S.acts.splice(+row.dataset.ai, 1); chSave(); redrawActs(); };
  });
  const redrawActs = () => { main.querySelector(".chactlist").innerHTML = S.acts.map((a, i) => chActRow(a, i)).join(""); wireActs(); };
  main.querySelector("[data-chadd]").onclick = () => { S.acts.push({ t: "volunteer", r: "m" }); redrawActs(); main.querySelector(".chact:last-child input").focus(); };
  wireActs();
  chOut();
}
