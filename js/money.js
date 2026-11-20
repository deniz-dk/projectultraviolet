/* ============================================================
   MONEY (#money): paying for medical school. Tuition by school (from the school data),
   a borrowing planner with a debt-over-time chart, where the money comes from,
   government loans vs a professional line of credit, and grants that cut debt.
   Chart colours (validated with the dataviz checker): free money sky, government violet, line of credit orange.
   Rates and limits below were checked November 2026; each has a source link.
   ============================================================ */
const MONEY = {
  prime: 4.7, primeAsOf: "October 29, 2026",
  src: {
    prime: ["Prime rate in Canada (Ratehub)", "https://www.ratehub.ca/prime-rate"],
    rbc: ["RBC medical and dental credit line", "https://www.rbcroyalbank.com/healthcare-financial-solutions/royal-credit-line/index.html"],
    td: ["TD medical student line of credit", "https://www.td.com/ca/en/personal-banking/products/loans-and-lines-of-credit/student-borrowing/healthcare-student-line-of-credit"],
    loc: ["Medical student lines of credit compared (Loans Canada)", "https://loanscanada.ca/loans/medical-student-line-of-credit"],
    osap: ["OSAP changes for 2026–27 (money.ca)", "https://money.ca/news/ontario-osap-grants-loans-changes-students"],
    osapgov: ["What is OSAP (Ontario)", "https://www.ontario.ca/page/learn-about-osap"],
    csl: ["Canada Student Loan forgiveness: how much", "https://www.canada.ca/en/employment-social-development/services/student-financial-aid/student-loan/student-loans/student-loans-forgiveness/amount.html"],
    cslrules: ["Canada Student Loan forgiveness: what it covers", "https://www.canada.ca/en/employment-social-development/services/education/student-loan-forgiveness/amount.html"],
    las: ["Ontario Learn and Stay Grant for Medical Education", "https://www.ontario.ca/page/ontario-learn-and-stay-grant-medical-education"],
    prov: ["Provinces that still charge interest (Global News)", "https://globalnews.ca/news/12034046/ontario-osap-changes/"],
  },
};
const mMoney = (n) => (n < 0 ? "−" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-CA");
const mK = (n) => (Math.abs(n) >= 1000 ? "$" + Math.round(n / 1000) + "k" : mMoney(n));
const mSrc = (k) => `<a class="src" href="${MONEY.src[k][1]}" target="_blank" rel="noopener">${acctEsc(MONEY.src[k][0])} ↗</a>`;
// Default yearly living cost for a school: one-bedroom rent in its first city for 12 months, plus about $9,000 for food, transit and the rest
const mLiving = (id) => {
  const d = msdOf(id), c = d && MCITY[d.cities[0]];
  return Math.round(((c ? c.rent * 12 : 18000) + 9000) / 500) * 500;
};
const mSchools = () => UV_SCHOOLS().filter((s) => msdOf(s.id) && msdOf(s.id).tuition);

/* Tuition by school, as interactive bars (first year, or the whole program) */
let M_TU = "year";
function mTuitionBars() {
  const rows = mSchools().map((s) => { const d = msdOf(s.id); return { s, d, v: M_TU === "year" ? d.tuition : d.tuition * d.len }; }).sort((a, b) => b.v - a.v);
  const max = Math.max(...rows.map((r) => r.v));
  return `<div class="mbars" role="list">${rows.map(({ s, d, v }) => `<a class="mbar" role="listitem" href="#school-${s.id}/cost" data-tip="${acctEsc(s.short)}: ${mMoney(v)}${M_TU === "year" ? " in first year" : ` over ${d.len} years`}${d.tuEst ? " (estimate)" : ""}">
    <span class="mbn">${acctEsc(s.short)}</span><span class="mbt"><i style="width:${((v / max) * 100).toFixed(1)}%"></i></span><span class="mbv">${mK(v)}${d.tuEst ? "*" : ""}</span></a>`).join("")}</div>
  <p class="note">In-province tuition for the first year${M_TU === "all" ? ", times the program length (fees usually rise a little each year, so the real total is higher)" : ""}. * Estimate. Quebec residents pay far less than students from other provinces. Open a school for its full fee table.</p>`;
}

/* The borrowing planner */
const MP = { id: "uoft", living: null, gov: 15000, free: 3000, family: 0, rate: +(MONEY.prime - 0.25).toFixed(2), govRate: 0, res: 2, yrs: 10 };
function mPlan() {
  const d = msdOf(MP.id), years = d.len, tuition = d.tuition, living = MP.living == null ? mLiving(MP.id) : MP.living;
  const need = tuition + living, cover = MP.gov + MP.free + MP.family;
  const locYear = Math.max(0, need - cover);
  const r = MP.rate / 100, gr = MP.govRate / 100;
  const pts = []; // [label, loc, gov]
  let loc = 0, gov = 0, interestSchool = 0, interestRes = 0;
  pts.push(["Start", 0, 0]);
  for (let y = 1; y <= years; y++) {
    interestSchool += loc * r + (locYear * r) / 2; // interest-only payments on what you've drawn (draws spread over the year)
    loc += locYear;
    gov += MP.gov;
    pts.push(["MD " + y, loc, gov]);
  }
  // Government loans: repayment starts after the MD, over 9.5 years. Line of credit: interest-only through residency, then paid off.
  const govMonths = 114, gm = gr / 12;
  const govPay = gov ? (gm ? (gov * gm) / (1 - Math.pow(1 + gm, -govMonths)) : gov / govMonths) : 0;
  const lm = r / 12, locMonths = MP.yrs * 12;
  const locPay = loc ? (lm ? (loc * lm) / (1 - Math.pow(1 + lm, -locMonths)) : loc / locMonths) : 0;
  let g = gov, l = loc, month = 0, interestRepay = 0, govInterest = 0;
  const total = MP.res * 12 + Math.max(locMonths, govMonths);
  while (month < total) {
    month++;
    if (g > 0) { const it = g * gm; govInterest += it; g = Math.max(0, g + it - govPay); }
    if (month <= MP.res * 12) interestRes += l * lm;
    else if (l > 0) { const it = l * lm; interestRepay += it; l = Math.max(0, l + it - locPay); }
    if (month % 12 === 0) pts.push([(month <= MP.res * 12 ? "Res " : "Yr ") + (month <= MP.res * 12 ? month / 12 : month / 12 - MP.res), l, g]);
  }
  const free = MP.free * years, totalInterest = interestSchool + interestRes + interestRepay + govInterest;
  return { d, years, tuition, living, need, cover, locYear, loc, gov, free, family: MP.family * years, interestSchool, interestRes, interestRepay, govInterest, totalInterest, locPay, govPay, pts };
}
function mDebtChart(P) {
  const W = innerWidth < 640 ? 420 : 760, H = innerWidth < 640 ? 300 : 280, L = 52, R = 16, T = 22, B = 30, pts = P.pts;
  const max = Math.max(1, ...pts.map((p) => p[1] + p[2]));
  const step = Math.pow(10, Math.floor(Math.log10(max))) / 2, top = Math.ceil(max / step) * step;
  const x = (i) => L + (i * (W - L - R)) / (pts.length - 1), y = (v) => T + (H - T - B) * (1 - v / top);
  const line = (k) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join("");
  const tot = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[1] + p[2]).toFixed(1)}`).join("");
  const mdEnd = P.years, resEnd = P.years + MP.res;
  const band = (a, b, cls, lab) => `<rect class="${cls}" x="${x(a)}" y="${T}" width="${Math.max(0, x(b) - x(a))}" height="${H - T - B}"/><text class="mband" x="${(x(a) + x(b)) / 2}" y="${T + 12}" text-anchor="middle">${lab}</text>`;
  const every = Math.ceil(pts.length / (W < 600 ? 5 : 10));
  const data = acctEsc(JSON.stringify(pts.map((p, i) => [p[0], Math.round(p[1]), Math.round(p[2]), +x(i).toFixed(1), +y(p[1] + p[2]).toFixed(1)])));
  return `<figure class="mdebt" data-w="${W}" data-pts="${data}"><figcaption>What you owe over time</figcaption>
  <ul class="mleg"><li><i class="k-loc"></i>Line of credit</li><li><i class="k-gov"></i>Government loans</li><li><i class="k-tot"></i>Total</li></ul>
  <div class="mdw"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Debt over time: peaks at ${mMoney(P.loc + P.gov)} at graduation">
    ${band(0, mdEnd, "mb-md", "Medical school")}${MP.res ? band(mdEnd, Math.min(resEnd, pts.length - 1), "mb-res", "Residency") : ""}
    ${[0, top / 2, top].map((t) => `<line class="chgrid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="chax" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${mK(t)}</text>`).join("")}
    ${pts.map((p, i) => (i % every === 0 || i === pts.length - 1 ? `<text class="chax" x="${x(i)}" y="${H - 9}" text-anchor="middle">${p[0]}</text>` : "")).join("")}
    <path class="ml-tot" d="${tot}"/><path class="ml-gov" d="${line(2)}"/><path class="ml-loc" d="${line(1)}"/>
    <line class="mcross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
    <rect class="mshit" x="${L}" y="0" width="${W - L - R}" height="${H}" tabindex="0" aria-label="Move across the chart to read each year"/>
  </svg><div class="mstip mdtip" hidden></div></div>
  <details class="chtable"><summary>Show as a table</summary><div class="tw"><table class="uvtable"><thead><tr><th>When</th><th>Line of credit</th><th>Government</th><th>Total</th></tr></thead><tbody>${pts.map((p) => `<tr><td>${p[0]}</td><td class="num">${mMoney(p[1])}</td><td class="num">${mMoney(p[2])}</td><td class="num">${mMoney(p[1] + p[2])}</td></tr>`).join("")}</tbody></table></div></details></figure>`;
}
function wireDebtChart() {
  const fig = $(".mdebt");
  if (!fig) return;
  const svg = fig.querySelector("svg"), tip = fig.querySelector(".mdtip"), cross = fig.querySelector(".mcross"), hit = fig.querySelector(".mshit");
  const data = JSON.parse(fig.dataset.pts);
  let cur = -1;
  const show = (i) => {
    cur = Math.max(0, Math.min(data.length - 1, i));
    const [lab, l, g, px, py] = data[cur];
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    tip.innerHTML = `<b>${mMoney(l + g)}</b><span>${lab}</span><span><i class="k-loc"></i>Credit line ${mMoney(l)}</span><span><i class="k-gov"></i>Government ${mMoney(g)}</span>`;
    tip.hidden = false;
    const r = svg.getBoundingClientRect(), k = r.width / (+fig.dataset.w || 760), tw = tip.offsetWidth;
    tip.style.left = Math.min(r.width - tw, Math.max(0, px * k - tw / 2)) + "px";
    tip.style.top = Math.max(0, py * k - tip.offsetHeight - 12) + "px";
  };
  const near = (cx) => { const r = svg.getBoundingClientRect(), vx = ((cx - r.left) / r.width) * (+fig.dataset.w || 760); let b = 0; data.forEach((p, i) => { if (Math.abs(p[3] - vx) < Math.abs(data[b][3] - vx)) b = i; }); return b; };
  const hide = () => { cross.setAttribute("visibility", "hidden"); tip.hidden = true; cur = -1; };
  hit.addEventListener("pointermove", (e) => show(near(e.clientX)));
  let ptr = 0;
  hit.addEventListener("pointerdown", (e) => { ptr = Date.now(); show(near(e.clientX)); });
  hit.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && hide());
  let tt = 0;
  hit.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") { clearTimeout(tt); tt = setTimeout(hide, 2500); } });
  hit.addEventListener("pointercancel", hide);
  hit.addEventListener("focus", () => Date.now() - ptr > 400 && show(MP && msdOf(MP.id) ? msdOf(MP.id).len : 0));
  hit.addEventListener("blur", hide);
  hit.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); show((cur < 0 ? 0 : cur) + (e.key === "ArrowRight" ? 1 : -1)); } });
}
// One year of medical school: where the money comes from
function mYearBar(P) {
  const parts = [["free", "Scholarships and bursaries", MP.free], ["gov", "Government student aid", MP.gov], ["fam", "Savings or family", MP.family], ["loc", "Line of credit", P.locYear]].filter((p) => p[2] > 0);
  const tot = parts.reduce((a, p) => a + p[2], 0) || 1;
  const extra = P.cover > P.need ? `<p class="note">Your other sources cover more than a year costs, so you wouldn’t need the line of credit.</p>` : "";
  return `<div class="myear"><div class="mybar" role="img" aria-label="${acctEsc(parts.map((p) => p[1] + " " + mMoney(p[2])).join(", "))}">${parts.map(([k, l, v]) => `<i class="k-${k}" style="flex:${v}" title="${acctEsc(l)}: ${mMoney(v)}"><b>${Math.round((v / tot) * 100)}%</b></i>`).join("")}</div>
  <ul class="mleg">${parts.map(([k, l, v]) => `<li><i class="k-${k}"></i>${acctEsc(l)} <b>${mMoney(v)}</b></li>`).join("")}</ul>${extra}</div>`;
}
const mSlider = (k, label, min, max, step, val, fmt) => `<label class="mrange"><span>${label}<b data-out="${k}">${fmt(val)}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-k="${k}"></label>`;
function mPlanner() {
  const P = mPlan();
  const pct = (v) => v.toFixed(2).replace(/\.?0+$/, "") + "%";
  return `<div class="mplan">
  <div class="mctl">
    <label class="mrange"><span>School</span><select data-k="id">${mSchools().map((s) => `<option value="${s.id}"${s.id === MP.id ? " selected" : ""}>${acctEsc(s.short)} (${msdOf(s.id).len} years)</option>`).join("")}</select></label>
    ${mSlider("living", "Living costs a year", 8000, 45000, 500, P.living, mMoney)}
    ${mSlider("gov", "Government student aid a year", 0, 30000, 500, MP.gov, mMoney)}
    ${mSlider("free", "Scholarships and bursaries a year", 0, 20000, 500, MP.free, mMoney)}
    ${mSlider("family", "Savings or family a year", 0, 30000, 500, MP.family, mMoney)}
    ${mSlider("rate", "Line of credit rate", 2, 9, 0.05, MP.rate, pct)}
    ${mSlider("govRate", "Average rate on government loans", 0, 7, 0.05, MP.govRate, pct)}
    ${mSlider("res", "Residency years (interest-only)", 0, 6, 1, MP.res, (v) => v + (v === 1 ? " year" : " years"))}
    ${mSlider("yrs", "Years to pay off the credit line", 5, 20, 1, MP.yrs, (v) => v + " years")}
    <p class="note">Defaults: tuition from the school’s page, living costs from local rent plus about $9,000, and a credit line at prime (${MONEY.prime}% on ${MONEY.primeAsOf}) minus 0.25%. Federal student loans charge no interest; set the government rate higher if part of your aid is a provincial loan that does.</p>
  </div>
  <div class="mout" aria-live="polite">
    <div class="statrow mstats">
      <div class="stat"><b>${mMoney(P.need)}</b><span>Cost of one year (tuition ${mK(P.tuition)} + living ${mK(P.living)})</span></div>
      <div class="stat"><b>${mMoney(P.loc + P.gov)}</b><span>Owed at graduation (${mK(P.loc)} credit line, ${mK(P.gov)} government)</span></div>
      <div class="stat"><b>${mMoney(P.locPay + P.govPay)}</b><span>A month once repayment starts (${mK(P.locPay)} credit line + ${mK(P.govPay)} government)</span></div>
      <div class="stat"><b>${mMoney(P.totalInterest)}</b><span>Total interest (${mK(P.interestSchool + P.interestRes)} during school and residency)</span></div>
    </div>
    ${mDebtChart(P)}
    <h3>Where one year’s money comes from</h3>${mYearBar(P)}
  </div></div>
  <p class="note">A planning sketch, not a quote: it assumes the same costs every year, interest-only payments on the credit line during school and residency, and government loans repaid over 9.5 years after you graduate. Banks, provinces and rates differ; check your own numbers with your lender and your school’s financial aid office. This isn’t financial advice.</p>`;
}
function wireMoney() {
  const box = $("#mplanbox");
  if (!box) return;
  box.querySelectorAll("[data-k]").forEach((el) => {
    const set = () => {
      const k = el.dataset.k;
      if (k === "id") (MP.id = el.value), (MP.living = null);
      else MP[k] = +el.value;
      const keep = document.activeElement && document.activeElement.dataset.k;
      box.innerHTML = mPlanner();
      wireMoney();
      wireDebtChart();
      if (keep) { const f = box.querySelector(`[data-k="${keep}"]`); if (f) f.focus(); }
    };
    el.addEventListener(el.tagName === "SELECT" ? "change" : "change", set);
    if (el.type === "range") el.addEventListener("input", () => { const o = box.querySelector(`[data-out="${el.dataset.k}"]`); if (o) o.textContent = el.dataset.k.match(/rate/i) ? (+el.value).toFixed(2).replace(/\.?0+$/, "") + "%" : el.dataset.k === "res" ? el.value + (el.value === "1" ? " year" : " years") : el.dataset.k === "yrs" ? el.value + " years" : mMoney(+el.value); });
  });
}

/* Interest-only cost of a credit line balance, by rate: how much a rate change matters */
function mRateTable() {
  const bal = [100000, 200000, 300000], rates = [MONEY.prime - 0.25, MONEY.prime + 0.75, MONEY.prime + 1.75];
  return `<div class="tw"><table class="uvtable mrt"><thead><tr><th>Balance</th>${rates.map((r) => `<th>${r.toFixed(2)}%</th>`).join("")}</tr></thead><tbody>${bal.map((b) => `<tr><td>${mMoney(b)}</td>${rates.map((r) => `<td class="num">${mMoney((b * r) / 100 / 12)}<small>/month</small></td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="note">Interest-only payments. The first column is today’s typical medical rate (prime minus 0.25%); the others show prime rising by 1 and 2 points.</p>`;
}

PAGES.money = () => {
  const S = mSchools(), tu = S.map((s) => msdOf(s.id).tuition);
  const lo = S[tu.indexOf(Math.min(...tu))], hi = S[tu.indexOf(Math.max(...tu))];
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / Money</p><h1>Paying for medical school</h1>
  <p class="lede">Most Canadian medical students borrow. Here is what it costs, where the money comes from, how a professional line of credit and government loans work together, and the grants that can wipe out part of your debt.</p>
  <div class="statrow topstats">
    <div class="stat"><b>${mK(Math.min(...tu))}–${mK(Math.max(...tu))}</b><span>First-year in-province tuition, ${acctEsc(lo.short)} to ${acctEsc(hi.short)}</span></div>
    <div class="stat"><b>${MONEY.prime}%</b><span>Prime rate (${MONEY.primeAsOf}); medical credit lines often sit at prime or just below</span></div>
    <div class="stat"><b>$350k+</b><span>Typical medical line of credit limit at the big banks</span></div>
    <div class="stat"><b>0%</b><span>Interest on federal student loans since April 2023</span></div>
  </div>

  <h2>What tuition costs at each school</h2>
  <div class="chips uvchips mtu" role="group" aria-label="Show"><button class="chip" data-tu="year" aria-pressed="${M_TU === "year"}">First year</button><button class="chip" data-tu="all" aria-pressed="${M_TU === "all"}">Whole program</button></div>
  <div id="mtubox">${mTuitionBars()}</div>

  <h2>Plan your borrowing</h2>
  <p>Pick a school and move the sliders. The chart shows what you owe through medical school, residency and repayment.</p>
  <div id="mplanbox">${mPlanner()}</div>

  <h2>Use money in this order</h2>
  <ol class="mflow">
    <li class="k-free"><span class="mfn">1</span><div><h3>Free money first</h3><p>Entrance scholarships, your school’s need-based bursaries (apply as soon as you accept), provincial grants and awards from groups you belong to. None of it is repaid.</p></div></li>
    <li class="k-gov"><span class="mfn">2</span><div><h3>Government student aid next</h3><p>OSAP, StudentAid BC, Alberta Student Aid and the others combine a federal loan and a provincial loan, sometimes with a grant. The federal part charges no interest, so it is the cheapest borrowing you will ever have.</p></div></li>
    <li class="k-loc"><span class="mfn">3</span><div><h3>A professional line of credit for the gap</h3><p>Banks lend medical students large limits at or near prime, with interest-only payments while you train. You pay interest only on what you draw, so take what you need, when you need it.</p></div></li>
  </ol>

  <h2>Government loans vs a line of credit</h2>
  <div class="tw"><table class="uvtable mcmp"><thead><tr><th></th><th><span class="mdot k-gov"></span>Government student loans</th><th><span class="mdot k-loc"></span>Professional line of credit</th></tr></thead><tbody>
    <tr><td>Interest while in school</td><td>None on the federal part. Provincial parts vary: Ontario charges prime + 1% once you finish (including the 6-month grace period); Ontario and Saskatchewan are the only provinces still charging interest.</td><td>Yes, from the day you draw. Usually you pay interest only while in school.</td></tr>
    <tr><td>How much</td><td>Based on need, with weekly caps; rarely enough for medicine on its own.</td><td>Large: RBC lends medical students up to $350,000 (up to $100,000 in first year); TD lists limits up to $400,000.</td></tr>
    <tr><td>Rate</td><td>Federal: 0%. Ontario portion: prime + 1%.</td><td>Around prime; RBC offers prime − 0.25% with its healthcare package.</td></tr>
    <tr><td>Repayment</td><td>Starts 6 months after you finish school, typically over 9.5 years, with repayment help if your income is low.</td><td>Interest-only through school and usually some time after; RBC’s medical line doesn’t go into repayment at graduation.</td></tr>
    <tr><td>Forgiveness</td><td>Up to $60,000 of federal loans forgiven for family doctors and family medicine residents in under-served rural or remote communities.</td><td>None: lines of credit don’t qualify for federal loan forgiveness.</td></tr>
    <tr><td>Needs</td><td>An application every year, proof of enrolment, income details.</td><td>A credit check and proof of enrolment; a co-signer if your credit history is thin.</td></tr>
  </tbody></table></div>
  <p class="srcs">Sources: ${mSrc("osap")} · ${mSrc("prov")} · ${mSrc("rbc")} · ${mSrc("td")} · ${mSrc("loc")} · ${mSrc("cslrules")}</p>

  <h2>Getting the most out of OSAP</h2>
  <div class="split mtips"><div class="box"><h3>What changed for 2026–27</h3><p>For programs starting on or after August 1, 2026, at most 25% of Ontario’s share of OSAP comes as a grant, down from 85%; the rest is a loan. Expect more of your OSAP to be repayable than older students describe.</p><p class="srcs">${mSrc("osap")} · ${mSrc("osapgov")}</p></div>
  <div class="box"><h3>How students use it</h3><ul class="b"><li>Apply every year, even if you expect mostly loans: the federal part costs nothing.</li><li>Keep the interest-free federal loan the longest; pay down the Ontario portion and the credit line first.</li><li>If you go back to full-time study without OSAP, apply for continued interest-free status so repayment doesn’t start.</li><li>Report changes (scholarships, income) on time to avoid overpayments.</li></ul></div></div>

  <h2>Grants that cut debt later</h2>
  <div class="grid-cards mgrants">
    <div class="gc"><b>Ontario Learn and Stay Grant (family medicine)</b><span>From fall 2026, Ontario residents in the first year of a family medicine residency at an Ontario school can have their medical school tuition, fees, books and supplies covered, if they agree to practise family medicine anywhere in Ontario for 5 years. Applied for through OSAP.</span><span class="srcs">${mSrc("las")}</span></div>
    <div class="gc"><b>Canada Student Loan forgiveness</b><span>Family doctors and family medicine residents in under-served rural or remote communities can have up to $60,000 of federal student loans forgiven over 5 years. Only the federal part counts, not provincial loans or lines of credit.</span><span class="srcs">${mSrc("csl")}</span></div>
    <div class="gc"><b>Return-of-service programs</b><span>Several provinces pay or forgive costs for students who agree to work in an under-served area after training. Ask your school’s financial aid office which ones apply to you.</span></div>
  </div>

  <h2>What a rate change costs you</h2>${mRateTable()}
  <p class="srcs">Sources: ${mSrc("prime")}</p>
  <div class="callout"><b>Not financial advice.</b> We aren’t financial advisers. Rates, limits and programs change; confirm the details with your bank, your provincial aid program and your school before you borrow.</div>`;
  document.querySelectorAll(".mtu .chip").forEach((c) => (c.onclick = () => { M_TU = c.dataset.tu; document.querySelectorAll(".mtu .chip").forEach((x) => x.setAttribute("aria-pressed", x === c)); $("#mtubox").innerHTML = mTuitionBars(); }));
  wireMoney();
  wireDebtChart();
};
