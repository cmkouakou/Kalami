-- =============================================================
--  Fichier    : 20261015120000_strategy_guides.sql
--  Projet     : Kalami Stratégie
--  Description: Sprint S3 : guide de chaque étape (explication et exemple Infosystem fournis
--               par l'auteur, modifiables par l'administrateur, rien d'affiché si vide),
--               chapitre du livre guide associé, lien vers le lecteur réservé aux lecteurs
--               qui ont le droit d'accès, listes de contrôle des étapes 3 (analyse interne)
--               et 4 (parties prenantes).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-11
--  Dépend de  : 20261013120000_strategy_core.sql, 20261014120000_strategy_templates.sql,
--               20261008120000_content.sql
-- =============================================================

-- ==================== GUIDE DES ÉTAPES ====================

alter table public.strategy_steps
  add column explanation text not null default ''
    check (char_length(explanation) <= 5000),
  add column example text not null default ''
    check (char_length(example) <= 5000),
  add column chapter_position integer check (chapter_position > 0);

comment on column public.strategy_steps.explanation is
  'Explication de l''étape fournie par l''auteur ; vide = rien d''affiché.';
comment on column public.strategy_steps.example is
  'Exemple fil rouge Infosystem fourni par l''auteur ; vide = rien d''affiché.';
comment on column public.strategy_steps.chapter_position is
  'Chapitre du livre guide qui traite l''étape (position dans la version courante).';

-- Toutes les écritures passent désormais par admin_update_strategy_step (journalisée)
drop policy if exists "strategy_steps_admin_update" on public.strategy_steps;

-- ==================== LIVRE GUIDE ====================

-- Réglage unique : le livre dont les chapitres accompagnent la démarche
create table public.strategy_settings (
  id boolean primary key default true check (id),
  guide_book_id uuid references public.books (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.strategy_settings (id) values (true);

create trigger strategy_settings_set_updated_at
  before update on public.strategy_settings
  for each row execute function public.set_updated_at();

alter table public.strategy_settings enable row level security;

create policy "strategy_settings_select_admin" on public.strategy_settings
  for select to authenticated using ((select public.is_admin()));

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Modifie le guide d'une étape et la raison du verrou ; administrateur (aal2) seulement
create or replace function public.admin_update_strategy_step(
  p_step_no smallint,
  p_explanation text,
  p_example text,
  p_lock_reason text,
  p_chapter_position integer
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
  if p_chapter_position is not null and p_chapter_position < 1 then
    raise exception 'invalid_chapter' using errcode = 'P0001';
  end if;

  update public.strategy_steps
  set explanation = coalesce(btrim(p_explanation), ''),
      example = coalesce(btrim(p_example), ''),
      lock_reason = coalesce(btrim(p_lock_reason), ''),
      chapter_position = p_chapter_position
  where step_no = p_step_no;
  if not found then
    raise exception 'step_not_found' using errcode = 'P0001';
  end if;

  perform public.write_audit('strategy_step_update', 'strategy_step', p_step_no::text,
    jsonb_build_object('chapter_position', p_chapter_position));
end;
$$;

revoke execute on function public.admin_update_strategy_step(smallint, text, text, text, integer)
  from public, anon;
grant execute on function public.admin_update_strategy_step(smallint, text, text, text, integer)
  to authenticated;

-- Choisit le livre guide (null pour n'en associer aucun) ; administrateur (aal2) seulement
create or replace function public.admin_set_strategy_guide_book(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_book_id is not null and not exists (select 1 from public.books where id = p_book_id) then
    raise exception 'book_not_found' using errcode = 'P0001';
  end if;

  update public.strategy_settings set guide_book_id = p_book_id where id;
  perform public.write_audit('strategy_guide_book', 'book', p_book_id::text);
end;
$$;

revoke execute on function public.admin_set_strategy_guide_book(uuid) from public, anon;
grant execute on function public.admin_set_strategy_guide_book(uuid) to authenticated;

-- ==================== FONCTIONS : LIEN VERS LE LECTEUR ====================

-- Chapitre du livre guide qui traite l'étape, seulement si l'utilisateur courant a un droit
-- de lecture actif sur ce livre et que le chapitre existe dans la version courante.
-- Aucune ligne sinon : l'interface n'affiche alors pas le lien.
create or replace function public.strategy_step_reading(p_step_no smallint)
returns table (slug text, chapter_position integer)
language sql
stable
security definer
set search_path = ''
as $$
  select b.slug, s.chapter_position
  from public.strategy_steps s
  cross join public.strategy_settings g
  join public.books b on b.id = g.guide_book_id
  where s.step_no = p_step_no
    and s.chapter_position is not null
    and exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid() and e.book_id = b.id and e.revoked_at is null
    )
    and exists (
      select 1 from public.chapters c
      where c.version_id = b.current_version_id and c.position = s.chapter_position
    );
$$;

revoke execute on function public.strategy_step_reading(smallint) from public, anon;
grant execute on function public.strategy_step_reading(smallint) to authenticated;

-- ==================== LISTES DE CONTRÔLE (étapes 1 à 4) ====================

-- Miroir des listes de contrôle du code (lib/strategy/templates/*.ts).
-- Étape 1 : au moins une opportunité et une menace nommées (« les deux » compte pour chacune).
-- Étape 2 : les cinq forces ont une intensité et une justification.
-- Étape 3 : au moins une activité nommée, toutes les activités nommées évaluées, et au moins
--           une ressource nommée dont les quatre questions VRIO ont une réponse.
-- Étape 4 : au moins une partie prenante nommée avec pouvoir, intérêt et approche.
-- Les autres étapes n'ont pas encore de gabarit : rien à vérifier.
create or replace function public.strategy_checklist_ok(p_step_no smallint, p_payload jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_list jsonb;
  v_forces jsonb;
  v_key text;
begin
  if p_step_no = 1 then
    v_list := p_payload -> 'factors';
    if jsonb_typeof(v_list) is distinct from 'array' then
      return false;
    end if;
    return exists (
      select 1 from jsonb_array_elements(v_list) f
      where f ->> 'nature' in ('opportunity', 'both')
        and btrim(coalesce(f ->> 'factor', '')) <> ''
    ) and exists (
      select 1 from jsonb_array_elements(v_list) f
      where f ->> 'nature' in ('threat', 'both')
        and btrim(coalesce(f ->> 'factor', '')) <> ''
    );
  end if;

  if p_step_no = 2 then
    v_forces := p_payload -> 'forces';
    if jsonb_typeof(v_forces) is distinct from 'object' then
      return false;
    end if;
    foreach v_key in array array['rivalry', 'newEntrants', 'substitutes', 'buyers', 'suppliers']
    loop
      if coalesce(v_forces -> v_key ->> 'intensity', '') not in ('low', 'medium', 'high')
        or btrim(coalesce(v_forces -> v_key ->> 'justification', '')) = '' then
        return false;
      end if;
    end loop;
    return true;
  end if;

  if p_step_no = 3 then
    v_list := p_payload -> 'activities';
    if jsonb_typeof(v_list) is distinct from 'array'
      or jsonb_typeof(p_payload -> 'resources') is distinct from 'array' then
      return false;
    end if;
    return exists (
      select 1 from jsonb_array_elements(v_list) a
      where btrim(coalesce(a ->> 'name', '')) <> ''
    ) and not exists (
      select 1 from jsonb_array_elements(v_list) a
      where btrim(coalesce(a ->> 'name', '')) <> ''
        and coalesce(a ->> 'evaluation', '') not in ('strength', 'improve', 'weakness', 'marginal')
    ) and exists (
      select 1 from jsonb_array_elements(p_payload -> 'resources') r
      where btrim(coalesce(r ->> 'name', '')) <> ''
        and coalesce(r -> 'tests' -> 'value' ->> 'answer', '') in ('yes', 'no', 'partial')
        and coalesce(r -> 'tests' -> 'rarity' ->> 'answer', '') in ('yes', 'no', 'partial')
        and coalesce(r -> 'tests' -> 'imitability' ->> 'answer', '') in ('yes', 'no', 'partial')
        and coalesce(r -> 'tests' -> 'organization' ->> 'answer', '') in ('yes', 'no', 'partial')
    );
  end if;

  if p_step_no = 4 then
    v_list := p_payload -> 'stakeholders';
    if jsonb_typeof(v_list) is distinct from 'array' then
      return false;
    end if;
    return exists (
      select 1 from jsonb_array_elements(v_list) s
      where btrim(coalesce(s ->> 'name', '')) <> ''
        and coalesce(s ->> 'power', '') in ('1', '2', '3', '4', '5')
        and coalesce(s ->> 'interest', '') in ('1', '2', '3', '4', '5')
        and btrim(coalesce(s ->> 'approach', '')) <> ''
    );
  end if;

  return true;
end;
$$;

revoke execute on function public.strategy_checklist_ok(smallint, jsonb) from public, anon;
grant execute on function public.strategy_checklist_ok(smallint, jsonb) to authenticated;
