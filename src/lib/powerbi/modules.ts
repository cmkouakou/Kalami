/**
 * =============================================================
 *  Fichier    : modules.ts
 *  Projet     : Kalami Données
 *  Description: Carte du parcours de préparation à la certification Microsoft PL-300 :
 *               modules, leçons, durées et lien vers la page officielle Microsoft Learn
 *               de chaque leçon. Ne contient que la structure ; le texte des leçons vit
 *               dans lessons/ et les questions dans quiz/.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lessons/index.ts (registre des résumés écrits)
 * =============================================================
 */

/** Une leçon : une page de Microsoft Learn, résumée. */
export interface Lesson {
  /** Identifiant dans l'adresse, unique au sein du module. */
  slug: string;
  /** Titre affiché. */
  titre: string;
  /** Une phrase sur ce que la leçon apporte, montrée dans la liste. */
  accroche: string;
  /** Durée annoncée par Microsoft Learn, en minutes. */
  minutes: number;
  /** Page officielle correspondante (version française du site). */
  microsoftLearn?: string;
}

/** Un module : une unité de Microsoft Learn, ou un atelier maison. */
export interface Module {
  slug: string;
  /** Rang dans le parcours, affiché devant le titre. */
  rang: number;
  titre: string;
  /** Deux ou trois lignes sur ce que le module couvre. */
  resume: string;
  /** Page officielle du module. */
  microsoftLearn?: string;
  /** Un atelier n'est pas un module Microsoft : il s'affiche à part. */
  atelier?: boolean;
  lecons: Lesson[];
}

import { compterResumes } from "@/lib/powerbi/lessons";

const LEARN = "https://learn.microsoft.com/fr-ca/training/modules";

// ==================== PARCOURS ====================

