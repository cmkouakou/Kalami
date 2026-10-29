/**
 * =============================================================
 *  Fichier    : comment-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Saisie d'un commentaire, d'une réponse ou d'une modification (S9b). Taper
 *               « @ » propose les membres de l'étude (flèches, Entrée, Échap) ; Ctrl+Entrée
 *               publie. Compteur de caractères et message d'erreur annoncé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/comments.ts
 * =============================================================
 */

"use client";

import { type KeyboardEvent, useId, useRef, useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_TERTIARY, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { COMMENT_MAX, type MentionMember, mentionQuery } from "@/lib/strategy/comments";
import { getStrategyDictionary } from "@/i18n/strategy";

const cm = getStrategyDictionary().comments;

/** Nombre maximal de membres proposés après « @ ». */
const SUGGESTIONS_MAX = 6;

type CommentFormProps = {
  members: MentionMember[];
  placeholder: string;
  submitLabel: string;
  /** Publie le texte ; retourne un message d'erreur, ou rien si c'est réussi. */
  onSubmit: (body: string) => Promise<string | undefined>;
  onCancel?: () => void;
  initial?: string;
  inputId?: string;
  autoFocus?: boolean;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Membres dont le nom commence par le texte tapé (ou contient un mot qui commence par lui).
 * @param members - Membres mentionnables
 * @param query   - Texte tapé après « @ »
 */
function suggest(members: MentionMember[], query: string): MentionMember[] {
  const q = query.trim().toLowerCase();
  return members
    .filter((member) => {
      const label = member.label.toLowerCase();
      return !q || label.startsWith(q) || label.split(/\s+/).some((word) => word.startsWith(q));
    })
    .slice(0, SUGGESTIONS_MAX);
}

// ==================== COMPOSANT ====================

/** Zone de saisie d'un commentaire avec mentions. */
export function CommentForm({
  members,
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  initial = "",
  inputId,
  autoFocus = false,
}: CommentFormProps) {
  const listId = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(initial);
  const [caret, setCaret] = useState(initial.length);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const query = dismissed ? null : mentionQuery(body, caret);
  const suggestions = query ? suggest(members, query.query) : [];
  const open = suggestions.length > 0;

  /** Met à jour le texte et la position du curseur. */
  function track(element: HTMLTextAreaElement) {
    setBody(element.value);
    setCaret(element.selectionStart);
  }

  /** Remplace « @texte tapé » par la mention complète du membre choisi. */
  function insert(member: MentionMember) {
    if (!query) return;
    const mention = `@${member.label} `;
    const next = body.slice(0, query.start) + mention + body.slice(caret);
    const position = query.start + mention.length;
    setBody(next);
    setCaret(position);
    setActive(0);
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(position, position);
    });
  }

  /** Publie le commentaire, puis vide la zone si c'est réussi. */
  function submit() {
    const text = body.trim();
    if (!text || pending) return;
    setError(undefined);
    startTransition(async () => {
      const failure = await onSubmit(text);
      if (failure) {
        setError(failure);
        return;
      }
      setBody("");
      setCaret(0);
    });
  }

  /** Navigation dans les suggestions, Ctrl+Entrée pour publier. */
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + suggestions.length) % suggestions.length);
    } else if (open && (event.key === "Enter" || event.key === "Tab")) {
      event.preventDefault();
      insert(suggestions[Math.min(active, suggestions.length - 1)]);
    } else if (open && event.key === "Escape") {
      event.preventDefault();
      setDismissed(true);
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">{cm.label}</label>
        <textarea
          ref={textarea}
          id={inputId}
          className={`${CONTROL} w-full py-2`}
          rows={3}
          value={body}
          maxLength={COMMENT_MAX}
          placeholder={placeholder}
          autoFocus={autoFocus}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          onChange={(event) => {
            setDismissed(false);
            setActive(0);
            track(event.currentTarget);
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          onBlur={() => setDismissed(true)}
          onFocus={() => setDismissed(false)}
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={cm.suggestions}
            className="absolute inset-x-0 top-full z-10 mt-1 flex flex-col rounded-md border
              border-line bg-surface py-1 shadow-sm"
          >
            {suggestions.map((member, index) => (
              <li
                key={member.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={`cursor-pointer px-3 py-2 text-small
                  ${index === active ? "bg-encre-soft text-encre" : ""}`}
                // mousedown plutôt que click : la zone de saisie garde le focus
                onMouseDown={(event) => {
                  event.preventDefault();
                  insert(member);
                }}
              >
                {member.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={BUTTON_PRIMARY} disabled={pending || !body.trim()}>
          {pending ? cm.sending : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={BUTTON_TERTIARY} onClick={onCancel}>
            {cm.cancel}
          </button>
        )}
        <span className="ml-auto text-caption text-ink-muted">
          {interpolate(cm.counter, { count: String(body.length) })}
        </span>
      </div>
      <FormMessage error={error} />
    </form>
  );
}
