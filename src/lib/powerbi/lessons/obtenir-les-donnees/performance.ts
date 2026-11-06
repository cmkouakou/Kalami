/**
 * =============================================================
 *  Fichier    : performance.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Corriger les problèmes de performance » : le Query
 *               Folding, ce qui l'empêche, les diagnostics de requête et d'autres pistes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import {
  etapes,
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
    "La performance de Power Query dépend de celle de la source. Le levier principal est le " +
      "**Query Folding** : faire exécuter les transformations par le serveur source plutôt que " +
      "par Power BI.",
  ),
  p(
    "Le scénario : des rapports Ventes sur une base SQL en **DirectQuery**, où certaines tables " +
      "et certains filtres sont lents.",
  ),
  note(
    "Côté source, d'autres leviers existent (index, matériel, plans d'exécution, compression) ; " +
      "le cours les cite sans les détailler.",
  ),

  titre("Le Query Folding"),
  p(
    "Les étapes faites dans Power Query sont traduites en **requête native** (une instruction " +
      "SQL SELECT), exécutée sur le serveur au chargement. Exemple : renommer des colonnes et " +
      "fusionner Ville et Département se font dans la source.",
  ),
  tableau(
    ["Avantage", "Pourquoi"],
    [
      [
        "Actualisations plus efficaces, y compris incrémentielles",
        "Power BI n'exécute pas chaque transformation localement",
      ],
      [
        "Compatible d'office avec **DirectQuery** et **Double**",
        "Ces modes exigent que la source fasse le traitement",
      ],
    ],
  ),

  titre("Vérifier le folding d'une étape"),
  etapes(
    "Dans **Paramètres de la requête**, clic droit sur la dernière étape appliquée",
    "Si **Afficher la requête native** est grisé, cette étape ne se replie pas",
    "Remonter les étapes jusqu'à celle où l'option est en gras : elle montre la requête native",
  ),
  examen(
    "Les trois transformations du cours qui **empêchent** le folding : ajouter une **colonne " +
      "d'index**, fusionner ou ajouter des tables de **deux sources différentes**, **changer le " +
      "type de données** d'une colonne.",
  ),
  p(
    "La règle : si l'étape peut s'écrire en SELECT avec GROUP BY, SORT BY, WHERE, UNION ALL ou " +
      "JOIN, elle peut se replier.",
  ),

  titre("Les diagnostics de requête"),
  p(
    "Pour trouver les goulots d'étranglement au chargement, à la transformation ou à " +
      "l'actualisation. Dans Power Query : onglet **Accueil**, groupe **Outils**.",
  ),
  liste(
    "**Démarrer les diagnostics** avant la transformation, **Arrêter les diagnostics** après",
    "**Diagnostiquer l'étape** : la durée d'une étape, pour repérer celle qui traîne",
  ),

  titre("Autres bonnes pratiques"),
  liste(
    "Faire le **maximum de traitement dans la source** d'origine",
    "En DirectQuery sur SQL, utiliser des **requêtes SQL natives**, et éviter procédures " +
      "stockées et expressions de table communes (CTE)",
    "**Séparer date et heure** stockées dans une même colonne, avant l'import : la compression " +
      "s'améliore",
  ),
  memo(
    "Query Folding = déléguer le travail à la cuisine du serveur. Index, sources mêlées, " +
      "changement de type : la commande revient chez Power BI.",
  ),
];

export default contenu;
