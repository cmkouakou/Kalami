-- =============================================================
--  Fichier    : 20261122120000_member_activity_features.sql
--  Projet     : Kalami
--  Description: Administration réorganisée (v0.24.0) :
--               1. activité des membres connectés : pages vues par jour, provenance de
--                  l'arrivée, pays (jamais l'adresse IP), conservée 12 mois ;
--               2. lectures de l'administrateur : liste des membres (courriel,
--                  inscription, dernière visite, pages, provenance) et pages d'un membre ;
--               3. fonctionnalités : afficher ou masquer une offre d'étude, un forfait du
--                  coach ou de l'Atelier, un cas d'entraînement, sans toucher aux prix.
--               Les visiteurs non connectés restent comptés de façon anonyme
--               (site_visits, inchangé). Les administrateurs ne sont jamais comptés.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-16
--  Dépend de  : 20261120120000_reading_analytics.sql, 20261105120000_strategy_orders.sql,
--               20261030120000_strategy_coach_packs.sql, 20261113120000_practice_cases.sql
-- =============================================================

-- ==================== ACTIVITÉ DES MEMBRES CONNECTÉS ====================

create table public.member_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  -- Chemin sans paramètres, identifiants remplacés par « :id »
  path text not null check (char_length(path) between 1 and 200),
  views integer not null default 0 check (views >= 0),
  -- Site d'origine de la première arrivée du jour sur cette page ('' = direct ou interne)
  referrer text not null default '' check (char_length(referrer) <= 100),
  -- Pays déduit par l'hébergeur (code ISO à 2 lettres), jamais l'adresse IP
  country text not null default '' check (country = '' or country ~ '^[A-Z]{2}$'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, day, path)
);

create index member_activity_day_idx on public.member_activity (day);

comment on table public.member_activity is
  'Pages vues par les membres connectés, par jour ; détail conservé 12 mois (purge_analytics).';

/**
 * Ajoute une page vue d'un membre connecté (appelée par le serveur, clé secrète seulement).
 * Les administrateurs sont ignorés pour ne pas fausser les chiffres.
 */
