/**
 * =============================================================
 *  Fichier    : user-menu.tsx
 *  Projet     : Kalami
 *  Description: Compte dans l'en-tête : « Se connecter » ou menu « Mon compte » avec les
 *               espaces accessibles (auteur, administration).
 *               Lit la session : à placer dans une zone <Suspense> (cacheComponents).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-25
 *  Dépendances: lib/auth/dal.ts, lib/author/queries.ts, components/layout/account-menu.tsx
 * =============================================================
 */

import { AccountMenu, SignInLink } from "@/components/layout/account-menu";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";
import { hasAuthorProfile } from "@/lib/author/queries";

export { SignInLink };

/** Lien de connexion ou menu du compte selon l'état de connexion. */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return <SignInLink />;

  const [profile, isAuthor] = await Promise.all([
    getCurrentProfile(),
    hasAuthorProfile(user.id),
  ]);

  return <AccountMenu isAuthor={isAuthor} isAdmin={profile?.is_admin === true} />;
}
