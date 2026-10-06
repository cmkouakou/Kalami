/**
 * =============================================================
 *  Fichier    : proxy.ts
 *  Projet     : Kalami
 *  Description: Traitement exécuté avant chaque requête (ex-« middleware » de Next.js).
 *               Sprint 0 : redirection 301 des domaines secondaires.
 *               Sprint 1 : rafraîchissement de la session Supabase.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/config.ts, lib/domain-redirect.ts
 * =============================================================
 */

import { NextResponse, type NextRequest } from "next/server";

import { APP_URL, REDIRECT_DOMAINS } from "@/lib/config";
import { getDomainRedirect } from "@/lib/domain-redirect";

/**
 * Point d'entrée du proxy : redirige les domaines secondaires, sinon laisse passer.
 * @param request - Requête entrante
 */
export function proxy(request: NextRequest) {
  const target = getDomainRedirect(
    request.url,
    request.headers.get("host"),
    APP_URL,
    REDIRECT_DOMAINS,
  );
  if (target) return NextResponse.redirect(target, 301);

  return NextResponse.next();
}

export const config = {
  // Exclut les fichiers statiques et les images optimisées
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
