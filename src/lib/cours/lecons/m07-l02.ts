/**
 * =============================================================
 *  Fichier    : m07-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 7, leçon 2 — « Vision et mission : ne plus les confondre » : la
 *               différence entre les deux, le test du nom remplacé, l'ancienne et la
 *               nouvelle vision d'Infosystem, la mission comme outil de décision. Sources :
 *               livre, module 7 (§ 7.2 et 7.3, encadré « Une mission trop généreuse ») ;
 *               Collins et Porras, 1996. Texte, exemples et exercices originaux.
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
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M07_L02: ContenuLecon = [
  p(
    "Vision et mission sont les deux énoncés les plus souvent confondus. On trouve des " +
      "« visions » qui décrivent le métier actuel, et des « missions » qui parlent de " +
      "devenir le numéro un. Les distinguer n'est pas une affaire de vocabulaire : chacune " +
      "répond à une question différente.",
  ),

  titre("Deux questions différentes"),
  definition(
    "Vision",
    "L'image de ce que l'entreprise veut devenir à un horizon donné. Elle dit **où** " +
      "aller. Une fois atteinte, on en écrit une nouvelle.",
  ),
  definition(
    "Mission",
    "La raison d'être de l'entreprise : ce qu'elle fait, pour qui, et ce qu'elle leur " +
      "apporte. Elle dit **pourquoi** l'entreprise existe, et dure tant que le métier dure.",
  ),
  tableau(
    ["", "Vision", "Mission"],
    [
      ["Question", "Où voulons-nous être ?", "Pourquoi existons-nous ?"],
      ["Temps", "Le futur, avec un horizon", "Le présent, durable"],
      ["Rôle", "Donner un cap et mobiliser", "Guider les choix de tous les jours"],
      ["Signe d'échec", "Un slogan sans date ni ambition", "Une liste de produits sans client"],
    ],
  ),

  titre("Le test du nom remplacé"),
  p(
    "Un test simple démasque les énoncés creux : remplacez le nom de l'entreprise par " +
      "celui d'un concurrent. Si la phrase reste vraie, elle ne dit rien de particulier. " +
      "« Être le leader de notre marché grâce à l'excellence et à l'innovation » convient " +
      "à des milliers d'entreprises, donc à aucune.",
  ),
  tableau(
    ["", "Énoncé d'Infosystem"],
    [
      [
        "Ancienne vision",
        "« Être le meilleur fournisseur de services informatiques de la région. »",
      ],
      [
        "Nouvelle vision",
        "« D'ici 2031, être le partenaire informatique de confiance des PME de notre " +
          "région, reconnu pour la sécurité de leurs systèmes et porté par une équipe qui " +
          "choisit d'y faire carrière. »",
      ],
    ],
  ),
  p(
    "La nouvelle vision passe le test. Elle a un horizon (2031), une clientèle précise " +
      "(les PME de la région), un positionnement (la sécurité, qui répond à l'enjeu de " +
      "positionnement) et une condition interne (une équipe qui reste, qui répond à " +
      "l'enjeu de capacité). Chaque morceau renvoie à un enjeu du module 5.",
  ),
  retenir(
    "Une bonne vision tient en une ou deux phrases, porte une date, et contient au moins " +
      "un mot qu'un concurrent ne pourrait pas reprendre tel quel.",
  ),

  titre("La mission d'Infosystem"),
  p(
    "« Nous prenons en charge l'informatique des PME pour qu'elles travaillent l'esprit " +
      "tranquille : nous gardons leurs systèmes fiables, sûrs et conformes, et nous " +
      "intervenons vite quand ça compte. »",
  ),
  liste(
    "**Pour qui** : les PME, pas les grandes entreprises ni les particuliers.",
    "**Ce qu'elle fait** : prendre en charge leur informatique.",
    "**Ce qu'elle apporte** : l'esprit tranquille, grâce à des systèmes fiables, sûrs et " +
      "conformes.",
    "**Ce qui la distingue** : la rapidité d'intervention, héritée de sa culture.",
  ),
  piege(
    "Écrire une mission qui dit oui à tout. « Servir tous les clients, dans tous les " +
      "domaines de l'informatique » ne permet de refuser aucun contrat. Une mission utile " +
      "trace aussi ce que l'entreprise **ne fera pas**.",
  ),

  titre("La mission, outil de décision"),
  p(
    "Une mission claire sert surtout quand il faut dire non. Si un client propose à " +
      "Infosystem de développer un site de commerce en ligne, la mission répond : ce n'est " +
      "pas de la prise en charge de l'informatique d'une PME au sens du métier choisi. On " +
      "peut le recommander à un partenaire, sans disperser l'équipe.",
  ),
  terrain(
    "Une mission trop généreuse",
    "Avec BRVM Analyser, j'ai voulu rendre l'investissement boursier accessible au plus " +
      "grand nombre. J'ai fixé le prix de ma formation à 1 500 FCFA, soit environ 2 € ou " +
      "5 $, alors que les formations comparables se vendaient entre 25 000 et 60 000 FCFA. " +
      "Ma mission était généreuse, mais elle ne disait rien de la viabilité du projet : à " +
      "ce prix, il ne pouvait pas financer son propre développement. La lecture de Robert " +
      "Kiyosaki, « Avant de quitter votre emploi », m'a rappelé qu'une entreprise doit " +
      "d'abord survivre pour servir qui que ce soit.",
  ),
  notion(
    "Pour aller plus loin : l'idéologie de base",
    p(
      "James Collins et Jerry Porras ont proposé en 1996, dans la Harvard Business " +
        "Review, de distinguer ce qui ne doit jamais changer (l'**idéologie de base** : " +
        "la raison d'être et les valeurs) de ce qui doit changer sans cesse (les " +
        "stratégies, les pratiques, les objectifs).",
    ),
    p(
      "Ils recommandent aussi un objectif audacieux à 10 ou 30 ans, assez clair pour que " +
        "chacun sache quand il est atteint. Pour une PME, un horizon de 5 à 10 ans est " +
        "plus réaliste.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Une clinique dentaire de Douala a rédigé ces phrases. Vision ou mission ?",
    categories: ["Vision", "Mission"],
    elements: [
      {
        texte: "D'ici 2030, être la clinique de référence pour les enfants à Douala.",
        categorie: 0,
        explication: "Un futur daté, une position à atteindre.",
      },
      {
        texte: "Soigner les familles sans douleur et sans surprise sur la facture.",
        categorie: 1,
        explication: "Pour qui, ce qu'elle fait, ce qu'elle apporte.",
      },
      {
        texte: "Ouvrir un centre d'orthodontie reconnu dans toute la région du Littoral.",
        categorie: 0,
        explication: "Une ambition de développement : ce qu'elle veut devenir.",
      },
      {
        texte: "Rendre les soins dentaires accessibles aux familles salariées du quartier.",
        categorie: 1,
        explication: "Sa raison d'être, au présent.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "« Être le leader de notre secteur grâce à l'excellence et à l'innovation. » Que " +
      "révèle le test du nom remplacé ?",
    choix: [
      {
        texte: "Que l'énoncé est excellent, car il est ambitieux.",
        explication: "L'ambition ne suffit pas : il faut qu'il soit propre à l'entreprise.",
      },
      {
        texte: "Que n'importe quel concurrent pourrait signer la même phrase.",
        explication: "Oui : un énoncé qui convient à tous ne guide personne.",
      },
      {
        texte: "Qu'il faut ajouter le nom de l'entreprise dans la phrase.",
        explication: "Ajouter un nom ne change rien au fond de l'énoncé.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "La mission doit dire aussi, implicitement, ce que l'entreprise ne fera pas.",
        vrai: true,
        explication: "C'est ce qui permet de refuser un contrat hors du métier.",
      },
      {
        texte: "Une vision sans horizon de temps est plus souple, donc meilleure.",
        vrai: false,
        explication: "Sans date, personne ne sait quand elle sera atteinte ni s'il faut " +
          "accélérer.",
      },
      {
        texte: "Une mission généreuse garantit le succès d'un projet.",
        vrai: false,
        explication: "Elle doit aussi permettre à l'entreprise de vivre et de se développer.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Rédigez la vision et la mission de votre organisation. Appliquez-leur le test du nom " +
      "remplacé, puis citez une demande que la mission vous permettrait de refuser.",
    corrige: [
      "Une vision datée, avec une position précise, liée à au moins un enjeu.",
      "Une mission qui dit pour qui, quoi, et ce que l'organisation apporte.",
      "Le test appliqué honnêtement : les mots qu'un concurrent ne pourrait pas reprendre.",
      "Une demande concrète écartée grâce à la mission, preuve qu'elle sert à décider.",
    ],
  }),

  appliquez(
    6,
    "Dans l'étape 6, écrivez votre vision (avec une date) et votre mission (pour qui, " +
      "quoi, quel apport), puis vérifiez-les avec le test du nom remplacé.",
  ),
  fiche(
    "Vision : où aller, avec un horizon. Mission : pourquoi exister, pour qui.",
    "Le test du nom remplacé démasque les énoncés creux.",
    "Chaque morceau de la vision doit renvoyer à un enjeu.",
    "Une mission utile permet aussi de dire non.",
    "Généreuse ou pas, la mission doit laisser l'entreprise vivre.",
  ),
];
