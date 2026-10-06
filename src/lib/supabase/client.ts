/**
 * =============================================================
 *  Fichier    : client.ts
 *  Projet     : Kalami
 *  Description: Client Supabase côté navigateur (composants clients).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: @supabase/ssr
 * =============================================================
 */

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

/** Crée un client Supabase pour le navigateur (session stockée en cookies). */
export function createClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createBrowserClient(url, publishableKey);
}
