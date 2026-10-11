/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Espace « Mon compte » (/compte) : profil, accès à l'espace auteur (ou
 *               invitation à le devenir), administration et déconnexion.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, components/account/profile-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProfileForm } from "@/components/account/profile-form";
import { SubmitButton } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { signOut } from "@/lib/auth/actions";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { getAuthorContext } from "@/lib/author/queries";

const t = getDictionary();

export const metadata: Metadata = { title: t.account.title };

/** Contenu privé : lu dans une zone Suspense (cookies de session). */
async function AccountContent() {
  const user = await requireUser("/compte");
  const [profile, { author }] = await Promise.all([
    getCurrentProfile(),
    getAuthorContext("/compte"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-line bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">{t.account.profile}</h2>
        <p className="mb-4 text-sm text-ink-muted">{user.email}</p>
        <ProfileForm
          displayName={profile?.display_name ?? null}
          preferredCurrency={profile?.preferred_currency ?? null}
        />
      </section>

      {/* ==================== ESPACE AUTEUR ==================== */}
      <section className="rounded-lg border border-line bg-surface p-6">
        {author ? (
          <Link href="/auteur" className="text-encre underline">
            {t.account.authorLink}
          </Link>
        ) : (
          <>
            <p className="mb-2 text-sm text-ink-muted">{t.account.becomeAuthorHelp}</p>
            <Link href="/auteur/inscription" className="text-encre underline">
              {t.account.becomeAuthor}
            </Link>
          </>
        )}
      </section>

      {profile?.is_admin && (
        <Link href="/admin" className="text-encre underline">
          {t.account.adminLink}
        </Link>
      )}

      <form action={signOut} className="max-w-xs">
        <SubmitButton variant="secondary">{t.auth.signOut}</SubmitButton>
      </form>
    </div>
  );
}

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-semibold">{t.account.title}</h1>
      <Suspense>
        <AccountContent />
      </Suspense>
    </main>
  );
}
