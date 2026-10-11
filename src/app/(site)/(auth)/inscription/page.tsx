/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Page de création de compte (/inscription).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-11
 *  Dépendances: components/auth/auth-pages.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { SignUpPageContent } from "@/components/auth/auth-pages";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signUp.title };

export default function SignUpPage({ searchParams }: PageProps<"/inscription">) {
  return <SignUpPageContent searchParams={searchParams} />;
}
