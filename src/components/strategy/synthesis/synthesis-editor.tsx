/**
 * =============================================================
 *  Fichier    : synthesis-editor.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 5 : matrice SWOT (avec reprise des étapes 1 à 4 par cases
 *               à cocher), matrice TOWS et deux ou trois enjeux, enregistrés
 *               automatiquement dans le cadre commun (liste de contrôle, actions, versions,
 *               coach). Supprimer un élément retire aussi les liens qui le visaient.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: synthesis/*.tsx, template-frame.tsx, use-autosave.ts,
 *               lib/strategy/synthesis-sources.ts
 * =============================================================
 */

"use client";

import { IssuesList } from "@/components/strategy/synthesis/issues-list";
import { SwotBoard } from "@/components/strategy/synthesis/swot-board";
import { SwotImport } from "@/components/strategy/synthesis/swot-import";
import { TowsBoard } from "@/components/strategy/synthesis/tows-board";
import { TemplateFrame, type TemplateFrameProps } from "@/components/strategy/template-frame";
import { useAutosave } from "@/components/strategy/use-autosave";
import { getDictionary } from "@/i18n";
import {
  importCandidates,
  swotCandidates,
  type SynthesisSources,
} from "@/lib/strategy/synthesis-sources";
import {
  ISSUES_MAX,
  newIssue,
  newSwotItem,
  newTowsItem,
  removeItem,
  SWOT_ITEMS_MAX,
  synthesisChecklist,
  TOWS_MAX,
  type SwotKey,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

const t = getDictionary();
const s = t.strategy.synthesis;

type SynthesisEditorProps = TemplateFrameProps & {
  initial: SynthesisPayload;
  revision: number;
  /** Contenu relu des étapes 1 à 3, source de la reprise. */
  sources: SynthesisSources;
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

/** Ajoute un élément vide à une case de la SWOT (dans la limite de la case). */
function addSwotItem(prev: SynthesisPayload, key: SwotKey): SynthesisPayload {
  if (prev.swot[key].length >= SWOT_ITEMS_MAX) return prev;
  const item = newSwotItem(crypto.randomUUID());
  return { ...prev, swot: { ...prev.swot, [key]: [...prev.swot[key], item] } };
}

/** Gabarit de synthèse complet. */
export function SynthesisEditor({ initial, revision, sources, ...frame }: SynthesisEditorProps) {
  const editor = frame.role === "owner" || frame.role === "contributor";
  const readOnly = !editor || frame.status === "validated";
  const autosave = useAutosave(initial, {
    studyId: frame.studyId,
    stepNo: frame.stepNo,
    revision,
    enabled: !readOnly,
  });
  const { value, update } = autosave;
  const candidates = swotCandidates(sources, t.strategy.forces.names, value);

  return (
    <TemplateFrame
      {...frame}
      autosave={autosave}
      checklist={synthesisChecklist(value).map((item) => ({
        label: s.checklist[item.key],
        ok: item.ok,
      }))}
    >
      <SwotBoard
        swot={value.swot}
        readOnly={readOnly}
        importer={
          <SwotImport
            candidates={candidates}
            readOnly={readOnly}
            onImport={(chosen) =>
              update((prev) => importCandidates(prev, chosen, () => crypto.randomUUID()))
            }
          />
        }
        onAdd={(key) => update((prev) => addSwotItem(prev, key))}
        onChange={(key, id, text) =>
          update((prev) => ({
            ...prev,
            swot: { ...prev.swot, [key]: patchById(prev.swot[key], id, (i) => ({ ...i, text })) },
          }))
        }
        onRemove={(id) => update((prev) => removeItem(prev, id))}
      />

      <TowsBoard
        swot={value.swot}
        tows={value.tows}
        readOnly={readOnly}
        onAdd={(quadrant) =>
          update((prev) =>
            prev.tows.length >= TOWS_MAX
              ? prev
              : { ...prev, tows: [...prev.tows, newTowsItem(crypto.randomUUID(), quadrant)] },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            tows: patchById(prev.tows, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) => update((prev) => removeItem(prev, id))}
      />

      <IssuesList
        payload={value}
        readOnly={readOnly}
        onAdd={() =>
          update((prev) =>
            prev.issues.length >= ISSUES_MAX
              ? prev
              : { ...prev, issues: [...prev.issues, newIssue(crypto.randomUUID())] },
          )
        }
        onChange={(id, patch) =>
          update((prev) => ({
            ...prev,
            issues: patchById(prev.issues, id, (item) => ({ ...item, ...patch })),
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, issues: prev.issues.filter((item) => item.id !== id) }))
        }
      />
    </TemplateFrame>
  );
}
