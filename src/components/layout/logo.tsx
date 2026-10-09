/**
 * =============================================================
 *  Fichier    : logo.tsx
 *  Projet     : Kalami
 *  Description: Logo Kalami en lien vers l'accueil : version normale sur fond clair,
 *               version inverse en thème Nuit (bascule par CSS, sans JavaScript).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: public/brand/kalami-logo*.svg, globals.css (.logo-normal / .logo-inverse)
 * =============================================================
 */

import Image from "next/image";
import Link from "next/link";

import { getDictionary } from "@/i18n";

const t = getDictionary();

/** Proportions du fichier source (211 × 64). */
const RATIO = 211 / 64;

/**
 * Logo cliquable.
 * @param height - Hauteur en pixels (36 dans l'en-tête ; largeur minimale 96 px)
 */
export function Logo({ height = 36 }: { height?: number }) {
  const width = Math.max(96, Math.round(height * RATIO));
  return (
    <Link href="/" aria-label={t.nav.home} className="inline-flex shrink-0 items-center">
      <Image
        src="/brand/kalami-logo.svg"
        alt=""
        width={width}
        height={height}
        priority
        className="logo-normal"
      />
      <Image
        src="/brand/kalami-logo-inverse.svg"
        alt=""
        width={width}
        height={height}
        className="logo-inverse"
      />
    </Link>
  );
}
