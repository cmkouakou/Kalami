/**
 * =============================================================
 *  Fichier    : m01-l05.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 1, leçon 5 — « Bonne ou mauvaise stratégie ? ». Sources : livre,
 *               module 1 (Infosystem) ; Rumelt, « Good Strategy / Bad Strategy », 2011
 *               (le noyau : diagnostic, politique directrice, actions cohérentes) ;
 *               Whittington et coll., « Stratégique », 2023 (pertinence, acceptabilité,
 *               faisabilité). Texte, exemples et exercices originaux.
 *               v0.45.1 : « pendant trois ans » (mot manquant, test d'acceptabilité).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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

export const M01_L05: ContenuLecon = [
  p(
    "« Notre stratégie : devenir la référence régionale grâce à l'excellence, à " +
      "l'innovation et à la satisfaction client. » Cette phrase orne des centaines de " +
      "rapports annuels. Elle ne dit pourtant ni quel problème l'entreprise affronte, ni " +
      "ce qu'elle va faire lundi. **Ce n'est pas une mauvaise stratégie : ce n'est pas une " +
      "stratégie du tout.**",
  ),

  titre("Le noyau d'une bonne stratégie"),
  p(
    "Dans *Good Strategy / Bad Strategy* (2011), Richard Rumelt propose un test simple : " +
      "une bonne stratégie contient un **noyau** en trois parties, qui s'enchaînent.",
  ),
  schema(
    "noyau",
    "Le noyau d'une bonne stratégie en trois temps : un diagnostic qui nomme le défi, une " +
      "politique directrice qui dit comment l'aborder, et des actions cohérentes qui se " +
      "renforcent.",
  ),
  definition(
    "Diagnostic",
    "Une explication claire de **ce qui se passe** et du défi principal à relever. Un bon " +
      "diagnostic simplifie : il désigne ce qui compte le plus parmi tout ce qui va mal.",
  ),
  definition(
    "Politique directrice",
    "**L'approche choisie** pour affronter ce défi. Elle ferme des portes : elle dit ce " +
      "qu'on fera, et donc ce qu'on ne fera pas.",
  ),
  definition(
    "Actions cohérentes",
    "Des décisions concrètes, coordonnées, qui **se renforcent** au lieu de se disperser : " +
      "des personnes, des budgets, des dates.",
  ),

  titre("Appliqué à Infosystem"),
  tableau(
    ["Partie du noyau", "Infosystem"],
    [
      [
        "Diagnostic",
        "Le roulement des jeunes techniciens réduit la capacité, freine la croissance et " +
          "rend la relève fragile : c'est le nœud des quatre défis.",
      ],
      [
        "Politique directrice",
        "Devenir l'endroit où un technicien apprend le plus vite au Québec, et vendre " +
          "cette expertise à des PME qui la paient.",
      ],
      [
        "Actions cohérentes",
        "Formations certifiantes, parcours de progression, mentorat par les seniors, " +
          "refus des petits dépannages hors contrat.",
      ],
    ],
    "Une ébauche, que les modules suivants viendront vérifier. Chaque action sert la " +
      "politique, qui répond au diagnostic.",
  ),

  titre("Quatre signes d'une mauvaise stratégie"),
  liste(
    "**Les grands mots** : un vocabulaire impressionnant (« synergies », « excellence », " +
      "« leadership ») qui ne recouvre aucun choix.",
    "**Le défi esquivé** : on ne nomme jamais le problème principal, souvent parce qu'il " +
      "est gênant.",
    "**L'objectif pris pour une stratégie** : « croître de 20 % par an » dit où l'on veut " +
      "aller, pas comment.",
    "**La liste de courses** : vingt priorités sans lien entre elles, que personne n'a eu " +
      "le courage de trier.",
  ),
  piege(
    "Croire qu'une stratégie est bonne parce qu'elle est ambitieuse ou bien écrite. Une " +
      "stratégie modeste, qui affronte le vrai problème avec des moyens réalistes, vaut " +
      "mieux qu'une grande ambition sans prise sur le réel.",
  ),

  titre("Un exemple près de chez vous"),
  p(
    "Une compagnie d'assurance fictive de Dakar perd des clients chaque année. Première " +
      "version de sa stratégie : « être l'assureur préféré des Sénégalais grâce à un " +
      "service de qualité ». Seconde version : « nos clients partent parce qu'un sinistre " +
      "met trois mois à être réglé (diagnostic). Nous serons l'assureur qui paie le plus " +
      "vite (politique). Nous ouvrons le paiement par mobile money, déléguons aux agences " +
      "les dossiers de moins de 500 000 francs CFA et publions chaque mois nos délais " +
      "(actions). » Seule la seconde permet d'agir, et de vérifier si l'on a réussi.",
  ),

  titre("Trois tests avant de valider"),
  p(
    "Une fois une stratégie formulée, trois questions, répandues dans les manuels de " +
      "stratégie, aident à l'évaluer :",
  ),
  tableau(
    ["Test", "La question", "Exemple de réponse inquiétante"],
    [
      [
        "Pertinence",
        "Répond-elle au diagnostic et à l'environnement ?",
        "Elle mise sur un marché que le PESTEL annonce en déclin.",
      ],
      [
        "Acceptabilité",
        "Les parties prenantes clés l'accepteront-elles ?",
        "Elle suppose que les actionnaires renoncent à leurs dividendes pendant trois ans.",
      ],
      [
        "Faisabilité",
        "A-t-on les ressources et les compétences ?",
        "Elle exige dix ingénieurs qu'on ne sait pas recruter.",
      ],
    ],
  ),
  retenir("Une bonne stratégie se reconnaît à son noyau et passe les trois tests.", [
    "Elle nomme le défi principal, même gênant.",
    "Elle dit comment l'aborder, et donc à quoi l'on renonce.",
    "Elle se traduit en actions qui se renforcent.",
  ]),
  notion(
    "Pour aller plus loin : le module 12",
    p(
      "Les trois tests sont repris au module 12, où vous comparerez plusieurs options " +
        "stratégiques avant d'en choisir une. Pour l'instant, retenez le réflexe : devant " +
        "toute stratégie, cherchez d'abord le diagnostic. S'il manque, le reste est fragile.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "« Nous visons 15 % de croissance par an et la première place du marché. » Quel est " +
      "le principal défaut de cette « stratégie » ?",
    choix: [
      {
        texte: "L'objectif est trop ambitieux.",
        explication: "L'ambition n'est pas le problème ; l'absence de moyen l'est.",
      },
      {
        texte: "Elle confond un objectif avec une stratégie.",
        explication:
          "Oui : elle dit où aller, pas quel défi affronter ni comment, ni à quoi renoncer.",
      },
      {
        texte: "Elle ne mentionne pas les concurrents par leur nom.",
        explication: "Ce serait utile, mais ce n'est pas le défaut principal.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne:
      "Une chaîne de pharmacies fictive de Ouagadougou a rédigé ces phrases. À quelle " +
      "partie du noyau appartient chacune ?",
    categories: ["Diagnostic", "Politique directrice", "Actions cohérentes"],
    elements: [
      {
        texte:
          "Nos clients vont chez les concurrents parce que nous sommes trop souvent en " +
          "rupture de stock.",
        categorie: 0,
        explication: "Explique ce qui se passe et nomme le défi.",
      },
      {
        texte: "Nous serons la pharmacie où le médicament prescrit est toujours disponible.",
        categorie: 1,
        explication: "L'approche choisie pour répondre au défi.",
      },
      {
        texte: "Installer un logiciel de stock partagé entre les cinq officines d'ici juin.",
        categorie: 2,
        explication: "Une décision concrète, datée, qui sert la politique.",
      },
      {
        texte: "Négocier des livraisons deux fois par semaine avec le grossiste.",
        categorie: 2,
        explication: "Action qui renforce la précédente.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Une stratégie qui ne nomme aucun problème est probablement mauvaise.",
        vrai: true,
        explication: "Sans diagnostic, les actions n'ont rien à résoudre.",
      },
      {
        texte: "Plus une stratégie compte de priorités, plus elle est complète.",
        vrai: false,
        explication: "Une longue liste sans tri signale l'absence de choix.",
      },
      {
        texte: "Une stratégie pertinente peut échouer si elle n'est pas faisable.",
        vrai: true,
        explication: "Sans ressources ni compétences, la meilleure idée reste sur le papier.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Réécrivez la phrase « Infosystem vise l'excellence du service et la croissance " +
      "durable » sous la forme d'un noyau : diagnostic, politique directrice, deux actions.",
    corrige: [
      "Diagnostic : le départ des jeunes techniciens limite la capacité et met en danger " +
        "la croissance comme la relève.",
      "Politique directrice : miser sur l'expertise et la progression des techniciens " +
        "pour les retenir et vendre un service plus spécialisé.",
      "Actions : un plan de formation certifiante financé par l'entreprise ; un parcours " +
        "de progression vers technicien senior. Toute réponse dont les actions servent la " +
        "politique et la politique répond au diagnostic est valable.",
    ],
  }),

  appliquez(
    null,
    "Relisez la stratégie affichée de votre organisation (site, rapport, discours). " +
      "Trouvez-vous un diagnostic, une politique directrice et des actions ? Notez ce qui " +
      "manque.",
  ),
  fiche(
    "Le noyau : diagnostic, politique directrice, actions cohérentes.",
    "Signes d'une mauvaise stratégie : grands mots, défi esquivé, objectif pris pour une " +
      "stratégie, liste sans tri.",
    "Trois tests : pertinence, acceptabilité, faisabilité.",
    "Devant toute stratégie, cherchez d'abord le diagnostic.",
  ),
];
