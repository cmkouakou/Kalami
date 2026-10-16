/**
 * =============================================================
 *  Fichier    : comments.ts
 *  Projet     : Kalami Stratégie
 *  Description: Règles de la discussion d'équipe (S9b), sans accès à la base : éléments
 *               d'une étape qu'un commentaire peut viser, repérage des mentions « @Nom »,
 *               regroupement en fils, pastilles par élément, phrases des notifications et
 *               traduction des erreurs SQL. Utilisable côté serveur comme côté navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: i18n, lib/strategy/steps.ts, lib/strategy/templates/*
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import { isStepNo, type StepNo } from "@/lib/strategy/steps";
import { readAction } from "@/lib/strategy/templates/action";
import { readChoice } from "@/lib/strategy/templates/choice";
import { readDirection } from "@/lib/strategy/templates/direction";
import { FORCES, readForces } from "@/lib/strategy/templates/forces";
import { readInternal } from "@/lib/strategy/templates/internal";
import { readPestel } from "@/lib/strategy/templates/pestel";
import { readPlan } from "@/lib/strategy/templates/plan";
import { readStakeholders } from "@/lib/strategy/templates/stakeholders";
import { readSynthesis, SWOT_KEYS } from "@/lib/strategy/templates/synthesis";

const s = getDictionary().strategy;
const cm = s.comments;

// ==================== RÉFÉRENCES ====================

/** Longueur maximale d'un commentaire et nombre maximal de mentions (mêmes valeurs qu'en SQL). */
export const COMMENT_MAX = 2000;
export const MENTIONS_MAX = 10;

/** Longueur du texte d'un élément repris dans le libellé d'un commentaire. */
const LABEL_TEXT_MAX = 60;

export type StepComment = {
  id: string;
  parent_id: string | null;
  target_id: string | null;
  target_label: string | null;
  author_id: string | null;
  author_name: string | null;
  body: string;
  mentions: string[];
  created_at: string;
  edited_at: string | null;
  deleted: boolean;
  resolved_at: string | null;
  resolver_name: string | null;
};

export type CommentThread = { root: StepComment; replies: StepComment[] };

export type CommentTarget = { id: string; label: string };

/** Membre qu'on peut mentionner : identifiant et nom affiché. */
export type MentionMember = { id: string; label: string };

