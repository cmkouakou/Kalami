/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Création de compte depuis Kalami Stratégie (/strategie/inscription) : le
 *               lien de confirmation ramène à l'application.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { SignUpPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signUp.title };

export default function StrategySignUpPage({ searchParams }: PageProps<"/strategie/inscription">) {
  return <SignUpPageContent searchParams={searchParams} defaultNext="/strategie" />;
}
