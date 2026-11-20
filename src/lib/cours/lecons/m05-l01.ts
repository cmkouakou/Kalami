/**
 * =============================================================
 *  Fichier    : m05-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 5, leçon 1 — « Bien remplir une SWOT » : rassembler les pièces du
 *               diagnostic, la frontière interne-externe, trois règles de qualité, la SWOT
 *               d'Infosystem et sa lecture. Sources : livre, module 5 (§ 5.1 à 5.3,
 *               encadré Ajinomoto Afrique de l'Ouest). Texte, exemples et exercices
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
  schema,
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M05_L01: ContenuLecon = [
  p(
    "Les modules 2 à 4 ont produit beaucoup de constats sur Infosystem : des facteurs " +
      "PESTEL, cinq forces, une chaîne de valeur, un VRIO. Chacun éclaire une partie du " +
      "tableau, aucun ne permet de décider seul. Il est temps de **rassembler les pièces** " +
      "sur une seule page.",
  ),

  definition(
    "SWOT (ou FFOM)",
    "Une matrice qui range les constats du diagnostic en quatre cases : **forces** et " +
      "**faiblesses** (analyse interne), **opportunités** et **menaces** (analyse " +
      "externe). L'acronyme vient de l'anglais *Strengths, Weaknesses, Opportunities, " +
      "Threats*.",
  ),
  schema(
    "swot",
    "La matrice SWOT : en haut, l'interne, sur lequel l'entreprise peut agir (forces, " +
      "faiblesses) ; en bas, l'externe, qu'elle ne contrôle pas (opportunités, menaces). " +
      "À gauche ce qui aide, à droite ce qui nuit.",
  ),

  titre("La frontière à ne pas franchir"),
  p(
    "Une règle suffit à éviter la moitié des erreurs : **l'interne, l'entreprise peut " +
      "agir dessus ; l'externe, elle ne le contrôle pas.** Elle peut seulement s'y " +
      "préparer ou en profiter.",
  ),
  piege(
    "Écrire une action dans la case des opportunités. « Ouvrir une succursale à Bouaké » " +
      "ou « signer un partenariat » sont des décisions possibles, pas des constats. " +
      "L'opportunité, c'est le besoin du marché qui rendrait cette décision intéressante : " +
      "« la demande croît à Bouaké et aucun concurrent n'y est installé ».",
  ),

  titre("Trois règles de qualité"),
  liste(
    "**Une force se mesure face aux concurrents.** Une ressource que tous possèdent est " +
      "une ressource seuil (module 4), pas une force.",
    "**Une force doit être perçue par les clients.** Si personne ne la remarque, elle ne " +
      "pèse pas dans leurs choix.",
    "**Chaque élément est précis et sourcé.** « Bonne réputation » ne dit rien ; " +
      "« clients fidèles grâce à la relation, malgré une offre comparable » donne prise à " +
      "l'action. Notez le module d'où vient chaque constat.",
  ),
  retenir(
    "Une bonne SWOT ne s'écrit jamais en premier : elle est la **dernière étape** du " +
      "diagnostic. Un élément qu'on ne peut rattacher à aucune analyse relève de " +
      "l'impression, et doit au moins être vérifié.",
  ),
  terrain(
    "Une SWOT sans fondations",
    "Chez Ajinomoto Afrique de l'Ouest, pendant la réforme de l'organisation commerciale, " +
      "j'ai vu passer plusieurs analyses SWOT. Avec le recul, nous ne nous y prenions pas " +
      "de la bonne façon : on confiait la matrice à un employé pendant qu'un autre " +
      "travaillait à autre chose, sans lien entre les deux. Personne n'avait mené au " +
      "préalable l'analyse du marché, de la concurrence ou de nos ressources. Ces matrices " +
      "contenaient bien quatre listes, car on trouve toujours de quoi remplir quatre " +
      "cases. Mais construites sans fondations, elles servaient surtout à cocher une " +
      "exigence lors des audits de gestion.",
  ),

  titre("La SWOT d'Infosystem"),
  tableau(
    ["Case", "Constats (module d'origine)"],
    [
      [
        "Forces",
        "Expertise des deux seniors (4) ; rapidité d'intervention (4) ; connaissance fine " +
          "des systèmes des clients (4) ; confiance et réputation de Justin (4)",
      ],
      [
        "Faiblesses",
        "Départs fréquents des jeunes techniciens (3, 4) ; dépendance à quelques personnes " +
          "(4) ; savoirs non documentés (4) ; relève de Justin non préparée (1)",
      ],
      [
        "Opportunités",
        "Hausse des cyberattaques et des rançongiciels (2) ; conformité à la Loi 25 (2) ; " +
          "migration des PME vers le nuage (2) ; besoin d'aide pour adopter l'IA (2)",
      ],
      [
        "Menaces",
        "Rivalité des grandes firmes et des indépendants (3) ; substituts : outils " +
          "automatisés et IA pour le soutien de base (3) ; pénurie de techniciens (2, 3)",
      ],
    ],
    "Chaque constat renvoie au module qui l'a établi.",
  ),
  p(
    "Une lecture rapide fait apparaître un portrait. Les forces tiennent toutes à la " +
      "**relation** ; les faiblesses tournent presque toutes autour des **personnes**. Les " +
      "opportunités demandent de l'**expertise**, et les menaces frappent surtout le " +
      "**soutien de base**. Le marché se déplace vers ce qu'Infosystem fait de mieux, à " +
      "condition qu'elle ait les gens pour le faire.",
  ),
  notion(
    "Pour aller plus loin : combien d'éléments par case ?",
    p(
      "Il n'y a pas de règle stricte, mais trois à six éléments par case est un bon " +
        "repère. Au-delà, la matrice devient une liste où l'essentiel se noie. Mieux vaut " +
        "regrouper deux constats proches que les aligner.",
    ),
    p(
      "Une SWOT se fait toujours **par rapport à un domaine d'activité** : une entreprise " +
        "présente dans deux marchés très différents a besoin de deux matrices.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une boulangerie de Ouagadougou prépare sa SWOT. Rangez chaque élément dans la " +
      "bonne case, ou dans « N'a pas sa place ».",
    categories: ["Force", "Faiblesse", "Opportunité", "Menace", "N'a pas sa place"],
    elements: [
      {
        texte: "Son pain est réputé dans tout le quartier comme le plus croustillant.",
        categorie: 0,
        explication: "Interne, rare et perçu par les clients.",
      },
      {
        texte: "Son unique four tombe souvent en panne.",
        categorie: 1,
        explication: "Interne, et la boulangerie peut agir dessus.",
      },
      {
        texte: "Un nouveau lycée de 2 000 élèves ouvre à deux rues.",
        categorie: 2,
        explication: "Externe : un besoin nouveau qu'elle peut saisir.",
      },
      {
        texte: "Le prix de la farine importée augmente.",
        categorie: 3,
        explication: "Externe, et elle ne le contrôle pas.",
      },
      {
        texte: "Lancer la livraison à domicile.",
        categorie: 4,
        explication: "C'est une action possible, pas un constat.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Toutes les agences de transfert d'argent d'une ville acceptent le paiement mobile. " +
      "L'une d'elles l'inscrit comme force dans sa SWOT. Qu'en pensez-vous ?",
    choix: [
      {
        texte: "C'est une force, car le paiement mobile est apprécié des clients.",
        explication: "Apprécié, oui, mais tout le monde l'offre : il ne la distingue pas.",
      },
      {
        texte: "C'est une ressource seuil : nécessaire, mais pas une force.",
        explication: "Oui : une force se mesure face aux concurrents.",
      },
      {
        texte: "C'est une opportunité.",
        explication: "Elle la possède déjà : c'est interne, pas externe.",
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
        texte: "La SWOT est le meilleur point de départ d'un diagnostic.",
        vrai: false,
        explication: "Elle en est l'aboutissement : elle se nourrit des analyses précédentes.",
      },
      {
        texte: "Une même tendance peut être une opportunité et une menace.",
        vrai: true,
        explication:
          "L'IA menace le soutien de base d'Infosystem et ouvre un marché d'accompagnement.",
      },
      {
        texte: "« Bonne gestion » est un élément utile dans une SWOT.",
        vrai: false,
        explication: "Trop vague : il faut un constat précis, appuyé sur une analyse.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Construisez la SWOT de votre organisation (trois à cinq éléments par case). Pour " +
      "chaque élément, indiquez l'analyse dont il provient.",
    corrige: [
      "Forces et faiblesses tirées de l'analyse interne (chaîne de valeur, VRIO, ratios).",
      "Opportunités et menaces tirées du PESTEL et des cinq forces.",
      "Aucune action déguisée en opportunité ; aucune ressource seuil présentée comme force.",
      "Des formulations précises, qui donnent prise à l'action.",
      "Un élément sans source est signalé comme « à vérifier ».",
    ],
  }),

  appliquez(
    5,
    "Dans l'étape 5, reprenez les constats des étapes 1 à 4 et rangez-les dans votre " +
      "matrice SWOT, en notant leur source.",
  ),
  fiche(
    "SWOT : forces et faiblesses (interne), opportunités et menaces (externe).",
    "Interne : l'entreprise peut agir. Externe : elle ne contrôle pas.",
    "Une action n'est jamais une opportunité.",
    "Une force se mesure face aux concurrents et doit être perçue par les clients.",
    "La SWOT est la dernière étape du diagnostic : chaque élément a une source.",
  ),
];
