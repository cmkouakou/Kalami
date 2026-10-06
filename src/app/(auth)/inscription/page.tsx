/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Page de création de compte (/inscription).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: components/auth/auth-forms.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signUp.title };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-semibold">{t.auth.signUp.title}</h1>
      <SignUpForm />
    </>
  );
}
