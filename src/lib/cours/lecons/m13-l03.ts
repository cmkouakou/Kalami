/**
 * =============================================================
 *  Fichier    : m13-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 13, leçon 3 — « Votre propre plan dans Kalami Stratégie » : du
 *               cours à l'assistant, les étapes 1 à 8 et ce qu'elles fournissent au plan,
 *               l'étape 9 (assemblage, traçabilité, coach, export), relire son plan avant
 *               de le présenter, la première et la deuxième fois. Sources : livre,
 *               module 10 et conclusion. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  etapes,
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

export const M13_L03: ContenuLecon = [
  p(
    "Le cours se termine là où le travail commence : sur votre propre organisation. Tout " +
      "au long des modules, les encadrés « Appliquez » vous ont renvoyé vers une étape de " +
      "Kalami Stratégie. Cette dernière leçon montre comment ces étapes deviennent un " +
      "plan.",
  ),

  titre("Ce que chaque étape apporte au plan"),
  tableau(
    ["Étapes de l'assistant", "Ce qu'elles fournissent", "Section du plan"],
    [
      ["1 à 4 : comprendre", "Opportunités, menaces, forces, acteurs", "1. Où en sommes-nous"],
      ["5 : synthèse", "La SWOT, la TOWS, les enjeux retenus", "2. Nos enjeux"],
      ["6 : cap", "Vision, mission, valeurs, objectifs", "3. Notre cap"],
      ["7 : choix", "Les options évaluées, l'énoncé de stratégie", "4. Notre stratégie"],
      [
        "8 : action",
        "Actions, responsables, échéances, indicateurs, risques, suivi",
        "5 à 8",
      ],
    ],
  ),
  p(
    "Une étape se valide quand son livrable est complet. Le plan n'assemble que les étapes " +
      "validées : une section vide signale une étape à reprendre.",
  ),

  titre("L'étape 9 : assembler, relire, exporter"),
  etapes(
    "**Générer.** L'assistant rassemble vos étapes en huit sections, sans réécrire votre " +
      "texte.",
    "**Vérifier les sources.** Chaque paragraphe renvoie à l'étape et à l'élément d'où il " +
      "vient ; l'annexe de traçabilité les liste.",
    "**Retoucher.** Modifiez chaque section librement. Le coach peut proposer une " +
      "rédaction qui cite ses sources ; vous décidez de la garder ou non.",
    "**Exporter.** Le plan sort en PDF ou en DOCX, avec la feuille de route en Gantt et " +
      "le tableau de bord équilibré en annexe.",
  ),
  retenir(
    "Le plan ne se valide pas : il se révise. Quand une étape change, régénérez la section " +
      "concernée ; l'historique garde les versions précédentes.",
  ),

  titre("Relire avant de présenter"),
  p(
    "Avant de montrer votre plan, relisez-le avec les yeux d'un lecteur pressé et " +
      "sceptique : un associé, un banquier, un futur repreneur.",
  ),
  liste(
    "Les trois enjeux découlent-ils clairement du diagnostic ?",
    "L'énoncé de stratégie dit-il pour qui, avec quel avantage, et ce à quoi l'on renonce ?",
    "Chaque chantier a-t-il une personne nommée et une échéance ?",
    "Chaque objectif a-t-il un indicateur, une cible et un rythme de suivi ?",
    "Les risques principaux ont-ils une réponse prévue ?",
    "L'ensemble tient-il en cinq ou six pages ?",
  ),
  piege(
    "Laisser le coach écrire tout le plan. Un texte bien tourné que vous ne pourriez pas " +
      "défendre devant votre équipe ne vous servira pas. Le coach aide à rédiger ; les " +
      "choix restent les vôtres.",
  ),

  titre("Avec qui le construire"),
  p(
    "Un plan rédigé seul est rarement appliqué. Invitez dans votre étude les personnes qui " +
      "porteront les chantiers : elles enrichissent le diagnostic, et elles défendront " +
      "des choix auxquels elles ont participé. Les étapes 1 à 4 peuvent même être " +
      "réparties entre plusieurs personnes.",
  ),

  titre("La première fois, puis la deuxième"),
  p(
    "La première démarche complète est longue : on apprend les outils en même temps qu'on " +
      "les applique. La deuxième, un an plus tard, est beaucoup plus rapide. On repart du " +
      "plan existant, on met à jour l'environnement, on mesure l'écart entre le prévu et " +
      "le réalisé, et l'on ajuste.",
  ),
  p(
    "La stratégie n'est pas réservée aux grandes entreprises. Elle commence chaque fois " +
      "que quelqu'un, dans une PME, une association ou un service, prend le temps de se " +
      "demander où il va, et pourquoi.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "De quelle étape de l'assistant chaque élément du plan provient-il ?",
    categories: ["Étapes 1 à 4", "Étape 5", "Étape 7", "Étape 8"],
    elements: [
      {
        texte: "« Nos clients apprécient notre rapidité d'intervention. »",
        categorie: 0,
        explication: "Une force relevée dans l'analyse interne.",
      },
      {
        texte: "« Notre enjeu : garder et faire grandir l'équipe. »",
        categorie: 1,
        explication: "Un enjeu tiré de la synthèse.",
      },
      {
        texte: "« Nous ne revendrons pas de matériel. »",
        categorie: 2,
        explication: "Un renoncement de l'énoncé de stratégie.",
      },
      {
        texte: "« Marthe lance le parcours de carrière d'ici six mois. »",
        categorie: 3,
        explication: "Une action, avec un responsable et une échéance.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "En générant son plan, une gérante constate que la section « Nos chantiers » est " +
      "vide. Que faire ?",
    choix: [
      {
        texte: "La rédiger directement dans le plan, de mémoire.",
        explication: "Possible, mais le paragraphe n'aura aucune source vérifiable.",
      },
      {
        texte: "Compléter et valider l'étape 8, puis régénérer la section.",
        explication: "Oui : le plan reflète les étapes validées, avec leurs sources.",
      },
      {
        texte: "Supprimer la section : le plan sera plus court.",
        explication: "Sans chantiers, le plan ne dit pas qui fait quoi.",
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
        texte: "Une fois exporté, le plan ne doit plus être modifié.",
        vrai: false,
        explication: "Il se révise au moins chaque année, et dès qu'une étape change.",
      },
      {
        texte: "Associer à l'étude ceux qui porteront les chantiers aide à les appliquer.",
        vrai: true,
        explication: "On défend mieux des choix auxquels on a participé.",
      },
      {
        texte: "La deuxième démarche complète est en général plus rapide que la première.",
        vrai: true,
        explication: "On repart du plan existant et l'on connaît déjà les outils.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Relisez votre plan avec la liste de cette leçon. Quels sont ses deux points les plus " +
      "faibles, et que ferez-vous pour les corriger avant de le présenter ?",
    corrige: [
      "Deux faiblesses précises, repérées avec la liste de relecture.",
      "Pour chacune, l'étape à reprendre ou la section à réécrire.",
      "Le lecteur visé par la présentation et ce qu'il doit retenir.",
      "Une date pour la première révision du plan.",
    ],
  }),

  appliquez(
    9,
    "À l'étape 9, générez votre plan, vérifiez ses sources, relisez-le avec la liste de " +
      "cette leçon, puis exportez-le pour le présenter.",
  ),
  fiche(
    "Les étapes 1 à 8 alimentent les huit sections du plan.",
    "L'étape 9 assemble, garde les sources, et exporte en PDF ou en DOCX.",
    "Le coach aide à rédiger ; les choix restent les vôtres.",
    "Relire en lecteur sceptique : enjeux, renoncements, noms, indicateurs, risques.",
    "Le plan se révise ; la deuxième démarche est plus rapide.",
  ),
];
