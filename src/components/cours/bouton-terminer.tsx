/**
 * =============================================================
 *  Fichier    : bouton-terminer.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Bouton « J'ai terminé cette leçon » : enregistre la fin de la leçon
 *               (première date conservée par le serveur), puis affiche l'état terminé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/actions.ts (terminerLecon), i18n/course.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { BADGE, BUTTON_PRIMARY } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";
import { terminerLecon } from "@/lib/cours/actions";

const t = getCourseDictionary();

type Props = { leconId: string; terminee: boolean };

/** Fin de leçon : bouton, puis pastille « Leçon terminée ». */
export function BoutonTerminer({ leconId, terminee }: Props) {
  const [fait, setFait] = useState(terminee);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();

  /** Enregistre la fin de la leçon. */
  const terminer = () => {
    setErreur(null);
    startEnvoi(async () => {
      const r = await terminerLecon(leconId);
      if (r.ok) setFait(true);
      else setErreur(r.error);
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {fait ? (
        <span className={BADGE}>{t.lecon.terminee}</span>
      ) : (
        <button
          type="button"
          onClick={terminer}
          disabled={envoi}
          className={BUTTON_PRIMARY}
        >
          {t.lecon.terminer}
        </button>
      )}
      <p
        role="status"
        aria-live="polite"
        className="text-small text-danger empty:hidden"
      >
        {erreur}
      </p>
    </div>
  );
}
