-- StudyMaximizer: one private JSON state document per authenticated user.
-- Run this script in Supabase Dashboard > SQL Editor.

create table if not exists public.studymaximizer_user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.studymaximizer_user_data enable row level security;

revoke all on table public.studymaximizer_user_data from anon, authenticated;
grant select, insert, update, delete on table public.studymaximizer_user_data to authenticated;

drop policy if exists "Users can read their own StudyMaximizer data" on public.studymaximizer_user_data;
create policy "Users can read their own StudyMaximizer data"
  on public.studymaximizer_user_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own StudyMaximizer data" on public.studymaximizer_user_data;
create policy "Users can create their own StudyMaximizer data"
  on public.studymaximizer_user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own StudyMaximizer data" on public.studymaximizer_user_data;
create policy "Users can update their own StudyMaximizer data"
  on public.studymaximizer_user_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own StudyMaximizer data" on public.studymaximizer_user_data;
create policy "Users can delete their own StudyMaximizer data"
  on public.studymaximizer_user_data for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Enable database change notifications for near-real-time sync between devices.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'studymaximizer_user_data'
     ) then
    alter publication supabase_realtime add table public.studymaximizer_user_data;
  end if;
end $$;
