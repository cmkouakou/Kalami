/**
 * =============================================================
 *  Fichier    : page.tsx (admin/textes-legaux)
 *  Projet     : Kalami
 *  Description: Textes légaux en administration : pour chaque texte (confidentialité,
 *               conditions d'utilisation et de vente), version en vigueur et publication
 *               d'une nouvelle version préremplie. Registre des consentements et
 *               suppressions de compte en attente (compteurs).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/legal/documents.ts, lib/legal/actions.ts, lib/legal/admin-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { LegalParagraphs } from "@/components/legal/legal-text";
import { Field, TextArea } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { publishLegalDocument } from "@/lib/legal/actions";
import { getPrivacyCounters } from "@/lib/legal/admin-queries";
import { getLegalDocument } from "@/lib/legal/documents";
import { LEGAL_KINDS, legalPath, type LegalKind } from "@/lib/legal/kinds";
import { DATE_LONG_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const l = t.admin.legal;

export const metadata: Metadata = { title: l.title };

export default function AdminLegalPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{l.title}</h1>
        <p className="text-ink-muted">{l.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <LegalAdmin />
      </Suspense>
    </main>
  );
}

/** Compteurs puis un bloc par texte (accès réservé à l'administrateur). */
async function LegalAdmin() {
  await requireAdmin();
  const counters = await getPrivacyCounters();

  return (
    <>
      <section className={`${CARD} flex flex-col gap-1 p-5 text-sm`}>
        <h2 className="text-lg font-semibold">{l.consents}</h2>
        <p>
          {interpolate(l.consentsCount, {
            accepted: String(counters.accepted),
            refused: String(counters.refused),
          })}
        </p>
        <p>{interpolate(l.deletions, { count: String(counters.pendingDeletions) })}</p>
      </section>
      {LEGAL_KINDS.map((kind) => (
        <LegalDocumentAdmin key={kind} kind={kind} />
      ))}
    </>
  );
}

/** Version en vigueur d'un texte et formulaire de nouvelle version. */
async function LegalDocumentAdmin({ kind }: { kind: LegalKind }) {
  const document = await getLegalDocument(kind);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-semibold">{t.legal.kinds[kind]}</h2>
        <Link href={legalPath(kind)} className="text-sm text-encre underline">
          {l.view}
        </Link>
      </div>

      <div className={`${CARD} flex flex-col gap-3 p-5`}>
        <h3 className="font-semibold">{l.current}</h3>
        {document ? (
          <>
            <p className="text-sm text-ink-muted">
              {interpolate(t.legal.version, {
                version: String(document.version),
                date: DATE_LONG_FORMAT.format(new Date(document.published_at)),
              })}
            </p>
            <div tabIndex={0} className="max-h-72 overflow-y-auto text-sm">
              <LegalParagraphs body={document.body} />
            </div>
          </>
        ) : (
          <p className="text-ink-muted">{l.none}</p>
        )}
      </div>

      <details className={`${CARD} p-5`}>
        <summary className="cursor-pointer font-semibold">{l.newVersion}</summary>
        <ActionForm
          action={publishLegalDocument.bind(null, kind)}
          submitLabel={l.publish}
          className="mt-4"
        >
          <Field
            label={l.docTitle}
            name="title"
            required
            maxLength={200}
            defaultValue={document?.title ?? t.legal.kinds[kind]}
          />
          <TextArea
            label={l.body}
            name="body"
            rows={18}
            required
            maxLength={100000}
            defaultValue={document?.body ?? ""}
          />
        </ActionForm>
      </details>
    </section>
  );
}
