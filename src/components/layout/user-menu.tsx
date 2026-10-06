/**
 * =============================================================
 *  Fichier    : user-menu.tsx
 *  Projet     : Kalami
 *  Description: Lien de compte dans l'en-tête : « Se connecter » ou « Mon compte ».
 *               Lit la session : à placer dans une zone <Suspense> (cacheComponents).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/auth/dal.ts
 * =============================================================
 */

import Link from "next/link";

import { getDictionary } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";

const t = getDictionary();

/** Lien affiché pendant le chargement de la session (et pour les visiteurs). */
export function SignInLink() {
  return (
    <Link href="/connexion" className="hover:text-principale">
      {t.nav.signIn}
    </Link>
  );
}

/** Lien de compte selon l'état de connexion. */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return <SignInLink />;

  return (
    <Link href="/compte" className="font-medium text-principale">
      {t.account.title}
    </Link>
  );
}
