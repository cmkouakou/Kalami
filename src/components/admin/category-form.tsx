/**
 * =============================================================
 *  Fichier    : category-form.tsx
 *  Projet     : Kalami
 *  Description: Formulaire de création ou de modification d'une catégorie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: components/admin/action-form.tsx, lib/admin/catalog-actions.ts
 * =============================================================
 */

import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { createCategory, updateCategory } from "@/lib/admin/catalog-actions";
import type { Category } from "@/lib/catalog/types";

const t = getDictionary();

/** Sans catégorie : création ; avec : modification de celle-ci. */
export function CategoryForm({ category }: { category?: Category }) {
  const l = t.admin.categories;
  const prefix = category ? `categorie-${category.id}` : "categorie-nouvelle";
  const action = category ? updateCategory.bind(null, category.id) : createCategory;

  return (
    <ActionForm
      action={action}
      submitLabel={category ? t.admin.common.save : t.admin.common.create}
      className="grid gap-4 sm:grid-cols-2"
      resetOnSuccess={!category}
    >
      <Field
        id={`${prefix}-name`}
        label={l.name}
        name="name"
        required
        maxLength={80}
        defaultValue={category?.name}
      />
      <Field
        id={`${prefix}-slug`}
        label={t.admin.common.slug}
        name="slug"
        hint={t.admin.common.slugHelp}
        maxLength={80}
        defaultValue={category?.slug}
      />
      <TextArea
        id={`${prefix}-description`}
        label={l.description}
        name="description"
        rows={2}
        maxLength={500}
        defaultValue={category?.description ?? ""}
      />
      <Field
        id={`${prefix}-position`}
        label={l.position}
        name="position"
        type="number"
        min={0}
        max={10000}
        defaultValue={category?.position ?? 0}
      />
    </ActionForm>
  );
}
