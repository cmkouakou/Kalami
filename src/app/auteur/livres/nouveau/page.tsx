/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/livres/nouveau)
 *  Projet     : Kalami
 *  Description: Création de la fiche d'un livre par son auteur (brouillon). Couverture et
 *               manuscrit s'ajoutent ensuite sur la page du livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, components/author/author-book-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthorBookForm } from "@/components/author/author-book-form";
import { getDictionary } from "@/i18n";
import { listCategoryOptions, requireAuthor } from "@/lib/author/queries";

const t = getDictionary();

export const metadata: Metadata = { title: t.author.book.newTitle };

export default function NewAuthorBookPage() {
  return (
    <main className="flex flex-col gap-6">
      <Link href="/auteur" className="w-fit text-sm text-encre hover:underline">
        ← {t.author.book.back}
      </Link>
      <h1 className="font-serif text-3xl font-semibold">{t.author.book.newTitle}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <NewBookForm />
      </Suspense>
    </main>
  );
}

/** Formulaire de création (fiche auteur exigée). */
async function NewBookForm() {
  await requireAuthor("/auteur/livres/nouveau");
  const categories = await listCategoryOptions();
  return <AuthorBookForm categories={categories} />;
}
