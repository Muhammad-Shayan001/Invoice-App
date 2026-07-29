-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  logo_url text,
  default_notes text,
  created_at timestamptz default now()
);

-- Clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz default now()
);

create index if not exists clients_user_id_idx on public.clients(user_id);

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null check (status in ('paid', 'unpaid', 'overdue')) default 'unpaid',
  notes text,
  created_at timestamptz default now()
);

create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_client_id_idx on public.invoices(client_id);

-- Invoice items table
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Policies for Profiles (create or replace)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Policies for Clients
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'clients' and policyname = 'Users can view own clients'
  ) then
    create policy "Users can view own clients" on public.clients for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'clients' and policyname = 'Users can insert own clients'
  ) then
    create policy "Users can insert own clients" on public.clients for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'clients' and policyname = 'Users can update own clients'
  ) then
    create policy "Users can update own clients" on public.clients for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'clients' and policyname = 'Users can delete own clients'
  ) then
    create policy "Users can delete own clients" on public.clients for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Policies for Invoices
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'invoices' and policyname = 'Users can view own invoices'
  ) then
    create policy "Users can view own invoices" on public.invoices for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoices' and policyname = 'Users can insert own invoices'
  ) then
    create policy "Users can insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoices' and policyname = 'Users can update own invoices'
  ) then
    create policy "Users can update own invoices" on public.invoices for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoices' and policyname = 'Users can delete own invoices'
  ) then
    create policy "Users can delete own invoices" on public.invoices for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Policies for Invoice Items
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'invoice_items' and policyname = 'Users can view own invoice items'
  ) then
    create policy "Users can view own invoice items" on public.invoice_items for select using (
      exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
    );
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoice_items' and policyname = 'Users can insert own invoice items'
  ) then
    create policy "Users can insert own invoice items" on public.invoice_items for insert with check (
      exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
    );
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoice_items' and policyname = 'Users can update own invoice items'
  ) then
    create policy "Users can update own invoice items" on public.invoice_items for update using (
      exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
    );
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoice_items' and policyname = 'Users can delete own invoice items'
  ) then
    create policy "Users can delete own invoice items" on public.invoice_items for delete using (
      exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
    );
  end if;
end $$;

-- View for invoice totals
create or replace view public.invoice_totals as
select 
  i.id as invoice_id,
  coalesce(sum(ii.quantity * ii.unit_price), 0) as total_amount
from public.invoices i
left join public.invoice_items ii on i.id = ii.invoice_id
group by i.id;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