export const NOTIFICATION_KINDS = ["mention", "reply", "step_comment"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationEntry = {
  id: number;
  kind: NotificationKind;
  study_id: string;
  company_name: string;
  step_no: number;
  comment_id: string;
  actor_name: string | null;
  excerpt: string;
  target_label: string | null;
  read_at: string | null;
  created_at: string;
};

// ==================== ÉLÉMENTS VISÉS ====================

/**
 * Libellé d'un élément : « Section — début du texte », ou « Section n » sans texte.
 * @param section - Nom de la section (« Facteur », « Enjeu »…)
 * @param text    - Texte de l'élément
 * @param index   - Rang de l'élément dans sa liste (à partir de 0)
 */
function targetLabel(section: string, text: string, index: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return `${section} ${index + 1}`;
  const short = clean.length > LABEL_TEXT_MAX
    ? `${clean.slice(0, LABEL_TEXT_MAX - 1).trimEnd()}…`
    : clean;
  return `${section} — ${short}`;
}

/** Éléments d'une liste : identifiant et libellé tiré de son texte. */
function listTargets<T extends { id: string }>(
  items: readonly T[],
  section: string,
  text: (item: T) => string,
): CommentTarget[] {
  return items.map((item, index) => ({
    id: item.id,
    label: targetLabel(section, text(item), index),
  }));
}

/**
 * Éléments qu'un commentaire peut viser dans le contenu enregistré d'une étape.
 * Les acteurs de la comparaison (étape 2) sont exclus : ils dépendent du profil.
 * @param stepNo  - Étape (1 à 9)
 * @param payload - Contenu JSON enregistré de l'étape
 */
export function commentTargets(stepNo: StepNo, payload: unknown): CommentTarget[] {
  const sec = cm.sections;
  switch (stepNo) {
    case 1:
      return listTargets(readPestel(payload).factors, sec.factor, (f) => f.factor);
    case 2: {
      const forces = readForces(payload, "", []);
      return [
        ...FORCES.map((key) => ({ id: key, label: s.forces.names[key] })),
        ...listTargets(forces.comparison.criteria, sec.criterion, (c) => c.name),
      ];
    }
    case 3: {
      const internal = readInternal(payload);
      return [
        ...listTargets(internal.activities, sec.activity, (a) => a.name),
        ...listTargets(internal.resources, sec.resource, (r) => r.name),
      ];
    }
    case 4:
      return listTargets(readStakeholders(payload).stakeholders, sec.stakeholder, (p) => p.name);
    case 5: {
      const synthesis = readSynthesis(payload);
      return [
        ...SWOT_KEYS.flatMap((key) =>
          listTargets(synthesis.swot[key], s.synthesis.keys[key], (i) => i.text)),
        ...listTargets(synthesis.tows, sec.tows, (t) => t.text),
        ...listTargets(synthesis.issues, sec.issue, (i) => i.title),
      ];
    }
    case 6: {
      const direction = readDirection(payload);
      return [
        { id: "vision", label: targetLabel(sec.vision, direction.vision.text, 0) },
        { id: "mission", label: targetLabel(sec.mission, direction.mission.text, 0) },
        ...listTargets(direction.values, sec.value, (v) => v.name),
        ...listTargets(direction.objectives, sec.objective, (o) => o.text),
      ];
    }
    case 7: {
      const choice = readChoice(payload);
      return [
        { id: "generic", label: sec.generic },
        ...listTargets(choice.options, sec.option, (o) => o.text),
        { id: "statement", label: targetLabel(sec.statement, choice.statement.text, 0) },
        ...listTargets(choice.renunciations, sec.renunciation, (r) => r.text),
      ];
    }
    case 8: {
      const action = readAction(payload);
      return [
        ...listTargets(action.workstreams, sec.workstream, (w) => w.name),
        ...listTargets(action.indicators, sec.indicator, (i) => i.name),
        ...listTargets(action.risks, sec.risk, (r) => r.text),
      ];
    }
    case 9:
      return readPlan(payload).sections.map((section) => ({
        id: section.key,
        label: s.plan.sections[section.key],
      }));
  }
}

// ==================== MENTIONS ====================

/** Caractère qui prolonge un mot (une mention doit s'arrêter avant). */
const WORD_CHAR = /[\p{L}\p{N}_]/u;

export type MentionMatch = { start: number; end: number; memberId: string };

/**
 * Mentions « @Nom » d'un texte, sans chevauchement. Le nom le plus long l'emporte
 * (« @Awa Koné » plutôt que « @Awa »), sans tenir compte de la casse.
 * @param body    - Texte du commentaire
 * @param members - Membres mentionnables
 */
export function findMentions(body: string, members: readonly MentionMember[]): MentionMatch[] {
  const sorted = members
    .filter((member) => member.label.trim())
    .map((member) => ({ id: member.id, label: member.label.trim().toLowerCase() }))
    .sort((a, b) => b.label.length - a.label.length);
  const lower = body.toLowerCase();
  const matches: MentionMatch[] = [];
  let index = lower.indexOf("@");
  while (index !== -1) {
    const before = index > 0 ? body[index - 1] : "";
    const found = before && WORD_CHAR.test(before)
      ? undefined
      : sorted.find((member) => {
        const end = index + 1 + member.label.length;
        return lower.startsWith(member.label, index + 1)
          && (end >= body.length || !WORD_CHAR.test(body[end]));
      });
    if (found) {
      const end = index + 1 + found.label.length;
      matches.push({ start: index, end, memberId: found.id });
      index = lower.indexOf("@", end);
    } else {
      index = lower.indexOf("@", index + 1);
    }
  }
  return matches;
}

/**
 * Membres mentionnés dans un texte (sans doublon, 10 au plus).
 * @param body    - Texte du commentaire
 * @param members - Membres mentionnables
 */
export function extractMentions(body: string, members: readonly MentionMember[]): string[] {
  const ids = findMentions(body, members).map((match) => match.memberId);
  return [...new Set(ids)].slice(0, MENTIONS_MAX);
}

export type MentionSegment = { text: string; mention: boolean };

/**
 * Découpe un texte en morceaux simples et en mentions, pour les mettre en valeur.
 * @param body    - Texte du commentaire
 * @param members - Membres mentionnés dans ce commentaire
 */
export function mentionSegments(
  body: string,
  members: readonly MentionMember[],
): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let cursor = 0;
  for (const match of findMentions(body, members)) {
    if (match.start > cursor) {
      segments.push({ text: body.slice(cursor, match.start), mention: false });
    }
    segments.push({ text: body.slice(match.start, match.end), mention: true });
    cursor = match.end;
  }
  if (cursor < body.length) segments.push({ text: body.slice(cursor), mention: false });
  return segments;
}

