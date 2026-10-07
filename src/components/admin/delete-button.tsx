/**
 * =============================================================
 *  Fichier    : delete-button.tsx
 *  Projet     : Kalami
 *  Description: Bouton de suppression en deux temps (« Supprimer » puis « Confirmer »),
 *               sans boîte de dialogue du navigateur. Affiche l'erreur éventuelle.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: components/ui/form.tsx
 * =============================================================
 */

"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";

const t = getDictionary();

const BUTTON_CLASS = "min-h-11 rounded-md px-4 text-sm font-medium disabled:opacity-60";

/** Suppression confirmée par un second clic. */
export function DeleteButton({ action }: { action: () => Promise<FormState> }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <form action={formAction} className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className={`${BUTTON_CLASS} bg-red-700 text-white hover:bg-red-800`}
          >
            {t.admin.common.confirmDelete}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={`${BUTTON_CLASS} border border-bordure`}
          >
            {t.admin.common.cancel}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${BUTTON_CLASS} w-fit border border-red-300 text-red-800 hover:bg-red-50`}
        >
          {t.admin.common.delete}
        </button>
      )}
      <FormMessage {...state} />
    </div>
  );
}
