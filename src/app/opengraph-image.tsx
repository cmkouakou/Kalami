/**
 * =============================================================
 *  Fichier    : opengraph-image.tsx
 *  Projet     : Kalami
 *  Description: Image d'aperçu des liens partagés (WhatsApp, Facebook, LinkedIn…) : logo
 *               Kalami sur fond papier. Héritée par toutes les pages du site (v0.14.6).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: next/og, public/brand/kalami-logo.svg
 * =============================================================
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { APP_NAME } from "@/lib/config";

export const alt = `Logo ${APP_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Couleurs de la charte (globals.css, thème clair). */
const PAPER = "#faf6ef";
const ENCRE = "#1e4d4a";
const INK_MUTED = "#6b6156";

/** Proportions du logo (viewBox 211 × 64). */
const LOGO_WIDTH = 760;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 64) / 211);

/**
 * Logo en URI de données ; le bloc de métadonnées (signature de provenance) est retiré,
 * inutile au rendu.
 * @returns URI data:image/svg+xml du logo
 */
async function logoDataUri(): Promise<string> {
  const svg = await readFile(join(process.cwd(), "public/brand/kalami-logo.svg"), "utf8");
  const clean = svg.replace(/<metadata>[\s\S]*?<\/metadata>/, "");
  return `data:image/svg+xml;base64,${Buffer.from(clean).toString("base64")}`;
}

/** Image d'aperçu générée au build. */
export default async function OpenGraphImage() {
  const logo = await logoDataUri();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          background: PAPER,
          borderBottom: `24px solid ${ENCRE}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu par next/og */}
        <img src={logo} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="" />
        <div style={{ fontSize: 40, color: INK_MUTED }}>
          Livres en ligne · Assistant stratégie
        </div>
      </div>
    ),
    size,
  );
}
