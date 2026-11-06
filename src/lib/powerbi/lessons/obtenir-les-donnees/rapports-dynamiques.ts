/**
 * =============================================================
 *  Fichier    : rapports-dynamiques.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Créer des rapports dynamiques avec des paramètres » :
 *               un paramètre pour une valeur unique, puis une fonction appelée sur une
 *               liste de valeurs.
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
    "Un **rapport dynamique** sert à plusieurs usages : un paramètre choisit les valeurs à " +
      "afficher, et le rapport filtre ses données en conséquence. Moins de rapports à créer, " +
      "donc du temps et des ressources économisés.",
  ),
  p(
    "Le scénario : un rapport des ventes sur SQL Server, que chaque vendeur de Tailwind Traders " +
      "veut filtrer sur ses propres données pour suivre ses objectifs.",
  ),

  titre("Partie 1 — Une seule valeur"),
  p("D'abord la connexion, avec une requête SQL écrite à l'avance :"),
  etapes(
    "Obtenir les données > SQL Server, puis **Options avancées**",
    "Coller la requête dans **Instruction SQL**, OK",
    "**Modifier** pour ouvrir Power Query",
  ),
  p("Puis le paramètre :"),
  etapes(
    "Accueil > **Gérer les paramètres > Nouveau paramètre**",
    "Nom explicite (**SalesPerson**), Type **Texte**, Valeur suggérée **N'importe quelle valeur**",
    "Clic droit sur Query1 > **Éditeur avancé** : remplacer la valeur fixe de la requête par " +
      "une esperluette `&` suivie du nom du paramètre",
    "Vérifier l'absence d'erreur, puis **Terminé**",
  ),
  p(
    "Pour tester : changer la **Valeur actuelle** du paramètre. Un avertissement demande " +
      "l'autorisation d'exécuter la requête de base de données native : **Modifier une " +
      "autorisation**, puis **Exécuter**. Ensuite, Fermer et appliquer.",
  ),
  p(
    "Côté rapport, on change la valeur par **Modifier les requêtes > Modifier les paramètres**, " +
      "puis **Appliquer les modifications**.",
  ),
  note("Limite : une seule valeur à la fois. Pour plusieurs, il faut la partie 2."),

  titre("Partie 2 — Plusieurs valeurs"),
  p(
    "L'idée : transformer la requête en **fonction**, puis l'appeler pour chaque valeur d'une " +
      "liste.",
  ),
  etapes(
    "Créer un classeur Excel avec une colonne listant les ID de vendeurs, et s'y connecter",
    "Renommer la colonne, la typer **Texte** (comme le paramètre), nommer la requête " +
      "**SalesPersonID**",
    "Clic droit sur Query1 > **Créer une fonction**, et la nommer",
    "Décocher **Activer le chargement** sur Query1, pour qu'elle n'encombre pas la liste des " +
      "champs",
    "Sur SalesPersonID : Ajouter une colonne > **Appeler une fonction personnalisée**, choisir " +
      "la fonction",
    "Développer la nouvelle colonne (icône à deux flèches), cocher les colonnes, décocher " +
      "**Utiliser le nom de la colonne d'origine comme préfixe**",
  ),
  p(
    "Pour ajouter un vendeur : modifier le classeur Excel, puis **Actualiser l'aperçu** et " +
      "Fermer et appliquer. Ses ventes apparaissent.",
  ),
  examen(
    "Retenir l'enchaînement : paramètre → requête qui l'utilise → **Créer une fonction** → " +
      "**Appeler une fonction personnalisée** sur une table de valeurs. Et le piège : types " +
      "identiques (Texte) entre la liste et le paramètre, sinon erreur de conversion.",
  ),
  memo(
    "Le paramètre est une case à remplir ; la fonction, c'est la même recette rejouée pour " +
      "chaque ligne de la liste.",
  ),
];

export default contenu;
