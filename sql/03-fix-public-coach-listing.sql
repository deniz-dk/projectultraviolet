-- Applied 2026-11-20 as migration "fix_public_coach_listing".
-- Logged-out visitors can't run is_admin(), so they get their own simpler rule.
drop policy "public sees visible coaches" on public.coaches;
create policy "visitors see visible coaches" on public.coaches
  for select to anon using (visible);
create policy "members see visible, own, or all if admin" on public.coaches
  for select to authenticated using (visible or (select auth.uid()) = user_id or (select public.is_admin()));
