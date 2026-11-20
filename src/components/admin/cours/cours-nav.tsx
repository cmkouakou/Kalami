/**
 * =============================================================
 *  Fichier    : cours-nav.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: En-tête commun aux pages d'administration du cours (v0.29.0) : titre,
 *               lien de retour et pastilles vers les quatre rubriques.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: i18n/course.ts
 * =============================================================
 */

import Link from "next/link";

import { PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";

const a = getCourseDictionary().admin;

/** Rubriques de l'administration du cours. */
export const RUBRIQUES = [
  { cle: "apprenants", href: "/admin/cours/apprenants" },
  { cle: "cohortes", href: "/admin/cours/cohortes" },
  { cle: "suivi", href: "/admin/cours/suivi" },
  { cle: "prix", href: "/admin/cours/prix" },
] as const;

export type Rubrique = (typeof RUBRIQUES)[number]["cle"];

/**
 * En-tête de rubrique.
 * @param actif - Rubrique affichée (aucune sur l'accueil)
 * @param titre - Titre de la page
 */
export function CoursNav({
  actif,
  titre,
}: {
  actif?: Rubrique;
  titre: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {actif && (
        <Link href="/admin/cours" className="text-sm text-encre underline">
          ← {a.retour}
        </Link>
      )}
      <h1 className="font-serif text-3xl font-semibold">{titre}</h1>
      <nav aria-label={a.titre} className="flex flex-wrap gap-2">
        {RUBRIQUES.map((r) => (
          <Link
            key={r.cle}
            href={r.href}
            aria-current={r.cle === actif ? "page" : undefined}
            className={r.cle === actif ? PILL_ACTIVE : PILL}
          >
            {a.nav[r.cle]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
