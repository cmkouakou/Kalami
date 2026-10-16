/**
 * =============================================================
 *  Fichier    : scorecard.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Tableau de bord équilibré de l'étape 8 : quatre perspectives, chacune avec
 *               ses indicateurs (nom, définition, cible, fréquence, responsable, type
 *               résultat ou avancé, objectifs de l'étape 6 suivis).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/action.ts
 * =============================================================
 */

"use client";

import { LinkPicker, type LinkOption } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconCheck, IconPlus, IconTrash } from "@/components/ui/icons";
import { BADGE, BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  DEFINITION_MAX,
  FIELD_MAX,
  FREQUENCIES,
  INDICATOR_KINDS,
  INDICATORS_MAX,
  LINKS_MAX,
  OWNER_MAX,
  PERSPECTIVES,
  perspectiveCovered,
  type ActionPayload,
  type Indicator,
  type Perspective,
} from "@/lib/strategy/templates/action";

const t = getDictionary();
const s = t.strategy.action;

type IndicatorPatch = Partial<Omit<Indicator, "id" | "perspective">>;

type ScorecardProps = {
  payload: ActionPayload;
  /** Objectifs rédigés à l'étape 6. */
  objectives: LinkOption[];
  readOnly: boolean;
  onAdd: (perspective: Perspective) => void;
  onChange: (id: string, patch: IndicatorPatch) => void;
  onRemove: (id: string) => void;
};

/**
 * Convertit la valeur d'un menu en valeur enregistrée (vide → null).
 * @param value   - Valeur choisie dans le menu
 * @param allowed - Valeurs admises
 */
function pick<T extends string>(value: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

// ==================== INDICATEUR ====================

type IndicatorItemProps = {
  indicator: Indicator;
  objectives: LinkOption[];
  readOnly: boolean;
  onChange: (patch: IndicatorPatch) => void;
  onRemove: () => void;
};

/** Fiche d'un indicateur. */
function IndicatorItem({ indicator, objectives, readOnly, onChange, onRemove }: IndicatorItemProps) {
  const id = `indicateur-${indicator.id}`;

  return (
    <li className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
          {s.indicatorName}
          <input
            id={id}
            className={CONTROL}
            value={indicator.name}
            maxLength={FIELD_MAX}
            readOnly={readOnly}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </label>
        <CommentBadge
          targetId={indicator.id}
          label={indicator.name.trim() || s.untitledIndicator}
        />
        {!readOnly && (
          <button
            type="button"
            className={BUTTON_ICON}
            aria-label={
              `${t.strategy.template.remove} : ${indicator.name.trim() || s.untitledIndicator}`
            }
            onClick={onRemove}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1 text-small font-semibold">
        {s.definition}
        <textarea
          className={`${CONTROL} py-2`}
          rows={2}
          value={indicator.definition}
          maxLength={DEFINITION_MAX}
          readOnly={readOnly}
          onChange={(event) => onChange({ definition: event.target.value })}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-small font-semibold">
          {s.target}
          <input
            className={CONTROL}
            value={indicator.target}
            maxLength={FIELD_MAX}
            readOnly={readOnly}
            onChange={(event) => onChange({ target: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {s.frequency}
          <select
            className={CONTROL}
            value={indicator.frequency ?? ""}
            disabled={readOnly}
            onChange={(event) => onChange({ frequency: pick(event.target.value, FREQUENCIES) })}
          >
            <option value="">{s.frequencyNone}</option>
            {FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {s.frequencies[frequency]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {s.owner}
          <input
            className={CONTROL}
            value={indicator.owner}
            maxLength={OWNER_MAX}
            readOnly={readOnly}
            onChange={(event) => onChange({ owner: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {s.kind}
          <select
            className={CONTROL}
            value={indicator.kind ?? ""}
            disabled={readOnly}
            onChange={(event) => onChange({ kind: pick(event.target.value, INDICATOR_KINDS) })}
          >
            <option value="">{s.kindNone}</option>
            {INDICATOR_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {s.kinds[kind]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <LinkPicker
        name={id}
        title={s.indicatorObjectives}
        groups={[{ title: s.objectivesGroup, options: objectives }]}
        selected={indicator.objectiveLinks}
        readOnly={readOnly}
        max={LINKS_MAX}
        emptyText={s.noObjectives}
        onChange={(objectiveLinks) => onChange({ objectiveLinks })}
      />
    </li>
  );
}

// ==================== TABLEAU DE BORD ====================

/** Tableau de bord équilibré, perspective par perspective. */
export function Scorecard({
  payload,
  objectives,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: ScorecardProps) {
  const full = payload.indicators.length >= INDICATORS_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.scorecardTitle}</h2>
        <p className="text-small text-ink-muted">{s.scorecardIntro}</p>
      </div>
      {PERSPECTIVES.map((perspective) => {
        const indicators = payload.indicators.filter((item) => item.perspective === perspective);
        return (
          <section
            key={perspective}
            className="flex flex-col gap-3"
            aria-labelledby={`perspective-${perspective}`}
          >
            <div className="flex flex-col gap-1">
              <h3
                id={`perspective-${perspective}`}
                className="flex flex-wrap items-center gap-2 font-serif text-h3 font-semibold"
              >
                {s.perspectives[perspective]}
                {perspectiveCovered(payload, perspective) && (
                  <span className={`${BADGE} text-success`}>
                    <IconCheck size={14} />
                    <span className="sr-only">{s.perspectiveCovered}</span>
                  </span>
                )}
              </h3>
              <p className="text-small text-ink-muted">{s.perspectiveHints[perspective]}</p>
            </div>
            {indicators.length === 0 ? (
              <p className="text-small text-ink-muted">{s.emptyIndicators}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {indicators.map((indicator) => (
                  <IndicatorItem
                    key={indicator.id}
                    indicator={indicator}
                    objectives={objectives}
                    readOnly={readOnly}
                    onChange={(patch) => onChange(indicator.id, patch)}
                    onRemove={() => onRemove(indicator.id)}
                  />
                ))}
              </ul>
            )}
            {!readOnly && (
              <button
                type="button"
                className={`${BUTTON_TERTIARY} w-fit`}
                disabled={full}
                onClick={() => onAdd(perspective)}
              >
                <IconPlus size={18} />
                {s.addIndicator}
              </button>
            )}
          </section>
        );
      })}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxIndicators, { max: String(INDICATORS_MAX) })}
        </p>
      )}
    </section>
  );
}
