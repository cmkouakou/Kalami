/**
 * =============================================================
 *  Fichier    : equipes-de-donnees.ts (fabric)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Les équipes de données et Fabric » : les défis du
 *               travail en silos, puis ce que chaque rôle fait dans Fabric.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import { examen, memo, p, tableau, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Dans un processus d'analytique classique, chaque rôle travaille dans son outil et attend " +
      "les autres. Fabric réunit ces outils dans une plateforme SaaS : les rôles collaborent sur " +
      "les mêmes données, sans silos ni efforts en double.",
  ),

  titre("Les défis d'avant"),
  tableau(
    ["Rôle", "Difficulté"],
    [
      [
        "Ingénieur données",
        "Prépare les données pour les analystes : beaucoup de coordination, des retards et des " +
          "malentendus",
      ],
      [
        "Analyste de données",
        "Doit transformer en aval avant Power BI : long, et le contexte manque",
      ],
      [
        "Scientifique des données",
        "Peine à intégrer la science des données à des systèmes existants complexes",
      ],
    ],
  ),

  titre("Qui fait quoi dans Fabric"),
  tableau(
    ["Rôle", "Outils et tâches dans Fabric"],
    [
      [
        "**Ingénieur données**",
        "Ingère et charge dans OneLake avec les **pipelines** ; stocke dans des **lakehouses** " +
          "(Delta-Parquet) ; **notebooks** pour les transformations complexes",
      ],
      [
        "**Ingénieur en analyse**",
        "Fait le pont : organise les **entrepôts de données**, veille à la qualité, crée les " +
          "**modèles sémantiques** Power BI",
      ],
      [
        "**Analyste de données**",
        "Transforme en amont avec les **dataflows** ; se connecte à OneLake en **Direct Lake** ; " +
          "crée les rapports Power BI",
      ],
      [
        "**Scientifique des données**",
        "Notebooks **Python** et **Spark** pour le Machine Learning ; lakehouses ; déploiement " +
          "avec **Azure Machine Learning**",
      ],
      [
        "**Utilisateur low-code / développeur citoyen**",
        "Trouve les jeux de données dans le **catalogue OneLake** ; modèles Power BI ; dataflows " +
          "pour l'ETL simple ; questions en langage naturel à **Copilot**",
      ],
    ],
  ),
  examen(
    "Pour l'analyste PL-300, le point clé est **Direct Lake** : la connexion directe à OneLake " +
      "réduit les transformations en aval. Et les dataflows déplacent la transformation en " +
      "amont.",
  ),
  memo(
    "Pipelines et notebooks → ingénieur. Entrepôt et modèle sémantique → ingénieur en analyse. " +
      "Dataflows, Direct Lake et rapports → analyste.",
  ),

  titre("Chaque rôle prépare l'IA"),
  p(
    "Des données propres et bien régies dans OneLake sont la base de Copilot et des agents IA. " +
      "Des modèles sémantiques cohérents leur donnent le contexte métier pour répondre juste. " +
      "Les prédictions des scientifiques peuvent aussi nourrir ces agents.",
  ),
];

export default contenu;
