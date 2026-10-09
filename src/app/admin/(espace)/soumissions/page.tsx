/**
 * =============================================================
 *  Fichier    : page.tsx (admin/soumissions)
 *  Projet     : Kalami
 *  Description: File des demandes de validation des auteurs, les plus anciennes en
 *               premier. La décision se prend sur la fiche du livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getDictionary } from "@/i18n";
import { listOpenSubmissions } from "@/lib/author/queries";

const t = getDictionary();
const s = t.admin.submissions;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const metadata: Metadata = { title: s.title };

export default function AdminSubmissionsPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{s.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
        <SubmissionList />
      </Suspense>
    </main>
  );
}

/** Tableau des demandes ouvertes (administrateur aal2 exigé par la requête). */
async function SubmissionList() {
  const submissions = await listOpenSubmissions();
  if (submissions.length === 0) return <p className="text-ink-muted">{s.empty}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-ink-muted">
          <tr>
            <th className="py-2 pr-4 font-medium">{s.book}</th>
            <th className="py-2 pr-4 font-medium">{s.author}</th>
            <th className="py-2 pr-4 font-medium">{s.kind}</th>
            <th className="py-2 font-medium">{s.date}</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="border-b border-line">
              <td className="py-2 pr-4">
                <Link
                  href={`/admin/livres/${submission.book.id}`}
                  className="inline-flex min-h-11 items-center text-encre hover:underline"
                >
                  {submission.book.title}
                </Link>
              </td>
              <td className="py-2 pr-4">{submission.book.author.display_name}</td>
              <td className="py-2 pr-4">
                {submission.is_update ? t.author.book.kinds.update : t.author.book.kinds.first}
              </td>
              <td className="py-2">{DATE_FORMAT.format(new Date(submission.submitted_at))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
