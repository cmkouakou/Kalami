/**
 * =============================================================
 *  Fichier    : page.tsx (admin/auteurs/[id])
 *  Projet     : Kalami
 *  Description: Fiche d'un auteur en administration : informations, photo, suppression.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts, components/admin
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthorForm } from "@/components/admin/author-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageUpload } from "@/components/admin/image-upload";
import { getDictionary } from "@/i18n";
import { deleteAuthor } from "@/lib/admin/catalog-actions";
import { getAuthorAdmin } from "@/lib/admin/catalog-queries";
import { isUuid } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: t.admin.authors.title };

export default function AdminAuthorPage({ params }: PageProps<"/admin/auteurs/[id]">) {
  return (
    <main className="flex flex-col gap-6">
      <Link href="/admin/auteurs" className="w-fit text-sm text-encre hover:underline">
        ← {t.admin.common.back}
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AuthorContent params={params} />
      </Suspense>
    </main>
  );
}

/** Charge l'auteur demandé ; 404 s'il n'existe pas. */
async function AuthorContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const author = isUuid(id) ? await getAuthorAdmin(id) : null;
  if (!author) notFound();

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{author.display_name}</h1>
        <Link href={`/auteurs/${author.slug}`} className="text-sm text-encre hover:underline">
          {t.admin.common.view}
        </Link>
      </header>
      <div className="grid gap-8 md:grid-cols-[1fr_12rem]">
        <AuthorForm author={author} />
        <ImageUpload
          kind="author"
          id={author.id}
          label={t.admin.authors.photo}
          currentPath={author.photo_path}
        />
      </div>
      <DeleteButton action={deleteAuthor.bind(null, author.id)} />
    </>
  );
}
