/**
 * =============================================================
 *  Fichier    : auth-forms.tsx
 *  Projet     : Kalami
 *  Description: Formulaires d'authentification (composants clients branchés sur les
 *               actions serveur via useActionState).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/auth/actions.ts, components/ui/form.tsx
 * =============================================================
 */

"use client";

import Link from "next/link";
import { use, useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import {
  requestPasswordReset,
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
  signUp,
  updatePassword,
} from "@/lib/auth/actions";

const t = getDictionary();

/** Paramètres d'URL reçus par les pages d'authentification. */
export type AuthSearchParams = Promise<{ suivant?: string; erreur?: string }>;

/** Traduit le paramètre « erreur » (posé par /auth/callback) en message. */
function urlError(code: string | undefined): string | undefined {
  if (code === "lien") return t.auth.errors.linkExpired;
  if (code === "oauth") return t.auth.errors.generic;
  return undefined;
}

// ==================== CONNEXION ====================

/** Connexion : mot de passe, lien magique et Google. */
export function SignInForm({ searchParams }: { searchParams: AuthSearchParams }) {
  const { suivant = "", erreur } = use(searchParams);
  const [pwState, pwAction] = useActionState(signInWithPassword, undefined);
  const [linkState, linkAction] = useActionState(signInWithMagicLink, undefined);

  return (
    <div className="flex flex-col gap-6">
      <FormMessage error={urlError(erreur)} />

      <form action={pwAction} className="flex flex-col gap-4">
        <input type="hidden" name="suivant" value={suivant} />
        <Field label={t.auth.email} name="email" type="email" autoComplete="email" required />
        <Field
          label={t.auth.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FormMessage {...pwState} />
        <SubmitButton>{t.auth.signIn.submit}</SubmitButton>
        <Link href="/mot-de-passe-oublie" className="text-sm text-principale underline">
          {t.auth.signIn.forgot}
        </Link>
      </form>

      <Separator />

      <form action={linkAction} className="flex flex-col gap-4">
        <input type="hidden" name="suivant" value={suivant} />
        <Field
          label={t.auth.email}
          name="email"
          id="champ-email-lien"
          type="email"
          autoComplete="email"
          required
        />
        <FormMessage {...linkState} />
        <SubmitButton variant="secondary">{t.auth.signIn.magicLink}</SubmitButton>
      </form>

      <form action={signInWithGoogle}>
        <input type="hidden" name="suivant" value={suivant} />
        <SubmitButton variant="secondary">{t.auth.signIn.google}</SubmitButton>
      </form>

      <p className="text-center text-sm text-texte-doux">
        {t.auth.signIn.noAccount}{" "}
        <Link href="/inscription" className="text-principale underline">
          {t.auth.signIn.signUpLink}
        </Link>
      </p>
    </div>
  );
}

/** Séparateur « ou » entre deux méthodes de connexion. */
function Separator() {
  return (
    <div className="flex items-center gap-3 text-sm text-texte-doux" aria-hidden="true">
      <span className="h-px flex-1 bg-bordure" />
      {t.auth.or}
      <span className="h-px flex-1 bg-bordure" />
    </div>
  );
}

// ==================== INSCRIPTION ====================

/** Création de compte. */
export function SignUpForm() {
  const [state, action] = useActionState(signUp, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={t.auth.displayName} name="display_name" autoComplete="name" maxLength={120} />
      <Field label={t.auth.email} name="email" type="email" autoComplete="email" required />
      <Field
        label={t.auth.password}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage {...state} />
      <SubmitButton>{t.auth.signUp.submit}</SubmitButton>
      <p className="text-center text-sm text-texte-doux">
        {t.auth.signUp.hasAccount}{" "}
        <Link href="/connexion" className="text-principale underline">
          {t.auth.signUp.signInLink}
        </Link>
      </p>
    </form>
  );
}

// ==================== MOT DE PASSE ====================

/** Demande de lien de réinitialisation. */
export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-texte-doux">{t.auth.forgot.intro}</p>
      <Field label={t.auth.email} name="email" type="email" autoComplete="email" required />
      <FormMessage {...state} />
      <SubmitButton>{t.auth.forgot.submit}</SubmitButton>
    </form>
  );
}

/** Saisie du nouveau mot de passe. */
export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label={t.auth.newPassword}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage {...state} />
      <SubmitButton>{t.auth.reset.submit}</SubmitButton>
    </form>
  );
}
