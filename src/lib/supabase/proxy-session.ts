/**
 * =============================================================
 *  Fichier    : proxy-session.ts
 *  Projet     : Kalami
 *  Description: Rafraîchit la session Supabase dans proxy.ts et indique si un utilisateur
 *               est connecté (vérification optimiste ; l'autorisation réelle est faite
 *               côté serveur, au plus près des données).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: @supabase/ssr
 * =============================================================
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "./env";

/**
 * Met à jour les cookies de session et retourne la réponse à renvoyer.
 *
 * @param request - Requête entrante
 * @returns { response, isAuthenticated } — la réponse porte les cookies rafraîchis
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; isAuthenticated: boolean }> {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // En-têtes anti-cache fournis par Supabase pour les réponses qui posent des cookies
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // getClaims() valide le jeton (signature) et le rafraîchit si nécessaire
  const { data } = await supabase.auth.getClaims();

  return { response, isAuthenticated: Boolean(data?.claims?.sub) };
}
