/**
 * =============================================================
 *  Fichier    : dal.ts
 *  Projet     : Kalami
 *  Description: Couche d'accès aux données d'authentification (DAL). Toute page ou action
 *               serveur privée passe par ces fonctions : c'est ici que l'autorisation est
 *               réellement vérifiée (le proxy ne fait qu'une vérification optimiste).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Utilisateur courant, tel que lu dans le jeton validé. */
export type CurrentUser = {
  id: string;
  email: string | null;
  /** Niveau d'authentification : « aal1 » (mot de passe/lien) ou « aal2 » (MFA validée). */
  aal: "aal1" | "aal2";
};

/** Profil applicatif (table public.profiles). */
export type Profile = {
  id: string;
  display_name: string | null;
  locale: "fr" | "en";
  preferred_currency: "XOF" | "EUR" | "CAD" | null;
  is_admin: boolean;
};

// ==================== LECTURE DE LA SESSION ====================

/**
 * Retourne l'utilisateur connecté, ou null.
 * Mis en cache pour la durée d'une requête (plusieurs appels = une seule vérification).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
  };
});

/** Retourne le profil de l'utilisateur connecté, ou null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, locale, preferred_currency, is_admin")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return data ?? null;
});

// ==================== GARDES ====================

/**
 * Exige un utilisateur connecté ; sinon redirige vers /connexion.
 * @param nextPath - Page où revenir après connexion
 */
export async function requireUser(nextPath = "/compte"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suivant=${encodeURIComponent(nextPath)}`);
  return user;
}

/**
 * Exige un administrateur authentifié en deux étapes (aal2).
 * - non connecté      → /connexion
 * - pas administrateur → page d'accueil
 * - pas encore aal2   → /admin/mfa (enrôlement ou saisie du code TOTP)
 */
export async function requireAdmin(): Promise<{ user: CurrentUser; profile: Profile }> {
  const user = await requireUser("/admin");
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) redirect("/");
  if (user.aal !== "aal2") redirect("/admin/mfa");
  return { user, profile };
}
