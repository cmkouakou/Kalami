/**
 * =============================================================
 *  Fichier    : plan-view.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Lecture seule d'un plan stratégique (étape 9) : les huit sections dans
 *               l'ordre, leurs paragraphes, et les lignes « - » affichées en liste. Sert au
 *               corrigé d'un cas et à la comparaison avec le plan de l'élève. Composant
 *               serveur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/plan.ts
 * =============================================================
 */

import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { PlanBlock, PlanPayload } from "@/lib/strategy/templates/plan";

const s = getDictionary().strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

/** Préfixe d'une ligne de liste dans le texte d'un paragraphe. */
const LIST_PREFIX = "- ";

/**
 * Paragraphe du plan : les lignes consécutives qui commencent par « - » forment une liste,
 * les autres des paragraphes.
 */
function Block({ block }: { block: PlanBlock }) {
  const groups: { list: boolean; lines: string[] }[] = [];
  for (const raw of block.text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const list = line.startsWith(LIST_PREFIX);
    const text = list ? line.slice(LIST_PREFIX.length) : line;
    const last = groups.at(-1);
    if (last && last.list && list) last.lines.push(text);
    else groups.push({ list, lines: [text] });
  }

  return (
    <>
      {groups.map((group, index) =>
        group.list ? (
          <ul key={`${block.id}-${index}`} className="flex list-disc flex-col gap-1 pl-6">
            {group.lines.map((line, item) => <li key={item}>{line}</li>)}
          </ul>
        ) : (
          group.lines.map((line, item) => <p key={`${block.id}-${index}-${item}`}>{line}</p>)
        ),
      )}
    </>
  );
}

/**
 * Plan stratégique en lecture seule.
 * @param plan - Plan relu par readPlan
 */
export function PlanView({ plan }: { plan: PlanPayload }) {
  return (
    <div className="flex flex-col gap-4">
      {plan.generatedAt && (
        <p className="text-small text-ink-muted">
          {interpolate(s.cases.planDate, {
            date: DATE_FORMAT.format(new Date(plan.generatedAt)),
          })}
        </p>
      )}
      {plan.sections.map((section) => (
        <section key={section.key} className={`${CARD} flex flex-col gap-3 p-4 sm:p-6`}>
          <h3 className="font-serif text-h3 font-semibold">{s.plan.sections[section.key]}</h3>
          <div className="flex max-w-3xl flex-col gap-3">
            {section.blocks.map((block) => <Block key={block.id} block={block} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
