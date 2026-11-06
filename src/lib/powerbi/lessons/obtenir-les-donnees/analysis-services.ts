/**
 * =============================================================
 *  Fichier    : analysis-services.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Obtenir des données depuis Azure Analysis Services » :
 *               ressemblances et différences avec SQL Server, et la connexion directe.
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
    "**Azure Analysis Services** est une plateforme PaaS entièrement managée qui fournit des " +
      "modèles sémantiques tabulaires dans le cloud : données combinées, mesures définies et " +
      "sécurité, dans un modèle unique et fiable. On s'y connecte presque comme à SQL Server.",
  ),
  p(
    "Le scénario : Tailwind Traders y stocke ses projections financières, à comparer aux ventes " +
      "réelles d'une autre base.",
  ),

  titre("Comme SQL Server… ou pas"),
  tableau(
    ["Comme SQL Server", "Différent de SQL Server"],
    [
      ["On s'authentifie auprès du serveur", "Le modèle contient des **calculs déjà créés**"],
      [
        "On choisit le modèle, puis les tables",
        "Pour interroger : **MDX** ou **DAX**, et non T-SQL",
      ],
    ],
  ),

  titre("Se connecter"),
  etapes(
    "Obtenir les données > **Analysis Services**",
    "Saisir l'adresse du serveur et le nom de la base",
    "Choisir **Importer** ou **Connexion directe**",
  ),

  titre("La connexion directe"),
  p(
    "Analysis Services utilise le modèle tabulaire et DAX, comme Power BI : les deux sont " +
      "compatibles. En connexion directe :",
  ),
  liste(
    "Les données et les calculs DAX **restent dans Analysis Services**, rien n'est importé",
    "Quand le service s'actualise, les rapports sont à jour **immédiatement**, sans " +
      "actualisation planifiée côté Power BI",
  ),
  examen(
    "Le cas le plus probable reste d'**importer** dans Power BI. L'alternative : importer les " +
      "autres sources (Excel, SQL Server…) **dans** Analysis Services, puis s'y connecter en " +
      "connexion active, pour garder modélisation et mesures DAX au même endroit.",
  ),
  note("Requêtes vers Analysis Services : MDX ou DAX. T-SQL, c'est pour SQL Server."),
  memo(
    "SQL Server livre des ingrédients ; Analysis Services livre un plat déjà cuisiné, mesures " +
      "comprises.",
  ),
];

export default contenu;
