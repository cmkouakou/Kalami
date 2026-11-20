/**
 * =============================================================
 *  Fichier    : m04-l05.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 4, leçon 5 — « Les capacités dynamiques » : quand les atouts
 *               deviennent des pièges, percevoir, saisir, reconfigurer, ce qu'une PME peut
 *               faire. Sources : livre, module 5 (§ 5.2, réforme commerciale d'Ajinomoto
 *               Afrique de l'Ouest, angle différent de celui du module 5) ; Teece, Pisano
 *               et Shuen, 1997 ; Teece, 2007 ; Leonard-Barton, 1992 (rigidités).
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
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M04_L05: ContenuLecon = [
  p(
    "Le VRIO dit si une ressource donne un avantage **aujourd'hui**. Mais l'environnement " +
      "bouge : l'IA change le soutien informatique, le paiement mobile change le commerce. " +
      "Un atout d'hier peut devenir un boulet. Cette dernière leçon du module pose la " +
      "question qui manque : l'entreprise sait-elle **changer ses propres capacités** ?",
  ),

  titre("Quand l'atout devient un piège"),
  p(
    "Une compétence très développée crée des habitudes, des outils et une fierté. Tant " +
      "que le marché la récompense, tout va bien. Quand il change, ces mêmes habitudes " +
      "empêchent de voir et d'agir. Les chercheurs parlent de **rigidités** : le revers " +
      "d'une compétence centrale.",
  ),
  p(
    "Les vendeurs de cartes de recharge téléphonique en sont un exemple : leur réseau de " +
      "points de vente était un atout, jusqu'à ce que la recharge se fasse directement " +
      "depuis le téléphone. Ceux qui ont réorienté leur réseau vers le dépôt et le retrait " +
      "d'argent ont survécu ; les autres ont vu leur atout perdre sa valeur.",
  ),

  titre("Percevoir, saisir, reconfigurer"),
  definition(
    "Capacités dynamiques",
    "La capacité d'une entreprise à **renouveler** ses ressources et compétences pour " +
      "suivre un environnement qui change. Ce ne sont pas des ressources de plus, mais la " +
      "faculté de les transformer.",
  ),
  schema(
    "capacites-dynamiques",
    "Un cycle en trois temps : percevoir les changements et les opportunités, saisir " +
      "celles qui comptent en y engageant des ressources, reconfigurer l'organisation " +
      "pour les exploiter. Puis le cycle recommence.",
  ),
  tableau(
    ["Temps", "Ce qu'il faut savoir faire", "Exemples de pratiques"],
    [
      [
        "Percevoir",
        "Repérer tôt les changements de marché, de technologie, de réglementation",
        "Veille, écoute des clients, contacts avec les fournisseurs et les écoles",
      ],
      [
        "Saisir",
        "Décider et engager des ressources sur les bonnes opportunités",
        "Essais à petite échelle, budget réservé à l'innovation, décisions rapides",
      ],
      [
        "Reconfigurer",
        "Réorganiser les activités, les rôles et les compétences",
        "Nouvelles fonctions, formation, abandon d'activités devenues inutiles",
      ],
    ],
  ),
  terrain(
    "Quand le défi passe de l'usine au marché",
    "Chez Ajinomoto Afrique de l'Ouest, la démarche TPM avait porté ses fruits : nous " +
      "produisions bien, et beaucoup. Mais les ventes n'ont pas suivi et les magasins " +
      "débordaient. Le défi s'était déplacé de l'usine vers le marché. L'entreprise a " +
      "reconfiguré ses capacités : le directeur d'usine a été nommé directeur commercial, " +
      "et je suis devenu administrateur des ventes. Il a fallu tout réformer : itinéraires " +
      "de vente, organisation des agences décentralisées, gestion de la flotte et de la " +
      "force de vente, formation du personnel commercial. Percevoir que le défi a changé " +
      "de place, puis déplacer les compétences vers lui : c'est cela, une capacité dynamique.",
  ),
  piege(
    "Confondre capacité dynamique et agitation. Changer d'outil chaque année n'est pas une " +
      "capacité dynamique. La preuve d'une capacité dynamique, c'est que l'entreprise a " +
      "**déjà** su transformer ses compétences au bon moment, et qu'elle peut le refaire.",
  ),

  titre("Pour Infosystem et pour une PME"),
  p(
    "Une PME n'a pas de service de recherche ni de cellule de veille. Elle a d'autres " +
      "atouts : la proximité avec les clients, qui permet de percevoir vite, et une petite " +
      "taille, qui permet de reconfigurer sans lourdeur. Pour Infosystem, quelques " +
      "pratiques simples suffiraient :",
  ),
  liste(
    "**Percevoir** : un bilan annuel avec chaque client, où l'on demande ce qui change " +
      "chez lui ; une veille partagée sur l'IA dans le soutien.",
    "**Saisir** : tester une offre de conformité à la Loi 25 auprès de trois clients " +
      "avant de la généraliser.",
    "**Reconfigurer** : former les jeunes techniciens aux sujets qui montent, et confier " +
      "aux seniors le rôle de mentors.",
  ),
  retenir(
    "Les trois chantiers du VRIO (documenter, former, transférer la réputation) sont " +
      "aussi des capacités dynamiques : ils rendent Infosystem capable de changer sans " +
      "dépendre de quelques personnes.",
  ),
  notion(
    "Pour aller plus loin : d'où vient la notion ?",
    p(
      "David Teece, Gary Pisano et Amy Shuen ont proposé la notion en 1997, pour " +
        "expliquer pourquoi certaines entreprises restent performantes dans des " +
        "industries qui changent vite. Teece l'a précisée en 2007 avec les trois temps : " +
        "percevoir, saisir, reconfigurer.",
    ),
    p(
      "Elle complète le VRIO : le VRIO photographie l'avantage à un moment donné ; les " +
        "capacités dynamiques disent si l'entreprise saura en construire un nouveau quand " +
        "le premier s'usera.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une agence de voyages de Dakar fait face à la vente de billets en ligne. Rangez " +
      "chaque action dans le bon temps.",
    categories: ["Percevoir", "Saisir", "Reconfigurer"],
    elements: [
      {
        texte:
          "Remarquer que les jeunes clients achètent désormais leurs billets sur leur téléphone.",
        categorie: 0,
        explication: "Repérer le changement avant qu'il ne pèse sur les ventes.",
      },
      {
        texte:
          "Lancer, à titre d'essai, des séjours organisés pour les pèlerinages et les " +
          "entreprises.",
        categorie: 1,
        explication: "Engager des ressources sur une opportunité, à petite échelle.",
      },
      {
        texte: "Former les agents de comptoir à devenir conseillers en voyages de groupe.",
        categorie: 2,
        explication: "Transformer les compétences de l'équipe.",
      },
      {
        texte: "Fermer deux guichets de billetterie devenus inutiles.",
        categorie: 2,
        explication: "Abandonner une activité fait aussi partie de la reconfiguration.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Qu'est-ce qui distingue une capacité dynamique d'une ressource distinctive ?",
    choix: [
      {
        texte: "Elle est plus rare.",
        explication: "La rareté est un test du VRIO ; ce n'est pas ce qui la distingue.",
      },
      {
        texte: "Elle permet de transformer les ressources quand l'environnement change.",
        explication:
          "Oui : ce n'est pas une ressource de plus, c'est la faculté de renouveler les autres.",
      },
      {
        texte: "Elle ne concerne que les grandes entreprises technologiques.",
        explication: "Une PME peut en avoir, souvent grâce à sa proximité avec les clients.",
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
        texte: "Une compétence centrale peut devenir une rigidité quand le marché change.",
        vrai: true,
        explication:
          "Les habitudes qui ont fait le succès empêchent parfois de voir le changement.",
      },
      {
        texte: "Changer souvent d'outils prouve une forte capacité dynamique.",
        vrai: false,
        explication:
          "La preuve, c'est d'avoir transformé ses compétences au bon moment, pas l'agitation.",
      },
      {
        texte: "La proximité des clients aide une PME à percevoir les changements.",
        vrai: true,
        explication: "Elle entend tôt ce qui change chez eux.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Racontez une fois où votre organisation a dû changer ses compétences face à un " +
      "changement externe. Qu'a-t-elle perçu, saisi, reconfiguré ? Qu'est-ce qui aurait " +
      "pu aller plus vite ?",
    corrige: [
      "Un changement externe précis, daté, rattaché au PESTEL ou aux cinq forces.",
      "Les trois temps distingués : ce qui a été remarqué, ce qui a été décidé, ce qui a " +
        "été réorganisé.",
      "Une rigidité identifiée : l'habitude, l'outil ou la personne qui a freiné.",
      "Une pratique simple qui rendrait l'organisation plus rapide la prochaine fois.",
    ],
  }),

  appliquez(
    3,
    "Dans l'étape 3, ajoutez une ligne sur la capacité de votre organisation à " +
      "transformer ses compétences : elle nourrira vos forces ou vos faiblesses au module 5.",
  ),
  fiche(
    "Un atout d'hier peut devenir une rigidité.",
    "Capacités dynamiques : percevoir, saisir, reconfigurer.",
    "La preuve : avoir déjà transformé ses compétences au bon moment.",
    "Une PME perçoit grâce à ses clients et reconfigure grâce à sa petite taille.",
    "Le VRIO photographie l'avantage ; les capacités dynamiques le renouvellent.",
  ),
];
