/**
 * =============================================================
 *  Fichier    : step-guide.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Guide d'une étape : explication fournie par l'auteur, lien « Lire le
 *               chapitre » (seulement si le lecteur a accès au livre guide) et exemple
 *               Infosystem dépliable. Textes affichés tels quels (aucun HTML interprété) ;
 *               rien n'est affiché quand tout est vide.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/queries.ts (StepGuide)
 * =============================================================
 */

import Link from "next/link";

import { BUTTON_TERTIARY, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import type { StepGuide as StepGuideData } from "@/lib/strategy/queries";

const t = getDictionary();
const g = t.strategy.guide;

/** Paragraphes d'un texte de l'auteur (séparés par une ligne vide). */
function Paragraphs({ text }: { text: string }) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="whitespace-pre-line">
        {paragraph}
      </p>
    ));
}

/** Encadré du guide de l'étape ; null si l'auteur n'a rien fourni et qu'il n'y a pas de lien. */
export function StepGuide({ guide }: { guide: StepGuideData }) {
  const { explanation, example, readingHref } = guide;
  if (!explanation && !example && !readingHref) return null;

  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`} aria-labelledby="guide-etape">
      <h2 id="guide-etape" className="font-serif text-h3 font-semibold">
        {g.title}
      </h2>
      {explanation && (
        <div className="flex flex-col gap-2 text-body">
          <Paragraphs text={explanation} />
        </div>
      )}
      {readingHref && (
        <Link href={readingHref} className={`${BUTTON_TERTIARY} w-fit`}>
          {g.read}
        </Link>
      )}
      {example && (
        <details className={`${PANEL_SAND} group p-3`}>
          <summary className="cursor-pointer font-semibold">
            <span className="group-open:hidden">{g.exampleShow}</span>
            <span className="hidden group-open:inline">{g.exampleHide}</span>
          </summary>
          <div className="mt-3 flex flex-col gap-2 text-small">
            <p className="text-caption uppercase text-ink-muted">{g.exampleTitle}</p>
            <Paragraphs text={example} />
          </div>
        </details>
      )}
    </section>
  );
}