/** Les modules du parcours, dans l'ordre où ils sont suivis. */
export const MODULES: Module[] = [
  {
    slug: "fabric",
    rang: 1,
    titre: "Découvrir Microsoft Fabric",
    resume:
      "Le socle sur lequel Power BI s'appuie désormais : un stockage unique (OneLake), " +
      "des espaces de travail, et les rôles qui collaborent autour des mêmes données.",
    microsoftLearn: `${LEARN}/introduction-end-analytics-microsoft-fabric/`,
    lecons: [
      {
        slug: "analytique-de-bout-en-bout",
        titre: "L'analytique de bout en bout avec Fabric",
        accroche: "OneLake, raccourcis, espaces de travail et gouvernance centralisée.",
        minutes: 7,
        microsoftLearn: `${LEARN}/introduction-end-analytics-microsoft-fabric/2-explore-end-to-end-analytics`,
      },
      {
        slug: "equipes-de-donnees",
        titre: "Les équipes de données et Fabric",
        accroche: "Qui fait quoi, et pourquoi le mode Direct Lake change le travail de l'analyste.",
        minutes: 4,
        microsoftLearn: `${LEARN}/introduction-end-analytics-microsoft-fabric/3-explore-data-teams-microsoft-fabric`,
      },
      {
        slug: "activer-et-utiliser-fabric",
        titre: "Activer et utiliser Fabric",
        accroche: "Rôles d'administration, charges de travail, catalogue OneLake et couche IA.",
        minutes: 7,
        microsoftLearn: `${LEARN}/introduction-end-analytics-microsoft-fabric/4-enable-use-microsoft-fabric`,
      },
    ],
  },
  {
    slug: "obtenir-les-donnees",
    rang: 2,
    titre: "Obtenir les données dans Power BI",
    resume:
      "Quatre familles de sources — fichiers, bases relationnelles, NoSQL et services en " +
      "ligne — puis les modes de stockage, la performance et les erreurs d'importation.",
    microsoftLearn: `${LEARN}/get-data/`,
    lecons: [
      {
        slug: "fichiers",
        titre: "Obtenir des données depuis des fichiers",
        accroche: "Fichier plat, emplacement local ou cloud, Navigateur, Charger ou Transformer.",
        minutes: 10,
        microsoftLearn: `${LEARN}/get-data/2-files`,
      },
      {
        slug: "bases-relationnelles",
        titre: "Obtenir des données depuis une base relationnelle",
        accroche: "Connexion SQL Server, authentification, requête SQL et bonnes pratiques.",
        minutes: 14,
        microsoftLearn: `${LEARN}/get-data/3-relational-data`,
      },
      {
        slug: "rapports-dynamiques",
        titre: "Créer des rapports dynamiques avec des paramètres",
        accroche: "Un paramètre à valeur unique, puis une fonction appelée sur toute une liste.",
        minutes: 6,
        microsoftLearn: `${LEARN}/get-data/4-dynamic-reports-parameters`,
      },
      {
        slug: "nosql",
        titre: "Obtenir des données depuis une base NoSQL",
        accroche: "Cosmos DB, documents JSON, et le bouton Développer qui aplatit les Record.",
        minutes: 5,
        microsoftLearn: `${LEARN}/get-data/5-nosql-database`,
      },
      {
        slug: "services-en-ligne",
        titre: "Obtenir des données depuis des services en ligne",
        accroche: "SharePoint et consorts : la règle de l'URL du site, pas du fichier.",
        minutes: 5,
        microsoftLearn: `${LEARN}/get-data/6-online-services`,
      },
      {
        slug: "mode-de-stockage",
        titre: "Choisir un mode de stockage",
        accroche: "Import, DirectQuery, Dual — et les trois raisons de quitter l'importation.",
        minutes: 6,
        microsoftLearn: `${LEARN}/get-data/7-storage-mode`,
      },
      {
        slug: "analysis-services",
        titre: "Obtenir des données depuis Azure Analysis Services",
        accroche: "Un modèle déjà construit : MDX ou DAX, et la connexion active.",
        minutes: 5,
        microsoftLearn: `${LEARN}/get-data/8-analysis-services`,
      },
      {
        slug: "performance",
        titre: "Corriger les problèmes de performance",
        accroche: "Le query folding, ses trois briseurs, et les diagnostics de requête.",
        minutes: 10,
        microsoftLearn: `${LEARN}/get-data/9-performance-issues`,
      },
      {
        slug: "erreurs-import",
        titre: "Résoudre les erreurs d'importation",
        accroche: "Délai dépassé, table Excel absente, fichier introuvable, colonnes vides.",
        minutes: 7,
        microsoftLearn: `${LEARN}/get-data/10-data-import-errors`,
      },
    ],
  },
  {
    slug: "nettoyer-transformer",
    rang: 3,
    titre: "Nettoyer, transformer et charger",
    resume:
      "Tout ce qui se passe dans Power Query avant le chargement : mise en forme, " +
      "simplification, types, combinaison de tables, profilage et code M.",
    microsoftLearn: `${LEARN}/clean-data-power-bi/`,
    lecons: [
      {
        slug: "introduction",
        titre: "Pourquoi nettoyer les données",
        accroche: "Cinq symptômes de données sales, cinq bénéfices à les corriger.",
        minutes: 2,
        microsoftLearn: `${LEARN}/clean-data-power-bi/1-introduction`,
      },
      {
        slug: "mise-en-forme",
        titre: "Mettre en forme les données initiales",
        accroche: "En-têtes, lignes et colonnes à retirer, dépivotage et pivot.",
        minutes: 18,
        microsoftLearn: `${LEARN}/clean-data-power-bi/2-shape-data`,
      },
      {
        slug: "simplifier-la-structure",
        titre: "Simplifier la structure des données",
        accroche: "Renommer, remplacer des valeurs, traiter les nulls, dédoublonner.",
        minutes: 8,
        microsoftLearn: `${LEARN}/clean-data-power-bi/3-data-structure`,
      },
      {
        slug: "types-de-colonnes",
        titre: "Évaluer et changer les types de colonnes",
        accroche: "La détection sur 1 000 lignes, et ce qu'un mauvais type empêche de faire.",
        minutes: 10,
        microsoftLearn: `${LEARN}/clean-data-power-bi/4-column-data-types`,
      },
      {
        slug: "combiner-des-tables",
        titre: "Combiner plusieurs tables en une seule",
        accroche: "Ajouter des lignes ou fusionner des colonnes, et les trois jointures.",
        minutes: 8,
        microsoftLearn: `${LEARN}/clean-data-power-bi/5-combine-tables`,
      },
      {
        slug: "profiler-les-donnees",
        titre: "Profiler les données",
        accroche: "Qualité, distribution, profil de colonne — et distinctes contre uniques.",
        minutes: 20,
        microsoftLearn: `${LEARN}/clean-data-power-bi/6-profile-data`,
      },
      {
        slug: "editeur-avance",
        titre: "L'Éditeur avancé et le code M",
        accroche: "La structure let / in, et pourquoi réordonner les étapes casse tout.",
        minutes: 4,
        microsoftLearn: `${LEARN}/clean-data-power-bi/7-advanced-editor`,
      },
    ],
  },
  {
    slug: "framework-de-modele",
    rang: 4,
    titre: "Choisir un framework de modèle",
    resume:
      "Le premier module de niveau intermédiaire : moins de procédures, plus de décisions. " +
      "Importation, DirectQuery ou composite, et le raisonnement qui mène à l'un des trois.",
    microsoftLearn: `${LEARN}/choose-power-bi-model-framework/`,
    lecons: [
      {
        slug: "introduction",
        titre: "Introduction",
        accroche: "Un seul outil, plusieurs frameworks : performance, temps réel, ou les deux.",
        minutes: 3,
        microsoftLearn: `${LEARN}/choose-power-bi-model-framework/1-introduction`,
      },
      {
        slug: "fondements-du-modele",
        titre: "Les fondements du modèle Power BI",
        accroche: "Sept termes, de la requête analytique au schéma en étoile.",
        minutes: 9,
        microsoftLearn: `${LEARN}/choose-power-bi-model-framework/2-describe-power-bi-model-fundamentals`,
      },
      {
        slug: "modele-importation",
        titre: "Quand développer un modèle d'importation",
        accroche: "À venir.",
        minutes: 7,
        microsoftLearn: `${LEARN}/choose-power-bi-model-framework/3-determine-when-to-develop-import-model`,
      },
      {
        slug: "modele-directquery",
        titre: "Quand développer un modèle DirectQuery",
        accroche: "À venir.",
        minutes: 9,
        microsoftLearn: `${LEARN}/choose-power-bi-model-framework/4-determine-when-to-develop-directquery-model`,
      },
      {
        slug: "modele-composite",
        titre: "Quand développer un modèle composite",
        accroche: "À venir.",
        minutes: 7,
        microsoftLearn: `${LEARN}/choose-power-bi-model-framework/5-determine-when-to-develop-composite-model`,
      },
      {
        slug: "choisir-un-framework",
        titre: "Choisir un framework",
        accroche: "À venir.",
        minutes: 3,
        microsoftLearn: `${LEARN}/choose-power-bi-model-framework/6-choose-model-framework`,
      },
    ],
  },
];

