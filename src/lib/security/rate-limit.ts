/**
 * =============================================================
 *  Fichier    : rate-limit.ts
 *  Projet     : Kalami
 *  Description: Limitation de débit générique (Sprint 11s) : connexion, inscription, lien
 *               magique, mot de passe oublié, codes promo, export des données et du plan
 *               stratégique. Le sujet
 *               (adresse IP, compte, empreinte du courriel) est calculé ici, côté serveur ;
 *               le comptage est fait par la fonction SQL hit_rate_limit (rôle service).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: lib/supabase/admin.ts, migration 20261111120000_security.sql
 * =============================================================
 */

import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

// ==================== CONSTANTES ====================

/** Limites par compartiment : nombre de tentatives permises sur la fenêtre (secondes). */
export const RATE_LIMITS = {
  login_ip: { limit: 20, windowSeconds: 15 * 60 },
  login_email: { limit: 10, windowSeconds: 15 * 60 },
  signup_ip: { limit: 5, windowSeconds: 60 * 60 },
  magic_link_email: { limit: 5, windowSeconds: 60 * 60 },
  reset_email: { limit: 5, windowSeconds: 60 * 60 },
  promo_user: { limit: 10, windowSeconds: 10 * 60 },
  export_user: { limit: 5, windowSeconds: 60 * 60 },
  plan_export_user: { limit: 20, windowSeconds: 60 * 60 },
} as const;

/** Compartiment de limitation. */
export type RateLimitBucket = keyof typeof RATE_LIMITS;

// ==================== SUJETS ====================

/**
 * Sujet « ip:… » d'après les en-têtes transmis par Vercel.
 * @param headers - En-têtes de la requête
 */
export function ipSubject(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim() || "inconnue";
  return `ip:${ip.slice(0, 64)}`;
}

/**
 * Sujet « email:… » : empreinte du courriel normalisé (jamais conservé en clair).
 * @param email - Adresse saisie
 */
export function emailSubject(email: string): string {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `email:${digest.slice(0, 32)}`;
}

/**
 * Sujet « user:… » d'un compte connecté.
 * @param userId - Identifiant du compte
 */
export function userSubject(userId: string): string {
  return `user:${userId}`;
}

// ==================== COMPTAGE ====================

/**
 * Inscrit une tentative et indique si elle est permise.
 * Une panne de la base laisse passer la tentative (journalisée) : mieux vaut ne pas bloquer
 * la connexion de tous les comptes que d'être strict pendant une panne.
 * @param bucket  - Compartiment (voir RATE_LIMITS)
 * @param subject - Sujet calculé par ipSubject, emailSubject ou userSubject
 * @returns true si la tentative est permise
 */
export async function allowAttempt(bucket: RateLimitBucket, subject: string): Promise<boolean> {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_bucket: bucket,
    p_subject: subject,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[débit] comptage impossible :", bucket, error.code, error.message);
    return true;
  }
  return data !== false;
}

/**
 * Inscrit une tentative dans plusieurs compartiments ; refusée si l'un d'eux est saturé.
 * Toutes les tentatives sont inscrites, pour que chaque compteur reste exact.
 * @param checks - Paires [compartiment, sujet]
 */
export async function allowAttempts(
  checks: ReadonlyArray<readonly [RateLimitBucket, string]>,
): Promise<boolean> {
  const results = await Promise.all(
    checks.map(([bucket, subject]) => allowAttempt(bucket, subject)),
  );
  return results.every(Boolean);
}
