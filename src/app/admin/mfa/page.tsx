/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Vérification en deux étapes de l'administrateur (/admin/mfa).
 *               Réservée aux comptes administrateurs ; déjà en aal2 → /admin.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/auth/dal.ts, components/admin/mfa-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MfaForm } from "@/components/admin/mfa-form";
import { getDictionary } from "@/i18n";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: t.admin.mfa.title };

/** Contrôle d'accès puis affichage du formulaire TOTP. */
async function GuardedMfa() {
  const user = await requireUser("/admin/mfa");
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) redirect("/");
  if (user.aal === "aal2") redirect("/admin");
  return <MfaForm />;
}

export default function MfaPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h1 className="mb-6 font-serif text-2xl font-semibold">{t.admin.mfa.title}</h1>
        <Suspense>
          <GuardedMfa />
        </Suspense>
      </div>
    </main>
  );
}
