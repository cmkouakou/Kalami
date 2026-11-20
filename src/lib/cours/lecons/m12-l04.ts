/**
 * =============================================================
 *  Fichier    : m12-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 12, leçon 4 — « Le suivi : un rendez-vous, pas un rapport » : les
 *               rendez-vous de suivi d'Infosystem, stratégie délibérée et émergente,
 *               quand un indicateur déforme les comportements, les risques et leurs
 *               réponses prévues, réagir à un signal. Sources : livre, module 9 ;
 *               Mintzberg et Waters, 1985. Texte, exemples et exercices originaux.
 *               v1.1 : exemples réels au Québec et en Côte d'Ivoire, sources citées
 *               (Bombardier et Airbus, Orange Money face à Wave).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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

export const M12_L04: ContenuLecon = [
  p(
    "Un tableau de bord que personne ne regarde ne pilote rien. Le suivi n'est pas un " +
      "rapport que l'on envoie : c'est un rendez-vous où l'on regarde les chiffres " +
      "ensemble, où l'on comprend ce qui s'est passé, et où l'on décide.",
  ),

  titre("Les rendez-vous d'Infosystem"),
  tableau(
    ["Rendez-vous", "Qui", "Ce qu'on y fait"],
    [
      [
        "Chaque mois, une heure",
        "Justin, Marthe et les deux seniors",
        "Revoir le tableau de bord, l'avancement des chantiers, décider des corrections",
      ],
      [
        "Chaque trimestre",
        "La même équipe",
        "Revoir l'environnement : ce qui a changé dans le PESTEL et les scénarios du " +
          "module 2",
      ],
      [
        "Chaque trimestre",
        "Justin et chaque technicien",
        "Un échange individuel : charge, formation, envie de rester",
      ],
      [
        "Chaque année",
        "Justin et chaque client",
        "Un bilan : ce qui a bien fonctionné, ce qui doit changer",
      ],
    ],
  ),
  retenir(
    "Un suivi régulier et court vaut mieux qu'un grand bilan annuel. Une heure par mois " +
      "suffit, à condition qu'elle ait lieu chaque mois.",
  ),

  titre("Délibérée ou émergente"),
  p(
    "En 1985, Henry Mintzberg et James Waters ont observé que la stratégie réalisée " +
      "n'est jamais exactement celle qui était prévue.",
  ),
  definition(
    "Stratégie délibérée",
    "La part du plan qui se réalise comme prévu.",
  ),
  definition(
    "Stratégie émergente",
    "Ce qui se dessine en cours de route, sans avoir été planifié : une occasion saisie, " +
      "une réponse à un imprévu, une pratique qui marche et que l'on généralise.",
  ),
  p(
    "Le suivi sert aussi à repérer ce qui émerge. Si plusieurs clients demandent un " +
      "service que le plan n'avait pas prévu, ce n'est pas un écart à corriger : c'est " +
      "peut-être une direction à ajouter.",
  ),

  titre("Quand un indicateur déforme"),
  p(
    "Dès qu'un indicateur devient un objectif, les comportements s'y adaptent. Si l'on " +
      "félicite les techniciens qui ferment le plus de billets, ils fermeront vite, " +
      "parfois sans régler le problème, et le client rappellera. L'indicateur s'améliore, " +
      "le service se dégrade.",
  ),
  piege(
    "Juger une personne sur un seul chiffre. Associez toujours un indicateur de quantité " +
      "à un indicateur de qualité : le nombre de billets fermés et la part de billets " +
      "rouverts.",
  ),

  titre("Prévoir les risques"),
  tableau(
    ["Risque", "Signal d'alerte", "Réponse prévue"],
    [
      [
        "Un senior part",
        "Son échange trimestriel révèle une lassitude",
        "Accélérer la relève et la documentation de ses clients",
      ],
      [
        "Le partenaire cyber déçoit",
        "Des plaintes de clients sur les audits",
        "Revoir l'accord, puis en chercher un autre",
      ],
      [
        "Les formations prennent du retard",
        "Les heures de formation baissent deux mois de suite",
        "Protéger une demi-journée par semaine pour les jeunes",
      ],
    ],
  ),
  p(
    "Une réponse préparée à l'avance se met en place en quelques jours ; une réponse " +
      "improvisée prend des semaines, au pire moment.",
  ),

  titre("Des exemples au Québec et en Côte d'Ivoire"),
  p(
    "Un suivi utile ne se contente pas de constater : il fait changer le plan quand un " +
      "signal fort arrive. Voici deux réactions documentées, l'une au Québec, l'autre en " +
      "Côte d'Ivoire. La source est indiquée sous chaque exemple.",
  ),
  notion(
    "Québec : Bombardier confie la CSeries à Airbus",
    p(
      "La stratégie délibérée de Bombardier était de vendre seul son nouvel avion, la " +
        "CSeries, assemblé à Mirabel. En 2017, à la suite d'une plainte de Boeing, le " +
        "département du Commerce des États-Unis a annoncé des droits préliminaires " +
        "totalisant environ 300 % sur l'appareil. En octobre 2017, Bombardier a cédé " +
        "50,01 % du programme à Airbus, sans contrepartie en argent ; Bombardier gardait " +
        "environ 31 % et Investissement Québec environ 19 %, et l'assemblage restait à " +
        "Mirabel. L'avion est devenu l'A220, et Bombardier a vendu le reste de sa part " +
        "en 2020. Une stratégie émergente : le plan a changé sous la pression des faits. " +
        "Sources : [gouvernement du Québec, communiqué]" +
        "(https://www.quebec.ca/nouvelles/actualites/details/developpement-du-" +
        "programme-de-la-cseries-le-gouvernement-du-quebec-enterine-la-venue-dairbus-" +
        "comme-nouveau-partenaire-strategique) ; [CNBC, 16 octobre 2017]" +
        "(https://www.cnbc.com/2017/10/16/airbus-teams-up-with-bombardier-on-c-series-" +
        "program.html).",
    ),
  ),
  notion(
    "Côte d'Ivoire : Orange Money répond à Wave",
    p(
      "En 2021, la fintech Wave est arrivée en Côte d'Ivoire avec un tarif simple : 1 % " +
        "sur les transferts. Le signal était clair, les clients partaient. Orange Money, " +
        "le leader, a revu ses prix : à partir du 20 octobre 2021, les retraits sont " +
        "passés à 1 % (environ 3 % auparavant) et les transferts entre clients sont " +
        "devenus gratuits. MTN et Moov ont aussi baissé leurs frais. Réagir vite à un " +
        "signal coûte des marges, mais ne pas réagir aurait coûté des clients. " +
        "Sources : [CIO Mag, Orange Money s'adapte à Wave]" +
        "(https://cio-mag.com/orange-money-cote-divoire-sadapte-a-wave-retrait-dargent-" +
        "a-1-a-compter-du-20-octobre) ; [Sika Finance, Wave fait plier Orange Money et " +
        "MTN MoMo](https://www.sikafinance.com/marches/cote-divoire-wave-fait--plier--" +
        "orange-money-et-mtn-momo_30853).",
    ),
  ),

  titre("Réagir à un signal"),
  etapes(
    "**Comprendre** avant d'agir : que disent les chiffres, et que disent les personnes ?",
    "**Vérifier** si les mesures prévues ont été appliquées, ou seulement décidées.",
    "**Décider** : accélérer un chantier, en ralentir un autre, ou ajuster l'objectif.",
    "**Communiquer** la décision à l'équipe, avec la raison.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une coopérative agricole fait le bilan de son plan. Ces changements sont-ils " +
      "délibérés ou émergents ?",
    categories: ["Délibéré", "Émergent"],
    elements: [
      {
        texte: "L'entrepôt prévu dans le plan a été construit l'an dernier.",
        categorie: 0,
        explication: "Il était prévu et s'est réalisé.",
      },
      {
        texte: "Des acheteurs étrangers ont demandé du séchage, devenu une activité.",
        categorie: 1,
        explication: "Une occasion saisie, non planifiée.",
      },
      {
        texte: "La formation des membres à la récolte s'est déroulée comme prévu.",
        categorie: 0,
        explication: "Une action du plan, réalisée.",
      },
      {
        texte: "Un groupe de membres a créé une vente directe qui marche, et on l'étend.",
        categorie: 1,
        explication: "Une pratique née du terrain, puis généralisée.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Deux techniciens d'Infosystem démissionnent le même mois. Que doit faire la " +
      "réunion mensuelle en premier ?",
    choix: [
      {
        texte: "Embaucher deux remplaçants au plus vite, au salaire qu'il faudra.",
        explication: "Peut-être, mais sans comprendre, les mêmes causes produiront les mêmes " +
          "départs.",
      },
      {
        texte: "Comprendre : entretiens de départ, charge, mesures de rétention appliquées ?",
        explication: "Oui : comprendre avant d'agir, puis ralentir ou accélérer un chantier.",
      },
      {
        texte: "Attendre le bilan annuel pour voir si la tendance se confirme.",
        explication: "Deux départs sur treize personnes est un signal fort, à traiter tout " +
          "de suite.",
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
        texte: "Une stratégie émergente est un échec du plan.",
        vrai: false,
        explication: "Elle peut révéler une bonne direction que le plan n'avait pas vue.",
      },
      {
        texte: "Un indicateur devenu objectif peut déformer les comportements.",
        vrai: true,
        explication: "On optimise le chiffre plutôt que ce qu'il devait mesurer.",
      },
      {
        texte: "Préparer la réponse à un risque permet d'agir plus vite s'il survient.",
        vrai: true,
        explication: "Elle se met en place en jours plutôt qu'en semaines.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Décrivez les rendez-vous de suivi de votre plan : qui, à quel rythme, pour " +
      "regarder quoi. Puis nommez deux risques, leur signal d'alerte et la réponse " +
      "prévue.",
    corrige: [
      "Au moins un rendez-vous court et régulier, avec ses participants.",
      "Ce qui y est regardé : indicateurs, chantiers, environnement.",
      "Deux risques précis, chacun avec un signal observable.",
      "Une réponse préparée pour chaque risque.",
    ],
  }),

  appliquez(
    8,
    "À l'étape 8, fixez le rythme de suivi de votre plan et notez, pour vos deux risques " +
      "principaux, le signal d'alerte et la réponse prévue.",
  ),
  fiche(
    "Le suivi est un rendez-vous où l'on décide, pas un rapport.",
    "Une heure par mois, chaque mois, vaut mieux qu'un grand bilan annuel.",
    "Mintzberg : stratégie délibérée et stratégie émergente.",
    "Associer quantité et qualité pour qu'un indicateur ne déforme pas.",
    "Pour chaque risque : un signal d'alerte et une réponse prévue.",
  ),
];
