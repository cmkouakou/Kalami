-- =============================================================
--  Fichier    : 20261030120000_strategy_coach_packs.sql
--  Projet     : Kalami Stratégie
--  Description: Verrouillage du coach (v0.11.1). Le coach d'une étude ne s'ouvre qu'avec un
--               forfait (accordé par l'administrateur en attendant le paiement) ; il se
--               recharge sans limite et profite à tous les membres. Le plafond gratuit
--               disparaît ; le plafond de classe ne fait plus que limiter le forfait.
--               Forfaits : coût Anthropic couvert (usage interne) et prix XOF/EUR/CAD saisis
--               par l'auteur. Les montants en dollars ne sont plus lisibles par les
--               membres : jauge, consommation par étape et estimations en pourcentage du
--               forfait, offres en « nombre de relectures » approximatif.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-16
--  Dépend de  : 20261029120000_strategy_classes.sql, 20261017120000_strategy_coach.sql
-- =============================================================

-- ==================== FORFAITS ====================

create table public.coach_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  -- Coût Anthropic couvert (dollars US), jamais montré aux clients
  cost_usd numeric(10, 2) not null check (cost_usd > 0 and cost_usd <= 1000),
  -- Prix de vente saisis par l'auteur ; vides tant que le paiement n'est pas ouvert
  price_xof integer check (price_xof > 0),
  price_eur numeric(10, 2) check (price_eur > 0),
  price_cad numeric(10, 2) check (price_cad > 0),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger coach_packs_set_updated_at
  before update on public.coach_packs
  for each row execute function public.set_updated_at();

-- Forfait d'origine d'un crédit (null : montant libre accordé par l'administrateur)
alter table public.coach_allowances
  add column pack_id uuid references public.coach_packs (id) on delete set null;

-- ==================== FONCTIONS INTERNES ====================

-- Coût moyen d'une relecture sur 90 jours (0,12 $ faute d'historique), pour traduire un
-- montant en « nombre de relectures »
create or replace function public.coach_review_cost()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(coalesce((
    select avg(cost_usd) from public.coach_requests
    where function = 'review' and status = 'done' and cost_usd > 0
      and created_at > now() - interval '90 days'
  ), 0.12), 0.01);
$$;

revoke execute on function public.coach_review_cost() from public, anon, authenticated;

-- Remplacée : le forfait d'une étude est la somme de ses crédits (achetés ou accordés),
-- limitée par le plafond de la classe s'il est fixé. Sans crédit, le coach est verrouillé.
create or replace function public.coach_study_budget(p_study_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select least(
    coalesce((
      select sum(a.amount_usd) from public.coach_allowances a where a.study_id = p_study_id
    ), 0),
    coalesce((
      select c.study_budget_usd
      from public.studies s
      join public.classes c on c.id = s.class_id
      where s.id = p_study_id
    ), 'infinity'::numeric)
  );
$$;

revoke execute on function public.coach_study_budget(uuid) from public, anon, authenticated;

-- Le coach de l'étude est-il ouvert (au moins un crédit) ?
create or replace function public.coach_study_unlocked(p_study_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.coach_allowances where study_id = p_study_id);
$$;

revoke execute on function public.coach_study_unlocked(uuid) from public, anon, authenticated;

-- ==================== FONCTIONS : MEMBRES ====================

-- Remplacée (nouveau type de retour) : jauge en pourcentage, jamais en dollars
drop function public.coach_study_usage(uuid);

create function public.coach_study_usage(p_study_id uuid)
returns table (used_pct numeric, remaining_reviews integer, unlocked boolean, enabled boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_spent numeric;
  v_budget numeric;
begin
  if public.study_role(p_study_id) is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  v_spent := public.coach_study_spent(p_study_id);
  v_budget := public.coach_study_budget(p_study_id);
  return query
    select
      case when v_budget > 0 then round(least(v_spent / v_budget, 1) * 100, 1) else 0 end,
      greatest(floor((v_budget - v_spent) / public.coach_review_cost()), 0)::integer,
      public.coach_study_unlocked(p_study_id),
      g.coach_enabled
    from public.strategy_settings g
    where g.id;
end;
$$;

revoke execute on function public.coach_study_usage(uuid) from public, anon;
grant execute on function public.coach_study_usage(uuid) to authenticated;

-- Consommation par étape et par fonction, en pourcentage du forfait (ou de la dépense si
-- elle le dépasse) ; step_no est null pour l'analyse des pièces jointes
create or replace function public.coach_study_breakdown(p_study_id uuid)
returns table (step_no smallint, function text, requests integer, pct numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_base numeric;
begin
  if public.study_role(p_study_id) is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  v_base := greatest(public.coach_study_budget(p_study_id),
    public.coach_study_spent(p_study_id));
  return query
    select r.step_no, r.function, count(*)::integer,
      case when v_base > 0 then round(sum(r.cost_usd) / v_base * 100, 1) else 0 end
    from public.coach_requests r
    where r.study_id = p_study_id and r.status = 'done'
    group by r.step_no, r.function
    order by r.step_no nulls first, r.function;
end;
$$;

revoke execute on function public.coach_study_breakdown(uuid) from public, anon;
grant execute on function public.coach_study_breakdown(uuid) to authenticated;

-- Part typique du forfait de l'étude consommée par une demande, par fonction (moyenne de
-- toutes les études sur 90 jours) ; vide si le forfait est nul
create or replace function public.coach_function_estimates(p_study_id uuid)
returns table (function text, pct numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_budget numeric;
begin
  if public.study_role(p_study_id) is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  v_budget := public.coach_study_budget(p_study_id);
  if v_budget <= 0 then
    return;
  end if;
  return query
    select r.function, round(avg(r.cost_usd) / v_budget * 100, 1)
    from public.coach_requests r
    where r.status = 'done' and r.cost_usd > 0
      and r.created_at > now() - interval '90 days'
    group by r.function;
end;
$$;

revoke execute on function public.coach_function_estimates(uuid) from public, anon;
grant execute on function public.coach_function_estimates(uuid) to authenticated;

-- Forfaits proposés : nom, prix et nombre approximatif de relectures, jamais le coût
create or replace function public.coach_pack_offers()
returns table (
  id uuid,
  name text,
  price_xof integer,
  price_eur numeric,
  price_cad numeric,
  approx_reviews integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.price_xof, p.price_eur, p.price_cad,
    greatest(floor(p.cost_usd / public.coach_review_cost()), 1)::integer
  from public.coach_packs p
  where p.active and auth.uid() is not null
  order by p.position, p.cost_usd;
$$;

revoke execute on function public.coach_pack_offers() from public, anon;
grant execute on function public.coach_pack_offers() to authenticated;

-- Remplacée (même signature) : refus « coach_locked » si l'étude n'a aucun crédit. Le reste
-- est inchangé.
create or replace function public.coach_reserve(
  p_study_id uuid,
  p_step_no smallint,
  p_function text,
  p_estimate numeric,
  p_attachment_id uuid default null
)
returns table (
  request_id uuid,
  refusal text,
  model text,
  input_price numeric,
  output_price numeric,
  search_max_uses integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.strategy_settings;
  v_status text;
  v_count integer;
  v_id uuid;
  v_estimate numeric;
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_function = 'extract' then
    if p_step_no is not null or not exists (
      select 1 from public.study_attachments
      where id = p_attachment_id and study_id = p_study_id
    ) then
      raise exception 'invalid_request' using errcode = 'P0001';
    end if;
  elsif p_function = 'plan' then
    if p_step_no is distinct from 9 or p_attachment_id is not null then
      raise exception 'invalid_request' using errcode = 'P0001';
    end if;
  elsif p_function not in ('review', 'deepen', 'score', 'research', 'synthesize')
    or p_step_no is null or p_step_no not between 1 and 8
    or p_attachment_id is not null
    or (p_function = 'research' and p_step_no not in (1, 2))
    or (p_function = 'synthesize' and p_step_no <> 5) then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;
  if p_estimate is null or p_estimate < 0 or p_estimate > 50 then
    raise exception 'invalid_estimate' using errcode = 'P0001';
  end if;
  if p_function <> 'extract' then
    if cardinality(public.strategy_missing_prerequisites(p_study_id, p_step_no)) > 0 then
      raise exception 'prerequisites_missing' using errcode = 'P0001';
    end if;
    select status into v_status from public.study_steps
    where study_id = p_study_id and step_no = p_step_no;
    if v_status = 'validated' then
      raise exception 'step_validated' using errcode = 'P0001';
    end if;
  end if;

  select * into v_settings from public.strategy_settings where id;
  if not v_settings.coach_enabled then
    return query select null::uuid, 'coach_disabled'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  -- Coach coupé par l'enseignant pour cette étape
  if p_step_no is not null and exists (
    select 1 from public.studies s
    join public.classes c on c.id = s.class_id
    where s.id = p_study_id and p_step_no = any (c.coach_disabled_steps)
  ) then
    return query select null::uuid, 'coach_disabled_step'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  -- Coach verrouillé : aucun forfait pour cette étude
  if not public.coach_study_unlocked(p_study_id) then
    return query select null::uuid, 'coach_locked'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  v_estimate := p_estimate;
  if p_function = 'research' then
    v_estimate := v_estimate
      + v_settings.coach_search_max_uses * v_settings.coach_search_price;
  end if;

  -- Sérialise les demandes d'un même utilisateur et d'une même étude
  perform pg_advisory_xact_lock(hashtext('coach:user:' || auth.uid()::text));
  perform pg_advisory_xact_lock(hashtext('coach:study:' || p_study_id::text));

  select count(*) into v_count from public.coach_requests
  where user_id = auth.uid()
    and created_at > now() - make_interval(mins => v_settings.coach_rate_window);
  if v_count >= v_settings.coach_rate_limit then
    if not exists (
      select 1 from public.audit_logs
      where action = 'coach.rate_limited' and target_id = auth.uid()::text
        and created_at > now() - make_interval(mins => v_settings.coach_rate_window)
    ) then
      insert into public.audit_logs (actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'coach.rate_limited', 'user', auth.uid()::text,
        jsonb_build_object('study_id', p_study_id, 'count', v_count));
    end if;
    return query select null::uuid, 'rate_limited'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  if public.coach_study_spent(p_study_id) + v_estimate > public.coach_study_budget(p_study_id)
  then
    if not exists (
      select 1 from public.audit_logs
      where action = 'coach.budget_reached' and target_id = p_study_id::text
        and created_at > now() - interval '1 day'
    ) then
      insert into public.audit_logs (actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'coach.budget_reached', 'study', p_study_id::text,
        jsonb_build_object('spent', public.coach_study_spent(p_study_id)));
    end if;
    return query select null::uuid, 'budget_exhausted'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  insert into public.coach_requests (
    study_id, user_id, function, step_no, attachment_id, model, input_price, output_price,
    search_price, estimate_usd
  )
  values (
    p_study_id, auth.uid(), p_function, p_step_no, p_attachment_id, v_settings.coach_model,
    v_settings.coach_input_price, v_settings.coach_output_price,
    v_settings.coach_search_price, v_estimate
  )
  returning id into v_id;

  return query select v_id, null::text, v_settings.coach_model,
    v_settings.coach_input_price, v_settings.coach_output_price,
    v_settings.coach_search_max_uses;
end;
$$;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Crée (p_id null) ou modifie un forfait ; administrateur (aal2) seulement
create or replace function public.admin_save_coach_pack(
  p_id uuid,
  p_name text,
  p_cost numeric,
  p_price_xof integer,
  p_price_eur numeric,
  p_price_cad numeric,
  p_active boolean,
  p_position integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if p_cost is null or p_cost <= 0 or p_cost > 1000 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  if coalesce(p_price_xof, 1) <= 0 or coalesce(p_price_eur, 1) <= 0
    or coalesce(p_price_cad, 1) <= 0 then
    raise exception 'invalid_price' using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.coach_packs (
      name, cost_usd, price_xof, price_eur, price_cad, active, position
    )
    values (btrim(p_name), p_cost, p_price_xof, p_price_eur, p_price_cad,
      coalesce(p_active, true), coalesce(p_position, 0))
    returning id into v_id;
  else
    update public.coach_packs
    set name = btrim(p_name), cost_usd = p_cost, price_xof = p_price_xof,
      price_eur = p_price_eur, price_cad = p_price_cad, active = coalesce(p_active, active),
      position = coalesce(p_position, position)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'pack_not_found' using errcode = 'P0001';
    end if;
  end if;

  perform public.write_audit('strategy.coach.pack', 'coach_pack', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'cost', p_cost, 'active', p_active));
  return v_id;
end;
$$;

revoke execute on function public.admin_save_coach_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer
) from public, anon;
grant execute on function public.admin_save_coach_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer
) to authenticated;

-- Accorde un forfait à une étude (ouvre ou recharge le coach) ; administrateur seulement
create or replace function public.admin_grant_coach_pack(
  p_study_id uuid,
  p_pack_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pack public.coach_packs;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if not exists (select 1 from public.studies where id = p_study_id) then
    raise exception 'study_not_found' using errcode = 'P0001';
  end if;
  select * into v_pack from public.coach_packs where id = p_pack_id;
  if v_pack.id is null then
    raise exception 'pack_not_found' using errcode = 'P0001';
  end if;

  insert into public.coach_allowances (study_id, amount_usd, source, note, granted_by, pack_id)
  values (p_study_id, v_pack.cost_usd, 'admin_grant', nullif(btrim(p_note), ''), auth.uid(),
    v_pack.id);

  perform public.write_audit('strategy.coach.allowance', 'study', p_study_id::text,
    jsonb_build_object('pack', v_pack.name, 'amount', v_pack.cost_usd,
      'note', nullif(btrim(p_note), '')));
end;
$$;

revoke execute on function public.admin_grant_coach_pack(uuid, uuid, text) from public, anon;
grant execute on function public.admin_grant_coach_pack(uuid, uuid, text) to authenticated;

-- Remplacée (même signature) : liste aussi les études qui ont un forfait sans demande
create or replace function public.admin_coach_usage()
returns table (
  study_id uuid,
  company_name text,
  owner_email text,
  requests integer,
  spent numeric,
  budget numeric,
  last_at timestamptz
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
    select s.id, s.company_name, u.email::text, count(r.id)::integer,
      public.coach_study_spent(s.id), public.coach_study_budget(s.id), max(r.created_at)
    from public.studies s
    left join public.coach_requests r on r.study_id = s.id
    left join auth.users u on u.id = s.owner_id
    where exists (select 1 from public.coach_requests x where x.study_id = s.id)
      or exists (select 1 from public.coach_allowances a where a.study_id = s.id)
    group by s.id, s.company_name, u.email
    order by max(r.created_at) desc nulls last
    limit 200;
end;
$$;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.coach_packs enable row level security;

-- Forfaits : administrateur seulement (les clients passent par coach_pack_offers)
create policy "coach_packs_select_admin" on public.coach_packs
  for select to authenticated using ((select public.is_admin()));

revoke insert, update, delete on public.coach_packs from anon, authenticated;

-- Crédits : administrateur seulement (les montants sont en dollars)
drop policy "coach_allowances_select_member_or_admin" on public.coach_allowances;
create policy "coach_allowances_select_admin" on public.coach_allowances
  for select to authenticated using ((select public.is_admin()));

-- Demandes : les membres lisent tout sauf les prix, les jetons et les coûts
revoke select on public.coach_requests from anon, authenticated;
grant select (
  id, study_id, user_id, function, step_no, attachment_id, prompt_id, status, input, output,
  decisions, error, created_at, completed_at
) on public.coach_requests to authenticated;

-- ==================== CONTENU DE DÉPART ====================

-- Forfaits proposés (prix à saisir par l'auteur)
insert into public.coach_packs (name, cost_usd, position) values
  ('Forfait Essentiel', 2, 1),
  ('Forfait Approfondi', 6, 2),
  ('Forfait Intensif', 12, 3);

-- Les études qui ont déjà utilisé le coach gardent leur accès : forfait Essentiel accordé
insert into public.coach_allowances (study_id, amount_usd, source, note, pack_id)
select s.id, p.cost_usd, 'admin_grant', 'Accès conservé lors du verrouillage du coach', p.id
from public.studies s
cross join public.coach_packs p
where p.name = 'Forfait Essentiel'
  and exists (select 1 from public.coach_requests r where r.study_id = s.id)
  and not exists (select 1 from public.coach_allowances a where a.study_id = s.id);
