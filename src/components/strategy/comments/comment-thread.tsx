/**
 * =============================================================
 *  Fichier    : comment-thread.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Un fil de discussion (S9b) : premier commentaire, réponses, mentions mises
 *               en valeur. Chacun répond ; l'auteur modifie son texte ; l'auteur ou le
 *               propriétaire supprime (second clic de confirmation) et résout ou rouvre le
 *               fil. Chaque commentaire porte l'ancre « commentaire-{id} » des notifications.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/comments.ts, lib/strategy/comments-actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { CommentForm } from "@/components/strategy/comments/comment-form";
import { IconCheck } from "@/components/ui/icons";
import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import {
  type CommentThread as Thread,
  type MentionMember,
  mentionSegments,
  type StepComment,
} from "@/lib/strategy/comments";
import {
  addComment,
  deleteComment,
  editComment,
  resolveThread,
} from "@/lib/strategy/comments-actions";

const cm = getDictionary().strategy.comments;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export type ThreadContext = {
  studyId: string;
  stepNo: number;
  userId: string;
  isOwner: boolean;
  /** Tous les membres (mise en valeur des mentions). */
  members: MentionMember[];
  /** Membres que l'utilisateur peut mentionner (tous sauf lui). */
  mentionable: MentionMember[];
};

// ==================== SOUS-COMPOSANTS ====================

/** Texte d'un commentaire, mentions en gras couleur encre. */
function CommentBody({ comment, members }: { comment: StepComment; members: MentionMember[] }) {
  const mentioned = members.filter((member) => comment.mentions.includes(member.id));
  return (
    <p className="whitespace-pre-line break-words text-small">
      {mentionSegments(comment.body, mentioned).map((segment, index) =>
        segment.mention ? (
          <strong key={index} className="font-semibold text-encre">{segment.text}</strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

/** Un commentaire : auteur, date, texte et actions permises. */
function CommentItem({
  comment,
  context,
  canResolve,
  resolved,
  onReply,
}: {
  comment: StepComment;
  context: ThreadContext;
  canResolve: boolean;
  resolved: boolean;
  onReply?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const mine = comment.author_id === context.userId;
  const { studyId, stepNo } = context;

  /** Lance une action sur le commentaire et garde son résultat. */
  function act(run: () => Promise<FormState>) {
    setConfirming(false);
    startTransition(async () => {
      setState(await run());
    });
  }

  if (comment.deleted) {
    return (
      <div id={`commentaire-${comment.id}`} className="scroll-mt-24">
        <p className="text-small italic text-ink-muted">{cm.deletedBody}</p>
      </div>
    );
  }

  return (
    <div id={`commentaire-${comment.id}`} className="flex scroll-mt-24 flex-col gap-1">
      <p className="flex flex-wrap items-baseline gap-x-2 text-caption text-ink-muted">
        <span className="text-small font-semibold text-ink">
          {comment.author_name ?? cm.someone}
        </span>
        <time dateTime={comment.created_at} suppressHydrationWarning>
          {DATE_FORMAT.format(new Date(comment.created_at))}
        </time>
        {comment.edited_at && <span>({cm.edited})</span>}
      </p>

      {editing ? (
        <CommentForm
          members={context.mentionable}
          placeholder={cm.placeholder}
          submitLabel={cm.save}
          initial={comment.body}
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            const result = await editComment(studyId, stepNo, comment.id, body);
            if (result?.error) return result.error;
            setEditing(false);
            return undefined;
          }}
        />
      ) : (
        <CommentBody comment={comment} members={context.members} />
      )}

      {!editing && (
        <div className="flex flex-wrap items-center gap-x-3">
          {onReply && !resolved && (
            <button type="button" className={BUTTON_TERTIARY} onClick={onReply}>
              {cm.reply}
            </button>
          )}
          {mine && (
            <button type="button" className={BUTTON_TERTIARY} onClick={() => setEditing(true)}>
              {cm.edit}
            </button>
          )}
          {(mine || context.isOwner) && !confirming && (
            <button type="button" className={BUTTON_TERTIARY} onClick={() => setConfirming(true)}>
              {cm.delete}
            </button>
          )}
          {confirming && (
            <span className="flex flex-wrap items-center gap-x-3 text-small">
              {cm.deleteConfirm}
              <button
                type="button"
                className={`${BUTTON_TERTIARY} text-danger`}
                disabled={pending}
                onClick={() => act(() => deleteComment(studyId, stepNo, comment.id))}
              >
                {cm.delete}
              </button>
              <button
                type="button"
                className={BUTTON_TERTIARY}
                onClick={() => setConfirming(false)}
              >
                {cm.cancel}
              </button>
            </span>
          )}
          {canResolve && (
            <button
              type="button"
              className={BUTTON_TERTIARY}
              disabled={pending}
              onClick={() => act(() => resolveThread(studyId, stepNo, comment.id, !resolved))}
            >
              {resolved ? cm.reopen : cm.resolve}
            </button>
          )}
        </div>
      )}
      <FormMessage error={state?.error} />
    </div>
  );
}

// ==================== COMPOSANT ====================

/** Fil de discussion : premier commentaire, réponses et zone de réponse. */
export function CommentThreadView({ thread, context }: { thread: Thread; context: ThreadContext }) {
  const [replying, setReplying] = useState(false);
  const { root, replies } = thread;
  const resolved = Boolean(root.resolved_at);
  const canResolve = !root.deleted && (root.author_id === context.userId || context.isOwner);

  return (
    <article className="flex flex-col gap-3 rounded-md border border-line p-3">
      {(root.target_label || resolved) && (
        <div className="flex flex-wrap items-center gap-2">
          {root.target_label && <span className={BADGE}>{root.target_label}</span>}
          {resolved && (
            <span className="inline-flex items-center gap-1 text-caption text-success">
              <IconCheck size={14} />
              {interpolate(cm.resolvedBy, { name: root.resolver_name ?? cm.someone })}
            </span>
          )}
        </div>
      )}

      <CommentItem
        comment={root}
        context={context}
        canResolve={canResolve}
        resolved={resolved}
        onReply={root.deleted ? undefined : () => setReplying(true)}
      />

      {replies.length > 0 && (
        <ol className="flex flex-col gap-3 border-l-2 border-line pl-3">
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentItem
                comment={reply}
                context={context}
                canResolve={false}
                resolved={resolved}
              />
            </li>
          ))}
        </ol>
      )}

      {replying && !resolved && (
        <div className="pl-3">
          <CommentForm
            members={context.mentionable}
            placeholder={cm.replyPlaceholder}
            submitLabel={cm.reply}
            autoFocus
            onCancel={() => setReplying(false)}
            onSubmit={async (body) => {
              const result = await addComment(context.studyId, context.stepNo, root.id, "", body);
              if (result.error) return result.error;
              setReplying(false);
              return undefined;
            }}
          />
        </div>
      )}
    </article>
  );
}
