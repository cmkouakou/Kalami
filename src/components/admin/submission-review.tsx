/**
 * =============================================================
 *  Fichier    : submission-review.tsx
 *  Projet     : Kalami
 *  Description: Panneau de décision sur une demande de validation (fiche d'un livre en
 *               administration) : version soumise, lien d'aperçu, validation ou refus motivé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: components/admin/action-form.tsx, lib/admin/submission-actions.ts
 * =============================================================
 */

import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { TextArea } from "@/components/ui/form";
import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { BookVersionSummary } from "@/lib/admin/content-queries";
import { reviewSubmission } from "@/lib/admin/submission-actions";

const t = getDictionary();
const s = t.admin.submissions;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const NUMBER_FORMAT = new Intl.NumberFormat("fr-FR");

type SubmissionReviewProps = {
  bookId: string;
  submission: { id: string; submitted_at: string; version: BookVersionSummary | null };
};

/** Encadré mis en évidence en haut de la fiche du livre. */
export function SubmissionReview({ bookId, submission }: SubmissionReviewProps) {
  const { version } = submission;
  return (
    <section className="flex flex-col gap-4 rounded-lg border-2 border-warning bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{s.review}</h2>
        <p className="text-sm text-ink-muted">
          {s.date} {DATE_FORMAT.format(new Date(submission.submitted_at))}
        </p>
        <p className="text-sm text-ink-muted">{s.reviewHelp}</p>
      </div>
      {version && (
        <p className="text-sm">
          {interpolate(s.pending, {
            chapters: String(version.chapter_count),
            words: NUMBER_FORMAT.format(version.word_count),
          })}
        </p>
      )}
      <Link href={`/apercu/${bookId}`} className={`${BUTTON_SECONDARY} w-fit`}>
        {t.author.book.preview}
      </Link>
      <ActionForm action={reviewSubmission.bind(null, submission.id)} submitLabel={s.review}>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">{s.review}</legend>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="radio" name="decision" value="approve" required className="size-5" />
            {s.approve}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="radio" name="decision" value="reject" className="size-5" />
            {s.reject}
          </label>
        </fieldset>
        <TextArea label={s.reason} name="reason" rows={3} maxLength={2000} />
      </ActionForm>
    </section>
  );
}
