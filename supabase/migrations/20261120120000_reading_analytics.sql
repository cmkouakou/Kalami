-- =============================================================
--  Fichier    : 20261120120000_reading_analytics.sql
--  Projet     : Kalami
--  Description: Statistiques de lecture et d'audience (v0.16.1) :
--               1. activité de lecture par jour (lecteur, livre) : temps estimé, chapitres
--                  ouverts, pays — alimentée par l'enregistrement du marque-page ;
--               2. visites du site, anonymes et agrégées par jour (page, pays, provenance),
--                  sans adresse IP ni témoin ;
--               3. conservation : détail gardé 12 mois, puis réduit en totaux mensuels
--                  anonymes (purge quotidienne par tâche planifiée) ;
--               4. lectures réservées à l'administrateur (RLS + fonction avec courriels).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-28
--  Dépend de  : 20261009120000_reader.sql, 20261008120000_content.sql
-- =============================================================

-- ==================== ACTIVITÉ DE LECTURE ====================

create table public.reading_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  day date not null,
  -- Temps de lecture estimé : écarts entre deux enregistrements, plafonnés à 5 minutes
  seconds integer not null default 0 check (seconds between 0 and 86400),
  -- Chapitres ouverts ce jour-là (numéros de position)
  chapters integer[] not null default '{}',
  -- Pays déduit par l'hébergeur (code ISO à 2 lettres), jamais l'adresse IP
  country text check (country ~ '^[A-Z]{2}$'),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, book_id, day)
);

create index reading_activity_day_idx on public.reading_activity (day);

comment on table public.reading_activity is
  'Activité de lecture quotidienne ; détail conservé 12 mois (purge_analytics).';

/**
 * Note l'activité du lecteur connecté sur un livre (appelée à chaque marque-page).
 * Le premier enregistrement du jour compte 0 seconde ; un écart de plus de 5 minutes
 * est considéré comme une pause et n'est pas compté.
 */
