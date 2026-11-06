/**
 * =============================================================
 *  Fichier    : simplifier-la-structure.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Simplifier la structure des données » : renommer les
 *               requêtes, remplacer des valeurs et des nulls, supprimer les doublons, et
 *               les bonnes pratiques de nommage.
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
    "À l'import, tables et colonnes gardent les noms de leur source. Le travail ici est de " +
      "rendre le modèle cohérent et parlant pour ceux qui l'utiliseront : des noms clairs, des " +
      "valeurs corrigées, aucune répétition inutile.",
  ),
  memo(
    "Le modèle est lu par des gens du métier, pas par la base de données. On nomme pour le " +
      "lecteur du rapport.",
  ),

  titre("Renommer une requête"),
  p(
    "Remplacer les noms obscurs par des noms familiers : *FactProductTable* devient " +
      "*Products* ; une vue *vProduct* perd son préfixe « v », qui déroute les utilisateurs. " +
      "Dans le scénario, *TargetSales* reçoit son année, puisqu'il y en aura une par année.",
  ),
  etapes(
    "Sélectionner la requête dans le volet Requêtes",
    "Clic droit > **Renommer**",
    "Saisir le nouveau nom, puis Entrée",
  ),

  titre("Remplacer des valeurs"),
  p(
    "Exemple : « décembre » mal orthographié dans la colonne Attribute. On sélectionne la " +
      "colonne, puis Transformer > **Remplacer les valeurs** : « Valeur à rechercher », " +
      "« Remplacer par », OK.",
  ),
  examen(
    "Contrairement à Excel, on ne peut pas cliquer dans une cellule de Power Query pour la " +
      "corriger. Toute correction passe par une transformation, qui devient une étape.",
  ),

  titre("Remplacer les valeurs nulles"),
  p(
    "Des frais de transport nuls qui veulent dire zéro faussent les moyennes. Les remplacer " +
      "par 0, avec la même commande Remplacer les valeurs, donne une moyenne exacte.",
  ),
  note(
    "Une valeur nulle n'est pas un zéro : elle est ignorée par le calcul. Si le métier dit " +
      "« pas de frais », c'est un 0 qu'il faut stocker.",
  ),

  titre("Supprimer les doublons"),
  p(
    "Pour obtenir une table de catégories uniques à partir d'une colonne Category Name pleine " +
      "de répétitions : clic droit sur l'en-tête > **Supprimer les doublons**. Seules les " +
      "valeurs uniques restent.",
  ),
  note(
    "Copier la table d'abord (option **Copier**, en haut du menu contextuel). On peut ainsi " +
      "comparer les deux versions et garder les deux si besoin.",
    "Conseil du cours",
  ),

  titre("Bonnes pratiques de nommage"),
  p(
    "Pas de règle figée : on adopte le vocabulaire et les abréviations sur lesquels toute " +
      "l'organisation s'entend.",
  ),
  tableau(
    ["Pour", "Faire"],
    [
      ["Tables, colonnes, mesures", "Des termes métier descriptifs"],
      ["Les traits de soulignement", "Les remplacer par des espaces"],
      ["Abréviations, préfixes, « numéro », « ID »", "Rester cohérent partout"],
      ["Préfixes et suffixes des tables", "Les retirer, préférer des noms simples"],
    ],
  ),
  p("Pour les valeurs, penser à leur affichage dans un visuel :"),
  liste(
    "Trop longues, elles se lisent mal et tiennent mal dans le visuel",
    "Trop courtes, elles deviennent difficiles à interpréter",
    "Éviter les acronymes, tant que le texte complet tient dans le visuel",
  ),
];

export default contenu;
