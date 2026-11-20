-- Applied 2026-11-20 as migration "core_accounts_and_coaching".
-- Project UltraViolet: accounts, roles, coach applications.

-- 1. Profiles: one per account. Role decides what each person can see and do.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text check (full_name is null or char_length(btrim(full_name)) between 1 and 80),
  role        text not null default 'student' check (role in ('student', 'coach', 'admin')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), 80), ''));
  insert into public.user_prefs (user_id) values (new.id);
  return new;
end; $$;

-- Admin check used by the rules below. Reads the role straight from the table.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id or (select public.is_admin()));
create policy "update own name" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;  -- nobody can change their own role

-- 2. Saved data per student: shortlisted schools, checklist, med-school tracker, notes.
create table public.user_prefs (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  schools     jsonb not null default '[]'::jsonb check (jsonb_typeof(schools) = 'array' and jsonb_array_length(schools) <= 40),
  med         jsonb,
  notes       jsonb not null default '{}'::jsonb check (jsonb_typeof(notes) = 'object' and pg_column_size(notes) < 100000),
  newsletter  boolean not null default false,
  updated_at  timestamptz not null default now(),
  constraint med_small check (med is null or pg_column_size(med) < 200000)
);
alter table public.user_prefs enable row level security;
create policy "read own prefs" on public.user_prefs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own prefs" on public.user_prefs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own prefs" on public.user_prefs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.user_prefs from anon;
grant select, insert, update on public.user_prefs to authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Coach applications. Applicants submit and read their own; only an admin decides.
create table public.coach_applications (
  id                bigint generated always as identity primary key,
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status            text not null default 'pending' check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  full_name         text not null check (char_length(btrim(full_name)) between 2 and 80),
  med_school        text not null check (char_length(med_school) <= 120),
  training_level    text not null check (char_length(training_level) <= 80),
  schools_coached   text[] not null default '{}' check (cardinality(schools_coached) between 1 and 20),
  services          text[] not null default '{}' check (cardinality(services) between 1 and 10),
  admissions_story  text not null check (char_length(admissions_story) between 20 and 3000),
  bio               text not null check (char_length(bio) between 20 and 1500),
  conflict_role     boolean not null,
  conflict_details  text check (conflict_details is null or char_length(conflict_details) <= 1000),
  proof_path        text check (proof_path is null or char_length(proof_path) <= 300),
  agreed_terms      boolean not null check (agreed_terms),
  reviewer_note     text check (reviewer_note is null or char_length(reviewer_note) <= 2000),
  reviewed_by       uuid references auth.users(id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);
alter table public.coach_applications enable row level security;
create index coach_applications_user_idx on public.coach_applications (user_id);
create index coach_applications_status_idx on public.coach_applications (status, created_at);
-- one open application at a time
create unique index coach_applications_one_open on public.coach_applications (user_id) where status in ('pending', 'needs_info');

create policy "submit own application" on public.coach_applications
  for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending' and reviewer_note is null and reviewed_by is null and reviewed_at is null);
create policy "read own or admin" on public.coach_applications
  for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));
-- applicant can edit only while you've asked for more info; the edit sends it back to pending
create policy "edit when info requested" on public.coach_applications
  for update to authenticated using ((select auth.uid()) = user_id and status = 'needs_info')
  with check ((select auth.uid()) = user_id and status = 'pending');
revoke all on public.coach_applications from anon, authenticated;
grant select on public.coach_applications to authenticated;
grant insert (full_name, med_school, training_level, schools_coached, services, admissions_story, bio, conflict_role, conflict_details, proof_path, agreed_terms) on public.coach_applications to authenticated;
grant update (status, full_name, med_school, training_level, schools_coached, services, admissions_story, bio, conflict_role, conflict_details, proof_path) on public.coach_applications to authenticated;

-- 4. Approved coaches. Public profile shows only once you mark it visible (after onboarding).
create table public.coaches (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 2 and 80),
  headline      text check (headline is null or char_length(headline) <= 120),
  bio           text check (bio is null or char_length(bio) <= 1500),
  schools       text[] not null default '{}',
  services      text[] not null default '{}',
  photo_url     text check (photo_url is null or char_length(photo_url) <= 500),
  visible       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.coaches enable row level security;
create policy "public sees visible coaches" on public.coaches
  for select to anon, authenticated using (visible or (select auth.uid()) = user_id or (select public.is_admin()));
create policy "coach edits own profile" on public.coaches
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.coaches from anon, authenticated;
grant select on public.coaches to anon, authenticated;
grant update (display_name, headline, bio, schools, services, photo_url) on public.coaches to authenticated;  -- only you flip "visible"

-- 5. Your decision: approve, reject or ask for more info. Admin only.
create or replace function public.review_coach_application(app_id bigint, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.coach_applications;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if decision not in ('approved', 'rejected', 'needs_info') then raise exception 'bad decision'; end if;
  select * into a from public.coach_applications where id = app_id for update;
  if not found then raise exception 'no such application'; end if;
  if a.status not in ('pending', 'needs_info') then raise exception 'already decided'; end if;
  update public.coach_applications
     set status = decision, reviewer_note = note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = app_id;
  if decision = 'approved' then
    update public.profiles set role = 'coach' where id = a.user_id and role = 'student';
    insert into public.coaches (user_id, display_name, bio, schools, services)
    values (a.user_id, a.full_name, a.bio, a.schools_coached, a.services)
    on conflict (user_id) do nothing;
  end if;
end; $$;
revoke execute on function public.review_coach_application(bigint, text, text) from public, anon;
grant execute on function public.review_coach_application(bigint, text, text) to authenticated;

-- Admin: show or hide a coach on the site.
create or replace function public.set_coach_visible(coach uuid, show boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.coaches set visible = show, updated_at = now() where user_id = coach;
end; $$;
revoke execute on function public.set_coach_visible(uuid, boolean) from public, anon;
grant execute on function public.set_coach_visible(uuid, boolean) to authenticated;

-- 6. Feedback, as on Infrared.
create table public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid default auth.uid() references auth.users(id) on delete set null,
  email      text,
  page       text check (char_length(page) <= 200),
  kind       text not null check (kind in ('error', 'data', 'idea', 'other')),
  message    text not null check (char_length(message) between 5 and 4000),
  status     text not null default 'new' check (status in ('new', 'reviewing', 'fixed', 'wont_fix')),
  reply      text,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create index feedback_user_idx on public.feedback (user_id);
create policy "send feedback" on public.feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "read own feedback" on public.feedback
  for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));
revoke all on public.feedback from anon, authenticated;
grant select on public.feedback to authenticated;
grant insert (email, page, kind, message) on public.feedback to authenticated;

-- 7. Self-service account deletion.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.feedback set email = null where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 8. Private storage for coach proof documents: applicants upload into their own folder; only admins read others'.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-docs', 'coach-docs', false, 5242880, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;
create policy "upload own coach docs" on storage.objects
  for insert to authenticated with check (bucket_id = 'coach-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "read own coach docs or admin" on storage.objects
  for select to authenticated using (bucket_id = 'coach-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
