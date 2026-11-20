/**
 * =============================================================
 *  Fichier    : m08.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 8 — La stratégie d'affaires : domaines d'activité,
 *               stratégies génériques, sources de différenciation, horloge
 *               stratégique, modèle d'affaires. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M08: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Qu'est-ce qu'un domaine d'activité stratégique (DAS) ?",
    choix: [
      {
        texte: "Un service de l'organigramme, comme la comptabilité.",
        explication: "Un service est une fonction, pas un domaine d'activité.",
      },
      {
        texte: "Un ensemble clients-besoins-concurrents qui demande sa propre stratégie.",
        explication: "Oui : on se bat différemment dans chaque DAS.",
      },
      {
        texte: "La liste complète des produits de l'entreprise.",
        explication: "Plusieurs produits peuvent former un même DAS, ou plusieurs.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Une stratégie de domination par les coûts implique-t-elle des prix bas ?",
    choix: [
      {
        texte: "Oui, toujours : c'est sa définition.",
        explication: "La définition porte sur les coûts, pas sur le prix.",
      },
      {
        texte: "Non : elle interdit de baisser les prix.",
        explication: "Rien ne l'interdit ; c'est un choix possible.",
      },
      {
        texte: "Pas forcément : coûts bas ne veut pas dire prix bas.",
        explication: "Oui : on peut vendre au prix du marché et garder une meilleure marge.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Que reproche-t-on à la « voie médiane » ?",
    choix: [
      {
        texte: "Elle n'est ni la moins chère ni vraiment différente : elle n'a pas d'avantage.",
        explication: "Oui : coincée au milieu, elle perd des deux côtés.",
      },
      {
        texte: "Elle coûte trop cher en publicité.",
        explication: "Le problème n'est pas la publicité, c'est l'absence de choix.",
      },
      {
        texte: "Elle ne vise qu'un petit segment.",
        explication: "C'est la focalisation, pas la voie médiane.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Qu'est-ce qui rend une différenciation durable ?",
    choix: [
      {
        texte: "Qu'elle plaise à la direction.",
        explication: "C'est le client qui compte.",
      },
      {
        texte: "Qu'elle soit la plus coûteuse possible.",
        explication: "Elle doit au contraire rester rentable.",
      },
      {
        texte: "Qu'elle soit annoncée dans un slogan.",
        explication: "Une promesse affichée n'est pas une différence réelle.",
      },
      {
        texte: "Qu'elle soit valorisée, visible, rentable et difficile à copier.",
        explication: "Oui : les quatre conditions.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question:
      "Infosystem passe d'une facturation à l'intervention à un forfait mensuel par poste. " +
      "Quel élément du modèle d'affaires change surtout ?",
    choix: [
      {
        texte: "Les flux de revenus.",
        explication: "Oui : le revenu devient récurrent et prévisible.",
      },
      {
        texte: "Les partenaires clés.",
        explication: "Les partenaires ne changent pas ici.",
      },
      {
        texte: "Les ressources clés.",
        explication: "L'équipe reste la même ; c'est la façon de facturer qui change.",
      },
    ],
    bonne: 0,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Stratégies génériques : vrai ou faux ?",
    affirmations: [
      {
        texte: "La focalisation vise un segment étroit, par les coûts ou la différenciation.",
        vrai: true,
        explication: "On choisit d'abord le terrain, puis la façon d'y gagner.",
      },
      {
        texte: "Dans l'horloge stratégique, l'hybride offre plus de valeur à un prix bas.",
        vrai: true,
        explication: "Cela suppose des coûts bas pour rester rentable.",
      },
      {
        texte: "Une entreprise peut gagner en restant moyenne partout.",
        vrai: false,
        explication: "Sans choix, elle n'a pas d'avantage.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Modèle d'affaires : vrai ou faux ?",
    affirmations: [
      {
        texte: "Le canevas du modèle d'affaires compte neuf blocs.",
        vrai: true,
        explication: "Des segments de clients à la structure de coûts.",
      },
      {
        texte: "Deux entreprises qui vendent le même produit ont forcément le même modèle.",
        vrai: false,
        explication: "La façon de capter la valeur peut différer complètement.",
      },
      {
        texte: "La proposition de valeur se situe au centre du canevas.",
        vrai: true,
        explication: "Elle relie ce que l'entreprise fait à ce que le client gagne.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Quelle stratégie générique chaque restaurant d'Abidjan suit-il ?",
    categories: ["Domination par les coûts", "Différenciation", "Focalisation"],
    elements: [
      {
        texte: "Un maquis qui achète en gros et sert vite, au prix le plus bas de la rue.",
        categorie: 0,
      },
      {
        texte: "Un restaurant qui sert uniquement des repas sans gluten pour les malades.",
        categorie: 2,
      },
      {
        texte: "Une table réputée pour son chef et son cadre, à des prix plus élevés.",
        categorie: 1,
      },
      {
        texte: "Une cantine qui ne livre que les employés des tours du Plateau.",
        categorie: 2,
      },
    ],
  },
];
