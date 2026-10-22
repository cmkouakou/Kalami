-- =============================================================
--  Fichier    : 20261111130000_refund_audit.sql
--  Projet     : Kalami
--  Description: Correctif de 20261111120000_security.sql (v0.13.0) : apply_order_refund et
--               stripe_process_refund appelaient write_audit, qui exige un administrateur.
--               Appelées par le webhook Stripe (rôle service, sans compte), elles échouaient
--               (« accès refusé »). Le journal est désormais écrit directement ; l'auteur de
--               l'entrée est l'administrateur connecté, ou aucun pour le webhook.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-22
--  Dépendances: 20261111120000_security.sql
-- =============================================================

-- ==================== FONCTIONS : REMBOURSEMENT ====================

create or replace function public.apply_order_refund(
  p_order public.orders,
  p_refund_id text,
  p_source text
)
returns table (credits_removed integer, credits_kept integer, packs_removed integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_removed integer;
  v_kept integer;
  v_packs integer;
begin
  update public.orders
  set status = 'refunded', refunded_at = now(), refund_id = p_refund_id
  where id = p_order.id;

  update public.entitlements set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;
  update public.pdf_purchases set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;

  delete from public.study_credits where order_id = p_order.id and consumed_at is null;
  get diagnostics v_removed = row_count;
  select count(*)::integer into v_kept from public.study_credits where order_id = p_order.id;

  delete from public.coach_allowances where order_id = p_order.id;
  get diagnostics v_packs = row_count;

  -- Insertion directe : write_audit exige un administrateur, absent pour le webhook
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'order.refund', 'order', p_order.id::text,
    jsonb_build_object('refund', p_refund_id, 'total_minor', p_order.total_minor,
      'currency', p_order.currency, 'credits_removed', v_removed,
      'credits_kept', v_kept, 'packs_removed', v_packs, 'source', p_source));

  return query select v_removed, v_kept, v_packs;
end;
$$;

revoke execute on function public.apply_order_refund(public.orders, text, text)
  from public, anon, authenticated;

create or replace function public.stripe_process_refund(
  p_event_id text,
  p_payment_id text,
  p_refund_id text,
  p_full boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_result text;
begin
  insert into public.stripe_events (id, type, order_id, result)
  values (p_event_id, 'charge.refunded', null, 'pending')
  on conflict (id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  select * into v_order from public.orders
  where provider_payment_id = p_payment_id and provider = 'stripe'
  for update;

  if v_order.id is null then
    v_result := 'unknown_order';
  elsif not p_full then
    v_result := 'partial_refund';
    insert into public.audit_logs (action, target_type, target_id, details)
    values ('order.partial_refund', 'order', v_order.id::text,
      jsonb_build_object('refund', p_refund_id, 'event', p_event_id));
  elsif v_order.status <> 'paid' then
    v_result := 'ignored';
  else
    perform public.apply_order_refund(v_order, p_refund_id, 'stripe');
    v_result := 'processed';
  end if;

  update public.stripe_events
  set order_id = v_order.id, result = v_result
  where id = p_event_id;
  return v_result;
end;
$$;

revoke execute on function public.stripe_process_refund(text, text, text, boolean)
  from public, anon, authenticated;
