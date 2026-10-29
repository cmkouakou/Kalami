/**
 * =============================================================
 *  Fichier    : factor-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Saisie des facteurs PESTEL regroupés par dimension : facteur, effet sur
 *               l'entreprise, opportunité ou menace, source facultative. v0.14.4 : facteur
 *               et effet en zones de texte qui s'agrandissent avec leur contenu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-24
 *  Dépendances: lib/strategy/templates/pestel.ts
 * =============================================================
 */

"use client";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  FACTORS_MAX,
  NATURES,
  PESTEL_DIMENSIONS,
  type Nature,
  type PestelDimension,
  type PestelFactor,
} from "@/lib/strategy/templates/pestel";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const p = tStrategy.pestel;

/** Zone de texte qui s'agrandit avec son contenu (les tendances longues restent lisibles). */
const GROWING = `${CONTROL} resize-y py-2 [field-sizing:content]`;

type FactorListProps = {
  factors: PestelFactor[];
  readOnly: boolean;
  onAdd: (dimension: PestelDimension) => void;
  onChange: (id: string, patch: Partial<PestelFactor>) => void;
  onRemove: (id: string) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Fiche d'un facteur. */
function FactorCard({
  factor,
  readOnly,
  onChange,
  onRemove,
}: {
  factor: PestelFactor;
  readOnly: boolean;
  onChange: FactorListProps["onChange"];
  onRemove: FactorListProps["onRemove"];
}) {
  const id = `facteur-${factor.id}`;
  return (
    <li className="flex flex-col gap-3 rounded-md border border-line p-3">
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
          {p.fields.factor}
          <textarea
            id={id}
            className={GROWING}
            rows={1}
            value={factor.factor}
            maxLength={300}
            readOnly={readOnly}
            onChange={(event) => onChange(factor.id, { factor: event.target.value })}
          />
        </label>
        <CommentBadge targetId={factor.id} label={factor.factor || p.untitled} />
        {!readOnly && (
          <button
            type="button"
            className={BUTTON_ICON}
            aria-label={`${tStrategy.template.remove} : ${factor.factor || p.untitled}`}
            onClick={() => onRemove(factor.id)}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1 text-small font-semibold">
        {p.fields.effect}
        <textarea
          className={GROWING}
          rows={2}
          value={factor.effect}
          maxLength={1000}
          readOnly={readOnly}
          onChange={(event) => onChange(factor.id, { effect: event.target.value })}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-small font-semibold">
          {p.fields.nature}
          <select
            className={CONTROL}
            value={factor.nature ?? ""}
            disabled={readOnly}
            onChange={(event) =>
              onChange(factor.id, { nature: (event.target.value || null) as Nature | null })
            }
          >
            <option value="">{p.natureNone}</option>
            {NATURES.map((nature) => (
              <option key={nature} value={nature}>
                {p.natures[nature]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {p.fields.source}
          <input
            className={CONTROL}
            value={factor.source}
            maxLength={500}
            readOnly={readOnly}
            onChange={(event) => onChange(factor.id, { source: event.target.value })}
          />
        </label>
      </div>
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Facteurs regroupés par dimension PESTEL. */
export function FactorList({ factors, readOnly, onAdd, onChange, onRemove }: FactorListProps) {
  const full = factors.length >= FACTORS_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{p.factorsTitle}</h2>
        <p className="text-small text-ink-muted">{p.factorsIntro}</p>
      </div>
      {PESTEL_DIMENSIONS.map((dimension) => {
        const inDimension = factors.filter((factor) => factor.dimension === dimension);
        return (
          <fieldset key={dimension} className={`${CARD} flex flex-col gap-3 p-4`}>
            <legend className="px-1 font-semibold">{p.dimensions[dimension]}</legend>
            {inDimension.length === 0 ? (
              <p className="text-small text-ink-muted">{p.noFactor}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {inDimension.map((factor) => (
                  <FactorCard
                    key={factor.id}
                    factor={factor}
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
                onClick={() => onAdd(dimension)}
              >
                <IconPlus size={18} />
                {p.addFactor}
              </button>
            )}
          </fieldset>
        );
      })}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(p.maxFactors, { max: String(FACTORS_MAX) })}
        </p>
      )}
    </section>
  );
}
