-- -- Create users table for authentication, linked to Supabase Auth
-- create table if not exists public.users (
--   id uuid primary key references auth.users(id) on delete cascade,
--   email text unique not null,
--   name text,
--   created_at timestamptz default timezone('utc', now())
-- );

-- -- Enable Row Level Security
-- alter table public.users enable row level security;

-- -- Create insert policy only if missing
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_policies
--     where schemaname = 'public'
--       and tablename = 'users'
--       and policyname = 'Allow self insert'
--   ) then
--     execute $sql$
--       create policy "Allow self insert" on public.users
--       for insert with check (auth.uid() = id);
--     $sql$;
--   end if;
-- end;
-- $$;

-- -- Create select policy only if missing
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_policies
--     where schemaname = 'public'
--       and tablename = 'users'
--       and policyname = 'Allow self select'
--   ) then
--     execute $sql$
--       create policy "Allow self select" on public.users
--       for select using (auth.uid() = id);
--     $sql$;
--   end if;
-- end;
-- $$;

-- Create users table linked to Supabase Auth
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  created_at timestamptz default timezone('utc', now())
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Policy: Allow users to insert their own row
create policy "Allow self insert" on public.users
  for insert
  with check (auth.uid() = id);

-- Policy: Allow users to select their own row
create policy "Allow self select" on public.users
  for select
  using (auth.uid() = id);

-- Policy: Allow users to update their own row
create policy "Allow self update" on public.users
  for update
  using (auth.uid() = id);

-- Policy: Allow users to delete their own row
create policy "Allow self delete" on public.users
  for delete
  using (auth.uid() = id);

-- Grant access to authenticated users
grant select, insert, update, delete on public.users to authenticated;