/**
 * =============================================================
 *  Fichier    : layout.tsx (powerbi)
 *  Projet     : Kalami Données
 *  Description: Gabarit de l'espace de préparation PL-300 : en-tête et pied de page
 *               propres, pour qu'un lien vers /powerbi mène directement au parcours.
 *               Espace privé : il n'est pas indexé par les moteurs de recherche, et
 *               chaque page appelle requireUser.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: components/powerbi/powerbi-chrome.tsx, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PowerbiFooter, PowerbiHeader } from "@/components/powerbi/powerbi-chrome";
import { getPowerbiDictionary } from "@/i18n/powerbi";

const d = getPowerbiDictionary();

export const metadata: Metadata = {
  title: { default: d.title, template: `%s · ${d.title}` },
  description: d.description,
  // Section privée en construction : hors des moteurs de recherche
  robots: { index: false, follow: false },
};

export default function PowerbiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PowerbiHeader />
      {/* Cible du lien « Aller au contenu » (gabarit racine) */}
      <div
        id="contenu"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8"
      >
        {children}
      </div>
      <PowerbiFooter />
    </>
  );
}
