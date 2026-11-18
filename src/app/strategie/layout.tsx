/**
 * =============================================================
 *  Fichier    : layout.tsx (strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'assistant stratégie : en-tête et pied de page propres à
 *               l'application (pas ceux de la librairie), pour qu'un lien vers /strategie
 *               mène directement à l'outil. Manifeste propre : installée, l'application
 *               démarre sur /strategie. Aucun contrôle d'accès ici : chaque page privée
 *               appelle requireUser. Avis Mobile Money sous l'en-tête (v0.25.4).
 *  Auteur     : Claude Marcel
 *  Version    : 2.2
 *  Date       : 2026-11-18
 *  Dépendances: components/strategy/strategy-chrome.tsx, lib/pwa/manifest.ts, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";

import { MobileMoneyNotice } from "@/components/account/mobile-money-notice";
import { StrategyFooter, StrategyHeader } from "@/components/strategy/strategy-chrome";
import { STRATEGY_MANIFEST_PATH } from "@/lib/pwa/manifest";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();

export const metadata: Metadata = {
  title: { default: s.title, template: `%s · ${s.title}` },
  description: s.description,
  // Remplace le manifeste de la librairie lié par le gabarit racine
  manifest: STRATEGY_MANIFEST_PATH,
  appleWebApp: { capable: true, title: s.title, statusBarStyle: "default" },
};

export default function StrategyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StrategyHeader />
      {/* Avis d'une décision Mobile Money (lu en flux, rien pendant le rendu) */}
      <Suspense fallback={null}>
        <MobileMoneyNotice />
      </Suspense>
      {/* Cible du lien « Aller au contenu » (gabarit racine) */}
      <div
        id="contenu"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8"
      >
        {children}
      </div>
      <StrategyFooter />
    </>
  );
}
