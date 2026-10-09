/**
 * =============================================================
 *  Fichier    : delete-button.tsx
 *  Projet     : Kalami
 *  Description: Bouton de suppression en deux temps (« Supprimer » puis « Confirmer »),
 *               sans boîte de dialogue du navigateur. Affiche l'erreur éventuelle.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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

/**
 * Suppression (ou retrait) confirmée par un second clic.
 * @param action       - Action serveur liée à l'élément
 * @param label        - Libellé du premier bouton (« Supprimer » par défaut)
 * @param confirmLabel - Libellé du bouton de confirmation
 */
export function DeleteButton({
  action,
  label = t.admin.common.delete,
  confirmLabel = t.admin.common.confirmDelete,
}: {
  action: () => Promise<FormState>;
  label?: string;
  confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <form action={formAction} className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className={`${BUTTON_CLASS} bg-danger text-on-encre hover:opacity-90`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={`${BUTTON_CLASS} border border-line`}
          >
            {t.admin.common.cancel}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${BUTTON_CLASS} w-fit border border-danger text-danger hover:bg-danger/10`}
        >
          {label}
        </button>
      )}
      <FormMessage {...state} />
    </div>
  );
}
