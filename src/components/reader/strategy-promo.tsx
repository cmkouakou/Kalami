/**
 * =============================================================
 *  Fichier    : strategy-promo.tsx (reader)
 *  Projet     : Kalami
 *  Description: Encart discret vers Kalami Stratégie, pour le livre guide de la démarche :
 *               carte de la fiche du livre et de la fin de l'extrait, encart de fin de module
 *               dans la liseuse (défilement en React, pages à tourner en DOM : page-flip
 *               déplace les nœuds hors de React). Aucun bloc repéré (data-bloc) : les
 *               positions, surlignages et la lecture à voix haute sont inchangés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: i18n, lib/reader/promo.ts, components/ui
 * =============================================================
 */

import Link from "next/link";

import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { STRATEGY_HREF } from "@/lib/reader/promo";

const t = getDictionary();

// ==================== CARTE (FICHE, FIN D'EXTRAIT) ====================

/** Carte de la fiche du livre et de l'écran de fin d'extrait. */
export function StrategyPromo({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label={t.strategyPromo.label}
      className={`flex flex-col gap-2 rounded-lg border border-line bg-sand px-5 py-4 text-left
        ${className}`}
    >
      <p className="text-small font-semibold uppercase tracking-wide text-ocre-text">
        {t.strategyPromo.label}
      </p>
      <p className="font-serif text-h3">{t.strategyPromo.title}</p>
      <p className="text-small text-ink-muted">{t.strategyPromo.text}</p>
      <Link
        href={STRATEGY_HREF}
        className={`${BUTTON_SECONDARY} mt-1 self-start`}
      >
        {t.strategyPromo.cta}
      </Link>
    </aside>
  );
}

// ==================== LISEUSE (FIN DE MODULE) ====================

/** Encart de fin de module en mode défilement (styles : reader.css, .liseuse-promo). */
export function ReaderPromo() {
  return (
    <aside aria-label={t.strategyPromo.label} className="liseuse-promo">
      <p className="liseuse-promo-label">{t.strategyPromo.label}</p>
      <p className="liseuse-promo-titre">{t.strategyPromo.title}</p>
      <p className="liseuse-promo-texte">{t.strategyPromo.text}</p>
      <a className="liseuse-promo-lien" href={STRATEGY_HREF}>
        {t.strategyPromo.cta}
      </a>
    </aside>
  );
}

/**
 * Même encart que ReaderPromo, construit hors de React pour une page à tourner.
 * @returns Élément de l'encart
 */
export function buildPromoElement(): HTMLElement {
  const aside = document.createElement("aside");
  aside.className = "liseuse-promo";
  aside.setAttribute("aria-label", t.strategyPromo.label);
  const parts: [string, string][] = [
    ["liseuse-promo-label", t.strategyPromo.label],
    ["liseuse-promo-titre", t.strategyPromo.title],
    ["liseuse-promo-texte", t.strategyPromo.text],
  ];
  for (const [className, text] of parts) {
    const line = document.createElement("p");
    line.className = className;
    line.textContent = text;
    aside.append(line);
  }
  const link = document.createElement("a");
  link.className = "liseuse-promo-lien";
  link.href = STRATEGY_HREF;
  link.textContent = t.strategyPromo.cta;
  aside.append(link);
  return aside;
}
