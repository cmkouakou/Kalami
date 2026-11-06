/**
 * =============================================================
 *  Fichier    : introduction.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Introduction » du module « Nettoyer, transformer
 *               et charger les données » : les symptômes de données sales, les
 *               bénéfices de données propres et les huit objectifs du module.
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
  titre,
  type LessonContent,
} from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Des données importées de plusieurs sources ne sont presque jamais prêtes pour l'analyse. " +
      "Power BI et Power Query offrent l'environnement pour les nettoyer et les préparer, afin " +
      "que le modèle sémantique soit aussi juste que possible.",
  ),
  memo(
    "Un modèle n'est jamais meilleur que les données qu'on y charge. On lave les légumes avant " +
      "de cuisiner, pas dans l'assiette.",
  ),

  titre("Les symptômes du scénario"),
  p("Le cours part d'un jeu de données importé qui, à l'examen, accumule les défauts :"),
  liste(
    "Une colonne **Employment status** qui ne contient que des nombres",
    "Plusieurs colonnes en erreur",
    "Des valeurs nulles dans certaines colonnes",
    "Un ID client qui semble dupliqué de façon répétée",
    "Une seule colonne d'adresse qui mêle rue, ville, État et code postal",
  ),
  p(
    "Conséquence : les visuels par État affichent de mauvais chiffres, et même de simples " +
      "totaux de ventes sont faux.",
  ),

  titre("Ce que des données propres apportent"),
  liste(
    "Des mesures et colonnes plus **exactes** lors des calculs et des agrégations",
    "Des tables **organisées**, où l'on trouve les données intuitivement",
    "Des **doublons supprimés**, donc une navigation simplifiée et des colonnes utilisables " +
      "dans les segments et les filtres",
    "Une colonne complexe **fractionnée** en deux plus simples, ou plusieurs colonnes " +
      "**combinées** en une seule, plus lisible",
    "Des codes et des entiers **remplacés** par des valeurs lisibles",
  ),
  note(
    "Chaque symptôme du scénario a son remède dans cette liste : l'adresse se fractionne, le " +
      "statut codé se remplace, les doublons se suppriment.",
  ),

  titre("Les huit objectifs du module"),
  etapes(
    "Résoudre les incohérences, les valeurs inattendues ou nulles et les problèmes de qualité",
    "Appliquer des remplacements de valeurs conviviaux",
    "Profiler les données pour connaître une colonne avant de l'utiliser",
    "Évaluer et transformer les types de données des colonnes",
    "Appliquer des transformations de forme aux structures de tables",
    "Combiner des requêtes",
    "Appliquer des conventions de nommage claires aux colonnes et aux requêtes",
    "Modifier le code M dans l'éditeur avancé",
  ),
  examen(
    "Tout ce travail se fait dans **Power Query**, avant le chargement. C'est le domaine " +
      "« Préparer les données » de l'examen : nettoyer, profiler, transformer, charger.",
  ),
];

export default contenu;
