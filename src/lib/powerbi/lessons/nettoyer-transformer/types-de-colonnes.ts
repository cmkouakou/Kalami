/**
 * =============================================================
 *  Fichier    : types-de-colonnes.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Évaluer et modifier les types de données des
 *               colonnes » : la détection automatique, les conséquences d'un mauvais type
 *               et les deux façons de le corriger.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import {
  code,
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
    "À l'import, Power BI Desktop examine les **1 000 premières lignes** (réglage par défaut) " +
      "pour deviner le type de chaque colonne. Il peut se tromper, et un type faux nuit aux " +
      "performances, aux calculs et aux relations.",
  ),
  examen(
    "Le chiffre à retenir : 1 000 lignes analysées par défaut. Une colonne propre sur ces " +
      "lignes-là peut cacher des valeurs d'un autre type plus bas.",
  ),

  titre("Où les erreurs sont les plus probables"),
  tableau(
    ["Source", "Risque", "Pourquoi"],
    [
      ["Fichiers plats (.csv, .xlsx)", "Élevé", "Données saisies à la main"],
      ["Bases de données", "Faible", "Types définis à la création des tables ou des vues"],
    ],
  ),
  p(
    "D'où la recommandation : évaluer les types dans Power Query **avant** de charger le " +
      "modèle. On peut y changer le type, appliquer un format, et modifier le résumé par " +
      "défaut d'une colonne.",
  ),

  titre("Ce qu'un mauvais type empêche"),
  p(
    "Le scénario : **OrderDate** contient des dates, mais Power BI l'a typée **Texte**. Trois " +
      "conséquences :",
  ),
  liste(
    "Certains **calculs** deviennent impossibles",
    "Pas de **hiérarchie de dates** (année, mois, semaine) : SalesDate n'apparaît que comme " +
      "une liste de dates dans un visuel Table",
    "Pas de **relations** correctes avec d'autres tables",
  ),
  p("L'exemple de mesure, qui échoue tant que OrderDate n'est pas de type Date :"),
  code("Quantity of Orders YTD = TOTALYTD(SUM('Sales'[OrderQty]), 'Sales'[OrderDate])", "dax"),
  examen(
    "Les fonctions d'intelligence temporelle comme TOTALYTD exigent une colonne de type " +
      "**Date**. Un message d'erreur sur une mesure YTD pointe souvent vers un type de colonne.",
  ),
  note(
    "Le cours recommande une vraie table de dates, et la désactivation de la date/heure " +
      "automatique pour supprimer la hiérarchie générée d'office.",
  ),

  titre("Modifier le type"),
  p(
    "Deux endroits possibles : Power Query, ou la vue Rapport avec les **Outils de colonne**. " +
      "Power Query est préférable, avant le chargement.",
  ),
  tableau(
    ["Méthode dans Power Query", "Chemin"],
    [
      ["Par le ruban", "Sélectionner la colonne > Transformer > **Type de données**"],
      ["Par l'en-tête", "Cliquer sur l'icône de type à côté du nom de colonne"],
    ],
  ),
  p(
    "Le changement devient une étape nommée **Type modifié**, rejouée à chaque actualisation. " +
      "Puis Fermer et appliquer.",
  ),
  memo(
    "Le type, c'est l'étiquette sur le bocal. Si « sucre » est écrit sur le sel, chaque " +
      "recette qui s'en sert tourne mal — la mesure YTD la première.",
  ),
];

export default contenu;
