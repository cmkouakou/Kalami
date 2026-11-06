/**
 * =============================================================
 *  Fichier    : services-en-ligne.ts (obtenir-les-donnees)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « Obtenir des données depuis des services en ligne » :
 *               la connexion à une liste SharePoint Online et la règle de l'URL du site.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: @/lib/powerbi/content
 * =============================================================
 */

import { etapes, examen, memo, p, titre, type LessonContent } from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "SharePoint, OneDrive, Dynamics 365, Google Analytics… ces applications produisent leurs " +
      "propres données. Power BI peut les combiner avec les autres sources pour des rapports " +
      "plus riches.",
  ),
  p(
    "Le scénario : les responsables des ventes de Tailwind Traders saisissent les nouveaux " +
      "objectifs de l'année fiscale dans un formulaire SharePoint. On veut les croiser avec les " +
      "ventes réelles pour juger la qualité du pipeline.",
  ),

  titre("Se connecter à SharePoint"),
  etapes(
    "**Obtenir les données**, catégorie **Services en ligne**, **Liste SharePoint Online**",
    "**Se connecter**",
    "Coller l'**URL du site** SharePoint, celle qu'on ouvre dans le navigateur ; en retirer la " +
      "fin si besoin",
    "OK, puis se connecter avec son compte Microsoft",
  ),
  examen(
    "On donne l'URL du **site**, pas le chemin complet du fichier ou de la liste : la liste se " +
      "choisit ensuite, dans le Navigateur.",
  ),

  titre("Choisir les données"),
  p(
    "Le **Navigateur** présente les tables et entités du site, comme pour toute autre source. " +
      "On sélectionne la liste, puis **Charger**, ou Power Query pour transformer avant.",
  ),
  memo(
    "Le même geste partout : Obtenir les données → se connecter → Navigateur → Charger ou " +
      "Transformer. Seule la porte d'entrée change.",
  ),
];

export default contenu;
