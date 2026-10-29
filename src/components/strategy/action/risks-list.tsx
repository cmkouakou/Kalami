/**
 * =============================================================
 *  Fichier    : risks-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Risques facultatifs de l'étape 8 : risque, signal d'alerte, réponse prévue
 *               et chantier exposé. Source de la section « Nos risques » du plan (S8).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/action.ts
 * =============================================================
 */

"use client";

import { shortLabel } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  RISK_TEXT_MAX,
  RISKS_MAX,
  type Risk,
  type Workstream,
} from "@/lib/strategy/templates/action";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.action;

type RiskPatch = Partial<Omit<Risk, "id">>;

type RisksListProps = {
  risks: Risk[];
  workstreams: Workstream[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: RiskPatch) => void;
  onRemove: (id: string) => void;
};

/** Champs texte d'un risque autres que l'énoncé. */
const DETAIL_FIELDS = ["signal", "response"] as const;

/** Liste des risques de mise en œuvre. */
export function RisksList({
  risks,
  workstreams,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: RisksListProps) {
  const full = risks.length >= RISKS_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.risksTitle}</h2>
        <p className="text-small text-ink-muted">{s.risksIntro}</p>
      </div>
      {risks.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyRisks}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {risks.map((risk, index) => {
            const id = `risque-${risk.id}`;
            // Un chantier supprimé depuis n'est plus proposé : le menu revient à « aucun »
            const linked = workstreams.some((item) => item.id === risk.workstream);
            return (
              <li key={risk.id} className={`${CARD} flex flex-col gap-3 p-4`}>
                <div className="flex items-end gap-2">
                  <label
                    className="flex flex-1 flex-col gap-1 text-small font-semibold"
                    htmlFor={id}
                  >
                    {interpolate(s.riskLabel, { no: String(index + 1) })}
                    <textarea
                      id={id}
                      className={`${CONTROL} py-2`}
                      rows={2}
                      value={risk.text}
                      maxLength={RISK_TEXT_MAX}
                      readOnly={readOnly}
                      onChange={(event) => onChange(risk.id, { text: event.target.value })}
                    />
                  </label>
                  <CommentBadge targetId={risk.id} label={risk.text.trim() || s.untitledRisk} />
                  {!readOnly && (
                    <button
                      type="button"
                      className={BUTTON_ICON}
                      aria-label={
                        `${tStrategy.template.remove} : ${risk.text.trim() || s.untitledRisk}`
                      }
                      onClick={() => onRemove(risk.id)}
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DETAIL_FIELDS.map((field) => (
                    <label key={field} className="flex flex-col gap-1 text-small font-semibold">
                      {s[field]}
                      <textarea
                        className={`${CONTROL} py-2`}
                        rows={2}
                        value={risk[field]}
                        maxLength={RISK_TEXT_MAX}
                        readOnly={readOnly}
                        onChange={(event) => onChange(risk.id, { [field]: event.target.value })}
                      />
                    </label>
                  ))}
                  <label className="flex flex-col gap-1 text-small font-semibold">
                    {s.riskWorkstream}
                    <select
                      className={CONTROL}
                      value={linked ? risk.workstream : ""}
                      disabled={readOnly}
                      onChange={(event) => onChange(risk.id, { workstream: event.target.value })}
                    >
                      <option value="">{s.riskWorkstreamNone}</option>
                      {workstreams.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name.trim() ? shortLabel(item.name) : s.untitledWorkstream}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {!readOnly && (
        <button
          type="button"
          className={`${BUTTON_TERTIARY} w-fit`}
          disabled={full}
          onClick={onAdd}
        >
          <IconPlus size={18} />
          {s.addRisk}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxRisks, { max: String(RISKS_MAX) })}
        </p>
      )}
    </section>
  );
}
