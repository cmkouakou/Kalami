/**
 * =============================================================
 *  Fichier    : m05-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 5, leçon 2 — « De la SWOT à l'action : la matrice TOWS » : croiser
 *               les cases, quatre familles de pistes (attaquer, se renforcer, défendre, se
 *               protéger), la TOWS d'Infosystem, repérer les pistes qui servent plusieurs
 *               fins. Sources : livre, module 5 (§ 5.4) ; Weihrich, 1982. Texte, exemples
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
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M05_L02: ContenuLecon = [
  p(
    "Une SWOT qui s'arrête à ses quatre listes reste un constat. Elle dit où en est " +
      "l'entreprise, pas quoi faire. Pour passer du constat aux pistes d'action, il faut " +
      "**croiser les cases** : c'est ce que propose la matrice TOWS.",
  ),

  definition(
    "Matrice TOWS",
    "Un tableau qui croise les éléments internes (forces, faiblesses) avec les éléments " +
      "externes (opportunités, menaces) pour en tirer quatre familles de pistes d'action. " +
      "Heinz Weihrich l'a proposée en 1982.",
  ),
  schema(
    "tows",
    "La matrice TOWS : les forces et les faiblesses en colonnes, les opportunités et les " +
      "menaces en lignes. Forces et opportunités : attaquer. Faiblesses et opportunités : " +
      "se renforcer. Forces et menaces : défendre. Faiblesses et menaces : se protéger.",
  ),

  titre("Quatre questions, quatre familles"),
  tableau(
    ["Croisement", "La question", "Famille"],
    [
      [
        "Forces × Opportunités",
        "Comment utiliser nos forces pour saisir les opportunités ?",
        "Attaquer",
      ],
      [
        "Faiblesses × Opportunités",
        "Quelles faiblesses corriger pour pouvoir saisir les opportunités ?",
        "Se renforcer",
      ],
      [
        "Forces × Menaces",
        "Comment utiliser nos forces pour résister aux menaces ?",
        "Défendre",
      ],
      [
        "Faiblesses × Menaces",
        "Comment éviter que nos faiblesses nous exposent aux menaces ?",
        "Se protéger",
      ],
    ],
  ),
  piege(
    "Remplir chaque case de la TOWS sans la relier à des éléments précis de la SWOT. Une " +
      "bonne piste nomme le croisement qui la justifie : « l'expertise des seniors (force) " +
      "pour répondre à la Loi 25 (opportunité) ». Sans ce lien, la TOWS devient une liste " +
      "de bonnes idées.",
  ),

  titre("La TOWS d'Infosystem"),
  liste(
    "**Attaquer.** La confiance des clients et l'expertise des seniors sont exactement ce " +
      "qu'il faut pour vendre de la cybersécurité et de l'accompagnement à la Loi 25. Pas " +
      "besoin de chercher de nouveaux clients pour commencer : les clients actuels sont " +
      "concernés.",
    "**Se renforcer.** Le marché demande de nouvelles compétences ; les jeunes techniciens " +
      "partent faute de perspectives. Les former à la sécurité et au nuage répond aux deux " +
      "problèmes à la fois.",
    "**Défendre.** Face aux grandes firmes et à l'IA, miser sur ce qu'elles font moins " +
      "bien : la présence, la rapidité, un interlocuteur humain responsable. Le rendre " +
      "visible par des engagements de service écrits et des bilans réguliers.",
    "**Se protéger.** La pénurie rend chaque départ plus coûteux. Documenter les savoirs, " +
      "travailler en binômes et préparer la relève réduisent l'exposition, quelle que soit " +
      "la stratégie retenue ensuite.",
  ),
  retenir(
    "Les meilleures pistes sont celles qui apparaissent **dans plusieurs cases** à la " +
      "fois. Former les jeunes techniciens à la sécurité saisit une opportunité, corrige " +
      "une faiblesse et protège d'une menace : c'est un signal fort.",
  ),
  p(
    "La TOWS ne choisit pas à votre place. Elle produit des **options**, souvent plus " +
      "qu'on ne peut en mener. Le tri viendra plus tard, quand l'entreprise aura fixé son " +
      "cap (module 7) et comparé ses options (module 12).",
  ),
  notion(
    "Pour aller plus loin : un exemple hors de l'informatique",
    p(
      "Une coopérative de karité du nord de la Côte d'Ivoire a pour force un réseau de " +
        "productrices fidèles, pour faiblesse un emballage artisanal ; le marché offre une " +
        "demande croissante de cosmétiques naturels, et la menace vient de produits " +
        "importés moins chers.",
    ),
    tableau(
      ["Famille", "Piste"],
      [
        ["Attaquer", "Mettre en avant l'origine et le travail des femmes auprès des marques"],
        ["Se renforcer", "Moderniser l'emballage pour atteindre les boutiques urbaines"],
        ["Défendre", "Obtenir une certification biologique que l'importé n'a pas"],
        ["Se protéger", "Éviter la guerre des prix en sortant du vrac"],
      ],
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une clinique privée de Cotonou a construit sa TOWS. Rangez chaque piste dans sa " +
      "famille.",
    categories: ["Attaquer", "Se renforcer", "Défendre", "Se protéger"],
    elements: [
      {
        texte:
          "S'appuyer sur ses médecins spécialistes reconnus pour ouvrir des consultations " +
          "pour les assurés d'entreprises, un marché en croissance.",
        categorie: 0,
        explication: "Une force (spécialistes) au service d'une opportunité (assurés).",
      },
      {
        texte:
          "Informatiser ses dossiers patients pour pouvoir traiter avec les assureurs, qui " +
          "l'exigent.",
        categorie: 1,
        explication: "Corriger une faiblesse qui empêche de saisir l'opportunité.",
      },
      {
        texte:
          "Miser sur sa réputation d'accueil pour résister à la nouvelle clinique d'un " +
          "grand groupe.",
        categorie: 2,
        explication: "Une force contre une menace.",
      },
      {
        texte:
          "Former un second radiologue pour ne pas dépendre d'un seul, alors que les " +
          "spécialistes partent vers l'étranger.",
        categorie: 3,
        explication: "Réduire une faiblesse que la menace rendrait fatale.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pourquoi une piste qui apparaît dans plusieurs cases de la TOWS est-elle précieuse ?",
    choix: [
      {
        texte: "Parce qu'elle sert plusieurs enjeux avec un même effort.",
        explication: "Oui : une seule action règle plusieurs problèmes à la fois.",
      },
      {
        texte: "Parce qu'elle est forcément la moins coûteuse.",
        explication: "Rien ne le garantit : le coût s'évalue à part.",
      },
      {
        texte: "Parce que la TOWS l'impose comme stratégie.",
        explication: "La TOWS propose des options ; le choix vient plus tard.",
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
        texte: "La TOWS permet de passer du constat aux pistes d'action.",
        vrai: true,
        explication: "C'est sa raison d'être.",
      },
      {
        texte: "La case « se protéger » ne sert que si l'entreprise va mal.",
        vrai: false,
        explication:
          "Elle sert à toute entreprise : Infosystem est rentable, et pourtant exposée.",
      },
      {
        texte: "La TOWS dit quelle piste choisir.",
        vrai: false,
        explication: "Elle produit des options ; le choix demande un cap et une comparaison.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "À partir de la SWOT de votre organisation, proposez une piste par famille de la " +
      "TOWS. Laquelle sert le plus grand nombre de fins à la fois ?",
    corrige: [
      "Quatre pistes, chacune justifiée par un croisement nommé (telle force × telle " +
        "opportunité…).",
      "Des pistes formulées comme des actions, avec un verbe.",
      "Une piste repérée comme transversale, et l'explication de ce qu'elle règle.",
      "Aucune piste ne contredit une contrainte connue (finances, compétences).",
    ],
  }),

  appliquez(
    5,
    "Dans l'étape 5, complétez votre matrice TOWS et marquez les pistes qui reviennent " +
      "dans plusieurs cases.",
  ),
  fiche(
    "La TOWS croise l'interne et l'externe pour produire des pistes d'action.",
    "Forces × opportunités : attaquer. Faiblesses × opportunités : se renforcer.",
    "Forces × menaces : défendre. Faiblesses × menaces : se protéger.",
    "Chaque piste nomme le croisement qui la justifie.",
    "Une piste présente dans plusieurs cases est un signal fort, pas encore un choix.",
  ),
];
