/**
 * =============================================================
 *  Fichier    : m03-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 3, leçon 2 — « Barrières à l'entrée et cycle de vie d'une
 *               industrie » : les sept barrières, les barrières à la sortie, les quatre
 *               phases du cycle de vie et leur effet sur les forces. Sources : livre,
 *               module 3 (§ 3.2 et 3.3, la confiance comme barrière d'Infosystem) ;
 *               Porter, 1980 et 2008 ; Whittington et coll., « Stratégique », 2023.
 *               Texte, exemples et exercices originaux.
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

export const M03_L02: ContenuLecon = [
  p(
    "Lancer une entreprise de soutien informatique demande un ordinateur, quelques " +
      "logiciels et un premier client. Lancer une cimenterie demande des dizaines de " +
      "milliards de francs CFA. Les deux industries ne sont pas exposées de la même façon " +
      "aux nouveaux venus. Cette leçon examine ce qui protège une industrie, et comment " +
      "cette protection change avec l'âge de l'industrie.",
  ),

  titre("Les barrières à l'entrée"),
  definition(
    "Barrière à l'entrée",
    "Tout ce qui rend difficile, coûteux ou risqué l'arrivée d'un nouveau concurrent. " +
      "Plus les barrières sont hautes, plus les entreprises en place peuvent maintenir " +
      "leurs prix sans attirer de nouveaux venus.",
  ),
  tableau(
    ["Barrière", "Ce qui freine le nouveau venu", "Exemple"],
    [
      ["Capital requis", "Investir lourd avant de vendre", "Cimenterie, télécoms"],
      ["Économies d'échelle", "Produire petit coûte plus cher à l'unité", "Brasserie"],
      ["Réglementation", "Licences, agréments, quotas", "Banque, pharmacie"],
      ["Accès à la distribution", "Les canaux sont déjà occupés", "Boissons en kiosque"],
      ["Réputation et confiance", "Les clients préfèrent l'éprouvé", "Services informatiques"],
      ["Coûts de changement", "Le client perd à quitter l'actuel", "Logiciel de gestion"],
      ["Effets de réseau", "L'offre vaut plus si beaucoup l'utilisent", "Mobile Money"],
    ],
  ),
  p(
    "Infosystem illustre une situation fréquente : une barrière **basse** (le capital) et " +
      "une barrière **haute** (la confiance). La menace d'entrée y est donc moyenne. Une PME " +
      "ne confie pas les clés de son informatique à une entreprise qui n'a pas fait ses " +
      "preuves : la réputation se bâtit sur des années.",
  ),
  retenir("Une barrière n'est jamais acquise.", [
    "Une technologie peut l'abaisser : l'infonuagique a réduit le capital nécessaire " +
      "pour héberger des données.",
    "Une loi peut la lever ou la créer : une libéralisation ouvre un marché protégé.",
    "Une entreprise peut l'élever elle-même : marque, contrats, coûts de changement.",
  ]),

  titre("L'autre porte : les barrières à la sortie"),
  p(
    "Certaines industries restent encombrées même quand elles ne rapportent plus, parce " +
      "qu'il coûte trop cher d'en partir : équipements qui ne servent à rien d'autre, " +
      "indemnités de licenciement, contrats de longue durée, attachement du fondateur, " +
      "pression politique pour préserver des emplois. Ces **barrières à la sortie** " +
      "maintiennent des concurrents en vie, et donc une rivalité intense.",
  ),
  piege(
    "Croire qu'une industrie en difficulté va « se nettoyer » d'elle-même. Si les " +
      "barrières à la sortie sont hautes, les concurrents faibles s'accrochent et la guerre " +
      "des prix peut durer des années.",
  ),

  titre("Le cycle de vie d'une industrie"),
  p(
    "Une industrie naît, grandit, se stabilise et, parfois, décline. À chaque phase, les " +
      "cinq forces changent d'intensité. Situer son industrie sur ce cycle aide à prévoir " +
      "la pression qui vient.",
  ),
  schema(
    "cycle-vie",
    "Courbe des ventes de l'industrie dans le temps, en quatre phases : émergence (ventes " +
      "faibles), croissance (montée rapide), maturité (plateau) et déclin (baisse). Sous " +
      "chaque phase, l'enjeu principal : convaincre, suivre la demande, défendre ses " +
      "parts, se repositionner ou sortir.",
  ),
  tableau(
    ["Phase", "Ce qui se passe", "Effet sur les forces"],
    [
      [
        "Émergence",
        "Peu d'acheteurs, offres variées, normes absentes",
        "Rivalité faible ; substituts forts (l'ancienne solution)",
      ],
      [
        "Croissance",
        "La demande décolle ; on vend à de nouveaux clients",
        "Rivalité modérée ; beaucoup de nouveaux entrants",
      ],
      [
        "Maturité",
        "La demande plafonne ; on gagne des clients sur les autres",
        "Rivalité forte ; clients exigeants ; concentration",
      ],
      [
        "Déclin",
        "La demande baisse, souvent à cause d'un substitut",
        "Rivalité très forte si les barrières à la sortie sont hautes",
      ],
    ],
  ),
  p(
    "Prenons le transfert d'argent par téléphone en Afrique de l'Ouest. Au début des " +
      "années 2010, il fallait convaincre les gens d'y confier leur argent : c'était " +
      "l'émergence. Les opérateurs ont ensuite multiplié les points de service et les " +
      "abonnés : la croissance. Avec l'arrivée d'acteurs aux frais plus bas, la " +
      "concurrence s'est portée sur le prix, signe d'une industrie qui entre en maturité.",
  ),
  notion(
    "Pour aller plus loin : les limites du cycle de vie",
    p(
      "Le cycle n'a pas de durée fixe : certaines industries restent mûres pendant un " +
        "siècle, d'autres passent de l'émergence au déclin en dix ans. Il n'est pas non " +
        "plus une fatalité : une innovation peut relancer une industrie mûre, comme le " +
        "café en dosettes a relancé celle du café.",
    ),
    p(
      "Utilisez-le comme une boussole, pas comme un calendrier : il dit quelle pression " +
        "s'annonce, pas à quelle date elle arrivera.",
    ),
  ),
  liste(
    "**En émergence**, l'enjeu est de convaincre les premiers clients et de fixer les normes.",
    "**En croissance**, de suivre la demande sans perdre la qualité.",
    "**En maturité**, de défendre ses parts par l'efficacité ou la différence.",
    "**En déclin**, de choisir : se replier sur une niche rentable, ou sortir à temps.",
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Pourquoi la menace des nouveaux entrants n'est-elle que « moyenne » pour Infosystem, " +
      "alors que démarrer demande peu de capital ?",
    choix: [
      {
        texte:
          "Parce que la réglementation interdit d'ouvrir une entreprise de soutien informatique.",
        explication: "Aucune licence particulière n'est exigée dans ce métier.",
      },
      {
        texte: "Parce que la confiance des clients est une barrière haute, qui prend des années.",
        explication: "Oui : une PME ne confie pas son informatique à un inconnu.",
      },
      {
        texte: "Parce que le marché est en déclin et n'attire personne.",
        explication: "La demande des PME en services informatiques n'est pas en déclin.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne: "Dans quelle phase du cycle de vie situez-vous chaque industrie décrite ?",
    categories: ["Émergence", "Croissance", "Maturité", "Déclin"],
    elements: [
      {
        texte:
          "Quelques start-ups proposent des drones pour traiter les plantations ; les " +
          "planteurs hésitent et aucune norme n'existe.",
        categorie: 0,
        explication: "Peu d'acheteurs, offres variées, pas de norme : l'émergence.",
      },
      {
        texte:
          "Les ventes de panneaux solaires domestiques augmentent chaque année et de " +
          "nouveaux installateurs ouvrent sans cesse.",
        categorie: 1,
        explication: "Demande en forte hausse et afflux d'entrants : la croissance.",
      },
      {
        texte:
          "Les brasseurs se disputent un marché de la bière qui progresse peu ; la " +
          "publicité et les promotions s'intensifient.",
        categorie: 2,
        explication: "Demande stable, rivalité pour les parts : la maturité.",
      },
      {
        texte:
          "Les cabines téléphoniques publiques ferment les unes après les autres depuis " +
          "la généralisation du téléphone portable.",
        categorie: 3,
        explication: "Un substitut a remplacé l'offre : le déclin.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Des barrières à la sortie élevées rendent la rivalité plus intense.",
        vrai: true,
        explication:
          "Les concurrents faibles ne partent pas et continuent de se battre sur les prix.",
      },
      {
        texte: "Une entreprise peut élever elle-même les barrières à l'entrée de son industrie.",
        vrai: true,
        explication: "Par sa marque, ses contrats ou les coûts de changement qu'elle crée.",
      },
      {
        texte: "Toutes les industries passent par les quatre phases dans le même délai.",
        vrai: false,
        explication: "La durée de chaque phase varie énormément d'une industrie à l'autre.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Quelles sont les deux barrières à l'entrée les plus hautes de votre industrie, et " +
      "dans quelle phase du cycle de vie se trouve-t-elle ? Qu'en concluez-vous pour les " +
      "trois prochaines années ?",
    corrige: [
      "Deux barrières précises, tirées de la liste (capital, échelle, réglementation, " +
        "distribution, réputation, coûts de changement, effets de réseau), justifiées.",
      "Une phase du cycle appuyée sur des indices : évolution de la demande, nombre " +
        "d'entrants, nature de la concurrence.",
      "Une conclusion sur la pression à venir (par exemple : maturité, donc rivalité qui " +
        "se durcit) et ce qu'elle exige de l'organisation.",
    ],
  }),

  appliquez(
    2,
    "Dans l'étape 2, justifiez la menace des nouveaux entrants par les barrières de votre " +
      "industrie, et notez dans quelle phase de son cycle de vie elle se trouve.",
  ),
  fiche(
    "Barrières à l'entrée : capital, échelle, réglementation, distribution, réputation, " +
      "coûts de changement, effets de réseau.",
    "Les barrières bougent : technologie, lois et stratégies les déplacent.",
    "Des barrières à la sortie élevées entretiennent la rivalité.",
    "Cycle de vie : émergence, croissance, maturité, déclin ; les forces changent à chaque phase.",
  ),
];
