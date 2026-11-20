/**
 * =============================================================
 *  Fichier    : m04-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 4, leçon 3 — « Le VRIO : vers l'avantage concurrentiel durable » :
 *               quatre tests successifs, les cinq résultats, le VRIO d'Infosystem, les
 *               trois chantiers pour devenir propriétaire de ses atouts. Sources : livre,
 *               module 4 (§ 4.4, tableau 4.1, NPSP-CI) ; Barney, 1991 et 1995. Texte,
 *               exemples et exercices originaux.
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
  schema,
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M04_L03: ContenuLecon = [
  p(
    "Infosystem a quatre ressources qui semblent distinctives. Mais un avantage qui " +
      "disparaît au premier départ d'un employé est-il vraiment un avantage ? Le modèle " +
      "VRIO, présenté par Jay Barney en 1995, répond à cette question en quatre tests.",
  ),

  titre("Quatre tests, dans l'ordre"),
  schema(
    "vrio",
    "Quatre tests successifs, de gauche à droite : valeur, rareté, imitabilité, " +
      "organisation. Un échec à un test arrête le parcours et donne un résultat : " +
      "désavantage, parité, avantage temporaire, avantage non exploité. Seule une ressource " +
      "qui passe les quatre tests procure un avantage concurrentiel durable.",
  ),
  tableau(
    ["Test", "La question", "Un « non » signifie…"],
    [
      [
        "V — Valeur",
        "Aide-t-elle à saisir une opportunité ou à contrer une menace ?",
        "Désavantage",
      ],
      ["R — Rareté", "Est-elle rare parmi les concurrents ?", "Parité"],
      ["I — Imitabilité", "Est-elle difficile à imiter ou à remplacer ?", "Avantage temporaire"],
      [
        "O — Organisation",
        "L'entreprise est-elle organisée pour l'exploiter ?",
        "Avantage non exploité",
      ],
    ],
    "Quatre « oui » : avantage concurrentiel durable.",
  ),
  definition(
    "Parité concurrentielle",
    "Situation où une ressource est utile mais répandue : elle est nécessaire pour " +
      "rester dans la course, mais tout le monde l'a. Elle ne fait pas gagner, elle évite " +
      "de perdre.",
  ),
  piege(
    "Sauter un test parce que la réponse semble évidente. L'ordre compte : une ressource " +
      "facile à imiter n'a pas besoin d'être organisée pour être perdue, et une ressource " +
      "sans valeur n'a pas besoin d'être rare pour être inutile.",
  ),

  titre("Pourquoi certaines ressources sont difficiles à imiter"),
  p("Trois raisons reviennent souvent :"),
  etapes(
    "**L'histoire** : la ressource s'est construite sur des années, et le temps ne " +
      "s'achète pas. Une réputation de trente ans ne se copie pas en six mois.",
    "**L'ambiguïté** : même l'entreprise ne sait pas exactement ce qui fait son succès. " +
      "Comment imiter ce que personne ne sait décrire ?",
    "**La complexité sociale** : la ressource repose sur des relations, une culture, une " +
      "confiance entre personnes. On peut débaucher un employé, pas toute une équipe et " +
      "ses habitudes.",
  ),

  titre("Le VRIO d'Infosystem"),
  tableau(
    ["Ressource", "V", "R", "I", "O", "Résultat"],
    [
      ["Expertise des deux seniors", "Oui", "Oui", "Oui", "Partiel", "Avantage fragile"],
      ["Réputation et réseau de Justin", "Oui", "Oui", "Oui", "Non", "Avantage non exploité"],
      ["Souplesse d'une petite structure", "Oui", "Non", "—", "—", "Parité"],
      ["Connaissance des systèmes des clients", "Oui", "Oui", "Oui", "Partiel", "Avantage fragile"],
    ],
    "Livre, tableau 4.1. Le tiret signifie que le test n'est pas passé : le parcours s'est " +
      "arrêté avant.",
  ),
  p(
    "La souplesse est réelle et précieuse, mais presque toutes les petites entreprises de " +
      "services sont souples : simple **parité**. Les trois autres ressources passent les " +
      "trois premiers tests, puis trébuchent sur l'organisation. Le livre parle alors " +
      "d'**avantage fragile** : il existe aujourd'hui, mais peut disparaître du jour au " +
      "lendemain.",
  ),
  retenir(
    "Les atouts d'Infosystem sont réels, mais l'entreprise n'en est pas vraiment " +
      "propriétaire : ils vivent dans la tête de quelques personnes. Trois chantiers les " +
      "rendraient durables :",
    [
      "documenter les savoirs et l'historique de chaque client ;",
      "faire grandir de nouveaux experts aux côtés des seniors ;",
      "faire passer peu à peu la réputation de Justin à la marque Infosystem.",
    ],
  ),

  terrain(
    "Quand la mémoire de l'entreprise s'absente",
    "À la NPSP-CI, ma supérieure directe, cheffe du département, était la mémoire de la " +
      "maison : même les autres départements venaient chercher son expertise. Quand elle a " +
      "dû s'absenter longtemps, je dirigeais un jeune service de gestion des comptes " +
      "clients et je perdais mon principal appui. Mon équipe est allée chercher elle-même " +
      "l'information auprès des autres départements, et j'ai travaillé de beaucoup plus " +
      "près avec le directeur commercial. Une compétence logée dans une seule personne rend " +
      "l'entreprise vulnérable à la moindre absence. Chez nous, l'absence était temporaire ; " +
      "chez Infosystem, quand un technicien démissionne, elle est définitive.",
  ),
  notion(
    "Pour aller plus loin : le biais des dirigeants",
    p(
      "L'analyse interne a un biais naturel : ce sont souvent les dirigeants qui la " +
        "mènent, et ils ont tendance à surestimer leurs forces. Le meilleur antidote est de " +
        "confronter ses conclusions à l'avis des clients et des employés.",
    ),
    p(
      "Une question simple aide : « Si un client devait expliquer à un ami pourquoi il nous " +
        "a choisis, que dirait-il ? » Une force que les clients ne perçoivent pas n'en est " +
        "pas vraiment une.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Un restaurant d'Abidjan a la meilleure recette d'attiéké-poisson du quartier, mais " +
      "un concurrent l'a goûtée et la reproduit fidèlement en un mois. Quel est le " +
      "résultat VRIO de cette recette ?",
    choix: [
      {
        texte: "Parité.",
        explication: "Elle était rare au départ : la parité suppose qu'elle soit déjà répandue.",
      },
      {
        texte: "Avantage temporaire.",
        explication:
          "Oui : précieuse et rare, mais facile à imiter. L'avantage dure le temps que les " +
          "concurrents la reproduisent.",
      },
      {
        texte: "Avantage concurrentiel durable.",
        explication: "Il faudrait qu'elle soit difficile à imiter, ce qui n'est pas le cas.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne: "Associez chaque situation au résultat VRIO qui lui correspond.",
    categories: [
      "Parité",
      "Avantage temporaire",
      "Avantage non exploité",
      "Avantage durable",
    ],
    elements: [
      {
        texte: "Une pharmacie accepte le paiement par Mobile Money, comme toutes ses voisines.",
        categorie: 0,
        explication: "Utile, mais répandu : la ressource n'est pas rare.",
      },
      {
        texte:
          "Une agence de voyages est la première de sa ville à vendre en ligne ; les autres " +
          "s'y mettront dans l'année.",
        categorie: 1,
        explication: "Précieux et rare, mais facile à copier.",
      },
      {
        texte:
          "Une entreprise détient une base de données clients unique, que personne ne " +
          "consulte ni n'exploite.",
        categorie: 2,
        explication: "Valeur, rareté, inimitabilité : oui. Organisation : non.",
      },
      {
        texte:
          "Une coopérative a bâti en vingt ans un réseau de 3 000 planteurs fidèles, géré " +
          "par une équipe dédiée.",
        categorie: 3,
        explication:
          "Précieux, rare, très difficile à imiter (histoire, relations) et bien organisé.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Pour Infosystem, c'est surtout le test de l'organisation qui fait trébucher.",
        vrai: true,
        explication: "Trois ressources sur quatre passent V, R et I, puis échouent sur O.",
      },
      {
        texte: "Une ressource difficile à imiter procure toujours un avantage durable.",
        vrai: false,
        explication: "Encore faut-il que l'entreprise soit organisée pour l'exploiter.",
      },
      {
        texte: "Une relation de confiance construite sur des années est difficile à imiter.",
        vrai: true,
        explication: "L'histoire et la complexité sociale ne s'achètent pas.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Proposez deux mesures concrètes pour qu'Infosystem devienne « propriétaire » de la " +
      "connaissance qu'ont ses techniciens des systèmes de ses clients.",
    corrige: [
      "Une fiche documentaire à jour pour chaque client (parc, accès, historique " +
        "d'incidents, particularités), tenue dans un outil commun.",
      "Un principe de binôme : chaque client est suivi par deux techniciens plutôt qu'un.",
      "Un bilan annuel avec chaque client, qui oblige à mettre par écrit ce que l'on sait " +
        "de lui.",
      "Toute mesure qui transfère le savoir d'une personne vers l'organisation répond au " +
        "test O.",
    ],
  }),

  appliquez(
    3,
    "Dans l'étape 3, soumettez chacune de vos ressources distinctives aux quatre tests du " +
      "VRIO et notez le premier test qui échoue.",
  ),
  fiche(
    "Quatre tests dans l'ordre : valeur, rareté, imitabilité, organisation.",
    "Le premier « non » donne le résultat : désavantage, parité, avantage temporaire, " +
      "avantage non exploité.",
    "Quatre « oui » : avantage concurrentiel durable.",
    "Ce qui est difficile à imiter : l'histoire, l'ambiguïté, la complexité sociale.",
    "Un atout logé dans une seule personne n'appartient pas vraiment à l'entreprise.",
  ),
];
