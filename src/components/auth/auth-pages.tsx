/**
 * =============================================================
 *  Fichier    : auth-pages.tsx
 *  Projet     : Kalami
 *  Description: Contenu des quatre pages d'authentification, partagé entre le site
 *               (/connexion…) et Kalami Stratégie (/strategie/connexion…). La page de
 *               retour par défaut garde l'utilisateur dans son espace. L'inscription
 *               affiche la mention d'acceptation des textes légaux de l'espace.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-forms.tsx, lib/auth/dal.ts, lib/auth/routes.ts
 * =============================================================
 */

import { Suspense } from "react";

import {
  ForgotPasswordForm,
  ResetPasswordForm,
  SignInForm,
  SignUpForm,
  type AuthSearchParams,
} from "@/components/auth/auth-forms";
import { SignUpLegalNotice } from "@/components/legal/legal-links";
import { getDictionary } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { authPath } from "@/lib/auth/routes";

const t = getDictionary();

/** Propriétés communes : paramètres d'URL et page de retour par défaut (vide = site). */
type AuthPageProps = { searchParams: AuthSearchParams; defaultNext?: string };

// ==================== CONNEXION ET INSCRIPTION ====================

/** Page « Se connecter ». */
export function SignInPageContent({ searchParams, defaultNext }: AuthPageProps) {
  return (
    <>
      <h1 className="sr-only">{t.auth.signIn.title}</h1>
      {/* Les paramètres d'URL sont dynamiques : lus dans une zone Suspense */}
      <Suspense>
        <SignInForm searchParams={searchParams} defaultNext={defaultNext} />
      </Suspense>
    </>
  );
}

/** Page « Créer un compte ». */
export function SignUpPageContent({ searchParams, defaultNext }: AuthPageProps) {
  return (
    <>
      <h1 className="sr-only">{t.auth.signUp.title}</h1>
      <Suspense>
        <SignUpForm searchParams={searchParams} defaultNext={defaultNext} />
      </Suspense>
      <SignUpLegalNotice space={defaultNext?.startsWith("/strategie") ? "strategy" : "site"} />
    </>
  );
}

// ==================== MOT DE PASSE ====================

/** Page « Mot de passe oublié ». */
export function ForgotPasswordPageContent({ searchParams, defaultNext }: AuthPageProps) {
  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-semibold">{t.auth.forgot.title}</h1>
      <Suspense>
        <ForgotPasswordForm searchParams={searchParams} defaultNext={defaultNext} />
      </Suspense>
    </>
  );
}

/** Vérifie la session (lien de réinitialisation) avant d'afficher le formulaire. */
async function GuardedResetForm({ searchParams, defaultNext = "" }: AuthPageProps) {
  const { suivant = defaultNext } = await searchParams;
  await requireUser(authPath("mot-de-passe-oublie", suivant || null).split("?")[0]);
  return <ResetPasswordForm suivant={suivant} />;
}

/** Page « Nouveau mot de passe ». */
export function ResetPasswordPageContent(props: AuthPageProps) {
  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-semibold">{t.auth.reset.title}</h1>
      <Suspense>
        <GuardedResetForm {...props} />
      </Suspense>
    </>
  );
}
