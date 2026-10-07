/**
 * =============================================================
 *  Fichier    : public.ts
 *  Projet     : Kalami
 *  Description: Client Supabase anonyme, sans cookies ni session : il ne voit que les
 *               données publiques (RLS) et peut donc être utilisé dans une portée 'use cache'.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: @supabase/supabase-js
 * =============================================================
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

/**
 * Crée un client Supabase public (rôle anon), indépendant de la requête courante.
 * @returns Client Supabase sans persistance de session
 */
export function createPublicClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
