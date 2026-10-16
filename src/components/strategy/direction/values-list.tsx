/**
 * =============================================================
 *  Fichier    : values-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Valeurs de l'étape 6 : chaque valeur est nommée et accompagnée d'un geste
 *               concret qui la rend visible au quotidien.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/direction.ts
 * =============================================================
 */

"use client";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  GESTURE_MAX,
  VALUE_NAME_MAX,
  VALUES_MAX,
  type CoreValue,
} from "@/lib/strategy/templates/direction";

const t = getDictionary();
const s = t.strategy.direction;

type ValuesListProps = {
  values: CoreValue[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Omit<CoreValue, "id">>) => void;
  onRemove: (id: string) => void;
};

/** Liste des valeurs et de leurs gestes. */
export function ValuesList({ values, readOnly, onAdd, onChange, onRemove }: ValuesListProps) {
  const full = values.length >= VALUES_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.valuesTitle}</h2>
        <p className="text-small text-ink-muted">{s.valuesIntro}</p>
      </div>
      {values.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyValues}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {values.map((value) => (
            <li key={value.id} className={`${CARD} flex flex-col gap-3 p-4 sm:flex-row`}>
              <label className="flex flex-col gap-1 text-small font-semibold sm:w-1/3">
                {s.valueName}
                <input
                  className={CONTROL}
                  value={value.name}
                  maxLength={VALUE_NAME_MAX}
                  readOnly={readOnly}
                  onChange={(event) => onChange(value.id, { name: event.target.value })}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-small font-semibold">
                {s.valueGesture}
                <textarea
                  className={`${CONTROL} py-2`}
                  rows={2}
                  value={value.gesture}
                  maxLength={GESTURE_MAX}
                  readOnly={readOnly}
                  onChange={(event) => onChange(value.id, { gesture: event.target.value })}
                />
              </label>
              <CommentBadge targetId={value.id} label={value.name.trim() || s.untitledValue} />
              {!readOnly && (
                <button
                  type="button"
                  className={`${BUTTON_ICON} self-end`}
                  aria-label={
                    `${t.strategy.template.remove} : ${value.name.trim() || s.untitledValue}`
                  }
                  onClick={() => onRemove(value.id)}
                >
                  <IconTrash size={18} />
                </button>
              )}
            </li>
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
          {s.addValue}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxValues, { max: String(VALUES_MAX) })}
        </p>
      )}
    </section>
  );
}
