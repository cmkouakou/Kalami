/**
 * =============================================================
 *  Fichier    : payout-paid-form.tsx
 *  Projet     : Kalami
 *  Description: Formulaire « Marquer payée » d'une demande de versement approuvée
 *               (Sprint 10b, v0.12.1). Le reçu éventuel part directement du navigateur vers
 *               le seau privé « payout-proofs » (politique administrateur), puis l'action
 *               serveur enregistre la référence de la transaction et le chemin du reçu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/client.ts, lib/revenue/payout-actions.ts
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Field, FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { markPayoutPaid } from "@/lib/revenue/payout-actions";
import {
  PAYOUT_PROOF_FORMATS,
  PAYOUT_PROOF_MAX_BYTES,
  PAYOUT_PROOFS_BUCKET,
  proofExtension,
  proofPath,
} from "@/lib/revenue/payouts";
import { createClient } from "@/lib/supabase/client";

const ap = getDictionary().admin.payouts;

/** Types acceptés par le sélecteur de fichier. */
const ACCEPT = Object.entries(PAYOUT_PROOF_FORMATS)
  .map(([extension, mime]) => `.${extension},${mime}`)
  .join(",");

/**
 * Dépose le reçu dans le seau privé.
 * @param payoutId - Demande de versement
 * @param file - Fichier choisi (format et taille déjà contrôlés)
 * @param extension - Extension acceptée
 * @returns Chemin du reçu dans le seau
 */
async function uploadProof(payoutId: string, file: File, extension: string): Promise<string> {
  const path = proofPath(payoutId, extension, crypto.randomUUID());
  const { error } = await createClient()
    .storage.from(PAYOUT_PROOFS_BUCKET)
    .upload(path, file, { contentType: PAYOUT_PROOF_FORMATS[extension] });
  if (error) throw error;
  return path;
}

/** Référence de la transaction, reçu facultatif et bouton « Marquer payée ». */
export function PayoutPaidForm({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FormState>(undefined);

  /** Contrôle et envoie le reçu, puis enregistre le paiement. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("proof");
    const hasFile = file instanceof File && file.size > 0;
    const extension = hasFile ? proofExtension(file.name) : null;
    if (hasFile && !extension) return setFeedback({ error: ap.errors.proof_type });
    if (hasFile && file.size > PAYOUT_PROOF_MAX_BYTES) {
      return setFeedback({ error: ap.errors.proof_size });
    }

    setBusy(true);
    try {
      let path: string | null = null;
      if (hasFile && extension) {
        setFeedback({ message: ap.uploading });
        path = await uploadProof(payoutId, file, extension);
      }
      const result = await markPayoutPaid(payoutId, String(data.get("paymentReference")), path);
      setFeedback(result);
      if (result?.message) router.refresh();
    } catch {
      setFeedback({ error: ap.errors.proof_upload });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field
        id={`transaction-${payoutId}`}
        name="paymentReference"
        label={ap.paymentReference}
        hint={ap.paymentReferenceHint}
        maxLength={120}
        required
      />
      <Field
        id={`recu-${payoutId}`}
        name="proof"
        type="file"
        label={ap.proof}
        accept={ACCEPT}
        className="py-2 text-sm"
      />
      <button type="submit" disabled={busy} className={`${BUTTON_PRIMARY} w-fit`}>
        {ap.markPaid}
      </button>
      <FormMessage {...feedback} />
    </form>
  );
}