// ==================== ACCÈS ====================

/** Retourne un module par son identifiant d'adresse, ou undefined. */
export function getModule(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug);
}

/** Retourne une leçon et son module, ou undefined si l'un des deux manque. */
export function getLesson(
  moduleSlug: string,
  lessonSlug: string,
): { module: Module; lecon: Lesson } | undefined {
  const trouve = getModule(moduleSlug);
  const lecon = trouve?.lecons.find((l) => l.slug === lessonSlug);
  return trouve && lecon ? { module: trouve, lecon } : undefined;
}

/** Leçon suivante et précédente dans le parcours, tous modules confondus. */
export function getVoisines(
  moduleSlug: string,
  lessonSlug: string,
): { precedente?: { module: Module; lecon: Lesson }; suivante?: { module: Module; lecon: Lesson } } {
  const plat = MODULES.flatMap((module) => module.lecons.map((lecon) => ({ module, lecon })));
  const i = plat.findIndex((e) => e.module.slug === moduleSlug && e.lecon.slug === lessonSlug);
  if (i === -1) return {};
  return { precedente: plat[i - 1], suivante: plat[i + 1] };
}

/** Nombre de résumés écrits, sur le nombre total de leçons du parcours. */
export function getAvancement(): { pretes: number; total: number } {
  return { pretes: compterResumes(), total: MODULES.flatMap((m) => m.lecons).length };
}
