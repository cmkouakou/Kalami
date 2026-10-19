-- =============================================================
--  Fichier    : 20261110120000_payouts.sql
--  Projet     : Kalami
--  Description: Versements aux auteurs et journal d'audit consultable (Sprint 10b, v0.12.1,
--               cahier §3.10). L'auteur demande tout son disponible d'une devise (au-dessus
--               du seuil, coordonnées de versement renseignées) ; le montant est aussitôt
--               retenu. L'administrateur approuve ou refuse, paie hors de l'application
--               (frais à la charge de Kalami), puis marque « payé » avec la référence de la
--               transaction et, au besoin, un justificatif (seau privé « payout-proofs »).
--               Chaque étape est inscrite au journal d'audit, lisible par une fonction admin.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-19
--  Dépendances: 20261109120000_ledger.sql, 20261011120000_author_space.sql
--               (author_payout_details, current_author_id), 20261006120000_profiles_roles.sql
-- =============================================================

-- ==================== TABLE : DEMANDES DE VERSEMENT ====================

-- requested → approved → paid ; requested ou approved → rejected ; requested → cancelled
create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^VER-[0-9A-F]{8}$'),
  -- Historique conservé si la fiche auteur disparaît
  author_id uuid references public.authors (id) on delete set null,
  author_name text not null check (char_length(author_name) between 1 and 120),
  currency text not null check (currency in ('XOF', 'EUR', 'CAD')),
  amount_minor bigint not null check (amount_minor > 0),
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'paid', 'rejected', 'cancelled')),
  -- Coordonnées de versement au moment de la demande (mode, titulaire, compte ou numéro)
  payout_method text not null check (payout_method in ('bank', 'mobile_money')),
  payout_details jsonb not null,
  requested_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  paid_at timestamptz,
  paid_by uuid references auth.users (id) on delete set null,
  payment_reference text check (char_length(payment_reference) between 1 and 120),
  proof_path text check (char_length(proof_path) <= 300),
  rejected_at timestamptz,
  rejected_by uuid references auth.users (id) on delete set null,
  rejection_reason text check (char_length(rejection_reason) between 3 and 500),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_paid_fields
    check (status <> 'paid' or (paid_at is not null and payment_reference is not null)),
  constraint payout_rejected_fields
    check (status <> 'rejected' or (rejected_at is not null and rejection_reason is not null))
);

comment on table public.payout_requests is
  'Demandes de versement des auteurs (montant retenu sur le disponible jusqu''au refus).';

-- Une seule demande ouverte par auteur et par devise
create unique index payout_requests_open_idx on public.payout_requests (author_id, currency)
  where status in ('requested', 'approved');
create index payout_requests_author_idx on public.payout_requests (author_id, created_at desc);
create index payout_requests_status_idx on public.payout_requests (status, created_at desc);

create trigger payout_requests_set_updated_at
  before update on public.payout_requests
  for each row execute function public.set_updated_at();

-- ==================== SEAU PRIVÉ : JUSTIFICATIFS ====================

-- Reçu du virement ou du transfert : PDF ou image, 5 Mo ; administrateurs seulement
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payout-proofs', 'payout-proofs', false, 5242880,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "payout_proofs_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payout-proofs' and (select public.is_admin()));
create policy "payout_proofs_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'payout-proofs' and (select public.is_admin()));
create policy "payout_proofs_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payout-proofs' and (select public.is_admin()));

-- ==================== FONCTIONS : SOLDES ====================

