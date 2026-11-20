# Project UltraViolet: how to work on this repo

The site at projectuv.com is built by Netlify from `main`. A push to `main` goes live in about a minute, so check your work before pushing.

## Making changes
- Build and check with `python3 build.py`. It must print `built …`; it also runs `node --check` on the combined script.
- Look at what you changed: serve `deploy/` (for example `python3 -m http.server -d deploy`) and open it in Playwright at 1280px and 390px wide, light and dark.
- Script order matters: core.js, tabs.js, track.js, charts.js, accounts.js, admin.js, medprep.js, medschools.js, uvnews.js, canada.js, uvmap.js, money.js. Pages register themselves in `PAGES[route]`.
- `js/uvnews.js` holds this year's school news (`UV_NEWS`), what applicants report on forums (`UV_HEARD`, each item marked Reported, Official or Common advice) and when results actually went out (`UV_RESULTS`). It feeds each school's News tab, the #news page, the home page, the timeline and interviews guides, and profile news. Paraphrase sources, link every item, never post usernames. News shows as cards with generated covers (tag colour, icon, school name).
- `js/canada.js` is the generated Canada outline and school dot positions for the home map (`js/uvmap.js`). `js/money.js` is the #money page: tuition bars from school data, the borrowing planner, OSAP and line-of-credit facts with sources. Money chart colours: free money sky, government violet, line of credit orange (validated). Recheck the prime rate and bank limits when they change.
- School trend charts are interactive (hover, tap, arrow keys) via `wireMsTrends`; keep every value also readable without hover.
- Admissions tab: every fact goes in its section. `msSort` files the school's extra notes, changes (Official / Changed / Rumour), our forecast (by sentence), UV_HEARD and this year's UV_NEWS under Who can apply, Grades, Tests or How they choose by keyword (`MS_TOPIC`); only leftovers go to Also know. Rumours show as a yellow Rumour card with a disclaimer. `msFit` sizes each section's charts to its text and moves extra blocks under the charts when the text runs long; no sticky text.
- School data (seats, tests, deadlines) lives in `js/medprep.js` and `js/medschools.js`, shared with Project Infrared. When a school posts new dates, update both repos.
- The guides in `core.js` (timeline, requirements, interviews, pathways) are built from that data, so they update with it. Don't hard-code school facts in guide text.
- Becoming a coach is advertised only by the footer link; keep it that way.
- `js/tabs.js` (from Project Infrared): the selected tab box slides between tabs, the selected tab is scrolled into view, and on touch screens a sideways swipe moves between tabs. Changing tabs keeps your scroll place (`keepPlace` in core.js); never scroll to the top on a tab change.
- The Sunday newsletter: the Saturday-night sweep (a scheduled task) writes `newsletter/<Sunday date>.json` and adds it to `newsletter/index.json`, then pushes. Issue format: {week, subject, intro, items:[{topic: talk|resources|debate|insider|schools|dates, title, summary, source, url, schools:[ids], date}]}. The #newsletter page shows issues; the edge function `uv-newsletter` (source in supabase/functions/) emails them Sundays at 8 a.m. via pg_cron (sql/07), filtered by each member's `nl_topics` and saved schools. It needs the secret RESEND_API_KEY.

## Database (Supabase project igdvjbgaawncwqwotvpr, ca-central-1)
- Roles live in `public.profiles.role`: student, coach, admin. Nobody can change their own role.
- Coaches edit their own profile (name, headline, bio, schools, services) on #account; only `set_coach_visible` puts them on the site.
- `admin_stats()` and `admin_update_feedback()` power the admin panel. `user_prefs.coaching_waitlist` is the "notify me when coaching opens" list.
- Coach applications: applicants insert and read their own. Only `review_coach_application(app_id, decision, note)` changes status, and only for admins. Approval sets the role to coach and creates a hidden row in `public.coaches`. `set_coach_visible(coach, show)` shows a coach on the site.
- Proof documents go in the private `coach-docs` bucket, one folder per user.
- Every schema change: add a numbered file to `sql/`, apply it as a migration, then run the security advisors.

## Analytics and admin dashboard
- `js/track.js` writes anonymous events (views, searches, outbound clicks, errors, sign-ups, saves, waitlist) to `public.events`. It skips admins, Do Not Track and localhost. No names, emails or IPs; keep it that way and keep the privacy page in step.
- `js/admin.js` is the dashboard (#admin/<tab>), drawing from `admin_traffic(days)`, `admin_users(days)`, `admin_coaching()` and `admin_stats()`. Charts live in `js/charts.js`: one violet per chart (--uv-chart), every value also printed or in a table.
- Never put the text `</script` in any JS string: it ends the page script early. build.py refuses to build if it finds it.

## Rules
- Never commit secrets: no Resend key, no service-role key.
- Commit messages: plain English about what changed for visitors.
- Make Nali the admin with: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '<her email>');`
