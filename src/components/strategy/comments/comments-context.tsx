/**
 * =============================================================
 *  Fichier    : comments-context.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Contexte de la discussion d'une étape (S9b) : nombre de commentaires en
 *               cours par élément, libellés des éléments enregistrés et élément choisi pour
 *               commenter. La pastille CommentBadge, placée sur chaque élément d'un gabarit,
 *               ouvre la discussion sur cet élément ; sans fournisseur (étape verrouillée,
 *               discussion indisponible), elle n'affiche rien. S9c : elle porte le repère
 *               de l'élément (présence) et l'indicateur « X modifie cet élément ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/comments.ts
 * =============================================================
 */

"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { ElementEditors } from "@/components/strategy/presence/element-editors";
import { ELEMENT_ATTRIBUTE } from "@/components/strategy/presence/presence-context";
import { IconMessage } from "@/components/ui/icons";
import { getDictionary, interpolate } from "@/i18n";
import type { CommentTarget } from "@/lib/strategy/comments";

const cm = getDictionary().strategy.comments;

/** Identifiant de la section de discussion et de sa zone de saisie (ancres). */
export const COMMENTS_ANCHOR = "commentaires";
export const COMMENT_INPUT_ID = "commentaire-texte";

type CommentsContextValue = {
  counts: Record<string, number>;
  labels: Record<string, string>;
  target: CommentTarget | null;
  /** Choisit l'élément à commenter (null : toute l'étape) et amène à la discussion. */
  select: (target: CommentTarget | null) => void;
};

const CommentsContext = createContext<CommentsContextValue | null>(null);

// ==================== FOURNISSEUR ====================

/**
 * Fournit la discussion d'une étape aux gabarits qu'il enveloppe.
 * @param counts - Commentaires en cours par élément (countByTarget)
 * @param labels - Libellés des éléments enregistrés (commentTargets)
 */
export function CommentsProvider({
  counts,
  labels,
  children,
}: {
  counts: Record<string, number>;
  labels: Record<string, string>;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<CommentTarget | null>(null);

  const value = useMemo<CommentsContextValue>(() => ({
    counts,
    labels,
    target,
    select: (next) => {
      setTarget(next);
      if (!next) return;
      document.getElementById(COMMENTS_ANCHOR)?.scrollIntoView({ behavior: "smooth" });
      document.getElementById(COMMENT_INPUT_ID)?.focus({ preventScroll: true });
    },
  }), [counts, labels, target]);

  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>;
}

/** Contexte de la discussion, ou null hors fournisseur. */
export function useComments(): CommentsContextValue | null {
  return useContext(CommentsContext);
}

// ==================== PASTILLE ====================

/**
 * Pastille « commenter » d'un élément, avec le nombre de commentaires en cours.
 * @param targetId - Identifiant de l'élément dans le gabarit
 * @param label    - Libellé de secours (élément pas encore enregistré)
 */
export function CommentBadge({ targetId, label }: { targetId: string; label: string }) {
  const comments = useComments();
  if (!comments) return null;
  const count = comments.counts[targetId] ?? 0;
  const name = comments.labels[targetId] ?? label;
  const active = comments.target?.id === targetId;

  return (
    <>
      <ElementEditors targetId={targetId} />
      <button
        type="button"
        {...{ [ELEMENT_ATTRIBUTE]: targetId }}
        className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1
          rounded-md px-2 text-small transition-colors duration-150 ease-kalami hover:bg-sand
          ${count > 0 || active ? "text-encre" : "text-ink-muted"}
          ${active ? "bg-encre-soft" : ""}`}
        aria-label={count > 0
          ? interpolate(cm.badgeCount, { count: String(count), label: name })
          : interpolate(cm.badgeAdd, { label: name })}
        onClick={() => comments.select({ id: targetId, label: name })}
      >
        <IconMessage size={18} />
        {count > 0 && <span className="font-semibold">{count}</span>}
      </button>
    </>
  );
}
