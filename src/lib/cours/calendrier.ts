/**
 * =============================================================
 *  Fichier    : calendrier.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Diffusion programmée par cohorte (v0.33.0), fonctions pures : état de
 *               chaque leçon (ouverte, lecture en avance, fermée) d'après le calendrier
 *               de la cohorte, dates dans le fuseau de la cohorte, générateur de
 *               calendrier (date de départ et rythme). Sans calendrier, tout est ouvert.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/modules.ts
 * =============================================================
 */

import { MODULES } from "@/lib/cours/modules";

// ==================== TYPES ====================

/** Fuseaux proposés : Abidjan (UTC, sans heure d'été) et Montréal. */
export const FUSEAUX = ["Africa/Abidjan", "America/Toronto"] as const;
export type Fuseau = (typeof FUSEAUX)[number];

/** Calendrier d'une cohorte programmée, tel que lu en base. */
export type Calendrier = {
  fuseau: Fuseau;
  lectureAvance: boolean;
  /** Instant d'ouverture (ISO) par module « m05 » ou leçon « m05-l02 ». */
  dates: Record<string, string>;
};

export type Etat = "ouverte" | "apercu" | "fermee";

/** État d'une leçon pour l'apprenant ; ouvreLe : instant ISO, null si sans date. */
export type EtatDiffusion = { etat: Etat; ouvreLe: string | null };

/** Préfixe des champs de date du formulaire d'admin : « date:m05 », « date:m05-l02 ». */
export const PREFIXE_DATE = "date:";

/** Rythme du générateur : un module ou une leçon à chaque échéance. */
export type Granularite = "module" | "lecon";

// ==================== LECTURE ====================

/** Vrai si la valeur est un fuseau proposé. */
export function estFuseau(valeur: unknown): valeur is Fuseau {
  return typeof valeur === "string" && (FUSEAUX as readonly string[]).includes(valeur);
}

/**
 * Convertit la réponse de course_my_calendar ; null (ou réponse inattendue) : pas de
 * calendrier, donc tout est ouvert.
 * @param brut - Objet { timezone, read_ahead, items } renvoyé par la base
 */
export function lireCalendrier(brut: unknown): Calendrier | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { timezone, read_ahead, items } = brut as Record<string, unknown>;
  if (!estFuseau(timezone) || typeof items !== "object" || items === null) return null;
  const dates: Record<string, string> = {};
  for (const [cle, valeur] of Object.entries(items)) {
    if (typeof valeur === "string" && !Number.isNaN(Date.parse(valeur))) {
      dates[cle] = valeur;
    }
  }
  return { fuseau: timezone, lectureAvance: read_ahead === true, dates };
}

// ==================== ÉTATS ====================

/**
 * Date d'ouverture effective d'une leçon : la sienne, sinon celle de son module.
 * @param cal     - Calendrier de la cohorte
 * @param leconId - Identifiant « m05-l02 »
 */
export function dateOuverture(cal: Calendrier, leconId: string): string | null {
  return cal.dates[leconId] ?? cal.dates[leconId.slice(0, 3)] ?? null;
}

/**
 * État de chaque leçon. Une leçon est ouverte sans date ou une fois sa date passée.
 * Avec la lecture en avance, la prochaine leçon à ouvrir (date la plus proche, puis
 * ordre du programme) parmi les candidates passe en « aperçu ».
 *
 * @param cal        - Calendrier, ou null (tout est ouvert)
 * @param maintenant - Instant de référence (millisecondes)
 * @param lecons     - Identifiants des leçons, dans l'ordre du programme
 * @param candidate  - Leçons pouvant être lues en avance (ex. : leçons rédigées)
 * @returns État par identifiant de leçon
 *
 * Exemple : etatsDiffusion(cal, Date.now(), LECONS.map((l) => l.id), estRedigee)
 */
