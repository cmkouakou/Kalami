/**
 * =============================================================
 *  Fichier    : bases-relationnelles.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Obtenir des données depuis une base relationnelle » :
 *               la connexion SQL Server, l'authentification, les paramètres de source et
 *               les bonnes pratiques d'écriture SQL.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import {
  code,
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
    "Une base relationnelle (ici le SQL Server local de Tailwind Traders) se connecte en " +
      "donnant un serveur, une base et une méthode d'authentification. On peut ensuite charger " +
      "des tables entières ou écrire sa propre requête SQL — et alors bien l'écrire.",
  ),

  titre("Se connecter"),
  etapes(
    "**Obtenir les données > SQL Server** (aussi en accès rapide sur l'onglet Accueil)",
    "Saisir le nom du serveur et de la base",
    "Choisir le mode : **Importer** (par défaut, recommandé) ou DirectQuery",
    "S'authentifier",
    "Dans le **Navigateur**, choisir les tables, puis **Charger** ou **Transformer les données**",
  ),
  tableau(
    ["Authentification", "Identifiants"],
    [
      ["**Windows**", "Les identifiants Azure AD"],
      ["**Base de données**", "Les identifiants SQL"],
      ["**Compte Microsoft**", "Souvent pour les services Azure"],
    ],
  ),
  p(
    "Pour importer le résultat d'une requête plutôt qu'une table : **Options avancées > " +
      "Instruction SQL**.",
  ),

  titre("Modifier les paramètres de la source"),
  p("Utile par exemple quand le mot de passe change tous les 90 jours. Deux chemins :"),
  liste(
    "Accueil > Transformer les données > **Paramètres de source de données**, puis clic droit " +
      "sur la source (ou les boutons en bas à gauche)",
    "Dans Power Query : le même bouton sur le ruban Accueil, ou l'engrenage à côté de " +
      "**Source** dans les étapes appliquées (ou double-clic sur Source) ; puis Fermer et " +
      "appliquer",
  ),

  titre("Écrire une bonne requête SQL"),
  p("Rappel : **SELECT** choisit les champs, **FROM** désigne la table."),
  code("SELECT ID, NAME, SALESAMOUNT FROM SALES", "sql"),
  examen(
    "Éviter `SELECT *`, qui ramène des données superflues, ralentit et oblige à normaliser " +
      "ensuite. Nommer les colonnes utiles.",
  ),
  p("Toute requête devrait aussi filtrer les lignes avec une clause **WHERE** :"),
  code("SELECT ID, NAME, SALESAMOUNT FROM SALES WHERE OrderDate >= '1/1/2020'", "sql"),
  note(
    "Bonne pratique : placer la requête dans une **vue** côté base plutôt que dans Power BI. " +
      "Les vues participent au **Query Folding**, abordé plus loin dans le module.",
  ),
  memo(
    "On ne vide pas tout le frigo pour faire une omelette : SELECT les colonnes utiles, WHERE " +
      "les lignes utiles.",
  ),
];

export default contenu;
