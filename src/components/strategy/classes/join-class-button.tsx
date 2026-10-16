/**
 * =============================================================
 *  Fichier    : join-class-button.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Bouton « Rejoindre la classe » de la page ouverte par un lien de classe ou
 *               une invitation (S10a). En cas de succès, l'action ramène à l'accueil de
 *               Stratégie ; sinon l'erreur est affichée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { joinClass } from "@/lib/strategy/class-actions";

const j = getDictionary().strategy.classes.join;

/** Inscription à la classe désignée par le jeton. */
export function JoinClassButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(undefined);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          disabled={pending}
          aria-busy={pending}
          className={`${BUTTON_PRIMARY} disabled:opacity-60`}
          onClick={() => startTransition(async () => {
            setState(await joinClass(token));
          })}
        >
          {pending ? j.joining : j.submit}
        </button>
      </div>
      <FormMessage {...state} />
    </div>
  );
}
