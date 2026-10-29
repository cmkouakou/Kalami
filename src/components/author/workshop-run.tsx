/**
 * =============================================================
 *  Fichier    : workshop-run.tsx
 *  Projet     : Kalami
 *  Description: Bouton qui lance le relecteur ou le conseiller de style de l'atelier sur un
 *               chapitre (v0.15.1), ou la rédaction de la fiche du livre (v0.15.2) ;
 *               l'analyse peut durer jusqu'à deux minutes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { runWorkshopTool } from "@/lib/author/workshop/actions";
import type { WorkshopTool } from "@/lib/author/workshop/run";
import { getWorkshopDictionary } from "@/i18n/workshop";

const w = getWorkshopDictionary();

type WorkshopRunProps = {
  bookId: string;
  /** null pour la fiche du livre */
  chapterId: string | null;
  tool: WorkshopTool;
  /** Une analyse existe déjà : le bouton devient « Relancer » */
  done: boolean;
  disabled?: boolean;
};

/** Lance une analyse ; la page est rafraîchie par l'action en cas de succès. */
export function WorkshopRun({ bookId, chapterId, tool, done, disabled }: WorkshopRunProps) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const run = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await runWorkshopTool(bookId, chapterId, tool);
      if (!result.ok) setError(result.error);
    });
  };

  const label = tool === "listing"
    ? (done ? w.listing.rerun : w.listing.run)
    : interpolate(done ? w.tools.rerun : w.tools.run, { tool: w.tools.names[tool] });
  const running = tool === "listing" ? w.listing.running : w.tools.running;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy || disabled}
        className={`${done ? BUTTON_SECONDARY : BUTTON_PRIMARY} w-fit`}
      >
        {label}
      </button>
      {busy && <p role="status" className="text-small text-ink-muted">{running}</p>}
      <FormMessage error={error} />
    </div>
  );
}
