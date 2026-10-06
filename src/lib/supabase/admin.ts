/**
 * =============================================================
 *  Fichier    : admin.ts
 *  Projet     : Kalami
 *  Description: Client Supabase « service » qui contourne la RLS.
 *               À réserver aux traitements serveur de confiance (webhooks, contenu protégé,
 *               validation des paiements). Ne jamais l'importer dans un composant client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: @supabase/supabase-js
 * =============================================================
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

/** Crée un client Supabase avec la clé secrète (sans session utilisateur). */
export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY manquante (voir .env.example).");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
