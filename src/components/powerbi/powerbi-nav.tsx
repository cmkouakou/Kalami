/**
 * =============================================================
 *  Fichier    : powerbi-nav.tsx
 *  Projet     : Kalami Données
 *  Description: Liens entre les deux sections de l'espace — le parcours PL-300 et le
 *               chantier BRVM — avec la section courante marquée (aria-current).
 *               v1.1 (v0.21.0) : onglets de la charte powerbi4you (powerbi.css).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: lib/auth/routes.ts, i18n
 * =============================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getPowerbiDictionary } from "@/i18n/powerbi";
import { CHANTIER_HOME, POWERBI_HOME } from "@/lib/auth/routes";

const d = getPowerbiDictionary();

/** Navigation principale de l'espace. */
export function PowerbiNav() {
  const chemin = usePathname();
  const dansChantier = chemin === CHANTIER_HOME || chemin.startsWith(`${CHANTIER_HOME}/`);
  const liens = [
    { href: POWERBI_HOME, texte: d.nav.home, actif: !dansChantier },
    { href: CHANTIER_HOME, texte: d.nav.workshop, actif: dansChantier },
  ];

  return (
    <ul aria-label={d.nav.principale} className="onglets">
      {liens.map((lien) => (
        <li key={lien.href}>
          <Link
            href={lien.href}
            aria-current={lien.actif ? "page" : undefined}
          >
            {lien.texte}
          </Link>
        </li>
      ))}
    </ul>
  );
}
