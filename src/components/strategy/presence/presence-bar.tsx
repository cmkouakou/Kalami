/**
 * =============================================================
 *  Fichier    : presence-bar.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Affichage de la présence (S9c) : barre « Aussi sur cette étape / dans
 *               l'étude » avec les éléments en cours de modification, avatars sur les cartes
 *               d'étape de la vue d'ensemble. L'indicateur posé sur chaque élément est dans
 *               element-editors.tsx. N'affiche rien hors fournisseur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: presence-context.tsx, comments/comments-context.tsx, lib/strategy/presence.ts
 * =============================================================
 */

"use client";

import { useComments } from "@/components/strategy/comments/comments-context";
import { joinNames } from "@/components/strategy/presence/element-editors";
import { usePresence } from "@/components/strategy/presence/presence-context";
import { getDictionary, interpolate } from "@/i18n";
import { initials, type Peer, peersOnStep } from "@/lib/strategy/presence";

const t = getDictionary();
const pr = t.strategy.presence;
const steps = t.strategy.steps;

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

// ==================== SOUS-COMPOSANTS ====================

/** Pastille ronde aux initiales d'un membre (le nom complet est lu à côté ou en infobulle). */
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-encre
        font-semibold text-white ${size === "sm" ? "h-6 w-6 text-[0.65rem]" : "h-8 w-8 text-xs"}`}
    >
      {initials(name)}
    </span>
  );
}

/** Ligne d'un membre présent : avatar, nom et, sur une étape, l'élément qu'il modifie. */
function PeerLine({ peer, stepNo }: { peer: Peer; stepNo: number | null }) {
  const comments = useComments();
  const editing = stepNo === null
    ? []
    : peer.editing.filter((item) => item.stepNo === stepNo);
  const label = editing
    .map((item) => comments?.labels[item.elementId])
    .find((value): value is string => Boolean(value));
  const where = stepNo === null && peer.steps.length > 0
    ? ` (${peer.steps.map((no) => steps[no as keyof typeof steps].title).join(", ")})`
    : "";

  return (
    <li className="flex items-center gap-2">
      <Avatar name={peer.name} />
      <span>
        <span className="font-medium">{peer.name}</span>
        {where}
        {label && <span className="text-ink-muted"> · {interpolate(pr.editing, { label })}</span>}
      </span>
    </li>
  );
}

// ==================== COMPOSANTS ====================

/**
 * Barre de présence : autres membres sur l'étape ouverte (ou dans l'étude, sur la vue
 * d'ensemble) et dernier enregistrement de l'étape par un autre membre.
 */
export function PresenceBar() {
  const presence = usePresence();
  if (!presence) return null;
  const { stepNo, peers, lastRemote, selfId } = presence;
  const shown = stepNo === null ? peers : peersOnStep(peers, stepNo);
  const remote = lastRemote && lastRemote.userId !== selfId ? lastRemote : null;
  if (shown.length === 0 && !remote) return null;

  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 text-small"
    >
      {shown.length > 0 && (
        <>
          <h2 className="font-semibold">{stepNo === null ? pr.inStudy : pr.onStep}</h2>
          <ul className="flex flex-col gap-1.5">
            {shown.map((peer) => (
              <PeerLine key={peer.userId} peer={peer} stepNo={stepNo} />
            ))}
          </ul>
        </>
      )}
      {remote && (
        <p className="text-ink-muted">
          {interpolate(pr.remoteSaved, {
            name: remote.name,
            time: TIME_FORMAT.format(new Date(remote.at)),
          })}
        </p>
      )}
    </section>
  );
}

/** Avatars des membres présents sur une étape (cartes de la vue d'ensemble). */
export function StepPeers({ stepNo }: { stepNo: number }) {
  const presence = usePresence();
  if (!presence) return null;
  const here = peersOnStep(presence.peers, stepNo);
  if (here.length === 0) return null;
  const names = joinNames(here.map((peer) => peer.name));

  return (
    <span className="flex items-center gap-2 text-small">
      <span className="flex -space-x-1.5">
        {here.slice(0, 4).map((peer) => (
          <Avatar key={peer.userId} name={peer.name} size="sm" />
        ))}
      </span>
      <span className="text-ink-muted">{interpolate(pr.stepPeers, { names })}</span>
    </span>
  );
}
