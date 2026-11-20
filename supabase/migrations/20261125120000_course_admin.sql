-- =============================================================
--  Fichier    : 20261125120000_course_admin.sql
--  Projet     : Kalami Stratégie — le cours
--  Description: Cours de stratégie (v0.29.0, Sprint 2) : réglages de vente (prix FCFA,
--               euro, dollar canadien, livre associé), article de commande « course »
--               (carte et Mobile Money, codes promo de portée « tout le site »), livraison
--               et remboursement, et fonctions d'administration : accès en lot par
--               courriel de compte existant, retrait, cohortes, suivi des apprenants.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-19
--  Dépend de  : 20261124120000_course.sql, 20261116120000_author_workshop.sql
-- =============================================================

-- ==================== RÉGLAGES DE VENTE ====================

-- Une seule ligne (id = true)
create table public.course_settings (
  id boolean primary key default true check (id),
  on_sale boolean not null default false,
  price_xof integer check (price_xof > 0),
  price_eur numeric(10, 2) check (price_eur > 0),
  price_cad numeric(10, 2) check (price_cad > 0),
  -- Livre accordé avec le cours (achat et accès donné par l'administrateur)
  book_id uuid references public.books (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.course_settings (id) values (true);

create trigger course_settings_set_updated_at
  before update on public.course_settings
  for each row execute function public.set_updated_at();

alter table public.course_settings enable row level security;
revoke insert, update, delete on public.course_settings from anon, authenticated;

-- Prix publics (page du cours) ; écriture par fonction d'administration
create policy "course_settings_select_all" on public.course_settings
  for select to anon, authenticated using (true);

-- ==================== COMMANDES : ARTICLE « COURS » ====================

alter table public.order_items drop constraint order_items_kind_check;
alter table public.order_items
  add constraint order_items_kind_check
  check (kind in (
    'book', 'study', 'study_lot', 'coach_pack', 'practice_case', 'workshop_pack', 'course'
  ));

create index course_access_order_idx on public.course_access (order_id) where order_id is not null;

-- Commande du cours par l'acheteur connecté. Le livre associé (s'il y en a un) est noté sur
-- l'article et accordé à la livraison. Code promo : seule la portée « tout le site » vaut.
create or replace function public.create_course_order(
  p_currency text,
  p_promo_code text default null
)
returns table (order_id uuid, total_minor integer, label text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_settings public.course_settings;
  v_promo public.promo_codes;
  v_discount integer := 0;
  v_amount integer;
  v_label text;
  v_item_label text := 'Cours « La stratégie d''entreprise »';
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_currency not in ('XOF', 'EUR', 'CAD') then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;

  select * into v_settings from public.course_settings where id;
  v_amount := public.price_to_minor(p_currency, v_settings.price_xof, v_settings.price_eur,
    v_settings.price_cad);
  if not coalesce(v_settings.on_sale, false) or v_amount is null or v_amount <= 0 then
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.course_access
    where user_id = v_user_id and revoked_at is null
  ) then
    raise exception 'already_owned' using errcode = 'P0001';
  end if;

  v_label := v_item_label;
  if nullif(btrim(coalesce(p_promo_code, '')), '') is not null then
    v_promo := public.promo_check(v_user_id, p_promo_code, 'course', null);
    v_discount := public.promo_discount(v_promo, p_currency, v_amount);
    v_label := v_item_label || ' (code ' || v_promo.code || ')';
  end if;

  if (
    select count(*) from public.orders
    where user_id = v_user_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.orders
    (user_id, provider, currency, total_minor, promo_code_id, discount_minor)
  values (v_user_id, 'stripe', p_currency, v_amount - v_discount, v_promo.id, v_discount)
  returning id into v_order_id;

  insert into public.order_items (order_id, kind, book_id, unit_minor, label)
  values (v_order_id, 'course', v_settings.book_id, v_amount, v_item_label);

  return query select v_order_id, v_amount - v_discount, v_label;
end;
$$;

revoke execute on function public.create_course_order(text, text) from public, anon;
grant execute on function public.create_course_order(text, text) to authenticated;

-- ==================== LIVRAISON ====================

-- Remplacée : livre aussi le cours (droit d'accès et livre associé)
create or replace function public.fulfil_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item record;
begin
  select user_id into v_user_id from public.orders where id = p_order_id;

  for v_item in
    select i.kind, i.book_id, i.study_id, i.coach_pack_id, i.credits, i.label,
      i.practice_case, i.workshop_pack_id, b.pdf_enabled, b.grants_study_credit, b.title,
      p.cost_usd, p.name as pack_name, w.cost_usd as workshop_cost
    from public.order_items i
    left join public.books b on b.id = i.book_id
    left join public.coach_packs p on p.id = i.coach_pack_id
    left join public.workshop_packs w on w.id = i.workshop_pack_id
    where i.order_id = p_order_id
  loop
    if v_item.kind = 'book' and v_item.book_id is not null then
      insert into public.entitlements (user_id, book_id, source, order_id)
      values (v_user_id, v_item.book_id, 'purchase', p_order_id)
      on conflict (user_id, book_id) where revoked_at is null do nothing;

      if v_item.pdf_enabled then
        insert into public.pdf_purchases (user_id, book_id, reference, source, order_id)
        values (v_user_id, v_item.book_id,
          'KAL-' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8)),
          'purchase', p_order_id)
        on conflict do nothing;
      end if;

      if v_item.grants_study_credit then
        insert into public.study_credits (user_id, source, note, order_id)
        values (v_user_id, 'book_bonus', 'Offerte avec « ' || v_item.title || ' »', p_order_id)
        on conflict (user_id) where source = 'book_bonus' do nothing;
      end if;
    elsif v_item.kind in ('study', 'study_lot') then
      insert into public.study_credits (user_id, source, note, order_id)
      select v_user_id, 'purchase', v_item.label, p_order_id
      from generate_series(1, coalesce(v_item.credits, 1));
    elsif v_item.kind = 'coach_pack' and v_item.study_id is not null
      and v_item.cost_usd is not null then
      insert into public.coach_allowances
        (study_id, amount_usd, source, note, granted_by, pack_id, order_id)
      values (v_item.study_id, v_item.cost_usd, 'purchase', v_item.label, v_user_id,
        v_item.coach_pack_id, p_order_id);
    elsif v_item.kind = 'practice_case' and v_item.practice_case is not null then
      insert into public.practice_case_access (user_id, case_code, source, order_id)
      values (v_user_id, v_item.practice_case, 'purchase', p_order_id)
      on conflict (user_id, case_code) where revoked_at is null do nothing;
    elsif v_item.kind = 'workshop_pack' and v_item.workshop_cost is not null then
      insert into public.workshop_allowances
        (author_id, amount_usd, source, note, pack_id, order_id, granted_by)
      select a.id, v_item.workshop_cost, 'purchase', v_item.label, v_item.workshop_pack_id,
        p_order_id, v_user_id
      from public.authors a
      where a.user_id = v_user_id;
    elsif v_item.kind = 'course' then
      insert into public.course_access (user_id, source, order_id, note)
      values (v_user_id, 'purchase', p_order_id, v_item.label)
      on conflict (user_id) where revoked_at is null do nothing;

      if v_item.book_id is not null then
        insert into public.entitlements (user_id, book_id, source, order_id)
        values (v_user_id, v_item.book_id, 'purchase', p_order_id)
        on conflict (user_id, book_id) where revoked_at is null do nothing;
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.fulfil_order(uuid) from public, anon, authenticated;

-- ==================== REMBOURSEMENT ====================

-- Remplacée : retire aussi l'accès au cours acheté par la commande (le livre associé l'est
-- déjà par la ligne sur les droits de lecture de la commande)
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
  v_cases integer;
  v_workshop integer;
  v_course integer;
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

  update public.practice_case_access set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;
  get diagnostics v_cases = row_count;

  delete from public.workshop_allowances where order_id = p_order.id;
  get diagnostics v_workshop = row_count;

  update public.course_access set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;
  get diagnostics v_course = row_count;

  -- Insertion directe : write_audit exige un administrateur, absent pour le webhook
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'order.refund', 'order', p_order.id::text,
    jsonb_build_object('refund', p_refund_id, 'total_minor', p_order.total_minor,
      'currency', p_order.currency, 'credits_removed', v_removed,
      'credits_kept', v_kept, 'packs_removed', v_packs, 'cases_removed', v_cases,
      'workshop_removed', v_workshop, 'course_removed', v_course, 'source', p_source));

  return query select v_removed, v_kept, v_packs + v_workshop;
