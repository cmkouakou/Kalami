/**
 * =============================================================
 *  Fichier    : m02-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 2, leçon 2 — « Le PESTEL, sans en faire une liste d'épicerie ».
 *               Sources : livre, module 2 (§ 2.2 l'outil et ses pièges, encadré
 *               Ajinomoto sur les emballages plastiques, § 2.3 PESTEL d'Infosystem) ;
 *               Aguilar, « Scanning the Business Environment », 1967. Texte, exemples et
 *               exercices originaux.
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
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M02_L02: ContenuLecon = [
  p(
    "Un PESTEL de quatre pages, où la guerre en Europe côtoie le prix du carburant et la " +
      "mode des réseaux sociaux, ressemble à un travail sérieux. Il n'aide pourtant personne " +
      "à décider. **L'outil sert à regarder partout, puis à ne garder que ce qui compte.**",
  ),

  titre("Six directions où regarder"),
  definition(
    "PESTEL",
    "Grille d'analyse du macroenvironnement en six dimensions : **P**olitique, " +
      "**É**conomique, **S**ocioculturelle, **T**echnologique, **E**nvironnementale, " +
      "**L**égale. Elle descend d'une grille proposée en 1967 par Francis Aguilar, " +
      "professeur à Harvard.",
  ),
  schema(
    "pestel",
    "Les six dimensions du PESTEL disposées autour de l'entreprise : politique, " +
      "économique, socioculturelle à gauche ; technologique, environnementale et légale " +
      "à droite.",
  ),
  tableau(
    ["Dimension", "Ce qu'on y range", "Exemple en Côte d'Ivoire"],
    [
      [
        "Politique",
        "Priorités, programmes, fiscalité, stabilité",
        "Un plan national de développement",
      ],
      [
        "Économique",
        "Croissance, inflation, taux, change, emploi",
        "Les taux directeurs de la BCEAO",
      ],
      [
        "Socioculturelle",
        "Démographie, modes de vie, formation",
        "Une population très jeune et urbaine",
      ],
      [
        "Technologique",
        "Innovations qui créent ou tuent des marchés",
        "La diffusion du mobile money",
      ],
      [
        "Environnementale",
        "Climat, ressources, attentes écologiques",
        "Des saisons des pluies moins régulières",
      ],
      [
        "Légale",
        "Lois et règlements en vigueur ou adoptés",
        "Une loi sur les données personnelles",
      ],
    ],
  ),
  p(
    "Deux règles évitent bien des hésitations. **Politique ou légal ?** Une orientation ou " +
      "un programme du gouvernement relève du politique ; une loi adoptée ou en vigueur " +
      "relève du légal. **Et l'international ?** Accords commerciaux, droits de douane ou " +
      "tensions entre pays n'ont pas de case à eux : on les range selon leur nature, le " +
      "plus souvent en politique ou en économique.",
  ),

  titre("Trois pièges qui transforment l'outil en liste d'épicerie"),
  liste(
    "**Le fourre-tout** : tout mettre, au même niveau. Mieux vaut quelques facteurs par " +
      "dimension, retenus parce qu'ils touchent vraiment l'entreprise.",
    "**Le constat figé** : « le chômage est de 5 % » est une photo. « Le marché du travail " +
      "en informatique se resserre depuis plusieurs années » est une tendance, et c'est " +
      "elle qui compte pour la stratégie.",
    "**L'arrêt au constat** : le plus courant. Chaque facteur doit être suivi de sa " +
      "conséquence pour l'entreprise, et qualifié d'opportunité, de menace, ou des deux.",
  ),
  retenir("Chaque ligne d'un PESTEL répond à trois questions.", [
    "Quelle tendance observe-t-on ?",
    "Qu'est-ce que ça change chez nous, concrètement ?",
    "Est-ce une opportunité, une menace, ou les deux ?",
  ]),

  titre("Quand une loi remonte toute la chaîne"),
  terrain(
    "Un film plastique et trois dimensions",
    "À l'usine d'Ajinomoto à Abidjan, l'emballage reposait sur un film plastique importé " +
      "du Japon. Quand le gouvernement ivoirien a adopté des règles contre les déchets " +
      "plastiques, cet approvisionnement est devenu plus compliqué et plus cher. Il a " +
      "fallu trouver un fournisseur local d'emballages conformes, puis réajuster les " +
      "machines de conditionnement, car le nouveau film ne se comportait pas comme " +
      "l'ancien. Un seul facteur touchait trois dimensions : **environnementale** par son " +
      "origine, **légale** par sa forme, **économique** par ses coûts. Et ses effets sont " +
      "descendus jusqu'au réglage des machines. La vraie question d'un PESTEL est toujours : " +
      "qu'est-ce que ça change chez nous ?",
  ),

  titre("Un extrait du PESTEL d'Infosystem"),
  tableau(
    ["", "Facteur", "Effet sur Infosystem", "O / M"],
    [
      [
        "P",
        "Priorité publique à la cybersécurité",
        "Les PME sont incitées à investir dans leur sécurité",
        "O",
      ],
      [
        "E",
        "Pénurie de main-d'œuvre en informatique",
        "Recrutement difficile, surenchère salariale : la racine du roulement",
        "M",
      ],
      [
        "S",
        "Généralisation du travail hybride",
        "Plus d'appareils et d'accès à distance à gérer et à sécuriser",
        "O",
      ],
      [
        "T",
        "Intelligence artificielle dans le soutien",
        "Le soutien de base s'automatise ; nouveau besoin de conseil",
        "M / O",
      ],
      [
        "E",
        "Recyclage des équipements en fin de vie",
        "Obligation pour les clients, service possible à leur offrir",
        "M / O",
      ],
      [
        "L",
        "Loi 25 sur les renseignements personnels",
        "Infosystem doit être conforme, et peut vendre de l'accompagnement",
        "M / O",
      ],
    ],
    "Plusieurs facteurs sont à double tranchant : ils menacent une activité et en ouvrent " +
      "une autre.",
  ),
  piege(
    "Croire qu'un PESTEL se fait une fois pour toutes. Dans la première édition du livre, " +
      "l'intelligence artificielle n'était qu'une ligne parmi d'autres ; elle est devenue " +
      "l'un des facteurs les plus déterminants pour tout le soutien informatique. Un " +
      "PESTEL vieillit vite : refaites-le au moins une fois par an.",
  ),
  notion(
    "Pour aller plus loin : où trouver l'information en Afrique de l'Ouest",
    liste(
      "**BCEAO** : politique monétaire, taux directeurs, statistiques financières de " +
        "l'UEMOA.",
      "**Instituts nationaux de la statistique** (en Côte d'Ivoire, l'INS) : population, " +
        "prix, emploi, enquêtes auprès des ménages.",
      "**Commission de l'UEMOA** : règles communes, fiscalité, échanges entre États " +
        "membres.",
      "**Banque mondiale, FMI, Banque africaine de développement** : données comparables " +
        "entre pays, gratuites et mises à jour.",
      "**Journaux officiels et ministères** : lois adoptées et projets de loi, pour la " +
        "dimension légale.",
    ),
    p(
      "Au Québec et au Canada, les équivalents sont Statistique Canada, l'Institut de la " +
        "statistique du Québec et la Banque du Canada.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Rangez chaque facteur dans sa dimension du PESTEL.",
    categories: [
      "Politique",
      "Économique",
      "Socioculturel",
      "Technologique",
      "Environnemental",
      "Légal",
    ],
    elements: [
      {
        texte: "Le gouvernement annonce un programme d'aide aux PME qui se numérisent.",
        categorie: 0,
        explication: "Un programme ou une orientation, pas encore une obligation : politique.",
      },
      {
        texte: "La BCEAO relève ses taux directeurs.",
        categorie: 1,
        explication: "Le coût du crédit est un facteur économique.",
      },
      {
        texte: "Les jeunes urbains achètent de plus en plus en ligne.",
        categorie: 2,
        explication: "Un changement de mode de vie et de consommation.",
      },
      {
        texte: "Le paiement par téléphone se généralise dans les marchés.",
        categorie: 3,
        explication: "Une innovation qui transforme les usages et les marchés.",
      },
      {
        texte: "Les sécheresses répétées réduisent les rendements agricoles du nord.",
        categorie: 4,
        explication: "Climat et ressources naturelles.",
      },
      {
        texte: "Une loi impose de déclarer tout fichier de données clients.",
        categorie: 5,
        explication: "Une loi adoptée : c'est légal, même si l'impulsion était politique.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Laquelle de ces lignes de PESTEL est la mieux rédigée ?",
    choix: [
      {
        texte: "Inflation : 4 %.",
        explication: "Un constat figé, sans tendance ni conséquence.",
      },
      {
        texte: "Technologie : beaucoup de changements.",
        explication: "Trop vague pour décider quoi que ce soit.",
      },
      {
        texte:
          "Les clients paient de plus en plus par mobile money : il faut l'accepter " +
          "sous peine de perdre les jeunes acheteurs (menace) ; c'est aussi un moyen " +
          "d'être payé plus vite (opportunité).",
        explication: "Oui : une tendance, sa conséquence concrète, et sa qualification.",
      },
    ],
    bonne: 2,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Un bon PESTEL compte le plus grand nombre de facteurs possible.",
        vrai: false,
        explication: "On regarde partout, puis on ne garde que ce qui touche l'entreprise.",
      },
      {
        texte: "Un même facteur peut toucher plusieurs dimensions à la fois.",
        vrai: true,
        explication:
          "Comme la règle sur les plastiques : environnementale, légale et économique.",
      },
      {
        texte: "Un même facteur peut être une menace et une opportunité.",
        vrai: true,
        explication: "La Loi 25 oblige Infosystem à se conformer, mais lui ouvre un marché.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Quel facteur ajouteriez-vous au PESTEL d'Infosystem ? Précisez sa dimension, son " +
      "effet probable et s'il s'agit d'une opportunité ou d'une menace.",
    corrige: [
      "Un facteur absent de l'extrait, par exemple la hausse des taux d'intérêt " +
        "(économique), le vieillissement de la population active (socioculturel) ou la " +
        "multiplication des cyberattaques (technologique).",
      "Son effet concret : par exemple, des PME qui reportent leurs projets quand le " +
        "crédit coûte plus cher, ou qui cherchent de l'aide après une attaque.",
      "Sa qualification (O, M ou les deux), justifiée en une phrase.",
    ],
  }),

  appliquez(
    1,
    "Dans l'étape 1 de votre étude, saisissez au moins un facteur par dimension, avec son " +
      "effet sur votre organisation et sa source. Qualifiez chacun d'opportunité, de " +
      "menace ou des deux.",
  ),
  fiche(
    "Six dimensions : politique, économique, socioculturelle, technologique, " +
      "environnementale, légale.",
    "Programme gouvernemental : politique ; loi adoptée : légal.",
    "Chaque ligne : une tendance, sa conséquence chez nous, O ou M.",
    "Peu de facteurs, bien choisis ; un PESTEL se refait chaque année.",
  ),
];
