-- =============================================================
--  Fichier    : 20261115120000_practice_case_example_revoke.sql
--  Projet     : Kalami
--  Description: Cas résolu (v0.14.5) : quand l'accès à un cas est retiré (administration)
--               ou remboursé, l'étude résolue du compte est supprimée, car elle contient
--               le corrigé de l'auteur. L'étude d'exercice, travail de l'élève, est gardée.
--               Un accès rendu plus tard rouvre un cas résolu neuf.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-24
--  Dépendances: 20261114120000_practice_case_example.sql
-- =============================================================

-- ==================== DÉCLENCHEUR ====================

-- Supprime les études résolues du compte pour ce cas (la clé étrangère remet
-- example_study_id à null sur la ligne d'accès)
create or replace function public.practice_case_drop_example()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.studies s
  where s.owner_id = new.user_id
    and s.practice_case = new.case_code
    and s.practice_case_example;
  return null;
end;
$$;

revoke execute on function public.practice_case_drop_example() from public, anon, authenticated;

create trigger practice_case_access_drop_example
  after update of revoked_at on public.practice_case_access
  for each row
  when (old.revoked_at is null and new.revoked_at is not null)
  execute function public.practice_case_drop_example();

-- ==================== NETTOYAGE ====================

-- Accès déjà retirés avant cette migration : leurs études résolues disparaissent aussi
delete from public.studies s
where s.practice_case_example
  and not exists (
    select 1 from public.practice_case_access a
    where a.user_id = s.owner_id and a.case_code = s.practice_case and a.revoked_at is null
  );
