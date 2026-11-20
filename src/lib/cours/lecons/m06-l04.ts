/**
 * =============================================================
 *  Fichier    : m06-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 6, leçon 4 — « Culture organisationnelle et dérive stratégique » :
 *               définition, trois niveaux de la culture, la toile culturelle, la culture
 *               comme avantage ou comme frein, la dérive stratégique et ses quatre phases,
 *               la culture d'Infosystem. Sources : programme HEC MNGT30490, module 6 (pour
 *               le périmètre) ; Schein, 1985 ; Johnson, 1988 et 1992. Texte, exemples et
 *               exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
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

export const M06_L04: ContenuLecon = [
  p(
    "Une stratégie est mise en œuvre par des personnes, avec leurs habitudes, leurs " +
      "croyances et leurs fiertés. Si la stratégie va contre ces habitudes, elle a peu de " +
      "chances de réussir, même brillante sur papier. La culture est la dernière partie " +
      "prenante, et la plus discrète.",
  ),

  definition(
    "Culture organisationnelle",
    "L'ensemble des valeurs, des croyances implicites et des comportements partagés par " +
      "les membres d'une organisation, qui se voient dans sa manière de faire. Ce qu'on " +
      "fait « naturellement » ici, sans que personne ne l'ait écrit.",
  ),

  titre("Trois niveaux, du visible à l'invisible"),
  tableau(
    ["Niveau", "Ce qu'on y trouve", "Exemple"],
    [
      [
        "Ce qui se voit",
        "Locaux, tenues, horaires, rituels, vocabulaire",
        "Tout le monde se tutoie ; le patron mange avec l'équipe",
      ],
      [
        "Ce qui se dit",
        "Valeurs affichées, règles, discours des dirigeants",
        "« Le client d'abord » sur le mur de l'accueil",
      ],
      [
        "Ce qui va de soi",
        "Croyances que personne ne discute plus",
        "« Un bon technicien n'a pas besoin de documentation »",
      ],
    ],
    "D'après les trois niveaux d'Edgar Schein (1985).",
  ),
  p(
    "Le niveau le plus profond est le plus puissant : ce sont ces évidences qui guident " +
      "les gestes quand personne ne regarde. Et ce sont les plus difficiles à changer, " +
      "parce qu'on ne les voit plus.",
  ),

  titre("La toile culturelle"),
  p(
    "Pour décrire une culture concrètement, Gerry Johnson a proposé en 1992 la **toile " +
      "culturelle**. Au centre, le **paradigme** : les croyances qui vont de soi. Autour, " +
      "six éléments qui l'expriment et le renforcent :",
  ),
  liste(
    "**Les récits** : les histoires qu'on raconte aux nouveaux (les héros, les échecs).",
    "**Les symboles** : les titres, les bureaux, les voitures de fonction, le langage.",
    "**Les rituels et routines** : ce qu'on fait toujours de la même façon.",
    "**Les structures de pouvoir** : qui a vraiment de l'influence.",
    "**La structure** : l'organigramme, formel ou réel.",
    "**Les systèmes de contrôle** : ce qu'on mesure et récompense.",
  ),
  retenir(
    "Pour connaître la vraie culture d'une organisation, regardez ce qu'elle **récompense** " +
      "et les histoires qu'elle **raconte**, plutôt que les valeurs qu'elle affiche.",
  ),

  titre("Un avantage ou un frein"),
  p(
    "Une culture forte peut être la source d'un avantage difficile à imiter : on peut " +
      "copier un produit, pas des années d'habitudes partagées (c'est la complexité sociale " +
      "du VRIO, module 4). Mais la même culture devient un frein quand l'environnement " +
      "change et qu'elle ne suit pas. Elle compte aussi beaucoup lors d'une fusion ou d'un " +
      "rachat : deux cultures incompatibles font échouer bien des acquisitions.",
  ),

  titre("La dérive stratégique"),
  definition(
    "Dérive stratégique",
    "L'écart qui se creuse peu à peu entre la stratégie d'une entreprise et son " +
      "environnement, parce que l'entreprise ne change que par petites touches, à " +
      "l'intérieur de sa culture, pendant que le monde change plus vite. Gerry Johnson l'a " +
      "décrite en 1988.",
  ),
  schema(
    "derive-strategique",
    "Deux courbes dans le temps : l'environnement change de façon continue, la stratégie " +
      "par petites marches. L'écart grandit (dérive), l'entreprise hésite (flottement), " +
      "puis elle se transforme ou disparaît.",
  ),
  etapes(
    "**Changements progressifs** : l'entreprise s'ajuste par petites touches ; tout " +
      "semble aller bien.",
    "**Dérive** : l'environnement accélère, les ajustements ne suffisent plus, mais les " +
      "résultats restent corrects et masquent l'écart.",
    "**Flottement** : les résultats baissent ; on débat, on hésite, on change de direction " +
      "sans conviction.",
    "**Transformation ou disparition** : un changement profond, souvent tardif et " +
      "douloureux, ou la fin.",
  ),
  piege(
    "Croire que de bons résultats protègent de la dérive. C'est justement pendant la " +
      "dérive que tout semble aller bien : les résultats sont le dernier indicateur à " +
      "bouger.",
  ),

  titre("La culture d'Infosystem"),
  p(
    "Une lecture rapide de la toile d'Infosystem fait apparaître un paradigme : **« notre " +
      "force, c'est la relation et le dépannage rapide »**. Les récits célèbrent le " +
      "technicien qui a sauvé un client un dimanche soir ; le pouvoir est entre les mains " +
      "de Justin et des deux seniors ; ce qu'on récompense, c'est la rapidité, pas la " +
      "documentation.",
  ),
  p(
    "Cette culture a fait le succès d'Infosystem. Mais elle ressemble aux débuts d'une " +
      "dérive : le soutien de base perd de sa valeur, et le savoir reste dans les têtes. " +
      "Changer de positionnement demandera de changer aussi ce qu'on raconte et ce qu'on " +
      "récompense : célébrer le technicien qui a documenté un client, pas seulement celui " +
      "qui l'a dépanné.",
  ),
  notion(
    "Pour aller plus loin : la culture « mange » la stratégie",
    p(
      "Une formule souvent attribuée à Peter Drucker, et reprise par bien des dirigeants, " +
        "dit que « la culture mange la stratégie au petit déjeuner ». L'idée n'est pas " +
        "que la stratégie est inutile, mais qu'elle ne " +
        "se réalise qu'à travers la culture. Penser la stratégie sans elle augmente les " +
        "risques d'échec.",
    ),
    p(
      "Une grande organisation a souvent **plusieurs cultures** : selon les pays, les " +
        "régions, les métiers ou les services. Les ventes et l'usine, par exemple, voient " +
        "rarement le monde de la même façon.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une banque régionale décrit sa culture. Rangez chaque observation dans l'élément de " +
      "la toile culturelle qui lui correspond.",
    categories: ["Récits", "Symboles", "Rituels et routines", "Systèmes de contrôle"],
    elements: [
      {
        texte: "On raconte encore comment le fondateur a ouvert la première agence avec trois " +
          "employés.",
        categorie: 0,
        explication: "Une histoire transmise aux nouveaux.",
      },
      {
        texte: "Les directeurs ont un bureau au dernier étage et une place de parking réservée.",
        categorie: 1,
        explication: "Des signes visibles du statut.",
      },
      {
        texte: "Chaque lundi, le comité se réunit à 8 h pour revoir les chiffres de la semaine.",
        categorie: 2,
        explication: "Une habitude répétée, qui dit ce qui compte.",
      },
      {
        texte: "Les primes dépendent uniquement du volume de crédits accordés.",
        categorie: 3,
        explication: "Ce qu'on mesure et récompense oriente les comportements.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pendant dix ans, un fabricant de téléphones fixes a amélioré ses appareils chaque " +
      "année, et ses ventes restaient correctes. Puis le mobile a tout emporté. Dans quelle " +
      "phase était-il pendant ces dix ans ?",
    choix: [
      {
        texte: "Le flottement.",
        explication: "Le flottement vient quand les résultats baissent et qu'on hésite.",
      },
      {
        texte: "La dérive.",
        explication:
          "Oui : des ajustements par petites touches, des résultats qui masquent l'écart.",
      },
      {
        texte: "La transformation.",
        explication: "Il n'a pas changé en profondeur : il a amélioré le même produit.",
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
        texte: "Les valeurs affichées au mur décrivent fidèlement la culture.",
        vrai: false,
        explication: "Ce qu'on récompense et raconte en dit plus que ce qu'on affiche.",
      },
      {
        texte: "Une culture forte peut être une source d'avantage concurrentiel.",
        vrai: true,
        explication: "Des habitudes partagées depuis des années sont difficiles à imiter.",
      },
      {
        texte: "La dérive stratégique se repère d'abord dans les résultats financiers.",
        vrai: false,
        explication: "Les résultats sont le dernier indicateur à bouger.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Décrivez la culture de votre organisation avec la toile culturelle (au moins quatre " +
      "éléments), puis formulez son paradigme en une phrase. Est-il en phase avec vos " +
      "enjeux ?",
    corrige: [
      "Des observations concrètes : un récit, un symbole, un rituel, un critère de récompense.",
      "Un paradigme formulé comme une évidence partagée (« ici, on… »).",
      "Une comparaison avec les enjeux du module 5 : la culture aide-t-elle ou freine-t-elle ?",
      "Un signe de dérive éventuel, et un geste qui commencerait à changer ce qui est " +
        "récompensé ou raconté.",
    ],
  }),

  appliquez(
    4,
    "Terminez l'étape 4 par une courte description de votre culture : ce qu'elle " +
      "récompense, ce qu'elle raconte, et en quoi elle aidera ou freinera votre stratégie.",
  ),
  fiche(
    "La culture : valeurs, croyances et comportements partagés, souvent implicites.",
    "Trois niveaux : ce qui se voit, ce qui se dit, ce qui va de soi.",
    "La toile culturelle : récits, symboles, rituels, pouvoir, structure, contrôle.",
    "Une culture forte est un avantage, jusqu'à ce que l'environnement change.",
    "Dérive stratégique : petites touches, dérive, flottement, transformation ou fin.",
  ),
];
