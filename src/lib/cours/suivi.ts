/**
 * =============================================================
 *  Fichier    : suivi.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Calculs purs de l'administration du cours (v0.29.0) : lecture d'une liste
 *               de courriels collée, synthèse et tri des apprenants, progression module
 *               par module et export CSV du suivi. Sans accès à la base : testable seul.
 *               v0.37.0 : meilleure note et essais au quiz de chaque module.
 *               v0.43.0 : décompte des tentatives repris de tentatives.ts.
 *               v0.45.0 : total des tentatives par apprenant (liste, tri, export CSV).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/modules.ts, lib/cours/tentatives.ts
 * =============================================================
 */

import { LECONS, MODULES } from "@/lib/cours/modules";
import { resultatsParExercice } from "@/lib/cours/tentatives";

// ==================== TYPES ====================

/** Apprenant tel que renvoyé par la fonction SQL admin_course_learners. */
export type LigneApprenant = {
  access_id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  source: "purchase" | "admin_grant";
  cohort_id: string | null;
  cohort_name: string | null;
  granted_at: string;
  completed: string[] | null;
  started: string[] | null;
  seconds: number | null;
  last_seen_at: string | null;
  average_score: number | string | null;
  exercises: number | null;
  /** Tentatives aux exercices et aux quiz (absentes avant la migration v0.45.0). */
  attempts_exercises?: number | null;
  attempts_quiz?: number | null;
};

/** Apprenant enrichi pour l'affichage et l'export. */
export type ApprenantSuivi = LigneApprenant & {
  terminees: number;
  enCours: number;
  pourcentage: number;
  moyenne: number | null;
  /** Tentatives aux exercices et aux quiz, examen exclu (null : inconnu). */
  tentatives: number | null;
};

export type CleTri =
  | "email"
  | "pourcentage"
  | "temps"
  | "derniere"
  | "moyenne"
  | "tentatives";

/** Nombre maximal de courriels par envoi (même limite que la fonction SQL). */
export const MAX_COURRIELS = 200;

const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDS_PROGRAMME = new Set(LECONS.map((l) => l.id));

// ==================== COURRIELS ====================

/**
 * Lit une liste de courriels collée (virgules, points-virgules, espaces ou retours à la
 * ligne ; formes « Nom <adresse> » acceptées). Doublons retirés, casse ignorée.
 *
 * @param texte - Texte collé par l'administrateur
 * @returns Adresses valides (dans l'ordre) et fragments invalides
 *
 * Exemple : lireCourriels("a@x.ci; Awa <B@x.ci>\nawa.x.ci") → { valides: [a@x.ci, b@x.ci],
 *           invalides: ["awa.x.ci"] } (les mots d'un nom affiché sont ignorés)
 */
