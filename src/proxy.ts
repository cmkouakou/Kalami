/**
 * =============================================================
 *  Fichier    : proxy.ts
 *  Projet     : Kalami
 *  Description: Traitement exécuté avant chaque requête (ex-« middleware » de Next.js) :
 *               1. redirection 301 des domaines secondaires ;
 *               2. code de connexion arrivé sur l'accueil → /auth/callback ;
 *               3. rafraîchissement de la session Supabase ;
 *               4. renvoi vers /connexion des pages privées si personne n'est connecté.
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-11
 *  Dépendances: lib/config.ts, lib/domain-redirect.ts, lib/supabase/proxy-session.ts
 * =============================================================
 */

import { NextResponse, type NextRequest } from "next/server";

import { authPath, isProtectedPath, strayAuthCallback } from "@/lib/auth/routes";
import { APP_URL, REDIRECT_DOMAINS } from "@/lib/config";
import { getDomainRedirect } from "@/lib/domain-redirect";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Point d'entrée du proxy.
 * @param request - Requête entrante
 */
export async function proxy(request: NextRequest) {
  const target = getDomainRedirect(
    request.url,
    request.headers.get("host"),
    APP_URL,
    REDIRECT_DOMAINS,
  );
  if (target) return NextResponse.redirect(target, 301);

  const callback = strayAuthCallback(request.nextUrl);
  if (callback) return NextResponse.redirect(callback);

  const { response, isAuthenticated } = await updateSession(request);

  const { pathname, search } = request.nextUrl;
  if (!isAuthenticated && isProtectedPath(pathname)) {
    // Un chemin de Kalami Stratégie garde ses propres pages de connexion
    return NextResponse.redirect(new URL(authPath("connexion", pathname + search), request.url));
  }

  return response;
}

export const config = {
  // Exclut les fichiers statiques, les images optimisées et les icônes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