-- Soldes d'un auteur par devise. Disponible = part disponible − demandes ouvertes − versé.
-- Interne : appelée par les fonctions ci-dessous, jamais directement par un client.
create or replace function public.ledger_author_balances(p_author_id uuid)
returns table (
  currency text,
  sales integer,
  gross_minor bigint,
  earned_minor bigint,
  available_minor bigint,
  pending_minor bigint,
  requested_minor bigint,
  paid_minor bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with ledger as (
    select e.currency,
      sum(case when e.entry_type = 'sale' then 1 else -1 end)::integer as sales,
      sum(e.gross_minor) as gross,
      sum(e.author_minor) as earned,
      coalesce(sum(e.author_minor) filter (where e.available_at <= now()), 0) as available,
      coalesce(sum(e.author_minor) filter (where e.available_at > now()), 0) as pending
    from public.ledger_entries e
    where e.author_id = p_author_id
    group by e.currency
  ), payouts as (
    select p.currency,
      coalesce(sum(p.amount_minor) filter (where p.status in ('requested', 'approved')), 0)
        as requested,
      coalesce(sum(p.amount_minor) filter (where p.status = 'paid'), 0) as paid
    from public.payout_requests p
    where p.author_id = p_author_id
    group by p.currency
  )
  select l.currency, l.sales, l.gross, l.earned,
    l.available - coalesce(p.requested, 0) - coalesce(p.paid, 0),
    l.pending, coalesce(p.requested, 0), coalesce(p.paid, 0)
  from ledger l
  left join payouts p on p.currency = l.currency
  order by l.currency;
$$;
revoke execute on function public.ledger_author_balances(uuid) from public, anon, authenticated;

-- Le type de retour change (colonnes ajoutées) : la fonction est recréée
drop function public.author_ledger_balances();
create function public.author_ledger_balances()
returns table (
  currency text,
  sales integer,
  gross_minor bigint,
  earned_minor bigint,
  available_minor bigint,
  pending_minor bigint,
  requested_minor bigint,
  paid_minor bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.ledger_author_balances(public.current_author_id());
$$;
revoke execute on function public.author_ledger_balances() from public, anon;
grant execute on function public.author_ledger_balances() to authenticated;

-- ==================== FONCTIONS : AUTEUR ====================

-- Demande le versement de tout le disponible d'une devise.
-- Erreurs : invalid_currency, no_payout_details, payout_open, below_minimum.
create or replace function public.author_request_payout(p_currency text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author_id uuid := public.current_author_id();
  v_author_name text;
  v_details public.author_payout_details;
  v_available bigint;
  v_minimum integer;
  v_reference text;
  v_id uuid;
begin
  if v_author_id is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_currency is null or p_currency not in ('XOF', 'EUR', 'CAD') then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;
  -- Deux demandes simultanées du même auteur passent l'une après l'autre
  perform pg_advisory_xact_lock(hashtextextended('payout:' || v_author_id::text, 0));

  select * into v_details from public.author_payout_details where author_id = v_author_id;
  if v_details.author_id is null then
    raise exception 'no_payout_details' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.payout_requests
    where author_id = v_author_id and currency = p_currency
      and status in ('requested', 'approved')
  ) then
    raise exception 'payout_open' using errcode = 'P0001';
  end if;

  select b.available_minor into v_available
  from public.ledger_author_balances(v_author_id) b
  where b.currency = p_currency;
  select case p_currency
      when 'XOF' then s.payout_min_xof
      when 'EUR' then s.payout_min_eur
      else s.payout_min_cad
    end into v_minimum
  from public.revenue_settings s;
  if coalesce(v_available, 0) < v_minimum then
    raise exception 'below_minimum' using errcode = 'P0001';
  end if;

  select display_name into v_author_name from public.authors where id = v_author_id;
  v_reference := 'VER-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.payout_requests (reference, author_id, author_name, currency, amount_minor,
    payout_method, payout_details, requested_by)
  values (v_reference, v_author_id, left(v_author_name, 120), p_currency, v_available,
    v_details.method, to_jsonb(v_details) - 'author_id' - 'updated_at', auth.uid())
  returning id into v_id;

  -- write_audit est réservée aux administrateurs : écriture directe
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'payout.requested', 'payout_request', v_id::text,
    jsonb_build_object('reference', v_reference, 'author_id', v_author_id,
      'currency', p_currency, 'amount_minor', v_available));
  return v_id;
end;
$$;
revoke execute on function public.author_request_payout(text) from public, anon;
grant execute on function public.author_request_payout(text) to authenticated;

-- Annule une demande pas encore approuvée. Erreur : payout_not_found.
create or replace function public.author_cancel_payout(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author_id uuid := public.current_author_id();
  v_reference text;
begin
  if v_author_id is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.payout_requests
  set status = 'cancelled', cancelled_at = now()
  where id = p_id and author_id = v_author_id and status = 'requested'
  returning reference into v_reference;
  if v_reference is null then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'payout.cancelled', 'payout_request', p_id::text,
    jsonb_build_object('reference', v_reference));