export function lireCourriels(texte: string): {
  valides: string[];
  invalides: string[];
} {
  const valides: string[] = [];
  const invalides: string[] = [];
  const vus = new Set<string>();
  const morceaux = texte
    .replace(/[<>]/g, " ")
    .split(/[\s,;]+/)
    .map((m) => m.trim().replace(/^["'(]+|["').]+$/g, ""))
    .filter((m) => m.length > 0);

  for (const morceau of morceaux) {
    if (!morceau.includes("@")) {
      // Mot d'un nom affiché (« Awa Koné <awa@x.ci> ») : ignoré s'il est entouré d'adresses
      if (!/^[\p{L}'-]+$/u.test(morceau)) invalides.push(morceau);
      continue;
    }
    const adresse = morceau.toLowerCase();
    if (!COURRIEL.test(adresse) || adresse.length > 320) {
      invalides.push(morceau);
    } else if (!vus.has(adresse)) {
      vus.add(adresse);
      valides.push(adresse);
    }
  }
  return { valides, invalides };
}

// ==================== SYNTHÈSE ====================

/**
 * Convertit une moyenne (numeric renvoyé en texte par PostgREST) en nombre.
 * @param valeur - Valeur lue
 */
function moyenneDe(valeur: number | string | null): number | null {
  if (valeur === null) return null;
  const n = Number(valeur);
  return Number.isFinite(n) ? n : null;
}

/**
 * Total des tentatives d'un apprenant (exercices + quiz), ou null si la fonction SQL
 * ne renvoie pas encore ces colonnes (migration v0.45.0 non appliquée).
 * @param ligne - Ligne de admin_course_learners
 */
function totalDe(ligne: LigneApprenant): number | null {
  const { attempts_exercises: ex, attempts_quiz: quiz } = ligne;
  if (typeof ex !== "number" || typeof quiz !== "number") return null;
  return ex + quiz;
}

/**
 * Ajoute à chaque apprenant ses leçons terminées et en cours (programme actuel
 * seulement), son pourcentage d'achèvement, sa moyenne et son total de tentatives.
 * @param lignes - Lignes de admin_course_learners
 */
export function enrichir(lignes: LigneApprenant[]): ApprenantSuivi[] {
  const total = LECONS.length;
  return lignes.map((ligne) => {
    const terminees = (ligne.completed ?? []).filter((id) =>
      IDS_PROGRAMME.has(id),
    ).length;
    const ouvertes = (ligne.started ?? []).filter((id) =>
      IDS_PROGRAMME.has(id),
    ).length;
    return {
      ...ligne,
      terminees,
      enCours: Math.max(0, ouvertes - terminees),
      pourcentage: total === 0 ? 0 : Math.floor((terminees / total) * 100),
      moyenne: moyenneDe(ligne.average_score),
      tentatives: totalDe(ligne),
    };
  });
}

/**
 * Valeur de tri d'un apprenant (les valeurs absentes passent en dernier).
 * @param a - Apprenant
 * @param cle - Colonne de tri
 */
function valeurTri(a: ApprenantSuivi, cle: CleTri): string | number | null {
  if (cle === "email") return a.email ?? null;
  if (cle === "pourcentage") return a.pourcentage;
  if (cle === "temps") return a.seconds ?? 0;
  if (cle === "derniere")
    return a.last_seen_at ? Date.parse(a.last_seen_at) : null;
  if (cle === "tentatives") return a.tentatives;
  return a.moyenne;
}

/**
 * Trie les apprenants sans modifier le tableau reçu.
 * @param apprenants - Apprenants enrichis
 * @param cle - Colonne de tri
 * @param sens - « asc » ou « desc »
 */
export function trier(
  apprenants: ApprenantSuivi[],
  cle: CleTri,
  sens: "asc" | "desc",
): ApprenantSuivi[] {
  const facteur = sens === "asc" ? 1 : -1;
  return [...apprenants].sort((x, y) => {
    const a = valeurTri(x, cle);
    const b = valeurTri(y, cle);
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    if (typeof a === "string" && typeof b === "string") {
      return a.localeCompare(b, "fr") * facteur;
    }
    return (Number(a) - Number(b)) * facteur;
  });
}

/**
 * Lit la clé et le sens de tri d'une adresse (?tri=…&sens=…), avec des valeurs sûres.
 * @param tri - Paramètre « tri »
 * @param sens - Paramètre « sens »
 */
export function lireTri(
  tri: unknown,
  sens: unknown,
): { cle: CleTri; sens: "asc" | "desc" } {
  const cles: CleTri[] = [
    "email",
    "pourcentage",
    "temps",
    "derniere",
    "moyenne",
    "tentatives",
  ];
  const cle = cles.find((c) => c === tri) ?? "email";
  const parDefaut = cle === "email" ? "asc" : "desc";
  return { cle, sens: sens === "asc" || sens === "desc" ? sens : parDefaut };
}

// ==================== FICHE APPRENANT ====================

export type ProgressionLecon = {
  lesson_id: string;
  started_at: string;
  completed_at: string | null;
  seconds: number;
};

export type Tentative = {
  exercise_id: string;
  score: number | string;
  created_at: string;
};

/** Ligne d'une leçon dans la fiche apprenant. */
export type LeconFiche = {
  id: string;
  numero: number;
  titre: string;
  etat: "terminee" | "enCours" | "aFaire";
  secondes: number;
  /** Meilleure note par exercice de la leçon (identifiant → note). */
  notes: { exercice: string; meilleure: number; essais: number }[];
};

export type ModuleFiche = {
  id: string;
  numero: number;
  titre: string;
  terminees: number;
  total: number;
  secondes: number;
  lecons: LeconFiche[];
  /** Meilleure note et essais au quiz du module (null : jamais tenté). */
  quiz: { meilleure: number; essais: number } | null;
};

/**
 * Progression module par module d'un apprenant : état et temps de chaque leçon, et
 * meilleure note de chaque exercice (« m01-l01-e2 » est rattaché à « m01-l01 »).
 *
 * @param progression - Lignes de course_lesson_progress
 * @param tentatives - Lignes de course_attempts
 */
export function ficheParModule(
  progression: ProgressionLecon[],
  tentatives: Tentative[],
): ModuleFiche[] {
  const parLecon = new Map(progression.map((p) => [p.lesson_id, p]));
  const notes = resultatsParExercice(tentatives);

  return MODULES.map((mod) => {
    const lecons: LeconFiche[] = mod.lecons.map((lecon) => {
      const p = parLecon.get(lecon.id);
      const etat = !p ? "aFaire" : p.completed_at ? "terminee" : "enCours";
      const prefixe = `${lecon.id}-e`;
      const notesLecon = [...notes.entries()]
        .filter(([id]) => id.startsWith(prefixe))
        .map(([exercice, n]) => ({ exercice, ...n }))
        .sort((a, b) =>
          a.exercice.localeCompare(b.exercice, "fr", { numeric: true }),
        );
      return {
        id: lecon.id,
        numero: lecon.numero,
        titre: lecon.titre,
        etat,
        secondes: p?.seconds ?? 0,
        notes: notesLecon,
      };
    });
    return {
      id: mod.id,
      numero: mod.numero,
      titre: mod.titre,
      terminees: lecons.filter((l) => l.etat === "terminee").length,
      total: lecons.length,
      secondes: lecons.reduce((s, l) => s + l.secondes, 0),
      lecons,
      quiz: notes.get(`${mod.id}-quiz`) ?? null,
    };
  });
}

// ==================== EXPORT CSV ====================

/**
 * Cellule CSV : guillemets doublés, et apostrophe devant une formule (=, +, -, @) pour
 * qu'un tableur ne l'exécute pas.
 * @param valeur - Contenu de la cellule
 */
export function celluleCsv(valeur: string | number | null): string {
  if (valeur === null) return "";
  let texte = String(valeur);
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return /[";\n\r]/.test(texte) || texte !== String(valeur)
    ? `"${texte.replace(/"/g, '""')}"`
    : texte;
}

/** En-têtes du fichier de suivi. */
export const ENTETES_CSV = [
  "Courriel",
  "Nom",
  "Cohorte",
  "Origine",
  "Accès depuis",
  "Leçons terminées",
  "Achèvement (%)",
  "Temps (min)",
  "Dernière activité",
  "Moyenne (/100)",
  "Exercices notés",
  "Tentatives aux exercices",
  "Tentatives aux quiz",
] as const;

/**
 * Fichier CSV du suivi (séparateur « ; » et marque UTF-8, lus tels quels par Excel
 * en français).
 * @param apprenants - Apprenants enrichis
 * @returns Contenu du fichier
 */
export function exporterCsv(apprenants: ApprenantSuivi[]): string {
  const jour = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
  const lignes = apprenants.map((a) =>
    [
      a.email,
      a.display_name,
      a.cohort_name,
      a.source === "purchase" ? "Achat" : "Accès accordé",
      jour(a.granted_at),
      a.terminees,
      a.pourcentage,
      Math.round((a.seconds ?? 0) / 60),
      jour(a.last_seen_at),
      a.moyenne === null ? null : String(a.moyenne).replace(".", ","),
      a.exercises ?? 0,
      a.attempts_exercises ?? null,
      a.attempts_quiz ?? null,
    ]
      .map(celluleCsv)
      .join(";"),
  );
  return `﻿${[ENTETES_CSV.join(";"), ...lignes].join("\r\n")}\r\n`;
}
