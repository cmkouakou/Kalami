-- =============================================================
--  Fichier    : 20261011120000_author_space.sql
--  Projet     : Kalami
--  Description: Espace auteur (Sprint 9) : contrat versionné et acceptations, inscription
--               libre, coordonnées de versement, écriture des livres par leur auteur
--               (brouillons et refusés), versions en attente de validation, soumissions,
--               validation par l'administrateur, statistiques auteur.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-09
--  Dépendances: 20261006120000_profiles_roles.sql, 20261007120000_catalog.sql,
--               20261008120000_content.sql, 20261010120000_annotations.sql
-- =============================================================

-- ==================== OUTILS ====================

-- Convertit un segment de chemin en uuid, ou null s'il n'en est pas un (politiques de stockage)
create or replace function public.safe_uuid(p_value text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then p_value::uuid
  end;
$$;

-- Fiche auteur de l'utilisateur courant (null s'il n'est pas auteur)
create or replace function public.current_author_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.authors where user_id = auth.uid();
$$;

revoke execute on function public.current_author_id() from public, anon;
grant execute on function public.current_author_id() to authenticated;

-- Vrai si l'utilisateur courant est l'auteur du livre et peut encore modifier sa fiche
create or replace function public.author_can_edit_book(p_book_id uuid)
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
    where b.id = p_book_id
      and a.user_id = auth.uid()
      and b.status in ('draft', 'rejected')
  );
$$;

revoke execute on function public.author_can_edit_book(uuid) from public, anon;
grant execute on function public.author_can_edit_book(uuid) to authenticated;

-- ==================== CONTRAT AUTEUR ====================

-- Chaque modification du contrat crée une nouvelle version ; seule la dernière s'accepte
create table public.author_contracts (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique check (version > 0),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 100000),
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now()
);

create table public.author_contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors (id) on delete cascade,
  contract_id uuid not null references public.author_contracts (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  accepted_at timestamptz not null default now(),
  unique (author_id, contract_id)
);

-- Dernière version publiée du contrat (null s'il n'y en a pas encore)
create or replace function public.latest_contract_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.author_contracts order by version desc limit 1;
$$;

revoke execute on function public.latest_contract_id() from public, anon;
grant execute on function public.latest_contract_id() to authenticated;

-- ==================== COORDONNÉES DE VERSEMENT ====================

-- Virement bancaire ou Mobile Money ; visibles par l'auteur et l'administrateur seulement
create table public.author_payout_details (
  author_id uuid primary key references public.authors (id) on delete cascade,
  method text not null check (method in ('bank', 'mobile_money')),
  account_holder text not null check (char_length(account_holder) between 1 and 120),
  bank_name text check (char_length(bank_name) <= 120),
  account_number text check (char_length(account_number) <= 64),
  swift text check (char_length(swift) <= 11),
  mobile_operator text check (mobile_operator in ('orange', 'mtn', 'moov', 'wave')),
  mobile_number text check (char_length(mobile_number) <= 20),
  updated_at timestamptz not null default now(),
  -- Les champs requis dépendent du mode choisi
  constraint author_payout_bank_fields
    check (method <> 'bank' or (bank_name is not null and account_number is not null)),
  constraint author_payout_mobile_fields
    check (method <> 'mobile_money' or (mobile_operator is not null and mobile_number is not null))
);

create trigger author_payout_details_set_updated_at
  before update on public.author_payout_details
  for each row execute function public.set_updated_at();

-- ==================== VERSIONS EN ATTENTE ET SOUMISSIONS ====================

-- Version déposée par l'auteur, visible du public seulement après validation
alter table public.books
  add column pending_version_id uuid references public.book_versions (id) on delete set null;

-- Demande de validation : première publication ou nouvelle version d'un livre publié
create table public.book_submissions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  version_id uuid references public.book_versions (id) on delete set null,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected')),
  reason text check (char_length(reason) <= 2000),
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  constraint book_submissions_reason_required
    check (status <> 'rejected' or coalesce(char_length(reason), 0) > 0)
);

