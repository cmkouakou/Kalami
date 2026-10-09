-- =============================================================
--  Fichier    : 20261012120000_pdf.sql
--  Projet     : Kalami
--  Description: PDF filigrané (Sprint 8) : option PDF par livre, droits PDF (accordés par
--               l'administrateur avant les paiements), fichiers générés à durée limitée,
--               seau privé, consommation atomique des téléchargements (3 par achat).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-09
--  Dépendances: 20261006120000_profiles_roles.sql, 20261008120000_content.sql
-- =============================================================

-- ==================== OPTION PDF PAR LIVRE ====================

-- Cochée par l'auteur (ou l'administrateur) : le livre peut être vendu en PDF filigrané
alter table public.books
  add column pdf_enabled boolean not null default false;

-- ==================== DROITS PDF ====================

-- Un achat (ou un octroi) donne un nombre limité de téléchargements, tous liens confondus.
-- La référence imprimée sur chaque page tient lieu de numéro de commande jusqu'au Sprint 5.
create table public.pdf_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  reference text not null unique check (reference ~ '^KAL-[0-9A-F]{8}$'),
  source text not null check (source in ('purchase', 'admin_grant')),
  -- Clé étrangère vers « orders » ajoutée au Sprint 5
  order_id uuid,
  downloads_remaining integer not null default 3 check (downloads_remaining between 0 and 100),
  granted_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul droit PDF actif par lecteur et par livre
create unique index pdf_purchases_active_unique
  on public.pdf_purchases (user_id, book_id) where revoked_at is null;
create index pdf_purchases_book_idx on public.pdf_purchases (book_id);

create trigger pdf_purchases_set_updated_at
  before update on public.pdf_purchases
  for each row execute function public.set_updated_at();

-- ==================== FICHIERS GÉNÉRÉS ====================

