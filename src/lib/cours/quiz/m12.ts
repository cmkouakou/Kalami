/**
 * =============================================================
 *  Fichier    : m12.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 12 — Choisir et mettre en œuvre : évaluation des
 *               options, conduite du changement, feuille de route, tableau de bord,
 *               suivi, stratégie délibérée ou émergente, risques. Questions
 *               originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M12: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Que vérifie le test d'acceptabilité d'une option ?",
    choix: [
      {
        texte: "Si l'option répond au diagnostic.",
        explication: "C'est le test de pertinence.",
      },
      {
        texte: "Si l'entreprise a les moyens de la réaliser.",
        explication: "C'est le test de faisabilité.",
      },
      {
        texte: "Si les résultats, les risques et les réactions conviennent aux parties prenantes.",
        explication: "Oui : rendement, risque et réactions.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Pourquoi un bon énoncé de stratégie nomme-t-il ses renoncements ?",
    choix: [
      {
        texte: "Pour que chacun sache ce qu'on ne fera plus, et arrête d'y consacrer des moyens.",
        explication: "Oui : sans renoncement, les ressources restent dispersées.",
      },
      {
        texte: "Pour montrer de la modestie aux actionnaires.",
        explication: "Il s'agit de clarté, pas de modestie.",
      },
      {
        texte: "Parce que la loi l'exige.",
        explication: "Aucune loi n'impose cela.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Quelle est la différence entre une feuille de route et un tableau de bord ?",
    choix: [
      {
        texte: "Aucune : ce sont deux noms du même document.",
        explication: "Ils répondent à deux questions différentes.",
      },
      {
        texte:
          "La feuille de route dit qui fait quoi et quand ; le tableau de bord mesure l'effet.",
        explication: "Oui : l'une organise l'action, l'autre vérifie les résultats.",
      },
      {
        texte: "La feuille de route est financière, le tableau de bord est commercial.",
        explication: "Le tableau de bord couvre quatre perspectives, pas une.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Lequel de ces indicateurs est un indicateur avancé ?",
    choix: [
      {
        texte: "Le bénéfice annuel.",
        explication: "C'est un indicateur de résultat : il arrive tard.",
      },
      {
        texte: "Le chiffre d'affaires du dernier exercice.",
        explication: "Lui aussi constate après coup.",
      },
      {
        texte: "La part de marché de l'an dernier.",
        explication: "C'est un résultat passé.",
      },
      {
        texte: "Le nombre de démonstrations faites à des clients ce mois-ci.",
        explication: "Oui : il annonce les ventes à venir et permet de corriger tôt.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Que désigne une stratégie émergente ?",
    choix: [
      {
        texte: "Une stratégie qui se forme au fil des actions, sans avoir été planifiée.",
        explication: "Oui : la stratégie réalisée mêle le délibéré et l'émergent.",
      },
      {
        texte: "Une stratégie réservée aux marchés émergents.",
        explication: "Le mot ne parle pas des marchés.",
      },
      {
        texte: "Une stratégie d'urgence, en cas de crise.",
        explication: "Une réponse de crise peut être délibérée.",
      },
    ],
    bonne: 0,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Mettre en œuvre : vrai ou faux ?",
    affirmations: [
      {
        texte: "Chaque chantier gagne à avoir un seul responsable nommé.",
        vrai: true,
        explication: "Un responsable partagé n'est responsable de rien.",
      },
      {
        texte: "Les chantiers stratégiques avancent bien dans le temps qui reste après l'urgence.",
        vrai: false,
        explication: "Ce temps n'existe presque jamais : il faut le protéger.",
      },
      {
        texte: "Un sentiment d'urgence partagé aide à lancer le changement.",
        vrai: true,
        explication: "C'est la première étape de Kotter.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Suivi et risques : vrai ou faux ?",
    affirmations: [
      {
        texte: "Un tableau de bord stratégique compte idéalement une centaine d'indicateurs.",
        vrai: false,
        explication: "Une douzaine suffit ; au-delà, personne ne les suit.",
      },
      {
        texte: "Pour chaque risque, on prévoit le signal qui l'annonce et la réponse prévue.",
        vrai: true,
        explication: "On réagit alors vite, sans improviser.",
      },
      {
        texte: "Un suivi mensuel permet de corriger avant qu'il soit trop tard.",
        vrai: true,
        explication: "Attendre le bilan annuel, c'est constater sans pouvoir agir.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Dans quelle perspective du tableau de bord ranger chaque indicateur ?",
    categories: ["Finances", "Clients", "Processus internes", "Apprentissage"],
    elements: [
      {
        texte: "Taux de clients qui renouvellent leur contrat.",
        categorie: 1,
      },
      {
        texte: "Marge nette du trimestre.",
        categorie: 0,
      },
      {
        texte: "Heures de formation par technicien.",
        categorie: 3,
      },
      {
        texte: "Délai moyen de résolution d'une panne.",
        categorie: 2,
      },
    ],
  },
];
