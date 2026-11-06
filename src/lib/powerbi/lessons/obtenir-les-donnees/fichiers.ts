/**
 * =============================================================
 *  Fichier    : fichiers.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Obtenir des données depuis des fichiers » : les
 *               fichiers plats, l'emplacement du fichier, le Navigateur et le changement
 *               de source.
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
    "Beaucoup d'organisations exportent leurs données dans des fichiers. Power BI s'y connecte " +
      "par **Obtenir les données**. Le choix décisif est l'**emplacement** du fichier : il " +
      "décide si le rapport restera à jour tout seul.",
  ),
  p(
    "Un **fichier plat** contient une seule table, chaque ligne ayant la même structure, sans " +
      "hiérarchie : .csv, .txt délimité, fichier à largeur fixe. Les classeurs Excel (.xlsx) " +
      "sont l'autre cas courant.",
  ),
  p(
    "Le scénario : l'équipe RH de Tailwind Traders fournit un fichier des employés (nom, date " +
      "d'embauche, poste, responsable).",
  ),

  titre("Où se trouve le fichier ?"),
  tableau(
    ["Emplacement", "Comportement"],
    [
      [
        "**Local**",
        "Aucun lien gardé : un modèle est créé, les changements du fichier ne remontent pas",
      ],
      ["**OneDrive Entreprise**", "Synchronisé : Power BI vérifie le fichier et met à jour"],
      [
        "**OneDrive Personnel**",
        "Mêmes avantages, avec l'option **Maintenir la connexion** (à faire autoriser par l'admin)",
      ],
      ["**SharePoint, site d'équipe**", "Comme OneDrive Entreprise ; par URL ou dossier racine"],
    ],
  ),
  examen(
    "Données qui changent → fichier dans le **cloud** (OneDrive ou SharePoint) pour garder la " +
      "synchronisation. Données stables → un fichier **local** suffit.",
  ),

  titre("Se connecter et choisir"),
  etapes(
    "Accueil > **Obtenir les données**, puis le type voulu (Excel, Texte/CSV, XML…)",
    "Ouvrir le fichier ; une authentification peut être demandée (OneDrive par exemple)",
    "Dans la fenêtre **Navigateur**, sélectionner une table pour l'aperçu, puis la cocher",
    "Choisir **Charger** ou **Transformer les données**",
  ),
  tableau(
    ["Bouton", "Effet"],
    [
      ["**Charger**", "Les données vont directement dans le modèle"],
      ["**Transformer les données**", "Ouvre Power Query pour nettoyer avant le chargement"],
    ],
  ),
  note("Excel et d'autres sources ont un accès rapide sur l'onglet Accueil, près du bouton."),

  titre("Changer le fichier source"),
  p(
    "Si le fichier est déplacé ou remplacé, il faut mettre à jour le chemin. Trois endroits dans " +
      "Power Query :",
  ),
  liste("Paramètres de la source de données", "Paramètres de la requête", "Éditeur avancé"),
  etapes(
    "Power Query > **Paramètres de la source de données**",
    "Sélectionner le fichier > **Changer la source**",
    "Modifier le **Chemin d'accès au fichier**, ou **Parcourir**",
    "OK, puis Fermer",
  ),
  {
    kind: "encadre",
    ton: "attention",
    titre: "Même structure obligatoire",
    texte:
      "Le nouveau fichier doit avoir la même structure. Supprimer ou renommer une colonne dans " +
      "la source casse le modèle de rapport.",
  },
  memo(
    "Local = une photo du fichier. Cloud = une fenêtre ouverte sur lui. Pour voir les " +
      "changements, il faut la fenêtre.",
  ),
];

export default contenu;