export function etatsDiffusion(
  cal: Calendrier | null,
  maintenant: number,
  lecons: readonly string[],
  candidate: (id: string) => boolean = () => true,
): Map<string, EtatDiffusion> {
  const etats = new Map<string, EtatDiffusion>();
  let prochaine: { id: string; quand: number } | null = null;
  for (const id of lecons) {
    const ouvreLe = cal ? dateOuverture(cal, id) : null;
    const quand = ouvreLe ? Date.parse(ouvreLe) : Number.NaN;
    const fermee = ouvreLe !== null && quand > maintenant;
    etats.set(id, { etat: fermee ? "fermee" : "ouverte", ouvreLe });
    if (fermee && candidate(id) && (!prochaine || quand < prochaine.quand)) {
      prochaine = { id, quand };
    }
  }
  if (cal?.lectureAvance && prochaine) {
    const e = etats.get(prochaine.id);
    if (e) etats.set(prochaine.id, { ...e, etat: "apercu" });
  }
  return etats;
}

// ==================== DATES ====================

/** Formats de date par fuseau, créés une seule fois. */
const FORMATS = new Map<string, Intl.DateTimeFormat>();

/**
 * Format mis en cache.
 * @param locale  - « fr-FR » (lisible) ou « en-CA » (AAAA-MM-JJ)
 * @param fuseau  - Fuseau de la cohorte
 */
function format(locale: string, fuseau: Fuseau): Intl.DateTimeFormat {
  const cle = `${locale}|${fuseau}`;
  let f = FORMATS.get(cle);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, {
      timeZone: fuseau,
      ...(locale === "en-CA"
        ? { year: "numeric", month: "2-digit", day: "2-digit" }
        : { dateStyle: "long" }),
    });
    FORMATS.set(cle, f);
  }
  return f;
}

/**
 * Date lisible d'une ouverture (« 3 décembre 2026 »), dans le fuseau de la cohorte.
 * @param iso    - Instant d'ouverture
 * @param fuseau - Fuseau de la cohorte
 */
export function dateLisible(iso: string, fuseau: Fuseau): string {
  return format("fr-FR", fuseau).format(new Date(iso));
}

/**
 * Jour (AAAA-MM-JJ) d'un instant dans le fuseau de la cohorte (champ de date de l'admin).
 * @param iso    - Instant d'ouverture
 * @param fuseau - Fuseau de la cohorte
 */
export function jourDansFuseau(iso: string, fuseau: Fuseau): string {
  return format("en-CA", fuseau).format(new Date(iso));
}

/**
 * Vrai si le texte est une date réelle AAAA-MM-JJ (le 30 février est refusé).
 * @param jour - Texte saisi
 */
export function estJour(jour: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return false;
  const d = new Date(`${jour}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === jour;
}

/**
 * Ajoute des jours à une date AAAA-MM-JJ.
 * @param jour  - Date de départ
 * @param jours - Nombre de jours (peut être nul)
 */
export function ajouterJours(jour: string, jours: number): string {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

// ==================== GÉNÉRATEUR ====================

/**
 * Propose un calendrier : le premier module (ou la première leçon) ouvre à la date de
 * départ, puis un nouveau tous les « intervalle » jours. Par module, seules les dates des
 * modules sont remplies ; par leçon, seules celles des leçons.
 *
 * @param debut       - Date de départ AAAA-MM-JJ
 * @param intervalle  - Jours entre deux ouvertures (1 à 60)
 * @param granularite - « module » ou « lecon »
 * @returns Dates par identifiant, ou null si la saisie est invalide
 *
 * Exemple : genererCalendrier("2026-12-01", 7, "module") → { m01: "2026-12-01", ... }
 */
export function genererCalendrier(
  debut: string,
  intervalle: number,
  granularite: Granularite,
): Record<string, string> | null {
  if (!estJour(debut) || !Number.isInteger(intervalle)) return null;
  if (intervalle < 1 || intervalle > 60) return null;
  const ids =
    granularite === "module"
      ? MODULES.map((m) => m.id)
      : MODULES.flatMap((m) => m.lecons.map((l) => l.id));
  return Object.fromEntries(
    ids.map((id, i) => [id, ajouterJours(debut, i * intervalle)]),
  );
}