end;
$$;
revoke execute on function public.author_cancel_payout(uuid) from public, anon;
grant execute on function public.author_cancel_payout(uuid) to authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Approuve une demande (le paiement reste à faire). Erreur : payout_not_found.
create or replace function public.admin_payout_approve(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference text;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.payout_requests
  set status = 'approved', approved_at = now(), approved_by = auth.uid()
  where id = p_id and status = 'requested'
  returning reference into v_reference;
  if v_reference is null then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit('payout.approved', 'payout_request', p_id::text,
    jsonb_build_object('reference', v_reference));
end;
$$;
revoke execute on function public.admin_payout_approve(uuid) from public, anon;
grant execute on function public.admin_payout_approve(uuid) to authenticated;

-- Refuse une demande ouverte : le montant redevient disponible.
-- Erreurs : invalid_reason, payout_not_found. Renvoie de quoi prévenir l'auteur.
create or replace function public.admin_payout_reject(p_id uuid, p_reason text)
returns table (author_email text, reference text, currency text, amount_minor bigint)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_row public.payout_requests;
  v_reason text := trim(p_reason);
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if v_reason is null or char_length(v_reason) not between 3 and 500 then
    raise exception 'invalid_reason' using errcode = 'P0001';
  end if;
  update public.payout_requests
  set status = 'rejected', rejected_at = now(), rejected_by = auth.uid(),
    rejection_reason = v_reason
  where id = p_id and status in ('requested', 'approved')
  returning * into v_row;
  if v_row.id is null then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit('payout.rejected', 'payout_request', p_id::text,
    jsonb_build_object('reference', v_row.reference, 'reason', v_reason));
  return query
    select u.email::text, v_row.reference, v_row.currency, v_row.amount_minor
    from public.authors a
    left join auth.users u on u.id = a.user_id
    where a.id = v_row.author_id;
end;
$$;
revoke execute on function public.admin_payout_reject(uuid, text) from public, anon;
grant execute on function public.admin_payout_reject(uuid, text) to authenticated;

-- Marque payée une demande approuvée, avec la référence de la transaction et, au besoin,
-- le chemin du justificatif (dossier « versements/<id>/ » du seau privé).
-- Erreurs : invalid_payment_reference, invalid_proof, payout_not_found.
create or replace function public.admin_payout_mark_paid(
  p_id uuid,
  p_payment_reference text,
  p_proof_path text default null
)
returns table (author_email text, reference text, currency text, amount_minor bigint)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_row public.payout_requests;
  v_payment text := trim(p_payment_reference);
  v_proof text := nullif(trim(p_proof_path), '');
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if v_payment is null or char_length(v_payment) not between 1 and 120 then
    raise exception 'invalid_payment_reference' using errcode = 'P0001';
  end if;
  if v_proof is not null and (
    v_proof not like 'versements/' || p_id::text || '/%'
    or not exists (
      select 1 from storage.objects o where o.bucket_id = 'payout-proofs' and o.name = v_proof
    )
  ) then
    raise exception 'invalid_proof' using errcode = 'P0001';
  end if;
  update public.payout_requests
  set status = 'paid', paid_at = now(), paid_by = auth.uid(),
    payment_reference = v_payment, proof_path = v_proof
  where id = p_id and status = 'approved'
  returning * into v_row;
  if v_row.id is null then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit('payout.paid', 'payout_request', p_id::text,
    jsonb_build_object('reference', v_row.reference, 'payment_reference', v_payment,
      'currency', v_row.currency, 'amount_minor', v_row.amount_minor,
      'proof', v_proof is not null));
  return query
    select u.email::text, v_row.reference, v_row.currency, v_row.amount_minor
    from public.authors a
    left join auth.users u on u.id = a.user_id
    where a.id = v_row.author_id;
end;
$$;
revoke execute on function public.admin_payout_mark_paid(uuid, text, text) from public, anon;
grant execute on function public.admin_payout_mark_paid(uuid, text, text) to authenticated;

-- ==================== FONCTIONS : JOURNAL D'AUDIT ====================

-- Entrées du journal, les plus récentes d'abord, avec le courriel de l'auteur de l'action.
-- p_category : préfixe de l'action (« payout » pour « payout.paid »…), null pour tout.
create or replace function public.admin_audit_log(
  p_category text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id bigint,
  created_at timestamptz,
  action text,
  target_type text,
  target_id text,
  details jsonb,
  actor_email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  return query
    select l.id, l.created_at, l.action, l.target_type, l.target_id, l.details,
      u.email::text
    from public.audit_logs l
    left join auth.users u on u.id = l.actor_id
    where p_category is null or split_part(l.action, '.', 1) = p_category
    order by l.created_at desc, l.id desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;
revoke execute on function public.admin_audit_log(text, integer, integer) from public, anon;
grant execute on function public.admin_audit_log(text, integer, integer) to authenticated;

-- Catégories présentes dans le journal (préfixe de l'action) et leur nombre d'entrées
create or replace function public.admin_audit_categories()
returns table (category text, entries integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  return query
    select split_part(l.action, '.', 1), count(*)::integer
    from public.audit_logs l
    group by 1
    order by 1;
end;
$$;
revoke execute on function public.admin_audit_categories() from public, anon;
grant execute on function public.admin_audit_categories() to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.payout_requests enable row level security;

-- Lecture par l'auteur concerné et l'administrateur ; écriture par fonctions uniquement
create policy "payout_requests_select_own_or_admin" on public.payout_requests
  for select to authenticated
  using (author_id = (select public.current_author_id()) or (select public.is_admin()));
revoke insert, update, delete on public.payout_requests from anon, authenticated;
