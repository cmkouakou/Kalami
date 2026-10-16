/**
 * =============================================================
 *  Fichier    : consent-banner.tsx
 *  Projet     : Kalami
 *  Description: Bandeau des témoins (Loi 25 / RGPD) : « Accepter » ou « Refuser », choix
 *               consigné au registre. Affiché tant qu'aucun choix n'est fait pour la
 *               version courante ; rouvert par le lien « Gérer les témoins ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/legal/consent.ts, lib/legal/actions.ts
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { recordConsent } from "@/lib/legal/actions";
import {
  needsConsent,
  OPEN_CONSENT_EVENT,
  readConsentFromCookies,
  type ConsentChoice,
} from "@/lib/legal/consent";
import { legalPath, type LegalSpace } from "@/lib/legal/kinds";

const t = getDictionary();
const c = t.legal.consent;

/** Bandeau fixé en bas de l'écran, non bloquant. */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [space, setSpace] = useState<LegalSpace>("site");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  // Le témoin n'est lisible qu'après le montage (rendu serveur identique pour tous)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- lecture unique du témoin et de l espace */
    setOpen(needsConsent(readConsentFromCookies(document.cookie)));
    setSpace(window.location.pathname.startsWith("/strategie") ? "strategy" : "site");
    /* eslint-enable react-hooks/set-state-in-effect */
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  /** Enregistre le choix puis ferme le bandeau. */
  function choose(choice: ConsentChoice) {
    setError(false);
    startTransition(async () => {
      const result = await recordConsent(choice);
      if (result.ok) setOpen(false);
      else setError(true);
    });
  }

  return (
    <section
      role="region"
      aria-labelledby="bandeau-temoins-titre"
      className={
        "fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface shadow-lg print:hidden"
      }
    >
      <div
        className={
          "mx-auto flex w-full max-w-content flex-col gap-3 px-4 py-4 " +
          "sm:flex-row sm:items-center sm:gap-6 sm:px-6"
        }
      >
        <div className="flex flex-col gap-1 text-sm">
          <h2 id="bandeau-temoins-titre" className="font-semibold">
            {c.title}
          </h2>
          <p className="text-ink-muted">
            {c.text}{" "}
            <Link href={legalPath("privacy", space)} className="text-encre underline">
              {c.more}
            </Link>
          </p>
          {error && <FormMessage error={c.error} />}
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            className={BUTTON_SECONDARY}
            disabled={pending}
            onClick={() => choose("refused")}
          >
            {c.refuse}
          </button>
          <button
            type="button"
            className={BUTTON_PRIMARY}
            disabled={pending}
            onClick={() => choose("accepted")}
          >
            {c.accept}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Lien de pied de page qui rouvre le bandeau. */
export function ManageConsentButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      {c.manage}
    </button>
  );
}
