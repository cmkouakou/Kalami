/**
 * =============================================================
 *  Fichier    : workshop-run.tsx
 *  Projet     : Kalami
 *  Description: Bouton qui lance le relecteur ou le conseiller de style de l'atelier sur un
 *               chapitre (v0.15.1) ; l'analyse peut durer jusqu'à deux minutes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { runWorkshopTool } from "@/lib/author/workshop/actions";
import type { ChapterTool } from "@/lib/author/workshop/suggestions";

const w = getDictionary().workshop.tools;

type WorkshopRunProps = {
  bookId: string;
  chapterId: string;
  tool: ChapterTool;
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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy || disabled}
        className={`${done ? BUTTON_SECONDARY : BUTTON_PRIMARY} w-fit`}
      >
        {interpolate(done ? w.rerun : w.run, { tool: w.names[tool] })}
      </button>
      {busy && <p role="status" className="text-small text-ink-muted">{w.running}</p>}
      <FormMessage error={error} />
    </div>
  );
}
