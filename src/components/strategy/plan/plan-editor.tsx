/**
 * =============================================================
 *  Fichier    : plan-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Éditeur du plan stratégique (étape 9, S8a) : génération du brouillon depuis
 *               les étapes (sans IA), huit sections éditables, régénérables et rédigeables
 *               avec le coach, annexe de traçabilité et historique des versions. Le plan
 *               s'enregistre automatiquement et ne se valide jamais. Lecture seule pour les
 *               observateurs. Export PDF / DOCX du plan pour tous les membres (S8b).
 *               Sans forfait, le coach est verrouillé et renvoie vers sa page (v0.11.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-16
 *  Dépendances: use-autosave.ts, template-frame.tsx (SaveStatus), version-history.tsx,
 *               coach-panel.tsx (UsageGauge, CoachLocked), plan-section.tsx, plan-annex.tsx,
 *               plan-export.tsx, lib/strategy/plan-actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { CoachLocked, UsageGauge } from "@/components/strategy/coach-panel";
import { PlanAnnex } from "@/components/strategy/plan/plan-annex";
import { PlanExport } from "@/components/strategy/plan/plan-export";
import { PlanSection } from "@/components/strategy/plan/plan-section";
import { SaveStatus } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import { VersionHistory } from "@/components/strategy/version-history";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { PlanCoachState } from "@/lib/strategy/coach/queries";
import { assemblePlanForStudy } from "@/lib/strategy/plan-actions";
import type { CatalogEntry } from "@/lib/strategy/plan-trace";
import type { StepVersion } from "@/lib/strategy/queries";
import { canEdit, PLAN_STEP, type StudyRole } from "@/lib/strategy/steps";
import {
  editSection,
  isGenerated,
  replaceSection,
  type PlanPayload,
} from "@/lib/strategy/templates/plan";
import { DATE_TIME_LONG_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const s = t.strategy;
const p = s.plan;

// ==================== TYPES ====================

type PlanEditorProps = {
  studyId: string;
  role: StudyRole;
  initial: PlanPayload;
  revision: number;
  versions: StepVersion[];
  /** Éléments citables des étapes (libellés de l'annexe). */
  catalog: CatalogEntry[];
  coach: PlanCoachState;
};

// ==================== COMPOSANT ====================

/** Plan stratégique éditable, enregistré automatiquement. */
export function PlanEditor({
  studyId,
  role,
  initial,
  revision,
  versions,
  catalog,
  coach,
}: PlanEditorProps) {
  const editor = canEdit(role);
  const autosave = useAutosave(initial, {
    studyId,
    stepNo: PLAN_STEP,
    revision,
    enabled: editor,
  });
  const { value: plan, update } = autosave;
  const [usage, setUsage] = useState(coach.usage);
  const [confirmAll, setConfirmAll] = useState(false);
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const generated = isGenerated(plan);

  // Le coach relit le plan enregistré : il attend la fin de la sauvegarde
  let coachBlocked = "";
  if (!coach.available) coachBlocked = s.coach.errors.not_published;
  else if (!usage.enabled) coachBlocked = s.coach.disabled;
  else if (!usage.unlocked) coachBlocked = s.coach.locked;
  else if (autosave.pending) coachBlocked = p.coachWaitSave;

  /** Assemble le plan entier depuis les étapes, puis l'enregistre. */
  function generate() {
    startTransition(async () => {
      setError("");
      const assembled = await assemblePlanForStudy(studyId).catch(() => null);
      setConfirmAll(false);
      if (assembled) update(() => assembled);
      else setError(s.errors.generic);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-muted">{p.intro}</p>
      {!editor && <p className={`${PANEL_SAND} p-4 text-small`}>{p.readOnly}</p>}
      {editor && (
        <div className={`${CARD} sticky top-2 z-10 px-4 py-2`}>
          <SaveStatus autosave={autosave} />
        </div>
      )}

      {/* ==================== GÉNÉRATION ==================== */}
      {!generated ? (
        <section className={`${PANEL_SAND} flex flex-col gap-3 p-4`}>
          <p>{p.notGenerated}</p>
          {editor && (
            <button
              type="button"
              className={`${BUTTON_PRIMARY} w-fit`}
              disabled={busy}
              onClick={generate}
            >
              {busy ? p.generating : p.generate}
            </button>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-small text-ink-muted">
            {interpolate(p.generatedAt, { date: DATE_TIME_LONG_FORMAT.format(new Date(plan.generatedAt)) })}
            {" "}{p.neverValidated}
          </p>
          {editor && !confirmAll && (
            <button
              type="button"
              className={`${BUTTON_SECONDARY} w-fit`}
              disabled={busy}
              onClick={() => setConfirmAll(true)}
            >
              {p.regenerateAll}
            </button>
          )}
          {editor && confirmAll && (
            <div role="alertdialog" className={`${PANEL_SAND} flex flex-col gap-3 p-4`}>
              <p className="text-small">{p.regenerateAllConfirm}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={BUTTON_PRIMARY} disabled={busy} onClick={generate}>
                  {busy ? p.generating : p.confirm}
                </button>
                <button
                  type="button"
                  className={BUTTON_TERTIARY}
                  disabled={busy}
                  onClick={() => setConfirmAll(false)}
                >
                  {p.cancel}
                </button>
              </div>
            </div>
          )}
          {editor && coach.available && (usage.enabled && !usage.unlocked
            ? <CoachLocked studyId={studyId} />
            : <UsageGauge usage={usage} studyId={studyId} />)}
        </section>
      )}

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      {/* ==================== EXPORT ==================== */}
      {generated && <PlanExport studyId={studyId} pending={autosave.pending} />}

      {/* ==================== SECTIONS ==================== */}
      {generated && (
        <>
          {plan.sections.map((section) => (
            <PlanSection
              key={section.key}
              studyId={studyId}
              section={section}
              readOnly={!editor}
              coachBlocked={coachBlocked}
              onReplace={(next) => update((previous) => replaceSection(previous, next))}
              onEdit={(blocks) => update((previous) => editSection(previous, section.key, blocks))}
              onUsage={setUsage}
            />
          ))}
          <PlanAnnex plan={plan} catalog={catalog} />
        </>
      )}

      <VersionHistory
        studyId={studyId}
        stepNo={PLAN_STEP}
        versions={versions}
        revision={autosave.revision}
        canRestore={editor}
        pending={autosave.pending}
      />
    </div>
  );
}
