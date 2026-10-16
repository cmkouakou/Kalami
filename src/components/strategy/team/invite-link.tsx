/**
 * =============================================================
 *  Fichier    : invite-link.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Lien d'invitation à transmettre soi-même quand le courriel n'a pas pu
 *               partir (S9a) : champ en lecture seule et bouton « Copier le lien ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: i18n
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";

const tm = getDictionary().strategy.team;

/** Lien d'invitation avec bouton de copie. */
export function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  /** Copie le lien dans le presse-papiers (le champ reste sélectionnable sinon). */
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        readOnly
        value={link}
        aria-label={tm.invite.copy}
        onFocus={(event) => event.currentTarget.select()}
        className="min-h-11 w-full min-w-0 rounded-md border border-line bg-sand px-3
          text-small"
      />
      <button type="button" className={`${BUTTON_SECONDARY} shrink-0`} onClick={copy}>
        {copied ? tm.invite.copied : tm.invite.copy}
      </button>
    </div>
  );
}
