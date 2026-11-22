/* ============================================================
   MED SCHOOL PREP: the profile's "Med school" tab for pre-meds.
   Every Canadian MD program, grouped by province and application system,
   with each school's deadlines for the chosen application cycle, a personal
   deadline list for the schools you pick, a checklist and a school tracker.
   Saved in user_prefs.med.

   Dates: the 2026–27 cycle (start 2027) comes from each school's posted dates
   and the AFMC "Admission Requirements of Canadian Faculties of Medicine 2027".
   Later cycles reuse last cycle's dates, marked "expected", until schools post
   new ones. To add posted dates for a cycle, put them in that school's
   ev2028 (same shape as ev).
   ============================================================ */
const MED_SRC = "https://www.afmc.ca/wp-content/uploads/2026/05/Admission_Requirements_of_Canadian_Faculties_of_Medicine_EN_2027_May_5.pdf";
// Cycle key = the year classes start. Applications run the year before.
const MED_CYCLES = { 2027: "2026–27 cycle · start 2027", 2028: "2027–28 cycle · start 2028" };
const MED_BASE = 2027; // the cycle whose dates are posted

const MED_PROV = [
  ["on", "Ontario", "One application, OMSAS",
    "All seven Ontario schools share one application through OMSAS: a $220 service fee plus $135 per school. It has your Autobiographical Sketch (activities, each with a verifier), three confidential references and your transcripts, all due October 1 at 4:30 p.m. ET. Each school then scores it its own way: some need the MCAT or Casper, some neither. First-round offers all go out on the same day in May, and you can hold only one Ontario offer at a time."],
  ["qc", "Quebec", "Each school's own form",
    "Apply to each school separately on its own site. University applicants apply by November 1; CEGEP students by March 1. Every Quebec school needs Casper and none uses the MCAT (McGill won't accept it). Laval and Montréal share one interview day (the MEM) in April. The French-language schools need French proficiency, and McGill expects working French for clinical training. Most seats go to Quebec residents."],
  ["atl", "Atlantic", "Memorial and Dalhousie, separate forms",
    "Newfoundland and Labrador: Memorial has its own online system and the earliest deadline in Canada (late August). Its UPEI campus in Charlottetown has seats for PEI residents, applied for through Memorial’s PEI pool. Nova Scotia, New Brunswick and PEI: Dalhousie takes Maritime residents through a two-part online application (Section 1 in July, Section 2 in early September). Francophone New Brunswickers can also apply to Sherbrooke’s Moncton site and to Montréal under the New Brunswick agreement."],
  ["pr", "Prairies", "Each school's own form",
    "Manitoba, Saskatchewan, Alberta and Calgary each run their own online application, all due around October 1. Each saves most seats for its own province's residents (85–95%), so out-of-province applicants compete for a small pool, often with a higher MCAT bar."],
  ["bc", "British Columbia", "UBC and SFU, separate forms",
    "UBC's online application closes in mid-September, the earliest in Western Canada, and only a small share of seats go to applicants from outside BC. SFU’s new school in Surrey has its own application, due in early October, for Canadian citizens and permanent residents."],
];

// Shared OMSAS dates (shown once for all your Ontario schools)
const MED_OMSAS = [
  { k: "open", t: "OMSAS opens", d: "2026-07-09" },
  { k: "due", opt: 1, t: "OMSAS fee waiver program closes", n: "Covers up to three Ontario schools if applying is a financial burden. Apply through the AFMC.", d: "2026-08-21" },
  { k: "due", t: "OMSAS application due", n: "Application, Autobiographical Sketch, transcript requests, references and fees, by 4:30 p.m. ET. Ask referees by mid-September.", d: "2026-10-01", main: 1 },
  { k: "offer", t: "First-round Ontario offers", n: "Same day for every Ontario school. You can hold one Ontario offer at a time.", d: "2027-05-11" },
  { k: "after", t: "Final transcripts to OMSAS", n: "For anyone holding an offer.", d: "2027-06-30" },
];

