/**
 * =============================================================
 *  Fichier    : modele-composite.ts (framework-de-modele)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Déterminer quand développer un modèle
 *               composite » : plusieurs groupes de sources, agrégations, mode Dual,
 *               relations limitées et tables hybrides.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import {
  examen,
  liste,
  memo,
  note,
  p,
  tableau,
  titre,
  type LessonContent,
} from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Un modèle composite comprend **plus d'un groupe de sources** — en général un groupe " +
      "Import et un groupe DirectQuery. Certaines tables sont en cache, d'autres sont " +
      "interrogées en direct à la source.",
  ),
  note(
    "Les avantages et les limites d'Import et de DirectQuery s'appliquent, en règle générale, " +
      "aux tables correspondantes d'un modèle composite. Le composite n'efface pas les " +
      "compromis : il les répartit table par table.",
  ),
  memo(
    "Le composite, c'est le troisième framework annoncé en introduction : celui qui tente " +
      "d'avoir la vitesse d'Import *et* la fraîcheur de DirectQuery.",
  ),

  titre("Les avantages"),
  liste(
    "**Flexibilité de conception** : mélanger les modes de stockage et doser l'équilibre. Les " +
      "modèles d'entreprise utilisent souvent DirectQuery sur les grandes sources et des " +
      "tables importées pour accélérer les requêtes.",
    "**Accélérer un modèle DirectQuery** : certaines requêtes sont satisfaites par des données " +
      "importées, et interroger le cache est presque toujours plus rapide.",
    "**Étendre un modèle distant** (un dataset Power BI, par exemple) avec de nouvelles " +
      "colonnes et tables calculées, pour obtenir un modèle spécialisé bâti sur un modèle " +
      "principal.",
  ),

  titre("Les limites"),
  tableau(
    ["Limite", "Ce qu'il faut savoir"],
    [
      [
        "Actualisation",
        "Les tables Import ou Dual doivent être actualisées, sinon elles se désynchronisent " +
          "des sources DirectQuery",
      ],
      [
        "Consolidation entre groupes",
        "Une requête qui croise Import et DirectQuery force Power BI à fusionner les " +
          "résultats, ce qui peut coûter en performance",
      ],
      [
        "Chaînage",
        "Une modification du modèle en amont peut casser les modèles en aval : vérifier " +
          "d'abord avec l'analyse d'impact du dataset",
      ],
      ["Relations limitées", "Peuvent produire des évaluations différentes des calculs"],
    ],
  ),

  titre("Les relations limitées"),
  p(
    "Une relation est **limitée** quand il n'existe pas de côté « un » garanti — le côté qui " +
      "contient des valeurs uniques. Deux situations la produisent :",
  ),
  liste(
    "La relation est de cardinalité **plusieurs à plusieurs**, même si une colonne, ou les " +
      "deux, contiennent en réalité des valeurs uniques.",
    "La relation **traverse deux groupes de sources** — ce qui n'arrive que dans un modèle " +
      "composite.",
  ),
  examen(
    "Les deux causes d'une relation limitée : plusieurs-à-plusieurs, ou relation entre groupes " +
      "de sources différents. La seconde est propre au composite.",
  ),

  titre("Accélérer DirectQuery avec des données importées"),
  tableau(
    ["Fonctionnalité", "Rôle"],
    [
      [
        "Tables d'agrégation Import",
        "Les requêtes sur des faits de grain supérieur sont dirigées vers une agrégation en " +
          "cache",
      ],
      ["Agrégations automatiques", "Même idée, créées automatiquement — fonctionnalité Premium"],
      [
        "Mode Dual sur les dimensions",
        "Power BI choisit Import ou DirectQuery à chaque requête, en privilégiant le cache",
      ],
    ],
  ),
  p(
    "Agrégations Import et dimensions Dual vont ensemble : elles permettent à Power BI de " +
      "répondre **entièrement** depuis le cache aux requêtes de grain supérieur. Bonus cité : " +
      "les segments et les listes des cartes de filtre, souvent construits sur des colonnes de " +
      "dimension, s'affichent plus vite.",
  ),
  memo(
    "Agrégation en Import + dimensions en Dual = la requête de haut niveau ne quitte jamais " +
      "la mémoire.",
  ),

  titre("Du temps réel dans un modèle d'importation"),
  p(
    "Sur une table Import configurée en actualisation incrémentielle, on peut activer l'option " +
      "« Obtenir les données les plus récentes en temps réel avec DirectQuery ». Power BI crée " +
      "alors une partition DirectQuery, et la table devient **hybride**.",
  ),
  tableau(
    ["Partition", "Mode", "Données"],
    [
      ["Plusieurs", "Import", "Les données plus anciennes, lues dans le cache"],
      ["Une seule", "DirectQuery", "Les données actuelles, lues à la source"],
    ],
  ),
  examen(
    "Table hybride = actualisation incrémentielle + option temps réel DirectQuery, et licence " +
      "**Premium** obligatoire. Une seule partition DirectQuery, pour la période en cours.",
  ),
];

export default contenu;
