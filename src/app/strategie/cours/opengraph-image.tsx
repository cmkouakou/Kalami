/**
 * =============================================================
 *  Fichier    : opengraph-image.tsx (strategie/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Image d'aperçu des liens vers le cours (WhatsApp, Facebook, LinkedIn…) :
 *               titre, accroche et chiffres clés sur fond papier, aux couleurs de Kalami.
 *               Héritée par les pages du cours. Générée au build.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: next/og, i18n/course.ts, lib/cours/modules.ts
 * =============================================================
 */

import { ImageResponse } from "next/og";

import { getCourseDictionary } from "@/i18n/course";
import { DUREE_TOTALE_MINUTES, LECONS, MODULES } from "@/lib/cours/modules";

const t = getCourseDictionary();

export const alt = t.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Couleurs de la charte (globals.css, thème clair). */
const PAPER = "#faf6ef";
const ENCRE = "#1e4d4a";
const INK_MUTED = "#6b6156";

/** Image d'aperçu du cours. */
export default function OpenGraphImage() {
  const chiffres = [
    `${MODULES.length} ${t.vente.chiffres.modules}`,
    `${LECONS.length} ${t.vente.chiffres.lecons}`,
    `${Math.round(DUREE_TOTALE_MINUTES / 60)} ${t.vente.chiffres.heures}`,
  ].join("  ·  ");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 32,
          padding: "0 96px",
          background: PAPER,
          borderBottom: `24px solid ${ENCRE}`,
        }}
      >
        <div style={{ fontSize: 30, color: INK_MUTED, letterSpacing: 4 }}>
          {t.lecon.citation.plateforme.toUpperCase()}
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, color: ENCRE }}>{t.title}</div>
        <div style={{ fontSize: 34, color: "#1f2a37", lineHeight: 1.35 }}>
          {t.vente.accroche}
        </div>
        <div style={{ fontSize: 28, color: INK_MUTED }}>{chiffres}</div>
      </div>
    ),
    size,
  );
}
