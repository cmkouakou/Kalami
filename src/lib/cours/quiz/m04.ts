/**
 * =============================================================
 *  Fichier    : m04.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 4 — L'analyse interne : ressources et compétences,
 *               chaîne de valeur, VRIO, ratios financiers, capacités dynamiques.
 *               Questions originales. Identifiants stables.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M04: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Quelle est la différence entre une ressource et une compétence ?",
    choix: [
      {
        texte: "Une ressource est humaine, une compétence est matérielle.",
        explication: "Une ressource peut être matérielle, financière ou humaine.",
      },
      {
        texte: "Aucune : ce sont deux mots pour la même chose.",
        explication: "La distinction aide à voir ce qui se copie et ce qui se copie mal.",
      },
      {
        texte: "La ressource est ce que l'entreprise possède ; la compétence, ce qu'elle " +
          "sait en faire.",
        explication: "Oui.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q2",
    question:
      "Une ressource est précieuse et rare, mais un concurrent peut la copier en un an. " +
      "Que conclut le VRIO ?",
    choix: [
      {
        texte: "Un avantage concurrentiel temporaire.",
        explication: "Oui : le premier « non » arrive au test d'imitabilité.",
      },
      {
        texte: "Un avantage concurrentiel durable.",
        explication: "Il faudrait quatre « oui », y compris la difficulté à imiter.",
      },
      {
        texte: "La parité concurrentielle.",
        explication: "La parité vient d'une ressource précieuse mais commune.",
      },
      {
        texte: "Un désavantage concurrentiel.",
        explication: "Ce serait le cas d'une ressource sans valeur.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q3",
    question:
      "Chez Infosystem, la relation avec les grands clients repose sur le fondateur. Quelle " +
      "est la principale limite de cet atout ?",
    choix: [
      {
        texte: "Il n'a aucune valeur pour les clients.",
        explication: "Les clients l'apprécient au contraire beaucoup.",
      },
      {
        texte: "Logé dans une seule personne, il n'appartient pas vraiment à l'entreprise.",
        explication: "Oui : si la personne part, l'atout part avec elle.",
      },
      {
        texte: "Il est trop facile à imiter.",
        explication: "Une relation construite dans le temps s'imite mal.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q4",
    question:
      "Actif à court terme : 120 ; passif à court terme : 80. Que vaut la liquidité " +
      "générale ?",
    choix: [
      {
        texte: "0,67.",
        explication: "C'est le calcul inversé : passif ÷ actif.",
      },
      {
        texte: "40.",
        explication: "C'est une différence, pas un ratio.",
      },
      {
        texte: "1,5.",
        explication: "Oui : 120 ÷ 80 = 1,5. L'entreprise couvre ses dettes à court terme.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Que désignent les capacités dynamiques ?",
    choix: [
      {
        texte: "La vitesse de production d'une usine.",
        explication: "Il s'agit de la capacité à changer, pas de produire plus vite.",
      },
      {
        texte: "Les ressources financières disponibles pour investir.",
        explication: "L'argent aide, mais ne suffit pas à se transformer.",
      },
      {
        texte: "Le nombre de produits d'une gamme.",
        explication: "Ce n'est pas une capacité de changement.",
      },
      {
        texte: "La capacité de percevoir, de saisir et de reconfigurer.",
        explication: "Oui : elles renouvellent l'avantage que le VRIO photographie.",
      },
    ],
    bonne: 3,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Compétences et chaîne de valeur : vrai ou faux ?",
    affirmations: [
      {
        texte: "Une compétence de seuil suffit à se distinguer des concurrents.",
        vrai: false,
        explication: "Elle est nécessaire pour exister, mais partagée par tous.",
      },
      {
        texte: "Les ressources intangibles sont souvent les plus difficiles à imiter.",
        vrai: true,
        explication: "Réputation, savoir-faire, culture : elles ne s'achètent pas.",
      },
      {
        texte: "Les ressources humaines sont une activité de soutien.",
        vrai: true,
        explication: "Comme l'infrastructure, la technologie et l'approvisionnement.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Ratios et rigidités : vrai ou faux ?",
    affirmations: [
      {
        texte: "Un ratio a du sens seul, sans comparaison.",
        vrai: false,
        explication: "Il se compare : dans le temps, avec l'industrie, avec d'autres ratios.",
      },
      {
        texte: "Un atout d'hier peut devenir une rigidité quand l'environnement change.",
        vrai: true,
        explication: "Ce qui faisait le succès peut empêcher de s'adapter.",
      },
      {
        texte: "Une PME peut reconfigurer plus vite grâce à sa petite taille.",
        vrai: true,
        explication: "Et elle perçoit les changements grâce à ses clients.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Quel ratio chaque formule calcule-t-elle ?",
    categories: [
      "Autonomie financière",
      "Marge nette",
      "Rentabilité des capitaux propres",
      "Rotation de l'actif",
    ],
    elements: [
      { texte: "Résultat net ÷ chiffre d'affaires", categorie: 1 },
      { texte: "Chiffre d'affaires ÷ total de l'actif", categorie: 3 },
      { texte: "Capitaux propres ÷ total du passif", categorie: 0 },
      { texte: "Résultat net ÷ capitaux propres", categorie: 2 },
    ],
  },
];
