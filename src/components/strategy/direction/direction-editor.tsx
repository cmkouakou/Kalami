/**
 * =============================================================
 *  Fichier    : direction-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 6, « Cap » : vision et test du remplacement du nom,
 *               mission, valeurs avec geste et objectifs SMART liés aux enjeux de l'étape 5,
 *               enregistrés automatiquement dans le cadre commun (liste de contrôle, actions,
 *               versions, coach).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: direction/*.tsx, template-frame.tsx, use-autosave.ts,
 *               lib/strategy/templates/direction.ts
 * =============================================================
 */

"use client";

import { ObjectivesList } from "@/components/strategy/direction/objectives-list";
import { ValuesList } from "@/components/strategy/direction/values-list";
import { VisionBlock } from "@/components/strategy/direction/vision-block";
import type { LinkOption } from "@/components/strategy/synthesis/link-picker";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import { CONTROL } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import {
  directionChecklist,
  newObjective,
  newValue,
  OBJECTIVES_MAX,
  STATEMENT_MAX,
  VALUES_MAX,
  type DirectionPayload,
} from "@/lib/strategy/templates/direction";

const t = getDictionary();
const s = t.strategy.direction;

type DirectionEditorProps = TemplateFrameProps & {
  initial: DirectionPayload;
  revision: number;
  /** Nom de l'organisation, remplacé lors du test du nom. */
  companyName: string;
  /** Concurrents du profil, proposés pour le test du nom. */
  competitors: string[];
  /** Enjeux nommés à l'étape 5. */
  issues: LinkOption[];
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

/** Gabarit « Cap » complet. */
export function DirectionEditor({
  initial,
  revision,
  companyName,
  competitors,
  issues,
  ...frame
}: DirectionEditorProps) {
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
      checklist={directionChecklist(value).map((item) => ({
        label: s.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <VisionBlock
        payload={value}
        companyName={companyName}
        competitors={competitors}
        readOnly={readOnly}
        onVision={(text) => update((prev) => ({ ...prev, vision: { ...prev.vision, text } }))}
        onNameTest={(nameTest) => update((prev) => ({ ...prev, nameTest }))}
      />

      {/* ==================== MISSION ==================== */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-h2 font-semibold">{s.missionTitle}</h2>
          <p className="text-small text-ink-muted">{s.missionIntro}</p>
        </div>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {s.missionLabel}
          <textarea
            className={`${CONTROL} py-2`}
            rows={3}
            value={value.mission.text}
            maxLength={STATEMENT_MAX}
            readOnly={readOnly}
            onChange={(event) => {
              const text = event.target.value;
              update((prev) => ({ ...prev, mission: { ...prev.mission, text } }));
            }}
          />
        </label>
      </section>

      <ValuesList
        values={value.values}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.values.length >= VALUES_MAX
              ? prev
              : { ...prev, values: [...prev.values, newValue(crypto.randomUUID())] },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            values: patchById(prev.values, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, values: prev.values.filter((item) => item.id !== id) }))
        }
      />

      <ObjectivesList
        objectives={value.objectives}
        issues={issues}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.objectives.length >= OBJECTIVES_MAX
              ? prev
              : {
                  ...prev,
                  objectives: [...prev.objectives, newObjective(crypto.randomUUID())],
                },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            objectives: patchById(prev.objectives, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({
            ...prev,
            objectives: prev.objectives.filter((item) => item.id !== id),
          }))
        }
      />
    </TemplateFrame>
  );
}
