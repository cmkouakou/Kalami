/**
 * =============================================================
 *  Fichier    : combiner-des-tables.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Combiner plusieurs tables en une seule » : ajouter
 *               (empiler des lignes) ou fusionner (joindre des colonnes), et les types de
 *               jointure.
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
  tableau,
  titre,
  type LessonContent,
} from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Deux façons de combiner des tables dans Power Query : **ajouter** des requêtes, qui " +
      "empile des lignes, et **fusionner** des requêtes, qui ajoute des colonnes en s'appuyant " +
      "sur une clé commune.",
  ),
  memo(
    "Ajouter = empiler (plus de lignes). Fusionner = juxtaposer (plus de colonnes, grâce à une " +
      "clé).",
  ),

  titre("Quand combiner"),
  liste(
    "Trop de tables, et un modèle devenu difficile à parcourir",
    "Plusieurs tables qui jouent un rôle semblable",
    "Une table d'une ou deux colonnes qui pourraient vivre dans une autre",
    "Le besoin de colonnes de plusieurs tables dans une même colonne personnalisée",
  ),

  titre("Ajouter des requêtes"),
  p(
    "Une table de 300 lignes ajoutée à une table de 100 lignes en donne 400. Le scénario : " +
      "une liste unique des coordonnées des employés, fournisseurs et clients, à partir de " +
      "**HR.Employees**, **Production.Suppliers** et **Sales.Customers**.",
  ),
  examen(
    "Pour un ajout, les colonnes doivent porter **le même nom** dans toutes les tables. Le " +
      "cours remet d'abord chaque table en forme avec quatre colonnes identiques : ID, " +
      "société, nom, téléphone.",
  ),
  tableau(
    ["Option d'Accueil > Ajouter des requêtes", "Résultat"],
    [
      ["**Ajouter les requêtes comme nouvelles**", "Une nouvelle requête contenant le tout"],
      ["**Ajouter des requêtes**", "Les lignes sont ajoutées à une table existante"],
    ],
  ),
  p(
    "Pour une table principale, on choisit « comme nouvelles », puis on fait passer les " +
      "tables de « Tables disponibles » à « Tables à ajouter ».",
  ),

  titre("Fusionner des requêtes"),
  p(
    "La fusion combine deux tables sur une **colonne commune**, à la manière d'un JOIN en " +
      "SQL. Exemple : réunir **Orders** et **OrderDetails** sur **OrderID**.",
  ),
  etapes(
    "Accueil > **Fusionner les requêtes** > Fusionner les requêtes comme nouvelles",
    "Choisir les deux tables dans les listes déroulantes",
    "Sélectionner la colonne commune dans chacune",
    "Choisir le type de jointure, puis OK",
  ),

  titre("Les types de jointure du cours"),
  tableau(
    ["Jointure", "Lignes conservées"],
    [
      [
        "Externe gauche",
        "Toutes celles de la première table, et les correspondances de la seconde",
      ],
      ["Externe entière", "Toutes celles des deux tables"],
      ["Interne", "Seulement celles qui correspondent dans les deux tables"],
    ],
  ),
  note("Pour les commandes et leurs détails, le cours retient la jointure externe gauche."),
  examen(
    "Une question classique décrit le résultat voulu et demande la jointure : « toutes les " +
      "commandes, même sans détail » → externe gauche ; « seulement les correspondances » → " +
      "interne ; « tout, des deux côtés » → externe entière.",
  ),
];

export default contenu;
