/**
 * =============================================================
 *  Fichier    : presence-context.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Présence et verrouillage doux (S9c) : rejoint le canal Realtime privé de
 *               l'étude, annonce l'étape ouverte et l'élément en cours de modification
 *               (repéré par le champ qui a le focus, à l'intérieur de l'élément qui porte sa
 *               pastille de commentaire), tient la liste des autres membres présents et
 *               relaie le message « étape enregistrée » à la sauvegarde automatique.
 *               Sans fournisseur, ou si le canal ne répond pas, tout fonctionne comme avant.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/client.ts, lib/strategy/presence.ts
 * =============================================================
 */

"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type Peer,
  peersOf,
  type PresenceMeta,
  readSavedEvent,
  SAVED_EVENT,
  type SavedEvent,
  studyTopic,
} from "@/lib/strategy/presence";
import { createClient } from "@/lib/supabase/client";

// ==================== TYPES ====================

/** Message « étape enregistrée » reçu, avec son heure de réception. */
export type RemoteSave = SavedEvent & { at: string };

type SavedListener = (event: SavedEvent) => void;

type PresenceValue = {
  selfId: string;
  /** Étape ouverte (null : vue d'ensemble). */
  stepNo: number | null;
  /** Autres membres présents. */
  peers: Peer[];
  /** Dernier enregistrement de l'étape ouverte par un autre onglet ou membre. */
  lastRemote: RemoteSave | null;
  /** Diffuse l'enregistrement d'une étape (sauvegarde automatique réussie). */
  announceSaved: (stepNo: number, revision: number) => void;
  /** Écoute les enregistrements des autres ; renvoie la fonction de désabonnement. */
  onSaved: (listener: SavedListener) => () => void;
};

// ==================== CONSTANTES ====================

/** Attribut posé sur la pastille de commentaire de chaque élément d'un gabarit. */
export const ELEMENT_ATTRIBUTE = "data-element-id";

/** Délai avant d'annoncer qu'on a quitté un élément (passage d'un champ à l'autre). */
const BLUR_DELAY_MS = 400;

/** Nombre maximal d'ancêtres remontés pour trouver l'élément d'un champ. */
const MAX_DEPTH = 12;

const EDITABLE = "input, textarea, select, [contenteditable='true']";

const PresenceContext = createContext<PresenceValue | null>(null);

/**
 * Départ en cours du canal de la page précédente. Le client Supabase du navigateur est
 * partagé et renvoie le canal existant d'un même sujet : on attend la fin du départ.
 */
let leaving: Promise<unknown> = Promise.resolve();

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Élément du gabarit qui contient un champ : le plus proche ancêtre qui contient une seule
 * pastille d'élément. Null si le champ est hors élément ou si l'ancêtre en contient
 * plusieurs (champ commun à une liste).
 * @param field - Champ qui reçoit le focus
 * @param root  - Racine du fournisseur (on ne remonte pas au-delà)
 */
function elementOf(field: Element, root: Element): string | null {
  let node: Element | null = field;
  for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
    const ids = new Set<string>();
    const own = node.getAttribute(ELEMENT_ATTRIBUTE);
    if (own) ids.add(own);
    node.querySelectorAll(`[${ELEMENT_ATTRIBUTE}]`).forEach((marker) => {
      const id = marker.getAttribute(ELEMENT_ATTRIBUTE);
      if (id) ids.add(id);
    });
    if (ids.size === 1) return [...ids][0];
    if (ids.size > 1 || node === root) return null;
    node = node.parentElement;
  }
  return null;
}

// ==================== FOURNISSEUR ====================

/**
 * Présence des membres d'une étude.
 * @param studyId - Étude (sujet du canal)
 * @param self    - Membre courant : identifiant et nom affiché
 * @param stepNo  - Étape ouverte (null : vue d'ensemble)
 * @param canEdit - Vrai pour le propriétaire et les contributeurs (annonce des éléments
 *                  modifiés et des enregistrements)
 */
