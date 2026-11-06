/**
 * =============================================================
 *  Fichier    : choisir-un-framework.ts (framework-de-modele)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Choisir un framework de modèle » : la règle par
 *               défaut, les cas DirectQuery et composite, et la conversion à sens
 *               unique.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import { examen, memo, note, p, tableau, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Une leçon courte qui rassemble le module en une règle de décision. Les conseils visent " +
      "surtout les solutions d'entreprise : gros volumes, débit de requêtes élevé, réactivité " +
      "essentielle.",
  ),
  memo(
    "Import d'abord. DirectQuery quand le volume ou la fraîcheur l'imposent. Composite pour " +
      "corriger l'un ou étendre l'autre.",
  ),

  titre("La règle par défaut : l'importation"),
  p(
    "Choisir le modèle d'importation **chaque fois que possible** : il offre le plus d'options, " +
      "la plus grande flexibilité de conception et des performances rapides. L'accompagner de " +
      "techniques de réduction des données, pour que Power BI charge le moins possible.",
  ),

  titre("Quand passer à DirectQuery"),
  p(
    "Quand la source stocke de **gros volumes** de données, ou que le rapport doit livrer des " +
      "données en **quasi temps réel** — ou les deux.",
  ),

  titre("Quand passer au composite"),
  tableau(
    ["Objectif", "Technique"],
    [
      [
        "Accélérer un modèle DirectQuery",
        "Tables d'agrégation (Import ou DirectQuery) ; avec des agrégations Import, " +
          "dimensions en mode Dual",
      ],
      [
        "Du quasi temps réel dans un modèle d'importation",
        "Table hybride : Power BI ajoute une partition DirectQuery pour la période en cours",
      ],
      [
        "Étendre un dataset Power BI ou un modèle AAS",
        "Modèle spécialisé chaîné au modèle de base par DirectQuery",
      ],
    ],
  ),
  note(
    "Le modèle spécialisé est d'ordinaire l'affaire d'un analyste métier, qui étend les modèles " +
      "de base fournis et maintenus par l'équipe TI.",
  ),

  titre("Bien planifier"),
  {
    kind: "encadre",
    ton: "attention",
    titre: "Important",
    texte:
      "Dans Power BI Desktop, on peut toujours convertir une table DirectQuery en table Import. " +
      "L'inverse est impossible.",
  },
  examen(
    "La conversion va dans un seul sens : DirectQuery → Import. D'où le conseil du cours : " +
      "bien planifier le mode de stockage avant de bâtir le modèle.",
  ),
  memo(
    "On peut toujours remplir la valise (DirectQuery → Import), jamais la vider pour revenir " +
      "en arrière.",
  ),

  titre("Le module en un tableau"),
  tableau(
    ["Besoin", "Framework"],
    [
      ["Cas général : performance et flexibilité", "Importation, avec réduction des données"],
      ["Gros volumes à la source ou quasi temps réel", "DirectQuery"],
      ["Accélérer un DirectQuery", "Composite, avec agrégations"],
      ["Quasi temps réel sur un modèle importé", "Composite, avec table hybride"],
      ["Étendre un dataset ou un modèle AAS", "Composite, par chaînage DirectQuery"],
    ],
  ),
];

export default contenu;
