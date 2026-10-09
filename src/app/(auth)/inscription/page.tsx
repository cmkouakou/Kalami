/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Page de création de compte (/inscription).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: components/auth/auth-forms.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = { title: t.auth.signUp.title };

export default function SignUpPage({ searchParams }: PageProps<"/inscription">) {
  return (
    <>
      <h1 className="sr-only">{t.auth.signUp.title}</h1>
      {/* Les paramètres d'URL sont dynamiques : lus dans une zone Suspense */}
      <Suspense>
        <SignUpForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}
