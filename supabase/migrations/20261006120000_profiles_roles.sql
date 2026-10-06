-- =============================================================
--  Fichier    : 20261006120000_profiles_roles.sql
--  Projet     : Kalami
--  Description: Sprint 1 — profils utilisateurs, rôle administrateur, journal d'audit, RLS.
--               Le statut « auteur » sera porté par la table authors (Sprint 2/9) : un même
--               compte peut ainsi être lecteur et auteur.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-06
-- =============================================================

-- ==================== FONCTIONS UTILITAIRES ====================

-- Met à jour automatiquement la colonne updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ==================== PROFILS ====================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  preferred_currency text check (preferred_currency in ('XOF', 'EUR', 'CAD')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil applicatif de chaque compte (1-1 avec auth.users).';
comment on column public.profiles.is_admin is
  'Modifiable uniquement par la clé secrète (service) ; jamais par l''utilisateur.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==================== RÔLE ADMINISTRATEUR ====================

-- Vrai si l'utilisateur courant est administrateur ET authentifié en deux étapes (aal2)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  ) and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ==================== JOURNAL D'AUDIT ====================

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Actions sensibles (validation de paiement, changement de rôle…). Écriture serveur uniquement.';

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Profils : chacun lit son profil ; un administrateur (aal2) lit tous les profils
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

-- Profils : chacun modifie son propre profil (colonnes limitées par les privilèges ci-dessous)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Privilèges de colonnes : is_admin, id et dates ne sont jamais modifiables par le client
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, locale, preferred_currency) on public.profiles to authenticated;

-- Audit : lecture réservée aux administrateurs ; aucune écriture côté client
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using ((select public.is_admin()));

revoke insert, update, delete on public.audit_logs from anon, authenticated;
