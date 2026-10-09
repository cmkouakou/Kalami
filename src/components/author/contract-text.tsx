/**
 * =============================================================
 *  Fichier    : contract-text.tsx
 *  Projet     : Kalami
 *  Description: Affichage d'une version du contrat auteur : titre, version, date et texte
 *               (texte brut, paragraphes séparés par des lignes vides, jamais interprété
 *               comme du HTML).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 * =============================================================
 */

import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { Contract } from "@/lib/author/queries";

const t = getDictionary();
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

/** Contrat dans un cadre défilant (hauteur limitée pour garder le formulaire visible). */
export function ContractText({ contract }: { contract: Contract }) {
  const paragraphs = contract.body.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <article className={`${CARD} flex flex-col gap-3 p-5`}>
      <header>
        <h2 className="text-lg font-semibold">{contract.title}</h2>
        <p className="text-sm text-ink-muted">
          {interpolate(t.author.contract.version, {
            version: String(contract.version),
            date: DATE_FORMAT.format(new Date(contract.published_at)),
          })}
        </p>
      </header>
      <div
        tabIndex={0}
        className="flex max-h-96 flex-col gap-3 overflow-y-auto text-sm leading-relaxed"
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    </article>
  );
}
