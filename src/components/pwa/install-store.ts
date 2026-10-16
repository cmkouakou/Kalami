/**
 * =============================================================
 *  Fichier    : install-store.ts
 *  Projet     : Kalami
 *  Description: Mémorise l'invitation d'installation du navigateur (« beforeinstallprompt »,
 *               Chrome, Edge, Android), qui arrive tôt et une seule fois, pour que le bouton
 *               « Installer l'application » puisse la déclencher plus tard.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Événement non standard des navigateurs Chromium. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ==================== ÉTAT ====================

let invitation: InstallPromptEvent | null = null;
const abonnes = new Set<() => void>();

/** Prévient les composants abonnés d'un changement. */
function notifier() {
  abonnes.forEach((rappel) => rappel());
}

// ==================== API ====================

/** Écoute l'invitation du navigateur ; appelé une fois, au montage du gabarit racine. */
export function listenForInstallPrompt(): () => void {
  const surInvitation = (event: Event) => {
    // Pas de bannière automatique : le bouton discret décide du moment
    event.preventDefault();
    invitation = event as InstallPromptEvent;
    notifier();
  };
  const surInstallation = () => {
    invitation = null;
    notifier();
  };
  window.addEventListener("beforeinstallprompt", surInvitation);
  window.addEventListener("appinstalled", surInstallation);
  return () => {
    window.removeEventListener("beforeinstallprompt", surInvitation);
    window.removeEventListener("appinstalled", surInstallation);
  };
}

/** Abonnement pour useSyncExternalStore. */
export function subscribeInstallPrompt(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Vrai si le navigateur a proposé l'installation. */
export function hasInstallPrompt(): boolean {
  return invitation !== null;
}

/** Ouvre la fenêtre d'installation du navigateur (utilisable une seule fois). */
export async function promptInstall(): Promise<void> {
  const courante = invitation;
  if (!courante) return;
  invitation = null;
  notifier();
  await courante.prompt();
}
