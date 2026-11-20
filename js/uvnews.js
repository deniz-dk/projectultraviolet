/* School news for this year and what applicants report, gathered November 2026.
   UV_NEWS: dated stories. w = school ids and/or region codes (on, qc, atl, pr, bc, all) the story applies to.
   tag: "seats" | "admissions" | "interview" | "school" | "money".
   UV_HEARD: what applicants report on forums, by school. k: "Reported" (an applicant's own report in a thread),
   "Official" (the school's own update, quoted by applicants), "Common advice" (repeated forum advice, unverified).
   UV_RESULTS: when last cycle's results actually went out, for the timeline guide. */
const UV_NEWS = [
  // National and multi-school
  { d: "2026-09-01", w: ["on"], tag: "admissions", t: "Ontario schools now keep at least 95% of seats for Ontario residents", b: "Starting with the class that entered in fall 2026, every Ontario medical school must give at least 95% of first-year seats to Ontario residents. The remaining 5% go to applicants from the rest of Canada, which leaves very few seats for out-of-province applicants.", u: "https://baytoday.ca/local-news/ontario-students-to-get-priority-at-med-schools-9709939", src: "BayToday" },
  { d: "2026-07-30", w: ["on"], tag: "seats", t: "Ontario funds York University’s new medical school, opening September 2028", b: "The province is putting $55.8 million into York’s School of Medicine, Canada’s first to focus on family medicine and community primary care. It opens with 80 first-year seats and grows to 240. Ontario will then have eight medical schools.", u: "https://www.yorku.ca/news/2026/07/31/york-university-school-of-medicine-receives-55-8-million-from-ontario-government-to-support-path-to-accreditation-and-2028-launch/", src: "York University" },
  { d: "2026-04-24", w: ["qc"], tag: "school", t: "Quebec’s 2026 residency match left many places unfilled", b: "Quebec’s four faculties called this year’s match results unusual. After the second round, 888 of the 1,008 regular residency places in Quebec were filled. This affects graduates, not admissions, but it is part of the debate over how many doctors Quebec trains.", u: "https://www.usherbrooke.ca/medecine/actualites/nouvelles/details/58342", src: "Université de Sherbrooke" },

  // Ontario
  { d: "2026-02-24", w: ["uoft"], tag: "money", t: "New MD/PhD award at Temerty Medicine", b: "A new award, funded by a personal donation from Dean Lisa Robinson and her family, will support future clinician-scientists in the MD/PhD program.", u: "https://md.utoronto.ca/", src: "U of T MD Program" },
  { d: "2026-01-15", w: ["uoft"], tag: "school", t: "Planetary health is now part of the U of T MD curriculum", b: "A longitudinal theme launched in December 2025 builds climate and environmental health into teaching across the program. U of T also reports an 83% yield on its admission offers.", u: "https://meded.temertymedicine.utoronto.ca/2025-2026-md-program-updates", src: "Temerty Medicine" },
  { d: "2026-07-09", w: ["western"], tag: "interview", t: "Western’s Autobiographical Sketch moves to Kira Talent, with a video part", b: "For 2027 entry, the Western ABS has written and recorded video answers on Kira Talent. It opened October 8 and was due October 14, 2026. The invitation comes from no-reply@kiratalent.com, so check your spam folder.", u: "https://www.schulich.uwo.ca/med_dent_admissions/medicine/admission_requirements.html", src: "Schulich Medicine" },
  { d: "2026-03-08", w: ["western"], tag: "interview", t: "Western held 2026 interviews over two weekends", b: "Interviews ran February 28 – March 1 and March 7–8, 2026. First-round offers and waitlist offers followed in early May.", u: "https://www.schulich.uwo.ca/med-dent-admissions/medicine/important-dates.html", src: "Schulich Medicine" },
  { d: "2026-11-10", w: ["queens"], tag: "school", t: "Queen’s gets a downtown Oshawa site for its family medicine MD", b: "The City of Oshawa is transferring a King Street site to Queen’s as the future home of the Queen’s-Lakeridge Health MD Family Medicine Program and its family medicine residency.", u: "https://www.queensu.ca/gazette/stories/queen-s-university-advances-plans-new-health-sciences-facility-oshawa", src: "Queen’s Gazette" },
  { d: "2026-08-25", w: ["queens"], tag: "school", t: "Queen’s-Lakeridge family medicine program now runs all four years", b: "The fourth cohort started in Oshawa, bringing the program to about 80 students. The first class is on track to graduate in May 2027.", u: "https://www.lh.ca/news-and-stories/posts/four-years-strong-queens-lakeridge-health-md-family-medicine-program-welcomes-fourth-cohort/", src: "Lakeridge Health" },
  { d: "2026-01-13", w: ["queens"], tag: "money", t: "Provincial money for simulation equipment at Queen’s-Lakeridge", b: "Part of a $242 million provincial investment in learning facilities will buy immersive simulation equipment for the Oshawa family medicine program.", u: "https://www.queensu.ca/gazette/stories/investing-cutting-edge-learning-tools", src: "Queen’s Gazette" },
  { d: "2026-06-15", w: ["ottawa"], tag: "admissions", t: "uOttawa’s 2026 cycle: 5,920 applications for 189 places", b: "The Faculty of Medicine received 5,920 applications, interviewed 621 and admitted 189. About 128 students a year enter the English stream and 56 the French stream.", u: "https://www.uottawa.ca/faculty-medicine/undergraduate-medical-education/about-admissions", src: "uOttawa" },
  { d: "2026-05-15", w: ["nosm"], tag: "school", t: "NOSM University: 96% CaRMS match and a new strategic plan", b: "NOSM reported a 96% match in the 2026 residency match and adopted Rooted in the North, its 2026–2030 strategic plan as an independent university. Its 2026 interviews were held online.", u: "https://report.nosm.ca/wp-content/uploads/2026/05/Presidents-Report-—-Dr-Green-May-2026-1.pdf", src: "NOSM University" },
  { d: "2026-09-16", w: ["tmu"], tag: "money", t: "TMU School of Medicine gets $25 million in federal funding", b: "The money supports primary care training in Peel Region. With its second class of 94 students, the Brampton school now has more than 400 undergraduate and postgraduate learners.", u: "https://www.torontomu.ca/content/ryerson/news-events/news/2026/09/tmu-school-of-medicine-receives-25m-federal-boost/", src: "TMU" },
  { d: "2026-07-09", w: ["tmu"], tag: "interview", t: "TMU’s 2027 cycle: an online assessment for every applicant, then the MMI", b: "Every applicant was invited on November 12 to an asynchronous assessment on Kira Talent, due November 19–22, 2026. A shortlist moves to file review, then a six-station virtual MMI on February 27–28 or March 6–7, 2027. First offers go out May 11, 2027. The minimum GPA is 3.5, not rounded up.", u: "https://www.torontomu.ca/school-of-medicine/programs/md/md-admissions/how-to-apply/tmu-admissions-important-dates/", src: "TMU" },

  // Quebec
  { d: "2026-01-26", w: ["mcgill"], tag: "interview", t: "McGill MDCM interview invitations went out January 26", b: "Applicants on Premed 101 reported invitations and refusals arriving from about 10 a.m. on January 26, 2026, with interviews in February.", u: "https://forums.premed101.com/topic/124740-mcgill-mdcm-interview-invites-%E2%80%93-2026/", src: "Premed 101 forum" },
  { d: "2026-04-24", w: ["mcgillp"], tag: "interview", t: "Med-P interviews held April 21–24", b: "McGill interviewed selected Med-P (CEGEP) applicants for fall 2026 over four days in April.", u: "https://www.mcgill.ca/fmt/node/697409", src: "McGill" },
  { d: "2026-03-01", w: ["mcgill", "mcgillp", "sherb", "laval", "udem"], tag: "admissions", t: "The military medical training stream has left McGill", b: "The Canadian Armed Forces medical program contingent is no longer offered at McGill. It continues at Sherbrooke, Laval and Montréal.", u: "https://www.usherbrooke.ca/etudes-medecine/programmes-detudes/doctorat-en-medecine/admission/quoi-de-nouveau-pour-2026", src: "Université de Sherbrooke" },
  { d: "2026-03-01", w: ["sherb"], tag: "seats", t: "More seats at Sherbrooke’s Moncton site", b: "From the 2025–26 cycle, the Moncton site has 36 places for New Brunswick students, up from 32.", u: "https://www.usherbrooke.ca/etudes-medecine/programmes-detudes/doctorat-en-medecine/admission/quoi-de-nouveau-pour-2026", src: "Université de Sherbrooke" },

  // Atlantic
  { d: "2026-09-01", w: ["dal"], tag: "school", t: "Dr. Saleem Razack becomes Dalhousie’s Dean of Medicine", b: "He took over the Faculty of Medicine on September 1, 2026.", u: "https://medicine.dal.ca/news/2026/09.html", src: "Dalhousie Medicine" },
  { d: "2026-05-14", w: ["dal"], tag: "school", t: "Cape Breton Medical Campus opens its new building", b: "The medical sciences building next to Cape Breton University opened on May 14, 2026. The campus takes 30 students a year through the Rural Applicant Pathway, which favours Nova Scotians with rural roots.", u: "https://www.cbu.ca/current-students/student-services/health-wellness/cape-breton-medical-campus/cbmc-progress-updates/", src: "Cape Breton University" },
  { d: "2026-08-20", w: ["dal"], tag: "seats", t: "Five more first-year seats at Dalhousie Halifax", b: "Nova Scotia funded five more first-year seats for Nova Scotians in 2026–27, bringing Halifax to 99. Dalhousie now admits 169 domestic students a year across Halifax, Saint John and Cape Breton.", u: "https://news.novascotia.ca/en/2025/06/18/province-invests-training-more-doctors", src: "Province of Nova Scotia" },
  { d: "2026-06-26", w: ["mun"], tag: "admissions", t: "Newfoundland and Labrador widens who counts as a resident for MUN medicine", b: "New regulations count Canadian Armed Forces and RCMP members and their immediate families as residents even when posted outside the province. They applied to applications made in summer 2026.", u: "https://gov.nl.ca/releases/2026/eecd/0626n04", src: "Government of Newfoundland and Labrador" },

  // Prairies
  { d: "2026-05-06", w: ["usask"], tag: "seats", t: "Saskatchewan adds 20 first-year seats", b: "A $4.3 million provincial investment adds 20 seats in 2026–27: 12 at the Regina campus and 8 in Saskatoon. That brings the province to 128 first-year seats.", u: "https://medicine.usask.ca/news/2026/training-more-doctors-to-strengthen-saskatchewans-health-care-workforce.php", src: "USask College of Medicine" },
  { d: "2026-09-24", w: ["ualberta"], tag: "interview", t: "Alberta’s 2027 interview weekend will be virtual, March 6–7", b: "Invitations go out in February 2027. Anything in your application can come up, so reread it before the weekend.", u: "https://www.ualberta.ca/en/medicine/programs/md/admissions/news-and-updates/2026/09/2026-2027-md-program-interview-weekend.html", src: "University of Alberta" },
  { d: "2026-07-01", w: ["ualberta"], tag: "admissions", t: "Alberta: new residency declaration now, and a 90/10 split from 2028", b: "Applicants claiming Alberta residency must complete a new Declaration of Alberta Residency item in Launchpad this cycle. From the 2027–28 cycle (fall 2028 entry), 90% of seats go to Albertans, up from 85%. The last MCAT accepted this cycle was August 28, 2026.", u: "https://www.ualberta.ca/en/medicine/programs/md/admissions/before-you-apply/application-requirements", src: "University of Alberta" },
  { d: "2026-07-02", w: ["ucalgary"], tag: "school", t: "Calgary’s first Southern Alberta Medical Program class begins in Lethbridge", b: "The Class of 2029 started orientation on July 2, 2026, including the first cohort of SAMP, a three-year rural and regional MD run with the University of Lethbridge.", u: "https://cumming.ucalgary.ca/mdprogram/future-students/admissions", src: "Cumming School of Medicine" },
  { d: "2026-02-02", w: ["ucalgary"], tag: "interview", t: "Calgary invited applicants to interview on February 2", b: "At the interview decision stage, 2,154 applicants were still in the pool (1,717 from Alberta and 437 from elsewhere). Invitations weren’t sent in rank order, SAMP invitations followed the main campus ones, and regret emails came the next day.", u: "https://wpsites.ucalgary.ca/mdadmissions/?p=1045", src: "UCalgary MD Admissions blog" },

  // BC
  { d: "2026-09-11", w: ["ubc"], tag: "interview", t: "UBC’s MMI goes back to in person", b: "For the 2026–27 cycle, the multiple mini interview will be held in person at UBC Vancouver’s Point Grey campus. Invited applicants get a virtual information session first.", u: "https://mdprogram.med.ubc.ca/admissions/admissions-blog/", src: "UBC MD Admissions blog" },
  { d: "2026-09-15", w: ["ubc"], tag: "admissions", t: "UBC extended its deadline by a day after a server outage", b: "The online application went down on deadline day, so the application and transcript deadline moved to 3 p.m. Pacific on September 16, 2026.", u: "https://mdprogram.med.ubc.ca/admissions/admissions-blog/", src: "UBC MD Admissions blog" },
  { d: "2026-07-24", w: ["ubc"], tag: "money", t: "Application fee waivers for BC residents at UBC", b: "UBC opened a limited number of fee waivers with the AFMC for BC residents. The window closed August 19, 2026; watch for it again next summer.", u: "https://mdprogram.med.ubc.ca/admissions/admissions-blog/", src: "UBC MD Admissions blog" },
  { d: "2026-07-03", w: ["ubc"], tag: "admissions", t: "UBC’s new activity limits: 10 paid and 5 unpaid entries", b: "UBC says the limits aren’t a target number. Focus on quality, honest hour estimates and putting each experience in the right category.", u: "https://mdprogram.med.ubc.ca/admissions/admissions-blog/", src: "UBC MD Admissions blog" },
  { d: "2026-08-05", w: ["sfu"], tag: "school", t: "SFU’s medical school welcomes its first 48 students", b: "Now named the Stephens Family School of Medicine, SFU began classes in Surrey on August 5, 2026. It is the first new medical school in Western Canada in decades. Nearly half the first class hold a graduate or professional degree. Classes grow to 120 a year by 2035, and the permanent building is due around 2030.", u: "https://www.sfu.ca/sfunews/stories/2026/08/first-students-begin-studies-at-sfu-stephens-family-school-of-me.html", src: "SFU News" },
];

