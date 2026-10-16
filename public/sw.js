/**
 * =============================================================
 *  Fichier    : sw.js
 *  Projet     : Kalami
 *  Description: Service worker fait maison (sans Serwist). Fichiers de l'application en
 *               cache d'abord ; pages du catalogue visitées en réseau d'abord avec copie de
 *               secours ; toute autre page passe au réseau, avec une page « hors ligne » de
 *               repli. Aucune donnée privée n'est conservée (voir sw-routes.js).
 *               Changer VERSION à chaque modification de ce fichier ou de sw-routes.js.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: sw-routes.js
 * =============================================================
 */

"use strict";

importScripts("/sw-routes.js");

// ==================== CONSTANTES ====================

const VERSION = "v1";
const CACHE_HORS_LIGNE = `kalami-hors-ligne-${VERSION}`;
const CACHE_STATIQUE = `kalami-statique-${VERSION}`;
const CACHE_IMAGES = `kalami-images-${VERSION}`;
const CACHE_PAGES = `kalami-pages-${VERSION}`;
const CACHES_ACTUELS = [CACHE_HORS_LIGNE, CACHE_STATIQUE, CACHE_IMAGES, CACHE_PAGES];

/** Nombre maximal d'entrées par cache (les plus anciennes partent en premier). */
const LIMITES = { [CACHE_STATIQUE]: 300, [CACHE_IMAGES]: 80, [CACHE_PAGES]: 50 };

const { PAGES_HORS_LIGNE, classerRequete, pageHorsLigne, cleDePage } = self.KalamiRoutes;

// ==================== CYCLE DE VIE ====================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_HORS_LIGNE)
      .then((cache) => cache.addAll(PAGES_HORS_LIGNE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(
          cles
            .filter((cle) => cle.startsWith("kalami-") && !CACHES_ACTUELS.includes(cle))
            .map((cle) => caches.delete(cle)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// À la déconnexion, la page demande l'effacement des pages gardées (en-tête personnalisé)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "vider-pages") {
    event.waitUntil(caches.delete(CACHE_PAGES));
  }
});

// ==================== REQUÊTES ====================

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);
  const genre = classerRequete(url, requete.mode, self.location.origin);

  if (genre === "statique") event.respondWith(cacheDabord(requete, CACHE_STATIQUE));
  else if (genre === "image") event.respondWith(perimeEnRevalidant(requete, event));
  else if (genre === "catalogue") event.respondWith(reseauDabord(requete, url));
  else if (genre === "page") event.respondWith(reseauSeul(requete, url));
});

// ==================== STRATÉGIES ====================

/**
 * Cache d'abord : fichiers dont le nom change à chaque version.
 * @param {Request} requete - Requête GET
 * @param {string}  nom     - Nom du cache
 * @returns {Promise<Response>} Réponse du cache, sinon du réseau
 */
async function cacheDabord(requete, nom) {
  const cache = await caches.open(nom);
  const copie = await cache.match(requete);
  if (copie) return copie;
  const reponse = await fetch(requete);
  if (reponse.ok) await ranger(cache, nom, requete, reponse.clone());
  return reponse;
}

/**
 * Périmé pendant la revalidation : couvertures affichées tout de suite, rafraîchies ensuite.
 * @param {Request}    requete - Requête d'image optimisée
 * @param {FetchEvent} event   - Événement, pour prolonger la mise à jour en arrière-plan
 * @returns {Promise<Response>} Copie gardée, sinon réponse du réseau
 */
async function perimeEnRevalidant(requete, event) {
  const cache = await caches.open(CACHE_IMAGES);
  const copie = await cache.match(requete);
  const miseAJour = fetch(requete)
    .then(async (reponse) => {
      if (reponse.ok) await ranger(cache, CACHE_IMAGES, requete, reponse.clone());
      return reponse;
    })
    .catch(() => copie || Response.error());
  if (copie) {
    event.waitUntil(miseAJour);
    return copie;
  }
  return miseAJour;
}

/**
 * Réseau d'abord : page du catalogue, copie gardée pour la consultation hors ligne.
 * @param {Request} requete - Navigation vers une page publique
 * @param {URL}     url     - Adresse demandée
 * @returns {Promise<Response>} Page fraîche, sinon copie, sinon page « hors ligne »
 */
async function reseauDabord(requete, url) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const reponse = await fetch(requete);
    // Une redirection (domaine, connexion) n'est jamais gardée
    if (reponse.ok && !reponse.redirected) {
      await ranger(cache, CACHE_PAGES, cleDePage(url), reponse.clone());
    }
    return reponse;
  } catch {
    const copie = await cache.match(cleDePage(url));
    return copie || repli(url);
  }
}

/**
 * Réseau seul : page privée ou dynamique, jamais gardée.
 * @param {Request} requete - Navigation
 * @param {URL}     url     - Adresse demandée
 * @returns {Promise<Response>} Réponse du réseau, sinon page « hors ligne »
 */
async function reseauSeul(requete, url) {
  try {
    return await fetch(requete);
  } catch {
    return repli(url);
  }
}

// ==================== UTILITAIRES ====================

/**
 * Page « hors ligne » de l'espace demandé.
 * @param {URL} url - Adresse demandée
 * @returns {Promise<Response>} Page de repli, ou erreur réseau si elle manque
 */
async function repli(url) {
  const page = await caches.match(pageHorsLigne(url.pathname), { cacheName: CACHE_HORS_LIGNE });
  return page || Response.error();
}

/**
 * Range une réponse puis retire les entrées les plus anciennes au-delà de la limite.
 * @param {Cache}          cache   - Cache ouvert
 * @param {string}         nom     - Nom du cache (pour sa limite)
 * @param {Request|string} cle     - Clé de l'entrée
 * @param {Response}       reponse - Copie de la réponse
 */
async function ranger(cache, nom, cle, reponse) {
  await cache.put(cle, reponse);
  const cles = await cache.keys();
  const surplus = cles.length - (LIMITES[nom] || 100);
  for (let i = 0; i < surplus; i += 1) await cache.delete(cles[i]);
}
