/**
 * =============================================================
 *  Fichier    : progress-ring.tsx
 *  Projet     : Kalami Données
 *  Description: Anneau d'avancement (sprints terminés sur le total), repris du guide
 *               d'origine. Le chiffre est aussi écrit en texte à côté : l'anneau est
 *               décoratif pour les lecteurs d'écran.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

/** Rayon du cercle, en unités du viewBox (36 × 36). */
const RAYON = 15.5;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

/** Anneau de progression. */
export function ProgressRing({ valeur, total }: { valeur: number; total: number }) {
  const part = total > 0 ? Math.min(valeur / total, 1) : 0;
  return (
    <svg viewBox="0 0 36 36" className="size-9 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx={18} cy={18} r={RAYON} fill="none" strokeWidth={3} className="stroke-sand" />
      <circle
        cx={18}
        cy={18}
        r={RAYON}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={CIRCONFERENCE}
        strokeDashoffset={CIRCONFERENCE * (1 - part)}
        className="stroke-success"
      />
    </svg>
  );
}
