/* ============================================================
   MEDICAL SCHOOL PAGES (#school-<id>): one page per Canadian MD program,
   styled like the specialty pages. Tabs: Overview, Admissions, Program,
   Cost, City. Reached from the Med school tab in the profile.
   ids match MED_SCHOOLS in medprep.js (deadlines come from there).
   Figures: each school's own admissions, statistics and fee pages, and the
   AFMC's Canadian Medical Education Statistics 2025 (applications, filled
   places, clerkship length). Ratings, "what students say" and rents are
   our estimates.
   ============================================================ */
const CMES = ["AFMC Canadian Medical Education Statistics 2025", "https://www.afmc.ca/wp-content/uploads/2026/07/CMES-2025-Complete-EN.pdf"];
const AFMC27 = ["AFMC Admission Requirements 2027", MED_SRC];

// Cities. rent = typical asking rent for a one-bedroom, early to late 2026 (approximate). est = rough estimate.
const MCITY = {
  toronto: { n: "Toronto", rent: 2400, t: "Canada’s biggest city: four million people, every cuisine, the country’s densest cluster of teaching hospitals and research institutes, and a subway that gets you to most of them. Neighbourhoods near the St. George campus (the Annex, Kensington, Chinatown, Harbord Village) are walkable but pricey; many students share apartments or live along the subway lines.", g: ["Huge clinical and research variety, much of it walkable from campus", "Anything you want to do on a night off", "Good transit; no car needed"], b: ["Most expensive rent of any med school city in Ontario", "Big-city commutes once clerkship sends you to suburban hospitals", "Easy to feel anonymous in a large class"] },
  mississauga: { n: "Mississauga", rent: 2100, est: 1, t: "A suburban city west of Toronto, home to U of T’s Mississauga Academy of Medicine at UTM. Clinical training runs through Trillium Health Partners (Credit Valley, Mississauga Hospital). Quieter and more car-oriented than downtown Toronto, with a big, diverse community population.", g: ["Smaller academy inside a big school", "Busy community hospitals with lots of hands-on work", "Downtown Toronto is a GO train away"], b: ["You’ll want a car or patience with transit", "Less nightlife and fewer student neighbourhoods"] },
  hamilton: { n: "Hamilton", rent: 1750, t: "A working steel city turned health-care hub, an hour west of Toronto. Hamilton Health Sciences and St. Joseph’s give students a very busy clinical base, and Westdale and the escarpment trails (and dozens of waterfalls) are close to campus. James Street North has a growing food and arts scene.", g: ["Cheaper than Toronto, close enough to visit", "Busy, high-acuity hospitals", "Waterfalls and the Bruce Trail at your door"], b: ["Some downtown areas feel rough", "Transit is limited; many students drive"] },
  kitchener: { n: "Kitchener-Waterloo", rent: 1700, t: "A tech-and-university region (Waterloo, Laurier, Conestoga) about an hour from Toronto. McMaster’s Waterloo Regional Campus trains students at Grand River and St. Mary’s hospitals. It’s young, tidy and has a light-rail line, but it’s quieter than a big city.", g: ["Smaller cohort, more one-on-one teaching", "Young, student-heavy population", "ION light rail across the core"], b: ["Rents have climbed fast", "Fewer tertiary-care subspecialties than Hamilton"] },
  stcath: { n: "St. Catharines and Niagara", rent: 1600, est: 1, t: "Niagara’s wine country and lakeshore towns, home to McMaster’s Niagara Regional Campus at Brock University. Training runs through Niagara Health sites. It’s affordable and relaxed, with Niagara-on-the-Lake and the falls nearby.", g: ["Lower cost of living", "Small cohort and close faculty contact", "Wineries, lakes and trails"], b: ["You need a car", "Quieter social life; many students head to Hamilton or Toronto"] },
  london: { n: "London", rent: 1600, t: "A mid-size university city (about 420,000) in Southwestern Ontario. Western’s campus sits beside University Hospital, and London Health Sciences Centre is one of the province’s largest hospital networks. Old North and Masonville are popular with students; downtown has improved but still has visible homelessness.", g: ["Hospitals right beside campus", "Affordable for Ontario", "Big student population and lots of green space along the Thames"], b: ["Can feel small if you’re used to Toronto", "Winters are grey and snowy", "Downtown safety is a common complaint"] },
  windsor: { n: "Windsor", rent: 1400, t: "Canada’s southernmost city, across the river from Detroit. Western’s Windsor campus (about 40 students a year) trains at Windsor Regional Hospital. It’s one of the cheapest places to live in Ontario, with a waterfront, warm summers and a lot of hands-on clinical work.", g: ["Very affordable", "Small class, lots of procedures and attention", "Detroit for sports and concerts"], b: ["Far from family if you’re from the GTA", "Smaller research footprint than London"] },
  kingston: { n: "Kingston", rent: 1600, t: "A historic limestone city of about 140,000 on Lake Ontario, halfway between Toronto and Montréal. Campus life is the city’s centre of gravity; students walk to Kingston General Hospital and Hotel Dieu. The Thousand Islands, sailing and a lively downtown make up for its size.", g: ["Very walkable, tight-knit student town", "Beautiful lakefront and summers", "Small class, you know everyone"], b: ["Limited housing near campus", "Long drives to Toronto or Ottawa", "Fewer patients and subspecialties than big centres"] },
  oshawa: { n: "Durham Region (Oshawa, Ajax, Pickering)", rent: 1800, est: 1, t: "East of Toronto, home to the Queen’s-Lakeridge Health MD Family Medicine program. Students train across Lakeridge Health’s hospitals and community practices. Suburban, family-friendly and growing fast, with GO trains into Toronto.", g: ["Community-based training for future family doctors", "Close to the GTA without Toronto rent"], b: ["Car-dependent", "Far from the Kingston campus community"] },
  ottawa: { n: "Ottawa", rent: 1900, t: "The capital: about a million people, bilingual, with government, tech and a big student population. The Ottawa Hospital (Civic, General, Riverside), CHEO, the Heart Institute and Montfort give a full range of care. The Rideau Canal, Gatineau Park and the ByWard Market are highlights.", g: ["Bilingual practice from day one", "Full tertiary and quaternary care", "Outdoors close by: canal, Gatineau Park, cycling paths"], b: ["Rent close to Toronto levels", "Long, cold winters", "Can feel like a government town after 5 p.m."] },
  sudbury: { n: "Sudbury", rent: 1300, est: 1, t: "Northern Ontario’s largest city (about 170,000), surrounded by hundreds of lakes. NOSM’s east campus is at Laurentian University; Health Sciences North is the regional hospital. Strong Francophone and Indigenous communities and a real outdoors culture.", g: ["Affordable, with lakes and trails everywhere", "Huge procedural exposure in a regional hub", "Close-knit cohort"], b: ["Long, cold winters", "Far from Toronto (about four hours by car)", "Fewer amenities than southern cities"] },
  thunderbay: { n: "Thunder Bay", rent: 1100, t: "A city of about 110,000 on Lake Superior, under the Sleeping Giant. NOSM’s west campus is at Lakehead University, with training at Thunder Bay Regional Health Sciences Centre and in communities across the northwest, including fly-in First Nations.", g: ["Cheapest rent of any med school city in Ontario", "Stunning lake and wilderness", "Training that’s very different from the south"], b: ["Isolated; flights out are expensive", "Hard winters", "Fewer specialty services"] },
  brampton: { n: "Brampton", rent: 1800, t: "One of Canada’s fastest-growing and most diverse cities (over 700,000), in Peel Region northwest of Toronto. TMU’s School of Medicine is in the former Bramalea Civic Centre, with William Osler Health System (Brampton Civic, Etobicoke General) as the main clinical partner. Big South Asian community and a lot of unmet primary care need.", g: ["Very diverse patient population", "Brand-new building and curriculum", "Close to Toronto"], b: ["Suburban sprawl; a car helps", "Fewer student neighbourhoods and less nightlife", "Busy, overstretched local hospitals"] },
  montreal: { n: "Montréal", rent: 1600, t: "A bilingual, festival-filled city of four million with Canada’s best food-to-rent ratio among the big metros. McGill and Université de Montréal both train across major networks (MUHC, CHUM, Sainte-Justine, Jewish General). The Plateau, Mile End and Côte-des-Neiges are student favourites.", g: ["Cheaper than Toronto or Vancouver", "Huge culture, food and nightlife", "Excellent transit and cycling"], b: ["French is needed for most patient care", "Winters are long and snowy", "Old apartments, and moving day is July 1 for everyone"] },
  gatineau: { n: "Gatineau (Outaouais)", rent: 1500, est: 1, t: "Across the river from Ottawa. McGill’s Outaouais campus teaches the full MD in French to grow the region’s physician supply, with training at Outaouais hospitals. Students get Ottawa’s amenities with Quebec’s lower rents.", g: ["Small French-language cohort", "Ottawa next door", "Gatineau Park in your backyard"], b: ["Requires strong French (C1 for Med-P)", "Regional hospitals with fewer subspecialties"] },
  troisrivieres: { n: "Trois-Rivières (Mauricie)", rent: 1100, est: 1, t: "A small, historic city halfway between Montréal and Québec City. Université de Montréal’s Mauricie campus trains a cohort there in French. Affordable and calm, on the St. Lawrence.", g: ["Very affordable", "Small cohort"], b: ["Quiet; most big-city life is two hours away", "French only"] },
  quebec: { n: "Québec City", rent: 1270, t: "Quebec’s capital (about 850,000), with the walled Old Town, Plains of Abraham and quick access to skiing. Laval trains across the CHU de Québec and IUCPQ. One of the cheapest big cities in Canada to rent in.", g: ["Among the lowest rents of any big Canadian city", "Beautiful, safe and walkable", "Skiing and outdoors 30 minutes away"], b: ["Almost entirely French", "Cold, snowy winters", "Smaller anglophone community"] },
  sherbrooke: { n: "Sherbrooke", rent: 1100, est: 1, t: "A university city of about 175,000 in the Eastern Townships, an hour and a half from Montréal. CHUS Fleurimont and Hôtel-Dieu are the teaching hospitals. Lakes, cycling, skiing at Orford and a big student population.", g: ["Affordable", "Townships outdoors: lakes, skiing, cycling", "Student town feel"], b: ["French only", "Small city; limited nightlife"] },
  saguenay: { n: "Saguenay", rent: 1000, est: 1, t: "A regional city on the Saguenay fjord in northern Quebec, home to one of Sherbrooke’s satellite campuses. Spectacular scenery and very low cost of living, with training at the regional hospital.", g: ["Very low cost of living", "Fjord and wilderness"], b: ["Remote", "Long, harsh winters"] },
  moncton: { n: "Moncton", rent: 1400, est: 1, t: "New Brunswick’s largest city, bilingual and growing. Sherbrooke trains francophone New Brunswickers here (with the Université de Moncton) at the Georges-L.-Dumont hospital.", g: ["Train in French close to home in New Brunswick", "Affordable"], b: ["Small program", "Limited subspecialty exposure"] },
  stjohns: { n: "St. John’s", rent: 1300, est: 1, t: "North America’s oldest English-founded city, with colourful row houses, George Street’s pubs and the ocean at Signal Hill. Memorial’s Health Sciences Centre is attached to the main hospital. A tight, friendly community at the edge of the continent.", g: ["Affordable and friendly", "Tight class; the whole province is your clinical teaching ground", "Ocean, trails and a great music scene"], b: ["Far from the rest of Canada; flights are pricey", "Foggy, windy weather", "Fewer specialty services than big centres"] },
  charlottetown: { n: "Charlottetown", rent: 1500, est: 1, t: "PEI’s small, walkable capital (about 40,000). Memorial’s campus at UPEI trains PEI residents close to home, with beaches and red-sand cliffs a short drive away.", g: ["Train at home in PEI", "Small, close cohort"], b: ["Very small city", "New program still building its track record"] },
  halifax: { n: "Halifax", rent: 1900, t: "Atlantic Canada’s hub (about 480,000), a waterfront city with a big student population from Dal, Saint Mary’s and NSCAD. The QEII Health Sciences Centre and IWK give full tertiary care. Pub culture, ocean beaches and trails.", g: ["Lively student city by the ocean", "Full range of tertiary care", "Easy to get around"], b: ["Rent has risen sharply", "Housing shortage", "Long, wet winters"] },
  saintjohn: { n: "Saint John", rent: 1300, est: 1, t: "New Brunswick’s port city on the Bay of Fundy. Dalhousie Medicine New Brunswick trains New Brunswick students here, with clinical work at the Saint John Regional Hospital.", g: ["Affordable", "Small cohort with lots of attention"], b: ["Smaller city with fewer amenities", "Foggy coastal weather"] },
  sydney: { n: "Cape Breton (Sydney)", rent: 1200, est: 1, t: "Dalhousie’s newest campus, with Cape Breton University, trains Nova Scotia students with a rural and community focus. Cape Breton’s Cabot Trail and Celtic music culture are famous.", g: ["Brand-new rural-focused campus", "Affordable", "Scenery"], b: ["Very new program", "Remote; few specialty services"] },
  winnipeg: { n: "Winnipeg", rent: 1320, t: "A prairie city of about 850,000 with a strong arts scene, the Forks, and one of the most affordable rental markets in Canada. The Bannatyne campus sits beside the Health Sciences Centre, Manitoba’s largest hospital.", g: ["Very affordable", "Great food, music and festival scene", "Hospital next to campus"], b: ["Some of the coldest winters of any big city", "Mosquitoes in summer", "Downtown safety concerns"] },
  saskatoon: { n: "Saskatoon", rent: 1250, est: 1, t: "A friendly, compact city of about 330,000 along the South Saskatchewan River. The College of Medicine is on the main USask campus next to Royal University Hospital. Riverside trails, a good food scene and cheap living.", g: ["Affordable", "Compact and easy to get around", "Strong rural and Indigenous health training"], b: ["Cold, long winters", "Smaller city", "Training may send you to Regina or Prince Albert"] },
  regina: { n: "Regina", rent: 1270, t: "Saskatchewan’s capital (about 250,000). The full MD is now offered at the Regina campus at Regina General Hospital. Wascana Lake, low rents and a quieter pace.", g: ["Among the cheapest rents in Canada", "Small cohort"], b: ["Quiet city", "Flat, cold winters"] },
  edmonton: { n: "Edmonton", rent: 1400, t: "Alberta’s capital (about 1.2 million), with the largest urban river valley park in North America and a festival nearly every summer weekend. The U of A campus is linked to the University of Alberta Hospital and Mazankowski Heart Institute, and the LRT runs to campus.", g: ["Affordable for a big city", "Huge river valley trail system", "Big academic hospitals on campus"], b: ["Very cold winters", "Spread out; many students drive"] },
  calgary: { n: "Calgary", rent: 1600, t: "A sunny, fast-growing city of 1.6 million an hour from the Rockies. The Foothills Medical Centre is beside the Health Sciences Centre. Weekends in Banff and Canmore, Chinook winds that break the cold, and no provincial sales tax.", g: ["Mountains an hour away", "Sunny, even in winter", "Rent lower than Toronto or Vancouver"], b: ["Car-oriented city", "Three-year program leaves little time to enjoy it"] },
  vancouver: { n: "Vancouver", rent: 2600, t: "Mountains, ocean and Canada’s mildest big-city winters. UBC’s Vancouver-Fraser program trains across Vancouver General, St. Paul’s, BC Children’s and Fraser Health hospitals. Skiing, hiking and beaches all within an hour.", g: ["Outdoor life all year", "Mild winters", "Major academic centres"], b: ["Most expensive rent in Canada", "Rain from October to April", "Long commutes to Fraser Health sites"] },
  victoria: { n: "Victoria", rent: 2050, t: "BC’s capital on Vancouver Island, home to UBC’s Island Medical Program at UVic. Mild climate, ocean everywhere and a slower pace. Training spans Royal Jubilee, Victoria General and island communities.", g: ["Mildest winters in Canada", "Small cohort", "Ocean and trails"], b: ["Expensive housing", "Ferries to the mainland"] },
  princegeorge: { n: "Prince George", rent: 1300, est: 1, t: "Northern BC’s hub (about 80,000), home to UBC’s Northern Medical Program at UNBC. Students train at University Hospital of Northern BC and rural communities across the north. Lakes, skiing and a strong outdoors culture.", g: ["Very affordable for BC", "Lots of hands-on rural experience", "Small, close cohort"], b: ["Cold winters and smoky summers", "Remote; few big-city amenities"] },
  kelowna: { n: "Kelowna", rent: 1900, t: "The Okanagan’s lake city, home to UBC’s Southern Medical Program at UBC Okanagan. Hot summers, wineries, beaches and skiing at Big White. Training at Kelowna General and interior communities.", g: ["Lake and ski town lifestyle", "Small cohort"], b: ["Rent close to Vancouver levels", "Wildfire smoke some summers"] },
  surrey: { n: "Surrey", rent: 1800, t: "One of Canada’s fastest-growing cities, south of Vancouver, with a young and very diverse population. SFU’s school is downtown at Central City; clinical work runs across Fraser Health (Surrey Memorial and others).", g: ["Cheaper than Vancouver with SkyTrain access", "Diverse, underserved patient population", "New school"], b: ["Suburban; some areas car-dependent", "Fraser Health hospitals are very busy"] },
};

