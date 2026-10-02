create or replace function public.transfer_telegram_identity(
  p_target_code text,
  p_telegram_user_id bigint,
  p_telegram_chat_id bigint default null
)
returns table (
  previous_employee_code text,
  previous_employee_name text,
  target_employee_code text,
  target_employee_name text,
  telegram_user_id bigint,
  telegram_chat_id bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target public.employees%rowtype;
  v_previous public.employees%rowtype;
  v_target_old_user_id bigint;
  v_chat_id bigint;
begin
  if p_telegram_user_id is null or p_telegram_user_id <= 0 then
    raise exception using errcode = '22023', message = 'Telegram user ID must be positive.';
  end if;
  if p_telegram_chat_id is not null and p_telegram_chat_id <= 0 then
    raise exception using errcode = '22023', message = 'Telegram chat ID must be positive.';
  end if;

  -- Serialize transfers for the same Telegram identity before touching the
  -- unique employee mapping.
  perform pg_advisory_xact_lock(hashtextextended('telegram-user:' || p_telegram_user_id::text, 0));

  select * into v_target
  from public.employees
  where code = p_target_code
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'Unknown fictional employee.';
  end if;

  v_target_old_user_id := v_target.telegram_user_id;
  select * into v_previous
  from public.employees
  where employees.telegram_user_id = p_telegram_user_id
  for update;

  v_chat_id := coalesce(p_telegram_chat_id, p_telegram_user_id);

  if v_previous.id is not null and v_previous.id <> v_target.id then
    update public.employees
    set telegram_user_id = null,
        telegram_chat_id = null,
        updated_at = now()
    where id = v_previous.id;
  end if;

  update public.employees
  set telegram_user_id = p_telegram_user_id,
      telegram_chat_id = v_chat_id,
      updated_at = now()
  where id = v_target.id;

  -- A conversation belongs to the active fictional role, not permanently to
  -- the Telegram account. Clear both the incoming identity and any identity
  -- previously attached to the target employee.
  delete from public.telegram_conversations
  where telegram_conversations.telegram_user_id = p_telegram_user_id
     or (v_target_old_user_id is not null and telegram_conversations.telegram_user_id = v_target_old_user_id);

  return query select
    case when v_previous.id is null then null else v_previous.code end,
    case when v_previous.id is null then null else v_previous.display_name end,
    v_target.code,
    v_target.display_name,
    p_telegram_user_id,
    v_chat_id;
end;
$$;

revoke all on function public.transfer_telegram_identity(text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.transfer_telegram_identity(text, bigint, bigint) to service_role;
