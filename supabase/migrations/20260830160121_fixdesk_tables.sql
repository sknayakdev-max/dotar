-- =========================================================
-- FIXDESK - DATABASE TABLES
-- Built on top of the existing profiles/users schema
-- =========================================================

-- =========================================================
-- 1. CUSTOMERS
-- =========================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references auth.users(id)
    on delete set null,

  name text not null,

  phone text not null,

  email text,

  address text,

  city text,

  notes text,

  deleted_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists customers_phone_idx
  on public.customers(phone);

create index if not exists customers_email_idx
  on public.customers(email);

create index if not exists customers_user_id_idx
  on public.customers(user_id);


-- =========================================================
-- 2. DEVICES
-- =========================================================

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  name text not null,

  device_type text,

  brand text,

  model text,

  serial_number text,

  imei text,

  condition text,

  notes text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists devices_customer_id_idx
  on public.devices(customer_id);

create index if not exists devices_serial_number_idx
  on public.devices(serial_number);


-- =========================================================
-- 3. SERVICE REQUESTS
-- =========================================================

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),

  request_number text unique,

  user_id uuid
    references auth.users(id)
    on delete set null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  customer_name text not null,

  phone text not null,

  email text,

  device_type text,

  brand text,

  model text,

  serial_number text,

  problem_description text not null,

  additional_notes text,

  preferred_contact text default 'PHONE',

  status text not null default 'PENDING',

  review_notes text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists service_requests_status_idx
  on public.service_requests(status);

create index if not exists service_requests_user_id_idx
  on public.service_requests(user_id);

create index if not exists service_requests_created_at_idx
  on public.service_requests(created_at);


-- =========================================================
-- 4. INVENTORY ITEMS
-- =========================================================

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  category text,

  brand text,

  sku text unique,

  quantity integer not null default 0,

  minimum_stock integer not null default 0,

  purchase_price numeric(12,2) not null default 0,

  selling_price numeric(12,2) not null default 0,

  supplier text,

  location text,

  deleted_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_sku_idx
  on public.inventory_items(sku);


-- =========================================================
-- 5. REPAIRS
-- =========================================================

create table if not exists public.repairs (
  id uuid primary key default gen_random_uuid(),

  repair_number text unique,

  service_request_id uuid
    references public.service_requests(id)
    on delete set null,

  customer_id uuid not null
    references public.customers(id)
    on delete restrict,

  device_id uuid
    references public.devices(id)
    on delete set null,

  assigned_to_id uuid
    references auth.users(id)
    on delete set null,

  problem_description text not null,

  initial_condition text,

  accessories_received text,

  diagnosis text,

  internal_notes text,

  customer_notes text,

  estimated_cost numeric(12,2) default 0,

  final_cost numeric(12,2) default 0,

  advance_payment numeric(12,2) default 0,

  priority text not null default 'NORMAL',

  status text not null default 'RECEIVED',

  expected_completion_date date,

  completed_at timestamptz,

  delivered_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists repairs_status_idx
  on public.repairs(status);

create index if not exists repairs_customer_id_idx
  on public.repairs(customer_id);

create index if not exists repairs_device_id_idx
  on public.repairs(device_id);

create index if not exists repairs_assigned_to_id_idx
  on public.repairs(assigned_to_id);

create index if not exists repairs_created_at_idx
  on public.repairs(created_at);


-- =========================================================
-- 6. REPAIR HISTORY
-- =========================================================

create table if not exists public.repair_history (
  id uuid primary key default gen_random_uuid(),

  repair_id uuid not null
    references public.repairs(id)
    on delete cascade,

  event text not null,

  description text,

  status text,

  is_customer_visible boolean not null default true,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists repair_history_repair_id_idx
  on public.repair_history(repair_id);


-- =========================================================
-- 7. REPAIR PARTS
-- =========================================================

create table if not exists public.repair_parts (
  id uuid primary key default gen_random_uuid(),

  repair_id uuid not null
    references public.repairs(id)
    on delete cascade,

  inventory_item_id uuid
    references public.inventory_items(id)
    on delete set null,

  part_name text not null,

  quantity integer not null default 1,

  unit_price numeric(12,2) not null default 0,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists repair_parts_repair_id_idx
  on public.repair_parts(repair_id);


-- =========================================================
-- 8. PAYMENTS
-- =========================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  repair_id uuid
    references public.repairs(id)
    on delete set null,

  customer_id uuid not null
    references public.customers(id)
    on delete restrict,

  amount numeric(12,2) not null,

  method text not null default 'CASH',

  status text not null default 'COMPLETED',

  transaction_reference text,

  notes text,

  recorded_by uuid
    references auth.users(id)
    on delete set null,

  paid_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create index if not exists payments_repair_id_idx
  on public.payments(repair_id);

create index if not exists payments_customer_id_idx
  on public.payments(customer_id);

create index if not exists payments_created_at_idx
  on public.payments(created_at);


-- =========================================================
-- 9. INVOICES
-- =========================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),

  invoice_number text unique,

  repair_id uuid
    references public.repairs(id)
    on delete set null,

  customer_id uuid not null
    references public.customers(id)
    on delete restrict,

  labor_cost numeric(12,2) not null default 0,

  parts_cost numeric(12,2) not null default 0,

  discount numeric(12,2) not null default 0,

  tax numeric(12,2) not null default 0,

  total_amount numeric(12,2) not null default 0,

  notes text,

  issued_at timestamptz not null default now(),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists invoices_customer_id_idx
  on public.invoices(customer_id);

create index if not exists invoices_repair_id_idx
  on public.invoices(repair_id);


-- =========================================================
-- 10. NOTIFICATIONS
-- =========================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references auth.users(id)
    on delete cascade,

  title text not null,

  body text,

  link text,

  is_read boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id);

create index if not exists notifications_created_at_idx
  on public.notifications(created_at);


-- =========================================================
-- 11. ACTIVITY LOGS
-- =========================================================

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references auth.users(id)
    on delete set null,

  action text not null,

  entity text,

  entity_id text,

  description text,

  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx
  on public.activity_logs(user_id);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs(created_at);


-- =========================================================
-- 12. UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================================
-- 13. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists customers_updated_at
on public.customers;

create trigger customers_updated_at
before update on public.customers
for each row
execute function public.update_updated_at();


drop trigger if exists devices_updated_at
on public.devices;

create trigger devices_updated_at
before update on public.devices
for each row
execute function public.update_updated_at();


drop trigger if exists service_requests_updated_at
on public.service_requests;

create trigger service_requests_updated_at
before update on public.service_requests
for each row
execute function public.update_updated_at();


drop trigger if exists inventory_items_updated_at
on public.inventory_items;

create trigger inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.update_updated_at();


drop trigger if exists repairs_updated_at
on public.repairs;

create trigger repairs_updated_at
before update on public.repairs
for each row
execute function public.update_updated_at();


drop trigger if exists invoices_updated_at
on public.invoices;

create trigger invoices_updated_at
before update on public.invoices
for each row
execute function public.update_updated_at();


-- =========================================================
-- 14. ENABLE RLS
-- =========================================================

alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.service_requests enable row level security;
alter table public.inventory_items enable row level security;
alter table public.repairs enable row level security;
alter table public.repair_history enable row level security;
alter table public.repair_parts enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;


-- =========================================================
-- 15. STAFF HELPER FUNCTION
-- =========================================================

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(role) in (
        'staff',
        'employee',
        'manager',
        'admin',
        'super_admin'
      )
  );
