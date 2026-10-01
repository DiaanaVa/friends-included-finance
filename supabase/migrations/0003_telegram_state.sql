create table if not exists telegram_conversations (
  telegram_user_id bigint primary key,
  telegram_chat_id bigint not null,
  transaction_kind text not null check (transaction_kind in ('SALE', 'EXPENSE')),
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists telegram_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

alter table telegram_conversations enable row level security;
alter table telegram_updates enable row level security;

grant select, insert, update, delete on table telegram_conversations, telegram_updates to service_role;

-- Server-only tables. No browser-accessible RLS policies are intentionally created.
