-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- Clients table
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz default now()
);

create index clients_user_id_idx on public.clients(user_id);

-- Invoices table
create table public.invoices (
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

create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_client_id_idx on public.invoices(client_id);

-- Invoice items table
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null
);

create index invoice_items_invoice_id_idx on public.invoice_items(invoice_id);

-- Enable RLS
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Policies for Clients
create policy "Users can view own clients" on public.clients for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients for delete using (auth.uid() = user_id);

-- Policies for Invoices
create policy "Users can view own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on public.invoices for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on public.invoices for delete using (auth.uid() = user_id);

-- Policies for Invoice Items
create policy "Users can view own invoice items" on public.invoice_items for select using (
  exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
);
create policy "Users can insert own invoice items" on public.invoice_items for insert with check (
  exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
);
create policy "Users can update own invoice items" on public.invoice_items for update using (
  exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
);
create policy "Users can delete own invoice items" on public.invoice_items for delete using (
  exists (select 1 from public.invoices where id = public.invoice_items.invoice_id and user_id = auth.uid())
);

-- View for invoice totals
create or replace view public.invoice_totals as
select 
  i.id as invoice_id,
  coalesce(sum(ii.quantity * ii.unit_price), 0) as total_amount
from public.invoices i
left join public.invoice_items ii on i.id = ii.invoice_id
group by i.id;

-- Function to auto-update overdue status
create or replace function update_overdue_invoices()
returns void
language plpgsql
as $$
begin
  update public.invoices
  set status = 'overdue'
  where status = 'unpaid' and due_date < current_date;
end;
$$;
