-- Applied 2026-11-20 as migration "tighten_function_access".
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create index coach_applications_reviewed_by_idx on public.coach_applications (reviewed_by);