const UV_HEARD = {
  uoft: [
    ["Common advice", "With the MCAT used only as a minimum, applicants say the Autobiographical Sketch, the essays and the interview decide most files."],
    ["Common advice", "Prepare stories for each quality in the modified personal interview (MPI) rather than scripted answers; each short interview focuses on one trait."],
  ],
  mac: [
    ["Common advice", "Applicants keep repeating that only CARS, GPA and Casper decide who gets an interview, so CARS is where an extra point helps most."],
    ["Reported", "Accepted students in a Premed 101 thread said how you speak in the MMI matters as much as what you say: stay calm, structured and kind to the actor.", "https://forums.premed101.com/topic/70942-advice-for-mmi-approach"],
  ],
  western: [
    ["Common advice", "Western’s minimum GPA uses your two best full years, so applicants with one weak year often still qualify here."],
    ["Common advice", "MCAT minimums are announced after the deadline, based on the pool. Recent minimums have been 126 per section, so aim above that."],
    ["Official", "New this cycle: the ABS is done on Kira Talent with a video part. Practise recorded answers, not just writing."],
  ],
  queens: [["Common advice", "Above the GPA, MCAT and Casper thresholds, Queen’s now picks interviewees by random draw, so applicants treat it as a lottery and apply every year they qualify."]],
  ottawa: [
    ["Common advice", "Ottawa looks at your last three full years of GPA, and applicants say about 3.9 or higher is usually needed for an interview."],
  ],
  nosm: [["Common advice", "Applicants say ties to Northern Ontario, rural or Indigenous communities and Francophone background matter as much as grades. Show them clearly in the application."]],
  tmu: [["Common advice", "Every TMU applicant does the Kira online assessment, so treat it like an interview: practise timed recorded answers."]],
  mcgill: [
    ["Reported", "On invitation day (January 26, 2026), several posters with Casper in the top quartile and GPAs around 3.87–3.94 out of 4 reported refusals while similar profiles got invitations. Grades and Casper alone don’t predict the result.", "https://forums.premed101.com/topic/124740-mcgill-mdcm-interview-invites-%E2%80%93-2026/"],
    ["Reported", "Applicants formed online MMI practice groups in the week after invitations went out.", "https://forums.premed101.com/topic/124740-mcgill-mdcm-interview-invites-%E2%80%93-2026/"],
    ["Reported", "In November 2026 an applicant asked for success stories with a Casper in the bottom two quartiles. The thread got almost no replies.", "https://forums.premed101.com/topic/125087-x/"],
  ],
  mcgillp: [["Reported", "Some Med-P applicants were placed on a pre-interview waitlist in April 2026 before the April 21–24 interviews.", "https://forums.premed101.com/forum/16-mcgill-medical-school/"]],
  udem: [
    ["Reported", "In mid-January 2026, applicants said UdeM asked them to choose their campus preference before interview invitations went out.", "https://forums.premed101.com/topic/124541-admission-md-udem-2026/"],
    ["Reported", "The first wave of MEM (MMI) invitations arrived in late March 2026. In the previous cycle, some refusals came around March 15.", "https://forums.premed101.com/topic/124541-admission-md-udem-2026/"],
    ["Common advice", "Applicants stress that grades must be on your transcript by the November 1 deadline to count, and that a weak Casper is hard to make up for."],
  ],
  laval: [["Common advice", "Applicants say choosing a regional campus (Rimouski or Lévis) as your first choice can improve your odds when your Casper is in the middle quartiles.", "https://forums.premed101.com/topic/124541-admission-md-udem-2026/"]],
  sherb: [["Common advice", "Sherbrooke ranks by campus as well as overall; applicants watch the published ranks on its admissions-tracking page to see how far each list has moved.", "https://www.usherbrooke.ca/etudes-medecine/programmes-detudes/doctorat-en-medecine/admission/suivi-des-admissions"]],
  ucalgary: [
    ["Official", "The admissions dean wrote that the gap between the last applicants invited and the next hundred was very small. A regret doesn’t mean a weak file.", "https://wpsites.ucalgary.ca/mdadmissions/?p=904"],
  ],
  ualberta: [["Common advice", "Alberta weights cumulative GPA at 30% of the final ranking, so an upward trend helps less here than at schools that drop early years."]],
  ubc: [["Common advice", "Applicants say the experiences list (NAQ) is scored, so precise hours and a clear description of your role matter more than the number of entries."]],
  sfu: [["Reported", "Students in the first class said the admissions process rewarded non-traditional paths and lived experience.", "https://www.sfu.ca/sfunews/stories/2026/08/first-students-begin-studies-at-sfu-stephens-family-school-of-me.html"]],
};

