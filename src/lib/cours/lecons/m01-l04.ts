/**
 * =============================================================
 *  Fichier    : m01-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 1, leçon 4 — « La démarche d'analyse stratégique en une page »,
 *               et rencontre avec Infosystem. Sources : livre, module 1 (§ 1.3 la
 *               démarche en quatre temps, § 1.4 le cas Infosystem). Correspondance avec
 *               les neuf étapes de Kalami Stratégie (lib/strategy/steps.ts). Texte et
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

export const M01_L04: ContenuLecon = [
  p(
    "On peut lire dix livres de stratégie et rester incapable d'en faire une. Ce qui manque " +
      "rarement, ce sont les outils ; ce qui manque souvent, c'est **l'ordre dans lequel " +
      "s'en servir**. Cette leçon vous donne la carte du cours entier, en une page.",
  ),

  titre("Quatre temps"),
  schema(
    "demarche",
    "La démarche en quatre temps, de gauche à droite : comprendre (environnement et " +
      "interne), synthétiser (SWOT, enjeux), décider (cap et stratégie), agir (plan et " +
      "suivi).",
  ),
  etapes(
    "**Comprendre** : regarder autour de l'entreprise (le macroenvironnement, puis " +
      "l'industrie et la concurrence), en elle (ressources et compétences) et les acteurs " +
      "qui l'influencent (parties prenantes).",
    "**Synthétiser** : réunir ces constats dans une matrice SWOT et en tirer les quelques " +
      "enjeux qui comptent vraiment.",
    "**Décider** : clarifier la vision, la mission et les objectifs, puis choisir une " +
      "stratégie parmi plusieurs options.",
    "**Agir** : traduire ce choix en plan d'action, l'assembler dans un plan stratégique " +
      "et suivre les résultats.",
  ),
  retenir("On ne décide bien que ce qu'on a compris.", [
    "Sauter le premier temps, c'est choisir une solution avant de connaître le problème.",
    "Rester au premier temps, c'est produire de beaux diagnostics que personne n'utilise.",
  ]),

  titre("La carte du cours et de l'outil"),
  p(
    "Chaque temps correspond à des modules du cours et à des étapes de Kalami Stratégie, " +
      "l'assistant dans lequel vous construirez votre propre analyse.",
  ),
  tableau(
    ["Temps", "Modules du cours", "Étapes de Kalami Stratégie"],
    [
      [
        "Comprendre",
        "2 Macroenvironnement · 3 Industrie · 4 Interne · 6 Parties prenantes",
        "1 Environnement externe · 2 Concurrentiel · 3 Interne · 4 Parties prenantes",
      ],
      ["Synthétiser", "5 SWOT et TOWS", "5 Synthèse"],
      [
        "Décider",
        "7 Vision et mission · 8 à 11 Choix stratégiques",
        "6 Cap · 7 Choix",
      ],
      ["Agir", "12 Mettre en œuvre, suivre · 13 Cas intégrateur", "8 Action · 9 Plan stratégique"],
    ],
    "Les parties prenantes sont vues au module 6, après la SWOT, mais elles font partie " +
      "du diagnostic : on les analyse souvent en parallèle.",
  ),
  piege(
    "Commencer par la SWOT. C'est l'outil le plus connu, donc le premier qu'on dégaine. " +
      "Remplie sans analyse préalable, elle aligne des impressions : des « forces » que " +
      "personne n'a vérifiées et des « menaces » tirées des journaux. La SWOT résume un " +
      "travail ; elle ne le remplace pas.",
  ),

  titre("Rencontre avec Infosystem"),
  p(
    "Pour apprendre la démarche, nous la suivrons pas à pas sur un même cas. **Infosystem** " +
      "est une PME québécoise de services de gestion informatique en impartition : des " +
      "entreprises lui confient une partie de leur informatique plutôt que de bâtir leur " +
      "propre équipe. Le cas est adapté d'une PME réelle.",
  ),
  liste(
    "**Le dirigeant** : Justin, ingénieur, fondateur, à la tête de l'entreprise depuis " +
      "plus de dix-sept ans.",
    "**L'équipe** : treize personnes. Marthe, son épouse, tient la comptabilité et les " +
      "ressources humaines ; deux techniciens seniors encadrent chacun une équipe ; sur " +
      "neuf techniciens, cinq sont des recrues récentes, et c'est parmi elles que se " +
      "concentrent les départs.",
    "**Les services** : audit et conseil ; gestion des changements (maintenir équipements " +
      "et services aux normes) ; intervention rapide en cas d'incident majeur ; gestion " +
      "courante (soutien, formation, relation avec les fournisseurs).",
  ),
  p(
    "Justin attend de l'analyse des réponses précises : sur quoi l'entreprise peut-elle " +
      "s'appuyer, et où est-elle fragile ? Qu'est-ce qui change sur son marché ? Comment " +
      "garder les techniciens qu'elle forme ? Comment préparer une relève fiable ?",
  ),
  definition(
    "Fil rouge",
    "Un cas suivi d'un bout à l'autre du cours. Chaque module y applique son outil, si bien " +
      "qu'à la fin vous aurez vu une analyse complète se construire, du premier constat " +
      "au plan stratégique.",
  ),
  notion(
    "Pour aller plus loin : pourquoi un cas québécois et des exemples ouest-africains ?",
    p(
      "Infosystem est le cas du livre dont ce cours est tiré : il est documenté en détail, " +
        "module par module. Les exemples courts, eux, viennent surtout d'Afrique de " +
        "l'Ouest, et le cas intégrateur du module 13 se déroule en Côte d'Ivoire.",
    ),
    p(
      "Les outils ne changent pas d'un continent à l'autre ; ce qui change, ce sont les " +
        "facteurs à observer (le franc CFA, le mobile money, les filières agricoles) et les " +
        "sources d'information. Passer d'un contexte à l'autre est un excellent exercice.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Dans quel temps de la démarche se situe chacune de ces activités ?",
    categories: ["Comprendre", "Synthétiser", "Décider", "Agir"],
    elements: [
      {
        texte: "Interroger les clients sur ce qu'ils apprécient chez Infosystem.",
        categorie: 0,
        explication: "On recueille des faits sur l'entreprise : c'est du diagnostic.",
      },
      {
        texte: "Ranger les constats en forces, faiblesses, opportunités et menaces.",
        categorie: 1,
        explication: "C'est la matrice SWOT, qui résume le diagnostic.",
      },
      {
        texte: "Choisir entre se spécialiser en cybersécurité ou rester généraliste.",
        categorie: 2,
        explication: "On tranche entre des options stratégiques.",
      },
      {
        texte: "Fixer qui pilote le programme de formation, avec quel budget et quelle date.",
        categorie: 3,
        explication: "On traduit le choix en plan d'action.",
      },
      {
        texte: "Repérer les nouvelles lois sur la protection des données.",
        categorie: 0,
        explication: "Analyse du macroenvironnement, première étape de la compréhension.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Pourquoi ne pas commencer une analyse stratégique par la SWOT ?",
    choix: [
      {
        texte: "Parce que la SWOT est un outil dépassé.",
        explication: "Elle reste très utile, à la bonne place : en synthèse.",
      },
      {
        texte:
          "Parce qu'elle résume un diagnostic : sans analyse préalable, elle ne contient " +
          "que des impressions.",
        explication: "Oui : la SWOT vaut ce que valent les analyses qui l'alimentent.",
      },
      {
        texte: "Parce qu'elle ne concerne que les grandes entreprises.",
        explication: "Elle s'applique à toute organisation, PME comprise.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "ouvert",
    id: "e3",
    question:
      "Les quatre défis d'Infosystem (relève, croissance, rétention, capacité) sont liés. " +
      "Décrivez comment ils s'influencent, et dites par lequel vous commenceriez.",
    corrige: [
      "Le roulement des techniciens réduit la capacité ; la capacité limitée oblige à " +
        "refuser des mandats et freine la croissance.",
      "Une entreprise qui repose sur son fondateur et deux seniors est difficile à " +
        "transmettre : la relève dépend d'une équipe stable.",
      "Commencer par la rétention se défend bien : elle débloque les trois autres. D'autres " +
        "choix sont possibles s'ils sont justifiés.",
    ],
  }),

  appliquez(
    null,
    "Ouvrez Kalami Stratégie et parcourez les neuf étapes de votre étude sans rien remplir : " +
      "repérez où se trouvent les quatre temps que vous venez de voir.",
  ),
  fiche(
    "Quatre temps : comprendre, synthétiser, décider, agir.",
    "La SWOT résume le diagnostic ; elle ne commence pas l'analyse.",
    "Les étapes 1 à 4 de Kalami Stratégie correspondent au temps « comprendre ».",
    "Infosystem, PME de treize personnes, est notre fil rouge : relève, croissance, " +
      "rétention et capacité.",
  ),
];
