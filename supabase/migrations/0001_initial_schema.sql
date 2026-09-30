create extension if not exists pgcrypto;

create type employee_role as enum ('manager', 'salesperson', 'expense_reporter');
create type project_code as enum ('A', 'B');
create type expense_category as enum ('Materials', 'Travel', 'Other');
create type expense_allocation as enum ('A', 'B', 'OVERHEAD');
create type sale_status as enum ('PENDING_APPROVAL', 'APPROVED');
create type expense_status as enum ('AWAITING_ALLOCATION', 'ALLOCATED');
create type delivery_status as enum ('NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED');
create type sync_status as enum ('PENDING', 'SYNCED', 'FAILED');
create type submission_channel as enum ('WEB', 'TELEGRAM');

create table employees (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  role employee_role not null,
  telegram_user_id bigint unique,
  telegram_chat_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^S[0-9]+$'),
  submitted_at timestamptz not null default now(),
  submission_channel submission_channel not null,
  submitting_employee_id uuid not null references employees(id),
  original_telegram_chat_id bigint,
  customer text not null check (length(trim(customer)) > 0),
  project project_code not null,
  description text not null check (length(trim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  proposed_richard_pct numeric(7,4) not null check (proposed_richard_pct between 0 and 100),
  proposed_anastasia_pct numeric(7,4) not null check (proposed_anastasia_pct between 0 and 100),
  proposed_jean_claude_pct numeric(7,4) not null check (proposed_jean_claude_pct between 0 and 100),
  approved_richard_pct numeric(7,4) check (approved_richard_pct between 0 and 100),
  approved_anastasia_pct numeric(7,4) check (approved_anastasia_pct between 0 and 100),
  approved_jean_claude_pct numeric(7,4) check (approved_jean_claude_pct between 0 and 100),
  commission_pool_cents bigint not null default 0 check (commission_pool_cents >= 0),
  richard_commission_cents bigint not null default 0 check (richard_commission_cents >= 0),
  anastasia_commission_cents bigint not null default 0 check (anastasia_commission_cents >= 0),
  jean_claude_commission_cents bigint not null default 0 check (jean_claude_commission_cents >= 0),
  status sale_status not null default 'PENDING_APPROVAL',
  approved_at timestamptz,
  approved_by uuid references employees(id),
  sheets_sync_status sync_status not null default 'PENDING',
  sheets_sync_error text,
  notification_status delivery_status not null default 'NOT_REQUIRED',
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposed_split_totals_100 check (
    proposed_richard_pct + proposed_anastasia_pct + proposed_jean_claude_pct = 100
  ),
  constraint approved_sale_is_complete check (
    (status = 'PENDING_APPROVAL' and approved_at is null and approved_by is null
      and approved_richard_pct is null and approved_anastasia_pct is null and approved_jean_claude_pct is null)
    or
    (status = 'APPROVED' and approved_at is not null and approved_by is not null
      and approved_richard_pct + approved_anastasia_pct + approved_jean_claude_pct = 100)
  )
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^E[0-9]+$'),
  submitted_at timestamptz not null default now(),
  submission_channel submission_channel not null,
  submitting_employee_id uuid not null references employees(id),
  original_telegram_chat_id bigint,
  description text not null check (length(trim(description)) > 0),
  category expense_category not null,
  amount_cents bigint not null check (amount_cents > 0),
  proposed_allocation expense_allocation not null,
  final_allocation expense_allocation,
  status expense_status not null,
  allocated_at timestamptz,
  allocated_by uuid references employees(id),
  sheets_sync_status sync_status not null default 'PENDING',
  sheets_sync_error text,
  notification_status delivery_status not null default 'NOT_REQUIRED',
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint overhead_is_automatic check (
    (proposed_allocation = 'OVERHEAD' and final_allocation = 'OVERHEAD' and status = 'ALLOCATED')
    or proposed_allocation <> 'OVERHEAD'
  ),
  constraint allocated_expense_is_complete check (
    (status = 'AWAITING_ALLOCATION' and final_allocation is null and allocated_at is null and allocated_by is null)
    or
    (status = 'ALLOCATED' and final_allocation is not null)
  )
);

create table integration_attempts (
  id uuid primary key default gen_random_uuid(),
  transaction_kind text not null check (transaction_kind in ('SALE', 'EXPENSE')),
  transaction_id uuid not null,
  operation text not null check (operation in ('SHEETS_SYNC', 'TELEGRAM_NOTIFICATION')),
  attempt_number integer not null check (attempt_number > 0),
  succeeded boolean not null,
  error_message text,
  attempted_at timestamptz not null default now(),
  unique (transaction_kind, transaction_id, operation, attempt_number)
);

insert into employees (code, display_name, role) values
  ('svetlana', 'Svetlana de Monte Carlo', 'manager'),
  ('richard', 'Richard Darling', 'salesperson'),
  ('anastasia', 'Anastasia Ferrari', 'salesperson'),
  ('jean_claude', 'Jean-Claude Berzins', 'salesperson'),
  ('kevin', 'Kevin von Whatever', 'expense_reporter')
on conflict (code) do nothing;

alter table employees enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;
alter table integration_attempts enable row level security;

-- The project is configured not to auto-expose new tables. Grant only the
-- backend service role the table and sequence privileges it needs. RLS stays
-- enabled and no browser-accessible policies are added.
grant usage on schema public to service_role;
grant select, insert, update, delete on table employees, sales, expenses, integration_attempts to service_role;
grant usage, select on all sequences in schema public to service_role;

-- No public policies are intentionally defined. Application writes use the
-- server-only service role after the route has verified the demonstration
-- role and permissions. Never expose the service-role key to the browser.
