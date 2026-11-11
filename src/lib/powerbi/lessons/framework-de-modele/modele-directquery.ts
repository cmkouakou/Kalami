/**
 * =============================================================
 *  Fichier    : modele-directquery.ts (framework-de-modele)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Déterminer quand développer un modèle
 *               DirectQuery » : la notion de groupe de sources, les quatre raisons
 *               de choisir DirectQuery, ses limites et deux leviers de performance.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import {
  examen,
  liste,
  chaine,
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
    "Un modèle DirectQuery regroupe des tables en mode de stockage **DirectQuery** qui " +
      "appartiennent toutes au **même groupe de sources**. Aucune donnée n'est copiée : chaque " +
      "requête d'un rapport est transmise à la source sous-jacente.",
  ),
  memo(
    "Import = une photocopie rangée dans le classeur. DirectQuery = un coup de téléphone à " +
      "l'archiviste à chaque question. Toujours à jour, mais on dépend de sa rapidité.",
  ),

  titre("Le groupe de sources, enfin défini"),
  p("Un groupe de sources est un ensemble de tables du modèle liées à une même source."),
  tableau(
    ["Type", "Contenu", "Combien par modèle ?"],
    [
      [
        "Importation",
        "Toutes les tables en mode Import, tables calculées comprises",
        "Un seul",
      ],
      ["DirectQuery", "Les tables DirectQuery liées à une source précise", "Un par source"],
    ],
  ),
  examen(
    "Un modèle d'importation et un modèle DirectQuery n'ont chacun qu'**un** groupe de sources. " +
      "Dès qu'il y en a plusieurs, le framework s'appelle **composite**.",
  ),

  chaine(
    [
      { nom: "Rapport" },
      { nom: "Modèle DirectQuery", modele: true },
      { nom: "Base de données" },
    ],
    ["requêtes", "requêtes"],
    "Le modèle ne stocke rien : il relaie. Chaque interaction du rapport déclenche une " +
      "requête réelle vers la base.",
  ),
  titre("Quatre raisons de choisir DirectQuery"),
  tableau(
    ["Besoin", "Pourquoi DirectQuery répond"],
    [
      [
        "Sources volumineuses ou qui changent vite",
        "Pas d'actualisation ; un entrepôt entier ne s'importe pas. Résultats en quasi temps " +
          "réel",
      ],
      [
        "Appliquer la RLS de la source",
        "La base applique ses propres règles de sécurité au niveau des lignes",
      ],
      [
        "Souveraineté des données",
        "Les données ne quittent pas les locaux : connexion à une source locale",
      ],
      [
        "Datasets spécialisés",
        "Se connecter à un dataset Power BI ou à AAS pour l'étendre localement",
      ],
    ],
  ),
  note(
    "La RLS de la source ne fonctionne qu'avec certaines bases relationnelles et exige de " +
      "configurer l'authentification unique (SSO) pour la source du dataset.",
  ),
  note(
    "Pour la souveraineté, le cours mentionne aussi une alternative : installer Power BI Report " +
      "Server pour produire les rapports sur place.",
  ),

  titre("Le chaînage de modèles"),
  p(
    "DirectQuery vise d'ordinaire les bases relationnelles, parce que Power BI doit traduire " +
      "les requêtes analytiques en requêtes natives. Exception notable : on peut se connecter à " +
      "un dataset Power BI ou à un modèle Azure Analysis Services et le convertir en modèle " +
      "local DirectQuery.",
  ),
  tableau(
    ["Terme", "Sens"],
    [
      ["Modèle distant", "Le modèle d'origine"],
      ["Modèle local", "Le nouveau dataset qui s'y branche"],
      ["Modèles chaînés", "Les deux, reliés — jusqu'à trois modèles"],
    ],
  ),
  p(
    "Le plus simple est de renommer des objets ou d'ajouter des mesures dans le modèle local. " +
      "On peut aussi y ajouter des colonnes ou tables calculées, ou de nouvelles tables Import " +
      "ou DirectQuery — mais cela crée de nouveaux groupes de sources, et le modèle devient " +
      "composite.",
  ),
  examen("Chaînage : trois modèles au maximum."),

  titre("Les limites principales"),
  liste(
    "**Toutes les sources ne sont pas prises en charge** : surtout les grands systèmes " +
      "relationnels, plus les datasets Power BI et AAS.",
    "**Transformations Power Query limitées** : elles doivent se traduire en requêtes natives. " +
      "Pivot et unpivot, par exemple, sont impossibles.",
    "**Performances parfois lentes**, surtout si la source n'est pas optimisée (pas d'index ni " +
      "de vues matérialisées) ou manque de ressources.",
    "**Impact sur la source** : les requêtes analytiques peuvent ralentir toutes ses charges " +
      "de travail, y compris les opérations transactionnelles (OLTP).",
  ),
  examen(
    "Pivot et unpivot impossibles en DirectQuery : un détail concret, facile à transformer en " +
      "question à choix multiples.",
  ),

  titre("Améliorer les performances"),
  tableau(
    ["Levier", "En pratique"],
    [
      [
        "Optimiser la source",
        "Index, vues matérialisées, ressources suffisantes pour toutes les charges",
      ],
      [
        "Tables d'agrégation définies par l'utilisateur",
        "Tables masquées qui répondent aux requêtes de grain supérieur sur les grandes tables " +
          "de faits",
      ],
    ],
  ),
  p(
    "Une table d'agrégation est masquée aux utilisateurs, aux calculs et à la RLS. Elle peut " +
      "être en DirectQuery (et interroger une vue matérialisée de la source) ou en Import ; on " +
      "peut aussi activer les agrégations automatiques.",
  ),
  note(
    "Toujours travailler avec le propriétaire de la base : il doit comprendre la charge " +
      "supplémentaire qu'un modèle DirectQuery fait peser sur son système.",
    "Conseil du cours",
  ),
];

export default contenu;
