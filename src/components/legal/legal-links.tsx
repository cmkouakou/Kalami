/**
 * =============================================================
 *  Fichier    : legal-links.tsx
 *  Projet     : Kalami
 *  Description: Liens légaux des pieds de page (confidentialité, conditions, témoins),
 *               vers les pages de l'espace courant : librairie ou Kalami Stratégie. Mention
 *               d'acceptation sous le formulaire d'inscription.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/legal/kinds.ts, components/legal/consent-banner.tsx
 * =============================================================
 */

import Link from "next/link";

import { getDictionary } from "@/i18n";
import { LEGAL_KINDS, legalPath, type LegalSpace } from "@/lib/legal/kinds";

import { ManageConsentButton } from "./consent-banner";

const t = getDictionary();

/** Liste de liens ; chaque élément reçoit la même classe. */
export function LegalLinks({ space, linkClassName }: { space: LegalSpace; linkClassName: string }) {
  return (
    <>
      {LEGAL_KINDS.map((kind) => (
        <Link key={kind} href={legalPath(kind, space)} className={linkClassName}>
          {t.legal.kinds[kind]}
        </Link>
      ))}
      <ManageConsentButton className={`text-left ${linkClassName}`} />
    </>
  );
}

/** Mention sous le formulaire d'inscription, avec les liens vers les textes de l'espace. */
export function SignUpLegalNotice({ space }: { space: LegalSpace }) {
  const links: Record<string, { kind: "terms" | "privacy"; label: string }> = {
    terms: { kind: "terms", label: t.legal.signupTerms },
    privacy: { kind: "privacy", label: t.legal.signupPrivacy },
  };
  // « {terms} » et « {privacy} » deviennent des liens ; le reste du texte est conservé
  const parts = t.legal.signupNotice.split(/(\{terms\}|\{privacy\})/);

  return (
    <p className="mt-4 text-small text-ink-muted">
      {parts.map((part, index) => {
        const link = links[part.slice(1, -1)];
        if (!part.startsWith("{") || !link) return part;
        return (
          <Link key={index} href={legalPath(link.kind, space)} className="text-encre underline">
            {link.label}
          </Link>
        );
      })}
    </p>
  );
}
