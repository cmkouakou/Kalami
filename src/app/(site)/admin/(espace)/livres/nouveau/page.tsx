/**
 * =============================================================
 *  Fichier    : page.tsx (admin/livres/nouveau)
 *  Projet     : Kalami
 *  Description: Création d'un livre. La couverture s'ajoute ensuite sur la fiche du livre
 *               (le chemin de l'image dépend de l'identifiant du livre).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts, components/admin
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BookForm } from "@/components/admin/book-form";
import { getDictionary } from "@/i18n";
import { getBookFormOptions } from "@/lib/admin/catalog-queries";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: t.admin.books.new };

export default function NewBookPage() {
  return (
    <main className="flex flex-col gap-6">
      <Link href="/admin/livres" className="w-fit text-sm text-encre hover:underline">
        ← {t.admin.common.back}
      </Link>
      <h1 className="font-serif text-3xl font-semibold">{t.admin.books.new}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <NewBookContent />
      </Suspense>
    </main>
  );
}

/** Formulaire vierge, alimenté par la liste des auteurs et des catégories. */
async function NewBookContent() {
  await requireAdmin();
  const { authors, categories } = await getBookFormOptions();
  return <BookForm authors={authors} categories={categories} />;
}
