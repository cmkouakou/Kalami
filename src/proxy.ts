/**
 * =============================================================
 *  Fichier    : proxy.ts
 *  Projet     : Kalami
 *  Description: Traitement exécuté avant chaque requête (ex-« middleware » de Next.js) :
 *               1. redirection 301 des domaines secondaires ;
 *               2. refus (403) des modifications venues d'un autre site (CSRF, Sprint 11s) ;
 *               3. code de connexion arrivé sur l'accueil → /auth/callback ;
 *               4. rafraîchissement de la session Supabase ;
 *               5. renvoi vers /connexion des pages privées si personne n'est connecté.
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-22
 *  Dépendances: lib/config.ts, lib/domain-redirect.ts, lib/security/csrf.ts,
 *               lib/supabase/proxy-session.ts
 * =============================================================
 */

import { NextResponse, type NextRequest } from "next/server";

import { authPath, isProtectedPath, strayAuthCallback } from "@/lib/auth/routes";
import { APP_URL, REDIRECT_DOMAINS } from "@/lib/config";
import { getDomainRedirect } from "@/lib/domain-redirect";
import { isCrossSiteMutation } from "@/lib/security/csrf";
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

  if (isCrossSiteMutation(request.method, request.nextUrl.pathname, request.headers)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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
  // Exclut les fichiers statiques, les images optimisées, les icônes, le service worker
  // (sw.js, sw-routes.js) et les manifestes : aucun n'a besoin de la session
  matcher: [
    "/((?!_next/static|_next/image|icons/|.*\\.(?:ico|svg|png|jpe?g|gif|webp|js|webmanifest)$).*)",
  ],
};
