/**
 * =============================================================
 *  Fichier    : fondements-du-modele.ts (framework-de-modele)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Les fondements du modèle Power BI » : les sept
 *               termes qui préparent le choix d'un framework, de la requête analytique
 *               au schéma en étoile.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

import { examen, memo, note, p, tableau, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Sept termes, et ils s'empilent comme les barreaux d'une échelle. Impossible de choisir un " +
      "framework sans savoir ce qu'est un modèle, ce qui l'interroge, et comment ses tables sont " +
      "stockées.",
  ),
  memo(
    "L'échelle, de bas en haut : modèle de données, dataset, requête analytique, modèle " +
      "tabulaire, schéma en étoile, mode de stockage, framework. Chaque barreau s'appuie sur le " +
      "précédent.",
  ),

  titre("1. Modèle de données"),
  p("Une ressource de données interrogeable, optimisée pour l'analytique."),
  tableau(
    ["Langage", "Qui l'utilise"],
    [
      ["DAX (Data Analysis Expressions)", "Power BI"],
      ["MDX (Multidimensional Expressions)", "Analyser dans Excel"],
      ["L'un ou l'autre", "Rapports paginés"],
    ],
  ),
  note(
    "Modèle de données, modèle sémantique (surtout en contexte d'entreprise) et simplement " +
      "modèle désignent la même chose.",
  ),

  titre("2. Dataset Power BI"),
  p(
    "Le même modèle, après publication. Développé dans Power BI Desktop, il devient un dataset " +
      "une fois publié dans un espace de travail du service Power BI : un artefact qui sert de " +
      "source de données aux visualisations.",
  ),
  examen(
    "Tous les datasets ne viennent pas de Power BI Desktop. Certains représentent des " +
      "connexions à des modèles hébergés dans AAS ou SSAS, d'autres des structures en temps réel " +
      "— push, streaming, hybrid datasets.",
  ),
  memo(
    "Modèle = le plan sur ta machine. Dataset = la même chose, publiée et partageable. Un seul " +
      "objet, deux noms selon l'endroit où il vit.",
  ),

  titre("3. Requête analytique"),
  p(
    "Quand Power BI visualise des données, il prépare et envoie une requête analytique, qui " +
      "produit un résultat facile à comprendre pour une personne. Elle comporte trois phases, " +
      "exécutées dans cet ordre.",
  ),
  tableau(
    ["Phase", "Aussi appelée", "Visible dans le résultat ?"],
    [
      ["1. Filtrer", "Slicing (découpage)", "Non"],
      ["2. Grouper", "Dicing", "Oui"],
      ["3. Résumer", "—", "Oui, la valeur"],
    ],
  ),
  p(
    "Le filtrage restreint à un sous-ensemble : filtres de rapport, de page ou de visuel, " +
      "segments, sécurité au niveau des lignes, ou mesures. Le groupement divise le résultat, et " +
      "chaque groupe est lui aussi un filtre — mais ses valeurs, elles, sont visibles. Le résumé " +
      "produit une valeur unique, par agrégation d'une colonne ou par une mesure DAX.",
  ),
  p(
    "L'exemple du cours : un segment réglé sur 2021 filtre, les colonnes des quatre trimestres " +
      "groupent, et la hauteur de chaque colonne résume les ventes du trimestre.",
  ),
  examen(
    "F-G-R, dans cet ordre. La distinction testée : les valeurs de filtre ne sont pas visibles " +
      "dans le résultat, celles de groupe le sont. Un segment est un filtre ; un axe est un groupe.",
  ),

  titre("4. Modèle tabulaire"),
  p(
    "Un modèle Power BI est un modèle tabulaire : une ou plusieurs tables de colonnes, pouvant " +
      "aussi contenir relations, hiérarchies et calculs. C'est pour cette raison que la connexion " +
      "active fonctionne entre Power BI et Azure Analysis Services : même moteur.",
  ),

  titre("5. Conception en schéma en étoile"),
  p(
    "La façon recommandée de produire un modèle tabulaire optimisé. Elle exige de classer chaque " +
      "table dans l'une de deux catégories.",
  ),
  tableau(
    ["Type", "Contient", "Exemples"],
    [
      [
        "Dimension",
        "Des entités métier — les choses que l'on modélise",
        "Produits, personnes, lieux, et le temps lui-même",
      ],
      [
        "Fait",
        "Des observations ou événements",
        "Commandes, soldes de stock, taux de change, relevés",
      ],
    ],
  ),
  p(
    "Une table de faits contient des colonnes de clés de dimension et des colonnes de mesures " +
      "numériques. Elle occupe le centre de l'étoile ; les dimensions en forment les branches.",
  ),
  note(
    "Dans une requête analytique, les colonnes de dimension filtrent ou groupent, et les " +
      "colonnes de faits sont résumées. Cette seule phrase explique toute la conception : le " +
      "schéma en étoile n'est pas esthétique, il épouse le fonctionnement des requêtes.",
  ),
  memo("Les dimensions décrivent, les faits mesurent. Selon quoi ? Combien ?"),

  titre("6. Mode de stockage des tables"),
  p(
    "Chaque table du modèle possède une propriété de mode de stockage, qui détermine si ses " +
      "données sont stockées dans le modèle.",
  ),
  tableau(
    ["Mode", "Comportement"],
    [
      ["Import", "Les requêtes lisent les données mises en cache dans le modèle"],
      ["DirectQuery", "Les requêtes passent à travers vers la source"],
      [
        "Dual",
        "L'un ou l'autre : Power BI choisit le plan le plus efficace, en privilégiant le cache",
      ],
    ],
  ),
  examen(
    "Les tables calculées font exception : elles n'ont pas de propriété de mode de stockage, " +
      "puisqu'elles sont calculées dans le modèle.",
  ),

  titre("7. Framework de modèle"),
  p("Les réglages de mode de stockage déterminent le framework."),
  tableau(
    ["Framework", "Définition"],
    [
      ["Modèle d'importation", "Toutes les tables en mode Import"],
      ["Modèle DirectQuery", "Toutes les tables en DirectQuery, dans le même groupe de sources"],
      ["Modèle composite", "Plus d'un groupe de sources"],
    ],
  ),
  memo(
    "On ne choisit pas un framework dans un menu : on règle les modes de stockage table par " +
      "table, et le framework en découle.",
  ),
  note(
    "La notion de groupe de sources est introduite ici sans être définie — le module l'explique " +
      "plus loin. C'est elle qui rend un modèle composite composite.",
  ),
];

export default contenu;
