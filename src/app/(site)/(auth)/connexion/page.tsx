/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Page de connexion (/connexion).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { SignInPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signIn.title };

export default function SignInPage({ searchParams }: PageProps<"/connexion">) {
  return <SignInPageContent searchParams={searchParams} />;
}
