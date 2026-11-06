/**
 * =============================================================
 *  Fichier    : activer-et-utiliser-fabric.ts (fabric)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Activer et utiliser Fabric » : les rôles
 *               d'administration, l'activation, les espaces de travail, le catalogue
 *               OneLake, les charges de travail et la couche IA.
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
    "Avant de créer quoi que ce soit, un administrateur active Fabric. On crée ensuite des " +
      "**espaces de travail**, puis des **éléments** issus des charges de travail. Le catalogue " +
      "OneLake aide à trouver les données, et Copilot accompagne chaque étape.",
  ),

  titre("Qui peut activer Fabric"),
  tableau(
    ["Rôle", "Pourquoi"],
    [
      ["Administrateur d'infrastructure (Fabric)", "Gère les paramètres de l'infrastructure"],
      ["Administrateur Power Platform", "Supervise les services Power Platform, dont Fabric"],
      ["Administrateur général", "Droits d'administration implicites sur toute l'organisation"],
    ],
  ),
  p(
    "L'activation se fait dans le service Power BI : **Admin > Paramètres du locataire**. Pour " +
      "toute l'organisation, ou pour des groupes Microsoft 365 ou Microsoft Entra précis. Les " +
      "administrateurs peuvent aussi déléguer ce droit au niveau de la **capacité**.",
  ),
  note("Sans Fabric ni Power BI dans l'organisation, une version d'essai gratuite existe."),

  titre("Les espaces de travail"),
  p(
    "Des environnements collaboratifs où l'on crée lakehouses, entrepôts, rapports… Les données " +
      "restent dans OneLake. La **vue de traçabilité** (lineage) montre le flux des données et " +
      "leurs dépendances.",
  ),
  p("Dans les paramètres de l'espace de travail, on règle :"),
  liste(
    "Le type de licence qui donne accès aux fonctionnalités Fabric",
    "L'accès à OneDrive",
    "Une connexion Azure Data Lake Storage Gen2",
    "L'intégration Git",
    "Les paramètres de charge de travail Spark",
  ),
  examen(
    "Les **quatre rôles** d'espace de travail : administrateur, membre, contributeur, " +
      "visionneuse. Ils s'appliquent à **tous** les éléments de l'espace ; pour un contrôle plus " +
      "fin, on passe aux autorisations au niveau des éléments.",
  ),

  titre("Le catalogue OneLake"),
  p(
    "Pour trouver les sources de données de l'organisation, les explorer et s'y connecter. On " +
      "n'y voit que ce qui est partagé avec soi. On affine par espace de travail ou domaine, par " +
      "catégorie par défaut, par mot-clé ou par type d'élément.",
  ),

  titre("Les charges de travail"),
  tableau(
    ["Charge de travail", "Sert à"],
    [
      ["Ingénierie des données", "Lakehouses et flux de travail sur le patrimoine de données"],
      ["Data Factory", "Ingérer, transformer et orchestrer"],
      ["Data Warehouse", "Combiner plusieurs sources dans un entrepôt"],
      ["Real-Time Intelligence", "Traiter et analyser les données en continu"],
      ["Solutions industrielles", "Des solutions de données prêtes à l'emploi"],
      ["Science des données", "Tendances, valeurs aberrantes et prédictions par ML"],
      ["Bases de données", "Créer et gérer des bases, insérer et interroger"],
      ["IQ (préversion)", "Organiser les données selon le langage de l'entreprise"],
      ["Power BI", "Rapports et tableaux de bord"],
    ],
  ),
  p(
    "Fabric intègre Power BI, Azure Synapse Analytics et Azure Data Factory. Il prend en charge " +
      "le **maillage de données** (data mesh) : propriété décentralisée, gouvernance centralisée.",
  ),

  titre("La couche IA"),
  tableau(
    ["Fonction", "Ce qu'elle fait"],
    [
      [
        "**Fabric IQ** (préversion)",
        "Une **ontologie** définit concepts métier, relations et règles, pour que les agents " +
          "raisonnent en langage métier plutôt qu'en tables brutes",
      ],
      ["Foundry IQ", "Relie données structurées et non structurées (Azure, SharePoint, web)"],
      ["Work IQ", "Capte documents, réunions et conversations pour informer les agents"],
      [
        "**Agents de données**",
        "Traduisent une question en langage naturel en requête sur lakehouses, entrepôts et " +
          "modèles sémantiques",
      ],
    ],
  ),
  p("**Copilot dans Fabric** est présent dans toutes les charges de travail :"),
  liste(
    "Code : suggestions dans les notebooks, SQL depuis une description, questions traduites en " +
      "**KQL**",
    "Data Factory : aide à la transformation, avec explication de la logique en langage simple",
    "Power BI : génère des rapports, résume des pages, répond aux questions sur les données",
  ),
  note(
    "Copilot est **activé par défaut**. On le désactive, ou on le limite à des groupes de " +
      "sécurité ou à une capacité, dans Admin > Paramètres du locataire.",
  ),
  memo(
    "Activer (paramètres du locataire) → organiser (espaces de travail) → trouver (catalogue) " +
      "→ créer (charges de travail) → s'aider (Copilot).",
  ),
];

export default contenu;
