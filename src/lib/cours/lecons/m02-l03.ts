/**
 * =============================================================
 *  Fichier    : m02-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 2, leçon 3 — « Des facteurs aux variables pivots » : grille
 *               impact-incertitude, tendances lourdes et variables pivots, réduire les
 *               erreurs de prévision. Sources : livre, module 2 (§ 2.4, Loi 25, les deux
 *               variables pivots d'Infosystem) ; Whittington et coll., « Stratégique »,
 *               2023. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
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

export const M02_L03: ContenuLecon = [
  p(
    "Le PESTEL d'Infosystem compte treize facteurs. Justin ne peut pas bâtir sa stratégie " +
      "en les traitant tous à égalité : il lui faut savoir **lesquels décideront vraiment " +
      "de son avenir**. C'est l'objet de cette leçon : passer d'une liste à une hiérarchie.",
  ),

  titre("Deux questions pour chaque facteur"),
  p(
    "Pour trier les facteurs, on les place selon deux critères. **L'impact** : si ce " +
      "facteur évolue, à quel point cela change-t-il la situation de l'entreprise ? " +
      "**L'incertitude** : sait-on dans quel sens et à quelle vitesse il évoluera ?",
  ),
  schema(
    "impact-incertitude",
    "Grille à deux axes, impact vertical et incertitude horizontale. Impact fort et " +
      "incertitude faible : tendances lourdes. Impact fort et incertitude forte : variables " +
      "pivots. Impact faible : facteurs secondaires ou à surveiller.",
  ),
  definition(
    "Tendance lourde",
    "Un facteur à **fort impact** mais **prévisible**. On sait qu'il arrivera ; il n'y a " +
      "pas de pari à faire, seulement à l'intégrer au plan.",
  ),
  definition(
    "Variable pivot",
    "Un facteur à **fort impact** et **très incertain**. Personne ne peut dire comment il " +
      "évoluera, et pourtant il changera tout. C'est sur ces quelques variables que se " +
      "concentre la réflexion, et que l'on construit les scénarios.",
  ),

  titre("Appliqué à Infosystem"),
  tableau(
    ["Facteur", "Impact", "Incertitude", "Case"],
    [
      ["Loi 25 sur les renseignements personnels", "Fort", "Faible", "Tendance lourde"],
      ["Pénurie de main-d'œuvre en informatique", "Fort", "Faible", "Tendance lourde"],
      ["Évolution de la demande des PME", "Fort", "Forte", "Variable pivot"],
      ["Vitesse de l'IA dans le soutien", "Fort", "Forte", "Variable pivot"],
      ["Utilisateurs plus autonomes", "Faible", "Faible", "Secondaire"],
      ["Recyclage des équipements", "Faible", "Forte", "À surveiller"],
    ],
    "La Loi 25 est en vigueur et ses exigences sont connues : il n'y a pas de scénario à " +
      "imaginer, il faut s'y conformer.",
  ),
  retenir("Deux ou trois variables pivots, pas plus.", [
    "Les tendances lourdes vont directement dans le plan.",
    "Les variables pivots servent à construire les scénarios.",
    "Les facteurs « à surveiller » entrent dans la veille : ils peuvent monter d'une case.",
  ]),
  piege(
    "Classer un facteur comme incertain parce qu'on ne l'a pas étudié. L'incertitude doit " +
      "tenir au facteur lui-même, pas à notre ignorance. Une loi déjà votée n'est pas " +
      "incertaine : il suffit de la lire.",
  ),

  titre("Un exemple près de chez vous"),
  p(
    "Un exportateur fictif de noix de cajou, à Bondoukou, dresse son PESTEL. La " +
      "croissance démographique des villes est forte mais prévisible : tendance lourde. " +
      "Deux facteurs, en revanche, pèsent lourd et restent imprévisibles : **le prix " +
      "mondial de la noix brute**, qui varie fortement d'une campagne à l'autre, et **la " +
      "politique publique de transformation locale**, qui pourrait favoriser les usines du " +
      "pays au détriment de l'exportation brute. Ce sont ses deux variables pivots.",
  ),

  titre("Réduire les erreurs de prévision"),
  p(
    "Personne ne prévoit l'avenir avec certitude, mais certaines erreurs sont évitables. " +
      "Quatre réflexes les limitent :",
  ),
  liste(
    "**Ne pas prolonger la courbe** : supposer que demain ressemblera à hier est le biais " +
      "le plus courant. Demandez-vous ce qui pourrait casser la tendance.",
    "**Raisonner en fourchettes** : « entre 5 et 15 % de croissance » est plus honnête, " +
      "et plus utile, qu'un chiffre unique faussement précis.",
    "**Chercher les signaux faibles** : un projet de loi, une innovation adoptée ailleurs, " +
      "un concurrent étranger qui s'installe annoncent souvent les tendances de demain.",
    "**Confronter les avis** : une seule personne, même experte, voit ce qu'elle a " +
      "l'habitude de voir. Plusieurs regards réduisent les angles morts.",
  ),
  notion(
    "Pour aller plus loin : pourquoi ne pas simplement faire une prévision ?",
    p(
      "Une prévision unique pousse à miser tous ses moyens sur un seul futur. Si elle est " +
        "fausse, la stratégie l'est aussi. La démarche des variables pivots accepte " +
        "l'incertitude au lieu de la cacher : on n'essaie pas de deviner l'avenir, on " +
        "prépare une stratégie qui tienne dans plusieurs avenirs possibles.",
    ),
    p("C'est exactement ce que fait la méthode des scénarios, objet de la leçon suivante."),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Pour une clinique privée d'Abidjan, dans quelle case de la grille placeriez-vous " +
      "chaque facteur ?",
    categories: ["Tendance lourde", "Variable pivot", "À surveiller", "Secondaire"],
    elements: [
      {
        texte:
          "Le vieillissement progressif de la population, qui augmente les maladies " +
          "chroniques.",
        categorie: 0,
        explication: "Fort impact, mais l'évolution démographique est prévisible.",
      },
      {
        texte:
          "Une éventuelle extension de la couverture maladie universelle aux cliniques " +
          "privées, dont ni la forme ni la date ne sont connues.",
        categorie: 1,
        explication:
          "Elle changerait tout le modèle de revenus, et personne ne sait si ni quand.",
      },
      {
        texte: "Une mode naissante de téléconsultation chez quelques jeunes médecins.",
        categorie: 2,
        explication: "Impact encore faible, évolution incertaine : un signal à suivre.",
      },
      {
        texte: "Le changement de couleur réglementaire des blouses du personnel.",
        categorie: 3,
        explication: "Prévisible et sans effet stratégique.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Pourquoi la Loi 25 n'est-elle pas une variable pivot pour Infosystem ?",
    choix: [
      {
        texte: "Parce qu'elle a peu d'impact sur Infosystem.",
        explication: "Au contraire, son impact est fort : responsabilité et nouveau marché.",
      },
      {
        texte:
          "Parce qu'elle est en vigueur et que ses exigences sont connues : son évolution " +
          "n'est pas incertaine.",
        explication: "Oui : fort impact mais faible incertitude, c'est une tendance lourde.",
      },
      {
        texte: "Parce qu'une loi relève du légal et non de l'économique.",
        explication: "La dimension n'a rien à voir avec la case de la grille.",
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
        texte: "Plus on retient de variables pivots, plus l'analyse est solide.",
        vrai: false,
        explication: "Au-delà de deux ou trois, on ne peut plus construire de scénarios lisibles.",
      },
      {
        texte: "Une prévision en fourchette est plus utile qu'un chiffre unique.",
        vrai: true,
        explication: "Elle montre l'incertitude au lieu de la masquer.",
      },
      {
        texte: "Un facteur « à surveiller » peut devenir une variable pivot.",
        vrai: true,
        explication: "Si son impact grandit, il monte d'une case : d'où l'utilité de la veille.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Pour votre propre organisation, choisissez trois facteurs externes et placez-les " +
      "sur la grille. Lequel est une tendance lourde ? Lequel est une variable pivot ? " +
      "Justifiez.",
    corrige: [
      "Trois facteurs précis, rédigés comme des tendances et non comme des constats.",
      "Pour chacun, une justification de l'impact (que change-t-il chez nous ?) et de " +
        "l'incertitude (sait-on comment il évoluera ?).",
      "La tendance lourde va dans le plan ; la variable pivot servira à bâtir les " +
        "scénarios de la leçon suivante.",
    ],
  }),

  appliquez(
    1,
    "Dans l'étape 1 de votre étude, placez chacun de vos facteurs dans la grille " +
      "impact-incertitude. Gardez deux variables pivots.",
  ),
  fiche(
    "Deux critères : impact et incertitude.",
    "Tendance lourde : fort impact, prévisible ; on l'intègre au plan.",
    "Variable pivot : fort impact, incertaine ; on bâtit les scénarios sur elle.",
    "Contre les erreurs de prévision : casser la courbe, fourchettes, signaux faibles, " +
      "avis croisés.",
  ),
];