// tests: m = MCAT ("y", "cars" = CARS only, "n"), c = Casper (true/false). seats = first-year places.
const MED_SCHOOLS = [
  // ---- Ontario (OMSAS)
  { id: "uoft", name: "University of Toronto", short: "Toronto", prov: "on", city: "Toronto and Mississauga", sys: "OMSAS", seats: 305, m: "y", c: false,
    tests: "MCAT, at least 125 in each section (124 allowed in one). No Casper.", int: "Virtual modified personal interview (MPI), February to March.", who: "Canadian citizens and permanent residents.", url: "https://applymd.utoronto.ca/",
    ev: [{ k: "int", t: "Interviews (virtual MPI)", when: "Feb–Mar 2027", d: "2027-02-15" }] },
  { id: "mac", name: "McMaster University", short: "McMaster", prov: "on", city: "Hamilton, Kitchener-Waterloo, St. Catharines", sys: "OMSAS", seats: 217, m: "cars", c: true,
    tests: "MCAT: only CARS counts, at least 123. Casper required.", int: "Virtual MMI, March to April.", who: "Canadian citizens and permanent residents. 3-year program.", url: "https://mdprogram.mcmaster.ca/md-program-admissions",
    ev: [{ k: "int", t: "Interviews (virtual MMI)", when: "Mar–Apr 2027", d: "2027-03-20" }] },
  { id: "western", name: "Western University (Schulich)", short: "Western", prov: "on", city: "London and Windsor", sys: "OMSAS", seats: 187, m: "y", c: false,
    tests: "MCAT, written by the October 1 deadline. No Casper.", int: "Virtual panel interview, February to March.", who: "Canadian citizens and permanent residents.", url: "https://www.schulich.uwo.ca/med-dent-admissions/medicine/",
    ev: [{ k: "int", t: "Interviews (virtual panel)", when: "Feb–Mar 2027", d: "2027-02-15" }] },
  { id: "queens", name: "Queen's University", short: "Queen's", prov: "on", city: "Kingston and Lakeridge Health", sys: "OMSAS", seats: 140, m: "y", c: true,
    tests: "MCAT within five years of the deadline. Casper required. Minimum cumulative GPA 3.0 to apply.", int: "Virtual MMI and panel, January to March.", who: "Canadian citizens and permanent residents.", url: "https://meds.queensu.ca/academics/undergraduate/prospective-students",
    ev: [{ k: "int", t: "Interviews (virtual MMI and panel)", when: "Jan–Mar 2027", d: "2027-02-01" }] },
  { id: "ottawa", name: "University of Ottawa", short: "Ottawa", prov: "on", city: "Ottawa · English or French stream", sys: "OMSAS", seats: 183, m: "n", c: false,
    tests: "No MCAT. No Casper.", int: "Panel interview, February to March. About 600 invited.", who: "Canadian citizens, permanent residents and Convention refugees. 95% of seats for Ontario applicants.", url: "https://med.uottawa.ca/undergraduate/admissions",
    ev: [{ k: "int", t: "Interviews (panel)", when: "Feb–Mar 2027", d: "2027-02-15" }] },
  { id: "nosm", name: "NOSM University", short: "NOSM", prov: "on", city: "Sudbury and Thunder Bay", sys: "OMSAS", seats: 88, m: "n", c: false,
    tests: "No MCAT. No Casper. Francophone stream needs spoken French.", int: "Virtual asynchronous MMI and a live panel, late February to early March.", who: "Canadian citizens and permanent residents. Favours Northern Ontario, rural, Indigenous and Francophone applicants.", url: "https://www.nosm.ca/education/md-program/admissions/",
    ev: [{ k: "int", t: "Interviews (MMI and panel)", when: "Late Feb–early Mar 2027", d: "2027-02-25" }] },
  { id: "tmu", name: "Toronto Metropolitan University", short: "TMU", prov: "on", city: "Brampton", sys: "OMSAS", seats: 94, m: "n", c: false,
    tests: "No MCAT. No Casper. Online asynchronous assessment through Kira Talent.", int: "Virtual MMI (Talking Circle for the Indigenous pathway).", who: "Canadian citizens, permanent residents and Convention refugees. At least 95% of seats for Ontario residents.", url: "https://www.torontomu.ca/school-of-medicine/programs/md/md-admissions/",
    ev: [{ k: "due", t: "Book your TMU interview", n: "By 11:59 p.m. ET.", d: "2027-02-21" }, { k: "int", t: "TMU interviews", n: "February 27–28 and March 6–7.", d: "2027-02-27", end: "2027-03-07" }] },
  // ---- Quebec
  { id: "mcgill", name: "McGill University (MDCM)", short: "McGill", prov: "qc", city: "Montréal and Outaouais", sys: "McGill application", seats: 250, m: "n", c: true,
    tests: "Casper required, written before the deadline. McGill does not accept the MCAT.", int: "Virtual MMI on Zoom, February 16–19, 2027. Invitations January 25.", who: "Mostly Quebec residents. A few seats for other Canadians (about 5) and international students.", url: "https://www.mcgill.ca/medadmissions/",
    ev: [{ k: "open", t: "McGill application opens", d: "2026-09-01" }, { k: "test", t: "Last Casper date McGill accepts", n: "October 15 in English, October 22 in French.", d: "2026-10-15" }, { k: "due", t: "McGill MDCM application due", d: "2026-11-01", main: 1 }, { k: "int", t: "McGill interview invitations", d: "2027-01-25" }, { k: "int", t: "McGill interviews (virtual MMI)", d: "2027-02-16", end: "2027-02-19" }, { k: "offer", t: "McGill offers (planned)", d: "2027-04-01" }] },
  { id: "mcgillp", name: "McGill University (Med-P, from CEGEP)", short: "McGill Med-P", prov: "qc", city: "Montréal and Outaouais", sys: "McGill application", seats: 93, m: "n", c: true,
    tests: "Casper required. French proficiency (B2 for Montréal, C1 for Outaouais).", int: "Virtual MMI on Zoom, April 20–23, 2027. Invitations March 31.", who: "Quebec residents finishing CEGEP only. Adds a preparatory year before the MD.", url: "https://www.mcgill.ca/medadmissions/",
    ev: [{ k: "test", t: "Last Casper date for Med-P", d: "2027-02-18" }, { k: "due", t: "McGill Med-P application due", d: "2027-03-01", main: 1 }, { k: "int", t: "Med-P interview invitations", d: "2027-03-31" }, { k: "int", t: "Med-P interviews (virtual MMI)", d: "2027-04-20", end: "2027-04-23" }, { k: "offer", t: "Med-P offers", when: "May 2027", d: "2027-05-15" }] },
  { id: "udem", name: "Université de Montréal", short: "Montréal", prov: "qc", city: "Montréal and Mauricie · French", sys: "UdeM application", seats: 390, m: "n", c: true,
    tests: "Casper required. French proficiency test if you don’t have a French CEGEP or francophone university diploma.", int: "MEM interview in person, April 17–18 (shared with Laval).", who: "Mostly Quebec residents, plus a few New Brunswick agreement and Indigenous seats. About 390 Quebec places across the preparatory year and the MD.", url: "https://admission.umontreal.ca/programmes/doctorat-en-medecine/",
    ev: [{ k: "open", t: "Montréal application opens", d: "2026-08-01" }, { k: "due", t: "Montréal application due (university applicants)", d: "2026-11-01", main: 1, uni: 1 }, { k: "due", t: "Montréal application due (CEGEP applicants)", d: "2027-03-01", cegep: 1 }, { k: "due", opt: 1, t: "Site-choice form for the regional family medicine track", d: "2027-01-30" }, { k: "int", t: "MEM interviews (Montréal and Laval)", d: "2027-04-17", end: "2027-04-18" }, { k: "offer", t: "Montréal offers", d: "2027-05-15" }] },
  { id: "laval", name: "Université Laval", short: "Laval", prov: "qc", city: "Québec City · French", sys: "Laval application", seats: 316, m: "n", c: true,
    tests: "Casper required. French proficiency.", int: "MEM interview, April 17–18, at Laval or Montréal.", who: "Mostly Quebec residents, plus small allocations for other Canadians and New Brunswick.", url: "https://www.ulaval.ca/etudes/programmes/doctorat-en-medecine",
    ev: [{ k: "open", t: "Laval application opens", d: "2026-08-15" }, { k: "due", t: "Laval application due (university applicants)", d: "2026-11-01", main: 1, uni: 1 }, { k: "due", t: "Laval application due (CEGEP applicants)", d: "2027-03-01", cegep: 1 }, { k: "int", t: "MEM interviews (Laval and Montréal)", d: "2027-04-17", end: "2027-04-18" }, { k: "offer", t: "Laval offers", when: "Mid-May 2027", d: "2027-05-15" }] },
  { id: "sherb", name: "Université de Sherbrooke", short: "Sherbrooke", prov: "qc", city: "Sherbrooke, Saguenay, Moncton (NB) · French", sys: "Sherbrooke application", seats: 238, m: "n", c: true,
    tests: "Casper required. French proficiency.", int: "Virtual MEM interview, April 19, 20 and 27, 2027. Invitations usually in early April.", who: "Mostly Quebec residents. 28 seats for Atlantic (francophone New Brunswick) applicants at the Moncton site.", url: "https://www.usherbrooke.ca/admission/programme/7/doctorat-en-medecine",
    ev: [{ k: "open", t: "Sherbrooke application opens", d: "2026-09-01" }, { k: "due", t: "Sherbrooke application due (university applicants)", d: "2026-11-01", main: 1, uni: 1 }, { k: "due", t: "Sherbrooke application due (CEGEP applicants)", d: "2027-03-01", cegep: 1 }, { k: "int", t: "Sherbrooke interviews (virtual MEM)", n: "April 19, 20 and 27.", d: "2027-04-19", end: "2027-04-27" }, { k: "offer", t: "Sherbrooke offers", when: "May–Aug 2027", d: "2027-05-15" }] },
  // ---- Atlantic
  { id: "mun", name: "Memorial University", short: "Memorial", prov: "atl", city: "St. John's, plus the UPEI campus in Charlottetown", sys: "Memorial application", seats: 110, m: "y", c: true,
    tests: "MCAT (written by August 22, no minimum; 505 recommended). Casper required.", int: "Online MMI and competency assessment.", who: "Canadian citizens and permanent residents. 84 seats for Newfoundland and Labrador, 20 for PEI residents (UPEI campus), 6 for other provinces.", url: "https://www.mun.ca/medicine/admissions/",
    ev: [{ k: "open", t: "Memorial application opens", d: "2026-06-24" }, { k: "test", t: "Last MCAT date for Memorial", d: "2026-08-22" }, { k: "due", t: "Memorial application due", n: "11:59 p.m. Newfoundland time.", d: "2026-08-26", main: 1 }, { k: "test", t: "Release MCAT and Casper scores to Memorial", d: "2026-09-24" }, { k: "int", t: "Memorial interviews (online MMI)", when: "Winter 2027", d: "2027-01-20" }, { k: "offer", t: "Memorial offers", when: "Mar–Jun 2027", d: "2027-03-30" }] },
  { id: "dal", name: "Dalhousie University", short: "Dalhousie", prov: "atl", city: "Halifax, Saint John (NB), Cape Breton", sys: "Dalhousie application", seats: 169, m: "y", c: true,
    tests: "MCAT (minimum on a sliding scale with GPA). Casper required, used to pick interviews.", int: "Virtual MMI, November 28–29, 2026. Invitations by email in November.", who: "Maritime residents (Nova Scotia, New Brunswick, PEI). Seats are split by province of residence.", url: "https://medicine.dal.ca/departments/core-units/admissions.html",
    ev: [{ k: "open", t: "Dalhousie application opens", d: "2026-06-15" }, { k: "due", t: "Dalhousie Section 1 due", n: "11:59 p.m. Atlantic.", d: "2026-07-31" }, { k: "due", t: "Dalhousie Section 2 and transcripts due", d: "2026-09-03", main: 1 }, { k: "int", t: "Dalhousie interviews (virtual MMI)", d: "2026-11-28", end: "2026-11-29" }, { k: "offer", t: "Dalhousie decision letters", n: "Subject to change.", d: "2027-03-31" }] },
  // ---- Prairies
  { id: "umanitoba", name: "University of Manitoba (Max Rady)", short: "Manitoba", prov: "pr", city: "Winnipeg", sys: "UM application", seats: 140, m: "y", c: true,
    tests: "MCAT written by September 13. Casper required, with a minimum score.", int: "Virtual MMI, February to March (in-person panel for the Indigenous pool).", who: "Canadian citizens and permanent residents. About 95% Manitobans, up to 5% from other provinces.", url: "https://umanitoba.ca/explore/undergraduate-admissions/requirements/medicine",
    ev: [{ k: "open", t: "Manitoba application opens", d: "2026-08-15" }, { k: "test", t: "Last MCAT date for Manitoba", d: "2026-09-13" }, { k: "due", t: "Manitoba application due", d: "2026-10-01", main: 1 }, { k: "int", t: "Manitoba interviews", when: "Feb–Mar 2027", d: "2027-02-15" }, { k: "offer", t: "Manitoba offers", when: "May 2027", d: "2027-05-15" }] },
  { id: "usask", name: "University of Saskatchewan", short: "Saskatchewan", prov: "pr", city: "Saskatoon and Regina", sys: "USask application", seats: 128, m: "y", c: true,
    tests: "MCAT in one sitting before the deadline. Casper required. An Indigenous studies course is a prerequisite.", int: "Virtual MMI, panel and Conversation Circle.", who: "Canadian citizens and permanent residents, with weight on Saskatchewan and rural connection.", url: "https://medicine.usask.ca/admission-to-the-md-program/how-to-apply.php",
    ev: [{ k: "open", t: "Saskatchewan application opens", d: "2026-08-01" }, { k: "due", t: "Saskatchewan application due", d: "2026-10-01", main: 1 }, { k: "int", t: "Saskatchewan interviews", when: "Winter 2027", d: "2027-02-15" }, { k: "offer", t: "Saskatchewan offers", d: "2027-05-15" }] },
  { id: "ualberta", name: "University of Alberta", short: "Alberta", prov: "pr", city: "Edmonton", sys: "UAlberta Launchpad", seats: 192, m: "y", c: false,
    tests: "MCAT, at least 124 in every section (non-Albertans need 128 in CARS). No Casper. No prerequisite courses.", int: "Virtual MMI and panel, plus a rural panel.", who: "85% of seats for Albertans (90% from the 2027–28 cycle). No international students.", url: "https://www.ualberta.ca/medicine/programs/md/",
    ev: [{ k: "open", t: "Alberta application opens", d: "2026-07-01" }, { k: "test", t: "Last MCAT date for Alberta", d: "2026-08-28" }, { k: "due", t: "Alberta application due", n: "Application, checklist items, references and transcripts by 1:00 p.m. MT.", d: "2026-10-02", main: 1 }, { k: "int", t: "Alberta interviews", when: "Winter 2027", d: "2027-02-15" }, { k: "offer", t: "Alberta offers", when: "May 2027", d: "2027-05-15" }] },
  { id: "ucalgary", name: "University of Calgary (Cumming)", short: "Calgary", prov: "pr", city: "Calgary · 3-year program", sys: "UCalgary UCAN", seats: 185, m: "y", c: false,
    tests: "MCAT released by the deadline (out-of-province needs 128 in CARS). No Casper. Indigenous education requirement.", int: "In-person MMI, February to March.", who: "90% of seats for Albertans. Canadian citizens and permanent residents.", url: "https://cumming.ucalgary.ca/mdprogram/future-students/admissions",
    ev: [{ k: "open", t: "Calgary application opens", d: "2026-07-01" }, { k: "due", t: "Calgary application due", n: "Application, MCAT release, three references and the Indigenous education requirement by 4:00 p.m. MT.", d: "2026-10-01", main: 1 }, { k: "int", t: "Calgary interviews (in-person MMI)", when: "Feb–Mar 2027", d: "2027-02-20" }, { k: "offer", t: "Calgary offers", d: "2027-05-15" }] },
  // ---- British Columbia
  { id: "ubc", name: "University of British Columbia", short: "UBC", prov: "bc", city: "Vancouver, Victoria, Prince George, Kelowna", sys: "UBC OAS", seats: 328, m: "y", c: false,
    tests: "MCAT, scores in by October 15. No Casper. English and other prerequisites done by April 30 of the entry year.", int: "In-person MMI, January to February; virtual panels for the Northern and Rural pathway.", who: "Canadian citizens and permanent residents. At most 33 seats for out-of-province applicants.", url: "https://mdprogram.med.ubc.ca/admissions/",
    ev: [{ k: "open", t: "UBC application opens", d: "2026-06-30" }, { k: "due", t: "UBC application due", n: "Application and transcripts.", d: "2026-09-15", main: 1 }, { k: "test", t: "UBC MCAT score deadline", d: "2026-10-15" }, { k: "due", t: "Book your UBC interview", when: "Mid-Dec 2026", d: "2026-12-15" }, { k: "int", t: "UBC interviews (MMI)", when: "Jan–Feb 2027", d: "2027-01-30" }, { k: "offer", t: "UBC offers", when: "May 2027", d: "2027-05-15" }] },
  { id: "sfu", name: "Simon Fraser University", short: "SFU", prov: "bc", city: "Surrey", sys: "SFU ApplyMD", seats: 64, m: "?", c: false,
    tests: "Check SFU’s applicant manual for test requirements.", int: "In-person MMI at SFU Burnaby, March 13–14. Five character references if you’re invited.", who: "Canadian citizens and permanent residents only.", url: "https://www.sfu.ca/medicine/admissions.html",
    ev: [{ k: "open", t: "SFU application opens", when: "Jul 2026", d: "2026-07-15" }, { k: "due", t: "SFU application due", n: "Application, proof of residency and citizenship, and transcripts by 3:00 p.m. PT.", d: "2026-10-07", main: 1 }, { k: "int", t: "SFU interviews (in-person MMI)", d: "2027-03-13", end: "2027-03-14" }, { k: "offer", t: "SFU offers", when: "May 2027", d: "2027-05-15" }] },
];

