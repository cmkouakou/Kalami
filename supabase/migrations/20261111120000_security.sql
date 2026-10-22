-- =============================================================
--  Fichier    : 20261111120000_security.sql
--  Projet     : Kalami
--  Description: Durcissement sécurité (Sprint 11s-1, v0.13.0) :
--               1. limitation de débit générique (connexion, inscription, codes promo,
--                  export des données), appelée par le serveur avec le rôle service ;
--               2. remboursement fait dans le tableau de bord Stripe, reçu par le webhook
--                  (charge.refunded) : mêmes effets que le bouton « Rembourser » de l'admin.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-22
--  Dépendances: 20261104120000_orders.sql (stripe_events), 20261105120000_strategy_orders.sql
--               (admin_refund_order), 20261007120000_catalog.sql (write_audit)
-- =============================================================

-- ==================== TABLE : LIMITATION DE DÉBIT ====================

-- Une ligne par tentative ; le sujet (« ip:… », « user:… », « email:<empreinte> ») est
-- calculé par le serveur, jamais fourni par le navigateur
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null check (bucket ~ '^[a-z_]{1,40}$'),
  subject text not null check (char_length(subject) <= 200),
  created_at timestamptz not null default now()
);

create index rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, subject, created_at desc);

-- Aucune politique : aucun accès client, même administrateur
alter table public.rate_limit_hits enable row level security;

-- ==================== FONCTIONS : LIMITATION DE DÉBIT ====================

-- Inscrit une tentative et indique si elle est permise (false au-delà de p_limit sur
-- p_window_seconds). Une entrée « security.rate_limited » au journal d'audit par fenêtre,
-- par compartiment et par sujet. Réservé au rôle service.
create or replace function public.hit_rate_limit(
  p_bucket text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_count integer;
begin
  -- Sérialise les tentatives d'un même sujet : le comptage reste exact sous concurrence
  perform pg_advisory_xact_lock(hashtext('rate:' || p_bucket || ':' || p_subject));

  -- Ménage : les tentatives sorties de la fenêtre ne servent plus
  delete from public.rate_limit_hits
  where bucket = p_bucket and subject = p_subject and created_at <= now() - v_window;

  select count(*) into v_count
  from public.rate_limit_hits
  where bucket = p_bucket and subject = p_subject;

  if v_count >= p_limit then
    if not exists (
      select 1 from public.audit_logs
      where action = 'security.rate_limited' and target_id = p_subject
        and details ->> 'bucket' = p_bucket and created_at > now() - v_window
    ) then
      insert into public.audit_logs (action, target_type, target_id, details)
      values ('security.rate_limited', 'subject', p_subject,
        jsonb_build_object('bucket', p_bucket, 'count', v_count));
    end if;
    return false;
  end if;

  insert into public.rate_limit_hits (bucket, subject) values (p_bucket, p_subject);
  return true;
end;
$$;

revoke execute on function public.hit_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;

-- Purge quotidienne des tentatives de plus d'un jour (sujets jamais revenus)
create or replace function public.purge_rate_limit_hits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_hits where created_at < now() - interval '1 day';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.purge_rate_limit_hits() from public, anon, authenticated;

-- ==================== FONCTIONS : REMBOURSEMENT ====================

-- Effets d'un remboursement intégral sur une commande payée (verrouillée par l'appelant) :
-- statut, retrait des droits, des crédits non consommés et des forfaits, journal d'audit.
-- Interne : appelée par admin_refund_order et stripe_process_refund.
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

  perform public.write_audit('order.refund', 'order', p_order.id::text,
    jsonb_build_object('refund', p_refund_id, 'total_minor', p_order.total_minor,
      'currency', p_order.currency, 'credits_removed', v_removed,
      'credits_kept', v_kept, 'packs_removed', v_packs, 'source', p_source));

  return query select v_removed, v_kept, v_packs;
end;
$$;

revoke execute on function public.apply_order_refund(public.orders, text, text)
  from public, anon, authenticated;

-- Remboursement depuis l'administration (bouton « Rembourser ») : comportement inchangé
create or replace function public.admin_refund_order(p_order_id uuid, p_refund_id text)
returns table (credits_removed integer, credits_kept integer, packs_removed integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.status <> 'paid' then
    raise exception 'not_refundable' using errcode = 'P0001';
  end if;
  return query select * from public.apply_order_refund(v_order, p_refund_id, 'admin');
end;
$$;

revoke execute on function public.admin_refund_order(uuid, text) from public, anon;
grant execute on function public.admin_refund_order(uuid, text) to authenticated;

-- Recherche des commandes par paiement Stripe (pi_…)
create index if not exists orders_provider_payment_idx
  on public.orders (provider_payment_id) where provider_payment_id is not null;

-- Événement charge.refunded : chaque evt_… n'est traité qu'une fois. Résultats :
-- duplicate, unknown_order (paiement d'une autre application du compte), partial_refund
-- (remboursement partiel : laissé à l'administrateur), ignored (déjà remboursée ou non
-- payée), processed.
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
    perform public.write_audit('order.partial_refund', 'order', v_order.id::text,
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
