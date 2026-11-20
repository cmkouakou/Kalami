/**
 * =============================================================
 *  Fichier    : m09.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 9 — La stratégie corporative : matrice d'Ansoff,
 *               diversification, intégration, matrice BCG, stratégie
 *               internationale. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M09: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question:
      "Une boulangerie de Bamako vend ses pains habituels dans une nouvelle ville. Quelle " +
      "case de la matrice d'Ansoff ?",
    choix: [
      {
        texte: "Pénétration du marché.",
        explication: "La pénétration reste sur le marché actuel.",
      },
      {
        texte: "Développement de produits.",
        explication: "Les produits ne changent pas.",
      },
      {
        texte: "Développement de marché.",
        explication: "Oui : produits actuels, marché nouveau.",
      },
      {
        texte: "Diversification.",
        explication: "Il faudrait un produit nouveau et un marché nouveau.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Qu'est-ce qu'une diversification liée ?",
    choix: [
      {
        texte: "Entrer dans un domaine qui partage des ressources ou des compétences.",
        explication: "Oui : c'est là que des synergies sont possibles.",
      },
      {
        texte: "Racheter un fournisseur.",
        explication: "C'est une intégration en amont.",
      },
      {
        texte: "Entrer dans un domaine sans aucun lien, pour répartir les risques.",
        explication: "C'est une diversification non liée.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Un fabricant de jus achète la plantation de mangues qui le fournit. C'est :",
    choix: [
      {
        texte: "Une intégration en aval.",
        explication: "L'aval va vers le client, pas vers le fournisseur.",
      },
      {
        texte: "Une intégration en amont.",
        explication: "Oui : il remonte vers sa source d'approvisionnement.",
      },
      {
        texte: "Une intégration horizontale.",
        explication: "L'horizontale rachète un concurrent.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q4",
    question:
      "Dans la matrice BCG, une activité à forte part de marché dans un marché à faible " +
      "croissance est :",
    choix: [
      {
        texte: "Une vedette.",
        explication: "Une vedette est dans un marché en forte croissance.",
      },
      {
        texte: "Un dilemme.",
        explication: "Un dilemme a une faible part dans un marché en croissance.",
      },
      {
        texte: "Un poids mort.",
        explication: "Un poids mort a une faible part.",
      },
      {
        texte: "Une vache à lait.",
        explication: "Oui : elle dégage des liquidités pour financer les autres.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question:
      "Une PME sénégalaise veut vendre au Mali en prenant peu de risques au départ. Quel " +
      "mode d'entrée convient le mieux ?",
    choix: [
      {
        texte: "L'exportation, par un distributeur local.",
        explication: "Oui : peu d'investissement, et on apprend le marché.",
      },
      {
        texte: "Construire une usine à Bamako.",
        explication: "C'est le mode le plus risqué et le plus coûteux.",
      },
      {
        texte: "Racheter le premier concurrent malien.",
        explication: "L'acquisition engage beaucoup de capital d'emblée.",
      },
    ],
    bonne: 0,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Diversification : vrai ou faux ?",
    affirmations: [
      {
        texte: "Les synergies annoncées se réalisent presque toujours.",
        vrai: false,
        explication: "Elles sont souvent surestimées : il faut les tester.",
      },
      {
        texte:
          "Une diversification devrait créer plus de valeur que des activités séparées.",
        vrai: true,
        explication: "Sinon, l'actionnaire pourrait diversifier lui-même son portefeuille.",
      },
      {
        texte: "La diversification est la case la plus risquée de la matrice d'Ansoff.",
        vrai: true,
        explication: "Produit et marché sont nouveaux tous les deux.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "International : vrai ou faux ?",
    affirmations: [
      {
        texte: "L'UEMOA facilite les échanges grâce à une monnaie commune.",
        vrai: true,
        explication: "Le franc CFA supprime le risque de change entre ses pays.",
      },
      {
        texte: "Un produit qui marche chez soi marche forcément chez les voisins.",
        vrai: false,
        explication: "Goûts, réseaux et règles diffèrent : il faut vérifier.",
      },
      {
        texte: "Le choix d'une stratégie internationale dépend des pressions à adapter localement.",
        vrai: true,
        explication: "Et des pressions à réduire les coûts par l'échelle.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Un groupe agroalimentaire : placez chaque activité dans la matrice BCG.",
    categories: ["Vedette", "Vache à lait", "Dilemme", "Poids mort"],
    elements: [
      {
        texte: "Huile de palme : leader d'un marché stable.",
        categorie: 1,
      },
      {
        texte: "Jus de fruits : petit acteur d'un marché en plein essor.",
        categorie: 2,
      },
      {
        texte: "Yaourts : leader d'un marché qui croît vite.",
        categorie: 0,
      },
      {
        texte: "Farine en sacs : petit acteur d'un marché qui stagne.",
        categorie: 3,
      },
    ],
  },
];
