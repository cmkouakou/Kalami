/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/notifications)
 *  Projet     : Kalami Stratégie
 *  Description: Notifications de l'utilisateur (S9b) : mentions, réponses à ses fils et
 *               commentaires sur les étapes dont il est responsable, des plus récentes aux
 *               plus anciennes (pages de 30). Ouvrir une notification la marque comme lue et
 *               mène au commentaire. Préférence de courriel pour les mentions.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/comments-queries.ts, lib/strategy/comments-actions.ts,
 *               components/strategy/comments/notify-email-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { NotifyEmailForm } from "@/components/strategy/comments/notify-email-form";
import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { requireUser } from "@/lib/auth/dal";
import { describeNotification, type NotificationEntry } from "@/lib/strategy/comments";
import { markAllRead, openNotification } from "@/lib/strategy/comments-actions";
import {
  getNotifications,
  getNotifyEmail,
  NOTIFICATIONS_PAGE,
} from "@/lib/strategy/comments-queries";
import { DATE_TIME_FORMAT } from "@/lib/format/date";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const n = s.notifications;

const PATH = "/strategie/notifications";

export const metadata: Metadata = { title: n.title };

export default function NotificationsPage({ searchParams }: PageProps<"/strategie/notifications">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <Notifications searchParams={searchParams} />
    </Suspense>
  );
}

// ==================== FONCTIONS UTILITAIRES ====================

/** Curseur de pagination « ?avant=123 », ou null (première page). */
function readBefore(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const before = Number(raw);
  return raw && Number.isSafeInteger(before) && before > 0 ? before : null;
}

// ==================== CONTENU ====================

/** Charge les notifications et la préférence de courriel de l'utilisateur. */
async function Notifications({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(PATH);
  const before = readBefore((await searchParams).avant);
  const [entries, notifyEmail] = await Promise.all([
    getNotifications(before),
    getNotifyEmail(user.id),
  ]);
  const hasUnread = entries.some((entry) => !entry.read_at);
  const last = entries.at(-1);

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{n.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{n.title}</h1>
        <p className="text-ink-muted">{n.intro}</p>
      </header>

      {/* ==================== LISTE ==================== */}
      <section aria-label={n.title} className="flex flex-col gap-3">
        {hasUnread && (
          <form action={markAllRead}>
            <button type="submit" className={BUTTON_TERTIARY}>{n.markAll}</button>
          </form>
        )}
        {entries.length === 0 ? (
          <p className="text-ink-muted">{n.none}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <NotificationItem entry={entry} />
              </li>
            ))}
          </ul>
        )}
        <nav className="flex flex-wrap gap-4">
          {before && <Link href={PATH} className={BUTTON_TERTIARY}>{n.latest}</Link>}
          {last && entries.length === NOTIFICATIONS_PAGE && (
            <Link href={`${PATH}?avant=${last.id}`} className={BUTTON_TERTIARY}>{n.more}</Link>
          )}
        </nav>
      </section>

      {/* ==================== PRÉFÉRENCE ==================== */}
      <section className={`${CARD} flex max-w-2xl flex-col gap-3 p-5`}>
        <h2 className="font-serif text-h3 font-semibold">{n.preference.title}</h2>
        <NotifyEmailForm enabled={notifyEmail} />
      </section>
    </main>
  );
}

/** Une notification : phrase, élément visé, extrait, date et lien vers le commentaire. */
function NotificationItem({ entry }: { entry: NotificationEntry }) {
  const unread = !entry.read_at;
  const open = openNotification.bind(null, entry.id, entry.study_id, entry.step_no,
    entry.comment_id);

  return (
    <article
      className={`${CARD} flex flex-col gap-2 p-4 ${unread ? "border-l-4 border-l-encre" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {unread && <span className={BADGE}>{n.unread}</span>}
        {entry.target_label && <span className={BADGE}>{entry.target_label}</span>}
        <time
          dateTime={entry.created_at}
          className="text-caption text-ink-muted"
          suppressHydrationWarning
        >
          {DATE_TIME_FORMAT.format(new Date(entry.created_at))}
        </time>
      </div>
      <p className={unread ? "font-semibold" : ""}>{describeNotification(entry)}</p>
      {entry.excerpt && (
        <blockquote className="whitespace-pre-line break-words border-l-2 border-line pl-3
          text-small text-ink-muted"
        >
          {entry.excerpt}
        </blockquote>
      )}
      <form action={open}>
        <button type="submit" className={`${BUTTON_SECONDARY} px-4`}>{n.open}</button>
      </form>
    </article>
  );
}
