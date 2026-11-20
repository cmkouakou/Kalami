/**
 * =============================================================
 *  Fichier    : m02-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 2, leçon 4 — « Construire des scénarios » : croiser deux
 *               variables pivots, raconter quatre futurs, repérer les actions robustes.
 *               Sources : livre, module 2 (§ 2.5 les quatre scénarios d'Infosystem,
 *               question sur l'embauche de trois techniciens) ; Schwartz, « The Art of the
 *               Long View », 1991. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
  etapes,
  exercice,
  fiche,
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

export const M02_L04: ContenuLecon = [
  p(
    "Justin hésite : faut-il embaucher trois techniciens cette année ? Si la demande des " +
      "PME explose, ce sera la meilleure décision de sa carrière. Si elle s'effondre, ce " +
      "sera un fardeau. **Il ne peut pas savoir lequel des deux arrivera. Il peut, en " +
      "revanche, vérifier si sa décision tient dans les deux cas.**",
  ),

  titre("Plusieurs futurs plutôt qu'une prévision"),
  definition(
    "Scénario",
    "Le récit d'un **futur plausible**, construit à partir d'hypothèses contrastées sur " +
      "les variables pivots. Un scénario n'est pas une prédiction : c'est un terrain " +
      "d'essai pour la stratégie.",
  ),
  p(
    "La méthode, popularisée notamment par Peter Schwartz dans *The Art of the Long View* " +
      "(1991), renonce à deviner l'avenir. Elle imagine plusieurs futurs, puis pose une " +
      "seule question : **notre stratégie tient-elle dans chacun d'eux ?**",
  ),

  titre("La méthode en cinq étapes"),
  etapes(
    "**Choisir deux variables pivots**, issues de la grille impact-incertitude.",
    "**Fixer deux pôles pour chacune** : une hypothèse basse et une hypothèse haute, " +
      "toutes deux plausibles.",
    "**Croiser les deux axes** : on obtient quatre cases, donc quatre futurs.",
    "**Nommer et raconter chaque futur** en quelques lignes : un nom parlant se retient " +
      "mieux qu'une case « haut-gauche ».",
    "**Tester la stratégie** dans chaque futur : quelles actions sont payantes partout, " +
      "lesquelles ne le sont que dans certains cas ?",
  ),

  titre("Les quatre futurs d'Infosystem"),
  p(
    "Les deux variables pivots d'Infosystem sont l'évolution de la demande des PME et la " +
      "vitesse à laquelle l'IA transformera le soutien informatique. Croisées, elles " +
      "dessinent quatre futurs.",
  ),
  schema(
    "scenarios",
    "Matrice de quatre scénarios : demande des PME (faible ou forte) en vertical, vitesse " +
      "de l'IA (lente ou rapide) en horizontal. Demande forte et IA lente : goulot " +
      "d'étranglement. Demande forte et IA rapide : course à l'expertise. Demande faible " +
      "et IA lente : statu quo difficile. Demande faible et IA rapide : compression.",
  ),
  tableau(
    ["Scénario", "Ce qui se passe", "Priorité"],
    [
      [
        "Goulot d'étranglement",
        "Les demandes affluent, l'équipe ne suffit pas : la situation actuelle, en plus aigu",
        "Garder et faire grandir les techniciens",
      ],
      [
        "Course à l'expertise",
        "L'IA absorbe le soutien de base ; les clients ont besoin d'aide pour la sécurité, " +
          "le nuage et les nouveaux outils",
        "Monter en compétence plus vite que les autres",
      ],
      [
        "Statu quo difficile",
        "Le marché ralentit sans vraiment se transformer",
        "Conserver ses clients, travailler plus efficacement",
      ],
      [
        "Compression",
        "Moins de demandes et un soutien de base qui se vend de moins en moins",
        "Se replier sur une niche à forte valeur (sécurité, conformité)",
      ],
    ],
  ),

  titre("Actions robustes et paris"),
  p(
    "L'intérêt de l'exercice apparaît quand on compare les quatre cases. Certaines " +
      "actions ont du sens **quel que soit le futur** : réduire le roulement des " +
      "techniciens, développer leurs compétences en cybersécurité et en infonuagique, " +
      "bâtir une offre d'accompagnement à la conformité. Ce sont des **actions robustes** : " +
      "Justin peut les lancer sans attendre.",
  ),
  p(
    "D'autres ne sont payantes que dans certains futurs : embaucher massivement, ou se " +
      "replier sur une niche. Ce sont des **paris**. Ils peuvent attendre que les signaux " +
      "se précisent, à condition de savoir **quels signaux** surveiller : le carnet de " +
      "commandes des PME, l'adoption des outils d'IA chez les clients.",
  ),
  retenir("Les scénarios trient les décisions.", [
    "Actions robustes : payantes dans tous les futurs, à lancer maintenant.",
    "Paris : payants dans certains futurs, à préparer et à déclencher sur signal.",
    "Une stratégie qui ne tient que dans un seul futur est fragile.",
  ]),
  piege(
    "Construire un scénario optimiste, un pessimiste et un « réaliste » entre les deux. " +
      "Tout le monde choisit alors le réaliste, et l'exercice ne sert à rien. Les " +
      "scénarios doivent être **différents par nature** (des logiques distinctes), pas " +
      "seulement par degré.",
  ),
  notion(
    "Pour aller plus loin : un exemple ouest-africain",
    p(
      "Reprenons l'exportateur fictif de cajou de Bondoukou. Ses deux variables pivots : " +
        "le prix mondial de la noix brute (bas ou haut) et la politique de transformation " +
        "locale (faible ou forte). Quatre futurs en sortent, du « boom de l'export brut » " +
        "(prix haut, politique faible) à la « transformation obligée » (prix bas, politique " +
        "forte). Une action robuste se dégage vite : nouer dès maintenant un partenariat " +
        "avec une usine de transformation locale, utile dans presque tous les cas.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Justin hésite à embaucher trois techniciens de soutien de base dès cette année. " +
      "Dans quels scénarios cette décision est-elle payante ou risquée ?",
    categories: ["Payante", "Risquée"],
    elements: [
      {
        texte: "Goulot d'étranglement",
        categorie: 0,
        explication: "La capacité est justement le problème : l'embauche y répond.",
      },
      {
        texte: "Course à l'expertise",
        categorie: 1,
        explication:
          "Le soutien de base est absorbé par l'IA ; seuls des spécialistes en sécurité " +
          "ou en infonuagique seraient un bon pari.",
      },
      {
        texte: "Statu quo difficile",
        categorie: 1,
        explication: "La demande ne suivrait pas : des salaires sans revenus en face.",
      },
      {
        texte: "Compression",
        categorie: 1,
        explication: "Le pire cas : moins de demandes et un soutien de base qui se vend mal.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Laquelle de ces actions est **robuste** pour Infosystem ?",
    choix: [
      {
        texte: "Doubler l'équipe de soutien de base.",
        explication: "Payante seulement si la demande est forte et l'IA lente : c'est un pari.",
      },
      {
        texte: "Abandonner tous les clients généralistes pour la seule cybersécurité.",
        explication: "Utile dans la compression, risqué ailleurs : c'est un pari.",
      },
      {
        texte: "Réduire le roulement des techniciens et les former à la sécurité et au nuage.",
        explication: "Oui : utile dans les quatre futurs.",
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
        texte: "Un scénario est une prédiction de ce qui va arriver.",
        vrai: false,
        explication: "C'est un futur plausible parmi d'autres, qui sert à tester la stratégie.",
      },
      {
        texte: "Croiser deux variables pivots donne quatre scénarios.",
        vrai: true,
        explication: "Deux pôles par axe, deux axes : quatre cases.",
      },
      {
        texte: "Un pari peut attendre, à condition de savoir quels signaux surveiller.",
        vrai: true,
        explication: "On le prépare, puis on le déclenche quand le futur se précise.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Avec les deux variables pivots de votre organisation, construisez quatre " +
      "scénarios : nommez-les, décrivez chacun en une phrase, puis citez une action robuste.",
    corrige: [
      "Deux variables pivots à fort impact et forte incertitude, chacune avec deux pôles " +
        "plausibles.",
      "Quatre noms parlants et quatre récits courts, de logiques différentes (pas seulement " +
        "« bon » et « mauvais »).",
      "Une action utile dans les quatre futurs, et éventuellement un pari avec le signal " +
        "qui le déclencherait.",
    ],
  }),

  appliquez(
    1,
    "Dans l'étape 1 de votre étude, construisez la matrice des scénarios à partir de vos " +
      "deux variables pivots : un nom et une description pour chacune des quatre cases.",
  ),
  fiche(
    "Un scénario est un futur plausible, pas une prédiction.",
    "Deux variables pivots, deux pôles chacune : quatre futurs.",
    "Actions robustes : à lancer maintenant ; paris : à déclencher sur signal.",
    "Évitez le trio optimiste, pessimiste, réaliste.",
  ),
];
