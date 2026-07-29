-- The Freelancer Suite Schema Additions

-- 1. Profiles updates
alter table if exists profiles
  add column if not exists default_currency text not null default 'USD',
  add column if not exists default_hourly_rate numeric default 50;

-- 2. Clients updates
alter table if exists clients
  add column if not exists hourly_rate numeric,
  add column if not exists currency text;

-- 3. Invoices updates
alter table if exists invoices
  add column if not exists currency text not null default 'USD';

-- 4. Invoice Items updates
alter table if exists invoice_items
  add column if not exists source_time_entry_ids uuid[];

-- 5. Time Entries table
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  billed boolean not null default false,
  created_at timestamptz default now()
);

alter table time_entries enable row level security;

drop policy if exists "Users can manage their own time entries" on time_entries;
create policy "Users can manage their own time entries"
  on time_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Rate Calculations table
create table if not exists rate_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  desired_yearly_income numeric not null,
  working_days_per_year integer not null,
  billable_hours_per_day numeric not null,
  business_expenses numeric default 0,
  tax_rate_percent numeric default 0,
  result_hourly_rate numeric not null,
  created_at timestamptz default now()
);

alter table rate_calculations enable row level security;

drop policy if exists "Users can manage their own rate calculations" on rate_calculations;
create policy "Users can manage their own rate calculations"
  on rate_calculations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. Business Expenses table
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric not null,
  category text not null default 'General',
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

alter table expenses enable row level security;

drop policy if exists "Users can manage their own expenses" on expenses;
create policy "Users can manage their own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
