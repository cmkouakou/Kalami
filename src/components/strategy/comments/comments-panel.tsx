/**
 * =============================================================
 *  Fichier    : comments-panel.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Discussion d'une étape (S9b) : nouveau fil sur toute l'étape ou sur
 *               l'élément choisi par sa pastille, fils en cours (filtrés sur l'élément
 *               choisi), fils résolus repliés. Une ancre « #commentaire-{id} » qui vise un
 *               fil résolu ouvre ce volet avant le défilement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: comments-context.tsx, comment-thread.tsx, comment-form.tsx
 * =============================================================
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { CommentForm } from "@/components/strategy/comments/comment-form";
import {
  COMMENT_INPUT_ID,
  COMMENTS_ANCHOR,
  useComments,
} from "@/components/strategy/comments/comments-context";
import {
  CommentThreadView,
  type ThreadContext,
} from "@/components/strategy/comments/comment-thread";
import { IconMessage } from "@/components/ui/icons";
import { BADGE, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { type CommentThread, groupThreads, type StepComment } from "@/lib/strategy/comments";
import { addComment } from "@/lib/strategy/comments-actions";

const cm = getDictionary().strategy.comments;

/** Préfixe des ancres de commentaire (liens des notifications et des courriels). */
const COMMENT_HASH = "#commentaire-";

// ==================== FONCTIONS UTILITAIRES ====================

/** Vrai si le fil contient le commentaire visé par l'identifiant. */
function threadHas(thread: CommentThread, id: string): boolean {
  return thread.root.id === id || thread.replies.some((reply) => reply.id === id);
}

// ==================== COMPOSANT ====================

/**
 * Section « Discussion » d'une étape.
 * @param comments - Commentaires de l'étape (strategy_step_comments)
 * @param context  - Étude, étape, utilisateur et membres
 */
export function CommentsPanel({
  comments,
  context,
}: {
  comments: StepComment[];
  context: ThreadContext;
}) {
  const discussion = useComments();
  const resolvedBox = useRef<HTMLDetailsElement>(null);
  const [showResolved, setShowResolved] = useState(false);
  const target = discussion?.target ?? null;

  const threads = groupThreads(comments);
  const open = threads.filter((t) => !t.root.resolved_at);
  const resolved = threads.filter((t) => t.root.resolved_at);
  const visible = target ? open.filter((t) => t.root.target_id === target.id) : open;

  // Lien vers un commentaire d'un fil résolu : ouvrir le volet, puis amener au commentaire
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith(COMMENT_HASH)) return;
    const id = hash.slice(COMMENT_HASH.length);
    const inResolved = resolved.some((thread) => threadHas(thread, id));
    if (inResolved && resolvedBox.current) resolvedBox.current.open = true;
    requestAnimationFrame(() => document.getElementById(`commentaire-${id}`)?.scrollIntoView());
    // Seulement au chargement : l'ancre ne change pas pendant la discussion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      id={COMMENTS_ANCHOR}
      aria-labelledby="commentaires-titre"
      className={`${CARD} flex scroll-mt-24 flex-col gap-4 p-4 sm:p-6`}
    >
      <header className="flex flex-col gap-1">
        <h2
          id="commentaires-titre"
          className="flex items-center gap-2 font-serif text-h3 font-semibold"
        >
          <IconMessage size={20} />
          {cm.title}
        </h2>
        <p className="text-small text-ink-muted">{cm.intro}</p>
      </header>

      {/* ==================== NOUVEAU FIL ==================== */}
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-small">
          {cm.about}
          <span className={BADGE}>{target?.label ?? cm.wholeStep}</span>
          {target && discussion && (
            <button
              type="button"
              className={BUTTON_TERTIARY}
              onClick={() => discussion.select(null)}
            >
              {cm.clearTarget}
            </button>
          )}
        </p>
        <CommentForm
          members={context.mentionable}
          placeholder={cm.placeholder}
          submitLabel={cm.submit}
          inputId={COMMENT_INPUT_ID}
          onSubmit={async (body) => {
            const result = await addComment(
              context.studyId,
              context.stepNo,
              "",
              target?.id ?? "",
              body,
            );
            return result.error;
          }}
        />
      </div>

      {/* ==================== FILS EN COURS ==================== */}
      {target && (
        <p className="text-small text-ink-muted" role="status">
          {interpolate(cm.filtered, { label: target.label })}{" "}
          <button
            type="button"
            className={BUTTON_TERTIARY}
            onClick={() => discussion?.select(null)}
          >
            {cm.showAll}
          </button>
        </p>
      )}
      {visible.length === 0 ? (
        <p className="text-small text-ink-muted">{target ? cm.noneForTarget : cm.none}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((thread) => (
            <li key={thread.root.id}>
              <CommentThreadView thread={thread} context={context} />
            </li>
          ))}
        </ul>
      )}

      {/* ==================== FILS RÉSOLUS ==================== */}
      {resolved.length > 0 && (
        <details
          ref={resolvedBox}
          className="flex flex-col gap-3"
          onToggle={(event) => setShowResolved(event.currentTarget.open)}
        >
          <summary className={`${BUTTON_TERTIARY} cursor-pointer`}>
            {interpolate(showResolved ? cm.hideResolved : cm.showResolved, {
              count: String(resolved.length),
            })}
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {resolved.map((thread) => (
              <li key={thread.root.id}>
                <CommentThreadView thread={thread} context={context} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
