/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Saisie du nouveau mot de passe (/reinitialiser-mot-de-passe), avec la session
 *               ouverte par le lien reçu par courriel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { ResetPasswordPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.reset.title };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reinitialiser-mot-de-passe">) {
  return <ResetPasswordPageContent searchParams={searchParams} />;
}