/** Longueur maximale du nom tapé après « @ » pour proposer des membres. */
const MENTION_QUERY_MAX = 40;

/**
 * Mention en cours de saisie juste avant le curseur (« @Aw| »), pour l'autocomplétion.
 * @param text  - Texte de la zone de saisie
 * @param caret - Position du curseur
 * @returns Début du « @ » et texte tapé après, ou null
 */
export function mentionQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const start = before.lastIndexOf("@");
  if (start === -1) return null;
  const previous = start > 0 ? before[start - 1] : "";
  if (previous && !/\s/.test(previous)) return null;
  const query = before.slice(start + 1);
  if (query.length > MENTION_QUERY_MAX || /[\r\n@]/.test(query)) return null;
  return { start, query };
}

// ==================== FILS ====================

/** Date de la dernière activité d'un fil (racine ou réponse la plus récente). */
function lastActivity(thread: CommentThread): string {
  const last = thread.replies.at(-1);
  return last && last.created_at > thread.root.created_at
    ? last.created_at
    : thread.root.created_at;
}

/**
 * Regroupe les commentaires d'une étape en fils : fils ouverts d'abord, puis résolus,
 * chacun du plus récemment actif au plus ancien ; réponses dans l'ordre chronologique.
 * @param comments - Commentaires de l'étape, du plus ancien au plus récent
 */
export function groupThreads(comments: readonly StepComment[]): CommentThread[] {
  const threads = new Map<string, CommentThread>();
  for (const comment of comments) {
    if (!comment.parent_id) threads.set(comment.id, { root: comment, replies: [] });
  }
  for (const comment of comments) {
    if (comment.parent_id) threads.get(comment.parent_id)?.replies.push(comment);
  }
  return [...threads.values()].sort((a, b) => {
    const open = Number(Boolean(a.root.resolved_at)) - Number(Boolean(b.root.resolved_at));
    return open || lastActivity(b).localeCompare(lastActivity(a));
  });
}

/**
 * Nombre de commentaires par élément visé, dans les fils non résolus (pastilles).
 * @param comments - Commentaires de l'étape
 */
export function countByTarget(comments: readonly StepComment[]): Record<string, number> {
  const roots = new Map(comments.filter((c) => !c.parent_id).map((c) => [c.id, c]));
  const counts: Record<string, number> = {};
  for (const comment of comments) {
    const root = comment.parent_id ? roots.get(comment.parent_id) : comment;
    if (!root?.target_id || root.resolved_at || comment.deleted) continue;
    counts[root.target_id] = (counts[root.target_id] ?? 0) + 1;
  }
  return counts;
}

// ==================== NOTIFICATIONS ====================

/** Vrai si la valeur est un type de notification connu. */
export function isNotificationKind(value: unknown): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly unknown[]).includes(value);
}

/**
 * Phrase d'une notification (« Awa vous a mentionné à l'étape 3 — … de « Bois & Fils ». »).
 * @param entry - Notification lue par strategy_my_notifications
 */
export function describeNotification(entry: NotificationEntry): string {
  const step = isStepNo(entry.step_no)
    ? `${entry.step_no} — ${s.steps[entry.step_no].title}`
    : String(entry.step_no);
  return interpolate(s.notifications.kinds[entry.kind], {
    actor: entry.actor_name ?? s.team.journal.someone,
    step,
    company: entry.company_name,
  });
}

// ==================== ERREURS ====================

type CommentErrorKey = keyof typeof cm.errors;
type StrategyErrorKey = keyof typeof s.errors;

/**
 * Traduit l'erreur levée par une fonction SQL de commentaires (« comment_not_found »…).
 * @param error - Erreur PostgREST (code et message)
 */
export function commentError(error: { code?: string; message?: string }): string {
  const key = error.message ?? "";
  if (key in cm.errors) return cm.errors[key as CommentErrorKey];
  if (key in s.errors) return s.errors[key as StrategyErrorKey];
  if (error.code === "42501") return s.errors.forbidden;
  return s.errors.generic;
}
