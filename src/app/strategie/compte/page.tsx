/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/compte)
 *  Projet     : Kalami Stratégie
 *  Description: Compte de l'utilisateur dans Kalami Stratégie : données personnelles
 *               (export JSON) et suppression du compte, avec l'habillage de l'application.
 *               Le profil complet reste sur /compte (librairie).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/account/privacy-sections.tsx, lib/auth/dal.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AccountDeletionSection,
  AccountPrivacySection,
} from "@/components/account/privacy-sections";
import { getDictionary } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";

const t = getDictionary();
const PATH = "/strategie/compte";

export const metadata: Metadata = { title: t.account.title };

export default function StrategyAccountPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StrategyAccount />
    </Suspense>
  );
}

/** Contenu privé : lu dans une zone Suspense (cookies de session). */
async function StrategyAccount() {
  const user = await requireUser(PATH);

  return (
    <main id="contenu" className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-h1 font-semibold">{t.account.title}</h1>
        {user.email && <p className="text-sm text-ink-muted">{user.email}</p>}
      </div>
      <AccountPrivacySection space="strategy" />
      <AccountDeletionSection userId={user.id} />
    </main>
  );
}
