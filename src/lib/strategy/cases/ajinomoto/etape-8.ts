/**
 * =============================================================
 *  Fichier    : etape-8.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 8 (action) : feuille de
 *               route 2016-2018 en six chantiers, tableau de bord équilibré et risques
 *               (question 9 du livre). Les chantiers mettent en œuvre les options retenues
 *               à l'étape 7 et servent les objectifs de l'étape 6.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/action.ts
 * =============================================================
 */

import "server-only";

import type { ActionPayload } from "@/lib/strategy/templates/action";

// ==================== CORRIGÉ ====================

export const CASE_STEP_8: ActionPayload = {
  workstreams: [
    {
      id: "ch-mesure",
      name: "Mesurer le marché du glutamate pur et réviser l'objectif",
      owner:
        "Administration des ventes et marketing, avec la direction générale",
      start: "2016-03",
      end: "2016-12",
      phases: [
        {
          id: "ph-mesure-recensement",
          name: "Recensement des restaurants, maquis et rôtisseurs d'Abidjan et de Bouaké",
          start: "2016-03",
          end: "2016-06",
        },
        {
          id: "ph-mesure-enquete",
          name: "Enquête sur les volumes achetés, les prix payés et la perception du produit",
          start: "2016-05",
          end: "2016-08",
        },
        {
          id: "ph-mesure-objectif",
          name: "Proposition d'objectif révisé au siège pour le budget 2017",
          start: "2016-09",
          end: "2016-12",
        },
      ],
      optionLinks: ["opt-restaurateurs", "opt-pays"],
      objectiveLinks: ["obj-mesure"],
    },
    {
      id: "ch-restauration",
      name: "Offre dédiée aux restaurateurs et rôtisseurs",
      owner:
        "Direction des ventes (canal distributeurs, grossistes et restaurants)",
      start: "2016-04",
      end: "2018-12",
      phases: [
        {
          id: "ph-resto-test",
          name: "Test de grands formats et de livraisons à date fixe chez dix clients",
          start: "2016-04",
          end: "2016-07",
        },
        {
          id: "ph-resto-siege",
          name: "Proposition des formats et des prix aux dirigeants et au siège",
          start: "2016-08",
          end: "2016-10",
        },
        {
          id: "ph-resto-abidjan",
          name: "Déploiement à Abidjan",
          start: "2016-11",
          end: "2017-06",
        },
        {
          id: "ph-resto-regions",
          name: "Déploiement à Bouaké et Daloa",
          start: "2017-07",
          end: "2017-12",
        },
        {
          id: "ph-resto-ambassadeurs",
          name: "Programme de clients ambassadeurs qui affichent le produit",
          start: "2018-01",
          end: "2018-12",
        },
      ],
      optionLinks: ["opt-restaurateurs"],
      objectiveLinks: ["obj-restaurateurs", "obj-facture"],
    },
    {
      id: "ch-confiance",
      name: "Confiance : rassurer d'abord ceux qui cuisinent pour les autres",
      owner: "Responsable marketing, avec l'appui du groupe",
      start: "2016-06",
      end: "2018-12",
      phases: [
        {
          id: "ph-conf-dossier",
          name: "Dossier scientifique du groupe et appui demandé aux autorités sanitaires",
          start: "2016-06",
          end: "2016-12",
        },
        {
          id: "ph-conf-enquete",
          name: "Première enquête de perception (restaurateurs et ménagères)",
          start: "2016-07",
          end: "2016-08",
        },
        {
          id: "ph-conf-demos",
          name: "Démonstrations chez les restaurateurs et dans les coopératives de détaillantes",
          start: "2017-01",
          end: "2018-12",
        },
        {
          id: "ph-conf-suivi",
          name: "Enquêtes de suivi annuelles",
          start: "2017-11",
          end: "2018-11",
        },
      ],
      optionLinks: ["opt-reputation"],
      objectiveLinks: ["obj-confiance"],
    },
    {
      id: "ch-grossistes",
      name: "Partage des canaux avec les grossistes",
      owner: "Direction des ventes",
      start: "2016-06",
      end: "2017-06",
      phases: [
        {
          id: "ph-gros-diagnostic",
          name: "Suivi des achats par grossiste et carte des zones couvertes",
          start: "2016-06",
          end: "2016-09",
        },
        {
          id: "ph-gros-negociation",
          name: "Négociation de la règle de partage et des remises liées aux volumes",
          start: "2016-10",
          end: "2017-03",
        },
        {
          id: "ph-gros-application",
          name: "Retrait de la vente directe des zones couvertes par un partenaire",
          start: "2017-01",
          end: "2017-06",
        },
      ],
      optionLinks: ["opt-distributeur"],
      objectiveLinks: ["obj-distribution", "obj-facture"],
    },
    {
      id: "ch-export",
      name: "Export par un distributeur régional, trois pays au plus",
      owner: "Responsable export",
      start: "2016-09",
      end: "2018-12",
      phases: [
        {
          id: "ph-exp-pays",
          name: "Choix des pays selon la stabilité, la taille de la restauration et l'accès",
          start: "2016-09",
          end: "2016-12",
        },
        {
          id: "ph-exp-partenaire",
          name: "Sélection et contrat du distributeur régional",
          start: "2017-01",
          end: "2017-06",
        },
        {
          id: "ph-exp-pays1",
          name: "Lancement dans le premier pays",
          start: "2017-07",
          end: "2017-12",
        },
        {
          id: "ph-exp-pays23",
          name: "Extension à deux autres pays si le premier atteint sa cible",
          start: "2018-01",
          end: "2018-12",
        },
      ],
      optionLinks: ["opt-distributeur", "opt-pays"],
      objectiveLinks: ["obj-distribution"],
    },
    {
      id: "ch-equipe",
      name: "Réorientation de l'équipe commerciale vers les clients professionnels",
      owner: "Direction des ventes, avec les ressources humaines",
      start: "2016-05",
      end: "2017-06",
      phases: [
        {
          id: "ph-eq-partage",
          name: "Partage du diagnostic et formation à la vente aux professionnels",
          start: "2016-05",
          end: "2016-09",
        },
        {
          id: "ph-eq-prime",
          name: "Proposition d'une prime liée au volume par client",
          start: "2016-10",
          end: "2017-03",
        },
        {
          id: "ph-eq-tournees",
          name: "Nouvelles tournées centrées sur les restaurateurs",
          start: "2017-01",
          end: "2017-06",
        },
      ],
      optionLinks: ["opt-restaurateurs"],
      objectiveLinks: ["obj-restaurateurs", "obj-facture"],
    },
  ],
  indicators: [
    {
      id: "ind-ventes",
      perspective: "financial",
      name: "Ventes totales d'AAO, tous canaux, comparées à l'objectif révisé",
      definition:
        "Montant hors taxes facturé par tous les canaux (vente directe, grossistes, " +
        "restaurants, export), comparé à l'objectif révisé adopté au budget 2017.",
      target: "100 % de l'objectif révisé",
      frequency: "quarterly",
      owner: "Administration des ventes",
      kind: "lagging",
      objectiveLinks: ["obj-mesure"],
    },
    {
      id: "ind-facture",
      perspective: "financial",
      name: "Facture moyenne de la vente directe",
      definition:
        "Montant hors taxes facturé par la vente directe, divisé par le nombre de factures.",
      target: "Au moins 7 000 FCFA fin 2017 (2 900 FCFA en 2015-2016)",
      frequency: "monthly",
      owner: "Administration des ventes",
      kind: "lagging",
      objectiveLinks: ["obj-facture"],
    },
    {
      id: "ind-restaurateurs",
      perspective: "customer",
      name: "Restaurateurs et rôtisseurs clients actifs",
      definition:
        "Nombre de clients professionnels ayant acheté au moins une fois dans le mois.",
      target: "Doublé fin 2017 par rapport au recensement de 2016",
      frequency: "monthly",
      owner: "Direction des ventes",
      kind: "lagging",
      objectiveLinks: ["obj-restaurateurs"],
    },
    {
      id: "ind-reachat",
      perspective: "customer",
      name: "Taux de réachat des clients professionnels",
      definition:
        "Part des restaurateurs et rôtisseurs clients un mois donné qui achètent de nouveau le " +
        "mois suivant.",
      target: "Cible fixée après les six premiers mois de déploiement",
      frequency: "monthly",
      owner: "Direction des ventes",
      kind: "leading",
      objectiveLinks: ["obj-restaurateurs"],
    },
    {
      id: "ind-usage-assume",
      perspective: "customer",
      name: "Restaurateurs qui utilisent le produit sans le cacher",
      definition:
        "Part des restaurateurs clients interrogés qui déclarent utiliser le produit " +
        "ouvertement devant leurs clients (enquête annuelle).",
      target: "+20 points par rapport à l'enquête de 2016, fin 2018",
      frequency: "annual",
      owner: "Responsable marketing",
      kind: "lagging",
      objectiveLinks: ["obj-confiance"],
    },
    {
      id: "ind-livraisons",
      perspective: "internal",
      name: "Livraisons aux clients professionnels à la date prévue",
      definition:
        "Part des livraisons aux restaurateurs effectuées à la date convenue.",
      target: "95 %",
      frequency: "monthly",
      owner: "Transit et logistique",
      kind: "leading",
      objectiveLinks: ["obj-restaurateurs"],
    },
    {
      id: "ind-litiges",
      perspective: "internal",
      name: "Litiges de zone avec les grossistes",
      definition:
        "Nombre de plaintes de grossistes partenaires pour une vente directe dans leur zone.",
      target: "Zéro après juin 2017",
      frequency: "quarterly",
      owner: "Direction des ventes",
      kind: "leading",
      objectiveLinks: ["obj-distribution"],
    },
    {
      id: "ind-volume-grossistes",
      perspective: "internal",
      name: "Volume acheté par les grossistes partenaires",
      definition:
        "Tonnes achetées par les grossistes signataires de la règle de partage.",
      target: "En hausse chaque trimestre à partir de 2017",
      frequency: "quarterly",
      owner: "Direction des ventes",
      kind: "lagging",
      objectiveLinks: ["obj-distribution"],
    },
    {
      id: "ind-pays",
      perspective: "internal",
      name: "Pays couverts par un distributeur régional actif",
      definition:
        "Nombre de pays où le distributeur a passé au moins une commande par trimestre.",
      target: "Un pays fin 2017 ; trois au plus fin 2018",
      frequency: "semiannual",
      owner: "Responsable export",
      kind: "lagging",
      objectiveLinks: ["obj-distribution"],
    },
    {
      id: "ind-suivi-canal",
      perspective: "learning",
      name: "Ventes suivies par canal et par client",
      definition:
        "Part des ventes couvertes par un relevé mensuel par canal et par client, y compris " +
        "les données du paiement mobile.",
      target: "100 % des ventes en Côte d'Ivoire fin 2016",
      frequency: "monthly",
      owner: "Administration des ventes",
      kind: "leading",
      objectiveLinks: ["obj-mesure"],
    },
    {
      id: "ind-formation",
      perspective: "learning",
      name: "Équipe formée à la vente aux professionnels",
      definition: "Part des vendeurs et superviseurs ayant suivi la formation.",
      target: "100 % fin septembre 2016",
      frequency: "quarterly",
      owner: "Direction des ventes",
      kind: "leading",
      objectiveLinks: ["obj-facture", "obj-restaurateurs"],
    },
    {
      id: "ind-demos",
      perspective: "learning",
      name: "Démonstrations réalisées",
      definition:
        "Nombre de démonstrations de cuisine chez des restaurateurs ou dans des coopératives de " +
        "détaillantes.",
      target: "Cible mensuelle fixée par agence au lancement",
      frequency: "monthly",
      owner: "Responsable marketing",
      kind: "leading",
      objectiveLinks: ["obj-confiance"],
    },
  ],
  risks: [
    {
      id: "risk-objectif",
      text: "Le siège maintient l'objectif de 2,5 milliards de yens malgré la mesure du marché.",
      signal:
        "Le budget 2017 reprend l'objectif initial sans tenir compte de l'étude.",
      response:
        "Présenter l'étude avec la direction régionale ; proposer des jalons trimestriels qui " +
        "montrent la progression réelle par canal.",
      workstream: "ch-mesure",
    },
    {
      id: "risk-grossistes",
      text:
        "Les grossistes refusent la règle de partage ou se tournent vers les contrefaçons, " +
        "moins chères.",
      signal:
        "Baisse des achats des grossistes pendant deux trimestres de suite.",
      response:
        "Conditions liées aux volumes réellement vendus ; maintien de la vente directe dans les " +
        "seules zones non couvertes.",
      workstream: "ch-grossistes",
    },
    {
      id: "risk-cache",
      text:
        "Les restaurateurs continuent de cacher le produit et refusent des grands formats " +
        "visibles.",
      signal: "Taux de réachat faible après le test chez dix clients.",
      response:
        "Proposer un conditionnement discret pour la cuisine ; s'appuyer sur les premiers " +
        "clients ambassadeurs.",
      workstream: "ch-restauration",
    },
    {
      id: "risk-equipe",
      text: "L'équipe commerciale, déjà insatisfaite des salaires, vit mal le changement de rôle.",
      signal:
        "Baisse du nombre de visites par vendeur et des ventes aux nouveaux clients.",
      response:
        "Associer l'équipe au diagnostic ; défendre auprès des dirigeants une prime liée au " +
        "volume par client.",
      workstream: "ch-equipe",
    },
    {
      id: "risk-zone",
      text:
        "Insécurité ou fermeture de frontières dans les pays d'export choisis (Mali, Burkina " +
        "Faso, suites d'Ebola).",
      signal: "Retards de livraison ou de paiement du distributeur régional.",
      response:
        "Limiter l'export aux pays stables ; paiement d'avance ou garanti par le distributeur.",
      workstream: "ch-export",
    },
    {
      id: "risk-rumeur",
      text:
        "La rumeur repart (contrefaçons plus nombreuses, messages hostiles relayés sur les " +
        "marchés).",
      signal:
        "Hausse des contrefaçons relevées par l'équipe terrain ; questions plus fréquentes.",
      response:
        "Signalement aux autorités ; démonstrations renforcées dans les marchés concernés.",
      workstream: "ch-confiance",
    },
  ],
};
