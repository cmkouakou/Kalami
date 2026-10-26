/**
 * =============================================================
 *  Fichier    : workshop-listing.tsx
 *  Projet     : Kalami
 *  Description: Fiche du livre proposée par Claude dans l'atelier (v0.15.2) : résumé,
 *               accroche, mots-clés, biographie et titres, chacun avec la valeur actuelle
 *               et un bouton « Utiliser » (l'accroche, sans champ dans la fiche, se copie).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/actions.ts, lib/author/workshop/listing.ts
 * =============================================================
 */

"use client";

import { useState, useTransition, type ReactNode } from "react";

import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { applyListingField } from "@/lib/author/workshop/actions";
import type { Listing, ListingField } from "@/lib/author/workshop/listing";

const l = getDictionary().workshop.listing;

/** Valeurs actuelles de la fiche et du profil, pour comparaison. */
export type ListingCurrent = {
  title: string;
  subtitle: string | null;
  summary: string | null;
  keywords: string | null;
  bio: string | null;
};

type WorkshopListingProps = {
  requestId: string;
  listing: Listing;
  decisions: Record<string, string>;
  current: ListingCurrent;
  /** Fiche verrouillée (validation ou publication) : seule la biographie se reprend */
  locked: boolean;
};

// ==================== BLOC D'UNE PROPOSITION ====================

/** Titre de section, proposition, valeur actuelle et action. */
function Proposal({
  heading,
  current,
  action,
  children,
}: {
  heading: string;
  current?: string | null;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{heading}</h3>
        {action}
      </div>
      {children}
      {current && (
        <p className="text-small text-ink-muted">{interpolate(l.current, { value: current })}</p>
      )}
    </section>
  );
}

// ==================== COMPOSANT ====================

/** Propositions de la dernière fiche, avec reprise d'un clic. */
export function WorkshopListing({
  requestId,
  listing,
  decisions: initial,
  current,
  locked,
}: WorkshopListingProps) {
  const [decisions, setDecisions] = useState(initial);
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const [copied, setCopied] = useState(false);
  const [busy, startTransition] = useTransition();

  /**
   * Reprend une proposition dans la fiche ou le profil.
   * @param field      - Champ repris
   * @param titleIndex - Indice du titre (champ « title »)
   */
  const apply = (field: ListingField, titleIndex = 0) => {
    setFeedback({});
    startTransition(async () => {
      const result = await applyListingField(requestId, field, titleIndex);
      if (!result.ok) {
        setFeedback({ error: result.error });
        return;
      }
      const key = field === "title" ? `title:${titleIndex}` : field;
      setDecisions((previous) => ({ ...previous, [key]: "accepted" }));
      setFeedback({ message: result.message });
    });
  };

  /** Copie l'accroche dans le presse-papiers. */
  const copyHook = async () => {
    try {
      await navigator.clipboard.writeText(listing.hook);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  /** Bouton « Utiliser », ou badge si la proposition a déjà été reprise. */
  const applyButton = (field: ListingField, titleIndex = 0) => {
    const key = field === "title" ? `title:${titleIndex}` : field;
    if (decisions[key] === "accepted") return <span className={BADGE}>{l.used}</span>;
    if (locked && field !== "bio") return null;
    return (
      <button
        type="button"
        onClick={() => apply(field, titleIndex)}
        disabled={busy}
        className={BUTTON_SECONDARY}
      >
        {l.use}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {locked && <p className="text-sm text-ink-muted">{l.locked}</p>}
      <FormMessage error={feedback.error} message={feedback.message} />

      {listing.summary && (
        <Proposal
          heading={l.summary}
          current={current.summary}
          action={applyButton("summary")}
        >
          <p className="whitespace-pre-line text-sm">{listing.summary}</p>
        </Proposal>
      )}

      {listing.hook && (
        <Proposal
          heading={l.hook}
          action={
            <button type="button" onClick={copyHook} className={BUTTON_SECONDARY}>
              {copied ? l.copied : l.copy}
            </button>
          }
        >
          <p className="text-sm italic">{listing.hook}</p>
          <p className="text-small text-ink-muted">{l.hookHelp}</p>
        </Proposal>
      )}

      {listing.keywords.length > 0 && (
        <Proposal
          heading={l.keywords}
          current={current.keywords}
          action={applyButton("keywords")}
        >
          <ul className="flex flex-wrap gap-2 text-sm">
            {listing.keywords.map((keyword) => (
              <li key={keyword} className="rounded bg-sand px-2 py-1">{keyword}</li>
            ))}
          </ul>
        </Proposal>
      )}

      <Proposal
        heading={l.bio}
        current={current.bio}
        action={listing.bio ? applyButton("bio") : null}
      >
        <p className="whitespace-pre-line text-sm">{listing.bio || l.noBio}</p>
      </Proposal>

      {listing.titles.length > 0 && (
        <Proposal
          heading={l.titles}
          current={current.subtitle ? `${current.title} — ${current.subtitle}` : current.title}
          action={null}
        >
          <ul className="flex flex-col gap-2 text-sm">
            {listing.titles.map((entry, index) => (
              <li
                key={`${entry.title}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  <strong>{entry.title}</strong>
                  {entry.subtitle && <span className="text-ink-muted"> — {entry.subtitle}</span>}
                </span>
                {applyButton("title", index)}
              </li>
            ))}
          </ul>
        </Proposal>
      )}
    </div>
  );
}
