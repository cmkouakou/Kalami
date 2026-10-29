/**
 * =============================================================
 *  Fichier    : profile-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Questionnaire du profil de l'organisation étudiée (cahier des charges §3.2) :
 *               périmètre (entreprise entière ou division / département), identité,
 *               localisation, organigramme simplifié, offre, clients et concurrents. Les
 *               listes se saisissent une entrée par ligne ; les équipes, ligne par ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-13
 *  Dépendances: components/admin/action-form.tsx, lib/strategy/actions.ts
 * =============================================================
 */

"use client";

import { useState, type ReactNode } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea } from "@/components/ui/form";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { saveProfile } from "@/lib/strategy/actions";
import type { ProfileData, Scope } from "@/lib/strategy/profile";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const p = tStrategy.profile;
const f = p.fields;

type ProfileFormProps = {
  studyId: string;
  companyName: string;
  strategicQuestion: string;
  data: ProfileData;
};

type TeamRow = { key: number; role: string; headcount: string };

// ==================== SOUS-COMPOSANTS ====================

/** Groupe de champs titré. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
      <legend className="px-1 font-serif text-h3 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Zone « une entrée par ligne » pré-remplie avec une liste. */
function ListField({
  name,
  label,
  values,
}: {
  name: keyof ProfileData;
  label: string;
  values: string[];
}) {
  return (
    <TextArea
      name={name}
      label={label}
      hint={p.onePerLine}
      rows={4}
      defaultValue={values.join("\n")}
    />
  );
}

// ==================== COMPOSANT ====================

/** Formulaire complet du profil, enregistré par l'action saveProfile. */
export function ProfileForm({ studyId, companyName, strategicQuestion, data }: ProfileFormProps) {
  const [teams, setTeams] = useState<TeamRow[]>(() =>
    (data.teams.length > 0 ? data.teams : [{ role: "", headcount: null }]).map((team, i) => ({
      key: i,
      role: team.role,
      headcount: team.headcount === null ? "" : String(team.headcount),
    })),
  );
  const [nextKey, setNextKey] = useState(teams.length);
  const [scope, setScope] = useState<Scope>(data.scope);

  /** Ajoute une ligne d'équipe vide. */
  function addTeam() {
    setTeams((rows) => [...rows, { key: nextKey, role: "", headcount: "" }]);
    setNextKey((key) => key + 1);
  }

  /** Retire une ligne d'équipe. */
  function removeTeam(key: number) {
    setTeams((rows) => rows.filter((row) => row.key !== key));
  }

  return (
    <ActionForm action={saveProfile.bind(null, studyId)} submitLabel={p.save}>
      {/* ==================== QUESTION ==================== */}
      <Section title={p.sections.question}>
        <TextArea
          name="strategicQuestion"
          label={`${f.strategicQuestion} *`}
          hint={tStrategy.create.questionHint}
          rows={3}
          maxLength={1000}
          defaultValue={strategicQuestion}
        />
      </Section>

      {/* ==================== IDENTITÉ ==================== */}
      <Section title={p.sections.identity}>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-label">{f.scope}</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {(["company", "unit"] as const).map((value) => (
              <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  value={value}
                  checked={scope === value}
                  onChange={() => setScope(value)}
                  className="size-5"
                />
                {p.scopes[value]}
              </label>
            ))}
          </div>
          <p className="text-small text-ink-muted">{p.scopeHint}</p>
        </fieldset>
        <Field
          name="companyName"
          label={`${f.companyName} *`}
          required
          maxLength={200}
          defaultValue={companyName}
        />
        {scope === "unit" && (
          <Field
            name="parentCompany"
            label={f.parentCompany}
            maxLength={200}
            defaultValue={data.parentCompany}
          />
        )}
        <Field name="sector" label={`${f.sector} *`} maxLength={120} defaultValue={data.sector} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="employees"
            label={f.employees}
            inputMode="numeric"
            defaultValue={data.employees ?? ""}
          />
          <Field
            name="foundedYear"
            label={f.foundedYear}
            inputMode="numeric"
            maxLength={4}
            defaultValue={data.foundedYear ?? ""}
          />
        </div>
        <Field
          name="revenueRange"
          label={f.revenueRange}
          maxLength={120}
          defaultValue={data.revenueRange}
        />
      </Section>

      {/* ==================== LOCALISATION ==================== */}
      <Section title={p.sections.places}>
        <ListField name="countries" label={`${f.countries} *`} values={data.countries} />
        <ListField name="cities" label={f.cities} values={data.cities} />
        <ListField name="markets" label={f.markets} values={data.markets} />
      </Section>

      {/* ==================== ORGANISATION ==================== */}
      <Section title={p.sections.organization}>
        <p className="text-label">{f.teams}</p>
        <ul className="flex flex-col gap-3">
          {teams.map((team, i) => (
            <li key={team.key} className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 text-small">
                {p.teamRole}
                <input
                  name="team_role"
                  maxLength={120}
                  defaultValue={team.role}
                  className={CONTROL}
                />
              </label>
              <label className="flex w-28 flex-col gap-1 text-small">
                {p.teamHeadcount}
                <input
                  name="team_headcount"
                  inputMode="numeric"
                  defaultValue={team.headcount}
                  className={CONTROL}
                />
              </label>
              <button
                type="button"
                className={BUTTON_ICON}
                aria-label={`${p.removeTeam} (${i + 1})`}
                onClick={() => removeTeam(team.key)}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className={`${BUTTON_TERTIARY} self-start`} onClick={addTeam}>
          <IconPlus />
          {p.addTeam}
        </button>
      </Section>

      {/* ==================== OFFRE ==================== */}
      <Section title={p.sections.offer}>
        <ListField name="offers" label={`${f.offers} *`} values={data.offers} />
        <ListField name="clients" label={f.clients} values={data.clients} />
        <ListField name="competitors" label={f.competitors} values={data.competitors} />
      </Section>
    </ActionForm>
  );
}
