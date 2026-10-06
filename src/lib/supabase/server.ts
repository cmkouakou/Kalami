/**
 * =============================================================
 *  Fichier    : server.ts
 *  Projet     : Kalami
 *  Description: Client Supabase côté serveur, agissant au nom de l'utilisateur connecté
 *               (les politiques RLS s'appliquent).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: @supabase/ssr, next/headers
 * =============================================================
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "./env";

/**
 * Crée un client Supabase lié aux cookies de la requête courante.
 *
 * L'écriture des cookies échoue silencieusement dans un composant serveur (lecture seule) :
 * le rafraîchissement de session est alors assuré par proxy.ts.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appel depuis un composant serveur : cookies en lecture seule, ignoré volontairement
        }
      },
    },
  });
}