$$;


-- =========================================================
-- 16. CUSTOMER POLICIES
-- =========================================================

drop policy if exists "Staff can view customers"
on public.customers;

create policy "Staff can view customers"
on public.customers
for select
to authenticated
using (
  public.is_staff()
  or user_id = auth.uid()
);


drop policy if exists "Staff can create customers"
on public.customers;

create policy "Staff can create customers"
on public.customers
for insert
to authenticated
with check (
  public.is_staff()
  or user_id = auth.uid()
);


drop policy if exists "Staff can update customers"
on public.customers;

create policy "Staff can update customers"
on public.customers
for update
to authenticated
using (
  public.is_staff()
  or user_id = auth.uid()
)
with check (
  public.is_staff()
  or user_id = auth.uid()
);


-- =========================================================
-- 17. DEVICE POLICIES
-- =========================================================

create policy "Staff can view devices"
on public.devices
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create devices"
on public.devices
for insert
to authenticated
with check (
  public.is_staff()
);


create policy "Staff can update devices"
on public.devices
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- =========================================================
-- 18. SERVICE REQUEST POLICIES
-- =========================================================

create policy "Users can view own requests"
on public.service_requests
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_staff()
);


create policy "Users can create requests"
on public.service_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  or user_id is null
);


create policy "Staff can update requests"
on public.service_requests
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- =========================================================
-- 19. REPAIR POLICIES
-- =========================================================

create policy "Staff can view repairs"
on public.repairs
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create repairs"
on public.repairs
for insert
to authenticated
with check (
  public.is_staff()
);


create policy "Staff can update repairs"
on public.repairs
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- =========================================================
-- 20. REPAIR HISTORY
-- =========================================================

create policy "Staff can view repair history"
on public.repair_history
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create repair history"
on public.repair_history
for insert
to authenticated
with check (
  public.is_staff()
);


-- =========================================================
-- 21. REPAIR PARTS
-- =========================================================

create policy "Staff can view repair parts"
on public.repair_parts
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create repair parts"
on public.repair_parts
for insert
to authenticated
with check (
  public.is_staff()
);


-- =========================================================
-- 22. INVENTORY
-- =========================================================

create policy "Staff can view inventory"
on public.inventory_items
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create inventory"
on public.inventory_items
for insert
to authenticated
with check (
  public.is_staff()
);


create policy "Staff can update inventory"
on public.inventory_items
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- =========================================================
-- 23. PAYMENTS
-- =========================================================

create policy "Staff can view payments"
on public.payments
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create payments"
on public.payments
for insert
to authenticated
with check (
  public.is_staff()
);


-- =========================================================
-- 24. INVOICES
-- =========================================================

create policy "Staff can view invoices"
on public.invoices
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create invoices"
on public.invoices
for insert
to authenticated
with check (
  public.is_staff()
);


create policy "Staff can update invoices"
on public.invoices
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- =========================================================
-- 25. NOTIFICATIONS
-- =========================================================

create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
);


create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);


-- =========================================================
-- 26. ACTIVITY LOGS
-- =========================================================

create policy "Staff can view activity logs"
on public.activity_logs
for select
to authenticated
using (
  public.is_staff()
);


create policy "Staff can create activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  public.is_staff()
);


-- =========================================================
-- 27. RELOAD POSTGREST
-- =========================================================

notify pgrst, 'reload schema';