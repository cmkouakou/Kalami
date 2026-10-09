/**
 * =============================================================
 *  Fichier    : book-status-badge.tsx
 *  Projet     : Kalami
 *  Description: Pastille du statut d'un livre (brouillon, soumis, publié, refusé), commune
 *               à l'espace auteur et à la file des soumissions.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 * =============================================================
 */

import { getDictionary } from "@/i18n";
import type { BookStatus } from "@/lib/catalog/types";

const t = getDictionary();

const STATUS_CLASS: Record<BookStatus, string> = {
  draft: "bg-sand text-ink",
  submitted: "bg-warning/15 text-ink",
  published: "bg-success/15 text-ink",
  rejected: "bg-danger/15 text-ink",
};

/** Pastille colorée avec le libellé du statut. */
export function BookStatusBadge({ status }: { status: BookStatus }) {
  return (
    <span className={`w-fit rounded-full px-2 py-1 text-xs ${STATUS_CLASS[status]}`}>
      {t.admin.books.statuses[status]}
    </span>
  );
}
