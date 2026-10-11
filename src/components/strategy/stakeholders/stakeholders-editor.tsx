/**
 * =============================================================
 *  Fichier    : stakeholders-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 4 : parties prenantes et matrice pouvoir-intérêt,
 *               enregistrées automatiquement, dans le cadre commun (liste de contrôle,
 *               actions, versions).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: stakeholders/*.tsx, template-frame.tsx, use-autosave.ts
 * =============================================================
 */

"use client";

import { PowerInterestGrid } from "@/components/strategy/stakeholders/power-interest-grid";
import { StakeholderList } from "@/components/strategy/stakeholders/stakeholder-list";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import { getDictionary } from "@/i18n";
import {
  autoQuadrant,
  newStakeholder,
  stakeholdersChecklist,
  STAKEHOLDERS_MAX,
  type Stakeholder,
  type StakeholdersPayload,
} from "@/lib/strategy/templates/stakeholders";

const t = getDictionary();
const s = t.strategy.stakeholders;

type StakeholdersEditorProps = TemplateFrameProps & {
  initial: StakeholdersPayload;
  revision: number;
};

/**
 * Applique une modification à une partie prenante du contenu.
 * @param prev   - Contenu actuel
 * @param id     - Partie prenante visée
 * @param change - Transformation de la partie prenante
 */
function withStakeholder(
  prev: StakeholdersPayload,
  id: string,
  change: (stakeholder: Stakeholder) => Stakeholder,
): StakeholdersPayload {
  return {
    stakeholders: prev.stakeholders.map((item) => (item.id === id ? change(item) : item)),
  };
}

/** Gabarit des parties prenantes complet. */
export function StakeholdersEditor({ initial, revision, ...frame }: StakeholdersEditorProps) {
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
      checklist={stakeholdersChecklist(value).map((item) => ({
        label: s.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <StakeholderList
        stakeholders={value.stakeholders}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.stakeholders.length >= STAKEHOLDERS_MAX
              ? prev
              : { stakeholders: [...prev.stakeholders, newStakeholder(crypto.randomUUID())] },
          )
        }
        onChange={(id, patch) =>
          update((prev) => withStakeholder(prev, id, (item) => ({ ...item, ...patch })))
        }
        onRemove={(id) =>
          update((prev) => ({ stakeholders: prev.stakeholders.filter((item) => item.id !== id) }))
        }
      />

      <PowerInterestGrid
        stakeholders={value.stakeholders}
        readOnly={readOnly}
        onPlace={(id, quadrant) =>
          update((prev) =>
            withStakeholder(prev, id, (item) => ({
              ...item,
              // Choisir la case calculée revient au placement automatique
              quadrantOverride: quadrant === autoQuadrant(item) ? null : quadrant,
            })),
          )
        }
      />
    </TemplateFrame>
  );
}
