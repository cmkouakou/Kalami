/**
 * =============================================================
 *  Fichier    : etape-4.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 4 (parties prenantes) :
 *               les huit acteurs de la question 6 du livre dans la matrice pouvoir-intérêt,
 *               plus le fournisseur du groupe et l'équipe de vente ; l'acteur le plus
 *               négligé est désigné dans sa fiche (restaurateurs et rôtisseurs).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/stakeholders.ts
 * =============================================================
 */

import "server-only";

import type { StakeholdersPayload } from "@/lib/strategy/templates/stakeholders";

// ==================== CORRIGÉ ====================

export const CASE_STEP_4: StakeholdersPayload = {
  stakeholders: [
    {
      id: "siege-tokyo",
      name: "Siège du groupe à Tokyo",
      expectations:
        "Atteindre l'objectif d'environ 2,5 milliards de yens de ventes en 2016 et rentabiliser " +
        "l'investissement de 1,9 milliard de FCFA dans l'usine. Il fournit le glutamate (par la " +
        "filiale brésilienne), fixe le prix de cession et a le dernier mot sur les prix et les " +
        "objectifs, que les dirigeants japonais d'AAO arrêtent en lien avec lui.",
      power: 5,
      interest: 3,
      quadrantOverride: null,
      engagementCurrent: "neutral",
      engagementDesired: "supportive",
      approach:
        "Gérer de près. Le siège juge AAO sur un objectif de ventes qui n'a jamais été comparé à " +
        "la taille réelle du marché du glutamate pur. Il faut lui apporter cette mesure et " +
        "obtenir un objectif révisé, construit à partir des clients réels, plutôt que de " +
        "promettre un chiffre hors d'atteinte.",
      actions:
        "Étude du marché du glutamate pur en Côte d'Ivoire (restaurants, rôtisseurs, " +
        "grossistes) remise au siège avant le budget 2017. Proposition d'objectif révisé et de " +
        "trajectoire 2016-2018, présentée par la direction générale d'AAO.",
    },
    {
      id: "direction-regionale",
      name: "Direction régionale du groupe (commanditaire de la mission)",
      expectations:
        "Savoir si la filiale peut atteindre ses objectifs et à quelles conditions ; disposer " +
        "d'un diagnostic franc pour arbitrer, y compris sur la pertinence d'une filiale " +
        "autonome et sur le modèle de distribution.",
      power: 5,
      interest: 5,
      quadrantOverride: null,
      engagementCurrent: "supportive",
      engagementDesired: "leading",
      approach:
        "Gérer de près : c'est elle qui a commandé la mission et qui portera les conclusions " +
        "devant Tokyo. Elle doit devenir le porteur de la stratégie révisée, y compris si " +
        "celle-ci conclut que l'objectif n'est pas atteignable tel quel.",
      actions:
        "Points d'étape mensuels pendant la mission ; présentation du diagnostic et des options " +
        "avant l'été 2016 ; validation du plan 2016-2018 et des indicateurs de suivi.",
    },
    {
      id: "grossistes",
      name: "Grossistes et demi-grossistes",
      expectations:
        "De bonnes marges et des conditions favorables, qu'ils obtiennent en invoquant la " +
        "mauvaise réputation du produit ; ne pas être concurrencés par la vente directe d'AAO " +
        "auprès des détaillantes de leurs marchés.",
      power: 5,
      interest: 3,
      quadrantOverride: null,
      engagementCurrent: "resistant",
      engagementDesired: "supportive",
      approach:
        "Gérer de près : ils commandent l'accès aux marchés et aux détaillantes, et pèsent lourd " +
        "dans les négociations. Le modèle de vente directe au comptant, hérité de l'Asie, les " +
        "contourne au lieu de s'appuyer sur eux. Il faut clarifier le rôle de chaque canal et " +
        "lier les conditions accordées aux volumes réellement vendus, pas à la rumeur.",
      actions:
        "Règle de partage des clients entre vente directe et grossistes ; remises liées aux " +
        "volumes ; rencontres trimestrielles avec les principaux grossistes, appuyées par le " +
        "suivi de leurs achats.",
    },
    {
      id: "detaillantes",
      name: "Détaillantes des marchés (souvent en coopératives de femmes)",
      expectations:
        "Un produit qui se vend sans devoir le défendre face aux clientes, en petites quantités, " +
        "avec une marge suffisante et un approvisionnement proche.",
      power: 2,
      interest: 3,
      quadrantOverride: null,
      engagementCurrent: "neutral",
      engagementDesired: "supportive",
      approach:
        "Tenir informées : une à une, elles pèsent peu, mais ce sont elles qui répondent aux " +
        "questions des clientes sur le produit. Les coopératives offrent un point d'entrée " +
        "collectif. La facture moyenne de 2 900 FCFA montre que la vente directe les sert déjà, " +
        "à un coût élevé pour de petits montants.",
      actions:
        "Démonstrations de cuisine avec les coopératives ; argumentaire simple sur l'origine du " +
        "produit (canne à sucre) et sur la façon de reconnaître le produit authentique.",
    },
    {
      id: "restaurateurs",
      name: "Restaurateurs et rôtisseurs (acteur le plus négligé)",
      expectations:
        "Obtenir le goût recherché à moindre coût que les cubes, avec un produit régulier, en " +
        "formats adaptés à la cuisine en volume, sans que leurs clients ne leur reprochent " +
        "d'utiliser du glutamate.",
      power: 2,
      interest: 5,
      quadrantOverride: null,
      engagementCurrent: "supportive",
      engagementDesired: "leading",
      approach:
        "L'acteur le plus négligé. Ce sont les seuls clients qui apprécient déjà le produit et " +
        "en tirent un avantage économique net, mais ils l'utilisent en cachette et n'ont qu'un " +
        "canal parmi d'autres. Un par un, leur pouvoir est faible ; ensemble, ils forment le " +
        "cœur du marché réel du glutamate pur. Il faut les placer au centre de la stratégie, et " +
        "les aider à assumer l'usage du produit devant leurs clients.",
      actions:
        "Recensement des restaurants, maquis et rôtisseurs d'Abidjan et de Bouaké ; offre en " +
        "grands formats et livraison régulière ; démonstrations du coût par plat ; programme " +
        "de clients ambassadeurs fiers d'afficher le produit.",
    },
    {
      id: "consommatrices",
      name: "Consommatrices (ménagères)",
      expectations:
        "Un plat qui a bon goût, à un coût maîtrisé, avec des ingrédients en qui elles ont " +
        "confiance ; beaucoup croient la rumeur du « cube Maggi blanc » nocif.",
      power: 3,
      interest: 2,
      quadrantOverride: null,
      engagementCurrent: "resistant",
      engagementDesired: "neutral",
      approach:
        "Garder satisfaites : collectivement, elles décident de ce qui entre dans la marmite, et " +
        "leur méfiance pèse sur tous les maillons. L'objectif réaliste en trois ans n'est pas de " +
        "les convertir, mais de faire reculer la crainte, pour que restaurateurs et détaillantes " +
        "n'aient plus à cacher le produit.",
      actions:
        "Poursuite des démonstrations sur les marchés lancées avec la campagne Delta ; mesure " +
        "annuelle de la perception du produit par une petite enquête auprès de ménagères.",
    },
    {
      id: "gouvernement",
      name: "Gouvernement ivoirien (commerce, industrie, normes, douanes)",
      expectations:
        "Des investissements et des emplois (250 emplois annoncés à terme), le respect des " +
        "normes sanitaires et des règles sur les sachets plastiques.",
      power: 4,
      interest: 2,
      quadrantOverride: null,
      engagementCurrent: "supportive",
      engagementDesired: "supportive",
      approach:
        "Garder satisfait : il a accueilli l'investissement et peut aider à lutter contre les " +
        "contrefaçons, mais il ne suit pas la stratégie commerciale. Une caution officielle sur " +
        "la sécurité du produit aiderait à combattre la rumeur.",
      actions:
        "Information régulière sur l'activité de l'usine et l'emploi ; signalement des " +
        "contrefaçons aux autorités ; demande d'un appui des autorités sanitaires sur la " +
        "sécurité du glutamate.",
    },
    {
      id: "concurrents",
      name: "Concurrents et substituts (Maggi, Jumbo, Doli, contrefacteurs)",
      expectations:
        "Garder leur place dans la cuisine ouest-africaine ; les contrefacteurs profitent de " +
        "l'absence de contrôle et du faible prix du glutamate en vrac.",
      power: 4,
      interest: 2,
      quadrantOverride: "monitor",
      engagementCurrent: "resistant",
      engagementDesired: "resistant",
      approach:
        "Surveiller : on ne cherche pas leur appui. Les fabricants de cubes ont peu de raisons " +
        "de réagir tant qu'AAO reste sur le glutamate pur ; ils réagiront si AAO entre dans " +
        "l'univers du cube avec des produits mélangés.",
      actions:
        "Veille trimestrielle des prix et des formats des cubes sur les marchés ; relevé des " +
        "contrefaçons repérées par l'équipe terrain.",
    },
    {
      id: "fournisseur-groupe",
      name: "Filiale brésilienne du groupe (fournisseur du glutamate en vrac)",
      expectations:
        "Écouler sa production à un prix de cession fixé par le groupe, avec des commandes " +
        "prévisibles.",
      power: 3,
      interest: 2,
      quadrantOverride: null,
      engagementCurrent: "neutral",
      engagementDesired: "neutral",
      approach:
        "Garder satisfaite : seule source d'approvisionnement d'AAO, elle dépend des décisions " +
        "du siège plus que des négociations locales.",
      actions:
        "Prévisions de commandes ajustées aux ventes réelles, pour éviter les surstocks.",
    },
    {
      id: "equipe-vente",
      name: "Équipe commerciale d'AAO (agences, développeurs, export)",
      expectations:
        "Des objectifs atteignables, des règles claires entre canaux, de meilleurs salaires et " +
        "une reconnaissance des résultats ; la plupart des vendeurs sont salariés et restent, " +
        "faute d'autres emplois, malgré leur insatisfaction.",
      power: 2,
      interest: 5,
      quadrantOverride: null,
      engagementCurrent: "neutral",
      engagementDesired: "supportive",
      approach:
        "Tenir informée et associer : elle met la stratégie en œuvre au quotidien mais ne décide " +
        "ni des prix ni des objectifs. Les deux développeurs, dont la facture moyenne est cinq " +
        "fois plus élevée, montrent la voie : vendre plus par client plutôt que multiplier les " +
        "petites factures.",
      actions:
        "Partage du diagnostic avec l'équipe ; réorientation d'une partie des vendeurs vers la " +
        "prospection des restaurateurs ; prime liée au volume par client.",
    },
  ],
};
