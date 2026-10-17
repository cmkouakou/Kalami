-- =============================================================
--  Fichier    : 20261101120000_authors_switch.sql
--  Projet     : Kalami
--  Description: Interrupteur « Ouvrir le dépôt aux auteurs externes » (v0.9.2). Fermé par
--               défaut : seul l'administrateur publie ses propres livres. Fermé, il bloque
--               l'inscription d'un auteur, la création d'un livre et sa soumission (sauf pour
--               l'administrateur) ; les fiches et livres existants restent consultables.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-16
--  Dépendances: 20261011120000_author_space.sql, 20261007120000_catalog.sql (write_audit)
-- =============================================================

-- ==================== TABLE : RÉGLAGES DE LA PLATEFORME ====================

-- Ligne unique (id = true) ; modifiable seulement par la fonction admin_set_authors_open
create table public.platform_settings (
  id boolean primary key default true check (id),
  authors_open boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.platform_settings is
  'Réglages globaux de la plateforme (ligne unique). Écriture par fonction admin uniquement.';

insert into public.platform_settings (id) values (true);

alter table public.platform_settings enable row level security;

-- Lecture publique : la page d'inscription affiche l'état du dépôt
create policy "platform_settings_select" on public.platform_settings
  for select to anon, authenticated
  using (true);

-- ==================== FONCTIONS : LECTURE ET MODIFICATION ====================

-- Dépôt ouvert aux auteurs externes ?
create or replace function public.authors_open()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.authors_open from public.platform_settings s where s.id), false);
$$;

grant execute on function public.authors_open() to anon, authenticated;

-- Le compte connecté peut-il s'inscrire, créer et soumettre ? (dépôt ouvert ou administrateur)
create or replace function public.author_deposit_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.authors_open() or public.is_admin();
$$;

grant execute on function public.author_deposit_allowed() to anon, authenticated;

-- Ouvre ou ferme le dépôt (administrateur en aal2), avec trace dans le journal d'audit
create or replace function public.admin_set_authors_open(p_open boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.platform_settings
  set authors_open = coalesce(p_open, false), updated_at = now(), updated_by = auth.uid()
  where id;
  perform public.write_audit(
    case when p_open then 'platform.authors.open' else 'platform.authors.close' end,
    'platform_settings', 'authors_open', '{}'::jsonb
  );
end;
$$;

revoke execute on function public.admin_set_authors_open(boolean) from public, anon;
grant execute on function public.admin_set_authors_open(boolean) to authenticated;

-- ==================== FONCTIONS : INSCRIPTION ET SOUMISSION ====================

-- Inscription : corps de 20261011120000 + refus quand le dépôt est fermé
create or replace function public.author_register(
  p_display_name text,
  p_slug text,
  p_bio text,
  p_contract_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author_id uuid;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if not public.authors_open() and not public.is_admin() then
    raise exception 'authors_closed' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.authors where user_id = auth.uid()) then
    raise exception 'already_author' using errcode = 'P0001';
  end if;
  if p_contract_id is null or p_contract_id is distinct from public.latest_contract_id() then
    raise exception 'contract_outdated' using errcode = 'P0001';
  end if;

  insert into public.authors (user_id, slug, display_name, bio)
  values (auth.uid(), p_slug, p_display_name, nullif(btrim(p_bio), ''))
  returning id into v_author_id;

  insert into public.author_contract_acceptances (author_id, contract_id, user_id)
  values (v_author_id, p_contract_id, auth.uid());
  return v_author_id;
end;
$$;

-- Soumission : corps de 20261011120000 + refus quand le dépôt est fermé
create or replace function public.author_submit_book(p_book_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book public.books%rowtype;
  v_version_id uuid;
  v_submission_id uuid;
begin
  if not public.is_book_author(p_book_id) then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if not public.authors_open() and not public.is_admin() then
    raise exception 'authors_closed' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.author_contract_acceptances
    where author_id = public.current_author_id() and contract_id = public.latest_contract_id()
  ) then
    raise exception 'contract_required' using errcode = 'P0001';
  end if;

  select * into v_book from public.books where id = p_book_id for update;
  if v_book.status = 'submitted' or exists (
    select 1 from public.book_submissions where book_id = p_book_id and status = 'submitted'
  ) then
    raise exception 'already_submitted' using errcode = 'P0001';
  end if;

  if v_book.status = 'published' then
    v_version_id := v_book.pending_version_id;
    if v_version_id is null then
      raise exception 'missing_version' using errcode = 'P0001';
    end if;
  else
    v_version_id := coalesce(v_book.pending_version_id, v_book.current_version_id);
    if v_version_id is null then
      raise exception 'missing_version' using errcode = 'P0001';
    end if;
    if coalesce(btrim(v_book.summary), '') = '' or v_book.category_id is null
      or not exists (select 1 from public.book_prices where book_id = p_book_id) then
      raise exception 'incomplete' using errcode = 'P0001';
    end if;
    update public.books set status = 'submitted', rejection_reason = null
    where id = p_book_id;
  end if;

  insert into public.book_submissions (book_id, version_id, submitted_by)
  values (p_book_id, v_version_id, auth.uid())
  returning id into v_submission_id;
  return v_submission_id;
end;
$$;

-- ==================== POLITIQUE : CRÉATION D'UN LIVRE PAR UN AUTEUR ====================

drop policy "books_author_insert" on public.books;
create policy "books_author_insert" on public.books
  for insert to authenticated
  with check (
    author_id = (select public.current_author_id()) and status = 'draft'
    and ((select public.authors_open()) or (select public.is_admin()))
  );