create or replace function public.record_member_visit(
  p_user_id uuid,
  p_path text,
  p_country text,
  p_referrer text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
    or exists (select 1 from public.profiles p where p.id = p_user_id and p.is_admin) then
    return;
  end if;

  insert into public.member_activity as m (user_id, day, path, views, referrer, country)
  values (
    p_user_id,
    (now() at time zone 'utc')::date,
    left(p_path, 200),
    1,
    left(coalesce(p_referrer, ''), 100),
    case when p_country ~ '^[A-Z]{2}$' then p_country else '' end
  )
  on conflict (user_id, day, path) do update set
    views = m.views + 1,
    referrer = case when m.referrer = '' then excluded.referrer else m.referrer end,
    country = case when excluded.country = '' then m.country else excluded.country end,
    last_seen_at = now();
end;
$$;

revoke execute on function public.record_member_visit(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_member_visit(uuid, text, text, text) to service_role;

-- ==================== CONSERVATION (12 MOIS) ====================

/**
 * Remplacée : réduit aussi la purge à l'activité des membres (effacée sans total, les
 * visites anonymes du même jour sont déjà comptées dans site_visits).
 * @returns Nombre de lignes de détail effacées
 */
create or replace function public.purge_analytics()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit date := (date_trunc('month', now() at time zone 'utc') - interval '12 months')::date;
  v_visits integer;
  v_reading integer;
  v_members integer;
begin
  insert into public.site_visits_monthly as m (month, country, referrer, views, entries)
  select date_trunc('month', day)::date, country, referrer, sum(views), sum(entries)
  from public.site_visits
  where day < v_limit
  group by 1, 2, 3
  on conflict (month, country, referrer) do update set
    views = m.views + excluded.views,
    entries = m.entries + excluded.entries;
  delete from public.site_visits where day < v_limit;
  get diagnostics v_visits = row_count;

  insert into public.reading_monthly as m (month, book_id, readers, seconds)
  select date_trunc('month', day)::date, book_id, count(distinct user_id), sum(seconds)
  from public.reading_activity
  where day < v_limit
  group by 1, 2
  on conflict (month, book_id) do update set
    readers = m.readers + excluded.readers,
    seconds = m.seconds + excluded.seconds;
  delete from public.reading_activity where day < v_limit;
  get diagnostics v_reading = row_count;

  delete from public.member_activity where day < v_limit;
  get diagnostics v_members = row_count;

  return v_visits + v_reading + v_members;
end;
$$;

revoke execute on function public.purge_analytics() from public, anon, authenticated;
grant execute on function public.purge_analytics() to service_role;

-- ==================== LECTURES DE L'ADMINISTRATEUR ====================

/**
 * Membres inscrits avec leur activité depuis une date : courriel, nom, inscription,
 * dernière connexion, dernière page vue, jours actifs, pages vues, pages distinctes,
 * provenance de la première arrivée, dernier pays, page la plus vue, achats payés.
 * Les membres sans activité sur la période sont inclus (inscrits récemment ou inactifs).
 * @param p_since - Premier jour inclus (UTC)
 */
create or replace function public.admin_member_list(p_since date)
returns table (
  user_id uuid,
  email text,
  display_name text,
  signed_up_at timestamptz,
  last_sign_in_at timestamptz,
  last_seen_at timestamptz,
  active_days bigint,
  views bigint,
  pages bigint,
  first_referrer text,
  country text,
  top_path text,
  paid_orders bigint
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
    select
      u.id,
      u.email::text,
      p.display_name,
      u.created_at,
      u.last_sign_in_at,
      act.last_seen_at,
      coalesce(act.active_days, 0),
      coalesce(act.views, 0),
      coalesce(act.pages, 0),
      act.first_referrer,
      act.country,
      act.top_path,
      (select count(*) from public.orders o where o.user_id = u.id and o.status = 'paid')
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join lateral (
      select
        max(m.last_seen_at) as last_seen_at,
        count(distinct m.day)::bigint as active_days,
        sum(m.views)::bigint as views,
        count(distinct m.path)::bigint as pages,
        (array_agg(m.referrer order by m.first_seen_at) filter (where m.referrer <> ''))[1]
          as first_referrer,
        (array_agg(m.country order by m.last_seen_at desc) filter (where m.country <> ''))[1]
          as country,
        (select m2.path from public.member_activity m2
          where m2.user_id = u.id and m2.day >= p_since
          group by m2.path order by sum(m2.views) desc limit 1) as top_path
      from public.member_activity m
      where m.user_id = u.id and m.day >= p_since
    ) act on true
    where coalesce(p.is_admin, false) = false
    order by coalesce(act.last_seen_at, u.last_sign_in_at, u.created_at) desc nulls last
    limit 2000;
end;
$$;

revoke execute on function public.admin_member_list(date) from public, anon;
grant execute on function public.admin_member_list(date) to authenticated;

/**
 * Pages vues par un membre (12 derniers mois au plus), plus récentes d'abord.
 * @param p_user_id - Identifiant du membre
 */
create or replace function public.admin_member_pages(p_user_id uuid)
returns table (
  day date,
  path text,
  views integer,
  referrer text,
  country text,
  first_seen_at timestamptz,
  last_seen_at timestamptz
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
    select m.day, m.path, m.views, m.referrer, m.country, m.first_seen_at, m.last_seen_at
    from public.member_activity m
    where m.user_id = p_user_id
    order by m.last_seen_at desc
    limit 1000;
end;
$$;

revoke execute on function public.admin_member_pages(uuid) from public, anon;
grant execute on function public.admin_member_pages(uuid) to authenticated;

/**
 * Identité d'un membre pour sa fiche (même s'il n'a encore rien lu).
 * @param p_user_id - Identifiant du membre
 */
create or replace function public.admin_member_identity(p_user_id uuid)
returns table (
  user_id uuid,
  email text,
  display_name text,
  signed_up_at timestamptz,
  last_sign_in_at timestamptz
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
    select u.id, u.email::text, p.display_name, u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = p_user_id;
end;
$$;

revoke execute on function public.admin_member_identity(uuid) from public, anon;
grant execute on function public.admin_member_identity(uuid) to authenticated;

-- ==================== FONCTIONNALITÉS ====================

/**
 * Affiche ou masque une offre en vente sans toucher à ses prix.
 * @param p_kind   - 'study_offer' (code), 'coach_pack' / 'workshop_pack' (id),
 *                   'practice_case' (code)
 * @param p_key    - Code ou identifiant de l'offre
 * @param p_active - true = en vente, false = masquée
 */
create or replace function public.admin_set_feature(
  p_kind text,
  p_key text,
  p_active boolean
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
  if p_active is null then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;

  if p_kind = 'study_offer' then
    update public.strategy_offers set active = p_active where code = p_key;
  elsif p_kind = 'coach_pack' then
    if p_key !~ '^[0-9a-f-]{36}$' then
      raise exception 'feature_not_found' using errcode = 'P0001';
    end if;
    update public.coach_packs set active = p_active where id = p_key::uuid;
  elsif p_kind = 'workshop_pack' then
    if p_key !~ '^[0-9a-f-]{36}$' then
      raise exception 'feature_not_found' using errcode = 'P0001';
    end if;
    update public.workshop_packs set active = p_active where id = p_key::uuid;
  elsif p_kind = 'practice_case' then
    update public.practice_cases set active = p_active where code = p_key;
  else
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;
  if not found then
    raise exception 'feature_not_found' using errcode = 'P0001';
  end if;

  perform public.write_audit('admin.feature', p_kind, p_key,
    jsonb_build_object('active', p_active));
end;
$$;

revoke execute on function public.admin_set_feature(text, text, boolean) from public, anon;
grant execute on function public.admin_set_feature(text, text, boolean) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.member_activity enable row level security;
revoke all on public.member_activity from anon;

-- Écritures : uniquement par record_member_visit ; lecture : administrateur seul
create policy "member_activity_admin_read" on public.member_activity
  for select to authenticated using ((select public.is_admin()));
