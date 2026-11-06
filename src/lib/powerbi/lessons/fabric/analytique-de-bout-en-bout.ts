/**
 * =============================================================
 *  Fichier    : analytique-de-bout-en-bout.ts (fabric)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « L'analytique de bout en bout avec Fabric » : la
 *               plateforme SaaS, OneLake, les raccourcis, les espaces de travail et la
 *               gouvernance centralisée.
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
    "Une analytique à grande échelle est souvent fragmentée entre des outils et des équipes. " +
      "Microsoft Fabric réunit ces outils dans **une seule plateforme SaaS**, où toutes les " +
      "données vivent dans un format ouvert unique, dans **OneLake**. Tous les moteurs " +
      "d'analytique y lisent les mêmes données.",
  ),
  memo(
    "OneLake, c'est « le OneDrive des données » de l'organisation : un seul lac, que chaque " +
      "outil de Fabric ouvre sans faire sa propre copie.",
  ),

  titre("OneLake, le stockage unique"),
  liste(
    "Un **lac logique unique**, qui unifie les données entre régions et clouds sans les " +
      "déplacer ni les dupliquer",
    "Bâti sur **Azure Data Lake Storage Gen2** ; formats Delta, Parquet, CSV et JSON",
    "Tous les moteurs de calcul de Fabric y stockent automatiquement leurs données",
    "Les données tabulaires sont écrites au format **delta-parquet**, que tous les moteurs " +
      "savent lire",
  ),
  p(
    "Les moteurs qui partagent ce stockage : ingénierie des données, entrepôt de données, " +
      "usine de données (Data Factory), Power BI et intelligence en temps réel.",
  ),
  examen(
    "Mots-clés à associer à OneLake : stockage **centralisé**, **pas de copie** entre " +
      "systèmes, format **delta-parquet**, base ADLS Gen2.",
  ),

  titre("Les raccourcis (shortcuts)"),
  p(
    "Un raccourci est une **référence** vers des fichiers situés dans OneLake ou à l'extérieur : " +
      "Azure Data Lake Storage, Amazon S3 ou Dataverse. On lit les données existantes sans les " +
      "copier, et Fabric reste synchronisé avec la source.",
  ),
  memo("Un raccourci pointe vers la donnée ; il ne la déplace pas, comme un raccourci de bureau."),

  titre("OneLake et l'IA"),
  p(
    "Puisque toutes les charges de travail écrivent dans OneLake en format ouvert, Copilot et " +
      "les agents de données lisent **les mêmes données régies** que les rapports, sans pipeline " +
      "de préparation à part. Bien ingérer, préparer et gouverner, c'est déjà préparer l'IA.",
  ),

  titre("Les espaces de travail"),
  p(
    "Des **conteneurs logiques** qui regroupent données, rapports et autres ressources. Chacun a " +
      "ses propres autorisations : seuls les utilisateurs autorisés voient ou modifient son " +
      "contenu.",
  ),
  liste(
    "Séparent clairement les ressources, ce qui simplifie l'accès et la sécurité",
    "Permettent de régler les **ressources de calcul**, pour la performance et le coût",
    "S'intègrent à **Git** pour le contrôle de version et l'historique des modifications",
  ),

  titre("Administration et gouvernance"),
  tableau(
    ["Outil", "Rôle"],
    [
      [
        "**Portail d'administration**",
        "Groupes et autorisations, sources de données et passerelles, suivi de l'utilisation " +
          "et des performances",
      ],
      ["**API et SDK d'administration**", "Automatiser les tâches courantes, intégrer Fabric"],
      [
        "**Catalogue OneLake**",
        "Gouverner les données : étiquettes de confidentialité, métadonnées des éléments, état " +
          "d'actualisation",
      ],
    ],
  ),
  note(
    "OneLake est régi de façon centralisée tout en restant ouvert à la collaboration : les " +
      "données sont sécurisées au même endroit, donc faciles à trouver.",
  ),
];

export default contenu;
