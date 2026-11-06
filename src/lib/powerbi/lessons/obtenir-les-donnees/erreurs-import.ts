/**
 * =============================================================
 *  Fichier    : erreurs-import.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Résoudre les erreurs d'importation » : délai
 *               dépassé, table Excel absente, fichier introuvable et erreurs de type.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import {
  code,
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
    "Chaque source a ses propres messages d'erreur, et disques, réseaux ou systèmes peuvent " +
      "aussi échouer. Les données respectent rarement un schéma parfait. Le cours retient quatre " +
      "erreurs courantes.",
  ),
  tableau(
    ["Erreur", "Cause", "Solution"],
    [
      [
        "Délai d'expiration dépassé",
        "Trop de données demandées au regard des règles de la source",
        "Extraire moins, ou par blocs",
      ],
      [
        "Aucune donnée sous forme de tableau",
        "Plage Excel non mise en tableau",
        "**Ctrl+T** dans Excel",
      ],
      ["Fichier introuvable", "Fichier déplacé ou autorisations changées", "Corriger la Source"],
      ["Colonnes vides", "Type de données mal interprété", "Forcer le type dans la requête"],
    ],
  ),

  titre("Délai d'expiration de la requête"),
  p(
    "Une base relationnelle sert beaucoup d'utilisateurs à la fois. Pour éviter qu'une requête " +
      "monopolise les ressources, les administrateurs fixent un délai : de **cinq secondes à " +
      "30 minutes ou plus**.",
  ),
  liste(
    "Extraire **moins de colonnes ou de lignes**",
    "Se méfier des jointures multiples, sous-requêtes complexes et requêtes imbriquées, qui " +
      "allongent beaucoup l'exécution",
    "Si tout est nécessaire : extraire par **petits blocs** (la moitié des colonnes dans une " +
      "requête, l'autre moitié dans une autre), puis les **fusionner** dans Power Query",
  ),

  titre("Aucune donnée sous forme de tableau"),
  p("Power BI attend un **tableau** Excel. Le message indique lui-même la solution :"),
  etapes(
    "Ouvrir le classeur et sélectionner les données",
    "**Ctrl+T** : la première ligne devient probablement les en-têtes",
    "Vérifier les noms de colonnes, puis relancer l'import",
  ),

  titre("Fichier introuvable"),
  etapes(
    "**Transformer les données** pour ouvrir Power Query",
    "Sélectionner la requête en erreur",
    "Dans Paramètres de la requête, cliquer sur l'**engrenage** à côté de **Source**",
    "Indiquer le nouvel emplacement du fichier",
  ),

  titre("Erreurs de type de données"),
  p(
    "Symptôme : des colonnes vides après l'import, parce que Power BI a mal deviné le type. " +
      "Avec SQL Server, on convertit dans la requête. Au lieu de :",
  ),
  code("SELECT CustomerPostalCode FROM Sales.Customers", "sql"),
  p("on écrit :"),
  code("SELECT CAST(CustomerPostalCode as varchar(10)) FROM Sales.Customers", "sql"),
  examen(
    "Associer chaque symptôme à sa cause : colonnes **vides** → type mal interprété ; " +
      "**timeout** → trop de données ; Excel « aucun tableau » → **Ctrl+T** ; fichier déplacé → " +
      "engrenage de l'étape **Source**.",
  ),
  note(
    "Pour une erreur non traitée ici, chercher son message dans la documentation Power Query " +
      "sur la gestion des erreurs.",
  ),
  memo(
    "Trop gros → découper. Pas rangé → Ctrl+T. Déménagé → nouvelle adresse dans Source. Mal " +
      "étiqueté → CAST.",
  ),
];

export default contenu;
