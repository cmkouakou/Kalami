/**
 * =============================================================
 *  Fichier    : admin-validation.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Lecture et contrôle des formulaires de l'administration du cours
 *               (v0.29.0) : réglages de vente, cohorte, accès accordés ; calendrier de
 *               diffusion (v0.33.0). La base refait les mêmes contrôles ; ceux-ci donnent
 *               un message clair avant l'envoi.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-19
 *  Dépendances: lib/admin/validation.ts, lib/cours/suivi.ts, lib/cours/calendrier.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import {
  estFuseau,
  estJour,
  PREFIXE_DATE,
  type Fuseau,
} from "@/lib/cours/calendrier";
import { MODULES } from "@/lib/cours/modules";
import { lireCourriels, MAX_COURRIELS } from "@/lib/cours/suivi";

// ==================== TYPES ====================

export type Resultat<T> =
  { ok: true; valeur: T } | { ok: false; erreur: string };

export type ReglagesSaisis = {
  p_on_sale: boolean;
  p_price_xof: number | null;
  p_price_eur: number | null;
  p_price_cad: number | null;
  p_book_id: string | null;
};

export type CohorteSaisie = {
  p_id: string | null;
  p_name: string;
  p_country: string | null;
  p_starts_on: string | null;
  p_ends_on: string | null;
  p_note: string | null;
};

export type AccordSaisi = {
  p_emails: string[];
  p_cohort_id: string | null;
  p_grant_book: boolean;
  p_note: string | null;
  /** Fragments non reconnus comme courriels, signalés à l'administrateur. */
  invalides: string[];
};

export type CalendrierSaisi = {
  p_cohort_id: string;
  p_enabled: boolean;
  p_read_ahead: boolean;
  p_timezone: Fuseau;
  /** Date AAAA-MM-JJ par module ou leçon (les champs vides sont omis). */
  p_items: Record<string, string>;
};

/** Modules et leçons du programme (seuls identifiants acceptés dans le calendrier). */
const ELEMENTS = new Set(
  MODULES.flatMap((m) => [m.id, ...m.lecons.map((l) => l.id)]),
);

// ==================== OUTILS ====================

/** Texte d'un champ, espaces retirés (chaîne vide si absent). */
function texte(fd: FormData, nom: string): string {
  const valeur = fd.get(nom);
  return typeof valeur === "string" ? valeur.trim() : "";
}

/**
 * Montant facultatif : vide → null ; virgule décimale acceptée.
 * @returns Nombre, null, ou undefined si la saisie est invalide
 */
function montant(
  fd: FormData,
  nom: string,
  entier: boolean,
): number | null | undefined {
  const brut = texte(fd, nom).replace(/\s/g, "").replace(",", ".");
  if (brut === "") return null;
  const motif = entier ? /^\d+$/ : /^\d+(\.\d{1,2})?$/;
  if (!motif.test(brut)) return undefined;
  const n = Number(brut);
  return n > 0 ? n : undefined;
}

/** Date AAAA-MM-JJ facultative (undefined si invalide). */
function dateFacultative(fd: FormData, nom: string): string | null | undefined {
  const brut = texte(fd, nom);
  if (brut === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(brut)) return undefined;
  return Number.isNaN(Date.parse(`${brut}T00:00:00Z`)) ? undefined : brut;
}

/** Identifiant facultatif d'un menu déroulant (vide → null, sinon UUID exigé). */
function idFacultatif(fd: FormData, nom: string): string | null | undefined {
  const brut = texte(fd, nom);
  if (brut === "") return null;
  return isUuid(brut) ? brut : undefined;
}

// ==================== RÉGLAGES ====================

/**
 * Réglages de vente : case « en vente », prix FCFA (entier), EUR et CAD (2 décimales),
 * livre associé facultatif.
 * @param fd - Données du formulaire
 */
