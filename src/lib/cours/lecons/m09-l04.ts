/**
 * =============================================================
 *  Fichier    : m09-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 9, leçon 4 — « Gérer un portefeuille : la matrice BCG » : les deux
 *               axes, les quatre familles, la circulation de l'argent entre DAS, les
 *               limites de l'outil, pourquoi il dit peu à Infosystem. Sources : livre,
 *               module 8 (§ 8.3, encadré BCG) ; Henderson, 1970. Texte, exemples et
 *               exercices originaux (groupe fictif).
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
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M09_L04: ContenuLecon = [
  p(
    "Un groupe qui possède plusieurs DAS doit répartir chaque année un argent limité. " +
      "Faut-il investir dans l'activité qui rapporte le plus aujourd'hui, ou dans celle " +
      "qui rapportera demain ? En 1970, Bruce Henderson, fondateur du Boston Consulting " +
      "Group, a proposé une grille pour en décider.",
  ),

  titre("Deux axes"),
  definition(
    "Part de marché relative",
    "La part de marché d'un DAS divisée par celle de son principal concurrent. Au-dessus " +
      "de 1, l'entreprise est le leader ; en dessous, elle suit.",
  ),
  p(
    "Le second axe est la **croissance du marché**. Un marché qui croît vite exige des " +
      "investissements pour suivre ; un marché mûr en exige peu. La part de marché, elle, " +
      "est supposée donner des coûts plus bas grâce au volume et à l'expérience accumulée.",
  ),
  schema(
    "bcg",
    "La matrice BCG : la part de marché relative en abscisse, la croissance du marché en " +
      "ordonnée. Forte croissance et faible part : les dilemmes. Forte croissance et forte " +
      "part : les vedettes. Faible croissance et faible part : les poids morts. Faible " +
      "croissance et forte part : les vaches à lait. Attention : la grille d'origine place " +
      "la forte part à gauche.",
  ),

  titre("Quatre familles, quatre traitements"),
  tableau(
    ["Famille", "Situation", "Argent", "Traitement"],
    [
      [
        "Vedette",
        "Leader d'un marché en croissance",
        "Consomme et rapporte",
        "Investir pour tenir",
      ],
      ["Vache à lait", "Leader d'un marché mûr", "Rapporte plus qu'elle ne consomme", "Récolter"],
      ["Dilemme", "Suiveur d'un marché en croissance", "Consomme beaucoup", "Investir ou sortir"],
      ["Poids mort", "Suiveur d'un marché mûr", "Rapporte peu", "Céder ou récolter"],
    ],
  ),
  p(
    "L'idée centrale est la **circulation de l'argent**. Les vaches à lait financent les " +
      "dilemmes les plus prometteurs, pour en faire des vedettes. Quand leur marché " +
      "ralentira, les vedettes deviendront à leur tour des vaches à lait. Un portefeuille " +
      "sain contient des activités à chaque étape de ce cycle.",
  ),
  retenir(
    "La BCG ne dit pas quelle activité est bonne : elle dit où va l'argent. Un groupe sans " +
      "vache à lait manque de financement ; un groupe sans vedette ni dilemme n'a pas " +
      "d'avenir.",
  ),

  titre("Les limites de l'outil"),
  liste(
    "**Deux variables seulement** : la rentabilité, les synergies ou la stratégie de " +
      "différenciation n'apparaissent pas.",
    "**La part de marché ne garantit pas les coûts bas**, surtout dans les services où " +
      "le volume compte moins que la compétence.",
    "**Les étiquettes enferment** : un « poids mort » bien géré peut rester rentable des " +
      "années, et le céder trop tôt détruit de la valeur.",
    "**La définition du marché change tout** : la même activité est vedette sur un marché " +
      "étroit et dilemme sur un marché large.",
  ),
  piege(
    "Utiliser la BCG pour une entreprise à un seul DAS. Infosystem n'a qu'une activité : " +
      "la grille la placerait dans une case, sans rien dire de ce qu'il faut faire. Le bon " +
      "outil dépend toujours de la question posée.",
  ),
  notion(
    "Pour aller plus loin : la matrice McKinsey",
    p(
      "Pour corriger les limites de la BCG, McKinsey et General Electric ont proposé une " +
        "grille en neuf cases. Elle remplace la croissance par l'**attrait du marché** " +
        "(taille, rentabilité, intensité concurrentielle) et la part de marché par la " +
        "**force de l'activité** (marque, coûts, compétences). Plus riche, elle est aussi " +
        "plus subjective.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Un groupe ivoirien fictif possède quatre activités. Placez chacune dans sa famille " +
      "de la matrice BCG.",
    categories: ["Vedette", "Vache à lait", "Dilemme", "Poids mort"],
    grille: {
      axeVertical: ["Croissance du marché", "faible", "forte"],
      axeHorizontal: ["Part de marché relative", "faible", "forte"],
      cases: [2, 0, 3, 1],
    },
    elements: [
      {
        texte: "Leader national du sucre, un marché qui progresse de 1 % par an.",
        categorie: 1,
        explication: "Leader d'un marché mûr : elle finance le reste.",
      },
      {
        texte: "Numéro un du paiement mobile pour les commerçants, un marché qui double tous " +
          "les deux ans.",
        categorie: 0,
        explication: "Leader d'un marché en forte croissance.",
      },
      {
        texte: "Cinquième acteur de l'énergie solaire domestique, un marché en plein essor.",
        categorie: 2,
        explication: "Suiveur d'un marché en croissance : investir fort ou sortir.",
      },
      {
        texte:
          "Petite imprimerie de formulaires papier, loin derrière " +
          "les leaders, marché en déclin.",
        categorie: 3,
        explication: "Suiveur d'un marché qui recule.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Dans le groupe fictif de l'exercice précédent, d'où devrait venir l'argent pour " +
      "développer l'énergie solaire ?",
    choix: [
      {
        texte: "De l'imprimerie, qui doit être relancée.",
        explication: "Un poids mort n'a pas d'argent à donner ; il faut plutôt le céder.",
      },
      {
        texte: "Du sucre, la vache à lait du groupe.",
        explication: "Oui : c'est le rôle de la vache à lait de financer les dilemmes.",
      },
      {
        texte: "Du paiement mobile, qui rapporte le plus.",
        explication: "La vedette consomme encore beaucoup pour suivre la croissance.",
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
        texte: "Une part de marché relative de 0,5 signifie que l'on est le leader.",
        vrai: false,
        explication: "On fait moitié moins que le leader.",
      },
      {
        texte: "La BCG est très utile à une entreprise qui n'a qu'un seul DAS.",
        vrai: false,
        explication: "Elle sert à arbitrer entre plusieurs DAS.",
      },
      {
        texte: "Une vedette d'aujourd'hui devient souvent une vache à lait demain.",
        vrai: true,
        explication: "Quand son marché ralentit, elle consomme moins et rapporte plus.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Choisissez un groupe que vous connaissez (le vôtre, ou un groupe coté à la BRVM). " +
      "Placez ses activités dans la matrice BCG, puis décrivez comment l'argent devrait " +
      "circuler entre elles.",
    corrige: [
      "Des activités qui sont de vrais DAS, avec leur marché défini.",
      "Un placement justifié par la croissance du marché et la position face au leader.",
      "Un sens de circulation clair : des vaches à lait vers les dilemmes choisis.",
      "Au moins une limite de l'outil appliquée au cas.",
    ],
  }),

  appliquez(
    7,
    "Si votre organisation compte plusieurs DAS, placez-les dans une BCG avant de remplir " +
      "l'étape 7 : vos options en découleront. Sinon, passez directement à la matrice " +
      "d'Ansoff.",
  ),
  fiche(
    "Deux axes : croissance du marché et part de marché relative.",
    "Vedettes, vaches à lait, dilemmes, poids morts.",
    "Les vaches à lait financent les dilemmes prometteurs.",
    "Limites : deux variables, des étiquettes qui enferment.",
    "Outil de groupe à plusieurs DAS : il dit peu à Infosystem.",
  ),
];
