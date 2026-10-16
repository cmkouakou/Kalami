-- =============================================================
--  Fichier    : 20261031120000_legal_privacy.sql
--  Projet     : Kalami
--  Description: Sprint 11a-1 — textes légaux administrables et versionnés (confidentialité,
--               conditions d'utilisation, conditions de vente), registre des consentements
--               aux témoins, demandes de suppression de compte (délai de 30 jours).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-16
-- =============================================================

-- ==================== TEXTES LÉGAUX ====================

-- Une publication crée une nouvelle version ; une version publiée n'est jamais modifiée
create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('privacy', 'terms', 'sales')),
  version integer not null check (version > 0),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 100000),
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now(),
  unique (kind, version)
);

comment on table public.legal_documents is
  'Textes légaux publics, versionnés. Écriture par admin_publish_legal_document seulement.';

-- Publication d'une nouvelle version par l'administrateur (aal2)
create or replace function public.admin_publish_legal_document(
  p_kind text,
  p_title text,
  p_body text
)
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
  if p_kind not in ('privacy', 'terms', 'sales') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  -- Verrou de table : deux publications simultanées ne prennent pas le même numéro
  lock table public.legal_documents in share row exclusive mode;
  select coalesce(max(version), 0) + 1 into v_version
  from public.legal_documents where kind = p_kind;

  insert into public.legal_documents (kind, version, title, body, created_by)
  values (p_kind, v_version, btrim(p_title), p_body, auth.uid())
  returning id into v_id;

  perform public.write_audit(
    'legal.published', 'legal_document', v_id::text,
    jsonb_build_object('kind', p_kind, 'version', v_version)
  );
  return v_id;
end;
$$;

revoke execute on function public.admin_publish_legal_document(text, text, text)
  from public, anon;
grant execute on function public.admin_publish_legal_document(text, text, text)
  to authenticated;

-- Textes provisoires : à remplacer par ceux du propriétaire dans /admin/textes-legaux
insert into public.legal_documents (kind, version, title, body) values
(
  'privacy', 1, 'Politique de confidentialité',
  E'Texte provisoire — la version définitive sera publiée par Kalami.\n\n'
  'Responsable : Kalami. Pour toute question sur vos renseignements personnels, écrivez à '
  'l''adresse indiquée dans cette page une fois la version définitive publiée.\n\n'
  'Renseignements recueillis : adresse courriel, nom d''affichage, devise préférée, livres '
  'auxquels vous avez accès, position de lecture, signets, surlignages et notes ; pour Kalami '
  'Stratégie, le contenu de vos études et les pièces jointes que vous y déposez.\n\n'
  'Finalités : créer et sécuriser votre compte, vous donner accès aux livres et aux études, '
  'synchroniser votre lecture entre vos appareils.\n\n'
  'Kalami Stratégie : les demandes faites au coach sont transmises à Anthropic, qui agit '
  'comme sous-traitant. Les données de vos études ne servent qu''à votre étude et ne sont '
  'pas utilisées pour entraîner des modèles.\n\n'
  'Témoins (cookies) : seuls des témoins nécessaires au fonctionnement sont utilisés '
  '(session de connexion, devise, choix de consentement). Vous pouvez modifier votre choix à '
  'tout moment avec le lien « Gérer les témoins ».\n\n'
  'Vos droits (Loi 25 et RGPD) : accès, rectification, portabilité (« Télécharger mes '
  'données » dans Mon compte), retrait du consentement et suppression du compte (exécutée '
  '30 jours après la demande, annulable d''ici là).'
),
(
  'terms', 1, 'Conditions d''utilisation',
  E'Texte provisoire — la version définitive sera publiée par Kalami.\n\n'
  'En créant un compte, vous vous engagez à fournir des renseignements exacts, à garder vos '
  'identifiants confidentiels et à ne pas copier, redistribuer ni extraire les contenus '
  'protégés de la plateforme.'
),
(
  'sales', 1, 'Conditions de vente',
  E'Texte provisoire — la version définitive sera publiée par Kalami avant l''ouverture '
  'des paiements.'
);

-- ==================== REGISTRE DES CONSENTEMENTS ====================

