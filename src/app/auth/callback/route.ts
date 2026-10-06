/**
 * =============================================================
 *  Fichier    : route.ts
 *  Projet     : Kalami
 *  Description: Retour d'authentification (/auth/callback) : confirmation d'inscription,
 *               lien magique, réinitialisation de mot de passe et Google.
 *               - « code »              → échange PKCE (flux par défaut de @supabase/ssr)
 *               - « token_hash » + type → vérification OTP (modèles de courriel personnalisés)
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/supabase/server.ts, lib/auth/routes.ts
 * =============================================================
 */

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

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
    if (ok && type === "recovery") next = "/reinitialiser-mot-de-passe";
  }

  if (!ok) return NextResponse.redirect(`${origin}/connexion?erreur=lien`);

  return NextResponse.redirect(`${origin}${next}`);
}
