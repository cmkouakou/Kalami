/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/inscription)
 *  Projet     : Kalami
 *  Description: Inscription d'un auteur (/auteur/inscription) : fiche publique et
 *               acceptation de la version en vigueur du contrat. Inscription libre ; chaque
 *               livre est ensuite validé par l'administration avant publication.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, lib/author/actions.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { ContractText } from "@/components/author/contract-text";
import { Field, TextArea } from "@/components/ui/form";
import { getDictionary, interpolate } from "@/i18n";
import { registerAuthor } from "@/lib/author/actions";
import { getAuthorContext } from "@/lib/author/queries";

const t = getDictionary();
const r = t.author.register;

export const metadata: Metadata = { title: r.title };

export default function AuthorRegistrationPage() {
  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold">{r.title}</h1>
        <p className="text-ink-muted">{r.intro}</p>
      </header>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <Registration />
      </Suspense>
    </main>
  );
}

/** Formulaire d'inscription, ou renvoi vers l'espace si la fiche existe déjà. */
async function Registration() {
  const { author, contract } = await getAuthorContext("/auteur/inscription");
  if (author) redirect("/auteur");
  if (!contract) return <p className="text-ink-muted">{r.closed}</p>;

  return (
    <ActionForm action={registerAuthor} submitLabel={r.submit}>
      <Field label={r.displayName} name="display_name" required maxLength={120} />
      <Field
        label={r.slug}
        name="slug"
        maxLength={80}
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        hint={t.admin.common.slugHelp}
      />
      <TextArea label={r.bio} name="bio" rows={5} maxLength={5000} />
      <ContractText contract={contract} />
      <input type="hidden" name="contract_id" value={contract.id} />
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" name="accept" required className="mt-0.5 size-5 shrink-0" />
        {interpolate(r.accept, { version: String(contract.version) })}
      </label>
    </ActionForm>
  );
}
