/**
 * =============================================================
 *  Fichier    : action-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 8, « Action » : feuille de route (chantiers, phases, vue
 *               Gantt), tableau de bord équilibré et risques, enregistrés automatiquement
 *               dans le cadre commun (liste de contrôle, actions, versions, coach).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: action/*.tsx, template-frame.tsx, use-autosave.ts,
 *               lib/strategy/templates/action.ts
 * =============================================================
 */

"use client";

import { GanttChart } from "@/components/strategy/action/gantt-chart";
import { RisksList } from "@/components/strategy/action/risks-list";
import { Scorecard } from "@/components/strategy/action/scorecard";
import { WorkstreamsList } from "@/components/strategy/action/workstreams-list";
import type { LinkOption } from "@/components/strategy/synthesis/link-picker";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import {
  actionChecklist,
  INDICATORS_MAX,
  newIndicator,
  newRisk,
  newWorkstream,
  RISKS_MAX,
  WORKSTREAMS_MAX,
  type ActionPayload,
  type Perspective,
} from "@/lib/strategy/templates/action";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.action;

type ActionEditorProps = TemplateFrameProps & {
  initial: ActionPayload;
  revision: number;
  /** Options retenues à l'étape 7. */
  options: LinkOption[];
  /** Objectifs rédigés à l'étape 6. */
  objectives: LinkOption[];
};

/**
 * Applique une modification à un élément d'une liste identifiée par id.
 * @param list   - Liste d'origine
 * @param id     - Élément visé
 * @param change - Transformation de l'élément
 */
function patchById<T extends { id: string }>(list: T[], id: string, change: (item: T) => T): T[] {
  return list.map((item) => (item.id === id ? change(item) : item));
}

/** Retire un chantier et détache les risques qui le visaient. */
function removeWorkstream(prev: ActionPayload, id: string): ActionPayload {
  return {
    ...prev,
    workstreams: prev.workstreams.filter((item) => item.id !== id),
    risks: prev.risks.map((risk) => (risk.workstream === id ? { ...risk, workstream: "" } : risk)),
  };
}

/** Ajoute un indicateur vide dans une perspective (dans la limite). */
function addIndicator(prev: ActionPayload, perspective: Perspective): ActionPayload {
  if (prev.indicators.length >= INDICATORS_MAX) return prev;
  return {
    ...prev,
    indicators: [...prev.indicators, newIndicator(crypto.randomUUID(), perspective)],
  };
}

/** Gabarit « Action » complet. */
export function ActionEditor({
  initial,
  revision,
  options,
  objectives,
  ...frame
}: ActionEditorProps) {
  const editor = frame.role === "owner" || frame.role === "contributor";
  const readOnly = !editor || frame.status === "validated";
  const autosave = useAutosave(initial, {
    studyId: frame.studyId,
    stepNo: frame.stepNo,
    revision,
    enabled: !readOnly,
  });
  const { value, update } = autosave;

  return (
    <TemplateFrame
      {...frame}
      autosave={autosave}
      checklist={actionChecklist(value).map((item) => ({
        label: s.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <WorkstreamsList
        workstreams={value.workstreams}
        options={options}
        objectives={objectives}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.workstreams.length >= WORKSTREAMS_MAX
              ? prev
              : {
                  ...prev,
                  workstreams: [...prev.workstreams, newWorkstream(crypto.randomUUID())],
                },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            workstreams: patchById(prev.workstreams, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) => update((prev) => removeWorkstream(prev, id))}
      />

      <GanttChart workstreams={value.workstreams} />

      <Scorecard
        payload={value}
        objectives={objectives}
        readOnly={readOnly}
        onAdd={(perspective) => update((prev) => addIndicator(prev, perspective))}
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            indicators: patchById(prev.indicators, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({
            ...prev,
            indicators: prev.indicators.filter((item) => item.id !== id),
          }))
        }
      />

      <RisksList
        risks={value.risks}
        workstreams={value.workstreams}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.risks.length >= RISKS_MAX
              ? prev
              : { ...prev, risks: [...prev.risks, newRisk(crypto.randomUUID())] },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            risks: patchById(prev.risks, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, risks: prev.risks.filter((item) => item.id !== id) }))
        }
      />
    </TemplateFrame>
  );
}
