/**
 * =============================================================
 *  Fichier    : global-error.tsx
 *  Projet     : Kalami
 *  Description: Dernier filet : erreur dans le gabarit racine. Remplace tout le document,
 *               sans globals.css ni polices : styles en ligne minimaux aux couleurs de la
 *               charte (exception volontaire à la règle « pas de style en ligne »).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: i18n
 * =============================================================
 */

"use client";

import { useEffect } from "react";

import { getDictionary } from "@/i18n";

const t = getDictionary();

/** Couleurs de la charte (encre, papier) : globals.css n'est pas chargé ici. */
const ENCRE = "#1e4d4a";
const PAPIER = "#faf6ef";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[kalami] erreur du gabarit racine :", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: PAPIER,
          color: "#1f1f1f",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <title>{t.error.title}</title>
        <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "4rem 1rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 1rem" }}>{t.error.title}</h1>
          <p style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>{t.error.text}</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: "44px",
              padding: "0 1.25rem",
              border: 0,
              borderRadius: "6px",
              background: ENCRE,
              color: "#ffffff",
              fontFamily: "Arial, sans-serif",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {t.pwa.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
