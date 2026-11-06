/**
 * =============================================================
 *  Fichier    : mode-de-stockage.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Choisir un mode de stockage » : Importer,
 *               DirectQuery et Double, et où les régler.
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
  p,
  tableau,
  titre,
  type LessonContent,
} from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Le plus courant est d'**importer** les données : elles sont stockées dans le fichier Power " +
      "BI et publiées avec le rapport. Ce n'est pas toujours possible, et **DirectQuery** " +
      "interroge alors la source sans en garder de copie.",
  ),
  p("Pourquoi renoncer à l'importation :"),
  liste(
    "Des **exigences de sécurité** interdisent les copies locales (le scénario du département " +
      "commercial de Tailwind Traders)",
    "Des modèles **trop volumineux**, dont le chargement devient un goulot d'étranglement",
    "Le besoin de voir **toujours la version la plus récente** des données",
  ),

  titre("Où le régler"),
  etapes(
    "Passer à la vue **Modèle**",
    "Sélectionner une table",
    "Dans le volet **Propriétés**, choisir dans la liste **Mode de stockage**",
  ),

  titre("Les trois modes"),
  tableau(
    ["Mode", "Fonctionnement", "Points forts"],
    [
      [
        "**Importer**",
        "Copie locale des données dans Power BI",
        "Mode **par défaut** ; toutes les fonctions du service (Questions et réponses, Quick " +
          "Insights) ; actualisation planifiée ou à la demande",
      ],
      [
        "**DirectQuery**",
        "Rien en cache : requêtes natives envoyées à la source",
        "Données les plus récentes ; respect de la sécurité ; adapté aux gros modèles",
      ],
      [
        "**Double (composite)**",
        "Certaines tables importées, d'autres interrogées",
        "Power BI choisit la façon la plus efficace de récupérer les données",
      ],
    ],
  ),
  examen(
    "Une question type : « interdiction de stocker une copie des données » ou « données en temps " +
      "réel sur un très gros volume » → **DirectQuery**. Sans contrainte particulière → " +
      "**Importer**, le mode par défaut.",
  ),
  memo(
    "Importer = emporter le livre chez soi. DirectQuery = le consulter à la bibliothèque à " +
      "chaque fois. Double = garder certains livres, consulter les autres.",
  ),
];

export default contenu;
