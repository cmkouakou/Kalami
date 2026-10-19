/**
 * =============================================================
 *  Fichier    : audit-queries.ts
 *  Projet     : Kalami
 *  Description: Lecture du journal d'audit (Sprint 10b, v0.12.1) : entrées les plus récentes
 *               d'abord, filtrées par catégorie (préfixe de l'action), par pages de 50, et
 *               liste des catégories présentes. Fonctions SQL réservées à l'administrateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Entrée du journal avec le courriel de son auteur (null : système). */
export type AuditEntry = {
  id: number;
  created_at: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  actor_email: string | null;
};

/** Catégorie d'actions et nombre d'entrées. */
export type AuditCategory = { category: string; entries: number };

// ==================== CONSTANTES ====================

/** Entrées par page. */
export const AUDIT_PAGE_SIZE = 50;

// ==================== LECTURES ====================

/**
 * Une page du journal ; une entrée de plus est lue pour savoir s'il reste une page.
 * @param category - Préfixe de l'action, ou null pour tout
 * @param page - Numéro de page (à partir de 1)
 */
export async function listAuditEntries(
  category: string | null,
  page: number,
): Promise<{ entries: AuditEntry[]; hasMore: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_audit_log", {
    p_category: category,
    p_limit: AUDIT_PAGE_SIZE + 1,
    p_offset: (page - 1) * AUDIT_PAGE_SIZE,
  });
  if (error) throw new Error(`Lecture du journal impossible : ${error.message}`);
  const rows = (data ?? []) as AuditEntry[];
  return { entries: rows.slice(0, AUDIT_PAGE_SIZE), hasMore: rows.length > AUDIT_PAGE_SIZE };
}

/** Catégories présentes dans le journal, par ordre alphabétique. */
export async function listAuditCategories(): Promise<AuditCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_audit_categories");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return ((data ?? []) as AuditCategory[]).map((row) => ({
    category: row.category,
    entries: Number(row.entries),
  }));
}
