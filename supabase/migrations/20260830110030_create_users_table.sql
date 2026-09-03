create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- Always enable Row Level Security (RLS)
alter table public.users enable row level security;