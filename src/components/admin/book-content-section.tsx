/**
 * =============================================================
 *  Fichier    : book-content-section.tsx
 *  Projet     : Kalami
 *  Description: Section « Contenu du livre » de la fiche d'administration : dépôt du
 *               manuscrit, version et sommaire convertis, règles de l'extrait gratuit,
 *               droits de lecture (liste, octroi manuel, retrait).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: lib/admin/content-actions.ts, lib/admin/content-queries.ts, components/admin
 * =============================================================
 */

import { ActionForm } from "@/components/admin/action-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ManuscriptUpload } from "@/components/admin/manuscript-upload";
import { Field } from "@/components/ui/form";
import { getDictionary, interpolate } from "@/i18n";
import {
  grantEntitlement,
  revokeEntitlement,
  updatePreviewRule,
} from "@/lib/admin/content-actions";
import type { BookContentAdmin, EntitlementRow } from "@/lib/admin/content-queries";

const t = getDictionary();
const l = t.admin.content;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const NUMBER_FORMAT = new Intl.NumberFormat("fr-FR");

const CARD_CLASS = "flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6";

type BookContentSectionProps = { bookId: string; content: BookContentAdmin };

/** Section complète, sous le formulaire du livre. */
export function BookContentSection({ bookId, content }: BookContentSectionProps) {
  return (
    <section aria-labelledby="contenu-titre" className="flex flex-col gap-6">
      <h2 id="contenu-titre" className="font-serif text-2xl font-semibold">
        {l.title}
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <VersionCard bookId={bookId} content={content} />
        <PreviewCard bookId={bookId} content={content} />
      </div>
      <EntitlementsCard bookId={bookId} entitlements={content.entitlements} />
    </section>
  );
}

// ==================== MANUSCRIT ET SOMMAIRE ====================

/** Dépôt du manuscrit, version courante et sommaire avec nombre de blocs. */
function VersionCard({ bookId, content }: BookContentSectionProps) {
  const { version, toc } = content;
  return (
    <div className={CARD_CLASS}>
      <ManuscriptUpload bookId={bookId} />
      {version ? (
        <p className="text-sm font-medium">
          {interpolate(l.currentVersion, {
            number: String(version.version_number),
            format: version.source_format.toUpperCase(),
            chapters: NUMBER_FORMAT.format(version.chapter_count),
            words: NUMBER_FORMAT.format(version.word_count),
          })}
        </p>
      ) : (
        <p className="text-sm text-ink-muted">{l.noVersion}</p>
      )}
      {toc.length > 0 && (
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{l.toc}</summary>
          <ol className="flex max-h-96 flex-col gap-1 overflow-y-auto text-sm">
            {toc.map((entry) => (
              <li key={entry.chapter_position} className="flex justify-between gap-4">
                <span>
                  {entry.chapter_position}. {entry.title}
                  {entry.is_preview && <span className="text-encre"> ★</span>}
                </span>
                <span className="shrink-0 text-ink-muted">
                  {interpolate(l.blocks, { count: String(entry.block_count) })}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

// ==================== EXTRAIT GRATUIT ====================

/** Formulaire des règles de l'extrait. */
function PreviewCard({ bookId, content }: BookContentSectionProps) {
  return (
    <div className={CARD_CLASS}>
      <h3 className="font-semibold">{l.preview}</h3>
      <p className="text-sm text-ink-muted">{l.previewHelp}</p>
      <ActionForm action={updatePreviewRule.bind(null, bookId)} submitLabel={t.admin.common.save}>
        <Field
          label={l.previewChapters}
          name="preview_chapters"
          type="number"
          min={0}
          max={content.toc.length || 1000}
          required
          defaultValue={content.preview_chapters}
        />
        <Field
          label={l.previewCut}
          name="preview_cut_block"
          type="number"
          min={1}
          max={20000}
          defaultValue={content.preview_cut_block ?? ""}
        />
      </ActionForm>
    </div>
  );
}

// ==================== DROITS DE LECTURE ====================

/** Liste des droits et formulaire d'octroi manuel. */
function EntitlementsCard({
  bookId,
  entitlements,
}: {
  bookId: string;
  entitlements: EntitlementRow[];
}) {
  return (
    <div className={CARD_CLASS}>
      <h3 className="font-semibold">{l.entitlements}</h3>
      <p className="text-sm text-ink-muted">{l.entitlementsHelp}</p>
      {entitlements.length === 0 ? (
        <p className="text-sm">{l.noEntitlements}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {entitlements.map((row) => (
            <EntitlementItem key={row.id} row={row} />
          ))}
        </ul>
      )}
      <ActionForm
        action={grantEntitlement.bind(null, bookId)}
        submitLabel={l.grant}
        resetOnSuccess
        className="grid gap-4 sm:grid-cols-2 sm:items-end"
      >
        <Field label={l.grantEmail} name="email" type="email" required autoComplete="off" />
        <Field label={l.grantNote} name="note" maxLength={500} />
      </ActionForm>
    </div>
  );
}

/** Ligne d'un droit : lecteur, origine, date, bouton de retrait si actif. */
function EntitlementItem({ row }: { row: EntitlementRow }) {
  const revoked = row.revoked_at !== null;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className={`flex flex-col text-sm ${revoked ? "text-ink-muted line-through" : ""}`}>
        <span className="font-medium">{row.email}</span>
        <span className="text-ink-muted">
          {l.sources[row.source]} · {DATE_FORMAT.format(new Date(row.created_at))}
          {row.note && ` · ${row.note}`}
        </span>
      </div>
      {!revoked && (
        <DeleteButton
          action={revokeEntitlement.bind(null, row.id)}
          label={l.revoke}
          confirmLabel={l.revokeConfirm}
        />
      )}
    </li>
  );
}
