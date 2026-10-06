/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Demande de réinitialisation du mot de passe (/mot-de-passe-oublie).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: components/auth/auth-forms.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.forgot.title };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-semibold">{t.auth.forgot.title}</h1>
      <ForgotPasswordForm />
    </>
  );
}
