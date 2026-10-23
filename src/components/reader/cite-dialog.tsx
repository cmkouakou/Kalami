/**
 * =============================================================
 *  Fichier    : cite-dialog.tsx (reader)
 *  Projet     : Kalami
 *  Description: Références du passage aux formats APA, MLA et Chicago, chacune copiable.
 *               Le texte des références est sélectionnable (data-selectionnable) : seule
 *               exception à la protection contre la copie.
 *               v1.1 : l'extrait (280 caractères au plus) est copié entre guillemets avec
 *               son appel de citation, avant la référence.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-23
 *  Dépendances: dialog.tsx, lib/reader/citation.ts, lib/reader/annotations.ts, i18n
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { shareExcerpt } from "@/lib/reader/annotations";
import {
  CITATION_STYLES,
  type CitationSource,
  type CitationStyle,
  formatCitation,
  inTextCitation,
  quotedCitationText,
} from "@/lib/reader/citation";

import { Dialog } from "./dialog";

const t = getDictionary();

/** Fenêtre « Citer » : l'extrait, puis une référence par style avec son bouton « Copier ». */
export function CiteDialog({
  source,
  quote,
  onClose,
}: {
  source: CitationSource;
  quote: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<CitationStyle | null>(null);
  const [failed, setFailed] = useState(false);
  const excerpt = shareExcerpt(quote);
  const cut = excerpt !== quote.replace(/\s+/g, " ").trim();

  /** Copie l'extrait, son appel et la référence en texte brut dans le presse-papiers. */
  async function copy(style: CitationStyle) {
    try {
      await navigator.clipboard.writeText(quotedCitationText(style, source, excerpt));
      setCopied(style);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <Dialog
      id="dialogue-citer"
      title={t.reader.cite.title}
      closeLabel={t.reader.cite.close}
      onClose={onClose}
    >
      <blockquote className="border-l-4 border-sand pl-3 text-small italic">
        « {excerpt} »
      </blockquote>
      {cut && <p className="text-small">{t.reader.cite.excerptCut}</p>}
      <ul className="flex flex-col gap-4">
        {CITATION_STYLES.map((style) => {
          const citation = formatCitation(style, source);
          const call = inTextCitation(style, source);
          return (
            <li key={style} className="flex flex-col gap-2">
              <h3 className="text-label font-semibold">
                {t.reader.cite[style]}
              </h3>
              {call && (
                <p className="text-small">
                  {t.reader.cite.inText} {call}
                </p>
              )}
              <p
                data-selectionnable=""
                className="rounded-md bg-sand p-3 text-small"
              >
                {citation.before}
                <em>{citation.title}</em>
                {citation.after}
              </p>
              <button
                type="button"
                onClick={() => copy(style)}
                className={`${BUTTON_SECONDARY} self-start`}
              >
                {copied === style ? t.reader.cite.copied : t.reader.cite.copy}
              </button>
            </li>
          );
        })}
      </ul>
      {failed && (
        <p role="alert" className="text-small text-danger">
          {t.reader.cite.copyError}
        </p>
      )}
    </Dialog>
  );
}
