/**
 * =============================================================
 *  Fichier    : choice-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 7, « Choix » : position de Porter, options placées dans
 *               la matrice d'Ansoff et évaluées, énoncé de la stratégie retenue et
 *               renoncements, enregistrés automatiquement dans le cadre commun (liste de
 *               contrôle, actions, versions, coach).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: choice/*.tsx, template-frame.tsx, use-autosave.ts,
 *               lib/strategy/templates/choice.ts
 * =============================================================
 */

"use client";

import { AnsoffMatrix } from "@/components/strategy/choice/ansoff-matrix";
import { GenericGrid } from "@/components/strategy/choice/generic-grid";
import { OptionsList } from "@/components/strategy/choice/options-list";
import { StatementBlock } from "@/components/strategy/choice/statement-block";
import type { LinkOption } from "@/components/strategy/synthesis/link-picker";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import {
  choiceChecklist,
  newOption,
  newRenunciation,
  OPTIONS_MAX,
  RENUNCIATIONS_MAX,
  type AnsoffCell,
  type ChoicePayload,
} from "@/lib/strategy/templates/choice";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.choice;

type ChoiceEditorProps = TemplateFrameProps & {
  initial: ChoicePayload;
  revision: number;
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

/** Ajoute une option vide, placée ou non dans une case d'Ansoff (dans la limite). */
function addOption(prev: ChoicePayload, cell: AnsoffCell | null): ChoicePayload {
  if (prev.options.length >= OPTIONS_MAX) return prev;
  return { ...prev, options: [...prev.options, newOption(crypto.randomUUID(), cell)] };
}

/** Gabarit « Choix » complet. */
export function ChoiceEditor({ initial, revision, issues, ...frame }: ChoiceEditorProps) {
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
      checklist={choiceChecklist(value).map((item) => ({
        label: s.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <GenericGrid
        generic={value.generic}
        readOnly={readOnly}
        onChange={(patch) =>
          update((prev) => ({ ...prev, generic: { ...prev.generic, ...patch } }))
        }
      />

      <AnsoffMatrix
        options={value.options}
        readOnly={readOnly}
        onAdd={(cell) => update((prev) => addOption(prev, cell))}
      />

      <OptionsList
        options={value.options}
        issues={issues}
        readOnly={readOnly}
        onAdd={() => update((prev) => addOption(prev, null))}
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            options: patchById(prev.options, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, options: prev.options.filter((item) => item.id !== id) }))
        }
      />

      <StatementBlock
        payload={value}
        readOnly={readOnly}
        onStatement={(text) =>
          update((prev) => ({ ...prev, statement: { ...prev.statement, text } }))
        }
        onAdd={() =>
          update((prev) =>
            prev.renunciations.length >= RENUNCIATIONS_MAX
              ? prev
              : {
                  ...prev,
                  renunciations: [...prev.renunciations, newRenunciation(crypto.randomUUID())],
                },
          )
        }
        onChange={(id, text) =>
          update((prev) => ({
            ...prev,
            renunciations: patchById(prev.renunciations, id, (item) => ({ ...item, text })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({
            ...prev,
            renunciations: prev.renunciations.filter((item) => item.id !== id),
          }))
        }
      />
    </TemplateFrame>
  );
}