const MED_CASPER = ["2026-07-19", "2026-08-11", "2026-08-27", "2026-09-10", "2026-09-22", "2026-10-03", "2026-10-15", "2026-11-29", "2026-12-01", "2027-01-07", "2027-02-18"];
const MED_TODO = [
  ["list", "Pick the schools you’ll apply to"],
  ["mcatbook", "Book the MCAT"],
  ["mcat", "Write the MCAT"],
  ["casperbook", "Book Casper"],
  ["casper", "Write Casper and send scores"],
  ["refs", "Ask your referees"],
  ["trans", "Order transcripts"],
  ["abs", "Draft activities and Autobiographical Sketch"],
  ["verif", "Line up verifiers for your activities"],
  ["essays", "Write essays and short answers"],
  ["waiver", "Check fee waivers"],
  ["interview", "Practise MMI and panel interviews"],
];
const MED_STATUS = [
  ["plan", "Planning"],
  ["applied", "Applied"],
  ["interview", "Interview"],
  ["offer", "Offer"],
  ["wait", "Waitlist"],
  ["no", "Not this cycle"],
];

// Default cycle: until applications close (November 1), the cycle whose applications are open; after that, the next one
function medDefaultCycle() {
  const now = new Date();
  const y = now.getFullYear() + (now > new Date(now.getFullYear() + "-11-01T23:59:00") ? 2 : 1);
  return MED_CYCLES[y] ? y : y < MED_BASE ? MED_BASE : +Object.keys(MED_CYCLES).pop();
}
function medState() {
  const M = (Acct.prefs.med = Acct.prefs.med && typeof Acct.prefs.med === "object" ? Acct.prefs.med : {});
  if (!MED_CYCLES[M.cycle]) M.cycle = medDefaultCycle();
  M.mine = M.mine && typeof M.mine === "object" ? M.mine : {};
  Object.keys(M.mine).forEach((k) => !MED_SCHOOLS.some((s) => s.id === k) && delete M.mine[k]);
  M.todo = M.todo || {};
  M.custom = Array.isArray(M.custom) ? M.custom : [];
  M.prov = M.prov || "all";
  return M;
}
// A cycle's events. Posted dates for that cycle win; otherwise last cycle's dates move forward a year and are marked expected.
function medShift(e, by) {
  if (!by) return e;
  const mv = (s) => (s ? String(+s.slice(0, 4) + by) + s.slice(4) : s);
  return Object.assign({}, e, { d: mv(e.d), end: mv(e.end), when: e.when ? e.when.replace(/\b(20\d\d)\b/g, (y) => +y + by) : e.when, est: true });
}
function medEvents(src, cycle) {
  if (src["ev" + cycle]) return src["ev" + cycle];
  return (src.ev || []).map((e) => medShift(e, cycle - MED_BASE));
}
const medOmsas = (cycle) => medEvents({ ev: MED_OMSAS }, cycle);
const medSchool = (id) => MED_SCHOOLS.find((s) => s.id === id);
const medToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
const medPast = (e) => prepDay(e.end || e.d) < medToday();
const medMain = (s, cycle) => (s.sys === "OMSAS" ? medOmsas(cycle) : medEvents(s, cycle)).find((e) => e.main);
const medDate = (e, o) => (e.when ? e.when : prepFmt(e.d, o || { month: "short", day: "numeric", year: "numeric" }) + (e.end ? " – " + prepFmt(e.end, { month: "short", day: "numeric" }) : ""));
const medIn = (e) => {
  const n = Math.round((prepDay(e.d) - medToday()) / 864e5);
  return n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
};

