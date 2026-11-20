/**
 * =============================================================
 *  Fichier    : m01.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 1 — Les fondements : définition de la stratégie,
 *               décisions stratégiques, tactiques et opérationnelles, trois niveaux,
 *               démarche en quatre temps, bonne et mauvaise stratégie. Questions
 *               originales. Identifiants stables : ne jamais renommer « q1 »…
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M01: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Laquelle de ces phrases décrit le mieux une stratégie ?",
    choix: [
      {
        texte: "Devenir le meilleur dans tous les domaines, pour tous les clients.",
        explication: "Une stratégie qui n'exclut rien n'en est pas une.",
      },
      {
        texte: "Un ensemble cohérent de choix : où se battre, comment gagner, à quoi renoncer.",
        explication: "Oui : choisir, c'est aussi renoncer.",
      },
      {
        texte: "Réduire les coûts de 10 % grâce à un nouveau logiciel de facturation.",
        explication: "C'est de l'efficacité opérationnelle : utile, mais facile à imiter.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question:
      "Un transporteur de Bouaké décide d'ouvrir une ligne régulière vers Ouagadougou, " +
      "avec quatre camions achetés à crédit. De quel type de décision s'agit-il ?",
    choix: [
      {
        texte: "Stratégique.",
        explication:
          "Oui : durable, difficile à défaire, coûteuse, et elle modifie sa position.",
      },
      {
        texte: "Tactique.",
        explication: "Une tactique dure quelques mois et traduit une stratégie déjà choisie.",
      },
      {
        texte: "Opérationnelle.",
        explication: "Une décision opérationnelle règle le quotidien, pas la position.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Quelle question relève de la stratégie corporative ?",
    choix: [
      {
        texte: "Comment battre nos concurrents dans la vente de pièces auto ?",
        explication: "C'est la stratégie d'affaires : gagner dans un domaine donné.",
      },
      {
        texte: "Comment le service comptable peut-il facturer plus vite ?",
        explication: "C'est une stratégie fonctionnelle.",
      },
      {
        texte: "Faut-il rester dans la vente de pièces auto, ou entrer dans l'entretien ?",
        explication: "Oui : le niveau corporatif choisit les domaines où être présent.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Dans la démarche en quatre temps, à quoi sert la SWOT ?",
    choix: [
      {
        texte: "À commencer l'analyse, avant toute recherche.",
        explication: "Faite trop tôt, elle ne contient que des impressions.",
      },
      {
        texte: "À choisir directement la stratégie.",
        explication: "Elle prépare la décision, mais ne décide pas.",
      },
      {
        texte: "À contrôler la mise en œuvre.",
        explication: "Le suivi utilise d'autres outils : feuille de route, tableau de bord.",
      },
      {
        texte: "À résumer le diagnostic, une fois l'analyse faite.",
        explication: "Oui : elle clôt le temps « comprendre » et ouvre la synthèse.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question:
      "Une direction annonce : « Notre stratégie : +20 % de chiffre d'affaires en deux " +
      "ans. » Quel défaut de mauvaise stratégie reconnaissez-vous ?",
    choix: [
      {
        texte: "Un objectif pris pour une stratégie.",
        explication: "Oui : on dit combien, mais ni pourquoi ni comment.",
      },
      {
        texte: "Une liste sans tri.",
        explication: "Il n'y a ici qu'un seul élément, pas une liste.",
      },
      {
        texte: "Aucun : un objectif chiffré suffit.",
        explication: "Il manque le diagnostic et la politique directrice.",
      },
    ],
    bonne: 0,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "L'efficacité opérationnelle suffit à créer un avantage durable.",
        vrai: false,
        explication: "Les bonnes pratiques s'imitent ; la stratégie se construit.",
      },
      {
        texte: "De petites décisions répétées peuvent finir par former une stratégie.",
        vrai: true,
        explication: "Elles peuvent même en remplacer une, sans que personne l'ait voulu.",
      },
      {
        texte: "Une décision urgente est forcément une décision importante.",
        vrai: false,
        explication: "L'urgence ne mesure pas l'importance.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Le noyau d'une bonne stratégie : vrai ou faux ?",
    affirmations: [
      {
        texte: "Il comprend un diagnostic, une politique directrice et des actions cohérentes.",
        vrai: true,
        explication: "Ce sont les trois éléments du noyau.",
      },
      {
        texte: "Devant une stratégie, il faut d'abord chercher son diagnostic.",
        vrai: true,
        explication: "Sans diagnostic, on ne sait pas quel problème elle règle.",
      },
      {
        texte: "La faisabilité ne fait pas partie des tests d'une stratégie.",
        vrai: false,
        explication: "Les trois tests : pertinence, acceptabilité, faisabilité.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Dans une chaîne de pharmacies, à quel niveau chaque décision appartient-elle ?",
    categories: ["Corporatif", "D'affaires", "Fonctionnel"],
    elements: [
      {
        texte: "Ouvrir une activité de vente de matériel médical aux cliniques.",
        categorie: 0,
        explication: "Entrer dans un nouveau domaine.",
      },
      {
        texte: "Se distinguer des concurrents par le conseil en officine.",
        categorie: 1,
        explication: "Comment gagner dans le domaine actuel.",
      },
      {
        texte: "Former les préparateurs à l'accueil pour soutenir ce conseil.",
        categorie: 2,
        explication: "Ce que fait un service pour contribuer.",
      },
      {
        texte: "Céder l'activité de parapharmacie en ligne.",
        categorie: 0,
        explication: "Quitter un domaine.",
      },
    ],
  },
];