// When results actually went out last cycle (2026 entry). how: "Official" or "Reported" (forum).
const UV_RESULTS = [
  ["mcgill", "Interview invitations", "2026-01-26", "Reported", "https://forums.premed101.com/topic/124740-mcgill-mdcm-interview-invites-%E2%80%93-2026/"],
  ["ucalgary", "Interview invitations", "2026-02-02", "Official", "https://wpsites.ucalgary.ca/mdadmissions/?p=1045"],
  ["western", "Interviews", "2026-02-28", "Official", "https://www.schulich.uwo.ca/med-dent-admissions/medicine/important-dates.html"],
  ["ucalgary", "Interviews", "2026-03-07", "Official", "https://cumming.ucalgary.ca/mdprogram/future-students/admissions/ucan-application"],
  ["udem", "First MEM (interview) invitations", "2026-03-24", "Reported", "https://forums.premed101.com/topic/124541-admission-md-udem-2026/"],
  ["mcgillp", "Interviews", "2026-04-21", "Official", "https://www.mcgill.ca/fmt/node/697409"],
  ["ucalgary", "Admission decisions (first two weeks of May)", "2026-05-01", "Official", "https://cumming.ucalgary.ca/mdprogram/future-students/admissions/ucan-application"],
  ["western", "First-round offers (early May)", "2026-05-05", "Official", "https://www.schulich.uwo.ca/med-dent-admissions/medicine/important-dates.html"],
  ["mac", "Offers (second Tuesday of May)", "2026-05-12", "Official", "https://ugme.healthsci.mcmaster.ca/?p=9802"],
];

