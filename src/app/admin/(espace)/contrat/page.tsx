/**
 * =============================================================
 *  Fichier    : page.tsx (admin/contrat)
 *  Projet     : Kalami
 *  Description: Contrat auteur en administration : version en vigueur, nombre
 *               d'acceptations, publication d'une nouvelle version (préremplie avec le
 *               texte actuel). Une version publiée n'est jamais modifiée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, lib/admin/submission-actions.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { ContractText } from "@/components/author/contract-text";
import { Field, TextArea } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { publishContract } from "@/lib/admin/submission-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { countContractAcceptances, getLatestContract } from "@/lib/author/queries";

const t = getDictionary();
const c = t.admin.contract;

export const metadata: Metadata = { title: c.title };

export default function AdminContractPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{c.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ContractAdmin />
      </Suspense>
    </main>
  );
}

/** Version en vigueur et formulaire de nouvelle version. */
async function ContractAdmin() {
  await requireAdmin();
  const contract = await getLatestContract();
  const acceptances = contract ? await countContractAcceptances(contract.id) : 0;

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{c.current}</h2>
        {contract ? (
          <>
            <p className="text-sm text-ink-muted">
              {interpolate(c.acceptances, { count: String(acceptances) })}
            </p>
            <ContractText contract={contract} />
          </>
        ) : (
          <p className="text-ink-muted">{c.none}</p>
        )}
      </section>

      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{c.newVersion}</h2>
          <p className="text-sm text-ink-muted">{c.newVersionHelp}</p>
        </div>
        <ActionForm action={publishContract} submitLabel={c.publish}>
          <Field
            label={c.contractTitle}
            name="title"
            required
            maxLength={200}
            defaultValue={contract?.title ?? ""}
          />
          <TextArea
            label={c.body}
            name="body"
            rows={18}
            required
            maxLength={100000}
            defaultValue={contract?.body ?? ""}
          />
        </ActionForm>
      </section>
    </>
  );
}
