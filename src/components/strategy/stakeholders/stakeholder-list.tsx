/**
 * =============================================================
 *  Fichier    : stakeholder-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Fiches des parties prenantes de l'étape 4 : nom, attentes, pouvoir et
 *               intérêt de 1 à 5, engagement actuel et souhaité, approche et actions.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/templates/stakeholders.ts
 * =============================================================
 */

"use client";

import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ENGAGEMENTS,
  LEVEL_MAX,
  LEVEL_MIN,
  STAKEHOLDERS_MAX,
  type Engagement,
  type Stakeholder,
} from "@/lib/strategy/templates/stakeholders";

const t = getDictionary();
const s = t.strategy.stakeholders;

const LEVELS = Array.from({ length: LEVEL_MAX - LEVEL_MIN + 1 }, (_, i) => LEVEL_MIN + i);

type StakeholderListProps = {
  stakeholders: Stakeholder[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Stakeholder>) => void;
  onRemove: (id: string) => void;
};

type LevelField = "power" | "interest";
type EngagementField = "engagementCurrent" | "engagementDesired";
type TextField = "expectations" | "approach" | "actions";

// ==================== SOUS-COMPOSANTS ====================

/** Fiche d'une partie prenante. */
function StakeholderCard({
  stakeholder,
  readOnly,
  onChange,
  onRemove,
}: {
  stakeholder: Stakeholder;
  readOnly: boolean;
  onChange: StakeholderListProps["onChange"];
  onRemove: StakeholderListProps["onRemove"];
}) {
  const id = `partie-${stakeholder.id}`;

  /** Liste de 1 à 5 pour le pouvoir ou l'intérêt. */
  const level = (field: LevelField) => (
    <label className="flex flex-col gap-1 text-small font-semibold">
      {s.fields[field]}
      <select
        className={CONTROL}
        value={stakeholder[field] ?? ""}
        disabled={readOnly}
        onChange={(event) =>
          onChange(stakeholder.id, {
            [field]: event.target.value === "" ? null : Number(event.target.value),
          })
        }
      >
        <option value="">{s.levelNone}</option>
        {LEVELS.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );

  /** Liste des niveaux d'engagement (actuel ou souhaité). */
  const engagement = (field: EngagementField) => (
    <label className="flex flex-col gap-1 text-small font-semibold">
      {s.fields[field]}
      <select
        className={CONTROL}
        value={stakeholder[field] ?? ""}
        disabled={readOnly}
        onChange={(event) =>
          onChange(stakeholder.id, {
            [field]: (event.target.value || null) as Engagement | null,
          })
        }
      >
        <option value="">{s.engagementNone}</option>
        {ENGAGEMENTS.map((value) => (
          <option key={value} value={value}>
            {s.engagements[value]}
          </option>
        ))}
      </select>
    </label>
  );

  /** Zone de texte libre (attentes, approche, actions). */
  const text = (field: TextField) => (
    <label className="flex flex-col gap-1 text-small font-semibold">
      {s.fields[field]}
      <textarea
        className={`${CONTROL} py-2`}
        rows={2}
        value={stakeholder[field]}
        maxLength={1500}
        readOnly={readOnly}
        onChange={(event) => onChange(stakeholder.id, { [field]: event.target.value })}
      />
    </label>
  );

  return (
    <li className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
          {s.fields.name}
          <input
            id={id}
            className={CONTROL}
            value={stakeholder.name}
            maxLength={200}
            readOnly={readOnly}
            onChange={(event) => onChange(stakeholder.id, { name: event.target.value })}
          />
        </label>
        {!readOnly && (
          <button
            type="button"
            className={BUTTON_ICON}
            aria-label={`${t.strategy.template.remove} : ${stakeholder.name || s.untitled}`}
            onClick={() => onRemove(stakeholder.id)}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>
      {text("expectations")}
      <div className="grid gap-3 sm:grid-cols-2">
        {level("power")}
        {level("interest")}
        {engagement("engagementCurrent")}
        {engagement("engagementDesired")}
      </div>
      {text("approach")}
      {text("actions")}
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Liste des parties prenantes. */
export function StakeholderList({
  stakeholders,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: StakeholderListProps) {
  const full = stakeholders.length >= STAKEHOLDERS_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.listTitle}</h2>
        <p className="text-small text-ink-muted">{s.listIntro}</p>
      </div>
      {stakeholders.length === 0 ? (
        <p className="text-small text-ink-muted">{s.none}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {stakeholders.map((stakeholder) => (
            <StakeholderCard
              key={stakeholder.id}
              stakeholder={stakeholder}
              readOnly={readOnly}
              onChange={onChange}
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
          {s.add}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.max, { max: String(STAKEHOLDERS_MAX) })}
        </p>
      )}
    </section>
  );
}
