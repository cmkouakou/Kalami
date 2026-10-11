/**
 * =============================================================
 *  Fichier    : internal-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 3 : chaîne de valeur et analyse VRIO des ressources,
 *               enregistrées automatiquement, dans le cadre commun (liste de contrôle,
 *               actions, versions).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: internal/*.tsx, template-frame.tsx, use-autosave.ts
 * =============================================================
 */

"use client";

import { ValueChain } from "@/components/strategy/internal/value-chain";
import { VrioTable } from "@/components/strategy/internal/vrio-table";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import { getDictionary } from "@/i18n";
import {
  ACTIVITIES_MAX,
  internalChecklist,
  newActivity,
  newResource,
  RESOURCES_MAX,
  type InternalPayload,
} from "@/lib/strategy/templates/internal";

const t = getDictionary();
const n = t.strategy.internal;

type InternalEditorProps = TemplateFrameProps & {
  initial: InternalPayload;
  revision: number;
};

/** Gabarit de l'analyse interne complet. */
export function InternalEditor({ initial, revision, ...frame }: InternalEditorProps) {
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
      checklist={internalChecklist(value).map((item) => ({
        label: n.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <ValueChain
        activities={value.activities}
        readOnly={readOnly}
        onAdd={(kind) =>
          update((prev) =>
            prev.activities.length >= ACTIVITIES_MAX
              ? prev
              : {
                  ...prev,
                  activities: [...prev.activities, newActivity(crypto.randomUUID(), kind)],
                },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            activities: prev.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, activities: prev.activities.filter((a) => a.id !== id) }))
        }
      />

      <VrioTable
        resources={value.resources}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.resources.length >= RESOURCES_MAX
              ? prev
              : { ...prev, resources: [...prev.resources, newResource(crypto.randomUUID())] },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            resources: prev.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }))
        }
        onTest={(id, test, patch) =>
          update((prev) => ({
            ...prev,
            resources: prev.resources.map((r) =>
              r.id === id
                ? { ...r, tests: { ...r.tests, [test]: { ...r.tests[test], ...patch } } }
                : r,
            ),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, resources: prev.resources.filter((r) => r.id !== id) }))
        }
      />
    </TemplateFrame>
  );
}