export function lireReglages(fd: FormData): Resultat<ReglagesSaisis> {
  const xof = montant(fd, "price_xof", true);
  const eur = montant(fd, "price_eur", false);
  const cad = montant(fd, "price_cad", false);
  if (xof === undefined || eur === undefined || cad === undefined) {
    return { ok: false, erreur: "invalid_price" };
  }
  const livre = idFacultatif(fd, "book_id");
  if (livre === undefined) return { ok: false, erreur: "book_not_found" };
  const enVente = fd.get("on_sale") === "on";
  if (enVente && xof === null && eur === null && cad === null) {
    return { ok: false, erreur: "price_required" };
  }
  return {
    ok: true,
    valeur: {
      p_on_sale: enVente,
      p_price_xof: xof,
      p_price_eur: eur,
      p_price_cad: cad,
      p_book_id: livre,
    },
  };
}

// ==================== COHORTES ====================

/**
 * Cohorte : nom (1 à 120 caractères), pays ISO à 2 lettres, dates, note (1000 au plus).
 * @param fd - Données du formulaire
 */
export function lireCohorte(fd: FormData): Resultat<CohorteSaisie> {
  const id = idFacultatif(fd, "id");
  if (id === undefined) return { ok: false, erreur: "cohort_not_found" };
  const nom = texte(fd, "name");
  if (nom.length < 1 || nom.length > 120)
    return { ok: false, erreur: "invalid_name" };
  const pays = texte(fd, "country").toUpperCase();
  if (pays !== "" && !/^[A-Z]{2}$/.test(pays))
    return { ok: false, erreur: "invalid_country" };
  const debut = dateFacultative(fd, "starts_on");
  const fin = dateFacultative(fd, "ends_on");
  if (
    debut === undefined ||
    fin === undefined ||
    (debut && fin && fin < debut)
  ) {
    return { ok: false, erreur: "invalid_dates" };
  }
  const note = texte(fd, "note");
  if (note.length > 1000) return { ok: false, erreur: "invalid_note" };
  return {
    ok: true,
    valeur: {
      p_id: id,
      p_name: nom,
      p_country: pays || null,
      p_starts_on: debut,
      p_ends_on: fin,
      p_note: note || null,
    },
  };
}

// ==================== CALENDRIER DE DIFFUSION ====================

/**
 * Calendrier d'une cohorte : cases « activer » et « lecture en avance », fuseau, et une
 * date facultative par module ou leçon (champs « date:<identifiant> »).
 * @param fd - Données du formulaire
 */
export function lireCalendrierSaisi(fd: FormData): Resultat<CalendrierSaisi> {
  const id = texte(fd, "id");
  if (!isUuid(id)) return { ok: false, erreur: "cohort_not_found" };
  const fuseau = texte(fd, "timezone");
  if (!estFuseau(fuseau)) return { ok: false, erreur: "invalid_timezone" };
  const dates: Record<string, string> = {};
  for (const [nom, valeur] of fd.entries()) {
    if (!nom.startsWith(PREFIXE_DATE) || typeof valeur !== "string") continue;
    const element = nom.slice(PREFIXE_DATE.length);
    const jour = valeur.trim();
    if (jour === "") continue;
    if (!ELEMENTS.has(element) || !estJour(jour)) {
      return { ok: false, erreur: "invalid_schedule" };
    }
    dates[element] = jour;
  }
  return {
    ok: true,
    valeur: {
      p_cohort_id: id,
      p_enabled: fd.get("enabled") === "on",
      p_read_ahead: fd.get("read_ahead") === "on",
      p_timezone: fuseau,
      p_items: dates,
    },
  };
}

// ==================== ACCÈS ====================

/**
 * Accès accordés : liste de courriels collée (200 au plus), cohorte facultative,
 * case « donner aussi le livre », note interne (500 caractères au plus).
 * @param fd - Données du formulaire
 */
export function lireAccord(fd: FormData): Resultat<AccordSaisi> {
  const { valides, invalides } = lireCourriels(texte(fd, "emails"));
  if (valides.length === 0) return { ok: false, erreur: "no_emails" };
  if (valides.length > MAX_COURRIELS)
    return { ok: false, erreur: "too_many_emails" };
  const cohorte = idFacultatif(fd, "cohort_id");
  if (cohorte === undefined) return { ok: false, erreur: "cohort_not_found" };
  const note = texte(fd, "note");
  if (note.length > 500) return { ok: false, erreur: "invalid_note" };
  return {
    ok: true,
    valeur: {
      p_emails: valides,
      p_cohort_id: cohorte,
      p_grant_book: fd.get("grant_book") === "on",
      p_note: note || null,
      invalides,
    },
  };
}
