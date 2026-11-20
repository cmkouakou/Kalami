/**
 * =============================================================
 *  Fichier    : m10-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 10, leçon 2 — « La diffusion de l'innovation » : les cinq groupes
 *               d'adoptants, la courbe en S, le fossé entre pionniers et pragmatiques, les
 *               cinq caractéristiques qui accélèrent l'adoption, les leviers côté demande,
 *               le lancement du forfait par poste d'Infosystem. Sources : livre, module 8
 *               (§ 8.6) ; Rogers, 1962 ; Moore, 1991. Texte, exemples et exercices
 *               originaux.
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

export const M10_L02: ContenuLecon = [
  p(
    "Une innovation n'a de valeur que si elle est adoptée. Or les clients ne l'adoptent " +
      "pas tous en même temps, ni pour les mêmes raisons. Comprendre qui adopte d'abord, " +
      "et pourquoi les autres attendent, permet de lancer une nouveauté dans le bon ordre.",
  ),

  titre("Cinq groupes d'adoptants"),
  p(
    "En 1962, le sociologue Everett Rogers a montré que l'adoption d'une nouveauté suit, " +
      "dans une population, une courbe en cloche. Il y distinguait cinq groupes, qui " +
      "diffèrent par leur goût du risque et par ce qui les convainc.",
  ),
  schema(
    "diffusion",
    "La diffusion d'une innovation : une courbe en cloche découpée en cinq groupes. " +
      "Innovateurs, 2,5 % ; premiers adoptants, 13,5 % ; majorité précoce, 34 % ; " +
      "majorité tardive, 34 % ; retardataires, 16 %. Entre les premiers adoptants et la " +
      "majorité précoce se trouve le fossé : convaincre les pragmatiques.",
  ),
  tableau(
    ["Groupe", "Ce qui les décide"],
    [
      ["Innovateurs", "La nouveauté elle-même ; ils acceptent les défauts"],
      ["Premiers adoptants", "L'avantage d'être en avance ; ils sont écoutés par les autres"],
      ["Majorité précoce", "La preuve que cela marche chez des gens comme eux"],
      ["Majorité tardive", "La pression : tout le monde l'a déjà"],
      ["Retardataires", "Il n'y a plus d'autre choix"],
    ],
  ),
  p(
    "Si l'on cumule les adoptants, la cloche devient une **courbe en S** : un démarrage " +
      "lent, une accélération brutale au point de bascule, puis un plafond. Beaucoup " +
      "d'innovations n'atteignent jamais le point de bascule.",
  ),

  titre("Le fossé"),
  p(
    "En 1991, Geoffrey Moore a remarqué qu'il ne suffit pas de séduire les premiers " +
      "adoptants pour atteindre la majorité. Les premiers achètent un pari ; les " +
      "suivants achètent une solution éprouvée, avec des références, un service et un " +
      "prix clair. Entre les deux s'ouvre un **fossé**, où meurent bien des nouveautés.",
  ),
  retenir(
    "On ne vend pas la même chose aux deux bords du fossé. Aux pionniers, une promesse ; " +
      "aux pragmatiques, la preuve que la promesse a été tenue chez leurs semblables.",
  ),

  titre("Ce qui accélère l'adoption"),
  p("Rogers a relevé cinq caractéristiques d'une nouveauté qui en accélèrent l'adoption."),
  liste(
    "**L'avantage relatif** : le client voit-il clairement ce qu'il gagne par rapport à " +
      "ce qu'il a déjà ?",
    "**La compatibilité** : la nouveauté s'accorde-t-elle avec ses habitudes, ses outils " +
      "et ses valeurs ?",
    "**La simplicité** : peut-il la comprendre et l'utiliser sans effort ?",
    "**La possibilité d'essayer** : peut-il la tester sans s'engager, sur une période ou " +
      "un petit périmètre ?",
    "**La visibilité des résultats** : peut-il voir, et montrer aux autres, ce qu'elle " +
      "lui apporte ?",
  ),
  p(
    "Côté demande, trois leviers s'ajoutent : **faire savoir** que la nouveauté existe, " +
      "profiter de l'**effet de réseau** quand chaque nouvel utilisateur la rend plus utile " +
      "aux autres, et viser d'abord ceux dont l'avis compte pour les suivants.",
  ),
  notion(
    "Un exemple ouest-africain : le paiement mobile",
    p(
      "Le paiement par téléphone s'est répandu en Afrique de l'Ouest à une vitesse que " +
        "peu de technologies ont connue. Il cochait presque toutes les cases : un " +
        "avantage clair pour qui n'avait pas de compte bancaire, un téléphone que l'on " +
        "possédait déjà, des kiosques de quartier pour essayer avec de petites sommes, et " +
        "un effet de réseau puissant, puisque chaque nouvel utilisateur pouvait recevoir " +
        "de l'argent des autres.",
    ),
  ),

  titre("Lancer le forfait par poste chez Infosystem"),
  p(
    "Le passage d'une facture par intervention à un forfait mensuel par poste est une " +
      "innovation de modèle d'affaires. Pour un client habitué à payer seulement quand " +
      "quelque chose casse, le changement fait peur. La diffusion se prépare.",
  ),
  etapes(
    "**Commencer par les clients les plus confiants**, ceux qui recommandent déjà " +
      "Infosystem : ce sont ses premiers adoptants.",
    "**Proposer un essai de trois mois**, avec retour possible à la facturation actuelle.",
    "**Rendre le résultat visible** : un rapport mensuel d'une page, avec les incidents " +
      "évités et le temps gagné.",
    "**Garder la facture simple** : un prix par poste, rien de caché.",
    "**Se servir des premiers témoignages** pour convaincre les clients plus prudents.",
  ),
  piege(
    "Juger une innovation sur ses premiers mois. Une adoption lente au départ est " +
      "normale ; ce qui inquiète, c'est l'absence de clients satisfaits capables d'en " +
      "parler aux autres.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une coopérative propose une application de vente de récoltes. À quel groupe " +
      "d'adoptants appartient chaque producteur ?",
    categories: ["Premiers adoptants", "Majorité précoce", "Majorité tardive", "Retardataires"],
    elements: [
      {
        texte: "Un jeune producteur, écouté au village, qui l'essaie dès le premier mois.",
        categorie: 0,
        explication: "Il prend le risque tôt et entraîne les autres.",
      },
      {
        texte: "Une productrice qui l'adopte après avoir vu ses voisins vendre mieux.",
        categorie: 1,
        explication: "Elle attend la preuve chez des gens comme elle.",
      },
      {
        texte: "Un producteur qui s'y met parce que l'acheteur n'accepte plus que l'appli.",
        categorie: 2,
        explication: "Il cède à la pression, quand presque tous l'utilisent.",
      },
      {
        texte: "Un ancien qui ne l'utilise que lorsque le marché papier disparaît.",
        categorie: 3,
        explication: "Il n'adopte que faute d'autre choix.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Le forfait par poste plaît aux clients pionniers d'Infosystem, mais les autres " +
      "hésitent. Que faut-il leur apporter en priorité ?",
    choix: [
      {
        texte: "Une nouvelle version du forfait, avec plus d'options.",
        explication: "Plus de complexité freine l'adoption des pragmatiques.",
      },
      {
        texte: "La preuve, chez des PME comme eux, que le forfait tient ses promesses.",
        explication: "Oui : c'est ce qui fait franchir le fossé.",
      },
      {
        texte: "Une baisse de prix immédiate.",
        explication: "Le frein est la confiance, pas d'abord le prix.",
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
        texte: "Les innovateurs représentent environ la moitié des adoptants.",
        vrai: false,
        explication: "Environ 2,5 % seulement, selon Rogers.",
      },
      {
        texte: "Pouvoir essayer sans s'engager accélère l'adoption.",
        vrai: true,
        explication: "C'est l'une des cinq caractéristiques relevées par Rogers.",
      },
      {
        texte: "Ce qui convainc les premiers adoptants convainc aussi la majorité.",
        vrai: false,
        explication: "La majorité veut des preuves et des références, d'où le fossé.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Prenez une innovation de votre plan. Évaluez-la sur les cinq caractéristiques de " +
      "Rogers, puis dites qui seront vos premiers adoptants et comment vous franchirez " +
      "le fossé.",
    corrige: [
      "Les cinq caractéristiques évaluées, avec au moins un point faible reconnu.",
      "Des premiers adoptants nommés, choisis pour leur influence sur les autres.",
      "Une preuve concrète à produire pour les pragmatiques : témoignage, chiffres, essai.",
      "Un calendrier réaliste, qui accepte un démarrage lent.",
    ],
  }),

  appliquez(
    7,
    "Pour chaque innovation retenue à l'étape 7, notez dans le commentaire les premiers " +
      "clients visés et la preuve qui convaincra les suivants.",
  ),
  fiche(
    "Cinq groupes : innovateurs, premiers adoptants, majorités précoce et tardive, " +
      "retardataires.",
    "Cumulée, l'adoption suit une courbe en S.",
    "Le fossé : les pragmatiques veulent des preuves, pas des promesses.",
    "Cinq accélérateurs : avantage, compatibilité, simplicité, essai, visibilité.",
    "Infosystem : forfait lancé chez les clients confiants, avec un essai de trois mois.",
  ),
];
