/**
 * =============================================================
 *  Fichier    : m03-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 3, leçon 4 — « Facteurs clés de succès et comparaison » : ce qui
 *               compte pour les clients, la grille de comparaison par types de
 *               concurrents, lire le portrait et en tirer des pistes. Sources : livre,
 *               module 3 (§ 3.5, tableau 3.1 et pistes d'Infosystem) ; Whittington et
 *               coll., « Stratégique », 2023. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
  etapes,
  exercice,
  fiche,
  notion,
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M03_L04: ContenuLecon = [
  p(
    "Les cinq forces décrivent l'industrie. Elles ne disent pas où se situe votre " +
      "entreprise à l'intérieur. Pour le savoir, il faut se comparer aux autres, et pas sur " +
      "n'importe quoi : sur ce qui compte **pour les clients**.",
  ),

  titre("Les facteurs clés de succès"),
  definition(
    "Facteur clé de succès (FCS)",
    "Ce qu'une entreprise doit absolument bien faire pour réussir dans une industrie " +
      "donnée, parce que les clients y attachent de l'importance ou parce que la " +
      "rentabilité en dépend. Les FCS appartiennent à l'industrie, pas à une entreprise.",
  ),
  p("Trois questions aident à les trouver :"),
  etapes(
    "**Qu'est-ce qui fait choisir un fournisseur plutôt qu'un autre ?** Posez la question " +
      "aux clients eux-mêmes, et pas seulement à l'équipe de vente.",
    "**Qu'est-ce qui fait perdre un client ?** Les départs disent souvent plus que les " +
      "arrivées.",
    "**Qu'est-ce qui fait la rentabilité ?** Taux d'occupation, coût d'acquisition d'un " +
      "client, rotation des stocks : chaque industrie a ses leviers économiques.",
  ),
  tableau(
    ["Industrie", "Exemples de facteurs clés de succès"],
    [
      [
        "Services informatiques aux PME",
        "Rapidité d'intervention, confiance, expertise en sécurité",
      ],
      ["Transport interurbain par car", "Sécurité, ponctualité, prix, fréquence des départs"],
      ["Distribution de produits alimentaires", "Couverture du territoire, prix, disponibilité"],
      ["École privée", "Taux de réussite aux examens, encadrement, réputation"],
    ],
  ),
  piege(
    "Confondre ses propres forces avec les facteurs clés de succès de l'industrie. On " +
      "commence par ce que les clients valorisent ; on regarde ensuite si l'on y est bon. " +
      "Faire l'inverse conduit à choisir des critères qui flattent l'entreprise.",
  ),

  titre("La grille de comparaison"),
  p(
    "On place les facteurs clés en lignes et les acteurs en colonnes, puis on évalue " +
      "chacun. Quand le marché compte des dizaines d'acteurs, on compare par **grands types " +
      "de concurrents** plutôt qu'entreprise par entreprise : c'est plus lisible et plus utile.",
  ),
  tableau(
    ["Critère", "Infosystem", "Autres PME locales", "Grandes firmes"],
    [
      ["Rapidité d'intervention", "Forte", "Variable", "Moyenne"],
      ["Service personnalisé", "Forte", "Forte", "Faible"],
      ["Étendue de l'offre", "Moyenne", "Faible à moyenne", "Forte"],
      ["Expertise en cybersécurité et nuage", "Moyenne", "Variable", "Forte"],
      ["Prix pour une PME", "Compétitif", "Compétitif", "Élevé"],
      ["Capacité à prendre de nouveaux clients", "Faible", "Variable", "Forte"],
    ],
    "Position d'Infosystem face à ses principaux types de concurrents (livre, tableau 3.1).",
  ),

  titre("Lire le portrait"),
  p(
    "Une grille ne vaut que par ce qu'on en tire. Trois lectures sont utiles. **Où " +
      "gagne-t-on ?** Infosystem gagne sur la proximité : elle intervient vite et connaît " +
      "ses clients. **Où perd-on ?** Sur l'étendue de l'offre, l'expertise de pointe et, " +
      "surtout, la capacité d'accueillir de nouveaux clients. **Qu'est-ce qui nous " +
      "distingue vraiment ?** Ici, la surprise : le service personnalisé est aussi le point " +
      "fort des autres PME locales. Il ne suffit donc pas à distinguer Infosystem.",
  ),
  retenir("Un point fort partagé n'est pas un avantage.", [
    "Ce que tous vos concurrents font bien est un minimum, pas une différence.",
    "La différence se trouve là où vous êtes seul, ou presque, à bien faire.",
  ]),
  p("De ce portrait, le livre tire trois pistes pour Infosystem :"),
  etapes(
    "Développer une **expertise reconnue** en cybersécurité et en conformité, là où la " +
      "demande grandit.",
    "Offrir une **tarification lisible**, par exemple un forfait mensuel par poste de " +
      "travail, que les PME comparent facilement.",
    "**Formaliser la qualité de service** : engagements de délai écrits, bilans réguliers.",
  ),
  p(
    "Toutes trois butent sur la même contrainte : sans techniciens en nombre suffisant, " +
      "Infosystem ne peut pas croître. La comparaison externe renvoie ainsi à une question " +
      "interne, qui ouvre le module 4.",
  ),
  notion(
    "Pour aller plus loin : pondérer les critères",
    p(
      "Tous les facteurs n'ont pas le même poids aux yeux des clients. Pour affiner, on " +
        "attribue à chaque critère une pondération (le total fait 100 %), puis une note " +
        "de 1 à 5 à chaque acteur. La somme des notes pondérées donne un score par acteur.",
    ),
    p(
      "L'exercice est utile pour en discuter en équipe, mais ne vous laissez pas " +
        "impressionner par la précision des chiffres : une pondération reste un jugement. " +
        "Ce qui compte, ce sont les écarts nets et les raisons qui les expliquent.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Pour une école privée de Cocody, lequel de ces éléments est un facteur clé de succès " +
      "de l'industrie ?",
    choix: [
      {
        texte: "Le fait que le fondateur soit un ancien inspecteur.",
        explication:
          "C'est peut-être une ressource de cette école, pas un facteur clé de toute " +
          "l'industrie.",
      },
      {
        texte: "Le taux de réussite des élèves aux examens nationaux.",
        explication:
          "Oui : c'est un critère que les parents regardent pour choisir une école, quelle " +
          "qu'elle soit.",
      },
      {
        texte: "La couleur de l'uniforme.",
        explication: "Ce détail ne décide pas du choix des parents.",
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
        texte: "Les facteurs clés de succès sont propres à chaque entreprise.",
        vrai: false,
        explication:
          "Ils appartiennent à l'industrie ; chaque entreprise y est plus ou moins bonne.",
      },
      {
        texte: "Le service personnalisé est l'avantage distinctif d'Infosystem.",
        vrai: false,
        explication: "Les autres PME locales sont aussi fortes sur ce point : c'est un minimum.",
      },
      {
        texte: "Comparer par types de concurrents est utile quand le marché est très fragmenté.",
        vrai: true,
        explication: "On ne peut pas évaluer des dizaines d'entreprises une à une.",
      },
      {
        texte: "Les départs de clients sont une bonne source pour repérer les facteurs clés.",
        vrai: true,
        explication: "Ce qui fait partir un client révèle ce qui compte vraiment pour lui.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e3",
    question:
      "Dans la grille d'Infosystem, quel constat limite toutes les pistes de " +
      "différenciation ?",
    choix: [
      {
        texte: "Ses prix sont trop élevés pour les PME.",
        explication: "Au contraire, ses prix sont jugés compétitifs.",
      },
      {
        texte: "Sa faible capacité à prendre de nouveaux clients, faute de techniciens.",
        explication:
          "Oui : sans techniciens en nombre suffisant, aucune piste ne peut se déployer.",
      },
      {
        texte: "Son manque de rapidité d'intervention.",
        explication: "C'est au contraire l'un de ses points forts.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Dressez la grille de comparaison de votre organisation : cinq facteurs clés de " +
      "succès et trois types de concurrents. Où gagnez-vous, où perdez-vous, et qu'est-ce " +
      "qui vous distingue vraiment ?",
    corrige: [
      "Des facteurs clés tirés du point de vue des clients, pas des forces de l'entreprise.",
      "Des types de concurrents homogènes (par taille, par modèle, par zone).",
      "Une évaluation justifiée pour chaque case, idéalement confirmée par des clients.",
      "Une conclusion qui sépare les points forts partagés (minimum) des points forts " +
        "rares (différence), et une ou deux pistes qui en découlent.",
    ],
  }),

  appliquez(
    2,
    "Dans l'étape 2, remplissez la grille de comparaison avec vos concurrents et dites ce " +
      "qui vous distingue vraiment.",
  ),
  fiche(
    "Un facteur clé de succès appartient à l'industrie et part des attentes des clients.",
    "Comparez-vous sur ces facteurs, par types de concurrents si le marché est fragmenté.",
    "Trois lectures : où l'on gagne, où l'on perd, ce qui distingue vraiment.",
    "Un point fort partagé n'est pas un avantage.",
  ),
];
