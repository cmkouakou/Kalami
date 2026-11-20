/**
 * =============================================================
 *  Fichier    : m08-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 8, leçon 1 — « Domaines d'activité stratégique : sur quel terrain
 *               se battre ? » : définition du DAS, les trois tests (clients, concurrents,
 *               facteurs de succès), le cas d'Infosystem (un seul DAS), le lien entre
 *               stratégie corporative et concurrentielle. Sources : livre, module 8
 *               (§ 8.1). Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
  exercice,
  fiche,
  liste,
  notion,
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M08_L01: ContenuLecon = [
  p(
    "Avant de se demander comment battre ses concurrents, il faut savoir lesquels. Une " +
      "entreprise qui vend à la fois des engrais aux coopératives et des semences en " +
      "sachets aux jardiniers du dimanche ne mène pas une bataille, mais deux. Chacune a " +
      "ses clients, ses rivaux et ses règles. Ce découpage porte un nom : le domaine " +
      "d'activité stratégique.",
  ),

  titre("Une activité qui mérite sa propre stratégie"),
  definition(
    "Domaine d'activité stratégique (DAS)",
    "Une activité qui a ses propres clients, ses propres concurrents et ses propres " +
      "facteurs clés de succès, et qui peut donc avoir sa propre stratégie concurrentielle.",
  ),
  p(
    "Le DAS fait le pont entre deux niveaux vus au module 1. La stratégie corporative " +
      "choisit **dans quels DAS** l'entreprise sera présente. La stratégie concurrentielle " +
      "décide **comment gagner dans chacun**. Sans découpage, on applique à tout une seule " +
      "recette, souvent celle de l'activité la plus ancienne.",
  ),

  titre("Trois tests pour découper"),
  p(
    "Deux activités appartiennent au même DAS quand elles passent ensemble les trois " +
      "tests suivants. Il suffit d'un écart net sur l'un d'eux pour envisager deux DAS.",
  ),
  liste(
    "**Les clients** : s'adressent-elles aux mêmes acheteurs, avec les mêmes attentes ?",
    "**Les concurrents** : affrontent-elles les mêmes rivaux ?",
    "**Les facteurs de succès** : faut-il exceller dans les mêmes choses pour gagner ?",
  ),
  p(
    "Un critère complémentaire aide à trancher : les ressources partagées. Si les deux " +
      "activités mobilisent les mêmes équipes, les mêmes machines et les mêmes canaux, " +
      "les séparer sur le papier ne changera rien dans les faits.",
  ),
  tableau(
    ["Test", "Engrais pour coopératives", "Semences en sachets"],
    [
      ["Clients", "Coopératives, achats en tonnes", "Particuliers, achats d'impulsion"],
      ["Concurrents", "Grands négociants agricoles", "Quincailleries, marchés, en ligne"],
      ["Facteurs de succès", "Prix, crédit de campagne, livraison", "Présentoir, marque, conseil"],
      ["Verdict", "Un DAS", "Un autre DAS"],
    ],
    "Une même entreprise, deux terrains de bataille.",
  ),

  titre("Infosystem : un seul DAS"),
  p(
    "Infosystem offre quatre services : l'audit, la gestion des changements, " +
      "l'intervention d'urgence et la gestion courante. On pourrait croire à quatre DAS. " +
      "Les tests disent l'inverse : ce sont les mêmes PME clientes, les mêmes concurrents " +
      "(les firmes de services gérés de la région et les techniciens indépendants), et les " +
      "mêmes facteurs de succès (rapidité, confiance, compétence). Les mêmes techniciens " +
      "rendent les quatre services.",
  ),
  retenir(
    "Un produit n'est pas un DAS. Quatre services vendus aux mêmes clients, contre les " +
      "mêmes rivaux, forment une seule activité stratégique.",
  ),
  p(
    "Ce constat compte pour la suite. Plusieurs outils célèbres, comme la matrice BCG " +
      "(leçon 9.4), servent à arbitrer entre plusieurs DAS. Ils disent peu de choses à une " +
      "entreprise qui n'en a qu'un.",
  ),
  piege(
    "Découper selon l'organigramme. Avoir un service « Grands comptes » et un service " +
      "« PME » ne crée pas deux DAS si les deux affrontent les mêmes rivaux avec les mêmes " +
      "arguments. À l'inverse, une même équipe peut servir deux DAS bien distincts.",
  ),

  titre("Quand un DAS se scinde"),
  p(
    "Les DAS ne sont pas figés. Une activité peut se dédoubler quand une clientèle nouvelle " +
      "apparaît avec des attentes propres. Si Infosystem lance une offre de conformité " +
      "vendue aux directions juridiques, en concurrence avec des cabinets d'avocats, elle " +
      "aura créé un second DAS, avec sa propre stratégie à définir.",
  ),
  notion(
    "Pour aller plus loin : DAS et segment",
    p(
      "Le segment est une notion de marketing : un groupe de clients aux besoins proches, " +
        "à qui l'on adapte l'offre. Le DAS est une notion de stratégie : un terrain de " +
        "concurrence. Un DAS peut contenir plusieurs segments (les PME de services et les " +
        "PME industrielles d'Infosystem), sans qu'il faille une stratégie distincte pour " +
        "chacun.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Une boulangerie d'Abidjan vend du pain au comptoir et livre chaque matin trois " +
      "hôtels, en concurrence avec deux boulangeries industrielles. Combien de DAS ?",
    choix: [
      {
        texte: "Un seul : c'est le même pain, cuit dans le même four.",
        explication: "Le produit ne suffit pas : clients, rivaux et règles diffèrent.",
      },
      {
        texte: "Deux : le comptoir et la livraison aux hôtels.",
        explication:
          "Oui : passants contre acheteurs d'hôtel, voisins contre industriels, " +
          "proximité contre régularité et prix au volume.",
      },
      {
        texte: "Trois : un par hôtel.",
        explication: "Les trois hôtels ont les mêmes attentes et les mêmes fournisseurs.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "vrai-faux",
    id: "e2",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Chaque produit d'une entreprise constitue un DAS.",
        vrai: false,
        explication: "Les quatre services d'Infosystem forment un seul DAS.",
      },
      {
        texte: "La stratégie corporative choisit les DAS ; la stratégie concurrentielle " +
          "décide comment gagner dans chacun.",
        vrai: true,
        explication: "C'est le pont entre les deux niveaux.",
      },
      {
        texte: "Une activité peut devenir un nouveau DAS si elle vise des clients et des " +
          "rivaux différents.",
        vrai: true,
        explication: "L'offre de conformité vendue aux directions juridiques en est un exemple.",
      },
    ],
  }),
  exercice({
    type: "classement",
    id: "e3",
    consigne:
      "Un groupe ivoirien exploite ces activités. Rangez chacune avec celle qui partage son " +
      "terrain de concurrence.",
    categories: ["Transport de passagers", "Transport de marchandises"],
    elements: [
      {
        texte: "Cars de ligne Abidjan–Bouaké",
        categorie: 0,
        explication: "Voyageurs, gares routières, ponctualité et confort.",
      },
      {
        texte: "Camions de cacao vers le port de San-Pedro",
        categorie: 1,
        explication: "Exportateurs, transporteurs routiers, coût à la tonne.",
      },
      {
        texte: "Billets en ligne pour la ligne Abidjan–Yamoussoukro",
        categorie: 0,
        explication: "Un canal de vente, pas un autre DAS : mêmes voyageurs, mêmes rivaux.",
      },
      {
        texte: "Livraison de ciment aux chantiers",
        categorie: 1,
        explication: "Entreprises du bâtiment, transporteurs, délais et capacité de charge.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Listez les activités de votre organisation. Appliquez-leur les trois tests et " +
      "dites combien de DAS vous comptez, en justifiant chaque frontière.",
    corrige: [
      "Une liste complète des activités, pas seulement des produits phares.",
      "Pour chacune : ses clients, ses concurrents, ses facteurs de succès.",
      "Des regroupements justifiés par les tests, pas par l'organigramme.",
      "Un nombre de DAS assumé, et la remarque que les outils de portefeuille ne servent " +
        "que s'il y en a plusieurs.",
    ],
  }),

  appliquez(
    7,
    "Avant de remplir l'étape 7, notez combien de DAS compte votre organisation. S'il y en " +
      "a plusieurs, faites l'exercice de la stratégie générique pour chacun.",
  ),
  fiche(
    "Un DAS a ses propres clients, concurrents et facteurs de succès.",
    "Corporatif : dans quels DAS être ? Concurrentiel : comment gagner dans chacun ?",
    "Un produit ou un service de l'organigramme n'est pas forcément un DAS.",
    "Infosystem n'a qu'un DAS : les services informatiques gérés pour les PME.",
    "Un DAS peut se scinder quand une clientèle nouvelle apparaît.",
  ),
];
