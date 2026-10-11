/**
 * =============================================================
 *  Fichier    : vrio-table.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Ressources de l'étape 3 et analyse VRIO : pour chaque ressource, les quatre
 *               questions (valeur, rareté, imitation, organisation) avec réponse et
 *               justification, puis le résultat de l'arbre de décision (« à confirmer » si
 *               une réponse est « partiel »).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/templates/internal.ts
 * =============================================================
 */

"use client";

import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ANSWERS,
  RESOURCES_MAX,
  VRIO_TESTS,
  vrioResult,
  type Answer,
  type Resource,
  type TestAnswer,
  type VrioTest,
} from "@/lib/strategy/templates/internal";

const t = getDictionary();
const n = t.strategy.internal;

type VrioTableProps = {
  resources: Resource[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Pick<Resource, "name" | "category">>) => void;
  onTest: (id: string, test: VrioTest, patch: Partial<TestAnswer>) => void;
  onRemove: (id: string) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Résultat de l'arbre de décision pour une ressource. */
function VrioOutcome({ resource }: { resource: Resource }) {
  const result = vrioResult(resource);
  return (
    <p className="rounded-md bg-sand px-3 py-2 text-small" aria-live="polite">
      <span className="font-semibold">{n.result} : </span>
      {result === null ? (
        <span className="text-ink-muted">{n.resultPending}</span>
      ) : (
        <>
          {n.outcomes[result.outcome]}
          {result.tentative && <span className="text-ink-muted"> ({n.tentative})</span>}
        </>
      )}
    </p>
  );
}

/** Fiche d'une ressource et de ses quatre questions. */
function ResourceCard({
  resource,
  readOnly,
  onChange,
  onTest,
  onRemove,
}: {
  resource: Resource;
  readOnly: boolean;
  onChange: VrioTableProps["onChange"];
  onTest: VrioTableProps["onTest"];
  onRemove: VrioTableProps["onRemove"];
}) {
  const id = `ressource-${resource.id}`;
  return (
    <li className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
          {n.resourceName}
          <input
            id={id}
            className={CONTROL}
            value={resource.name}
            maxLength={200}
            readOnly={readOnly}
            onChange={(event) => onChange(resource.id, { name: event.target.value })}
          />
        </label>
        {!readOnly && (
          <button
            type="button"
            className={BUTTON_ICON}
            aria-label={`${t.strategy.template.remove} : ${resource.name || n.untitledResource}`}
            onClick={() => onRemove(resource.id)}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1 text-small font-semibold">
        {n.category}
        <input
          className={CONTROL}
          value={resource.category}
          maxLength={100}
          readOnly={readOnly}
          onChange={(event) => onChange(resource.id, { category: event.target.value })}
        />
      </label>
      <ol className="flex flex-col gap-3">
        {VRIO_TESTS.map((test) => {
          const label = `${n.tests[test]} — ${resource.name || n.untitledResource}`;
          return (
            <li key={test} className="grid gap-2 sm:grid-cols-[12rem_1fr]">
              <label className="flex flex-col gap-1 text-small font-semibold">
                {n.tests[test]}
                <select
                  className={CONTROL}
                  aria-label={label}
                  value={resource.tests[test].answer ?? ""}
                  disabled={readOnly}
                  onChange={(event) =>
                    onTest(resource.id, test, {
                      answer: (event.target.value || null) as Answer | null,
                    })
                  }
                >
                  <option value="">{n.answerNone}</option>
                  {ANSWERS.map((answer) => (
                    <option key={answer} value={answer}>
                      {n.answers[answer]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-small font-semibold">
                {n.justification}
                <input
                  className={CONTROL}
                  value={resource.tests[test].justification}
                  maxLength={1000}
                  readOnly={readOnly}
                  onChange={(event) =>
                    onTest(resource.id, test, { justification: event.target.value })
                  }
                />
              </label>
            </li>
          );
        })}
      </ol>
      <VrioOutcome resource={resource} />
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Liste des ressources analysées avec VRIO. */
export function VrioTable({
  resources,
  readOnly,
  onAdd,
  onChange,
  onTest,
  onRemove,
}: VrioTableProps) {
  const full = resources.length >= RESOURCES_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{n.resourcesTitle}</h2>
        <p className="text-small text-ink-muted">{n.resourcesIntro}</p>
      </div>
      {resources.length === 0 ? (
        <p className="text-small text-ink-muted">{n.noResource}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              readOnly={readOnly}
              onChange={onChange}
              onTest={onTest}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
      {!readOnly && (
        <button
          type="button"
          className={`${BUTTON_TERTIARY} w-fit`}
          disabled={full}
          onClick={onAdd}
        >
          <IconPlus size={18} />
          {n.addResource}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(n.maxResources, { max: String(RESOURCES_MAX) })}
        </p>
      )}
    </section>
  );
}
