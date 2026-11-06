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

-- User profile metadata for the extended registration form.
-- Safe to re-run: no StudyMaximizer study-progress records are removed.
create table if not exists public.studymaximizer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text,
  full_name text,
  date_of_birth date,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studymaximizer_profiles_username_format
    check (username is null or username ~ '^[a-z0-9._-]{3,24}$')
);

alter table public.studymaximizer_profiles
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists date_of_birth date,
  add column if not exists avatar_path text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists studymaximizer_profiles_username_unique
  on public.studymaximizer_profiles (lower(username))
  where username is not null;

alter table public.studymaximizer_profiles enable row level security;
revoke all on table public.studymaximizer_profiles from anon, authenticated;
grant select on table public.studymaximizer_profiles to authenticated;
grant update (username, full_name, date_of_birth, avatar_path, updated_at)
  on table public.studymaximizer_profiles to authenticated;

drop policy if exists "Users can read their own StudyMaximizer profile" on public.studymaximizer_profiles;
create policy "Users can read their own StudyMaximizer profile"
  on public.studymaximizer_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own StudyMaximizer profile" on public.studymaximizer_profiles;
create policy "Users can update their own StudyMaximizer profile"
  on public.studymaximizer_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Backfill existing accounts without assigning a username they have not chosen.
insert into public.studymaximizer_profiles (user_id, full_name, date_of_birth)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  case
    when coalesce(u.raw_user_meta_data ->> 'date_of_birth', '') ~ '^\d{4}-\d{2}-\d{2}$'
      then (u.raw_user_meta_data ->> 'date_of_birth')::date
    else null
  end
from auth.users as u
on conflict (user_id) do nothing;

create or replace function public.handle_new_studymaximizer_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.studymaximizer_profiles (user_id, username, full_name, date_of_birth)
  values (
    new.id,
    nullif(lower(trim(coalesce(new.raw_user_meta_data ->> 'username', ''))), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    case
      when coalesce(new.raw_user_meta_data ->> 'date_of_birth', '') ~ '^\d{4}-\d{2}-\d{2}$'
        then (new.raw_user_meta_data ->> 'date_of_birth')::date
      else null
    end
  )
  on conflict (user_id) do update set
    username = coalesce(excluded.username, public.studymaximizer_profiles.username),
    full_name = coalesce(excluded.full_name, public.studymaximizer_profiles.full_name),
    date_of_birth = coalesce(excluded.date_of_birth, public.studymaximizer_profiles.date_of_birth),
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_studymaximizer_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_studymaximizer on auth.users;
create trigger on_auth_user_created_studymaximizer
after insert on auth.users
for each row execute function public.handle_new_studymaximizer_user();

-- This function exposes only a yes/no answer, never profile details or e-mail addresses.
create or replace function public.is_studymaximizer_username_available(candidate_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(lower(candidate_username) ~ '^[a-z0-9._-]{3,24}$', false)
    and not exists (
      select 1
      from public.studymaximizer_profiles as p
      where lower(p.username) = lower(candidate_username)
    );
$$;
revoke all on function public.is_studymaximizer_username_available(text) from public;
grant execute on function public.is_studymaximizer_username_available(text) to anon, authenticated;

-- Profile photos are deliberately public assets; user data and study records remain private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studymaximizer-avatars', 'studymaximizer-avatars', true, 2097152, array['image/jpeg']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own StudyMaximizer avatar metadata" on storage.objects;
create policy "Users can read their own StudyMaximizer avatar metadata"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'studymaximizer-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload their own StudyMaximizer avatar" on storage.objects;
create policy "Users can upload their own StudyMaximizer avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'studymaximizer-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update their own StudyMaximizer avatar" on storage.objects;
create policy "Users can update their own StudyMaximizer avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'studymaximizer-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'studymaximizer-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own StudyMaximizer avatar" on storage.objects;
create policy "Users can delete their own StudyMaximizer avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'studymaximizer-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
