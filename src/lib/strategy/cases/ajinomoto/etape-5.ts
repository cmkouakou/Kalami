/**
 * =============================================================
 *  Fichier    : etape-5.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 5 (synthèse) : SWOT
 *               reliée aux étapes 1 à 4, matrice TOWS et trois enjeux stratégiques
 *               (question 5 du livre).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/synthesis.ts
 * =============================================================
 */

import "server-only";

import type { SynthesisPayload } from "@/lib/strategy/templates/synthesis";

// ==================== CORRIGÉ ====================

export const CASE_STEP_5: SynthesisPayload = {
  swot: {
    strengths: [
      {
        id: "s-usine",
        text:
          "Usine d'Abidjan parmi les dix meilleures des quelque 120 usines du groupe, avec des " +
          "pertes réduites de 40 % : capacité et qualité ne sont pas le problème.",
        origin: { step: 3, ref: "operations" },
      },
      {
        id: "s-qualite",
        text:
          "Produit authentique de qualité constante (fine poudre blanche), adossé à la marque et " +
          "au savoir-faire d'un groupe mondial, nettement supérieur aux contrefaçons.",
        origin: { step: 3, ref: "groupe-marque" },
      },
      {
        id: "s-cout-plat",
        text:
          "Pour qui cuisine en volume, le glutamate pur donne le goût recherché à moindre coût " +
          "que les cubes : un avantage économique réel auprès des restaurateurs et rôtisseurs.",
        origin: { step: 2, ref: "substitutes" },
      },
      {
        id: "s-gamme",
        text:
          "Une première réponse existe déjà : campagne avec Delta, dépliants, équipes sur les " +
          "marchés et AjiGoût, mélange moins cher adapté aux goûts locaux.",
        origin: { step: 3, ref: "aao-gamme" },
      },
      {
        id: "s-terrain",
        text:
          "Équipe commerciale stable et implantée (Abidjan, Bouaké, Daloa), qui connaît les " +
          "marchés ; les développeurs prouvent qu'on peut vendre cinq fois plus par client.",
        origin: { step: 3, ref: "aao-terrain" },
      },
    ],
    weaknesses: [
      {
        id: "w-reputation",
        text:
          "Confiance faible : rumeur du « cube Maggi blanc » nocif, produit utilisé en cachette " +
          "par les cuisiniers, argument repris par les grossistes pour négocier.",
        origin: { step: 1, ref: "soc-reputation" },
      },
      {
        id: "w-vente-directe",
        text:
          "Vente directe à faible rendement : ventes stables de 14,6 à 18,8 M FCFA par mois, " +
          "facture moyenne de 2 900 FCFA (environ 2 kg) et 1,10 article par facture.",
        origin: { step: 3, ref: "marketingSales" },
      },
      {
        id: "w-ecart-objectif",
        text:
          "Écart énorme avec l'objectif : la vente directe représente environ 196 M FCFA par an, " +
          "soit 1,6 % des quelque 12,25 milliards de FCFA visés pour 2016.",
        origin: { step: 3, ref: "marketingSales" },
      },
      {
        id: "w-donnees",
        text:
          "Aucune mesure du marché du glutamate pur ni suivi par canal : l'objectif a été fixé " +
          "sans savoir combien de clients existent ni combien ils achètent.",
        origin: { step: 3, ref: "aao-donnees" },
      },
      {
        id: "w-decision",
        text:
          "Prix et objectifs réservés aux dirigeants japonais, en lien avec Tokyo : l'équipe " +
          "locale ne peut pas ajuster seule son offre au terrain.",
        origin: { step: 3, ref: "infrastructure" },
      },
      {
        id: "w-distribution",
        text:
          "Distribution faible hors de Côte d'Ivoire et export à construire, alors que la zone " +
          "visée compte onze pays.",
        origin: { step: 3, ref: "outboundLogistics" },
      },
    ],
    opportunities: [
      {
        id: "o-croissance",
        text:
          "Forte croissance ivoirienne depuis 2012 et essor de la restauration populaire " +
          "(maquis, rôtisseurs, cantines) qui cuisine en grande quantité.",
        origin: { step: 1, ref: "eco-croissance" },
      },
      {
        id: "o-marche-cube",
        text:
          "Un marché des bouillons d'environ 30 000 tonnes et 90 milliards de FCFA par an en " +
          "Côte d'Ivoire : une petite part des usages en volume suffirait à changer d'échelle.",
        origin: { step: 2, ref: "substitutes" },
      },
      {
        id: "o-distribution",
        text:
          "Réseaux de distribution déjà en place (grossistes, coopératives de détaillantes, " +
          "distributeurs régionaux) sur lesquels s'appuyer plutôt que les contourner.",
        origin: { step: 1, ref: "eco-distribution" },
      },
      {
        id: "o-mobile",
        text:
          "Essor du paiement mobile chez les commerçants : encaissement plus simple et données " +
          "de vente par client.",
        origin: { step: 1, ref: "tec-mobile" },
      },
    ],
    threats: [
      {
        id: "t-substituts",
        text:
          "Le cube, substitut dominant (Maggi environ 75 %), jouit d'une confiance que le " +
          "glutamate n'a pas, sans coût de changement pour la cuisinière.",
        origin: { step: 2, ref: "substitutes" },
      },
      {
        id: "t-grossistes",
        text:
          "Grossistes puissants qui tirent de meilleures conditions de la mauvaise réputation et " +
          "voient la vente directe comme une concurrence.",
        origin: { step: 2, ref: "buyers" },
      },
      {
        id: "t-contrefacon",
        text:
          "Contrefaçons et imitations (Jakomo et autres), moins chères, qui entretiennent le " +
          "doute sur tout le glutamate.",
        origin: { step: 2, ref: "rivalry" },
      },
      {
        id: "t-zone",
        text:
          "Instabilité d'une partie de la zone (Mali, attentat de Ouagadougou en janvier 2016, " +
          "suites d'Ebola, frontières) : export plus coûteux et plus risqué.",
        origin: { step: 1, ref: "pol-zone" },
      },
      {
        id: "t-sachets",
        text:
          "Règles sur les sachets plastiques en Côte d'Ivoire (2013) et au Burkina Faso (2014) : " +
          "emballages des petits formats à adapter.",
        origin: { step: 1, ref: "leg-sachets-ci" },
      },
    ],
  },
  tows: [
    {
      id: "so-restaurateurs",
      quadrant: "so",
      text:
        "Faire des restaurateurs et rôtisseurs la cible prioritaire : grands formats, livraison " +
        "régulière et démonstration du coût par plat, portée par l'équipe terrain.",
      links: ["s-cout-plat", "s-terrain", "o-croissance"],
    },
    {
      id: "so-authentique",
      quadrant: "so",
      text:
        "Valoriser l'usine et la qualité du produit authentique (visites, origine canne à sucre) " +
        "pour se distinguer des contrefaçons.",
      links: ["s-usine", "s-qualite", "o-marche-cube"],
    },
    {
      id: "st-reputation",
      quadrant: "st",
      text:
        "Poursuivre l'effort sur la confiance avec l'appui du groupe et des autorités " +
        "sanitaires, en ciblant d'abord ceux qui cuisinent pour les autres.",
      links: ["s-qualite", "s-gamme", "t-substituts", "t-contrefacon"],
    },
    {
      id: "st-melanges",
      quadrant: "st",
      text:
        "Développer AjiGoût et des mélanges proches des usages locaux, sans affronter Maggi de " +
        "front sur le cube.",
      links: ["s-gamme", "t-substituts"],
    },
    {
      id: "wo-partenaire",
      quadrant: "wo",
      text:
        "S'appuyer sur un distributeur régional ou sur les grossistes, avec des conditions liées " +
        "aux volumes, plutôt que multiplier les petites factures en vente directe.",
      links: ["w-vente-directe", "w-distribution", "o-distribution"],
    },
    {
      id: "wo-mesure",
      quadrant: "wo",
      text:
        "Mesurer le marché réel du glutamate pur (restaurants, rôtisseurs, grossistes) et suivre " +
        "les ventes par canal, avec l'appui des données du paiement mobile.",
      links: ["w-donnees", "w-ecart-objectif", "o-mobile"],
    },
    {
      id: "wt-objectif",
      quadrant: "wt",
      text:
        "Obtenir du siège un objectif révisé, fondé sur la mesure du marché, et un peu de marge " +
        "locale sur les prix et les formats.",
      links: ["w-ecart-objectif", "w-decision", "t-grossistes"],
    },
    {
      id: "wt-recentrage",
      quadrant: "wt",
      text:
        "Recentrer l'effort sur la Côte d'Ivoire et quelques pays stables, plutôt que viser les " +
        "onze pays en même temps.",
      links: ["w-distribution", "t-zone"],
    },
  ],
  issues: [
    {
      id: "enjeu-confiance",
      title: "Gagner la confiance de ceux qui cuisinent",
      explanation:
        "Le problème principal d'AAO n'est ni la production ni d'abord le prix : c'est la " +
        "confiance. La rumeur pousse les cuisiniers à cacher le produit, donne un argument aux " +
        "grossistes et laisse le champ au cube. La première campagne (Delta, dépliants, équipes " +
        "sur les marchés) a ouvert la voie ; il faut la prolonger auprès de ceux qui cuisinent " +
        "pour les autres, avec l'appui du groupe et des autorités, et mesurer ses effets.",
      links: ["w-reputation", "t-substituts", "t-contrefacon", "st-reputation"],
    },
    {
      id: "enjeu-marche",
      title: "Choisir le bon marché et un objectif réaliste",
      explanation:
        "L'objectif de 2,5 milliards de yens a été fixé sans mesurer le marché du glutamate " +
        "pur ; la vente directe n'en couvre qu'environ 1,6 %. Les clients qui ont un vrai " +
        "intérêt économique au produit sont les restaurateurs et rôtisseurs, pas les " +
        "ménages. AAO doit mesurer ce marché, le placer au centre de sa stratégie et faire " +
        "réviser l'objectif sur cette base.",
      links: [
        "w-ecart-objectif",
        "w-donnees",
        "s-cout-plat",
        "so-restaurateurs",
        "wo-mesure",
        "wt-objectif",
      ],
    },
    {
      id: "enjeu-distribution",
      title: "Adapter le modèle de distribution",
      explanation:
        "Le modèle de vente directe au comptant, qui a fait ses preuves en Asie, produit ici des " +
        "milliers de petites factures stables et heurte des grossistes puissants. AAO doit " +
        "décider qui distribue quoi : grossistes, distributeur régional ou force de vente " +
        "propre, et sur combien de pays, pour vendre davantage par client à un coût soutenable.",
      links: [
        "w-vente-directe",
        "w-distribution",
        "t-grossistes",
        "wo-partenaire",
        "wt-recentrage",
      ],
    },
  ],
};