// One school per MED_SCHOOLS id.
// st: stats rows [label, value, note]. tu: tuition rows [who, amount]. r: ratings 1–5, higher is better for you
// [odds of getting in, affordability, research, clinical variety, city life, breathing room].
const MSD = {
  uoft: {
    est: 1843, len: 4, cities: ["toronto", "mississauga"], tuition: 23550,
    lede: "Canada’s biggest and most research-heavy medical school. Students train across the University Health Network, Sinai, Sunnybrook, SickKids and Unity Health, plus community hospitals, in four academies. A fifth (Scarborough) opens to students entering in fall 2027.",
    r: [1, 2, 5, 5, 4, 3],
    about: "Temerty Medicine admits about 300 students a year into a four-year program. Pre-clerkship (the Foundations curriculum) is two years, followed by two years of clerkship and electives. Every student belongs to an academy tied to a group of hospitals: Fitzgerald, Peters-Boyd and Wightman-Berris downtown, the Mississauga Academy of Medicine at UTM, and from fall 2027 the Scarborough Academy of Medicine and Integrated Health at UTSC.",
    good: ["Unmatched research access: hundreds of labs and institutes, and many students publish before graduating", "Name recognition for competitive specialties and US research residencies", "Every subspecialty you could want to shadow, often a short walk away", "Huge, diverse patient population", "Academy system gives you a smaller home within a big class"],
    bad: ["Very competitive admissions with MCAT section minimums", "Expensive city on a student budget", "A big class can feel competitive, especially among students aiming for the same specialties", "Some academies mean long commutes to suburban hospitals", "Students sometimes say the volume of learners per patient in tertiary centres limits hands-on work"],
    st: [["Applications (2026 entry)", "4,870"], ["Interviews", "753"], ["Average accepted GPA", "3.95"], ["Grad or professional degree", "104 of 311"]],
    adm: { who: "Canadian citizens and permanent residents (no international seats in the regular MD).", gpa: "Minimum 3.6 (undergraduate) or 3.3 (graduate applicants) on the OMSAS scale. U of T says 3.8 or higher is competitive (3.6 or higher for graduate applicants).", tests: "MCAT required: at least 125 in each section, with 124 allowed in one. Written within five years of the deadline. No Casper.", select: "Academic record and MCAT screen applicants for interview; the Autobiographical Sketch, essays and references build the rest of the file. Interviews are a virtual modified personal interview (MPI) in February and March, with about 750 interviews.", extra: ["Pathways: Indigenous, Black Student Application Program (BSAP), MD/PhD, Military (MMTP), MD/MSc in OMFS.", "The most common previous universities in the 2026 entering class were McMaster, Toronto and Queen’s."] },
    prog: { str: "Two pre-clerkship years (Foundations), then core clerkship and electives. About 70 weeks of clerkship in total.", sites: "Downtown Toronto academies, the Mississauga Academy (Trillium Health Partners) and, from 2027, Scarborough Health Network.", feat: ["Credit/no-credit pre-clerkship", "Large research and MD/PhD programs", "Longitudinal community opportunities through the academies"] },
    tu: [["Ontario residents", "$23,550 + about $2,500 in fees"], ["Other Canadians", "$28,880 + fees"]], tuyear: "2026–27, year one",
    life: "U of T estimates about $17,600 for rent, food and other living costs in first year, plus $1,000 for books and equipment.",
    src: [["U of T admission statistics", "https://applymd.utoronto.ca/admission-stats"], ["U of T tuition and fees", "https://applymd.utoronto.ca/tuition-fees"], ["OMSAS: University of Toronto", "https://www.ouac.on.ca/guide/omsas-toronto/"]],
  },
  mac: {
    est: 1969, len: 3, cities: ["hamilton", "kitchener", "stcath"], tuition: 26254,
    lede: "The school that invented problem-based learning and the three-year MD. Small-group tutorials replace most lectures, students work 11 months a year, and only the CARS section of the MCAT counts.",
    r: [2, 3, 4, 4, 3, 1],
    about: "McMaster’s Michael G. DeGroote School of Medicine admits about 217 students a year across three campuses: Hamilton, the Waterloo Regional Campus and the Niagara Regional Campus. Students graduate in three years by studying almost year-round, and can add an enrichment period of up to a year. McMaster coined “evidence-based medicine” and still teaches through problem-based tutorials.",
    good: ["Finish in three years and start earning a year earlier, with a year less tuition", "Self-directed, small-group learning suits independent learners", "Only CARS counts, so science-weak applicants with strong reasoning have a real shot", "Regional campuses give smaller cohorts and lots of hands-on teaching", "Strong career advising for CaRMS"],
    bad: ["Almost no summers: less time to rest, work or do research", "Less time to explore specialties before CaRMS; students interested in competitive fields have to commit early", "PBL can feel unstructured if you like lectures", "Casper and CARS are weighted heavily, which some feel is unpredictable", "Regional campus assignment may not be your first choice"],
    st: [["Mean MCAT CARS (class of 2027)", "129"], ["Seats", "217"]],
    adm: { who: "Canadian citizens and permanent residents (international applicants may apply through OMSAS; check the current policy).", gpa: "Minimum 3.0 overall GPA; simple average of all undergraduate courses, no weighting or dropping.", tests: "MCAT: only CARS counts (minimum 123; your most recent score is used). Casper required for everyone.", select: "GPA, CARS and Casper decide who is invited to interview, weighted about evenly; the Autobiographical Sketch is not scored for interview selection. After a virtual MMI in March and April, the interview carries most of the weight.", extra: ["Interview places are 95% for Ontario residents and 5% for others.", "Streams: Black Equity Stream (BESt), Facilitated Indigenous Admissions (FIAP), Military (MMTP), MD/PhD."] },
    prog: { str: "Three years, 11 months a year, organised in foundations units then clerkship, with a summer elective after first year. About 69 weeks of clerkship.", sites: "Hamilton, Kitchener-Waterloo and St. Catharines (Niagara).", feat: ["Problem-based small-group tutorials", "Optional enrichment period up to 12 months", "Students apply to CaRMS in their third year"] },
    tu: [["Domestic students, per year", "$26,253.75 including supplementary fees"]], tuyear: "current schedule",
    life: "Three years of tuition instead of four, but almost no summers to work.",
    src: [["McMaster UGME program costs", "https://ugme.healthsci.mcmaster.ca/?p=1624"], ["McMaster class statistics", "https://ugme.healthsci.mcmaster.ca/wp-content/uploads/2024/08/Class-of-2027-Statistics.pdf"], ["OMSAS: McMaster", "https://www.ouac.on.ca/guide/omsas-mcmaster"]],
  },
  western: {
    est: 1881, len: 4, cities: ["london", "windsor"], tuition: 24465,
    lede: "A traditional four-year program with hospitals beside campus in London and a smaller Windsor campus. Known for strong surgical and procedural training and a supportive class culture. Western looks hard at your two best full-time years.",
    r: [2, 4, 4, 4, 3, 3],
    about: "Schulich Medicine & Dentistry admits about 187 students a year: about 146 in London and 41 in Windsor. Its Southwestern Ontario pathway favours applicants from the region (35% of the class of 2030). Pre-clerkship is two years; clerkship runs through London Health Sciences Centre, St. Joseph’s and hospitals across Southwestern Ontario.",
    good: ["Hospitals connected to campus", "Affordable city by Ontario standards", "Windsor campus: small class and lots of procedures", "Well regarded for surgery and procedural specialties", "Friendly, collaborative class culture"],
    bad: ["MCAT and GPA cut-offs are high and strictly applied", "London is quieter than Toronto or Ottawa", "Windsor students sometimes feel far from London events", "Distributed clerkship sites can mean moving around Southwestern Ontario"],
    st: [["Applications (class of 2030)", "3,813"], ["Interviews", "699"], ["Admitted", "187"], ["Average GPA (best year / second best)", "3.96 / 3.88"], ["Average MCAT (BBFL / CARS / CPBS / PSBB)", "129 / 127 / 128 / 129"], ["Ontario residents", "96%"]],
    adm: { who: "Canadian citizens and permanent residents.", gpa: "Western uses your two best full-time undergraduate years. Recent admitted averages were 3.96 and 3.88.", tests: "MCAT required, written before the October 1 deadline; your most recent result counts. No Casper.", select: "GPA and MCAT screen for interview; the Autobiographical Sketch and references round out the file. Virtual panel interviews in February and March, about 700 invited.", extra: ["Southwestern Ontario (SWO) pathway for applicants from the region.", "Up to five Indigenous seats."] },
    prog: { str: "Two pre-clerkship years, then clerkship and electives. About 66 weeks of clerkship.", sites: "London (main campus), Windsor (about 41 students a year), and hospitals across Southwestern Ontario.", feat: ["Distributed Education Network across Southwestern Ontario", "Windsor campus with its own small class", "Schulich Scholarships for students with financial need"] },
    tu: [["Ontario residents", "$24,465 + about $1,800 in fees"], ["Other Canadians", "$30,611 + fees"]], tuyear: "2026–27 (draft schedule)",
    life: "Western’s sample budget puts rent around $7,000–8,400 a year if you share; food $3,600–4,800. Schulich Scholarships can cover up to $26,200 a year for four years for students with financial need.",
    src: [["Western admission statistics", "https://www.schulich.uwo.ca/med-dent-admissions/medicine/admission-statistics.html"], ["Western 2026–27 fee schedule", "https://registrar.uwo.ca/Student_finances/fees_refunds/2026-27-UGRD-Fee-Schedule---FT-Domestic1.pdf"], ["Schulich student finances", "https://www.schulich.uwo.ca/med_dent_admissions/student_resources/student_finances_medicine.html"]],
  },
  queens: {
    est: 1854, len: 4, cities: ["kingston", "oshawa"], tuition: 23983,
    lede: "One of Canada’s oldest medical schools and one of its smallest classes in Kingston, known for close teaching and a tight community. Queen’s also runs a family-medicine-focused MD with Lakeridge Health in Durham Region.",
    r: [2, 4, 3, 3, 3, 3],
    about: "Queen’s admits about 114 students to its Kingston campus and 20 to the Queen’s-Lakeridge Health MD Family Medicine program in Durham, plus military seats. It also runs QuARMS, an accelerated route for a few high-school students. Clinical training is at Kingston Health Sciences Centre and regional hospitals across southeastern Ontario.",
    good: ["Lottery gives anyone above the thresholds a real shot", "Small class: faculty know your name", "Walkable, student-centred city", "Strong mentorship and early clinical contact", "MDFM option guarantees a family medicine path", "Collaborative rather than competitive"],
    bad: ["The lottery means a 4.0 and a 520 don’t improve your odds over someone at the threshold", "Smaller patient volume and fewer subspecialties than Toronto or Ottawa", "Kingston housing near campus is tight", "Needs both MCAT and Casper"],
    st: [["Applications (class of 2025)", "5,781"], ["Interviews", "513"], ["Average accepted GPA", "3.81"], ["Average accepted MCAT", "511"], ["From Ontario", "82%"], ["Master’s or PhD", "35%"]],
    adm: { who: "Canadian citizens and permanent residents (plus a small number of international seats).", gpa: "Cumulative GPA, threshold 3.0. Above the threshold, a higher GPA gives no advantage.", tests: "MCAT total of at least 500 with 125 or more in every section. Casper required (its threshold isn’t published).", select: "Since 2025 Queen’s uses a lottery: everyone above the GPA, MCAT and Casper thresholds who applies on time enters a random draw (QARS) for an internal MMI evaluation, with 90% of spots for Ontario residents. Those who pass go on to file review and a virtual panel interview (February to March), and offers come from the ranked list.", extra: ["8% of internal MMI spots are reserved for fee-waiver applicants not picked in the main draw.", "MDFM: apply separately in OMSAS if you know you want family medicine.", "Indigenous Student Admissions Pathway with at least four seats."] },
    prog: { str: "Two pre-clerkship years, then clerkship. About 81 weeks of clerkship including electives and selectives.", sites: "Kingston, plus the Queen’s-Lakeridge Health MDFM campus in Durham Region.", feat: ["Small-group and team-based learning", "MD Family Medicine six-year combined MD and residency track", "QuARMS early-admission route"] },
    tu: [["Domestic students", "$23,983 + about $1,820 in fees"]], tuyear: "2026–27",
    life: "Kingston rents are moderate but student housing near campus fills early.",
    src: [["Queen’s admissions statistics", "https://meds.queensu.ca/node/885"], ["Queen’s 2026–27 tuition", "https://www.queensu.ca/registrar/tuition-fees/undergraduate"], ["OMSAS: Queen’s", "https://www.ouac.on.ca/guide/omsas-queens/"]],
  },
  ottawa: {
    est: 1945, len: 4, cities: ["ottawa"], tuition: 27000, tuEst: 1,
    lede: "The first medical school in North America to teach the MD in both English and French. No MCAT, but prerequisite courses and a strict three-year GPA calculation. Clinical training spans the capital’s full range of academic hospitals.",
    r: [2, 2, 4, 5, 4, 3],
    about: "About 184 students start each year: roughly 128 in the anglophone stream and 56 in the francophone stream. Students choose their language when they apply. Training runs through The Ottawa Hospital, CHEO, the Heart Institute, Montfort and Bruyère, with 18 weeks of electives in fourth year.",
    good: ["No MCAT", "Practise medicine in both official languages", "Full tertiary care, including a major heart institute and children’s hospital", "Capital city with lots to do", "Large clinical network for electives"],
    bad: ["GPA is everything at the screen: three most recent full years, no adjustments", "Prerequisite courses can trip up non-science applicants", "Rent is close to Toronto’s", "Francophone stream needs real fluency"],
    st: [["Applications (2026 cycle)", "5,920"], ["Interviews", "621"], ["Admitted", "189"]],
    adm: { who: "Canadian citizens, permanent residents and Convention refugees. 95% of seats for Ontario applicants.", gpa: "Minimum about 3.5, but the real cut-off is much higher. Ottawa uses your three most recent full-time years. You need at least three years of full-time study by June 30 of the entry year.", tests: "No MCAT. No Casper (moving to an asynchronous MMI shared with other Ontario schools).", select: "GPA screens for file review, then the Autobiographical Sketch, essays and references decide interviews. Semi-structured panel interviews in February and March, about 600 invited.", extra: ["Prerequisites: courses in biology, chemistry (general, organic, biochemistry), statistics and humanities or social sciences. Check the current list.", "Pick English or French stream on your application."] },
    prog: { str: "Two pre-clerkship years, then clerkship, with 18 weeks of electives in fourth year. About 80 weeks of clerkship.", sites: "Ottawa academic hospitals plus community sites in Eastern Ontario.", feat: ["Bilingual program", "Francophone stream", "MD/PhD program"] },
    tu: [["Ontario residents", "About $27,000 a year (estimate; check uOttawa’s fee tables)"]], tuyear: "estimate",
    life: "Ottawa rents are among the highest outside Toronto and Vancouver.",
    src: [["uOttawa MD admissions", "https://www.uottawa.ca/faculty-medicine/undergraduate/admissions"], ["uOttawa about admissions", "https://www.uottawa.ca/faculty-medicine/undergraduate-medical-education/about-admissions"], ["OMSAS: Ottawa", "https://www.ouac.on.ca/guide/omsas-ottawa/"]],
  },
  nosm: {
    est: 2005, len: 4, cities: ["sudbury", "thunderbay"], tuition: 23711,
    lede: "Canada’s first independent medical university, built to train doctors for Northern Ontario. Students learn in Sudbury and Thunder Bay and spend much of their training in small northern and Indigenous communities. No MCAT; your background counts as much as your GPA.",
    r: [3, 4, 2, 4, 2, 3],
    about: "NOSM University admits 88 students a year (55 in Sudbury, 33 in Thunder Bay). Selection weighs GPA and a context score equally: where you grew up, rural roots, Indigenous and Francophone identity. Third year is a comprehensive community clerkship based in a northern community.",
    good: ["No MCAT", "Rural and northern roots are a real advantage", "Extremely hands-on training, often one-on-one with a preceptor", "Strong Indigenous and Francophone health focus", "Affordable cities and stunning outdoors"],
    bad: ["Hard to get in from the GTA without northern or rural ties", "Fewer research opportunities and subspecialty rotations", "Lots of travel and living in small communities", "Long winters and distance from family down south"],
    st: [["Applications (class of 2026)", "2,516"], ["Interviews", "317"], ["Admitted", "88"], ["Average GPA", "3.79"], ["From Northern Ontario", "83%"], ["Indigenous / Francophone", "15% / 26%"]],
    adm: { who: "Canadian citizens and permanent residents. The class is built to reflect Northern Ontario.", gpa: "Cumulative GPA (all courses, including repeats and distance courses). Recent admitted average about 3.8.", tests: "No MCAT. No Casper. The Francophone stream needs proof of spoken French.", select: "GPA and a context score (northern, rural, Indigenous or Francophone background) are weighted equally; about 300–350 are interviewed. Interviews are a virtual asynchronous MMI plus a live panel, late February and early March.", extra: ["Indigenous and Francophone admissions streams.", "At least six designated Indigenous positions."] },
    prog: { str: "Four years. Year 3 is a comprehensive community clerkship based in a northern community; years 1, 2 and 4 include placements across the north. About 75 weeks of clerkship.", sites: "Sudbury (Laurentian), Thunder Bay (Lakehead), and more than 90 communities across Northern Ontario.", feat: ["Distributed, community-engaged learning", "Indigenous community placements", "Comprehensive community clerkship"] },
    tu: [["Domestic students, year 1", "$23,711 tuition + $1,156.50 in fees"]], tuyear: "2026–27",
    life: "Rent is much cheaper than southern Ontario, but plan for travel costs to rural placements.",
    src: [["NOSM class profiles", "https://www.nosm.ca/nosm-university-admissions-learner-recruitment/ume-program-md-degree-admissions/class-profiles/"], ["NOSM selection process", "https://www.nosm.ca/nosm-university-admissions-learner-recruitment/ume-program-md-degree-admissions/selection-process-offers-of-admission/"], ["NOSM 2026–27 fees", "https://www.nosm.ca/education/current-learners/student-accounts/tuition-fees/"]],
  },
  tmu: {
    est: 2025, len: 4, cities: ["brampton"], tuition: 25604,
    lede: "The newest medical school in Ontario and the first new one in the GTA in over a century, focused on primary care for Peel Region and other underserved communities. No MCAT and no Casper; an online Kira Talent assessment and a virtual MMI instead.",
    r: [2, 3, 2, 3, 3, 3],
    about: "TMU’s School of Medicine opened in Brampton in 2025 with 94 students; its second class started in September 2026. It is built around equity, decolonization and community health, with William Osler Health System as its main clinical partner.",
    good: ["No MCAT or Casper", "Mission and lived experience genuinely count", "Brand-new building and curriculum", "Very diverse patient population", "Close to Toronto"],
    bad: ["No graduating class yet, so no CaRMS track record", "Fewer research resources than established schools", "Brampton is suburban and car-friendly", "Curriculum and policies are still settling in"],
    st: [["Applications (class of 2030)", "6,015"], ["Seats", "94"], ["Minimum GPA", "3.5"]],
    adm: { who: "Canadian citizens, permanent residents and Convention refugees. At least 95% of seats for Ontario residents; no international applicants.", gpa: "Minimum OMSAS cumulative GPA of 3.5.", tests: "No MCAT. No Casper. Invited applicants complete an asynchronous assessment on Kira Talent (November 19–22, 2026 this cycle).", select: "Mission fit, lived experience and community commitment are central. About 10% of applicants reach the virtual MMI (Talking Circle for the Indigenous pathway) in late February and early March.", extra: ["Three admissions pathways (including Black and Indigenous pathways) alongside the general stream.", "First-round offers go out on May 11, 2027 with the other Ontario schools."] },
    prog: { str: "Four years with a strong primary care and community focus. About 69 weeks of clerkship.", sites: "Brampton, with clinical training mainly through William Osler Health System.", feat: ["Primary care focus", "Equity and community health built into the curriculum", "Small, new cohort"] },
    tu: [["Ontario residents", "$25,604 (2025–26 rate) + ancillary fees"], ["Other Canadians", "About $28,000 (2025–26) + fees"]], tuyear: "2025–26",
    life: "GTA rents without the downtown premium; a car helps.",
    src: [["TMU MD admissions", "https://www.torontomu.ca/school-of-medicine/programs/md/md-admissions/"], ["TMU admissions dates", "https://www.torontomu.ca/school-of-medicine/programs/md/md-admissions/how-to-apply/tmu-admissions-important-dates/"], ["TMU welcomes second cohort", "https://www.torontomu.ca/school-of-medicine/news-events/2026/09/tmu-welcomes-its-second-cohort-of-md-students/"]],
  },
  mcgill: {
    est: 1829, len: 4, cities: ["montreal", "gatineau"], tuition: 6000, tuEst: 1,
    lede: "Canada’s oldest medical faculty, in the heart of Montréal, with a French-language campus in the Outaouais. The MCAT isn’t accepted. Seats for applicants from outside Quebec are extremely limited.",
    r: [1, 4, 5, 5, 5, 3],
    about: "McGill’s MDCM admits about 250 students a year, mostly Quebec residents, with a handful of seats for other Canadians and international students. Training runs through the McGill University Health Centre, the Jewish General and affiliated hospitals. The Outaouais campus in Gatineau teaches the full program in French.",
    good: ["World-class reputation and research", "Montréal: affordable, fun, bilingual", "Very low tuition for Quebec residents", "Strong Med-P route for CEGEP students", "Huge clinical network"],
    bad: ["Out-of-province seats are tiny: 5 admitted from 328 Canadian applicants for 2026", "French needed for most patient contact", "Old buildings and a big bureaucracy", "Casper and interview weigh heavily"],
    st: [["Quebec university applicants (2026)", "1,348 applied · 352 interviewed · 142 admitted"], ["Average GPA admitted (Quebec university)", "3.88"], ["Other Canadians (2026)", "328 applied · 19 interviewed · 5 admitted"], ["Med-P (CEGEP) admitted average R score", "36.80"]],
    adm: { who: "Mostly Quebec residents. About five seats for Canadians from other provinces and a few international seats.", gpa: "Interview minimums used recently: 3.5 GPA for Quebec university applicants, 3.7 for other Canadians and international, R score 33 for Med-P.", tests: "Casper required, taken before the deadline. McGill does not accept the MCAT.", select: "Academic score and Casper decide interviews; a virtual MMI on Zoom in February (April for Med-P) decides offers.", extra: ["Med-P: a preparatory year for Quebec CEGEP students, then the MDCM.", "Black Candidate pathway, First Nations and Inuit Faculties of Medicine Program, rural and small populations pathway."] },
    prog: { str: "Four-year MDCM: pre-clerkship then clerkship. About 83 weeks of clerkship.", sites: "Montréal and the Campus Outaouais in Gatineau (in French).", feat: ["MDCM-PhD joint program", "Outaouais campus", "Med-P preparatory year for CEGEP students"] },
    tu: [["Quebec residents", "Quebec rate: $103.92 per credit in 2026–27, plus fees (a few thousand dollars a year)"], ["Other Canadians", "Higher out-of-province rate (several times the Quebec rate)"]], tuyear: "2026–27",
    life: "Montréal has the lowest rents of Canada’s three biggest cities.",
    src: [["McGill admissions statistics", "https://www.mcgill.ca/medadmissions/prospective/our-statistics"], ["McGill tuition and fees 2026–27", "https://www.mcgill.ca/student-accounts/node/59"], ["McGill Casper dates", "https://www.mcgill.ca/medadmissions/fr/postuler/exigences/elements/casper"]],
  },
  mcgillp: { alias: "mcgill" },
  udem: {
    est: 1843, len: 4, cities: ["montreal", "troisrivieres"], tuition: 5404, tuEst: 1,
    lede: "Quebec’s largest medical faculty, teaching in French in Montréal and Mauricie. CEGEP students can enter through a preparatory year; university graduates apply by November 1. Interviews are the joint MEM with Laval.",
    r: [2, 5, 4, 5, 5, 3],
    about: "Université de Montréal welcomes about 400 new medical students a year across the preparatory year and the MD. Training runs through the CHUM, CHU Sainte-Justine, Maisonneuve-Rosemont, Sacré-Cœur and the Mauricie campus in Trois-Rivières.",
    good: ["Very low tuition for Quebec residents", "Huge clinical network, including a major children’s hospital", "Montréal lifestyle", "Preparatory year opens the door to CEGEP students"],
    bad: ["French only; you need a French diploma or the proficiency test", "Few seats for non-Quebec applicants", "Large class", "Five years for students who start in the preparatory year"],
    st: [["Applications (2025–26)", "4,023"], ["Filled places", "405"]],
    adm: { who: "Mostly Quebec residents, plus New Brunswick agreement seats and Indigenous seats.", gpa: "University applicants are ranked on their university GPA; CEGEP applicants on the R score (competitive scores are in the mid-30s).", tests: "Casper required. French proficiency test if you lack a French-language CEGEP or university diploma. No MCAT.", select: "Pre-selection uses your academic score and Casper (for CEGEP applicants, about 60% R score and 40% Casper), then the in-person MEM interview on April 17–18, 2027, shared with Laval.", extra: ["Mauricie campus option.", "Applications: November 1 for university applicants, March 1 for CEGEP."] },
    prog: { str: "Four-year MD (five with the preparatory year). About 79 weeks of clerkship.", sites: "Montréal and Mauricie (Trois-Rivières).", feat: ["Preparatory year for CEGEP students", "Mauricie campus", "French-language training"] },
    tu: [["Quebec residents", "About $5,400 a year plus fees (Quebec rate)"], ["Other Canadians", "Much higher out-of-province rate"]], tuyear: "2026–27, estimate from the Quebec per-credit rate",
    life: "Montréal and Trois-Rivières are among the more affordable places to study medicine in Canada.",
    src: [["UdeM MD program", "https://admission.umontreal.ca/programmes/doctorat-en-medecine/"], CMES],
  },
  laval: {
    est: 1852, len: 4, cities: ["quebec"], tuition: 5400, tuEst: 1,
    lede: "A French-language program in Québec City, one of the most affordable and beautiful cities in Canada. Shares the MEM interview with Montréal.",
    r: [2, 5, 3, 4, 4, 3],
    about: "Laval admits about 290–320 students a year. Training runs through the CHU de Québec–Université Laval, the IUCPQ heart and lung institute, and regional hospitals across eastern Quebec.",
    good: ["Very low tuition and rent", "Safe, walkable, historic city", "Skiing and outdoors close by", "Strong regional and rural exposure"],
    bad: ["French only", "Few seats for non-Quebec applicants", "Smaller research footprint than McGill or UdeM", "Long winters"],
    st: [["Applications (2025–26)", "3,345"], ["Filled places", "323"]],
    adm: { who: "Mostly Quebec residents, with small allocations for other Canadians, New Brunswick and international study-permit holders.", gpa: "University GPA or CEGEP R score.", tests: "Casper required (used for pre-selection). French proficiency. No MCAT.", select: "Pre-selection on academics and Casper, then the MEM interview on April 17–18, 2027 (at Laval or Montréal).", extra: ["Applications: November 1 for university applicants, March 1 for CEGEP."] },
    prog: { str: "Four years. About 72 weeks of clerkship.", sites: "Québec City and regional sites in eastern Quebec.", feat: ["French-language training", "Regional clerkship options"] },
    tu: [["Quebec residents", "$103.92 per credit (about $4,000–5,500 a year)"], ["Other Canadians", "$103.92 + $220.43 out-of-province supplement per credit"]], tuyear: "2026–27",
    life: "Laval estimates rent of $5,400–$9,640 a year and groceries around $6,160 for a modest student budget; your transit pass is included in fees.",
    src: [["Laval MD program", "https://www.ulaval.ca/etudes/programmes/doctorat-en-medecine"], ["Laval cost of study", "https://www.ulaval.ca/futurs-etudiants/planifiez-vos-etudes/cout-des-etudes-et-budget"], ["Laval fees, Canadians outside Quebec", "https://www.ulaval.ca/etudes/droits-de-scolarite/etudiant-canadien-hors-quebec/programmes-de-1er-et-2e-cycles/automne-2026-hiver-2027"]],
  },
  sherb: {
    est: 1961, len: 4, cities: ["sherbrooke", "saguenay", "moncton"], tuition: 5404,
    lede: "The French-language school that brought problem-based learning to Quebec, with campuses in Sherbrooke, Saguenay and Moncton. Francophone New Brunswickers have their own seats.",
    r: [2, 5, 3, 4, 3, 3],
    about: "Sherbrooke admits about 270 students a year. Its campuses include the main Sherbrooke site (CHUS), Saguenay and the Moncton site in New Brunswick, run with the Université de Moncton for francophone Atlantic students.",
    good: ["Very low tuition for Quebec residents", "Problem-based, small-group learning", "Seats for francophone New Brunswick students", "Affordable cities"],
    bad: ["French only", "Small cities", "Fewer research options than Montréal", "Interview is virtual"],
    st: [["Applications (2025–26)", "3,653"], ["Filled places", "278"]],
    adm: { who: "Mostly Quebec residents; 28 seats for Atlantic (francophone New Brunswick) applicants.", gpa: "University GPA or CEGEP R score (recent last-invited R scores around 32.5–33).", tests: "Casper required. French proficiency. No MCAT.", select: "Pre-selection on academics and Casper, then a virtual MEM in April.", extra: ["Applications: November 1 for university applicants, March 1 for CEGEP."] },
    prog: { str: "Four years with problem-based learning. About 70 weeks of clerkship.", sites: "Sherbrooke, Saguenay and Moncton.", feat: ["Problem-based learning", "Moncton site for New Brunswick", "Regional campuses"] },
    tu: [["Quebec residents", "$103.92 per credit, $5,403.84 a year, plus fees"], ["Other Canadians", "Higher out-of-province rate"]], tuyear: "2026–27",
    life: "Some of the lowest living costs of any Canadian medical school.",
    src: [["Sherbrooke fees for Quebec residents", "https://www.usherbrooke.ca/registraire/fileadmin/sites/registraire/documents/Reglement_des_etudes/Annexe2_2026-09-09.pdf"], ["Sherbrooke MD program", "https://www.usherbrooke.ca/admission/programme/7/doctorat-en-medecine"], CMES],
  },
  mun: {
    est: 1967, len: 4, cities: ["stjohns", "charlottetown"], tuition: 14250,
    lede: "Low tuition, a tight community and the earliest deadline in Canada (late August). Most seats go to Newfoundland and Labrador residents; 20 are for PEI residents at Memorial’s new UPEI campus in Charlottetown.",
    r: [3, 5, 3, 4, 3, 3],
    about: "Memorial admits about 110 students a year: 84 from Newfoundland and Labrador, 20 PEI residents at the UPEI campus, and 6 from other provinces. Training is based at the Health Sciences Centre in St. John’s, with rural placements across the province.",
    good: ["Lowest tuition for non-Quebec Canadians", "Small, close class", "Lots of rural and hands-on experience", "PEI residents can train at home"],
    bad: ["Only six seats for applicants from outside NL and PEI", "Earliest deadline in the country", "Remote; flights home are expensive", "Needs both MCAT and Casper"],
    st: [["Applications (2025–26)", "656"], ["Filled places", "110"]],
    adm: { who: "Canadian citizens and permanent residents. 84 NL seats, 20 PEI seats (PEI residents only), 6 for other provinces.", gpa: "A bachelor’s degree before entry; GPA considered holistically.", tests: "MCAT required (no minimum; 505 or higher recommended), written by August 22, 2026 this cycle. Casper required. Release both by September 24.", select: "Holistic review of academics, MCAT, Casper and experiences. Online MMI and competency assessment.", extra: ["PEI applicants apply to Memorial’s PEI pool.", "Application deadline: August 26 (11:59 p.m. NL time)."] },
    prog: { str: "Four years. About 76 weeks of clerkship.", sites: "St. John’s, Charlottetown (UPEI campus), and rural sites across NL.", feat: ["Rural and community training", "PEI campus"] },
    tu: [["Canadian citizens and permanent residents", "$14,250 a year"], ["International", "$30,000 a year"]], tuyear: "current",
    life: "St. John’s rents are moderate; budget for flights home.",
    src: [["Memorial enrolment fees", "https://mun.ca/medicine/administrative-departments/learner-well-being-and-success/new-learners/enrollment-fees/"], ["Memorial application timelines", "https://mun.ca/medicine/admissions/when-you-apply/application-timelines/"], CMES],
  },
  dal: {
    est: 1868, len: 4, cities: ["halifax", "saintjohn", "sydney"], tuition: 25568,
    lede: "The Maritimes’ medical school, with campuses in Halifax, Saint John and Cape Breton. Only Maritime residents can apply, and seats are split by province.",
    r: [3, 3, 3, 4, 4, 3],
    about: "Dalhousie admits about 169 students a year: Nova Scotians in Halifax and Cape Breton, New Brunswickers at Dalhousie Medicine New Brunswick in Saint John, and a few PEI students in Halifax. Training spans the QEII, IWK and hospitals across the region.",
    good: ["Good odds for Maritime residents", "Halifax is a fun, walkable student city", "Distributed campuses keep students close to home", "Strong rural and regional training"],
    bad: ["No general out-of-province pool", "Two-part application with early deadlines (July and September)", "Halifax rents have climbed fast", "Higher tuition than Memorial"],
    st: [["Applications (2025–26)", "1,766"], ["Filled places", "174"]],
    adm: { who: "Maritime residents only (Nova Scotia, New Brunswick, PEI), plus Indigenous and Black learner pathways.", gpa: "Considered alongside the MCAT on a sliding scale.", tests: "MCAT required (minimum tied to GPA). Casper required, used for interview selection.", select: "Academics, MCAT and Casper for interview, then a virtual MMI.", extra: ["Section 1 due July 31; Section 2 and transcripts due September 3.", "Indigenous Admissions Pathway and Black Learners Admissions Pathway."] },
    prog: { str: "Four years. About 90 weeks of clerkship including electives and selectives.", sites: "Halifax, Saint John (NB) and the Cape Breton campus.", feat: ["Distributed campuses", "Rural focus at Cape Breton"] },
    tu: [["Per year", "$25,568.40 tuition, $27,300.20 with fees"]], tuyear: "2026–27",
    life: "Halifax has seen some of the fastest rent increases in Canada.",
    src: [["Dalhousie 2026–27 fee schedule", "https://cdn.dal.ca/content/dam/dalhousie/pdf/admissions/MoneyMatters/Dentistry%20and%20Medicine%202026-2027.pdf"], ["Dalhousie application deadlines", "https://medicine.dal.ca/departments/core-units/admissions/application-deadlines.html"], CMES],
  },
  umanitoba: {
    est: 1883, len: 4, cities: ["winnipeg"], tuition: 12500, tuEst: 1,
    lede: "Western Canada’s first medical school, with some of the lowest tuition and rent in the country and a hospital next door. Most seats go to Manitobans.",
    r: [3, 5, 3, 4, 3, 3],
    about: "The Max Rady College of Medicine admits about 140 students a year to its Bannatyne campus beside the Health Sciences Centre. About 95% of seats go to Manitoba residents.",
    good: ["Low tuition and low rent", "Hospital beside campus", "Good odds for Manitobans", "Strong rural and northern training"],
    bad: ["Very few out-of-province seats (up to 5%)", "Brutal winters", "Needs MCAT and Casper, with a Casper minimum", "Downtown safety concerns"],
    st: [["Applications (2025–26)", "725"], ["Filled places", "138"]],
    adm: { who: "Canadian citizens and permanent residents. About 95% Manitoba residents.", gpa: "A bachelor’s degree completed by June 30 of the entry year.", tests: "MCAT (taken between April 2023 and September 13, 2026 for this cycle). Casper required with a minimum score.", select: "Academics, MCAT and Casper for interview, then a virtual MMI (in-person panel for the Indigenous pool).", extra: ["Indigenous course requirement."] },
    prog: { str: "Four years. About 81 weeks of clerkship.", sites: "Winnipeg and rural and northern Manitoba.", feat: ["Rural and northern placements"] },
    tu: [["Canadian students", "About $12,000–12,500 a year (2025–26 rates plus a 4% increase)"]], tuyear: "estimate",
    life: "Winnipeg rents average about $1,300 for a one-bedroom.",
    src: [["U of Manitoba average tuition", "https://umanitoba.ca/institutional-analysis/sites/institutional-analysis/files/2025-11/average-tuition-rates-2025-2026-estimated-accessible-pdf.pdf"], ["Max Rady admission requirements", "https://www.umanitoba.ca/explore/undergraduate-admissions/requirements/medicine"], CMES],
  },
  usask: {
    est: 1926, len: 4, cities: ["saskatoon", "regina"], tuition: 22773,
    lede: "Saskatchewan’s only medical school, with full programs in Saskatoon and Regina and a growing focus on rural and Indigenous health. The province is adding 20 seats.",
    r: [3, 3, 3, 4, 3, 3],
    about: "USask admitted 108 students for 2026, with the province funding 20 more seats and aiming for 95% of admissions from Saskatchewan. Year 3 can be done in a longitudinal integrated clerkship in a smaller community.",
    good: ["Good odds for Saskatchewan residents", "Low cost of living", "Rural and Indigenous health focus", "Choice of Saskatoon or Regina"],
    bad: ["Little room for out-of-province applicants", "Indigenous studies prerequisite", "Cold winters", "Smaller research base"],
    st: [["Applications (2025–26)", "886"], ["Filled places", "108"]],
    adm: { who: "Canadian citizens and permanent residents, with strong preference for Saskatchewan residents.", gpa: "Minimum university average of 80%; a four-year degree completed before entry.", tests: "MCAT in one sitting before the deadline. Casper required.", select: "Academics, MCAT, Casper and Saskatchewan/rural connection. Interviews include an MMI, panel and Conversation Circle.", extra: ["Indigenous studies prerequisite (the accepted courses change for the 2027 cycle).", "Indigenous Admissions Circle (up to 20 seats) and DSAAP (up to 7 seats)."] },
    prog: { str: "Four years. About 84 weeks of clerkship.", sites: "Saskatoon, Regina, Prince Albert and rural sites.", feat: ["Saskatchewan Longitudinal Integrated Clerkship", "Regina campus"] },
    tu: [["Per year", "$22,773 tuition + $1,331.66 in fees"]], tuyear: "2026–27",
    life: "Some of the lowest rents of any medical school city.",
    src: [["USask MD admissions", "https://admissions.usask.ca/medicine.php"], ["USask how to apply", "https://medicine.usask.ca/admission-to-the-md-program/how-to-apply.php"], ["Saskatchewan adds 20 seats", "https://www.saskatchewan.ca/government/news-and-media/2026/may/06/training-more-doctors-to-strengthen-saskatchewans-health-care-workforce"]],
  },
  ualberta: {
    est: 1913, len: 4, cities: ["edmonton"], tuition: 16464,
    lede: "A large, research-strong school with no prerequisite courses and no Casper. Most seats go to Albertans (rising to 90% from the 2027–28 cycle), and tuition is low for the West.",
    r: [3, 4, 4, 4, 3, 3],
    about: "U of A admits 192 students a year. Training runs through the University of Alberta Hospital, the Mazankowski Heart Institute, the Stollery Children’s Hospital and sites across northern Alberta, with up to 30 rural applicants admitted within the quota.",
    good: ["No prerequisites and no Casper", "Lower tuition than most of the country", "Big academic hospitals on campus", "Affordable city"],
    bad: ["Out-of-province seats shrinking to 10%", "Non-Albertans need 128+ in CARS", "Cold winters", "Edmonton is spread out"],
    st: [["Applications (2025–26)", "1,958"], ["Filled places", "203"]],
    adm: { who: "Canadian citizens and permanent residents. 85% of seats for Albertans now, 90% from the 2027–28 cycle.", gpa: "Registered in or holding a bachelor’s degree; cumulative GPA.", tests: "MCAT: at least 124 in every section for Albertans; non-Albertans need 128 in CARS. Last accepted MCAT date for this cycle was August 28, 2026. No Casper.", select: "GPA and MCAT, then a file review and virtual MMI and panel interviews (plus a rural panel).", extra: ["New Alberta residency declaration from the 2026–27 cycle.", "Graduate-degree points need proof of completion by the published date."] },
    prog: { str: "Four years. About 75 weeks of clerkship.", sites: "Edmonton and northern Alberta.", feat: ["Rural and regional training", "MD/PhD"] },
    tu: [["Per year", "$10,229.24 tuition + $6,234.28 program differential = $16,463.52"]], tuyear: "2026–27",
    life: "Edmonton is one of the cheaper big cities in Canada.",
    src: [["U of A medicine fees 2026–27", "https://preview.ualberta.ca/en/registrar/costs-tuition-fees/undergraduate-tuition/dentistry-medicine-and-pgme-fees.html"], ["U of A important dates", "https://www.ualberta.ca/medicine/programs/md/applying-to-medicine/before-you-apply/important-notices-and-dates.html"], CMES],
  },
  ucalgary: {
    est: 1967, len: 3, cities: ["calgary"], tuition: 22888,
    lede: "A three-year, year-round MD an hour from the Rockies. No prerequisites, no Casper, and an in-person MMI. 90% of seats go to Albertans.",
    r: [2, 3, 4, 4, 4, 1],
    about: "The Cumming School of Medicine admits about 185 students a year into a three-year program with no summer break. Training is based at the Foothills Medical Centre and sites across southern Alberta.",
    good: ["Finish in three years", "Mountains next door", "No prerequisites or Casper", "Strong clinical skills teaching"],
    bad: ["Intense schedule with little time off", "Out-of-province applicants need 128+ in CARS and compete for few seats", "Less time to explore before CaRMS", "Car-dependent city"],
    st: [["Applications (2025–26)", "2,013"], ["Filled places", "190"], ["Applicants receiving offers, 2024–25: GPA / CARS", "3.88 / about 127"]],
    adm: { who: "Canadian citizens and permanent residents. 90% Albertans.", gpa: "At least two years of full-time university.", tests: "MCAT released by the deadline; out-of-province applicants need 128 in CARS. No Casper.", select: "GPA and MCAT screen, then file review and an in-person MMI in February and March (about 660 interviews).", extra: ["Indigenous education requirement uploaded by the deadline.", "Three letters of reference due with the application."] },
    prog: { str: "Three years, year-round. About 60 weeks of clerkship.", sites: "Calgary and southern Alberta.", feat: ["Three-year program", "Longitudinal clerkship options"] },
    tu: [["Year one", "$22,888 tuition"]], tuyear: "2026–27",
    life: "Alberta Student Aid estimates about $6,500 in books, supplies and instruments in year one.",
    src: [["ALIS: U of C Doctor of Medicine costs", "https://alis.alberta.ca/occinfo/post-secondary-programs/doctor-of-medicine/university-of-calgary/84f3f490-b1c0-4928-b448-a12700c5f303/"], ["U of C reference statistics 2024–25", "https://cumming.ucalgary.ca/sites/default/files/teams/4/Reference%20%26%20Stats/Reference%20Statistics%202024-2025%20For%20Admissions%20Page.pdf"], CMES],
  },
  ubc: {
    est: 1950, len: 4, cities: ["vancouver", "victoria", "princegeorge", "kelowna"], tuition: 21219,
    lede: "BC’s distributed medical school, with four sites across the province. Offers are site-specific and binding, so you choose where you’ll live for four years. Up to 33 seats go to applicants from outside BC.",
    r: [2, 2, 5, 5, 5, 3],
    about: "UBC admits 328 students a year: 208 in the Vancouver-Fraser program, 40 each in the Island (Victoria), Northern (Prince George) and Southern (Kelowna) programs. Everyone starts in Vancouver, then distributed students move to their site.",
    good: ["Choice of four very different places to train", "Strong research and academic centres", "Mild climate in Vancouver and Victoria", "Northern and rural pathways for students who want that life"],
    bad: ["Very few out-of-province seats", "Site offers are binding; you might end up far from home", "Vancouver rent is the highest in Canada", "Long commutes to Fraser Health sites"],
    st: [["Applicants (2024)", "2,915"], ["Accepted and enrolled", "328 (11.3%)"], ["Average MCAT (2024)", "513"]],
    adm: { who: "Canadian citizens, permanent residents and refugees with status. At most 33 out-of-province positions.", gpa: "At least 90 credits and English prerequisites done by April 30 of the entry year.", tests: "MCAT, scores in by October 15. No Casper.", select: "Academic and non-academic scores (including new structured activity entries), then an in-person MMI (returning this cycle) and Northern and Rural panels.", extra: ["Book your interview by mid-December.", "Indigenous, Black Student and Northern and Rural pathways."] },
    prog: { str: "Four years. About 88 weeks of clerkship.", sites: "Vancouver, Victoria, Prince George and Kelowna.", feat: ["Distributed program across BC", "MD/PhD", "Rural and northern training"] },
    tu: [["Per year", "$21,219.27"]], tuyear: "current",
    life: "Your living costs depend heavily on your site: Prince George is far cheaper than Vancouver.",
    src: [["UBC admission statistics", "https://mdprogram.med.ubc.ca/admissions/admissions-statistics/"], ["UBC MD/PhD (MD tuition)", "https://mdprogram.med.ubc.ca/mdphd/admission-requirements/"], ["UBC application timelines", "https://mdprogram.med.ubc.ca/admissions/application-timelines/"]],
  },
  sfu: {
    est: 2026, len: 3, cities: ["surrey"], tuition: 31204,
    lede: "Western Canada’s first new medical school in nearly 60 years, in Surrey. A three-year, community-focused MD. Grades and MCAT above the threshold give no extra advantage.",
    r: [3, 2, 2, 3, 4, 2],
    about: "SFU’s Stephens Family School of Medicine admitted its first 48 students in 2026 and plans 64 for 2027. Classes are at SFU Surrey; clinical learning is across the Fraser Health region.",
    good: ["Beyond the threshold, extra GPA and MCAT points don’t matter", "Community-focused mission", "Three years to graduation", "Surrey is cheaper than Vancouver"],
    bad: ["No graduates yet, so no CaRMS track record", "Highest tuition in Canada for domestic students", "Small, new support infrastructure", "Fraser Health hospitals are stretched"],
    st: [["Applications (2026 entry)", "1,864"], ["Interviewed", "205"], ["Admitted", "48"], ["2027 class size", "64"]],
    adm: { who: "Canadian citizens and permanent residents only.", gpa: "Academic eligibility by GPA only, MCAT only, or both; scores beyond the threshold give no extra advantage.", tests: "Check SFU’s applicant manual. Proof of residency, citizenship and transcripts due with the application.", select: "Mission fit and experiences in a community-focused, socially accountable school. In-person MMI at SFU Burnaby (March 13–14, 2027); five character references from invited and waitlisted applicants.", extra: ["Application deadline: October 7, 3:00 p.m. PT.", "Where you did your undergrad doesn’t matter."] },
    prog: { str: "Three years. Classes at SFU Surrey; clinical learning across Fraser Health.", sites: "Surrey and the Fraser Health region.", feat: ["Three-year program", "Community-based training"] },
    tu: [["Year 1", "$31,204.14"], ["Year 2", "$31,828.23"], ["Year 3", "$21,643.20"], ["Total", "$84,675.57"]], tuyear: "current",
    life: "Surrey rents are lower than Vancouver’s but still high for Canada.",
    src: [["SFU financial resources", "https://www.sfu.ca/medicine/admissions/financial-resources.html"], ["SFU 2026 admission statistics", "https://www.sfu.ca/medicine/admissions/fall-2026-admission-statistics.html"], ["SFU key dates", "https://www.sfu.ca/medicine/admissions/how-to-apply/key-dates.html"]],
  },
};
/* Extra admissions detail. w: published weightings [title, [[part, %], ...], note]. tr: yearly series [title, [[year, value], ...], fmt, max].
   ch: what's changed or being talked about [tag, text]; tag is "Official", "Changed", "Rumour" or "Forecast". fc: our forecast for this cycle and next. */
