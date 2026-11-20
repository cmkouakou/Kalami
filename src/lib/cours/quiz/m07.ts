/**
 * =============================================================
 *  Fichier    : m07.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 7 — Vision, mission, valeurs et objectifs : rôle de
 *               chaque énoncé, test du nom remplacé, valeurs qui font refuser,
 *               objectifs SMART. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M07: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "À quelle question répond la mission ?",
    choix: [
      {
        texte: "Où voulons-nous être dans dix ans ?",
        explication: "C'est la vision.",
      },
      {
        texte: "Pourquoi existons-nous, et pour qui ?",
        explication: "Oui : la mission dit la raison d'être.",
      },
      {
        texte: "Combien voulons-nous vendre l'an prochain ?",
        explication: "C'est un objectif.",
      },
      {
        texte: "Comment voulons-nous nous conduire ?",
        explication: "Ce sont les valeurs.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question: "En quoi consiste le « test du nom remplacé » ?",
    choix: [
      {
        texte: "Changer le nom de l'entreprise pour voir si la clientèle réagit.",
        explication: "Il ne s'agit pas de marketing.",
      },
      {
        texte: "Vérifier que le nom figure bien dans la mission.",
        explication: "La présence du nom ne rend pas un énoncé distinctif.",
      },
      {
        texte: "Mettre le nom d'un concurrent dans l'énoncé : s'il reste vrai, il est trop vague.",
        explication: "Oui : un bon énoncé ne convient qu'à une seule entreprise.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question: "À quoi reconnaît-on une vraie valeur d'entreprise ?",
    choix: [
      {
        texte: "Elle fait parfois refuser une affaire ou une facilité.",
        explication: "Oui : une valeur qui ne coûte jamais rien n'oriente aucun choix.",
      },
      {
        texte: "Tout le monde peut l'approuver sans discussion.",
        explication: "« Excellence » ou « intégrité » seules ne départagent rien.",
      },
      {
        texte: "Elle figure sur l'affiche de l'accueil.",
        explication: "L'affichage ne prouve pas l'usage.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Lequel de ces objectifs est SMART ?",
    choix: [
      {
        texte: "Améliorer la satisfaction des clients.",
        explication: "Ni mesure, ni échéance.",
      },
      {
        texte: "Devenir le leader incontesté du marché.",
        explication: "Ni mesurable ni daté, et peut-être irréaliste.",
      },
      {
        texte: "Vendre beaucoup plus cette année.",
        explication: "« Beaucoup » ne se mesure pas.",
      },
      {
        texte: "Ramener le délai de livraison de 10 à 5 jours d'ici juin prochain.",
        explication: "Oui : précis, mesurable, atteignable, pertinent, daté.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Quel lien doit-il y avoir entre les objectifs et les enjeux du diagnostic ?",
    choix: [
      {
        texte: "Aucun : les objectifs se fixent à partir de l'année précédente.",
        explication: "Prolonger l'an dernier n'est pas une stratégie.",
      },
      {
        texte: "Chaque objectif devrait répondre à un enjeu retenu.",
        explication: "Oui : c'est ce qui rend le plan traçable.",
      },
      {
        texte: "Les objectifs remplacent les enjeux.",
        explication: "L'enjeu pose la question ; l'objectif chiffre la réponse.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Vision et mission : vrai ou faux ?",
    affirmations: [
      {
        texte: "Une vision décrit un futur souhaité, assez précis pour guider les choix.",
        vrai: true,
        explication: "Un rêve vague ne guide rien.",
      },
      {
        texte: "La mission et la vision disent la même chose.",
        vrai: false,
        explication: "La vision dit où ; la mission dit pourquoi.",
      },
      {
        texte: "Un énoncé de mission gagne à être court et concret.",
        vrai: true,
        explication: "Les employés doivent pouvoir s'en servir pour décider.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Objectifs : vrai ou faux ?",
    affirmations: [
      {
        texte: "Plus un plan contient d'objectifs, mieux il est piloté.",
        vrai: false,
        explication: "Trop d'objectifs dispersent l'attention.",
      },
      {
        texte: "Un objectif sans responsable risque de rester sans suite.",
        vrai: true,
        explication: "Ce qui est à tout le monde n'est à personne.",
      },
      {
        texte: "Le « R » de SMART invite à vérifier qu'un objectif est réaliste.",
        vrai: true,
        explication: "Ambitieux, mais à la portée des moyens disponibles.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Une clinique dentaire de Cotonou : à quoi correspond chaque énoncé ?",
    categories: ["Vision", "Mission", "Valeur", "Objectif"],
    elements: [
      {
        texte: "Soigner les familles du quartier, à un prix qu'elles peuvent payer.",
        categorie: 1,
      },
      {
        texte: "Nous refusons tout soin qui n'est pas nécessaire, même s'il est rentable.",
        categorie: 2,
      },
      {
        texte: "Être, dans cinq ans, la clinique de référence pour les enfants de la ville.",
        categorie: 0,
      },
      {
        texte: "Réaliser 300 bilans scolaires gratuits avant la rentrée prochaine.",
        categorie: 3,
      },
    ],
  },
];
