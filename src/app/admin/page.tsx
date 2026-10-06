/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Accueil de l'administration (/admin). Exige un administrateur en aal2.
 *               Les modules (livres, paiements Mobile Money, ventes) arrivent aux sprints
 *               suivants.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/auth/dal.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: t.admin.title };

/** Contenu protégé de l'administration. */
async function AdminHome() {
  const { profile, user } = await requireAdmin();
  return (
    <p className="text-texte-doux">
      {t.admin.welcome} ({profile.display_name ?? user.email})
    </p>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-semibold">{t.admin.title}</h1>
      <Suspense>
        <AdminHome />
      </Suspense>
    </main>
  );
}
