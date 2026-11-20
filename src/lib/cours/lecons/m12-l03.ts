/**
 * =============================================================
 *  Fichier    : m12-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 12, leçon 3 — « La feuille de route et le tableau de bord
 *               équilibré » : la feuille de route en trois phases d'Infosystem, le
 *               tableau de bord équilibré de Kaplan et Norton, la chaîne des causes,
 *               indicateurs de résultat et avancés, règles d'un bon tableau, l'exemple
 *               de la matrice de solvabilité. Sources : livre, module 9 ; Kaplan et
 *               Norton, 1992. Texte, exemples et exercices originaux.
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
  p,
  piege,
  retenir,
  schema,
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M12_L03: ContenuLecon = [
  p(
    "Une stratégie choisie doit encore devenir un calendrier et des mesures. La feuille " +
      "de route dit **quand** chaque chantier avance ; le tableau de bord dit **si** le " +
      "plan produit ses effets. Les deux outils se construisent ensemble.",
  ),

  titre("La feuille de route"),
  schema(
    "feuille-route",
    "La feuille de route d'Infosystem sur 36 mois, en trois phases qui se suivent : " +
      "stabiliser (de 0 à 6 mois), développer (de 6 à 18 mois), croître et transmettre " +
      "(de 18 à 36 mois).",
  ),
  tableau(
    ["Phase", "Chantiers"],
    [
      [
        "Stabiliser (0 à 6 mois)",
        "La conversation avec les seniors, des mesures rapides pour garder l'équipe " +
          "(hausses ciblées, plan de formation), le choix du partenaire en cybersécurité",
      ],
      [
        "Développer (6 à 18 mois)",
        "Les formations certifiantes, la base de connaissances, les premiers bilans de " +
          "sécurité, le forfait par poste",
      ],
      [
        "Croître et transmettre (18 à 36 mois)",
        "L'offre complète, les nouveaux clients, la mise en place de la relève",
      ],
    ],
  ),
  p(
    "L'ordre suit la logique du diagnostic. On garde d'abord l'équipe, sans quoi rien " +
      "d'autre ne tient. Les mesures de la première phase sont aussi les victoires " +
      "rapides dont parlait Kotter. Les nouveaux clients viennent en dernier, quand " +
      "l'équipe peut les servir.",
  ),

  titre("Le tableau de bord équilibré"),
  definition(
    "Tableau de bord équilibré",
    "Un ensemble d'indicateurs répartis sur quatre perspectives, finance, clients, " +
      "processus internes, apprentissage et croissance, proposé par Robert Kaplan et " +
      "David Norton en 1992 pour ne pas piloter une entreprise par ses seuls chiffres " +
      "financiers.",
  ),
  schema(
    "tableau-bord",
    "Les quatre perspectives du tableau de bord équilibré, empilées : apprentissage et " +
      "croissance en bas, puis processus internes, clients, et finance en haut. Les " +
      "flèches montent : les indicateurs du bas sont avancés, ceux du haut sont des " +
      "indicateurs de résultat.",
  ),
  p(
    "Les quatre perspectives forment une chaîne de causes. Des employés formés " +
      "améliorent les processus ; de meilleurs processus satisfont les clients ; des " +
      "clients satisfaits produisent les résultats financiers. Chez Infosystem, un " +
      "technicien qui part en janvier se voit dans la satisfaction des clients au " +
      "printemps, et dans les finances à l'automne.",
  ),
  tableau(
    ["Perspective", "Exemple d'indicateur chez Infosystem"],
    [
      ["Finance", "La marge par client ; la part des revenus récurrents"],
      ["Clients", "Le taux de renouvellement des contrats ; la satisfaction"],
      ["Processus internes", "Le délai de résolution ; la part des clients documentés"],
      ["Apprentissage et croissance", "Les heures de formation ; le taux de départ"],
    ],
  ),

  titre("Résultat ou avancé"),
  liste(
    "**Les indicateurs de résultat** mesurent ce qui est arrivé : la marge, le " +
      "renouvellement. Ils confirment, mais trop tard pour corriger.",
    "**Les indicateurs avancés** mesurent ce qui prépare les résultats : les heures de " +
      "formation, la part des clients documentés. Ils préviennent à temps.",
  ),
  retenir(
    "Un bon tableau de bord mêle les deux. Les indicateurs avancés disent où agir ; les " +
      "indicateurs de résultat disent si l'action a payé.",
  ),

  titre("Les règles d'un bon tableau"),
  liste(
    "**Peu d'indicateurs** : une douzaine au plus, sinon personne ne les lit.",
    "**Chacun relié à un objectif** fixé au module 7.",
    "**Un responsable par indicateur**, qui le suit et l'explique.",
    "**Une définition écrite** : comment on le calcule, à quelle fréquence.",
    "**Des données faciles à obtenir**, sans quoi le tableau ne sera plus tenu.",
  ),
  piege(
    "Mesurer ce qui est facile plutôt que ce qui compte. Le nombre de billets fermés se " +
      "compte tout seul, mais il ne dit rien de la qualité du soutien ni de la fidélité " +
      "des clients.",
  ),

  terrain(
    "Une matrice de trois couleurs",
    "À la Nouvelle pharmacie de la santé publique de Côte d'Ivoire, le suivi des comptes " +
      "clients reposait sur une matrice simple : chaque client était classé vert, jaune " +
      "ou rouge selon sa solvabilité. Des tableaux de bord Power BI rendaient cette " +
      "classification visible pour la direction. Un indicateur clair, relié à un " +
      "objectif et suivi régulièrement, a contribué à réduire les créances de 20 %.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une clinique dentaire construit son tableau de bord. Dans quelle perspective " +
      "chaque indicateur se range-t-il ?",
    categories: ["Finance", "Clients", "Processus internes", "Apprentissage et croissance"],
    elements: [
      {
        texte: "Le revenu moyen par patient.",
        categorie: 0,
        explication: "Un résultat financier.",
      },
      {
        texte: "La part des patients qui reviennent pour leur contrôle annuel.",
        categorie: 1,
        explication: "La fidélité des patients.",
      },
      {
        texte: "Le temps d'attente moyen en salle.",
        categorie: 2,
        explication: "La qualité d'un processus interne.",
      },
      {
        texte: "Le nombre d'heures de formation des assistantes.",
        categorie: 3,
        explication: "Le développement des compétences.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Lequel de ces indicateurs d'Infosystem est un indicateur avancé ?",
    choix: [
      {
        texte: "La marge annuelle.",
        explication: "C'est un indicateur de résultat, connu après coup.",
      },
      {
        texte: "La part des clients dont l'environnement est documenté.",
        explication: "Oui : elle prépare la qualité du service et la fidélité.",
      },
      {
        texte: "Le taux de renouvellement des contrats.",
        explication: "Il mesure un résultat déjà acquis.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Dans le tableau de bord équilibré, les causes montent vers la finance.",
        vrai: true,
        explication: "Apprentissage, processus, clients, puis finance.",
      },
      {
        texte: "Plus un tableau de bord a d'indicateurs, mieux il pilote.",
        vrai: false,
        explication: "Une douzaine au plus, sinon personne ne les lit.",
      },
      {
        texte: "Les nouveaux clients viennent en dernier dans la feuille de route " +
          "d'Infosystem.",
        vrai: true,
        explication: "Il faut d'abord une équipe capable de les servir.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Construisez la feuille de route de votre plan en trois phases, puis proposez deux " +
      "indicateurs par perspective, dont au moins un avancé.",
    corrige: [
      "Trois phases datées, avec un ordre justifié par le diagnostic.",
      "Des victoires rapides dans la première phase.",
      "Huit indicateurs répartis sur les quatre perspectives.",
      "Des indicateurs avancés identifiés, chacun relié à un objectif.",
    ],
  }),

  appliquez(
    8,
    "À l'étape 8, placez vos actions dans le temps et associez à chacune un indicateur, " +
      "en veillant à couvrir les quatre perspectives.",
  ),
  fiche(
    "La feuille de route dit quand ; le tableau de bord dit si.",
    "Quatre perspectives : finance, clients, processus, apprentissage.",
    "Les causes montent : de l'apprentissage vers la finance.",
    "Mêler indicateurs avancés et indicateurs de résultat.",
    "Une douzaine d'indicateurs, chacun relié à un objectif et à un responsable.",
  ),
];
