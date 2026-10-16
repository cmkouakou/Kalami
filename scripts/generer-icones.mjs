/**
 * =============================================================
 *  Fichier    : generer-icones.mjs
 *  Projet     : Kalami
 *  Description: Génère les icônes de la PWA (192, 512, « maskable », Apple) à partir de
 *               l'icône d'application de la charte. À relancer si l'icône change :
 *               node scripts/generer-icones.mjs
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: sharp (installé avec Next.js)
 * =============================================================
 */

import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

// ==================== CHEMINS ====================

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = `${RACINE}public/brand/kalami-app-icon.svg`;
const DESTINATION = `${RACINE}public/icons`;

// ==================== GÉNÉRATION ====================

/**
 * Convertit un SVG en PNG carré.
 * @param {string} svg    - Contenu SVG
 * @param {number} taille - Côté en pixels
 * @param {string} nom    - Nom du fichier de sortie
 */
async function exporter(svg, taille, nom) {
  await sharp(Buffer.from(svg), { density: 600 })
    .resize(taille, taille)
    .png({ compressionLevel: 9 })
    .toFile(`${DESTINATION}/${nom}`);
}

const brut = await readFile(SOURCE, "utf8");
// Les métadonnées de provenance n'ont pas d'utilité dans une icône
const arrondie = brut.replace(/<metadata>[\s\S]*?<\/metadata>/, "");
// Fond plein (sans coins arrondis) : Android découpe lui-même la forme « maskable »,
// iOS arrondit l'icône d'écran d'accueil. Le symbole tient dans la zone sûre (80 %).
const pleine = arrondie.replace(/ rx="14"/, "");

await mkdir(DESTINATION, { recursive: true });
await exporter(arrondie, 192, "icon-192.png");
await exporter(arrondie, 512, "icon-512.png");
await exporter(pleine, 512, "icon-maskable-512.png");
await exporter(pleine, 180, "apple-touch-icon.png");
