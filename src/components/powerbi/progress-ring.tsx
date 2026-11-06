/**
 * =============================================================
 *  Fichier    : progress-ring.tsx
 *  Projet     : Kalami Données
 *  Description: Anneau d'avancement (sprints terminés sur le total), repris du guide
 *               d'origine. Le chiffre est aussi écrit en texte à côté : l'anneau est
 *               décoratif pour les lecteurs d'écran.
 *  Auteur     : Claude Marcel
 *               v1.1 (v0.21.0) : couleurs et épaisseur de la charte powerbi4you.
 *  Version    : 1.1
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
    <svg viewBox="0 0 36 36" className="progress-ring" aria-hidden="true">
      <circle cx={18} cy={18} r={RAYON} fill="none" strokeWidth={3.5} className="fond" />
      <circle
        cx={18}
        cy={18}
        r={RAYON}
        fill="none"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray={CIRCONFERENCE}
        strokeDashoffset={CIRCONFERENCE * (1 - part)}
        className="avance"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}
