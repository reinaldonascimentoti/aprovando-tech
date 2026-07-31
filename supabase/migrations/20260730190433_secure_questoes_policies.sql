drop policy "questoes_select_released" on public.questoes;
drop policy "questoes_all_admin" on public.questoes;

create policy "questoes_select_authenticated"
  on public.questoes for select
  to authenticated
  using (
    is_released = true
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "questoes_insert_admin"
  on public.questoes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "questoes_update_admin"
  on public.questoes for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "questoes_delete_admin"
  on public.questoes for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

revoke execute on function public.handle_new_user() from public, anon, authenticated;