/* Helpers */
const uvNewsFor = (id) => {
  const s = medSchool(id);
  return UV_NEWS.filter((n) => n.w.includes(id) || n.w.includes("all") || (s && n.w.includes(s.prov))).sort((a, b) => b.d.localeCompare(a.d));
};
const UV_NEWS_TAG = { seats: "Seats", admissions: "Admissions", interview: "Interviews", school: "School", money: "Money", post: "From us" };
// Line icons for each kind of story: the cover art, like Project Infrared's story covers
const UV_NEWS_ICO = {
  seats: '<rect x="3" y="11" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="17" rx="1"/>',
  admissions: '<path d="M4 4h11l5 5v11H4z"/><path d="M15 4v5h5M8 13l2.5 2.5L16 10"/>',
  interview: '<path d="M4 5h12v8H9l-4 3v-3H4z"/><path d="M16 9h4v8h-1v3l-4-3h-4v-2"/>',
  school: '<path d="M3 21h18M5 21V10m4 11V10m6 11V10m4 11V10M2 10l10-6 10 6z"/>',
  money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  post: '<path d="M12 3l2.2 5.6L20 9.5l-4.5 3.8L17 19l-5-3.1L7 19l1.5-5.7L4 9.5l5.8-.9z"/>',
};
const UV_REG = { on: "Ontario", qc: "Quebec", atl: "Atlantic", pr: "Prairies", bc: "BC", all: "All schools" };
const uvNewsDate = (d) => new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
const uvWho = (w) => (w || []).map((x) => (medSchool(x) ? medSchool(x).short : UV_REG[x] || x)).join(", ");
// One story as a card with a generated cover. n: {d, w, tag, t, b, u, src}
function uvNewsItem(n, showSchool, lead) {
  const tag = n.tag || "post";
  const h = [...(n.t || "")].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 3;
  const mark = n.w && n.w.length ? (medSchool(n.w[0]) ? medSchool(n.w[0]).short : UV_REG[n.w[0]] || "") : "UV";
  return `<a class="uvncard t-${tag} v${h}${lead ? " lead" : ""}" href="${acctEsc(n.u || "#news")}"${n.u ? ' target="_blank" rel="noopener"' : ""}>
    <span class="uvncov" aria-hidden="true"><span class="uvnmark">${acctEsc(n.w && n.w.length > 1 && !medSchool(n.w[0]) ? mark : n.w && n.w.length > 2 ? "Several" : mark)}</span><svg viewBox="0 0 24 24">${UV_NEWS_ICO[tag] || UV_NEWS_ICO.post}</svg><span class="uvncovsrc">${acctEsc(n.src || "Project UltraViolet")}</span></span>
    <span class="uvnbody"><span class="uvnmeta"><b class="uvnk">${UV_NEWS_TAG[tag] || "News"}</b><span>${uvNewsDate(n.d)}</span>${showSchool && n.w ? `<span class="uvntag">${acctEsc(uvWho(n.w))}</span>` : ""}</span>
    <b class="uvnt">${acctEsc(n.t)}</b><span class="uvns">${acctEsc(n.b || "")}</span></span></a>`;
}
const uvNewsGrid = (list, showSchool, leadFirst) => `<div class="uvngrid">${list.map((n, i) => uvNewsItem(n, showSchool, leadFirst && i === 0)).join("")}</div>`;
const uvPost = (p) => ({ d: p.created_at, w: p.school ? [p.school] : null, tag: "post", t: p.title, b: p.body, u: p.url, src: "Project UltraViolet" });

