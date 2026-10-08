-- One owner who adds and edits everything; viewers can only read.

alter table public.members
  add column role text not null default 'viewer' check (role in ('owner', 'viewer'));

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where lower(email) = lower(auth.jwt() ->> 'email') and role = 'owner'
  );
$$;

-- Members read everything; only the owner inserts, updates or deletes.
drop policy "members use changes" on public.changes;
drop policy "members use tasks" on public.tasks;
drop policy "members use apps" on public.apps;

create policy "members read changes" on public.changes for select to authenticated using (public.is_member());
create policy "owner adds changes"    on public.changes for insert to authenticated with check (public.is_owner());
create policy "owner edits changes"   on public.changes for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes changes" on public.changes for delete to authenticated using (public.is_owner());

create policy "members read tasks" on public.tasks for select to authenticated using (public.is_member());
create policy "owner adds tasks"    on public.tasks for insert to authenticated with check (public.is_owner());
create policy "owner edits tasks"   on public.tasks for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes tasks" on public.tasks for delete to authenticated using (public.is_owner());

create policy "members read apps" on public.apps for select to authenticated using (public.is_member());
create policy "owner adds apps"    on public.apps for insert to authenticated with check (public.is_owner());
create policy "owner edits apps"   on public.apps for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes apps" on public.apps for delete to authenticated using (public.is_owner());

-- Viewers no longer write anything, so the "seen by" feature goes.
drop function public.toggle_seen(uuid);
alter table public.changes drop column seen_by;
