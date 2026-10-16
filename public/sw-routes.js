/**
 * =============================================================
 *  Fichier    : sw-routes.js
 *  Projet     : Kalami
 *  Description: Règles du service worker : quelle requête peut être mise en cache, et
 *               comment. Script classique chargé par sw.js (importScripts) et par les tests
 *               (tests/unit/sw-routes.test.ts). LISTE BLANCHE : tout ce qui n'est pas listé ici
 *               passe directement au réseau, sans jamais être conservé sur l'appareil
 *               (contenu des livres, études, comptes, administration, API).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: (aucune)
 * =============================================================
 */

"use strict";

(function (portee) {
  // ==================== CONSTANTES ====================

  /** Pages de repli, enregistrées dès l'installation du service worker. */
  const PAGES_HORS_LIGNE = ["/hors-ligne", "/strategie/hors-ligne"];

  /** Pages publiques du catalogue gardées après visite (réseau d'abord). */
  const PAGES_CATALOGUE = [
    /^\/$/,
    /^\/categories\/[^/]+$/,
    /^\/livres\/[^/]+$/,
    /^\/auteurs\/[^/]+$/,
    /^\/(strategie\/)?(confidentialite|conditions|conditions-de-vente)$/,
  ];

  /** Fichiers immuables (nom avec empreinte) ou de la charte : cache d'abord. */
  const FICHIERS_STATIQUES = [/^\/_next\/static\//, /^\/icons\//, /^\/brand\//];

  // ==================== CLASSEMENT ====================

  /**
   * Classe une requête GET.
   * @param {URL}    url     - Adresse demandée
   * @param {string} mode    - request.mode (« navigate » pour une page)
   * @param {string} origine - Origine du site (self.location.origin)
   * @returns {"statique"|"image"|"catalogue"|"page"|"ignorer"} Stratégie à appliquer
   *
   * Exemple : classerRequete(new URL("https://x.com/livres/a"), "navigate", "https://x.com")
   *           === "catalogue"
   */
  function classerRequete(url, mode, origine) {
    if (url.origin !== origine) return "ignorer";
    const chemin = url.pathname;

    if (FICHIERS_STATIQUES.some((motif) => motif.test(chemin))) return "statique";
    // Couvertures et photos d'auteurs optimisées par Next.js (seau public)
    if (chemin === "/_next/image") return "image";
    if (mode !== "navigate") return "ignorer";
    if (PAGES_CATALOGUE.some((motif) => motif.test(chemin))) return "catalogue";
    return "page";
  }

  /**
   * Page de repli selon l'espace : Kalami Stratégie ne renvoie jamais vers la librairie.
   * @param {string} chemin - Chemin de la page demandée
   * @returns {string} Chemin de la page « hors ligne » à servir
   */
  function pageHorsLigne(chemin) {
    const strategie = chemin === "/strategie" || chemin.startsWith("/strategie/");
    return strategie ? PAGES_HORS_LIGNE[1] : PAGES_HORS_LIGNE[0];
  }

  /**
   * Clé de cache d'une page : l'adresse sans paramètres, pour éviter les doublons.
   * @param {URL} url - Adresse demandée
   * @returns {string} Adresse normalisée
   */
  function cleDePage(url) {
    return url.origin + url.pathname;
  }

  portee.KalamiRoutes = { PAGES_HORS_LIGNE, classerRequete, pageHorsLigne, cleDePage };
})(self);
