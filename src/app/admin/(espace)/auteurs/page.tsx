/**
 * =============================================================
 *  Fichier    : page.tsx (admin/auteurs)
 *  Projet     : Kalami
 *  Description: Liste des auteurs (avec leur nombre de livres) et formulaire d'ajout.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts, components/admin
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthorForm } from "@/components/admin/author-form";
import { getDictionary } from "@/i18n";
import { listAuthorsAdmin } from "@/lib/admin/catalog-queries";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();
const l = t.admin.authors;

export const metadata: Metadata = { title: l.title };

export default function AdminAuthorsPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{l.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-60 animate-pulse" />}>
        <AuthorsContent />
      </Suspense>
    </main>
  );
}

/** Tableau des auteurs et création d'un nouvel auteur. */
async function AuthorsContent() {
  await requireAdmin();
  const authors = await listAuthorsAdmin();

  return (
    <>
      {authors.length === 0 ? (
        <p className="text-texte-doux">{t.admin.common.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-bordure bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bordure text-texte-doux">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{l.name}</th>
                <th scope="col" className="px-4 py-3 font-medium">{l.books}</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id} className="border-b border-bordure last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/auteurs/${author.id}`}
                      className="inline-flex min-h-11 items-center font-medium text-principale
                        hover:underline"
                    >
                      {author.display_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{author.book_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="flex flex-col gap-4 rounded-lg border border-bordure bg-surface p-4">
        <h2 className="text-xl font-semibold">{l.new}</h2>
        <AuthorForm />
      </section>
    </>
  );
}
