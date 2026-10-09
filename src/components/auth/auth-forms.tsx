/**
 * =============================================================
 *  Fichier    : auth-forms.tsx
 *  Projet     : Kalami
 *  Description: Formulaires d'authentification (composants clients branchés sur les
 *               actions serveur via useActionState) : onglets Connexion / Créer un compte,
 *               Google proposé en premier sur les deux pages.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
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

/** Conserve la page de retour d'un onglet à l'autre. */
function withNext(path: string, suivant: string): string {
  return suivant ? `${path}?suivant=${encodeURIComponent(suivant)}` : path;
}

// ==================== ONGLETS ====================

/**
 * Onglets « Se connecter » / « Créer un compte » : deux pages distinctes reliées par des liens
 * (aria-current marque la page affichée).
 */
function AuthTabs({ active, suivant }: { active: "signIn" | "signUp"; suivant: string }) {
  const tabs = [
    { key: "signIn", href: withNext("/connexion", suivant), label: t.auth.signUp.signInLink },
    { key: "signUp", href: withNext("/inscription", suivant), label: t.auth.signIn.signUpLink },
  ] as const;

  return (
    <nav aria-label={t.auth.tabsLabel} className="-mx-6 -mt-6 mb-6 flex border-b border-line">
      {tabs.map((tab) => {
        const current = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-12 flex-1 items-center justify-center border-b-2 px-4
              text-label transition ${
                current
                  ? "border-encre text-encre"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ==================== GOOGLE ====================

/** Logo « G » de Google (couleurs officielles, décoratif). */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51
          5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78
          7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0
          20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26
          0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** Bouton « Continuer avec Google » (connexion ou création de compte). */
function GoogleButton({ suivant }: { suivant: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="suivant" value={suivant} />
      <SubmitButton variant="secondary">
        <span className="inline-flex items-center justify-center gap-2">
          <GoogleLogo />
          {t.auth.signIn.google}
        </span>
      </SubmitButton>
    </form>
  );
}

// ==================== CONNEXION ====================

/** Connexion : Google, mot de passe et lien magique. */
export function SignInForm({ searchParams }: { searchParams: AuthSearchParams }) {
  const { suivant = "", erreur } = use(searchParams);
  const [pwState, pwAction] = useActionState(signInWithPassword, undefined);
  const [linkState, linkAction] = useActionState(signInWithMagicLink, undefined);

  return (
    <div className="flex flex-col gap-6">
      <AuthTabs active="signIn" suivant={suivant} />
      <FormMessage error={urlError(erreur)} />
      <GoogleButton suivant={suivant} />
      <Separator />

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
        <Link href="/mot-de-passe-oublie" className="text-sm text-encre underline">
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
    </div>
  );
}

/** Séparateur « ou » entre deux méthodes de connexion. */
function Separator() {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      {t.auth.or}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

// ==================== INSCRIPTION ====================

/** Création de compte : Google, ou courriel et mot de passe. */
export function SignUpForm({ searchParams }: { searchParams: AuthSearchParams }) {
  const { suivant = "", erreur } = use(searchParams);
  const [state, action] = useActionState(signUp, undefined);

  return (
    <div className="flex flex-col gap-6">
      <AuthTabs active="signUp" suivant={suivant} />
      <FormMessage error={urlError(erreur)} />
      <GoogleButton suivant={suivant} />
      <Separator />

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
      </form>
    </div>
  );
}

// ==================== MOT DE PASSE ====================

/** Demande de lien de réinitialisation. */
export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">{t.auth.forgot.intro}</p>
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
