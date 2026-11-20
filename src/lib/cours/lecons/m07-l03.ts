/**
 * =============================================================
 *  Fichier    : m07-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 7, leçon 3 — « Valeurs et objectifs SMART » : des valeurs qui se
 *               voient dans les gestes, les quatre valeurs d'Infosystem, les objectifs
 *               SMART, les objectifs d'Infosystem, pourquoi pas d'objectif de chiffre
 *               d'affaires total. Sources : livre, module 7 (§ 7.4 et 7.5, tableau 7.1,
 *               encadré « Des valeurs qui se voient ») ; Lencioni, 2002 ; Doran, 1981.
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
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M07_L03: ContenuLecon = [
  p(
    "La vision dit où aller, la mission pourquoi. Il reste à dire **comment se comporter " +
      "en chemin** et **comment savoir qu'on avance**. Ce sont les valeurs et les " +
      "objectifs : les deux énoncés les plus concrets, et ceux qu'on vérifie le plus " +
      "facilement.",
  ),

  titre("Des valeurs qui se voient"),
  definition(
    "Valeurs",
    "Les principes qui guident les comportements dans l'entreprise, y compris quand ils " +
      "coûtent quelque chose. Une valeur se reconnaît à ce qu'elle fait refuser.",
  ),
  p(
    "Patrick Lencioni a rappelé en 2002, dans la Harvard Business Review, qu'Enron " +
      "affichait l'intégrité parmi ses valeurs peu avant l'une des plus grandes fraudes " +
      "de l'histoire. Des valeurs affichées mais jamais appliquées font plus de mal que " +
      "pas de valeurs du tout : elles enseignent le cynisme.",
  ),
  tableau(
    ["Valeur d'Infosystem", "Ce qu'elle veut dire en pratique"],
    [
      ["Proximité", "Le client connaît son technicien, et le technicien connaît son client"],
      ["Réactivité", "On répond vite quand le client est bloqué, même hors des heures"],
      [
        "Responsabilité",
        "On protège les données des clients comme si c'étaient les nôtres",
      ],
      [
        "Transmission",
        "Ce qu'on sait, on le documente et on l'enseigne ; personne ne garde un savoir pour soi",
      ],
    ],
  ),
  p(
    "Les deux premières décrivent ce qu'Infosystem est déjà. Les deux dernières décrivent " +
      "ce qu'elle doit devenir : elles répondent aux enjeux de positionnement et de " +
      "capacité, et contredisent en partie la culture actuelle (module 6). Ce sont elles " +
      "qui demanderont le plus d'efforts.",
  ),
  terrain(
    "Des valeurs qui se voient",
    "Chez Hydro-Québec, la sécurité n'était pas une affiche. Quand on branchait une clé " +
      "USB non autorisée, une alerte partait aussitôt. L'organisation appliquait le " +
      "principe du « zéro confiance » : aucun accès n'était acquis une fois pour toutes, " +
      "et les droits de chacun étaient revus régulièrement. Les formations sur la sécurité " +
      "étaient obligatoires, avec des tests à réussir. On savait que la valeur était " +
      "réelle parce qu'elle avait des conséquences dans le travail de tous les jours.",
  ),
  retenir(
    "Pour chaque valeur, demandez-vous : quel geste précis la montre, et quelle décision " +
      "rentable lui ferait-on refuser ? Sans réponse, ce n'est pas encore une valeur.",
  ),

  titre("Des objectifs SMART"),
  p(
    "Les objectifs traduisent la vision en résultats que l'on peut vérifier. George " +
      "Doran a proposé en 1981 le critère **SMART** pour les rédiger :",
  ),
  liste(
    "**Spécifique** : un résultat précis, pas une intention générale.",
    "**Mesurable** : un indicateur et une valeur cible.",
    "**Atteignable** : ambitieux, mais réaliste avec les moyens prévus.",
    "**Réaliste** (ou pertinent) : lié à un enjeu, utile à la vision.",
    "**Temporel** : une échéance claire.",
  ),
  tableau(
    ["Enjeu", "Objectif SMART d'Infosystem"],
    [
      [
        "Capacité",
        "Ramener le roulement des jeunes techniciens sous 15 % par an d'ici fin 2027",
      ],
      [
        "Capacité",
        "Documenter les systèmes des 30 plus grands clients d'ici 18 mois",
      ],
      [
        "Positionnement",
        "Faire passer les contrats de sécurité et de conformité à 25 % des revenus en 2028",
      ],
      [
        "Pérennité",
        "Désigner et former le successeur de Justin d'ici fin 2028",
      ],
    ],
    "D'après le livre, tableau 7.1.",
  ),
  piege(
    "Fixer un objectif de chiffre d'affaires total. Il pourrait être atteint en vendant " +
      "davantage de soutien de base, c'est-à-dire en renforçant ce dont Infosystem veut " +
      "s'éloigner. Un bon objectif mesure le changement visé, pas seulement la taille.",
  ),
  notion(
    "Pour aller plus loin : peu d'objectifs, bien suivis",
    p(
      "Trois à six objectifs suffisent pour une PME. Au-delà, l'attention se disperse et " +
        "plus personne ne sait ce qui compte vraiment.",
    ),
    p(
      "Chaque objectif devrait avoir un **responsable** et un **rythme de suivi** " +
        "(mensuel ou trimestriel). Un objectif que personne ne regarde avant l'échéance " +
        "n'est qu'un vœu daté.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une coopérative de transformation de manioc à Yamoussoukro écrit ses objectifs. " +
      "Lequel respecte le critère SMART, et quel critère manque aux autres ?",
    categories: ["SMART", "Pas mesurable", "Pas daté", "Sans lien avec un enjeu"],
    elements: [
      {
        texte: "Vendre 40 tonnes d'attiéké aux supermarchés d'Abidjan d'ici décembre 2027.",
        categorie: 0,
        explication: "Précis, chiffré, daté, lié au développement de ses débouchés.",
      },
      {
        texte: "Améliorer la qualité de nos produits d'ici la fin de l'année.",
        categorie: 1,
        explication: "Améliorer de combien ? Aucun indicateur ni valeur cible.",
      },
      {
        texte: "Réduire les pertes de manioc à moins de 10 % des volumes reçus.",
        categorie: 2,
        explication: "Bien mesuré, mais sans échéance.",
      },
      {
        texte: "Repeindre le siège en vert d'ici trois mois.",
        categorie: 3,
        explication: "Mesurable et daté, mais il ne répond à aucun enjeu stratégique.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pourquoi Infosystem ne se fixe-t-elle pas d'objectif de chiffre d'affaires total ?",
    choix: [
      {
        texte: "Parce que le chiffre d'affaires ne compte pas.",
        explication: "Il compte, mais il ne mesure pas le changement visé.",
      },
      {
        texte: "Parce qu'on pourrait l'atteindre en vendant plus de ce dont elle veut " +
          "s'éloigner.",
        explication: "Oui : plus de soutien de base ferait grimper le total sans la repositionner.",
      },
      {
        texte: "Parce qu'il est impossible à mesurer.",
        explication: "Il est très facile à mesurer ; ce n'est pas le problème.",
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
        texte: "Une valeur que l'entreprise n'applique pas est sans conséquence.",
        vrai: false,
        explication: "Elle enseigne le cynisme : chacun voit l'écart entre le mur et les gestes.",
      },
      {
        texte: "Une valeur peut décrire ce que l'entreprise doit devenir.",
        vrai: true,
        explication: "La transmission, pour Infosystem, répond à un enjeu de capacité.",
      },
      {
        texte: "Plus une PME a d'objectifs, mieux elle est pilotée.",
        vrai: false,
        explication: "Trois à six objectifs suffisent ; au-delà, l'attention se disperse.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Choisissez trois valeurs pour votre organisation, avec pour chacune un geste qui la " +
      "montre. Puis rédigez un objectif SMART pour chacun de vos enjeux.",
    corrige: [
      "Des valeurs traduites en gestes concrets, pas en mots abstraits.",
      "Pour au moins une valeur, une décision rentable qu'elle ferait refuser.",
      "Des objectifs qui respectent les cinq critères, avec indicateur et échéance.",
      "Chaque objectif relié à un enjeu, avec un responsable et un rythme de suivi.",
    ],
  }),

  appliquez(
    6,
    "Terminez l'étape 6 avec vos valeurs (et un geste pour chacune) et vos objectifs " +
      "SMART, un ou deux par enjeu.",
  ),
  fiche(
    "Une valeur se reconnaît à ce qu'elle fait refuser.",
    "Des valeurs affichées mais non appliquées enseignent le cynisme.",
    "SMART : spécifique, mesurable, atteignable, réaliste, temporel.",
    "Chaque objectif part d'un enjeu, avec un responsable et un suivi.",
    "Mesurer le changement visé, pas seulement la taille.",
  ),
];
