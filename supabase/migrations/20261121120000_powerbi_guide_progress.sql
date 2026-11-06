-- =============================================================
--  Fichier    : 20261121120000_powerbi_guide_progress.sql
--  Projet     : Kalami Données
--  Description: Progression du chantier BRVM Power BI (v0.18.0) : une ligne par case
--               cochée (identifiant stable « c2-3 »). Chaque lecteur ne voit et ne modifie
--               que ses propres cases ; un sprint est terminé quand toutes ses cases le
--               sont (calcul côté application). Supprimé avec le compte.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-05
--  Dépend de  : (aucun) — auth.users
-- =============================================================

-- ==================== TABLE ====================

create table public.powerbi_guide_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Identifiant de la case : « c<sprint>-<rang> »
  item_id text not null check (item_id ~ '^c[1-9]-[0-9]{1,2}$'),
  checked_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

comment on table public.powerbi_guide_progress is
  'Cases cochées du chantier BRVM Power BI (Kalami Données), une ligne par case.';

-- ==================== SÉCURITÉ ====================

alter table public.powerbi_guide_progress enable row level security;

revoke all on public.powerbi_guide_progress from anon;
grant select, insert, delete on public.powerbi_guide_progress to authenticated;

create policy "powerbi_guide_progress_select_own"
  on public.powerbi_guide_progress for select to authenticated
  using (user_id = (select auth.uid()));

create policy "powerbi_guide_progress_insert_own"
  on public.powerbi_guide_progress for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "powerbi_guide_progress_delete_own"
  on public.powerbi_guide_progress for delete to authenticated
  using (user_id = (select auth.uid()));
