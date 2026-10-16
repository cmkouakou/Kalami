/**
 * =============================================================
 *  Fichier    : manual-links.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Liens d'invitation à transmettre soi-même quand le courriel n'est pas parti
 *               (S10a) : un champ à copier par adresse.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/strategy/team/invite-link.tsx
 * =============================================================
 */

"use client";

import { InviteLink } from "@/components/strategy/team/invite-link";
import { getDictionary } from "@/i18n";
import type { ManualLink } from "@/lib/strategy/class-actions";

const cl = getDictionary().strategy.classes;

/** Liste des liens à transmettre, avec bouton de copie. */
export function ManualLinks({ links }: { links: ManualLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-small">{cl.invite.notSent}</p>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.email} className="flex flex-col gap-1">
            <span className="break-all text-small font-medium">{link.email}</span>
            <InviteLink link={link.url} />
          </li>
        ))}
      </ul>
    </div>
  );
}