-- Chaque choix exprimé dans le bandeau des témoins (aucune adresse IP conservée)
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  choice text not null check (choice in ('accepted', 'refused')),
  consent_version integer not null check (consent_version > 0),
  privacy_version integer check (privacy_version > 0),
  created_at timestamptz not null default now()
);

comment on table public.consent_records is
  'Registre des consentements aux témoins. Écriture par record_consent seulement.';

create index consent_records_visitor_idx on public.consent_records (visitor_id, created_at desc);
create index consent_records_user_idx on public.consent_records (user_id);

-- Enregistre un choix ; le compte est rattaché s'il y a une session
create or replace function public.record_consent(
  p_visitor_id uuid,
  p_choice text,
  p_consent_version integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  if p_visitor_id is null or p_choice not in ('accepted', 'refused')
    or p_consent_version is null or p_consent_version < 1 then
    raise exception 'invalid_consent' using errcode = '22023';
  end if;
  -- Limitation de débit : 20 choix par visiteur et par heure
  select count(*)::integer into v_recent from public.consent_records
  where visitor_id = p_visitor_id and created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.consent_records
    (visitor_id, user_id, choice, consent_version, privacy_version)
  values (
    p_visitor_id, auth.uid(), p_choice, p_consent_version,
    (select max(version) from public.legal_documents where kind = 'privacy')
  );
end;
$$;

revoke execute on function public.record_consent(uuid, text, integer) from public;
grant execute on function public.record_consent(uuid, text, integer) to anon, authenticated;

-- ==================== SUPPRESSION DU COMPTE ====================

-- Une demande en cours par compte ; la suppression est exécutée à scheduled_for (tâche
-- planifiée /api/cron/comptes). Annuler = supprimer la ligne.
create table public.account_deletion_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null default now() + interval '30 days'
);

comment on table public.account_deletion_requests is
  'Demandes de suppression de compte, exécutées 30 jours plus tard sauf annulation.';

create index account_deletion_requests_due_idx
  on public.account_deletion_requests (scheduled_for);

-- Ce que la suppression emportera : affiché avant la confirmation
create or replace function public.account_deletion_impact()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'owned_studies',
      (select count(*) from public.studies s where s.owner_id = auth.uid()),
    'shared_studies',
      (select count(*) from public.studies s
       where s.owner_id = auth.uid()
         and exists (select 1 from public.study_members m
                     where m.study_id = s.id and m.user_id <> auth.uid())),
    'classes', (select count(*) from public.classes c where c.teacher_id = auth.uid()),
    'is_author', exists (select 1 from public.authors a where a.user_id = auth.uid())
  );
$$;

revoke execute on function public.account_deletion_impact() from public, anon;
grant execute on function public.account_deletion_impact() to authenticated;

-- Demande de suppression (idempotente : une demande en cours garde sa date)
create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date timestamptz;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  insert into public.account_deletion_requests (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select scheduled_for into v_date
  from public.account_deletion_requests where user_id = auth.uid();

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'account.deletion_requested', 'user', auth.uid()::text,
          jsonb_build_object('scheduled_for', v_date));
  return v_date;
end;
$$;

revoke execute on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;

-- Annulation par l'utilisateur
create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  delete from public.account_deletion_requests where user_id = auth.uid();
  if found then
    insert into public.audit_logs (actor_id, action, target_type, target_id)
    values (auth.uid(), 'account.deletion_cancelled', 'user', auth.uid()::text);
  end if;
end;
$$;

revoke execute on function public.cancel_account_deletion() from public, anon;
grant execute on function public.cancel_account_deletion() to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.legal_documents enable row level security;
alter table public.consent_records enable row level security;
alter table public.account_deletion_requests enable row level security;

-- Textes légaux : publics
create policy "legal_documents_select_all"
  on public.legal_documents for select
  to anon, authenticated
  using (true);

-- Registre : chacun lit ses propres choix ; l'administrateur (aal2) lit tout
create policy "consent_records_select_own_or_admin"
  on public.consent_records for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Demandes de suppression : chacun lit la sienne ; l'administrateur lit tout
create policy "account_deletion_requests_select_own_or_admin"
  on public.account_deletion_requests for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Aucune politique d'écriture : tout passe par les fonctions ci-dessus ou par la clé
-- secrète (tâche planifiée).
