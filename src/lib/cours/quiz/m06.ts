/**
 * =============================================================
 *  Fichier    : m06.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 6 — Parties prenantes, gouvernance, RSE et culture :
 *               matrice pouvoir-intérêt, plan d'engagement, deux modèles de
 *               gouvernance, postures RSE, toile culturelle, dérive stratégique.
 *               Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M06: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question:
      "Une partie prenante a beaucoup de pouvoir mais peu d'intérêt pour votre projet. " +
      "Que faire selon la matrice pouvoir-intérêt ?",
    choix: [
      {
        texte: "L'associer étroitement à chaque décision.",
        explication: "C'est pour les parties à fort pouvoir et fort intérêt.",
      },
      {
        texte: "La garder satisfaite, sans la surcharger.",
        explication: "Oui : son pouvoir impose de veiller à ce qu'elle ne s'oppose pas.",
      },
      {
        texte: "L'ignorer, puisqu'elle ne s'intéresse pas au projet.",
        explication: "Son intérêt peut changer ; son pouvoir, lui, reste.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Qu'est-ce qui distingue la gouvernance partenariale ?",
    choix: [
      {
        texte: "L'entreprise rend des comptes aux seuls actionnaires.",
        explication: "C'est la gouvernance actionnariale.",
      },
      {
        texte: "Le dirigeant décide seul, sans conseil d'administration.",
        explication: "Ce n'est pas un modèle de gouvernance, c'est son absence.",
      },
      {
        texte: "L'entreprise tient compte de plusieurs parties prenantes dans ses décisions.",
        explication: "Oui : employés, clients, communautés, et pas seulement le capital.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Comment vérifier qu'un engagement RSE est réel et non décoratif ?",
    choix: [
      {
        texte: "Chercher une décision où cet engagement a coûté quelque chose.",
        explication: "Oui : un engagement qui n'a jamais rien coûté reste une déclaration.",
      },
      {
        texte: "Compter les pages du rapport RSE.",
        explication: "La longueur d'un rapport ne prouve rien.",
      },
      {
        texte: "Vérifier qu'il figure sur le site Internet.",
        explication: "L'afficher ne prouve pas qu'on l'applique.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Qu'appelle-t-on la « dérive stratégique » ?",
    choix: [
      {
        texte: "Le choix délibéré de changer de stratégie.",
        explication: "La dérive n'est justement pas délibérée.",
      },
      {
        texte: "Une fraude de la direction.",
        explication: "Rien à voir : il s'agit d'un décalage, pas d'une faute.",
      },
      {
        texte: "La baisse des prix sur un marché.",
        explication: "C'est un fait de marché, pas une dérive de l'entreprise.",
      },
      {
        texte: "L'écart qui grandit entre l'environnement et une entreprise qui ne change pas.",
        explication: "Oui : souvent entretenue par une culture qui protège les habitudes.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Quel niveau de la culture est le plus difficile à voir ?",
    choix: [
      {
        texte: "Les artefacts : locaux, tenues, rituels.",
        explication: "Ils se voient au premier coup d'œil.",
      },
      {
        texte: "Les valeurs affichées.",
        explication: "Elles sont écrites, donc visibles.",
      },
      {
        texte: "Les hypothèses de base, tenues pour évidentes.",
        explication: "Oui : personne ne les dit, mais elles guident les décisions.",
      },
    ],
    bonne: 2,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Parties prenantes et engagement : vrai ou faux ?",
    affirmations: [
      {
        texte: "Une partie prenante peut changer de case dans la matrice au fil du temps.",
        vrai: true,
        explication: "Un projet ou une crise peut éveiller son intérêt.",
      },
      {
        texte: "Le plan d'engagement va d'informer à déléguer, via consulter et associer.",
        vrai: true,
        explication: "Chaque niveau donne plus de place à la partie prenante.",
      },
      {
        texte: "Consulter, c'est s'engager à faire ce que la partie prenante demande.",
        vrai: false,
        explication: "Consulter, c'est écouter avant de décider ; on doit ensuite expliquer.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Culture : vrai ou faux ?",
    affirmations: [
      {
        texte: "La toile culturelle aide à rendre visibles les habitudes d'une organisation.",
        vrai: true,
        explication: "Rituels, histoires, symboles, pouvoir, structures, contrôles.",
      },
      {
        texte: "Une stratégie contraire à la culture s'applique sans peine si elle est logique.",
        vrai: false,
        explication: "La culture résiste ; il faut la prendre en compte dès le choix.",
      },
      {
        texte: "Les histoires qu'on raconte dans l'entreprise révèlent ce qu'elle valorise.",
        vrai: true,
        explication: "Elles disent qui sont les héros et ce qui est puni.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne:
      "Une coopérative de cacao lance une usine de transformation : où placer chaque " +
      "partie prenante dans la matrice pouvoir-intérêt ?",
    categories: [
      "Gérer de près",
      "Garder satisfait",
      "Tenir informé",
      "Surveiller",
    ],
    elements: [
      {
        texte: "La banque qui finance l'usine et suit chaque étape.",
        categorie: 0,
        explication: "Fort pouvoir, fort intérêt.",
      },
      {
        texte: "Le ministère, qui délivre les agréments mais suit de loin.",
        categorie: 1,
        explication: "Fort pouvoir, intérêt modéré.",
      },
      {
        texte: "Les riverains, inquiets du bruit, mais sans moyen d'agir.",
        categorie: 2,
        explication: "Fort intérêt, peu de pouvoir.",
      },
      {
        texte: "Un fournisseur de sacs parmi d'autres.",
        categorie: 3,
        explication: "Peu de pouvoir, peu d'intérêt.",
      },
    ],
  },
];
