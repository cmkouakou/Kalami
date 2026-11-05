/**
 * =============================================================
 *  Fichier    : introduction.ts (framework-de-modele)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Introduction » du module « Choisir un framework de
 *               modèle » : la filiation avec Analysis Services, et l'annonce des trois
 *               frameworks.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

import { etapes, memo, note, p, tableau, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Une section courte, mais qui annonce une chose importante : le moteur de modélisation " +
      "de Power BI n'est ni récent ni léger. C'est la même technologie mature qui anime Azure " +
      "Analysis Services et SQL Server Analysis Services, fruit de plus de deux décennies " +
      "d'investissement de Microsoft dans la BI d'entreprise.",
  ),
  memo(
    "Power BI Desktop ressemble à une application de bureau, mais sous le capot se trouve un " +
      "moteur d'entreprise. Une voiture familiale avec un moteur de course : le tableau de bord " +
      "est accueillant, la mécanique est sérieuse.",
  ),

  titre("Un seul outil, plusieurs frameworks"),
  p(
    "Power BI offre un choix au moment de concevoir le modèle. Ces frameworks existent pour " +
      "offrir une performance rapide, des résultats en quasi temps réel, ou les deux.",
  ),
  note(
    "Ce dernier mot porte tout l'arc du module : deux frameworks donnent chacun l'un de ces " +
      "avantages, et un troisième tente de donner les deux.",
  ),

  titre("Ce que le module couvre"),
  tableau(
    ["Quoi", "Objectif"],
    [
      ["Les frameworks", "Ce qu'est chacun d'eux"],
      ["Leurs avantages et limites", "Des compromis, pas seulement des fonctionnalités"],
      ["Les fonctions d'optimisation", "Faire performer chaque framework"],
      ["Les conseils pour choisir", "La décision elle-même"],
    ],
  ),
  note(
    "Le cadrage annonce « avantages et limites ». C'est un module sur les compromis : il n'y a " +
      "pas de meilleur framework, seulement celui qui convient à un ensemble de contraintes.",
  ),

  titre("Les cinq objectifs"),
  etapes(
    "Décrire les fondements du modèle Power BI",
    "Déterminer quand développer un modèle d'importation",
    "Déterminer quand développer un modèle DirectQuery",
    "Déterminer quand développer un modèle composite",
    "Choisir le framework approprié",
  ),
  {
    kind: "encadre",
    ton: "examen",
    texte:
      "Les objectifs 2, 3 et 4 commencent tous par « déterminer quand », pas par « comment " +
      "construire ». L'examen donne un scénario et demande quel framework convient : mémorise " +
      "les conditions, pas les chemins de clics.",
  },
];

export default contenu;
