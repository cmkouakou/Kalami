/**
 * =============================================================
 *  Fichier    : etape-7.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 7 (choix) : stratégie
 *               générique, les cinq options de la question 8 du livre plus le statu quo et
 *               le partenariat, évaluées (pertinence, acceptabilité, faisabilité), énoncé
 *               de la stratégie retenue et renoncements.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/choice.ts
 * =============================================================
 */

import "server-only";

import type { ChoicePayload } from "@/lib/strategy/templates/choice";

// ==================== CORRIGÉ ====================

export const CASE_STEP_7: ChoicePayload = {
  generic: {
    id: "generic",
    position: "focusDifferentiation",
    justification:
      "AAO ne peut gagner ni par les coûts (les contrefaçons seront toujours moins chères) ni " +
      "sur tout le marché de l'assaisonnement (le cube y règne, avec la confiance des " +
      "ménagères). Elle doit viser une cible étroite, ceux qui cuisinent en volume, et s'y " +
      "différencier par ce que personne d'autre n'offre : un produit authentique de qualité " +
      "constante, un coût par plat plus bas que le cube, des grands formats livrés " +
      "régulièrement et une explication honnête du produit.",
  },
  options: [
    {
      id: "opt-restaurateurs",
      text:
        "Concentrer l'effort commercial sur les restaurateurs, maquis et rôtisseurs : grands " +
        "formats, livraison à date fixe, démonstration du coût par plat.",
      ansoff: "penetration",
      relevance: "yes",
      acceptability: "yes",
      feasibility: "yes",
      comment:
        "Répond directement aux enjeux du marché et de la confiance : ce sont les clients qui " +
        "tirent un vrai gain du produit et qui achètent par gros volumes (la facture moyenne " +
        "des développeurs, cinq fois plus élevée, le montre). Acceptable pour le siège, car " +
        "elle reste dans le produit actuel. Faisable avec l'équipe existante, réorientée.",
      decision: "retained",
      issueLinks: ["enjeu-marche", "enjeu-confiance"],
    },
    {
      id: "opt-reputation",
      text:
        "S'attaquer en priorité à la réputation du produit : poursuivre la campagne lancée avec " +
        "Delta, démonstrations, appui scientifique du groupe et des autorités sanitaires.",
      ansoff: "penetration",
      relevance: "yes",
      acceptability: "yes",
      feasibility: "partial",
      comment:
        "Pertinente : la confiance est le problème principal. Mais convaincre toutes les " +
        "ménagères coûte cher et prend des années, face à un cube installé depuis des " +
        "décennies. Retenue sous une forme ciblée : rassurer d'abord ceux qui cuisinent pour " +
        "les autres, pour qu'ils puissent assumer le produit, et mesurer l'effet chaque année.",
      decision: "retained",
      issueLinks: ["enjeu-confiance"],
    },
    {
      id: "opt-melanges",
      text:
        "Lancer de nouveaux produits mélangés comme AjiGoût, pour entrer dans l'univers du " +
        "bouillon et toucher les ménages.",
      ansoff: "productDevelopment",
      relevance: "partial",
      acceptability: "yes",
      feasibility: "partial",
      comment:
        "Contourne en partie la méfiance envers le glutamate pur, mais place AAO sur le terrain " +
        "de Maggi, Jumbo et Doli, qui ont les marques, la publicité et la distribution. AjiGoût " +
        "est gardé dans la gamme, sans nouveau lancement avant d'avoir conquis la cible " +
        "professionnelle : AAO n'a pas les moyens de mener deux batailles à la fois.",
      decision: "rejected",
      issueLinks: ["enjeu-confiance", "enjeu-marche"],
    },
    {
      id: "opt-distributeur",
      text:
        "Passer par les grossistes et un distributeur régional plutôt que par une force de " +
        "vente propre, en gardant une équipe directe pour les clients professionnels.",
      ansoff: "marketDevelopment",
      relevance: "yes",
      acceptability: "partial",
      feasibility: "partial",
      comment:
        "Pertinente : la vente directe au comptant produit des milliers de petites factures et " +
        "heurte les grossistes, qui commandent l'accès aux marchés. Acceptabilité partielle : " +
        "le siège tient à ce modèle, qui a réussi en Asie, et l'équipe de vente doit être " +
        "réorientée, pas réduite. Faisabilité partielle : il faut trouver un partenaire fiable " +
        "et négocier des conditions liées aux volumes.",
      decision: "retained",
      issueLinks: ["enjeu-distribution"],
    },
    {
      id: "opt-pays",
      text:
        "Réduire l'ambition géographique : réussir en Côte d'Ivoire, puis ouvrir au plus trois " +
        "pays voisins stables, au lieu des onze pays visés.",
      ansoff: "penetration",
      relevance: "yes",
      acceptability: "partial",
      feasibility: "yes",
      comment:
        "Pertinente : l'export est à construire et une partie de la zone est instable (Mali, " +
        "Burkina Faso). Faisable, car elle libère des moyens. Acceptabilité partielle : elle " +
        "suppose que le siège accepte de réviser l'objectif fixé pour toute la zone, d'où " +
        "l'importance de lui apporter une mesure du marché.",
      decision: "retained",
      issueLinks: ["enjeu-marche", "enjeu-distribution"],
    },
    {
      id: "opt-statu-quo",
      text:
        "Garder le modèle actuel et intensifier la vente directe auprès des détaillantes et des " +
        "ménages pour atteindre l'objectif de 2,5 milliards de yens.",
      ansoff: "penetration",
      relevance: "no",
      acceptability: "yes",
      feasibility: "no",
      comment:
        "Acceptable pour le siège, car rien ne change, mais ni pertinente ni faisable : la " +
        "vente directe représente environ 1,6 % de l'objectif, avec des ventes stables. Même " +
        "multipliée par dix, elle resterait loin du compte.",
      decision: "rejected",
      issueLinks: ["enjeu-marche", "enjeu-distribution"],
    },
    {
      id: "opt-partenaire",
      text:
        "Confier toute la commercialisation à un acteur déjà installé dans la région, AAO ne " +
        "gardant que l'usine et la qualité.",
      ansoff: "marketDevelopment",
      relevance: "partial",
      acceptability: "partial",
      feasibility: "partial",
      comment:
        "Réglerait d'un coup la question de la distribution, mais pas celle de la confiance, et " +
        "ferait perdre à AAO le contact avec ses clients. Option écartée pour 2016, gardée en " +
        "réserve : si les objectifs révisés ne sont pas atteints fin 2017, la question de la " +
        "filiale autonome devra être posée au siège.",
      decision: "rejected",
      issueLinks: ["enjeu-distribution"],
    },
  ],
  statement: {
    id: "statement",
    text:
      "De 2016 à 2018, AAO devient le fournisseur de goût des professionnels de la restauration " +
      "populaire en Côte d'Ivoire. Elle concentre sa force de vente sur les restaurateurs, " +
      "maquis et rôtisseurs, avec des grands formats livrés régulièrement et la démonstration " +
      "du coût par plat. Elle confie les marchés et les détaillantes aux grossistes, avec des " +
      "règles de partage claires et des conditions liées aux volumes, et passe par un " +
      "distributeur régional dans au plus trois pays voisins stables. Elle mène un effort " +
      "ciblé sur la confiance, d'abord auprès de ceux qui cuisinent pour les autres. Elle " +
      "mesure le marché réel du glutamate pur dès 2016 et propose au siège un objectif révisé " +
      "sur cette base.",
  },
  renunciations: [
    {
      id: "ren-objectif",
      text:
        "Poursuivre l'objectif de 2,5 milliards de yens dès 2016 sans mesure du " +
        "marché.",
    },
    {
      id: "ren-onze-pays",
      text: "Couvrir les onze pays de la zone avant 2018.",
    },
    {
      id: "ren-cube",
      text:
        "Affronter le bouillon cube de front auprès des ménages, ou lancer de " +
        "nouveaux mélanges avant 2018.",
    },
    {
      id: "ren-vente-detail",
      text:
        "Vendre en direct aux détaillantes dans les zones couvertes par un " +
        "grossiste partenaire.",
    },
  ],
};
