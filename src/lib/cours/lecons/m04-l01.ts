/**
 * =============================================================
 *  Fichier    : m04-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 4, leçon 1 — « Ressources, compétences et capacités
 *               stratégiques » : pourquoi regarder à l'intérieur, ressources tangibles et
 *               intangibles, compétences, seuils et distinctives. Sources : livre,
 *               module 4 (§ 4.1 et 4.3, ressources seuils et distinctives d'Infosystem) ;
 *               Barney, 1991 ; Whittington et coll., « Stratégique », 2023. Texte,
 *               exemples et exercices originaux.
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
  schema,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M04_L01: ContenuLecon = [
  p(
    "L'industrie d'Infosystem est exigeante : rivalité forte, techniciens rares, " +
      "substituts en progression. Pourtant, certaines PME de services informatiques y " +
      "prospèrent pendant des décennies quand d'autres ferment en quelques années. " +
      "L'environnement est le même pour toutes : l'explication est donc **à l'intérieur**.",
  ),

  titre("Ce que l'entreprise possède, ce qu'elle sait faire"),
  definition(
    "Ressource",
    "Ce que l'entreprise **possède** ou contrôle : des personnes, des équipements, de " +
      "l'argent, une marque, des relations, des données, des brevets.",
  ),
  definition(
    "Compétence",
    "Ce que l'entreprise **sait faire** en combinant ses ressources : intervenir en moins " +
      "d'une heure, lancer un produit en trois mois, recouvrer ses créances sans perdre " +
      "le client. Une compétence se voit dans les résultats, pas dans l'inventaire.",
  ),
  p(
    "On parle de **capacités stratégiques** pour désigner l'ensemble : les ressources et " +
      "les compétences qui permettent à l'entreprise de survivre et de prospérer. Les " +
      "ressources sont les ingrédients ; les compétences, la recette et le savoir-faire du " +
      "cuisinier.",
  ),
  tableau(
    ["Type de ressource", "Exemples", "Facile à copier ?"],
    [
      ["Physique", "Locaux, véhicules, machines, matériel informatique", "Souvent oui"],
      ["Financière", "Trésorerie, accès au crédit, actionnaires patients", "Variable"],
      ["Humaine", "Expertise, expérience, relations personnelles", "Difficile"],
      ["Intangible", "Marque, réputation, données, culture, brevets", "Très difficile"],
    ],
    "Les ressources intangibles sont les plus difficiles à imiter, donc souvent les plus " +
      "précieuses pour un avantage durable.",
  ),

  titre("Seuils et distinctives"),
  schema(
    "seuils-distinctives",
    "Deux étages. En bas, les ressources et compétences seuils : il faut les avoir pour " +
      "exister dans l'industrie, mais tout le monde les a. En haut, les ressources et " +
      "compétences distinctives : elles permettent de faire mieux que les autres.",
  ),
  p(
    "Toutes les ressources n'ont pas le même poids. Les **ressources et compétences " +
      "seuils** sont le ticket d'entrée : sans elles, on ne peut pas exister dans " +
      "l'industrie, mais elles ne distinguent personne. Les **ressources et compétences " +
      "distinctives** permettent de faire mieux que les concurrents, aux yeux des clients.",
  ),
  tableau(
    ["Seuils pour Infosystem", "Distinctives candidates pour Infosystem"],
    [
      ["Techniciens compétents", "L'expertise des deux seniors"],
      ["Outils de gestion à distance", "La réputation et le réseau de Justin"],
      ["Connaissance des besoins des PME", "La souplesse d'une petite structure"],
      ["Capacité de traverser une période creuse", "La connaissance des systèmes de chaque client"],
    ],
  ),
  retenir("Un seuil monte avec le temps.", [
    "Ce qui distinguait hier devient la norme demain : le site Web, puis le paiement " +
      "mobile, puis la prise de rendez-vous en ligne.",
    "Une entreprise qui ne fait que suivre finit par n'avoir que des seuils.",
  ]),
  piege(
    "Inscrire un seuil parmi ses forces. « Nous avons des techniciens compétents » n'est " +
      "pas une force si tous les concurrents sérieux en ont. Une force n'en est une que par " +
      "rapport aux autres.",
  ),

  titre("Distinctive… mais pour combien de temps ?"),
  p(
    "Les quatre candidates d'Infosystem semblent distinctives. Reste à savoir si elles " +
      "procurent vraiment un avantage, et pour combien de temps. C'est la question du " +
      "modèle VRIO, objet de la leçon 3. Avant cela, la leçon 2 décompose ce que fait " +
      "l'entreprise, activité par activité.",
  ),
  notion(
    "Pour aller plus loin : la vision fondée sur les ressources",
    p(
      "Dans les années 1980 et 1990, des chercheurs comme Jay Barney ont déplacé le " +
        "regard de la stratégie : au lieu de partir de l'industrie (Porter), ils partent " +
        "des ressources de l'entreprise. Leur idée : un avantage durable vient de " +
        "ressources différentes d'une entreprise à l'autre, et difficiles à transférer.",
    ),
    p(
      "Les deux visions se complètent. L'analyse externe dit où se trouvent les " +
        "opportunités ; l'analyse interne dit si l'entreprise a de quoi les saisir mieux " +
        "que les autres.",
    ),
  ),
  liste(
    "Une ressource ne vaut que si elle sert une opportunité ou contre une menace.",
    "Une compétence se prouve par des résultats : délais, taux de fidélité, marges.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Classez ces ressources d'Infosystem en ressources seuils ou distinctives.",
    categories: ["Seuil", "Distinctive"],
    elements: [
      {
        texte: "Une licence d'outil de gestion à distance.",
        categorie: 0,
        explication: "Tout concurrent sérieux en possède une.",
      },
      {
        texte: "La relation de confiance avec un client depuis dix ans.",
        categorie: 1,
        explication:
          "Précieuse, rare et difficile à imiter, à condition qu'elle soit portée par " +
          "l'entreprise et pas seulement par une personne.",
      },
      {
        texte: "Une assurance responsabilité professionnelle.",
        categorie: 0,
        explication: "Indispensable pour exercer, mais tout le monde l'a.",
      },
      {
        texte:
          "Un technicien certifié en cybersécurité, dans une région où les concurrents " +
          "locaux n'en ont pas.",
        categorie: 1,
        explication:
          "D'ordinaire un seuil ; il devient distinctif quand cette expertise est rare " +
          "chez les concurrents.",
      },
    ],
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne:
      "Pour un grossiste en matériaux de construction de San-Pédro, s'agit-il d'une " +
      "ressource ou d'une compétence ?",
    categories: ["Ressource", "Compétence"],
    elements: [
      {
        texte: "Un entrepôt de 2 000 m² près du port.",
        categorie: 0,
        explication: "Un bien physique que l'entreprise possède.",
      },
      {
        texte: "Livrer un chantier en moins de 24 heures dans toute la région.",
        categorie: 1,
        explication: "Un savoir-faire qui combine camions, stocks, personnel et organisation.",
      },
      {
        texte: "Une ligne de crédit auprès d'une banque locale.",
        categorie: 0,
        explication: "Une ressource financière.",
      },
      {
        texte: "Négocier des prix avantageux auprès des cimenteries grâce aux volumes.",
        categorie: 1,
        explication: "Une manière de faire, appuyée sur des ressources (volumes, relations).",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte:
          "Une ressource seuil peut devenir distinctive si elle est rare chez les concurrents.",
        vrai: true,
        explication: "Le caractère seuil ou distinctif dépend toujours de la comparaison.",
      },
      {
        texte: "Les ressources physiques sont en général les plus difficiles à imiter.",
        vrai: false,
        explication: "On achète une machine ; on n'achète pas une réputation de dix ans.",
      },
      {
        texte: "Deux entreprises d'une même industrie peuvent avoir des résultats très différents.",
        vrai: true,
        explication: "C'est même la raison d'être de l'analyse interne.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Listez trois ressources ou compétences seuils et trois candidates distinctives de " +
      "votre organisation. Pour chaque distinctive, quel indice montre qu'elle fait mieux " +
      "que les concurrents ?",
    corrige: [
      "Des seuils que tous les concurrents sérieux possèdent aussi.",
      "Des candidates distinctives formulées précisément, pas « notre personnel » ou " +
        "« notre qualité ».",
      "Pour chacune, un indice observable : un résultat, un choix des clients, une " +
        "comparaison chiffrée.",
      "La conscience qu'il faudra encore les passer au VRIO (leçon 3).",
    ],
  }),

  appliquez(
    3,
    "Dans l'étape 3 de votre étude, séparez vos ressources seuils de vos ressources " +
      "distinctives avant de passer au VRIO.",
  ),
  fiche(
    "Ressource : ce que l'entreprise possède. Compétence : ce qu'elle sait en faire.",
    "Seuils : nécessaires pour exister, partagés par tous.",
    "Distinctives : font mieux que les concurrents, aux yeux des clients.",
    "Les ressources intangibles sont les plus difficiles à imiter.",
    "Le seuil monte avec le temps.",
  ),
];
