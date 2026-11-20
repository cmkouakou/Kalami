/**
 * =============================================================
 *  Fichier    : m07-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 7, leçon 1 — « L'intention stratégique » : fixer le cap avant de
 *               choisir la route, une même situation et trois ambitions pour Infosystem,
 *               quatre énoncés qui s'emboîtent, qui les écrit et comment. Sources : livre,
 *               module 7 (§ 7.1, figure 7.1) ; Hamel et Prahalad, 1989. Texte, exemples et
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
  exercice,
  fiche,
  liste,
  notion,
  p,
  piege,
  retenir,
  schema,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M07_L01: ContenuLecon = [
  p(
    "Le diagnostic décrit où en est Infosystem. Il ne dit pas où elle doit aller. Or on " +
      "ne choisit pas une stratégie dans l'absolu : une même situation peut justifier des " +
      "choix très différents selon l'**ambition** des dirigeants. Avant de choisir la " +
      "route, il faut fixer le cap.",
  ),

  titre("Une situation, trois ambitions"),
  p("Justin pourrait avoir trois intentions très différentes pour Infosystem :"),
  tableau(
    ["Intention de Justin", "Ce que la stratégie devrait privilégier"],
    [
      [
        "La faire grandir pour la vendre au meilleur prix",
        "Contrats récurrents, rentabilité, clientèle diversifiée : ce qui rassure un acheteur",
      ],
      [
        "La transmettre à ses deux seniors",
        "Former les seniors à la gestion, préparer le financement, transférer les clients",
      ],
      [
        "La stabiliser avant de se retirer",
        "Retenir l'équipe, documenter les savoirs, réduire la dépendance à Justin",
      ],
    ],
  ),
  p(
    "Le diagnostic est le même dans les trois cas. Les enjeux aussi. Mais l'ordre des " +
      "priorités, les risques acceptables et les objectifs changent complètement. Tant que " +
      "l'intention n'est pas dite, l'équipe ne peut pas savoir ce qu'on attend d'elle.",
  ),
  definition(
    "Intention stratégique",
    "L'ambition à long terme que se donne l'entreprise : une direction claire, qui dépasse " +
      "ses moyens actuels et mobilise l'organisation pour les dépasser. Gary Hamel et C. K. " +
      "Prahalad ont popularisé l'expression en 1989.",
  ),

  titre("Quatre énoncés qui s'emboîtent"),
  schema(
    "quatre-enonces",
    "Quatre énoncés, du plus large au plus précis : la vision dit où aller, la mission " +
      "pourquoi l'entreprise existe, les valeurs comment elle se comporte en chemin, les " +
      "objectifs comment on saura qu'elle avance.",
  ),
  tableau(
    ["Énoncé", "La question", "Horizon"],
    [
      ["Vision", "Où voulons-nous être ?", "5 à 10 ans, puis remplacée"],
      ["Mission", "Pourquoi existons-nous, et pour qui ?", "Durable"],
      ["Valeurs", "Comment nous comportons-nous ?", "Durable"],
      ["Objectifs", "Comment saurons-nous que nous avançons ?", "1 à 3 ans, révisés"],
    ],
  ),
  piege(
    "Rédiger ces énoncés avant le diagnostic. Une vision écrite sans connaître les forces, " +
      "les enjeux et les parties prenantes est un vœu pieux. L'ordre du cours n'est pas un " +
      "hasard : la direction vient **après** la compréhension.",
  ),

  titre("Qui les écrit, et comment"),
  p(
    "Les énoncés appartiennent aux dirigeants, mais ils ne s'écrivent pas seuls dans un " +
      "bureau. Quelques principes :",
  ),
  liste(
    "**Partir des enjeux** : chaque énoncé doit répondre à au moins un enjeu du module 5.",
    "**Associer les parties prenantes à gérer de près** (module 6) : pour Infosystem, les " +
      "seniors et quelques grands clients.",
    "**Dire l'intention personnelle des dirigeants** : vendre, transmettre ou stabiliser ? " +
      "Si elle reste cachée, tous les énoncés sonneront faux.",
    "**Faire court** : un énoncé qu'on ne peut pas répéter de mémoire ne guidera personne.",
  ),
  retenir(
    "La vision, la mission, les valeurs et les objectifs ne sont pas de la décoration. Ce " +
      "sont des **outils de décision** : face à un choix difficile, ils doivent aider à " +
      "trancher.",
  ),
  notion(
    "Pour aller plus loin : une ambition qui dépasse les moyens",
    p(
      "Hamel et Prahalad ont observé que des entreprises japonaises des années 1970 et " +
        "1980 s'étaient fixé des ambitions démesurées par rapport à leurs moyens, comme " +
        "rattraper des leaders mondiaux bien plus grands. Cet écart volontaire entre " +
        "l'ambition et les moyens les avait poussées à innover et à apprendre plus vite.",
    ),
    p(
      "Pour une PME, l'ambition doit rester crédible : un écart trop grand décourage au " +
        "lieu de mobiliser. Le bon dosage est une ambition qui oblige à progresser, sans " +
        "paraître inatteignable à l'équipe.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Rangez chaque phrase dans l'énoncé auquel elle appartient.",
    categories: ["Vision", "Mission", "Valeurs", "Objectifs"],
    elements: [
      {
        texte: "D'ici 2030, être la référence de la pâtisserie fine à Abidjan.",
        categorie: 0,
        explication: "Où l'entreprise veut être, avec un horizon.",
      },
      {
        texte: "Offrir aux familles des gâteaux de fête faits maison, livrés à l'heure.",
        categorie: 1,
        explication: "Pour qui elle travaille et ce qu'elle apporte.",
      },
      {
        texte: "Nous ne vendons jamais un gâteau de la veille.",
        categorie: 2,
        explication: "Un comportement attendu, même quand personne ne regarde.",
      },
      {
        texte: "Ouvrir un deuxième point de vente à Cocody d'ici 18 mois.",
        categorie: 3,
        explication: "Un résultat mesurable et daté.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pourquoi l'intention personnelle de Justin (vendre, transmettre ou stabiliser) " +
      "doit-elle être dite avant de choisir une stratégie ?",
    choix: [
      {
        texte: "Parce qu'elle change l'ordre des priorités et les objectifs.",
        explication: "Oui : le même diagnostic mène à des stratégies différentes selon elle.",
      },
      {
        texte: "Parce que la loi l'exige.",
        explication: "Aucune loi ne l'impose : c'est une question de cohérence.",
      },
      {
        texte: "Parce qu'elle remplace le diagnostic.",
        explication: "Elle le complète ; elle ne le remplace pas.",
      },
    ],
    bonne: 0,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Une vision peut être atteinte, puis remplacée.",
        vrai: true,
        explication: "Elle a un horizon ; la mission, elle, dure.",
      },
      {
        texte: "Il vaut mieux écrire la vision avant de faire le diagnostic.",
        vrai: false,
        explication: "Sans diagnostic, la vision ne répond à aucun enjeu réel.",
      },
      {
        texte: "Les objectifs traduisent la vision en résultats mesurables.",
        vrai: true,
        explication: "Ils disent comment on saura que l'entreprise avance.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Formulez l'intention stratégique de votre organisation en une phrase. Puis dites " +
      "laquelle de vos priorités changerait si cette intention était différente.",
    corrige: [
      "Une phrase qui dit l'ambition à long terme, au-delà des moyens actuels.",
      "Un lien avec au moins un enjeu du module 5.",
      "Une intention alternative crédible (vendre, croître, transmettre, stabiliser…).",
      "La priorité qui changerait, et pourquoi : preuve que l'intention guide les choix.",
    ],
  }),

  appliquez(
    6,
    "Dans l'étape 6, commencez par écrire en une phrase l'intention des dirigeants : " +
      "c'est elle qui orientera la vision, la mission et les objectifs.",
  ),
  fiche(
    "Le même diagnostic peut mener à des stratégies différentes selon l'ambition.",
    "Quatre énoncés : vision (où), mission (pourquoi), valeurs (comment), objectifs " +
      "(combien).",
    "La direction s'écrit après le diagnostic, en partant des enjeux.",
    "Dire l'intention des dirigeants, sinon tous les énoncés sonneront faux.",
    "Ce sont des outils de décision, pas de la décoration.",
  ),
];
