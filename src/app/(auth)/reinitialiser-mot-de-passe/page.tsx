/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Saisie du nouveau mot de passe (/reinitialiser-mot-de-passe). Accessible
 *               uniquement avec la session ouverte par le lien reçu par courriel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: components/auth/auth-forms.tsx, lib/auth/dal.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.reset.title };

/** Vérifie la session (lien de réinitialisation) avant d'afficher le formulaire. */
async function GuardedResetForm() {
  await requireUser("/mot-de-passe-oublie");
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-semibold">{t.auth.reset.title}</h1>
      <Suspense>
        <GuardedResetForm />
      </Suspense>
    </>
  );
}
