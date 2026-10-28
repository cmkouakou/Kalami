/**
 * =============================================================
 *  Fichier    : layout.tsx (admin/(espace))
 *  Projet     : Kalami
 *  Description: Cadre commun des pages d'administration : menu regroupé par thème (colonne
 *               latérale, repliable sur téléphone) et pastilles « à traiter ».
 *               Aucun contrôle d'accès ici (un layout ne se ré-exécute pas à chaque
 *               navigation) : chaque page appelle requireAdmin() elle-même. Les pastilles
 *               ne sont lues que pour un administrateur aal2 (RLS en plus).
 *  Auteur     : Claude Marcel
 *  Version    : 2.0 (menu regroupé, v0.16.0)
 *  Date       : 2026-10-28
 *  Dépendances: components/admin/admin-nav.tsx, lib/admin, lib/auth/dal.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";

import { AdminNav, type AdminNavBadges } from "@/components/admin/admin-nav";
import { getDictionary } from "@/i18n";
import { getDashboardCounts } from "@/lib/admin/catalog-queries";
import { getDashboardTodo } from "@/lib/admin/dashboard-queries";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = {
  title: { default: t.admin.title, template: `%s · ${t.admin.title}` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[14rem_1fr]">
      {/* Le menu lit l'adresse courante : il attend donc dans une limite Suspense */}
      <Suspense fallback={<div aria-hidden="true" className="h-11 lg:h-96" />}>
        <Suspense fallback={<AdminNav />}>
          <NavWithBadges />
        </Suspense>
      </Suspense>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Menu avec ses compteurs ; sans compteur si l'utilisateur n'est pas administrateur aal2. */
async function NavWithBadges() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user || !profile?.is_admin || user.aal !== "aal2") return <AdminNav />;

  return <AdminNav badges={await readBadges()} />;
}

/** Compteurs « à traiter » ; vides si une lecture échoue (l'administration reste utilisable). */
async function readBadges(): Promise<AdminNavBadges> {
  try {
    const [counts, todo] = await Promise.all([getDashboardCounts(), getDashboardTodo()]);
    return {
      submissions: counts.submissions,
      mobileMoney: todo.mobileMoneyToReview,
      payouts: todo.payoutsOpen,
    };
  } catch {
    return {};
  }
}
