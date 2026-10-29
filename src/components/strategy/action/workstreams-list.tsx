/**
 * =============================================================
 *  Fichier    : workstreams-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Feuille de route de l'étape 8 : chantiers (nom, responsable, début et fin au
 *               mois), phases facultatives, liens vers les options retenues (étape 7) et les
 *               objectifs (étape 6). Dates inversées, phase hors du chantier ou chantier sans
 *               option liée sont signalés, sans bloquer.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/action.ts
 * =============================================================
 */

"use client";

import { LinkPicker, type LinkOption } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconAlert, IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  LINKS_MAX,
  NAME_MAX,
  newPhase,
  OWNER_MAX,
  PHASES_MAX,
  workstreamWarnings,
  WORKSTREAMS_MAX,
  type Phase,
  type Workstream,
} from "@/lib/strategy/templates/action";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.action;

type WorkstreamPatch = Partial<Omit<Workstream, "id">>;

type WorkstreamsListProps = {
  workstreams: Workstream[];
  /** Options retenues à l'étape 7. */
  options: LinkOption[];
  /** Objectifs rédigés à l'étape 6. */
  objectives: LinkOption[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: WorkstreamPatch) => void;
  onRemove: (id: string) => void;
};

// ==================== DÉBUT ET FIN ====================

type MonthFieldsProps = {
  id: string;
  start: string;
  end: string;
  readOnly: boolean;
  onChange: (patch: { start?: string; end?: string }) => void;
};

