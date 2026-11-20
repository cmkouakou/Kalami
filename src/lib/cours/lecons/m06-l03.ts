/**
 * =============================================================
 *  Fichier    : m06-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 6, leçon 3 — « Gouvernance et responsabilité sociale » : qui
 *               contrôle les dirigeants, le modèle actionnarial et le modèle partenarial,
 *               la propriété change la donne, la RSE, quatre postures et trois étapes,
 *               la RSE d'Infosystem. Sources : programme HEC MNGT30490, module 6 (pour le
 *               périmètre) ; Jensen et Meckling, 1976 ; ISO 26000, 2010 ; Porter et
 *               Kramer, 2011. Texte, exemples et exercices originaux.
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
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M06_L03: ContenuLecon = [
  p(
    "La matrice pouvoir-intérêt dit qui compte. Deux questions restent : **au nom de qui** " +
      "les dirigeants décident-ils, et **jusqu'où** s'étend la responsabilité de " +
      "l'entreprise ? La première relève de la gouvernance, la seconde de la " +
      "responsabilité sociale.",
  ),

  titre("La gouvernance : qui contrôle les dirigeants ?"),
  definition(
    "Gouvernance d'entreprise",
    "L'ensemble des règles et des structures qui définissent qui décide dans " +
      "l'entreprise, au nom de qui, et comment les dirigeants rendent des comptes.",
  ),
  p(
    "Dans une grande entreprise, les propriétaires (les actionnaires) ne dirigent pas " +
      "eux-mêmes. Ils élisent un **conseil d'administration**, qui nomme et surveille les " +
      "**dirigeants**. Le risque est connu : les dirigeants peuvent poursuivre leurs " +
      "propres intérêts (prestige, rémunération, confort) plutôt que ceux des " +
      "propriétaires. Les chercheurs appellent cela le **problème d'agence**.",
  ),
  tableau(
    ["Modèle", "Au service de qui ?", "Ses atouts", "Ses risques"],
    [
      [
        "Actionnarial",
        "D'abord des actionnaires",
        "Objectif clair, décisions rapides, pression sur la performance",
        "Vision à court terme ; autres parties prenantes négligées",
      ],
      [
        "Partenarial",
        "De l'ensemble des parties prenantes",
        "Horizon long, risques mieux mesurés, adhésion des employés",
        "Objectifs multiples, plus difficiles à arbitrer et à contrôler",
      ],
    ],
  ),

  titre("La propriété change la donne"),
  p(
    "Qui possède l'entreprise modifie le pouvoir et l'intérêt de chacun. Quelques " +
      "situations typiques :",
  ),
  liste(
    "**Entreprise cotée** : les actionnaires sont nombreux et dispersés ; le conseil et " +
      "les marchés financiers jouent le rôle de contrôle.",
    "**Entreprise familiale** : la famille contrôle, souvent avec un horizon long, mais " +
      "la succession peut devenir un sujet de tension.",
    "**Entreprise publique** : l'État est propriétaire ; les objectifs politiques et " +
      "sociaux pèsent autant que la rentabilité.",
    "**Entreprise entrepreneuriale** : le fondateur est à la fois propriétaire et " +
      "dirigeant. Pas de problème d'agence, mais personne pour le contredire.",
  ),
  p(
    "Infosystem appartient à la dernière catégorie : Justin et Marthe possèdent et " +
      "dirigent. Sa vraie question de gouvernance est la **relève**. Si les seniors " +
      "deviennent actionnaires, ou si un repreneur extérieur arrive, il faudra des règles " +
      "nouvelles : qui décide, et comment Justin garde un rôle de conseil sans gêner son " +
      "successeur.",
  ),
  retenir(
    "Une PME n'a pas besoin d'un conseil d'administration complet. Un **comité " +
      "consultatif** de deux ou trois personnes extérieures (un comptable, un client " +
      "fidèle, un dirigeant d'une autre PME) offre déjà ce qui manque au fondateur seul : " +
      "quelqu'un qui pose les questions difficiles.",
  ),

  titre("La responsabilité sociale (RSE)"),
  definition(
    "Responsabilité sociale de l'entreprise (RSE)",
    "La responsabilité d'une organisation à l'égard des effets de ses décisions et de ses " +
      "activités sur la société et l'environnement, au-delà de ce que la loi exige. La " +
      "norme ISO 26000 (2010) en donne le cadre de référence.",
  ),
  p("Face à la RSE, les entreprises adoptent des postures très différentes :"),
  tableau(
    ["Posture", "Ce que pense l'entreprise"],
    [
      ["Le minimum légal", "« Notre seule responsabilité est de faire des profits dans la loi. »"],
      [
        "L'intérêt bien compris",
        "« Agir de façon responsable protège notre réputation et nos ventes. »",
      ],
      [
        "Le partenariat",
        "« Nous tenons compte des attentes de nos parties prenantes dans nos décisions. »",
      ],
      [
        "L'engagement",
        "« Notre raison d'être inclut un objectif social ou environnemental. »",
      ],
    ],
  ),
  p(
    "Les entreprises passent souvent par trois étapes. D'abord le **rejet** : la RSE " +
      "semble une contrainte de plus. Ensuite l'**accommodement** : on lance des " +
      "initiatives visibles pour répondre aux critiques et protéger sa valeur. Enfin, plus " +
      "rarement, l'**intégration** : la RSE devient une source d'idées et d'innovation, " +
      "qui crée de la valeur à la fois pour l'entreprise et pour la société.",
  ),
  piege(
    "Confondre RSE et communication. Une page « engagement » sur le site Web, sans " +
      "changement dans les décisions, relève de l'accommodement au mieux, de " +
      "l'écoblanchiment au pire. Le test : la RSE a-t-elle déjà fait changer une décision " +
      "qui coûtait quelque chose ?",
  ),

  titre("La RSE d'Infosystem"),
  p(
    "Pour une PME de services informatiques, la RSE n'a rien d'abstrait. Elle se loge " +
      "dans le métier lui-même :",
  ),
  liste(
    "**Protéger les données des clients**, au-delà du minimum de la Loi 25 : c'est aussi " +
      "son offre de demain.",
    "**Former la relève locale** en accueillant des stagiaires : une responsabilité " +
      "envers la région, et une réponse à son enjeu de capacité.",
    "**Recycler ou reconditionner le matériel** remplacé chez les clients, plutôt que de " +
      "le jeter.",
  ),
  p(
    "Dans les trois cas, l'action responsable sert aussi la stratégie. C'est l'idée de " +
      "**valeur partagée** : chercher les activités où l'entreprise gagne en résolvant un " +
      "problème de la société.",
  ),
  notion(
    "Pour aller plus loin : quand le social et le financier s'opposent",
    p(
      "La valeur partagée n'est pas toujours possible. Quand un objectif social coûte " +
        "sans rapporter, l'entreprise doit arbitrer. Trois approches aident : fixer à " +
        "l'avance des limites qu'on ne franchira pas (ce que l'on refuse de faire, même " +
        "rentable) ; revoir l'équilibre régulièrement plutôt qu'une fois pour toutes ; " +
        "chercher des solutions qui satisfont les deux objectifs, au lieu de choisir l'un " +
        "contre l'autre.",
    ),
    p(
      "Michael Porter et Mark Kramer ont développé l'idée de valeur partagée dans la " +
        "Harvard Business Review en 2011.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "À quelle posture face à la RSE chaque déclaration correspond-elle ?",
    categories: [
      "Le minimum légal",
      "L'intérêt bien compris",
      "Le partenariat",
      "L'engagement",
    ],
    elements: [
      {
        texte:
          "Une cimenterie : « Nous respectons les normes d'émission ; le reste n'est pas " +
          "notre affaire. »",
        categorie: 0,
        explication: "La loi, rien que la loi.",
      },
      {
        texte:
          "Un brasseur finance un forage dans un village voisin de l'usine pour soigner " +
          "son image après une polémique.",
        categorie: 1,
        explication: "L'action vise d'abord à protéger la réputation.",
      },
      {
        texte:
          "Une mine consulte les communautés locales avant de choisir le tracé de sa " +
          "nouvelle route.",
        categorie: 2,
        explication: "Les attentes des parties prenantes entrent dans la décision.",
      },
      {
        texte:
          "Une entreprise de microcrédit a pour raison d'être l'accès des femmes rurales " +
          "au financement.",
        categorie: 3,
        explication: "L'objectif social est au cœur de sa mission.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Qu'appelle-t-on le « problème d'agence » ?",
    choix: [
      {
        texte: "Le risque que les dirigeants servent leurs intérêts plutôt que ceux des " +
          "propriétaires.",
        explication: "Oui : c'est ce que la gouvernance cherche à encadrer.",
      },
      {
        texte: "La difficulté de choisir une agence de publicité.",
        explication: "Le mot « agence » désigne ici la relation entre mandant et mandataire.",
      },
      {
        texte: "Le conflit entre deux actionnaires.",
        explication: "Il s'agit de la relation entre propriétaires et dirigeants.",
      },
    ],
    bonne: 0,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Dans une entreprise où le fondateur possède et dirige, il n'y a pas de " +
          "problème d'agence.",
        vrai: true,
        explication: "Propriétaire et dirigeant sont la même personne ; le risque est ailleurs.",
      },
      {
        texte: "Une PME n'a aucune question de gouvernance.",
        vrai: false,
        explication: "La relève, l'arrivée d'associés ou d'un repreneur en posent beaucoup.",
      },
      {
        texte: "Publier une charte d'engagement suffit à prouver une démarche de RSE.",
        vrai: false,
        explication: "Il faut des décisions qui changent, parfois à un coût réel.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Proposez deux actions de RSE pour votre organisation qui servent aussi sa " +
      "stratégie. Pour chacune, dites quel enjeu ou quelle partie prenante elle touche.",
    corrige: [
      "Des actions liées au métier de l'organisation, pas des dons sans lien.",
      "Pour chacune, le bénéfice pour la société et le bénéfice pour l'organisation.",
      "Le lien avec un enjeu du module 5 ou une partie prenante du plan d'engagement.",
      "Un coût ou une contrainte reconnus : une RSE qui ne coûte jamais rien est suspecte.",
    ],
  }),

  appliquez(
    4,
    "Dans l'étape 4, ajoutez une note sur la gouvernance de votre organisation (qui " +
      "décide, qui contrôle) et sur ses responsabilités envers la société.",
  ),
  fiche(
    "Gouvernance : qui décide, au nom de qui, et comment les dirigeants rendent des comptes.",
    "Modèle actionnarial ou partenarial : deux réponses à « au service de qui ? ».",
    "La structure de propriété change le pouvoir de chacun ; pour une PME, la relève.",
    "RSE : quatre postures, du minimum légal à l'engagement.",
    "Le test : la RSE a-t-elle déjà changé une décision qui coûtait quelque chose ?",
  ),
];