-- Chaque fichier est filigrané au nom de l'acheteur ; il expire 24 h après sa création
create table public.pdf_exports (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.pdf_purchases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  version_id uuid references public.book_versions (id) on delete set null,
  storage_path text not null unique,
  size_bytes integer check (size_bytes >= 0),
  download_count integer not null default 0 check (download_count >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index pdf_exports_purchase_idx on public.pdf_exports (purchase_id, created_at desc);
create index pdf_exports_expires_idx on public.pdf_exports (expires_at);

-- ==================== RLS ====================

alter table public.pdf_purchases enable row level security;
alter table public.pdf_exports enable row level security;

-- Le lecteur voit ses droits et ses fichiers ; l'écriture passe par les fonctions et le
-- serveur (clé secrète), jamais par le client
create policy "pdf_purchases_select_own_or_admin" on public.pdf_purchases
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.pdf_purchases from anon, authenticated;

create policy "pdf_exports_select_own" on public.pdf_exports
  for select to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update, delete on public.pdf_exports from anon, authenticated;

-- ==================== SEAU PRIVÉ ====================

-- Aucune politique client : seul le serveur (clé secrète) écrit, lit et signe les liens
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pdf-exports', 'pdf-exports', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Accorde l'option PDF au compte portant ce courriel. L'option suffit pour lire : un droit
-- de lecture est créé s'il n'y en a pas d'actif. Renvoie l'identifiant du droit PDF.
create or replace function public.admin_grant_pdf(
  p_book_id uuid,
  p_email text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_id uuid;
  v_reference text;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if not exists (select 1 from public.books where id = p_book_id and pdf_enabled) then
    raise exception 'pdf_disabled' using errcode = 'P0001';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'compte introuvable' using errcode = 'P0002';
  end if;

  v_reference := 'KAL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.pdf_purchases (user_id, book_id, reference, source, granted_by, note)
  values (v_user_id, p_book_id, v_reference, 'admin_grant', auth.uid(),
    nullif(trim(p_note), ''))
  returning id into v_id;

  if not exists (
    select 1 from public.entitlements
    where user_id = v_user_id and book_id = p_book_id and revoked_at is null
  ) then
    insert into public.entitlements (user_id, book_id, source, granted_by, note)
    values (v_user_id, p_book_id, 'admin_grant', auth.uid(), 'Option PDF ' || v_reference);
  end if;

  perform public.write_audit(
    'pdf.granted', 'pdf_purchase', v_id::text,
    jsonb_build_object('book_id', p_book_id, 'user_id', v_user_id, 'reference', v_reference)
  );
  return v_id;
end;
$$;

-- Retire un droit PDF (conservé pour l'historique) ; le droit de lecture n'est pas touché
create or replace function public.admin_revoke_pdf(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  update public.pdf_purchases set revoked_at = now()
  where id = p_purchase_id and revoked_at is null;
  if not found then
    raise exception 'droit introuvable' using errcode = 'P0002';
  end if;
  perform public.write_audit('pdf.revoked', 'pdf_purchase', p_purchase_id::text);
end;
$$;

-- Redonne 3 téléchargements (lecteur ayant perdu son fichier, par exemple)
create or replace function public.admin_reset_pdf_downloads(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  update public.pdf_purchases set downloads_remaining = 3
  where id = p_purchase_id and revoked_at is null;
  if not found then
    raise exception 'droit introuvable' using errcode = 'P0002';
  end if;
  perform public.write_audit('pdf.downloads_reset', 'pdf_purchase', p_purchase_id::text);
end;
$$;

-- Droits PDF d'un livre avec le courriel du lecteur (auth.users n'est pas lisible)
create or replace function public.admin_list_pdf_purchases(p_book_id uuid)
returns table (
  id uuid,
  email text,
  reference text,
  source text,
  downloads_remaining integer,
  note text,
  created_at timestamptz,
  revoked_at timestamptz
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
    select p.id, u.email::text, p.reference, p.source, p.downloads_remaining, p.note,
      p.created_at, p.revoked_at
    from public.pdf_purchases p
    join auth.users u on u.id = p.user_id
    where p.book_id = p_book_id
    order by p.revoked_at is not null, p.created_at desc;
end;
$$;

revoke execute on function public.admin_grant_pdf(uuid, text, text) from public, anon;
grant execute on function public.admin_grant_pdf(uuid, text, text) to authenticated;
revoke execute on function public.admin_revoke_pdf(uuid) from public, anon;
grant execute on function public.admin_revoke_pdf(uuid) to authenticated;
revoke execute on function public.admin_reset_pdf_downloads(uuid) from public, anon;
grant execute on function public.admin_reset_pdf_downloads(uuid) to authenticated;
revoke execute on function public.admin_list_pdf_purchases(uuid) from public, anon;
grant execute on function public.admin_list_pdf_purchases(uuid) to authenticated;

-- ==================== FONCTION : TÉLÉCHARGEMENT ====================

-- Consomme un téléchargement de façon atomique et renvoie le chemin du fichier.
-- Appelée par le serveur (clé secrète) après authentification du lecteur.
-- Codes : not_found, expired, revoked, exhausted.
create or replace function public.consume_pdf_download(p_export_id uuid, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_export public.pdf_exports%rowtype;
  v_purchase public.pdf_purchases%rowtype;
begin
  select * into v_export from public.pdf_exports
  where id = p_export_id and user_id = p_user_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_export.expires_at <= now() then
    raise exception 'expired' using errcode = 'P0001';
  end if;

  select * into v_purchase from public.pdf_purchases where id = v_export.purchase_id for update;
  if v_purchase.revoked_at is not null then
    raise exception 'revoked' using errcode = 'P0001';
  end if;
  if v_purchase.downloads_remaining <= 0 then
    raise exception 'exhausted' using errcode = 'P0001';
  end if;

  update public.pdf_purchases set downloads_remaining = downloads_remaining - 1
  where id = v_purchase.id;
  update public.pdf_exports set download_count = download_count + 1 where id = p_export_id;
  return v_export.storage_path;
end;
$$;

revoke execute on function public.consume_pdf_download(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.consume_pdf_download(uuid, uuid) to service_role;
