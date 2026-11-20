/**
 * =============================================================
 *  Fichier    : atelier-ia.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Ateliers corrigés par l'IA (v0.40.0). L'apprenant choisit sa propre
 *               situation, y applique la méthode de la leçon, puis demande une correction
 *               à Claude. Ce fichier définit les ateliers (champs, critères de
 *               correction), valide la saisie et nettoie la correction renvoyée. Le schéma
 *               envoyé à l'API reste sans bornes (les sorties structurées n'acceptent pas
 *               ces contraintes) ; le nettoyage tronque et écarte le reste.
 *               Utilisable côté client (affichage d'une correction enregistrée).
 *               Identifiant stable : « <leçon>-a<n> » ; ne jamais renommer un atelier
 *               publié (les corrections y sont rattachées).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: zod
 * =============================================================
 */

import { z } from "zod";

// ==================== CONSTANTES ====================

/** Corrections permises par apprenant et par atelier (vérifié aussi en SQL). */
export const MAX_CORRECTIONS = 5;

/** Modèle chargé des corrections. */
export const MODELE_ATELIER = "claude-haiku-5-5";

const MAX_RESUME = 1200;
const MAX_EXPLICATION = 1200;
const MAX_CONSEIL = 800;
const MAX_POINTS = 8;

// ==================== DÉFINITION D'UN ATELIER ====================

/** Champ de saisie libre. */
export type ChampTexte = {
  type: "texte";
  id: string;
  libelle: string;
  aide: string;
  min: number;
  max: number;
};

/** Champ à choix unique. */
export type ChampChoix = {
  type: "choix";
  id: string;
  libelle: string;
  options: { valeur: string; libelle: string }[];
};

export type ChampAtelier = ChampTexte | ChampChoix;

/** Atelier complet : affichage et consignes de correction. */
export type AtelierIA = {
  /** Identifiant complet et stable (« m01-l02-a1 »). */
  id: string;
  titre: string;
  consigne: string;
  champs: ChampAtelier[];
  /** Méthode de la leçon, rappelée au correcteur. */
  methode: string;
};

const FAMILLES = [
  { valeur: "strategique", libelle: "Stratégique" },
  { valeur: "tactique", libelle: "Tactique" },
  { valeur: "operationnelle", libelle: "Opérationnelle" },
];

/**
 * Crée un champ texte de justification.
 * @param id      - Identifiant du champ
 * @param libelle - Question posée
 * @param aide    - Indication sous le champ
 */
const justification = (id: string, libelle: string, aide: string): ChampTexte => ({
  type: "texte",
  id,
  libelle,
  aide,
  min: 15,
  max: 600,
});

/** Ateliers du cours, par identifiant complet. */
export const ATELIERS: Record<string, AtelierIA> = {
  "m01-l02-a1": {
    id: "m01-l02-a1",
    titre: "Atelier : votre décision passe-t-elle les quatre questions ?",
    consigne:
      "Choisissez une décision réelle : celle de votre entreprise, de votre employeur, " +
      "d'une association ou d'une entreprise que vous connaissez. Répondez aux quatre " +
      "questions, classez la décision, puis demandez une correction. L'IA valide votre " +
      "raisonnement ou le corrige en expliquant pourquoi.",
    champs: [
      {
        type: "texte",
        id: "decision",
        libelle: "La décision à évaluer",
        aide:
          "Décrivez-la en une ou deux phrases, avec son contexte " +
          "(ex. : ouvrir une deuxième boutique à Yamoussoukro l'an prochain).",
        min: 15,
        max: 500,
      },
      justification(
        "horizon",
        "Horizon : ses effets dureront-ils quelques jours ou plusieurs années ?",
        "Dites combien de temps et pourquoi.",
      ),
      justification(
        "reversibilite",
        "Réversibilité : si l'on se trompe, peut-on revenir en arrière à faible coût ?",
        "Que coûterait un retour en arrière ?",
      ),
      justification(
        "ampleur",
        "Ampleur : engage-t-elle une part importante de l'argent, du temps ou des talents ?",
        "Donnez un ordre de grandeur si vous le pouvez.",
      ),
      justification(
        "position",
        "Position : modifie-t-elle ce que l'on offre, à qui, ou face à quels concurrents ?",
        "Qu'est-ce qui change pour les clients ou les concurrents ?",
      ),
      {
        type: "choix",
        id: "famille",
        libelle: "Votre conclusion : cette décision est…",
        options: FAMILLES,
      },
    ],
    methode:
      "Leçon 1.2 du cours : distinguer une décision stratégique, tactique ou " +
      "opérationnelle. Décision stratégique : engage l'organisation dans la durée, " +
      "mobilise des ressources importantes, est difficile à défaire et change sa position " +
      "face à son environnement (ce qu'elle offre, à qui, avec quels moyens). Décision " +
      "tactique : traduit la stratégie en programmes de quelques mois (budgets, " +
      "recrutements, campagnes, calendriers), ajustable, prise par les cadres. Décision " +
      "opérationnelle : règle le quotidien (jours), facile à corriger, prise par les " +
      "équipes. Quatre questions pour trancher : Horizon (jours ou années ?), " +
      "Réversibilité (retour en arrière à faible coût ?), Ampleur (part importante de " +
      "l'argent, du temps ou des talents ?), Position (change-t-elle ce que l'on offre, " +
      "à qui, ou face à quels concurrents ?). Plus les réponses penchent vers " +
      "« longtemps, difficile, beaucoup, oui », plus la décision est stratégique. " +
      "L'urgence ne dit rien de l'importance.",
  },
};