-- Une seule demande ouverte par livre
create unique index book_submissions_open_idx
  on public.book_submissions (book_id) where status = 'submitted';
create index book_submissions_status_idx on public.book_submissions (status, submitted_at);

-- ==================== GARDE-FOUS : ÉCRITURE PAR L'AUTEUR ====================

-- L'administrateur partage le rôle « authenticated » : les droits par colonne ne suffisent
-- pas. Un auteur (non administrateur) ne touche ni au statut, ni à la mise en avant, ni aux
-- versions, ni à l'extrait. Les fonctions SECURITY DEFINER (rôle propriétaire) passent.
create or replace function public.guard_author_book_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.is_featured or new.current_version_id is not null
      or new.pending_version_id is not null or new.published_at is not null
      or new.rejection_reason is not null then
      raise exception 'champ réservé à l''administration' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
    or new.is_featured is distinct from old.is_featured
    or new.author_id is distinct from old.author_id
    or new.slug is distinct from old.slug
    or new.current_version_id is distinct from old.current_version_id
    or new.pending_version_id is distinct from old.pending_version_id
    or new.chapter_count is distinct from old.chapter_count
    or new.published_at is distinct from old.published_at
    or new.rejection_reason is distinct from old.rejection_reason
    or new.preview_chapters is distinct from old.preview_chapters
    or new.preview_cut_block is distinct from old.preview_cut_block then
    raise exception 'champ réservé à l''administration' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger books_guard_author_write
  before insert or update on public.books
  for each row execute function public.guard_author_book_write();

-- Fiche auteur : ni le compte relié ni l'identifiant d'URL ne changent côté auteur
create or replace function public.guard_author_profile_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or public.is_admin() then
    return new;
  end if;
  if new.user_id is distinct from old.user_id or new.slug is distinct from old.slug then
    raise exception 'champ réservé à l''administration' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger authors_guard_author_write
  before update on public.authors
  for each row execute function public.guard_author_profile_write();

-- ==================== FONCTIONS : INSCRIPTION ET CONTRAT ====================

-- Inscription libre : crée la fiche auteur et enregistre l'acceptation du contrat en cours
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

revoke execute on function public.author_register(text, text, text, uuid) from public, anon;
grant execute on function public.author_register(text, text, text, uuid) to authenticated;

