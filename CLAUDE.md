# Project UltraViolet: how to work on this repo

The site at projectuv.com is built by Netlify from `main`. A push to `main` goes live in about a minute, so check your work before pushing.

## Making changes
- Build and check with `python3 build.py`. It must print `built …`; it also runs `node --check` on the combined script.
- Look at what you changed: serve `deploy/` (for example `python3 -m http.server -d deploy`) and open it in Playwright at 1280px and 390px wide, light and dark.
- Script order matters: core.js, accounts.js, medprep.js, medschools.js. Pages register themselves in `PAGES[route]`.
- School data (seats, tests, deadlines) lives in `js/medprep.js` and is shared with Project Infrared. When a school posts new dates, update both repos.

## Database (Supabase project igdvjbgaawncwqwotvpr, ca-central-1)
- Roles live in `public.profiles.role`: student, coach, admin. Nobody can change their own role.
- Coach applications: applicants insert and read their own. Only `review_coach_application(app_id, decision, note)` changes status, and only for admins. Approval sets the role to coach and creates a hidden row in `public.coaches`. `set_coach_visible(coach, show)` shows a coach on the site.
- Proof documents go in the private `coach-docs` bucket, one folder per user.
- Every schema change: add a numbered file to `sql/`, apply it as a migration, then run the security advisors.

## Rules
- Never commit secrets: no Resend key, no service-role key.
- Commit messages: plain English about what changed for visitors.
- Make Nali the admin with: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '<her email>');`
