/**
 * =============================================================
 *  Fichier    : m13.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 13 — Le plan stratégique : structure en huit
 *               sections, cinq qualités d'un bon plan, leçons du cas Ajinomoto,
 *               réviser le plan. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M13: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Quelle longueur vise un plan stratégique de PME, selon le cours ?",
    choix: [
      {
        texte: "Une page.",
        explication: "Trop court pour relier diagnostic, choix et suivi.",
      },
      {
        texte: "Cinq à six pages.",
        explication: "Oui : assez pour être complet, assez court pour être lu.",
      },
      {
        texte: "Au moins cinquante pages.",
        explication: "Un plan que personne ne lit ne guide personne.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Que veut dire qu'un plan est « traçable » ?",
    choix: [
      {
        texte: "Il est rangé dans un dossier partagé.",
        explication: "Il s'agit du lien entre les parties, pas du rangement.",
      },
      {
        texte: "Chaque page porte une date.",
        explication: "La date ne relie pas les choix aux faits.",
      },
      {
        texte: "Chaque choix remonte à un fait du diagnostic.",
        explication: "Oui : on peut suivre le fil du constat à l'action.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question:
      "Dans le cas Ajinomoto en Afrique de l'Ouest, l'usine était performante. Quel " +
      "était le vrai problème ?",
    choix: [
      {
        texte: "Le produit ne se vendait pas : le marché n'avait jamais été mesuré.",
        explication: "Oui : produire bien ne suffit pas si personne n'achète.",
      },
      {
        texte: "Les machines tombaient en panne.",
        explication: "L'usine, au contraire, fonctionnait bien.",
      },
      {
        texte: "Le prix des matières premières avait doublé.",
        explication: "Ce n'est pas le constat du cas.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q4",
    question:
      "Que montre le résultat de la vente directe dans ce cas (environ 1,6 % de " +
      "l'objectif) ?",
    choix: [
      {
        texte: "Que les vendeurs manquaient de motivation.",
        explication: "Le cas pointe un problème de stratégie, pas d'effort.",
      },
      {
        texte: "Que l'objectif était juste, mais l'exécution mauvaise.",
        explication: "L'objectif reposait sur un marché jamais mesuré.",
      },
      {
        texte: "Qu'il suffisait de baisser le prix.",
        explication: "Rumeur et contrefaçon ne se règlent pas par le prix seul.",
      },
      {
        texte: "Qu'un objectif fixé sans diagnostic du marché ne veut rien dire.",
        explication: "Oui : l'écart révèle l'absence de diagnostic.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Quand le coach du cours vous aide à rédiger le plan, qui fait les choix ?",
    choix: [
      {
        texte: "Le coach : il connaît mieux la méthode.",
        explication: "Le coach aide ; il ne connaît pas votre entreprise comme vous.",
      },
      {
        texte: "Vous : le coach aide, mais les choix restent les vôtres.",
        explication: "Oui : c'est votre plan et votre responsabilité.",
      },
      {
        texte: "Personne : le plan se génère automatiquement.",
        explication: "La génération est un brouillon à retoucher.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Les qualités d'un bon plan : vrai ou faux ?",
    affirmations: [
      {
        texte: "Un bon plan prévoit ce qu'on fera si une hypothèse se révèle fausse.",
        vrai: true,
        explication: "Il prévoit l'échec, au lieu de l'ignorer.",
      },
      {
        texte: "Un bon plan évite de nommer des responsables, pour ne froisser personne.",
        vrai: false,
        explication: "Il nomme : un chantier sans nom n'avance pas.",
      },
      {
        texte: "Un bon plan dit clairement ce à quoi l'entreprise renonce.",
        vrai: true,
        explication: "Renoncer fait partie de choisir.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Après la rédaction : vrai ou faux ?",
    affirmations: [
      {
        texte: "Une fois rédigé, le plan reste figé jusqu'à son terme.",
        vrai: false,
        explication: "Le plan se révise quand les faits changent.",
      },
      {
        texte: "Citer ses sources rend le plan plus crédible.",
        vrai: true,
        explication: "Un lecteur peut vérifier d'où viennent les faits.",
      },
      {
        texte: "Le plan peut s'exporter pour être partagé avec l'équipe ou un financeur.",
        vrai: true,
        explication: "En PDF ou en document modifiable.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Quel défaut de plan chaque phrase illustre-t-elle ?",
    categories: [
      "Pas de lien avec le diagnostic",
      "Aucun renoncement",
      "Personne n'est nommé",
      "Échec non prévu",
    ],
    elements: [
      {
        texte: "« Nous développerons tous nos produits sur tous nos marchés. »",
        categorie: 1,
      },
      {
        texte: "« L'équipe veillera à améliorer le service. »",
        categorie: 2,
      },
      {
        texte: "« Nous ouvrirons trois agences », sans aucun constat qui le justifie.",
        categorie: 0,
      },
      {
        texte: "« Les ventes doubleront », sans dire quoi faire si elles stagnent.",
        categorie: 3,
      },
    ],
  },
];
