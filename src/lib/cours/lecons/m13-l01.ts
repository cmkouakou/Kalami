/**
 * =============================================================
 *  Fichier    : m13-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 13, leçon 1 — « Le plan stratégique d'Infosystem en une page » : à
 *               quoi sert un plan écrit, ses huit sections, le plan d'Infosystem résumé,
 *               ce qui rend un plan utile, la démarche entière en un tableau. Sources :
 *               livre, module 10 (§ 10.1 à 10.3). Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
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

export const M13_L01: ContenuLecon = [
  p(
    "Douze modules ont produit des matrices, des tableaux et des constats. Ils ont servi à " +
      "réfléchir. Il reste à les transmettre : à ceux qui appliqueront la stratégie, à " +
      "ceux qui la financeront, et peut-être à ceux qui reprendront l'entreprise. C'est le " +
      "rôle du plan stratégique écrit.",
  ),

  titre("Un plan court, qui garde les conclusions"),
  p(
    "Un plan de PME tient en cinq ou six pages. Il ne recopie pas les analyses : il en " +
      "garde les conclusions et renvoie au travail détaillé pour qui veut vérifier. Il dit " +
      "ce que l'entreprise fera, ce qu'elle ne fera pas, qui s'en charge, pour quand, et " +
      "comment on saura si l'on avance.",
  ),

  titre("Les huit sections"),
  tableau(
    ["Section", "Ce qu'elle contient", "D'où elle vient"],
    [
      ["1. Où en sommes-nous", "Le diagnostic en quelques paragraphes", "Modules 2, 3, 4 et 6"],
      ["2. Nos enjeux", "Trois enjeux au plus", "La SWOT et la TOWS (module 5)"],
      ["3. Notre cap", "Vision, mission, valeurs", "Module 7"],
      [
        "4. Notre stratégie",
        "L'énoncé de stratégie et ce que l'on ne fera pas",
        "Modules 8 à 12",
      ],
      [
        "5. Nos chantiers",
        "Responsable et échéance de chacun",
        "La feuille de route (module 12)",
      ],
      ["6. Nos objectifs", "Indicateurs, cibles, fréquence", "Le tableau de bord (module 12)"],
      ["7. Nos risques", "Signal d'alerte et réponse prévue", "Le suivi (module 12)"],
      ["8. Notre suivi", "Les rendez-vous et leur rythme", "Le suivi (module 12)"],
    ],
  ),

  titre("Le plan d'Infosystem, en résumé"),
  liste(
    "**Où en sommes-nous.** Une PME québécoise de services informatiques gérés, treize " +
      "personnes, des clients fidèles qui apprécient sa proximité et sa rapidité. Mais une " +
      "équipe qui se renouvelle trop vite, des atouts qui reposent sur quelques personnes, " +
      "dont le fondateur, et un marché où le soutien de base s'automatise.",
    "**Nos enjeux.** La capacité : garder et faire grandir l'équipe. Le positionnement : " +
      "passer du soutien de base à l'expertise. La pérennité : rendre l'entreprise " +
      "propriétaire de ses atouts et préparer la relève.",
    "**Notre cap.** Devenir le partenaire de confiance des PME de la région pour la " +
      "sécurité de leurs systèmes, avec une équipe qui choisit d'y faire carrière.",
    "**Notre stratégie.** Les PME de la région, la proximité et une expertise en sécurité " +
      "et en conformité ; une croissance d'abord interne, une alliance avec un " +
      "spécialiste, une relève qui associe les seniors.",
    "**Ce que nous ne ferons pas.** Casser les prix, revendre du matériel, développer nos " +
      "propres logiciels, aller dans d'autres régions avant d'avoir stabilisé l'équipe.",
  ),
  tableau(
    ["Chantier", "Responsable", "Échéance"],
    [
      ["Rétention et parcours de carrière", "Marthe", "Mesures rapides en 6 mois"],
      ["Formation certifiante", "Le second senior", "En continu dès le 3e mois"],
      ["Offre de sécurité et de conformité", "Le premier senior", "Offre complète à 18 mois"],
      ["Base de connaissances commune", "Le second senior", "18 mois"],
      ["Forfait mensuel par poste", "Justin", "20 mois"],
      ["Plan de relève", "Justin", "Première discussion à 5 mois"],
    ],
    "Les chiffres restent illustratifs, comme dans tout le cours.",
  ),
  p(
    "Suivent les objectifs (départs de techniciens divisés par deux en trois ans, " +
      "40 heures de formation par technicien et par année, un quart du chiffre d'affaires " +
      "en sécurité et en conformité), les risques avec leur réponse prévue, et le rythme " +
      "du suivi.",
  ),

  titre("Ce qui rend un plan utile"),
  liste(
    "**Il est traçable** : chaque enjeu, chaque choix renvoie à l'analyse qui l'a produit. " +
      "Un lecteur sceptique peut vérifier.",
    "**Il renonce** : la liste de ce que l'on ne fera pas protège l'équipe des bonnes " +
      "idées qui arrivent au mauvais moment.",
    "**Il nomme des personnes**, pas des services.",
    "**Il prévoit l'échec** : face à un risque, la réponse est déjà écrite.",
    "**Il est court** : cinq pages se relisent, s'affichent et se révisent.",
  ),
  retenir(
    "Un bon plan se lit en vingt minutes et permet à chacun de répondre à trois questions : " +
      "où allons-nous, pourquoi, et quel est mon rôle.",
  ),
  piege(
    "Le plan de quarante pages qui reprend toutes les analyses. Il impressionne le jour de " +
      "sa présentation, puis personne ne le rouvre.",
  ),

  titre("La démarche en une page"),
  tableau(
    ["Étape", "Question clé", "Livrable"],
    [
      ["1. Environnement externe", "Qu'est-ce qui change autour de nous ?", "Variables pivots"],
      ["2. Concurrence", "Qui capte la valeur ?", "Intensité des forces"],
      ["3. Environnement interne", "Sur quoi nous appuyer ?", "Forces, avantages"],
      ["4. Parties prenantes", "Qui peut soutenir ou bloquer ?", "Stratégie d'engagement"],
      ["5. Synthèse", "Que veut dire tout cela ?", "Enjeux stratégiques"],
      ["6. Cap", "Où voulons-nous aller ?", "Vision, mission, objectifs"],
      ["7. Choix", "Que faire, et que ne pas faire ?", "Stratégie retenue"],
      ["8. Action", "Qui fait quoi, et quand ?", "Feuille de route, indicateurs"],
      ["9. Plan", "Comment le partager ?", "Un document de cinq ou six pages"],
    ],
  ),
  p(
    "Les quatre premières étapes peuvent avancer en parallèle, confiées à des personnes " +
      "différentes. À partir de la synthèse, les étapes s'enchaînent : chacune s'appuie " +
      "sur la précédente.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une boulangerie de Cotonou rédige son plan. Dans quelle section chaque phrase " +
      "doit-elle aller ?",
    categories: ["Nos enjeux", "Notre stratégie", "Nos chantiers", "Nos risques"],
    elements: [
      {
        texte: "« Garder nos clients du matin malgré l'ouverture d'un supermarché voisin. »",
        categorie: 0,
        explication: "Un défi majeur tiré du diagnostic.",
      },
      {
        texte: "« Nous ne livrerons pas les hôtels avant d'avoir un second four. »",
        categorie: 1,
        explication: "Un renoncement explicite, qui fait partie de la stratégie.",
      },
      {
        texte: "« Aïcha forme deux apprentis d'ici six mois. »",
        categorie: 2,
        explication: "Un chantier, avec un responsable et une échéance.",
      },
      {
        texte: "« Si le prix de la farine monte de 20 %, nous réduisons la gamme. »",
        categorie: 3,
        explication: "Un risque, son signal et la réponse prévue.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Justin hésite à joindre au plan les 30 pages de tableaux de ses analyses. Que lui " +
      "conseiller ?",
    choix: [
      {
        texte: "Tout joindre au plan : plus il est complet, plus il est crédible.",
        explication: "Un plan trop long n'est pas relu ; la crédibilité vient de la traçabilité.",
      },
      {
        texte: "Garder les conclusions dans le plan et conserver les analyses à part.",
        explication: "Oui : le plan reste court, et qui veut vérifier sait où regarder.",
      },
      {
        texte: "Supprimer les analyses, puisque le plan les résume.",
        explication: "Elles prouvent d'où viennent les choix ; il faut les garder.",
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
        texte: "La section « ce que nous ne ferons pas » est souvent l'une des plus utiles.",
        vrai: true,
        explication: "Elle permet de trier vite les occasions et protège l'équipe.",
      },
      {
        texte: "Dans un plan de PME, un chantier peut être confié à « la direction ».",
        vrai: false,
        explication: "Il faut une personne nommée, qui en répond.",
      },
      {
        texte: "La synthèse peut commencer avant que l'analyse des parties prenantes soit " +
          "terminée.",
        vrai: false,
        explication: "Les quatre premières étapes doivent être réunies avant la synthèse.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Rédigez la section « Notre stratégie » de votre plan en cinq lignes au plus : " +
      "l'énoncé, puis trois choses que votre organisation ne fera pas.",
    corrige: [
      "Un énoncé qui dit pour qui, avec quel avantage et comment l'on croît.",
      "Trois renoncements précis, liés aux tentations réelles de l'organisation.",
      "Un lien visible avec les enjeux de la section 2.",
      "Un texte qu'un employé comprend sans explication.",
    ],
  }),

  appliquez(
    9,
    "À l'étape 9, générez votre plan : l'assistant assemble vos étapes validées en huit " +
      "sections. Relisez-le en vérifiant les cinq qualités de cette leçon.",
  ),
  fiche(
    "Le plan écrit transmet la stratégie : cinq ou six pages.",
    "Huit sections, du diagnostic au suivi.",
    "Il garde les conclusions et renvoie aux analyses.",
    "Traçable, il renonce, il nomme, il prévoit l'échec, il est court.",
    "Étapes 1 à 4 en parallèle ; de la synthèse au plan, en chaîne.",
  ),
];
