/**
 * =============================================================
 *  Fichier    : presence.ts
 *  Projet     : Kalami Stratégie
 *  Description: Présence et verrouillage doux (S9c), partie sans React : sujet du canal
 *               Realtime d'une étude, lecture prudente des présences reçues (un membre peut
 *               avoir plusieurs onglets), regroupement par étape, membres qui modifient un
 *               élément, et lecture du message « étape enregistrée ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Ce qu'un onglet annonce de lui-même sur le canal de l'étude. */
export type PresenceMeta = {
  userId: string;
  name: string;
  /** Étape ouverte (null : vue d'ensemble, profil, équipe…). */
  stepNo: number | null;
  /** Élément du gabarit en cours de modification (null : aucun). */
  elementId: string | null;
};

/** Un autre membre présent, tous onglets confondus. */
export type Peer = {
  userId: string;
  name: string;
  /** Étapes ouvertes, triées, sans doublon. */
  steps: number[];
  /** Éléments en cours de modification, par étape. */
  editing: { stepNo: number; elementId: string }[];
};

/** Message diffusé après l'enregistrement d'une étape. */
export type SavedEvent = {
  userId: string;
  name: string;
  stepNo: number;
  revision: number;
};

// ==================== CONSTANTES ====================

/** Nom de l'événement diffusé après un enregistrement. */
export const SAVED_EVENT = "step-saved";

const ELEMENT_ID = /^[A-Za-z0-9-]{1,40}$/;
const MAX_NAME = 80;

// ==================== FONCTIONS ====================

/** Sujet du canal Realtime privé d'une étude (miroir de strategy_topic_role en SQL). */
export function studyTopic(studyId: string): string {
  return `study:${studyId}`;
}

/** Vrai si la valeur est un numéro d'étape (1 à 9). */
function isStep(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 9;
}

/** Nom affichable, borné (les présences viennent d'autres navigateurs). */
function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().slice(0, MAX_NAME);
  return name || null;
}

/**
 * Lit une présence reçue ; null si elle est mal formée.
 * @param raw - Charge utile d'une présence (presenceState)
 */
export function readPresenceMeta(raw: unknown): PresenceMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const name = cleanName(value.name);
  if (typeof value.userId !== "string" || !value.userId || !name) return null;
  const stepNo = isStep(value.stepNo) ? value.stepNo : null;
  const elementId = stepNo !== null && typeof value.elementId === "string"
    && ELEMENT_ID.test(value.elementId)
    ? value.elementId
    : null;
  return { userId: value.userId, name, stepNo, elementId };
}

/**
 * Autres membres présents, à partir de l'état de présence du canal (un membre = une clé,
 * un onglet = une entrée). Le membre courant est exclu.
 * @param state  - presenceState() du canal
 * @param selfId - Identifiant du membre courant
 * @returns Membres triés par nom
 */
export function peersOf(state: Record<string, unknown[]>, selfId: string): Peer[] {
  const byUser = new Map<string, Peer>();
  for (const entries of Object.values(state)) {
    for (const raw of entries) {
      const meta = readPresenceMeta(raw);
      if (!meta || meta.userId === selfId) continue;
      const peer = byUser.get(meta.userId)
        ?? { userId: meta.userId, name: meta.name, steps: [], editing: [] };
      if (meta.stepNo !== null && !peer.steps.includes(meta.stepNo)) peer.steps.push(meta.stepNo);
      if (meta.stepNo !== null && meta.elementId
        && !peer.editing.some((e) => e.stepNo === meta.stepNo && e.elementId === meta.elementId)) {
        peer.editing.push({ stepNo: meta.stepNo, elementId: meta.elementId });
      }
      byUser.set(meta.userId, peer);
    }
  }
  const peers = [...byUser.values()];
  for (const peer of peers) peer.steps.sort((a, b) => a - b);
  return peers.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * Membres présents sur une étape.
 * @param peers  - Résultat de peersOf
 * @param stepNo - Étape
 */
export function peersOnStep(peers: Peer[], stepNo: number): Peer[] {
  return peers.filter((peer) => peer.steps.includes(stepNo));
}

/**
 * Noms des membres qui modifient un élément d'une étape (verrouillage doux).
 * @param peers     - Résultat de peersOf
 * @param stepNo    - Étape
 * @param elementId - Élément du gabarit
 */
export function editorsOf(peers: Peer[], stepNo: number, elementId: string): string[] {
  return peers
    .filter((peer) => peer.editing.some((e) => e.stepNo === stepNo && e.elementId === elementId))
    .map((peer) => peer.name);
}

/**
 * Initiales d'un nom (pastille de présence) : deux lettres au plus.
 * @param name - Nom affiché du membre
 */
export function initials(name: string): string {
  const words = name.replace(/@.*$/, "").split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`
    : (words[0] ?? "?").slice(0, 2);
  return letters.toLocaleUpperCase("fr");
}

/**
 * Lit le message « étape enregistrée » ; null s'il est mal formé.
 * @param raw - Charge utile reçue par le canal
 */
export function readSavedEvent(raw: unknown): SavedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const name = cleanName(value.name);
  if (typeof value.userId !== "string" || !value.userId || !name || !isStep(value.stepNo)
    || typeof value.revision !== "number" || !Number.isInteger(value.revision)
    || value.revision < 1) {
    return null;
  }
  return { userId: value.userId, name, stepNo: value.stepNo, revision: value.revision };
}
