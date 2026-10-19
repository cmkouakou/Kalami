/**
 * =============================================================
 *  Fichier    : mobile-money-actions.ts
 *  Projet     : Kalami
 *  Description: Action serveur de l'acheteur (Sprint 6, v0.11.0) : déclaration de la
 *               transaction Mobile Money payée hors de l'application, puis alerte par
 *               courriel aux administrateurs. La base refuse un numéro déjà utilisé, une
 *               commande échue ou déjà déclarée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/payments/mobile-money-provider.ts, lib/payments/mobile-money-email.ts,
 *               lib/email/send.ts, lib/supabase/admin.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { type CurrentUser, requireUser } from "@/lib/auth/dal";
import { sendEmail } from "@/lib/email/send";
import {
  isMobileMoneyOperator,
  MM_OPERATOR_NAMES,
  normalizePhone,
  normalizeTransactionId,
} from "@/lib/payments/mobile-money";
import { buildDeclarationAlert } from "@/lib/payments/mobile-money-email";
import { getMobileMoneyProvider } from "@/lib/payments/mobile-money-provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const mm = getDictionary().mobileMoney;

/** Message d'erreur connu, ou message générique. */
function declarationError(code: string): string {
  const errors: Record<string, string> = mm.errors;
  return errors[code] ?? mm.errors.generic;
}

/**
 * Prévient les administrateurs d'une nouvelle déclaration (un courriel chacun).
 * Un échec d'envoi n'annule pas la déclaration : la commande reste dans « à valider ».
 * @param user - Acheteur
 * @param orderId - Commande déclarée
 */
async function alertAdmins(user: CurrentUser, orderId: string): Promise<void> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("total_minor, mm_operator, mm_reference, mm_transaction_id, mm_payer_number, " +
      "items:order_items(label)")
    .eq("id", orderId)
    .maybeSingle<{
      total_minor: number;
      mm_operator: string | null;
      mm_reference: string | null;
      mm_transaction_id: string | null;
      mm_payer_number: string | null;
      items: { label: string }[];
    }>();
  if (!order) return;

  const { data: emails } = await createAdminClient().rpc("mm_admin_emails");
  const operator = order.mm_operator;
  for (const to of (emails ?? []) as string[]) {
    await sendEmail(
      buildDeclarationAlert({
        to,
        buyerEmail: user.email ?? "—",
        operatorName: isMobileMoneyOperator(operator) ? MM_OPERATOR_NAMES[operator] : "—",
        totalMinor: Number(order.total_minor),
        labels: order.items.map((item) => item.label).join(" · "),
        reference: order.mm_reference ?? "—",
        transactionId: order.mm_transaction_id ?? "—",
        payerNumber: order.mm_payer_number ?? "—",
      }),
    );
  }
}

/**
 * Déclare la transaction d'une commande Mobile Money.
 *
 * Description : vérifie la forme des saisies, enregistre la déclaration au nom de
 * l'acheteur (la base contrôle propriété, délai et unicité), puis alerte l'administration.
 *
 * @param orderId - Commande (lié par .bind)
 * @returns Message de succès, ou erreur lisible
 *
 * Erreurs possibles :
 *   - invalid_transaction, invalid_payer : saisie mal formée
 *   - transaction_used, already_declared, order_expired, order_not_found : refus de la base
 */
export async function declareTransaction(
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(`/compte/achats/${orderId}`);
  if (!isUuid(orderId)) return { error: declarationError("order_not_found") };
  const transactionId = normalizeTransactionId(formData.get("transactionId"));
  if (!transactionId) return { error: declarationError("invalid_transaction") };
  const payerNumber = normalizePhone(formData.get("payerNumber"));
  if (!payerNumber) return { error: declarationError("invalid_payer") };

  const result = await getMobileMoneyProvider().declare(orderId, transactionId, payerNumber);
  if (result.error !== null) return { error: declarationError(result.error) };

  await alertAdmins(user, orderId);
  refresh();
  return { message: mm.order.declared };
}
