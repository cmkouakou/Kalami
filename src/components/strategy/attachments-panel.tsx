/**
 * =============================================================
 *  Fichier    : attachments-panel.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Documents joints au profil de l'organisation (S5b). Le fichier part
 *               directement du navigateur vers le seau privé « study-attachments », puis
 *               l'action serveur l'enregistre. Chaque pièce peut être téléchargée, supprimée
 *               (en deux temps) et analysée par le coach (résumé et propositions pour le
 *               profil). Les observateurs consultent la liste et les résumés seulement.
 *               Sans forfait, le coach est verrouillé et renvoie vers sa page (v0.11.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/client.ts, lib/strategy/attachment-actions.ts,
 *               lib/strategy/attachments.ts, coach-panel.tsx, prefill-review.tsx
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";

import {
  CoachLocked,
  coachPageHref,
  EstimateHint,
  UsageGauge,
} from "@/components/strategy/coach-panel";
import { PrefillReview } from "@/components/strategy/prefill-review";
import { FormMessage } from "@/components/ui/form";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import {
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  analyzeAttachment,
  attachmentLink,
  deleteAttachment,
  registerAttachment,
} from "@/lib/strategy/attachment-actions";
import type { AttachmentsState, StudyAttachment } from "@/lib/strategy/attachment-queries";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_FORMATS,
  ATTACHMENTS_BUCKET,
  ATTACHMENTS_MAX,
  attachmentPath,
  checkAttachment,
  extensionOf,
  formatSize,
} from "@/lib/strategy/attachments";
import type { ProfileData } from "@/lib/strategy/profile";
import { createClient } from "@/lib/supabase/client";
import { DATE_TIME_FORMAT } from "@/lib/format/date";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const a = s.attachments;

/** Message du contrôle préalable d'un fichier. */
const CHECK_ERRORS = {
  format: a.errors.format,
  too_large: a.errors.tooLarge,
  image_too_large: a.errors.imageTooLarge,
} as const;

type Feedback = { error?: string; message?: string };

type AttachmentsPanelProps = {
  studyId: string;
  state: AttachmentsState;
  profile: ProfileData;
  /** Vrai pour le propriétaire et les contributeurs. */
  editor: boolean;
};

// ==================== SOUS-COMPOSANTS ====================

type AttachmentItemProps = {
  studyId: string;
  attachment: StudyAttachment;
  profile: ProfileData;
  editor: boolean;
  /** Raison pour laquelle l'analyse est impossible, sinon null. */
  blocked: string | null;
};

