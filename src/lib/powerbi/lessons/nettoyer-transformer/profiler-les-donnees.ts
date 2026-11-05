/**
 * =============================================================
 *  Fichier    : profiler-les-donnees.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Profiler les données » : qualité, distribution et
 *               profil de colonne, la distinction entre valeurs distinctes et uniques,
 *               et le piège des mille premières lignes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

import { examen, liste, memo, note, p, tableau, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "La section la plus investigatrice du module. Toutes les autres supposaient qu'on savait " +
      "déjà ce qui clochait dans les données ; le profilage, c'est comment le découvrir.",
  ),
  memo(
    "Un bilan de santé pour les données : on n'attend pas les symptômes, on passe les tests " +
      "d'abord. Tension artérielle, courbe de distribution, bilan sanguin complet.",
  ),
  p(
    "Profiler, c'est étudier les nuances des données : déterminer les anomalies, examiner les " +
      "structures sous-jacentes, et interroger les statistiques — nombre de lignes, distribution " +
      "des valeurs, minimums et maximums, moyennes.",
  ),

  titre("Examiner les structures : l'onglet Modèle"),
  p(
    "Avant d'examiner les données dans Power Query, on apprend d'abord les structures " +
      "sous-jacentes sous l'onglet Modèle : propriétés des colonnes et des tables, bouton " +
      "Transformer les données, et Gérer les relations.",
  ),

  titre("Activer les outils"),
  p("Éditeur Power Query, ruban Affichage, section Aperçu des données. Trois options à cocher."),
  tableau(
    ["Option", "Ce qu'elle affiche"],
    [
      ["Qualité de la colonne", "Pourcentages de valeurs valides, en erreur et vides"],
      ["Distribution de la colonne", "La distribution, plus les décomptes distinctes et uniques"],
      ["Profil de colonne", "Statistiques détaillées et graphique de distribution des valeurs"],
    ],
  ),
  examen(
    "Par défaut, Power Query n'examine que les 1 000 premières lignes. Pour changer : cliquer " +
      "sur l'état du profilage dans la barre d'état, puis « Profilage de colonne basé sur " +
      "l'ensemble du jeu de données ». C'est le même chiffre que la détection automatique des " +
      "types, et le même piège : un échantillon peut induire en erreur.",
  ),

  titre("Qualité de la colonne"),
  p("L'objectif énoncé clairement : dans une situation idéale, 100 % des données sont valides."),

  titre("Distribution : distinctes contre uniques"),
  tableau(
    ["Décompte", "Inclut", "Définition"],
    [
      ["Distinctes", "Doublons et nulls", "Toutes les valeurs différentes d'une colonne"],
      ["Uniques", "Ni doublons ni nulls", "Les valeurs qui n'apparaissent qu'une seule fois"],
    ],
  ),
  p(
    "Sur la colonne A, A, B, C, null : quatre valeurs distinctes (A, B, C, null) et deux uniques " +
      "(B et C — A se répète, null est exclu).",
  ),
  memo(
    "Distinctes = les valeurs Différentes qui existent. Uniques = celles employées Une seule " +
      "fois. Distinctes est donc toujours supérieur ou égal à uniques.",
  ),

  titre("Profil de colonne"),
  p("Deux moitiés. D'abord les statistiques de colonne."),
  liste(
    "Nombre de lignes — vérifie que l'import a réussi : cent lignes à la source, cent lignes importées.",
    "Valeurs aberrantes, lignes et chaînes vides.",
    "Minimum et maximum — sur du texte, ce sont la première et la dernière valeur dans l'ordre alphabétique.",
    "Sur une colonne numérique seulement : zéros, nulls, moyenne, écart-type, valeurs paires et impaires.",
  ),
  p(
    "Ensuite le graphique de distribution des valeurs, qui donne le décompte de chaque valeur " +
      "distincte. Une valeur qui apparaît bien plus souvent que les autres indique où commencer " +
      "l'investigation.",
  ),

  titre("L'histoire qui justifie le profilage"),
  p(
    "En parcourant des données de factures, on remarque que quelques vendeurs apparaissent " +
      "exactement le même nombre de fois. Le même motif se retrouve dans la colonne Profit, puis " +
      "dans d'autres tables. L'investigation révèle des données erronées qui devaient être " +
      "actualisées.",
  ),
  note(
    "Sans ce graphique, l'erreur n'aurait pas été vue aussi vite. Une distribution suspectement " +
      "régulière est l'équivalent d'une empreinte au mauvais endroit : les données réelles sont " +
      "inégales, et quand c'est trop propre, quelque chose d'artificiel s'est produit.",
  ),
];

export default contenu;