create or replace function public.record_reading_activity(
  p_book_id uuid,
  p_chapter integer,
  p_country text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_country text := case when p_country ~ '^[A-Z]{2}$' then p_country end;
begin
  if v_user is null then
    raise exception 'connexion requise' using errcode = '42501';
  end if;
  if p_chapter is null or p_chapter not between 1 and 1000 then
    raise exception 'chapitre invalide' using errcode = '22023';
  end if;

  insert into public.reading_activity as a (user_id, book_id, day, chapters, country)
  values (v_user, p_book_id, (now() at time zone 'utc')::date, array[p_chapter], v_country)
  on conflict (user_id, book_id, day) do update set
    seconds = least(
      86400,
      a.seconds + case
        when now() - a.last_seen_at <= interval '5 minutes'
          then extract(epoch from now() - a.last_seen_at)::integer
        else 0
      end
    ),
    chapters = case
      when p_chapter = any (a.chapters) then a.chapters
      else a.chapters || p_chapter
    end,
    country = coalesce(excluded.country, a.country),
    last_seen_at = now();
end;
$$;

revoke execute on function public.record_reading_activity(uuid, integer, text)
  from public, anon;
grant execute on function public.record_reading_activity(uuid, integer, text) to authenticated;

-- ==================== VISITES DU SITE ====================

create table public.site_visits (
  day date not null,
  -- Chemin sans paramètres, identifiants remplacés par « :id »
  path text not null check (char_length(path) between 1 and 200),
  -- '' = pays inconnu
  country text not null default '' check (country = '' or country ~ '^[A-Z]{2}$'),
  -- Site d'origine (nom d'hôte seul) pour une arrivée ; '' = accès direct ou page suivante
  referrer text not null default '' check (char_length(referrer) <= 100),
  views integer not null default 0 check (views >= 0),
  -- Arrivées sur le site (première page d'une visite)
  entries integer not null default 0 check (entries >= 0),
  primary key (day, path, country, referrer)
);

comment on table public.site_visits is
  'Pages vues anonymes agrégées par jour ; aucune IP, aucun témoin. Détail gardé 12 mois.';

/** Ajoute une page vue (appelée par le serveur avec la clé secrète seulement). */
create or replace function public.record_site_visit(
  p_path text,
  p_country text,
  p_referrer text,
  p_entry boolean
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.site_visits as v (day, path, country, referrer, views, entries)
  values (
    (now() at time zone 'utc')::date,
    left(p_path, 200),
    case when p_country ~ '^[A-Z]{2}$' then p_country else '' end,
    left(coalesce(p_referrer, ''), 100),
    1,
    case when p_entry then 1 else 0 end
  )
  on conflict (day, path, country, referrer) do update set
    views = v.views + 1,
    entries = v.entries + excluded.entries;
$$;

revoke execute on function public.record_site_visit(text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.record_site_visit(text, text, text, boolean) to service_role;

-- ==================== TOTAUX MENSUELS (AU-DELÀ DE 12 MOIS) ====================

create table public.site_visits_monthly (
  month date not null check (extract(day from month) = 1),
  country text not null default '',
  referrer text not null default '',
  views bigint not null default 0,
  entries bigint not null default 0,
  primary key (month, country, referrer)
);

create table public.reading_monthly (
  month date not null check (extract(day from month) = 1),
  book_id uuid not null references public.books (id) on delete cascade,
  readers integer not null default 0,
  seconds bigint not null default 0,
  primary key (month, book_id)
);

/**
 * Réduit le détail de plus de 12 mois en totaux mensuels anonymes, puis l'efface.
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

  return v_visits + v_reading;
end;
$$;

revoke execute on function public.purge_analytics() from public, anon, authenticated;
grant execute on function public.purge_analytics() to service_role;

-- ==================== LECTURES DE L'ADMINISTRATEUR ====================

/**
 * Lecteurs et leur parcours, un par (lecteur, livre) : identité, avancement, début,
 * dernière lecture, temps total, jours actifs, chapitres ouverts, dernier pays connu.
 * @param p_user_id - Un seul lecteur (fiche détaillée), ou null pour tous
 */
create or replace function public.admin_reader_list(p_user_id uuid default null)
returns table (
  user_id uuid,
  email text,
  display_name text,
  book_id uuid,
  book_title text,
  chapter_count integer,
  chapter_position integer,
  progress numeric,
  started_at timestamptz,
  last_read_at timestamptz,
  total_seconds bigint,
  active_days bigint,
  chapters_opened bigint,
  country text
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
      rp.user_id,
      u.email::text,
      p.display_name,
      rp.book_id,
      b.title,
      b.chapter_count,
      rp.chapter_position,
      rp.progress,
      rp.created_at,
      rp.updated_at,
      coalesce(act.total_seconds, 0),
      coalesce(act.active_days, 0),
      coalesce(act.chapters_opened, 0),
      act.country
    from public.reading_positions rp
    join auth.users u on u.id = rp.user_id
    join public.books b on b.id = rp.book_id
    left join public.profiles p on p.id = rp.user_id
    left join lateral (
      select
        sum(a.seconds)::bigint as total_seconds,
        count(*)::bigint as active_days,
        (select count(distinct c) from public.reading_activity a2, unnest(a2.chapters) c
          where a2.user_id = rp.user_id and a2.book_id = rp.book_id)::bigint
          as chapters_opened,
        (array_agg(a.country order by a.day desc) filter (where a.country is not null))[1]
          as country
      from public.reading_activity a
      where a.user_id = rp.user_id and a.book_id = rp.book_id
    ) act on true
    where p_user_id is null or rp.user_id = p_user_id
    order by rp.updated_at desc
    limit 1000;
end;
$$;

revoke execute on function public.admin_reader_list(uuid) from public, anon;
grant execute on function public.admin_reader_list(uuid) to authenticated;

/**
 * Synthèse de l'audience depuis une date, calculée en base (le détail peut dépasser la
 * limite de lignes d'une requête) : par jour, pages les plus vues, pays, sites d'origine.
 * @param p_since - Premier jour inclus (UTC)
 */
create or replace function public.admin_audience_summary(p_since date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'days', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select
          s.day,
          coalesce(v.views, 0) as views,
          coalesce(v.entries, 0) as entries,
          coalesce(r.readers, 0) as readers,
          coalesce(r.seconds, 0) as seconds
        from generate_series(
          p_since::timestamp, (now() at time zone 'utc')::date::timestamp, interval '1 day'
        ) g(ts)
        cross join lateral (select g.ts::date as day) s
        left join (
          select day, sum(views) as views, sum(entries) as entries
          from public.site_visits where day >= p_since group by day
        ) v on v.day = s.day
        left join (
          select day, count(distinct user_id) as readers, sum(seconds) as seconds
          from public.reading_activity where day >= p_since group by day
        ) r on r.day = s.day
      ) d
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(p order by p.views desc)
      from (
        select path, sum(views) as views, sum(entries) as entries
        from public.site_visits where day >= p_since
        group by path order by sum(views) desc limit 25
      ) p
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(c order by c.entries desc, c.readers desc)
      from (
        select
          coalesce(v.country, r.country) as country,
          coalesce(v.views, 0) as views,
          coalesce(v.entries, 0) as entries,
          coalesce(r.readers, 0) as readers
        from (
          select country, sum(views) as views, sum(entries) as entries
          from public.site_visits where day >= p_since group by country
        ) v
        full join (
          select coalesce(country, '') as country, count(distinct user_id) as readers
          from public.reading_activity where day >= p_since group by 1
        ) r on r.country = v.country
      ) c
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(f order by f.entries desc)
      from (
        select referrer, sum(entries) as entries
        from public.site_visits where day >= p_since and entries > 0
        group by referrer order by sum(entries) desc limit 50
      ) f
    ), '[]'::jsonb),
    'totals', (
      select jsonb_build_object(
        'views', coalesce(sum(views), 0),
        'entries', coalesce(sum(entries), 0)
      )
      from public.site_visits where day >= p_since
    ) || (
      select jsonb_build_object(
        'readers', count(distinct user_id),
        'seconds', coalesce(sum(seconds), 0)
      )
      from public.reading_activity where day >= p_since
    )
  );
end;
$$;

revoke execute on function public.admin_audience_summary(date) from public, anon;
grant execute on function public.admin_audience_summary(date) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.reading_activity enable row level security;
alter table public.site_visits enable row level security;
alter table public.site_visits_monthly enable row level security;
alter table public.reading_monthly enable row level security;

revoke all on public.reading_activity, public.site_visits, public.site_visits_monthly,
  public.reading_monthly from anon;

-- Écritures : uniquement par les fonctions ci-dessus ; lecture : administrateur seul
create policy "reading_activity_admin_read" on public.reading_activity
  for select to authenticated using ((select public.is_admin()));
create policy "site_visits_admin_read" on public.site_visits
  for select to authenticated using ((select public.is_admin()));
create policy "site_visits_monthly_admin_read" on public.site_visits_monthly
  for select to authenticated using ((select public.is_admin()));
create policy "reading_monthly_admin_read" on public.reading_monthly
  for select to authenticated using ((select public.is_admin()));
