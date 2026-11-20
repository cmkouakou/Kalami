/**
 * =============================================================
 *  Fichier    : actions-atelier.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Action serveur des ateliers corrigés par l'IA (v0.40.0). Vérifie la
 *               connexion, l'accès au cours et l'ouverture de la leçon, réserve une
 *               correction en base (plafond de 5 par atelier, sous verrou), appelle
 *               Claude, puis enregistre la correction. Un échec technique marque la
 *               demande « failed » : elle n'est pas comptée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/auth/dal.ts, lib/supabase/admin.ts, lib/cours/acces.ts,
 *               lib/cours/atelier-ia.ts, lib/cours/atelier-ia-serveur.ts,
 *               lib/strategy/coach/client.ts
 * =============================================================
 */

"use server";

import { getCourseDictionary } from "@/i18n/course";
import { interpolate } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { aAccesAuCours, diffusionApprenant } from "@/lib/cours/acces";
import {
  MAX_CORRECTIONS,
  atelierParId,
  validerSaisie,
  type CorrectionAtelier,
} from "@/lib/cours/atelier-ia";
import { corrigerAvecIA } from "@/lib/cours/atelier-ia-serveur";
import { atelierPresent } from "@/lib/cours/content";
import { contenuLecon } from "@/lib/cours/lecons";
import { leconParId } from "@/lib/cours/modules";
import { isCoachConfigured } from "@/lib/strategy/coach/client";
import { createAdminClient } from "@/lib/supabase/admin";

const t = getCourseDictionary();

export type ResultatAtelier =
  | {
      ok: true;
      id: string;
      correction: CorrectionAtelier;
      creeLe: string;
      restantes: number;
    }
  | { ok: false; error: string; restantes?: number };

/**
 * Nombre de corrections encore permises (terminées + en cours depuis < 10 min).
 * @param userId    - Apprenant
 * @param atelierId - Identifiant complet de l'atelier
 */
async function restantes(userId: string, atelierId: string): Promise<number> {
  const depuis = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await createAdminClient()
    .from("course_ai_feedback")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("workshop_id", atelierId)
    .or(`status.eq.done,and(status.eq.pending,created_at.gt.${depuis})`);
  return Math.max(0, MAX_CORRECTIONS - (count ?? 0));
}

/**
 * Demande à l'IA la correction d'un atelier.
 *
 * @param leconId - Identifiant stable de la leçon (« m01-l02 »)
 * @param localId - Identifiant local de l'atelier (« a1 »)
 * @param brut    - Saisie de l'apprenant (non fiable : validée ici)
 * @returns Correction et corrections restantes, ou message d'erreur
 */
export async function corrigerAtelier(
  leconId: string,
  localId: string,
  brut: unknown,
): Promise<ResultatAtelier> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.erreurs.connexion };
  if (typeof leconId !== "string" || !leconParId(leconId)) {
    return { ok: false, error: t.erreurs.invalide };
  }
  const atelier = atelierParId(`${leconId}-${localId}`);
  const saisie = atelier ? validerSaisie(atelier, brut) : null;
  if (!atelier || !atelierPresent(contenuLecon(leconId) ?? [], localId)) {
    return { ok: false, error: t.erreurs.invalide };
  }
  if (!saisie) return { ok: false, error: t.erreurs.invalide };
  if (!(await aAccesAuCours())) return { ok: false, error: t.erreurs.acces };
  const { etats } = await diffusionApprenant();
  if (etats.get(leconId)?.etat !== "ouverte") {
    return { ok: false, error: t.diffusion.pasEncore };
  }
  if (!isCoachConfigured()) return { ok: false, error: t.ateliers.indisponible };

  const admin = createAdminClient();
  try {
    // Réservation : null si le plafond est atteint
    const { data: demandeId, error } = await admin.rpc("course_reserve_ai_feedback", {
      p_user_id: user.id,
      p_workshop: atelier.id,
      p_input: saisie,
      p_max: MAX_CORRECTIONS,
    });
    if (error) return { ok: false, error: t.ateliers.erreur };
    if (!demandeId) {
      return {
        ok: false,
        error: interpolate(t.ateliers.epuise, { max: String(MAX_CORRECTIONS) }),
        restantes: 0,
      };
    }

    const issue = await corrigerAvecIA(atelier, saisie);
    const fin = new Date().toISOString();
    const commun = {
      model: issue.modele?.slice(0, 100) ?? null,
      input_tokens: issue.jetonsEntree,
      output_tokens: issue.jetonsSortie,
      completed_at: fin,
    };
    if (!issue.ok) {
      // Échec technique : la demande n'est pas comptée
      await admin
        .from("course_ai_feedback")
        .update({ ...commun, status: "failed", error: issue.raison.slice(0, 500) })
        .eq("id", demandeId);
      return { ok: false, error: t.ateliers.erreur };
    }
    const { error: ecriture } = await admin
      .from("course_ai_feedback")
      .update({ ...commun, status: "done", output: issue.correction })
      .eq("id", demandeId);
    if (ecriture) {
      await admin
        .from("course_ai_feedback")
        .update({ status: "failed", error: "écriture impossible" })
        .eq("id", demandeId);
      return { ok: false, error: t.ateliers.erreur };
    }
    return {
      ok: true,
      id: String(demandeId),
      correction: issue.correction,
      creeLe: fin,
      restantes: await restantes(user.id, atelier.id),
    };
  } catch {
    return { ok: false, error: t.ateliers.erreur };
  }
}
