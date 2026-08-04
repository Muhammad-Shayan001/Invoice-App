-- Create invoice counter table for atomic invoice number generation
create table if not exists public.invoice_counters (
  id bigint primary key default 1,
  next_value integer not null default 1,
  constraint single_row check (id = 1)
);

-- Ensure only one row exists (id=1)
insert into public.invoice_counters (id, next_value)
select 1, 1
where not exists (select 1 from public.invoice_counters where id = 1);

-- Enable RLS (consistent with your existing pattern)
alter table public.invoice_counters enable row level security;

-- Policies for the counter table
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'invoice_counters' and policyname = 'Users can read invoice counter'
  ) then
    create policy "Users can read invoice counter" on public.invoice_counters for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'invoice_counters' and policyname = 'Users can update invoice counter'
  ) then
    create policy "Users can update invoice counter" on public.invoice_counters for update using (true) with check (true);
  end if;
end $$;