/**
 * =============================================================
 *  Fichier    : m03-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 3, leçon 1 — « Les cinq forces, et la sixième » : du PESTEL à
 *               l'industrie, les cinq forces, leur intensité, les compléments. Sources :
 *               livre, module 3 (§ 3.1 à 3.3, Infosystem, rumeur du glutamate chez
 *               Ajinomoto) ; Porter, 1979 et 2008 ; Brandenburger et Nalebuff,
 *               « Co-opetition », 1996 (les compléments). Texte, exemples et exercices
 *               originaux.
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

export const M03_L01: ContenuLecon = [
  p(
    "Deux entreprises soumises au même PESTEL peuvent connaître des sorts opposés. L'une " +
      "dégage de belles marges, l'autre s'épuise. Souvent, la différence ne tient pas à " +
      "leurs efforts mais à **l'industrie** où elles se trouvent. Cette leçon donne l'outil " +
      "qui explique pourquoi certaines industries sont rentables et d'autres pas.",
  ),

  titre("Qui capte la valeur ?"),
  p(
    "En 1979, Michael Porter propose une idée simple : la rentabilité d'une industrie ne " +
      "dépend pas seulement de la lutte entre concurrents. Elle dépend de **cinq forces** " +
      "qui décident ensemble qui empoche la valeur créée : les entreprises en place, leurs " +
      "clients, leurs fournisseurs, ou de nouveaux venus. Plus ces forces sont intenses, " +
      "moins il reste de marge pour les entreprises en place.",
  ),
  schema(
    "cinq-forces",
    "Au centre, la rivalité entre concurrents existants. Autour : en haut, la menace des " +
      "nouveaux entrants ; à gauche, le pouvoir des fournisseurs ; à droite, le pouvoir des " +
      "clients ; en bas, la menace des substituts. Chaque force pousse vers le centre.",
  ),
  definition(
    "Industrie",
    "L'ensemble des entreprises qui offrent des produits ou des services proches, pour " +
      "répondre au même besoin de la même manière. Les cinq forces s'analysent à ce " +
      "niveau, pas à celui de l'économie entière ni d'une seule entreprise.",
  ),

  titre("Les cinq forces, une à une"),
  tableau(
    ["Force", "Elle est forte quand…"],
    [
      [
        "Rivalité entre concurrents",
        "les concurrents sont nombreux et de taille comparable, le marché croît " +
          "lentement, les offres se ressemblent, sortir de l'industrie coûte cher",
      ],
      [
        "Pouvoir des clients",
        "les clients sont peu nombreux ou gros, changent facilement de fournisseur, " +
          "et l'achat pèse lourd dans leurs coûts",
      ],
      [
        "Pouvoir des fournisseurs",
        "ils sont seuls ou presque à offrir ce dont l'entreprise a besoin, ou en changer " +
          "coûte cher ; la main-d'œuvre rare en fait partie",
      ],
      [
        "Menace des nouveaux entrants",
        "les barrières à l'entrée sont basses : peu de capital, pas de réglementation, " +
          "clients faciles à atteindre",
      ],
      [
        "Menace des substituts",
        "une autre solution répond au même besoin, à un rapport qualité-prix attrayant, " +
          "et passer de l'une à l'autre est facile",
      ],
    ],
  ),
  piege(
    "Oublier que **la main-d'œuvre est un fournisseur**. Dans une entreprise de services, " +
      "c'est souvent le fournisseur le plus puissant : quand les compétences sont rares, " +
      "ce sont les employés qui fixent leurs conditions.",
  ),

  titre("Évaluer, pas seulement décrire"),
  p(
    "Une analyse des cinq forces qui se contente de décrire ne sert à rien. Pour chaque " +
      "force, on attribue une **intensité** (faible, moyenne ou forte) et on dit **pourquoi**. " +
      "C'est cette évaluation qui permet de conclure : l'industrie est-elle attrayante, et " +
      "d'où vient la pression principale ?",
  ),
  tableau(
    ["Force", "Intensité", "Pourquoi"],
    [
      ["Rivalité", "Forte", "Marché fragmenté, services semblables, concurrence sur le prix"],
      ["Clients", "Plutôt faible", "Changer de fournisseur informatique est long et risqué"],
      ["Fournisseurs", "Forte", "Grands éditeurs incontournables ; techniciens rares"],
      ["Nouveaux entrants", "Moyenne", "Peu de capital requis, mais la confiance se gagne"],
      ["Substituts", "Moyenne à forte", "Technicien interne, éditeurs infonuagiques, IA"],
    ],
    "Les cinq forces d'Infosystem (services informatiques gérés). Bilan : une industrie " +
      "difficile, où deux forces jouent en sa faveur, toutes deux fondées sur la relation.",
  ),
  retenir(
    "La conclusion d'Infosystem n'est pas « baissons nos prix », mais « protégeons ce qui " +
      "nous protège » :",
    [
      "les coûts de changement de ses clients ;",
      "la barrière de la confiance face aux nouveaux venus ;",
      "et, côté fournisseurs, la fidélité de ses techniciens.",
    ],
  ),

  titre("La force qu'on ne voit pas : la réputation"),
  terrain(
    "Quand une rumeur renforce le pouvoir des clients",
    "Chez Ajinomoto Afrique de l'Ouest, le glutamate monosodique traînait en Côte " +
      "d'Ivoire une réputation de produit chimique nocif, entièrement fausse : il était " +
      "obtenu par fermentation de la canne à sucre. Nos grands grossistes s'en servaient à " +
      "chaque négociation pour obtenir de meilleures conditions. L'entreprise a contre-" +
      "attaqué sur la rumeur elle-même : campagne avec une actrice ivoirienne populaire, " +
      "dépliants sur la fabrication, équipes sur les marchés. Une force défavorable n'est " +
      "pas une fatalité : on peut s'attaquer à ce qui la nourrit.",
  ),

  titre("La sixième force : les compléments"),
  p(
    "Certains auteurs ajoutent une force aux cinq de Porter : les **compléments**, des " +
      "produits ou services qui rendent le vôtre plus utile. Plus il y a de téléphones " +
      "intelligents en circulation, plus les services de paiement mobile se vendent. Plus " +
      "les stations de recharge se multiplient, plus les voitures électriques se vendent.",
  ),
  p(
    "Les compléments n'enlèvent pas de valeur à l'industrie : ils en ajoutent. Mais celui " +
      "qui contrôle le complément indispensable peut en capter une bonne part. D'où une " +
      "question utile : **de qui dépend la valeur de notre offre ?**",
  ),
  notion(
    "Pour aller plus loin : les cinq forces ont-elles vieilli ?",
    p(
      "En 2008, Porter a mis son modèle à jour dans la Harvard Business Review. Il " +
        "maintient l'essentiel et précise deux points : les forces se mesurent sur la " +
        "rentabilité moyenne de l'industrie à moyen terme, pas sur une bonne ou une " +
        "mauvaise année ; et la croissance du marché, la technologie ou l'État ne sont pas " +
        "des forces en soi, mais des facteurs qui agissent à travers les cinq forces.",
    ),
    p(
      "Le modèle a une limite qu'il faut connaître : c'est une photographie, prise de " +
        "l'extérieur. Il explique pourquoi une industrie est difficile, pas pourquoi " +
        "certaines entreprises y réussissent mieux que d'autres. Pour cela, il faut " +
        "regarder à l'intérieur : c'est le module 4.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Pour une compagnie de transport interurbain par car en Côte d'Ivoire, à quelle " +
      "force rattachez-vous chaque fait ?",
    categories: [
      "Rivalité",
      "Pouvoir des clients",
      "Pouvoir des fournisseurs",
      "Nouveaux entrants",
      "Substituts",
    ],
    elements: [
      {
        texte:
          "Une dizaine de compagnies se disputent l'axe Abidjan–Bouaké avec des cars semblables.",
        categorie: 0,
        explication: "Concurrents nombreux, offres proches : la rivalité est vive.",
      },
      {
        texte: "Les voyageurs comparent les prix à la gare et changent de compagnie sans frais.",
        categorie: 1,
        explication: "Aucun coût de changement : le client a du pouvoir.",
      },
      {
        texte: "Deux importateurs seulement distribuent les pièces de la marque de cars utilisée.",
        categorie: 2,
        explication:
          "Peu de sources d'approvisionnement : les fournisseurs fixent leurs conditions.",
      },
      {
        texte:
          "Un homme d'affaires peut acheter trois cars d'occasion et obtenir une licence en " +
          "quelques mois.",
        categorie: 3,
        explication: "Barrières à l'entrée basses : la menace d'entrée est réelle.",
      },
      {
        texte: "Un service de covoiturage par application gagne les jeunes actifs.",
        categorie: 4,
        explication: "Même besoin (voyager), autre manière de le satisfaire : un substitut.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Le roulement élevé des techniciens d'Infosystem relève surtout de quelle force ?",
    choix: [
      {
        texte: "La rivalité entre concurrents.",
        explication:
          "Les concurrents se disputent bien les techniciens, mais c'est le rapport de " +
          "force avec ceux qui fournissent le travail qui est en cause.",
      },
      {
        texte: "Le pouvoir des fournisseurs.",
        explication:
          "Oui : les techniciens qualifiés sont rares et très courtisés ; ce « fournisseur » " +
          "de main-d'œuvre est en position de force.",
      },
      {
        texte: "Ce n'est pas une force : c'est un problème de ressources humaines.",
        explication:
          "C'est justement l'erreur que les cinq forces évitent : le problème interne est " +
          "le signe d'une force de l'industrie.",
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
        texte:
          "Plus les cinq forces sont intenses, plus l'industrie est rentable pour ceux qui y " +
          "sont.",
        vrai: false,
        explication:
          "C'est l'inverse : des forces intenses captent la valeur au détriment des entreprises " +
          "en place.",
      },
      {
        texte: "Les coûts de changement d'un client réduisent son pouvoir de négociation.",
        vrai: true,
        explication:
          "Un client qui ne peut pas partir facilement a moins de poids pour imposer ses " +
          "conditions.",
      },
      {
        texte: "Un complément enlève de la valeur à l'industrie, comme un substitut.",
        vrai: false,
        explication:
          "Un complément rend l'offre plus utile ; c'est le substitut qui la concurrence.",
      },
      {
        texte: "Une mauvaise réputation, même injustifiée, peut renforcer le pouvoir des clients.",
        vrai: true,
        explication:
          "C'est la leçon du glutamate : le client s'en sert comme argument de négociation.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Évaluez les cinq forces de l'industrie de votre organisation : une intensité et une " +
      "raison pour chacune. Laquelle pèse le plus sur la rentabilité, et que pourriez-vous " +
      "faire pour l'atténuer ?",
    corrige: [
      "L'industrie est définie précisément (le métier et le marché géographique).",
      "Chaque force reçoit une intensité (faible, moyenne, forte) et une justification " +
        "factuelle, pas une impression.",
      "Une conclusion nette : l'industrie est-elle attrayante, et quelle force exerce la " +
        "pression principale ?",
      "Une action qui s'attaque à la cause de cette force (coûts de changement, image, " +
        "fidélisation des fournisseurs…), et non une simple baisse de prix.",
    ],
  }),

  appliquez(
    2,
    "Dans l'étape 2 de votre étude, évaluez chacune des cinq forces de votre industrie, " +
      "avec son intensité et sa justification.",
  ),
  fiche(
    "Cinq forces : rivalité, clients, fournisseurs, nouveaux entrants, substituts.",
    "Elles décident qui capte la valeur ; plus elles sont fortes, moins il reste de marge.",
    "Pour chaque force : une intensité et une raison.",
    "La main-d'œuvre rare est un fournisseur puissant.",
    "Les compléments ajoutent de la valeur ; qui les contrôle peut en capter une part.",
  ),
];