-- Acceptation d'une nouvelle version du contrat (la dernière uniquement)
create or replace function public.author_accept_contract(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author_id uuid := public.current_author_id();
begin
  if v_author_id is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_contract_id is null or p_contract_id is distinct from public.latest_contract_id() then
    raise exception 'contract_outdated' using errcode = 'P0001';
  end if;
  insert into public.author_contract_acceptances (author_id, contract_id, user_id)
  values (v_author_id, p_contract_id, auth.uid())
  on conflict (author_id, contract_id) do nothing;
end;
$$;

revoke execute on function public.author_accept_contract(uuid) from public, anon;
grant execute on function public.author_accept_contract(uuid) to authenticated;

-- Publication d'une nouvelle version du contrat par l'administrateur
create or replace function public.admin_publish_contract(p_title text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_version integer;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  -- Verrou de table : deux publications simultanées ne prennent pas le même numéro
  lock table public.author_contracts in share row exclusive mode;
  select coalesce(max(version), 0) + 1 into v_version from public.author_contracts;

  insert into public.author_contracts (version, title, body, created_by)
  values (v_version, p_title, p_body, auth.uid())
  returning id into v_id;

  perform public.write_audit(
    'contract.published', 'author_contract', v_id::text,
    jsonb_build_object('version', v_version)
  );
  return v_id;
end;
$$;

revoke execute on function public.admin_publish_contract(text, text) from public, anon;
grant execute on function public.admin_publish_contract(text, text) to authenticated;

-- ==================== FONCTIONS : VERSION DÉPOSÉE PAR L'AUTEUR ====================

-- Enregistre une conversion comme version en attente ; remplace la précédente version en
-- attente (jamais validée). Interdit pendant qu'une demande de validation est ouverte.
create or replace function public.author_save_book_version(
  p_book_id uuid,
  p_source_format text,
  p_source_path text,
  p_chapters jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book public.books%rowtype;
  v_version_id uuid;
  v_number integer;
  v_count integer;
  v_words integer;
begin
  if not public.is_book_author(p_book_id) then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if jsonb_typeof(p_chapters) <> 'array' or jsonb_array_length(p_chapters) = 0 then
    raise exception 'aucun chapitre' using errcode = '22023';
  end if;
  if p_source_path not like 'livres/' || p_book_id::text || '/%' then
    raise exception 'chemin invalide' using errcode = '22023';
  end if;

  select * into v_book from public.books where id = p_book_id for update;
  if v_book.status = 'submitted'
    or exists (
      select 1 from public.book_submissions
      where book_id = p_book_id and status = 'submitted'
    ) then
    raise exception 'submission_open' using errcode = 'P0001';
  end if;

  select coalesce(max(version_number), 0) + 1 into v_number
  from public.book_versions where book_id = p_book_id;

  v_count := jsonb_array_length(p_chapters);
  select coalesce(sum((c ->> 'word_count')::integer), 0) into v_words
  from jsonb_array_elements(p_chapters) c;

  insert into public.book_versions (
    book_id, version_number, source_format, source_path, chapter_count, word_count, created_by
  )
  values (p_book_id, v_number, p_source_format, p_source_path, v_count, v_words, auth.uid())
  returning id into v_version_id;

  insert into public.chapters (version_id, position, title, blocks, word_count)
  select
    v_version_id,
    c.ordinality::integer,
    c.value ->> 'title',
    array(select jsonb_array_elements_text(c.value -> 'blocks')),
    coalesce((c.value ->> 'word_count')::integer, 0)
  from jsonb_array_elements(p_chapters) with ordinality c;

  update public.books set pending_version_id = v_version_id where id = p_book_id;

  -- L'ancienne version en attente n'a jamais été validée : ses chapitres disparaissent
  if v_book.pending_version_id is not null
    and v_book.pending_version_id is distinct from v_book.current_version_id then
    delete from public.book_versions where id = v_book.pending_version_id;
  end if;
  return v_version_id;
end;
$$;

revoke execute on function public.author_save_book_version(uuid, text, text, jsonb)
  from public, anon;
grant execute on function public.author_save_book_version(uuid, text, text, jsonb)
  to authenticated;

-- ==================== FONCTIONS : SOUMISSION ET VALIDATION ====================

-- Demande de validation. Livre brouillon ou refusé : fiche complète exigée, le livre passe
-- « soumis ». Livre publié : une nouvelle version en attente est exigée, il reste publié.
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

revoke execute on function public.author_submit_book(uuid) from public, anon;
grant execute on function public.author_submit_book(uuid) to authenticated;

-- Décision de l'administrateur. Validation : la version devient courante et le livre est
-- publié. Refus motivé : un livre non publié passe « refusé » ; un livre publié le reste.
create or replace function public.admin_review_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.book_submissions%rowtype;
  v_book public.books%rowtype;
  v_chapters integer;
  v_reason text := nullif(btrim(p_reason), '');
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  select * into v_sub from public.book_submissions
  where id = p_submission_id and status = 'submitted' for update;
  if not found then
    raise exception 'submission_closed' using errcode = 'P0001';
  end if;
  select * into v_book from public.books where id = v_sub.book_id for update;

  if p_approve then
    select chapter_count into v_chapters from public.book_versions where id = v_sub.version_id;
    if v_chapters is null then
      raise exception 'missing_version' using errcode = 'P0001';
    end if;
    update public.books
    set current_version_id = v_sub.version_id,
        chapter_count = v_chapters,
        pending_version_id = case
          when pending_version_id = v_sub.version_id then null else pending_version_id end,
        status = 'published',
        rejection_reason = null
    where id = v_book.id;
    update public.book_submissions
    set status = 'approved', reason = v_reason, reviewed_by = auth.uid(), reviewed_at = now()
    where id = v_sub.id;
  else
    if v_reason is null then
      raise exception 'reason_required' using errcode = 'P0001';
    end if;
    if v_book.status <> 'published' then
      update public.books set status = 'rejected', rejection_reason = v_reason
      where id = v_book.id;
    end if;
    update public.book_submissions
    set status = 'rejected', reason = v_reason, reviewed_by = auth.uid(), reviewed_at = now()
    where id = v_sub.id;
  end if;

  perform public.write_audit(
    case when p_approve then 'book.submission_approved' else 'book.submission_rejected' end,
    'book', v_book.id::text,
    jsonb_build_object('submission_id', v_sub.id, 'version_id', v_sub.version_id,
      'reason', v_reason)
  );
end;
$$;

revoke execute on function public.admin_review_submission(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_submission(uuid, boolean, text) to authenticated;

-- ==================== FONCTIONS : APERÇU ET STATISTIQUES ====================

-- Sommaire de la version à valider (sinon la courante) : auteur du livre ou administrateur
create or replace function public.get_book_preview_toc(p_book_id uuid)
returns table (
  chapter_position integer,
  title text,
  word_count integer,
  block_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.position, c.title, c.word_count, coalesce(cardinality(c.blocks), 0)
  from public.books b
  join public.chapters c on c.version_id = coalesce(b.pending_version_id, b.current_version_id)
  where b.id = p_book_id and (public.is_admin() or public.is_book_author(b.id))
  order by c.position;
$$;

revoke execute on function public.get_book_preview_toc(uuid) from public, anon;
grant execute on function public.get_book_preview_toc(uuid) to authenticated;

-- Statistiques par livre de l'auteur courant : lecteurs actifs et surlignages
create or replace function public.author_book_stats()
returns table (book_id uuid, readers bigint, highlights bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    (select count(*) from public.entitlements e
      where e.book_id = b.id and e.revoked_at is null),
    (select count(*) from public.highlights h where h.book_id = b.id)
  from public.books b
  where b.author_id = public.current_author_id();
$$;

revoke execute on function public.author_book_stats() from public, anon;
grant execute on function public.author_book_stats() to authenticated;

-- Passages les plus surlignés (au moins 3 lecteurs distincts, anonymat préservé)
create or replace function public.author_top_passages(p_book_id uuid, p_limit integer default 5)
returns table (chapter_position integer, start_block integer, readers bigint, quote text)
language sql
stable
security definer
set search_path = ''
as $$
  select h.chapter_position, h.start_block, count(distinct h.user_id),
    mode() within group (order by h.quote)
  from public.highlights h
  where h.book_id = p_book_id and (public.is_book_author(p_book_id) or public.is_admin())
  group by h.chapter_position, h.start_block
  having count(distinct h.user_id) >= 3
  order by count(distinct h.user_id) desc, h.chapter_position, h.start_block
  limit least(greatest(coalesce(p_limit, 5), 1), 20);
$$;

revoke execute on function public.author_top_passages(uuid, integer) from public, anon;
grant execute on function public.author_top_passages(uuid, integer) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.author_contracts enable row level security;
alter table public.author_contract_acceptances enable row level security;
alter table public.author_payout_details enable row level security;
alter table public.book_submissions enable row level security;

-- Contrat : lisible par tout utilisateur connecté ; écriture par fonction uniquement
create policy "author_contracts_select_authenticated" on public.author_contracts
  for select to authenticated using (true);
revoke insert, update, delete on public.author_contracts from anon, authenticated;

create policy "author_contract_acceptances_select_own_or_admin"
  on public.author_contract_acceptances
  for select to authenticated
  using (author_id = (select public.current_author_id()) or (select public.is_admin()));
revoke insert, update, delete on public.author_contract_acceptances from anon, authenticated;

-- Coordonnées de versement : l'auteur gère les siennes, l'administrateur les consulte
create policy "author_payout_details_own" on public.author_payout_details
  for all to authenticated
  using (author_id = (select public.current_author_id()))
  with check (author_id = (select public.current_author_id()));
create policy "author_payout_details_select_admin" on public.author_payout_details
  for select to authenticated using ((select public.is_admin()));

-- Soumissions : lecture par l'auteur du livre et l'administrateur ; écriture par fonctions
create policy "book_submissions_select_author_or_admin" on public.book_submissions
  for select to authenticated
  using ((select public.is_admin()) or public.is_book_author(book_id));
revoke insert, update, delete on public.book_submissions from anon, authenticated;

-- Fiche auteur : modifiable par son titulaire (garde-fou sur user_id et slug)
create policy "authors_update_own" on public.authors
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Livres : lecture directe par la fiche auteur (INSERT … RETURNING ne voit pas encore la
-- ligne via is_book_author), création en brouillon, modification si brouillon ou refusé
create policy "books_select_own_author" on public.books
  for select to authenticated
  using (author_id = (select public.current_author_id()));
create policy "books_author_insert" on public.books
  for insert to authenticated
  with check (author_id = (select public.current_author_id()) and status = 'draft');
create policy "books_author_update" on public.books
  for update to authenticated
  using (public.author_can_edit_book(id))
  with check (author_id = (select public.current_author_id())
    and status in ('draft', 'rejected'));

-- Prix : mêmes conditions que la fiche du livre
create policy "book_prices_author_write" on public.book_prices
  for all to authenticated
  using (public.author_can_edit_book(book_id))
  with check (public.author_can_edit_book(book_id));

-- Versions : l'auteur voit celles de ses livres
create policy "book_versions_select_author" on public.book_versions
  for select to authenticated using (public.is_book_author(book_id));

-- ==================== STOCKAGE : DÉPÔTS DE L'AUTEUR ====================

-- Couvertures (livres modifiables) et photo de sa propre fiche
create policy "covers_author_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'covers' and (
      ((storage.foldername(name))[1] = 'livres'
        and public.author_can_edit_book(public.safe_uuid((storage.foldername(name))[2])))
      or ((storage.foldername(name))[1] = 'auteurs'
        and public.safe_uuid((storage.foldername(name))[2])
          = (select public.current_author_id()))
    )
  );
create policy "covers_author_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'covers' and (
      ((storage.foldername(name))[1] = 'livres'
        and public.is_book_author(public.safe_uuid((storage.foldername(name))[2])))
      or ((storage.foldername(name))[1] = 'auteurs'
        and public.safe_uuid((storage.foldername(name))[2])
          = (select public.current_author_id()))
    )
  );
create policy "covers_author_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'covers' and (
      ((storage.foldername(name))[1] = 'livres'
        and public.author_can_edit_book(public.safe_uuid((storage.foldername(name))[2])))
      or ((storage.foldername(name))[1] = 'auteurs'
        and public.safe_uuid((storage.foldername(name))[2])
          = (select public.current_author_id()))
    )
  );

-- Manuscrits de ses livres (y compris une nouvelle version d'un livre publié)
create policy "manuscripts_author_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'manuscripts' and (storage.foldername(name))[1] = 'livres'
    and public.is_book_author(public.safe_uuid((storage.foldername(name))[2]))
  );
create policy "manuscripts_author_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'manuscripts' and (storage.foldername(name))[1] = 'livres'
    and public.is_book_author(public.safe_uuid((storage.foldername(name))[2]))
  );
create policy "manuscripts_author_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'manuscripts' and (storage.foldername(name))[1] = 'livres'
    and public.is_book_author(public.safe_uuid((storage.foldername(name))[2]))
  );