// Your deadline list: events for the schools you picked (OMSAS dates once, labelled with your Ontario schools)
function medTimeline(M) {
  const ids = Object.keys(M.mine).filter((k) => M.mine[k].st !== "no");
  const picked = ids.map(medSchool).filter(Boolean);
  const list = [];
  const on = picked.filter((s) => s.sys === "OMSAS");
  if (on.length) medOmsas(M.cycle).forEach((e) => list.push(Object.assign({}, e, { who: "OMSAS · " + on.map((s) => s.short).join(", "), sid: "omsas" })));
  // Quebec schools have one deadline for university applicants and a later one for CEGEP students: show only yours
  picked.forEach((s) => medEvents(s, M.cycle).filter((e) => (M.cegep ? !e.uni : !e.cegep)).forEach((e) => list.push(Object.assign({}, e, { who: s.short, sid: s.id }))));
  // interview dates you entered
  picked.forEach((s) => {
    const d = M.mine[s.id].date;
    if (d) list.push({ k: "mine", t: `Your ${s.short} interview`, d, who: s.short, sid: s.id });
  });
  return list.sort((a, b) => a.d.localeCompare(b.d));
}
function medIcs(e) {
  const d = (x) => x.replace(/-/g, "");
  const end = new Date(prepDay(e.end || e.d).getTime() + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Project UltraViolet//Med school prep//EN", "BEGIN:VEVENT", `UID:med-${(e.sid || "x") + "-" + d(e.d)}-${(e.t || "").length}@projectuv.com`, `DTSTART;VALUE=DATE:${d(e.d)}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${(e.t || "").replace(/[,;]/g, " ")}`, `DESCRIPTION:${(e.n || e.who || "").replace(/[,;]/g, " ")}${e.est ? " (expected date)" : ""}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
}
const MED_KIND = { open: "Opens", due: "Deadline", test: "Test", int: "Interviews", offer: "Offers", after: "After offers", mine: "Your interview" };

/* Profile overview card for pre-meds */
function medCard() {
  const M = medState();
  const tl = medTimeline(M).filter((e) => !e.when && !medPast(e) && e.k !== "open");
  const next = tl[0];
  const n = Object.keys(M.mine).filter((k) => M.mine[k].st !== "no").length;
  const days = next ? Math.round((prepDay(next.d) - medToday()) / 864e5) : null;
  return `<a class="hubcard hubwide hubprep" href="#account/med-school" data-gotab="med-school"><span class="hpl"><span class="prepkick">Med school prep · ${MED_CYCLES[M.cycle].split(" · ")[0]}</span><b>${next ? acctEsc(next.t) : n ? "No dates coming up" : "Pick your schools"}</b><small>${next ? prepFmt(next.d, { weekday: "short", month: "short", day: "numeric" }) + (next.est ? " (expected)" : "") + " · " : ""}${n} school${n === 1 ? "" : "s"} on your list</small></span>${next ? `<span class="hpc"><b>${days <= 0 ? "Today" : days}</b><small>${days <= 0 ? "" : days === 1 ? "day" : "days"}</small></span>` : ""}<span class="btn hpgo">Open →</span></a>`;
}

/* The Med school tab */
function medSchoolCards() {
  const M = medState();
  const cyc = M.cycle, est = cyc !== MED_BASE;
  const mineIds = Object.keys(M.mine);
  const active = mineIds.filter((k) => M.mine[k].st !== "no");
  const tl = medTimeline(M);
  const upcoming = tl.filter((e) => !medPast(e));
  const allMain = () => {
    const r = MED_SCHOOLS.filter((s) => s.sys !== "OMSAS").map((s) => Object.assign({}, medMain(s, cyc), { who: s.short, sid: s.id }));
    r.push(Object.assign({}, medOmsas(cyc).find((e) => e.main), { who: "All seven Ontario schools", sid: "omsas" }));
    return r.sort((a, b) => a.d.localeCompare(b.d));
  };
  const next = (active.length ? upcoming : allMain().filter((e) => !medPast(e))).find((e) => !e.when && e.k !== "open" && !e.opt);
  const days = next ? Math.round((prepDay(next.d) - medToday()) / 864e5) : null;
  const dueLeft = upcoming.filter((e) => e.k === "due").length;
  const ints = active.filter((k) => M.mine[k].date).length;

  const cycleSel = `<label class="prepyear">Application cycle <select data-medcycle>${Object.keys(MED_CYCLES).map((y) => `<option value="${y}"${+y === cyc ? " selected" : ""}>${MED_CYCLES[y]}</option>`).join("")}</select></label>`;
  const bar = `<div class="prepinbar"><span class="prepinsub">${est ? `Expected dates, based on the ${MED_CYCLES[MED_BASE].split(" · ")[0]}. We update them as schools post the new cycle.` : "Dates posted by each school · saves to your account"}</span>${cycleSel}</div>`;

  const hero = next
    ? `<section class="prephero"><div class="prephl"><span class="prepkick">${active.length ? "Your next date" : "Next date anywhere in Canada"}${next.est ? " · expected" : ""}</span><h2>${acctEsc(next.t)}</h2>
      <p>${prepFmt(next.d, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${next.end ? ` to ${prepFmt(next.end, { month: "long", day: "numeric" })}` : ""}. ${next.n ? acctEsc(next.n) : ""}</p>
      <div class="hubrow"><a class="btn" href="${medIcs(next)}" download="med-${next.sid}.ics">${pIco("cal")}Add to calendar</a></div></div>
      <div class="prephr"><div class="prepcount"><b>${days <= 0 ? "Today" : days}</b><span>${days <= 0 ? "" : days === 1 ? "day left" : "days left"}</span></div>
      <ul class="prepmini"><li><i class="${active.length ? "" : "off"}"></i>${active.length} school${active.length === 1 ? "" : "s"} on your list</li><li><i class="${dueLeft ? "" : "off"}"></i>${dueLeft} deadline${dueLeft === 1 ? "" : "s"} ahead</li><li><i class="${ints ? "" : "off"}"></i>${ints} interview${ints === 1 ? "" : "s"} scheduled</li></ul></div></section>`
    : `<section class="prephero"><div class="prephl"><span class="prepkick">${MED_CYCLES[cyc]}</span><h2>${active.length ? "No dates left this cycle" : "Pick your schools"}</h2><p>${active.length ? "Every date for your schools has passed. Switch to the next cycle above to plan ahead." : "Tick schools in the list below to build your own deadline list and countdown."}</p></div></section>`;

  // Your deadlines (or, with no schools picked, every main deadline)
  let rows = tl;
  let head = "Your deadlines";
  if (!active.length) {
    head = "Every application deadline";
    rows = allMain();
  }
  let nowSet = false;
  const tlHtml = rows
    .map((e) => {
      let st = medPast(e) ? "done" : "next";
      if (st === "next" && !nowSet && !e.when && e.k !== "open" && !e.opt) {
        st = "now";
        nowSet = true;
      }
      return `<li class="st-${st}"><span class="ptdot">${st === "done" ? pIco("check") : st === "now" ? "!" : ""}</span>
      <span class="ptbody"><b>${acctEsc(e.t)}</b><small><span class="medkind k-${e.k}">${MED_KIND[e.k] || ""}</span>${e.who && !e.t.includes(e.who) ? acctEsc(e.who) + ". " : ""}${e.n ? acctEsc(e.n) : ""}${e.est && !est ? ` <span class="medest">expected</span>` : ""}</small></span>
      <span class="ptdate">${medDate(e, { month: "short", day: "numeric" })}</span></li>`;
    })
    .join("");
  const tlCard = `<section class="prepcard"><div class="prephead"><h2>${head}</h2><span>${MED_CYCLES[cyc].split(" · ")[0]}</span></div>
    ${active.some((k) => medSchool(k).prov === "qc") ? `<label class="ptmanual medcegep"><input type="checkbox" data-medcegep${M.cegep ? " checked" : ""}> I’m applying from CEGEP (shows Quebec’s March 1 deadlines instead of November 1)</label>` : ""}
    ${active.length ? "" : `<p class="note medtip">Tick schools below to swap this for your own list, with interviews, offers and test deadlines.</p>`}
    <ol class="preptl medtl">${tlHtml}</ol>
    <p class="note">From each school’s admissions site and the <a href="${MED_SRC}" target="_blank" rel="noopener">AFMC admission requirements ↗</a>. Schools can change dates, so confirm on their sites before you submit.</p></section>`;

  const todoAll = MED_TODO.map(([id, t]) => ({ id, t, done: !!M.todo[id], own: false })).concat(M.custom.map((c) => ({ id: c.id, t: c.t, done: !!c.done, own: true })));
  const todoDone = todoAll.filter((t) => t.done).length;
  const todo = `<section class="prepcard"><div class="prephead"><h2>My checklist</h2><span>${todoDone} of ${todoAll.length}</span></div>
    <div class="preptodo">${todoAll.map((t) => `<label class="${t.done ? "done" : ""}"><input type="checkbox" data-medtodo="${t.id}"${t.own ? ' data-own="1"' : ""}${t.done ? " checked" : ""}><span>${acctEsc(t.t)}</span>${t.own ? `<button type="button" class="prepx" data-meddeltodo="${t.id}" aria-label="Remove ${acctEsc(t.t)}">${pIco("x")}</button>` : ""}</label>`).join("")}</div>
    <form class="prepadd" data-medaddtodo><label class="sr" for="m_todo">Add your own item</label><input id="m_todo" type="text" maxlength="80" placeholder="Add your own item"><button class="tbtn" type="submit">Add</button></form></section>`;

  // Tests: which of your schools need what, and Casper dates
  const pool = active.length ? active.map(medSchool) : MED_SCHOOLS;
  const mcatY = pool.filter((s) => s.m === "y" || s.m === "cars"), casY = pool.filter((s) => s.c);
  const casper = MED_CASPER.map((d) => medShift({ d }, cyc - MED_BASE));
  const casNext = casper.filter((e) => !medPast(e));
  const tests = `<section class="prepcard medtests"><div class="prephead"><h2>Tests</h2><span>${active.length ? "for your schools" : "across Canada"}</span></div>
    <div class="medtest"><b>MCAT</b><small>${mcatY.length ? `Needed for ${mcatY.map((s) => s.short + (s.m === "cars" ? " (CARS only)" : "")).join(", ")}.` : "None of your schools uses it."} Most schools take sittings up to late August or early September of the application year, so plan to write it by the summer.</small></div>
    <div class="medtest"><b>Casper</b><small>${casY.length ? `Needed for ${casY.map((s) => s.short).join(", ")}.` : "None of your schools needs it."} Results count for one cycle only. Take Canada Casper 2 (English) or Canada Casper 2 (Français).</small>
    ${casY.length ? `<div class="medchips">${(casNext.length ? casNext : casper).slice(0, 8).map((e) => `<span>${prepFmt(e.d, { month: "short", day: "numeric" })}</span>`).join("")}</div><small>${est ? "Expected dates, based on last cycle." : casNext.length ? "Upcoming test dates." : "This cycle’s test dates have passed."} Book at <a href="https://acuityinsights.app/" target="_blank" rel="noopener">acuityinsights.app ↗</a></small>` : ""}</div></section>`;

  // All schools, by province
  const provs = MED_PROV.filter(([k]) => M.prov === "all" || M.prov === k);
  const chips = `<div class="medfilter" role="group" aria-label="Province">${[["all", "All"]].concat(MED_PROV.map(([k, n]) => [k, n])).map(([k, n]) => `<button type="button" class="chip" data-medprov="${k}" aria-pressed="${M.prov === k}">${n}</button>`).join("")}</div>`;
  const schoolRow = (s) => {
    const mn = medMain(s, cyc), on = !!M.mine[s.id];
    const evs = (s.sys === "OMSAS" ? medOmsas(cyc) : []).concat(medEvents(s, cyc)).sort((a, b) => a.d.localeCompare(b.d));
    const mtag = s.m === "y" ? "MCAT" : s.m === "cars" ? "MCAT (CARS)" : s.m === "n" ? "No MCAT" : "";
    return `<div class="medrow${on ? " on" : ""}"><label class="medpick"><input type="checkbox" data-medadd="${s.id}"${on ? " checked" : ""}><span class="sr">Add ${acctEsc(s.name)} to my schools</span></label>
      <details><summary><span class="medname"><a class="medgo" href="#school-${s.id}" title="Open the ${acctEsc(s.short)} page">${acctEsc(s.name)}<span aria-hidden="true"> →</span></a><small>${acctEsc(s.city)} · ${s.seats} seats</small></span>
      <span class="meddue${medPast(mn) ? " past" : ""}"><b>${prepFmt(mn.d, { month: "short", day: "numeric", year: "numeric" })}</b><small>${medPast(mn) ? "Closed" : "Due " + medIn(mn)}${mn.est ? " · expected" : ""}</small></span>
      <span class="medtags">${mtag ? `<i class="${s.m === "n" ? "no" : ""}">${mtag}</i>` : ""}<i class="${s.c ? "" : "no"}">${s.c ? "Casper" : "No Casper"}</i></span></summary>
      <div class="medmore"><dl><dt>Apply through</dt><dd>${acctEsc(s.sys)}</dd><dt>Tests</dt><dd>${acctEsc(s.tests)}</dd><dt>Interview</dt><dd>${acctEsc(s.int)}</dd><dt>Who can apply</dt><dd>${acctEsc(s.who)}</dd></dl>
      <ol class="medmini">${evs.map((e) => `<li class="${medPast(e) ? "past" : ""}"><span>${medDate(e, { month: "short", day: "numeric", year: "numeric" })}</span><b>${acctEsc(e.t)}</b>${e.est && !est ? `<em class="medest">expected</em>` : ""}</li>`).join("")}</ol>
      <span class="medlinks"><a class="medlink" href="#school-${s.id}">Full ${acctEsc(s.short)} guide: admissions, cost, city →</a><a class="medlink" href="${s.url}" target="_blank" rel="noopener">Admissions site ↗</a></span></div></details></div>`;
  };
  const all = `<section class="prepcard prepwide medall"><div class="prephead"><h2>Schools and deadlines</h2><span>${MED_SCHOOLS.length} programs · tick to add</span></div>${chips}
    ${provs
      .map(([k, n, sys, blurb]) => {
        const list = MED_SCHOOLS.filter((s) => s.prov === k).sort((a, b) => medMain(a, cyc).d.localeCompare(medMain(b, cyc).d) || a.name.localeCompare(b.name));
        return `<div class="medprov"><div class="medprovhead"><h3>${n}</h3><span>${sys}</span></div><p class="medblurb">${blurb}</p><div class="medrows">${list.map(schoolRow).join("")}</div></div>`;
      })
      .join("")}</section>`;

  // Tracker
  const trows = mineIds
    .map((id) => {
      const s = medSchool(id), me = M.mine[id], mn = medMain(s, cyc);
      return `<tr data-medk="${id}"><td><a class="medgo" href="#school-${id}"><b>${acctEsc(s.name)}</b></a><small>${acctEsc(s.sys)}</small></td>
      <td data-l="Deadline">${prepFmt(mn.d, { month: "short", day: "numeric" })}${mn.est ? "*" : ""}</td>
      <td data-l="Status"><select data-medst aria-label="Status">${MED_STATUS.map(([v, l]) => `<option value="${v}"${(me.st || "plan") === v ? " selected" : ""}>${l}</option>`).join("")}</select></td>
      <td data-l="Interview"><input type="date" data-meddate value="${me.date || ""}" aria-label="Interview date"></td>
      <td><button type="button" class="prepx" data-medrm aria-label="Remove">${pIco("x")}</button></td></tr>`;
    })
    .join("");
  const tracker = `<section class="prepcard prepwide"><div class="prephead"><h2>My schools</h2><span>${active.length} applying</span></div>${
    trows ? `<div class="tw prepttw"><table class="preptable medtable"><thead><tr><th>School</th><th>Deadline</th><th>Status</th><th>Interview</th><th></th></tr></thead><tbody>${trows}</tbody></table></div>${est ? `<p class="note">* Expected date, based on last cycle.</p>` : ""}` : `<p class="prepempty">No schools yet. Tick schools in the list above.</p>`
  }</section>`;

  return `<div class="hubwide hubprepfull"><div class="medintab">${bar}${hero}<div class="prepgrid"><div class="prepcol">${tlCard}</div><div class="prepcol">${todo}${tests}</div></div>${tracker}${all}</div></div>`;
}

function wireMed() {
  const main = $("#main");
  const M = medState();
  const redraw = () => {
    const y = scrollY;
    acctPush();
    renderAccount();
    afterRender();
    scrollTo(0, y);
  };
  const q = (s) => main.querySelectorAll(".medintab " + s);
  q("[data-medcycle]").forEach((el) => (el.onchange = () => ((M.cycle = +el.value), redraw())));
  q("[data-medcegep]").forEach((c) => (c.onchange = () => ((M.cegep = c.checked), redraw())));
  q("[data-medprov]").forEach((b) => (b.onclick = () => ((M.prov = b.dataset.medprov), redraw())));
  q("[data-medadd]").forEach(
    (c) =>
      (c.onchange = () => {
        if (c.checked) (M.mine[c.dataset.medadd] = M.mine[c.dataset.medadd] || { st: "plan", date: "" }), typeof track === "function" && track("save_school", c.dataset.medadd);
        else delete M.mine[c.dataset.medadd];
        if (Object.keys(M.mine).length) M.todo.list = true;
        redraw();
      }),
  );
  q("[data-medtodo]").forEach(
    (c) =>
      (c.onchange = () => {
        if (c.dataset.own) {
          const it = M.custom.find((x) => x.id === c.dataset.medtodo);
          if (it) it.done = c.checked;
        } else M.todo[c.dataset.medtodo] = c.checked;
        redraw();
      }),
  );
  q("[data-meddeltodo]").forEach((b) => (b.onclick = (e) => (e.preventDefault(), (M.custom = M.custom.filter((x) => x.id !== b.dataset.meddeltodo)), redraw())));
  q("[data-medaddtodo]").forEach(
    (f) =>
      (f.onsubmit = (e) => {
        e.preventDefault();
        const v = f.querySelector("input").value.trim();
        if (!v || M.custom.length >= 30) return;
        M.custom.push({ id: "c" + Date.now().toString(36), t: v.slice(0, 80), done: false });
        redraw();
      }),
  );
  q("tr[data-medk]").forEach((tr) => {
    const me = M.mine[tr.dataset.medk];
    tr.querySelector("[data-medst]").onchange = (e) => ((me.st = e.target.value), redraw());
    tr.querySelector("[data-meddate]").onchange = (e) => {
      me.date = e.target.value;
      if (me.date && ["plan", "applied"].includes(me.st)) me.st = "interview";
      redraw();
    };
    tr.querySelector("[data-medrm]").onclick = () => (delete M.mine[tr.dataset.medk], redraw());
  });
}