/** Une pièce jointe : actions, puis résumé et propositions de la dernière analyse. */
function AttachmentItem({ studyId, attachment, profile, editor, blocked }: AttachmentItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"analyze" | "delete" | "download" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({});

  /**
   * Lance une action serveur en affichant son état et son erreur éventuelle.
   * @param name - Action en cours
   * @param run  - Action à exécuter ; renvoie un message d'erreur ou null
   */
  function perform(name: typeof action, run: () => Promise<string | null>) {
    setFeedback({});
    setAction(name);
    startTransition(async () => {
      const error = await run();
      if (error) setFeedback({ error });
      setAction(null);
    });
  }

  /** Ouvre un lien signé de téléchargement (valable 60 secondes). */
  function download() {
    perform("download", async () => {
      const result = await attachmentLink(attachment.id);
      if (!result.ok) return result.error;
      window.location.assign(result.url);
      return null;
    });
  }

  /** Supprime la pièce après confirmation. */
  function remove() {
    setConfirming(false);
    perform("delete", async () => {
      const result = await deleteAttachment(attachment.id);
      return result.ok ? null : result.error;
    });
  }

  /** Demande au coach le résumé et les propositions (forfait absent : page du coach). */
  function analyze() {
    perform("analyze", async () => {
      const result = await analyzeAttachment(studyId, attachment.id);
      if (result.ok) return null;
      if (result.pay) router.push(coachPageHref(studyId));
      return result.error;
    });
  }

  return (
    <li className={`${CARD} flex flex-col gap-4 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="break-words font-medium">{attachment.fileName}</p>
          <p className="text-small text-ink-muted">
            {formatSize(attachment.sizeBytes)} ·{" "}
            {interpolate(a.addedAt, { date: DATE_TIME_FORMAT.format(new Date(attachment.createdAt)) })}
            {attachment.analyzedAt && (
              <>
                {" · "}
                {interpolate(a.analyzedAt, {
                  date: DATE_TIME_FORMAT.format(new Date(attachment.analyzedAt)),
                })}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON_TERTIARY} disabled={pending} onClick={download}>
            {a.download}
          </button>
          {editor && (
            <button
              type="button"
              className={BUTTON_SECONDARY}
              disabled={pending || blocked !== null}
              title={blocked ?? undefined}
              onClick={analyze}
            >
              {attachment.analysis ? a.analyzeAgain : a.analyze}
            </button>
          )}
          {editor && !confirming && (
            <button
              type="button"
              className={BUTTON_TERTIARY}
              disabled={pending}
              onClick={() => setConfirming(true)}
            >
              <IconTrash size={16} />
              {a.delete}
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON_SECONDARY} disabled={pending} onClick={remove}>
            {a.confirmDelete}
          </button>
          <button
            type="button"
            className={BUTTON_TERTIARY}
            onClick={() => setConfirming(false)}
          >
            {a.cancel}
          </button>
        </div>
      )}

      {action === "analyze" && (
        <p role="status" className="text-small text-ink-muted">{a.analyzing}</p>
      )}
      <FormMessage {...feedback} />

      {attachment.analysis && (
        <PrefillReview
          key={attachment.analysis.requestId}
          studyId={studyId}
          analysis={attachment.analysis}
          profile={profile}
          canAct={editor}
        />
      )}
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Panneau des documents de l'organisation, sous le profil. */
export function AttachmentsPanel({ studyId, state, profile, editor }: AttachmentsPanelProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({});
  const { attachments, usage, canAnalyze } = state;
  const full = attachments.length >= ATTACHMENTS_MAX;
  const inputId = `pieces-${studyId}`;

  let blocked: string | null = null;
  if (!canAnalyze) blocked = a.notAvailable;
  else if (!usage.enabled) blocked = s.coach.disabled;
  else if (!usage.unlocked) blocked = s.coach.locked;

  /** Contrôle, envoie puis fait enregistrer le fichier choisi. */
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const problem = checkAttachment(file);
    const extension = extensionOf(file.name);
    if (problem || !extension) {
      setFeedback({ error: CHECK_ERRORS[problem ?? "format"] });
      input.value = "";
      return;
    }

    setUploading(true);
    setFeedback({ message: interpolate(a.uploading, { name: file.name }) });
    try {
      const path = attachmentPath(studyId, extension);
      const { error } = await createClient()
        .storage.from(ATTACHMENTS_BUCKET)
        .upload(path, file, { contentType: ATTACHMENT_FORMATS[extension] });
      if (error) throw error;

      const result = await registerAttachment(studyId, path, file.name);
      setFeedback(result.ok ? { message: a.uploaded } : { error: result.error });
      router.refresh();
    } catch {
      setFeedback({ error: a.errors.upload });
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <section aria-labelledby={`${inputId}-titre`} className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h2 id={`${inputId}-titre`} className="font-serif text-h2 font-semibold">{a.title}</h2>
        <p className="text-ink-muted">{a.intro}</p>
        <p className="text-small text-ink-muted">{a.hint}</p>
      </header>

      {!editor ? (
        <p className={`${PANEL_SAND} p-4 text-small`}>{a.readOnly}</p>
      ) : usage.enabled && !usage.unlocked ? (
        <CoachLocked studyId={studyId} />
      ) : (
        <UsageGauge usage={usage} studyId={studyId} />
      )}
      {editor && blocked && blocked !== s.coach.locked && (
        <p className="text-small text-ink-muted">{blocked}</p>
      )}
      {editor && !blocked && <EstimateHint usage={usage} fn="extract" />}

      {editor && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor={inputId}
            aria-disabled={uploading || full}
            className={`${BUTTON_SECONDARY} w-fit cursor-pointer aria-disabled:cursor-not-allowed
              aria-disabled:opacity-60`}
          >
            <IconPlus size={16} />
            {a.add}
          </label>
          <input
            id={inputId}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            onChange={handleChange}
            disabled={uploading || full}
            className="sr-only"
          />
          <p className="text-small text-ink-muted">
            {full
              ? a.errors.tooMany
              : interpolate(a.count, { count: String(attachments.length) })}
          </p>
          <FormMessage {...feedback} />
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-small text-ink-muted">{a.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              studyId={studyId}
              attachment={attachment}
              profile={profile}
              editor={editor}
              blocked={blocked}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