const MSX = {
  uoft: { tr: [["Applications, by entering year", [["2019", 3553], ["2020", 3940], ["2021", 4319], ["2022", 4302], ["2023", 4263], ["2024", 4290], ["2025", 4722], ["2026", 4870]], 0, 0, "pick"], ["Average accepted GPA, by entering year", [["2019", 3.96], ["2020", 3.95], ["2021", 3.96], ["2022", 3.94], ["2023", 3.93], ["2024", 3.95], ["2025", 3.94], ["2026", 3.95]], 2, 4, "gpa"]],
    ch: [["Changed", "Weighted GPA (dropping your lowest courses) was discontinued from the 2022–23 cycle, so every course now counts."], ["Official", "A fifth academy, in Scarborough, opens to students entering in fall 2027, which may add seats."]],
    fc: "Expect applications around 5,000 and an accepted GPA near 3.95 for 2027 and 2028 entry. The MCAT minimum (125 per section, one 124 allowed) has been stable." },
  mac: { w: [["Who gets an interview", [["GPA", 32], ["MCAT CARS", 32], ["Casper", 32], ["Grad degree bonus (up to)", 4]]], ["Who gets an offer", [["Interview (MMI)", 70], ["GPA", 15], ["MCAT CARS", 15]], "Casper only counts for the interview stage."]],
    tr: [["Mean GPA of admitted class, by graduating class", [["2017", 3.83], ["2025", 3.91], ["2027", 3.92]], 2, 4, "gpa"], ["Mean CARS of admitted class, by graduating class", [["2022", 129], ["2026", 129], ["2027", 129]], 0, 132, "test"], ["Applications, by graduating class", [["2025", 5605], ["2026", 5330]], 0, 0, "pick"]],
    ch: [["Official", "About 570 applicants are invited to the virtual MMI each year (560 interviewed for the class of 2026, with 221 admitted)."]],
    fc: "The formula has been stable for years. Expect a mean CARS around 129 and the minimum to stay at 123." },
  western: { tr: [["Average GPA in best year, by graduating class", [["2027", 3.93], ["2028", 3.95], ["2029", 3.96], ["2030", 3.96]], 2, 4, "gpa"], ["Average GPA in second-best year, by graduating class", [["2028", 3.90], ["2029", 3.91], ["2030", 3.88]], 2, 4, "gpa"], ["Average total MCAT of admitted class, by graduating class", [["2028", 513], ["2029", 513], ["2030", 513]], 0, 528, "test"], ["Applications, by graduating class", [["2027", 2635], ["2028", 2611], ["2029", 3623], ["2030", 3813]], 0, 0, "pick"], ["Interviews, by graduating class", [["2027", 454], ["2028", 464], ["2029", 696], ["2030", 699]], 0, 0, "pick"]], cut: [["Minimum MCAT per section, 2025–26", "126 (125 through a pathway)"], ["Minimum total this implies", "504"], ["Admitted class average total", "513"]],
    ch: [["Changed", "Since the 2024–25 cycle you can apply during third year of a four-year degree, which is why applications jumped about 40% for the class of 2029."], ["Official", "Minimum GPA 3.70 in each of your two best years. Western resets its MCAT minimums every cycle based on the applicant pool and publishes only the current cycle’s."], ["Changed", "A Black Applicant Pathway was added alongside the Access and Indigenous pathways."], ["Rumour", "Western’s dental school is moving to cumulative GPA instead of the two best years, and students on r/premedcanada expect medicine may follow. Western’s medicine pages still say two best years."]],
    fc: "Applications should stay near 3,800–4,000 with about 700 interviews. MCAT minimums have crept up and could reach 126–127 per section. If medicine follows dentistry to cumulative GPA, applicants with a weak first year lose their biggest advantage at Western." },
  queens: {
    ch: [["Official", "2024 cycle: 5,121 applications (OMSAS)."], ["Changed", "From the 2025 entering class, Queen’s replaced ranking by GPA and MCAT with a random draw among applicants above the thresholds (GPA 3.0, MCAT 500 with 125 per section, plus Casper)."], ["Official", "90% of internal MMI spots go to Ontario residents; 8% are held for fee-waiver applicants."]],
    fc: "Under the lottery, published thresholds matter more than averages. Expect the GPA and MCAT thresholds to stay where they are; the Casper threshold isn’t published and can move." },
  ottawa: { ch: [["Official", "2024 cycle: 4,888 applications to the English stream alone (OMSAS)."], ["Official", "Ottawa no longer uses Casper and is moving to an asynchronous MMI shared with other Ontario schools."], ["Official", "2026 cycle: 5,920 applications, 621 interviews, 189 admitted."]],
    fc: "Expect around 6,000 applications. The GPA screen (three most recent full years) has historically needed about 3.9 or higher to get an interview." },
  nosm: { w: [["Who gets an interview", [["GPA", 50], ["Context score", 50]], "Context: northern, rural, Indigenous and Francophone background."]],
    tr: [["Applications, by entering class", [["2023", 1692], ["2026", 2516]], 0, 0, "pick"], ["Interviews, by entering class", [["2023", 332], ["2026", 317]], 0, 0, "pick"]],
    ch: [["Official", "About 300–350 top-ranked applicants are interviewed."]],
    fc: "Applications have grown much faster than interview spots. Expect over 2,500 applications and roughly the same number of interviews, so context score matters even more." },
  tmu: { tr: [["Applications, by graduating class", [["2029", 6400], ["2030", 6015]], 0, 0, "pick"]],
    ch: [["Official", "First class graduates in 2029, so the first CaRMS results come that spring."], ["Official", "Minimum OMSAS GPA of 3.5; about 10% of applicants reach the MMI."]],
    fc: "Applications settled near 6,000 after the opening year. Expect similar for 2027 and 2028 entry." },
  mcgill: { tr: [["Quebec university applicants, by entry year", [["2025", 1263], ["2026", 1348]], 0, 0, "pick"], ["Med-P (CEGEP) applicants, by entry year", [["2024", 827], ["2026", 1238]], 0, 0, "pick"]], w: [["Med-P pre-selection (CEGEP)", [["R score", 70], ["Casper", 20], ["CV", 10]]], ["Final selection", [["MMI", 100]]]],
    ch: [["Official", "For fall 2026, 5 of 328 applicants from other provinces were admitted."], ["Official", "Last Casper dates for fall 2027: October 15 (English) or October 22 (French) for the MDCM, February 18 for Med-P."]],
    fc: "Out-of-province seats are fixed at about five. Expect the Quebec university interview minimum to stay at a 3.5 GPA and the Med-P minimum at an R score of 33." },
  udem: { w: [["Pre-selection (CEGEP)", [["R score", 60], ["Casper", 40]]], ["Final selection", [["MEM interview", 100]]]], fc: "Minimum R score of 33 to be considered; expect it to hold." },
  laval: { w: [["Pre-selection (CEGEP)", [["Casper", 100]]], ["Final selection", [["MEM interview", 100]]]], fc: "Laval pre-selects CEGEP applicants on Casper alone above a minimum R score of 33; expect that to hold." },
  sherb: { w: [["Pre-selection (CEGEP)", [["R score", 70], ["Casper", 30]]], ["Final selection", [["MEM interview", 60], ["R score", 40]]]], fc: "Minimum R score of 32; the last candidates invited to the MEM have been around 32.5–33." },
  dal: { ch: [["Official", "Class entering 2025: 1,207 applications (561 Maritime), average GPA 3.9, average MCAT 505."]], fc: "Expect the Maritime pool to stay near 550–600 applicants for about 170 seats." },
  mun: { ch: [["Official", "Tuition for medical students has stayed at $14,250 since 2023–24, and Newfoundland and Labrador froze per-credit rates again for 2026–27."], ["Official", "Recent admitted NL and PEI applicants averaged 125–127 per MCAT section, with Casper usually in the third quartile or higher."]], fc: "Expect tuition to stay flat and the class at about 110." },
  ualberta: { w: [["Final ranking", [["Personal activities", 35], ["Interview (MMI)", 35], ["Cumulative GPA", 30]], "The MCAT is a pass/fail threshold and isn’t weighted; references are read but not scored."]],
    ch: [["Changed", "Out-of-province seats drop from 15% to 10% starting with the 2027–28 cycle."], ["Changed", "A full course load is no longer required, and Alberta applicants now declare residency on Launchpad."]],
    fc: "Non-Albertans: expect an even tighter pool from the 2027–28 cycle." },
  ucalgary: { w: [["Final score", [["File review", 50], ["Interview (MMI)", 50]], "File review weighs academic and non-academic parts equally."]],
    ch0: 1,
    ch: [["Official", "2024–25: 1,964 complete applications (1,534 Albertan, 430 non-Albertan). Non-Albertans needed a higher composite score to be interviewed (107.5 vs 103.0)."], ["Official", "Applicants receiving offers in 2024–25 averaged a 3.88 GPA and 127.4 CARS (Albertans) and 3.95 and 129.1 (non-Albertans)."]],
    fc: "Expect the same pattern: non-Albertans need about a 3.95 GPA and 129 CARS to be competitive." },
  ubc: { tr: [["Average GPA of admitted class (%)", [["2022", 88.4], ["2023", 88.8], ["2024", 88.9]], 1, 100, "gpa"], ["Average total MCAT of admitted class", [["2022", 514.6], ["2023", 514.2], ["2024", 513.2]], 1, 528, "test"], ["Applicants", [["2019", 2398], ["2020", 2558], ["2021", 2869], ["2022", 2830], ["2023", 2815], ["2024", 2915]], 0, 0, "pick"]],
    ch: [["Changed", "From the 2025–26 cycle, MCAT eligibility is based on your total score instead of section scores."], ["Changed", "In-person MMIs return this cycle."], ["Changed", "A new structured format for non-academic activity entries started with the 2026–27 application."], ["Official", "Prerequisites change: from the 2027–28 cycle, courses must be done by April 30 of the year you apply."]],
    fc: "Applicants have hovered around 2,800–2,900 with the class steady at 328. Expect an average MCAT near 513 and admission rates around 11%." },
  usask: { ch: [["Official", "The province is funding 20 new seats in 2026–27 and targeting 95% of admissions for Saskatchewan students."], ["Changed", "From the 2027 cycle, the Coursera Indigenous Canada and Cultural Humility certificates no longer meet the Indigenous studies prerequisite."]], fc: "More seats but a stronger Saskatchewan preference: better odds for residents, worse for everyone else." },
  sfu: { tr: [["Class size", [["2026", 48], ["2027", 64]], 0, 0, "pick"]], ch: [["Official", "First cycle (2026 entry): 1,864 applications, 205 interviews, 48 admitted."], ["Official", "GPA and MCAT above the threshold give no extra advantage."]], fc: "The class grows to 64 in 2027 and should keep growing; applications will likely rise as the school becomes known." },
};
// McGill Med-P shares McGill's page
const msdOf = (id) => (MSD[id] && MSD[id].alias ? MSD[MSD[id].alias] : MSD[id]);
const msdId = (id) => (MSD[id] && MSD[id].alias ? MSD[id].alias : id);
const MS_RATE = ["Odds of getting in", "Affordability", "Research", "Clinical variety", "Student life", "Time off"];
if (typeof TIPS === "object")
  Object.assign(TIPS, {
    "Odds of getting in": "How realistic a seat is: first-year seats per applicant, plus residency rules. Schools that save almost every seat for their own province score low for most out-of-province applicants. 5 = best odds.",
    Affordability: "Tuition plus typical rent in the school’s city over the whole program. 5 = cheapest.",
    Research: "How easy it is to get involved in research: size of the research enterprise, labs and institutes, and how often students publish.",
    "Clinical variety": "Range of patients, hospitals and subspecialties you can rotate through, from community clinics to quaternary centres.",
    "Student life": "What life outside class is like: the city, the class culture, and how much there is to do on a night or weekend off.",
    "Time off": "How much breathing room the program gives you: summers off, vacation and pace. Three-year, year-round programs (McMaster, Calgary, SFU) score lowest.",
  });
