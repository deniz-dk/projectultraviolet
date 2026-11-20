-- The Sunday newsletter: topic choices, one-click unsubscribe tokens, a send log, and the Sunday 8 a.m. schedule.
-- Apply as the migration "sunday_newsletter". The issue itself is newsletter/<Sunday>.json in the site repo,
-- written by the Saturday-night sweep; the edge function "uv-newsletter" sends it.
alter table public.user_prefs add column if not exists nl_topics text[] not null default '{}';
alter table public.user_prefs add column if not exists email_token uuid not null default gen_random_uuid();
create unique index if not exists user_prefs_email_token on public.user_prefs (email_token);

-- One row per Sunday issue that was sent
create table if not exists public.nl_sends (
  week date primary key,
  subject text,
  sent_at timestamptz not null default now(),
  recipients int not null default 0,
  failed int not null default 0,
  note text
);
alter table public.nl_sends enable row level security;
drop policy if exists "admins read sends" on public.nl_sends;
create policy "admins read sends" on public.nl_sends for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.nl_sends from anon, authenticated;

-- Internal secrets shared by the database schedule and the edge function. No access for site visitors.
create table if not exists public.app_secrets (name text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
insert into public.app_secrets (name, value) values ('cron_key', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

-- Subscriber count and last send, for the admin dashboard
create or replace function public.admin_newsletter()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return jsonb_build_object(
    'subscribers', (select count(*) from public.user_prefs p join auth.users u on u.id = p.user_id where p.newsletter and u.email_confirmed_at is not null),
    'last', (select to_jsonb(s) from public.nl_sends s order by week desc limit 1)
  );
end $$;
revoke all on function public.admin_newsletter() from public, anon;
grant execute on function public.admin_newsletter() to authenticated;

-- Sunday 8 a.m. Toronto time (13:00 UTC in winter; 12:00 UTC during daylight time is 8 a.m. too, so run both and let
-- the function skip a week it already sent)
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobname) from cron.job where jobname in ('uv-sunday-12', 'uv-sunday-13');
select cron.schedule('uv-sunday-13', '0 13 * * 0', $$
  select net.http_post(url := 'https://igdvjbgaawncwqwotvpr.supabase.co/functions/v1/uv-newsletter',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select value from public.app_secrets where name = 'cron_key')),
    body := '{}'::jsonb);
$$);
select cron.schedule('uv-sunday-12', '0 12 * * 0', $$
  select case when to_char(now() at time zone 'America/Toronto', 'HH24') = '08' then
  net.http_post(url := 'https://igdvjbgaawncwqwotvpr.supabase.co/functions/v1/uv-newsletter',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select value from public.app_secrets where name = 'cron_key')),
    body := '{}'::jsonb) end;
$$);
