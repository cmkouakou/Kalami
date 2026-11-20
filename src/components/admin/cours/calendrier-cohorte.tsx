/**
 * =============================================================
 *  Fichier    : calendrier-cohorte.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Calendrier de diffusion d'une cohorte (v0.33.0) : activation, lecture
 *               en avance, fuseau, une date par module et, au besoin, par leçon. Le
 *               générateur remplit les dates à partir d'une date de départ et d'un rythme,
 *               sans enregistrer ; l'administrateur les ajuste puis enregistre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: components/admin/action-form.tsx, components/ui/form.tsx,
 *               lib/cours/admin-actions.ts, lib/cours/calendrier.ts, lib/cours/modules.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { BUTTON_SECONDARY, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { enregistrerCalendrier } from "@/lib/cours/admin-actions";
import {
  FUSEAUX,
  genererCalendrier,
  PREFIXE_DATE,
  type Fuseau,
  type Granularite,
} from "@/lib/cours/calendrier";
import { MODULES } from "@/lib/cours/modules";

const c = getCourseDictionary().admin.calendrier;

type Props = {
  cohorteId: string;
  active: boolean;
  lectureAvance: boolean;
  fuseau: Fuseau;
  /** Dates enregistrées (AAAA-MM-JJ) par module ou leçon. */
  jours: Record<string, string>;
};

// ==================== GÉNÉRATEUR ====================

/**
 * Générateur : date de départ, jours entre deux ouvertures, module ou leçon.
 * @param remplir - Reçoit les dates proposées
 * @param effacer - Vide toutes les dates
 */
function Generateur({
  remplir,
  effacer,
}: {
  remplir: (dates: Record<string, string>) => void;
  effacer: () => void;
}) {
  const [depart, setDepart] = useState("");
  const [intervalle, setIntervalle] = useState("7");
  const [par, setPar] = useState<Granularite>("module");

  /** Propose les dates ; rien ne change si la saisie est incomplète. */
  const generer = () => {
    const dates = genererCalendrier(depart, Number(intervalle), par);
    if (dates) remplir(dates);
  };

  return (
    <section className={`${CARD} flex flex-col gap-4 p-5`}>
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-semibold">{c.generateur}</h2>
        <p className="text-small text-ink-muted">{c.aideGenerateur}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="generateur-depart"
          label={c.depart}
          name="generateur_depart"
          type="date"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
        />
        <Field
          id="generateur-intervalle"
          label={c.intervalle}
          name="generateur_intervalle"
          type="number"
          min={1}
          max={60}
          value={intervalle}
          onChange={(e) => setIntervalle(e.target.value)}
        />
        <SelectField
          id="generateur-par"
          label={c.par}
          name="generateur_par"
          value={par}
          onChange={(e) => setPar(e.target.value === "lecon" ? "lecon" : "module")}
          options={[
            { value: "module", label: c.parModule },
            { value: "lecon", label: c.parLecon },
          ]}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={generer} className={BUTTON_SECONDARY}>
          {c.generer}
        </button>
        <button type="button" onClick={effacer} className={BUTTON_TERTIARY}>
          {c.effacer}
        </button>
      </div>
    </section>
  );
}

// ==================== CALENDRIER ====================

/** Réglages et dates de la cohorte, avec le générateur au-dessus. */
export function CalendrierCohorte({
  cohorteId,
  active,
  lectureAvance,
  fuseau,
  jours: initiaux,
}: Props) {
  const [jours, setJours] = useState<Record<string, string>>(initiaux);
  const fixees = Object.values(jours).filter(Boolean).length;

  /**
   * Change la date d'un module ou d'une leçon.
   * @param id   - « m05 » ou « m05-l02 »
   * @param jour - Date AAAA-MM-JJ (vide : sans date)
   */
  const changer = (id: string, jour: string) =>
    setJours((avant) => ({ ...avant, [id]: jour }));

  return (
    <>
      <Generateur remplir={setJours} effacer={() => setJours({})} />

      <ActionForm action={enregistrerCalendrier} submitLabel={c.enregistrer}>
        <input type="hidden" name="id" value={cohorteId} />
        <section className={`${CARD} flex flex-col gap-4 p-5`}>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={active}
              className="mt-1 size-5"
            />
            <span className="flex flex-col">
              <span className="font-semibold">{c.activer}</span>
              <span className="text-small text-ink-muted">{c.aideActiver}</span>
            </span>
          </label>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              name="read_ahead"
              defaultChecked={lectureAvance}
              className="mt-1 size-5"
            />
            <span className="flex flex-col">
              <span className="font-semibold">{c.lectureAvance}</span>
              <span className="text-small text-ink-muted">{c.aideLectureAvance}</span>
            </span>
          </label>
          <div className="sm:w-80">
            <SelectField
              id="calendrier-fuseau"
              label={c.fuseau}
              name="timezone"
              defaultValue={fuseau}
              options={FUSEAUX.map((f) => ({ value: f, label: c.fuseaux[f] }))}
            />
          </div>
          <p className="text-small text-ink-muted">
            {interpolate(c.etat, { n: String(fixees) })}
          </p>
        </section>

        <ol className="flex flex-col gap-3">
          {MODULES.map((m) => (
            <li key={m.id} className={`${CARD} flex flex-col gap-3 p-5`}>
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_14rem]">
                <h2 className="font-serif text-lg font-semibold">
                  {interpolate(c.module, { n: String(m.numero), titre: m.titre })}
                </h2>
                <Field
                  id={`date-${m.id}`}
                  label={interpolate(c.dateModule, { n: String(m.numero) })}
                  name={`${PREFIXE_DATE}${m.id}`}
                  type="date"
                  value={jours[m.id] ?? ""}
                  onChange={(e) => changer(m.id, e.target.value)}
                />
              </div>
              <details>
                <summary className="min-h-11 cursor-pointer py-2 text-encre underline">
                  {c.lecons}
                </summary>
                <ul className="flex flex-col gap-3 pt-2">
                  {m.lecons.map((l) => (
                    <li key={l.id}>
                      <Field
                        id={`date-${l.id}`}
                        label={interpolate(c.dateLecon, {
                          n: String(l.numero),
                          titre: l.titre,
                        })}
                        name={`${PREFIXE_DATE}${l.id}`}
                        type="date"
                        value={jours[l.id] ?? ""}
                        onChange={(e) => changer(l.id, e.target.value)}
                        hint={jours[l.id] ? undefined : c.heriteDe}
                      />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </ActionForm>
    </>
  );
}