/* School page tab: news this year, admin posts for the school, and what applicants report */
function msNews(s, d, id) {
  const items = uvNewsFor(id);
  const heard = UV_HEARD[msdId ? msdId(id) : id] || UV_HEARD[id] || [];
  const cls = { Reported: "k-rumour", Official: "k-official", "Common advice": "k-changed" };
  return `<h2>News this year</h2>
  <div data-msposts="${id}"></div>
  ${items.length ? uvNewsGrid(items, false, true) : `<p class="note">No news yet this year for ${acctEsc(s.short)}.</p>`}
  <h2>What applicants report</h2>
  <p class="note">From applicant forums (mainly Premed 101) and school updates applicants share. Treat these as other applicants’ experiences, not official rules, and confirm anything important with the school.</p>
  ${heard.length ? `<ul class="msch">${heard.map(([k, t, u]) => `<li><span class="msct ${cls[k] || ""}">${k}</span><span>${t}${u ? ` <a href="${u}" target="_blank" rel="noopener">Source ↗</a>` : ""}</span></li>`).join("")}</ul>` : `<p class="note">Nothing collected yet for ${acctEsc(s.short)}.</p>`}
  <div class="callout"><b>Heard something new?</b> Tell us with the feedback button on your profile and we’ll check it and add it here.</div>`;
}
// Admin posts for this school (from the news table), filled in after the tab renders
async function wireMsNews(id) {
  const box = document.querySelector(`[data-msposts="${id}"]`);
  if (!box || !Acct.sb) return;
  try {
    const { data } = await Acct.sb.from("news").select("created_at,title,body,url").eq("published", true).eq("school", id).order("created_at", { ascending: false }).limit(10);
    if (data && data.length) box.innerHTML = uvNewsGrid(data.map(uvPost), false);
  } catch (e) {}
}
