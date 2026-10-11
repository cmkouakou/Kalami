/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Nouveau mot de passe dans Kalami Stratégie
 *               (/strategie/reinitialiser-mot-de-passe).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { ResetPasswordPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.reset.title };

export default function StrategyResetPasswordPage({ searchParams }: PageProps<"/strategie/reinitialiser-mot-de-passe">) {
  return <ResetPasswordPageContent searchParams={searchParams} defaultNext="/strategie" />;
}
