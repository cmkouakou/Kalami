/**
 * =============================================================
 *  Fichier    : page.tsx (apercu/[id])
 *  Projet     : Kalami
 *  Description: Liseuse en mode aperçu (/apercu/{id}) : l'auteur ou l'administration lit
 *               la version en attente de validation exactement comme les lecteurs la
 *               verront. Les chapitres passent par l'API protégée avec ?version=apercu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/preview.ts, components/reader/reader-client.tsx
 * =============================================================
 */

import "../../livres/[slug]/lire/reader.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReaderClient } from "@/components/reader/reader-client";
import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { getPreviewData } from "@/lib/author/preview";
import { parseChapterPosition } from "@/lib/content/access";

const t = getDictionary();

export const metadata: Metadata = {
  title: t.author.book.preview,
  robots: { index: false, follow: false },
};

export default function PreviewPage({ params, searchParams }: PageProps<"/apercu/[id]">) {
  return (
    <Suspense fallback={<PreviewFallback />}>
      <PreviewContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Données de l'aperçu ; 404 si le livre est invisible pour l'utilisateur ou sans texte. */
async function PreviewContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const requested = typeof query.chapitre === "string" ? query.chapitre : null;
  const data = await getPreviewData(id, requested ? parseChapterPosition(requested) : null);
  if (!data) notFound();

  return <ReaderClient data={data} price={null} />;
}

/** Écran affiché pendant la préparation de la liseuse. */
function PreviewFallback() {
  return (
    <div className="liseuse fixed inset-0 z-50 flex items-center justify-center">
      <p className="opacity-80">{t.reader.loading}</p>
    </div>
  );
}
