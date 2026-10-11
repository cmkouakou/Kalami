/**
 * =============================================================
 *  Fichier    : internal-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 3 : choix du modèle de chaîne de valeur (Porter ou
 *               services), chaîne de valeur et analyse VRIO des ressources, enregistrées
 *               automatiquement, dans le cadre commun (liste de contrôle, actions, versions).
 *               Changer de modèle remplace les activités après confirmation dans la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 *  Dépendances: internal/*.tsx, template-frame.tsx, use-autosave.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { ValueChain } from "@/components/strategy/internal/value-chain";
import { VrioTable } from "@/components/strategy/internal/vrio-table";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ACTIVITIES_MAX,
  internalChecklist,
  newActivity,
  newResource,
  RESOURCES_MAX,
  untouchedActivities,
  VALUE_CHAIN_MODELS,
  withModel,
  type InternalPayload,
  type ValueChainModel,
} from "@/lib/strategy/templates/internal";

const t = getDictionary();
const n = t.strategy.internal;

/** Libellés des activités de départ de chaque modèle. */
const MODEL_LABELS: Record<ValueChainModel, Record<string, string>> = {
  porter: n.porter,
  services: n.services,
};

// ==================== SOUS-COMPOSANTS ====================

/** Choix du modèle au début de l'étape : deux options décrites, avec le cas mixte. */
function ModelChooser({ onChoose }: { onChoose: (model: ValueChainModel) => void }) {
  return (
    <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{n.modelTitle}</h2>
        <p className="text-small text-ink-muted">{n.modelIntro}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {VALUE_CHAIN_MODELS.map((model) => (
          <li key={model} className="flex flex-col gap-3 rounded-md border border-line p-4">
            <h3 className="font-semibold">{n.models[model]}</h3>
            <p className="flex-1 text-small text-ink-muted">{n.modelHints[model]}</p>
            <button
              type="button"
              className={`${BUTTON_PRIMARY} w-fit`}
              onClick={() => onChoose(model)}
            >
              {n.modelChoose}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-small text-ink-muted">{n.modelMixed}</p>
    </section>
  );
}

/**
 * Modèle actuel et changement de modèle ; si des activités ont été évaluées ou décrites,
 * une confirmation dans la page précède le remplacement.
 */
function ModelSwitch({
  payload,
  readOnly,
  onChoose,
}: {
  payload: InternalPayload;
  readOnly: boolean;
  onChoose: (model: ValueChainModel) => void;
}) {
  const [pending, setPending] = useState(false);
  const current = payload.model ?? "porter";
  const other = VALUE_CHAIN_MODELS.find((model) => model !== current) ?? "porter";
  const otherLabel = n.models[other];

  /** Change tout de suite si rien n'est perdu, sinon demande confirmation. */
  function requestChange() {
    if (untouchedActivities(payload)) onChoose(other);
    else setPending(true);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-semibold">{interpolate(n.modelCurrent, { model: n.models[current] })}</p>
        {!readOnly && !pending && (
          <button type="button" className={BUTTON_TERTIARY} onClick={requestChange}>
            {interpolate(n.modelSwitchTo, { model: otherLabel })}
          </button>
        )}
      </div>
      {pending && (
        <div role="alert" className={`${CARD} flex flex-col gap-3 p-4`}>
          <p className="text-small">{interpolate(n.modelConfirm, { model: otherLabel })}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON_PRIMARY}
              onClick={() => {
                setPending(false);
                onChoose(other);
              }}
            >
              {n.modelConfirmYes}
            </button>
            <button type="button" className={BUTTON_SECONDARY} onClick={() => setPending(false)}>
              {n.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMPOSANT ====================

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

  /** Applique le modèle choisi : activités de départ du modèle, ressources gardées. */
  function chooseModel(model: ValueChainModel) {
    update((prev) => withModel(prev, model, MODEL_LABELS[model]));
  }

  return (
    <TemplateFrame
      {...frame}
      autosave={autosave}
      checklist={internalChecklist(value).map((item) => ({
        label: n.checklist[item.key],
        ok: item.ok,
      }))}
    >
      {value.model === null ? (
        readOnly ? (
          <p className="text-small text-ink-muted">{n.modelIntro}</p>
        ) : (
          <ModelChooser onChoose={chooseModel} />
        )
      ) : (
        <ModelSwitch payload={value} readOnly={readOnly} onChoose={chooseModel} />
      )}

      {value.model !== null && (
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
            update((prev) => ({
              ...prev,
              activities: prev.activities.filter((a) => a.id !== id),
            }))
          }
        />
      )}

      <VrioTable
        resources={value.resources}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.resources.length >= RESOURCES_MAX
              ? prev
              : {
                  ...prev,
                  resources: [...prev.resources, newResource(crypto.randomUUID())],
                },
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
                ? {
                    ...r,
                    tests: {
                      ...r.tests,
                      [test]: { ...r.tests[test], ...patch },
                    },
                  }
                : r,
            ),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({
            ...prev,
            resources: prev.resources.filter((r) => r.id !== id),
          }))
        }
      />
    </TemplateFrame>
  );
}
