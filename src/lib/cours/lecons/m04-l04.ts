/**
 * =============================================================
 *  Fichier    : m04-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 4, leçon 4 — « Lire la santé financière : cinq ratios qui
 *               comptent » : liquidité générale, autonomie financière, marge nette,
 *               rentabilité des capitaux propres, rotation de l'actif ; comparer dans le
 *               temps et avec l'industrie. Sources : notions de base d'analyse financière
 *               (programme HEC MNGT30490, module 4, pour le périmètre) ; présentation des
 *               états selon le SYSCOHADA. Exemple chiffré fictif ; texte et exercices
 *               originaux.
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

export const M04_L04: ContenuLecon = [
  p(
    "Une stratégie qui ignore les finances de l'entreprise est un rêve. Avant de décider " +
      "où aller, il faut savoir si l'entreprise peut payer ses dettes, si elle gagne de " +
      "l'argent et si elle utilise bien ce qu'elle possède. Cinq ratios suffisent pour une " +
      "première lecture.",
  ),

  definition(
    "Ratio financier",
    "Un rapport entre deux montants tirés des états financiers (bilan, compte de " +
      "résultat). Seul, un montant dit peu ; rapporté à un autre, il permet de comparer une " +
      "entreprise à elle-même dans le temps et à ses concurrents.",
  ),

  titre("Un exemple pour s'exercer"),
  p(
    "La Quincaillerie du Centre, entreprise **fictive** de Yamoussoukro, présente les " +
      "chiffres suivants pour son dernier exercice, en millions de francs CFA :",
  ),
  tableau(
    ["Poste", "Montant (M FCFA)"],
    [
      ["Chiffre d'affaires", "800"],
      ["Résultat net (après impôt)", "32"],
      ["Total de l'actif (= total du passif)", "500"],
      ["Capitaux propres", "200"],
      ["Actif à court terme (stocks, créances, trésorerie)", "240"],
      ["Passif à court terme (fournisseurs, dettes à moins d'un an)", "160"],
    ],
  ),

  titre("Les cinq ratios"),
  tableau(
    ["Ratio", "Calcul", "Quincaillerie", "Question à laquelle il répond"],
    [
      [
        "Liquidité générale",
        "Actif à court terme ÷ passif à court terme",
        "240 ÷ 160 = 1,5",
        "Peut-elle payer ses dettes de l'année ?",
      ],
      [
        "Autonomie financière",
        "Capitaux propres ÷ total du passif",
        "200 ÷ 500 = 40 %",
        "Qui finance l'entreprise : ses propriétaires ou ses créanciers ?",
      ],
      [
        "Marge nette",
        "Résultat net ÷ chiffre d'affaires",
        "32 ÷ 800 = 4 %",
        "Combien reste-t-il sur 100 FCFA vendus ?",
      ],
      [
        "Rentabilité des capitaux propres",
        "Résultat net ÷ capitaux propres",
        "32 ÷ 200 = 16 %",
        "Que rapporte l'argent des propriétaires ?",
      ],
      [
        "Rotation de l'actif",
        "Chiffre d'affaires ÷ total de l'actif",
        "800 ÷ 500 = 1,6",
        "Combien de ventes chaque franc investi génère-t-il ?",
      ],
    ],
  ),
  liste(
    "**Liquidité générale à 1,5** : les actifs qui deviendront de l'argent dans l'année " +
      "couvrent une fois et demie les dettes de l'année. Rassurant, à condition que les " +
      "stocks se vendent vraiment.",
    "**Autonomie à 40 %** : les propriétaires financent 40 % de l'entreprise, les " +
      "créanciers 60 %. Une marge de manœuvre réelle, mais limitée pour emprunter davantage.",
    "**Marge nette à 4 %** : faible, mais habituelle dans le négoce, où l'on vend beaucoup " +
      "avec peu de marge.",
    "**Rentabilité des capitaux propres à 16 %** : les propriétaires sont bien rémunérés, " +
      "en partie grâce à l'endettement.",
    "**Rotation à 1,6** : l'entreprise fait tourner ses actifs, ce qui compense sa faible marge.",
  ),
  retenir("La rentabilité naît de deux leviers : marger ou faire tourner.", [
    "Une bijouterie marge beaucoup mais vend peu souvent.",
    "Une quincaillerie marge peu mais fait tourner ses stocks.",
    "Deux stratégies différentes peuvent mener à la même rentabilité.",
  ]),

  titre("Un ratio ne s'interprète jamais seul"),
  p("Un chiffre isolé ne dit presque rien. Il prend son sens par comparaison :"),
  liste(
    "**Dans le temps** : une marge qui passe de 7 % à 4 % en trois ans raconte une " +
      "histoire, même si 4 % est normal dans le secteur.",
    "**Avec l'industrie** : une liquidité de 1,2 est confortable pour un supermarché, qui " +
      "encaisse comptant, et serrée pour un constructeur qui attend ses paiements des mois.",
    "**Avec les autres ratios** : une forte rentabilité des capitaux propres obtenue par un " +
      "endettement très élevé n'a pas la même solidité qu'une rentabilité tirée des marges.",
  ),
  piege(
    "Prendre le mauvais exercice ou la mauvaise unité. Les états financiers présentent " +
      "côte à côte l'exercice en cours et le précédent, et les montants sont souvent " +
      "exprimés en milliers ou en millions. Vérifiez la colonne et l'unité avant tout calcul.",
  ),

  titre("Du chiffre à la stratégie"),
  p(
    "Les ratios ne sont pas une fin : ils alimentent l'analyse interne. Une liquidité " +
      "tendue est une **faiblesse** qui limite les options (impossible de financer une " +
      "expansion sans nouvel apport). Une autonomie élevée est une **force** qui permet " +
      "d'emprunter pour saisir une opportunité. Chaque ratio doit donc se traduire en " +
      "phrase : « que permet-il, ou qu'interdit-il, à notre stratégie ? »",
  ),
  notion(
    "Pour aller plus loin : trois ratios complémentaires",
    tableau(
      ["Ratio", "Calcul", "Utile pour"],
      [
        [
          "Liquidité immédiate",
          "Trésorerie ÷ passif à court terme",
          "Les entreprises aux stocks lents",
        ],
        [
          "Couverture des intérêts",
          "Résultat d'exploitation ÷ charges d'intérêts",
          "Juger le poids de la dette",
        ],
        ["Rotation des stocks", "Coût des ventes ÷ stock moyen", "Le commerce et l'industrie"],
      ],
    ),
    p(
      "Pour une banque, la lecture est différente : on suit plutôt le produit net bancaire, " +
        "le coefficient d'exploitation et le rapport entre crédits et dépôts.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Une boulangerie a un chiffre d'affaires de 150 millions FCFA et un résultat net de " +
      "9 millions FCFA. Quelle est sa marge nette ?",
    choix: [
      {
        texte: "6 %",
        explication: "Oui : 9 ÷ 150 = 0,06, soit 6 FCFA de bénéfice pour 100 FCFA vendus.",
      },
      {
        texte: "16,7 %",
        explication: "C'est 150 ÷ 9 ÷ 100 : le calcul est inversé.",
      },
      {
        texte: "9 %",
        explication: "Le résultat net en millions n'est pas un pourcentage.",
      },
    ],
    bonne: 0,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne: "À quelle question chaque ratio répond-il ?",
    categories: [
      "Solvabilité à court terme",
      "Structure de financement",
      "Rentabilité",
      "Efficacité",
    ],
    elements: [
      {
        texte: "Liquidité générale",
        categorie: 0,
        explication: "Elle compare ce qui rentrera et ce qui sortira dans l'année.",
      },
      {
        texte: "Autonomie financière",
        categorie: 1,
        explication: "Elle dit qui finance l'entreprise.",
      },
      {
        texte: "Rentabilité des capitaux propres",
        categorie: 2,
        explication: "Elle mesure ce que rapporte l'argent des propriétaires.",
      },
      {
        texte: "Rotation de l'actif",
        categorie: 3,
        explication: "Elle mesure les ventes générées par chaque franc investi.",
      },
      {
        texte: "Marge nette",
        categorie: 2,
        explication: "Elle mesure le bénéfice sur chaque franc vendu.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Une marge nette de 3 % est forcément le signe d'une entreprise en difficulté.",
        vrai: false,
        explication:
          "Dans le négoce, c'est courant ; tout dépend de la rotation et de l'industrie.",
      },
      {
        texte: "Une liquidité générale inférieure à 1 mérite toujours une explication.",
        vrai: true,
        explication: "Les dettes de l'année dépassent les actifs qui deviendront de l'argent.",
      },
      {
        texte: "Une forte rentabilité des capitaux propres peut venir d'un endettement élevé.",
        vrai: true,
        explication:
          "Moins les propriétaires apportent, plus le même bénéfice leur rapporte, et plus le " +
          "risque monte.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "La marge nette de la Quincaillerie du Centre est passée de 7 % à 4 % en trois ans, " +
      "pendant que sa liquidité restait stable. Proposez deux explications possibles et " +
      "dites quelle information supplémentaire vous permettrait de trancher.",
    corrige: [
      "Une pression sur les prix (nouveaux concurrents, guerre des prix dans une industrie " +
        "mûre) qui réduit la marge.",
      "Une hausse des coûts non répercutée : prix d'achat, loyers, salaires, transport.",
      "Pour trancher : la marge brute (prix de vente moins coût d'achat) et les charges " +
        "d'exploitation sur les trois années, comparées à celles d'autres quincailleries.",
      "Le lien avec les leçons précédentes : relier l'évolution d'un ratio à une force " +
        "de l'industrie ou à une activité de la chaîne de valeur.",
    ],
  }),

  appliquez(
    3,
    "Calculez les cinq ratios sur deux ou trois exercices, puis notez dans l'étape 3, à " +
      "l'activité d'infrastructure (finances), ce qu'ils révèlent : force ou point à " +
      "renforcer.",
  ),
  fiche(
    "Liquidité générale : actif à court terme ÷ passif à court terme.",
    "Autonomie financière : capitaux propres ÷ total du passif.",
    "Marge nette : résultat net ÷ chiffre d'affaires.",
    "Rentabilité des capitaux propres : résultat net ÷ capitaux propres.",
    "Rotation de l'actif : chiffre d'affaires ÷ total de l'actif.",
    "Un ratio se compare : dans le temps, avec l'industrie, avec les autres ratios.",
  ),
];
