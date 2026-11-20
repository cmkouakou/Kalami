/**
 * =============================================================
 *  Fichier    : m01-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 1, leçon 3 — « Les trois niveaux : corporatif, d'affaires,
 *               fonctionnel ». Sources : livre, module 1 (Infosystem) et module 11 (cas
 *               Ajinomoto en Afrique de l'Ouest : groupe, filiale, usine de Yopougon).
 *               Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
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

export const M01_L03: ContenuLecon = [
  p(
    "Quand un directeur général parle de « notre stratégie » et qu'une cheffe de service " +
      "parle de « sa stratégie », elles ne parlent pas de la même chose. Les deux ont " +
      "raison. **La stratégie se décide à trois étages**, et chacun répond à une question " +
      "différente.",
  ),

  titre("Trois questions, trois niveaux"),
  schema(
    "trois-niveaux",
    "Trois niveaux emboîtés : le niveau corporatif choisit les domaines d'activité, le " +
      "niveau d'affaires choisit comment gagner dans chacun, le niveau fonctionnel " +
      "organise chaque service pour y contribuer.",
  ),
  definition(
    "Stratégie corporative",
    "Elle répond à la question **« dans quels domaines être présent ? »** : quelles " +
      "activités garder, ajouter ou abandonner, et comment répartir l'argent entre elles.",
  ),
  definition(
    "Stratégie d'affaires",
    "Elle répond à la question **« comment gagner dans ce domaine ? »** : quels clients " +
      "servir, avec quelle offre, et pourquoi ils nous choisiraient plutôt qu'un concurrent.",
  ),
  definition(
    "Stratégie fonctionnelle",
    "Elle répond à la question **« que fait chaque service pour y contribuer ? »** : " +
      "production, ventes, ressources humaines, finances, informatique.",
  ),
  retenir("Chaque niveau sert celui du dessus.", [
    "Le corporatif fixe le terrain ; l'affaires choisit la manière d'y gagner.",
    "Le fonctionnel n'a de sens que s'il sert la stratégie d'affaires.",
    "Une entreprise d'un seul métier a quand même un niveau corporatif : celui du choix " +
      "de rester, ou non, dans ce métier.",
  ]),

  titre("Un groupe, une filiale, une usine"),
  p(
    "Le cas Ajinomoto, que vous étudierez au module 13, montre les trois niveaux à l'œuvre. " +
      "Au **niveau corporatif**, le groupe japonais, parti des assaisonnements, s'est " +
      "diversifié au fil du siècle et décide où investir dans le monde : il s'installe en " +
      "Afrique de l'Ouest dès 1991, puis crée une filiale en Côte d'Ivoire en 2011.",
  ),
  p(
    "Au **niveau d'affaires**, la filiale ivoirienne doit gagner sur un marché des cubes et " +
      "assaisonnements déjà occupé par des marques solidement installées : quels " +
      "formats, quels prix, quels circuits de vente ? Au **niveau fonctionnel**, l'usine " +
      "de Yopougon, mise en service en 2013, reconditionne sur place le produit reçu en " +
      "vrac et doit tenir des coûts et une qualité compatibles avec ces choix.",
  ),
  tableau(
    ["Niveau", "Ajinomoto", "Infosystem"],
    [
      [
        "Corporatif",
        "Entrer en Afrique de l'Ouest ; ouvrir une filiale ivoirienne",
        "Rester dans l'impartition informatique ou s'ouvrir à un autre métier",
      ],
      [
        "D'affaires",
        "Comment s'imposer face aux marques déjà installées",
        "Quelles PME servir, et pourquoi elles choisiraient Infosystem",
      ],
      [
        "Fonctionnel",
        "Coûts et qualité de l'usine de Yopougon",
        "Recrutement, formation et rétention des techniciens",
      ],
    ],
    "Une multinationale et une PME de treize personnes ont les mêmes trois étages ; seule " +
      "leur hauteur change.",
  ),

  titre("Et dans une PME ?"),
  p(
    "Infosystem n'a qu'un métier, l'impartition informatique. Le niveau corporatif paraît " +
      "vide, mais il ne l'est pas : faut-il un jour revendre du matériel, ouvrir un " +
      "bureau dans une autre ville, s'associer à un cabinet comptable ? Ces questions " +
      "restent rares. L'essentiel du travail de Justin se joue au **niveau d'affaires** " +
      "(comment se distinguer auprès des PME) et au **niveau fonctionnel**, où se loge son " +
      "défi le plus pressant : garder les techniciens qu'il forme.",
  ),
  piege(
    "Construire des stratégies fonctionnelles qui ne servent pas la stratégie d'affaires. " +
      "Un service des ressources humaines qui recrute au plus bas salaire alors que " +
      "l'entreprise veut gagner par l'expertise travaille, avec les meilleures intentions, " +
      "contre elle.",
  ),
  notion(
    "Pour aller plus loin : où se décide chaque niveau ?",
    p(
      "Dans un grand groupe, chaque niveau a souvent son lieu : le siège pour le " +
        "corporatif, la direction de chaque filiale ou division pour l'affaires, les " +
        "directions de service pour le fonctionnel. Dans une PME, les trois se décident " +
        "souvent autour de la même table, parfois par la même personne.",
    ),
    liste(
      "Avantage : la cohérence entre niveaux est plus facile à obtenir.",
      "Risque : le quotidien fonctionnel occupe toute la place et les deux autres niveaux " +
        "ne sont jamais discutés.",
    ),
    p(
      "Les modules 8 et 9 reviennent en détail sur la stratégie d'affaires (concurrentielle) " +
        "et la stratégie corporative.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Un groupe ivoirien fictif possède une marque d'eau minérale, une chaîne de " +
      "supermarchés et une société de transport. Classez ses décisions par niveau.",
    categories: ["Corporatif", "D'affaires", "Fonctionnel"],
    elements: [
      {
        texte: "Vendre la société de transport pour investir dans les supermarchés.",
        categorie: 0,
        explication: "On choisit les domaines d'activité et la répartition de l'argent.",
      },
      {
        texte: "Positionner l'eau minérale comme la plus pure, vendue un peu plus cher.",
        categorie: 1,
        explication: "On choisit comment gagner dans un domaine précis.",
      },
      {
        texte: "Passer la paie de tous les employés sur un même logiciel.",
        categorie: 2,
        explication: "Un service (ressources humaines) organise son travail.",
      },
      {
        texte: "Ouvrir des supermarchés de proximité dans les quartiers populaires.",
        categorie: 1,
        explication: "Choix de clients et d'offre à l'intérieur du domaine « supermarchés ».",
      },
      {
        texte: "Racheter une laiterie pour entrer dans les produits frais.",
        categorie: 0,
        explication: "Entrée dans un nouveau domaine : décision corporative.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Justin envisage d'ajouter à Infosystem la vente de matériel informatique. À quel " +
      "niveau se situe cette décision ?",
    choix: [
      {
        texte: "Fonctionnel.",
        explication: "Aucun service n'est concerné en particulier : c'est un nouveau métier.",
      },
      {
        texte: "D'affaires.",
        explication:
          "Le niveau d'affaires porte sur la manière de gagner dans un métier déjà choisi.",
      },
      {
        texte: "Corporatif.",
        explication:
          "Oui : ajouter un domaine d'activité (la revente) au métier de service est un " +
          "choix corporatif, même pour une PME.",
      },
    ],
    bonne: 2,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Une PME d'un seul métier n'a pas de stratégie corporative.",
        vrai: false,
        explication:
          "Elle en a une, même implicite : rester dans ce métier plutôt qu'un autre.",
      },
      {
        texte: "La stratégie de recrutement d'Infosystem est une stratégie fonctionnelle.",
        vrai: true,
        explication: "Elle relève d'un service (les ressources humaines) et sert l'ensemble.",
      },
      {
        texte: "Chaque service peut fixer sa stratégie sans tenir compte des autres niveaux.",
        vrai: false,
        explication:
          "Une stratégie fonctionnelle isolée risque de contredire la stratégie d'affaires.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Infosystem veut se distinguer par l'expertise. Proposez une stratégie fonctionnelle " +
      "pour les ressources humaines qui serve ce choix.",
    corrige: [
      "Un plan de formation continue (cybersécurité, infonuagique) avec des certifications " +
        "reconnues, payées par l'entreprise.",
      "Un parcours de progression visible : de technicien à technicien senior, puis à " +
        "conseiller, pour retenir les recrues.",
      "Un recrutement fondé sur le potentiel d'apprentissage plus que sur le salaire le " +
        "plus bas.",
      "Le tout justifié par la stratégie d'affaires : sans techniciens qui restent et " +
        "progressent, l'expertise promise aux clients n'existe pas.",
    ],
  }),

  appliquez(
    null,
    "Pour votre organisation, écrivez en une phrase la réponse à chaque question : dans " +
      "quels domaines être présent, comment y gagner, et ce que fait votre propre service " +
      "pour y contribuer.",
  ),
  fiche(
    "Corporatif : dans quels domaines être présent ?",
    "D'affaires : comment gagner dans chaque domaine ?",
    "Fonctionnel : que fait chaque service pour y contribuer ?",
    "Chaque niveau sert celui du dessus ; une stratégie fonctionnelle isolée peut " +
      "contredire l'ensemble.",
  ),
];
