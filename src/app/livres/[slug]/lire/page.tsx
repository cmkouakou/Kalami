/**
 * =============================================================
 *  Fichier    : page.tsx (livres/[slug]/lire)
 *  Projet     : Kalami
 *  Description: Liseuse d'un livre (plein écran). Le serveur prépare les données de départ
 *               (sommaire, droit d'accès, position, signets, filigrane) ; le texte est
 *               ensuite chargé chapitre par chapitre par l'API protégée.
 *               ?chapitre=n ouvre directement un chapitre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/reader/queries.ts, components/reader/reader-client.tsx, reader.css
 * =============================================================
 */

import "./reader.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PriceTag } from "@/components/catalog/price-tag";
import { ReaderClient } from "@/components/reader/reader-client";
import { getDictionary, interpolate } from "@/i18n";
import { getBookBySlug } from "@/lib/catalog/queries";
import { parseChapterPosition } from "@/lib/content/access";
import { getReaderData } from "@/lib/reader/queries";

const t = getDictionary();

// ==================== MÉTADONNÉES ====================

export async function generateMetadata({
  params,
}: PageProps<"/livres/[slug]/lire">): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  return {
    title: book ? interpolate(t.reader.metaTitle, { title: book.title }) : undefined,
    // La liseuse n'a pas à être indexée : la fiche du livre l'est
    robots: { index: false, follow: false },
  };
}

// ==================== PAGE ====================

export default function ReaderPage({ params, searchParams }: PageProps<"/livres/[slug]/lire">) {
  return (
    <Suspense fallback={<ReaderFallback />}>
      <ReaderContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Données de départ de la liseuse (dépendent du lecteur : rendu à la demande). */
async function ReaderContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const requested = typeof query.chapitre === "string" ? query.chapitre : null;
  const data = await getReaderData(slug, requested ? parseChapterPosition(requested) : null);
  if (!data) notFound();

  return <ReaderClient data={data} price={<PriceTag prices={data.book.prices} />} />;
}

/** Écran affiché pendant la préparation de la liseuse. */
function ReaderFallback() {
  return (
    <div className="liseuse fixed inset-0 z-50 flex items-center justify-center">
      <p className="opacity-80">{t.reader.loading}</p>
    </div>
  );
}
