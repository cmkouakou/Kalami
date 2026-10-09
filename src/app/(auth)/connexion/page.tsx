/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Page de connexion (/connexion).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: components/auth/auth-forms.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signIn.title };

export default function SignInPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <>
      <h1 className="sr-only">{t.auth.signIn.title}</h1>
      {/* Les paramètres d'URL sont dynamiques : lus dans une zone Suspense */}
      <Suspense>
        <SignInForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}
