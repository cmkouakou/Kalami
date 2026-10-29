/**
 * =============================================================
 *  Fichier    : pestel-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 1 : facteurs PESTEL, grille impact-incertitude et
 *               matrice des scénarios, enregistrés automatiquement, dans le cadre commun
 *               (liste de contrôle, actions, versions).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: pestel/*.tsx, template-frame.tsx, use-autosave.ts
 * =============================================================
 */

"use client";

import { FactorList } from "@/components/strategy/pestel/factor-list";
import { ImpactGrid } from "@/components/strategy/pestel/impact-grid";
import { ScenarioMatrix } from "@/components/strategy/pestel/scenario-matrix";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import {
  FACTORS_MAX,
  newFactor,
  pestelChecklist,
  pivotCandidates,
  type PestelPayload,
} from "@/lib/strategy/templates/pestel";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const p = tStrategy.pestel;

type PestelEditorProps = TemplateFrameProps & {
  initial: PestelPayload;
  revision: number;
};

/** Gabarit PESTEL complet. */
export function PestelEditor({ initial, revision, ...frame }: PestelEditorProps) {
  const editor = frame.role === "owner" || frame.role === "contributor";
  const readOnly = !editor || frame.status === "validated";
  const autosave = useAutosave(initial, {
    studyId: frame.studyId,
    stepNo: frame.stepNo,
    revision,
    enabled: !readOnly,
  });
  const { value, update } = autosave;

  // Les facteurs déjà choisis comme axes restent proposés même s'ils ont changé de case
  const chosen = new Set(value.scenarios.axes.map((axis) => axis.factorId));
  const candidates = pivotCandidates(value);
  const extra = value.factors.filter(
    (factor) => chosen.has(factor.id) && !candidates.includes(factor),
  );

  return (
    <TemplateFrame
      {...frame}
      autosave={autosave}
      checklist={pestelChecklist(value).map((item) => ({
        label: p.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <FactorList
        factors={value.factors}
        readOnly={readOnly}
        onAdd={(dimension) =>
          update((prev) =>
            prev.factors.length >= FACTORS_MAX
              ? prev
              : {
                  ...prev,
                  factors: [...prev.factors, newFactor(crypto.randomUUID(), dimension)],
                },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            factors: prev.factors.map((factor) =>
              factor.id === id ? { ...factor, ...patch } : factor,
            ),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({
            factors: prev.factors.filter((factor) => factor.id !== id),
            scenarios: {
              ...prev.scenarios,
              axes: [
                prev.scenarios.axes[0].factorId === id
                  ? { ...prev.scenarios.axes[0], factorId: null }
                  : prev.scenarios.axes[0],
                prev.scenarios.axes[1].factorId === id
                  ? { ...prev.scenarios.axes[1], factorId: null }
                  : prev.scenarios.axes[1],
              ],
            },
          }))
        }
      />

      <ImpactGrid
        factors={value.factors}
        readOnly={readOnly}
        onPlace={(id, quadrant) =>
          update((prev) => ({
            ...prev,
            factors: prev.factors.map((factor) =>
              factor.id === id ? { ...factor, quadrant } : factor,
            ),
          }))
        }
      />

      <ScenarioMatrix
        scenarios={value.scenarios}
        candidates={[...candidates, ...extra]}
        readOnly={readOnly}
        onAxis={(index, patch) =>
          update((prev) => {
            const axes: PestelPayload["scenarios"]["axes"] = [...prev.scenarios.axes];
            axes[index] = { ...axes[index], ...patch };
            return { ...prev, scenarios: { ...prev.scenarios, axes } };
          })
        }
        onCell={(cell, patch) =>
          update((prev) => ({
            ...prev,
            scenarios: {
              ...prev.scenarios,
              cells: {
                ...prev.scenarios.cells,
                [cell]: { ...prev.scenarios.cells[cell], ...patch },
              },
            },
          }))
        }
      />
    </TemplateFrame>
  );
}
