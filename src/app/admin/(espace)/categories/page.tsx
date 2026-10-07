/**
 * =============================================================
 *  Fichier    : page.tsx (admin/categories)
 *  Projet     : Kalami
 *  Description: Gestion des catégories : création, modification et suppression sur une
 *               seule page (peu de catégories, formulaires dépliables).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts, components/admin
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryForm } from "@/components/admin/category-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDictionary } from "@/i18n";
import { deleteCategory } from "@/lib/admin/catalog-actions";
import { listCategoriesAdmin } from "@/lib/admin/catalog-queries";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();
const l = t.admin.categories;

export const metadata: Metadata = { title: l.title };

export default function AdminCategoriesPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{l.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-60 animate-pulse" />}>
        <CategoriesContent />
      </Suspense>
    </main>
  );
}

/** Liste des catégories (chacune modifiable) et formulaire d'ajout. */
async function CategoriesContent() {
  await requireAdmin();
  const categories = await listCategoriesAdmin();

  return (
    <>
      <ul className="flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.id} className="rounded-lg border border-bordure bg-surface">
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center gap-3 px-4">
                <span className="font-medium">{category.name}</span>
                <span className="text-sm text-texte-doux">/{category.slug}</span>
              </summary>
              <div className="flex flex-col gap-4 border-t border-bordure p-4">
                <CategoryForm category={category} />
                <DeleteButton action={deleteCategory.bind(null, category.id)} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-4 rounded-lg border border-bordure bg-surface p-4">
        <h2 className="text-xl font-semibold">{l.new}</h2>
        <CategoryForm />
      </section>
    </>
  );
}