/** Atelier par identifiant complet, ou null s'il n'existe pas. */
export function atelierParId(id: unknown): AtelierIA | null {
  if (typeof id !== "string") return null;
  return Object.hasOwn(ATELIERS, id) ? ATELIERS[id] : null;
}

// ==================== VALIDATION DE LA SAISIE ====================

export type Saisie = Record<string, string>;

/**
 * Valide la saisie de l'apprenant (non fiable) selon les champs de l'atelier.
 * @param atelier - Atelier concerné
 * @param brut    - Saisie reçue du navigateur
 * @returns Saisie nettoyée (espaces retirés), ou null si un champ manque ou déborde
 */
export function validerSaisie(atelier: AtelierIA, brut: unknown): Saisie | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const source = brut as Record<string, unknown>;
  const saisie: Saisie = {};
  for (const champ of atelier.champs) {
    const valeur = source[champ.id];
    if (typeof valeur !== "string") return null;
    const propre = valeur.trim();
    if (champ.type === "choix") {
      if (!champ.options.some((o) => o.valeur === propre)) return null;
    } else if (propre.length < champ.min || propre.length > champ.max) {
      return null;
    }
    saisie[champ.id] = propre;
  }
  return saisie;
}

// ==================== CORRECTION ====================

const VERDICTS = ["valide", "partiel", "a-corriger"] as const;
const STATUTS = ["juste", "a-revoir"] as const;

/** Réponse brute attendue du modèle (sans bornes : voir l'en-tête). */
export const correctionSchema = z.object({
  verdict: z.enum(VERDICTS),
  resume: z.string(),
  famille_attendue: z.enum(["strategique", "tactique", "operationnelle"]),
  points: z.array(
    z.object({
      champ: z.string(),
      statut: z.enum(STATUTS),
      explication: z.string(),
    }),
  ),
  conseil: z.string(),
});

export type CorrectionBrute = z.infer<typeof correctionSchema>;

/** Correction nettoyée, telle qu'enregistrée et affichée. */
export type CorrectionAtelier = {
  verdict: (typeof VERDICTS)[number];
  resume: string;
  familleAttendue: string;
  points: { champ: string; statut: (typeof STATUTS)[number]; explication: string }[];
  conseil: string;
};

/** Correction passée, affichée sous l'atelier (la plus récente en premier). */
export type HistoriqueAtelier = {
  id: string;
  saisie: Saisie;
  correction: CorrectionAtelier;
  creeLe: string;
};

/** Tronque un texte à n caractères, espaces retirés. */
const couper = (texte: unknown, n: number): string =>
  typeof texte === "string" ? texte.trim().slice(0, n) : "";

/**
 * Nettoie la correction du modèle : longueurs bornées, champs inconnus écartés.
 * @param atelier - Atelier corrigé (champs connus)
 * @param brut    - Sortie validée par le schéma
 * @returns Correction prête à enregistrer
 */
export function assainirCorrection(
  atelier: AtelierIA,
  brut: CorrectionBrute,
): CorrectionAtelier {
  const connus = new Set(atelier.champs.map((c) => c.id));
  const points = brut.points
    .filter((p) => connus.has(p.champ))
    .slice(0, MAX_POINTS)
    .map((p) => ({
      champ: p.champ,
      statut: p.statut,
      explication: couper(p.explication, MAX_EXPLICATION),
    }))
    .filter((p) => p.explication.length > 0);
  return {
    verdict: brut.verdict,
    resume: couper(brut.resume, MAX_RESUME),
    familleAttendue: brut.famille_attendue,
    points,
    conseil: couper(brut.conseil, MAX_CONSEIL),
  };
}

/**
 * Relit une correction enregistrée (colonne jsonb) ; null si sa forme est inattendue.
 * @param valeur - Contenu de la colonne output
 */
export function lireCorrection(valeur: unknown): CorrectionAtelier | null {
  if (typeof valeur !== "object" || valeur === null) return null;
  const c = valeur as Partial<CorrectionAtelier>;
  if (!VERDICTS.includes(c.verdict as (typeof VERDICTS)[number])) return null;
  if (typeof c.resume !== "string" || !Array.isArray(c.points)) return null;
  return {
    verdict: c.verdict as CorrectionAtelier["verdict"],
    resume: c.resume,
    familleAttendue: typeof c.familleAttendue === "string" ? c.familleAttendue : "",
    points: c.points.filter(
      (p) =>
        typeof p?.champ === "string" &&
        typeof p?.explication === "string" &&
        STATUTS.includes(p?.statut),
    ),
    conseil: typeof c.conseil === "string" ? c.conseil : "",
  };
}
