/**
 * =============================================================
 *  Fichier    : m05-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 5, leçon 3 — « Formuler les enjeux stratégiques » : de nombreux
 *               constats à quelques enjeux, comment formuler un enjeu, les trois enjeux
 *               d'Infosystem, prioriser ce que la SWOT ne hiérarchise pas. Sources : livre,
 *               module 5 (§ 5.5, « Ce que l'outil ne vous dira pas »). Texte, exemples et
 *               exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
  etapes,
  exercice,
  fiche,
  notion,
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M05_L03: ContenuLecon = [
  p(
    "Une SWOT bien faite contient une quinzaine de constats, la TOWS autant de pistes. " +
      "Aucun dirigeant ne peut garder tout cela en tête pendant des années. Le diagnostic " +
      "doit se conclure par **quelques enjeux**, ceux qui guideront toute la suite.",
  ),

  definition(
    "Enjeu stratégique",
    "Une question décisive pour l'avenir de l'entreprise, qui regroupe plusieurs constats " +
      "du diagnostic. Ce que l'entreprise peut gagner ou perdre selon la réponse qu'elle " +
      "y apportera.",
  ),

  titre("De quinze constats à trois enjeux"),
  p("La démarche tient en quatre étapes :"),
  etapes(
    "**Regrouper** les constats qui parlent de la même chose, même s'ils sont dans des " +
      "cases différentes (une faiblesse et une menace peuvent décrire le même risque).",
    "**Nommer** chaque groupe par un mot clé : capacité, positionnement, financement…",
    "**Formuler** l'enjeu comme une question ou une tension : ce qu'il faut réussir, et " +
      "ce qui arrive si on échoue.",
    "**Vérifier** que chaque enjeu s'appuie sur plusieurs constats sourcés, et qu'aucun " +
      "constat important n'est resté orphelin.",
  ),
  piege(
    "Formuler un enjeu comme une solution. « Recruter cinq techniciens » est une action. " +
      "L'enjeu est en amont : « stabiliser une équipe capable de suivre la demande ». " +
      "Garder la question ouverte laisse la place à plusieurs réponses possibles.",
  ),

  titre("Les trois enjeux d'Infosystem"),
  tableau(
    ["Enjeu", "La question", "Constats regroupés"],
    [
      [
        "Capacité",
        "Comment stabiliser une équipe assez solide pour croître ?",
        "Départs des jeunes techniciens ; pénurie de main-d'œuvre ; charge des seniors",
      ],
      [
        "Positionnement",
        "Où se situer, alors que le soutien de base perd de sa valeur et l'expertise en " +
          "gagne ?",
        "Substituts et IA ; rivalité ; demande en sécurité, conformité et nuage",
      ],
      [
        "Pérennité",
        "Comment rendre l'entreprise propriétaire de ses atouts avant le départ de " +
          "Justin ?",
        "Savoirs non documentés ; dépendance à quelques personnes ; relève non préparée",
      ],
    ],
  ),
  p(
    "Ces trois enjeux sont liés, et c'est une bonne nouvelle : certaines actions servent " +
      "les trois à la fois. Former les jeunes techniciens à la sécurité stabilise l'équipe " +
      "(capacité), prépare l'offre de demain (positionnement) et répartit le savoir " +
      "(pérennité).",
  ),

  titre("Prioriser ce que la SWOT ne hiérarchise pas"),
  p(
    "La SWOT a une limite : une faiblesse mineure y occupe autant de place qu'une " +
      "faiblesse qui menace la survie. Pour classer les enjeux, deux questions simples " +
      "aident :",
  ),
  tableau(
    ["Critère", "La question"],
    [
      ["Gravité", "Que perd l'entreprise si l'enjeu n'est pas traité ?"],
      ["Urgence", "Combien de temps reste-t-il avant que la perte ne survienne ?"],
      ["Levier", "Traiter cet enjeu en facilite-t-il d'autres ?"],
    ],
  ),
  retenir(
    "Pour Infosystem, la **capacité** a un argument fort : sans équipe stable, " +
      "l'entreprise ne peut ni se repositionner ni préparer sa relève. Traiter la " +
      "capacité d'abord sert aussi les deux autres enjeux.",
  ),
  notion(
    "Pour aller plus loin : combien d'enjeux ?",
    p(
      "Trois à cinq est un bon repère. Avec un seul, on risque d'oublier une dimension ; " +
        "avec dix, on retrouve la liste qu'on voulait résumer. L'important est que chacun " +
        "puisse être dit en une phrase et retenu par toute l'équipe.",
    ),
    p(
      "Les enjeux ne sont pas encore la stratégie. Ils disent ce qu'il faut résoudre ; la " +
        "vision dira où l'on veut aller (module 7), et le choix de stratégie dira comment " +
        "(modules 8 à 12).",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question: "Laquelle de ces formulations est un enjeu stratégique, et non une action ?",
    choix: [
      {
        texte: "Ouvrir une deuxième agence à Kumasi.",
        explication: "C'est une réponse possible, pas la question qu'elle résout.",
      },
      {
        texte: "Réduire les prix de 10 %.",
        explication: "Une action, qui ferme d'avance les autres options.",
      },
      {
        texte: "Comment rester rentable face à des concurrents qui cassent les prix ?",
        explication: "Oui : une question ouverte qui regroupe plusieurs constats.",
      },
    ],
    bonne: 2,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne:
      "Une imprimerie de Dakar a dégagé deux enjeux : « Numérique » (l'impression papier " +
      "recule) et « Trésorerie » (les paiements arrivent tard). Rattachez chaque constat " +
      "à son enjeu.",
    categories: ["Numérique", "Trésorerie"],
    elements: [
      {
        texte: "Les administrations publient de plus en plus leurs documents en ligne.",
        categorie: 0,
        explication: "Une menace sur la demande d'impression.",
      },
      {
        texte: "Les grands clients paient à 120 jours.",
        categorie: 1,
        explication: "Un constat sur les délais d'encaissement.",
      },
      {
        texte: "L'équipe ne maîtrise pas la conception de sites Web.",
        categorie: 0,
        explication: "Une faiblesse qui empêche de suivre le virage numérique.",
      },
      {
        texte: "La liquidité générale est passée sous 1.",
        categorie: 1,
        explication: "Les dettes de l'année dépassent ce qui rentrera.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Un enjeu regroupe en général plusieurs constats du diagnostic.",
        vrai: true,
        explication: "C'est ce qui permet de passer de quinze constats à trois enjeux.",
      },
      {
        texte: "La SWOT suffit à classer les enjeux par ordre d'importance.",
        vrai: false,
        explication: "Elle ne hiérarchise rien : il faut juger la gravité, l'urgence, le levier.",
      },
      {
        texte: "Une action peut servir plusieurs enjeux à la fois.",
        vrai: true,
        explication: "Former les techniciens d'Infosystem en sert trois.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "À partir de votre SWOT, formulez trois enjeux pour votre organisation. Classez-les " +
      "par priorité et justifiez votre premier choix.",
    corrige: [
      "Trois enjeux formulés comme des questions ou des tensions, pas comme des actions.",
      "Pour chacun, les constats de la SWOT qu'il regroupe.",
      "Un classement justifié par la gravité, l'urgence ou l'effet de levier.",
      "Une action repérée qui servirait plusieurs enjeux à la fois.",
    ],
  }),

  appliquez(
    5,
    "Terminez l'étape 5 en formulant vos trois à cinq enjeux stratégiques, classés par " +
      "priorité.",
  ),
  fiche(
    "Le diagnostic se conclut par trois à cinq enjeux, pas par une liste.",
    "Regrouper, nommer, formuler, vérifier.",
    "Un enjeu est une question ouverte, pas une solution.",
    "Prioriser selon la gravité, l'urgence et l'effet de levier.",
    "Infosystem : capacité, positionnement, pérennité, et la capacité d'abord.",
  ),
];
