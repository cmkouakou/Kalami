/**
 * =============================================================
 *  Fichier    : sans-acces.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Encart affiché à un membre connecté qui n'a pas encore accès au cours :
 *               comment l'obtenir, et le courriel du compte à transmettre au formateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: i18n/course.ts
 * =============================================================
 */

import { PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";

const t = getCourseDictionary();

/** Encart « réservé aux inscrits ». */
export function SansAcces({ email }: { email: string | null }) {
  return (
    <section className={`${PANEL_SAND} flex flex-col gap-3 p-6`}>
      <h2 className="font-serif text-h2">{t.sansAcces.titre}</h2>
      <p>{t.sansAcces.texte}</p>
      {email && (
        <p className="text-small text-ink-muted">
          {interpolate(t.sansAcces.compte, { email })}
        </p>
      )}
    </section>
  );
}
