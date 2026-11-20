/**
 * =============================================================
 *  Fichier    : m12-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 12, leçon 2 — « Là où les stratégies échouent » : l'écart entre
 *               le plan et l'action, les erreurs relevées par Kotter, le piège de
 *               l'urgent dans une PME, un responsable nommé par chantier, la répartition
 *               des chantiers d'Infosystem et la tension sur les seniors. Sources : livre,
 *               module 9 ; Kotter, 1995. Texte, exemples et exercices originaux.
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

export const M12_L02: ContenuLecon = [
  p(
    "La plupart des stratégies n'échouent pas parce qu'elles étaient mauvaises, mais " +
      "parce qu'elles n'ont jamais vraiment été mises en œuvre. Le plan est adopté, " +
      "chacun repart à son travail, et six mois plus tard rien n'a changé. Cette leçon " +
      "décrit où se loge cet écart, et comment le réduire.",
  ),

  titre("Les erreurs relevées par Kotter"),
  p(
    "En 1995, John Kotter a étudié des dizaines d'entreprises qui tentaient de se " +
      "transformer. Quatre erreurs revenaient sans cesse.",
  ),
  tableau(
    ["Erreur", "Ce qui se passe"],
    [
      [
        "Un sentiment d'urgence insuffisant",
        "Personne ne voit pourquoi il faudrait changer maintenant",
      ],
      [
        "Une vision mal communiquée",
        "Le plan reste dans un document que peu de gens ont lu",
      ],
      [
        "Aucune victoire rapide",
        "Sans résultat visible, l'équipe cesse d'y croire",
      ],
      [
        "Crier victoire trop tôt",
        "On relâche l'effort avant que les nouvelles habitudes soient prises",
      ],
    ],
  ),
  retenir(
    "Un plan devient réel quand chacun sait pourquoi il compte, voit vite un premier " +
      "résultat, et constate que l'effort continue après les premiers succès.",
  ),

  titre("Le piège de l'urgent"),
  p(
    "Dans une PME, l'ennemi du plan a un nom : l'urgent. Un client en panne passe " +
      "toujours avant un projet à long terme, et il a raison de passer avant. Mais si " +
      "chaque semaine apporte sa panne, le projet n'avance jamais. Les chantiers " +
      "stratégiques ont besoin de temps protégé, réservé à l'avance, comme on réserve un " +
      "rendez-vous avec un client.",
  ),

  titre("Un responsable nommé par chantier"),
  p(
    "La première édition du livre confiait des projets à un service des ressources " +
      "humaines et à un directeur commercial. Infosystem n'en a pas. Dans une PME de " +
      "treize personnes, chaque chantier repose sur une personne nommée, qui le mène en " +
      "plus de son travail habituel. D'où une règle : lancer peu de chantiers à la fois.",
  ),
  tableau(
    ["Responsable", "Chantiers"],
    [
      ["Justin", "La stratégie d'ensemble, les grands clients, la relève"],
      ["Marthe", "Le tableau de bord et les projets liés au personnel"],
      ["Le premier senior", "L'offre de sécurité et de conformité, le partenariat"],
      ["Le second senior", "La formation des jeunes et la base de connaissances"],
    ],
  ),
  piege(
    "Confier les chantiers à ceux qui sont déjà les plus occupés. Les deux seniors sont " +
      "à la fois les meilleurs techniciens et les responsables désignés. Sans " +
      "allègement, ils feront passer les clients d'abord, et les chantiers attendront.",
  ),
  p(
    "Le plan doit donc libérer leur temps : confier aux jeunes une part du travail " +
      "courant, une fois formés, et envisager l'embauche d'une personne à temps partiel " +
      "pour l'administration et le recrutement.",
  ),

  titre("Les autres causes d'échec"),
  liste(
    "**Trop de chantiers à la fois** : tout avance un peu, rien n'aboutit.",
    "**Des moyens absents** : un chantier sans budget ni temps n'est qu'un souhait.",
    "**Une structure qui contredit le plan** : on demande de la qualité, mais on paie au " +
      "nombre de billets fermés.",
    "**Le silence** : les employés apprennent les changements par la rumeur.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Un restaurant de Dakar a adopté un plan il y a six mois. Quelle erreur de Kotter " +
      "chaque situation illustre-t-elle ?",
    categories: [
      "Urgence insuffisante",
      "Vision mal communiquée",
      "Aucune victoire rapide",
      "Victoire criée trop tôt",
    ],
    elements: [
      {
        texte: "Les serveurs ne savent pas qu'un nouveau menu du midi est prévu.",
        categorie: 1,
        explication: "Le plan n'est pas parvenu à ceux qui doivent l'appliquer.",
      },
      {
        texte: "Le gérant pense que la baisse des clients du midi finira par passer.",
        categorie: 0,
        explication: "Personne ne voit pourquoi changer maintenant.",
      },
      {
        texte: "Après un bon premier mois, on abandonne les fiches de suivi des plats.",
        categorie: 3,
        explication: "L'effort cesse avant que l'habitude soit prise.",
      },
      {
        texte: "Six mois de travail, et aucun résultat n'a été montré à l'équipe.",
        categorie: 2,
        explication: "Sans résultat visible, l'équipe se démobilise.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Le second senior n'avance pas sur la base de connaissances : chaque semaine, une " +
      "panne urgente prend son temps. Que faire en premier ?",
    choix: [
      {
        texte: "Lui rappeler que le chantier est prioritaire.",
        explication: "Il le sait ; c'est son temps qui manque, pas sa volonté.",
      },
      {
        texte: "Lui réserver une demi-journée par semaine, protégée des appels.",
        explication: "Oui : un temps protégé, comme un rendez-vous client.",
      },
      {
        texte: "Abandonner le chantier.",
        explication: "La base de connaissances répond à un enjeu central du plan.",
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
        texte: "La plupart des stratégies échouent parce qu'elles étaient mal conçues.",
        vrai: false,
        explication: "Elles échouent surtout dans leur mise en œuvre.",
      },
      {
        texte: "Dans une PME, chaque chantier a besoin d'un responsable nommé.",
        vrai: true,
        explication: "Il n'y a pas de service pour le porter à sa place.",
      },
      {
        texte: "Lancer tous les chantiers en même temps accélère le plan.",
        vrai: false,
        explication: "Les mêmes personnes portent tout : mieux vaut peu à la fois.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Pour chacun de vos chantiers, nommez un responsable. Qui risque d'être surchargé, " +
      "et comment libérerez-vous son temps ?",
    corrige: [
      "Un responsable par chantier, nommé, et non un service.",
      "La personne la plus exposée à la surcharge identifiée.",
      "Un moyen concret de libérer du temps : déléguer, embaucher, étaler.",
      "Un nombre de chantiers simultanés réaliste.",
    ],
  }),

  appliquez(
    8,
    "À l'étape 8, attribuez chaque action à un responsable nommé et vérifiez que personne " +
      "n'en porte trop en même temps.",
  ),
  fiche(
    "Les stratégies échouent surtout dans leur mise en œuvre.",
    "Kotter : urgence, vision communiquée, victoires rapides, effort maintenu.",
    "Dans une PME, l'urgent écrase le plan : il faut du temps protégé.",
    "Un responsable nommé par chantier, et peu de chantiers à la fois.",
    "Infosystem : libérer le temps des seniors pour qu'ils portent leurs chantiers.",
  ),
];
