/**
 * =============================================================
 *  Fichier    : m02.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 2 — Le macroenvironnement : trois strates, PESTEL,
 *               impact et incertitude, tendances lourdes et variables pivots,
 *               scénarios. Questions originales. Identifiants stables.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M02: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Qu'est-ce qui caractérise le macroenvironnement ?",
    choix: [
      {
        texte: "Il ne concerne que les concurrents directs de l'entreprise.",
        explication: "Les concurrents forment une autre strate, plus proche.",
      },
      {
        texte: "Il agit sur toute une industrie, et l'entreprise ne le contrôle pas.",
        explication: "Oui : elle ne le contrôle pas, mais elle peut l'anticiper.",
      },
      {
        texte: "Il se limite aux données macroéconomiques : croissance, inflation.",
        explication: "Macroenvironnement ≠ macroéconomie : l'économie n'est qu'une dimension.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question:
      "Le gouvernement lance un programme de subventions pour numériser les PME. Dans " +
      "quelle dimension du PESTEL le classer ?",
    choix: [
      {
        texte: "Légale.",
        explication: "Le légal concerne les lois adoptées, pas un programme.",
      },
      {
        texte: "Technologique.",
        explication: "Le sujet est numérique, mais l'origine est une décision publique.",
      },
      {
        texte: "Politique.",
        explication: "Oui : un programme gouvernemental relève du politique.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question:
      "Un facteur aura un fort impact sur votre industrie, et son évolution est très " +
      "incertaine. Comment l'appelle-t-on ?",
    choix: [
      {
        texte: "Une variable pivot.",
        explication: "Oui : c'est sur elle qu'on bâtit les scénarios.",
      },
      {
        texte: "Une tendance lourde.",
        explication: "Une tendance lourde a un fort impact, mais elle est prévisible.",
      },
      {
        texte: "Un signal faible.",
        explication: "Un signal faible annonce peut-être un changement ; ce n'est pas le critère.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Que faire d'une tendance lourde dans le plan ?",
    choix: [
      {
        texte: "L'ignorer, puisqu'on ne la contrôle pas.",
        explication: "Ne pas contrôler n'est pas subir : on s'y prépare.",
      },
      {
        texte: "Bâtir quatre scénarios autour d'elle.",
        explication: "Les scénarios se construisent sur l'incertain, pas sur le prévisible.",
      },
      {
        texte: "Attendre qu'elle se confirme avant d'agir.",
        explication: "Elle est déjà prévisible : attendre, c'est perdre du temps.",
      },
      {
        texte: "L'intégrer directement au plan.",
        explication: "Oui : elle est prévisible, on en tient compte d'emblée.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question:
      "Dans une démarche de scénarios, qu'est-ce qu'une « action robuste » ?",
    choix: [
      {
        texte: "Une action à déclencher seulement si un signal précis apparaît.",
        explication: "C'est un pari, préparé mais conditionnel.",
      },
      {
        texte: "Une action utile dans tous les futurs envisagés, à lancer maintenant.",
        explication: "Oui : elle ne dépend pas du scénario qui se réalisera.",
      },
      {
        texte: "L'action prévue dans le scénario le plus probable.",
        explication: "Un scénario n'est pas une prédiction : on ne mise pas sur un seul.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Le PESTEL : vrai ou faux ?",
    affirmations: [
      {
        texte: "Plus un PESTEL contient de facteurs, plus il est utile.",
        vrai: false,
        explication: "Peu de facteurs, bien choisis, valent mieux qu'un inventaire.",
      },
      {
        texte: "Chaque ligne relie une tendance à sa conséquence pour l'entreprise.",
        vrai: true,
        explication: "Puis on la marque opportunité ou menace.",
      },
      {
        texte: "Un PESTEL fait une fois reste valable pour tout le plan.",
        vrai: false,
        explication: "L'environnement bouge : on le refait chaque année.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Les scénarios : vrai ou faux ?",
    affirmations: [
      {
        texte: "Deux variables pivots, avec deux pôles chacune, donnent quatre futurs.",
        vrai: true,
        explication: "Le croisement des deux axes forme une grille de quatre cases.",
      },
      {
        texte: "Le trio optimiste, pessimiste, réaliste est la meilleure méthode.",
        vrai: false,
        explication: "Il pousse à retenir le « réaliste » et à oublier les deux autres.",
      },
      {
        texte: "Donner une fourchette plutôt qu'un chiffre limite les erreurs de prévision.",
        vrai: true,
        explication: "Comme casser la courbe, guetter les signaux faibles, croiser les avis.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Une agence de voyages de Dakar : classez chaque fait dans le PESTEL.",
    categories: [
      "Politique",
      "Économique",
      "Socioculturel",
      "Technologique",
      "Environnemental",
      "Légal",
    ],
    elements: [
      {
        texte: "Les clients réservent de plus en plus sur leur téléphone.",
        categorie: 3,
      },
      {
        texte: "Une nouvelle loi encadre la protection des données des voyageurs.",
        categorie: 5,
      },
      {
        texte: "Le coût du carburant aérien fait monter le prix des billets.",
        categorie: 1,
      },
      {
        texte: "La diaspora prend l'habitude de revenir pour les fêtes de fin d'année.",
        categorie: 2,
      },
      {
        texte: "La montée des eaux menace des sites balnéaires de la Petite-Côte.",
        categorie: 4,
      },
      {
        texte: "L'État lance une campagne pour promouvoir le tourisme intérieur.",
        categorie: 0,
      },
    ],
  },
];
