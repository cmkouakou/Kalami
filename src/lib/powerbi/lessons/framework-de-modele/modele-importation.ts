/**
 * =============================================================
 *  Fichier    : modele-importation.ts (framework-de-modele)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Déterminer quand développer un modèle
 *               d'importation » : ses avantages, et ses deux limites (taille du
 *               modèle, actualisation des données).
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
    "Un modèle d'importation regroupe des tables dont le mode de stockage est **Import**, plus " +
      "d'éventuelles tables calculées en DAX. C'est le framework le plus souvent développé, et " +
      "celui que Power BI Desktop choisit par défaut quand on passe par « Obtenir les données ».",
  ),
  memo(
    "Import = tout en mémoire. Le plus d'options, la meilleure vitesse… à condition que les " +
      "données tiennent dans le modèle et qu'elles n'aient pas besoin d'être plus fraîches que " +
      "la dernière actualisation.",
  ),

  titre("Les avantages"),
  liste(
    "Accepte **tous les types de sources** : bases de données, fichiers, flux, pages web, flux " +
      "de données…",
    "Peut **intégrer plusieurs sources** dans un même modèle : une table issue d'une base " +
      "relationnelle, une table liée issue d'une page web.",
    "Prend en charge **toutes les fonctionnalités DAX et Power Query (M)**.",
    "Prend en charge les **tables calculées**.",
    "Offre les **meilleures performances de requête** : les données en cache sont optimisées " +
      "pour filtrer, grouper et résumer, et le modèle est entièrement en mémoire.",
  ),
  note(
    "Flexibilité de conception maximale et vitesse : c'est pour cela que la leçon « Choisir un " +
      "framework » recommandera l'importation chaque fois que possible.",
  ),

  titre("Limite 1 : la taille du modèle"),
  tableau(
    ["Capacité", "Limite par dataset"],
    [
      ["Partagée", "1 Go — au-delà, l'actualisation échoue"],
      [
        "Dédiée (Premium)",
        "Peut dépasser 10 Go, si le format de stockage des grands datasets est activé",
      ],
    ],
  ),
  examen(
    "Le 1 Go désigne la taille **compressée** du modèle Power BI, pas le volume extrait de la " +
      "source. Un piège classique : une source de 5 Go peut très bien produire un modèle sous " +
      "la limite.",
  ),
  p(
    "Le principe : stocker le moins de données possible, ce qui raccourcit les actualisations " +
      "et accélère les requêtes. Les techniques de réduction listées par le cours :",
  ),
  etapes(
    "Supprimer les colonnes inutiles",
    "Supprimer les lignes inutiles",
    "Grouper et résumer pour élever le grain des tables de faits",
    "Optimiser les types de données des colonnes, en privilégiant le numérique",
    "Préférer les colonnes personnalisées Power Query aux colonnes calculées du modèle",
    "Désactiver le chargement des requêtes Power Query qui n'ont pas à être chargées",
    "Désactiver la date/heure automatique",
    "Passer certaines tables en stockage DirectQuery (vu dans les leçons suivantes)",
  ),
  memo(
    "Moins de colonnes, moins de lignes, un grain plus gros, des types plus légers : on maigrit " +
      "le modèle avant de le charger, pas après.",
  ),

  titre("Limite 2 : l'actualisation des données"),
  p(
    "Les données importées ne sont jamais plus récentes que la dernière actualisation réussie. " +
      "On les tient à jour par une actualisation planifiée, ou par une actualisation à la " +
      "demande faite par les consommateurs.",
  ),
  tableau(
    ["Capacité", "Actualisations planifiées par jour"],
    [
      ["Partagée", "8"],
      ["Dédiée", "48"],
    ],
  ),
  examen(
    "8 en partagée, 48 en dédiée. La question à se poser : cette latence est-elle tolérable, " +
      "vu la vélocité des données et l'urgence d'informer les utilisateurs ?",
  ),
  p("Si la limite d'actualisation planifiée ne suffit pas, le cours propose trois issues :"),
  liste(
    "Des tables en stockage **DirectQuery**",
    "Une **table hybride** (décrite dans la leçon sur le modèle composite)",
    "Un **dataset en temps réel**, une approche différente",
  ),

  titre("Le coût d'une actualisation"),
  p(
    "Par défaut, pour actualiser une table, Power BI supprime toutes ses données puis les " +
      "recharge. Sur une grosse table de faits, la charge imposée à la source peut devenir " +
      "inacceptable.",
  ),
  p(
    "La réponse est l'**actualisation incrémentielle** : elle crée et gère automatiquement des " +
      "partitions par période, et n'actualise que celles qui en ont besoin. Résultat, si la " +
      "source le permet : des actualisations plus rapides et plus fiables, et moins de " +
      "ressources consommées des deux côtés.",
  ),
  note(
    "Les modélisateurs avancés peuvent définir leur propre stratégie de partitionnement et " +
      "l'automatiser par scripts, via le point de terminaison XMLA de Power BI Premium.",
  ),
  memo(
    "Actualisation complète = vider le frigo et refaire toute l'épicerie. Actualisation " +
      "incrémentielle = racheter seulement ce qui manque cette semaine.",
  ),
];

export default contenu;
