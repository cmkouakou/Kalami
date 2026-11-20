/**
 * =============================================================
 *  Fichier    : m05.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 5 — La synthèse : SWOT, matrice TOWS, enjeux
 *               stratégiques et leur priorité. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M05: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Dans une SWOT, qu'est-ce qui sépare les forces des opportunités ?",
    choix: [
      {
        texte: "Les forces sont positives, les opportunités sont négatives.",
        explication: "Les deux sont positives : c'est leur origine qui diffère.",
      },
      {
        texte: "Les forces viennent de l'interne, les opportunités de l'environnement.",
        explication: "Oui : l'entreprise agit sur les unes, elle saisit les autres.",
      },
      {
        texte: "Les forces sont actuelles, les opportunités sont des projets internes.",
        explication: "Un projet interne n'est pas une opportunité : c'est une action.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question:
      "Un responsable inscrit « Ouvrir une agence à Kumasi » dans la case Opportunités. " +
      "Quel est le problème ?",
    choix: [
      {
        texte: "Aucun : c'est une belle opportunité.",
        explication: "C'est un choix de l'entreprise, pas un fait de l'environnement.",
      },
      {
        texte: "Il faudrait la placer dans les forces.",
        explication: "Ce n'est pas non plus une capacité actuelle.",
      },
      {
        texte: "C'est une action : une action n'est jamais une opportunité.",
        explication: "Oui : l'opportunité serait, par exemple, la demande qui y grandit.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Dans la matrice TOWS, que vise une stratégie qui croise forces et menaces ?",
    choix: [
      {
        texte: "Défendre : utiliser ses forces pour contrer une menace.",
        explication: "Oui : c'est la case FM.",
      },
      {
        texte: "Attaquer : saisir une opportunité grâce à ses forces.",
        explication: "C'est la case FO.",
      },
      {
        texte: "Se protéger : réduire ses faiblesses face à une menace.",
        explication: "C'est la case FaM.",
      },
      {
        texte: "Se renforcer : corriger une faiblesse pour saisir une opportunité.",
        explication: "C'est la case FaO.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Laquelle de ces formulations est un bon enjeu stratégique ?",
    choix: [
      {
        texte: "Les ventes.",
        explication: "Un thème n'est pas un enjeu : il ne dit pas ce qui est en jeu.",
      },
      {
        texte: "Augmenter les ventes de 15 %.",
        explication: "C'est un objectif : il donne déjà la réponse.",
      },
      {
        texte: "Embaucher deux commerciaux.",
        explication: "C'est une action.",
      },
      {
        texte: "Comment garder nos grands clients quand les concurrents baissent leurs prix ?",
        explication: "Oui : une question ouverte, qui relie un fait du diagnostic à un choix.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question:
      "Chez Infosystem, la demande existe, mais l'équipe ne peut pas suivre. Quel enjeu " +
      "traiter en premier ?",
    choix: [
      {
        texte: "La conquête de nouveaux marchés.",
        explication: "Conquérir sans pouvoir livrer aggraverait le problème.",
      },
      {
        texte: "La capacité de l'équipe à servir les clients.",
        explication: "Oui : la capacité d'abord, sinon les autres enjeux restent bloqués.",
      },
      {
        texte: "La refonte du logo et de l'image.",
        explication: "Ce n'est pas ce qui limite l'entreprise aujourd'hui.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "La SWOT : vrai ou faux ?",
    affirmations: [
      {
        texte: "Chaque élément d'une SWOT devrait venir d'une analyse faite avant.",
        vrai: true,
        explication: "La SWOT résume ; elle ne remplace pas l'analyse.",
      },
      {
        texte: "Une longue SWOT de quarante lignes est plus utile qu'une courte.",
        vrai: false,
        explication: "Une SWOT courte et triée aide à décider ; une longue noie l'essentiel.",
      },
      {
        texte: "Une même réalité peut être une force dans un marché et une faiblesse ailleurs.",
        vrai: true,
        explication: "Une force se juge par rapport aux attentes d'un marché précis.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Les enjeux : vrai ou faux ?",
    affirmations: [
      {
        texte: "Un plan devrait retenir trois à cinq enjeux.",
        vrai: true,
        explication: "Au-delà, on ne choisit plus.",
      },
      {
        texte: "On priorise les enjeux selon leur gravité, leur urgence et leur effet de levier.",
        vrai: true,
        explication: "L'effet de levier : régler cet enjeu en débloque d'autres.",
      },
      {
        texte: "Un enjeu se formule toujours comme une réponse.",
        vrai: false,
        explication: "Il se formule comme une question ouverte ; la réponse viendra du choix.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Un atelier de couture de Lomé : classez chaque élément dans la SWOT.",
    categories: ["Force", "Faiblesse", "Opportunité", "Menace"],
    elements: [
      {
        texte: "Deux brodeuses reconnues dans tout le quartier.",
        categorie: 0,
      },
      {
        texte: "La friperie importée gagne du terrain sur les marchés.",
        categorie: 3,
      },
      {
        texte: "Aucun suivi écrit des commandes ni des délais.",
        categorie: 1,
      },
      {
        texte: "Les entreprises commandent de plus en plus de tenues en pagne pour leurs agents.",
        categorie: 2,
      },
    ],
  },
];
