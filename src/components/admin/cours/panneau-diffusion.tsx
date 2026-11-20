/**
 * =============================================================
 *  Fichier    : panneau-diffusion.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Dates individuelles en lot (v0.42.0). Pour les inscrits sélectionnés dans
 *               la liste : modules et leçons à cocher, date d'ouverture et/ou de
 *               fermeture, fuseau ; « Appliquer » pose les dates (elles remplacent celles
 *               de la cohorte), « Retirer » les enlève (éléments cochés, ou toutes).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/admin-actions.ts, lib/cours/modules.ts, components/ui/form.tsx
 * =============================================================
 */

"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/ui/form";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  CONTROL,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { poserDiffusion, retirerDiffusion } from "@/lib/cours/admin-actions";
import { FUSEAUX } from "@/lib/cours/calendrier";
import { MODULES } from "@/lib/cours/modules";

const a = getCourseDictionary().admin;
const d = a.diffusionPerso;

// ==================== OUTILS ====================

/**
 * Ajoute ou retire un identifiant d'un ensemble (copie, pour l'état React).
 * @param ensemble - Ensemble actuel
 * @param id       - Identifiant à basculer
 * @param coche    - Vrai : ajouter ; faux : retirer
 */
function basculer(ensemble: Set<string>, id: string, coche: boolean): Set<string> {
  const copie = new Set(ensemble);
  if (coche) copie.add(id);
  else copie.delete(id);
  return copie;
}

// ==================== ÉLÉMENTS À COCHER ====================

/** Arbre des modules (case « module entier ») et de leurs leçons (repliées). */
function ArbreElements({
  coches,
  changer,
}: {
  coches: Set<string>;
  changer: (id: string, coche: boolean) => void;
}) {
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {MODULES.map((m) => {
        const lecons = m.lecons.filter((l) => coches.has(l.id)).length;
        return (
          <li key={m.id} className="rounded-md border border-line p-3">
            <label className="flex min-h-11 items-start gap-2">
              <input
                type="checkbox"
                name="item"
                value={m.id}
                checked={coches.has(m.id)}
                onChange={(e) => changer(m.id, e.target.checked)}
                className="mt-1 size-4"
              />
              <span className="font-semibold">
                {interpolate(d.toutLeModule, { n: String(m.numero), titre: m.titre })}
              </span>
            </label>
            <details className="mt-1 pl-6">
              <summary className="cursor-pointer text-small text-ink-muted">
                {interpolate(d.lecons, { n: String(m.numero), k: String(lecons) })}
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {m.lecons.map((l) => (
                  <li key={l.id}>
                    <label className="flex min-h-11 items-start gap-2 text-small">
                      <input
                        type="checkbox"
                        name="item"
                        value={l.id}
                        checked={coches.has(l.id)}
                        onChange={(e) => changer(l.id, e.target.checked)}
                        className="mt-1 size-4"
                      />
                      <span>
                        {m.numero}.{l.numero} — {l.titre}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

// ==================== PANNEAU ====================

/**
 * Panneau des dates individuelles pour les inscrits sélectionnés.
 * @param selection - Identifiants des comptes cochés dans la liste
 */
export function PanneauDiffusion({ selection }: { selection: string[] }) {
  const [coches, setCoches] = useState<Set<string>>(() => new Set());
  const [etatPose, poser, enPose] = useActionState(poserDiffusion, undefined);
  const [etatRetrait, retirer, enRetrait] = useActionState(retirerDiffusion, undefined);
  // Seul le message de la dernière action envoyée est affiché
  const [dernier, setDernier] = useState<"pose" | "retrait">("pose");
  const occupe = enPose || enRetrait;
  const vide = selection.length === 0;

  return (
    <section className={`${CARD} flex flex-col gap-4 p-6`}>
      <h2 className="font-serif text-xl font-semibold">{d.titre}</h2>
      <p className="text-small text-ink-muted">{d.intro}</p>
      <p role="status" className="font-semibold">
        {vide ? d.aucuneSelection : interpolate(d.pour, { n: String(selection.length) })}
      </p>

      <form className="flex flex-col gap-4">
        {selection.map((id) => (
          <input key={id} type="hidden" name="user" value={id} />
        ))}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">{d.elements}</legend>
          <ArbreElements
            coches={coches}
            changer={(id, coche) => setCoches((c) => basculer(c, id, coche))}
          />
          {coches.size > 0 && (
            <button
              type="button"
              onClick={() => setCoches(new Set())}
              className={`${BUTTON_TERTIARY} self-start`}
            >
              {d.decocher}
            </button>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-small font-semibold">{d.ouverture}</span>
            <input type="date" name="opens" className={CONTROL} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-small font-semibold">{d.fermeture}</span>
            <input type="date" name="closes" className={CONTROL} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-small font-semibold">{d.fuseau}</span>
            <select name="timezone" defaultValue={FUSEAUX[0]} className={CONTROL}>
              {FUSEAUX.map((f) => (
                <option key={f} value={f}>
                  {a.calendrier.fuseaux[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            formAction={poser}
            onClick={() => setDernier("pose")}
            disabled={vide || occupe || coches.size === 0}
            className={BUTTON_PRIMARY}
          >
            {d.appliquer}
          </button>
          <button
            type="submit"
            formAction={retirer}
            onClick={() => setDernier("retrait")}
            disabled={vide || occupe}
            className={BUTTON_SECONDARY}
          >
            {d.retirer}
          </button>
        </div>
        <p className="text-small text-ink-muted">{d.aideRetirer}</p>
        <FormMessage {...(dernier === "pose" ? etatPose : etatRetrait)} />
      </form>
    </section>
  );
}
