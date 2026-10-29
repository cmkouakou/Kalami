/**
 * =============================================================
 *  Fichier    : privacy-sections.tsx
 *  Projet     : Kalami
 *  Description: Sections « Mes données » (export JSON, politique) et « Supprimer mon
 *               compte » (impact, confirmation, annulation) de la page du compte. Partagées
 *               par la librairie (/compte) et Kalami Stratégie (/strategie/compte).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/account/deletion.ts, lib/account/actions.ts, components/admin/action-form
 * =============================================================
 */

import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/ui/form";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { cancelAccountDeletion, requestAccountDeletion } from "@/lib/account/actions";
import { getDeletionState } from "@/lib/account/deletion";
import { legalPath, type LegalSpace } from "@/lib/legal/kinds";
import { DATE_LONG_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const p = t.account.privacy;
const d = t.account.deletion;

/** Export des données personnelles et lien vers la politique de l'espace. */
export function AccountPrivacySection({ space }: { space: LegalSpace }) {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-6`}>
      <h2 className="text-lg font-semibold">{p.title}</h2>
      <p className="text-sm text-ink-muted">{p.intro}</p>
      <div className="flex flex-wrap items-center gap-4">
        {/* Téléchargement direct : un lien simple, sans navigation côté client */}
        <a href="/api/compte/export" download className={`${BUTTON_SECONDARY} px-4`}>
          {p.export}
        </a>
        <Link href={legalPath("privacy", space)} className="text-sm text-encre underline">
          {p.policyLink}
        </Link>
      </div>
    </section>
  );
}

/** Demande de suppression (avec son impact) ou demande en cours (avec annulation). */
export async function AccountDeletionSection({ userId }: { userId: string }) {
  const { scheduledFor, impact } = await getDeletionState(userId);

  return (
    <section className={`${CARD} flex flex-col gap-3 p-6`}>
      <h2 className="text-lg font-semibold">{d.title}</h2>
      {scheduledFor ? (
        <>
          <p className="font-semibold">
            {interpolate(d.pending, { date: DATE_LONG_FORMAT.format(new Date(scheduledFor)) })}
          </p>
          <p className="text-sm text-ink-muted">{d.pendingHelp}</p>
          <ActionForm action={cancelAccountDeletion} submitLabel={d.cancel}>
            {null}
          </ActionForm>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-muted">{d.intro}</p>
          <h3 className="font-semibold">{d.impactTitle}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>{d.impactBase}</li>
            {impact.ownedStudies > 0 && (
              <li>{interpolate(d.impactStudies, { count: String(impact.ownedStudies) })}</li>
            )}
            {impact.sharedStudies > 0 && (
              <li>{interpolate(d.impactShared, { count: String(impact.sharedStudies) })}</li>
            )}
            {impact.classes > 0 && (
              <li>{interpolate(d.impactClasses, { count: String(impact.classes) })}</li>
            )}
            {impact.isAuthor && <li>{d.impactAuthor}</li>}
          </ul>
          <ActionForm action={requestAccountDeletion} submitLabel={d.request}>
            <Field
              label={d.confirmLabel}
              name="confirmation"
              required
              autoComplete="off"
              spellCheck={false}
            />
          </ActionForm>
        </>
      )}
    </section>
  );
}
