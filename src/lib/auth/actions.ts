/**
 * =============================================================
 *  Fichier    : actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur d'authentification (formulaires via useActionState) :
 *               connexion, lien magique, Google, inscription, mot de passe oublié,
 *               nouveau mot de passe, déconnexion.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/supabase/server.ts, lib/auth/routes.ts, i18n
 * =============================================================
 */

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import { safeNextPath } from "@/lib/auth/routes";
import { APP_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

/** État renvoyé aux formulaires. */
export type FormState = { error?: string; message?: string } | undefined;

const t = getDictionary();
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==================== FONCTIONS UTILITAIRES ====================

/** Lit un champ texte d'un formulaire (chaîne vide si absent). */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Origine du site pour les liens envoyés par courriel (dev local ou production).
 * L'en-tête Origin est toujours présent sur l'appel d'une action serveur.
 */
async function getOrigin(): Promise<string> {
  const origin = (await headers()).get("origin");
  return origin ?? APP_URL;
}

/** Construit l'URL de retour /auth/callback avec la page à rouvrir ensuite. */
async function callbackUrl(next: string): Promise<string> {
  return `${await getOrigin()}/auth/callback?suivant=${encodeURIComponent(next)}`;
}

/**
 * Traduit un code d'erreur Supabase Auth en message lisible.
 * @param code - Code renvoyé par Supabase (ex. « invalid_credentials »)
 */
function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return t.auth.errors.invalidCredentials;
    case "email_not_confirmed":
      return t.auth.errors.emailNotConfirmed;
    case "weak_password":
      return t.auth.errors.weakPassword;
    case "email_address_invalid":
    case "validation_failed":
      return t.auth.errors.invalidEmail;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return t.auth.errors.rateLimited;
    default:
      return t.auth.errors.generic;
  }
}

/** Valide adresse et mot de passe ; retourne un message d'erreur ou null. */
function validateCredentials(email: string, password: string | null): string | null {
  if (!EMAIL_PATTERN.test(email)) return t.auth.errors.invalidEmail;
  if (password !== null && password.length < MIN_PASSWORD_LENGTH) {
    return t.auth.errors.weakPassword;
  }
  return null;
}

// ==================== CONNEXION ====================

/** Connexion par adresse et mot de passe. */
export async function signInWithPassword(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email");
  const password = formData.get("password");
  const next = safeNextPath(field(formData, "suivant"));
  if (typeof password !== "string" || !EMAIL_PATTERN.test(email) || !password) {
    return { error: t.auth.errors.invalidCredentials };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error.code) };

  redirect(next);
}

/** Envoi d'un lien de connexion (sans mot de passe). */
export async function signInWithMagicLink(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email");
  const next = safeNextPath(field(formData, "suivant"));
  const invalid = validateCredentials(email, null);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(next), shouldCreateUser: true },
  });
  if (error) return { error: authErrorMessage(error.code) };

  return { message: t.auth.magicLinkSent };
}

/** Connexion avec Google (redirection vers le fournisseur). */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(field(formData, "suivant"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error || !data.url) redirect("/connexion?erreur=oauth");

  redirect(data.url);
}

// ==================== INSCRIPTION ====================

/** Création de compte par adresse et mot de passe (confirmation par courriel). */
export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  const displayName = field(formData, "display_name").slice(0, 120);
  const invalid = validateCredentials(email, password);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await callbackUrl("/compte"),
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (error) return { error: authErrorMessage(error.code) };

  // Confirmation par courriel désactivée : la session est déjà ouverte
  if (data.session) redirect("/compte");

  return { message: t.auth.signUp.checkEmail };
}

// ==================== MOT DE PASSE ====================

/** Demande d'un lien de réinitialisation. Réponse identique que le compte existe ou non. */
export async function requestPasswordReset(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email");
  const invalid = validateCredentials(email, null);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await callbackUrl("/reinitialiser-mot-de-passe"),
  });
  if (error?.code === "over_email_send_rate_limit") return { error: t.auth.errors.rateLimited };

  return { message: t.auth.forgot.sent };
}

/** Enregistre un nouveau mot de passe (session ouverte par le lien reçu). */
export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return { error: t.auth.errors.weakPassword };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error.code) };

  redirect("/compte");
}

// ==================== DÉCONNEXION ====================

/** Ferme la session et revient à l'accueil. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
