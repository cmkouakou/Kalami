/**
 * =============================================================
 *  Fichier    : etape-6.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 6 (cap) : vision,
 *               mission, valeurs et objectifs 2016-2018, avec la cible prioritaire
 *               (question 7 du livre : restaurateurs et rôtisseurs d'abord).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/direction.ts
 * =============================================================
 */

import "server-only";

import type { DirectionPayload } from "@/lib/strategy/templates/direction";

// ==================== ÉNONCÉS ====================

const VISION =
  "D'ici 2018, AAO sera le partenaire de goût reconnu des restaurants, maquis et rôtisseurs " +
  "de Côte d'Ivoire : ceux qui cuisinent pour les autres utiliseront AJI-NO-MOTO® " +
  "ouvertement, avec fierté, parce qu'il leur donne un goût constant à moindre coût, puis " +
  "AAO étendra ce succès aux pays voisins les plus stables avec des partenaires de " +
  "distribution.";

const SMART_OK = {
  specific: true,
  measurable: true,
  achievable: true,
  realistic: true,
  timeBound: true,
};

// ==================== CORRIGÉ ====================

export const CASE_STEP_6: DirectionPayload = {
  vision: { id: "vision", text: VISION },
  nameTest: {
    competitor: "Maggi (Nestlé)",
    answer: "no",
    testedVision: VISION,
  },
  mission: {
    id: "mission",
    text:
      "Aider ceux qui cuisinent en Afrique de l'Ouest, à commencer par les professionnels de la " +
      "restauration populaire, à réussir des plats savoureux à moindre coût, avec un " +
      "assaisonnement authentique, sûr et de qualité constante, produit à Abidjan, expliqué " +
      "honnêtement et distribué avec des partenaires qui connaissent les marchés.",
  },
  values: [
    {
      id: "val-transparence",
      name: "Transparence sur le produit",
      gesture:
        "Chaque vendeur sait expliquer en une minute l'origine du produit (canne à sucre, " +
        "fermentation) et invite les clients qui doutent à visiter l'usine ou une démonstration.",
    },
    {
      id: "val-client",
      name: "Le client cuisinier d'abord",
      gesture:
        "Toute nouvelle offre (format, prix, mélange) est d'abord testée chez dix restaurateurs " +
        "ou rôtisseurs avant d'être proposée au siège.",
    },
    {
      id: "val-partenariat",
      name: "Partenariat loyal avec la distribution",
      gesture:
        "Aucune vente directe chez un client d'un grossiste partenaire sans son accord ; chaque " +
        "partenaire reçoit chaque trimestre le bilan de ses achats et de ses conditions.",
    },
    {
      id: "val-mesure",
      name: "Décider sur des faits",
      gesture:
        "Chaque objectif proposé au siège s'appuie sur une mesure du marché ou des ventes, " +
        "jamais sur un chiffre fixé d'avance.",
    },
  ],
  objectives: [
    {
      id: "obj-mesure",
      text:
        "Mesurer le marché réel du glutamate pur en Côte d'Ivoire (nombre de restaurants, " +
        "maquis et rôtisseurs, volumes achetés, part d'AAO) et proposer au siège un objectif " +
        "révisé pour 2017-2018 fondé sur cette mesure.",
      indicator:
        "Étude de marché remise et objectif révisé validé par le siège",
      target: "Étude remise ; objectif révisé adopté au budget 2017",
      deadline: "2016-09",
      smart: SMART_OK,
      issueLinks: ["enjeu-marche"],
    },
    {
      id: "obj-restaurateurs",
      text:
        "Recruter et fidéliser les restaurateurs et rôtisseurs d'Abidjan et de Bouaké comme " +
        "clients réguliers, servis en grands formats et livrés à date fixe.",
      indicator:
        "Nombre de restaurateurs et rôtisseurs achetant au moins une fois par mois",
      target: "Nombre doublé par rapport au recensement de 2016",
      deadline: "2017-12",
      smart: SMART_OK,
      issueLinks: ["enjeu-marche", "enjeu-confiance"],
    },
    {
      id: "obj-facture",
      text:
        "Vendre davantage par client plutôt que multiplier les petites factures : rapprocher la " +
        "facture moyenne de celle des développeurs.",
      indicator: "Facture moyenne de la vente directe (FCFA HT)",
      target: "De 2 900 FCFA (2015-2016) à au moins 7 000 FCFA",
      deadline: "2017-12",
      smart: SMART_OK,
      issueLinks: ["enjeu-distribution"],
    },
    {
      id: "obj-distribution",
      text:
        "Conclure des accords de distribution clairs : règle de partage des clients avec les " +
        "principaux grossistes ivoiriens et, pour l'export, un distributeur régional dans au " +
        "plus trois pays voisins choisis pour leur stabilité.",
      indicator: "Accords signés et appliqués",
      target:
        "Accords avec les principaux grossistes ; trois pays couverts au plus",
      deadline: "2017-06",
      smart: SMART_OK,
      issueLinks: ["enjeu-distribution"],
    },
    {
      id: "obj-confiance",
      text:
        "Faire reculer la crainte du produit chez les cuisiniers et les ménagères, pour que les " +
        "restaurateurs puissent l'utiliser ouvertement.",
      indicator:
        "Part des restaurateurs clients qui déclarent utiliser le produit sans le cacher " +
        "(enquête annuelle)",
      target:
        "Progression de 20 points par rapport à la première enquête de 2016",
      deadline: "2018-12",
      smart: SMART_OK,
      issueLinks: ["enjeu-confiance"],
    },
  ],
};