const msMoney = (n) => "$" + Math.round(n).toLocaleString("en-CA");

function renderSchool(id) {
  const s = medSchool(id), d = msdOf(id);
  const steps = ["Overview", "Admissions", "Program", "Cost", d.cities.length > 1 ? "Cities" : "City", "Coaching"];
  const panels = [msOverview, msAdmissions, msProgram, msCost, msCity, uvCoachTab];
  if (WANT_TAB) {
    const k = steps.map(slugOf).indexOf(WANT_TAB);
    if (k >= 0) tab = k;
    WANT_TAB = "";
  }
  if (tab >= steps.length) tab = 0;
  const M = typeof medState === "function" && Acct.user ? medState() : null;
  const mn = medMain(s, M ? M.cycle : medDefaultCycle());
  const prov = (MED_PROV.find((p) => p[0] === s.prov) || [])[1];
  const on = M && M.mine[id];
  const save = Acct.user
    ? `<button type="button" class="ptool${on ? " on" : ""}" data-msadd aria-pressed="${!!on}">${on ? "On your list ✓" : "Add to my schools"}</button>`
    : `<div class="pagetools mstools"><button type="button" class="ptool" data-msjoin>Save to my schools</button></div>`;
  $("#main").innerHTML = `<p class="crumb"><a href="#home">Home</a> / <a href="#schools">Schools</a> / ${acctEsc(s.short)}</p>
  <div class="spechead"><h1>${acctEsc(s.name)}</h1>${save.startsWith("<div") ? save : `<div class="pagetools mstools">${save}</div>`}</div>
  <p class="specmeta"><span>${prov}</span><span aria-hidden="true">·</span><span>${acctEsc(s.sys)}</span><span aria-hidden="true">·</span><span>${d.len}-year MD</span><span aria-hidden="true">·</span><span>Since ${d.est}</span></p>
  <p class="lede">${d.lede}</p>
  <div class="statrow topstats">
    <div class="stat"><b>${s.seats}</b><span>First-year seats${id === "mcgillp" ? " (Med-P)" : ""} <span class="tag s">Sourced</span></span></div>
    <div class="stat"><b>${d.len} yrs</b><span>Program length</span></div>
    <div class="stat"><b>${msMoney(d.tuition)}</b><span>Tuition, first year, in-province ${d.tuEst ? '<span class="tag e">Estimate</span>' : '<span class="tag s">Sourced</span>'}</span></div>
    <div class="stat"><b>${prepFmt(mn.d, { month: "short", day: "numeric" })}</b><span>Application deadline${mn.est ? " (expected)" : ""}, ${prepFmt(mn.d, { year: "numeric" })}</span></div>
    <div class="stat"><b>${s.m === "y" ? "MCAT" : s.m === "cars" ? "CARS only" : s.m === "n" ? "No MCAT" : "Check"}</b><span>${s.c ? "Casper required" : "No Casper"}</span></div>
  </div>
  <div class="pathanchor"></div><div class="pathwrap"><div class="path" role="tablist">${steps.map((t, i) => `<button role="tab" aria-selected="${i === tab}" data-t="${i}">${t}</button>`).join("")}</div></div>
  <div class="panel" role="tabpanel">${panels[tab](s, d, id)}</div>`;
  TABPEEK = (k) => (panels[k] ? panels[k](s, d, id) : "");
  document.querySelectorAll(".path button").forEach(
    (b) =>
      (b.onclick = () => {
        const keep = typeof tabsStuck === "function" && tabsStuck();
        tab = +b.dataset.t;
        setTabHash("school-" + id, tab ? slugOf(steps[tab]) : "");
        renderSchool(id);
        afterRender();
        if (keep && typeof toTabs === "function") toTabs();
      }),
  );
  const join = $("[data-msjoin]");
  if (join) join.onclick = () => openAcct("signup", "Create a free account to save schools and track every deadline.");
  wireCoachTab(id);
  const add = $("[data-msadd]");
  if (add && M)
    add.onclick = () => {
      if (M.mine[id]) delete M.mine[id];
      else (M.mine[id] = { st: "plan", date: "" }), track("save_school", id);
      acctPush();
      renderSchool(id);
      afterRender();
    };
}
const msSrc = (d) => `<p class="srcs">Sources: ${d.src.concat([CMES, AFMC27]).filter((x, i, a) => a.findIndex((y) => y[1] === x[1]) === i).map(([t, u]) => `<a class="src" href="${u}" target="_blank" rel="noopener">${acctEsc(t)} ↗</a>`).join(" · ")}</p>`;
function msOverview(s, d) {
  return `<div class="rgrid">${MS_RATE.map((l, i) => `<div class="rcard">${rateBar(l, d.r[i])}</div>`).join("")}</div>
  <p class="note">Ratings compare each school against the others on this site; higher is better for you. Hover or tap a rating for what it means. <span class="tag e">Estimate</span></p>
  <div class="split plain"><section><h3>The school</h3><p>${d.about}</p></section><section><h3>Who gets in</h3><p>${acctEsc(s.who)}</p></section></div>
  <div class="split"><div class="box good"><h3>What students like</h3>${bl(d.good)}</div><div class="box bad"><h3>What students complain about</h3>${bl(d.bad)}</div></div>
  <p class="note">Drawn from what students and applicants commonly say in forums and school materials, not a survey. <span class="tag e">Estimate</span></p>
  ${msSrc(d)}`;
}
function msAdmissions(s, d, id) {
  MS_NOTED = false;
  const a = d.adm;
  const cyc = Acct.user && typeof medState === "function" ? medState().cycle : medDefaultCycle();
  const evs = (s.sys === "OMSAS" ? medOmsas(cyc) : []).concat(medEvents(s, cyc)).sort((x, y) => x.d.localeCompare(y.d));
  return `<div class="statrow">${d.st.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l} <span class="tag s">Sourced</span></span></div>`).join("")}</div>
  ${msSec("Who can apply", `<p>${a.who}</p>`, "")}
  ${msSec("Grades", `<p>${a.gpa}</p>`, msCharts(id, "gpa"))}
  ${msSec("Tests", `<p>${a.tests}</p>${msCut(id)}`, msCharts(id, "test"))}
  ${msSec("How they choose", `<p>${a.select}</p>${msW(id)}`, msCharts(id, "pick"))}
  ${msAlso(a, id)}
  <h2>Dates for the ${MED_CYCLES[cyc].split(" · ")[0]}</h2>
  ${cyc !== MED_BASE ? `<p class="note">Expected dates, based on last cycle, until ${acctEsc(s.short)} posts the new ones.</p>` : ""}
  <ol class="medmini mspage">${evs.map((e) => `<li class="${medPast(e) ? "past" : ""}"><span>${medDate(e, { month: "short", day: "numeric", year: "numeric" })}</span><b>${acctEsc(e.t)}</b></li>`).join("")}</ol>
  <div class="callout"><b>Before you apply:</b> confirm every requirement on <a href="${s.url}" target="_blank" rel="noopener">${acctEsc(s.short)}’s admissions site ↗</a>. Schools change cut-offs and pieces each cycle.</div>
  ${msSrc(d)}`;
}
// A section with its text on the left and its charts on the right (stacked on phones)
const msSec = (title, text, side) =>
  side ? `<section class="mssec"><div class="mstext"><h3>${title}</h3>${text}</div><div class="msside">${side}</div></section>` : `<section class="mssec solo"><h3>${title}</h3>${text}</section>`;
const MSC = ["var(--scrub)", "var(--sky)", "var(--vio)", "var(--amber)", "#26a69a"];
function msWeights(w) {
  return `<div class="msw">${w
    .map(([t, parts, note]) => `<figure class="mswf"><figcaption>${t}</figcaption><div class="mswbar" role="img" aria-label="${acctEsc(parts.map(([l, v]) => l + " " + v + "%").join(", "))}">${parts.map(([l, v], i) => `<i style="flex:${v};background:${MSC[i % 5]}" title="${acctEsc(l)}: ${v}%"><b>${v >= 12 ? v + "%" : ""}</b></i>`).join("")}</div>
    <ul class="mswleg">${parts.map(([l, v], i) => `<li><i style="background:${MSC[i % 5]}"></i>${acctEsc(l)} <b>${v}%</b></li>`).join("")}</ul>${note ? `<p class="note">${note}</p>` : ""}</figure>`)
    .join("")}</div>`;
}
// Forecast the next two years from the recent trend (half the average yearly change, capped at the scale maximum)
function msForecast(pts, dp, max) {
  const yrs = pts.map((p) => +p[0]);
  if (pts.length < 2 || yrs.some(isNaN)) return [];
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  const step = ((b[1] - a[1]) / (+b[0] - +a[0])) * 0.5;
  const out = [];
  for (let k = 1; k <= 2; k++) {
    let v = b[1] + step * k;
    if (max) v = Math.min(max, v);
    out.push([String(+b[0] + k), +v.toFixed(dp)]);
  }
  return out;
}
function msTrend([t, pts, dp, max]) {
  const fc = msForecast(pts, dp, max);
  const all = pts.concat(fc);
  const vals = all.map((p) => p[1]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo || Math.abs(hi) * 0.05 || 1) * 0.25;
  lo -= pad;
  hi += pad;
  const W = 420, H = 210, L = 12, Rr = 12, T = 26, B = 28;
  const x = (i) => L + (all.length === 1 ? (W - L - Rr) / 2 : (i * (W - L - Rr)) / (all.length - 1));
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const f = (v) => (dp ? v.toFixed(dp) : Math.round(v).toLocaleString("en-CA"));
  const line = (arr, off) => arr.map((p, i) => `${i ? "L" : "M"}${x(i + off).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  const fcPath = fc.length ? `M${x(pts.length - 1).toFixed(1)},${y(pts[pts.length - 1][1]).toFixed(1)}` + fc.map((p, i) => `L${x(pts.length + i).toFixed(1)},${y(p[1]).toFixed(1)}`).join("") : "";
  return `<figure class="mstr"><figcaption>${t}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${acctEsc(t)}: ${all.map((p, i) => p[0] + " " + f(p[1]) + (i >= pts.length ? " (forecast)" : "")).join(", ")}">
    <line x1="${L}" x2="${W - Rr}" y1="${H - B}" y2="${H - B}" class="msax"/>
    ${pts.length > 1 ? `<path d="${line(pts, 0)}" class="msln"/>` : ""}${fcPath ? `<path d="${fcPath}" class="msln fc"/>` : ""}
    ${all.map((p, i) => { const isF = i >= pts.length; return `<g class="mspt${isF ? " fc" : ""}"><circle cx="${x(i)}" cy="${y(p[1])}" r="5"/><circle cx="${x(i)}" cy="${y(p[1])}" r="14" class="hit"><title>${p[0]}: ${f(p[1])}${isF ? " (forecast)" : ""}</title></circle>${i === 0 || i === pts.length - 1 || isF || all.length <= 5 ? `<text x="${x(i)}" y="${y(p[1]) - 10}" text-anchor="middle">${f(p[1])}</text>` : ""}<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="msyr">${p[0]}</text></g>`; }).join("")}
  </svg></figure>`;
}
const msx = (id) => MSX[msdId(id)] || {};
let MS_NOTED = false; // the forecast note shows once per tab
const MS_FC_NOTE = `<p class="note">Solid line: published figures. Dashed: our projection for the next two years from the recent trend. <span class="tag f">Forecast</span></p>`;
function msCharts(id, sec) {
  const t = (msx(id).tr || []).filter((x) => x[4] === sec);
  if (!t.length) return "";
  const note = MS_NOTED ? "" : MS_FC_NOTE;
  MS_NOTED = true;
  return `<div class="mstrs">${t.map(msTrend).join("")}</div>${note}`;
}
const msCut = (id) => (msx(id).cut ? `<div class="statrow">${msx(id).cut.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l} <span class="tag s">Sourced</span></span></div>`).join("")}</div>` : "");
const msW = (id) => (msx(id).w ? `${msWeights(msx(id).w)}<p class="note">From the school’s published selection formula.</p>` : "");
function msAlso(a, id) {
  const x = msx(id), ch = x.ch || [];
  const items = (a.extra || []).map((t) => [null, t]).concat(ch);
  return `${items.length ? `<h3>Also know</h3><ul class="msch">${items.map(([tag, txt]) => `<li>${tag ? `<span class="msct k-${tag.toLowerCase()}">${tag}</span>` : ""}${txt}</li>`).join("")}</ul>` : ""}
  ${x.fc ? `<div class="callout"><b>Our read on this cycle and next:</b> ${x.fc} <span class="tag f">Forecast</span></div>` : ""}`;
}
function msProgram(s, d) {
  const p = d.prog;
  return `<div class="split plain"><section><h3>Structure</h3><p>${p.str}</p></section><section><h3>Where you train</h3><p>${p.sites}</p></section></div>
  <h3>Stand-out features</h3>${bl(p.feat)}
  <h3>Interviews</h3><p>${acctEsc(s.int)}</p>
  <p class="note">Clerkship weeks from the AFMC’s 2025 statistics (required, elective and selective weeks combined).</p>
  ${msSrc(d)}`;
}
function msCost(s, d) {
  const yrs = d.len;
  return `<div class="statrow"><div class="stat"><b>${msMoney(d.tuition)}</b><span>Tuition, first year ${d.tuEst ? '<span class="tag e">Estimate</span>' : '<span class="tag s">Sourced</span>'}</span></div><div class="stat"><b>${msMoney(d.tuition * yrs)}</b><span>Rough tuition for all ${yrs} years at today’s rate <span class="tag e">Estimate</span></span></div>
  ${d.cities.map((c) => `<div class="stat"><b>${msMoney(MCITY[c].rent)}</b><span>One-bedroom rent a month, ${MCITY[c].n} <span class="tag e">Estimate</span></span></div>`).join("")}</div>
  <h3>Tuition (${d.tuyear})</h3><div class="tw"><table><tbody>${d.tu.map(([w, v]) => `<tr><td>${w}</td><td>${v}</td></tr>`).join("")}</tbody></table></div>
  <h3>Living costs</h3><p>${d.life}</p>
  <h3>Paying for it</h3>${bl(["Every school offers need-based bursaries; apply as soon as you accept.", "Provincial student aid (OSAP, StudentAid BC, Alberta Student Aid and others) covers medical students, and most banks offer professional student lines of credit, often $250,000–350,000 with low interest.", "Plan for one-time costs: stethoscope and equipment, immunizations and police checks, and CaRMS electives and interviews in your final year."])}
  <p class="note">Rents are typical asking rents for a one-bedroom in 2026; sharing cuts them a lot.</p>
  ${msSrc(d)}`;
}
function msCity(s, d) {
  return d.cities
    .map((c) => {
      const m = MCITY[c];
      return `<h2>${m.n}</h2><div class="statrow"><div class="stat"><b>${msMoney(m.rent)}</b><span>One-bedroom rent a month ${m.est ? '<span class="tag e">Estimate</span>' : '<span class="tag e">Approximate</span>'}</span></div></div><p>${m.t}</p>
      <div class="split"><div class="box good"><h3>Good</h3>${bl(m.g)}</div><div class="box bad"><h3>Not so good</h3>${bl(m.b)}</div></div>`;
    })
    .join("") + `<p class="note">City notes are our summary; rents are approximate asking rents and move quickly.</p>`;
}
// Route: #school-<id>
{
  const _rs = render;
  render = function () {
    const [h] = hashParts();
    if (h.startsWith("school-") && medSchool(h.slice(7)) && MSD[h.slice(7)]) {
      document.body.classList.remove("is-home");
      TABPEEK = null;
      WANT_TAB = hashParts()[1];
      tab = 0;
      renderSchool(h.slice(7));
      afterRender();
      window.scrollTo(0, 0);
      return;
    }
    _rs();
  };
}
