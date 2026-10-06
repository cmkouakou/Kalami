/**
 * =============================================================
 *  Fichier    : proxy.ts
 *  Projet     : Kalami
 *  Description: Traitement exécuté avant chaque requête (ex-« middleware » de Next.js) :
 *               1. redirection 301 des domaines secondaires ;
 *               2. rafraîchissement de la session Supabase ;
 *               3. renvoi vers /connexion des pages privées si personne n'est connecté.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-06
 *  Dépendances: lib/config.ts, lib/domain-redirect.ts, lib/supabase/proxy-session.ts
 * =============================================================
 */

import { NextResponse, type NextRequest } from "next/server";

import { isProtectedPath } from "@/lib/auth/routes";
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

  const { response, isAuthenticated } = await updateSession(request);

  const { pathname, search } = request.nextUrl;
  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/connexion";
    loginUrl.search = `?suivant=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Exclut les fichiers statiques, les images optimisées et les icônes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
