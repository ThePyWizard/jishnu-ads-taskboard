-- Ad Ledger schema: change history + daily tasks for Lascade's app campaigns.

-- People allowed into the app. Add your cofounder's Google email here.
create table public.members (
  email text primary key,
  added_at timestamptz not null default now()
);

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- Apps shown in the app picker and filters.
create table public.apps (
  name text primary key,
  sort int not null default 0
);

insert into public.apps (name, sort) values
  ('TravelAnimator', 1),
  ('MarineRadar',    2),
  ('AR Measure',     3),
  ('GeoAnimator',    4),
  ('Pingee',         5);

create table public.changes (
  id uuid primary key default gen_random_uuid(),
  happened_at timestamptz not null default now(),
  app text not null default 'Unassigned',
  platform text not null check (platform in ('meta', 'google', 'apple', 'tiktok', 'other')),
  kind text not null,
  entity text,
  before_value text,
  after_value text,
  why text,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  author_email text default (auth.jwt() ->> 'email'),
  seen_by text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index changes_happened_at_idx on public.changes (happened_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  app text,
  day date not null,
  done boolean not null default false,
  done_on date,
  author_email text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
create index tasks_day_idx on public.tasks (day desc);

-- Toggle the current member in a change's "seen by" list without a read-modify-write race.
create or replace function public.toggle_seen(change_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.changes
  set seen_by = case
    when (auth.jwt() ->> 'email') = any (seen_by) then array_remove(seen_by, auth.jwt() ->> 'email')
    else array_append(seen_by, auth.jwt() ->> 'email')
  end
  where id = change_id;
$$;

-- Row level security: only members can read or write anything.
alter table public.members   enable row level security;
alter table public.apps      enable row level security;
alter table public.changes   enable row level security;
alter table public.tasks     enable row level security;

create policy "members read members" on public.members for select to authenticated using (public.is_member());
create policy "members use apps"     on public.apps    for all    to authenticated using (public.is_member()) with check (public.is_member());
create policy "members use changes"  on public.changes for all    to authenticated using (public.is_member()) with check (public.is_member());
create policy "members use tasks"    on public.tasks   for all    to authenticated using (public.is_member()) with check (public.is_member());
