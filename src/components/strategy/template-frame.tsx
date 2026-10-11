/**
 * =============================================================
 *  Fichier    : template-frame.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Cadre commun des gabarits : avis de lecture seule, état de la sauvegarde
 *               automatique, contenu du gabarit, liste de contrôle avant validation,
 *               actions de l'étape et historique des versions.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: step-actions.tsx, version-history.tsx, use-autosave.ts
 * =============================================================
 */

"use client";

import type { ReactNode } from "react";

import { StepActions } from "@/components/strategy/step-actions";
import type { Autosave } from "@/components/strategy/use-autosave";
import { VersionHistory } from "@/components/strategy/version-history";
import { BUTTON_TERTIARY, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { StepVersion } from "@/lib/strategy/queries";
import type { StepNo, StepStatus, StudyRole } from "@/lib/strategy/steps";

const t = getDictionary();
const s = t.strategy;
const tpl = s.template;

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

export type TemplateFrameProps = {
  studyId: string;
  stepNo: StepNo;
  role: StudyRole;
  /** Statut lu par le serveur au chargement de la page. */
  status: StepStatus;
  affectedTitles: string[];
  versions: StepVersion[];
};

type FrameProps = TemplateFrameProps & {
  autosave: Pick<Autosave<unknown>, "status" | "revision" | "pending" | "retry">;
  /** Points de la liste de contrôle, déjà traduits. */
  checklist: { label: string; ok: boolean }[];
  children: ReactNode;
};

// ==================== SOUS-COMPOSANTS ====================

/** Ligne d'état de la sauvegarde automatique (annoncée aux lecteurs d'écran). */
function SaveStatus({ autosave }: { autosave: FrameProps["autosave"] }) {
  const { status } = autosave;
  let text: string = tpl.autosave.idle;
  if (status.kind === "dirty") text = tpl.autosave.dirty;
  if (status.kind === "saving") text = tpl.autosave.saving;
  if (status.kind === "saved") {
    text = interpolate(tpl.autosave.saved, { time: TIME_FORMAT.format(new Date(status.at)) });
  }
  if (status.kind === "error") {
    text = interpolate(tpl.autosave.error, { error: status.message || s.errors.generic });
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-3 text-small ${
        status.kind === "error" ? "text-danger" : "text-ink-muted"
      }`}
    >
      <span>{text}</span>
      {status.kind === "error" && !status.conflict && (
        <button type="button" className={BUTTON_TERTIARY} onClick={autosave.retry}>
          {tpl.autosave.retry}
        </button>
      )}
      {status.kind === "error" && status.conflict && (
        <button
          type="button"
          className={BUTTON_TERTIARY}
          onClick={() => window.location.reload()}
        >
          {tpl.autosave.reload}
        </button>
      )}
    </div>
  );
}

/** Liste de contrôle minimale avant validation. */
function Checklist({ items }: { items: FrameProps["checklist"] }) {
  return (
    <section className={`${PANEL_SAND} flex flex-col gap-2 p-4`}>
      <h2 className="font-semibold">{tpl.checklist.title}</h2>
      <ul className="flex flex-col gap-1 text-small">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden="true" className={item.ok ? "text-success" : "text-ink-muted"}>
              {item.ok ? "✓" : "○"}
            </span>
            <span>{item.label}</span>
            <span className="sr-only">
              {" "}: {item.ok ? tpl.checklist.done : tpl.checklist.missing}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ==================== COMPOSANT ====================

/** Encadre un gabarit : état, contenu, contrôle, actions et versions. */
export function TemplateFrame({
  studyId,
  stepNo,
  role,
  status,
  affectedTitles,
  versions,
  autosave,
  checklist,
  children,
}: FrameProps) {
  const editor = role === "owner" || role === "contributor";
  const validated = status === "validated";
  // Le premier enregistrement fait passer l'étape « à faire » en « en cours » côté serveur
  const effectiveStatus: StepStatus = status === "todo" && autosave.revision > 0
    ? "in_progress"
    : status;

  let validateBlocked: string | undefined;
  if (autosave.pending) validateBlocked = tpl.checklist.waitSave;
  else if (checklist.some((item) => !item.ok)) validateBlocked = s.errors.checklist_incomplete;

  return (
    <div className="flex flex-col gap-6">
      {!editor && <p className={`${PANEL_SAND} p-4 text-small`}>{tpl.readOnlyObserver}</p>}
      {editor && validated && (
        <p className={`${PANEL_SAND} p-4 text-small`}>{tpl.readOnlyValidated}</p>
      )}
      {editor && !validated && (
        <div className={`${CARD} sticky top-2 z-10 px-4 py-2`}>
          <SaveStatus autosave={autosave} />
        </div>
      )}

      {children}

      {!validated && <Checklist items={checklist} />}

      <StepActions
        studyId={studyId}
        stepNo={stepNo}
        status={effectiveStatus}
        role={role}
        isPlan={false}
        affectedTitles={affectedTitles}
        startByEditing
        validateBlocked={validateBlocked}
      />

      <VersionHistory
        studyId={studyId}
        stepNo={stepNo}
        versions={versions}
        revision={autosave.revision}
        canRestore={editor && !validated}
        pending={autosave.pending}
      />
    </div>
  );
}
