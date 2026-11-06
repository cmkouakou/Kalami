/**
 * =============================================================
 *  Fichier    : nosql.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Obtenir des données depuis une base NoSQL » : la
 *               connexion à Azure Cosmos DB et l'aplatissement des documents JSON.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import { etapes, examen, memo, note, p, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "Une base **NoSQL** (non relationnelle) ne range pas ses données en tables : elle est plus " +
      "souple. Pour Power BI, il faut donc **aplatir** ces données avant de les utiliser dans un " +
      "rapport.",
  ),
  p(
    "Le scénario : l'application d'expédition de Tailwind Traders stocke ses données dans " +
      "**Azure Cosmos DB**, sous forme de **documents JSON** — un format ouvert, surtout utilisé " +
      "pour échanger des données entre un serveur et une application web.",
  ),

  titre("Se connecter à Cosmos DB"),
  etapes(
    "Obtenir les données > **Plus...** > catégorie **Azure** > **Azure Cosmos DB** > Se connecter",
    "Fenêtre « Connecteur en préversion » : **Continuer**",
    "Saisir l'**URL du point de terminaison** (volet Clés du portail Azure), puis la base et la " +
      "collection, ou les choisir dans le navigateur",
    "À la première connexion, saisir la **clé du compte** (Clé principale, volet Clés en lecture " +
      "seule)",
  ),

  titre("Aplatir le JSON"),
  p(
    "Le JSON est souvent imbriqué ou non structuré. Dans le Navigateur, l'aperçu de la table " +
      "(ici Product) n'affiche que des éléments **Record** : chaque document est un " +
      "enregistrement pour Power BI.",
  ),
  etapes(
    "**Modifier** pour ouvrir Power Query",
    "Cliquer sur le bouton **Développer** à droite de l'en-tête **Column1**",
    "Cocher les champs voulus, décocher **Utiliser le nom de la colonne d'origine comme " +
      "préfixe**, OK",
    "Vérifier, puis **Fermer et appliquer**",
  ),
  p(
    "Le résultat ressemble à une table en lignes et colonnes, qu'on peut relier à d'autres " +
      "sources dans le rapport.",
  ),
  examen(
    "Le signe à reconnaître : une colonne qui n'affiche que « Record ». La réponse est de la " +
      "**développer** dans Power Query avant de charger.",
  ),
  note(
    "L'option « Utiliser le nom de la colonne d'origine comme préfixe » revient aussi en partie " +
      "2 des rapports dynamiques : la décocher évite des noms comme Column1.name.",
  ),
  memo("Record = un paquet fermé. Développer = l'ouvrir et poser chaque champ dans sa colonne."),
];

export default contenu;