export function PresenceProvider({
  studyId,
  self,
  stepNo,
  canEdit,
  children,
}: {
  studyId: string;
  self: { id: string; name: string };
  stepNo: number | null;
  canEdit: boolean;
  children: ReactNode;
}) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [elementId, setElementId] = useState<string | null>(null);
  const [lastRemote, setLastRemote] = useState<RemoteSave | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const listeners = useRef(new Set<SavedListener>());
  const meta = useRef<PresenceMeta>({ userId: self.id, name: self.name, stepNo, elementId });

  // Connexion au canal privé de l'étude
  useEffect(() => {
    const supabase = createClient();
    let joined: RealtimeChannel | null = null;
    let cancelled = false;

    async function join() {
      try {
        await leaving;
        await supabase.realtime.setAuth();
        // Canal resté ouvert malgré tout (départ expiré) : on le retire d'abord
        const topic = `realtime:${studyTopic(studyId)}`;
        const stale = supabase.getChannels().find((item) => item.topic === topic);
        if (stale) await supabase.removeChannel(stale);
      } catch {
        return;
      }
      if (cancelled) return;
      const next = supabase.channel(studyTopic(studyId), {
        config: { private: true, presence: { key: self.id } },
      });
      joined = next;
      next
        .on("presence", { event: "sync" }, () => {
          setPeers(peersOf(next.presenceState() as Record<string, unknown[]>, self.id));
        })
        .on("broadcast", { event: SAVED_EVENT }, ({ payload }) => {
          const event = readSavedEvent(payload);
          if (!event) return;
          if (event.stepNo === meta.current.stepNo) {
            setLastRemote({ ...event, at: new Date().toISOString() });
          }
          listeners.current.forEach((listener) => listener(event));
        })
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") return;
          channel.current = next;
          void next.track(meta.current);
        });
    }

    void join();
    return () => {
      cancelled = true;
      channel.current = null;
      if (joined) leaving = supabase.removeChannel(joined).catch(() => undefined);
    };
  }, [studyId, self.id]);

  // Annonce de l'étape ouverte et de l'élément modifié
  useEffect(() => {
    meta.current = { userId: self.id, name: self.name, stepNo, elementId };
    void channel.current?.track(meta.current);
  }, [self.id, self.name, stepNo, elementId]);

  // Repérage de l'élément modifié par le champ qui a le focus (éditeurs seulement)
  useEffect(() => {
    const container = root.current;
    if (!canEdit || stepNo === null || !container) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function onFocusIn(event: FocusEvent) {
      const field = event.target;
      if (!(field instanceof Element) || !field.matches(EDITABLE) || !container) return;
      if (timer) clearTimeout(timer);
      setElementId(elementOf(field, container));
    }
    function onFocusOut() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setElementId(null), BLUR_DELAY_MS);
    }

    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    return () => {
      if (timer) clearTimeout(timer);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
    };
  }, [canEdit, stepNo]);

  const announceSaved = useCallback(
    (savedStep: number, revision: number) => {
      if (!canEdit) return;
      void channel.current?.send({
        type: "broadcast",
        event: SAVED_EVENT,
        payload: { userId: self.id, name: self.name, stepNo: savedStep, revision },
      });
    },
    [canEdit, self.id, self.name],
  );

  const onSaved = useCallback((listener: SavedListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = useMemo<PresenceValue>(
    () => ({ selfId: self.id, stepNo, peers, lastRemote, announceSaved, onSaved }),
    [self.id, stepNo, peers, lastRemote, announceSaved, onSaved],
  );

  return (
    <PresenceContext.Provider value={value}>
      <div ref={root} className="contents">{children}</div>
    </PresenceContext.Provider>
  );
}

/** Présence de l'étude, ou null hors fournisseur. */
export function usePresence(): PresenceValue | null {
  return useContext(PresenceContext);
}
