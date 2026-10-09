/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/contrat)
 *  Projet     : Kalami
 *  Description: Contrat auteur en vigueur (/auteur/contrat) : texte, date d'acceptation,
 *               ou bouton d'acceptation quand une nouvelle version a été publiée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, lib/author/actions.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { ContractText } from "@/components/author/contract-text";
import { getDictionary, interpolate } from "@/i18n";
import { acceptContract } from "@/lib/author/actions";
import { requireAuthor } from "@/lib/author/queries";

const t = getDictionary();
const c = t.author.contract;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

export const metadata: Metadata = { title: c.title };

export default function AuthorContractPage() {
  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{c.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ContractContent />
      </Suspense>
    </main>
  );
}

/** Contrat en vigueur et état de son acceptation par l'auteur connecté. */
async function ContractContent() {
  const { contract, acceptedAt } = await requireAuthor("/auteur/contrat");
  if (!contract) return <p className="text-ink-muted">{t.author.register.closed}</p>;

  return (
    <>
      {acceptedAt ? (
        <p role="status" className="rounded-lg bg-success/15 p-4 text-sm">
          {interpolate(c.acceptedOn, { date: DATE_FORMAT.format(new Date(acceptedAt)) })}
        </p>
      ) : (
        <p role="status" className="rounded-lg bg-warning/15 p-4 text-sm">
          {c.newVersion}
        </p>
      )}
      <ContractText contract={contract} />
      {!acceptedAt && (
        <ActionForm action={acceptContract.bind(null, contract.id)} submitLabel={c.accept}>
          {null}
        </ActionForm>
      )}
    </>
  );
}
