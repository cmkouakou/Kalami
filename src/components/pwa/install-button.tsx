/**
 * =============================================================
 *  Fichier    : install-button.tsx
 *  Projet     : Kalami
 *  Description: Bouton discret « Installer l'application » (pied de page). Chrome, Edge et
 *               Android : fenêtre d'installation du navigateur. iPhone et iPad : consigne
 *               « Partager → Sur l'écran d'accueil ». Masqué si l'application est déjà
 *               installée ou si le navigateur ne permet pas l'installation.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/pwa/install-store.ts, components/reader/dialog.tsx
 * =============================================================
 */

"use client";

import { useState, useSyncExternalStore } from "react";

import { Dialog } from "@/components/reader/dialog";
import { getDictionary } from "@/i18n";

import { hasInstallPrompt, promptInstall, subscribeInstallPrompt } from "./install-store";

const t = getDictionary();
const p = t.pwa;

/** Mode d'installation offert par l'appareil courant. */
type ModeInstallation = "aucun" | "invitation" | "ios";

/** Lit le mode d'installation (côté navigateur seulement). */
function lireMode(): ModeInstallation {
  const installee =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installee) return "aucun";
  if (hasInstallPrompt()) return "invitation";
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile
  const ios =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "aucun";
}

/** Bouton d'installation ; rien n'est rendu côté serveur. */
export function InstallButton({ className }: { className?: string }) {
  const mode = useSyncExternalStore(subscribeInstallPrompt, lireMode, () => "aucun" as const);
  const [consigneOuverte, setConsigneOuverte] = useState(false);

  if (mode === "aucun") return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => (mode === "ios" ? setConsigneOuverte(true) : void promptInstall())}
      >
        {p.install}
      </button>
      {consigneOuverte && (
        <Dialog
          id="installer-ios-titre"
          title={p.installIosTitle}
          closeLabel={p.close}
          onClose={() => setConsigneOuverte(false)}
        >
          <p className="text-body">{p.installIosSteps}</p>
        </Dialog>
      )}
    </>
  );
}
