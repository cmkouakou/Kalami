/**
 * =============================================================
 *  Fichier    : forces-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 2 : cinq forces et tableau de comparaison avec les
 *               concurrents, enregistrés automatiquement, dans le cadre commun (liste de
 *               contrôle, actions, versions).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: forces/*.tsx, template-frame.tsx, use-autosave.ts
 * =============================================================
 */

"use client";

import { ComparisonTable } from "@/components/strategy/forces/comparison-table";
import { ForceList } from "@/components/strategy/forces/force-list";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import {
  ACTORS_MAX,
  CRITERIA_MAX,
  forcesChecklist,
  type ForcesPayload,
} from "@/lib/strategy/templates/forces";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const f = tStrategy.forces;

type ForcesEditorProps = TemplateFrameProps & {
  initial: ForcesPayload;
  revision: number;
};

type Comparison = ForcesPayload["comparison"];

/**
 * Remplace la partie « comparaison » du contenu.
 * @param prev   - Contenu actuel
 * @param change - Transformation de la comparaison
 */
function withComparison(
  prev: ForcesPayload,
  change: (comparison: Comparison) => Comparison,
): ForcesPayload {
  return { ...prev, comparison: change(prev.comparison) };
}

/** Gabarit des cinq forces complet. */
export function ForcesEditor({ initial, revision, ...frame }: ForcesEditorProps) {
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
      checklist={forcesChecklist(value).map((item) => ({
        label: f.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <ForceList
        forces={value.forces}
        readOnly={readOnly}
        onChange={(key, patch) =>
          update((prev) => ({
            ...prev,
            forces: { ...prev.forces, [key]: { ...prev.forces[key], ...patch } },
          }))
        }
      />

      <ComparisonTable
        payload={value}
        readOnly={readOnly}
        onAddActor={() =>
          update((prev) =>
            withComparison(prev, (c) =>
              c.actors.length >= ACTORS_MAX
                ? c
                : { ...c, actors: [...c.actors, { id: crypto.randomUUID(), name: "" }] },
            ),
          )
        }
        onRenameActor={(id, name) =>
          update((prev) =>
            withComparison(prev, (c) => ({
              ...c,
              actors: c.actors.map((actor) => (actor.id === id ? { ...actor, name } : actor)),
            })),
          )
        }
        onRemoveActor={(id) =>
          update((prev) =>
            withComparison(prev, (c) => ({
              actors: c.actors.filter((actor) => actor.id !== id),
              criteria: c.criteria.map((criterion) => {
                const scores = { ...criterion.scores };
                delete scores[id];
                return { ...criterion, scores };
              }),
            })),
          )
        }
        onAddCriterion={() =>
          update((prev) =>
            withComparison(prev, (c) =>
              c.criteria.length >= CRITERIA_MAX
                ? c
                : {
                    ...c,
                    criteria: [...c.criteria, { id: crypto.randomUUID(), name: "", scores: {} }],
                  },
            ),
          )
        }
        onRenameCriterion={(id, name) =>
          update((prev) =>
            withComparison(prev, (c) => ({
              ...c,
              criteria: c.criteria.map((criterion) =>
                criterion.id === id ? { ...criterion, name } : criterion,
              ),
            })),
          )
        }
        onRemoveCriterion={(id) =>
          update((prev) =>
            withComparison(prev, (c) => ({
              ...c,
              criteria: c.criteria.filter((criterion) => criterion.id !== id),
            })),
          )
        }
        onScore={(criterionId, actorId, patch) =>
          update((prev) =>
            withComparison(prev, (c) => ({
              ...c,
              criteria: c.criteria.map((criterion) => {
                if (criterion.id !== criterionId) return criterion;
                const cell = criterion.scores[actorId] ?? { score: null, note: "" };
                return {
                  ...criterion,
                  scores: { ...criterion.scores, [actorId]: { ...cell, ...patch } },
                };
              }),
            })),
          )
        }
      />
    </TemplateFrame>
  );
}
