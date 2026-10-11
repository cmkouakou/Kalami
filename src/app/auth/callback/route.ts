/**
 * =============================================================
 *  Fichier    : route.ts
 *  Projet     : Kalami
 *  Description: Retour d'authentification (/auth/callback) : confirmation d'inscription,
 *               lien magique, réinitialisation de mot de passe et Google.
 *               - « code »              → échange PKCE (flux par défaut de @supabase/ssr)
 *               - « token_hash » + type → vérification OTP (modèles de courriel personnalisés)
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 *  Dépendances: lib/supabase/server.ts, lib/auth/routes.ts
 * =============================================================
 */

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { authPath, isStrategyPath, safeNextPath, STRATEGY_HOME } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/** Vrai si le chemin est une page de nouveau mot de passe (site ou Kalami Stratégie). */
function isResetPath(path: string): boolean {
  return path.split("?")[0].endsWith("/reinitialiser-mot-de-passe");
}

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
  "email",
];

/**
 * Ouvre la session à partir des paramètres reçus, puis redirige.
 * @param request - Requête de retour (lien de courriel ou fournisseur OAuth)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let next = safeNextPath(searchParams.get("suivant") ?? searchParams.get("next"));

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
    // Le lien de réinitialisation peut déjà viser la page de Kalami Stratégie
    if (ok && type === "recovery" && !isResetPath(next)) next = "/reinitialiser-mot-de-passe";
  }

  if (!ok) {
    const login = authPath("connexion", isStrategyPath(next) ? STRATEGY_HOME : null);
    return NextResponse.redirect(`${origin}${login}${login.includes("?") ? "&" : "?"}erreur=lien`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
