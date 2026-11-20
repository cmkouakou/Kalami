/**
 * =============================================================
 *  Fichier    : m10-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 10, leçon 1 — « Innover de l'intérieur : l'intrapreneuriat » :
 *               l'innovation comme moyen, ses quatre terrains (offre, procédé, modèle
 *               d'affaires, organisation), l'intrapreneur, pourquoi l'encourager, les trois
 *               obstacles et les conditions qui les lèvent, les trois innovations
 *               d'Infosystem. Sources : livre, module 8 (§ 8.6). Texte, exemples et
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
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M10_L01: ContenuLecon = [
  p(
    "On parle souvent d'innovation comme d'une stratégie. C'est un raccourci. L'innovation " +
      "est un **moyen** : elle sert la position que l'entreprise a choisie au module 8 et " +
      "les directions retenues au module 9. Une innovation qui ne sert aucun de ces choix " +
      "est une distraction, même brillante.",
  ),

  titre("Quatre terrains d'innovation"),
  p(
    "On pense d'abord aux produits. Mais une entreprise peut innover sur quatre terrains, " +
      "et les plus rentables ne sont pas toujours les plus visibles.",
  ),
  tableau(
    ["Terrain", "Ce qui change", "Exemple chez Infosystem"],
    [
      [
        "L'offre (produit ou service)",
        "Ce que le client achète",
        "Une revue de sécurité annuelle pour chaque client",
      ],
      [
        "Le procédé",
        "La façon de produire ou de livrer",
        "Une intelligence artificielle qui trie et règle les demandes simples",
      ],
      [
        "Le modèle d'affaires",
        "La façon de gagner de l'argent",
        "Un forfait mensuel par poste au lieu d'une facture par intervention",
      ],
      [
        "L'organisation",
        "La façon de travailler ensemble",
        "Une base de connaissances partagée par toute l'équipe",
      ],
    ],
  ),
  retenir(
    "Les trois innovations du plan d'Infosystem ne sont pas des produits nouveaux. Elles " +
      "touchent le modèle d'affaires, le procédé et l'organisation, et chacune répond à " +
      "un enjeu du diagnostic : des revenus irréguliers, des techniciens débordés, un " +
      "savoir concentré dans quelques têtes.",
  ),

  titre("L'intrapreneur"),
  definition(
    "Intrapreneuriat",
    "La conduite, par un ou plusieurs employés, d'un projet innovant à l'intérieur de " +
      "l'organisation, avec ses moyens et sous sa protection, mais avec l'esprit " +
      "d'initiative d'un créateur d'entreprise.",
  ),
  p(
    "L'intrapreneur n'attend pas qu'on lui confie un projet : il repère un problème, " +
      "propose une solution et la porte jusqu'au bout. Il prend des risques, mais pas les " +
      "mêmes qu'un entrepreneur : il engage sa réputation et son temps plutôt que ses " +
      "économies.",
  ),

  titre("Pourquoi l'encourager"),
  liste(
    "**C'est moins cher et plus rapide** que d'acheter l'innovation à l'extérieur : les " +
      "idées viennent de ceux qui connaissent les clients et les procédés.",
    "**C'est un outil de rétention** : un employé qui porte un projet à lui a une raison " +
      "de plus de rester.",
    "**C'est une façon d'apprendre** : même un projet qui échoue enseigne quelque chose " +
      "à l'organisation, s'il est raconté.",
  ),

  titre("Trois obstacles"),
  tableau(
    ["Obstacle", "Ce qui bloque", "Ce qui le lève"],
    [
      [
        "La gestion",
        "Un chef qui exige des résultats sûrs et rapides",
        "Un dirigeant qui protège l'essai et accepte l'échec mesuré",
      ],
      [
        "La propriété de l'idée",
        "À qui appartient le projet, et qui en profite ?",
        "Une règle claire, connue avant que le projet commence",
      ],
      [
        "La culture",
        "Une hiérarchie où l'on attend les ordres",
        "La confiance, du temps réservé, un projet reconnu officiellement",
      ],
    ],
  ),
  p(
    "Beaucoup d'intrapreneurs travaillent d'abord en cachette, sur leur temps libre. Le " +
      "rôle du dirigeant est de faire sortir ces projets de l'ombre : leur donner un nom, " +
      "un peu de temps, et un rendez-vous pour en parler. Il devient alors un " +
      "**facilitateur** plutôt qu'un contrôleur.",
  ),
  piege(
    "La boîte à idées sans suite. Demander des idées puis ne jamais répondre décourage " +
      "plus que de ne rien demander. Chaque idée mérite une réponse : oui, non, ou pas " +
      "maintenant, avec la raison.",
  ),

  titre("Chez Infosystem"),
  p(
    "Dans une entreprise de treize personnes, l'intrapreneuriat ne demande ni laboratoire " +
      "ni budget. Il demande que Justin laisse des techniciens porter des projets. Le " +
      "technicien senior qui connaît le mieux les clients peut piloter la base de " +
      "connaissances ; un jeune technicien curieux peut mener l'essai de l'intelligence " +
      "artificielle sur les demandes simples. Pour ce jeune technicien, le projet est " +
      "aussi une raison de rester, et la rétention est le premier enjeu d'Infosystem.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une clinique privée de Ouagadougou envisage quatre nouveautés. Sur quel terrain " +
      "chacune innove-t-elle ?",
    categories: ["Offre", "Procédé", "Modèle d'affaires", "Organisation"],
    elements: [
      {
        texte: "Des téléconsultations pour les patients des villes voisines.",
        categorie: 0,
        explication: "Un service nouveau proposé aux patients.",
      },
      {
        texte: "Un logiciel qui envoie les résultats d'analyse par message au médecin.",
        categorie: 1,
        explication: "La façon de produire et de livrer le soin change.",
      },
      {
        texte: "Un abonnement annuel familial qui couvre les consultations courantes.",
        categorie: 2,
        explication: "La façon de gagner de l'argent change.",
      },
      {
        texte: "Des équipes mixtes médecins-infirmiers qui suivent les mêmes patients.",
        categorie: 3,
        explication: "La façon de travailler ensemble change.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une technicienne d'Infosystem a écrit, le soir, un petit outil qui automatise les " +
      "sauvegardes des clients. Quelle réaction de Justin encourage le mieux " +
      "l'intrapreneuriat ?",
    choix: [
      {
        texte: "La féliciter, puis lui demander de se concentrer sur ses tickets.",
        explication: "Le projet retourne dans l'ombre, et l'idée meurt.",
      },
      {
        texte: "Lui réserver du temps pour un essai chez deux clients, avec un bilan prévu.",
        explication: "Oui : le projet devient officiel, protégé et évalué.",
      },
      {
        texte: "Confier l'outil à un prestataire externe pour le perfectionner.",
        explication: "On perd la porteuse du projet, et la raison qu'elle avait de rester.",
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
        texte: "L'innovation est une stratégie à part entière.",
        vrai: false,
        explication: "C'est un moyen au service de la position et des directions choisies.",
      },
      {
        texte: "Un forfait mensuel au lieu d'une facture par intervention est une innovation.",
        vrai: true,
        explication: "C'est une innovation de modèle d'affaires.",
      },
      {
        texte: "Il vaut mieux décider à qui appartient une idée une fois le projet réussi.",
        vrai: false,
        explication: "La règle doit être connue avant, sinon elle décourage ou divise.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Nommez une innovation possible dans votre organisation, sur un terrain autre que " +
      "l'offre. À quel enjeu du diagnostic répond-elle, et qui pourrait la porter ?",
    corrige: [
      "Une innovation précise, placée sur l'un des quatre terrains.",
      "Un lien explicite avec un enjeu de l'étape 5 ou un objectif de l'étape 6.",
      "Un porteur nommé, avec le temps et l'appui dont il aura besoin.",
      "Un premier essai modeste, avec la date à laquelle on en fera le bilan.",
    ],
  }),

  appliquez(
    7,
    "Parmi vos options de l'étape 7, ajoutez au moins une innovation qui ne porte pas sur " +
      "l'offre, et liez-la à l'enjeu qu'elle sert.",
  ),
  fiche(
    "L'innovation est un moyen, pas une stratégie.",
    "Quatre terrains : offre, procédé, modèle d'affaires, organisation.",
    "L'intrapreneur porte un projet innovant de l'intérieur.",
    "Trois obstacles : la gestion, la propriété de l'idée, la culture.",
    "Infosystem : forfait par poste, base de connaissances, IA pour le premier niveau.",
  ),
];
