-- =============================================================
--  Fichier    : 20261016120000_strategy_guides_content.sql
--  Projet     : Kalami Stratégie
--  Description: Stratégie v0.4.1 : textes du guide des neuf étapes (explication et exemple
--               Infosystem fournis par l'auteur, mot pour mot) et chapitre associé de « La
--               stratégie d'entreprise » (module N = chapitre N + 5), choix de ce livre comme
--               livre guide, et nouvelles listes de contrôle des étapes 3 (modèle choisi,
--               4 activités évaluées, 3 ressources VRIO complètes) et 4 (5 parties
--               prenantes placées, au moins une à pouvoir fort).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-11
--  Dépend de  : 20261015120000_strategy_guides.sql
-- =============================================================

-- ==================== TEXTES DU GUIDE ====================

update public.strategy_steps set
  chapter_position = 7,
  explanation = $t$L’environnement externe désigne tout ce qui agit sur l’entreprise sans qu’elle le contrôle : la politique, l’économie, la société, les technologies, l’écologie et la loi. On l’examine avec l’outil PESTEL, puis on repère les deux ou trois facteurs qui compteront le plus pour l’avenir, les variables pivots. Enfin, on les combine en scénarios, pour vérifier que la stratégie tient dans plusieurs futurs possibles.$t$,
  example = $t$Pour cette PME québécoise de services informatiques, le PESTEL a retenu une douzaine de facteurs. Deux variables pivots se détachent : la demande des PME, sensible à la conjoncture, et la vitesse d’adoption de l’intelligence artificielle dans le soutien informatique. Les quatre scénarios qui en découlent vont du « goulot d’étranglement » (demande forte, IA lente) à la « compression » (demande faible, IA rapide).$t$
where step_no = 1;

update public.strategy_steps set
  chapter_position = 8,
  explanation = $t$Deux entreprises soumises au même PESTEL peuvent connaître des sorts très différents selon l’industrie où elles se trouvent. Le modèle des cinq forces de Michael Porter évalue cette industrie : la rivalité entre concurrents, le pouvoir des clients, le pouvoir des fournisseurs (la main-d’œuvre comprise), la menace de nouveaux entrants et la menace de substituts. Attention à ne pas confondre un concurrent (qui répond au même besoin de la même manière) et un substitut (qui y répond autrement).$t$,
  example = $t$L’industrie des services informatiques gérés est difficile. La rivalité est forte, les fournisseurs puissants — notamment les techniciens, rares et courtisés —, et les substituts progressent (équipe interne, services gérés par les éditeurs, IA en libre-service). Deux forces jouent toutefois en faveur d’Infosystem : les coûts de changement des clients et la barrière de la confiance.$t$
where step_no = 2;

update public.strategy_steps set
  chapter_position = 9,
  explanation = $t$On regarde maintenant ce que l’entreprise fait (sa chaîne de valeur) et ce sur quoi elle s’appuie (ses ressources). Le modèle VRIO soumet chaque ressource à quatre tests : est-elle précieuse, rare, difficile à imiter, et l’entreprise est-elle organisée pour l’exploiter ? Seule une ressource qui passe les quatre procure un avantage durable.$t$,
  example = $t$Les atouts d’Infosystem sont réels — expertise des seniors, réputation du fondateur, connaissance intime des clients — mais ils vivent dans la tête de quelques personnes. Ils passent les trois premiers tests du VRIO, puis trébuchent sur l’organisation. Infosystem n’est pas vraiment propriétaire de ses atouts : ce sont des avantages fragiles.$t$
where step_no = 3;

update public.strategy_steps set
  chapter_position = 11,
  explanation = $t$Une stratégie ne se décide pas dans le vide. Les parties prenantes sont les personnes et les groupes qui peuvent soutenir vos choix ou les bloquer : employés, clients, fournisseurs, actionnaires, banques, gouvernements, communautés. On les cartographie avec la matrice d’Aubrey Mendelow, qui croise leur pouvoir d’influencer les décisions et leur intérêt pour celles-ci. Chaque quadrant appelle une approche : gérer de près, garder satisfaits, tenir informés ou surveiller.$t$,
  example = $t$Les techniciens seniors et les grands clients sont à gérer de près. Les grands éditeurs comme Microsoft sont à garder satisfaits. Un point découvert tard : les jeunes techniciens, pris individuellement, ont peu de pouvoir, mais collectivement, ils en ont beaucoup — celui de partir.$t$
where step_no = 4;

update public.strategy_steps set
  chapter_position = 10,
  explanation = $t$Les quatre analyses précédentes sont réunies dans la matrice SWOT : forces et faiblesses (ce qui est interne), opportunités et menaces (ce qui est externe). La matrice TOWS croise ensuite ces quatre cases pour en tirer des pistes d’action : utiliser une force pour saisir une opportunité, corriger une faiblesse pour en saisir une autre, etc. À la fin, on retient deux ou trois enjeux stratégiques majeurs.$t$,
  example = $t$Trois enjeux ressortent : la capacité (stabiliser l’équipe, condition de tout le reste), le positionnement (passer du soutien de base à l’expertise) et la pérennité (préparer la relève du fondateur).$t$
where step_no = 5;

update public.strategy_steps set
  chapter_position = 12,
  explanation = $t$Avant de choisir une stratégie, il faut dire où l’on veut aller. Quatre énoncés qui s’emboîtent : la vision (où serons-nous dans 5 à 10 ans ?), la mission (pourquoi existons-nous, pour qui ?), les valeurs (comment nous comportons-nous ?) et les objectifs SMART (spécifiques, mesurables, atteignables, réalistes, temporellement définis). Testez votre vision : remplacez le nom de l’entreprise par celui d’un concurrent. Si la phrase reste vraie, elle ne dit rien.$t$,
  example = $t$Vision : « D’ici 2031, être le partenaire informatique de confiance des PME de notre région, reconnu pour la sécurité de leurs systèmes et porté par une équipe qui choisit d’y faire carrière. » Objectifs : réduire de moitié les départs de techniciens en trois ans, tirer 25 % du chiffre d’affaires de la sécurité et de la conformité, documenter 100 % des clients dans une base commune.$t$
where step_no = 6;

update public.strategy_steps set
  chapter_position = 13,
  explanation = $t$Deux outils cadrent le choix. Les stratégies génériques de Porter forcent à décider sur quoi repose l’avantage (coûts plus bas ou valeur unique) et sur quelle cible (large ou étroite). La matrice d’Ansoff situe la direction de croissance (produits actuels ou nouveaux × marchés actuels ou nouveaux). Les options sont ensuite évaluées sur trois critères : pertinence (répond-elle aux enjeux ?), acceptabilité (les parties prenantes clés l’accepteront-elles ?), faisabilité (en a-t-on les moyens ?). Une stratégie, c’est aussi dire ce qu’on ne fera pas.$t$,
  example = $t$Focalisation par la différenciation sur les PME de la région, par la proximité et par une expertise reconnue en sécurité. Croissance d’abord interne, alliance avec un spécialiste pour les services pointus, relève préparée avec les seniors. Ce qu’Infosystem ne fera pas : baisser ses prix, vendre du matériel, développer ses propres logiciels, s’étendre à d’autres régions avant d’avoir stabilisé l’équipe.$t$
where step_no = 7;

update public.strategy_steps set
  chapter_position = 14,
  explanation = $t$La stratégie se traduit en feuille de route (chantiers, responsables, phases, échéances) et en tableau de bord équilibré (Kaplan et Norton, 1992), qui suit la performance selon quatre perspectives : finances, clients, processus internes, apprentissage et croissance. On distingue les indicateurs de résultat (le chiffre d’affaires, trop tard pour réagir) des indicateurs avancés (les heures de formation, qui annoncent les résultats futurs).$t$,
  example = $t$Trois phases sur trois ans : stabiliser (6 mois), développer (18 mois), croître et transmettre (36 mois). Le tableau de bord commence par les indicateurs d’apprentissage (départs de techniciens, heures de formation, certifications), qui conditionnent tous les autres.$t$
where step_no = 8;

update public.strategy_steps set
  chapter_position = 15,
  explanation = $t$Le livrable final, en 5 à 6 pages, structuré en 8 sections : où en sommes-nous, nos enjeux, notre cap, notre stratégie et ce que nous ne ferons pas, nos chantiers, nos objectifs et indicateurs, nos risques, notre suivi. Un bon plan nomme des personnes, prévoit l’échec et reste court.$t$,
  example = $t$Le plan d’Infosystem sur quatre ans (2026-2029), avec Justin et Marthe aux manettes, les deux seniors responsables des chantiers principaux, et une préparation progressive de la relève.$t$
where step_no = 9;

-- ==================== LIVRE GUIDE ====================

-- Reste vide si le livre n'existe pas ; les liens de lecture exigent en plus qu'il soit
-- publié et que le lecteur y ait droit.
update public.strategy_settings
set guide_book_id = (select id from public.books where slug = 'la-strategie-d-entreprise')
where id;

-- ==================== LISTES DE CONTRÔLE ====================

-- Miroir de internalChecklist et stakeholdersChecklist (src/lib/strategy/templates).
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
  v_count integer;
  v_ok boolean;
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
    if coalesce(p_payload ->> 'model', '') not in ('porter', 'services')
      or jsonb_typeof(v_list) is distinct from 'array'
      or jsonb_typeof(p_payload -> 'resources') is distinct from 'array' then
      return false;
    end if;
    -- Au moins 4 activités nommées et évaluées
    select count(*) into v_count
    from jsonb_array_elements(v_list) a
    where btrim(coalesce(a ->> 'name', '')) <> ''
      and coalesce(a ->> 'evaluation', '') in ('strength', 'improve', 'weakness', 'marginal');
    if v_count < 4 then
      return false;
    end if;
    -- Au moins 3 ressources nommées, et chaque ressource nommée a ses quatre réponses
    select count(*) into v_count
    from jsonb_array_elements(p_payload -> 'resources') r
    where btrim(coalesce(r ->> 'name', '')) <> '';
    if v_count < 3 then
      return false;
    end if;
    return not exists (
      select 1 from jsonb_array_elements(p_payload -> 'resources') r
      where btrim(coalesce(r ->> 'name', '')) <> ''
        and (
          coalesce(r -> 'tests' -> 'value' ->> 'answer', '') not in ('yes', 'no', 'partial')
          or coalesce(r -> 'tests' -> 'rarity' ->> 'answer', '') not in ('yes', 'no', 'partial')
          or coalesce(r -> 'tests' -> 'imitability' ->> 'answer', '')
            not in ('yes', 'no', 'partial')
          or coalesce(r -> 'tests' -> 'organization' ->> 'answer', '')
            not in ('yes', 'no', 'partial')
        )
    );
  end if;

  if p_step_no = 4 then
    v_list := p_payload -> 'stakeholders';
    if jsonb_typeof(v_list) is distinct from 'array' then
      return false;
    end if;
    -- Case de chaque partie prenante nommée : choisie à la main, sinon calculée (fort dès 3)
    with placed as (
      select coalesce(
        case when s ->> 'quadrantOverride' in ('manage', 'satisfy', 'inform', 'monitor')
          then s ->> 'quadrantOverride' end,
        case
          when coalesce(s ->> 'power', '') not in ('1', '2', '3', '4', '5')
            or coalesce(s ->> 'interest', '') not in ('1', '2', '3', '4', '5') then null
          when (s ->> 'power')::int >= 3 and (s ->> 'interest')::int >= 3 then 'manage'
          when (s ->> 'power')::int >= 3 then 'satisfy'
          when (s ->> 'interest')::int >= 3 then 'inform'
          else 'monitor'
        end
      ) as quadrant
      from jsonb_array_elements(v_list) s
      where btrim(coalesce(s ->> 'name', '')) <> ''
    )
    select case
      when count(*) < 5 then false
      when count(*) filter (where quadrant is null) > 0 then false
      else count(*) filter (where quadrant in ('manage', 'satisfy')) > 0
    end into strict v_ok
    from placed;
    return v_ok;
  end if;

  return true;
end;
$$;

revoke execute on function public.strategy_checklist_ok(smallint, jsonb) from public, anon;
grant execute on function public.strategy_checklist_ok(smallint, jsonb) to authenticated;