end;
$$;

revoke execute on function public.apply_order_refund(public.orders, text, text)
  from public, anon, authenticated;

-- ==================== ADMINISTRATION : RÉGLAGES ====================

-- Prix et livre associé ; mise en vente impossible sans au moins un prix
create or replace function public.admin_course_save_settings(
  p_on_sale boolean,
  p_price_xof integer,
  p_price_eur numeric,
  p_price_cad numeric,
  p_book_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if (p_price_xof is not null and p_price_xof not between 1 and 10000000)
    or (p_price_eur is not null and p_price_eur not between 0.01 and 100000)
    or (p_price_cad is not null and p_price_cad not between 0.01 and 100000) then
    raise exception 'invalid_price' using errcode = 'P0001';
  end if;
  if coalesce(p_on_sale, false)
    and p_price_xof is null and p_price_eur is null and p_price_cad is null then
    raise exception 'price_required' using errcode = 'P0001';
  end if;
  if p_book_id is not null and not exists (select 1 from public.books where id = p_book_id) then
    raise exception 'book_not_found' using errcode = 'P0001';
  end if;

  update public.course_settings set
    on_sale = coalesce(p_on_sale, false),
    price_xof = p_price_xof,
    price_eur = round(p_price_eur, 2),
    price_cad = round(p_price_cad, 2),
    book_id = p_book_id
  where id;

  perform public.write_audit('course.settings', 'course', null,
    jsonb_build_object('on_sale', coalesce(p_on_sale, false), 'xof', p_price_xof,
      'eur', p_price_eur, 'cad', p_price_cad, 'book', p_book_id));
end;
$$;

revoke execute on function public.admin_course_save_settings(boolean, integer, numeric,
  numeric, uuid) from public, anon;
grant execute on function public.admin_course_save_settings(boolean, integer, numeric,
  numeric, uuid) to authenticated;

-- ==================== ADMINISTRATION : COHORTES ====================

-- Crée (p_id null) ou modifie une cohorte ; renvoie son identifiant
create or replace function public.admin_course_save_cohort(
  p_id uuid,
  p_name text,
  p_country text,
  p_starts_on date,
  p_ends_on date,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_country text := nullif(upper(btrim(coalesce(p_country, ''))), '');
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if char_length(v_name) not between 1 and 120 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if v_country is not null and v_country !~ '^[A-Z]{2}$' then
    raise exception 'invalid_country' using errcode = 'P0001';
  end if;
  if p_starts_on is not null and p_ends_on is not null and p_ends_on < p_starts_on then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_note, '')) > 1000 then
    raise exception 'invalid_note' using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.course_cohorts (name, country, starts_on, ends_on, note)
    values (v_name, v_country, p_starts_on, p_ends_on, nullif(btrim(p_note), ''))
    returning id into v_id;
  else
    update public.course_cohorts set
      name = v_name, country = v_country, starts_on = p_starts_on, ends_on = p_ends_on,
      note = nullif(btrim(p_note), '')
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'cohort_not_found' using errcode = 'P0001';
    end if;
  end if;

  perform public.write_audit('course.cohort', 'course_cohort', v_id::text,
    jsonb_build_object('name', v_name, 'created', p_id is null));
  return v_id;
