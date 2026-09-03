-- Insert the existing auth user into the profiles table
insert into public.profiles (id, email, full_name, role)
values (
  '7c4a8652-593e-476f-b868-27bc8a0d916c',
  'admin@dotarsojatcomputer.in',
  'Super Admin',
  'super_admin'
)
on conflict (id) do update 
set role = 'super_admin';

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy to allow logged-in users to read their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);