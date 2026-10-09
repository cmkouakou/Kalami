/**
 * =============================================================
 *  Fichier    : cite-dialog.tsx (reader)
 *  Projet     : Kalami
 *  Description: Références du passage aux formats APA, MLA et Chicago, chacune copiable.
 *               Le texte des références est sélectionnable (data-selectionnable) : seule
 *               exception à la protection contre la copie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: dialog.tsx, lib/reader/citation.ts, i18n
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import {
  CITATION_STYLES,
  type CitationSource,
  type CitationStyle,
  citationText,
  formatCitation,
} from "@/lib/reader/citation";

import { Dialog } from "./dialog";

const t = getDictionary();

/** Fenêtre « Citer » : une référence par style avec son bouton « Copier ». */
export function CiteDialog({ source, onClose }: { source: CitationSource; onClose: () => void }) {
  const [copied, setCopied] = useState<CitationStyle | null>(null);
  const [failed, setFailed] = useState(false);

  /** Copie la référence en texte brut dans le presse-papiers. */
  async function copy(style: CitationStyle) {
    try {
      await navigator.clipboard.writeText(citationText(formatCitation(style, source)));
      setCopied(style);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <Dialog id="dialogue-citer" title={t.reader.cite.title} closeLabel={t.reader.cite.close}
      onClose={onClose}>
      <ul className="flex flex-col gap-4">
        {CITATION_STYLES.map((style) => {
          const citation = formatCitation(style, source);
          return (
            <li key={style} className="flex flex-col gap-2">
              <h3 className="text-label font-semibold">{t.reader.cite[style]}</h3>
              <p data-selectionnable="" className="rounded-md bg-sand p-3 text-small">
                {citation.before}
                <em>{citation.title}</em>
                {citation.after}
              </p>
              <button type="button" onClick={() => copy(style)}
                className={`${BUTTON_SECONDARY} self-start`}>
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
