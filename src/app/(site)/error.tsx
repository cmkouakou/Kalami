/**
 * =============================================================
 *  Fichier    : error.tsx (site)
 *  Projet     : Kalami
 *  Description: Page d'erreur de la librairie, de l'espace auteur et de l'administration :
 *               l'en-tête du site reste affiché, le visiteur peut réessayer.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: components/ui/error-panel.tsx
 * =============================================================
 */

"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel error={error} retry={retry} homeHref="/" />;
}
