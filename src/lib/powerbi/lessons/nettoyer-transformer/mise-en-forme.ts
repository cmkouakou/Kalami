/**
 * =============================================================
 *  Fichier    : mise-en-forme.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Mettre en forme les données initiales » : l'éditeur
 *               Power Query, les en-têtes, les lignes et colonnes à supprimer, et le
 *               couple dépivoter / pivoter.
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
    "L'éditeur Power Query met en forme les données importées — renommer, convertir, " +
      "supprimer, promouvoir des en-têtes — **sans jamais modifier la source**. Il travaille sur " +
      "une vue des données, et chaque étape est enregistrée puis rejouée à chaque connexion.",
  ),
  memo(
    "Power Query est une recette, pas une rature : on n'efface rien dans la source, on écrit " +
      "les étapes, et Power BI les refait à chaque actualisation.",
  ),
  p(
    "Le scénario : des ventes brutes venant d'un fichier .csv saisi à la main dans Excel par " +
      "l'équipe commerciale, et d'une connexion à l'ERP. Des données inutiles, d'autres utiles " +
      "mais au mauvais format.",
  ),

  titre("Se repérer dans l'éditeur"),
  p("On l'ouvre par **Accueil > Transformer les données** dans Power BI Desktop."),
  tableau(
    ["Zone", "Contenu"],
    [
      ["Centre", "Les données de la requête sélectionnée"],
      ["Volet gauche « Requêtes »", "Les requêtes disponibles, c'est-à-dire les tables"],
      ["Volet droit « Paramètres de la requête »", "Les propriétés et les étapes appliquées"],
    ],
  ),
  note(
    "Les menus contextuels (clic droit) et l'onglet **Transformer** du ruban offrent en grande " +
      "partie les mêmes options : deux chemins vers le même résultat.",
  ),

  titre("En-têtes et noms de colonnes"),
  p(
    "Première vérification : où sont les en-têtes ? Dans l'exemple SalesTarget, ils tombent " +
      "sur des lignes différentes et plusieurs colonnes s'appellent **Column1**, **Column2**… " +
      "Power Query considère d'abord toutes les données comme des lignes.",
  ),
  tableau(
    ["Action", "Où"],
    [
      [
        "Promouvoir les en-têtes",
        "Accueil > **Utiliser la première ligne pour les en-têtes**, ou le menu déroulant de " +
          "Column1",
      ],
      ["Renommer une colonne", "Clic droit > **Renommer**, ou double-clic sur l'en-tête"],
      ["Supprimer les lignes du haut", "Accueil > **Supprimer les lignes** > lignes du haut"],
    ],
  ),

  titre("Supprimer des colonnes, et tôt"),
  p(
    "Une colonne qu'aucun rapport n'utilisera n'apporte rien au modèle : on la supprime, le " +
      "plus tôt possible — idéalement dès la source, par exemple en l'omettant du SELECT en SQL. " +
      "C'est d'autant plus vrai une fois des relations établies, et la performance y gagne.",
  ),
  tableau(
    ["Méthode", "Quand la choisir"],
    [
      ["Sélectionner les colonnes à retirer > **Supprimer les colonnes**", "Peu à enlever"],
      ["Sélectionner celles à garder > **Supprimer les autres colonnes**", "Peu à garder"],
    ],
  ),
  note("Une colonne supprimée pourra toujours être rajoutée si les besoins évoluent."),

  titre("Dépivoter : des colonnes vers des lignes"),
  p(
    "Très utilisé avec Excel. Exemple : une feuille de ventes avec une colonne par année (2018, " +
      "2019). Le but : trois colonnes, **Month**, **Year** et **SalesAmount**, pour totaliser " +
      "facilement les deux années.",
  ),
  etapes(
    "Renommer la première colonne en Month",
    "Sélectionner les colonnes 2018 et 2019, puis Transformer > **Dépivoter**",
    "Renommer Attribute en Year et Value en SalesAmount",
  ),
  p(
    "Bénéfice : des mesures DAX plus simples, et des données qu'on peut segmenter par année et " +
      "par mois.",
  ),

  titre("Pivoter : des lignes vers des colonnes"),
  p(
    "Des données « plates » — beaucoup de détails, aucun regroupement — cachent les tendances. " +
      "Pivoter la colonne produit une valeur agrégée pour chaque valeur unique d'une colonne.",
  ),
  liste(
    "Fonctions d'agrégation proposées : Count, Minimum, Maximum, Median, Average, Sum",
    "Exemple : le nombre de sous-catégories par catégorie de produits — colonne de valeurs " +
      "« Nom de la sous-catégorie », agrégation **Count (All)** dans les options avancées",
  ),
  examen(
    "Dépivoter transforme des colonnes en paires attribut / valeur ; pivoter fait l'inverse en " +
      "agrégeant. Une question type montre une table « une colonne par mois » et demande la " +
      "transformation qui la rend analysable : **Dépivoter**.",
  ),
  memo(
    "Dépivoter déplie (colonnes → lignes). Pivoter replie (lignes → colonnes, avec une " +
      "agrégation).",
  ),

  titre("Fermer et appliquer"),
  p(
    "Toutes les étapes restent listées dans les paramètres de la requête. **Fermer et " +
      "appliquer** ferme l'éditeur et applique les changements au modèle sémantique.",
  ),
];

export default contenu;
