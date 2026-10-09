/**
 * =============================================================
 *  Fichier    : user-menu.tsx
 *  Projet     : Kalami
 *  Description: Lien de compte dans l'en-tête : « Se connecter » ou « Mon compte ».
 *               Lit la session : à placer dans une zone <Suspense> (cacheComponents).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, components/ui
 * =============================================================
 */

import Link from "next/link";

import { IconUser } from "@/components/ui/icons";
import { BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";

const t = getDictionary();

/** Lien affiché pendant le chargement de la session (et pour les visiteurs). */
export function SignInLink() {
  return (
    <Link href="/connexion" className={`${BUTTON_SECONDARY} px-4`}>
      {t.nav.signIn}
    </Link>
  );
}

/** Lien de compte selon l'état de connexion. */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return <SignInLink />;

  return (
    <Link href="/compte" className={BUTTON_TERTIARY}>
      <IconUser />
      {t.account.title}
    </Link>
  );
}
