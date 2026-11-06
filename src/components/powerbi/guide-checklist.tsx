/**
 * =============================================================
 *  Fichier    : guide-checklist.tsx
 *  Projet     : Kalami Données
 *  Description: Cases à cocher de fin de sprint. La case change tout de suite à l'écran,
 *               puis l'action serveur l'enregistre ; en cas d'échec, elle revient à son
 *               état précédent et un message l'explique. Si l'enregistrement n'est pas
 *               disponible (table absente), les cases restent utilisables sans mémoire.
 *  Auteur     : Claude Marcel
 *               v1.1 (v0.21.0) : liste .checklist de la charte powerbi4you.
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/guide/actions.ts, inline-text.tsx, i18n
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { getPowerbiDictionary } from "@/i18n/powerbi";
import { basculerCase } from "@/lib/powerbi/guide/actions";

import { InlineText } from "./inline-text";

const d = getPowerbiDictionary();

type Props = {
  items: { id: string; texte: string }[];
  cochesInitiaux: string[];
  enregistrable: boolean;
};

/** Liste de cases du sprint, enregistrées sur le compte du lecteur. */
export function GuideChecklist({ items, cochesInitiaux, enregistrable }: Props) {
  const [coches, setCoches] = useState<ReadonlySet<string>>(() => new Set(cochesInitiaux));
  const [erreur, setErreur] = useState(false);
  const [, startTransition] = useTransition();

  /** Applique un état à une case, à l'écran seulement. */
  const appliquer = (id: string, coche: boolean) => {
    setCoches((avant) => {
      const apres = new Set(avant);
      if (coche) apres.add(id);
      else apres.delete(id);
      return apres;
    });
  };

  /** Bascule une case, puis l'enregistre si possible. */
  const basculer = (id: string, coche: boolean) => {
    appliquer(id, coche);
    setErreur(false);
    if (!enregistrable) return;
    startTransition(async () => {
      try {
        const { ok } = await basculerCase(id, coche);
        if (!ok) throw new Error("refus");
      } catch {
        appliquer(id, !coche);
        setErreur(true);
      }
    });
  };

  return (
    <>
      <ul className="checklist">
        {items.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              id={item.id}
              checked={coches.has(item.id)}
              onChange={(e) => basculer(item.id, e.target.checked)}
            />
            <label htmlFor={item.id}>
              <InlineText texte={item.texte} />
            </label>
          </li>
        ))}
      </ul>
      {!enregistrable && <p className="discret">{d.chantier.horsLigne}</p>}
      <p role="status" aria-live="polite" className="statut">
        {erreur ? d.chantier.erreur : ""}
      </p>
    </>
  );
}