/** Champs « Début » et « Fin » au mois. */
function MonthFields({ id, start, end, readOnly, onChange }: MonthFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1 text-small font-semibold" htmlFor={`${id}-start`}>
        {s.start}
        <input
          id={`${id}-start`}
          type="month"
          className={CONTROL}
          value={start}
          readOnly={readOnly}
          onChange={(event) => onChange({ start: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-small font-semibold" htmlFor={`${id}-end`}>
        {s.end}
        <input
          id={`${id}-end`}
          type="month"
          className={CONTROL}
          value={end}
          readOnly={readOnly}
          onChange={(event) => onChange({ end: event.target.value })}
        />
      </label>
    </>
  );
}

// ==================== PHASES ====================

type PhasesProps = {
  workstream: Workstream;
  readOnly: boolean;
  onChange: (phases: Phase[]) => void;
};

/** Phases facultatives d'un chantier. */
function Phases({ workstream, readOnly, onChange }: PhasesProps) {
  const { phases } = workstream;
  const full = phases.length >= PHASES_MAX;

  /** Modifie une phase. */
  const patch = (id: string, change: Partial<Omit<Phase, "id">>) =>
    onChange(phases.map((phase) => (phase.id === id ? { ...phase, ...change } : phase)));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-small font-semibold">{s.phasesLegend}</legend>
      {phases.map((phase, index) => {
        const id = `phase-${phase.id}`;
        const label = interpolate(s.phaseLabel, { no: String(index + 1) });
        return (
          <div key={phase.id} className="grid items-end gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <label className="flex flex-col gap-1 text-small font-semibold" htmlFor={id}>
              {label}
              <input
                id={id}
                className={CONTROL}
                value={phase.name}
                maxLength={NAME_MAX}
                readOnly={readOnly}
                onChange={(event) => patch(phase.id, { name: event.target.value })}
              />
            </label>
            <MonthFields
              id={id}
              start={phase.start}
              end={phase.end}
              readOnly={readOnly}
              onChange={(change) => patch(phase.id, change)}
            />
            {!readOnly && (
              <button
                type="button"
                className={BUTTON_ICON}
                aria-label={`${tStrategy.template.remove} : ${phase.name.trim() || label}`}
                onClick={() => onChange(phases.filter((item) => item.id !== phase.id))}
              >
                <IconTrash size={18} />
              </button>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <button
          type="button"
          className={`${BUTTON_TERTIARY} w-fit`}
          disabled={full}
          onClick={() => onChange([...phases, newPhase(crypto.randomUUID())])}
        >
          <IconPlus size={18} />
          {s.addPhase}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxPhases, { max: String(PHASES_MAX) })}
        </p>
      )}
    </fieldset>
  );
}

// ==================== CHANTIER ====================

type WorkstreamItemProps = {
  workstream: Workstream;
  index: number;
  options: LinkOption[];
  objectives: LinkOption[];
  readOnly: boolean;
  onChange: (patch: WorkstreamPatch) => void;
  onRemove: () => void;
};

/** Fiche d'un chantier. */
function WorkstreamItem({
  workstream,
  index,
  options,
  objectives,
  readOnly,
  onChange,
  onRemove,
}: WorkstreamItemProps) {
  const id = `chantier-${workstream.id}`;
  const warnings = workstreamWarnings(workstream);

  return (
    <li className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
          {interpolate(s.workstreamLabel, { no: String(index + 1) })}
          <input
            id={id}
            className={CONTROL}
            value={workstream.name}
            maxLength={NAME_MAX}
            readOnly={readOnly}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </label>
        <CommentBadge
          targetId={workstream.id}
          label={workstream.name.trim() || s.untitledWorkstream}
        />
        {!readOnly && (
          <button
            type="button"
            className={BUTTON_ICON}
            aria-label={
              `${tStrategy.template.remove} : ${workstream.name.trim() || s.untitledWorkstream}`
            }
            onClick={onRemove}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-small font-semibold" htmlFor={`${id}-owner`}>
          {s.owner}
          <input
            id={`${id}-owner`}
            className={CONTROL}
            value={workstream.owner}
            maxLength={OWNER_MAX}
            readOnly={readOnly}
            onChange={(event) => onChange({ owner: event.target.value })}
          />
        </label>
        <MonthFields
          id={id}
          start={workstream.start}
          end={workstream.end}
          readOnly={readOnly}
          onChange={onChange}
        />
      </div>

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2 text-small text-warning">
              <IconAlert size={16} className="mt-0.5 shrink-0" />
              {s.warnings[warning]}
            </li>
          ))}
        </ul>
      )}

      <Phases
        workstream={workstream}
        readOnly={readOnly}
        onChange={(phases) => onChange({ phases })}
      />

      <LinkPicker
        name={`${id}-options`}
        title={s.optionLinks}
        groups={[{ title: s.optionsGroup, options }]}
        selected={workstream.optionLinks}
        readOnly={readOnly}
        max={LINKS_MAX}
        emptyText={s.noOptions}
        onChange={(optionLinks) => onChange({ optionLinks })}
      />
      <LinkPicker
        name={`${id}-objectifs`}
        title={s.objectiveLinks}
        groups={[{ title: s.objectivesGroup, options: objectives }]}
        selected={workstream.objectiveLinks}
        readOnly={readOnly}
        max={LINKS_MAX}
        emptyText={s.noObjectives}
        onChange={(objectiveLinks) => onChange({ objectiveLinks })}
      />
    </li>
  );
}

// ==================== LISTE ====================

/** Liste des chantiers de la feuille de route. */
export function WorkstreamsList({
  workstreams,
  options,
  objectives,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: WorkstreamsListProps) {
  const full = workstreams.length >= WORKSTREAMS_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.roadmapTitle}</h2>
        <p className="text-small text-ink-muted">{s.roadmapIntro}</p>
      </div>
      {workstreams.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyWorkstreams}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {workstreams.map((workstream, index) => (
            <WorkstreamItem
              key={workstream.id}
              workstream={workstream}
              index={index}
              options={options}
              objectives={objectives}
              readOnly={readOnly}
              onChange={(patch) => onChange(workstream.id, patch)}
              onRemove={() => onRemove(workstream.id)}
            />
          ))}
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
          {s.addWorkstream}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxWorkstreams, { max: String(WORKSTREAMS_MAX) })}
        </p>
      )}
    </section>
  );
}
