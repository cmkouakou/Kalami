/**
 * =============================================================
 *  Fichier    : m06-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 6, leçon 1 — « Qui a son mot à dire ? La matrice pouvoir-intérêt » :
 *               définition des parties prenantes, internes et externes, les attentes de
 *               chacune, la matrice de Mendelow, le pouvoir collectif des jeunes
 *               techniciens. Sources : livre, module 6 (§ 6.1 à 6.3, encadré « Les oubliés
 *               de la salle de crise ») ; Freeman, 1984 ; Mendelow, 1991. Texte, exemples
 *               et exercices originaux.
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

export const M06_L01: ContenuLecon = [
  p(
    "Justin connaît maintenant ses forces, ses faiblesses et ses enjeux. Il pourrait être " +
      "tenté de passer directement au choix d'une stratégie. Ce serait oublier une " +
      "question que beaucoup de dirigeants découvrent trop tard : **qui va soutenir ce " +
      "choix, qui va y résister, et qui peut le faire échouer ?**",
  ),

  definition(
    "Parties prenantes",
    "Les personnes et les groupes qui peuvent influencer les activités de l'entreprise, " +
      "ou qui sont touchés par elles. L'entreprise dépend d'eux, et ils dépendent d'elle. " +
      "La notion a été popularisée par R. Edward Freeman en 1984.",
  ),
  p(
    "On distingue les parties prenantes **internes** (propriétaires, dirigeants, employés) " +
      "et **externes** (clients, fournisseurs, banques, gouvernements, communauté, écoles, " +
      "associations). Cette analyse fait partie du diagnostic : en pratique, elle se mène " +
      "en parallèle des autres.",
  ),

  titre("D'abord, la liste et les attentes"),
  p(
    "La première étape consiste à n'oublier personne, et à noter ce que chacun attend de " +
      "l'entreprise. Ce sont ces attentes qui expliquent les réactions.",
  ),
  tableau(
    ["Partie prenante", "Ce qu'elle attend d'Infosystem"],
    [
      ["Justin et Marthe", "Une entreprise solide, une retraite sereine, un rôle de conseil"],
      ["Techniciens seniors", "Reconnaissance ; peut-être une place plus grande dans l'entreprise"],
      ["Jeunes techniciens", "Salaire compétitif, formation, perspectives de carrière"],
      ["Clients", "Un service rapide, fiable et personnalisé"],
      ["Grands éditeurs (Microsoft…)", "Le respect de leurs conditions de licence"],
      ["Gouvernement", "Le respect des lois, dont la Loi 25"],
      ["Banques", "La solidité financière, utile si un repreneur doit emprunter"],
      ["Cégeps et écoles", "Des milieux de stage pour leurs étudiants"],
      ["Filles de Justin", "Savoir ce qu'il adviendra du patrimoine familial"],
    ],
  ),
  piege(
    "Oublier les parties prenantes de l'avenir. Pour Infosystem, la relève fait entrer en " +
      "scène des acteurs qu'on ne voyait pas : les filles de Justin, les banques et, " +
      "indirectement, un futur repreneur.",
  ),

  titre("La matrice pouvoir-intérêt"),
  p(
    "Toutes les parties prenantes ne méritent pas la même attention. La matrice d'Aubrey " +
      "Mendelow (1991) les classe selon deux questions : quel **pouvoir** a-t-elle " +
      "d'influencer les décisions ? Quel **intérêt** porte-t-elle à ces décisions ?",
  ),
  schema(
    "pouvoir-interet",
    "La matrice pouvoir-intérêt. Pouvoir fort et intérêt fort : gérer de près. Pouvoir " +
      "fort et intérêt faible : garder satisfaits. Pouvoir faible et intérêt fort : tenir " +
      "informés. Pouvoir faible et intérêt faible : surveiller.",
  ),
  liste(
    "**Gérer de près** : on les consulte et on les associe aux décisions.",
    "**Garder satisfaits** : ils interviennent rarement, mais un mécontentement coûte cher.",
    "**Tenir informés** : ils peuvent gagner en influence ou s'allier à plus puissants.",
    "**Surveiller** : un minimum d'attention, en restant attentif aux changements.",
  ),

  titre("Le pouvoir ne se voit pas toujours"),
  p(
    "Les grands éditeurs comme Microsoft ont un **fort pouvoir** (ils imposent leurs " +
      "conditions, module 3) mais **peu d'intérêt** pour une PME parmi des milliers : ils " +
      "sont à garder satisfaits.",
  ),
  p(
    "Les jeunes techniciens, eux, semblent sans pouvoir : aucun ne peut imposer ses vues " +
      "à Justin. Mais **collectivement**, sur un marché où ils sont rares, ils ont celui " +
      "de **partir**. Chaque départ réduit la capacité de l'entreprise et alourdit la " +
      "charge des autres. Ils sont donc à gérer de près.",
  ),
  retenir(
    "Le pouvoir d'une partie prenante ne se mesure pas à sa voix en réunion. Il se " +
      "mesure à ce que l'entreprise perdrait si elle cessait de coopérer.",
  ),
  terrain(
    "Les oubliés de la salle de crise",
    "À Montréal, j'étais consultant informatique externe pour une grande organisation " +
      "publique quand des pirates ont mis hors service plus de la moitié de ses serveurs. " +
      "Je me suis porté volontaire, on m'a confié un rôle, et en quelques jours tout était " +
      "rétabli. Des certificats de participation ont ensuite été remis à tous ceux qui " +
      "avaient pris part à l'effort, sauf à moi, probablement parce que j'étais externe. " +
      "Au dîner de Noël, l'organisation a payé le repas des employés, pas celui des " +
      "consultants. Peu à peu, j'ai perdu mon sentiment d'appartenance, et je suis parti " +
      "pour Hydro-Québec alors que le poste interne que je visais s'ouvrait enfin. Les " +
      "consultants ne figuraient sur aucune carte des parties prenantes. Seuls, nous " +
      "n'avions aucun pouvoir ; ensemble, nous avions celui de partir avec nos " +
      "connaissances des projets.",
  ),
  p(
    "La leçon concerne Infosystem doublement : ses techniciens passent leurs journées chez " +
      "les clients, où ce sont eux, les externes. Si personne ne cultive leur sentiment " +
      "d'appartenance, ils finiront par partir.",
  ),
  notion(
    "Pour aller plus loin : mesurer l'intérêt",
    p(
      "L'intérêt d'une partie prenante dépend de trois choses : à quel point la décision " +
        "la touche (est-ce vital pour elle ?), si elle a les moyens de s'informer, et si " +
        "elle a le temps et les compétences pour suivre ce que fait l'entreprise.",
    ),
    p(
      "Un acteur peu intéressé peut se mobiliser du jour au lendemain si une décision le " +
        "touche directement : c'est pourquoi la matrice doit être revue à chaque grande " +
        "décision.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une compagnie de cars de Bamako veut supprimer une ligne peu rentable. Placez chaque " +
      "partie prenante dans son quadrant.",
    categories: ["Gérer de près", "Garder satisfaits", "Tenir informés", "Surveiller"],
    elements: [
      {
        texte: "Le syndicat des chauffeurs, qui menace de grève.",
        categorie: 0,
        explication: "Pouvoir fort (bloquer le service) et intérêt fort (des emplois en jeu).",
      },
      {
        texte: "Le ministère des Transports, qui délivre les licences de toutes les lignes.",
        categorie: 1,
        explication: "Pouvoir fort, mais une ligne parmi des centaines l'intéresse peu.",
      },
      {
        texte: "Les habitués de la ligne supprimée.",
        categorie: 2,
        explication:
          "Très touchés, peu de pouvoir seuls ; ils peuvent alerter la presse ou les élus.",
      },
      {
        texte: "Le fournisseur de pneus de la compagnie.",
        categorie: 3,
        explication: "Une ligne de moins change peu de chose pour lui.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pourquoi le livre place-t-il les jeunes techniciens d'Infosystem parmi les acteurs " +
      "à gérer de près ?",
    choix: [
      {
        texte: "Parce qu'ils sont les plus nombreux.",
        explication: "Le nombre seul ne donne pas le pouvoir.",
      },
      {
        texte: "Parce qu'ensemble, sur un marché où ils sont rares, ils peuvent partir.",
        explication: "Oui : leur pouvoir s'exerce par le départ, pas par la négociation.",
      },
      {
        texte: "Parce qu'ils ont un syndicat.",
        explication: "Rien ne l'indique : leur pouvoir est collectif, mais informel.",
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
        texte: "Un fournisseur puissant est forcément à gérer de près.",
        vrai: false,
        explication: "S'il porte peu d'intérêt à l'entreprise, il est à garder satisfait.",
      },
      {
        texte: "La position d'une partie prenante dans la matrice peut changer.",
        vrai: true,
        explication: "Un acteur indifférent peut se mobiliser si une décision le touche.",
      },
      {
        texte: "Les parties prenantes sont toujours extérieures à l'entreprise.",
        vrai: false,
        explication: "Propriétaires, dirigeants et employés sont des parties prenantes internes.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Pour une décision importante en cours dans votre organisation, dressez la liste des " +
      "parties prenantes, notez leurs attentes et placez-les dans la matrice. Laquelle " +
      "avez-vous failli oublier ?",
    corrige: [
      "Une liste qui couvre l'interne et l'externe, sans oublier les acteurs de l'avenir.",
      "Pour chacune, une attente formulée de son point de vue.",
      "Un placement justifié : d'où vient son pouvoir, pourquoi la décision l'intéresse.",
      "Un acteur au pouvoir collectif ou discret repéré (employés, consultants, usagers).",
    ],
  }),

  appliquez(
    4,
    "Dans l'étape 4, dressez la liste de vos parties prenantes avec leurs attentes, puis " +
      "placez-les dans la matrice pouvoir-intérêt.",
  ),
  fiche(
    "Parties prenantes : ceux qui influencent l'entreprise ou sont touchés par elle.",
    "D'abord la liste et les attentes de chacun, sans oublier les acteurs de l'avenir.",
    "Matrice pouvoir-intérêt : gérer de près, garder satisfaits, tenir informés, surveiller.",
    "Le pouvoir se mesure à ce que l'entreprise perdrait sans la coopération de l'acteur.",
    "Un groupe sans voix peut avoir un grand pouvoir : celui de partir.",
  ),
];
