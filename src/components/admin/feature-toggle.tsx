/**
 * =============================================================
 *  Fichier    : feature-toggle.tsx
 *  Projet     : Kalami
 *  Description: Interrupteur « En vente / Masquée » d'une offre (page Fonctionnalités,
 *               v0.24.0) : un bouton qui inverse l'état, avec le retour de l'action.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/admin/feature-actions.ts, i18n
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { getDictionary } from "@/i18n";
import { setFeature } from "@/lib/admin/feature-actions";
import type { FeatureKind } from "@/lib/admin/features";

const f = getDictionary().admin.features;

type FeatureToggleProps = {
  kind: FeatureKind;
  featureKey: string;
  active: boolean;
  /** Nom de l'offre, pour le libellé accessible du bouton. */
  name: string;
};

/** Bouton qui affiche ou masque une offre ; l'état affiché vient du serveur. */
export function FeatureToggle({ kind, featureKey, active, name }: FeatureToggleProps) {
  const [state, formAction, pending] = useActionState(setFeature, undefined);
  const label = active ? f.hide : f.show;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="key" value={featureKey} />
      <input type="hidden" name="active" value={active ? "0" : "1"} />
      <button
        type="submit"
        role="switch"
        aria-checked={active}
        aria-label={`${label} : ${name}`}
        disabled={pending}
        className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-3 text-sm
          font-semibold disabled:opacity-60 ${
            active ? "border-encre bg-encre-soft text-encre" : "border-line bg-sand text-ink-muted"
          }`}
      >
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 rounded-full transition-colors ${
            active ? "bg-encre" : "bg-line"
          }`}
        >
          <span
            className={`absolute top-0.5 size-4 rounded-full bg-surface transition-all ${
              active ? "left-4.5" : "left-0.5"
            }`}
          />
        </span>
        {active ? f.on : f.off}
      </button>
      {state?.error && (
        <p role="alert" className="text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
