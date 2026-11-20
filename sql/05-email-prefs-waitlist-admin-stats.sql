-- Applied 2026-11-20 as migration "email_prefs_waitlist_admin_stats".
-- Coaching waitlist flag, newsletter opt-in saved from sign-up, and a counts-only summary for the admin panel.
alter table public.user_prefs add column if not exists coaching_waitlist boolean not null default false;
grant update (coaching_waitlist) on public.user_prefs to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), 80), ''));
  insert into public.user_prefs (user_id, newsletter)
  values (new.id, coalesce((new.raw_user_meta_data->>'email_ok')::boolean, false));
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return json_build_object(
    'accounts', (select count(*) from public.profiles),
    'new_this_week', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'coaches', (select count(*) from public.profiles where role = 'coach'),
    'coaches_live', (select count(*) from public.coaches where visible),
    'pending_apps', (select count(*) from public.coach_applications where status = 'pending'),
    'newsletter', (select count(*) from public.user_prefs where newsletter),
    'waitlist', (select count(*) from public.user_prefs where coaching_waitlist),
    'feedback_new', (select count(*) from public.feedback where status = 'new')
  );
end; $$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Admin can mark feedback as reviewed/fixed and reply.
create or replace function public.admin_update_feedback(fid bigint, new_status text, new_reply text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.feedback set status = new_status, reply = coalesce(new_reply, reply) where id = fid;
end; $$;
revoke execute on function public.admin_update_feedback(bigint, text, text) from public, anon;
grant execute on function public.admin_update_feedback(bigint, text, text) to authenticated;
