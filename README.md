# Project UltraViolet

projectuv.com: every Canadian medical school, from first application to offer day. Sister site to [Project Infrared](https://projectinfrared.org).

- `src/template.html`: the page shell. `build.py` fills in the styles and scripts.
- `css/`: `base.css`, `accounts.css`, `prep.css` and `medprep.css` come from Project Infrared with violet in place of red; `uv.css` holds UltraViolet's own additions.
- `js/core.js`: navigation, routing and the public pages (home, all schools, guides, coaching, about, privacy, terms).
- `js/accounts.js`: log in and sign up, the profile page, the coach application and the admin panel.
- `js/medprep.js`, `js/medschools.js`: school data, deadlines, the application tracker and the school pages (shared with Project Infrared).
- `sql/`: the database setup, in the order it was applied to the Supabase project "Project UltraViolet" (ca-central-1).

No secrets live in this repo. The Supabase key in build.py is the public "publishable" key.
