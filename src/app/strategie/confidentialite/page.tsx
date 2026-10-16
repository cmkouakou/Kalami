/**
 * =============================================================
 *  Fichier    : page.tsx (/strategie/confidentialite)
 *  Projet     : Kalami Stratégie
 *  Description: Politique de confidentialité, version en vigueur (texte administrable).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/legal/legal-page.tsx
 * =============================================================
 */

import { LegalPage, legalMetadata } from "@/components/legal/legal-page";

export const metadata = legalMetadata("privacy");

export default function Page() {
  return <LegalPage kind="privacy" />;
}
