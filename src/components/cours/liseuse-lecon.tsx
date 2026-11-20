/**
 * =============================================================
 *  Fichier    : liseuse-lecon.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Conteneur client d'une leçon : barre de lecture à voix haute, zone de
 *               texte (contenu rendu par le serveur), surlignages dessinés dans les blocs,
 *               couche d'annotations, mesure du temps de formation et messages.
 *               v1.1 (v0.38.2) : une adresse « #annotation-<id> » (venue de la page Mes
 *               annotations) amène le passage à l'écran et le signale un instant.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: couche-annotations.tsx, use-battement.ts,
 *               components/reader/{highlight-dom,use-read-aloud}
 * =============================================================
 */

"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { paintHighlights } from "@/components/reader/highlight-dom";
import { useReadAloud } from "@/components/reader/use-read-aloud";
import { BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";
import type { Highlight } from "@/lib/reader/types";

import { CoucheAnnotations } from "./couche-annotations";
import { useBattement } from "./use-battement";

const t = getCourseDictionary();

/** Durée d'affichage d'un message (ms). */
const DUREE_AVIS = 5000;

type Props = {
  leconId: string;
  adresse: string;
  connecte: boolean;
  surlignages: Highlight[];
  children: ReactNode;
};

/** Blocs de la zone, rangés par indice data-bloc. */
function blocsDe(zone: HTMLElement): HTMLElement[] {
  const blocs: HTMLElement[] = [];
  zone.querySelectorAll<HTMLElement>("[data-bloc]").forEach((el) => {
    blocs[Number(el.dataset.bloc)] = el;
  });
  return blocs;
}

/** Marque le bloc lu à voix haute (null : aucun) et l'amène à l'écran. */
function marquerLu(zone: HTMLElement | null, n: number | null): void {
  if (!zone) return;
  zone
    .querySelectorAll("[data-lu]")
    .forEach((el) => el.removeAttribute("data-lu"));
  if (n === null) return;
  const bloc = zone.querySelector<HTMLElement>(`[data-bloc="${n}"]`);
  if (!bloc) return;
  bloc.setAttribute("data-lu", "");
  bloc.scrollIntoView({ block: "center", behavior: "smooth" });
}

/** Leçon interactive : lecture, annotations, temps de formation. */
export function LiseuseLecon({
  leconId,
  adresse,
  connecte,
  surlignages,
  children,
}: Props) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [liste, setListe] = useState(surlignages);
  const [avis, setAvis] = useState<string | null>(null);

  const surBloc = useCallback((n: number) => marquerLu(zoneRef.current, n), []);
  const surFin = useCallback(() => marquerLu(zoneRef.current, null), []);
  const voix = useReadAloud("fr", surBloc, surFin);

  useBattement(leconId, voix.status === "speaking");

  // Redessine les surlignages à chaque changement de la liste
  useEffect(() => {
    if (zoneRef.current) paintHighlights(zoneRef.current, liste);
  }, [liste]);

  // Arrivée depuis « Mes annotations » : le passage visé est amené à l'écran
  useEffect(() => {
    const id = /^#annotation-([0-9a-f-]{36})$/.exec(window.location.hash)?.[1];
    const zone = zoneRef.current;
    if (!id || !zone) return;
    const marque = zone.querySelector<HTMLElement>(`mark[data-hl="${id}"]`);
    if (!marque) return;
    marque.scrollIntoView({ block: "center", behavior: "smooth" });
    marque.dataset.cible = "";
    const minuterie = window.setTimeout(() => delete marque.dataset.cible, DUREE_AVIS);
    return () => window.clearTimeout(minuterie);
  }, []);

  // Le message s'efface seul
  useEffect(() => {
    if (!avis) return;
    const minuterie = window.setTimeout(() => setAvis(null), DUREE_AVIS);
    return () => window.clearTimeout(minuterie);
  }, [avis]);

  // Quitter la leçon arrête la lecture
  const { stop } = voix;
  useEffect(() => stop, [stop]);

  /** Lit la leçon depuis le début. */
  function ecouter() {
    const zone = zoneRef.current;
    if (!zone) return;
    // Array.from comble les trous éventuels (indice absent : texte vide)
    const textes = Array.from(
      blocsDe(zone),
      (el) => el?.textContent?.trim() ?? "",
    );
    voix.start(textes, 0);
  }

  /** Arrête la lecture et retire la marque. */
  function arreter() {
    voix.stop();
    marquerLu(zoneRef.current, null);
  }

  return (
    <div className="cours-lecon flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {voix.supported && voix.status === "idle" && (
          <button type="button" onClick={ecouter} className={BUTTON_SECONDARY}>
            {t.lecon.ecouter}
          </button>
        )}
        {voix.status === "speaking" && (
          <button
            type="button"
            onClick={voix.pause}
            className={BUTTON_SECONDARY}
          >
            {t.lecon.pause}
          </button>
        )}
        {voix.status === "paused" && (
          <button
            type="button"
            onClick={voix.resume}
            className={BUTTON_SECONDARY}
          >
            {t.lecon.reprendre}
          </button>
        )}
        {voix.status !== "idle" && (
          <button type="button" onClick={arreter} className={BUTTON_TERTIARY}>
            {t.lecon.arreter}
          </button>
        )}
        <p className="text-small text-ink-muted">{t.lecon.aide}</p>
      </div>

      <div ref={zoneRef}>{children}</div>

      <CoucheAnnotations
        zoneRef={zoneRef}
        leconId={leconId}
        adresse={adresse}
        connecte={connecte}
        surlignages={liste}
        onChange={setListe}
        onAvis={setAvis}
      />

      <p
        role="status"
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-lg bg-ink px-4 py-3
          text-small text-paper shadow-pop empty:hidden"
      >
        {avis}
      </p>
    </div>
  );
}
