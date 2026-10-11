/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Connexion à Kalami Stratégie (/strategie/connexion) : retour à
 *               l'application, jamais à la librairie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { SignInPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signIn.title };

export default function StrategySignInPage({ searchParams }: PageProps<"/strategie/connexion">) {
  return <SignInPageContent searchParams={searchParams} defaultNext="/strategie" />;
}
