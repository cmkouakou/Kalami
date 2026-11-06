/**
 * =============================================================
 *  Fichier    : layout.tsx (powerbi)
 *  Projet     : Kalami Données
 *  Description: Gabarit de l'espace de préparation PL-300 : en-tête et pied de page
 *               propres, pour qu'un lien vers /powerbi mène directement au parcours.
 *               Espace privé : il n'est pas indexé par les moteurs de recherche, et
 *               chaque page appelle requirePowerbiAccess (administrateurs).
 *               v1.1 (v0.21.0) : charte du guide powerbi4you (classe .p4y, polices
 *               Fraunces / IBM Plex, feuille powerbi.css).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: components/powerbi/powerbi-chrome.tsx, powerbi.css, next/font, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { PowerbiFooter, PowerbiHeader } from "@/components/powerbi/powerbi-chrome";
import { getPowerbiDictionary } from "@/i18n/powerbi";

import "./powerbi.css";

const d = getPowerbiDictionary();

// ==================== POLICES DU GUIDE ====================

const titres = Fraunces({ subsets: ["latin"], variable: "--p4y-titres", axes: ["opsz"] });
const texte = IBM_Plex_Sans({ subsets: ["latin"], variable: "--p4y-texte" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--p4y-mono",
});

export const metadata: Metadata = {
  title: { default: d.title, template: `%s · ${d.title}` },
  description: d.description,
  // Section privée en construction : hors des moteurs de recherche
  robots: { index: false, follow: false },
};

export default function PowerbiLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`p4y flex flex-1 flex-col ${titres.variable} ${texte.variable} ${mono.variable}`}
    >
      <PowerbiHeader />
      {/* Cible du lien « Aller au contenu » (gabarit racine) */}
      <div id="contenu" tabIndex={-1} className="shell contenu">
        {children}
      </div>
      <PowerbiFooter />
    </div>
  );
}
