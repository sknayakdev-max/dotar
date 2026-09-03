-- 1. Create the profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'staff',
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create RLS Policies
create policy "Allow users to read their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Allow users to update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 4. Reload the PostgREST Schema Cache
notify pgrst, 'reload schema';