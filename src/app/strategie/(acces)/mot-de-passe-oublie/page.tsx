/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Mot de passe oublié dans Kalami Stratégie (/strategie/mot-de-passe-oublie).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { ForgotPasswordPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.forgot.title };

export default function StrategyForgotPasswordPage({ searchParams }: PageProps<"/strategie/mot-de-passe-oublie">) {
  return <ForgotPasswordPageContent searchParams={searchParams} defaultNext="/strategie" />;
}
