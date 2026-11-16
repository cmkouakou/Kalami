/**
 * =============================================================
 *  Fichier    : feature-actions.ts
 *  Projet     : Kalami
 *  Description: Action de la page « Fonctionnalités » (v0.24.0) : afficher ou masquer une
 *               offre en vente (étude, lot, forfait du coach ou de l'Atelier, cas
 *               d'entraînement) sans toucher à ses prix. La fonction SQL vérifie le rôle
 *               administrateur (aal2) et écrit le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import { FEATURE_KINDS, type FeatureKind } from "@/lib/admin/features";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const f = getDictionary().admin.features;

/**
 * Affiche ou masque une offre.
 *
 * Description : lit le type d'offre, sa clé et l'état voulu (« 1 » en vente, « 0 »
 * masquée), puis appelle admin_set_feature.
 *
 * @param _prev    - État précédent du formulaire (inutilisé)
 * @param formData - Champs kind, key, active
 * @returns Message de succès ou d'erreur
 *
 * Erreurs possibles :
 *   - type ou état invalide, offre introuvable : message « invalid »
 */
export async function setFeature(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const key = String(formData.get("key") ?? "").slice(0, 80);
  const active = String(formData.get("active") ?? "");
  if (!FEATURE_KINDS.includes(kind as FeatureKind) || !key || !["0", "1"].includes(active)) {
    return { error: f.invalid };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_feature", {
    p_kind: kind,
    p_key: key,
    p_active: active === "1",
  });
  if (error) return { error: f.invalid };

  refresh();
  return { message: active === "1" ? f.shownDone : f.hiddenDone };
}