end;
$$;

revoke execute on function public.admin_course_save_cohort(uuid, text, text, date, date, text)
  from public, anon;
grant execute on function public.admin_course_save_cohort(uuid, text, text, date, date, text)
  to authenticated;

-- Supprime une cohorte : ses apprenants gardent leur accès, sans cohorte
create or replace function public.admin_course_delete_cohort(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  delete from public.course_cohorts where id = p_id returning name into v_name;
  if v_name is null then
    raise exception 'cohort_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit('course.cohort_delete', 'course_cohort', p_id::text,
    jsonb_build_object('name', v_name));
end;
$$;

revoke execute on function public.admin_course_delete_cohort(uuid) from public, anon;
grant execute on function public.admin_course_delete_cohort(uuid) to authenticated;

-- ==================== ADMINISTRATION : ACCÈS ====================

-- Donne l'accès à une liste de courriels de comptes EXISTANTS (200 au plus par appel).
-- Statuts : granted (nouvel accès), moved (accès existant, cohorte changée), already (déjà
-- inscrit), no_account (aucun compte : l'apprenant doit d'abord s'inscrire), invalid.
-- p_grant_book : accorde aussi le livre associé (réglages du cours).
create or replace function public.admin_course_grant(
  p_emails text[],
  p_cohort_id uuid,
  p_grant_book boolean,
  p_note text
)
returns table (email text, status text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_emails text[];
  v_email text;
  v_user_id uuid;
  v_access public.course_access;
  v_book uuid;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_counts jsonb := '{}'::jsonb;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_emails is null or cardinality(p_emails) = 0 then
    raise exception 'no_emails' using errcode = 'P0001';
  end if;
  if cardinality(p_emails) > 200 then
    raise exception 'too_many_emails' using errcode = 'P0001';
  end if;
  if char_length(coalesce(v_note, '')) > 500 then
    raise exception 'invalid_note' using errcode = 'P0001';
  end if;
  if p_cohort_id is not null
    and not exists (select 1 from public.course_cohorts where id = p_cohort_id) then
    raise exception 'cohort_not_found' using errcode = 'P0001';
  end if;
  if coalesce(p_grant_book, false) then
    select book_id into v_book from public.course_settings where id;
    if v_book is null then
      raise exception 'no_book' using errcode = 'P0001';
    end if;
  end if;

  select array_agg(distinct lower(btrim(e))) into v_emails from unnest(p_emails) e
  where btrim(coalesce(e, '')) <> '';
  if v_emails is null then
    raise exception 'no_emails' using errcode = 'P0001';
  end if;

  foreach v_email in array v_emails loop
    v_status := null;
    if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
      v_status := 'invalid';
    else
      select u.id into v_user_id from auth.users u where lower(u.email) = v_email limit 1;
      if v_user_id is null then
        v_status := 'no_account';
      end if;
    end if;

    if v_status is null then
      select * into v_access from public.course_access a
      where a.user_id = v_user_id and a.revoked_at is null;
      if v_access.id is null then
        insert into public.course_access (user_id, source, cohort_id, granted_by, note)
        values (v_user_id, 'admin_grant', p_cohort_id, auth.uid(), v_note);
        v_status := 'granted';
      elsif p_cohort_id is not null and v_access.cohort_id is distinct from p_cohort_id then
        update public.course_access set cohort_id = p_cohort_id where id = v_access.id;
        v_status := 'moved';
      else
        v_status := 'already';
      end if;

      if v_book is not null then
        insert into public.entitlements (user_id, book_id, source, granted_by, note)
        values (v_user_id, v_book, 'admin_grant', auth.uid(), 'Cours de stratégie')
        on conflict (user_id, book_id) where revoked_at is null do nothing;
      end if;
    end if;

    v_counts := jsonb_set(v_counts, array[v_status],
      to_jsonb(coalesce((v_counts ->> v_status)::integer, 0) + 1));
    email := v_email;
    status := v_status;
    return next;
    v_user_id := null;
    v_access := null;
  end loop;

  perform public.write_audit('course.grant', 'course_cohort', p_cohort_id::text,
    v_counts || jsonb_build_object('book', v_book is not null));
end;
$$;

revoke execute on function public.admin_course_grant(text[], uuid, boolean, text)
  from public, anon;
grant execute on function public.admin_course_grant(text[], uuid, boolean, text)
  to authenticated;

-- Change la cohorte d'un accès actif (null : sans cohorte)
create or replace function public.admin_course_set_cohort(p_access_id uuid, p_cohort_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_cohort_id is not null
    and not exists (select 1 from public.course_cohorts where id = p_cohort_id) then
    raise exception 'cohort_not_found' using errcode = 'P0001';
  end if;
  update public.course_access set cohort_id = p_cohort_id
  where id = p_access_id and revoked_at is null;
  if not found then
    raise exception 'access_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit('course.cohort_change', 'course_access', p_access_id::text,
    jsonb_build_object('cohort', p_cohort_id));
end;
$$;

revoke execute on function public.admin_course_set_cohort(uuid, uuid) from public, anon;
grant execute on function public.admin_course_set_cohort(uuid, uuid) to authenticated;

-- Retire un accès. Le livre associé n'est retiré que sur demande expresse, et seulement
-- s'il avait été donné par l'administrateur (un livre acheté reste acquis).
create or replace function public.admin_course_revoke(p_access_id uuid, p_revoke_book boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_book uuid;
  v_books integer := 0;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.course_access set revoked_at = now()
  where id = p_access_id and revoked_at is null
  returning user_id into v_user_id;
  if v_user_id is null then
    raise exception 'access_not_found' using errcode = 'P0001';
  end if;

  if coalesce(p_revoke_book, false) then
    select book_id into v_book from public.course_settings where id;
    if v_book is not null then
      update public.entitlements set revoked_at = now()
      where user_id = v_user_id and book_id = v_book and source = 'admin_grant'
        and revoked_at is null;
      get diagnostics v_books = row_count;
    end if;
  end if;

  perform public.write_audit('course.revoke', 'course_access', p_access_id::text,
    jsonb_build_object('user', v_user_id, 'book_revoked', v_books > 0));
end;
$$;

revoke execute on function public.admin_course_revoke(uuid, boolean) from public, anon;
grant execute on function public.admin_course_revoke(uuid, boolean) to authenticated;

-- ==================== ADMINISTRATION : SUIVI ====================

-- Apprenants ayant un accès actif, avec leur progression. Filtres : cohorte (null : toutes),
-- apprenant (null : tous). Moyenne : meilleure note de chaque exercice, puis moyenne.
create or replace function public.admin_course_learners(p_cohort_id uuid, p_user_id uuid)
returns table (
  access_id uuid,
  user_id uuid,
  email text,
  display_name text,
  source text,
  cohort_id uuid,
  cohort_name text,
  granted_at timestamptz,
  completed text[],
  started text[],
  seconds integer,
  last_seen_at timestamptz,
  average_score numeric,
  exercises integer
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
    select a.id, a.user_id, u.email::text, pr.display_name, a.source, a.cohort_id, c.name,
      a.created_at,
      coalesce((
        select array_agg(lp.lesson_id order by lp.lesson_id)
        from public.course_lesson_progress lp
        where lp.user_id = a.user_id and lp.completed_at is not null
      ), '{}'::text[]),
      coalesce((
        select array_agg(lp.lesson_id order by lp.lesson_id)
        from public.course_lesson_progress lp
        where lp.user_id = a.user_id and lp.completed_at is null
      ), '{}'::text[]),
      coalesce((
        select sum(ca.seconds) from public.course_activity ca where ca.user_id = a.user_id
      ), 0)::integer,
      (select max(ca.last_seen_at) from public.course_activity ca where ca.user_id = a.user_id),
      (
        select round(avg(b.best), 1) from (
          select max(t.score) as best from public.course_attempts t
          where t.user_id = a.user_id group by t.exercise_id
        ) b
      ),
      (
        select count(distinct t.exercise_id)::integer from public.course_attempts t
        where t.user_id = a.user_id
      )
    from public.course_access a
    join auth.users u on u.id = a.user_id
    left join public.profiles pr on pr.id = a.user_id
    left join public.course_cohorts c on c.id = a.cohort_id
    where a.revoked_at is null
      and (p_cohort_id is null or a.cohort_id = p_cohort_id)
      and (p_user_id is null or a.user_id = p_user_id)
    order by lower(u.email)
    limit 2000;
end;
$$;

revoke execute on function public.admin_course_learners(uuid, uuid) from public, anon;
grant execute on function public.admin_course_learners(uuid, uuid) to authenticated;
