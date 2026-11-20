/**
 * =============================================================
 *  Fichier    : m02-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 2, leçon 1 — « Ce que l'entreprise ne contrôle pas » : les
 *               strates de l'environnement. Sources : livre, module 2 (§ 2.1 : la
 *               pandémie et le télétravail chez les clients d'Infosystem ; macro- n'est
 *               pas macroéconomique). Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
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
  schema,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M02_L01: ContenuLecon = [
  p(
    "En mars 2020, des milliers de PME québécoises ont dû envoyer leurs employés travailler " +
      "à la maison presque du jour au lendemain. Chez les clients d'Infosystem, il a fallu " +
      "installer des accès à distance, acheter des routeurs, adopter la visioconférence. " +
      "En quelques semaines, la demande adressée à Infosystem a changé de nature. **Ni " +
      "l'entreprise ni ses clients n'avaient rien décidé : le changement venait de " +
      "l'extérieur.**",
  ),

  titre("Des cercles autour de l'entreprise"),
  p(
    "Tout ce qui entoure l'entreprise n'agit pas à la même distance. On le représente " +
      "comme des **strates** emboîtées, de la plus large à la plus proche.",
  ),
  schema(
    "strates",
    "Trois strates emboîtées autour de l'entreprise : le macroenvironnement (le plus " +
      "large), l'industrie, puis les concurrents et les marchés, les plus proches.",
  ),
  tableau(
    ["Strate", "Ce qu'on y trouve", "Module"],
    [
      [
        "Macroenvironnement",
        "Forces politiques, économiques, sociales, technologiques, écologiques et légales",
        "2 (ce module)",
      ],
      [
        "Industrie",
        "Les entreprises qui offrent des produits proches, leurs fournisseurs, leurs " +
          "clients, les substituts",
        "3",
      ],
      [
        "Concurrents et marchés",
        "Les rivaux directs et les groupes de clients que l'on sert",
        "3",
      ],
    ],
    "Plus une strate est large, moins l'entreprise a de prise sur elle.",
  ),
  definition(
    "Macroenvironnement",
    "L'ensemble des forces générales qui agissent **sur toute une industrie** et que " +
      "l'entreprise **ne contrôle pas**. Elle peut, en revanche, les voir venir, mesurer " +
      "leur effet probable et s'y préparer.",
  ),

  titre("Ne pas contrôler n'est pas subir"),
  p(
    "Face à une force externe, l'entreprise a trois attitudes possibles. Elle peut " +
      "**l'ignorer** et la découvrir trop tard. Elle peut **s'y adapter** : modifier son " +
      "offre, ses coûts, ses fournisseurs. Elle peut parfois **l'anticiper** et en faire " +
      "une occasion avant ses concurrents. Les entreprises qui ont tiré parti du " +
      "télétravail sont celles qui avaient déjà des offres d'accès à distance prêtes.",
  ),
  retenir("Le macroenvironnement ne se contrôle pas ; il se surveille.", [
    "Repérer tôt laisse le temps de choisir sa réponse.",
    "Une même force peut être une menace pour l'un et une occasion pour l'autre.",
    "Toutes les entreprises d'une industrie y sont exposées ; ce qui les distingue, c'est " +
      "leur réponse.",
  ]),

  titre("Un exemple près de chez vous"),
  p(
    "Une imprimerie d'Abidjan importe son papier d'Asie et le paie en dollars. Le franc " +
      "CFA est arrimé à l'euro : quand le dollar monte face à l'euro, son papier coûte " +
      "plus cher en francs CFA, sans qu'aucun fournisseur n'ait changé ses prix. La même " +
      "année, l'administration généralise les formulaires en ligne et commande moins " +
      "d'imprimés. Aucune de ces deux forces ne se discute ; toutes deux exigent une " +
      "réponse : achats en euros, stock de sécurité, nouveaux produits comme l'emballage.",
  ),
  piege(
    "Confondre **macroenvironnement** et **macroéconomie**. Croissance, inflation, taux " +
      "d'intérêt et change n'en sont qu'une partie. Une loi sur la protection des données " +
      "ou l'arrivée de l'intelligence artificielle ne sont pas des facteurs économiques, " +
      "et elles peuvent peser bien plus lourd sur une PME qu'une variation du taux " +
      "directeur.",
  ),
  notion(
    "Pour aller plus loin : où s'arrête l'industrie ?",
    p(
      "La frontière entre strates est une convention de travail. Un nouveau concurrent " +
        "relève de l'industrie ; la technologie qui lui permet d'entrer sur le marché " +
        "relève du macroenvironnement. Retenez une règle pratique :",
    ),
    liste(
      "si la force touche **toutes les industries** ou presque, elle est macro ;",
      "si elle concerne les acteurs d'**une industrie** précise (fournisseurs, rivaux, " +
        "substituts), elle relève du module 3.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Pour une compagnie de transport interurbain de Côte d'Ivoire, à quelle strate " +
      "appartient chacun de ces éléments ?",
    categories: ["Macroenvironnement", "Industrie", "Concurrents et marchés"],
    elements: [
      {
        texte: "La hausse du prix du gazole décidée par l'État.",
        categorie: 0,
        explication: "Elle touche tous les transporteurs et bien d'autres industries.",
      },
      {
        texte: "Le pouvoir des fabricants d'autocars, peu nombreux, sur les prix.",
        categorie: 1,
        explication: "Rapport de force avec les fournisseurs de l'industrie.",
      },
      {
        texte: "Une compagnie rivale qui ouvre la même ligne Abidjan-Bouaké.",
        categorie: 2,
        explication: "Un concurrent direct, sur le même marché.",
      },
      {
        texte: "L'urbanisation rapide, qui multiplie les trajets entre villes.",
        categorie: 0,
        explication: "Tendance socioculturelle générale.",
      },
      {
        texte: "Les étudiants qui voyagent surtout en fin de semaine.",
        categorie: 2,
        explication: "Un groupe de clients que l'on sert : c'est le marché.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e2",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Le macroenvironnement se limite aux indicateurs économiques.",
        vrai: false,
        explication:
          "Il couvre aussi le politique, le social, la technologie, l'écologie et le légal.",
      },
      {
        texte: "Deux concurrents exposés au même macroenvironnement peuvent connaître des " +
          "sorts très différents.",
        vrai: true,
        explication: "Ce qui les distingue, c'est leur réponse et leurs ressources.",
      },
      {
        texte: "Puisqu'on ne contrôle pas le macroenvironnement, inutile de l'analyser.",
        vrai: false,
        explication: "On ne le contrôle pas, mais on peut l'anticiper et s'y préparer.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e3",
    question:
      "Pensez à une organisation que vous connaissez. Quel changement venu de l'extérieur " +
      "l'a récemment obligée à réagir dans l'urgence ? Aurait-on pu le voir venir ?",
    corrige: [
      "Un changement externe précis : une loi, une hausse de prix, une nouvelle technologie, " +
        "une crise sanitaire ou climatique.",
      "Ses signes avant-coureurs : un projet de loi discuté, une tendance déjà visible " +
        "ailleurs, des alertes d'organismes publics.",
      "Ce qu'une veille régulière aurait permis : préparer une réponse avant d'y être " +
        "contraint.",
    ],
  }),

  appliquez(
    1,
    "Ouvrez l'étape 1 de votre étude et notez, sans les classer encore, trois forces " +
      "externes qui ont pesé sur votre organisation ces deux dernières années.",
  ),
  fiche(
    "Trois strates : macroenvironnement, industrie, concurrents et marchés.",
    "Le macroenvironnement agit sur toute une industrie ; l'entreprise ne le contrôle pas.",
    "Ne pas contrôler n'est pas subir : on peut l'anticiper et s'y préparer.",
    "Macroenvironnement ≠ macroéconomie.",
  ),
];
