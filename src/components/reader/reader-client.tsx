/**
 * =============================================================
 *  Fichier    : reader-client.tsx (reader)
 *  Projet     : Kalami
 *  Description: Chargement de la liseuse uniquement dans le navigateur : elle dépend de
 *               la taille de l'écran, du stockage local et de la mesure du texte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: reader.tsx
 * =============================================================
 */

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { getDictionary } from "@/i18n";
import type { ReaderBootstrap } from "@/lib/reader/types";

const t = getDictionary();

const Reader = dynamic(() => import("./reader").then((module) => module.Reader), {
  ssr: false,
  loading: () => (
    <div className="liseuse fixed inset-0 z-50 flex items-center justify-center">
      <p className="opacity-80">{t.reader.loading}</p>
    </div>
  ),
});

/** Liseuse rendue côté client. */
export function ReaderClient({ data, price }: { data: ReaderBootstrap; price: ReactNode }) {
  return <Reader data={data} price={price} />;
}
