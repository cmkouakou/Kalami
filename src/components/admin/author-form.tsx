/**
 * =============================================================
 *  Fichier    : author-form.tsx
 *  Projet     : Kalami
 *  Description: Formulaire de création ou de modification d'un auteur (la photo se gère à
 *               part, avec ImageUpload, une fois l'auteur créé).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: components/admin/action-form.tsx, lib/admin/catalog-actions.ts
 * =============================================================
 */

import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { createAuthor, updateAuthor } from "@/lib/admin/catalog-actions";
import type { Author } from "@/lib/catalog/types";

const t = getDictionary();

/** Sans auteur : création ; avec : modification de celui-ci. */
export function AuthorForm({ author }: { author?: Author }) {
  const l = t.admin.authors;
  const action = author ? updateAuthor.bind(null, author.id) : createAuthor;

  return (
    <ActionForm action={action} submitLabel={author ? t.admin.common.save : t.admin.common.create}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={l.name}
          name="display_name"
          required
          maxLength={120}
          defaultValue={author?.display_name}
        />
        <Field
          label={t.admin.common.slug}
          name="slug"
          hint={t.admin.common.slugHelp}
          maxLength={80}
          defaultValue={author?.slug}
        />
      </div>
      <TextArea
        label={l.bio}
        name="bio"
        rows={6}
        maxLength={5000}
        defaultValue={author?.bio ?? ""}
      />
    </ActionForm>
  );
}
