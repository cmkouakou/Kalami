/**
 * =============================================================
 *  Fichier    : modules.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Programme du cours : 13 modules, 52 leçons (strategie/PROGRAMME.md).
 *               Chaque leçon a un identifiant stable « mXX-lYY » utilisé en base
 *               (progression, temps, annotations). Une leçon sans contenu rédigé est
 *               affichée « bientôt » : le programme complet reste visible.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/strategy/steps.ts
 * =============================================================
 */

import type { StepNo } from "@/lib/strategy/steps";

// ==================== TYPES ====================

export type LeconInfo = {
  /** Identifiant stable en base : « m01-l01 ». */
  id: string;
  /** Segment d'adresse : « l1 ». */
  slug: string;
  numero: number;
  titre: string;
  /** Durée estimée en minutes. */
  minutes: number;
};

export type ModuleInfo = {
  /** Identifiant stable : « m01 ». */
  id: string;
  /** Segment d'adresse : « m1 ». */
  slug: string;
  numero: number;
  titre: string;
  /** Chapitre du livre correspondant. */
  chapitreLivre: string;
  /** Étape de Kalami Stratégie la plus proche (null : aucune). */
  etape: StepNo | null;
  lecons: LeconInfo[];
};

// ==================== PROGRAMME ====================

/** Titres des leçons par module, dans l'ordre (durée par défaut : 18 min). */
const PROGRAMME: {
  titre: string;
  chapitre: string;
  etape: StepNo | null;
  lecons: string[];
}[] = [
  {
    titre: "Les fondements",
    chapitre: "1",
    etape: null,
    lecons: [
      "Qu'est-ce qu'une stratégie ? Choisir, c'est renoncer",
      "Est-ce une question de stratégie ? Stratégique, tactique, opérationnel",
      "Les trois niveaux : corporatif, d'affaires, fonctionnel",
      "La démarche d'analyse stratégique en une page",
      "Bonne ou mauvaise stratégie ?",
    ],
  },
  {
    titre: "Le macroenvironnement",
    chapitre: "2",
    etape: 1,
    lecons: [
      "Ce que l'entreprise ne contrôle pas",
      "Le PESTEL, sans en faire une liste d'épicerie",
      "Des facteurs aux variables pivots",
      "Construire trois scénarios",
    ],
  },
  {
    titre: "L'industrie et la concurrence",
    chapitre: "3",
    etape: 2,
    lecons: [
      "Les cinq forces, et la sixième",
      "Barrières à l'entrée et cycle de vie d'une industrie",
      "Concurrent ou substitut : qui sont vos rivaux ?",
      "Facteurs clés de succès et comparaison",
    ],
  },
  {
    titre: "L'analyse interne",
    chapitre: "4",
    etape: 3,
    lecons: [
      "Ressources, compétences et capacités stratégiques",
      "La chaîne de valeur",
      "Le VRIO : vers l'avantage concurrentiel durable",
      "Lire la santé financière : cinq ratios qui comptent",
      "Les capacités dynamiques",
    ],
  },
  {
    titre: "La SWOT et la TOWS",
    chapitre: "5",
    etape: 5,
    lecons: [
      "Bien remplir une SWOT",
      "De la SWOT à l'action : la matrice TOWS",
      "Formuler les enjeux stratégiques",
    ],
  },
  {
    titre: "Parties prenantes, culture et responsabilité",
    chapitre: "6",
    etape: 4,
    lecons: [
      "Qui a son mot à dire ? La matrice pouvoir-intérêt",
      "Une stratégie d'engagement pour chaque groupe",
      "Gouvernance et responsabilité sociale",
      "Culture organisationnelle et dérive stratégique",
    ],
  },
  {
    titre: "Vision, mission, valeurs, objectifs",
    chapitre: "7",
    etape: 6,
    lecons: [
      "L'intention stratégique",
      "Vision et mission : ne plus les confondre",
      "Valeurs et objectifs SMART",
    ],
  },
  {
    titre: "La stratégie concurrentielle",
    chapitre: "8.2",
    etape: 7,
    lecons: [
      "Domaines d'activité stratégique : sur quel terrain se battre ?",
      "Les stratégies génériques de Porter",
      "La différenciation qui tient",
      "L'horloge stratégique",
      "Le modèle d'affaires",
    ],
  },
  {
    titre: "La stratégie corporative",
    chapitre: "8.3",
    etape: 7,
    lecons: [
      "La matrice d'Ansoff : où croître ?",
      "Diversification liée et non liée",
      "Intégration verticale et horizontale",
      "Gérer un portefeuille : la matrice BCG",
      "Aller à l'international",
    ],
  },
  {
    titre: "L'innovation",
    chapitre: "8.6",
    etape: 7,
    lecons: [
      "Innover de l'intérieur : l'intrapreneuriat",
      "La diffusion de l'innovation",
      "Pionnier ou suiveur ?",
      "Le dilemme de l'innovateur et les ruptures",
    ],
  },
  {
    titre: "Les modes de croissance",
    chapitre: "8.4",
    etape: 7,
    lecons: [
      "Croître seul : la croissance interne",
      "Fusions et acquisitions : promesses et pièges",
      "Alliances, partenariats et coentreprises",
    ],
  },
  {
    titre: "Choisir, mettre en œuvre, suivre",
    chapitre: "8.5 et 9",
    etape: 8,
    lecons: [
      "Évaluer les options : pertinence, acceptabilité, faisabilité",
      "Là où les stratégies échouent",
      "La feuille de route et le tableau de bord équilibré",
      "Le suivi : un rendez-vous, pas un rapport",
    ],
  },
  {
    titre: "Cas intégrateur",
    chapitre: "10 et 11",
    etape: 9,
    lecons: [
      "Le plan stratégique d'Infosystem en une page",
      "Le cas Ajinomoto Afrique de l'Ouest",
      "Votre propre plan dans Kalami Stratégie",
    ],
  },
];

