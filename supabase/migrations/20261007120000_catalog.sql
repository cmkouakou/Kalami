-- =============================================================
--  Fichier    : 20261007120000_catalog.sql
--  Projet     : Kalami
--  Description: Sprint 2 — catalogue : catégories, auteurs, livres, prix par devise,
--               recherche plein texte (français, sans accents), couvertures (Storage),
--               écriture du journal d'audit par les administrateurs, RLS.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-07
-- =============================================================

-- ==================== RECHERCHE : FRANÇAIS SANS ACCENTS ====================

create extension if not exists unaccent with schema extensions;

-- Configuration plein texte : racinisation française + suppression des accents
create text search configuration public.french_unaccent (copy = pg_catalog.french);
alter text search configuration public.french_unaccent
  alter mapping for hword, hword_part, word with extensions.unaccent, french_stem;

-- ==================== CATÉGORIES ====================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ==================== AUTEURS ====================

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  -- Compte relié (facultatif) : l'espace auteur du Sprint 9 l'utilisera
  user_id uuid unique references auth.users (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 1 and 120),
  bio text check (char_length(bio) <= 5000),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger authors_set_updated_at
  before update on public.authors
  for each row execute function public.set_updated_at();

-- ==================== LIVRES ====================

create table public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  subtitle text check (char_length(subtitle) <= 200),
  edition text check (char_length(edition) <= 60),
  summary text check (char_length(summary) <= 10000),
  keywords text check (char_length(keywords) <= 500),
  language text not null default 'fr' check (language in ('fr', 'en')),
  author_id uuid not null references public.authors (id) on delete restrict,
  category_id uuid references public.categories (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'published', 'rejected')),
  rejection_reason text,
  is_featured boolean not null default false,
  page_count integer check (page_count > 0),
  chapter_count integer check (chapter_count > 0),
  publication_year integer check (publication_year between 1900 and 2200),
  cover_path text,
  published_at timestamptz,
  search tsvector generated always as (
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(keywords, '')), 'B') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(summary, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un refus doit toujours être motivé (cahier §3.9)
  constraint books_rejection_reason_required
    check (status <> 'rejected' or coalesce(char_length(rejection_reason), 0) > 0)
);

create index books_status_published_idx on public.books (status, published_at desc);
create index books_category_idx on public.books (category_id);
create index books_author_idx on public.books (author_id);
create index books_search_idx on public.books using gin (search);

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- Date de publication posée automatiquement au premier passage à « published »
create or replace function public.set_book_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger books_set_published_at
  before insert or update of status on public.books
  for each row execute function public.set_book_published_at();

-- ==================== PRIX PAR DEVISE ====================

-- Montant en unité mineure (centimes ; le XOF n'a pas de décimales)
create table public.book_prices (
  book_id uuid not null references public.books (id) on delete cascade,
  currency text not null check (currency in ('XOF', 'EUR', 'CAD')),
  amount_minor integer not null check (amount_minor > 0),
  updated_at timestamptz not null default now(),
  primary key (book_id, currency)
);

create trigger book_prices_set_updated_at
  before update on public.book_prices
  for each row execute function public.set_updated_at();

-- ==================== RÈGLES D'ACCÈS (fonctions) ====================

-- Vrai si l'utilisateur courant est l'auteur du livre (espace auteur, Sprint 9)
create or replace function public.is_book_author(p_book_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.books b
    join public.authors a on a.id = b.author_id
    where b.id = p_book_id and a.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_book_author(uuid) from public, anon;
grant execute on function public.is_book_author(uuid) to authenticated;

-- ==================== RECHERCHE ====================

-- Recherche publique : titre, mots-clés, résumé, nom d'auteur ; filtres catégorie,
-- langue et prix maximal dans une devise. Ne renvoie que des livres publiés.
create or replace function public.search_books(
  p_query text default null,
  p_category text default null,
  p_language text default null,
  p_currency text default null,
  p_max_price integer default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns setof public.books
language sql
stable
set search_path = ''
as $$
  with q as (
    select
      nullif(trim(p_query), '') as raw,
      case when nullif(trim(p_query), '') is null then null
        else websearch_to_tsquery('public.french_unaccent'::regconfig, p_query) end as ts,
      '%' || replace(replace(extensions.unaccent(lower(coalesce(trim(p_query), ''))),
        '%', '\%'), '_', '\_') || '%' as pattern
  )
  select b.*
  from public.books b
  cross join q
  left join public.authors a on a.id = b.author_id
  left join public.categories c on c.id = b.category_id
  where b.status = 'published'
    and (
      q.raw is null
      or b.search @@ q.ts
      or extensions.unaccent(lower(b.title)) like q.pattern
      or extensions.unaccent(lower(a.display_name)) like q.pattern
    )
    and (p_category is null or c.slug = p_category)
    and (p_language is null or b.language = p_language)
    and (
      p_max_price is null or p_currency is null
      or exists (
        select 1 from public.book_prices p
        where p.book_id = b.id and p.currency = p_currency and p.amount_minor <= p_max_price
      )
    )
  order by
    case when q.ts is null then 0 else ts_rank(b.search, q.ts) end desc,
    b.published_at desc nulls last
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.search_books(text, text, text, text, integer, integer, integer)
  to anon, authenticated;

-- ==================== JOURNAL D'AUDIT (écriture admin) ====================

-- Inscrit une action dans le journal ; réservé aux administrateurs (aal2)
create or replace function public.write_audit(
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_details jsonb default '{}'::jsonb
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
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
end;
$$;

revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon;
grant execute on function public.write_audit(text, text, text, jsonb) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.books enable row level security;
alter table public.book_prices enable row level security;

-- Catégories et auteurs : lecture publique ; écriture administrateur
create policy "categories_select_all" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "authors_select_all" on public.authors
  for select to anon, authenticated using (true);
create policy "authors_admin_write" on public.authors
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Livres : public = publiés seulement ; administrateur et auteur du livre voient tout
create policy "books_select_published" on public.books
  for select to anon, authenticated using (status = 'published');
create policy "books_select_admin_or_author" on public.books
  for select to authenticated
  using ((select public.is_admin()) or public.is_book_author(id));
create policy "books_admin_write" on public.books
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Prix : visibles si le livre l'est ; écriture administrateur
create policy "book_prices_select_visible" on public.book_prices
  for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = book_id));
create policy "book_prices_admin_write" on public.book_prices
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ==================== STOCKAGE : COUVERTURES ET PHOTOS ====================

-- Seau public en lecture (images du catalogue) ; les fichiers des livres resteront privés
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "covers_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and (select public.is_admin()));
create policy "covers_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and (select public.is_admin()));
create policy "covers_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and (select public.is_admin()));

-- ==================== DONNÉES INITIALES ====================

insert into public.categories (slug, name, position) values
  ('gestion-et-strategie', 'Gestion et stratégie', 1),
  ('finance', 'Finance', 2),
  ('informatique', 'Informatique', 3),
  ('developpement-personnel', 'Développement personnel', 4);

insert into public.authors (slug, display_name)
values ('claude-marcel-kouakou', 'Claude Marcel Kouakou');

-- Premier ouvrage (brouillon, à compléter et publier depuis /admin/livres)
insert into public.books (slug, title, subtitle, edition, language, author_id, category_id)
select
  'la-strategie-d-entreprise',
  'La stratégie d''entreprise',
  'Analyse et mise en œuvre par l''exemple',
  '2e édition',
  'fr',
  a.id,
  c.id
from public.authors a, public.categories c
where a.slug = 'claude-marcel-kouakou' and c.slug = 'gestion-et-strategie';
