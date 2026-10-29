/**
 * =============================================================
 *  Fichier    : legal-text.tsx
 *  Projet     : Kalami
 *  Description: Page d'un texte légal (titre, version en vigueur, paragraphes). Partagée
 *               par la librairie et Kalami Stratégie ; chaque espace garde son habillage.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/legal/documents.ts
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import { getLegalDocument } from "@/lib/legal/documents";
import type { LegalKind } from "@/lib/legal/kinds";
import { DATE_LONG_FORMAT } from "@/lib/format/date";

const t = getDictionary();

/** Paragraphes d'un texte : séparés par une ligne vide, retours à la ligne conservés. */
export function LegalParagraphs({ body }: { body: string }) {
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <div className="flex flex-col gap-4 leading-relaxed">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
}

/** Texte légal en vigueur, lu dans le cache public. */
export async function LegalText({ kind }: { kind: LegalKind }) {
  const document = await getLegalDocument(kind);
  if (!document) {
    return (
      <>
        <h1 className="font-serif text-3xl font-semibold">{t.legal.kinds[kind]}</h1>
        <p className="text-ink-muted">{t.legal.missing}</p>
      </>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold">{document.title}</h1>
        <p className="text-sm text-ink-muted">
          {interpolate(t.legal.version, {
            version: String(document.version),
            date: DATE_LONG_FORMAT.format(new Date(document.published_at)),
          })}
        </p>
      </header>
      <LegalParagraphs body={document.body} />
    </>
  );
}