/** Durée estimée d'une leçon, en minutes. */
const MINUTES_PAR_LECON = 18;

/** Complète un nombre sur deux chiffres. */
const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** Programme complet, construit une fois. */
export const MODULES: readonly ModuleInfo[] = PROGRAMME.map((m, i) => {
  const numero = i + 1;
  const id = `m${deuxChiffres(numero)}`;
  return {
    id,
    slug: `m${numero}`,
    numero,
    titre: m.titre,
    chapitreLivre: m.chapitre,
    etape: m.etape,
    lecons: m.lecons.map((titre, j) => ({
      id: `${id}-l${deuxChiffres(j + 1)}`,
      slug: `l${j + 1}`,
      numero: j + 1,
      titre,
      minutes: MINUTES_PAR_LECON,
    })),
  };
});

/** Toutes les leçons, dans l'ordre du cours. */
export const LECONS: readonly LeconInfo[] = MODULES.flatMap((m) => m.lecons);

// ==================== RECHERCHE ====================

/** Module et leçon d'après les segments d'adresse ; null si inconnus. */
export function trouverLecon(
  moduleSlug: string,
  leconSlug: string,
): { module: ModuleInfo; lecon: LeconInfo } | null {
  const mod = MODULES.find((m) => m.slug === moduleSlug);
  const lecon = mod?.lecons.find((l) => l.slug === leconSlug);
  return mod && lecon ? { module: mod, lecon } : null;
}

/** Module et leçon d'après l'identifiant stable « m01-l02 » ; null si inconnu. */
export function leconParId(
  id: string,
): { module: ModuleInfo; lecon: LeconInfo } | null {
  for (const mod of MODULES) {
    const lecon = mod.lecons.find((l) => l.id === id);
    if (lecon) return { module: mod, lecon };
  }
  return null;
}

/** Adresse d'une leçon. */
export function adresseLecon(mod: ModuleInfo, lecon: LeconInfo): string {
  return `/strategie/cours/${mod.slug}/${lecon.slug}`;
}

/** Leçons précédente et suivante dans l'ordre du cours. */
export function voisines(id: string): {
  avant: LeconInfo | null;
  apres: LeconInfo | null;
} {
  const i = LECONS.findIndex((l) => l.id === id);
  if (i === -1) return { avant: null, apres: null };
  return { avant: LECONS[i - 1] ?? null, apres: LECONS[i + 1] ?? null };
}
