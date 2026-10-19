/**
 * =============================================================
 *  Fichier    : payout-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures des versements (Sprint 10b, v0.12.1) : demandes de l'auteur
 *               connecté, coordonnées de versement renseignées ou non, demandes de toute la
 *               plateforme filtrées par statut et liens vers les reçus (administrateur).
 *               La RLS limite l'auteur à ses propres demandes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, lib/revenue/payouts.ts
 * =============================================================
 */

import "server-only";

import type { PayoutRequest, PayoutStatus } from "@/lib/revenue/payouts";
import { OPEN_STATUSES, PAYOUT_PROOFS_BUCKET } from "@/lib/revenue/payouts";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

const PAYOUT_COLUMNS =
  "id, reference, author_id, author_name, currency, amount_minor, status, payout_method, " +
  "payout_details, approved_at, paid_at, payment_reference, proof_path, rejected_at, " +
  "rejection_reason, cancelled_at, created_at";

/** Nombre de demandes affichées dans les listes. */
const LIST_LIMIT = 100;

/** Durée de validité des liens vers les reçus : 10 minutes. */
const PROOF_URL_SECONDS = 600;

// ==================== AUTEUR ====================

/**
 * Demandes de versement d'un auteur, les plus récentes d'abord.
 * @param authorId - Fiche auteur (la RLS refuse celles d'un autre)
 */
export async function listAuthorPayouts(authorId: string): Promise<PayoutRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payout_requests")
    .select(PAYOUT_COLUMNS)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw new Error(`Lecture des versements impossible : ${error.message}`);
  return (data ?? []) as unknown as PayoutRequest[];
}

/**
 * Indique si l'auteur a renseigné ses coordonnées de versement.
 * @param authorId - Fiche auteur
 */
export async function hasPayoutDetails(authorId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("author_payout_details")
    .select("author_id")
    .eq("author_id", authorId)
    .maybeSingle();
  return Boolean(data);
}

// ==================== ADMINISTRATION ====================

/**
 * Demandes de toute la plateforme ; sans statut, les demandes ouvertes (à traiter).
 * @param status - Statut à afficher, ou null pour les demandes ouvertes
 */
export async function listPayoutsAdmin(status: PayoutStatus | null): Promise<PayoutRequest[]> {
  const supabase = await createClient();
  const query = supabase.from("payout_requests").select(PAYOUT_COLUMNS);
  const filtered = status ? query.eq("status", status) : query.in("status", [...OPEN_STATUSES]);
  // Les demandes à traiter : les plus anciennes d'abord
  const { data, error } = await filtered
    .order("created_at", { ascending: status === null })
    .limit(LIST_LIMIT);
  if (error) throw new Error(`Lecture des versements impossible : ${error.message}`);
  return (data ?? []) as unknown as PayoutRequest[];
}

/**
 * Liens temporaires vers les reçus (politique administrateur du seau privé).
 * @param payouts - Demandes affichées
 * @returns Lien signé par identifiant de demande (reçus absents ou illisibles omis)
 */
export async function signProofUrls(payouts: PayoutRequest[]): Promise<Map<string, string>> {
  const withProof = payouts.filter((payout) => payout.proof_path);
  if (withProof.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(PAYOUT_PROOFS_BUCKET)
    .createSignedUrls(
      withProof.map((payout) => payout.proof_path as string),
      PROOF_URL_SECONDS,
    );
  const urls = new Map<string, string>();
  (data ?? []).forEach((signed, index) => {
    if (signed.signedUrl) urls.set(withProof[index].id, signed.signedUrl);
  });
  return urls;
}
