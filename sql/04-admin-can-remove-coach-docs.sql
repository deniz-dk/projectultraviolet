-- Applied 2026-11-20 as migration "admin_can_remove_coach_docs".
create policy "admin removes coach docs" on storage.objects
  for delete to authenticated using (bucket_id = 'coach-docs' and (select public.is_admin()));
